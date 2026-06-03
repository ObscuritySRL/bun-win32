/**
 * gba-tty — a from-scratch Game Boy Advance emulator that plays in the terminal.
 * The 240×160 display is drawn with half-block truecolor "pixels" via the shared
 * _term renderer; the ARM7TDMI CPU + memory bus + PPU live in gba-arm7.ts /
 * gba-bus.ts / gba-ppu.ts. Real key down/up comes from the Win32 console input
 * API for an authentic held D-pad; Flash saves persist to <rom>.sav.
 *
 * No copyrighted BIOS is used — the handful of BIOS SWIs games rely on are
 * high-level-emulated. Bring your own legally-dumped .gba ROM.
 *
 * Controls: arrows = D-pad · Z = A · X = B · Enter = Start · RShift = Select ·
 * A = L · S = R · Tab = turbo · P = pause · Esc = quit. XInput pad works too.
 *
 * Run: bun run packages/all/example/gba-tty.ts <path-to-rom.gba>
 */
import { dlopen } from 'bun:ffi';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

import { Kernel32, Xinput1_4 } from '../index';
import { STD_HANDLE } from '@bun-win32/kernel32';

import * as audio from './_audio';
import { Term, makeFrameWaiter, encodePNG } from './_term';
import { Gba, type GbaButtons } from './gba-bus';
import { GbaApu } from './gba-apu';
import { GBA_W, GBA_H } from './gba-ppu';

const BEZEL: readonly [number, number, number] = [10, 12, 18];
const SYNC_BEGIN = '\x1b[?2026h';
const SYNC_END = '\x1b[?2026l';

// Virtual-key codes.
const VK = {
  LEFT: 0x25, UP: 0x26, RIGHT: 0x27, DOWN: 0x28,
  Z: 0x5a, X: 0x58, A: 0x41, S: 0x53, RETURN: 0x0d, RSHIFT: 0xa1,
  CONTROL: 0x11, ESC: 0x1b, P: 0x50, M: 0x4d, TAB: 0x09, C: 0x43,
} as const;

const ENABLE_PROCESSED_INPUT = 0x0001, ENABLE_LINE_INPUT = 0x0002, ENABLE_ECHO_INPUT = 0x0004,
  ENABLE_WINDOW_INPUT = 0x0008, ENABLE_MOUSE_INPUT = 0x0010, ENABLE_VIRTUAL_TERMINAL_INPUT = 0x0200;

interface InputSource { ok: boolean; held: Set<number>; pressed: number[]; poll(): void; restore(): void }

/** Win32 console held-state input (real key down/up via ReadConsoleInputW). */
function setupWin32Input(): InputSource | null {
  try {
    const k = dlopen('kernel32.dll', {
      GetStdHandle: { args: ['u32'], returns: 'ptr' },
      GetConsoleMode: { args: ['ptr', 'ptr'], returns: 'i32' },
      SetConsoleMode: { args: ['ptr', 'u32'], returns: 'i32' },
      GetNumberOfConsoleInputEvents: { args: ['ptr', 'ptr'], returns: 'i32' },
      ReadConsoleInputW: { args: ['ptr', 'ptr', 'u32', 'ptr'], returns: 'i32' },
      FlushConsoleInputBuffer: { args: ['ptr'], returns: 'i32' },
    });
    const hIn = k.symbols.GetStdHandle(0xfffffff6);
    const saved = Buffer.alloc(4);
    if (!k.symbols.GetConsoleMode(hIn, saved.ptr!)) return null;
    const savedMode = saved.readUInt32LE(0);
    const raw = savedMode & ~(ENABLE_LINE_INPUT | ENABLE_ECHO_INPUT | ENABLE_PROCESSED_INPUT |
      ENABLE_VIRTUAL_TERMINAL_INPUT | ENABLE_MOUSE_INPUT | ENABLE_WINDOW_INPUT);
    k.symbols.SetConsoleMode(hIn, raw >>> 0);
    k.symbols.FlushConsoleInputBuffer(hIn);
    const REC = 20, N = 64;
    const buf = Buffer.alloc(REC * N), countBuf = Buffer.alloc(4), readBuf = Buffer.alloc(4);
    const held = new Set<number>();
    const pressed: number[] = [];
    return {
      ok: true, held, pressed,
      poll(): void {
        for (;;) {
          if (!k.symbols.GetNumberOfConsoleInputEvents(hIn, countBuf.ptr!)) break;
          const avail = countBuf.readUInt32LE(0);
          if (avail === 0) break;
          const want = Math.min(N, avail);
          if (!k.symbols.ReadConsoleInputW(hIn, buf.ptr!, want, readBuf.ptr!)) break;
          const got = readBuf.readUInt32LE(0);
          for (let i = 0; i < got; i += 1) {
            const o = i * REC;
            if (buf.readUInt16LE(o) !== 1) continue;
            const down = buf.readInt32LE(o + 4) !== 0;
            const vk = buf.readUInt16LE(o + 10);
            if (down) { if (!held.has(vk)) pressed.push(vk); held.add(vk); } else held.delete(vk);
          }
          if (got < want) break;
        }
      },
      restore(): void { k.symbols.SetConsoleMode(hIn, savedMode >>> 0); },
    };
  } catch { return null; }
}

/** ANSI autorepeat-decay fallback for piped/non-conhost stdin. */
function setupAnsiInput(): InputSource {
  const held = new Set<number>();
  const pressed: number[] = [];
  const expiry = new Map<number, number>();
  const now = (): number => Bun.nanoseconds() / 1e6;
  const press = (vk: number): void => { if (!held.has(vk)) pressed.push(vk); held.add(vk); expiry.set(vk, now() + 150); };
  const stdin = process.stdin;
  let rawOn = false;
  const onData = (data: Buffer): void => {
    const s = data.toString('latin1');
    for (let i = 0; i < s.length; i += 1) {
      const ch = s[i]!, code = s.charCodeAt(i);
      if (code === 27 && s[i + 1] === '[') {
        const a = s[i + 2];
        if (a === 'A') press(VK.UP); else if (a === 'B') press(VK.DOWN);
        else if (a === 'C') press(VK.RIGHT); else if (a === 'D') press(VK.LEFT);
        i += 2; continue;
      }
      if (code === 27) { press(VK.ESC); continue; }
      if (code === 3) { press(VK.CONTROL); press(VK.C); continue; }
      if (code === 13) { press(VK.RETURN); continue; }
      if (code === 127 || code === 8) { press(VK.RSHIFT); continue; }
      if (code === 9) { press(VK.TAB); continue; }
      const up = ch.toUpperCase();
      if (up === 'Z') press(VK.Z); else if (up === 'X') press(VK.X);
      else if (up === 'A') press(VK.A); else if (up === 'S') press(VK.S);
      else if (up === 'P') press(VK.P);
    }
  };
  try { if (stdin.isTTY) { stdin.setRawMode(true); rawOn = true; } stdin.resume(); stdin.on('data', onData); } catch { /* ignore */ }
  return {
    ok: false, held, pressed,
    poll(): void { const t = now(); for (const [vk, when] of expiry) if (t >= when) { held.delete(vk); expiry.delete(vk); } },
    restore(): void { try { stdin.removeListener('data', onData); if (rawOn) stdin.setRawMode(false); stdin.pause(); } catch { /* ignore */ } },
  };
}

const xinputBuf = Buffer.alloc(16);
function readButtons(src: InputSource): GbaButtons {
  const h = src.held;
  let right = h.has(VK.RIGHT), left = h.has(VK.LEFT), up = h.has(VK.UP), down = h.has(VK.DOWN);
  let a = h.has(VK.Z), b = h.has(VK.X), start = h.has(VK.RETURN), select = h.has(VK.RSHIFT);
  let l = h.has(VK.A), r = h.has(VK.S);
  if (Xinput1_4.XInputGetState(0, xinputBuf.ptr!) === 0) {
    const btn = xinputBuf.readUInt16LE(4);
    const lx = xinputBuf.readInt16LE(8), ly = xinputBuf.readInt16LE(10), DZ = 7849;
    if (btn & 0x1000) a = true; if (btn & 0x2000) b = true;
    if (btn & 0x0010) start = true; if (btn & 0x0020) select = true;
    if (btn & 0x0100) l = true; if (btn & 0x0200) r = true;
    if ((btn & 0x0001) || ly > DZ) up = true; if ((btn & 0x0002) || ly < -DZ) down = true;
    if ((btn & 0x0004) || lx < -DZ) left = true; if ((btn & 0x0008) || lx > DZ) right = true;
  }
  return { a, b, select, start, right, left, up, down, r, l };
}

/** Nearest-neighbour scale-to-fit + center the 240×160 RGBA frame into Term. */
function blitToTerm(t: Term, frame: Uint8Array): void {
  const W = t.W, H = t.H;
  let scale = Math.min(W / GBA_W, H / GBA_H);
  if (scale >= 1) scale = Math.floor(scale);
  if (scale <= 0) scale = Math.min(W / GBA_W, H / GBA_H);
  const dw = Math.max(1, Math.floor(GBA_W * scale)), dh = Math.max(1, Math.floor(GBA_H * scale));
  const ox = ((W - dw) / 2) | 0, oy = ((H - dh) / 2) | 0;
  t.clear(BEZEL[0], BEZEL[1], BEZEL[2]);
  const inv = 1 / scale;
  for (let y = 0; y < dh; y += 1) {
    let gy = (y * inv) | 0; if (gy >= GBA_H) gy = GBA_H - 1;
    const rowG = gy * GBA_W, rowT = oy + y;
    for (let x = 0; x < dw; x += 1) {
      let gx = (x * inv) | 0; if (gx >= GBA_W) gx = GBA_W - 1;
      const o = (rowG + gx) * 4;
      t.setPixel(ox + x, rowT, frame[o]!, frame[o + 1]!, frame[o + 2]!);
    }
  }
}

function romTitle(rom: Uint8Array): string {
  let s = '';
  for (let a = 0xa0; a < 0xac; a += 1) { const c = rom[a] ?? 0; if (c === 0) break; if (c >= 32 && c < 127) s += String.fromCharCode(c); }
  return s.trim();
}

function resolveRom(): { rom: Uint8Array; title: string; path: string } {
  const sel = (process.argv[2] ?? process.env.GBA_ROM ?? '').trim();
  if (!sel) {
    console.error('usage: bun run gba-tty.ts <path-to-rom.gba>\n(no ROM is bundled — bring your own legally-dumped cartridge)');
    process.exit(1);
  }
  const file = readFileSync(sel);
  const rom = new Uint8Array(file.buffer, file.byteOffset, file.byteLength);
  return { rom, title: romTitle(rom) || basename(sel), path: sel };
}

function drawHud(t: Term, title: string, info: string): void {
  const line = `GBA ${title}  ${info}`;
  const w = Math.min(t.W - 2, Term.textWidth(line) + 5);
  t.plate(1, 1, w, 11, 0.4);
  t.text(3, 3, line, 150, 200, 235, 1);
}

function runCapture(gba: Gba, title: string): void {
  const cols = Math.max(20, Number(process.env.TERM_COLS ?? 240) | 0);
  const rows = Math.max(8, Number(process.env.TERM_ROWS ?? 80) | 0);
  const frames = Math.max(1, Number(process.env.CAPTURE_FRAMES_RUN ?? 900) | 0);
  const t = new Term(cols, rows);
  for (let i = 0; i < frames; i += 1) gba.runFrame();
  blitToTerm(t, gba.frame);
  drawHud(t, title, 'pure-TS GBA · terminal');
  const out = process.env.CAPTURE_PNG!;
  writeFileSync(out, encodePNG(t.buf, t.W, t.H));
  let nonBlack = 0, lumaSum = 0;
  const n = t.buf.length / 3;
  for (let i = 0; i < t.buf.length; i += 3) { const L = t.buf[i]! * 0.299 + t.buf[i + 1]! * 0.587 + t.buf[i + 2]! * 0.114; lumaSum += L; if (L > 8) nonBlack += 1; }
  console.log(`[shot] ok=true nonBlack=${(nonBlack / n).toFixed(3)} meanLuma=${(lumaSum / n / 255).toFixed(3)} -> ${out}`);
}

async function main(): Promise<void> {
  const { rom, title, path } = resolveRom();
  const gba = new Gba();
  const AUDIO_RATE = 48000;
  const AUDIO_TARGET = 6; // ~100 ms XAudio2 cushion so jitter never starves the stream
  gba.apu = new GbaApu(AUDIO_RATE);
  gba.loadRom(rom);

  if (process.env.CAPTURE_PNG) { runCapture(gba, title); return; }

  const pcm = audio.createPcmOutput({ sampleRate: AUDIO_RATE, channels: 2 });
  let muted = false;
  const feedAudio = (): void => {
    if (!gba.apu) return;
    if (pcm.available && !muted) {
      if (pcm.queued() < AUDIO_TARGET) { const b = gba.apu.drain(AUDIO_RATE); if (b.length) pcm.submit(b); }
    } else { gba.apu.drain(AUDIO_RATE); }
  };
  if (pcm.available) {
    pcm.setVolume(0.6);
    for (let i = 0; i < AUDIO_TARGET; i += 1) { gba.runFrame(); const b = gba.apu.drain(AUDIO_RATE); if (b.length) pcm.submit(b); }
    pcm.start();
  }

  const savePath = `${path}.sav`;
  if (existsSync(savePath)) {
    try { const f = readFileSync(savePath); gba.loadSaveData(new Uint8Array(f.buffer, f.byteOffset, f.byteLength)); } catch { /* ignore */ }
  }
  let saving = false;
  const autoSave = (): void => {
    if (saving) return; saving = true;
    Bun.write(savePath, gba.getSaveData()).catch(() => { /* ignore */ }).finally(() => { saving = false; });
  };
  const writeSaveSync = (): void => { try { writeFileSync(savePath, gba.getSaveData()); } catch { /* ignore */ } };

  Kernel32.Preload(['GetStdHandle', 'GetConsoleMode', 'SetConsoleMode', 'GetConsoleOutputCP', 'SetConsoleOutputCP', 'GetConsoleScreenBufferInfo']);
  const hOut = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
  const omBuf = Buffer.alloc(4); Kernel32.GetConsoleMode(hOut, omBuf.ptr);
  const savedOut = omBuf.readUInt32LE(0);
  Kernel32.SetConsoleMode(hOut, (savedOut | 0x0001 | 0x0004) >>> 0);
  const savedCp = Kernel32.GetConsoleOutputCP(); Kernel32.SetConsoleOutputCP(65001);
  process.stdout.write('\x1b[?1049h\x1b[?25l\x1b[?7l\x1b[2J\x1b[H');

  const input = setupWin32Input() ?? setupAnsiInput();
  let paused = false, running = true, restored = false;
  const cleanup = (): void => {
    if (restored) return; restored = true;
    writeSaveSync();
    input.restore();
    process.stdout.write(`${SYNC_END}\x1b[0m\x1b[?7h\x1b[?25h\x1b[?1049l`);
    Kernel32.SetConsoleMode(hOut, savedOut >>> 0); Kernel32.SetConsoleOutputCP(savedCp);
    pcm.close();
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { running = false; });

  const detectSize = (): { cols: number; rows: number } => {
    const csbi = Buffer.alloc(22); let cols = 0, rows = 0;
    if (Kernel32.GetConsoleScreenBufferInfo(hOut, csbi.ptr)) {
      const v = new DataView(csbi.buffer);
      cols = v.getInt16(14, true) - v.getInt16(10, true) + 1;
      rows = v.getInt16(16, true) - v.getInt16(12, true) + 1;
    }
    if (!cols) cols = process.stdout.columns || 160;
    if (!rows) rows = process.stdout.rows || 50;
    return { cols: Math.max(20, Math.min(cols | 0, 400)), rows: Math.max(8, Math.min((rows | 0) - 1, 200)) };
  };

  let sz = detectSize();
  let t = new Term(sz.cols, sz.rows);
  const wait = makeFrameWaiter();
  const FRAME_MS = 1000 / 59.73;
  const durationMs = Number(process.env.DEMO_DURATION_MS ?? 0);
  const t0 = Bun.nanoseconds();
  let fpsEma = 60, nextDue = Bun.nanoseconds() / 1e6, lastSaveMs = 0;

  try {
    while (running) {
      const frameStart = Bun.nanoseconds();
      if (durationMs > 0 && (frameStart - t0) / 1e6 >= durationMs) break;
      const elapsedTotal = (frameStart - t0) / 1e6;
      if (elapsedTotal - lastSaveMs >= 5000) { lastSaveMs = elapsedTotal; autoSave(); }

      sz = detectSize();
      if (sz.cols !== t.cols || sz.rows !== t.rows) { t = new Term(sz.cols, sz.rows); process.stdout.write('\x1b[2J\x1b[H'); }

      input.poll();
      if (input.held.has(VK.ESC) || (input.held.has(VK.CONTROL) && input.held.has(VK.C))) break;
      const turbo = input.held.has(VK.TAB);
      for (const vk of input.pressed) { if (vk === VK.P) paused = !paused; else if (vk === VK.M) muted = !muted; }
      input.pressed.length = 0;

      const nowMs = frameStart / 1e6;
      if (paused) {
        nextDue = nowMs;
      } else if (turbo) {
        gba.setButtons(readButtons(input));
        for (let s = 0; s < 4; s += 1) { gba.runFrame(); gba.apu?.drain(AUDIO_RATE); }
        nextDue = nowMs;
      } else {
        gba.setButtons(readButtons(input));
        let ran = 0;
        while (nowMs >= nextDue && ran < 4) { gba.runFrame(); feedAudio(); nextDue += FRAME_MS; ran += 1; }
        if (ran >= 4) nextDue = nowMs;
      }

      blitToTerm(t, gba.frame);
      drawHud(t, title, `${Math.round(fpsEma)} FPS  ${muted ? 'MUTE' : '♪'}${paused ? '  PAUSE' : ''}${turbo ? '  TURBO' : ''}  Z=A X=B ENT=ST  ESC quit`);
      process.stdout.write(SYNC_BEGIN);
      t.present();
      process.stdout.write(SYNC_END);

      const workMs = (Bun.nanoseconds() - frameStart) / 1e6;
      if (workMs > 0) fpsEma = fpsEma * 0.9 + Math.min(99999, 1000 / workMs) * 0.1;
      if (turbo) { /* flat out */ } else if (paused) { if (wait) wait(FRAME_MS); else await Bun.sleep(FRAME_MS); }
      else { const slack = Math.min(FRAME_MS, nextDue - Bun.nanoseconds() / 1e6); if (slack > 0.2) { if (wait) wait(slack); else await Bun.sleep(slack); } }
      await new Promise<void>((r) => setImmediate(r));
    }
  } finally {
    cleanup();
  }
  process.exit(0);
}

process.on('uncaughtException', (e) => { console.error(e); process.exit(1); });

if (import.meta.main) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
