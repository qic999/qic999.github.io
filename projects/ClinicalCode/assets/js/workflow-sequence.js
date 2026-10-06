import './liver-case.js?v=18';
import './tace-example.js?v=5';

const $=id=>document.getElementById(id);
const root=$('liver-case'), api=window.__CLINICALCASE__, tace=window.__TACE_EXAMPLE__;
const film=!!$('case-film-stage');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const compact=matchMedia('(max-width: 900px)');
const duration=34, steps=[['CT',0,4],['Parsing',4,8],['ClinicalCode',8,12],['Tumor Growth',12,22],['Treatment Simulation',22,34]];
const parts=['.case-ct-part','.case-parse','.case-code','.case-output'].map(s=>root.querySelector(s));
const normalCode=root.querySelector('.case-code-scenes > pre:not(.tace-code)');
const taceCode=$('tace-code'), simulation=root.querySelector('.evolution-scene');
const growthTitle=$('case-growth-title'), treatmentTitle=$('case-treatment-title');
const taceScene=$('tace-display'), codeScenes=root.querySelector('.case-code-scenes');
let time=0, playing=false, raf=0, previous=null, generation=0, tweenTimer=0, lastView='anatomy';
let renderQueue=Promise.resolve(), ready=false;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const n=clamp(x);return n*n*(3-2*n);};
const entrance=(t,start)=>ease((t-start)/(reduced.matches && !film ? .18 : .85));
const clock=t=>`00:${String(Math.floor(t)).padStart(2,'0')}`;

const nav=document.createElement('nav');nav.className='workflow-nav';nav.setAttribute('aria-label','ClinicalCode workflow');
nav.innerHTML=`<div class="workflow-steps">${steps.map(([name],i)=>`<button class="workflow-step" type="button" data-workflow-step="${i}" aria-label="Show ${name}" aria-current="false"><span class="workflow-step-label">${name}</span><span class="workflow-track" aria-hidden="true"><i></i></span></button>`).join('')}</div><button class="workflow-play" type="button" aria-label="Play workflow" title="Play workflow" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path class="play-icon" d="M7 4.5v15L20 12Z"/><path class="pause-icon" d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg></button><output class="workflow-clock" aria-label="Workflow time">00:00 / 00:34</output>`;
root.prepend(nav);
const playButton=nav.querySelector('.workflow-play'), stepButtons=[...nav.querySelectorAll('.workflow-step')];
const currentClock=nav.querySelector('.workflow-clock');

function setOpacity(el,value){
  el.style.opacity=String(value);
  el.style.pointerEvents=value>.04?'':'none';
  el.inert=value<.04;
  el.setAttribute('aria-hidden',String(value<.04));
}
function paint(t){
  const weights=[entrance(t,0),entrance(t,4),entrance(t,8),entrance(t,12)];
  const final=entrance(t,22);
  const mobile=compact.matches&&!film;
  const focus=mobile||(reduced.matches&&!film)?0:1-ease((t-3.1)/.9);
  const sourceScale=1+.65*focus;
  const sourceX=(root.querySelector('.case-stage').clientWidth-parts[0].offsetWidth*1.65)/2;
  parts[0].style.transform=`translate(${sourceX*focus}px,${18*focus}px) scale(${sourceScale})`;
  parts.forEach((el,i)=>setOpacity(el,weights[i]*(mobile&&i<3?1-weights[i+1]:1)));
  setOpacity(normalCode,1-final);setOpacity(taceCode,final);
  setOpacity(simulation,1-final);setOpacity(taceScene,final);
  setOpacity(growthTitle,1-final);setOpacity(treatmentTitle,final);
  growthTitle.hidden=false;treatmentTitle.hidden=false;
  // The shared containers reserve both scenes' full space during the handoff.
  taceScene.hidden=false;taceCode.hidden=false;
  const reveal=ease((t-8)/2.7);
  codeScenes.style.clipPath=`inset(0 0 ${100*(1-reveal)}% 0)`;
  stepButtons.forEach((button,i)=>{
    const [,start,end]=steps[i], current=t>=start&&(t<end||i===steps.length-1);
    button.setAttribute('aria-current',current?'step':'false');
    button.classList.toggle('is-complete',t>=end);
    button.querySelector('i').style.transform=`scaleX(${clamp((t-start)/(end-start))})`;
  });
  currentClock.value=`${clock(t)} / 00:34`;
  const playLabel=playing?'Pause workflow':t>=duration?'Replay workflow':'Play workflow';
  playButton.setAttribute('aria-label',playLabel);playButton.title=playLabel;
  root.dataset.workflowStep=String(Math.min(4,steps.findLastIndex(([,start])=>t>=start)));
  root.dispatchEvent(new CustomEvent('workflowframe',{detail:{time:t}}));
}
async function draw(t){
  time=Math.max(0,Math.min(duration,Number(t)));
  const dt=time;
  if(dt<22){
    await tace.activate(false);
    const slice=dt<3.2?28+Math.round(4*clamp(dt/3.2)):32;
    await api.frame({day:90*ease((dt-12)/9),slice,mode:'tissue',view:lastView,angle:-.35+.25*ease((dt-12)/10)});
  }else{
    if(api.slice!==32)await api.frame({day:90,slice:32,mode:'tissue',view:'anatomy',angle:-.1});
    await tace.frame(Math.min(11.958,dt-22));
  }
  api.setLayerOpacity({organ:entrance(dt,4.15),lesion:entrance(dt,4.55),muscle:entrance(dt,5.15),fat:entrance(dt,5.75)});
  paint(dt);
}
function frame(t){
  // One writer owns canvas/video seeking, including overlapping scrub requests.
  const next=renderQueue.then(()=>draw(t));
  renderQueue=next.catch(()=>{});
  return next;
}
function pause(){
  playing=false;previous=null;generation++;cancelAnimationFrame(raf);tace.pause();
  playButton.setAttribute('aria-pressed','false');
  const label=time>=duration?'Replay workflow':'Play workflow';
  playButton.setAttribute('aria-label',label);playButton.title=label;
}
async function tick(now,token){
  if(!playing||token!==generation)return;
  const next=Math.min(duration,time+(previous===null?0:Math.min(100,now-previous)/1000));previous=now;
  try{await frame(next);}catch(error){pause();console.error(error);return;}
  if(!playing||token!==generation)return;
  if(time>=duration){pause();return;}
  raf=requestAnimationFrame(n=>tick(n,token));
}
async function play(){
  if(!ready)return;
  pause();clearTimeout(tweenTimer);root.classList.remove('sequence-tween','sequence-manual');
  if(time>=duration)await frame(0);
  playing=true;previous=null;
  playButton.setAttribute('aria-pressed','true');playButton.setAttribute('aria-label','Pause workflow');playButton.title='Pause workflow';
  const token=generation;raf=requestAnimationFrame(n=>tick(n,token));
}
async function jump(index,{manual=false,view='anatomy'}={}){
  pause();clearTimeout(tweenTimer);lastView=view;
  root.classList.add('sequence-tween');root.classList.toggle('sequence-manual',manual);
  // Selecting a step reveals its ready state; automatic playback starts at its fade.
  await frame(steps[index][1]+(index===2?2.8:1));
  if(manual)api.resume();
  tweenTimer=setTimeout(()=>root.classList.remove('sequence-tween'),750);
}
playButton.addEventListener('click',()=>playing?pause():play());
stepButtons.forEach((button,i)=>button.addEventListener('click',()=>jump(i)));
root.addEventListener('click',event=>{
  const option=event.target.closest('.case-view-options button');
  if(!option)return;
  event.preventDefault();event.stopImmediatePropagation();
  const menu=option.closest('details');menu.open=false;menu.querySelector('summary').focus({preventScroll:true});
  jump(option.id==='tace-select'?4:3,{manual:true,view:option.dataset.caseView||'anatomy'});
},true);
root.addEventListener('pointerdown',event=>{if(event.target.closest('.case-mask-controls,.case-fields,.case-controls,.tace-transport,.tace-steps,.case-viewer')){pause();api.resume();}},true);
root.addEventListener('keydown',event=>{if(event.target.closest('input,select,[data-case-mode]')){pause();api.resume();}},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
document.querySelectorAll('[data-panel]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.panel!=='trajectories')pause();}));
new IntersectionObserver(entries=>{if(!film&&!entries.some(e=>e.isIntersecting))pause();}).observe(root);
compact.addEventListener('change',()=>paint(time));
reduced.addEventListener('change',()=>paint(time));

// Establish all opacity values before enabling the layered layout.
paint(0);root.classList.add('sequence-enabled');
await tace.prepare().catch(()=>{});
const params=new URLSearchParams(location.search);
await frame(film?0:params.has('walkthrough')?.9:params.get('example')==='tace'?23:.9);
ready=true;
window.__CLINICAL_SEQUENCE__={ready:true,duration,steps,frame,play,pause,jump,get time(){return time;},get playing(){return playing;}};
