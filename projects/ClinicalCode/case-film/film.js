import '../assets/js/liver-case.js?v=3';
const api=window.__CLINICALCASE__,$=id=>document.getElementById(id),duration=20;
const capture=new URLSearchParams(location.search).has('render');if(capture)document.body.classList.add('capture');
function fit(){const scale=innerWidth/1920;$('case-film-stage').style.transform=`scale(${scale})`;$('case-film-viewport').style.height=`${1080*scale}px`;}
fit();addEventListener('resize',fit);
const ease=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
let time=0,playing=false,last=null,busy=false;
async function frame(t) {
  time=Math.max(0,Math.min(19.999,t));let state;
  if(time<5){state={day:0,mode:'geometry',view:'section',slice:Math.round(24+12*ease(time/5)),angle:-.65+time*.07};$('film-caption').textContent='Real CT and reference masks anchor the clinical state in anatomy.';}
  else if(time<13){state={day:90*ease((time-5)/8),mode:'tissue',view:'anatomy',slice:32,angle:-.45+(time-5)*.07};$('film-caption').textContent='An illustrative rollout changes lesion volume and tissue state; code and geometry stay synchronized.';}
  else if(time<17){state={day:90,mode:'tissue',view:'lesion',slice:32,angle:-.5+(time-13)*.18};$('film-caption').textContent='Inspect the lesion in detail. The interior core visualizes an illustrative necrotic fraction.';}
  else{state={day:90,mode:'uncertainty',view:'anatomy',slice:32,angle:.2-(time-17)*.09};$('film-caption').textContent='Keep the baseline boundary and uncertainty visible alongside the simulated state.';}
  await api.frame(state);$('case-film-time').value=time;$('case-film-clock').textContent=`00:${String(Math.floor(time)).padStart(2,'0')} / 00:20`;$('case-film-progress').style.width=`${time/duration*100}%`;
}
async function tick(now){if(!playing)return;if(last!==null)time=Math.min(duration,time+(now-last)/1000);last=now;busy=true;await frame(time);busy=false;if(time>=19.99){playing=false;$('case-film-play').textContent='Replay';return;}requestAnimationFrame(tick);}
$('case-film-play').addEventListener('click',()=>{if(playing){playing=false;$('case-film-play').textContent='Play film';return;}if(time>=19.99)time=0;playing=true;last=null;$('case-film-play').textContent='Pause';requestAnimationFrame(tick);});
$('case-film-time').addEventListener('input',e=>{playing=false;$('case-film-play').textContent='Play film';if(!busy)frame(Number(e.target.value));});
await document.fonts.ready;await frame(capture?0:10);
window.__CASE_FILM__={ready:true,duration,frame};
