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
 // Port centers in 1600×700 tile assets (group translate + port at cy=132)
 const PORTS_A=[[380/1600,(310+132)/700],[720/1600,(345+132)/700],[1120/1600,(295+132)/700],[1420/1600,(330+132)/700]];
 const PORTS_B=[[220/1600,(140+132)/700],[640/1600,(110+132)/700],[980/1600,(155+132)/700],[1360/1600,(130+132)/700]];
 // Distinct back-edge anchors on the top slate (layer 3), left to right, no shared hub
 // UV points near the far ridge of the isometric plate (small u+v)
 const BACK_A=[[55,95],[145,55],[305,55],[395,95]];
 const BACK_B=[[85,55],[175,35],[275,35],[365,55]];
 let anchors=[],frame=0,last=-1,spokeNodes=null;
 const clamp=x=>Math.max(0,Math.min(1,x));
 const mix=(a,b,t)=>a+(b-a)*t;

 function measure(){anchors=chapters.map(el=>scrollY+el.getBoundingClientRect().top)}

 function pose(scene,i){
  if(scene===0||scene>=4)return {y:[160,45,-70,-185][i],scale:.96,opacity:1};
  if(i===scene-1)return {y:-25,scale:1.27,opacity:1};
  return {y:i<scene-1?640:-640,scale:.8,opacity:0};
 }

 function tilePose(scene,bank,small){
  const showA=scene>=4;
  const showB=scene>=5;
  const visible=bank==='a'?showA:showB;
  // Push tiles down onto the back of the top slate
  const baseY=bank==='b'?(small?72:98):(small?108:142);
  const scale=small?.88:.94;
  if(!visible)return {y:baseY-18,scale,opacity:0};
  return {y:baseY,scale,opacity:1};
 }

 function pointOnImg(img,nx,ny){
  if(!img||!art)return null;
  const r=img.getBoundingClientRect();
  const d=art.getBoundingClientRect();
  if(r.width<2||r.height<2)return null;
  const vbW=1600,vbH=700;
  const scale=Math.min(r.width/vbW,r.height/vbH);
  const drawW=vbW*scale,drawH=vbH*scale;
  // object-fit:contain + object-position:center top
  const ox=r.left-d.left+(r.width-drawW)/2;
  const oy=r.top-d.top;
  return {x:ox+nx*vbW*scale,y:oy+ny*vbH*scale};
 }

 // Map isometric UV on the top layer plate into art-local pixels
 function slatePoint(u,v,z=2){
  if(!art||!svg)return null;
  const d=art.getBoundingClientRect();
  const s=svg.getBoundingClientRect();
  if(s.width<2)return null;
  const vbX=0,vbY=75,vbW=1280,vbH=960;
  const scale=Math.min(s.width/vbW,s.height/vbH);
  const drawW=vbW*scale,drawH=vbH*scale;
  const ox=s.left-d.left+(s.width-drawW)/2;
  const oy=s.top-d.top+(s.height-drawH)/2;
  // Local plate point
  const lx=600+.9*(u-v);
  const ly=290+.52*(u+v)-z;
  // Assembled top-layer transform: translate(600, 540-185) scale(.96) translate(-600,-540)
  const ty=540-185;
  const ax=600+.96*(lx-600);
  const ay=ty+.96*(ly-540);
  return {
   x:ox+(ax-vbX)*scale,
   y:oy+(ay-vbY)*scale
  };
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
  if(alphaA>.12&&tileImgA){
   PORTS_A.forEach(([nx,ny],i)=>{
    const from=pointOnImg(tileImgA,nx,ny);
    const [u,v]=BACK_A[i];
    const to=slatePoint(u,v,4);
    if(from&&to)links.push({from,to,alpha:alphaA});
   });
  }
  if(alphaB>.12&&tileImgB){
   PORTS_B.forEach(([nx,ny],i)=>{
    const from=pointOnImg(tileImgB,nx,ny);
    const [u,v]=BACK_B[i];
    const to=slatePoint(u,v,8);
    if(from&&to)links.push({from,to,alpha:alphaB});
   });
  }

  links.forEach(({from,to,alpha},i)=>{
   const path=nodes.paths[i];
   if(!path)return;
   // Short straight drop to the matching back-edge anchor; LTR order avoids crossings
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
  const small=mobile.matches;
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
   const a=tilePose(scene,'a',small),b=tilePose(next,'a',small);
   alphaA=mix(a.opacity,b.opacity,t);
   tileA.style.setProperty('--y',mix(a.y,b.y,t)+'px');
   tileA.style.setProperty('--scale',mix(a.scale,b.scale,t));
   tileA.style.setProperty('--alpha',alphaA);
   tileA.setAttribute('aria-hidden',alphaA<.05?'true':'false');
  }
  if(tileB){
   const a=tilePose(scene,'b',small),b=tilePose(next,'b',small);
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
