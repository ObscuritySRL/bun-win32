import type { Pointer } from 'bun:ffi';

import type { DWORD, LONG, SHORT, ULONG, USHORT } from '@bun-win32/core';
export type {
  BOOL,
  BOOLEAN,
  BYTE,
  CHAR,
  DWORD,
  HANDLE,
  HRESULT,
  HWND,
  INT,
  LONG,
  LONG_PTR,
  LPCSTR,
  LPCVOID,
  LPCWSTR,
  LPDWORD,
  LPSTR,
  LPVOID,
  LPWSTR,
  NULL,
  NULLABLE,
  OPTIONAL,
  PULONG,
  PVOID,
  SHORT,
  UINT,
  ULONG,
  ULONG_PTR,
  USHORT,
  WORD,
} from '@bun-win32/core';

export type DOUBLE = number;
export type FLOAT = number;
export type LONG64 = bigint;
export type ULONG64 = bigint;

export const DISPATCH_METHOD = 0x1;
export const DISPATCH_PROPERTYGET = 0x2;
export const DISPATCH_PROPERTYPUT = 0x4;
export const DISPATCH_PROPERTYPUTREF = 0x8;

export const DISPID_COLLECT = -8;
export const DISPID_CONSTRUCTOR = -6;
export const DISPID_DESTRUCTOR = -7;
export const DISPID_EVALUATE = -5;
export const DISPID_NEWENUM = -4;
export const DISPID_PROPERTYPUT = -3;
export const DISPID_UNKNOWN = -1;
export const DISPID_VALUE = 0;

export const FADF_AUTO = 0x0001;
export const FADF_BSTR = 0x0100;
export const FADF_DISPATCH = 0x0400;
export const FADF_EMBEDDED = 0x0004;
export const FADF_FIXEDSIZE = 0x0010;
export const FADF_HAVEIID = 0x0040;
export const FADF_HAVEVARTYPE = 0x0080;
export const FADF_RECORD = 0x0020;
export const FADF_RESERVED = 0xf008;
export const FADF_STATIC = 0x0002;
export const FADF_UNKNOWN = 0x0200;
export const FADF_VARIANT = 0x0800;

export const LOCALE_INVARIANT = 0x007f;
export const LOCALE_NEUTRAL = 0x0000;
export const LOCALE_SYSTEM_DEFAULT = 0x0800;
export const LOCALE_USER_DEFAULT = 0x0400;

export const NUMPRS_CURRENCY = 0x0000_0400;
export const NUMPRS_DECIMAL = 0x0000_0100;
export const NUMPRS_EXPONENT = 0x0000_0800;
export const NUMPRS_HEX_OCT = 0x0000_0040;
export const NUMPRS_INEXACT = 0x0002_0000;
export const NUMPRS_LEADING_MINUS = 0x0000_0010;
export const NUMPRS_LEADING_PLUS = 0x0000_0004;
export const NUMPRS_LEADING_WHITE = 0x0000_0001;
export const NUMPRS_NEG = 0x0001_0000;
export const NUMPRS_PARENS = 0x0000_0080;
export const NUMPRS_STD = 0x0000_1fff;
export const NUMPRS_THOUSANDS = 0x0000_0200;
export const NUMPRS_TRAILING_MINUS = 0x0000_0020;
export const NUMPRS_TRAILING_PLUS = 0x0000_0008;
export const NUMPRS_TRAILING_WHITE = 0x0000_0002;
export const NUMPRS_USE_ALL = 0x0000_1000;

export const VARIANT_ALPHABOOL = 0x02;
export const VARIANT_CALENDAR_GREGORIAN = 0x40;
export const VARIANT_CALENDAR_HIJRI = 0x08;
export const VARIANT_CALENDAR_THAI = 0x20;
export const VARIANT_FALSE = 0x0000;
export const VARIANT_LOCALBOOL = 0x10;
export const VARIANT_NOUSEROVERRIDE = 0x04;
export const VARIANT_NOVALUEPROP = 0x01;
export const VARIANT_TRUE = -1;
export const VARIANT_USE_NLS = 0x80;

export const VAR_CALENDAR_GREGORIAN = 0x0100;
export const VAR_CALENDAR_HIJRI = 0x0008;
export const VAR_CALENDAR_THAI = 0x0080;
export const VAR_DATEVALUEONLY = 0x0002;
export const VAR_FORMAT_NOSUBSTITUTE = 0x0020;
export const VAR_FOURDIGITYEARS = 0x0040;
export const VAR_LOCALBOOL = 0x0010;
export const VAR_TIMEVALUEONLY = 0x0001;
export const VAR_VALIDDATE = 0x0004;

export const VTBIT_CY = 1 << 6;
export const VTBIT_DECIMAL = 1 << 14;
export const VTBIT_I1 = 1 << 16;
export const VTBIT_I2 = 1 << 2;
export const VTBIT_I4 = 1 << 3;
export const VTBIT_R4 = 1 << 4;
export const VTBIT_R8 = 1 << 5;
export const VTBIT_UI1 = 1 << 17;
export const VTBIT_UI2 = 1 << 18;
export const VTBIT_UI4 = 1 << 19;

export enum CallConv {
  CC_CDECL = 1,
  CC_FASTCALL = 0,
  CC_FPFASTCALL = 5,
  CC_MACPASCAL = 3,
  CC_MAX = 9,
  CC_MPWCDECL = 7,
  CC_MPWPASCAL = 8,
  CC_MSCPASCAL = 2,
  CC_STDCALL = 4,
  CC_SYSCALL = 6,
}

export enum DescKind {
  DESCKIND_FUNCDESC = 1,
  DESCKIND_IMPLICITAPPOBJ = 4,
  DESCKIND_MAX = 5,
  DESCKIND_NONE = 0,
  DESCKIND_TYPECOMP = 3,
  DESCKIND_VARDESC = 2,
}

export enum FuncFlags {
  FUNCFLAG_FBINDABLE = 0x0004,
  FUNCFLAG_FDEFAULTBIND = 0x0020,
  FUNCFLAG_FDEFAULTCOLLELEM = 0x0100,
  FUNCFLAG_FDISPLAYBIND = 0x0010,
  FUNCFLAG_FHIDDEN = 0x0040,
  FUNCFLAG_FIMMEDIATEBIND = 0x1000,
  FUNCFLAG_FNONBROWSABLE = 0x0400,
  FUNCFLAG_FREPLACEABLE = 0x0800,
  FUNCFLAG_FREQUESTEDIT = 0x0008,
  FUNCFLAG_FRESTRICTED = 0x0001,
  FUNCFLAG_FSOURCE = 0x0002,
  FUNCFLAG_FUIDEFAULT = 0x0200,
  FUNCFLAG_FUSESGETLASTERROR = 0x0080,
}

export enum FuncKind {
  FUNC_DISPATCH = 4,
  FUNC_NONVIRTUAL = 2,
  FUNC_PUREVIRTUAL = 1,
  FUNC_STATIC = 3,
  FUNC_VIRTUAL = 0,
}

export enum ImplTypeFlags {
  IMPLTYPEFLAG_FDEFAULT = 0x1,
  IMPLTYPEFLAG_FDEFAULTVTABLE = 0x8,
  IMPLTYPEFLAG_FRESTRICTED = 0x4,
  IMPLTYPEFLAG_FSOURCE = 0x2,
}

export enum InvokeKind {
  INVOKE_FUNC = 0x1,
  INVOKE_PROPERTYGET = 0x2,
  INVOKE_PROPERTYPUT = 0x4,
  INVOKE_PROPERTYPUTREF = 0x8,
}

export enum LibFlags {
  LIBFLAG_FCONTROL = 0x2,
  LIBFLAG_FHASDISKIMAGE = 0x8,
  LIBFLAG_FHIDDEN = 0x4,
  LIBFLAG_FRESTRICTED = 0x1,
}

export enum ParamFlag {
  PARAMFLAG_FHASCUSTDATA = 0x40,
  PARAMFLAG_FHASDEFAULT = 0x20,
  PARAMFLAG_FIN = 0x01,
  PARAMFLAG_FLCID = 0x04,
  PARAMFLAG_FOPT = 0x10,
  PARAMFLAG_FOUT = 0x02,
  PARAMFLAG_FRETVAL = 0x08,
  PARAMFLAG_NONE = 0x00,
}

export enum RegKind {
  REGKIND_DEFAULT = 0,
  REGKIND_NONE = 2,
  REGKIND_REGISTER = 1,
}

export enum SysKind {
  SYS_MAC = 2,
  SYS_WIN16 = 0,
  SYS_WIN32 = 1,
  SYS_WIN64 = 3,
}

export enum TypeKind {
  TKIND_ALIAS = 6,
  TKIND_COCLASS = 5,
  TKIND_DISPATCH = 4,
  TKIND_ENUM = 0,
  TKIND_INTERFACE = 3,
  TKIND_MAX = 8,
  TKIND_MODULE = 2,
  TKIND_RECORD = 1,
  TKIND_UNION = 7,
}

export enum VarEnum {
  VT_ARRAY = 0x2000,
  VT_BLOB = 65,
  VT_BLOB_OBJECT = 70,
  VT_BOOL = 11,
  VT_BSTR = 8,
  VT_BSTR_BLOB = 0xfff,
  VT_BYREF = 0x4000,
  VT_CARRAY = 28,
  VT_CF = 71,
  VT_CLSID = 72,
  VT_CY = 6,
  VT_DATE = 7,
  VT_DECIMAL = 14,
  VT_DISPATCH = 9,
  VT_EMPTY = 0,
  VT_ERROR = 10,
  VT_FILETIME = 64,
  VT_HRESULT = 25,
  VT_I1 = 16,
  VT_I2 = 2,
  VT_I4 = 3,
  VT_I8 = 20,
  VT_ILLEGAL = 0xffff,
  VT_ILLEGALMASKED = 0xfff,
  VT_INT = 22,
  VT_INT_PTR = 37,
  VT_LPSTR = 30,
  VT_LPWSTR = 31,
  VT_NULL = 1,
  VT_PTR = 26,
  VT_R4 = 4,
  VT_R8 = 5,
  VT_RECORD = 36,
  VT_RESERVED = 0x8000,
  VT_SAFEARRAY = 27,
  VT_STORAGE = 67,
  VT_STORED_OBJECT = 69,
  VT_STREAM = 66,
  VT_STREAMED_OBJECT = 68,
  VT_TYPEMASK = 0xfff,
  VT_UI1 = 17,
  VT_UI2 = 18,
  VT_UI4 = 19,
  VT_UI8 = 21,
  VT_UINT = 23,
  VT_UINT_PTR = 38,
  VT_UNKNOWN = 13,
  VT_USERDEFINED = 29,
  VT_VARIANT = 12,
  VT_VECTOR = 0x1000,
  VT_VERSIONED_STREAM = 73,
  VT_VOID = 24,
}

export enum VarFlags {
  VARFLAG_FBINDABLE = 0x0004,
  VARFLAG_FDEFAULTBIND = 0x0020,
  VARFLAG_FDEFAULTCOLLELEM = 0x0100,
  VARFLAG_FDISPLAYBIND = 0x0010,
  VARFLAG_FHIDDEN = 0x0040,
  VARFLAG_FIMMEDIATEBIND = 0x1000,
  VARFLAG_FNONBROWSABLE = 0x0400,
  VARFLAG_FREADONLY = 0x0001,
  VARFLAG_FREPLACEABLE = 0x0800,
  VARFLAG_FREQUESTEDIT = 0x0008,
  VARFLAG_FRESTRICTED = 0x0080,
  VARFLAG_FSOURCE = 0x0002,
  VARFLAG_FUIDEFAULT = 0x0200,
}

export enum VarKind {
  VAR_CONST = 2,
  VAR_DISPATCH = 3,
  VAR_PERINSTANCE = 0,
  VAR_STATIC = 1,
}

export type BSTR = Pointer;
export type CY = bigint;
export type DATE = number;
export type DISPID = LONG;
export type HREFTYPE = DWORD;
export type ICreateErrorInfo = Pointer;
export type ICreateTypeInfo = Pointer;
export type ICreateTypeInfo2 = Pointer;
export type ICreateTypeLib = Pointer;
export type ICreateTypeLib2 = Pointer;
export type IDispatch = Pointer;
export type IErrorInfo = Pointer;
export type IFont = Pointer;
export type IFontDisp = Pointer;
export type IPicture = Pointer;
export type IPictureDisp = Pointer;
export type IRecordInfo = Pointer;
export type ITypeComp = Pointer;
export type ITypeInfo = Pointer;
export type ITypeInfo2 = Pointer;
export type ITypeLib = Pointer;
export type ITypeLib2 = Pointer;
export type IUnknown = Pointer;
export type LCID = DWORD;
export type LPBSTR = Pointer;
export type LPCOLESTR = Pointer;
export type LPCY = Pointer;
export type LPDECIMAL = Pointer;
export type LPDISPPARAMS = Pointer;
export type LPEXCEPINFO = Pointer;
export type LPFONTDESC = Pointer;
export type LPLPDISPATCH = Pointer;
export type LPLPSAFEARRAY = Pointer;
export type LPLPTYPEINFO = Pointer;
export type LPLPTYPELIB = Pointer;
export type LPLPUNKNOWN = Pointer;
export type LPLPVOID = Pointer;
export type LPNUMPARSE = Pointer;
export type LPOLESTR = Pointer;
export type LPPICTDESC = Pointer;
export type LPSAFEARRAY = Pointer;
export type LPSAFEARRAYBOUND = Pointer;
export type LPSYSTEMTIME = Pointer;
export type LPUDATE = Pointer;
export type LPVARIANT = Pointer;
export type LPVARIANTARG = Pointer;
export type MEMBERID = DISPID;
export type OCPFIPARAMS = Pointer;
export type PCOLORREF = Pointer;
export type PCY = Pointer;
export type PDECIMAL = Pointer;
export type PFONTDESC = Pointer;
export type PMEMID = Pointer;
export type POCPFIPARAMS = Pointer;
export type PPICTDESC = Pointer;
export type PSAFEARRAY = Pointer;
export type PSAFEARRAYBOUND = Pointer;
export type PVARTYPE = Pointer;
export type REFCLSID = Pointer;
export type REFGUID = Pointer;
export type REFIID = Pointer;
export type SAFEARRAY = Pointer;
export type SCODE = LONG;
export type VARIANT_BOOL = SHORT;
export type VARTYPE = USHORT;
