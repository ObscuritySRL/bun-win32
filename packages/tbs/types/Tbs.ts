import type { Pointer } from 'bun:ffi';

export type { HRESULT, LPBOOL, OPTIONAL, PBYTE, PVOID } from '@bun-win32/core';

export const TBS_COMMAND_LOCALITY_ZERO = 0;
export const TBS_COMMAND_LOCALITY_ONE = 1;
export const TBS_COMMAND_LOCALITY_TWO = 2;
export const TBS_COMMAND_LOCALITY_THREE = 3;
export const TBS_COMMAND_LOCALITY_FOUR = 4;

export const TBS_COMMAND_PRIORITY_LOW = 100;
export const TBS_COMMAND_PRIORITY_NORMAL = 200;
export const TBS_COMMAND_PRIORITY_HIGH = 300;
export const TBS_COMMAND_PRIORITY_SYSTEM = 400;
export const TBS_COMMAND_PRIORITY_MAX = 0x8000_0000;

export const TBS_CONTEXT_VERSION_ONE = 1;
export const TBS_CONTEXT_VERSION_TWO = 2;

export const TBS_IN_OUT_BUF_SIZE_MAX = 256 * 1024;

export const TBS_OWNERAUTH_TYPE_FULL = 1;
export const TBS_OWNERAUTH_TYPE_ADMIN = 2;
export const TBS_OWNERAUTH_TYPE_USER = 3;
export const TBS_OWNERAUTH_TYPE_ENDORSEMENT = 4;
export const TBS_OWNERAUTH_TYPE_ENDORSEMENT_20 = 12;
export const TBS_OWNERAUTH_TYPE_STORAGE_20 = 13;

export const TBS_SUCCESS = 0;

export const TBS_TCGLOG_SRTM_CURRENT = 0;
export const TBS_TCGLOG_DRTM_CURRENT = 1;
export const TBS_TCGLOG_SRTM_BOOT = 2;
export const TBS_TCGLOG_SRTM_RESUME = 3;
export const TBS_TCGLOG_DRTM_BOOT = 4;
export const TBS_TCGLOG_DRTM_RESUME = 5;

export const TPM_VERSION_UNKNOWN = 0;
export const TPM_VERSION_12 = 1;
export const TPM_VERSION_20 = 2;

export const TPM_IFTYPE_UNKNOWN = 0;
export const TPM_IFTYPE_1 = 1;
export const TPM_IFTYPE_TRUSTZONE = 2;
export const TPM_IFTYPE_HW = 3;
export const TPM_IFTYPE_EMULATOR = 4;
export const TPM_IFTYPE_SPB = 5;

export type PCBYTE = Pointer;
export type PCTBS_CONTEXT_PARAMS = Pointer;
export type PTBS_HCONTEXT = Pointer;
export type PUINT32 = Pointer;
export type PWSTR = Pointer;
export type TBS_COMMAND_LOCALITY = number;
export type TBS_COMMAND_PRIORITY = number;
export type TBS_HANDLE = number;
export type TBS_HCONTEXT = bigint;
export type TBS_OWNERAUTH_TYPE = number;
export type TBS_RESULT = number;
export type UINT32 = number;
