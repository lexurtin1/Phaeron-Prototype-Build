// ─── SOURCE DEFINITIONS ────────────────────────────────────────────────────
// Each signal has a 'src' key (source system) displayed prominently in the feed.
// Sources: sf (Salesforce), granola (Granola AI notes), call (Call Notes),
//          news (News), alert (CRM Alert), stockup / stockdown (Market Data)

const SRC = {
  sf:        { label:'Salesforce',      cls:'src-sf',        icon:'sf'        },
  granola:   { label:'Granola',         cls:'src-granola',   icon:'granola'   },
  call:      { label:'Call Notes',      cls:'src-call',      icon:'call'      },
  news:      { label:'News',            cls:'src-news',      icon:'news'      },
  alert:     { label:'CRM Alert',       cls:'src-alert',     icon:'alert'     },
  stockup:   { label:'Market Data',     cls:'src-stockup',   icon:'stockup'   },
  stockdown: { label:'Market Data',     cls:'src-stockdown', icon:'stockdown' },
};

// ─── COMPANY DATA ──────────────────────────────────────────────────────────
const companies = [
  {
    id:"hl", name:"Hargreaves Lansdowne", initials:"HL", color:"#003366",
    sector:"Investment Platform", location:"Bristol", stage:"Proposal Sent", value:"£5.2m",
    signal:"red", signalLabel:"BREAKING", listed:true, ticker:"HL.L",
    lastActivity:"3 days ago", lastCall:"17 June", price:"£7.84", change:-4.3,
    spark:[840,836,842,838,830,825,820,815,818,810,806,800,795,792,788,784],
    chart:[845,840,842,838,834,830,826,822,818,820,815,810,806,808,802,798,794,796,790,786,782,784,800,796,792,788,786,784,784,784],
    annot:{idx:20,label:"FCA review −4.3%"},
    signals:[
      {src:"stockdown",time:"3h ago",  headline:"Share price down 4.3% as FCA announces platform fee review",
       summary:"Regulator opens industry-wide review of platform charging models. <span class='sig-delta' style='color:var(--red)'>−4.3%</span> intraday on above-average volume. Creates urgency around operational cost efficiency — a direct hook for the routing pitch."},
      {src:"news",     time:"Today",   headline:"Hargreaves Lansdowne appoints new CEO following strategic review",
       summary:"Dan Olley confirmed as permanent CEO after interim period. New leadership agenda expected to focus on cost reduction and technology modernisation — aligns with Phaeron value proposition."},
      {src:"sf",       time:"3 days ago", headline:"Proposal Sent — £5.2m routing proposal delivered to COO",
       summary:"Full commercial proposal with volume-tiered pricing delivered to Sarah Hume (COO) and procurement team. Awaiting formal feedback within 10 working days."},
      {src:"granola",  time:"17 June", headline:"Granola meeting notes: Senior executive briefing with COO",
       summary:"COO confirmed fund routing is a stated FY2025 strategic priority. Internal champion confirmed: Dan Fairley (Head of Platform Engineering). Key concern raised: T+1 settlement readiness — strong alignment with Phaeron's real-time routing capability."},
    ],
    contacts:[
      {name:"Sarah Hume",      title:"Chief Operating Officer",       init:"SH", color:"#003366", last:"3 days",  rec:"g"},
      {name:"Dan Fairley",     title:"Head of Platform Engineering",  init:"DF", color:"#1B3A6B", last:"17 days", rec:"a"},
      {name:"Priya Mehta",     title:"Procurement Director",          init:"PM", color:"#7B5EA7", last:"8 days",  rec:"g"},
    ],
    owner:{name:"Alex Curtin",title:"Account Executive",init:"AC",color:"#1B3A6B"},
    meeting:{when:"Tue 1 Jul · 10:00",detail:"Proposal commercial review with COO and procurement"},
    briefing:`<b>Hargreaves Lansdowne</b> is the highest-value opportunity in the pipeline at <b>£5.2m</b>. Shares fell <span class="hl">4.3% today on an FCA platform fee review</span>, and the incoming CEO has a clear cost and technology modernisation mandate — both are strong conversation hooks. The <b>£5.2m proposal</b> was delivered 3 days ago and the 17 June Granola notes confirm an internal champion and T+1 as a live concern. Follow up before the 1 July meeting to anchor the conversation around the regulatory and settlement timeline angles.`
  },
  {
    id:"fnz", name:"FNZ Group", initials:"FN", color:"#1A3A5C",
    sector:"Platform Operator", location:"Edinburgh", stage:"Negotiation", value:"£4.8m",
    signal:"red", signalLabel:"ACTIVITY", listed:false, ticker:null,
    lastActivity:"Today", lastCall:"19 June", price:null, change:null,
    spark:null, chart:null, annot:null,
    signals:[
      {src:"sf",      time:"Today",    headline:"Opportunity stage updated to Negotiation — commercial terms under review",
       summary:"A. Curtin progressed the opportunity to Negotiation following positive technical validation session. Close target set to end of Q3."},
      {src:"granola", time:"19 June",  headline:"Granola meeting notes: Settlement latency & T+1 migration session",
       summary:"FNZ operations team (Mark Reid, Head of Settlement) flagged T+1 migration deadline as Q4 hard requirement. Phaeron's real-time routing directly addresses this. Legal review of data-sharing agreement is the remaining open item."},
      {src:"news",    time:"4 days ago", headline:"FNZ Group completes acquisition of SEI Investments' technology platform",
       summary:"Acquisition significantly expands FNZ's managed platform footprint across UK and Australia. Increased fund routing volumes expected — strengthens the business case for a consolidated Phaeron connection."},
      {src:"call",    time:"12 June",  headline:"Call Notes: ISO 20022 messaging format discussion with operations team",
       summary:"FNZ confirmed preference for native ISO 20022 ingestion. Phaeron's any-format ingestion confirmed as compatible. No technical blockers remaining post this call."},
    ],
    contacts:[
      {name:"Mark Reid",        title:"Head of Settlement Operations", init:"MR", color:"#1A3A5C", last:"5 days",  rec:"g"},
      {name:"Claire Ashworth",  title:"Chief Technology Officer",      init:"CA", color:"#4a9d5b", last:"19 days", rec:"a"},
      {name:"Tom Gallagher",    title:"Legal Counsel",                 init:"TG", color:"#7B5EA7", last:"2 days",  rec:"g"},
    ],
    owner:{name:"Alex Curtin",title:"Account Executive",init:"AC",color:"#1B3A6B"},
    meeting:{when:"Wed 2 Jul · 14:00",detail:"Negotiation: data-sharing agreement & legal review"},
    briefing:`<b>FNZ Group</b> is advancing well — the deal moved to <b>Negotiation today</b> at <b>£4.8m</b>. The 19 June Granola notes confirm T+1 as a hard Q4 deadline and no technical blockers remain after the ISO 20022 call. FNZ's recent SEI acquisition expands their platform footprint, strengthening the routing volume case. The sole open item is the legal review of the data-sharing clause — prioritise this for the 2 July session to keep the Q3 close on track.`
  },
  {
    id:"pershing", name:"Pershing", initials:"PE", color:"#00447C",
    sector:"Clearing & Custody", location:"London", stage:"Proposal Sent", value:"£2.9m",
    signal:"yellow", signalLabel:"ACTIVITY", listed:false, ticker:null,
    lastActivity:"2 days ago", lastCall:"16 June", price:null, change:null,
    spark:null, chart:null, annot:null,
    signals:[
      {src:"sf",      time:"2 days ago", headline:"Proposal Sent — routing proposal delivered to Operations & Technology teams",
       summary:"A. Curtin delivered full commercial proposal including volume-tiered pricing and SLA commitments. Procurement committee review expected within 15 working days."},
      {src:"call",    time:"16 June",  headline:"Call Notes: Operations review call — fund order routing requirements",
       summary:"Head of Operations (Richard Blythe) confirmed current TA connectivity involves 14 separate point-to-point links. Consolidation is a stated efficiency priority. Estimated annual routing volume: 8.4m orders — well within Phaeron network capacity."},
      {src:"news",    time:"5 days ago", headline:"BNY Mellon (Pershing parent) reports record Q2 assets under custody",
       summary:"AuC grew 12% YoY to $47.8 trillion. Increased custody volumes drive higher fund transaction activity — the Pershing routing opportunity is structurally well-supported."},
      {src:"granola", time:"9 June",   headline:"Granola meeting notes: Initial technical architecture session",
       summary:"Pershing's technology team confirmed appetite for a single API-based connection to replace legacy batch files. ISO 20022 readiness was discussed — Pershing already migrated settlement messaging, making integration simpler."},
    ],
    contacts:[
      {name:"Richard Blythe",  title:"Head of Operations",       init:"RB", color:"#00447C", last:"2 days",  rec:"g"},
      {name:"Anita Sharma",    title:"Head of Technology",       init:"AS", color:"#d79a31", last:"9 days",  rec:"g"},
      {name:"James Fletcher",  title:"Procurement Manager",      init:"JF", color:"#7B5EA7", last:"16 days", rec:"a"},
    ],
    owner:{name:"Alex Curtin",title:"Account Executive",init:"AC",color:"#1B3A6B"},
    meeting:{when:"Mon 7 Jul · 11:00",detail:"Proposal walkthrough with procurement committee"},
    briefing:`<b>Pershing</b> is at <b>Proposal Sent</b> stage with a <b>£2.9m</b> opportunity. The 16 June call notes reveal 14 fragmented TA connections and a stated consolidation mandate — a strong fit. The Granola notes confirm ISO 20022 readiness, simplifying integration. BNY Mellon's record Q2 AuC growth reinforces the volume case. Maintain regular touchpoints ahead of the 7 July procurement review to keep momentum.`
  },
  {
    id:"transact", name:"Transact", initials:"TR", color:"#C05A00",
    sector:"Platform Operator", location:"London", stage:"Discovery", value:"£1.6m",
    signal:"yellow", signalLabel:"ACTIVITY", listed:true, ticker:"IHP.L",
    lastActivity:"Today", lastCall:"10 June", price:"£3.42", change:1.8,
    spark:[330,332,328,334,336,334,338,340,337,342,344,342,346,348,347,342],
    chart:[334,332,335,331,333,330,332,334,336,335,338,337,339,341,340,342,344,343,345,347,346,348,346,344,342,342,342,342,342,342],
    annot:{idx:19,label:"FUA growth +1.8%"},
    signals:[
      {src:"sf",   time:"Today",   headline:"New contact added in Salesforce — Head of Platform Technology confirmed",
       summary:"Champion identified within the technology function: Kate Simmons (Head of Platform Technology). Warm introduction routed via existing Phaeron network contact at IntegraFin."},
      {src:"granola", time:"10 June", headline:"Granola meeting notes: Intro call with Head of Platform Technology",
       summary:"Strong interest in reducing TA settlement latency. Transact currently operates 6 legacy direct connections to fund managers. Kate Simmons indicated appetite for a single network solution ahead of T+1 go-live. Follow-up workshop agreed."},
      {src:"news", time:"1 day ago", headline:"IntegraFin reports 8.4% FUA growth in Q2 trading update",
       summary:"Funds under administration reached £73.2bn. Growing platform volumes increase the addressable routing opportunity and make a commercial case easier to justify for procurement."},
      {src:"call", time:"3 June",  headline:"Call Notes: Initial discovery call — platform routing landscape mapped",
       summary:"Mapped existing TA connections: 6 direct links across 4 transfer agents. Primary pain point is batch file processing causing end-of-day settlement delays. Aligns directly with Phaeron's real-time routing capability."},
    ],
    contacts:[
      {name:"Kate Simmons",   title:"Head of Platform Technology", init:"KS", color:"#C05A00", last:"Today",   rec:"g"},
      {name:"Oliver Banks",   title:"Chief Operating Officer",     init:"OB", color:"#1A3A5C", last:"10 days", rec:"g"},
    ],
    owner:{name:"Alex Curtin",title:"Account Executive",init:"AC",color:"#1B3A6B"},
    meeting:{when:"Thu 3 Jul · 15:00",detail:"Discovery workshop: connectivity mapping & T+1 readiness"},
    briefing:`<b>Transact</b> is an actively progressing <b>Discovery</b> opportunity at <b>£1.6m</b>. A new technology champion was identified today and the 10 June Granola notes confirm appetite for a single network solution ahead of T+1. IntegraFin's 8.4% FUA growth strengthens the commercial case. The 3 July workshop is the key next step — prepare a connectivity consolidation narrative and T+1 readiness comparison to advance toward a formal proposal.`
  },
];

// ─── ICONS ────────────────────────────────────────────────────────────────
const icons = {
  sf:`<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 00.9-8.9A6 6 0 007 8.5a4 4 0 00-.5 8z"/></svg>`,
  granola:`<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/></svg>`,
  call:`<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>`,
  news:`<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M4 4h13v16H6a2 2 0 01-2-2z"/><path d="M17 8h3v10a2 2 0 01-2 2"/><path d="M8 8h6M8 12h6M8 16h4"/></svg>`,
  alert:`<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9l-8 13.4A2 2 0 004 20.3h16a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h0"/></svg>`,
  stockdown:`<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l6 6 4-4 8 8"/><path d="M21 17v-4h-4"/></svg>`,
  stockup:`<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v4h-4"/></svg>`,
};

// ─── STAGE PROGRESS ───────────────────────────────────────────────────────
const stagePcts = {Discovery:22,'Proposal Sent':50,Negotiation:75,'Closed Won':100,'Closed Lost':100};

// ─── COUNT-UP ─────────────────────────────────────────────────────────────
function countUp(el, raw) {
  const prefix = (raw.match(/^[£$€\+\-]*/)||[''])[0];
  const num = parseFloat(raw.replace(/[^0-9.]/g,''));
  if (isNaN(num)) return;
  const dec = ((raw.match(/\.(\d+)/)||['',''])[1]).length;
  const suffix = (raw.match(/[a-zA-Z%]+$/)||[''])[0];
  const dur = 750;
  const start = performance.now();
  const raf = ts => {
    const p = Math.min((ts-start)/dur, 1);
    const e = 1 - Math.pow(1-p, 3);
    el.textContent = prefix + (num*e).toFixed(dec) + suffix;
    if (p < 1) requestAnimationFrame(raf); else el.textContent = raw;
  };
  requestAnimationFrame(raf);
}

// ─── SPARKLINE ────────────────────────────────────────────────────────────
function sparkline(data,up){
  if(!data) return `<div style="width:50px;height:18px;display:grid;place-items:center;color:var(--ink-3);font-size:9px;font-family:var(--mono)">pvt</div>`;
  const w=50,h=18,min=Math.min(...data),max=Math.max(...data),rng=(max-min)||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-2-((v-min)/rng)*(h-4)}`).join(" ");
  const col=up?"var(--src-stockup)":"var(--src-stockdown)";
  return `<svg class="spark" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// ─── BIG CHART ────────────────────────────────────────────────────────────
function bigChart(c){
  if(!c.chart) return "";
  const data=c.chart,W=720,H=160,padL=8,padR=8,padT=18,padB=8;
  const min=Math.min(...data),max=Math.max(...data),rng=(max-min)||1;
  const innerW=W-padL-padR,innerH=H-padT-padB;
  const X=i=>padL+(i/(data.length-1))*innerW;
  const Y=v=>padT+innerH-((v-min)/rng)*innerH;
  const up=c.change>=0;
  const stroke=up?"var(--src-stockup)":"var(--src-stockdown)";
  const fill=up?"rgba(74,157,91,":"rgba(207,90,78,";
  const line=data.map((v,i)=>`${X(i)},${Y(v)}`).join(" ");
  const area=`${padL},${H-padB} ${line} ${W-padR},${H-padB}`;
  let annotHTML="";
  if(c.annot){
    const ai=c.annot.idx,ax=X(ai),ay=Y(data[ai]);
    annotHTML=`<circle cx="${ax}" cy="${ay}" r="4" fill="${stroke}" stroke="#fff" stroke-width="2"/>
      <line x1="${ax}" y1="${ay}" x2="${ax}" y2="${padT-4}" stroke="${stroke}" stroke-width="1" stroke-dasharray="2 2" opacity=".5"/>`;
    window.__annot={x:ax,label:c.annot.label,left:ax>W*0.6,stroke};
  } else { window.__annot=null; }
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
    <defs><linearGradient id="g_${c.id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${fill}.13)"/><stop offset="1" stop-color="${fill}0)"/>
    </linearGradient></defs>
    <polygon points="${area}" fill="url(#g_${c.id})"/>
    <polyline points="${line}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${annotHTML}
  </svg>`;
}

// ─── RENDER LIST ──────────────────────────────────────────────────────────
let currentFilter="all", selectedId="hl";
function matchesFilter(c,f){
  if(f==="all")       return true;
  if(f==="news")      return c.signals.some(s=>s.src==="news");
  if(f==="sf")        return c.signals.some(s=>s.src==="sf");
  if(f==="nocontact") return c.signals.some(s=>s.src==="alert");
  return true;
}
function renderList(){
  const q=(document.getElementById("filterInput").value||"").toLowerCase();
  const order={red:0,yellow:1,green:2};
  const rows=companies
    .filter(c=>matchesFilter(c,currentFilter))
    .filter(c=>c.name.toLowerCase().includes(q)||c.location.toLowerCase().includes(q)||c.sector.toLowerCase().includes(q))
    .sort((a,b)=>order[a.signal]-order[b.signal]);
  const sigText={red:c=>c.signalLabel,yellow:()=>"New activity",green:c=>c.signalLabel==="NO CONTACT"?"No contact":"Stable"};
  document.getElementById("plist").innerHTML=rows.map(c=>`
    <div class="prow ${c.id===selectedId?"sel":""}" onclick="selectCompany('${c.id}')">
      <div class="pavatar" style="background:${c.color}">${c.initials}</div>
      <div class="pinfo">
        <div class="pname">${c.name}</div>
        <div class="pmeta">${c.sector} · ${c.location}</div>
        <div class="pstage"><span class="pill stage mini">${c.stage}</span></div>
      </div>
      <div class="pright">
        ${sparkline(c.spark,(c.change||0)>=0)}
        <div class="sig ${c.signal}"><span class="sigdot"></span>${sigText[c.signal](c)}</div>
      </div>
    </div>`).join("");
}

// ─── RENDER DETAIL ────────────────────────────────────────────────────────
function renderDetail(){
  const c=companies.find(x=>x.id===selectedId);

  const feedHTML=c.signals.map((s,i)=>{
    const def=SRC[s.src]||SRC.news;
    return `
    <div class="signal ${def.cls}" style="animation-delay:${i*80}ms">
      <div class="sig-icon">${icons[def.icon]||icons.news}</div>
      <div class="sig-body">
        <div class="sig-top">
          <span class="sig-source">
            ${icons[def.icon]||icons.news}
            ${def.label}
          </span>
          <span class="sig-time">${s.time}</span>
        </div>
        <div class="sig-headline">${s.headline}</div>
        <div class="sig-summary">${s.summary}</div>
      </div>
    </div>`;
  }).join("");

  const chartHTML=c.chart?`
    <div class="sec">
      <div class="sec-title">Market context<span class="count">${c.ticker} · 30 days</span></div>
      <div class="chart-card">
        <div class="chart-head">
          <div><div class="chart-price">${c.price}</div><div class="chart-sub">${c.ticker} · last close</div></div>
          <div class="chart-change">
            <div class="pct" style="color:${c.change>=0?'var(--src-stockup)':'var(--src-stockdown)'}">${c.change>=0?'+':''}${c.change}% <span style="font-size:10.5px">30d</span></div>
            <div class="rng">Market Data · annotated against signal events</div>
          </div>
        </div>
        <div class="chartwrap" id="chartwrap">${bigChart(c)}</div>
      </div>
    </div>`:""

  const contactsHTML=c.contacts.map(ct=>`
    <div class="contact">
      <div class="c-av" style="background:${ct.color}">${ct.init}<span class="rec ${ct.rec}"></span></div>
      <div class="c-info"><div class="c-name">${ct.name}</div><div class="c-title">${ct.title}</div></div>
      <div class="c-last ${ct.rec}">${ct.last} ago</div>
    </div>`).join("");

  document.getElementById("detail").innerHTML=`
    <div class="sami-pack">
      <div class="pack-banner">
        <div class="pack-eyebrow">SAMI pack · Strategic Account Management Information</div>
        <div class="pack-asof">As of today · 07:15 AM</div>
      </div>

      <div class="co-head">
        <div class="co-logo" style="background:${c.color}">${c.initials}</div>
        <div class="co-titles">
          <div class="co-name">${c.name}</div>
          <div class="co-meta">
            <span class="sector-tag"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg>${c.sector} · ${c.location}</span>
            <span class="pill stage">${c.stage}</span>
            ${c.listed?`<span class="ticker-tag">${c.ticker}</span>`:''}
          </div>
          <div class="stage-progress">
            <div class="sp-track"><div class="sp-fill" data-pct="${stagePcts[c.stage]||50}"></div></div>
            <div class="sp-labels"><span>Discovery</span><span>Proposal</span><span>Negotiation</span><span>Closed</span></div>
          </div>
        </div>
        <div class="co-value">
          <div class="lbl">Open opportunity</div>
          <div class="amt">${c.value}</div>
          <div class="co-value-note">${c.stage}</div>
        </div>
      </div>

      <div class="sec">
        <div class="sec-title">Account snapshot</div>
        <div class="quickstats">
          <div class="qs"><div class="qicon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div><div><div class="qlbl">Last SF activity</div><div class="qval">${c.lastActivity}</div></div></div>
          <div class="qs"><div class="qicon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.4-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z"/></svg></div><div><div class="qlbl">Last call / meeting</div><div class="qval">${c.lastCall}</div></div></div>
          <div class="qs"><div class="qicon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div><div><div class="qlbl">Open opportunity</div><div class="qval">${c.value} · ${c.stage}</div></div></div>
        </div>
      </div>

      <div class="sec">
        <div class="sec-title">Signal intelligence
          <span class="live-mini"><span class="d"></span>LIVE</span>
          <span class="count">Last 30 days · ${c.signals.length} signals</span>
        </div>
        <div class="feed">${feedHTML}</div>
      </div>

      ${chartHTML}

      <div class="sec">
        <div class="sec-title">Relationship map</div>
        <div class="rel-grid">
          <div class="rel-card">
            <h4>Key Contacts</h4>
            ${contactsHTML}
          </div>
          <div class="rel-side">
            <div class="rel-card">
              <h4>Phaeron Account Owner</h4>
              <div class="owner-row">
                <div class="c-av" style="background:${c.owner.color}">${c.owner.init}</div>
                <div class="c-info"><div class="c-name">${c.owner.name}</div><div class="c-title">${c.owner.title}</div></div>
              </div>
              <div class="next-meet">
                <div class="nm-when"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>${c.meeting.when}</div>
                <div class="nm-detail">${c.meeting.detail}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="sec">
        <div class="sec-title">Strategic briefing</div>
        <div class="briefing">
          <div class="briefing-accent"></div>
          <div class="briefing-body">
            <div class="brief-head">
              <span class="ai-badge"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M12 2l2.4 5.4L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.6-1.6z"/></svg>Pulse AI Summary</span>
              <span class="brief-time">Generated today, 07:15 AM</span>
            </div>
            <div class="brief-text">${c.briefing}</div>
            <div class="brief-actions">
              <button class="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M4 4h16v16H4z"/><path d="M4 7l8 6 8-6"/></svg>Draft outreach email</button>
              <button class="btn btn-ghost-light"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>Ask Pulse a question</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if(window.__annot){
    const wrap=document.getElementById("chartwrap");
    if(wrap){
      const a=window.__annot;
      const el=document.createElement("div");
      el.className="annot";
      el.textContent=a.label;
      el.style.top="2px";
      el.style.color=a.stroke;
      el.style.background=a.stroke==="var(--src-stockup)"?"rgba(74,157,91,.1)":"rgba(207,90,78,.1)";
      el.style.borderColor=a.stroke==="var(--src-stockup)"?"rgba(74,157,91,.25)":"rgba(207,90,78,.25)";
      const pct=(a.x/720)*100;
      if(a.left){el.style.right=(100-pct+1)+"%";}else{el.style.left=(pct+1)+"%";}
      wrap.appendChild(el);
    }
  }

  // Animate panel in
  const detailEl = document.getElementById("detail");
  detailEl.style.transition = 'none';
  detailEl.style.opacity = '0';
  detailEl.style.transform = 'translateY(8px)';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    detailEl.style.transition = 'opacity .35s ease-out, transform .35s ease-out';
    detailEl.style.opacity = '1';
    detailEl.style.transform = 'translateY(0)';
  }));

  // Count-up and progress bar after a brief delay so DOM is painted
  setTimeout(() => {
    const amtEl = detailEl.querySelector('.amt');
    if (amtEl) countUp(amtEl, c.value);
    const priceEl = detailEl.querySelector('.chart-price');
    if (priceEl && c.price) countUp(priceEl, c.price);
    const fill = detailEl.querySelector('.sp-fill');
    if (fill) fill.style.width = fill.dataset.pct + '%';
  }, 60);
}

// ─── INTERACTION ──────────────────────────────────────────────────────────
function selectCompany(id){
  selectedId=id;
  renderList();
  renderDetail();
  document.getElementById("rightPanel").scrollTop=0;
  if(window.innerWidth<=860){
    document.getElementById("leftPanel").classList.add("hide-mobile");
    document.getElementById("rightPanel").classList.add("show-mobile");
  }
}
document.getElementById("mobileBack").onclick=()=>{
  document.getElementById("leftPanel").classList.remove("hide-mobile");
  document.getElementById("rightPanel").classList.remove("show-mobile");
};
document.getElementById("filterInput").addEventListener("input",renderList);
document.querySelectorAll(".chip").forEach(ch=>ch.onclick=()=>{
  document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));
  ch.classList.add("active");
  currentFilter=ch.dataset.f;
  renderList();
});

renderList();
renderDetail();
