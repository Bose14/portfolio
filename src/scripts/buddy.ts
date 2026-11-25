// A small 3D character of Bose (built from primitives, toon-shaded with ink outlines) that can
// idle, run, jump, dance and wave. It reacts to scrolling, section changes and clicks.
import type * as T from 'three';

const wrap = document.getElementById('buddy');
const canvas = document.getElementById('buddy-cv') as HTMLCanvasElement | null;
if (wrap && canvas) boot(wrap, canvas);

async function boot(wrap: HTMLElement, canvas: HTMLCanvasElement) {
  try { if (sessionStorage.getItem('buddy-hidden') === '1') { wrap.classList.add('gone'); return; } } catch {}
  const start = () => load(wrap, canvas).catch(() => wrap.classList.add('gone'));
  if (document.body.classList.contains('cinema-open')) start();
  else document.addEventListener('intro:start', () => setTimeout(start, 600), { once: true });
}

type Action = 'idle' | 'run' | 'jump' | 'dance' | 'wave';
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

async function load(wrap: HTMLElement, canvas: HTMLCanvasElement) {
  const THREE = (await import('three')) as typeof T;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 1.25, 7.4);
  camera.lookAt(0, 1.25, 0);

  // soft studio reflections + warm key + crimson rim
  try {
    const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
  } catch {}
  scene.add(new THREE.HemisphereLight(0xfff4ee, 0x3a1a1c, 0.7));
  const key = new THREE.DirectionalLight(0xfff0e2, 2.4); key.position.set(2.2, 3.6, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffc9c0, 0.8); fill.position.set(-3, 1.5, 4); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xff4d68, 3.2); rim.position.set(-2.5, 2.5, -3.5); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xff8a9a, 1.6); rim2.position.set(3, 2, -3); scene.add(rim2);

  const std = (c: number, r = 0.6, m = 0, extra: Partial<T.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...extra });
  const M = {
    skin: std(0x8a5032, 0.5, 0, { emissive: 0x2a0d05, emissiveIntensity: 0.22 }),
    skinDark: std(0x724125, 0.6),
    jacket: std(0x1b1b22, 0.78, 0.02),
    jacketLight: std(0x2a2a33, 0.7),
    shirt: std(0xf6f3ee, 0.55),
    tie: std(0x101014, 0.32, 0.25),
    hair: std(0x0b0b0f, 0.38, 0.15),
    pants: std(0x16161c, 0.82),
    shoe: std(0x0a0a0d, 0.28, 0.1),
    red: std(0xe0445c, 0.5),
    white: new THREE.MeshBasicMaterial({ color: 0xfaf6f2 }),
    iris: std(0x3b1f12, 0.25),
    pupil: new THREE.MeshBasicMaterial({ color: 0x050303 }),
    spec: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    lip: std(0x8a3a30, 0.4),
    stubble: new THREE.MeshStandardMaterial({ color: 0x1f130d, roughness: 1, transparent: true, opacity: 0.55 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x0c0c10, roughness: 0.15, metalness: 0.6 }),
  };
  const mk = (geo: T.BufferGeometry, mat: T.Material) => new THREE.Mesh(geo, mat);
  const grp = (x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
  const cap = (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 8, 20);
  const ell = (rx: number, ry: number, rz: number, mat: T.Material, seg = 28) => { const m = mk(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75)), mat); m.scale.set(rx, ry, rz); return m; };

  // ---------- build ----------
  const root = grp(); scene.add(root);
  const hips = grp(0, 0.98, 0); root.add(hips);
  const pelvis = ell(0.2, 0.15, 0.15, M.pants); hips.add(pelvis);

  function leg(side: number) {
    const thigh = grp(side * 0.105, -0.05, 0); hips.add(thigh);
    const t = mk(cap(0.1, 0.28), M.pants); t.position.y = -0.24; t.scale.z = 0.95; thigh.add(t);
    const knee = grp(0, -0.5, 0); thigh.add(knee);
    const sh = mk(cap(0.08, 0.28), M.pants); sh.position.y = -0.22; knee.add(sh);
    const shoe = grp(0, -0.43, 0.02); knee.add(shoe);
    const toe = mk(cap(0.062, 0.1), M.shoe); toe.rotation.x = Math.PI / 2; toe.position.set(0, 0.03, 0.1); shoe.add(toe);
    const heel = ell(0.062, 0.05, 0.085, M.shoe); heel.position.set(0, 0.04, -0.04); shoe.add(heel);
    const sole = mk(new THREE.BoxGeometry(0.125, 0.018, 0.27), M.glass); sole.position.set(0, -0.005, 0.045); shoe.add(sole);
    return { thigh, knee };
  }
  const legL = leg(1), legR = leg(-1);
  const belt = mk(new THREE.TorusGeometry(0.19, 0.016, 8, 32), M.shoe); belt.rotation.x = Math.PI / 2; belt.position.y = 0.12; belt.scale.set(1, 0.8, 1); hips.add(belt);

  const torso = grp(0, 0.1, 0); hips.add(torso);
  const waist = ell(0.2, 0.2, 0.135, M.jacket); waist.position.y = 0.12; torso.add(waist);
  const chest = ell(0.25, 0.29, 0.16, M.jacket); chest.position.y = 0.4; torso.add(chest);
  const shoulderBar = mk(cap(0.078, 0.44), M.jacket); shoulderBar.rotation.z = Math.PI / 2; shoulderBar.position.y = 0.58; shoulderBar.scale.z = 0.85; torso.add(shoulderBar);
  // shirt, collar, tie
  const shirt = mk(new THREE.BoxGeometry(0.17, 0.5, 0.02), M.shirt); shirt.position.set(0, 0.36, 0.158); torso.add(shirt);
  [1, -1].forEach((sd) => {
    const col = mk(new THREE.BoxGeometry(0.075, 0.05, 0.03), M.shirt); col.position.set(sd * 0.05, 0.64, 0.12); col.rotation.set(0.2, 0, -sd * 0.55); torso.add(col);
    const lap = mk(new THREE.BoxGeometry(0.085, 0.4, 0.03), M.jacket); lap.position.set(sd * 0.12, 0.44, 0.165); lap.rotation.z = sd * 0.2; torso.add(lap);
    const lapEdge = mk(new THREE.BoxGeometry(0.012, 0.4, 0.034), M.jacketLight); lapEdge.position.set(sd * 0.082, 0.44, 0.166); lapEdge.rotation.z = sd * 0.2; torso.add(lapEdge);
    const btn = ell(0.014, 0.014, 0.01, M.shoe, 10); btn.position.set(sd * 0.0 + 0.02, 0.18 - (sd > 0 ? 0 : 0.1), 0.17); if (sd < 0) torso.add(btn); else torso.add(btn);
  });
  const knot = mk(new THREE.BoxGeometry(0.056, 0.05, 0.034), M.tie); knot.position.set(0, 0.6, 0.172); torso.add(knot);
  const blade = mk(new THREE.BoxGeometry(0.05, 0.36, 0.024), M.tie); blade.position.set(0, 0.4, 0.175); torso.add(blade);
  const tip = mk(new THREE.ConeGeometry(0.037, 0.07, 4), M.tie); tip.rotation.set(Math.PI, 0, Math.PI / 4); tip.position.set(0, 0.2, 0.175); tip.scale.z = 0.5; torso.add(tip);
  const pocket = mk(new THREE.BoxGeometry(0.07, 0.04, 0.02), M.red); pocket.position.set(0.15, 0.5, 0.17); pocket.rotation.z = 0.12; torso.add(pocket);
  const flap = mk(new THREE.BoxGeometry(0.1, 0.03, 0.02), M.jacketLight); flap.position.set(0.11, 0.27, 0.168); torso.add(flap);

  // hands with fingers
  function hand(side: number) {
    const h = grp(); const palm = ell(0.044, 0.056, 0.026, M.skin, 16); palm.position.y = -0.045; h.add(palm);
    const fingers = grp(0, -0.085, 0); h.add(fingers);
    const set: { x: number; len: number }[] = [{ x: -0.028, len: 0.05 }, { x: -0.009, len: 0.058 }, { x: 0.01, len: 0.055 }, { x: 0.028, len: 0.045 }];
    set.forEach((f) => { const fg = grp(f.x * side, 0, 0); const seg = mk(cap(0.0105, f.len - 0.021), M.skin); seg.position.y = -f.len / 2; fg.add(seg); fg.rotation.x = -0.25; fingers.add(fg); });
    const thumb = grp(-side * 0.04, -0.06, 0.012); const tseg = mk(cap(0.012, 0.03), M.skin); tseg.position.y = -0.02; thumb.add(tseg); thumb.rotation.set(-0.3, 0, side * 0.7); h.add(thumb);
    return { h, fingers };
  }
  function arm(side: number) {
    const sh = grp(side * 0.31, 0.57, 0); torso.add(sh);
    const cap1 = ell(0.075, 0.075, 0.075, M.jacket, 16); sh.add(cap1);
    const u = mk(cap(0.062, 0.22), M.jacket); u.position.y = -0.2; sh.add(u);
    const el = grp(0, -0.37, 0); sh.add(el);
    const f = mk(cap(0.052, 0.2), M.jacket); f.position.y = -0.15; el.add(f);
    const cuff = mk(new THREE.CylinderGeometry(0.047, 0.047, 0.035, 18), M.shirt); cuff.position.y = -0.3; el.add(cuff);
    const hd = hand(side); hd.h.position.y = -0.31; el.add(hd.h);
    if (side > 0) { const w = mk(new THREE.TorusGeometry(0.05, 0.012, 8, 20), M.glass); w.rotation.x = Math.PI / 2; w.position.y = -0.285; el.add(w); const face = mk(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 16), M.glass); face.position.set(0, -0.285, 0.048); face.rotation.x = Math.PI / 2; el.add(face); }
    return { sh, el, fingers: hd.fingers };
  }
  const armL = arm(1), armR = arm(-1);

  // neck + head
  const neck = mk(new THREE.CylinderGeometry(0.058, 0.07, 0.15, 18), M.skinDark); neck.position.y = 0.67; torso.add(neck);
  const head = grp(0, 0.7, 0); torso.add(head);
  const face = ell(0.188, 0.222, 0.2, M.skin, 40); face.position.y = 0.2; head.add(face);
  const chin = ell(0.125, 0.1, 0.14, M.skin, 28); chin.position.set(0, 0.04, 0.045); head.add(chin);
  const cheekL = ell(0.05, 0.05, 0.05, M.skin, 14); cheekL.position.set(0.085, 0.14, 0.15); head.add(cheekL);
  const cheekR = cheekL.clone(); cheekR.position.x = -0.085; head.add(cheekR);
  [1, -1].forEach((sd) => { const ear = ell(0.022, 0.045, 0.03, M.skin, 12); ear.position.set(sd * 0.186, 0.2, -0.005); head.add(ear); });
  // stubble / moustache
  const stub = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 24, 0, Math.PI * 2, 1.78, 1.0), M.stubble); stub.scale.set(0.194, 0.228, 0.206); stub.position.y = 0.2; head.add(stub);
  const stache = mk(cap(0.012, 0.09), M.stubble); stache.rotation.z = Math.PI / 2; stache.position.set(0, 0.138, 0.184); head.add(stache);
  // eyes
  const eyes: T.Group[] = [];
  [1, -1].forEach((sd) => {
    const e = grp(sd * 0.072, 0.235, 0.168); head.add(e); eyes.push(e);
    const w = ell(0.036, 0.029, 0.026, M.white, 20); e.add(w);
    const ir = ell(0.0215, 0.0215, 0.012, M.iris, 18); ir.position.set(0, 0, 0.018); e.add(ir);
    const pu = ell(0.011, 0.011, 0.006, M.pupil, 12); pu.position.set(0, 0, 0.026); e.add(pu);
    const sp = ell(0.0055, 0.0055, 0.004, M.spec, 8); sp.position.set(0.008, 0.008, 0.029); e.add(sp);
    const lid = ell(0.039, 0.03, 0.03, M.skin, 18); lid.position.set(0, 0.012, -0.002); lid.scale.set(0.039, 0.019, 0.03); e.add(lid);
    const brow = mk(cap(0.0095, 0.075), M.hair); brow.rotation.z = Math.PI / 2 + sd * 0.12; brow.position.set(sd * 0.075, 0.292, 0.17); brow.rotation.y = -sd * 0.25; head.add(brow);
  });
  const nose = ell(0.028, 0.026, 0.03, M.skin, 14); nose.position.set(0, 0.168, 0.2); head.add(nose);
  const bridge = mk(cap(0.012, 0.05), M.skin); bridge.position.set(0, 0.2, 0.19); bridge.rotation.x = -0.15; head.add(bridge);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.0085, 8, 28, Math.PI), M.lip); smile.position.set(0, 0.12, 0.183); smile.rotation.z = Math.PI; head.add(smile);
  const teeth = new THREE.Mesh(new THREE.CircleGeometry(0.056, 28, Math.PI, Math.PI), M.white); teeth.position.set(0, 0.12, 0.18); head.add(teeth);
  // hair: wavy locks over the scalp (deterministic)
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const hairG = grp(0, 0.2, 0); head.add(hairG);
  const N = 300;
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 1.45, r = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.399963;
    const d = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
    if (d.y < 0.08) continue;
    if (d.z > 0.5 && d.y < 0.58) continue;                      // keep the forehead clear
    if (d.y < 0.25 && Math.abs(d.x) < 0.35 && d.z > -0.2) continue;
    const rad = 0.212 + rnd() * 0.01;
    const size = 0.03 + rnd() * 0.028 + (d.y > 0.6 ? 0.008 : 0);
    const lock = ell(size, size * (0.8 + rnd() * 0.5), size * (1.1 + rnd() * 0.5), M.hair, 10);
    lock.position.set(d.x * 0.19 * (rad / 0.215), d.y * 0.235 * (rad / 0.215) + 0.01, d.z * 0.205 * (rad / 0.215));
    lock.lookAt(lock.position.clone().add(d)); lock.rotateZ(rnd() * Math.PI);
    hairG.add(lock);
  }
  // fringe: a few swept locks over the forehead
  [[-0.08, 0.2, 0.16, 0.5], [0, 0.215, 0.165, 0.2], [0.08, 0.21, 0.155, -0.35], [0.13, 0.17, 0.12, -0.7], [-0.14, 0.17, 0.11, 0.8]].forEach(([x, y, z, rz]) => {
    const l = mk(cap(0.032, 0.08), M.hair); l.position.set(x, y, z); l.rotation.set(0.3, 0, rz + Math.PI / 2); hairG.add(l);
  });
  const eyeL = eyes[0], eyeR = eyes[1];

  // ground glow
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.85, 48), new THREE.MeshBasicMaterial({ color: 0xee4b62, transparent: true, opacity: 0.2 }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.01; root.add(disc);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.83, 0.865, 64), new THREE.MeshBasicMaterial({ color: 0xee4b62, transparent: true, opacity: 0.55 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012; root.add(ring);

  // ---------- pose system ----------
  const J = ['rootY','rootRy','bodyY','torsoX','torsoY','torsoZ','headX','headY','headZ','thL','thR','knL','knR','shLx','shRx','shLz','shRz','elL','elR','fiL','fiR'] as const;
  type Pose = Record<(typeof J)[number], number>;
  const zero = (): Pose => Object.fromEntries(J.map((k) => [k, 0])) as Pose;
  const cur = zero();
  let action: Action = 'idle', actionT = 0, until = 0;
  let pointer = { x: 0, y: 0 };
  let runDir = 1;
  let breathe = 0;

  function target(a: Action, t: number): Pose {
    const p = zero();
    const s = Math.sin, c = Math.cos;
    p.shLz = 0.1; p.shRz = -0.1; p.elL = -0.14; p.elR = -0.14; p.fiL = 0.3; p.fiR = 0.3;
    if (a === 'idle') {
      p.torsoY = s(t * 0.7) * 0.06; p.shLx = s(t * 1.1) * 0.05; p.shRx = -s(t * 1.1) * 0.05;
    } else if (a === 'run') {
      const w = t * 12, S = s(w), C = c(w);
      p.rootRy = 1.0 * runDir; p.torsoX = 0.22; p.torsoY = S * 0.28; p.rootY = Math.abs(C) * 0.1;
      p.thL = -S * 1.0; p.thR = S * 1.0;
      p.knL = 0.25 + 0.95 * Math.max(0, C); p.knR = 0.25 + 0.95 * Math.max(0, -C);
      p.shLx = S * 1.1; p.shRx = -S * 1.1; p.elL = -1.25; p.elR = -1.25; p.fiL = 1.1; p.fiR = 1.1; p.shLz = 0.1; p.shRz = -0.1;
      p.headX = -0.15;
    } else if (a === 'jump') {
      const P = clamp(t / 1.05, 0, 1);
      const u = clamp((P - 0.2) / 0.64, 0, 1);
      const air = P > 0.2 && P < 0.84 ? s(Math.PI * u) : 0;
      const cr = P < 0.2 ? P / 0.2 : P > 0.84 ? 1 - (P - 0.84) / 0.16 : 0;
      p.bodyY = -0.34 * cr; p.thL = -1.0 * cr - 0.9 * air; p.thR = -1.0 * cr - 0.35 * air; p.knL = 1.7 * cr + 1.2 * air; p.knR = 1.7 * cr + 0.9 * air;
      p.torsoX = 0.35 * cr; p.shLx = 0.6 * cr; p.shRx = 0.6 * cr;
      p.shLz = 0.14 + 2.7 * air; p.shRz = -0.14 - 2.7 * air; p.elL = -0.4 * air; p.elR = -0.4 * air;
      p.rootY = 0.7 * 4 * u * (1 - u) * (P > 0.2 && P < 0.84 ? 1 : 0);
      p.rootRy = P > 0.2 && P < 0.84 ? u * Math.PI * 2 : 0;
      p.headX = -0.2 * air;
    } else if (a === 'dance') {
      const b = t * Math.PI * 2 * 2.2, S = s(b), HB = s(b / 2);
      const move = Math.floor(t / 1.82) % 3;
      p.rootY = Math.abs(s(b / 2)) * 0.1; p.torsoZ = HB * 0.14; p.headZ = -HB * 0.18; p.headX = Math.abs(s(b)) * 0.12;
      p.knL = 0.4 + 0.4 * S; p.knR = 0.4 - 0.4 * S; p.thL = -0.2 - 0.2 * S; p.thR = -0.2 + 0.2 * S;
      if (move === 0) { // arm pump
        p.shLz = 1.7 + 0.7 * S; p.shRz = -(1.7 - 0.7 * S); p.elL = -0.5; p.elR = -0.5; p.torsoY = HB * 0.3;
      } else if (move === 1) { // disco point
        p.shRz = -2.6 + s(b) * 0.15; p.elR = -0.2; p.shLz = 0.75; p.elL = -1.9; p.shLx = 0.2;
        p.torsoY = HB * 0.5; p.rootRy = HB * 0.5; p.thL = -0.5 - 0.3 * S; p.thR = 0.1 + 0.2 * S;
      } else { // sway and swing
        p.shLx = -1.3; p.shRx = -1.3; p.shLz = 0.4 + S * 0.9; p.shRz = -0.4 + S * 0.9; p.elL = -0.9; p.elR = -0.9;
        p.torsoY = S * 0.35; p.rootRy = S * 0.25;
      }
    } else if (a === 'wave') {
      p.shRz = -2.5 - 0.05; p.elR = -0.2 + s(t * 10) * 0.55; p.fiR = -0.05; p.shRx = 0; p.torsoZ = 0.05; p.headZ = 0.08; p.rootRy = 0.15;
    }
    return p;
  }

  function play(a: Action, dur = 0) {
    action = a; actionT = 0; until = dur ? performance.now() + dur : 0;
    wrap.dataset.action = a;
    wrap.querySelectorAll('[data-act]').forEach((b) => b.classList.toggle('on', (b as HTMLElement).dataset.act === a && (a === 'dance' || a === 'run')));
  }

  // ---------- inputs ----------
  wrap.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((b) =>
    b.addEventListener('click', () => {
      const a = b.dataset.act as Action;
      if (a === 'jump') play('jump', 1100);
      else if (a === 'dance') play(action === 'dance' ? 'idle' : 'dance', action === 'dance' ? 0 : 12000);
      else if (a === 'run') play(action === 'run' ? 'idle' : 'run', action === 'run' ? 0 : 6000);
      else play(a, 2800);
    }));
  const cycle: Action[] = ['jump', 'dance', 'wave', 'run'];
  let ci = 0;
  canvas.addEventListener('click', () => { const a = cycle[ci++ % cycle.length]; play(a, a === 'jump' ? 1100 : a === 'dance' ? 7000 : a === 'run' ? 3500 : 2800); });
  document.getElementById('buddy-x')?.addEventListener('click', () => { wrap.classList.add('gone'); try { sessionStorage.setItem('buddy-hidden', '1'); } catch {} });
  addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = clamp((e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.5), -1, 1);
    pointer.y = clamp((e.clientY - (r.top + r.height * 0.3)) / (innerHeight * 0.5), -1, 1);
  }, { passive: true });

  // scroll → run, section change → jump, contact → dance
  let lastY = scrollY, lastScroll = 0;
  addEventListener('scroll', () => {
    const dy = Math.abs(scrollY - lastY); lastY = scrollY;
    if (dy > 6 && (action === 'idle' || action === 'run' || action === 'wave')) { lastScroll = performance.now(); if (action !== 'run') play('run'); }
  }, { passive: true });
  const secs = Array.from(document.querySelectorAll<HTMLElement>('[data-co]'));
  let lastSec = '';
  let side = 'l', shown = false;
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target as HTMLElement;
      const id = el.dataset.co!;
      if (id === lastSec) return;
      const first = lastSec === ''; lastSec = id;
      if (id === 'home') { wrap.classList.add('away'); return; }
      const wasAway = wrap.classList.contains('away'); wrap.classList.remove('away');
      if (!matchMedia('(max-width: 768px)').matches) {
        const want = el.classList.contains('right') ? 'r' : el.classList.contains('left') ? 'l' : side;
        if (want !== side) { side = want; runDir = want === 'r' ? 1 : -1; wrap.dataset.side = want; play('run', 1150); return; }
      }
      if (first) return;
      if (!shown && wasAway) { shown = true; play('wave', 2600); return; }
      if (id === 'contact') play('dance', 9000);
      else if (action !== 'dance') play('jump', 1100);
    });
  }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
  secs.forEach((s) => io.observe(s));

  // ---------- size, loop ----------
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);

  let last = performance.now(), visible = !document.hidden;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; last = performance.now(); if (visible) requestAnimationFrame(frame); });

  function apply(p: Pose, t: number) {
    root.position.y = p.rootY; root.rotation.y = p.rootRy;
    hips.position.y = 0.98 + p.bodyY;
    torso.rotation.set(p.torsoX, p.torsoY, p.torsoZ);
    torso.scale.set(1, 1 + Math.sin(t * 1.8) * 0.008, 1);
    head.rotation.set(p.headX + pointer.y * 0.25, p.headY + pointer.x * 0.55, p.headZ);
    legL.thigh.rotation.x = p.thL; legR.thigh.rotation.x = p.thR; legL.knee.rotation.x = p.knL; legR.knee.rotation.x = p.knR;
    armL.sh.rotation.set(p.shLx, 0, p.shLz); armR.sh.rotation.set(p.shRx, 0, p.shRz);
    armL.el.rotation.x = p.elL; armR.el.rotation.x = p.elR;
    armL.fingers.rotation.x = p.fiL; armR.fingers.rotation.x = p.fiR;
    ring.rotation.z = t * 0.5; ring.scale.setScalar(1 + Math.sin(t * 2) * 0.03);
    (disc.material as T.MeshBasicMaterial).opacity = 0.18 + p.rootY * -0.05 + Math.sin(t * 2) * 0.03;
  }

  let clock = 0, blinkAt = 2;
  function frame(now: number) {
    if (!visible) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt; actionT += dt;
    if (action === 'run' && !until && now - lastScroll > 700) play('idle');
    if (until && now > until) { until = 0; play('idle'); }
    const tg = target(action, actionT);
    const k = action === 'jump' ? 1 - Math.exp(-dt * 40) : 1 - Math.exp(-dt * 14);
    (J as readonly (keyof Pose)[]).forEach((j) => { cur[j] += (tg[j] - cur[j]) * (j === 'rootRy' && action === 'jump' ? 1 : k); });
    // blink
    if (clock > blinkAt) { eyeL.scale.y = eyeR.scale.y = 0.1; if (clock > blinkAt + 0.12) { eyeL.scale.y = eyeR.scale.y = 1; blinkAt = clock + 2 + Math.random() * 3; } }
    apply(cur, clock);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  wrap.classList.add('ready');
  if (reduce) { apply(target('idle', 0), 0); renderer.render(scene, camera); return; }
  requestAnimationFrame((n) => { last = n; frame(n); });
  (window as any).__buddy = { play };
}
