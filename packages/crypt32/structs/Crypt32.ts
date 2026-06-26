import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  ALG_ID,
  BCRYPT_KEY_HANDLE,
  BOOL,
  DWORD,
  HANDLE,
  HCERT_SERVER_OCSP_RESPONSE,
  HCERTCHAINENGINE,
  HCERTSTORE,
  HCRYPTASYNC,
  HCRYPTDEFAULTCONTEXT,
  HCRYPTMSG,
  HCRYPTOIDFUNCADDR,
  HCRYPTOIDFUNCSET,
  HCRYPTPROV,
  HCRYPTPROV_OR_NCRYPT_KEY_HANDLE,
  HMODULE,
  LPCSTR,
  LPCWSTR,
  LPDWORD,
  LONG,
  LPFILETIME,
  LPSTR,
  LPVOID,
  LPWSTR,
  Nullable,
  Optional,
  PBYTE,
  PCCERT_CHAIN_CONTEXT,
  PCCERT_CONTEXT,
  PCCERT_SELECT_CRITERIA,
  PCCERT_SERVER_OCSP_RESPONSE_CONTEXT,
  PCCRL_CONTEXT,
  PCCTL_CONTEXT,
  PCCRYPT_OID_INFO,
  PCERT_CHAIN_ENGINE_CONFIG,
  PCERT_CHAIN_PARA,
  PCERT_CHAIN_POLICY_PARA,
  PCERT_CHAIN_POLICY_STATUS,
  PCERT_CREATE_CONTEXT_PARA,
  PCERT_ENHKEY_USAGE,
  PCERT_EXTENSION,
  PCERT_EXTENSIONS,
  PCERT_INFO,
  PCERT_NAME_BLOB,
  PCERT_NAME_INFO,
  PCERT_PUBLIC_KEY_INFO,
  PCERT_RDN,
  PCERT_RDN_ATTR,
  PCERT_RDN_VALUE_BLOB,
  PCERT_REVOCATION_PARA,
  PCERT_REVOCATION_STATUS,
  PCERT_SERVER_OCSP_RESPONSE_OPEN_PARA,
  PCERT_STRONG_SIGN_PARA,
  PCMSG_SIGNED_ENCODE_INFO,
  PCMSG_SIGNER_ENCODE_INFO,
  PCMSG_STREAM_INFO,
  PCRL_INFO,
  PCRYPT_ALGORITHM_IDENTIFIER,
  PCRYPT_ATTRIBUTE,
  PCRYPT_DATA_BLOB,
  PCRYPT_DECODE_PARA,
  PCRYPT_DECRYPT_MESSAGE_PARA,
  PCRYPT_DER_BLOB,
  PCRYPT_ENCODE_PARA,
  PCRYPT_ENCRYPT_MESSAGE_PARA,
  PCRYPT_HASH_MESSAGE_PARA,
  PCRYPT_INTEGER_BLOB,
  PCRYPT_KEY_PROV_INFO,
  PCRYPT_KEY_SIGN_MESSAGE_PARA,
  PCRYPT_KEY_VERIFY_MESSAGE_PARA,
  PCRYPT_OID_FUNC_ENTRY,
  PCRYPT_SIGN_MESSAGE_PARA,
  PCRYPT_TIMESTAMP_CONTEXT,
  PCRYPT_TIMESTAMP_PARA,
  PCRYPT_VERIFY_MESSAGE_PARA,
  PCRYPTPROTECT_PROMPTSTRUCT,
  PCTL_ENTRY,
  PCTL_INFO,
  PCTL_USAGE,
  PCTL_VERIFY_USAGE_PARA,
  PCTL_VERIFY_USAGE_STATUS,
  PDATA_BLOB,
  PDWORD,
  PFN_CERT_ENUM_PHYSICAL_STORE,
  PFN_CERT_ENUM_SYSTEM_STORE,
  PFN_CERT_ENUM_SYSTEM_STORE_LOCATION,
  PFN_CRYPT_ENUM_KEYID_PROP,
  PFN_CRYPT_ENUM_OID_FUNC,
  PFN_CRYPT_ENUM_OID_INFO,
  PSIP_ADD_NEWPROVIDER,
  PSIP_CAP_SET_V3,
  PSIP_DISPATCH_INFO,
  PSIP_INDIRECT_DATA,
  PSIP_SUBJECTINFO,
  PSYSTEMTIME,
  PVOID,
  ULONG,
} from '../types/Crypt32';

/**
 * Thin, lazy-loaded FFI bindings for `crypt32.dll`.
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
 * import Crypt32 from './structs/Crypt32';
 *
 * // Lazy: bind on first call
 * const result = Crypt32.CryptBinaryToStringW(pbBinary, cbBinary, dwFlags, pszString, pcchString);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Crypt32.Preload(['CryptProtectData', 'CryptUnprotectData', 'CryptBinaryToStringW']);
 * ```
 */
class Crypt32 extends Win32 {
  protected static override name = 'crypt32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CertAddCRLContextToStore: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertAddCRLLinkToStore: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertAddCTLContextToStore: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertAddCTLLinkToStore: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertAddCertificateContextToStore: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertAddCertificateLinkToStore: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertAddEncodedCRLToStore: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertAddEncodedCTLToStore: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertAddEncodedCertificateToStore: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertAddEncodedCertificateToSystemStoreA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CertAddEncodedCertificateToSystemStoreW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CertAddEnhancedKeyUsageIdentifier: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertAddRefServerOcspResponse: { args: [FFIType.u64], returns: FFIType.void },
    CertAddRefServerOcspResponseContext: { args: [FFIType.ptr], returns: FFIType.void },
    CertAddSerializedElementToStore: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertAddStoreToCollection: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    CertAlgIdToOID: { args: [FFIType.u32], returns: FFIType.ptr },
    CertCloseServerOcspResponse: { args: [FFIType.u64, FFIType.u32], returns: FFIType.void },
    CertCloseStore: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    CertCompareCertificate: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertCompareCertificateName: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertCompareIntegerBlob: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertComparePublicKeyInfo: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertControlStore: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertCreateCRLContext: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    CertCreateCTLContext: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    CertCreateCTLEntryFromCertificateContextProperties: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertCreateCertificateChainEngine: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertCreateCertificateContext: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    CertCreateContext: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    CertCreateSelfSignCertificate: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CertDeleteCRLFromStore: { args: [FFIType.ptr], returns: FFIType.i32 },
    CertDeleteCTLFromStore: { args: [FFIType.ptr], returns: FFIType.i32 },
    CertDeleteCertificateFromStore: { args: [FFIType.ptr], returns: FFIType.i32 },
    CertDuplicateCRLContext: { args: [FFIType.ptr], returns: FFIType.ptr },
    CertDuplicateCTLContext: { args: [FFIType.ptr], returns: FFIType.ptr },
    CertDuplicateCertificateChain: { args: [FFIType.ptr], returns: FFIType.ptr },
    CertDuplicateCertificateContext: { args: [FFIType.ptr], returns: FFIType.ptr },
    CertDuplicateStore: { args: [FFIType.u64], returns: FFIType.u64 },
    CertEnumCRLContextProperties: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CertEnumCRLsInStore: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    CertEnumCTLContextProperties: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CertEnumCTLsInStore: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    CertEnumCertificateContextProperties: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CertEnumCertificatesInStore: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    CertEnumPhysicalStore: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertEnumSubjectInSortedCTL: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertEnumSystemStore: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertEnumSystemStoreLocation: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertFindAttribute: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    CertFindCRLInStore: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CertFindCTLInStore: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CertFindCertificateInCRL: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertFindCertificateInStore: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CertFindChainInStore: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CertFindExtension: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    CertFindRDNAttr: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CertFindSubjectInCTL: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    CertFindSubjectInSortedCTL: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertFreeCRLContext: { args: [FFIType.ptr], returns: FFIType.i32 },
    CertFreeCTLContext: { args: [FFIType.ptr], returns: FFIType.i32 },
    CertFreeCertificateChain: { args: [FFIType.ptr], returns: FFIType.void },
    CertFreeCertificateChainEngine: { args: [FFIType.u64], returns: FFIType.void },
    CertFreeCertificateChainList: { args: [FFIType.ptr], returns: FFIType.void },
    CertFreeCertificateContext: { args: [FFIType.ptr], returns: FFIType.i32 },
    CertFreeServerOcspResponseContext: { args: [FFIType.ptr], returns: FFIType.void },
    CertGetCRLContextProperty: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertGetCRLFromStore: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CertGetCTLContextProperty: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertGetCertificateChain: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertGetCertificateContextProperty: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertGetEnhancedKeyUsage: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertGetIntendedKeyUsage: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CertGetIssuerCertificateFromStore: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CertGetNameStringA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CertGetNameStringW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CertGetPublicKeyLength: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    CertGetServerOcspResponseContext: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    CertGetStoreProperty: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertGetSubjectCertificateFromStore: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    CertGetValidUsages: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertIsRDNAttrsInCertificateName: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertIsStrongHashToSign: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    CertIsWeakHash: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertIsValidCRLForCertificate: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertNameToStrA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CertNameToStrW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CertOIDToAlgId: { args: [FFIType.ptr], returns: FFIType.u32 },
    CertOpenServerOcspResponse: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CertOpenStore: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CertOpenSystemStoreA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    CertOpenSystemStoreW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    CertRDNValueToStrA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CertRDNValueToStrW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CertRegisterPhysicalStore: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CertRegisterSystemStore: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertRemoveEnhancedKeyUsageIdentifier: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertRemoveStoreFromCollection: { args: [FFIType.u64, FFIType.u64], returns: FFIType.void },
    CertResyncCertificateChainEngine: { args: [FFIType.u64], returns: FFIType.i32 },
    CertRetrieveLogoOrBiometricInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertSaveStore: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CertSelectCertificateChains: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertSerializeCRLStoreElement: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertSerializeCTLStoreElement: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertSerializeCertificateStoreElement: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertSetCRLContextProperty: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertSetCTLContextProperty: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertSetCertificateContextPropertiesFromCTLEntry: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CertSetCertificateContextProperty: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertSetEnhancedKeyUsage: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertSetStoreProperty: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertStrToNameA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertStrToNameW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertUnregisterPhysicalStore: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertUnregisterSystemStore: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CertVerifyCRLRevocation: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CertVerifyCRLTimeValidity: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertVerifyCTLUsage: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertVerifyCertificateChainPolicy: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertVerifyRevocation: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertVerifySubjectCertificateContext: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertVerifyTimeValidity: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CertVerifyValidityNesting: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptAcquireCertificatePrivateKey: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptBinaryToStringA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptBinaryToStringW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptCloseAsyncHandle: { args: [FFIType.u64], returns: FFIType.i32 },
    CryptCreateAsyncHandle: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptCreateKeyIdentifierFromCSP: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptDecodeMessage: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptDecodeObject: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptDecodeObjectEx: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptDecryptAndVerifyMessageSignature: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptDecryptMessage: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptEncodeObject: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptEncodeObjectEx: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptEncryptMessage: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptEnumKeyIdentifierProperties: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptEnumOIDFunction: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptEnumOIDInfo: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptExportPKCS8: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptExportPublicKeyInfo: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptExportPublicKeyInfoEx: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptExportPublicKeyInfoFromBCryptKeyHandle: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptFindCertificateKeyProvInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptFindLocalizedName: { args: [FFIType.ptr], returns: FFIType.ptr },
    CryptFindOIDInfo: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    CryptFormatObject: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptFreeOIDFunctionAddress: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    CryptGetAsyncParam: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptGetDefaultOIDDllList: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptGetDefaultOIDFunctionAddress: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptGetKeyIdentifierProperty: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptGetMessageCertificates: { args: [FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    CryptGetMessageSignerCount: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptGetOIDFunctionAddress: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptGetOIDFunctionValue: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptHashCertificate: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptHashCertificate2: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptHashMessage: { args: [FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptHashPublicKeyInfo: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptHashToBeSigned: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptImportPKCS8: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptImportPublicKeyInfo: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptImportPublicKeyInfoEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptImportPublicKeyInfoEx2: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptInitOIDFunctionSet: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    CryptInstallDefaultContext: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptInstallOIDFunctionAddress: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptMemAlloc: { args: [FFIType.u32], returns: FFIType.ptr },
    CryptMemFree: { args: [FFIType.ptr], returns: FFIType.void },
    CryptMemRealloc: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    CryptMsgCalculateEncodedLength: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CryptMsgClose: { args: [FFIType.u64], returns: FFIType.i32 },
    CryptMsgControl: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptMsgCountersign: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptMsgCountersignEncoded: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptMsgDuplicate: { args: [FFIType.u64], returns: FFIType.u64 },
    CryptMsgEncodeAndSignCTL: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptMsgGetAndVerifySigner: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptMsgGetParam: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptMsgOpenToDecode: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CryptMsgOpenToEncode: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CryptMsgSignCTL: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptMsgUpdate: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    CryptMsgVerifyCountersignatureEncoded: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptMsgVerifyCountersignatureEncodedEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptProtectData: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptQueryObject: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptRegisterDefaultOIDFunction: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptRegisterOIDFunction: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptRegisterOIDInfo: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptRetrieveTimeStamp: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptSIPAddProvider: { args: [FFIType.ptr], returns: FFIType.i32 },
    CryptSIPCreateIndirectData: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptSIPGetCaps: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptSIPGetSealedDigest: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptSIPGetSignedDataMsg: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptSIPLoad: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptSIPPutSignedDataMsg: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptSIPRemoveProvider: { args: [FFIType.ptr], returns: FFIType.i32 },
    CryptSIPRemoveSignedDataMsg: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptSIPRetrieveSubjectGuid: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CryptSIPRetrieveSubjectGuidForCatalogFile: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CryptSIPVerifyIndirectData: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptSetAsyncParam: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptSetKeyIdentifierProperty: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptSetOIDFunctionValue: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptSignAndEncodeCertificate: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptSignAndEncryptMessage: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptSignCertificate: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptSignMessage: { args: [FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptSignMessageWithKey: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptStringToBinaryA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptStringToBinaryW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptUninstallDefaultContext: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptUnprotectData: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptUnregisterDefaultOIDFunction: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptUnregisterOIDFunction: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptUnregisterOIDInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    CryptVerifyCertificateSignature: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptVerifyCertificateSignatureEx: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptVerifyDetachedMessageHash: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptVerifyDetachedMessageSignature: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptVerifyMessageHash: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptVerifyMessageSignature: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptVerifyMessageSignatureWithKey: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptVerifyTimeStampSignature: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PFXExportCertStore: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PFXExportCertStoreEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PFXImportCertStore: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    PFXIsPFXBlob: { args: [FFIType.ptr], returns: FFIType.i32 },
    PFXVerifyPassword: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddcrlcontexttostore
  public static CertAddCRLContextToStore(hCertStore: Optional<HCERTSTORE>, pCrlContext: PCCRL_CONTEXT, dwAddDisposition: DWORD, ppStoreContext_out: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertAddCRLContextToStore')(hCertStore, pCrlContext, dwAddDisposition, ppStoreContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddcrllinktostore
  public static CertAddCRLLinkToStore(hCertStore: HCERTSTORE, pCrlContext: PCCRL_CONTEXT, dwAddDisposition: DWORD, ppStoreContext_out: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertAddCRLLinkToStore')(hCertStore, pCrlContext, dwAddDisposition, ppStoreContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddctlcontexttostore
  public static CertAddCTLContextToStore(hCertStore: Optional<HCERTSTORE>, pCtlContext: PCCTL_CONTEXT, dwAddDisposition: DWORD, ppStoreContext_out: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertAddCTLContextToStore')(hCertStore, pCtlContext, dwAddDisposition, ppStoreContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddctllinktostore
  public static CertAddCTLLinkToStore(hCertStore: HCERTSTORE, pCtlContext: PCCTL_CONTEXT, dwAddDisposition: DWORD, ppStoreContext_out: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertAddCTLLinkToStore')(hCertStore, pCtlContext, dwAddDisposition, ppStoreContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddcertificatecontexttostore
  public static CertAddCertificateContextToStore(hCertStore: Optional<HCERTSTORE>, pCertContext: PCCERT_CONTEXT, dwAddDisposition: DWORD, ppStoreContext_out: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertAddCertificateContextToStore')(hCertStore, pCertContext, dwAddDisposition, ppStoreContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddcertificatelinktostore
  public static CertAddCertificateLinkToStore(hCertStore: HCERTSTORE, pCertContext: PCCERT_CONTEXT, dwAddDisposition: DWORD, ppStoreContext_out: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertAddCertificateLinkToStore')(hCertStore, pCertContext, dwAddDisposition, ppStoreContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddencodedcrltostore
  public static CertAddEncodedCRLToStore(hCertStore: Optional<HCERTSTORE>, dwCertEncodingType: DWORD, pbCrlEncoded: PBYTE, cbCrlEncoded: DWORD, dwAddDisposition: DWORD, ppCrlContext_out: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertAddEncodedCRLToStore')(hCertStore, dwCertEncodingType, pbCrlEncoded, cbCrlEncoded, dwAddDisposition, ppCrlContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddencodedctltostore
  public static CertAddEncodedCTLToStore(hCertStore: Optional<HCERTSTORE>, dwMsgAndCertEncodingType: DWORD, pbCtlEncoded: PBYTE, cbCtlEncoded: DWORD, dwAddDisposition: DWORD, ppCtlContext_out: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertAddEncodedCTLToStore')(hCertStore, dwMsgAndCertEncodingType, pbCtlEncoded, cbCtlEncoded, dwAddDisposition, ppCtlContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddencodedcertificatetostore
  public static CertAddEncodedCertificateToStore(hCertStore: Optional<HCERTSTORE>, dwCertEncodingType: DWORD, pbCertEncoded: PBYTE, cbCertEncoded: DWORD, dwAddDisposition: DWORD, ppCertContext_out: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertAddEncodedCertificateToStore')(hCertStore, dwCertEncodingType, pbCertEncoded, cbCertEncoded, dwAddDisposition, ppCertContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddencodedcertificatetosystemstorea
  public static CertAddEncodedCertificateToSystemStoreA(szCertStoreName: LPCSTR, pbCertEncoded: PBYTE, cbCertEncoded: DWORD): BOOL {
    return Crypt32.Load('CertAddEncodedCertificateToSystemStoreA')(szCertStoreName, pbCertEncoded, cbCertEncoded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddencodedcertificatetosystemstorew
  public static CertAddEncodedCertificateToSystemStoreW(szCertStoreName: LPCWSTR, pbCertEncoded: PBYTE, cbCertEncoded: DWORD): BOOL {
    return Crypt32.Load('CertAddEncodedCertificateToSystemStoreW')(szCertStoreName, pbCertEncoded, cbCertEncoded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddenhancedkeyusageidentifier
  public static CertAddEnhancedKeyUsageIdentifier(pCertContext: PCCERT_CONTEXT, pszUsageIdentifier: LPCSTR): BOOL {
    return Crypt32.Load('CertAddEnhancedKeyUsageIdentifier')(pCertContext, pszUsageIdentifier);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddrefserverocspresponse
  public static CertAddRefServerOcspResponse(hServerOcspResponse: Optional<HCERT_SERVER_OCSP_RESPONSE>): void {
    return Crypt32.Load('CertAddRefServerOcspResponse')(hServerOcspResponse);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddrefserverocspresponsecontext
  public static CertAddRefServerOcspResponseContext(pServerOcspResponseContext: Optional<PCCERT_SERVER_OCSP_RESPONSE_CONTEXT>): void {
    return Crypt32.Load('CertAddRefServerOcspResponseContext')(pServerOcspResponseContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddserializedelementtostore
  public static CertAddSerializedElementToStore(
    hCertStore: Optional<HCERTSTORE>,
    pbElement: PBYTE,
    cbElement: DWORD,
    dwAddDisposition: DWORD,
    dwFlags: DWORD,
    dwContextTypeFlags: DWORD,
    pdwContextType_out: Optional<PDWORD>,
    ppvContext_out: Optional<PVOID>,
  ): BOOL {
    return Crypt32.Load('CertAddSerializedElementToStore')(hCertStore, pbElement, cbElement, dwAddDisposition, dwFlags, dwContextTypeFlags, pdwContextType_out, ppvContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certaddstoretocollection
  public static CertAddStoreToCollection(hCollectionStore: HCERTSTORE, hSiblingStore: Optional<HCERTSTORE>, dwUpdateFlags: DWORD, dwPriority: DWORD): BOOL {
    return Crypt32.Load('CertAddStoreToCollection')(hCollectionStore, hSiblingStore, dwUpdateFlags, dwPriority);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certalgidtooid
  public static CertAlgIdToOID(dwAlgId: DWORD): LPCSTR {
    return Crypt32.Load('CertAlgIdToOID')(dwAlgId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certcloseserverocspresponse
  public static CertCloseServerOcspResponse(hServerOcspResponse: Optional<HCERT_SERVER_OCSP_RESPONSE>, dwFlags: DWORD): void {
    return Crypt32.Load('CertCloseServerOcspResponse')(hServerOcspResponse, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certclosestore
  public static CertCloseStore(hCertStore: Optional<HCERTSTORE>, dwFlags: DWORD): BOOL {
    return Crypt32.Load('CertCloseStore')(hCertStore, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certcomparecertificate
  public static CertCompareCertificate(dwCertEncodingType: DWORD, pCertId1: PCERT_INFO, pCertId2: PCERT_INFO): BOOL {
    return Crypt32.Load('CertCompareCertificate')(dwCertEncodingType, pCertId1, pCertId2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certcomparecertificatename
  public static CertCompareCertificateName(dwCertEncodingType: DWORD, pCertName1: PCERT_NAME_BLOB, pCertName2: PCERT_NAME_BLOB): BOOL {
    return Crypt32.Load('CertCompareCertificateName')(dwCertEncodingType, pCertName1, pCertName2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certcompareintegerblob
  public static CertCompareIntegerBlob(pInt1: PCRYPT_INTEGER_BLOB, pInt2: PCRYPT_INTEGER_BLOB): BOOL {
    return Crypt32.Load('CertCompareIntegerBlob')(pInt1, pInt2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certcomparepublickeyinfo
  public static CertComparePublicKeyInfo(dwCertEncodingType: DWORD, pPublicKey1: PCERT_PUBLIC_KEY_INFO, pPublicKey2: PCERT_PUBLIC_KEY_INFO): BOOL {
    return Crypt32.Load('CertComparePublicKeyInfo')(dwCertEncodingType, pPublicKey1, pPublicKey2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certcontrolstore
  public static CertControlStore(hCertStore: HCERTSTORE, dwFlags: DWORD, dwCtrlType: DWORD, pvCtrlPara: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertControlStore')(hCertStore, dwFlags, dwCtrlType, pvCtrlPara);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certcreatecrlcontext
  public static CertCreateCRLContext(dwCertEncodingType: DWORD, pbCrlEncoded: PBYTE, cbCrlEncoded: DWORD): PCCRL_CONTEXT {
    return Crypt32.Load('CertCreateCRLContext')(dwCertEncodingType, pbCrlEncoded, cbCrlEncoded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certcreatectlcontext
  public static CertCreateCTLContext(dwMsgAndCertEncodingType: DWORD, pbCtlEncoded: PBYTE, cbCtlEncoded: DWORD): PCCTL_CONTEXT {
    return Crypt32.Load('CertCreateCTLContext')(dwMsgAndCertEncodingType, pbCtlEncoded, cbCtlEncoded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certcreatectlentryfromcertificatecontextproperties
  public static CertCreateCTLEntryFromCertificateContextProperties(
    pCertContext: PCCERT_CONTEXT,
    cOptAttr: DWORD,
    rgOptAttr: Optional<PCRYPT_ATTRIBUTE>,
    dwFlags: DWORD,
    pvReserved: Optional<PVOID>,
    pCtlEntry_out: Optional<PCTL_ENTRY>,
    pcbCtlEntry_in_out: PDWORD,
  ): BOOL {
    return Crypt32.Load('CertCreateCTLEntryFromCertificateContextProperties')(pCertContext, cOptAttr, rgOptAttr, dwFlags, pvReserved, pCtlEntry_out, pcbCtlEntry_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certcreatecertificatechainengine
  public static CertCreateCertificateChainEngine(pConfig: PCERT_CHAIN_ENGINE_CONFIG, phChainEngine_out: PVOID): BOOL {
    return Crypt32.Load('CertCreateCertificateChainEngine')(pConfig, phChainEngine_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certcreatecertificatecontext
  public static CertCreateCertificateContext(dwCertEncodingType: DWORD, pbCertEncoded: PBYTE, cbCertEncoded: DWORD): PCCERT_CONTEXT {
    return Crypt32.Load('CertCreateCertificateContext')(dwCertEncodingType, pbCertEncoded, cbCertEncoded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certcreatecontext
  public static CertCreateContext(dwContextType: DWORD, dwEncodingType: DWORD, pbEncoded: PBYTE, cbEncoded: DWORD, dwFlags: DWORD, pCreatePara: Optional<PCERT_CREATE_CONTEXT_PARA>): PVOID {
    return Crypt32.Load('CertCreateContext')(dwContextType, dwEncodingType, pbEncoded, cbEncoded, dwFlags, pCreatePara);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certcreateselfsigncertificate
  public static CertCreateSelfSignCertificate(
    hCryptProvOrNCryptKey: Optional<HCRYPTPROV_OR_NCRYPT_KEY_HANDLE>,
    pSubjectIssuerBlob: PCERT_NAME_BLOB,
    dwFlags: DWORD,
    pKeyProvInfo: Optional<PCRYPT_KEY_PROV_INFO>,
    pSignatureAlgorithm: Optional<PCRYPT_ALGORITHM_IDENTIFIER>,
    pStartTime: Optional<PSYSTEMTIME>,
    pEndTime: Optional<PSYSTEMTIME>,
    pExtensions: Optional<PCERT_EXTENSIONS>,
  ): PCCERT_CONTEXT {
    return Crypt32.Load('CertCreateSelfSignCertificate')(hCryptProvOrNCryptKey, pSubjectIssuerBlob, dwFlags, pKeyProvInfo, pSignatureAlgorithm, pStartTime, pEndTime, pExtensions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certdeletecrlfromstore
  public static CertDeleteCRLFromStore(pCrlContext: PCCRL_CONTEXT): BOOL {
    return Crypt32.Load('CertDeleteCRLFromStore')(pCrlContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certdeletectlfromstore
  public static CertDeleteCTLFromStore(pCtlContext: PCCTL_CONTEXT): BOOL {
    return Crypt32.Load('CertDeleteCTLFromStore')(pCtlContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certdeletecertificatefromstore
  public static CertDeleteCertificateFromStore(pCertContext: PCCERT_CONTEXT): BOOL {
    return Crypt32.Load('CertDeleteCertificateFromStore')(pCertContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certduplicatecrlcontext
  public static CertDuplicateCRLContext(pCrlContext: Optional<PCCRL_CONTEXT>): PCCRL_CONTEXT {
    return Crypt32.Load('CertDuplicateCRLContext')(pCrlContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certduplicatectlcontext
  public static CertDuplicateCTLContext(pCtlContext: Optional<PCCTL_CONTEXT>): PCCTL_CONTEXT {
    return Crypt32.Load('CertDuplicateCTLContext')(pCtlContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certduplicatecertificatechain
  public static CertDuplicateCertificateChain(pChainContext: PCCERT_CHAIN_CONTEXT): PCCERT_CHAIN_CONTEXT {
    return Crypt32.Load('CertDuplicateCertificateChain')(pChainContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certduplicatecertificatecontext
  public static CertDuplicateCertificateContext(pCertContext: Optional<PCCERT_CONTEXT>): PCCERT_CONTEXT {
    return Crypt32.Load('CertDuplicateCertificateContext')(pCertContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certduplicatestore
  public static CertDuplicateStore(hCertStore: HCERTSTORE): HCERTSTORE {
    return Crypt32.Load('CertDuplicateStore')(hCertStore);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certenumcrlcontextproperties
  public static CertEnumCRLContextProperties(pCrlContext: PCCRL_CONTEXT, dwPropId: DWORD): DWORD {
    return Crypt32.Load('CertEnumCRLContextProperties')(pCrlContext, dwPropId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certenumcrlsinstore
  public static CertEnumCRLsInStore(hCertStore: HCERTSTORE, pPrevCrlContext: Optional<PCCRL_CONTEXT>): PCCRL_CONTEXT {
    return Crypt32.Load('CertEnumCRLsInStore')(hCertStore, pPrevCrlContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certenumctlcontextproperties
  public static CertEnumCTLContextProperties(pCtlContext: PCCTL_CONTEXT, dwPropId: DWORD): DWORD {
    return Crypt32.Load('CertEnumCTLContextProperties')(pCtlContext, dwPropId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certenumctlsinstore
  public static CertEnumCTLsInStore(hCertStore: HCERTSTORE, pPrevCtlContext: Optional<PCCTL_CONTEXT>): PCCTL_CONTEXT {
    return Crypt32.Load('CertEnumCTLsInStore')(hCertStore, pPrevCtlContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certenumcertificatecontextproperties
  public static CertEnumCertificateContextProperties(pCertContext: PCCERT_CONTEXT, dwPropId: DWORD): DWORD {
    return Crypt32.Load('CertEnumCertificateContextProperties')(pCertContext, dwPropId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certenumcertificatesinstore
  public static CertEnumCertificatesInStore(hCertStore: HCERTSTORE, pPrevCertContext: Optional<PCCERT_CONTEXT>): PCCERT_CONTEXT {
    return Crypt32.Load('CertEnumCertificatesInStore')(hCertStore, pPrevCertContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certenumphysicalstore
  public static CertEnumPhysicalStore(pvSystemStore: PVOID, dwFlags: DWORD, pvArg_in_out: Optional<PVOID>, pfnEnum: PFN_CERT_ENUM_PHYSICAL_STORE): BOOL {
    return Crypt32.Load('CertEnumPhysicalStore')(pvSystemStore, dwFlags, pvArg_in_out, pfnEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certenumsubjectinsortedctl
  public static CertEnumSubjectInSortedCTL(pCtlContext: PCCTL_CONTEXT, ppvNextSubject_in_out: PVOID, pSubjectIdentifier_out: Optional<PCRYPT_DER_BLOB>, pEncodedAttributes_out: Optional<PCRYPT_DER_BLOB>): BOOL {
    return Crypt32.Load('CertEnumSubjectInSortedCTL')(pCtlContext, ppvNextSubject_in_out, pSubjectIdentifier_out, pEncodedAttributes_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certenumsystemstore
  public static CertEnumSystemStore(dwFlags: DWORD, pvSystemStoreLocationPara: Optional<PVOID>, pvArg_in_out: Optional<PVOID>, pfnEnum: PFN_CERT_ENUM_SYSTEM_STORE): BOOL {
    return Crypt32.Load('CertEnumSystemStore')(dwFlags, pvSystemStoreLocationPara, pvArg_in_out, pfnEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certenumsystemstorelocation
  public static CertEnumSystemStoreLocation(dwFlags: DWORD, pvArg_in_out: Optional<PVOID>, pfnEnum: PFN_CERT_ENUM_SYSTEM_STORE_LOCATION): BOOL {
    return Crypt32.Load('CertEnumSystemStoreLocation')(dwFlags, pvArg_in_out, pfnEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfindattribute
  public static CertFindAttribute(pszObjId: LPCSTR, cAttr: DWORD, rgAttr: PCRYPT_ATTRIBUTE): PCRYPT_ATTRIBUTE {
    return Crypt32.Load('CertFindAttribute')(pszObjId, cAttr, rgAttr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfindcrlinstore
  public static CertFindCRLInStore(hCertStore: HCERTSTORE, dwCertEncodingType: DWORD, dwFindFlags: DWORD, dwFindType: DWORD, pvFindPara: Optional<PVOID>, pPrevCrlContext: Optional<PCCRL_CONTEXT>): PCCRL_CONTEXT {
    return Crypt32.Load('CertFindCRLInStore')(hCertStore, dwCertEncodingType, dwFindFlags, dwFindType, pvFindPara, pPrevCrlContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfindctlinstore
  public static CertFindCTLInStore(hCertStore: HCERTSTORE, dwMsgAndCertEncodingType: DWORD, dwFindFlags: DWORD, dwFindType: DWORD, pvFindPara: Optional<PVOID>, pPrevCtlContext: Optional<PCCTL_CONTEXT>): PCCTL_CONTEXT {
    return Crypt32.Load('CertFindCTLInStore')(hCertStore, dwMsgAndCertEncodingType, dwFindFlags, dwFindType, pvFindPara, pPrevCtlContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfindcertificateincrl
  public static CertFindCertificateInCRL(pCert: PCCERT_CONTEXT, pCrlContext: PCCRL_CONTEXT, dwFlags: DWORD, pvReserved: Optional<PVOID>, ppCrlEntry_out: PVOID): BOOL {
    return Crypt32.Load('CertFindCertificateInCRL')(pCert, pCrlContext, dwFlags, pvReserved, ppCrlEntry_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfindcertificateinstore
  public static CertFindCertificateInStore(hCertStore: HCERTSTORE, dwCertEncodingType: DWORD, dwFindFlags: DWORD, dwFindType: DWORD, pvFindPara: Optional<PVOID>, pPrevCertContext: Optional<PCCERT_CONTEXT>): PCCERT_CONTEXT {
    return Crypt32.Load('CertFindCertificateInStore')(hCertStore, dwCertEncodingType, dwFindFlags, dwFindType, pvFindPara, pPrevCertContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfindchaininstore
  public static CertFindChainInStore(hCertStore: HCERTSTORE, dwCertEncodingType: DWORD, dwFindFlags: DWORD, dwFindType: DWORD, pvFindPara: Optional<PVOID>, pPrevChainContext: Optional<PCCERT_CHAIN_CONTEXT>): PCCERT_CHAIN_CONTEXT {
    return Crypt32.Load('CertFindChainInStore')(hCertStore, dwCertEncodingType, dwFindFlags, dwFindType, pvFindPara, pPrevChainContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfindextension
  public static CertFindExtension(pszObjId: LPCSTR, cExtensions: DWORD, rgExtensions: PCERT_EXTENSION): PCERT_EXTENSION {
    return Crypt32.Load('CertFindExtension')(pszObjId, cExtensions, rgExtensions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfindrdnattr
  public static CertFindRDNAttr(pszObjId: LPCSTR, pName: PCERT_NAME_INFO): PCERT_RDN_ATTR {
    return Crypt32.Load('CertFindRDNAttr')(pszObjId, pName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfindsubjectinctl
  public static CertFindSubjectInCTL(dwEncodingType: DWORD, dwSubjectType: DWORD, pvSubject: PVOID, pCtlContext: PCCTL_CONTEXT, dwFlags: DWORD): PCTL_ENTRY {
    return Crypt32.Load('CertFindSubjectInCTL')(dwEncodingType, dwSubjectType, pvSubject, pCtlContext, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfindsubjectinsortedctl
  public static CertFindSubjectInSortedCTL(pSubjectIdentifier: PCRYPT_DATA_BLOB, pCtlContext: PCCTL_CONTEXT, dwFlags: DWORD, pvReserved: Optional<PVOID>, pEncodedAttributes_out: Optional<PCRYPT_DER_BLOB>): BOOL {
    return Crypt32.Load('CertFindSubjectInSortedCTL')(pSubjectIdentifier, pCtlContext, dwFlags, pvReserved, pEncodedAttributes_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfreecrlcontext
  public static CertFreeCRLContext(pCrlContext: Optional<PCCRL_CONTEXT>): BOOL {
    return Crypt32.Load('CertFreeCRLContext')(pCrlContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfreectlcontext
  public static CertFreeCTLContext(pCtlContext: Optional<PCCTL_CONTEXT>): BOOL {
    return Crypt32.Load('CertFreeCTLContext')(pCtlContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfreecertificatechain
  public static CertFreeCertificateChain(pChainContext: PCCERT_CHAIN_CONTEXT): void {
    return Crypt32.Load('CertFreeCertificateChain')(pChainContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfreecertificatechainengine
  public static CertFreeCertificateChainEngine(hChainEngine: Optional<HCERTCHAINENGINE>): void {
    return Crypt32.Load('CertFreeCertificateChainEngine')(hChainEngine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfreecertificatechainlist
  public static CertFreeCertificateChainList(prgpSelection: PVOID): void {
    return Crypt32.Load('CertFreeCertificateChainList')(prgpSelection);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfreecertificatecontext
  public static CertFreeCertificateContext(pCertContext: Optional<PCCERT_CONTEXT>): BOOL {
    return Crypt32.Load('CertFreeCertificateContext')(pCertContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certfreeserverocspresponsecontext
  public static CertFreeServerOcspResponseContext(pServerOcspResponseContext: Optional<PCCERT_SERVER_OCSP_RESPONSE_CONTEXT>): void {
    return Crypt32.Load('CertFreeServerOcspResponseContext')(pServerOcspResponseContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certgetcrlcontextproperty
  public static CertGetCRLContextProperty(pCrlContext: PCCRL_CONTEXT, dwPropId: DWORD, pvData_out: Optional<PVOID>, pcbData_in_out: PDWORD): BOOL {
    return Crypt32.Load('CertGetCRLContextProperty')(pCrlContext, dwPropId, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certgetcrlfromstore
  public static CertGetCRLFromStore(hCertStore: HCERTSTORE, pIssuerContext: Optional<PCCERT_CONTEXT>, pPrevCrlContext: Optional<PCCRL_CONTEXT>, pdwFlags_in_out: PDWORD): PCCRL_CONTEXT {
    return Crypt32.Load('CertGetCRLFromStore')(hCertStore, pIssuerContext, pPrevCrlContext, pdwFlags_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certgetctlcontextproperty
  public static CertGetCTLContextProperty(pCtlContext: PCCTL_CONTEXT, dwPropId: DWORD, pvData_out: Optional<PVOID>, pcbData_in_out: PDWORD): BOOL {
    return Crypt32.Load('CertGetCTLContextProperty')(pCtlContext, dwPropId, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certgetcertificatechain
  public static CertGetCertificateChain(
    hChainEngine: Optional<HCERTCHAINENGINE>,
    pCertContext: PCCERT_CONTEXT,
    pTime: Optional<LPFILETIME>,
    hAdditionalStore: Optional<HCERTSTORE>,
    pChainPara: PCERT_CHAIN_PARA,
    dwFlags: DWORD,
    pvReserved: Optional<PVOID>,
    ppChainContext_out: PVOID,
  ): BOOL {
    return Crypt32.Load('CertGetCertificateChain')(hChainEngine, pCertContext, pTime, hAdditionalStore, pChainPara, dwFlags, pvReserved, ppChainContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certgetcertificatecontextproperty
  public static CertGetCertificateContextProperty(pCertContext: PCCERT_CONTEXT, dwPropId: DWORD, pvData_out: Optional<PVOID>, pcbData_in_out: PDWORD): BOOL {
    return Crypt32.Load('CertGetCertificateContextProperty')(pCertContext, dwPropId, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certgetenhancedkeyusage
  public static CertGetEnhancedKeyUsage(pCertContext: PCCERT_CONTEXT, dwFlags: DWORD, pUsage_out: Optional<PCERT_ENHKEY_USAGE>, pcbUsage_in_out: PDWORD): BOOL {
    return Crypt32.Load('CertGetEnhancedKeyUsage')(pCertContext, dwFlags, pUsage_out, pcbUsage_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certgetintendedkeyusage
  public static CertGetIntendedKeyUsage(dwCertEncodingType: DWORD, pCertInfo: PCERT_INFO, pbKeyUsage_out: PBYTE, cbKeyUsage: DWORD): BOOL {
    return Crypt32.Load('CertGetIntendedKeyUsage')(dwCertEncodingType, pCertInfo, pbKeyUsage_out, cbKeyUsage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certgetissuercertificatefromstore
  public static CertGetIssuerCertificateFromStore(hCertStore: HCERTSTORE, pSubjectContext: PCCERT_CONTEXT, pPrevIssuerContext: Optional<PCCERT_CONTEXT>, pdwFlags_in_out: PDWORD): PCCERT_CONTEXT {
    return Crypt32.Load('CertGetIssuerCertificateFromStore')(hCertStore, pSubjectContext, pPrevIssuerContext, pdwFlags_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certgetnamestringA
  public static CertGetNameStringA(pCertContext: PCCERT_CONTEXT, dwType: DWORD, dwFlags: DWORD, pvTypePara: Optional<PVOID>, pszNameString_out: Optional<LPSTR>, cchNameString: DWORD): DWORD {
    return Crypt32.Load('CertGetNameStringA')(pCertContext, dwType, dwFlags, pvTypePara, pszNameString_out, cchNameString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certgetnamestringw
  public static CertGetNameStringW(pCertContext: PCCERT_CONTEXT, dwType: DWORD, dwFlags: DWORD, pvTypePara: Optional<PVOID>, pszNameString_out: Optional<LPWSTR>, cchNameString: DWORD): DWORD {
    return Crypt32.Load('CertGetNameStringW')(pCertContext, dwType, dwFlags, pvTypePara, pszNameString_out, cchNameString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certgetpublickeylength
  public static CertGetPublicKeyLength(dwCertEncodingType: DWORD, pPublicKey: PCERT_PUBLIC_KEY_INFO): DWORD {
    return Crypt32.Load('CertGetPublicKeyLength')(dwCertEncodingType, pPublicKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certgetserverocspresponsecontext
  public static CertGetServerOcspResponseContext(hServerOcspResponse: HCERT_SERVER_OCSP_RESPONSE, dwFlags: DWORD, pvReserved: Optional<PVOID>): PCCERT_SERVER_OCSP_RESPONSE_CONTEXT {
    return Crypt32.Load('CertGetServerOcspResponseContext')(hServerOcspResponse, dwFlags, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certgetstoreproperty
  public static CertGetStoreProperty(hCertStore: HCERTSTORE, dwPropId: DWORD, pvData_out: Optional<PVOID>, pcbData_in_out: PDWORD): BOOL {
    return Crypt32.Load('CertGetStoreProperty')(hCertStore, dwPropId, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certgetsubjectcertificatefromstore
  public static CertGetSubjectCertificateFromStore(hCertStore: HCERTSTORE, dwCertEncodingType: DWORD, pCertId: PCERT_INFO): PCCERT_CONTEXT {
    return Crypt32.Load('CertGetSubjectCertificateFromStore')(hCertStore, dwCertEncodingType, pCertId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certgetvalidusages
  public static CertGetValidUsages(cCerts: DWORD, rghCerts: PVOID, cNumOIDs_out: PDWORD, rghOIDs_out: Optional<PVOID>, pcbOIDs_in_out: PDWORD): BOOL {
    return Crypt32.Load('CertGetValidUsages')(cCerts, rghCerts, cNumOIDs_out, rghOIDs_out, pcbOIDs_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certisrdnattrsincertificatename
  public static CertIsRDNAttrsInCertificateName(dwCertEncodingType: DWORD, dwFlags: DWORD, pCertName: PCERT_NAME_BLOB, pRDN: PCERT_RDN): BOOL {
    return Crypt32.Load('CertIsRDNAttrsInCertificateName')(dwCertEncodingType, dwFlags, pCertName, pRDN);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certisstronghashtosign
  public static CertIsStrongHashToSign(pStrongSignPara: PCERT_STRONG_SIGN_PARA, pwszCNGHashAlgid: LPCWSTR, hKey: Optional<HCRYPTPROV_OR_NCRYPT_KEY_HANDLE>): BOOL {
    return Crypt32.Load('CertIsStrongHashToSign')(pStrongSignPara, pwszCNGHashAlgid, hKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certisweakhash
  public static CertIsWeakHash(dwHashUseType: DWORD, pwszCNGHashAlgid: LPCWSTR, dwChainFlags: DWORD, pSignerChainContext: Optional<PCCERT_CHAIN_CONTEXT>, pTimeStamp: Optional<LPFILETIME>, pwszFileName: Optional<LPCWSTR>): BOOL {
    return Crypt32.Load('CertIsWeakHash')(dwHashUseType, pwszCNGHashAlgid, dwChainFlags, pSignerChainContext, pTimeStamp, pwszFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certisvalidcrlforcertificate
  public static CertIsValidCRLForCertificate(pCert: PCCERT_CONTEXT, pCrl: PCCRL_CONTEXT, dwFlags: DWORD, pvReserved: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertIsValidCRLForCertificate')(pCert, pCrl, dwFlags, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certnametostra
  public static CertNameToStrA(dwCertEncodingType: DWORD, pName: PCERT_NAME_BLOB, dwStrType: DWORD, psz_out: Optional<LPSTR>, csz: DWORD): DWORD {
    return Crypt32.Load('CertNameToStrA')(dwCertEncodingType, pName, dwStrType, psz_out, csz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certnametostrw
  public static CertNameToStrW(dwCertEncodingType: DWORD, pName: PCERT_NAME_BLOB, dwStrType: DWORD, psz_out: Optional<LPWSTR>, csz: DWORD): DWORD {
    return Crypt32.Load('CertNameToStrW')(dwCertEncodingType, pName, dwStrType, psz_out, csz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certoidtoalgid
  public static CertOIDToAlgId(pszObjId: LPCSTR): ALG_ID {
    return Crypt32.Load('CertOIDToAlgId')(pszObjId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certopenserverocspresponse
  public static CertOpenServerOcspResponse(pServerCertContext: PCCERT_CONTEXT, dwFlags: DWORD, pOpenPara: Optional<PCERT_SERVER_OCSP_RESPONSE_OPEN_PARA>): HCERT_SERVER_OCSP_RESPONSE {
    return Crypt32.Load('CertOpenServerOcspResponse')(pServerCertContext, dwFlags, pOpenPara);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certopenstore
  public static CertOpenStore(lpszStoreProvider: LPCSTR, dwEncodingType: DWORD, hCryptProv: Optional<HCRYPTPROV>, dwFlags: DWORD, pvPara: Optional<PVOID>): HCERTSTORE {
    return Crypt32.Load('CertOpenStore')(lpszStoreProvider, dwEncodingType, hCryptProv, dwFlags, pvPara);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certopensystemstorea
  public static CertOpenSystemStoreA(hProv: Optional<HCRYPTPROV>, szSubsystemProtocol: LPCSTR): HCERTSTORE {
    return Crypt32.Load('CertOpenSystemStoreA')(hProv, szSubsystemProtocol);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certopensystemstorew
  public static CertOpenSystemStoreW(hProv: Optional<HCRYPTPROV>, szSubsystemProtocol: LPCWSTR): HCERTSTORE {
    return Crypt32.Load('CertOpenSystemStoreW')(hProv, szSubsystemProtocol);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certrdnvaluetostra
  public static CertRDNValueToStrA(dwValueType: DWORD, pValue: PCERT_RDN_VALUE_BLOB, psz_out: Optional<LPSTR>, csz: DWORD): DWORD {
    return Crypt32.Load('CertRDNValueToStrA')(dwValueType, pValue, psz_out, csz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certrdnvaluetostrw
  public static CertRDNValueToStrW(dwValueType: DWORD, pValue: PCERT_RDN_VALUE_BLOB, psz_out: Optional<LPWSTR>, csz: DWORD): DWORD {
    return Crypt32.Load('CertRDNValueToStrW')(dwValueType, pValue, psz_out, csz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certregisterphysicalstore
  public static CertRegisterPhysicalStore(pvSystemStore: PVOID, dwFlags: DWORD, pwszStoreName: LPCWSTR, pStoreInfo: PVOID, pvReserved: DWORD): BOOL {
    return Crypt32.Load('CertRegisterPhysicalStore')(pvSystemStore, dwFlags, pwszStoreName, pStoreInfo, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certregistersystemstore
  public static CertRegisterSystemStore(pvSystemStore: PVOID, dwFlags: DWORD, pStoreInfo: Optional<PVOID>, pvReserved: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertRegisterSystemStore')(pvSystemStore, dwFlags, pStoreInfo, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certremoveenhancedkeyusageidentifier
  public static CertRemoveEnhancedKeyUsageIdentifier(pCertContext: PCCERT_CONTEXT, pszUsageIdentifier: LPCSTR): BOOL {
    return Crypt32.Load('CertRemoveEnhancedKeyUsageIdentifier')(pCertContext, pszUsageIdentifier);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certremovestorefromcollection
  public static CertRemoveStoreFromCollection(hCollectionStore: HCERTSTORE, hSiblingStore: HCERTSTORE): void {
    return Crypt32.Load('CertRemoveStoreFromCollection')(hCollectionStore, hSiblingStore);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certresynccertificatechainengine
  public static CertResyncCertificateChainEngine(hChainEngine: Optional<HCERTCHAINENGINE>): BOOL {
    return Crypt32.Load('CertResyncCertificateChainEngine')(hChainEngine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certretrievelogoorbiometricinfo
  public static CertRetrieveLogoOrBiometricInfo(
    pCertContext: PCCERT_CONTEXT,
    lpszLogoOrBiometricType: LPCSTR,
    dwRetrievalFlags: DWORD,
    dwTimeout: DWORD,
    dwFlags: DWORD,
    pvReserved: Optional<PVOID>,
    ppbData_out: PVOID,
    pcbData_out: PDWORD,
    ppwszMimeType_out: Optional<PVOID>,
  ): BOOL {
    return Crypt32.Load('CertRetrieveLogoOrBiometricInfo')(pCertContext, lpszLogoOrBiometricType, dwRetrievalFlags, dwTimeout, dwFlags, pvReserved, ppbData_out, pcbData_out, ppwszMimeType_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certsavestore
  public static CertSaveStore(hCertStore: HCERTSTORE, dwEncodingType: DWORD, dwSaveAs: DWORD, dwSaveTo: DWORD, pvSaveToPara_in_out: PVOID, dwFlags: DWORD): BOOL {
    return Crypt32.Load('CertSaveStore')(hCertStore, dwEncodingType, dwSaveAs, dwSaveTo, pvSaveToPara_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certselectcertificatechains
  public static CertSelectCertificateChains(
    pSelectionContext: Optional<PVOID>,
    dwFlags: DWORD,
    pChainParameters: Optional<PVOID>,
    cCriteria: DWORD,
    rgpCriteria: Optional<PCCERT_SELECT_CRITERIA>,
    hStore: HCERTSTORE,
    pcSelection_out: PDWORD,
    pprgpSelection_out: PVOID,
  ): BOOL {
    return Crypt32.Load('CertSelectCertificateChains')(pSelectionContext, dwFlags, pChainParameters, cCriteria, rgpCriteria, hStore, pcSelection_out, pprgpSelection_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certserializecrlstoreelement
  public static CertSerializeCRLStoreElement(pCrlContext: PCCRL_CONTEXT, dwFlags: DWORD, pbElement_out: Optional<PBYTE>, pcbElement_in_out: PDWORD): BOOL {
    return Crypt32.Load('CertSerializeCRLStoreElement')(pCrlContext, dwFlags, pbElement_out, pcbElement_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certserializectlstoreelement
  public static CertSerializeCTLStoreElement(pCtlContext: PCCTL_CONTEXT, dwFlags: DWORD, pbElement_out: Optional<PBYTE>, pcbElement_in_out: PDWORD): BOOL {
    return Crypt32.Load('CertSerializeCTLStoreElement')(pCtlContext, dwFlags, pbElement_out, pcbElement_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certserializecertificatestoreelement
  public static CertSerializeCertificateStoreElement(pCertContext: PCCERT_CONTEXT, dwFlags: DWORD, pbElement_out: Optional<PBYTE>, pcbElement_in_out: PDWORD): BOOL {
    return Crypt32.Load('CertSerializeCertificateStoreElement')(pCertContext, dwFlags, pbElement_out, pcbElement_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certsetcrlcontextproperty
  public static CertSetCRLContextProperty(pCrlContext: PCCRL_CONTEXT, dwPropId: DWORD, dwFlags: DWORD, pvData: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertSetCRLContextProperty')(pCrlContext, dwPropId, dwFlags, pvData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certsetctlcontextproperty
  public static CertSetCTLContextProperty(pCtlContext: PCCTL_CONTEXT, dwPropId: DWORD, dwFlags: DWORD, pvData: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertSetCTLContextProperty')(pCtlContext, dwPropId, dwFlags, pvData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certsetcertificatecontextpropertiesfromctlentry
  public static CertSetCertificateContextPropertiesFromCTLEntry(pCertContext: PCCERT_CONTEXT, pCtlEntry: PCTL_ENTRY, dwFlags: DWORD): BOOL {
    return Crypt32.Load('CertSetCertificateContextPropertiesFromCTLEntry')(pCertContext, pCtlEntry, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certsetcertificatecontextproperty
  public static CertSetCertificateContextProperty(pCertContext: PCCERT_CONTEXT, dwPropId: DWORD, dwFlags: DWORD, pvData: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertSetCertificateContextProperty')(pCertContext, dwPropId, dwFlags, pvData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certsetenhancedkeyusage
  public static CertSetEnhancedKeyUsage(pCertContext: PCCERT_CONTEXT, pUsage: Optional<PCERT_ENHKEY_USAGE>): BOOL {
    return Crypt32.Load('CertSetEnhancedKeyUsage')(pCertContext, pUsage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certsetstoreproperty
  public static CertSetStoreProperty(hCertStore: HCERTSTORE, dwPropId: DWORD, dwFlags: DWORD, pvData: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertSetStoreProperty')(hCertStore, dwPropId, dwFlags, pvData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certstrtonamea
  public static CertStrToNameA(dwCertEncodingType: DWORD, pszX500: LPCSTR, dwStrType: DWORD, pvReserved: Optional<PVOID>, pbEncoded_out: Optional<PBYTE>, pcbEncoded_in_out: PDWORD, ppszError_out: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertStrToNameA')(dwCertEncodingType, pszX500, dwStrType, pvReserved, pbEncoded_out, pcbEncoded_in_out, ppszError_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certstrtonamew
  public static CertStrToNameW(dwCertEncodingType: DWORD, pszX500: LPCWSTR, dwStrType: DWORD, pvReserved: Optional<PVOID>, pbEncoded_out: Optional<PBYTE>, pcbEncoded_in_out: PDWORD, ppszError_out: Optional<PVOID>): BOOL {
    return Crypt32.Load('CertStrToNameW')(dwCertEncodingType, pszX500, dwStrType, pvReserved, pbEncoded_out, pcbEncoded_in_out, ppszError_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certunregisterphysicalstore
  public static CertUnregisterPhysicalStore(pvSystemStore: PVOID, dwFlags: DWORD, pwszStoreName: LPCWSTR): BOOL {
    return Crypt32.Load('CertUnregisterPhysicalStore')(pvSystemStore, dwFlags, pwszStoreName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certunregistersystemstore
  public static CertUnregisterSystemStore(pvSystemStore: PVOID, dwFlags: DWORD): BOOL {
    return Crypt32.Load('CertUnregisterSystemStore')(pvSystemStore, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certverifycrlrevocation
  public static CertVerifyCRLRevocation(dwCertEncodingType: DWORD, pCertId: PCERT_INFO, cCrlInfo: DWORD, rgpCrlInfo: PVOID): BOOL {
    return Crypt32.Load('CertVerifyCRLRevocation')(dwCertEncodingType, pCertId, cCrlInfo, rgpCrlInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certverifycrltimevalidity
  public static CertVerifyCRLTimeValidity(pTimeToVerify: Optional<LPFILETIME>, pCrlInfo: PCRL_INFO): LONG {
    return Crypt32.Load('CertVerifyCRLTimeValidity')(pTimeToVerify, pCrlInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certverifyctlusage
  public static CertVerifyCTLUsage(
    dwEncodingType: DWORD,
    dwSubjectType: DWORD,
    pvSubject: PVOID,
    pSubjectUsage: PCTL_USAGE,
    dwFlags: DWORD,
    pVerifyUsagePara: Optional<PCTL_VERIFY_USAGE_PARA>,
    pVerifyUsageStatus_in_out: PCTL_VERIFY_USAGE_STATUS,
  ): BOOL {
    return Crypt32.Load('CertVerifyCTLUsage')(dwEncodingType, dwSubjectType, pvSubject, pSubjectUsage, dwFlags, pVerifyUsagePara, pVerifyUsageStatus_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certverifycertificatechainpolicy
  public static CertVerifyCertificateChainPolicy(pszPolicyOID: LPCSTR, pChainContext: PCCERT_CHAIN_CONTEXT, pPolicyPara: PCERT_CHAIN_POLICY_PARA, pPolicyStatus_in_out: PCERT_CHAIN_POLICY_STATUS): BOOL {
    return Crypt32.Load('CertVerifyCertificateChainPolicy')(pszPolicyOID, pChainContext, pPolicyPara, pPolicyStatus_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certverifyrevocation
  public static CertVerifyRevocation(dwEncodingType: DWORD, dwRevType: DWORD, cContext: DWORD, rgpvContext: PVOID, dwFlags: DWORD, pRevPara: Optional<PCERT_REVOCATION_PARA>, pRevStatus_in_out: PCERT_REVOCATION_STATUS): BOOL {
    return Crypt32.Load('CertVerifyRevocation')(dwEncodingType, dwRevType, cContext, rgpvContext, dwFlags, pRevPara, pRevStatus_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certverifysubjectcertificatecontext
  public static CertVerifySubjectCertificateContext(pSubject: PCCERT_CONTEXT, pIssuer: Optional<PCCERT_CONTEXT>, pdwFlags_in_out: PDWORD): BOOL {
    return Crypt32.Load('CertVerifySubjectCertificateContext')(pSubject, pIssuer, pdwFlags_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certverifytimevalidity
  public static CertVerifyTimeValidity(pTimeToVerify: Optional<LPFILETIME>, pCertInfo: PCERT_INFO): LONG {
    return Crypt32.Load('CertVerifyTimeValidity')(pTimeToVerify, pCertInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-certverifyvaliditynesting
  public static CertVerifyValidityNesting(pSubjectInfo: PCERT_INFO, pIssuerInfo: PCERT_INFO): BOOL {
    return Crypt32.Load('CertVerifyValidityNesting')(pSubjectInfo, pIssuerInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptacquirecertificateprivatekey
  public static CryptAcquireCertificatePrivateKey(
    pCert: PCCERT_CONTEXT,
    dwFlags: DWORD,
    pvParameters: Optional<PVOID>,
    phCryptProvOrNCryptKey_out: PVOID,
    pdwKeySpec_out: Optional<PDWORD>,
    pfCallerFreeProvOrNCryptKey_out: Optional<PVOID>,
  ): BOOL {
    return Crypt32.Load('CryptAcquireCertificatePrivateKey')(pCert, dwFlags, pvParameters, phCryptProvOrNCryptKey_out, pdwKeySpec_out, pfCallerFreeProvOrNCryptKey_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptbinarytostringa
  public static CryptBinaryToStringA(pbBinary: PBYTE, cbBinary: DWORD, dwFlags: DWORD, pszString_out: Optional<LPSTR>, pcchString_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptBinaryToStringA')(pbBinary, cbBinary, dwFlags, pszString_out, pcchString_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptbinarytostringw
  public static CryptBinaryToStringW(pbBinary: PBYTE, cbBinary: DWORD, dwFlags: DWORD, pszString_out: Optional<LPWSTR>, pcchString_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptBinaryToStringW')(pbBinary, cbBinary, dwFlags, pszString_out, pcchString_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptcloseasynchandle
  public static CryptCloseAsyncHandle(hAsync: Optional<HCRYPTASYNC>): BOOL {
    return Crypt32.Load('CryptCloseAsyncHandle')(hAsync);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptcreateasynchandle
  public static CryptCreateAsyncHandle(dwFlags: DWORD, phAsync_out: PVOID): BOOL {
    return Crypt32.Load('CryptCreateAsyncHandle')(dwFlags, phAsync_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptcreatekeyidentifierfromcsp
  public static CryptCreateKeyIdentifierFromCSP(
    dwCertEncodingType: DWORD,
    pszPubKeyOID: Optional<LPCSTR>,
    pPubKeyStruc: PVOID,
    cbPubKeyStruc: DWORD,
    dwFlags: DWORD,
    pvReserved: Optional<PVOID>,
    pbHash_out: Optional<PBYTE>,
    pcbHash_in_out: PDWORD,
  ): BOOL {
    return Crypt32.Load('CryptCreateKeyIdentifierFromCSP')(dwCertEncodingType, pszPubKeyOID, pPubKeyStruc, cbPubKeyStruc, dwFlags, pvReserved, pbHash_out, pcbHash_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptdecodemessage
  public static CryptDecodeMessage(
    dwMsgTypeFlags: DWORD,
    pDecryptPara: Optional<PCRYPT_DECRYPT_MESSAGE_PARA>,
    pVerifyPara: Optional<PCRYPT_VERIFY_MESSAGE_PARA>,
    dwSignerIndex: DWORD,
    pbEncodedBlob: PBYTE,
    cbEncodedBlob: DWORD,
    dwPrevInnerContentType: DWORD,
    pdwMsgType_out: Optional<PDWORD>,
    pdwInnerContentType_out: Optional<PDWORD>,
    pbDecoded_out: Optional<PBYTE>,
    pcbDecoded_in_out: Optional<PDWORD>,
    ppXchgCert_out: Optional<PVOID>,
    ppSignerCert_out: Optional<PVOID>,
  ): BOOL {
    return Crypt32.Load('CryptDecodeMessage')(
      dwMsgTypeFlags,
      pDecryptPara,
      pVerifyPara,
      dwSignerIndex,
      pbEncodedBlob,
      cbEncodedBlob,
      dwPrevInnerContentType,
      pdwMsgType_out,
      pdwInnerContentType_out,
      pbDecoded_out,
      pcbDecoded_in_out,
      ppXchgCert_out,
      ppSignerCert_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptdecodeobject
  public static CryptDecodeObject(dwCertEncodingType: DWORD, lpszStructType: LPCSTR, pbEncoded: PBYTE, cbEncoded: DWORD, dwFlags: DWORD, pvStructInfo_out: Optional<PVOID>, pcbStructInfo_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptDecodeObject')(dwCertEncodingType, lpszStructType, pbEncoded, cbEncoded, dwFlags, pvStructInfo_out, pcbStructInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptdecodeobjectex
  public static CryptDecodeObjectEx(
    dwCertEncodingType: DWORD,
    lpszStructType: LPCSTR,
    pbEncoded: PBYTE,
    cbEncoded: DWORD,
    dwFlags: DWORD,
    pDecodePara: Optional<PCRYPT_DECODE_PARA>,
    pvStructInfo_out: Optional<PVOID>,
    pcbStructInfo_in_out: PDWORD,
  ): BOOL {
    return Crypt32.Load('CryptDecodeObjectEx')(dwCertEncodingType, lpszStructType, pbEncoded, cbEncoded, dwFlags, pDecodePara, pvStructInfo_out, pcbStructInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptdecryptandverifymessagesignature
  public static CryptDecryptAndVerifyMessageSignature(
    pDecryptPara: PCRYPT_DECRYPT_MESSAGE_PARA,
    pVerifyPara: PCRYPT_VERIFY_MESSAGE_PARA,
    dwSignerIndex: DWORD,
    pbEncryptedBlob: PBYTE,
    cbEncryptedBlob: DWORD,
    pbDecrypted_out: Optional<PBYTE>,
    pcbDecrypted_in_out: Optional<PDWORD>,
    ppXchgCert_out: Optional<PVOID>,
    ppSignerCert_out: Optional<PVOID>,
  ): BOOL {
    return Crypt32.Load('CryptDecryptAndVerifyMessageSignature')(pDecryptPara, pVerifyPara, dwSignerIndex, pbEncryptedBlob, cbEncryptedBlob, pbDecrypted_out, pcbDecrypted_in_out, ppXchgCert_out, ppSignerCert_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptdecryptmessage
  public static CryptDecryptMessage(pDecryptPara: PCRYPT_DECRYPT_MESSAGE_PARA, pbEncryptedBlob: PBYTE, cbEncryptedBlob: DWORD, pbDecrypted_out: Optional<PBYTE>, pcbDecrypted_in_out: Optional<PDWORD>, ppXchgCert_out: Optional<PVOID>): BOOL {
    return Crypt32.Load('CryptDecryptMessage')(pDecryptPara, pbEncryptedBlob, cbEncryptedBlob, pbDecrypted_out, pcbDecrypted_in_out, ppXchgCert_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptencodeobject
  public static CryptEncodeObject(dwCertEncodingType: DWORD, lpszStructType: LPCSTR, pvStructInfo: PVOID, pbEncoded_out: Optional<PBYTE>, pcbEncoded_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptEncodeObject')(dwCertEncodingType, lpszStructType, pvStructInfo, pbEncoded_out, pcbEncoded_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptencodeobjectex
  public static CryptEncodeObjectEx(dwCertEncodingType: DWORD, lpszStructType: LPCSTR, pvStructInfo: PVOID, dwFlags: DWORD, pEncodePara: Optional<PCRYPT_ENCODE_PARA>, pvEncoded_out: Optional<PVOID>, pcbEncoded_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptEncodeObjectEx')(dwCertEncodingType, lpszStructType, pvStructInfo, dwFlags, pEncodePara, pvEncoded_out, pcbEncoded_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptencryptmessage
  public static CryptEncryptMessage(
    pEncryptPara: PCRYPT_ENCRYPT_MESSAGE_PARA,
    cRecipientCert: DWORD,
    rgpRecipientCert: PVOID,
    pbToBeEncrypted: Optional<PBYTE>,
    cbToBeEncrypted: DWORD,
    pbEncryptedBlob_out: Optional<PBYTE>,
    pcbEncryptedBlob_in_out: PDWORD,
  ): BOOL {
    return Crypt32.Load('CryptEncryptMessage')(pEncryptPara, cRecipientCert, rgpRecipientCert, pbToBeEncrypted, cbToBeEncrypted, pbEncryptedBlob_out, pcbEncryptedBlob_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptenumkeyidentifierproperties
  public static CryptEnumKeyIdentifierProperties(
    pKeyIdentifier: Optional<PCRYPT_DATA_BLOB>,
    dwPropId: DWORD,
    dwFlags: DWORD,
    pwszComputerName: Optional<LPCWSTR>,
    pvReserved: Optional<PVOID>,
    pvArg_in_out: Optional<PVOID>,
    pfnEnum: PFN_CRYPT_ENUM_KEYID_PROP,
  ): BOOL {
    return Crypt32.Load('CryptEnumKeyIdentifierProperties')(pKeyIdentifier, dwPropId, dwFlags, pwszComputerName, pvReserved, pvArg_in_out, pfnEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptenumoidfunction
  public static CryptEnumOIDFunction(dwEncodingType: DWORD, pszFuncName: Optional<LPCSTR>, pszOID: Optional<LPCSTR>, dwFlags: DWORD, pvArg_in_out: Optional<PVOID>, pfnEnumOIDFunc: PFN_CRYPT_ENUM_OID_FUNC): BOOL {
    return Crypt32.Load('CryptEnumOIDFunction')(dwEncodingType, pszFuncName, pszOID, dwFlags, pvArg_in_out, pfnEnumOIDFunc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptenumoidinfo
  public static CryptEnumOIDInfo(dwGroupId: DWORD, dwFlags: DWORD, pvArg_in_out: Optional<PVOID>, pfnEnumOIDInfo: PFN_CRYPT_ENUM_OID_INFO): BOOL {
    return Crypt32.Load('CryptEnumOIDInfo')(dwGroupId, dwFlags, pvArg_in_out, pfnEnumOIDInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptexportpkcs8
  public static CryptExportPKCS8(hCryptProv: HCRYPTPROV, dwKeySpec: DWORD, pszPrivateKeyObjId: LPCSTR, dwFlags: DWORD, pvAuxInfo: Optional<PVOID>, pbPrivateKeyBlob_out: Optional<PBYTE>, pcbPrivateKeyBlob_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptExportPKCS8')(hCryptProv, dwKeySpec, pszPrivateKeyObjId, dwFlags, pvAuxInfo, pbPrivateKeyBlob_out, pcbPrivateKeyBlob_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptexportpublickeyinfo
  public static CryptExportPublicKeyInfo(hCryptProvOrNCryptKey: HCRYPTPROV_OR_NCRYPT_KEY_HANDLE, dwKeySpec: DWORD, dwCertEncodingType: DWORD, pInfo_out: Optional<PCERT_PUBLIC_KEY_INFO>, pcbInfo_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptExportPublicKeyInfo')(hCryptProvOrNCryptKey, dwKeySpec, dwCertEncodingType, pInfo_out, pcbInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptexportpublickeyinfoex
  public static CryptExportPublicKeyInfoEx(
    hCryptProvOrNCryptKey: HCRYPTPROV_OR_NCRYPT_KEY_HANDLE,
    dwKeySpec: DWORD,
    dwCertEncodingType: DWORD,
    pszPublicKeyObjId: Optional<LPSTR>,
    dwFlags: DWORD,
    pvAuxInfo: Optional<PVOID>,
    pInfo_out: Optional<PCERT_PUBLIC_KEY_INFO>,
    pcbInfo_in_out: PDWORD,
  ): BOOL {
    return Crypt32.Load('CryptExportPublicKeyInfoEx')(hCryptProvOrNCryptKey, dwKeySpec, dwCertEncodingType, pszPublicKeyObjId, dwFlags, pvAuxInfo, pInfo_out, pcbInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptexportpublickeyinfofrombcryptkeyhandle
  public static CryptExportPublicKeyInfoFromBCryptKeyHandle(
    hBCryptKey: BCRYPT_KEY_HANDLE,
    dwCertEncodingType: DWORD,
    pszPublicKeyObjId: Optional<LPSTR>,
    dwFlags: DWORD,
    pvAuxInfo: Optional<PVOID>,
    pInfo_out: Optional<PCERT_PUBLIC_KEY_INFO>,
    pcbInfo_in_out: PDWORD,
  ): BOOL {
    return Crypt32.Load('CryptExportPublicKeyInfoFromBCryptKeyHandle')(hBCryptKey, dwCertEncodingType, pszPublicKeyObjId, dwFlags, pvAuxInfo, pInfo_out, pcbInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptfindcertificatekeyprovinfo
  public static CryptFindCertificateKeyProvInfo(pCert: PCCERT_CONTEXT, dwFlags: DWORD, pvReserved: Optional<PVOID>): BOOL {
    return Crypt32.Load('CryptFindCertificateKeyProvInfo')(pCert, dwFlags, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptfindlocalizedname
  public static CryptFindLocalizedName(pwszCryptName: LPCWSTR): LPCWSTR {
    return Crypt32.Load('CryptFindLocalizedName')(pwszCryptName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptfindoidinfo
  public static CryptFindOIDInfo(dwKeyType: DWORD, pvKey: PVOID, dwGroupId: DWORD): PCCRYPT_OID_INFO {
    return Crypt32.Load('CryptFindOIDInfo')(dwKeyType, pvKey, dwGroupId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptformatobject
  public static CryptFormatObject(
    dwCertEncodingType: DWORD,
    dwFormatType: DWORD,
    dwFormatStrType: DWORD,
    pFormatStruct: Optional<PVOID>,
    lpszStructType: Optional<LPCSTR>,
    pbEncoded: PBYTE,
    cbEncoded: DWORD,
    pbFormat_out: Optional<PVOID>,
    pcbFormat_in_out: PDWORD,
  ): BOOL {
    return Crypt32.Load('CryptFormatObject')(dwCertEncodingType, dwFormatType, dwFormatStrType, pFormatStruct, lpszStructType, pbEncoded, cbEncoded, pbFormat_out, pcbFormat_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptfreeoidfunctionaddress
  public static CryptFreeOIDFunctionAddress(hFuncAddr: HCRYPTOIDFUNCADDR, dwFlags: DWORD): BOOL {
    return Crypt32.Load('CryptFreeOIDFunctionAddress')(hFuncAddr, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetasyncparam
  public static CryptGetAsyncParam(hAsync: HCRYPTASYNC, pszParamOid: LPCSTR, ppvParam_out: Optional<PVOID>, ppfnFree_out: Optional<PVOID>): BOOL {
    return Crypt32.Load('CryptGetAsyncParam')(hAsync, pszParamOid, ppvParam_out, ppfnFree_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetdefaultoiddlllist
  public static CryptGetDefaultOIDDllList(hFuncSet: HCRYPTOIDFUNCSET, dwEncodingType: DWORD, pwszDllList_out: Optional<LPWSTR>, pcchDllList_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptGetDefaultOIDDllList')(hFuncSet, dwEncodingType, pwszDllList_out, pcchDllList_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetdefaultoidfunctionaddress
  public static CryptGetDefaultOIDFunctionAddress(hFuncSet: HCRYPTOIDFUNCSET, dwEncodingType: DWORD, pwszDll: Optional<LPCWSTR>, dwFlags: DWORD, ppvFuncAddr_out: PVOID, phFuncAddr_in_out: PVOID): BOOL {
    return Crypt32.Load('CryptGetDefaultOIDFunctionAddress')(hFuncSet, dwEncodingType, pwszDll, dwFlags, ppvFuncAddr_out, phFuncAddr_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetkeyidentifierproperty
  public static CryptGetKeyIdentifierProperty(pKeyIdentifier: PCRYPT_DATA_BLOB, dwPropId: DWORD, dwFlags: DWORD, pwszComputerName: Optional<LPCWSTR>, pvReserved: Optional<PVOID>, pvData_out: Optional<PVOID>, pcbData_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptGetKeyIdentifierProperty')(pKeyIdentifier, dwPropId, dwFlags, pwszComputerName, pvReserved, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetmessagecertificates
  public static CryptGetMessageCertificates(dwMsgAndCertEncodingType: DWORD, hCryptProv: Optional<HCRYPTPROV>, dwFlags: DWORD, pbSignedBlob: PBYTE, cbSignedBlob: DWORD): HCERTSTORE {
    return Crypt32.Load('CryptGetMessageCertificates')(dwMsgAndCertEncodingType, hCryptProv, dwFlags, pbSignedBlob, cbSignedBlob);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetmessagesignercount
  public static CryptGetMessageSignerCount(dwMsgEncodingType: DWORD, pbSignedBlob: PBYTE, cbSignedBlob: DWORD): LONG {
    return Crypt32.Load('CryptGetMessageSignerCount')(dwMsgEncodingType, pbSignedBlob, cbSignedBlob);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetoidfunctionaddress
  public static CryptGetOIDFunctionAddress(hFuncSet: HCRYPTOIDFUNCSET, dwEncodingType: DWORD, pszOID: LPCSTR, dwFlags: DWORD, ppvFuncAddr_out: PVOID, phFuncAddr_out: PVOID): BOOL {
    return Crypt32.Load('CryptGetOIDFunctionAddress')(hFuncSet, dwEncodingType, pszOID, dwFlags, ppvFuncAddr_out, phFuncAddr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetoidfunctionvalue
  public static CryptGetOIDFunctionValue(
    dwEncodingType: DWORD,
    pszFuncName: LPCSTR,
    pszOID: LPCSTR,
    pwszValueName: Optional<LPCWSTR>,
    pdwValueType_out: Optional<PDWORD>,
    pbValueData_out: Optional<PBYTE>,
    pcbValueData_in_out: Optional<PDWORD>,
  ): BOOL {
    return Crypt32.Load('CryptGetOIDFunctionValue')(dwEncodingType, pszFuncName, pszOID, pwszValueName, pdwValueType_out, pbValueData_out, pcbValueData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-crypthashcertificate
  public static CryptHashCertificate(hCryptProv: Optional<HCRYPTPROV>, Algid: ALG_ID, dwFlags: DWORD, pbEncoded: PBYTE, cbEncoded: DWORD, pbComputedHash_out: Optional<PBYTE>, pcbComputedHash_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptHashCertificate')(hCryptProv, Algid, dwFlags, pbEncoded, cbEncoded, pbComputedHash_out, pcbComputedHash_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-crypthashcertificate2
  public static CryptHashCertificate2(pwszCNGHashAlgid: LPCWSTR, dwFlags: DWORD, pvReserved: Optional<PVOID>, pbEncoded: Optional<PBYTE>, cbEncoded: DWORD, pbComputedHash_out: Optional<PBYTE>, pcbComputedHash_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptHashCertificate2')(pwszCNGHashAlgid, dwFlags, pvReserved, pbEncoded, cbEncoded, pbComputedHash_out, pcbComputedHash_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-crypthashmessage
  public static CryptHashMessage(
    pHashPara: PCRYPT_HASH_MESSAGE_PARA,
    fDetachedHash: BOOL,
    cToBeHashed: DWORD,
    rgpbToBeHashed: PVOID,
    rgcbToBeHashed: PDWORD,
    pbHashedBlob_out: Optional<PBYTE>,
    pcbHashedBlob_in_out: Optional<PDWORD>,
    pbComputedHash_out: Optional<PBYTE>,
    pcbComputedHash_in_out: Optional<PDWORD>,
  ): BOOL {
    return Crypt32.Load('CryptHashMessage')(pHashPara, fDetachedHash, cToBeHashed, rgpbToBeHashed, rgcbToBeHashed, pbHashedBlob_out, pcbHashedBlob_in_out, pbComputedHash_out, pcbComputedHash_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-crypthashpublickeyinfo
  public static CryptHashPublicKeyInfo(hCryptProv: Optional<HCRYPTPROV>, Algid: ALG_ID, dwFlags: DWORD, dwCertEncodingType: DWORD, pInfo: PCERT_PUBLIC_KEY_INFO, pbComputedHash_out: Optional<PBYTE>, pcbComputedHash_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptHashPublicKeyInfo')(hCryptProv, Algid, dwFlags, dwCertEncodingType, pInfo, pbComputedHash_out, pcbComputedHash_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-crypthashtobesigned
  public static CryptHashToBeSigned(hCryptProv: Optional<HCRYPTPROV>, dwCertEncodingType: DWORD, pbEncoded: PBYTE, cbEncoded: DWORD, pbComputedHash_out: Optional<PBYTE>, pcbComputedHash_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptHashToBeSigned')(hCryptProv, dwCertEncodingType, pbEncoded, cbEncoded, pbComputedHash_out, pcbComputedHash_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptimportpkcs8
  public static CryptImportPKCS8(sPrivateKeyAndParams: PVOID, dwFlags: DWORD, phCryptProv_out: Optional<PVOID>, pvAuxInfo: Optional<PVOID>, pvReserved: Optional<PVOID>): BOOL {
    return Crypt32.Load('CryptImportPKCS8')(sPrivateKeyAndParams, dwFlags, phCryptProv_out, pvAuxInfo, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptimportpublickeyinfo
  public static CryptImportPublicKeyInfo(hCryptProv: HCRYPTPROV, dwCertEncodingType: DWORD, pInfo: PCERT_PUBLIC_KEY_INFO, phKey_out: PVOID): BOOL {
    return Crypt32.Load('CryptImportPublicKeyInfo')(hCryptProv, dwCertEncodingType, pInfo, phKey_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptimportpublickeyinfoex
  public static CryptImportPublicKeyInfoEx(hCryptProv: HCRYPTPROV, dwCertEncodingType: DWORD, pInfo: PCERT_PUBLIC_KEY_INFO, aiKeyAlg: ALG_ID, dwFlags: DWORD, pvAuxInfo: Optional<PVOID>, phKey_out: PVOID): BOOL {
    return Crypt32.Load('CryptImportPublicKeyInfoEx')(hCryptProv, dwCertEncodingType, pInfo, aiKeyAlg, dwFlags, pvAuxInfo, phKey_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptimportpublickeyinfoex2
  public static CryptImportPublicKeyInfoEx2(dwCertEncodingType: DWORD, pInfo: PCERT_PUBLIC_KEY_INFO, dwFlags: DWORD, pvAuxInfo: Optional<PVOID>, phKey_out: PVOID): BOOL {
    return Crypt32.Load('CryptImportPublicKeyInfoEx2')(dwCertEncodingType, pInfo, dwFlags, pvAuxInfo, phKey_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptinitoidfunctionset
  public static CryptInitOIDFunctionSet(pszFuncName: LPCSTR, dwFlags: DWORD): HCRYPTOIDFUNCSET {
    return Crypt32.Load('CryptInitOIDFunctionSet')(pszFuncName, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptinstalldefaultcontext
  public static CryptInstallDefaultContext(hCryptProv: HCRYPTPROV_OR_NCRYPT_KEY_HANDLE, dwDefaultType: DWORD, pvDefaultPara: Optional<PVOID>, dwFlags: DWORD, pvReserved: Optional<PVOID>, phDefaultContext_out: PVOID): BOOL {
    return Crypt32.Load('CryptInstallDefaultContext')(hCryptProv, dwDefaultType, pvDefaultPara, dwFlags, pvReserved, phDefaultContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptinstalloidfunctionaddress
  public static CryptInstallOIDFunctionAddress(hModule: Optional<HMODULE>, dwEncodingType: DWORD, pszFuncName: LPCSTR, cFuncEntry: DWORD, rgFuncEntry: PCRYPT_OID_FUNC_ENTRY, dwFlags: DWORD): BOOL {
    return Crypt32.Load('CryptInstallOIDFunctionAddress')(hModule, dwEncodingType, pszFuncName, cFuncEntry, rgFuncEntry, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmemalloc
  public static CryptMemAlloc(cbSize: ULONG): LPVOID {
    return Crypt32.Load('CryptMemAlloc')(cbSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmemfree
  public static CryptMemFree(pv: Optional<LPVOID>): void {
    return Crypt32.Load('CryptMemFree')(pv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmemrealloc
  public static CryptMemRealloc(pv: Optional<LPVOID>, cbSize: ULONG): LPVOID {
    return Crypt32.Load('CryptMemRealloc')(pv, cbSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmsgcalculateencodedlength
  public static CryptMsgCalculateEncodedLength(dwMsgEncodingType: DWORD, dwFlags: DWORD, dwMsgType: DWORD, pvMsgEncodeInfo: PVOID, pszInnerContentObjID: Optional<LPSTR>, cbData: DWORD): DWORD {
    return Crypt32.Load('CryptMsgCalculateEncodedLength')(dwMsgEncodingType, dwFlags, dwMsgType, pvMsgEncodeInfo, pszInnerContentObjID, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmsgclose
  public static CryptMsgClose(hCryptMsg: Optional<HCRYPTMSG>): BOOL {
    return Crypt32.Load('CryptMsgClose')(hCryptMsg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmsgcontrol
  public static CryptMsgControl(hCryptMsg: HCRYPTMSG, dwFlags: DWORD, dwCtrlType: DWORD, pvCtrlPara: Optional<PVOID>): BOOL {
    return Crypt32.Load('CryptMsgControl')(hCryptMsg, dwFlags, dwCtrlType, pvCtrlPara);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmsgcountersign
  public static CryptMsgCountersign(hCryptMsg: HCRYPTMSG, dwIndex: DWORD, cCountersigners: DWORD, rgCountersigners: PCMSG_SIGNER_ENCODE_INFO): BOOL {
    return Crypt32.Load('CryptMsgCountersign')(hCryptMsg, dwIndex, cCountersigners, rgCountersigners);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmsgcountersignencoded
  public static CryptMsgCountersignEncoded(
    dwEncodingType: DWORD,
    pbSignerInfo: PBYTE,
    cbSignerInfo: DWORD,
    cCountersigners: DWORD,
    rgCountersigners: PCMSG_SIGNER_ENCODE_INFO,
    pbCountersignature_out: Optional<PBYTE>,
    pcbCountersignature_in_out: PDWORD,
  ): BOOL {
    return Crypt32.Load('CryptMsgCountersignEncoded')(dwEncodingType, pbSignerInfo, cbSignerInfo, cCountersigners, rgCountersigners, pbCountersignature_out, pcbCountersignature_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmsgduplicate
  public static CryptMsgDuplicate(hCryptMsg: Optional<HCRYPTMSG>): HCRYPTMSG {
    return Crypt32.Load('CryptMsgDuplicate')(hCryptMsg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmsgencodeandsignctl
  public static CryptMsgEncodeAndSignCTL(dwMsgEncodingType: DWORD, pCtlInfo: PCTL_INFO, pSignInfo: PCMSG_SIGNED_ENCODE_INFO, dwFlags: DWORD, pbEncoded_out: Optional<PBYTE>, pcbEncoded_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptMsgEncodeAndSignCTL')(dwMsgEncodingType, pCtlInfo, pSignInfo, dwFlags, pbEncoded_out, pcbEncoded_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmsggetandverifysigner
  public static CryptMsgGetAndVerifySigner(hCryptMsg: HCRYPTMSG, cSignerStore: DWORD, rghSignerStore: Optional<PVOID>, dwFlags: DWORD, ppSigner_out: Optional<PVOID>, pdwSignerIndex_in_out: Optional<PDWORD>): BOOL {
    return Crypt32.Load('CryptMsgGetAndVerifySigner')(hCryptMsg, cSignerStore, rghSignerStore, dwFlags, ppSigner_out, pdwSignerIndex_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmsggetparam
  public static CryptMsgGetParam(hCryptMsg: HCRYPTMSG, dwParamType: DWORD, dwIndex: DWORD, pvData_out: Optional<PVOID>, pcbData_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptMsgGetParam')(hCryptMsg, dwParamType, dwIndex, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmsgopentodecode
  public static CryptMsgOpenToDecode(dwMsgEncodingType: DWORD, dwFlags: DWORD, dwMsgType: DWORD, hCryptProv: Optional<HCRYPTPROV>, pRecipientInfo: Optional<PCERT_INFO>, pStreamInfo: Optional<PCMSG_STREAM_INFO>): HCRYPTMSG {
    return Crypt32.Load('CryptMsgOpenToDecode')(dwMsgEncodingType, dwFlags, dwMsgType, hCryptProv, pRecipientInfo, pStreamInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmsgopentoencode
  public static CryptMsgOpenToEncode(dwMsgEncodingType: DWORD, dwFlags: DWORD, dwMsgType: DWORD, pvMsgEncodeInfo: PVOID, pszInnerContentObjID: Optional<LPSTR>, pStreamInfo: Optional<PCMSG_STREAM_INFO>): HCRYPTMSG {
    return Crypt32.Load('CryptMsgOpenToEncode')(dwMsgEncodingType, dwFlags, dwMsgType, pvMsgEncodeInfo, pszInnerContentObjID, pStreamInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmsgsignctl
  public static CryptMsgSignCTL(dwMsgEncodingType: DWORD, pbCtlContent: PBYTE, cbCtlContent: DWORD, pSignInfo: PCMSG_SIGNED_ENCODE_INFO, dwFlags: DWORD, pbEncoded_out: Optional<PBYTE>, pcbEncoded_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptMsgSignCTL')(dwMsgEncodingType, pbCtlContent, cbCtlContent, pSignInfo, dwFlags, pbEncoded_out, pcbEncoded_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmsgupdate
  public static CryptMsgUpdate(hCryptMsg: HCRYPTMSG, pbData: Optional<PBYTE>, cbData: DWORD, fFinal: BOOL): BOOL {
    return Crypt32.Load('CryptMsgUpdate')(hCryptMsg, pbData, cbData, fFinal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmsgverifycountersignatureencoded
  public static CryptMsgVerifyCountersignatureEncoded(
    hCryptProv: Optional<HCRYPTPROV>,
    dwEncodingType: DWORD,
    pbSignerInfo: PBYTE,
    cbSignerInfo: DWORD,
    pbSignerInfoCountersignature: PBYTE,
    cbSignerInfoCountersignature: DWORD,
    pciCountersigner: PCERT_INFO,
  ): BOOL {
    return Crypt32.Load('CryptMsgVerifyCountersignatureEncoded')(hCryptProv, dwEncodingType, pbSignerInfo, cbSignerInfo, pbSignerInfoCountersignature, cbSignerInfoCountersignature, pciCountersigner);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptmsgverifycountersignatureencodedex
  public static CryptMsgVerifyCountersignatureEncodedEx(
    hCryptProv: Optional<HCRYPTPROV>,
    dwEncodingType: DWORD,
    pbSignerInfo: PBYTE,
    cbSignerInfo: DWORD,
    pbSignerInfoCountersignature: PBYTE,
    cbSignerInfoCountersignature: DWORD,
    dwSignerType: DWORD,
    pvSigner: PVOID,
    dwFlags: DWORD,
    pvExtra_in_out: Optional<PVOID>,
  ): BOOL {
    return Crypt32.Load('CryptMsgVerifyCountersignatureEncodedEx')(hCryptProv, dwEncodingType, pbSignerInfo, cbSignerInfo, pbSignerInfoCountersignature, cbSignerInfoCountersignature, dwSignerType, pvSigner, dwFlags, pvExtra_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptprotectdata
  public static CryptProtectData(
    pDataIn: PDATA_BLOB,
    szDataDescr: Optional<LPCWSTR>,
    pOptionalEntropy: Optional<PDATA_BLOB>,
    pvReserved: Optional<PVOID>,
    pPromptStruct: Optional<PCRYPTPROTECT_PROMPTSTRUCT>,
    dwFlags: DWORD,
    pDataOut_out: PDATA_BLOB,
  ): BOOL {
    return Crypt32.Load('CryptProtectData')(pDataIn, szDataDescr, pOptionalEntropy, pvReserved, pPromptStruct, dwFlags, pDataOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptqueryobject
  public static CryptQueryObject(
    dwObjectType: DWORD,
    pvObject: PVOID,
    dwExpectedContentTypeFlags: DWORD,
    dwExpectedFormatTypeFlags: DWORD,
    dwFlags: DWORD,
    pdwMsgAndCertEncodingType_out: Optional<PDWORD>,
    pdwContentType_out: Optional<PDWORD>,
    pdwFormatType_out: Optional<PDWORD>,
    phCertStore_out: Optional<PVOID>,
    phMsg_out: Optional<PVOID>,
    ppvContext_out: Optional<PVOID>,
  ): BOOL {
    return Crypt32.Load('CryptQueryObject')(
      dwObjectType,
      pvObject,
      dwExpectedContentTypeFlags,
      dwExpectedFormatTypeFlags,
      dwFlags,
      pdwMsgAndCertEncodingType_out,
      pdwContentType_out,
      pdwFormatType_out,
      phCertStore_out,
      phMsg_out,
      ppvContext_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptregisterdefaultoidfunction
  public static CryptRegisterDefaultOIDFunction(dwEncodingType: DWORD, pszFuncName: LPCSTR, dwIndex: DWORD, pwszDll: LPCWSTR): BOOL {
    return Crypt32.Load('CryptRegisterDefaultOIDFunction')(dwEncodingType, pszFuncName, dwIndex, pwszDll);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptregisteroidfunction
  public static CryptRegisterOIDFunction(dwEncodingType: DWORD, pszFuncName: LPCSTR, pszOID: LPCSTR, pwszDll: Optional<LPCWSTR>, pszOverrideFuncName: Optional<LPCSTR>): BOOL {
    return Crypt32.Load('CryptRegisterOIDFunction')(dwEncodingType, pszFuncName, pszOID, pwszDll, pszOverrideFuncName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptregisteroidinfo
  public static CryptRegisterOIDInfo(pInfo: PCCRYPT_OID_INFO, dwFlags: DWORD): BOOL {
    return Crypt32.Load('CryptRegisterOIDInfo')(pInfo, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptretrievetimestamp
  public static CryptRetrieveTimeStamp(
    wszUrl: LPCWSTR,
    dwRetrievalFlags: DWORD,
    dwTimeout: DWORD,
    pszHashId: LPCSTR,
    pPara: Optional<PCRYPT_TIMESTAMP_PARA>,
    pbData: PBYTE,
    cbData: DWORD,
    ppTsContext_out: PVOID,
    ppTsSigner_out: Nullable<PVOID>,
    phStore_out: Optional<PVOID>,
  ): BOOL {
    return Crypt32.Load('CryptRetrieveTimeStamp')(wszUrl, dwRetrievalFlags, dwTimeout, pszHashId, pPara, pbData, cbData, ppTsContext_out, ppTsSigner_out, phStore_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipaddprovider
  public static CryptSIPAddProvider(psNewProv: PSIP_ADD_NEWPROVIDER): BOOL {
    return Crypt32.Load('CryptSIPAddProvider')(psNewProv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipcreateindirectdata
  public static CryptSIPCreateIndirectData(pSubjectInfo: PSIP_SUBJECTINFO, pcbIndirectData_in_out: PDWORD, pIndirectData_out: Nullable<PSIP_INDIRECT_DATA>): BOOL {
    return Crypt32.Load('CryptSIPCreateIndirectData')(pSubjectInfo, pcbIndirectData_in_out, pIndirectData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipgetcaps
  public static CryptSIPGetCaps(pSubjInfo: PSIP_SUBJECTINFO, pCaps_in_out: PSIP_CAP_SET_V3): BOOL {
    return Crypt32.Load('CryptSIPGetCaps')(pSubjInfo, pCaps_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipgetsealeddigest
  public static CryptSIPGetSealedDigest(pSubjectInfo: PSIP_SUBJECTINFO, pSig: Optional<PBYTE>, dwSig: DWORD, pbDigest_out: Optional<PBYTE>, pcbDigest_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptSIPGetSealedDigest')(pSubjectInfo, pSig, dwSig, pbDigest_out, pcbDigest_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipgetsigneddatamsg
  public static CryptSIPGetSignedDataMsg(pSubjectInfo: PSIP_SUBJECTINFO, pdwEncodingType_out: PDWORD, dwIndex: DWORD, pcbSignedDataMsg_in_out: PDWORD, pbSignedDataMsg_out: Nullable<PBYTE>): BOOL {
    return Crypt32.Load('CryptSIPGetSignedDataMsg')(pSubjectInfo, pdwEncodingType_out, dwIndex, pcbSignedDataMsg_in_out, pbSignedDataMsg_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipload
  public static CryptSIPLoad(pgSubject: PVOID, dwFlags: DWORD, pSipDispatch_in_out: PSIP_DISPATCH_INFO): BOOL {
    return Crypt32.Load('CryptSIPLoad')(pgSubject, dwFlags, pSipDispatch_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipputsigneddatamsg
  public static CryptSIPPutSignedDataMsg(pSubjectInfo: PSIP_SUBJECTINFO, dwEncodingType: DWORD, pdwIndex_out: PDWORD, cbSignedDataMsg: DWORD, pbSignedDataMsg: PBYTE): BOOL {
    return Crypt32.Load('CryptSIPPutSignedDataMsg')(pSubjectInfo, dwEncodingType, pdwIndex_out, cbSignedDataMsg, pbSignedDataMsg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipremoveprovider
  public static CryptSIPRemoveProvider(pgProv: PVOID): BOOL {
    return Crypt32.Load('CryptSIPRemoveProvider')(pgProv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipremovesigneddatamsg
  public static CryptSIPRemoveSignedDataMsg(pSubjectInfo: PSIP_SUBJECTINFO, dwIndex: DWORD): BOOL {
    return Crypt32.Load('CryptSIPRemoveSignedDataMsg')(pSubjectInfo, dwIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipretrievesubjectguid
  public static CryptSIPRetrieveSubjectGuid(wszFileName: LPCWSTR, hFileIn: Optional<HANDLE>, pgSubject_out: PVOID): BOOL {
    return Crypt32.Load('CryptSIPRetrieveSubjectGuid')(wszFileName, hFileIn, pgSubject_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipretrievesubjectguidforcatalogfile
  public static CryptSIPRetrieveSubjectGuidForCatalogFile(wszFileName: LPCWSTR, hFileIn: Optional<HANDLE>, pgSubject_out: PVOID): BOOL {
    return Crypt32.Load('CryptSIPRetrieveSubjectGuidForCatalogFile')(wszFileName, hFileIn, pgSubject_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipverifyindirectdata
  public static CryptSIPVerifyIndirectData(pSubjectInfo: PSIP_SUBJECTINFO, pIndirectData: PSIP_INDIRECT_DATA): BOOL {
    return Crypt32.Load('CryptSIPVerifyIndirectData')(pSubjectInfo, pIndirectData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsetasyncparam
  public static CryptSetAsyncParam(hAsync: HCRYPTASYNC, pszParamOid: LPCSTR, pvParam: Optional<LPVOID>, pfnFree: Nullable<PVOID>): BOOL {
    return Crypt32.Load('CryptSetAsyncParam')(hAsync, pszParamOid, pvParam, pfnFree);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsetkeyidentifierproperty
  public static CryptSetKeyIdentifierProperty(pKeyIdentifier: PCRYPT_DATA_BLOB, dwPropId: DWORD, dwFlags: DWORD, pwszComputerName: Optional<LPCWSTR>, pvReserved: Optional<PVOID>, pvData: Optional<PVOID>): BOOL {
    return Crypt32.Load('CryptSetKeyIdentifierProperty')(pKeyIdentifier, dwPropId, dwFlags, pwszComputerName, pvReserved, pvData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsetoidfunctionvalue
  public static CryptSetOIDFunctionValue(dwEncodingType: DWORD, pszFuncName: LPCSTR, pszOID: LPCSTR, pwszValueName: Optional<LPCWSTR>, dwValueType: DWORD, pbValueData: Optional<PBYTE>, cbValueData: DWORD): BOOL {
    return Crypt32.Load('CryptSetOIDFunctionValue')(dwEncodingType, pszFuncName, pszOID, pwszValueName, dwValueType, pbValueData, cbValueData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsignandencodecertificate
  public static CryptSignAndEncodeCertificate(
    hCryptProvOrNCryptKey: Optional<HCRYPTPROV_OR_NCRYPT_KEY_HANDLE>,
    dwKeySpec: DWORD,
    dwCertEncodingType: DWORD,
    lpszStructType: LPCSTR,
    pvStructInfo: PVOID,
    pSignatureAlgorithm: PCRYPT_ALGORITHM_IDENTIFIER,
    pvHashAuxInfo: Optional<PVOID>,
    pbEncoded_out: Optional<PBYTE>,
    pcbEncoded_in_out: PDWORD,
  ): BOOL {
    return Crypt32.Load('CryptSignAndEncodeCertificate')(hCryptProvOrNCryptKey, dwKeySpec, dwCertEncodingType, lpszStructType, pvStructInfo, pSignatureAlgorithm, pvHashAuxInfo, pbEncoded_out, pcbEncoded_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsignandencryptmessage
  public static CryptSignAndEncryptMessage(
    pSignPara: PCRYPT_SIGN_MESSAGE_PARA,
    pEncryptPara: PCRYPT_ENCRYPT_MESSAGE_PARA,
    cRecipientCert: DWORD,
    rgpRecipientCert: PVOID,
    pbToBeSignedAndEncrypted: PBYTE,
    cbToBeSignedAndEncrypted: DWORD,
    pbSignedAndEncryptedBlob_out: Optional<PBYTE>,
    pcbSignedAndEncryptedBlob_in_out: PDWORD,
  ): BOOL {
    return Crypt32.Load('CryptSignAndEncryptMessage')(pSignPara, pEncryptPara, cRecipientCert, rgpRecipientCert, pbToBeSignedAndEncrypted, cbToBeSignedAndEncrypted, pbSignedAndEncryptedBlob_out, pcbSignedAndEncryptedBlob_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsigncertificate
  public static CryptSignCertificate(
    hCryptProvOrNCryptKey: Optional<HCRYPTPROV_OR_NCRYPT_KEY_HANDLE>,
    dwKeySpec: DWORD,
    dwCertEncodingType: DWORD,
    pbEncodedToBeSigned: PBYTE,
    cbEncodedToBeSigned: DWORD,
    pSignatureAlgorithm: PCRYPT_ALGORITHM_IDENTIFIER,
    pvHashAuxInfo: Optional<PVOID>,
    pbSignature_out: Optional<PBYTE>,
    pcbSignature_in_out: PDWORD,
  ): BOOL {
    return Crypt32.Load('CryptSignCertificate')(hCryptProvOrNCryptKey, dwKeySpec, dwCertEncodingType, pbEncodedToBeSigned, cbEncodedToBeSigned, pSignatureAlgorithm, pvHashAuxInfo, pbSignature_out, pcbSignature_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsignmessage
  public static CryptSignMessage(
    pSignPara: PCRYPT_SIGN_MESSAGE_PARA,
    fDetachedSignature: BOOL,
    cToBeSigned: DWORD,
    rgpbToBeSigned: Optional<PVOID>,
    rgcbToBeSigned: PDWORD,
    pbSignedBlob_out: Optional<PBYTE>,
    pcbSignedBlob_in_out: PDWORD,
  ): BOOL {
    return Crypt32.Load('CryptSignMessage')(pSignPara, fDetachedSignature, cToBeSigned, rgpbToBeSigned, rgcbToBeSigned, pbSignedBlob_out, pcbSignedBlob_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsignmessagewithkey
  public static CryptSignMessageWithKey(pSignPara: PCRYPT_KEY_SIGN_MESSAGE_PARA, pbToBeSigned: PBYTE, cbToBeSigned: DWORD, pbSignedBlob_out: Optional<PBYTE>, pcbSignedBlob_in_out: PDWORD): BOOL {
    return Crypt32.Load('CryptSignMessageWithKey')(pSignPara, pbToBeSigned, cbToBeSigned, pbSignedBlob_out, pcbSignedBlob_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptstringtobinarya
  public static CryptStringToBinaryA(pszString: LPCSTR, cchString: DWORD, dwFlags: DWORD, pbBinary_out: Optional<PBYTE>, pcbBinary_in_out: PDWORD, pdwSkip_out: Optional<PDWORD>, pdwFlags_out: Optional<PDWORD>): BOOL {
    return Crypt32.Load('CryptStringToBinaryA')(pszString, cchString, dwFlags, pbBinary_out, pcbBinary_in_out, pdwSkip_out, pdwFlags_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptstringtobinaryw
  public static CryptStringToBinaryW(pszString: LPCWSTR, cchString: DWORD, dwFlags: DWORD, pbBinary_out: Optional<PBYTE>, pcbBinary_in_out: PDWORD, pdwSkip_out: Optional<PDWORD>, pdwFlags_out: Optional<PDWORD>): BOOL {
    return Crypt32.Load('CryptStringToBinaryW')(pszString, cchString, dwFlags, pbBinary_out, pcbBinary_in_out, pdwSkip_out, pdwFlags_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptuninstalldefaultcontext
  public static CryptUninstallDefaultContext(hDefaultContext: Optional<HCRYPTDEFAULTCONTEXT>, dwFlags: DWORD, pvReserved: Optional<PVOID>): BOOL {
    return Crypt32.Load('CryptUninstallDefaultContext')(hDefaultContext, dwFlags, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptunprotectdata
  public static CryptUnprotectData(
    pDataIn: PDATA_BLOB,
    ppszDataDescr_out: Optional<PVOID>,
    pOptionalEntropy: Optional<PDATA_BLOB>,
    pvReserved: Optional<PVOID>,
    pPromptStruct: Optional<PCRYPTPROTECT_PROMPTSTRUCT>,
    dwFlags: DWORD,
    pDataOut_out: PDATA_BLOB,
  ): BOOL {
    return Crypt32.Load('CryptUnprotectData')(pDataIn, ppszDataDescr_out, pOptionalEntropy, pvReserved, pPromptStruct, dwFlags, pDataOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptunregisterdefaultoidfunction
  public static CryptUnregisterDefaultOIDFunction(dwEncodingType: DWORD, pszFuncName: LPCSTR, pwszDll: LPCWSTR): BOOL {
    return Crypt32.Load('CryptUnregisterDefaultOIDFunction')(dwEncodingType, pszFuncName, pwszDll);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptunregisteroidfunction
  public static CryptUnregisterOIDFunction(dwEncodingType: DWORD, pszFuncName: LPCSTR, pszOID: LPCSTR): BOOL {
    return Crypt32.Load('CryptUnregisterOIDFunction')(dwEncodingType, pszFuncName, pszOID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptunregisteroidinfo
  public static CryptUnregisterOIDInfo(pInfo: PCCRYPT_OID_INFO): BOOL {
    return Crypt32.Load('CryptUnregisterOIDInfo')(pInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptverifycertificatesignature
  public static CryptVerifyCertificateSignature(hCryptProv: Optional<HCRYPTPROV>, dwCertEncodingType: DWORD, pbEncoded: PBYTE, cbEncoded: DWORD, pPublicKey: PCERT_PUBLIC_KEY_INFO): BOOL {
    return Crypt32.Load('CryptVerifyCertificateSignature')(hCryptProv, dwCertEncodingType, pbEncoded, cbEncoded, pPublicKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptverifycertificatesignatureex
  public static CryptVerifyCertificateSignatureEx(
    hCryptProv: Optional<HCRYPTPROV>,
    dwCertEncodingType: DWORD,
    dwSubjectType: DWORD,
    pvSubject: PVOID,
    dwIssuerType: DWORD,
    pvIssuer: Optional<PVOID>,
    dwFlags: DWORD,
    pvExtra_in_out: Optional<PVOID>,
  ): BOOL {
    return Crypt32.Load('CryptVerifyCertificateSignatureEx')(hCryptProv, dwCertEncodingType, dwSubjectType, pvSubject, dwIssuerType, pvIssuer, dwFlags, pvExtra_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptverifydetachedmessagehash
  public static CryptVerifyDetachedMessageHash(
    pHashPara: PCRYPT_HASH_MESSAGE_PARA,
    pbDetachedHashBlob: PBYTE,
    cbDetachedHashBlob: DWORD,
    cToBeHashed: DWORD,
    rgpbToBeHashed: PVOID,
    rgcbToBeHashed: PDWORD,
    pbComputedHash_out: Optional<PBYTE>,
    pcbComputedHash_in_out: Optional<PDWORD>,
  ): BOOL {
    return Crypt32.Load('CryptVerifyDetachedMessageHash')(pHashPara, pbDetachedHashBlob, cbDetachedHashBlob, cToBeHashed, rgpbToBeHashed, rgcbToBeHashed, pbComputedHash_out, pcbComputedHash_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptverifydetachedmessagesignature
  public static CryptVerifyDetachedMessageSignature(
    pVerifyPara: PCRYPT_VERIFY_MESSAGE_PARA,
    dwSignerIndex: DWORD,
    pbDetachedSignBlob: PBYTE,
    cbDetachedSignBlob: DWORD,
    cToBeSigned: DWORD,
    rgpbToBeSigned: PVOID,
    rgcbToBeSigned: PDWORD,
    ppSignerCert_out: Optional<PVOID>,
  ): BOOL {
    return Crypt32.Load('CryptVerifyDetachedMessageSignature')(pVerifyPara, dwSignerIndex, pbDetachedSignBlob, cbDetachedSignBlob, cToBeSigned, rgpbToBeSigned, rgcbToBeSigned, ppSignerCert_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptverifymessagehash
  public static CryptVerifyMessageHash(
    pHashPara: PCRYPT_HASH_MESSAGE_PARA,
    pbHashedBlob: PBYTE,
    cbHashedBlob: DWORD,
    pbToBeHashed_out: Optional<PBYTE>,
    pcbToBeHashed_in_out: Optional<PDWORD>,
    pbComputedHash_out: Optional<PBYTE>,
    pcbComputedHash_in_out: Optional<PDWORD>,
  ): BOOL {
    return Crypt32.Load('CryptVerifyMessageHash')(pHashPara, pbHashedBlob, cbHashedBlob, pbToBeHashed_out, pcbToBeHashed_in_out, pbComputedHash_out, pcbComputedHash_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptverifymessagesignature
  public static CryptVerifyMessageSignature(
    pVerifyPara: PCRYPT_VERIFY_MESSAGE_PARA,
    dwSignerIndex: DWORD,
    pbSignedBlob: PBYTE,
    cbSignedBlob: DWORD,
    pbDecoded_out: Optional<PBYTE>,
    pcbDecoded_in_out: Optional<PDWORD>,
    ppSignerCert_out: Optional<PVOID>,
  ): BOOL {
    return Crypt32.Load('CryptVerifyMessageSignature')(pVerifyPara, dwSignerIndex, pbSignedBlob, cbSignedBlob, pbDecoded_out, pcbDecoded_in_out, ppSignerCert_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptverifymessagesignaturewithkey
  public static CryptVerifyMessageSignatureWithKey(
    pVerifyPara: PCRYPT_KEY_VERIFY_MESSAGE_PARA,
    pPublicKeyInfo: Optional<PCERT_PUBLIC_KEY_INFO>,
    pbSignedBlob: PBYTE,
    cbSignedBlob: DWORD,
    pbDecoded_out: Optional<PBYTE>,
    pcbDecoded_in_out: Optional<PDWORD>,
  ): BOOL {
    return Crypt32.Load('CryptVerifyMessageSignatureWithKey')(pVerifyPara, pPublicKeyInfo, pbSignedBlob, cbSignedBlob, pbDecoded_out, pcbDecoded_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptverifytimestampsignature
  public static CryptVerifyTimeStampSignature(
    pbTSContentInfo: PBYTE,
    cbTSContentInfo: DWORD,
    pbData: Optional<PBYTE>,
    cbData: DWORD,
    hAdditionalStore: Optional<HCERTSTORE>,
    ppTsContext_out: PVOID,
    ppTsSigner_out: Nullable<PVOID>,
    phStore_out: Optional<PVOID>,
  ): BOOL {
    return Crypt32.Load('CryptVerifyTimeStampSignature')(pbTSContentInfo, cbTSContentInfo, pbData, cbData, hAdditionalStore, ppTsContext_out, ppTsSigner_out, phStore_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-pfxexportcertstore
  public static PFXExportCertStore(hStore: HCERTSTORE, pPFX_in_out: PCRYPT_DATA_BLOB, szPassword: LPCWSTR, dwFlags: DWORD): BOOL {
    return Crypt32.Load('PFXExportCertStore')(hStore, pPFX_in_out, szPassword, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-pfxexportcertstoreex
  public static PFXExportCertStoreEx(hStore: HCERTSTORE, pPFX_in_out: PCRYPT_DATA_BLOB, szPassword: LPCWSTR, pvPara: Nullable<PVOID>, dwFlags: DWORD): BOOL {
    return Crypt32.Load('PFXExportCertStoreEx')(hStore, pPFX_in_out, szPassword, pvPara, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-pfximportcertstore
  public static PFXImportCertStore(pPFX: PCRYPT_DATA_BLOB, szPassword: Nullable<LPCWSTR>, dwFlags: DWORD): HCERTSTORE {
    return Crypt32.Load('PFXImportCertStore')(pPFX, szPassword, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-pfxispfxblob
  public static PFXIsPFXBlob(pPFX: PCRYPT_DATA_BLOB): BOOL {
    return Crypt32.Load('PFXIsPFXBlob')(pPFX);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-pfxverifypassword
  public static PFXVerifyPassword(pPFX: PCRYPT_DATA_BLOB, szPassword: LPCWSTR, dwFlags: DWORD): BOOL {
    return Crypt32.Load('PFXVerifyPassword')(pPFX, szPassword, dwFlags);
  }
}

export default Crypt32;
