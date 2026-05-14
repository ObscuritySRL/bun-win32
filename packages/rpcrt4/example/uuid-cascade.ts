/**
 * UUID Cascade
 *
 * A live, animated terminal dashboard that generates UUIDs continuously and
 * visualizes them three ways: a falling "matrix rain" of hex digits colored
 * by nibble value, a rolling list of the most-recent UUIDs in canonical form,
 * and a per-byte entropy histogram showing the distribution of each of the
 * sixteen UUID bytes across thousands of samples. Cancel with Ctrl+C.
 *
 * APIs demonstrated:
 *   - UuidCreate                   (random v4 UUID generation)
 *   - UuidCreateSequential         (sequential v1-style UUID generation)
 *   - UuidToStringW                (UUID → wide-string canonical form)
 *   - UuidHash                     (16-bit hash of a UUID)
 *   - RpcStringFreeW               (free the RPC-allocated wide string)
 *
 * Run: bun run example/uuid-cascade.ts
 */
import Rpcrt4 from '../index';
import { read, toArrayBuffer, type Pointer } from 'bun:ffi';

Rpcrt4.Preload(['UuidCreate', 'UuidCreateSequential', 'UuidToStringW', 'UuidHash', 'RpcStringFreeW']);

const ESC = '\x1b[';
const HIDE_CURSOR = `${ESC}?25l`;
const SHOW_CURSOR = `${ESC}?25h`;
const CLEAR_SCREEN = `${ESC}2J${ESC}H`;
const RESET = `${ESC}0m`;

process.stdout.write(HIDE_CURSOR + CLEAR_SCREEN);
process.on('SIGINT', () => {
  process.stdout.write(SHOW_CURSOR + RESET + '\n');
  process.exit(0);
});

const columns = process.stdout.columns || 100;
const rows = process.stdout.rows || 32;
const reservedHeader = 2;
const reservedFooter = 11;
const rainHeight = Math.max(8, rows - reservedHeader - reservedFooter);
const rainWidth = columns - 2;

const rainColumnCount = Math.max(8, Math.floor(rainWidth / 2));
const rainBuffer: string[][] = Array.from({ length: rainHeight }, () => Array(rainColumnCount).fill(' '));
const rainColor: number[][] = Array.from({ length: rainHeight }, () => Array(rainColumnCount).fill(0));

const recentUuids: string[] = [];
const recentCapacity = 6;

const byteHistogram: number[] = Array(16).fill(0);
let uuidCount = 0;
let sequentialCount = 0;

const uuidBuf = Buffer.alloc(16);
const stringPtrOut = Buffer.alloc(8);
const statusBuf = Buffer.alloc(4);

function uuidToCanonical(buffer: Buffer): string {
  Rpcrt4.UuidToStringW(buffer.ptr!, stringPtrOut.ptr!);
  const strPtr = read.ptr(stringPtrOut.ptr!) as Pointer;
  const text = new TextDecoder('utf-16').decode(toArrayBuffer(strPtr, 0, 80)).replace(/\0.*$/, '');
  Rpcrt4.RpcStringFreeW(stringPtrOut.ptr!);
  return text;
}

function nibbleColor(nibble: number): number {
  // 256-color palette: blend cyan -> magenta -> yellow across nibble values
  const palette = [22, 28, 34, 40, 46, 47, 51, 87, 123, 159, 195, 213, 207, 201, 165, 129];
  return palette[nibble & 0x0f]!;
}

function dropDown() {
  for (let row = rainHeight - 1; row > 0; row--) {
    for (let col = 0; col < rainColumnCount; col++) {
      rainBuffer[row]![col] = rainBuffer[row - 1]![col]!;
      rainColor[row]![col] = rainColor[row - 1]![col]!;
    }
  }
}

function paintTopRow(uuid: Buffer) {
  // Each column receives one nibble from the rolling UUID stream
  for (let col = 0; col < rainColumnCount; col++) {
    const byteIndex = col % 16;
    const byte = uuid[byteIndex]!;
    // Alternate high and low nibbles across columns
    const nibble = (col & 1) === 0 ? byte >> 4 : byte & 0x0f;
    rainBuffer[0]![col] = nibble.toString(16);
    rainColor[0]![col] = nibbleColor(nibble);
  }
}

function renderHeader(): string {
  const title = ' UUID Cascade — bun:ffi via rpcrt4.dll ';
  const pad = Math.max(0, Math.floor((columns - title.length) / 2));
  const titleLine = ' '.repeat(pad) + `\x1b[1;97m${title}${RESET}`;
  const subtitle = `\x1b[2mUuidCreate + UuidCreateSequential + UuidToStringW + UuidHash${RESET}`;
  const subPad = Math.max(0, Math.floor((columns - 64) / 2));
  return `${ESC}H${titleLine}\n${' '.repeat(subPad)}${subtitle}\n`;
}

function renderRain(): string {
  let out = '';
  for (let row = 0; row < rainHeight; row++) {
    out += `${ESC}${reservedHeader + 1 + row};1H`;
    for (let col = 0; col < rainColumnCount; col++) {
      const ch = rainBuffer[row]![col]!;
      const color = rainColor[row]![col]!;
      const brightness = Math.max(0, 1 - row / rainHeight);
      const dim = brightness < 0.45 ? '\x1b[2m' : '';
      out += `${dim}${ESC}38;5;${color}m${ch} ${RESET}`;
    }
  }
  return out;
}

function renderFooter(latestRandom: Buffer, latestSequential: Buffer): string {
  const startRow = reservedHeader + rainHeight + 1;
  let out = `${ESC}${startRow};1H${ESC}0K`;
  out += `\x1b[1;96m  ━━ Recent UUIDs ━━${RESET}\n${ESC}0K\n`;

  for (let i = 0; i < recentCapacity; i++) {
    const uuid = recentUuids[i];
    const tag = i === 0 ? '\x1b[93m●\x1b[0m' : '\x1b[2m∘\x1b[0m';
    if (uuid) {
      const colored = uuid.replace(/[0-9a-f]/g, (ch) => `\x1b[38;5;${nibbleColor(parseInt(ch, 16))}m${ch}\x1b[0m`);
      out += `${ESC}0K  ${tag} ${colored}\n`;
    } else {
      out += `${ESC}0K\n`;
    }
  }

  // Per-byte distribution sparkline (bars based on mean byte value 0..255)
  const sparkChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  let dist = `${ESC}0K\n${ESC}0K  \x1b[1;96m━━ Byte means ━━${RESET}  `;
  for (let i = 0; i < 16; i++) {
    const mean = uuidCount === 0 ? 0 : byteHistogram[i]! / uuidCount;
    const idx = Math.min(7, Math.floor((mean / 255) * 8));
    const palette = 39 + Math.floor((mean / 255) * 200);
    dist += `\x1b[38;5;${palette}m${sparkChars[idx]}\x1b[0m`;
  }

  out += dist;
  out += `\n${ESC}0K\n${ESC}0K  \x1b[2mrandom=${uuidCount.toString().padStart(6)}  sequential=${sequentialCount.toString().padStart(6)}  random.last hash=${Rpcrt4.UuidHash(latestRandom.ptr!, statusBuf.ptr!).toString(16).padStart(4, '0')}  Ctrl+C to exit${RESET}`;

  return out;
}

let lastSequential = Buffer.alloc(16);
let lastRandom = Buffer.alloc(16);
Rpcrt4.UuidCreateSequential(lastSequential.ptr!);
Rpcrt4.UuidCreate(lastRandom.ptr!);

const intervalMs = 90;
const interval = setInterval(() => {
  Rpcrt4.UuidCreate(uuidBuf.ptr!);
  uuidCount++;
  for (let i = 0; i < 16; i++) byteHistogram[i]! += uuidBuf[i]!;

  dropDown();
  paintTopRow(uuidBuf);

  const canonical = uuidToCanonical(uuidBuf);
  recentUuids.unshift(canonical);
  if (recentUuids.length > recentCapacity) recentUuids.length = recentCapacity;
  lastRandom = Buffer.from(uuidBuf);

  // Every 5th tick, also produce a sequential UUID
  if (uuidCount % 5 === 0) {
    Rpcrt4.UuidCreateSequential(lastSequential.ptr!);
    sequentialCount++;
  }

  let frame = renderHeader();
  frame += renderRain();
  frame += renderFooter(lastRandom, lastSequential);
  process.stdout.write(frame);
}, intervalMs);

// Auto-stop after a comfortable demo length
setTimeout(() => {
  clearInterval(interval);
  process.stdout.write(SHOW_CURSOR + RESET);
  process.stdout.write(`\n${ESC}${reservedHeader + rainHeight + reservedFooter + 1};1H\n`);
}, 18_000);
