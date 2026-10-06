import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const boundsOf = data => {
  const box = new THREE.Box3();
  for (let i=0;i<data.positions.length;i+=3) box.expandByPoint(new THREE.Vector3(...data.positions.slice(i,i+3)));
  return {center:box.getCenter(new THREE.Vector3()),size:box.getSize(new THREE.Vector3())};
};
function surface(data, origin, scale) {
  const p=new Float32Array(data.positions.length);
  for(let i=0;i<p.length;i+=3){p[i]=(data.positions[i]-origin.x)*scale;p[i+1]=(data.positions[i+2]-origin.z)*scale;p[i+2]=-(data.positions[i+1]-origin.y)*scale;}
  // The stored marching-cubes faces have inward winding (negative signed
  // volume). Reverse once so lit front faces point out of the closed surface.
  const indices=data.indices.slice();
  for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function edgeMaterial(color, alpha) {
  return new THREE.ShaderMaterial({
    uniforms:{tint:{value:new THREE.Color(color)},alpha:{value:alpha}},transparent:true,depthWrite:false,side:THREE.FrontSide,
    vertexShader:'varying vec3 eyeNormal; varying vec3 eyePosition; void main(){vec4 p=modelViewMatrix*vec4(position,1.0);eyeNormal=normalize(normalMatrix*normal);eyePosition=-p.xyz;gl_Position=projectionMatrix*p;}',
    fragmentShader:'uniform vec3 tint; uniform float alpha; varying vec3 eyeNormal; varying vec3 eyePosition; void main(){float edge=pow(1.0-abs(dot(normalize(eyeNormal),normalize(eyePosition))),2.6);gl_FragColor=vec4(tint,alpha*(0.025+0.975*edge));}'
  });
}
function enableDetail(object) {object.traverse(o=>o.layers.enable(1));}

/** Display geometry is reconstructed from the reference segmentation.
 * Rule states change only the lesion representation, never the baseline CT.
 * The interior core is an illustrative encoding, not a necrosis segmentation.
 */
export class LiverCaseView {
  constructor(container, anatomy, metadata) {
    this.container=container;this.metadata=metadata;
    const liverBounds=boundsOf(anatomy.liver),lesionBounds=boundsOf(anatomy.lesion);
    this.origin=liverBounds.center;this.scale=4.5/Math.max(...liverBounds.size.toArray());
    this.lesionCenter=new THREE.Vector3((lesionBounds.center.x-this.origin.x)*this.scale,(lesionBounds.center.z-this.origin.z)*this.scale,-(lesionBounds.center.y-this.origin.y)*this.scale);
    this.lesionRadius=Math.max(...lesionBounds.size.toArray())*this.scale*.52;
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(34,1,.05,80);
    this.renderer=new THREE.WebGLRenderer({alpha:false,antialias:true,preserveDrawingBuffer:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.setClearColor(0xffffff,1);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
    this.renderer.domElement.setAttribute('role','img');this.renderer.domElement.setAttribute('aria-label','Segmented liver and lesion in 3D, with a magnified lesion view.');
    container.prepend(this.renderer.domElement);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.dampingFactor=.08;this.controls.enablePan=false;this.controls.minDistance=2.8;this.controls.maxDistance=14;this.controls.autoRotate=false;
    const ambient=new THREE.HemisphereLight(0xeef6ff,0x55646b,2);ambient.layers.enable(1);this.scene.add(ambient);
    const key=new THREE.DirectionalLight(0xffffff,3.3);key.position.set(-4,7,6);key.layers.enable(1);this.scene.add(key);
    const side=new THREE.DirectionalLight(0xb8e0e2,1.8);side.position.set(5,1,-4);side.layers.enable(1);this.scene.add(side);
    const g=surface(anatomy.liver,this.origin,this.scale);
    this.liver=new THREE.Mesh(g,new THREE.MeshPhysicalMaterial({color:0x709cad,transparent:true,opacity:.12,metalness:.03,roughness:.46,side:THREE.FrontSide,depthWrite:false,clearcoat:.35}));
    this.liver.renderOrder=3;this.scene.add(this.liver);
    this.liverEdge=new THREE.Mesh(g,edgeMaterial(0x416f84,.30));this.liverEdge.renderOrder=4;this.scene.add(this.liverEdge);
    const lesionGeometry=surface(anatomy.lesion,lesionBounds.center,this.scale);
    this.lesionGroup=new THREE.Group();this.lesionGroup.position.copy(this.lesionCenter);this.scene.add(this.lesionGroup);
    this.outer=new THREE.Mesh(lesionGeometry,new THREE.MeshPhysicalMaterial({color:0xd77055,roughness:.48,metalness:0,clearcoat:.24,transparent:true,opacity:.7,depthWrite:false,side:THREE.FrontSide}));
    this.outer.renderOrder=2;
    this.core=new THREE.Mesh(lesionGeometry,new THREE.MeshStandardMaterial({color:0x507c89,roughness:.6,metalness:.02}));
    this.core.renderOrder=0;this.lesionGroup.add(this.core,this.outer);enableDetail(this.lesionGroup);
    this.baseline=new THREE.Mesh(lesionGeometry,edgeMaterial(0x486b7c,.25));this.baseline.position.copy(this.lesionCenter);this.baseline.renderOrder=5;enableDetail(this.baseline);this.scene.add(this.baseline);
    this.envelope=new THREE.Mesh(lesionGeometry,edgeMaterial(0x1d8a94,.48));this.envelope.position.copy(this.lesionCenter);this.envelope.renderOrder=6;enableDetail(this.envelope);this.scene.add(this.envelope);
    this.sliceCanvas=document.createElement('canvas');this.sliceCanvas.width=this.sliceCanvas.height=448;
    this.sliceTexture=new THREE.CanvasTexture(this.sliceCanvas);this.sliceTexture.colorSpace=THREE.SRGBColorSpace;
    const [nx,ny]=metadata.shape,[dx,dy]=metadata.spacing_mm;
    this.section=new THREE.Mesh(new THREE.PlaneGeometry((nx-1)*dx*this.scale,(ny-1)*dy*this.scale),new THREE.MeshBasicMaterial({map:this.sliceTexture,transparent:true,side:THREE.DoubleSide,depthWrite:false,alphaTest:.03}));
    this.section.rotation.x=-Math.PI/2;this.section.position.x=((nx-1)*dx/2-this.origin.x)*this.scale;this.section.position.z=-((ny-1)*dy/2-this.origin.y)*this.scale;
    this.section.renderOrder=1;this.scene.add(this.section);
    this.detailCamera=new THREE.PerspectiveCamera(32,1,.02,30);this.detailCamera.layers.set(1);
    this.detailCamera.position.copy(this.lesionCenter).add(new THREE.Vector3(.65,.65,3.65));this.detailCamera.lookAt(this.lesionCenter);
    this.view='anatomy';this.mode='tissue';this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.setView('anatomy');this.resize();
  }
  setView(view) {
    this.view=view;
    const target=view==='lesion'?this.lesionCenter:new THREE.Vector3(-.1,.03,0);
    const offset=view==='lesion'?new THREE.Vector3(-.7,.7,3.5):view==='section'?new THREE.Vector3(-2.1,5.1,5.4):new THREE.Vector3(-2.0,3.55,5.9);
    this.controls.target.copy(target);this.camera.position.copy(target).add(offset);this.camera.lookAt(target);this.controls.update();
    this.container.dataset.view=view;
    this.section.visible=view==='section';this.liver.visible=view!=='lesion';this.liverEdge.visible=view!=='lesion';
  }
  setSlice(images, index) {
    // np.rot90 in the source export maps horizontal image position to the
    // first NIfTI axis and vertical position to the reversed second axis.
    const ctx=this.sliceCanvas.getContext('2d');ctx.clearRect(0,0,448,448);ctx.drawImage(images.ct,0,0);
    const mask=document.createElement('canvas');mask.width=mask.height=448;
    const mc=mask.getContext('2d');mc.drawImage(images.organ,0,0);const pixels=mc.getImageData(0,0,448,448);
    for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]?255:0;
    mc.putImageData(pixels,0,0);ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0);ctx.globalCompositeOperation='source-over';
    this.sliceTexture.needsUpdate=true;this.section.position.y=(index*this.metadata.spacing_mm[2]-this.origin.z)*this.scale;
  }
  update(state,mode='tissue',baseline=true) {
    this.mode=mode;this.lesionGroup.scale.setScalar(Math.cbrt(state.volume));
    this.core.scale.setScalar(Math.cbrt(Math.max(.00001,state.necrosis))*.94);this.core.visible=mode==='tissue'&&state.necrosis>.005;
    this.outer.material.opacity=mode==='tissue'?.60:mode==='uncertainty'?.8:.97;
    this.outer.material.color.set(mode==='tissue'?0xe37552:0xd8775f);
    this.baseline.visible=baseline;this.envelope.visible=mode==='uncertainty';this.envelope.scale.setScalar(Math.cbrt(state.volume)*(1+state.uncertainty));
  }
  orbit(angle) {
    const radius=this.view==='lesion'?3.8:7.15, target=this.controls.target;
    this.camera.position.set(target.x+Math.sin(angle)*radius,target.y+(this.view==='section'?4.7:this.view==='lesion'?.7:3.55),target.z+Math.cos(angle)*radius);this.camera.lookAt(target);
  }
  resize() {
    this.width=Math.max(1,this.container.clientWidth);this.height=Math.max(1,this.container.clientHeight);
    this.renderer.setSize(this.width,this.height,false);this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();this.render();
  }
  render() {
    this.controls.update();const r=this.renderer;r.setScissorTest(false);r.setViewport(0,0,this.width,this.height);r.clear();r.render(this.scene,this.camera);
    if(this.view!=='lesion') {
      const size=Math.min(170,Math.round(this.width*.28));r.setScissorTest(true);r.setScissor(this.width-size-8,10,size,size);r.setViewport(this.width-size-8,10,size,size);r.clear();r.render(this.scene,this.detailCamera);r.setScissorTest(false);
    }
  }
  dispose() {this.resizeObserver.disconnect();this.controls.dispose();this.scene.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});this.sliceTexture.dispose();this.renderer.dispose();}
}
