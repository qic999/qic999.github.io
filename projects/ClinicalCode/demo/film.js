import {AnatomyView, loadAnatomy} from '../assets/js/anatomy-view.js';
import {stateAt} from '../assets/js/tumor-view.js';
const $=id=>document.getElementById(id), DURATION=48;
const captured=new URLSearchParams(location.search).has('render');
if(captured)document.body.classList.add('capture');
function fit(){const scale=innerWidth/1920;$('film-stage').style.transform=`scale(${scale})`;$('film-viewport').style.height=1080*scale+'px';}
addEventListener('resize',fit);fit();
const [mesh, data]=await Promise.all([loadAnatomy(),fetch('../assets/data/trajectories.json').then(r=>r.json())]);
const paths=['ct','organ','lesion'];
const scans=await Promise.all(paths.map(type=>Promise.all(Array.from({length:46},async(_,i)=>{const image=new Image();image.src=`../assets/ct/${type}_${String(i).padStart(3,'0')}.png`;await image.decode();return image;}))));
const solidMasks=scans.slice(1).map((images,k)=>images.map(image=>{const c=document.createElement('canvas');c.width=c.height=448;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,448,448),color=k?[237,137,113]:[36,176,157];for(let p=0;p<pixels.data.length;p+=4){if(pixels.data[p+3]){pixels.data[p]=color[0];pixels.data[p+1]=color[1];pixels.data[p+2]=color[2];pixels.data[p+3]=255;}}ctx.putImageData(pixels,0,0);return c;}));
const canvases=['ct','parsed','liver','lesion'].map(k=>$(k+'-canvas').getContext('2d'));
const views={anatomy:new AnatomyView($('anatomy'),mesh),evolution:new AnatomyView($('evolution'),mesh,true)};
const regimen=data.regimens.public_regimen_1;
let time=0,playing=false,start=0;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const t=clamp(x);return t*t*(3-2*t)};
const chapters=[
 ['01 / OBSERVE','A real CT volume anchors the clinical state in image evidence.'],
 ['02 / PARSE','Anatomy and lesions become separate, spatially grounded objects.'],
 ['03 / COMPILE','Measurements, units, time, and sources travel together as code.'],
 ['04 / SIMULATE','Explicit state fields evolve through an inspectable rollout.'],
 ['CLINICALCODE','Clinical observations → structured code → explicit state evolution.']
];
function render(t){
 time=Math.max(0,Math.min(47.999,t));
 const chapter=time<8?0:time<16?1:time<25?2:time<44?3:4;
 const active=Math.min(chapter,3);
 ['ct','parsing','code','simulation'].forEach((k,i)=>$('part-'+k).classList.toggle('is-active',i===active&&chapter<4));
 const slice=time<8?Math.round(32+8*Math.sin(time/8*Math.PI*2)):32;
 const alpha=.18+.82*ease((time-8)/3);
 canvases.forEach(c=>{c.clearRect(0,0,448,448);c.globalAlpha=1;});
 canvases[0].drawImage(scans[0][slice],0,0);
 canvases[1].drawImage(scans[0][slice],0,0);
 canvases[1].globalAlpha=alpha;canvases[1].drawImage(scans[1][slice],0,0);canvases[1].drawImage(scans[2][slice],0,0);canvases[1].globalAlpha=1;
 canvases[2].drawImage(solidMasks[0][slice],0,0);canvases[3].drawImage(solidMasks[1][slice],0,0);
 $('slice-index').textContent=String(slice+1).padStart(2,'0')+' / 46';$('slice-progress').style.width=((slice+1)/46*100)+'%';
 const day=ease((time-25)/18)*90, end=stateAt(regimen,day), midDay=Math.min(day,45);
 views.anatomy.update(time);views.evolution.update(time,[stateAt(regimen,0),stateAt(regimen,midDay),end]);
 $('mid-day').textContent=Math.round(midDay);$('end-day').textContent=Math.round(day);$('simulation-day').textContent='Day '+Math.round(day);$('volume-ratio').textContent=end.volume.toFixed(2);$('viability').textContent=end.viability.toFixed(2);$('code-day').textContent=Math.round(day);
 document.querySelectorAll('.code-group').forEach((g,i)=>{g.style.opacity=.52+.48*ease((time-16-i*1.25)/.7);g.classList.toggle('is-highlight',(chapter===2&&Math.floor((time-16)/1.5)===i)||(chapter===3&&i===3));});
 $('code-status').textContent=time<16?'typed state':time<25?'compiling fields':'traceable state';
 document.querySelectorAll('.connector').forEach((el,i)=>{const a=clamp((time-(8+i*8))/2);el.style.opacity=.35+.65*a;const dot=el.querySelector('i');dot.style.opacity=chapter===i+1?.8:0;dot.style.transform=`translateX(${((time*1.5)%1)*33}px)`;});
 $('chapter-label').textContent=chapters[chapter][0];$('narration').textContent=chapters[chapter][1];
 $('film-progress').style.width=time/DURATION*100+'%';$('film-time').textContent='00:'+String(Math.floor(time)).padStart(2,'0')+' / 00:48';$('film-scrub').value=time;
}
function tick(now){if(!playing)return;const t=(now-start)/1000;if(t>=DURATION){playing=false;render(47.99);$('film-play').textContent='Replay';return;}render(t);requestAnimationFrame(tick);}
$('film-play').addEventListener('click',()=>{if(playing){playing=false;$('film-play').textContent='Play animation';return;}if(time>=47.9)time=0;playing=true;start=performance.now()-time*1000;$('film-play').textContent='Pause';requestAnimationFrame(tick);});
$('film-scrub').addEventListener('input',e=>{playing=false;$('film-play').textContent='Play animation';render(Number(e.target.value));});
await document.fonts.ready;render(captured?0:47.99);
window.__FILM__={ready:true,duration:DURATION,render};
