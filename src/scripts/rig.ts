// Procedural animation rig for the side-view character (see Character.astro).
// Poses are computed per mode and eased toward each frame, so transitions look fluid.

export type Mode = 'idle' | 'run' | 'jump' | 'wave' | 'celebrate';

type Pose = {
  tF: number; sF: number; tB: number; sB: number; // thigh/shin, front (near) and back leg
  aF: number; fF: number; aB: number; fB: number; // upper arm/forearm
  bob: number; lean: number; head: number;
};

const ZERO: Pose = { tF: 0, sF: 0, tB: 0, sB: 0, aF: 0, fF: 0, aB: 0, fB: 0, bob: 0, lean: 0, head: 0 };

export class Rig {
  mode: Mode = 'idle';
  y = 0; // vertical offset (px, negative = up), read by the world
  airborne = false;

  private pose: Pose = { ...ZERO };
  private phase = 0;
  private t = 0;
  private jumpT = -1;
  private waveUntil = 0;
  private parts: Record<string, SVGElement>;
  private jumpDur = 0.78;
  private jumpH = 130;

  constructor(private root: SVGElement) {
    const q = (n: string) => root.querySelector<SVGElement>(`[data-part="${n}"]`)!;
    this.parts = {
      rig: q('rig'),
      tF: q('thighF'), sF: q('shinF'), tB: q('thighB'), sB: q('shinB'),
      aF: q('armF'), fF: q('foreF'), aB: q('armB'), fB: q('foreB'),
      head: q('head'), eyes: q('eyes'),
    };
  }

  setJumpHeight(px: number) { this.jumpH = px; }

  jump() {
    if (this.airborne) return false;
    this.airborne = true;
    this.jumpT = 0;
    return true;
  }

  wave(seconds = 1.8) { this.waveUntil = this.t + seconds; }

  setMode(m: Mode) { this.mode = m; }

  /** speed01: 0 = standing, >0 = running (0..1 scales cadence). */
  update(dt: number, speed01: number) {
    this.t += dt;
    if (this.airborne) {
      this.jumpT += dt;
      const k = this.jumpT / this.jumpDur;
      if (k >= 1) { this.airborne = false; this.jumpT = -1; this.y = 0; }
      else this.y = -Math.sin(Math.PI * k) * this.jumpH;
    }

    let mode: Mode = this.mode;
    if (this.airborne) mode = 'jump';
    else if (mode === 'idle' && speed01 > 0) mode = 'run';
    else if (mode === 'idle' && this.t < this.waveUntil) mode = 'wave';

    const target = this.target(mode, dt, speed01);
    const k = 1 - Math.exp(-dt * (mode === 'run' ? 22 : 14));
    (Object.keys(target) as (keyof Pose)[]).forEach((key) => {
      this.pose[key] += (target[key] - this.pose[key]) * k;
    });
    this.apply();
  }

  private target(mode: Mode, dt: number, speed01: number): Pose {
    const t = this.t;
    const p: Pose = { ...ZERO };
    switch (mode) {
      case 'run': {
        this.phase += dt * (7 + speed01 * 7);
        const f = this.phase;
        const c = Math.cos(f);
        const s = Math.sin(f);
        p.tF = -s * 44;
        p.sF = 8 + Math.max(0, c) * 68;
        p.tB = s * 44;
        p.sB = 8 + Math.max(0, -c) * 68;
        p.aF = s * 40;
        p.fF = -(62 + c * 16);
        p.aB = -s * 40;
        p.fB = -(62 - c * 16);
        p.bob = -Math.abs(s) * 6;
        p.lean = 7;
        p.head = -2;
        break;
      }
      case 'jump': {
        p.tF = -62; p.sF = 82; p.tB = 14; p.sB = 70;
        p.aF = -135; p.fF = -18; p.aB = -110; p.fB = -24;
        p.lean = 5; p.head = -5;
        break;
      }
      case 'wave': {
        p.tF = 2; p.tB = -2;
        p.aF = -112 + Math.sin(t * 9) * 5;
        p.fF = -14 + Math.sin(t * 11) * 24;
        p.aB = -4; p.fB = -6;
        p.bob = Math.sin(t * 2) * 1.5;
        p.head = 4;
        break;
      }
      case 'celebrate': {
        const hop = Math.abs(Math.sin(t * 7));
        p.tF = -14 * hop; p.sF = 30 * hop; p.tB = 10 * hop; p.sB = 24 * hop;
        p.aF = -140 + Math.sin(t * 14) * 6; p.fF = -10;
        p.aB = -128 - Math.sin(t * 14) * 6; p.fB = -14;
        p.bob = -hop * 10;
        p.head = -4;
        break;
      }
      default: {
        p.tF = 2; p.tB = -2;
        p.aF = 4 + Math.sin(t * 2) * 2; p.fF = -10;
        p.aB = -4 - Math.sin(t * 2) * 2; p.fB = -8;
        p.bob = Math.sin(t * 2) * 1.5;
      }
    }
    return p;
  }

  private apply() {
    const p = this.pose;
    const P = this.parts;
    P.rig.setAttribute('transform', `translate(0 ${p.bob.toFixed(2)}) rotate(${p.lean.toFixed(2)} 80 250)`);
    P.tF.setAttribute('transform', `rotate(${p.tF.toFixed(2)} 78 170)`);
    P.sF.setAttribute('transform', `rotate(${p.sF.toFixed(2)} 78 210)`);
    P.tB.setAttribute('transform', `rotate(${p.tB.toFixed(2)} 78 170)`);
    P.sB.setAttribute('transform', `rotate(${p.sB.toFixed(2)} 78 210)`);
    P.aF.setAttribute('transform', `rotate(${p.aF.toFixed(2)} 82 118)`);
    P.fF.setAttribute('transform', `rotate(${p.fF.toFixed(2)} 82 148)`);
    P.aB.setAttribute('transform', `rotate(${p.aB.toFixed(2)} 82 118)`);
    P.fB.setAttribute('transform', `rotate(${p.fB.toFixed(2)} 82 148)`);
    P.head.setAttribute('transform', `rotate(${p.head.toFixed(2)} 86 100)`);
    // blink
    const blink = (this.t % 4.2) > 4.1 ? 0.1 : 1;
    P.eyes.setAttribute('transform', `translate(0 ${(78 * (1 - blink)).toFixed(1)}) scale(1 ${blink})`);
  }
}
