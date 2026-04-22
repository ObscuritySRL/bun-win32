/**
 * GPU Observatory
 *
 * Walks the machine's entire graphics stack through DXGI without loading
 * Direct3D. Creates an `IDXGIFactory1`, enumerates every adapter via
 * `EnumAdapters1`, reads each `DXGI_ADAPTER_DESC1` directly from the COM
 * vtable, counts attached outputs per adapter, decodes vendor IDs (NVIDIA,
 * AMD, Intel, Microsoft, Qualcomm), and renders a full-color ANSI
 * observatory: each adapter's name, PCI triplet, VRAM breakdown, capability
 * flags, and a proportional bar chart of dedicated video memory so you can
 * see at a glance which GPU the OS will prefer.
 *
 * APIs demonstrated:
 *   - Dxgi.CreateDXGIFactory1             (create the top-level DXGI factory)
 *   - IDXGIFactory1::EnumAdapters1        (walk adapters via COM vtable)
 *   - IDXGIAdapter1::GetDesc1             (read DXGI_ADAPTER_DESC1 into a buffer)
 *   - IDXGIAdapter1::EnumOutputs          (count monitors per adapter)
 *   - IUnknown::Release                   (release every COM object)
 *   - kernel32!ReadProcessMemory          (walk native vtable pointers)
 *   - kernel32!GetCurrentProcess          (current-process handle for memory reads)
 *
 * Run: bun run example:gpu-observatory
 */

import { FFIType, dlopen, linkSymbols } from 'bun:ffi';

import Dxgi, { DXGI_ADAPTER_FLAG } from '..';

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[96m',
  dim: '\x1b[2m',
  green: '\x1b[92m',
  magenta: '\x1b[95m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
  white: '\x1b[97m',
  yellow: '\x1b[93m',
  blue: '\x1b[94m',
} as const;

const ADAPTER_DESC1_SIZE = 312;
const DXGI_ERROR_NOT_FOUND = 0x887a_0002 >>> 0;
const ENUM_ADAPTERS1_OFFSET = 0x60;
const ENUM_OUTPUTS_OFFSET = 0x38;
const GET_DESC1_OFFSET = 0x50;
const IID_IDXGIFACTORY1 = '770aae78-f26f-4dba-a829-253c83d1b387';
const POINTER_SIZE = 8;
const RELEASE_OFFSET = 0x10;

Dxgi.Preload(['CreateDXGIFactory1']);

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

function decodeWideString(buffer: Buffer, offset: number, maxChars: number): string {
  const end = offset + maxChars * 2;
  let termAt = end;
  for (let i = offset; i < end; i += 2) {
    if (buffer.readUInt16LE(i) === 0) {
      termAt = i;
      break;
    }
  }
  return buffer.subarray(offset, termAt).toString('utf16le');
}

function formatBytes(bytes: bigint): string {
  const value = Number(bytes);
  if (value <= 0) return '0 B';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function vendorName(vendorId: number): { color: string; name: string } {
  switch (vendorId) {
    case 0x10de:
      return { color: ANSI.green, name: 'NVIDIA' };
    case 0x1002:
    case 0x1022:
      return { color: ANSI.red, name: 'AMD' };
    case 0x8086:
      return { color: ANSI.blue, name: 'Intel' };
    case 0x1414:
      return { color: ANSI.cyan, name: 'Microsoft' };
    case 0x5143:
      return { color: ANSI.magenta, name: 'Qualcomm' };
    case 0x106b:
      return { color: ANSI.white, name: 'Apple' };
    default:
      return { color: ANSI.yellow, name: `0x${vendorId.toString(16).padStart(4, '0')}` };
  }
}

function flagBadges(flags: number): string {
  const badges: string[] = [];
  if ((flags & DXGI_ADAPTER_FLAG.DXGI_ADAPTER_FLAG_SOFTWARE) !== 0) badges.push(`${ANSI.yellow}software${ANSI.reset}`);
  if ((flags & DXGI_ADAPTER_FLAG.DXGI_ADAPTER_FLAG_REMOTE) !== 0) badges.push(`${ANSI.cyan}remote${ANSI.reset}`);
  if (badges.length === 0) badges.push(`${ANSI.dim}hardware${ANSI.reset}`);
  return badges.join(' ');
}

interface Adapter {
  address: bigint;
  description: string;
  deviceId: number;
  flags: number;
  luidHigh: number;
  luidLow: number;
  outputs: number;
  revision: number;
  subSysId: number;
  vendorId: number;
  vramDedicated: bigint;
  vramShared: bigint;
  systemDedicated: bigint;
}

const iidFactory1 = guidBytes(IID_IDXGIFACTORY1);
const factoryOut = Buffer.alloc(POINTER_SIZE);
const factoryHr = Dxgi.CreateDXGIFactory1(iidFactory1.ptr, factoryOut.ptr);
if (factoryHr !== 0) {
  console.error(`${ANSI.red}CreateDXGIFactory1 failed: 0x${(factoryHr >>> 0).toString(16).padStart(8, '0')}${ANSI.reset}`);
  process.exit(1);
}
const factoryAddress = factoryOut.readBigUInt64LE(0);
const factoryVtable = readPointerAt(factoryAddress);
const factoryEnum = readPointerAt(factoryVtable + BigInt(ENUM_ADAPTERS1_OFFSET));
const factoryRelease = readPointerAt(factoryVtable + BigInt(RELEASE_OFFSET));

const factoryCalls = linkSymbols({
  EnumAdapters1: {
    args: [FFIType.u64, FFIType.u32, FFIType.ptr],
    ptr: factoryEnum,
    returns: FFIType.i32,
  },
  Release: {
    args: [FFIType.u64],
    ptr: factoryRelease,
    returns: FFIType.u32,
  },
});

const adapters: Adapter[] = [];

for (let i = 0; i < 16; i += 1) {
  const adapterOut = Buffer.alloc(POINTER_SIZE);
  const enumHr = factoryCalls.symbols.EnumAdapters1(factoryAddress, i, adapterOut.ptr);
  if ((enumHr >>> 0) === DXGI_ERROR_NOT_FOUND) break;
  if (enumHr !== 0) {
    console.error(`${ANSI.red}EnumAdapters1(${i}) → 0x${(enumHr >>> 0).toString(16).padStart(8, '0')}${ANSI.reset}`);
    break;
  }

  const adapterAddress = adapterOut.readBigUInt64LE(0);
  const adapterVtable = readPointerAt(adapterAddress);
  const getDesc1Addr = readPointerAt(adapterVtable + BigInt(GET_DESC1_OFFSET));
  const enumOutputsAddr = readPointerAt(adapterVtable + BigInt(ENUM_OUTPUTS_OFFSET));
  const releaseAddr = readPointerAt(adapterVtable + BigInt(RELEASE_OFFSET));

  const adapterCalls = linkSymbols({
    EnumOutputs: {
      args: [FFIType.u64, FFIType.u32, FFIType.ptr],
      ptr: enumOutputsAddr,
      returns: FFIType.i32,
    },
    GetDesc1: {
      args: [FFIType.u64, FFIType.ptr],
      ptr: getDesc1Addr,
      returns: FFIType.i32,
    },
    Release: {
      args: [FFIType.u64],
      ptr: releaseAddr,
      returns: FFIType.u32,
    },
  });

  const desc = Buffer.alloc(ADAPTER_DESC1_SIZE);
  const descHr = adapterCalls.symbols.GetDesc1(adapterAddress, desc.ptr);
  if (descHr !== 0) {
    adapterCalls.symbols.Release(adapterAddress);
    adapterCalls.close();
    console.error(`${ANSI.red}GetDesc1 failed on adapter ${i}: 0x${(descHr >>> 0).toString(16).padStart(8, '0')}${ANSI.reset}`);
    continue;
  }

  let outputs = 0;
  const outputOut = Buffer.alloc(POINTER_SIZE);
  for (let j = 0; j < 16; j += 1) {
    const outHr = adapterCalls.symbols.EnumOutputs(adapterAddress, j, outputOut.ptr);
    if ((outHr >>> 0) === DXGI_ERROR_NOT_FOUND || outHr !== 0) break;
    outputs += 1;
    const outputAddress = outputOut.readBigUInt64LE(0);
    if (outputAddress !== 0n) {
      const outputVtable = readPointerAt(outputAddress);
      const outputRelease = readPointerAt(outputVtable + BigInt(RELEASE_OFFSET));
      const outputCalls = linkSymbols({
        Release: { args: [FFIType.u64], ptr: outputRelease, returns: FFIType.u32 },
      });
      outputCalls.symbols.Release(outputAddress);
      outputCalls.close();
    }
  }

  adapters.push({
    address: adapterAddress,
    description: decodeWideString(desc, 0, 128).replace(/\0.*$/, '').trim(),
    deviceId: desc.readUInt32LE(260),
    flags: desc.readUInt32LE(304),
    luidHigh: desc.readInt32LE(300),
    luidLow: desc.readUInt32LE(296),
    outputs,
    revision: desc.readUInt32LE(268),
    subSysId: desc.readUInt32LE(264),
    vendorId: desc.readUInt32LE(256),
    vramDedicated: desc.readBigUInt64LE(272),
    systemDedicated: desc.readBigUInt64LE(280),
    vramShared: desc.readBigUInt64LE(288),
  });

  adapterCalls.symbols.Release(adapterAddress);
  adapterCalls.close();
}

factoryCalls.symbols.Release(factoryAddress);
factoryCalls.close();
kernel32.close();

const maxVram = adapters.reduce((m, a) => (a.vramDedicated > m ? a.vramDedicated : m), 1n);
const totalDedicated = adapters.reduce((sum, a) => sum + a.vramDedicated, 0n);
const totalShared = adapters.reduce((sum, a) => sum + a.vramShared, 0n);
const hardwareCount = adapters.filter((a) => (a.flags & DXGI_ADAPTER_FLAG.DXGI_ADAPTER_FLAG_SOFTWARE) === 0).length;
const totalOutputs = adapters.reduce((sum, a) => sum + a.outputs, 0);

console.log();
console.log(`${ANSI.bold}${ANSI.magenta}◼ GPU Observatory${ANSI.reset}  ${ANSI.dim}— DXGI adapter enumeration${ANSI.reset}`);
console.log(`${ANSI.dim}  ${adapters.length} adapter${adapters.length === 1 ? '' : 's'} · ${hardwareCount} hardware · ${totalOutputs} output${totalOutputs === 1 ? '' : 's'}${ANSI.reset}`);
console.log();

const BAR_WIDTH = 30;

for (let index = 0; index < adapters.length; index += 1) {
  const adapter = adapters[index];
  const vendor = vendorName(adapter.vendorId);
  const ratio = Number(adapter.vramDedicated) / Number(maxVram);
  const filled = Math.max(1, Math.round(ratio * BAR_WIDTH));
  const bar = `${vendor.color}${'█'.repeat(filled)}${ANSI.reset}${ANSI.dim}${'░'.repeat(BAR_WIDTH - filled)}${ANSI.reset}`;
  const pci = `${adapter.vendorId.toString(16).padStart(4, '0')}:${adapter.deviceId.toString(16).padStart(4, '0')}`;
  const luid = `${adapter.luidHigh.toString(16)}.${adapter.luidLow.toString(16).padStart(8, '0')}`;

  console.log(`  ${ANSI.bold}${vendor.color}[${index}]${ANSI.reset} ${ANSI.white}${adapter.description}${ANSI.reset}`);
  console.log(`      ${bar}  ${ANSI.yellow}${formatBytes(adapter.vramDedicated).padStart(9, ' ')}${ANSI.reset} ${ANSI.dim}dedicated${ANSI.reset}`);
  console.log(
    `      ${ANSI.dim}vendor${ANSI.reset} ${vendor.color}${vendor.name.padEnd(10)}${ANSI.reset}` +
      `  ${ANSI.dim}pci${ANSI.reset} ${ANSI.cyan}${pci}${ANSI.reset}` +
      `  ${ANSI.dim}rev${ANSI.reset} ${adapter.revision}` +
      `  ${ANSI.dim}luid${ANSI.reset} ${ANSI.magenta}${luid}${ANSI.reset}`,
  );
  console.log(
    `      ${ANSI.dim}shared${ANSI.reset} ${formatBytes(adapter.vramShared).padStart(9, ' ')}` +
      `  ${ANSI.dim}sys-dedicated${ANSI.reset} ${formatBytes(adapter.systemDedicated).padStart(9, ' ')}` +
      `  ${ANSI.dim}outputs${ANSI.reset} ${ANSI.green}${adapter.outputs}${ANSI.reset}` +
      `  ${ANSI.dim}class${ANSI.reset} ${flagBadges(adapter.flags)}`,
  );
  console.log();
}

console.log(`${ANSI.dim}  ─ totals ─${ANSI.reset}`);
console.log(
  `  ${ANSI.dim}dedicated VRAM${ANSI.reset} ${ANSI.yellow}${formatBytes(totalDedicated)}${ANSI.reset}` +
    `  ${ANSI.dim}shared pool${ANSI.reset} ${ANSI.yellow}${formatBytes(totalShared)}${ANSI.reset}`,
);
console.log();

process.exit(adapters.length === 0 ? 1 : 0);
