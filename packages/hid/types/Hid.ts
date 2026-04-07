import type { Pointer } from 'bun:ffi';

export type { BOOLEAN, HANDLE, LONG, NULL, PULONG, PVOID, ULONG, USHORT, VOID } from '@bun-win32/core';

export const HIDP_STATUS_BAD_LOG_PHY_VALUES = 0xc011_0006 | 0;
export const HIDP_STATUS_BUFFER_TOO_SMALL = 0xc011_0007 | 0;
export const HIDP_STATUS_BUTTON_NOT_PRESSED = 0xc011_000f | 0;
export const HIDP_STATUS_DATA_INDEX_NOT_FOUND = 0xc011_000d | 0;
export const HIDP_STATUS_DATA_INDEX_OUT_OF_RANGE = 0xc011_000e | 0;
export const HIDP_STATUS_I8042_TRANS_UNKNOWN = 0xc011_0009 | 0;
export const HIDP_STATUS_INCOMPATIBLE_REPORT_ID = 0xc011_000a | 0;
export const HIDP_STATUS_INTERNAL_ERROR = 0xc011_0008 | 0;
export const HIDP_STATUS_INVALID_PREPARSED_DATA = 0xc011_0001 | 0;
export const HIDP_STATUS_INVALID_REPORT_LENGTH = 0xc011_0003 | 0;
export const HIDP_STATUS_INVALID_REPORT_TYPE = 0xc011_0002 | 0;
export const HIDP_STATUS_IS_VALUE_ARRAY = 0xc011_000c | 0;
export const HIDP_STATUS_NOT_BUTTON_ARRAY = 0xc011_0011 | 0;
export const HIDP_STATUS_NOT_IMPLEMENTED = 0xc011_0020 | 0;
export const HIDP_STATUS_NOT_VALUE_ARRAY = 0xc011_000b | 0;
export const HIDP_STATUS_NULL = 0x8011_0001 | 0;
export const HIDP_STATUS_REPORT_DOES_NOT_EXIST = 0xc011_0010 | 0;
export const HIDP_STATUS_SUCCESS = 0x0011_0000;
export const HIDP_STATUS_USAGE_NOT_FOUND = 0xc011_0004 | 0;
export const HIDP_STATUS_VALUE_OUT_OF_RANGE = 0xc011_0005 | 0;

export enum HIDP_KEYBOARD_DIRECTION {
  HidP_Keyboard_Break = 0,
  HidP_Keyboard_Make = 1,
}

export enum HIDP_REPORT_TYPE {
  HidP_Feature = 2,
  HidP_Input = 0,
  HidP_Output = 1,
}

export type LPGUID = Pointer;
export type NTSTATUS = number;
export type PCHAR = Pointer;
export type PHIDD_ATTRIBUTES = Pointer;
export type PHIDD_CONFIGURATION = Pointer;
export type PHIDP_BUTTON_ARRAY_DATA = Pointer;
export type PHIDP_BUTTON_CAPS = Pointer;
export type PHIDP_CAPS = Pointer;
export type PHIDP_DATA = Pointer;
export type PHIDP_EXTENDED_ATTRIBUTES = Pointer;
export type PHIDP_INSERT_SCANCODES = Pointer;
export type PHIDP_KEYBOARD_MODIFIER_STATE = Pointer;
export type PHIDP_LINK_COLLECTION_NODE = Pointer;
export type PHIDP_PREPARSED_DATA = Pointer;
export type PHIDP_VALUE_CAPS = Pointer;
export type PLONG = Pointer;
export type PUSAGE = Pointer;
export type PUSAGE_AND_PAGE = Pointer;
export type PUSHORT = Pointer;
export type UCHAR = number;
export type USAGE = number;
