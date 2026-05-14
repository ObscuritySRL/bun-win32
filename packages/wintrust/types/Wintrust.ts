import type { Pointer } from 'bun:ffi';

export type { BOOL, BYTE, DWORD, HANDLE, HRESULT, HWND, LONG, LPCSTR, LPCWSTR, LPSTR, LPVOID, LPWSTR, NULL, PBYTE, PDWORD, PVOID } from '@bun-win32/core';

export const CRYPTCAT_ADDCATALOG_HARDLINK = 0x0000_0001;

export const PKCS_7_ASN_ENCODING = 0x0001_0000;
export const X509_ASN_ENCODING = 0x0000_0001;

export const WT_ADD_ACTION_ID_RET_RESULT_FLAG = 0x0000_0001;
export const WT_TRUSTDBDIALOG_ONLY_PUB_TAB_FLAG = 0x0000_0002;

// Authenticode and trust-provider action GUIDs (16 bytes each, in on-the-wire byte order).
// Pass `.ptr` to WinVerifyTrust / WinVerifyTrustEx / WintrustLoadFunctionPointers.
// Layout: DWORD Data1 (LE) | WORD Data2 (LE) | WORD Data3 (LE) | BYTE Data4[8].
// {F750E6C3-38EE-11D1-85E5-00C04FC295EE}
export const DRIVER_ACTION_VERIFY = Buffer.from([0xc3, 0xe6, 0x50, 0xf7, 0xee, 0x38, 0xd1, 0x11, 0x85, 0xe5, 0x00, 0xc0, 0x4f, 0xc2, 0x95, 0xee]);
// {573E31F8-AABA-11D0-8CCB-00C04FC295EE}
export const HTTPSPROV_ACTION = Buffer.from([0xf8, 0x31, 0x3e, 0x57, 0xba, 0xaa, 0xd0, 0x11, 0x8c, 0xcb, 0x00, 0xc0, 0x4f, 0xc2, 0x95, 0xee]);
// {189A3842-3041-11D1-85E1-00C04FC295EE}
export const WINTRUST_ACTION_GENERIC_CERT_VERIFY = Buffer.from([0x42, 0x38, 0x9a, 0x18, 0x41, 0x30, 0xd1, 0x11, 0x85, 0xe1, 0x00, 0xc0, 0x4f, 0xc2, 0x95, 0xee]);
// {FC451C16-AC75-11D1-B4B8-00C04FB66EA0}
export const WINTRUST_ACTION_GENERIC_CHAIN_VERIFY = Buffer.from([0x16, 0x1c, 0x45, 0xfc, 0x75, 0xac, 0xd1, 0x11, 0xb4, 0xb8, 0x00, 0xc0, 0x4f, 0xb6, 0x6e, 0xa0]);
// {00AAC56B-CD44-11D0-8CC2-00C04FC295EE}
export const WINTRUST_ACTION_GENERIC_VERIFY_V2 = Buffer.from([0x6b, 0xc5, 0xaa, 0x00, 0x44, 0xcd, 0xd0, 0x11, 0x8c, 0xc2, 0x00, 0xc0, 0x4f, 0xc2, 0x95, 0xee]);
// {573E31F8-DDBA-11D0-8CCB-00C04FC295EE}
export const WINTRUST_ACTION_TRUSTPROVIDER_TEST = Buffer.from([0xf8, 0x31, 0x3e, 0x57, 0xba, 0xdd, 0xd0, 0x11, 0x8c, 0xcb, 0x00, 0xc0, 0x4f, 0xc2, 0x95, 0xee]);

export enum CryptCatOpenFlag {
  CRYPTCAT_OPEN_ALWAYS = 0x0000_0002,
  CRYPTCAT_OPEN_CREATENEW = 0x0000_0001,
  CRYPTCAT_OPEN_EXCLUDE_PAGE_HASHES = 0x0001_0000,
  CRYPTCAT_OPEN_EXISTING = 0x0000_0004,
  CRYPTCAT_OPEN_INCLUDE_PAGE_HASHES = 0x0002_0000,
  CRYPTCAT_OPEN_NO_CONTENT_HCRYPTMSG = 0x2000_0000,
  CRYPTCAT_OPEN_SORTED = 0x4000_0000,
  CRYPTCAT_OPEN_VERIFYSIGHASH = 0x1000_0000,
}

export enum CryptCatVersion {
  CRYPTCAT_VERSION_1 = 0x0000_0100,
  CRYPTCAT_VERSION_2 = 0x0000_0200,
}

export enum WintrustDefaultUsageAction {
  DWACTION_ALLOCANDFILL = 0x0000_0001,
  DWACTION_FREE = 0x0000_0002,
}

export enum WintrustPolicyFlag {
  WTPF_ALLOWONLYPERTRUST = 0x0004_0000,
  WTPF_IGNOREEXPIRATION = 0x0000_0010,
  WTPF_IGNOREREVOCATIONONTS = 0x0002_0000,
  WTPF_IGNOREREVOKATION = 0x0000_0200,
  WTPF_OFFLINEOKNBU_COM = 0x0000_2000,
  WTPF_OFFLINEOKNBU_IND = 0x0000_1000,
  WTPF_OFFLINEOK_COM = 0x0000_0800,
  WTPF_OFFLINEOK_IND = 0x0000_0400,
  WTPF_TESTCANBEVALID = 0x0000_0080,
  WTPF_TRUSTTEST = 0x0000_0020,
  WTPF_VERIFY_V1_OFF = 0x0001_0000,
}

export type HCATADMIN = bigint;
export type HCATINFO = bigint;
export type HCRYPTPROV = bigint;
export type LPGUID = Pointer;
export type PCATALOG_INFO = Pointer;
export type PCCERT_STRONG_SIGN_PARA = Pointer;
export type PCRYPTCATATTRIBUTE = Pointer;
export type PCRYPTCATMEMBER = Pointer;
export type PCRYPT_PROVIDER_CERT = Pointer;
export type PCRYPT_PROVIDER_DATA = Pointer;
export type PCRYPT_PROVIDER_DEFUSAGE = Pointer;
export type PCRYPT_PROVIDER_FUNCTIONS = Pointer;
export type PCRYPT_PROVIDER_REGDEFUSAGE = Pointer;
export type PCRYPT_PROVIDER_SGNR = Pointer;
export type PCRYPT_REGISTER_ACTIONID = Pointer;
export type PCSTR = Pointer;
export type PCWSTR = Pointer;
export type PHCATINFO = Pointer;
export type PSIP_INDIRECT_DATA = Pointer;
export type PSIP_SUBJECTINFO = Pointer;
export type PWSTR = Pointer;
