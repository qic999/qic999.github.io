import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";


const KNOTS = [0, 30, 60, 90];
const $ = (id) => document.getElementById(id);

let currentDay = 0;
let mode = "viability";
let playing = false;
let previousTimestamp = null;

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

// Monotone cubic Hermite interpolation. It is C1-continuous and avoids the
// overshoot that ordinary cubic splines can introduce between clinical knots.
function monotoneSlopes(xs, ys) {
  const n = xs.length;
  const delta = Array(n - 1);
  const slopes = Array(n);
  for (let i = 0; i < n - 1; i += 1) {
    delta[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  }
  slopes[0] = delta[0];
  slopes[n - 1] = delta[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    if (delta[i - 1] * delta[i] <= 0) {
      slopes[i] = 0;
    } else {
      slopes[i] = (2 * delta[i - 1] * delta[i]) / (delta[i - 1] + delta[i]);
    }
  }
  for (let i = 0; i < n - 1; i += 1) {
    if (Math.abs(delta[i]) < 1e-12) {
      slopes[i] = 0;
      slopes[i + 1] = 0;
      continue;
    }
    const a = slopes[i] / delta[i];
    const b = slopes[i + 1] / delta[i];
    const magnitude = a * a + b * b;
    if (magnitude > 9) {
      const tau = 3 / Math.sqrt(magnitude);
      slopes[i] = tau * a * delta[i];
      slopes[i + 1] = tau * b * delta[i];
    }
  }
  return slopes;
}

function pchip(xs, ys, x) {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  const slopes = monotoneSlopes(xs, ys);
  let interval = 0;
  while (interval < xs.length - 2 && x > xs[interval + 1]) interval += 1;
  const h = xs[interval + 1] - xs[interval];
  const t = (x - xs[interval]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return (
    h00 * ys[interval] +
    h10 * h * slopes[interval] +
    h01 * ys[interval + 1] +
    h11 * h * slopes[interval + 1]
  );
}

function stateAt(regimen, day) {
  const volume = pchip(KNOTS, regimen.volume_ratio, day);
  const necrosis = pchip(KNOTS, regimen.necrotic_fraction, day);
  const perfusion = pchip(KNOTS, regimen.perfusion_proxy, day);
  const uncertainty = pchip(KNOTS, regimen.uncertainty_sd, day);
  const viability = perfusion * Math.max(0.12, 1 - 0.58 * necrosis);
  return { volume, necrosis, perfusion, uncertainty, viability };
}

const COLOR_STOPS = [
  [0.00, [0.005, 0.015, 0.19]],
  [0.18, [0.015, 0.10, 0.78]],
  [0.38, [0.00, 0.76, 0.94]],
  [0.58, [0.98, 0.88, 0.02]],
  [0.76, [1.00, 0.35, 0.01]],
  [0.92, [0.94, 0.015, 0.01]],
];

function heatColor(value, target) {
  const v = clamp(value, 0, 1);
  for (let i = 0; i < COLOR_STOPS.length - 1; i += 1) {
    const [x0, c0] = COLOR_STOPS[i];
    const [x1, c1] = COLOR_STOPS[i + 1];
    if (v <= x1) {
      const t = (v - x0) / Math.max(1e-6, x1 - x0);
      target.setRGB(
        c0[0] + (c1[0] - c0[0]) * t,
        c0[1] + (c1[1] - c0[1]) * t,
        c0[2] + (c1[2] - c0[2]) * t,
        THREE.LinearSRGBColorSpace,
      );
      return target;
    }
  }
  const last = COLOR_STOPS[COLOR_STOPS.length - 1][1];
  target.setRGB(last[0], last[1], last[2], THREE.LinearSRGBColorSpace);
  return target;
}

function makeDeformableGeometry(detail) {
  const geometry = mergeVertices(new THREE.IcosahedronGeometry(1, detail));
  geometry.computeVertexNormals();
  const positions = geometry.getAttribute("position");
  const directions = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const inv = 1 / Math.hypot(x, y, z);
    directions[3 * i] = x * inv;
    directions[3 * i + 1] = y * inv;
    directions[3 * i + 2] = z * inv;
  }
  geometry.userData.directions = directions;
  geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(positions.count * 3), 3));
  return geometry;
}

function radialBump(x, y, z, phase, shellOffset = 0) {
  return (
    1 +
    0.065 * Math.sin(3.4 * x - 2.8 * y + 4.1 * z + phase + shellOffset) +
    0.038 * Math.sin(-5.2 * x + 3.1 * y + 2.6 * z - 0.72 * phase)
  );
}

class TumorView {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(37, 1, 0.05, 100);
    this.camera.position.set(0.3, 0.18, 6.25);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 9;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.26;

    this.scene.add(new THREE.HemisphereLight(0xd9efff, 0xc6d7d8, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(4, 5, 6);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x9cdbd7, 1.8);
    rim.position.set(-5, 1, -3);
    this.scene.add(rim);

    this.geometryMaterial = new THREE.MeshStandardMaterial({
      color: 0x62aaa9,
      roughness: 0.42,
      metalness: 0.025,
    });
    this.viabilityMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.30,
      metalness: 0.01,
      emissive: 0x121a24,
      emissiveIntensity: 0.16,
    });
    this.surface = new THREE.Mesh(makeDeformableGeometry(4), this.viabilityMaterial);
    this.scene.add(this.surface);

    const shellColors = [0xcbb3f3, 0x9b72d0, 0x7040a8, 0x40106f];
    const shellOpacities = [0.13, 0.20, 0.31, 0.70];
    this.shells = shellColors.map((color, index) => {
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.30,
        transparent: true,
        opacity: shellOpacities[index],
        depthWrite: false,
        side: THREE.DoubleSide,
        emissive: color,
        emissiveIntensity: 0.055 + index * 0.025,
      });
      const mesh = new THREE.Mesh(makeDeformableGeometry(3), material);
      mesh.renderOrder = index;
      mesh.visible = false;
      this.scene.add(mesh);
      return mesh;
    });

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
  }

  resize() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  updateGeometry(geometry, scale, phase, shellOffset = 0) {
    const positions = geometry.getAttribute("position");
    const dirs = geometry.userData.directions;
    for (let i = 0; i < positions.count; i += 1) {
      const x = dirs[3 * i];
      const y = dirs[3 * i + 1];
      const z = dirs[3 * i + 2];
      const radius = scale * radialBump(x, y, z, phase, shellOffset);
      positions.setXYZ(i, x * radius, y * radius, z * radius);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  updateColors(state, day) {
    const geometry = this.surface.geometry;
    const dirs = geometry.userData.directions;
    const colors = geometry.getAttribute("color");
    const centers = [
      [0.62, -0.22, 0.75, 1.00],
      [-0.72, -0.18, 0.57, 0.82],
      [0.12, 0.86, -0.49, 0.68],
    ];
    const tmp = new THREE.Color();
    for (let i = 0; i < colors.count; i += 1) {
      const x = dirs[3 * i];
      const y = dirs[3 * i + 1];
      const z = dirs[3 * i + 2];
      let localFocus = 0;
      for (const [cx0, cy0, cz0, weight] of centers) {
        const inv = 1 / Math.hypot(cx0, cy0, cz0);
        const dot = clamp(x * cx0 * inv + y * cy0 * inv + z * cz0 * inv, -1, 1);
        localFocus = Math.max(localFocus, weight * Math.exp(4.8 * (dot - 1)));
      }
      const texture = 0.5 + 0.5 * Math.sin(5.2 * x - 3.7 * y + 4.1 * z + day * 0.018);
      const localValue = 0.055 + state.viability * (0.28 + 0.82 * localFocus + 0.12 * texture);
      heatColor(localValue, tmp);
      colors.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    colors.needsUpdate = true;
  }

  update(regimen, day, nextMode) {
    const state = stateAt(regimen, day);
    const baseScale = 1.75 * Math.cbrt(Math.max(0.02, state.volume));
    const phase = 0.16 + day * 0.0065;
    this.updateGeometry(this.surface.geometry, baseScale, phase);
    this.updateColors(state, day);
    this.surface.material = nextMode === "geometry" ? this.geometryMaterial : this.viabilityMaterial;
    this.surface.visible = nextMode !== "uncertainty";

    const relative = [
      1.00 + 1.35 * state.uncertainty,
      0.84 + 0.92 * state.uncertainty,
      0.65 + 0.58 * state.uncertainty,
      0.43 + 0.28 * state.uncertainty,
    ];
    this.shells.forEach((shell, index) => {
      shell.visible = nextMode === "uncertainty";
      if (shell.visible) {
        this.updateGeometry(
          shell.geometry,
          baseScale * relative[index],
          phase + index * 0.24,
          index * 0.31,
        );
      }
    });
    return state;
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}


export { TumorView, stateAt };
