import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, HWND, INT, LPDWORD, NULL, NULLABLE } from '@bun-win32/core';

export const MS_CLIPAROUNDCURSOR = 0x0000_0002;
export const MS_INVERTCOLORS = 0x0000_0004;
export const MS_SHOWMAGNIFIEDCURSOR = 0x0000_0001;
export const WC_MAGNIFIER = 'Magnifier';

export enum FilterMode {
  MW_FILTERMODE_EXCLUDE = 0,
  MW_FILTERMODE_INCLUDE = 1,
}

export type FLOAT = number;
export type LPRECT = Pointer;
export type MagImageScalingCallback = Pointer;
export type PBOOL = Pointer;
export type PFLOAT = Pointer;
export type PHWND = Pointer;
export type PINT = Pointer;
export type PMAGCOLOREFFECT = Pointer;
export type PMAGTRANSFORM = Pointer;
export type PRECT = Pointer;
export type RECT = Pointer;
