/** SFX sintetizados com Web Audio; o contexto só nasce após um gesto do usuário. */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function initAudio(): void {
  if (ctx) {
    void ctx.resume();
    return;
  }
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.25;
  master.connect(ctx.destination);
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  vol = 1,
  slideTo?: number,
  delay = 0,
): void {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur: number, vol = 0.6, cutoff = 1200): void {
  if (!ctx || !master) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = cutoff;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(master);
  src.start();
}

export const sfx = {
  select: () => tone(660, 0.06, 'triangle', 0.3),
  card: () => tone(420, 0.12, 'triangle', 0.5, 760),
  hit: () => {
    noise(0.12, 0.7, 1500);
    tone(160, 0.12, 'square', 0.25, 70);
  },
  bigHit: () => {
    noise(0.25, 0.9, 900);
    tone(110, 0.25, 'sawtooth', 0.35, 45);
  },
  block: () => tone(300, 0.1, 'square', 0.25, 520),
  buff: () => {
    tone(520, 0.1, 'triangle', 0.35);
    tone(780, 0.14, 'triangle', 0.3, undefined, 0.08);
  },
  debuff: () => tone(380, 0.22, 'sine', 0.35, 190),
  draw: () => tone(900, 0.04, 'triangle', 0.15),
  turn: () => tone(330, 0.18, 'sine', 0.3, 440),
  win: () =>
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.4, undefined, i * 0.12)),
  lose: () =>
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'sine', 0.4, undefined, i * 0.16)),
};
