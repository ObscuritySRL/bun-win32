import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, HINSTANCE, HRESULT, HWND, INT, LONG, LPBOOL, LPCWSTR, LPDWORD, LPVOID, LPWSTR, NULL, OPTIONAL, SHORT, UINT, ULONG, USHORT } from '@bun-win32/core';

export enum GETPROPERTYSTOREFLAGS {
  GPS_BESTEFFORT = 0x0000_0040,
  GPS_DEFAULT = 0x0000_0000,
  GPS_DELAYCREATION = 0x0000_0020,
  GPS_EXTRINSICPROPERTIES = 0x0000_0200,
  GPS_EXTRINSICPROPERTIESONLY = 0x0000_0400,
  GPS_FASTPROPERTIESONLY = 0x0000_0008,
  GPS_HANDLERPROPERTIESONLY = 0x0000_0001,
  GPS_MASK_VALID = 0x0000_1fff,
  GPS_NO_OPLOCK = 0x0000_0080,
  GPS_OPENSLOWITEM = 0x0000_0010,
  GPS_PREFERQUERYPROPERTIES = 0x0000_0100,
  GPS_READWRITE = 0x0000_0002,
  GPS_TEMPORARY = 0x0000_0004,
  GPS_VOLATILEPROPERTIES = 0x0000_0800,
  GPS_VOLATILEPROPERTIESONLY = 0x0000_1000,
}

export enum PKA_FLAGS {
  PKA_APPEND = 0x0000_0001,
  PKA_DELETE = 0x0000_0002,
  PKA_SET = 0x0000_0000,
}

export enum PROPDESC_ENUMFILTER {
  PDEF_ALL = 0x0000_0000,
  PDEF_COLUMN = 0x0000_0006,
  PDEF_INFULLTEXTQUERY = 0x0000_0005,
  PDEF_NONSYSTEM = 0x0000_0002,
  PDEF_QUERYABLE = 0x0000_0004,
  PDEF_SYSTEM = 0x0000_0001,
  PDEF_VIEWABLE = 0x0000_0003,
}

export enum PROPDESC_FORMAT_FLAGS {
  PDFF_ALWAYSKB = 0x0000_0004,
  PDFF_DEFAULT = 0x0000_0000,
  PDFF_FILENAME = 0x0000_0002,
  PDFF_HIDEDATE = 0x0000_0200,
  PDFF_HIDETIME = 0x0000_0040,
  PDFF_LONGDATE = 0x0000_0100,
  PDFF_LONGTIME = 0x0000_0020,
  PDFF_NOAUTOREADINGORDER = 0x0000_2000,
  PDFF_PREFIXNAME = 0x0000_0001,
  PDFF_READONLY = 0x0000_1000,
  PDFF_RELATIVEDATE = 0x0000_0400,
  PDFF_RESERVED_RIGHTTOLEFT = 0x0000_0008,
  PDFF_SHORTDATE = 0x0000_0080,
  PDFF_SHORTTIME = 0x0000_0010,
  PDFF_USEEDITINVITATION = 0x0000_0800,
}

export enum PROPVAR_CHANGE_FLAGS {
  PVCHF_ALPHABOOL = 0x0000_0002,
  PVCHF_DEFAULT = 0x0000_0000,
  PVCHF_LOCALBOOL = 0x0000_0008,
  PVCHF_NOHEXSTRING = 0x0000_0010,
  PVCHF_NOUSEROVERRIDE = 0x0000_0004,
  PVCHF_NOVALUEPROP = 0x0000_0001,
}

export enum PROPVAR_COMPARE_FLAGS {
  PVCF_DEFAULT = 0x0000_0000,
  PVCF_DIGITSASNUMBERS_CASESENSITIVE = 0x0000_0020,
  PVCF_TREATEMPTYASGREATERTHAN = 0x0000_0001,
  PVCF_USESTRCMP = 0x0000_0002,
  PVCF_USESTRCMPC = 0x0000_0004,
  PVCF_USESTRCMPI = 0x0000_0008,
  PVCF_USESTRCMPIC = 0x0000_0010,
}

export enum PROPVAR_COMPARE_UNIT {
  PVCU_DAY = 0x0000_0004,
  PVCU_DEFAULT = 0x0000_0000,
  PVCU_HOUR = 0x0000_0003,
  PVCU_MINUTE = 0x0000_0002,
  PVCU_MONTH = 0x0000_0005,
  PVCU_SECOND = 0x0000_0001,
  PVCU_YEAR = 0x0000_0006,
}

export enum PSTIME_FLAGS {
  PSTF_LOCAL = 0x0000_0001,
  PSTF_UTC = 0x0000_0000,
}

export type BSTR = Pointer;
export type DOUBLE = number;
export type IDelayedPropertyStoreFactory = Pointer;
export type IPropertyBag = Pointer;
export type IPropertyDescription = Pointer;
export type IPropertySetStorage = Pointer;
export type IPropertyStore = Pointer;
export type IStream = bigint;
export type IUnknown = Pointer;
export type LONGLONG = bigint;
export type LPBSTR = Pointer;
export type LPCLSID = Pointer;
export type LPDOUBLE = Pointer;
export type LPFILETIME = Pointer;
export type LPGUID = Pointer;
export type LPINT = Pointer;
export type LPLONG = Pointer;
export type LPLONGLONG = Pointer;
export type LPLPBOOL = Pointer;
export type LPLPDOUBLE = Pointer;
export type LPLPFILETIME = Pointer;
export type LPLPLONG = Pointer;
export type LPLPLONGLONG = Pointer;
export type LPLPPWSTR = Pointer;
export type LPLPSERIALIZEDPROPERTYVALUE = Pointer;
export type LPLPSHORT = Pointer;
export type LPLPULONG = Pointer;
export type LPLPULONGLONG = Pointer;
export type LPLPUSHORT = Pointer;
export type LPLPVOID = Pointer;
export type LPLPWSTR = Pointer;
export type LPPCWSTR = Pointer;
export type LPPKA_FLAGS = Pointer;
export type LPPOINTL = Pointer;
export type LPPOINTS = Pointer;
export type LPPROPERTYKEY = Pointer;
export type LPPROPVARIANT = Pointer;
export type LPPWSTR = Pointer;
export type LPRECTL = Pointer;
export type LPSERIALIZEDPROPERTYVALUE = Pointer;
export type LPSHORT = Pointer;
export type LPSTREAM = Pointer;
export type LPSTRRET = Pointer;
export type LPULONG = Pointer;
export type LPULONGLONG = Pointer;
export type LPUNKNOWN = Pointer;
export type LPUSHORT = Pointer;
export type LPVARIANT = Pointer;
export type LPWORD = Pointer;
export type PCUITEMID_CHILD = Pointer;
export type PCUSERIALIZEDPROPSTORAGE = Pointer;
export type PCWSTR = Pointer;
export type PWSTR = Pointer;
export type REFCLSID = Pointer;
export type REFGUID = Pointer;
export type REFIID = Pointer;
export type REFPROPERTYKEY = Pointer;
export type REFPROPVARIANT = Pointer;
export type REFVARIANT = Pointer;
export type ULONGLONG = bigint;
export type VARTYPE = number;
