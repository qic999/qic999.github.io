'use strict';
const $ = id => document.getElementById(id);
const results = {
  ct: [
    ['Qwen3-VL-4B',65.26,53.33],['Claude Opus 4.8',65.92,73.06],['Lingshu-7B',54.44,73.47],['MedGemma 1.5-4B',49.47,73.47],['MeWM',52.38,64.08],['V-JEPA 2',51.54,68.30],['Clin-JEPA',61.11,66.94],['ClinicalCode · single model',66.52,80.54,'ours'],['ClinicalCode · ensemble',71.88,84.69,'ours ensemble']
  ],
  mri: [['Qwen3-VL-4B',32.18,34.67],['Claude Sonnet 5',48.89,52.67],['MedGemma 1.5-4B',36.54,54.67],['V-JEPA 2',30.13,39.67],['Clin-JEPA',44.10,50.27],['ClinicalCode',58.12,55.33,'ours']]
};
function showResults(modality) {
  $('results-body').innerHTML = results[modality].map(([name,a,b,cls=''])=>`<tr class="${cls}"><th scope="row" class="c-model">${name}</th>${[a,b].map(v=>`<td>${v.toFixed(2)}</td>`).join('')}</tr>`).join('');
  $('result-caption').textContent = `${modality==='ct'?'CT treatment planning':'Glioma MRI treatment planning'}, F1 in percent`;
  document.querySelectorAll('.result-tab').forEach(b=>{b.classList.toggle('is-on',b.dataset.results===modality);b.setAttribute('aria-pressed',String(b.dataset.results===modality));});
}
showResults('ct');
document.querySelectorAll('.result-tab').forEach(b=>b.addEventListener('click',()=>showResults(b.dataset.results)));
$('demo-play').addEventListener('click',async()=>{
  $('demo-play').hidden=true;const video=$('demo-video');video.hidden=false;
  try { await video.play(); } catch { video.controls=true; }
  video.focus();
});
const tabs=[...document.querySelectorAll('[data-panel]')];
function setTab(tab) {
  tabs.forEach(b=>{const selected=b===tab;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;$(`panel-${b.dataset.panel}`).hidden=!selected;});
  if(tab.dataset.panel==='trajectories') window.dispatchEvent(new Event('resize'));
}
tabs.forEach((b,i)=>{b.addEventListener('click',()=>setTab(b));b.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();setTab(tabs[n]);tabs[n].focus();}});});
$('copy-citation').addEventListener('click',async()=>{
  const value=$('bibtex').textContent;
  try { await navigator.clipboard.writeText(value); }
  catch { const range=document.createRange();range.selectNodeContents($('bibtex'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);$('copy-status').textContent='Citation selected. Press Control+C or Command+C to copy.';return; }
  $('copy-citation').textContent='Copied';$('copy-status').textContent='BibTeX copied to clipboard.';setTimeout(()=>{$('copy-citation').textContent='Copy BibTeX'},1800);
});
let started=false;
new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!started){started=true;import('./workflow-sequence.js?v=6').catch(error=>{console.error(error);$('viewer-error').hidden=false;document.querySelectorAll('.viewer-loading').forEach(x=>x.textContent='3D view unavailable');});}},{rootMargin:'250px'}).observe($('explore'));
