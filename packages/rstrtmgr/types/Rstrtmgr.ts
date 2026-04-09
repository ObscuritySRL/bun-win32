import type { Pointer } from 'bun:ffi';

export type { DWORD, LPCWSTR, LPDWORD, LPWSTR, NULL, PBYTE, UINT, ULONG } from '@bun-win32/core';

export const CCH_RM_MAX_APP_NAME = 255;
export const CCH_RM_MAX_SVC_NAME = 63;
export const CCH_RM_SESSION_KEY = 32;
export const RM_INVALID_PROCESS = -1;
export const RM_INVALID_TS_SESSION = -1;
export const RM_SESSION_KEY_LEN = 16;

export enum RM_APP_STATUS {
  RmStatusErrorOnRestart = 0x0000_0020,
  RmStatusErrorOnStop = 0x0000_0010,
  RmStatusRestartMasked = 0x0000_0080,
  RmStatusRestarted = 0x0000_0008,
  RmStatusRunning = 0x0000_0001,
  RmStatusShutdownMasked = 0x0000_0040,
  RmStatusStopped = 0x0000_0002,
  RmStatusStoppedOther = 0x0000_0004,
  RmStatusUnknown = 0x0000_0000,
}

export enum RM_APP_TYPE {
  RmConsole = 5,
  RmCritical = 1_000,
  RmExplorer = 4,
  RmMainWindow = 1,
  RmOtherWindow = 2,
  RmService = 3,
  RmUnknownApp = 0,
}

export enum RM_FILTER_ACTION {
  RmInvalidFilterAction = 0,
  RmNoRestart = 1,
  RmNoShutdown = 2,
}

export enum RM_FILTER_TRIGGER {
  RmFilterTriggerFile = 1,
  RmFilterTriggerInvalid = 0,
  RmFilterTriggerProcess = 2,
  RmFilterTriggerService = 3,
}

export enum RM_REBOOT_REASON {
  RmRebootReasonCriticalProcess = 0x0000_0004,
  RmRebootReasonCriticalService = 0x0000_0008,
  RmRebootReasonDetectedSelf = 0x0000_0010,
  RmRebootReasonNone = 0x0000_0000,
  RmRebootReasonPermissionDenied = 0x0000_0001,
  RmRebootReasonSessionMismatch = 0x0000_0002,
}

export enum RM_SHUTDOWN_TYPE {
  RmForceShutdown = 0x0000_0001,
  RmShutdownOnlyRegistered = 0x0000_0010,
}

export type PLPCWSTR = Pointer;
export type PRM_PROCESS_INFO = Pointer;
export type PRM_UNIQUE_PROCESS = Pointer;
export type RM_WRITE_STATUS_CALLBACK = Pointer;
