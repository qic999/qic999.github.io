import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export class AssetViewer {
  constructor(host, {capture=false}={}) {
    this.host=host;
    this.cache=new Map();
    this.sequence=0;
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
    this.renderer.domElement.setAttribute('aria-label','3D asset: drag to rotate, scroll to zoom, use arrow keys to pan.');
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
    source.updateMatrixWorld(true);
    const selected=asset.node?source.getObjectByName(asset.node):source;
    if(!selected)throw new Error('The selected surface is absent from its source collection.');
    this.object=selected.clone(true);
    this.object.matrixAutoUpdate=false;
    this.object.matrix.copy(selected.matrixWorld);
    this.scene.add(this.object);
    this.asset=asset;
    this.camera.up.set(...asset.up);
    this.frame();
    await this.renderer.compileAsync(this.scene,this.camera);
    if(ticket!==this.sequence)return false;
    this.render();
    this.ready=true;
    return true;
  }
  frame() {
    if(!this.object)return;
    this.object.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(this.object);
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
    distance*=1.12;
    const radius=box.getBoundingSphere(new THREE.Sphere()).radius;
    this.camera.position.copy(center).addScaledVector(direction,distance);
    this.camera.near=Math.max(.00001,radius/100);
    this.camera.far=Math.max(10,distance*30);
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(center);
    this.controls.minDistance=radius*.45;
    this.controls.maxDistance=distance*5;
    this.controls.update();
    this.render();
  }
  clear() {
    if(this.object)this.scene.remove(this.object);
    this.object=null;
    this.render();
  }
  cancel() { ++this.sequence; this.clear(); this.ready=false; }
  render() { if(this.host.clientWidth&&this.host.clientHeight)this.renderer.render(this.scene,this.camera); }
  thumbnail() { this.render();return this.renderer.domElement.toDataURL('image/webp',.9); }
}
