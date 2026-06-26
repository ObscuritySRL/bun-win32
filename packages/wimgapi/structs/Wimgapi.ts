import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BOOL, DWORD, FARPROC, HANDLE, LPPROGRESS_ROUTINE, MOUNTED_IMAGE_INFO_LEVELS, NULLABLE, OPTIONAL, PBOOL, PCWSTR, PDWORD, PHANDLE, PLARGE_INTEGER, PPVOID, PVOID, PWIM_INFO, PWIM_MOUNT_LIST } from '../types/Wimgapi';

/**
 * Thin, lazy-loaded FFI bindings for `wimgapi.dll`.
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
 * import Wimgapi, { WIMDesiredAccess, WIMCreationDisposition } from './structs/Wimgapi';
 *
 * // Lazy: bind on first call
 * const hWim = Wimgapi.WIMCreateFile(path.ptr, WIMDesiredAccess.WIM_GENERIC_READ, WIMCreationDisposition.WIM_OPEN_EXISTING, 0, 0, null);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Wimgapi.Preload(['WIMCreateFile', 'WIMGetImageCount', 'WIMCloseHandle']);
 * ```
 */
class Wimgapi extends Win32 {
  protected static override name = 'wimgapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    WIMApplyImage: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WIMCaptureImage: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    WIMCloseHandle: { args: [FFIType.u64], returns: FFIType.i32 },
    WIMCommitImageHandle: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WIMCopyFile: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WIMCreateFile: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    WIMDeleteImage: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    WIMDeleteImageMounts: { args: [FFIType.u32], returns: FFIType.i32 },
    WIMExportImage: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    WIMExtractImagePath: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WIMGetAttributes: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WIMGetImageCount: { args: [FFIType.u64], returns: FFIType.u32 },
    WIMGetImageInformation: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WIMGetMessageCallbackCount: { args: [FFIType.u64], returns: FFIType.u32 },
    WIMGetMountedImageHandle: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WIMGetMountedImageInfo: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WIMGetMountedImageInfoFromHandle: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WIMGetMountedImages: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WIMLoadImage: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    WIMMountImage: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WIMMountImageHandle: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WIMRegisterLogFile: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WIMRegisterMessageCallback: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WIMRemountImage: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WIMSetBootImage: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    WIMSetImageInformation: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WIMSetReferenceFile: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WIMSetTemporaryPath: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WIMSplitFile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WIMUnmountImage: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    WIMUnmountImageHandle: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    WIMUnregisterLogFile: { args: [FFIType.ptr], returns: FFIType.i32 },
    WIMUnregisterMessageCallback: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd834965(v=msdn.10)
  public static WIMApplyImage(hImage: HANDLE, pszPath: NULLABLE<PCWSTR>, dwApplyFlags: DWORD): BOOL {
    return Wimgapi.Load('WIMApplyImage')(hImage, pszPath, dwApplyFlags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851913(v=msdn.10)
  public static WIMCaptureImage(hWim: HANDLE, pszPath: PCWSTR, dwCaptureFlags: DWORD): HANDLE {
    return Wimgapi.Load('WIMCaptureImage')(hWim, pszPath, dwCaptureFlags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851955(v=msdn.10)
  public static WIMCloseHandle(hObject: HANDLE): BOOL {
    return Wimgapi.Load('WIMCloseHandle')(hObject);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851949(v=msdn.10)
  public static WIMCommitImageHandle(hImage: HANDLE, dwCommitFlags: DWORD, phNewImageHandle_out: OPTIONAL<PHANDLE>): BOOL {
    return Wimgapi.Load('WIMCommitImageHandle')(hImage, dwCommitFlags, phNewImageHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851916(v=msdn.10)
  public static WIMCopyFile(pszExistingFileName: PCWSTR, pszNewFileName: PCWSTR, pProgressRoutine: OPTIONAL<LPPROGRESS_ROUTINE>, pvData: OPTIONAL<PVOID>, pbCancel: OPTIONAL<PBOOL>, dwCopyFlags: DWORD): BOOL {
    return Wimgapi.Load('WIMCopyFile')(pszExistingFileName, pszNewFileName, pProgressRoutine, pvData, pbCancel, dwCopyFlags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851934(v=msdn.10)
  public static WIMCreateFile(pszWimPath: PCWSTR, dwDesiredAccess: DWORD, dwCreationDisposition: DWORD, dwFlagsAndAttributes: DWORD, dwCompressionType: DWORD, pdwCreationResult_out: OPTIONAL<PDWORD>): HANDLE {
    return Wimgapi.Load('WIMCreateFile')(pszWimPath, dwDesiredAccess, dwCreationDisposition, dwFlagsAndAttributes, dwCompressionType, pdwCreationResult_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851953(v=msdn.10)
  public static WIMDeleteImage(hWim: HANDLE, dwImageIndex: DWORD): BOOL {
    return Wimgapi.Load('WIMDeleteImage')(hWim, dwImageIndex);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd834942(v=msdn.10)
  public static WIMDeleteImageMounts(dwDeleteFlags: DWORD): BOOL {
    return Wimgapi.Load('WIMDeleteImageMounts')(dwDeleteFlags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd834952(v=msdn.10)
  public static WIMExportImage(hImage: HANDLE, hWim: HANDLE, dwFlags: DWORD): BOOL {
    return Wimgapi.Load('WIMExportImage')(hImage, hWim, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851957(v=msdn.10)
  public static WIMExtractImagePath(hImage: HANDLE, pszImagePath: PCWSTR, pszDestinationPath: PCWSTR, dwExtractFlags: DWORD): BOOL {
    return Wimgapi.Load('WIMExtractImagePath')(hImage, pszImagePath, pszDestinationPath, dwExtractFlags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851923(v=msdn.10)
  public static WIMGetAttributes(hWim: HANDLE, pWimInfo_out: PWIM_INFO, cbWimInfo: DWORD): BOOL {
    return Wimgapi.Load('WIMGetAttributes')(hWim, pWimInfo_out, cbWimInfo);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851938(v=msdn.10)
  public static WIMGetImageCount(hWim: HANDLE): DWORD {
    return Wimgapi.Load('WIMGetImageCount')(hWim);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd834949(v=msdn.10)
  public static WIMGetImageInformation(hImage: HANDLE, ppvImageInfo_out: PPVOID, pcbImageInfo_out: PDWORD): BOOL {
    return Wimgapi.Load('WIMGetImageInformation')(hImage, ppvImageInfo_out, pcbImageInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851943(v=msdn.10)
  public static WIMGetMessageCallbackCount(hWim: OPTIONAL<HANDLE>): DWORD {
    return Wimgapi.Load('WIMGetMessageCallbackCount')(hWim);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd834962(v=msdn.10)
  public static WIMGetMountedImageHandle(pszMountPath: PCWSTR, dwFlags: DWORD, phWimHandle_out: PHANDLE, phImageHandle_out: PHANDLE): BOOL {
    return Wimgapi.Load('WIMGetMountedImageHandle')(pszMountPath, dwFlags, phWimHandle_out, phImageHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851928(v=msdn.10)
  public static WIMGetMountedImageInfo(fInfoLevelId: MOUNTED_IMAGE_INFO_LEVELS, pdwImageCount_out: PDWORD, pMountInfo_out: NULLABLE<PVOID>, cbMountInfoLength: DWORD, pcbReturnLength_out: PDWORD): BOOL {
    return Wimgapi.Load('WIMGetMountedImageInfo')(fInfoLevelId, pdwImageCount_out, pMountInfo_out, cbMountInfoLength, pcbReturnLength_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd834940(v=msdn.10)
  public static WIMGetMountedImageInfoFromHandle(hImage: HANDLE, fInfoLevelId: MOUNTED_IMAGE_INFO_LEVELS, pMountInfo_out: NULLABLE<PVOID>, cbMountInfoLength: DWORD, pcbReturnLength_out: PDWORD): BOOL {
    return Wimgapi.Load('WIMGetMountedImageInfoFromHandle')(hImage, fInfoLevelId, pMountInfo_out, cbMountInfoLength, pcbReturnLength_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851936(v=msdn.10)
  public static WIMGetMountedImages(pMountList_out: NULLABLE<PWIM_MOUNT_LIST>, pcbMountListLength_in_out: PDWORD): BOOL {
    return Wimgapi.Load('WIMGetMountedImages')(pMountList_out, pcbMountListLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd834941(v=msdn.10)
  public static WIMLoadImage(hWim: HANDLE, dwImageIndex: DWORD): HANDLE {
    return Wimgapi.Load('WIMLoadImage')(hWim, dwImageIndex);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851922(v=msdn.10)
  public static WIMMountImage(pszMountPath: PCWSTR, pszWimFileName: PCWSTR, dwImageIndex: DWORD, pszTempPath: OPTIONAL<PCWSTR>): BOOL {
    return Wimgapi.Load('WIMMountImage')(pszMountPath, pszWimFileName, dwImageIndex, pszTempPath);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851947(v=msdn.10)
  public static WIMMountImageHandle(hImage: HANDLE, pszMountPath: PCWSTR, dwMountFlags: DWORD): BOOL {
    return Wimgapi.Load('WIMMountImageHandle')(hImage, pszMountPath, dwMountFlags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851917(v=msdn.10)
  public static WIMRegisterLogFile(pszLogFile: PCWSTR, dwFlags: DWORD): BOOL {
    return Wimgapi.Load('WIMRegisterLogFile')(pszLogFile, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851932(v=msdn.10)
  public static WIMRegisterMessageCallback(hWim: OPTIONAL<HANDLE>, fpMessageProc: FARPROC, pvUserData: OPTIONAL<PVOID>): DWORD {
    return Wimgapi.Load('WIMRegisterMessageCallback')(hWim, fpMessageProc, pvUserData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851911(v=msdn.10)
  public static WIMRemountImage(pszMountPath: PCWSTR, dwFlags: DWORD): BOOL {
    return Wimgapi.Load('WIMRemountImage')(pszMountPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851941(v=msdn.10)
  public static WIMSetBootImage(hWim: HANDLE, dwImageIndex: DWORD): BOOL {
    return Wimgapi.Load('WIMSetBootImage')(hWim, dwImageIndex);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd834951(v=msdn.10)
  public static WIMSetImageInformation(hImage: HANDLE, pvImageInfo: PVOID, cbImageInfo: DWORD): BOOL {
    return Wimgapi.Load('WIMSetImageInformation')(hImage, pvImageInfo, cbImageInfo);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851956(v=msdn.10)
  public static WIMSetReferenceFile(hWim: HANDLE, pszPath: NULLABLE<PCWSTR>, dwFlags: DWORD): BOOL {
    return Wimgapi.Load('WIMSetReferenceFile')(hWim, pszPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851937(v=msdn.10)
  public static WIMSetTemporaryPath(hWim: HANDLE, pszPath: PCWSTR): BOOL {
    return Wimgapi.Load('WIMSetTemporaryPath')(hWim, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd834958(v=msdn.10)
  public static WIMSplitFile(hWim: HANDLE, pszPartPath: PCWSTR, pliPartSize_in_out: PLARGE_INTEGER, dwFlags: DWORD): BOOL {
    return Wimgapi.Load('WIMSplitFile')(hWim, pszPartPath, pliPartSize_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd834967(v=msdn.10)
  public static WIMUnmountImage(pszMountPath: PCWSTR, pszWimFileName: OPTIONAL<PCWSTR>, dwImageIndex: DWORD, bCommitChanges: BOOL): BOOL {
    return Wimgapi.Load('WIMUnmountImage')(pszMountPath, pszWimFileName, dwImageIndex, bCommitChanges);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd834947(v=msdn.10)
  public static WIMUnmountImageHandle(hImage: HANDLE, dwUnmountFlags: DWORD): BOOL {
    return Wimgapi.Load('WIMUnmountImageHandle')(hImage, dwUnmountFlags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851924(v=msdn.10)
  public static WIMUnregisterLogFile(pszLogFile: PCWSTR): BOOL {
    return Wimgapi.Load('WIMUnregisterLogFile')(pszLogFile);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/wim/dd851930(v=msdn.10)
  public static WIMUnregisterMessageCallback(hWim: OPTIONAL<HANDLE>, fpMessageProc: OPTIONAL<FARPROC>): BOOL {
    return Wimgapi.Load('WIMUnregisterMessageCallback')(hWim, fpMessageProc);
  }
}

export default Wimgapi;
