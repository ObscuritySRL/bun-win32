/**
 * ADSI Directory Explorer
 *
 * A thorough, fully-formatted read-only walk of the local machine's directory
 * tree through the WinNT: ADSI provider — no domain required. It binds the
 * computer object with ADsGetObject, prints its identity (Name / Class / GUID /
 * ADsPath / Schema) read from the live IADs vtable, then uses the activeds
 * enumerator helpers (ADsBuildEnumerator / ADsEnumerateNext / ADsFreeEnumerator)
 * to enumerate every contained child object. Each child is QueryInterface'd to
 * IADs and reported in an aligned table grouped by ADSI class (User, Group,
 * Service, ...). Every COM pointer is released; every BSTR is freed.
 *
 * APIs demonstrated (Activeds):
 *   - ADsGetObject              (bind WinNT:// computer object → IADs/IADsContainer)
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
 * Run: bun run example/directory-explorer.ts
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
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[38;2;120;200;255m';
const GREEN = '\x1b[38;2;120;230;140m';
const AMBER = '\x1b[38;2;240;190;90m';
const RED = '\x1b[38;2;240;120;120m';
const VIOLET = '\x1b[38;2;190;150;255m';

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

// IID_IADs = {fd8256d0-fd15-11ce-abc4-02608c9e7553}
function iidIADs(): Buffer {
  const iid = Buffer.alloc(16);
  iid.writeUInt32LE(0xfd8256d0, 0);
  iid.writeUInt16LE(0xfd15, 4);
  iid.writeUInt16LE(0x11ce, 6);
  Buffer.from([0xab, 0xc4, 0x02, 0x60, 0x8c, 0x9e, 0x75, 0x53]).copy(iid, 8);
  return iid;
}

// IID_IADsContainer = {001677d0-fd16-11ce-abc4-02608c9e7553}
function iidIADsContainer(): Buffer {
  const iid = Buffer.alloc(16);
  iid.writeUInt32LE(0x001677d0, 0);
  iid.writeUInt16LE(0xfd16, 4);
  iid.writeUInt16LE(0x11ce, 6);
  Buffer.from([0xab, 0xc4, 0x02, 0x60, 0x8c, 0x9e, 0x75, 0x53]).copy(iid, 8);
  return iid;
}

const invokers = new Map<string, ReturnType<typeof CFunction>>();

// Cast-free COM vtable dispatch: read vtable[slot], cache a CFunction, prepend
// the implicit `this`. Args list excludes `this`; the helper prepends it.
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

// IADs / IADsContainer vtable slots (IUnknown 0-2, IDispatch 3-6).
const IUNKNOWN_QUERYINTERFACE = 0;
const IUNKNOWN_RELEASE = 2;
const IADS_GET_NAME = 7;
const IADS_GET_CLASS = 8;
const IADS_GET_GUID = 9;
const IADS_GET_ADSPATH = 10;
const IADS_GET_SCHEMA = 12;

/** Reads a BSTR by address (4-byte char count prefix, UTF-16LE payload), frees it. */
function takeBstr(addr: bigint): string {
  if (addr === 0n) return '';
  const byteLen = read.u32(Number(addr - 4n) as Pointer, 0);
  const out = Buffer.alloc(byteLen);
  for (let i = 0; i < byteLen; i++) out[i] = read.u8(Number(addr) as Pointer, i);
  oleaut32.symbols.SysFreeString(addr);
  return out.toString('utf16le');
}

/** Invokes an IADs [propget] returning BSTR; returns '' on failure. */
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

function hex(hr: number): string {
  return '0x' + (hr >>> 0).toString(16).padStart(8, '0');
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

const hrInit = ole32.symbols.CoInitializeEx(null, COINIT_APARTMENTTHREADED);
if (hrInit < 0) {
  console.log(`${RED}CoInitializeEx failed (${hex(hrInit)})${RESET}`);
  process.exit(1);
}

const computerName = process.env.COMPUTERNAME ?? 'localhost';
const bannerWidth = 64;

console.log();
console.log(`${VIOLET}${BOLD}${'═'.repeat(bannerWidth)}${RESET}`);
console.log(`${VIOLET}${BOLD}  ADSI Directory Explorer  ${DIM}— WinNT:// provider, read-only${RESET}`);
console.log(`${VIOLET}${BOLD}${'═'.repeat(bannerWidth)}${RESET}`);
console.log();

const path = Buffer.from(`WinNT://${computerName},computer\0`, 'utf16le');
const iidContainer = iidIADsContainer();
const ppContainer = Buffer.alloc(8);
const hrBind = Activeds.ADsGetObject(path.ptr!, iidContainer.ptr!, ppContainer.ptr!);
console.log(`  ${DIM}ADsGetObject("WinNT://${computerName},computer", IID_IADsContainer)${RESET} → ${hrBind === 0 ? GREEN : RED}${hex(hrBind)}${RESET}`);

const pContainer = ppContainer.readBigUInt64LE(0);
if (hrBind !== 0 || pContainer === 0n) {
  console.log(`\n  ${RED}Could not bind the computer object. ADSI/WinNT provider unavailable.${RESET}`);
  ole32.symbols.CoUninitialize();
  process.exit(0);
}

// The computer object also exposes IADs — query it for identity fields.
const iidAds = iidIADs();
const pComputerAds = queryInterface(pContainer, iidAds);
if (pComputerAds !== 0n) {
  console.log();
  console.log(`  ${BOLD}${CYAN}Computer object identity${RESET}`);
  console.log(`  ${DIM}${'─'.repeat(bannerWidth - 2)}${RESET}`);
  const fields: Array<[string, string]> = [
    ['Name', getStr(pComputerAds, IADS_GET_NAME)],
    ['Class', getStr(pComputerAds, IADS_GET_CLASS)],
    ['GUID', getStr(pComputerAds, IADS_GET_GUID)],
    ['ADsPath', getStr(pComputerAds, IADS_GET_ADSPATH)],
    ['Schema', getStr(pComputerAds, IADS_GET_SCHEMA)],
  ];
  for (const [label, value] of fields) {
    console.log(`  ${AMBER}${pad(label, 10)}${RESET} ${value === '' ? DIM + '(unavailable)' + RESET : value}`);
  }
  vcall(pComputerAds, IUNKNOWN_RELEASE, [], []);
}

// Enumerate children via the activeds helper trio.
const ppEnum = Buffer.alloc(8);
const hrEnum = Activeds.ADsBuildEnumerator(pContainer, ppEnum.ptr!);
console.log();
console.log(`  ${DIM}ADsBuildEnumerator(container)${RESET} → ${hrEnum === 0 ? GREEN : RED}${hex(hrEnum)}${RESET}`);
const pEnum = ppEnum.readBigUInt64LE(0);

const byClass = new Map<string, string[]>();
let total = 0;

if (hrEnum === 0 && pEnum !== 0n) {
  // VARIANT is 16 bytes; the dispatch pointer lives at offset 8.
  const variant = Buffer.alloc(16);
  const fetched = Buffer.alloc(4);

  for (;;) {
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
        if (!byClass.has(klass)) byClass.set(klass, []);
        byClass.get(klass)!.push(name);
        total++;
        vcall(pChildAds, IUNKNOWN_RELEASE, [], []);
      }
    }
    oleaut32.symbols.VariantClear(variant.ptr!);
  }

  Activeds.ADsFreeEnumerator(pEnum);
}

console.log();
console.log(`  ${BOLD}${CYAN}Contained objects${RESET}  ${DIM}(${total} total, grouped by ADSI class)${RESET}`);
console.log(`  ${DIM}${'─'.repeat(bannerWidth - 2)}${RESET}`);

const sortedClasses = [...byClass.keys()].sort();
if (sortedClasses.length === 0) {
  console.log(`  ${DIM}(no child objects enumerated)${RESET}`);
}
for (const klass of sortedClasses) {
  const names = byClass.get(klass)!.sort();
  console.log();
  console.log(`  ${GREEN}${BOLD}${klass}${RESET} ${DIM}× ${names.length}${RESET}`);
  const columns = 3;
  for (let i = 0; i < names.length; i += columns) {
    const row = names
      .slice(i, i + columns)
      .map((n) => `${AMBER}•${RESET} ${pad(n, 18)}`)
      .join('  ');
    console.log(`    ${row}`);
  }
}

vcall(pContainer, IUNKNOWN_RELEASE, [], []);
ole32.symbols.CoUninitialize();

console.log();
console.log(`${VIOLET}${BOLD}${'═'.repeat(bannerWidth)}${RESET}`);
console.log(`  ${DIM}Walked the local directory tree read-only — every COM pointer released.${RESET}`);
console.log(`${VIOLET}${BOLD}${'═'.repeat(bannerWidth)}${RESET}`);
console.log();
