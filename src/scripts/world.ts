// The side-scrolling world. Page scroll drives a sticky stage: the track moves, layers parallax,
// Bo runs/jumps/waves, coins and skills are collected, bugs get squashed and levels announce themselves.
import { Rig } from './rig';
import { sfx } from './audio';

type Level = { id: string; nav: string; kicker: string; title: string; say: string };
type Item = { el: HTMLElement; x: number; done: boolean };

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const dataEl = document.getElementById('game-data');
const world = document.getElementById('world');
if (dataEl && world) init(JSON.parse(dataEl.textContent || '{}'), world);

function init(data: { levels: Level[]; skillCount: number }, world: HTMLElement) {
  const levels = data.levels;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const track = $('track'), far = $('far'), mid = $('mid'), sky = $('sky'), fore = $('fore'), ground = $('ground');
  const player = $('player'), bubble = $('bubble'), bubbleT = $('bubble-t');
  const banner = $('banner'), banK = $('ban-k'), banT = $('ban-t'), toast = $('toast');
  const hudName = $('hud-name'), hudSub = $('hud-sub'), hudBar = $('hud-bar'), hudXp = $('hud-xp'), hudSk = $('hud-sk');

  // ---------- HUD (works in both live and static modes) ----------
  const menuBtn = $('menu-btn'), menu = $('hud-menu'), snd = $('snd');
  menuBtn.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !(e.target as HTMLElement).closest('.hud-menu, #menu-btn')) { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); }
  });
  snd.addEventListener('click', () => {
    const on = sfx.toggle();
    snd.textContent = on ? 'Sound on' : 'Sound off';
    snd.setAttribute('aria-pressed', String(on));
  });
  document.addEventListener('pointermove', (e) => {
    const s = document.getElementById('spot');
    if (s) { s.style.setProperty('--mx', `${e.clientX}px`); s.style.setProperty('--my', `${e.clientY}px`); }
  }, { passive: true });

  let live = false;
  let jumpTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); };
  document.querySelectorAll<HTMLElement>('[data-jump]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      menu.hidden = true;
      jumpTo(a.dataset.jump!);
    })
  );

  if (reduce) {
    hudName.textContent = 'Portfolio';
    hudSub.textContent = '';
    return; // static, readable layout; no scroll hijacking
  }

  live = true;
  world.classList.add('live');

  // ---------- state ----------
  const rig = new Rig(player.querySelector('svg') as unknown as SVGElement);
  let vw = innerWidth, vh = innerHeight, maxX = 1, dist = 1, wrapTop = 0;
  let charCX = 0;
  let panels: { id: string; left: number; right: number; el: HTMLElement }[] = [];
  let coins: Item[] = [], bugs: Item[] = [], tokens: Item[] = [];
  let dust: { el: HTMLElement; base: number; speed: number; y: number }[] = [];
  let p = 0, x = 0, lastX = 0, vel = 0, dir = 1;
  let xp = 0, skills = 0;
  let current = -1;
  let introT = -1;
  let introDone = false;
  let celebrated = false;
  let bubbleTimer = 0, bannerTimer = 0, toastTimer = 0;
  const keys = { left: false, right: false };

  // ---------- scenery ----------
  function rng(seed: number) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

  function buildStars() {
    sky.querySelectorAll('.star').forEach((s) => s.remove());
    const r = rng(7);
    for (let i = 0; i < 90; i++) {
      const s = document.createElement('i');
      s.className = 'star';
      s.style.left = `${r() * 100}%`;
      s.style.top = `${r() * 58}%`;
      s.style.animationDelay = `${r() * 3}s`;
      s.style.opacity = String(0.25 + r() * 0.6);
      if (r() > 0.85) { s.style.width = s.style.height = '3px'; }
      sky.appendChild(s);
    }
  }

  function skyline(layer: HTMLElement, width: number, seed: number, fill: string, win: string, hFrac: number, minW: number, maxW: number) {
    layer.querySelectorAll('svg').forEach((s) => s.remove());
    const r = rng(seed);
    const H = Math.round(vh * hFrac);
    let svg = `<svg class="skyline" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
    let bx = -20;
    while (bx < width) {
      const w = minW + r() * (maxW - minW);
      const h = H * (0.25 + r() * 0.75);
      svg += `<rect x="${bx.toFixed(0)}" y="${(H - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${fill}"/>`;
      if (r() > 0.7) svg += `<rect x="${(bx + w * 0.45).toFixed(0)}" y="${(H - h - 18).toFixed(0)}" width="3" height="18" fill="${fill}"/>`;
      // lit windows
      const cols = Math.floor(w / 14), rows = Math.floor(h / 18);
      for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
        if (r() > 0.86) svg += `<rect x="${(bx + 5 + cx * 14).toFixed(0)}" y="${(H - h + 8 + cy * 18).toFixed(0)}" width="5" height="7" fill="${win}" opacity="${(0.25 + r() * 0.55).toFixed(2)}"/>`;
      }
      bx += w + r() * 6;
    }
    layer.insertAdjacentHTML('beforeend', svg + '</svg>');
  }

  function populate() {
    // clear generated items
    track.querySelectorAll('.coin, .bug, .lamp').forEach((e) => e.remove());
    coins = []; bugs = []; tokens = [];
    const trackW = track.offsetWidth;
    const r = rng(42);
    const mobile = vw <= 768;
    const pad = vw * 0.78;
    // lamps
    for (let lx = vw * 0.5; lx < trackW; lx += vw * (mobile ? 0.9 : 0.42)) {
      const l = document.createElement('i');
      l.className = 'lamp';
      l.style.left = `${lx}px`;
      l.style.bottom = 'var(--ground)';
      track.appendChild(l);
    }
    // bugs with coin arcs
    const gap = vw * (mobile ? 0.8 : 0.4);
    let bxp = pad;
    let n = 0;
    while (bxp < trackW - vw * 0.9) {
      const bx = bxp + (r() - 0.5) * gap * 0.25;
      const b = document.createElement('div');
      b.className = 'bug';
      b.style.left = `${bx}px`;
      b.style.bottom = 'calc(var(--ground) + 1px)';
      b.innerHTML = `<svg viewBox="0 0 46 34"><g class="legs" stroke="#ff6b81" stroke-width="2.4" stroke-linecap="round"><path d="M10 24 L2 32 M18 26 L14 34 M28 26 L32 34 M36 24 L44 32"/></g><ellipse cx="23" cy="18" rx="17" ry="12" fill="#ff6b81"/><path d="M23 6 V30" stroke="#b83a52" stroke-width="2"/><circle cx="17" cy="14" r="3" fill="#fff"/><circle cx="29" cy="14" r="3" fill="#fff"/><circle cx="17.8" cy="14.5" r="1.4" fill="#111"/><circle cx="29.8" cy="14.5" r="1.4" fill="#111"/><path d="M14 6 L10 0 M32 6 L36 0" stroke="#ff6b81" stroke-width="2" stroke-linecap="round"/></svg><span class="fixmark">bug fixed ✓</span>`;
      track.appendChild(b);
      bugs.push({ el: b, x: bx + 23, done: false });
      // coin arc around it
      for (let i = 0; i < 5; i++) {
        const t = i / 4;
        const cxp = bx - 90 + t * 226;
        const h = 36 + Math.sin(t * Math.PI) * 78;
        const c = document.createElement('i');
        c.className = 'coin';
        c.style.left = `${cxp}px`;
        c.style.bottom = `calc(var(--ground) + ${h}px)`;
        track.appendChild(c);
        coins.push({ el: c, x: cxp + 11, done: false });
      }
      // extra ground coins between bugs
      for (let i = 1; i <= 3; i++) {
        const cxp = bx + gap * 0.5 + i * 46 - 60;
        if (cxp > trackW - vw) break;
        const c = document.createElement('i');
        c.className = 'coin';
        c.style.left = `${cxp}px`;
        c.style.bottom = 'calc(var(--ground) + 22px)';
        track.appendChild(c);
        coins.push({ el: c, x: cxp + 11, done: false });
      }
      bxp += gap + r() * gap * 0.3;
      n++;
    }
    // tokens
    track.querySelectorAll<HTMLElement>('[data-token]').forEach((el) => {
      const pn = el.closest<HTMLElement>('.panel')!;
      tokens.push({ el, x: pn.offsetLeft + el.offsetLeft + el.offsetWidth / 2, done: el.classList.contains('got') });
    });
    // dust (foreground parallax)
    fore.innerHTML = '';
    dust = [];
    for (let i = 0; i < 26; i++) {
      const el = document.createElement('i');
      el.className = 'dust';
      const s = 3 + r() * 7;
      el.style.width = el.style.height = `${s}px`;
      el.style.animationDelay = `${r() * 4}s`;
      fore.appendChild(el);
      dust.push({ el, base: r() * vw * 1.6, speed: 0.7 + r() * 1.3, y: r() * vh * 0.8 });
    }
  }

  function measure() {
    vw = innerWidth; vh = innerHeight;
    // fit panels to their content
    const cxPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cx')) || 0;
    const cx = getComputedStyle(player).left ? cxFromVar() : cxPx;
    function cxFromVar() {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--cx)';
      document.body.appendChild(probe);
      const w = probe.offsetWidth;
      probe.remove();
      return w;
    }
    world.querySelectorAll<HTMLElement>('.panel[data-fit]').forEach((pn) => {
      const inner = pn.querySelector<HTMLElement>('.panel-in')!;
      pn.style.width = pn.dataset.fit === 'screen' ? `${vw}px` : `${Math.round(cx + inner.offsetWidth + vw * 0.28)}px`;
    });
    const trackW = Array.from(track.querySelectorAll<HTMLElement>(':scope > .panel')).reduce((s, c) => s + c.offsetWidth, 0);
    track.style.width = `${trackW}px`;
    maxX = Math.max(1, trackW - vw);
    dist = maxX * 0.8;
    world.style.height = `${vh + dist}px`;
    wrapTop = world.getBoundingClientRect().top + scrollY;
    charCX = player.offsetLeft + player.offsetWidth / 2;
    rig.setJumpHeight(Math.max(90, vh * 0.16));

    sky.style.width = `${vw + maxX * 0.03}px`;
    far.style.width = `${vw + maxX * 0.07 + 80}px`;
    mid.style.width = `${vw + maxX * 0.2 + 80}px`;
    skyline(far, Math.ceil(vw + maxX * 0.07 + 80), 11, '#0d1426', '#8b9dff', 0.5, 40, 90);
    skyline(mid, Math.ceil(vw + maxX * 0.2 + 80), 23, '#111a30', '#ffd36e', 0.34, 34, 78);

    panels = Array.from(track.querySelectorAll<HTMLElement>('.panel')).map((el) => ({
      id: el.dataset.level || el.id, left: el.offsetLeft, right: el.offsetLeft + el.offsetWidth, el,
    }));
    populate();
  }

  // ---------- UI helpers ----------
  function say(text: string, ms = innerWidth <= 768 ? 4500 : 7500) {
    bubbleT.textContent = text;
    bubble.classList.add('show');
    window.clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(() => bubble.classList.remove('show'), ms);
  }
  function showBanner(k: string, t: string) {
    banK.textContent = k; banT.textContent = t;
    banner.classList.add('show');
    window.clearTimeout(bannerTimer);
    bannerTimer = window.setTimeout(() => banner.classList.remove('show'), 1900);
  }
  function showToast(t: string) {
    toast.textContent = t;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1600);
  }
  function addXp(n: number) {
    xp += n;
    hudXp.textContent = String(xp);
    const xpBox = hudXp.parentElement!;
    xpBox.classList.remove('pulse'); void xpBox.offsetWidth; xpBox.classList.add('pulse');
  }
  function confetti() {
    const colors = ['#8b9dff', '#ffd36e', '#6ee7a8', '#ff6b81', '#e9edf5'];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = `${Math.random() * 100}vw`;
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = `${2.4 + Math.random() * 2}s`;
      c.style.animationDelay = `${Math.random() * 0.6}s`;
      document.body.appendChild(c);
      window.setTimeout(() => c.remove(), 5200);
    }
  }
  function setLevel(i: number) {
    current = i;
    const l = levels[i];
    hudName.textContent = l.kicker;
    hudSub.textContent = l.title;
    if (introDone) {
      if (i > 0) showBanner(l.kicker, l.title);
      say(l.say);
      rig.wave(1.8);
      sfx.level();
    }
  }

  const active = () => scrollY > wrapTop - vh * 0.5 && scrollY < wrapTop + dist + vh * 0.6;

  // ---------- navigation ----------
  jumpTo = (id: string) => {
    if (id === 'play') { document.getElementById('play')?.scrollIntoView({ behavior: 'smooth' }); return; }
    const pn = panels.find((q) => q.id === id);
    if (!pn) return;
    const target = clamp(pn.left, 0, maxX);
    scrollTo({ top: wrapTop + (target / maxX) * dist, behavior: 'smooth' });
  };

  // ---------- input ----------
  const typing = (t: EventTarget | null) => !!(t as HTMLElement)?.closest?.('input, textarea, button, a, [contenteditable]');
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { if (!typing(e.target) && active()) { keys.right = true; e.preventDefault(); } }
    else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { if (!typing(e.target) && active()) { keys.left = true; e.preventDefault(); } }
    else if (e.key === ' ' && active() && !typing(e.target)) { e.preventDefault(); if (introDone && rig.jump()) sfx.jump(); }
  });
  addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  });
  player.addEventListener('click', () => {
    if (rig.jump()) sfx.jump();
    rig.wave(1.6);
    say(levels[Math.max(0, current)].say);
  });
  player.addEventListener('keydown', (e) => { if (e.key === 'Enter') player.click(); });

  // ---------- main loop ----------
  let last = performance.now();
  function tick(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000) || 0.016;
    last = now;

    if (keys.right !== keys.left && active()) scrollBy({ top: (keys.right ? 1 : -1) * 1300 * dt, behavior: 'instant' });

    const target = clamp((scrollY - wrapTop) / dist, 0, 1);
    p += (target - p) * (1 - Math.exp(-dt * 8));
    if (Math.abs(target - p) < 0.00005) p = target;
    x = p * maxX;
    const raw = (x - lastX) / dt;
    lastX = x;
    vel += (raw - vel) * 0.25;
    if (Math.abs(vel) > 40) dir = vel > 0 ? 1 : -1;

    // parallax
    track.style.transform = `translate3d(${-x}px,0,0)`;
    far.style.transform = `translate3d(${-x * 0.07}px,0,0)`;
    mid.style.transform = `translate3d(${-x * 0.2}px,0,0)`;
    sky.style.transform = `translate3d(${-x * 0.03}px,0,0)`;
    ground.style.setProperty('--gx', `${-x}px`);
    for (const d of dust) {
      const sx = ((d.base - x * d.speed) % (vw * 1.6) + vw * 1.6) % (vw * 1.6) - vw * 0.3;
      d.el.style.transform = `translate3d(${sx}px,${d.y}px,0)`;
    }

    // character
    let speed = Math.abs(vel) > 70 ? clamp(Math.abs(vel) / 1500, 0.05, 1) : 0;
    let ix = 0;
    if (introT >= 0) {
      introT += dt;
      const k = clamp(introT / 1.7, 0, 1);
      ix = -(1 - (1 - Math.pow(1 - k, 3))) * (charCX + 120);
      speed = Math.max(speed, k < 1 ? 0.35 : 0);
      if (k >= 1) { introT = -1; introDone = true; rig.wave(2.4); setLevel(0); say(levels[0].say, 9000); sfx.level(); }
    }
    const finishing = p > 0.985;
    rig.setMode(finishing ? 'celebrate' : 'idle');
    if (finishing && !celebrated && introDone) { celebrated = true; confetti(); sfx.unlock(); say(levels[levels.length - 1].say, 9000); }
    bubble.classList.toggle('dim', Math.abs(vel) > 450);
    rig.update(dt, speed);
    player.style.setProperty('--ix', `${ix.toFixed(1)}px`);
    player.style.setProperty('--jy', `${rig.y.toFixed(1)}px`);
    player.style.setProperty('--dir', String(dir));

    // interactions (world x of the character)
    const cwx = x + charCX;
    for (const c of coins) {
      if (!c.done && Math.abs(c.x - cwx) < 34) { c.done = true; c.el.classList.add('got'); addXp(10); sfx.coin(); }
    }
    for (const t of tokens) {
      if (!t.done && Math.abs(t.x - cwx) < 56) {
        t.done = true; t.el.classList.add('got'); skills++; hudSk.textContent = String(skills); addXp(50); sfx.unlock();
        showToast(`+50 XP · ${t.el.dataset.skill} unlocked`);
      }
    }
    const lead = clamp(Math.abs(vel) * 0.42, 70, 280);
    for (const b of bugs) {
      const dx = (b.x - cwx) * dir;
      if (!b.done && dx > 0 && dx < lead && Math.abs(vel) > 90 && !rig.airborne && introDone) { if (rig.jump()) sfx.jump(); }
      if (!b.done && Math.abs(b.x - cwx) < 26) { b.done = true; b.el.classList.add('fixed'); addXp(25); sfx.squash(); }
    }

    // panels reveal + level
    for (const pn of panels) {
      if (pn.left < x + vw * 1.1 && pn.right > x - vw * 0.3) pn.el.classList.add('in');
    }
    const probe = x + vw * 0.35;
    let idx = 0;
    for (let i = 0; i < levels.length; i++) {
      const pn = panels.find((q) => q.id === levels[i].id);
      if (pn && pn.left <= probe) idx = i;
    }
    if (idx !== current && (introDone || current === -1)) setLevel(idx);
    hudBar.style.width = `${(p * 100).toFixed(1)}%`;

    requestAnimationFrame(tick);
  }

  // ---------- start ----------
  buildStars();
  measure();
  document.fonts?.ready.then(() => { measure(); });
  let rw = innerWidth, rh = innerHeight, rt = 0;
  addEventListener('resize', () => {
    window.clearTimeout(rt);
    rt = window.setTimeout(() => {
      if (Math.abs(innerWidth - rw) > 2 || Math.abs(innerHeight - rh) > 120) {
        rw = innerWidth; rh = innerHeight;
        const done = coins.map((c) => c.done);
        measure();
        coins.forEach((c, i) => { if (done[i]) { c.done = true; c.el.classList.add('got'); } });
      }
    }, 200);
  });
  addEventListener('load', measure);

  hudName.textContent = levels[0].kicker;
  hudSub.textContent = levels[0].title;
  requestAnimationFrame(tick);

  const startIntro = () => {
    introT = 0;
    const h = location.hash.replace('#', '');
    if (h && panels.some((q) => q.id === h) && h !== 'home') window.setTimeout(() => jumpTo(h), 2600);
  };
  if (document.body.classList.contains('cinema-open')) startIntro();
  else document.addEventListener('intro:start', startIntro, { once: true });
  void live;
}
