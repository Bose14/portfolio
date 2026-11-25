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

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 1.5, 6.9);
  camera.lookAt(0, 1.5, 0);

  // lights: warm key, crimson rim from behind, soft fill
  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a1018, 1.1));
  const key = new THREE.DirectionalLight(0xfff1e6, 2.1); key.position.set(2.5, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xee4b62, 2.6); rim.position.set(-3, 2.5, -3.5); scene.add(rim);

  // 3-step toon ramp
  const ramp = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  const toon = (c: number) => new THREE.MeshToonMaterial({ color: c, gradientMap: ramp });
  const ink = new THREE.MeshBasicMaterial({ color: 0x07070a, side: THREE.BackSide });
  const M = {
    skin: toon(0xa86a42), jacket: toon(0x2b2b36), shirt: toon(0xf4f1ec), tie: toon(0x101015),
    hair: toon(0x0f0f14), pants: toon(0x20202a), shoe: toon(0x0a0a0d), red: toon(0xee4b62),
    white: new THREE.MeshBasicMaterial({ color: 0xffffff }), dark: new THREE.MeshBasicMaterial({ color: 0x120a07 }),
    lip: new THREE.MeshBasicMaterial({ color: 0x4a1d14 }),
  };
  function mk(geo: T.BufferGeometry, mat: T.Material, outline = 1.07): T.Mesh {
    const m = new THREE.Mesh(geo, mat);
    if (outline) { const o = new THREE.Mesh(geo, ink); o.scale.setScalar(outline); m.add(o); }
    return m;
  }
  const grp = (x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
  const cap = (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 6, 14);

  // ---------- build ----------
  const root = grp(); scene.add(root);
  const hips = grp(0, 1.06, 0); root.add(hips);
  const pelvis = mk(new THREE.SphereGeometry(0.24, 18, 14), M.pants); pelvis.scale.set(1, .7, .8); hips.add(pelvis);

  function leg(side: number) {
    const thigh = grp(side * 0.15, -0.04, 0); hips.add(thigh);
    const t = mk(cap(0.1, 0.34), M.pants); t.position.y = -0.27; thigh.add(t);
    const knee = grp(0, -0.52, 0); thigh.add(knee);
    const s = mk(cap(0.085, 0.34), M.pants); s.position.y = -0.25; knee.add(s);
    const foot = mk(new THREE.BoxGeometry(0.2, 0.11, 0.36), M.shoe, 1.1); foot.position.set(0, -0.5, 0.07); knee.add(foot);
    return { thigh, knee };
  }
  const legL = leg(1), legR = leg(-1);

  const torso = grp(0, 0.06, 0); hips.add(torso);
  const chest = mk(cap(0.27, 0.34), M.jacket); chest.position.y = 0.34; chest.scale.set(1, 1, 0.72); torso.add(chest);
  const shirt = mk(new THREE.BoxGeometry(0.2, 0.5, 0.03), M.shirt, 0); shirt.position.set(0, 0.36, 0.2); torso.add(shirt);
  const tie = mk(new THREE.BoxGeometry(0.07, 0.38, 0.03), M.tie, 0); tie.position.set(0, 0.33, 0.22); torso.add(tie);
  const knot = mk(new THREE.BoxGeometry(0.09, 0.07, 0.035), M.tie, 0); knot.position.set(0, 0.55, 0.222); torso.add(knot);
  const pocket = mk(new THREE.BoxGeometry(0.08, 0.05, 0.02), M.red, 0); pocket.position.set(0.17, 0.42, 0.2); pocket.rotation.z = 0.15; torso.add(pocket);
  const lapelL = mk(new THREE.BoxGeometry(0.06, 0.36, 0.02), M.jacket, 0); lapelL.position.set(0.1, 0.4, 0.2); lapelL.rotation.z = -0.28; torso.add(lapelL);
  const lapelR = lapelL.clone(); lapelR.position.x = -0.1; lapelR.rotation.z = 0.28; torso.add(lapelR);

  function arm(side: number) {
    const sh = grp(side * 0.34, 0.58, 0); torso.add(sh);
    const ball = mk(new THREE.SphereGeometry(0.1, 14, 12), M.jacket); sh.add(ball);
    const u = mk(cap(0.075, 0.24), M.jacket); u.position.y = -0.2; sh.add(u);
    const el = grp(0, -0.38, 0); sh.add(el);
    const f = mk(cap(0.068, 0.22), M.jacket); f.position.y = -0.17; el.add(f);
    const cuff = mk(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 14), M.shirt, 0); cuff.position.y = -0.33; el.add(cuff);
    const hand = mk(new THREE.SphereGeometry(0.075, 14, 12), M.skin); hand.position.y = -0.4; el.add(hand);
    return { sh, el };
  }
  const armL = arm(1), armR = arm(-1);

  const neck = mk(new THREE.CylinderGeometry(0.07, 0.08, 0.14, 12), M.skin, 1.1); neck.position.y = 0.7; torso.add(neck);
  const head = grp(0, 0.78, 0); torso.add(head);
  const skull = mk(new THREE.SphereGeometry(0.24, 28, 22), M.skin, 1.05); skull.position.y = 0.24; skull.scale.set(0.96, 1.08, 0.98); head.add(skull);
  [1, -1].forEach((s) => { const ear = mk(new THREE.SphereGeometry(0.05, 10, 8), M.skin, 1.1); ear.position.set(s * 0.23, 0.22, 0); ear.scale.set(0.6, 1, 0.8); head.add(ear); });
  // curly hair: a crown of spheres
  const curls: [number, number, number, number][] = [
    [0, 0.5, 0, .15], [.13, .49, .02, .13], [-.13, .49, .02, .13], [.07, .46, .17, .12], [-.07, .46, .17, .12], [.18, .4, .12, .11], [-.18, .4, .12, .11],
    [.0, .47, .15, .11], [.22, .34, -.02, .12], [-.22, .34, -.02, .12], [.1, .48, -.12, .14], [-.1, .48, -.12, .14], [0, .4, -.2, .15], [.17, .43, -.1, .13], [-.17, .43, -.1, .13],
    [.23, .24, -.1, .09], [-.23, .24, -.1, .09], [.0, .28, -.24, .12],
  ];
  curls.forEach(([x, y, z, r]) => { const c = mk(new THREE.SphereGeometry(r, 12, 10), M.hair, 1.1); c.position.set(x, y, z); head.add(c); });
  const eyeL = grp(.085, .27, .2), eyeR = grp(-.085, .27, .2);
  [eyeL, eyeR].forEach((e) => {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), M.white); w.scale.z = .5; e.add(w);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), M.dark); p.position.z = 0.02; e.add(p); head.add(e);
  });
  [1, -1].forEach((s) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.022, 0.02), M.hair); b.position.set(s * .085, .335, .215); b.rotation.z = -s * 0.12; head.add(b); });
  const nose = mk(new THREE.SphereGeometry(0.03, 10, 8), M.skin, 1.1); nose.position.set(0, .2, .235); head.add(nose);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 20, Math.PI), M.lip); smile.position.set(0, .15, .222); smile.rotation.z = Math.PI; head.add(smile);
  const teeth = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16, Math.PI, Math.PI), M.white); teeth.position.set(0, .152, .219); head.add(teeth);
  const beard = new THREE.Mesh(new THREE.SphereGeometry(0.235, 20, 14, 0, Math.PI * 2, 1.9, 0.9), toon(0x2a1a12)); beard.position.y = 0.24; beard.scale.set(.97, 1.09, .99); head.add(beard);

  // ground glow + shadow
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.9, 40), new THREE.MeshBasicMaterial({ color: 0xee4b62, transparent: true, opacity: 0.22 }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.01; root.add(disc);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.88, 0.92, 48), new THREE.MeshBasicMaterial({ color: 0xee4b62, transparent: true, opacity: 0.6 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012; root.add(ring);

  // ---------- pose system ----------
  const J = ['rootY','rootRy','bodyY','torsoX','torsoY','torsoZ','headX','headY','headZ','thL','thR','knL','knR','shLx','shRx','shLz','shRz','elL','elR'] as const;
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
    p.shLz = 0.14; p.shRz = -0.14; p.elL = -0.12; p.elR = -0.12;
    if (a === 'idle') {
      p.torsoY = s(t * 0.7) * 0.06; p.shLx = s(t * 1.1) * 0.05; p.shRx = -s(t * 1.1) * 0.05;
    } else if (a === 'run') {
      const w = t * 12, S = s(w), C = c(w);
      p.rootRy = 1.0 * runDir; p.torsoX = 0.22; p.torsoY = S * 0.28; p.rootY = Math.abs(C) * 0.1;
      p.thL = -S * 1.0; p.thR = S * 1.0;
      p.knL = 0.25 + 0.95 * Math.max(0, C); p.knR = 0.25 + 0.95 * Math.max(0, -C);
      p.shLx = S * 1.1; p.shRx = -S * 1.1; p.elL = -1.25; p.elR = -1.25; p.shLz = 0.1; p.shRz = -0.1;
      p.headX = -0.15;
    } else if (a === 'jump') {
      const P = clamp(t / 1.05, 0, 1);
      const u = clamp((P - 0.2) / 0.64, 0, 1);
      const air = P > 0.2 && P < 0.84 ? s(Math.PI * u) : 0;
      const cr = P < 0.2 ? P / 0.2 : P > 0.84 ? 1 - (P - 0.84) / 0.16 : 0;
      p.bodyY = -0.34 * cr; p.thL = -1.0 * cr - 0.9 * air; p.thR = -1.0 * cr - 0.35 * air; p.knL = 1.7 * cr + 1.2 * air; p.knR = 1.7 * cr + 0.9 * air;
      p.torsoX = 0.35 * cr; p.shLx = 0.6 * cr; p.shRx = 0.6 * cr;
      p.shLz = 0.14 + 2.7 * air; p.shRz = -0.14 - 2.7 * air; p.elL = -0.4 * air; p.elR = -0.4 * air;
      p.rootY = 1.15 * 4 * u * (1 - u) * (P > 0.2 && P < 0.84 ? 1 : 0);
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
      p.shRz = -2.5 - 0.05; p.elR = -0.2 + s(t * 10) * 0.55; p.shRx = 0; p.torsoZ = 0.05; p.headZ = 0.08; p.rootRy = 0.15;
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
    hips.position.y = 1.06 + p.bodyY;
    torso.rotation.set(p.torsoX, p.torsoY, p.torsoZ);
    torso.scale.set(1, 1 + Math.sin(t * 1.8) * 0.008, 1);
    head.rotation.set(p.headX + pointer.y * 0.25, p.headY + pointer.x * 0.55, p.headZ);
    legL.thigh.rotation.x = p.thL; legR.thigh.rotation.x = p.thR; legL.knee.rotation.x = p.knL; legR.knee.rotation.x = p.knR;
    armL.sh.rotation.set(p.shLx, 0, p.shLz); armR.sh.rotation.set(p.shRx, 0, p.shRz);
    armL.el.rotation.x = p.elL; armR.el.rotation.x = p.elR;
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
