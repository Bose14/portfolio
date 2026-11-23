// Cinematic preloader: a real progress counter (fonts + load) with a minimum run time,
// then the curtain lifts, the letterbox bars open and the world is told to start.

const pl = document.getElementById('preloader');
const num = document.getElementById('pl-num');
const bar = document.getElementById('pl-bar');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let finished = false;

function finish() {
  if (finished) return;
  finished = true;
  pl?.classList.add('done');
  document.body.classList.remove('loading');
  window.setTimeout(() => {
    document.body.classList.add('cinema-open');
    document.dispatchEvent(new CustomEvent('intro:start'));
  }, reduce ? 0 : 700);
}

if (!pl || !num || !bar) {
  finish();
} else {
  let ready = false;
  const loaded = new Promise<void>((r) => {
    if (document.readyState === 'complete') r();
    else window.addEventListener('load', () => r(), { once: true });
  });
  Promise.all([document.fonts?.ready ?? Promise.resolve(), loaded]).then(() => { ready = true; });

  const minMs = reduce ? 300 : 2100;
  const t0 = performance.now();
  let shown = 0;
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / minMs);
    const eased = 1 - Math.pow(1 - k, 3);
    const cap = ready ? 100 : 90;
    shown = Math.max(shown, Math.min(cap, eased * 100));
    num.textContent = String(Math.floor(shown));
    bar.style.width = `${shown}%`;
    if (shown >= 100) { window.setTimeout(finish, 250); return; }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  window.setTimeout(finish, 7000); // safety net
}
