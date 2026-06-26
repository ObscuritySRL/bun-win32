import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  HANDLE,
  HCATADMIN,
  HCATINFO,
  HCRYPTPROV,
  HRESULT,
  HWND,
  LONG,
  LPCSTR,
  LPCWSTR,
  LPVOID,
  LPWSTR,
  NULL,
  NULLABLE,
  OPTIONAL,
  PBYTE,
  PCATALOG_INFO,
  PCCERT_STRONG_SIGN_PARA,
  PCRYPT_PROVIDER_CERT,
  PCRYPT_PROVIDER_DATA,
  PCRYPT_PROVIDER_DEFUSAGE,
  PCRYPT_PROVIDER_FUNCTIONS,
  PCRYPT_PROVIDER_REGDEFUSAGE,
  PCRYPT_PROVIDER_SGNR,
  PCRYPT_REGISTER_ACTIONID,
  PCRYPTCATATTRIBUTE,
  PCRYPTCATMEMBER,
  PCWSTR,
  PDWORD,
  PHCATINFO,
  PSIP_INDIRECT_DATA,
  PSIP_SUBJECTINFO,
  PVOID,
  PWSTR,
} from '../types/Wintrust';

/**
 * Thin, lazy-loaded FFI bindings for `wintrust.dll`.
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
 * import Wintrust, { WINTRUST_ACTION_GENERIC_VERIFY_V2 } from './structs/Wintrust';
 *
 * // Lazy: bind on first call
 * const status = Wintrust.WinVerifyTrust(0n, WINTRUST_ACTION_GENERIC_VERIFY_V2.ptr, wintrustData.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Wintrust.Preload(['WinVerifyTrust', 'WTHelperProvDataFromStateData']);
 * ```
 */
class Wintrust extends Win32 {
  protected static override name = 'wintrust.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CryptCATAdminAcquireContext: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptCATAdminAcquireContext2: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptCATAdminAddCatalog: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    CryptCATAdminCalcHashFromFileHandle: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptCATAdminCalcHashFromFileHandle2: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptCATAdminEnumCatalogFromHash: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CryptCATAdminReleaseCatalogContext: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    CryptCATAdminReleaseContext: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    CryptCATAdminRemoveCatalog: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptCATAdminResolveCatalogPath: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptCATCatalogInfoFromContext: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptCATClose: { args: [FFIType.u64], returns: FFIType.i32 },
    CryptCATEnumerateAttr: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CryptCATEnumerateMember: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    CryptCATGetAttrInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CryptCATGetMemberInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    CryptCATOpen: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    CryptSIPCreateIndirectData: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptSIPGetSignedDataMsg: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptSIPPutSignedDataMsg: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptSIPRemoveSignedDataMsg: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptSIPVerifyIndirectData: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IsCatalogFile: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    OpenPersonalTrustDBDialog: { args: [FFIType.u64], returns: FFIType.i32 },
    OpenPersonalTrustDBDialogEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WinVerifyTrust: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinVerifyTrustEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WintrustAddActionID: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WintrustAddDefaultForUsage: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WintrustGetDefaultForUsage: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WintrustGetRegPolicyFlags: { args: [FFIType.ptr], returns: FFIType.void },
    WintrustLoadFunctionPointers: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WintrustRemoveActionID: { args: [FFIType.ptr], returns: FFIType.i32 },
    WintrustSetDefaultIncludePEPageHashes: { args: [FFIType.i32], returns: FFIType.void },
    WintrustSetRegPolicyFlags: { args: [FFIType.u32], returns: FFIType.i32 },
    WTHelperCertCheckValidSignature: { args: [FFIType.ptr], returns: FFIType.i32 },
    WTHelperGetProvCertFromChain: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    WTHelperGetProvSignerFromChain: { args: [FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u32], returns: FFIType.ptr },
    WTHelperProvDataFromStateData: { args: [FFIType.u64], returns: FFIType.ptr },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatadminacquirecontext
  public static CryptCATAdminAcquireContext(phCatAdmin_out: PHCATINFO, pgSubsystem: OPTIONAL<LPVOID>, dwFlags: DWORD): BOOL {
    return Wintrust.Load('CryptCATAdminAcquireContext')(phCatAdmin_out, pgSubsystem, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatadminacquirecontext2
  public static CryptCATAdminAcquireContext2(phCatAdmin_out: PHCATINFO, pgSubsystem: OPTIONAL<LPVOID>, pwszHashAlgorithm: OPTIONAL<PCWSTR>, pStrongHashPolicy: OPTIONAL<PCCERT_STRONG_SIGN_PARA>, dwFlags: DWORD): BOOL {
    return Wintrust.Load('CryptCATAdminAcquireContext2')(phCatAdmin_out, pgSubsystem, pwszHashAlgorithm, pStrongHashPolicy, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatadminaddcatalog
  public static CryptCATAdminAddCatalog(hCatAdmin: HCATADMIN, pwszCatalogFile: PWSTR, pwszSelectBaseName: OPTIONAL<PWSTR>, dwFlags: DWORD): HCATINFO {
    return Wintrust.Load('CryptCATAdminAddCatalog')(hCatAdmin, pwszCatalogFile, pwszSelectBaseName, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatadmincalchashfromfilehandle
  public static CryptCATAdminCalcHashFromFileHandle(hFile: HANDLE, pcbHash_in_out: PDWORD, pbHash_out: OPTIONAL<PBYTE>, dwFlags: DWORD): BOOL {
    return Wintrust.Load('CryptCATAdminCalcHashFromFileHandle')(hFile, pcbHash_in_out, pbHash_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatadmincalchashfromfilehandle2
  public static CryptCATAdminCalcHashFromFileHandle2(hCatAdmin: HCATADMIN, hFile: HANDLE, pcbHash_in_out: PDWORD, pbHash_out: OPTIONAL<PBYTE>, dwFlags: DWORD): BOOL {
    return Wintrust.Load('CryptCATAdminCalcHashFromFileHandle2')(hCatAdmin, hFile, pcbHash_in_out, pbHash_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatadminenumcatalogfromhash
  public static CryptCATAdminEnumCatalogFromHash(hCatAdmin: HCATADMIN, pbHash: PBYTE, cbHash: DWORD, dwFlags: DWORD, phPrevCatInfo_in_out: OPTIONAL<PHCATINFO>): HCATINFO {
    return Wintrust.Load('CryptCATAdminEnumCatalogFromHash')(hCatAdmin, pbHash, cbHash, dwFlags, phPrevCatInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatadminreleasecatalogcontext
  public static CryptCATAdminReleaseCatalogContext(hCatAdmin: HCATADMIN, hCatInfo: HCATINFO, dwFlags: DWORD): BOOL {
    return Wintrust.Load('CryptCATAdminReleaseCatalogContext')(hCatAdmin, hCatInfo, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatadminreleasecontext
  public static CryptCATAdminReleaseContext(hCatAdmin: HCATADMIN, dwFlags: DWORD): BOOL {
    return Wintrust.Load('CryptCATAdminReleaseContext')(hCatAdmin, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatadminremovecatalog
  public static CryptCATAdminRemoveCatalog(hCatAdmin: HCATADMIN, pwszCatalogFile: LPCWSTR, dwFlags: DWORD): BOOL {
    return Wintrust.Load('CryptCATAdminRemoveCatalog')(hCatAdmin, pwszCatalogFile, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatadminresolvecatalogpath
  public static CryptCATAdminResolveCatalogPath(hCatAdmin: HCATADMIN, pwszCatalogFile: PWSTR, psCatInfo_in_out: PCATALOG_INFO, dwFlags: DWORD): BOOL {
    return Wintrust.Load('CryptCATAdminResolveCatalogPath')(hCatAdmin, pwszCatalogFile, psCatInfo_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatcataloginfofromcontext
  public static CryptCATCatalogInfoFromContext(hCatInfo: HCATINFO, psCatInfo_in_out: PCATALOG_INFO, dwFlags: DWORD): BOOL {
    return Wintrust.Load('CryptCATCatalogInfoFromContext')(hCatInfo, psCatInfo_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatclose
  public static CryptCATClose(hCatalog: HANDLE): BOOL {
    return Wintrust.Load('CryptCATClose')(hCatalog);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatenumerateattr
  public static CryptCATEnumerateAttr(hCatalog: HANDLE, pCatMember: PCRYPTCATMEMBER, pPrevAttr: NULLABLE<PCRYPTCATATTRIBUTE>): PCRYPTCATATTRIBUTE | NULL {
    return Wintrust.Load('CryptCATEnumerateAttr')(hCatalog, pCatMember, pPrevAttr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatenumeratemember
  public static CryptCATEnumerateMember(hCatalog: HANDLE, pPrevMember: NULLABLE<PCRYPTCATMEMBER>): PCRYPTCATMEMBER | NULL {
    return Wintrust.Load('CryptCATEnumerateMember')(hCatalog, pPrevMember);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatgetattrinfo
  public static CryptCATGetAttrInfo(hCatalog: HANDLE, pCatMember: PCRYPTCATMEMBER, pwszReferenceTag: LPWSTR): PCRYPTCATATTRIBUTE | NULL {
    return Wintrust.Load('CryptCATGetAttrInfo')(hCatalog, pCatMember, pwszReferenceTag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatgetmemberinfo
  public static CryptCATGetMemberInfo(hCatalog: HANDLE, pwszReferenceTag: LPWSTR): PCRYPTCATMEMBER | NULL {
    return Wintrust.Load('CryptCATGetMemberInfo')(hCatalog, pwszReferenceTag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-cryptcatopen
  public static CryptCATOpen(pwszFileName: LPWSTR, fdwOpenFlags: DWORD, hProv: OPTIONAL<HCRYPTPROV>, dwPublicVersion: DWORD, dwEncodingType: DWORD): HANDLE {
    return Wintrust.Load('CryptCATOpen')(pwszFileName, fdwOpenFlags, hProv, dwPublicVersion, dwEncodingType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipcreateindirectdata
  public static CryptSIPCreateIndirectData(pSubjectInfo: PSIP_SUBJECTINFO, pcbIndirectData_in_out: PDWORD, pIndirectData_out: NULLABLE<PSIP_INDIRECT_DATA>): BOOL {
    return Wintrust.Load('CryptSIPCreateIndirectData')(pSubjectInfo, pcbIndirectData_in_out, pIndirectData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipgetsigneddatamsg
  public static CryptSIPGetSignedDataMsg(pSubjectInfo: PSIP_SUBJECTINFO, pdwEncodingType_out: PDWORD, dwIndex: DWORD, pcbSignedDataMsg_in_out: PDWORD, pbSignedDataMsg_out: NULLABLE<PBYTE>): BOOL {
    return Wintrust.Load('CryptSIPGetSignedDataMsg')(pSubjectInfo, pdwEncodingType_out, dwIndex, pcbSignedDataMsg_in_out, pbSignedDataMsg_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipputsigneddatamsg
  public static CryptSIPPutSignedDataMsg(pSubjectInfo: PSIP_SUBJECTINFO, dwEncodingType: DWORD, pdwIndex_out: PDWORD, cbSignedDataMsg: DWORD, pbSignedDataMsg: PBYTE): BOOL {
    return Wintrust.Load('CryptSIPPutSignedDataMsg')(pSubjectInfo, dwEncodingType, pdwIndex_out, cbSignedDataMsg, pbSignedDataMsg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipremovesigneddatamsg
  public static CryptSIPRemoveSignedDataMsg(pSubjectInfo: PSIP_SUBJECTINFO, dwIndex: DWORD): BOOL {
    return Wintrust.Load('CryptSIPRemoveSignedDataMsg')(pSubjectInfo, dwIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mssip/nf-mssip-cryptsipverifyindirectdata
  public static CryptSIPVerifyIndirectData(pSubjectInfo: PSIP_SUBJECTINFO, pIndirectData: PSIP_INDIRECT_DATA): BOOL {
    return Wintrust.Load('CryptSIPVerifyIndirectData')(pSubjectInfo, pIndirectData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mscat/nf-mscat-iscatalogfile
  public static IsCatalogFile(hFile: OPTIONAL<HANDLE>, pwszFileName: OPTIONAL<LPWSTR>): BOOL {
    return Wintrust.Load('IsCatalogFile')(hFile, pwszFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-openpersonaltrustdbdialog
  public static OpenPersonalTrustDBDialog(hwndParent: OPTIONAL<HWND>): BOOL {
    return Wintrust.Load('OpenPersonalTrustDBDialog')(hwndParent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-openpersonaltrustdbdialogex
  public static OpenPersonalTrustDBDialogEx(hwndParent: OPTIONAL<HWND>, dwFlags: DWORD, pvReserved_in_out: OPTIONAL<LPVOID>): BOOL {
    return Wintrust.Load('OpenPersonalTrustDBDialogEx')(hwndParent, dwFlags, pvReserved_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-wthelpercertcheckvalidsignature
  public static WTHelperCertCheckValidSignature(pProvData: PCRYPT_PROVIDER_DATA): HRESULT {
    return Wintrust.Load('WTHelperCertCheckValidSignature')(pProvData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-wthelpergetprovcertfromchain
  public static WTHelperGetProvCertFromChain(pSgnr: PCRYPT_PROVIDER_SGNR, idxCert: DWORD): PCRYPT_PROVIDER_CERT | NULL {
    return Wintrust.Load('WTHelperGetProvCertFromChain')(pSgnr, idxCert);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-wthelpergetprovsignerfromchain
  public static WTHelperGetProvSignerFromChain(pProvData: PCRYPT_PROVIDER_DATA, idxSigner: DWORD, fCounterSigner: BOOL, idxCounterSigner: DWORD): PCRYPT_PROVIDER_SGNR | NULL {
    return Wintrust.Load('WTHelperGetProvSignerFromChain')(pProvData, idxSigner, fCounterSigner, idxCounterSigner);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-wthelperprovdatafromstatedata
  public static WTHelperProvDataFromStateData(hStateData: HANDLE): PCRYPT_PROVIDER_DATA | NULL {
    return Wintrust.Load('WTHelperProvDataFromStateData')(hStateData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-winverifytrust
  public static WinVerifyTrust(hwnd: NULLABLE<HWND>, pgActionID: LPVOID, pWVTData: LPVOID): LONG {
    return Wintrust.Load('WinVerifyTrust')(hwnd, pgActionID, pWVTData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-winverifytrustex
  public static WinVerifyTrustEx(hwnd: NULLABLE<HWND>, pgActionID: LPVOID, pWinTrustData: LPVOID): LONG {
    return Wintrust.Load('WinVerifyTrustEx')(hwnd, pgActionID, pWinTrustData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-wintrustaddactionid
  public static WintrustAddActionID(pgActionID: LPVOID, fdwFlags: DWORD, psProvInfo: PCRYPT_REGISTER_ACTIONID): BOOL {
    return Wintrust.Load('WintrustAddActionID')(pgActionID, fdwFlags, psProvInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-wintrustadddefaultforusage
  public static WintrustAddDefaultForUsage(pszUsageOID: LPCSTR, psDefUsage: PCRYPT_PROVIDER_REGDEFUSAGE): BOOL {
    return Wintrust.Load('WintrustAddDefaultForUsage')(pszUsageOID, psDefUsage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-wintrustgetdefaultforusage
  public static WintrustGetDefaultForUsage(dwAction: DWORD, pszUsageOID: LPCSTR, psUsage_in_out: PCRYPT_PROVIDER_DEFUSAGE): BOOL {
    return Wintrust.Load('WintrustGetDefaultForUsage')(dwAction, pszUsageOID, psUsage_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-wintrustgetregpolicyflags
  public static WintrustGetRegPolicyFlags(pdwPolicyFlags_out: PDWORD): void {
    return Wintrust.Load('WintrustGetRegPolicyFlags')(pdwPolicyFlags_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-wintrustloadfunctionpointers
  public static WintrustLoadFunctionPointers(pgActionID: LPVOID, pPfns_out: PCRYPT_PROVIDER_FUNCTIONS): BOOL {
    return Wintrust.Load('WintrustLoadFunctionPointers')(pgActionID, pPfns_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-wintrustremoveactionid
  public static WintrustRemoveActionID(pgActionID: LPVOID): BOOL {
    return Wintrust.Load('WintrustRemoveActionID')(pgActionID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-wintrustsetdefaultincludepepagehashes
  public static WintrustSetDefaultIncludePEPageHashes(fIncludePEPageHashes: BOOL): void {
    return Wintrust.Load('WintrustSetDefaultIncludePEPageHashes')(fIncludePEPageHashes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-wintrustsetregpolicyflags
  public static WintrustSetRegPolicyFlags(dwPolicyFlags: DWORD): BOOL {
    return Wintrust.Load('WintrustSetRegPolicyFlags')(dwPolicyFlags);
  }
}

export default Wintrust;
