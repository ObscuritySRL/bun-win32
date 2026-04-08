import { type FFIFunction, FFIType } from 'bun:ffi';
import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  BOOLEAN,
  DWORD,
  EFFECTIVE_POWER_MODE_CALLBACK,
  HANDLE,
  HKEY,
  HPOWERNOTIFY,
  HRESULT,
  LPCGUID,
  LPCWSTR,
  LPDWORD,
  LPGUID,
  LPARAM,
  LPBYTE,
  NULL,
  NTSTATUS,
  PADMINISTRATOR_POWER_POLICY,
  PBYTE,
  PGLOBAL_POWER_POLICY,
  PHPOWERNOTIFY,
  PMACHINE_PROCESSOR_POWER_POLICY,
  POWER_DATA_ACCESSOR,
  POWER_INFORMATION_LEVEL,
  POWER_PLATFORM_ROLE,
  PPOWER_POLICY,
  PSYSTEM_POWER_CAPABILITIES,
  PTHERMAL_EVENT,
  PUCHAR,
  PUINT,
  PULONG,
  PVOID,
  PWRSCHEMESENUMPROC,
  REGSAM,
  UINT,
  ULONG,
} from '../types/PowrProf';

/**
 * Thin, lazy-loaded FFI bindings for `powrprof.dll`.
 *
 * Each static method corresponds one-to-one with a Win32 export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * @example
 * ```ts
 * import PowrProf from './structs/PowrProf';
 *
 * // Lazy: bind on first call
 * const result = PowrProf.GetPwrCapabilities(buffer.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * PowrProf.Preload(['GetPwrCapabilities', 'PowerGetActiveScheme']);
 * ```
 */
class PowrProf extends Win32 {
  protected static override name = 'powrprof.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CallNtPowerInformation: { args: [FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CanUserWritePwrScheme: { args: [], returns: FFIType.u8 },
    DeletePwrScheme: { args: [FFIType.u32], returns: FFIType.u8 },
    DevicePowerClose: { args: [], returns: FFIType.u8 },
    DevicePowerEnumDevices: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    DevicePowerOpen: { args: [FFIType.u32], returns: FFIType.u8 },
    DevicePowerSetDeviceState: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    EnumPwrSchemes: { args: [FFIType.ptr, FFIType.i64], returns: FFIType.u8 },
    GetActivePwrScheme: { args: [FFIType.ptr], returns: FFIType.u8 },
    GetCurrentPowerPolicies: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    GetPwrCapabilities: { args: [FFIType.ptr], returns: FFIType.u8 },
    GetPwrDiskSpindownRange: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    IsAdminOverrideActive: { args: [FFIType.ptr], returns: FFIType.u8 },
    IsPwrHibernateAllowed: { args: [], returns: FFIType.u8 },
    IsPwrShutdownAllowed: { args: [], returns: FFIType.u8 },
    IsPwrSuspendAllowed: { args: [], returns: FFIType.u8 },
    PowerCanRestoreIndividualDefaultPowerScheme: { args: [FFIType.ptr], returns: FFIType.u32 },
    PowerCreatePossibleSetting: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerCreateSetting: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerDeleteScheme: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    PowerDeterminePlatformRole: { args: [], returns: FFIType.i32 },
    PowerDeterminePlatformRoleEx: { args: [FFIType.u32], returns: FFIType.i32 },
    PowerDuplicateScheme: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerEnumerate: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerGetActiveScheme: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    PowerGetUserConfiguredACPowerMode: { args: [FFIType.ptr], returns: FFIType.u32 },
    PowerGetUserConfiguredDCPowerMode: { args: [FFIType.ptr], returns: FFIType.u32 },
    PowerImportPowerScheme: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerIsSettingRangeDefined: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    PowerOpenSystemPowerKey: { args: [FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    PowerOpenUserPowerKey: { args: [FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    PowerReadACDefaultIndex: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadACValue: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadACValueIndex: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadDCDefaultIndex: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadDCValue: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadDCValueIndex: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadDescription: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadFriendlyName: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadIconResourceSpecifier: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadPossibleDescription: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadPossibleFriendlyName: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadPossibleValue: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadSettingAttributes: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadValueIncrement: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadValueMax: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadValueMin: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReadValueUnitsSpecifier: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerRegisterForEffectivePowerModeNotifications: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PowerRegisterSuspendResumeNotification: { args: [FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    PowerRemovePowerSetting: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PowerReplaceDefaultPowerSchemes: { args: [], returns: FFIType.u32 },
    PowerReportThermalEvent: { args: [FFIType.ptr], returns: FFIType.u32 },
    PowerRestoreDefaultPowerSchemes: { args: [], returns: FFIType.u32 },
    PowerRestoreIndividualDefaultPowerScheme: { args: [FFIType.ptr], returns: FFIType.u32 },
    PowerSetActiveScheme: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    PowerSetUserConfiguredACPowerMode: { args: [FFIType.ptr], returns: FFIType.u32 },
    PowerSetUserConfiguredDCPowerMode: { args: [FFIType.ptr], returns: FFIType.u32 },
    PowerSettingAccessCheck: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    PowerSettingAccessCheckEx: { args: [FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerSettingRegisterNotification: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    PowerSettingUnregisterNotification: { args: [FFIType.u64], returns: FFIType.u32 },
    PowerUnregisterFromEffectivePowerModeNotifications: { args: [FFIType.u64], returns: FFIType.i32 },
    PowerUnregisterSuspendResumeNotification: { args: [FFIType.u64], returns: FFIType.u32 },
    PowerWriteACDefaultIndex: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerWriteACValueIndex: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerWriteDCDefaultIndex: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerWriteDCValueIndex: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerWriteDescription: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerWriteFriendlyName: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerWriteIconResourceSpecifier: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerWritePossibleDescription: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerWritePossibleFriendlyName: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerWritePossibleValue: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerWriteSettingAttributes: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerWriteValueIncrement: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerWriteValueMax: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerWriteValueMin: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PowerWriteValueUnitsSpecifier: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ReadGlobalPwrPolicy: { args: [FFIType.ptr], returns: FFIType.u8 },
    ReadProcessorPwrScheme: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u8 },
    ReadPwrScheme: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u8 },
    SetActivePwrScheme: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    SetSuspendState: { args: [FFIType.u8, FFIType.u8, FFIType.u8], returns: FFIType.u8 },
    ValidatePowerPolicies: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    WriteGlobalPwrPolicy: { args: [FFIType.ptr], returns: FFIType.u8 },
    WriteProcessorPwrScheme: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u8 },
    WritePwrScheme: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/powerbase/nf-powerbase-callntpowerinformation
  public static CallNtPowerInformation(InformationLevel: POWER_INFORMATION_LEVEL, InputBuffer: PVOID | NULL, InputBufferLength: ULONG, OutputBuffer: PVOID | NULL, OutputBufferLength: ULONG): NTSTATUS {
    return PowrProf.Load('CallNtPowerInformation')(InformationLevel, InputBuffer, InputBufferLength, OutputBuffer, OutputBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-canuserwritepwrscheme
  public static CanUserWritePwrScheme(): BOOLEAN {
    return PowrProf.Load('CanUserWritePwrScheme')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-deletepwrscheme
  public static DeletePwrScheme(uiID: UINT): BOOLEAN {
    return PowrProf.Load('DeletePwrScheme')(uiID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-devicepowerclose
  public static DevicePowerClose(): BOOLEAN {
    return PowrProf.Load('DevicePowerClose')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-devicepowerenumdevices
  public static DevicePowerEnumDevices(QueryIndex: ULONG, QueryInterpretationFlags: ULONG, QueryFlags: ULONG, pReturnBuffer: PBYTE | NULL, pBufferSize: PULONG): BOOLEAN {
    return PowrProf.Load('DevicePowerEnumDevices')(QueryIndex, QueryInterpretationFlags, QueryFlags, pReturnBuffer, pBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-devicepoweropen
  public static DevicePowerOpen(DebugMask: ULONG): BOOLEAN {
    return PowrProf.Load('DevicePowerOpen')(DebugMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-devicepowersetdevicestate
  public static DevicePowerSetDeviceState(DeviceDescription: LPCWSTR, SetFlags: ULONG, SetData: PVOID | NULL): DWORD {
    return PowrProf.Load('DevicePowerSetDeviceState')(DeviceDescription, SetFlags, SetData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-enumpwrschemes
  public static EnumPwrSchemes(lpfn: PWRSCHEMESENUMPROC, lParam: LPARAM): BOOLEAN {
    return PowrProf.Load('EnumPwrSchemes')(lpfn, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-getactivepwrscheme
  public static GetActivePwrScheme(puiID: PUINT): BOOLEAN {
    return PowrProf.Load('GetActivePwrScheme')(puiID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-getcurrentpowerpolicies
  public static GetCurrentPowerPolicies(pGlobalPowerPolicy: PGLOBAL_POWER_POLICY, pPowerPolicy: PPOWER_POLICY): BOOLEAN {
    return PowrProf.Load('GetCurrentPowerPolicies')(pGlobalPowerPolicy, pPowerPolicy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powerbase/nf-powerbase-getpwrcapabilities
  public static GetPwrCapabilities(lpspc: PSYSTEM_POWER_CAPABILITIES): BOOLEAN {
    return PowrProf.Load('GetPwrCapabilities')(lpspc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-getpwrdiskspindownrange
  public static GetPwrDiskSpindownRange(puiMax: PUINT, puiMin: PUINT): BOOLEAN {
    return PowrProf.Load('GetPwrDiskSpindownRange')(puiMax, puiMin);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-isadminoverrideactive
  public static IsAdminOverrideActive(papp: PADMINISTRATOR_POWER_POLICY): BOOLEAN {
    return PowrProf.Load('IsAdminOverrideActive')(papp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-ispwrhibernateallowed
  public static IsPwrHibernateAllowed(): BOOLEAN {
    return PowrProf.Load('IsPwrHibernateAllowed')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-ispwrshutdownallowed
  public static IsPwrShutdownAllowed(): BOOLEAN {
    return PowrProf.Load('IsPwrShutdownAllowed')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-ispwrsuspendallowed
  public static IsPwrSuspendAllowed(): BOOLEAN {
    return PowrProf.Load('IsPwrSuspendAllowed')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powercanrestoreindividualdefaultpowerscheme
  public static PowerCanRestoreIndividualDefaultPowerScheme(SchemeGuid: LPCGUID): DWORD {
    return PowrProf.Load('PowerCanRestoreIndividualDefaultPowerScheme')(SchemeGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powercreatepossiblesetting
  public static PowerCreatePossibleSetting(RootSystemPowerKey: HKEY | 0n, SubGroupOfPowerSettingsGuid: LPCGUID, PowerSettingGuid: LPCGUID, PossibleSettingIndex: ULONG): DWORD {
    return PowrProf.Load('PowerCreatePossibleSetting')(RootSystemPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid, PossibleSettingIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powercreatesetting
  public static PowerCreateSetting(RootSystemPowerKey: HKEY | 0n, SubGroupOfPowerSettingsGuid: LPCGUID, PowerSettingGuid: LPCGUID): DWORD {
    return PowrProf.Load('PowerCreateSetting')(RootSystemPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerdeletescheme
  public static PowerDeleteScheme(RootPowerKey: HKEY | 0n, SchemeGuid: LPCGUID): DWORD {
    return PowrProf.Load('PowerDeleteScheme')(RootPowerKey, SchemeGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerdetermineplatformrole
  public static PowerDeterminePlatformRole(): POWER_PLATFORM_ROLE {
    return PowrProf.Load('PowerDeterminePlatformRole')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powerbase/nf-powerbase-powerdetermineplatformroleex
  public static PowerDeterminePlatformRoleEx(Version: ULONG): POWER_PLATFORM_ROLE {
    return PowrProf.Load('PowerDeterminePlatformRoleEx')(Version);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerduplicatescheme
  public static PowerDuplicateScheme(RootPowerKey: HKEY | 0n, SourceSchemeGuid: LPCGUID, DestinationSchemeGuid: PVOID): DWORD {
    return PowrProf.Load('PowerDuplicateScheme')(RootPowerKey, SourceSchemeGuid, DestinationSchemeGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerenumerate
  public static PowerEnumerate(RootPowerKey: HKEY | 0n, SchemeGuid: LPCGUID | NULL, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, AccessFlags: POWER_DATA_ACCESSOR, Index: ULONG, Buffer: PUCHAR | NULL, BufferSize: LPDWORD): DWORD {
    return PowrProf.Load('PowerEnumerate')(RootPowerKey, SchemeGuid, SubGroupOfPowerSettingsGuid, AccessFlags, Index, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powersetting/nf-powersetting-powergetactivescheme
  public static PowerGetActiveScheme(UserRootPowerKey: HKEY | 0n, ActivePolicyGuid: PVOID): DWORD {
    return PowrProf.Load('PowerGetActiveScheme')(UserRootPowerKey, ActivePolicyGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powergetuserconfiguredacpowermode
  public static PowerGetUserConfiguredACPowerMode(PowerModeGuid: LPGUID): DWORD {
    return PowrProf.Load('PowerGetUserConfiguredACPowerMode')(PowerModeGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powergetuserconfigureddcpowermode
  public static PowerGetUserConfiguredDCPowerMode(PowerModeGuid: LPGUID): DWORD {
    return PowrProf.Load('PowerGetUserConfiguredDCPowerMode')(PowerModeGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerimportpowerscheme
  public static PowerImportPowerScheme(RootPowerKey: HKEY | 0n, ImportFileNamePath: LPCWSTR, DestinationSchemeGuid: PVOID): DWORD {
    return PowrProf.Load('PowerImportPowerScheme')(RootPowerKey, ImportFileNamePath, DestinationSchemeGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerissettingrangedefined
  public static PowerIsSettingRangeDefined(SubKeyGuid: LPCGUID | NULL, SettingGuid: LPCGUID | NULL): BOOLEAN {
    return PowrProf.Load('PowerIsSettingRangeDefined')(SubKeyGuid, SettingGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-poweropensystempowerkey
  public static PowerOpenSystemPowerKey(phSystemPowerKey: PVOID, Access: REGSAM, OpenExisting: BOOL): DWORD {
    return PowrProf.Load('PowerOpenSystemPowerKey')(phSystemPowerKey, Access, OpenExisting);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-poweropenuserpowerkey
  public static PowerOpenUserPowerKey(phUserPowerKey: PVOID, Access: REGSAM, OpenExisting: BOOL): DWORD {
    return PowrProf.Load('PowerOpenUserPowerKey')(phUserPowerKey, Access, OpenExisting);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreadacdefaultindex
  public static PowerReadACDefaultIndex(RootPowerKey: HKEY | 0n, SchemePersonalityGuid: LPCGUID, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID, AcDefaultIndex: LPDWORD): DWORD {
    return PowrProf.Load('PowerReadACDefaultIndex')(RootPowerKey, SchemePersonalityGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, AcDefaultIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powersetting/nf-powersetting-powerreadacvalue
  public static PowerReadACValue(
    RootPowerKey: HKEY | 0n,
    SchemeGuid: LPCGUID | NULL,
    SubGroupOfPowerSettingsGuid: LPCGUID | NULL,
    PowerSettingGuid: LPCGUID | NULL,
    Type: PULONG | NULL,
    Buffer: LPBYTE | NULL,
    BufferSize: LPDWORD | NULL,
  ): DWORD {
    return PowrProf.Load('PowerReadACValue')(RootPowerKey, SchemeGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, Type, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreadacvalueindex
  public static PowerReadACValueIndex(RootPowerKey: HKEY | 0n, SchemeGuid: LPCGUID | NULL, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, AcValueIndex: LPDWORD): DWORD {
    return PowrProf.Load('PowerReadACValueIndex')(RootPowerKey, SchemeGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, AcValueIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreaddcdefaultindex
  public static PowerReadDCDefaultIndex(RootPowerKey: HKEY | 0n, SchemePersonalityGuid: LPCGUID, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID, DcDefaultIndex: LPDWORD): DWORD {
    return PowrProf.Load('PowerReadDCDefaultIndex')(RootPowerKey, SchemePersonalityGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, DcDefaultIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powersetting/nf-powersetting-powerreaddcvalue
  public static PowerReadDCValue(RootPowerKey: HKEY | 0n, SchemeGuid: LPCGUID | NULL, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, Type: PULONG | NULL, Buffer: PUCHAR | NULL, BufferSize: LPDWORD): DWORD {
    return PowrProf.Load('PowerReadDCValue')(RootPowerKey, SchemeGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, Type, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreaddcvalueindex
  public static PowerReadDCValueIndex(RootPowerKey: HKEY | 0n, SchemeGuid: LPCGUID | NULL, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, DcValueIndex: LPDWORD): DWORD {
    return PowrProf.Load('PowerReadDCValueIndex')(RootPowerKey, SchemeGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, DcValueIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreaddescription
  public static PowerReadDescription(RootPowerKey: HKEY | 0n, SchemeGuid: LPCGUID | NULL, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, Buffer: PUCHAR | NULL, BufferSize: LPDWORD): DWORD {
    return PowrProf.Load('PowerReadDescription')(RootPowerKey, SchemeGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreadfriendlyname
  public static PowerReadFriendlyName(RootPowerKey: HKEY | 0n, SchemeGuid: LPCGUID | NULL, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, Buffer: PUCHAR | NULL, BufferSize: LPDWORD): DWORD {
    return PowrProf.Load('PowerReadFriendlyName')(RootPowerKey, SchemeGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreadiconresourcespecifier
  public static PowerReadIconResourceSpecifier(RootPowerKey: HKEY | 0n, SchemeGuid: LPCGUID | NULL, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, Buffer: PUCHAR | NULL, BufferSize: LPDWORD): DWORD {
    return PowrProf.Load('PowerReadIconResourceSpecifier')(RootPowerKey, SchemeGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreadpossibledescription
  public static PowerReadPossibleDescription(RootPowerKey: HKEY | 0n, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, PossibleSettingIndex: ULONG, Buffer: PUCHAR | NULL, BufferSize: LPDWORD): DWORD {
    return PowrProf.Load('PowerReadPossibleDescription')(RootPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid, PossibleSettingIndex, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreadpossiblefriendlyname
  public static PowerReadPossibleFriendlyName(RootPowerKey: HKEY | 0n, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, PossibleSettingIndex: ULONG, Buffer: PUCHAR | NULL, BufferSize: LPDWORD): DWORD {
    return PowrProf.Load('PowerReadPossibleFriendlyName')(RootPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid, PossibleSettingIndex, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreadpossiblevalue
  public static PowerReadPossibleValue(
    RootPowerKey: HKEY | 0n,
    SubGroupOfPowerSettingsGuid: LPCGUID | NULL,
    PowerSettingGuid: LPCGUID | NULL,
    Type: PULONG | NULL,
    PossibleSettingIndex: ULONG,
    Buffer: PUCHAR | NULL,
    BufferSize: LPDWORD,
  ): DWORD {
    return PowrProf.Load('PowerReadPossibleValue')(RootPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid, Type, PossibleSettingIndex, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreadsettingattributes
  public static PowerReadSettingAttributes(SubGroupGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL): DWORD {
    return PowrProf.Load('PowerReadSettingAttributes')(SubGroupGuid, PowerSettingGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreadvalueincrement
  public static PowerReadValueIncrement(RootPowerKey: HKEY | 0n, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, ValueIncrement: LPDWORD): DWORD {
    return PowrProf.Load('PowerReadValueIncrement')(RootPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid, ValueIncrement);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreadvaluemax
  public static PowerReadValueMax(RootPowerKey: HKEY | 0n, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, ValueMaximum: LPDWORD): DWORD {
    return PowrProf.Load('PowerReadValueMax')(RootPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid, ValueMaximum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreadvaluemin
  public static PowerReadValueMin(RootPowerKey: HKEY | 0n, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, ValueMinimum: LPDWORD): DWORD {
    return PowrProf.Load('PowerReadValueMin')(RootPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid, ValueMinimum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreadvalueunitsspecifier
  public static PowerReadValueUnitsSpecifier(RootPowerKey: HKEY | 0n, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, Buffer: PUCHAR | NULL, BufferSize: LPDWORD): DWORD {
    return PowrProf.Load('PowerReadValueUnitsSpecifier')(RootPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powersetting/nf-powersetting-powerregisterforeffectivepowermodenotifications
  public static PowerRegisterForEffectivePowerModeNotifications(Version: ULONG, Callback: EFFECTIVE_POWER_MODE_CALLBACK, Context: PVOID | NULL, RegistrationHandle: PVOID): HRESULT {
    return PowrProf.Load('PowerRegisterForEffectivePowerModeNotifications')(Version, Callback, Context, RegistrationHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powerbase/nf-powerbase-powerregistersuspendresumenotification
  public static PowerRegisterSuspendResumeNotification(Flags: DWORD, Recipient: HANDLE, RegistrationHandle: PHPOWERNOTIFY): DWORD {
    return PowrProf.Load('PowerRegisterSuspendResumeNotification')(Flags, Recipient, RegistrationHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerremovepowersetting
  public static PowerRemovePowerSetting(PowerSettingSubKeyGuid: LPCGUID, PowerSettingGuid: LPCGUID): DWORD {
    return PowrProf.Load('PowerRemovePowerSetting')(PowerSettingSubKeyGuid, PowerSettingGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreplacedefaultpowerschemes
  public static PowerReplaceDefaultPowerSchemes(): DWORD {
    return PowrProf.Load('PowerReplaceDefaultPowerSchemes')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerreportthermalevent
  public static PowerReportThermalEvent(Event: PTHERMAL_EVENT): DWORD {
    return PowrProf.Load('PowerReportThermalEvent')(Event);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerrestoredefaultpowerschemes
  public static PowerRestoreDefaultPowerSchemes(): DWORD {
    return PowrProf.Load('PowerRestoreDefaultPowerSchemes')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerrestoreindividualdefaultpowerscheme
  public static PowerRestoreIndividualDefaultPowerScheme(SchemeGuid: LPCGUID): DWORD {
    return PowrProf.Load('PowerRestoreIndividualDefaultPowerScheme')(SchemeGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powersetting/nf-powersetting-powersetactivescheme
  public static PowerSetActiveScheme(UserRootPowerKey: HKEY | 0n, SchemeGuid: LPCGUID | NULL): DWORD {
    return PowrProf.Load('PowerSetActiveScheme')(UserRootPowerKey, SchemeGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powersetuserconfiguredacpowermode
  public static PowerSetUserConfiguredACPowerMode(PowerModeGuid: LPCGUID): DWORD {
    return PowrProf.Load('PowerSetUserConfiguredACPowerMode')(PowerModeGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powersetuserconfigureddcpowermode
  public static PowerSetUserConfiguredDCPowerMode(PowerModeGuid: LPCGUID): DWORD {
    return PowrProf.Load('PowerSetUserConfiguredDCPowerMode')(PowerModeGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powersettingaccesscheck
  public static PowerSettingAccessCheck(AccessFlags: POWER_DATA_ACCESSOR, PowerGuid: LPCGUID | NULL): DWORD {
    return PowrProf.Load('PowerSettingAccessCheck')(AccessFlags, PowerGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powersettingaccesscheckex
  public static PowerSettingAccessCheckEx(AccessFlags: POWER_DATA_ACCESSOR, PowerGuid: LPCGUID | NULL, AccessType: REGSAM): DWORD {
    return PowrProf.Load('PowerSettingAccessCheckEx')(AccessFlags, PowerGuid, AccessType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powersetting/nf-powersetting-powersettingregisternotification
  public static PowerSettingRegisterNotification(SettingGuid: LPCGUID, Flags: DWORD, Recipient: HANDLE, RegistrationHandle: PHPOWERNOTIFY): DWORD {
    return PowrProf.Load('PowerSettingRegisterNotification')(SettingGuid, Flags, Recipient, RegistrationHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powersetting/nf-powersetting-powersettingunregisternotification
  public static PowerSettingUnregisterNotification(RegistrationHandle: HPOWERNOTIFY): DWORD {
    return PowrProf.Load('PowerSettingUnregisterNotification')(RegistrationHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powersetting/nf-powersetting-powerunregisterfromeffectivepowermodenotifications
  public static PowerUnregisterFromEffectivePowerModeNotifications(RegistrationHandle: HPOWERNOTIFY): HRESULT {
    return PowrProf.Load('PowerUnregisterFromEffectivePowerModeNotifications')(RegistrationHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powerbase/nf-powerbase-powerunregistersuspendresumenotification
  public static PowerUnregisterSuspendResumeNotification(RegistrationHandle: HPOWERNOTIFY): DWORD {
    return PowrProf.Load('PowerUnregisterSuspendResumeNotification')(RegistrationHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerwriteacdefaultindex
  public static PowerWriteACDefaultIndex(RootSystemPowerKey: HKEY | 0n, SchemePersonalityGuid: LPCGUID, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID, DefaultAcIndex: DWORD): DWORD {
    return PowrProf.Load('PowerWriteACDefaultIndex')(RootSystemPowerKey, SchemePersonalityGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, DefaultAcIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powersetting/nf-powersetting-powerwriteacvalueindex
  public static PowerWriteACValueIndex(RootPowerKey: HKEY | 0n, SchemeGuid: LPCGUID, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, AcValueIndex: DWORD): DWORD {
    return PowrProf.Load('PowerWriteACValueIndex')(RootPowerKey, SchemeGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, AcValueIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerwritedcdefaultindex
  public static PowerWriteDCDefaultIndex(RootSystemPowerKey: HKEY | 0n, SchemePersonalityGuid: LPCGUID, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID, DefaultDcIndex: DWORD): DWORD {
    return PowrProf.Load('PowerWriteDCDefaultIndex')(RootSystemPowerKey, SchemePersonalityGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, DefaultDcIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powersetting/nf-powersetting-powerwritedcvalueindex
  public static PowerWriteDCValueIndex(RootPowerKey: HKEY | 0n, SchemeGuid: LPCGUID, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, DcValueIndex: DWORD): DWORD {
    return PowrProf.Load('PowerWriteDCValueIndex')(RootPowerKey, SchemeGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, DcValueIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerwritedescription
  public static PowerWriteDescription(RootPowerKey: HKEY | 0n, SchemeGuid: LPCGUID, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, Buffer: PUCHAR, BufferSize: DWORD): DWORD {
    return PowrProf.Load('PowerWriteDescription')(RootPowerKey, SchemeGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerwritefriendlyname
  public static PowerWriteFriendlyName(RootPowerKey: HKEY | 0n, SchemeGuid: LPCGUID, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, Buffer: PUCHAR, BufferSize: DWORD): DWORD {
    return PowrProf.Load('PowerWriteFriendlyName')(RootPowerKey, SchemeGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerwriteiconresourcespecifier
  public static PowerWriteIconResourceSpecifier(RootPowerKey: HKEY | 0n, SchemeGuid: LPCGUID, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, Buffer: PUCHAR, BufferSize: DWORD): DWORD {
    return PowrProf.Load('PowerWriteIconResourceSpecifier')(RootPowerKey, SchemeGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerwritepossibledescription
  public static PowerWritePossibleDescription(RootPowerKey: HKEY | 0n, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, PossibleSettingIndex: ULONG, Buffer: PUCHAR, BufferSize: DWORD): DWORD {
    return PowrProf.Load('PowerWritePossibleDescription')(RootPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid, PossibleSettingIndex, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerwritepossiblefriendlyname
  public static PowerWritePossibleFriendlyName(RootPowerKey: HKEY | 0n, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, PossibleSettingIndex: ULONG, Buffer: PUCHAR, BufferSize: DWORD): DWORD {
    return PowrProf.Load('PowerWritePossibleFriendlyName')(RootPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid, PossibleSettingIndex, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerwritepossiblevalue
  public static PowerWritePossibleValue(RootPowerKey: HKEY | 0n, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, Type: ULONG, PossibleSettingIndex: ULONG, Buffer: PUCHAR, BufferSize: DWORD): DWORD {
    return PowrProf.Load('PowerWritePossibleValue')(RootPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid, Type, PossibleSettingIndex, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerwritesettingattributes
  public static PowerWriteSettingAttributes(SubGroupGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, Attributes: DWORD): DWORD {
    return PowrProf.Load('PowerWriteSettingAttributes')(SubGroupGuid, PowerSettingGuid, Attributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerwritevalueincrement
  public static PowerWriteValueIncrement(RootPowerKey: HKEY | 0n, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, ValueIncrement: DWORD): DWORD {
    return PowrProf.Load('PowerWriteValueIncrement')(RootPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid, ValueIncrement);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerwritevaluemax
  public static PowerWriteValueMax(RootPowerKey: HKEY | 0n, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, ValueMaximum: DWORD): DWORD {
    return PowrProf.Load('PowerWriteValueMax')(RootPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid, ValueMaximum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerwritevaluemin
  public static PowerWriteValueMin(RootPowerKey: HKEY | 0n, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, ValueMinimum: DWORD): DWORD {
    return PowrProf.Load('PowerWriteValueMin')(RootPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid, ValueMinimum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-powerwritevalueunitsspecifier
  public static PowerWriteValueUnitsSpecifier(RootPowerKey: HKEY | 0n, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, Buffer: PUCHAR, BufferSize: DWORD): DWORD {
    return PowrProf.Load('PowerWriteValueUnitsSpecifier')(RootPowerKey, SubGroupOfPowerSettingsGuid, PowerSettingGuid, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-readglobalpwrpolicy
  public static ReadGlobalPwrPolicy(pGlobalPowerPolicy: PGLOBAL_POWER_POLICY): BOOLEAN {
    return PowrProf.Load('ReadGlobalPwrPolicy')(pGlobalPowerPolicy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-readprocessorpwrscheme
  public static ReadProcessorPwrScheme(uiID: UINT, pMachineProcessorPowerPolicy: PMACHINE_PROCESSOR_POWER_POLICY): BOOLEAN {
    return PowrProf.Load('ReadProcessorPwrScheme')(uiID, pMachineProcessorPowerPolicy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-readpwrscheme
  public static ReadPwrScheme(uiID: UINT, pPowerPolicy: PPOWER_POLICY): BOOLEAN {
    return PowrProf.Load('ReadPwrScheme')(uiID, pPowerPolicy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-setactivepwrscheme
  public static SetActivePwrScheme(uiID: UINT, pGlobalPowerPolicy: PGLOBAL_POWER_POLICY | NULL, pPowerPolicy: PPOWER_POLICY | NULL): BOOLEAN {
    return PowrProf.Load('SetActivePwrScheme')(uiID, pGlobalPowerPolicy, pPowerPolicy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-setsuspendstate
  public static SetSuspendState(bHibernate: BOOLEAN, bForce: BOOLEAN, bWakeupEventsDisabled: BOOLEAN): BOOLEAN {
    return PowrProf.Load('SetSuspendState')(bHibernate, bForce, bWakeupEventsDisabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-validatepowerpolicies
  public static ValidatePowerPolicies(pGlobalPowerPolicy: PGLOBAL_POWER_POLICY | NULL, pPowerPolicy: PPOWER_POLICY | NULL): BOOLEAN {
    return PowrProf.Load('ValidatePowerPolicies')(pGlobalPowerPolicy, pPowerPolicy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-writeglobalpwrpolicy
  public static WriteGlobalPwrPolicy(pGlobalPowerPolicy: PGLOBAL_POWER_POLICY): BOOLEAN {
    return PowrProf.Load('WriteGlobalPwrPolicy')(pGlobalPowerPolicy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-writeprocessorpwrscheme
  public static WriteProcessorPwrScheme(uiID: UINT, pMachineProcessorPowerPolicy: PMACHINE_PROCESSOR_POWER_POLICY): BOOLEAN {
    return PowrProf.Load('WriteProcessorPwrScheme')(uiID, pMachineProcessorPowerPolicy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/powrprof/nf-powrprof-writepwrscheme
  public static WritePwrScheme(puiID: PUINT, lpszSchemeName: LPCWSTR, lpszDescription: LPCWSTR | NULL, lpScheme: PPOWER_POLICY): BOOLEAN {
    return PowrProf.Load('WritePwrScheme')(puiID, lpszSchemeName, lpszDescription, lpScheme);
  }
}

export default PowrProf;
