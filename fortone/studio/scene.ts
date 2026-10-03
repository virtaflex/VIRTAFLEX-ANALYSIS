/**
 * Fortone "studio" — a deterministic three.js scene used to render the hero
 * video and the flavour stills. It is not shipped with the website; run
 * `npm run render:media` to regenerate everything in public/media.
 *
 * The page exposes two hooks for studio/render.ts:
 *   window.__setup(config)  → builds the scene
 *   window.__frame(t)       → renders time t (seconds) and returns a PNG data URL
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

type Topping = 'sprinkles' | 'crumbs' | 'pistachio' | 'mango' | 'none';

export interface ShotConfig {
  width: number;
  height: number;
  /** transparent background (stills) vs. cinematic backdrop (video) */
  transparent: boolean;
  container: 'cone' | 'cup';
  colorA: string;
  /** second colour for a twist swirl */
  colorB?: string;
  drizzle?: string;
  topping: Topping;
  /** seconds for one full turn — the video loop length */
  loop: number;
  /** horizontal placement of the cone in world units */
  offsetX: number;
  offsetY: number;
  distance: number;
  tilt: number;
  /** floating sprinkles + bokeh (video only) */
  atmosphere: boolean;
  /** static yaw for stills, in radians */
  yaw: number;
  seed: number;
}

declare global {
  interface Window {
    __setup: (c: ShotConfig) => void;
    __frame: (t: number) => string;
    __ready: boolean;
  }
}

/* ---------- helpers ---------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/* ---------- soft-serve swirl ---------- */

interface SwirlSample {
  p: THREE.Vector3;
  n: THREE.Vector3;
  b: THREE.Vector3;
  r: number;
  s: number;
}

/** Conical helix with a ridged ("star nozzle") cross-section that tapers into the classic curl tip. */
function buildSwirl(colorA: THREE.Color, colorB: THREE.Color | null) {
  const turns = 3.6;
  const N = 720;
  const M = 72;
  const R0 = 0.9;
  const tube0 = 0.41;

  const samples: SwirlSample[] = [];
  let y = 0.02;
  const pts: THREE.Vector3[] = [];
  const radii: number[] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const theta = s * turns * Math.PI * 2;
    // tube shrinks towards the top, then tapers to a point
    let tr = tube0 * (1 - 0.5 * s);
    tr *= Math.pow(Math.min(1, (1 - s) / 0.11), 0.62);
    // the first loop starts inside the cone so no open end shows
    tr *= 0.72 + 0.28 * smooth(0, 0.06, s);
    const r = R0 * Math.pow(1 - s, 0.92) * (1 - 0.06 * Math.sin(s * 9));
    const pitch = Math.max(0.5, 1.5 * (tube0 * (1 - 0.5 * s)));
    if (i > 0) y += (turns * pitch * 1.02) / N + (s > 0.86 ? 0.0012 : 0);
    // the tip lifts and leans over slightly
    const lean = smooth(0.82, 1, s) * 0.22;
    pts.push(new THREE.Vector3(Math.cos(theta) * r + lean, y, Math.sin(theta) * r));
    radii.push(Math.max(0.0005, tr));
  }

  // parallel-transport frames
  const tangents = pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    return b.clone().sub(a).normalize();
  });
  let normal = new THREE.Vector3(0, 1, 0).cross(tangents[0]).normalize();
  for (let i = 0; i < pts.length; i++) {
    const t = tangents[i];
    if (i > 0) {
      const axis = tangents[i - 1].clone().cross(t);
      const len = axis.length();
      if (len > 1e-6) {
        axis.normalize();
        const ang = Math.acos(Math.min(1, Math.max(-1, tangents[i - 1].dot(t))));
        normal.applyAxisAngle(axis, ang);
      }
    }
    normal = normal.sub(t.clone().multiplyScalar(normal.dot(t))).normalize();
    const b = t.clone().cross(normal).normalize();
    samples.push({ p: pts[i], n: normal.clone(), b, r: radii[i], s: i / N });
  }

  const pos = new Float32Array(samples.length * M * 3);
  const col = new Float32Array(samples.length * M * 3);
  const ridges = 8;
  const c = new THREE.Color();
  for (let i = 0; i < samples.length; i++) {
    const { p, n, b, r, s } = samples[i];
    for (let j = 0; j < M; j++) {
      const phi = (j / M) * Math.PI * 2;
      const twist = s * 26;
      const ridge = 1 + 0.125 * Math.cos(ridges * phi + twist) * smooth(1, 0.9, s);
      // soft serve settles under its own weight: flatten the underside a touch
      const cx = Math.cos(phi);
      const sy = Math.sin(phi);
      const rr = r * ridge;
      const v = p
        .clone()
        .addScaledVector(n, cx * rr * (cx < 0 ? 0.9 : 1))
        .addScaledVector(b, sy * rr);
      const k = (i * M + j) * 3;
      pos[k] = v.x;
      pos[k + 1] = v.y;
      pos[k + 2] = v.z;
      if (colorB) {
        const mix = smooth(-0.22, 0.22, Math.sin(phi + twist * 0.5));
        c.copy(colorA).lerp(colorB, mix);
      } else c.copy(colorA);
      // a faint lightening on ridge crests reads as creaminess
      c.offsetHSL(0, 0, (ridge - 1) * 0.25);
      col[k] = c.r;
      col[k + 1] = c.g;
      col[k + 2] = c.b;
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < samples.length - 1; i++) {
    for (let j = 0; j < M; j++) {
      const a = i * M + j;
      const b2 = i * M + ((j + 1) % M);
      const c2 = (i + 1) * M + j;
      const d = (i + 1) * M + ((j + 1) % M);
      idx.push(a, b2, c2, b2, d, c2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return { geo, samples };
}

function creamMaterial() {
  return new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.48,
    metalness: 0,
    clearcoat: 0.22,
    clearcoatRoughness: 0.55,
    sheen: 0.35,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color('#ffffff'),
  });
}

/* ---------- containers ---------- */

function waffleTexture() {
  // a seamless diagonal tile: diamonds whose grooves pass through the tile corners
  const s = 512;
  const cell = s / 2;
  const draw = (g: CanvasRenderingContext2D, bump: boolean) => {
    g.fillStyle = bump ? '#fff' : '#d59c57';
    g.fillRect(0, 0, s, s);
    if (!bump)
      for (let i = 0; i <= 2; i++)
        for (let j = 0; j <= 2; j++) {
          // diamond centres sit between the diagonal grooves
          for (const [cx, cy] of [[i * cell, j * cell + cell / 2], [i * cell + cell / 2, j * cell]]) {
            const rg = g.createRadialGradient(cx - 12, cy - 18, 4, cx, cy, cell * 0.5);
            rg.addColorStop(0, 'rgba(255,228,176,0.65)');
            rg.addColorStop(1, 'rgba(150,84,30,0)');
            g.fillStyle = rg;
            g.fillRect(cx - cell, cy - cell, cell * 2, cell * 2);
          }
        }
    g.strokeStyle = bump ? '#000' : 'rgba(118,62,20,0.92)';
    g.lineWidth = bump ? 26 : 16;
    if (bump) g.filter = 'blur(6px)';
    for (let k = -2; k <= 2; k++) {
      g.beginPath();
      g.moveTo(k * cell - s, -s);
      g.lineTo(k * cell + 2 * s, 2 * s);
      g.moveTo(k * cell + 2 * s, -s);
      g.lineTo(k * cell - s, 2 * s);
      g.stroke();
    }
  };
  const mk = (bump: boolean) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = s;
    draw(cv.getContext('2d')!, bump);
    const t = new THREE.CanvasTexture(cv);
    if (!bump) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  };
  return { tex: mk(false), bump: mk(true) };
}

function buildCone() {
  const group = new THREE.Group();
  const { tex, bump } = waffleTexture();
  for (const t of [tex, bump]) t.repeat.set(5, 2.4);
  const mat = new THREE.MeshStandardMaterial({ map: tex, bumpMap: bump, bumpScale: 2.2, roughness: 0.78 });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.06, 2.75, 128, 8, true), mat);
  cone.position.y = -1.33;
  cone.castShadow = cone.receiveShadow = true;
  group.add(cone);
  const rimMat = new THREE.MeshStandardMaterial({ color: '#cf9550', roughness: 0.7 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.11, 0.085, 24, 160), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.04;
  rim.castShadow = true;
  group.add(rim);
  return group;
}

function cupTexture() {
  const w = 1024;
  const h = 256;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d')!;
  // lathe V runs bottom → top: draw the label upside-down so it lands upright
  g.translate(0, h);
  g.scale(1, -1);
  g.fillStyle = '#fbf3e6';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#3a1a1f';
  g.fillRect(0, h * 0.62, w, h * 0.38);
  g.fillStyle = '#c9a15b';
  g.fillRect(0, h * 0.58, w, h * 0.04);
  g.fillStyle = '#3a1a1f';
  g.font = 'italic 600 58px Georgia, serif';
  g.textAlign = 'center';
  for (let i = 0; i < 3; i++) g.fillText('Fortone', w * (1 / 6 + i / 3), h * 0.42);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.flipY = false;
  return tex;
}

function buildCup() {
  const group = new THREE.Group();
  const profile = [new THREE.Vector2(0.001, -1.75), new THREE.Vector2(0.78, -1.75), new THREE.Vector2(1.1, 0), new THREE.Vector2(1.16, 0.06)];
  const cup = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 160),
    new THREE.MeshStandardMaterial({ map: cupTexture(), roughness: 0.42, side: THREE.DoubleSide }),
  );
  cup.castShadow = cup.receiveShadow = true;
  group.add(cup);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.045, 16, 160), new THREE.MeshStandardMaterial({ color: '#fbf3e6', roughness: 0.4 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.05;
  group.add(rim);
  group.position.y = 0.05;
  return group;
}

/* ---------- toppings ---------- */

const SPRINKLE_COLORS = ['#f4a7b9', '#ffd38a', '#b9d99a', '#ffffff', '#e2556f', '#8fc9e8'];

function toppingMesh(kind: Topping, count: number, rnd: () => number) {
  let geo: THREE.BufferGeometry;
  let colors: string[];
  let scale = 1;
  switch (kind) {
    case 'sprinkles':
      geo = new THREE.CapsuleGeometry(0.022, 0.11, 4, 8);
      colors = SPRINKLE_COLORS;
      break;
    case 'crumbs':
      geo = new THREE.IcosahedronGeometry(0.06, 0);
      colors = ['#b5773a', '#c98f4e', '#8d5626'];
      break;
    case 'pistachio':
      geo = new THREE.DodecahedronGeometry(0.055, 0);
      colors = ['#8fb35a', '#a8c46b', '#6f8f3c', '#c9b07a'];
      break;
    case 'mango':
      geo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
      colors = ['#ffad2e', '#ffbe45', '#f59a1b'];
      scale = 1;
      break;
    default:
      return null;
  }
  const mat = new THREE.MeshPhysicalMaterial({
    roughness: kind === 'mango' ? 0.25 : 0.55,
    clearcoat: kind === 'mango' ? 0.8 : 0.2,
    transmission: 0,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) mesh.setColorAt(i, c.set(colors[Math.floor(rnd() * colors.length)]));
  mesh.castShadow = true;
  mesh.userData.scale = scale;
  return mesh;
}

function scatterOnSwirl(mesh: THREE.InstancedMesh, samples: SwirlSample[], rnd: () => number, kind: Topping) {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  let placed = 0;
  let guard = 0;
  while (placed < mesh.count && guard++ < 50000) {
    const i = Math.floor(rnd() * (samples.length * 0.96));
    const sm = samples[i];
    const phi = rnd() * Math.PI * 2;
    const nrm = sm.n.clone().multiplyScalar(Math.cos(phi)).addScaledVector(sm.b, Math.sin(phi)).normalize();
    // only on upward-facing surface, denser near the top
    if (nrm.y < 0.25 || rnd() > 0.35 + sm.s) continue;
    const p = sm.p.clone().addScaledVector(nrm, sm.r * 1.02);
    if (kind === 'sprinkles') {
      // lie flat on the surface with a random heading
      const tangent = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).cross(nrm).normalize();
      q.setFromUnitVectors(up, tangent);
    } else {
      q.setFromEuler(new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6));
    }
    const sc = (0.75 + rnd() * 0.5) * (mesh.userData.scale as number);
    m.compose(p, q, new THREE.Vector3(sc, sc, sc));
    mesh.setMatrixAt(placed++, m);
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
}

/** A chocolate/caramel ribbon wrapping the swirl. */
function buildDrizzle(samples: SwirlSample[], color: string) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < samples.length; i += 3) {
    const sm = samples[i];
    if (sm.s > 0.93) break;
    const wob = Math.sin(sm.s * 60) * 0.9;
    const nrm = sm.n.clone().multiplyScalar(Math.cos(1.2 + wob)).addScaledVector(sm.b, Math.sin(1.2 + wob)).normalize();
    if (nrm.y < 0) nrm.y *= 0.3;
    pts.push(sm.p.clone().addScaledVector(nrm.normalize(), sm.r * 1.0 + 0.012));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 900, 0.045, 10, false),
    new THREE.MeshPhysicalMaterial({ color, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1 }),
  );
  mesh.castShadow = true;
  return mesh;
}

/* ---------- atmosphere (video) ---------- */

function bokehTexture() {
  const s = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d')!;
  const rg = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  rg.addColorStop(0, 'rgba(255,255,255,0.9)');
  rg.addColorStop(0.55, 'rgba(255,255,255,0.35)');
  rg.addColorStop(0.75, 'rgba(255,255,255,0.12)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function backdropTexture(w: number, h: number) {
  const cv = document.createElement('canvas');
  cv.width = 1024;
  cv.height = Math.round((1024 * h) / w);
  const g = cv.getContext('2d')!;
  const W = cv.width;
  const H = cv.height;
  g.fillStyle = '#150a0c';
  g.fillRect(0, 0, W, H);
  const rg = g.createRadialGradient(W * 0.68, H * 0.42, 10, W * 0.62, H * 0.5, Math.max(W, H) * 0.75);
  rg.addColorStop(0, '#5a2232');
  rg.addColorStop(0.45, '#2c1118');
  rg.addColorStop(1, '#120709');
  g.fillStyle = rg;
  g.fillRect(0, 0, W, H);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- scene assembly ---------- */

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let spinner: THREE.Group;
let cfg: ShotConfig;
const animated: ((t: number) => void)[] = [];

window.__setup = (c: ShotConfig) => {
  cfg = c;
  const rnd = mulberry32(c.seed);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: c.transparent, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(c.width, c.height);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  if (c.transparent) renderer.setClearColor(0x000000, 0);
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = c.transparent ? 0.75 : 0.55;
  if (!c.transparent) scene.background = backdropTexture(c.width, c.height);

  camera = new THREE.PerspectiveCamera(30, c.width / c.height, 0.1, 100);
  camera.position.set(0, 1.4, c.distance);
  camera.lookAt(0, 0, 0);

  // lighting: warm key, blush rim, cool fill
  const key = new THREE.DirectionalLight('#fff1dc', 2.6);
  key.position.set(-4, 7, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -4;
  key.shadow.camera.right = key.shadow.camera.top = 4;
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#ff9fb4', c.transparent ? 1.6 : 3.2);
  rim.position.set(5, 3, -6);
  scene.add(rim);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.5);
  fill.position.set(4, -2, 5);
  scene.add(fill);

  const product = new THREE.Group();
  const tilted = new THREE.Group();
  spinner = new THREE.Group();
  tilted.rotation.z = c.tilt;
  tilted.add(spinner);
  product.add(tilted);
  product.position.set(c.offsetX, c.offsetY, 0);
  scene.add(product);

  const colA = new THREE.Color(c.colorA);
  const colB = c.colorB ? new THREE.Color(c.colorB) : null;
  const { geo, samples } = buildSwirl(colA, colB);
  const swirl = new THREE.Mesh(geo, creamMaterial());
  swirl.castShadow = swirl.receiveShadow = true;
  const swirlRoot = new THREE.Group();
  swirlRoot.add(swirl);
  // the swirl base sits inside the container
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.08, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhysicalMaterial({ color: colA, roughness: 0.5, sheen: 0.6 }),
  );
  dome.scale.y = 0.32;
  dome.position.y = 0.02;
  swirlRoot.add(dome);
  if (c.drizzle) swirlRoot.add(buildDrizzle(samples, c.drizzle));
  const top = toppingMesh(c.topping, c.topping === 'mango' ? 26 : c.topping === 'sprinkles' ? 260 : 170, rnd);
  if (top) {
    scatterOnSwirl(top, samples, rnd, c.topping);
    swirlRoot.add(top);
  }
  spinner.add(c.container === 'cone' ? buildCone() : buildCup());
  spinner.add(swirlRoot);
  // centre the whole product vertically
  product.position.y += c.container === 'cone' ? 0.15 : -0.1;

  if (c.atmosphere) {
    // falling sprinkles: loop-periodic so the video wraps seamlessly
    const n = 110;
    const sp = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.03, 0.15, 4, 8), new THREE.MeshPhysicalMaterial({ roughness: 0.45, clearcoat: 0.4 }), n);
    const colors = new THREE.Color();
    const seeds = Array.from({ length: n }, () => ({
      x: (rnd() - 0.5) * 14 + c.offsetX * 0.4,
      y: rnd() * 10,
      z: -5 + rnd() * 8,
      ax: rnd() * 6,
      ay: rnd() * 6,
      spin: 1 + Math.floor(rnd() * 3),
      fall: 1 + Math.floor(rnd() * 2),
      sway: rnd() * Math.PI * 2,
    }));
    seeds.forEach((_, i) => sp.setColorAt(i, colors.set(SPRINKLE_COLORS[i % SPRINKLE_COLORS.length])));
    scene.add(sp);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const one = new THREE.Vector3(1, 1, 1);
    const v = new THREE.Vector3();
    animated.push((t) => {
      const ph = (t / c.loop) * Math.PI * 2;
      seeds.forEach((s, i) => {
        const y = (((s.y - (t / c.loop) * 10 * s.fall) % 10) + 10) % 10 - 5;
        v.set(s.x + Math.sin(ph + s.sway) * 0.25, y, s.z);
        e.set(s.ax + ph * s.spin, s.ay + ph * s.spin, 0);
        q.setFromEuler(e);
        m.compose(v, q, one);
        sp.setMatrixAt(i, m);
      });
      sp.instanceMatrix.needsUpdate = true;
    });

    // bokeh orbs far behind the product
    const nb = 46;
    const bpos = new Float32Array(nb * 3);
    const bcol = new Float32Array(nb * 3);
    const base = seeds.slice(0, nb).map(() => ({ x: (rnd() - 0.5) * 26, y: (rnd() - 0.5) * 14, z: -9 - rnd() * 8, ph: rnd() * 6 }));
    const pal = ['#ff9fb4', '#ffd7a0', '#ffffff', '#c9a15b'];
    base.forEach((_, i) => {
      colors.set(pal[i % pal.length]);
      bcol.set([colors.r, colors.g, colors.b], i * 3);
    });
    const bgeo = new THREE.BufferGeometry();
    bgeo.setAttribute('position', new THREE.BufferAttribute(bpos, 3));
    bgeo.setAttribute('color', new THREE.BufferAttribute(bcol, 3));
    const pts = new THREE.Points(
      bgeo,
      new THREE.PointsMaterial({ size: 1.6, map: bokehTexture(), vertexColors: true, transparent: true, opacity: 0.38, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    scene.add(pts);
    animated.push((t) => {
      const ph = (t / c.loop) * Math.PI * 2;
      base.forEach((b, i) => bpos.set([b.x + Math.sin(ph + b.ph) * 0.6, b.y + Math.cos(ph + b.ph) * 0.4, b.z], i * 3));
      bgeo.attributes.position.needsUpdate = true;
    });
  }

  window.__ready = true;
};

window.__frame = (t: number) => {
  const ph = (t / cfg.loop) * Math.PI * 2;
  spinner.rotation.y = cfg.yaw + (cfg.atmosphere ? ph : 0);
  if (cfg.atmosphere) {
    // gentle camera breathing, periodic with the loop
    camera.position.set(Math.sin(ph) * 0.35, 1.4 + Math.sin(ph * 2) * 0.12, cfg.distance);
    camera.lookAt(0, 0, 0);
  }
  for (const fn of animated) fn(t);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
};
