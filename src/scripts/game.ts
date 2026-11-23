// Bonus level: "Debug Run", an endless runner on canvas.
import { sfx } from './audio';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
const wrap = document.getElementById('game-wrap');
const msg = document.getElementById('g-msg') as HTMLElement | null;
if (canvas && wrap && msg) init(canvas, wrap, msg);

function init(canvas: HTMLCanvasElement, wrap: HTMLElement, msg: HTMLElement) {
  const ctx = canvas.getContext('2d')!;
  const W = 1000, H = 340, GY = 280;
  const scoreEl = document.getElementById('g-score')!;
  const bestEl = document.getElementById('g-best')!;
  const title = document.getElementById('g-title')!;
  const sub = document.getElementById('g-sub')!;
  const btn = document.getElementById('g-btn')!;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let best = 0;
  try { best = Number(localStorage.getItem('debug-run-best') || 0); } catch { /* ignore */ }
  bestEl.textContent = String(best);

  type Ob = { x: number; w: number; h: number; kind: 'bug' | 'outage'; };
  type Coin = { x: number; y: number; got: boolean };
  let state: 'idle' | 'play' | 'over' = 'idle';
  let visible = false;
  let px = 130, py = GY, vy = 0, onGround = true, t = 0, speed = 380, dist = 0, coinsGot = 0, spawnIn = 1;
  let obs: Ob[] = [], coins: Coin[] = [];
  const stars = Array.from({ length: 50 }, (_, i) => ({ x: (i * 197) % W, y: (i * 61) % 170, s: 1 + (i % 3) * 0.6 }));
  const city = Array.from({ length: 24 }, (_, i) => ({ x: i * 62, w: 40 + ((i * 37) % 30), h: 50 + ((i * 53) % 90) }));

  function resize() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = wrap.clientWidth;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round((w * H / W) * dpr);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  function reset() {
    px = 130; py = GY; vy = 0; onGround = true; speed = 380; dist = 0; coinsGot = 0; spawnIn = 0.8; obs = []; coins = [];
  }
  function start() {
    reset(); state = 'play'; msg.hidden = true;
  }
  function jump() {
    if (state !== 'play') { start(); return; }
    if (onGround) { vy = -860; onGround = false; sfx.jump(); }
  }
  function over() {
    state = 'over';
    const score = Math.floor(dist / 10) + coinsGot * 10;
    if (score > best) { best = score; bestEl.textContent = String(best); try { localStorage.setItem('debug-run-best', String(best)); } catch { /* ignore */ } }
    title.textContent = score >= best && score > 0 ? `New best: ${score}` : `Crashed: ${score}`;
    sub.textContent = 'Production is down. Press Space or tap to retry.';
    btn.textContent = 'Retry';
    msg.hidden = false;
    sfx.over();
  }

  addEventListener('keydown', (e) => {
    if (!visible) return;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      const tg = e.target as HTMLElement;
      if (tg.closest('input, textarea')) return;
      if (tg.closest('button') && state === 'play') { /* allow */ }
      e.preventDefault(); jump();
    }
  });
  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });
  btn.addEventListener('click', () => start());
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.4 }).observe(wrap);

  function spawn() {
    const kind: Ob['kind'] = Math.random() < 0.28 ? 'outage' : 'bug';
    const o: Ob = kind === 'bug' ? { x: W + 40, w: 40, h: 30, kind } : { x: W + 40, w: 26, h: 58, kind };
    obs.push(o);
    if (Math.random() < 0.7) {
      for (let i = 0; i < 4; i++) {
        const k = i / 3;
        coins.push({ x: o.x - 70 + k * 190, y: GY - 60 - Math.sin(k * Math.PI) * 96, got: false });
      }
    }
  }

  function update(dt: number) {
    t += dt;
    if (state !== 'play') return;
    speed = Math.min(900, speed + dt * 14);
    dist += speed * dt;
    vy += 2500 * dt;
    py += vy * dt;
    if (py >= GY) { py = GY; vy = 0; onGround = true; }
    spawnIn -= dt;
    if (spawnIn <= 0) { spawn(); spawnIn = (0.75 + Math.random() * 0.9) * (380 / speed) * 1.25 + 0.35; }
    for (const o of obs) o.x -= speed * dt;
    for (const c of coins) c.x -= speed * dt;
    obs = obs.filter((o) => o.x > -80);
    coins = coins.filter((c) => c.x > -40);
    const hit = { l: px - 12, r: px + 12, t: py - 60, b: py };
    for (const o of obs) {
      if (hit.r > o.x + 4 && hit.l < o.x + o.w - 4 && hit.b > GY - o.h + 4) { over(); return; }
    }
    for (const c of coins) {
      if (!c.got && Math.abs(c.x - px) < 24 && Math.abs(c.y - (py - 30)) < 40) { c.got = true; coinsGot++; sfx.coin(); }
    }
    scoreEl.textContent = String(Math.floor(dist / 10) + coinsGot * 10);
  }

  function drawRunner() {
    const run = state === 'play' && onGround;
    const ph = t * 16;
    const leg = (a: number, back: boolean) => {
      ctx.strokeStyle = back ? '#1e2433' : '#2a3042';
      ctx.lineWidth = 9; ctx.lineCap = 'round';
      const hx = px, hy = py - 24;
      const kx = hx + Math.sin(a) * 14, ky = hy + Math.cos(a) * 14;
      const fx = kx + Math.sin(a * 0.4 - 0.25) * 14, fy = ky + Math.cos(a * 0.4 - 0.25) * 14;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.fillStyle = back ? '#b8c0d6' : '#e9edf5';
      ctx.fillRect(fx - 4, fy - 1, 13, 5);
    };
    const air = !onGround;
    leg(air ? -0.9 : run ? Math.sin(ph) * 0.9 : 0.05, true);
    leg(air ? 0.3 : run ? -Math.sin(ph) * 0.9 : -0.05, false);
    // pack + torso
    ctx.fillStyle = '#2a3042'; ctx.fillRect(px - 20, py - 58, 10, 28);
    ctx.fillStyle = '#6f7fe8'; roundRect(px - 13, py - 62, 26, 40, 9); ctx.fill();
    // arm
    ctx.strokeStyle = '#6f7fe8'; ctx.lineWidth = 8;
    const aa = air ? -2.2 : run ? Math.sin(ph) * 0.9 : 0.1;
    ctx.beginPath(); ctx.moveTo(px, py - 54); ctx.lineTo(px + Math.sin(aa) * 16, py - 54 + Math.cos(aa) * 16); ctx.stroke();
    // head
    ctx.fillStyle = '#e2a982'; ctx.beginPath(); ctx.arc(px + 3, py - 76, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1b1f2a'; ctx.beginPath(); ctx.arc(px, py - 80, 13, Math.PI, Math.PI * 2.05); ctx.fill();
    ctx.strokeStyle = '#e9edf5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px + 9, py - 76, 5, 0, Math.PI * 2); ctx.stroke();
  }

  function roundRect(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#05070b'); g.addColorStop(0.7, '#111a33'); g.addColorStop(1, '#1b2447');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const off = state === 'play' ? dist : t * 60;
    ctx.fillStyle = '#fff';
    for (const s of stars) { ctx.globalAlpha = 0.3 + 0.4 * Math.abs(Math.sin(t + s.x)); ctx.fillRect(((s.x - off * 0.03) % W + W) % W, s.y, s.s, s.s); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0d1426';
    for (const c of city) { const cx = ((c.x - off * 0.1) % (24 * 62) + 24 * 62) % (24 * 62) - 62; ctx.fillRect(cx, GY - c.h * 1.4, c.w, c.h * 1.4); }
    ctx.fillStyle = '#0a0d14'; ctx.fillRect(0, GY, W, H - GY);
    ctx.fillStyle = '#8b9dff'; ctx.globalAlpha = 0.6; ctx.fillRect(0, GY, W, 2); ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff22';
    for (let i = 0; i < 12; i++) ctx.fillRect(((i * 120 - off) % (W + 120) + W + 120) % (W + 120) - 60, GY + 26, 60, 3);

    for (const c of coins) if (!c.got) {
      ctx.fillStyle = '#ffd36e'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 8 * Math.abs(Math.cos(t * 4 + c.x * 0.02)) + 2, 9, 0, 0, Math.PI * 2); ctx.fill();
    }
    for (const o of obs) {
      if (o.kind === 'bug') {
        ctx.strokeStyle = '#ff6b81'; ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) { const lx = o.x + 8 + i * 8; ctx.beginPath(); ctx.moveTo(lx, GY - 10); ctx.lineTo(lx + (i % 2 ? 5 : -5), GY); ctx.stroke(); }
        ctx.fillStyle = '#ff6b81'; ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, GY - 15, o.w / 2, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(o.x + 10, GY - 22, 6, 6); ctx.fillRect(o.x + 24, GY - 22, 6, 6);
        ctx.fillStyle = '#111'; ctx.fillRect(o.x + 13, GY - 20, 3, 3); ctx.fillRect(o.x + 27, GY - 20, 3, 3);
      } else {
        ctx.fillStyle = '#ff6b81'; ctx.fillRect(o.x, GY - o.h, o.w, o.h);
        ctx.fillStyle = '#05070b'; ctx.font = 'bold 12px monospace'; ctx.fillText('500', o.x - 1, GY - o.h / 2 + 4);
      }
    }
    drawRunner();
  }

  let last = performance.now();
  function loop(now: number) {
    const dt = Math.min(0.04, (now - last) / 1000);
    last = now;
    if (visible || state === 'idle') { update(dt); draw(); }
    requestAnimationFrame(loop);
  }
  if (reduce) { sub.textContent = 'Press Space or tap to start'; }
  requestAnimationFrame(loop);
}
