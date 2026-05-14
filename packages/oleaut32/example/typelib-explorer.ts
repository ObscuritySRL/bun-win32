/**
 * TypeLib Explorer
 *
 * Loads a registered OLE type library by ProgID, walks every coclass, interface,
 * dispatch, enum, and record it defines, and prints a richly formatted inspection
 * report. For every type it shows the GUID, TYPEKIND, and member roster (method
 * signatures with DISPIDs, property accessors, and enum constant values). The
 * output is the kind of structural dump you'd otherwise need OleView for.
 *
 * APIs demonstrated (Oleaut32):
 *   - LoadTypeLib                  (load a type library by path or ProgID)
 *   - ITypeLib::GetLibAttr / GetTypeInfoCount / GetTypeInfo / GetDocumentation
 *                                  (library-level enumeration via vtable)
 *   - ITypeInfo::GetTypeAttr / GetDocumentation / GetFuncDesc / GetVarDesc / GetNames
 *                                  (per-type-info member enumeration via vtable)
 *   - SysFreeString / SysStringByteLen
 *                                  (BSTR lifetime when reading docstrings)
 *   - VarBstrFromI4                (formatting enum constants for display)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode
 *                                  (enable ANSI VT processing in classic consoles)
 *
 * Run: bun run example/typelib-explorer.ts
 */

import { read, toArrayBuffer, type Pointer } from 'bun:ffi';

import Kernel32, { STD_HANDLE } from '@bun-win32/kernel32';
import Oleaut32, { TypeKind, InvokeKind, VarEnum, CallConv } from '../index';

Oleaut32.Preload(['LoadTypeLib', 'SysFreeString', 'SysStringByteLen']);
Kernel32.Preload(['GetStdHandle', 'GetConsoleMode', 'SetConsoleMode']);

// Enable VT processing in the console
const STD_OUTPUT = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
const modeBuf = Buffer.alloc(4);
if (Kernel32.GetConsoleMode(STD_OUTPUT, modeBuf.ptr!)) {
  Kernel32.SetConsoleMode(STD_OUTPUT, modeBuf.readUInt32LE(0) | 0x0004);
}

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const ITALIC = '\x1b[3m';
const CYAN = '\x1b[96m';
const MAGENTA = '\x1b[95m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const RED = '\x1b[91m';
const BLUE = '\x1b[94m';
const WHITE = '\x1b[97m';

// ── Helpers ────────────────────────────────────────────────────────────────

function readBstrAt(addr: Pointer | null): string {
  if (!addr) return '';
  const byteLen = Oleaut32.SysStringByteLen(addr);
  if (byteLen === 0) return '';
  return Buffer.from(toArrayBuffer(addr, 0, byteLen)).toString('utf16le');
}

function readBstrSlot(slotPtr: Pointer): string {
  const bstr = read.ptr(slotPtr, 0) as Pointer | null;
  if (!bstr) return '';
  const s = readBstrAt(bstr);
  Oleaut32.SysFreeString(bstr);
  return s;
}

// Format a GUID from a 16-byte buffer at the given pointer.
//   {Data1:8}-{Data2:4}-{Data3:4}-{Data4[0..1]:4}-{Data4[2..7]:12}
function readGuid(addr: Pointer): string {
  const buf = Buffer.from(toArrayBuffer(addr, 0, 16));
  const d1 = buf.readUInt32LE(0).toString(16).padStart(8, '0');
  const d2 = buf.readUInt16LE(4).toString(16).padStart(4, '0');
  const d3 = buf.readUInt16LE(6).toString(16).padStart(4, '0');
  const d4a = buf.subarray(8, 10).toString('hex');
  const d4b = buf.subarray(10, 16).toString('hex');
  return `{${d1}-${d2}-${d3}-${d4a}-${d4b}}`;
}

// COM vtable invocation — every interface pointer holds the address of a vtable
// where each entry is a function pointer at offset (slot * 8) on x64. We use
// CFunction to call those methods directly. The `this` pointer is always the
// implicit first argument, so we prepend FFIType.ptr to every signature.
import { CFunction, FFIType } from 'bun:ffi';

type FFISigName = 'ptr' | 'u64' | 'i64' | 'u32' | 'i32' | 'u16' | 'i16' | 'u8' | 'void';

const SIG_MAP: Record<FFISigName, number> = {
  ptr: FFIType.ptr,
  u64: FFIType.u64,
  i64: FFIType.i64,
  u32: FFIType.u32,
  i32: FFIType.i32,
  u16: FFIType.u16,
  i16: FFIType.i16,
  u8: FFIType.u8,
  void: FFIType.void,
};

function callVtable<TRet>(iface: Pointer, slot: number, argFFI: readonly FFISigName[], retFFI: FFISigName, args: readonly unknown[]): TRet {
  const vtable = read.ptr(iface, 0) as Pointer;
  const methodPtr = read.ptr(vtable, slot * 8) as Pointer;
  const fn = CFunction({
    args: ['ptr', ...argFFI].map((s) => SIG_MAP[s as FFISigName]),
    returns: SIG_MAP[retFFI],
    ptr: methodPtr,
  });
  return (fn as unknown as (...a: readonly unknown[]) => TRet)(iface, ...args);
}

// ITypeLib vtable slots (all ITypeLib methods, IUnknown first 3):
//   0  QueryInterface
//   1  AddRef
//   2  Release
//   3  GetTypeInfoCount  (UINT)
//   4  GetTypeInfo       (UINT index, ITypeInfo **ppTI)
//   5  GetTypeInfoType   (UINT index, TYPEKIND *pTKind)
//   6  GetTypeInfoOfGuid (REFGUID guid, ITypeInfo **ppTinfo)
//   7  GetLibAttr        (TLIBATTR **ppTLibAttr)
//   8  GetTypeComp
//   9  GetDocumentation  (INT index, BSTR *pBstrName, BSTR *pBstrDocString, DWORD *pdwHelpContext, BSTR *pBstrHelpFile)
//  10  IsName
//  11  FindName
//  12  ReleaseTLibAttr   (TLIBATTR *pTLibAttr)
const ITL_RELEASE = 2;
const ITL_GETTYPEINFOCOUNT = 3;
const ITL_GETTYPEINFO = 4;
const ITL_GETLIBATTR = 7;
const ITL_GETDOCUMENTATION = 9;
const ITL_RELEASETLIBATTR = 12;

// ITypeInfo vtable slots:
//   0..2  IUnknown
//   3  GetTypeAttr       (TYPEATTR **ppTypeAttr)
//   4  GetTypeComp
//   5  GetFuncDesc       (UINT index, FUNCDESC **ppFuncDesc)
//   6  GetVarDesc        (UINT index, VARDESC **ppVarDesc)
//   7  GetNames          (MEMBERID memid, BSTR *rgBstrNames, UINT cMaxNames, UINT *pcNames)
//   8  GetRefTypeOfImplType
//   9  GetImplTypeFlags
//  10  GetIDsOfNames
//  11  Invoke
//  12  GetDocumentation  (MEMBERID memid, BSTR *pBstrName, BSTR *pBstrDocString, DWORD *pdwHelpContext, BSTR *pBstrHelpFile)
//  13  GetDllEntry
//  14  GetRefTypeInfo
//  15  AddressOfMember
//  16  CreateInstance
//  17  GetMops
//  18  GetContainingTypeLib
//  19  ReleaseTypeAttr   (TYPEATTR *pTypeAttr)
//  20  ReleaseFuncDesc   (FUNCDESC *pFuncDesc)
//  21  ReleaseVarDesc    (VARDESC *pVarDesc)
const ITI_RELEASE = 2;
const ITI_GETTYPEATTR = 3;
const ITI_GETFUNCDESC = 5;
const ITI_GETVARDESC = 6;
const ITI_GETNAMES = 7;
const ITI_GETDOCUMENTATION = 12;
const ITI_RELEASETYPEATTR = 19;
const ITI_RELEASEFUNCDESC = 20;
const ITI_RELEASEVARDESC = 21;

// ── ITypeLib wrappers ──────────────────────────────────────────────────────

function ITL_Release(tlib: Pointer): number {
  return callVtable<number>(tlib, ITL_RELEASE, [], 'u32', []);
}

function ITL_GetTypeInfoCount(tlib: Pointer): number {
  return callVtable<number>(tlib, ITL_GETTYPEINFOCOUNT, [], 'u32', []);
}

function ITL_GetTypeInfo(tlib: Pointer, index: number): Pointer | null {
  const out = Buffer.alloc(8);
  const hr = callVtable<number>(tlib, ITL_GETTYPEINFO, ['u32', 'ptr'], 'i32', [index, out.ptr!]);
  if (hr !== 0) return null;
  return read.ptr(out.ptr!, 0) as Pointer | null;
}

interface LibAttr {
  guid: string;
  majorVersion: number;
  minorVersion: number;
  lcid: number;
  raw: Pointer;
}

function ITL_GetLibAttr(tlib: Pointer): LibAttr | null {
  const out = Buffer.alloc(8);
  const hr = callVtable<number>(tlib, ITL_GETLIBATTR, ['ptr'], 'i32', [out.ptr!]);
  if (hr !== 0) return null;
  const attrPtr = read.ptr(out.ptr!, 0) as Pointer | null;
  if (!attrPtr) return null;
  // TLIBATTR layout (32 bytes on x64):
  //   GUID guid (16)
  //   LCID lcid (4)
  //   SYSKIND syskind (4)
  //   WORD wMajorVerNum (2)
  //   WORD wMinorVerNum (2)
  //   WORD wLibFlags (2)
  //   ... padding
  const buf = Buffer.from(toArrayBuffer(attrPtr, 0, 32));
  return {
    guid: readGuid(attrPtr),
    lcid: buf.readUInt32LE(16),
    majorVersion: buf.readUInt16LE(24),
    minorVersion: buf.readUInt16LE(26),
    raw: attrPtr,
  };
}

function ITL_ReleaseTLibAttr(tlib: Pointer, attr: Pointer): void {
  callVtable<void>(tlib, ITL_RELEASETLIBATTR, ['ptr'], 'void', [attr]);
}

interface Documentation {
  name: string;
  docString: string;
  helpContext: number;
  helpFile: string;
}

function ITL_GetDocumentation(tlib: Pointer, index: number): Documentation {
  const pName = Buffer.alloc(8);
  const pDoc = Buffer.alloc(8);
  const pHelpCtx = Buffer.alloc(4);
  const pHelpFile = Buffer.alloc(8);
  callVtable<number>(tlib, ITL_GETDOCUMENTATION, ['i32', 'ptr', 'ptr', 'ptr', 'ptr'], 'i32', [index, pName.ptr!, pDoc.ptr!, pHelpCtx.ptr!, pHelpFile.ptr!]);
  return {
    name: readBstrSlot(pName.ptr!),
    docString: readBstrSlot(pDoc.ptr!),
    helpContext: pHelpCtx.readUInt32LE(0),
    helpFile: readBstrSlot(pHelpFile.ptr!),
  };
}

// ── ITypeInfo wrappers ─────────────────────────────────────────────────────

function ITI_Release(ti: Pointer): number {
  return callVtable<number>(ti, ITI_RELEASE, [], 'u32', []);
}

interface TypeAttr {
  guid: string;
  typeKind: number;
  cFuncs: number;
  cVars: number;
  cImplTypes: number;
  cbSizeInstance: number;
  raw: Pointer;
}

function ITI_GetTypeAttr(ti: Pointer): TypeAttr | null {
  const out = Buffer.alloc(8);
  const hr = callVtable<number>(ti, ITI_GETTYPEATTR, ['ptr'], 'i32', [out.ptr!]);
  if (hr !== 0) return null;
  const attrPtr = read.ptr(out.ptr!, 0) as Pointer | null;
  if (!attrPtr) return null;
  // TYPEATTR layout (~96 bytes on x64):
  //   GUID guid (16)
  //   LCID lcid (4)
  //   MEMBERID memidConstructor (4)
  //   MEMBERID memidDestructor (4)
  //   LPOLESTR lpstrSchema (8) — padding included
  //   ULONG cbSizeInstance (4)
  //   TYPEKIND typekind (4)
  //   WORD cFuncs (2)
  //   WORD cVars (2)
  //   WORD cImplTypes (2)
  //   WORD cbSizeVft (2)
  //   ... more fields
  const buf = Buffer.from(toArrayBuffer(attrPtr, 0, 80));
  return {
    guid: readGuid(attrPtr),
    cbSizeInstance: buf.readUInt32LE(40),
    typeKind: buf.readUInt32LE(44),
    cFuncs: buf.readUInt16LE(48),
    cVars: buf.readUInt16LE(50),
    cImplTypes: buf.readUInt16LE(52),
    raw: attrPtr,
  };
}

function ITI_ReleaseTypeAttr(ti: Pointer, attr: Pointer): void {
  callVtable<void>(ti, ITI_RELEASETYPEATTR, ['ptr'], 'void', [attr]);
}

function ITI_GetDocumentation(ti: Pointer, memid: number): Documentation {
  const pName = Buffer.alloc(8);
  const pDoc = Buffer.alloc(8);
  const pHelpCtx = Buffer.alloc(4);
  const pHelpFile = Buffer.alloc(8);
  callVtable<number>(ti, ITI_GETDOCUMENTATION, ['i32', 'ptr', 'ptr', 'ptr', 'ptr'], 'i32', [memid, pName.ptr!, pDoc.ptr!, pHelpCtx.ptr!, pHelpFile.ptr!]);
  return {
    name: readBstrSlot(pName.ptr!),
    docString: readBstrSlot(pDoc.ptr!),
    helpContext: pHelpCtx.readUInt32LE(0),
    helpFile: readBstrSlot(pHelpFile.ptr!),
  };
}

interface FuncDesc {
  memid: number;
  invokeKind: number;
  callConv: number;
  cParams: number;
  cParamsOpt: number;
  vtFunc: number;
  funcKind: number;
  raw: Pointer;
}

function ITI_GetFuncDesc(ti: Pointer, index: number): FuncDesc | null {
  const out = Buffer.alloc(8);
  const hr = callVtable<number>(ti, ITI_GETFUNCDESC, ['u32', 'ptr'], 'i32', [index, out.ptr!]);
  if (hr !== 0) return null;
  const desc = read.ptr(out.ptr!, 0) as Pointer | null;
  if (!desc) return null;
  // FUNCDESC layout (partial, x64):
  //   MEMBERID memid (4)
  //   SCODE *lprgscode (8) — but follows alignment
  //   ELEMDESC *lprgelemdescParam (8)
  //   FUNCKIND funckind (4)
  //   INVOKEKIND invkind (4)
  //   CALLCONV callconv (4)
  //   SHORT cParams (2)
  //   SHORT cParamsOpt (2)
  //   SHORT oVft (2)
  //   SHORT cScodes (2)
  //   ELEMDESC elemdescFunc (variable)
  //   WORD wFuncFlags
  const buf = Buffer.from(toArrayBuffer(desc, 0, 56));
  return {
    memid: buf.readInt32LE(0),
    funcKind: buf.readUInt32LE(24),
    invokeKind: buf.readUInt32LE(28),
    callConv: buf.readUInt32LE(32),
    cParams: buf.readInt16LE(36),
    cParamsOpt: buf.readInt16LE(38),
    vtFunc: 0,
    raw: desc,
  };
}

function ITI_ReleaseFuncDesc(ti: Pointer, desc: Pointer): void {
  callVtable<void>(ti, ITI_RELEASEFUNCDESC, ['ptr'], 'void', [desc]);
}

interface VarDesc {
  memid: number;
  varKind: number;
  raw: Pointer;
  constValuePtr: Pointer | null;
}

function ITI_GetVarDesc(ti: Pointer, index: number): VarDesc | null {
  const out = Buffer.alloc(8);
  const hr = callVtable<number>(ti, ITI_GETVARDESC, ['u32', 'ptr'], 'i32', [index, out.ptr!]);
  if (hr !== 0) return null;
  const desc = read.ptr(out.ptr!, 0) as Pointer | null;
  if (!desc) return null;
  // VARDESC layout (partial):
  //   MEMBERID memid (4)
  //   LPOLESTR lpstrSchema (8) — padding
  //   union { ULONG oInst; VARIANT *lpvarValue; } (8)
  //   ELEMDESC elemdescVar (varies)
  //   WORD wVarFlags
  //   VARKIND varkind
  const buf = Buffer.from(toArrayBuffer(desc, 0, 48));
  const memid = buf.readInt32LE(0);
  const valuePtr = read.ptr(desc, 16) as Pointer | null; // union slot
  const varkind = buf.readUInt32LE(40);
  return {
    memid,
    varKind: varkind,
    raw: desc,
    constValuePtr: valuePtr,
  };
}

function ITI_ReleaseVarDesc(ti: Pointer, desc: Pointer): void {
  callVtable<void>(ti, ITI_RELEASEVARDESC, ['ptr'], 'void', [desc]);
}

// ── Inspection ─────────────────────────────────────────────────────────────

const TYPEKIND_NAME: Record<number, string> = {
  [TypeKind.TKIND_ENUM]: 'ENUM',
  [TypeKind.TKIND_RECORD]: 'RECORD',
  [TypeKind.TKIND_MODULE]: 'MODULE',
  [TypeKind.TKIND_INTERFACE]: 'INTERFACE',
  [TypeKind.TKIND_DISPATCH]: 'DISPATCH',
  [TypeKind.TKIND_COCLASS]: 'COCLASS',
  [TypeKind.TKIND_ALIAS]: 'ALIAS',
  [TypeKind.TKIND_UNION]: 'UNION',
};

const TYPEKIND_COLOR: Record<number, string> = {
  [TypeKind.TKIND_ENUM]: BLUE,
  [TypeKind.TKIND_RECORD]: GREEN,
  [TypeKind.TKIND_MODULE]: WHITE,
  [TypeKind.TKIND_INTERFACE]: CYAN,
  [TypeKind.TKIND_DISPATCH]: MAGENTA,
  [TypeKind.TKIND_COCLASS]: YELLOW,
  [TypeKind.TKIND_ALIAS]: DIM,
  [TypeKind.TKIND_UNION]: GREEN,
};

const INVOKE_NAME: Record<number, string> = {
  [InvokeKind.INVOKE_FUNC]: 'method',
  [InvokeKind.INVOKE_PROPERTYGET]: 'get',
  [InvokeKind.INVOKE_PROPERTYPUT]: 'put',
  [InvokeKind.INVOKE_PROPERTYPUTREF]: 'putref',
};

const CALLCONV_NAME: Record<number, string> = {
  [CallConv.CC_STDCALL]: 'stdcall',
  [CallConv.CC_CDECL]: 'cdecl',
  [CallConv.CC_FASTCALL]: 'fastcall',
};

function inspectTypeInfo(ti: Pointer, indent: string): void {
  const attr = ITI_GetTypeAttr(ti);
  if (!attr) return;
  try {
    const docs = ITI_GetDocumentation(ti, -1);
    const tkName = TYPEKIND_NAME[attr.typeKind] ?? `kind${attr.typeKind}`;
    const tkColor = TYPEKIND_COLOR[attr.typeKind] ?? WHITE;

    console.log(`${indent}${tkColor}${BOLD}${tkName.padEnd(9)}${RESET} ${BOLD}${WHITE}${docs.name || '<unnamed>'}${RESET}  ${DIM}${attr.guid}${RESET}`);
    if (docs.docString) {
      console.log(`${indent}          ${DIM}${ITALIC}${docs.docString}${RESET}`);
    }
    if (attr.cbSizeInstance > 0) {
      console.log(`${indent}          ${DIM}size = ${attr.cbSizeInstance} bytes, funcs = ${attr.cFuncs}, vars = ${attr.cVars}${RESET}`);
    }

    // Enumerate methods
    for (let i = 0; i < attr.cFuncs; i++) {
      const fd = ITI_GetFuncDesc(ti, i);
      if (!fd) continue;
      try {
        const fdDocs = ITI_GetDocumentation(ti, fd.memid);
        const invoke = INVOKE_NAME[fd.invokeKind] ?? `invkind${fd.invokeKind}`;
        const cc = CALLCONV_NAME[fd.callConv] ?? `cc${fd.callConv}`;
        const memidStr = `0x${(fd.memid >>> 0).toString(16).padStart(8, '0')}`;
        console.log(`${indent}    ${GREEN}${invoke.padEnd(7)}${RESET} ${BOLD}${fdDocs.name}${RESET}${DIM}(${fd.cParams} params${fd.cParamsOpt > 0 ? `, ${fd.cParamsOpt} opt` : ''})${RESET} ${DIM}DISPID ${memidStr}, ${cc}${RESET}`);
        if (fdDocs.docString) {
          console.log(`${indent}              ${DIM}${ITALIC}${fdDocs.docString}${RESET}`);
        }
      } finally {
        ITI_ReleaseFuncDesc(ti, fd.raw);
      }
    }

    // Enumerate variables / enum constants
    for (let i = 0; i < attr.cVars; i++) {
      const vd = ITI_GetVarDesc(ti, i);
      if (!vd) continue;
      try {
        const vdDocs = ITI_GetDocumentation(ti, vd.memid);
        let valueDisplay = '';
        if (attr.typeKind === TypeKind.TKIND_ENUM && vd.constValuePtr) {
          // Const value VARIANT — read the 16-byte VARIANT and extract the I4 (most enums use VT_I4)
          const vbuf = Buffer.from(toArrayBuffer(vd.constValuePtr, 0, 16));
          const vt = vbuf.readUInt16LE(0);
          if (vt === VarEnum.VT_I4) valueDisplay = ` = ${vbuf.readInt32LE(8)}`;
          else if (vt === VarEnum.VT_I2) valueDisplay = ` = ${vbuf.readInt16LE(8)}`;
          else if (vt === VarEnum.VT_UI4) valueDisplay = ` = ${vbuf.readUInt32LE(8)}`;
          else valueDisplay = ` = VT(${vt})`;
        }
        console.log(`${indent}    ${BLUE}var    ${RESET} ${BOLD}${vdDocs.name}${RESET}${MAGENTA}${valueDisplay}${RESET}`);
      } finally {
        ITI_ReleaseVarDesc(ti, vd.raw);
      }
    }
  } finally {
    ITI_ReleaseTypeAttr(ti, attr.raw);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

// Pick a stable, well-known type library: stdole2.tlb (the OLE 2 standard library).
// It's tiny, present on every Windows install, and exercises every major TYPEKIND.
const tlbPath = 'stdole2.tlb';
const widePath = Buffer.from(tlbPath + '\0', 'utf16le');
const outTlib = Buffer.alloc(8);
const hr = Oleaut32.LoadTypeLib(widePath.ptr!, outTlib.ptr!);

if (hr !== 0) {
  console.error(`${RED}LoadTypeLib failed: HRESULT 0x${(hr >>> 0).toString(16)}${RESET}`);
  process.exit(1);
}

const tlib = read.ptr(outTlib.ptr!, 0) as Pointer;

try {
  console.log();
  console.log(`  ${BOLD}${MAGENTA}TYPE LIBRARY EXPLORER${RESET}`);
  console.log(`  ${WHITE}Loaded: ${BOLD}${tlbPath}${RESET}`);

  const libAttr = ITL_GetLibAttr(tlib);
  const libDocs = ITL_GetDocumentation(tlib, -1);
  if (libAttr) {
    console.log(`  ${DIM}LIBID:    ${libAttr.guid}${RESET}`);
    console.log(`  ${DIM}Version:  ${libAttr.majorVersion}.${libAttr.minorVersion}${RESET}`);
    console.log(`  ${DIM}LCID:     0x${libAttr.lcid.toString(16).padStart(4, '0')}${RESET}`);
    ITL_ReleaseTLibAttr(tlib, libAttr.raw);
  }
  console.log(`  ${WHITE}Name:     ${BOLD}${libDocs.name}${RESET}`);
  if (libDocs.docString) console.log(`  ${WHITE}Help:     ${ITALIC}${libDocs.docString}${RESET}`);
  console.log();

  const typeCount = ITL_GetTypeInfoCount(tlib);
  console.log(`  ${BOLD}${WHITE}${typeCount}${RESET} ${WHITE}type infos${RESET}`);
  console.log(`  ${DIM}${'─'.repeat(110)}${RESET}`);
  console.log();

  for (let i = 0; i < typeCount; i++) {
    const ti = ITL_GetTypeInfo(tlib, i);
    if (!ti) continue;
    try {
      inspectTypeInfo(ti, '  ');
      console.log();
    } finally {
      ITI_Release(ti);
    }
  }

  console.log(`  ${DIM}${'─'.repeat(110)}${RESET}`);
  console.log(`  ${GREEN}Color key:${RESET}  ${CYAN}interface${RESET}  ${MAGENTA}dispatch${RESET}  ${YELLOW}coclass${RESET}  ${BLUE}enum${RESET}  ${GREEN}record/method${RESET}  ${WHITE}module${RESET}`);
  console.log();
} finally {
  ITL_Release(tlib);
}
