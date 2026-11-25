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

type Action = 'idle' | 'run' | 'jump' | 'dance' | 'wave' | 'swing' | 'land';
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
  camera.position.set(0, 1.12, 6.3);
  camera.lookAt(0, 1.12, 0);

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

  // ---------- Michelle (free three.js sample model, Mixamo rig) ----------
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/michelle.glb`);
  const root = new THREE.Group(); scene.add(root);
  const model = gltf.scene; root.add(model);
  model.traverse((o) => { if ((o as T.Mesh).isMesh) (o as T.Mesh).frustumCulled = false; });
  const bbox = new THREE.Box3().setFromObject(model);
  const k0 = 2.05 / (bbox.max.y - bbox.min.y);
  model.scale.setScalar(k0); model.position.y = -bbox.min.y * k0;

  const mixer = new THREE.AnimationMixer(model);
  const samba = mixer.clipAction(gltf.animations.find((a) => /samba/i.test(a.name)) ?? gltf.animations[0]);
  samba.setLoop(THREE.LoopRepeat, Infinity);
  let sambaOn = false;

  // bones + rest data (model space) for the hand-posed moves
  const bone: Record<string, T.Bone> = {};
  model.traverse((o) => { if ((o as T.Bone).isBone) bone[o.name.replace(/[^a-zA-Z0-9]/g, '').replace(/^mixamorig/, '')] = o as T.Bone; });
  model.updateMatrixWorld(true);
  const restW: Record<string, T.Quaternion> = {}, restL: Record<string, T.Quaternion> = {};
  const hipsRestPos = bone.Hips.position.clone();
  const hipsUnit = bone.Hips.parent!.getWorldScale(new THREE.Vector3()).y || 1;
  Object.keys(bone).forEach((n) => { restW[n] = bone[n].getWorldQuaternion(new THREE.Quaternion()); restL[n] = bone[n].quaternion.clone(); });
  const parentOf = (n: string) => Object.keys(bone).find((k) => bone[k] === bone[n].parent) ?? '';
  const identity = new THREE.Quaternion();
  const Rx = (a: number) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), a);
  const Ry = (a: number) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
  const Rz = (a: number) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a);
  const Cum: Record<string, T.Quaternion> = {};
  // apply model-space delta D to bone n whose parent already carries cumulative delta Cp
  function setBone(n: string, D: T.Quaternion) {
    if (!bone[n]) return;
    const pn = parentOf(n); const Cp = Cum[pn] ?? identity; const Rp = restW[pn] ?? identity;
    const C = D.clone().multiply(Cp); Cum[n] = C;
    // q_local = Rp^-1 * Cp^-1 * C * Rc   with C = D*Cp
    bone[n].quaternion.copy(Rp.clone().invert().multiply(Cp.clone().invert()).multiply(C).multiply(restW[n]));
  }
  function carry(n: string) { const pn = parentOf(n); Cum[n] = (Cum[pn] ?? identity).clone(); bone[n]?.quaternion.copy(restL[n]); }

  // ground glow
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.85, 48), new THREE.MeshBasicMaterial({ color: 0xee4b62, transparent: true, opacity: 0.2 }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.01; root.add(disc);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.83, 0.865, 64), new THREE.MeshBasicMaterial({ color: 0xee4b62, transparent: true, opacity: 0.55 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012; root.add(ring);

  // ---------- pose system ----------
  const J = ['rootY','rootRy','bodyY','torsoX','torsoY','torsoZ','headX','headY','headZ','thL','thR','knL','knR','shLx','shRx','shLz','shRz','elL','elR','fiL','fiR','rootRz'] as const;
  type Pose = Record<(typeof J)[number], number>;
  const zero = (): Pose => Object.fromEntries(J.map((k) => [k, 0])) as Pose;
  const cur = zero();
  let action: Action = 'idle', actionT = 0, until = 0;
  let pointer = { x: 0, y: 0 };
  let runDir = 1;
  let swTheta = 0, swDir = 1;
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
      p.rootY = 0.5 * 4 * u * (1 - u) * (P > 0.2 && P < 0.84 ? 1 : 0);
      p.rootRy = P > 0.2 && P < 0.84 ? u * Math.PI * 2 : 0;
      p.headX = -0.2 * air;
    } else if (a === 'swing') {
      p.shLz = 3.0; p.shRz = -3.0; p.shLx = -0.15; p.shRx = -0.15; p.elL = -0.25; p.elR = -0.25; p.fiL = 1.2; p.fiR = 1.2;
      p.thL = -0.55 + Math.sin(t * 5) * 0.12; p.thR = -0.1 - Math.sin(t * 5) * 0.12; p.knL = 1.0; p.knR = 0.75;
      p.torsoX = -0.08; p.headX = -0.25; p.rootRy = swDir * 1.0; p.rootRz = swTheta * 0.9;
    } else if (a === 'land') {
      const q = clamp(t / 0.38, 0, 1), cr = Math.sin(Math.PI * Math.min(1, q * 1.1));
      p.bodyY = -0.34 * cr; p.thL = -1.0 * cr; p.thR = -1.0 * cr; p.knL = 1.7 * cr; p.knR = 1.7 * cr; p.torsoX = 0.35 * cr; p.shLx = 0.7 * cr; p.shRx = 0.7 * cr;
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
    if (a === 'jump') { setTimeout(() => { const f = feet(); puff(f.x, f.y, 0.6, 8); }, 210); setTimeout(() => { const f = feet(); puff(f.x, f.y, 1, 16); }, 900); }
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
  const cycle: Action[] = ['jump', 'dance'];
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
  let side = 'l', shown = false, pendingId = '';
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target as HTMLElement;
      const id = el.dataset.co!;
      if (id === lastSec) return;
      if (sw) { pendingId = id; return; }
      const first = lastSec === ''; lastSec = id;
      if (id === 'home') { wrap.classList.add('away'); return; }
      const wasAway = wrap.classList.contains('away'); wrap.classList.remove('away');
      if (!matchMedia('(max-width: 768px)').matches) {
        const want = el.classList.contains('right') ? 'r' : el.classList.contains('left') ? 'l' : side;
        if (want !== side) { lastSec = id; startSwing(want); return; }
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
    root.position.y = p.rootY; root.rotation.y = p.rootRy; root.rotation.z = p.rootRz;
    ring.visible = disc.visible = !sw;
    ring.rotation.z = t * 0.5; ring.scale.setScalar(1 + Math.sin(t * 2) * 0.03);
    (disc.material as T.MeshBasicMaterial).opacity = 0.18 + Math.sin(t * 2) * 0.03;
    if (sambaOn) return;                       // the samba clip drives the skeleton
    const hd = pointer.x * 0.5, hu = pointer.y * 0.25;
    for (const k in Cum) delete Cum[k];
    carry('Hips');
    bone.Hips.position.set(hipsRestPos.x, hipsRestPos.y + p.bodyY / hipsUnit, hipsRestPos.z);
    setBone('Spine', Rx(p.torsoX * 0.4).multiply(Ry(p.torsoY * 0.4)).multiply(Rz(p.torsoZ * 0.4)));
    setBone('Spine1', Rx(p.torsoX * 0.3).multiply(Ry(p.torsoY * 0.3)).multiply(Rz(p.torsoZ * 0.3)));
    setBone('Spine2', Rx(p.torsoX * 0.3).multiply(Ry(p.torsoY * 0.3)).multiply(Rz(p.torsoZ * 0.3)));
    carry('Neck'); setBone('Neck', Rx(0)); setBone('Head', Rx(p.headX + hu).multiply(Ry(p.headY + hd)).multiply(Rz(p.headZ)));
    // arms: T-pose -> hanging, then swing / raise (model space: +x is her left, +z is forward)
    (['Left', 'Right'] as const).forEach((sd) => {
      const L = sd === 'Left', sx = L ? p.shLx : p.shRx, sz = L ? p.shLz : p.shRz, el = L ? p.elL : p.elR;
      carry(sd + 'Shoulder');
      const down = L ? Rz(-(Math.PI / 2 - sz)) : Rz(Math.PI / 2 + sz);
      setBone(sd + 'Arm', Rx(sx).multiply(down));
      setBone(sd + 'ForeArm', Rx(el));
      carry(sd + 'Hand'); 
      const th = L ? p.thL : p.thR, kn = L ? p.knL : p.knR;
      setBone(sd + 'UpLeg', Rx(th));
      setBone(sd + 'Leg', Rx(-kn * -1));
      setBone(sd + 'Foot', Rx(0));
    });
  }

  // ---------- smoke + rope overlay ----------
  const fx = document.getElementById('buddy-fx') as HTMLCanvasElement | null;
  const fctx = fx?.getContext('2d') ?? null;
  type Puff = { x: number; y: number; r: number; vr: number; vx: number; vy: number; life: number; age: number; a: number; c: [number, number, number] };
  const puffs: Puff[] = [];
  function fxResize() { if (!fx) return; const d = Math.min(devicePixelRatio, 2); fx.width = innerWidth * d; fx.height = innerHeight * d; fctx?.setTransform(d, 0, 0, d, 0, 0); }
  fxResize(); addEventListener('resize', fxResize);
  function feet() { const r = canvas.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.845 }; }
  function puff(x: number, y: number, size = 1, n = 16) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? 1 : -1, sp = (30 + Math.random() * 150) * size;
      puffs.push({ x: x + (Math.random() - 0.5) * 30 * size, y: y - 4 + Math.random() * 6, r: (10 + Math.random() * 14) * size, vr: (36 + Math.random() * 46) * size,
        vx: dir * sp, vy: -(10 + Math.random() * 46) * size, life: 0.7 + Math.random() * 0.6, age: 0, a: 0.5 + Math.random() * 0.2,
        c: Math.random() < 0.22 ? [255, 160, 178] : [236, 228, 234] });
    }
  }
  type Rope = { ax: number; ay: number; len: number; alpha: number };
  let rope: Rope | null = null, fxDirty = false;
  function drawFx(dt: number) {
    if (!fctx) return;
    if (!puffs.length && !rope) { if (fxDirty) { fctx.clearRect(0, 0, innerWidth, innerHeight); fxDirty = false; } return; }
    fxDirty = true; fctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = puffs.length - 1; i >= 0; i--) {
      const q = puffs[i]; q.age += dt;
      if (q.age >= q.life) { puffs.splice(i, 1); continue; }
      const u = q.age / q.life; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 1 - dt * 2.2; q.vy *= 1 - dt * 1.2; q.r += q.vr * dt * (1 - u * 0.6);
      const al = q.a * (1 - u) * (1 - u), g = fctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);
      g.addColorStop(0, `rgba(${q.c[0]},${q.c[1]},${q.c[2]},${al})`); g.addColorStop(0.6, `rgba(${q.c[0]},${q.c[1]},${q.c[2]},${al * 0.55})`); g.addColorStop(1, `rgba(${q.c[0]},${q.c[1]},${q.c[2]},0)`);
      fctx.fillStyle = g; fctx.beginPath(); fctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); fctx.fill();
    }
    if (rope) {
      const r = canvas.getBoundingClientRect(), hx = r.left + r.width / 2, hy = r.top + r.height * 0.13;
      const ex = rope.ax + (hx - rope.ax) * rope.len, ey = rope.ay + (hy - rope.ay) * rope.len;
      fctx.save(); fctx.globalAlpha = rope.alpha; fctx.lineCap = 'round';
      const sag = (1 - rope.len) * 40;
      fctx.strokeStyle = '#e6d3ae'; fctx.lineWidth = 4; fctx.beginPath(); fctx.moveTo(rope.ax, rope.ay); fctx.quadraticCurveTo((rope.ax + ex) / 2 + sag, (rope.ay + ey) / 2, ex, ey); fctx.stroke();
      fctx.strokeStyle = '#8a6a3a'; fctx.lineWidth = 4; fctx.setLineDash([2, 6]); fctx.stroke(); fctx.setLineDash([]);
      if (rope.ay > -10) { fctx.shadowColor = '#ee4b62'; fctx.shadowBlur = 18; fctx.fillStyle = '#ee4b62'; fctx.beginPath(); fctx.arc(rope.ax, rope.ay, 7, 0, Math.PI * 2); fctx.fill(); }
      fctx.restore();
    }
  }

  // ---------- rope swing between sides ----------
  type Swing = { t0: number; dx: number; dir: number; E: number; th0: number; L: number; newSide: string; ax: number; ay: number; launched: boolean };
  let sw: Swing | null = null;
  const leftPx = (sd: string) => (sd === 'r' ? Math.max(innerWidth - wrap.offsetWidth - 90, innerWidth * 0.58) : 14);
  function startSwing(newSide: string) {
    if (sw) return;
    const x0 = leftPx(side), x1 = leftPx(newSide), dx = Math.abs(x1 - x0), dir = x1 > x0 ? 1 : -1;
    const E = Math.min(200, innerHeight * 0.24), th0 = 2 * Math.atan(E / (dx / 2)), L = dx / 2 / Math.sin(th0);
    const r = canvas.getBoundingClientRect();
    const ax = r.left + r.width / 2 + dir * dx / 2, ay = r.top + r.height * 0.13 - L;
    sw = { t0: performance.now(), dx, dir, E, th0, L, newSide, ax, ay, launched: false };
    swDir = dir; swTheta = -th0; play('swing');
  }
  function swingStep(now: number) {
    if (!sw) return;
    const el = (now - sw.t0) / 1000, A = 0.4, B = 1.4, C = 0.34;
    let xo = 0, yo = 0, len = 1, alpha = 1;
    if (!sw.launched) { sw.launched = true; const f = feet(); puff(f.x, f.y, 0.8, 10); }
    if (el < A) { const u = el / A, e = 1 - Math.pow(1 - u, 3); yo = -sw.E * e; len = Math.min(1, u * 1.7); swTheta = -sw.th0; }
    else if (el < A + B) { const u = (el - A) / B; swTheta = -sw.th0 * Math.cos(Math.PI * u); xo = sw.dir * (sw.dx / 2 + sw.L * Math.sin(swTheta)); yo = -sw.L * (1 - Math.cos(swTheta)); }
    else if (el < A + B + C) { const u = (el - A - B) / C; swTheta = sw.th0 * (1 - u); xo = sw.dir * sw.dx; yo = -sw.E * (1 - u * u); alpha = 1 - u; }
    else {
      wrap.dataset.side = sw.newSide; side = sw.newSide; wrap.style.translate = ''; rope = null;
      const f = feet(); puff(f.x, f.y, 1.5, 24); sw = null; swTheta = 0;
      play(pendingId === 'contact' ? 'dance' : 'land', pendingId === 'contact' ? 9000 : 380); pendingId = '';
      return;
    }
    wrap.style.translate = `${xo.toFixed(1)}px ${yo.toFixed(1)}px`;
    rope = { ax: sw.ax, ay: sw.ay, len, alpha };
  }

  let clock = 0, blinkAt = 2;
  function frame(now: number) {
    if (!visible) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt; actionT += dt;
    swingStep(now);
    if (action === 'run' && !until && now - lastScroll > 700) play('idle');
    if (until && now > until) { until = 0; play('idle'); }
    const tg = target(action, actionT);
    const k = action === 'jump' || action === 'land' ? 1 - Math.exp(-dt * 40) : 1 - Math.exp(-dt * 14);
    (J as readonly (keyof Pose)[]).forEach((j) => { cur[j] += (tg[j] - cur[j]) * (j === 'rootRy' && action === 'jump' ? 1 : k); });
    // blink
    const wantSamba = action === 'dance';
    if (wantSamba && !sambaOn) { sambaOn = true; samba.reset().fadeIn(0.35).play(); }
    if (!wantSamba && sambaOn) { sambaOn = false; samba.fadeOut(0.2); setTimeout(() => samba.stop(), 220); }
    if (sambaOn || samba.isRunning()) mixer.update(dt);
    apply(cur, clock);
    renderer.render(scene, camera);
    drawFx(dt);
    requestAnimationFrame(frame);
  }

  wrap.classList.add('ready');
  if (reduce) { apply(target('idle', 0), 0); renderer.render(scene, camera); return; }
  requestAnimationFrame((n) => { last = n; frame(n); });
  (window as any).__buddy = { play };
}
