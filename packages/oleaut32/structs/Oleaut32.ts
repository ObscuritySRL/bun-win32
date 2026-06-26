import { type FFIFunction, FFIType, type Pointer } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import { CallConv, RegKind, SysKind } from '../types/Oleaut32';
import type {
  BOOL,
  BSTR,
  BYTE,
  CHAR,
  CY,
  DATE,
  DISPID,
  DOUBLE,
  DWORD,
  FLOAT,
  HANDLE,
  HRESULT,
  HWND,
  IDispatch,
  IErrorInfo,
  INT,
  IPicture,
  IRecordInfo,
  ITypeInfo,
  ITypeLib,
  IUnknown,
  LCID,
  LONG,
  LONG64,
  LPBSTR,
  LPCOLESTR,
  LPCSTR,
  LPCY,
  LPDECIMAL,
  LPDISPPARAMS,
  LPDWORD,
  LPEXCEPINFO,
  LPFONTDESC,
  LPLPDISPATCH,
  LPLPSAFEARRAY,
  LPLPTYPEINFO,
  LPLPTYPELIB,
  LPLPUNKNOWN,
  LPLPVOID,
  LPNUMPARSE,
  LPOLESTR,
  LPPICTDESC,
  LPSAFEARRAY,
  LPSAFEARRAYBOUND,
  LPSYSTEMTIME,
  LPUDATE,
  LPVARIANT,
  LPVARIANTARG,
  NULL,
  Nullable,
  Optional,
  PCOLORREF,
  POCPFIPARAMS,
  PULONG,
  PVARTYPE,
  PVOID,
  REFCLSID,
  REFGUID,
  REFIID,
  SHORT,
  UINT,
  ULONG,
  ULONG64,
  ULONG_PTR,
  USHORT,
  VARIANT_BOOL,
  VARTYPE,
  WORD,
} from '../types/Oleaut32';

/**
 * Thin, lazy-loaded FFI bindings for `oleaut32.dll`.
 *
 * Each static method corresponds one-to-one with a Win32 export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * @example
 * ```ts
 * import Oleaut32 from './structs/Oleaut32';
 *
 * // Lazy: bind on first call
 * const bstr = Oleaut32.SysAllocString(Buffer.from('Hello\0', 'utf16le').ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Oleaut32.Preload(['SysAllocString', 'SysFreeString', 'VariantInit', 'VariantClear']);
 * ```
 */
class Oleaut32 extends Win32 {
  protected static override name = 'oleaut32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    BSTR_UserFree: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    BSTR_UserFree64: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    BSTR_UserMarshal: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    BSTR_UserMarshal64: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    BSTR_UserSize: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    BSTR_UserSize64: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    BSTR_UserUnmarshal: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    BSTR_UserUnmarshal64: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    BstrFromVector: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ClearCustData: { args: [FFIType.ptr], returns: FFIType.void },
    CreateDispTypeInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CreateErrorInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    CreateStdDispatch: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateTypeLib: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateTypeLib2: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DispCallFunc: { args: [FFIType.ptr, FFIType.u64, FFIType.i32, FFIType.u16, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DispGetIDsOfNames: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    DispGetParam: { args: [FFIType.ptr, FFIType.u32, FFIType.u16, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DispInvoke: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllRegisterServer: { args: [], returns: FFIType.i32 },
    DllUnregisterServer: { args: [], returns: FFIType.i32 },
    DosDateTimeToVariantTime: { args: [FFIType.u16, FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    GetActiveObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetAltMonthNames: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetErrorInfo: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetRecordInfoFromGuids: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetRecordInfoFromTypeInfo: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetVarConversionLocaleSetting: { args: [FFIType.ptr], returns: FFIType.i32 },
    LHashValOfNameSys: { args: [FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    LHashValOfNameSysA: { args: [FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    LoadRegTypeLib: { args: [FFIType.ptr, FFIType.u16, FFIType.u16, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LoadTypeLib: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LoadTypeLibEx: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    LPSAFEARRAY_Marshal: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    LPSAFEARRAY_Size: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    LPSAFEARRAY_Unmarshal: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    LPSAFEARRAY_UserFree: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    LPSAFEARRAY_UserFree64: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    LPSAFEARRAY_UserMarshal: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    LPSAFEARRAY_UserMarshal64: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    LPSAFEARRAY_UserSize: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    LPSAFEARRAY_UserSize64: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    LPSAFEARRAY_UserUnmarshal: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    LPSAFEARRAY_UserUnmarshal64: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    OaBuildVersion: { args: [], returns: FFIType.u32 },
    OACleanup: { args: [], returns: FFIType.void },
    OACreateTypeLib2: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OaEnablePerUserTLibRegistration: { args: [], returns: FFIType.void },
    OleCreateFontIndirect: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreatePictureIndirect: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    OleCreatePropertyFrame: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    OleCreatePropertyFrameIndirect: { args: [FFIType.ptr], returns: FFIType.i32 },
    OleIconToCursor: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    OleLoadPicture: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleLoadPictureEx: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    OleLoadPictureFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleLoadPictureFileEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    OleLoadPicturePath: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleSavePictureFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleTranslateColor: { args: [FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    QueryPathOfRegTypeLib: { args: [FFIType.ptr, FFIType.u16, FFIType.u16, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RegisterActiveObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RegisterTypeLib: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegisterTypeLibForUser: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RevokeActiveObject: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayAccessData: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayAddRef: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayAllocData: { args: [FFIType.ptr], returns: FFIType.i32 },
    SafeArrayAllocDescriptor: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayAllocDescriptorEx: { args: [FFIType.u16, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayCopy: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayCopyData: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayCreate: { args: [FFIType.u16, FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    SafeArrayCreateEx: { args: [FFIType.u16, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    SafeArrayCreateVector: { args: [FFIType.u16, FFIType.i32, FFIType.u32], returns: FFIType.ptr },
    SafeArrayCreateVectorEx: { args: [FFIType.u16, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    SafeArrayDestroy: { args: [FFIType.ptr], returns: FFIType.i32 },
    SafeArrayDestroyData: { args: [FFIType.ptr], returns: FFIType.i32 },
    SafeArrayDestroyDescriptor: { args: [FFIType.ptr], returns: FFIType.i32 },
    SafeArrayGetDim: { args: [FFIType.ptr], returns: FFIType.u32 },
    SafeArrayGetElement: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayGetElemsize: { args: [FFIType.ptr], returns: FFIType.u32 },
    SafeArrayGetIID: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayGetLBound: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayGetRecordInfo: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayGetUBound: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayGetVartype: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayLock: { args: [FFIType.ptr], returns: FFIType.i32 },
    SafeArrayPtrOfIndex: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayPutElement: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayRedim: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayReleaseData: { args: [FFIType.ptr], returns: FFIType.void },
    SafeArrayReleaseDescriptor: { args: [FFIType.ptr], returns: FFIType.void },
    SafeArraySetIID: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SafeArraySetRecordInfo: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SafeArrayUnaccessData: { args: [FFIType.ptr], returns: FFIType.i32 },
    SafeArrayUnlock: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetErrorInfo: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetOaNoCache: { args: [], returns: FFIType.void },
    SetVarConversionLocaleSetting: { args: [FFIType.u32], returns: FFIType.i32 },
    SysAddRefString: { args: [FFIType.ptr], returns: FFIType.i32 },
    SysAllocString: { args: [FFIType.ptr], returns: FFIType.ptr },
    SysAllocStringByteLen: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    SysAllocStringLen: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    SysFreeString: { args: [FFIType.ptr], returns: FFIType.void },
    SysReAllocString: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SysReAllocStringLen: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SysReleaseString: { args: [FFIType.ptr], returns: FFIType.void },
    SysStringByteLen: { args: [FFIType.ptr], returns: FFIType.u32 },
    SysStringLen: { args: [FFIType.ptr], returns: FFIType.u32 },
    SystemTimeToVariantTime: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UnRegisterTypeLib: { args: [FFIType.ptr, FFIType.u16, FFIType.u16, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    UnRegisterTypeLibForUser: { args: [FFIType.ptr, FFIType.u16, FFIType.u16, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    VarAbs: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarAdd: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarAnd: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarBoolFromCy: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarBoolFromDate: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarBoolFromDec: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarBoolFromDisp: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBoolFromI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarBoolFromI2: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarBoolFromI4: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarBoolFromI8: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarBoolFromR4: { args: [FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    VarBoolFromR8: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarBoolFromStr: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBoolFromUI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarBoolFromUI2: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    VarBoolFromUI4: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBoolFromUI8: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    VarBstrCat: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarBstrCmp: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    VarBstrFromBool: { args: [FFIType.i16, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBstrFromCy: { args: [FFIType.i64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBstrFromDate: { args: [FFIType.f64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBstrFromDec: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBstrFromDisp: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBstrFromI1: { args: [FFIType.u8, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBstrFromI2: { args: [FFIType.i16, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBstrFromI4: { args: [FFIType.i32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBstrFromI8: { args: [FFIType.i64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBstrFromR4: { args: [FFIType.f32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBstrFromR8: { args: [FFIType.f64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBstrFromUI1: { args: [FFIType.u8, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBstrFromUI2: { args: [FFIType.u16, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBstrFromUI4: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarBstrFromUI8: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarCat: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarCmp: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    VarCyAbs: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarCyAdd: { args: [FFIType.i64, FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarCyCmp: { args: [FFIType.i64, FFIType.i64], returns: FFIType.i32 },
    VarCyCmpR8: { args: [FFIType.i64, FFIType.f64], returns: FFIType.i32 },
    VarCyFix: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarCyFromBool: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarCyFromDate: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarCyFromDec: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarCyFromDisp: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarCyFromI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarCyFromI2: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarCyFromI4: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarCyFromI8: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarCyFromR4: { args: [FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    VarCyFromR8: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarCyFromStr: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarCyFromUI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarCyFromUI2: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    VarCyFromUI4: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarCyFromUI8: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    VarCyInt: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarCyMul: { args: [FFIType.i64, FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarCyMulI4: { args: [FFIType.i64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarCyMulI8: { args: [FFIType.i64, FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarCyNeg: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarCyRound: { args: [FFIType.i64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarCySub: { args: [FFIType.i64, FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromBool: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromCy: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromDec: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromDisp: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromI2: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromI4: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromI8: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromR4: { args: [FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromR8: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromStr: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromUdate: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromUdateEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromUI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromUI2: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromUI4: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarDateFromUI8: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    VarDecAbs: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarDecAdd: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarDecCmp: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarDecCmpR8: { args: [FFIType.ptr, FFIType.f64], returns: FFIType.i32 },
    VarDecDiv: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarDecFix: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarDecFromBool: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarDecFromCy: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarDecFromDate: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarDecFromDisp: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarDecFromI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarDecFromI2: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarDecFromI4: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarDecFromI8: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarDecFromR4: { args: [FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    VarDecFromR8: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarDecFromStr: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarDecFromUI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarDecFromUI2: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    VarDecFromUI4: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarDecFromUI8: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    VarDecInt: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarDecMul: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarDecNeg: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarDecRound: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarDecSub: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarDiv: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarEqv: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarFix: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarFormat: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarFormatCurrency: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarFormatDateTime: { args: [FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarFormatFromTokens: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    VarFormatNumber: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarFormatPercent: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarI1FromBool: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarI1FromCy: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarI1FromDate: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarI1FromDec: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarI1FromDisp: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarI1FromI2: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarI1FromI4: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarI1FromI8: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarI1FromR4: { args: [FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    VarI1FromR8: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarI1FromStr: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarI1FromUI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarI1FromUI2: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    VarI1FromUI4: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarI1FromUI8: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    VarI2FromBool: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarI2FromCy: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarI2FromDate: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarI2FromDec: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarI2FromDisp: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarI2FromI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarI2FromI4: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarI2FromI8: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarI2FromR4: { args: [FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    VarI2FromR8: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarI2FromStr: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarI2FromUI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarI2FromUI2: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    VarI2FromUI4: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarI2FromUI8: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    VarI4FromBool: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarI4FromCy: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarI4FromDate: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarI4FromDec: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarI4FromDisp: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarI4FromI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarI4FromI2: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarI4FromI8: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarI4FromR4: { args: [FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    VarI4FromR8: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarI4FromStr: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarI4FromUI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarI4FromUI2: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    VarI4FromUI4: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarI4FromUI8: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    VarI8FromBool: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarI8FromCy: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarI8FromDate: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarI8FromDec: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarI8FromDisp: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarI8FromI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarI8FromI2: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarI8FromR4: { args: [FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    VarI8FromR8: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarI8FromStr: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarI8FromUI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarI8FromUI2: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    VarI8FromUI4: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarI8FromUI8: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    VARIANT_UserFree: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    VARIANT_UserFree64: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    VARIANT_UserMarshal: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    VARIANT_UserMarshal64: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    VARIANT_UserSize: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    VARIANT_UserSize64: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    VARIANT_UserUnmarshal: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    VARIANT_UserUnmarshal64: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    VariantChangeType: { args: [FFIType.ptr, FFIType.ptr, FFIType.u16, FFIType.u16], returns: FFIType.i32 },
    VariantChangeTypeEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u16, FFIType.u16], returns: FFIType.i32 },
    VariantClear: { args: [FFIType.ptr], returns: FFIType.i32 },
    VariantCopy: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantCopyInd: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantInit: { args: [FFIType.ptr], returns: FFIType.void },
    VariantTimeToDosDateTime: { args: [FFIType.f64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantTimeToSystemTime: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarIdiv: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarImp: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarInt: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarMod: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarMonthName: { args: [FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarMul: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarNeg: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarNot: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarNumFromParseNum: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarOr: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarParseNumFromStr: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarPow: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarR4CmpR8: { args: [FFIType.f32, FFIType.f64], returns: FFIType.i32 },
    VarR4FromBool: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarR4FromCy: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarR4FromDate: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarR4FromDec: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarR4FromDisp: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarR4FromI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarR4FromI2: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarR4FromI4: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarR4FromI8: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarR4FromR8: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarR4FromStr: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarR4FromUI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarR4FromUI2: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    VarR4FromUI4: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarR4FromUI8: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    VarR8FromBool: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarR8FromCy: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarR8FromDate: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarR8FromDec: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarR8FromDisp: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarR8FromI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarR8FromI2: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarR8FromI4: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarR8FromI8: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarR8FromR4: { args: [FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    VarR8FromStr: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarR8FromUI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarR8FromUI2: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    VarR8FromUI4: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarR8FromUI8: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    VarR8Pow: { args: [FFIType.f64, FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarR8Round: { args: [FFIType.f64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarRound: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarSub: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarTokenizeFormatString: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarUdateFromDate: { args: [FFIType.f64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarUI1FromBool: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarUI1FromCy: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarUI1FromDate: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarUI1FromDec: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarUI1FromDisp: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarUI1FromI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarUI1FromI2: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarUI1FromI4: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarUI1FromI8: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarUI1FromR4: { args: [FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    VarUI1FromR8: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarUI1FromStr: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarUI1FromUI2: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    VarUI1FromUI4: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarUI1FromUI8: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    VarUI2FromBool: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarUI2FromCy: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarUI2FromDate: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarUI2FromDec: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarUI2FromDisp: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarUI2FromI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarUI2FromI2: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarUI2FromI4: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarUI2FromI8: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarUI2FromR4: { args: [FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    VarUI2FromR8: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarUI2FromStr: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarUI2FromUI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarUI2FromUI4: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarUI2FromUI8: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    VarUI4FromBool: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarUI4FromCy: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarUI4FromDate: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarUI4FromDec: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarUI4FromDisp: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarUI4FromI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarUI4FromI2: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarUI4FromI4: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VarUI4FromI8: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarUI4FromR4: { args: [FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    VarUI4FromR8: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarUI4FromStr: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarUI4FromUI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarUI4FromUI2: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    VarUI4FromUI8: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    VarUI8FromBool: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarUI8FromCy: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarUI8FromDate: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarUI8FromDec: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VarUI8FromDisp: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarUI8FromI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarUI8FromI2: { args: [FFIType.i16, FFIType.ptr], returns: FFIType.i32 },
    VarUI8FromI8: { args: [FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    VarUI8FromR4: { args: [FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    VarUI8FromR8: { args: [FFIType.f64, FFIType.ptr], returns: FFIType.i32 },
    VarUI8FromStr: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarUI8FromUI1: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    VarUI8FromUI2: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    VarUI8FromUI4: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarWeekdayName: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VarXor: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VectorFromBstr: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-bstr_userfree
  public static BSTR_UserFree(pFlags: PULONG, pBstr: LPBSTR): void {
    return Oleaut32.Load('BSTR_UserFree')(pFlags, pBstr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-bstr_userfree64
  public static BSTR_UserFree64(pFlags: PULONG, pBstr: LPBSTR): void {
    return Oleaut32.Load('BSTR_UserFree64')(pFlags, pBstr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-bstr_usermarshal
  public static BSTR_UserMarshal(pFlags: PULONG, pBuffer_in_out: Pointer, pBstr: LPBSTR): Pointer {
    return Oleaut32.Load('BSTR_UserMarshal')(pFlags, pBuffer_in_out, pBstr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-bstr_usermarshal64
  public static BSTR_UserMarshal64(pFlags: PULONG, pBuffer_in_out: Pointer, pBstr: LPBSTR): Pointer {
    return Oleaut32.Load('BSTR_UserMarshal64')(pFlags, pBuffer_in_out, pBstr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-bstr_usersize
  public static BSTR_UserSize(pFlags: PULONG, StartingSize: ULONG, pBstr: LPBSTR): ULONG {
    return Oleaut32.Load('BSTR_UserSize')(pFlags, StartingSize, pBstr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-bstr_usersize64
  public static BSTR_UserSize64(pFlags: PULONG, StartingSize: ULONG, pBstr: LPBSTR): ULONG {
    return Oleaut32.Load('BSTR_UserSize64')(pFlags, StartingSize, pBstr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-bstr_userunmarshal
  public static BSTR_UserUnmarshal(pFlags: PULONG, pBuffer: Pointer, pBstr_out: LPBSTR): Pointer {
    return Oleaut32.Load('BSTR_UserUnmarshal')(pFlags, pBuffer, pBstr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-bstr_userunmarshal64
  public static BSTR_UserUnmarshal64(pFlags: PULONG, pBuffer: Pointer, pBstr_out: LPBSTR): Pointer {
    return Oleaut32.Load('BSTR_UserUnmarshal64')(pFlags, pBuffer, pBstr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-bstrfromvector
  public static BstrFromVector(psa: LPSAFEARRAY, pbstr_out: LPBSTR): HRESULT {
    return Oleaut32.Load('BstrFromVector')(psa, pbstr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-clearcustdata
  public static ClearCustData(pCustData: Pointer): void {
    return Oleaut32.Load('ClearCustData')(pCustData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-createdisptypeinfo
  public static CreateDispTypeInfo(pidata: Pointer, lcid: LCID, pptinfo_out: LPLPTYPEINFO): HRESULT {
    return Oleaut32.Load('CreateDispTypeInfo')(pidata, lcid, pptinfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-createerrorinfo
  public static CreateErrorInfo(pperrinfo_out: Pointer): HRESULT {
    return Oleaut32.Load('CreateErrorInfo')(pperrinfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-createstddispatch
  public static CreateStdDispatch(punkOuter: IUnknown, pvThis: PVOID, ptinfo: ITypeInfo, ppunkStdDisp_out: LPLPUNKNOWN): HRESULT {
    return Oleaut32.Load('CreateStdDispatch')(punkOuter, pvThis, ptinfo, ppunkStdDisp_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-createtypelib
  public static CreateTypeLib(syskind: SysKind, szFile: LPCOLESTR, ppctlib_out: Pointer): HRESULT {
    return Oleaut32.Load('CreateTypeLib')(syskind, szFile, ppctlib_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-createtypelib2
  public static CreateTypeLib2(syskind: SysKind, szFile: LPCOLESTR, ppctlib_out: Pointer): HRESULT {
    return Oleaut32.Load('CreateTypeLib2')(syskind, szFile, ppctlib_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-dispcallfunc
  public static DispCallFunc(pvInstance: Optional<PVOID>, oVft: ULONG_PTR, cc: CallConv, vtReturn: VARTYPE, cActuals: UINT, prgvt: PVARTYPE, prgpvarg: Pointer, pvargResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('DispCallFunc')(pvInstance, oVft, cc, vtReturn, cActuals, prgvt, prgpvarg, pvargResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-dispgetidsofnames
  public static DispGetIDsOfNames(ptinfo: ITypeInfo, rgszNames: Pointer, cNames: UINT, rgdispid_out: Pointer): HRESULT {
    return Oleaut32.Load('DispGetIDsOfNames')(ptinfo, rgszNames, cNames, rgdispid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-dispgetparam
  public static DispGetParam(pdispparams: LPDISPPARAMS, position: UINT, vtTarg: VARTYPE, pvarResult_out: LPVARIANTARG, puArgErr_out: Optional<Pointer>): HRESULT {
    return Oleaut32.Load('DispGetParam')(pdispparams, position, vtTarg, pvarResult_out, puArgErr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-dispinvoke
  public static DispInvoke(_this: PVOID, ptinfo: ITypeInfo, dispidMember: DISPID, wFlags: WORD, pparams: LPDISPPARAMS, pvarResult_out: Nullable<LPVARIANT>, pexcepinfo_out: Nullable<LPEXCEPINFO>, puArgErr_out: Nullable<Pointer>): HRESULT {
    return Oleaut32.Load('DispInvoke')(_this, ptinfo, dispidMember, wFlags, pparams, pvarResult_out, pexcepinfo_out, puArgErr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return Oleaut32.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Oleaut32.Load('DllGetClassObject')(rclsid, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllregisterserver
  public static DllRegisterServer(): HRESULT {
    return Oleaut32.Load('DllRegisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllunregisterserver
  public static DllUnregisterServer(): HRESULT {
    return Oleaut32.Load('DllUnregisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-dosdatetimetovarianttime
  public static DosDateTimeToVariantTime(wDosDate: USHORT, wDosTime: USHORT, pvtime_out: Pointer): INT {
    return Oleaut32.Load('DosDateTimeToVariantTime')(wDosDate, wDosTime, pvtime_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-getactiveobject
  public static GetActiveObject(rclsid: REFCLSID, pvReserved: NULL, ppunk_out: LPLPUNKNOWN): HRESULT {
    return Oleaut32.Load('GetActiveObject')(rclsid, pvReserved, ppunk_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-getaltmonthnames
  public static GetAltMonthNames(lcid: LCID, prgp_out: Pointer): HRESULT {
    return Oleaut32.Load('GetAltMonthNames')(lcid, prgp_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-geterrorinfo
  public static GetErrorInfo(dwReserved: ULONG, pperrinfo_out: Pointer): HRESULT {
    return Oleaut32.Load('GetErrorInfo')(dwReserved, pperrinfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-getrecordinfofromguids
  public static GetRecordInfoFromGuids(rGuidTypeLib: REFGUID, uVerMajor: ULONG, uVerMinor: ULONG, lcid: LCID, rGuidTypeInfo: REFGUID, ppRecInfo_out: Pointer): HRESULT {
    return Oleaut32.Load('GetRecordInfoFromGuids')(rGuidTypeLib, uVerMajor, uVerMinor, lcid, rGuidTypeInfo, ppRecInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-getrecordinfofromtypeinfo
  public static GetRecordInfoFromTypeInfo(pTypeInfo: ITypeInfo, ppRecInfo_out: Pointer): HRESULT {
    return Oleaut32.Load('GetRecordInfoFromTypeInfo')(pTypeInfo, ppRecInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-getvarconversionlocalesetting
  public static GetVarConversionLocaleSetting(pcid: Pointer): HRESULT {
    return Oleaut32.Load('GetVarConversionLocaleSetting')(pcid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-lhashvalofnamesys
  public static LHashValOfNameSys(syskind: SysKind, lcid: LCID, szName: LPCOLESTR): ULONG {
    return Oleaut32.Load('LHashValOfNameSys')(syskind, lcid, szName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-lhashvalofnamesysa
  public static LHashValOfNameSysA(syskind: SysKind, lcid: LCID, szName: LPCSTR): ULONG {
    return Oleaut32.Load('LHashValOfNameSysA')(syskind, lcid, szName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-loadregtypelib
  public static LoadRegTypeLib(rguid: REFGUID, wVerMajor: WORD, wVerMinor: WORD, lcid: LCID, pptlib_out: LPLPTYPELIB): HRESULT {
    return Oleaut32.Load('LoadRegTypeLib')(rguid, wVerMajor, wVerMinor, lcid, pptlib_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-loadtypelib
  public static LoadTypeLib(szFile: LPCOLESTR, pptlib_out: LPLPTYPELIB): HRESULT {
    return Oleaut32.Load('LoadTypeLib')(szFile, pptlib_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-loadtypelibex
  public static LoadTypeLibEx(szFile: LPCOLESTR, regkind: RegKind, pptlib_out: LPLPTYPELIB): HRESULT {
    return Oleaut32.Load('LoadTypeLibEx')(szFile, regkind, pptlib_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-lpsafearray_marshal
  public static LPSAFEARRAY_Marshal(pBuffer: Pointer, ppSA: LPLPSAFEARRAY): Pointer {
    return Oleaut32.Load('LPSAFEARRAY_Marshal')(pBuffer, ppSA);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-lpsafearray_size
  public static LPSAFEARRAY_Size(StartingSize: ULONG, ppSA: LPLPSAFEARRAY): ULONG {
    return Oleaut32.Load('LPSAFEARRAY_Size')(StartingSize, ppSA);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-lpsafearray_unmarshal
  public static LPSAFEARRAY_Unmarshal(pBuffer: Pointer, ppSA: LPLPSAFEARRAY): Pointer {
    return Oleaut32.Load('LPSAFEARRAY_Unmarshal')(pBuffer, ppSA);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-lpsafearray_userfree
  public static LPSAFEARRAY_UserFree(pFlags: PULONG, ppSA: LPLPSAFEARRAY): void {
    return Oleaut32.Load('LPSAFEARRAY_UserFree')(pFlags, ppSA);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-lpsafearray_userfree64
  public static LPSAFEARRAY_UserFree64(pFlags: PULONG, ppSA: LPLPSAFEARRAY): void {
    return Oleaut32.Load('LPSAFEARRAY_UserFree64')(pFlags, ppSA);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-lpsafearray_usermarshal
  public static LPSAFEARRAY_UserMarshal(pFlags: PULONG, pBuffer_in_out: Pointer, ppSA: LPLPSAFEARRAY): Pointer {
    return Oleaut32.Load('LPSAFEARRAY_UserMarshal')(pFlags, pBuffer_in_out, ppSA);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-lpsafearray_usermarshal64
  public static LPSAFEARRAY_UserMarshal64(pFlags: PULONG, pBuffer_in_out: Pointer, ppSA: LPLPSAFEARRAY): Pointer {
    return Oleaut32.Load('LPSAFEARRAY_UserMarshal64')(pFlags, pBuffer_in_out, ppSA);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-lpsafearray_usersize
  public static LPSAFEARRAY_UserSize(pFlags: PULONG, StartingSize: ULONG, ppSA: LPLPSAFEARRAY): ULONG {
    return Oleaut32.Load('LPSAFEARRAY_UserSize')(pFlags, StartingSize, ppSA);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-lpsafearray_usersize64
  public static LPSAFEARRAY_UserSize64(pFlags: PULONG, StartingSize: ULONG, ppSA: LPLPSAFEARRAY): ULONG {
    return Oleaut32.Load('LPSAFEARRAY_UserSize64')(pFlags, StartingSize, ppSA);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-lpsafearray_userunmarshal
  public static LPSAFEARRAY_UserUnmarshal(pFlags: PULONG, pBuffer: Pointer, ppSA_out: LPLPSAFEARRAY): Pointer {
    return Oleaut32.Load('LPSAFEARRAY_UserUnmarshal')(pFlags, pBuffer, ppSA_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-lpsafearray_userunmarshal64
  public static LPSAFEARRAY_UserUnmarshal64(pFlags: PULONG, pBuffer: Pointer, ppSA_out: LPLPSAFEARRAY): Pointer {
    return Oleaut32.Load('LPSAFEARRAY_UserUnmarshal64')(pFlags, pBuffer, ppSA_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-oabuildversion
  public static OaBuildVersion(): ULONG {
    return Oleaut32.Load('OaBuildVersion')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-oacleanup
  public static OACleanup(): void {
    return Oleaut32.Load('OACleanup')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-createtypelib2
  public static OACreateTypeLib2(syskind: SysKind, szFile: LPCOLESTR, ppctlib: Pointer): HRESULT {
    return Oleaut32.Load('OACreateTypeLib2')(syskind, szFile, ppctlib);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-oaenableperusertlibregistration
  public static OaEnablePerUserTLibRegistration(): void {
    return Oleaut32.Load('OaEnablePerUserTLibRegistration')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-olecreatefontindirect
  public static OleCreateFontIndirect(lpFontDesc: LPFONTDESC, riid: REFIID, lplpvObj_out: LPLPVOID): HRESULT {
    return Oleaut32.Load('OleCreateFontIndirect')(lpFontDesc, riid, lplpvObj_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-olecreatepictureindirect
  public static OleCreatePictureIndirect(lpPictDesc: Nullable<LPPICTDESC>, riid: REFIID, fOwn: BOOL, lplpvObj_out: LPLPVOID): HRESULT {
    return Oleaut32.Load('OleCreatePictureIndirect')(lpPictDesc, riid, fOwn, lplpvObj_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-olecreatepropertyframe
  public static OleCreatePropertyFrame(hwndOwner: HWND, x: UINT, y: UINT, lpszCaption: LPCOLESTR, cObjects: ULONG, ppUnk: Pointer, cPages: ULONG, pPageClsID: Pointer, lcid: LCID, dwReserved: DWORD, pvReserved: NULL): HRESULT {
    return Oleaut32.Load('OleCreatePropertyFrame')(hwndOwner, x, y, lpszCaption, cObjects, ppUnk, cPages, pPageClsID, lcid, dwReserved, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-olecreatepropertyframeindirect
  public static OleCreatePropertyFrameIndirect(lpParams: POCPFIPARAMS): HRESULT {
    return Oleaut32.Load('OleCreatePropertyFrameIndirect')(lpParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-oleicontocursor
  public static OleIconToCursor(hinstExe: HANDLE, hIconIn: HANDLE): HANDLE {
    return Oleaut32.Load('OleIconToCursor')(hinstExe, hIconIn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-oleloadpicture
  public static OleLoadPicture(lpstream: Pointer, lSize: LONG, fRunmode: BOOL, riid: REFIID, lplpvObj_out: LPLPVOID): HRESULT {
    return Oleaut32.Load('OleLoadPicture')(lpstream, lSize, fRunmode, riid, lplpvObj_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-oleloadpictureex
  public static OleLoadPictureEx(lpstream: Pointer, lSize: LONG, fRunmode: BOOL, riid: REFIID, xSizeDesired: DWORD, ySizeDesired: DWORD, dwFlags: DWORD, lplpvObj_out: LPLPVOID): HRESULT {
    return Oleaut32.Load('OleLoadPictureEx')(lpstream, lSize, fRunmode, riid, xSizeDesired, ySizeDesired, dwFlags, lplpvObj_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-oleloadpicturefile
  public static OleLoadPictureFile(varFileName: LPVARIANT, lplpdispPicture_out: LPLPDISPATCH): HRESULT {
    return Oleaut32.Load('OleLoadPictureFile')(varFileName, lplpdispPicture_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-oleloadpicturefileex
  public static OleLoadPictureFileEx(varFileName: LPVARIANT, xSizeDesired: DWORD, ySizeDesired: DWORD, dwFlags: DWORD, lplpdispPicture_out: LPLPDISPATCH): HRESULT {
    return Oleaut32.Load('OleLoadPictureFileEx')(varFileName, xSizeDesired, ySizeDesired, dwFlags, lplpdispPicture_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-oleloadpicturepath
  public static OleLoadPicturePath(szURLorPath: LPOLESTR, punkCaller: Nullable<IUnknown>, dwReserved: DWORD, clrReserved: DWORD, riid: REFIID, ppvRet_out: LPLPVOID): HRESULT {
    return Oleaut32.Load('OleLoadPicturePath')(szURLorPath, punkCaller, dwReserved, clrReserved, riid, ppvRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-olesavepicturefile
  public static OleSavePictureFile(lpdispPicture: IPicture, bstrFileName: BSTR): HRESULT {
    return Oleaut32.Load('OleSavePictureFile')(lpdispPicture, bstrFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-oletranslatecolor
  public static OleTranslateColor(clr: DWORD, hpal: Nullable<HANDLE>, pcolorref_out: Nullable<PCOLORREF>): HRESULT {
    return Oleaut32.Load('OleTranslateColor')(clr, hpal, pcolorref_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-querypathofregtypelib
  public static QueryPathOfRegTypeLib(guid: REFGUID, wMaj: USHORT, wMin: USHORT, lcid: LCID, lpbstrPathName_out: LPBSTR): HRESULT {
    return Oleaut32.Load('QueryPathOfRegTypeLib')(guid, wMaj, wMin, lcid, lpbstrPathName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-registeractiveobject
  public static RegisterActiveObject(punk: IUnknown, rclsid: REFCLSID, dwFlags: DWORD, pdwRegister_out: LPDWORD): HRESULT {
    return Oleaut32.Load('RegisterActiveObject')(punk, rclsid, dwFlags, pdwRegister_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-registertypelib
  public static RegisterTypeLib(ptlib: ITypeLib, szFullPath: LPCOLESTR, szHelpDir: Optional<LPCOLESTR>): HRESULT {
    return Oleaut32.Load('RegisterTypeLib')(ptlib, szFullPath, szHelpDir);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-registertypelibforuser
  public static RegisterTypeLibForUser(ptlib: ITypeLib, szFullPath: LPCOLESTR, szHelpDir: Optional<LPCOLESTR>): HRESULT {
    return Oleaut32.Load('RegisterTypeLibForUser')(ptlib, szFullPath, szHelpDir);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-revokeactiveobject
  public static RevokeActiveObject(dwRegister: DWORD, pvReserved: NULL): HRESULT {
    return Oleaut32.Load('RevokeActiveObject')(dwRegister, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearrayaccessdata
  public static SafeArrayAccessData(psa: LPSAFEARRAY, ppvData_out: LPLPVOID): HRESULT {
    return Oleaut32.Load('SafeArrayAccessData')(psa, ppvData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearrayaddref
  public static SafeArrayAddRef(psa: LPSAFEARRAY, pulRefCount_out: PULONG): HRESULT {
    return Oleaut32.Load('SafeArrayAddRef')(psa, pulRefCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearrayallocdata
  public static SafeArrayAllocData(psa: LPSAFEARRAY): HRESULT {
    return Oleaut32.Load('SafeArrayAllocData')(psa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearrayallocdescriptor
  public static SafeArrayAllocDescriptor(cDims: UINT, ppsaOut_out: LPLPSAFEARRAY): HRESULT {
    return Oleaut32.Load('SafeArrayAllocDescriptor')(cDims, ppsaOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearrayallocdescriptorex
  public static SafeArrayAllocDescriptorEx(vt: VARTYPE, cDims: UINT, ppsaOut_out: LPLPSAFEARRAY): HRESULT {
    return Oleaut32.Load('SafeArrayAllocDescriptorEx')(vt, cDims, ppsaOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraycopy
  public static SafeArrayCopy(psa: LPSAFEARRAY, ppsaOut_out: LPLPSAFEARRAY): HRESULT {
    return Oleaut32.Load('SafeArrayCopy')(psa, ppsaOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraycopydata
  public static SafeArrayCopyData(psaSource: LPSAFEARRAY, psaTarget: LPSAFEARRAY): HRESULT {
    return Oleaut32.Load('SafeArrayCopyData')(psaSource, psaTarget);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraycreate
  public static SafeArrayCreate(vt: VARTYPE, cDims: UINT, rgsabound: LPSAFEARRAYBOUND): LPSAFEARRAY {
    return Oleaut32.Load('SafeArrayCreate')(vt, cDims, rgsabound);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraycreateex
  public static SafeArrayCreateEx(vt: VARTYPE, cDims: UINT, rgsabound: LPSAFEARRAYBOUND, pvExtra: Nullable<PVOID>): LPSAFEARRAY {
    return Oleaut32.Load('SafeArrayCreateEx')(vt, cDims, rgsabound, pvExtra);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraycreatevector
  public static SafeArrayCreateVector(vt: VARTYPE, lLbound: LONG, cElements: ULONG): LPSAFEARRAY {
    return Oleaut32.Load('SafeArrayCreateVector')(vt, lLbound, cElements);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraycreatevectorex
  public static SafeArrayCreateVectorEx(vt: VARTYPE, lLbound: LONG, cElements: ULONG, pvExtra: Nullable<PVOID>): LPSAFEARRAY {
    return Oleaut32.Load('SafeArrayCreateVectorEx')(vt, lLbound, cElements, pvExtra);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraydestroy
  public static SafeArrayDestroy(psa: LPSAFEARRAY): HRESULT {
    return Oleaut32.Load('SafeArrayDestroy')(psa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraydestroydata
  public static SafeArrayDestroyData(psa: LPSAFEARRAY): HRESULT {
    return Oleaut32.Load('SafeArrayDestroyData')(psa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraydestroydescriptor
  public static SafeArrayDestroyDescriptor(psa: LPSAFEARRAY): HRESULT {
    return Oleaut32.Load('SafeArrayDestroyDescriptor')(psa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraygetdim
  public static SafeArrayGetDim(psa: LPSAFEARRAY): UINT {
    return Oleaut32.Load('SafeArrayGetDim')(psa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraygetelement
  public static SafeArrayGetElement(psa: LPSAFEARRAY, rgIndices: Pointer, pv_out: PVOID): HRESULT {
    return Oleaut32.Load('SafeArrayGetElement')(psa, rgIndices, pv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraygetelemsize
  public static SafeArrayGetElemsize(psa: LPSAFEARRAY): UINT {
    return Oleaut32.Load('SafeArrayGetElemsize')(psa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraygetiid
  public static SafeArrayGetIID(psa: LPSAFEARRAY, pguid_out: Pointer): HRESULT {
    return Oleaut32.Load('SafeArrayGetIID')(psa, pguid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraygetlbound
  public static SafeArrayGetLBound(psa: LPSAFEARRAY, nDim: UINT, plLbound_out: Pointer): HRESULT {
    return Oleaut32.Load('SafeArrayGetLBound')(psa, nDim, plLbound_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraygetrecordinfo
  public static SafeArrayGetRecordInfo(psa: LPSAFEARRAY, prinfo_out: Pointer): HRESULT {
    return Oleaut32.Load('SafeArrayGetRecordInfo')(psa, prinfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraygetubound
  public static SafeArrayGetUBound(psa: LPSAFEARRAY, nDim: UINT, plUbound_out: Pointer): HRESULT {
    return Oleaut32.Load('SafeArrayGetUBound')(psa, nDim, plUbound_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraygetvartype
  public static SafeArrayGetVartype(psa: LPSAFEARRAY, pvt_out: PVARTYPE): HRESULT {
    return Oleaut32.Load('SafeArrayGetVartype')(psa, pvt_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraylock
  public static SafeArrayLock(psa: LPSAFEARRAY): HRESULT {
    return Oleaut32.Load('SafeArrayLock')(psa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearrayptrofindex
  public static SafeArrayPtrOfIndex(psa: LPSAFEARRAY, rgIndices: Pointer, ppvData_out: LPLPVOID): HRESULT {
    return Oleaut32.Load('SafeArrayPtrOfIndex')(psa, rgIndices, ppvData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearrayputelement
  public static SafeArrayPutElement(psa: LPSAFEARRAY, rgIndices: Pointer, pv: PVOID): HRESULT {
    return Oleaut32.Load('SafeArrayPutElement')(psa, rgIndices, pv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearrayredim
  public static SafeArrayRedim(psa_in_out: LPSAFEARRAY, psaboundNew: LPSAFEARRAYBOUND): HRESULT {
    return Oleaut32.Load('SafeArrayRedim')(psa_in_out, psaboundNew);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearrayreleasedata
  public static SafeArrayReleaseData(pData: PVOID): void {
    return Oleaut32.Load('SafeArrayReleaseData')(pData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearrayreleasedescriptor
  public static SafeArrayReleaseDescriptor(psa: LPSAFEARRAY): void {
    return Oleaut32.Load('SafeArrayReleaseDescriptor')(psa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraysetiid
  public static SafeArraySetIID(psa: LPSAFEARRAY, guid: REFGUID): HRESULT {
    return Oleaut32.Load('SafeArraySetIID')(psa, guid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearraysetrecordinfo
  public static SafeArraySetRecordInfo(psa: LPSAFEARRAY, prinfo: IRecordInfo): HRESULT {
    return Oleaut32.Load('SafeArraySetRecordInfo')(psa, prinfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearrayunaccessdata
  public static SafeArrayUnaccessData(psa: LPSAFEARRAY): HRESULT {
    return Oleaut32.Load('SafeArrayUnaccessData')(psa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-safearrayunlock
  public static SafeArrayUnlock(psa: LPSAFEARRAY): HRESULT {
    return Oleaut32.Load('SafeArrayUnlock')(psa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-seterrorinfo
  public static SetErrorInfo(dwReserved: ULONG, perrinfo: Optional<IErrorInfo>): HRESULT {
    return Oleaut32.Load('SetErrorInfo')(dwReserved, perrinfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-setoanocache
  public static SetOaNoCache(): void {
    return Oleaut32.Load('SetOaNoCache')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-setvarconversionlocalesetting
  public static SetVarConversionLocaleSetting(lcid: LCID): HRESULT {
    return Oleaut32.Load('SetVarConversionLocaleSetting')(lcid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-sysaddrefstring
  public static SysAddRefString(pszStrPtr: BSTR): HRESULT {
    return Oleaut32.Load('SysAddRefString')(pszStrPtr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-sysallocstring
  public static SysAllocString(psz: Optional<LPCOLESTR>): BSTR {
    return Oleaut32.Load('SysAllocString')(psz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-sysallocstringbytelen
  public static SysAllocStringByteLen(psz: Optional<LPCSTR>, len: UINT): BSTR {
    return Oleaut32.Load('SysAllocStringByteLen')(psz, len);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-sysallocstringlen
  public static SysAllocStringLen(strIn: Optional<LPCOLESTR>, ui: UINT): BSTR {
    return Oleaut32.Load('SysAllocStringLen')(strIn, ui);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-sysfreestring
  public static SysFreeString(bstrString: Optional<BSTR>): void {
    return Oleaut32.Load('SysFreeString')(bstrString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-sysreallocstring
  public static SysReAllocString(pbstr_in_out: LPBSTR, psz: Optional<LPCOLESTR>): INT {
    return Oleaut32.Load('SysReAllocString')(pbstr_in_out, psz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-sysreallocstringlen
  public static SysReAllocStringLen(pbstr_in_out: LPBSTR, psz: Optional<LPCOLESTR>, len: UINT): INT {
    return Oleaut32.Load('SysReAllocStringLen')(pbstr_in_out, psz, len);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-sysreleasestring
  public static SysReleaseString(bstrString: BSTR): void {
    return Oleaut32.Load('SysReleaseString')(bstrString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-sysstringbytelen
  public static SysStringByteLen(bstr: Optional<BSTR>): UINT {
    return Oleaut32.Load('SysStringByteLen')(bstr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-sysstringlen
  public static SysStringLen(pbstr: Optional<BSTR>): UINT {
    return Oleaut32.Load('SysStringLen')(pbstr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-systemtimetovarianttime
  public static SystemTimeToVariantTime(lpSystemTime: LPSYSTEMTIME, pvtime_out: Pointer): INT {
    return Oleaut32.Load('SystemTimeToVariantTime')(lpSystemTime, pvtime_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-unregistertypelib
  public static UnRegisterTypeLib(libID: REFGUID, wVerMajor: WORD, wVerMinor: WORD, lcid: LCID, syskind: SysKind): HRESULT {
    return Oleaut32.Load('UnRegisterTypeLib')(libID, wVerMajor, wVerMinor, lcid, syskind);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-unregistertypelibforuser
  public static UnRegisterTypeLibForUser(libID: REFGUID, wVerMajor: WORD, wVerMinor: WORD, lcid: LCID, syskind: SysKind): HRESULT {
    return Oleaut32.Load('UnRegisterTypeLibForUser')(libID, wVerMajor, wVerMinor, lcid, syskind);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varabs
  public static VarAbs(pvarIn: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarAbs')(pvarIn, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varadd
  public static VarAdd(pvarLeft: LPVARIANT, pvarRight: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarAdd')(pvarLeft, pvarRight, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varand
  public static VarAnd(pvarLeft: LPVARIANT, pvarRight: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarAnd')(pvarLeft, pvarRight, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varboolfromcy
  public static VarBoolFromCy(cyIn: CY, pboolOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarBoolFromCy')(cyIn, pboolOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varboolfromdate
  public static VarBoolFromDate(dateIn: DATE, pboolOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarBoolFromDate')(dateIn, pboolOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varboolfromdec
  public static VarBoolFromDec(pdecIn: LPDECIMAL, pboolOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarBoolFromDec')(pdecIn, pboolOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varboolfromdisp
  public static VarBoolFromDisp(pdispIn: IDispatch, lcid: LCID, pboolOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarBoolFromDisp')(pdispIn, lcid, pboolOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varboolfromi1
  public static VarBoolFromI1(cIn: CHAR, pboolOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarBoolFromI1')(cIn, pboolOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varboolfromi2
  public static VarBoolFromI2(sIn: SHORT, pboolOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarBoolFromI2')(sIn, pboolOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varboolfromi4
  public static VarBoolFromI4(lIn: LONG, pboolOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarBoolFromI4')(lIn, pboolOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varboolfromi8
  public static VarBoolFromI8(i64In: LONG64, pboolOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarBoolFromI8')(i64In, pboolOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varboolfromr4
  public static VarBoolFromR4(fltIn: FLOAT, pboolOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarBoolFromR4')(fltIn, pboolOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varboolfromr8
  public static VarBoolFromR8(dblIn: DOUBLE, pboolOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarBoolFromR8')(dblIn, pboolOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varboolfromstr
  public static VarBoolFromStr(strIn: LPCOLESTR, lcid: LCID, dwFlags: ULONG, pboolOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarBoolFromStr')(strIn, lcid, dwFlags, pboolOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varboolfromui1
  public static VarBoolFromUI1(bIn: BYTE, pboolOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarBoolFromUI1')(bIn, pboolOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varboolfromui2
  public static VarBoolFromUI2(uiIn: USHORT, pboolOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarBoolFromUI2')(uiIn, pboolOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varboolfromui4
  public static VarBoolFromUI4(ulIn: ULONG, pboolOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarBoolFromUI4')(ulIn, pboolOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varboolfromui8
  public static VarBoolFromUI8(ui64In: ULONG64, pboolOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarBoolFromUI8')(ui64In, pboolOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrcat
  public static VarBstrCat(bstrLeft: BSTR, bstrRight: BSTR, pbstrResult_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrCat')(bstrLeft, bstrRight, pbstrResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrcmp
  public static VarBstrCmp(bstrLeft: BSTR, bstrRight: BSTR, lcid: LCID, dwFlags: ULONG): HRESULT {
    return Oleaut32.Load('VarBstrCmp')(bstrLeft, bstrRight, lcid, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrfrombool
  public static VarBstrFromBool(boolIn: VARIANT_BOOL, lcid: LCID, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrFromBool')(boolIn, lcid, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrfromcy
  public static VarBstrFromCy(cyIn: CY, lcid: LCID, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrFromCy')(cyIn, lcid, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrfromdate
  public static VarBstrFromDate(dateIn: DATE, lcid: LCID, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrFromDate')(dateIn, lcid, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrfromdec
  public static VarBstrFromDec(pdecIn: LPDECIMAL, lcid: LCID, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrFromDec')(pdecIn, lcid, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrfromdisp
  public static VarBstrFromDisp(pdispIn: IDispatch, lcid: LCID, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrFromDisp')(pdispIn, lcid, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrfromi1
  public static VarBstrFromI1(cIn: CHAR, lcid: LCID, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrFromI1')(cIn, lcid, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrfromi2
  public static VarBstrFromI2(sIn: SHORT, lcid: LCID, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrFromI2')(sIn, lcid, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrfromi4
  public static VarBstrFromI4(lIn: LONG, lcid: LCID, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrFromI4')(lIn, lcid, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrfromi8
  public static VarBstrFromI8(i64In: LONG64, lcid: LCID, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrFromI8')(i64In, lcid, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrfromr4
  public static VarBstrFromR4(fltIn: FLOAT, lcid: LCID, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrFromR4')(fltIn, lcid, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrfromr8
  public static VarBstrFromR8(dblIn: DOUBLE, lcid: LCID, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrFromR8')(dblIn, lcid, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrfromui1
  public static VarBstrFromUI1(bIn: BYTE, lcid: LCID, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrFromUI1')(bIn, lcid, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrfromui2
  public static VarBstrFromUI2(uiIn: USHORT, lcid: LCID, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrFromUI2')(uiIn, lcid, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrfromui4
  public static VarBstrFromUI4(ulIn: ULONG, lcid: LCID, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrFromUI4')(ulIn, lcid, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varbstrfromui8
  public static VarBstrFromUI8(ui64In: ULONG64, lcid: LCID, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarBstrFromUI8')(ui64In, lcid, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcat
  public static VarCat(pvarLeft: LPVARIANT, pvarRight: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarCat')(pvarLeft, pvarRight, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcmp
  public static VarCmp(pvarLeft: LPVARIANT, pvarRight: LPVARIANT, lcid: LCID, dwFlags: ULONG): HRESULT {
    return Oleaut32.Load('VarCmp')(pvarLeft, pvarRight, lcid, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyabs
  public static VarCyAbs(cyIn: CY, pcyResult_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyAbs')(cyIn, pcyResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyadd
  public static VarCyAdd(cyLeft: CY, cyRight: CY, pcyResult_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyAdd')(cyLeft, cyRight, pcyResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcycmp
  public static VarCyCmp(cyLeft: CY, cyRight: CY): HRESULT {
    return Oleaut32.Load('VarCyCmp')(cyLeft, cyRight);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcycmpr8
  public static VarCyCmpR8(cyLeft: CY, dblRight: DOUBLE): HRESULT {
    return Oleaut32.Load('VarCyCmpR8')(cyLeft, dblRight);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfix
  public static VarCyFix(cyIn: CY, pcyResult_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFix')(cyIn, pcyResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfrombool
  public static VarCyFromBool(boolIn: VARIANT_BOOL, pcyOut_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFromBool')(boolIn, pcyOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfromdate
  public static VarCyFromDate(dateIn: DATE, pcyOut_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFromDate')(dateIn, pcyOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfromdec
  public static VarCyFromDec(pdecIn: LPDECIMAL, pcyOut_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFromDec')(pdecIn, pcyOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfromdisp
  public static VarCyFromDisp(pdispIn: IDispatch, lcid: LCID, pcyOut_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFromDisp')(pdispIn, lcid, pcyOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfromi1
  public static VarCyFromI1(cIn: CHAR, pcyOut_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFromI1')(cIn, pcyOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfromi2
  public static VarCyFromI2(sIn: SHORT, pcyOut_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFromI2')(sIn, pcyOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfromi4
  public static VarCyFromI4(lIn: LONG, pcyOut_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFromI4')(lIn, pcyOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfromi8
  public static VarCyFromI8(i64In: LONG64, pcyOut_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFromI8')(i64In, pcyOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfromr4
  public static VarCyFromR4(fltIn: FLOAT, pcyOut_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFromR4')(fltIn, pcyOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfromr8
  public static VarCyFromR8(dblIn: DOUBLE, pcyOut_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFromR8')(dblIn, pcyOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfromstr
  public static VarCyFromStr(strIn: LPCOLESTR, lcid: LCID, dwFlags: ULONG, pcyOut_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFromStr')(strIn, lcid, dwFlags, pcyOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfromui1
  public static VarCyFromUI1(bIn: BYTE, pcyOut_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFromUI1')(bIn, pcyOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfromui2
  public static VarCyFromUI2(uiIn: USHORT, pcyOut_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFromUI2')(uiIn, pcyOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfromui4
  public static VarCyFromUI4(ulIn: ULONG, pcyOut_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFromUI4')(ulIn, pcyOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyfromui8
  public static VarCyFromUI8(ui64In: ULONG64, pcyOut_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyFromUI8')(ui64In, pcyOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyint
  public static VarCyInt(cyIn: CY, pcyResult_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyInt')(cyIn, pcyResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcymul
  public static VarCyMul(cyLeft: CY, cyRight: CY, pcyResult_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyMul')(cyLeft, cyRight, pcyResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcymuli4
  public static VarCyMulI4(cyLeft: CY, lRight: LONG, pcyResult_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyMulI4')(cyLeft, lRight, pcyResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcymuli8
  public static VarCyMulI8(cyLeft: CY, lRight: LONG64, pcyResult_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyMulI8')(cyLeft, lRight, pcyResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyneg
  public static VarCyNeg(cyIn: CY, pcyResult_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyNeg')(cyIn, pcyResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcyround
  public static VarCyRound(cyIn: CY, cDecimals: INT, pcyResult_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCyRound')(cyIn, cDecimals, pcyResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varcysub
  public static VarCySub(cyLeft: CY, cyRight: CY, pcyResult_out: LPCY): HRESULT {
    return Oleaut32.Load('VarCySub')(cyLeft, cyRight, pcyResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefrombool
  public static VarDateFromBool(boolIn: VARIANT_BOOL, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromBool')(boolIn, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromcy
  public static VarDateFromCy(cyIn: CY, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromCy')(cyIn, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromdec
  public static VarDateFromDec(pdecIn: LPDECIMAL, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromDec')(pdecIn, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromdisp
  public static VarDateFromDisp(pdispIn: IDispatch, lcid: LCID, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromDisp')(pdispIn, lcid, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromi1
  public static VarDateFromI1(cIn: CHAR, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromI1')(cIn, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromi2
  public static VarDateFromI2(sIn: SHORT, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromI2')(sIn, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromi4
  public static VarDateFromI4(lIn: LONG, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromI4')(lIn, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromi8
  public static VarDateFromI8(i64In: LONG64, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromI8')(i64In, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromr4
  public static VarDateFromR4(fltIn: FLOAT, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromR4')(fltIn, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromr8
  public static VarDateFromR8(dblIn: DOUBLE, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromR8')(dblIn, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromstr
  public static VarDateFromStr(strIn: LPCOLESTR, lcid: LCID, dwFlags: ULONG, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromStr')(strIn, lcid, dwFlags, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromudate
  public static VarDateFromUdate(pudateIn: LPUDATE, dwFlags: ULONG, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromUdate')(pudateIn, dwFlags, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromudateex
  public static VarDateFromUdateEx(pudateIn: LPUDATE, lcid: LCID, dwFlags: ULONG, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromUdateEx')(pudateIn, lcid, dwFlags, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromui1
  public static VarDateFromUI1(bIn: BYTE, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromUI1')(bIn, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromui2
  public static VarDateFromUI2(uiIn: USHORT, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromUI2')(uiIn, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromui4
  public static VarDateFromUI4(ulIn: ULONG, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromUI4')(ulIn, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardatefromui8
  public static VarDateFromUI8(ui64In: ULONG64, pdateOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarDateFromUI8')(ui64In, pdateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecabs
  public static VarDecAbs(pdecIn: LPDECIMAL, pdecResult_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecAbs')(pdecIn, pdecResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecadd
  public static VarDecAdd(pdecLeft: LPDECIMAL, pdecRight: LPDECIMAL, pdecResult_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecAdd')(pdecLeft, pdecRight, pdecResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardeccmp
  public static VarDecCmp(pdecLeft: LPDECIMAL, pdecRight: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecCmp')(pdecLeft, pdecRight);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardeccmpr8
  public static VarDecCmpR8(pdecLeft: LPDECIMAL, dblRight: DOUBLE): HRESULT {
    return Oleaut32.Load('VarDecCmpR8')(pdecLeft, dblRight);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecdiv
  public static VarDecDiv(pdecLeft: LPDECIMAL, pdecRight: LPDECIMAL, pdecResult_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecDiv')(pdecLeft, pdecRight, pdecResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfix
  public static VarDecFix(pdecIn: LPDECIMAL, pdecResult_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFix')(pdecIn, pdecResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfrombool
  public static VarDecFromBool(boolIn: VARIANT_BOOL, pdecOut_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFromBool')(boolIn, pdecOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfromcy
  public static VarDecFromCy(cyIn: CY, pdecOut_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFromCy')(cyIn, pdecOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfromdate
  public static VarDecFromDate(dateIn: DATE, pdecOut_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFromDate')(dateIn, pdecOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfromdisp
  public static VarDecFromDisp(pdispIn: IDispatch, lcid: LCID, pdecOut_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFromDisp')(pdispIn, lcid, pdecOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfromi1
  public static VarDecFromI1(cIn: CHAR, pdecOut_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFromI1')(cIn, pdecOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfromi2
  public static VarDecFromI2(sIn: SHORT, pdecOut_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFromI2')(sIn, pdecOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfromi4
  public static VarDecFromI4(lIn: LONG, pdecOut_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFromI4')(lIn, pdecOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfromi8
  public static VarDecFromI8(i64In: LONG64, pdecOut_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFromI8')(i64In, pdecOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfromr4
  public static VarDecFromR4(fltIn: FLOAT, pdecOut_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFromR4')(fltIn, pdecOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfromr8
  public static VarDecFromR8(dblIn: DOUBLE, pdecOut_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFromR8')(dblIn, pdecOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfromstr
  public static VarDecFromStr(strIn: LPCOLESTR, lcid: LCID, dwFlags: ULONG, pdecOut_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFromStr')(strIn, lcid, dwFlags, pdecOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfromui1
  public static VarDecFromUI1(bIn: BYTE, pdecOut_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFromUI1')(bIn, pdecOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfromui2
  public static VarDecFromUI2(uiIn: USHORT, pdecOut_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFromUI2')(uiIn, pdecOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfromui4
  public static VarDecFromUI4(ulIn: ULONG, pdecOut_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFromUI4')(ulIn, pdecOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecfromui8
  public static VarDecFromUI8(ui64In: ULONG64, pdecOut_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecFromUI8')(ui64In, pdecOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecint
  public static VarDecInt(pdecIn: LPDECIMAL, pdecResult_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecInt')(pdecIn, pdecResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecmul
  public static VarDecMul(pdecLeft: LPDECIMAL, pdecRight: LPDECIMAL, pdecResult_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecMul')(pdecLeft, pdecRight, pdecResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecneg
  public static VarDecNeg(pdecIn: LPDECIMAL, pdecResult_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecNeg')(pdecIn, pdecResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecround
  public static VarDecRound(pdecIn: LPDECIMAL, cDecimals: INT, pdecResult_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecRound')(pdecIn, cDecimals, pdecResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardecsub
  public static VarDecSub(pdecLeft: LPDECIMAL, pdecRight: LPDECIMAL, pdecResult_out: LPDECIMAL): HRESULT {
    return Oleaut32.Load('VarDecSub')(pdecLeft, pdecRight, pdecResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vardiv
  public static VarDiv(pvarLeft: LPVARIANT, pvarRight: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarDiv')(pvarLeft, pvarRight, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vareqv
  public static VarEqv(pvarLeft: LPVARIANT, pvarRight: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarEqv')(pvarLeft, pvarRight, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varfix
  public static VarFix(pvarIn: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarFix')(pvarIn, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varformat
  public static VarFormat(pvarIn: LPVARIANTARG, pstrFormat: Optional<LPOLESTR>, iFirstDay: INT, iFirstWeek: INT, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarFormat')(pvarIn, pstrFormat, iFirstDay, iFirstWeek, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varformatcurrency
  public static VarFormatCurrency(pvarIn: LPVARIANTARG, iNumDig: INT, iIncLead: INT, iUseParens: INT, iGroup: INT, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarFormatCurrency')(pvarIn, iNumDig, iIncLead, iUseParens, iGroup, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varformatdatetime
  public static VarFormatDateTime(pvarIn: LPVARIANTARG, iNamedFormat: INT, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarFormatDateTime')(pvarIn, iNamedFormat, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varformatfromtokens
  public static VarFormatFromTokens(pvarIn: LPVARIANTARG, pstrFormat: Optional<LPOLESTR>, pbTokCur: Pointer, dwFlags: ULONG, pbstrOut_out: LPBSTR, lcid: LCID): HRESULT {
    return Oleaut32.Load('VarFormatFromTokens')(pvarIn, pstrFormat, pbTokCur, dwFlags, pbstrOut_out, lcid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varformatnumber
  public static VarFormatNumber(pvarIn: LPVARIANTARG, iNumDig: INT, iIncLead: INT, iUseParens: INT, iGroup: INT, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarFormatNumber')(pvarIn, iNumDig, iIncLead, iUseParens, iGroup, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varformatpercent
  public static VarFormatPercent(pvarIn: LPVARIANTARG, iNumDig: INT, iIncLead: INT, iUseParens: INT, iGroup: INT, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarFormatPercent')(pvarIn, iNumDig, iIncLead, iUseParens, iGroup, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari1frombool
  public static VarI1FromBool(boolIn: VARIANT_BOOL, pcOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI1FromBool')(boolIn, pcOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari1fromcy
  public static VarI1FromCy(cyIn: CY, pcOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI1FromCy')(cyIn, pcOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari1fromdate
  public static VarI1FromDate(dateIn: DATE, pcOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI1FromDate')(dateIn, pcOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari1fromdec
  public static VarI1FromDec(pdecIn: LPDECIMAL, pcOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI1FromDec')(pdecIn, pcOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari1fromdisp
  public static VarI1FromDisp(pdispIn: IDispatch, lcid: LCID, pcOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI1FromDisp')(pdispIn, lcid, pcOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari1fromi2
  public static VarI1FromI2(sIn: SHORT, pcOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI1FromI2')(sIn, pcOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari1fromi4
  public static VarI1FromI4(lIn: LONG, pcOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI1FromI4')(lIn, pcOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari1fromi8
  public static VarI1FromI8(i64In: LONG64, pcOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI1FromI8')(i64In, pcOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari1fromr4
  public static VarI1FromR4(fltIn: FLOAT, pcOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI1FromR4')(fltIn, pcOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari1fromr8
  public static VarI1FromR8(dblIn: DOUBLE, pcOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI1FromR8')(dblIn, pcOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari1fromstr
  public static VarI1FromStr(strIn: LPCOLESTR, lcid: LCID, dwFlags: ULONG, pcOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI1FromStr')(strIn, lcid, dwFlags, pcOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari1fromui1
  public static VarI1FromUI1(bIn: BYTE, pcOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI1FromUI1')(bIn, pcOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari1fromui2
  public static VarI1FromUI2(uiIn: USHORT, pcOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI1FromUI2')(uiIn, pcOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari1fromui4
  public static VarI1FromUI4(ulIn: ULONG, pcOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI1FromUI4')(ulIn, pcOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari1fromui8
  public static VarI1FromUI8(ui64In: ULONG64, pcOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI1FromUI8')(ui64In, pcOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari2frombool
  public static VarI2FromBool(boolIn: VARIANT_BOOL, psOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI2FromBool')(boolIn, psOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari2fromcy
  public static VarI2FromCy(cyIn: CY, psOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI2FromCy')(cyIn, psOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari2fromdate
  public static VarI2FromDate(dateIn: DATE, psOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI2FromDate')(dateIn, psOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari2fromdec
  public static VarI2FromDec(pdecIn: LPDECIMAL, psOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI2FromDec')(pdecIn, psOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari2fromdisp
  public static VarI2FromDisp(pdispIn: IDispatch, lcid: LCID, psOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI2FromDisp')(pdispIn, lcid, psOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari2fromi1
  public static VarI2FromI1(cIn: CHAR, psOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI2FromI1')(cIn, psOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari2fromi4
  public static VarI2FromI4(lIn: LONG, psOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI2FromI4')(lIn, psOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari2fromi8
  public static VarI2FromI8(i64In: LONG64, psOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI2FromI8')(i64In, psOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari2fromr4
  public static VarI2FromR4(fltIn: FLOAT, psOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI2FromR4')(fltIn, psOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari2fromr8
  public static VarI2FromR8(dblIn: DOUBLE, psOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI2FromR8')(dblIn, psOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari2fromstr
  public static VarI2FromStr(strIn: LPCOLESTR, lcid: LCID, dwFlags: ULONG, psOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI2FromStr')(strIn, lcid, dwFlags, psOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari2fromui1
  public static VarI2FromUI1(bIn: BYTE, psOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI2FromUI1')(bIn, psOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari2fromui2
  public static VarI2FromUI2(uiIn: USHORT, psOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI2FromUI2')(uiIn, psOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari2fromui4
  public static VarI2FromUI4(ulIn: ULONG, psOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI2FromUI4')(ulIn, psOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari2fromui8
  public static VarI2FromUI8(ui64In: ULONG64, psOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI2FromUI8')(ui64In, psOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari4frombool
  public static VarI4FromBool(boolIn: VARIANT_BOOL, plOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI4FromBool')(boolIn, plOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari4fromcy
  public static VarI4FromCy(cyIn: CY, plOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI4FromCy')(cyIn, plOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari4fromdate
  public static VarI4FromDate(dateIn: DATE, plOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI4FromDate')(dateIn, plOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari4fromdec
  public static VarI4FromDec(pdecIn: LPDECIMAL, plOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI4FromDec')(pdecIn, plOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari4fromdisp
  public static VarI4FromDisp(pdispIn: IDispatch, lcid: LCID, plOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI4FromDisp')(pdispIn, lcid, plOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari4fromi1
  public static VarI4FromI1(cIn: CHAR, plOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI4FromI1')(cIn, plOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari4fromi2
  public static VarI4FromI2(sIn: SHORT, plOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI4FromI2')(sIn, plOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari4fromi8
  public static VarI4FromI8(i64In: LONG64, plOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI4FromI8')(i64In, plOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari4fromr4
  public static VarI4FromR4(fltIn: FLOAT, plOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI4FromR4')(fltIn, plOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari4fromr8
  public static VarI4FromR8(dblIn: DOUBLE, plOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI4FromR8')(dblIn, plOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari4fromstr
  public static VarI4FromStr(strIn: LPCOLESTR, lcid: LCID, dwFlags: ULONG, plOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI4FromStr')(strIn, lcid, dwFlags, plOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari4fromui1
  public static VarI4FromUI1(bIn: BYTE, plOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI4FromUI1')(bIn, plOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari4fromui2
  public static VarI4FromUI2(uiIn: USHORT, plOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI4FromUI2')(uiIn, plOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari4fromui4
  public static VarI4FromUI4(ulIn: ULONG, plOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI4FromUI4')(ulIn, plOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari4fromui8
  public static VarI4FromUI8(ui64In: ULONG64, plOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI4FromUI8')(ui64In, plOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari8frombool
  public static VarI8FromBool(boolIn: VARIANT_BOOL, pi64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI8FromBool')(boolIn, pi64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari8fromcy
  public static VarI8FromCy(cyIn: CY, pi64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI8FromCy')(cyIn, pi64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari8fromdate
  public static VarI8FromDate(dateIn: DATE, pi64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI8FromDate')(dateIn, pi64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari8fromdec
  public static VarI8FromDec(pdecIn: LPDECIMAL, pi64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI8FromDec')(pdecIn, pi64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari8fromdisp
  public static VarI8FromDisp(pdispIn: IDispatch, lcid: LCID, pi64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI8FromDisp')(pdispIn, lcid, pi64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari8fromi1
  public static VarI8FromI1(cIn: CHAR, pi64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI8FromI1')(cIn, pi64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari8fromi2
  public static VarI8FromI2(sIn: SHORT, pi64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI8FromI2')(sIn, pi64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari8fromr4
  public static VarI8FromR4(fltIn: FLOAT, pi64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI8FromR4')(fltIn, pi64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari8fromr8
  public static VarI8FromR8(dblIn: DOUBLE, pi64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI8FromR8')(dblIn, pi64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari8fromstr
  public static VarI8FromStr(strIn: LPCOLESTR, lcid: LCID, dwFlags: ULONG, pi64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI8FromStr')(strIn, lcid, dwFlags, pi64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari8fromui1
  public static VarI8FromUI1(bIn: BYTE, pi64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI8FromUI1')(bIn, pi64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari8fromui2
  public static VarI8FromUI2(uiIn: USHORT, pi64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI8FromUI2')(uiIn, pi64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari8fromui4
  public static VarI8FromUI4(ulIn: ULONG, pi64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI8FromUI4')(ulIn, pi64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vari8fromui8
  public static VarI8FromUI8(ui64In: ULONG64, pi64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarI8FromUI8')(ui64In, pi64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-variant_userfree
  public static VARIANT_UserFree(pFlags: PULONG, pvar: LPVARIANT): void {
    return Oleaut32.Load('VARIANT_UserFree')(pFlags, pvar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-variant_userfree64
  public static VARIANT_UserFree64(pFlags: PULONG, pvar: LPVARIANT): void {
    return Oleaut32.Load('VARIANT_UserFree64')(pFlags, pvar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-variant_usermarshal
  public static VARIANT_UserMarshal(pFlags: PULONG, pBuffer_in_out: Pointer, pvar: LPVARIANT): Pointer {
    return Oleaut32.Load('VARIANT_UserMarshal')(pFlags, pBuffer_in_out, pvar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-variant_usermarshal64
  public static VARIANT_UserMarshal64(pFlags: PULONG, pBuffer_in_out: Pointer, pvar: LPVARIANT): Pointer {
    return Oleaut32.Load('VARIANT_UserMarshal64')(pFlags, pBuffer_in_out, pvar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-variant_usersize
  public static VARIANT_UserSize(pFlags: PULONG, StartingSize: ULONG, pvar: LPVARIANT): ULONG {
    return Oleaut32.Load('VARIANT_UserSize')(pFlags, StartingSize, pvar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-variant_usersize64
  public static VARIANT_UserSize64(pFlags: PULONG, StartingSize: ULONG, pvar: LPVARIANT): ULONG {
    return Oleaut32.Load('VARIANT_UserSize64')(pFlags, StartingSize, pvar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-variant_userunmarshal
  public static VARIANT_UserUnmarshal(pFlags: PULONG, pBuffer: Pointer, pvar_out: LPVARIANT): Pointer {
    return Oleaut32.Load('VARIANT_UserUnmarshal')(pFlags, pBuffer, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-variant_userunmarshal64
  public static VARIANT_UserUnmarshal64(pFlags: PULONG, pBuffer: Pointer, pvar_out: LPVARIANT): Pointer {
    return Oleaut32.Load('VARIANT_UserUnmarshal64')(pFlags, pBuffer, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-variantchangetype
  public static VariantChangeType(pvargDest_in_out: LPVARIANTARG, pvarSrc: LPVARIANTARG, wFlags: USHORT, vt: VARTYPE): HRESULT {
    return Oleaut32.Load('VariantChangeType')(pvargDest_in_out, pvarSrc, wFlags, vt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-variantchangetypeex
  public static VariantChangeTypeEx(pvargDest_in_out: LPVARIANTARG, pvarSrc: LPVARIANTARG, lcid: LCID, wFlags: USHORT, vt: VARTYPE): HRESULT {
    return Oleaut32.Load('VariantChangeTypeEx')(pvargDest_in_out, pvarSrc, lcid, wFlags, vt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-variantclear
  public static VariantClear(pvarg_in_out: LPVARIANTARG): HRESULT {
    return Oleaut32.Load('VariantClear')(pvarg_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-variantcopy
  public static VariantCopy(pvargDest_in_out: LPVARIANTARG, pvargSrc: LPVARIANTARG): HRESULT {
    return Oleaut32.Load('VariantCopy')(pvargDest_in_out, pvargSrc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-variantcopyind
  public static VariantCopyInd(pvarDest_in_out: LPVARIANT, pvargSrc: LPVARIANTARG): HRESULT {
    return Oleaut32.Load('VariantCopyInd')(pvarDest_in_out, pvargSrc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-variantinit
  public static VariantInit(pvarg_out: LPVARIANTARG): void {
    return Oleaut32.Load('VariantInit')(pvarg_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varianttimetodosdatetime
  public static VariantTimeToDosDateTime(vtime: DOUBLE, pwDosDate_out: Pointer, pwDosTime_out: Pointer): INT {
    return Oleaut32.Load('VariantTimeToDosDateTime')(vtime, pwDosDate_out, pwDosTime_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varianttimetosystemtime
  public static VariantTimeToSystemTime(vtime: DOUBLE, lpSystemTime_out: LPSYSTEMTIME): INT {
    return Oleaut32.Load('VariantTimeToSystemTime')(vtime, lpSystemTime_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varidiv
  public static VarIdiv(pvarLeft: LPVARIANT, pvarRight: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarIdiv')(pvarLeft, pvarRight, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varimp
  public static VarImp(pvarLeft: LPVARIANT, pvarRight: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarImp')(pvarLeft, pvarRight, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varint
  public static VarInt(pvarIn: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarInt')(pvarIn, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varmod
  public static VarMod(pvarLeft: LPVARIANT, pvarRight: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarMod')(pvarLeft, pvarRight, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varmonthname
  public static VarMonthName(iMonth: INT, fAbbrev: INT, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarMonthName')(iMonth, fAbbrev, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varmul
  public static VarMul(pvarLeft: LPVARIANT, pvarRight: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarMul')(pvarLeft, pvarRight, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varneg
  public static VarNeg(pvarIn: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarNeg')(pvarIn, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varnot
  public static VarNot(pvarIn: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarNot')(pvarIn, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varnumfromparsenum
  public static VarNumFromParseNum(pnumprs: LPNUMPARSE, rgbDig: Pointer, dwVtBits: ULONG, pvar_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarNumFromParseNum')(pnumprs, rgbDig, dwVtBits, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varor
  public static VarOr(pvarLeft: LPVARIANT, pvarRight: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarOr')(pvarLeft, pvarRight, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varparsenumfromstr
  public static VarParseNumFromStr(strIn: LPCOLESTR, lcid: LCID, dwFlags: ULONG, pnumprs_in_out: LPNUMPARSE, rgbDig_out: Pointer): HRESULT {
    return Oleaut32.Load('VarParseNumFromStr')(strIn, lcid, dwFlags, pnumprs_in_out, rgbDig_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varpow
  public static VarPow(pvarLeft: LPVARIANT, pvarRight: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarPow')(pvarLeft, pvarRight, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4cmpr8
  public static VarR4CmpR8(fltLeft: FLOAT, dblRight: DOUBLE): HRESULT {
    return Oleaut32.Load('VarR4CmpR8')(fltLeft, dblRight);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4frombool
  public static VarR4FromBool(boolIn: VARIANT_BOOL, pfltOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR4FromBool')(boolIn, pfltOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4fromcy
  public static VarR4FromCy(cyIn: CY, pfltOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR4FromCy')(cyIn, pfltOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4fromdate
  public static VarR4FromDate(dateIn: DATE, pfltOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR4FromDate')(dateIn, pfltOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4fromdec
  public static VarR4FromDec(pdecIn: LPDECIMAL, pfltOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR4FromDec')(pdecIn, pfltOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4fromdisp
  public static VarR4FromDisp(pdispIn: IDispatch, lcid: LCID, pfltOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR4FromDisp')(pdispIn, lcid, pfltOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4fromi1
  public static VarR4FromI1(cIn: CHAR, pfltOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR4FromI1')(cIn, pfltOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4fromi2
  public static VarR4FromI2(sIn: SHORT, pfltOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR4FromI2')(sIn, pfltOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4fromi4
  public static VarR4FromI4(lIn: LONG, pfltOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR4FromI4')(lIn, pfltOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4fromi8
  public static VarR4FromI8(i64In: LONG64, pfltOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR4FromI8')(i64In, pfltOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4fromr8
  public static VarR4FromR8(dblIn: DOUBLE, pfltOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR4FromR8')(dblIn, pfltOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4fromstr
  public static VarR4FromStr(strIn: LPCOLESTR, lcid: LCID, dwFlags: ULONG, pfltOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR4FromStr')(strIn, lcid, dwFlags, pfltOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4fromui1
  public static VarR4FromUI1(bIn: BYTE, pfltOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR4FromUI1')(bIn, pfltOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4fromui2
  public static VarR4FromUI2(uiIn: USHORT, pfltOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR4FromUI2')(uiIn, pfltOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4fromui4
  public static VarR4FromUI4(ulIn: ULONG, pfltOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR4FromUI4')(ulIn, pfltOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr4fromui8
  public static VarR4FromUI8(ui64In: ULONG64, pfltOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR4FromUI8')(ui64In, pfltOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8frombool
  public static VarR8FromBool(boolIn: VARIANT_BOOL, pdblOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8FromBool')(boolIn, pdblOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8fromcy
  public static VarR8FromCy(cyIn: CY, pdblOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8FromCy')(cyIn, pdblOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8fromdate
  public static VarR8FromDate(dateIn: DATE, pdblOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8FromDate')(dateIn, pdblOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8fromdec
  public static VarR8FromDec(pdecIn: LPDECIMAL, pdblOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8FromDec')(pdecIn, pdblOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8fromdisp
  public static VarR8FromDisp(pdispIn: IDispatch, lcid: LCID, pdblOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8FromDisp')(pdispIn, lcid, pdblOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8fromi1
  public static VarR8FromI1(cIn: CHAR, pdblOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8FromI1')(cIn, pdblOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8fromi2
  public static VarR8FromI2(sIn: SHORT, pdblOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8FromI2')(sIn, pdblOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8fromi4
  public static VarR8FromI4(lIn: LONG, pdblOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8FromI4')(lIn, pdblOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8fromi8
  public static VarR8FromI8(i64In: LONG64, pdblOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8FromI8')(i64In, pdblOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8fromr4
  public static VarR8FromR4(fltIn: FLOAT, pdblOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8FromR4')(fltIn, pdblOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8fromstr
  public static VarR8FromStr(strIn: LPCOLESTR, lcid: LCID, dwFlags: ULONG, pdblOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8FromStr')(strIn, lcid, dwFlags, pdblOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8fromui1
  public static VarR8FromUI1(bIn: BYTE, pdblOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8FromUI1')(bIn, pdblOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8fromui2
  public static VarR8FromUI2(uiIn: USHORT, pdblOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8FromUI2')(uiIn, pdblOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8fromui4
  public static VarR8FromUI4(ulIn: ULONG, pdblOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8FromUI4')(ulIn, pdblOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8fromui8
  public static VarR8FromUI8(ui64In: ULONG64, pdblOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8FromUI8')(ui64In, pdblOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8pow
  public static VarR8Pow(dblLeft: DOUBLE, dblRight: DOUBLE, pdblResult_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8Pow')(dblLeft, dblRight, pdblResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varr8round
  public static VarR8Round(dblIn: DOUBLE, cDecimals: INT, pdblResult_out: Pointer): HRESULT {
    return Oleaut32.Load('VarR8Round')(dblIn, cDecimals, pdblResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varround
  public static VarRound(pvarIn: LPVARIANT, cDecimals: INT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarRound')(pvarIn, cDecimals, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varsub
  public static VarSub(pvarLeft: LPVARIANT, pvarRight: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarSub')(pvarLeft, pvarRight, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vartokenizeformatstring
  public static VarTokenizeFormatString(pstrFormat: Optional<LPOLESTR>, rgbTok_in_out: Pointer, cbTok: INT, iFirstDay: INT, iFirstWeek: INT, lcid: LCID, pcbActual_out: Optional<Pointer>): HRESULT {
    return Oleaut32.Load('VarTokenizeFormatString')(pstrFormat, rgbTok_in_out, cbTok, iFirstDay, iFirstWeek, lcid, pcbActual_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varudatefromdate
  public static VarUdateFromDate(dateIn: DATE, dwFlags: ULONG, pudateOut_out: LPUDATE): HRESULT {
    return Oleaut32.Load('VarUdateFromDate')(dateIn, dwFlags, pudateOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui1frombool
  public static VarUI1FromBool(boolIn: VARIANT_BOOL, pbOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI1FromBool')(boolIn, pbOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui1fromcy
  public static VarUI1FromCy(cyIn: CY, pbOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI1FromCy')(cyIn, pbOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui1fromdate
  public static VarUI1FromDate(dateIn: DATE, pbOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI1FromDate')(dateIn, pbOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui1fromdec
  public static VarUI1FromDec(pdecIn: LPDECIMAL, pbOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI1FromDec')(pdecIn, pbOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui1fromdisp
  public static VarUI1FromDisp(pdispIn: IDispatch, lcid: LCID, pbOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI1FromDisp')(pdispIn, lcid, pbOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui1fromi1
  public static VarUI1FromI1(cIn: CHAR, pbOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI1FromI1')(cIn, pbOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui1fromi2
  public static VarUI1FromI2(sIn: SHORT, pbOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI1FromI2')(sIn, pbOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui1fromi4
  public static VarUI1FromI4(lIn: LONG, pbOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI1FromI4')(lIn, pbOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui1fromi8
  public static VarUI1FromI8(i64In: LONG64, pbOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI1FromI8')(i64In, pbOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui1fromr4
  public static VarUI1FromR4(fltIn: FLOAT, pbOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI1FromR4')(fltIn, pbOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui1fromr8
  public static VarUI1FromR8(dblIn: DOUBLE, pbOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI1FromR8')(dblIn, pbOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui1fromstr
  public static VarUI1FromStr(strIn: LPCOLESTR, lcid: LCID, dwFlags: ULONG, pbOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI1FromStr')(strIn, lcid, dwFlags, pbOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui1fromui2
  public static VarUI1FromUI2(uiIn: USHORT, pbOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI1FromUI2')(uiIn, pbOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui1fromui4
  public static VarUI1FromUI4(ulIn: ULONG, pbOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI1FromUI4')(ulIn, pbOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui1fromui8
  public static VarUI1FromUI8(ui64In: ULONG64, pbOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI1FromUI8')(ui64In, pbOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui2frombool
  public static VarUI2FromBool(boolIn: VARIANT_BOOL, puiOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI2FromBool')(boolIn, puiOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui2fromcy
  public static VarUI2FromCy(cyIn: CY, puiOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI2FromCy')(cyIn, puiOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui2fromdate
  public static VarUI2FromDate(dateIn: DATE, puiOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI2FromDate')(dateIn, puiOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui2fromdec
  public static VarUI2FromDec(pdecIn: LPDECIMAL, puiOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI2FromDec')(pdecIn, puiOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui2fromdisp
  public static VarUI2FromDisp(pdispIn: IDispatch, lcid: LCID, puiOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI2FromDisp')(pdispIn, lcid, puiOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui2fromi1
  public static VarUI2FromI1(cIn: CHAR, puiOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI2FromI1')(cIn, puiOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui2fromi2
  public static VarUI2FromI2(sIn: SHORT, puiOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI2FromI2')(sIn, puiOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui2fromi4
  public static VarUI2FromI4(lIn: LONG, puiOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI2FromI4')(lIn, puiOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui2fromi8
  public static VarUI2FromI8(i64In: LONG64, puiOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI2FromI8')(i64In, puiOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui2fromr4
  public static VarUI2FromR4(fltIn: FLOAT, puiOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI2FromR4')(fltIn, puiOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui2fromr8
  public static VarUI2FromR8(dblIn: DOUBLE, puiOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI2FromR8')(dblIn, puiOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui2fromstr
  public static VarUI2FromStr(strIn: LPCOLESTR, lcid: LCID, dwFlags: ULONG, puiOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI2FromStr')(strIn, lcid, dwFlags, puiOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui2fromui1
  public static VarUI2FromUI1(bIn: BYTE, puiOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI2FromUI1')(bIn, puiOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui2fromui4
  public static VarUI2FromUI4(ulIn: ULONG, puiOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI2FromUI4')(ulIn, puiOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui2fromui8
  public static VarUI2FromUI8(ui64In: ULONG64, puiOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI2FromUI8')(ui64In, puiOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui4frombool
  public static VarUI4FromBool(boolIn: VARIANT_BOOL, pulOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI4FromBool')(boolIn, pulOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui4fromcy
  public static VarUI4FromCy(cyIn: CY, pulOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI4FromCy')(cyIn, pulOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui4fromdate
  public static VarUI4FromDate(dateIn: DATE, pulOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI4FromDate')(dateIn, pulOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui4fromdec
  public static VarUI4FromDec(pdecIn: LPDECIMAL, pulOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI4FromDec')(pdecIn, pulOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui4fromdisp
  public static VarUI4FromDisp(pdispIn: IDispatch, lcid: LCID, pulOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI4FromDisp')(pdispIn, lcid, pulOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui4fromi1
  public static VarUI4FromI1(cIn: CHAR, pulOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI4FromI1')(cIn, pulOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui4fromi2
  public static VarUI4FromI2(sIn: SHORT, pulOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI4FromI2')(sIn, pulOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui4fromi4
  public static VarUI4FromI4(lIn: LONG, pulOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI4FromI4')(lIn, pulOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui4fromi8
  public static VarUI4FromI8(i64In: LONG64, pulOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI4FromI8')(i64In, pulOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui4fromr4
  public static VarUI4FromR4(fltIn: FLOAT, pulOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI4FromR4')(fltIn, pulOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui4fromr8
  public static VarUI4FromR8(dblIn: DOUBLE, pulOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI4FromR8')(dblIn, pulOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui4fromstr
  public static VarUI4FromStr(strIn: LPCOLESTR, lcid: LCID, dwFlags: ULONG, pulOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI4FromStr')(strIn, lcid, dwFlags, pulOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui4fromui1
  public static VarUI4FromUI1(bIn: BYTE, pulOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI4FromUI1')(bIn, pulOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui4fromui2
  public static VarUI4FromUI2(uiIn: USHORT, pulOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI4FromUI2')(uiIn, pulOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui4fromui8
  public static VarUI4FromUI8(ui64In: ULONG64, pulOut_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI4FromUI8')(ui64In, pulOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui8frombool
  public static VarUI8FromBool(boolIn: VARIANT_BOOL, pui64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI8FromBool')(boolIn, pui64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui8fromcy
  public static VarUI8FromCy(cyIn: CY, pui64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI8FromCy')(cyIn, pui64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui8fromdate
  public static VarUI8FromDate(dateIn: DATE, pui64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI8FromDate')(dateIn, pui64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui8fromdec
  public static VarUI8FromDec(pdecIn: LPDECIMAL, pui64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI8FromDec')(pdecIn, pui64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui8fromdisp
  public static VarUI8FromDisp(pdispIn: IDispatch, lcid: LCID, pui64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI8FromDisp')(pdispIn, lcid, pui64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui8fromi1
  public static VarUI8FromI1(cIn: CHAR, pui64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI8FromI1')(cIn, pui64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui8fromi2
  public static VarUI8FromI2(sIn: SHORT, pui64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI8FromI2')(sIn, pui64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui8fromi8
  public static VarUI8FromI8(i64In: LONG64, pui64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI8FromI8')(i64In, pui64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui8fromr4
  public static VarUI8FromR4(fltIn: FLOAT, pui64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI8FromR4')(fltIn, pui64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui8fromr8
  public static VarUI8FromR8(dblIn: DOUBLE, pui64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI8FromR8')(dblIn, pui64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui8fromstr
  public static VarUI8FromStr(strIn: LPCOLESTR, lcid: LCID, dwFlags: ULONG, pui64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI8FromStr')(strIn, lcid, dwFlags, pui64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui8fromui1
  public static VarUI8FromUI1(bIn: BYTE, pui64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI8FromUI1')(bIn, pui64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui8fromui2
  public static VarUI8FromUI2(uiIn: USHORT, pui64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI8FromUI2')(uiIn, pui64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varui8fromui4
  public static VarUI8FromUI4(ulIn: ULONG, pui64Out_out: Pointer): HRESULT {
    return Oleaut32.Load('VarUI8FromUI4')(ulIn, pui64Out_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varweekdayname
  public static VarWeekdayName(iWeekday: INT, fAbbrev: INT, iFirstDay: INT, dwFlags: ULONG, pbstrOut_out: LPBSTR): HRESULT {
    return Oleaut32.Load('VarWeekdayName')(iWeekday, fAbbrev, iFirstDay, dwFlags, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-varxor
  public static VarXor(pvarLeft: LPVARIANT, pvarRight: LPVARIANT, pvarResult_out: LPVARIANT): HRESULT {
    return Oleaut32.Load('VarXor')(pvarLeft, pvarRight, pvarResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/oleauto/nf-oleauto-vectorfrombstr
  public static VectorFromBstr(bstr: BSTR, ppsa_out: LPLPSAFEARRAY): HRESULT {
    return Oleaut32.Load('VectorFromBstr')(bstr, ppsa_out);
  }
}

export default Oleaut32;
