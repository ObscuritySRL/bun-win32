import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  BOOLEAN,
  DWORD,
  HANDLE,
  LPDWORD,
  LPCVOID,
  LPSTR,
  LPVOID,
  LPWSTR,
  NULL,
  OPTIONAL,
  PCREDUI_INFOA,
  PCREDUI_INFOW,
  PCSTR,
  PCtxtHandle,
  PCWSTR,
  PBOOL,
  PBYTE,
  PGUID,
  PHANDLE,
  PINT,
  PLUID,
  PPSEC_WINNT_AUTH_IDENTITY_OPAQUE,
  PPSEC_WINNT_CREDUI_CONTEXT,
  PPSEC_WINNT_CREDUI_CONTEXT_VECTOR,
  PPVOID,
  PPWSTR,
  PSEC_WINNT_AUTH_IDENTITY_OPAQUE,
  PULONG,
  PSTR,
  PUCHAR,
  PWSTR,
  SECURITY_STATUS,
  ULONG,
} from '../types/Credui';

/**
 * Thin, lazy-loaded FFI bindings for `credui.dll`.
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
 * import Credui from './structs/Credui';
 *
 * const sizeBuffer = Buffer.alloc(4);
 * Credui.CredPackAuthenticationBufferW(0, userName.ptr, password.ptr, null, sizeBuffer.ptr);
 *
 * const packedBuffer = Buffer.alloc(sizeBuffer.readUInt32LE(0));
 * Credui.CredPackAuthenticationBufferW(0, userName.ptr, password.ptr, packedBuffer.ptr, sizeBuffer.ptr);
 * ```
 */
class Credui extends Win32 {
  protected static override readonly name = 'credui.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CredPackAuthenticationBufferA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredPackAuthenticationBufferW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredUICmdLinePromptForCredentialsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CredUICmdLinePromptForCredentialsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CredUIConfirmCredentialsA: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    CredUIConfirmCredentialsW: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    CredUIParseUserNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CredUIParseUserNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CredUIPromptForCredentialsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CredUIPromptForCredentialsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CredUIPromptForWindowsCredentialsA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CredUIPromptForWindowsCredentialsW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CredUIReadSSOCredW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CredUIStoreSSOCredW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    CredUnPackAuthenticationBufferA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredUnPackAuthenticationBufferW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SspiGetCredUIContext: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SspiIsPromptingNeeded: { args: [FFIType.u32], returns: FFIType.u8 },
    SspiPromptForCredentialsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SspiPromptForCredentialsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SspiUnmarshalCredUIContext: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SspiUpdateCredentials: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credpackauthenticationbuffera
  public static CredPackAuthenticationBufferA(dwFlags: DWORD, pszUserName: LPSTR, pszPassword: LPSTR, pPackedCredentials_out: OPTIONAL<PBYTE>, pcbPackedCredentials_in_out: LPDWORD): BOOL {
    return Credui.Load('CredPackAuthenticationBufferA')(dwFlags, pszUserName, pszPassword, pPackedCredentials_out, pcbPackedCredentials_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credpackauthenticationbufferw
  public static CredPackAuthenticationBufferW(dwFlags: DWORD, pszUserName: LPWSTR, pszPassword: LPWSTR, pPackedCredentials_out: OPTIONAL<PBYTE>, pcbPackedCredentials_in_out: LPDWORD): BOOL {
    return Credui.Load('CredPackAuthenticationBufferW')(dwFlags, pszUserName, pszPassword, pPackedCredentials_out, pcbPackedCredentials_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduicmdlinepromptforcredentialsa
  public static CredUICmdLinePromptForCredentialsA(
    pszTargetName: OPTIONAL<PCSTR>,
    pContext: NULL,
    dwAuthError: DWORD,
    UserName_in_out: PSTR,
    ulUserBufferSize: ULONG,
    pszPassword_in_out: PSTR,
    ulPasswordBufferSize: ULONG,
    pfSave_in_out: OPTIONAL<PBOOL>,
    dwFlags: DWORD,
  ): DWORD {
    return Credui.Load('CredUICmdLinePromptForCredentialsA')(pszTargetName, pContext, dwAuthError, UserName_in_out, ulUserBufferSize, pszPassword_in_out, ulPasswordBufferSize, pfSave_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduicmdlinepromptforcredentialsw
  public static CredUICmdLinePromptForCredentialsW(
    pszTargetName: OPTIONAL<PCWSTR>,
    pContext: NULL,
    dwAuthError: DWORD,
    UserName_in_out: PWSTR,
    ulUserBufferSize: ULONG,
    pszPassword_in_out: PWSTR,
    ulPasswordBufferSize: ULONG,
    pfSave_in_out: OPTIONAL<PBOOL>,
    dwFlags: DWORD,
  ): DWORD {
    return Credui.Load('CredUICmdLinePromptForCredentialsW')(pszTargetName, pContext, dwAuthError, UserName_in_out, ulUserBufferSize, pszPassword_in_out, ulPasswordBufferSize, pfSave_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduiconfirmcredentialsa
  public static CredUIConfirmCredentialsA(pszTargetName: PCSTR, bConfirm: BOOL): DWORD {
    return Credui.Load('CredUIConfirmCredentialsA')(pszTargetName, bConfirm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduiconfirmcredentialsw
  public static CredUIConfirmCredentialsW(pszTargetName: PCWSTR, bConfirm: BOOL): DWORD {
    return Credui.Load('CredUIConfirmCredentialsW')(pszTargetName, bConfirm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduiparseusernamea
  public static CredUIParseUserNameA(userName: PCSTR, user_out: PSTR, userBufferSize: ULONG, domain_out: PSTR, domainBufferSize: ULONG): DWORD {
    return Credui.Load('CredUIParseUserNameA')(userName, user_out, userBufferSize, domain_out, domainBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduiparseusernamew
  public static CredUIParseUserNameW(UserName: PCWSTR, user_out: PWSTR, userBufferSize: ULONG, domain_out: PWSTR, domainBufferSize: ULONG): DWORD {
    return Credui.Load('CredUIParseUserNameW')(UserName, user_out, userBufferSize, domain_out, domainBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduipromptforcredentialsa
  public static CredUIPromptForCredentialsA(
    pUiInfo: OPTIONAL<PCREDUI_INFOA>,
    pszTargetName: OPTIONAL<PCSTR>,
    pContext: NULL,
    dwAuthError: DWORD,
    pszUserName_in_out: PSTR,
    ulUserNameBufferSize: ULONG,
    pszPassword_in_out: PSTR,
    ulPasswordBufferSize: ULONG,
    save_in_out: OPTIONAL<PBOOL>,
    dwFlags: DWORD,
  ): DWORD {
    return Credui.Load('CredUIPromptForCredentialsA')(pUiInfo, pszTargetName, pContext, dwAuthError, pszUserName_in_out, ulUserNameBufferSize, pszPassword_in_out, ulPasswordBufferSize, save_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduipromptforcredentialsw
  public static CredUIPromptForCredentialsW(
    pUiInfo: OPTIONAL<PCREDUI_INFOW>,
    pszTargetName: OPTIONAL<PCWSTR>,
    pContext: NULL,
    dwAuthError: DWORD,
    pszUserName_in_out: PWSTR,
    ulUserNameBufferSize: ULONG,
    pszPassword_in_out: PWSTR,
    ulPasswordBufferSize: ULONG,
    save_in_out: OPTIONAL<PBOOL>,
    dwFlags: DWORD,
  ): DWORD {
    return Credui.Load('CredUIPromptForCredentialsW')(pUiInfo, pszTargetName, pContext, dwAuthError, pszUserName_in_out, ulUserNameBufferSize, pszPassword_in_out, ulPasswordBufferSize, save_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduipromptforwindowscredentialsa
  public static CredUIPromptForWindowsCredentialsA(
    pUiInfo: OPTIONAL<PCREDUI_INFOA>,
    dwAuthError: DWORD,
    pulAuthPackage_in_out: PULONG,
    pvInAuthBuffer: OPTIONAL<LPCVOID>,
    ulInAuthBufferSize: ULONG,
    ppvOutAuthBuffer_out: PPVOID,
    pulOutAuthBufferSize_out: PULONG,
    pfSave_in_out: OPTIONAL<PBOOL>,
    dwFlags: DWORD,
  ): DWORD {
    return Credui.Load('CredUIPromptForWindowsCredentialsA')(pUiInfo, dwAuthError, pulAuthPackage_in_out, pvInAuthBuffer, ulInAuthBufferSize, ppvOutAuthBuffer_out, pulOutAuthBufferSize_out, pfSave_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduipromptforwindowscredentialsw
  public static CredUIPromptForWindowsCredentialsW(
    pUiInfo: OPTIONAL<PCREDUI_INFOW>,
    dwAuthError: DWORD,
    pulAuthPackage_in_out: PULONG,
    pvInAuthBuffer: OPTIONAL<LPCVOID>,
    ulInAuthBufferSize: ULONG,
    ppvOutAuthBuffer_out: PPVOID,
    pulOutAuthBufferSize_out: PULONG,
    pfSave_in_out: OPTIONAL<PBOOL>,
    dwFlags: DWORD,
  ): DWORD {
    return Credui.Load('CredUIPromptForWindowsCredentialsW')(pUiInfo, dwAuthError, pulAuthPackage_in_out, pvInAuthBuffer, ulInAuthBufferSize, ppvOutAuthBuffer_out, pulOutAuthBufferSize_out, pfSave_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduireadssocredw
  public static CredUIReadSSOCredW(pszRealm: OPTIONAL<PCWSTR>, ppszUsername_out: PPWSTR): DWORD {
    return Credui.Load('CredUIReadSSOCredW')(pszRealm, ppszUsername_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduistoressocredw
  public static CredUIStoreSSOCredW(pszRealm: OPTIONAL<PCWSTR>, pszUsername: PCWSTR, pszPassword: PCWSTR, bPersist: BOOL): DWORD {
    return Credui.Load('CredUIStoreSSOCredW')(pszRealm, pszUsername, pszPassword, bPersist);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credunpackauthenticationbuffera
  public static CredUnPackAuthenticationBufferA(
    dwFlags: DWORD,
    pAuthBuffer: LPVOID,
    cbAuthBuffer: DWORD,
    pszUserName_out: OPTIONAL<LPSTR>,
    pcchlMaxUserName_in_out: LPDWORD,
    pszDomainName_out: OPTIONAL<LPSTR>,
    pcchMaxDomainName_in_out: OPTIONAL<LPDWORD>,
    pszPassword_out: OPTIONAL<LPSTR>,
    pcchMaxPassword_in_out: LPDWORD,
  ): BOOL {
    return Credui.Load('CredUnPackAuthenticationBufferA')(dwFlags, pAuthBuffer, cbAuthBuffer, pszUserName_out, pcchlMaxUserName_in_out, pszDomainName_out, pcchMaxDomainName_in_out, pszPassword_out, pcchMaxPassword_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credunpackauthenticationbufferw
  public static CredUnPackAuthenticationBufferW(
    dwFlags: DWORD,
    pAuthBuffer: LPVOID,
    cbAuthBuffer: DWORD,
    pszUserName_out: OPTIONAL<LPWSTR>,
    pcchMaxUserName_in_out: LPDWORD,
    pszDomainName_out: OPTIONAL<LPWSTR>,
    pcchMaxDomainName_in_out: OPTIONAL<LPDWORD>,
    pszPassword_out: OPTIONAL<LPWSTR>,
    pcchMaxPassword_in_out: LPDWORD,
  ): BOOL {
    return Credui.Load('CredUnPackAuthenticationBufferW')(dwFlags, pAuthBuffer, cbAuthBuffer, pszUserName_out, pcchMaxUserName_in_out, pszDomainName_out, pcchMaxDomainName_in_out, pszPassword_out, pcchMaxPassword_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspigetcreduicontext
  public static SspiGetCredUIContext(ContextHandle: HANDLE, CredType: PGUID, LogonId: OPTIONAL<PLUID>, CredUIContexts_out: PPSEC_WINNT_CREDUI_CONTEXT_VECTOR, TokenHandle_out: OPTIONAL<PHANDLE>): SECURITY_STATUS {
    return Credui.Load('SspiGetCredUIContext')(ContextHandle, CredType, LogonId, CredUIContexts_out, TokenHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiispromptingneeded
  public static SspiIsPromptingNeeded(ErrorOrNtStatus: ULONG): BOOLEAN {
    return Credui.Load('SspiIsPromptingNeeded')(ErrorOrNtStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspipromptforcredentialsa
  public static SspiPromptForCredentialsA(
    pszTargetName: PCSTR,
    pUiInfo: OPTIONAL<PCREDUI_INFOA>,
    dwAuthError: ULONG,
    pszPackage: PCSTR,
    pInputAuthIdentity: OPTIONAL<PSEC_WINNT_AUTH_IDENTITY_OPAQUE>,
    ppAuthIdentity_out: PPSEC_WINNT_AUTH_IDENTITY_OPAQUE,
    pfSave_in_out: OPTIONAL<PINT>,
    dwFlags: ULONG,
  ): SECURITY_STATUS {
    return Credui.Load('SspiPromptForCredentialsA')(pszTargetName, pUiInfo, dwAuthError, pszPackage, pInputAuthIdentity, ppAuthIdentity_out, pfSave_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspipromptforcredentialsw
  public static SspiPromptForCredentialsW(
    pszTargetName: PCWSTR,
    pUiInfo: OPTIONAL<PCREDUI_INFOW>,
    dwAuthError: ULONG,
    pszPackage: PCWSTR,
    pInputAuthIdentity: OPTIONAL<PSEC_WINNT_AUTH_IDENTITY_OPAQUE>,
    ppAuthIdentity_out: PPSEC_WINNT_AUTH_IDENTITY_OPAQUE,
    pfSave_in_out: OPTIONAL<PINT>,
    dwFlags: ULONG,
  ): SECURITY_STATUS {
    return Credui.Load('SspiPromptForCredentialsW')(pszTargetName, pUiInfo, dwAuthError, pszPackage, pInputAuthIdentity, ppAuthIdentity_out, pfSave_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiunmarshalcreduicontext
  public static SspiUnmarshalCredUIContext(MarshaledCredUIContext: PUCHAR, MarshaledCredUIContextLength: ULONG, CredUIContext_out: PPSEC_WINNT_CREDUI_CONTEXT): SECURITY_STATUS {
    return Credui.Load('SspiUnmarshalCredUIContext')(MarshaledCredUIContext, MarshaledCredUIContextLength, CredUIContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiupdatecredentials
  public static SspiUpdateCredentials(ContextHandle: HANDLE, CredType: PGUID, FlatCredUIContextLength: ULONG, FlatCredUIContext: PUCHAR): SECURITY_STATUS {
    return Credui.Load('SspiUpdateCredentials')(ContextHandle, CredType, FlatCredUIContextLength, FlatCredUIContext);
  }
}

export default Credui;
