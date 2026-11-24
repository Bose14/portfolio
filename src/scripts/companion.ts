// The moving figure. One persistent cutout travels the page along a curved, spring-driven path:
// it eases between a stop per section, banks into turns, breathes, turns its head toward the
// cursor, tilts in 3D and carries a speech bubble that explains each section.

type Stop = { x: number; y: number; s: number; r: number };
type Data = { messages: Record<string, string> };

const D: Record<string, Stop> = {
  home:         { x: 0.74, y: 0.53, s: 1.0,  r: 0 },
  about:        { x: 0.14, y: 0.62, s: .56, r: -7 },
  experience:   { x: 0.86, y: 0.40, s: .56, r: 8 },
  skills:       { x: 0.9,  y: 0.27, s: 0.26, r: -9 },
  projects:     { x: 0.945, y: 0.6, s: .36, r: 6 },
  ventures:     { x: 0.14, y: 0.36, s: .56, r: -6 },
  creator:      { x: 0.86, y: 0.66, s: .56, r: 8 },
  achievements: { x: 0.14, y: 0.60, s: .56, r: -8 },
  contact:      { x: 0.84, y: 0.54, s: 0.8, r: 0 },
};
const M: Record<string, Stop> = {
  home:         { x: 0.5,  y: 0.27, s: 0.62, r: 0 },
  about:        { x: 0.13, y: 0.86, s: 0.2,  r: -6 },
  experience:   { x: 0.13, y: 0.86, s: 0.2,  r: 6 },
  skills:       { x: 0.13, y: 0.86, s: 0.2,  r: -6 },
  projects:     { x: 0.13, y: 0.86, s: 0.2,  r: 6 },
  ventures:     { x: 0.13, y: 0.86, s: 0.2,  r: -6 },
  creator:      { x: 0.13, y: 0.86, s: 0.2,  r: 6 },
  achievements: { x: 0.13, y: 0.86, s: 0.2,  r: -6 },
  contact:      { x: 0.5,  y: 0.4,  s: 0.5,  r: 0 },
};

const $ = (id: string) => document.getElementById(id)!;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

const dataEl = document.getElementById('site-data');
const figure = document.getElementById('figure');
if (dataEl && figure) init(JSON.parse(dataEl.textContent || '{}') as Data, figure);

function init(data: Data, figure: HTMLElement) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rot = $('fig-rot'), torso = $('fig-torso'), head = $('fig-head');
  const glow = $('fig-glow'), ring = $('fig-ring'), ring2 = $('fig-ring2'), body = $('fig-body');
  const hit = $('fig-hit'), bubble = $('bubble'), bubbleT = $('bubble-t');
  const mobile = () => matchMedia('(max-width: 768px)').matches;

  // hero buttons / page furniture
  $('hero-info')?.addEventListener('click', () => $('chat-fab')?.click());
  const spot = $('spot');
  const chips = Array.from(document.querySelectorAll<HTMLElement>('.chip[data-depth]'));

  // ---------- section stops (measured) ----------
  type Key = { id: string; y: number };
  let keys: Key[] = [];
  let vw = innerWidth, vh = innerHeight, figW = 0, figH = 0;

  function measure() {
    vw = innerWidth; vh = innerHeight;
    figH = figure.offsetHeight; figW = figure.offsetWidth;
    const max = Math.max(0, document.documentElement.scrollHeight - vh);
    const list = Array.from(document.querySelectorAll<HTMLElement>('[data-co]'));
    keys = list.map((el, i) => {
      const top = el.getBoundingClientRect().top + scrollY;
      let y = top + el.offsetHeight / 2 - vh / 2;
      if (i === 0) y = 0;
      if (i === list.length - 1) y = Math.max(y, max);
      return { id: el.dataset.co!, y: clamp(y, 0, max) };
    });
    for (let i = 1; i < keys.length; i++) if (keys[i].y <= keys[i - 1].y + 1) keys[i].y = keys[i - 1].y + 1;
  }

  const stopOf = (id: string): Stop => (mobile() ? M : D)[id] ?? D.home;
  const px = (st: Stop) => ({ x: st.x * vw, y: st.y * vh, s: st.s, r: st.r });

  function targetAt(y: number) {
    if (!keys.length) return px(stopOf('home'));
    if (y <= keys[0].y) return px(stopOf(keys[0].id));
    const last = keys[keys.length - 1];
    if (y >= last.y) return px(stopOf(last.id));
    let i = 0;
    while (i < keys.length - 2 && y > keys[i + 1].y) i++;
    const a = px(stopOf(keys[i].id)), b = px(stopOf(keys[i + 1].id));
    const p0 = px(stopOf(keys[Math.max(0, i - 1)].id)), p3 = px(stopOf(keys[Math.min(keys.length - 1, i + 2)].id));
    const u = (y - keys[i].y) / (keys[i + 1].y - keys[i].y);
    const e = smoother(clamp((u - 0.18) / 0.64, 0, 1));        // dwell near each stop, travel in between
    // cardinal-spline tangents give a curved path through the stops
    const t = 0.5;
    const hx = (p: number, q: number, r: number, s: number) => {
      const m1 = (r - p) * t, m2 = (s - q) * t;
      const e2 = e * e, e3 = e2 * e;
      return (2 * e3 - 3 * e2 + 1) * q + (e3 - 2 * e2 + e) * m1 + (-2 * e3 + 3 * e2) * r + (e3 - e2) * m2;
    };
    const bulge = Math.sin(Math.PI * e) * vh * 0.1 * (i % 2 ? 1 : -1);   // arcs, never a straight line
    return {
      x: hx(p0.x, a.x, b.x, p3.x),
      y: hx(p0.y, a.y, b.y, p3.y) + bulge,
      s: a.s + (b.s - a.s) * e,
      r: a.r + (b.r - a.r) * e,
    };
  }

  // ---------- reduced motion: static portrait in the hero ----------
  if (reduce) {
    measure();
    figure.style.position = 'absolute';
    const t = px(stopOf('home'));
    figure.style.transform = `translate3d(${t.x - figW / 2}px, ${t.y - figH / 2}px, 0) scale(${t.s})`;
    hit.style.display = 'none';
    bubble.style.display = 'none';
    return;
  }

  // ---------- state ----------
  const st = { x: 0, y: 0, s: 1, r: 0 };
  const vel = { x: 0, y: 0, s: 0, r: 0 };
  let started = false;
  let mx = 0, my = 0, tmx = 0, tmy = 0;     // smoothed / target pointer (-1..1)
  let time = 0, last = performance.now();
  let shownIdx = 0, settledFor = 0, hideTimer = 0, userOpen = false;
  let activeId = 'home';

  const K = 80, C = 2 * Math.sqrt(K) * 0.74;  // slightly under-damped: a hint of overshoot

  function spring(dt: number, key: 'x' | 'y' | 's' | 'r', target: number, k = K, c = C) {
    const a = k * (target - st[key]) - c * vel[key];
    vel[key] += a * dt;
    st[key] += vel[key] * dt;
  }

  addEventListener('pointermove', (e) => {
    tmx = (e.clientX / vw - 0.5) * 2;
    tmy = (e.clientY / vh - 0.5) * 2;
    spot.style.setProperty('--mx', `${e.clientX}px`);
    spot.style.setProperty('--my', `${e.clientY}px`);
  }, { passive: true });

  // ---------- speech bubble ----------
  function say(text: string, ms = 6800) {
    bubbleT.textContent = text;
    bubble.classList.add('show');
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => { bubble.classList.remove('show'); userOpen = false; }, ms);
  }
  hit.addEventListener('click', () => {
    userOpen = true;
    say(data.messages[activeId] ?? '', 8000);
  });

  // ---------- main loop ----------
  function tick(now: number) {
    const dt = Math.min(0.12, (now - last) / 1000) || 0.016;
    last = now; time += dt;

    const target = targetAt(scrollY);
    if (!started) {
      // arrive from the side on first frame, then spring into place
      st.x = target.x + vw * 0.07; st.y = target.y + vh * 0.02; st.s = target.s * 0.96; st.r = target.r + 3;
      started = true;
    }
    // two sub-steps keep the spring stable on slow frames
    const steps = Math.max(2, Math.ceil(dt / 0.012));
    for (let i = 0; i < steps; i++) {
      const h = dt / steps;
      spring(h, 'x', target.x); spring(h, 'y', target.y);
      spring(h, 's', target.s, 70, 2 * Math.sqrt(70) * 0.9); spring(h, 'r', target.r, 60, 2 * Math.sqrt(60) * 0.8);
    }

    mx += (tmx - mx) * 0.07; my += (tmy - my) * 0.07;

    // motion → body language
    const bank = clamp(vel.x * 0.012, -12, 12);                    // lean into horizontal travel
    const pitch = clamp(-vel.y * 0.004, -6, 6);
    const speed = Math.hypot(vel.x, vel.y);
    const squash = 1 - clamp(speed * 0.00004, 0, 0.03);

    // idle life: float + breathing
    const floatY = Math.sin(time * 1.15) * 7 * st.s + Math.sin(time * 0.53) * 3 * st.s;
    const breathe = Math.sin(time * 1.7);
    const rotZ = st.r + bank + Math.sin(time * 0.7) * 0.7;

    figure.style.transform =
      `translate3d(${(st.x - figW / 2).toFixed(2)}px, ${(st.y - figH / 2 + floatY).toFixed(2)}px, 0) rotate(${rotZ.toFixed(2)}deg) scale(${st.s.toFixed(4)}, ${(st.s * squash).toFixed(4)})`;
    hit.style.transform = `translate3d(${st.x.toFixed(1)}px, ${(st.y + floatY).toFixed(1)}px, 0) scale(${clamp(st.s, 0.5, 1.4).toFixed(2)})`;

    // 3D tilt toward the pointer (perspective gives real depth), with parallax between layers
    rot.style.transform = `perspective(1100px) rotateY(${(mx * 9).toFixed(2)}deg) rotateX(${(-my * 5 + pitch).toFixed(2)}deg)`;
    glow.style.translate = `${(-mx * 22).toFixed(1)}px ${(-my * 14).toFixed(1)}px`;
    ring.style.translate = `${(-mx * 34).toFixed(1)}px ${(-my * 22).toFixed(1)}px`;
    ring2.style.translate = `${(-mx * 48).toFixed(1)}px ${(-my * 30).toFixed(1)}px`;
    ring.style.rotate = `${(time * 4).toFixed(1)}deg`;
    body.style.translate = `${(mx * 5).toFixed(1)}px ${(my * 3).toFixed(1)}px`;

    // torso breathes from the waist; the head follows the cursor, lags behind motion and bobs
    torso.style.transform = `scaleY(${(1 + breathe * 0.007).toFixed(4)}) translateX(${(mx * 2).toFixed(1)}px)`;
    const headTurn = clamp(mx * 5.5 - vel.x * 0.004, -8, 8) + Math.sin(time * 0.6) * 0.8;
    const headNod = clamp(my * 1.6, -2, 2) + breathe * 0.25;
    head.style.transform = `translate(${(mx * 4.5).toFixed(1)}px, ${(-breathe * 1.2 + headNod * 2).toFixed(2)}px) rotate(${headTurn.toFixed(2)}deg)`;

    // hero chips drift with depth
    for (const c of chips) {
      const d = Number(c.dataset.depth) || 0;
      c.style.translate = `${(mx * d).toFixed(1)}px ${(my * d * 0.6 + Math.sin(time * 0.9 + d) * 4).toFixed(1)}px`;
    }

    // which section are we in, and has the figure settled there?
    let ai = 0, best = Infinity;
    for (let i = 0; i < keys.length; i++) { const dd = Math.abs(scrollY - keys[i].y); if (dd < best) { best = dd; ai = i; } }
    activeId = keys[ai]?.id ?? 'home';
    const settled = Math.hypot(target.x - st.x, target.y - st.y) < 30 && speed < 70;
    settledFor = settled ? settledFor + dt : 0;
    if (settledFor > 0.45 && ai !== shownIdx && started) {
      shownIdx = ai;
      const msg = data.messages[activeId];
      if (msg) say(msg);
    }

    // bubble follows the figure and sits on the side facing the page centre
    if (bubble.classList.contains('show')) {
      const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
      const hw = (figW * st.s) / 2, hh = (figH * st.s) / 2;
      let bx: number, by: number;
      if (mobile()) {
        bx = clamp(st.x - 30, 12, vw - bw - 12);
        by = clamp(st.y - hh - bh - 6, 70, vh - bh - 12);
      } else if (st.x < vw / 2) {
        bx = st.x + hw * 0.75 + 14;
        by = clamp(st.y - hh * 0.55 - bh * 0.5, 76, vh - bh - 16);
      } else {
        bx = st.x - hw * 0.75 - 14 - bw;
        by = clamp(st.y - hh * 0.55 - bh * 0.5, 76, vh - bh - 16);
      }
      bubble.style.transform = `translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px, 0)`;
    }

    requestAnimationFrame(tick);
  }

  // ---------- scroll-driven bits ----------
  const words = Array.from(document.querySelectorAll<HTMLElement>('#statement .w'));
  const statement = document.getElementById('statement');
  const cards = Array.from(document.querySelectorAll<HTMLElement>('.pcard'));
  function onScroll() {
    if (statement && words.length) {
      const r = statement.getBoundingClientRect();
      const p = clamp((vh * 0.88 - r.top) / (vh * 0.42 + r.height), 0, 1);
      words.forEach((w, i) => w.classList.toggle('on', i / words.length < p * 1.08));
    }
    cards.forEach((c, i) => {
      const next = cards[i + 1];
      if (!next) return;
      const d = next.getBoundingClientRect().top - c.getBoundingClientRect().top;
      const cover = 1 - clamp(d / c.offsetHeight, 0, 1);
      c.style.transform = `scale(${(1 - cover * 0.05).toFixed(4)})`;
      c.style.filter = `brightness(${(1 - cover * 0.4).toFixed(3)})`;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });

  measure();
  onScroll();
  document.fonts?.ready.then(() => { measure(); onScroll(); });
  addEventListener('load', () => { measure(); onScroll(); });
  let rt = 0;
  addEventListener('resize', () => { window.clearTimeout(rt); rt = window.setTimeout(() => { measure(); onScroll(); }, 150); });
  new ResizeObserver(() => { window.clearTimeout(rt); rt = window.setTimeout(measure, 150); }).observe(document.body);

  requestAnimationFrame(tick);
}
