import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, HANDLE, HWND, LPBOOL, LPBYTE, LPCSTR, LPCWSTR, LPDWORD, LPSTR, LPVOID, LPWSTR, NULL, OPTIONAL, UINT, VOID } from '@bun-win32/core';

export enum RASPROJECTION {
  RASP_Amb = 0x0001_0000,
  RASP_PppCcp = 0x0000_80fd,
  RASP_PppIp = 0x0000_8021,
  RASP_PppIpv6 = 0x0000_8057,
  RASP_PppIpx = 0x0000_802b,
  RASP_PppLcp = 0x0000_c021,
  RASP_PppNbf = 0x0000_803f,
  RASP_Slip = 0x0002_0000,
}

export type HRASCONN = bigint;
export type LPHRASCONN = Pointer;
export type LPRASAUTODIALENTRYA = Pointer;
export type LPRASAUTODIALENTRYW = Pointer;
export type LPRASCONNA = Pointer;
export type LPRASCONNSTATUSA = Pointer;
export type LPRASCONNSTATUSW = Pointer;
export type LPRASCONNW = Pointer;
export type LPRASCREDENTIALSA = Pointer;
export type LPRASCREDENTIALSW = Pointer;
export type LPRASCTRYINFOA = Pointer;
export type LPRASCTRYINFOW = Pointer;
export type LPRASDEVINFOA = Pointer;
export type LPRASDEVINFOW = Pointer;
export type LPRASDIALEXTENSIONS = Pointer;
export type LPRASDIALPARAMSA = Pointer;
export type LPRASDIALPARAMSW = Pointer;
export type LPRASEAPUSERIDENTITYA = Pointer;
export type LPRASEAPUSERIDENTITYW = Pointer;
export type LPRASENTRYA = Pointer;
export type LPRASENTRYNAMEA = Pointer;
export type LPRASENTRYNAMEW = Pointer;
export type LPRASENTRYW = Pointer;
export type LPRASNAPSTATE = Pointer;
export type LPRASSUBENTRYA = Pointer;
export type LPRASSUBENTRYW = Pointer;
export type LPRASUPDATECONN = Pointer;
export type LPRAS_STATS = Pointer;
export type PLPRASEAPUSERIDENTITYA = Pointer;
export type PLPRASEAPUSERIDENTITYW = Pointer;
export type PLPSTR = Pointer;
export type PLPWSTR = Pointer;
export type PRAS_PROJECTION_INFO = Pointer;
