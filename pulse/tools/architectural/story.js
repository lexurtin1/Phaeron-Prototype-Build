(() => {
 'use strict';
 const chapters=[...document.querySelectorAll('.chapter')];
 const layers=[...document.querySelectorAll('.art-layer')];
 const links=[...document.querySelectorAll('.layer-nav a')];
 const labels=[...document.querySelectorAll('.callout')];
 const svg=document.querySelector('#architecture');
 const labelGroup=document.querySelector('#stack-labels');
 const art=document.querySelector('.art');
 const tileA=document.querySelector('.tile-layer[data-layer="8a"]');
 const tileB=document.querySelector('.tile-layer[data-layer="8b"]');
 const tileImgA=tileA?.querySelector('img');
 const tileImgB=tileB?.querySelector('img');
 const systemLinks=document.querySelector('#tile-links');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=matchMedia('(max-width: 760px)');
 const titles=[
  'Information, everywhere.',
  'Separate views. Missing connections.',
  'The context that brings it together.',
  'From information to relevance.',
  'Front-end systems',
  'Executive surfaces'
 ];
 const captionIds=['01','02','03','04','08A','08B'];
 const tilePorts=window.PHAERON_TILE_PORTS||{a:[],b:[]};
 const VB={x:0,y:75,w:1280,h:960};
 let anchors=[],frame=0,last=-1,spokeNodes=null;
 const clamp=x=>Math.max(0,Math.min(1,x));
 const mix=(a,b,t)=>a+(b-a)*t;

 function measure(){anchors=chapters.map(el=>scrollY+el.getBoundingClientRect().top)}

 function pose(scene,i){
  if(scene===0||scene>=4)return {y:[160,45,-70,-185][i],scale:.96,opacity:1};
  if(i===scene-1)return {y:-25,scale:1.27,opacity:1};
  return {y:i<scene-1?640:-640,scale:.8,opacity:0};
 }

 function tilePose(scene,bank){
  const showA=scene>=4;
  const showB=scene>=5;
  const visible=bank==='a'?showA:showB;
  // Native tiles already sit on the ridge; only a tiny settle
  const baseY=bank==='b'?-6:0;
  if(!visible)return {y:baseY+10,scale:.98,opacity:0};
  // Keep 8a readable under 8b without competing for the same ridge
  if(bank==='a'&&showB)return {y:baseY+4,scale:.96,opacity:.38};
  return {y:baseY,scale:1,opacity:1};
 }

 // Map architecture viewBox coords into art-local pixels (same framing as #architecture)
 function viewBoxPoint(vx,vy){
  if(!art||!svg)return null;
  const d=art.getBoundingClientRect();
  const s=svg.getBoundingClientRect();
  if(s.width<2)return null;
  const scale=Math.min(s.width/VB.w,s.height/VB.h);
  const drawW=VB.w*scale,drawH=VB.h*scale;
  const ox=s.left-d.left+(s.width-drawW)/2;
  const oy=s.top-d.top+(s.height-drawH)/2;
  return {x:ox+(vx-VB.x)*scale,y:oy+(vy-VB.y)*scale};
 }

 function ensureSpokes(){
  if(!systemLinks||spokeNodes)return spokeNodes;
  const NS='http://www.w3.org/2000/svg';
  systemLinks.innerHTML='';
  const paths=[];
  for(let i=0;i<8;i++){
   const path=document.createElementNS(NS,'path');
   path.setAttribute('class','tile-spoke');
   systemLinks.append(path);
   paths.push(path);
  }
  spokeNodes={paths};
  return spokeNodes;
 }

 function connectSpokes(scene,alphaA,alphaB){
  if(!systemLinks)return;
  const nodes=ensureSpokes();
  const show=scene>=4&&(alphaA>.12||alphaB>.12);
  systemLinks.style.opacity=show?'1':'0';
  if(!show){nodes.paths.forEach(p=>p.style.opacity='0');return}
  const dbox=art.getBoundingClientRect();
  systemLinks.setAttribute('viewBox',`0 0 ${Math.max(1,dbox.width)} ${Math.max(1,dbox.height)}`);

  const links=[];
  if(alphaA>.12){
   (tilePorts.a||[]).forEach(entry=>{
    const from=viewBoxPoint(entry.port[0],entry.port[1]);
    const to=viewBoxPoint(entry.anchor[0],entry.anchor[1]);
    if(from&&to)links.push({from,to,alpha:alphaA});
   });
  }
  if(alphaB>.12){
   (tilePorts.b||[]).forEach(entry=>{
    const from=viewBoxPoint(entry.port[0],entry.port[1]);
    const to=viewBoxPoint(entry.anchor[0],entry.anchor[1]);
    if(from&&to)links.push({from,to,alpha:alphaB});
   });
  }

  links.forEach(({from,to,alpha},i)=>{
   const path=nodes.paths[i];
   if(!path)return;
   path.setAttribute('d',`M${from.x.toFixed(1)} ${from.y.toFixed(1)}L${to.x.toFixed(1)} ${to.y.toFixed(1)}`);
   path.style.opacity=String(clamp(alpha*.55,0,.55));
  });
  for(let i=links.length;i<8;i++)nodes.paths[i].style.opacity='0';
 }

 function render(){
  frame=0;let scene=0;const offset=mobile.matches?130:134;
  while(scene<anchors.length-1&&scrollY>=anchors[scene+1]-offset)scene++;
  const next=Math.min(scene+1,anchors.length-1),start=Math.max(0,anchors[scene]-offset),end=anchors[next]-offset;
  const local=next===scene?0:clamp((scrollY-start)/Math.max(1,end-start));
  let t=clamp((local-.62)/.38);t=t*t*(3-2*t);if(reduced.matches)t=0;
  svg.classList.toggle('final-state',scene>=4);
  layers.forEach((el,i)=>{
   const a=pose(scene,i),b=pose(next,i);
   const y=a.y+(b.y-a.y)*t,s=a.scale+(b.scale-a.scale)*t;
   el.setAttribute('transform',`translate(600 ${540+y}) scale(${s}) translate(-600 -540)`);
   el.setAttribute('opacity',a.opacity+(b.opacity-a.opacity)*t);
   el.classList.remove('spotlight','lowlight');
  });
  labelGroup.setAttribute('opacity',scene===0?1-t:scene>=4?1:next>=4?t:0);
  labels.forEach(el=>el.setAttribute('opacity','1'));

  let alphaA=0,alphaB=0;
  if(tileA){
   const a=tilePose(scene,'a'),b=tilePose(next,'a');
   alphaA=mix(a.opacity,b.opacity,t);
   tileA.style.setProperty('--y',mix(a.y,b.y,t)+'px');
   tileA.style.setProperty('--scale',mix(a.scale,b.scale,t));
   tileA.style.setProperty('--alpha',alphaA);
   tileA.setAttribute('aria-hidden',alphaA<.05?'true':'false');
  }
  if(tileB){
   const a=tilePose(scene,'b'),b=tilePose(next,'b');
   alphaB=mix(a.opacity,b.opacity,t);
   tileB.style.setProperty('--y',mix(a.y,b.y,t)+'px');
   tileB.style.setProperty('--scale',mix(a.scale,b.scale,t));
   tileB.style.setProperty('--alpha',alphaB);
   tileB.setAttribute('aria-hidden',alphaB<.05?'true':'false');
  }
  const spokeScene=scene===next||t<.5?scene:next;
  connectSpokes(spokeScene,alphaA,alphaB);

  if(scene!==last){
   last=scene;
   document.querySelector('#caption-index').textContent=captionIds[scene]+' / 08B';
   document.querySelector('#caption-title').textContent=titles[scene];
   svg.setAttribute('aria-label',titles[scene]);
   document.querySelector('#art-title').textContent=titles[scene];
   links.forEach((link,i)=>i===scene?link.setAttribute('aria-current','step'):link.removeAttribute('aria-current'));
  }
  document.querySelector('#caption-state').textContent=scene===0?'ASSEMBLED':scene>=4?'SURFACES':'ISOLATED LAYER';
  document.querySelector('#progress').style.width=(clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))*100)+'%';
  document.querySelector('.stage').style.visibility=mobile.matches&&document.querySelector('.footer').getBoundingClientRect().top<innerHeight*.5?'hidden':'visible';
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(render)}
 measure();render();
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',()=>{measure();spokeNodes=null;schedule()});
 addEventListener('pageshow',()=>{measure();schedule()});
 reduced.addEventListener('change',schedule);
 if('ResizeObserver'in window)new ResizeObserver(()=>{measure();schedule()}).observe(document.querySelector('.chapters'));
})();
