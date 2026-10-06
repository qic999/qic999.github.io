const root=new URL('../../',import.meta.url);
const byId=id=>document.getElementById(id);
const grid=byId('asset-grid'),inspector=byId('asset-inspector');
const viewerHost=byId('asset-viewer'),loading=byId('asset-loading'),retry=byId('asset-retry');
const partList=byId('asset-parts'),partSearch=byId('asset-part-search'),separation=byId('asset-separate');
let catalog,selected=null,viewer,loadingViewer,request=0,trigger=null;

function link(id,url) { const a=byId(id);a.hidden=!url;if(url)a.href=url; }
function updateParts() {
  if(!viewer?.ready)return;
  const query=partSearch.value.trim().toLocaleLowerCase();
  let matches=0;
  for(const row of partList.children) {
    const part=viewer.parts.find(p=>p.id===row.dataset.part);
    row.hidden=!part.name.toLocaleLowerCase().includes(query);
    if(!row.hidden)matches++;
    row.querySelector('input').checked=part.node.visible;
  }
  const visible=viewer.parts.filter(p=>p.node.visible).map(p=>p.id);
  const status=byId('asset-part-status');
  status.textContent=matches?`${visible.length} of ${viewer.parts.length} structures visible`:'No matching structures.';
  status.classList.toggle('sr-only',matches>0);
  for(const b of byId('asset-groups').children) {
    const ids=b.dataset.group==='all'?viewer.parts.map(p=>p.id):selected.groups[+b.dataset.group].parts;
    b.setAttribute('aria-pressed',String(ids.length===visible.length&&ids.every(id=>visible.includes(id))));
  }
}
function showGroup(ids) {
  separation.value='0';byId('asset-separation-value').value='0%';
  viewer.separate(0);viewer.show(ids);updateParts();
}
function mountParts() {
  const groupHost=byId('asset-groups');groupHost.replaceChildren();
  for(const [index,group] of [{name:'All anatomy',parts:null},...selected.groups].entries()) {
    const button=document.createElement('button');button.type='button';button.textContent=group.name;
    button.dataset.group=index===0?'all':String(index-1);button.setAttribute('aria-pressed',String(index===0));
    button.addEventListener('click',()=>showGroup(group.parts));groupHost.append(button);
  }
  partList.replaceChildren();
  for(const part of viewer.parts) {
    const row=document.createElement('div');row.className='asset-part';row.dataset.part=part.id;
    const label=document.createElement('label');
    const check=document.createElement('input');check.type='checkbox';check.checked=true;check.dataset.part=part.id;
    check.addEventListener('change',()=>{viewer.toggle(part.id,check.checked);updateParts();});
    const name=document.createElement('span');name.textContent=part.name;
    label.append(check,name);
    const isolate=document.createElement('button');isolate.type='button';isolate.textContent='Isolate';
    isolate.setAttribute('aria-label',`Isolate ${part.name}`);
    isolate.addEventListener('click',()=>showGroup([part.id]));
    row.append(label,isolate);partList.append(row);
  }
  updateParts();
}
async function openAsset(asset,{scroll=true}={}) {
  if(!asset)return;
  const ticket=++request;selected=asset;
  byId('asset-title').textContent=asset.name;
  const singlePart=asset.parts.length===1;
  inspector.querySelector('.asset-separation').hidden=singlePart;
  inspector.classList.toggle('is-single-part',singlePart);
  inspector.querySelector('.asset-structure-panel').hidden=singlePart;
  link('asset-download',asset.download);
  byId('asset-download').setAttribute('aria-label',`Download ${asset.name} model`);
  for(const card of grid.querySelectorAll('[data-asset]'))card.setAttribute('aria-expanded',String(card.dataset.asset===asset.id));
  byId('asset-groups').replaceChildren();partList.replaceChildren();
  byId('asset-part-status').textContent='';
  byId('asset-part-status').classList.add('sr-only');
  partSearch.value='';partSearch.disabled=true;separation.value='0';separation.disabled=true;byId('asset-separation-value').value='0%';
  byId('asset-reset').disabled=true;
  viewerHost.style.backgroundImage=`url("${new URL(asset.thumbnail+'?v=10',root)}")`;
  viewerHost.setAttribute('aria-busy','true');
  viewerHost.setAttribute('aria-label',`${asset.name}: interactive 3D anatomy`);
  loading.textContent='Loading model…';loading.hidden=false;retry.hidden=true;
  inspector.hidden=false;
  if(scroll){inspector.scrollIntoView({block:'start',behavior:'instant'});inspector.focus({preventScroll:true});}
  viewer?.cancel();
  try {
    loadingViewer ||= import('./asset-viewer.js?v=5').then(({AssetViewer})=>new AssetViewer(viewerHost)).catch(error=>{loadingViewer=null;throw error;});
    viewer=await loadingViewer;
    if(ticket!==request)return;
    viewer.resize();
    if(!await viewer.load(asset)||ticket!==request)return;
    viewerHost.style.backgroundImage='none';loading.hidden=true;
    partSearch.disabled=false;separation.disabled=singlePart;byId('asset-reset').disabled=false;
    mountParts();
  } catch(error) {
    if(ticket!==request)return;
    viewer?.cancel();
    loading.textContent='Model unavailable. Retry or use the download icon.';retry.hidden=false;
  } finally { if(ticket===request)viewerHost.setAttribute('aria-busy','false'); }
}
byId('asset-close').addEventListener('click',()=>{
  ++request;viewer?.cancel();inspector.hidden=true;
  for(const card of grid.querySelectorAll('[data-asset]'))card.setAttribute('aria-expanded','false');
  trigger?.focus();
});
byId('asset-reset').addEventListener('click',()=>{if(viewer?.ready){partSearch.value='';showGroup(null);}});
retry.addEventListener('click',()=>selected&&openAsset(selected,{scroll:false}));
partSearch.addEventListener('input',updateParts);
separation.addEventListener('input',()=>{
  if(!viewer?.ready)return;
  byId('asset-separation-value').value=separation.value+'%';viewer.separate(Number(separation.value)/100);
});

try {
  const response=await fetch(new URL('assets/data/somaatlas.json?v=10',root));
  if(!response.ok)throw new Error('Catalog unavailable');
  catalog=await response.json();
  grid.addEventListener('click',event=>{
    const card=event.target.closest('[data-asset]');
    if(!card||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const asset=catalog.assets.find(a=>a.id===card.dataset.asset);
    if(asset){event.preventDefault();trigger=card;void openAsset(asset);}
  });
  window.__ASSET_GALLERY__={catalog,open:async id=>{trigger=grid.querySelector(`[data-asset="${id}"]`);return openAsset(catalog.assets.find(a=>a.id===id));},get viewer(){return viewer;},get selected(){return selected;}};
} catch { byId('asset-catalog-error').hidden=false; }
