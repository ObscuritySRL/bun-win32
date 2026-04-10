import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  ASYNCCOMPLETIONHANDLE,
  BOOL,
  DWORD,
  HANDLE,
  HRESULT,
  LPBOOL,
  LPCSTR,
  LPCWSTR,
  LPDWORD,
  LPLPVOID,
  LPPOLICYSETTINGSTATUSINFO,
  LPPROFILEINFOA,
  LPPROFILEINFOW,
  LPSTR,
  LPVOID,
  LPWSTR,
  NULL,
  PGENERIC_MAPPING,
  PGROUP_POLICY_OBJECTA,
  PGROUP_POLICY_OBJECTW,
  PHKEY,
  PIWbemClassObject,
  PIWbemServices,
  POBJECT_TYPE_LIST,
  PPRIVILEGE_SET,
  PRSOPTOKEN,
  PSECURITY_DESCRIPTOR,
  PSID,
  PSID_AND_ATTRIBUTES,
  REFGPEXTENSIONID,
  REGSAM,
} from '../types/Userenv';

/**
 * Thin, lazy-loaded FFI bindings for `userenv.dll`.
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
 * import Userenv from './structs/Userenv';
 *
 * // Lazy: bind on first call
 * const result = Userenv.GetUserProfileDirectoryW(hToken, buffer.ptr, sizePtr.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Userenv.Preload(['GetUserProfileDirectoryW', 'CreateEnvironmentBlock']);
 * ```
 */
class Userenv extends Win32 {
  protected static override name = 'userenv.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CreateAppContainerProfile: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CreateEnvironmentBlock: { args: [FFIType.ptr, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    CreateProfile: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DeleteAppContainerProfile: { args: [FFIType.ptr], returns: FFIType.i32 },
    DeleteProfileA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeleteProfileW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeriveAppContainerSidFromAppContainerName: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeriveRestrictedAppContainerSidFromAppContainerSidAndRestrictedName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DestroyEnvironmentBlock: { args: [FFIType.ptr], returns: FFIType.i32 },
    EnterCriticalPolicySection: { args: [FFIType.i32], returns: FFIType.u64 },
    ExpandEnvironmentStringsForUserA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    ExpandEnvironmentStringsForUserW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    FreeGPOListA: { args: [FFIType.ptr], returns: FFIType.i32 },
    FreeGPOListW: { args: [FFIType.ptr], returns: FFIType.i32 },
    GenerateGPNotification: { args: [FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetAllUsersProfileDirectoryA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetAllUsersProfileDirectoryW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetAppContainerFolderPath: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetAppContainerRegistryLocation: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetAppliedGPOListA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetAppliedGPOListW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetDefaultUserProfileDirectoryA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetDefaultUserProfileDirectoryW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetGPOListA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetGPOListW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetProfileType: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetProfilesDirectoryA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetProfilesDirectoryW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetUserProfileDirectoryA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetUserProfileDirectoryW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LeaveCriticalPolicySection: { args: [FFIType.u64], returns: FFIType.i32 },
    LoadUserProfileA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    LoadUserProfileW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ProcessGroupPolicyCompleted: { args: [FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    ProcessGroupPolicyCompletedEx: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    RefreshPolicy: { args: [FFIType.i32], returns: FFIType.i32 },
    RefreshPolicyEx: { args: [FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    RegisterGPNotification: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    RsopAccessCheckByType: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RsopFileAccessCheck: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RsopResetPolicySettingStatus: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RsopSetPolicySettingStatus: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    UnloadUserProfile: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    UnregisterGPNotification: { args: [FFIType.u64], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-createappcontainerprofile
  public static CreateAppContainerProfile(pszAppContainerName: LPCWSTR, pszDisplayName: LPCWSTR, pszDescription: LPCWSTR, pCapabilities: PSID_AND_ATTRIBUTES | NULL, dwCapabilityCount: DWORD, ppSidAppContainerSid: LPLPVOID): HRESULT {
    return Userenv.Load('CreateAppContainerProfile')(pszAppContainerName, pszDisplayName, pszDescription, pCapabilities, dwCapabilityCount, ppSidAppContainerSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-createenvironmentblock
  public static CreateEnvironmentBlock(lpEnvironment: LPLPVOID, hToken: HANDLE | 0n, bInherit: BOOL): BOOL {
    return Userenv.Load('CreateEnvironmentBlock')(lpEnvironment, hToken, bInherit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-createprofile
  public static CreateProfile(pszUserSid: LPCWSTR, pszUserName: LPCWSTR, pszProfilePath: LPWSTR, cchProfilePath: DWORD): HRESULT {
    return Userenv.Load('CreateProfile')(pszUserSid, pszUserName, pszProfilePath, cchProfilePath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-deleteappcontainerprofile
  public static DeleteAppContainerProfile(pszAppContainerName: LPCWSTR): HRESULT {
    return Userenv.Load('DeleteAppContainerProfile')(pszAppContainerName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-deleteprofilea
  public static DeleteProfileA(lpSidString: LPCSTR, lpProfilePath: LPCSTR | NULL, lpComputerName: LPCSTR | NULL): BOOL {
    return Userenv.Load('DeleteProfileA')(lpSidString, lpProfilePath, lpComputerName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-deleteprofilew
  public static DeleteProfileW(lpSidString: LPCWSTR, lpProfilePath: LPCWSTR | NULL, lpComputerName: LPCWSTR | NULL): BOOL {
    return Userenv.Load('DeleteProfileW')(lpSidString, lpProfilePath, lpComputerName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-deriveappcontainersidfromappcontainername
  public static DeriveAppContainerSidFromAppContainerName(pszAppContainerName: LPCWSTR, ppsidAppContainerSid: LPLPVOID): HRESULT {
    return Userenv.Load('DeriveAppContainerSidFromAppContainerName')(pszAppContainerName, ppsidAppContainerSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-deriverestrictedappcontainersidfromappcontainersidandrestrictedname
  public static DeriveRestrictedAppContainerSidFromAppContainerSidAndRestrictedName(psidAppContainerSid: PSID, pszRestrictedAppContainerName: LPCWSTR, ppsidRestrictedAppContainerSid: LPLPVOID): HRESULT {
    return Userenv.Load('DeriveRestrictedAppContainerSidFromAppContainerSidAndRestrictedName')(psidAppContainerSid, pszRestrictedAppContainerName, ppsidRestrictedAppContainerSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-destroyenvironmentblock
  public static DestroyEnvironmentBlock(lpEnvironment: LPVOID): BOOL {
    return Userenv.Load('DestroyEnvironmentBlock')(lpEnvironment);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-entercriticalpolicysection
  public static EnterCriticalPolicySection(bMachine: BOOL): HANDLE {
    return Userenv.Load('EnterCriticalPolicySection')(bMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-expandenvironmentstringsforusera
  public static ExpandEnvironmentStringsForUserA(hToken: HANDLE | 0n, lpSrc: LPCSTR, lpDest: LPSTR, dwSize: DWORD): BOOL {
    return Userenv.Load('ExpandEnvironmentStringsForUserA')(hToken, lpSrc, lpDest, dwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-expandenvironmentstringsforuserw
  public static ExpandEnvironmentStringsForUserW(hToken: HANDLE | 0n, lpSrc: LPCWSTR, lpDest: LPWSTR, dwSize: DWORD): BOOL {
    return Userenv.Load('ExpandEnvironmentStringsForUserW')(hToken, lpSrc, lpDest, dwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-freegpolista
  public static FreeGPOListA(pGPOList: PGROUP_POLICY_OBJECTA): BOOL {
    return Userenv.Load('FreeGPOListA')(pGPOList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-freegpolistw
  public static FreeGPOListW(pGPOList: PGROUP_POLICY_OBJECTW): BOOL {
    return Userenv.Load('FreeGPOListW')(pGPOList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-generategpnotification
  public static GenerateGPNotification(bMachine: BOOL, lpwszMgmtProduct: LPCWSTR, dwMgmtProductOptions: DWORD): DWORD {
    return Userenv.Load('GenerateGPNotification')(bMachine, lpwszMgmtProduct, dwMgmtProductOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-getallusersprofiledirectorya
  public static GetAllUsersProfileDirectoryA(lpProfileDir: LPSTR | NULL, lpcchSize: LPDWORD): BOOL {
    return Userenv.Load('GetAllUsersProfileDirectoryA')(lpProfileDir, lpcchSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-getallusersprofiledirectoryw
  public static GetAllUsersProfileDirectoryW(lpProfileDir: LPWSTR | NULL, lpcchSize: LPDWORD): BOOL {
    return Userenv.Load('GetAllUsersProfileDirectoryW')(lpProfileDir, lpcchSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-getappcontainerfolderpath
  public static GetAppContainerFolderPath(pszAppContainerSid: LPCWSTR, ppszPath: LPLPVOID): HRESULT {
    return Userenv.Load('GetAppContainerFolderPath')(pszAppContainerSid, ppszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-getappcontainerregistrylocation
  public static GetAppContainerRegistryLocation(desiredAccess: REGSAM, phAppContainerKey: PHKEY): HRESULT {
    return Userenv.Load('GetAppContainerRegistryLocation')(desiredAccess, phAppContainerKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-getappliedgpolista
  public static GetAppliedGPOListA(dwFlags: DWORD, pMachineName: LPCSTR | NULL, pSidUser: PSID | NULL, pGuidExtension: LPVOID, ppGPOList: LPLPVOID): DWORD {
    return Userenv.Load('GetAppliedGPOListA')(dwFlags, pMachineName, pSidUser, pGuidExtension, ppGPOList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-getappliedgpolistw
  public static GetAppliedGPOListW(dwFlags: DWORD, pMachineName: LPCWSTR | NULL, pSidUser: PSID | NULL, pGuidExtension: LPVOID, ppGPOList: LPLPVOID): DWORD {
    return Userenv.Load('GetAppliedGPOListW')(dwFlags, pMachineName, pSidUser, pGuidExtension, ppGPOList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-getdefaultuserprofiledirectorya
  public static GetDefaultUserProfileDirectoryA(lpProfileDir: LPSTR | NULL, lpcchSize: LPDWORD): BOOL {
    return Userenv.Load('GetDefaultUserProfileDirectoryA')(lpProfileDir, lpcchSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-getdefaultuserprofiledirectoryw
  public static GetDefaultUserProfileDirectoryW(lpProfileDir: LPWSTR | NULL, lpcchSize: LPDWORD): BOOL {
    return Userenv.Load('GetDefaultUserProfileDirectoryW')(lpProfileDir, lpcchSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-getgpolista
  public static GetGPOListA(hToken: HANDLE | 0n, lpName: LPCSTR | NULL, lpHostName: LPCSTR | NULL, lpComputerName: LPCSTR | NULL, dwFlags: DWORD, pGPOList: LPLPVOID): BOOL {
    return Userenv.Load('GetGPOListA')(hToken, lpName, lpHostName, lpComputerName, dwFlags, pGPOList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-getgpolistw
  public static GetGPOListW(hToken: HANDLE | 0n, lpName: LPCWSTR | NULL, lpHostName: LPCWSTR | NULL, lpComputerName: LPCWSTR | NULL, dwFlags: DWORD, pGPOList: LPLPVOID): BOOL {
    return Userenv.Load('GetGPOListW')(hToken, lpName, lpHostName, lpComputerName, dwFlags, pGPOList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-getprofiletype
  public static GetProfileType(dwFlags: LPDWORD): BOOL {
    return Userenv.Load('GetProfileType')(dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-getprofilesdirectorya
  public static GetProfilesDirectoryA(lpProfileDir: LPSTR | NULL, lpcchSize: LPDWORD): BOOL {
    return Userenv.Load('GetProfilesDirectoryA')(lpProfileDir, lpcchSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-getprofilesdirectoryw
  public static GetProfilesDirectoryW(lpProfileDir: LPWSTR | NULL, lpcchSize: LPDWORD): BOOL {
    return Userenv.Load('GetProfilesDirectoryW')(lpProfileDir, lpcchSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-getuserprofiledirectorya
  public static GetUserProfileDirectoryA(hToken: HANDLE, lpProfileDir: LPSTR | NULL, lpcchSize: LPDWORD): BOOL {
    return Userenv.Load('GetUserProfileDirectoryA')(hToken, lpProfileDir, lpcchSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-getuserprofiledirectoryw
  public static GetUserProfileDirectoryW(hToken: HANDLE, lpProfileDir: LPWSTR | NULL, lpcchSize: LPDWORD): BOOL {
    return Userenv.Load('GetUserProfileDirectoryW')(hToken, lpProfileDir, lpcchSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-leavecriticalpolicysection
  public static LeaveCriticalPolicySection(hSection: HANDLE): BOOL {
    return Userenv.Load('LeaveCriticalPolicySection')(hSection);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-loaduserprofilea
  public static LoadUserProfileA(hToken: HANDLE, lpProfileInfo: LPPROFILEINFOA): BOOL {
    return Userenv.Load('LoadUserProfileA')(hToken, lpProfileInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-loaduserprofilew
  public static LoadUserProfileW(hToken: HANDLE, lpProfileInfo: LPPROFILEINFOW): BOOL {
    return Userenv.Load('LoadUserProfileW')(hToken, lpProfileInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-processgrouppolicycompleted
  public static ProcessGroupPolicyCompleted(extensionId: REFGPEXTENSIONID, pAsyncHandle: ASYNCCOMPLETIONHANDLE, dwStatus: DWORD): DWORD {
    return Userenv.Load('ProcessGroupPolicyCompleted')(extensionId, pAsyncHandle, dwStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-processgrouppolicycompletedex
  public static ProcessGroupPolicyCompletedEx(extensionId: REFGPEXTENSIONID, pAsyncHandle: ASYNCCOMPLETIONHANDLE, dwStatus: DWORD, RsopStatus: HRESULT): DWORD {
    return Userenv.Load('ProcessGroupPolicyCompletedEx')(extensionId, pAsyncHandle, dwStatus, RsopStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-refreshpolicy
  public static RefreshPolicy(bMachine: BOOL): BOOL {
    return Userenv.Load('RefreshPolicy')(bMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-refreshpolicyex
  public static RefreshPolicyEx(bMachine: BOOL, dwOptions: DWORD): BOOL {
    return Userenv.Load('RefreshPolicyEx')(bMachine, dwOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-registergpnotification
  public static RegisterGPNotification(hEvent: HANDLE, bMachine: BOOL): BOOL {
    return Userenv.Load('RegisterGPNotification')(hEvent, bMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-rsopaccesscheckbytype
  public static RsopAccessCheckByType(pSecurityDescriptor: PSECURITY_DESCRIPTOR, pPrincipalSelfSid: PSID | NULL, pRsopToken: PRSOPTOKEN, dwDesiredAccessMask: DWORD, pObjectTypeList: POBJECT_TYPE_LIST | NULL, ObjectTypeListLength: DWORD, pGenericMapping: PGENERIC_MAPPING, pPrivilegeSet: PPRIVILEGE_SET | NULL, pdwPrivilegeSetLength: LPDWORD | NULL, pdwGrantedAccessMask: LPDWORD, pbAccessStatus: LPBOOL): HRESULT {
    return Userenv.Load('RsopAccessCheckByType')(pSecurityDescriptor, pPrincipalSelfSid, pRsopToken, dwDesiredAccessMask, pObjectTypeList, ObjectTypeListLength, pGenericMapping, pPrivilegeSet, pdwPrivilegeSetLength, pdwGrantedAccessMask, pbAccessStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-rsopfileaccesscheck
  public static RsopFileAccessCheck(pszFileName: LPWSTR, pRsopToken: PRSOPTOKEN, dwDesiredAccessMask: DWORD, pdwGrantedAccessMask: LPDWORD, pbAccessStatus: LPBOOL): HRESULT {
    return Userenv.Load('RsopFileAccessCheck')(pszFileName, pRsopToken, dwDesiredAccessMask, pdwGrantedAccessMask, pbAccessStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-rsopresetpolicysettingstatus
  public static RsopResetPolicySettingStatus(dwFlags: DWORD, pServices: PIWbemServices, pSettingInstance: PIWbemClassObject): HRESULT {
    return Userenv.Load('RsopResetPolicySettingStatus')(dwFlags, pServices, pSettingInstance);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-rsopsetpolicysettingstatus
  public static RsopSetPolicySettingStatus(dwFlags: DWORD, pServices: PIWbemServices, pSettingInstance: PIWbemClassObject, nInfo: DWORD, pStatus: LPPOLICYSETTINGSTATUSINFO): HRESULT {
    return Userenv.Load('RsopSetPolicySettingStatus')(dwFlags, pServices, pSettingInstance, nInfo, pStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-unloaduserprofile
  public static UnloadUserProfile(hToken: HANDLE, hProfile: HANDLE): BOOL {
    return Userenv.Load('UnloadUserProfile')(hToken, hProfile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-unregistergpnotification
  public static UnregisterGPNotification(hEvent: HANDLE): BOOL {
    return Userenv.Load('UnregisterGPNotification')(hEvent);
  }
}

export default Userenv;
