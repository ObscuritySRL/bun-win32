import type { Pointer } from 'bun:ffi';

export type { BOOL, BOOLEAN, DWORD, HANDLE, HRESULT, LPARAM, LPBYTE, LPCWSTR, LPDWORD, NULL, PBYTE, PULONG, PVOID, UINT, ULONG } from '@bun-win32/core';

export const NO_SUBGROUP_GUID = Buffer.from([0x3e, 0x41, 0xa3, 0xfe, 0x05, 0x7e, 0x11, 0x49, 0x9a, 0x71, 0x70, 0x03, 0x31, 0xf1, 0xc2, 0x94]);

export enum POWER_DATA_ACCESSOR {
  ACCESS_AC_POWER_SETTING_INDEX = 0x00,
  ACCESS_AC_POWER_SETTING_MAX = 0x15,
  ACCESS_AC_POWER_SETTING_MIN = 0x17,
  ACCESS_ACTIVE_OVERLAY_SCHEME = 0x1b,
  ACCESS_ACTIVE_SCHEME = 0x13,
  ACCESS_ATTRIBUTES = 0x0f,
  ACCESS_CREATE_SCHEME = 0x14,
  ACCESS_DC_POWER_SETTING_INDEX = 0x01,
  ACCESS_DC_POWER_SETTING_MAX = 0x16,
  ACCESS_DC_POWER_SETTING_MIN = 0x18,
  ACCESS_DEFAULT_AC_POWER_SETTING = 0x07,
  ACCESS_DEFAULT_DC_POWER_SETTING = 0x08,
  ACCESS_DEFAULT_SECURITY_DESCRIPTOR = 0x0e,
  ACCESS_DESCRIPTION = 0x03,
  ACCESS_FRIENDLY_NAME = 0x02,
  ACCESS_ICON_RESOURCE = 0x0d,
  ACCESS_INDIVIDUAL_SETTING = 0x12,
  ACCESS_OVERLAY_SCHEME = 0x1a,
  ACCESS_POSSIBLE_POWER_SETTING = 0x04,
  ACCESS_POSSIBLE_POWER_SETTING_DESCRIPTION = 0x06,
  ACCESS_POSSIBLE_POWER_SETTING_FRIENDLY_NAME = 0x05,
  ACCESS_POSSIBLE_VALUE_INCREMENT = 0x0b,
  ACCESS_POSSIBLE_VALUE_MAX = 0x0a,
  ACCESS_POSSIBLE_VALUE_MIN = 0x09,
  ACCESS_POSSIBLE_VALUE_UNITS = 0x0c,
  ACCESS_PROFILE = 0x19,
  ACCESS_SCHEME = 0x10,
  ACCESS_SUBGROUP = 0x11,
}

export enum POWER_INFORMATION_LEVEL {
  AdministratorPowerPolicy = 0x09,
  LastSleepTime = 0x0f,
  LastWakeTime = 0x0e,
  MonitorCapabilities = 0x29,
  MonitorInvocation = 0x28,
  NotifyUserPowerSetting = 0x1a,
  PowerInformationLevelUnused0 = 0x1b,
  PowerShutdownNotification = 0x27,
  ProcessorCap = 0x22,
  ProcessorIdleStates = 0x21,
  ProcessorInformation = 0x0b,
  ProcessorLoad = 0x26,
  ProcessorPerfStates = 0x20,
  ProcessorPowerPolicyAc = 0x12,
  ProcessorPowerPolicyCurrent = 0x16,
  ProcessorPowerPolicyDc = 0x13,
  ProcessorStateHandler = 0x07,
  ProcessorStateHandler2 = 0x0d,
  SetPowerSettingValue = 0x19,
  SystemBatteryState = 0x05,
  SystemExecutionState = 0x10,
  SystemHiberFileInformation = 0x24,
  SystemMonitorHiberBootPowerOff = 0x1c,
  SystemPowerCapabilities = 0x04,
  SystemPowerInformation = 0x0c,
  SystemPowerLoggingEntry = 0x18,
  SystemPowerPolicyAc = 0x00,
  SystemPowerPolicyCurrent = 0x08,
  SystemPowerPolicyDc = 0x01,
  SystemPowerStateHandler = 0x06,
  SystemPowerStateLogging = 0x17,
  SystemPowerStateNotifyHandler = 0x11,
  SystemReserveHiberFile = 0x0a,
  SystemVideoState = 0x1d,
  SystemWakeSource = 0x23,
  TraceApplicationPowerMessage = 0x1e,
  TraceApplicationPowerMessageEnd = 0x1f,
  TraceServicePowerMessage = 0x25,
  VerifyProcessorPowerPolicyAc = 0x14,
  VerifyProcessorPowerPolicyDc = 0x15,
  VerifySystemPolicyAc = 0x02,
  VerifySystemPolicyDc = 0x03,
}

export enum POWER_PLATFORM_ROLE {
  PlatformRoleAppliancePC = 0x06,
  PlatformRoleDesktop = 0x01,
  PlatformRoleEnterpriseServer = 0x04,
  PlatformRoleMaximum = 0x09,
  PlatformRoleMobile = 0x02,
  PlatformRolePerformanceServer = 0x07,
  PlatformRoleSlate = 0x08,
  PlatformRoleSOHOServer = 0x05,
  PlatformRoleUnspecified = 0x00,
  PlatformRoleWorkstation = 0x03,
}

export type EFFECTIVE_POWER_MODE_CALLBACK = Pointer;
export type HKEY = bigint;
export type HPOWERNOTIFY = bigint;
export type LPCGUID = Pointer;
export type LPGUID = Pointer;
export type NTSTATUS = number;
export type PADMINISTRATOR_POWER_POLICY = Pointer;
export type PGLOBAL_POWER_POLICY = Pointer;
export type PHPOWERNOTIFY = Pointer;
export type PMACHINE_PROCESSOR_POWER_POLICY = Pointer;
export type PPOWER_POLICY = Pointer;
export type PSYSTEM_POWER_CAPABILITIES = Pointer;
export type PTHERMAL_EVENT = Pointer;
export type PUCHAR = Pointer;
export type PUINT = Pointer;
export type PWRSCHEMESENUMPROC = Pointer;
export type REGSAM = number;
