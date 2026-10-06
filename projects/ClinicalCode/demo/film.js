import {TumorView} from '../assets/js/tumor-view.js';
const $=id=>document.getElementById(id),DURATION=48;
const captured=new URLSearchParams(location.search).has('render');
if(captured)document.body.classList.add('capture');
function fit(){const scale=innerWidth/1440;$('film-stage').style.transform=`scale(${scale})`;$('film-viewport').style.height=810*scale+'px';}
addEventListener('resize',fit);fit();
const response=await fetch('../assets/data/trajectories.json');
if(!response.ok)throw new Error('Cannot load illustrative states');
const data=(await response.json()).regimens;
const views={A:new TumorView($('film-viewA')),B:new TumorView($('film-viewB'))};
for(const view of Object.values(views)){view.controls.autoRotate=false;view.controls.enableDamping=false;view.controls.enabled=false;view.renderer.setPixelRatio(1);}
const bounds=[0,6,14,22,34,42,48], scenes=[...document.querySelectorAll('.scene')];
let time=0,playing=false,start=0;
const clamp=x=>Math.max(0,Math.min(1,x));
function render(t){
  time=Math.min(47.999,Math.max(0,t));let index=0;for(let i=0;i<bounds.length-1;i++)if(time>=bounds[i])index=i;
  const local=time-bounds[index],remaining=bounds[index+1]-time;
  const fade=index===0?clamp(remaining/.35):Math.min(clamp(local/.4),clamp(remaining/.35));
  scenes.forEach((scene,i)=>{scene.style.opacity=i===index?fade:0;scene.style.transform=i===index?`translateY(${(1-clamp(local/.5))*8}px)`:'none';});
  $('scene-counter').textContent=String(index+1).padStart(2,'0')+' / 06';
  $('film-progress').style.width=(time/DURATION*100)+'%';$('film-time').textContent='00:'+String(Math.floor(time)).padStart(2,'0')+' / 00:48';$('film-scrub').value=time;
  $('film-note').textContent=index===3?'Rule-driven example · not a learned patient forecast':'Research framework · illustrative walkthrough';
  if(index===1){document.querySelectorAll('.compile-flow>.film-card').forEach((el,i)=>{el.style.opacity=.25+.75*clamp((local-i*.85)/.7);});}
  if(index===2){document.querySelectorAll('.field-explanations>div').forEach((el,i)=>{el.style.opacity=.2+.8*clamp((local-i*1.1)/.6);});}
  if(index===3){const day=clamp((local-.6)/10.5)*90;for(const [side,id] of [['A','public_regimen_1'],['B','public_regimen_3']]){const s=views[side].update(data[id],day,'viability');views[side].camera.position.set(Math.sin(local*.12)*.6,.18,6.25);views[side].camera.lookAt(0,0,0);views[side].render();$('film-stats'+side).innerHTML=[['Volume ratio',s.volume],['Viability proxy',s.viability],['Uncertainty proxy',s.uncertainty]].map(([k,v])=>`<div><span>${k}</span><b>${v.toFixed(2)}</b></div>`).join('');}$('rollout-progress').style.width=day/90*100+'%';$('rollout-day').textContent='Day '+Math.round(day);}
  if(index===4)document.querySelectorAll('.check-line').forEach((el,i)=>{el.style.opacity=.15+.85*clamp((local-i*1.15)/.6);});
}
function tick(now){if(!playing)return;const t=(now-start)/1000;if(t>=DURATION){playing=false;render(47.5);$('film-play').textContent='Replay';return;}render(t);requestAnimationFrame(tick);}
$('film-play').addEventListener('click',()=>{if(playing){playing=false;$('film-play').textContent='Play animation';return;}if(time>=47.5)time=0;playing=true;start=performance.now()-time*1000;$('film-play').textContent='Pause';requestAnimationFrame(tick);});
$('film-scrub').addEventListener('input',e=>{playing=false;$('film-play').textContent='Play animation';render(Number(e.target.value));});
await document.fonts.ready;
render(0);
window.__FILM__={ready:true,duration:DURATION,render};
