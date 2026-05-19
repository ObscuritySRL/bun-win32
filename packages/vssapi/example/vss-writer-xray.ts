/**
 * VSS Writer X-Ray
 *
 * A live, animated reveal of every Volume Shadow Copy *writer* registered on
 * this machine — SQL Server, the Registry, COM+, Hyper-V, Search, the System
 * Writer, and friends — driven entirely over the COM vtable from pure FFI.
 *
 * It boots the VSS backup engine with CreateVssBackupComponents, calls
 * InitializeForBackup, then GatherWriterMetadata (an asynchronous operation
 * that returns an IVssAsync which we Wait on through its vtable). Once the
 * metadata is in, GetWriterMetadataCount tells us how many writers exist and
 * GetWriterMetadata + IVssExamineWriterMetadata::GetIdentity X-rays each one's
 * friendly name, class GUID, instance GUID, usage type and source type. Every
 * COM object is released through IUnknown::Release; nothing is snapshotted,
 * backed up, or restored — this is read-only writer enumeration.
 *
 * APIs demonstrated (Vssapi):
 *   - CreateVssBackupComponentsInternal  (boot the VSS backup engine)
 *   - VssFreeSnapshotProperties          (init/zero a VSS_SNAPSHOT_PROP — lifecycle demo)
 *
 * COM vtable methods invoked (via raw FFI, no extra bindings):
 *   - IVssBackupComponents::InitializeForBackup / GatherWriterMetadata
 *   - IVssBackupComponents::GetWriterMetadataCount / GetWriterMetadata / Release
 *   - IVssAsync::Wait / QueryStatus / Release
 *   - IVssExamineWriterMetadata::GetIdentity / Release
 *
 * APIs demonstrated (cross-package):
 *   - Ole32.CoInitialize                       (enter a COM apartment — required by VSS)
 *   - Kernel32.GetCurrentProcess/ReadProcessMemory (cast-free vtable + string walk)
 *   - Kernel32.GetStdHandle/Get|SetConsoleMode (enable ANSI VT processing)
 *   - oleaut32!SysFreeString                   (free the writer-name BSTR)
 *
 * Run: bun run example/vss-writer-xray.ts
 */

import { dlopen, FFIType, linkSymbols } from 'bun:ffi';

import Vssapi from '../index';
import Kernel32 from '@bun-win32/kernel32';
import Ole32 from '@bun-win32/ole32';

// BSTRs from GetIdentity come back as raw addresses; bind SysFreeString with a
// u64 arg so it frees a bigint address with no pointer cast.
const oleaut32 = dlopen('oleaut32.dll', {
  SysFreeString: { args: [FFIType.u64], returns: FFIType.void },
});

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const RED = '\x1b[91m';
const MAGENTA = '\x1b[95m';
const BLUE = '\x1b[94m';

const S_OK = 0;
const S_FALSE = 1;
const STD_OUTPUT_HANDLE = 0xffff_fff5;
const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;

// IVssBackupComponents vtable slots (vsbackup.h, after IUnknown 0..2).
const IBC_RELEASE = 2;
const IBC_INITIALIZE_FOR_BACKUP = 5;
const IBC_GATHER_WRITER_METADATA = 9;
const IBC_GET_WRITER_METADATA_COUNT = 10;
const IBC_GET_WRITER_METADATA = 11;

// IVssAsync vtable slots (vss.h, after IUnknown 0..2).
const ASYNC_RELEASE = 2;
const ASYNC_WAIT = 4;
const ASYNC_QUERY_STATUS = 5;

// IVssExamineWriterMetadata vtable slots (vsbackup.h, after IUnknown 0..2).
const EWM_RELEASE = 2;
const EWM_GET_IDENTITY = 3;

const VSS_S_ASYNC_PENDING = 0x0004_2309;
const VSS_S_ASYNC_FINISHED = 0x0004_230a;
const INFINITE = 0xffff_ffff;

const USAGE = ['?', 'BOOTABLE_SYSTEM_STATE', 'SYSTEM_SERVICE', 'USER_DATA', 'OTHER'];
const SOURCE = ['?', 'TRANSACTED_DB', 'NONTRANSACTED_DB', 'OTHER'];

const sleep = (ms: number) => Bun.sleep(ms);

function enableVirtualTerminal(): void {
  const handle = Kernel32.GetStdHandle(STD_OUTPUT_HANDLE);
  const mode = Buffer.alloc(4);
  if (Kernel32.GetConsoleMode(handle, mode.ptr!)) {
    Kernel32.SetConsoleMode(handle, mode.readUInt32LE(0) | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
  }
}

function hresultName(hr: number): string {
  const u = hr >>> 0;
  if (hr === S_OK) return 'S_OK';
  if (hr === S_FALSE) return 'S_FALSE';
  if (u === 0x8007_0005) return 'E_ACCESSDENIED';
  if (u === 0x8007_0057) return 'E_INVALIDARG';
  if (u === 0x8000_ffff) return 'E_UNEXPECTED';
  if (u === 0x8004_230c) return 'VSS_E_BAD_STATE';
  if (u === 0x8004_2302) return 'VSS_E_PROVIDER_NOT_REGISTERED';
  if (u === VSS_S_ASYNC_FINISHED) return 'VSS_S_ASYNC_FINISHED';
  if (u === VSS_S_ASYNC_PENDING) return 'VSS_S_ASYNC_PENDING';
  return `0x${u.toString(16).padStart(8, '0')}`;
}

const SELF = Kernel32.GetCurrentProcess();

/** Reads a 64-bit pointer-sized value out of native memory (cast-free). */
function peek64(addr: bigint): bigint {
  const buf = Buffer.alloc(8);
  Kernel32.ReadProcessMemory(SELF, addr, buf.ptr!, 8n, 0n);
  return buf.readBigUInt64LE(0);
}

const invokers = new Map<string, (...a: unknown[]) => number>();

/** Invokes COM vtable slot `slot` on `thisPtr` with the given arg types. */
function vcall(thisPtr: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[]): number {
  const vtable = peek64(thisPtr);
  const method = peek64(vtable + BigInt(slot * 8));
  const key = `${method}|${argTypes.join(',')}`;
  let invoke = invokers.get(key);
  if (invoke === undefined) {
    // linkSymbols accepts a bigint `ptr` — no pointer cast needed.
    const lib = linkSymbols({ fn: { args: [FFIType.u64, ...argTypes], returns: FFIType.i32, ptr: method } });
    invoke = lib.symbols.fn;
    invokers.set(key, invoke);
  }
  return invoke(thisPtr, ...args);
}

/** Reads a NUL-terminated wide string straight out of native memory. */
function readWide(addr: bigint): string {
  if (addr === 0n) return '';
  const buf = Buffer.alloc(2048);
  Kernel32.ReadProcessMemory(SELF, addr, buf.ptr!, BigInt(buf.length), 0n);
  let end = 0;
  while (end + 1 < buf.length && buf.readUInt16LE(end) !== 0) end += 2;
  return buf.toString('utf16le', 0, end);
}

/** Formats a 16-byte GUID buffer as the canonical {xxxxxxxx-...} string. */
function formatGuid(buf: Buffer): string {
  const d1 = buf.readUInt32LE(0).toString(16).padStart(8, '0');
  const d2 = buf.readUInt16LE(4).toString(16).padStart(4, '0');
  const d3 = buf.readUInt16LE(6).toString(16).padStart(4, '0');
  const d4 = [...buf.subarray(8, 10)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const d5 = [...buf.subarray(10, 16)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `{${d1}-${d2}-${d3}-${d4}-${d5}}`;
}

async function main(): Promise<void> {
  enableVirtualTerminal();

  const init = Ole32.CoInitialize(null);
  if (init !== S_OK && init !== S_FALSE) {
    console.error(`${RED}CoInitialize failed: ${hresultName(init)}${RESET}`);
    return;
  }

  console.log(`\n${BOLD}${MAGENTA}  ┌────────────────────────────────────────────────┐${RESET}`);
  console.log(`${BOLD}${MAGENTA}  │             V S S   W R I T E R                │${RESET}`);
  console.log(`${BOLD}${MAGENTA}  │                 X - R A Y                      │${RESET}`);
  console.log(`${BOLD}${MAGENTA}  └────────────────────────────────────────────────┘${RESET}`);
  console.log(`  ${DIM}Every VSS writer on this box, over the COM vtable${RESET}\n`);

  // Lifecycle demo: VssFreeSnapshotProperties also safely zero-inits a struct.
  const propBuf = Buffer.alloc(0x60);
  propBuf.fill(0);
  Vssapi.VssFreeSnapshotProperties(propBuf.ptr!);
  console.log(`  ${DIM}VssFreeSnapshotProperties(zeroed VSS_SNAPSHOT_PROP) — lifecycle OK${RESET}\n`);

  // 1 ─ Boot the VSS backup engine.
  const ppBackup = Buffer.alloc(8);
  const hrCreate = Vssapi.CreateVssBackupComponentsInternal(ppBackup.ptr!);
  if (hrCreate !== S_OK) {
    console.log(`  ${RED}CreateVssBackupComponents → ${hresultName(hrCreate)}${RESET}`);
    if (hresultName(hrCreate) === 'E_ACCESSDENIED') {
      console.log(`  ${YELLOW}VSS requires an elevated (Administrator) process.${RESET}\n`);
    }
    return;
  }
  const pBackup = ppBackup.readBigUInt64LE(0);
  console.log(`  ${BOLD}${BLUE}══${RESET} ${BOLD}IVssBackupComponents${RESET} engine up ${DIM}@ 0x${pBackup.toString(16)}${RESET}`);

  // 2 ─ InitializeForBackup(NULL) — no transported document.
  const hrInit = vcall(pBackup, IBC_INITIALIZE_FOR_BACKUP, [FFIType.ptr], [null]);
  console.log(`     InitializeForBackup → ${hrInit === S_OK ? GREEN : RED}${hresultName(hrInit)}${RESET}`);
  if (hrInit !== S_OK) {
    vcall(pBackup, IBC_RELEASE, [], []);
    if (hresultName(hrInit) === 'E_ACCESSDENIED') console.log(`  ${YELLOW}Run elevated for writer metadata.${RESET}\n`);
    return;
  }

  // 3 ─ GatherWriterMetadata is async — Wait on the returned IVssAsync.
  const ppAsync = Buffer.alloc(8);
  const hrGather = vcall(pBackup, IBC_GATHER_WRITER_METADATA, [FFIType.ptr], [ppAsync.ptr!]);
  console.log(`     GatherWriterMetadata → ${hrGather === S_OK ? GREEN : RED}${hresultName(hrGather)}${RESET}`);
  if (hrGather === S_OK) {
    const pAsync = ppAsync.readBigUInt64LE(0);
    if (pAsync !== 0n) {
      process.stdout.write(`     ${DIM}waiting for writers to identify`);
      vcall(pAsync, ASYNC_WAIT, [FFIType.u32], [INFINITE]);
      const status = Buffer.alloc(4);
      const reserved = Buffer.alloc(4);
      vcall(pAsync, ASYNC_QUERY_STATUS, [FFIType.ptr, FFIType.ptr], [status.ptr!, reserved.ptr!]);
      process.stdout.write(` → ${hresultName(status.readInt32LE(0))}${RESET}\n`);
      vcall(pAsync, ASYNC_RELEASE, [], []);
    }
  }
  console.log();

  // 4 ─ How many writers identified?
  const countBuf = Buffer.alloc(4);
  const hrCount = vcall(pBackup, IBC_GET_WRITER_METADATA_COUNT, [FFIType.ptr], [countBuf.ptr!]);
  if (hrCount !== S_OK) {
    console.log(`  ${RED}GetWriterMetadataCount → ${hresultName(hrCount)}${RESET}`);
    vcall(pBackup, IBC_RELEASE, [], []);
    return;
  }
  const count = countBuf.readUInt32LE(0);
  console.log(`  ${BOLD}${count}${RESET} VSS writer${count === 1 ? '' : 's'} identified\n`);

  // 5 ─ X-ray each writer's identity.
  for (let i = 0; i < count; i += 1) {
    const pidInstance = Buffer.alloc(16);
    const ppMetadata = Buffer.alloc(8);
    const hrMeta = vcall(pBackup, IBC_GET_WRITER_METADATA, [FFIType.u32, FFIType.ptr, FFIType.ptr], [i, pidInstance.ptr!, ppMetadata.ptr!]);
    if (hrMeta !== S_OK) {
      console.log(`  ${DIM}[${i}] GetWriterMetadata → ${hresultName(hrMeta)}${RESET}`);
      continue;
    }
    const pMetadata = ppMetadata.readBigUInt64LE(0);

    const idInstance = Buffer.alloc(16);
    const idWriter = Buffer.alloc(16);
    const pbstrName = Buffer.alloc(8);
    const usage = Buffer.alloc(4);
    const source = Buffer.alloc(4);
    const hrId = vcall(pMetadata, EWM_GET_IDENTITY, [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], [idInstance.ptr!, idWriter.ptr!, pbstrName.ptr!, usage.ptr!, source.ptr!]);

    if (hrId === S_OK) {
      const nameAddr = pbstrName.readBigUInt64LE(0);
      const name = readWide(nameAddr) || '(unnamed)';
      const u = usage.readInt32LE(0);
      const s = source.readInt32LE(0);
      console.log(`  ${BOLD}${BLUE}▸${RESET} ${BOLD}${CYAN}${name}${RESET}`);
      console.log(`     ${'class'.padEnd(9)} ${DIM}${formatGuid(idWriter)}${RESET}`);
      console.log(`     ${'instance'.padEnd(9)} ${DIM}${formatGuid(idInstance)}${RESET}`);
      console.log(`     ${'usage'.padEnd(9)} ${YELLOW}${USAGE[u] ?? u}${RESET}   ${'source'.padEnd(7)} ${YELLOW}${SOURCE[s] ?? s}${RESET}`);

      // pbstrWriterName is caller-owned; free it.
      if (nameAddr !== 0n) oleaut32.symbols.SysFreeString(nameAddr);
    } else {
      console.log(`  ${DIM}[${i}] GetIdentity → ${hresultName(hrId)}${RESET}`);
    }
    vcall(pMetadata, EWM_RELEASE, [], []);
    await sleep(45);
    console.log();
  }

  // 6 ─ Strict teardown.
  vcall(pBackup, IBC_RELEASE, [], []);
  console.log(`${GREEN}${BOLD}  ✓ X-ray complete — engine released, nothing was backed up${RESET}\n`);
}

main();
