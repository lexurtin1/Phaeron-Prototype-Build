const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function icons() {
  if (window.lucide) lucide.createIcons();
}

let toastTimer;
function toast(msg) {
  const msgEl = $('#toastMsg');
  const el = $('#toast');
  if (!msgEl || !el) return;
  msgEl.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

const TEMPLATES = [
  { id: 'report', label: 'Report', icon: 'file-bar-chart', blurb: 'Structured commercial report with KPIs and commentary.' },
  { id: 'powerpoint', label: 'PowerPoint', icon: 'presentation', blurb: 'Slide deck for leadership and client reviews.' },
  { id: 'spreadsheet', label: 'Spreadsheet', icon: 'table', blurb: 'Tabular workbook for pipeline and revenue cuts.' },
  { id: 'summary', label: 'Summary', icon: 'align-left', blurb: 'One-pager for account or market status.' },
  { id: 'tldr', label: 'TLDR report', icon: 'zap', blurb: 'Ultra-short brief with the decision and next step.' },
  { id: 'blank', label: 'Blank', icon: 'file', blurb: 'Start from an empty Phaeron-branded canvas.' },
];

const RECENT = [
  { id: 'r1', title: 'Opportunities Pipeline Report', tpl: 'report', when: '2 hours ago', owner: 'You' },
  { id: 'r2', title: 'Q3 Commercial TLDR', tpl: 'tldr', when: 'Yesterday', owner: 'You' },
  { id: 'r3', title: 'Presence ARR Summary', tpl: 'summary', when: '3 days ago', owner: 'You' },
  { id: 'r4', title: 'EMEA Pipeline Spreadsheet', tpl: 'spreadsheet', when: 'Last week', owner: 'You' },
];

const PIPELINE = [
  { name: 'Hargreaves Lansdowne — Platform', fund: 'Wealth', aum: 145, stage: 'Proposal Sent', prob: 55, value: 5200, close: '2026-07-01' },
  { name: 'FNZ Group — Connectivity', fund: 'Platform', aum: 210, stage: 'Negotiation', prob: 70, value: 4800, close: '2026-09-30' },
  { name: 'Pershing — API Consolidation', fund: 'Custody', aum: 320, stage: 'Proposal Sent', prob: 50, value: 2900, close: '2026-07-07' },
  { name: 'Transact — Network Discovery', fund: 'Platform', aum: 73, stage: 'Discovery', prob: 25, value: 1600, close: '2026-07-03' },
];

let activeTpl = 'report';
let charts = {};
let sortState = { k: null, dir: 0 };

function tplById(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

function fmtGBP(k) {
  return k >= 1000 ? '£' + (k / 1000).toFixed(2) + 'm' : '£' + k + 'k';
}

function nowStamp() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/* ── Landing ── */
function renderTplStrip() {
  const strip = $('#tplStrip');
  if (!strip) return;
  strip.innerHTML = TEMPLATES.map(
    (t) => `
    <button type="button" class="tpl-tile" data-tpl="${t.id}" role="listitem" title="${t.blurb}">
      <span class="ti"><i data-lucide="${t.icon}"></i></span>
      <span class="tn">${t.label}</span>
    </button>`
  ).join('');
  icons();
  $$('.tpl-tile').forEach((btn) =>
    btn.addEventListener('click', () => startCreate(btn.dataset.tpl, `Create a ${tplById(btn.dataset.tpl).label.toLowerCase()} for the commercial team.`))
  );
}

function renderRecent(filter = '') {
  const list = $('#recentList');
  if (!list) return;
  const q = filter.trim().toLowerCase();
  const rows = RECENT.filter((r) => !q || r.title.toLowerCase().includes(q) || r.tpl.includes(q));
  if (!rows.length) {
    list.innerHTML = `<div class="recent-empty">No artifacts match “${filter.replace(/</g, '&lt;')}”.</div>`;
    return;
  }
  list.innerHTML = rows
    .map((r) => {
      const t = tplById(r.tpl);
      return `
      <button type="button" class="recent-row" data-tpl="${r.tpl}" data-title="${r.title.replace(/"/g, '&quot;')}">
        <span class="recent-thumb"><i data-lucide="${t.icon}"></i></span>
        <span>
          <div class="recent-name">${r.title}</div>
          <div class="recent-meta">${t.label}</div>
        </span>
        <span class="recent-when">${r.when}</span>
        <span class="recent-owner">${r.owner}</span>
        <span class="recent-owner"><i data-lucide="star"></i></span>
      </button>`;
    })
    .join('');
  icons();
  $$('.recent-row').forEach((row) =>
    row.addEventListener('click', () => startCreate(row.dataset.tpl, `Open and refresh “${row.dataset.title}”.`))
  );
}

/* ── Workspace ── */
function showLanding() {
  $('#landingView').hidden = false;
  $('#workspaceView').hidden = true;
}

function showWorkspace() {
  $('#landingView').hidden = true;
  $('#workspaceView').hidden = false;
}

function appendMsg(role, html) {
  const thread = $('#wsThread');
  thread.insertAdjacentHTML(
    'beforeend',
    `<div class="msg ${role}"><div class="bubble">${html}</div><div class="stamp">${nowStamp()}</div></div>`
  );
  thread.scrollTop = thread.scrollHeight;
}

function startCreate(tplId, promptText) {
  activeTpl = tplId || 'report';
  const tpl = tplById(activeTpl);
  showWorkspace();
  $('#wsTplPill').textContent = tpl.label;
  $('#wsCanvasTitle').textContent = tpl.label;
  $('#wsThread').innerHTML = '';
  appendMsg('user', (promptText || '').replace(/</g, '&lt;'));
  appendMsg('assistant', `Building a <strong>${tpl.label}</strong> with the Phaeron Design System…`);
  generateArtifact(activeTpl);
}

function generateArtifact(tplId) {
  const out = $('#reportOutput');
  out.innerHTML = `
    <div class="report-skeleton">
      <div class="sk-label"><span class="sp"></span>Generating artifact…</div>
      <div class="sk sk-block"></div>
      <div class="sk-kpis"><div class="sk sk-kpi"></div><div class="sk sk-kpi"></div><div class="sk sk-kpi"></div><div class="sk sk-kpi"></div></div>
      <div class="sk sk-chart"></div>
    </div>`;
  setTimeout(() => {
    if (tplId === 'report') renderReport();
    else renderPlaceholder(tplId);
    appendMsg('assistant', 'Draft ready on the canvas. Ask me to tighten the narrative, swap KPIs, or export.');
  }, 1100);
}

function renderPlaceholder(tplId) {
  const out = $('#reportOutput');
  const tpl = tplById(tplId);
  if (tplId === 'powerpoint') {
    out.innerHTML = `
      <div class="ph-artifact">
        <div class="ph-eyebrow">PowerPoint · Phaeron Studio</div>
        <h2>Commercial narrative deck</h2>
        <p class="ph-lead">Five-slide skeleton for leadership. Replace speaker notes before circulating.</p>
        <div class="ph-slides">
          <div class="ph-slide"><div class="sn">Slide 01</div><div class="st">Title — Where we stand this quarter</div></div>
          <div class="ph-slide"><div class="sn">Slide 02</div><div class="st">Pipeline snapshot · £14.5m open</div></div>
          <div class="ph-slide"><div class="sn">Slide 03</div><div class="st">Risks &amp; concentrations</div></div>
          <div class="ph-slide"><div class="sn">Slide 04</div><div class="st">Asks of the room</div></div>
          <div class="ph-slide"><div class="sn">Slide 05</div><div class="st">Appendix · source systems</div></div>
        </div>
      </div>`;
  } else if (tplId === 'spreadsheet') {
    out.innerHTML = `
      <div class="ph-artifact">
        <div class="ph-eyebrow">Spreadsheet · Phaeron Studio</div>
        <h2>Pipeline workbook</h2>
        <p class="ph-lead">Flat export ready for Finance. Values in £k.</p>
        <div class="ph-sheet">
          <table>
            <thead><tr><th>Opportunity</th><th>Stage</th><th>Prob</th><th>Value</th></tr></thead>
            <tbody>
              ${PIPELINE.map((p) => `<tr><td>${p.name}</td><td>${p.stage}</td><td>${p.prob}%</td><td>${p.value}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  } else if (tplId === 'summary') {
    out.innerHTML = `
      <div class="ph-artifact">
        <div class="ph-eyebrow">Summary · Phaeron Studio</div>
        <h2>Open Opportunities — one page</h2>
        <p class="ph-lead">Four live deals · £14.5m total · weighted pressure in Proposal and Negotiation.</p>
        <div class="ph-grid">
          <div class="ph-card"><div class="lbl">Total pipeline</div><div class="val">£14.5m</div></div>
          <div class="ph-card"><div class="lbl">Largest deal</div><div class="val">HL · £5.2m</div></div>
        </div>
        <div class="ph-block">
          <h3>What matters this week</h3>
          <ul>
            <li>HL COO review on 1 July — lead with FCA fee-review angle.</li>
            <li>FNZ legal unblock still gates the Q3 close.</li>
          </ul>
        </div>
      </div>`;
  } else if (tplId === 'tldr') {
    out.innerHTML = `
      <div class="ph-artifact">
        <div class="ph-eyebrow">TLDR · Phaeron Studio</div>
        <h2>Pipeline TLDR</h2>
        <p class="ph-lead"><strong>Verdict:</strong> Book is healthy but top-heavy — HL and FNZ decide the quarter.</p>
        <div class="ph-block">
          <h3>Do next</h3>
          <ul>
            <li>Prep HL commercial review (Tue 1 Jul).</li>
            <li>Chase FNZ data-sharing clause.</li>
          </ul>
        </div>
        <div class="ph-block">
          <h3>Ignore for now</h3>
          <p>Transact Discovery (£1.6m) — workshop is the only near-term lever.</p>
        </div>
      </div>`;
  } else {
    out.innerHTML = `
      <div class="ph-artifact">
        <div class="ph-eyebrow">Blank · Phaeron Studio</div>
        <h2>Untitled artifact</h2>
        <p class="ph-lead">Empty canvas with Phaeron chrome. Describe sections in chat to fill this in.</p>
        <div class="ph-block">
          <h3>Suggested sections</h3>
          <ul>
            <li>Executive verdict</li>
            <li>Evidence</li>
            <li>Next actions</li>
          </ul>
        </div>
      </div>`;
  }
  icons();
  $('#wsCanvasTitle').textContent = tpl.label;
}

function renderReport() {
  const out = $('#reportOutput');
  const total = PIPELINE.reduce((a, b) => a + b.value, 0);
  const weighted = Math.round(PIPELINE.reduce((a, b) => a + b.value * b.prob / 100, 0));
  const avgProb = Math.round(PIPELINE.reduce((a, b) => a + b.prob, 0) / PIPELINE.length);
  const late = PIPELINE.filter((p) => p.stage === 'Negotiation' || p.stage === 'Proposal Sent').reduce((a, b) => a + b.value, 0);
  const stages = ['Discovery', 'Proposal Sent', 'Negotiation'];
  const stageW = stages.map((s) =>
    Math.round(PIPELINE.filter((p) => p.stage === s).reduce((a, b) => a + b.value * b.prob / 100, 0))
  );

  out.innerHTML = `
  <div class="report" id="report">
    <div class="rep-header" style="opacity:0">
      <div class="rh-meta">
        <div class="rh-title">Opportunities Pipeline Analysis</div>
        <div class="rh-sub">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}<span class="sep">·</span>4 opportunities</div>
      </div>
    </div>
    <div class="rep-section" style="opacity:0">
      <div class="exec-summary">The open Opportunities book holds <strong>${fmtGBP(total)}</strong> across 4 deals, with a probability-weighted value of <strong>${fmtGBP(weighted)}</strong>. Hargreaves Lansdowne and FNZ account for most of the book. Average win probability sits at <strong>${avgProb}%</strong>.</div>
    </div>
    <div class="rep-section">
      <div class="rs-title">Headline Metrics</div>
      <div class="kpi-strip">
        <div class="kpi" style="opacity:0"><div class="k-val" data-raw="${total}" data-fmt="gbp">${fmtGBP(total)}</div><div class="k-lbl">Total Pipeline</div><div class="k-delta up"><i data-lucide="arrow-up"></i>12%</div></div>
        <div class="kpi" style="opacity:0"><div class="k-val" data-raw="${weighted}" data-fmt="gbp">${fmtGBP(weighted)}</div><div class="k-lbl">Weighted Value</div><div class="k-delta up"><i data-lucide="arrow-up"></i>8%</div></div>
        <div class="kpi" style="opacity:0"><div class="k-val" data-raw="${avgProb}" data-fmt="pct">${avgProb}%</div><div class="k-lbl">Avg Probability</div><div class="k-delta down"><i data-lucide="arrow-down"></i>3%</div></div>
        <div class="kpi" style="opacity:0"><div class="k-val" data-raw="${late}" data-fmt="gbp">${fmtGBP(late)}</div><div class="k-lbl">Proposal + Negotiation</div><div class="k-delta up"><i data-lucide="arrow-up"></i>21%</div></div>
      </div>
    </div>
    <div class="rep-section" style="opacity:0">
      <div class="rs-title">Weighted Pipeline by Stage</div>
      <div class="chart-card"><div class="chart-wrap"><canvas id="stageChart"></canvas></div></div>
    </div>
    <div class="rep-section" style="opacity:0">
      <div class="rs-title">Opportunities</div>
      <div class="table-card">
        <table class="rep-table" id="oppTable">
          <thead><tr>
            <th data-k="name"><span class="th-in">Opportunity<i data-lucide="chevrons-up-down"></i></span></th>
            <th data-k="fund"><span class="th-in">Segment<i data-lucide="chevrons-up-down"></i></span></th>
            <th data-k="stage"><span class="th-in">Stage<i data-lucide="chevrons-up-down"></i></span></th>
            <th data-k="prob" class="num"><span class="th-in">Prob.<i data-lucide="chevrons-up-down"></i></span></th>
            <th data-k="value" class="num"><span class="th-in">Value (£k)<i data-lucide="chevrons-up-down"></i></span></th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
    <div class="rep-section" style="opacity:0">
      <div class="rs-title">Flags &amp; Alerts</div>
      <div class="flags-card">
        <div class="flag-row warn"><div class="fl-ic"><i data-lucide="alert-triangle"></i></div><div class="fl-txt"><div class="fl-h">HL commercial review this week</div><div class="fl-d">Hargreaves Lansdowne (£5.2m) has a COO meeting on 1 July.</div></div></div>
        <div class="flag-row crit"><div class="fl-ic"><i data-lucide="octagon-alert"></i></div><div class="fl-txt"><div class="fl-h">FNZ legal review still open</div><div class="fl-d">Data-sharing clause must clear before the Q3 close target holds.</div></div></div>
      </div>
    </div>
    <div class="rep-section" style="opacity:0">
      <div class="rs-title">AI Commentary</div>
      <div class="commentary">
        <div class="cm-head"><div class="cm-av">S</div><div class="cm-who">Studio · Artifacts</div></div>
        <p>This book matches Opportunities: four live deals, <strong>£14.5m</strong> total. Momentum is in Proposal and Negotiation.</p>
        <p>Prioritise the <strong>HL COO review</strong> and the <strong>FNZ legal unblock</strong>.</p>
      </div>
    </div>
  </div>`;

  icons();
  buildOppTable();
  animateReport(stages, stageW);
  $('#wsCanvasTitle').textContent = 'Opportunities Pipeline Report';
}

function animateReport(stages, stageW) {
  if (!window.anime) {
    buildStageChart(stages, stageW);
    $$('#report .rep-section, #report .rep-header, .kpi').forEach((el) => {
      el.style.opacity = '1';
    });
    return;
  }
  const sections = $$('#report .rep-section, #report .rep-header');
  const tl = anime.timeline({ easing: 'easeOutCubic' });
  tl.add({ targets: [sections[0], sections[1]], opacity: [0, 1], translateY: [10, 0], delay: anime.stagger(80), duration: 450 })
    .add({ targets: '.kpi', opacity: [0, 1], translateY: [16, 0], delay: anime.stagger(80), duration: 500 }, '-=200')
    .add({ targets: sections[2], opacity: [0, 1], translateY: [12, 0], duration: 450, complete: () => buildStageChart(stages, stageW) }, '-=300')
    .add({ targets: sections[3], opacity: [0, 1], translateY: [12, 0], duration: 450 }, '-=300')
    .add({ targets: sections[4], opacity: [0, 1], translateY: [10, 0], duration: 420 }, '-=300')
    .add({ targets: sections[5], opacity: [0, 1], translateY: [10, 0], duration: 420 }, '-=300');
}

function buildStageChart(stages, stageW) {
  const ctx = document.getElementById('stageChart');
  if (!ctx || !window.Chart) return;
  if (charts.stage) charts.stage.destroy();
  charts.stage = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: stages,
      datasets: [{ label: 'Weighted Value (£k)', data: stageW, backgroundColor: '#1B3A6B', hoverBackgroundColor: '#132743', borderRadius: 6, maxBarThickness: 64 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' £' + c.parsed.y + 'k weighted' } } },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 12, family: 'Inter' }, color: '#566571', callback: (v) => '£' + v + 'k' }, grid: { color: 'rgba(34,50,61,0.07)' } },
        x: { ticks: { font: { size: 12, family: 'Inter', weight: '600' }, color: '#22323D' }, grid: { display: false } },
      },
    },
  });
}

function buildOppTable() {
  const tb = $('#oppTable tbody');
  if (!tb) return;
  let rows = [...PIPELINE];
  if (sortState.k) {
    const { k, dir } = sortState;
    rows.sort((a, b) => (typeof a[k] === 'string' ? dir * a[k].localeCompare(b[k]) : dir * (a[k] - b[k])));
  }
  const stageClass = { Discovery: 'stage-disc', 'Proposal Sent': 'stage-prop', Negotiation: 'stage-neg' };
  tb.innerHTML = rows
    .map(
      (r) => `
    <tr>
      <td>${r.name}</td><td>${r.fund}</td>
      <td><span class="stage-pill ${stageClass[r.stage]}">${r.stage}</span></td>
      <td class="num"><div class="prob-bar"><div class="track"><div class="fill" style="width:${r.prob}%"></div></div>${r.prob}%</div></td>
      <td class="num">${r.value}</td>
    </tr>`
    )
    .join('');
  $$('#oppTable th').forEach((th) => {
    th.onclick = () => {
      if (sortState.k === th.dataset.k) sortState.dir = sortState.dir === 1 ? -1 : sortState.dir === -1 ? 0 : 1;
      else sortState = { k: th.dataset.k, dir: 1 };
      if (sortState.dir === 0) sortState.k = null;
      buildOppTable();
    };
  });
}

function wireLanding() {
  renderTplStrip();
  renderRecent();
  $('#recentSearch')?.addEventListener('input', (e) => renderRecent(e.target.value));
  $('#landingSend')?.addEventListener('click', () => {
    const text = ($('#landingPrompt').value || '').trim() || 'Create a commercial report from our open Opportunities.';
    const lower = text.toLowerCase();
    let tpl = 'report';
    if (/tldr|tl;dr/.test(lower)) tpl = 'tldr';
    else if (/slide|deck|powerpoint|ppt/.test(lower)) tpl = 'powerpoint';
    else if (/sheet|spreadsheet|csv|excel/.test(lower)) tpl = 'spreadsheet';
    else if (/summary|one.?pager/.test(lower)) tpl = 'summary';
    else if (/blank|empty/.test(lower)) tpl = 'blank';
    startCreate(tpl, text);
  });
  $('#landingPrompt')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      $('#landingSend').click();
    }
  });
  $('#attachBtn')?.addEventListener('click', () => toast('Sample Salesforce export attached'));
  $$('.rtab').forEach((tab) =>
    tab.addEventListener('click', () => {
      $$('.rtab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'templates') {
        $('#recentList').innerHTML = TEMPLATES.map(
          (t) => `
          <button type="button" class="recent-row" data-tpl="${t.id}">
            <span class="recent-thumb"><i data-lucide="${t.icon}"></i></span>
            <span><div class="recent-name">${t.label}</div><div class="recent-meta">${t.blurb}</div></span>
            <span class="recent-when"></span><span class="recent-owner"></span><span></span>
          </button>`
        ).join('');
        icons();
        $$('.recent-row').forEach((row) =>
          row.addEventListener('click', () => startCreate(row.dataset.tpl, `Create a ${tplById(row.dataset.tpl).label.toLowerCase()}.`))
        );
      } else renderRecent($('#recentSearch')?.value || '');
    })
  );
}

function wireWorkspace() {
  $('#backHome')?.addEventListener('click', showLanding);
  $('#wsSend')?.addEventListener('click', () => {
    const text = ($('#wsPrompt').value || '').trim();
    if (!text) return;
    $('#wsPrompt').value = '';
    appendMsg('user', text.replace(/</g, '&lt;'));
    appendMsg('assistant', 'Updated the canvas with your notes. Export when you are ready.');
    toast('Canvas refreshed');
  });
  $('#wsPrompt')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      $('#wsSend').click();
    }
  });
  $('#expPdf')?.addEventListener('click', () => {
    toast('Opening print dialog…');
    setTimeout(() => window.print(), 300);
  });
  $('#cpLink')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(location.href).catch(() => {});
    toast('Link copied');
  });
}

function applyQueryBoot() {
  try {
    const p = new URLSearchParams(location.search);
    const t = p.get('tpl');
    const map = { opps: 'report', report: 'report', powerpoint: 'powerpoint', spreadsheet: 'spreadsheet', summary: 'summary', tldr: 'tldr', blank: 'blank' };
    if (t && map[t]) {
      startCreate(map[t], `Create a ${tplById(map[t]).label.toLowerCase()} from our live Opportunities book.`);
    }
  } catch (e) {}
}

icons();
wireLanding();
wireWorkspace();
applyQueryBoot();
