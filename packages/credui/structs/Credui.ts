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
  public static CredPackAuthenticationBufferA(dwFlags: DWORD, pszUserName: LPSTR, pszPassword: LPSTR, pPackedCredentials: PBYTE | NULL, pcbPackedCredentials: LPDWORD): BOOL {
    return Credui.Load('CredPackAuthenticationBufferA')(dwFlags, pszUserName, pszPassword, pPackedCredentials, pcbPackedCredentials);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credpackauthenticationbufferw
  public static CredPackAuthenticationBufferW(dwFlags: DWORD, pszUserName: LPWSTR, pszPassword: LPWSTR, pPackedCredentials: PBYTE | NULL, pcbPackedCredentials: LPDWORD): BOOL {
    return Credui.Load('CredPackAuthenticationBufferW')(dwFlags, pszUserName, pszPassword, pPackedCredentials, pcbPackedCredentials);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduicmdlinepromptforcredentialsa
  public static CredUICmdLinePromptForCredentialsA(
    pszTargetName: PCSTR | NULL,
    pContext: NULL,
    dwAuthError: DWORD,
    UserName: PSTR,
    ulUserBufferSize: ULONG,
    pszPassword: PSTR,
    ulPasswordBufferSize: ULONG,
    pfSave: PBOOL | NULL,
    dwFlags: DWORD,
  ): DWORD {
    return Credui.Load('CredUICmdLinePromptForCredentialsA')(pszTargetName, pContext, dwAuthError, UserName, ulUserBufferSize, pszPassword, ulPasswordBufferSize, pfSave, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduicmdlinepromptforcredentialsw
  public static CredUICmdLinePromptForCredentialsW(
    pszTargetName: PCWSTR | NULL,
    pContext: NULL,
    dwAuthError: DWORD,
    UserName: PWSTR,
    ulUserBufferSize: ULONG,
    pszPassword: PWSTR,
    ulPasswordBufferSize: ULONG,
    pfSave: PBOOL | NULL,
    dwFlags: DWORD,
  ): DWORD {
    return Credui.Load('CredUICmdLinePromptForCredentialsW')(pszTargetName, pContext, dwAuthError, UserName, ulUserBufferSize, pszPassword, ulPasswordBufferSize, pfSave, dwFlags);
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
  public static CredUIParseUserNameA(userName: PCSTR, user: PSTR, userBufferSize: ULONG, domain: PSTR, domainBufferSize: ULONG): DWORD {
    return Credui.Load('CredUIParseUserNameA')(userName, user, userBufferSize, domain, domainBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduiparseusernamew
  public static CredUIParseUserNameW(UserName: PCWSTR, user: PWSTR, userBufferSize: ULONG, domain: PWSTR, domainBufferSize: ULONG): DWORD {
    return Credui.Load('CredUIParseUserNameW')(UserName, user, userBufferSize, domain, domainBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduipromptforcredentialsa
  public static CredUIPromptForCredentialsA(
    pUiInfo: PCREDUI_INFOA | NULL,
    pszTargetName: PCSTR | NULL,
    pContext: NULL,
    dwAuthError: DWORD,
    pszUserName: PSTR,
    ulUserNameBufferSize: ULONG,
    pszPassword: PSTR,
    ulPasswordBufferSize: ULONG,
    save: PBOOL | NULL,
    dwFlags: DWORD,
  ): DWORD {
    return Credui.Load('CredUIPromptForCredentialsA')(pUiInfo, pszTargetName, pContext, dwAuthError, pszUserName, ulUserNameBufferSize, pszPassword, ulPasswordBufferSize, save, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduipromptforcredentialsw
  public static CredUIPromptForCredentialsW(
    pUiInfo: PCREDUI_INFOW | NULL,
    pszTargetName: PCWSTR | NULL,
    pContext: NULL,
    dwAuthError: DWORD,
    pszUserName: PWSTR,
    ulUserNameBufferSize: ULONG,
    pszPassword: PWSTR,
    ulPasswordBufferSize: ULONG,
    save: PBOOL | NULL,
    dwFlags: DWORD,
  ): DWORD {
    return Credui.Load('CredUIPromptForCredentialsW')(pUiInfo, pszTargetName, pContext, dwAuthError, pszUserName, ulUserNameBufferSize, pszPassword, ulPasswordBufferSize, save, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduipromptforwindowscredentialsa
  public static CredUIPromptForWindowsCredentialsA(
    pUiInfo: PCREDUI_INFOA | NULL,
    dwAuthError: DWORD,
    pulAuthPackage: PULONG,
    pvInAuthBuffer: LPCVOID | NULL,
    ulInAuthBufferSize: ULONG,
    ppvOutAuthBuffer: PPVOID,
    pulOutAuthBufferSize: PULONG,
    pfSave: PBOOL | NULL,
    dwFlags: DWORD,
  ): DWORD {
    return Credui.Load('CredUIPromptForWindowsCredentialsA')(pUiInfo, dwAuthError, pulAuthPackage, pvInAuthBuffer, ulInAuthBufferSize, ppvOutAuthBuffer, pulOutAuthBufferSize, pfSave, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduipromptforwindowscredentialsw
  public static CredUIPromptForWindowsCredentialsW(
    pUiInfo: PCREDUI_INFOW | NULL,
    dwAuthError: DWORD,
    pulAuthPackage: PULONG,
    pvInAuthBuffer: LPCVOID | NULL,
    ulInAuthBufferSize: ULONG,
    ppvOutAuthBuffer: PPVOID,
    pulOutAuthBufferSize: PULONG,
    pfSave: PBOOL | NULL,
    dwFlags: DWORD,
  ): DWORD {
    return Credui.Load('CredUIPromptForWindowsCredentialsW')(pUiInfo, dwAuthError, pulAuthPackage, pvInAuthBuffer, ulInAuthBufferSize, ppvOutAuthBuffer, pulOutAuthBufferSize, pfSave, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduireadssocredw
  public static CredUIReadSSOCredW(pszRealm: PCWSTR | NULL, ppszUsername: PPWSTR): DWORD {
    return Credui.Load('CredUIReadSSOCredW')(pszRealm, ppszUsername);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creduistoressocredw
  public static CredUIStoreSSOCredW(pszRealm: PCWSTR | NULL, pszUsername: PCWSTR, pszPassword: PCWSTR, bPersist: BOOL): DWORD {
    return Credui.Load('CredUIStoreSSOCredW')(pszRealm, pszUsername, pszPassword, bPersist);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credunpackauthenticationbuffera
  public static CredUnPackAuthenticationBufferA(
    dwFlags: DWORD,
    pAuthBuffer: LPVOID,
    cbAuthBuffer: DWORD,
    pszUserName: LPSTR | NULL,
    pcchlMaxUserName: LPDWORD,
    pszDomainName: LPSTR | NULL,
    pcchMaxDomainName: LPDWORD | NULL,
    pszPassword: LPSTR | NULL,
    pcchMaxPassword: LPDWORD,
  ): BOOL {
    return Credui.Load('CredUnPackAuthenticationBufferA')(dwFlags, pAuthBuffer, cbAuthBuffer, pszUserName, pcchlMaxUserName, pszDomainName, pcchMaxDomainName, pszPassword, pcchMaxPassword);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credunpackauthenticationbufferw
  public static CredUnPackAuthenticationBufferW(
    dwFlags: DWORD,
    pAuthBuffer: LPVOID,
    cbAuthBuffer: DWORD,
    pszUserName: LPWSTR | NULL,
    pcchMaxUserName: LPDWORD,
    pszDomainName: LPWSTR | NULL,
    pcchMaxDomainName: LPDWORD | NULL,
    pszPassword: LPWSTR | NULL,
    pcchMaxPassword: LPDWORD,
  ): BOOL {
    return Credui.Load('CredUnPackAuthenticationBufferW')(dwFlags, pAuthBuffer, cbAuthBuffer, pszUserName, pcchMaxUserName, pszDomainName, pcchMaxDomainName, pszPassword, pcchMaxPassword);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspigetcreduicontext
  public static SspiGetCredUIContext(ContextHandle: HANDLE, CredType: PGUID, LogonId: PLUID | NULL, CredUIContexts: PPSEC_WINNT_CREDUI_CONTEXT_VECTOR, TokenHandle: PHANDLE | NULL): SECURITY_STATUS {
    return Credui.Load('SspiGetCredUIContext')(ContextHandle, CredType, LogonId, CredUIContexts, TokenHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiispromptingneeded
  public static SspiIsPromptingNeeded(ErrorOrNtStatus: ULONG): BOOLEAN {
    return Credui.Load('SspiIsPromptingNeeded')(ErrorOrNtStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspipromptforcredentialsa
  public static SspiPromptForCredentialsA(
    pszTargetName: PCSTR,
    pUiInfo: PCREDUI_INFOA | NULL,
    dwAuthError: ULONG,
    pszPackage: PCSTR,
    pInputAuthIdentity: PSEC_WINNT_AUTH_IDENTITY_OPAQUE | NULL,
    ppAuthIdentity: PPSEC_WINNT_AUTH_IDENTITY_OPAQUE,
    pfSave: PINT | NULL,
    dwFlags: ULONG,
  ): SECURITY_STATUS {
    return Credui.Load('SspiPromptForCredentialsA')(pszTargetName, pUiInfo, dwAuthError, pszPackage, pInputAuthIdentity, ppAuthIdentity, pfSave, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspipromptforcredentialsw
  public static SspiPromptForCredentialsW(
    pszTargetName: PCWSTR,
    pUiInfo: PCREDUI_INFOW | NULL,
    dwAuthError: ULONG,
    pszPackage: PCWSTR,
    pInputAuthIdentity: PSEC_WINNT_AUTH_IDENTITY_OPAQUE | NULL,
    ppAuthIdentity: PPSEC_WINNT_AUTH_IDENTITY_OPAQUE,
    pfSave: PINT | NULL,
    dwFlags: ULONG,
  ): SECURITY_STATUS {
    return Credui.Load('SspiPromptForCredentialsW')(pszTargetName, pUiInfo, dwAuthError, pszPackage, pInputAuthIdentity, ppAuthIdentity, pfSave, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiunmarshalcreduicontext
  public static SspiUnmarshalCredUIContext(MarshaledCredUIContext: PUCHAR, MarshaledCredUIContextLength: ULONG, CredUIContext: PPSEC_WINNT_CREDUI_CONTEXT): SECURITY_STATUS {
    return Credui.Load('SspiUnmarshalCredUIContext')(MarshaledCredUIContext, MarshaledCredUIContextLength, CredUIContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sspi/nf-sspi-sspiupdatecredentials
  public static SspiUpdateCredentials(ContextHandle: HANDLE, CredType: PGUID, FlatCredUIContextLength: ULONG, FlatCredUIContext: PUCHAR): SECURITY_STATUS {
    return Credui.Load('SspiUpdateCredentials')(ContextHandle, CredType, FlatCredUIContextLength, FlatCredUIContext);
  }
}

export default Credui;
