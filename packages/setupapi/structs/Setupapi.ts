import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DEVPROPTYPE,
  DI_FUNCTION,
  DWORD,
  HDC,
  HDEVINFO,
  HDSKSPC,
  HINF,
  HKEY,
  HPROPSHEETPAGE,
  HSPFILELOG,
  HSPFILEQ,
  HWND,
  INT,
  LONG,
  LONGLONG,
  LPCSTR,
  LPCVOID,
  LPCWSTR,
  LPDWORD,
  LPGUID,
  LPPROPSHEETHEADERA,
  LPPROPSHEETHEADERW,
  LogSeverity,
  OPTIONAL,
  PBOOL,
  PBYTE,
  PCSTR,
  PCWSTR,
  PDEVPROPKEY,
  PDEVPROPTYPE,
  PDWORD,
  PHICON,
  PINFCONTEXT,
  PINT,
  PLONGLONG,
  PPCSTR,
  PPCWSTR,
  PPSTR,
  PPWSTR,
  PSP_ALTPLATFORM_INFO,
  PSP_BACKUP_QUEUE_PARAMS_A,
  PSP_BACKUP_QUEUE_PARAMS_W,
  PSP_CLASSIMAGELIST_DATA,
  PSP_CLASSINSTALL_HEADER,
  PSP_DETSIG_CMPPROC,
  PSP_DEVICE_INTERFACE_DATA,
  PSP_DEVICE_INTERFACE_DETAIL_DATA_A,
  PSP_DEVICE_INTERFACE_DETAIL_DATA_W,
  PSP_DEVINFO_DATA,
  PSP_DEVINFO_LIST_DETAIL_DATA_A,
  PSP_DEVINFO_LIST_DETAIL_DATA_W,
  PSP_DEVINSTALL_PARAMS_A,
  PSP_DEVINSTALL_PARAMS_W,
  PSP_DRVINFO_DATA_A,
  PSP_DRVINFO_DATA_W,
  PSP_DRVINFO_DETAIL_DATA_A,
  PSP_DRVINFO_DETAIL_DATA_W,
  PSP_DRVINSTALL_PARAMS,
  PSP_FILE_CALLBACK_A,
  PSP_FILE_CALLBACK_W,
  PSP_FILE_COPY_PARAMS_A,
  PSP_FILE_COPY_PARAMS_W,
  PSP_INF_INFORMATION,
  PSP_INF_SIGNER_INFO_A,
  PSP_INF_SIGNER_INFO_W,
  PSP_INSTALLWIZARD_DATA,
  PSP_ORIGINAL_FILE_INFO_A,
  PSP_ORIGINAL_FILE_INFO_W,
  PSTR,
  PUINT,
  PVOID,
  PWSTR,
  RECT,
  REGSAM,
  SP_LOG_TOKEN,
  SetupFileLogInfo,
  UINT,
  UINT_PTR,
  VOID,
} from '../types/Setupapi';

/**
 * Thin, lazy-loaded FFI bindings for `setupapi.dll`.
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
 * import Setupapi from './structs/Setupapi';
 *
 * const deviceInfoSet = Setupapi.SetupDiGetClassDevsW(null!, null, 0n, 0);
 * ```
 */
class Setupapi extends Win32 {
  protected static override name = 'setupapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    SetupAddInstallSectionToDiskSpaceListA: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupAddInstallSectionToDiskSpaceListW: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupAddSectionToDiskSpaceListA: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupAddSectionToDiskSpaceListW: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupAddToDiskSpaceListA: { args: [FFIType.u64, FFIType.ptr, FFIType.i64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupAddToDiskSpaceListW: { args: [FFIType.u64, FFIType.ptr, FFIType.i64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupAddToSourceListA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupAddToSourceListW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupAdjustDiskSpaceListA: { args: [FFIType.u64, FFIType.ptr, FFIType.i64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupAdjustDiskSpaceListW: { args: [FFIType.u64, FFIType.ptr, FFIType.i64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupBackupErrorA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    SetupBackupErrorW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    SetupCancelTemporarySourceList: { args: [], returns: FFIType.i32 },
    SetupCloseFileQueue: { args: [FFIType.u64], returns: FFIType.i32 },
    SetupCloseInfFile: { args: [FFIType.u64], returns: FFIType.void },
    SetupCloseLog: { args: [], returns: FFIType.void },
    SetupCommitFileQueueA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupCommitFileQueueW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupConfigureWmiFromInfSectionA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupConfigureWmiFromInfSectionW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupCopyErrorA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    SetupCopyErrorW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    SetupCopyOEMInfA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupCopyOEMInfW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupCreateDiskSpaceListA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    SetupCreateDiskSpaceListW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    SetupDecompressOrCopyFileA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetupDecompressOrCopyFileW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetupDefaultQueueCallbackA: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    SetupDefaultQueueCallbackW: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    SetupDeleteErrorA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    SetupDeleteErrorW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    SetupDestroyDiskSpaceList: { args: [FFIType.u64], returns: FFIType.i32 },
    SetupDiAskForOEMDisk: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiBuildClassInfoList: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiBuildClassInfoListExA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiBuildClassInfoListExW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiBuildDriverInfoList: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupDiCallClassInstaller: { args: [FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiCancelDriverInfoSearch: { args: [FFIType.u64], returns: FFIType.i32 },
    SetupDiChangeState: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiClassGuidsFromNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiClassGuidsFromNameExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiClassGuidsFromNameExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiClassGuidsFromNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiClassNameFromGuidA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiClassNameFromGuidExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiClassNameFromGuidExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiClassNameFromGuidW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiCreateDevRegKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    SetupDiCreateDevRegKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    SetupDiCreateDeviceInfoA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiCreateDeviceInfoList: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.u64 },
    SetupDiCreateDeviceInfoListExA: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    SetupDiCreateDeviceInfoListExW: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    SetupDiCreateDeviceInfoW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiCreateDeviceInterfaceA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiCreateDeviceInterfaceRegKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    SetupDiCreateDeviceInterfaceRegKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    SetupDiCreateDeviceInterfaceW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiDeleteDevRegKey: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetupDiDeleteDeviceInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiDeleteDeviceInterfaceData: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiDeleteDeviceInterfaceRegKey: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupDiDestroyClassImageList: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetupDiDestroyDeviceInfoList: { args: [FFIType.u64], returns: FFIType.i32 },
    SetupDiDestroyDriverInfoList: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupDiDrawMiniIcon: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    SetupDiEnumDeviceInfo: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiEnumDeviceInterfaces: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiEnumDriverInfoA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiEnumDriverInfoW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetActualModelsSectionA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetActualModelsSectionW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetActualSectionToInstallA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetActualSectionToInstallExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetActualSectionToInstallExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetActualSectionToInstallW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetClassBitmapIndex: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetClassDescriptionA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetClassDescriptionExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetClassDescriptionExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetClassDescriptionW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetClassDevPropertySheetsA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupDiGetClassDevPropertySheetsW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupDiGetClassDevsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    SetupDiGetClassDevsExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    SetupDiGetClassDevsExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    SetupDiGetClassDevsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    SetupDiGetClassImageIndex: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetClassImageList: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetClassImageListExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetClassImageListExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetClassInstallParamsA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetClassInstallParamsW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetClassPropertyExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetClassPropertyKeys: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupDiGetClassPropertyKeysExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetClassPropertyW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupDiGetClassRegistryPropertyA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetClassRegistryPropertyW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetCustomDevicePropertyA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetCustomDevicePropertyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDeviceInfoListClass: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDeviceInfoListDetailA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDeviceInfoListDetailW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDeviceInstallParamsA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDeviceInstallParamsW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDeviceInstanceIdA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDeviceInstanceIdW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDeviceInterfaceAlias: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDeviceInterfaceDetailA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDeviceInterfaceDetailW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDeviceInterfacePropertyKeys: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupDiGetDeviceInterfacePropertyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupDiGetDevicePropertyKeys: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupDiGetDevicePropertyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupDiGetDeviceRegistryPropertyA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDeviceRegistryPropertyW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDriverInfoDetailA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDriverInfoDetailW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDriverInstallParamsA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetDriverInstallParamsW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetHwProfileFriendlyNameA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetHwProfileFriendlyNameExA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetHwProfileFriendlyNameExW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetHwProfileFriendlyNameW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetHwProfileList: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetHwProfileListExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetHwProfileListExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetINFClassA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetINFClassW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetSelectedDevice: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetSelectedDriverA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetSelectedDriverW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiGetWizardPage: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    SetupDiInstallClassA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    SetupDiInstallClassExA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiInstallClassExW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiInstallClassW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    SetupDiInstallDevice: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiInstallDeviceInterfaces: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiInstallDriverFiles: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiLoadClassIcon: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiLoadDeviceIcon: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiOpenClassRegKey: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SetupDiOpenClassRegKeyExA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    SetupDiOpenClassRegKeyExW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    SetupDiOpenDevRegKey: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    SetupDiOpenDeviceInfoA: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiOpenDeviceInfoW: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiOpenDeviceInterfaceA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiOpenDeviceInterfaceRegKey: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    SetupDiOpenDeviceInterfaceW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiRegisterCoDeviceInstallers: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiRegisterDeviceInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiRemoveDevice: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiRemoveDeviceInterface: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiRestartDevices: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiSelectBestCompatDrv: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiSelectDevice: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiSelectOEMDrv: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiSetClassInstallParamsA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupDiSetClassInstallParamsW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupDiSetClassPropertyExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiSetClassPropertyW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetupDiSetClassRegistryPropertyA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiSetClassRegistryPropertyW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiSetDeviceInstallParamsA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiSetDeviceInstallParamsW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiSetDeviceInterfaceDefault: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupDiSetDeviceInterfacePropertyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetupDiSetDevicePropertyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetupDiSetDeviceRegistryPropertyA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupDiSetDeviceRegistryPropertyW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupDiSetDriverInstallParamsA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiSetDriverInstallParamsW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiSetSelectedDevice: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDiSetSelectedDriverA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiSetSelectedDriverW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupDiUnremoveDevice: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupDuplicateDiskSpaceListA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    SetupDuplicateDiskSpaceListW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    SetupEnumInfSectionsA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupEnumInfSectionsW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupFindFirstLineA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupFindFirstLineW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupFindNextLine: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupFindNextMatchLineA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupFindNextMatchLineW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupFreeSourceListA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupFreeSourceListW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupGetBackupInformationA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupGetBackupInformationW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupGetBinaryField: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetFieldCount: { args: [FFIType.ptr], returns: FFIType.u32 },
    SetupGetFileCompressionInfoA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetupGetFileCompressionInfoExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupGetFileCompressionInfoExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupGetFileCompressionInfoW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetupGetFileQueueCount: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetFileQueueFlags: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupGetInfDriverStoreLocationA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetInfDriverStoreLocationW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetInfFileListA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetInfFileListW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetInfInformationA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetInfInformationW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetInfPublishedNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetInfPublishedNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetIntField: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetLineByIndexA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetLineByIndexW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetLineCountA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupGetLineCountW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupGetLineTextA: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetLineTextW: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetMultiSzFieldA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetMultiSzFieldW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetNonInteractiveMode: { args: [], returns: FFIType.i32 },
    SetupGetSourceFileLocationA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetSourceFileLocationW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetSourceFileSizeA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupGetSourceFileSizeW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupGetSourceInfoA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetSourceInfoW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetStringFieldA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetStringFieldW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetTargetPathA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupGetTargetPathW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupInitDefaultQueueCallback: { args: [FFIType.u64], returns: FFIType.ptr },
    SetupInitDefaultQueueCallbackEx: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    SetupInitializeFileLogA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SetupInitializeFileLogW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SetupInstallFileA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupInstallFileExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupInstallFileExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupInstallFileW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupInstallFilesFromInfSectionA: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupInstallFilesFromInfSectionW: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupInstallFromInfSectionA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupInstallFromInfSectionW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupInstallServicesFromInfSectionA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupInstallServicesFromInfSectionExA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupInstallServicesFromInfSectionExW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupInstallServicesFromInfSectionW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupIterateCabinetA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupIterateCabinetW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupLogErrorA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupLogErrorW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupLogFileA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupLogFileW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupOpenAppendInfFileA: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupOpenAppendInfFileW: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupOpenFileQueue: { args: [], returns: FFIType.u64 },
    SetupOpenInfFileA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    SetupOpenInfFileW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    SetupOpenLog: { args: [FFIType.i32], returns: FFIType.i32 },
    SetupOpenMasterInf: { args: [], returns: FFIType.u64 },
    SetupPrepareQueueForRestoreA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupPrepareQueueForRestoreW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupPromptForDiskA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    SetupPromptForDiskW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    SetupPromptReboot: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SetupQueryDrivesInDiskSpaceListA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupQueryDrivesInDiskSpaceListW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupQueryFileLogA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupQueryFileLogW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupQueryInfFileInformationA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupQueryInfFileInformationW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupQueryInfOriginalFileInformationA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupQueryInfOriginalFileInformationW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupQueryInfVersionInformationA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupQueryInfVersionInformationW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupQuerySourceListA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupQuerySourceListW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupQuerySpaceRequiredOnDriveA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupQuerySpaceRequiredOnDriveW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupQueueCopyA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupQueueCopyIndirectA: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetupQueueCopyIndirectW: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetupQueueCopySectionA: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupQueueCopySectionW: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupQueueCopyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupQueueDefaultCopyA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupQueueDefaultCopyW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupQueueDeleteA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupQueueDeleteSectionA: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupQueueDeleteSectionW: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupQueueDeleteW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupQueueRenameA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupQueueRenameSectionA: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupQueueRenameSectionW: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetupQueueRenameW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupRemoveFileLogEntryA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupRemoveFileLogEntryW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupRemoveFromDiskSpaceListA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupRemoveFromDiskSpaceListW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupRemoveFromSourceListA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupRemoveFromSourceListW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupRemoveInstallSectionFromDiskSpaceListA: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupRemoveInstallSectionFromDiskSpaceListW: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupRemoveSectionFromDiskSpaceListA: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupRemoveSectionFromDiskSpaceListW: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupRenameErrorA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    SetupRenameErrorW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    SetupScanFileQueueA: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupScanFileQueueW: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupSetDirectoryIdA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupSetDirectoryIdExA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupSetDirectoryIdExW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupSetDirectoryIdW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupSetFileQueueAlternatePlatformA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupSetFileQueueAlternatePlatformW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupSetFileQueueFlags: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetupSetNonInteractiveMode: { args: [FFIType.i32], returns: FFIType.i32 },
    SetupSetPlatformPathOverrideA: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetupSetPlatformPathOverrideW: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetupSetSourceListA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupSetSourceListW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetupTermDefaultQueueCallback: { args: [FFIType.ptr], returns: FFIType.void },
    SetupTerminateFileLog: { args: [FFIType.u64], returns: FFIType.i32 },
    SetupUninstallNewlyCopiedInfs: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupUninstallOEMInfA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupUninstallOEMInfW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetupVerifyInfFileA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupVerifyInfFileW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetupWriteTextLogInfLine: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.void },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupaddinstallsectiontodiskspacelista
  public static SetupAddInstallSectionToDiskSpaceListA(DiskSpace: HDSKSPC, InfHandle: HINF, LayoutInfHandle: OPTIONAL<HINF>, SectionName: PCSTR, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupAddInstallSectionToDiskSpaceListA')(DiskSpace, InfHandle, LayoutInfHandle, SectionName, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupaddinstallsectiontodiskspacelistw
  public static SetupAddInstallSectionToDiskSpaceListW(DiskSpace: HDSKSPC, InfHandle: HINF, LayoutInfHandle: OPTIONAL<HINF>, SectionName: PCWSTR, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupAddInstallSectionToDiskSpaceListW')(DiskSpace, InfHandle, LayoutInfHandle, SectionName, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupaddsectiontodiskspacelista
  public static SetupAddSectionToDiskSpaceListA(DiskSpace: HDSKSPC, InfHandle: HINF, ListInfHandle: OPTIONAL<HINF>, SectionName: PCSTR, Operation: UINT, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupAddSectionToDiskSpaceListA')(DiskSpace, InfHandle, ListInfHandle, SectionName, Operation, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupaddsectiontodiskspacelistw
  public static SetupAddSectionToDiskSpaceListW(DiskSpace: HDSKSPC, InfHandle: HINF, ListInfHandle: OPTIONAL<HINF>, SectionName: PCWSTR, Operation: UINT, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupAddSectionToDiskSpaceListW')(DiskSpace, InfHandle, ListInfHandle, SectionName, Operation, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupaddtodiskspacelista
  public static SetupAddToDiskSpaceListA(DiskSpace: HDSKSPC, TargetFilespec: PCSTR, FileSize: LONGLONG, Operation: UINT, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupAddToDiskSpaceListA')(DiskSpace, TargetFilespec, FileSize, Operation, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupaddtodiskspacelistw
  public static SetupAddToDiskSpaceListW(DiskSpace: HDSKSPC, TargetFilespec: PCWSTR, FileSize: LONGLONG, Operation: UINT, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupAddToDiskSpaceListW')(DiskSpace, TargetFilespec, FileSize, Operation, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupaddtosourcelista
  public static SetupAddToSourceListA(Flags: DWORD, Source: PCSTR): BOOL {
    return Setupapi.Load('SetupAddToSourceListA')(Flags, Source);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupaddtosourcelistw
  public static SetupAddToSourceListW(Flags: DWORD, Source: PCWSTR): BOOL {
    return Setupapi.Load('SetupAddToSourceListW')(Flags, Source);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupadjustdiskspacelista
  public static SetupAdjustDiskSpaceListA(DiskSpace: HDSKSPC, DriveRoot: LPCSTR, Amount: LONGLONG, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupAdjustDiskSpaceListA')(DiskSpace, DriveRoot, Amount, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupadjustdiskspacelistw
  public static SetupAdjustDiskSpaceListW(DiskSpace: HDSKSPC, DriveRoot: LPCWSTR, Amount: LONGLONG, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupAdjustDiskSpaceListW')(DiskSpace, DriveRoot, Amount, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupbackuperrora
  public static SetupBackupErrorA(hwndParent: HWND, DialogTitle: OPTIONAL<PCSTR>, SourceFile: PCSTR, TargetFile: OPTIONAL<PCSTR>, Win32ErrorCode: UINT, Style: DWORD): UINT {
    return Setupapi.Load('SetupBackupErrorA')(hwndParent, DialogTitle, SourceFile, TargetFile, Win32ErrorCode, Style);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupbackuperrorw
  public static SetupBackupErrorW(hwndParent: HWND, DialogTitle: OPTIONAL<PCWSTR>, SourceFile: PCWSTR, TargetFile: OPTIONAL<PCWSTR>, Win32ErrorCode: UINT, Style: DWORD): UINT {
    return Setupapi.Load('SetupBackupErrorW')(hwndParent, DialogTitle, SourceFile, TargetFile, Win32ErrorCode, Style);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupcanceltemporarysourcelist
  public static SetupCancelTemporarySourceList(): BOOL {
    return Setupapi.Load('SetupCancelTemporarySourceList')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupclosefilequeue
  public static SetupCloseFileQueue(QueueHandle: HSPFILEQ): BOOL {
    return Setupapi.Load('SetupCloseFileQueue')(QueueHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupcloseinffile
  public static SetupCloseInfFile(InfHandle: HINF): VOID {
    return Setupapi.Load('SetupCloseInfFile')(InfHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupcloselog
  public static SetupCloseLog(): VOID {
    return Setupapi.Load('SetupCloseLog')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupcommitfilequeuea
  public static SetupCommitFileQueueA(Owner: OPTIONAL<HWND>, QueueHandle: HSPFILEQ, MsgHandler: PSP_FILE_CALLBACK_A, Context: PVOID): BOOL {
    return Setupapi.Load('SetupCommitFileQueueA')(Owner, QueueHandle, MsgHandler, Context);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupcommitfilequeuew
  public static SetupCommitFileQueueW(Owner: OPTIONAL<HWND>, QueueHandle: HSPFILEQ, MsgHandler: PSP_FILE_CALLBACK_W, Context: PVOID): BOOL {
    return Setupapi.Load('SetupCommitFileQueueW')(Owner, QueueHandle, MsgHandler, Context);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupconfigurewmifrominfsectiona
  public static SetupConfigureWmiFromInfSectionA(InfHandle: HINF, SectionName: PCSTR, Flags: DWORD): BOOL {
    return Setupapi.Load('SetupConfigureWmiFromInfSectionA')(InfHandle, SectionName, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupconfigurewmifrominfsectionw
  public static SetupConfigureWmiFromInfSectionW(InfHandle: HINF, SectionName: PCWSTR, Flags: DWORD): BOOL {
    return Setupapi.Load('SetupConfigureWmiFromInfSectionW')(InfHandle, SectionName, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupcopyerrora
  public static SetupCopyErrorA(
    hwndParent: HWND,
    DialogTitle: OPTIONAL<PCSTR>,
    DiskName: OPTIONAL<PCSTR>,
    PathToSource: PCSTR,
    SourceFile: PCSTR,
    TargetPathFile: OPTIONAL<PCSTR>,
    Win32ErrorCode: UINT,
    Style: DWORD,
    PathBuffer_out: OPTIONAL<PSTR>,
    PathBufferSize: DWORD,
    PathRequiredSize_out: OPTIONAL<PDWORD>,
  ): UINT {
    return Setupapi.Load('SetupCopyErrorA')(hwndParent, DialogTitle, DiskName, PathToSource, SourceFile, TargetPathFile, Win32ErrorCode, Style, PathBuffer_out, PathBufferSize, PathRequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupcopyerrorw
  public static SetupCopyErrorW(
    hwndParent: HWND,
    DialogTitle: OPTIONAL<PCWSTR>,
    DiskName: OPTIONAL<PCWSTR>,
    PathToSource: PCWSTR,
    SourceFile: PCWSTR,
    TargetPathFile: OPTIONAL<PCWSTR>,
    Win32ErrorCode: UINT,
    Style: DWORD,
    PathBuffer_out: OPTIONAL<PWSTR>,
    PathBufferSize: DWORD,
    PathRequiredSize_out: OPTIONAL<PDWORD>,
  ): UINT {
    return Setupapi.Load('SetupCopyErrorW')(hwndParent, DialogTitle, DiskName, PathToSource, SourceFile, TargetPathFile, Win32ErrorCode, Style, PathBuffer_out, PathBufferSize, PathRequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupcopyoeminfa
  public static SetupCopyOEMInfA(
    SourceInfFileName: PCSTR,
    OEMSourceMediaLocation: OPTIONAL<PCSTR>,
    OEMSourceMediaType: DWORD,
    CopyStyle: DWORD,
    DestinationInfFileName_out: OPTIONAL<PSTR>,
    DestinationInfFileNameSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
    DestinationInfFileNameComponent_out: OPTIONAL<PPSTR>,
  ): BOOL {
    return Setupapi.Load('SetupCopyOEMInfA')(SourceInfFileName, OEMSourceMediaLocation, OEMSourceMediaType, CopyStyle, DestinationInfFileName_out, DestinationInfFileNameSize, RequiredSize_out, DestinationInfFileNameComponent_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupcopyoeminfw
  public static SetupCopyOEMInfW(
    SourceInfFileName: PCWSTR,
    OEMSourceMediaLocation: OPTIONAL<PCWSTR>,
    OEMSourceMediaType: DWORD,
    CopyStyle: DWORD,
    DestinationInfFileName_out: OPTIONAL<PWSTR>,
    DestinationInfFileNameSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
    DestinationInfFileNameComponent_out: OPTIONAL<PPWSTR>,
  ): BOOL {
    return Setupapi.Load('SetupCopyOEMInfW')(SourceInfFileName, OEMSourceMediaLocation, OEMSourceMediaType, CopyStyle, DestinationInfFileName_out, DestinationInfFileNameSize, RequiredSize_out, DestinationInfFileNameComponent_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupcreatediskspacelista
  public static SetupCreateDiskSpaceListA(Reserved1: OPTIONAL<PVOID>, Reserved2: DWORD, Flags: UINT): HDSKSPC {
    return Setupapi.Load('SetupCreateDiskSpaceListA')(Reserved1, Reserved2, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupcreatediskspacelistw
  public static SetupCreateDiskSpaceListW(Reserved1: OPTIONAL<PVOID>, Reserved2: DWORD, Flags: UINT): HDSKSPC {
    return Setupapi.Load('SetupCreateDiskSpaceListW')(Reserved1, Reserved2, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdecompressorcopyfilea
  public static SetupDecompressOrCopyFileA(SourceFileName: PCSTR, TargetFileName: PCSTR, CompressionType: OPTIONAL<PUINT>): DWORD {
    return Setupapi.Load('SetupDecompressOrCopyFileA')(SourceFileName, TargetFileName, CompressionType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdecompressorcopyfilew
  public static SetupDecompressOrCopyFileW(SourceFileName: PCWSTR, TargetFileName: PCWSTR, CompressionType: OPTIONAL<PUINT>): DWORD {
    return Setupapi.Load('SetupDecompressOrCopyFileW')(SourceFileName, TargetFileName, CompressionType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdefaultqueuecallbacka
  public static SetupDefaultQueueCallbackA(Context: PVOID, Notification: UINT, Param1: UINT_PTR, Param2: UINT_PTR): UINT {
    return Setupapi.Load('SetupDefaultQueueCallbackA')(Context, Notification, Param1, Param2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdefaultqueuecallbackw
  public static SetupDefaultQueueCallbackW(Context: PVOID, Notification: UINT, Param1: UINT_PTR, Param2: UINT_PTR): UINT {
    return Setupapi.Load('SetupDefaultQueueCallbackW')(Context, Notification, Param1, Param2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdeleteerrora
  public static SetupDeleteErrorA(hwndParent: HWND, DialogTitle: OPTIONAL<PCSTR>, File: PCSTR, Win32ErrorCode: UINT, Style: DWORD): UINT {
    return Setupapi.Load('SetupDeleteErrorA')(hwndParent, DialogTitle, File, Win32ErrorCode, Style);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdeleteerrorw
  public static SetupDeleteErrorW(hwndParent: HWND, DialogTitle: OPTIONAL<PCWSTR>, File: PCWSTR, Win32ErrorCode: UINT, Style: DWORD): UINT {
    return Setupapi.Load('SetupDeleteErrorW')(hwndParent, DialogTitle, File, Win32ErrorCode, Style);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdestroydiskspacelist
  public static SetupDestroyDiskSpaceList(DiskSpace_in_out: HDSKSPC): BOOL {
    return Setupapi.Load('SetupDestroyDiskSpaceList')(DiskSpace_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiaskforoemdisk
  public static SetupDiAskForOEMDisk(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>): BOOL {
    return Setupapi.Load('SetupDiAskForOEMDisk')(DeviceInfoSet, DeviceInfoData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdibuildclassinfolist
  public static SetupDiBuildClassInfoList(Flags: DWORD, ClassGuidList_out: OPTIONAL<LPGUID>, ClassGuidListSize: DWORD, RequiredSize_out: PDWORD): BOOL {
    return Setupapi.Load('SetupDiBuildClassInfoList')(Flags, ClassGuidList_out, ClassGuidListSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdibuildclassinfolistexa
  public static SetupDiBuildClassInfoListExA(Flags: DWORD, ClassGuidList_out: OPTIONAL<LPGUID>, ClassGuidListSize: DWORD, RequiredSize_out: PDWORD, MachineName: OPTIONAL<PCSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiBuildClassInfoListExA')(Flags, ClassGuidList_out, ClassGuidListSize, RequiredSize_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdibuildclassinfolistexw
  public static SetupDiBuildClassInfoListExW(Flags: DWORD, ClassGuidList_out: OPTIONAL<LPGUID>, ClassGuidListSize: DWORD, RequiredSize_out: PDWORD, MachineName: OPTIONAL<PCWSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiBuildClassInfoListExW')(Flags, ClassGuidList_out, ClassGuidListSize, RequiredSize_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdibuilddriverinfolist
  public static SetupDiBuildDriverInfoList(DeviceInfoSet: HDEVINFO, DeviceInfoData_in_out: OPTIONAL<PSP_DEVINFO_DATA>, DriverType: DWORD): BOOL {
    return Setupapi.Load('SetupDiBuildDriverInfoList')(DeviceInfoSet, DeviceInfoData_in_out, DriverType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdicallclassinstaller
  public static SetupDiCallClassInstaller(InstallFunction: DI_FUNCTION, DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>): BOOL {
    return Setupapi.Load('SetupDiCallClassInstaller')(InstallFunction, DeviceInfoSet, DeviceInfoData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdicanceldriverinfosearch
  public static SetupDiCancelDriverInfoSearch(DeviceInfoSet: HDEVINFO): BOOL {
    return Setupapi.Load('SetupDiCancelDriverInfoSearch')(DeviceInfoSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdichangestate
  public static SetupDiChangeState(DeviceInfoSet: HDEVINFO, DeviceInfoData_in_out: PSP_DEVINFO_DATA): BOOL {
    return Setupapi.Load('SetupDiChangeState')(DeviceInfoSet, DeviceInfoData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiclassguidsfromnamea
  public static SetupDiClassGuidsFromNameA(ClassName: PCSTR, ClassGuidList_out: LPGUID, ClassGuidListSize: DWORD, RequiredSize_out: PDWORD): BOOL {
    return Setupapi.Load('SetupDiClassGuidsFromNameA')(ClassName, ClassGuidList_out, ClassGuidListSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiclassguidsfromnameexa
  public static SetupDiClassGuidsFromNameExA(ClassName: PCSTR, ClassGuidList_out: LPGUID, ClassGuidListSize: DWORD, RequiredSize_out: PDWORD, MachineName: OPTIONAL<PCSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiClassGuidsFromNameExA')(ClassName, ClassGuidList_out, ClassGuidListSize, RequiredSize_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiclassguidsfromnameexw
  public static SetupDiClassGuidsFromNameExW(ClassName: PCWSTR, ClassGuidList_out: LPGUID, ClassGuidListSize: DWORD, RequiredSize_out: PDWORD, MachineName: OPTIONAL<PCWSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiClassGuidsFromNameExW')(ClassName, ClassGuidList_out, ClassGuidListSize, RequiredSize_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiclassguidsfromnamew
  public static SetupDiClassGuidsFromNameW(ClassName: PCWSTR, ClassGuidList_out: LPGUID, ClassGuidListSize: DWORD, RequiredSize_out: PDWORD): BOOL {
    return Setupapi.Load('SetupDiClassGuidsFromNameW')(ClassName, ClassGuidList_out, ClassGuidListSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiclassnamefromguida
  public static SetupDiClassNameFromGuidA(ClassGuid: LPGUID, ClassName_out: PSTR, ClassNameSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupDiClassNameFromGuidA')(ClassGuid, ClassName_out, ClassNameSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiclassnamefromguidexa
  public static SetupDiClassNameFromGuidExA(ClassGuid: LPGUID, ClassName_out: PSTR, ClassNameSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>, MachineName: OPTIONAL<PCSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiClassNameFromGuidExA')(ClassGuid, ClassName_out, ClassNameSize, RequiredSize_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiclassnamefromguidexw
  public static SetupDiClassNameFromGuidExW(ClassGuid: LPGUID, ClassName_out: PWSTR, ClassNameSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>, MachineName: OPTIONAL<PCWSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiClassNameFromGuidExW')(ClassGuid, ClassName_out, ClassNameSize, RequiredSize_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiclassnamefromguidw
  public static SetupDiClassNameFromGuidW(ClassGuid: LPGUID, ClassName_out: PWSTR, ClassNameSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupDiClassNameFromGuidW')(ClassGuid, ClassName_out, ClassNameSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdicreatedevregkeya
  public static SetupDiCreateDevRegKeyA(DeviceInfoSet: HDEVINFO, DeviceInfoData: PSP_DEVINFO_DATA, Scope: DWORD, HwProfile: DWORD, KeyType: DWORD, InfHandle: OPTIONAL<HINF>, InfSectionName: OPTIONAL<PCSTR>): HKEY {
    return Setupapi.Load('SetupDiCreateDevRegKeyA')(DeviceInfoSet, DeviceInfoData, Scope, HwProfile, KeyType, InfHandle, InfSectionName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdicreatedevregkeyw
  public static SetupDiCreateDevRegKeyW(DeviceInfoSet: HDEVINFO, DeviceInfoData: PSP_DEVINFO_DATA, Scope: DWORD, HwProfile: DWORD, KeyType: DWORD, InfHandle: OPTIONAL<HINF>, InfSectionName: OPTIONAL<PCWSTR>): HKEY {
    return Setupapi.Load('SetupDiCreateDevRegKeyW')(DeviceInfoSet, DeviceInfoData, Scope, HwProfile, KeyType, InfHandle, InfSectionName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdicreatedeviceinfoa
  public static SetupDiCreateDeviceInfoA(
    DeviceInfoSet: HDEVINFO,
    DeviceName: PCSTR,
    ClassGuid: LPGUID,
    DeviceDescription: OPTIONAL<PCSTR>,
    hwndParent: OPTIONAL<HWND>,
    CreationFlags: DWORD,
    DeviceInfoData_out: OPTIONAL<PSP_DEVINFO_DATA>,
  ): BOOL {
    return Setupapi.Load('SetupDiCreateDeviceInfoA')(DeviceInfoSet, DeviceName, ClassGuid, DeviceDescription, hwndParent, CreationFlags, DeviceInfoData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdicreatedeviceinfolist
  public static SetupDiCreateDeviceInfoList(ClassGuid: OPTIONAL<LPGUID>, hwndParent: OPTIONAL<HWND>): HDEVINFO {
    return Setupapi.Load('SetupDiCreateDeviceInfoList')(ClassGuid, hwndParent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdicreatedeviceinfolistexa
  public static SetupDiCreateDeviceInfoListExA(ClassGuid: OPTIONAL<LPGUID>, hwndParent: OPTIONAL<HWND>, MachineName: OPTIONAL<PCSTR>, Reserved: OPTIONAL<PVOID>): HDEVINFO {
    return Setupapi.Load('SetupDiCreateDeviceInfoListExA')(ClassGuid, hwndParent, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdicreatedeviceinfolistexw
  public static SetupDiCreateDeviceInfoListExW(ClassGuid: OPTIONAL<LPGUID>, hwndParent: OPTIONAL<HWND>, MachineName: OPTIONAL<PCWSTR>, Reserved: OPTIONAL<PVOID>): HDEVINFO {
    return Setupapi.Load('SetupDiCreateDeviceInfoListExW')(ClassGuid, hwndParent, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdicreatedeviceinfow
  public static SetupDiCreateDeviceInfoW(
    DeviceInfoSet: HDEVINFO,
    DeviceName: PCWSTR,
    ClassGuid: LPGUID,
    DeviceDescription: OPTIONAL<PCWSTR>,
    hwndParent: OPTIONAL<HWND>,
    CreationFlags: DWORD,
    DeviceInfoData_out: OPTIONAL<PSP_DEVINFO_DATA>,
  ): BOOL {
    return Setupapi.Load('SetupDiCreateDeviceInfoW')(DeviceInfoSet, DeviceName, ClassGuid, DeviceDescription, hwndParent, CreationFlags, DeviceInfoData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdicreatedeviceinterfacea
  public static SetupDiCreateDeviceInterfaceA(
    DeviceInfoSet: HDEVINFO,
    DeviceInfoData: PSP_DEVINFO_DATA,
    InterfaceClassGuid: LPGUID,
    ReferenceString: OPTIONAL<PCSTR>,
    CreationFlags: DWORD,
    DeviceInterfaceData_out: OPTIONAL<PSP_DEVICE_INTERFACE_DATA>,
  ): BOOL {
    return Setupapi.Load('SetupDiCreateDeviceInterfaceA')(DeviceInfoSet, DeviceInfoData, InterfaceClassGuid, ReferenceString, CreationFlags, DeviceInterfaceData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdicreatedeviceinterfaceregkeya
  public static SetupDiCreateDeviceInterfaceRegKeyA(DeviceInfoSet: HDEVINFO, DeviceInterfaceData: PSP_DEVICE_INTERFACE_DATA, Reserved: DWORD, samDesired: REGSAM, InfHandle: OPTIONAL<HINF>, InfSectionName: OPTIONAL<PCSTR>): HKEY {
    return Setupapi.Load('SetupDiCreateDeviceInterfaceRegKeyA')(DeviceInfoSet, DeviceInterfaceData, Reserved, samDesired, InfHandle, InfSectionName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdicreatedeviceinterfaceregkeyw
  public static SetupDiCreateDeviceInterfaceRegKeyW(DeviceInfoSet: HDEVINFO, DeviceInterfaceData: PSP_DEVICE_INTERFACE_DATA, Reserved: DWORD, samDesired: REGSAM, InfHandle: OPTIONAL<HINF>, InfSectionName: OPTIONAL<PCWSTR>): HKEY {
    return Setupapi.Load('SetupDiCreateDeviceInterfaceRegKeyW')(DeviceInfoSet, DeviceInterfaceData, Reserved, samDesired, InfHandle, InfSectionName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdicreatedeviceinterfacew
  public static SetupDiCreateDeviceInterfaceW(
    DeviceInfoSet: HDEVINFO,
    DeviceInfoData: PSP_DEVINFO_DATA,
    InterfaceClassGuid: LPGUID,
    ReferenceString: OPTIONAL<PCWSTR>,
    CreationFlags: DWORD,
    DeviceInterfaceData_out: OPTIONAL<PSP_DEVICE_INTERFACE_DATA>,
  ): BOOL {
    return Setupapi.Load('SetupDiCreateDeviceInterfaceW')(DeviceInfoSet, DeviceInfoData, InterfaceClassGuid, ReferenceString, CreationFlags, DeviceInterfaceData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdideletedevregkey
  public static SetupDiDeleteDevRegKey(DeviceInfoSet: HDEVINFO, DeviceInfoData: PSP_DEVINFO_DATA, Scope: DWORD, HwProfile: DWORD, KeyType: DWORD): BOOL {
    return Setupapi.Load('SetupDiDeleteDevRegKey')(DeviceInfoSet, DeviceInfoData, Scope, HwProfile, KeyType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdideletedeviceinfo
  public static SetupDiDeleteDeviceInfo(DeviceInfoSet: HDEVINFO, DeviceInfoData: PSP_DEVINFO_DATA): BOOL {
    return Setupapi.Load('SetupDiDeleteDeviceInfo')(DeviceInfoSet, DeviceInfoData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdideletedeviceinterfacedata
  public static SetupDiDeleteDeviceInterfaceData(DeviceInfoSet: HDEVINFO, DeviceInterfaceData: PSP_DEVICE_INTERFACE_DATA): BOOL {
    return Setupapi.Load('SetupDiDeleteDeviceInterfaceData')(DeviceInfoSet, DeviceInterfaceData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdideletedeviceinterfaceregkey
  public static SetupDiDeleteDeviceInterfaceRegKey(DeviceInfoSet: HDEVINFO, DeviceInterfaceData: PSP_DEVICE_INTERFACE_DATA, Reserved: DWORD): BOOL {
    return Setupapi.Load('SetupDiDeleteDeviceInterfaceRegKey')(DeviceInfoSet, DeviceInterfaceData, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdidestroyclassimagelist
  public static SetupDiDestroyClassImageList(ClassImageListData: PSP_CLASSIMAGELIST_DATA): BOOL {
    return Setupapi.Load('SetupDiDestroyClassImageList')(ClassImageListData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdidestroydeviceinfolist
  public static SetupDiDestroyDeviceInfoList(DeviceInfoSet: HDEVINFO): BOOL {
    return Setupapi.Load('SetupDiDestroyDeviceInfoList')(DeviceInfoSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdidestroydriverinfolist
  public static SetupDiDestroyDriverInfoList(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, DriverType: DWORD): BOOL {
    return Setupapi.Load('SetupDiDestroyDriverInfoList')(DeviceInfoSet, DeviceInfoData, DriverType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdidrawminiicon
  public static SetupDiDrawMiniIcon(hdc: HDC, rc: RECT, MiniIconIndex: INT, Flags: DWORD): INT {
    return Setupapi.Load('SetupDiDrawMiniIcon')(hdc, rc, MiniIconIndex, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdienumdeviceinfo
  public static SetupDiEnumDeviceInfo(DeviceInfoSet: HDEVINFO, MemberIndex: DWORD, DeviceInfoData_out: PSP_DEVINFO_DATA): BOOL {
    return Setupapi.Load('SetupDiEnumDeviceInfo')(DeviceInfoSet, MemberIndex, DeviceInfoData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdienumdeviceinterfaces
  public static SetupDiEnumDeviceInterfaces(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, InterfaceClassGuid: LPGUID, MemberIndex: DWORD, DeviceInterfaceData_out: PSP_DEVICE_INTERFACE_DATA): BOOL {
    return Setupapi.Load('SetupDiEnumDeviceInterfaces')(DeviceInfoSet, DeviceInfoData, InterfaceClassGuid, MemberIndex, DeviceInterfaceData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdienumdriverinfoa
  public static SetupDiEnumDriverInfoA(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, DriverType: DWORD, MemberIndex: DWORD, DriverInfoData_out: PSP_DRVINFO_DATA_A): BOOL {
    return Setupapi.Load('SetupDiEnumDriverInfoA')(DeviceInfoSet, DeviceInfoData, DriverType, MemberIndex, DriverInfoData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdienumdriverinfow
  public static SetupDiEnumDriverInfoW(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, DriverType: DWORD, MemberIndex: DWORD, DriverInfoData_out: PSP_DRVINFO_DATA_W): BOOL {
    return Setupapi.Load('SetupDiEnumDriverInfoW')(DeviceInfoSet, DeviceInfoData, DriverType, MemberIndex, DriverInfoData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetactualmodelssectiona
  public static SetupDiGetActualModelsSectionA(
    Context: PINFCONTEXT,
    AlternatePlatformInfo: OPTIONAL<PSP_ALTPLATFORM_INFO>,
    InfSectionWithExt_out: OPTIONAL<PSTR>,
    InfSectionWithExtSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
    Reserved: OPTIONAL<PVOID>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetActualModelsSectionA')(Context, AlternatePlatformInfo, InfSectionWithExt_out, InfSectionWithExtSize, RequiredSize_out, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetactualmodelssectionw
  public static SetupDiGetActualModelsSectionW(
    Context: PINFCONTEXT,
    AlternatePlatformInfo: OPTIONAL<PSP_ALTPLATFORM_INFO>,
    InfSectionWithExt_out: OPTIONAL<PWSTR>,
    InfSectionWithExtSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
    Reserved: OPTIONAL<PVOID>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetActualModelsSectionW')(Context, AlternatePlatformInfo, InfSectionWithExt_out, InfSectionWithExtSize, RequiredSize_out, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetactualsectiontoinstalla
  public static SetupDiGetActualSectionToInstallA(InfHandle: HINF, InfSectionName: PCSTR, InfSectionWithExt_out: OPTIONAL<PSTR>, InfSectionWithExtSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>, Extension_out: OPTIONAL<PPSTR>): BOOL {
    return Setupapi.Load('SetupDiGetActualSectionToInstallA')(InfHandle, InfSectionName, InfSectionWithExt_out, InfSectionWithExtSize, RequiredSize_out, Extension_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetactualsectiontoinstallexa
  public static SetupDiGetActualSectionToInstallExA(
    InfHandle: HINF,
    InfSectionName: PCSTR,
    AlternatePlatformInfo: OPTIONAL<PSP_ALTPLATFORM_INFO>,
    InfSectionWithExt_out: OPTIONAL<PSTR>,
    InfSectionWithExtSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
    Extension_out: OPTIONAL<PPSTR>,
    Reserved: OPTIONAL<PVOID>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetActualSectionToInstallExA')(InfHandle, InfSectionName, AlternatePlatformInfo, InfSectionWithExt_out, InfSectionWithExtSize, RequiredSize_out, Extension_out, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetactualsectiontoinstallexw
  public static SetupDiGetActualSectionToInstallExW(
    InfHandle: HINF,
    InfSectionName: PCWSTR,
    AlternatePlatformInfo: OPTIONAL<PSP_ALTPLATFORM_INFO>,
    InfSectionWithExt_out: OPTIONAL<PWSTR>,
    InfSectionWithExtSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
    Extension_out: OPTIONAL<PPWSTR>,
    Reserved: OPTIONAL<PVOID>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetActualSectionToInstallExW')(InfHandle, InfSectionName, AlternatePlatformInfo, InfSectionWithExt_out, InfSectionWithExtSize, RequiredSize_out, Extension_out, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetactualsectiontoinstallw
  public static SetupDiGetActualSectionToInstallW(InfHandle: HINF, InfSectionName: PCWSTR, InfSectionWithExt_out: OPTIONAL<PWSTR>, InfSectionWithExtSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>, Extension_out: OPTIONAL<PPWSTR>): BOOL {
    return Setupapi.Load('SetupDiGetActualSectionToInstallW')(InfHandle, InfSectionName, InfSectionWithExt_out, InfSectionWithExtSize, RequiredSize_out, Extension_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassbitmapindex
  public static SetupDiGetClassBitmapIndex(ClassGuid: OPTIONAL<LPGUID>, MiniIconIndex_out: PINT): BOOL {
    return Setupapi.Load('SetupDiGetClassBitmapIndex')(ClassGuid, MiniIconIndex_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassdescriptiona
  public static SetupDiGetClassDescriptionA(ClassGuid: LPGUID, ClassDescription_out: PSTR, ClassDescriptionSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupDiGetClassDescriptionA')(ClassGuid, ClassDescription_out, ClassDescriptionSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassdescriptionexa
  public static SetupDiGetClassDescriptionExA(ClassGuid: LPGUID, ClassDescription_out: PSTR, ClassDescriptionSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>, MachineName: OPTIONAL<PCSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiGetClassDescriptionExA')(ClassGuid, ClassDescription_out, ClassDescriptionSize, RequiredSize_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassdescriptionexw
  public static SetupDiGetClassDescriptionExW(ClassGuid: LPGUID, ClassDescription_out: PWSTR, ClassDescriptionSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>, MachineName: OPTIONAL<PCWSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiGetClassDescriptionExW')(ClassGuid, ClassDescription_out, ClassDescriptionSize, RequiredSize_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassdescriptionw
  public static SetupDiGetClassDescriptionW(ClassGuid: LPGUID, ClassDescription_out: PWSTR, ClassDescriptionSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupDiGetClassDescriptionW')(ClassGuid, ClassDescription_out, ClassDescriptionSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassdevpropertysheetsa
  public static SetupDiGetClassDevPropertySheetsA(
    DeviceInfoSet: HDEVINFO,
    DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>,
    PropertySheetHeader: LPPROPSHEETHEADERA,
    PropertySheetHeaderPageListSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
    PropertySheetType: DWORD,
  ): BOOL {
    return Setupapi.Load('SetupDiGetClassDevPropertySheetsA')(DeviceInfoSet, DeviceInfoData, PropertySheetHeader, PropertySheetHeaderPageListSize, RequiredSize_out, PropertySheetType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassdevpropertysheetsw
  public static SetupDiGetClassDevPropertySheetsW(
    DeviceInfoSet: HDEVINFO,
    DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>,
    PropertySheetHeader: LPPROPSHEETHEADERW,
    PropertySheetHeaderPageListSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
    PropertySheetType: DWORD,
  ): BOOL {
    return Setupapi.Load('SetupDiGetClassDevPropertySheetsW')(DeviceInfoSet, DeviceInfoData, PropertySheetHeader, PropertySheetHeaderPageListSize, RequiredSize_out, PropertySheetType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassdevsa
  public static SetupDiGetClassDevsA(ClassGuid: OPTIONAL<LPGUID>, Enumerator: OPTIONAL<PCSTR>, hwndParent: OPTIONAL<HWND>, Flags: DWORD): HDEVINFO {
    return Setupapi.Load('SetupDiGetClassDevsA')(ClassGuid, Enumerator, hwndParent, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassdevsexa
  public static SetupDiGetClassDevsExA(
    ClassGuid: OPTIONAL<LPGUID>,
    Enumerator: OPTIONAL<PCSTR>,
    hwndParent: OPTIONAL<HWND>,
    Flags: DWORD,
    DeviceInfoSet: OPTIONAL<HDEVINFO>,
    MachineName: OPTIONAL<PCSTR>,
    Reserved: OPTIONAL<PVOID>,
  ): HDEVINFO {
    return Setupapi.Load('SetupDiGetClassDevsExA')(ClassGuid, Enumerator, hwndParent, Flags, DeviceInfoSet, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassdevsexw
  public static SetupDiGetClassDevsExW(
    ClassGuid: OPTIONAL<LPGUID>,
    Enumerator: OPTIONAL<PCWSTR>,
    hwndParent: OPTIONAL<HWND>,
    Flags: DWORD,
    DeviceInfoSet: OPTIONAL<HDEVINFO>,
    MachineName: OPTIONAL<PCWSTR>,
    Reserved: OPTIONAL<PVOID>,
  ): HDEVINFO {
    return Setupapi.Load('SetupDiGetClassDevsExW')(ClassGuid, Enumerator, hwndParent, Flags, DeviceInfoSet, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassdevsw
  public static SetupDiGetClassDevsW(ClassGuid: OPTIONAL<LPGUID>, Enumerator: OPTIONAL<PCWSTR>, hwndParent: OPTIONAL<HWND>, Flags: DWORD): HDEVINFO {
    return Setupapi.Load('SetupDiGetClassDevsW')(ClassGuid, Enumerator, hwndParent, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassimageindex
  public static SetupDiGetClassImageIndex(ClassImageListData: PSP_CLASSIMAGELIST_DATA, ClassGuid: LPGUID, ImageIndex_out: PINT): BOOL {
    return Setupapi.Load('SetupDiGetClassImageIndex')(ClassImageListData, ClassGuid, ImageIndex_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassimagelist
  public static SetupDiGetClassImageList(ClassImageListData_out: PSP_CLASSIMAGELIST_DATA): BOOL {
    return Setupapi.Load('SetupDiGetClassImageList')(ClassImageListData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassimagelistexa
  public static SetupDiGetClassImageListExA(ClassImageListData_out: PSP_CLASSIMAGELIST_DATA, MachineName: OPTIONAL<PCSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiGetClassImageListExA')(ClassImageListData_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassimagelistexw
  public static SetupDiGetClassImageListExW(ClassImageListData_out: PSP_CLASSIMAGELIST_DATA, MachineName: OPTIONAL<PCWSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiGetClassImageListExW')(ClassImageListData_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassinstallparamsa
  public static SetupDiGetClassInstallParamsA(
    DeviceInfoSet: HDEVINFO,
    DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>,
    ClassInstallParams_out: OPTIONAL<PSP_CLASSINSTALL_HEADER>,
    ClassInstallParamsSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetClassInstallParamsA')(DeviceInfoSet, DeviceInfoData, ClassInstallParams_out, ClassInstallParamsSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassinstallparamsw
  public static SetupDiGetClassInstallParamsW(
    DeviceInfoSet: HDEVINFO,
    DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>,
    ClassInstallParams_out: OPTIONAL<PSP_CLASSINSTALL_HEADER>,
    ClassInstallParamsSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetClassInstallParamsW')(DeviceInfoSet, DeviceInfoData, ClassInstallParams_out, ClassInstallParamsSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclasspropertyexw
  public static SetupDiGetClassPropertyExW(
    ClassGuid: LPGUID,
    PropertyKey: PDEVPROPKEY,
    PropertyType_out: PDEVPROPTYPE,
    PropertyBuffer_out: OPTIONAL<PBYTE>,
    PropertyBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
    Flags: DWORD,
    MachineName: OPTIONAL<PCWSTR>,
    Reserved: OPTIONAL<PVOID>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetClassPropertyExW')(ClassGuid, PropertyKey, PropertyType_out, PropertyBuffer_out, PropertyBufferSize, RequiredSize_out, Flags, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclasspropertykeys
  public static SetupDiGetClassPropertyKeys(ClassGuid: LPGUID, PropertyKeyArray_out: OPTIONAL<PDEVPROPKEY>, PropertyKeyCount: DWORD, RequiredPropertyKeyCount_out: OPTIONAL<PDWORD>, Flags: DWORD): BOOL {
    return Setupapi.Load('SetupDiGetClassPropertyKeys')(ClassGuid, PropertyKeyArray_out, PropertyKeyCount, RequiredPropertyKeyCount_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclasspropertykeysexw
  public static SetupDiGetClassPropertyKeysExW(
    ClassGuid: LPGUID,
    PropertyKeyArray_out: OPTIONAL<PDEVPROPKEY>,
    PropertyKeyCount: DWORD,
    RequiredPropertyKeyCount_out: OPTIONAL<PDWORD>,
    Flags: DWORD,
    MachineName: OPTIONAL<PCWSTR>,
    Reserved: OPTIONAL<PVOID>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetClassPropertyKeysExW')(ClassGuid, PropertyKeyArray_out, PropertyKeyCount, RequiredPropertyKeyCount_out, Flags, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclasspropertyw
  public static SetupDiGetClassPropertyW(ClassGuid: LPGUID, PropertyKey: PDEVPROPKEY, PropertyType_out: PDEVPROPTYPE, PropertyBuffer_out: OPTIONAL<PBYTE>, PropertyBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>, Flags: DWORD): BOOL {
    return Setupapi.Load('SetupDiGetClassPropertyW')(ClassGuid, PropertyKey, PropertyType_out, PropertyBuffer_out, PropertyBufferSize, RequiredSize_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassregistrypropertya
  public static SetupDiGetClassRegistryPropertyA(
    ClassGuid: LPGUID,
    Property: DWORD,
    PropertyRegDataType_out: OPTIONAL<PDWORD>,
    PropertyBuffer_out: PBYTE,
    PropertyBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
    MachineName: OPTIONAL<PCSTR>,
    Reserved: OPTIONAL<PVOID>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetClassRegistryPropertyA')(ClassGuid, Property, PropertyRegDataType_out, PropertyBuffer_out, PropertyBufferSize, RequiredSize_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassregistrypropertyw
  public static SetupDiGetClassRegistryPropertyW(
    ClassGuid: LPGUID,
    Property: DWORD,
    PropertyRegDataType_out: OPTIONAL<PDWORD>,
    PropertyBuffer_out: PBYTE,
    PropertyBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
    MachineName: OPTIONAL<PCWSTR>,
    Reserved: OPTIONAL<PVOID>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetClassRegistryPropertyW')(ClassGuid, Property, PropertyRegDataType_out, PropertyBuffer_out, PropertyBufferSize, RequiredSize_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetcustomdevicepropertya
  public static SetupDiGetCustomDevicePropertyA(
    DeviceInfoSet: HDEVINFO,
    DeviceInfoData: PSP_DEVINFO_DATA,
    CustomPropertyName: PCSTR,
    Flags: DWORD,
    PropertyRegDataType_out: OPTIONAL<PDWORD>,
    PropertyBuffer_out: PBYTE,
    PropertyBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetCustomDevicePropertyA')(DeviceInfoSet, DeviceInfoData, CustomPropertyName, Flags, PropertyRegDataType_out, PropertyBuffer_out, PropertyBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetcustomdevicepropertyw
  public static SetupDiGetCustomDevicePropertyW(
    DeviceInfoSet: HDEVINFO,
    DeviceInfoData: PSP_DEVINFO_DATA,
    CustomPropertyName: PCWSTR,
    Flags: DWORD,
    PropertyRegDataType_out: OPTIONAL<PDWORD>,
    PropertyBuffer_out: PBYTE,
    PropertyBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetCustomDevicePropertyW')(DeviceInfoSet, DeviceInfoData, CustomPropertyName, Flags, PropertyRegDataType_out, PropertyBuffer_out, PropertyBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdeviceinfolistclass
  public static SetupDiGetDeviceInfoListClass(DeviceInfoSet: HDEVINFO, ClassGuid_out: LPGUID): BOOL {
    return Setupapi.Load('SetupDiGetDeviceInfoListClass')(DeviceInfoSet, ClassGuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdeviceinfolistdetaila
  public static SetupDiGetDeviceInfoListDetailA(DeviceInfoSet: HDEVINFO, DeviceInfoSetDetailData_out: PSP_DEVINFO_LIST_DETAIL_DATA_A): BOOL {
    return Setupapi.Load('SetupDiGetDeviceInfoListDetailA')(DeviceInfoSet, DeviceInfoSetDetailData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdeviceinfolistdetailw
  public static SetupDiGetDeviceInfoListDetailW(DeviceInfoSet: HDEVINFO, DeviceInfoSetDetailData_out: PSP_DEVINFO_LIST_DETAIL_DATA_W): BOOL {
    return Setupapi.Load('SetupDiGetDeviceInfoListDetailW')(DeviceInfoSet, DeviceInfoSetDetailData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdeviceinstallparamsa
  public static SetupDiGetDeviceInstallParamsA(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, DeviceInstallParams_out: PSP_DEVINSTALL_PARAMS_A): BOOL {
    return Setupapi.Load('SetupDiGetDeviceInstallParamsA')(DeviceInfoSet, DeviceInfoData, DeviceInstallParams_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdeviceinstallparamsw
  public static SetupDiGetDeviceInstallParamsW(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, DeviceInstallParams_out: PSP_DEVINSTALL_PARAMS_W): BOOL {
    return Setupapi.Load('SetupDiGetDeviceInstallParamsW')(DeviceInfoSet, DeviceInfoData, DeviceInstallParams_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdeviceinstanceida
  public static SetupDiGetDeviceInstanceIdA(DeviceInfoSet: HDEVINFO, DeviceInfoData: PSP_DEVINFO_DATA, DeviceInstanceId_out: OPTIONAL<PSTR>, DeviceInstanceIdSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupDiGetDeviceInstanceIdA')(DeviceInfoSet, DeviceInfoData, DeviceInstanceId_out, DeviceInstanceIdSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdeviceinstanceidw
  public static SetupDiGetDeviceInstanceIdW(DeviceInfoSet: HDEVINFO, DeviceInfoData: PSP_DEVINFO_DATA, DeviceInstanceId_out: OPTIONAL<PWSTR>, DeviceInstanceIdSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupDiGetDeviceInstanceIdW')(DeviceInfoSet, DeviceInfoData, DeviceInstanceId_out, DeviceInstanceIdSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdeviceinterfacealias
  public static SetupDiGetDeviceInterfaceAlias(DeviceInfoSet: HDEVINFO, DeviceInterfaceData: PSP_DEVICE_INTERFACE_DATA, AliasInterfaceClassGuid: LPGUID, AliasDeviceInterfaceData_out: PSP_DEVICE_INTERFACE_DATA): BOOL {
    return Setupapi.Load('SetupDiGetDeviceInterfaceAlias')(DeviceInfoSet, DeviceInterfaceData, AliasInterfaceClassGuid, AliasDeviceInterfaceData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdeviceinterfacedetaila
  public static SetupDiGetDeviceInterfaceDetailA(
    DeviceInfoSet: HDEVINFO,
    DeviceInterfaceData: PSP_DEVICE_INTERFACE_DATA,
    DeviceInterfaceDetailData_in_out: OPTIONAL<PSP_DEVICE_INTERFACE_DETAIL_DATA_A>,
    DeviceInterfaceDetailDataSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
    DeviceInfoData_out: OPTIONAL<PSP_DEVINFO_DATA>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetDeviceInterfaceDetailA')(DeviceInfoSet, DeviceInterfaceData, DeviceInterfaceDetailData_in_out, DeviceInterfaceDetailDataSize, RequiredSize_out, DeviceInfoData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdeviceinterfacedetailw
  public static SetupDiGetDeviceInterfaceDetailW(
    DeviceInfoSet: HDEVINFO,
    DeviceInterfaceData: PSP_DEVICE_INTERFACE_DATA,
    DeviceInterfaceDetailData_out: OPTIONAL<PSP_DEVICE_INTERFACE_DETAIL_DATA_W>,
    DeviceInterfaceDetailDataSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
    DeviceInfoData_out: OPTIONAL<PSP_DEVINFO_DATA>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetDeviceInterfaceDetailW')(DeviceInfoSet, DeviceInterfaceData, DeviceInterfaceDetailData_out, DeviceInterfaceDetailDataSize, RequiredSize_out, DeviceInfoData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdeviceinterfacepropertykeys
  public static SetupDiGetDeviceInterfacePropertyKeys(
    DeviceInfoSet: HDEVINFO,
    DeviceInterfaceData: PSP_DEVICE_INTERFACE_DATA,
    PropertyKeyArray_out: OPTIONAL<PDEVPROPKEY>,
    PropertyKeyCount: DWORD,
    RequiredPropertyKeyCount_out: OPTIONAL<PDWORD>,
    Flags: DWORD,
  ): BOOL {
    return Setupapi.Load('SetupDiGetDeviceInterfacePropertyKeys')(DeviceInfoSet, DeviceInterfaceData, PropertyKeyArray_out, PropertyKeyCount, RequiredPropertyKeyCount_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdeviceinterfacepropertyw
  public static SetupDiGetDeviceInterfacePropertyW(
    DeviceInfoSet: HDEVINFO,
    DeviceInterfaceData: PSP_DEVICE_INTERFACE_DATA,
    PropertyKey: PDEVPROPKEY,
    PropertyType_out: PDEVPROPTYPE,
    PropertyBuffer_out: OPTIONAL<PBYTE>,
    PropertyBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
    Flags: DWORD,
  ): BOOL {
    return Setupapi.Load('SetupDiGetDeviceInterfacePropertyW')(DeviceInfoSet, DeviceInterfaceData, PropertyKey, PropertyType_out, PropertyBuffer_out, PropertyBufferSize, RequiredSize_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdevicepropertykeys
  public static SetupDiGetDevicePropertyKeys(
    DeviceInfoSet: HDEVINFO,
    DeviceInfoData: PSP_DEVINFO_DATA,
    PropertyKeyArray_out: OPTIONAL<PDEVPROPKEY>,
    PropertyKeyCount: DWORD,
    RequiredPropertyKeyCount_out: OPTIONAL<PDWORD>,
    Flags: DWORD,
  ): BOOL {
    return Setupapi.Load('SetupDiGetDevicePropertyKeys')(DeviceInfoSet, DeviceInfoData, PropertyKeyArray_out, PropertyKeyCount, RequiredPropertyKeyCount_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdevicepropertyw
  public static SetupDiGetDevicePropertyW(
    DeviceInfoSet: HDEVINFO,
    DeviceInfoData: PSP_DEVINFO_DATA,
    PropertyKey: PDEVPROPKEY,
    PropertyType_out: PDEVPROPTYPE,
    PropertyBuffer_out: OPTIONAL<PBYTE>,
    PropertyBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
    Flags: DWORD,
  ): BOOL {
    return Setupapi.Load('SetupDiGetDevicePropertyW')(DeviceInfoSet, DeviceInfoData, PropertyKey, PropertyType_out, PropertyBuffer_out, PropertyBufferSize, RequiredSize_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdeviceregistrypropertya
  public static SetupDiGetDeviceRegistryPropertyA(
    DeviceInfoSet: HDEVINFO,
    DeviceInfoData: PSP_DEVINFO_DATA,
    Property: DWORD,
    PropertyRegDataType_out: OPTIONAL<PDWORD>,
    PropertyBuffer_out: OPTIONAL<PBYTE>,
    PropertyBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetDeviceRegistryPropertyA')(DeviceInfoSet, DeviceInfoData, Property, PropertyRegDataType_out, PropertyBuffer_out, PropertyBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdeviceregistrypropertyw
  public static SetupDiGetDeviceRegistryPropertyW(
    DeviceInfoSet: HDEVINFO,
    DeviceInfoData: PSP_DEVINFO_DATA,
    Property: DWORD,
    PropertyRegDataType_out: OPTIONAL<PDWORD>,
    PropertyBuffer_out: OPTIONAL<PBYTE>,
    PropertyBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetDeviceRegistryPropertyW')(DeviceInfoSet, DeviceInfoData, Property, PropertyRegDataType_out, PropertyBuffer_out, PropertyBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdriverinfodetaila
  public static SetupDiGetDriverInfoDetailA(
    DeviceInfoSet: HDEVINFO,
    DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>,
    DriverInfoData: PSP_DRVINFO_DATA_A,
    DriverInfoDetailData_in_out: OPTIONAL<PSP_DRVINFO_DETAIL_DATA_A>,
    DriverInfoDetailDataSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetDriverInfoDetailA')(DeviceInfoSet, DeviceInfoData, DriverInfoData, DriverInfoDetailData_in_out, DriverInfoDetailDataSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdriverinfodetailw
  public static SetupDiGetDriverInfoDetailW(
    DeviceInfoSet: HDEVINFO,
    DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>,
    DriverInfoData: PSP_DRVINFO_DATA_W,
    DriverInfoDetailData_in_out: OPTIONAL<PSP_DRVINFO_DETAIL_DATA_W>,
    DriverInfoDetailDataSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupDiGetDriverInfoDetailW')(DeviceInfoSet, DeviceInfoData, DriverInfoData, DriverInfoDetailData_in_out, DriverInfoDetailDataSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdriverinstallparamsa
  public static SetupDiGetDriverInstallParamsA(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, DriverInfoData: PSP_DRVINFO_DATA_A, DriverInstallParams_out: PSP_DRVINSTALL_PARAMS): BOOL {
    return Setupapi.Load('SetupDiGetDriverInstallParamsA')(DeviceInfoSet, DeviceInfoData, DriverInfoData, DriverInstallParams_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetdriverinstallparamsw
  public static SetupDiGetDriverInstallParamsW(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, DriverInfoData: PSP_DRVINFO_DATA_W, DriverInstallParams_out: PSP_DRVINSTALL_PARAMS): BOOL {
    return Setupapi.Load('SetupDiGetDriverInstallParamsW')(DeviceInfoSet, DeviceInfoData, DriverInfoData, DriverInstallParams_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigethwprofilefriendlynamea
  public static SetupDiGetHwProfileFriendlyNameA(HwProfile: DWORD, FriendlyName_out: PSTR, FriendlyNameSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupDiGetHwProfileFriendlyNameA')(HwProfile, FriendlyName_out, FriendlyNameSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigethwprofilefriendlynameexa
  public static SetupDiGetHwProfileFriendlyNameExA(HwProfile: DWORD, FriendlyName_out: PSTR, FriendlyNameSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>, MachineName: OPTIONAL<PCSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiGetHwProfileFriendlyNameExA')(HwProfile, FriendlyName_out, FriendlyNameSize, RequiredSize_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigethwprofilefriendlynameexw
  public static SetupDiGetHwProfileFriendlyNameExW(HwProfile: DWORD, FriendlyName_out: PWSTR, FriendlyNameSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>, MachineName: OPTIONAL<PCWSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiGetHwProfileFriendlyNameExW')(HwProfile, FriendlyName_out, FriendlyNameSize, RequiredSize_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigethwprofilefriendlynamew
  public static SetupDiGetHwProfileFriendlyNameW(HwProfile: DWORD, FriendlyName_out: PWSTR, FriendlyNameSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupDiGetHwProfileFriendlyNameW')(HwProfile, FriendlyName_out, FriendlyNameSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigethwprofilelist
  public static SetupDiGetHwProfileList(HwProfileList_out: PDWORD, HwProfileListSize: DWORD, RequiredSize_out: PDWORD, CurrentlyActiveIndex_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupDiGetHwProfileList')(HwProfileList_out, HwProfileListSize, RequiredSize_out, CurrentlyActiveIndex_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigethwprofilelistexa
  public static SetupDiGetHwProfileListExA(HwProfileList_out: PDWORD, HwProfileListSize: DWORD, RequiredSize_out: PDWORD, CurrentlyActiveIndex_out: OPTIONAL<PDWORD>, MachineName: OPTIONAL<PCSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiGetHwProfileListExA')(HwProfileList_out, HwProfileListSize, RequiredSize_out, CurrentlyActiveIndex_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigethwprofilelistexw
  public static SetupDiGetHwProfileListExW(HwProfileList_out: PDWORD, HwProfileListSize: DWORD, RequiredSize_out: PDWORD, CurrentlyActiveIndex_out: OPTIONAL<PDWORD>, MachineName: OPTIONAL<PCWSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiGetHwProfileListExW')(HwProfileList_out, HwProfileListSize, RequiredSize_out, CurrentlyActiveIndex_out, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetinfclassa
  public static SetupDiGetINFClassA(InfName: PCSTR, ClassGuid_out: LPGUID, ClassName_out: PSTR, ClassNameSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupDiGetINFClassA')(InfName, ClassGuid_out, ClassName_out, ClassNameSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetinfclassw
  public static SetupDiGetINFClassW(InfName: PCWSTR, ClassGuid_out: LPGUID, ClassName_out: PWSTR, ClassNameSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupDiGetINFClassW')(InfName, ClassGuid_out, ClassName_out, ClassNameSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetselecteddevice
  public static SetupDiGetSelectedDevice(DeviceInfoSet: HDEVINFO, DeviceInfoData_out: PSP_DEVINFO_DATA): BOOL {
    return Setupapi.Load('SetupDiGetSelectedDevice')(DeviceInfoSet, DeviceInfoData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetselecteddrivera
  public static SetupDiGetSelectedDriverA(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, DriverInfoData_out: PSP_DRVINFO_DATA_A): BOOL {
    return Setupapi.Load('SetupDiGetSelectedDriverA')(DeviceInfoSet, DeviceInfoData, DriverInfoData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetselecteddriverw
  public static SetupDiGetSelectedDriverW(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, DriverInfoData_out: PSP_DRVINFO_DATA_W): BOOL {
    return Setupapi.Load('SetupDiGetSelectedDriverW')(DeviceInfoSet, DeviceInfoData, DriverInfoData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetwizardpage
  public static SetupDiGetWizardPage(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, InstallWizardData: PSP_INSTALLWIZARD_DATA, PageType: DWORD, Flags: DWORD): HPROPSHEETPAGE {
    return Setupapi.Load('SetupDiGetWizardPage')(DeviceInfoSet, DeviceInfoData, InstallWizardData, PageType, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiinstallclassa
  public static SetupDiInstallClassA(hwndParent: OPTIONAL<HWND>, InfFileName: PCSTR, Flags: DWORD, FileQueue: OPTIONAL<HSPFILEQ>): BOOL {
    return Setupapi.Load('SetupDiInstallClassA')(hwndParent, InfFileName, Flags, FileQueue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiinstallclassexa
  public static SetupDiInstallClassExA(
    hwndParent: OPTIONAL<HWND>,
    InfFileName: OPTIONAL<PCSTR>,
    Flags: DWORD,
    FileQueue: OPTIONAL<HSPFILEQ>,
    InterfaceClassGuid: OPTIONAL<LPGUID>,
    Reserved1: OPTIONAL<PVOID>,
    Reserved2: OPTIONAL<PVOID>,
  ): BOOL {
    return Setupapi.Load('SetupDiInstallClassExA')(hwndParent, InfFileName, Flags, FileQueue, InterfaceClassGuid, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiinstallclassexw
  public static SetupDiInstallClassExW(
    hwndParent: OPTIONAL<HWND>,
    InfFileName: OPTIONAL<PCWSTR>,
    Flags: DWORD,
    FileQueue: OPTIONAL<HSPFILEQ>,
    InterfaceClassGuid: OPTIONAL<LPGUID>,
    Reserved1: OPTIONAL<PVOID>,
    Reserved2: OPTIONAL<PVOID>,
  ): BOOL {
    return Setupapi.Load('SetupDiInstallClassExW')(hwndParent, InfFileName, Flags, FileQueue, InterfaceClassGuid, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiinstallclassw
  public static SetupDiInstallClassW(hwndParent: OPTIONAL<HWND>, InfFileName: PCWSTR, Flags: DWORD, FileQueue: OPTIONAL<HSPFILEQ>): BOOL {
    return Setupapi.Load('SetupDiInstallClassW')(hwndParent, InfFileName, Flags, FileQueue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiinstalldevice
  public static SetupDiInstallDevice(DeviceInfoSet: HDEVINFO, DeviceInfoData_in_out: PSP_DEVINFO_DATA): BOOL {
    return Setupapi.Load('SetupDiInstallDevice')(DeviceInfoSet, DeviceInfoData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiinstalldeviceinterfaces
  public static SetupDiInstallDeviceInterfaces(DeviceInfoSet: HDEVINFO, DeviceInfoData: PSP_DEVINFO_DATA): BOOL {
    return Setupapi.Load('SetupDiInstallDeviceInterfaces')(DeviceInfoSet, DeviceInfoData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiinstalldriverfiles
  public static SetupDiInstallDriverFiles(DeviceInfoSet: HDEVINFO, DeviceInfoData: PSP_DEVINFO_DATA): BOOL {
    return Setupapi.Load('SetupDiInstallDriverFiles')(DeviceInfoSet, DeviceInfoData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiloadclassicon
  public static SetupDiLoadClassIcon(ClassGuid: LPGUID, LargeIcon_out: OPTIONAL<PHICON>, MiniIconIndex_out: OPTIONAL<PINT>): BOOL {
    return Setupapi.Load('SetupDiLoadClassIcon')(ClassGuid, LargeIcon_out, MiniIconIndex_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiloaddeviceicon
  public static SetupDiLoadDeviceIcon(DeviceInfoSet: HDEVINFO, DeviceInfoData: PSP_DEVINFO_DATA, cxIcon: UINT, cyIcon: UINT, Flags: DWORD, hIcon_out: PHICON): BOOL {
    return Setupapi.Load('SetupDiLoadDeviceIcon')(DeviceInfoSet, DeviceInfoData, cxIcon, cyIcon, Flags, hIcon_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiopenclassregkey
  public static SetupDiOpenClassRegKey(ClassGuid: OPTIONAL<LPGUID>, samDesired: REGSAM): HKEY {
    return Setupapi.Load('SetupDiOpenClassRegKey')(ClassGuid, samDesired);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiopenclassregkeyexa
  public static SetupDiOpenClassRegKeyExA(ClassGuid: OPTIONAL<LPGUID>, samDesired: REGSAM, Flags: DWORD, MachineName: OPTIONAL<PCSTR>, Reserved: OPTIONAL<PVOID>): HKEY {
    return Setupapi.Load('SetupDiOpenClassRegKeyExA')(ClassGuid, samDesired, Flags, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiopenclassregkeyexw
  public static SetupDiOpenClassRegKeyExW(ClassGuid: OPTIONAL<LPGUID>, samDesired: REGSAM, Flags: DWORD, MachineName: OPTIONAL<PCWSTR>, Reserved: OPTIONAL<PVOID>): HKEY {
    return Setupapi.Load('SetupDiOpenClassRegKeyExW')(ClassGuid, samDesired, Flags, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiopendevregkey
  public static SetupDiOpenDevRegKey(DeviceInfoSet: HDEVINFO, DeviceInfoData: PSP_DEVINFO_DATA, Scope: DWORD, HwProfile: DWORD, KeyType: DWORD, samDesired: REGSAM): HKEY {
    return Setupapi.Load('SetupDiOpenDevRegKey')(DeviceInfoSet, DeviceInfoData, Scope, HwProfile, KeyType, samDesired);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiopendeviceinfoa
  public static SetupDiOpenDeviceInfoA(DeviceInfoSet: HDEVINFO, DeviceInstanceId: PCSTR, hwndParent: OPTIONAL<HWND>, OpenFlags: DWORD, DeviceInfoData_out: OPTIONAL<PSP_DEVINFO_DATA>): BOOL {
    return Setupapi.Load('SetupDiOpenDeviceInfoA')(DeviceInfoSet, DeviceInstanceId, hwndParent, OpenFlags, DeviceInfoData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiopendeviceinfow
  public static SetupDiOpenDeviceInfoW(DeviceInfoSet: HDEVINFO, DeviceInstanceId: PCWSTR, hwndParent: OPTIONAL<HWND>, OpenFlags: DWORD, DeviceInfoData_out: OPTIONAL<PSP_DEVINFO_DATA>): BOOL {
    return Setupapi.Load('SetupDiOpenDeviceInfoW')(DeviceInfoSet, DeviceInstanceId, hwndParent, OpenFlags, DeviceInfoData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiopendeviceinterfacea
  public static SetupDiOpenDeviceInterfaceA(DeviceInfoSet: HDEVINFO, DevicePath: PCSTR, OpenFlags: DWORD, DeviceInterfaceData_out: OPTIONAL<PSP_DEVICE_INTERFACE_DATA>): BOOL {
    return Setupapi.Load('SetupDiOpenDeviceInterfaceA')(DeviceInfoSet, DevicePath, OpenFlags, DeviceInterfaceData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiopendeviceinterfaceregkey
  public static SetupDiOpenDeviceInterfaceRegKey(DeviceInfoSet: HDEVINFO, DeviceInterfaceData: PSP_DEVICE_INTERFACE_DATA, Reserved: DWORD, samDesired: REGSAM): HKEY {
    return Setupapi.Load('SetupDiOpenDeviceInterfaceRegKey')(DeviceInfoSet, DeviceInterfaceData, Reserved, samDesired);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiopendeviceinterfacew
  public static SetupDiOpenDeviceInterfaceW(DeviceInfoSet: HDEVINFO, DevicePath: PCWSTR, OpenFlags: DWORD, DeviceInterfaceData_out: OPTIONAL<PSP_DEVICE_INTERFACE_DATA>): BOOL {
    return Setupapi.Load('SetupDiOpenDeviceInterfaceW')(DeviceInfoSet, DevicePath, OpenFlags, DeviceInterfaceData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiregistercodeviceinstallers
  public static SetupDiRegisterCoDeviceInstallers(DeviceInfoSet: HDEVINFO, DeviceInfoData: PSP_DEVINFO_DATA): BOOL {
    return Setupapi.Load('SetupDiRegisterCoDeviceInstallers')(DeviceInfoSet, DeviceInfoData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiregisterdeviceinfo
  public static SetupDiRegisterDeviceInfo(
    DeviceInfoSet: HDEVINFO,
    DeviceInfoData_in_out: PSP_DEVINFO_DATA,
    Flags: DWORD,
    CompareProc: OPTIONAL<PSP_DETSIG_CMPPROC>,
    CompareContext: OPTIONAL<PVOID>,
    DupDeviceInfoData_out: OPTIONAL<PSP_DEVINFO_DATA>,
  ): BOOL {
    return Setupapi.Load('SetupDiRegisterDeviceInfo')(DeviceInfoSet, DeviceInfoData_in_out, Flags, CompareProc, CompareContext, DupDeviceInfoData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiremovedevice
  public static SetupDiRemoveDevice(DeviceInfoSet: HDEVINFO, DeviceInfoData_in_out: PSP_DEVINFO_DATA): BOOL {
    return Setupapi.Load('SetupDiRemoveDevice')(DeviceInfoSet, DeviceInfoData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiremovedeviceinterface
  public static SetupDiRemoveDeviceInterface(DeviceInfoSet: HDEVINFO, DeviceInterfaceData_in_out: PSP_DEVICE_INTERFACE_DATA): BOOL {
    return Setupapi.Load('SetupDiRemoveDeviceInterface')(DeviceInfoSet, DeviceInterfaceData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdirestartdevices
  public static SetupDiRestartDevices(DeviceInfoSet: HDEVINFO, DeviceInfoData_in_out: PSP_DEVINFO_DATA): BOOL {
    return Setupapi.Load('SetupDiRestartDevices')(DeviceInfoSet, DeviceInfoData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiselectbestcompatdrv
  public static SetupDiSelectBestCompatDrv(DeviceInfoSet: HDEVINFO, DeviceInfoData_in_out: OPTIONAL<PSP_DEVINFO_DATA>): BOOL {
    return Setupapi.Load('SetupDiSelectBestCompatDrv')(DeviceInfoSet, DeviceInfoData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiselectdevice
  public static SetupDiSelectDevice(DeviceInfoSet: HDEVINFO, DeviceInfoData_in_out: OPTIONAL<PSP_DEVINFO_DATA>): BOOL {
    return Setupapi.Load('SetupDiSelectDevice')(DeviceInfoSet, DeviceInfoData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiselectoemdrv
  public static SetupDiSelectOEMDrv(hwndParent: OPTIONAL<HWND>, DeviceInfoSet: HDEVINFO, DeviceInfoData_in_out: OPTIONAL<PSP_DEVINFO_DATA>): BOOL {
    return Setupapi.Load('SetupDiSelectOEMDrv')(hwndParent, DeviceInfoSet, DeviceInfoData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetclassinstallparamsa
  public static SetupDiSetClassInstallParamsA(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, ClassInstallParams: OPTIONAL<PSP_CLASSINSTALL_HEADER>, ClassInstallParamsSize: DWORD): BOOL {
    return Setupapi.Load('SetupDiSetClassInstallParamsA')(DeviceInfoSet, DeviceInfoData, ClassInstallParams, ClassInstallParamsSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetclassinstallparamsw
  public static SetupDiSetClassInstallParamsW(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, ClassInstallParams: OPTIONAL<PSP_CLASSINSTALL_HEADER>, ClassInstallParamsSize: DWORD): BOOL {
    return Setupapi.Load('SetupDiSetClassInstallParamsW')(DeviceInfoSet, DeviceInfoData, ClassInstallParams, ClassInstallParamsSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetclasspropertyexw
  public static SetupDiSetClassPropertyExW(
    ClassGuid: LPGUID,
    PropertyKey: PDEVPROPKEY,
    PropertyType: DEVPROPTYPE,
    PropertyBuffer: OPTIONAL<PBYTE>,
    PropertyBufferSize: DWORD,
    Flags: DWORD,
    MachineName: OPTIONAL<PCWSTR>,
    Reserved: OPTIONAL<PVOID>,
  ): BOOL {
    return Setupapi.Load('SetupDiSetClassPropertyExW')(ClassGuid, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, Flags, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetclasspropertyw
  public static SetupDiSetClassPropertyW(ClassGuid: LPGUID, PropertyKey: PDEVPROPKEY, PropertyType: DEVPROPTYPE, PropertyBuffer: OPTIONAL<PBYTE>, PropertyBufferSize: DWORD, Flags: DWORD): BOOL {
    return Setupapi.Load('SetupDiSetClassPropertyW')(ClassGuid, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetclassregistrypropertya
  public static SetupDiSetClassRegistryPropertyA(ClassGuid: LPGUID, Property: DWORD, PropertyBuffer: OPTIONAL<PBYTE>, PropertyBufferSize: DWORD, MachineName: OPTIONAL<PCSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiSetClassRegistryPropertyA')(ClassGuid, Property, PropertyBuffer, PropertyBufferSize, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetclassregistrypropertyw
  public static SetupDiSetClassRegistryPropertyW(ClassGuid: LPGUID, Property: DWORD, PropertyBuffer: OPTIONAL<PBYTE>, PropertyBufferSize: DWORD, MachineName: OPTIONAL<PCWSTR>, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiSetClassRegistryPropertyW')(ClassGuid, Property, PropertyBuffer, PropertyBufferSize, MachineName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetdeviceinstallparamsa
  public static SetupDiSetDeviceInstallParamsA(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, DeviceInstallParams: PSP_DEVINSTALL_PARAMS_A): BOOL {
    return Setupapi.Load('SetupDiSetDeviceInstallParamsA')(DeviceInfoSet, DeviceInfoData, DeviceInstallParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetdeviceinstallparamsw
  public static SetupDiSetDeviceInstallParamsW(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, DeviceInstallParams: PSP_DEVINSTALL_PARAMS_W): BOOL {
    return Setupapi.Load('SetupDiSetDeviceInstallParamsW')(DeviceInfoSet, DeviceInfoData, DeviceInstallParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetdeviceinterfacedefault
  public static SetupDiSetDeviceInterfaceDefault(DeviceInfoSet: HDEVINFO, DeviceInterfaceData_in_out: PSP_DEVICE_INTERFACE_DATA, Flags: DWORD, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupDiSetDeviceInterfaceDefault')(DeviceInfoSet, DeviceInterfaceData_in_out, Flags, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetdeviceinterfacepropertyw
  public static SetupDiSetDeviceInterfacePropertyW(
    DeviceInfoSet: HDEVINFO,
    DeviceInterfaceData: PSP_DEVICE_INTERFACE_DATA,
    PropertyKey: PDEVPROPKEY,
    PropertyType: DEVPROPTYPE,
    PropertyBuffer: OPTIONAL<PBYTE>,
    PropertyBufferSize: DWORD,
    Flags: DWORD,
  ): BOOL {
    return Setupapi.Load('SetupDiSetDeviceInterfacePropertyW')(DeviceInfoSet, DeviceInterfaceData, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetdevicepropertyw
  public static SetupDiSetDevicePropertyW(DeviceInfoSet: HDEVINFO, DeviceInfoData: PSP_DEVINFO_DATA, PropertyKey: PDEVPROPKEY, PropertyType: DEVPROPTYPE, PropertyBuffer: OPTIONAL<PBYTE>, PropertyBufferSize: DWORD, Flags: DWORD): BOOL {
    return Setupapi.Load('SetupDiSetDevicePropertyW')(DeviceInfoSet, DeviceInfoData, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetdeviceregistrypropertya
  public static SetupDiSetDeviceRegistryPropertyA(DeviceInfoSet: HDEVINFO, DeviceInfoData_in_out: PSP_DEVINFO_DATA, Property: DWORD, PropertyBuffer: OPTIONAL<PBYTE>, PropertyBufferSize: DWORD): BOOL {
    return Setupapi.Load('SetupDiSetDeviceRegistryPropertyA')(DeviceInfoSet, DeviceInfoData_in_out, Property, PropertyBuffer, PropertyBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetdeviceregistrypropertyw
  public static SetupDiSetDeviceRegistryPropertyW(DeviceInfoSet: HDEVINFO, DeviceInfoData_in_out: PSP_DEVINFO_DATA, Property: DWORD, PropertyBuffer: OPTIONAL<PBYTE>, PropertyBufferSize: DWORD): BOOL {
    return Setupapi.Load('SetupDiSetDeviceRegistryPropertyW')(DeviceInfoSet, DeviceInfoData_in_out, Property, PropertyBuffer, PropertyBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetdriverinstallparamsa
  public static SetupDiSetDriverInstallParamsA(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, DriverInfoData: PSP_DRVINFO_DATA_A, DriverInstallParams: PSP_DRVINSTALL_PARAMS): BOOL {
    return Setupapi.Load('SetupDiSetDriverInstallParamsA')(DeviceInfoSet, DeviceInfoData, DriverInfoData, DriverInstallParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetdriverinstallparamsw
  public static SetupDiSetDriverInstallParamsW(DeviceInfoSet: HDEVINFO, DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>, DriverInfoData: PSP_DRVINFO_DATA_W, DriverInstallParams: PSP_DRVINSTALL_PARAMS): BOOL {
    return Setupapi.Load('SetupDiSetDriverInstallParamsW')(DeviceInfoSet, DeviceInfoData, DriverInfoData, DriverInstallParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetselecteddevice
  public static SetupDiSetSelectedDevice(DeviceInfoSet: HDEVINFO, DeviceInfoData: PSP_DEVINFO_DATA): BOOL {
    return Setupapi.Load('SetupDiSetSelectedDevice')(DeviceInfoSet, DeviceInfoData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetselecteddrivera
  public static SetupDiSetSelectedDriverA(DeviceInfoSet: HDEVINFO, DeviceInfoData_in_out: OPTIONAL<PSP_DEVINFO_DATA>, DriverInfoData_in_out: OPTIONAL<PSP_DRVINFO_DATA_A>): BOOL {
    return Setupapi.Load('SetupDiSetSelectedDriverA')(DeviceInfoSet, DeviceInfoData_in_out, DriverInfoData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdisetselecteddriverw
  public static SetupDiSetSelectedDriverW(DeviceInfoSet: HDEVINFO, DeviceInfoData_in_out: OPTIONAL<PSP_DEVINFO_DATA>, DriverInfoData_in_out: OPTIONAL<PSP_DRVINFO_DATA_W>): BOOL {
    return Setupapi.Load('SetupDiSetSelectedDriverW')(DeviceInfoSet, DeviceInfoData_in_out, DriverInfoData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdiunremovedevice
  public static SetupDiUnremoveDevice(DeviceInfoSet: HDEVINFO, DeviceInfoData_in_out: PSP_DEVINFO_DATA): BOOL {
    return Setupapi.Load('SetupDiUnremoveDevice')(DeviceInfoSet, DeviceInfoData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupduplicatediskspacelista
  public static SetupDuplicateDiskSpaceListA(DiskSpace: HDSKSPC, Reserved1: OPTIONAL<PVOID>, Reserved2: DWORD, Flags: UINT): HDSKSPC {
    return Setupapi.Load('SetupDuplicateDiskSpaceListA')(DiskSpace, Reserved1, Reserved2, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupduplicatediskspacelistw
  public static SetupDuplicateDiskSpaceListW(DiskSpace: HDSKSPC, Reserved1: OPTIONAL<PVOID>, Reserved2: DWORD, Flags: UINT): HDSKSPC {
    return Setupapi.Load('SetupDuplicateDiskSpaceListW')(DiskSpace, Reserved1, Reserved2, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupenuminfsectionsa
  public static SetupEnumInfSectionsA(InfHandle: HINF, Index: UINT, Buffer_out: OPTIONAL<PSTR>, Size: UINT, SizeNeeded_out: OPTIONAL<PUINT>): BOOL {
    return Setupapi.Load('SetupEnumInfSectionsA')(InfHandle, Index, Buffer_out, Size, SizeNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupenuminfsectionsw
  public static SetupEnumInfSectionsW(InfHandle: HINF, Index: UINT, Buffer_out: OPTIONAL<PWSTR>, Size: UINT, SizeNeeded_out: OPTIONAL<PUINT>): BOOL {
    return Setupapi.Load('SetupEnumInfSectionsW')(InfHandle, Index, Buffer_out, Size, SizeNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupfindfirstlinea
  public static SetupFindFirstLineA(InfHandle: HINF, Section: PCSTR, Key: OPTIONAL<PCSTR>, Context_out: PINFCONTEXT): BOOL {
    return Setupapi.Load('SetupFindFirstLineA')(InfHandle, Section, Key, Context_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupfindfirstlinew
  public static SetupFindFirstLineW(InfHandle: HINF, Section: PCWSTR, Key: OPTIONAL<PCWSTR>, Context_out: PINFCONTEXT): BOOL {
    return Setupapi.Load('SetupFindFirstLineW')(InfHandle, Section, Key, Context_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupfindnextline
  public static SetupFindNextLine(ContextIn: PINFCONTEXT, ContextOut_out: PINFCONTEXT): BOOL {
    return Setupapi.Load('SetupFindNextLine')(ContextIn, ContextOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupfindnextmatchlinea
  public static SetupFindNextMatchLineA(ContextIn: PINFCONTEXT, Key: OPTIONAL<PCSTR>, ContextOut_out: PINFCONTEXT): BOOL {
    return Setupapi.Load('SetupFindNextMatchLineA')(ContextIn, Key, ContextOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupfindnextmatchlinew
  public static SetupFindNextMatchLineW(ContextIn: PINFCONTEXT, Key: OPTIONAL<PCWSTR>, ContextOut_out: PINFCONTEXT): BOOL {
    return Setupapi.Load('SetupFindNextMatchLineW')(ContextIn, Key, ContextOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupfreesourcelista
  public static SetupFreeSourceListA(List_in_out: PPCSTR, Count: UINT): BOOL {
    return Setupapi.Load('SetupFreeSourceListA')(List_in_out, Count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupfreesourcelistw
  public static SetupFreeSourceListW(List_in_out: PPCWSTR, Count: UINT): BOOL {
    return Setupapi.Load('SetupFreeSourceListW')(List_in_out, Count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetbackupinformationa
  public static SetupGetBackupInformationA(QueueHandle: HSPFILEQ, BackupParams_in_out: PSP_BACKUP_QUEUE_PARAMS_A): BOOL {
    return Setupapi.Load('SetupGetBackupInformationA')(QueueHandle, BackupParams_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetbackupinformationw
  public static SetupGetBackupInformationW(QueueHandle: HSPFILEQ, BackupParams_in_out: PSP_BACKUP_QUEUE_PARAMS_W): BOOL {
    return Setupapi.Load('SetupGetBackupInformationW')(QueueHandle, BackupParams_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetbinaryfield
  public static SetupGetBinaryField(Context: PINFCONTEXT, FieldIndex: DWORD, ReturnBuffer_out: OPTIONAL<PBYTE>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<LPDWORD>): BOOL {
    return Setupapi.Load('SetupGetBinaryField')(Context, FieldIndex, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetfieldcount
  public static SetupGetFieldCount(Context: PINFCONTEXT): DWORD {
    return Setupapi.Load('SetupGetFieldCount')(Context);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetfilecompressioninfoa
  public static SetupGetFileCompressionInfoA(SourceFileName: PCSTR, ActualSourceFileName_out: PPSTR, SourceFileSize_out: PDWORD, TargetFileSize_out: PDWORD, CompressionType_out: PUINT): DWORD {
    return Setupapi.Load('SetupGetFileCompressionInfoA')(SourceFileName, ActualSourceFileName_out, SourceFileSize_out, TargetFileSize_out, CompressionType_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetfilecompressioninfoexa
  public static SetupGetFileCompressionInfoExA(
    SourceFileName: PCSTR,
    ActualSourceFileNameBuffer: OPTIONAL<PSTR>,
    ActualSourceFileNameBufferLen: DWORD,
    RequiredBufferLen_out: OPTIONAL<PDWORD>,
    SourceFileSize_out: PDWORD,
    TargetFileSize_out: PDWORD,
    CompressionType_out: PUINT,
  ): BOOL {
    return Setupapi.Load('SetupGetFileCompressionInfoExA')(SourceFileName, ActualSourceFileNameBuffer, ActualSourceFileNameBufferLen, RequiredBufferLen_out, SourceFileSize_out, TargetFileSize_out, CompressionType_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetfilecompressioninfoexw
  public static SetupGetFileCompressionInfoExW(
    SourceFileName: PCWSTR,
    ActualSourceFileNameBuffer: OPTIONAL<PWSTR>,
    ActualSourceFileNameBufferLen: DWORD,
    RequiredBufferLen_out: OPTIONAL<PDWORD>,
    SourceFileSize_out: PDWORD,
    TargetFileSize_out: PDWORD,
    CompressionType_out: PUINT,
  ): BOOL {
    return Setupapi.Load('SetupGetFileCompressionInfoExW')(SourceFileName, ActualSourceFileNameBuffer, ActualSourceFileNameBufferLen, RequiredBufferLen_out, SourceFileSize_out, TargetFileSize_out, CompressionType_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetfilecompressioninfow
  public static SetupGetFileCompressionInfoW(SourceFileName: PCWSTR, ActualSourceFileName_out: PPWSTR, SourceFileSize_out: PDWORD, TargetFileSize_out: PDWORD, CompressionType_out: PUINT): DWORD {
    return Setupapi.Load('SetupGetFileCompressionInfoW')(SourceFileName, ActualSourceFileName_out, SourceFileSize_out, TargetFileSize_out, CompressionType_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetfilequeuecount
  public static SetupGetFileQueueCount(FileQueue: HSPFILEQ, SubQueueFileOp: UINT, NumOperations_out: PUINT): BOOL {
    return Setupapi.Load('SetupGetFileQueueCount')(FileQueue, SubQueueFileOp, NumOperations_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetfilequeueflags
  public static SetupGetFileQueueFlags(FileQueue: HSPFILEQ, Flags_out: PDWORD): BOOL {
    return Setupapi.Load('SetupGetFileQueueFlags')(FileQueue, Flags_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetinfdriverstorelocationa
  public static SetupGetInfDriverStoreLocationA(
    FileName: PCSTR,
    AlternatePlatformInfo: OPTIONAL<PSP_ALTPLATFORM_INFO>,
    LocaleName: OPTIONAL<PCSTR>,
    ReturnBuffer_out: PSTR,
    ReturnBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupGetInfDriverStoreLocationA')(FileName, AlternatePlatformInfo, LocaleName, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetinfdriverstorelocationw
  public static SetupGetInfDriverStoreLocationW(
    FileName: PCWSTR,
    AlternatePlatformInfo: OPTIONAL<PSP_ALTPLATFORM_INFO>,
    LocaleName: OPTIONAL<PCWSTR>,
    ReturnBuffer_out: PWSTR,
    ReturnBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupGetInfDriverStoreLocationW')(FileName, AlternatePlatformInfo, LocaleName, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetinffilelista
  public static SetupGetInfFileListA(DirectoryPath: OPTIONAL<PCSTR>, InfStyle: DWORD, ReturnBuffer_out: OPTIONAL<PSTR>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupGetInfFileListA')(DirectoryPath, InfStyle, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetinffilelistw
  public static SetupGetInfFileListW(DirectoryPath: OPTIONAL<PCWSTR>, InfStyle: DWORD, ReturnBuffer_out: PWSTR, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupGetInfFileListW')(DirectoryPath, InfStyle, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetinfinformationa
  public static SetupGetInfInformationA(InfSpec: LPCVOID, SearchControl: DWORD, ReturnBuffer_out: OPTIONAL<PSP_INF_INFORMATION>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupGetInfInformationA')(InfSpec, SearchControl, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetinfinformationw
  public static SetupGetInfInformationW(InfSpec: LPCVOID, SearchControl: DWORD, ReturnBuffer_out: OPTIONAL<PSP_INF_INFORMATION>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupGetInfInformationW')(InfSpec, SearchControl, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetinfpublishednamea
  public static SetupGetInfPublishedNameA(DriverStoreLocation: PCSTR, ReturnBuffer_out: PSTR, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupGetInfPublishedNameA')(DriverStoreLocation, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetinfpublishednamew
  public static SetupGetInfPublishedNameW(DriverStoreLocation: PCWSTR, ReturnBuffer_out: PWSTR, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupGetInfPublishedNameW')(DriverStoreLocation, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetintfield
  public static SetupGetIntField(Context: PINFCONTEXT, FieldIndex: DWORD, IntegerValue_out: PINT): BOOL {
    return Setupapi.Load('SetupGetIntField')(Context, FieldIndex, IntegerValue_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetlinebyindexa
  public static SetupGetLineByIndexA(InfHandle: HINF, Section: PCSTR, Index: DWORD, Context_out: PINFCONTEXT): BOOL {
    return Setupapi.Load('SetupGetLineByIndexA')(InfHandle, Section, Index, Context_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetlinebyindexw
  public static SetupGetLineByIndexW(InfHandle: HINF, Section: PCWSTR, Index: DWORD, Context_out: PINFCONTEXT): BOOL {
    return Setupapi.Load('SetupGetLineByIndexW')(InfHandle, Section, Index, Context_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetlinecounta
  public static SetupGetLineCountA(InfHandle: HINF, Section: PCSTR): LONG {
    return Setupapi.Load('SetupGetLineCountA')(InfHandle, Section);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetlinecountw
  public static SetupGetLineCountW(InfHandle: HINF, Section: PCWSTR): LONG {
    return Setupapi.Load('SetupGetLineCountW')(InfHandle, Section);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetlinetexta
  public static SetupGetLineTextA(
    Context: OPTIONAL<PINFCONTEXT>,
    InfHandle: OPTIONAL<HINF>,
    Section: OPTIONAL<PCSTR>,
    Key: OPTIONAL<PCSTR>,
    ReturnBuffer_out: OPTIONAL<PSTR>,
    ReturnBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupGetLineTextA')(Context, InfHandle, Section, Key, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetlinetextw
  public static SetupGetLineTextW(
    Context: OPTIONAL<PINFCONTEXT>,
    InfHandle: OPTIONAL<HINF>,
    Section: OPTIONAL<PCWSTR>,
    Key: OPTIONAL<PCWSTR>,
    ReturnBuffer_out: OPTIONAL<PWSTR>,
    ReturnBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupGetLineTextW')(Context, InfHandle, Section, Key, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetmultiszfielda
  public static SetupGetMultiSzFieldA(Context: PINFCONTEXT, FieldIndex: DWORD, ReturnBuffer_out: OPTIONAL<PSTR>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<LPDWORD>): BOOL {
    return Setupapi.Load('SetupGetMultiSzFieldA')(Context, FieldIndex, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetmultiszfieldw
  public static SetupGetMultiSzFieldW(Context: PINFCONTEXT, FieldIndex: DWORD, ReturnBuffer_out: OPTIONAL<PWSTR>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<LPDWORD>): BOOL {
    return Setupapi.Load('SetupGetMultiSzFieldW')(Context, FieldIndex, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetnoninteractivemode
  public static SetupGetNonInteractiveMode(): BOOL {
    return Setupapi.Load('SetupGetNonInteractiveMode')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetsourcefilelocationa
  public static SetupGetSourceFileLocationA(
    InfHandle: HINF,
    InfContext: OPTIONAL<PINFCONTEXT>,
    FileName: OPTIONAL<PCSTR>,
    SourceId_out: PUINT,
    ReturnBuffer_out: OPTIONAL<PSTR>,
    ReturnBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupGetSourceFileLocationA')(InfHandle, InfContext, FileName, SourceId_out, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetsourcefilelocationw
  public static SetupGetSourceFileLocationW(
    InfHandle: HINF,
    InfContext: OPTIONAL<PINFCONTEXT>,
    FileName: OPTIONAL<PCWSTR>,
    SourceId_out: PUINT,
    ReturnBuffer_out: OPTIONAL<PWSTR>,
    ReturnBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupGetSourceFileLocationW')(InfHandle, InfContext, FileName, SourceId_out, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetsourcefilesizea
  public static SetupGetSourceFileSizeA(InfHandle: HINF, InfContext: OPTIONAL<PINFCONTEXT>, FileName: OPTIONAL<PCSTR>, Section: OPTIONAL<PCSTR>, FileSize_out: PDWORD, RoundingFactor: UINT): BOOL {
    return Setupapi.Load('SetupGetSourceFileSizeA')(InfHandle, InfContext, FileName, Section, FileSize_out, RoundingFactor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetsourcefilesizew
  public static SetupGetSourceFileSizeW(InfHandle: HINF, InfContext: OPTIONAL<PINFCONTEXT>, FileName: OPTIONAL<PCWSTR>, Section: OPTIONAL<PCWSTR>, FileSize_out: PDWORD, RoundingFactor: UINT): BOOL {
    return Setupapi.Load('SetupGetSourceFileSizeW')(InfHandle, InfContext, FileName, Section, FileSize_out, RoundingFactor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetsourceinfoa
  public static SetupGetSourceInfoA(InfHandle: HINF, SourceId: UINT, InfoDesired: UINT, ReturnBuffer_out: OPTIONAL<PSTR>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupGetSourceInfoA')(InfHandle, SourceId, InfoDesired, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetsourceinfow
  public static SetupGetSourceInfoW(InfHandle: HINF, SourceId: UINT, InfoDesired: UINT, ReturnBuffer_out: OPTIONAL<PWSTR>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupGetSourceInfoW')(InfHandle, SourceId, InfoDesired, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetstringfielda
  public static SetupGetStringFieldA(Context: PINFCONTEXT, FieldIndex: DWORD, ReturnBuffer_out: OPTIONAL<PSTR>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupGetStringFieldA')(Context, FieldIndex, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgetstringfieldw
  public static SetupGetStringFieldW(Context: PINFCONTEXT, FieldIndex: DWORD, ReturnBuffer_out: OPTIONAL<PWSTR>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupGetStringFieldW')(Context, FieldIndex, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgettargetpatha
  public static SetupGetTargetPathA(InfHandle: HINF, InfContext: OPTIONAL<PINFCONTEXT>, Section: OPTIONAL<PCSTR>, ReturnBuffer_out: OPTIONAL<PSTR>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupGetTargetPathA')(InfHandle, InfContext, Section, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupgettargetpathw
  public static SetupGetTargetPathW(InfHandle: HINF, InfContext: OPTIONAL<PINFCONTEXT>, Section: OPTIONAL<PCWSTR>, ReturnBuffer_out: OPTIONAL<PWSTR>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupGetTargetPathW')(InfHandle, InfContext, Section, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinitdefaultqueuecallback
  public static SetupInitDefaultQueueCallback(OwnerWindow: OPTIONAL<HWND>): PVOID {
    return Setupapi.Load('SetupInitDefaultQueueCallback')(OwnerWindow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinitdefaultqueuecallbackex
  public static SetupInitDefaultQueueCallbackEx(OwnerWindow: OPTIONAL<HWND>, AlternateProgressWindow: OPTIONAL<HWND>, ProgressMessage: UINT, Reserved1: DWORD, Reserved2: OPTIONAL<PVOID>): PVOID {
    return Setupapi.Load('SetupInitDefaultQueueCallbackEx')(OwnerWindow, AlternateProgressWindow, ProgressMessage, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinitializefileloga
  public static SetupInitializeFileLogA(LogFileName: OPTIONAL<PCSTR>, Flags: DWORD): HSPFILELOG {
    return Setupapi.Load('SetupInitializeFileLogA')(LogFileName, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinitializefilelogw
  public static SetupInitializeFileLogW(LogFileName: OPTIONAL<PCWSTR>, Flags: DWORD): HSPFILELOG {
    return Setupapi.Load('SetupInitializeFileLogW')(LogFileName, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinstallfilea
  public static SetupInstallFileA(
    InfHandle: OPTIONAL<HINF>,
    InfContext: OPTIONAL<PINFCONTEXT>,
    SourceFile: OPTIONAL<PCSTR>,
    SourcePathRoot: OPTIONAL<PCSTR>,
    DestinationName: OPTIONAL<PCSTR>,
    CopyStyle: DWORD,
    CopyMsgHandler: OPTIONAL<PSP_FILE_CALLBACK_A>,
    Context: OPTIONAL<PVOID>,
  ): BOOL {
    return Setupapi.Load('SetupInstallFileA')(InfHandle, InfContext, SourceFile, SourcePathRoot, DestinationName, CopyStyle, CopyMsgHandler, Context);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinstallfileexa
  public static SetupInstallFileExA(
    InfHandle: OPTIONAL<HINF>,
    InfContext: OPTIONAL<PINFCONTEXT>,
    SourceFile: OPTIONAL<PCSTR>,
    SourcePathRoot: OPTIONAL<PCSTR>,
    DestinationName: OPTIONAL<PCSTR>,
    CopyStyle: DWORD,
    CopyMsgHandler: OPTIONAL<PSP_FILE_CALLBACK_A>,
    Context: OPTIONAL<PVOID>,
    FileWasInUse_out: PBOOL,
  ): BOOL {
    return Setupapi.Load('SetupInstallFileExA')(InfHandle, InfContext, SourceFile, SourcePathRoot, DestinationName, CopyStyle, CopyMsgHandler, Context, FileWasInUse_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinstallfileexw
  public static SetupInstallFileExW(
    InfHandle: OPTIONAL<HINF>,
    InfContext: OPTIONAL<PINFCONTEXT>,
    SourceFile: OPTIONAL<PCWSTR>,
    SourcePathRoot: OPTIONAL<PCWSTR>,
    DestinationName: OPTIONAL<PCWSTR>,
    CopyStyle: DWORD,
    CopyMsgHandler: OPTIONAL<PSP_FILE_CALLBACK_W>,
    Context: OPTIONAL<PVOID>,
    FileWasInUse_out: PBOOL,
  ): BOOL {
    return Setupapi.Load('SetupInstallFileExW')(InfHandle, InfContext, SourceFile, SourcePathRoot, DestinationName, CopyStyle, CopyMsgHandler, Context, FileWasInUse_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinstallfilew
  public static SetupInstallFileW(
    InfHandle: OPTIONAL<HINF>,
    InfContext: OPTIONAL<PINFCONTEXT>,
    SourceFile: OPTIONAL<PCWSTR>,
    SourcePathRoot: OPTIONAL<PCWSTR>,
    DestinationName: OPTIONAL<PCWSTR>,
    CopyStyle: DWORD,
    CopyMsgHandler: OPTIONAL<PSP_FILE_CALLBACK_W>,
    Context: OPTIONAL<PVOID>,
  ): BOOL {
    return Setupapi.Load('SetupInstallFileW')(InfHandle, InfContext, SourceFile, SourcePathRoot, DestinationName, CopyStyle, CopyMsgHandler, Context);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinstallfilesfrominfsectiona
  public static SetupInstallFilesFromInfSectionA(InfHandle: HINF, LayoutInfHandle: OPTIONAL<HINF>, FileQueue: HSPFILEQ, SectionName: PCSTR, SourceRootPath: OPTIONAL<PCSTR>, CopyFlags: UINT): BOOL {
    return Setupapi.Load('SetupInstallFilesFromInfSectionA')(InfHandle, LayoutInfHandle, FileQueue, SectionName, SourceRootPath, CopyFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinstallfilesfrominfsectionw
  public static SetupInstallFilesFromInfSectionW(InfHandle: HINF, LayoutInfHandle: OPTIONAL<HINF>, FileQueue: HSPFILEQ, SectionName: PCWSTR, SourceRootPath: OPTIONAL<PCWSTR>, CopyFlags: UINT): BOOL {
    return Setupapi.Load('SetupInstallFilesFromInfSectionW')(InfHandle, LayoutInfHandle, FileQueue, SectionName, SourceRootPath, CopyFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinstallfrominfsectiona
  public static SetupInstallFromInfSectionA(
    Owner: OPTIONAL<HWND>,
    InfHandle: HINF,
    SectionName: PCSTR,
    Flags: UINT,
    RelativeKeyRoot: OPTIONAL<HKEY>,
    SourceRootPath: OPTIONAL<PCSTR>,
    CopyFlags: UINT,
    MsgHandler: OPTIONAL<PSP_FILE_CALLBACK_A>,
    Context: OPTIONAL<PVOID>,
    DeviceInfoSet: OPTIONAL<HDEVINFO>,
    DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>,
  ): BOOL {
    return Setupapi.Load('SetupInstallFromInfSectionA')(Owner, InfHandle, SectionName, Flags, RelativeKeyRoot, SourceRootPath, CopyFlags, MsgHandler, Context, DeviceInfoSet, DeviceInfoData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinstallfrominfsectionw
  public static SetupInstallFromInfSectionW(
    Owner: OPTIONAL<HWND>,
    InfHandle: HINF,
    SectionName: PCWSTR,
    Flags: UINT,
    RelativeKeyRoot: OPTIONAL<HKEY>,
    SourceRootPath: OPTIONAL<PCWSTR>,
    CopyFlags: UINT,
    MsgHandler: OPTIONAL<PSP_FILE_CALLBACK_W>,
    Context: OPTIONAL<PVOID>,
    DeviceInfoSet: OPTIONAL<HDEVINFO>,
    DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>,
  ): BOOL {
    return Setupapi.Load('SetupInstallFromInfSectionW')(Owner, InfHandle, SectionName, Flags, RelativeKeyRoot, SourceRootPath, CopyFlags, MsgHandler, Context, DeviceInfoSet, DeviceInfoData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinstallservicesfrominfsectiona
  public static SetupInstallServicesFromInfSectionA(InfHandle: HINF, SectionName: PCSTR, Flags: DWORD): BOOL {
    return Setupapi.Load('SetupInstallServicesFromInfSectionA')(InfHandle, SectionName, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinstallservicesfrominfsectionexa
  public static SetupInstallServicesFromInfSectionExA(
    InfHandle: HINF,
    SectionName: PCSTR,
    Flags: DWORD,
    DeviceInfoSet: OPTIONAL<HDEVINFO>,
    DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>,
    Reserved1: OPTIONAL<PVOID>,
    Reserved2: OPTIONAL<PVOID>,
  ): BOOL {
    return Setupapi.Load('SetupInstallServicesFromInfSectionExA')(InfHandle, SectionName, Flags, DeviceInfoSet, DeviceInfoData, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinstallservicesfrominfsectionexw
  public static SetupInstallServicesFromInfSectionExW(
    InfHandle: HINF,
    SectionName: PCWSTR,
    Flags: DWORD,
    DeviceInfoSet: OPTIONAL<HDEVINFO>,
    DeviceInfoData: OPTIONAL<PSP_DEVINFO_DATA>,
    Reserved1: OPTIONAL<PVOID>,
    Reserved2: OPTIONAL<PVOID>,
  ): BOOL {
    return Setupapi.Load('SetupInstallServicesFromInfSectionExW')(InfHandle, SectionName, Flags, DeviceInfoSet, DeviceInfoData, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupinstallservicesfrominfsectionw
  public static SetupInstallServicesFromInfSectionW(InfHandle: HINF, SectionName: PCWSTR, Flags: DWORD): BOOL {
    return Setupapi.Load('SetupInstallServicesFromInfSectionW')(InfHandle, SectionName, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupiteratecabineta
  public static SetupIterateCabinetA(CabinetFile: PCSTR, Reserved: DWORD, MsgHandler: PSP_FILE_CALLBACK_A, Context: PVOID): BOOL {
    return Setupapi.Load('SetupIterateCabinetA')(CabinetFile, Reserved, MsgHandler, Context);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupiteratecabinetw
  public static SetupIterateCabinetW(CabinetFile: PCWSTR, Reserved: DWORD, MsgHandler: PSP_FILE_CALLBACK_W, Context: PVOID): BOOL {
    return Setupapi.Load('SetupIterateCabinetW')(CabinetFile, Reserved, MsgHandler, Context);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setuplogerrora
  public static SetupLogErrorA(MessageString: LPCSTR, Severity: LogSeverity): BOOL {
    return Setupapi.Load('SetupLogErrorA')(MessageString, Severity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setuplogerrorw
  public static SetupLogErrorW(MessageString: LPCWSTR, Severity: LogSeverity): BOOL {
    return Setupapi.Load('SetupLogErrorW')(MessageString, Severity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setuplogfilea
  public static SetupLogFileA(
    FileLogHandle: HSPFILELOG,
    LogSectionName: OPTIONAL<PCSTR>,
    SourceFilename: PCSTR,
    TargetFilename: PCSTR,
    Checksum: DWORD,
    DiskTagfile: OPTIONAL<PCSTR>,
    DiskDescription: OPTIONAL<PCSTR>,
    OtherInfo: OPTIONAL<PCSTR>,
    Flags: DWORD,
  ): BOOL {
    return Setupapi.Load('SetupLogFileA')(FileLogHandle, LogSectionName, SourceFilename, TargetFilename, Checksum, DiskTagfile, DiskDescription, OtherInfo, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setuplogfilew
  public static SetupLogFileW(
    FileLogHandle: HSPFILELOG,
    LogSectionName: OPTIONAL<PCWSTR>,
    SourceFilename: PCWSTR,
    TargetFilename: PCWSTR,
    Checksum: DWORD,
    DiskTagfile: OPTIONAL<PCWSTR>,
    DiskDescription: OPTIONAL<PCWSTR>,
    OtherInfo: OPTIONAL<PCWSTR>,
    Flags: DWORD,
  ): BOOL {
    return Setupapi.Load('SetupLogFileW')(FileLogHandle, LogSectionName, SourceFilename, TargetFilename, Checksum, DiskTagfile, DiskDescription, OtherInfo, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupopenappendinffilea
  public static SetupOpenAppendInfFileA(FileName: OPTIONAL<PCSTR>, InfHandle: HINF, ErrorLine_out: OPTIONAL<PUINT>): BOOL {
    return Setupapi.Load('SetupOpenAppendInfFileA')(FileName, InfHandle, ErrorLine_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupopenappendinffilew
  public static SetupOpenAppendInfFileW(FileName: OPTIONAL<PCWSTR>, InfHandle: HINF, ErrorLine_out: OPTIONAL<PUINT>): BOOL {
    return Setupapi.Load('SetupOpenAppendInfFileW')(FileName, InfHandle, ErrorLine_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupopenfilequeue
  public static SetupOpenFileQueue(): HSPFILEQ {
    return Setupapi.Load('SetupOpenFileQueue')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupopeninffilea
  public static SetupOpenInfFileA(FileName: PCSTR, InfClass: OPTIONAL<PCSTR>, InfStyle: DWORD, ErrorLine_out: OPTIONAL<PUINT>): HINF {
    return Setupapi.Load('SetupOpenInfFileA')(FileName, InfClass, InfStyle, ErrorLine_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupopeninffilew
  public static SetupOpenInfFileW(FileName: PCWSTR, InfClass: OPTIONAL<PCWSTR>, InfStyle: DWORD, ErrorLine_out: OPTIONAL<PUINT>): HINF {
    return Setupapi.Load('SetupOpenInfFileW')(FileName, InfClass, InfStyle, ErrorLine_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupopenlog
  public static SetupOpenLog(Erase: BOOL): BOOL {
    return Setupapi.Load('SetupOpenLog')(Erase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupopenmasterinf
  public static SetupOpenMasterInf(): HINF {
    return Setupapi.Load('SetupOpenMasterInf')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setuppreparequeueforrestorea
  public static SetupPrepareQueueForRestoreA(QueueHandle: HSPFILEQ, BackupPath: PCSTR, RestoreFlags: DWORD): BOOL {
    return Setupapi.Load('SetupPrepareQueueForRestoreA')(QueueHandle, BackupPath, RestoreFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setuppreparequeueforrestorew
  public static SetupPrepareQueueForRestoreW(QueueHandle: HSPFILEQ, BackupPath: PCWSTR, RestoreFlags: DWORD): BOOL {
    return Setupapi.Load('SetupPrepareQueueForRestoreW')(QueueHandle, BackupPath, RestoreFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setuppromptfordiska
  public static SetupPromptForDiskA(
    hwndParent: HWND,
    DialogTitle: OPTIONAL<PCSTR>,
    DiskName: OPTIONAL<PCSTR>,
    PathToSource: OPTIONAL<PCSTR>,
    FileSought: PCSTR,
    TagFile: OPTIONAL<PCSTR>,
    DiskPromptStyle: DWORD,
    PathBuffer_out: OPTIONAL<PSTR>,
    PathBufferSize: DWORD,
    PathRequiredSize_out: OPTIONAL<PDWORD>,
  ): UINT {
    return Setupapi.Load('SetupPromptForDiskA')(hwndParent, DialogTitle, DiskName, PathToSource, FileSought, TagFile, DiskPromptStyle, PathBuffer_out, PathBufferSize, PathRequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setuppromptfordiskw
  public static SetupPromptForDiskW(
    hwndParent: HWND,
    DialogTitle: OPTIONAL<PCWSTR>,
    DiskName: OPTIONAL<PCWSTR>,
    PathToSource: OPTIONAL<PCWSTR>,
    FileSought: PCWSTR,
    TagFile: OPTIONAL<PCWSTR>,
    DiskPromptStyle: DWORD,
    PathBuffer_out: OPTIONAL<PWSTR>,
    PathBufferSize: DWORD,
    PathRequiredSize_out: OPTIONAL<PDWORD>,
  ): UINT {
    return Setupapi.Load('SetupPromptForDiskW')(hwndParent, DialogTitle, DiskName, PathToSource, FileSought, TagFile, DiskPromptStyle, PathBuffer_out, PathBufferSize, PathRequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setuppromptreboot
  public static SetupPromptReboot(FileQueue: OPTIONAL<HSPFILEQ>, Owner: OPTIONAL<HWND>, ScanOnly: BOOL): INT {
    return Setupapi.Load('SetupPromptReboot')(FileQueue, Owner, ScanOnly);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupquerydrivesindiskspacelista
  public static SetupQueryDrivesInDiskSpaceListA(DiskSpace: HDSKSPC, ReturnBuffer_out: OPTIONAL<PSTR>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupQueryDrivesInDiskSpaceListA')(DiskSpace, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupquerydrivesindiskspacelistw
  public static SetupQueryDrivesInDiskSpaceListW(DiskSpace: HDSKSPC, ReturnBuffer_out: OPTIONAL<PWSTR>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupQueryDrivesInDiskSpaceListW')(DiskSpace, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueryfileloga
  public static SetupQueryFileLogA(
    FileLogHandle: HSPFILELOG,
    LogSectionName: OPTIONAL<PCSTR>,
    TargetFilename: PCSTR,
    DesiredInfo: SetupFileLogInfo,
    DataOut_out: OPTIONAL<PSTR>,
    ReturnBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupQueryFileLogA')(FileLogHandle, LogSectionName, TargetFilename, DesiredInfo, DataOut_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueryfilelogw
  public static SetupQueryFileLogW(
    FileLogHandle: HSPFILELOG,
    LogSectionName: OPTIONAL<PCWSTR>,
    TargetFilename: PCWSTR,
    DesiredInfo: SetupFileLogInfo,
    DataOut_out: OPTIONAL<PWSTR>,
    ReturnBufferSize: DWORD,
    RequiredSize_out: OPTIONAL<PDWORD>,
  ): BOOL {
    return Setupapi.Load('SetupQueryFileLogW')(FileLogHandle, LogSectionName, TargetFilename, DesiredInfo, DataOut_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueryinffileinformationa
  public static SetupQueryInfFileInformationA(InfInformation: PSP_INF_INFORMATION, InfIndex: UINT, ReturnBuffer_out: OPTIONAL<PSTR>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupQueryInfFileInformationA')(InfInformation, InfIndex, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueryinffileinformationw
  public static SetupQueryInfFileInformationW(InfInformation: PSP_INF_INFORMATION, InfIndex: UINT, ReturnBuffer_out: OPTIONAL<PWSTR>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupQueryInfFileInformationW')(InfInformation, InfIndex, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueryinforiginalfileinformationa
  public static SetupQueryInfOriginalFileInformationA(InfInformation: PSP_INF_INFORMATION, InfIndex: UINT, AlternatePlatformInfo: OPTIONAL<PSP_ALTPLATFORM_INFO>, OriginalFileInfo_out: PSP_ORIGINAL_FILE_INFO_A): BOOL {
    return Setupapi.Load('SetupQueryInfOriginalFileInformationA')(InfInformation, InfIndex, AlternatePlatformInfo, OriginalFileInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueryinforiginalfileinformationw
  public static SetupQueryInfOriginalFileInformationW(InfInformation: PSP_INF_INFORMATION, InfIndex: UINT, AlternatePlatformInfo: OPTIONAL<PSP_ALTPLATFORM_INFO>, OriginalFileInfo_out: PSP_ORIGINAL_FILE_INFO_W): BOOL {
    return Setupapi.Load('SetupQueryInfOriginalFileInformationW')(InfInformation, InfIndex, AlternatePlatformInfo, OriginalFileInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueryinfversioninformationa
  public static SetupQueryInfVersionInformationA(InfInformation: PSP_INF_INFORMATION, InfIndex: UINT, Key: OPTIONAL<PCSTR>, ReturnBuffer_out: OPTIONAL<PSTR>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupQueryInfVersionInformationA')(InfInformation, InfIndex, Key, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueryinfversioninformationw
  public static SetupQueryInfVersionInformationW(InfInformation: PSP_INF_INFORMATION, InfIndex: UINT, Key: OPTIONAL<PCWSTR>, ReturnBuffer_out: OPTIONAL<PWSTR>, ReturnBufferSize: DWORD, RequiredSize_out: OPTIONAL<PDWORD>): BOOL {
    return Setupapi.Load('SetupQueryInfVersionInformationW')(InfInformation, InfIndex, Key, ReturnBuffer_out, ReturnBufferSize, RequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupquerysourcelista
  public static SetupQuerySourceListA(Flags: DWORD, List_out: PPCSTR, Count_out: PUINT): BOOL {
    return Setupapi.Load('SetupQuerySourceListA')(Flags, List_out, Count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupquerysourcelistw
  public static SetupQuerySourceListW(Flags: DWORD, List_out: PPCWSTR, Count_out: PUINT): BOOL {
    return Setupapi.Load('SetupQuerySourceListW')(Flags, List_out, Count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueryspacerequiredondrivea
  public static SetupQuerySpaceRequiredOnDriveA(DiskSpace: HDSKSPC, DriveSpec: PCSTR, SpaceRequired_out: PLONGLONG, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupQuerySpaceRequiredOnDriveA')(DiskSpace, DriveSpec, SpaceRequired_out, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueryspacerequiredondrivew
  public static SetupQuerySpaceRequiredOnDriveW(DiskSpace: HDSKSPC, DriveSpec: PCWSTR, SpaceRequired_out: PLONGLONG, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupQuerySpaceRequiredOnDriveW')(DiskSpace, DriveSpec, SpaceRequired_out, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuecopya
  public static SetupQueueCopyA(
    QueueHandle: HSPFILEQ,
    SourceRootPath: OPTIONAL<PCSTR>,
    SourcePath: OPTIONAL<PCSTR>,
    SourceFilename: PCSTR,
    SourceDescription: OPTIONAL<PCSTR>,
    SourceTagfile: OPTIONAL<PCSTR>,
    TargetDirectory: PCSTR,
    TargetFilename: OPTIONAL<PCSTR>,
    CopyStyle: DWORD,
  ): BOOL {
    return Setupapi.Load('SetupQueueCopyA')(QueueHandle, SourceRootPath, SourcePath, SourceFilename, SourceDescription, SourceTagfile, TargetDirectory, TargetFilename, CopyStyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuecopyindirecta
  public static SetupQueueCopyIndirectA(CopyParams: PSP_FILE_COPY_PARAMS_A): BOOL {
    return Setupapi.Load('SetupQueueCopyIndirectA')(CopyParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuecopyindirectw
  public static SetupQueueCopyIndirectW(CopyParams: PSP_FILE_COPY_PARAMS_W): BOOL {
    return Setupapi.Load('SetupQueueCopyIndirectW')(CopyParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuecopysectiona
  public static SetupQueueCopySectionA(QueueHandle: HSPFILEQ, SourceRootPath: OPTIONAL<PCSTR>, InfHandle: HINF, ListInfHandle: OPTIONAL<HINF>, Section: PCSTR, CopyStyle: DWORD): BOOL {
    return Setupapi.Load('SetupQueueCopySectionA')(QueueHandle, SourceRootPath, InfHandle, ListInfHandle, Section, CopyStyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuecopysectionw
  public static SetupQueueCopySectionW(QueueHandle: HSPFILEQ, SourceRootPath: OPTIONAL<PCWSTR>, InfHandle: HINF, ListInfHandle: OPTIONAL<HINF>, Section: PCWSTR, CopyStyle: DWORD): BOOL {
    return Setupapi.Load('SetupQueueCopySectionW')(QueueHandle, SourceRootPath, InfHandle, ListInfHandle, Section, CopyStyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuecopyw
  public static SetupQueueCopyW(
    QueueHandle: HSPFILEQ,
    SourceRootPath: OPTIONAL<PCWSTR>,
    SourcePath: OPTIONAL<PCWSTR>,
    SourceFilename: PCWSTR,
    SourceDescription: OPTIONAL<PCWSTR>,
    SourceTagfile: OPTIONAL<PCWSTR>,
    TargetDirectory: PCWSTR,
    TargetFilename: OPTIONAL<PCWSTR>,
    CopyStyle: DWORD,
  ): BOOL {
    return Setupapi.Load('SetupQueueCopyW')(QueueHandle, SourceRootPath, SourcePath, SourceFilename, SourceDescription, SourceTagfile, TargetDirectory, TargetFilename, CopyStyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuedefaultcopya
  public static SetupQueueDefaultCopyA(QueueHandle: HSPFILEQ, InfHandle: HINF, SourceRootPath: OPTIONAL<PCSTR>, SourceFilename: PCSTR, TargetFilename: OPTIONAL<PCSTR>, CopyStyle: DWORD): BOOL {
    return Setupapi.Load('SetupQueueDefaultCopyA')(QueueHandle, InfHandle, SourceRootPath, SourceFilename, TargetFilename, CopyStyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuedefaultcopyw
  public static SetupQueueDefaultCopyW(QueueHandle: HSPFILEQ, InfHandle: HINF, SourceRootPath: OPTIONAL<PCWSTR>, SourceFilename: PCWSTR, TargetFilename: OPTIONAL<PCWSTR>, CopyStyle: DWORD): BOOL {
    return Setupapi.Load('SetupQueueDefaultCopyW')(QueueHandle, InfHandle, SourceRootPath, SourceFilename, TargetFilename, CopyStyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuedeletea
  public static SetupQueueDeleteA(QueueHandle: HSPFILEQ, PathPart1: PCSTR, PathPart2: OPTIONAL<PCSTR>): BOOL {
    return Setupapi.Load('SetupQueueDeleteA')(QueueHandle, PathPart1, PathPart2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuedeletesectiona
  public static SetupQueueDeleteSectionA(QueueHandle: HSPFILEQ, InfHandle: HINF, ListInfHandle: OPTIONAL<HINF>, Section: PCSTR): BOOL {
    return Setupapi.Load('SetupQueueDeleteSectionA')(QueueHandle, InfHandle, ListInfHandle, Section);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuedeletesectionw
  public static SetupQueueDeleteSectionW(QueueHandle: HSPFILEQ, InfHandle: HINF, ListInfHandle: OPTIONAL<HINF>, Section: PCWSTR): BOOL {
    return Setupapi.Load('SetupQueueDeleteSectionW')(QueueHandle, InfHandle, ListInfHandle, Section);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuedeletew
  public static SetupQueueDeleteW(QueueHandle: HSPFILEQ, PathPart1: PCWSTR, PathPart2: OPTIONAL<PCWSTR>): BOOL {
    return Setupapi.Load('SetupQueueDeleteW')(QueueHandle, PathPart1, PathPart2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuerenamea
  public static SetupQueueRenameA(QueueHandle: HSPFILEQ, SourcePath: PCSTR, SourceFilename: OPTIONAL<PCSTR>, TargetPath: OPTIONAL<PCSTR>, TargetFilename: PCSTR): BOOL {
    return Setupapi.Load('SetupQueueRenameA')(QueueHandle, SourcePath, SourceFilename, TargetPath, TargetFilename);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuerenamesectiona
  public static SetupQueueRenameSectionA(QueueHandle: HSPFILEQ, InfHandle: HINF, ListInfHandle: OPTIONAL<HINF>, Section: PCSTR): BOOL {
    return Setupapi.Load('SetupQueueRenameSectionA')(QueueHandle, InfHandle, ListInfHandle, Section);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuerenamesectionw
  public static SetupQueueRenameSectionW(QueueHandle: HSPFILEQ, InfHandle: HINF, ListInfHandle: OPTIONAL<HINF>, Section: PCWSTR): BOOL {
    return Setupapi.Load('SetupQueueRenameSectionW')(QueueHandle, InfHandle, ListInfHandle, Section);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupqueuerenamew
  public static SetupQueueRenameW(QueueHandle: HSPFILEQ, SourcePath: PCWSTR, SourceFilename: OPTIONAL<PCWSTR>, TargetPath: OPTIONAL<PCWSTR>, TargetFilename: PCWSTR): BOOL {
    return Setupapi.Load('SetupQueueRenameW')(QueueHandle, SourcePath, SourceFilename, TargetPath, TargetFilename);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupremovefilelogentrya
  public static SetupRemoveFileLogEntryA(FileLogHandle: HSPFILELOG, LogSectionName: OPTIONAL<PCSTR>, TargetFilename: OPTIONAL<PCSTR>): BOOL {
    return Setupapi.Load('SetupRemoveFileLogEntryA')(FileLogHandle, LogSectionName, TargetFilename);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupremovefilelogentryw
  public static SetupRemoveFileLogEntryW(FileLogHandle: HSPFILELOG, LogSectionName: OPTIONAL<PCWSTR>, TargetFilename: OPTIONAL<PCWSTR>): BOOL {
    return Setupapi.Load('SetupRemoveFileLogEntryW')(FileLogHandle, LogSectionName, TargetFilename);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupremovefromdiskspacelista
  public static SetupRemoveFromDiskSpaceListA(DiskSpace: HDSKSPC, TargetFilespec: PCSTR, Operation: UINT, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupRemoveFromDiskSpaceListA')(DiskSpace, TargetFilespec, Operation, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupremovefromdiskspacelistw
  public static SetupRemoveFromDiskSpaceListW(DiskSpace: HDSKSPC, TargetFilespec: PCWSTR, Operation: UINT, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupRemoveFromDiskSpaceListW')(DiskSpace, TargetFilespec, Operation, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupremovefromsourcelista
  public static SetupRemoveFromSourceListA(Flags: DWORD, Source: PCSTR): BOOL {
    return Setupapi.Load('SetupRemoveFromSourceListA')(Flags, Source);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupremovefromsourcelistw
  public static SetupRemoveFromSourceListW(Flags: DWORD, Source: PCWSTR): BOOL {
    return Setupapi.Load('SetupRemoveFromSourceListW')(Flags, Source);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupremoveinstallsectionfromdiskspacelista
  public static SetupRemoveInstallSectionFromDiskSpaceListA(DiskSpace: HDSKSPC, InfHandle: HINF, LayoutInfHandle: OPTIONAL<HINF>, SectionName: PCSTR, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupRemoveInstallSectionFromDiskSpaceListA')(DiskSpace, InfHandle, LayoutInfHandle, SectionName, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupremoveinstallsectionfromdiskspacelistw
  public static SetupRemoveInstallSectionFromDiskSpaceListW(DiskSpace: HDSKSPC, InfHandle: HINF, LayoutInfHandle: OPTIONAL<HINF>, SectionName: PCWSTR, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupRemoveInstallSectionFromDiskSpaceListW')(DiskSpace, InfHandle, LayoutInfHandle, SectionName, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupremovesectionfromdiskspacelista
  public static SetupRemoveSectionFromDiskSpaceListA(DiskSpace: HDSKSPC, InfHandle: HINF, ListInfHandle: OPTIONAL<HINF>, SectionName: PCSTR, Operation: UINT, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupRemoveSectionFromDiskSpaceListA')(DiskSpace, InfHandle, ListInfHandle, SectionName, Operation, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupremovesectionfromdiskspacelistw
  public static SetupRemoveSectionFromDiskSpaceListW(DiskSpace: HDSKSPC, InfHandle: HINF, ListInfHandle: OPTIONAL<HINF>, SectionName: PCWSTR, Operation: UINT, Reserved1: OPTIONAL<PVOID>, Reserved2: UINT): BOOL {
    return Setupapi.Load('SetupRemoveSectionFromDiskSpaceListW')(DiskSpace, InfHandle, ListInfHandle, SectionName, Operation, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setuprenameerrora
  public static SetupRenameErrorA(hwndParent: HWND, DialogTitle: OPTIONAL<PCSTR>, SourceFile: PCSTR, TargetFile: PCSTR, Win32ErrorCode: UINT, Style: DWORD): UINT {
    return Setupapi.Load('SetupRenameErrorA')(hwndParent, DialogTitle, SourceFile, TargetFile, Win32ErrorCode, Style);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setuprenameerrorw
  public static SetupRenameErrorW(hwndParent: HWND, DialogTitle: OPTIONAL<PCWSTR>, SourceFile: PCWSTR, TargetFile: PCWSTR, Win32ErrorCode: UINT, Style: DWORD): UINT {
    return Setupapi.Load('SetupRenameErrorW')(hwndParent, DialogTitle, SourceFile, TargetFile, Win32ErrorCode, Style);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupscanfilequeuea
  public static SetupScanFileQueueA(FileQueue: HSPFILEQ, Flags: DWORD, Window: OPTIONAL<HWND>, CallbackRoutine: OPTIONAL<PSP_FILE_CALLBACK_A>, CallbackContext: OPTIONAL<PVOID>, Result_out: PDWORD): BOOL {
    return Setupapi.Load('SetupScanFileQueueA')(FileQueue, Flags, Window, CallbackRoutine, CallbackContext, Result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupscanfilequeuew
  public static SetupScanFileQueueW(FileQueue: HSPFILEQ, Flags: DWORD, Window: OPTIONAL<HWND>, CallbackRoutine: OPTIONAL<PSP_FILE_CALLBACK_W>, CallbackContext: OPTIONAL<PVOID>, Result_out: PDWORD): BOOL {
    return Setupapi.Load('SetupScanFileQueueW')(FileQueue, Flags, Window, CallbackRoutine, CallbackContext, Result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupsetdirectoryida
  public static SetupSetDirectoryIdA(InfHandle: HINF, Id: DWORD, Directory: OPTIONAL<PCSTR>): BOOL {
    return Setupapi.Load('SetupSetDirectoryIdA')(InfHandle, Id, Directory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupsetdirectoryidexa
  public static SetupSetDirectoryIdExA(InfHandle: HINF, Id: DWORD, Directory: OPTIONAL<PCSTR>, Flags: DWORD, Reserved1: DWORD, Reserved2: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupSetDirectoryIdExA')(InfHandle, Id, Directory, Flags, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupsetdirectoryidexw
  public static SetupSetDirectoryIdExW(InfHandle: HINF, Id: DWORD, Directory: OPTIONAL<PCWSTR>, Flags: DWORD, Reserved1: DWORD, Reserved2: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupSetDirectoryIdExW')(InfHandle, Id, Directory, Flags, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupsetdirectoryidw
  public static SetupSetDirectoryIdW(InfHandle: HINF, Id: DWORD, Directory: OPTIONAL<PCWSTR>): BOOL {
    return Setupapi.Load('SetupSetDirectoryIdW')(InfHandle, Id, Directory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupsetfilequeuealternateplatforma
  public static SetupSetFileQueueAlternatePlatformA(QueueHandle: HSPFILEQ, AlternatePlatformInfo: OPTIONAL<PSP_ALTPLATFORM_INFO>, AlternateDefaultCatalogFile: OPTIONAL<PCSTR>): BOOL {
    return Setupapi.Load('SetupSetFileQueueAlternatePlatformA')(QueueHandle, AlternatePlatformInfo, AlternateDefaultCatalogFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupsetfilequeuealternateplatformw
  public static SetupSetFileQueueAlternatePlatformW(QueueHandle: HSPFILEQ, AlternatePlatformInfo: OPTIONAL<PSP_ALTPLATFORM_INFO>, AlternateDefaultCatalogFile: OPTIONAL<PCWSTR>): BOOL {
    return Setupapi.Load('SetupSetFileQueueAlternatePlatformW')(QueueHandle, AlternatePlatformInfo, AlternateDefaultCatalogFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupsetfilequeueflags
  public static SetupSetFileQueueFlags(FileQueue: HSPFILEQ, FlagMask: DWORD, Flags: DWORD): BOOL {
    return Setupapi.Load('SetupSetFileQueueFlags')(FileQueue, FlagMask, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupsetnoninteractivemode
  public static SetupSetNonInteractiveMode(NonInteractiveFlag: BOOL): BOOL {
    return Setupapi.Load('SetupSetNonInteractiveMode')(NonInteractiveFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupsetplatformpathoverridea
  public static SetupSetPlatformPathOverrideA(Override: OPTIONAL<PCSTR>): BOOL {
    return Setupapi.Load('SetupSetPlatformPathOverrideA')(Override);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupsetplatformpathoverridew
  public static SetupSetPlatformPathOverrideW(Override: OPTIONAL<PCWSTR>): BOOL {
    return Setupapi.Load('SetupSetPlatformPathOverrideW')(Override);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupsetsourcelista
  public static SetupSetSourceListA(Flags: DWORD, SourceList: PPCSTR, SourceCount: UINT): BOOL {
    return Setupapi.Load('SetupSetSourceListA')(Flags, SourceList, SourceCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupsetsourcelistw
  public static SetupSetSourceListW(Flags: DWORD, SourceList: PPCWSTR, SourceCount: UINT): BOOL {
    return Setupapi.Load('SetupSetSourceListW')(Flags, SourceList, SourceCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setuptermdefaultqueuecallback
  public static SetupTermDefaultQueueCallback(Context: PVOID): VOID {
    return Setupapi.Load('SetupTermDefaultQueueCallback')(Context);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupterminatefilelog
  public static SetupTerminateFileLog(FileLogHandle: HSPFILELOG): BOOL {
    return Setupapi.Load('SetupTerminateFileLog')(FileLogHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupuninstallnewlycopiedinfs
  public static SetupUninstallNewlyCopiedInfs(FileQueue: HSPFILEQ, Flags: DWORD, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupUninstallNewlyCopiedInfs')(FileQueue, Flags, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupuninstalloeminfa
  public static SetupUninstallOEMInfA(InfFileName: PCSTR, Flags: DWORD, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupUninstallOEMInfA')(InfFileName, Flags, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupuninstalloeminfw
  public static SetupUninstallOEMInfW(InfFileName: PCWSTR, Flags: DWORD, Reserved: OPTIONAL<PVOID>): BOOL {
    return Setupapi.Load('SetupUninstallOEMInfW')(InfFileName, Flags, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupverifyinffilea
  public static SetupVerifyInfFileA(InfName: PCSTR, AltPlatformInfo: OPTIONAL<PSP_ALTPLATFORM_INFO>, InfSignerInfo_in_out: PSP_INF_SIGNER_INFO_A): BOOL {
    return Setupapi.Load('SetupVerifyInfFileA')(InfName, AltPlatformInfo, InfSignerInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupverifyinffilew
  public static SetupVerifyInfFileW(InfName: PCWSTR, AltPlatformInfo: OPTIONAL<PSP_ALTPLATFORM_INFO>, InfSignerInfo_in_out: PSP_INF_SIGNER_INFO_W): BOOL {
    return Setupapi.Load('SetupVerifyInfFileW')(InfName, AltPlatformInfo, InfSignerInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupwritetextloginfline
  public static SetupWriteTextLogInfLine(LogToken: SP_LOG_TOKEN, Flags: DWORD, InfHandle: HINF, Context: PINFCONTEXT): VOID {
    return Setupapi.Load('SetupWriteTextLogInfLine')(LogToken, Flags, InfHandle, Context);
  }
}

export default Setupapi;
