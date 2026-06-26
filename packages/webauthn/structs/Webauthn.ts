import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  DWORD,
  HRESULT,
  HWND,
  LPBOOL,
  LPCGUID,
  LPCWSTR,
  LPGUID,
  LPPWEBAUTHN_ASSERTION,
  LPPWEBAUTHN_CREDENTIAL_ATTESTATION,
  LPPWEBAUTHN_CREDENTIAL_DETAILS_LIST,
  OPTIONAL,
  PCBYTE,
  PCWEBAUTHN_AUTHENTICATOR_GET_ASSERTION_OPTIONS,
  PCWEBAUTHN_AUTHENTICATOR_MAKE_CREDENTIAL_OPTIONS,
  PCWEBAUTHN_CLIENT_DATA,
  PCWEBAUTHN_COSE_CREDENTIAL_PARAMETERS,
  PCWEBAUTHN_GET_CREDENTIALS_OPTIONS,
  PCWEBAUTHN_RP_ENTITY_INFORMATION,
  PCWEBAUTHN_USER_ENTITY_INFORMATION,
  PCWSTR,
  PWEBAUTHN_ASSERTION,
  PWEBAUTHN_CREDENTIAL_ATTESTATION,
  PWEBAUTHN_CREDENTIAL_DETAILS_LIST,
} from '../types/Webauthn';

/**
 * Thin, lazy-loaded FFI bindings for `webauthn.dll`.
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
 * import Webauthn from './structs/Webauthn';
 *
 * // Lazy: bind on first call
 * const version = Webauthn.WebAuthNGetApiVersionNumber();
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Webauthn.Preload(['WebAuthNGetApiVersionNumber', 'WebAuthNIsUserVerifyingPlatformAuthenticatorAvailable']);
 * ```
 */
class Webauthn extends Win32 {
  protected static override name = 'webauthn.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    WebAuthNAuthenticatorGetAssertion: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WebAuthNAuthenticatorMakeCredential: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WebAuthNCancelCurrentOperation: { args: [FFIType.ptr], returns: FFIType.i32 },
    WebAuthNDeletePlatformCredential: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WebAuthNFreeAssertion: { args: [FFIType.u64], returns: FFIType.void },
    WebAuthNFreeCredentialAttestation: { args: [FFIType.u64], returns: FFIType.void },
    WebAuthNFreePlatformCredentialList: { args: [FFIType.u64], returns: FFIType.void },
    WebAuthNGetApiVersionNumber: { args: [], returns: FFIType.u32 },
    WebAuthNGetCancellationId: { args: [FFIType.ptr], returns: FFIType.i32 },
    WebAuthNGetErrorName: { args: [FFIType.i32], returns: FFIType.ptr },
    WebAuthNGetPlatformCredentialList: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WebAuthNGetW3CExceptionDOMError: { args: [FFIType.i32], returns: FFIType.i32 },
    WebAuthNIsUserVerifyingPlatformAuthenticatorAvailable: { args: [FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/webauthn/nf-webauthn-webauthnauthenticatorgetassertion
  public static WebAuthNAuthenticatorGetAssertion(
    hWnd: HWND,
    pwszRpId: LPCWSTR,
    pWebAuthNClientData: PCWEBAUTHN_CLIENT_DATA,
    pWebAuthNGetAssertionOptions: OPTIONAL<PCWEBAUTHN_AUTHENTICATOR_GET_ASSERTION_OPTIONS>,
    ppWebAuthNAssertion_out: LPPWEBAUTHN_ASSERTION,
  ): HRESULT {
    return Webauthn.Load('WebAuthNAuthenticatorGetAssertion')(hWnd, pwszRpId, pWebAuthNClientData, pWebAuthNGetAssertionOptions, ppWebAuthNAssertion_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/webauthn/nf-webauthn-webauthnauthenticatormakecredential
  public static WebAuthNAuthenticatorMakeCredential(
    hWnd: HWND,
    pRpInformation: PCWEBAUTHN_RP_ENTITY_INFORMATION,
    pUserInformation: PCWEBAUTHN_USER_ENTITY_INFORMATION,
    pPubKeyCredParams: PCWEBAUTHN_COSE_CREDENTIAL_PARAMETERS,
    pWebAuthNClientData: PCWEBAUTHN_CLIENT_DATA,
    pWebAuthNMakeCredentialOptions: OPTIONAL<PCWEBAUTHN_AUTHENTICATOR_MAKE_CREDENTIAL_OPTIONS>,
    ppWebAuthNCredentialAttestation_out: LPPWEBAUTHN_CREDENTIAL_ATTESTATION,
  ): HRESULT {
    return Webauthn.Load('WebAuthNAuthenticatorMakeCredential')(hWnd, pRpInformation, pUserInformation, pPubKeyCredParams, pWebAuthNClientData, pWebAuthNMakeCredentialOptions, ppWebAuthNCredentialAttestation_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/webauthn/nf-webauthn-webauthncancelcurrentoperation
  public static WebAuthNCancelCurrentOperation(pCancellationId: LPCGUID): HRESULT {
    return Webauthn.Load('WebAuthNCancelCurrentOperation')(pCancellationId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/webauthn/nf-webauthn-webauthndeleteplatformcredential
  public static WebAuthNDeletePlatformCredential(cbCredentialId: DWORD, pbCredentialId: PCBYTE): HRESULT {
    return Webauthn.Load('WebAuthNDeletePlatformCredential')(cbCredentialId, pbCredentialId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/webauthn/nf-webauthn-webauthnfreeassertion
  public static WebAuthNFreeAssertion(pWebAuthNAssertion: PWEBAUTHN_ASSERTION): void {
    return Webauthn.Load('WebAuthNFreeAssertion')(pWebAuthNAssertion);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/webauthn/nf-webauthn-webauthnfreecredentialattestation
  public static WebAuthNFreeCredentialAttestation(pWebAuthNCredentialAttestation: OPTIONAL<PWEBAUTHN_CREDENTIAL_ATTESTATION>): void {
    return Webauthn.Load('WebAuthNFreeCredentialAttestation')(pWebAuthNCredentialAttestation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/webauthn/nf-webauthn-webauthnfreeplatformcredentiallist
  public static WebAuthNFreePlatformCredentialList(pCredentialDetailsList: PWEBAUTHN_CREDENTIAL_DETAILS_LIST): void {
    return Webauthn.Load('WebAuthNFreePlatformCredentialList')(pCredentialDetailsList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/webauthn/nf-webauthn-webauthngetapiversionnumber
  public static WebAuthNGetApiVersionNumber(): DWORD {
    return Webauthn.Load('WebAuthNGetApiVersionNumber')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/webauthn/nf-webauthn-webauthngetcancellationid
  public static WebAuthNGetCancellationId(pCancellationId_out: LPGUID): HRESULT {
    return Webauthn.Load('WebAuthNGetCancellationId')(pCancellationId_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/webauthn/nf-webauthn-webauthngeterrorname
  public static WebAuthNGetErrorName(hr: HRESULT): PCWSTR {
    return Webauthn.Load('WebAuthNGetErrorName')(hr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/webauthn/nf-webauthn-webauthngetplatformcredentiallist
  public static WebAuthNGetPlatformCredentialList(pGetCredentialsOptions: PCWEBAUTHN_GET_CREDENTIALS_OPTIONS, ppCredentialDetailsList_out: LPPWEBAUTHN_CREDENTIAL_DETAILS_LIST): HRESULT {
    return Webauthn.Load('WebAuthNGetPlatformCredentialList')(pGetCredentialsOptions, ppCredentialDetailsList_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/webauthn/nf-webauthn-webauthngetw3cexceptiondomerror
  public static WebAuthNGetW3CExceptionDOMError(hr: HRESULT): HRESULT {
    return Webauthn.Load('WebAuthNGetW3CExceptionDOMError')(hr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/webauthn/nf-webauthn-webauthnisuserverifyingplatformauthenticatoravailable
  public static WebAuthNIsUserVerifyingPlatformAuthenticatorAvailable(pbIsUserVerifyingPlatformAuthenticatorAvailable_out: LPBOOL): HRESULT {
    return Webauthn.Load('WebAuthNIsUserVerifyingPlatformAuthenticatorAvailable')(pbIsUserVerifyingPlatformAuthenticatorAvailable_out);
  }
}

export default Webauthn;
