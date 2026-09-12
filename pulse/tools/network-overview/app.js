/* ================================================================
   NETWORK OVERVIEW — app.js
   Depends on: data/countries.js (COUNTRY_DATA, COUNTRY_MARKDOWN)
   ================================================================ */

const EDIT_MODE = false; // set true to console.log clicked records


/* ================================================================
   ===================   SAVING / PERSISTENCE   =================
   ================================================================
   - Auto-saves all country data to browser storage on every change.
   - Reloads it on page open and merges over the built-in data.
   - Export/Import buttons write/read a single backup JSON file you own.
   If browser storage is blocked (e.g. some shared-link contexts),
   auto-save is disabled and a banner tells you to use Export. */

const STORAGE_KEY = 'phaeron_atlas_v1';
let STORAGE_OK = true;

// Detect whether localStorage is usable in this context.
(function testStorage(){
  try{
    const t='__test__'+Date.now();
    window.localStorage.setItem(t,'1'); window.localStorage.removeItem(t);
    STORAGE_OK=true;
  }catch(_){ STORAGE_OK=false; }
})();

// Load saved data and merge it over the built-in defaults.
function loadSavedData(){
  if(!STORAGE_OK) return;
  let raw=null;
  try{ raw=window.localStorage.getItem(STORAGE_KEY); }catch(_){ return; }
  if(!raw) return;
  try{
    const saved=JSON.parse(raw);
    if(saved && saved.data) Object.assign(COUNTRY_DATA, saved.data);
    if(saved && saved.markdown) Object.assign(COUNTRY_MARKDOWN, saved.markdown);
  }catch(_){ /* corrupt save — ignore, keep defaults */ }
}

// Write current data to browser storage. Called after every change.
function saveData(){
  if(!STORAGE_OK) return false;
  try{
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      data:COUNTRY_DATA, markdown:COUNTRY_MARKDOWN, savedAt:new Date().toISOString()
    }));
    return true;
  }catch(_){ STORAGE_OK=false; showSaveBanner(); return false; }
}

// Download everything as a backup file you own.
function exportData(){
  const blob=new Blob([JSON.stringify({
    data:COUNTRY_DATA, markdown:COUNTRY_MARKDOWN, savedAt:new Date().toISOString()
  }, null, 2)], {type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='phaeron-atlas-backup-'+new Date().toISOString().slice(0,10)+'.json';
  a.click(); URL.revokeObjectURL(url);
}

// Load a backup file back in.
function importData(file){
  const r=new FileReader();
  r.onload=()=>{
    try{
      const saved=JSON.parse(String(r.result));
      if(saved.data) Object.assign(COUNTRY_DATA, saved.data);
      if(saved.markdown) Object.assign(COUNTRY_MARKDOWN, saved.markdown);
      saveData(); refreshGlobe(); if(typeof afterFilter==='function') afterFilter();
      alert('Backup loaded — '+Object.keys(saved.data||{}).length+' country records restored.');
    }catch(_){ alert('That file could not be read as a valid backup.'); }
  };
  r.readAsText(file);
}

function showSaveBanner(){
  if(document.getElementById('saveBanner')) return;
  const b=document.createElement('div'); b.id='saveBanner';
  b.style.cssText='position:fixed;z-index:70;bottom:90px;right:24px;background:var(--mid-s);border:1px solid var(--mid);color:var(--ink);padding:10px 14px;border-radius:10px;font-size:12px;max-width:280px;box-shadow:var(--shadow)';
  b.innerHTML='Auto-save isn\u2019t available here. Use <b>Save backup</b> to keep your work, then <b>Load backup</b> next time.';
  document.body.appendChild(b);
  setTimeout(()=>{ b.style.transition='opacity .5s'; b.style.opacity='0'; setTimeout(()=>b.remove(),600); }, 7000);
}


/* ================================================================
   ===============   CLAUDE API — PERSONAL USE ONLY   ============
   ================================================================
   Paste your Anthropic API key between the quotes below.
   WARNING: this key is stored in plain text in this file.
   Keep this file private. Do NOT publish it, share it, or commit
   it to GitHub. If it ever leaves your machine, rotate the key at
   console.anthropic.com immediately.
   ================================================================ */

/* API key loaded from config.js (see that file to change it) */
const ANTHROPIC_API_KEY = (window.CONFIG && window.CONFIG.ANTHROPIC_API_KEY) || 'PASTE-YOUR-KEY-HERE';
const CLAUDE_MODEL = (window.CONFIG && window.CONFIG.CLAUDE_MODEL) || 'claude-sonnet-4-6';

/* Fixed extraction instructions. Same every time. */
const EXTRACTION_SYSTEM_PROMPT = `You extract mutual fund order-routing intelligence and propose edits to a country research note.

You receive: (1) the current country note in Markdown, (2) the text of an uploaded document.

Your job:
- Read the uploaded document and identify ONLY information relevant to mutual fund order routing: central hubs/CSDs, order channels, automation/manuality, regulators, cross-border routing, key participants, AUM, distribution channels.
- Ignore everything not relevant to fund order routing.
- Propose structured edits to the note. Do not rewrite unchanged sections.
- Spell out every acronym in full on first use with the abbreviation in brackets.
- Never delete existing content; only add or revise.

Respond with JSON ONLY — no prose, no markdown fences — matching exactly:
{
  "summary": "one sentence on what you changed",
  "edits": [
    { "section": "exact ## heading text to place under (omit the ## )",
      "action": "add",
      "newContent": "the markdown to append under that heading" }
  ]
}
If the document has nothing relevant, return {"summary":"No relevant content found","edits":[]}.`;

/* Used when the country has no note yet: build a full note from the document. */
const BUILD_SYSTEM_PROMPT = `You build a new country research note on mutual fund order-routing infrastructure from an uploaded document.

You receive an ISO3 country code and the text of an uploaded document.

Your job:
- Produce ONE complete Markdown research note for this country, capturing only mutual fund order-routing intelligence: market classification, central hub/CSD status, order channels, automation/manuality, regulators, cross-border routing, key participants, AUM, distribution channels, risks.
- Use this structure: a level-1 title (# Country), a blockquote header summarising ISO3/Region/Classification/Hub Status, then ## sections such as Market Overview, How Fund Orders Work Today, Distribution Channels, Key Participants, Risks, and Sources.
- Spell out every acronym in full on first use with the abbreviation in brackets.
- Use only information supported by the document. Do not invent figures.

OUTPUT FORMAT — follow exactly:
First, output the complete Markdown note as plain text (NOT inside JSON, NOT inside code fences).
Then, on a new line, output this exact delimiter:
===FIELDS===
Then output a small JSON object (and nothing after it) with these structured fields, values inferred from the document:
{
  "summary": "one sentence describing the note",
  "country": "Full country name",
  "region": "Europe | Asia | Americas | Africa | Oceania",
  "subregion": "short text",
  "market_classification": "Developed | Emerging | Frontier | Unknown",
  "central_hub_status": "Full hub | Partial hub | No central hub",
  "hub_name": "name or —",
  "operator": "who runs it or —",
  "opportunity_score": 0,
  "automation_rate_estimate": 0,
  "priority_tier": "Tier 1 | Tier 2 | Tier 3 | Watch",
  "existing_network_presence": "Established | Emerging | None",
  "market_aum_band": "short text",
  "mutual_fund_relevance": "one line",
  "growth_signal": "one line",
  "dominant_order_model": "one line",
  "current_order_channels": "one line",
  "manuality_snapshot": "one line",
  "regulatory_openness": "one line",
  "risks_or_barriers": "one line",
  "flow_diagram": [ { "label": "Stage", "mode": "auto" } ]
}`;


const C = {
  good:'#4a9d5b', mid:'#d79a31', bad:'#cf5a4e',
  developed:'#1B3A6B', emerging:'#9F1239', frontier:'#BE123C', unknown:'#a7b3bd',
  none:'#cdd8e1'
};
function scoreColor(v){ if(v==null)return null; if(v>=66)return C.good; if(v>=40)return C.mid; return C.bad; }
function scoreColorInv(v){ if(v==null)return null; if(v>=66)return C.bad; if(v>=40)return C.mid; return C.good; }
function hubColor(s){ if(s==='No central hub')return C.good; if(s==='Partial hub')return C.mid; if(s==='Full hub')return C.bad; return null; }
function classColor(c){ if(c==='Developed')return C.developed; if(c==='Emerging')return C.emerging; if(c==='Frontier')return C.frontier; return C.unknown; }

const LEGENDS = {
  opportunity:{title:'Opportunity',items:[{c:C.good,t:'High — friction & headroom (66+)'},{c:C.mid,t:'Medium (40–65)'},{c:C.bad,t:'Low — mature / well served (<40)'},{c:C.none,t:'No profile yet'}]},
  hub:{title:'Hub Maturity',items:[{c:C.good,t:'No central hub — fragmented'},{c:C.mid,t:'Partial hub'},{c:C.bad,t:'Full hub — well covered'},{c:C.none,t:'No profile yet'}]},
  automation:{title:'Automation',items:[{c:C.good,t:'Low automation — headroom'},{c:C.mid,t:'Medium automation'},{c:C.bad,t:'High automation — saturated'},{c:C.none,t:'No profile yet'}]},
  classification:{title:'Market Classification',items:[{c:C.developed,t:'Developed'},{c:C.emerging,t:'Emerging'},{c:C.frontier,t:'Frontier'},{c:C.unknown,t:'Unknown / no profile'}]}
};

let MODE='opportunity', world=null, globe=null, selectedISO=null;
const FILTERS={region:'',cls:'',hub:'',tier:'',net:'',highopp:false};
let officeLayerCalastone = false, officeLayerSSC = false;
let CALASTONE_ISO3 = new Set(), SSC_ISO3 = new Set();

function toggleActiveClass(id, isActive, className='active'){
  const el=document.getElementById(id);
  if(!el) return null;
  el.classList.toggle(className, isActive);
  return el;
}

function featISO(f){const p=f.properties||{};return f.iso_a3||p.iso_a3||p.ISO_A3||p.adm0_a3||f.id||null;}
function featName(f){const p=f.properties||{};return p.name||p.NAME||p.admin||'Unknown';}
function recordFor(f){const iso=featISO(f);return iso?COUNTRY_DATA[iso]:null;}

function passesFilters(rec){
  if(!rec) return !FILTERS.region&&!FILTERS.cls&&!FILTERS.hub&&!FILTERS.tier&&!FILTERS.net&&!FILTERS.highopp;
  if(FILTERS.region&&rec.region!==FILTERS.region)return false;
  if(FILTERS.cls&&rec.market_classification!==FILTERS.cls)return false;
  if(FILTERS.hub&&rec.central_hub_status!==FILTERS.hub)return false;
  if(FILTERS.tier&&rec.priority_tier!==FILTERS.tier)return false;
  if(FILTERS.net&&rec.existing_network_presence!==FILTERS.net)return false;
  if(FILTERS.highopp&&!(rec.opportunity_score>=66))return false;
  return true;
}
function hexA(hex,a){const h=hex.replace('#','');return`rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;}

function officeHeatmapColor(f){
  const iso=featISO(f);
  const inCal=officeLayerCalastone&&iso&&CALASTONE_ISO3.has(iso);
  const inSSC=officeLayerSSC&&iso&&SSC_ISO3.has(iso);
  if(inCal&&inSSC)return hexA('#00C4A7',0.88);
  if(inCal)return hexA('#9F1239',0.88);
  if(inSSC)return hexA('#1b7fc4',0.88);
  return 'rgba(214,224,232,0.92)';
}
function polyCapColor(f){
  if(officeLayerCalastone||officeLayerSSC)return officeHeatmapColor(f);
  const rec=recordFor(f);
  if(!passesFilters(rec)) return 'rgba(190,205,216,0.30)';
  if(!rec) return 'rgba(205,216,225,0.70)';
  let col;
  if(MODE==='opportunity')col=scoreColor(rec.opportunity_score);
  else if(MODE==='hub')col=hubColor(rec.central_hub_status);
  else if(MODE==='automation')col=scoreColorInv(rec.automation_rate_estimate);
  else col=classColor(rec.market_classification);
  if(!col)col=C.none;
  return hexA(col, selectedISO===rec.iso3?0.95:0.82);
}
function polySideColor(){return 'rgba(0,80,120,0.10)';}
function polyStrokeColor(f){const rec=recordFor(f);if(selectedISO&&rec&&rec.iso3===selectedISO)return '#1B3A6B';return 'rgba(15,34,48,0.12)';}
function polyAltitude(f){const rec=recordFor(f);if(rec&&rec.iso3===selectedISO)return 0.10;if(f.__hover)return 0.07;if(rec&&passesFilters(rec))return 0.012;return 0.006;}

const tooltipEl=document.getElementById('tooltip');
function showTooltip(f,x,y){
  const rec=recordFor(f),name=featName(f);
  let html;
  if(!rec){html=`<div class="tt-name">${name}</div><div class="tt-region">No profile</div><div class="tt-empty">Profile not yet completed</div>`;}
  else{html=`<div class="tt-name">${rec.country}</div><div class="tt-region">${rec.region.toUpperCase()} · ${rec.subregion}</div>
    <div class="tt-row"><span class="k">Hub status</span><span class="v">${rec.central_hub_status}</span></div>
    <div class="tt-row"><span class="k">Opportunity</span><span class="v">${pillScore(rec.opportunity_score)}</span></div>
    <div class="tt-row"><span class="k">Automation</span><span class="v">${rec.automation_rate_estimate}%</span></div>
    <div class="tt-row"><span class="k">Priority</span><span class="v">${tierPill(rec.priority_tier)}</span></div>`;}
  tooltipEl.innerHTML=html;tooltipEl.classList.add('show');positionTooltip(x,y);
}
function positionTooltip(x,y){const pad=16,w=tooltipEl.offsetWidth,h=tooltipEl.offsetHeight;let nx=x+pad,ny=y+pad;if(nx+w>innerWidth-10)nx=x-w-pad;if(ny+h>innerHeight-10)ny=y-h-pad;tooltipEl.style.left=nx+'px';tooltipEl.style.top=ny+'px';}
function hideTooltip(){tooltipEl.classList.remove('show');}

function pillScore(v){const c=v>=66?C.good:v>=40?C.mid:C.bad;return`<span class="pill" style="background:${hexA(c,0.16)};color:${c}">${v}</span>`;}
function tierPill(t){const m={'Tier 1':C.good,'Tier 2':C.mid,'Tier 3':C.bad,'Watch':C.unknown};const c=m[t]||C.unknown;return`<span class="pill" style="background:${hexA(c,0.16)};color:${c}">${t}</span>`;}
function classPill(c){const col=classColor(c);return`<span class="pill" style="background:${hexA(col,0.14)};color:${col}">${c}</span>`;}
function hubPill(s){const c=hubColor(s)||C.unknown;return`<span class="pill" style="background:${hexA(c,0.16)};color:${c}">${s}</span>`;}
function netPill(n){const m={'Established':C.good,'Emerging':C.mid,'None':C.unknown};const c=m[n]||C.unknown;return`<span class="pill" style="background:${hexA(c,0.16)};color:${c}">Network: ${n}</span>`;}

const drawer=document.getElementById('drawer');
const drawerContent=document.getElementById('drawerContent');
drawer.addEventListener('pointerenter',hideTooltip);
function openDrawer(f){
  // The drawer covers part of the globe. Clear any hover card left behind as
  // the pointer moves from the canvas onto the drawer.
  hideTooltip();
  const rec=recordFor(f),name=featName(f);
  drawer.classList.remove('wide');
  if(!rec){
    const iso=featISO(f)||'';
    const existingNote=(typeof COUNTRY_MARKDOWN!=='undefined' && iso) ? cleanNote(COUNTRY_MARKDOWN[iso]||'') : '';
    drawerContent.innerHTML=`
      <div class="drawer-head">
        <button class="drawer-close" onclick="closeDrawer()" title="Close">×</button>
        <button class="drawer-expand" onclick="drawer.classList.toggle('wide')" title="Expand / narrow">⇔</button>
        <div class="ctry-name">${name}</div>
        <div class="ctry-region">${iso||'—'} · No structured profile yet</div>
      </div>
      <div class="scroll">
        <div class="section" style="margin-top:18px">
          <div class="s-title">Add to this note</div>
          <div class="dropzone" id="dropzone" data-iso="${iso}">
            <div class="dz-icon">⬆</div>
            <div class="dz-title">Drop a Markdown or PDF file here</div>
            <div class="dz-sub">Claude reads it and builds this country's note</div>
          </div>
          <div class="dz-status" id="dzStatus"></div>
        </div>
        ${existingNote.trim()
          ? `<div class="md-note" id="mdNote"><div class="note-head"><span class="nh-title">Research note</span></div>${renderMarkdown(existingNote)}</div>`
          : `<div class="md-note"><div class="note-head"><span class="nh-title">Research note</span></div><div class="note-missing">No note yet — drop a Markdown file above to create one.</div></div>`}
      </div>`;
  } else { drawerContent.innerHTML=buildSnapshot(rec); }
  drawer.classList.add('open');
}
function closeDrawer(){drawer.classList.remove('open','wide');selectedISO=null;refreshGlobe();}
window.closeDrawer=closeDrawer;

function buildSnapshot(r){
  const oppC=r.opportunity_score>=66?C.good:r.opportunity_score>=40?C.mid:C.bad;
  const autoC=r.automation_rate_estimate>=66?C.bad:r.automation_rate_estimate>=40?C.mid:C.good;
  return `
  <button class="drawer-close" onclick="closeDrawer()">×</button>
  <div class="drawer-head">
    <div class="ctry-name">${r.country}</div>
    <div class="ctry-region">${r.region.toUpperCase()} · ${r.subregion} · ${r.iso3}</div>
    <div class="badges">${classPill(r.market_classification)}${tierPill(r.priority_tier)}${hubPill(r.central_hub_status)}${netPill(r.existing_network_presence)}</div>
  </div>
  <div class="scroll">
    <div class="kpis">
      <div class="kpi"><div class="k">Opportunity score</div><div class="v" style="color:${oppC}">${r.opportunity_score}<small>/100</small></div><div class="bar"><i style="width:${r.opportunity_score}%;background:${oppC}"></i></div></div>
      <div class="kpi"><div class="k">Automation estimate</div><div class="v">${r.automation_rate_estimate}<small>%</small></div><div class="bar"><i style="width:${r.automation_rate_estimate}%;background:${autoC}"></i></div></div>
      <div class="kpi"><div class="k">Priority tier</div><div class="v" style="font-size:17px">${r.priority_tier}</div></div>
      <div class="kpi"><div class="k">AUM band</div><div class="v" style="font-size:13px;font-family:var(--sans);line-height:1.3;margin-top:7px">${r.market_aum_band}</div></div>
    </div>

    <div class="snapshot-fact"><div class="sf-label">Dominant order model</div><div class="sf-val">${r.dominant_order_model}</div></div>
    <div class="snapshot-fact"><div class="sf-label">Hub</div><div class="sf-val">${r.central_hub_status}${r.hub_name&&r.hub_name!=='—'?' · '+r.hub_name:''}${r.operator?' ('+r.operator+')':''}</div></div>

    <button class="expand-btn" id="expandBtn" onclick="toggleDetail()">
      <span>Show full detail, flow &amp; research note</span><span class="chev">▾</span>
    </button>

    <div class="detail" id="detailBlock">
      ${buildFlow(r)}

      <div class="section"><div class="s-title">Why this market matters</div><p>${r.mutual_fund_relevance}</p></div>

      <div class="section"><div class="s-title">Current order-routing reality</div>
        <div class="field"><div class="fl">Dominant order model</div><div class="fv">${r.dominant_order_model}</div></div>
        <div class="field"><div class="fl">Current channels</div><div class="fv">${r.current_order_channels}</div></div>
        <div class="field"><div class="fl">Manuality snapshot</div><div class="fv">${r.manuality_snapshot}</div></div>
      </div>

      <div class="section"><div class="s-title">Market context</div>
        <div class="field"><div class="fl">Growth signal</div><div class="fv">${r.growth_signal}</div></div>
        <div class="field"><div class="fl">AUM band</div><div class="fv">${r.market_aum_band}</div></div>
        <div class="field"><div class="fl">Regulatory openness</div><div class="fv">${r.regulatory_openness}</div></div>
        <div class="field"><div class="fl">Existing network presence</div><div class="fv">${r.existing_network_presence}</div></div>
      </div>

      <div class="section risk-box"><div class="s-title">Risks / watchouts</div><p>${r.risks_or_barriers}</p></div>

      ${buildNote(r)}

      <div class="updated">Last updated ${r.last_updated}</div>
    </div>
  </div>`;
}

function buildNote(r){
  const md = (typeof COUNTRY_MARKDOWN!=='undefined') ? COUNTRY_MARKDOWN[r.iso3] : null;
  const dz = `<div class="section">
      <div class="s-title">Add to this note</div>
      <div class="dropzone" id="dropzone" data-iso="${r.iso3}">
        <div class="dz-icon">⬆</div>
        <div class="dz-title">Drop a Markdown or PDF file here</div>
        <div class="dz-sub">Claude extracts order-routing detail and proposes edits</div>
      </div>
      <div class="dz-status" id="dzStatus"></div>
    </div>`;
  if(!md || !md.trim()){
    return dz + `<div class="md-note"><div class="note-head"><span class="nh-title">Full research note</span></div><div class="note-missing">No research note yet for this country.</div></div>`;
  }
  return dz + `<div class="md-note" id="mdNote">
    <div class="note-head"><span class="nh-title">Full research note</span></div>
    ${renderMarkdown(md)}
  </div>`;
}

/* Markdown -> HTML. Uses marked if present; otherwise a small fallback.
   Tables are wrapped in a scroll container after rendering. */
function renderMarkdown(md){
  let html;
  try{
    if(window.marked){
      const fn = window.marked.parse || window.marked;
      html = fn(md, {gfm:true, breaks:false});
    } else { html = fallbackMarkdown(md); }
  }catch(e){ html = fallbackMarkdown(md); }
  // wrap tables so they can scroll horizontally on narrow panels
  html = html.replace(/<table>/g,'<div class="md-table-wrap"><table>').replace(/<\/table>/g,'</table></div>');
  return html;
}

/* Minimal fallback if the marked CDN is unavailable: handles headings,
   bold, code fences, blockquotes, lists and paragraphs (no tables). */
function fallbackMarkdown(md){
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const lines=md.split('\n'); let out=[]; let i=0;
  while(i<lines.length){
    let l=lines[i];
    if(/^```/.test(l)){ let buf=[];i++; while(i<lines.length&&!/^```/.test(lines[i])){buf.push(esc(lines[i]));i++;} i++; out.push('<pre><code>'+buf.join('\n')+'</code></pre>'); continue; }
    if(/^#{1,6}\s/.test(l)){ const n=l.match(/^#+/)[0].length; out.push('<h'+n+'>'+inline(esc(l.replace(/^#+\s/,'')))+'</h'+n+'>'); i++; continue; }
    if(/^>\s?/.test(l)){ let buf=[]; while(i<lines.length&&/^>\s?/.test(lines[i])){buf.push(esc(lines[i].replace(/^>\s?/,'')));i++;} out.push('<blockquote>'+inline(buf.join('<br>'))+'</blockquote>'); continue; }
    if(/^[-*]\s/.test(l)){ let buf=[]; while(i<lines.length&&/^[-*]\s/.test(lines[i])){buf.push('<li>'+inline(esc(lines[i].replace(/^[-*]\s/,'')))+'</li>');i++;} out.push('<ul>'+buf.join('')+'</ul>'); continue; }
    if(/^\s*$/.test(l)){ i++; continue; }
    if(/^---+$/.test(l)){ out.push('<hr>'); i++; continue; }
    let buf=[]; while(i<lines.length&&!/^\s*$/.test(lines[i])&&!/^[#>`-]/.test(lines[i])){buf.push(esc(lines[i]));i++;} out.push('<p>'+inline(buf.join(' '))+'</p>');
  }
  function inline(s){ return s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>'); }
  return out.join('\n');
}
window.renderMarkdown=renderMarkdown;

function buildFlow(r){
  let inner='';
  if(r.flow_image && r.flow_image.trim()){
    inner=`<img class="flow-img" src="${r.flow_image}" alt="Order flow diagram for ${r.country}" />`;
  } else if(Array.isArray(r.flow_diagram) && r.flow_diagram.length){
    const stages=r.flow_diagram.map((s,i)=>{
      const cls=(s.mode==='manual'?'manual':s.mode==='mixed'?'mixed':'auto');
      const modeTxt=cls==='manual'?'Manual':cls==='mixed'?'Mixed':'Automated';
      const box=`<div class="flow-stage ${cls}"><div class="fs-label">${s.label}</div><div class="fs-mode">${modeTxt}</div></div>`;
      const arrow=i<r.flow_diagram.length-1?`<div class="flow-arrow">→</div>`:'';
      return box+arrow;
    }).join('');
    inner=`<div class="flow-draw">${stages}</div>
      <div class="flow-legend">
        <div class="fl-item"><span class="fl-dot" style="background:${C.good}"></span>Automated</div>
        <div class="fl-item"><span class="fl-dot" style="background:${C.mid}"></span>Mixed</div>
        <div class="fl-item"><span class="fl-dot" style="background:${C.bad}"></span>Manual</div>
      </div>`;
  } else { return ''; }
  return `<div class="section"><div class="s-title">Order-flow path</div><div class="flow">${inner}</div></div>`;
}

function toggleDetail(){
  const d=document.getElementById('detailBlock'), b=document.getElementById('expandBtn');
  const open=d.classList.toggle('open'); b.classList.toggle('open',open);
  drawer.classList.toggle('wide',open);
  b.querySelector('span').textContent = open ? 'Hide full detail' : 'Show full detail, flow & research note';
}
window.toggleDetail=toggleDetail;

/* ================================================================
   ===============   FILE UPLOAD → CLAUDE → APPROVE   ============
   ================================================================ */

// Event delegation: the dropzone is rebuilt each time a country opens.
const drawerEl = document.getElementById('drawer');
drawerEl.addEventListener('dragover', e=>{
  const dz=e.target.closest('#dropzone'); if(!dz) return;
  e.preventDefault(); dz.classList.add('over');
});
drawerEl.addEventListener('dragleave', e=>{
  const dz=e.target.closest('#dropzone'); if(!dz) return;
  dz.classList.remove('over');
});
drawerEl.addEventListener('drop', e=>{
  const dz=e.target.closest('#dropzone'); if(!dz) return;
  e.preventDefault(); dz.classList.remove('over');
  const f=e.dataTransfer.files && e.dataTransfer.files[0];
  handleUpload(f, dz.dataset.iso);
});
// also allow click-to-pick
drawerEl.addEventListener('click', e=>{
  const dz=e.target.closest('#dropzone'); if(!dz) return;
  const inp=document.createElement('input'); inp.type='file'; inp.accept='.md,.markdown,.txt,.pdf';
  inp.onchange=()=>handleUpload(inp.files[0], dz.dataset.iso); inp.click();
});

function setStatus(msg, cls){
  const s=document.getElementById('dzStatus'); if(!s) return;
  s.textContent=msg||''; s.className='dz-status'+(cls?(' '+cls):'');
}

async function handleUpload(file, iso){
  if(!file){ return; }
  if(!iso){ setStatus('This country has no ISO code mapped — add it to NAME_TO_ISO first.', 'err'); return; }
  const isPdf=/\.pdf$/i.test(file.name);
  const isText=/\.(md|markdown|txt)$/i.test(file.name);
  if(!isPdf && !isText){ setStatus('Please drop a Markdown (.md), text, or PDF file.', 'err'); return; }
  if(ANTHROPIC_API_KEY==='PASTE-YOUR-KEY-HERE' || !ANTHROPIC_API_KEY){
    setStatus('No API key set — paste your key into the file (ANTHROPIC_API_KEY).', 'err'); return;
  }
  if(isPdf && file.size > 25*1024*1024){ setStatus('PDF is too large (25MB max).', 'err'); return; }

  setStatus('Reading file…', 'work');
  let payload;
  try{
    if(isPdf){
      const b64=await fileToBase64(file);
      payload={ kind:'pdf', data:b64 };
    } else {
      const txt=await file.text();
      payload={ kind:'text', text:txt.slice(0,60000) };
    }
  }catch(_){ setStatus('Could not read the file.', 'err'); return; }

  const currentNote = (COUNTRY_MARKDOWN[iso]||'').slice(0,40000);
  const isBlank = !currentNote.trim();

  setStatus(isBlank ? 'Asking Claude to build this country\u2019s note…' : 'Asking Claude to extract relevant detail…', 'work');
  try{
    const proposal = await callClaude(iso, currentNote, payload, isBlank);
    setStatus('', '');
    openModal(proposal, iso);
  }catch(err){
    setStatus('Error: '+(err.message||'request failed'), 'err');
  }
}

// Read a file as a base64 string (no data: prefix), for the Claude document block.
function fileToBase64(file){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>{ const s=String(r.result); res(s.slice(s.indexOf(',')+1)); };
    r.onerror=()=>rej(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

async function callClaude(iso, currentNote, payload, isBlank){
  const sys = isBlank ? BUILD_SYSTEM_PROMPT : EXTRACTION_SYSTEM_PROMPT;
  const instruction = isBlank
    ? `COUNTRY ISO3: ${iso}\n\nThe uploaded document follows. Build the note from it.`
    : `COUNTRY: ${iso}\n\nCURRENT NOTE:\n${currentNote||'(empty)'}\n\nThe uploaded document follows. Extract relevant detail and propose edits.`;

  // Build the user content: instruction text + the document (PDF block or inline text).
  let content;
  if(payload.kind==='pdf'){
    content=[
      { type:'text', text:instruction },
      { type:'document', source:{ type:'base64', media_type:'application/pdf', data:payload.data } }
    ];
  } else {
    content = `${instruction}\n\nUPLOADED DOCUMENT:\n${payload.text}`;
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{
      'content-type':'application/json',
      'x-api-key':ANTHROPIC_API_KEY,
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true'
    },
    body:JSON.stringify({
      model:CLAUDE_MODEL,
      max_tokens:isBlank ? 16000 : 2000,
      system:sys,
      messages:[{role:'user', content:content}]
    })
  });
  if(!res.ok){
    let detail=''; try{ const j=await res.json(); detail=j.error?.message||''; }catch(_){}
    throw new Error('API '+res.status+(detail?(' — '+detail):''));
  }
  const data=await res.json();
  const text=(data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n');
  const truncated = data.stop_reason==='max_tokens';

  if(isBlank){
    // Build format: markdown note, then ===FIELDS===, then a small JSON object.
    const parsed=parseBuildResponse(text);
    if(!parsed.note){
      throw new Error(truncated
        ? 'The note was too long and got cut off. Try a shorter source file, or split it.'
        : 'Could not read the built note. Try again.');
    }
    parsed.__mode='build';
    if(truncated) parsed.__truncated=true;
    return parsed;
  }

  // Merge format: JSON only.
  let parsed=safeParseJSON(text);
  if(!parsed){
    throw new Error(truncated
      ? 'The response got cut off (too long). Try a smaller file.'
      : 'Claude did not return valid JSON.');
  }
  parsed.__mode='merge';
  if(!parsed.edits) parsed.edits=[];
  return parsed;
}

/* Split a build response into { note, fields:{...} }.
   Note is plain markdown before ===FIELDS===; fields is JSON after it.
   Falls back gracefully if the delimiter is missing. */
function parseBuildResponse(text){
  const t=String(text);
  const idx=t.indexOf('===FIELDS===');
  if(idx<0){
    // No delimiter — treat the whole thing as the note, no structured fields.
    return { note:cleanNote(t.replace(/```/g,'').trim()), fields:{} };
  }
  const note=cleanNote(t.slice(0,idx).replace(/```$/,'').trim());
  const fieldsRaw=t.slice(idx+12);
  const fields=safeParseJSON(fieldsRaw) || {};
  return { note, summary:fields.summary||'', fields };
}

/* Tolerant JSON extraction: strip fences, isolate the outermost {...},
   and retry. Returns null if nothing parseable. */
function safeParseJSON(raw){
  let t=String(raw).replace(/```json|```/g,'').trim();
  try{ return JSON.parse(t); }catch(_){}
  const a=t.indexOf('{'), b=t.lastIndexOf('}');
  if(a>=0 && b>a){
    let slice=t.slice(a,b+1);
    try{ return JSON.parse(slice); }catch(_){}
  }
  return null;
}

/* ----- approval modal ----- */
let PENDING=null; // {iso, mode, edits|note|fields}
function openModal(proposal, iso){
  const body=document.getElementById('modalBody');
  document.getElementById('modalSummary').textContent=proposal.summary||'';

  if(proposal.__mode==='build'){
    // building a brand-new note + structured record
    const note=cleanNote(proposal.note||'');
    PENDING={iso, mode:'build', note, fields:proposal.fields||{}};
    document.getElementById('modalCopy').style.display = note.trim() ? '' : 'none';
    if(!note.trim()){
      body.innerHTML=`<div class="modal-empty">Claude could not build a note from that file.</div>`;
      document.getElementById('modalApply').style.display='none';
    } else {
      document.getElementById('modalApply').style.display='';
      const f=PENDING.fields;
      const chips=[f.market_classification,f.priority_tier,f.central_hub_status]
        .filter(Boolean).map(x=>`<span class="ec-action" style="background:var(--blue-s);color:var(--blue)">${escapeHtml(x)}</span>`).join(' ');
      const warn = proposal.__truncated
        ? `<div style="font-size:11.5px;color:var(--mid);background:var(--mid-s);border-radius:8px;padding:8px 10px;margin-bottom:10px">⚠ The note may be slightly cut off (long source). Review before applying.</div>` : '';
      body.innerHTML=`
        ${warn}
        <div class="edit-card">
          <div class="ec-top">${chips}</div>
          <div style="font-size:12px;color:var(--ink-2);margin-bottom:8px">Opportunity ${f.opportunity_score??'—'} · Automation ${f.automation_rate_estimate??'—'}% · ${escapeHtml(f.market_aum_band||'')}</div>
          <div class="ec-content">${escapeHtml(note.slice(0,1400))}${note.length>1400?'\n…':''}</div>
          <label class="ec-check"><input type="checkbox" id="bcheck" checked> Create this country profile and note</label>
        </div>`;
    }
    document.getElementById('modalVeil').classList.add('open');
    return;
  }

  // merge mode (existing note)
  PENDING={iso, mode:'merge', edits:proposal.edits||[]};
  document.getElementById('modalCopy').style.display='none';
  if(!PENDING.edits.length){
    body.innerHTML=`<div class="modal-empty">No relevant order-routing content was found to add.</div>`;
    document.getElementById('modalApply').style.display='none';
  } else {
    document.getElementById('modalApply').style.display='';
    body.innerHTML=PENDING.edits.map((ed,i)=>`
      <div class="edit-card">
        <div class="ec-top"><span class="ec-action">${(ed.action||'add')}</span><span class="ec-section">${escapeHtml(ed.section||'(no heading)')}</span></div>
        <div class="ec-content">${escapeHtml(ed.newContent||'')}</div>
        <label class="ec-check"><input type="checkbox" data-i="${i}" checked> Apply this change</label>
      </div>`).join('');
  }
  document.getElementById('modalVeil').classList.add('open');
}

/* Strip stray JSON field labels a model sometimes leaks at the start. */
function cleanNote(s){
  return String(s).replace(/^\s*"?(note|newContent)"?\s*:?\s*/i,'').trim();
}
function closeModal(){ document.getElementById('modalVeil').classList.remove('open'); PENDING=null; }
function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

document.getElementById('modalClose').addEventListener('click',closeModal);
document.getElementById('modalCancel').addEventListener('click',closeModal);
document.getElementById('modalCopy').addEventListener('click',()=>{
  if(!PENDING || PENDING.mode!=='build') return;
  const snippet=buildRecordSnippet(PENDING.iso, PENDING.fields||{}, PENDING.note||'');
  navigator.clipboard.writeText(snippet).then(
    ()=>{ const b=document.getElementById('modalCopy'); const t=b.textContent; b.textContent='Copied ✓'; setTimeout(()=>b.textContent=t,1600); },
    ()=>{ alert('Copy failed — your browser blocked clipboard access.'); }
  );
});

/* Produce paste-ready code: a COUNTRY_DATA record + a COUNTRY_MARKDOWN entry,
   so the country survives a reload when pasted into the file. */
function buildRecordSnippet(iso, f, note){
  const q=s=>JSON.stringify(s==null?'':String(s));
  const arr=Array.isArray(f.flow_diagram)?f.flow_diagram:[];
  const flow=arr.map(s=>`      {label:${q(s.label)}, mode:${q(s.mode||'mixed')}}`).join(',\n');
  const rec =
`  // ---- paste this inside COUNTRY_DATA ----
  ${q(iso)}: {
    country:${q(f.country||iso)}, iso3:${q(iso)}, region:${q(f.region||'Asia')}, subregion:${q(f.subregion||'')},
    market_classification:${q(f.market_classification||'Unknown')},
    central_hub_status:${q(f.central_hub_status||'No central hub')}, hub_name:${q(f.hub_name||'—')}, operator:${q(f.operator||'—')},
    opportunity_score:${clampNum(f.opportunity_score,60)}, automation_rate_estimate:${clampNum(f.automation_rate_estimate,50)},
    priority_tier:${q(f.priority_tier||'Watch')}, existing_network_presence:${q(f.existing_network_presence||'None')},
    market_aum_band:${q(f.market_aum_band||'—')},
    mutual_fund_relevance:${q(f.mutual_fund_relevance||'')},
    growth_signal:${q(f.growth_signal||'')},
    dominant_order_model:${q(f.dominant_order_model||'')},
    current_order_channels:${q(f.current_order_channels||'')},
    manuality_snapshot:${q(f.manuality_snapshot||'')},
    regulatory_openness:${q(f.regulatory_openness||'')},
    risks_or_barriers:${q(f.risks_or_barriers||'')},
    flow_image:"", flow_diagram:[\n${flow}\n    ],
    last_updated:${q(new Date().toISOString().slice(0,7))}
  },`;
  // Use a placeholder for the backtick so we don't break this template string.
  const BT=String.fromCharCode(96);
  const md =
`  // ---- paste this inside COUNTRY_MARKDOWN ----
  ${q(iso)}: ${BT}${note.replace(new RegExp(BT,'g'), '\\'+BT)}${BT},`;
  return rec + '\n\n' + md + '\n';
}
document.getElementById('modalVeil').addEventListener('click',e=>{ if(e.target.id==='modalVeil') closeModal(); });

document.getElementById('modalApply').addEventListener('click',()=>{
  if(!PENDING) return;
  const iso=PENDING.iso;

  if(PENDING.mode==='build'){
    const c=document.getElementById('bcheck');
    if(c && !c.checked){ closeModal(); return; }
    // 1) save the note
    COUNTRY_MARKDOWN[iso]=PENDING.note;
    // 2) create a structured record so the country colours + scores
    const f0=PENDING.fields||{};
    COUNTRY_DATA[iso]={
      country:f0.country||iso, iso3:iso,
      region:f0.region||'Asia', subregion:f0.subregion||'',
      market_classification:f0.market_classification||'Unknown',
      central_hub_status:f0.central_hub_status||'No central hub',
      hub_name:f0.hub_name||'—', operator:f0.operator||'—',
      opportunity_score:clampNum(f0.opportunity_score,60),
      automation_rate_estimate:clampNum(f0.automation_rate_estimate,50),
      priority_tier:f0.priority_tier||'Watch',
      existing_network_presence:f0.existing_network_presence||'None',
      market_aum_band:f0.market_aum_band||'—',
      mutual_fund_relevance:f0.mutual_fund_relevance||'',
      growth_signal:f0.growth_signal||'', dominant_order_model:f0.dominant_order_model||'',
      current_order_channels:f0.current_order_channels||'', manuality_snapshot:f0.manuality_snapshot||'',
      regulatory_openness:f0.regulatory_openness||'', risks_or_barriers:f0.risks_or_barriers||'',
      flow_image:'', flow_diagram:Array.isArray(f0.flow_diagram)?f0.flow_diagram:[],
      last_updated:new Date().toISOString().slice(0,7)
    };
    closeModal();
    saveData();                  // persist to browser storage
    refreshGlobe();              // recolour the globe now that the record exists
    afterFilter();              // refresh counts/legend
    const f=world.find(ft=>featISO(ft)===iso);
    if(f) openDrawer(f);        // reopen as a full profiled panel
    setStatus('Profile and note created for this country.', 'ok');
    return;
  }

  // merge mode
  const checks=[...document.querySelectorAll('#modalBody input[type=checkbox]')];
  const chosen=checks.filter(c=>c.checked).map(c=>PENDING.edits[+c.dataset.i]);
  let note=COUNTRY_MARKDOWN[iso]||'';
  chosen.forEach(ed=>{ note=applyEdit(note, ed); });
  COUNTRY_MARKDOWN[iso]=note;
  saveData();                    // persist to browser storage
  closeModal();
  const f=world.find(ft=>featISO(ft)===iso);
  if(f){ const wasWide=drawer.classList.contains('wide'); openDrawer(f);
    if(wasWide){ toggleDetail(); } }
  setStatus('Changes applied to the note in the app.', 'ok');
});

function clampNum(v, dflt){ const n=Number(v); return Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):dflt; }

/* Append newContent under the matching "## heading". If not found, append a
   new section at the end. Never deletes existing text. */
function applyEdit(note, ed){
  const heading=(ed.section||'').trim();
  const content=(ed.newContent||'').trim();
  if(!content) return note;
  if(heading){
    // find a line that is "## <heading>" (any heading level), case-insensitive
    const lines=note.split('\n');
    let idx=-1;
    for(let i=0;i<lines.length;i++){
      const m=lines[i].match(/^#{1,6}\s+(.*)$/);
      if(m && m[1].trim().toLowerCase()===heading.toLowerCase()){ idx=i; break; }
    }
    if(idx>=0){
      // find end of this section (next heading of same/higher level or EOF)
      let j=idx+1;
      while(j<lines.length && !/^#{1,6}\s+/.test(lines[j])) j++;
      lines.splice(j,0,'',content,'');
      return lines.join('\n');
    }
    // heading not found → add it as a new section
    return note.replace(/\s*$/,'') + `\n\n## ${heading}\n\n${content}\n`;
  }
  return note.replace(/\s*$/,'') + `\n\n${content}\n`;
}

function renderLegend(){
  const L=LEGENDS[MODE];
  document.getElementById('legendTitle').textContent=L.title;
  document.getElementById('legendItems').innerHTML=L.items.map(i=>`<div class="item"><span class="sw" style="background:${i.c}"></span>${i.t}</div>`).join('');
}
function refreshGlobe(){if(!globe||currentMode!=='research')return;globe.polygonCapColor(polyCapColor).polygonStrokeColor(polyStrokeColor).polygonAltitude(polyAltitude);}

function uniq(field){const s=new Set();Object.values(COUNTRY_DATA).forEach(r=>{if(r[field])s.add(r[field]);});return[...s].sort();}
function fillSelect(id,vals){const sel=document.getElementById(id);vals.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o);});}
function initFilters(){
  fillSelect('f-region',uniq('region'));fillSelect('f-class',uniq('market_classification'));
  fillSelect('f-hub',uniq('central_hub_status'));fillSelect('f-tier',uniq('priority_tier'));
  fillSelect('f-net',uniq('existing_network_presence'));
  const map={'f-region':'region','f-class':'cls','f-hub':'hub','f-tier':'tier','f-net':'net'};
  Object.keys(map).forEach(id=>document.getElementById(id).addEventListener('change',e=>{FILTERS[map[id]]=e.target.value;afterFilter();}));
  document.getElementById('f-highopp').addEventListener('change',e=>{FILTERS.highopp=e.target.checked;afterFilter();});
  document.getElementById('clearFilters').addEventListener('click',()=>{
    Object.keys(FILTERS).forEach(k=>FILTERS[k]=k==='highopp'?false:'');
    ['f-region','f-class','f-hub','f-tier','f-net'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('f-highopp').checked=false;afterFilter();
  });
}
function activeFilterCount(){let n=0;['region','cls','hub','tier','net'].forEach(k=>{if(FILTERS[k])n++;});if(FILTERS.highopp)n++;return n;}
function afterFilter(){
  const n=activeFilterCount(),badge=document.getElementById('filterBadge');
  if(n>0){badge.style.display='inline-block';badge.textContent=n;}else badge.style.display='none';
  const matches=Object.values(COUNTRY_DATA).filter(r=>passesFilters(r)).length;
  document.getElementById('matchCount').textContent=`${matches} profiled market${matches!==1?'s':''} match`;
  refreshGlobe();refreshSuggestions(document.getElementById('search').value);
}

const searchEl=document.getElementById('search'),sugEl=document.getElementById('suggestions');
function searchablePool(){return Object.values(COUNTRY_DATA).filter(r=>passesFilters(r));}
function refreshSuggestions(q){
  q=(q||'').trim().toLowerCase();
  if(!q){sugEl.classList.remove('open');sugEl.innerHTML='';return;}
  const pool=searchablePool().filter(r=>r.country.toLowerCase().includes(q)||r.iso3.toLowerCase().includes(q)||r.region.toLowerCase().includes(q)).slice(0,8);
  sugEl.innerHTML=pool.length?pool.map(r=>`<div class="row" data-iso="${r.iso3}"><span class="nm">${r.country}</span><span class="tag">${r.iso3} · ${r.priority_tier}</span></div>`).join(''):`<div class="row empty">No matching profiled market</div>`;
  sugEl.classList.add('open');
}
searchEl.addEventListener('input',e=>refreshSuggestions(e.target.value));
searchEl.addEventListener('focus',e=>{if(e.target.value)refreshSuggestions(e.target.value);});
sugEl.addEventListener('click',e=>{const row=e.target.closest('.row[data-iso]');if(!row)return;flyToISO(row.dataset.iso);sugEl.classList.remove('open');searchEl.value='';});
document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap'))sugEl.classList.remove('open');});
searchEl.addEventListener('keydown',e=>{if(e.key==='Enter'){const f=sugEl.querySelector('.row[data-iso]');if(f){flyToISO(f.dataset.iso);sugEl.classList.remove('open');searchEl.value='';}}});

function centroid(f){let lats=[],lngs=[];const g=f.geometry;if(!g)return null;const polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;polys.forEach(p=>p[0].forEach(c=>{lngs.push(c[0]);lats.push(c[1]);}));if(!lats.length)return null;return{lat:(Math.min(...lats)+Math.max(...lats))/2,lng:(Math.min(...lngs)+Math.max(...lngs))/2};}
function flyToISO(iso){const f=world.find(ft=>featISO(ft)===iso);if(!f)return;selectedISO=iso;const c=centroid(f);if(c)globe.pointOfView({lat:c.lat,lng:c.lng,altitude:1.7},1100);refreshGlobe();openDrawer(f);}

document.getElementById('modeSeg').addEventListener('click',e=>{const b=e.target.closest('button[data-mode]');if(!b)return;document.querySelectorAll('#modeSeg button').forEach(x=>x.classList.remove('active'));b.classList.add('active');MODE=b.dataset.mode;renderLegend();refreshGlobe();});
document.getElementById('filterBtn').addEventListener('click',()=>{const p=document.getElementById('filterPanel');const o=p.classList.toggle('open');document.getElementById('filterBtn').classList.toggle('active',o);});
document.getElementById('saveBtn').addEventListener('click',exportData);
document.getElementById('loadBtn').addEventListener('click',()=>{
  const inp=document.createElement('input'); inp.type='file'; inp.accept='.json,application/json';
  inp.onchange=()=>{ if(inp.files[0]) importData(inp.files[0]); }; inp.click();
});


/* ================================================================
   ============  NETWORK MODE FUNCTIONS  ==========================
   ================================================================ */

// Extra state for combined app (globe, world, selectedISO, hoverFeat, MODE, FILTERS
// are already declared above by the research globe code)
let currentMode = 'network';
let netSpin = true, netFlowsOn = true, netArcMode = 'all';
let netNodeById = {};
let netMouse = {x:0, y:0};
let ctrl = null;   // globe.js OrbitControls reference

// Network arc colour ramp: brand blue → teal → green
const netCstops=[[0,[11,121,174]],[0.4,[27,150,170]],[0.72,[38,160,140]],[1,[105,160,103]]];
function netArcRGB(t){t=Math.max(0,Math.min(1,t));for(let i=0;i<netCstops.length-1;i++){const[p0,c0]=netCstops[i],[p1,c1]=netCstops[i+1];if(t>=p0&&t<=p1){const u=(t-p0)/(p1-p0);return[Math.round(c0[0]+(c1[0]-c0[0])*u),Math.round(c0[1]+(c1[1]-c0[1])*u),Math.round(c0[2]+(c1[2]-c0[2])*u)];}}return netCstops[3][1];}
function netArcColor(d){const maxArc=window.CALASTONE_FLOWS.meta.maxArc;const[r,g,b]=netArcRGB(Math.sqrt(d.orders/maxArc));return `rgba(${r},${g},${b},${0.45+0.45*Math.sqrt(d.orders/maxArc)})`;}
function netLandColor(f){const n=netNodeById[f.properties.iso2];if(!n)return 'rgba(214,224,232,0.92)';const maxNode=window.CALASTONE_FLOWS.meta.maxNode;const t=Math.pow(n.total/maxNode,0.4);const[r,g,b]=netArcRGB(t);const base=[233,242,247],k=0.2+0.8*t;let cr=base[0]+(r-base[0])*k,cg=base[1]+(g-base[1])*k,cb=base[2]+(b-base[2])*k;const dark=1-0.42*t;return `rgba(${Math.round(cr*dark)},${Math.round(cg*dark)},${Math.round(cb*dark)},0.96)`;}

const fmtNet=n=>n.toLocaleString('en-GB');
const fmtShort=n=>n>=1e9?(n/1e9).toFixed(2)+'bn':n>=1e6?(n/1e6).toFixed(1)+'m':n>=1e3?(n/1e3).toFixed(0)+'k':''+n;

function posNetTip(){const tip=document.getElementById('netTooltip');tip.style.left=netMouse.x+'px';tip.style.top=netMouse.y+'px';}
function hideNetTip(){const tip=document.getElementById('netTooltip');if(tip)tip.style.opacity=0;}
function topCorridorsFor(iso){const DATA=window.CALASTONE_FLOWS;const out=DATA.arcs.filter(a=>a.fromIso===iso&&!a.intra).sort((x,y)=>y.orders-x.orders).slice(0,3);const inn=DATA.arcs.filter(a=>a.toIso===iso&&!a.intra).sort((x,y)=>y.orders-x.orders).slice(0,3);return{out,inn};}
function pctOfTotal(orders){const p=orders/window.CALASTONE_FLOWS.meta.liveTotal*100;if(p>=1)return p.toFixed(1);if(p>=0.1)return p.toFixed(2);if(p>=0.01)return p.toFixed(3);if(p>0)return p.toFixed(4);return '0';}
function netNodeTip(n){const{out,inn}=topCorridorsFor(n.id);const intra=window.CALASTONE_FLOWS.arcs.find(a=>a.intra&&a.fromIso===n.id);const rows=l=>l.map(a=>`<div class="tt-fl"><span class="n">${a.from===n.name?a.to:a.from}</span><span class="v">${fmtNet(a.orders)}</span></div>`).join('');const tip=document.getElementById('netTooltip');tip.innerHTML=`<div class="tt-route">${n.name}</div><div class="tt-big">${fmtNet(n.total)}</div><div class="tt-sub">orders placed + received${intra?` · ${fmtNet(intra.orders)} within ${n.name}`:''}</div>${out.length?`<div class="tt-flows"><div class="h">Top destinations (out)</div>${rows(out)}</div>`:''}${inn.length?`<div class="tt-flows"><div class="h">Top sources (in)</div>${rows(inn)}</div>`:''}`;tip.style.opacity=1;posNetTip();}
function netArcTip(a){const tip=document.getElementById('netTooltip');tip.innerHTML=`<div class="tt-route">${a.from} <span style="color:var(--teal)">→</span> ${a.to}</div><div class="tt-big">${fmtNet(a.orders)}</div><div class="tt-sub">${pctOfTotal(a.orders)}% of all live network volume</div>`;tip.style.opacity=1;posNetTip();}

function netApplyArcs(){const DATA=window.CALASTONE_FLOWS;if(!netFlowsOn){globe.arcsData([]);return;}const arcs=DATA.arcs.filter(a=>!a.intra);globe.arcsData(netArcMode==='cross'?arcs:arcs);}
function netIgnite(){const DATA=window.CALASTONE_FLOWS;const allArcs=DATA.arcs.filter(a=>!a.intra);const sorted=[...allArcs].sort((a,b)=>b.orders-a.orders);let shown=[];const batch=Math.ceil(sorted.length/14);let idx=0;(function step(){shown=shown.concat(sorted.slice(idx,idx+batch));idx+=batch;if(netFlowsOn&&currentMode==='network')globe.arcsData(netArcMode==='cross'?shown.filter(a=>!a.intra):shown);if(idx<sorted.length)setTimeout(step,75);})();}
function netCountUp(target){const el=document.getElementById('heroCount'),dur=1600,t0=performance.now();function tick(now){const p=Math.min(1,(now-t0)/dur);const e=1-Math.pow(1-p,3);el.innerHTML=fmtShort(Math.round(target*e))+'<span class="unit">orders</span>';if(p<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);}

/* ================================================================
   ============  MODE SWITCHING  ==================================
   ================================================================ */

function switchToNetwork(){
  currentMode='network';
  document.getElementById('networkUI').style.display='';
  document.getElementById('researchUI').style.display='none';
  document.getElementById('researchTopbarControls').style.display='none';
  document.getElementById('settlementsUI').style.display='none';
  toggleActiveClass('globeSwitchNetwork', true);
  toggleActiveClass('globeSwitchResearch', false);
  toggleActiveClass('globeSwitchHubSpoke', false);
  document.getElementById('topbarSub').textContent='Global Network · 2025';
  hideNetTip();hideSettTip();document.body.style.cursor='';
  const DATA=window.CALASTONE_FLOWS;const maxArc=DATA.meta.maxArc,maxNode=DATA.meta.maxNode;
  try{const m=globe.globeMaterial();if(m.color&&m.color.set)m.color.set('#eef5f9');if(m.emissive&&m.emissive.set){m.emissive.set('#e8f1f6');m.emissiveIntensity=0.85;}if('shininess'in m)m.shininess=0;m.needsUpdate=true;}catch(e){}
  globe.showAtmosphere(true).atmosphereColor('#9fc6d8').atmosphereAltitude(0.2)
    .polygonsData(window.CALASTONE_GEO.features).polygonCapColor(f=>netLandColor(f)).polygonSideColor(()=>'rgba(150,170,190,0.25)').polygonStrokeColor(()=>'rgba(120,150,180,0.3)').polygonAltitude(0.006).polygonsTransitionDuration(300)
    .pointsData(DATA.nodes).pointLat(d=>d.lat).pointLng(d=>d.lng).pointColor(()=>'#0b79ae').pointAltitude(0.008).pointRadius(d=>0.28+1.0*Math.sqrt(d.total/maxNode)).pointResolution(14)
    .labelsData(DATA.nodes.filter(n=>n.total>3e6)).labelLat(d=>d.lat).labelLng(d=>d.lng).labelText(d=>d.name).labelSize(0.9).labelDotRadius(0).labelColor(()=>'rgba(11,121,174,0.9)').labelResolution(2).labelAltitude(0.012)
    .arcsData([]).arcStartLat(d=>d.startLat).arcStartLng(d=>d.startLng).arcEndLat(d=>d.endLat).arcEndLng(d=>d.endLng).arcColor(d=>netArcColor(d)).arcStroke(d=>0.18+1.5*Math.sqrt(d.orders/maxArc)).arcAltitudeAutoScale(0.5).arcDashLength(0.45).arcDashGap(0.6).arcDashInitialGap(()=>Math.random()).arcDashAnimateTime(d=>Math.max(1400,5200-3600*Math.sqrt(d.orders/maxArc))).arcsTransitionDuration(0)
    .onPolygonHover(f=>{if(officeLayerCalastone||officeLayerSSC){hideNetTip();document.body.style.cursor='';return;}const n=f&&netNodeById[f.properties.iso2];document.body.style.cursor=n?'pointer':'';globe.polygonAltitude(ff=>ff===f&&n?0.02:0.006);if(n){netNodeTip(n);if(ctrl)ctrl.autoRotate=false;}else{hideNetTip();if(ctrl&&netSpin)ctrl.autoRotate=true;}})
    .onPolygonClick(null).onPointHover(n=>{document.body.style.cursor=n?'pointer':'';if(n){netNodeTip(n);if(ctrl)ctrl.autoRotate=false;}else{hideNetTip();if(ctrl&&netSpin)ctrl.autoRotate=true;}})
    .onArcHover(a=>{document.body.style.cursor=a?'pointer':'';if(a){netArcTip(a);if(ctrl)ctrl.autoRotate=false;}else{hideNetTip();if(ctrl&&netSpin)ctrl.autoRotate=true;}});
  if(ctrl&&netSpin)ctrl.autoRotate=true;
  netApplyArcs();
}

function switchToResearch(){
  currentMode='research';
  document.getElementById('networkUI').style.display='none';
  document.getElementById('researchUI').style.display='';
  document.getElementById('researchTopbarControls').style.display='flex';
  document.getElementById('settlementsUI').style.display='none';
  const _hs3=document.getElementById('hubSpokeUI');if(_hs3)_hs3.classList.remove('hs-open');
  toggleActiveClass('globeSwitchNetwork', false);
  toggleActiveClass('globeSwitchResearch', true);
  toggleActiveClass('globeSwitchHubSpoke', false);
  document.getElementById('topbarSub').textContent='Global Order-Routing Atlas';
  hideNetTip();hideSettTip();document.body.style.cursor='';
  try{const m=globe.globeMaterial();if(m.color&&m.color.set)m.color.set('#eaf1f6');if(m.emissive&&m.emissive.set){m.emissive.set('#dce8f0');m.emissiveIntensity=0.4;}if('shininess'in m)m.shininess=0.5;m.needsUpdate=true;}catch(e){}
  globe.showAtmosphere(true).atmosphereColor('#7fb8d8').atmosphereAltitude(0.16)
    .polygonsData(world).polygonCapColor(polyCapColor).polygonSideColor(polySideColor).polygonStrokeColor(polyStrokeColor).polygonAltitude(polyAltitude).polygonsTransitionDuration(300)
    .pointsData([]).arcsData([]).labelsData([])
    .onPolygonHover(handleHover).onPolygonClick(handleClick).onPointHover(null).onArcHover(null);
  if(ctrl)ctrl.autoRotate=false;
  refreshGlobe();
}

/* ================================================================
   ============  COMBINED INITIALIZATION  =========================
   ================================================================ */
function init(){
  const DATA=window.CALASTONE_FLOWS;
  netNodeById=Object.fromEntries(DATA.nodes.map(n=>[n.id,n]));

  // Prepare research world: share CALASTONE_GEO, add iso_a3 from name mapping
  // (NAME_TO_ISO is declared further below in the file but runs before init() is called)
  world=window.CALASTONE_GEO.features;
  world.forEach(f=>{f.iso_a3=NAME_TO_ISO[f.properties.name]||null;});

  loadSavedData();
  if(!STORAGE_OK)showSaveBanner();

  // Create the single globe instance
  globe=Globe()(document.getElementById('globeViz'))
    .backgroundColor('rgba(0,0,0,0)').showAtmosphere(true).showGlobe(true);

  ctrl=globe.controls();window.globe=globe;window.ctrl=ctrl;
  ctrl.enableDamping=true;ctrl.dampingFactor=0.08;
  ctrl.minDistance=160;ctrl.maxDistance=600;
  netSpin=true;ctrl.autoRotate=true;ctrl.autoRotateSpeed=0.32;

  // Stop rotation on first user interaction
  let interacted=false;
  function stopSpin(){if(!interacted){ctrl.autoRotate=false;interacted=true;netSpin=false;}}
  const v=document.getElementById('globeViz');
  v.addEventListener('pointerdown',stopSpin);v.addEventListener('wheel',stopSpin);

  globe.pointOfView({lat:28,lng:6,altitude:2.5},0);

  // Network mouse tracking (for net-tooltip positioning)
  addEventListener('mousemove',e=>{netMouse={x:e.clientX,y:e.clientY};posNetTip();});

  // Resize
  function doResize(){
    const viewportW = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 1024;
    const viewportH = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 768;
    const containerW = Math.max(1, Math.round(document.getElementById('globeViz')?.getBoundingClientRect().width || viewportW));
    const containerH = Math.max(1, Math.round(document.getElementById('globeViz')?.getBoundingClientRect().height || viewportH));
    const width = Math.max(1, Math.min(containerW, viewportW || containerW));
    const height = Math.max(1, Math.min(containerH, viewportH || containerH));
    globe.width(width).height(height);
    if(typeof globe.pointOfView==='function')globe.pointOfView({lat:28,lng:6,altitude:2.5},0);
  }
  addEventListener('resize',doResize);
  requestAnimationFrame(doResize);
  setTimeout(doResize, 150);

  // Start in network mode
  switchToNetwork();

  // Network stats
  document.getElementById('heroCountries').textContent=DATA.meta.countries;
  document.getElementById('heroCorridors').textContent=DATA.meta.corridors;
  document.getElementById('mInter').textContent=fmtShort(DATA.meta.interCountryVol);
  document.getElementById('mMapped').textContent=DATA.meta.mappedPct+'%';
  document.getElementById('legnote').textContent=`${fmtShort(DATA.meta.liveTotal)} live orders · ${DATA.meta.countries} countries · ${DATA.meta.corridors} corridors · test excluded`;
  netCountUp(DATA.meta.liveTotal);

  // Research mode ready
  renderLegend();initFilters();afterFilter();

  // Ignite network arcs then remove loader
  setTimeout(()=>{
    document.getElementById('loader').classList.add('hide');
    setTimeout(()=>document.getElementById('loader').remove(),700);
    // arcs already loaded by switchToNetwork(); netIgnite() removed
  },900);

  // Globe mode toggle
  const networkSwitch=document.getElementById('globeSwitchNetwork');
  if(networkSwitch)networkSwitch.addEventListener('click',()=>{if(currentMode!=='network')switchToNetwork();});
  const researchSwitch=document.getElementById('globeSwitchResearch');
  if(researchSwitch)researchSwitch.addEventListener('click',()=>{if(currentMode!=='research')switchToResearch();});

  // Network flow controls
  const cAll=document.getElementById('cAll'),cCross=document.getElementById('cCross'),
        cFlows=document.getElementById('cFlows'),cRotate=document.getElementById('cRotate');
  cAll.onclick=()=>{netArcMode='all';cAll.classList.add('active');cCross.classList.remove('active');netApplyArcs();};
  cCross.onclick=()=>{netArcMode='cross';cCross.classList.add('active');cAll.classList.remove('active');netApplyArcs();};
  cFlows.onclick=()=>{netFlowsOn=!netFlowsOn;cFlows.textContent=netFlowsOn?'Hide flows':'Show flows';cFlows.classList.toggle('active',!netFlowsOn);cAll.classList.toggle('active',netFlowsOn&&netArcMode==='all');cCross.classList.toggle('active',netFlowsOn&&netArcMode==='cross');netApplyArcs();};
  cRotate.onclick=()=>{netSpin=!netSpin;ctrl.autoRotate=netSpin;cRotate.textContent=netSpin?'Pause spin':'Resume spin';};
}
/* Research mode polygon handlers, chat bot, and ISO mapping */
let hoverFeat=null;
function handleHover(f,prev){if(prev)prev.__hover=false;if(hoverFeat&&hoverFeat!==f)hoverFeat.__hover=false;hoverFeat=f;document.getElementById('globeViz').style.cursor=f?'pointer':'grab';if(f)f.__hover=true;refreshGlobe();if(!f)hideTooltip();}
document.getElementById('globeViz').addEventListener('mousemove',e=>{if(hoverFeat&&!officeLayerCalastone&&!officeLayerSSC)showTooltip(hoverFeat,e.clientX,e.clientY);else hideTooltip();});
function handleClick(f){if(!f)return;if(officeLayerCalastone||officeLayerSSC)return;selectedISO=featISO(f);const c=centroid(f);if(c)globe.pointOfView({lat:c.lat,lng:c.lng,altitude:1.7},1100);refreshGlobe();openDrawer(f);if(EDIT_MODE)console.log('Record:',recordFor(f)||('No profile for '+featISO(f)));}
addEventListener('keydown',e=>{if(e.key==='Escape'){if(document.getElementById('modalVeil').classList.contains('open')){closeModal();return;}closeDrawer();document.getElementById('filterPanel').classList.remove('open');document.getElementById('filterBtn').classList.remove('active');}});

/* ================================================================
   =====================   AI CHATBOT   =========================
   ================================================================
   Floating assistant on the main page. Uses the same API key/model.
   It is given a compact summary of all country data as context so it
   can answer questions about your research, plus general questions. */

const CHAT_SYSTEM_PROMPT = `You are the Atlas Assistant inside Phaeron's Global Order-Routing Atlas, a tool about mutual fund order-routing infrastructure by country.

You may be given a CONTEXT block summarising the countries currently profiled in the app (hub status, scores, key facts). Use it when the user asks about specific markets or comparisons. You can also answer general questions using your own knowledge.

Be concise and factual. Spell out acronyms in full on first use with the abbreviation in brackets. When you are unsure or the app's data does not cover something, say so plainly rather than inventing figures. Use short paragraphs; use **bold** sparingly for key terms.`;

let CHAT_HISTORY=[];           // [{role, content}]
let chatBusy=false;

function chatContextSummary(){
  // Build a compact, token-efficient summary of profiled countries.
  const rows=Object.values(COUNTRY_DATA).map(r=>
    `${r.country} (${r.iso3}): ${r.market_classification}, ${r.central_hub_status}; opp ${r.opportunity_score}, automation ${r.automation_rate_estimate}%, ${r.priority_tier}; ${r.dominant_order_model}`
  );
  return 'CONTEXT — profiled markets in the app:\n'+rows.join('\n');
}

const chatFab=document.getElementById('chatFab');
const chatPanel=document.getElementById('chatPanel');
const chatLog=document.getElementById('chatLog');
const chatInput=document.getElementById('chatInput');
const chatSend=document.getElementById('chatSend');

function openChat(){
  chatPanel.classList.add('open'); chatFab.classList.add('hidden');
  if(!CHAT_HISTORY.length){
    chatLog.innerHTML=`<div class="chat-welcome">Hi — I'm the <b>Atlas Assistant</b>.<br>Ask me about any market's order-routing setup, compare countries, or anything else.</div>`;
  }
  setTimeout(()=>chatInput.focus(),50);
}
function closeChat(){ chatPanel.classList.remove('open'); chatFab.classList.remove('hidden'); }
function clearChat(){ CHAT_HISTORY=[]; chatLog.innerHTML=`<div class="chat-welcome">Conversation cleared. Ask me anything.</div>`; }

chatFab.addEventListener('click',openChat);
document.getElementById('chatClose').addEventListener('click',closeChat);
document.getElementById('chatClear').addEventListener('click',clearChat);

chatInput.addEventListener('input',()=>{ chatInput.style.height='auto'; chatInput.style.height=Math.min(chatInput.scrollHeight,90)+'px'; });
chatInput.addEventListener('keydown',e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendChat(); } });
chatSend.addEventListener('click',sendChat);

function addMsg(role, text){
  const d=document.createElement('div'); d.className='chat-msg '+role;
  d.innerHTML = role==='bot' ? renderChatMarkdown(text) : escapeHtml(text);
  chatLog.appendChild(d);
  if(role!=='bot') chatLog.scrollTop=chatLog.scrollHeight;
  return d;
}
function scrollMessageToTop(message){
  const logTop=chatLog.getBoundingClientRect().top;
  const messageTop=message.getBoundingClientRect().top;
  chatLog.scrollTop += messageTop-logTop-18;
}
// light markdown for bot replies: bold, code, line breaks
function renderChatMarkdown(s){
  return escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/`([^`]+)`/g,'<code>$1</code>');
}

async function sendChat(){
  if(chatBusy) return;
  const text=chatInput.value.trim(); if(!text) return;
  if(ANTHROPIC_API_KEY==='PASTE-YOUR-KEY-HERE' || !ANTHROPIC_API_KEY){
    addMsg('bot','No API key is set in the file, so I can\u2019t answer yet.'); return;
  }
  // clear welcome on first message
  if(!CHAT_HISTORY.length){ chatLog.innerHTML=''; }
  addMsg('user',text);
  chatInput.value=''; chatInput.style.height='auto';
  CHAT_HISTORY.push({role:'user', content:text});

  chatBusy=true; chatSend.disabled=true;
  const typing=document.createElement('div'); typing.className='chat-typing';
  typing.innerHTML='<span></span><span></span><span></span>'; chatLog.appendChild(typing); chatLog.scrollTop=chatLog.scrollHeight;

  try{
    // Send the context as a system addendum + the running history (cap to last 12 turns).
    const sys = CHAT_SYSTEM_PROMPT + '\n\n' + chatContextSummary();
    const msgs = CHAT_HISTORY.slice(-12);
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'content-type':'application/json',
        'x-api-key':ANTHROPIC_API_KEY,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({ model:CLAUDE_MODEL, max_tokens:1024, system:sys, messages:msgs })
    });
    typing.remove();
    if(!res.ok){
      let detail=''; try{ const j=await res.json(); detail=j.error?.message||''; }catch(_){}
      const e=document.createElement('div'); e.className='chat-err'; e.textContent='Error '+res.status+(detail?(' — '+detail):''); chatLog.appendChild(e);
    } else {
      const data=await res.json();
      const reply=(data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n').trim() || '(no reply)';
      const replyEl=addMsg('bot',reply);
      // Long replies should open at their beginning so they read naturally.
      scrollMessageToTop(replyEl);
      CHAT_HISTORY.push({role:'assistant', content:reply});
    }
  }catch(err){
    typing.remove();
    const e=document.createElement('div'); e.className='chat-err'; e.textContent='Network error — '+(err.message||'request failed'); chatLog.appendChild(e);
  }finally{
    chatBusy=false; chatSend.disabled=false; chatInput.focus();
  }
}

/* NAME -> ISO3 (world-atlas exposes only country names) */
const NAME_TO_ISO={
  "United Kingdom":"GBR","Australia":"AUS","Brazil":"BRA","Singapore":"SGP","Hong Kong":"HKG",
  "Japan":"JPN","United States of America":"USA","United States":"USA","Luxembourg":"LUX","India":"IND",
  "Germany":"DEU","South Africa":"ZAF","United Arab Emirates":"ARE","Switzerland":"CHE",
  "France":"FRA","Italy":"ITA","Spain":"ESP","Netherlands":"NLD","Ireland":"IRL","Canada":"CAN",
  "Mexico":"MEX","China":"CHN","South Korea":"KOR","Taiwan":"TWN","Thailand":"THA","Malaysia":"MYS",
  "Indonesia":"IDN","Philippines":"PHL","Vietnam":"VNM","New Zealand":"NZL","Sweden":"SWE","Norway":"NOR",
  "Denmark":"DNK","Finland":"FIN","Belgium":"BEL","Austria":"AUT","Portugal":"PRT","Poland":"POL",
  "Saudi Arabia":"SAU","Qatar":"QAT","Israel":"ISR","Turkey":"TUR","Egypt":"EGY","Nigeria":"NGA",
  "Kenya":"KEN","Argentina":"ARG","Chile":"CHL","Colombia":"COL","Peru":"PER",
  "Romania":"ROU","Pakistan":"PAK"
};

init();

/* ================================================================
   OFFICE LAYER — Phaeron & SS&C switchable globe overlays
   ================================================================
   To update office data: edit CALASTONE_OFFICES or SSC_OFFICES below.
   Each entry: { company, name, city, country, address, lat, lng }
   lat/lng are WGS-84 decimal degrees.
   ================================================================ */

const CALASTONE_OFFICES = [
  {company:'Phaeron',name:'London HQ',city:'London',country:'United Kingdom',
   address:'Level 6, Citypoint, 1 Ropemaker Street, London EC2Y 9AW',lat:51.5190,lng:-0.0937},
  {company:'Phaeron',name:'Luxembourg office',city:'Bertrange',country:'Luxembourg',
   address:'33 Rue du puits Romain, Bertrange',lat:49.6166,lng:6.0972},
  {company:'Phaeron',name:'New York office',city:'New York',country:'United States',
   address:'590 Madison Ave, New York, NY',lat:40.7617,lng:-73.9717},
  {company:'Phaeron',name:'Singapore office',city:'Singapore',country:'Singapore',
   address:'8 Marina View, Singapore',lat:1.2800,lng:103.8509},
  {company:'Phaeron',name:'Hong Kong office',city:'Hong Kong',country:'Hong Kong',
   address:'Unit 1001, 10/F Lippo Centre, Tower 2, 89 Queensway',lat:22.2769,lng:114.1718},
  {company:'Phaeron',name:'Taipei office',city:'Taipei',country:'Taiwan',
   address:'Walsin Xinyi Building 11/F, No. 1, Songzhi Road, Taipei',lat:25.0337,lng:121.5630},
  {company:'Phaeron',name:'Sydney office',city:'Sydney',country:'Australia',
   address:'301/45 Lime St, Sydney NSW',lat:-33.8697,lng:151.2001},
  {company:'Phaeron',name:'Denver office',city:'Denver',country:'United States',
   lat:39.7392,lng:-104.9903},
];

const SSC_OFFICES = [
  /* United States */
  {company:'SS&C',name:'Atlanta',city:'Atlanta',country:'United States',lat:33.7490,lng:-84.3880},
  {company:'SS&C',name:'Bellevue',city:'Bellevue',country:'United States',lat:47.6101,lng:-122.2015},
  {company:'SS&C',name:'Boston',city:'Boston',country:'United States',lat:42.3601,lng:-71.0589},
  {company:'SS&C',name:'Braintree',city:'Braintree',country:'United States',lat:42.2084,lng:-71.0023},
  {company:'SS&C',name:'Bridgeton',city:'Bridgeton',country:'United States',lat:38.8475,lng:-90.1437},
  {company:'SS&C',name:'Chicago',city:'Chicago',country:'United States',lat:41.8781,lng:-87.6298},
  {company:'SS&C',name:'Dallas',city:'Dallas',country:'United States',lat:32.7767,lng:-96.7970},
  {company:'SS&C',name:'Denver',city:'Denver',country:'United States',lat:39.7392,lng:-104.9903},
  {company:'SS&C',name:'Dublin (OH)',city:'Dublin',country:'United States',lat:40.1120,lng:-83.1141},
  {company:'SS&C',name:'Edina',city:'Edina',country:'United States',lat:44.8797,lng:-93.3499},
  {company:'SS&C',name:'Evansville',city:'Evansville',country:'United States',lat:37.9716,lng:-87.5711},
  {company:'SS&C',name:'Fort Worth',city:'Fort Worth',country:'United States',lat:32.7555,lng:-97.3308},
  {company:'SS&C',name:'Garden City',city:'Garden City',country:'United States',lat:40.7268,lng:-73.6335},
  {company:'SS&C',name:'Jacksonville',city:'Jacksonville',country:'United States',lat:30.3322,lng:-81.6557},
  {company:'SS&C',name:'Kansas City',city:'Kansas City',country:'United States',lat:39.0997,lng:-94.5786},
  {company:'SS&C',name:'Kaysville',city:'Kaysville',country:'United States',lat:41.0352,lng:-111.9383},
  {company:'SS&C',name:'Los Angeles',city:'Los Angeles',country:'United States',lat:34.0522,lng:-118.2437},
  {company:'SS&C',name:'New York',city:'New York',country:'United States',lat:40.7128,lng:-74.0060},
  {company:'SS&C',name:'Sacramento',city:'Sacramento',country:'United States',lat:38.5816,lng:-121.4944},
  {company:'SS&C',name:'San Antonio',city:'San Antonio',country:'United States',lat:29.4241,lng:-98.4936},
  {company:'SS&C',name:'San Francisco',city:'San Francisco',country:'United States',lat:37.7749,lng:-122.4194},
  {company:'SS&C',name:'Sandy Hook',city:'Sandy Hook',country:'United States',lat:40.4696,lng:-74.0099},
  {company:'SS&C',name:'Skillman',city:'Skillman',country:'United States',lat:40.4221,lng:-74.6643},
  {company:'SS&C',name:'Stamford',city:'Stamford',country:'United States',lat:41.0534,lng:-73.5387},
  {company:'SS&C',name:'Union',city:'Union',country:'United States',lat:40.6976,lng:-74.2693},
  {company:'SS&C',name:'Waltham',city:'Waltham',country:'United States',lat:42.3765,lng:-71.2356},
  {company:'SS&C',name:'White Plains',city:'White Plains',country:'United States',lat:41.0340,lng:-73.7629},
  {company:'SS&C',name:'Yorktown Heights',city:'Yorktown Heights',country:'United States',lat:41.2701,lng:-73.7929},
  /* United Kingdom */
  {company:'SS&C',name:'Basildon',city:'Basildon',country:'United Kingdom',lat:51.5757,lng:0.4882},
  {company:'SS&C',name:'Belfast',city:'Belfast',country:'United Kingdom',lat:54.5973,lng:-5.9301},
  {company:'SS&C',name:'Bolton',city:'Bolton',country:'United Kingdom',lat:53.5780,lng:-2.4282},
  {company:'SS&C',name:'Bracknell',city:'Bracknell',country:'United Kingdom',lat:51.4144,lng:-0.7537},
  {company:'SS&C',name:'Bristol',city:'Bristol',country:'United Kingdom',lat:51.4545,lng:-2.5879},
  {company:'SS&C',name:'Burnley',city:'Burnley',country:'United Kingdom',lat:53.7890,lng:-2.2486},
  {company:'SS&C',name:'Chelmsford',city:'Chelmsford',country:'United Kingdom',lat:51.7356,lng:0.4685},
  {company:'SS&C',name:'Lichfield',city:'Lichfield',country:'United Kingdom',lat:52.6836,lng:-1.8271},
  {company:'SS&C',name:'London',city:'London',country:'United Kingdom',lat:51.5195,lng:-0.0932},
  {company:'SS&C',name:'Stirling',city:'Stirling',country:'United Kingdom',lat:56.1165,lng:-3.9369},
  {company:'SS&C',name:'Surbiton',city:'Surbiton',country:'United Kingdom',lat:51.3944,lng:-0.3060},
  {company:'SS&C',name:'Warrington',city:'Warrington',country:'United Kingdom',lat:53.3900,lng:-2.5970},
  /* Australia */
  {company:'SS&C',name:'Brisbane',city:'Brisbane',country:'Australia',lat:-27.4698,lng:153.0251},
  {company:'SS&C',name:'Hobart',city:'Hobart',country:'Australia',lat:-42.8821,lng:147.3272},
  {company:'SS&C',name:'Melbourne',city:'Melbourne',country:'Australia',lat:-37.8136,lng:144.9631},
  {company:'SS&C',name:'Newcastle West',city:'Newcastle West',country:'Australia',lat:-32.9283,lng:151.7817},
  {company:'SS&C',name:'Parramatta',city:'Parramatta',country:'Australia',lat:-33.8148,lng:151.0017},
  {company:'SS&C',name:'Sydney',city:'Sydney',country:'Australia',lat:-33.8688,lng:151.2093},
  {company:'SS&C',name:'Wollongong',city:'Wollongong',country:'Australia',lat:-34.4278,lng:150.8931},
  /* India */
  {company:'SS&C',name:'Bangalore',city:'Bangalore',country:'India',lat:12.9716,lng:77.5946},
  {company:'SS&C',name:'Gandhinagar',city:'Gandhinagar',country:'India',lat:23.2156,lng:72.6369},
  {company:'SS&C',name:'Gurugram',city:'Gurugram',country:'India',lat:28.4595,lng:77.0266},
  {company:'SS&C',name:'Hyderabad',city:'Hyderabad',country:'India',lat:17.3850,lng:78.4867},
  {company:'SS&C',name:'Mumbai',city:'Mumbai',country:'India',lat:19.0760,lng:72.8777},
  {company:'SS&C',name:'Pune',city:'Pune',country:'India',lat:18.5204,lng:73.8567},
  {company:'SS&C',name:'Thane',city:'Thane',country:'India',lat:19.2183,lng:72.9781},
  /* Canada */
  {company:'SS&C',name:'Halifax',city:'Halifax',country:'Canada',lat:44.6488,lng:-63.5752},
  {company:'SS&C',name:'Kitchener',city:'Kitchener',country:'Canada',lat:43.4516,lng:-80.4925},
  {company:'SS&C',name:'Montreal',city:'Montreal',country:'Canada',lat:45.5017,lng:-73.5673},
  {company:'SS&C',name:'Toronto',city:'Toronto',country:'Canada',lat:43.6532,lng:-79.3832},
  /* China */
  {company:'SS&C',name:'Beijing',city:'Beijing',country:'China',lat:39.9042,lng:116.4074},
  {company:'SS&C',name:'Shanghai',city:'Shanghai',country:'China',lat:31.2304,lng:121.4737},
  /* Germany */
  {company:'SS&C',name:'Frankfurt',city:'Frankfurt',country:'Germany',lat:50.1109,lng:8.6821},
  {company:'SS&C',name:'Munich',city:'Munich',country:'Germany',lat:48.1351,lng:11.5820},
  /* United Arab Emirates */
  {company:'SS&C',name:'Abu Dhabi',city:'Abu Dhabi',country:'United Arab Emirates',lat:24.4539,lng:54.3773},
  {company:'SS&C',name:'Dubai',city:'Dubai',country:'United Arab Emirates',lat:25.2048,lng:55.2708},
  /* Rest of world — one or two cities each */
  {company:'SS&C',name:'Amsterdam',city:'Amsterdam',country:'Netherlands',lat:52.3676,lng:4.9041},
  {company:'SS&C',name:'Bangkok',city:'Bangkok',country:'Thailand',lat:13.7563,lng:100.5018},
  {company:'SS&C',name:'Bucharest',city:'Bucharest',country:'Romania',lat:44.4268,lng:26.1025},
  {company:'SS&C',name:'Copenhagen',city:'Copenhagen',country:'Denmark',lat:55.6761,lng:12.5683},
  {company:'SS&C',name:'Dublin',city:'Dublin',country:'Ireland',lat:53.3498,lng:-6.2603},
  {company:'SS&C',name:'Hong Kong',city:'Hong Kong',country:'Hong Kong',lat:22.2760,lng:114.1720},
  {company:'SS&C',name:'Johannesburg',city:'Johannesburg',country:'South Africa',lat:-26.2041,lng:28.0473},
  {company:'SS&C',name:'Karachi',city:'Karachi',country:'Pakistan',lat:24.8607,lng:67.0011},
  {company:'SS&C',name:'Kuala Lumpur',city:'Kuala Lumpur',country:'Malaysia',lat:3.1390,lng:101.6869},
  {company:'SS&C',name:'Luxembourg',city:'Luxembourg',country:'Luxembourg',lat:49.6117,lng:6.1319},
  {company:'SS&C',name:'Madrid',city:'Madrid',country:'Spain',lat:40.4168,lng:-3.7038},
  {company:'SS&C',name:'Mexico City',city:'Mexico City',country:'Mexico',lat:19.4326,lng:-99.1332},
  {company:'SS&C',name:'Milan',city:'Milan',country:'Italy',lat:45.4654,lng:9.1859},
  {company:'SS&C',name:'Oslo',city:'Oslo',country:'Norway',lat:59.9139,lng:10.7522},
  {company:'SS&C',name:'Paris',city:'Paris',country:'France',lat:48.8566,lng:2.3522},
  {company:'SS&C',name:'Riyadh',city:'Riyadh',country:'Saudi Arabia',lat:24.6877,lng:46.7219},
  {company:'SS&C',name:'Sao Paulo',city:'Sao Paulo',country:'Brazil',lat:-23.5505,lng:-46.6333},
  {company:'SS&C',name:'Seoul',city:'Seoul',country:'South Korea',lat:37.5665,lng:126.9780},
  {company:'SS&C',name:'Singapore',city:'Singapore',country:'Singapore',lat:1.3521,lng:103.8198},
  {company:'SS&C',name:'Stockholm',city:'Stockholm',country:'Sweden',lat:59.3293,lng:18.0686},
  {company:'SS&C',name:'Taipei City',city:'Taipei City',country:'Taiwan',lat:25.0330,lng:121.5654},
  {company:'SS&C',name:'Tokyo',city:'Tokyo',country:'Japan',lat:35.6762,lng:139.6503},
  {company:'SS&C',name:'Vienna',city:'Vienna',country:'Austria',lat:48.2082,lng:16.3738},
  {company:'SS&C',name:'Zurich',city:'Zurich',country:'Switzerland',lat:47.3769,lng:8.5417},
  /* Small territories — pins shown, may not appear as globe polygons */
  {company:'SS&C',name:'Bermuda',city:'Bermuda',country:'Bermuda',lat:32.3078,lng:-64.7505},
  {company:'SS&C',name:'Grand Cayman',city:'Grand Cayman',country:'Cayman Islands',lat:19.3133,lng:-81.2546},
  {company:'SS&C',name:'St. Helier',city:'St. Helier',country:'Jersey',lat:49.1858,lng:-2.1064},
];

/* ---- build ISO3 presence sets from office arrays + name→ISO mapping ---- */
CALASTONE_ISO3 = new Set(CALASTONE_OFFICES.map(o=>NAME_TO_ISO[o.country]).filter(Boolean));
SSC_ISO3 = new Set(SSC_OFFICES.map(o=>NAME_TO_ISO[o.country]).filter(Boolean));

/* ---- marker element factory ---- */
function createOfficePin(office) {
  const isCal = office.company === 'Phaeron';
  const el = document.createElement('div');
  el.className = 'office-pin ' + (isCal ? 'cal-pin' : 'ssc-pin');
  el.setAttribute('aria-label', office.name + ', ' + office.city);
  el.setAttribute('tabindex', '0');
  el.innerHTML =
    '<div class="pin-dot"></div>' +
    '<div class="pin-stem"></div>' +
    '<div class="pin-label">' + office.city + '</div>';

  function showTip(e) {
    const tip = document.getElementById('officeTip');
    const addrHtml = office.address
      ? '<div class="ott-addr">' + office.address + '</div>' : '';
    tip.innerHTML =
      '<div class="ott-co ' + (isCal ? 'cal' : 'ssc') + '">' + office.company + '</div>' +
      '<div class="ott-city">' + office.city + '</div>' +
      '<div class="ott-country">' + office.country + '</div>' +
      '<div class="ott-name">' + office.name + '</div>' +
      addrHtml;

    /* position: above the marker, clamped to viewport */
    const rect = el.getBoundingClientRect();
    const TW = 220, TH = office.address ? 130 : 90;
    let left = rect.left + rect.width / 2 - TW / 2;
    let top  = rect.top - TH - 10;
    if (left < 8) left = 8;
    if (left + TW > innerWidth - 8) left = innerWidth - TW - 8;
    if (top < 8) top = rect.bottom + 10;
    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
    tip.classList.add('show');
  }
  function hideTip() {
    document.getElementById('officeTip').classList.remove('show');
  }

  el.addEventListener('mouseenter', showTip);
  el.addEventListener('mouseleave', hideTip);
  el.addEventListener('focus',      showTip);
  el.addEventListener('blur',       hideTip);
  return el;
}

/* ---- apply layers to the globe ---- */
function applyOfficeLayers() {
  if (!globe) return;
  const data = [
    ...(officeLayerCalastone ? CALASTONE_OFFICES : []),
    ...(officeLayerSSC       ? SSC_OFFICES       : []),
  ];
  const anyActive = officeLayerCalastone || officeLayerSSC;

  /* Update polygon heatmap to show office presence when any layer is on */
  if (currentMode === 'network') {
    globe.pointsData(anyActive ? [] : window.CALASTONE_FLOWS.nodes);
    globe.polygonCapColor(anyActive ? officeHeatmapColor : f => netLandColor(f));
  } else if (currentMode === 'research') {
    refreshGlobe();
  }

  globe
    .htmlElementsData(data)
    .htmlLat(d => d.lat)
    .htmlLng(d => d.lng)
    .htmlElement(d => createOfficePin(d))
    .htmlAltitude(0.01);
}

/* ---- toggle listeners ---- */
document.getElementById('toggleCalastone').addEventListener('change', function() {
  officeLayerCalastone = this.checked;
  applyOfficeLayers();
});
document.getElementById('toggleSSC').addEventListener('change', function() {
  officeLayerSSC = this.checked;
  applyOfficeLayers();
});

/* ---- initialise the htmlElements layer (empty until toggled on) ---- */
applyOfficeLayers();

/* When returning to Network mode the original switchToNetwork restores
   pointsData(nodes). Wrap it so we re-apply the office layer state
   immediately after, keeping dots hidden if any office layer is active. */
const _baseSwitchToNetwork = switchToNetwork;
switchToNetwork = function() {
  _baseSwitchToNetwork.call(this);
  applyOfficeLayers();
  document.getElementById('officeLayerPanel').style.display='';
  window.hsHide&&window.hsHide();
  window._productNavShow&&window._productNavShow();
  const _orUI=document.getElementById('orderRoutingUI');if(_orUI)_orUI.style.display='none';
  const _orS=document.getElementById('orModeStrip');if(_orS)_orS.style.display='none';
  const _gc=document.getElementById('hcToggleBtn');if(_gc)_gc.style.display='';
  const _hub=document.querySelector('.pn-hex-hub');if(_hub)_hub.style.animation='';
};

const _baseSwitchToResearch = switchToResearch;
switchToResearch = function() {
  _baseSwitchToResearch.call(this);
  document.getElementById('officeLayerPanel').style.display='none';
  window.hsHide&&window.hsHide();
  window._productNavShow&&window._productNavShow();
  const _orUI=document.getElementById('orderRoutingUI');if(_orUI)_orUI.style.display='none';
  const _orS=document.getElementById('orModeStrip');if(_orS)_orS.style.display='none';
  const _gc=document.getElementById('hcToggleBtn');if(_gc)_gc.style.display='';
  const _hub=document.querySelector('.pn-hex-hub');if(_hub)_hub.style.animation='';
};

/* ================================================================
   ============  HUB & SPOKE VISUALIZATION  =======================
   ================================================================ */
(function(){
  const W=860,H=640,CX=430,CY=320,R=25,RHUB=46,RING=226,SPREAD=50;
  const swatch={
    investor:'#3d8dbc',distributor:'#5a7fa8',
    fundmanager:'#2ea39b',transferagent:'#1c4d6a',custodian:'#56a773',
  };
  const GROUPS=[
    {role:'investor',     label:'Investors',       angle:-90, lx:0,   ly:-64, anchor:'middle'},
    {role:'fundmanager',  label:'Fund Managers',   angle:-18, lx:66,  ly:0,   anchor:'start' },
    {role:'transferagent',label:'Transfer Agents', angle:54,  lx:26,  ly:62,  anchor:'middle'},
    {role:'custodian',    label:'Custodians',      angle:126, lx:-26, ly:62,  anchor:'middle'},
    {role:'distributor',  label:'Distributors',    angle:198, lx:-66, ly:0,   anchor:'end'   },
  ];
  const rad=d=>(d*Math.PI)/180;
  GROUPS.forEach(g=>{
    const base=rad(g.angle);
    g.gx=CX+RING*Math.cos(base);g.gy=CY+RING*Math.sin(base);
    const tan=base+Math.PI/2;
    g.nodes=[-1,0,1].map(k=>({role:g.role,x:g.gx+k*SPREAD*Math.cos(tan),y:g.gy+k*SPREAD*Math.sin(tan)}));
  });
  const NODES=GROUPS.flatMap(g=>g.nodes);
  const MESH=[];
  for(let i=0;i<NODES.length;i++)for(let j=i+1;j<NODES.length;j++){
    if(NODES[i].role===NODES[j].role)continue;
    if((i*7+j*13)%10<7)MESH.push([NODES[i],NODES[j]]);
  }

  let isAfter=false, hovered=null, autoMode=false, autoTimer=null, svgReady=false;
  let activeAnims=[];
  const svgNS='http://www.w3.org/2000/svg';
  function hexPts(r){const w=(Math.sqrt(3)/2)*r;return`0,${-r} ${w},${-r/2} ${w},${r/2} 0,${r} ${-w},${r/2} ${-w},${-r/2}`;}
  const $=id=>document.getElementById(id);
  const ns=(tag,attrs)=>{const e=document.createElementNS(svgNS,tag);if(attrs)Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e;};

  // ---- SVG built once on first open ----
  function buildSVG(){
    const container=$('hs-diagram');if(!container)return;
    const svg=ns('svg',{viewBox:`0 0 ${W} ${H}`,id:'hs-svg'});
    svg.style.cssText='width:100%;height:100%;display:block;overflow:visible';

    const defs=ns('defs');
    defs.innerHTML=`
      <radialGradient id="hg-bg-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(159,18,57,0.42)"/>
        <stop offset="100%" stop-color="rgba(159,18,57,0)"/>
      </radialGradient>
      <linearGradient id="hg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1B3A6B"/>
        <stop offset="100%" stop-color="#35b57e"/>
      </linearGradient>
      <filter id="hg-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#22323d" flood-opacity="0.22"/>
      </filter>
      <filter id="hg-glow-fil" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`;
    svg.appendChild(defs);

    // mesh lines — fully visible in "before" state
    const meshG=ns('g',{id:'hs-mesh-g'});
    MESH.forEach(([a,b],i)=>{
      const ln=ns('line',{id:`hs-m${i}`,x1:a.x,y1:a.y,x2:b.x,y2:b.y,'data-ra':a.role,'data-rb':b.role,stroke:'#b9c5cf','stroke-width':'1.2'});
      ln.style.opacity='0.65';
      meshG.appendChild(ln);
    });
    svg.appendChild(meshG);

    // animated pulses — travel along every mesh line in both directions
    const pulseG=ns('g',{id:'hs-pulse-g'});
    pulseG.style.cssText='pointer-events:none;opacity:1;transition:opacity 0.35s ease';
    MESH.forEach(([a,b])=>{
      [
        {fx:a.x,fy:a.y,tx:b.x,ty:b.y,col:swatch[a.role]},
        {fx:b.x,fy:b.y,tx:a.x,ty:a.y,col:swatch[b.role]},
      ].forEach(({fx,fy,tx,ty,col},pi)=>{
        const dur=(1.1+Math.random()*1.3).toFixed(2);
        const begin=(Math.random()*parseFloat(dur)).toFixed(2);
        const pg=ns('g',{opacity:'0'});
        const mot=document.createElementNS(svgNS,'animateMotion');
        mot.setAttribute('path',`M ${fx} ${fy} L ${tx} ${ty}`);
        mot.setAttribute('dur',`${dur}s`);
        mot.setAttribute('repeatCount','indefinite');
        mot.setAttribute('begin',`${begin}s`);
        mot.setAttribute('calcMode','linear');
        mot.setAttribute('rotate','auto');
        pg.appendChild(mot);
        pg.appendChild(ns('ellipse',{rx:'7',ry:'2.5',fill:col}));
        const opA=document.createElementNS(svgNS,'animate');
        opA.setAttribute('attributeName','opacity');
        opA.setAttribute('values','0;0.92;0.92;0');
        opA.setAttribute('keyTimes','0;0.1;0.88;1');
        opA.setAttribute('dur',`${dur}s`);
        opA.setAttribute('repeatCount','indefinite');
        opA.setAttribute('begin',`${begin}s`);
        pg.appendChild(opA);
        pulseG.appendChild(pg);
      });
    });
    svg.appendChild(pulseG);

    // hub glow — hidden initially
    const glow=ns('circle',{id:'hs-hub-glow',cx:CX,cy:CY,r:145,fill:'url(#hg-bg-glow)'});
    glow.style.opacity='0';
    svg.appendChild(glow);

    // spokes — hidden initially (dashoffset = full length)
    const spokeG=ns('g',{id:'hs-spoke-g'});
    NODES.forEach((n,i)=>{
      const len=Math.hypot(n.x-CX,n.y-CY);
      const ln=ns('line',{id:`hs-s${i}`,x1:CX,y1:CY,x2:n.x,y2:n.y,'data-role':n.role,'data-len':len,stroke:'#1B3A6B','stroke-width':'1.8','stroke-linecap':'round','stroke-dasharray':len,'stroke-dashoffset':len});
      ln.style.opacity='0';
      spokeG.appendChild(ln);
    });
    svg.appendChild(spokeG);

    // node hexagons — always visible, CSS transitions handle scale on hover
    const nodeG=ns('g',{id:'hs-node-g'});
    NODES.forEach((n,i)=>{
      const g=ns('g',{id:`hs-n${i}`,'data-role':n.role,transform:`translate(${n.x},${n.y})`});
      g.style.cssText='cursor:pointer;transition:opacity 0.18s ease';
      const poly=ns('polygon',{points:hexPts(R),fill:swatch[n.role],filter:'url(#hg-shadow)'});
      poly.style.cssText='transform-origin:0px 0px;transform:scale(1);transition:transform 0.22s cubic-bezier(0.34,1.56,0.64,1),filter 0.18s';
      g.appendChild(poly);
      g.addEventListener('mouseenter',()=>{hovered=n.role;applyHover();});
      g.addEventListener('mouseleave',()=>{hovered=null;applyHover();});
      nodeG.appendChild(g);
    });
    svg.appendChild(nodeG);

    // labels
    const labelG=ns('g');
    GROUPS.forEach(g=>{
      const t=ns('text',{x:g.gx+g.lx,y:g.gy+g.ly,'text-anchor':g.anchor,'dominant-baseline':'middle'});
      t.style.cssText='font:700 16px -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,sans-serif;fill:#0f2230;pointer-events:none';
      t.textContent=g.label;
      labelG.appendChild(t);
    });
    svg.appendChild(labelG);

    // hub: outer group positions to centre; inner group drives the scale animation
    const hubOuter=ns('g',{id:'hs-hub-g'});
    hubOuter.style.transform=`translate(${CX}px,${CY}px)`;
    const hubInner=ns('g',{id:'hs-hub-inner'});
    hubInner.style.cssText='transform:scale(0);transform-origin:0px 0px;opacity:0';
    hubInner.appendChild(ns('polygon',{points:hexPts(RHUB),fill:'#0a0f14',stroke:'#1B3A6B','stroke-width':'2.5',filter:'url(#hg-shadow)'}));
    const hubT=ns('text',{x:0,y:0,'text-anchor':'middle','dominant-baseline':'middle'});
    hubT.style.cssText='font:800 13px -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,sans-serif;letter-spacing:0.12em;fill:#fff;pointer-events:none';
    hubT.textContent='PHAERON';
    hubInner.appendChild(hubT);
    hubOuter.appendChild(hubInner);
    svg.appendChild(hubOuter);

    container.innerHTML='';container.appendChild(svg);
    svgReady=true;
  }

  // ---- cancel all running anime.js instances ----
  function cancelAnims(){
    activeAnims.forEach(a=>{try{a&&a.pause&&a.pause();}catch(e){}});
    activeAnims=[];
  }

  // helper: anime.js state object driven via onUpdate callback
  function anim(state,params){
    const animate=window._hsAnimate;
    if(!animate)return null;
    const inst=animate(state,params);
    if(inst)activeAnims.push(inst);
    return inst;
  }

  // ---- BEFORE → AFTER ----
  function transitionToAfter(){
    if(!svgReady)return;
    isAfter=true;cancelAnims();hovered=null;applyHover();

    const meshEls=[...document.querySelectorAll('[id^="hs-m"]')];
    const hubInner=$('hs-hub-inner');
    const hubGlow=$('hs-hub-glow');

    // 0. Pulses fade out immediately as mesh starts dissolving
    const pg=$('hs-pulse-g');if(pg){const ps={op:parseFloat(pg.style.opacity||'1')};anim(ps,{op:0,duration:280,ease:'outQuad',onUpdate:()=>pg.style.opacity=ps.op,onComplete:()=>pg.style.opacity='0'});}

    // 1. Mesh lines scatter-dissolve with randomised delays (0–320ms window)
    meshEls.forEach(el=>{
      const s={op:parseFloat(el.style.opacity||'0.65')};
      anim(s,{op:0,duration:300,delay:Math.random()*320,ease:'outQuad',
        onUpdate:()=>el.style.opacity=s.op,
        onComplete:()=>el.style.opacity='0'});
    });

    // 2. Hub glow blooms in
    const gs={op:0};
    anim(gs,{op:0.9,duration:600,delay:280,ease:'outCubic',
      onUpdate:()=>hubGlow.style.opacity=gs.op,
      onComplete:()=>hubGlow.style.opacity='0.9'});

    // 3. Hub hexagon springs up from centre — outBack overshoot
    const hs={s:0,op:0};
    anim(hs,{s:1,op:1,duration:780,delay:340,ease:'outBack(1.7)',
      onUpdate:()=>{hubInner.style.transform=`scale(${hs.s})`;hubInner.style.opacity=hs.op;},
      onComplete:()=>{hubInner.style.transform='scale(1)';hubInner.style.opacity='1';}});

    // 4. Spokes draw out from hub in a circular sweep (grouped by role, 52ms apart)
    NODES.forEach((n,i)=>{
      const el=$(`hs-s${i}`);if(!el)return;
      const len=parseFloat(el.getAttribute('data-len'));
      const ss={d:len,op:0};
      anim(ss,{d:0,op:0.9,duration:520,delay:620+i*52,ease:'inOutCubic',
        onUpdate:()=>{el.setAttribute('stroke-dashoffset',ss.d);el.style.opacity=ss.op;},
        onComplete:()=>{el.setAttribute('stroke-dashoffset','0');el.style.opacity='0.9';}});
    });

    updateUI();
  }

  // ---- AFTER → BEFORE ----
  function transitionToBefore(){
    if(!svgReady)return;
    isAfter=false;cancelAnims();hovered=null;applyHover();

    const meshEls=[...document.querySelectorAll('[id^="hs-m"]')];
    const hubInner=$('hs-hub-inner');
    const hubGlow=$('hs-hub-glow');

    // 1. Spokes retract back to hub — staggered in reverse circular order
    NODES.forEach((n,i)=>{
      const el=$(`hs-s${i}`);if(!el)return;
      const len=parseFloat(el.getAttribute('data-len'));
      const curD=parseFloat(el.getAttribute('stroke-dashoffset')||'0');
      const curOp=parseFloat(el.style.opacity||'0.9');
      const ss={d:curD,op:curOp};
      const delay=(NODES.length-1-i)*38;
      anim(ss,{d:len,op:0,duration:340,delay,ease:'inCubic',
        onUpdate:()=>{el.setAttribute('stroke-dashoffset',ss.d);el.style.opacity=ss.op;},
        onComplete:()=>{el.setAttribute('stroke-dashoffset',len);el.style.opacity='0';}});
    });

    // 2. Hub hexagon contracts inward
    const curS=parseFloat(hubInner.style.transform.replace(/[^0-9.]/g,'')||'1');
    const hs={s:curS,op:parseFloat(hubInner.style.opacity||'1')};
    anim(hs,{s:0,op:0,duration:420,delay:260,ease:'inBack(1.4)',
      onUpdate:()=>{hubInner.style.transform=`scale(${hs.s})`;hubInner.style.opacity=hs.op;},
      onComplete:()=>{hubInner.style.transform='scale(0)';hubInner.style.opacity='0';}});

    // 3. Hub glow fades
    const gs={op:parseFloat(hubGlow.style.opacity||'0.9')};
    anim(gs,{op:0,duration:380,delay:200,ease:'outQuad',
      onUpdate:()=>hubGlow.style.opacity=gs.op,
      onComplete:()=>hubGlow.style.opacity='0'});

    // 4. Mesh lines materialise with randomised delays (500–800ms window)
    meshEls.forEach(el=>{
      el.style.opacity='0';
      const s={op:0};
      anim(s,{op:0.65,duration:380,delay:500+Math.random()*300,ease:'outQuad',
        onUpdate:()=>el.style.opacity=s.op,
        onComplete:()=>el.style.opacity='0.65'});
    });

    // 5. Pulses fade back in once mesh has settled
    const pg2=$('hs-pulse-g');if(pg2){const ps={op:0};anim(ps,{op:1,duration:450,delay:860,ease:'outQuad',onUpdate:()=>pg2.style.opacity=ps.op,onComplete:()=>pg2.style.opacity='1'});}

    updateUI();
  }

  // ---- hover: only touches visual properties, never restarts animations ----
  function applyHover(){
    MESH.forEach(([a,b],i)=>{
      const ln=$(`hs-m${i}`);if(!ln)return;
      const hit=hovered&&(hovered===a.role||hovered===b.role);
      ln.setAttribute('stroke',hovered?(hit?swatch[hovered]:'#b9c5cf'):'#b9c5cf');
      ln.setAttribute('stroke-width',hovered&&hit?'2.5':'1.2');
      if(hovered)ln.style.opacity=hit?'0.9':'0.07';
      else if(!isAfter)ln.style.opacity='0.65';
    });
    NODES.forEach((n,i)=>{
      const ln=$(`hs-s${i}`);if(!ln)return;
      const active=hovered===n.role;
      ln.setAttribute('stroke',active?swatch[n.role]:'#9F1239');
      ln.setAttribute('stroke-width',active?'3.5':'1.8');
      if(hovered&&isAfter)ln.style.opacity=active?'1':'0.07';
    });
    NODES.forEach((n,i)=>{
      const g=$(`hs-n${i}`);if(!g)return;
      const active=hovered===n.role;
      g.style.opacity=hovered&&!active?'0.2':'1';
      const poly=g.querySelector('polygon');
      if(poly){poly.style.transform=active?'scale(1.3)':'scale(1)';poly.setAttribute('filter',active?'url(#hg-glow-fil)':'url(#hg-shadow)');}
    });
    const list=$('hs-role-list');
    if(list)[...list.children].forEach(item=>{
      const role=item.dataset.role;
      item.style.background=hovered===role?`${swatch[role]}22`:'';
      item.style.fontWeight=hovered===role?'700':'';
    });
  }

  function updateUI(){
    if($('hs-stage-eyebrow'))$('hs-stage-eyebrow').textContent=isAfter?'After · one connection':'Before · point-to-point';
    if($('hs-side-eyebrow'))$('hs-side-eyebrow').textContent=isAfter?'After · fund distribution':'Before · the problem';
    if($('hs-side-before'))$('hs-side-before').style.display=isAfter?'none':'block';
    if($('hs-side-after'))$('hs-side-after').style.display=isAfter?'block':'none';
    const bb=$('hs-btn-before'),ba=$('hs-btn-after');
    if(bb){bb.classList.toggle('active',!isAfter);ba.classList.toggle('active',isAfter);}
    if($('hs-btn-auto'))$('hs-btn-auto').classList.toggle('active',autoMode);
  }

  function restartTimer(){
    clearInterval(autoTimer);if(!autoMode)return;
    autoTimer=setInterval(()=>isAfter?transitionToBefore():transitionToAfter(),3500);
  }

  function hsShow(){
    if(!svgReady)buildSVG();
    isAfter=false;updateUI();restartTimer();
    const list=$('hs-role-list');
    if(list&&!list.children.length){
      GROUPS.forEach(g=>{
        const item=document.createElement('div');
        item.className='hs-role-item';item.dataset.role=g.role;
        item.style.transition='background 0.18s,font-weight 0.1s';
        item.innerHTML=`<span class="hs-role-swatch" style="background:${swatch[g.role]}"></span>${g.label}`;
        item.addEventListener('mouseenter',()=>{hovered=g.role;applyHover();});
        item.addEventListener('mouseleave',()=>{hovered=null;applyHover();});
        list.appendChild(item);
      });
    }
  }

  function hsHide(){
    cancelAnims();clearInterval(autoTimer);hovered=null;
    const overlay=$('hubSpokeUI');if(overlay)overlay.classList.remove('hs-open');
    const btn=$('globeSwitchHubSpoke');if(btn)btn.classList.remove('active');
    const olp=$('officeLayerPanel');if(olp)olp.style.display='';
  }

  window._hsShow=hsShow;window.hsHide=hsHide;

  function wireButtons(){
    const bb=$('hs-btn-before'),ba=$('hs-btn-after'),bAuto=$('hs-btn-auto');
    if(bb)bb.onclick=()=>{autoMode=false;restartTimer();if(isAfter)transitionToBefore();};
    if(ba)ba.onclick=()=>{autoMode=false;restartTimer();if(!isAfter)transitionToAfter();};
    if(bAuto)bAuto.onclick=()=>{autoMode=!autoMode;restartTimer();updateUI();};
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',wireButtons);}
  else{wireButtons();}
})();

function switchToHubSpoke(){
  currentMode='hubspoke';
  const _orUI=document.getElementById('orderRoutingUI');if(_orUI)_orUI.style.display='none';
  document.getElementById('networkUI').style.display='none';
  document.getElementById('researchUI').style.display='none';
  document.getElementById('researchTopbarControls').style.display='none';
  toggleActiveClass('globeSwitchNetwork', false);
  toggleActiveClass('globeSwitchResearch', false);
  toggleActiveClass('globeSwitchHubSpoke', true);
  document.getElementById('topbarSub').textContent='Network Architecture';
  document.getElementById('hubSpokeUI').classList.add('hs-open');
  document.getElementById('officeLayerPanel').style.display='none';
  const _gc=document.getElementById('hcToggleBtn');if(_gc)_gc.style.display='none';
  const _hub=document.querySelector('.pn-hex-hub');if(_hub)_hub.style.animation='';
  window._productNavShow&&window._productNavShow();
  if(ctrl)ctrl.autoRotate=false;
  hideNetTip();document.body.style.cursor='';
  window._hsShow&&window._hsShow();
}

function switchToOrderRouting(){
  currentMode='orderrouting';
  document.getElementById('networkUI').style.display='none';
  document.getElementById('researchUI').style.display='none';
  document.getElementById('researchTopbarControls').style.display='none';
  document.getElementById('hubSpokeUI').classList.remove('hs-open');
  toggleActiveClass('globeSwitchNetwork', false);
  toggleActiveClass('globeSwitchResearch', false);
  toggleActiveClass('globeSwitchHubSpoke', false);
  document.getElementById('topbarSub').textContent='Order Routing';
  window._productNavShow&&window._productNavShow();
  window.hsHide&&window.hsHide();
  document.getElementById('officeLayerPanel').style.display='none';
  const _gc=document.getElementById('hcToggleBtn');if(_gc)_gc.style.display='none';
  // Stop pn-breathe filter animation — filter:brightness repaints cause iframe lag
  const _hub=document.querySelector('.pn-hex-hub');if(_hub)_hub.style.animation='none';
  if(ctrl)ctrl.autoRotate=false;
  hideNetTip();document.body.style.cursor='';

  const ui=document.getElementById('orderRoutingUI');if(!ui)return;
  const frame=document.getElementById('orFlowFrame');
  const indicator=document.getElementById('orLoadingIndicator');

  // Push content below the outer fixed topbar
  const tb=document.querySelector('.topbar');
  ui.style.paddingTop=(tb?tb.offsetHeight:60)+'px';

  // Poll for dc-root (DC component renders into it). Once found, show the
  // mode strip and sync its active-button state with the component's default.
  function watchForComponent(){
    let tries=0;
    function attempt(){
      try{
        const doc=frame.contentDocument||frame.contentWindow.document;
        const comp=frame.contentWindow&&frame.contentWindow.__dcComp;
        if(doc.getElementById('dc-root')&&comp){
          const strip=document.getElementById('orModeStrip');
          if(strip)strip.style.display='flex';
          window._orSetMode(window._orCurrentProduct||'settlement');
          window._orWatchExploreMode();
          return;
        }
      }catch(e){}
      if(++tries<70)setTimeout(attempt,100);
    }
    attempt();
  }

  if(frame&&!frame._orLoaded){
    frame.onload=function(){
      frame._orLoaded=true;
      if(indicator)indicator.style.display='none';
      frame.style.display='block';
      watchForComponent();
    };
    frame.src='Order Routing Flow - standalone.html';
  }else if(frame&&frame._orLoaded){
    if(indicator)indicator.style.display='none';
    frame.style.display='block';
    const strip=document.getElementById('orModeStrip');
    if(strip)strip.style.display='flex';
    window._orSetMode('settlement');
  }

  // CSS fade-in — GPU-accelerated opacity only, no translateY to avoid jank
  ui.style.transition='none';
  ui.style.opacity='0';
  ui.style.display='flex';
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      ui.style.transition='opacity 0.35s ease';
      ui.style.opacity='1';
    });
  });
}

/* ---- Order Routing mode selector ---- */
window._orCurrentProduct='settlement'; // track for step bar
window._orActiveStep=null;

window._orBuildStepBar=function(maxStep){
  const bar=document.getElementById('orStepBar');
  if(!bar)return;
  // Remove old buttons (keep the STEP label span)
  while(bar.children.length>1)bar.removeChild(bar.lastChild);
  for(let n=1;n<=maxStep;n++){
    (function(num){
      const btn=document.createElement('button');
      btn.id='orStep'+num;
      btn.textContent=num;
      btn.title='Step '+num;
      btn.onclick=function(){ window._orClickStep(num); };
      btn.style.cssText='width:26px;height:26px;border-radius:50%;border:1px solid #e3e9ef;background:#fff;color:#566571;font:700 10px/1 -apple-system,sans-serif;cursor:pointer;flex-shrink:0;transition:background .12s,color .12s,box-shadow .12s;';
      bar.appendChild(btn);
    })(n);
  }
};

window._orClickStep=function(n){
  window._orSetActiveStep(n);
  try{
    const frame=document.getElementById('orFlowFrame');
    const comp=frame&&frame.contentWindow&&frame.contentWindow.__dcComp;
    if(comp)comp.clickStep(n);
  }catch(e){}
};

window._orSetActiveStep=function(n){
  window._orActiveStep=n;
  for(let i=1;i<=12;i++){
    const b=document.getElementById('orStep'+i);
    if(!b)continue;
    if(i===n){
      b.style.background='#1B3A6B'; b.style.color='#fff';
      b.style.border='none'; b.style.boxShadow='0 0 0 3px rgba(15,184,156,.22)';
    }else{
      b.style.background='#fff'; b.style.color='#566571';
      b.style.border='1px solid #e3e9ef'; b.style.boxShadow='none';
    }
  }
};

window._orSetMode=function(mode){
  window._orCurrentProduct=mode;
  window._orActiveStep=null;
  const frame=document.getElementById('orFlowFrame');
  const btnR=document.getElementById('orBtnRoute');
  const btnS=document.getElementById('orBtnSettle');
  function on(b){ b.style.background='#fff'; b.style.color='#0d1418'; b.style.boxShadow='0 1px 3px rgba(0,0,0,.12)'; }
  function off(b){ b.style.background='transparent'; b.style.color='#8a98a3'; b.style.boxShadow='none'; }
  if(mode==='route'){ if(btnR)on(btnR); if(btnS)off(btnS); }
  else               { if(btnS)on(btnS); if(btnR)off(btnR); }
  // Rebuild step bar with correct count
  window._orBuildStepBar(mode==='route'?6:12);
  try{
    const comp=frame&&frame.contentWindow&&frame.contentWindow.__dcComp;
    if(comp){ mode==='route'?comp.setRoute():comp.setSettlement(); }
  }catch(e){}
};

// Show step bar only when iframe is in Explore mode; poll after component is ready
window._orWatchExploreMode=function(){
  const frame=document.getElementById('orFlowFrame');
  const bar=document.getElementById('orStepBar');
  let tries=0;
  function check(){
    try{
      const comp=frame&&frame.contentWindow&&frame.contentWindow.__dcComp;
      if(comp){
        const inExplore=comp.state&&comp.state.mode==='explore';
        if(bar)bar.style.display=inExplore?'flex':'none';
        // Sync active step highlight with component state
        const active=comp.state?comp.state.hovered:null;
        if(active!==window._orActiveStep)window._orSetActiveStep(active);
      }
    }catch(e){}
    setTimeout(check,400);
  }
  check();
};

/* ================================================================
   ============  SETTLEMENTS GLOBE MODE  ==========================
   ================================================================ */
let settFlowsOn=true, settArcMode='all', settSpin=true;
let settMouse={x:0,y:0};
let settNodeById={};
let settMeta={};

const SETT_CAPITALS={
  'JP':{lat:35.6762,lng:139.6503},'GB':{lat:51.5074,lng:-0.1278},'US':{lat:38.8951,lng:-77.0364},
  'BE':{lat:50.8503,lng:4.3517},'LU':{lat:49.6117,lng:6.1319},'AU':{lat:-35.2809,lng:149.1300},
  'IE':{lat:53.3498,lng:-6.2603},'GR':{lat:37.9838,lng:23.7275},'NL':{lat:52.3676,lng:4.9041},
  'ES':{lat:40.4168,lng:-3.7038},'MY':{lat:3.1390,lng:101.6869},'SG':{lat:1.3521,lng:103.8198},
  'HK':{lat:22.3193,lng:114.1694},'SE':{lat:59.3293,lng:18.0686}
};
const DOMESTIC_CITIES={
  'GB':[{n:'London',lat:51.5074,lng:-0.1278},{n:'Manchester',lat:53.4808,lng:-2.2426},
        {n:'Birmingham',lat:52.4862,lng:-1.8904},{n:'Edinburgh',lat:55.9533,lng:-3.1883},
        {n:'Bristol',lat:51.4545,lng:-2.5879},{n:'Leeds',lat:53.8008,lng:-1.5491}],
  'AU':[{n:'Sydney',lat:-33.8688,lng:151.2093},{n:'Melbourne',lat:-37.8136,lng:144.9631},
        {n:'Perth',lat:-31.9505,lng:115.8605},{n:'Brisbane',lat:-27.4698,lng:153.0251},
        {n:'Canberra',lat:-35.2809,lng:149.1300},{n:'Adelaide',lat:-34.9285,lng:138.6007}],
  'SG':[{n:'Central',lat:1.2966,lng:103.8520},{n:'Jurong',lat:1.3329,lng:103.7436},
        {n:'Tampines',lat:1.3540,lng:103.9454},{n:'Woodlands',lat:1.4382,lng:103.7890},
        {n:'Changi',lat:1.3644,lng:103.9915}]
};
const DOMESTIC_PAIRS={
  'GB':[[0,1],[1,3],[0,2],[3,4],[5,0],[2,5]],
  'AU':[[0,1],[2,4],[3,0],[1,5],[0,2],[4,3]],
  'SG':[[0,1],[2,3],[0,4],[1,2]]
};

function buildSettData(){
  const D=window.CALASTONE_SETTLEMENTS;
  const arcs=D.arcs;
  const nodeMap={};
  arcs.forEach(function(a){
    if(!nodeMap[a.fromIso]){const fromCap=SETT_CAPITALS[a.fromIso]||{lat:a.startLat,lng:a.startLng};nodeMap[a.fromIso]={id:a.fromIso,name:a.from,lat:a.startLat,lng:a.startLng,capLat:fromCap.lat,capLng:fromCap.lng,total:0,positions:0,amountGBP:0};}
    if(!nodeMap[a.toIso]){const toCap=SETT_CAPITALS[a.toIso]||{lat:a.endLat,lng:a.endLng};nodeMap[a.toIso]={id:a.toIso,name:a.to,lat:a.endLat,lng:a.endLng,capLat:toCap.lat,capLng:toCap.lng,total:0,positions:0,amountGBP:0};}
    nodeMap[a.fromIso].total+=a.trades;
    nodeMap[a.fromIso].positions+=a.positions;
    nodeMap[a.fromIso].amountGBP+=a.amountGBP;
    if(!a.domestic){
      nodeMap[a.toIso].total+=a.trades;
      nodeMap[a.toIso].positions+=a.positions;
      nodeMap[a.toIso].amountGBP+=a.amountGBP;
    }
  });
  D.nodes=Object.values(nodeMap);
  let totalTrades=0,totalPositions=0,totalGBP=0,maxArc=0,maxNode=0;
  arcs.forEach(function(a){totalTrades+=a.trades;totalPositions+=a.positions;totalGBP+=a.amountGBP;if(a.trades>maxArc)maxArc=a.trades;});
  D.nodes.forEach(function(n){if(n.total>maxNode)maxNode=n.total;});
  const uniqueCountries=Object.keys(nodeMap).length;
  const crossBorderCorridors=arcs.filter(function(a){return !a.domestic;}).length;
  D.meta={totalTrades:totalTrades,totalPositions:totalPositions,totalGBP:totalGBP,activeCountries:uniqueCountries,crossBorderCorridors:crossBorderCorridors,maxArc:maxArc,maxNode:maxNode};
  // Build display arcs: cross-border use capital coords; domestic expand to city pairs
  D.displayArcs=[];
  arcs.forEach(function(a){
    if(!a.domestic){
      const from=SETT_CAPITALS[a.fromIso]||{lat:a.startLat,lng:a.startLng};
      const to=SETT_CAPITALS[a.toIso]||{lat:a.endLat,lng:a.endLng};
      a._sLat=from.lat; a._sLng=from.lng; a._eLat=to.lat; a._eLng=to.lng;
      D.displayArcs.push(a);
    } else {
      const cities=DOMESTIC_CITIES[a.fromIso];
      const pairs=DOMESTIC_PAIRS[a.fromIso];
      if(cities&&pairs){
        pairs.forEach(function(p){
          const f=cities[p[0]],t=cities[p[1]];
          D.displayArcs.push({from:a.from,to:a.to,fromIso:a.fromIso,toIso:a.toIso,
            trades:a.trades,positions:a.positions,amountGBP:a.amountGBP,pairs:a.pairs,domestic:true,
            _sLat:f.lat,_sLng:f.lng,_eLat:t.lat,_eLng:t.lng,_fromCity:f.n,_toCity:t.n});
        });
      } else {
        const cap=SETT_CAPITALS[a.fromIso]||{lat:a.startLat,lng:a.startLng};
        a._sLat=cap.lat; a._sLng=cap.lng-2.2; a._eLat=cap.lat; a._eLng=cap.lng+2.2;
        D.displayArcs.push(a);
      }
    }
  });
}

function fmtSett(n){if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return Math.round(n/1e3)+'K';return String(Math.round(n));}
function fmtGBP(n){if(n>=1e12)return'£'+(n/1e12).toFixed(2)+'T';if(n>=1e9)return'£'+(n/1e9).toFixed(1)+'B';if(n>=1e6)return'£'+(n/1e6).toFixed(1)+'M';if(n>=1e3)return'£'+Math.round(n/1e3)+'K';if(n>=1)return'£'+Math.round(n);return'£'+n.toFixed(4);}
function settArcRGB(t){return[Math.round(45+(0-45)*t),Math.round(154+(148-154)*t),Math.round(142+(110-142)*t)];}
function settArcColor(d){const D=window.CALASTONE_SETTLEMENTS;const t=Math.sqrt(d.trades/D.meta.maxArc);const rgb=settArcRGB(t);return'rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+(0.5+0.45*t)+')';}
function settNodeColor(f){const n=settNodeById[f.properties.iso2];if(!n)return'rgba(214,224,232,0.92)';const D=window.CALASTONE_SETTLEMENTS;const t=Math.pow(n.total/D.meta.maxNode,0.45);const base=[233,242,247],k=0.2+0.8*t;const cr=base[0]+(45-base[0])*k,cg=base[1]+(154-base[1])*k,cb=base[2]+(142-base[2])*k;const dark=1-0.4*t;return'rgba('+Math.round(cr*dark)+','+Math.round(cg*dark)+','+Math.round(cb*dark)+',0.96)';}
function posSettTip(){const tip=document.getElementById('settTooltip');if(!tip||!tip.style.opacity||tip.style.opacity==='0')return;const w=tip.offsetWidth,h=tip.offsetHeight,x=settMouse.x,y=settMouse.y;let left=x-w/2,top=y-h-10;if(left<8)left=8;if(left+w>innerWidth-8)left=innerWidth-8-w;if(top<8)top=y+16;tip.style.transform='none';tip.style.left=left+'px';tip.style.top=top+'px';}
function hideSettTip(){const tip=document.getElementById('settTooltip');if(tip)tip.style.opacity='0';}

function settNodeTip(n){
  const D=window.CALASTONE_SETTLEMENTS;
  const tip=document.getElementById('settTooltip');if(!tip)return;
  const nodeArcs=D.arcs.filter(function(a){return (a.fromIso===n.id||a.toIso===n.id)&&!a.domestic;});
  const corridors=nodeArcs.length;
  const totalPairs=nodeArcs.reduce(function(s,a){return s+a.pairs;},0);
  const domArc=D.arcs.filter(function(a){return a.fromIso===n.id&&a.domestic;})[0];
  const outs=D.arcs.filter(function(a){return a.fromIso===n.id&&!a.domestic;}).sort(function(x,y){return y.trades-x.trades;}).slice(0,3);
  const ins=D.arcs.filter(function(a){return a.toIso===n.id&&!a.domestic&&a.fromIso!==n.id;}).sort(function(x,y){return y.trades-x.trades;}).slice(0,3);
  const outRows=outs.map(function(a){return'<div class="tt-fl"><span class="n">&#8594; '+a.to+'</span><span class="v">'+fmtSett(a.trades)+'&thinsp;·&thinsp;'+fmtGBP(a.amountGBP)+'</span></div>';}).join('');
  const inRows=ins.map(function(a){return'<div class="tt-fl"><span class="n">&#8592; '+a.from+'</span><span class="v">'+fmtSett(a.trades)+'&thinsp;·&thinsp;'+fmtGBP(a.amountGBP)+'</span></div>';}).join('');
  const domTag=domArc?'<span class="tt-tag">domestic</span>':'';
  const statsHtml='<div class="tt-stats">'
    +'<div class="tt-stat"><div class="k">Trades</div><div class="v">'+fmtSett(n.total)+'</div></div>'
    +'<div class="tt-stat"><div class="k">Positions</div><div class="v">'+fmtSett(n.positions)+'</div></div>'
    +'<div class="tt-stat"><div class="k">Corridors</div><div class="v">'+corridors+'</div></div>'
    +'<div class="tt-stat"><div class="k">Counterparties</div><div class="v">'+totalPairs+'</div></div>'
    +'</div>';
  const domHtml=domArc?'<div class="tt-flows"><div class="h">Domestic settlement</div>'
    +'<div class="tt-fl"><span class="n">Trades</span><span class="v">'+fmtSett(domArc.trades)+'</span></div>'
    +'<div class="tt-fl"><span class="n">Positions</span><span class="v">'+fmtSett(domArc.positions)+'</span></div>'
    +'<div class="tt-fl"><span class="n">Value settled</span><span class="v">'+fmtGBP(domArc.amountGBP)+'</span></div>'
    +'<div class="tt-fl"><span class="n">Counterparties</span><span class="v">'+domArc.pairs+' pair'+(domArc.pairs>1?'s':'')+'</span></div>'
    +'</div>':'';
  tip.innerHTML='<div class="tt-route">'+n.name+domTag+'</div>'
    +'<div class="tt-big">'+fmtGBP(n.amountGBP)+'</div>'
    +'<div class="tt-sub">total value settled</div>'
    +statsHtml
    +(outRows?'<div class="tt-flows"><div class="h">Top outflows</div>'+outRows+'</div>':'')
    +(inRows?'<div class="tt-flows"><div class="h">Top inflows</div>'+inRows+'</div>':'')
    +domHtml;
  tip.style.opacity='1';posSettTip();
}
function settArcTip(a){
  const tip=document.getElementById('settTooltip');if(!tip)return;
  const route=a.domestic
    ?(a._fromCity&&a._toCity?a._fromCity+' <span style="color:var(--teal)">&#8594;</span> '+a._toCity+' <span class="tt-tag">'+a.from+'</span>':'<span style="color:var(--teal)">&#8635;</span> '+a.from+' domestic')
    :a.from+' <span style="color:var(--teal)">&#8594;</span> '+a.to;
  tip.innerHTML='<div class="tt-route">'+route+'</div><div class="tt-big">'+fmtSett(a.trades)+'</div><div class="tt-sub">'+fmtSett(a.positions)+' positions &middot; '+fmtGBP(a.amountGBP)+' &middot; '+a.pairs+' pair'+(a.pairs>1?'s':'')+'</div>';
  tip.style.opacity='1';posSettTip();
}

function settApplyArcs(){
  const D=window.CALASTONE_SETTLEMENTS;if(!D||!D.displayArcs)return;
  if(!settFlowsOn){globe.arcsData([]);return;}
  globe.arcsData(D.displayArcs.filter(function(a){return !a.domestic;}));
}

function settCountUp(target){
  const el=document.getElementById('settHeroCount');if(!el)return;
  const dur=1500,t0=performance.now();
  function tick(now){
    const p=Math.min(1,(now-t0)/dur);
    const e=1-Math.pow(1-p,3);
    el.innerHTML=fmtSett(Math.round(target*e))+'<span class="unit">trades</span>';
    if(p<1)requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function switchToSettlements(){
  // Build derived data the first time
  if(!window.CALASTONE_SETTLEMENTS.meta){buildSettData();}
  const D=window.CALASTONE_SETTLEMENTS;

  // Build node lookup
  settNodeById={};
  D.nodes.forEach(function(n){settNodeById[n.id]=n;});

  currentMode='settlements';
  const _orUI=document.getElementById('orderRoutingUI');if(_orUI)_orUI.style.display='none';
  const _orS=document.getElementById('orModeStrip');if(_orS)_orS.style.display='none';
  document.getElementById('officeLayerPanel').style.display='none';
  const _gc=document.getElementById('hcToggleBtn');if(_gc)_gc.style.display='';
  const _hub=document.querySelector('.pn-hex-hub');if(_hub)_hub.style.animation='';
  document.getElementById('networkUI').style.display='none';
  document.getElementById('researchUI').style.display='none';
  document.getElementById('researchTopbarControls').style.display='none';
  document.getElementById('settlementsUI').style.display='';
  toggleActiveClass('globeSwitchNetwork', false);
  toggleActiveClass('globeSwitchResearch', false);
  toggleActiveClass('globeSwitchHubSpoke', false);
  document.getElementById('topbarSub').textContent='Settlements · 2025';
  hideNetTip();hideSettTip();document.body.style.cursor='';

  // Globe aesthetic
  try{const m=globe.globeMaterial();if(m.color&&m.color.set)m.color.set('#d4e8ee');if(m.emissive&&m.emissive.set){m.emissive.set('#c8e0e8');m.emissiveIntensity=0.6;}if('shininess'in m)m.shininess=0.3;m.needsUpdate=true;}catch(e){}

  globe
    .showAtmosphere(true).atmosphereColor('#4db8b0').atmosphereAltitude(0.18)
    .polygonsData(window.CALASTONE_GEO.features)
    .polygonCapColor(function(f){return settNodeColor(f);})
    .polygonSideColor(function(){return 'rgba(130,180,180,0.2)';})
    .polygonStrokeColor(function(){return 'rgba(159,18,57,0.3)';})
    .polygonAltitude(0.006).polygonsTransitionDuration(300)
    .pointsData(D.nodes)
    .pointLat(function(d){return d.capLat;}).pointLng(function(d){return d.capLng;})
    .pointColor(function(){return '#7A1233';}).pointAltitude(0.009)
    .pointRadius(function(d){return 0.25+1.1*Math.sqrt(d.total/D.meta.maxNode);})
    .pointResolution(14)
    .labelsData(D.nodes.filter(function(n){return n.total>5000;}))
    .labelLat(function(d){return d.capLat;}).labelLng(function(d){return d.capLng;})
    .labelText(function(d){return d.name;}).labelSize(0.9).labelDotRadius(0)
    .labelColor(function(){return 'rgba(26,122,114,0.9)';}).labelResolution(2).labelAltitude(0.012)
    .arcsData([])
    .arcStartLat(function(d){return d._sLat;}).arcStartLng(function(d){return d._sLng;})
    .arcEndLat(function(d){return d._eLat;}).arcEndLng(function(d){return d._eLng;})
    .arcAltitude(function(d){return d.domestic?0.1:null;})
    .arcColor(function(d){return settArcColor(d);})
    .arcStroke(function(d){return d.domestic?0.4:0.18+1.6*Math.sqrt(d.trades/D.meta.maxArc);})
    .arcAltitudeAutoScale(0.4)
    .arcDashLength(0.5).arcDashGap(0.55).arcDashInitialGap(function(){return Math.random();})
    .arcDashAnimateTime(function(d){return d.domestic?2800:Math.max(1600,5000-3000*Math.sqrt(d.trades/D.meta.maxArc));})
    .arcsTransitionDuration(0)
    .onPolygonHover(function(f){
      const n=f&&settNodeById[f.properties.iso2];
      document.body.style.cursor=n?'pointer':'';
      globe.polygonAltitude(function(ff){return ff===f&&n?0.02:0.006;});
      if(n){settNodeTip(n);if(ctrl)ctrl.autoRotate=false;}
      else{hideSettTip();if(ctrl&&settSpin)ctrl.autoRotate=true;}
    })
    .onPolygonClick(null)
    .onPointHover(function(n){document.body.style.cursor=n?'pointer':'';if(n){settNodeTip(n);if(ctrl)ctrl.autoRotate=false;}else{hideSettTip();if(ctrl&&settSpin)ctrl.autoRotate=true;}})
    .onArcHover(function(a){document.body.style.cursor=a?'pointer':'';if(a){settArcTip(a);if(ctrl)ctrl.autoRotate=false;}else{hideSettTip();if(ctrl&&settSpin)ctrl.autoRotate=true;}});

  settSpin=true;ctrl.autoRotate=true;ctrl.autoRotateSpeed=0.28;

  // Wire controls (idempotent)
  const sAll=document.getElementById('sAll'),sCross=document.getElementById('sCross');
  const sHide=document.getElementById('sHide'),sRotate=document.getElementById('sRotate');
  if(sAll&&!sAll.dataset.wired){
    sAll.dataset.wired='1';
    sAll.onclick=function(){settArcMode='all';sAll.classList.add('active');sCross.classList.remove('active');settApplyArcs();};
    sCross.onclick=function(){settArcMode='cross';sCross.classList.add('active');sAll.classList.remove('active');settApplyArcs();};
    sHide.onclick=function(){settFlowsOn=!settFlowsOn;sHide.textContent=settFlowsOn?'Hide flows':'Show flows';sHide.classList.toggle('active',!settFlowsOn);sAll.classList.toggle('active',settFlowsOn&&settArcMode==='all');sCross.classList.toggle('active',settFlowsOn&&settArcMode==='cross');settApplyArcs();};
    sRotate.onclick=function(){settSpin=!settSpin;ctrl.autoRotate=settSpin;sRotate.textContent=settSpin?'Pause spin':'Resume spin';};
  }

  // Stats
  const h=document.getElementById('settHeroCountries');if(h)h.textContent=D.meta.activeCountries;
  const c=document.getElementById('settHeroCorridors');if(c)c.textContent=D.meta.crossBorderCorridors;
  const p=document.getElementById('settPositions');if(p)p.textContent=fmtSett(D.meta.totalPositions);
  const cx=document.getElementById('settCross');if(cx)cx.textContent=D.meta.crossBorderCorridors;
  const gv=document.getElementById('settTotalGBP');if(gv)gv.textContent=fmtGBP(D.meta.totalGBP);
  const ln=document.getElementById('settLegnote');if(ln)ln.textContent=fmtSett(D.meta.totalTrades)+' trades · '+fmtGBP(D.meta.totalGBP)+' · '+D.meta.activeCountries+' countries';
  settCountUp(D.meta.totalTrades);

  // Mouse tracking for tooltip
  addEventListener('mousemove',function(e){settMouse={x:e.clientX,y:e.clientY};posSettTip();});

  // Apply arcs
  setTimeout(function(){settApplyArcs();},200);

  globe.pointOfView({lat:28,lng:6,altitude:2.5},800);
}

// Add hub-and-spoke button listener (runs after init() wires the others)
document.addEventListener('DOMContentLoaded',function(){
  const btn=document.getElementById('globeSwitchHubSpoke');
  if(btn)btn.addEventListener('click',()=>{if(currentMode!=='hubspoke')switchToHubSpoke();});
});

/* ===== PRODUCTS NAVIGATION (injected from index.html) ===== */
/* ===== PRODUCTS NAVIGATION ===== */
(function initProductNav(){
  'use strict';
  /* Hub geometry (pixels within the 280×440 container) */
  const HUB_CX=225, HUB_CY=220, RADIUS=145;
  const RAD=Math.PI/180;

  const PRODUCTS=[
    {id:'order-routing',            lines:['Order','Routing'],          angle:270, color:'#1B3A6B', colorD:'#132743', stroke:'rgba(27,58,107,0.5)'},
    {id:'settlements',              lines:['Settlements'],              angle:240, color:'#1B3A6B', colorD:'#7A1233', stroke:'rgba(27,58,107,0.5)'},
    {id:'share-class-conversions',  lines:['Share Class','Conversions'],angle:210, color:'#BE123C', colorD:'#4a9d5b', stroke:'rgba(27,58,107,0.5)'},
    {id:'transfers',                lines:['Transfers'],                angle:180, color:'#0d4a7a', colorD:'#0a3a60', stroke:'rgba(13,74,122,0.5)'},
    {id:'dividends',                lines:['Dividends'],                angle:150, color:'#6A4FA0', colorD:'#513c7a', stroke:'rgba(106,79,160,0.5)'},
    {id:'reporting',                lines:['Reporting'],                angle:120, color:'#B07C2C', colorD:'#8a6020', stroke:'rgba(176,124,44,0.5)'},
    {id:'cdsc',                     lines:['CDSC'],                     angle: 90, color:'#3B6EA5', colorD:'#2d5580', stroke:'rgba(59,110,165,0.5)'},
  ];

  const spokes=PRODUCTS.map(function(p){
    const a=p.angle*RAD;
    return Object.assign({},p,{cx:HUB_CX+RADIUS*Math.cos(a),cy:HUB_CY+RADIUS*Math.sin(a)});
  });

  let isOpen=false, closeTimer=null;
  const nodeEls=[], lineEls=[], activeAnims=[];

  function cancel(){
    activeAnims.forEach(function(a){try{a.pause();}catch(e){}});
    activeAnims.length=0;
  }

  function run(state,params){
    const fn=window._hsAnimate; if(!fn)return;
    const inst=fn(state,params); if(inst)activeAnims.push(inst); return inst;
  }

  function openNav(){
    clearTimeout(closeTimer);
    if(isOpen)return; isOpen=true;
    const nav=document.getElementById('productNav'); if(!nav)return;
    nav.classList.add('pn-open');
    nav.style.pointerEvents='auto';
    cancel();

    spokes.forEach(function(spoke,i){
      const el=nodeEls[i]; if(!el)return;
      el.classList.add('pn-active');
      const s={x:HUB_CX,y:HUB_CY,op:0,sc:0.2};
      run(s,{
        x:spoke.cx,y:spoke.cy,op:1,sc:1,
        duration:420,delay:i*50,ease:'outBack(1.4)',
        onUpdate:function(){
          el.style.left=s.x+'px'; el.style.top=s.y+'px';
          el.style.opacity=s.op;
          el.style.transform='translate(-50%,-50%) scale('+s.sc+')';
        },
        onComplete:function(){
          el.style.left=spoke.cx+'px'; el.style.top=spoke.cy+'px';
          el.style.opacity='1'; el.style.transform='translate(-50%,-50%) scale(1)';
        }
      });

      const ld=lineEls[i]; const ls={d:ld.len,op:0};
      run(ls,{
        d:0,op:0.55,duration:380,delay:80+i*40,ease:'outExpo',
        onUpdate:function(){ld.el.setAttribute('stroke-dashoffset',ls.d);ld.el.style.opacity=ls.op;},
        onComplete:function(){ld.el.setAttribute('stroke-dashoffset','0');ld.el.style.opacity='0.55';}
      });
    });
  }

  function closeNav(){
    if(!isOpen)return; isOpen=false;
    const nav=document.getElementById('productNav');
    if(nav){nav.classList.remove('pn-open');nav.style.pointerEvents='none';}
    cancel();

    const total=spokes.length;
    spokes.forEach(function(spoke,i){
      const el=nodeEls[i]; if(!el)return;
      el.classList.remove('pn-active');
      const s={x:spoke.cx,y:spoke.cy,op:1,sc:1};
      run(s,{
        x:HUB_CX,y:HUB_CY,op:0,sc:0.2,
        duration:280,delay:(total-1-i)*28,ease:'inBack(1.2)',
        onUpdate:function(){
          el.style.left=s.x+'px'; el.style.top=s.y+'px';
          el.style.opacity=s.op;
          el.style.transform='translate(-50%,-50%) scale('+s.sc+')';
        },
        onComplete:function(){
          el.style.left=HUB_CX+'px'; el.style.top=HUB_CY+'px';
          el.style.opacity='0'; el.style.transform='translate(-50%,-50%) scale(0.2)';
        }
      });

      const ld=lineEls[i]; const ls={d:0,op:0.55};
      run(ls,{
        d:ld.len,op:0,duration:200,delay:(total-1-i)*22,ease:'inExpo',
        onUpdate:function(){ld.el.setAttribute('stroke-dashoffset',ls.d);ld.el.style.opacity=ls.op;},
        onComplete:function(){ld.el.setAttribute('stroke-dashoffset',ld.len);ld.el.style.opacity='0';}
      });
    });
  }

  function init(){
    const nav=document.getElementById('productNav'); if(!nav)return;
    const svg=document.getElementById('pnLinesSvg');

    spokes.forEach(function(spoke,i){
      /* SVG connector line */
      const ln=document.createElementNS('http://www.w3.org/2000/svg','line');
      ln.setAttribute('x1',HUB_CX); ln.setAttribute('y1',HUB_CY);
      ln.setAttribute('x2',spoke.cx); ln.setAttribute('y2',spoke.cy);
      ln.setAttribute('stroke',spoke.stroke);
      ln.setAttribute('stroke-width','1.5');
      ln.setAttribute('stroke-linecap','round');
      const len=Math.hypot(spoke.cx-HUB_CX,spoke.cy-HUB_CY);
      ln.setAttribute('stroke-dasharray',len);
      ln.setAttribute('stroke-dashoffset',len);
      ln.style.opacity='0';
      svg.appendChild(ln);
      lineEls.push({el:ln,len:len});

      /* Spoke node */
      const node=document.createElement('div');
      node.className='pn-spoke-node';
      node.style.cssText='left:'+HUB_CX+'px;top:'+HUB_CY+'px;transform:translate(-50%,-50%) scale(0.2);opacity:0;';
      node.dataset.productId=spoke.id;
      node.setAttribute('role','button');
      node.setAttribute('aria-label',spoke.lines.join(' '));

      const hex=document.createElement('div');
      hex.className='pn-hex pn-hex-spoke';
      hex.style.background='linear-gradient(150deg,'+spoke.color+','+spoke.colorD+')';

      const txt=document.createElement('span');
      txt.className='pn-spoke-text';
      txt.innerHTML=spoke.lines.join('<br>');
      hex.appendChild(txt);
      node.appendChild(hex);
      nav.appendChild(node);
      nodeEls.push(node);

      node.addEventListener('click',function(){handleProductClick(spoke.id,spoke.lines.join(' '));});
    });

    /* Hub triggers open */
    const hub=document.getElementById('pnHub');
    if(hub)hub.addEventListener('mouseenter',openNav);

    /* Close when mouse fully leaves the container */
    nav.addEventListener('mouseleave',function(){closeTimer=setTimeout(closeNav,120);});
    nav.addEventListener('mouseenter',function(){clearTimeout(closeTimer);});

    nav.style.display='';
  }

  function handleProductClick(id,label){
    // ── Product Demo page (hub & spoke or order routing mode) ──────────
    if(currentMode==='hubspoke'||currentMode==='orderrouting'){
      if(id==='order-routing'){
        if(typeof switchToOrderRouting==='function')switchToOrderRouting();
        return;
      }
      // Return to hub & spoke overview for other products not yet implemented
      if(currentMode==='orderrouting'){
        if(typeof switchToHubSpoke==='function')switchToHubSpoke();
      }
      return;
    }
    // ── Network Overview page (globe modes) ────────────────────────────
    if(id==='settlements'){
      if(typeof switchToSettlements==='function')switchToSettlements();
      return;
    }
    if(id==='order-routing'){
      if(typeof switchToNetwork==='function')switchToNetwork();
      return;
    }
    console.log('[ProductNav] Selected:',id,label);
  }

  /* Expose for mode-switch wiring */
  window._productNavShow=function(){
    const nav=document.getElementById('productNav');
    if(nav)nav.style.display='';
  };
  window._productNavHide=function(){
    const nav=document.getElementById('productNav');
    if(!nav)return;
    if(isOpen)closeNav();
    nav.style.display='none';
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{
    init();
  }
})();

/* ===== URL PARAMETER MODE SWITCH ===== */
// Auto-switch mode from URL parameter: ?mode=research or ?mode=hubspoke
(function(){
  const p=new URLSearchParams(window.location.search);
  const m=p.get('mode');
  if(!m)return;
  function trySwitch(){
    if(m==='research'&&typeof switchToResearch==='function'){switchToResearch();return true;}
    if(m==='hubspoke'&&typeof switchToHubSpoke==='function'){switchToHubSpoke();return true;}
    return false;
  }
  window.addEventListener('load',function(){
    if(!trySwitch())setTimeout(trySwitch,600);
  });
})();
