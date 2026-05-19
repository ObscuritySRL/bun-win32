/**
 * DirectML Device Report
 *
 * A thorough, flat-FFI diagnostic that bootstraps a *real* Direct3D 12 device
 * on the default adapter (via the sibling `@bun-win32/d3d12` binding), then
 * creates a real DirectML device over it through both documented entry points
 * (`DMLCreateDevice` and `DMLCreateDevice1`). It then walks the resulting
 * `IDMLDevice` COM vtable entirely over Bun FFI — no native addon — to:
 *
 *   - Query the true maximum supported DirectML feature level by calling
 *     `IDMLDevice::CheckFeatureSupport(DML_FEATURE_FEATURE_LEVELS)` with the
 *     full documented ladder of requested levels.
 *   - Confirm the device is healthy via `IDMLDevice::GetDeviceRemovedReason`
 *     (S_OK == not removed).
 *   - Round-trip back to the underlying D3D12 device via
 *     `IDMLDevice::GetParentDevice` and verify the returned pointer is the
 *     exact same ID3D12Device that DirectML was created over (the documented
 *     "DirectML maintains a strong reference to the supplied D3D12 device").
 *
 * Every value is rendered with aligned labels, colored HRESULT badges, and a
 * feature-level support ladder. Every COM object created is Released.
 *
 * APIs demonstrated (DirectML):
 *   - DirectML.DMLCreateDevice                 (create IDMLDevice, FL 1_0)
 *   - DirectML.DMLCreateDevice1                (create IDMLDevice, min FL)
 *   - IDMLDevice::CheckFeatureSupport          (max supported feature level)
 *   - IDMLDevice::GetDeviceRemovedReason       (device health)
 *   - IDMLDevice::GetParentDevice              (round-trip to ID3D12Device)
 *   - IUnknown::Release                        (release every COM object)
 *
 * APIs demonstrated (d3d12, cross-package):
 *   - D3d12.D3D12CreateDevice                  (bootstrap a real ID3D12Device)
 *
 * APIs demonstrated (kernel32, cross-package):
 *   - kernel32!GetCurrentProcess               (process handle for vtable reads)
 *   - kernel32!ReadProcessMemory               (walk the COM vtable)
 *
 * Run: bun run example:directml-device-report
 */

import { FFIType, dlopen, linkSymbols } from 'bun:ffi';

import D3d12, { D3D_FEATURE_LEVEL } from '@bun-win32/d3d12';

import DirectML, { DML_CREATE_DEVICE_FLAGS, DML_FEATURE_LEVEL } from '..';

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

const POINTER_SIZE = 8;

// IDMLDevice : IDMLObject : IUnknown.
// IUnknown(3) + IDMLObject(4) = 7 slots precede the IDMLDevice methods.
// Absolute vtable slot index * 8 = byte offset.
const SLOT_RELEASE = 2; // IUnknown::Release
const SLOT_CHECK_FEATURE_SUPPORT = 7; // IDMLDevice::CheckFeatureSupport
const SLOT_GET_DEVICE_REMOVED_REASON = 15; // IDMLDevice::GetDeviceRemovedReason
const SLOT_GET_PARENT_DEVICE = 16; // IDMLDevice::GetParentDevice

const S_OK = 0x0000_0000;
const S_FALSE = 0x0000_0001;

// DML_FEATURE enumerator: DML_FEATURE_FEATURE_LEVELS == 1.
const DML_FEATURE_FEATURE_LEVELS = 1;

const IID_ID3D12Device = '189819f1-1db6-4b57-be54-1821339b85f7';
const IID_IDMLDevice = '6dbd6437-96fd-423f-a98c-ae5e7c2a573f';

const FEATURE_LADDER: Array<{ label: string; level: DML_FEATURE_LEVEL }> = [
  { label: '1_0', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_1_0 },
  { label: '2_0', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_2_0 },
  { label: '2_1', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_2_1 },
  { label: '3_0', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_3_0 },
  { label: '3_1', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_3_1 },
  { label: '4_0', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_4_0 },
  { label: '4_1', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_4_1 },
  { label: '5_0', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_5_0 },
  { label: '5_1', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_5_1 },
  { label: '5_2', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_5_2 },
  { label: '6_0', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_6_0 },
  { label: '6_1', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_6_1 },
  { label: '6_2', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_6_2 },
  { label: '6_3', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_6_3 },
  { label: '6_4', level: DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_6_4 },
];

DirectML.Preload();
D3d12.Preload('D3D12CreateDevice');

const kernel32 = dlopen('kernel32.dll', {
  GetCurrentProcess: { args: [], returns: FFIType.u64 },
  ReadProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
});

const currentProcess = kernel32.symbols.GetCurrentProcess();

type Status = 'ok' | 'fail' | 'info';

interface Row {
  detail: string;
  hr: number | null;
  name: string;
  section: string;
  status: Status;
}

const rows: Row[] = [];

function formatHResult(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
}

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

// Resolve the absolute address of a COM vtable slot for the object at `address`.
function vtableSlot(address: bigint, slot: number): bigint {
  const vtable = readPointerAt(address);
  return readPointerAt(vtable + BigInt(slot * POINTER_SIZE));
}

function comRelease(address: bigint): number {
  if (address === 0n) return 0;
  const calls = linkSymbols({
    Release: { args: [FFIType.u64], ptr: vtableSlot(address, SLOT_RELEASE), returns: FFIType.u32 },
  });
  try {
    return calls.symbols.Release(address);
  } finally {
    calls.close();
  }
}

function record(section: string, name: string, status: Status, hr: number | null, detail: string): void {
  rows.push({ detail, hr, name, section, status });
}

// ── Section A: bootstrap a real ID3D12Device ─────────────────────────────────
const iidD3D12Device = guidBytes(IID_ID3D12Device);
const ppD3D12Device = Buffer.alloc(POINTER_SIZE);
const hrD3D12 = D3d12.D3D12CreateDevice(null, D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_11_0, iidD3D12Device.ptr, ppD3D12Device.ptr);

if (hrD3D12 >>> 0 !== S_OK) {
  record('Direct3D 12', 'D3D12CreateDevice', 'fail', hrD3D12, `${formatHResult(hrD3D12)} — no D3D12 adapter; cannot continue`);
  printReport();
  process.exit(1);
}

const d3d12DeviceAddr = ppD3D12Device.readBigUInt64LE(0);
record('Direct3D 12', 'D3D12CreateDevice', 'ok', hrD3D12, `ID3D12Device @ 0x${d3d12DeviceAddr.toString(16)} (FL 11_0)`);

// ── Section B: create the DirectML device (both entry points) ────────────────
const iidDmlDevice = guidBytes(IID_IDMLDevice);

const ppDmlDevice = Buffer.alloc(POINTER_SIZE);
const hrDml = DirectML.DMLCreateDevice(d3d12DeviceAddr, DML_CREATE_DEVICE_FLAGS.DML_CREATE_DEVICE_FLAG_NONE, iidDmlDevice.ptr, ppDmlDevice.ptr);
let dmlDeviceAddr = 0n;
if (hrDml >>> 0 === S_OK) {
  dmlDeviceAddr = ppDmlDevice.readBigUInt64LE(0);
  record('DirectML device', 'DMLCreateDevice', 'ok', hrDml, `IDMLDevice @ 0x${dmlDeviceAddr.toString(16)}`);
} else {
  record('DirectML device', 'DMLCreateDevice', 'fail', hrDml, formatHResult(hrDml));
}

// DMLCreateDevice1 with an explicit minimum feature level of 1_0 — guaranteed
// to be satisfiable on any DirectML implementation. A second, independent
// IDMLDevice over the same D3D12 device.
const ppDmlDevice1 = Buffer.alloc(POINTER_SIZE);
const hrDml1 = DirectML.DMLCreateDevice1(d3d12DeviceAddr, DML_CREATE_DEVICE_FLAGS.DML_CREATE_DEVICE_FLAG_NONE, DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_1_0, iidDmlDevice.ptr, ppDmlDevice1.ptr);
let dmlDevice1Addr = 0n;
if (hrDml1 >>> 0 === S_OK) {
  dmlDevice1Addr = ppDmlDevice1.readBigUInt64LE(0);
  record('DirectML device', 'DMLCreateDevice1', 'ok', hrDml1, `IDMLDevice @ 0x${dmlDevice1Addr.toString(16)} (min FL 1_0)`);
} else {
  record('DirectML device', 'DMLCreateDevice1', 'fail', hrDml1, formatHResult(hrDml1));
}

// ── Section C: probe the live IDMLDevice over its COM vtable ─────────────────
let maxLevelLabel: string | null = null;

if (dmlDeviceAddr !== 0n) {
  // IDMLDevice::GetDeviceRemovedReason() -> HRESULT (S_OK means healthy).
  {
    const calls = linkSymbols({
      GetDeviceRemovedReason: { args: [FFIType.u64], ptr: vtableSlot(dmlDeviceAddr, SLOT_GET_DEVICE_REMOVED_REASON), returns: FFIType.i32 },
    });
    try {
      const hr = calls.symbols.GetDeviceRemovedReason(dmlDeviceAddr);
      const healthy = hr >>> 0 === S_OK;
      record('Device health', 'GetDeviceRemovedReason', healthy ? 'ok' : 'fail', hr, healthy ? 'device not removed' : 'device removed');
    } finally {
      calls.close();
    }
  }

  // IDMLDevice::CheckFeatureSupport(DML_FEATURE_FEATURE_LEVELS, ...).
  // DML_FEATURE_QUERY_FEATURE_LEVELS { UINT RequestedFeatureLevelCount;
  //                                    const DML_FEATURE_LEVEL* RequestedFeatureLevels; }
  // is 16 bytes (4 + 4 pad + 8 ptr). The reply struct
  // DML_FEATURE_DATA_FEATURE_LEVELS { DML_FEATURE_LEVEL MaxSupportedFeatureLevel; }
  // is a single UINT.
  {
    const levels = Buffer.alloc(FEATURE_LADDER.length * 4);
    FEATURE_LADDER.forEach((entry, i) => levels.writeUInt32LE(entry.level, i * 4));

    const query = Buffer.alloc(16);
    query.writeUInt32LE(FEATURE_LADDER.length, 0);
    query.writeBigUInt64LE(BigInt(levels.ptr ?? 0), 8);

    const reply = Buffer.alloc(4);

    const calls = linkSymbols({
      CheckFeatureSupport: {
        args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr],
        ptr: vtableSlot(dmlDeviceAddr, SLOT_CHECK_FEATURE_SUPPORT),
        returns: FFIType.i32,
      },
    });
    try {
      const hr = calls.symbols.CheckFeatureSupport(dmlDeviceAddr, DML_FEATURE_FEATURE_LEVELS, 16, query.ptr, 4, reply.ptr);
      if (hr >>> 0 === S_OK) {
        const maxLevel = reply.readUInt32LE(0);
        const match = FEATURE_LADDER.find((e) => e.level === maxLevel);
        maxLevelLabel = match ? match.label : `0x${maxLevel.toString(16)}`;
        record('Capabilities', 'CheckFeatureSupport', 'ok', hr, `max DirectML feature level ${maxLevelLabel} (0x${maxLevel.toString(16)})`);
      } else {
        record('Capabilities', 'CheckFeatureSupport', 'fail', hr, formatHResult(hr));
      }
    } finally {
      calls.close();
    }
  }

  // IDMLDevice::GetParentDevice(riid, ppv) -> the ID3D12Device DirectML wraps.
  {
    const ppParent = Buffer.alloc(POINTER_SIZE);
    const calls = linkSymbols({
      GetParentDevice: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], ptr: vtableSlot(dmlDeviceAddr, SLOT_GET_PARENT_DEVICE), returns: FFIType.i32 },
    });
    try {
      const hr = calls.symbols.GetParentDevice(dmlDeviceAddr, iidD3D12Device.ptr, ppParent.ptr);
      if (hr >>> 0 === S_OK) {
        const parentAddr = ppParent.readBigUInt64LE(0);
        const sameDevice = parentAddr === d3d12DeviceAddr;
        record(
          'Parent device',
          'GetParentDevice',
          sameDevice ? 'ok' : 'info',
          hr,
          sameDevice ? `round-trip verified — parent is the exact ID3D12Device @ 0x${parentAddr.toString(16)}` : `parent ID3D12Device @ 0x${parentAddr.toString(16)} (AddRef'd alias of 0x${d3d12DeviceAddr.toString(16)})`,
        );
        // GetParentDevice AddRef's the returned interface — release our ref.
        comRelease(parentAddr);
      } else {
        record('Parent device', 'GetParentDevice', 'fail', hr, formatHResult(hr));
      }
    } finally {
      calls.close();
    }
  }
}

// ── Cleanup: release every COM object we created ─────────────────────────────
if (dmlDevice1Addr !== 0n) comRelease(dmlDevice1Addr);
if (dmlDeviceAddr !== 0n) comRelease(dmlDeviceAddr);
comRelease(d3d12DeviceAddr);
kernel32.close();

printReport();

function printReport(): void {
  const nameWidth = Math.max(...rows.map((r) => r.name.length));
  const hrWidth = 10;

  const badge: Record<Status, string> = {
    fail: `${ANSI.red}✗${ANSI.reset}`,
    info: `${ANSI.cyan}ℹ${ANSI.reset}`,
    ok: `${ANSI.green}✓${ANSI.reset}`,
  };

  console.log();
  console.log(`${ANSI.bold}${ANSI.cyan}DirectML.dll${ANSI.reset}  ${ANSI.dim}device + capability report · ${rows.length} checks${ANSI.reset}`);

  let currentSection = '';
  for (const r of rows) {
    if (r.section !== currentSection) {
      currentSection = r.section;
      console.log();
      console.log(`  ${ANSI.bold}${ANSI.magenta}${r.section}${ANSI.reset}`);
      console.log(`  ${ANSI.dim}${'─'.repeat(Math.min(110, nameWidth + 2 + hrWidth + 2 + 56))}${ANSI.reset}`);
    }
    const hrRaw = r.hr === null ? '(n/a)' : r.hr >>> 0 === S_OK ? 'S_OK' : r.hr >>> 0 === S_FALSE ? 'S_FALSE' : formatHResult(r.hr);
    const hrColored = r.hr === null ? `${ANSI.dim}(n/a)${ANSI.reset}` : r.hr >>> 0 === S_OK || r.hr >>> 0 === S_FALSE ? `${ANSI.green}${hrRaw}${ANSI.reset}` : `${ANSI.yellow}${hrRaw}${ANSI.reset}`;
    const pad = ' '.repeat(Math.max(0, hrWidth - hrRaw.length));
    const detail = r.status === 'info' ? `${ANSI.dim}${r.detail}${ANSI.reset}` : r.detail;
    console.log(`  ${badge[r.status]} ${ANSI.yellow}${r.name.padEnd(nameWidth)}${ANSI.reset}  ${hrColored}${pad}  ${detail}`);
  }

  // Feature-level ladder visualization (only when we resolved the max level).
  if (maxLevelLabel) {
    const maxIndex = FEATURE_LADDER.findIndex((e) => e.label === maxLevelLabel);
    console.log();
    console.log(`  ${ANSI.bold}${ANSI.magenta}Feature-level ladder${ANSI.reset}`);
    console.log(`  ${ANSI.dim}${'─'.repeat(58)}${ANSI.reset}`);
    for (let i = FEATURE_LADDER.length - 1; i >= 0; i -= 1) {
      const e = FEATURE_LADDER[i];
      const supported = i <= maxIndex;
      const marker = supported ? `${ANSI.green}█${ANSI.reset}` : `${ANSI.dim}░${ANSI.reset}`;
      const tag = i === maxIndex ? `${ANSI.bold}${ANSI.green} ← max supported${ANSI.reset}` : '';
      const label = supported ? `${ANSI.green}FL ${e.label}${ANSI.reset}` : `${ANSI.dim}FL ${e.label}${ANSI.reset}`;
      console.log(`  ${marker}${marker}${marker}  ${label}${tag}`);
    }
  }

  const okCount = rows.filter((r) => r.status === 'ok').length;
  const failCount = rows.filter((r) => r.status === 'fail').length;
  const infoCount = rows.filter((r) => r.status === 'info').length;

  console.log();
  console.log(
    `  ${ANSI.bold}${okCount}${ANSI.reset} ${ANSI.green}ok${ANSI.reset}` +
      `  ${ANSI.dim}•${ANSI.reset}  ${ANSI.bold}${failCount}${ANSI.reset} ${ANSI.red}fail${ANSI.reset}` +
      `  ${ANSI.dim}•${ANSI.reset}  ${ANSI.bold}${infoCount}${ANSI.reset} ${ANSI.cyan}info${ANSI.reset}` +
      (maxLevelLabel ? `  ${ANSI.dim}•${ANSI.reset}  DirectML feature level ${ANSI.yellow}${maxLevelLabel}${ANSI.reset}` : ''),
  );
  console.log();
}
