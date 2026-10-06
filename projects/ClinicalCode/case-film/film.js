import '../assets/js/workflow-sequence.js?v=6';
const $=id=>document.getElementById(id), sequence=window.__CLINICAL_SEQUENCE__;
const capture=new URLSearchParams(location.search).has('render');
if(capture)document.body.classList.add('capture');
function resize(){const scale=innerWidth/1920;$('case-film-stage').style.transform=`scale(${scale})`;$('case-film-viewport').style.height=`${1080*scale}px`;}
addEventListener('resize',resize);resize();
$('film-title').textContent='From CT to TACE';
$('case-film-time').max=String(sequence.duration);
const captions=['Arterial CT','Organ · Lesion · Muscle · Fat','Structured clinical state','Tumor growth','Treatment simulation · TACE'];
function reflect(t){
 const index=Math.max(0,sequence.steps.findLastIndex(([,start])=>t>=start));
 const start=sequence.steps[index][1],end=sequence.steps[index][2];
 $('film-caption').textContent=captions[index];
 $('film-caption').style.opacity=String(Math.min(1,(t-start)/.6,index===4?1:(end-t)/.35));
 $('case-film-time').value=t;
 $('case-film-clock').textContent=`00:${String(Math.floor(t)).padStart(2,'0')} / 00:34`;
 $('case-film-progress').style.width=`${t/sequence.duration*100}%`;
 $('case-film-play').textContent=sequence.playing?'Pause':t>=sequence.duration?'Replay':'Play film';
}
async function frame(t){await sequence.frame(t);reflect(t);}
$('case-film-play').addEventListener('click',()=>{sequence.playing?sequence.pause():sequence.play();reflect(sequence.time);});
$('case-film-time').addEventListener('input',e=>{sequence.pause();frame(Number(e.target.value));});
$('liver-case').addEventListener('workflowframe',e=>reflect(e.detail.time));
await document.fonts.ready;await frame(capture?0:.9);
window.__CASE_FILM__={ready:true,duration:sequence.duration,frame};
