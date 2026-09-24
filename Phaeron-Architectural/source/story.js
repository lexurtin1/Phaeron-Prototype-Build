(() => {
 'use strict';
 const chapters=[...document.querySelectorAll('.chapter')];
 const layers=[...document.querySelectorAll('.art-layer')];
 const links=[...document.querySelectorAll('.layer-nav a')];
 const labels=[...document.querySelectorAll('.callout')];
 const svg=document.querySelector('#architecture');
 const labelGroup=document.querySelector('#stack-labels');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=matchMedia('(max-width: 760px)');
 const titles=[
  'Information, everywhere.',
  'Separate views. Missing connections.',
  'The context that brings it together.',
  'From information to relevance.'
 ];
 const captionIds=['01','02','03','04'];
 let anchors=[],frame=0,last=-1;
 const clamp=x=>Math.max(0,Math.min(1,x));

 function measure(){anchors=chapters.map(el=>scrollY+el.getBoundingClientRect().top)}

 function pose(scene,i){
  if(scene===0)return {y:[160,45,-70,-185][i],scale:.96,opacity:1};
  if(i===scene-1)return {y:-25,scale:1.27,opacity:1};
  return {y:i<scene-1?640:-640,scale:.8,opacity:0};
 }

 function render(){
  frame=0;let scene=0;const offset=mobile.matches?130:134;
  while(scene<anchors.length-1&&scrollY>=anchors[scene+1]-offset)scene++;
  const next=Math.min(scene+1,anchors.length-1),start=Math.max(0,anchors[scene]-offset),end=anchors[next]-offset;
  const local=next===scene?0:clamp((scrollY-start)/Math.max(1,end-start));
  let t=clamp((local-.62)/.38);t=t*t*(3-2*t);if(reduced.matches)t=0;
  svg.classList.remove('final-state');
  layers.forEach((el,i)=>{
   const a=pose(scene,i),b=pose(next,i);
   const y=a.y+(b.y-a.y)*t,s=a.scale+(b.scale-a.scale)*t;
   el.setAttribute('transform',`translate(600 ${540+y}) scale(${s}) translate(-600 -540)`);
   el.setAttribute('opacity',a.opacity+(b.opacity-a.opacity)*t);
   el.classList.remove('spotlight','lowlight');
  });
  labelGroup.setAttribute('opacity',scene===0?1-t:0);
  labels.forEach(el=>el.setAttribute('opacity','1'));

  if(scene!==last){
   last=scene;
   document.querySelector('#caption-index').textContent=captionIds[scene]+' / 04';
   document.querySelector('#caption-title').textContent=titles[scene];
   svg.setAttribute('aria-label',titles[scene]);
   document.querySelector('#art-title').textContent=titles[scene];
   links.forEach((link,i)=>i===scene?link.setAttribute('aria-current','step'):link.removeAttribute('aria-current'));
  }
  document.querySelector('#caption-state').textContent=scene===0?'ASSEMBLED':'ISOLATED LAYER';
  document.querySelector('#progress').style.width=(clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))*100)+'%';
  document.querySelector('.stage').style.visibility=mobile.matches&&document.querySelector('.footer').getBoundingClientRect().top<innerHeight*.5?'hidden':'visible';
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(render)}
 measure();render();
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',()=>{measure();schedule()});
 addEventListener('pageshow',()=>{measure();schedule()});
 reduced.addEventListener('change',schedule);
 if('ResizeObserver'in window)new ResizeObserver(()=>{measure();schedule()}).observe(document.querySelector('.chapters'));
})();
