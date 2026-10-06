const $=id=>document.getElementById(id);
const root=$('liver-case'), button=$('tace-select'), panel=$('tace-display');
const video=$('tace-video'), seek=$('tace-time'), play=$('tace-play');
const context=$('tace-context'), detail=$('tace-detail');
seek.disabled=true;
document.querySelectorAll('[data-tace-phase]').forEach(el=>el.disabled=true);
let active=false, timeline=null, loadPromise=null, frameRequest=null;
const phases={ADVANCE:'Catheter placement',POSITIONED:'Catheter placement',INFUSE:'Particle delivery',TRANSPORT:'Embolization'};
const phaseKeys={ADVANCE:'placement',POSITIONED:'placement',INFUSE:'delivery',TRANSPORT:'embolization'};
function setText(id,value){const el=$(id);if(el.textContent!==String(value))el.textContent=value;}
function draw(){
  if(video.readyState<2)return;
  // Both crops use the same decoded frame; source contains no rasterized labels.
  const w=video.videoWidth/1920,h=video.videoHeight/1512;
  for(const [canvas,crop] of [[context,[110,72,760,1420]],[detail,[1010,152,850,610]]]){
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(video,crop[0]*w,crop[1]*h,crop[2]*w,crop[3]*h,0,0,canvas.width,canvas.height);
  }
  seek.value=video.currentTime;
  const state=timeline?.[Math.min(287,Math.floor(video.currentTime*24))];
  if(state){
    const key=phaseKeys[state.phase];setText('tace-phase',phases[state.phase]);
    const fade=matchMedia('(prefers-reduced-motion: reduce)').matches ? .09 : .3;
    const edge=Math.min(...[95/24,217/24].map(t=>Math.abs(video.currentTime-t)));
    $('tace-phase').style.opacity=String(Math.min(1,edge/fade));
    setText('tace-code-phase',key);setText('tace-code-time',state.model_seconds.toFixed(2));
    setText('tace-code-catheter',state.catheter_progress>=.999?'positioned':'advancing');
    setText('tace-code-released',state.released);setText('tace-code-lodged',state.lodged);
    document.querySelectorAll('[data-tace-phase]').forEach(el=>el.setAttribute('aria-current',el.dataset.tacePhase===key?'step':'false'));
  }
}
function loop(){draw();if(active&&!video.paused&&!video.ended)frameRequest=requestAnimationFrame(loop);}
function pause(){video.pause();cancelAnimationFrame(frameRequest);setText('tace-play-label',video.ended?'Replay':'Play');play.setAttribute('aria-pressed','false');}
async function load(){
  if(loadPromise)return loadPromise;
  loadPromise=(async()=>{
    const response=await fetch(new URL('../data/tace/timeline.json',import.meta.url));
    if(!response.ok)throw Error('Timeline unavailable');timeline=await response.json();
    video.src=new URL('../video/tace-atlas-clean.mp4',import.meta.url).href;
    await new Promise((resolve,reject)=>{video.addEventListener('loadeddata',resolve,{once:true});video.addEventListener('error',reject,{once:true});video.load();});
    draw();play.disabled=false;seek.disabled=false;
    document.querySelectorAll('[data-tace-phase]').forEach(el=>el.disabled=false);
    $('tace-loading').hidden=true;
  })().catch(error=>{loadPromise=null;$('tace-loading').hidden=true;$('tace-error').hidden=false;throw error;});
  return loadPromise;
}
async function activate(on){
  if(active===on){if(on){try{await load();draw();}catch{}}return;}
  active=on;root.classList.toggle('tace-active',on);button.setAttribute('aria-pressed',String(on));
  panel.hidden=!on;$('tace-code').hidden=!on;$('tace-origin').hidden=!on;
  $('case-growth-title').hidden=on;$('case-treatment-title').hidden=!on;
  if(on){
    if(window.__CLINICALCASE__)window.__CLINICALCASE__.setDay(window.__CLINICALCASE__.day);
    document.querySelectorAll('[data-case-view]').forEach(el=>el.setAttribute('aria-pressed','false'));
    try{await load();draw();}catch{}
  }else{pause();window.dispatchEvent(new Event('resize'));}
}
button.addEventListener('click',()=>activate(true));
document.querySelectorAll('[data-case-view]').forEach(el=>el.addEventListener('click',()=>activate(false)));
const viewMenu=document.querySelector('.case-view-menu');
viewMenu.querySelectorAll('button').forEach(el=>el.addEventListener('click',()=>{
  viewMenu.open=false;viewMenu.querySelector('summary').focus({preventScroll:true});
}));
document.addEventListener('click',event=>{if(!viewMenu.contains(event.target))viewMenu.open=false;});
viewMenu.addEventListener('keydown',event=>{if(event.key==='Escape'){viewMenu.open=false;viewMenu.querySelector('summary').focus();}});
play.addEventListener('click',async()=>{
  if(!video.paused){pause();return;}
  if(video.ended||video.currentTime>=11.98)video.currentTime=0;
  try{await video.play();setText('tace-play-label','Pause');play.setAttribute('aria-pressed','true');loop();}catch{pause();}
});
seek.addEventListener('input',()=>{pause();video.currentTime=Number(seek.value);});
video.addEventListener('seeked',draw);video.addEventListener('ended',()=>{pause();draw();});
document.querySelectorAll('[data-tace-phase]').forEach(el=>el.addEventListener('click',()=>{pause();video.currentTime=Number(el.dataset.seek);}));
if(!panel.requestFullscreen)$('tace-expand').hidden=true;
$('tace-expand').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await panel.requestFullscreen();}catch{}
});
document.addEventListener('fullscreenchange',()=>{
  const label=document.fullscreenElement===panel?'Exit fullscreen':'Expand TACE';
  $('tace-expand').setAttribute('aria-label',label);$('tace-expand').title=label;
});
$('tace-retry').addEventListener('click',()=>{$('tace-error').hidden=true;$('tace-loading').hidden=false;activate(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
document.querySelectorAll('[data-panel]').forEach(el=>el.addEventListener('click',()=>{if(el.dataset.panel!=='trajectories')pause();}));
new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))pause();}).observe(panel);
window.__TACE_EXAMPLE__={activate,prepare:load,pause,get ready(){return !!timeline&&video.readyState>=2;},get active(){return active;},async frame(t){await activate(true);pause();if(video.readyState<2)throw Error('TACE video unavailable');if(Math.abs(video.currentTime-t)<.002){draw();return;}await new Promise(resolve=>{video.addEventListener('seeked',resolve,{once:true});video.currentTime=Math.max(0,Math.min(11.999,t));});draw();}};
