/* ============================================================
 * Tiny WebAudio feedback engine — soft digital blips.
 * Globally gated by the StatusBar audio toggle.
 * ============================================================ */

export type SfxKind = "click" | "hover" | "open" | "close" | "success" | "error" | "tick";

let ctx: AudioContext | null = null;
let enabled = true;

export function setSfxEnabled(on: boolean): void {
  enabled = on;
}
export function sfxEnabled(): boolean {
  return enabled;
}

function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  delay?: number;
  slide?: number;
}

function tone(freq: number, dur: number, opts: ToneOpts = {}): void {
  const c = audio();
  if (!c) return;
  const { type = "square", vol = 0.03, delay = 0, slide } = opts;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

export function sfx(kind: SfxKind): void {
  if (!enabled) return;
  switch (kind) {
    case "click":
      tone(640, 0.06, { type: "square", vol: 0.026 });
      break;
    case "hover":
      tone(920, 0.028, { type: "sine", vol: 0.01 });
      break;
    case "tick":
      tone(1180, 0.024, { type: "sine", vol: 0.009 });
      break;
    case "open":
      tone(420, 0.09, { type: "sine", vol: 0.028 });
      tone(660, 0.12, { type: "sine", vol: 0.028, delay: 0.07 });
      break;
    case "close":
      tone(660, 0.08, { type: "sine", vol: 0.022 });
      tone(420, 0.1, { type: "sine", vol: 0.022, delay: 0.06 });
      break;
    case "success":
      tone(520, 0.1, { type: "triangle", vol: 0.04 });
      tone(660, 0.1, { type: "triangle", vol: 0.04, delay: 0.09 });
      tone(880, 0.18, { type: "triangle", vol: 0.04, delay: 0.18 });
      break;
    case "error":
      tone(220, 0.13, { type: "sawtooth", vol: 0.028 });
      tone(176, 0.16, { type: "sawtooth", vol: 0.028, delay: 0.08 });
      break;
  }
}
