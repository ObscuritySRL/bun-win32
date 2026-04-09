import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  BIND_OPTS,
  BOOLEAN,
  BYTE,
  CLIPFORMAT,
  CLSID,
  DWORD,
  DVTARGETDEVICE,
  FILETIME,
  FMTID,
  HACCEL,
  HANDLE,
  HDC,
  HGLOBAL,
  HICON,
  HINSTANCE,
  HMENU,
  HOLEMENU,
  HRESULT,
  HWND,
  IAdviseSink,
  IFillLockBytes,
  ILockBytes,
  INT,
  LONG,
  LPBC,
  LPCLASSFACTORY,
  IStorage,
  LPDATAOBJECT,
  LPDWORD,
  LPFORMATETC,
  LPCLSID,
  LPCOLESTR,
  LPCRECT,
  LPCWSTR,
  LPDROPSOURCE,
  LPDROPTARGET,
  LPLONG,
  LPLOCKBYTES,
  LPLPVOID,
  LPMESSAGEFILTER,
  LPMONIKER,
  LPMSG,
  LPOLECLIENTSITE,
  LPOLEINPLACEACTIVEOBJECT,
  LPOLEINPLACEFRAME,
  LPOLEINPLACEFRAMEINFO,
  LPOLEMENUGROUPWIDTHS,
  LPOLEOBJECT,
  LPOLESTR,
  LPOLESTREAM,
  LPPERSISTSTORAGE,
  LPPERSISTSTREAM,
  LPSTGMEDIUM,
  LPSTORAGE,
  LPSTREAM,
  LPUNKNOWN,
  LPVOID,
  LPWORD,
  LPWSTR,
  NULL,
  PHGLOBAL,
  PMemoryAllocator,
  PPBC,
  PPDATAADVISEHOLDER,
  PPDATAOBJECT,
  PPENUMFORMATETC,
  PPENUMOLEVERB,
  PPIFillLockBytes,
  PPLOCKBYTES,
  PPMESSAGEFILTER,
  PPMONIKER,
  PPOLEADVISEHOLDER,
  PPOLESTR,
  PPIPropertySetStorage,
  PPIPropertyStorage,
  PPIStorage,
  PPRUNNINGOBJECTTABLE,
  PPVOID,
  PPWSTR,
  PSECURITY_DESCRIPTOR,
  PROPID,
  PROPVARIANT,
  PROPVAR_CHANGE_FLAGS,
  PULONG,
  QUERYCONTEXT,
  REFCLSID,
  REFFMTID,
  REFGUID,
  REFIID,
  REFPROPVARIANT,
  SERIALIZEDPROPERTYVALUE,
  SNB,
  STGOPTIONS,
  UINT,
  ULONG,
  USHORT,
  uCLSSPEC,
  VARTYPE,
  WORD,
} from '../types/Ole32';

/**
 * Thin, lazy-loaded FFI bindings for `ole32.dll`.
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
 * import Ole32 from './structs/Ole32';
 *
 * const comVersion = Ole32.CoBuildVersion();
 * const oleVersion = Ole32.OleBuildVersion();
 * ```
 */
class Ole32 extends Win32 {
  protected static override readonly name = 'ole32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    BindMoniker: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CoAllowSetForegroundWindow: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CoBuildVersion: { args: [], returns: FFIType.u32 },
    CoDosDateTimeToFileTime: { args: [FFIType.u16, FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    CoFileTimeToDosDateTime: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CoFreeAllLibraries: { args: [], returns: FFIType.void },
    CoFreeLibrary: { args: [FFIType.u64], returns: FFIType.void },
    CoGetInterceptor: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CoGetObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CoInitialize: { args: [FFIType.ptr], returns: FFIType.i32 },
    CoInstall: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CoLoadLibrary: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    CoRegisterMessageFilter: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CoTaskMemFree: { args: [FFIType.ptr], returns: FFIType.void },
    CreateAntiMoniker: { args: [FFIType.ptr], returns: FFIType.i32 },
    CreateBindCtx: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CreateClassMoniker: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateDataAdviseHolder: { args: [FFIType.ptr], returns: FFIType.i32 },
    CreateDataCache: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateFileMoniker: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateGenericComposite: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateILockBytesOnHGlobal: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    CreateItemMoniker: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateObjrefMoniker: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateOleAdviseHolder: { args: [FFIType.ptr], returns: FFIType.i32 },
    CreatePointerMoniker: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllRegisterServer: { args: [], returns: FFIType.i32 },
    DoDragDrop: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FmtIdToPropStgName: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetClassFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetConvertStg: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetHGlobalFromILockBytes: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetRunningObjectTable: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    IsAccelerator: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IsEqualGUID: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MkParseDisplayName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MonikerCommonPrefixWith: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MonikerRelativePathTo: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    OleBuildVersion: { args: [], returns: FFIType.u32 },
    OleConvertIStorageToOLESTREAM: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleConvertIStorageToOLESTREAMEx: { args: [FFIType.ptr, FFIType.u16, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleConvertOLESTREAMToIStorage: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleConvertOLESTREAMToIStorageEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreate: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreateDefaultHandler: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreateEmbeddingHelper: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreateEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreateFromData: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreateFromDataEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreateFromFile: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreateFromFileEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreateLink: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreateLinkEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreateLinkFromData: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreateLinkFromDataEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreateLinkToFile: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreateLinkToFileEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleCreateMenuDescriptor: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    OleCreateStaticFromData: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleDestroyMenuDescriptor: { args: [FFIType.u64], returns: FFIType.i32 },
    OleDoAutoConvert: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleDraw: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    OleDuplicateData: { args: [FFIType.u64, FFIType.u16, FFIType.u32], returns: FFIType.u64 },
    OleFlushClipboard: { args: [], returns: FFIType.i32 },
    OleGetAutoConvert: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleGetClipboard: { args: [FFIType.ptr], returns: FFIType.i32 },
    OleGetClipboardWithEnterpriseInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleGetIconOfClass: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    OleGetIconOfFile: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    OleInitialize: { args: [FFIType.ptr], returns: FFIType.i32 },
    OleIsCurrentClipboard: { args: [FFIType.ptr], returns: FFIType.i32 },
    OleIsRunning: { args: [FFIType.ptr], returns: FFIType.i32 },
    OleLoad: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleLoadFromStream: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleLockRunning: { args: [FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    OleMetafilePictFromIconAndLabel: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    OleNoteObjectVisible: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    OleQueryCreateFromData: { args: [FFIType.ptr], returns: FFIType.i32 },
    OleQueryLinkFromData: { args: [FFIType.ptr], returns: FFIType.i32 },
    OleRegEnumFormatEtc: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    OleRegEnumVerbs: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleRegGetMiscStatus: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    OleRegGetUserType: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    OleRun: { args: [FFIType.ptr], returns: FFIType.i32 },
    OleSave: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    OleSaveToStream: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleSetAutoConvert: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleSetClipboard: { args: [FFIType.ptr], returns: FFIType.i32 },
    OleSetContainedObject: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    OleSetMenuDescriptor: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleTranslateAccelerator: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OleUninitialize: { args: [], returns: FFIType.void },
    PropStgNameToFmtId: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PropVariantChangeType: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u16], returns: FFIType.i32 },
    ReadClassStg: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReadClassStm: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReadFmtUserTypeStg: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReleaseStgMedium: { args: [FFIType.ptr], returns: FFIType.void },
    SetConvertStg: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    StgConvertPropertyToVariant: { args: [FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    StgConvertVariantToProperty: { args: [FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u8, FFIType.ptr], returns: FFIType.ptr },
    StgCreateDocfile: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    StgCreateDocfileOnILockBytes: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    StgCreatePropSetStg: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    StgCreatePropStg: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    StgCreateStorageEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StgGetIFillLockBytesOnFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StgGetIFillLockBytesOnILockBytes: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StgIsStorageFile: { args: [FFIType.ptr], returns: FFIType.i32 },
    StgIsStorageILockBytes: { args: [FFIType.ptr], returns: FFIType.i32 },
    StgOpenAsyncDocfileOnIFillLockBytes: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    StgOpenPropStg: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    StgOpenStorage: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    StgOpenStorageEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StgOpenStorageOnILockBytes: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    StgPropertyLengthAsVariant: { args: [FFIType.ptr, FFIType.u32, FFIType.u16, FFIType.u8], returns: FFIType.u32 },
    StgSetTimes: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WriteClassStg: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WriteClassStm: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WriteFmtUserTypeStg: { args: [FFIType.ptr, FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-bindmoniker
  public static BindMoniker(pmk: LPMONIKER, grfOpt: DWORD, iidResult: REFIID, ppvResult: LPLPVOID): HRESULT {
    return Ole32.Load('BindMoniker')(pmk, grfOpt, iidResult, ppvResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-coallowsetforegroundwindow
  public static CoAllowSetForegroundWindow(pUnk: LPUNKNOWN, lpvReserved: LPVOID | NULL): HRESULT {
    return Ole32.Load('CoAllowSetForegroundWindow')(pUnk, lpvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-cobuildversion
  public static CoBuildVersion(): DWORD {
    return Ole32.Load('CoBuildVersion')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-codosdatetimetofiletime
  public static CoDosDateTimeToFileTime(nDosDate: WORD, nDosTime: WORD, lpFileTime: FILETIME): BOOL {
    return Ole32.Load('CoDosDateTimeToFileTime')(nDosDate, nDosTime, lpFileTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-cofiletimetodosdatetime
  public static CoFileTimeToDosDateTime(lpFileTime: FILETIME, lpDosDate: LPWORD, lpDosTime: LPWORD): BOOL {
    return Ole32.Load('CoFileTimeToDosDateTime')(lpFileTime, lpDosDate, lpDosTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-cofreealllibraries
  public static CoFreeAllLibraries(): void {
    return Ole32.Load('CoFreeAllLibraries')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-cofreelibrary
  public static CoFreeLibrary(hInst: HINSTANCE): void {
    return Ole32.Load('CoFreeLibrary')(hInst);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/callobj/nf-callobj-cogetinterceptor
  public static CoGetInterceptor(iidIntercepted: REFIID, punkOuter: LPUNKNOWN, iid: REFIID, ppv: LPLPVOID): HRESULT {
    return Ole32.Load('CoGetInterceptor')(iidIntercepted, punkOuter, iid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-cogetobject
  public static CoGetObject(pszName: LPCWSTR, pBindOptions: BIND_OPTS | NULL, riid: REFIID, ppv: LPLPVOID): HRESULT {
    return Ole32.Load('CoGetObject')(pszName, pBindOptions, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-coinitialize
  public static CoInitialize(pvReserved: LPVOID | NULL): HRESULT {
    return Ole32.Load('CoInitialize')(pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-coinstall
  public static CoInstall(pbc: LPBC, dwFlags: DWORD, pClassSpec: uCLSSPEC, pQuery: QUERYCONTEXT, pszCodeBase: LPWSTR): HRESULT {
    return Ole32.Load('CoInstall')(pbc, dwFlags, pClassSpec, pQuery, pszCodeBase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-coloadlibrary
  public static CoLoadLibrary(lpszLibName: LPOLESTR, bAutoFree: BOOL): HINSTANCE {
    return Ole32.Load('CoLoadLibrary')(lpszLibName, bAutoFree);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-coregistermessagefilter
  public static CoRegisterMessageFilter(lpMessageFilter: LPMESSAGEFILTER | NULL, lplpMessageFilter: PPMESSAGEFILTER | NULL): HRESULT {
    return Ole32.Load('CoRegisterMessageFilter')(lpMessageFilter, lplpMessageFilter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-cotaskmemfree
  public static CoTaskMemFree(pv: LPVOID | NULL): void {
    return Ole32.Load('CoTaskMemFree')(pv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-createantimoniker
  public static CreateAntiMoniker(ppmk: PPMONIKER): HRESULT {
    return Ole32.Load('CreateAntiMoniker')(ppmk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-createbindctx
  public static CreateBindCtx(reserved: DWORD, ppbc: PPBC): HRESULT {
    return Ole32.Load('CreateBindCtx')(reserved, ppbc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-createclassmoniker
  public static CreateClassMoniker(rclsid: REFCLSID, ppmk: PPMONIKER): HRESULT {
    return Ole32.Load('CreateClassMoniker')(rclsid, ppmk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-createdataadviseholder
  public static CreateDataAdviseHolder(ppDAHolder: PPDATAADVISEHOLDER): HRESULT {
    return Ole32.Load('CreateDataAdviseHolder')(ppDAHolder);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-createdatacache
  public static CreateDataCache(pUnkOuter: LPUNKNOWN | NULL, rclsid: REFCLSID, iid: REFIID, ppv: LPLPVOID): HRESULT {
    return Ole32.Load('CreateDataCache')(pUnkOuter, rclsid, iid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-createfilemoniker
  public static CreateFileMoniker(lpszPathName: LPCOLESTR, ppmk: PPMONIKER): HRESULT {
    return Ole32.Load('CreateFileMoniker')(lpszPathName, ppmk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-creategenericcomposite
  public static CreateGenericComposite(pmkFirst: LPMONIKER | NULL, pmkRest: LPMONIKER | NULL, ppmkComposite: PPMONIKER): HRESULT {
    return Ole32.Load('CreateGenericComposite')(pmkFirst, pmkRest, ppmkComposite);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-createilockbytesonhglobal
  public static CreateILockBytesOnHGlobal(hGlobal: HGLOBAL | 0n, fDeleteOnRelease: BOOL, pplkbyt: PPLOCKBYTES): HRESULT {
    return Ole32.Load('CreateILockBytesOnHGlobal')(hGlobal, fDeleteOnRelease, pplkbyt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-createitemmoniker
  public static CreateItemMoniker(lpszDelim: LPCOLESTR, lpszItem: LPCOLESTR, ppmk: PPMONIKER): HRESULT {
    return Ole32.Load('CreateItemMoniker')(lpszDelim, lpszItem, ppmk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-createobjrefmoniker
  public static CreateObjrefMoniker(punk: LPUNKNOWN | NULL, ppmk: PPMONIKER): HRESULT {
    return Ole32.Load('CreateObjrefMoniker')(punk, ppmk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-createoleadviseholder
  public static CreateOleAdviseHolder(ppOAHolder: PPOLEADVISEHOLDER): HRESULT {
    return Ole32.Load('CreateOleAdviseHolder')(ppOAHolder);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-createpointermoniker
  public static CreatePointerMoniker(punk: LPUNKNOWN | NULL, ppmk: PPMONIKER): HRESULT {
    return Ole32.Load('CreatePointerMoniker')(punk, ppmk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv: LPLPVOID): HRESULT {
    return Ole32.Load('DllGetClassObject')(rclsid, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllregisterserver
  public static DllRegisterServer(): HRESULT {
    return Ole32.Load('DllRegisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-dodragdrop
  public static DoDragDrop(pDataObj: LPDATAOBJECT, pDropSource: LPDROPSOURCE, dwOKEffects: DWORD, pdwEffect: LPDWORD): HRESULT {
    return Ole32.Load('DoDragDrop')(pDataObj, pDropSource, dwOKEffects, pdwEffect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-fmtidtopropstgname
  public static FmtIdToPropStgName(pfmtid: FMTID, oszName: LPOLESTR): HRESULT {
    return Ole32.Load('FmtIdToPropStgName')(pfmtid, oszName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-getclassfile
  public static GetClassFile(szFilename: LPCOLESTR, pclsid: CLSID): HRESULT {
    return Ole32.Load('GetClassFile')(szFilename, pclsid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-getconvertstg
  public static GetConvertStg(pStg: LPSTORAGE): HRESULT {
    return Ole32.Load('GetConvertStg')(pStg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-gethglobalfromilockbytes
  public static GetHGlobalFromILockBytes(plkbyt: LPLOCKBYTES, phglobal: PHGLOBAL): HRESULT {
    return Ole32.Load('GetHGlobalFromILockBytes')(plkbyt, phglobal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-getrunningobjecttable
  public static GetRunningObjectTable(reserved: DWORD, pprot: PPRUNNINGOBJECTTABLE): HRESULT {
    return Ole32.Load('GetRunningObjectTable')(reserved, pprot);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-isaccelerator
  public static IsAccelerator(hAccel: HACCEL, cAccelEntries: INT, lpMsg: LPMSG, lpwCmd: LPWORD): BOOL {
    return Ole32.Load('IsAccelerator')(hAccel, cAccelEntries, lpMsg, lpwCmd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/guiddef/nf-guiddef-isequalguid
  public static IsEqualGUID(rguid1: REFGUID, rguid2: REFGUID): BOOL {
    return Ole32.Load('IsEqualGUID')(rguid1, rguid2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-mkparsedisplayname
  public static MkParseDisplayName(pbc: LPBC, szUserName: LPCOLESTR, pchEaten: PULONG, ppmk: PPMONIKER): HRESULT {
    return Ole32.Load('MkParseDisplayName')(pbc, szUserName, pchEaten, ppmk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-monikercommonprefixwith
  public static MonikerCommonPrefixWith(pmkThis: LPMONIKER, pmkOther: LPMONIKER, ppmkCommon: PPMONIKER): HRESULT {
    return Ole32.Load('MonikerCommonPrefixWith')(pmkThis, pmkOther, ppmkCommon);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-monikerrelativepathto
  public static MonikerRelativePathTo(pmkSrc: LPMONIKER, pmkDest: LPMONIKER, ppmkRelPath: PPMONIKER, dwReserved: BOOL): HRESULT {
    return Ole32.Load('MonikerRelativePathTo')(pmkSrc, pmkDest, ppmkRelPath, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olebuildversion
  public static OleBuildVersion(): DWORD {
    return Ole32.Load('OleBuildVersion')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oleconvertistoragetoolestream
  public static OleConvertIStorageToOLESTREAM(pstg: LPSTORAGE, lpolestream: LPOLESTREAM): HRESULT {
    return Ole32.Load('OleConvertIStorageToOLESTREAM')(pstg, lpolestream);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oleconvertistoragetoolestreamex
  public static OleConvertIStorageToOLESTREAMEx(pstg: LPSTORAGE, cfFormat: CLIPFORMAT, lWidth: LONG, lHeight: LONG, dwSize: DWORD, pmedium: LPSTGMEDIUM, polestm: LPOLESTREAM): HRESULT {
    return Ole32.Load('OleConvertIStorageToOLESTREAMEx')(pstg, cfFormat, lWidth, lHeight, dwSize, pmedium, polestm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oleconvertolestreamtoistorage
  public static OleConvertOLESTREAMToIStorage(lpolestream: LPOLESTREAM, pstg: LPSTORAGE, ptd: DVTARGETDEVICE): HRESULT {
    return Ole32.Load('OleConvertOLESTREAMToIStorage')(lpolestream, pstg, ptd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oleconvertolestreamtoistorageex
  public static OleConvertOLESTREAMToIStorageEx(polestm: LPOLESTREAM, pstg: LPSTORAGE, pcfFormat: LPWORD, plwWidth: LPLONG, plHeight: LPLONG, pdwSize: LPDWORD, pmedium: LPSTGMEDIUM): HRESULT {
    return Ole32.Load('OleConvertOLESTREAMToIStorageEx')(polestm, pstg, pcfFormat, plwWidth, plHeight, pdwSize, pmedium);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreate
  public static OleCreate(rclsid: REFCLSID, riid: REFIID, renderopt: DWORD, pFormatEtc: LPFORMATETC, pClientSite: LPOLECLIENTSITE, pStg: LPSTORAGE, ppvObj: LPLPVOID): HRESULT {
    return Ole32.Load('OleCreate')(rclsid, riid, renderopt, pFormatEtc, pClientSite, pStg, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreatedefaulthandler
  public static OleCreateDefaultHandler(clsid: REFCLSID, pUnkOuter: LPUNKNOWN, riid: REFIID, lplpObj: LPLPVOID): HRESULT {
    return Ole32.Load('OleCreateDefaultHandler')(clsid, pUnkOuter, riid, lplpObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreateembeddinghelper
  public static OleCreateEmbeddingHelper(clsid: REFCLSID, pUnkOuter: LPUNKNOWN, flags: DWORD, pCF: LPCLASSFACTORY, riid: REFIID, lplpObj: LPLPVOID): HRESULT {
    return Ole32.Load('OleCreateEmbeddingHelper')(clsid, pUnkOuter, flags, pCF, riid, lplpObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreateex
  public static OleCreateEx(
    rclsid: REFCLSID,
    riid: REFIID,
    dwFlags: DWORD,
    renderopt: DWORD,
    cFormats: ULONG,
    rgAdvf: LPDWORD,
    rgFormatEtc: LPFORMATETC,
    lpAdviseSink: IAdviseSink,
    rgdwConnection: LPDWORD,
    pClientSite: LPOLECLIENTSITE,
    pStg: LPSTORAGE,
    ppvObj: LPLPVOID,
  ): HRESULT {
    return Ole32.Load('OleCreateEx')(rclsid, riid, dwFlags, renderopt, cFormats, rgAdvf, rgFormatEtc, lpAdviseSink, rgdwConnection, pClientSite, pStg, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreatefromdata
  public static OleCreateFromData(pSrcDataObj: LPDATAOBJECT, riid: REFIID, renderopt: DWORD, pFormatEtc: LPFORMATETC, pClientSite: LPOLECLIENTSITE, pStg: LPSTORAGE, ppvObj: LPLPVOID): HRESULT {
    return Ole32.Load('OleCreateFromData')(pSrcDataObj, riid, renderopt, pFormatEtc, pClientSite, pStg, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreatefromdataex
  public static OleCreateFromDataEx(
    pSrcDataObj: LPDATAOBJECT,
    riid: REFIID,
    dwFlags: DWORD,
    renderopt: DWORD,
    cFormats: ULONG,
    rgAdvf: LPDWORD,
    rgFormatEtc: LPFORMATETC,
    lpAdviseSink: IAdviseSink,
    rgdwConnection: LPDWORD,
    pClientSite: LPOLECLIENTSITE,
    pStg: LPSTORAGE,
    ppvObj: LPLPVOID,
  ): HRESULT {
    return Ole32.Load('OleCreateFromDataEx')(pSrcDataObj, riid, dwFlags, renderopt, cFormats, rgAdvf, rgFormatEtc, lpAdviseSink, rgdwConnection, pClientSite, pStg, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreatefromfile
  public static OleCreateFromFile(rclsid: REFCLSID, lpszFileName: LPCOLESTR, riid: REFIID, renderopt: DWORD, lpFormatEtc: LPFORMATETC, pClientSite: LPOLECLIENTSITE, pStg: LPSTORAGE, ppvObj: LPLPVOID): HRESULT {
    return Ole32.Load('OleCreateFromFile')(rclsid, lpszFileName, riid, renderopt, lpFormatEtc, pClientSite, pStg, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreatefromfileex
  public static OleCreateFromFileEx(
    rclsid: REFCLSID,
    lpszFileName: LPCOLESTR,
    riid: REFIID,
    dwFlags: DWORD,
    renderopt: DWORD,
    cFormats: ULONG,
    rgAdvf: LPDWORD,
    rgFormatEtc: LPFORMATETC,
    lpAdviseSink: IAdviseSink,
    rgdwConnection: LPDWORD,
    pClientSite: LPOLECLIENTSITE,
    pStg: LPSTORAGE,
    ppvObj: LPLPVOID,
  ): HRESULT {
    return Ole32.Load('OleCreateFromFileEx')(rclsid, lpszFileName, riid, dwFlags, renderopt, cFormats, rgAdvf, rgFormatEtc, lpAdviseSink, rgdwConnection, pClientSite, pStg, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreatelink
  public static OleCreateLink(pmkLinkSrc: LPMONIKER, riid: REFIID, renderopt: DWORD, lpFormatEtc: LPFORMATETC, pClientSite: LPOLECLIENTSITE, pStg: LPSTORAGE, ppvObj: LPLPVOID): HRESULT {
    return Ole32.Load('OleCreateLink')(pmkLinkSrc, riid, renderopt, lpFormatEtc, pClientSite, pStg, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreatelinkex
  public static OleCreateLinkEx(
    pmkLinkSrc: LPMONIKER,
    riid: REFIID,
    dwFlags: DWORD,
    renderopt: DWORD,
    cFormats: ULONG,
    rgAdvf: LPDWORD,
    rgFormatEtc: LPFORMATETC,
    lpAdviseSink: IAdviseSink,
    rgdwConnection: LPDWORD,
    pClientSite: LPOLECLIENTSITE,
    pStg: LPSTORAGE,
    ppvObj: LPLPVOID,
  ): HRESULT {
    return Ole32.Load('OleCreateLinkEx')(pmkLinkSrc, riid, dwFlags, renderopt, cFormats, rgAdvf, rgFormatEtc, lpAdviseSink, rgdwConnection, pClientSite, pStg, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreatelinkfromdata
  public static OleCreateLinkFromData(pSrcDataObj: LPDATAOBJECT, riid: REFIID, renderopt: DWORD, pFormatEtc: LPFORMATETC, pClientSite: LPOLECLIENTSITE, pStg: LPSTORAGE, ppvObj: LPLPVOID): HRESULT {
    return Ole32.Load('OleCreateLinkFromData')(pSrcDataObj, riid, renderopt, pFormatEtc, pClientSite, pStg, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreatelinkfromdataex
  public static OleCreateLinkFromDataEx(
    pSrcDataObj: LPDATAOBJECT,
    riid: REFIID,
    dwFlags: DWORD,
    renderopt: DWORD,
    cFormats: ULONG,
    rgAdvf: LPDWORD,
    rgFormatEtc: LPFORMATETC,
    lpAdviseSink: IAdviseSink,
    rgdwConnection: LPDWORD,
    pClientSite: LPOLECLIENTSITE,
    pStg: LPSTORAGE,
    ppvObj: LPLPVOID,
  ): HRESULT {
    return Ole32.Load('OleCreateLinkFromDataEx')(pSrcDataObj, riid, dwFlags, renderopt, cFormats, rgAdvf, rgFormatEtc, lpAdviseSink, rgdwConnection, pClientSite, pStg, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreatelinktofile
  public static OleCreateLinkToFile(lpszFileName: LPCOLESTR, riid: REFIID, renderopt: DWORD, lpFormatEtc: LPFORMATETC, pClientSite: LPOLECLIENTSITE, pStg: LPSTORAGE, ppvObj: LPLPVOID): HRESULT {
    return Ole32.Load('OleCreateLinkToFile')(lpszFileName, riid, renderopt, lpFormatEtc, pClientSite, pStg, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreatelinktofileex
  public static OleCreateLinkToFileEx(
    lpszFileName: LPCOLESTR,
    riid: REFIID,
    dwFlags: DWORD,
    renderopt: DWORD,
    cFormats: ULONG,
    rgAdvf: LPDWORD,
    rgFormatEtc: LPFORMATETC,
    lpAdviseSink: IAdviseSink,
    rgdwConnection: LPDWORD,
    pClientSite: LPOLECLIENTSITE,
    pStg: LPSTORAGE,
    ppvObj: LPLPVOID,
  ): HRESULT {
    return Ole32.Load('OleCreateLinkToFileEx')(lpszFileName, riid, dwFlags, renderopt, cFormats, rgAdvf, rgFormatEtc, lpAdviseSink, rgdwConnection, pClientSite, pStg, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreatemenudescriptor
  public static OleCreateMenuDescriptor(hmenuCombined: HMENU, lpMenuWidths: LPOLEMENUGROUPWIDTHS): HOLEMENU {
    return Ole32.Load('OleCreateMenuDescriptor')(hmenuCombined, lpMenuWidths);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olecreatestaticfromdata
  public static OleCreateStaticFromData(pSrcDataObj: LPDATAOBJECT, iid: REFIID, renderopt: DWORD, pFormatEtc: LPFORMATETC, pClientSite: LPOLECLIENTSITE, pStg: LPSTORAGE, ppvObj: LPLPVOID): HRESULT {
    return Ole32.Load('OleCreateStaticFromData')(pSrcDataObj, iid, renderopt, pFormatEtc, pClientSite, pStg, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oledestroymenudescriptor
  public static OleDestroyMenuDescriptor(holemenu: HOLEMENU): HRESULT {
    return Ole32.Load('OleDestroyMenuDescriptor')(holemenu);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oledoautoconvert
  public static OleDoAutoConvert(pStg: LPSTORAGE, pClsidNew: LPCLSID): HRESULT {
    return Ole32.Load('OleDoAutoConvert')(pStg, pClsidNew);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oledraw
  public static OleDraw(pUnknown: LPUNKNOWN, dwAspect: DWORD, hdcDraw: HDC, lprcBounds: LPCRECT): HRESULT {
    return Ole32.Load('OleDraw')(pUnknown, dwAspect, hdcDraw, lprcBounds);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oleduplicatedata
  public static OleDuplicateData(hSrc: HANDLE, cfFormat: CLIPFORMAT, uiFlags: UINT): HANDLE {
    return Ole32.Load('OleDuplicateData')(hSrc, cfFormat, uiFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oleflushclipboard
  public static OleFlushClipboard(): HRESULT {
    return Ole32.Load('OleFlushClipboard')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olegetautoconvert
  public static OleGetAutoConvert(clsidOld: REFCLSID, pClsidNew: LPCLSID): HRESULT {
    return Ole32.Load('OleGetAutoConvert')(clsidOld, pClsidNew);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olegetclipboard
  public static OleGetClipboard(ppDataObj: PPDATAOBJECT): HRESULT {
    return Ole32.Load('OleGetClipboard')(ppDataObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olegetclipboardwithenterpriseinfo
  public static OleGetClipboardWithEnterpriseInfo(dataObject: PPDATAOBJECT, dataEnterpriseId: PPWSTR, sourceDescription: PPWSTR, targetDescription: PPWSTR, dataDescription: PPWSTR): HRESULT {
    return Ole32.Load('OleGetClipboardWithEnterpriseInfo')(dataObject, dataEnterpriseId, sourceDescription, targetDescription, dataDescription);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olegeticonofclass
  public static OleGetIconOfClass(rclsid: REFCLSID, lpszLabel: LPOLESTR | NULL, fUseTypeAsLabel: BOOL): HGLOBAL {
    return Ole32.Load('OleGetIconOfClass')(rclsid, lpszLabel, fUseTypeAsLabel);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olegeticonoffile
  public static OleGetIconOfFile(lpszPath: LPOLESTR, fUseFileAsLabel: BOOL): HGLOBAL {
    return Ole32.Load('OleGetIconOfFile')(lpszPath, fUseFileAsLabel);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oleinitialize
  public static OleInitialize(pvReserved: LPVOID | NULL): HRESULT {
    return Ole32.Load('OleInitialize')(pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oleiscurrentclipboard
  public static OleIsCurrentClipboard(pDataObj: LPDATAOBJECT): HRESULT {
    return Ole32.Load('OleIsCurrentClipboard')(pDataObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oleisrunning
  public static OleIsRunning(pObject: LPOLEOBJECT): BOOL {
    return Ole32.Load('OleIsRunning')(pObject);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oleload
  public static OleLoad(pStg: LPSTORAGE, riid: REFIID, pClientSite: LPOLECLIENTSITE, ppvObj: LPLPVOID): HRESULT {
    return Ole32.Load('OleLoad')(pStg, riid, pClientSite, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oleloadfromstream
  public static OleLoadFromStream(pStm: LPSTREAM, iidInterface: REFIID, ppvObj: LPLPVOID): HRESULT {
    return Ole32.Load('OleLoadFromStream')(pStm, iidInterface, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olelockrunning
  public static OleLockRunning(pUnknown: LPUNKNOWN, fLock: BOOL, fLastUnlockCloses: BOOL): HRESULT {
    return Ole32.Load('OleLockRunning')(pUnknown, fLock, fLastUnlockCloses);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olemetafilepictfromiconandlabel
  public static OleMetafilePictFromIconAndLabel(hIcon: HICON, lpszLabel: LPOLESTR, lpszSourceFile: LPOLESTR, iIconIndex: UINT): HGLOBAL {
    return Ole32.Load('OleMetafilePictFromIconAndLabel')(hIcon, lpszLabel, lpszSourceFile, iIconIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olenoteobjectvisible
  public static OleNoteObjectVisible(pUnknown: LPUNKNOWN, fVisible: BOOL): HRESULT {
    return Ole32.Load('OleNoteObjectVisible')(pUnknown, fVisible);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olequerycreatefromdata
  public static OleQueryCreateFromData(pSrcDataObject: LPDATAOBJECT): HRESULT {
    return Ole32.Load('OleQueryCreateFromData')(pSrcDataObject);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olequerylinkfromdata
  public static OleQueryLinkFromData(pSrcDataObject: LPDATAOBJECT): HRESULT {
    return Ole32.Load('OleQueryLinkFromData')(pSrcDataObject);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oleregenumformatetc
  public static OleRegEnumFormatEtc(clsid: REFCLSID, dwDirection: DWORD, ppenum: PPENUMFORMATETC): HRESULT {
    return Ole32.Load('OleRegEnumFormatEtc')(clsid, dwDirection, ppenum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oleregenumverbs
  public static OleRegEnumVerbs(clsid: REFCLSID, ppenum: PPENUMOLEVERB): HRESULT {
    return Ole32.Load('OleRegEnumVerbs')(clsid, ppenum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olereggetmiscstatus
  public static OleRegGetMiscStatus(clsid: REFCLSID, dwAspect: DWORD, pdwStatus: LPDWORD): HRESULT {
    return Ole32.Load('OleRegGetMiscStatus')(clsid, dwAspect, pdwStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olereggetusertype
  public static OleRegGetUserType(clsid: REFCLSID, dwFormOfType: DWORD, pszUserType: PPOLESTR): HRESULT {
    return Ole32.Load('OleRegGetUserType')(clsid, dwFormOfType, pszUserType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olerun
  public static OleRun(pUnknown: LPUNKNOWN): HRESULT {
    return Ole32.Load('OleRun')(pUnknown);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olesave
  public static OleSave(pPS: LPPERSISTSTORAGE, pStg: LPSTORAGE, fSameAsLoad: BOOL): HRESULT {
    return Ole32.Load('OleSave')(pPS, pStg, fSameAsLoad);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olesavetostream
  public static OleSaveToStream(pPStm: LPPERSISTSTREAM, pStm: LPSTREAM): HRESULT {
    return Ole32.Load('OleSaveToStream')(pPStm, pStm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olesetautoconvert
  public static OleSetAutoConvert(clsidOld: REFCLSID, clsidNew: REFCLSID): HRESULT {
    return Ole32.Load('OleSetAutoConvert')(clsidOld, clsidNew);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olesetclipboard
  public static OleSetClipboard(pDataObj: LPDATAOBJECT): HRESULT {
    return Ole32.Load('OleSetClipboard')(pDataObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olesetcontainedobject
  public static OleSetContainedObject(pUnknown: LPUNKNOWN, fContained: BOOL): HRESULT {
    return Ole32.Load('OleSetContainedObject')(pUnknown, fContained);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-olesetmenudescriptor
  public static OleSetMenuDescriptor(holemenu: HOLEMENU, hwndFrame: HWND, hwndActiveObject: HWND, lpFrame: LPOLEINPLACEFRAME, lpActiveObj: LPOLEINPLACEACTIVEOBJECT): HRESULT {
    return Ole32.Load('OleSetMenuDescriptor')(holemenu, hwndFrame, hwndActiveObject, lpFrame, lpActiveObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oletranslateaccelerator
  public static OleTranslateAccelerator(lpFrame: LPOLEINPLACEFRAME, lpFrameInfo: LPOLEINPLACEFRAMEINFO, lpmsg: LPMSG): HRESULT {
    return Ole32.Load('OleTranslateAccelerator')(lpFrame, lpFrameInfo, lpmsg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-oleuninitialize
  public static OleUninitialize(): void {
    return Ole32.Load('OleUninitialize')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-propstgnametofmtid
  public static PropStgNameToFmtId(oszName: LPOLESTR, pfmtid: FMTID): HRESULT {
    return Ole32.Load('PropStgNameToFmtId')(oszName, pfmtid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propvarutil/nf-propvarutil-propvariantchangetype
  public static PropVariantChangeType(ppropvarDest: PROPVARIANT, propvarSrc: REFPROPVARIANT, flags: PROPVAR_CHANGE_FLAGS, vt: VARTYPE): HRESULT {
    return Ole32.Load('PropVariantChangeType')(ppropvarDest, propvarSrc, flags, vt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-readclassstg
  public static ReadClassStg(pStg: LPSTORAGE, pclsid: CLSID): HRESULT {
    return Ole32.Load('ReadClassStg')(pStg, pclsid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-readclassstm
  public static ReadClassStm(pStm: LPSTREAM, pclsid: CLSID): HRESULT {
    return Ole32.Load('ReadClassStm')(pStm, pclsid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-readfmtusertypestg
  public static ReadFmtUserTypeStg(pstg: LPSTORAGE, pcf: LPWORD, lplpszUserType: PPOLESTR | NULL): HRESULT {
    return Ole32.Load('ReadFmtUserTypeStg')(pstg, pcf, lplpszUserType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-registerdragdrop
  public static RegisterDragDrop(hwnd: HWND, pDropTarget: LPDROPTARGET): HRESULT {
    return Ole32.Load('RegisterDragDrop')(hwnd, pDropTarget);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-releasestgmedium
  public static ReleaseStgMedium(pStgMedium: LPSTGMEDIUM): void {
    return Ole32.Load('ReleaseStgMedium')(pStgMedium);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-revokedragdrop
  public static RevokeDragDrop(hwnd: HWND): HRESULT {
    return Ole32.Load('RevokeDragDrop')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-setconvertstg
  public static SetConvertStg(pStg: LPSTORAGE, fConvert: BOOL): HRESULT {
    return Ole32.Load('SetConvertStg')(pStg, fConvert);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propidl/nf-propidl-stgconvertpropertytovariant
  public static StgConvertPropertyToVariant(pprop: SERIALIZEDPROPERTYVALUE, CodePage: USHORT, pvar: PROPVARIANT, pma: PMemoryAllocator): BOOLEAN {
    return Ole32.Load('StgConvertPropertyToVariant')(pprop, CodePage, pvar, pma);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propidl/nf-propidl-stgconvertvarianttoproperty
  public static StgConvertVariantToProperty(pvar: PROPVARIANT, CodePage: USHORT, pprop: SERIALIZEDPROPERTYVALUE | NULL, pcb: PULONG, pid: PROPID, fReserved: BOOLEAN, pcIndirect: PULONG | NULL): SERIALIZEDPROPERTYVALUE {
    return Ole32.Load('StgConvertVariantToProperty')(pvar, CodePage, pprop, pcb, pid, fReserved, pcIndirect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-stgcreatedocfile
  public static StgCreateDocfile(pwcsName: LPCWSTR | NULL, grfMode: DWORD, reserved: DWORD, ppstgOpen: PPIStorage): HRESULT {
    return Ole32.Load('StgCreateDocfile')(pwcsName, grfMode, reserved, ppstgOpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-stgcreatedocfileonilockbytes
  public static StgCreateDocfileOnILockBytes(plkbyt: ILockBytes, grfMode: DWORD, reserved: DWORD, ppstgOpen: PPIStorage): HRESULT {
    return Ole32.Load('StgCreateDocfileOnILockBytes')(plkbyt, grfMode, reserved, ppstgOpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-stgcreatepropsetstg
  public static StgCreatePropSetStg(pStorage: LPSTORAGE, dwReserved: DWORD, ppPropSetStg: PPIPropertySetStorage): HRESULT {
    return Ole32.Load('StgCreatePropSetStg')(pStorage, dwReserved, ppPropSetStg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-stgcreatepropstg
  public static StgCreatePropStg(pUnk: LPUNKNOWN, fmtid: REFFMTID, pclsid: CLSID, grfFlags: DWORD, dwReserved: DWORD, ppPropStg: PPIPropertyStorage): HRESULT {
    return Ole32.Load('StgCreatePropStg')(pUnk, fmtid, pclsid, grfFlags, dwReserved, ppPropStg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-stgcreatestorageex
  public static StgCreateStorageEx(pwcsName: LPCWSTR | NULL, grfMode: DWORD, stgfmt: DWORD, grfAttrs: DWORD, pStgOptions: STGOPTIONS | NULL, pSecurityDescriptor: PSECURITY_DESCRIPTOR | NULL, riid: REFIID, ppObjectOpen: PPVOID): HRESULT {
    return Ole32.Load('StgCreateStorageEx')(pwcsName, grfMode, stgfmt, grfAttrs, pStgOptions, pSecurityDescriptor, riid, ppObjectOpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-stggetifilllockbytesonfile
  public static StgGetIFillLockBytesOnFile(pwcsName: LPCOLESTR, ppflb: PPIFillLockBytes): HRESULT {
    return Ole32.Load('StgGetIFillLockBytesOnFile')(pwcsName, ppflb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-stggetifilllockbytesonilockbytes
  public static StgGetIFillLockBytesOnILockBytes(pilb: ILockBytes, ppflb: PPIFillLockBytes): HRESULT {
    return Ole32.Load('StgGetIFillLockBytesOnILockBytes')(pilb, ppflb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-stgisstoragefile
  public static StgIsStorageFile(pwcsName: LPCWSTR): HRESULT {
    return Ole32.Load('StgIsStorageFile')(pwcsName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-stgisstorageilockbytes
  public static StgIsStorageILockBytes(plkbyt: ILockBytes): HRESULT {
    return Ole32.Load('StgIsStorageILockBytes')(plkbyt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/objbase/nf-objbase-stgopenasyncdocfileonifilllockbytes
  public static StgOpenAsyncDocfileOnIFillLockBytes(pflb: IFillLockBytes, grfMode: DWORD, asyncFlags: DWORD, ppstgOpen: PPIStorage): HRESULT {
    return Ole32.Load('StgOpenAsyncDocfileOnIFillLockBytes')(pflb, grfMode, asyncFlags, ppstgOpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-stgopenpropstg
  public static StgOpenPropStg(pUnk: LPUNKNOWN, fmtid: REFFMTID, grfFlags: DWORD, dwReserved: DWORD, ppPropStg: PPIPropertyStorage): HRESULT {
    return Ole32.Load('StgOpenPropStg')(pUnk, fmtid, grfFlags, dwReserved, ppPropStg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-stgopenstorage
  public static StgOpenStorage(pwcsName: LPCWSTR | NULL, pstgPriority: IStorage | NULL, grfMode: DWORD, snbExclude: SNB | NULL, reserved: DWORD, ppstgOpen: PPIStorage): HRESULT {
    return Ole32.Load('StgOpenStorage')(pwcsName, pstgPriority, grfMode, snbExclude, reserved, ppstgOpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-stgopenstorageex
  public static StgOpenStorageEx(pwcsName: LPCWSTR, grfMode: DWORD, stgfmt: DWORD, grfAttrs: DWORD, pStgOptions: STGOPTIONS | NULL, pSecurityDescriptor: PSECURITY_DESCRIPTOR | NULL, riid: REFIID, ppObjectOpen: PPVOID): HRESULT {
    return Ole32.Load('StgOpenStorageEx')(pwcsName, grfMode, stgfmt, grfAttrs, pStgOptions, pSecurityDescriptor, riid, ppObjectOpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-stgopenstorageonilockbytes
  public static StgOpenStorageOnILockBytes(plkbyt: ILockBytes, pstgPriority: IStorage | NULL, grfMode: DWORD, snbExclude: SNB | NULL, reserved: DWORD, ppstgOpen: PPIStorage): HRESULT {
    return Ole32.Load('StgOpenStorageOnILockBytes')(plkbyt, pstgPriority, grfMode, snbExclude, reserved, ppstgOpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/propapi/nf-propapi-stgpropertylengthasvariant
  public static StgPropertyLengthAsVariant(pProp: SERIALIZEDPROPERTYVALUE, cbProp: ULONG, CodePage: USHORT, bReserved: BYTE): ULONG {
    return Ole32.Load('StgPropertyLengthAsVariant')(pProp, cbProp, CodePage, bReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-stgsettimes
  public static StgSetTimes(lpszName: LPCWSTR, pctime: FILETIME | NULL, patime: FILETIME | NULL, pmtime: FILETIME | NULL): HRESULT {
    return Ole32.Load('StgSetTimes')(lpszName, pctime, patime, pmtime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-writeclassstg
  public static WriteClassStg(pStg: LPSTORAGE, rclsid: REFCLSID): HRESULT {
    return Ole32.Load('WriteClassStg')(pStg, rclsid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/coml2api/nf-coml2api-writeclassstm
  public static WriteClassStm(pStm: LPSTREAM, rclsid: REFCLSID): HRESULT {
    return Ole32.Load('WriteClassStm')(pStm, rclsid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-writefmtusertypestg
  public static WriteFmtUserTypeStg(pstg: LPSTORAGE, cf: CLIPFORMAT, lpszUserType: LPOLESTR): HRESULT {
    return Ole32.Load('WriteFmtUserTypeStg')(pstg, cf, lpszUserType);
  }
}

export default Ole32;
