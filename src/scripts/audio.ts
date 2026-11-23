// Tiny synthesized sound effects. Off by default; the player turns it on from the HUD.

let ctx: AudioContext | null = null;
let enabled = false;

export const sfx = {
  get on() { return enabled; },
  toggle(): boolean {
    enabled = !enabled;
    if (enabled && !ctx) {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctx = new AC();
      } catch { enabled = false; }
    }
    if (enabled) void ctx?.resume();
    if (enabled) sfx.blip(660, 0.08);
    return enabled;
  },
  blip(freq: number, dur = 0.1, type: OscillatorType = 'square', vol = 0.04, slideTo?: number) {
    if (!enabled || !ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  },
  coin() { sfx.blip(988, 0.07); setTimeout(() => sfx.blip(1319, 0.14), 70); },
  jump() { sfx.blip(280, 0.18, 'square', 0.035, 620); },
  squash() { sfx.blip(220, 0.12, 'sawtooth', 0.04, 90); },
  unlock() { [523, 659, 784].forEach((f, i) => setTimeout(() => sfx.blip(f, 0.12, 'triangle', 0.05), i * 70)); },
  level() { [392, 523, 659, 784].forEach((f, i) => setTimeout(() => sfx.blip(f, 0.16, 'triangle', 0.05), i * 90)); },
  over() { sfx.blip(300, 0.4, 'sawtooth', 0.05, 70); },
};
