/**
 * D3D11 Interop Probe
 *
 * Walks the WinRT interop and D3D11-on-D3D12 bridges exposed by `d3d11.dll`.
 * Creates a baseline ID3D11Device, queries its IDXGIDevice, hands it to
 * `CreateDirect3D11DeviceFromDXGIDevice` to get a WinRT
 * `IDirect3DDevice`, creates a render-target texture, queries its IDXGISurface,
 * and feeds that to `CreateDirect3D11SurfaceFromDXGISurface`. Finally, it
 * tries `D3D11On12CreateDevice` by cold-loading `d3d12.dll`, creating a
 * D3D12 device + direct command queue, and wrapping them in an 11-on-12
 * device. Each step is reported as a pass/fail row so you can see which
 * interop paths are live on this machine.
 *
 * APIs demonstrated:
 *   - D3d11.D3D11CreateDevice                        (bootstrap ID3D11Device)
 *   - D3d11.CreateDirect3D11DeviceFromDXGIDevice     (WinRT device interop)
 *   - D3d11.CreateDirect3D11SurfaceFromDXGISurface   (WinRT surface interop)
 *   - D3d11.D3D11On12CreateDevice                    (D3D11-on-D3D12 bridge)
 *   - ID3D11Device::CreateTexture2D                  (IDXGI-capable texture)
 *   - IUnknown::QueryInterface / Release             (COM plumbing)
 *   - d3d12!D3D12CreateDevice                        (12 device for the on-12 bridge)
 *
 * Run: bun run example:d3d11-interop-probe
 */

import { FFIType, dlopen, linkSymbols, read, type Pointer } from 'bun:ffi';

import D3d11, { D3D11_SDK_VERSION, D3D_DRIVER_TYPE, D3D_FEATURE_LEVEL } from '..';

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

const POINTER_SIZE = 8;
const QUERY_INTERFACE_OFFSET = 0x00;
const RELEASE_OFFSET = 0x10;
const CREATE_TEXTURE2D_OFFSET = 0x28;
const D3D12_CREATE_COMMAND_QUEUE_OFFSET = 0x40;

const IID_IDXGIDEVICE = '54ec77fa-1377-44e6-8c32-88fd5f44c84c';
const IID_IDXGISURFACE = 'cafcb56c-6ac3-4889-bf47-9e23bbd260ec';
const IID_ID3D12DEVICE = '189819f1-1db6-4b57-be54-1821339b85f7';
const IID_ID3D12COMMANDQUEUE = '0ec870a6-5d7e-4c22-8cfc-5baae07616ed';

type Status = 'ok' | 'fail' | 'info';

interface Check {
  detail: string;
  hr: number | null;
  name: string;
  status: Status;
}

const checks: Check[] = [];

const kernel32 = dlopen('kernel32.dll', {
  GetCurrentProcess: { args: [], returns: FFIType.u64 },
  ReadProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
});

const currentProcess = kernel32.symbols.GetCurrentProcess();

D3d11.Preload();

function formatHResult(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
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

function comRelease(address: bigint): void {
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

function comQueryInterface(address: bigint, iid: string): { addr: bigint; hr: number; ptr: Pointer | null } {
  const vtable = readPointerAt(address);
  const qiAddr = readPointerAt(vtable + BigInt(QUERY_INTERFACE_OFFSET));
  const calls = linkSymbols({
    QueryInterface: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], ptr: qiAddr, returns: FFIType.i32 },
  });
  try {
    const iidBuf = guidBytes(iid);
    const out = Buffer.alloc(POINTER_SIZE);
    const hr = calls.symbols.QueryInterface(address, iidBuf.ptr, out.ptr);
    if (hr !== 0) return { addr: 0n, hr, ptr: null };
    return { addr: out.readBigUInt64LE(0), hr, ptr: read.ptr(out.ptr, 0) as Pointer };
  } finally {
    calls.close();
  }
}

function record(name: string, status: Status, hr: number | null, detail: string): void {
  checks.push({ detail, hr, name, status });
}

const ppDevice = Buffer.alloc(POINTER_SIZE);
const pFeatureLevel = Buffer.alloc(4);
const ppContext = Buffer.alloc(POINTER_SIZE);

const featureLevels = Buffer.alloc(4);
featureLevels.writeUInt32LE(D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_11_0, 0);

const hrDevice = D3d11.D3D11CreateDevice(
  null,
  D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE,
  0n,
  0,
  featureLevels.ptr,
  1,
  D3D11_SDK_VERSION,
  ppDevice.ptr,
  pFeatureLevel.ptr,
  ppContext.ptr,
);

record(
  'D3D11CreateDevice',
  hrDevice === 0 ? 'ok' : 'fail',
  hrDevice,
  hrDevice === 0 ? 'hardware · FL 11_0' : formatHResult(hrDevice),
);

const deviceAddr = hrDevice === 0 ? ppDevice.readBigUInt64LE(0) : 0n;
const contextAddr = hrDevice === 0 ? ppContext.readBigUInt64LE(0) : 0n;

const dxgi = deviceAddr !== 0n ? comQueryInterface(deviceAddr, IID_IDXGIDEVICE) : { addr: 0n, hr: -1, ptr: null };
if (deviceAddr !== 0n) {
  record(
    'ID3D11Device → IDXGIDevice',
    dxgi.hr === 0 ? 'ok' : 'fail',
    dxgi.hr,
    dxgi.hr === 0 ? `@ ${formatAddress(dxgi.addr)}` : formatHResult(dxgi.hr),
  );
}

if (dxgi.ptr !== null) {
  const out = Buffer.alloc(POINTER_SIZE);
  const hr = D3d11.CreateDirect3D11DeviceFromDXGIDevice(dxgi.ptr, out.ptr);
  if (hr === 0) {
    const inspectableAddr = out.readBigUInt64LE(0);
    record('CreateDirect3D11DeviceFromDXGIDevice', 'ok', hr, `IInspectable @ ${formatAddress(inspectableAddr)}`);
    comRelease(inspectableAddr);
  } else {
    record('CreateDirect3D11DeviceFromDXGIDevice', 'fail', hr, formatHResult(hr));
  }
}

let textureAddr = 0n;
if (deviceAddr !== 0n) {
  const desc = Buffer.alloc(44);
  desc.writeUInt32LE(64, 0);
  desc.writeUInt32LE(64, 4);
  desc.writeUInt32LE(1, 8);
  desc.writeUInt32LE(1, 12);
  desc.writeUInt32LE(28, 16);
  desc.writeUInt32LE(1, 20);
  desc.writeUInt32LE(0, 24);
  desc.writeUInt32LE(0, 28);
  desc.writeUInt32LE(0x20, 32);
  desc.writeUInt32LE(0, 36);
  desc.writeUInt32LE(0, 40);

  const vtable = readPointerAt(deviceAddr);
  const createAddr = readPointerAt(vtable + BigInt(CREATE_TEXTURE2D_OFFSET));
  const calls = linkSymbols({
    CreateTexture2D: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], ptr: createAddr, returns: FFIType.i32 },
  });
  try {
    const out = Buffer.alloc(POINTER_SIZE);
    const hr = calls.symbols.CreateTexture2D(deviceAddr, desc.ptr, null, out.ptr);
    if (hr === 0) {
      textureAddr = out.readBigUInt64LE(0);
      record('ID3D11Device::CreateTexture2D', 'ok', hr, `IDXGI-capable texture @ ${formatAddress(textureAddr)}`);
    } else {
      record('ID3D11Device::CreateTexture2D', 'fail', hr, formatHResult(hr));
    }
  } finally {
    calls.close();
  }
}

if (textureAddr !== 0n) {
  const surface = comQueryInterface(textureAddr, IID_IDXGISURFACE);
  if (surface.ptr === null) {
    record('ID3D11Texture2D → IDXGISurface', 'fail', surface.hr, formatHResult(surface.hr));
  } else {
    const inspectOut = Buffer.alloc(POINTER_SIZE);
    const hr = D3d11.CreateDirect3D11SurfaceFromDXGISurface(surface.ptr, inspectOut.ptr);
    if (hr === 0) {
      const inspAddr = inspectOut.readBigUInt64LE(0);
      record('CreateDirect3D11SurfaceFromDXGISurface', 'ok', hr, `IInspectable @ ${formatAddress(inspAddr)}`);
      comRelease(inspAddr);
    } else {
      record('CreateDirect3D11SurfaceFromDXGISurface', 'fail', hr, formatHResult(hr));
    }
    comRelease(surface.addr);
  }
}

const d3d12 = (() => {
  try {
    return dlopen('d3d12.dll', {
      D3D12CreateDevice: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    });
  } catch (err) {
    record('D3D11On12CreateDevice', 'info', null, `d3d12.dll not available: ${(err as Error).message}`);
    return null;
  }
})();

if (d3d12) {
  const iid12 = guidBytes(IID_ID3D12DEVICE);
  const out12 = Buffer.alloc(POINTER_SIZE);
  const hr12 = d3d12.symbols.D3D12CreateDevice(null, D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_11_0, iid12.ptr, out12.ptr);
  if (hr12 !== 0) {
    record('D3D11On12CreateDevice', 'info', hr12, `D3D12CreateDevice → ${formatHResult(hr12)} (no 12-capable adapter)`);
    d3d12.close();
  } else {
    const device12Addr = out12.readBigUInt64LE(0);
    const device12Ptr = read.ptr(out12.ptr, 0) as Pointer;
    const device12Vtable = readPointerAt(device12Addr);
    const createCommandQueueAddr = readPointerAt(device12Vtable + BigInt(D3D12_CREATE_COMMAND_QUEUE_OFFSET));

    const queueDesc = Buffer.alloc(16);
    queueDesc.writeUInt32LE(0, 0);
    queueDesc.writeInt32LE(0, 4);
    queueDesc.writeUInt32LE(0, 8);
    queueDesc.writeUInt32LE(0, 12);

    const queueCalls = linkSymbols({
      CreateCommandQueue: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], ptr: createCommandQueueAddr, returns: FFIType.i32 },
    });

    const iidQueue = guidBytes(IID_ID3D12COMMANDQUEUE);
    const queueOut = Buffer.alloc(POINTER_SIZE);
    const hrQueue = queueCalls.symbols.CreateCommandQueue(device12Addr, queueDesc.ptr, iidQueue.ptr, queueOut.ptr);
    queueCalls.close();

    if (hrQueue !== 0) {
      record('D3D11On12CreateDevice', 'fail', hrQueue, `CreateCommandQueue → ${formatHResult(hrQueue)}`);
      comRelease(device12Addr);
      d3d12.close();
    } else {
      const queueAddr = queueOut.readBigUInt64LE(0);
      const queueArray = Buffer.alloc(POINTER_SIZE);
      queueArray.writeBigUInt64LE(queueAddr, 0);

      const ppDevice11 = Buffer.alloc(POINTER_SIZE);
      const ppContext11 = Buffer.alloc(POINTER_SIZE);
      const pChosenFL = Buffer.alloc(4);

      const hrOn12 = D3d11.D3D11On12CreateDevice(device12Ptr, 0, featureLevels.ptr, 1, queueArray.ptr, 1, 0, ppDevice11.ptr, ppContext11.ptr, pChosenFL.ptr);
      if (hrOn12 === 0) {
        const dev11Addr = ppDevice11.readBigUInt64LE(0);
        const ctx11Addr = ppContext11.readBigUInt64LE(0);
        record('D3D11On12CreateDevice', 'ok', hrOn12, `11-on-12 device @ ${formatAddress(dev11Addr)}`);
        comRelease(ctx11Addr);
        comRelease(dev11Addr);
      } else {
        record('D3D11On12CreateDevice', 'fail', hrOn12, formatHResult(hrOn12));
      }

      comRelease(queueAddr);
      comRelease(device12Addr);
      d3d12.close();
    }
  }
}

comRelease(dxgi.addr);
comRelease(textureAddr);
comRelease(contextAddr);
comRelease(deviceAddr);

kernel32.close();

const NAME_WIDTH = Math.max(...checks.map((c) => c.name.length));
const HR_WIDTH = 10;

console.log();
console.log(`${ANSI.bold}${ANSI.cyan}d3d11.dll${ANSI.reset}  ${ANSI.dim}interop probe · ${checks.length} checks${ANSI.reset}`);
console.log();
console.log(`  ${ANSI.dim}${'Check'.padEnd(NAME_WIDTH)}  ${'HRESULT'.padEnd(HR_WIDTH)}  Detail${ANSI.reset}`);
console.log(`  ${ANSI.dim}${'─'.repeat(Math.min(140, NAME_WIDTH + 2 + HR_WIDTH + 2 + 60))}${ANSI.reset}`);

const badge: Record<Status, string> = {
  fail: `${ANSI.red}✗${ANSI.reset}`,
  info: `${ANSI.cyan}ℹ${ANSI.reset}`,
  ok: `${ANSI.green}✓${ANSI.reset}`,
};

for (const c of checks) {
  const hrRaw = c.hr === null ? '(n/a)' : c.hr === 0 ? 'S_OK' : formatHResult(c.hr);
  const hrColor = c.hr === null ? `${ANSI.dim}(n/a)${ANSI.reset}` : c.hr === 0 ? `${ANSI.green}S_OK${ANSI.reset}` : `${ANSI.red}${formatHResult(c.hr)}${ANSI.reset}`;
  const pad = ' '.repeat(Math.max(0, HR_WIDTH - hrRaw.length));
  const detail = c.status === 'info' ? `${ANSI.dim}${c.detail}${ANSI.reset}` : c.detail;
  console.log(`  ${badge[c.status]} ${ANSI.yellow}${c.name.padEnd(NAME_WIDTH)}${ANSI.reset}  ${hrColor}${pad}  ${detail}`);
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
