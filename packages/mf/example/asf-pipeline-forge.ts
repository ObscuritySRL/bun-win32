/**
 * ASF Authoring Pipeline Forge
 *
 * Forges the independent Advanced Systems Format authoring objects — content
 * info, profile, multiplexer, indexer, and splitter — *entirely* through
 * `mf.dll` factory exports, with no media file and nothing touching disk.
 * Each forged object is a real in-process COM object: the demo walks its
 * `IUnknown` vtable (slot 1 `AddRef`, slot 2 `Release`) to read the live
 * reference count, proving the object is alive, then renders the assembled
 * authoring stack as a colored ANSI block diagram annotated with each node's
 * interface, native address, and refcount. Every object is released in
 * reverse-allocation order.
 *
 * APIs demonstrated (mf):
 *   - Mf.MFCreateASFContentInfo   (ASF header / content-info object)
 *   - Mf.MFCreateASFProfile       (ASF profile)
 *   - Mf.MFCreateASFMultiplexer   (interleave streams into ASF data packets)
 *   - Mf.MFCreateASFIndexer       (build / read the ASF seek index)
 *   - Mf.MFCreateASFSplitter      (demux ASF data packets back into samples)
 *
 * APIs demonstrated (mfplat, cross-package):
 *   - mfplat!MFStartup / MFShutdown          (Media Foundation lifecycle)
 *
 * APIs demonstrated (kernel32, cross-package):
 *   - kernel32!GetCurrentProcess             (pseudo-handle for self memory)
 *   - kernel32!ReadProcessMemory             (walk the COM vtable in-process)
 *
 * APIs demonstrated (ole32, cross-package):
 *   - ole32!CoInitializeEx / CoUninitialize  (COM apartment lifecycle)
 *
 * Run: bun run example:asf-pipeline-forge
 */

import { FFIType, dlopen, linkSymbols } from 'bun:ffi';

import Mf from '..';

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

const COINIT_APARTMENTTHREADED = 0x2;
const MF_VERSION = 0x0002_0070;
const MFSTARTUP_LITE = 0x1;
const POINTER_SIZE = 8;
const RELEASE_METHOD_OFFSET = 0x10;
const ADDREF_METHOD_OFFSET = 0x08;
const RPC_E_CHANGED_MODE = 0x8001_0106 >>> 0;

const kernel32 = dlopen('kernel32.dll', {
  GetCurrentProcess: { args: [], returns: FFIType.u64 },
  ReadProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
});

const mfplat = dlopen('mfplat.dll', {
  MFShutdown: { args: [], returns: FFIType.i32 },
  MFStartup: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
});

const ole32 = dlopen('ole32.dll', {
  CoInitializeEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  CoUninitialize: { args: [], returns: FFIType.void },
});

const currentProcess = kernel32.symbols.GetCurrentProcess();

function formatHResult(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
}

function readPointerAt(address: bigint): bigint {
  const buffer = Buffer.alloc(POINTER_SIZE);
  const ok = kernel32.symbols.ReadProcessMemory(currentProcess, address, buffer.ptr, BigInt(POINTER_SIZE), null);
  if (ok === 0) throw new Error(`ReadProcessMemory failed at 0x${address.toString(16)}`);
  return buffer.readBigUInt64LE(0);
}

/**
 * Bump then balance the COM reference count via the object's `IUnknown`
 * vtable. The vtable pointer sits at offset 0 of the object; slot 0 is
 * `QueryInterface`, slot 1 (`+0x08`) is `AddRef`, slot 2 (`+0x10`) is
 * `Release`. `AddRef` returns the post-increment count.
 */
function liveRefCount(objectAddress: bigint): number {
  const vtable = readPointerAt(objectAddress);
  const addRefAddress = readPointerAt(vtable + BigInt(ADDREF_METHOD_OFFSET));
  const releaseAddress = readPointerAt(vtable + BigInt(RELEASE_METHOD_OFFSET));
  const lib = linkSymbols({
    AddRef: { args: [FFIType.u64], ptr: addRefAddress, returns: FFIType.u32 },
    Release: { args: [FFIType.u64], ptr: releaseAddress, returns: FFIType.u32 },
  });
  try {
    const bumped = Number(lib.symbols.AddRef(objectAddress));
    lib.symbols.Release(objectAddress);
    return bumped - 1;
  } finally {
    lib.close();
  }
}

function comRelease(objectAddress: bigint): void {
  const vtable = readPointerAt(objectAddress);
  const releaseAddress = readPointerAt(vtable + BigInt(RELEASE_METHOD_OFFSET));
  const lib = linkSymbols({
    Release: { args: [FFIType.u64], ptr: releaseAddress, returns: FFIType.u32 },
  });
  try {
    lib.symbols.Release(objectAddress);
  } finally {
    lib.close();
  }
}

interface ForgedNode {
  hr: number;
  interfaceName: string;
  label: string;
  pointer: bigint;
  refCount: number;
}

const coInitHr = ole32.symbols.CoInitializeEx(null, COINIT_APARTMENTTHREADED);
const shouldUninitialize = coInitHr >= 0;
if (coInitHr < 0 && coInitHr >>> 0 !== RPC_E_CHANGED_MODE) {
  console.error(`${ANSI.red}CoInitializeEx failed: ${formatHResult(coInitHr)}${ANSI.reset}`);
  process.exit(1);
}

const startHr = mfplat.symbols.MFStartup(MF_VERSION, MFSTARTUP_LITE);
if (startHr < 0) {
  console.error(`${ANSI.red}MFStartup failed: ${formatHResult(startHr)}${ANSI.reset}`);
  if (shouldUninitialize) ole32.symbols.CoUninitialize();
  process.exit(1);
}

const nodes: ForgedNode[] = [];

function forge(label: string, interfaceName: string, hr: number, outBuffer: Buffer): void {
  if (hr !== 0) {
    nodes.push({ hr, interfaceName, label, pointer: 0n, refCount: 0 });
    return;
  }
  const pointer = outBuffer.readBigUInt64LE(0);
  const refCount = pointer === 0n ? 0 : liveRefCount(pointer);
  nodes.push({ hr, interfaceName, label, pointer, refCount });
}

const contentInfoOut = Buffer.alloc(POINTER_SIZE);
forge('ASF Content Info', 'IMFASFContentInfo', Mf.MFCreateASFContentInfo(contentInfoOut.ptr!), contentInfoOut);

const profileOut = Buffer.alloc(POINTER_SIZE);
forge('ASF Profile', 'IMFASFProfile', Mf.MFCreateASFProfile(profileOut.ptr!), profileOut);

const multiplexerOut = Buffer.alloc(POINTER_SIZE);
forge('ASF Multiplexer', 'IMFASFMultiplexer', Mf.MFCreateASFMultiplexer(multiplexerOut.ptr!), multiplexerOut);

const indexerOut = Buffer.alloc(POINTER_SIZE);
forge('ASF Indexer', 'IMFASFIndexer', Mf.MFCreateASFIndexer(indexerOut.ptr!), indexerOut);

const splitterOut = Buffer.alloc(POINTER_SIZE);
forge('ASF Splitter', 'IMFASFSplitter', Mf.MFCreateASFSplitter(splitterOut.ptr!), splitterOut);

const liveNodes = nodes.filter((node) => node.pointer !== 0n);
const BOX_WIDTH = 54;

function box(node: ForgedNode): string[] {
  const ok = node.pointer !== 0n;
  const accent = ok ? ANSI.green : ANSI.red;
  const status = ok ? `${ANSI.green}● live${ANSI.reset}` : `${ANSI.red}✗ ${formatHResult(node.hr)}${ANSI.reset}`;
  const addr = ok ? `0x${node.pointer.toString(16).padStart(12, '0')}` : '—'.padStart(14);
  const title = `${ANSI.bold}${node.label}${ANSI.reset}`;
  const iface = `${ANSI.cyan}${node.interfaceName}${ANSI.reset}`;
  const refs = ok ? `${ANSI.magenta}refs ${node.refCount}${ANSI.reset}` : `${ANSI.dim}refs —${ANSI.reset}`;
  const top = `${accent}╭${'─'.repeat(BOX_WIDTH - 2)}╮${ANSI.reset}`;
  const bottom = `${accent}╰${'─'.repeat(BOX_WIDTH - 2)}╯${ANSI.reset}`;
  const line1 = `${accent}│${ANSI.reset} ${title}  ${status}`;
  const line2 = `${accent}│${ANSI.reset} ${iface}  ${ANSI.dim}${addr}${ANSI.reset}  ${refs}`;
  return [top, line1, line2, bottom];
}

console.log();
console.log(`${ANSI.bold}${ANSI.cyan}ASF Authoring Pipeline Forge${ANSI.reset}  ${ANSI.dim}every node built pure-FFI from mf.dll — no file, no disk${ANSI.reset}`);
console.log();

for (let i = 0; i < nodes.length; i += 1) {
  for (const row of box(nodes[i])) console.log(`  ${row}`);
  if (i < nodes.length - 1) {
    console.log(`  ${ANSI.dim}${' '.repeat(Math.floor(BOX_WIDTH / 2))}│${ANSI.reset}`);
    console.log(`  ${ANSI.dim}${' '.repeat(Math.floor(BOX_WIDTH / 2))}▼${ANSI.reset}`);
  }
}

console.log();
console.log(`  ${ANSI.bold}${liveNodes.length}${ANSI.reset}/${nodes.length} COM objects forged live  ${ANSI.dim}•${ANSI.reset}  releasing in reverse order…`);

for (let i = liveNodes.length - 1; i >= 0; i -= 1) {
  comRelease(liveNodes[i].pointer);
}

mfplat.symbols.MFShutdown();
if (shouldUninitialize) ole32.symbols.CoUninitialize();
mfplat.close();
ole32.close();
kernel32.close();

const allLive = liveNodes.length === nodes.length;
console.log(`  ${allLive ? ANSI.green : ANSI.yellow}${'█'.repeat(liveNodes.length)}${ANSI.dim}${'·'.repeat(nodes.length - liveNodes.length)}${ANSI.reset}  ${ANSI.dim}pipeline released cleanly${ANSI.reset}`);
console.log();
