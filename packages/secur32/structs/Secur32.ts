import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOLEAN,
  EXTENDED_NAME_FORMAT,
  HANDLE,
  LPCSTR,
  LPCWSTR,
  LPSTR,
  LPVOID,
  LPWSTR,
  NTSTATUS,
  NULL,
  PBOOLEAN,
  PCredHandle,
  PCtxtHandle,
  PHANDLE,
  PLSA_OPERATIONAL_MODE,
  PLSA_STRING,
  PLUID,
  PNTSTATUS,
  POLICY_NOTIFICATION_INFORMATION_CLASS,
  PSecBuffer,
  PSecBufferDesc,
  PSecPkgInfoA,
  PSecPkgInfoW,
  PSecurityFunctionTableA,
  PSecurityFunctionTableW,
  PSEC_WINNT_AUTH_IDENTITY_OPAQUE,
  PSECURITY_LOGON_SESSION_DATA,
  PSECURITY_PACKAGE_OPTIONS,
  PSecurityUserData,
  PTOKEN_GROUPS,
  PTOKEN_SOURCE,
  PTimeStamp,
  PUCHAR,
  PULONG,
  PVOID,
  QUOTA_LIMITS,
  SEC_GET_KEY_FN,
  SECURITY_LOGON_TYPE,
  SECURITY_STATUS,
  ULONG,
  VOID,
} from '../types/Secur32';

/**
 * Thin, lazy-loaded FFI bindings for `secur32.dll`.
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
 * import Secur32 from './structs/Secur32';
 *
 * // Lazy: bind on first call
 * const table = Secur32.InitSecurityInterfaceW();
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Secur32.Preload(['InitSecurityInterfaceW', 'FreeContextBuffer']);
 * ```
 */
class Secur32 extends Win32 {
  protected static override name = 'secur32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    AcceptSecurityContext: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AcquireCredentialsHandleA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AcquireCredentialsHandleW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddCredentialsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddCredentialsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddSecurityPackageA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddSecurityPackageW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ApplyControlToken: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ChangeAccountPasswordA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u8, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ChangeAccountPasswordW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u8, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CompleteAuthToken: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DecryptMessage: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    DeleteSecurityContext: { args: [FFIType.ptr], returns: FFIType.i32 },
    DeleteSecurityPackageA: { args: [FFIType.ptr], returns: FFIType.i32 },
    DeleteSecurityPackageW: { args: [FFIType.ptr], returns: FFIType.i32 },
    EncryptMessage: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    EnumerateSecurityPackagesA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumerateSecurityPackagesW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ExportSecurityContext: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FreeContextBuffer: { args: [FFIType.ptr], returns: FFIType.i32 },
    FreeCredentialsHandle: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetComputerObjectNameA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    GetComputerObjectNameW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    GetSecurityUserInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetUserNameExA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    GetUserNameExW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    ImpersonateSecurityContext: { args: [FFIType.ptr], returns: FFIType.i32 },
    ImportSecurityContextA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ImportSecurityContextW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    InitSecurityInterfaceA: { args: [], returns: FFIType.ptr },
    InitSecurityInterfaceW: { args: [], returns: FFIType.ptr },
    InitializeSecurityContextA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InitializeSecurityContextW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaCallAuthenticationPackage: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaConnectUntrusted: { args: [FFIType.ptr], returns: FFIType.i32 },
    LsaDeregisterLogonProcess: { args: [FFIType.u64], returns: FFIType.i32 },
    LsaEnumerateLogonSessions: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaFreeReturnBuffer: { args: [FFIType.ptr], returns: FFIType.i32 },
    LsaGetLogonSessionData: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaLogonUser: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaLookupAuthenticationPackage: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaRegisterLogonProcess: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaRegisterPolicyChangeNotification: { args: [FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    LsaUnregisterPolicyChangeNotification: { args: [FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    MakeSignature: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    QueryContextAttributesA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryContextAttributesW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryCredentialsAttributesA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryCredentialsAttributesW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QuerySecurityContextToken: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    QuerySecurityPackageInfoA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    QuerySecurityPackageInfoW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RevertSecurityContext: { args: [FFIType.ptr], returns: FFIType.i32 },
    SaslAcceptSecurityContext: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaslEnumerateProfilesA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaslEnumerateProfilesW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaslGetContextOption: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SaslGetProfilePackageA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaslGetProfilePackageW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaslIdentifyPackageA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaslIdentifyPackageW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaslInitializeSecurityContextA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaslInitializeSecurityContextW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaslSetContextOption: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SealMessage: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetContextAttributesA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetContextAttributesW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetCredentialsAttributesA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetCredentialsAttributesW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SspiCompareAuthIdentities: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SspiCopyAuthIdentity: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SspiDecryptAuthIdentity: { args: [FFIType.ptr], returns: FFIType.i32 },
    SspiEncodeAuthIdentityAsStrings: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SspiEncodeStringsAsAuthIdentity: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SspiEncryptAuthIdentity: { args: [FFIType.ptr], returns: FFIType.i32 },
    SspiExcludePackage: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SspiFreeAuthIdentity: { args: [FFIType.ptr], returns: FFIType.void },
    SspiGetTargetHostName: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SspiIsAuthIdentityEncrypted: { args: [FFIType.ptr], returns: FFIType.u8 },
    SspiLocalFree: { args: [FFIType.ptr], returns: FFIType.void },
    SspiMarshalAuthIdentity: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SspiPrepareForCredRead: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SspiPrepareForCredWrite: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SspiUnmarshalAuthIdentity: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SspiValidateAuthIdentity: { args: [FFIType.ptr], returns: FFIType.i32 },
    SspiZeroAuthIdentity: { args: [FFIType.ptr], returns: FFIType.void },
    TranslateNameA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    TranslateNameW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    UnsealMessage: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VerifySignature: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-acceptsecuritycontext
  public static AcceptSecurityContext(
    phCredential: PCredHandle | NULL,
    phContext: PCtxtHandle | NULL,
    pInput: PSecBufferDesc | NULL,
    fContextReq: ULONG,
    TargetDataRep: ULONG,
    phNewContext: PCtxtHandle | NULL,
    pOutput: PSecBufferDesc | NULL,
    pfContextAttr: PULONG,
    ptsExpiry: PTimeStamp | NULL,
  ): SECURITY_STATUS {
    return Secur32.Load('AcceptSecurityContext')(phCredential, phContext, pInput, fContextReq, TargetDataRep, phNewContext, pOutput, pfContextAttr, ptsExpiry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-acquirecredentialshandlea
  public static AcquireCredentialsHandleA(
    pszPrincipal: LPSTR | NULL,
    pszPackage: LPSTR,
    fCredentialUse: ULONG,
    pvLogonId: PLUID | NULL,
    pAuthData: PVOID | NULL,
    pGetKeyFn: SEC_GET_KEY_FN | NULL,
    pvGetKeyArgument: PVOID | NULL,
    phCredential: PCredHandle,
    ptsExpiry: PTimeStamp | NULL,
  ): SECURITY_STATUS {
    return Secur32.Load('AcquireCredentialsHandleA')(pszPrincipal, pszPackage, fCredentialUse, pvLogonId, pAuthData, pGetKeyFn, pvGetKeyArgument, phCredential, ptsExpiry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-acquirecredentialshandlew
  public static AcquireCredentialsHandleW(
    pszPrincipal: LPWSTR | NULL,
    pszPackage: LPWSTR,
    fCredentialUse: ULONG,
    pvLogonId: PLUID | NULL,
    pAuthData: PVOID | NULL,
    pGetKeyFn: SEC_GET_KEY_FN | NULL,
    pvGetKeyArgument: PVOID | NULL,
    phCredential: PCredHandle,
    ptsExpiry: PTimeStamp | NULL,
  ): SECURITY_STATUS {
    return Secur32.Load('AcquireCredentialsHandleW')(pszPrincipal, pszPackage, fCredentialUse, pvLogonId, pAuthData, pGetKeyFn, pvGetKeyArgument, phCredential, ptsExpiry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-addcredentialsa
  public static AddCredentialsA(
    hCredentials: PCredHandle,
    pszPrincipal: LPSTR | NULL,
    pszPackage: LPSTR,
    fCredentialUse: ULONG,
    pAuthData: PVOID | NULL,
    pGetKeyFn: SEC_GET_KEY_FN | NULL,
    pvGetKeyArgument: PVOID | NULL,
    ptsExpiry: PTimeStamp | NULL,
  ): SECURITY_STATUS {
    return Secur32.Load('AddCredentialsA')(hCredentials, pszPrincipal, pszPackage, fCredentialUse, pAuthData, pGetKeyFn, pvGetKeyArgument, ptsExpiry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-addcredentialsw
  public static AddCredentialsW(
    hCredentials: PCredHandle,
    pszPrincipal: LPWSTR | NULL,
    pszPackage: LPWSTR,
    fCredentialUse: ULONG,
    pAuthData: PVOID | NULL,
    pGetKeyFn: SEC_GET_KEY_FN | NULL,
    pvGetKeyArgument: PVOID | NULL,
    ptsExpiry: PTimeStamp | NULL,
  ): SECURITY_STATUS {
    return Secur32.Load('AddCredentialsW')(hCredentials, pszPrincipal, pszPackage, fCredentialUse, pAuthData, pGetKeyFn, pvGetKeyArgument, ptsExpiry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-addsecuritypackagea
  public static AddSecurityPackageA(pszPackageName: LPSTR, pOptions: PSECURITY_PACKAGE_OPTIONS | NULL): SECURITY_STATUS {
    return Secur32.Load('AddSecurityPackageA')(pszPackageName, pOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-addsecuritypackagew
  public static AddSecurityPackageW(pszPackageName: LPWSTR, pOptions: PSECURITY_PACKAGE_OPTIONS | NULL): SECURITY_STATUS {
    return Secur32.Load('AddSecurityPackageW')(pszPackageName, pOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-applycontroltoken
  public static ApplyControlToken(phContext: PCtxtHandle, pInput: PSecBufferDesc): SECURITY_STATUS {
    return Secur32.Load('ApplyControlToken')(phContext, pInput);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-changeaccountpassworda
  public static ChangeAccountPasswordA(pszPackageName: LPSTR, pszDomainName: LPSTR, pszAccountName: LPSTR, pszOldPassword: LPSTR, pszNewPassword: LPSTR, bImpersonating: BOOLEAN, dwReserved: ULONG, pOutput: PSecBufferDesc): SECURITY_STATUS {
    return Secur32.Load('ChangeAccountPasswordA')(pszPackageName, pszDomainName, pszAccountName, pszOldPassword, pszNewPassword, bImpersonating, dwReserved, pOutput);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-changeaccountpasswordw
  public static ChangeAccountPasswordW(
    pszPackageName: LPWSTR,
    pszDomainName: LPWSTR,
    pszAccountName: LPWSTR,
    pszOldPassword: LPWSTR,
    pszNewPassword: LPWSTR,
    bImpersonating: BOOLEAN,
    dwReserved: ULONG,
    pOutput: PSecBufferDesc,
  ): SECURITY_STATUS {
    return Secur32.Load('ChangeAccountPasswordW')(pszPackageName, pszDomainName, pszAccountName, pszOldPassword, pszNewPassword, bImpersonating, dwReserved, pOutput);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-completeauthtoken
  public static CompleteAuthToken(phContext: PCtxtHandle, pToken: PSecBufferDesc): SECURITY_STATUS {
    return Secur32.Load('CompleteAuthToken')(phContext, pToken);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-decryptmessage
  public static DecryptMessage(phContext: PCtxtHandle, pMessage: PSecBufferDesc, MessageSeqNo: ULONG, pfQOP: PULONG | NULL): SECURITY_STATUS {
    return Secur32.Load('DecryptMessage')(phContext, pMessage, MessageSeqNo, pfQOP);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-deletesecuritycontext
  public static DeleteSecurityContext(phContext: PCtxtHandle): SECURITY_STATUS {
    return Secur32.Load('DeleteSecurityContext')(phContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-deletesecuritypackagea
  public static DeleteSecurityPackageA(pszPackageName: LPSTR): SECURITY_STATUS {
    return Secur32.Load('DeleteSecurityPackageA')(pszPackageName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-deletesecuritypackagew
  public static DeleteSecurityPackageW(pszPackageName: LPWSTR): SECURITY_STATUS {
    return Secur32.Load('DeleteSecurityPackageW')(pszPackageName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-encryptmessage
  public static EncryptMessage(phContext: PCtxtHandle, fQOP: ULONG, pMessage: PSecBufferDesc, MessageSeqNo: ULONG): SECURITY_STATUS {
    return Secur32.Load('EncryptMessage')(phContext, fQOP, pMessage, MessageSeqNo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-enumeratesecuritypackagesa
  public static EnumerateSecurityPackagesA(pcPackages: PULONG, ppPackageInfo: PSecPkgInfoA): SECURITY_STATUS {
    return Secur32.Load('EnumerateSecurityPackagesA')(pcPackages, ppPackageInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-enumeratesecuritypackagesw
  public static EnumerateSecurityPackagesW(pcPackages: PULONG, ppPackageInfo: PSecPkgInfoW): SECURITY_STATUS {
    return Secur32.Load('EnumerateSecurityPackagesW')(pcPackages, ppPackageInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-exportsecuritycontext
  public static ExportSecurityContext(phContext: PCtxtHandle, fFlags: ULONG, pPackedContext: PSecBuffer, pToken: PHANDLE | NULL): SECURITY_STATUS {
    return Secur32.Load('ExportSecurityContext')(phContext, fFlags, pPackedContext, pToken);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-freecontextbuffer
  public static FreeContextBuffer(pvContextBuffer: PVOID): SECURITY_STATUS {
    return Secur32.Load('FreeContextBuffer')(pvContextBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-freecredentialshandle
  public static FreeCredentialsHandle(phCredential: PCredHandle): SECURITY_STATUS {
    return Secur32.Load('FreeCredentialsHandle')(phCredential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/secext/nf-secext-getcomputerobjectnamea
  public static GetComputerObjectNameA(NameFormat: EXTENDED_NAME_FORMAT, lpNameBuffer: LPSTR | NULL, nSize: PULONG): BOOLEAN {
    return Secur32.Load('GetComputerObjectNameA')(NameFormat, lpNameBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/secext/nf-secext-getcomputerobjectnamew
  public static GetComputerObjectNameW(NameFormat: EXTENDED_NAME_FORMAT, lpNameBuffer: LPWSTR | NULL, nSize: PULONG): BOOLEAN {
    return Secur32.Load('GetComputerObjectNameW')(NameFormat, lpNameBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-getsecurityuserinfo
  public static GetSecurityUserInfo(LogonId: PLUID | NULL, Flags: ULONG, UserInformation: PSecurityUserData): NTSTATUS {
    return Secur32.Load('GetSecurityUserInfo')(LogonId, Flags, UserInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/secext/nf-secext-getusernameexa
  public static GetUserNameExA(NameFormat: EXTENDED_NAME_FORMAT, lpNameBuffer: LPSTR | NULL, nSize: PULONG): BOOLEAN {
    return Secur32.Load('GetUserNameExA')(NameFormat, lpNameBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/secext/nf-secext-getusernameexw
  public static GetUserNameExW(NameFormat: EXTENDED_NAME_FORMAT, lpNameBuffer: LPWSTR | NULL, nSize: PULONG): BOOLEAN {
    return Secur32.Load('GetUserNameExW')(NameFormat, lpNameBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-impersonatesecuritycontext
  public static ImpersonateSecurityContext(phContext: PCtxtHandle): SECURITY_STATUS {
    return Secur32.Load('ImpersonateSecurityContext')(phContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-importsecuritycontexta
  public static ImportSecurityContextA(pszPackage: LPSTR, pPackedContext: PSecBuffer, Token: HANDLE | 0n, phContext: PCtxtHandle): SECURITY_STATUS {
    return Secur32.Load('ImportSecurityContextA')(pszPackage, pPackedContext, Token, phContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-importsecuritycontextw
  public static ImportSecurityContextW(pszPackage: LPWSTR, pPackedContext: PSecBuffer, Token: HANDLE | 0n, phContext: PCtxtHandle): SECURITY_STATUS {
    return Secur32.Load('ImportSecurityContextW')(pszPackage, pPackedContext, Token, phContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-initsecurityinterfacea
  public static InitSecurityInterfaceA(): PSecurityFunctionTableA {
    return Secur32.Load('InitSecurityInterfaceA')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-initsecurityinterfacew
  public static InitSecurityInterfaceW(): PSecurityFunctionTableW {
    return Secur32.Load('InitSecurityInterfaceW')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-initializesecuritycontexta
  public static InitializeSecurityContextA(
    phCredential: PCredHandle | NULL,
    phContext: PCtxtHandle | NULL,
    pszTargetName: LPSTR | NULL,
    fContextReq: ULONG,
    Reserved1: ULONG,
    TargetDataRep: ULONG,
    pInput: PSecBufferDesc | NULL,
    Reserved2: ULONG,
    phNewContext: PCtxtHandle | NULL,
    pOutput: PSecBufferDesc,
    pfContextAttr: PULONG,
    ptsExpiry: PTimeStamp | NULL,
  ): SECURITY_STATUS {
    return Secur32.Load('InitializeSecurityContextA')(phCredential, phContext, pszTargetName, fContextReq, Reserved1, TargetDataRep, pInput, Reserved2, phNewContext, pOutput, pfContextAttr, ptsExpiry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-initializesecuritycontextw
  public static InitializeSecurityContextW(
    phCredential: PCredHandle | NULL,
    phContext: PCtxtHandle | NULL,
    pszTargetName: LPWSTR | NULL,
    fContextReq: ULONG,
    Reserved1: ULONG,
    TargetDataRep: ULONG,
    pInput: PSecBufferDesc | NULL,
    Reserved2: ULONG,
    phNewContext: PCtxtHandle | NULL,
    pOutput: PSecBufferDesc,
    pfContextAttr: PULONG,
    ptsExpiry: PTimeStamp | NULL,
  ): SECURITY_STATUS {
    return Secur32.Load('InitializeSecurityContextW')(phCredential, phContext, pszTargetName, fContextReq, Reserved1, TargetDataRep, pInput, Reserved2, phNewContext, pOutput, pfContextAttr, ptsExpiry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsacallauthenticationpackage
  public static LsaCallAuthenticationPackage(
    LsaHandle: HANDLE,
    AuthenticationPackage: ULONG,
    ProtocolSubmitBuffer: PVOID,
    SubmitBufferLength: ULONG,
    ProtocolReturnBuffer: PVOID,
    ReturnBufferLength: PULONG,
    ProtocolStatus: PNTSTATUS,
  ): NTSTATUS {
    return Secur32.Load('LsaCallAuthenticationPackage')(LsaHandle, AuthenticationPackage, ProtocolSubmitBuffer, SubmitBufferLength, ProtocolReturnBuffer, ReturnBufferLength, ProtocolStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaconnectuntrusted
  public static LsaConnectUntrusted(LsaHandle: PHANDLE): NTSTATUS {
    return Secur32.Load('LsaConnectUntrusted')(LsaHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaderegisterlogonprocess
  public static LsaDeregisterLogonProcess(LsaHandle: HANDLE): NTSTATUS {
    return Secur32.Load('LsaDeregisterLogonProcess')(LsaHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaenumeratelogonsessions
  public static LsaEnumerateLogonSessions(LogonSessionCount: PULONG, LogonSessionList: PLUID): NTSTATUS {
    return Secur32.Load('LsaEnumerateLogonSessions')(LogonSessionCount, LogonSessionList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsafreereturnbuffer
  public static LsaFreeReturnBuffer(Buffer: PVOID): NTSTATUS {
    return Secur32.Load('LsaFreeReturnBuffer')(Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsagetlogonsessiondata
  public static LsaGetLogonSessionData(LogonId: PLUID, ppLogonSessionData: PSECURITY_LOGON_SESSION_DATA): NTSTATUS {
    return Secur32.Load('LsaGetLogonSessionData')(LogonId, ppLogonSessionData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsalogonuser
  public static LsaLogonUser(
    LsaHandle: HANDLE,
    OriginName: PLSA_STRING,
    LogonType: SECURITY_LOGON_TYPE,
    AuthenticationPackage: ULONG,
    AuthenticationInformation: PVOID,
    AuthenticationInformationLength: ULONG,
    LocalGroups: PTOKEN_GROUPS | NULL,
    SourceContext: PTOKEN_SOURCE,
    ProfileBuffer: PVOID,
    ProfileBufferLength: PULONG,
    LogonId: PLUID,
    Token: PHANDLE,
    Quotas: QUOTA_LIMITS,
    SubStatus: PNTSTATUS,
  ): NTSTATUS {
    return Secur32.Load('LsaLogonUser')(
      LsaHandle,
      OriginName,
      LogonType,
      AuthenticationPackage,
      AuthenticationInformation,
      AuthenticationInformationLength,
      LocalGroups,
      SourceContext,
      ProfileBuffer,
      ProfileBufferLength,
      LogonId,
      Token,
      Quotas,
      SubStatus,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsalookupauthenticationpackage
  public static LsaLookupAuthenticationPackage(LsaHandle: HANDLE, PackageName: PLSA_STRING, AuthenticationPackage: PULONG): NTSTATUS {
    return Secur32.Load('LsaLookupAuthenticationPackage')(LsaHandle, PackageName, AuthenticationPackage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaregisterlogonprocess
  public static LsaRegisterLogonProcess(LogonProcessName: PLSA_STRING, LsaHandle: PHANDLE, SecurityMode: PLSA_OPERATIONAL_MODE): NTSTATUS {
    return Secur32.Load('LsaRegisterLogonProcess')(LogonProcessName, LsaHandle, SecurityMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaregisterpolicychangenotification
  public static LsaRegisterPolicyChangeNotification(InformationClass: POLICY_NOTIFICATION_INFORMATION_CLASS, NotificationEventHandle: HANDLE): NTSTATUS {
    return Secur32.Load('LsaRegisterPolicyChangeNotification')(InformationClass, NotificationEventHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaunregisterpolicychangenotification
  public static LsaUnregisterPolicyChangeNotification(InformationClass: POLICY_NOTIFICATION_INFORMATION_CLASS, NotificationEventHandle: HANDLE): NTSTATUS {
    return Secur32.Load('LsaUnregisterPolicyChangeNotification')(InformationClass, NotificationEventHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-makesignature
  public static MakeSignature(phContext: PCtxtHandle, fQOP: ULONG, pMessage: PSecBufferDesc, MessageSeqNo: ULONG): SECURITY_STATUS {
    return Secur32.Load('MakeSignature')(phContext, fQOP, pMessage, MessageSeqNo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querycontextattributesa
  public static QueryContextAttributesA(phContext: PCtxtHandle, ulAttribute: ULONG, pBuffer: PVOID): SECURITY_STATUS {
    return Secur32.Load('QueryContextAttributesA')(phContext, ulAttribute, pBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querycontextattributesw
  public static QueryContextAttributesW(phContext: PCtxtHandle, ulAttribute: ULONG, pBuffer: PVOID): SECURITY_STATUS {
    return Secur32.Load('QueryContextAttributesW')(phContext, ulAttribute, pBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querycredentialsattributesa
  public static QueryCredentialsAttributesA(phCredential: PCredHandle, ulAttribute: ULONG, pBuffer: PVOID): SECURITY_STATUS {
    return Secur32.Load('QueryCredentialsAttributesA')(phCredential, ulAttribute, pBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querycredentialsattributesw
  public static QueryCredentialsAttributesW(phCredential: PCredHandle, ulAttribute: ULONG, pBuffer: PVOID): SECURITY_STATUS {
    return Secur32.Load('QueryCredentialsAttributesW')(phCredential, ulAttribute, pBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querysecuritycontexttoken
  public static QuerySecurityContextToken(phContext: PCtxtHandle, Token: PHANDLE): SECURITY_STATUS {
    return Secur32.Load('QuerySecurityContextToken')(phContext, Token);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querysecuritypackageinfoa
  public static QuerySecurityPackageInfoA(pszPackageName: LPSTR, ppPackageInfo: PSecPkgInfoA): SECURITY_STATUS {
    return Secur32.Load('QuerySecurityPackageInfoA')(pszPackageName, ppPackageInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querysecuritypackageinfow
  public static QuerySecurityPackageInfoW(pszPackageName: LPWSTR, ppPackageInfo: PSecPkgInfoW): SECURITY_STATUS {
    return Secur32.Load('QuerySecurityPackageInfoW')(pszPackageName, ppPackageInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-revertsecuritycontext
  public static RevertSecurityContext(phContext: PCtxtHandle): SECURITY_STATUS {
    return Secur32.Load('RevertSecurityContext')(phContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslacceptsecuritycontext
  public static SaslAcceptSecurityContext(
    phCredential: PCredHandle | NULL,
    phContext: PCtxtHandle | NULL,
    pInput: PSecBufferDesc | NULL,
    fContextReq: ULONG,
    TargetDataRep: ULONG,
    phNewContext: PCtxtHandle | NULL,
    pOutput: PSecBufferDesc | NULL,
    pfContextAttr: PULONG,
    ptsExpiry: PTimeStamp | NULL,
  ): SECURITY_STATUS {
    return Secur32.Load('SaslAcceptSecurityContext')(phCredential, phContext, pInput, fContextReq, TargetDataRep, phNewContext, pOutput, pfContextAttr, ptsExpiry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslenumerateprofilesa
  public static SaslEnumerateProfilesA(ProfileList: LPSTR, ProfileCount: PULONG): SECURITY_STATUS {
    return Secur32.Load('SaslEnumerateProfilesA')(ProfileList, ProfileCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslenumerateprofilesw
  public static SaslEnumerateProfilesW(ProfileList: LPWSTR, ProfileCount: PULONG): SECURITY_STATUS {
    return Secur32.Load('SaslEnumerateProfilesW')(ProfileList, ProfileCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslgetcontextoption
  public static SaslGetContextOption(ContextHandle: PCtxtHandle, Option: ULONG, Value: PVOID, Size: ULONG, Needed: PULONG | NULL): SECURITY_STATUS {
    return Secur32.Load('SaslGetContextOption')(ContextHandle, Option, Value, Size, Needed);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslgetprofilepackagea
  public static SaslGetProfilePackageA(ProfileName: LPSTR, PackageInfo: PSecPkgInfoA): SECURITY_STATUS {
    return Secur32.Load('SaslGetProfilePackageA')(ProfileName, PackageInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslgetprofilepackagew
  public static SaslGetProfilePackageW(ProfileName: LPWSTR, PackageInfo: PSecPkgInfoW): SECURITY_STATUS {
    return Secur32.Load('SaslGetProfilePackageW')(ProfileName, PackageInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslidentifypackagea
  public static SaslIdentifyPackageA(pInput: PSecBufferDesc, PackageInfo: PSecPkgInfoA): SECURITY_STATUS {
    return Secur32.Load('SaslIdentifyPackageA')(pInput, PackageInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslidentifypackagew
  public static SaslIdentifyPackageW(pInput: PSecBufferDesc, PackageInfo: PSecPkgInfoW): SECURITY_STATUS {
    return Secur32.Load('SaslIdentifyPackageW')(pInput, PackageInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslinitializesecuritycontexta
  public static SaslInitializeSecurityContextA(
    phCredential: PCredHandle | NULL,
    phContext: PCtxtHandle | NULL,
    pszTargetName: LPSTR | NULL,
    fContextReq: ULONG,
    Reserved1: ULONG,
    TargetDataRep: ULONG,
    pInput: PSecBufferDesc | NULL,
    Reserved2: ULONG,
    phNewContext: PCtxtHandle | NULL,
    pOutput: PSecBufferDesc,
    pfContextAttr: PULONG,
    ptsExpiry: PTimeStamp | NULL,
  ): SECURITY_STATUS {
    return Secur32.Load('SaslInitializeSecurityContextA')(phCredential, phContext, pszTargetName, fContextReq, Reserved1, TargetDataRep, pInput, Reserved2, phNewContext, pOutput, pfContextAttr, ptsExpiry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslinitializesecuritycontextw
  public static SaslInitializeSecurityContextW(
    phCredential: PCredHandle | NULL,
    phContext: PCtxtHandle | NULL,
    pszTargetName: LPWSTR | NULL,
    fContextReq: ULONG,
    Reserved1: ULONG,
    TargetDataRep: ULONG,
    pInput: PSecBufferDesc | NULL,
    Reserved2: ULONG,
    phNewContext: PCtxtHandle | NULL,
    pOutput: PSecBufferDesc,
    pfContextAttr: PULONG,
    ptsExpiry: PTimeStamp | NULL,
  ): SECURITY_STATUS {
    return Secur32.Load('SaslInitializeSecurityContextW')(phCredential, phContext, pszTargetName, fContextReq, Reserved1, TargetDataRep, pInput, Reserved2, phNewContext, pOutput, pfContextAttr, ptsExpiry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslsetcontextoption
  public static SaslSetContextOption(ContextHandle: PCtxtHandle, Option: ULONG, Value: PVOID, Size: ULONG): SECURITY_STATUS {
    return Secur32.Load('SaslSetContextOption')(ContextHandle, Option, Value, Size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sealmessage
  public static SealMessage(phContext: PCtxtHandle, fQOP: ULONG, pMessage: PSecBufferDesc, MessageSeqNo: ULONG): SECURITY_STATUS {
    return Secur32.Load('SealMessage')(phContext, fQOP, pMessage, MessageSeqNo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-setcontextattributesa
  public static SetContextAttributesA(phContext: PCtxtHandle, ulAttribute: ULONG, pBuffer: PVOID, cbBuffer: ULONG): SECURITY_STATUS {
    return Secur32.Load('SetContextAttributesA')(phContext, ulAttribute, pBuffer, cbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-setcontextattributesw
  public static SetContextAttributesW(phContext: PCtxtHandle, ulAttribute: ULONG, pBuffer: PVOID, cbBuffer: ULONG): SECURITY_STATUS {
    return Secur32.Load('SetContextAttributesW')(phContext, ulAttribute, pBuffer, cbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-setcredentialsattributesa
  public static SetCredentialsAttributesA(phCredential: PCredHandle, ulAttribute: ULONG, pBuffer: PVOID, cbBuffer: ULONG): SECURITY_STATUS {
    return Secur32.Load('SetCredentialsAttributesA')(phCredential, ulAttribute, pBuffer, cbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-setcredentialsattributesw
  public static SetCredentialsAttributesW(phCredential: PCredHandle, ulAttribute: ULONG, pBuffer: PVOID, cbBuffer: ULONG): SECURITY_STATUS {
    return Secur32.Load('SetCredentialsAttributesW')(phCredential, ulAttribute, pBuffer, cbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspicompareauthidentities
  public static SspiCompareAuthIdentities(
    AuthIdentity1: PSEC_WINNT_AUTH_IDENTITY_OPAQUE | NULL,
    AuthIdentity2: PSEC_WINNT_AUTH_IDENTITY_OPAQUE | NULL,
    SameSuppliedUser: PBOOLEAN | NULL,
    SameSuppliedIdentity: PBOOLEAN | NULL,
  ): SECURITY_STATUS {
    return Secur32.Load('SspiCompareAuthIdentities')(AuthIdentity1, AuthIdentity2, SameSuppliedUser, SameSuppliedIdentity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspicopyauthidentity
  public static SspiCopyAuthIdentity(AuthData: PSEC_WINNT_AUTH_IDENTITY_OPAQUE, AuthDataCopy: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return Secur32.Load('SspiCopyAuthIdentity')(AuthData, AuthDataCopy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspidecryptauthidentity
  public static SspiDecryptAuthIdentity(EncryptedAuthData: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return Secur32.Load('SspiDecryptAuthIdentity')(EncryptedAuthData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiencodeauthidentityasstrings
  public static SspiEncodeAuthIdentityAsStrings(pAuthIdentity: PSEC_WINNT_AUTH_IDENTITY_OPAQUE, pszUserName: LPCWSTR, pszDomainName: LPCWSTR, pszPackedCredentialsString: LPCWSTR | NULL): SECURITY_STATUS {
    return Secur32.Load('SspiEncodeAuthIdentityAsStrings')(pAuthIdentity, pszUserName, pszDomainName, pszPackedCredentialsString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiencodestringsasauthidentity
  public static SspiEncodeStringsAsAuthIdentity(pszUserName: LPCWSTR | NULL, pszDomainName: LPCWSTR | NULL, pszPackedCredentialsString: LPCWSTR | NULL, ppAuthIdentity: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return Secur32.Load('SspiEncodeStringsAsAuthIdentity')(pszUserName, pszDomainName, pszPackedCredentialsString, ppAuthIdentity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiencryptauthidentity
  public static SspiEncryptAuthIdentity(AuthData: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return Secur32.Load('SspiEncryptAuthIdentity')(AuthData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiexcludepackage
  public static SspiExcludePackage(AuthIdentity: PSEC_WINNT_AUTH_IDENTITY_OPAQUE | NULL, pszPackageName: LPCWSTR, ppNewAuthIdentity: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return Secur32.Load('SspiExcludePackage')(AuthIdentity, pszPackageName, ppNewAuthIdentity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspifreeauthidentity
  public static SspiFreeAuthIdentity(AuthData: PSEC_WINNT_AUTH_IDENTITY_OPAQUE | NULL): VOID {
    return Secur32.Load('SspiFreeAuthIdentity')(AuthData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspigettargethostname
  public static SspiGetTargetHostName(pszTargetName: LPCWSTR, pszHostName: LPWSTR): SECURITY_STATUS {
    return Secur32.Load('SspiGetTargetHostName')(pszTargetName, pszHostName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiisauthidentityencrypted
  public static SspiIsAuthIdentityEncrypted(EncryptedAuthData: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): BOOLEAN {
    return Secur32.Load('SspiIsAuthIdentityEncrypted')(EncryptedAuthData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspilocalfree
  public static SspiLocalFree(DataBuffer: PVOID | NULL): VOID {
    return Secur32.Load('SspiLocalFree')(DataBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspimarshalauthidentity
  public static SspiMarshalAuthIdentity(AuthIdentity: PSEC_WINNT_AUTH_IDENTITY_OPAQUE, AuthIdentityLength: PULONG, AuthIdentityByteArray: PVOID): SECURITY_STATUS {
    return Secur32.Load('SspiMarshalAuthIdentity')(AuthIdentity, AuthIdentityLength, AuthIdentityByteArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiprepareforcreedread
  public static SspiPrepareForCredRead(AuthIdentity: PSEC_WINNT_AUTH_IDENTITY_OPAQUE, pszTargetName: LPCWSTR, pCredmanCredentialType: PULONG, ppszCredmanTargetName: LPCWSTR): SECURITY_STATUS {
    return Secur32.Load('SspiPrepareForCredRead')(AuthIdentity, pszTargetName, pCredmanCredentialType, ppszCredmanTargetName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiprepareforcredwrite
  public static SspiPrepareForCredWrite(
    AuthIdentity: PSEC_WINNT_AUTH_IDENTITY_OPAQUE,
    pszTargetName: LPCWSTR | NULL,
    pCredmanCredentialType: PULONG,
    ppszCredmanTargetName: LPCWSTR,
    ppszCredmanUserName: LPCWSTR,
    ppCredentialBlob: PUCHAR,
    pCredentialBlobSize: PULONG,
  ): SECURITY_STATUS {
    return Secur32.Load('SspiPrepareForCredWrite')(AuthIdentity, pszTargetName, pCredmanCredentialType, ppszCredmanTargetName, ppszCredmanUserName, ppCredentialBlob, pCredentialBlobSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiunmarshalauthidentity
  public static SspiUnmarshalAuthIdentity(AuthIdentityLength: ULONG, AuthIdentityByteArray: PVOID, ppAuthIdentity: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return Secur32.Load('SspiUnmarshalAuthIdentity')(AuthIdentityLength, AuthIdentityByteArray, ppAuthIdentity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspivalidateauthidentity
  public static SspiValidateAuthIdentity(AuthData: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return Secur32.Load('SspiValidateAuthIdentity')(AuthData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspizeroauthidentity
  public static SspiZeroAuthIdentity(AuthData: PSEC_WINNT_AUTH_IDENTITY_OPAQUE | NULL): VOID {
    return Secur32.Load('SspiZeroAuthIdentity')(AuthData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/secext/nf-secext-translatenamea
  public static TranslateNameA(lpAccountName: LPCSTR, AccountNameFormat: EXTENDED_NAME_FORMAT, DesiredNameFormat: EXTENDED_NAME_FORMAT, lpTranslatedName: LPSTR | NULL, nSize: PULONG): BOOLEAN {
    return Secur32.Load('TranslateNameA')(lpAccountName, AccountNameFormat, DesiredNameFormat, lpTranslatedName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/secext/nf-secext-translatenamew
  public static TranslateNameW(lpAccountName: LPCWSTR, AccountNameFormat: EXTENDED_NAME_FORMAT, DesiredNameFormat: EXTENDED_NAME_FORMAT, lpTranslatedName: LPWSTR | NULL, nSize: PULONG): BOOLEAN {
    return Secur32.Load('TranslateNameW')(lpAccountName, AccountNameFormat, DesiredNameFormat, lpTranslatedName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-unsealmessage
  public static UnsealMessage(phContext: PCtxtHandle, pMessage: PSecBufferDesc, MessageSeqNo: ULONG, pfQOP: PULONG): SECURITY_STATUS {
    return Secur32.Load('UnsealMessage')(phContext, pMessage, MessageSeqNo, pfQOP);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-verifysignature
  public static VerifySignature(phContext: PCtxtHandle, pMessage: PSecBufferDesc, MessageSeqNo: ULONG, pfQOP: PULONG): SECURITY_STATUS {
    return Secur32.Load('VerifySignature')(phContext, pMessage, MessageSeqNo, pfQOP);
  }
}

export default Secur32;
