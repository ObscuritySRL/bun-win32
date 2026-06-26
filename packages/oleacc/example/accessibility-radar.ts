/**
 * Accessibility Radar
 *
 * A live, animated view of the accessibility tree the way a screen reader sees
 * it — following your mouse in real time. Every frame it reads the cursor
 * position and calls the single flat `AccessibleObjectFromPoint` export to grab
 * the deepest `IAccessible` element directly under the pointer, then reads that
 * element's name, role, state, and screen rectangle over the `IAccessible` COM
 * vtable (`get_accName` / `get_accRole` / `get_accState` / `accLocation`). Role
 * and state codes are decoded to text with the flat `GetRoleTextW` /
 * `GetStateTextW` exports. The result is a colored ANSI dashboard: a scaled
 * "radar" of the whole screen with the focused element's bounding box and a
 * cursor blip, the decoded element details, and a rolling role-history strip.
 * Move your mouse over windows, buttons, menus and watch the tree light up.
 *
 * APIs demonstrated:
 *   - Oleacc.AccessibleObjectFromPoint    (screen point → deepest IAccessible)
 *   - Oleacc.GetRoleTextW                 (decode a ROLE_SYSTEM_* value)
 *   - Oleacc.GetStateTextW                (decode a single STATE_SYSTEM_* bit)
 *   - IAccessible::get_accName/Role/State (element properties, COM vtable)
 *   - IAccessible::accLocation            (element screen rectangle, COM vtable)
 *   - IUnknown::Release                   (COM vtable lifetime)
 *
 * APIs demonstrated (ole32, cross-package):
 *   - CoInitialize                        (enter an STA before COM marshaling)
 *
 * APIs demonstrated (user32, cross-package):
 *   - GetCursorPos                        (live pointer position)
 *   - GetSystemMetrics                    (primary screen size for the radar)
 *
 * APIs demonstrated (kernel32, cross-package):
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode (enable ANSI VT output)
 *   - GetCurrentProcess / ReadProcessMemory          (walk native vtables / VARIANTs)
 *
 * Run: bun run example:accessibility-radar
 */

import { FFIType, linkSymbols } from 'bun:ffi';

import Oleacc, { packPOINT, ROLE_SYSTEM } from '../index';
import Kernel32 from '@bun-win32/kernel32';
import Ole32 from '@bun-win32/ole32';
import User32 from '@bun-win32/user32';

const ANSI = {
  bold: '\x1b[1m',
  clearBelow: '\x1b[0J',
  cyan: '\x1b[96m',
  dim: '\x1b[2m',
  eol: '\x1b[K',
  green: '\x1b[92m',
  hideCursor: '\x1b[?25l',
  home: '\x1b[H',
  magenta: '\x1b[95m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
  showCursor: '\x1b[?25h',
  white: '\x1b[97m',
  yellow: '\x1b[93m',
} as const;

const FRAMES = 200;
const FRAME_DELAY_MS = 60;
const RADAR_WIDTH = 56;
const RADAR_HEIGHT = 18;
const HISTORY_LENGTH = 48;
const VARIANT_SIZE = 24;
const POINTER_SIZE = 8;

const V_RELEASE = 0x10n;
const V_GET_ACCNAME = 0x50n;
const V_GET_ACCROLE = 0x68n;
const V_GET_ACCSTATE = 0x70n;
const V_ACCLOCATION = 0xb0n;

const VT_I4 = 3;

const SM_CXSCREEN = 0;
const SM_CYSCREEN = 1;
const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;

Oleacc.Preload(['AccessibleObjectFromPoint', 'GetRoleTextW', 'GetStateTextW']);

const process_ = Kernel32.GetCurrentProcess();

function readBytes(address: bigint, size: number): Buffer {
  const buffer = Buffer.alloc(size);
  Kernel32.ReadProcessMemory(process_, address, buffer.ptr!, BigInt(size), null);
  return buffer;
}

function readPointer(address: bigint): bigint {
  return readBytes(address, POINTER_SIZE).readBigUInt64LE(0);
}

function readBStr(bstrAddress: bigint): string {
  if (bstrAddress === 0n) return '';
  const byteLength = readBytes(bstrAddress - 4n, 4).readUInt32LE(0);
  if (byteLength === 0 || byteLength > 0x10000) return '';
  return readBytes(bstrAddress, byteLength).toString('utf16le').replace(/\0+$/, '');
}

const roleTextCache = new Map<number, string>();
function roleText(role: number): string {
  const cached = roleTextCache.get(role);
  if (cached !== undefined) return cached;
  const buffer = Buffer.alloc(128);
  const length = Oleacc.GetRoleTextW(role, buffer.ptr!, 64);
  const text = length > 0 ? buffer.toString('utf16le', 0, length * 2) : ROLE_SYSTEM[role] || `role 0x${role.toString(16)}`;
  roleTextCache.set(role, text);
  return text;
}

function stateText(state: number): string {
  const parts: string[] = [];
  for (let bit = 0; bit < 31 && parts.length < 5; bit += 1) {
    const mask = 1 << bit;
    if ((state & mask) === 0) continue;
    const buffer = Buffer.alloc(128);
    const length = Oleacc.GetStateTextW(mask >>> 0, buffer.ptr!, 64);
    if (length > 0) parts.push(buffer.toString('utf16le', 0, length * 2));
  }
  return parts.join(', ') || 'normal';
}

function roleColor(role: number): string {
  if (role === ROLE_SYSTEM.ROLE_SYSTEM_WINDOW || role === ROLE_SYSTEM.ROLE_SYSTEM_CLIENT || role === ROLE_SYSTEM.ROLE_SYSTEM_PANE) return ANSI.cyan;
  if (role === ROLE_SYSTEM.ROLE_SYSTEM_PUSHBUTTON || role === ROLE_SYSTEM.ROLE_SYSTEM_MENUITEM || role === ROLE_SYSTEM.ROLE_SYSTEM_LINK) return ANSI.green;
  if (role === ROLE_SYSTEM.ROLE_SYSTEM_TEXT || role === ROLE_SYSTEM.ROLE_SYSTEM_STATICTEXT) return ANSI.yellow;
  if (role === ROLE_SYSTEM.ROLE_SYSTEM_TITLEBAR || role === ROLE_SYSTEM.ROLE_SYSTEM_MENUBAR || role === ROLE_SYSTEM.ROLE_SYSTEM_SCROLLBAR) return ANSI.magenta;
  return ANSI.white;
}

interface Sample {
  name: string;
  role: number;
  state: number;
  left: number;
  top: number;
  width: number;
  height: number;
  ok: boolean;
}

function sampleAt(x: number, y: number): Sample {
  const empty: Sample = { name: '', role: -1, state: 0, left: 0, top: 0, width: 0, height: 0, ok: false };

  const accOut = Buffer.alloc(POINTER_SIZE);
  const childVariant = Buffer.alloc(VARIANT_SIZE);
  if (Oleacc.AccessibleObjectFromPoint(packPOINT(x, y), accOut.ptr!, childVariant.ptr!) !== 0) return empty;

  const accAddress = accOut.readBigUInt64LE(0);
  if (accAddress === 0n) return empty;

  const vtable = readPointer(accAddress);
  const acc = linkSymbols({
    Release: { args: [FFIType.u64], ptr: readPointer(vtable + V_RELEASE), returns: FFIType.u32 },
    get_accName: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], ptr: readPointer(vtable + V_GET_ACCNAME), returns: FFIType.i32 },
    get_accRole: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], ptr: readPointer(vtable + V_GET_ACCROLE), returns: FFIType.i32 },
    get_accState: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], ptr: readPointer(vtable + V_GET_ACCSTATE), returns: FFIType.i32 },
    accLocation: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], ptr: readPointer(vtable + V_ACCLOCATION), returns: FFIType.i32 },
  });

  const nameOut = Buffer.alloc(POINTER_SIZE);
  acc.symbols.get_accName(accAddress, childVariant.ptr!, nameOut.ptr!);
  const name = readBStr(nameOut.readBigUInt64LE(0));

  const roleVariant = Buffer.alloc(VARIANT_SIZE);
  let role = -1;
  if (acc.symbols.get_accRole(accAddress, childVariant.ptr!, roleVariant.ptr!) === 0 && roleVariant.readUInt16LE(0) === VT_I4) {
    role = roleVariant.readInt32LE(8);
  }

  const stateVariant = Buffer.alloc(VARIANT_SIZE);
  let state = 0;
  if (acc.symbols.get_accState(accAddress, childVariant.ptr!, stateVariant.ptr!) === 0 && stateVariant.readUInt16LE(0) === VT_I4) {
    state = stateVariant.readInt32LE(8) >>> 0;
  }

  const left = Buffer.alloc(4);
  const top = Buffer.alloc(4);
  const width = Buffer.alloc(4);
  const height = Buffer.alloc(4);
  acc.symbols.accLocation(accAddress, left.ptr!, top.ptr!, width.ptr!, height.ptr!, childVariant.ptr!);

  acc.symbols.Release(accAddress);
  acc.close();

  return {
    name,
    role,
    state,
    left: left.readInt32LE(0),
    top: top.readInt32LE(0),
    width: width.readInt32LE(0),
    height: height.readInt32LE(0),
    ok: true,
  };
}

function renderRadar(sample: Sample, cursorX: number, cursorY: number, screenW: number, screenH: number): string[] {
  const grid: string[][] = Array.from({ length: RADAR_HEIGHT }, () => Array.from({ length: RADAR_WIDTH }, () => `${ANSI.dim}·${ANSI.reset}`));

  const toCol = (px: number) => Math.max(0, Math.min(RADAR_WIDTH - 1, Math.round((px / screenW) * (RADAR_WIDTH - 1))));
  const toRow = (py: number) => Math.max(0, Math.min(RADAR_HEIGHT - 1, Math.round((py / screenH) * (RADAR_HEIGHT - 1))));

  if (sample.ok && sample.width > 0 && sample.height > 0) {
    const c0 = toCol(sample.left);
    const c1 = toCol(sample.left + sample.width);
    const r0 = toRow(sample.top);
    const r1 = toRow(sample.top + sample.height);
    const color = roleColor(sample.role);
    for (let c = c0; c <= c1; c += 1) {
      grid[r0][c] = `${color}─${ANSI.reset}`;
      grid[r1][c] = `${color}─${ANSI.reset}`;
    }
    for (let r = r0; r <= r1; r += 1) {
      grid[r][c0] = `${color}│${ANSI.reset}`;
      grid[r][c1] = `${color}│${ANSI.reset}`;
    }
    grid[r0][c0] = `${color}┌${ANSI.reset}`;
    grid[r0][c1] = `${color}┐${ANSI.reset}`;
    grid[r1][c0] = `${color}└${ANSI.reset}`;
    grid[r1][c1] = `${color}┘${ANSI.reset}`;
  }

  grid[toRow(cursorY)][toCol(cursorX)] = `${ANSI.bold}${ANSI.red}✦${ANSI.reset}`;
  return grid.map((row) => row.join(''));
}

// ── Setup ──────────────────────────────────────────────────────────────────

Ole32.CoInitialize(null);

const stdoutHandle = Kernel32.GetStdHandle(0xfffffff5); // STD_OUTPUT_HANDLE (-11)
const modeBuffer = Buffer.alloc(4);
if (Kernel32.GetConsoleMode(stdoutHandle, modeBuffer.ptr!) !== 0) {
  Kernel32.SetConsoleMode(stdoutHandle, modeBuffer.readUInt32LE(0) | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
}

const screenWidth = User32.GetSystemMetrics(SM_CXSCREEN) || 1920;
const screenHeight = User32.GetSystemMetrics(SM_CYSCREEN) || 1080;

const cursorPoint = Buffer.alloc(8);
const history: number[] = [];
const seenNames = new Set<string>();
const seenRoles = new Set<number>();
const spinner = ['◜', '◝', '◞', '◟'];

process.stdout.write('\x1b[2J');
process.stdout.write(ANSI.hideCursor);

try {
  for (let frame = 0; frame < FRAMES; frame += 1) {
    User32.GetCursorPos(cursorPoint.ptr!);
    const cursorX = cursorPoint.readInt32LE(0);
    const cursorY = cursorPoint.readInt32LE(4);

    const sample = sampleAt(cursorX, cursorY);
    if (sample.ok) {
      if (sample.name) seenNames.add(sample.name);
      if (sample.role >= 0) seenRoles.add(sample.role);
    }
    history.push(sample.ok ? sample.role : -1);
    if (history.length > HISTORY_LENGTH) history.shift();

    const radar = renderRadar(sample, cursorX, cursorY, screenWidth, screenHeight);
    const historyStrip = history.map((role) => (role < 0 ? `${ANSI.dim}·${ANSI.reset}` : `${roleColor(role)}█${ANSI.reset}`)).join('');

    const name = sample.name ? sample.name.slice(0, 50) : sample.ok ? '(no name)' : '(no element)';
    const role = sample.role >= 0 ? roleText(sample.role) : '—';
    const states = sample.ok ? stateText(sample.state) : '—';
    const rect = sample.ok && sample.width > 0 ? `${sample.left},${sample.top}  ${sample.width}×${sample.height}` : '—';

    const lines: string[] = [];
    lines.push(`${ANSI.bold}${ANSI.magenta}◼ Accessibility Radar ${spinner[frame % 4]}${ANSI.reset}  ${ANSI.dim}— what the screen reader sees, live, pure FFI${ANSI.reset}`);
    lines.push(`${ANSI.dim}  move the mouse over any window · frame ${frame + 1}/${FRAMES}${ANSI.reset}`);
    lines.push('');
    lines.push(`  ${ANSI.dim}cursor${ANSI.reset}  ${ANSI.white}${String(cursorX).padStart(5)}, ${String(cursorY).padStart(5)}${ANSI.reset}     ${ANSI.dim}screen${ANSI.reset} ${screenWidth}×${screenHeight}`);
    lines.push(`  ${ANSI.dim}element${ANSI.reset} ${roleColor(sample.role)}${ANSI.bold}${name}${ANSI.reset}`);
    lines.push(`  ${ANSI.dim}role${ANSI.reset}    ${roleColor(sample.role)}${role}${ANSI.reset}`);
    lines.push(`  ${ANSI.dim}state${ANSI.reset}   ${ANSI.magenta}${states}${ANSI.reset}`);
    lines.push(`  ${ANSI.dim}rect${ANSI.reset}    ${ANSI.cyan}${rect}${ANSI.reset}`);
    lines.push('');
    for (const row of radar) lines.push(`  ${row}`);
    lines.push('');
    lines.push(`  ${ANSI.dim}roles${ANSI.reset} ${historyStrip}`);
    lines.push(`  ${ANSI.dim}seen${ANSI.reset}  ${ANSI.yellow}${seenNames.size}${ANSI.reset} ${ANSI.dim}named elements${ANSI.reset}   ${ANSI.yellow}${seenRoles.size}${ANSI.reset} ${ANSI.dim}distinct roles${ANSI.reset}`);

    process.stdout.write(ANSI.home + lines.map((line) => line + ANSI.eol).join('\n') + ANSI.clearBelow);
    await Bun.sleep(FRAME_DELAY_MS);
  }
} finally {
  process.stdout.write(`${ANSI.reset}${ANSI.showCursor}\n`);
}

process.exit(0);
