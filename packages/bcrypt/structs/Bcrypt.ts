import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BCRYPT_ALG_HANDLE,
  BCRYPT_HANDLE,
  BCRYPT_HASH_HANDLE,
  BCRYPT_KEY_HANDLE,
  BCRYPT_MULTI_OPERATION_TYPE,
  BCRYPT_SECRET_HANDLE,
  HANDLE,
  LPCWSTR,
  NULL,
  NTSTATUS,
  PBCRYPT_ALG_HANDLE,
  PBCRYPT_HASH_HANDLE,
  PBCRYPT_KEY_HANDLE,
  PBCRYPT_SECRET_HANDLE,
  PBCryptBufferDesc,
  PBOOLEAN,
  PCRYPT_CONTEXT_CONFIG,
  PCRYPT_CONTEXT_FUNCTION_CONFIG,
  PPBCRYPT_ALGORITHM_IDENTIFIER,
  PPBCRYPT_PROVIDER_NAME,
  PPCRYPT_CONTEXT_CONFIG,
  PPCRYPT_CONTEXT_FUNCTION_CONFIG,
  PPCRYPT_CONTEXT_FUNCTION_PROVIDERS,
  PPCRYPT_CONTEXT_FUNCTIONS,
  PPCRYPT_CONTEXTS,
  PPCRYPT_PROVIDER_REFS,
  PPCRYPT_PROVIDER_REG,
  PPCRYPT_PROVIDERS,
  PPUCHAR,
  PHANDLE,
  PUCHAR,
  PULONG,
  PVOID,
  ULONG,
  ULONGLONG,
} from '../types/Bcrypt';

/**
 * Thin, lazy-loaded FFI bindings for `bcrypt.dll`.
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
 * import Bcrypt from './structs/Bcrypt';
 *
 * // Lazy: bind on first call
 * const status = Bcrypt.BCryptGenRandom(0n, buffer.ptr!, buffer.byteLength, 0x02);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Bcrypt.Preload(['BCryptGenRandom', 'BCryptHash']);
 * ```
 */
class Bcrypt extends Win32 {
  protected static override name = 'bcrypt.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    BCryptAddContextFunction: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BCryptCloseAlgorithmProvider: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    BCryptConfigureContext: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BCryptConfigureContextFunction: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BCryptCreateContext: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BCryptCreateHash: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BCryptCreateMultiHash: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BCryptDecrypt: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BCryptDeleteContext: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    BCryptDeriveKey: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BCryptDeriveKeyCapi: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BCryptDeriveKeyPBKDF2: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BCryptDestroyHash: { args: [FFIType.u64], returns: FFIType.i32 },
    BCryptDestroyKey: { args: [FFIType.u64], returns: FFIType.i32 },
    BCryptDestroySecret: { args: [FFIType.u64], returns: FFIType.i32 },
    BCryptDuplicateHash: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BCryptDuplicateKey: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BCryptEncrypt: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BCryptEnumAlgorithms: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BCryptEnumContextFunctionProviders: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BCryptEnumContextFunctions: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BCryptEnumContexts: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BCryptEnumProviders: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BCryptEnumRegisteredProviders: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BCryptExportKey: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BCryptFinalizeKeyPair: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    BCryptFinishHash: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BCryptFreeBuffer: { args: [FFIType.ptr], returns: FFIType.void },
    BCryptGenRandom: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BCryptGenerateKeyPair: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BCryptGenerateSymmetricKey: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BCryptGetFipsAlgorithmMode: { args: [FFIType.ptr], returns: FFIType.i32 },
    BCryptGetProperty: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BCryptHash: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BCryptHashData: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BCryptImportKey: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BCryptImportKeyPair: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BCryptKeyDerivation: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BCryptOpenAlgorithmProvider: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BCryptProcessMultiOperations: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BCryptQueryContextConfiguration: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BCryptQueryContextFunctionConfiguration: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BCryptQueryContextFunctionProperty: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BCryptQueryProviderRegistration: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BCryptRegisterConfigChangeNotify: { args: [FFIType.ptr], returns: FFIType.i32 },
    BCryptRemoveContextFunction: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    BCryptResolveProviders: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BCryptSecretAgreement: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BCryptSetContextFunctionProperty: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    BCryptSetProperty: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BCryptSignHash: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BCryptUnregisterConfigChangeNotify: { args: [FFIType.u64], returns: FFIType.i32 },
    BCryptVerifySignature: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptaddcontextfunction
  public static BCryptAddContextFunction(dwTable: ULONG, pszContext: LPCWSTR, dwInterface: ULONG, pszFunction: LPCWSTR, dwPosition: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptAddContextFunction')(dwTable, pszContext, dwInterface, pszFunction, dwPosition);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptclosealgorithmprovider
  public static BCryptCloseAlgorithmProvider(hAlgorithm: BCRYPT_ALG_HANDLE, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptCloseAlgorithmProvider')(hAlgorithm, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptconfigurecontext
  public static BCryptConfigureContext(dwTable: ULONG, pszContext: LPCWSTR, pConfig: PCRYPT_CONTEXT_CONFIG): NTSTATUS {
    return Bcrypt.Load('BCryptConfigureContext')(dwTable, pszContext, pConfig);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptconfigurecontextfunction
  public static BCryptConfigureContextFunction(dwTable: ULONG, pszContext: LPCWSTR, dwInterface: ULONG, pszFunction: LPCWSTR, pConfig: PCRYPT_CONTEXT_FUNCTION_CONFIG): NTSTATUS {
    return Bcrypt.Load('BCryptConfigureContextFunction')(dwTable, pszContext, dwInterface, pszFunction, pConfig);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptcreatecontext
  public static BCryptCreateContext(dwTable: ULONG, pszContext: LPCWSTR, pConfig: PCRYPT_CONTEXT_CONFIG | NULL): NTSTATUS {
    return Bcrypt.Load('BCryptCreateContext')(dwTable, pszContext, pConfig);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptcreatehash
  public static BCryptCreateHash(hAlgorithm: BCRYPT_ALG_HANDLE, phHash: PBCRYPT_HASH_HANDLE, pbHashObject: PUCHAR | NULL, cbHashObject: ULONG, pbSecret: PUCHAR | NULL, cbSecret: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptCreateHash')(hAlgorithm, phHash, pbHashObject, cbHashObject, pbSecret, cbSecret, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptcreatemultihash
  public static BCryptCreateMultiHash(hAlgorithm: BCRYPT_ALG_HANDLE, phHash: PBCRYPT_HASH_HANDLE, nHashes: ULONG, pbHashObject: PUCHAR | NULL, cbHashObject: ULONG, pbSecret: PUCHAR | NULL, cbSecret: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptCreateMultiHash')(hAlgorithm, phHash, nHashes, pbHashObject, cbHashObject, pbSecret, cbSecret, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptdecrypt
  public static BCryptDecrypt(hKey: BCRYPT_KEY_HANDLE, pbInput: PUCHAR | NULL, cbInput: ULONG, pPaddingInfo: PVOID | NULL, pbIV: PUCHAR | NULL, cbIV: ULONG, pbOutput: PUCHAR | NULL, cbOutput: ULONG, pcbResult: PULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptDecrypt')(hKey, pbInput, cbInput, pPaddingInfo, pbIV, cbIV, pbOutput, cbOutput, pcbResult, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptdeletecontext
  public static BCryptDeleteContext(dwTable: ULONG, pszContext: LPCWSTR): NTSTATUS {
    return Bcrypt.Load('BCryptDeleteContext')(dwTable, pszContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptderivekey
  public static BCryptDeriveKey(hSharedSecret: BCRYPT_SECRET_HANDLE, pwszKDF: LPCWSTR, pParameterList: PBCryptBufferDesc | NULL, pbDerivedKey: PUCHAR | NULL, cbDerivedKey: ULONG, pcbResult: PULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptDeriveKey')(hSharedSecret, pwszKDF, pParameterList, pbDerivedKey, cbDerivedKey, pcbResult, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptderivekeycapi
  public static BCryptDeriveKeyCapi(hHash: BCRYPT_HASH_HANDLE, hTargetAlg: BCRYPT_ALG_HANDLE | 0n, pbDerivedKey: PUCHAR, cbDerivedKey: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptDeriveKeyCapi')(hHash, hTargetAlg, pbDerivedKey, cbDerivedKey, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptderivekeypbkdf2
  public static BCryptDeriveKeyPBKDF2(hPrf: BCRYPT_ALG_HANDLE, pbPassword: PUCHAR | NULL, cbPassword: ULONG, pbSalt: PUCHAR | NULL, cbSalt: ULONG, cIterations: ULONGLONG, pbDerivedKey: PUCHAR, cbDerivedKey: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptDeriveKeyPBKDF2')(hPrf, pbPassword, cbPassword, pbSalt, cbSalt, cIterations, pbDerivedKey, cbDerivedKey, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptdestroyhash
  public static BCryptDestroyHash(hHash: BCRYPT_HASH_HANDLE): NTSTATUS {
    return Bcrypt.Load('BCryptDestroyHash')(hHash);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptdestroykey
  public static BCryptDestroyKey(hKey: BCRYPT_KEY_HANDLE): NTSTATUS {
    return Bcrypt.Load('BCryptDestroyKey')(hKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptdestroysecret
  public static BCryptDestroySecret(hSecret: BCRYPT_SECRET_HANDLE): NTSTATUS {
    return Bcrypt.Load('BCryptDestroySecret')(hSecret);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptduplicatehash
  public static BCryptDuplicateHash(hHash: BCRYPT_HASH_HANDLE, phNewHash: PBCRYPT_HASH_HANDLE, pbHashObject: PUCHAR | NULL, cbHashObject: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptDuplicateHash')(hHash, phNewHash, pbHashObject, cbHashObject, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptduplicatekey
  public static BCryptDuplicateKey(hKey: BCRYPT_KEY_HANDLE, phNewKey: PBCRYPT_KEY_HANDLE, pbKeyObject: PUCHAR | NULL, cbKeyObject: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptDuplicateKey')(hKey, phNewKey, pbKeyObject, cbKeyObject, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptencrypt
  public static BCryptEncrypt(hKey: BCRYPT_KEY_HANDLE, pbInput: PUCHAR | NULL, cbInput: ULONG, pPaddingInfo: PVOID | NULL, pbIV: PUCHAR | NULL, cbIV: ULONG, pbOutput: PUCHAR | NULL, cbOutput: ULONG, pcbResult: PULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptEncrypt')(hKey, pbInput, cbInput, pPaddingInfo, pbIV, cbIV, pbOutput, cbOutput, pcbResult, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptenumalgorithms
  public static BCryptEnumAlgorithms(dwAlgOperations: ULONG, pAlgCount: PULONG, ppAlgList: PPBCRYPT_ALGORITHM_IDENTIFIER, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptEnumAlgorithms')(dwAlgOperations, pAlgCount, ppAlgList, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptenumcontextfunctionproviders
  public static BCryptEnumContextFunctionProviders(dwTable: ULONG, pszContext: LPCWSTR, dwInterface: ULONG, pszFunction: LPCWSTR, pcbBuffer: PULONG, ppBuffer: PPCRYPT_CONTEXT_FUNCTION_PROVIDERS): NTSTATUS {
    return Bcrypt.Load('BCryptEnumContextFunctionProviders')(dwTable, pszContext, dwInterface, pszFunction, pcbBuffer, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptenumcontextfunctions
  public static BCryptEnumContextFunctions(dwTable: ULONG, pszContext: LPCWSTR, dwInterface: ULONG, pcbBuffer: PULONG, ppBuffer: PPCRYPT_CONTEXT_FUNCTIONS): NTSTATUS {
    return Bcrypt.Load('BCryptEnumContextFunctions')(dwTable, pszContext, dwInterface, pcbBuffer, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptenumcontexts
  public static BCryptEnumContexts(dwTable: ULONG, pcbBuffer: PULONG, ppBuffer: PPCRYPT_CONTEXTS): NTSTATUS {
    return Bcrypt.Load('BCryptEnumContexts')(dwTable, pcbBuffer, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptenumproviders
  public static BCryptEnumProviders(pszAlgId: LPCWSTR, pImplCount: PULONG, ppImplList: PPBCRYPT_PROVIDER_NAME, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptEnumProviders')(pszAlgId, pImplCount, ppImplList, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptenumregisteredproviders
  public static BCryptEnumRegisteredProviders(pcbBuffer: PULONG, ppBuffer: PPCRYPT_PROVIDERS): NTSTATUS {
    return Bcrypt.Load('BCryptEnumRegisteredProviders')(pcbBuffer, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptexportkey
  public static BCryptExportKey(hKey: BCRYPT_KEY_HANDLE, hExportKey: BCRYPT_KEY_HANDLE | 0n, pszBlobType: LPCWSTR, pbOutput: PUCHAR | NULL, cbOutput: ULONG, pcbResult: PULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptExportKey')(hKey, hExportKey, pszBlobType, pbOutput, cbOutput, pcbResult, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptfinalizekeypair
  public static BCryptFinalizeKeyPair(hKey: BCRYPT_KEY_HANDLE, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptFinalizeKeyPair')(hKey, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptfinishhash
  public static BCryptFinishHash(hHash: BCRYPT_HASH_HANDLE, pbOutput: PUCHAR, cbOutput: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptFinishHash')(hHash, pbOutput, cbOutput, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptfreebuffer
  public static BCryptFreeBuffer(pvBuffer: PVOID): void {
    return Bcrypt.Load('BCryptFreeBuffer')(pvBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptgenrandom
  public static BCryptGenRandom(hAlgorithm: BCRYPT_ALG_HANDLE | 0n, pbBuffer: PUCHAR, cbBuffer: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptGenRandom')(hAlgorithm, pbBuffer, cbBuffer, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptgeneratekeypair
  public static BCryptGenerateKeyPair(hAlgorithm: BCRYPT_ALG_HANDLE, phKey: PBCRYPT_KEY_HANDLE, dwLength: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptGenerateKeyPair')(hAlgorithm, phKey, dwLength, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptgeneratesymmetrickey
  public static BCryptGenerateSymmetricKey(hAlgorithm: BCRYPT_ALG_HANDLE, phKey: PBCRYPT_KEY_HANDLE, pbKeyObject: PUCHAR | NULL, cbKeyObject: ULONG, pbSecret: PUCHAR, cbSecret: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptGenerateSymmetricKey')(hAlgorithm, phKey, pbKeyObject, cbKeyObject, pbSecret, cbSecret, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptgetfipsalgorithmmode
  public static BCryptGetFipsAlgorithmMode(pfEnabled: PBOOLEAN): NTSTATUS {
    return Bcrypt.Load('BCryptGetFipsAlgorithmMode')(pfEnabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptgetproperty
  public static BCryptGetProperty(hObject: BCRYPT_HANDLE, pszProperty: LPCWSTR, pbOutput: PUCHAR | NULL, cbOutput: ULONG, pcbResult: PULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptGetProperty')(hObject, pszProperty, pbOutput, cbOutput, pcbResult, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcrypthash
  public static BCryptHash(hAlgorithm: BCRYPT_ALG_HANDLE, pbSecret: PUCHAR | NULL, cbSecret: ULONG, pbInput: PUCHAR, cbInput: ULONG, pbOutput: PUCHAR, cbOutput: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptHash')(hAlgorithm, pbSecret, cbSecret, pbInput, cbInput, pbOutput, cbOutput);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcrypthashdata
  public static BCryptHashData(hHash: BCRYPT_HASH_HANDLE, pbInput: PUCHAR, cbInput: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptHashData')(hHash, pbInput, cbInput, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptimportkey
  public static BCryptImportKey(hAlgorithm: BCRYPT_ALG_HANDLE, hImportKey: BCRYPT_KEY_HANDLE | 0n, pszBlobType: LPCWSTR, phKey: PBCRYPT_KEY_HANDLE, pbKeyObject: PUCHAR | NULL, cbKeyObject: ULONG, pbInput: PUCHAR, cbInput: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptImportKey')(hAlgorithm, hImportKey, pszBlobType, phKey, pbKeyObject, cbKeyObject, pbInput, cbInput, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptimportkeypair
  public static BCryptImportKeyPair(hAlgorithm: BCRYPT_ALG_HANDLE, hImportKey: BCRYPT_KEY_HANDLE | 0n, pszBlobType: LPCWSTR, phKey: PBCRYPT_KEY_HANDLE, pbInput: PUCHAR, cbInput: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptImportKeyPair')(hAlgorithm, hImportKey, pszBlobType, phKey, pbInput, cbInput, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptkeyderivation
  public static BCryptKeyDerivation(hKey: BCRYPT_KEY_HANDLE, pParameterList: PBCryptBufferDesc | NULL, pbDerivedKey: PUCHAR, cbDerivedKey: ULONG, pcbResult: PULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptKeyDerivation')(hKey, pParameterList, pbDerivedKey, cbDerivedKey, pcbResult, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptopenalgorithmprovider
  public static BCryptOpenAlgorithmProvider(phAlgorithm: PBCRYPT_ALG_HANDLE, pszAlgId: LPCWSTR, pszImplementation: LPCWSTR | NULL, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptOpenAlgorithmProvider')(phAlgorithm, pszAlgId, pszImplementation, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptprocessmultioperations
  public static BCryptProcessMultiOperations(hObject: BCRYPT_HANDLE, operationType: BCRYPT_MULTI_OPERATION_TYPE, pOperations: PVOID, cbOperations: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptProcessMultiOperations')(hObject, operationType, pOperations, cbOperations, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptquerycontextconfiguration
  public static BCryptQueryContextConfiguration(dwTable: ULONG, pszContext: LPCWSTR, pcbBuffer: PULONG, ppBuffer: PPCRYPT_CONTEXT_CONFIG): NTSTATUS {
    return Bcrypt.Load('BCryptQueryContextConfiguration')(dwTable, pszContext, pcbBuffer, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptquerycontextfunctionconfiguration
  public static BCryptQueryContextFunctionConfiguration(dwTable: ULONG, pszContext: LPCWSTR, dwInterface: ULONG, pszFunction: LPCWSTR, pcbBuffer: PULONG, ppBuffer: PPCRYPT_CONTEXT_FUNCTION_CONFIG): NTSTATUS {
    return Bcrypt.Load('BCryptQueryContextFunctionConfiguration')(dwTable, pszContext, dwInterface, pszFunction, pcbBuffer, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptquerycontextfunctionproperty
  public static BCryptQueryContextFunctionProperty(dwTable: ULONG, pszContext: LPCWSTR, dwInterface: ULONG, pszFunction: LPCWSTR, pszProperty: LPCWSTR, pcbValue: PULONG, ppbValue: PPUCHAR): NTSTATUS {
    return Bcrypt.Load('BCryptQueryContextFunctionProperty')(dwTable, pszContext, dwInterface, pszFunction, pszProperty, pcbValue, ppbValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptqueryproviderregistration
  public static BCryptQueryProviderRegistration(pszProvider: LPCWSTR, dwMode: ULONG, dwInterface: ULONG, pcbBuffer: PULONG, ppBuffer: PPCRYPT_PROVIDER_REG): NTSTATUS {
    return Bcrypt.Load('BCryptQueryProviderRegistration')(pszProvider, dwMode, dwInterface, pcbBuffer, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptregisterconfigchangenotify
  public static BCryptRegisterConfigChangeNotify(phEvent: PHANDLE): NTSTATUS {
    return Bcrypt.Load('BCryptRegisterConfigChangeNotify')(phEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptremovecontextfunction
  public static BCryptRemoveContextFunction(dwTable: ULONG, pszContext: LPCWSTR, dwInterface: ULONG, pszFunction: LPCWSTR): NTSTATUS {
    return Bcrypt.Load('BCryptRemoveContextFunction')(dwTable, pszContext, dwInterface, pszFunction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptresolveproviders
  public static BCryptResolveProviders(pszContext: LPCWSTR | NULL, dwInterface: ULONG, pszFunction: LPCWSTR | NULL, pszProvider: LPCWSTR | NULL, dwMode: ULONG, dwFlags: ULONG, pcbBuffer: PULONG, ppBuffer: PPCRYPT_PROVIDER_REFS): NTSTATUS {
    return Bcrypt.Load('BCryptResolveProviders')(pszContext, dwInterface, pszFunction, pszProvider, dwMode, dwFlags, pcbBuffer, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptsecretagreement
  public static BCryptSecretAgreement(hPrivKey: BCRYPT_KEY_HANDLE, hPubKey: BCRYPT_KEY_HANDLE, phAgreedSecret: PBCRYPT_SECRET_HANDLE, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptSecretAgreement')(hPrivKey, hPubKey, phAgreedSecret, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptsetcontextfunctionproperty
  public static BCryptSetContextFunctionProperty(dwTable: ULONG, pszContext: LPCWSTR, dwInterface: ULONG, pszFunction: LPCWSTR, pszProperty: LPCWSTR, cbValue: ULONG, pbValue: PUCHAR | NULL): NTSTATUS {
    return Bcrypt.Load('BCryptSetContextFunctionProperty')(dwTable, pszContext, dwInterface, pszFunction, pszProperty, cbValue, pbValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptsetproperty
  public static BCryptSetProperty(hObject: BCRYPT_HANDLE, pszProperty: LPCWSTR, pbInput: PUCHAR, cbInput: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptSetProperty')(hObject, pszProperty, pbInput, cbInput, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptsignhash
  public static BCryptSignHash(hKey: BCRYPT_KEY_HANDLE, pPaddingInfo: PVOID | NULL, pbInput: PUCHAR, cbInput: ULONG, pbOutput: PUCHAR | NULL, cbOutput: ULONG, pcbResult: PULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptSignHash')(hKey, pPaddingInfo, pbInput, cbInput, pbOutput, cbOutput, pcbResult, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptunregisterconfigchangenotify
  public static BCryptUnregisterConfigChangeNotify(hEvent: HANDLE): NTSTATUS {
    return Bcrypt.Load('BCryptUnregisterConfigChangeNotify')(hEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptverifysignature
  public static BCryptVerifySignature(hKey: BCRYPT_KEY_HANDLE, pPaddingInfo: PVOID | NULL, pbHash: PUCHAR, cbHash: ULONG, pbSignature: PUCHAR, cbSignature: ULONG, dwFlags: ULONG): NTSTATUS {
    return Bcrypt.Load('BCryptVerifySignature')(hKey, pPaddingInfo, pbHash, cbHash, pbSignature, cbSignature, dwFlags);
  }
}

export default Bcrypt;
