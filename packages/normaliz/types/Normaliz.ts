export type { BOOL, DWORD, INT, LPCWSTR, LPWSTR, NULL } from '@bun-win32/core';

export enum IdnFlags {
  IDN_ALLOW_UNASSIGNED = 0x0000_0001,
  IDN_EMAIL_ADDRESS = 0x0000_0004,
  IDN_RAW_PUNYCODE = 0x0000_0008,
  IDN_USE_STD3_ASCII_RULES = 0x0000_0002,
}

export enum NormalizationForm {
  NormalizationC = 0x0000_0001,
  NormalizationD = 0x0000_0002,
  NormalizationKC = 0x0000_0005,
  NormalizationKD = 0x0000_0006,
  NormalizationOther = 0x0000_0000,
}
