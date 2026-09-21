(() => {
  'use strict';
  const chapters=[...document.querySelectorAll('.chapter')];
  const layers=[...document.querySelectorAll('.layer')];
  const links=[...document.querySelectorAll('.layer-nav a')];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=window.matchMedia('(max-width: 760px)');
  const diagram=document.querySelector('#diagram');
  const captionNumber=document.querySelector('#caption-number');
  const captionTitle=document.querySelector('#caption-title');
  const captionAside=document.querySelector('#caption-aside');
  const viewMode=document.querySelector('#view-mode');
  const progress=document.querySelector('#reading-progress');
  const titles=['The complete context architecture','Foundation','Access and governance','Context engine','Context assembly','Relevance','Verified answers','Across the business','The complete system'];
  const ids=['ALL','01','02','03','04','05','06','07','08'];
  const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
  const smooth=v=>v*v*(3-2*v);
  const mix=(a,b,t)=>a+(b-a)*t;
  let anchors=[],frame=0,last=-1,fit=1;

  function measure(){
    anchors=chapters.map(el=>window.scrollY+el.getBoundingClientRect().top);
    const h=diagram.getBoundingClientRect().height||window.innerHeight*.64;
    fit=Math.min(1,h/(mobile.matches?330:650));
  }
  function pose(scene,index,small){
    const assembled=scene===0||scene===8;
    if(assembled){
      const gap=small?19:43;
      const base=small?68:150;
      return {y:(base-index*gap)*fit,scale:(small?.57:.69)*fit,opacity:1};
    }
    const selected=scene-1;
    if(index===selected)return {y:0,scale:(small?.94:1.02)*fit,opacity:1};
    const direction=index<selected?1:-1;
    return {y:direction*(small?190:430)*fit,scale:(small?.55:.62)*fit,opacity:0};
  }
  function render(){
    frame=0;
    const y=window.scrollY,offset=mobile.matches?130:134;
    let scene=0;
    while(scene<anchors.length-1&&y>=anchors[scene+1]-offset)scene++;
    const next=Math.min(scene+1,chapters.length-1);
    const start=Math.max(0,anchors[scene]-offset),end=anchors[next]-offset;
    const local=next===scene?0:clamp((y-start)/Math.max(1,end-start));
    let t=next===scene?0:smooth(clamp((local-.66)/.34));
    if(reduced.matches)t=0;
    const small=mobile.matches;
    layers.forEach((el,i)=>{
      const a=pose(scene,i,small),b=pose(next,i,small);
      el.style.setProperty('--y',mix(a.y,b.y,t)+'px');
      el.style.setProperty('--scale',mix(a.scale,b.scale,t));
      el.style.setProperty('--alpha',mix(a.opacity,b.opacity,t));
      el.style.zIndex=String(i+1);
      el.classList.toggle('is-focus',(scene===0||scene===8||i===scene-1));
    });
    if(scene!==last){
      last=scene;
      captionNumber.textContent=scene===0?'01 — 08':'LAYER '+ids[scene]+' / 08';
      captionTitle.textContent=titles[scene];
      captionAside.textContent=scene===0?'SCROLL TO DECONSTRUCT':scene===8?'SYSTEM COMPLETE':'ISOLATED LAYER';
      viewMode.textContent=scene===0?'ASSEMBLED':'LAYER '+ids[scene];
      diagram.setAttribute('aria-label',titles[scene]);
      links.forEach((link,i)=>i===scene-1?link.setAttribute('aria-current','step'):link.removeAttribute('aria-current'));
    }
    const readable=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    progress.style.width=clamp(y/readable)*100+'%';
    const footer=document.querySelector('.footer').getBoundingClientRect();
    document.querySelector('.stage').style.visibility=small&&footer.top<window.innerHeight*.5?'hidden':'visible';
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(render)}
  measure();render();
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',()=>{measure();schedule()});
  window.addEventListener('pageshow',()=>{measure();schedule()});
  reduced.addEventListener('change',schedule);
  if('ResizeObserver'in window)new ResizeObserver(()=>{measure();schedule()}).observe(document.querySelector('.chapters'));
})();
