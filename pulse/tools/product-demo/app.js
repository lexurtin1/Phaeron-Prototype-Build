/* ================================================================
   PHAERON PRODUCT DEMO — standalone app.js
   Hub & Spoke visualization + Products Navigation + Order Routing
   ================================================================ */

let currentMode = 'hubspoke';

function animatePanelVisibility(panel, visible, options) {
  if (!panel) return;
  const { display = 'flex', y = 12, duration = 240, easing = 'easeOutQuad' } = options || {};
  if (visible) {
    panel.style.display = display;
    panel.style.opacity = '0';
    panel.style.transform = `translateY(${y}px)`;
    requestAnimationFrame(function() {
      if (window._hsAnimate) {
        window._hsAnimate(panel, {
          opacity: [0, 1],
          translateY: [y, 0],
          duration,
          easing,
          complete: function() {
            panel.style.opacity = '1';
            panel.style.transform = 'translateY(0)';
          }
        });
      } else {
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
      }
    });
  } else {
    if (window._hsAnimate) {
      window._hsAnimate(panel, {
        opacity: [1, 0],
        translateY: [0, y],
        duration,
        easing: 'easeInQuad',
        complete: function() {
          panel.style.display = 'none';
          panel.style.opacity = '0';
          panel.style.transform = `translateY(${y}px)`;
        }
      });
    } else {
      panel.style.display = 'none';
      panel.style.opacity = '0';
      panel.style.transform = `translateY(${y}px)`;
    }
  }
}

function switchToHubSpoke() {
  currentMode = 'hubspoke';
  const hubUI = document.getElementById('hubSpokeUI');
  const orUI = document.getElementById('orderRoutingUI');
  const orStrip = document.getElementById('orModeStrip');
  if (orStrip) orStrip.style.display = 'none';
  const pnHub = document.querySelector('.pn-hex-hub');
  if (pnHub) pnHub.style.animation = '';
  if (hubUI) {
    hubUI.classList.add('hs-open');
    animatePanelVisibility(hubUI, true, { display: 'flex', y: 16, duration: 220 });
  }
  if (orUI) {
    orUI.style.display = 'none';
    orUI.style.opacity = '0';
    orUI.style.transform = 'translateY(16px)';
  }
  window._productNavShow && window._productNavShow();
  window._hsShow && window._hsShow();
}

function switchToOrderRouting() {
  currentMode = 'orderrouting';
  const hubUI = document.getElementById('hubSpokeUI');
  if (hubUI) {
    hubUI.classList.remove('hs-open');
  }
  window._productNavShow && window._productNavShow();
  window.hsHide && window.hsHide();
  const pnHub = document.querySelector('.pn-hex-hub');
  if (pnHub) pnHub.style.animation = 'none';

  const ui = document.getElementById('orderRoutingUI'); if (!ui) return;
  const frame = document.getElementById('orFlowFrame');
  const indicator = document.getElementById('orLoadingIndicator');

  const tb = document.querySelector('.topbar');
  ui.style.paddingTop = (tb ? tb.offsetHeight : 60) + 'px';
  ui.style.display = 'flex';
  ui.style.opacity = '0';
  ui.style.transform = 'translateY(14px)';

  function watchForComponent() {
    let tries = 0;
    function attempt() {
      try {
        const doc = frame.contentDocument || frame.contentWindow.document;
        const comp = frame.contentWindow && frame.contentWindow.__dcComp;
        if (doc.getElementById('dc-root') && comp) {
          const strip = document.getElementById('orModeStrip');
          if (strip) strip.style.display = 'flex';
          window._orSetMode(window._orCurrentProduct || 'settlement');
          window._orWatchExploreMode();
          return;
        }
      } catch(e) {}
      if (++tries < 70) setTimeout(attempt, 100);
    }
    attempt();
  }

  if (frame && !frame._orLoaded) {
    frame.onload = function() {
      frame._orLoaded = true;
      if (indicator) indicator.style.display = 'none';
      frame.style.display = 'block';
      watchForComponent();
    };
    frame.src = '../../../Order Routing Flow - standalone.html';
  } else if (frame && frame._orLoaded) {
    if (indicator) indicator.style.display = 'none';
    frame.style.display = 'block';
    const strip = document.getElementById('orModeStrip');
    if (strip) strip.style.display = 'flex';
    window._orSetMode('settlement');
  }

  requestAnimationFrame(function() {
    if (window._hsAnimate) {
      window._hsAnimate(ui, {
        opacity: [0, 1],
        translateY: [14, 0],
        duration: 260,
        easing: 'easeOutQuad',
        complete: function() {
          ui.style.opacity = '1';
          ui.style.transform = 'translateY(0)';
        }
      });
    } else {
      ui.style.opacity = '1';
      ui.style.transform = 'translateY(0)';
    }
  });
}
/* ================================================================
   ============  HUB & SPOKE VISUALIZATION  =======================
   ================================================================ */
(function(){
  const W=860,H=640,CX=430,CY=320,R=25,RHUB=46,RING=226,SPREAD=50;
  const ISLAND_OP_BEFORE=0.22,ISLAND_OP_AFTER=0.04;
  const CAPTION_BEFORE='Valuable information sits across separate systems, formats and teams.';
  const CAPTION_AFTER='Connect every internal system through Phaeron — <b>one hub, any format</b> — removing complexity, cost and risk.';
  const reduceMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Phaeron brand gradients — solid accents for tokens / hover highlights
  const swatch={
    erp:'#2F5285',crm:'#5B7AAB',
    projectmgmt:'#1B3A6B',financial:'#0C1A2E',businessknowledge:'#9F1239',
  };
  const fills={
    erp:['#2F5285','#1B3A6B'],
    crm:['#5B7AAB','#2F5285'],
    projectmgmt:['#1B3A6B','#0C1A2E'],
    financial:['#0C1A2E','#132743'],
    businessknowledge:['#1B3A6B','#9F1239'],
  };
  const LOGO_BASE='/tools/product-demo/assets/logos/';
  const LOGOS={
    erp:[LOGO_BASE+'erp-sap.webp',LOGO_BASE+'erp-oracle.png'],
    crm:[LOGO_BASE+'crm-salesforce.webp',LOGO_BASE+'crm-hubspot.png'],
    projectmgmt:[LOGO_BASE+'pm-jira.webp',LOGO_BASE+'pm-asana.webp'],
    financial:[LOGO_BASE+'fin-excel.webp',LOGO_BASE+'fin-xero.png'],
    businessknowledge:[LOGO_BASE+'bk-sharepoint.webp',LOGO_BASE+'bk-confluence.jpeg'],
  };
  const cssGrad=role=>`linear-gradient(135deg, ${fills[role][0]} 0%, ${fills[role][1]} 100%)`;

  const GROUPS=[
    {role:'erp',         label:'ERP',                    angle:-90, lx:0,   ly:-64, anchor:'middle'},
    {role:'crm',         label:'CRM',                    angle:-18, lx:66,  ly:0,   anchor:'start' },
    {role:'projectmgmt', label:'Project Management',     angle:54,  lx:26,  ly:62,  anchor:'middle'},
    {role:'financial',   label:'Financial Performance',  angle:126, lx:-26, ly:62,  anchor:'middle'},
    {role:'businessknowledge', label:'Business Knowledge', angle:198, lx:-66, ly:0,   anchor:'end'   },
  ];
  const rad=d=>(d*Math.PI)/180;
  GROUPS.forEach(g=>{
    const base=rad(g.angle);
    g.gx=CX+RING*Math.cos(base);g.gy=CY+RING*Math.sin(base);
    const tan=base+Math.PI/2;
    g.nodes=[-0.55,0.55].map(k=>({role:g.role,x:g.gx+k*SPREAD*Math.cos(tan),y:g.gy+k*SPREAD*Math.sin(tan)}));
  });
  const NODES=GROUPS.flatMap(g=>g.nodes);
  // Intra-group edges only — siloed islands, no cross-system mesh
  const INTRA=[];
  GROUPS.forEach(g=>{
    const [a,b]=g.nodes;
    if(a&&b) INTRA.push([a,b]);
  });

  let isAfter=true, hovered=null, autoMode=false, svgReady=false, inView=true;
  let activeAnims=[], autoTimers=[], spokeTokenTimers=[];
  const svgNS='http://www.w3.org/2000/svg';
  function hexPts(r){const w=(Math.sqrt(3)/2)*r;return`0,${-r} ${w},${-r/2} ${w},${r/2} 0,${r} ${-w},${r/2} ${-w},${-r/2}`;}
  const $=id=>document.getElementById(id);
  const ns=(tag,attrs)=>{const e=document.createElementNS(svgNS,tag);if(attrs)Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e;};

  function clearAutoTimers(){
    autoTimers.forEach(t=>clearTimeout(t));
    autoTimers=[];
  }
  function scheduleAuto(fn,ms){
    const id=setTimeout(fn,ms);
    autoTimers.push(id);
    return id;
  }
  function clearSpokeTokens(){
    spokeTokenTimers.forEach(t=>clearTimeout(t));
    spokeTokenTimers=[];
    const g=$('hs-spoke-pulse-g');
    if(g)g.innerHTML='';
  }

  function addSmilToken(parent,fx,fy,tx,ty,col,dur,begin,maxOp){
    const pg=ns('g',{opacity:'0'});
    const mot=document.createElementNS(svgNS,'animateMotion');
    mot.setAttribute('path',`M ${fx} ${fy} L ${tx} ${ty}`);
    mot.setAttribute('dur',`${dur}s`);
    mot.setAttribute('repeatCount','indefinite');
    mot.setAttribute('begin',`${begin}s`);
    mot.setAttribute('calcMode','linear');
    mot.setAttribute('rotate','auto');
    pg.appendChild(mot);
    pg.appendChild(ns('ellipse',{rx:'5',ry:'2.2',fill:col}));
    const opA=document.createElementNS(svgNS,'animate');
    opA.setAttribute('attributeName','opacity');
    opA.setAttribute('values',`0;${maxOp};${maxOp};0`);
    opA.setAttribute('keyTimes','0;0.12;0.85;1');
    opA.setAttribute('dur',`${dur}s`);
    opA.setAttribute('repeatCount','indefinite');
    opA.setAttribute('begin',`${begin}s`);
    pg.appendChild(opA);
    parent.appendChild(pg);
  }

  function startSpokeTokens(){
    clearSpokeTokens();
    if(reduceMotion||!isAfter)return;
    const g=$('hs-spoke-pulse-g');if(!g)return;
    // One inbound token per group (middle node → hub), staggered
    GROUPS.forEach((grp,gi)=>{
      const n=grp.nodes[1];
      const dur=(3.2+gi*0.25).toFixed(2);
      const begin=(gi*0.55).toFixed(2);
      addSmilToken(g,n.x,n.y,CX,CY,swatch[grp.role],dur,begin,0.45);
      // Softer outbound after a delay
      const tid=setTimeout(()=>{
        if(!isAfter||reduceMotion)return;
        addSmilToken(g,CX,CY,n.x,n.y,'#9F1239',(3.8+gi*0.2).toFixed(2),'0',0.28);
      },1400+gi*120);
      spokeTokenTimers.push(tid);
    });
  }

  // ---- SVG built once on first open ----
  function buildSVG(){
    const container=$('hs-diagram');if(!container)return;
    const svg=ns('svg',{viewBox:`0 0 ${W} ${H}`,id:'hs-svg'});
    svg.style.cssText='width:100%;height:100%;display:block;overflow:visible';

    const defs=ns('defs');
    let gradDefs=`
      <radialGradient id="hg-bg-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(159,18,57,0.42)"/>
        <stop offset="100%" stop-color="rgba(159,18,57,0)"/>
      </radialGradient>
      <linearGradient id="hg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0C1A2E"/>
        <stop offset="62%" stop-color="#1B3A6B"/>
        <stop offset="88%" stop-color="#2F5285"/>
        <stop offset="100%" stop-color="#9F1239"/>
      </linearGradient>
      <filter id="hg-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#22323d" flood-opacity="0.22"/>
      </filter>
      <filter id="hg-glow-fil" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`;
    Object.keys(fills).forEach(role=>{
      const [a,b]=fills[role];
      gradDefs+=`
      <linearGradient id="hs-fill-${role}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${a}"/>
        <stop offset="100%" stop-color="${b}"/>
      </linearGradient>
      <radialGradient id="hs-island-${role}-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${a}" stop-opacity="0.55"/>
        <stop offset="55%" stop-color="${b}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${b}" stop-opacity="0"/>
      </radialGradient>`;
    });
    defs.innerHTML=gradDefs;
    svg.appendChild(defs);

    // Soft island halos — local clarity, no shared context
    const islandG=ns('g',{id:'hs-island-g'});
    islandG.style.cssText='pointer-events:none';
    GROUPS.forEach(g=>{
      const halo=ns('ellipse',{
        id:`hs-island-${g.role}`,
        cx:g.gx,cy:g.gy,rx:72,ry:48,
        fill:`url(#hs-island-${g.role}-grad)`,
      });
      halo.style.opacity=String(ISLAND_OP_BEFORE);
      islandG.appendChild(halo);
    });
    svg.appendChild(islandG);

    // Placeholder eco group kept for transition code (no orbit rings)
    const ecoG=ns('g',{id:'hs-eco-g'});
    ecoG.style.cssText='pointer-events:none;opacity:0';
    svg.appendChild(ecoG);

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

    // Spoke signal tokens (After only)
    const spokePulseG=ns('g',{id:'hs-spoke-pulse-g'});
    spokePulseG.style.cssText='pointer-events:none';
    svg.appendChild(spokePulseG);

    // node hex tiles — logo plates (siloed systems)
    const nodeG=ns('g',{id:'hs-node-g'});
    const roleNodeIdx={};
    NODES.forEach((n,i)=>{
      const idxInRole=roleNodeIdx[n.role]|0;
      roleNodeIdx[n.role]=idxInRole+1;
      const logos=LOGOS[n.role]||[];
      const logoSrc=logos[idxInRole%Math.max(logos.length,1)]||logos[0];
      const clipId=`hs-clip-${i}`;
      const g=ns('g',{id:`hs-n${i}`,'data-role':n.role,transform:`translate(${n.x},${n.y})`});
      g.style.cssText='cursor:pointer;transition:opacity 0.18s ease';
      const clip=ns('clipPath',{id:clipId});
      clip.appendChild(ns('polygon',{points:hexPts(R)}));
      defs.appendChild(clip);
      const plate=ns('polygon',{points:hexPts(R+1.5),fill:'#f7fafc',stroke:'rgba(15,34,48,0.12)','stroke-width':'1.2',filter:'url(#hg-shadow)'});
      plate.style.cssText='transform-origin:0px 0px;transform:scale(1);transition:transform 0.22s cubic-bezier(0.34,1.56,0.64,1),filter 0.18s';
      g.appendChild(plate);
      if(logoSrc){
        const img=ns('image',{
          href:logoSrc,
          x:String(-R*0.72),y:String(-R*0.55),
          width:String(R*1.44),height:String(R*1.1),
          preserveAspectRatio:'xMidYMid meet',
          'clip-path':`url(#${clipId})`,
        });
        img.setAttributeNS('http://www.w3.org/1999/xlink','href',logoSrc);
        g.appendChild(img);
      }
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
    hubOuter.style.cssText=`transform:translate(${CX}px,${CY}px);pointer-events:none`;
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

  function cancelAnims(){
    activeAnims.forEach(a=>{try{a&&a.pause&&a.pause();}catch(e){}});
    activeAnims=[];
  }

  function anim(state,params){
    const animate=window._hsAnimate;
    if(!animate)return null;
    const inst=animate(state,params);
    if(inst)activeAnims.push(inst);
    return inst;
  }

  function setIslandOpacity(target,duration,delay){
    GROUPS.forEach((g,i)=>{
      const el=$(`hs-island-${g.role}`);if(!el)return;
      if(reduceMotion||!duration){el.style.opacity=String(target);return;}
      const s={op:parseFloat(el.style.opacity||String(ISLAND_OP_BEFORE))};
      anim(s,{op:target,duration,delay:(delay||0)+i*40,ease:'outQuad',
        onUpdate:()=>el.style.opacity=s.op,
        onComplete:()=>el.style.opacity=String(target)});
    });
  }

  function applyStaticState(after){
    isAfter=after;
    clearSpokeTokens();
    const hubInner=$('hs-hub-inner'),hubGlow=$('hs-hub-glow'),ecoPg=$('hs-eco-g');
    GROUPS.forEach(g=>{
      const el=$(`hs-island-${g.role}`);
      if(el)el.style.opacity=String(after?ISLAND_OP_AFTER:ISLAND_OP_BEFORE);
    });
    if(ecoPg)ecoPg.style.opacity=after?'0':'1';
    if(hubGlow)hubGlow.style.opacity=after?'0.9':'0';
    if(hubInner){
      hubInner.style.transform=after?'scale(1)':'scale(0)';
      hubInner.style.opacity=after?'1':'0';
    }
    NODES.forEach((n,i)=>{
      const el=$(`hs-s${i}`);if(!el)return;
      const len=parseFloat(el.getAttribute('data-len'));
      el.setAttribute('stroke-dashoffset',after?'0':String(len));
      el.style.opacity=after?'0.9':'0';
      el.setAttribute('stroke','#1B3A6B');
      el.setAttribute('stroke-width','1.8');
    });
    if(after&&!reduceMotion)startSpokeTokens();
    updateUI();
  }

  // ---- BEFORE → AFTER (total motion ≤ ~1.5s) ----
  function transitionToAfter(){
    if(!svgReady)return;
    if(reduceMotion){applyStaticState(true);return;}
    isAfter=true;cancelAnims();clearSpokeTokens();hovered=null;applyHover();

    const hubInner=$('hs-hub-inner');
    const hubGlow=$('hs-hub-glow');
    const ecoPg=$('hs-eco-g');

    if(ecoPg){
      const ps={op:parseFloat(ecoPg.style.opacity||'1')};
      anim(ps,{op:0,duration:220,ease:'outQuad',onUpdate:()=>ecoPg.style.opacity=ps.op,onComplete:()=>ecoPg.style.opacity='0'});
    }
    setIslandOpacity(ISLAND_OP_AFTER,360,0);

    const gs={op:parseFloat(hubGlow.style.opacity||'0')};
    anim(gs,{op:0.9,duration:420,delay:80,ease:'outCubic',
      onUpdate:()=>hubGlow.style.opacity=gs.op,
      onComplete:()=>hubGlow.style.opacity='0.9'});

    const curHubS=parseFloat((hubInner.style.transform.match(/scale\(([^)]+)\)/)||[])[1]||'0')||0;
    const curHubOp=parseFloat(hubInner.style.opacity||'0')||0;
    const hs={s:curHubS,op:curHubOp};
    anim(hs,{s:1,op:1,duration:520,delay:100,ease:'outBack',
      onUpdate:()=>{hubInner.style.transform=`scale(${hs.s})`;hubInner.style.opacity=hs.op;},
      onComplete:()=>{hubInner.style.transform='scale(1)';hubInner.style.opacity='1';}});

    NODES.forEach((n,i)=>{
      const el=$(`hs-s${i}`);if(!el)return;
      const len=parseFloat(el.getAttribute('data-len'));
      el.setAttribute('stroke','#1B3A6B');
      const ss={d:len,op:0};
      anim(ss,{d:0,op:0.9,duration:380,delay:220+i*28,ease:'inOutCubic',
        onUpdate:()=>{el.setAttribute('stroke-dashoffset',ss.d);el.style.opacity=ss.op;},
        onComplete:()=>{el.setAttribute('stroke-dashoffset','0');el.style.opacity='0.9';}});
    });

    const spokeStart=setTimeout(()=>{if(isAfter)startSpokeTokens();},780);
    spokeTokenTimers.push(spokeStart);
    updateUI();
  }

  // ---- AFTER → BEFORE ----
  function transitionToBefore(){
    if(!svgReady)return;
    if(reduceMotion){applyStaticState(false);return;}
    isAfter=false;cancelAnims();clearSpokeTokens();hovered=null;applyHover();

    const hubInner=$('hs-hub-inner');
    const hubGlow=$('hs-hub-glow');
    const ecoPg=$('hs-eco-g');

    NODES.forEach((n,i)=>{
      const el=$(`hs-s${i}`);if(!el)return;
      const len=parseFloat(el.getAttribute('data-len'));
      const curD=parseFloat(el.getAttribute('stroke-dashoffset')||'0');
      const curOp=parseFloat(el.style.opacity||'0.9');
      const ss={d:curD,op:curOp};
      const delay=(NODES.length-1-i)*22;
      anim(ss,{d:len,op:0,duration:240,delay,ease:'inCubic',
        onUpdate:()=>{el.setAttribute('stroke-dashoffset',ss.d);el.style.opacity=ss.op;},
        onComplete:()=>{el.setAttribute('stroke-dashoffset',len);el.style.opacity='0';}});
    });

    const curS=parseFloat((hubInner.style.transform.match(/scale\(([^)]+)\)/)||[])[1]||'1');
    const hs={s:curS,op:parseFloat(hubInner.style.opacity||'1')};
    anim(hs,{s:0,op:0,duration:300,delay:100,ease:'inBack(1.3)',
      onUpdate:()=>{hubInner.style.transform=`scale(${hs.s})`;hubInner.style.opacity=hs.op;},
      onComplete:()=>{hubInner.style.transform='scale(0)';hubInner.style.opacity='0';}});

    const gs={op:parseFloat(hubGlow.style.opacity||'0.9')};
    anim(gs,{op:0,duration:260,delay:80,ease:'outQuad',
      onUpdate:()=>hubGlow.style.opacity=gs.op,
      onComplete:()=>hubGlow.style.opacity='0'});

    setIslandOpacity(ISLAND_OP_BEFORE,360,280);

    if(ecoPg){
      const ps={op:0};
      anim(ps,{op:1,duration:320,delay:360,ease:'outQuad',
        onUpdate:()=>ecoPg.style.opacity=ps.op,
        onComplete:()=>ecoPg.style.opacity='1'});
    }

    updateUI();
  }

  function applyHover(){
    GROUPS.forEach(g=>{
      const el=$(`hs-island-${g.role}`);if(!el)return;
      const base=isAfter?ISLAND_OP_AFTER:ISLAND_OP_BEFORE;
      if(!hovered)el.style.opacity=String(base);
      else el.style.opacity=String(hovered===g.role?Math.min(base+0.12,0.34):base*0.3);
    });
    GROUPS.forEach(g=>{
      const eco=$(`hs-eco-${g.role}`);if(!eco||isAfter)return;
      if(!hovered)eco.style.opacity='1';
      else eco.style.opacity=hovered===g.role?'1':'0.22';
    });
    NODES.forEach((n,i)=>{
      const ln=$(`hs-s${i}`);if(!ln)return;
      const active=hovered===n.role;
      ln.setAttribute('stroke',active?swatch[n.role]:'#1B3A6B');
      ln.setAttribute('stroke-width',active?'3.2':'1.8');
      if(hovered&&isAfter)ln.style.opacity=active?'1':'0.08';
      else if(isAfter&&!hovered)ln.style.opacity='0.9';
    });
    NODES.forEach((n,i)=>{
      const g=$(`hs-n${i}`);if(!g)return;
      const active=hovered===n.role;
      g.style.opacity=hovered&&!active?'0.22':'1';
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

  function setCaption(html){
    const cap=$('hs-caption');if(!cap)return;
    if(cap.dataset.html===html){cap.style.opacity='1';return;}
    cap.dataset.html=html;
    if(reduceMotion){cap.innerHTML=html;cap.style.opacity='1';return;}
    cap.style.opacity='0';
    setTimeout(()=>{
      if(cap.dataset.html!==html)return;
      cap.innerHTML=html;
      requestAnimationFrame(()=>{cap.style.opacity='1';});
    },150);
  }

  function updateUI(){
    if($('hs-stage-eyebrow'))$('hs-stage-eyebrow').textContent='After · one connection';
    if($('hs-side-eyebrow'))$('hs-side-eyebrow').textContent='After · connected systems';
    if($('hs-side-before'))$('hs-side-before').style.display='none';
    if($('hs-side-after'))$('hs-side-after').style.display='block';
    setCaption(CAPTION_AFTER);
  }

  function stopAuto(){
    clearAutoTimers();
  }
  function runAutoCycle(){ /* after-only — no before/after loop */ }
  function restartAuto(){
    stopAuto();
  }

  function hsShow(){
    if(!svgReady)buildSVG();
    isAfter=true;
    autoMode=false;
    if(svgReady)applyStaticState(true);
    else updateUI();
    startSpokeTokens();
    const overlay=$('hubSpokeUI');
    if(overlay){
      overlay.classList.add('hs-open');
      if(typeof animatePanelVisibility==='function'){
        animatePanelVisibility(overlay, true, { display: 'flex', y: 16, duration: 220 });
      }else{
        overlay.style.display='flex';
      }
    }
    const list=$('hs-role-list');
    if(list&&!list.children.length){
      GROUPS.forEach(g=>{
        const item=document.createElement('div');
        item.className='hs-role-item';item.dataset.role=g.role;
        item.style.transition='background 0.18s,font-weight 0.1s';
        item.innerHTML=`<span class="hs-role-swatch" style="background:${cssGrad(g.role)}"></span>${g.label}`;
        item.addEventListener('mouseenter',()=>{hovered=g.role;applyHover();});
        item.addEventListener('mouseleave',()=>{hovered=null;applyHover();});
        list.appendChild(item);
      });
    }
    updateUI();
  }

  function hsHide(){
    cancelAnims();stopAuto();clearSpokeTokens();autoMode=false;hovered=null;
    const overlay=$('hubSpokeUI');
    if(overlay){
      overlay.classList.remove('hs-open');
      if(typeof animatePanelVisibility==='function'){
        animatePanelVisibility(overlay, false, { display: 'none', y: 16, duration: 220 });
      }else{
        overlay.style.display='none';
      }
    }
    const btn=$('globeSwitchHubSpoke');if(btn)btn.classList.remove('active');
    const olp=$('officeLayerPanel');if(olp)olp.style.display='';
    updateUI();
  }

  window._hsShow=hsShow;window.hsHide=hsHide;

  function wireButtons(){
    // After-only Product Demo — no before/after toggle
    if($('hubSpokeUI')&&$('hubSpokeUI').classList.contains('hs-open')){
      hsShow();
    }
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',wireButtons);}
  else{wireButtons();}
})();


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

window._orBuildStepBar=function(count){
  const bar=document.getElementById('orStepBar');
  if(!bar)return;
  const steps=Array.from({length:count},(_,i)=>i+1);
  bar.innerHTML='';
  const label=document.createElement('span');
  label.textContent='STEP';
  label.style.cssText='font:600 9px/1 -apple-system,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#9aa6b0;margin-right:4px;';
  bar.appendChild(label);
  steps.forEach((n)=>{
    const b=document.createElement('button');
    b.id='orStep'+n;
    b.textContent=n;
    b.style.cssText='width:22px;height:22px;border-radius:50%;border:1px solid #e3e9ef;background:#fff;color:#566571;font:600 10px/1 -apple-system,sans-serif;cursor:pointer;';
    b.addEventListener('click',()=>window._orSetActiveStep(n));
    bar.appendChild(b);
  });
  if(window._orActiveStep!==null && window._orActiveStep!==undefined){
    window._orSetActiveStep(window._orActiveStep);
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


/* ===== PRODUCTS NAVIGATION (injected from index.html) ===== */
/* ===== PRODUCTS NAVIGATION ===== */
(function initProductNav(){
  'use strict';
  /* Hub geometry (pixels within the 280×440 container) */
  const HUB_CX=225, HUB_CY=220, RADIUS=145;
  const RAD=Math.PI/180;

  const PRODUCTS=[
    {id:'settlements',              lines:['Product','B'], angle:240, color:'#2F5285', colorD:'#1B3A6B', stroke:'rgba(27,58,107,0.5)'},
    {id:'share-class-conversions',  lines:['Product','C'], angle:210, color:'#1B3A6B', colorD:'#0C1A2E', stroke:'rgba(27,58,107,0.5)'},
    {id:'transfers',                lines:['Product','D'], angle:180, color:'#0d4a7a', colorD:'#0a3a60', stroke:'rgba(13,74,122,0.5)'},
    {id:'dividends',                lines:['Product','E'], angle:150, color:'#6A4FA0', colorD:'#513c7a', stroke:'rgba(106,79,160,0.5)'},
    {id:'reporting',                lines:['Product','F'], angle:120, color:'#B07C2C', colorD:'#8a6020', stroke:'rgba(176,124,44,0.5)'},
    {id:'cdsc',                     lines:['Product','G'], angle: 90, color:'#3B6EA5', colorD:'#2d5580', stroke:'rgba(59,110,165,0.5)'},
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
    // Product Demo stays on the hub & spoke overview — no Calastone order-routing flow
    if(currentMode==='hubspoke'||currentMode==='orderrouting'){
      if(currentMode==='orderrouting'&&typeof switchToHubSpoke==='function')switchToHubSpoke();
      return;
    }
    // Network Overview page (globe modes)
    if(id==='settlements'){
      if(typeof switchToSettlements==='function')switchToSettlements();
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



/* ===== INITIALIZATION ===== */
(function() {
  function init() {
    switchToHubSpoke();
    window._productNavShow && window._productNavShow();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

