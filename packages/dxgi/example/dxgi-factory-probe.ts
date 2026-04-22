/**
 * DXGI Factory Probe
 *
 * Cold-starts every entry point exported by `dxgi.dll` and reports a
 * compatibility matrix so you can tell, on this machine right now, which
 * factory versions load, whether the Graphics Tools debug layer is installed,
 * whether the DXGI info queue is reachable, and how `DXGIDeclareAdapterRemovalSupport`
 * behaves on a first-then-repeat call. Each factory is instantiated against
 * a ladder of IIDs (IDXGIFactory → IDXGIFactory7) so the matrix also doubles
 * as a DXGI feature-level probe.
 *
 * APIs demonstrated:
 *   - Dxgi.CreateDXGIFactory                (baseline factory, Windows Vista+)
 *   - Dxgi.CreateDXGIFactory1               (adapter-enumeration factory)
 *   - Dxgi.CreateDXGIFactory2               (flag-aware factory with debug support)
 *   - Dxgi.DXGIDeclareAdapterRemovalSupport (opt-in for adapter-removal)
 *   - Dxgi.DXGIGetDebugInterface1           (IDXGIDebug / IDXGIInfoQueue access)
 *   - IUnknown::Release                     (release every returned COM object)
 *
 * Run: bun run example:dxgi-factory-probe
 */

import { FFIType, dlopen, linkSymbols } from 'bun:ffi';

import Dxgi, { DXGI_CREATE_FACTORY_DEBUG } from '..';

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

const DXGI_ERROR_ALREADY_EXISTS = 0x887a_0036 >>> 0;
const DXGI_ERROR_SDK_COMPONENT_MISSING = 0x887a_002d >>> 0;
const DXGI_ERROR_UNSUPPORTED = 0x887a_0004 >>> 0;
const E_NOINTERFACE = 0x8000_4002 >>> 0;

const FACTORY_IIDS: Array<{ iid: string; name: string }> = [
  { iid: '7b7166ec-21c7-44ae-b21a-c9ae321ae369', name: 'IDXGIFactory' },
  { iid: '770aae78-f26f-4dba-a829-253c83d1b387', name: 'IDXGIFactory1' },
  { iid: '50c83a1c-e072-4c48-87b0-3630fa36a6d0', name: 'IDXGIFactory2' },
  { iid: '25483823-cd46-4c7d-86ca-47aa95b837bd', name: 'IDXGIFactory3' },
  { iid: '1bc6ea02-ef36-464f-bf0c-21ca39e5168a', name: 'IDXGIFactory4' },
  { iid: '7632e1f5-ee65-4dca-87fd-84cd75f8838d', name: 'IDXGIFactory5' },
  { iid: 'c1b6694f-ff09-44a9-b03c-77900a0a1d17', name: 'IDXGIFactory6' },
  { iid: 'a4966eed-76db-44da-84c1-ee9a7afb20a8', name: 'IDXGIFactory7' },
];

const IID_IDXGIDEBUG = '119e7452-de9e-40fe-8806-88f90c12b441';
const IID_IDXGIDEBUG1 = 'c5a05f0c-16f2-4adf-9f4d-a8c4d58ac550';
const IID_IDXGIINFOQUEUE = 'd67441c7-672a-476f-9e82-cd55b44949ce';

Dxgi.Preload();

const kernel32 = dlopen('kernel32.dll', {
  GetCurrentProcess: { args: [], returns: FFIType.u64 },
  ReadProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
});

const currentProcess = kernel32.symbols.GetCurrentProcess();

type CheckStatus = 'ok' | 'fail' | 'info' | 'skip';

interface Check {
  detail: string;
  hr: number | null;
  name: string;
  status: CheckStatus;
}

const checks: Check[] = [];

function formatHResult(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
}

function describeHResult(hr: number | null): string {
  if (hr === null) return `${ANSI.dim}(n/a)${ANSI.reset}`;
  if (hr === 0) return `${ANSI.green}S_OK${ANSI.reset}`;
  return `${ANSI.red}${formatHResult(hr)}${ANSI.reset}`;
}

function formatAddress(value: bigint): string {
  return `0x${value.toString(16).padStart(16, '0')}`;
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

function releaseComObject(address: bigint): number {
  const vtable = readPointerAt(address);
  const releaseAddr = readPointerAt(vtable + BigInt(RELEASE_OFFSET));
  const calls = linkSymbols({
    Release: { args: [FFIType.u64], ptr: releaseAddr, returns: FFIType.u32 },
  });
  try {
    return calls.symbols.Release(address);
  } finally {
    calls.close();
  }
}

function recordCheck(name: string, status: CheckStatus, hr: number | null, detail: string): void {
  checks.push({ detail, hr, name, status });
}

for (const entry of FACTORY_IIDS) {
  const iidBuffer = guidBytes(entry.iid);
  const out = Buffer.alloc(POINTER_SIZE);
  const hr = Dxgi.CreateDXGIFactory(iidBuffer.ptr, out.ptr);
  const address = hr === 0 ? out.readBigUInt64LE(0) : 0n;
  if (hr === 0 && address !== 0n) {
    recordCheck(`CreateDXGIFactory  · ${entry.name}`, 'ok', hr, formatAddress(address));
    releaseComObject(address);
  } else if ((hr >>> 0) === E_NOINTERFACE) {
    recordCheck(`CreateDXGIFactory  · ${entry.name}`, 'info', hr, 'E_NOINTERFACE (interface unsupported on this Windows build)');
  } else {
    recordCheck(`CreateDXGIFactory  · ${entry.name}`, 'fail', hr, formatHResult(hr));
  }
}

for (const entry of FACTORY_IIDS) {
  const iidBuffer = guidBytes(entry.iid);
  const out = Buffer.alloc(POINTER_SIZE);
  const hr = Dxgi.CreateDXGIFactory1(iidBuffer.ptr, out.ptr);
  const address = hr === 0 ? out.readBigUInt64LE(0) : 0n;
  if (hr === 0 && address !== 0n) {
    recordCheck(`CreateDXGIFactory1 · ${entry.name}`, 'ok', hr, formatAddress(address));
    releaseComObject(address);
  } else if ((hr >>> 0) === E_NOINTERFACE) {
    recordCheck(`CreateDXGIFactory1 · ${entry.name}`, 'info', hr, 'E_NOINTERFACE (interface unsupported on this Windows build)');
  } else {
    recordCheck(`CreateDXGIFactory1 · ${entry.name}`, 'fail', hr, formatHResult(hr));
  }
}

for (const flags of [0, DXGI_CREATE_FACTORY_DEBUG]) {
  const label = flags === 0 ? 'flags=0' : 'DXGI_CREATE_FACTORY_DEBUG';
  const iidBuffer = guidBytes(FACTORY_IIDS[2].iid);
  const out = Buffer.alloc(POINTER_SIZE);
  const hr = Dxgi.CreateDXGIFactory2(flags, iidBuffer.ptr, out.ptr);
  const address = hr === 0 ? out.readBigUInt64LE(0) : 0n;
  if (hr === 0 && address !== 0n) {
    recordCheck(`CreateDXGIFactory2 · ${label}`, 'ok', hr, `IDXGIFactory2 @ ${formatAddress(address)}`);
    releaseComObject(address);
  } else if ((hr >>> 0) === DXGI_ERROR_SDK_COMPONENT_MISSING) {
    recordCheck(`CreateDXGIFactory2 · ${label}`, 'info', hr, 'Graphics Tools feature not installed — enable it via Settings → Apps → Optional Features');
  } else {
    recordCheck(`CreateDXGIFactory2 · ${label}`, 'fail', hr, formatHResult(hr));
  }
}

for (const entry of [
  { iid: IID_IDXGIDEBUG, name: 'IDXGIDebug' },
  { iid: IID_IDXGIDEBUG1, name: 'IDXGIDebug1' },
  { iid: IID_IDXGIINFOQUEUE, name: 'IDXGIInfoQueue' },
]) {
  const iidBuffer = guidBytes(entry.iid);
  const out = Buffer.alloc(POINTER_SIZE);
  const hr = Dxgi.DXGIGetDebugInterface1(0, iidBuffer.ptr, out.ptr);
  const address = hr === 0 ? out.readBigUInt64LE(0) : 0n;
  if (hr === 0 && address !== 0n) {
    recordCheck(`DXGIGetDebugInterface1 · ${entry.name}`, 'ok', hr, formatAddress(address));
    releaseComObject(address);
  } else if ((hr >>> 0) === DXGI_ERROR_SDK_COMPONENT_MISSING) {
    recordCheck(`DXGIGetDebugInterface1 · ${entry.name}`, 'info', hr, 'Graphics Tools / debug layer not installed');
  } else if ((hr >>> 0) === E_NOINTERFACE) {
    recordCheck(`DXGIGetDebugInterface1 · ${entry.name}`, 'info', hr, 'interface not exposed by this dxgi.dll build');
  } else {
    recordCheck(`DXGIGetDebugInterface1 · ${entry.name}`, 'fail', hr, formatHResult(hr));
  }
}

const removalFirst = Dxgi.DXGIDeclareAdapterRemovalSupport();
if (removalFirst === 0) {
  recordCheck('DXGIDeclareAdapterRemovalSupport · first', 'ok', removalFirst, 'process opted in for adapter-removal notifications');
} else if ((removalFirst >>> 0) === DXGI_ERROR_UNSUPPORTED) {
  recordCheck('DXGIDeclareAdapterRemovalSupport · first', 'info', removalFirst, 'DXGI_ERROR_UNSUPPORTED (Windows 10 1803+ required)');
} else {
  recordCheck('DXGIDeclareAdapterRemovalSupport · first', 'fail', removalFirst, formatHResult(removalFirst));
}

const removalSecond = Dxgi.DXGIDeclareAdapterRemovalSupport();
if ((removalSecond >>> 0) === DXGI_ERROR_ALREADY_EXISTS) {
  recordCheck('DXGIDeclareAdapterRemovalSupport · repeat', 'ok', removalSecond, 'returned DXGI_ERROR_ALREADY_EXISTS as documented on second call');
} else if (removalSecond === 0) {
  recordCheck('DXGIDeclareAdapterRemovalSupport · repeat', 'info', removalSecond, 'returned S_OK again (this OS does not guard repeat calls)');
} else if ((removalSecond >>> 0) === DXGI_ERROR_UNSUPPORTED) {
  recordCheck('DXGIDeclareAdapterRemovalSupport · repeat', 'info', removalSecond, 'DXGI_ERROR_UNSUPPORTED');
} else {
  recordCheck('DXGIDeclareAdapterRemovalSupport · repeat', 'fail', removalSecond, formatHResult(removalSecond));
}

kernel32.close();

const NAME_WIDTH = Math.max(...checks.map((c) => c.name.length));
const HR_WIDTH = 10;

console.log();
console.log(`${ANSI.bold}${ANSI.cyan}dxgi.dll${ANSI.reset}  ${ANSI.dim}factory probe · ${checks.length} checks${ANSI.reset}`);
console.log();
console.log(`  ${ANSI.dim}${'Check'.padEnd(NAME_WIDTH)}  ${'HRESULT'.padEnd(HR_WIDTH)}  Detail${ANSI.reset}`);
console.log(`  ${ANSI.dim}${'─'.repeat(Math.min(120, NAME_WIDTH + 2 + HR_WIDTH + 2 + 60))}${ANSI.reset}`);

const statusBadge: Record<CheckStatus, string> = {
  fail: `${ANSI.red}✗${ANSI.reset}`,
  info: `${ANSI.cyan}ℹ${ANSI.reset}`,
  ok: `${ANSI.green}✓${ANSI.reset}`,
  skip: `${ANSI.dim}·${ANSI.reset}`,
};

for (const check of checks) {
  const badge = statusBadge[check.status];
  const hrRaw = check.hr === null ? '(n/a)' : check.hr === 0 ? 'S_OK' : formatHResult(check.hr);
  const hrDisplay = describeHResult(check.hr);
  const pad = ' '.repeat(Math.max(0, HR_WIDTH - hrRaw.length));
  const detail = check.status === 'skip' || check.status === 'info' ? `${ANSI.dim}${check.detail}${ANSI.reset}` : check.detail;
  console.log(`  ${badge} ${ANSI.yellow}${check.name.padEnd(NAME_WIDTH)}${ANSI.reset}  ${hrDisplay}${pad}  ${detail}`);
}

const okCount = checks.filter((c) => c.status === 'ok').length;
const failCount = checks.filter((c) => c.status === 'fail').length;
const infoCount = checks.filter((c) => c.status === 'info').length;

console.log();
console.log(
  `  ${ANSI.bold}${okCount}${ANSI.reset} ${ANSI.green}ok${ANSI.reset}` +
    `  ${ANSI.dim}•${ANSI.reset}  ${ANSI.bold}${failCount}${ANSI.reset} ${ANSI.red}fail${ANSI.reset}` +
    `  ${ANSI.dim}•${ANSI.reset}  ${ANSI.bold}${infoCount}${ANSI.reset} ${ANSI.cyan}info${ANSI.reset}`,
);
console.log();

process.exit(failCount > 0 ? 1 : 0);
