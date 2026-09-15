const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
function icons(){ if(window.lucide) lucide.createIcons(); }
icons();

let toastTimer;
function toast(msg){
  const msgEl = $('#toastMsg');
  const el = $('#toast');
  if(!msgEl||!el) return;
  msgEl.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), 2400);
}

/* ───────────────────── ARTIFACTS ───────────────────── */
const TEMPLATES = [
  {id:'opps',name:'Opportunities Pipeline Analysis',icon:'briefcase',desc:'Analyses open Opportunities by stage, value and owner.',input:'Salesforce Opportunity Export (.csv/.xlsx)'},
  {id:'health',name:'Client Relationship Health',icon:'heart-pulse',desc:'Scores engagement, last contact, open actions and risk flags from account activity.',input:'Salesforce Account/Activity Export (.csv)'},
  {id:'revenue',name:'Revenue by Client Tier',icon:'pie-chart',desc:'MRR breakdown across Enterprise, Growth and Standard clients.',input:'Billing Export (.csv/.xlsx)'},
  {id:'jira',name:'Jira Sprint Summary',icon:'git-branch',desc:'Completed vs in-progress vs blocked, velocity, top blockers and team workload.',input:'Jira CSV Export (.csv)'},
  {id:'presence',name:'Presence ARR Dashboard',icon:'map-pin',desc:'Presence ARR and client concentration by market and city.',input:'Presence / CRM Export (.csv)'}
];
let selectedTpl = 'opps';
(function applyQueryTpl(){
  try{
    const p = new URLSearchParams(location.search);
    const t = p.get('tpl');
    if(t && ['opps','health','revenue','jira','presence'].includes(t)) selectedTpl = t;
  }catch(e){}
})();

function renderTemplates(){
  $('#tplList').innerHTML = TEMPLATES.map(t=>`
    <div class="tpl-card ${t.id===selectedTpl?'sel':''}" data-tpl="${t.id}">
      <div class="tc-head">
        <div class="tc-ico"><i data-lucide="${t.icon}"></i></div>
        <div><div class="tc-name">${t.name}</div></div>
      </div>
      <div class="tc-desc">${t.desc}</div>
      <div class="tc-input"><i data-lucide="file-input"></i>${t.input}</div>
      <button class="tc-use">${t.id===selectedTpl?'Selected':'Use template'}</button>
    </div>`).join('');
  icons();
  $$('.tpl-card').forEach(c=>c.addEventListener('click',()=>{
    selectedTpl=c.dataset.tpl; renderTemplates();
    $('#fileLoaded').classList.add('show');
  }));
}
renderTemplates();
if(new URLSearchParams(location.search).get('tpl') || new URLSearchParams(location.search).get('auto')==='1'){
  const fl = document.getElementById('fileLoaded');
  if(fl) fl.classList.add('show');
}

const dz=$('#dropzone'), fileLoaded=$('#fileLoaded');
dz.addEventListener('click',()=>{ fileLoaded.classList.add('show'); toast('Sample export loaded'); });
dz.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();fileLoaded.classList.add('show');toast('Sample export loaded');}});
dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag');});
dz.addEventListener('dragleave',()=>dz.classList.remove('drag'));
dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('drag');fileLoaded.classList.add('show');toast('File received');});

$('#analyseBtn').addEventListener('click',runAnalysis);

const PIPELINE = [
  {name:'Hargreaves Lansdowne — Platform',fund:'Wealth',aum:145,stage:'Proposal Sent',prob:55,value:5200,close:'2026-07-01'},
  {name:'FNZ Group — Connectivity',fund:'Platform',aum:210,stage:'Negotiation',prob:70,value:4800,close:'2026-09-30'},
  {name:'Pershing — API Consolidation',fund:'Custody',aum:320,stage:'Proposal Sent',prob:50,value:2900,close:'2026-07-07'},
  {name:'Transact — Network Discovery',fund:'Platform',aum:73,stage:'Discovery',prob:25,value:1600,close:'2026-07-03'}
];

let charts={};
function runAnalysis(){
  const out=$('#reportOutput');
  out.innerHTML = `
    <div class="report-skeleton">
      <div class="sk-label"><span class="sp"></span>Generating artifact…</div>
      <div class="sk sk-block"></div>
      <div class="sk-kpis"><div class="sk sk-kpi"></div><div class="sk sk-kpi"></div><div class="sk sk-kpi"></div><div class="sk sk-kpi"></div></div>
      <div class="sk sk-chart"></div>
    </div>`;
  setTimeout(renderReport, 1600);
}

function fmtGBP(k){ return k>=1000 ? '£'+(k/1000).toFixed(2)+'m' : '£'+k+'k'; }

function renderReport(){
  const out=$('#reportOutput');
  const total = PIPELINE.reduce((a,b)=>a+b.value,0);
  const weighted = Math.round(PIPELINE.reduce((a,b)=>a+b.value*b.prob/100,0));
  const avgProb = Math.round(PIPELINE.reduce((a,b)=>a+b.prob,0)/PIPELINE.length);
  const late = PIPELINE.filter(p=>p.stage==='Negotiation'||p.stage==='Proposal Sent').reduce((a,b)=>a+b.value,0);
  const stages=['Discovery','Proposal Sent','Negotiation'];
  const stageW = stages.map(s=> Math.round(PIPELINE.filter(p=>p.stage===s).reduce((a,b)=>a+b.value*b.prob/100,0)));

  out.innerHTML = `
  <div class="report" id="report">
    <div class="rep-header" style="opacity:0">
      <div class="rh-meta">
        <div class="rh-title">Opportunities Pipeline Analysis</div>
        <div class="rh-sub">${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}<span class="sep">·</span>SFDC_Opportunity_Export.xlsx<span class="sep">·</span>4 opportunities</div>
      </div>
      <div class="rep-actions">
        <button class="rep-btn" id="expPdf"><i data-lucide="file-down"></i>Export PDF</button>
        <button class="rep-btn" id="expCsv"><i data-lucide="table"></i>Export CSV</button>
        <button class="rep-btn" id="cpLink"><i data-lucide="link"></i>Copy Link</button>
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
            <th data-k="name" data-t="str"><span class="th-in">Opportunity<i data-lucide="chevrons-up-down"></i></span></th>
            <th data-k="fund" data-t="str"><span class="th-in">Segment<i data-lucide="chevrons-up-down"></i></span></th>
            <th data-k="stage" data-t="str"><span class="th-in">Stage<i data-lucide="chevrons-up-down"></i></span></th>
            <th data-k="aum" data-t="num" class="num"><span class="th-in">AUM (£bn)<i data-lucide="chevrons-up-down"></i></span></th>
            <th data-k="prob" data-t="num" class="num"><span class="th-in">Prob.<i data-lucide="chevrons-up-down"></i></span></th>
            <th data-k="value" data-t="num" class="num"><span class="th-in">Value (£k)<i data-lucide="chevrons-up-down"></i></span></th>
            <th data-k="close" data-t="str" class="num"><span class="th-in">Next date<i data-lucide="chevrons-up-down"></i></span></th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div>

    <div class="rep-section" style="opacity:0">
      <div class="rs-title">Flags &amp; Alerts</div>
      <div class="flags-card">
        <div class="flag-row warn"><div class="fl-ic"><i data-lucide="alert-triangle"></i></div><div class="fl-txt"><div class="fl-h">HL commercial review this week</div><div class="fl-d">Hargreaves Lansdowne (£5.2m, Proposal Sent) has a COO meeting on 1 July — FCA fee review is a live hook.</div></div></div>
        <div class="flag-row warn"><div class="fl-ic"><i data-lucide="alert-triangle"></i></div><div class="fl-txt"><div class="fl-h">Concentration in two deals</div><div class="fl-d">HL and FNZ are ~69% of pipeline value. Slippage on either moves the quarter.</div></div></div>
        <div class="flag-row crit"><div class="fl-ic"><i data-lucide="octagon-alert"></i></div><div class="fl-txt"><div class="fl-h">FNZ legal review still open</div><div class="fl-d">Negotiation is progressing, but the data-sharing clause needs to clear before the Q3 close target holds.</div></div></div>
      </div>
    </div>

    <div class="rep-section" style="opacity:0">
      <div class="rs-title">AI Commentary</div>
      <div class="commentary">
        <div class="cm-head"><div class="cm-av">C</div><div class="cm-who">Phaeron Intelligence</div></div>
        <p>This book matches the Opportunities module: four live deals, <strong>£14.5m</strong> total. Momentum is in Proposal and Negotiation; Transact is the only Discovery deal.</p>
        <p>Prioritise the <strong>HL COO review</strong> and the <strong>FNZ legal unblock</strong>. Pershing is stable at Proposal Sent ahead of procurement on 7 July.</p>
        <p>If HL and FNZ hold schedule, the quarter is in good shape — risk is conversion timing, not pipeline depth.</p>
      </div>
    </div>
  </div>`;

  icons();
  buildOppTable();
  wireReportButtons();
  animateReport(stages, stageW);
}

function animateReport(stages, stageW){
  const sections = $$('#report .rep-section, #report .rep-header');
  const tl = anime.timeline({easing:'easeOutCubic'});

  /* header + exec summary */
  tl.add({targets:[sections[0], sections[1]], opacity:[0,1], translateY:[10,0], delay:anime.stagger(80), duration:450})
  /* kpi cards */
  .add({targets:'.kpi', opacity:[0,1], translateY:[16,0], delay:anime.stagger(80), duration:500}, '-=200')
  /* chart section */
  .add({targets:sections[2], opacity:[0,1], translateY:[12,0], duration:450, complete:()=>buildStageChart(stages,stageW)}, '-=300')
  /* table section */
  .add({targets:sections[3], opacity:[0,1], translateY:[12,0], duration:450}, '-=300')
  /* flags */
  .add({targets:sections[4], opacity:[0,1], translateY:[10,0], duration:420}, '-=300')
  /* commentary */
  .add({targets:sections[5], opacity:[0,1], translateY:[10,0], duration:420}, '-=300');

  /* KPI number count-up */
  setTimeout(()=>{
    $$('.kpi .k-val').forEach(el=>{
      const raw = parseFloat(el.dataset.raw||'0');
      const fmt = el.dataset.fmt||'num';
      const obj = {v:0};
      anime({targets:obj, v:raw, duration:1100, easing:'easeOutExpo',
        update:()=>{
          if(fmt==='gbp') el.textContent = obj.v>=1000 ? '£'+(obj.v/1000).toFixed(2)+'m' : '£'+Math.round(obj.v)+'k';
          else if(fmt==='pct') el.textContent = Math.round(obj.v)+'%';
          else el.textContent = Math.round(obj.v).toLocaleString();
        }
      });
    });
  }, 600);
}

function buildStageChart(stages, stageW){
  const ctx=document.getElementById('stageChart');
  if(!ctx) return;
  if(charts.stage) charts.stage.destroy();
  charts.stage=new Chart(ctx,{
    type:'bar',
    data:{labels:stages,datasets:[{label:'Weighted Value (£k)',data:stageW,backgroundColor:'#1B3A6B',hoverBackgroundColor:'#132743',borderRadius:6,maxBarThickness:64}]},
    options:{
      responsive:true,maintainAspectRatio:false,
      animation:{duration:800,easing:'easeOutQuart'},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' £'+c.parsed.y+'k weighted'}}},
      scales:{
        y:{beginAtZero:true,ticks:{font:{size:12,family:'Inter'},color:'#566571',callback:v=>'£'+v+'k'},grid:{color:'rgba(34,50,61,0.07)'}},
        x:{ticks:{font:{size:12,family:'Inter',weight:'600'},color:'#22323D'},grid:{display:false}}
      }
    }
  });
}

let sortState={k:null,dir:0};
function buildOppTable(){
  const tb=$('#oppTable tbody');
  let rows=[...PIPELINE];
  if(sortState.k){
    const {k,dir}=sortState;
    rows.sort((a,b)=>typeof a[k]==='string'?dir*a[k].localeCompare(b[k]):dir*(a[k]-b[k]));
  }
  const stageClass={'Discovery':'stage-disc','Proposal Sent':'stage-prop','Negotiation':'stage-neg','Closing/Won':'stage-cw'};
  tb.innerHTML=rows.map(r=>`
    <tr style="opacity:0">
      <td>${r.name}</td><td>${r.fund}</td>
      <td><span class="stage-pill ${stageClass[r.stage]}">${r.stage}</span></td>
      <td class="num">${r.aum.toLocaleString()}</td>
      <td class="num"><div class="prob-bar"><div class="track"><div class="fill" style="width:${r.prob}%"></div></div>${r.prob}%</div></td>
      <td class="num">${r.value}</td>
      <td class="num">${new Date(r.close).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</td>
    </tr>`).join('');
  setTimeout(()=>{
    anime({targets:'#oppTable tbody tr', opacity:[0,1], translateX:[-6,0], delay:anime.stagger(35), duration:350, easing:'easeOutCubic'});
  }, 900);
  $$('#oppTable th').forEach(th=>{
    th.onclick=()=>{
      if(sortState.k===th.dataset.k){ sortState.dir=sortState.dir===1?-1:(sortState.dir===-1?0:1); }
      else { sortState={k:th.dataset.k,dir:1}; }
      if(sortState.dir===0) sortState.k=null;
      buildOppTable();
    };
  });
}

function wireReportButtons(){
  $('#expCsv').onclick=()=>{
    const header=['Opportunity','Segment','Stage','AUM_bn','Probability_pct','Value_k','Next Date'];
    const lines=[header.join(',')].concat(PIPELINE.map(p=>[`"${p.name}"`,p.fund,`"${p.stage}"`,p.aum,p.prob,p.value,p.close].join(',')));
    const blob=new Blob([lines.join('\n')],{type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='Opportunities_Pipeline_Analysis.csv'; a.click(); URL.revokeObjectURL(a.href);
    toast('CSV exported');
  };
  $('#expPdf').onclick=()=>{ toast('Opening print dialog…'); setTimeout(()=>window.print(),300); };
  $('#cpLink').onclick=()=>{ navigator.clipboard?.writeText(location.href).catch(()=>{}); toast('Report link copied'); };
}


/* Custom template stub */
document.querySelector('.create-tpl')?.addEventListener('click',()=>toast('Custom templates coming soon'));
icons();
