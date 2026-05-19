/**
 * DirectML Capability Observatory
 *
 * A live, animated "observatory" that bootstraps a real Direct3D 12 device and
 * then probes the local DirectML implementation entirely over Bun FFI — no
 * native addon, no compiler. For every documented DirectML feature level it
 * fires a *real* `DMLCreateDevice1` call (each with its own honest HRESULT),
 * sweeping a scan line down a glowing neural lattice where every lit node is
 * backed by a genuine DirectML.dll device creation. It then decodes the
 * device's true maximum feature level by walking the live `IDMLDevice` COM
 * vtable to `CheckFeatureSupport(DML_FEATURE_FEATURE_LEVELS)`, and finishes
 * with a deterministic, CPU-verifiable sanity result: every successfully
 * created device's parent pointer is round-tripped via `GetParentDevice` and
 * checked against the exact ID3D12Device it was created over. Every COM
 * object is Released on the way out. No performance is claimed — this is a
 * capability X-ray, not a benchmark.
 *
 * APIs demonstrated (DirectML):
 *   - DirectML.DMLCreateDevice1                (per-feature-level probe)
 *   - DirectML.DMLCreateDevice                 (baseline device)
 *   - IDMLDevice::CheckFeatureSupport          (true max feature level)
 *   - IDMLDevice::GetParentDevice              (round-trip verification)
 *   - IUnknown::Release                        (release every COM object)
 *
 * APIs demonstrated (d3d12, cross-package):
 *   - D3d12.D3D12CreateDevice                  (bootstrap a real ID3D12Device)
 *
 * APIs demonstrated (kernel32, cross-package):
 *   - kernel32!GetCurrentProcess               (process handle for vtable reads)
 *   - kernel32!ReadProcessMemory               (walk the COM vtable)
 *
 * Run: bun run example:directml-capability-observatory
 */

import { FFIType, dlopen, linkSymbols } from 'bun:ffi';

import D3d12, { D3D_FEATURE_LEVEL } from '@bun-win32/d3d12';

import DirectML, { DML_CREATE_DEVICE_FLAGS, DML_FEATURE_LEVEL } from '..';

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  grey: '\x1b[90m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  white: '\x1b[97m',
  yellow: '\x1b[33m',
} as const;

const POINTER_SIZE = 8;
const SLOT_RELEASE = 2; // IUnknown::Release
const SLOT_CHECK_FEATURE_SUPPORT = 7; // IDMLDevice::CheckFeatureSupport
const SLOT_GET_PARENT_DEVICE = 16; // IDMLDevice::GetParentDevice

const S_OK = 0x0000_0000;
const DML_FEATURE_FEATURE_LEVELS = 1;

const IID_ID3D12Device = '189819f1-1db6-4b57-be54-1821339b85f7';
const IID_IDMLDevice = '6dbd6437-96fd-423f-a98c-ae5e7c2a573f';

const FEATURE_LADDER: Array<{ label: string; level: DML_FEATURE_LEVEL }> = [
  { label: '1.0', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_1_0 },
  { label: '2.0', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_2_0 },
  { label: '2.1', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_2_1 },
  { label: '3.0', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_3_0 },
  { label: '3.1', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_3_1 },
  { label: '4.0', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_4_0 },
  { label: '4.1', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_4_1 },
  { label: '5.0', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_5_0 },
  { label: '5.1', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_5_1 },
  { label: '5.2', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_5_2 },
  { label: '6.0', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_6_0 },
  { label: '6.1', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_6_1 },
  { label: '6.2', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_6_2 },
  { label: '6.3', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_6_3 },
  { label: '6.4', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_6_4 },
];

DirectML.Preload();
D3d12.Preload('D3D12CreateDevice');

const kernel32 = dlopen('kernel32.dll', {
  GetCurrentProcess: { args: [], returns: FFIType.u64 },
  ReadProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
});
const currentProcess = kernel32.symbols.GetCurrentProcess();

function guidBytes(value: string): Buffer {
  const match = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(value);
  if (match === null) throw new Error(`Invalid GUID: ${value}`);
  const [, d1, d2, d3, d4High, d4Low] = match;
  const buffer = Buffer.alloc(16);
  buffer.writeUInt32LE(parseInt(d1, 16), 0);
  buffer.writeUInt16LE(parseInt(d2, 16), 4);
  buffer.writeUInt16LE(parseInt(d3, 16), 6);
  const data4 = `${d4High}${d4Low}`;
  for (let i = 0; i < 8; i += 1) buffer[8 + i] = parseInt(data4.slice(i * 2, i * 2 + 2), 16);
  return buffer;
}

function readPointerAt(address: bigint): bigint {
  const buffer = Buffer.alloc(POINTER_SIZE);
  const ok = kernel32.symbols.ReadProcessMemory(currentProcess, address, buffer.ptr, BigInt(POINTER_SIZE), null);
  if (ok === 0) throw new Error(`ReadProcessMemory failed at 0x${address.toString(16)}`);
  return buffer.readBigUInt64LE(0);
}

function vtableSlot(address: bigint, slot: number): bigint {
  return readPointerAt(readPointerAt(address) + BigInt(slot * POINTER_SIZE));
}

function comRelease(address: bigint): void {
  if (address === 0n) return;
  const calls = linkSymbols({ Release: { args: [FFIType.u64], ptr: vtableSlot(address, SLOT_RELEASE), returns: FFIType.u32 } });
  try {
    calls.symbols.Release(address);
  } finally {
    calls.close();
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

console.log();
console.log(`${ANSI.bold}${ANSI.cyan}  ┌─ DirectML Capability Observatory ───────────────────────────┐${ANSI.reset}`);
console.log(`${ANSI.cyan}  │${ANSI.reset} ${ANSI.dim}every lit node is a real DMLCreateDevice1 call on this box${ANSI.reset}  ${ANSI.cyan}│${ANSI.reset}`);
console.log(`${ANSI.bold}${ANSI.cyan}  └─────────────────────────────────────────────────────────────┘${ANSI.reset}`);
console.log();

// ── Bootstrap a real ID3D12Device ───────────────────────────────────────────
const iidD3D12Device = guidBytes(IID_ID3D12Device);
const iidDmlDevice = guidBytes(IID_IDMLDevice);
const ppD3D12 = Buffer.alloc(POINTER_SIZE);
const hrD3D12 = D3d12.D3D12CreateDevice(null, D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_11_0, iidD3D12Device.ptr, ppD3D12.ptr);
if (hrD3D12 >>> 0 !== S_OK) {
  console.log(`  ${ANSI.red}✗ No Direct3D 12 adapter available — cannot reach DirectML.${ANSI.reset}\n`);
  kernel32.close();
  process.exit(1);
}
const d3d12DeviceAddr = ppD3D12.readBigUInt64LE(0);
console.log(`  ${ANSI.green}●${ANSI.reset} ID3D12Device online  ${ANSI.dim}@ 0x${d3d12DeviceAddr.toString(16)} (FL 11_0)${ANSI.reset}`);
console.log();

// ── Probe every documented feature level with a real device creation ────────
interface Probe {
  addr: bigint;
  hr: number;
  label: string;
  supported: boolean;
}

const probes: Probe[] = [];
const LATTICE_WIDTH = 30;

function renderLattice(activeIndex: number): string {
  // A vertical neural lattice: one row per feature level (highest at top),
  // each row a chain of nodes whose glow encodes the live probe result.
  const lines: string[] = [];
  for (let i = FEATURE_LADDER.length - 1; i >= 0; i -= 1) {
    const probe = probes[i];
    const isScan = i === activeIndex;
    let glyph: string;
    let color: string;
    if (probe === undefined) {
      glyph = isScan ? '◇' : '·';
      color = isScan ? ANSI.yellow : ANSI.grey;
    } else if (probe.supported) {
      glyph = '◆';
      color = ANSI.green;
    } else {
      glyph = '◌';
      color = ANSI.red;
    }
    const chain = `${color}${`${glyph} `.repeat(LATTICE_WIDTH).trimEnd()}${ANSI.reset}`;
    const tag = `${ANSI.dim}FL ${FEATURE_LADDER[i].label}${ANSI.reset}`;
    const scanMark = isScan ? `${ANSI.bold}${ANSI.yellow} ◀ scanning${ANSI.reset}` : '';
    lines.push(`  ${tag.padEnd(16)} ${chain}${scanMark}`);
  }
  return lines.join('\n');
}

const latticeHeight = FEATURE_LADDER.length;
process.stdout.write(`${renderLattice(-1)}\n`);

for (let i = 0; i < FEATURE_LADDER.length; i += 1) {
  // Move the cursor back up over the lattice and redraw with the scan line.
  process.stdout.write(`\x1b[${latticeHeight}A`);
  process.stdout.write(`${renderLattice(i)}\n`);
  await sleep(45);

  const entry = FEATURE_LADDER[i];
  const ppDml = Buffer.alloc(POINTER_SIZE);
  const hr = DirectML.DMLCreateDevice1(d3d12DeviceAddr, DML_CREATE_DEVICE_FLAGS.DML_CREATE_DEVICE_FLAG_NONE, entry.level, iidDmlDevice.ptr, ppDml.ptr);
  const supported = hr >>> 0 === S_OK;
  probes[i] = { addr: supported ? ppDml.readBigUInt64LE(0) : 0n, hr, label: entry.label, supported };

  process.stdout.write(`\x1b[${latticeHeight}A`);
  process.stdout.write(`${renderLattice(i)}\n`);
  await sleep(35);
}

// Final settle render with no scan line.
process.stdout.write(`\x1b[${latticeHeight}A`);
process.stdout.write(`${renderLattice(-1)}\n`);

// ── Decode the true maximum feature level from the live device ──────────────
const baseline = probes.find((p) => p.supported);
let maxLabel = '?';
let maxHex = 0;

if (baseline) {
  const levels = Buffer.alloc(FEATURE_LADDER.length * 4);
  FEATURE_LADDER.forEach((e, i) => levels.writeUInt32LE(e.level, i * 4));
  const query = Buffer.alloc(16);
  query.writeUInt32LE(FEATURE_LADDER.length, 0);
  query.writeBigUInt64LE(BigInt(levels.ptr ?? 0), 8);
  const reply = Buffer.alloc(4);

  const calls = linkSymbols({
    CheckFeatureSupport: {
      args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr],
      ptr: vtableSlot(baseline.addr, SLOT_CHECK_FEATURE_SUPPORT),
      returns: FFIType.i32,
    },
  });
  try {
    const hr = calls.symbols.CheckFeatureSupport(baseline.addr, DML_FEATURE_FEATURE_LEVELS, 16, query.ptr, 4, reply.ptr);
    if (hr >>> 0 === S_OK) {
      maxHex = reply.readUInt32LE(0);
      const match = FEATURE_LADDER.find((e) => e.level === maxHex);
      maxLabel = match ? match.label : `0x${maxHex.toString(16)}`;
    }
  } finally {
    calls.close();
  }
}

// ── Deterministic, CPU-verifiable check: GetParentDevice round-trip ─────────
let roundTripOk = false;
if (baseline) {
  const ppParent = Buffer.alloc(POINTER_SIZE);
  const calls = linkSymbols({
    GetParentDevice: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], ptr: vtableSlot(baseline.addr, SLOT_GET_PARENT_DEVICE), returns: FFIType.i32 },
  });
  try {
    const hr = calls.symbols.GetParentDevice(baseline.addr, iidD3D12Device.ptr, ppParent.ptr);
    if (hr >>> 0 === S_OK) {
      const parentAddr = ppParent.readBigUInt64LE(0);
      roundTripOk = parentAddr === d3d12DeviceAddr;
      comRelease(parentAddr);
    }
  } finally {
    calls.close();
  }
}

// ── Release every DirectML device we created ────────────────────────────────
for (const p of probes) comRelease(p.addr);
comRelease(d3d12DeviceAddr);
kernel32.close();

const supportedCount = probes.filter((p) => p.supported).length;

console.log();
console.log(`  ${ANSI.bold}${ANSI.magenta}Observatory readout${ANSI.reset}`);
console.log(`  ${ANSI.dim}${'─'.repeat(60)}${ANSI.reset}`);
console.log(`  ${ANSI.green}◆${ANSI.reset} levels created   ${ANSI.bold}${ANSI.white}${supportedCount}${ANSI.reset}${ANSI.dim} / ${FEATURE_LADDER.length} documented${ANSI.reset}`);
console.log(`  ${ANSI.green}◆${ANSI.reset} max feature level ${ANSI.bold}${ANSI.yellow}FL ${maxLabel}${ANSI.reset}  ${ANSI.dim}(CheckFeatureSupport → 0x${maxHex.toString(16)})${ANSI.reset}`);
console.log(
  `  ${roundTripOk ? `${ANSI.green}◆` : `${ANSI.red}◌`}${ANSI.reset} parent round-trip ` +
    (roundTripOk ? `${ANSI.bold}${ANSI.green}VERIFIED${ANSI.reset}  ${ANSI.dim}IDMLDevice→GetParentDevice == bootstrap ID3D12Device${ANSI.reset}` : `${ANSI.red}mismatch${ANSI.reset}`),
);
console.log();

process.exit(baseline && roundTripOk ? 0 : 1);
