(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const holders = [...document.querySelectorAll('.layer')];
  const E = (name, attrs = {}, parent, content) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (content !== undefined) node.textContent = content;
    if (parent) parent.append(node);
    return node;
  };
  const G = (parent, cls = '') => E('g', cls ? { class: cls } : {}, parent);
  const line = (p, x1, y1, x2, y2, cls = 'blue-line') => E('line', { x1, y1, x2, y2, class: cls }, p);
  const rect = (p, x, y, width, height, cls = 'tile', rx = 0) => E('rect', { x, y, width, height, rx, class: cls }, p);
  const text = (p, x, y, value, cls = 'svg-small', anchor = 'start') => E('text', { x, y, class: cls, 'text-anchor': anchor }, p, value);
  const circle = (p, cx, cy, r, cls = 'node') => E('circle', { cx, cy, r, class: cls }, p);
  const poly = (p, points, cls) => E('polygon', { points: points.map(v => v.join(',')).join(' '), class: cls }, p);
  const plane = (u, v, z = 0) => [500 + (u - v) * 335, 105 + (u + v) * 190 - z];
  const diamond = [[500,105],[835,295],[500,485],[165,295]];
  const cellPoints = (u, v, du, dv) => [plane(u,v),plane(u+du,v),plane(u+du,v+dv),plane(u,v+dv)];

  function svg(label) {
    const root = E('svg', { viewBox:'0 0 1000 600', class:'layer-svg', role:'img', 'aria-label':label });
    E('ellipse', { cx:500, cy:516, rx:245, ry:14, class:'slab-shadow' }, root);
    poly(root, [[165,295],[500,485],[835,295],[835,311],[500,501],[165,311]], 'slab-edge');
    poly(root, diamond, 'slab-top');
    return root;
  }
  function pill(p, x, y, w, label, cls = 'tile') {
    rect(p,x,y,w,22,cls,11); text(p,x+w/2,y+15,label,'svg-micro', 'middle');
  }
  function node(p, x, y, label, central = false) {
    line(p,x,y+8,x,y+28,'pale-line');
    E('ellipse',{cx:x,cy:y+30,rx:10,ry:3,class:'pale-fill'},p);
    circle(p,x,y,central?11:8,'node');
    if(central) circle(p,x,y,3,'red-fill');
    text(p,x,y-14,label,label.length>19?'svg-micro':'svg-small','middle');
  }
  function card(p,x,y,w,h,header) {
    rect(p,x,y,w,h,'tile',2); line(p,x,y+26,x+w,y+26,'pale-line'); text(p,x+12,y+17,header,'svg-micro-blue');
  }

  function foundation() {
    const s=svg('Foundation: UNITY internal sources and PULSE external sources join without moving the sources.');
    const left=G(s,'foundation-left'); const right=G(s,'foundation-right');
    poly(left,[[500,105],[500,485],[165,295]],'pale-fill'); poly(left,[[500,105],[500,485],[165,295]],'blue-line');
    poly(right,[[500,105],[835,295],[500,485]],'tile');
    line(s,500,108,500,482,'blue-line'); text(s,395,302,'UNITY','svg-title','middle'); text(s,605,302,'PULSE','svg-title','middle');
    for(let i=1;i<12;i++) for(let j=1;j<9;j++) {
      const [x,y]=plane(i/12,j/10); if (x<488 || (i+j)%3===0) E('path',{d:`M${x-4} ${y-2}h8m-8 4h5`,class:x<500?'blue-line':'pale-line'},s);
    }
    return s;
  }

  function governance() {
    const s=svg('Access and governance: role permissions change the visible record region and every request is audited.');
    const cells=[];
    for(let i=1;i<11;i++) for(let j=1;j<9;j++){const pts=cellPoints(i/12,j/10,.055,.055);cells.push({i,j,pts});poly(s,pts,'record');}
    const patterns=[G(s,'role-pattern a'),G(s,'role-pattern b'),G(s,'role-pattern c')];
    cells.forEach(({i,j,pts})=>{if((i<6&&j>2&&i+j<12)||(i===7&&j===4))poly(patterns[0],pts,'record-fill');if((i>3&&j<6&&(i*j)%3!==0))poly(patterns[1],pts,'record-fill');if((j>4&&i>2&&i<9&&(i+j)%2===0))poly(patterns[2],pts,'record-fill');});
    const a=plane(.53,.05),b=plane(.53,.95); poly(s,[[a[0],a[1]-42],[b[0],b[1]-42],[b[0],b[1]],[a[0],a[1]]],'pale-fill');poly(s,[[a[0],a[1]-42],[b[0],b[1]-42],[b[0],b[1]],[a[0],a[1]]],'pale-line');text(s,500,194,'CLIENT SEPARATION','svg-micro','middle');
    const lock=G(s);rect(lock,473,259,54,47,'blue-fill',3);E('path',{d:'M484 259v-17a16 16 0 0 1 32 0v17',class:'blue-line','stroke-width':4},lock);circle(lock,500,279,4,'tile');line(lock,500,306,500,326,'blue-line');
    const roles=[['Commercial',314],['Finance',458],['Compliance',586]];roles.forEach(([name,x],i)=>{pill(s,x,350,108,name);circle(s,x+15,361,4,i===0?'blue-fill':'node');});
    roles.forEach(([,x],i)=>{const g=G(s,`role-active ${['a','b','c'][i]}`);circle(g,x+15,361,5,'blue-fill');});
    for(let i=0;i<18;i++)line(s,350+i*18,452,350+i*18,458,i%4===0?'blue-line':'pale-line');
    return s;
  }

  function contextEngine() {
    const s=svg('Context engine: three source records resolve into Riverside Capital and connect to related entities and rules.');
    const links=[[[405,250],[500,220],'distributes'],[[500,220],[605,250],'sold in'],[[405,250],[430,350],'works at'],[[500,220],[570,350],'signed'],[[605,250],[680,340],'applies to']];
    links.forEach((v,i)=>{line(s,...v[0],...v[1],'blue-line');const x=(v[0][0]+v[1][0])/2,y=(v[0][1]+v[1][1])/2;const g=G(s,`relation-pill r${i+1}`);rect(g,x-34,y-9,68,17,'tile',8);text(g,x,y+3,v[2],'svg-micro','middle');});
    node(s,405,250,'Riverside Capital');node(s,500,220,'Global Equity Fund',true);node(s,605,250,'European Equities');node(s,430,350,'Jane Smith');node(s,570,350,'Distribution agreement');node(s,680,340,'SFDR update');
    return s;
  }

  function assembly() {
    const s=svg('Context assembly: a bounded graph selection rebuilds a role-specific context set.');
    const coords=[[350,245],[435,215],[515,260],[610,225],[660,320],[545,355],[410,345],[320,315]];
    [[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[6,7],[0,7],[2,6],[1,6]].forEach(([a,b])=>line(s,...coords[a],...coords[b],'faint-line'));
    coords.forEach(([x,y])=>circle(s,x,y,7,'node faint-node'));
    const a=G(s,'selection-a');E('ellipse',{cx:447,cy:270,rx:135,ry:85,class:'red-line-svg dash'},a);E('ellipse',{cx:447,cy:270,rx:127,ry:77,fill:'#dbeefb',opacity:.34},a);[[0,1],[1,2],[2,5],[5,6],[1,6]].forEach(([i,j])=>line(a,...coords[i],...coords[j],'blue-line'));[0,1,2,5,6].forEach(i=>circle(a,...coords[i],8,'node'));
    const b=G(s,'selection-b');E('ellipse',{cx:570,cy:285,rx:125,ry:80,class:'red-line-svg dash'},b);E('ellipse',{cx:570,cy:285,rx:117,ry:72,fill:'#dbeefb',opacity:.34},b);[[2,3],[3,4],[2,5]].forEach(([i,j])=>line(b,...coords[i],...coords[j],'blue-line'));[2,3,4,5].forEach(i=>circle(b,...coords[i],8,'node'));
    return s;
  }

  function relevance() {
    const s=svg('Relevance: four signals are surfaced from 1,284 assessed items; most information fades away.');
    const coords=[[340,260],[430,215],[520,275],[625,230],[665,325],[545,365],[400,345],[300,330]];
    [[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[6,7],[0,7],[2,6]].forEach(([a,b])=>line(s,...coords[a],...coords[b],'faint-line'));coords.forEach(([x,y])=>circle(s,x,y,6,'node faint-node'));
    const arrivals=[[380,240,-40,-20],[430,200,-30,-40],[620,250,40,-20],[600,360,35,30],[500,190,0,-45],[540,390,15,35],[390,380,-20,40],[580,210,30,-40]];
    arrivals.forEach(([x,y,dx,dy],i)=>{const m=circle(s,x,y,3,'blue-fill incoming-mark');m.style.setProperty('--dx',dx+'px');m.style.setProperty('--dy',dy+'px');m.style.setProperty('--delay',(-i*.63)+'s');});
    [[365,255,'OPPORTUNITY'],[520,240,'RISK'],[590,330,'CHANGE']].forEach(([x,y,label])=>{circle(s,x,y,9,'node');text(s,x+14,y+4,label,'svg-micro-blue');});
    circle(s,450,348,9,'node');text(s,465,352,'CONTRADICTION','svg-micro-red');rect(s,348,375,72,22,'tile',2);rect(s,480,375,72,22,'tile',2);text(s,384,390,'4.2%','svg-micro','middle');text(s,516,390,'5.1%','svg-micro','middle');line(s,420,386,450,351,'red-line-svg');line(s,480,386,450,351,'red-line-svg');
    return s;
  }

  function answers() {
    const s=svg('Verified answers: context enters an open-weight model and unsupported claims are removed by a source check.');
    const tiles=[['CLIENT',320],['PRODUCT',455],['MARKET',590]];tiles.forEach(([v,x])=>{rect(s,x,395,105,30,'tile',2);text(s,x+52,414,'CONTEXT SET','svg-micro','middle');line(s,x+52,395,500,340,'pale-line model-pulse');});
    rect(s,405,275,190,68,'tile',3);for(let i=0;i<7;i++){line(s,395,285+i*8,405,285+i*8,'blue-line');line(s,595,285+i*8,605,285+i*8,'blue-line');}text(s,500,305,'Open-weight','svg-label','middle');text(s,500,325,'model','svg-label','middle');E('ellipse',{cx:500,cy:309,rx:135,ry:62,class:'blue-line dash'},s);text(s,500,380,'RUNS IN YOUR ENVIRONMENT','svg-micro','middle');
    text(s,500,112,'SOURCE CHECK','svg-micro-blue','middle');
    const c1=G(s,'claim one');rect(c1,330,132,340,35,'tile',2);text(c1,344,154,'Client exposure increased 12%','svg-small');pill(c1,548,139,110,'contract record');
    const c2=G(s,'claim two');rect(c2,330,176,340,35,'tile',2);text(c2,344,198,'Usage moved above threshold','svg-small');pill(c2,565,183,93,'usage log');
    const c3=G(s,'claim reject');rect(c3,330,220,340,35,'red-line-svg dash',2);text(c3,344,242,'Unverified market assertion','svg-small');pill(c3,536,227,105,'no matching record');text(c3,655,244,'×','svg-micro-red','middle');
    return s;
  }

  function business() {
    const s=svg('Across the business: six departments query one shared context, with Commercial active and five departments planned.');
    const cx=500,cy=295;
    const positions=[[500,160],[670,215],[685,350],[500,425],[315,350],[330,215]];
    const names=[['PRODUCT','strategy · roadmap · market'],['OPERATIONS','service · risk · delivery'],['FINANCE','performance · exposure · planning'],['ENGINEERING','build · integrate · scale'],['LEGAL','regulation · policy · obligation'],['COMMERCIAL','clients · opportunities · revenue']];
    positions.forEach(([x,y],i)=>line(s,cx,cy,x,y,'pale-line hub-spokes'));
    circle(s,cx,cy,58,'tile');text(s,cx,cy-18,'SHARED CONTEXT','svg-micro-blue','middle');['Riverside Capital','Global Equity Fund','SFDR update','Jane Smith','European Equities'].forEach((v,i)=>text(s,cx,cy+1+i*11,v,'svg-micro','middle'));
    positions.forEach(([x,y],i)=>{const active=i===5;const w=active?190:156,h=active?120:70;const g=G(s);if(!active)g.setAttribute('opacity','.34');rect(g,x-w/2,y-h/2,w,h,'tile',2);text(g,x,y-h/2+20,names[i][0],active?'svg-title':'svg-small','middle');text(g,x,y-h/2+37,names[i][1],'svg-micro','middle');if(!active)text(g,x,y+h/2-10,'PLANNED','svg-micro','middle');if(active){[['Aster Bank','92'],['Riverside Capital','88'],['Northbank','74'],['Mercury AM','66']].forEach(([n,v],j)=>{const r=G(g,j===2?'rank-row move':'rank-row');text(r,x-w/2+14,y-h/2+59+j*14,n,'svg-micro');text(r,x+w/2-14,y-h/2+59+j*14,v,'svg-micro-blue','end');});}});
    return s;
  }

  function complete() {
    const s=svg('Complete system: context is delivered into human decisions and accountable action.');
    const g=G(s,'completion-pulse');
    const hub=[[500,265],[380,325],[620,325],[500,395]];[[0,1],[0,2],[0,3]].forEach(([a,b])=>line(g,...hub[a],...hub[b],'blue-line'));
    circle(g,500,265,42,'tile');text(g,500,258,'CONTEXT','svg-micro-blue','middle');text(g,500,278,'DECISION','svg-title','middle');
    [['GATEWAY',380,325],['INSIGHTS',620,325],['PACKS',500,395]].forEach(([v,x,y])=>{rect(g,x-58,y-24,116,48,'tile',2);text(g,x,y+5,v,'svg-small','middle');});
    return s;
  }

  [foundation,governance,contextEngine,assembly,relevance,answers,business,complete].forEach((build,index)=>holders[index].append(build()));
})();
