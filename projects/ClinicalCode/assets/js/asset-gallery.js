const root=new URL('../../',import.meta.url);
const section=document.getElementById('assets');
const grid=document.getElementById('asset-grid');
const filters=[...section.querySelectorAll('[data-asset-filter]')];
const search=document.getElementById('asset-search');
const more=document.getElementById('asset-more');
const status=document.getElementById('asset-count');
const empty=document.getElementById('asset-empty');
const dialog=document.getElementById('asset-dialog');
const viewerHost=document.getElementById('asset-viewer');
const loading=document.getElementById('asset-loading');
const retry=document.getElementById('asset-retry');
const byId=id=>document.getElementById(id);
let catalog,category='all',expanded=false,selected=null,viewer,loadingViewer,request=0;

function filter() {
  const query=search.value.trim().toLocaleLowerCase();
  const matches=catalog.assets.filter(a=>(category==='all'||a.category===category)&&`${a.name} ${a.categoryLabel} ${a.description}`.toLocaleLowerCase().includes(query));
  const visible=expanded?matches:matches.slice(0,18);
  const ids=new Set(visible.map(a=>a.id));
  for(const card of grid.children)card.hidden=!ids.has(card.dataset.asset);
  empty.hidden=matches.length>0;
  more.hidden=matches.length<=18;
  more.textContent=expanded?'Show fewer assets':`Show all ${matches.length} assets (${matches.length-visible.length} more)`;
  more.setAttribute('aria-expanded',String(expanded));
  status.textContent=`${visible.length} of ${matches.length} assets`;
  filters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.assetFilter===category)));
}
function link(id,url,text) {
  const anchor=byId(id);
  anchor.hidden=!url;
  if(url)anchor.href=url;
  if(text)anchor.textContent=text;
}
async function openAsset(asset) {
  const ticket=++request;
  selected=asset;
  byId('asset-title').textContent=asset.name;
  byId('asset-category').textContent=asset.categoryLabel;
  byId('asset-description').textContent=asset.description;
  byId('asset-appearance').textContent=asset.appearance;
  byId('asset-scope').textContent=asset.scope;
  byId('asset-attribution').textContent=asset.attribution;
  byId('asset-format').textContent=asset.format;
  byId('asset-topology').textContent=asset.triangles?`${asset.triangles.toLocaleString()} triangles`:'Source geometry & materials';
  link('asset-download',asset.download,asset.downloadLabel);
  link('asset-kit',asset.kit,'Download anatomy kit');
  link('asset-source-glb',asset.node?asset.source:null,asset.glbLabel);
  link('asset-source-page',asset.sourcePage,asset.sourceLabel||'Explore on SomaAtlas');
  link('asset-terms',asset.terms,'Source & license');
  link('asset-metadata',asset.metadata,'Source metadata');
  viewerHost.style.backgroundImage=`url("${new URL(asset.thumbnail,root)}")`;
  viewerHost.setAttribute('aria-busy','true');
  viewerHost.setAttribute('aria-label',`${asset.name}, ${asset.categoryLabel}: interactive 3D preview`);
  loading.textContent='Loading 3D model…';
  loading.hidden=false;
  retry.hidden=true;
  if(!dialog.open)dialog.showModal();
  if(viewer)viewer.cancel();
  try {
    loadingViewer ||= import('./asset-viewer.js').then(({AssetViewer})=>new AssetViewer(viewerHost)).catch(error=>{loadingViewer=null;throw error;});
    const instance=await loadingViewer;
    viewer=instance;
    if(ticket!==request)return;
    viewer.resize();
    const loaded=await viewer.load(asset);
    if(!loaded||ticket!==request)return;
    viewerHost.style.backgroundImage='none';
    loading.hidden=true;
  } catch(error) {
    if(ticket!==request)return;
    loading.textContent='The 3D model could not load. Retry, or open the source on SomaAtlas.';
    retry.hidden=false;
  } finally {
    if(ticket===request)viewerHost.setAttribute('aria-busy','false');
  }
}
dialog.addEventListener('close',()=>{++request;viewer?.cancel();});
byId('asset-close').addEventListener('click',()=>dialog.close());
byId('asset-reset').addEventListener('click',()=>viewer?.frame());
retry.addEventListener('click',()=>selected&&openAsset(selected));
byId('asset-export').addEventListener('click',()=>{
  if(!selected)return;
  const blob=new Blob([JSON.stringify({sourceLibrary:catalog.source,verified:catalog.verified,asset:selected},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),anchor=document.createElement('a');
  anchor.href=url;anchor.download=`somaatlas-${selected.id}.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});

try {
  const response=await fetch(new URL('assets/data/somaatlas.json',root));
  if(!response.ok)throw new Error('Catalog unavailable');
  catalog=await response.json();
  for(const button of filters)button.addEventListener('click',()=>{category=button.dataset.assetFilter;expanded=false;filter();});
  search.addEventListener('input',()=>{expanded=false;filter();});
  more.addEventListener('click',()=>{
    expanded=!expanded;
    if(!expanded)section.querySelector('.asset-toolbar').scrollIntoView({block:'start',behavior:'instant'});
    filter();
  });
  byId('asset-clear').addEventListener('click',()=>{search.value='';category='all';expanded=false;filter();search.focus();});
  grid.addEventListener('click',event=>{
    const card=event.target.closest('[data-asset]');
    if(!card||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const asset=catalog.assets.find(a=>a.id===card.dataset.asset);
    if(asset){event.preventDefault();void openAsset(asset);}
  });
  section.classList.add('asset-gallery-ready');
  filter();
  window.__ASSET_GALLERY__={catalog,open:id=>openAsset(catalog.assets.find(a=>a.id===id)),get viewer(){return viewer;},get selected(){return selected;}};
} catch {
  status.textContent='Interactive catalog unavailable. Browse the assets directly on SomaAtlas.';
  section.querySelector('.asset-filter-controls').hidden=true;
  more.hidden=true;
}
