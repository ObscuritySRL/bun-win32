import type { Pointer } from 'bun:ffi';

import type { WORD } from '@bun-win32/core';

export type { BOOL, BOOLEAN, BYTE, DWORD, HANDLE, HINSTANCE, HRESULT, HWND, INT, LONG, LPCWSTR, LPDWORD, LPVOID, LPWSTR, NULL, PULONG, UINT, ULONG, USHORT, WORD } from '@bun-win32/core';

export const CCH_MAX_PROPSTG_NAME = 31;

export enum OleRender {
  OLERENDER_ASIS = 3,
  OLERENDER_DRAW = 1,
  OLERENDER_FORMAT = 2,
  OLERENDER_NONE = 0,
}

export enum StorageFormat {
  STGFMT_ANY = 4,
  STGFMT_DOCFILE = 5,
  STGFMT_FILE = 3,
  STGFMT_NATIVE = 1,
  STGFMT_STORAGE = 0,
}

export enum StorageMode {
  STGM_CONVERT = 0x0002_0000,
  STGM_CREATE = 0x0000_1000,
  STGM_DELETEONRELEASE = 0x0400_0000,
  STGM_DIRECT = 0x0000_0000,
  STGM_DIRECT_SWMR = 0x0040_0000,
  STGM_FAILIFTHERE = 0x0000_0000,
  STGM_NOSCRATCH = 0x0010_0000,
  STGM_NOSNAPSHOT = 0x0020_0000,
  STGM_PRIORITY = 0x0004_0000,
  STGM_READ = 0x0000_0000,
  STGM_READWRITE = 0x0000_0002,
  STGM_SHARE_DENY_NONE = 0x0000_0040,
  STGM_SHARE_DENY_READ = 0x0000_0030,
  STGM_SHARE_DENY_WRITE = 0x0000_0020,
  STGM_SHARE_EXCLUSIVE = 0x0000_0010,
  STGM_SIMPLE = 0x0800_0000,
  STGM_TRANSACTED = 0x0001_0000,
  STGM_WRITE = 0x0000_0001,
}

export type BIND_OPTS = Pointer;
export type CLIPFORMAT = WORD;
export type CLSID = Pointer;
export type DVTARGETDEVICE = Pointer;
export type FILETIME = Pointer;
export type FMTID = Pointer;
export type HACCEL = bigint;
export type HDC = bigint;
export type HGLOBAL = bigint;
export type HICON = bigint;
export type HMENU = bigint;
export type HOLEMENU = bigint;
export type IAdviseSink = Pointer;
export type IFillLockBytes = Pointer;
export type ILockBytes = Pointer;
export type IPropertySetStorage = Pointer;
export type IPropertyStorage = Pointer;
export type IStorage = Pointer;
export type ITypeInfo = Pointer;
export type IUnknown = Pointer;
export type LPBC = Pointer;
export type LPCLASSFACTORY = Pointer;
export type LPCLSID = Pointer;
export type LPCOLESTR = Pointer;
export type LPCRECT = Pointer;
export type LPDATAADVISEHOLDER = Pointer;
export type LPDATAOBJECT = Pointer;
export type LPDROPSOURCE = Pointer;
export type LPDROPTARGET = Pointer;
export type LPENUMFORMATETC = Pointer;
export type LPENUMOLEVERB = Pointer;
export type LPFORMATETC = Pointer;
export type LPLONG = Pointer;
export type LPLOCKBYTES = Pointer;
export type LPLPVOID = Pointer;
export type LPMESSAGEFILTER = Pointer;
export type LPMONIKER = Pointer;
export type LPMSG = Pointer;
export type LPOLEADVISEHOLDER = Pointer;
export type LPOLECLIENTSITE = Pointer;
export type LPOLEINPLACEACTIVEOBJECT = Pointer;
export type LPOLEINPLACEFRAME = Pointer;
export type LPOLEINPLACEFRAMEINFO = Pointer;
export type LPOLEMENUGROUPWIDTHS = Pointer;
export type LPOLEOBJECT = Pointer;
export type LPOLESTR = Pointer;
export type LPOLESTREAM = Pointer;
export type LPPERSISTSTORAGE = Pointer;
export type LPPERSISTSTREAM = Pointer;
export type LPRUNNINGOBJECTTABLE = Pointer;
export type LPSTGMEDIUM = Pointer;
export type LPSTORAGE = Pointer;
export type LPSTREAM = Pointer;
export type LPUNKNOWN = Pointer;
export type LPWORD = Pointer;
export type PHGLOBAL = Pointer;
export type PMemoryAllocator = Pointer;
export type PPBC = Pointer;
export type PPDATAADVISEHOLDER = Pointer;
export type PPDATAOBJECT = Pointer;
export type PPENUMFORMATETC = Pointer;
export type PPENUMOLEVERB = Pointer;
export type PPIFillLockBytes = Pointer;
export type PPLOCKBYTES = Pointer;
export type PPMESSAGEFILTER = Pointer;
export type PPMONIKER = Pointer;
export type PPOLEADVISEHOLDER = Pointer;
export type PPOLESTR = Pointer;
export type PPIPropertySetStorage = Pointer;
export type PPIPropertyStorage = Pointer;
export type PPIStorage = Pointer;
export type PPRUNNINGOBJECTTABLE = Pointer;
export type PPVOID = Pointer;
export type PPWSTR = Pointer;
export type PSECURITY_DESCRIPTOR = Pointer;
export type PROPID = number;
export type PROPVARIANT = Pointer;
export type PROPVAR_CHANGE_FLAGS = number;
export type QUERYCONTEXT = Pointer;
export type REFCLSID = Pointer;
export type REFFMTID = Pointer;
export type REFGUID = Pointer;
export type REFIID = Pointer;
export type REFPROPVARIANT = Pointer;
export type SERIALIZEDPROPERTYVALUE = Pointer;
export type SNB = Pointer;
export type STGOPTIONS = Pointer;
export type uCLSSPEC = Pointer;
export type VARTYPE = number;
