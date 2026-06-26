import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DISM_PROGRESS_CALLBACK,
  DWORD,
  DismImageIdentifier,
  DismLogLevel,
  DismPackageIdentifier,
  DismSession,
  HANDLE,
  HRESULT,
  OPTIONAL,
  PCWSTR,
  PDWORD,
  PDismCapability,
  PDismCapabilityInfo,
  PDismDriver,
  PDismDriverPackage,
  PDismFeature,
  PDismFeatureInfo,
  PDismImageHealthState,
  PDismImageInfo,
  PDismMountedImageInfo,
  PDismPackage,
  PDismPackageInfo,
  PDismSession,
  PDismString,
  PPCWSTR,
  PUINT,
  PVOID,
  UINT,
} from '../types/Dismapi';

/**
 * Thin, lazy-loaded FFI bindings for `dismapi.dll`.
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
 * import Dismapi, { DismLogLevel } from './structs/Dismapi';
 *
 * // Lazy: bind on first call
 * Dismapi.DismInitialize(DismLogLevel.DismLogErrorsWarnings, null, null);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Dismapi.Preload(['DismInitialize', 'DismOpenSession', 'DismGetFeatures', 'DismShutdown']);
 * ```
 */
class Dismapi extends Win32 {
  protected static override name = 'dismapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DismAddCapability: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismAddDriver: { args: [FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    DismAddPackage: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismApplyUnattend: { args: [FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    DismCheckImageHealth: { args: [FFIType.u32, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismCleanupMountpoints: { args: [], returns: FFIType.i32 },
    DismCloseSession: { args: [FFIType.u32], returns: FFIType.i32 },
    DismCommitImage: { args: [FFIType.u32, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismDelete: { args: [FFIType.ptr], returns: FFIType.i32 },
    DismDisableFeature: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismEnableFeature: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismGetCapabilities: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismGetCapabilityInfo: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismGetDriverInfo: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismGetDrivers: { args: [FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismGetFeatureInfo: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    DismGetFeatureParent: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismGetFeatures: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismGetImageInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismGetLastErrorMessage: { args: [FFIType.ptr], returns: FFIType.i32 },
    DismGetMountedImageInfo: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismGetPackageInfo: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    DismGetPackages: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismGetReservedStorageState: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    DismInitialize: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismMountImage: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismOpenSession: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismRemountImage: { args: [FFIType.ptr], returns: FFIType.i32 },
    DismRemoveCapability: { args: [FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismRemoveDriver: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    DismRemovePackage: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismRestoreImageHealth: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DismSetReservedStorageState: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    DismShutdown: { args: [], returns: FFIType.i32 },
    DismUnmountImage: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismaddcapability?view=windows-11
  public static DismAddCapability(
    Session: DismSession,
    Name: PCWSTR,
    LimitAccess: BOOL,
    SourcePaths: OPTIONAL<PPCWSTR>,
    SourcePathCount: UINT,
    CancelEvent: OPTIONAL<HANDLE>,
    Progress: OPTIONAL<DISM_PROGRESS_CALLBACK>,
    UserData: OPTIONAL<PVOID>,
  ): HRESULT {
    return Dismapi.Load('DismAddCapability')(Session, Name, LimitAccess, SourcePaths, SourcePathCount, CancelEvent, Progress, UserData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismadddriver-function?view=windows-11
  public static DismAddDriver(Session: DismSession, DriverPath: PCWSTR, ForceUnsigned: BOOL): HRESULT {
    return Dismapi.Load('DismAddDriver')(Session, DriverPath, ForceUnsigned);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismaddpackage-function?view=windows-11
  public static DismAddPackage(Session: DismSession, PackagePath: PCWSTR, IgnoreCheck: BOOL, PreventPending: BOOL, CancelEvent: OPTIONAL<HANDLE>, Progress: OPTIONAL<DISM_PROGRESS_CALLBACK>, UserData: OPTIONAL<PVOID>): HRESULT {
    return Dismapi.Load('DismAddPackage')(Session, PackagePath, IgnoreCheck, PreventPending, CancelEvent, Progress, UserData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismapplyunattend-function?view=windows-11
  public static DismApplyUnattend(Session: DismSession, UnattendFile: PCWSTR, SingleSession: BOOL): HRESULT {
    return Dismapi.Load('DismApplyUnattend')(Session, UnattendFile, SingleSession);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismcheckimagehealth-function?view=windows-11
  public static DismCheckImageHealth(Session: DismSession, ScanImage: BOOL, CancelEvent: OPTIONAL<HANDLE>, Progress: OPTIONAL<DISM_PROGRESS_CALLBACK>, UserData: OPTIONAL<PVOID>, ImageHealth_out: PDismImageHealthState): HRESULT {
    return Dismapi.Load('DismCheckImageHealth')(Session, ScanImage, CancelEvent, Progress, UserData, ImageHealth_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismcleanupmountpoints-function?view=windows-11
  public static DismCleanupMountpoints(): HRESULT {
    return Dismapi.Load('DismCleanupMountpoints')();
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismclosesession-function?view=windows-11
  public static DismCloseSession(Session: DismSession): HRESULT {
    return Dismapi.Load('DismCloseSession')(Session);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismcommitimage-function?view=windows-11
  public static DismCommitImage(Session: DismSession, Flags: DWORD, CancelEvent: OPTIONAL<HANDLE>, Progress: OPTIONAL<DISM_PROGRESS_CALLBACK>, UserData: OPTIONAL<PVOID>): HRESULT {
    return Dismapi.Load('DismCommitImage')(Session, Flags, CancelEvent, Progress, UserData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismdelete-function?view=windows-11
  public static DismDelete(DismStructure: PVOID): HRESULT {
    return Dismapi.Load('DismDelete')(DismStructure);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismdisablefeature-function?view=windows-11
  public static DismDisableFeature(
    Session: DismSession,
    FeatureName: PCWSTR,
    PackageName: OPTIONAL<PCWSTR>,
    RemovePayload: BOOL,
    CancelEvent: OPTIONAL<HANDLE>,
    Progress: OPTIONAL<DISM_PROGRESS_CALLBACK>,
    UserData: OPTIONAL<PVOID>,
  ): HRESULT {
    return Dismapi.Load('DismDisableFeature')(Session, FeatureName, PackageName, RemovePayload, CancelEvent, Progress, UserData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismenablefeature-function?view=windows-11
  public static DismEnableFeature(
    Session: DismSession,
    FeatureName: PCWSTR,
    Identifier: OPTIONAL<PCWSTR>,
    PackageIdentifier: DismPackageIdentifier,
    LimitAccess: BOOL,
    SourcePaths: OPTIONAL<PPCWSTR>,
    SourcePathCount: UINT,
    EnableAll: BOOL,
    CancelEvent: OPTIONAL<HANDLE>,
    Progress: OPTIONAL<DISM_PROGRESS_CALLBACK>,
    UserData: OPTIONAL<PVOID>,
  ): HRESULT {
    return Dismapi.Load('DismEnableFeature')(Session, FeatureName, Identifier, PackageIdentifier, LimitAccess, SourcePaths, SourcePathCount, EnableAll, CancelEvent, Progress, UserData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismgetcapabilities?view=windows-11
  public static DismGetCapabilities(Session: DismSession, Capability_out: PDismCapability, Count_out: PUINT): HRESULT {
    return Dismapi.Load('DismGetCapabilities')(Session, Capability_out, Count_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismgetcapabilityinfo?view=windows-11
  public static DismGetCapabilityInfo(Session: DismSession, Name: PCWSTR, Info_out: PDismCapabilityInfo): HRESULT {
    return Dismapi.Load('DismGetCapabilityInfo')(Session, Name, Info_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismgetdriverinfo-function?view=windows-11
  public static DismGetDriverInfo(Session: DismSession, DriverPath: PCWSTR, Driver_out: PDismDriver, Count_out: PUINT, DriverPackage_out: OPTIONAL<PDismDriverPackage>): HRESULT {
    return Dismapi.Load('DismGetDriverInfo')(Session, DriverPath, Driver_out, Count_out, DriverPackage_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismgetdrivers-function?view=windows-11
  public static DismGetDrivers(Session: DismSession, AllDrivers: BOOL, DriverPackage_out: PDismDriverPackage, Count_out: PUINT): HRESULT {
    return Dismapi.Load('DismGetDrivers')(Session, AllDrivers, DriverPackage_out, Count_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismgetfeatureinfo-function?view=windows-11
  public static DismGetFeatureInfo(Session: DismSession, FeatureName: PCWSTR, Identifier: OPTIONAL<PCWSTR>, PackageIdentifier: DismPackageIdentifier, FeatureInfo_out: PDismFeatureInfo): HRESULT {
    return Dismapi.Load('DismGetFeatureInfo')(Session, FeatureName, Identifier, PackageIdentifier, FeatureInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismgetfeatureparent-function?view=windows-11
  public static DismGetFeatureParent(Session: DismSession, FeatureName: PCWSTR, Identifier: OPTIONAL<PCWSTR>, PackageIdentifier: DismPackageIdentifier, Feature_out: PDismFeature, Count_out: PUINT): HRESULT {
    return Dismapi.Load('DismGetFeatureParent')(Session, FeatureName, Identifier, PackageIdentifier, Feature_out, Count_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismgetfeatures-function?view=windows-11
  public static DismGetFeatures(Session: DismSession, Identifier: OPTIONAL<PCWSTR>, PackageIdentifier: DismPackageIdentifier, Feature_out: PDismFeature, Count_out: PUINT): HRESULT {
    return Dismapi.Load('DismGetFeatures')(Session, Identifier, PackageIdentifier, Feature_out, Count_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismgetimageinfo-function?view=windows-11
  public static DismGetImageInfo(ImageFilePath: PCWSTR, ImageInfo_out: PDismImageInfo, Count_out: PUINT): HRESULT {
    return Dismapi.Load('DismGetImageInfo')(ImageFilePath, ImageInfo_out, Count_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismgetlasterrormessage-function?view=windows-11
  public static DismGetLastErrorMessage(ErrorMessage_out: PDismString): HRESULT {
    return Dismapi.Load('DismGetLastErrorMessage')(ErrorMessage_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismgetmountedimageinfo-function?view=windows-11
  public static DismGetMountedImageInfo(MountedImageInfo_out: PDismMountedImageInfo, Count_out: PUINT): HRESULT {
    return Dismapi.Load('DismGetMountedImageInfo')(MountedImageInfo_out, Count_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismgetpackageinfo-function?view=windows-11
  public static DismGetPackageInfo(Session: DismSession, Identifier: PCWSTR, PackageIdentifier: DismPackageIdentifier, PackageInfo_out: PDismPackageInfo): HRESULT {
    return Dismapi.Load('DismGetPackageInfo')(Session, Identifier, PackageIdentifier, PackageInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismgetpackages-function?view=windows-11
  public static DismGetPackages(Session: DismSession, Package_out: PDismPackage, Count_out: PUINT): HRESULT {
    return Dismapi.Load('DismGetPackages')(Session, Package_out, Count_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismgetreservedstoragestate-function?view=windows-11
  public static DismGetReservedStorageState(Session: DismSession, State_out: PDWORD): HRESULT {
    return Dismapi.Load('DismGetReservedStorageState')(Session, State_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/disminitialize-function?view=windows-11
  public static DismInitialize(LogLevel: DismLogLevel, LogFilePath: OPTIONAL<PCWSTR>, ScratchDirectory: OPTIONAL<PCWSTR>): HRESULT {
    return Dismapi.Load('DismInitialize')(LogLevel, LogFilePath, ScratchDirectory);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismmountimage-function?view=windows-11
  public static DismMountImage(
    ImageFilePath: PCWSTR,
    MountPath: PCWSTR,
    ImageIndex: UINT,
    ImageName: OPTIONAL<PCWSTR>,
    ImageIdentifier: DismImageIdentifier,
    Flags: DWORD,
    CancelEvent: OPTIONAL<HANDLE>,
    Progress: OPTIONAL<DISM_PROGRESS_CALLBACK>,
    UserData: OPTIONAL<PVOID>,
  ): HRESULT {
    return Dismapi.Load('DismMountImage')(ImageFilePath, MountPath, ImageIndex, ImageName, ImageIdentifier, Flags, CancelEvent, Progress, UserData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismopensession-function?view=windows-11
  public static DismOpenSession(ImagePath: PCWSTR, WindowsDirectory: OPTIONAL<PCWSTR>, SystemDrive: OPTIONAL<PCWSTR>, Session_out: PDismSession): HRESULT {
    return Dismapi.Load('DismOpenSession')(ImagePath, WindowsDirectory, SystemDrive, Session_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismremountimage-function?view=windows-11
  public static DismRemountImage(MountPath: PCWSTR): HRESULT {
    return Dismapi.Load('DismRemountImage')(MountPath);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismremovecapability?view=windows-11
  public static DismRemoveCapability(Session: DismSession, Name: PCWSTR, CancelEvent: OPTIONAL<HANDLE>, Progress: OPTIONAL<DISM_PROGRESS_CALLBACK>, UserData: OPTIONAL<PVOID>): HRESULT {
    return Dismapi.Load('DismRemoveCapability')(Session, Name, CancelEvent, Progress, UserData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismremovedriver-function?view=windows-11
  public static DismRemoveDriver(Session: DismSession, DriverPath: PCWSTR): HRESULT {
    return Dismapi.Load('DismRemoveDriver')(Session, DriverPath);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismremovepackage-function?view=windows-11
  public static DismRemovePackage(Session: DismSession, Identifier: PCWSTR, PackageIdentifier: DismPackageIdentifier, CancelEvent: OPTIONAL<HANDLE>, Progress: OPTIONAL<DISM_PROGRESS_CALLBACK>, UserData: OPTIONAL<PVOID>): HRESULT {
    return Dismapi.Load('DismRemovePackage')(Session, Identifier, PackageIdentifier, CancelEvent, Progress, UserData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismrestoreimagehealth-function?view=windows-11
  public static DismRestoreImageHealth(
    Session: DismSession,
    SourcePaths: OPTIONAL<PPCWSTR>,
    SourcePathCount: UINT,
    LimitAccess: BOOL,
    CancelEvent: OPTIONAL<HANDLE>,
    Progress: OPTIONAL<DISM_PROGRESS_CALLBACK>,
    UserData: OPTIONAL<PVOID>,
  ): HRESULT {
    return Dismapi.Load('DismRestoreImageHealth')(Session, SourcePaths, SourcePathCount, LimitAccess, CancelEvent, Progress, UserData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismsetreservedstoragestate-function?view=windows-11
  public static DismSetReservedStorageState(Session: DismSession, State: DWORD): HRESULT {
    return Dismapi.Load('DismSetReservedStorageState')(Session, State);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismshutdown-function?view=windows-11
  public static DismShutdown(): HRESULT {
    return Dismapi.Load('DismShutdown')();
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism/dismunmountimage-function?view=windows-11
  public static DismUnmountImage(MountPath: PCWSTR, Flags: DWORD, CancelEvent: OPTIONAL<HANDLE>, Progress: OPTIONAL<DISM_PROGRESS_CALLBACK>, UserData: OPTIONAL<PVOID>): HRESULT {
    return Dismapi.Load('DismUnmountImage')(MountPath, Flags, CancelEvent, Progress, UserData);
  }
}

export default Dismapi;
