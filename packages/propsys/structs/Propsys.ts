import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  BSTR,
  DOUBLE,
  DWORD,
  GETPROPERTYSTOREFLAGS,
  HINSTANCE,
  HRESULT,
  HWND,
  IDelayedPropertyStoreFactory,
  INT,
  IPropertyBag,
  IPropertyDescription,
  IPropertySetStorage,
  IPropertyStore,
  IStream,
  IUnknown,
  LONG,
  LONGLONG,
  LPBOOL,
  LPBSTR,
  LPCLSID,
  LPCWSTR,
  LPDOUBLE,
  LPDWORD,
  LPFILETIME,
  LPGUID,
  LPINT,
  LPLONG,
  LPLONGLONG,
  LPLPBOOL,
  LPLPDOUBLE,
  LPLPFILETIME,
  LPLPLONG,
  LPLPLONGLONG,
  LPLPPWSTR,
  LPLPSERIALIZEDPROPERTYVALUE,
  LPLPSHORT,
  LPLPULONG,
  LPLPULONGLONG,
  LPLPUSHORT,
  LPLPVOID,
  LPLPWSTR,
  LPPCWSTR,
  LPPKA_FLAGS,
  LPPOINTL,
  LPPOINTS,
  LPPROPERTYKEY,
  LPPROPVARIANT,
  LPPWSTR,
  LPRECTL,
  LPSERIALIZEDPROPERTYVALUE,
  LPSHORT,
  LPSTREAM,
  LPSTRRET,
  LPULONG,
  LPULONGLONG,
  LPUNKNOWN,
  LPUSHORT,
  LPVARIANT,
  LPVOID,
  LPWORD,
  LPWSTR,
  OPTIONAL,
  PCUITEMID_CHILD,
  PCUSERIALIZEDPROPSTORAGE,
  PCWSTR,
  PKA_FLAGS,
  PROPDESC_ENUMFILTER,
  PROPDESC_FORMAT_FLAGS,
  PROPVAR_CHANGE_FLAGS,
  PROPVAR_COMPARE_FLAGS,
  PROPVAR_COMPARE_UNIT,
  PSTIME_FLAGS,
  PWSTR,
  REFCLSID,
  REFGUID,
  REFIID,
  REFPROPERTYKEY,
  REFPROPVARIANT,
  REFVARIANT,
  SHORT,
  UINT,
  ULONG,
  ULONGLONG,
  USHORT,
  VARTYPE,
} from '../types/Propsys';

/**
 * Thin, lazy-loaded FFI bindings for `propsys.dll` (Windows Property System).
 *
 * Each static method maps one-to-one with a documented `propsys.dll` export declared
 * in `Symbols`. The first call to a method binds the underlying native symbol via
 * `bun:ffi` and memoizes it on the class; subsequent calls skip binding entirely.
 * For bulk, up-front binding use `Preload`.
 *
 * @example
 * ```ts
 * import Propsys from '@bun-win32/propsys';
 *
 * const key = Buffer.alloc(20); // PROPERTYKEY
 * Propsys.PSGetPropertyKeyFromName(Buffer.from('System.Title\0', 'utf16le').ptr!, key.ptr!);
 * ```
 */
class Propsys extends Win32 {
  protected static override name = 'propsys.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    ClearPropVariantArray: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.void },
    ClearVariantArray: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.void },
    InitPropVariantFromBooleanVector: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromBuffer: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromCLSID: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromDoubleVector: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromFileTime: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromFileTimeVector: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromGUIDAsString: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromInt16Vector: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromInt32Vector: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromInt64Vector: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromPropVariantVectorElem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromResource: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromStrRet: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromStringAsVector: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromStringVector: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromUInt16Vector: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromUInt32Vector: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantFromUInt64Vector: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitPropVariantVectorFromPropVariant: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromBooleanArray: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromBuffer: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromDoubleArray: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromFileTime: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromFileTimeArray: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromGUIDAsString: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromInt16Array: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromInt32Array: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromInt64Array: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromResource: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromStrRet: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromStringArray: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromUInt16Array: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromUInt32Array: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromUInt64Array: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitVariantFromVariantArrayElem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PSCoerceToCanonicalValue: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSCreateAdapterFromPropertyStore: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSCreateDelayedMultiplexPropertyStore: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSCreateMemoryPropertyStore: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSCreateMultiplexPropertyStore: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSCreatePropertyChangeArray: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSCreatePropertyStoreFromObject: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSCreatePropertyStoreFromPropertySetStorage: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSCreateSimplePropertyChange: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSEnumeratePropertyDescriptions: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSFormatForDisplay: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PSFormatForDisplayAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    PSFormatPropertyValue: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    PSGetImageReferenceForValue: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSGetItemPropertyHandler: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSGetItemPropertyHandlerWithCreateObject: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSGetNameFromPropertyKey: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSGetNamedPropertyFromPropertyStorage: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSGetPropertyDescription: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSGetPropertyDescriptionByName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSGetPropertyDescriptionListFromString: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSGetPropertyFromPropertyStorage: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSGetPropertyKeyFromName: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSGetPropertySystem: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSGetPropertyValue: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSLookupPropertyHandlerCLSID: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_Delete: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_ReadBOOL: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_ReadBSTR: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_ReadDWORD: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_ReadGUID: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_ReadInt: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_ReadLONG: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_ReadPOINTL: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_ReadPOINTS: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_ReadPropertyKey: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_ReadRECTL: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_ReadSHORT: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_ReadStr: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    PSPropertyBag_ReadStrAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_ReadStream: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_ReadType: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u16], returns: FFIType.i32 },
    PSPropertyBag_ReadULONGLONG: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_ReadUnknown: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_WriteBOOL: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    PSPropertyBag_WriteBSTR: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_WriteDWORD: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PSPropertyBag_WriteGUID: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_WriteInt: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    PSPropertyBag_WriteLONG: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    PSPropertyBag_WritePOINTL: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_WritePOINTS: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_WritePropertyKey: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_WriteRECTL: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_WriteSHORT: { args: [FFIType.ptr, FFIType.ptr, FFIType.i16], returns: FFIType.i32 },
    PSPropertyBag_WriteStr: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyBag_WriteStream: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    PSPropertyBag_WriteULONGLONG: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    PSPropertyBag_WriteUnknown: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSPropertyKeyFromString: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSRefreshPropertySchema: { args: [], returns: FFIType.i32 },
    PSRegisterPropertySchema: { args: [FFIType.ptr], returns: FFIType.i32 },
    PSSetPropertyValue: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PSStringFromPropertyKey: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PSUnregisterPropertySchema: { args: [FFIType.ptr], returns: FFIType.i32 },
    PropVariantChangeType: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u16], returns: FFIType.i32 },
    PropVariantCompareEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    PropVariantGetBooleanElem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantGetDoubleElem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantGetElementCount: { args: [FFIType.ptr], returns: FFIType.u32 },
    PropVariantGetFileTimeElem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantGetInt16Elem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantGetInt32Elem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantGetInt64Elem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantGetStringElem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantGetUInt16Elem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantGetUInt32Elem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantGetUInt64Elem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToBSTR: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToBoolean: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToBooleanVector: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToBooleanVectorAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToBooleanWithDefault: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    PropVariantToBuffer: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PropVariantToDouble: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToDoubleVector: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToDoubleVectorAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToDoubleWithDefault: { args: [FFIType.ptr, FFIType.f64], returns: FFIType.f64 },
    PropVariantToFileTime: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToFileTimeVector: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToFileTimeVectorAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToGUID: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToInt16: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToInt16Vector: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToInt16VectorAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToInt16WithDefault: { args: [FFIType.ptr, FFIType.i16], returns: FFIType.i16 },
    PropVariantToInt32: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToInt32Vector: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToInt32VectorAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToInt32WithDefault: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    PropVariantToInt64: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToInt64Vector: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToInt64VectorAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToInt64WithDefault: { args: [FFIType.ptr, FFIType.i64], returns: FFIType.i64 },
    PropVariantToStrRet: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToString: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PropVariantToStringAlloc: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToStringVector: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToStringVectorAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToStringWithDefault: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    PropVariantToUInt16: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToUInt16Vector: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToUInt16VectorAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToUInt16WithDefault: { args: [FFIType.ptr, FFIType.u16], returns: FFIType.u16 },
    PropVariantToUInt32: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToUInt32Vector: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToUInt32VectorAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToUInt32WithDefault: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PropVariantToUInt64: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToUInt64Vector: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToUInt64VectorAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToUInt64WithDefault: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.u64 },
    PropVariantToVariant: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantToWinRTPropertyValue: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetPropertyStoreForWindow: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StgDeserializePropVariant: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    StgSerializePropVariant: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantCompare: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantGetBooleanElem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantGetDoubleElem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantGetElementCount: { args: [FFIType.ptr], returns: FFIType.u32 },
    VariantGetInt16Elem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantGetInt32Elem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantGetInt64Elem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantGetStringElem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantGetUInt16Elem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantGetUInt32Elem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantGetUInt64Elem: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantToBoolean: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToBooleanArray: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantToBooleanArrayAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToBooleanWithDefault: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    VariantToBuffer: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    VariantToDosDateTime: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToDouble: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToDoubleArray: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantToDoubleArrayAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToDoubleWithDefault: { args: [FFIType.ptr, FFIType.f64], returns: FFIType.f64 },
    VariantToFileTime: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    VariantToGUID: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToInt16: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToInt16Array: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantToInt16ArrayAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToInt16WithDefault: { args: [FFIType.ptr, FFIType.i16], returns: FFIType.i16 },
    VariantToInt32: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToInt32Array: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantToInt32ArrayAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToInt32WithDefault: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    VariantToInt64: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToInt64Array: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantToInt64ArrayAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToInt64WithDefault: { args: [FFIType.ptr, FFIType.i64], returns: FFIType.i64 },
    VariantToPropVariant: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToStrRet: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToString: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    VariantToStringAlloc: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToStringArray: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantToStringArrayAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToStringWithDefault: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    VariantToUInt16: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToUInt16Array: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantToUInt16ArrayAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToUInt16WithDefault: { args: [FFIType.ptr, FFIType.u16], returns: FFIType.u16 },
    VariantToUInt32: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToUInt32Array: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantToUInt32ArrayAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToUInt32WithDefault: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    VariantToUInt64: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToUInt64Array: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VariantToUInt64ArrayAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VariantToUInt64WithDefault: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.u64 },
    WinRTPropertyValueToPropVariant: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-clearpropvariantarray
  public static ClearPropVariantArray(rgPropVar_in_out: LPPROPVARIANT, cVars: UINT): void {
    return Propsys.Load('ClearPropVariantArray')(rgPropVar_in_out, cVars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-clearvariantarray
  public static ClearVariantArray(pvars_in_out: LPVARIANT, cvars: UINT): void {
    return Propsys.Load('ClearVariantArray')(pvars_in_out, cvars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfrombooleanvector
  public static InitPropVariantFromBooleanVector(prgf: OPTIONAL<LPBOOL>, cElems: ULONG, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromBooleanVector')(prgf, cElems, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfrombuffer
  public static InitPropVariantFromBuffer(pv: LPVOID, cb: UINT, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromBuffer')(pv, cb, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfromclsid
  public static InitPropVariantFromCLSID(clsid: REFCLSID, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromCLSID')(clsid, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfromdoublevector
  public static InitPropVariantFromDoubleVector(prgn: OPTIONAL<LPDOUBLE>, cElems: ULONG, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromDoubleVector')(prgn, cElems, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfromfiletime
  public static InitPropVariantFromFileTime(pftIn: LPFILETIME, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromFileTime')(pftIn, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfromfiletimevector
  public static InitPropVariantFromFileTimeVector(prgft: OPTIONAL<LPFILETIME>, cElems: ULONG, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromFileTimeVector')(prgft, cElems, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfromguidasstring
  public static InitPropVariantFromGUIDAsString(guid: REFGUID, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromGUIDAsString')(guid, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfromint16vector
  public static InitPropVariantFromInt16Vector(prgn: OPTIONAL<LPSHORT>, cElems: ULONG, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromInt16Vector')(prgn, cElems, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfromint32vector
  public static InitPropVariantFromInt32Vector(prgn: OPTIONAL<LPLONG>, cElems: ULONG, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromInt32Vector')(prgn, cElems, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfromint64vector
  public static InitPropVariantFromInt64Vector(prgn: OPTIONAL<LPLONGLONG>, cElems: ULONG, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromInt64Vector')(prgn, cElems, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfrompropvariantvectorelem
  public static InitPropVariantFromPropVariantVectorElem(propvarIn: REFPROPVARIANT, iElem: ULONG, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromPropVariantVectorElem')(propvarIn, iElem, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfromresource
  public static InitPropVariantFromResource(hinst: HINSTANCE, id: UINT, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromResource')(hinst, id, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfromstrret
  public static InitPropVariantFromStrRet(pstrret_in_out: LPSTRRET, pidl: OPTIONAL<PCUITEMID_CHILD>, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromStrRet')(pstrret_in_out, pidl, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfromstringasvector
  public static InitPropVariantFromStringAsVector(psz: OPTIONAL<PCWSTR>, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromStringAsVector')(psz, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfromstringvector
  public static InitPropVariantFromStringVector(prgsz: OPTIONAL<LPPCWSTR>, cElems: ULONG, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromStringVector')(prgsz, cElems, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfromuint16vector
  public static InitPropVariantFromUInt16Vector(prgn: OPTIONAL<LPUSHORT>, cElems: ULONG, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromUInt16Vector')(prgn, cElems, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfromuint32vector
  public static InitPropVariantFromUInt32Vector(prgn: OPTIONAL<LPULONG>, cElems: ULONG, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromUInt32Vector')(prgn, cElems, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantfromuint64vector
  public static InitPropVariantFromUInt64Vector(prgn: OPTIONAL<LPULONGLONG>, cElems: ULONG, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantFromUInt64Vector')(prgn, cElems, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initpropvariantvectorfrompropvariant
  public static InitPropVariantVectorFromPropVariant(propvarSingle: REFPROPVARIANT, ppropvarVector_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('InitPropVariantVectorFromPropVariant')(propvarSingle, ppropvarVector_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfrombooleanarray
  public static InitVariantFromBooleanArray(prgf: LPBOOL, cElems: ULONG, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromBooleanArray')(prgf, cElems, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfrombuffer
  public static InitVariantFromBuffer(pv: LPVOID, cb: UINT, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromBuffer')(pv, cb, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfromdoublearray
  public static InitVariantFromDoubleArray(prgn: LPDOUBLE, cElems: ULONG, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromDoubleArray')(prgn, cElems, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfromfiletime
  public static InitVariantFromFileTime(pft: LPFILETIME, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromFileTime')(pft, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfromfiletimearray
  public static InitVariantFromFileTimeArray(prgft: OPTIONAL<LPFILETIME>, cElems: ULONG, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromFileTimeArray')(prgft, cElems, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfromguidasstring
  public static InitVariantFromGUIDAsString(guid: REFGUID, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromGUIDAsString')(guid, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfromint16array
  public static InitVariantFromInt16Array(prgn: LPSHORT, cElems: ULONG, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromInt16Array')(prgn, cElems, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfromint32array
  public static InitVariantFromInt32Array(prgn: LPLONG, cElems: ULONG, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromInt32Array')(prgn, cElems, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfromint64array
  public static InitVariantFromInt64Array(prgn: LPLONGLONG, cElems: ULONG, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromInt64Array')(prgn, cElems, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfromresource
  public static InitVariantFromResource(hinst: HINSTANCE, id: UINT, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromResource')(hinst, id, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfromstrret
  public static InitVariantFromStrRet(pstrret: LPSTRRET, pidl: PCUITEMID_CHILD, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromStrRet')(pstrret, pidl, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfromstringarray
  public static InitVariantFromStringArray(prgsz: LPPCWSTR, cElems: ULONG, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromStringArray')(prgsz, cElems, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfromuint16array
  public static InitVariantFromUInt16Array(prgn: LPUSHORT, cElems: ULONG, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromUInt16Array')(prgn, cElems, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfromuint32array
  public static InitVariantFromUInt32Array(prgn: LPULONG, cElems: ULONG, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromUInt32Array')(prgn, cElems, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfromuint64array
  public static InitVariantFromUInt64Array(prgn: LPULONGLONG, cElems: ULONG, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromUInt64Array')(prgn, cElems, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-initvariantfromvariantarrayelem
  public static InitVariantFromVariantArrayElem(varIn: REFVARIANT, iElem: ULONG, pvar_out: LPVARIANT): HRESULT {
    return Propsys.Load('InitVariantFromVariantArrayElem')(varIn, iElem, pvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pscoercetocanonicalvalue
  public static PSCoerceToCanonicalValue(key: REFPROPERTYKEY, ppropvar_in_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('PSCoerceToCanonicalValue')(key, ppropvar_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pscreateadapterfrompropertystore
  public static PSCreateAdapterFromPropertyStore(pps: IPropertyStore, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSCreateAdapterFromPropertyStore')(pps, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pscreatedelayedmultiplexpropertystore
  public static PSCreateDelayedMultiplexPropertyStore(flags: GETPROPERTYSTOREFLAGS, pdpsf: IDelayedPropertyStoreFactory, rgStoreIds: LPDWORD, cStores: DWORD, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSCreateDelayedMultiplexPropertyStore')(flags, pdpsf, rgStoreIds, cStores, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pscreatememorypropertystore
  public static PSCreateMemoryPropertyStore(riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSCreateMemoryPropertyStore')(riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pscreatemultiplexpropertystore
  public static PSCreateMultiplexPropertyStore(prgpunkStores: LPUNKNOWN, cStores: DWORD, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSCreateMultiplexPropertyStore')(prgpunkStores, cStores, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pscreatepropertychangearray
  public static PSCreatePropertyChangeArray(rgpropkey: OPTIONAL<LPPROPERTYKEY>, rgflags: OPTIONAL<LPPKA_FLAGS>, rgpropvar: OPTIONAL<LPPROPVARIANT>, cChanges: UINT, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSCreatePropertyChangeArray')(rgpropkey, rgflags, rgpropvar, cChanges, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pscreatepropertystorefromobject
  public static PSCreatePropertyStoreFromObject(punk: IUnknown, grfMode: DWORD, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSCreatePropertyStoreFromObject')(punk, grfMode, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pscreatepropertystorefrompropertysetstorage
  public static PSCreatePropertyStoreFromPropertySetStorage(ppss: IPropertySetStorage, grfMode: DWORD, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSCreatePropertyStoreFromPropertySetStorage')(ppss, grfMode, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pscreatesimplepropertychange
  public static PSCreateSimplePropertyChange(flags: PKA_FLAGS, key: REFPROPERTYKEY, propvar: REFPROPVARIANT, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSCreateSimplePropertyChange')(flags, key, propvar, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psenumeratepropertydescriptions
  public static PSEnumeratePropertyDescriptions(filterOn: PROPDESC_ENUMFILTER, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSEnumeratePropertyDescriptions')(filterOn, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psformatfordisplay
  public static PSFormatForDisplay(propkey: REFPROPERTYKEY, propvar: REFPROPVARIANT, pdfFlags: PROPDESC_FORMAT_FLAGS, pwszText_out: LPWSTR, cchText: DWORD): HRESULT {
    return Propsys.Load('PSFormatForDisplay')(propkey, propvar, pdfFlags, pwszText_out, cchText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psformatfordisplayalloc
  public static PSFormatForDisplayAlloc(key: REFPROPERTYKEY, propvar: REFPROPVARIANT, pdff: PROPDESC_FORMAT_FLAGS, ppszDisplay_out: LPPWSTR): HRESULT {
    return Propsys.Load('PSFormatForDisplayAlloc')(key, propvar, pdff, ppszDisplay_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psformatpropertyvalue
  public static PSFormatPropertyValue(pps: IPropertyStore, ppd: IPropertyDescription, pdff: PROPDESC_FORMAT_FLAGS, ppszDisplay_out: LPLPWSTR): HRESULT {
    return Propsys.Load('PSFormatPropertyValue')(pps, ppd, pdff, ppszDisplay_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psgetimagereferenceforvalue
  public static PSGetImageReferenceForValue(propkey: REFPROPERTYKEY, propvar: REFPROPVARIANT, ppszImageRes_out: LPPWSTR): HRESULT {
    return Propsys.Load('PSGetImageReferenceForValue')(propkey, propvar, ppszImageRes_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psgetitempropertyhandler
  public static PSGetItemPropertyHandler(punkItem: IUnknown, fReadWrite: BOOL, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSGetItemPropertyHandler')(punkItem, fReadWrite, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psgetitempropertyhandlerwithcreateobject
  public static PSGetItemPropertyHandlerWithCreateObject(punkItem: IUnknown, fReadWrite: BOOL, punkCreateObject: IUnknown, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSGetItemPropertyHandlerWithCreateObject')(punkItem, fReadWrite, punkCreateObject, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psgetnamefrompropertykey
  public static PSGetNameFromPropertyKey(propkey: REFPROPERTYKEY, ppszCanonicalName_out: LPPWSTR): HRESULT {
    return Propsys.Load('PSGetNameFromPropertyKey')(propkey, ppszCanonicalName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psgetnamedpropertyfrompropertystorage
  public static PSGetNamedPropertyFromPropertyStorage(psps: PCUSERIALIZEDPROPSTORAGE, cb: DWORD, pszName: LPCWSTR, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('PSGetNamedPropertyFromPropertyStorage')(psps, cb, pszName, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psgetpropertydescription
  public static PSGetPropertyDescription(propkey: REFPROPERTYKEY, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSGetPropertyDescription')(propkey, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psgetpropertydescriptionbyname
  public static PSGetPropertyDescriptionByName(pszCanonicalName: LPCWSTR, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSGetPropertyDescriptionByName')(pszCanonicalName, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psgetpropertydescriptionlistfromstring
  public static PSGetPropertyDescriptionListFromString(pszPropList: LPCWSTR, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSGetPropertyDescriptionListFromString')(pszPropList, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psgetpropertyfrompropertystorage
  public static PSGetPropertyFromPropertyStorage(psps: PCUSERIALIZEDPROPSTORAGE, cb: DWORD, rpkey: REFPROPERTYKEY, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('PSGetPropertyFromPropertyStorage')(psps, cb, rpkey, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psgetpropertykeyfromname
  public static PSGetPropertyKeyFromName(pszName: PCWSTR, ppropkey_out: LPPROPERTYKEY): HRESULT {
    return Propsys.Load('PSGetPropertyKeyFromName')(pszName, ppropkey_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psgetpropertysystem
  public static PSGetPropertySystem(riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSGetPropertySystem')(riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psgetpropertyvalue
  public static PSGetPropertyValue(pps: IPropertyStore, ppd: IPropertyDescription, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('PSGetPropertyValue')(pps, ppd, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pslookuppropertyhandlerclsid
  public static PSLookupPropertyHandlerCLSID(pszFilePath: PCWSTR, pclsid_out: LPCLSID): HRESULT {
    return Propsys.Load('PSLookupPropertyHandlerCLSID')(pszFilePath, pclsid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_delete
  public static PSPropertyBag_Delete(propBag: IPropertyBag, propName: LPCWSTR): HRESULT {
    return Propsys.Load('PSPropertyBag_Delete')(propBag, propName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readbool
  public static PSPropertyBag_ReadBOOL(propBag: IPropertyBag, propName: LPCWSTR, value_out: LPBOOL): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadBOOL')(propBag, propName, value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readbstr
  public static PSPropertyBag_ReadBSTR(propBag: IPropertyBag, propName: LPCWSTR, value_out: LPBSTR): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadBSTR')(propBag, propName, value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readdword
  public static PSPropertyBag_ReadDWORD(propBag: IPropertyBag, propName: LPCWSTR, value_out: LPDWORD): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadDWORD')(propBag, propName, value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readguid
  public static PSPropertyBag_ReadGUID(propBag: IPropertyBag, propName: LPCWSTR, value_out: LPGUID): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadGUID')(propBag, propName, value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readint
  public static PSPropertyBag_ReadInt(propBag: IPropertyBag, propName: LPCWSTR, value_out: LPINT): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadInt')(propBag, propName, value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readlong
  public static PSPropertyBag_ReadLONG(propBag: IPropertyBag, propName: LPCWSTR, value_out: LPLONG): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadLONG')(propBag, propName, value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readpointl
  public static PSPropertyBag_ReadPOINTL(propBag: IPropertyBag, propName: LPCWSTR, value_out: LPPOINTL): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadPOINTL')(propBag, propName, value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readpoints
  public static PSPropertyBag_ReadPOINTS(propBag: IPropertyBag, propName: LPCWSTR, value_out: LPPOINTS): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadPOINTS')(propBag, propName, value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readpropertykey
  public static PSPropertyBag_ReadPropertyKey(propBag: IPropertyBag, propName: LPCWSTR, value_out: LPPROPERTYKEY): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadPropertyKey')(propBag, propName, value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readrectl
  public static PSPropertyBag_ReadRECTL(propBag: IPropertyBag, propName: LPCWSTR, value_out: LPRECTL): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadRECTL')(propBag, propName, value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readshort
  public static PSPropertyBag_ReadSHORT(propBag: IPropertyBag, propName: LPCWSTR, value_out: LPSHORT): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadSHORT')(propBag, propName, value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readstr
  public static PSPropertyBag_ReadStr(propBag: IPropertyBag, propName: LPCWSTR, value_out: LPWSTR, characterCount: INT): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadStr')(propBag, propName, value_out, characterCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readstralloc
  public static PSPropertyBag_ReadStrAlloc(propBag: IPropertyBag, propName: LPCWSTR, value_out: LPPWSTR): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadStrAlloc')(propBag, propName, value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readstream
  public static PSPropertyBag_ReadStream(propBag: IPropertyBag, propName: LPCWSTR, value_out: LPSTREAM): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadStream')(propBag, propName, value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readtype
  public static PSPropertyBag_ReadType(propBag: IPropertyBag, propName: LPCWSTR, var_out: LPVARIANT, type: VARTYPE): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadType')(propBag, propName, var_out, type);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readulonglong
  public static PSPropertyBag_ReadULONGLONG(propBag: IPropertyBag, propName: LPCWSTR, value_out: LPULONGLONG): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadULONGLONG')(propBag, propName, value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_readunknown
  public static PSPropertyBag_ReadUnknown(propBag: IPropertyBag, propName: LPCWSTR, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PSPropertyBag_ReadUnknown')(propBag, propName, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_writebool
  public static PSPropertyBag_WriteBOOL(propBag: IPropertyBag, propName: LPCWSTR, value: BOOL): HRESULT {
    return Propsys.Load('PSPropertyBag_WriteBOOL')(propBag, propName, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_writebstr
  public static PSPropertyBag_WriteBSTR(propBag: IPropertyBag, propName: LPCWSTR, value: BSTR): HRESULT {
    return Propsys.Load('PSPropertyBag_WriteBSTR')(propBag, propName, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_writedword
  public static PSPropertyBag_WriteDWORD(propBag: IPropertyBag, propName: LPCWSTR, value: DWORD): HRESULT {
    return Propsys.Load('PSPropertyBag_WriteDWORD')(propBag, propName, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_writeguid
  public static PSPropertyBag_WriteGUID(propBag: IPropertyBag, propName: LPCWSTR, value: LPGUID): HRESULT {
    return Propsys.Load('PSPropertyBag_WriteGUID')(propBag, propName, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_writeint
  public static PSPropertyBag_WriteInt(propBag: IPropertyBag, propName: LPCWSTR, value: INT): HRESULT {
    return Propsys.Load('PSPropertyBag_WriteInt')(propBag, propName, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_writelong
  public static PSPropertyBag_WriteLONG(propBag: IPropertyBag, propName: LPCWSTR, value: LONG): HRESULT {
    return Propsys.Load('PSPropertyBag_WriteLONG')(propBag, propName, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_writepointl
  public static PSPropertyBag_WritePOINTL(propBag: IPropertyBag, propName: LPCWSTR, value: LPPOINTL): HRESULT {
    return Propsys.Load('PSPropertyBag_WritePOINTL')(propBag, propName, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_writepoints
  public static PSPropertyBag_WritePOINTS(propBag: IPropertyBag, propName: LPCWSTR, value: LPPOINTS): HRESULT {
    return Propsys.Load('PSPropertyBag_WritePOINTS')(propBag, propName, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_writepropertykey
  public static PSPropertyBag_WritePropertyKey(propBag: IPropertyBag, propName: LPCWSTR, value: REFPROPERTYKEY): HRESULT {
    return Propsys.Load('PSPropertyBag_WritePropertyKey')(propBag, propName, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_writerectl
  public static PSPropertyBag_WriteRECTL(propBag: IPropertyBag, propName: LPCWSTR, value: LPRECTL): HRESULT {
    return Propsys.Load('PSPropertyBag_WriteRECTL')(propBag, propName, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_writeshort
  public static PSPropertyBag_WriteSHORT(propBag: IPropertyBag, propName: LPCWSTR, value: SHORT): HRESULT {
    return Propsys.Load('PSPropertyBag_WriteSHORT')(propBag, propName, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_writestr
  public static PSPropertyBag_WriteStr(propBag: IPropertyBag, propName: LPCWSTR, value: LPCWSTR): HRESULT {
    return Propsys.Load('PSPropertyBag_WriteStr')(propBag, propName, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_writestream
  public static PSPropertyBag_WriteStream(propBag: IPropertyBag, propName: LPCWSTR, value: IStream): HRESULT {
    return Propsys.Load('PSPropertyBag_WriteStream')(propBag, propName, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_writeulonglong
  public static PSPropertyBag_WriteULONGLONG(propBag: IPropertyBag, propName: LPCWSTR, value: ULONGLONG): HRESULT {
    return Propsys.Load('PSPropertyBag_WriteULONGLONG')(propBag, propName, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertybag_writeunknown
  public static PSPropertyBag_WriteUnknown(propBag: IPropertyBag, propName: LPCWSTR, punk: IUnknown): HRESULT {
    return Propsys.Load('PSPropertyBag_WriteUnknown')(propBag, propName, punk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pspropertykeyfromstring
  public static PSPropertyKeyFromString(pszString: LPCWSTR, pkey_out: LPPROPERTYKEY): HRESULT {
    return Propsys.Load('PSPropertyKeyFromString')(pszString, pkey_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psrefreshpropertyschema
  public static PSRefreshPropertySchema(): HRESULT {
    return Propsys.Load('PSRefreshPropertySchema')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psregisterpropertyschema
  public static PSRegisterPropertySchema(pszPath: PCWSTR): HRESULT {
    return Propsys.Load('PSRegisterPropertySchema')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-pssetpropertyvalue
  public static PSSetPropertyValue(pps: IPropertyStore, ppd: IPropertyDescription, propvar: REFPROPVARIANT): HRESULT {
    return Propsys.Load('PSSetPropertyValue')(pps, ppd, propvar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psstringfrompropertykey
  public static PSStringFromPropertyKey(pkey: REFPROPERTYKEY, psz_out: LPWSTR, cch: UINT): HRESULT {
    return Propsys.Load('PSStringFromPropertyKey')(pkey, psz_out, cch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-psunregisterpropertyschema
  public static PSUnregisterPropertySchema(pszPath: PCWSTR): HRESULT {
    return Propsys.Load('PSUnregisterPropertySchema')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvariantchangetype
  public static PropVariantChangeType(ppropvarDest_out: LPPROPVARIANT, propvarSrc: REFPROPVARIANT, flags: PROPVAR_CHANGE_FLAGS, vt: VARTYPE): HRESULT {
    return Propsys.Load('PropVariantChangeType')(ppropvarDest_out, propvarSrc, flags, vt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvariantcompareex
  public static PropVariantCompareEx(propvar1: REFPROPVARIANT, propvar2: REFPROPVARIANT, unit: PROPVAR_COMPARE_UNIT, flags: PROPVAR_COMPARE_FLAGS): INT {
    return Propsys.Load('PropVariantCompareEx')(propvar1, propvar2, unit, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvariantgetbooleanelem
  public static PropVariantGetBooleanElem(propvar: REFPROPVARIANT, iElem: ULONG, pfVal_out: LPBOOL): HRESULT {
    return Propsys.Load('PropVariantGetBooleanElem')(propvar, iElem, pfVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvariantgetdoubleelem
  public static PropVariantGetDoubleElem(propvar: REFPROPVARIANT, iElem: ULONG, pnVal_out: LPDOUBLE): HRESULT {
    return Propsys.Load('PropVariantGetDoubleElem')(propvar, iElem, pnVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvariantgetelementcount
  public static PropVariantGetElementCount(propvar: REFPROPVARIANT): ULONG {
    return Propsys.Load('PropVariantGetElementCount')(propvar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvariantgetfiletimeelem
  public static PropVariantGetFileTimeElem(propvar: REFPROPVARIANT, iElem: ULONG, pftVal_out: LPFILETIME): HRESULT {
    return Propsys.Load('PropVariantGetFileTimeElem')(propvar, iElem, pftVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvariantgetint16elem
  public static PropVariantGetInt16Elem(propvar: REFPROPVARIANT, iElem: ULONG, pnVal_out: LPSHORT): HRESULT {
    return Propsys.Load('PropVariantGetInt16Elem')(propvar, iElem, pnVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvariantgetint32elem
  public static PropVariantGetInt32Elem(propvar: REFPROPVARIANT, iElem: ULONG, pnVal_out: LPLONG): HRESULT {
    return Propsys.Load('PropVariantGetInt32Elem')(propvar, iElem, pnVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvariantgetint64elem
  public static PropVariantGetInt64Elem(propvar: REFPROPVARIANT, iElem: ULONG, pnVal_out: LPLONGLONG): HRESULT {
    return Propsys.Load('PropVariantGetInt64Elem')(propvar, iElem, pnVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvariantgetstringelem
  public static PropVariantGetStringElem(propvar: REFPROPVARIANT, iElem: ULONG, ppszVal_out: LPPWSTR): HRESULT {
    return Propsys.Load('PropVariantGetStringElem')(propvar, iElem, ppszVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvariantgetuint16elem
  public static PropVariantGetUInt16Elem(propvar: REFPROPVARIANT, iElem: ULONG, pnVal_out: LPUSHORT): HRESULT {
    return Propsys.Load('PropVariantGetUInt16Elem')(propvar, iElem, pnVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvariantgetuint32elem
  public static PropVariantGetUInt32Elem(propvar: REFPROPVARIANT, iElem: ULONG, pnVal_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantGetUInt32Elem')(propvar, iElem, pnVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvariantgetuint64elem
  public static PropVariantGetUInt64Elem(propvar: REFPROPVARIANT, iElem: ULONG, pnVal_out: LPULONGLONG): HRESULT {
    return Propsys.Load('PropVariantGetUInt64Elem')(propvar, iElem, pnVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttobstr
  public static PropVariantToBSTR(propvar: REFPROPVARIANT, pbstrOut_out: LPBSTR): HRESULT {
    return Propsys.Load('PropVariantToBSTR')(propvar, pbstrOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttoboolean
  public static PropVariantToBoolean(propvarIn: REFPROPVARIANT, pfRet_out: LPBOOL): HRESULT {
    return Propsys.Load('PropVariantToBoolean')(propvarIn, pfRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttobooleanvector
  public static PropVariantToBooleanVector(propvar: REFPROPVARIANT, prgf_out: LPBOOL, crgf: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToBooleanVector')(propvar, prgf_out, crgf, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttobooleanvectoralloc
  public static PropVariantToBooleanVectorAlloc(propvar: REFPROPVARIANT, pprgf_out: LPLPBOOL, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToBooleanVectorAlloc')(propvar, pprgf_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttobooleanwithdefault
  public static PropVariantToBooleanWithDefault(propvarIn: REFPROPVARIANT, fDefault: BOOL): BOOL {
    return Propsys.Load('PropVariantToBooleanWithDefault')(propvarIn, fDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttobuffer
  public static PropVariantToBuffer(propvar: REFPROPVARIANT, pv_out: LPVOID, cb: UINT): HRESULT {
    return Propsys.Load('PropVariantToBuffer')(propvar, pv_out, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttodouble
  public static PropVariantToDouble(propvarIn: REFPROPVARIANT, pdblRet_out: LPDOUBLE): HRESULT {
    return Propsys.Load('PropVariantToDouble')(propvarIn, pdblRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttodoublevector
  public static PropVariantToDoubleVector(propvar: REFPROPVARIANT, prgn_out: LPDOUBLE, crgn: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToDoubleVector')(propvar, prgn_out, crgn, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttodoublevectoralloc
  public static PropVariantToDoubleVectorAlloc(propvar: REFPROPVARIANT, pprgn_out: LPLPDOUBLE, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToDoubleVectorAlloc')(propvar, pprgn_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttodoublewithdefault
  public static PropVariantToDoubleWithDefault(propvarIn: REFPROPVARIANT, dblDefault: DOUBLE): DOUBLE {
    return Propsys.Load('PropVariantToDoubleWithDefault')(propvarIn, dblDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttofiletime
  public static PropVariantToFileTime(propvar: REFPROPVARIANT, pstfOut: PSTIME_FLAGS, pftOut_out: LPFILETIME): HRESULT {
    return Propsys.Load('PropVariantToFileTime')(propvar, pstfOut, pftOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttofiletimevector
  public static PropVariantToFileTimeVector(propvar: REFPROPVARIANT, prgft_out: LPFILETIME, crgft: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToFileTimeVector')(propvar, prgft_out, crgft, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttofiletimevectoralloc
  public static PropVariantToFileTimeVectorAlloc(propvar: REFPROPVARIANT, pprgft_out: LPLPFILETIME, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToFileTimeVectorAlloc')(propvar, pprgft_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttoguid
  public static PropVariantToGUID(propvar: REFPROPVARIANT, pguid_out: LPGUID): HRESULT {
    return Propsys.Load('PropVariantToGUID')(propvar, pguid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttoint16
  public static PropVariantToInt16(propvarIn: REFPROPVARIANT, piRet_out: LPSHORT): HRESULT {
    return Propsys.Load('PropVariantToInt16')(propvarIn, piRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttoint16vector
  public static PropVariantToInt16Vector(propvar: REFPROPVARIANT, prgn_out: LPSHORT, crgn: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToInt16Vector')(propvar, prgn_out, crgn, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttoint16vectoralloc
  public static PropVariantToInt16VectorAlloc(propvar: REFPROPVARIANT, pprgn_out: LPLPSHORT, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToInt16VectorAlloc')(propvar, pprgn_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttoint16withdefault
  public static PropVariantToInt16WithDefault(propvarIn: REFPROPVARIANT, iDefault: SHORT): SHORT {
    return Propsys.Load('PropVariantToInt16WithDefault')(propvarIn, iDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttoint32
  public static PropVariantToInt32(propvarIn: REFPROPVARIANT, plRet_out: LPLONG): HRESULT {
    return Propsys.Load('PropVariantToInt32')(propvarIn, plRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttoint32vector
  public static PropVariantToInt32Vector(propvar: REFPROPVARIANT, prgn_out: LPLONG, crgn: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToInt32Vector')(propvar, prgn_out, crgn, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttoint32vectoralloc
  public static PropVariantToInt32VectorAlloc(propvar: REFPROPVARIANT, pprgn_out: LPLPLONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToInt32VectorAlloc')(propvar, pprgn_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttoint32withdefault
  public static PropVariantToInt32WithDefault(propvarIn: REFPROPVARIANT, lDefault: LONG): LONG {
    return Propsys.Load('PropVariantToInt32WithDefault')(propvarIn, lDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttoint64
  public static PropVariantToInt64(propvarIn: REFPROPVARIANT, pllRet_out: LPLONGLONG): HRESULT {
    return Propsys.Load('PropVariantToInt64')(propvarIn, pllRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttoint64vector
  public static PropVariantToInt64Vector(propvar: REFPROPVARIANT, prgn_out: LPLONGLONG, crgn: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToInt64Vector')(propvar, prgn_out, crgn, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttoint64vectoralloc
  public static PropVariantToInt64VectorAlloc(propvar: REFPROPVARIANT, pprgn_out: LPLPLONGLONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToInt64VectorAlloc')(propvar, pprgn_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttoint64withdefault
  public static PropVariantToInt64WithDefault(propvarIn: REFPROPVARIANT, llDefault: LONGLONG): LONGLONG {
    return Propsys.Load('PropVariantToInt64WithDefault')(propvarIn, llDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttostrret
  public static PropVariantToStrRet(propvar: REFPROPVARIANT, pstrret_out: LPSTRRET): HRESULT {
    return Propsys.Load('PropVariantToStrRet')(propvar, pstrret_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttostring
  public static PropVariantToString(propvar: REFPROPVARIANT, psz_out: PWSTR, cch: UINT): HRESULT {
    return Propsys.Load('PropVariantToString')(propvar, psz_out, cch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttostringalloc
  public static PropVariantToStringAlloc(propvar: REFPROPVARIANT, ppszOut_out: LPPWSTR): HRESULT {
    return Propsys.Load('PropVariantToStringAlloc')(propvar, ppszOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttostringvector
  public static PropVariantToStringVector(propvar: REFPROPVARIANT, prgsz_out: LPPWSTR, crgsz: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToStringVector')(propvar, prgsz_out, crgsz, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttostringvectoralloc
  public static PropVariantToStringVectorAlloc(propvar: REFPROPVARIANT, pprgsz_out: LPLPPWSTR, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToStringVectorAlloc')(propvar, pprgsz_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttostringwithdefault
  public static PropVariantToStringWithDefault(propvarIn: REFPROPVARIANT, pszDefault: OPTIONAL<LPCWSTR>): PCWSTR {
    return Propsys.Load('PropVariantToStringWithDefault')(propvarIn, pszDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttouint16
  public static PropVariantToUInt16(propvarIn: REFPROPVARIANT, puiRet_out: LPUSHORT): HRESULT {
    return Propsys.Load('PropVariantToUInt16')(propvarIn, puiRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttouint16vector
  public static PropVariantToUInt16Vector(propvar: REFPROPVARIANT, prgn_out: LPUSHORT, crgn: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToUInt16Vector')(propvar, prgn_out, crgn, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttouint16vectoralloc
  public static PropVariantToUInt16VectorAlloc(propvar: REFPROPVARIANT, pprgn_out: LPLPUSHORT, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToUInt16VectorAlloc')(propvar, pprgn_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttouint16withdefault
  public static PropVariantToUInt16WithDefault(propvarIn: REFPROPVARIANT, uiDefault: USHORT): USHORT {
    return Propsys.Load('PropVariantToUInt16WithDefault')(propvarIn, uiDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttouint32
  public static PropVariantToUInt32(propvarIn: REFPROPVARIANT, pulRet_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToUInt32')(propvarIn, pulRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttouint32vector
  public static PropVariantToUInt32Vector(propvar: REFPROPVARIANT, prgn_out: LPULONG, crgn: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToUInt32Vector')(propvar, prgn_out, crgn, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttouint32vectoralloc
  public static PropVariantToUInt32VectorAlloc(propvar: REFPROPVARIANT, pprgn_out: LPLPULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToUInt32VectorAlloc')(propvar, pprgn_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttouint32withdefault
  public static PropVariantToUInt32WithDefault(propvarIn: REFPROPVARIANT, ulDefault: ULONG): ULONG {
    return Propsys.Load('PropVariantToUInt32WithDefault')(propvarIn, ulDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttouint64
  public static PropVariantToUInt64(propvarIn: REFPROPVARIANT, pullRet_out: LPULONGLONG): HRESULT {
    return Propsys.Load('PropVariantToUInt64')(propvarIn, pullRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttouint64vector
  public static PropVariantToUInt64Vector(propvar: REFPROPVARIANT, prgn_out: LPULONGLONG, crgn: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToUInt64Vector')(propvar, prgn_out, crgn, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttouint64vectoralloc
  public static PropVariantToUInt64VectorAlloc(propvar: REFPROPVARIANT, pprgn_out: LPLPULONGLONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('PropVariantToUInt64VectorAlloc')(propvar, pprgn_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttouint64withdefault
  public static PropVariantToUInt64WithDefault(propvarIn: REFPROPVARIANT, ullDefault: ULONGLONG): ULONGLONG {
    return Propsys.Load('PropVariantToUInt64WithDefault')(propvarIn, ullDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvarianttovariant
  public static PropVariantToVariant(pPropVar: LPPROPVARIANT, pVar_out: LPVARIANT): HRESULT {
    return Propsys.Load('PropVariantToVariant')(pPropVar, pVar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-propvarianttowinrtpropertyvalue
  public static PropVariantToWinRTPropertyValue(propvar: REFPROPVARIANT, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('PropVariantToWinRTPropertyValue')(propvar, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shgetpropertystoreforwindow
  public static SHGetPropertyStoreForWindow(hwnd: HWND, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Propsys.Load('SHGetPropertyStoreForWindow')(hwnd, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-stgdeserializepropvariant
  public static StgDeserializePropVariant(pprop: LPSERIALIZEDPROPERTYVALUE, cbMax: ULONG, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('StgDeserializePropVariant')(pprop, cbMax, ppropvar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-stgserializepropvariant
  public static StgSerializePropVariant(ppropvar: LPPROPVARIANT, ppProp_out: LPLPSERIALIZEDPROPERTYVALUE, pcb_out: LPULONG): HRESULT {
    return Propsys.Load('StgSerializePropVariant')(ppropvar, ppProp_out, pcb_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-variantcompare
  public static VariantCompare(var1: REFVARIANT, var2: REFVARIANT): INT {
    return Propsys.Load('VariantCompare')(var1, var2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-variantgetbooleanelem
  public static VariantGetBooleanElem(var_: REFVARIANT, iElem: ULONG, pfVal_out: LPBOOL): HRESULT {
    return Propsys.Load('VariantGetBooleanElem')(var_, iElem, pfVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-variantgetdoubleelem
  public static VariantGetDoubleElem(var_: REFVARIANT, iElem: ULONG, pnVal_out: LPDOUBLE): HRESULT {
    return Propsys.Load('VariantGetDoubleElem')(var_, iElem, pnVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-variantgetelementcount
  public static VariantGetElementCount(varIn: REFVARIANT): ULONG {
    return Propsys.Load('VariantGetElementCount')(varIn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-variantgetint16elem
  public static VariantGetInt16Elem(var_: REFVARIANT, iElem: ULONG, pnVal_out: LPSHORT): HRESULT {
    return Propsys.Load('VariantGetInt16Elem')(var_, iElem, pnVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-variantgetint32elem
  public static VariantGetInt32Elem(var_: REFVARIANT, iElem: ULONG, pnVal_out: LPLONG): HRESULT {
    return Propsys.Load('VariantGetInt32Elem')(var_, iElem, pnVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-variantgetint64elem
  public static VariantGetInt64Elem(var_: REFVARIANT, iElem: ULONG, pnVal_out: LPLONGLONG): HRESULT {
    return Propsys.Load('VariantGetInt64Elem')(var_, iElem, pnVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-variantgetstringelem
  public static VariantGetStringElem(var_: REFVARIANT, iElem: ULONG, ppszVal_out: LPPWSTR): HRESULT {
    return Propsys.Load('VariantGetStringElem')(var_, iElem, ppszVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-variantgetuint16elem
  public static VariantGetUInt16Elem(var_: REFVARIANT, iElem: ULONG, pnVal_out: LPUSHORT): HRESULT {
    return Propsys.Load('VariantGetUInt16Elem')(var_, iElem, pnVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-variantgetuint32elem
  public static VariantGetUInt32Elem(var_: REFVARIANT, iElem: ULONG, pnVal_out: LPULONG): HRESULT {
    return Propsys.Load('VariantGetUInt32Elem')(var_, iElem, pnVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-variantgetuint64elem
  public static VariantGetUInt64Elem(var_: REFVARIANT, iElem: ULONG, pnVal_out: LPULONGLONG): HRESULT {
    return Propsys.Load('VariantGetUInt64Elem')(var_, iElem, pnVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttoboolean
  public static VariantToBoolean(varIn: REFVARIANT, pfRet_out: LPBOOL): HRESULT {
    return Propsys.Load('VariantToBoolean')(varIn, pfRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttobooleanarray
  public static VariantToBooleanArray(var_: REFVARIANT, prgf_out: LPBOOL, crgn: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToBooleanArray')(var_, prgf_out, crgn, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttobooleanarrayalloc
  public static VariantToBooleanArrayAlloc(var_: REFVARIANT, pprgf_out: LPLPBOOL, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToBooleanArrayAlloc')(var_, pprgf_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttobooleanwithdefault
  public static VariantToBooleanWithDefault(varIn: REFVARIANT, fDefault: BOOL): BOOL {
    return Propsys.Load('VariantToBooleanWithDefault')(varIn, fDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttobuffer
  public static VariantToBuffer(varIn: REFVARIANT, pv_out: LPVOID, cb: UINT): HRESULT {
    return Propsys.Load('VariantToBuffer')(varIn, pv_out, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttodosdatetime
  public static VariantToDosDateTime(varIn: REFVARIANT, pwDate_out: LPWORD, pwTime_out: LPWORD): HRESULT {
    return Propsys.Load('VariantToDosDateTime')(varIn, pwDate_out, pwTime_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttodouble
  public static VariantToDouble(varIn: REFVARIANT, pdblRet_out: LPDOUBLE): HRESULT {
    return Propsys.Load('VariantToDouble')(varIn, pdblRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttodoublearray
  public static VariantToDoubleArray(var_: REFVARIANT, prgn_out: LPDOUBLE, crgn: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToDoubleArray')(var_, prgn_out, crgn, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttodoublearrayalloc
  public static VariantToDoubleArrayAlloc(var_: REFVARIANT, pprgn_out: LPLPDOUBLE, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToDoubleArrayAlloc')(var_, pprgn_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttodoublewithdefault
  public static VariantToDoubleWithDefault(varIn: REFVARIANT, dblDefault: DOUBLE): DOUBLE {
    return Propsys.Load('VariantToDoubleWithDefault')(varIn, dblDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttofiletime
  public static VariantToFileTime(varIn: REFVARIANT, stfOut: PSTIME_FLAGS, pftOut_out: LPFILETIME): HRESULT {
    return Propsys.Load('VariantToFileTime')(varIn, stfOut, pftOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttoguid
  public static VariantToGUID(varIn: REFVARIANT, pguid_out: LPGUID): HRESULT {
    return Propsys.Load('VariantToGUID')(varIn, pguid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttoint16
  public static VariantToInt16(varIn: REFVARIANT, piRet_out: LPSHORT): HRESULT {
    return Propsys.Load('VariantToInt16')(varIn, piRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttoint16array
  public static VariantToInt16Array(var_: REFVARIANT, prgn_out: LPSHORT, crgn: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToInt16Array')(var_, prgn_out, crgn, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttoint16arrayalloc
  public static VariantToInt16ArrayAlloc(var_: REFVARIANT, pprgn_out: LPLPSHORT, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToInt16ArrayAlloc')(var_, pprgn_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttoint16withdefault
  public static VariantToInt16WithDefault(varIn: REFVARIANT, iDefault: SHORT): SHORT {
    return Propsys.Load('VariantToInt16WithDefault')(varIn, iDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttoint32
  public static VariantToInt32(varIn: REFVARIANT, plRet_out: LPLONG): HRESULT {
    return Propsys.Load('VariantToInt32')(varIn, plRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttoint32array
  public static VariantToInt32Array(var_: REFVARIANT, prgn_out: LPLONG, crgn: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToInt32Array')(var_, prgn_out, crgn, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttoint32arrayalloc
  public static VariantToInt32ArrayAlloc(var_: REFVARIANT, pprgn_out: LPLPLONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToInt32ArrayAlloc')(var_, pprgn_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttoint32withdefault
  public static VariantToInt32WithDefault(varIn: REFVARIANT, lDefault: LONG): LONG {
    return Propsys.Load('VariantToInt32WithDefault')(varIn, lDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttoint64
  public static VariantToInt64(varIn: REFVARIANT, pllRet_out: LPLONGLONG): HRESULT {
    return Propsys.Load('VariantToInt64')(varIn, pllRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttoint64array
  public static VariantToInt64Array(var_: REFVARIANT, prgn_out: LPLONGLONG, crgn: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToInt64Array')(var_, prgn_out, crgn, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttoint64arrayalloc
  public static VariantToInt64ArrayAlloc(var_: REFVARIANT, pprgn_out: LPLPLONGLONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToInt64ArrayAlloc')(var_, pprgn_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttoint64withdefault
  public static VariantToInt64WithDefault(varIn: REFVARIANT, llDefault: LONGLONG): LONGLONG {
    return Propsys.Load('VariantToInt64WithDefault')(varIn, llDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttopropvariant
  public static VariantToPropVariant(pVar: LPVARIANT, pPropVar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('VariantToPropVariant')(pVar, pPropVar_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttostrret
  public static VariantToStrRet(varIn: REFVARIANT, pstrret_out: LPSTRRET): HRESULT {
    return Propsys.Load('VariantToStrRet')(varIn, pstrret_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttostring
  public static VariantToString(varIn: REFVARIANT, pszBuf_out: PWSTR, cchBuf: UINT): HRESULT {
    return Propsys.Load('VariantToString')(varIn, pszBuf_out, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttostringalloc
  public static VariantToStringAlloc(varIn: REFVARIANT, ppszBuf_out: LPPWSTR): HRESULT {
    return Propsys.Load('VariantToStringAlloc')(varIn, ppszBuf_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttostringarray
  public static VariantToStringArray(var_: REFVARIANT, prgsz_out: LPPWSTR, crgsz: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToStringArray')(var_, prgsz_out, crgsz, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttostringarrayalloc
  public static VariantToStringArrayAlloc(var_: REFVARIANT, pprgsz_out: LPLPPWSTR, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToStringArrayAlloc')(var_, pprgsz_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttostringwithdefault
  public static VariantToStringWithDefault(varIn: REFVARIANT, pszDefault: OPTIONAL<LPCWSTR>): PCWSTR {
    return Propsys.Load('VariantToStringWithDefault')(varIn, pszDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttouint16
  public static VariantToUInt16(varIn: REFVARIANT, puiRet_out: LPUSHORT): HRESULT {
    return Propsys.Load('VariantToUInt16')(varIn, puiRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttouint16array
  public static VariantToUInt16Array(var_: REFVARIANT, prgn_out: LPUSHORT, crgn: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToUInt16Array')(var_, prgn_out, crgn, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttouint16arrayalloc
  public static VariantToUInt16ArrayAlloc(var_: REFVARIANT, pprgn_out: LPLPUSHORT, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToUInt16ArrayAlloc')(var_, pprgn_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttouint16withdefault
  public static VariantToUInt16WithDefault(varIn: REFVARIANT, uiDefault: USHORT): USHORT {
    return Propsys.Load('VariantToUInt16WithDefault')(varIn, uiDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttouint32
  public static VariantToUInt32(varIn: REFVARIANT, pulRet_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToUInt32')(varIn, pulRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttouint32array
  public static VariantToUInt32Array(var_: REFVARIANT, prgn_out: LPULONG, crgn: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToUInt32Array')(var_, prgn_out, crgn, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttouint32arrayalloc
  public static VariantToUInt32ArrayAlloc(var_: REFVARIANT, pprgn_out: LPLPULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToUInt32ArrayAlloc')(var_, pprgn_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttouint32withdefault
  public static VariantToUInt32WithDefault(varIn: REFVARIANT, ulDefault: ULONG): ULONG {
    return Propsys.Load('VariantToUInt32WithDefault')(varIn, ulDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttouint64
  public static VariantToUInt64(varIn: REFVARIANT, pullRet_out: LPULONGLONG): HRESULT {
    return Propsys.Load('VariantToUInt64')(varIn, pullRet_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttouint64array
  public static VariantToUInt64Array(var_: REFVARIANT, prgn_out: LPULONGLONG, crgn: ULONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToUInt64Array')(var_, prgn_out, crgn, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttouint64arrayalloc
  public static VariantToUInt64ArrayAlloc(var_: REFVARIANT, pprgn_out: LPLPULONGLONG, pcElem_out: LPULONG): HRESULT {
    return Propsys.Load('VariantToUInt64ArrayAlloc')(var_, pprgn_out, pcElem_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-varianttouint64withdefault
  public static VariantToUInt64WithDefault(varIn: REFVARIANT, ullDefault: ULONGLONG): ULONGLONG {
    return Propsys.Load('VariantToUInt64WithDefault')(varIn, ullDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-winrtpropertyvaluetopropvariant
  public static WinRTPropertyValueToPropVariant(punkPropertyValue: OPTIONAL<IUnknown>, ppropvar_out: LPPROPVARIANT): HRESULT {
    return Propsys.Load('WinRTPropertyValueToPropVariant')(punkPropertyValue, ppropvar_out);
  }
}

export default Propsys;
