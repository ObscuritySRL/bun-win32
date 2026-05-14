import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  HWND,
  LPCWSTR,
  LPWSTR,
  LPSIZE_T,
  LPNCryptBufferDesc,
  NCRYPT_DESCRIPTOR_HANDLE,
  NCRYPT_HANDLE,
  NCRYPT_KEY_HANDLE,
  NCRYPT_PROV_HANDLE,
  NCRYPT_SECRET_HANDLE,
  NCRYPT_STREAM_HANDLE,
  NULL,
  PBYTE,
  PDWORD,
  PHANDLE,
  PNCRYPT_ALLOC_PARA,
  PNCRYPT_DESCRIPTOR_HANDLE,
  PNCRYPT_KEY_HANDLE,
  PNCRYPT_PROV_HANDLE,
  PNCRYPT_SECRET_HANDLE,
  PNCRYPT_STREAM_HANDLE,
  PPNCryptAlgorithmName,
  PPNCryptKeyName,
  PPNCryptProviderName,
  PVOID,
  PULONG,
  SECURITY_STATUS,
  SIZE_T,
  HCRYPTKEY,
  HCRYPTPROV,
} from '../types/Ncrypt';

/**
 * Thin, lazy-loaded FFI bindings for `ncrypt.dll`.
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
 * import Ncrypt from './structs/Ncrypt';
 *
 * // Lazy: bind on first call
 * const status = Ncrypt.NCryptOpenStorageProvider(handleBuffer.ptr!, providerName.ptr!, 0);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Ncrypt.Preload(['NCryptOpenStorageProvider', 'NCryptOpenKey', 'NCryptSignHash']);
 * ```
 */
class Ncrypt extends Win32 {
  protected static override name = 'ncrypt.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    NCryptCloseProtectionDescriptor: { args: [FFIType.u64], returns: FFIType.i32 },
    NCryptCreateClaim: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptCreatePersistedKey: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    NCryptCreateProtectionDescriptor: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NCryptDecrypt: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptDeleteKey: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    NCryptDeriveKey: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptEncrypt: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptEnumAlgorithms: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptEnumKeys: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptEnumStorageProviders: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptExportKey: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptFinalizeKey: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    NCryptFreeBuffer: { args: [FFIType.ptr], returns: FFIType.i32 },
    NCryptFreeObject: { args: [FFIType.u64], returns: FFIType.i32 },
    NCryptGetProperty: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptGetProtectionDescriptorInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NCryptImportKey: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    NCryptIsAlgSupported: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptIsKeyHandle: { args: [FFIType.u64], returns: FFIType.i32 },
    NCryptKeyDerivation: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptNotifyChangeKey: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptOpenKey: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    NCryptOpenStorageProvider: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptProtectSecret: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NCryptQueryProtectionDescriptorName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptRegisterProtectionDescriptorName: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptSecretAgreement: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptSetProperty: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    NCryptSignHash: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptStreamClose: { args: [FFIType.u64], returns: FFIType.i32 },
    NCryptStreamOpenToProtect: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NCryptStreamOpenToUnprotect: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NCryptStreamOpenToUnprotectEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NCryptStreamUpdate: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    NCryptTranslateHandle: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    NCryptUnprotectSecret: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NCryptVerifyClaim: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NCryptVerifySignature: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/ncryptprotect/nf-ncryptprotect-ncryptcloseprotectiondescriptor
  public static NCryptCloseProtectionDescriptor(hDescriptor: NCRYPT_DESCRIPTOR_HANDLE): SECURITY_STATUS {
    return Ncrypt.Load('NCryptCloseProtectionDescriptor')(hDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptcreateclaim
  public static NCryptCreateClaim(
    hSubjectKey: NCRYPT_KEY_HANDLE | 0n,
    hAuthorityKey: NCRYPT_KEY_HANDLE | 0n,
    dwClaimType: DWORD,
    pParameterList: LPNCryptBufferDesc | NULL,
    pbClaimBlob: PBYTE | NULL,
    cbClaimBlob: DWORD,
    pcbResult: PDWORD,
    dwFlags: DWORD,
  ): SECURITY_STATUS {
    return Ncrypt.Load('NCryptCreateClaim')(hSubjectKey, hAuthorityKey, dwClaimType, pParameterList, pbClaimBlob, cbClaimBlob, pcbResult, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptcreatepersistedkey
  public static NCryptCreatePersistedKey(hProvider: NCRYPT_PROV_HANDLE, phKey: PNCRYPT_KEY_HANDLE, pszAlgId: LPCWSTR, pszKeyName: LPCWSTR | NULL, dwLegacyKeySpec: DWORD, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptCreatePersistedKey')(hProvider, phKey, pszAlgId, pszKeyName, dwLegacyKeySpec, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncryptprotect/nf-ncryptprotect-ncryptcreateprotectiondescriptor
  public static NCryptCreateProtectionDescriptor(pwszDescriptorString: LPCWSTR, dwFlags: DWORD, phDescriptor: PNCRYPT_DESCRIPTOR_HANDLE): SECURITY_STATUS {
    return Ncrypt.Load('NCryptCreateProtectionDescriptor')(pwszDescriptorString, dwFlags, phDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptdecrypt
  public static NCryptDecrypt(hKey: NCRYPT_KEY_HANDLE, pbInput: PBYTE | NULL, cbInput: DWORD, pPaddingInfo: PVOID | NULL, pbOutput: PBYTE | NULL, cbOutput: DWORD, pcbResult: PDWORD, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptDecrypt')(hKey, pbInput, cbInput, pPaddingInfo, pbOutput, cbOutput, pcbResult, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptdeletekey
  public static NCryptDeleteKey(hKey: NCRYPT_KEY_HANDLE, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptDeleteKey')(hKey, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptderivekey
  public static NCryptDeriveKey(hSharedSecret: NCRYPT_SECRET_HANDLE, pwszKDF: LPCWSTR, pParameterList: LPNCryptBufferDesc | NULL, pbDerivedKey: PBYTE | NULL, cbDerivedKey: DWORD, pcbResult: PDWORD, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptDeriveKey')(hSharedSecret, pwszKDF, pParameterList, pbDerivedKey, cbDerivedKey, pcbResult, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptencrypt
  public static NCryptEncrypt(hKey: NCRYPT_KEY_HANDLE, pbInput: PBYTE | NULL, cbInput: DWORD, pPaddingInfo: PVOID | NULL, pbOutput: PBYTE | NULL, cbOutput: DWORD, pcbResult: PDWORD, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptEncrypt')(hKey, pbInput, cbInput, pPaddingInfo, pbOutput, cbOutput, pcbResult, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptenumalgorithms
  public static NCryptEnumAlgorithms(hProvider: NCRYPT_PROV_HANDLE, dwAlgOperations: DWORD, pdwAlgCount: PDWORD, ppAlgList: PPNCryptAlgorithmName, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptEnumAlgorithms')(hProvider, dwAlgOperations, pdwAlgCount, ppAlgList, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptenumkeys
  public static NCryptEnumKeys(hProvider: NCRYPT_PROV_HANDLE, pszScope: LPCWSTR | NULL, ppKeyName: PPNCryptKeyName, ppEnumState: PVOID, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptEnumKeys')(hProvider, pszScope, ppKeyName, ppEnumState, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptenumstorageproviders
  public static NCryptEnumStorageProviders(pdwProviderCount: PDWORD, ppProviderList: PPNCryptProviderName, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptEnumStorageProviders')(pdwProviderCount, ppProviderList, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptexportkey
  public static NCryptExportKey(
    hKey: NCRYPT_KEY_HANDLE,
    hExportKey: NCRYPT_KEY_HANDLE | 0n,
    pszBlobType: LPCWSTR,
    pParameterList: LPNCryptBufferDesc | NULL,
    pbOutput: PBYTE | NULL,
    cbOutput: DWORD,
    pcbResult: PDWORD,
    dwFlags: DWORD,
  ): SECURITY_STATUS {
    return Ncrypt.Load('NCryptExportKey')(hKey, hExportKey, pszBlobType, pParameterList, pbOutput, cbOutput, pcbResult, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptfinalizekey
  public static NCryptFinalizeKey(hKey: NCRYPT_KEY_HANDLE, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptFinalizeKey')(hKey, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptfreebuffer
  public static NCryptFreeBuffer(pvInput: PVOID): SECURITY_STATUS {
    return Ncrypt.Load('NCryptFreeBuffer')(pvInput);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptfreeobject
  public static NCryptFreeObject(hObject: NCRYPT_HANDLE): SECURITY_STATUS {
    return Ncrypt.Load('NCryptFreeObject')(hObject);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptgetproperty
  public static NCryptGetProperty(hObject: NCRYPT_HANDLE, pszProperty: LPCWSTR, pbOutput: PBYTE | NULL, cbOutput: DWORD, pcbResult: PDWORD, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptGetProperty')(hObject, pszProperty, pbOutput, cbOutput, pcbResult, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncryptprotect/nf-ncryptprotect-ncryptgetprotectiondescriptorinfo
  public static NCryptGetProtectionDescriptorInfo(hDescriptor: NCRYPT_DESCRIPTOR_HANDLE, pMemPara: PNCRYPT_ALLOC_PARA | NULL, dwInfoType: DWORD, ppvInfo: PVOID): SECURITY_STATUS {
    return Ncrypt.Load('NCryptGetProtectionDescriptorInfo')(hDescriptor, pMemPara, dwInfoType, ppvInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptimportkey
  public static NCryptImportKey(
    hProvider: NCRYPT_PROV_HANDLE,
    hImportKey: NCRYPT_KEY_HANDLE | 0n,
    pszBlobType: LPCWSTR,
    pParameterList: LPNCryptBufferDesc | NULL,
    phKey: PNCRYPT_KEY_HANDLE,
    pbData: PBYTE,
    cbData: DWORD,
    dwFlags: DWORD,
  ): SECURITY_STATUS {
    return Ncrypt.Load('NCryptImportKey')(hProvider, hImportKey, pszBlobType, pParameterList, phKey, pbData, cbData, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptisalgsupported
  public static NCryptIsAlgSupported(hProvider: NCRYPT_PROV_HANDLE, pszAlgId: LPCWSTR, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptIsAlgSupported')(hProvider, pszAlgId, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptiskeyhandle
  public static NCryptIsKeyHandle(hKey: NCRYPT_KEY_HANDLE): BOOL {
    return Ncrypt.Load('NCryptIsKeyHandle')(hKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptkeyderivation
  public static NCryptKeyDerivation(hKey: NCRYPT_KEY_HANDLE, pParameterList: LPNCryptBufferDesc | NULL, pbDerivedKey: PBYTE, cbDerivedKey: DWORD, pcbResult: PDWORD, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptKeyDerivation')(hKey, pParameterList, pbDerivedKey, cbDerivedKey, pcbResult, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptnotifychangekey
  public static NCryptNotifyChangeKey(hProvider: NCRYPT_PROV_HANDLE, phEvent: PHANDLE, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptNotifyChangeKey')(hProvider, phEvent, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptopenkey
  public static NCryptOpenKey(hProvider: NCRYPT_PROV_HANDLE, phKey: PNCRYPT_KEY_HANDLE, pszKeyName: LPCWSTR, dwLegacyKeySpec: DWORD, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptOpenKey')(hProvider, phKey, pszKeyName, dwLegacyKeySpec, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptopenstorageprovider
  public static NCryptOpenStorageProvider(phProvider: PNCRYPT_PROV_HANDLE, pszProviderName: LPCWSTR | NULL, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptOpenStorageProvider')(phProvider, pszProviderName, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncryptprotect/nf-ncryptprotect-ncryptprotectsecret
  public static NCryptProtectSecret(
    hDescriptor: NCRYPT_DESCRIPTOR_HANDLE,
    dwFlags: DWORD,
    pbData: PBYTE,
    cbData: DWORD,
    pMemPara: PNCRYPT_ALLOC_PARA | NULL,
    hWnd: HWND | 0n,
    ppbProtectedBlob: PVOID,
    pcbProtectedBlob: PULONG,
  ): SECURITY_STATUS {
    return Ncrypt.Load('NCryptProtectSecret')(hDescriptor, dwFlags, pbData, cbData, pMemPara, hWnd, ppbProtectedBlob, pcbProtectedBlob);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncryptprotect/nf-ncryptprotect-ncryptqueryprotectiondescriptorname
  public static NCryptQueryProtectionDescriptorName(pwszName: LPCWSTR, pwszDescriptorString: LPWSTR | NULL, pcDescriptorString: LPSIZE_T, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptQueryProtectionDescriptorName')(pwszName, pwszDescriptorString, pcDescriptorString, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncryptprotect/nf-ncryptprotect-ncryptregisterprotectiondescriptorname
  public static NCryptRegisterProtectionDescriptorName(pwszName: LPCWSTR, pwszDescriptorString: LPCWSTR | NULL, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptRegisterProtectionDescriptorName')(pwszName, pwszDescriptorString, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptsecretagreement
  public static NCryptSecretAgreement(hPrivKey: NCRYPT_KEY_HANDLE, hPubKey: NCRYPT_KEY_HANDLE, phAgreedSecret: PNCRYPT_SECRET_HANDLE, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptSecretAgreement')(hPrivKey, hPubKey, phAgreedSecret, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptsetproperty
  public static NCryptSetProperty(hObject: NCRYPT_HANDLE, pszProperty: LPCWSTR, pbInput: PBYTE, cbInput: DWORD, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptSetProperty')(hObject, pszProperty, pbInput, cbInput, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptsignhash
  public static NCryptSignHash(hKey: NCRYPT_KEY_HANDLE, pPaddingInfo: PVOID | NULL, pbHashValue: PBYTE, cbHashValue: DWORD, pbSignature: PBYTE | NULL, cbSignature: DWORD, pcbResult: PDWORD, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptSignHash')(hKey, pPaddingInfo, pbHashValue, cbHashValue, pbSignature, cbSignature, pcbResult, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncryptprotect/nf-ncryptprotect-ncryptstreamclose
  public static NCryptStreamClose(hStream: NCRYPT_STREAM_HANDLE): SECURITY_STATUS {
    return Ncrypt.Load('NCryptStreamClose')(hStream);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncryptprotect/nf-ncryptprotect-ncryptstreamopentoprotect
  public static NCryptStreamOpenToProtect(hDescriptor: NCRYPT_DESCRIPTOR_HANDLE, dwFlags: DWORD, hWnd: HWND | 0n, pStreamInfo: PVOID, phStream: PNCRYPT_STREAM_HANDLE): SECURITY_STATUS {
    return Ncrypt.Load('NCryptStreamOpenToProtect')(hDescriptor, dwFlags, hWnd, pStreamInfo, phStream);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncryptprotect/nf-ncryptprotect-ncryptstreamopentounprotect
  public static NCryptStreamOpenToUnprotect(pStreamInfo: PVOID, dwFlags: DWORD, hWnd: HWND | 0n, phStream: PNCRYPT_STREAM_HANDLE): SECURITY_STATUS {
    return Ncrypt.Load('NCryptStreamOpenToUnprotect')(pStreamInfo, dwFlags, hWnd, phStream);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncryptprotect/nf-ncryptprotect-ncryptstreamopentounprotectex
  public static NCryptStreamOpenToUnprotectEx(pStreamInfo: PVOID, dwFlags: DWORD, hWnd: HWND | 0n, phStream: PNCRYPT_STREAM_HANDLE): SECURITY_STATUS {
    return Ncrypt.Load('NCryptStreamOpenToUnprotectEx')(pStreamInfo, dwFlags, hWnd, phStream);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncryptprotect/nf-ncryptprotect-ncryptstreamupdate
  public static NCryptStreamUpdate(hStream: NCRYPT_STREAM_HANDLE, pbData: PBYTE, cbData: SIZE_T, fFinal: BOOL): SECURITY_STATUS {
    return Ncrypt.Load('NCryptStreamUpdate')(hStream, pbData, cbData, fFinal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncrypttranslatehandle
  public static NCryptTranslateHandle(phProvider: PNCRYPT_PROV_HANDLE | NULL, phKey: PNCRYPT_KEY_HANDLE, hLegacyProv: HCRYPTPROV, hLegacyKey: HCRYPTKEY | 0n, dwLegacyKeySpec: DWORD, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptTranslateHandle')(phProvider, phKey, hLegacyProv, hLegacyKey, dwLegacyKeySpec, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncryptprotect/nf-ncryptprotect-ncryptunprotectsecret
  public static NCryptUnprotectSecret(
    phDescriptor: PNCRYPT_DESCRIPTOR_HANDLE | NULL,
    dwFlags: DWORD,
    pbProtectedBlob: PBYTE,
    cbProtectedBlob: DWORD,
    pMemPara: PNCRYPT_ALLOC_PARA | NULL,
    hWnd: HWND | 0n,
    ppbData: PVOID,
    pcbData: PULONG,
  ): SECURITY_STATUS {
    return Ncrypt.Load('NCryptUnprotectSecret')(phDescriptor, dwFlags, pbProtectedBlob, cbProtectedBlob, pMemPara, hWnd, ppbData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptverifyclaim
  public static NCryptVerifyClaim(
    hSubjectKey: NCRYPT_KEY_HANDLE,
    hAuthorityKey: NCRYPT_KEY_HANDLE | 0n,
    dwClaimType: DWORD,
    pParameterList: LPNCryptBufferDesc | NULL,
    pbClaimBlob: PBYTE,
    cbClaimBlob: DWORD,
    pOutput: LPNCryptBufferDesc,
    dwFlags: DWORD,
  ): SECURITY_STATUS {
    return Ncrypt.Load('NCryptVerifyClaim')(hSubjectKey, hAuthorityKey, dwClaimType, pParameterList, pbClaimBlob, cbClaimBlob, pOutput, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptverifysignature
  public static NCryptVerifySignature(hKey: NCRYPT_KEY_HANDLE, pPaddingInfo: PVOID | NULL, pbHashValue: PBYTE, cbHashValue: DWORD, pbSignature: PBYTE, cbSignature: DWORD, dwFlags: DWORD): SECURITY_STATUS {
    return Ncrypt.Load('NCryptVerifySignature')(hKey, pPaddingInfo, pbHashValue, cbHashValue, pbSignature, cbSignature, dwFlags);
  }
}

export default Ncrypt;
