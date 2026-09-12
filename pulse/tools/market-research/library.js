/* ================================================================
   ==============   GLOBAL RESEARCH LIBRARY   ===================
   ================================================================
   Cross-market documents (platform reports, regulatory articles,
   general notes) that do not belong to a single country.

   System of record: Neon via /api/library.
   localStorage caches the INDEX only — never document bodies.

   Loaded after app.js, so it reuses that file's helpers:
   claudeComplete, assertClaudeProxyReady, fileToBase64, safeParseJSON,
   renderMarkdown, escapeHtml, callClaude, openModal, closeModal. */

const LIBRARY_STORAGE_KEY = 'phaeron_library_v1';
const LIBRARY_MAX_TOKENS = 8000;
// Full text of matched documents injected into a chat turn.
const LIBRARY_CHAR_BUDGET = 60000;
const LIBRARY_TOP_K = 3;

let GLOBAL_DOCS = [];            // index rows, no body_md
let DOC_BODY_CACHE = {};         // id -> body_md (memory only)
let LIB_DB_OK = null;            // null=unknown, true/false after first attempt
let LIB_FILTER = '';
let LIB_READING_ID = null;       // doc whose full text is expanded
let LIB_QUEUE_CANCELLED = false;

/* ---------------- persistence ---------------- */

function cacheLibraryLocally(){
  if(!STORAGE_OK) return;
  try{
    window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify({
      docs: GLOBAL_DOCS, savedAt: new Date().toISOString()
    }));
  }catch(_){ /* quota — index cache is best-effort */ }
}

function loadLibraryFromCache(){
  if(!STORAGE_OK) return false;
  try{
    const raw = window.localStorage.getItem(LIBRARY_STORAGE_KEY);
    if(!raw) return false;
    const saved = JSON.parse(raw);
    if(saved && Array.isArray(saved.docs)){ GLOBAL_DOCS = saved.docs; return true; }
  }catch(_){}
  return false;
}

async function loadLibrary(){
  try{
    const res = await fetch('/api/library', { headers:{ 'Accept':'application/json' } });
    const ctype = (res.headers.get('content-type')||'').toLowerCase();
    if(!res.ok || !ctype.includes('json')){ LIB_DB_OK=false; loadLibraryFromCache(); renderLibrary(); return false; }
    const body = await res.json();
    if(body && body.error){ LIB_DB_OK=false; loadLibraryFromCache(); renderLibrary(); return false; }
    GLOBAL_DOCS = Array.isArray(body.docs) ? body.docs : [];
    LIB_DB_OK = true;
    cacheLibraryLocally();
    renderLibrary();
    return true;
  }catch(_){
    LIB_DB_OK=false;
    loadLibraryFromCache();
    renderLibrary();
    return false;
  }
}

/** Fetch and cache body_md for the given doc ids. Returns id -> body_md. */
async function fetchDocBodies(ids){
  const want = (ids||[]).map(Number).filter(id=>Number.isFinite(id) && !(id in DOC_BODY_CACHE));
  if(want.length){
    const res = await fetch('/api/library?ids='+encodeURIComponent(want.join(',')), {
      headers:{ 'Accept':'application/json' }
    });
    const ctype = (res.headers.get('content-type')||'').toLowerCase();
    if(!res.ok || !ctype.includes('json')) throw new Error('Could not load document text');
    const body = await res.json();
    (body.docs||[]).forEach(d=>{ if(d && d.body_md!=null) DOC_BODY_CACHE[d.id]=d.body_md; });
  }
  const out={};
  (ids||[]).forEach(id=>{ if(DOC_BODY_CACHE[id]!=null) out[id]=DOC_BODY_CACHE[id]; });
  return out;
}

async function saveDoc(doc){
  const res = await fetch('/api/library', {
    method:'PUT',
    headers:{ 'content-type':'application/json' },
    body: JSON.stringify({ doc })
  });
  const ctype = (res.headers.get('content-type')||'').toLowerCase();
  if(!res.ok || !ctype.includes('json')){
    throw new Error('Library save failed (HTTP '+res.status+'). The database may be unreachable.');
  }
  const body = await res.json();
  if(body && body.error) throw new Error(body.error.message||'Library save failed');
  GLOBAL_DOCS = Array.isArray(body.docs) ? body.docs : GLOBAL_DOCS;
  if(body.doc && doc.body_md) DOC_BODY_CACHE[body.doc.id]=doc.body_md;
  LIB_DB_OK = true;
  cacheLibraryLocally();
  renderLibrary();
  return body.doc;
}

async function deleteDoc(id){
  const res = await fetch('/api/library?id='+encodeURIComponent(id), { method:'DELETE' });
  const ctype = (res.headers.get('content-type')||'').toLowerCase();
  if(!res.ok || !ctype.includes('json')) throw new Error('Delete failed (HTTP '+res.status+')');
  const body = await res.json();
  if(body && body.error) throw new Error(body.error.message||'Delete failed');
  GLOBAL_DOCS = Array.isArray(body.docs) ? body.docs : GLOBAL_DOCS;
  delete DOC_BODY_CACHE[id];
  cacheLibraryLocally();
  renderLibrary();
}

/* ---------------- upload → Claude ---------------- */

const LIBRARY_SYSTEM_PROMPT = `You catalogue market-intelligence documents for Phaeron's Global Order-Routing Atlas.

You receive one document: a research report, platform study, regulatory article, news piece or internal note. It is GLOBAL or CROSS-MARKET material — it is not filed against a single country.

Return EXACTLY two blocks in this order and nothing else.

Block 1 — metadata, opening with the marker on its own line:
===FIELDS===
{
  "title": "the document's real title, or a precise descriptive one if untitled",
  "doc_type": "report | article | note | regulation",
  "publisher": "issuing organisation, or empty string",
  "published_at": "date or period as printed, e.g. 'March 2025' or '2025-03-14'; empty string if absent",
  "summary": "at most 150 words: what this document is and what it establishes",
  "key_insights": ["5 to 10 findings that matter for fund distribution and order routing; keep every figure, percentage and currency amount exactly as printed"],
  "tags": ["3 to 8 lowercase topic tags, e.g. 'distribution', 'etf', 'regulation', 'platforms'"],
  "iso3_tags": ["ISO3 code for every market the document covers materially, e.g. LUX, IRL, DEU. Empty array if it is purely global."]
}

Block 2 — the working text, opening with the marker on its own line:
===BODY===
A structured Markdown digest of everything in the document relevant to fund distribution, order routing, automation/manuality, platforms and intermediaries, regulation, AUM and flows, and competitive landscape.

Rules for the body:
- Use ## headings that follow the document's own structure.
- Reproduce every figure, percentage, ranking and currency amount verbatim. Never round, never approximate, never invent.
- Keep tabular data as Markdown tables.
- Preserve named entities: platforms, distributors, regulators, hubs, funds, companies.
- Omit marketing copy, disclaimers, author biographies and page furniture.
- Do not summarise the body — it is the retrieval text the assistant quotes from. Be comprehensive.
- If the document states something as an estimate or forecast, say so inline.

Output the metadata JSON first so it survives even if the body is long. No preamble, no commentary, no code fences around the whole response.`;

function parseLibraryResponse(text){
  const t = String(text||'');
  const fIdx = t.indexOf('===FIELDS===');
  const bIdx = t.indexOf('===BODY===');
  if(fIdx < 0 || bIdx < 0 || bIdx < fIdx){
    // No markers — treat everything as body and let the user title it.
    return { fields:{}, body: t.replace(/```/g,'').trim() };
  }
  const fieldsRaw = t.slice(fIdx + '===FIELDS==='.length, bIdx);
  // Trim before stripping fences — the slice starts with the marker's newline.
  const body = t.slice(bIdx + '===BODY==='.length).trim()
    .replace(/^```(?:markdown|md)?\s*\n?/i,'')
    .replace(/\n?```\s*$/,'')
    .trim();
  return { fields: safeParseJSON(fieldsRaw) || {}, body };
}

function normalizeDocFields(fields, file){
  const f = fields && typeof fields==='object' ? fields : {};
  const arr = v => Array.isArray(v) ? v.map(x=>String(x||'').trim()).filter(Boolean) : [];
  const types = ['report','article','note','regulation'];
  const type = String(f.doc_type||'').toLowerCase();
  return {
    title: String(f.title||'').trim() || (file ? file.name.replace(/\.[^.]+$/,'') : 'Untitled document'),
    doc_type: types.includes(type) ? type : 'report',
    publisher: String(f.publisher||'').trim(),
    published_at: String(f.published_at||'').trim(),
    source_name: file ? file.name : '',
    summary: String(f.summary||'').trim(),
    key_insights: arr(f.key_insights),
    tags: arr(f.tags).map(s=>s.toLowerCase()),
    iso3_tags: arr(f.iso3_tags).map(s=>s.toUpperCase()).filter(s=>/^[A-Z]{3}$/.test(s))
  };
}

function setLibStatus(msg, cls){
  const s = document.getElementById('libStatus');
  if(!s) return;
  s.textContent = msg||'';
  s.className = 'dz-status'+(cls?(' '+cls):'');
}

async function handleLibraryUpload(file){
  if(!file) return;
  const isPdf = /\.pdf$/i.test(file.name);
  const isText = /\.(md|markdown|txt)$/i.test(file.name);
  if(!isPdf && !isText){ setLibStatus('Please drop a Markdown (.md), text, or PDF file.', 'err'); return; }
  if(isPdf && file.size > MAX_PDF_BYTES){
    setLibStatus('PDF is too large for the upload proxy (~3MB max due to Vercel request limits). Split it or upload a Markdown extract.', 'err');
    return;
  }

  setLibStatus('Reading file…', 'work');
  let content;
  try{
    if(isPdf){
      const b64 = await fileToBase64(file);
      content = [
        { type:'text', text:'Catalogue the attached document. It is global / cross-market material for the Atlas library.' },
        { type:'document', source:{ type:'base64', media_type:'application/pdf', data:b64 } }
      ];
    } else {
      const txt = await file.text();
      if(txt.length > MAX_TEXT_CHARS){
        setLibStatus('Text file is extremely large — using the first '+MAX_TEXT_CHARS.toLocaleString()+' characters.', 'work');
      }
      content = 'Catalogue this document. It is global / cross-market material for the Atlas library.\n\nFILENAME: '+file.name+'\n\nDOCUMENT:\n'+txt.slice(0, MAX_TEXT_CHARS);
    }
  }catch(_){ setLibStatus('Could not read the file.', 'err'); return; }

  setLibStatus('Asking Claude to read and catalogue the document…', 'work');
  try{
    await assertClaudeProxyReady();
    const { text, truncated } = await claudeComplete({
      system: LIBRARY_SYSTEM_PROMPT,
      userContent: content,
      maxTokens: LIBRARY_MAX_TOKENS,
      onProgress: msg => setLibStatus(msg, 'work')
    });
    const parsed = parseLibraryResponse(text);
    if(!parsed.body.trim()){
      throw new Error(truncated
        ? 'Claude ran out of room before returning the document text. Try splitting the file.'
        : 'Claude did not return any usable document text. Try again.');
    }
    setLibStatus('', '');
    openModal({
      __mode:'library',
      __truncated: truncated,
      summary: 'Review this document before adding it to the global library.',
      doc: { ...normalizeDocFields(parsed.fields, file), body_md: parsed.body }
    }, null);
  }catch(err){
    setLibStatus('Error: '+(err.message||'request failed'), 'err');
  }
}

/* ---------------- approval modal hooks (called from app.js) ---------------- */

function libraryModalCardHtml(doc, truncated){
  const insights = (doc.key_insights||[]).slice(0,10)
    .map(x=>`<li>${escapeHtml(x)}</li>`).join('');
  const warn = truncated
    ? `<div class="lib-warn">⚠ The document text may be cut off (long source). Review before saving.</div>` : '';
  const thin = (doc.body_md||'').length < 800
    ? `<div class="lib-warn">⚠ Only ${(doc.body_md||'').length} characters of text were extracted — the assistant will have little to quote. Check the source read correctly.</div>` : '';
  return `
    ${warn}${thin}
    <div class="edit-card">
      <div class="ec-top"><span class="ec-action">new</span><span class="ec-section">Global library document</span></div>
      <div class="lib-field"><label for="libTitle">Title</label>
        <input id="libTitle" type="text" value="${escapeHtml(doc.title)}" /></div>
      <div class="lib-field-row">
        <div class="lib-field"><label for="libType">Type</label>
          <select id="libType">
            ${['report','article','note','regulation'].map(t=>
              `<option value="${t}"${t===doc.doc_type?' selected':''}>${t}</option>`).join('')}
          </select></div>
        <div class="lib-field"><label for="libPublisher">Publisher</label>
          <input id="libPublisher" type="text" value="${escapeHtml(doc.publisher)}" /></div>
        <div class="lib-field"><label for="libDate">Published</label>
          <input id="libDate" type="text" value="${escapeHtml(doc.published_at)}" /></div>
      </div>
      <div class="lib-field"><label for="libMarkets">Markets covered (ISO3, comma separated — leave blank for purely global)</label>
        <input id="libMarkets" type="text" value="${escapeHtml((doc.iso3_tags||[]).join(', '))}" /></div>
      <div class="lib-field"><label for="libTags">Topic tags</label>
        <input id="libTags" type="text" value="${escapeHtml((doc.tags||[]).join(', '))}" /></div>
      <div style="font-size:12px;color:var(--ink-2);margin:12px 0 6px;font-weight:600">Summary</div>
      <div class="ec-content">${escapeHtml(doc.summary||'(none)')}</div>
      ${insights ? `<div style="font-size:12px;color:var(--ink-2);margin:12px 0 6px;font-weight:600">Key insights</div>
        <ul class="lib-insights">${insights}</ul>` : ''}
      <div style="font-size:12px;color:var(--ink-2);margin:12px 0 6px;font-weight:600">Extracted text · ${(doc.body_md||'').length.toLocaleString()} characters</div>
      <div class="ec-content">${escapeHtml((doc.body_md||'').slice(0,1400))}${(doc.body_md||'').length>1400?'\n…':''}</div>
      <label class="ec-check"><input type="checkbox" id="libcheck" checked> Add this document to the global library</label>
    </div>`;
}

/** Read the modal's edited fields back onto the pending doc and save it. */
async function applyLibraryPending(pending){
  const check = document.getElementById('libcheck');
  if(check && !check.checked) return false;
  const val = id => { const el=document.getElementById(id); return el ? el.value.trim() : ''; };
  const list = id => val(id).split(',').map(s=>s.trim()).filter(Boolean);
  const doc = {
    ...pending.doc,
    title: val('libTitle') || pending.doc.title,
    doc_type: val('libType') || pending.doc.doc_type,
    publisher: val('libPublisher'),
    published_at: val('libDate'),
    iso3_tags: list('libMarkets').map(s=>s.toUpperCase()).filter(s=>/^[A-Z]{3}$/.test(s)),
    tags: list('libTags').map(s=>s.toLowerCase()),
    source: 'claude'
  };
  const saved = await saveDoc(doc);
  openLibrary();
  setLibStatus('Added "'+doc.title+'" to the library.', 'ok');
  if(saved && saved.iso3_tags && saved.iso3_tags.length){
    setLibStatus('Added "'+doc.title+'". It covers '+saved.iso3_tags.length+' market'+(saved.iso3_tags.length===1?'':'s')+' — use "Apply to markets" to push detail into those country notes.', 'ok');
  }
  return true;
}

/* ---------------- panel UI ---------------- */

function docsForCountry(iso3){
  const code = String(iso3||'').toUpperCase();
  if(!code) return [];
  return GLOBAL_DOCS.filter(d => (d.iso3_tags||[]).includes(code));
}

function docMatchesFilter(d, q){
  if(!q) return true;
  const hay = [d.title, d.publisher, d.summary, (d.tags||[]).join(' '), (d.iso3_tags||[]).join(' '), d.doc_type]
    .join(' ').toLowerCase();
  return hay.includes(q);
}

function docMetaLine(d){
  const parts = [d.doc_type];
  if(d.publisher) parts.push(d.publisher);
  if(d.published_at) parts.push(d.published_at);
  if(d.char_count) parts.push(Math.round(d.char_count/1000)+'k chars');
  return parts.map(escapeHtml).join(' · ');
}

function renderLibrary(){
  const list = document.getElementById('libList');
  const count = document.getElementById('libCount');
  if(count){
    count.textContent = GLOBAL_DOCS.length ? String(GLOBAL_DOCS.length) : '';
    count.style.display = GLOBAL_DOCS.length ? '' : 'none';
  }
  if(!list) return;

  if(!GLOBAL_DOCS.length){
    list.innerHTML = LIB_DB_OK === false
      ? `<div class="lib-empty">The library database is unreachable from here. Run <b>npm run dev</b> or open the deployed app to add and read global documents.</div>`
      : `<div class="lib-empty">No global documents yet. Drop a PDF, Markdown or text file above — Claude reads it, and the Atlas Assistant can then quote it in any conversation.</div>`;
    return;
  }

  const q = LIB_FILTER.trim().toLowerCase();
  const shown = GLOBAL_DOCS.filter(d=>docMatchesFilter(d,q));
  if(!shown.length){
    list.innerHTML = `<div class="lib-empty">No documents match “${escapeHtml(LIB_FILTER)}”.</div>`;
    return;
  }

  list.innerHTML = shown.map(d=>{
    const markets = (d.iso3_tags||[]).map(c=>`<span class="lib-chip market">${escapeHtml(c)}</span>`).join('');
    const tags = (d.tags||[]).map(t=>`<span class="lib-chip">${escapeHtml(t)}</span>`).join('');
    const insights = (d.key_insights||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('');
    const reading = LIB_READING_ID === d.id;
    const bodyHtml = reading
      ? (DOC_BODY_CACHE[d.id] != null
          ? `<div class="lib-body md-note">${renderMarkdown(DOC_BODY_CACHE[d.id])}</div>`
          : `<div class="lib-body loading">Loading document text…</div>`)
      : '';
    return `
      <div class="lib-card" data-id="${d.id}">
        <div class="lib-card-head">
          <div class="lib-title">${escapeHtml(d.title)}</div>
          <button class="lib-x" data-lib-action="delete" data-id="${d.id}" title="Delete this document">×</button>
        </div>
        <div class="lib-meta">${docMetaLine(d)}</div>
        ${(markets||tags) ? `<div class="lib-chips">${markets}${tags}</div>` : ''}
        ${d.summary ? `<div class="lib-summary">${escapeHtml(d.summary)}</div>` : ''}
        ${insights ? `<ul class="lib-insights">${insights}</ul>` : ''}
        <div class="lib-actions">
          <button class="btn-note" data-lib-action="read" data-id="${d.id}">${reading?'Hide full text':'Read full text'}</button>
          ${(d.iso3_tags||[]).length ? `<button class="btn-note" data-lib-action="markets" data-id="${d.id}">Apply to ${d.iso3_tags.length} market${d.iso3_tags.length===1?'':'s'}</button>` : ''}
        </div>
        ${bodyHtml}
      </div>`;
  }).join('');
}

function openLibrary(docId){
  const veil = document.getElementById('libVeil');
  if(!veil) return;
  if(docId){ LIB_READING_ID = null; LIB_FILTER = ''; const f=document.getElementById('libFilter'); if(f) f.value=''; }
  veil.classList.add('open');
  renderLibrary();
  if(docId){
    const card = document.querySelector('.lib-card[data-id="'+docId+'"]');
    if(card){ card.scrollIntoView({block:'center'}); card.classList.add('flash'); setTimeout(()=>card.classList.remove('flash'),1200); }
  }
}
function closeLibrary(){
  const veil = document.getElementById('libVeil');
  if(veil) veil.classList.remove('open');
}
window.openLibrary = openLibrary;
window.closeLibrary = closeLibrary;

async function toggleDocBody(id){
  if(LIB_READING_ID === id){ LIB_READING_ID = null; renderLibrary(); return; }
  LIB_READING_ID = id;
  renderLibrary();
  try{
    await fetchDocBodies([id]);
  }catch(err){
    setLibStatus('Could not load the document text: '+(err.message||''), 'err');
  }
  if(LIB_READING_ID === id) renderLibrary();
}

/* ---------------- push a global doc into country notes ---------------- */

/** Resolves when the approval modal is dismissed (applied or cancelled). */
let LIB_MODAL_WAIT = null;
function openModalAndWait(proposal, iso){
  return new Promise(resolve=>{
    LIB_MODAL_WAIT = resolve;
    openModal(proposal, iso);
  });
}
// Called from app.js closeModal().
function resolveLibraryModalWait(){
  if(LIB_MODAL_WAIT){ const r=LIB_MODAL_WAIT; LIB_MODAL_WAIT=null; r(); }
}
window.resolveLibraryModalWait = resolveLibraryModalWait;

async function applyDocToMarkets(id){
  const doc = GLOBAL_DOCS.find(d=>d.id===id);
  if(!doc || !(doc.iso3_tags||[]).length) return;
  const markets = doc.iso3_tags;
  if(!confirm('Run Claude over "'+doc.title+'" for '+markets.length+' market'+(markets.length===1?'':'s')+' ('+markets.join(', ')+')?\n\nYou approve each market’s changes in turn.')) return;

  LIB_QUEUE_CANCELLED = false;
  let body;
  try{
    setLibStatus('Loading document text…', 'work');
    body = (await fetchDocBodies([id]))[id];
  }catch(err){ setLibStatus('Could not load the document text: '+(err.message||''), 'err'); return; }
  if(!body){ setLibStatus('This document has no stored text.', 'err'); return; }

  for(let i=0;i<markets.length;i++){
    if(LIB_QUEUE_CANCELLED){ setLibStatus('Stopped — '+i+' of '+markets.length+' markets processed.', 'ok'); return; }
    const iso = markets[i];
    const label = 'Market '+(i+1)+' of '+markets.length+' — '+iso+': ';
    try{
      const current = (COUNTRY_MARKDOWN[iso]||'').slice(0,120000);
      const proposal = await callClaude(
        iso, current,
        { kind:'text', text: body, name: doc.title },
        !current.trim(),
        msg => setLibStatus(label+msg, 'work')
      );
      setLibStatus(label+'review the proposed changes.', 'work');
      closeLibrary();
      await openModalAndWait(proposal, iso);
      openLibrary();
    }catch(err){
      setLibStatus(label+'failed — '+(err.message||'request failed'), 'err');
      if(!confirm('“'+iso+'” failed: '+(err.message||'request failed')+'\n\nContinue with the remaining markets?')) return;
    }
  }
  setLibStatus('Finished — all '+markets.length+' markets reviewed.', 'ok');
}

/* ---------------- chatbot retrieval ---------------- */

const LIB_STOPWORDS = new Set(('a an and are as at be by for from has have how in into is it its of on or that the their there these this to was what when where which who why with you your about across between over under most more least than then any all can could should would does do'.split(' ')));

function libTokens(s){
  return String(s||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/)
    .filter(w=>w.length>2 && !LIB_STOPWORDS.has(w));
}

/** Compact index of every library document — always sent to the assistant. */
function libraryIndexBlock(){
  if(!GLOBAL_DOCS.length) return '';
  const rows = GLOBAL_DOCS.map(d=>{
    const markets = (d.iso3_tags||[]).length ? ' · markets: '+d.iso3_tags.join(', ') : ' · global';
    const tags = (d.tags||[]).length ? ' · tags: '+d.tags.join(', ') : '';
    const meta = [d.publisher, d.published_at].filter(Boolean).join(', ');
    return `- [${d.id}] ${d.title}${meta?' ('+meta+')':''}${markets}${tags} — ${d.summary||'(no summary)'}`;
  });
  return 'GLOBAL RESEARCH LIBRARY — cross-market documents uploaded to this app:\n'+rows.join('\n');
}

/** Score docs against the question and return the full text of the best matches. */
async function libraryMatchBlock(question){
  if(!GLOBAL_DOCS.length) return '';
  const qTokens = libTokens(question);
  const isoMentions = (String(question||'').toUpperCase().match(/\b[A-Z]{3}\b/g)||[]);
  if(!qTokens.length) return '';

  const scored = GLOBAL_DOCS.map(d=>{
    const strong = new Set(libTokens(d.title).concat((d.tags||[]).map(t=>t.toLowerCase())));
    const weak = new Set(libTokens(d.summary+' '+(d.key_insights||[]).join(' ')));
    let score = 0;
    qTokens.forEach(t=>{
      if(strong.has(t)) score += 3;
      else if(weak.has(t)) score += 1;
    });
    (d.iso3_tags||[]).forEach(c=>{ if(isoMentions.includes(c)) score += 3; });
    // Country names mentioned by the question, mapped through the app's own table.
    Object.entries(NAME_TO_ISO).forEach(([name,iso])=>{
      if((d.iso3_tags||[]).includes(iso) && String(question||'').toLowerCase().includes(name.toLowerCase())) score += 3;
    });
    return { d, score };
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0, LIBRARY_TOP_K);

  if(!scored.length) return '';

  const bodies = await fetchDocBodies(scored.map(x=>x.d.id));
  const blocks = [];
  let budget = LIBRARY_CHAR_BUDGET;
  for(const { d } of scored){
    const body = bodies[d.id];
    if(!body || budget <= 500) continue;
    const meta = [d.publisher, d.published_at].filter(Boolean).join(', ');
    const slice = body.length > budget ? body.slice(0, budget)+'\n…[truncated]' : body;
    budget -= slice.length;
    blocks.push(`GLOBAL RESEARCH DOCUMENT — ${d.title}${meta?' ('+meta+')':''}\n${slice}`);
  }
  return blocks.length ? blocks.join('\n\n---\n\n') : '';
}

/** Full system-prompt addendum for one chat turn. Never throws. */
async function libraryChatContext(question){
  try{
    const index = libraryIndexBlock();
    const matched = await libraryMatchBlock(question);
    return [index, matched].filter(Boolean).join('\n\n');
  }catch(err){
    console.warn('library retrieval failed', err);
    try{ return libraryIndexBlock(); }catch(_){ return ''; }
  }
}
window.libraryChatContext = libraryChatContext;

/* ---------------- wiring ---------------- */

(function initLibrary(){
  const btn = document.getElementById('libraryBtn');
  const veil = document.getElementById('libVeil');
  if(!veil) return;

  if(btn) btn.addEventListener('click', ()=>{
    const open = veil.classList.contains('open');
    if(open) closeLibrary(); else openLibrary();
  });
  const closeBtn = document.getElementById('libClose');
  if(closeBtn) closeBtn.addEventListener('click', closeLibrary);
  veil.addEventListener('click', e=>{ if(e.target.id==='libVeil') closeLibrary(); });

  const filter = document.getElementById('libFilter');
  if(filter) filter.addEventListener('input', ()=>{ LIB_FILTER = filter.value; renderLibrary(); });

  // Dropzone — same interaction as the country drawer's.
  const dz = document.getElementById('libDropzone');
  if(dz){
    dz.addEventListener('dragover', e=>{ e.preventDefault(); dz.classList.add('over'); });
    dz.addEventListener('dragleave', ()=>dz.classList.remove('over'));
    dz.addEventListener('drop', e=>{
      e.preventDefault(); dz.classList.remove('over');
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      handleLibraryUpload(f);
    });
    dz.addEventListener('click', ()=>{
      const inp=document.createElement('input');
      inp.type='file'; inp.accept='.md,.markdown,.txt,.pdf';
      inp.onchange=()=>handleLibraryUpload(inp.files[0]);
      inp.click();
    });
  }

  // Card actions (list is re-rendered constantly, so delegate).
  const list = document.getElementById('libList');
  if(list) list.addEventListener('click', e=>{
    const el = e.target.closest('[data-lib-action]');
    if(!el) return;
    const id = Number(el.dataset.id);
    const action = el.dataset.libAction;
    if(action==='read') toggleDocBody(id);
    else if(action==='markets') applyDocToMarkets(id);
    else if(action==='delete'){
      const doc = GLOBAL_DOCS.find(d=>d.id===id);
      if(!doc) return;
      if(!confirm('Delete "'+doc.title+'" from the global library? This cannot be undone.')) return;
      deleteDoc(id).then(
        ()=>setLibStatus('Deleted "'+doc.title+'".', 'ok'),
        err=>setLibStatus('Delete failed: '+(err.message||''), 'err')
      );
    }
  });

  loadLibrary();
})();
