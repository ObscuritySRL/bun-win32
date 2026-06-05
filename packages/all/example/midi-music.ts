/**
 * MIDI-MUSIC — a generative piece performed LIVE through the Windows General-MIDI
 * hardware synthesizer, driven entirely by pure TypeScript over winmm. No PCM, no
 * sample playback: every note is a real MIDI message (NoteOn 0x9n / NoteOff 0x8n /
 * ProgramChange 0xCn) packed into a DWORD and shipped to the OS synth via
 * Winmm.midiOutShortMsg(hmo, status | (data1<<8) | (data2<<16)).
 *
 * The composer runs four GM voices on four channels — a warm pad chord bed, a
 * sparkling arpeggio, a singing lead melody, and a fingered bass — over an evolving
 * diatonic chord progression in a chosen key, with a sensible swung tempo. Each
 * scheduled note is also pushed into a GPU note-event ring so the visual stays in
 * perfect lockstep with what the synth is actually playing.
 *
 * The visual is a glowing PIANO-ROLL / note-rain rendered by a single fullscreen
 * pixel shader on your real GPU: note bars fall from the top toward a bright "strike
 * line" near the bottom, igniting with a bloom the instant their NoteOn fires,
 * color-coded by channel (pad/arp/lead/bass), trailing soft glow, over an 88-key
 * keyboard strip whose keys light up while held. Fills the primary monitor.
 *
 * Degrades gracefully: if no MIDI output device is present the visual still runs
 * (silent), driven by the same schedule.
 *
 * @bun-win32 / engine APIs: createWindow, createDevice, compile, makeVertexShader/
 * makePixelShader, makeConstantBuffer/updateConstantBuffer, makeStructuredBuffer
 * (cpuWritable SRV), updateDynamicBuffer, setRenderTargets/setViewport/clear/
 * drawFullscreenTriangle, vsSet/psSet, present, comRelease; Winmm.midiOutOpen/
 * midiOutShortMsg/midiOutReset/midiOutClose/midiOutGetNumDevs; User32.GetSystemMetrics;
 * GDI32 HUD; captureBackBuffer for the gallery screenshot.
 *
 * Run: bun run packages/all/example/midi-music.ts
 */

import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

import { GDI32, User32, Winmm } from '../index';
import { MIDI_MAPPER, type HMIDIOUT } from '@bun-win32/winmm';

import * as gpu from './_gpu';
import * as hud from './_hud';
import { captureBackBuffer, formatGrid } from './_snapshot';

const TRANSPARENT_BK = 1;
const SM_CXSCREEN = 0;
const SM_CYSCREEN = 1;

// ── Musical layout ────────────────────────────────────────────────────────────
// Visible note range for the piano-roll (MIDI note numbers).
const LOW_NOTE = 33; // A1
const HIGH_NOTE = 96; // C7
const NOTE_SPAN = HIGH_NOTE - LOW_NOTE + 1;

// How many beats of "lookahead" the roll shows above the strike line.
const ROLL_BEATS = 8;

// Channels (0-based). GM program per channel chosen at startup.
const CH_PAD = 0;
const CH_ARP = 1;
const CH_LEAD = 2;
const CH_BASS = 3;

// GPU note-event ring capacity (active + recent + upcoming bars on screen).
const MAX_EVENTS = 512;
const EVENT_STRIDE = 16; // float4: note, channel, startBeat, endBeat

// ── Fullscreen-triangle vertex shader (no vertex buffer) ───────────────────────
const VS_SOURCE = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;
  o.pos = float4(p * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return o;
}
`;

// ── Pixel shader: glowing piano-roll / note-rain ───────────────────────────────
const PS_SOURCE = `
cbuffer Frame : register(b0) {
  float2 iResolution;
  float  iTime;
  float  iNowBeat;     // current transport position in beats
  float  iRollBeats;   // beats visible above the strike line
  float  iLowNote;
  float  iSpan;        // HIGH-LOW+1
  float  iEventCount;
};

struct NoteEvent { float note; float channel; float startBeat; float endBeat; };
StructuredBuffer<NoteEvent> Events : register(t0);

static const float STRIKE_Y = 0.80;   // screen-y (0=top) of the strike line
static const float KEYS_TOP  = 0.84;   // keyboard strip occupies bottom band

// Channel palette (pad / arp / lead / bass).
float3 chanColor(int c) {
  if (c == 0) return float3(0.35, 0.55, 1.00); // pad   — cool blue
  if (c == 1) return float3(0.30, 1.00, 0.78); // arp   — aqua/teal
  if (c == 2) return float3(1.00, 0.55, 0.85); // lead  — magenta/pink
  return float3(1.00, 0.78, 0.28);             // bass  — amber
}

// Map a MIDI note to a horizontal lane center in [0,1].
float noteX(float note) {
  return (note - iLowNote + 0.5) / iSpan;
}

float lanW() { return 1.0 / iSpan; }

// Is this MIDI note a black key (for the keyboard strip)?
bool isBlack(int n) {
  int pc = ((n % 12) + 12) % 12;
  return pc == 1 || pc == 3 || pc == 6 || pc == 8 || pc == 10;
}

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 res = max(iResolution, float2(1.0, 1.0));
  float2 q = fragPos.xy / res;        // 0..1, q.y down

  // ── Background: deep vertical gradient + faint vertical lane grid ────────────
  float3 col = lerp(float3(0.015, 0.02, 0.05), float3(0.05, 0.03, 0.09), q.y);
  // subtle scanline shimmer
  col += 0.012 * sin(q.y * res.y * 0.5 + iTime * 2.0);

  // Lane separators: brighten the C-note octave boundaries faintly.
  {
    float n = iLowNote + q.x * iSpan;
    int ni = int(floor(n));
    int pc = ((ni % 12) + 12) % 12;
    float edge = 1.0 - smoothstep(0.0, lanW() * 0.18, frac(n));
    if (pc == 0) col += float3(0.10, 0.12, 0.18) * edge * 0.6; // octave C
  }

  int count = int(iEventCount);
  float beatsAbove = iRollBeats;

  // ── Note bars: each event is a falling rounded bar in its lane ───────────────
  // y position: a note whose startBeat == now sits at the strike line; future
  // notes are above it (smaller q.y), and it scrolls down as time passes.
  for (int i = 0; i < count; i++) {
    NoteEvent e = Events[i];
    int ch = int(e.channel);
    float cx = noteX(e.note);
    float halfW = lanW() * 0.42;
    float dx = abs(q.x - cx);
    if (dx > halfW * 2.2) continue;        // far outside lane: skip cheaply

    // Beats-until-strike for the head (start) and tail (end) of the note.
    float dStart = e.startBeat - iNowBeat; // >0 = still falling toward strike
    float dEnd   = e.endBeat   - iNowBeat;
    // Convert beat-offset to screen-y. dt=beatsAbove -> top(0). dt=0 -> STRIKE_Y.
    // dt<0 (already struck) keeps falling below the strike line and fades.
    float yHead = STRIKE_Y * (1.0 - dStart / beatsAbove);
    float yTail = STRIKE_Y * (1.0 - dEnd   / beatsAbove);
    float yTop = min(yHead, yTail);
    float yBot = max(yHead, yTail);

    float3 base = chanColor(ch);

    // Rounded-bar body mask.
    float inY = smoothstep(0.012, 0.0, max(0.0, max(yTop - q.y, q.y - yBot)));
    float inX = smoothstep(halfW, halfW * 0.55, dx);
    float body = inX * inY;

    // Soft horizontal glow around the lane.
    float glow = exp(-pow(dx / (halfW * 1.7), 2.0)) * inY * 0.6;

    // Ignite hard right at the strike line (NoteOn moment) + a vertical bloom there.
    float playing = (iNowBeat >= e.startBeat && iNowBeat <= e.endBeat) ? 1.0 : 0.0;
    float strikeProx = exp(-pow((q.y - STRIKE_Y) / 0.05, 2.0));
    float ignite = playing * strikeProx;

    // Notes that already passed the strike line fade as they fall away.
    float passed = smoothstep(0.0, 0.18, iNowBeat - e.startBeat);
    float aliveFade = playing > 0.5 ? 1.0 : (1.0 - passed * 0.85);

    float3 contrib = base * (body * 1.15 + glow) * aliveFade;
    contrib += base * ignite * 2.4;                 // hot core at strike
    contrib += float3(1.0, 0.95, 0.85) * ignite * playing * 1.2; // white-hot flash
    col += contrib;
  }

  // ── Strike line: a bright horizontal beam where notes trigger ────────────────
  {
    float d = abs(q.y - STRIKE_Y);
    float beam = exp(-pow(d / 0.006, 2.0));
    float halo = exp(-pow(d / 0.05, 2.0)) * 0.25;
    // pulse on the beat
    float beatPulse = 0.5 + 0.5 * cos(frac(iNowBeat) * 6.2831853);
    col += float3(0.9, 0.95, 1.0) * (beam * (0.6 + 0.6 * beatPulse) + halo);
  }

  // ── Keyboard strip along the bottom: keys light up while their note plays ────
  if (q.y > KEYS_TOP) {
    float n = iLowNote + q.x * iSpan;
    int ni = int(floor(n));
    float keyShade = isBlack(ni) ? 0.06 : 0.30;
    float3 key = float3(keyShade, keyShade, keyShade * 1.05);
    // key edges
    float edge = smoothstep(0.0, lanW() * 0.12, abs(frac(n) - 0.5) - (0.5 - lanW()*0.45));
    key *= lerp(1.0, 0.4, edge);

    // light any key that has a currently-playing event.
    float3 lit = float3(0,0,0);
    for (int j = 0; j < count; j++) {
      NoteEvent e = Events[j];
      if (int(e.note) == ni && iNowBeat >= e.startBeat && iNowBeat <= e.endBeat) {
        lit += chanColor(int(e.channel)) * 1.6;
      }
    }
    float band = smoothstep(KEYS_TOP, KEYS_TOP + 0.005, q.y);
    col = lerp(col, key + lit, band);
    // top bezel of the keyboard
    col += float3(0.7, 0.8, 1.0) * exp(-pow((q.y - KEYS_TOP) / 0.004, 2.0)) * 0.5;
  }

  // ── Tonemap + vignette ───────────────────────────────────────────────────────
  col = float3(1.0,1.0,1.0) - exp(-col * 1.3);     // filmic-ish exposure
  col = pow(col, 1.0 / 2.2);
  float vig = pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.14);
  col *= lerp(0.78, 1.04, vig);

  return float4(col, 1.0);
}
`;

// ── MIDI message packing ────────────────────────────────────────────────────
function packMsg(status: number, data1: number, data2: number): number {
  return ((status & 0xff) | ((data1 & 0xff) << 8) | ((data2 & 0xff) << 16)) >>> 0;
}

// ── Generative composer ───────────────────────────────────────────────────────
// A scheduled note that has been (or will be) emitted to the synth and drawn.
interface ScheduledNote {
  note: number;
  channel: number;
  startBeat: number;
  endBeat: number;
  velocity: number;
  noteOnSent: boolean;
  noteOffSent: boolean;
}

// Diatonic scale degrees (major) in semitone offsets from the tonic.
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

/** A relaxed, pleasant chord progression as root scale-degrees (0-based) + chord
 *  type. We voice triads/7ths from the major scale of the chosen key. */
const PROGRESSION = [
  { degree: 0, seventh: true }, // Imaj7
  { degree: 5, seventh: true }, // vi m7
  { degree: 3, seventh: false }, // IV
  { degree: 4, seventh: true }, // V7
];

const TONIC = 60; // C4 reference for chord voicing (transposed by KEY)
const KEY = 2; // D — bright but warm

function scaleNote(degreeFromTonic: number): number {
  // degreeFromTonic can be negative or > 6; wrap with octave shifts.
  const oct = Math.floor(degreeFromTonic / 7);
  const idx = ((degreeFromTonic % 7) + 7) % 7;
  return TONIC + KEY + oct * 12 + MAJOR_SCALE[idx]!;
}

/** Build the chord tones (root position triad/7th) for a progression entry. */
function chordTones(entry: { degree: number; seventh: boolean }): number[] {
  const t = [entry.degree, entry.degree + 2, entry.degree + 4];
  if (entry.seventh) t.push(entry.degree + 6);
  return t.map(scaleNote);
}

function main(): void {
  // ── Fill the primary monitor (borderless). ──────────────────────────────────
  const screenW = User32.GetSystemMetrics(SM_CXSCREEN) || 1920;
  const screenH = User32.GetSystemMetrics(SM_CYSCREEN) || 1080;

  const win = gpu.createWindow({ title: 'MIDI-MUSIC — generative GM synth + note-rain', width: screenW, height: screenH, borderless: true });
  const { w: cw, h: ch } = win.clientSize();
  const g = gpu.createDevice(win.hwnd, { width: cw, height: ch });

  // ── Open the Windows GM synth via MIDI_MAPPER. ───────────────────────────────
  let hmo: HMIDIOUT = 0n;
  let midiOk = false;
  const numDevs = Winmm.midiOutGetNumDevs();
  if (numDevs > 0) {
    const phmo = Buffer.alloc(8);
    const rc = Winmm.midiOutOpen(phmo.ptr!, MIDI_MAPPER, 0n, 0n, 0);
    if (rc === 0) {
      hmo = phmo.readBigUInt64LE(0);
      midiOk = true;
    } else {
      console.log(`midiOutOpen failed (MMRESULT ${rc}) — running silent.`);
    }
  } else {
    console.log('No MIDI output devices — running silent visual.');
  }

  const send = (status: number, d1: number, d2: number): void => {
    if (!midiOk) return;
    Winmm.midiOutShortMsg(hmo, packMsg(status, d1, d2));
  };

  // Assign GM instruments per channel (ProgramChange 0xCn).
  // Pad: Warm Pad(89). Arp: Music Box(10). Lead: Square Lead(80→use 81 Saw? pick 81). Bass: Fingered Bass(33).
  const PROGRAMS: Record<number, number> = {
    [CH_PAD]: 89, // Pad 2 (warm)
    [CH_ARP]: 9, // Glockenspiel — bright sparkle
    [CH_LEAD]: 81, // Lead 2 (sawtooth) — singing
    [CH_BASS]: 33, // Electric Bass (finger)
  };
  for (const c of [CH_PAD, CH_ARP, CH_LEAD, CH_BASS]) {
    send(0xc0 | c, PROGRAMS[c]!, 0);
  }

  // ── Compile shaders. ─────────────────────────────────────────────────────────
  let vs: bigint;
  let ps: bigint;
  let vsCode: gpu.CompiledShader;
  let psCode: gpu.CompiledShader;
  try {
    vsCode = gpu.compile(VS_SOURCE, 'main', 'vs_5_0');
    psCode = gpu.compile(PS_SOURCE, 'main', 'ps_5_0');
    vs = gpu.makeVertexShader(vsCode);
    ps = gpu.makePixelShader(psCode);
  } catch (err) {
    console.error(String((err as Error).message));
    silenceAll();
    if (midiOk) {
      Winmm.midiOutReset(hmo);
      Winmm.midiOutClose(hmo);
    }
    win.destroy();
    process.exit(1);
    return;
  }

  // Constant buffer: float2 res, time, nowBeat, rollBeats, lowNote, span, count = 32 bytes (rounds to 32).
  const CB_SIZE = 32;
  const cb = gpu.makeConstantBuffer(CB_SIZE);
  const cbData = Buffer.alloc(CB_SIZE);

  // Event ring uploaded each frame as a structured-buffer SRV.
  const eventBytes = Buffer.alloc(EVENT_STRIDE * MAX_EVENTS);
  const events = gpu.makeStructuredBuffer({ stride: EVENT_STRIDE, count: MAX_EVENTS, srv: true, cpuWritable: true, initialData: eventBytes });

  // GDI HUD font.
  const hudFont = GDI32.CreateFontW(-20, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, Buffer.from('Consolas\0', 'utf16le').ptr!);

  // ── Transport ────────────────────────────────────────────────────────────────
  const BPM = 96;
  const beatsPerSec = BPM / 60;
  const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;

  // The note schedule: a sliding window of notes around `nowBeat`. We compose
  // bar-by-bar ahead of the transport and prune notes that have scrolled off.
  const scheduled: ScheduledNote[] = [];
  let composedThroughBar = 0; // exclusive: bars [0, composedThroughBar) composed
  const BEATS_PER_BAR = 4;

  // Deterministic RNG so the piece is reproducible (and the capture frame stable-ish).
  let rngState = 0x1234abcd;
  const rng = (): number => {
    rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
    return rngState / 0x7fffffff;
  };

  // Compose one bar (4 beats) of music: pad chord, arpeggio, melody, bass.
  function composeBar(bar: number): void {
    const barStart = bar * BEATS_PER_BAR;
    const entry = PROGRESSION[bar % PROGRESSION.length]!;
    const tones = chordTones(entry);

    // ── Pad: a sustained chord across the whole bar (mid register). ────────────
    for (const t of tones) {
      const note = t; // mid register as voiced
      scheduled.push({ note, channel: CH_PAD, startBeat: barStart + 0.02, endBeat: barStart + BEATS_PER_BAR - 0.05, velocity: 56, noteOnSent: false, noteOffSent: false });
    }

    // ── Bass: root on beat 1, fifth on beat 3, an octave low. ──────────────────
    const root = tones[0]! - 12;
    scheduled.push({ note: root, channel: CH_BASS, startBeat: barStart + 0.0, endBeat: barStart + 1.9, velocity: 80, noteOnSent: false, noteOffSent: false });
    const fifth = tones[2]! - 12;
    scheduled.push({ note: fifth, channel: CH_BASS, startBeat: barStart + 2.0, endBeat: barStart + 3.9, velocity: 74, noteOnSent: false, noteOffSent: false });

    // ── Arpeggio: sixteenth-note arp climbing through chord tones, +1 octave. ──
    const arpTones = tones.map((t) => t + 12);
    const stepsPerBeat = 4; // sixteenths
    const totalSteps = BEATS_PER_BAR * stepsPerBeat;
    for (let s = 0; s < totalSteps; s += 1) {
      // up-and-down pattern through chord tones
      const period = arpTones.length * 2 - 2;
      const ph = period > 0 ? s % period : 0;
      const idx = ph < arpTones.length ? ph : period - ph;
      const note = arpTones[Math.min(arpTones.length - 1, Math.max(0, idx))]!;
      const startB = barStart + s / stepsPerBeat;
      scheduled.push({ note, channel: CH_ARP, startBeat: startB, endBeat: startB + 0.22, velocity: 64 + Math.floor(rng() * 14), noteOnSent: false, noteOffSent: false });
    }

    // ── Lead melody: pick a few diatonic notes per bar with rests, +1-2 oct. ───
    // Melody walks around chord/scale tones, swung rhythm.
    let beat = 0;
    while (beat < BEATS_PER_BAR) {
      const r = rng();
      const dur = r < 0.3 ? 0.5 : r < 0.7 ? 1.0 : 1.5;
      if (rng() > 0.22) {
        // choose a scale degree near the chord root, biased to chord tones
        const useChordTone = rng() < 0.6;
        let note: number;
        if (useChordTone) {
          note = tones[Math.floor(rng() * tones.length)]! + 12;
        } else {
          const deg = entry.degree + Math.floor(rng() * 7) - 1;
          note = scaleNote(deg) + 12;
        }
        // keep lead in a singing register
        while (note < 72) note += 12;
        while (note > 92) note -= 12;
        scheduled.push({ note, channel: CH_LEAD, startBeat: barStart + beat + 0.0, endBeat: barStart + beat + dur * 0.92, velocity: 88 + Math.floor(rng() * 18), noteOnSent: false, noteOffSent: false });
      }
      beat += dur;
    }
  }

  // Prime the first bars.
  for (let b = 0; b < 4; b += 1) composeBar(b);
  composedThroughBar = 4;

  function silenceAll(): void {
    if (!midiOk) return;
    // All-notes-off on every channel (CC 123) + reset.
    for (let c = 0; c < 16; c += 1) Winmm.midiOutShortMsg(hmo, packMsg(0xb0 | c, 123, 0));
  }

  function drawHud(curBeat: number): void {
    hud.draw(g, cw, ch, (dc) => {
      const prevFont = GDI32.SelectObject(dc, hudFont);
      GDI32.SetBkMode(dc, TRANSPARENT_BK);
      const bar = Math.floor(curBeat / BEATS_PER_BAR) + 1;
      const synthLabel = midiOk ? 'Windows GM synth' : 'SILENT (no MIDI device)';
      const line = `MIDI-MUSIC · pure-TS generative · ${synthLabel} · ${BPM} BPM · bar ${bar} · pad/arp/lead/bass`;
      const text = Buffer.from(`${line}\0`, 'utf16le');
      const len = line.length;
      GDI32.SetTextColor(dc, 0x101010);
      GDI32.TextOutW(dc, 25, 23, text.ptr!, len);
      GDI32.SetTextColor(dc, 0x00f0e8ff);
      GDI32.TextOutW(dc, 24, 22, text.ptr!, len);
      GDI32.SelectObject(dc, prevFont);
    });
  }

  console.log('MIDI-MUSIC — generative GM synth performance + GPU note-rain.');
  console.log(`  ${g.driver} · ${g.gpuName} · ${screenW}x${screenH} · MIDI=${midiOk ? 'open' : 'silent'} (${numDevs} devs)`);

  const startTime = performance.now();
  let frames = 0;
  let fps = 0;
  let fpsWindowStart = startTime;

  while (!win.shouldClose()) {
    win.pump();
    if (win.shouldClose()) break;

    const now = performance.now();
    const elapsedSec = (now - startTime) / 1000;
    const nowBeat = elapsedSec * beatsPerSec;
    const curBar = Math.floor(nowBeat / BEATS_PER_BAR);

    // ── Compose ahead so the roll always has lookahead notes. ──────────────────
    while (composedThroughBar < curBar + Math.ceil(ROLL_BEATS / BEATS_PER_BAR) + 1) {
      composeBar(composedThroughBar);
      composedThroughBar += 1;
    }

    // ── Fire NoteOn / NoteOff exactly when the transport crosses each boundary. ─
    for (const ev of scheduled) {
      if (!ev.noteOnSent && nowBeat >= ev.startBeat) {
        send(0x90 | ev.channel, ev.note, ev.velocity);
        ev.noteOnSent = true;
      }
      if (ev.noteOnSent && !ev.noteOffSent && nowBeat >= ev.endBeat) {
        send(0x80 | ev.channel, ev.note, 0);
        ev.noteOffSent = true;
      }
    }

    // ── Prune notes that have fully scrolled below the strike line. ────────────
    // A note is gone once its end is well in the past (so it scrolled off screen).
    const pruneBefore = nowBeat - ROLL_BEATS * 0.45;
    for (let i = scheduled.length - 1; i >= 0; i -= 1) {
      if (scheduled[i]!.endBeat < pruneBefore) scheduled.splice(i, 1);
    }

    // ── Pack the visible events into the structured buffer. ────────────────────
    // Show notes within [now - lookback, now + ROLL_BEATS].
    const visStart = nowBeat - ROLL_BEATS * 0.5;
    const visEnd = nowBeat + ROLL_BEATS;
    let n = 0;
    eventBytes.fill(0);
    for (const ev of scheduled) {
      if (n >= MAX_EVENTS) break;
      if (ev.endBeat < visStart || ev.startBeat > visEnd) continue;
      const o = n * EVENT_STRIDE;
      eventBytes.writeFloatLE(ev.note, o + 0);
      eventBytes.writeFloatLE(ev.channel, o + 4);
      eventBytes.writeFloatLE(ev.startBeat, o + 8);
      eventBytes.writeFloatLE(ev.endBeat, o + 12);
      n += 1;
    }
    gpu.updateDynamicBuffer(events.buffer, eventBytes);

    // ── Build the constant buffer immediately before the draw. ─────────────────
    cbData.writeFloatLE(cw, 0);
    cbData.writeFloatLE(ch, 4);
    cbData.writeFloatLE(elapsedSec, 8);
    cbData.writeFloatLE(nowBeat, 12);
    cbData.writeFloatLE(ROLL_BEATS, 16);
    cbData.writeFloatLE(LOW_NOTE, 20);
    cbData.writeFloatLE(NOTE_SPAN, 24);
    cbData.writeFloatLE(n, 28);
    gpu.updateConstantBuffer(cb, cbData);

    gpu.setRenderTargets([g.backBufferRTV]);
    gpu.setViewport(cw, ch);
    gpu.vsSet(vs);
    gpu.psSet(ps, { cb: [cb], srv: [events.srv!] });
    gpu.drawFullscreenTriangle();

    // Composite the HUD into the back buffer (BEFORE present + capture) so it
    // becomes part of the presented frame and never flickers.
    drawHud(nowBeat);

    const lastFrame = durationMs > 0 && now - startTime >= durationMs;
    if (lastFrame && process.env.SELFSHOT === '1') {
      const shotDir = resolve(import.meta.dir, '..', 'screenshots');
      mkdirSync(shotDir, { recursive: true });
      const stats = captureBackBuffer(g, resolve(shotDir, 'midi-music.selfcheck.png'), { gridW: 48, gridH: 22 });
      console.log(formatGrid(stats));
      console.log(`[shot] ok=${stats.ok} nonBlack=${stats.nonBlackFrac.toFixed(3)} meanLuma=${stats.meanLuma.toFixed(3)} -> ${stats.path}`);
    } else if (lastFrame) {
      const shotDir = resolve(import.meta.dir, '..', 'screenshots');
      mkdirSync(shotDir, { recursive: true });
      const stats = captureBackBuffer(g, resolve(shotDir, 'midi-music.png'), { gridW: 48, gridH: 22 });
      console.log(`[shot] ok=${stats.ok} nonBlack=${stats.nonBlackFrac.toFixed(3)} -> ${stats.path}`);
    }

    g.present(false);

    frames += 1;
    if (now - fpsWindowStart >= 500) {
      fps = Math.round((frames * 1000) / (now - fpsWindowStart));
      frames = 0;
      fpsWindowStart = now;
    }

    if (lastFrame) break;
  }

  console.log(`MIDI-MUSIC done · ${fps} fps · ${g.driver} · ${g.gpuName}`);

  // ── Teardown ──────────────────────────────────────────────────────────────
  silenceAll();
  if (midiOk) {
    Winmm.midiOutReset(hmo);
    Winmm.midiOutClose(hmo);
  }
  hud.release();
  GDI32.DeleteObject(hudFont);
  comReleaseSafe(cb);
  comReleaseSafe(events.srv);
  comReleaseSafe(events.buffer);
  comReleaseSafe(ps);
  comReleaseSafe(vs);
  if (vsCode) gpu.blobRelease(vsCode.blob);
  if (psCode) gpu.blobRelease(psCode.blob);
  comReleaseSafe(g.backBufferRTV);
  comReleaseSafe(g.swapChain);
  comReleaseSafe(g.context);
  comReleaseSafe(g.device);
  win.destroy();
  process.exit(0);
}

function comReleaseSafe(ptr: bigint | undefined): void {
  if (ptr !== undefined && ptr !== 0n) gpu.comRelease(ptr);
}

process.on('SIGINT', () => process.exit(0));
process.on('uncaughtException', (e) => {
  console.error(e);
  process.exit(1);
});

main();
