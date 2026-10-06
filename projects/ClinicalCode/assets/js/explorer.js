import { TumorView, stateAt } from './tumor-view.js';
const $=id=>document.getElementById(id);
const response=await fetch(new URL('../data/trajectories.json',import.meta.url));
if(!response.ok)throw new Error('Could not load demo states');
const DATA=(await response.json()).regimens;
for(const side of ['A','B']){
  for(const regimen of Object.values(DATA)){const option=document.createElement('option');option.value=regimen.id;option.textContent=regimen.label;$('select'+side).append(option);}
}
$('selectB').value='public_regimen_3';
const views={A:new TumorView($('viewerA')),B:new TumorView($('viewerB'))};
for(const view of Object.values(views)){view.controls.autoRotate=false;view.renderer.domElement.setAttribute('role','img');view.renderer.domElement.setAttribute('aria-label','Interactive schematic tumor state');}
document.querySelectorAll('.viewer-loading').forEach(e=>e.remove());
let day=0,mode='geometry',playing=false,last=null,visible=true;
function update(){
  for(const side of ['A','B']){const s=views[side].update(DATA[$('select'+side).value],day,mode);const fields=[['Volume ratio',s.volume,'geometry'],['Necrotic fraction',s.necrosis,''],['Viability proxy',s.viability,'viability'],['Uncertainty proxy',s.uncertainty,'uncertainty']];$('metrics'+side).innerHTML=fields.map(([name,value,field])=>`<div class="metric ${field===mode?'focus':''}"><span>${name}</span><b>${value.toFixed(2)}</b></div>`).join('');}
  $('time').value=day;$('day').textContent='Day '+day.toFixed(0);
  $('fieldLegend').textContent={geometry:'Explicit 3D boundary and shape',viability:'Blue → red · low → high viability proxy',uncertainty:'Nested shells · illustrative uncertainty proxy'}[mode];
}
function pause(){playing=false;last=null;$('play').textContent='Play';$('play').setAttribute('aria-label','Play trajectory');}
$('play').disabled=false;
$('play').addEventListener('click',()=>{if(playing){pause();return;}if(day>=90)day=0;playing=true;last=null;$('play').textContent='Pause';$('play').setAttribute('aria-label','Pause trajectory');});
$('time').addEventListener('input',e=>{pause();day=Number(e.target.value);update();});
for(const side of ['A','B'])$('select'+side).addEventListener('change',update);
document.querySelectorAll('.modebtn').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelectorAll('.modebtn').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});update();}));
$('reset-view').addEventListener('click',()=>{pause();day=0;for(const v of Object.values(views)){v.camera.position.set(.3,.18,6.25);v.controls.target.set(0,0,0);v.controls.update();}update();});
new IntersectionObserver(es=>{visible=es.some(e=>e.isIntersecting);last=null;}).observe($('panel-trajectories'));
document.addEventListener('visibilitychange',()=>{last=null;});
function render(timestamp){if(visible&&!document.hidden&&!$('panel-trajectories').hidden){if(playing){if(last!==null)day=Math.min(90,day+Math.min(timestamp-last,100)/1000*9);last=timestamp;update();if(day>=90)pause();}views.A.render();views.B.render();}else last=null;requestAnimationFrame(render);}
update();requestAnimationFrame(render);
window.__CLINICALCODE__={ready:true,stateAt,setDay(value){pause();day=Math.max(0,Math.min(90,value));update();},get day(){return day;},get mode(){return mode;}};
