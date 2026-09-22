
(() => {
 const chapters=[...document.querySelectorAll('.chapter')], visual=document.querySelector('.scene-svg'), sources=[...document.querySelectorAll('.source')], links=[...document.querySelectorAll('.layer-nav a')];
 const captions=['Information, everywhere.','Separate views. Missing connections.','The context that brings it together.','From information to relevance.','Business knowledge, put to work.'];
 const positions=[[190,244],[400,139],[610,244],[190,404],[400,319],[610,404]], connected=[[235,255],[400,173],[565,255],[235,348],[400,270],[565,348]];
 const modes=['FRAGMENTED','PARTIAL VIEWS','CONNECTED','IN FOCUS','COMPLETE'];
 let current=-1, scheduled=false;
 function activate(n){
  if(n===current)return; current=n; visual.setAttribute('class','scene-svg state-'+n);
  sources.forEach((el,i)=>{const p=n<2?positions[i]:connected[i];el.style.transform=`translate(${p[0]}px,${p[1]}px) scale(${n<2?1:.8})`});
  document.getElementById('caption-title').textContent=captions[n]; document.getElementById('caption-number').textContent=String(n+1).padStart(2,'0')+' / 05';document.getElementById('view-mode').textContent=modes[n];
  document.getElementById('example').classList.toggle('visible',n===3);
  links.forEach((el,i)=>i===n?el.setAttribute('aria-current','step'):el.removeAttribute('aria-current'));
 }
 function update(){scheduled=false;const point=innerHeight*.35;let n=0;chapters.forEach((el,i)=>{if(el.getBoundingClientRect().top<=point)n=i});activate(n); const max=document.documentElement.scrollHeight-innerHeight;document.getElementById('reading-progress').style.width=(max>0?Math.min(100,scrollY/max*100):0)+'%'}
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update)}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);addEventListener('pageshow',schedule);
 const pause=document.getElementById('pause-motion');let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function setPause(){document.body.classList.toggle('paused',paused);pause.setAttribute('aria-pressed',String(paused));pause.textContent=paused?'Resume motion':'Pause motion'}
 pause.addEventListener('click',()=>{paused=!paused;setPause()});setPause();update();
})();
