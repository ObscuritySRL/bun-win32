/**
 * Directory Constellation
 *
 * The local machine's directory tree, rendered as a living orrery. The computer
 * object burns at the center of the screen; every contained ADSI object — each
 * user, group, and service discovered through the WinNT: provider — becomes a
 * planet placed on a ring chosen by its class and an orbit speed seeded from a
 * hash of its name. The whole system is enumerated once, read-only, using the
 * activeds helper trio (ADsBuildEnumerator / ADsEnumerateNext /
 * ADsFreeEnumerator), then animated frame-by-frame with pure ANSI escape codes:
 * no domain, no GUI, just FFI into activeds.dll driving a starfield.
 *
 * APIs demonstrated (Activeds):
 *   - ADsGetObject              (bind WinNT:// computer object → IADsContainer)
 *   - ADsBuildEnumerator        (create IEnumVARIANT over the container)
 *   - ADsEnumerateNext          (pull child objects as VARIANTs)
 *   - ADsFreeEnumerator         (release the enumerator)
 *
 * APIs demonstrated (OleAut32, cross-package):
 *   - VariantInit / VariantClear (initialize / release the per-item VARIANT)
 *   - SysFreeString              (free BSTR returned by IADs property getters)
 *
 * APIs demonstrated (Ole32, cross-package):
 *   - CoInitializeEx / CoUninitialize (apartment lifetime for ADSI COM)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode (enable ANSI VT output)
 *
 * Run: bun run example/directory-constellation.ts
 */
import { CFunction, FFIType, type Pointer, dlopen, read } from 'bun:ffi';

import Activeds from '../index';
import Kernel32 from '@bun-win32/kernel32';

Activeds.Preload(['ADsGetObject', 'ADsBuildEnumerator', 'ADsEnumerateNext', 'ADsFreeEnumerator']);
Kernel32.Preload(['GetStdHandle', 'GetConsoleMode', 'SetConsoleMode']);

const STD_OUTPUT_HANDLE = -11;
const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;
const hStdout = Kernel32.GetStdHandle(STD_OUTPUT_HANDLE);
const modeBuf = Buffer.alloc(4);
if (Kernel32.GetConsoleMode(hStdout, modeBuf.ptr)) {
  Kernel32.SetConsoleMode(hStdout, modeBuf.readUInt32LE(0) | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
}

const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';

const ole32 = dlopen('ole32.dll', {
  CoInitializeEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  CoUninitialize: { args: [], returns: FFIType.void },
});
const oleaut32 = dlopen('oleaut32.dll', {
  VariantInit: { args: [FFIType.ptr], returns: FFIType.void },
  VariantClear: { args: [FFIType.ptr], returns: FFIType.i32 },
  SysFreeString: { args: [FFIType.u64], returns: FFIType.void },
});

const COINIT_APARTMENTTHREADED = 0x2;

function iidIADs(): Buffer {
  const iid = Buffer.alloc(16);
  iid.writeUInt32LE(0xfd8256d0, 0);
  iid.writeUInt16LE(0xfd15, 4);
  iid.writeUInt16LE(0x11ce, 6);
  Buffer.from([0xab, 0xc4, 0x02, 0x60, 0x8c, 0x9e, 0x75, 0x53]).copy(iid, 8);
  return iid;
}

function iidIADsContainer(): Buffer {
  const iid = Buffer.alloc(16);
  iid.writeUInt32LE(0x001677d0, 0);
  iid.writeUInt16LE(0xfd16, 4);
  iid.writeUInt16LE(0x11ce, 6);
  Buffer.from([0xab, 0xc4, 0x02, 0x60, 0x8c, 0x9e, 0x75, 0x53]).copy(iid, 8);
  return iid;
}

const invokers = new Map<string, ReturnType<typeof CFunction>>();

function vcall(thisPtr: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[]): number {
  const vtable = read.u64(Number(thisPtr) as Pointer, 0);
  const method = read.u64(Number(vtable) as Pointer, slot * 8);
  const key = `${method}|${argTypes.join(',')}`;
  let invoke = invokers.get(key);
  if (invoke === undefined) {
    invoke = CFunction({ ptr: Number(method) as Pointer, args: [FFIType.u64, ...argTypes], returns: FFIType.i32 });
    invokers.set(key, invoke);
  }
  return invoke(thisPtr, ...args) as number;
}

const IUNKNOWN_QUERYINTERFACE = 0;
const IUNKNOWN_RELEASE = 2;
const IADS_GET_NAME = 7;
const IADS_GET_CLASS = 8;

function takeBstr(addr: bigint): string {
  if (addr === 0n) return '';
  const byteLen = read.u32(Number(addr - 4n) as Pointer, 0);
  const out = Buffer.alloc(byteLen);
  for (let i = 0; i < byteLen; i++) out[i] = read.u8(Number(addr) as Pointer, i);
  oleaut32.symbols.SysFreeString(addr);
  return out.toString('utf16le');
}

function getStr(pADs: bigint, slot: number): string {
  const pBstr = Buffer.alloc(8);
  const hr = vcall(pADs, slot, [FFIType.ptr], [pBstr.ptr!]);
  if (hr !== 0) return '';
  return takeBstr(pBstr.readBigUInt64LE(0));
}

function queryInterface(pUnk: bigint, iid: Buffer): bigint {
  const out = Buffer.alloc(8);
  const hr = vcall(pUnk, IUNKNOWN_QUERYINTERFACE, [FFIType.ptr, FFIType.ptr], [iid.ptr!, out.ptr!]);
  return hr === 0 ? out.readBigUInt64LE(0) : 0n;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface Body {
  name: string;
  ring: number;
  angle: number;
  speed: number;
  color: string;
  glyph: string;
}

// Per-class visual identity: ring radius factor, color (24-bit), glyph.
const CLASS_STYLE: Record<string, { ring: number; color: string; glyph: string }> = {
  User: { ring: 0.4, color: '\x1b[38;2;120;230;140m', glyph: '◉' },
  Group: { ring: 0.62, color: '\x1b[38;2;240;190;90m', glyph: '◆' },
  Service: { ring: 0.86, color: '\x1b[38;2;120;200;255m', glyph: '•' },
};
const DEFAULT_STYLE = { ring: 0.74, color: '\x1b[38;2;190;150;255m', glyph: '∗' };

const hrInit = ole32.symbols.CoInitializeEx(null, COINIT_APARTMENTTHREADED);
if (hrInit < 0) {
  console.log(`CoInitializeEx failed (0x${(hrInit >>> 0).toString(16)})`);
  process.exit(1);
}

const computerName = process.env.COMPUTERNAME ?? 'localhost';
const path = Buffer.from(`WinNT://${computerName},computer\0`, 'utf16le');
const iidContainer = iidIADsContainer();
const iidAds = iidIADs();
const ppContainer = Buffer.alloc(8);
const hrBind = Activeds.ADsGetObject(path.ptr!, iidContainer.ptr!, ppContainer.ptr!);
const pContainer = ppContainer.readBigUInt64LE(0);

if (hrBind !== 0 || pContainer === 0n) {
  console.log(`Could not bind WinNT://${computerName},computer (0x${(hrBind >>> 0).toString(16)}). ADSI unavailable.`);
  ole32.symbols.CoUninitialize();
  process.exit(0);
}

const bodies: Body[] = [];
const counts: Record<string, number> = {};

const ppEnum = Buffer.alloc(8);
if (Activeds.ADsBuildEnumerator(pContainer, ppEnum.ptr!) === 0) {
  const pEnum = ppEnum.readBigUInt64LE(0);
  const variant = Buffer.alloc(16);
  const fetched = Buffer.alloc(4);
  // Cap the cast to keep the orrery legible on a single screen.
  const MAX_BODIES = 140;
  while (bodies.length < MAX_BODIES) {
    oleaut32.symbols.VariantInit(variant.ptr!);
    const hrNext = Activeds.ADsEnumerateNext(pEnum, 1, variant.ptr!, fetched.ptr!);
    if (hrNext !== 0 || fetched.readUInt32LE(0) === 0) {
      oleaut32.symbols.VariantClear(variant.ptr!);
      break;
    }
    const pDispatch = variant.readBigUInt64LE(8);
    if (pDispatch !== 0n) {
      const pChildAds = queryInterface(pDispatch, iidAds);
      if (pChildAds !== 0n) {
        const name = getStr(pChildAds, IADS_GET_NAME);
        const klass = getStr(pChildAds, IADS_GET_CLASS) || 'Unknown';
        counts[klass] = (counts[klass] ?? 0) + 1;
        const style = CLASS_STYLE[klass] ?? DEFAULT_STYLE;
        const seed = hash(name);
        bodies.push({
          name,
          ring: style.ring,
          angle: ((seed % 360) * Math.PI) / 180,
          speed: 0.12 + ((seed >>> 9) % 100) / 320,
          color: style.color,
          glyph: style.glyph,
        });
        vcall(pChildAds, IUNKNOWN_RELEASE, [], []);
      }
    }
    oleaut32.symbols.VariantClear(variant.ptr!);
  }
  Activeds.ADsFreeEnumerator(pEnum);
}

vcall(pContainer, IUNKNOWN_RELEASE, [], []);
ole32.symbols.CoUninitialize();

const width = Math.max(60, Math.min(process.stdout.columns ?? 100, 110));
const height = Math.max(24, Math.min(process.stdout.rows ?? 34, 40));
const cx = width / 2;
const cy = height / 2;
const maxRadius = Math.min(cx - 2, (cy - 2) * 2.05);

// Static starfield so the moving bodies stand out against a fixed sky.
const stars: Array<[number, number]> = [];
for (let i = 0; i < 70; i++) {
  stars.push([Math.floor(Math.random() * width), Math.floor(Math.random() * height)]);
}

const legend = Object.entries(CLASS_STYLE)
  .map(([k, s]) => `${s.color}${s.glyph}${RESET} ${k} ${DIM}(${counts[k] ?? 0})${RESET}`)
  .join('   ');

process.stdout.write('\x1b[?25l\x1b[2J');

let running = true;
process.on('SIGINT', () => {
  running = false;
});

const FRAMES = 360;
let frame = 0;

function renderFrame(): void {
  // grid[y] is one row; cell holds the styled glyph or a space.
  const grid: string[][] = Array.from({ length: height }, () => Array<string>(width).fill(' '));

  for (const [sx, sy] of stars) {
    if (sx < width && sy < height) grid[sy]![sx] = `${DIM}.${RESET}`;
  }

  for (const b of bodies) {
    const r = b.ring * maxRadius;
    const a = b.angle + b.speed * (frame / 8);
    const px = Math.round(cx + Math.cos(a) * r);
    // Halve vertical extent: terminal cells are ~2:1 tall.
    const py = Math.round(cy + (Math.sin(a) * r) / 2.05);
    if (px >= 0 && px < width && py >= 0 && py < height) {
      grid[py]![px] = `${b.color}${b.glyph}${RESET}`;
    }
  }

  const sun = `\x1b[38;2;255;220;120m${BOLD}★${RESET}`;
  if (cy >= 0 && cy < height && cx >= 0 && cx < width) grid[Math.floor(cy)]![Math.floor(cx)] = sun;

  const lines: string[] = [];
  lines.push(`\x1b[38;2;255;220;120m${BOLD} ★ ${computerName} ${RESET}${DIM}— ${bodies.length} directory objects in orbit (WinNT://)${RESET}`);
  for (let y = 0; y < height; y++) lines.push(grid[y]!.join(''));
  lines.push(`${DIM} ${legend}${RESET}`);
  lines.push(`${DIM} ADsBuildEnumerator → ADsEnumerateNext → ADsFreeEnumerator   ·   Ctrl+C to exit${RESET}`);

  process.stdout.write('\x1b[H' + lines.join('\n'));
}

const timer = setInterval(() => {
  if (!running || frame >= FRAMES) {
    clearInterval(timer);
    process.stdout.write(`${RESET}\x1b[?25h\n\n`);
    console.log(`${BOLD}Constellation complete.${RESET} ${DIM}${bodies.length} objects enumerated read-only from the WinNT: provider.${RESET}\n`);
    process.exit(0);
  }
  renderFrame();
  frame++;
}, 55);
