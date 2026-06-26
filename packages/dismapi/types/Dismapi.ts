import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, HANDLE, HRESULT, NULL, Optional, PDWORD, PVOID, UINT } from '@bun-win32/core';

export const DISM_ONLINE_IMAGE = 'DISM_{53BFAE52-B167-4E2F-A258-0A37B57FF845}';

export enum DismDriverSignature {
  DismDriverSignatureSigned = 2,
  DismDriverSignatureUnknown = 0,
  DismDriverSignatureUnsigned = 1,
}

export enum DismFullyOfflineInstallableType {
  DismFullyOfflineInstallable = 0,
  DismFullyOfflineInstallableUndetermined = 2,
  DismFullyOfflineNotInstallable = 1,
}

export enum DismImageBootable {
  DismImageBootableNo = 1,
  DismImageBootableUnknown = 2,
  DismImageBootableYes = 0,
}

export enum DismImageHealthState {
  DismImageHealthy = 0,
  DismImageNonRepairable = 2,
  DismImageRepairable = 1,
}

export enum DismImageIdentifier {
  DismImageIndex = 0,
  DismImageName = 1,
}

export enum DismImageType {
  DismImageTypeUnsupported = -1,
  DismImageTypeVhd = 1,
  DismImageTypeWim = 0,
}

export enum DismLogLevel {
  DismLogErrors = 0,
  DismLogErrorsWarnings = 1,
  DismLogErrorsWarningsInfo = 2,
}

export enum DismMountMode {
  DismReadOnly = 1,
  DismReadWrite = 0,
}

export enum DismMountStatus {
  DismMountStatusInvalid = 2,
  DismMountStatusNeedsRemount = 1,
  DismMountStatusOk = 0,
}

export enum DismPackageFeatureState {
  DismStateInstallPending = 5,
  DismStateInstalled = 4,
  DismStateNotPresent = 0,
  DismStatePartiallyInstalled = 7,
  DismStateRemoved = 3,
  DismStateStaged = 2,
  DismStateSuperseded = 6,
  DismStateUninstallPending = 1,
}

export enum DismPackageIdentifier {
  DismPackageName = 1,
  DismPackageNone = 0,
  DismPackagePath = 2,
}

export enum DismReleaseType {
  DismReleaseTypeCriticalUpdate = 0,
  DismReleaseTypeDriver = 1,
  DismReleaseTypeFeaturePack = 2,
  DismReleaseTypeFoundation = 9,
  DismReleaseTypeHotfix = 3,
  DismReleaseTypeLanguagePack = 8,
  DismReleaseTypeLocalPack = 12,
  DismReleaseTypeOnDemandPack = 14,
  DismReleaseTypeOther = 13,
  DismReleaseTypeProduct = 11,
  DismReleaseTypeSecurityUpdate = 4,
  DismReleaseTypeServicePack = 10,
  DismReleaseTypeSoftwareUpdate = 5,
  DismReleaseTypeUpdate = 6,
  DismReleaseTypeUpdateRollup = 7,
}

export enum DismRestartType {
  DismRestartNo = 0,
  DismRestartPossible = 1,
  DismRestartRequired = 2,
}

export type DISM_PROGRESS_CALLBACK = Pointer;
export type DismSession = number;
export type PCWSTR = Pointer;
export type PDismCapability = Pointer;
export type PDismCapabilityInfo = Pointer;
export type PDismDriver = Pointer;
export type PDismDriverPackage = Pointer;
export type PDismFeature = Pointer;
export type PDismFeatureInfo = Pointer;
export type PDismImageHealthState = Pointer;
export type PDismImageInfo = Pointer;
export type PDismMountedImageInfo = Pointer;
export type PDismPackage = Pointer;
export type PDismPackageInfo = Pointer;
export type PDismSession = Pointer;
export type PDismString = Pointer;
export type PPCWSTR = Pointer;
export type PUINT = Pointer;
