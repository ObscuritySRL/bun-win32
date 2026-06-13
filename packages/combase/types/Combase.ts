import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, HRESULT, LPBOOL, LPVOID, NULL, PULONG, PVOID, UINT, UINT_PTR, ULONG, USHORT } from '@bun-win32/core';

export enum AgileReferenceOptions {
  AGILEREFERENCE_DEFAULT = 0x0000_0000,
  AGILEREFERENCE_DELAYEDMARSHAL = 0x0000_0001,
}

export enum CLSCTX {
  CLSCTX_INPROC_HANDLER = 0x0000_0002,
  CLSCTX_INPROC_SERVER = 0x0000_0001,
  CLSCTX_LOCAL_SERVER = 0x0000_0004,
  CLSCTX_REMOTE_SERVER = 0x0000_0010,
}

export enum COINIT {
  COINIT_APARTMENTTHREADED = 0x0000_0002,
  COINIT_DISABLE_OLE1DDE = 0x0000_0004,
  COINIT_MULTITHREADED = 0x0000_0000,
  COINIT_SPEED_OVER_MEMORY = 0x0000_0008,
}

export enum RO_ERROR_REPORTING_FLAGS {
  RO_ERROR_REPORTING_FORCEEXCEPTIONS = 0x0000_0002,
  RO_ERROR_REPORTING_NONE = 0x0000_0000,
  RO_ERROR_REPORTING_SUPPRESSEXCEPTIONS = 0x0000_0001,
  RO_ERROR_REPORTING_SUPPRESSSETERRORINFO = 0x0000_0008,
  RO_ERROR_REPORTING_USESETERRORINFO = 0x0000_0004,
}

export enum RO_INIT_TYPE {
  RO_INIT_MULTITHREADED = 0x0000_0001,
  RO_INIT_SINGLETHREADED = 0x0000_0000,
}

export type APARTMENT_SHUTDOWN_REGISTRATION_COOKIE = bigint;
export type HSTRING = bigint;
export type HSTRING_BUFFER = bigint;
export type IApartmentShutdown = Pointer;
export type INT32 = number;
export type IRestrictedErrorInfo = Pointer;
export type IRoMetaDataLocator = Pointer;
export type IUnknown = Pointer;
export type LPCLSID = Pointer;
export type LPGUID = Pointer;
export type LPLPVOID = Pointer;
export type LPLPWSTR = Pointer;
export type LPPCWSTR = Pointer;
export type LPUNKNOWN = bigint;
export type PAPARTMENT_SHUTDOWN_REGISTRATION_COOKIE = Pointer;
export type PCNZWCH = Pointer;
export type PCSTR = Pointer;
export type PCWSTR = Pointer;
export type PFNGETACTIVATIONFACTORY = Pointer;
export type PHSTRING = Pointer;
export type PHSTRING_BUFFER = Pointer;
export type PHSTRING_HEADER = Pointer;
export type PINSPECT_HSTRING_CALLBACK = Pointer;
export type PINSPECT_HSTRING_CALLBACK2 = Pointer;
export type PINSPECT_MEMORY_CALLBACK = Pointer;
export type PINT32 = Pointer;
export type PRO_REGISTRATION_COOKIE = Pointer;
export type PROPARAMIIDHANDLE = Pointer;
export type PUCHAR = Pointer;
export type PUINT32 = Pointer;
export type PUINT64 = Pointer;
export type PUINT_PTR = Pointer;
export type REFCLSID = Pointer;
export type REFIID = Pointer;
export type RO_REGISTRATION_COOKIE = bigint;
export type ROPARAMIIDHANDLE = bigint;
export type UINT32 = number;
export type UINT64 = bigint;
