import {loadAnatomy} from './anatomy-view.js';
import {stateAt} from './tumor-view.js';
import {LiverCaseView} from './liver-case-view.js';

const $=id=>document.getElementById(id);
// Earlier design studies still include the optional slice controls.
const sliceControl=$('case-slice'), sliceLabel=$('case-slice-label'), legend=$('case-legend');
const root=new URL('../',import.meta.url);
const tissueLayers=['fat','muscle','organ','lesion'];
const layerOpacity={fat:1,muscle:1,organ:1,lesion:1};
const json=async name=>{const r=await fetch(new URL('data/'+name,root));if(!r.ok)throw new Error('Could not load '+name);return r.json();};
const cache=new Map();
async function loadSlice(index) {
  if(!cache.has(index))cache.set(index,Promise.all(['ct',...tissueLayers].map(async type=>{const im=new Image();im.src=new URL(`ct/${type}_${String(index).padStart(3,'0')}.png`,root);await im.decode();return [type,im];})).then(Object.fromEntries).catch(error=>{cache.delete(index);throw error;}));
  return cache.get(index);
}
const [anatomy,metadata,trajectories,firstSlice]=await Promise.all([loadAnatomy(),json('ct-case.json?v=13'),json('trajectories.json'),loadSlice(32)]);
const regimens=trajectories.regimens;
for(const regimen of Object.values(regimens)){const option=document.createElement('option');option.value=regimen.id;option.textContent=regimen.label;$('case-action').append(option);}
const view=new LiverCaseView($('case-viewer'),anatomy,metadata);
document.querySelectorAll('#liver-case .viewer-loading').forEach(el=>el.remove());
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let day=45,mode='tissue',playing=false,visible=false,last=null,slice=32,images=firstSlice,sliceToken=0,capturing=false;
function write(id,value){if($(id).textContent!==value)$(id).textContent=value;}
function redrawSlice(syncAnatomy=true) {
  const input=$('case-ct').getContext('2d'),parsed=$('case-parsed').getContext('2d');
  input.clearRect(0,0,448,448);input.drawImage(images.ct,0,0);parsed.clearRect(0,0,448,448);parsed.drawImage(images.ct,0,0);
  for(const type of tissueLayers)if($(`case-${type}`).checked){parsed.globalAlpha=layerOpacity[type];parsed.drawImage(images[type],0,0);}
  parsed.globalAlpha=1;
  if(syncAnatomy){view.setSlice(images,slice);view.render();}if(sliceControl)sliceControl.value=slice;
  if(sliceLabel)write('case-slice-label',`${slice+1} / 46`);write('case-code-slice',String(slice));
}
async function setSlice(index) {const token=++sliceToken;const next=await loadSlice(index);if(token!==sliceToken)return;slice=index;images=next;redrawSlice();}
function update() {
  const regimen=regimens[$('case-action').value],state=stateAt(regimen,day),volume=metadata.lesion.volume_ml*state.volume;
  view.update(state,mode,$('case-baseline').checked);
  $('case-time').value=day;write('case-day',`Day ${Math.round(day)}`);write('case-code-day',String(Math.round(day)));
  write('case-code-volume',volume.toFixed(3));write('case-code-necrosis',state.necrosis.toFixed(3));write('case-code-viability',state.viability.toFixed(3));write('case-code-uncertainty',state.uncertainty.toFixed(3));
  write('case-code-action',regimen.id.replace('public_regimen_','action_'));
  write('case-volume',`${volume.toFixed(1)} mL`);write('case-necrosis',`${Math.round(state.necrosis*100)}%`);write('case-viability',state.viability.toFixed(2));
  write('case-state-label',`${Math.round(day)} day`);
  const key={tissue:'Tissue state',geometry:'Lesion geometry',uncertainty:'Uncertainty envelope'}[mode];
  if(legend)write('case-legend',mode==='tissue'?'Coral: lesion · blue-grey: necrotic core':mode==='geometry'?'Coral: lesion · outline: baseline':'Teal: uncertainty');
  $('case-viewer').setAttribute('aria-label',`${key}, day ${Math.round(day)}, lesion volume ${volume.toFixed(1)} mL, on reference liver anatomy.`);
  document.querySelectorAll('[data-live-field]').forEach(el=>el.classList.toggle('field-active',el.dataset.liveField===mode));
  view.render();return state;
}
function pause(){playing=false;last=null;write('case-play-label','Play trajectory');$('case-play').setAttribute('aria-pressed','false');}
function setMode(value){mode=value;document.querySelectorAll('[data-case-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.caseMode===value)));update();}
function setView(value){view.setView(value);document.querySelectorAll('[data-case-view]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.caseView===value)));view.render();}
function setDay(value){pause();day=Math.max(0,Math.min(90,Number(value)));return update();}
$('case-play').disabled=false;
$('case-play').addEventListener('click',()=>{if(playing){pause();return;}if(day>=90)day=0;playing=true;last=null;write('case-play-label','Pause');$('case-play').setAttribute('aria-pressed','true');});
$('case-time').addEventListener('input',e=>setDay(e.target.value));
sliceControl?.addEventListener('input',e=>setSlice(Number(e.target.value)).catch(()=>{if(sliceLabel)write('case-slice-label','Slice unavailable');}));
$('case-action').addEventListener('change',update);$('case-baseline').addEventListener('change',update);
for(const type of tissueLayers)$(`case-${type}`).addEventListener('change',redrawSlice);
document.querySelectorAll('[data-case-mode]').forEach(el=>el.addEventListener('click',()=>setMode(el.dataset.caseMode)));
document.querySelectorAll('[data-case-view]').forEach(el=>el.addEventListener('click',()=>setView(el.dataset.caseView)));
$('case-reset').addEventListener('click',()=>{setView('anatomy');setDay(0);});
new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);last=null;}).observe($('case-viewer'));
document.addEventListener('visibilitychange',()=>{last=null;});
function render(timestamp) {
  if(!capturing&&visible&&!document.hidden&&!$('panel-trajectories').hidden){
    if(playing){if(last!==null)day=Math.min(90,day+Math.min(timestamp-last,100)/1000*5);last=timestamp;update();if(day>=90)pause();}
    view.render();
  }else last=null;
  requestAnimationFrame(render);
}
redrawSlice();update();requestAnimationFrame(render);
window.__CLINICALCASE__={ready:true,regimens,metadata,view,stateAt,setDay,setMode,setView,setSlice,get day(){return day;},get mode(){return mode;},get slice(){return slice;},get playing(){return playing;},reducedMotion:reduced,
  setLayerOpacity(values){let changed=false;for(const type of tissueLayers){const v=values[type]??1;if(v!==layerOpacity[type]){layerOpacity[type]=v;changed=true;}}if(changed)redrawSlice(false);},
  async frame({day:nextDay=day,mode:nextMode=mode,view:nextView=view.view,slice:nextSlice=slice,angle=-.35}={}){capturing=true;pause();day=nextDay;if(nextSlice!==slice)await setSlice(nextSlice);if(mode!==nextMode){mode=nextMode;document.querySelectorAll('[data-case-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.caseMode===mode)));}if(view.view!==nextView)setView(nextView);document.querySelectorAll('[data-case-view]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.caseView===nextView)));view.orbit(angle);update();},
  resume(){capturing=false;}
};
