import * as THREE from 'three';

let meshPromise;
export function loadAnatomy() {
  meshPromise ??= fetch(new URL('../data/anatomy-mesh.json', import.meta.url)).then(r => {
    if (!r.ok) throw new Error('Cannot load reference anatomy');
    return r.json();
  });
  return meshPromise;
}

function geometry(data, origin, scale) {
  const values = data.positions;
  const positions = new Float32Array(values.length);
  for (let i = 0; i < values.length; i += 3) {
    positions[i] = (values[i] - origin.x) * scale;
    positions[i + 1] = (values[i + 2] - origin.z) * scale;
    positions[i + 2] = -(values[i + 1] - origin.y) * scale;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setIndex(data.indices); g.computeVertexNormals();
  return g;
}

function center(data) {
  const box = new THREE.Box3();
  for (let i = 0; i < data.positions.length; i += 3) box.expandByPoint(new THREE.Vector3(...data.positions.slice(i, i + 3)));
  return {center: box.getCenter(new THREE.Vector3()), size: box.getSize(new THREE.Vector3())};
}

export class AnatomyView {
  constructor(container, data, sequence = false) {
    this.container = container; this.sequence = sequence;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(sequence ? 31 : 35, 1, .05, 100);
    this.camera.position.set(0, sequence ? .18 : .6, sequence ? 3.0 : 5.7);
    this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true});
    this.renderer.setPixelRatio(1.5);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    container.append(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight(0xd9f7ff, 0x132b38, 2.3));
    const key = new THREE.DirectionalLight(0xffffff, 3.1); key.position.set(3, 5, 6); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x6ce0e0, 3); rim.position.set(-3, 1, -4); this.scene.add(rim);
    this.group = new THREE.Group(); this.scene.add(this.group);
    if (sequence) {
      const bounds = center(data.lesion);
      const g = geometry(data.lesion, bounds.center, 1.05 / Math.max(bounds.size.x, bounds.size.y, bounds.size.z));
      this.lesions = [-1.36, 0, 1.36].map(x => {
        const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: 0xe88c7c, roughness: .48, metalness: .04}));
        mesh.position.x = x; mesh.rotation.y = -.45; mesh.rotation.z = -.13;
        this.group.add(mesh); return mesh;
      });
    } else {
      const bounds = center(data.liver), scale = 3.8 / Math.max(bounds.size.x, bounds.size.y, bounds.size.z);
      const liver = geometry(data.liver, bounds.center, scale);
      this.group.add(new THREE.Mesh(liver, new THREE.MeshPhysicalMaterial({color: 0x8bc7d2, transparent: true, opacity: .19, roughness: .35, metalness: .05, side: THREE.DoubleSide, depthWrite: false})));
      this.group.add(new THREE.Mesh(liver, new THREE.MeshBasicMaterial({color: 0x94d9dd, wireframe: true, transparent: true, opacity: .012, depthWrite: false})));
      this.lesion = new THREE.Mesh(geometry(data.lesion, bounds.center, scale), new THREE.MeshStandardMaterial({color: 0xf18a76, roughness: .5, metalness: .02}));
      this.group.add(this.lesion);
      this.group.rotation.set(.6, -.6, -.13);
    }
    this.resize();
  }
  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  update(t, states) {
    if (this.sequence) {
      this.lesions.forEach((m, i) => {
        m.scale.setScalar(Math.cbrt(states?.[i]?.volume ?? 1));
        m.material.color.set(0xe88c7c).lerp(new THREE.Color(0x368c98), 1 - (states?.[i]?.viability ?? 1));
        m.rotation.y = -.5 + Math.sin(t * .13) * .24;
      });
    } else {
      this.group.rotation.y = -.5 + Math.sin(t * .09) * .36;
    }
    this.renderer.render(this.scene, this.camera);
  }
}
