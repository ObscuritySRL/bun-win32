import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { DWORD, FVE_HANDLE, HANDLE, LPCWSTR, LPVOID, LPWSTR, PFVE_HANDLE } from '../types/Fveapi';

/**
 * Thin, lazy-loaded FFI bindings for `fveapi.dll` (BitLocker / Full Volume Encryption).
 *
 * Each static method corresponds one-to-one with a Win32 export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * `fveapi.dll` is the user-mode entry point to the kernel-mode BitLocker (FVE) support.
 * Microsoft does not publish per-function C prototypes or Microsoft Learn pages for
 * these exports; the documented programmatic surface for the same operations is the
 * `Win32_EncryptableVolume` WMI provider. Volume-handle lifetime, the `HRESULT`-style
 * return value, and the volume-handle-first calling pattern are verified empirically
 * against the live DLL; remaining undocumented parameters are bound as opaque pointers
 * per the repository's opaque-DLL convention. Treat every call's return value as an
 * `HRESULT` and degrade gracefully when not elevated or on non-BitLocker volumes.
 *
 * @example
 * ```ts
 * import Fveapi from './structs/Fveapi';
 *
 * // Lazy: bind on first call
 * const hr = Fveapi.FveOpenVolumeW(volume.ptr, 0, handleOut.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Fveapi.Preload(['FveOpenVolumeW', 'FveGetStatus', 'FveCloseVolume']);
 * ```
 */
class Fveapi extends Win32 {
  protected static override name = 'fveapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    FveAddAuthMethodInformation: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveAddAuthMethodSid: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveAddPredictiveTpmProtector: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveApplyGroupPolicy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveApplyNkpCertChanges: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveAttemptAutoUnlock: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveAuthElementFromPassPhraseW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveAuthElementFromPinW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveAuthElementFromRecoveryPasswordW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveAuthElementGetKeyFileNameW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveAuthElementReadExternalKeyW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveAuthElementToRecoveryPasswordW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveAuthElementWriteExternalKeyExW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveAuthElementWriteExternalKeyW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveBackupRecoveryInformationToAAD: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveBackupRecoveryInformationToAD: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveBackupRecoveryInformationToADEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveBindDataVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveCanPinExceptionPolicyBeApplied: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveCanStandardUsersChangePassphraseByProxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveCanStandardUsersChangePin: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveCheckADRecoveryInfoBackupPolicy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveCheckADRecoveryInfoBackupPolicyEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveCheckPassphrasePolicy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveCheckTpmCapability: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveClearRecoveryPasswordBackupInformation: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveClearUserFlags: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveCloseHandle: { args: [FFIType.u64], returns: FFIType.u32 },
    FveCloseVolume: { args: [FFIType.u64], returns: FFIType.u32 },
    FveCommitChanges: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveCommitChangesEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveControl: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveConversionDecrypt: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveConversionDecryptEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveConversionEncrypt: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveConversionEncryptEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveConversionEncryptPendingReboot: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveConversionEncryptPendingRebootEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveConversionPause: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveConversionResume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveConversionStop: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveConversionStopEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveDecrementClearKeyCounter: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveDeleteAuthMethod: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveDeleteDeviceEncryptionOptOutForVolumeW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveDisableDeviceLockoutState: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveDiscardChanges: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveDraCertPresentInRegistry: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveEnableRawAccess: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveEnableRawAccessEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveEnableRawAccessW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveEraseDrive: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveEscrowEncryptedRecoveryKeyForRetailUnlock: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveExternalDataCreateEntry: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveExternalDataDeleteEntries: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveExternalDataGetEntryInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveExternalDataGetEntryRawData: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveFindFirstVolume: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveFindNextVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveFlagsToProtectorType: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    FveGenerateNbp: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGenerateNkpSessionKeys: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetAllowKeyExport: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetAuthMethodGuids: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetAuthMethodInformation: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetAuthMethodSid: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetAuthMethodSidInformation: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetClearKeyCounter: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetDataSet: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetDataSetEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetDescriptionW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetDeviceLockoutData: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetExternalKeyBlob: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetFipsAllowDisabled: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetFveMethod: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetFveMethodEDrv: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetFveMethodEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetIdentificationFieldW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetIdentity: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetKeyPackage: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetRecoveryPasswordBackupAccountInformation: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetRecoveryPasswordBackupInformation: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetSecureBootBindingState: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetStatus: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetStatusW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveGetUserFlags: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveGetVolumeNameW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveInitVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveInitVolumeEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveInitializeDeviceEncryption: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveInitializeDeviceEncryption2: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveIsAnyDataVolumeBoundToOSVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveIsBoundDataVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveIsBoundDataVolumeToOSVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveIsDeviceLockable: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveIsDeviceLockedOut: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveIsHardwareReadyForConversion: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveIsHybridVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveIsHybridVolumeW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveIsPassphraseCompatibleW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveIsRecoveryPasswordGroupValidW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveIsRecoveryPasswordValidW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveIsSchemaExtInstalled: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveIsVolumeEncryptable: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveKeyManagement: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveLockDevice: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveLockVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveLogRecoveryReason: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveNeedsDiscoveryVolumeUpdate: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveNotifyVolumeAfterFormat: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveOpenVolumeByHandle: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    FveOpenVolumeExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    FveOpenVolumeW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    FvePpfPredictionsUpdated: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveProtectorTypeToFlags: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    FveQuery: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveQueryDeviceEncryptionSupport: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveRecalculateOffsetsAndMoveMetadata: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveRegenerateNbpSessionKey: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveResetTpmDictionaryAttackParameters: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveRevertVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveSaveRecoveryPasswordBackupFlag: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveSelectBestRecoveryPasswordByBackupInformation: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveServiceDiscoveryVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveSetAllowKeyExport: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveSetDescriptionW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveSetFipsAllowDisabled: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveSetFveMethod: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveSetFveMethodEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveSetIdentificationFieldW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveSetRecoveryPasswordBackupAccountInformation: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveSetRecoveryPasswordBackupInformation: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveSetUserFlags: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveSetupTpmCallback: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveSysClearUserFlags: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveSysCloseVolume: { args: [FFIType.u64], returns: FFIType.u32 },
    FveSysGetUserFlags: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveSysOpenVolumeW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    FveSysSetUserFlags: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveUnbindAllDataVolumeFromOSVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveUnbindDataVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveUnlockVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveUnlockVolumeAuthMethodSid: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveUnlockVolumeWithAccessMode: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveUpdateBandIdBcd: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveUpdateDeviceLockoutState: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveUpdateDeviceLockoutStateEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveUpdatePinW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveUpgradeVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveValidateDeviceLockoutState: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FveValidateExistingPassphraseW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FveValidateExistingPinW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    InternalFveIsVolumeEncrypted: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NgscbCheckDmaSecurity: { args: [FFIType.ptr], returns: FFIType.u32 },
    NgscbCheckDmaSecurityEx: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NgscbCheckHSTIPrerequisitesVerified: { args: [FFIType.ptr], returns: FFIType.u32 },
    NgscbCheckIsAOACDevice: { args: [FFIType.ptr], returns: FFIType.u32 },
    NgscbCheckIsHSTIVerified: { args: [FFIType.ptr], returns: FFIType.u32 },
    NgscbCheckPreventDeviceEncryption: { args: [FFIType.ptr], returns: FFIType.u32 },
    NgscbCheckPreventDeviceEncryptionForAad: { args: [FFIType.ptr], returns: FFIType.u32 },
    NgscbGetWinReConfiguration: { args: [FFIType.ptr], returns: FFIType.u32 },
    NgscbIsHostOsOnRoamableDrive: { args: [FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/secprov/addkeyprotectorcertificatefile-win32-encryptablevolume
  public static FveAddAuthMethodInformation(hVolume: FVE_HANDLE, pAuthMethod: LPVOID): DWORD {
    return Fveapi.Load('FveAddAuthMethodInformation')(hVolume, pAuthMethod);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/addkeyprotectorexternalkey-win32-encryptablevolume
  public static FveAddAuthMethodSid(hVolume: FVE_HANDLE, pAuthMethodSid: LPVOID): DWORD {
    return Fveapi.Load('FveAddAuthMethodSid')(hVolume, pAuthMethodSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/addkeyprotectortpm-win32-encryptablevolume
  public static FveAddPredictiveTpmProtector(hVolume: FVE_HANDLE, pProtector: LPVOID): DWORD {
    return Fveapi.Load('FveAddPredictiveTpmProtector')(hVolume, pProtector);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveApplyGroupPolicy(hVolume: FVE_HANDLE, pPolicy: LPVOID): DWORD {
    return Fveapi.Load('FveApplyGroupPolicy')(hVolume, pPolicy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveApplyNkpCertChanges(hVolume: FVE_HANDLE, pChanges: LPVOID): DWORD {
    return Fveapi.Load('FveApplyNkpCertChanges')(hVolume, pChanges);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/unlockwithexternalkey-win32-encryptablevolume
  public static FveAttemptAutoUnlock(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveAttemptAutoUnlock')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/protectkeywithpassphrase-win32-encryptablevolume
  public static FveAuthElementFromPassPhraseW(pszPassphrase: LPCWSTR, ppAuthElement: LPVOID): DWORD {
    return Fveapi.Load('FveAuthElementFromPassPhraseW')(pszPassphrase, ppAuthElement);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/protectkeywithtpmandpin-win32-encryptablevolume
  public static FveAuthElementFromPinW(pszPin: LPCWSTR, ppAuthElement: LPVOID): DWORD {
    return Fveapi.Load('FveAuthElementFromPinW')(pszPin, ppAuthElement);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/protectkeywithnumericalpassword-win32-encryptablevolume
  public static FveAuthElementFromRecoveryPasswordW(pszRecoveryPassword: LPCWSTR, ppAuthElement: LPVOID): DWORD {
    return Fveapi.Load('FveAuthElementFromRecoveryPasswordW')(pszRecoveryPassword, ppAuthElement);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/saveexternalkeytofile-win32-encryptablevolume
  public static FveAuthElementGetKeyFileNameW(pAuthElement: LPVOID, pszKeyFileName: LPWSTR): DWORD {
    return Fveapi.Load('FveAuthElementGetKeyFileNameW')(pAuthElement, pszKeyFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/protectkeywithexternalkey-win32-encryptablevolume
  public static FveAuthElementReadExternalKeyW(pszKeyFileName: LPCWSTR, ppAuthElement: LPVOID): DWORD {
    return Fveapi.Load('FveAuthElementReadExternalKeyW')(pszKeyFileName, ppAuthElement);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getkeyprotectornumericalpassword-win32-encryptablevolume
  public static FveAuthElementToRecoveryPasswordW(pAuthElement: LPVOID, pszRecoveryPassword: LPWSTR): DWORD {
    return Fveapi.Load('FveAuthElementToRecoveryPasswordW')(pAuthElement, pszRecoveryPassword);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/saveexternalkeytofile-win32-encryptablevolume
  public static FveAuthElementWriteExternalKeyExW(pAuthElement: LPVOID, pszKeyFileName: LPWSTR): DWORD {
    return Fveapi.Load('FveAuthElementWriteExternalKeyExW')(pAuthElement, pszKeyFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/saveexternalkeytofile-win32-encryptablevolume
  public static FveAuthElementWriteExternalKeyW(pAuthElement: LPVOID, pszKeyFileName: LPWSTR): DWORD {
    return Fveapi.Load('FveAuthElementWriteExternalKeyW')(pAuthElement, pszKeyFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/backuprecoveryinformationtoactivedirectory-win32-encryptablevolume
  public static FveBackupRecoveryInformationToAAD(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveBackupRecoveryInformationToAAD')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/backuprecoveryinformationtoactivedirectory-win32-encryptablevolume
  public static FveBackupRecoveryInformationToAD(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveBackupRecoveryInformationToAD')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/backuprecoveryinformationtoactivedirectory-win32-encryptablevolume
  public static FveBackupRecoveryInformationToADEx(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveBackupRecoveryInformationToADEx')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/unlockwithexternalkey-win32-encryptablevolume
  public static FveBindDataVolume(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveBindDataVolume')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveCanPinExceptionPolicyBeApplied(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveCanPinExceptionPolicyBeApplied')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveCanStandardUsersChangePassphraseByProxy(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveCanStandardUsersChangePassphraseByProxy')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveCanStandardUsersChangePin(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveCanStandardUsersChangePin')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveCheckADRecoveryInfoBackupPolicy(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveCheckADRecoveryInfoBackupPolicy')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveCheckADRecoveryInfoBackupPolicyEx(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveCheckADRecoveryInfoBackupPolicyEx')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveCheckPassphrasePolicy(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveCheckPassphrasePolicy')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/istpmcompatible-win32-tpm
  public static FveCheckTpmCapability(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveCheckTpmCapability')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveClearRecoveryPasswordBackupInformation(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveClearRecoveryPasswordBackupInformation')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveClearUserFlags(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveClearUserFlags')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveCloseHandle(hObject: HANDLE): DWORD {
    return Fveapi.Load('FveCloseHandle')(hObject);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveCloseVolume(hVolume: FVE_HANDLE): DWORD {
    return Fveapi.Load('FveCloseVolume')(hVolume);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveCommitChanges(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveCommitChanges')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveCommitChangesEx(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveCommitChangesEx')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveControl(hVolume: FVE_HANDLE, pControl: LPVOID): DWORD {
    return Fveapi.Load('FveControl')(hVolume, pControl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/decrypt-win32-encryptablevolume
  public static FveConversionDecrypt(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveConversionDecrypt')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/decrypt-win32-encryptablevolume
  public static FveConversionDecryptEx(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveConversionDecryptEx')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/encrypt-win32-encryptablevolume
  public static FveConversionEncrypt(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveConversionEncrypt')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/encrypt-win32-encryptablevolume
  public static FveConversionEncryptEx(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveConversionEncryptEx')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/encrypt-win32-encryptablevolume
  public static FveConversionEncryptPendingReboot(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveConversionEncryptPendingReboot')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/encrypt-win32-encryptablevolume
  public static FveConversionEncryptPendingRebootEx(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveConversionEncryptPendingRebootEx')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/pauseconversion-win32-encryptablevolume
  public static FveConversionPause(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveConversionPause')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/resumeconversion-win32-encryptablevolume
  public static FveConversionResume(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveConversionResume')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/pauseconversion-win32-encryptablevolume
  public static FveConversionStop(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveConversionStop')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/pauseconversion-win32-encryptablevolume
  public static FveConversionStopEx(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveConversionStopEx')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveDecrementClearKeyCounter(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveDecrementClearKeyCounter')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/deletekeyprotector-win32-encryptablevolume
  public static FveDeleteAuthMethod(hVolume: FVE_HANDLE, pAuthMethod: LPVOID): DWORD {
    return Fveapi.Load('FveDeleteAuthMethod')(hVolume, pAuthMethod);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveDeleteDeviceEncryptionOptOutForVolumeW(pszVolume: LPCWSTR, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveDeleteDeviceEncryptionOptOutForVolumeW')(pszVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/disablekeyprotectors-win32-encryptablevolume
  public static FveDisableDeviceLockoutState(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveDisableDeviceLockoutState')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveDiscardChanges(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveDiscardChanges')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveDraCertPresentInRegistry(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveDraCertPresentInRegistry')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveEnableRawAccess(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveEnableRawAccess')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveEnableRawAccessEx(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveEnableRawAccessEx')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveEnableRawAccessW(pszVolume: LPCWSTR, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveEnableRawAccessW')(pszVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveEraseDrive(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveEraseDrive')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveEscrowEncryptedRecoveryKeyForRetailUnlock(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveEscrowEncryptedRecoveryKeyForRetailUnlock')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveExternalDataCreateEntry(hVolume: FVE_HANDLE, pEntry: LPVOID): DWORD {
    return Fveapi.Load('FveExternalDataCreateEntry')(hVolume, pEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveExternalDataDeleteEntries(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveExternalDataDeleteEntries')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveExternalDataGetEntryInfo(hVolume: FVE_HANDLE, pEntryInfo: LPVOID): DWORD {
    return Fveapi.Load('FveExternalDataGetEntryInfo')(hVolume, pEntryInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveExternalDataGetEntryRawData(hVolume: FVE_HANDLE, pRawData: LPVOID): DWORD {
    return Fveapi.Load('FveExternalDataGetEntryRawData')(hVolume, pRawData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveFindFirstVolume(ppVolumeName: LPVOID, phSearch_out: PFVE_HANDLE): DWORD {
    return Fveapi.Load('FveFindFirstVolume')(ppVolumeName, phSearch_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveFindNextVolume(hSearch: FVE_HANDLE, ppVolumeName: LPVOID): DWORD {
    return Fveapi.Load('FveFindNextVolume')(hSearch, ppVolumeName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getkeyprotectortype-win32-encryptablevolume
  public static FveFlagsToProtectorType(dwFlags: DWORD, pProtectorType: LPVOID): DWORD {
    return Fveapi.Load('FveFlagsToProtectorType')(dwFlags, pProtectorType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveGenerateNbp(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveGenerateNbp')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveGenerateNkpSessionKeys(hVolume: FVE_HANDLE, pSessionKeys: LPVOID): DWORD {
    return Fveapi.Load('FveGenerateNkpSessionKeys')(hVolume, pSessionKeys);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveGetAllowKeyExport(hVolume: FVE_HANDLE, pAllowKeyExport: LPVOID): DWORD {
    return Fveapi.Load('FveGetAllowKeyExport')(hVolume, pAllowKeyExport);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getkeyprotectors-win32-encryptablevolume
  public static FveGetAuthMethodGuids(hVolume: FVE_HANDLE, pGuids: LPVOID): DWORD {
    return Fveapi.Load('FveGetAuthMethodGuids')(hVolume, pGuids);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getkeyprotectortype-win32-encryptablevolume
  public static FveGetAuthMethodInformation(hVolume: FVE_HANDLE, pAuthMethodInfo: LPVOID): DWORD {
    return Fveapi.Load('FveGetAuthMethodInformation')(hVolume, pAuthMethodInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getkeyprotectoradsidinformation-win32-encryptablevolume
  public static FveGetAuthMethodSid(hVolume: FVE_HANDLE, pSid: LPVOID): DWORD {
    return Fveapi.Load('FveGetAuthMethodSid')(hVolume, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getkeyprotectoradsidinformation-win32-encryptablevolume
  public static FveGetAuthMethodSidInformation(hVolume: FVE_HANDLE, pSidInfo: LPVOID): DWORD {
    return Fveapi.Load('FveGetAuthMethodSidInformation')(hVolume, pSidInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveGetClearKeyCounter(hVolume: FVE_HANDLE, pCounter: LPVOID): DWORD {
    return Fveapi.Load('FveGetClearKeyCounter')(hVolume, pCounter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveGetDataSet(hVolume: FVE_HANDLE, pDataSet: LPVOID): DWORD {
    return Fveapi.Load('FveGetDataSet')(hVolume, pDataSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveGetDataSetEx(hVolume: FVE_HANDLE, pDataSet: LPVOID): DWORD {
    return Fveapi.Load('FveGetDataSetEx')(hVolume, pDataSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveGetDescriptionW(hVolume: FVE_HANDLE, pszDescription: LPVOID): DWORD {
    return Fveapi.Load('FveGetDescriptionW')(hVolume, pszDescription);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveGetDeviceLockoutData(hVolume: FVE_HANDLE, pLockoutData: LPVOID): DWORD {
    return Fveapi.Load('FveGetDeviceLockoutData')(hVolume, pLockoutData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getexternalkeyfromfile-win32-encryptablevolume
  public static FveGetExternalKeyBlob(hVolume: FVE_HANDLE, pKeyBlob: LPVOID): DWORD {
    return Fveapi.Load('FveGetExternalKeyBlob')(hVolume, pKeyBlob);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveGetFipsAllowDisabled(hVolume: FVE_HANDLE, pFipsAllowDisabled: LPVOID): DWORD {
    return Fveapi.Load('FveGetFipsAllowDisabled')(hVolume, pFipsAllowDisabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getencryptionmethod-win32-encryptablevolume
  public static FveGetFveMethod(hVolume: FVE_HANDLE, pMethod: LPVOID): DWORD {
    return Fveapi.Load('FveGetFveMethod')(hVolume, pMethod);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getencryptionmethod-win32-encryptablevolume
  public static FveGetFveMethodEDrv(hVolume: FVE_HANDLE, pMethod: LPVOID): DWORD {
    return Fveapi.Load('FveGetFveMethodEDrv')(hVolume, pMethod);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getencryptionmethod-win32-encryptablevolume
  public static FveGetFveMethodEx(hVolume: FVE_HANDLE, pMethod: LPVOID): DWORD {
    return Fveapi.Load('FveGetFveMethodEx')(hVolume, pMethod);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getidentificationfield-win32-encryptablevolume
  public static FveGetIdentificationFieldW(hVolume: FVE_HANDLE, pszIdentificationField: LPVOID): DWORD {
    return Fveapi.Load('FveGetIdentificationFieldW')(hVolume, pszIdentificationField);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveGetIdentity(hVolume: FVE_HANDLE, pIdentity: LPVOID): DWORD {
    return Fveapi.Load('FveGetIdentity')(hVolume, pIdentity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getkeypackage-win32-encryptablevolume
  public static FveGetKeyPackage(hVolume: FVE_HANDLE, pKeyPackage: LPVOID): DWORD {
    return Fveapi.Load('FveGetKeyPackage')(hVolume, pKeyPackage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveGetRecoveryPasswordBackupAccountInformation(hVolume: FVE_HANDLE, pInfo: LPVOID): DWORD {
    return Fveapi.Load('FveGetRecoveryPasswordBackupAccountInformation')(hVolume, pInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveGetRecoveryPasswordBackupInformation(hVolume: FVE_HANDLE, pInfo: LPVOID): DWORD {
    return Fveapi.Load('FveGetRecoveryPasswordBackupInformation')(hVolume, pInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveGetSecureBootBindingState(hVolume: FVE_HANDLE, pState: LPVOID): DWORD {
    return Fveapi.Load('FveGetSecureBootBindingState')(hVolume, pState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getprotectionstatus-win32-encryptablevolume
  public static FveGetStatus(hVolume: FVE_HANDLE, pStatus: LPVOID): DWORD {
    return Fveapi.Load('FveGetStatus')(hVolume, pStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getprotectionstatus-win32-encryptablevolume
  public static FveGetStatusW(pszVolume: LPCWSTR, pStatus: LPVOID): DWORD {
    return Fveapi.Load('FveGetStatusW')(pszVolume, pStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveGetUserFlags(hVolume: FVE_HANDLE, pUserFlags: LPVOID): DWORD {
    return Fveapi.Load('FveGetUserFlags')(hVolume, pUserFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getdeviceid-win32-encryptablevolume
  public static FveGetVolumeNameW(hVolume: FVE_HANDLE, pszVolumeName: LPVOID): DWORD {
    return Fveapi.Load('FveGetVolumeNameW')(hVolume, pszVolumeName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/preparevolume-win32-encryptablevolume
  public static FveInitVolume(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveInitVolume')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/preparevolume-win32-encryptablevolume
  public static FveInitVolumeEx(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveInitVolumeEx')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/preparevolume-win32-encryptablevolume
  public static FveInitializeDeviceEncryption(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveInitializeDeviceEncryption')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/preparevolume-win32-encryptablevolume
  public static FveInitializeDeviceEncryption2(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveInitializeDeviceEncryption2')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveIsAnyDataVolumeBoundToOSVolume(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveIsAnyDataVolumeBoundToOSVolume')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveIsBoundDataVolume(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveIsBoundDataVolume')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveIsBoundDataVolumeToOSVolume(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveIsBoundDataVolumeToOSVolume')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveIsDeviceLockable(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveIsDeviceLockable')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveIsDeviceLockedOut(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveIsDeviceLockedOut')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveIsHardwareReadyForConversion(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveIsHardwareReadyForConversion')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveIsHybridVolume(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveIsHybridVolume')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveIsHybridVolumeW(pszVolume: LPCWSTR, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveIsHybridVolumeW')(pszVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveIsPassphraseCompatibleW(pszPassphrase: LPCWSTR, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveIsPassphraseCompatibleW')(pszPassphrase, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/isnumericalpasswordvalid-win32-encryptablevolume
  public static FveIsRecoveryPasswordGroupValidW(pszRecoveryPassword: LPCWSTR, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveIsRecoveryPasswordGroupValidW')(pszRecoveryPassword, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/isnumericalpasswordvalid-win32-encryptablevolume
  public static FveIsRecoveryPasswordValidW(pszRecoveryPassword: LPCWSTR, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveIsRecoveryPasswordValidW')(pszRecoveryPassword, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveIsSchemaExtInstalled(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveIsSchemaExtInstalled')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveIsVolumeEncryptable(pszVolume: LPCWSTR, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveIsVolumeEncryptable')(pszVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveKeyManagement(hVolume: FVE_HANDLE, pKeyMgmt: LPVOID): DWORD {
    return Fveapi.Load('FveKeyManagement')(hVolume, pKeyMgmt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveLockDevice(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveLockDevice')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/lock-win32-encryptablevolume
  public static FveLockVolume(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveLockVolume')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveLogRecoveryReason(hVolume: FVE_HANDLE, pReason: LPVOID): DWORD {
    return Fveapi.Load('FveLogRecoveryReason')(hVolume, pReason);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveNeedsDiscoveryVolumeUpdate(hVolume: FVE_HANDLE, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveNeedsDiscoveryVolumeUpdate')(hVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveNotifyVolumeAfterFormat(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveNotifyVolumeAfterFormat')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveOpenVolumeByHandle(hRawVolume: HANDLE, dwAccess: DWORD, phVolume_out: PFVE_HANDLE): DWORD {
    return Fveapi.Load('FveOpenVolumeByHandle')(hRawVolume, dwAccess, phVolume_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveOpenVolumeExW(pszVolume: LPCWSTR, dwAccess: DWORD, phVolume_out: PFVE_HANDLE): DWORD {
    return Fveapi.Load('FveOpenVolumeExW')(pszVolume, dwAccess, phVolume_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveOpenVolumeW(pszVolume: LPCWSTR, dwAccess: DWORD, phVolume_out: PFVE_HANDLE): DWORD {
    return Fveapi.Load('FveOpenVolumeW')(pszVolume, dwAccess, phVolume_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FvePpfPredictionsUpdated(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FvePpfPredictionsUpdated')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getkeyprotectortype-win32-encryptablevolume
  public static FveProtectorTypeToFlags(dwProtectorType: DWORD, pFlags: LPVOID): DWORD {
    return Fveapi.Load('FveProtectorTypeToFlags')(dwProtectorType, pFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/getconversionstatus-win32-encryptablevolume
  public static FveQuery(hVolume: FVE_HANDLE, pInfo: LPVOID): DWORD {
    return Fveapi.Load('FveQuery')(hVolume, pInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveQueryDeviceEncryptionSupport(hVolume: FVE_HANDLE, pSupport: LPVOID): DWORD {
    return Fveapi.Load('FveQueryDeviceEncryptionSupport')(hVolume, pSupport);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveRecalculateOffsetsAndMoveMetadata(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveRecalculateOffsetsAndMoveMetadata')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveRegenerateNbpSessionKey(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveRegenerateNbpSessionKey')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveResetTpmDictionaryAttackParameters(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveResetTpmDictionaryAttackParameters')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveRevertVolume(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveRevertVolume')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveSaveRecoveryPasswordBackupFlag(hVolume: FVE_HANDLE, pFlag: LPVOID): DWORD {
    return Fveapi.Load('FveSaveRecoveryPasswordBackupFlag')(hVolume, pFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveSelectBestRecoveryPasswordByBackupInformation(hVolume: FVE_HANDLE, pInfo: LPVOID): DWORD {
    return Fveapi.Load('FveSelectBestRecoveryPasswordByBackupInformation')(hVolume, pInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveServiceDiscoveryVolume(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveServiceDiscoveryVolume')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveSetAllowKeyExport(hVolume: FVE_HANDLE, pAllowKeyExport: LPVOID): DWORD {
    return Fveapi.Load('FveSetAllowKeyExport')(hVolume, pAllowKeyExport);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveSetDescriptionW(hVolume: FVE_HANDLE, pszDescription: LPCWSTR): DWORD {
    return Fveapi.Load('FveSetDescriptionW')(hVolume, pszDescription);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveSetFipsAllowDisabled(hVolume: FVE_HANDLE, pFipsAllowDisabled: LPVOID): DWORD {
    return Fveapi.Load('FveSetFipsAllowDisabled')(hVolume, pFipsAllowDisabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/setencryptionmethod-win32-encryptablevolume
  public static FveSetFveMethod(hVolume: FVE_HANDLE, pMethod: LPVOID): DWORD {
    return Fveapi.Load('FveSetFveMethod')(hVolume, pMethod);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/setencryptionmethod-win32-encryptablevolume
  public static FveSetFveMethodEx(hVolume: FVE_HANDLE, pMethod: LPVOID): DWORD {
    return Fveapi.Load('FveSetFveMethodEx')(hVolume, pMethod);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/setidentificationfield-win32-encryptablevolume
  public static FveSetIdentificationFieldW(hVolume: FVE_HANDLE, pszIdentificationField: LPCWSTR): DWORD {
    return Fveapi.Load('FveSetIdentificationFieldW')(hVolume, pszIdentificationField);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveSetRecoveryPasswordBackupAccountInformation(hVolume: FVE_HANDLE, pInfo: LPVOID): DWORD {
    return Fveapi.Load('FveSetRecoveryPasswordBackupAccountInformation')(hVolume, pInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveSetRecoveryPasswordBackupInformation(hVolume: FVE_HANDLE, pInfo: LPVOID): DWORD {
    return Fveapi.Load('FveSetRecoveryPasswordBackupInformation')(hVolume, pInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveSetUserFlags(hVolume: FVE_HANDLE, pUserFlags: LPVOID): DWORD {
    return Fveapi.Load('FveSetUserFlags')(hVolume, pUserFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveSetupTpmCallback(hVolume: FVE_HANDLE, pCallback: LPVOID): DWORD {
    return Fveapi.Load('FveSetupTpmCallback')(hVolume, pCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveSysClearUserFlags(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveSysClearUserFlags')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveSysCloseVolume(hVolume: FVE_HANDLE): DWORD {
    return Fveapi.Load('FveSysCloseVolume')(hVolume);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveSysGetUserFlags(hVolume: FVE_HANDLE, pUserFlags: LPVOID): DWORD {
    return Fveapi.Load('FveSysGetUserFlags')(hVolume, pUserFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveSysOpenVolumeW(pszVolume: LPCWSTR, dwAccess: DWORD, phVolume_out: PFVE_HANDLE): DWORD {
    return Fveapi.Load('FveSysOpenVolumeW')(pszVolume, dwAccess, phVolume_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveSysSetUserFlags(hVolume: FVE_HANDLE, pUserFlags: LPVOID): DWORD {
    return Fveapi.Load('FveSysSetUserFlags')(hVolume, pUserFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveUnbindAllDataVolumeFromOSVolume(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveUnbindAllDataVolumeFromOSVolume')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveUnbindDataVolume(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveUnbindDataVolume')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/unlockwithnumericalpassword-win32-encryptablevolume
  public static FveUnlockVolume(hVolume: FVE_HANDLE, pAuthElement: LPVOID): DWORD {
    return Fveapi.Load('FveUnlockVolume')(hVolume, pAuthElement);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/unlockwithexternalkey-win32-encryptablevolume
  public static FveUnlockVolumeAuthMethodSid(hVolume: FVE_HANDLE, pAuthMethodSid: LPVOID): DWORD {
    return Fveapi.Load('FveUnlockVolumeAuthMethodSid')(hVolume, pAuthMethodSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/unlockwithexternalkey-win32-encryptablevolume
  public static FveUnlockVolumeWithAccessMode(hVolume: FVE_HANDLE, pAccessMode: LPVOID): DWORD {
    return Fveapi.Load('FveUnlockVolumeWithAccessMode')(hVolume, pAccessMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveUpdateBandIdBcd(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveUpdateBandIdBcd')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveUpdateDeviceLockoutState(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveUpdateDeviceLockoutState')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveUpdateDeviceLockoutStateEx(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveUpdateDeviceLockoutStateEx')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/changepin-win32-encryptablevolume
  public static FveUpdatePinW(hVolume: FVE_HANDLE, pszPin: LPCWSTR): DWORD {
    return Fveapi.Load('FveUpdatePinW')(hVolume, pszPin);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/upgradevolume-win32-encryptablevolume
  public static FveUpgradeVolume(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveUpgradeVolume')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveValidateDeviceLockoutState(hVolume: FVE_HANDLE, pContext: LPVOID): DWORD {
    return Fveapi.Load('FveValidateDeviceLockoutState')(hVolume, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveValidateExistingPassphraseW(pszPassphrase: LPCWSTR, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveValidateExistingPassphraseW')(pszPassphrase, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static FveValidateExistingPinW(pszPin: LPCWSTR, pResult: LPVOID): DWORD {
    return Fveapi.Load('FveValidateExistingPinW')(pszPin, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static InternalFveIsVolumeEncrypted(pszVolume: LPCWSTR, pResult: LPVOID): DWORD {
    return Fveapi.Load('InternalFveIsVolumeEncrypted')(pszVolume, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static NgscbCheckDmaSecurity(pResult: LPVOID): DWORD {
    return Fveapi.Load('NgscbCheckDmaSecurity')(pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static NgscbCheckDmaSecurityEx(pContext: LPVOID, pResult: LPVOID): DWORD {
    return Fveapi.Load('NgscbCheckDmaSecurityEx')(pContext, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static NgscbCheckHSTIPrerequisitesVerified(pResult: LPVOID): DWORD {
    return Fveapi.Load('NgscbCheckHSTIPrerequisitesVerified')(pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static NgscbCheckIsAOACDevice(pResult: LPVOID): DWORD {
    return Fveapi.Load('NgscbCheckIsAOACDevice')(pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static NgscbCheckIsHSTIVerified(pResult: LPVOID): DWORD {
    return Fveapi.Load('NgscbCheckIsHSTIVerified')(pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static NgscbCheckPreventDeviceEncryption(pResult: LPVOID): DWORD {
    return Fveapi.Load('NgscbCheckPreventDeviceEncryption')(pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static NgscbCheckPreventDeviceEncryptionForAad(pResult: LPVOID): DWORD {
    return Fveapi.Load('NgscbCheckPreventDeviceEncryptionForAad')(pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static NgscbGetWinReConfiguration(pConfiguration: LPVOID): DWORD {
    return Fveapi.Load('NgscbGetWinReConfiguration')(pConfiguration);
  }

  // https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume
  public static NgscbIsHostOsOnRoamableDrive(pResult: LPVOID): DWORD {
    return Fveapi.Load('NgscbIsHostOsOnRoamableDrive')(pResult);
  }
}

export default Fveapi;
