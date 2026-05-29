/**
 * Vocoder — a real-time MICROPHONE → phase-vocoder PITCH SHIFTER → SPEAKER, in
 * pure TypeScript over Bun FFI on Windows. Speak into the mic and hear yourself
 * back instantly, transformed: a metallic ROBOT, a helium CHIPMUNK, a cavernous
 * DEEP voice, or a stacked HARMONY — every transformation computed sample-by-
 * sample in TypeScript, never by a plugin.
 *
 * This is NOT a hardware resampler. The DSP is a textbook frequency-domain phase
 * vocoder (Bernsee's algorithm): each overlapping analysis window is forward-FFT'd
 * to magnitude + phase; the per-bin phase deltas are unwrapped against the expected
 * phase advance to recover each partial's TRUE instantaneous frequency; the bins
 * are then SHIFTED by the pitch ratio (with their true frequencies scaled) and
 * re-synthesised by accumulating phase, inverse-FFT, Hann-windowing and overlap-
 * adding back into a constant-rate output stream. The result is a genuine pitch
 * shift that preserves tempo — impossible with a naïve playback-speed change.
 *
 * Native pipeline (every step is a real FFI call):
 *   1. _audio.createMicAnalyser({ onSamples }) — WinMM waveInOpen + a ring of
 *      WAVEHDRs (waveInPrepareHeader / waveInAddBuffer / waveInStart) polled on the
 *      JS thread; the new onSamples tap hands us the raw contiguous 16-bit PCM
 *      (decoded to float) gap-free, at a small 256-sample hop, before any windowing.
 *   2. Phase-vocoder DSP in TypeScript — Hann window → radix-2 complex FFT → per-bin
 *      magnitude/true-frequency analysis → pitch-ratio bin shift → phase-accumulating
 *      re-synthesis → inverse FFT (conjugate trick) → Hann → overlap-add ring.
 *   3. _audio.createPcmOutput — Ole32.CoInitialize → XAudio2Create →
 *      CreateMasteringVoice → CreateSourceVoice; the shifted Int16 blocks are
 *      streamed via IXAudio2SourceVoice::SubmitSourceBuffer, kept ≥1 buffer queued.
 *   4. Kernel32 GetStdHandle/GetConsoleMode/SetConsoleMode (ENABLE_VIRTUAL_TERMINAL_
 *      PROCESSING) for a live truecolor ANSI spectrum + level meter readout.
 *
 * APIs: Winmm.{waveInOpen,waveInPrepareHeader,waveInAddBuffer,waveInStart,
 *   waveInStop,waveInReset,waveInUnprepareHeader,waveInClose}; Ole32.CoInitialize;
 *   Xaudio2_9.XAudio2Create + IXAudio2/IXAudio2SourceVoice vtable methods (via the
 *   _audio engine); Kernel32.{GetStdHandle,GetConsoleMode,SetConsoleMode,
 *   SetConsoleTitleW}; User32.GetAsyncKeyState (ESC / effect cycling).
 *
 * Graceful degradation: with no microphone the pipeline still runs against an
 * internally generated test tone so you can hear/see the effect; with no audio
 * endpoint it runs silently and reports the live DSP state. Either way it never
 * crashes and exits 0.
 *
 * Run: bun run packages/all/example/vocoder.ts
 *   (speak; keys 1-4 / SPACE cycle ROBOT · CHIPMUNK · DEEP · HARMONY; ESC quits)
 *   DEMO_DURATION_MS=8000 bun run packages/all/example/vocoder.ts   (auto-exit)
 */

import { Kernel32, User32 } from '../index';
import { STD_HANDLE } from '@bun-win32/kernel32';
import { createMicAnalyser, createPcmOutput } from './_audio';

// ── Console VT (truecolor ANSI) ────────────────────────────────────────────────
const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;
const hStdout = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
const modeBuf = Buffer.alloc(4);
if (Kernel32.GetConsoleMode(hStdout, modeBuf.ptr!)) {
  Kernel32.SetConsoleMode(hStdout, modeBuf.readUInt32LE(0) | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
}
Kernel32.SetConsoleTitleW(Buffer.from('Vocoder · pure-TS phase vocoder\0', 'utf16le').ptr!);

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';
const CLEAR = '\x1b[2J\x1b[H';
const HOME = '\x1b[H';
const fg = (r: number, g: number, b: number): string => `\x1b[38;2;${r};${g};${b}m`;

// ── DSP parameters ──────────────────────────────────────────────────────────────
const SAMPLE_RATE = 44_100;
const FFT_SIZE = 1024;
const HOP = 256; // 4× overlap
const HALF = FFT_SIZE / 2;
const OSAMP = FFT_SIZE / HOP; // oversampling factor (4)
const EXPECTED_PER_BIN = (2 * Math.PI * HOP) / FFT_SIZE; // expected phase advance per hop, per bin index
const FREQ_PER_BIN = SAMPLE_RATE / FFT_SIZE;

// ── Radix-2 complex FFT (self-contained; in-place, precomputed twiddles) ─────────
// forward(re, im): DFT in place. The inverse transform uses the conjugate trick
// ifft(x) = conj(fft(conj(x))) / N performed by the caller.
const LOG2 = Math.round(Math.log2(FFT_SIZE));
const BITREV = new Uint32Array(FFT_SIZE);
for (let i = 0; i < FFT_SIZE; i += 1) {
  let rev = 0;
  let v = i;
  for (let b = 0; b < LOG2; b += 1) {
    rev = (rev << 1) | (v & 1);
    v >>>= 1;
  }
  BITREV[i] = rev >>> 0;
}
const TW_COS: Float64Array[] = [];
const TW_SIN: Float64Array[] = [];
for (let stage = 0; stage < LOG2; stage += 1) {
  const half = 1 << stage;
  const c = new Float64Array(half);
  const s = new Float64Array(half);
  for (let k = 0; k < half; k += 1) {
    const theta = (-Math.PI * k) / half;
    c[k] = Math.cos(theta);
    s[k] = Math.sin(theta);
  }
  TW_COS.push(c);
  TW_SIN.push(s);
}

/** In-place radix-2 Cooley–Tukey forward FFT over (re, im), each length FFT_SIZE. */
function fftForward(re: Float64Array, im: Float64Array): void {
  for (let i = 0; i < FFT_SIZE; i += 1) {
    const j = BITREV[i]!;
    if (j > i) {
      const tr = re[i]!; re[i] = re[j]!; re[j] = tr;
      const ti = im[i]!; im[i] = im[j]!; im[j] = ti;
    }
  }
  for (let stage = 0; stage < LOG2; stage += 1) {
    const half = 1 << stage;
    const block = half << 1;
    const cT = TW_COS[stage]!;
    const sT = TW_SIN[stage]!;
    for (let start = 0; start < FFT_SIZE; start += block) {
      for (let k = 0; k < half; k += 1) {
        const e = start + k;
        const o = e + half;
        const wc = cT[k]!;
        const ws = sT[k]!;
        const oRe = re[o]!;
        const oIm = im[o]!;
        const tr = wc * oRe - ws * oIm;
        const ti = wc * oIm + ws * oRe;
        const eRe = re[e]!;
        const eIm = im[e]!;
        re[e] = eRe + tr;
        im[e] = eIm + ti;
        re[o] = eRe - tr;
        im[o] = eIm - ti;
      }
    }
  }
}

/** Inverse FFT via the conjugate trick: ifft(x) = conj(fft(conj(x))) / N. */
function fftInverse(re: Float64Array, im: Float64Array): void {
  for (let i = 0; i < FFT_SIZE; i += 1) im[i] = -im[i]!;
  fftForward(re, im);
  const norm = 1 / FFT_SIZE;
  for (let i = 0; i < FFT_SIZE; i += 1) {
    re[i] = re[i]! * norm;
    im[i] = -im[i]! * norm;
  }
}

// ── Effects ──────────────────────────────────────────────────────────────────────
interface Effect {
  readonly name: string;
  readonly ratio: number; // pitch ratio (>1 = up, <1 = down)
  readonly harmonize: boolean; // sum a second voice at the octave/fifth
  readonly color: [number, number, number];
}

const EFFECTS: readonly Effect[] = [
  { name: 'ROBOT', ratio: 1.0, harmonize: false, color: [120, 255, 170] }, // phase-flatten → metallic monotone
  { name: 'CHIPMUNK', ratio: 1.6, harmonize: false, color: [255, 210, 120] },
  { name: 'DEEP', ratio: 0.65, harmonize: false, color: [120, 190, 255] },
  { name: 'HARMONY', ratio: 1.0, harmonize: true, color: [230, 140, 255] }, // self + a perfect-fifth voice
];
let effectIndex = 0;

// ── Phase-vocoder state ────────────────────────────────────────────────────────
const han = new Float32Array(FFT_SIZE);
for (let i = 0; i < FFT_SIZE; i += 1) han[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
// Window-power compensation for the overlap-add of a Hann² (analysis × synthesis).
const WINDOW_GAIN = (2 / 3) * OSAMP; // sum of Hann² over the hops ≈ 3/8·OSAMP·… → normalise

const inRing = new Float32Array(FFT_SIZE); // sliding analysis window (most-recent FFT_SIZE samples)
let inFilled = 0; // valid samples currently in inRing (ramps up to FFT_SIZE)
let hopAccum = 0; // samples since the last analysis frame

const fftRe = new Float64Array(FFT_SIZE);
const fftIm = new Float64Array(FFT_SIZE);

const lastPhase = new Float64Array(HALF + 1);
const sumPhase = new Float64Array(HALF + 1);
const anaMagn = new Float64Array(HALF + 1);
const anaFreq = new Float64Array(HALF + 1);
const synMagn = new Float64Array(HALF + 1);
const synFreq = new Float64Array(HALF + 1);

// Output overlap-add accumulator: a ring long enough for one window plus headroom.
const OUT_RING = FFT_SIZE * 4;
const outAccum = new Float64Array(OUT_RING);
let outWrite = 0; // where the next synthesis frame is overlap-added
let outRead = 0; // next sample to emit
let outReady = 0; // samples available between outRead and outWrite

/** Push `count` contiguous mic samples; run a vocoder frame every HOP samples. */
function pushSamples(frame: Float32Array, count: number): void {
  for (let n = 0; n < count; n += 1) {
    // Slide newest sample into the analysis window.
    inRing.copyWithin(0, 1, FFT_SIZE);
    inRing[FFT_SIZE - 1] = frame[n]!;
    if (inFilled < FFT_SIZE) inFilled += 1;
    hopAccum += 1;
    if (hopAccum >= HOP && inFilled >= FFT_SIZE) {
      hopAccum = 0;
      processFrame();
    }
  }
}

const eff = (): Effect => EFFECTS[effectIndex]!;

/** Run one analysis/processing/synthesis hop of the phase vocoder. */
function processFrame(): void {
  const e = eff();

  // Windowed FFT input.
  for (let i = 0; i < FFT_SIZE; i += 1) {
    fftRe[i] = inRing[i]! * han[i]!;
    fftIm[i] = 0;
  }
  fftForward(fftRe, fftIm);

  // Analysis: magnitude + TRUE frequency per bin (phase unwrap vs expected advance).
  for (let k = 0; k <= HALF; k += 1) {
    const re = fftRe[k]!;
    const im = fftIm[k]!;
    const mag = 2 * Math.sqrt(re * re + im * im);
    const phase = Math.atan2(im, re);

    let delta = phase - lastPhase[k]!;
    lastPhase[k] = phase;
    // Subtract the expected per-hop phase advance for this bin, then wrap to ±π.
    delta -= k * EXPECTED_PER_BIN;
    let qpd = Math.round(delta / Math.PI);
    if (qpd >= 0) qpd += qpd & 1; else qpd -= qpd & 1;
    delta -= Math.PI * qpd;
    // Deviation (in bins) from the bin centre, → true frequency in Hz.
    const deviation = (OSAMP * delta) / (2 * Math.PI);
    anaMagn[k] = mag;
    anaFreq[k] = (k + deviation) * FREQ_PER_BIN;
  }

  // Processing: shift the spectrum by the pitch ratio. For HARMONY, also fold in a
  // perfect-fifth (×1.5) copy so the listener hears two stacked voices.
  synMagn.fill(0);
  synFreq.fill(0);
  accumulateShift(e.ratio, 1.0);
  if (e.harmonize) accumulateShift(1.5, 0.7);

  // Synthesis: phase-accumulate from the (possibly flattened) true frequencies.
  const robot = e.name === 'ROBOT';
  for (let k = 0; k <= HALF; k += 1) {
    const mag = synMagn[k]!;
    // Back out the bin-centre deviation → per-hop phase increment.
    const trueFreq = synFreq[k]!;
    const deviation = trueFreq / FREQ_PER_BIN - k;
    let advance = k * EXPECTED_PER_BIN + (2 * Math.PI * deviation) / OSAMP;
    if (robot) advance = k * EXPECTED_PER_BIN; // flatten phase → metallic monotone timbre
    sumPhase[k] = sumPhase[k]! + advance;
    const ph = sumPhase[k]!;
    fftRe[k] = mag * Math.cos(ph);
    fftIm[k] = mag * Math.sin(ph);
  }
  // Hermitian-symmetric upper half for a real inverse transform.
  for (let k = 1; k < HALF; k += 1) {
    fftRe[FFT_SIZE - k] = fftRe[k]!;
    fftIm[FFT_SIZE - k] = -fftIm[k]!;
  }

  fftInverse(fftRe, fftIm);

  // Hann-window the synthesis frame and overlap-add into the output ring.
  const gain = 1 / WINDOW_GAIN;
  for (let i = 0; i < FFT_SIZE; i += 1) {
    const idx = (outWrite + i) % OUT_RING;
    outAccum[idx] = outAccum[idx]! + fftRe[i]! * han[i]! * gain;
  }
  outWrite = (outWrite + HOP) % OUT_RING;
  outReady += HOP;
}

/** Fold the analysis spectrum, scaled by `ratio`, into the synthesis spectrum at `weight`. */
function accumulateShift(ratio: number, weight: number): void {
  for (let k = 0; k <= HALF; k += 1) {
    const target = Math.round(k * ratio);
    if (target < 0 || target > HALF) continue;
    synMagn[target] = synMagn[target]! + anaMagn[k]! * weight;
    synFreq[target] = anaFreq[k]! * ratio; // last writer wins; loudest partial dominates
  }
}

/** Drain `count` finished output samples into Int16; returns fewer if not ready. */
function drainOutput(count: number): Int16Array | null {
  if (outReady < count) return null;
  const block = new Int16Array(count);
  for (let i = 0; i < count; i += 1) {
    const idx = (outRead + i) % OUT_RING;
    let s = outAccum[idx]!;
    outAccum[idx] = 0; // consume — must clear so the next overlap-add starts from 0
    if (s > 1) s = 1; else if (s < -1) s = -1;
    block[i] = Math.round(s * 30_000);
  }
  outRead = (outRead + count) % OUT_RING;
  outReady -= count;
  return block;
}

// ── Mic + speaker ────────────────────────────────────────────────────────────────
const mic = createMicAnalyser({
  fftSize: FFT_SIZE,
  sampleRate: SAMPLE_RATE,
  captureSamples: HOP, // small hop so poll() drains gap-free
  bufferCount: 10,
  onSamples: pushSamples,
});
const out = createPcmOutput({ sampleRate: SAMPLE_RATE, channels: 1 });

// Test-tone fallback so the DSP still has input on a box with no mic.
let tonePhase = 0;
const toneScratch = new Float32Array(HOP);
function synthTestTone(): void {
  // A gliding vowel-ish tone (fundamental + a few harmonics) so the pitch shift is audible.
  const base = 150 + 40 * Math.sin(performance.now() / 900);
  for (let i = 0; i < HOP; i += 1) {
    const t = tonePhase / SAMPLE_RATE;
    toneScratch[i] =
      0.5 * Math.sin(2 * Math.PI * base * t) +
      0.25 * Math.sin(2 * Math.PI * base * 2 * t) +
      0.12 * Math.sin(2 * Math.PI * base * 3 * t);
    tonePhase += 1;
  }
  pushSamples(toneScratch, HOP);
}

if (out.available) {
  out.setVolume(0.9);
  out.start();
}

// ── ANSI readout ────────────────────────────────────────────────────────────────
const SPEC_BANDS = 48;
const bandLo = new Int32Array(SPEC_BANDS);
const bandHi = new Int32Array(SPEC_BANDS);
{
  const minBin = 1;
  const maxBin = Math.max(minBin + 1, mic.magnitudes.length - 1);
  const lMin = Math.log(minBin);
  const lMax = Math.log(maxBin);
  for (let b = 0; b < SPEC_BANDS; b += 1) {
    bandLo[b] = Math.max(minBin, Math.floor(Math.exp(lMin + ((lMax - lMin) * b) / SPEC_BANDS)));
    bandHi[b] = Math.max(bandLo[b]! + 1, Math.floor(Math.exp(lMin + ((lMax - lMin) * (b + 1)) / SPEC_BANDS)));
  }
}
const RAMP = ' .:-=+*#%@';
let autoGain = 30;

function renderSpectrum(): string {
  let peak = 1e-4;
  const vals = new Float32Array(SPEC_BANDS);
  for (let b = 0; b < SPEC_BANDS; b += 1) {
    let sum = 0;
    const lo = bandLo[b]!;
    const hi = bandHi[b]!;
    for (let k = lo; k < hi; k += 1) sum += mic.magnitudes[k]!;
    const v = sum / (hi - lo);
    vals[b] = v;
    if (v > peak) peak = v;
  }
  autoGain = autoGain * 0.95 + (1 / Math.max(1e-4, peak)) * 0.05;
  autoGain = Math.min(autoGain, 4000);
  const e = eff();
  let line = '';
  for (let b = 0; b < SPEC_BANDS; b += 1) {
    const norm = Math.min(1, Math.sqrt(vals[b]! * autoGain) * 0.5);
    const ch = RAMP[Math.min(RAMP.length - 1, Math.floor(norm * (RAMP.length - 1)))]!;
    const shade = 0.35 + 0.65 * norm;
    line += fg(Math.round(e.color[0] * shade), Math.round(e.color[1] * shade), Math.round(e.color[2] * shade)) + ch;
  }
  return line + RESET;
}

function meter(v: number, width: number, color: [number, number, number]): string {
  const n = Math.max(0, Math.min(width, Math.round(v * width)));
  return fg(color[0], color[1], color[2]) + '█'.repeat(n) + DIM + '·'.repeat(width - n) + RESET;
}

// ── Input (ESC + effect cycling via GetAsyncKeyState; raw stdin as a backup) ─────
const VK_ESCAPE = 0x1b;
const VK_SPACE = 0x20;
const VK_1 = 0x31;
let quit = false;
let lastKey = 0;

// Raw stdin so number/space keys work even when launched without window focus.
let stdinRaw = false;
try {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    stdinRaw = true;
  }
  process.stdin.resume();
  process.stdin.on('data', (chunk: Buffer) => {
    for (const byte of chunk) {
      if (byte === 0x1b || byte === 0x03) quit = true; // ESC / Ctrl-C
      else if (byte === 0x20) effectIndex = (effectIndex + 1) % EFFECTS.length; // SPACE
      else if (byte >= 0x31 && byte <= 0x34) effectIndex = (byte - 0x31) % EFFECTS.length; // 1-4
    }
  });
} catch {
  /* stdin not available (piped) — GetAsyncKeyState still drives ESC/cycle */
}

function pollKeys(): void {
  if ((User32.GetAsyncKeyState(VK_ESCAPE) & 0x8000) !== 0) quit = true;
  if ((User32.GetAsyncKeyState(VK_SPACE) & 0x8000) !== 0) {
    if (lastKey !== VK_SPACE) effectIndex = (effectIndex + 1) % EFFECTS.length;
    lastKey = VK_SPACE;
    return;
  }
  for (let i = 0; i < EFFECTS.length; i += 1) {
    if ((User32.GetAsyncKeyState(VK_1 + i) & 0x8000) !== 0) {
      if (lastKey !== VK_1 + i) effectIndex = i;
      lastKey = VK_1 + i;
      return;
    }
  }
  lastKey = 0;
}

// ── Teardown ──────────────────────────────────────────────────────────────────
let tornDown = false;
function teardown(): void {
  if (tornDown) return;
  tornDown = true;
  try { mic.close(); } catch { /* ignore */ }
  try { out.close(); } catch { /* ignore */ }
  try {
    if (stdinRaw) process.stdin.setRawMode(false);
    process.stdin.pause();
  } catch { /* ignore */ }
  process.stdout.write(SHOW_CURSOR + RESET + '\n');
}
process.on('SIGINT', () => { teardown(); process.exit(0); });
process.on('exit', teardown);

// ── Banner + main loop ──────────────────────────────────────────────────────────
process.stdout.write(CLEAR + HIDE_CURSOR);
console.log(`${BOLD}${fg(120, 255, 200)}VOCODER${RESET} ${DIM}· real-time phase-vocoder pitch shift in pure TypeScript${RESET}`);
console.log(
  `  mic: ${mic.available ? fg(120, 255, 170) + 'live capture' + RESET : fg(255, 200, 120) + 'no mic — internal test tone' + RESET}` +
  `   speaker: ${out.available ? fg(120, 255, 170) + 'XAudio2 stream' + RESET : fg(255, 200, 120) + 'no endpoint (silent)' + RESET}`,
);
console.log(`  ${DIM}FFT ${FFT_SIZE} · hop ${HOP} · ${OSAMP}× overlap · ${SAMPLE_RATE} Hz${RESET}`);
console.log(`  ${DIM}keys: 1 ROBOT  2 CHIPMUNK  3 DEEP  4 HARMONY  SPACE cycle  ESC quit${RESET}`);
console.log('');

const startedAt = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let frames = 0;
let submitted = 0;
let lastDraw = 0;

function loop(): void {
  pollKeys();
  if (quit || (durationMs > 0 && performance.now() - startedAt >= durationMs)) {
    finish();
    return;
  }

  // Drain the mic (fires onSamples → pushSamples → processFrame). With no mic,
  // synthesise the test tone at the same hop cadence.
  if (mic.available) mic.poll();
  else synthTestTone();

  // Keep the output ring fed: emit HOP-sized blocks while we have material and the
  // XAudio2 queue has room (queued()<4 keeps latency low without starving).
  while (out.queued() < 4) {
    const block = drainOutput(HOP);
    if (block === null) break;
    out.submit(block);
    submitted += 1;
  }

  // Throttled ANSI redraw (~30 fps) so the console isn't flooded.
  const now = performance.now();
  if (now - lastDraw >= 33) {
    lastDraw = now;
    const e = eff();
    let s = HOME;
    s += '\x1b[6;1H'; // park below the static banner
    s += `  ${BOLD}${fg(e.color[0], e.color[1], e.color[2])}▶ ${e.name.padEnd(9)}${RESET}` +
      `  ${DIM}ratio${RESET} ${e.ratio.toFixed(2)}×${e.harmonize ? `${DIM} + fifth${RESET}` : '        '}\x1b[K\n`;
    s += `  ${DIM}input  ${RESET}${meter(Math.min(1, mic.level * 8), 32, [120, 200, 255])} ${(mic.level).toFixed(3)}\x1b[K\n`;
    s += `  ${DIM}queued ${RESET}${out.queued()} buffers   ${DIM}frames${RESET} ${frames}   ${DIM}emitted${RESET} ${submitted}\x1b[K\n`;
    s += '\n';
    s += `  ${renderSpectrum()}\x1b[K\n`;
    s += `  ${DIM}${'└'}${'─'.repeat(SPEC_BANDS - 2)}${'┘'}  live mic spectrum (log-freq)${RESET}\x1b[K\n`;
    process.stdout.write(s);
  }

  frames += 1;
  // Tight cadence: the mic produces a 256-sample buffer every ~5.8 ms; poll often.
  setTimeout(loop, 4);
}

let finished = false;
function finish(): void {
  if (finished) return;
  finished = true;
  teardown();
  console.log(
    `${DIM}vocoder offline — ${frames} loop iterations, ${submitted} output blocks streamed ` +
    `(${((performance.now() - startedAt) / 1000).toFixed(1)}s).${RESET}`,
  );
  process.exit(0);
}

loop();
