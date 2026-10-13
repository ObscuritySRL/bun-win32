import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOLEAN,
  EXTENDED_NAME_FORMAT,
  HANDLE,
  LPSTR,
  LPWSTR,
  NTSTATUS,
  Optional,
  PBOOLEAN,
  PCREDENTIAL_TARGET_INFORMATIONW,
  PCWSTR,
  PCredHandle,
  PCtxtHandle,
  PHANDLE,
  PLSA_OPERATIONAL_MODE,
  PLSA_STRING,
  PLUID,
  PNTSTATUS,
  POLICY_NOTIFICATION_INFORMATION_CLASS,
  PQUOTA_LIMITS,
  PSEC_WINNT_AUTH_IDENTITY_OPAQUE,
  PSECURITY_LOGON_SESSION_DATA,
  PSECURITY_PACKAGE_OPTIONS,
  PSecBuffer,
  PSecBufferDesc,
  PSecPkgInfoA,
  PSecPkgInfoW,
  PSecurityFunctionTableA,
  PSecurityFunctionTableW,
  PSecurityUserData,
  PTOKEN_GROUPS,
  PTOKEN_SOURCE,
  PTimeStamp,
  PUCHAR,
  PULONG,
  PUSHORT,
  PVOID,
  SEC_GET_KEY_FN,
  SECURITY_LOGON_TYPE,
  SECURITY_STATUS,
  ULONG,
  VOID,
} from '../types/SspiCli';

/**
 * Thin, lazy-loaded FFI bindings for `sspicli.dll`.
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
 * import SspiCli from './structs/SspiCli';
 *
 * // Lazy: bind on first call
 * const buf = Buffer.alloc(512);
 * const size = Buffer.alloc(4);
 * size.writeUInt32LE(buf.byteLength / 2);
 * const ok = SspiCli.GetUserNameExW(2, buf.ptr, size.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * SspiCli.Preload(['GetUserNameExW', 'FreeContextBuffer']);
 * ```
 */
class SspiCli extends Win32 {
  protected static override name = 'sspicli.dll';

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
    CredMarshalTargetInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredUnmarshalTargetInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
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
    QueryContextAttributesExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    QueryContextAttributesExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    QueryContextAttributesW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryCredentialsAttributesA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryCredentialsAttributesExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    QueryCredentialsAttributesExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
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
    SspiDecryptAuthIdentityEx: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SspiEncodeAuthIdentityAsStrings: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SspiEncodeStringsAsAuthIdentity: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SspiEncryptAuthIdentity: { args: [FFIType.ptr], returns: FFIType.i32 },
    SspiEncryptAuthIdentityEx: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
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
    UnsealMessage: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VerifySignature: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-acceptsecuritycontext
  public static AcceptSecurityContext(
    phCredential: Optional<PCredHandle>,
    phContext: Optional<PCtxtHandle>,
    pInput: Optional<PSecBufferDesc>,
    fContextReq: ULONG,
    TargetDataRep: ULONG,
    phNewContext_in_out: Optional<PCtxtHandle>,
    pOutput_in_out: Optional<PSecBufferDesc>,
    pfContextAttr_out: PULONG,
    ptsExpiry_out: Optional<PTimeStamp>,
  ): SECURITY_STATUS {
    return SspiCli.Load('AcceptSecurityContext')(phCredential, phContext, pInput, fContextReq, TargetDataRep, phNewContext_in_out, pOutput_in_out, pfContextAttr_out, ptsExpiry_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-acquirecredentialshandlea
  public static AcquireCredentialsHandleA(
    pszPrincipal: Optional<LPSTR>,
    pszPackage: LPSTR,
    fCredentialUse: ULONG,
    pvLogonId: Optional<PLUID>,
    pAuthData: Optional<PVOID>,
    pGetKeyFn: Optional<SEC_GET_KEY_FN>,
    pvGetKeyArgument: Optional<PVOID>,
    phCredential_out: PCredHandle,
    ptsExpiry_out: Optional<PTimeStamp>,
  ): SECURITY_STATUS {
    return SspiCli.Load('AcquireCredentialsHandleA')(pszPrincipal, pszPackage, fCredentialUse, pvLogonId, pAuthData, pGetKeyFn, pvGetKeyArgument, phCredential_out, ptsExpiry_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-acquirecredentialshandlew
  public static AcquireCredentialsHandleW(
    pPrincipal: Optional<LPWSTR>,
    pPackage: LPWSTR,
    fCredentialUse: ULONG,
    pvLogonId: Optional<PLUID>,
    pAuthData: Optional<PVOID>,
    pGetKeyFn: Optional<SEC_GET_KEY_FN>,
    pvGetKeyArgument: Optional<PVOID>,
    phCredential_out: PCredHandle,
    ptsExpiry_out: Optional<PTimeStamp>,
  ): SECURITY_STATUS {
    return SspiCli.Load('AcquireCredentialsHandleW')(pPrincipal, pPackage, fCredentialUse, pvLogonId, pAuthData, pGetKeyFn, pvGetKeyArgument, phCredential_out, ptsExpiry_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-addcredentialsa
  public static AddCredentialsA(
    hCredentials: PCredHandle,
    pszPrincipal: Optional<LPSTR>,
    pszPackage: LPSTR,
    fCredentialUse: ULONG,
    pAuthData: Optional<PVOID>,
    pGetKeyFn: Optional<SEC_GET_KEY_FN>,
    pvGetKeyArgument: Optional<PVOID>,
    ptsExpiry_out: Optional<PTimeStamp>,
  ): SECURITY_STATUS {
    return SspiCli.Load('AddCredentialsA')(hCredentials, pszPrincipal, pszPackage, fCredentialUse, pAuthData, pGetKeyFn, pvGetKeyArgument, ptsExpiry_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-addcredentialsw
  public static AddCredentialsW(
    hCredentials: PCredHandle,
    pPrincipal: Optional<LPWSTR>,
    pPackage: LPWSTR,
    fCredentialUse: ULONG,
    pAuthData: Optional<PVOID>,
    pGetKeyFn: Optional<SEC_GET_KEY_FN>,
    pvGetKeyArgument: Optional<PVOID>,
    ptsExpiry_out: Optional<PTimeStamp>,
  ): SECURITY_STATUS {
    return SspiCli.Load('AddCredentialsW')(hCredentials, pPrincipal, pPackage, fCredentialUse, pAuthData, pGetKeyFn, pvGetKeyArgument, ptsExpiry_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-addsecuritypackagea
  public static AddSecurityPackageA(pszPackageName: LPSTR, pOptions: Optional<PSECURITY_PACKAGE_OPTIONS>): SECURITY_STATUS {
    return SspiCli.Load('AddSecurityPackageA')(pszPackageName, pOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-addsecuritypackagew
  public static AddSecurityPackageW(pszPackageName: LPWSTR, pOptions: Optional<PSECURITY_PACKAGE_OPTIONS>): SECURITY_STATUS {
    return SspiCli.Load('AddSecurityPackageW')(pszPackageName, pOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-applycontroltoken
  public static ApplyControlToken(phContext: PCtxtHandle, pInput: PSecBufferDesc): SECURITY_STATUS {
    return SspiCli.Load('ApplyControlToken')(phContext, pInput);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-changeaccountpassworda
  public static ChangeAccountPasswordA(
    pszPackageName: LPSTR,
    pszDomainName: LPSTR,
    pszAccountName: LPSTR,
    pszOldPassword: LPSTR,
    pszNewPassword: LPSTR,
    bImpersonating: BOOLEAN,
    dwReserved: ULONG,
    pOutput_in_out: PSecBufferDesc,
  ): SECURITY_STATUS {
    return SspiCli.Load('ChangeAccountPasswordA')(pszPackageName, pszDomainName, pszAccountName, pszOldPassword, pszNewPassword, bImpersonating, dwReserved, pOutput_in_out);
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
    pOutput_in_out: PSecBufferDesc,
  ): SECURITY_STATUS {
    return SspiCli.Load('ChangeAccountPasswordW')(pszPackageName, pszDomainName, pszAccountName, pszOldPassword, pszNewPassword, bImpersonating, dwReserved, pOutput_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-completeauthtoken
  public static CompleteAuthToken(phContext: PCtxtHandle, pToken: PSecBufferDesc): SECURITY_STATUS {
    return SspiCli.Load('CompleteAuthToken')(phContext, pToken);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecpkg/nf-ntsecpkg-credmarshaltargetinfo
  public static CredMarshalTargetInfo(InTargetInfo: PCREDENTIAL_TARGET_INFORMATIONW, Buffer_out: PUSHORT, BufferSize_out: PULONG): NTSTATUS {
    return SspiCli.Load('CredMarshalTargetInfo')(InTargetInfo, Buffer_out, BufferSize_out);
  }

  // Undocumented export (no Microsoft Learn page).
  public static CredUnmarshalTargetInfo(Buffer: PUSHORT, BufferSize: ULONG, RetTargetInfo_out: Optional<PCREDENTIAL_TARGET_INFORMATIONW>, RetActualSize_out: Optional<PULONG>): NTSTATUS {
    return SspiCli.Load('CredUnmarshalTargetInfo')(Buffer, BufferSize, RetTargetInfo_out, RetActualSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-decryptmessage
  public static DecryptMessage(phContext: PCtxtHandle, pMessage_in_out: PSecBufferDesc, MessageSeqNo: ULONG, pfQOP_out: Optional<PULONG>): SECURITY_STATUS {
    return SspiCli.Load('DecryptMessage')(phContext, pMessage_in_out, MessageSeqNo, pfQOP_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-deletesecuritycontext
  public static DeleteSecurityContext(phContext: PCtxtHandle): SECURITY_STATUS {
    return SspiCli.Load('DeleteSecurityContext')(phContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-deletesecuritypackagea
  public static DeleteSecurityPackageA(pszPackageName: LPSTR): SECURITY_STATUS {
    return SspiCli.Load('DeleteSecurityPackageA')(pszPackageName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-deletesecuritypackagew
  public static DeleteSecurityPackageW(pszPackageName: LPWSTR): SECURITY_STATUS {
    return SspiCli.Load('DeleteSecurityPackageW')(pszPackageName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-encryptmessage
  public static EncryptMessage(phContext: PCtxtHandle, fQOP: ULONG, pMessage_in_out: PSecBufferDesc, MessageSeqNo: ULONG): SECURITY_STATUS {
    return SspiCli.Load('EncryptMessage')(phContext, fQOP, pMessage_in_out, MessageSeqNo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-enumeratesecuritypackagesa
  public static EnumerateSecurityPackagesA(pcPackages_out: PULONG, ppPackageInfo_out: PSecPkgInfoA): SECURITY_STATUS {
    return SspiCli.Load('EnumerateSecurityPackagesA')(pcPackages_out, ppPackageInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-enumeratesecuritypackagesw
  public static EnumerateSecurityPackagesW(pcPackages_out: PULONG, ppPackageInfo_out: PSecPkgInfoW): SECURITY_STATUS {
    return SspiCli.Load('EnumerateSecurityPackagesW')(pcPackages_out, ppPackageInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-exportsecuritycontext
  public static ExportSecurityContext(phContext: PCtxtHandle, fFlags: ULONG, pPackedContext_out: PSecBuffer, pToken_out: Optional<PHANDLE>): SECURITY_STATUS {
    return SspiCli.Load('ExportSecurityContext')(phContext, fFlags, pPackedContext_out, pToken_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-freecontextbuffer
  public static FreeContextBuffer(pvContextBuffer: PVOID): SECURITY_STATUS {
    return SspiCli.Load('FreeContextBuffer')(pvContextBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-freecredentialshandle
  public static FreeCredentialsHandle(phCredential: PCredHandle): SECURITY_STATUS {
    return SspiCli.Load('FreeCredentialsHandle')(phCredential);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-getsecurityuserinfo
  public static GetSecurityUserInfo(LogonId: Optional<PLUID>, Flags: ULONG, UserInformation_out: PSecurityUserData): NTSTATUS {
    return SspiCli.Load('GetSecurityUserInfo')(LogonId, Flags, UserInformation_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/secext/nf-secext-getusernameexa
  public static GetUserNameExA(NameFormat: EXTENDED_NAME_FORMAT, lpNameBuffer_out: Optional<LPSTR>, nSize_in_out: PULONG): BOOLEAN {
    return SspiCli.Load('GetUserNameExA')(NameFormat, lpNameBuffer_out, nSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/secext/nf-secext-getusernameexw
  public static GetUserNameExW(NameFormat: EXTENDED_NAME_FORMAT, lpNameBuffer_out: Optional<LPWSTR>, nSize_in_out: PULONG): BOOLEAN {
    return SspiCli.Load('GetUserNameExW')(NameFormat, lpNameBuffer_out, nSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-impersonatesecuritycontext
  public static ImpersonateSecurityContext(phContext: PCtxtHandle): SECURITY_STATUS {
    return SspiCli.Load('ImpersonateSecurityContext')(phContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-importsecuritycontexta
  public static ImportSecurityContextA(pszPackage: LPSTR, pPackedContext: PSecBuffer, Token: Optional<HANDLE>, phContext_out: PCtxtHandle): SECURITY_STATUS {
    return SspiCli.Load('ImportSecurityContextA')(pszPackage, pPackedContext, Token, phContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-importsecuritycontextw
  public static ImportSecurityContextW(pszPackage: LPWSTR, pPackedContext: PSecBuffer, Token: Optional<HANDLE>, phContext_out: PCtxtHandle): SECURITY_STATUS {
    return SspiCli.Load('ImportSecurityContextW')(pszPackage, pPackedContext, Token, phContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-initsecurityinterfacea
  public static InitSecurityInterfaceA(): PSecurityFunctionTableA {
    return SspiCli.Load('InitSecurityInterfaceA')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-initsecurityinterfacew
  public static InitSecurityInterfaceW(): PSecurityFunctionTableW {
    return SspiCli.Load('InitSecurityInterfaceW')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-initializesecuritycontexta
  public static InitializeSecurityContextA(
    phCredential: Optional<PCredHandle>,
    phContext: Optional<PCtxtHandle>,
    pszTargetName: Optional<LPSTR>,
    fContextReq: ULONG,
    Reserved1: ULONG,
    TargetDataRep: ULONG,
    pInput: Optional<PSecBufferDesc>,
    Reserved2: ULONG,
    phNewContext_in_out: Optional<PCtxtHandle>,
    pOutput_in_out: Optional<PSecBufferDesc>,
    pfContextAttr_out: PULONG,
    ptsExpiry_out: Optional<PTimeStamp>,
  ): SECURITY_STATUS {
    return SspiCli.Load('InitializeSecurityContextA')(phCredential, phContext, pszTargetName, fContextReq, Reserved1, TargetDataRep, pInput, Reserved2, phNewContext_in_out, pOutput_in_out, pfContextAttr_out, ptsExpiry_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-initializesecuritycontextw
  public static InitializeSecurityContextW(
    phCredential: Optional<PCredHandle>,
    phContext: Optional<PCtxtHandle>,
    pTargetName: Optional<LPWSTR>,
    fContextReq: ULONG,
    Reserved1: ULONG,
    TargetDataRep: ULONG,
    pInput: Optional<PSecBufferDesc>,
    Reserved2: ULONG,
    phNewContext_in_out: Optional<PCtxtHandle>,
    pOutput_in_out: Optional<PSecBufferDesc>,
    pfContextAttr_out: PULONG,
    ptsExpiry_out: Optional<PTimeStamp>,
  ): SECURITY_STATUS {
    return SspiCli.Load('InitializeSecurityContextW')(phCredential, phContext, pTargetName, fContextReq, Reserved1, TargetDataRep, pInput, Reserved2, phNewContext_in_out, pOutput_in_out, pfContextAttr_out, ptsExpiry_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsacallauthenticationpackage
  public static LsaCallAuthenticationPackage(
    LsaHandle: HANDLE,
    AuthenticationPackage: ULONG,
    ProtocolSubmitBuffer: PVOID,
    SubmitBufferLength: ULONG,
    ProtocolReturnBuffer_out: Optional<PVOID>,
    ReturnBufferLength_out: Optional<PULONG>,
    ProtocolStatus_out: Optional<PNTSTATUS>,
  ): NTSTATUS {
    return SspiCli.Load('LsaCallAuthenticationPackage')(LsaHandle, AuthenticationPackage, ProtocolSubmitBuffer, SubmitBufferLength, ProtocolReturnBuffer_out, ReturnBufferLength_out, ProtocolStatus_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaconnectuntrusted
  public static LsaConnectUntrusted(LsaHandle_out: PHANDLE): NTSTATUS {
    return SspiCli.Load('LsaConnectUntrusted')(LsaHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaderegisterlogonprocess
  public static LsaDeregisterLogonProcess(LsaHandle: HANDLE): NTSTATUS {
    return SspiCli.Load('LsaDeregisterLogonProcess')(LsaHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaenumeratelogonsessions
  public static LsaEnumerateLogonSessions(LogonSessionCount_out: PULONG, LogonSessionList_out: PLUID): NTSTATUS {
    return SspiCli.Load('LsaEnumerateLogonSessions')(LogonSessionCount_out, LogonSessionList_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsafreereturnbuffer
  public static LsaFreeReturnBuffer(Buffer: PVOID): NTSTATUS {
    return SspiCli.Load('LsaFreeReturnBuffer')(Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsagetlogonsessiondata
  public static LsaGetLogonSessionData(LogonId: PLUID, ppLogonSessionData_out: PSECURITY_LOGON_SESSION_DATA): NTSTATUS {
    return SspiCli.Load('LsaGetLogonSessionData')(LogonId, ppLogonSessionData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsalogonuser
  public static LsaLogonUser(
    LsaHandle: HANDLE,
    OriginName: PLSA_STRING,
    LogonType: SECURITY_LOGON_TYPE,
    AuthenticationPackage: ULONG,
    AuthenticationInformation: PVOID,
    AuthenticationInformationLength: ULONG,
    LocalGroups: Optional<PTOKEN_GROUPS>,
    SourceContext: PTOKEN_SOURCE,
    ProfileBuffer_out: PVOID,
    ProfileBufferLength_out: PULONG,
    LogonId_out: PLUID,
    Token_out: PHANDLE,
    Quotas_out: PQUOTA_LIMITS,
    SubStatus_out: PNTSTATUS,
  ): NTSTATUS {
    return SspiCli.Load('LsaLogonUser')(
      LsaHandle,
      OriginName,
      LogonType,
      AuthenticationPackage,
      AuthenticationInformation,
      AuthenticationInformationLength,
      LocalGroups,
      SourceContext,
      ProfileBuffer_out,
      ProfileBufferLength_out,
      LogonId_out,
      Token_out,
      Quotas_out,
      SubStatus_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsalookupauthenticationpackage
  public static LsaLookupAuthenticationPackage(LsaHandle: HANDLE, PackageName: PLSA_STRING, AuthenticationPackage_out: PULONG): NTSTATUS {
    return SspiCli.Load('LsaLookupAuthenticationPackage')(LsaHandle, PackageName, AuthenticationPackage_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaregisterlogonprocess
  public static LsaRegisterLogonProcess(LogonProcessName: PLSA_STRING, LsaHandle_out: PHANDLE, SecurityMode_out: PLSA_OPERATIONAL_MODE): NTSTATUS {
    return SspiCli.Load('LsaRegisterLogonProcess')(LogonProcessName, LsaHandle_out, SecurityMode_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaregisterpolicychangenotification
  public static LsaRegisterPolicyChangeNotification(InformationClass: POLICY_NOTIFICATION_INFORMATION_CLASS, NotificationEventHandle: HANDLE): NTSTATUS {
    return SspiCli.Load('LsaRegisterPolicyChangeNotification')(InformationClass, NotificationEventHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaunregisterpolicychangenotification
  public static LsaUnregisterPolicyChangeNotification(InformationClass: POLICY_NOTIFICATION_INFORMATION_CLASS, NotificationEventHandle: HANDLE): NTSTATUS {
    return SspiCli.Load('LsaUnregisterPolicyChangeNotification')(InformationClass, NotificationEventHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-makesignature
  public static MakeSignature(phContext: PCtxtHandle, fQOP: ULONG, pMessage_in_out: PSecBufferDesc, MessageSeqNo: ULONG): SECURITY_STATUS {
    return SspiCli.Load('MakeSignature')(phContext, fQOP, pMessage_in_out, MessageSeqNo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querycontextattributesa
  public static QueryContextAttributesA(phContext: PCtxtHandle, ulAttribute: ULONG, pBuffer_out: PVOID): SECURITY_STATUS {
    return SspiCli.Load('QueryContextAttributesA')(phContext, ulAttribute, pBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querycontextattributesexa
  public static QueryContextAttributesExA(phContext: PCtxtHandle, ulAttribute: ULONG, pBuffer_out: PVOID, cbBuffer: ULONG): SECURITY_STATUS {
    return SspiCli.Load('QueryContextAttributesExA')(phContext, ulAttribute, pBuffer_out, cbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querycontextattributesexw
  public static QueryContextAttributesExW(phContext: PCtxtHandle, ulAttribute: ULONG, pBuffer_out: PVOID, cbBuffer: ULONG): SECURITY_STATUS {
    return SspiCli.Load('QueryContextAttributesExW')(phContext, ulAttribute, pBuffer_out, cbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querycontextattributesw
  public static QueryContextAttributesW(phContext: PCtxtHandle, ulAttribute: ULONG, pBuffer_out: PVOID): SECURITY_STATUS {
    return SspiCli.Load('QueryContextAttributesW')(phContext, ulAttribute, pBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querycredentialsattributesa
  public static QueryCredentialsAttributesA(phCredential: PCredHandle, ulAttribute: ULONG, pBuffer_out: PVOID): SECURITY_STATUS {
    return SspiCli.Load('QueryCredentialsAttributesA')(phCredential, ulAttribute, pBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querycredentialsattributesexa
  public static QueryCredentialsAttributesExA(phCredential: PCredHandle, ulAttribute: ULONG, pBuffer_in_out: PVOID, cbBuffer: ULONG): SECURITY_STATUS {
    return SspiCli.Load('QueryCredentialsAttributesExA')(phCredential, ulAttribute, pBuffer_in_out, cbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querycredentialsattributesexw
  public static QueryCredentialsAttributesExW(phCredential: PCredHandle, ulAttribute: ULONG, pBuffer_in_out: PVOID, cbBuffer: ULONG): SECURITY_STATUS {
    return SspiCli.Load('QueryCredentialsAttributesExW')(phCredential, ulAttribute, pBuffer_in_out, cbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querycredentialsattributesw
  public static QueryCredentialsAttributesW(phCredential: PCredHandle, ulAttribute: ULONG, pBuffer_out: PVOID): SECURITY_STATUS {
    return SspiCli.Load('QueryCredentialsAttributesW')(phCredential, ulAttribute, pBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querysecuritycontexttoken
  public static QuerySecurityContextToken(phContext: PCtxtHandle, Token_out: PHANDLE): SECURITY_STATUS {
    return SspiCli.Load('QuerySecurityContextToken')(phContext, Token_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querysecuritypackageinfoa
  public static QuerySecurityPackageInfoA(pszPackageName: LPSTR, ppPackageInfo_out: PSecPkgInfoA): SECURITY_STATUS {
    return SspiCli.Load('QuerySecurityPackageInfoA')(pszPackageName, ppPackageInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-querysecuritypackageinfow
  public static QuerySecurityPackageInfoW(pPackageName: LPWSTR, ppPackageInfo_out: PSecPkgInfoW): SECURITY_STATUS {
    return SspiCli.Load('QuerySecurityPackageInfoW')(pPackageName, ppPackageInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-revertsecuritycontext
  public static RevertSecurityContext(phContext: PCtxtHandle): SECURITY_STATUS {
    return SspiCli.Load('RevertSecurityContext')(phContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslacceptsecuritycontext
  public static SaslAcceptSecurityContext(
    phCredential: Optional<PCredHandle>,
    phContext: Optional<PCtxtHandle>,
    pInput: Optional<PSecBufferDesc>,
    fContextReq: ULONG,
    TargetDataRep: ULONG,
    phNewContext_out: Optional<PCtxtHandle>,
    pOutput_in_out: Optional<PSecBufferDesc>,
    pfContextAttr_out: PULONG,
    ptsExpiry_out: Optional<PTimeStamp>,
  ): SECURITY_STATUS {
    return SspiCli.Load('SaslAcceptSecurityContext')(phCredential, phContext, pInput, fContextReq, TargetDataRep, phNewContext_out, pOutput_in_out, pfContextAttr_out, ptsExpiry_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslenumerateprofilesa
  public static SaslEnumerateProfilesA(ProfileList_out: LPSTR, ProfileCount_out: PULONG): SECURITY_STATUS {
    return SspiCli.Load('SaslEnumerateProfilesA')(ProfileList_out, ProfileCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslenumerateprofilesw
  public static SaslEnumerateProfilesW(ProfileList_out: LPWSTR, ProfileCount_out: PULONG): SECURITY_STATUS {
    return SspiCli.Load('SaslEnumerateProfilesW')(ProfileList_out, ProfileCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslgetcontextoption
  public static SaslGetContextOption(ContextHandle: PCtxtHandle, Option: ULONG, Value_out: PVOID, Size: ULONG, Needed_out: Optional<PULONG>): SECURITY_STATUS {
    return SspiCli.Load('SaslGetContextOption')(ContextHandle, Option, Value_out, Size, Needed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslgetprofilepackagea
  public static SaslGetProfilePackageA(ProfileName: LPSTR, PackageInfo_out: PSecPkgInfoA): SECURITY_STATUS {
    return SspiCli.Load('SaslGetProfilePackageA')(ProfileName, PackageInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslgetprofilepackagew
  public static SaslGetProfilePackageW(ProfileName: LPWSTR, PackageInfo_out: PSecPkgInfoW): SECURITY_STATUS {
    return SspiCli.Load('SaslGetProfilePackageW')(ProfileName, PackageInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslidentifypackagea
  public static SaslIdentifyPackageA(pInput: PSecBufferDesc, PackageInfo_out: PSecPkgInfoA): SECURITY_STATUS {
    return SspiCli.Load('SaslIdentifyPackageA')(pInput, PackageInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslidentifypackagew
  public static SaslIdentifyPackageW(pInput: PSecBufferDesc, PackageInfo_out: PSecPkgInfoW): SECURITY_STATUS {
    return SspiCli.Load('SaslIdentifyPackageW')(pInput, PackageInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslinitializesecuritycontexta
  public static SaslInitializeSecurityContextA(
    phCredential: Optional<PCredHandle>,
    phContext: Optional<PCtxtHandle>,
    pszTargetName: Optional<LPSTR>,
    fContextReq: ULONG,
    Reserved1: ULONG,
    TargetDataRep: ULONG,
    pInput: Optional<PSecBufferDesc>,
    Reserved2: ULONG,
    phNewContext_out: Optional<PCtxtHandle>,
    pOutput_in_out: Optional<PSecBufferDesc>,
    pfContextAttr_out: PULONG,
    ptsExpiry_out: Optional<PTimeStamp>,
  ): SECURITY_STATUS {
    return SspiCli.Load('SaslInitializeSecurityContextA')(phCredential, phContext, pszTargetName, fContextReq, Reserved1, TargetDataRep, pInput, Reserved2, phNewContext_out, pOutput_in_out, pfContextAttr_out, ptsExpiry_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslinitializesecuritycontextw
  public static SaslInitializeSecurityContextW(
    phCredential: Optional<PCredHandle>,
    phContext: Optional<PCtxtHandle>,
    pszTargetName: Optional<LPWSTR>,
    fContextReq: ULONG,
    Reserved1: ULONG,
    TargetDataRep: ULONG,
    pInput: Optional<PSecBufferDesc>,
    Reserved2: ULONG,
    phNewContext_out: Optional<PCtxtHandle>,
    pOutput_in_out: Optional<PSecBufferDesc>,
    pfContextAttr_out: PULONG,
    ptsExpiry_out: Optional<PTimeStamp>,
  ): SECURITY_STATUS {
    return SspiCli.Load('SaslInitializeSecurityContextW')(phCredential, phContext, pszTargetName, fContextReq, Reserved1, TargetDataRep, pInput, Reserved2, phNewContext_out, pOutput_in_out, pfContextAttr_out, ptsExpiry_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-saslsetcontextoption
  public static SaslSetContextOption(ContextHandle: PCtxtHandle, Option: ULONG, Value: PVOID, Size: ULONG): SECURITY_STATUS {
    return SspiCli.Load('SaslSetContextOption')(ContextHandle, Option, Value, Size);
  }

  // Undocumented export (no Microsoft Learn page).
  public static SealMessage(phContext: PCtxtHandle, fQOP: ULONG, pMessage: PSecBufferDesc, MessageSeqNo: ULONG): SECURITY_STATUS {
    return SspiCli.Load('SealMessage')(phContext, fQOP, pMessage, MessageSeqNo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-setcontextattributesa
  public static SetContextAttributesA(phContext: PCtxtHandle, ulAttribute: ULONG, pBuffer: PVOID, cbBuffer: ULONG): SECURITY_STATUS {
    return SspiCli.Load('SetContextAttributesA')(phContext, ulAttribute, pBuffer, cbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-setcontextattributesw
  public static SetContextAttributesW(phContext: PCtxtHandle, ulAttribute: ULONG, pBuffer: PVOID, cbBuffer: ULONG): SECURITY_STATUS {
    return SspiCli.Load('SetContextAttributesW')(phContext, ulAttribute, pBuffer, cbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-setcredentialsattributesa
  public static SetCredentialsAttributesA(phCredential: PCredHandle, ulAttribute: ULONG, pBuffer: PVOID, cbBuffer: ULONG): SECURITY_STATUS {
    return SspiCli.Load('SetCredentialsAttributesA')(phCredential, ulAttribute, pBuffer, cbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-setcredentialsattributesw
  public static SetCredentialsAttributesW(phCredential: PCredHandle, ulAttribute: ULONG, pBuffer: PVOID, cbBuffer: ULONG): SECURITY_STATUS {
    return SspiCli.Load('SetCredentialsAttributesW')(phCredential, ulAttribute, pBuffer, cbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspicompareauthidentities
  public static SspiCompareAuthIdentities(
    AuthIdentity1: Optional<PSEC_WINNT_AUTH_IDENTITY_OPAQUE>,
    AuthIdentity2: Optional<PSEC_WINNT_AUTH_IDENTITY_OPAQUE>,
    SameSuppliedUser_out: Optional<PBOOLEAN>,
    SameSuppliedIdentity_out: Optional<PBOOLEAN>,
  ): SECURITY_STATUS {
    return SspiCli.Load('SspiCompareAuthIdentities')(AuthIdentity1, AuthIdentity2, SameSuppliedUser_out, SameSuppliedIdentity_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspicopyauthidentity
  public static SspiCopyAuthIdentity(AuthData: PSEC_WINNT_AUTH_IDENTITY_OPAQUE, AuthDataCopy_out: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return SspiCli.Load('SspiCopyAuthIdentity')(AuthData, AuthDataCopy_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspidecryptauthidentity
  public static SspiDecryptAuthIdentity(EncryptedAuthData_in_out: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return SspiCli.Load('SspiDecryptAuthIdentity')(EncryptedAuthData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspidecryptauthidentityex
  public static SspiDecryptAuthIdentityEx(Options: ULONG, EncryptedAuthData_in_out: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return SspiCli.Load('SspiDecryptAuthIdentityEx')(Options, EncryptedAuthData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiencodeauthidentityasstrings
  public static SspiEncodeAuthIdentityAsStrings(pAuthIdentity: PSEC_WINNT_AUTH_IDENTITY_OPAQUE, ppszUserName_out: PCWSTR, ppszDomainName_out: PCWSTR, ppszPackedCredentialsString_out: Optional<PCWSTR>): SECURITY_STATUS {
    return SspiCli.Load('SspiEncodeAuthIdentityAsStrings')(pAuthIdentity, ppszUserName_out, ppszDomainName_out, ppszPackedCredentialsString_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiencodestringsasauthidentity
  public static SspiEncodeStringsAsAuthIdentity(pszUserName: Optional<PCWSTR>, pszDomainName: Optional<PCWSTR>, pszPackedCredentialsString: Optional<PCWSTR>, ppAuthIdentity_out: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return SspiCli.Load('SspiEncodeStringsAsAuthIdentity')(pszUserName, pszDomainName, pszPackedCredentialsString, ppAuthIdentity_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiencryptauthidentity
  public static SspiEncryptAuthIdentity(AuthData_in_out: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return SspiCli.Load('SspiEncryptAuthIdentity')(AuthData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiencryptauthidentityex
  public static SspiEncryptAuthIdentityEx(Options: ULONG, AuthData_in_out: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return SspiCli.Load('SspiEncryptAuthIdentityEx')(Options, AuthData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiexcludepackage
  public static SspiExcludePackage(AuthIdentity: Optional<PSEC_WINNT_AUTH_IDENTITY_OPAQUE>, pszPackageName: PCWSTR, ppNewAuthIdentity_out: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return SspiCli.Load('SspiExcludePackage')(AuthIdentity, pszPackageName, ppNewAuthIdentity_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspifreeauthidentity
  public static SspiFreeAuthIdentity(AuthData: Optional<PSEC_WINNT_AUTH_IDENTITY_OPAQUE>): VOID {
    return SspiCli.Load('SspiFreeAuthIdentity')(AuthData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspigettargethostname
  public static SspiGetTargetHostName(pszTargetName: PCWSTR, pszHostName_out: PCWSTR): SECURITY_STATUS {
    return SspiCli.Load('SspiGetTargetHostName')(pszTargetName, pszHostName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiisauthidentityencrypted
  public static SspiIsAuthIdentityEncrypted(EncryptedAuthData: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): BOOLEAN {
    return SspiCli.Load('SspiIsAuthIdentityEncrypted')(EncryptedAuthData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspilocalfree
  public static SspiLocalFree(DataBuffer: Optional<PVOID>): VOID {
    return SspiCli.Load('SspiLocalFree')(DataBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspimarshalAuthIdentity
  public static SspiMarshalAuthIdentity(AuthIdentity: PSEC_WINNT_AUTH_IDENTITY_OPAQUE, AuthIdentityLength_out: PULONG, AuthIdentityByteArray_out: PVOID): SECURITY_STATUS {
    return SspiCli.Load('SspiMarshalAuthIdentity')(AuthIdentity, AuthIdentityLength_out, AuthIdentityByteArray_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiprepareforCredRead
  public static SspiPrepareForCredRead(AuthIdentity: PSEC_WINNT_AUTH_IDENTITY_OPAQUE, pszTargetName: PCWSTR, pCredmanCredentialType_out: PULONG, ppszCredmanTargetName_out: PCWSTR): SECURITY_STATUS {
    return SspiCli.Load('SspiPrepareForCredRead')(AuthIdentity, pszTargetName, pCredmanCredentialType_out, ppszCredmanTargetName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiprepareforCredWrite
  public static SspiPrepareForCredWrite(
    AuthIdentity: PSEC_WINNT_AUTH_IDENTITY_OPAQUE,
    pszTargetName: Optional<PCWSTR>,
    pCredmanCredentialType_out: PULONG,
    ppszCredmanTargetName_out: PCWSTR,
    ppszCredmanUserName_out: PCWSTR,
    ppCredentialBlob_out: PUCHAR,
    pCredentialBlobSize_out: PULONG,
  ): SECURITY_STATUS {
    return SspiCli.Load('SspiPrepareForCredWrite')(AuthIdentity, pszTargetName, pCredmanCredentialType_out, ppszCredmanTargetName_out, ppszCredmanUserName_out, ppCredentialBlob_out, pCredentialBlobSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiunmarshalAuthIdentity
  public static SspiUnmarshalAuthIdentity(AuthIdentityLength: ULONG, AuthIdentityByteArray: PVOID, ppAuthIdentity_out: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return SspiCli.Load('SspiUnmarshalAuthIdentity')(AuthIdentityLength, AuthIdentityByteArray, ppAuthIdentity_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspivalidateauthidentity
  public static SspiValidateAuthIdentity(AuthData: PSEC_WINNT_AUTH_IDENTITY_OPAQUE): SECURITY_STATUS {
    return SspiCli.Load('SspiValidateAuthIdentity')(AuthData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspizeroauthidentity
  public static SspiZeroAuthIdentity(AuthData: Optional<PSEC_WINNT_AUTH_IDENTITY_OPAQUE>): VOID {
    return SspiCli.Load('SspiZeroAuthIdentity')(AuthData);
  }

  // Undocumented export (no Microsoft Learn page).
  public static UnsealMessage(phContext: PCtxtHandle, pMessage: PSecBufferDesc, MessageSeqNo: ULONG, pfQOP_out: Optional<PULONG>): SECURITY_STATUS {
    return SspiCli.Load('UnsealMessage')(phContext, pMessage, MessageSeqNo, pfQOP_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-verifysignature
  public static VerifySignature(phContext: PCtxtHandle, pMessage: PSecBufferDesc, MessageSeqNo: ULONG, pfQOP_out: PULONG): SECURITY_STATUS {
    return SspiCli.Load('VerifySignature')(phContext, pMessage, MessageSeqNo, pfQOP_out);
  }
}

export default SspiCli;
