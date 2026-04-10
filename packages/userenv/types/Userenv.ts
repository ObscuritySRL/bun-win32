import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, HANDLE, HRESULT, LPBOOL, LPCSTR, LPCWSTR, LPDWORD, LPSTR, LPVOID, LPWSTR, NULL } from '@bun-win32/core';

export type ASYNCCOMPLETIONHANDLE = bigint;
export type LPLPVOID = Pointer;
export type LPPOLICYSETTINGSTATUSINFO = Pointer;
export type LPPROFILEINFOA = Pointer;
export type LPPROFILEINFOW = Pointer;
export type PGENERIC_MAPPING = Pointer;
export type PGROUP_POLICY_OBJECTA = Pointer;
export type PGROUP_POLICY_OBJECTW = Pointer;
export type PHKEY = Pointer;
export type PIWbemClassObject = Pointer;
export type PIWbemServices = Pointer;
export type POBJECT_TYPE_LIST = Pointer;
export type PPRIVILEGE_SET = Pointer;
export type PRSOPTOKEN = Pointer;
export type PSECURITY_DESCRIPTOR = Pointer;
export type PSID = Pointer;
export type PSID_AND_ATTRIBUTES = Pointer;
export type REFGPEXTENSIONID = Pointer;
export type REGSAM = number;

export const GPO_LIST_FLAG_MACHINE = 0x0000_0001;
export const GPO_LIST_FLAG_NO_SECURITYFILTERS = 0x0000_0008;
export const GPO_LIST_FLAG_NO_WMIFILTERS = 0x0000_0004;
export const GPO_LIST_FLAG_SITEONLY = 0x0000_0002;

export const PI_APPLYPOLICY = 0x0000_0002;
export const PI_NOUI = 0x0000_0001;

export const PT_MANDATORY = 0x0000_0004;
export const PT_ROAMING = 0x0000_0002;
export const PT_ROAMING_PREEXISTING = 0x0000_0008;
export const PT_TEMPORARY = 0x0000_0001;

export const RP_FORCE = 1;
export const RP_SYNC = 2;
