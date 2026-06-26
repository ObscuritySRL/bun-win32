import type { Pointer } from 'bun:ffi';

export type { ACCESS_MASK, BOOL, DWORD, HANDLE, LPCWSTR, LPSECURITY_ATTRIBUTES, LPVOID, LPWSTR, NULL, Nullable, Optional, PBYTE, PULONG, PVOID, ULONG, USHORT } from '@bun-win32/core';

export const CLFS_BASELOG_EXTENSION = '.blf';
export const CLFS_FLAG_FORCE_APPEND = 0x0000_0001;
export const CLFS_FLAG_FORCE_FLUSH = 0x0000_0002;
export const CLFS_FLAG_NO_FLAGS = 0x0000_0000;
export const CLFS_FLAG_USE_RESERVATION = 0x0000_0004;
export const CLFS_LSN_INVALID = 0xffff_ffff_ffff_ffffn;
export const CLFS_LSN_NULL = 0x0000_0000_0000_0000n;
export const CLFS_MARSHALLING_FLAG_DISABLE_BUFF_INIT = 0x0000_0001;
export const CLFS_MARSHALLING_FLAG_NONE = 0x0000_0000;
export const FILE_ATTRIBUTE_NORMAL = 0x0000_0080;
export const FILE_SHARE_READ = 0x0000_0001;
export const FILE_SHARE_WRITE = 0x0000_0002;
export const GENERIC_READ = 0x8000_0000;
export const GENERIC_WRITE = 0x4000_0000;
export const INVALID_HANDLE_VALUE = 0xffff_ffff_ffff_ffffn;
export const OPEN_ALWAYS = 0x0000_0004;
export const OPEN_EXISTING = 0x0000_0003;

export enum CLFS_CONTEXT_MODE {
  ClfsContextForward = 0x03,
  ClfsContextNone = 0x00,
  ClfsContextPrevious = 0x02,
  ClfsContextUndoNext = 0x01,
}

export enum CLFS_IOSTATS_CLASS {
  ClfsIoStatsDefault = 0x0000,
  ClfsIoStatsMax = 0xffff,
}

export enum CLFS_LOG_ARCHIVE_MODE {
  ClfsLogArchiveDisabled = 0x02,
  ClfsLogArchiveEnabled = 0x01,
}

export enum CLFS_MGMT_POLICY_TYPE {
  ClfsMgmtPolicyAutoGrow = 0x06,
  ClfsMgmtPolicyAutoShrink = 0x05,
  ClfsMgmtPolicyGrowthRate = 0x03,
  ClfsMgmtPolicyInvalid = 0x0a,
  ClfsMgmtPolicyLogTail = 0x04,
  ClfsMgmtPolicyMaximumSize = 0x00,
  ClfsMgmtPolicyMinimumSize = 0x01,
  ClfsMgmtPolicyNewContainerExtension = 0x09,
  ClfsMgmtPolicyNewContainerPrefix = 0x07,
  ClfsMgmtPolicyNewContainerSize = 0x02,
  ClfsMgmtPolicyNewContainerSuffix = 0x08,
}

export enum CLFS_RECORD_TYPE {
  ClfsClientRecord = 0x03,
  ClfsDataRecord = 0x01,
  ClfsNullRecord = 0x00,
  ClfsRestartRecord = 0x02,
}

export enum CLFS_SCAN_MODE {
  CLFS_SCAN_BACKWARD = 0x04,
  CLFS_SCAN_BUFFERED = 0x20,
  CLFS_SCAN_CLOSE = 0x08,
  CLFS_SCAN_FORWARD = 0x02,
  CLFS_SCAN_INIT = 0x01,
  CLFS_SCAN_INITIALIZED = 0x10,
}

export type CLFS_BLOCK_ALLOCATION = Pointer;
export type CLFS_BLOCK_DEALLOCATION = Pointer;
export type CLFS_CONTAINER_ID = number;
export type CLFS_LOG_ARCHIVE_CONTEXT = bigint;
export type CLFS_LSN = bigint;
export type CLFS_MARSHAL = bigint;
export type CLFS_PRINT_RECORD_ROUTINE = Pointer;
export type CLFS_READ_CONTEXT = bigint;
export type LPOVERLAPPED = Pointer;
export type PCLFS_ARCHIVE_DESCRIPTOR = Pointer;
export type PCLFS_INFORMATION = Pointer;
export type PCLFS_LOG_ARCHIVE_CONTEXT = Pointer;
export type PCLFS_LSN = Pointer;
export type PCLFS_MGMT_NOTIFICATION = Pointer;
export type PCLFS_MGMT_POLICY = Pointer;
export type PCLFS_RECORD_TYPE = Pointer;
export type PCLFS_SCAN_CONTEXT = Pointer;
export type PCLFS_WRITE_ENTRY = Pointer;
export type PFILE = Pointer;
export type PLOG_MANAGEMENT_CALLBACKS = Pointer;
export type PLONGLONG = Pointer;
export type PLPWSTR = Pointer;
export type PULONGLONG = Pointer;
export type PWSTR = Pointer;
