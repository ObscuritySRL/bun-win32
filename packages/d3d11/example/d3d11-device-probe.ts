/**
 * D3D11 Device Probe
 *
 * Exercises every `d3d11.dll` creation entry point against a matrix of driver
 * types, feature levels, and creation flags so you can see, on this machine
 * right now, which configurations succeed. Each row calls `D3D11CreateDevice`
 * (and, for the swap-chain lane, `D3D11CreateDeviceAndSwapChain` against a
 * hidden HWND) and reports the highest feature level the runtime negotiated.
 * The matrix covers HARDWARE / WARP / REFERENCE drivers, the BGRA_SUPPORT
 * and DEBUG flags, and a feature-level ladder from 9_1 through 12_2 so it
 * doubles as a D3D11 capability probe.
 *
 * APIs demonstrated:
 *   - D3d11.D3D11CreateDevice              (baseline device creation)
 *   - D3d11.D3D11CreateDeviceAndSwapChain  (device + DXGI swap chain)
 *   - IUnknown::Release                    (release every returned COM object)
 *   - user32!CreateWindowExW / DestroyWindow (message-only HWND for swap chain)
 *
 * Run: bun run example:d3d11-device-probe
 */

import { FFIType, dlopen, linkSymbols } from 'bun:ffi';

import D3d11, { D3D11_CREATE_DEVICE_FLAG, D3D11_SDK_VERSION, D3D_DRIVER_TYPE, D3D_FEATURE_LEVEL } from '..';

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
const RELEASE_OFFSET = 0x10;
const DXGI_SWAP_CHAIN_DESC_SIZE = 72;

const DXGI_ERROR_UNSUPPORTED = 0x887a_0004 >>> 0;
const DXGI_ERROR_SDK_COMPONENT_MISSING = 0x887a_002d >>> 0;
const E_INVALIDARG = 0x8007_0057 >>> 0;
const E_NOTIMPL = 0x8000_4001 >>> 0;

const FEATURE_LEVELS: Array<{ level: D3D_FEATURE_LEVEL; label: string }> = [
  { label: '12_2', level: D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_12_2 },
  { label: '12_1', level: D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_12_1 },
  { label: '12_0', level: D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_12_0 },
  { label: '11_1', level: D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_11_1 },
  { label: '11_0', level: D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_11_0 },
  { label: '10_1', level: D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_10_1 },
  { label: '10_0', level: D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_10_0 },
  { label: '9_3', level: D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_9_3 },
  { label: '9_2', level: D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_9_2 },
  { label: '9_1', level: D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_9_1 },
];

D3d11.Preload();

const kernel32 = dlopen('kernel32.dll', {
  GetCurrentProcess: { args: [], returns: FFIType.u64 },
  GetModuleHandleW: { args: [FFIType.ptr], returns: FFIType.u64 },
  ReadProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
});

const user32 = dlopen('user32.dll', {
  CreateWindowExW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
  DestroyWindow: { args: [FFIType.u64], returns: FFIType.i32 },
});

const currentProcess = kernel32.symbols.GetCurrentProcess();
const hInstance = kernel32.symbols.GetModuleHandleW(null);

type Status = 'ok' | 'fail' | 'info';

interface Result {
  config: string;
  detail: string;
  hr: number;
  lane: string;
  level: string;
  status: Status;
}

const results: Result[] = [];

function formatHResult(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
}

function readPointerAt(address: bigint): bigint {
  const buffer = Buffer.alloc(POINTER_SIZE);
  const ok = kernel32.symbols.ReadProcessMemory(currentProcess, address, buffer.ptr, BigInt(POINTER_SIZE), null);
  if (ok === 0) throw new Error(`ReadProcessMemory failed at 0x${address.toString(16)}`);
  return buffer.readBigUInt64LE(0);
}

function releaseComObject(address: bigint): void {
  if (address === 0n) return;
  const vtable = readPointerAt(address);
  const releaseAddr = readPointerAt(vtable + BigInt(RELEASE_OFFSET));
  const calls = linkSymbols({
    Release: { args: [FFIType.u64], ptr: releaseAddr, returns: FFIType.u32 },
  });
  try {
    calls.symbols.Release(address);
  } finally {
    calls.close();
  }
}

function labelForLevel(value: number): string {
  const match = FEATURE_LEVELS.find((f) => f.level === value);
  return match ? match.label : `0x${value.toString(16)}`;
}

function levelsBuffer(levels: number[]): Buffer {
  const buffer = Buffer.alloc(levels.length * 4);
  for (let i = 0; i < levels.length; i += 1) buffer.writeUInt32LE(levels[i], i * 4);
  return buffer;
}

function createMessageOnlyHwnd(): bigint {
  const className = Buffer.from('STATIC\0', 'utf16le');
  const windowName = Buffer.from('d3d11-probe\0', 'utf16le');
  const HWND_MESSAGE = -3n;
  const hwnd = user32.symbols.CreateWindowExW(0, className.ptr, windowName.ptr, 0, 0, 0, 1, 1, HWND_MESSAGE, 0n, hInstance, null);
  return hwnd;
}

function buildSwapChainDesc(hwnd: bigint): Buffer {
  const buffer = Buffer.alloc(DXGI_SWAP_CHAIN_DESC_SIZE);
  buffer.writeUInt32LE(1, 0);
  buffer.writeUInt32LE(1, 4);
  buffer.writeUInt32LE(60, 8);
  buffer.writeUInt32LE(1, 12);
  buffer.writeUInt32LE(28, 16);
  buffer.writeUInt32LE(0, 20);
  buffer.writeUInt32LE(0, 24);
  buffer.writeUInt32LE(1, 28);
  buffer.writeUInt32LE(0, 32);
  buffer.writeUInt32LE(0x20, 36);
  buffer.writeUInt32LE(1, 40);
  buffer.writeBigUInt64LE(hwnd, 48);
  buffer.writeUInt32LE(1, 56);
  buffer.writeUInt32LE(0, 60);
  buffer.writeUInt32LE(0, 64);
  return buffer;
}

function recordDeviceResult(
  lane: string,
  config: string,
  driverType: D3D_DRIVER_TYPE,
  flags: number,
  levels: number[] | null,
): void {
  const ppDevice = Buffer.alloc(POINTER_SIZE);
  const pFeatureLevel = Buffer.alloc(4);
  const ppImmediateContext = Buffer.alloc(POINTER_SIZE);
  const levelsBuf = levels === null ? null : levelsBuffer(levels);
  const levelsCount = levels === null ? 0 : levels.length;

  const hr = D3d11.D3D11CreateDevice(
    null,
    driverType,
    0n,
    flags,
    levelsBuf === null ? null : levelsBuf.ptr,
    levelsCount,
    D3D11_SDK_VERSION,
    ppDevice.ptr,
    pFeatureLevel.ptr,
    ppImmediateContext.ptr,
  );

  const levelLabel = hr === 0 ? labelForLevel(pFeatureLevel.readUInt32LE(0)) : '—';

  if (hr === 0) {
    const deviceAddr = ppDevice.readBigUInt64LE(0);
    const contextAddr = ppImmediateContext.readBigUInt64LE(0);
    results.push({ config, detail: `FL ${levelLabel}`, hr, lane, level: levelLabel, status: 'ok' });
    releaseComObject(contextAddr);
    releaseComObject(deviceAddr);
    return;
  }

  const hrU = hr >>> 0;
  if (hrU === DXGI_ERROR_UNSUPPORTED || hrU === DXGI_ERROR_SDK_COMPONENT_MISSING || hrU === E_NOTIMPL || hrU === E_INVALIDARG) {
    const reason =
      hrU === DXGI_ERROR_UNSUPPORTED
        ? 'DXGI_ERROR_UNSUPPORTED'
        : hrU === DXGI_ERROR_SDK_COMPONENT_MISSING
        ? 'Graphics Tools / debug layer not installed'
        : hrU === E_NOTIMPL
        ? 'E_NOTIMPL (reference driver not installed)'
        : 'E_INVALIDARG';
    results.push({ config, detail: reason, hr, lane, level: '—', status: 'info' });
    return;
  }

  results.push({ config, detail: formatHResult(hr), hr, lane, level: '—', status: 'fail' });
}

function recordSwapChainResult(
  lane: string,
  config: string,
  driverType: D3D_DRIVER_TYPE,
  flags: number,
  levels: number[] | null,
  hwnd: bigint,
): void {
  const desc = buildSwapChainDesc(hwnd);
  const ppSwapChain = Buffer.alloc(POINTER_SIZE);
  const ppDevice = Buffer.alloc(POINTER_SIZE);
  const pFeatureLevel = Buffer.alloc(4);
  const ppImmediateContext = Buffer.alloc(POINTER_SIZE);
  const levelsBuf = levels === null ? null : levelsBuffer(levels);
  const levelsCount = levels === null ? 0 : levels.length;

  const hr = D3d11.D3D11CreateDeviceAndSwapChain(
    null,
    driverType,
    0n,
    flags,
    levelsBuf === null ? null : levelsBuf.ptr,
    levelsCount,
    D3D11_SDK_VERSION,
    desc.ptr,
    ppSwapChain.ptr,
    ppDevice.ptr,
    pFeatureLevel.ptr,
    ppImmediateContext.ptr,
  );

  const levelLabel = hr === 0 ? labelForLevel(pFeatureLevel.readUInt32LE(0)) : '—';

  if (hr === 0) {
    const swapAddr = ppSwapChain.readBigUInt64LE(0);
    const deviceAddr = ppDevice.readBigUInt64LE(0);
    const contextAddr = ppImmediateContext.readBigUInt64LE(0);
    results.push({ config, detail: `FL ${levelLabel}`, hr, lane, level: levelLabel, status: 'ok' });
    releaseComObject(contextAddr);
    releaseComObject(swapAddr);
    releaseComObject(deviceAddr);
    return;
  }

  const hrU = hr >>> 0;
  if (hrU === DXGI_ERROR_UNSUPPORTED || hrU === DXGI_ERROR_SDK_COMPONENT_MISSING || hrU === E_NOTIMPL || hrU === E_INVALIDARG) {
    const reason =
      hrU === DXGI_ERROR_UNSUPPORTED
        ? 'DXGI_ERROR_UNSUPPORTED'
        : hrU === DXGI_ERROR_SDK_COMPONENT_MISSING
        ? 'Graphics Tools not installed'
        : hrU === E_NOTIMPL
        ? 'E_NOTIMPL'
        : 'E_INVALIDARG';
    results.push({ config, detail: reason, hr, lane, level: '—', status: 'info' });
    return;
  }

  results.push({ config, detail: formatHResult(hr), hr, lane, level: '—', status: 'fail' });
}

const DEVICE_CONFIGS = [
  { config: 'HARDWARE · flags=0', driverType: D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE, flags: 0, levels: null },
  { config: 'HARDWARE · BGRA_SUPPORT', driverType: D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE, flags: D3D11_CREATE_DEVICE_FLAG.D3D11_CREATE_DEVICE_BGRA_SUPPORT, levels: null },
  { config: 'HARDWARE · DEBUG', driverType: D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE, flags: D3D11_CREATE_DEVICE_FLAG.D3D11_CREATE_DEVICE_DEBUG, levels: null },
  { config: 'HARDWARE · SINGLETHREADED', driverType: D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE, flags: D3D11_CREATE_DEVICE_FLAG.D3D11_CREATE_DEVICE_SINGLETHREADED, levels: null },
  { config: 'WARP · flags=0', driverType: D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_WARP, flags: 0, levels: null },
  { config: 'REFERENCE · flags=0', driverType: D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_REFERENCE, flags: 0, levels: null },
  { config: 'HARDWARE · FL=11_0 only', driverType: D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE, flags: 0, levels: [D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_11_0] },
  { config: 'HARDWARE · FL=10_0 only', driverType: D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE, flags: 0, levels: [D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_10_0] },
  { config: 'HARDWARE · FL=9_1 only', driverType: D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE, flags: 0, levels: [D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_9_1] },
];

for (const entry of DEVICE_CONFIGS) {
  recordDeviceResult('D3D11CreateDevice', entry.config, entry.driverType, entry.flags, entry.levels);
}

const hwnd = createMessageOnlyHwnd();
if (hwnd === 0n) {
  results.push({ config: 'could not allocate HWND_MESSAGE', detail: 'CreateWindowExW returned 0', hr: 0, lane: 'D3D11CreateDeviceAndSwapChain', level: '—', status: 'fail' });
} else {
  const SWAP_CONFIGS = [
    { config: 'HARDWARE · flags=0', driverType: D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE, flags: 0, levels: null },
    { config: 'HARDWARE · BGRA_SUPPORT', driverType: D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE, flags: D3D11_CREATE_DEVICE_FLAG.D3D11_CREATE_DEVICE_BGRA_SUPPORT, levels: null },
    { config: 'WARP · flags=0', driverType: D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_WARP, flags: 0, levels: null },
  ];
  for (const entry of SWAP_CONFIGS) {
    recordSwapChainResult('D3D11CreateDeviceAndSwapChain', entry.config, entry.driverType, entry.flags, entry.levels, hwnd);
  }
  user32.symbols.DestroyWindow(hwnd);
}

kernel32.close();
user32.close();

const LANE_WIDTH = Math.max(...results.map((r) => r.lane.length));
const CONFIG_WIDTH = Math.max(...results.map((r) => r.config.length));
const HR_WIDTH = 10;

console.log();
console.log(`${ANSI.bold}${ANSI.cyan}d3d11.dll${ANSI.reset}  ${ANSI.dim}device-creation probe · ${results.length} checks${ANSI.reset}`);
console.log();
console.log(`  ${ANSI.dim}${'Lane'.padEnd(LANE_WIDTH)}  ${'Config'.padEnd(CONFIG_WIDTH)}  ${'HRESULT'.padEnd(HR_WIDTH)}  Detail${ANSI.reset}`);
console.log(`  ${ANSI.dim}${'─'.repeat(Math.min(140, LANE_WIDTH + 2 + CONFIG_WIDTH + 2 + HR_WIDTH + 2 + 40))}${ANSI.reset}`);

const badge: Record<Status, string> = {
  fail: `${ANSI.red}✗${ANSI.reset}`,
  info: `${ANSI.cyan}ℹ${ANSI.reset}`,
  ok: `${ANSI.green}✓${ANSI.reset}`,
};

for (const r of results) {
  const hrRaw = r.hr === 0 ? 'S_OK' : formatHResult(r.hr);
  const hrColor = r.hr === 0 ? `${ANSI.green}S_OK${ANSI.reset}` : `${ANSI.red}${hrRaw}${ANSI.reset}`;
  const pad = ' '.repeat(Math.max(0, HR_WIDTH - hrRaw.length));
  const detail = r.status === 'info' ? `${ANSI.dim}${r.detail}${ANSI.reset}` : r.detail;
  console.log(`  ${badge[r.status]} ${ANSI.magenta}${r.lane.padEnd(LANE_WIDTH)}${ANSI.reset}  ${ANSI.yellow}${r.config.padEnd(CONFIG_WIDTH)}${ANSI.reset}  ${hrColor}${pad}  ${detail}`);
}

const okCount = results.filter((r) => r.status === 'ok').length;
const failCount = results.filter((r) => r.status === 'fail').length;
const infoCount = results.filter((r) => r.status === 'info').length;

const topLevel = results
  .filter((r) => r.status === 'ok' && r.level !== '—')
  .map((r) => FEATURE_LEVELS.find((f) => f.label === r.level))
  .filter((f): f is (typeof FEATURE_LEVELS)[number] => f !== undefined)
  .sort((a, b) => b.level - a.level)[0];

console.log();
console.log(
  `  ${ANSI.bold}${okCount}${ANSI.reset} ${ANSI.green}ok${ANSI.reset}` +
    `  ${ANSI.dim}•${ANSI.reset}  ${ANSI.bold}${failCount}${ANSI.reset} ${ANSI.red}fail${ANSI.reset}` +
    `  ${ANSI.dim}•${ANSI.reset}  ${ANSI.bold}${infoCount}${ANSI.reset} ${ANSI.cyan}info${ANSI.reset}` +
    (topLevel ? `  ${ANSI.dim}•${ANSI.reset}  max feature level ${ANSI.yellow}${topLevel.label}${ANSI.reset}` : ''),
);
console.log();

process.exit(failCount > 0 ? 1 : 0);
