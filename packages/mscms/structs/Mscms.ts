import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BMFORMAT,
  BOOL,
  COLORDATATYPE,
  COLORPROFILESUBTYPE,
  COLORPROFILETYPE,
  COLORTYPE,
  DWORD,
  HPROFILE,
  HRESULT,
  HTRANSFORM,
  LPARAM,
  LPBOOL,
  LPBYTE,
  LPDWORD,
  LPLOGCOLORSPACEA,
  LPLOGCOLORSPACEW,
  LPVOID,
  LPWSTR,
  LUID,
  Nullable,
  Optional,
  PBMCALLBACKFN,
  PBOOL,
  PBYTE,
  PCOLOR,
  PCOLOR_NAME,
  PCSTR,
  PCWSTR,
  PDWORD,
  PENUMTYPEA,
  PENUMTYPEW,
  PHPROFILE,
  PNAMED_PROFILE_INFO,
  PPROFILE,
  PPROFILEHEADER,
  PSTR,
  PTAGTYPE,
  PVOID,
  PWSTR,
  TAGTYPE,
  UINT32,
  WCS_DEVICE_CAPABILITIES_TYPE,
  WCS_PROFILE_MANAGEMENT_SCOPE,
} from '../types/Mscms';

/**
 * Thin, lazy-loaded FFI bindings for `mscms.dll`.
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
 * import Mscms from './structs/Mscms';
 *
 * // Lazy: bind on first call
 * const hProfile = Mscms.OpenColorProfileW(profile.ptr, PROFILE_READ, 0, OPEN_EXISTING);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Mscms.Preload(['OpenColorProfileW', 'GetColorProfileHeader', 'CloseColorProfile']);
 * ```
 */
class Mscms extends Win32 {
  protected static override name = 'mscms.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    AssociateColorProfileWithDeviceA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AssociateColorProfileWithDeviceW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CheckBitmapBits: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
    CheckColors: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CloseColorProfile: { args: [FFIType.u64], returns: FFIType.i32 },
    ColorProfileAddDisplayAssociation: { args: [FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    ColorProfileGetDeviceCapabilities: { args: [FFIType.u32, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ColorProfileGetDisplayDefault: { args: [FFIType.u32, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ColorProfileGetDisplayList: { args: [FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ColorProfileGetDisplayUserScope: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ColorProfileRemoveDisplayAssociation: { args: [FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    ColorProfileSetDisplayDefaultAssociation: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    ConvertColorNameToIndex: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    ConvertIndexToColorName: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CreateColorTransformA: { args: [FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    CreateColorTransformW: { args: [FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    CreateDeviceLinkProfile: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CreateMultiProfileTransform: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    CreateProfileFromLogColorSpaceA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateProfileFromLogColorSpaceW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeleteColorTransform: { args: [FFIType.u64], returns: FFIType.i32 },
    DisassociateColorProfileFromDeviceA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DisassociateColorProfileFromDeviceW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumColorProfilesA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumColorProfilesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetCMMInfo: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    GetColorDirectoryA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetColorDirectoryW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetColorProfileElement: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetColorProfileElementTag: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetColorProfileFromHandle: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetColorProfileHeader: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetCountColorProfileElements: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetNamedProfileInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetPS2ColorRenderingDictionary: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPS2ColorRenderingIntent: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPS2ColorSpaceArray: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetStandardColorSpaceProfileA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetStandardColorSpaceProfileW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InstallColorProfileA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InstallColorProfileW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IsColorProfileTagPresent: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    IsColorProfileValid: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    OpenColorProfileA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    OpenColorProfileW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    RegisterCMMA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RegisterCMMW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SelectCMM: { args: [FFIType.u32], returns: FFIType.i32 },
    SetColorProfileElement: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetColorProfileElementReference: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetColorProfileElementSize: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetColorProfileHeader: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetStandardColorSpaceProfileA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetStandardColorSpaceProfileW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    TranslateBitmapBits: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
    TranslateColors: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UninstallColorProfileA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    UninstallColorProfileW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    UnregisterCMMA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UnregisterCMMW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WcsAssociateColorProfileWithDevice: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WcsCheckColors: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WcsCreateIccProfile: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    WcsDisassociateColorProfileFromDevice: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WcsEnumColorProfiles: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WcsEnumColorProfilesSize: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WcsGetCalibrationManagementState: { args: [FFIType.ptr], returns: FFIType.i32 },
    WcsGetDefaultColorProfile: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WcsGetDefaultColorProfileSize: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WcsGetDefaultRenderingIntent: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WcsGetUsePerUserProfiles: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WcsOpenColorProfileA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    WcsOpenColorProfileW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    WcsSetCalibrationManagementState: { args: [FFIType.i32], returns: FFIType.i32 },
    WcsSetDefaultColorProfile: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WcsSetDefaultRenderingIntent: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    WcsSetUsePerUserProfiles: { args: [FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    WcsTranslateColors: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-associatecolorprofilewithdevicea
  public static AssociateColorProfileWithDeviceA(pMachineName: Optional<PCSTR>, pProfileName: PCSTR, pDeviceName: PCSTR): BOOL {
    return Mscms.Load('AssociateColorProfileWithDeviceA')(pMachineName, pProfileName, pDeviceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-associatecolorprofilewithdevicew
  public static AssociateColorProfileWithDeviceW(pMachineName: Optional<PCWSTR>, pProfileName: PCWSTR, pDeviceName: PCWSTR): BOOL {
    return Mscms.Load('AssociateColorProfileWithDeviceW')(pMachineName, pProfileName, pDeviceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-checkbitmapbits
  public static CheckBitmapBits(hColorTransform: HTRANSFORM, pSrcBits: PVOID, bmInput: BMFORMAT, dwWidth: DWORD, dwHeight: DWORD, dwStride: DWORD, paResult_out: PBYTE, pfnCallback: Optional<PBMCALLBACKFN>, lpCallbackData: LPARAM): BOOL {
    return Mscms.Load('CheckBitmapBits')(hColorTransform, pSrcBits, bmInput, dwWidth, dwHeight, dwStride, paResult_out, pfnCallback, lpCallbackData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-checkcolors
  public static CheckColors(hColorTransform: HTRANSFORM, paInputColors: PCOLOR, nColors: DWORD, ctInput: COLORTYPE, paResult_out: PBYTE): BOOL {
    return Mscms.Load('CheckColors')(hColorTransform, paInputColors, nColors, ctInput, paResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-closecolorprofile
  public static CloseColorProfile(hProfile: Optional<HPROFILE>): BOOL {
    return Mscms.Load('CloseColorProfile')(hProfile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-colorprofileadddisplayassociation
  public static ColorProfileAddDisplayAssociation(scope: WCS_PROFILE_MANAGEMENT_SCOPE, profileName: PCWSTR, targetAdapterID: LUID, sourceID: UINT32, setAsDefault: BOOL, associateAsAdvancedColor: BOOL): HRESULT {
    return Mscms.Load('ColorProfileAddDisplayAssociation')(scope, profileName, targetAdapterID, sourceID, setAsDefault, associateAsAdvancedColor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-colorprofilegetdevicecapabilities
  public static ColorProfileGetDeviceCapabilities(scope: WCS_PROFILE_MANAGEMENT_SCOPE, targetAdapterID: LUID, sourceID: UINT32, capsType: WCS_DEVICE_CAPABILITIES_TYPE, outputCapabilities_out: PVOID): HRESULT {
    return Mscms.Load('ColorProfileGetDeviceCapabilities')(scope, targetAdapterID, sourceID, capsType, outputCapabilities_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-colorprofilegetdisplaydefault
  public static ColorProfileGetDisplayDefault(scope: WCS_PROFILE_MANAGEMENT_SCOPE, targetAdapterID: LUID, sourceID: UINT32, profileType: COLORPROFILETYPE, profileSubType: COLORPROFILESUBTYPE, profileName_out: LPVOID): HRESULT {
    return Mscms.Load('ColorProfileGetDisplayDefault')(scope, targetAdapterID, sourceID, profileType, profileSubType, profileName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-colorprofilegetdisplaylist
  public static ColorProfileGetDisplayList(scope: WCS_PROFILE_MANAGEMENT_SCOPE, targetAdapterID: LUID, sourceID: UINT32, profileList_out: LPVOID, profileCount_out: PDWORD): HRESULT {
    return Mscms.Load('ColorProfileGetDisplayList')(scope, targetAdapterID, sourceID, profileList_out, profileCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-colorprofilegetdisplayuserscope
  public static ColorProfileGetDisplayUserScope(targetAdapterID: LUID, sourceID: UINT32, scope_out: LPDWORD): HRESULT {
    return Mscms.Load('ColorProfileGetDisplayUserScope')(targetAdapterID, sourceID, scope_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-colorprofileremovedisplayassociation
  public static ColorProfileRemoveDisplayAssociation(scope: WCS_PROFILE_MANAGEMENT_SCOPE, profileName: PCWSTR, targetAdapterID: LUID, sourceID: UINT32, dissociateAdvancedColor: BOOL): HRESULT {
    return Mscms.Load('ColorProfileRemoveDisplayAssociation')(scope, profileName, targetAdapterID, sourceID, dissociateAdvancedColor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-colorprofilesetdisplaydefaultassociation
  public static ColorProfileSetDisplayDefaultAssociation(scope: WCS_PROFILE_MANAGEMENT_SCOPE, profileName: PCWSTR, profileType: COLORPROFILETYPE, profileSubType: COLORPROFILESUBTYPE, targetAdapterID: LUID, sourceID: UINT32): HRESULT {
    return Mscms.Load('ColorProfileSetDisplayDefaultAssociation')(scope, profileName, profileType, profileSubType, targetAdapterID, sourceID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-convertcolornametoindex
  public static ConvertColorNameToIndex(hProfile: HPROFILE, paColorName: PCOLOR_NAME, paIndex_out: PDWORD, dwCount: DWORD): BOOL {
    return Mscms.Load('ConvertColorNameToIndex')(hProfile, paColorName, paIndex_out, dwCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-convertindextocolorname
  public static ConvertIndexToColorName(hProfile: HPROFILE, paIndex: PDWORD, paColorName_out: PCOLOR_NAME, dwCount: DWORD): BOOL {
    return Mscms.Load('ConvertIndexToColorName')(hProfile, paIndex, paColorName_out, dwCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-createcolortransforma
  public static CreateColorTransformA(pLogColorSpace: LPLOGCOLORSPACEA, hDestProfile: HPROFILE, hTargetProfile: Nullable<HPROFILE>, dwFlags: DWORD): HTRANSFORM {
    return Mscms.Load('CreateColorTransformA')(pLogColorSpace, hDestProfile, hTargetProfile, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-createcolortransformw
  public static CreateColorTransformW(pLogColorSpace: LPLOGCOLORSPACEW, hDestProfile: HPROFILE, hTargetProfile: Nullable<HPROFILE>, dwFlags: DWORD): HTRANSFORM {
    return Mscms.Load('CreateColorTransformW')(pLogColorSpace, hDestProfile, hTargetProfile, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-createdevicelinkprofile
  public static CreateDeviceLinkProfile(hProfile: PHPROFILE, nProfiles: DWORD, padwIntent: PDWORD, nIntents: DWORD, dwFlags: DWORD, pProfileData_out: LPVOID, indexPreferredCMM: DWORD): BOOL {
    return Mscms.Load('CreateDeviceLinkProfile')(hProfile, nProfiles, padwIntent, nIntents, dwFlags, pProfileData_out, indexPreferredCMM);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-createmultiprofiletransform
  public static CreateMultiProfileTransform(pahProfiles: PHPROFILE, nProfiles: DWORD, padwIntent: PDWORD, nIntents: DWORD, dwFlags: DWORD, indexPreferredCMM: DWORD): HTRANSFORM {
    return Mscms.Load('CreateMultiProfileTransform')(pahProfiles, nProfiles, padwIntent, nIntents, dwFlags, indexPreferredCMM);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-createprofilefromlogcolorspacea
  public static CreateProfileFromLogColorSpaceA(pLogColorSpace: LPLOGCOLORSPACEA, pProfile_out: LPVOID): BOOL {
    return Mscms.Load('CreateProfileFromLogColorSpaceA')(pLogColorSpace, pProfile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-createprofilefromlogcolorspacew
  public static CreateProfileFromLogColorSpaceW(pLogColorSpace: LPLOGCOLORSPACEW, pProfile_out: LPVOID): BOOL {
    return Mscms.Load('CreateProfileFromLogColorSpaceW')(pLogColorSpace, pProfile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-deletecolortransform
  public static DeleteColorTransform(hxform_in_out: HTRANSFORM): BOOL {
    return Mscms.Load('DeleteColorTransform')(hxform_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-disassociatecolorprofilefromdevicea
  public static DisassociateColorProfileFromDeviceA(pMachineName: Optional<PCSTR>, pProfileName: PCSTR, pDeviceName: PCSTR): BOOL {
    return Mscms.Load('DisassociateColorProfileFromDeviceA')(pMachineName, pProfileName, pDeviceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-disassociatecolorprofilefromdevicew
  public static DisassociateColorProfileFromDeviceW(pMachineName: Optional<PCWSTR>, pProfileName: PCWSTR, pDeviceName: PCWSTR): BOOL {
    return Mscms.Load('DisassociateColorProfileFromDeviceW')(pMachineName, pProfileName, pDeviceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-enumcolorprofilesa
  public static EnumColorProfilesA(pMachineName: Optional<PCSTR>, pEnumRecord: PENUMTYPEA, pEnumerationBuffer_out: Optional<PBYTE>, pdwSizeOfEnumerationBuffer_in_out: PDWORD, pnProfiles_out: Optional<PDWORD>): BOOL {
    return Mscms.Load('EnumColorProfilesA')(pMachineName, pEnumRecord, pEnumerationBuffer_out, pdwSizeOfEnumerationBuffer_in_out, pnProfiles_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-enumcolorprofilesw
  public static EnumColorProfilesW(pMachineName: Optional<PCWSTR>, pEnumRecord: PENUMTYPEW, pEnumerationBuffer_out: Optional<PBYTE>, pdwSizeOfEnumerationBuffer_in_out: PDWORD, pnProfiles_out: Optional<PDWORD>): BOOL {
    return Mscms.Load('EnumColorProfilesW')(pMachineName, pEnumRecord, pEnumerationBuffer_out, pdwSizeOfEnumerationBuffer_in_out, pnProfiles_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-getcmminfo
  public static GetCMMInfo(hColorTransform: HTRANSFORM, dwInfo: DWORD): DWORD {
    return Mscms.Load('GetCMMInfo')(hColorTransform, dwInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-getcolordirectorya
  public static GetColorDirectoryA(pMachineName: Optional<PCSTR>, pBuffer_out: Optional<PSTR>, pdwSize_in_out: PDWORD): BOOL {
    return Mscms.Load('GetColorDirectoryA')(pMachineName, pBuffer_out, pdwSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-getcolordirectoryw
  public static GetColorDirectoryW(pMachineName: Optional<PCWSTR>, pBuffer_out: Optional<PWSTR>, pdwSize_in_out: PDWORD): BOOL {
    return Mscms.Load('GetColorDirectoryW')(pMachineName, pBuffer_out, pdwSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-getcolorprofileelement
  public static GetColorProfileElement(hProfile: HPROFILE, tag: TAGTYPE, dwOffset: DWORD, pcbElement_in_out: PDWORD, pElement_out: Optional<PVOID>, pbReference_out: PBOOL): BOOL {
    return Mscms.Load('GetColorProfileElement')(hProfile, tag, dwOffset, pcbElement_in_out, pElement_out, pbReference_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-getcolorprofileelementtag
  public static GetColorProfileElementTag(hProfile: HPROFILE, dwIndex: DWORD, pTag_out: PTAGTYPE): BOOL {
    return Mscms.Load('GetColorProfileElementTag')(hProfile, dwIndex, pTag_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-getcolorprofilefromhandle
  public static GetColorProfileFromHandle(hProfile: HPROFILE, pProfile_out: Optional<PBYTE>, pcbProfile_in_out: PDWORD): BOOL {
    return Mscms.Load('GetColorProfileFromHandle')(hProfile, pProfile_out, pcbProfile_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-getcolorprofileheader
  public static GetColorProfileHeader(hProfile: HPROFILE, pHeader_out: PPROFILEHEADER): BOOL {
    return Mscms.Load('GetColorProfileHeader')(hProfile, pHeader_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-getcountcolorprofileelements
  public static GetCountColorProfileElements(hProfile: HPROFILE, pnElementCount_out: PDWORD): BOOL {
    return Mscms.Load('GetCountColorProfileElements')(hProfile, pnElementCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-getnamedprofileinfo
  public static GetNamedProfileInfo(hProfile: HPROFILE, pNamedProfileInfo_in_out: PNAMED_PROFILE_INFO): BOOL {
    return Mscms.Load('GetNamedProfileInfo')(hProfile, pNamedProfileInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-getps2colorrenderingdictionary
  public static GetPS2ColorRenderingDictionary(hProfile: HPROFILE, dwIntent: DWORD, pPS2ColorRenderingDictionary_out: Optional<PBYTE>, pcbPS2ColorRenderingDictionary_in_out: PDWORD, pbBinary_in_out: PBOOL): BOOL {
    return Mscms.Load('GetPS2ColorRenderingDictionary')(hProfile, dwIntent, pPS2ColorRenderingDictionary_out, pcbPS2ColorRenderingDictionary_in_out, pbBinary_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-getps2colorrenderingintent
  public static GetPS2ColorRenderingIntent(hProfile: HPROFILE, dwIntent: DWORD, pBuffer_out: Optional<PBYTE>, pcbPS2ColorRenderingIntent_in_out: PDWORD): BOOL {
    return Mscms.Load('GetPS2ColorRenderingIntent')(hProfile, dwIntent, pBuffer_out, pcbPS2ColorRenderingIntent_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-getps2colorspacearray
  public static GetPS2ColorSpaceArray(hProfile: HPROFILE, dwIntent: DWORD, dwCSAType: DWORD, pPS2ColorSpaceArray_out: Optional<PBYTE>, pcbPS2ColorSpaceArray_in_out: PDWORD, pbBinary_out: PBOOL): BOOL {
    return Mscms.Load('GetPS2ColorSpaceArray')(hProfile, dwIntent, dwCSAType, pPS2ColorSpaceArray_out, pcbPS2ColorSpaceArray_in_out, pbBinary_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-getstandardcolorspaceprofilea
  public static GetStandardColorSpaceProfileA(pMachineName: Optional<PCSTR>, dwSCS: DWORD, pBuffer_out: Optional<PSTR>, pcbSize_in_out: PDWORD): BOOL {
    return Mscms.Load('GetStandardColorSpaceProfileA')(pMachineName, dwSCS, pBuffer_out, pcbSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-getstandardcolorspaceprofilew
  public static GetStandardColorSpaceProfileW(pMachineName: Optional<PCWSTR>, dwSCS: DWORD, pBuffer_out: Optional<PWSTR>, pcbSize_in_out: PDWORD): BOOL {
    return Mscms.Load('GetStandardColorSpaceProfileW')(pMachineName, dwSCS, pBuffer_out, pcbSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-installcolorprofilea
  public static InstallColorProfileA(pMachineName: Optional<PCSTR>, pProfileName: PCSTR): BOOL {
    return Mscms.Load('InstallColorProfileA')(pMachineName, pProfileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-installcolorprofilew
  public static InstallColorProfileW(pMachineName: Optional<PCWSTR>, pProfileName: PCWSTR): BOOL {
    return Mscms.Load('InstallColorProfileW')(pMachineName, pProfileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-iscolorprofiletagpresent
  public static IsColorProfileTagPresent(hProfile: HPROFILE, tag: TAGTYPE, pbPresent_out: PBOOL): BOOL {
    return Mscms.Load('IsColorProfileTagPresent')(hProfile, tag, pbPresent_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-iscolorprofilevalid
  public static IsColorProfileValid(hProfile: HPROFILE, pbValid_out: PBOOL): BOOL {
    return Mscms.Load('IsColorProfileValid')(hProfile, pbValid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-opencolorprofilea
  public static OpenColorProfileA(pProfile: PPROFILE, dwDesiredAccess: DWORD, dwShareMode: DWORD, dwCreationMode: DWORD): HPROFILE {
    return Mscms.Load('OpenColorProfileA')(pProfile, dwDesiredAccess, dwShareMode, dwCreationMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-opencolorprofilew
  public static OpenColorProfileW(pProfile: PPROFILE, dwDesiredAccess: DWORD, dwShareMode: DWORD, dwCreationMode: DWORD): HPROFILE {
    return Mscms.Load('OpenColorProfileW')(pProfile, dwDesiredAccess, dwShareMode, dwCreationMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-registercmma
  public static RegisterCMMA(pMachineName: Optional<PCSTR>, cmmID: DWORD, pCMMdll: PCSTR): BOOL {
    return Mscms.Load('RegisterCMMA')(pMachineName, cmmID, pCMMdll);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-registercmmw
  public static RegisterCMMW(pMachineName: Optional<PCWSTR>, cmmID: DWORD, pCMMdll: PCWSTR): BOOL {
    return Mscms.Load('RegisterCMMW')(pMachineName, cmmID, pCMMdll);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-selectcmm
  public static SelectCMM(dwCMMType: DWORD): BOOL {
    return Mscms.Load('SelectCMM')(dwCMMType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-setcolorprofileelement
  public static SetColorProfileElement(hProfile: HPROFILE, tag: TAGTYPE, dwOffset: DWORD, pcbElement: PDWORD, pElement: PVOID): BOOL {
    return Mscms.Load('SetColorProfileElement')(hProfile, tag, dwOffset, pcbElement, pElement);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-setcolorprofileelementreference
  public static SetColorProfileElementReference(hProfile: HPROFILE, newTag: TAGTYPE, refTag: TAGTYPE): BOOL {
    return Mscms.Load('SetColorProfileElementReference')(hProfile, newTag, refTag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-setcolorprofileelementsize
  public static SetColorProfileElementSize(hProfile: HPROFILE, tagType: TAGTYPE, pcbElement: DWORD): BOOL {
    return Mscms.Load('SetColorProfileElementSize')(hProfile, tagType, pcbElement);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-setcolorprofileheader
  public static SetColorProfileHeader(hProfile: HPROFILE, pHeader: PPROFILEHEADER): BOOL {
    return Mscms.Load('SetColorProfileHeader')(hProfile, pHeader);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-setstandardcolorspaceprofilea
  public static SetStandardColorSpaceProfileA(pMachineName: Optional<PCSTR>, dwProfileID: DWORD, pProfilename: PCSTR): BOOL {
    return Mscms.Load('SetStandardColorSpaceProfileA')(pMachineName, dwProfileID, pProfilename);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-setstandardcolorspaceprofilew
  public static SetStandardColorSpaceProfileW(pMachineName: Optional<PCWSTR>, dwProfileID: DWORD, pProfileName: PCWSTR): BOOL {
    return Mscms.Load('SetStandardColorSpaceProfileW')(pMachineName, dwProfileID, pProfileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-translatebitmapbits
  public static TranslateBitmapBits(
    hColorTransform: HTRANSFORM,
    pSrcBits: PVOID,
    bmInput: BMFORMAT,
    dwWidth: DWORD,
    dwHeight: DWORD,
    dwInputStride: DWORD,
    pDestBits_out: PVOID,
    bmOutput: BMFORMAT,
    dwOutputStride: DWORD,
    pfnCallBack: Optional<PBMCALLBACKFN>,
    ulCallbackData: LPARAM,
  ): BOOL {
    return Mscms.Load('TranslateBitmapBits')(hColorTransform, pSrcBits, bmInput, dwWidth, dwHeight, dwInputStride, pDestBits_out, bmOutput, dwOutputStride, pfnCallBack, ulCallbackData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-translatecolors
  public static TranslateColors(hColorTransform: HTRANSFORM, paInputColors: PCOLOR, nColors: DWORD, ctInput: COLORTYPE, paOutputColors_out: PCOLOR, ctOutput: COLORTYPE): BOOL {
    return Mscms.Load('TranslateColors')(hColorTransform, paInputColors, nColors, ctInput, paOutputColors_out, ctOutput);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-uninstallcolorprofilea
  public static UninstallColorProfileA(pMachineName: Optional<PCSTR>, pProfileName: PCSTR, bDelete: BOOL): BOOL {
    return Mscms.Load('UninstallColorProfileA')(pMachineName, pProfileName, bDelete);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-uninstallcolorprofilew
  public static UninstallColorProfileW(pMachineName: Optional<PCWSTR>, pProfileName: PCWSTR, bDelete: BOOL): BOOL {
    return Mscms.Load('UninstallColorProfileW')(pMachineName, pProfileName, bDelete);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-unregistercmma
  public static UnregisterCMMA(pMachineName: Optional<PCSTR>, cmmID: DWORD): BOOL {
    return Mscms.Load('UnregisterCMMA')(pMachineName, cmmID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-unregistercmmw
  public static UnregisterCMMW(pMachineName: Optional<PCWSTR>, cmmID: DWORD): BOOL {
    return Mscms.Load('UnregisterCMMW')(pMachineName, cmmID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcsassociatecolorprofilewithdevice
  public static WcsAssociateColorProfileWithDevice(scope: WCS_PROFILE_MANAGEMENT_SCOPE, pProfileName: PCWSTR, pDeviceName: PCWSTR): BOOL {
    return Mscms.Load('WcsAssociateColorProfileWithDevice')(scope, pProfileName, pDeviceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcscheckcolors
  public static WcsCheckColors(hColorTransform: HTRANSFORM, nColors: DWORD, nInputChannels: DWORD, cdtInput: COLORDATATYPE, cbInput: DWORD, pInputData: PVOID, paResult_out: PBYTE): BOOL {
    return Mscms.Load('WcsCheckColors')(hColorTransform, nColors, nInputChannels, cdtInput, cbInput, pInputData, paResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcscreateiccprofile
  public static WcsCreateIccProfile(hWcsProfile: HPROFILE, dwOptions: DWORD): HPROFILE {
    return Mscms.Load('WcsCreateIccProfile')(hWcsProfile, dwOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcsdisassociatecolorprofilefromdevice
  public static WcsDisassociateColorProfileFromDevice(scope: WCS_PROFILE_MANAGEMENT_SCOPE, pProfileName: PCWSTR, pDeviceName: PCWSTR): BOOL {
    return Mscms.Load('WcsDisassociateColorProfileFromDevice')(scope, pProfileName, pDeviceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcsenumcolorprofiles
  public static WcsEnumColorProfiles(scope: WCS_PROFILE_MANAGEMENT_SCOPE, pEnumRecord: PENUMTYPEW, pBuffer_out: PBYTE, dwSize: DWORD, pnProfiles_out: Optional<PDWORD>): BOOL {
    return Mscms.Load('WcsEnumColorProfiles')(scope, pEnumRecord, pBuffer_out, dwSize, pnProfiles_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcsenumcolorprofilessize
  public static WcsEnumColorProfilesSize(scope: WCS_PROFILE_MANAGEMENT_SCOPE, pEnumRecord: PENUMTYPEW, pdwSize_out: PDWORD): BOOL {
    return Mscms.Load('WcsEnumColorProfilesSize')(scope, pEnumRecord, pdwSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcsgetcalibrationmanagementstate
  public static WcsGetCalibrationManagementState(pbIsEnabled_out: LPBOOL): BOOL {
    return Mscms.Load('WcsGetCalibrationManagementState')(pbIsEnabled_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcsgetdefaultcolorprofile
  public static WcsGetDefaultColorProfile(
    scope: WCS_PROFILE_MANAGEMENT_SCOPE,
    pDeviceName: Optional<PCWSTR>,
    cptColorProfileType: COLORPROFILETYPE,
    cpstColorProfileSubType: COLORPROFILESUBTYPE,
    dwProfileID: DWORD,
    cbProfileName: DWORD,
    pProfileName_out: LPWSTR,
  ): BOOL {
    return Mscms.Load('WcsGetDefaultColorProfile')(scope, pDeviceName, cptColorProfileType, cpstColorProfileSubType, dwProfileID, cbProfileName, pProfileName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcsgetdefaultcolorprofilesize
  public static WcsGetDefaultColorProfileSize(
    scope: WCS_PROFILE_MANAGEMENT_SCOPE,
    pDeviceName: Optional<PCWSTR>,
    cptColorProfileType: COLORPROFILETYPE,
    cpstColorProfileSubType: COLORPROFILESUBTYPE,
    dwProfileID: DWORD,
    pcbProfileName_out: PDWORD,
  ): BOOL {
    return Mscms.Load('WcsGetDefaultColorProfileSize')(scope, pDeviceName, cptColorProfileType, cpstColorProfileSubType, dwProfileID, pcbProfileName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcsgetdefaultrenderingintent
  public static WcsGetDefaultRenderingIntent(scope: WCS_PROFILE_MANAGEMENT_SCOPE, pdwRenderingIntent_out: PDWORD): BOOL {
    return Mscms.Load('WcsGetDefaultRenderingIntent')(scope, pdwRenderingIntent_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcsgetuseperuserprofiles
  public static WcsGetUsePerUserProfiles(pDeviceName: PCWSTR, dwDeviceClass: DWORD, pUsePerUserProfiles_out: PBOOL): BOOL {
    return Mscms.Load('WcsGetUsePerUserProfiles')(pDeviceName, dwDeviceClass, pUsePerUserProfiles_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcsopencolorprofilea
  public static WcsOpenColorProfileA(pCDMPProfile: PPROFILE, pCAMPProfile: Optional<PPROFILE>, pGMMPProfile: Optional<PPROFILE>, dwDesireAccess: DWORD, dwShareMode: DWORD, dwCreationMode: DWORD, dwFlags: DWORD): HPROFILE {
    return Mscms.Load('WcsOpenColorProfileA')(pCDMPProfile, pCAMPProfile, pGMMPProfile, dwDesireAccess, dwShareMode, dwCreationMode, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcsopencolorprofilew
  public static WcsOpenColorProfileW(pCDMPProfile: PPROFILE, pCAMPProfile: Optional<PPROFILE>, pGMMPProfile: Optional<PPROFILE>, dwDesireAccess: DWORD, dwShareMode: DWORD, dwCreationMode: DWORD, dwFlags: DWORD): HPROFILE {
    return Mscms.Load('WcsOpenColorProfileW')(pCDMPProfile, pCAMPProfile, pGMMPProfile, dwDesireAccess, dwShareMode, dwCreationMode, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcssetcalibrationmanagementstate
  public static WcsSetCalibrationManagementState(bIsEnabled: BOOL): BOOL {
    return Mscms.Load('WcsSetCalibrationManagementState')(bIsEnabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcssetdefaultcolorprofile
  public static WcsSetDefaultColorProfile(
    scope: WCS_PROFILE_MANAGEMENT_SCOPE,
    pDeviceName: Optional<PCWSTR>,
    cptColorProfileType: COLORPROFILETYPE,
    cpstColorProfileSubType: COLORPROFILESUBTYPE,
    dwProfileID: DWORD,
    pProfileName: Optional<PCWSTR>,
  ): BOOL {
    return Mscms.Load('WcsSetDefaultColorProfile')(scope, pDeviceName, cptColorProfileType, cpstColorProfileSubType, dwProfileID, pProfileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcssetdefaultrenderingintent
  public static WcsSetDefaultRenderingIntent(scope: WCS_PROFILE_MANAGEMENT_SCOPE, dwRenderingIntent: DWORD): BOOL {
    return Mscms.Load('WcsSetDefaultRenderingIntent')(scope, dwRenderingIntent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcssetuseperuserprofiles
  public static WcsSetUsePerUserProfiles(pDeviceName: PCWSTR, dwDeviceClass: DWORD, usePerUserProfiles: BOOL): BOOL {
    return Mscms.Load('WcsSetUsePerUserProfiles')(pDeviceName, dwDeviceClass, usePerUserProfiles);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icm/nf-icm-wcstranslatecolors
  public static WcsTranslateColors(
    hColorTransform: HTRANSFORM,
    nColors: DWORD,
    nInputChannels: DWORD,
    cdtInput: COLORDATATYPE,
    cbInput: DWORD,
    pInputData: PVOID,
    nOutputChannels: DWORD,
    cdtOutput: COLORDATATYPE,
    cbOutput: DWORD,
    pOutputData_out: PVOID,
  ): BOOL {
    return Mscms.Load('WcsTranslateColors')(hColorTransform, nColors, nInputChannels, cdtInput, cbInput, pInputData, nOutputChannels, cdtOutput, cbOutput, pOutputData_out);
  }
}

export default Mscms;
