import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export class AssetViewer {
  constructor(host, {capture=false}={}) {
    this.host=host;
    this.cache=new Map();
    this.sequence=0;
    this.parts=[];
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(32,1,.0001,100);
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:capture,powerPreference:'low-power'});
    this.renderer.setPixelRatio(capture?1:Math.min(devicePixelRatio,1.7));
    this.renderer.setClearColor(0xffffff,0);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.15;
    host.append(this.renderer.domElement);
    this.renderer.domElement.tabIndex=0;
    this.renderer.domElement.setAttribute('aria-label','3D anatomy: drag to rotate, scroll to zoom, arrow keys to pan. Use the structure list to show, hide or isolate anatomy.');
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=false;
    this.controls.listenToKeyEvents(this.renderer.domElement);
    this.controls.addEventListener('change',()=>this.render());
    this.scene.add(new THREE.HemisphereLight(0xe6f2ff,0x778895,2.5));
    for(const [color,intensity,position] of [[0xffffff,3,[2,3,-4]],[0xbce3ff,2,[-3,1,2]],[0xe9ffd1,1,[1,-1,3]]]) {
      const light=new THREE.DirectionalLight(color,intensity);
      light.position.set(...position);
      this.scene.add(light);
    }
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(host);
    this.resize();
  }
  resize() {
    const {clientWidth:w,clientHeight:h}=this.host;
    if(!w||!h)return;
    this.renderer.setSize(w,h,false);
    this.camera.aspect=w/h;
    this.camera.updateProjectionMatrix();
    if(this.object)this.frame();
  }
  async load(asset) {
    const ticket=++this.sequence;
    this.ready=false;
    this.clear();
    if(!this.cache.has(asset.model)) {
      const pending=new GLTFLoader().loadAsync(asset.model).then(g=>g.scene).catch(e=>{this.cache.delete(asset.model);throw e;});
      this.cache.set(asset.model,pending);
    }
    const source=await this.cache.get(asset.model);
    if(ticket!==this.sequence)return false;
    this.object=source.clone(true);
    this.scene.add(this.object);
    this.object.updateMatrixWorld(true);
    this.asset=asset;
    this.parts=asset.parts.map(part=>{
      const node=this.object.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(part.node));
      if(!node)throw new Error(`Source structure missing: ${part.name}`);
      return {...part,node,origin:node.position.clone(),center:new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3())};
    });
    const box=this.bounds();
    const center=box.getCenter(new THREE.Vector3());
    const size=box.getSize(new THREE.Vector3()).length();
    for(const part of this.parts) {
      const direction=part.center.clone().sub(center);
      if(direction.lengthSq()<1e-12)direction.set(0,1,0);
      const worldOffset=direction.normalize().multiplyScalar(size*.38);
      const inverse=new THREE.Matrix4().copy(part.node.parent.matrixWorld).invert();
      part.offset=worldOffset.clone().applyMatrix4(inverse).sub(new THREE.Vector3().applyMatrix4(inverse));
    }
    this.camera.up.set(...asset.up);
    this.frame();
    await this.renderer.compileAsync(this.scene,this.camera);
    if(ticket!==this.sequence)return false;
    this.render();
    this.ready=true;
    // Keep two source assemblies resident; geometry and texture buffers are shared by clones.
    const current=this.cache.get(asset.model);
    this.cache.delete(asset.model);this.cache.set(asset.model,current);
    while(this.cache.size>2) {
      const [url,pending]=this.cache.entries().next().value;
      this.cache.delete(url);
      pending.then(scene=>this.disposeSource(scene)).catch(()=>{});
    }
    return true;
  }
  disposeSource(scene) {
    const geometries=new Set(),materials=new Set(),textures=new Set();
    scene.traverse(node=>{
      if(node.geometry)geometries.add(node.geometry);
      for(const material of (Array.isArray(node.material)?node.material:[node.material])) {
        if(!material)continue;
        materials.add(material);
        for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
      }
    });
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>{t.dispose();t.source?.data?.close?.();});
  }
  bounds() {
    this.object?.updateMatrixWorld(true);
    const box=new THREE.Box3();
    for(const part of this.parts)if(part.node.visible)box.union(new THREE.Box3().setFromObject(part.node));
    return box;
  }
  frame(explicitBounds=null) {
    if(!this.object)return;
    const box=explicitBounds?new THREE.Box3(new THREE.Vector3(...explicitBounds[0]),new THREE.Vector3(...explicitBounds[1])):this.bounds();
    if(box.isEmpty())return;
    const center=box.getCenter(new THREE.Vector3());
    const direction=new THREE.Vector3(...this.asset.direction).normalize();
    this.camera.position.copy(center).add(direction);
    this.camera.lookAt(center);
    this.camera.updateMatrixWorld(true);
    const basis=new THREE.Matrix4().extractRotation(this.camera.matrixWorld).invert();
    const tanY=Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2));
    const tanX=tanY*this.camera.aspect;
    let distance=0;
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]) {
      const v=new THREE.Vector3(x,y,z).sub(center).applyMatrix4(basis);
      distance=Math.max(distance,v.z+Math.abs(v.x)/tanX,v.z+Math.abs(v.y)/tanY);
    }
    distance*=1.08;
    const radius=box.getBoundingSphere(new THREE.Sphere()).radius;
    this.camera.position.copy(center).addScaledVector(direction,distance);
    this.camera.near=Math.max(.00001,radius/100);
    this.camera.far=Math.max(10,distance*30);
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(center);
    this.controls.minDistance=radius*.25;
    this.controls.maxDistance=distance*5;
    this.controls.update();
    this.render();
  }
  show(ids=null) {
    const visible=ids?new Set(ids):null;
    for(const part of this.parts)part.node.visible=!visible||visible.has(part.id);
    this.frame();this.render();
  }
  toggle(id,visible) {
    const part=this.parts.find(p=>p.id===id);
    if(part)part.node.visible=visible;
    this.render();
  }
  separate(amount) {
    for(const part of this.parts)part.node.position.copy(part.origin).addScaledVector(part.offset,amount);
    this.frame();
  }
  clear() {
    if(this.object)this.scene.remove(this.object);
    this.object=null;this.parts=[];
    this.render();
  }
  cancel() { ++this.sequence;this.clear();this.ready=false; }
  render() { if(this.host.clientWidth&&this.host.clientHeight)this.renderer.render(this.scene,this.camera); }
  thumbnail() { this.render();return this.renderer.domElement.toDataURL('image/webp',.94); }
}
