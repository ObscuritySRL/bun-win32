import { type FFIFunction, FFIType } from 'bun:ffi';
import { Win32 } from '@bun-win32/core';

import type {
  ASSOC_FILTER,
  BOOL,
  DWORD,
  DWORD_PTR,
  GETPROPERTYSTOREFLAGS,
  HANDLE,
  HDROP,
  HICON,
  HIMAGELIST,
  HINSTANCE,
  HKEY,
  HMENU,
  HPSXA,
  HRESULT,
  HWND,
  INT,
  INT_PTR,
  LONG,
  LPARAM,
  LPAUTO_SCROLL_DATA,
  LPBROWSEINFOA,
  LPBROWSEINFOW,
  LPCSHITEMID,
  LPCSTR,
  LPCVOID,
  LPCWSTR,
  LPDWORD,
  LPFNADDPROPSHEETPAGE,
  LPFNDFMCALLBACK,
  LPPOINT,
  LPRECT,
  LPSECURITY_ATTRIBUTES,
  LPSHCREATEPROCESSINFOW,
  LPSHELLEXECUTEINFOA,
  LPSHELLEXECUTEINFOW,
  LPSHELLSTATE,
  LPSHFOLDERCUSTOMSETTINGS,
  LPSHFILEINFOA,
  LPSHFILEINFOW,
  LPSHFILEOPSTRUCTA,
  LPSHFILEOPSTRUCTW,
  LPSHELLFLAGSTATE,
  LPSHSTOCKICONINFO,
  LPSTR,
  LPVOID,
  LPWORD,
  LPWSTR,
  LRESULT,
  NULL,
  PACKED_POINT,
  PAPPBARDATA,
  PCABINETSTATE,
  PCDEFCONTEXTMENU,
  PCIDLIST_ABSOLUTE,
  PCUITEMID_CHILD,
  PCUITEMID_CHILD_ARRAY,
  PCUIDLIST_RELATIVE,
  PCUIDLIST_RELATIVE_ARRAY,
  PDLLVERSIONINFO,
  PIDLIST_ABSOLUTE,
  PIDLIST_RELATIVE,
  PNOTIFYICONIDENTIFIER,
  PNOTIFYICONDATAA,
  PNOTIFYICONDATAW,
  POPENASINFO,
  PSFV_CREATE,
  PSHCHANGENOTIFYENTRY,
  PSHQUERYRBINFO,
  PUIDLIST_RELATIVE,
  PUITEMID_CHILD,
  PWSTR,
  SFGAOF,
  SIGDN,
  SIZE_T,
  UINT,
  UINT_PTR,
  ULONG,
  WORD,
} from '../types/Shell32';

/**
 * Thin, lazy-loaded FFI bindings for `shell32.dll`.
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
 * import Shell32 from './structs/Shell32';
 *
 * // Lazy: bind on first call
 * const path = Buffer.alloc(520);
 * Shell32.SHGetFolderPathW(0n, 0x001C, 0n, 0, path.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Shell32.Preload(['SHGetKnownFolderPath', 'ShellExecuteW']);
 * ```
 */
class Shell32 extends Win32 {
  protected static override name = 'shell32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    AssocCreateForClasses: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AssocGetDetailsOfPropKey: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CDefFolderMenu_Create2: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CIDLData_CreateFromIDArray: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CommandLineToArgvW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    DAD_AutoScroll: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DAD_DragEnterEx: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    DAD_DragEnterEx2: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DAD_DragLeave: { args: [], returns: FFIType.i32 },
    DAD_DragMove: { args: [FFIType.u64], returns: FFIType.i32 },
    DAD_SetDragImage: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DAD_ShowDragImage: { args: [FFIType.i32], returns: FFIType.i32 },
    DllGetVersion: { args: [FFIType.ptr], returns: FFIType.i32 },
    DoEnvironmentSubstA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DoEnvironmentSubstW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DragAcceptFiles: { args: [FFIType.u64, FFIType.i32], returns: FFIType.void },
    DragFinish: { args: [FFIType.u64], returns: FFIType.void },
    DragQueryFile: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DragQueryFileA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DragQueryFileW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DragQueryPoint: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DuplicateIcon: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    ExtractAssociatedIconA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    ExtractAssociatedIconExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    ExtractAssociatedIconExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    ExtractAssociatedIconW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    ExtractIconA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    ExtractIconEx: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ExtractIconExA: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ExtractIconExW: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ExtractIconW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    FindExecutableA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindExecutableW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    GetCurrentProcessExplicitAppUserModelID: { args: [FFIType.ptr], returns: FFIType.i32 },
    ILAppendID: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.ptr },
    ILClone: { args: [FFIType.ptr], returns: FFIType.ptr },
    ILCloneFirst: { args: [FFIType.ptr], returns: FFIType.ptr },
    ILCombine: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    ILCreateFromPath: { args: [FFIType.ptr], returns: FFIType.ptr },
    ILCreateFromPathA: { args: [FFIType.ptr], returns: FFIType.ptr },
    ILCreateFromPathW: { args: [FFIType.ptr], returns: FFIType.ptr },
    ILFindChild: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    ILFindLastID: { args: [FFIType.ptr], returns: FFIType.ptr },
    ILFree: { args: [FFIType.ptr], returns: FFIType.void },
    ILGetNext: { args: [FFIType.ptr], returns: FFIType.ptr },
    ILGetSize: { args: [FFIType.ptr], returns: FFIType.u32 },
    ILIsEqual: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ILIsParent: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    ILLoadFromStreamEx: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ILRemoveLastID: { args: [FFIType.ptr], returns: FFIType.i32 },
    ILSaveToStream: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InitNetworkAddressControl: { args: [], returns: FFIType.i32 },
    IsUserAnAdmin: { args: [], returns: FFIType.i32 },
    PathCleanupSpec: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathIsSlowA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathIsSlowW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathMakeUniqueName: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathResolve: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathYetAnotherMakeUniqueName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PickIconDlg: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ReadCabinetState: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    RestartDialog: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RestartDialogEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SHAddDefaultPropertiesByExt: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHAddFromPropSheetExtArray: { args: [FFIType.u64, FFIType.ptr, FFIType.i64], returns: FFIType.u32 },
    SHAddToRecentDocs: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    SHAlloc: { args: [FFIType.u64], returns: FFIType.ptr },
    SHAppBarMessage: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    SHAssocEnumHandlers: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SHAssocEnumHandlersForProtocolByApplication: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHBindToFolderIDListParent: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHBindToFolderIDListParentEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHBindToObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHBindToParent: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHBrowseForFolder: { args: [FFIType.ptr], returns: FFIType.ptr },
    SHBrowseForFolderA: { args: [FFIType.ptr], returns: FFIType.ptr },
    SHBrowseForFolderW: { args: [FFIType.ptr], returns: FFIType.ptr },
    SHChangeNotification_Lock: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    SHChangeNotification_Unlock: { args: [FFIType.u64], returns: FFIType.i32 },
    SHChangeNotify: { args: [FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    SHChangeNotifyDeregister: { args: [FFIType.u32], returns: FFIType.i32 },
    SHChangeNotifyRegister: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    SHCreateAssociationRegistration: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateDataObject: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateDefaultContextMenu: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateDefaultExtractIcon: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateDefaultPropertiesOp: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateDirectory: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHCreateDirectoryExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateDirectoryExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateFileExtractIconW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateItemFromIDList: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateItemFromParsingName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateItemFromRelativeName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateItemInKnownFolder: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateItemWithParent: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateProcessAsUserW: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHCreatePropSheetExtArray: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SHCreateQueryCancelAutoPlayMoniker: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHCreateShellFolderView: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateShellFolderViewEx: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateShellItem: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateShellItemArray: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateShellItemArrayFromDataObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateShellItemArrayFromIDLists: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateShellItemArrayFromShellItem: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateStdEnumFmtEtc: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHDefExtractIconA: { args: [FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHDefExtractIconW: { args: [FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHDestroyPropSheetExtArray: { args: [FFIType.u64], returns: FFIType.void },
    SHDoDragDrop: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHEmptyRecycleBinA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHEmptyRecycleBinW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHEnumerateUnreadMailAccountsW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHEvaluateSystemCommandTemplate: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHExtractIconsW: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    SHFileOperation: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHFileOperationA: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHFileOperationW: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHFormatDrive: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    SHFree: { args: [FFIType.ptr], returns: FFIType.void },
    SHFreeNameMappings: { args: [FFIType.u64], returns: FFIType.void },
    SHGetAttributesFromDataObject: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetDataFromIDListA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHGetDataFromIDListW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHGetDesktopFolder: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHGetDiskFreeSpaceA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetDiskFreeSpaceExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetDiskFreeSpaceExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetDriveMedia: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetFileInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    SHGetFileInfoA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    SHGetFileInfoW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    SHGetFolderLocation: { args: [FFIType.u64, FFIType.i32, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHGetFolderPathA: { args: [FFIType.u64, FFIType.i32, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHGetFolderPathAndSubDirA: { args: [FFIType.u64, FFIType.i32, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetFolderPathAndSubDirW: { args: [FFIType.u64, FFIType.i32, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetFolderPathEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHGetFolderPathW: { args: [FFIType.u64, FFIType.i32, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHGetIDListFromObject: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetIconOverlayIndexA: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHGetIconOverlayIndexW: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHGetImageList: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetInstanceExplorer: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHGetItemFromDataObject: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetItemFromObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetKnownFolderIDList: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHGetKnownFolderItem: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetKnownFolderPath: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHGetLocalizedName: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHGetMalloc: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHGetNameFromIDList: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SHGetNewLinkInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHGetNewLinkInfoA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHGetNewLinkInfoW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHGetPathFromIDList: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetPathFromIDListA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetPathFromIDListEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SHGetPathFromIDListW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetPropertyStoreForWindow: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetPropertyStoreFromIDList: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetPropertyStoreFromParsingName: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetRealIDL: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetSetFolderCustomSettings: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHGetSetSettings: { args: [FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.void },
    SHGetSettings: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.void },
    SHGetSpecialFolderLocation: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SHGetSpecialFolderPathA: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SHGetSpecialFolderPathW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SHGetStockIconInfo: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHGetTemporaryPropertyForItem: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetUnreadMailCountW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHHandleUpdateImage: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHILCreateFromPath: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHInvokePrinterCommandA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHInvokePrinterCommandW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHIsFileAvailableOffline: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHLimitInputEdit: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHLoadInProc: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHLoadNonloadedIconOverlayIdentifiers: { args: [], returns: FFIType.i32 },
    SHMapPIDLToSystemImageListIndex: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHMultiFileProperties: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHObjectProperties: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHOpenFolderAndSelectItems: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHOpenPropSheetW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHOpenWithDialog: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHParseDisplayName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHPathPrepareForWriteA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHPathPrepareForWriteW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHPropStgCreate: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHPropStgReadMultiple: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHPropStgWriteMultiple: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHQueryRecycleBinA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHQueryRecycleBinW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHQueryUserNotificationState: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHRemoveLocalizedName: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHReplaceFromPropSheetExtArray: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.i64], returns: FFIType.u32 },
    SHResolveLibrary: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHRestricted: { args: [FFIType.u32], returns: FFIType.u32 },
    SHSetDefaultProperties: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHSetFolderPathA: { args: [FFIType.i32, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHSetFolderPathW: { args: [FFIType.i32, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHSetInstanceExplorer: { args: [FFIType.ptr], returns: FFIType.void },
    SHSetKnownFolderPath: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHSetLocalizedName: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHSetTemporaryPropertyForItem: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHSetUnreadMailCountW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHShellFolderView_Message: { args: [FFIType.u64, FFIType.u32, FFIType.i64], returns: FFIType.i64 },
    SHShowManageLibraryUI: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHSimpleIDListFromPath: { args: [FFIType.ptr], returns: FFIType.ptr },
    SHStartNetConnectionDialogW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHTestTokenMembership: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SHUpdateImageA: { args: [FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.i32], returns: FFIType.void },
    SHUpdateImageW: { args: [FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.i32], returns: FFIType.void },
    SHUpdateRecycleBinIcon: { args: [], returns: FFIType.void },
    SHValidateUNC: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetCurrentProcessExplicitAppUserModelID: { args: [FFIType.ptr], returns: FFIType.i32 },
    ShellAboutA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i64 },
    ShellAboutW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i64 },
    ShellExecuteA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    ShellExecuteEx: { args: [FFIType.ptr], returns: FFIType.i32 },
    ShellExecuteExA: { args: [FFIType.ptr], returns: FFIType.i32 },
    ShellExecuteExW: { args: [FFIType.ptr], returns: FFIType.i32 },
    ShellExecuteW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    Shell_GetImageLists: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    Shell_MergeMenus: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    Shell_NotifyIcon: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    Shell_NotifyIconA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    Shell_NotifyIconGetRect: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    Shell_NotifyIconW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SignalFileOpen: { args: [FFIType.ptr], returns: FFIType.i32 },
    StgMakeUniqueName: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrChrA: { args: [FFIType.ptr, FFIType.u16], returns: FFIType.ptr },
    StrChrIA: { args: [FFIType.ptr, FFIType.u16], returns: FFIType.ptr },
    StrChrIW: { args: [FFIType.ptr, FFIType.u16], returns: FFIType.ptr },
    StrChrW: { args: [FFIType.ptr, FFIType.u16], returns: FFIType.ptr },
    StrCmpNA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    StrCmpNIA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    StrCmpNIW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    StrCmpNW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    StrRChrA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u16], returns: FFIType.ptr },
    StrRChrIA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u16], returns: FFIType.ptr },
    StrRChrIW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u16], returns: FFIType.ptr },
    StrRChrW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u16], returns: FFIType.ptr },
    StrRStrIA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    StrRStrIW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    StrStrA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    StrStrIA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    StrStrIW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    StrStrW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    WOWShellExecute: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    Win32DeleteFile: { args: [FFIType.ptr], returns: FFIType.i32 },
    WriteCabinetState: { args: [FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-assoccreateforclasses
  public static AssocCreateForClasses(rgClasses: LPVOID, cClasses: ULONG, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('AssocCreateForClasses')(rgClasses, cClasses, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-assocgetdetailsofpropkey
  public static AssocGetDetailsOfPropKey(psf: LPVOID, pidl: PCUITEMID_CHILD, pkey: LPVOID, pv: LPVOID, pfFoundPropKey: LPVOID): HRESULT {
    return Shell32.Load('AssocGetDetailsOfPropKey')(psf, pidl, pkey, pv, pfFoundPropKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-cdeffoldeMenu_create2
  public static CDefFolderMenu_Create2(
    pidlFolder: PCIDLIST_ABSOLUTE | NULL,
    hwnd: HWND | 0n,
    cidl: UINT,
    apidl: PCUITEMID_CHILD_ARRAY,
    psf: LPVOID | NULL,
    pfn: LPFNDFMCALLBACK | NULL,
    nKeys: UINT,
    ahkeys: LPVOID | NULL,
    ppcm: LPVOID,
  ): HRESULT {
    return Shell32.Load('CDefFolderMenu_Create2')(pidlFolder, hwnd, cidl, apidl, psf, pfn, nKeys, ahkeys, ppcm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj/nf-shlobj-cidldata_createfromidarray
  public static CIDLData_CreateFromIDArray(pidlFolder: PCIDLIST_ABSOLUTE, cidl: UINT, apidl: PCUIDLIST_RELATIVE_ARRAY, ppdtobj: LPVOID): HRESULT {
    return Shell32.Load('CIDLData_CreateFromIDArray')(pidlFolder, cidl, apidl, ppdtobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-commandlinetoargvw
  public static CommandLineToArgvW(lpCmdLine: LPCWSTR, pNumArgs: LPVOID): LPWSTR {
    return Shell32.Load('CommandLineToArgvW')(lpCmdLine, pNumArgs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-dad_autoscroll
  public static DAD_AutoScroll(hwnd: HWND, pad: LPAUTO_SCROLL_DATA, pptNow: LPPOINT): BOOL {
    return Shell32.Load('DAD_AutoScroll')(hwnd, pad, pptNow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-dad_dragenterex
  public static DAD_DragEnterEx(hwndTarget: HWND, ptStart: PACKED_POINT): BOOL {
    return Shell32.Load('DAD_DragEnterEx')(hwndTarget, ptStart);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-dad_dragenterex2
  public static DAD_DragEnterEx2(hwndTarget: HWND, ptStart: PACKED_POINT, pdtObject: LPVOID | NULL): BOOL {
    return Shell32.Load('DAD_DragEnterEx2')(hwndTarget, ptStart, pdtObject);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-dad_dragleave
  public static DAD_DragLeave(): BOOL {
    return Shell32.Load('DAD_DragLeave')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-dad_dragmove
  public static DAD_DragMove(pt: PACKED_POINT): BOOL {
    return Shell32.Load('DAD_DragMove')(pt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-dad_setdragimage
  public static DAD_SetDragImage(him: HIMAGELIST, pptOffset: LPPOINT | NULL): BOOL {
    return Shell32.Load('DAD_SetDragImage')(him, pptOffset);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-dad_showdragimage
  public static DAD_ShowDragImage(fShow: BOOL): BOOL {
    return Shell32.Load('DAD_ShowDragImage')(fShow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-dllgetversion
  public static DllGetVersion(pdvi: PDLLVERSIONINFO): HRESULT {
    return Shell32.Load('DllGetVersion')(pdvi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-doenvironmentsubsta
  public static DoEnvironmentSubstA(pszSrc: LPSTR, cchSrc: UINT): DWORD {
    return Shell32.Load('DoEnvironmentSubstA')(pszSrc, cchSrc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-doenvironmentsubstw
  public static DoEnvironmentSubstW(pszSrc: LPWSTR, cchSrc: UINT): DWORD {
    return Shell32.Load('DoEnvironmentSubstW')(pszSrc, cchSrc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-dragacceptfiles
  public static DragAcceptFiles(hWnd: HWND, fAccept: BOOL): void {
    return Shell32.Load('DragAcceptFiles')(hWnd, fAccept);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-dragfinish
  public static DragFinish(hDrop: HDROP): void {
    return Shell32.Load('DragFinish')(hDrop);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-dragqueryfilea
  public static DragQueryFile(hDrop: HDROP, iFile: UINT, lpszFile: LPSTR | NULL, cch: UINT): UINT {
    return Shell32.Load('DragQueryFile')(hDrop, iFile, lpszFile, cch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-dragqueryfilea
  public static DragQueryFileA(hDrop: HDROP, iFile: UINT, lpszFile: LPSTR | NULL, cch: UINT): UINT {
    return Shell32.Load('DragQueryFileA')(hDrop, iFile, lpszFile, cch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-dragqueryfilew
  public static DragQueryFileW(hDrop: HDROP, iFile: UINT, lpszFile: LPWSTR | NULL, cch: UINT): UINT {
    return Shell32.Load('DragQueryFileW')(hDrop, iFile, lpszFile, cch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-dragquerypoint
  public static DragQueryPoint(hDrop: HDROP, lppt: LPPOINT): BOOL {
    return Shell32.Load('DragQueryPoint')(hDrop, lppt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-duplicateicon
  public static DuplicateIcon(hInst: HINSTANCE | 0n, hIcon: HICON): HICON {
    return Shell32.Load('DuplicateIcon')(hInst, hIcon);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-extractassociatedicona
  public static ExtractAssociatedIconA(hInst: HINSTANCE, pszIconPath: LPSTR, piIcon: LPWORD): HICON {
    return Shell32.Load('ExtractAssociatedIconA')(hInst, pszIconPath, piIcon);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-extractassociatediconexa
  public static ExtractAssociatedIconExA(hInst: HINSTANCE, pszIconPath: LPSTR, piIconIndex: LPWORD, piIconId: LPWORD): HICON {
    return Shell32.Load('ExtractAssociatedIconExA')(hInst, pszIconPath, piIconIndex, piIconId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-extractassociatediconexw
  public static ExtractAssociatedIconExW(hInst: HINSTANCE, pszIconPath: LPWSTR, piIconIndex: LPWORD, piIconId: LPWORD): HICON {
    return Shell32.Load('ExtractAssociatedIconExW')(hInst, pszIconPath, piIconIndex, piIconId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-extractassociatediconw
  public static ExtractAssociatedIconW(hInst: HINSTANCE, pszIconPath: LPWSTR, piIcon: LPWORD): HICON {
    return Shell32.Load('ExtractAssociatedIconW')(hInst, pszIconPath, piIcon);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-extracticona
  public static ExtractIconA(hInst: HINSTANCE, pszExeFileName: LPCSTR, nIconIndex: UINT): HICON {
    return Shell32.Load('ExtractIconA')(hInst, pszExeFileName, nIconIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-extracticonexa
  public static ExtractIconEx(lpszFile: LPCSTR, nIconIndex: INT, phiconLarge: LPVOID | NULL, phiconSmall: LPVOID | NULL, nIcons: UINT): UINT {
    return Shell32.Load('ExtractIconEx')(lpszFile, nIconIndex, phiconLarge, phiconSmall, nIcons);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-extracticonexa
  public static ExtractIconExA(lpszFile: LPCSTR, nIconIndex: INT, phiconLarge: LPVOID | NULL, phiconSmall: LPVOID | NULL, nIcons: UINT): UINT {
    return Shell32.Load('ExtractIconExA')(lpszFile, nIconIndex, phiconLarge, phiconSmall, nIcons);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-extracticonexw
  public static ExtractIconExW(lpszFile: LPCWSTR, nIconIndex: INT, phiconLarge: LPVOID | NULL, phiconSmall: LPVOID | NULL, nIcons: UINT): UINT {
    return Shell32.Load('ExtractIconExW')(lpszFile, nIconIndex, phiconLarge, phiconSmall, nIcons);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-extracticonw
  public static ExtractIconW(hInst: HINSTANCE, pszExeFileName: LPCWSTR, nIconIndex: UINT): HICON {
    return Shell32.Load('ExtractIconW')(hInst, pszExeFileName, nIconIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-findexecutablea
  public static FindExecutableA(lpFile: LPCSTR, lpDirectory: LPCSTR | NULL, lpResult: LPSTR): HINSTANCE {
    return Shell32.Load('FindExecutableA')(lpFile, lpDirectory, lpResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-findexecutablew
  public static FindExecutableW(lpFile: LPCWSTR, lpDirectory: LPCWSTR | NULL, lpResult: LPWSTR): HINSTANCE {
    return Shell32.Load('FindExecutableW')(lpFile, lpDirectory, lpResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-getcurrentprocessexplicitappusermodelid
  public static GetCurrentProcessExplicitAppUserModelID(AppID: LPVOID): HRESULT {
    return Shell32.Load('GetCurrentProcessExplicitAppUserModelID')(AppID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilappendid
  public static ILAppendID(pidl: PIDLIST_RELATIVE | NULL, pmkid: LPCSHITEMID, fAppend: BOOL): PIDLIST_RELATIVE {
    return Shell32.Load('ILAppendID')(pidl, pmkid, fAppend);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilclone
  public static ILClone(pidl: PCIDLIST_ABSOLUTE): PIDLIST_ABSOLUTE {
    return Shell32.Load('ILClone')(pidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilclonefirst
  public static ILCloneFirst(pidl: PCIDLIST_ABSOLUTE): PUITEMID_CHILD {
    return Shell32.Load('ILCloneFirst')(pidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilcombine
  public static ILCombine(pidl1: PCIDLIST_ABSOLUTE, pidl2: PCUIDLIST_RELATIVE): PIDLIST_ABSOLUTE {
    return Shell32.Load('ILCombine')(pidl1, pidl2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilcreatefrompath
  public static ILCreateFromPath(pszPath: LPCWSTR): PIDLIST_ABSOLUTE {
    return Shell32.Load('ILCreateFromPath')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilcreatefrompatha
  public static ILCreateFromPathA(pszPath: LPCSTR): PIDLIST_ABSOLUTE {
    return Shell32.Load('ILCreateFromPathA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilcreatefrompathw
  public static ILCreateFromPathW(pszPath: LPCWSTR): PIDLIST_ABSOLUTE {
    return Shell32.Load('ILCreateFromPathW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilfindchild
  public static ILFindChild(pidlParent: PCIDLIST_ABSOLUTE, pidlChild: PCIDLIST_ABSOLUTE): PUIDLIST_RELATIVE {
    return Shell32.Load('ILFindChild')(pidlParent, pidlChild);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilfindlastid
  public static ILFindLastID(pidl: PCIDLIST_ABSOLUTE): PUITEMID_CHILD {
    return Shell32.Load('ILFindLastID')(pidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilfree
  public static ILFree(pidl: PIDLIST_RELATIVE | NULL): void {
    return Shell32.Load('ILFree')(pidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilgetnext
  public static ILGetNext(pidl: PCUIDLIST_RELATIVE): PUIDLIST_RELATIVE {
    return Shell32.Load('ILGetNext')(pidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilgetsize
  public static ILGetSize(pidl: PCIDLIST_ABSOLUTE): UINT {
    return Shell32.Load('ILGetSize')(pidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilisequal
  public static ILIsEqual(pidl1: PCIDLIST_ABSOLUTE, pidl2: PCIDLIST_ABSOLUTE): BOOL {
    return Shell32.Load('ILIsEqual')(pidl1, pidl2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilisparent
  public static ILIsParent(pidl1: PCIDLIST_ABSOLUTE, pidl2: PCIDLIST_ABSOLUTE, fImmediate: BOOL): BOOL {
    return Shell32.Load('ILIsParent')(pidl1, pidl2, fImmediate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-illoadfromstreamex
  public static ILLoadFromStreamEx(pstm: LPVOID, ppidl: LPVOID): HRESULT {
    return Shell32.Load('ILLoadFromStreamEx')(pstm, ppidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilremovelastid
  public static ILRemoveLastID(pidl: PUIDLIST_RELATIVE): BOOL {
    return Shell32.Load('ILRemoveLastID')(pidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-ilsavetostream
  public static ILSaveToStream(pstm: LPVOID, pidl: PCIDLIST_ABSOLUTE): HRESULT {
    return Shell32.Load('ILSaveToStream')(pstm, pidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-initnetworkaddresscontrol
  public static InitNetworkAddressControl(): BOOL {
    return Shell32.Load('InitNetworkAddressControl')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-isuseranadmin
  public static IsUserAnAdmin(): BOOL {
    return Shell32.Load('IsUserAnAdmin')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-pathcleanupspec
  public static PathCleanupSpec(pszDir: LPCWSTR | NULL, pszSpec: LPWSTR): INT {
    return Shell32.Load('PathCleanupSpec')(pszDir, pszSpec);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-pathisslowa
  public static PathIsSlowA(pszFile: LPCSTR, dwAttr: DWORD): BOOL {
    return Shell32.Load('PathIsSlowA')(pszFile, dwAttr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-pathissloww
  public static PathIsSlowW(pszFile: LPCWSTR, dwAttr: DWORD): BOOL {
    return Shell32.Load('PathIsSlowW')(pszFile, dwAttr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-pathmakeuniquename
  public static PathMakeUniqueName(pszUniqueName: LPWSTR, cchMax: UINT, pszTemplate: LPCWSTR | NULL, pszLongPlate: LPCWSTR | NULL, pszDir: LPCWSTR): BOOL {
    return Shell32.Load('PathMakeUniqueName')(pszUniqueName, cchMax, pszTemplate, pszLongPlate, pszDir);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-pathresolve
  public static PathResolve(pszPath: LPWSTR, dirs: LPVOID | NULL, fFlags: UINT): INT {
    return Shell32.Load('PathResolve')(pszPath, dirs, fFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-pathyetanothermakeuniquename
  public static PathYetAnotherMakeUniqueName(pszUniqueName: LPWSTR, pszPath: LPCWSTR, pszShort: LPCWSTR | NULL, pszFileSpec: LPCWSTR | NULL): BOOL {
    return Shell32.Load('PathYetAnotherMakeUniqueName')(pszUniqueName, pszPath, pszShort, pszFileSpec);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-pickicondlg
  public static PickIconDlg(hwnd: HWND | 0n, pszIconPath: LPWSTR, cchIconPath: UINT, piIconIndex: LPVOID): INT {
    return Shell32.Load('PickIconDlg')(hwnd, pszIconPath, cchIconPath, piIconIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-readcabinetstate
  public static ReadCabinetState(pcs: PCABINETSTATE, cLength: INT): BOOL {
    return Shell32.Load('ReadCabinetState')(pcs, cLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-restartdialog
  public static RestartDialog(hwnd: HWND | 0n, pszPrompt: LPCWSTR | NULL, dwReturn: DWORD): INT {
    return Shell32.Load('RestartDialog')(hwnd, pszPrompt, dwReturn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-restartdialogex
  public static RestartDialogEx(hwnd: HWND | 0n, pszPrompt: LPCWSTR | NULL, dwReturn: DWORD, dwReasonCode: DWORD): INT {
    return Shell32.Load('RestartDialogEx')(hwnd, pszPrompt, dwReturn, dwReasonCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl/nf-shobjidl-shadddefaultpropertiesbyext
  public static SHAddDefaultPropertiesByExt(pszExt: LPCWSTR, pPropStore: LPVOID): HRESULT {
    return Shell32.Load('SHAddDefaultPropertiesByExt')(pszExt, pPropStore);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj/nf-shlobj-shaddfromPropSheetextarray
  public static SHAddFromPropSheetExtArray(hpsxa: HPSXA, lpfnAddPage: LPFNADDPROPSHEETPAGE, lParam: LPARAM): UINT {
    return Shell32.Load('SHAddFromPropSheetExtArray')(hpsxa, lpfnAddPage, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shaddtorecentdocs
  public static SHAddToRecentDocs(uFlags: UINT, pv: LPCVOID | NULL): void {
    return Shell32.Load('SHAddToRecentDocs')(uFlags, pv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shalloc
  public static SHAlloc(cb: SIZE_T): LPVOID {
    return Shell32.Load('SHAlloc')(cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shappbarmessage
  public static SHAppBarMessage(dwMessage: DWORD, pData: PAPPBARDATA): UINT_PTR {
    return Shell32.Load('SHAppBarMessage')(dwMessage, pData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shassocenumhandlers
  public static SHAssocEnumHandlers(pszExtra: LPCWSTR, afFilter: ASSOC_FILTER, ppEnumHandler: LPVOID): HRESULT {
    return Shell32.Load('SHAssocEnumHandlers')(pszExtra, afFilter, ppEnumHandler);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shassocenumhandlersforprotocolbyapplication
  public static SHAssocEnumHandlersForProtocolByApplication(pszProtocol: LPCWSTR, riid: LPVOID, enumHandlers: LPVOID): HRESULT {
    return Shell32.Load('SHAssocEnumHandlersForProtocolByApplication')(pszProtocol, riid, enumHandlers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shbindtofolderidlistparent
  public static SHBindToFolderIDListParent(psfRoot: LPVOID | NULL, pidl: PCUIDLIST_RELATIVE, riid: LPVOID, ppv: LPVOID, ppidlLast: LPVOID | NULL): HRESULT {
    return Shell32.Load('SHBindToFolderIDListParent')(psfRoot, pidl, riid, ppv, ppidlLast);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shbindtofolderidlistparentex
  public static SHBindToFolderIDListParentEx(psfRoot: LPVOID | NULL, pidl: PCUIDLIST_RELATIVE, ppbc: LPVOID | NULL, riid: LPVOID, ppv: LPVOID, ppidlLast: LPVOID | NULL): HRESULT {
    return Shell32.Load('SHBindToFolderIDListParentEx')(psfRoot, pidl, ppbc, riid, ppv, ppidlLast);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shbindtoobject
  public static SHBindToObject(psf: LPVOID, pidl: PCUIDLIST_RELATIVE, pbc: LPVOID | NULL, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHBindToObject')(psf, pidl, pbc, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shbindtoparent
  public static SHBindToParent(pidl: PCIDLIST_ABSOLUTE, riid: LPVOID, ppv: LPVOID, ppidlLast: LPVOID | NULL): HRESULT {
    return Shell32.Load('SHBindToParent')(pidl, riid, ppv, ppidlLast);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shbrowseforfoldera
  public static SHBrowseForFolder(lpbi: LPBROWSEINFOA): PIDLIST_ABSOLUTE {
    return Shell32.Load('SHBrowseForFolder')(lpbi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shbrowseforfoldera
  public static SHBrowseForFolderA(lpbi: LPBROWSEINFOA): PIDLIST_ABSOLUTE {
    return Shell32.Load('SHBrowseForFolderA')(lpbi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shbrowseforfolderw
  public static SHBrowseForFolderW(lpbi: LPBROWSEINFOW): PIDLIST_ABSOLUTE {
    return Shell32.Load('SHBrowseForFolderW')(lpbi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shchangenotification_lock
  public static SHChangeNotification_Lock(hChange: HANDLE, dwProcId: DWORD, pppidl: LPVOID, plEvent: LPVOID): HANDLE {
    return Shell32.Load('SHChangeNotification_Lock')(hChange, dwProcId, pppidl, plEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shchangenotification_unlock
  public static SHChangeNotification_Unlock(hLock: HANDLE): BOOL {
    return Shell32.Load('SHChangeNotification_Unlock')(hLock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shchangenotify
  public static SHChangeNotify(wEventId: LONG, uFlags: UINT, dwItem1: LPCVOID | NULL, dwItem2: LPCVOID | NULL): void {
    return Shell32.Load('SHChangeNotify')(wEventId, uFlags, dwItem1, dwItem2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shchangenotifyderegister
  public static SHChangeNotifyDeregister(ulID: ULONG): BOOL {
    return Shell32.Load('SHChangeNotifyDeregister')(ulID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shchangenotifyregister
  public static SHChangeNotifyRegister(hwnd: HWND, fSources: INT, fEvents: LONG, wMsg: UINT, cEntries: INT, pshcne: PSHCHANGENOTIFYENTRY): ULONG {
    return Shell32.Load('SHChangeNotifyRegister')(hwnd, fSources, fEvents, wMsg, cEntries, pshcne);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shcreateassociationregistration
  public static SHCreateAssociationRegistration(riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHCreateAssociationRegistration')(riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shcreatedataobject
  public static SHCreateDataObject(pidlFolder: PCIDLIST_ABSOLUTE | NULL, cidl: UINT, apidl: PCUITEMID_CHILD_ARRAY | NULL, pdtInner: LPVOID | NULL, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHCreateDataObject')(pidlFolder, cidl, apidl, pdtInner, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shcreatedefaultcontextmenu
  public static SHCreateDefaultContextMenu(pdcm: PCDEFCONTEXTMENU, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHCreateDefaultContextMenu')(pdcm, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shcreatedefaultextracticon
  public static SHCreateDefaultExtractIcon(riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHCreateDefaultExtractIcon')(riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl/nf-shobjidl-shcreatedefaultpropertiesop
  public static SHCreateDefaultPropertiesOp(psi: LPVOID, ppFileOp: LPVOID): HRESULT {
    return Shell32.Load('SHCreateDefaultPropertiesOp')(psi, ppFileOp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shcreatedirectory
  public static SHCreateDirectory(hwnd: HWND | 0n, pszPath: LPCWSTR): INT {
    return Shell32.Load('SHCreateDirectory')(hwnd, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shcreatedirectoryexa
  public static SHCreateDirectoryExA(hwnd: HWND | 0n, pszPath: LPCSTR, psa: LPSECURITY_ATTRIBUTES | NULL): INT {
    return Shell32.Load('SHCreateDirectoryExA')(hwnd, pszPath, psa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shcreatedirectoryexw
  public static SHCreateDirectoryExW(hwnd: HWND | 0n, pszPath: LPCWSTR, psa: LPSECURITY_ATTRIBUTES | NULL): INT {
    return Shell32.Load('SHCreateDirectoryExW')(hwnd, pszPath, psa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shcreatefileextracticonw
  public static SHCreateFileExtractIconW(pszFile: LPCWSTR, dwFileAttributes: DWORD, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHCreateFileExtractIconW')(pszFile, dwFileAttributes, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shcreateitemfromidlist
  public static SHCreateItemFromIDList(pidl: PCIDLIST_ABSOLUTE, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHCreateItemFromIDList')(pidl, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shcreateitemfromparsingname
  public static SHCreateItemFromParsingName(pszPath: LPCWSTR, pbc: LPVOID | NULL, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHCreateItemFromParsingName')(pszPath, pbc, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shcreateitemfromrelativename
  public static SHCreateItemFromRelativeName(psiParent: LPVOID, pszName: LPCWSTR, pbc: LPVOID | NULL, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHCreateItemFromRelativeName')(psiParent, pszName, pbc, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shcreateiteminknownfolder
  public static SHCreateItemInKnownFolder(kfid: LPVOID, dwKFFlags: DWORD, pszItem: LPCWSTR | NULL, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHCreateItemInKnownFolder')(kfid, dwKFFlags, pszItem, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shcreateitemwithparent
  public static SHCreateItemWithParent(pidlParent: PCIDLIST_ABSOLUTE | NULL, psfParent: LPVOID | NULL, pidl: PCUITEMID_CHILD, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHCreateItemWithParent')(pidlParent, psfParent, pidl, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shcreateprocessasuserw
  public static SHCreateProcessAsUserW(pscpi: LPSHCREATEPROCESSINFOW): BOOL {
    return Shell32.Load('SHCreateProcessAsUserW')(pscpi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj/nf-shlobj-shcreatepropsheetextarray
  public static SHCreatePropSheetExtArray(hKey: HKEY, pszSubKey: LPCWSTR | NULL, max_iface: UINT): HPSXA {
    return Shell32.Load('SHCreatePropSheetExtArray')(hKey, pszSubKey, max_iface);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shcreatequerycancelautoplaymoniker
  public static SHCreateQueryCancelAutoPlayMoniker(ppmoniker: LPVOID): HRESULT {
    return Shell32.Load('SHCreateQueryCancelAutoPlayMoniker')(ppmoniker);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shcreateshellfolderview
  public static SHCreateShellFolderView(pcsfv: PSFV_CREATE, ppsv: LPVOID): HRESULT {
    return Shell32.Load('SHCreateShellFolderView')(pcsfv, ppsv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shcreateshellfolderviewex
  public static SHCreateShellFolderViewEx(pcsfv: LPVOID, ppsv: LPVOID): HRESULT {
    return Shell32.Load('SHCreateShellFolderViewEx')(pcsfv, ppsv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shcreateshellitem
  public static SHCreateShellItem(pidlParent: PCIDLIST_ABSOLUTE | NULL, psfParent: LPVOID | NULL, pidl: PCUITEMID_CHILD, ppsi: LPVOID): HRESULT {
    return Shell32.Load('SHCreateShellItem')(pidlParent, psfParent, pidl, ppsi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shcreateshellitemarray
  public static SHCreateShellItemArray(pidlParent: PCIDLIST_ABSOLUTE | NULL, psf: LPVOID | NULL, cidl: UINT, ppidl: PCUITEMID_CHILD_ARRAY, ppsiItemArray: LPVOID): HRESULT {
    return Shell32.Load('SHCreateShellItemArray')(pidlParent, psf, cidl, ppidl, ppsiItemArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shcreateshellitemarrayfromdataobject
  public static SHCreateShellItemArrayFromDataObject(pdo: LPVOID, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHCreateShellItemArrayFromDataObject')(pdo, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shcreateshellitemarrayfromidlists
  public static SHCreateShellItemArrayFromIDLists(cidl: UINT, rgpidl: LPVOID, ppsiItemArray: LPVOID): HRESULT {
    return Shell32.Load('SHCreateShellItemArrayFromIDLists')(cidl, rgpidl, ppsiItemArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shcreateshellitemarrayfromshellitem
  public static SHCreateShellItemArrayFromShellItem(psi: LPVOID, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHCreateShellItemArrayFromShellItem')(psi, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shcreatestdenumfmtetc
  public static SHCreateStdEnumFmtEtc(cfmt: UINT, afmt: LPVOID, ppenumFormatEtc: LPVOID): HRESULT {
    return Shell32.Load('SHCreateStdEnumFmtEtc')(cfmt, afmt, ppenumFormatEtc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shdefextracticona
  public static SHDefExtractIconA(pszIconFile: LPCSTR, iIndex: INT, uFlags: UINT, phiconLarge: LPVOID | NULL, phiconSmall: LPVOID | NULL, nIconSize: UINT): HRESULT {
    return Shell32.Load('SHDefExtractIconA')(pszIconFile, iIndex, uFlags, phiconLarge, phiconSmall, nIconSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shdefextracticonw
  public static SHDefExtractIconW(pszIconFile: LPCWSTR, iIndex: INT, uFlags: UINT, phiconLarge: LPVOID | NULL, phiconSmall: LPVOID | NULL, nIconSize: UINT): HRESULT {
    return Shell32.Load('SHDefExtractIconW')(pszIconFile, iIndex, uFlags, phiconLarge, phiconSmall, nIconSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj/nf-shlobj-shdestroypropsheetextarray
  public static SHDestroyPropSheetExtArray(hpsxa: HPSXA): void {
    return Shell32.Load('SHDestroyPropSheetExtArray')(hpsxa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shdodragdrop
  public static SHDoDragDrop(hwnd: HWND, pdata: LPVOID, pdsrc: LPVOID | NULL, dwEffect: DWORD, pdwEffect: LPDWORD): HRESULT {
    return Shell32.Load('SHDoDragDrop')(hwnd, pdata, pdsrc, dwEffect, pdwEffect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shemptyrecyclebina
  public static SHEmptyRecycleBinA(hwnd: HWND | 0n, pszRootPath: LPCSTR | NULL, dwFlags: DWORD): HRESULT {
    return Shell32.Load('SHEmptyRecycleBinA')(hwnd, pszRootPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shemptyrecyclebinw
  public static SHEmptyRecycleBinW(hwnd: HWND | 0n, pszRootPath: LPCWSTR | NULL, dwFlags: DWORD): HRESULT {
    return Shell32.Load('SHEmptyRecycleBinW')(hwnd, pszRootPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shenumerateunreadmailaccountsw
  public static SHEnumerateUnreadMailAccountsW(hKeyUser: HKEY | 0n, dwIndex: DWORD, pszMailAddress: LPWSTR, cchMailAddress: INT): HRESULT {
    return Shell32.Load('SHEnumerateUnreadMailAccountsW')(hKeyUser, dwIndex, pszMailAddress, cchMailAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shevaluatesystemcommandtemplate
  public static SHEvaluateSystemCommandTemplate(pszCmdTemplate: LPCWSTR, ppszApplication: LPVOID, ppszCommandLine: LPVOID, ppszParameters: LPVOID): HRESULT {
    return Shell32.Load('SHEvaluateSystemCommandTemplate')(pszCmdTemplate, ppszApplication, ppszCommandLine, ppszParameters);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shextracticonsw
  public static SHExtractIconsW(pszFileName: LPCWSTR, nIconIndex: INT, cxIcon: INT, cyIcon: INT, phicon: LPVOID, piconid: LPVOID | NULL, nIcons: UINT, flags: UINT): UINT {
    return Shell32.Load('SHExtractIconsW')(pszFileName, nIconIndex, cxIcon, cyIcon, phicon, piconid, nIcons, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shfileoperationa
  public static SHFileOperation(lpFileOp: LPSHFILEOPSTRUCTA): INT {
    return Shell32.Load('SHFileOperation')(lpFileOp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shfileoperationa
  public static SHFileOperationA(lpFileOp: LPSHFILEOPSTRUCTA): INT {
    return Shell32.Load('SHFileOperationA')(lpFileOp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shfileoperationw
  public static SHFileOperationW(lpFileOp: LPSHFILEOPSTRUCTW): INT {
    return Shell32.Load('SHFileOperationW')(lpFileOp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shformatdrive
  public static SHFormatDrive(hwnd: HWND, drive: UINT, fmtID: UINT, options: UINT): DWORD {
    return Shell32.Load('SHFormatDrive')(hwnd, drive, fmtID, options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shfree
  public static SHFree(pv: LPVOID | NULL): void {
    return Shell32.Load('SHFree')(pv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shfreenamemappings
  public static SHFreeNameMappings(hNameMappings: HANDLE): void {
    return Shell32.Load('SHFreeNameMappings')(hNameMappings);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetattributesfromdataobject
  public static SHGetAttributesFromDataObject(pdo: LPVOID, dwAttributeMask: DWORD, pdwAttributes: LPDWORD, pcItems: LPVOID): HRESULT {
    return Shell32.Load('SHGetAttributesFromDataObject')(pdo, dwAttributeMask, pdwAttributes, pcItems);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetdatafromidlista
  public static SHGetDataFromIDListA(psf: LPVOID, pidl: PCUITEMID_CHILD, nFormat: INT, pv: LPVOID, cb: INT): HRESULT {
    return Shell32.Load('SHGetDataFromIDListA')(psf, pidl, nFormat, pv, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetdatafromidlistw
  public static SHGetDataFromIDListW(psf: LPVOID, pidl: PCUITEMID_CHILD, nFormat: INT, pv: LPVOID, cb: INT): HRESULT {
    return Shell32.Load('SHGetDataFromIDListW')(psf, pidl, nFormat, pv, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetdesktopfolder
  public static SHGetDesktopFolder(ppshf: LPVOID): HRESULT {
    return Shell32.Load('SHGetDesktopFolder')(ppshf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shgetdiskfreespaceexa
  public static SHGetDiskFreeSpaceA(pszDirectoryName: LPCSTR, pFreeBytesAvailableToCaller: LPVOID | NULL, pTotalNumberOfBytes: LPVOID | NULL, pTotalNumberOfFreeBytes: LPVOID | NULL): BOOL {
    return Shell32.Load('SHGetDiskFreeSpaceA')(pszDirectoryName, pFreeBytesAvailableToCaller, pTotalNumberOfBytes, pTotalNumberOfFreeBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shgetdiskfreespaceexa
  public static SHGetDiskFreeSpaceExA(pszDirectoryName: LPCSTR, pFreeBytesAvailableToCaller: LPVOID | NULL, pTotalNumberOfBytes: LPVOID | NULL, pTotalNumberOfFreeBytes: LPVOID | NULL): BOOL {
    return Shell32.Load('SHGetDiskFreeSpaceExA')(pszDirectoryName, pFreeBytesAvailableToCaller, pTotalNumberOfBytes, pTotalNumberOfFreeBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shgetdiskfreespaceexw
  public static SHGetDiskFreeSpaceExW(pszDirectoryName: LPCWSTR, pFreeBytesAvailableToCaller: LPVOID | NULL, pTotalNumberOfBytes: LPVOID | NULL, pTotalNumberOfFreeBytes: LPVOID | NULL): BOOL {
    return Shell32.Load('SHGetDiskFreeSpaceExW')(pszDirectoryName, pFreeBytesAvailableToCaller, pTotalNumberOfBytes, pTotalNumberOfFreeBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetdrivemedia
  public static SHGetDriveMedia(pszDrive: LPCWSTR, pdwMediaContent: LPDWORD): HRESULT {
    return Shell32.Load('SHGetDriveMedia')(pszDrive, pdwMediaContent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shgetfileinfoa
  public static SHGetFileInfo(pszPath: LPCSTR, dwFileAttributes: DWORD, psfi: LPSHFILEINFOA, cbFileInfo: UINT, uFlags: UINT): DWORD_PTR {
    return Shell32.Load('SHGetFileInfo')(pszPath, dwFileAttributes, psfi, cbFileInfo, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shgetfileinfoa
  public static SHGetFileInfoA(pszPath: LPCSTR, dwFileAttributes: DWORD, psfi: LPSHFILEINFOA, cbFileInfo: UINT, uFlags: UINT): DWORD_PTR {
    return Shell32.Load('SHGetFileInfoA')(pszPath, dwFileAttributes, psfi, cbFileInfo, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shgetfileinfow
  public static SHGetFileInfoW(pszPath: LPCWSTR, dwFileAttributes: DWORD, psfi: LPSHFILEINFOW, cbFileInfo: UINT, uFlags: UINT): DWORD_PTR {
    return Shell32.Load('SHGetFileInfoW')(pszPath, dwFileAttributes, psfi, cbFileInfo, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetfolderlocation
  public static SHGetFolderLocation(hwnd: HWND | 0n, csidl: INT, hToken: HANDLE | 0n, dwFlags: DWORD, ppidl: LPVOID): HRESULT {
    return Shell32.Load('SHGetFolderLocation')(hwnd, csidl, hToken, dwFlags, ppidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetfolderpatha
  public static SHGetFolderPathA(hwnd: HWND | 0n, csidl: INT, hToken: HANDLE | 0n, dwFlags: DWORD, pszPath: LPSTR): HRESULT {
    return Shell32.Load('SHGetFolderPathA')(hwnd, csidl, hToken, dwFlags, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetfolderpathandsubdira
  public static SHGetFolderPathAndSubDirA(hwnd: HWND | 0n, csidl: INT, hToken: HANDLE | 0n, dwFlags: DWORD, pszSubDir: LPCSTR, pszPath: LPSTR): HRESULT {
    return Shell32.Load('SHGetFolderPathAndSubDirA')(hwnd, csidl, hToken, dwFlags, pszSubDir, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetfolderpathandsubdirw
  public static SHGetFolderPathAndSubDirW(hwnd: HWND | 0n, csidl: INT, hToken: HANDLE | 0n, dwFlags: DWORD, pszSubDir: LPCWSTR, pszPath: LPWSTR): HRESULT {
    return Shell32.Load('SHGetFolderPathAndSubDirW')(hwnd, csidl, hToken, dwFlags, pszSubDir, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetfolderpathex
  public static SHGetFolderPathEx(rfid: LPVOID, dwFlags: DWORD, hToken: HANDLE | 0n, pszPath: LPWSTR, cchPath: UINT): HRESULT {
    return Shell32.Load('SHGetFolderPathEx')(rfid, dwFlags, hToken, pszPath, cchPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetfolderpathw
  public static SHGetFolderPathW(hwnd: HWND | 0n, csidl: INT, hToken: HANDLE | 0n, dwFlags: DWORD, pszPath: LPWSTR): HRESULT {
    return Shell32.Load('SHGetFolderPathW')(hwnd, csidl, hToken, dwFlags, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shgetidlistfromobject
  public static SHGetIDListFromObject(punk: LPVOID, ppidl: LPVOID): HRESULT {
    return Shell32.Load('SHGetIDListFromObject')(punk, ppidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgeticonoverlayindexa
  public static SHGetIconOverlayIndexA(pszIconPath: LPCSTR | NULL, iIconIndex: INT): INT {
    return Shell32.Load('SHGetIconOverlayIndexA')(pszIconPath, iIconIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgeticonoverlayindexw
  public static SHGetIconOverlayIndexW(pszIconPath: LPCWSTR | NULL, iIconIndex: INT): INT {
    return Shell32.Load('SHGetIconOverlayIndexW')(pszIconPath, iIconIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shgetimagelist
  public static SHGetImageList(iImageList: INT, riid: LPVOID, ppvObj: LPVOID): HRESULT {
    return Shell32.Load('SHGetImageList')(iImageList, riid, ppvObj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetinstanceexplorer
  public static SHGetInstanceExplorer(ppunk: LPVOID): HRESULT {
    return Shell32.Load('SHGetInstanceExplorer')(ppunk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shgetitemfromdataobject
  public static SHGetItemFromDataObject(pdtobj: LPVOID, dwFlags: DWORD, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHGetItemFromDataObject')(pdtobj, dwFlags, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shgetitemfromobject
  public static SHGetItemFromObject(punk: LPVOID, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHGetItemFromObject')(punk, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetknownfolderidlist
  public static SHGetKnownFolderIDList(rfid: LPVOID, dwFlags: DWORD, hToken: HANDLE | 0n, ppidl: LPVOID): HRESULT {
    return Shell32.Load('SHGetKnownFolderIDList')(rfid, dwFlags, hToken, ppidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetknownfolderitem
  public static SHGetKnownFolderItem(rfid: LPVOID, flags: DWORD, hToken: HANDLE | 0n, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHGetKnownFolderItem')(rfid, flags, hToken, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetknownfolderpath
  public static SHGetKnownFolderPath(rfid: LPVOID, dwFlags: DWORD, hToken: HANDLE | 0n, ppszPath: LPVOID): HRESULT {
    return Shell32.Load('SHGetKnownFolderPath')(rfid, dwFlags, hToken, ppszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shgetlocalizedname
  public static SHGetLocalizedName(pszPath: LPCWSTR, pszResModule: LPWSTR, cch: UINT, pidsRes: LPVOID): HRESULT {
    return Shell32.Load('SHGetLocalizedName')(pszPath, pszResModule, cch, pidsRes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetmalloc
  public static SHGetMalloc(ppMalloc: LPVOID): HRESULT {
    return Shell32.Load('SHGetMalloc')(ppMalloc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shgetnamefromidlist
  public static SHGetNameFromIDList(pidl: PCIDLIST_ABSOLUTE, sigdnName: SIGDN, ppszName: LPVOID): HRESULT {
    return Shell32.Load('SHGetNameFromIDList')(pidl, sigdnName, ppszName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shgetnewlinkinfoa
  public static SHGetNewLinkInfo(pszLinkTo: LPCSTR, pszDir: LPCSTR, pszName: LPSTR, pfMustCopy: LPVOID, uFlags: UINT): BOOL {
    return Shell32.Load('SHGetNewLinkInfo')(pszLinkTo, pszDir, pszName, pfMustCopy, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shgetnewlinkinfoa
  public static SHGetNewLinkInfoA(pszLinkTo: LPCSTR, pszDir: LPCSTR, pszName: LPSTR, pfMustCopy: LPVOID, uFlags: UINT): BOOL {
    return Shell32.Load('SHGetNewLinkInfoA')(pszLinkTo, pszDir, pszName, pfMustCopy, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shgetnewlinkinfow
  public static SHGetNewLinkInfoW(pszLinkTo: LPCWSTR, pszDir: LPCWSTR, pszName: LPWSTR, pfMustCopy: LPVOID, uFlags: UINT): BOOL {
    return Shell32.Load('SHGetNewLinkInfoW')(pszLinkTo, pszDir, pszName, pfMustCopy, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetpathfromidlista
  public static SHGetPathFromIDList(pidl: PCIDLIST_ABSOLUTE, pszPath: LPSTR): BOOL {
    return Shell32.Load('SHGetPathFromIDList')(pidl, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetpathfromidlista
  public static SHGetPathFromIDListA(pidl: PCIDLIST_ABSOLUTE, pszPath: LPSTR): BOOL {
    return Shell32.Load('SHGetPathFromIDListA')(pidl, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetpathfromidlistex
  public static SHGetPathFromIDListEx(pidl: PCIDLIST_ABSOLUTE, pszPath: LPWSTR, cchPath: DWORD, uOpts: DWORD): BOOL {
    return Shell32.Load('SHGetPathFromIDListEx')(pidl, pszPath, cchPath, uOpts);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetpathfromidlistw
  public static SHGetPathFromIDListW(pidl: PCIDLIST_ABSOLUTE, pszPath: LPWSTR): BOOL {
    return Shell32.Load('SHGetPathFromIDListW')(pidl, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shgetpropertystoreforwindow
  public static SHGetPropertyStoreForWindow(hwnd: HWND, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHGetPropertyStoreForWindow')(hwnd, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shgetpropertystorefromidlist
  public static SHGetPropertyStoreFromIDList(pidl: PCIDLIST_ABSOLUTE, flags: GETPROPERTYSTOREFLAGS, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHGetPropertyStoreFromIDList')(pidl, flags, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shgetpropertystorefromparsingname
  public static SHGetPropertyStoreFromParsingName(pszPath: LPCWSTR, pbc: LPVOID | NULL, flags: GETPROPERTYSTOREFLAGS, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('SHGetPropertyStoreFromParsingName')(pszPath, pbc, flags, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetrealidl
  public static SHGetRealIDL(psf: LPVOID, pidlSimple: PCUITEMID_CHILD, ppidlReal: LPVOID): HRESULT {
    return Shell32.Load('SHGetRealIDL')(psf, pidlSimple, ppidlReal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj/nf-shlobj-shgetsetfoldercustomsettings
  public static SHGetSetFolderCustomSettings(pfcs: LPSHFOLDERCUSTOMSETTINGS, pszPath: LPCWSTR, dwReadWrite: DWORD): HRESULT {
    return Shell32.Load('SHGetSetFolderCustomSettings')(pfcs, pszPath, dwReadWrite);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetsetsettings
  public static SHGetSetSettings(lpss: LPSHELLSTATE, dwMask: DWORD, bSet: BOOL): void {
    return Shell32.Load('SHGetSetSettings')(lpss, dwMask, bSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetsettings
  public static SHGetSettings(lpsfs: LPSHELLFLAGSTATE, dwMask: DWORD): void {
    return Shell32.Load('SHGetSettings')(lpsfs, dwMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetspecialfolderlocation
  public static SHGetSpecialFolderLocation(hwnd: HWND | 0n, csidl: INT, ppidl: LPVOID): HRESULT {
    return Shell32.Load('SHGetSpecialFolderLocation')(hwnd, csidl, ppidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetspecialfolderpatha
  public static SHGetSpecialFolderPathA(hwnd: HWND | 0n, pszPath: LPSTR, csidl: INT, fCreate: BOOL): BOOL {
    return Shell32.Load('SHGetSpecialFolderPathA')(hwnd, pszPath, csidl, fCreate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shgetspecialfolderpathw
  public static SHGetSpecialFolderPathW(hwnd: HWND | 0n, pszPath: LPWSTR, csidl: INT, fCreate: BOOL): BOOL {
    return Shell32.Load('SHGetSpecialFolderPathW')(hwnd, pszPath, csidl, fCreate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shgetstockiconinfo
  public static SHGetStockIconInfo(siid: UINT, uFlags: UINT, psii: LPSHSTOCKICONINFO): HRESULT {
    return Shell32.Load('SHGetStockIconInfo')(siid, uFlags, psii);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shgettemporarypropertyforitem
  public static SHGetTemporaryPropertyForItem(psi: LPVOID, propkey: LPVOID, ppropvar: LPVOID): HRESULT {
    return Shell32.Load('SHGetTemporaryPropertyForItem')(psi, propkey, ppropvar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shgetunreadmailcountw
  public static SHGetUnreadMailCountW(hKeyUser: HKEY | 0n, pszMailAddress: LPCWSTR | NULL, pdwCount: LPDWORD | NULL, pFileTime: LPVOID | NULL, pszShellExecuteCommand: LPWSTR | NULL, cchShellExecuteCommand: INT): HRESULT {
    return Shell32.Load('SHGetUnreadMailCountW')(hKeyUser, pszMailAddress, pdwCount, pFileTime, pszShellExecuteCommand, cchShellExecuteCommand);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shhandleupdateimage
  public static SHHandleUpdateImage(pidlExtra: PCIDLIST_ABSOLUTE): INT {
    return Shell32.Load('SHHandleUpdateImage')(pidlExtra);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shilcreatefrompath
  public static SHILCreateFromPath(pszPath: LPCWSTR, ppidl: LPVOID, rgfInOut: LPDWORD | NULL): HRESULT {
    return Shell32.Load('SHILCreateFromPath')(pszPath, ppidl, rgfInOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shinvokeprintercommanda
  public static SHInvokePrinterCommandA(hwnd: HWND | 0n, uAction: UINT, lpBuf1: LPCSTR, lpBuf2: LPCSTR | NULL, fModal: BOOL): BOOL {
    return Shell32.Load('SHInvokePrinterCommandA')(hwnd, uAction, lpBuf1, lpBuf2, fModal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shinvokeprintercommandw
  public static SHInvokePrinterCommandW(hwnd: HWND | 0n, uAction: UINT, lpBuf1: LPCWSTR, lpBuf2: LPCWSTR | NULL, fModal: BOOL): BOOL {
    return Shell32.Load('SHInvokePrinterCommandW')(hwnd, uAction, lpBuf1, lpBuf2, fModal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shisfileavailableoffline
  public static SHIsFileAvailableOffline(pwszPath: LPCWSTR, pdwStatus: LPDWORD | NULL): HRESULT {
    return Shell32.Load('SHIsFileAvailableOffline')(pwszPath, pdwStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shlimitinputedit
  public static SHLimitInputEdit(hwndEdit: HWND, psf: LPVOID): HRESULT {
    return Shell32.Load('SHLimitInputEdit')(hwndEdit, psf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shloadinproc
  public static SHLoadInProc(rclsid: LPVOID): HRESULT {
    return Shell32.Load('SHLoadInProc')(rclsid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shloadnonloadediconoverlayidentifiers
  public static SHLoadNonloadedIconOverlayIdentifiers(): HRESULT {
    return Shell32.Load('SHLoadNonloadedIconOverlayIdentifiers')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shmappidltosystemiconlistindex
  public static SHMapPIDLToSystemImageListIndex(pshf: LPVOID, pidl: PCUITEMID_CHILD, piIndexSel: LPVOID | NULL): INT {
    return Shell32.Load('SHMapPIDLToSystemImageListIndex')(pshf, pidl, piIndexSel);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj/nf-shlobj-shmultifileproperties
  public static SHMultiFileProperties(pdtobj: LPVOID, dwFlags: DWORD): HRESULT {
    return Shell32.Load('SHMultiFileProperties')(pdtobj, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shobjectproperties
  public static SHObjectProperties(hwnd: HWND | 0n, shopObjectType: DWORD, pszObjectName: LPCWSTR, pszPropertyPage: LPCWSTR | NULL): BOOL {
    return Shell32.Load('SHObjectProperties')(hwnd, shopObjectType, pszObjectName, pszPropertyPage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shopenfolderandselectitems
  public static SHOpenFolderAndSelectItems(pidlFolder: PCIDLIST_ABSOLUTE, cidl: UINT, apidl: PCUITEMID_CHILD_ARRAY | NULL, dwFlags: DWORD): HRESULT {
    return Shell32.Load('SHOpenFolderAndSelectItems')(pidlFolder, cidl, apidl, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj/nf-shlobj-shopenpropsheetw
  public static SHOpenPropSheetW(pszCaption: LPCWSTR | NULL, ahkeys: LPVOID, ckeys: UINT, pclsidDefault: LPVOID | NULL, pdtobj: LPVOID, psb: LPVOID | NULL, pszStartPage: LPCWSTR | NULL): BOOL {
    return Shell32.Load('SHOpenPropSheetW')(pszCaption, ahkeys, ckeys, pclsidDefault, pdtobj, psb, pszStartPage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shopenwithdialog
  public static SHOpenWithDialog(hwndParent: HWND | 0n, poainfo: POPENASINFO): HRESULT {
    return Shell32.Load('SHOpenWithDialog')(hwndParent, poainfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shparsedisplayname
  public static SHParseDisplayName(pszName: LPCWSTR, pbc: LPVOID | NULL, ppidl: LPVOID, sfgaoIn: SFGAOF, psfgaoOut: LPVOID | NULL): HRESULT {
    return Shell32.Load('SHParseDisplayName')(pszName, pbc, ppidl, sfgaoIn, psfgaoOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shpathprepareforwritea
  public static SHPathPrepareForWriteA(hwnd: HWND | 0n, punkEnableModless: LPVOID | NULL, pszPath: LPCSTR, dwFlags: DWORD): HRESULT {
    return Shell32.Load('SHPathPrepareForWriteA')(hwnd, punkEnableModless, pszPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shpathprepareforwritew
  public static SHPathPrepareForWriteW(hwnd: HWND | 0n, punkEnableModless: LPVOID | NULL, pszPath: LPCWSTR, dwFlags: DWORD): HRESULT {
    return Shell32.Load('SHPathPrepareForWriteW')(hwnd, punkEnableModless, pszPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shpropstgcreate
  public static SHPropStgCreate(psstg: LPVOID, fmtid: LPVOID, pclsid: LPVOID | NULL, grfFlags: DWORD, grfMode: DWORD, dwDisposition: DWORD, ppstg: LPVOID, puCodePage: LPVOID | NULL): HRESULT {
    return Shell32.Load('SHPropStgCreate')(psstg, fmtid, pclsid, grfFlags, grfMode, dwDisposition, ppstg, puCodePage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shpropstgreadmultiple
  public static SHPropStgReadMultiple(pps: LPVOID, uCodePage: UINT, cpspec: ULONG, rgpspec: LPVOID, rgvar: LPVOID): HRESULT {
    return Shell32.Load('SHPropStgReadMultiple')(pps, uCodePage, cpspec, rgpspec, rgvar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shpropstgwritemultiple
  public static SHPropStgWriteMultiple(pps: LPVOID, puCodePage: LPVOID | NULL, cpspec: ULONG, rgpspec: LPVOID, rgvar: LPVOID, propidNameFirst: UINT): HRESULT {
    return Shell32.Load('SHPropStgWriteMultiple')(pps, puCodePage, cpspec, rgpspec, rgvar, propidNameFirst);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shqueryrecyclebina
  public static SHQueryRecycleBinA(pszRootPath: LPCSTR | NULL, pSHQueryRBInfo: PSHQUERYRBINFO): HRESULT {
    return Shell32.Load('SHQueryRecycleBinA')(pszRootPath, pSHQueryRBInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shqueryrecyclebinw
  public static SHQueryRecycleBinW(pszRootPath: LPCWSTR | NULL, pSHQueryRBInfo: PSHQUERYRBINFO): HRESULT {
    return Shell32.Load('SHQueryRecycleBinW')(pszRootPath, pSHQueryRBInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shqueryusernotificationstate
  public static SHQueryUserNotificationState(pquns: LPVOID): HRESULT {
    return Shell32.Load('SHQueryUserNotificationState')(pquns);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shremovelocalizedname
  public static SHRemoveLocalizedName(pszPath: LPCWSTR): HRESULT {
    return Shell32.Load('SHRemoveLocalizedName')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj/nf-shlobj-shreplacefromPropSheetextarray
  public static SHReplaceFromPropSheetExtArray(hpsxa: HPSXA, uPageID: UINT, lpfnReplaceWith: LPFNADDPROPSHEETPAGE, lParam: LPARAM): UINT {
    return Shell32.Load('SHReplaceFromPropSheetExtArray')(hpsxa, uPageID, lpfnReplaceWith, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shresolvelibrary
  public static SHResolveLibrary(psiLibrary: LPVOID): HRESULT {
    return Shell32.Load('SHResolveLibrary')(psiLibrary);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shrestricted
  public static SHRestricted(rest: DWORD): DWORD {
    return Shell32.Load('SHRestricted')(rest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl/nf-shobjidl-shsetdefaultproperties
  public static SHSetDefaultProperties(hwnd: HWND | 0n, psi: LPVOID, dwFileOpFlags: DWORD, pfops: LPVOID | NULL): HRESULT {
    return Shell32.Load('SHSetDefaultProperties')(hwnd, psi, dwFileOpFlags, pfops);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shsetfolderpatha
  public static SHSetFolderPathA(csidl: INT, hToken: HANDLE | 0n, dwFlags: DWORD, pszPath: LPCSTR): HRESULT {
    return Shell32.Load('SHSetFolderPathA')(csidl, hToken, dwFlags, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shsetfolderpathw
  public static SHSetFolderPathW(csidl: INT, hToken: HANDLE | 0n, dwFlags: DWORD, pszPath: LPCWSTR): HRESULT {
    return Shell32.Load('SHSetFolderPathW')(csidl, hToken, dwFlags, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shsetinstanceexplorer
  public static SHSetInstanceExplorer(punk: LPVOID): void {
    return Shell32.Load('SHSetInstanceExplorer')(punk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shsetknownfolderpath
  public static SHSetKnownFolderPath(rfid: LPVOID, dwFlags: DWORD, hToken: HANDLE | 0n, pszPath: LPCWSTR): HRESULT {
    return Shell32.Load('SHSetKnownFolderPath')(rfid, dwFlags, hToken, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shsetlocalizedname
  public static SHSetLocalizedName(pszPath: LPCWSTR, pszResModule: LPCWSTR, idsRes: INT): HRESULT {
    return Shell32.Load('SHSetLocalizedName')(pszPath, pszResModule, idsRes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-shsettemporarypropertyforitem
  public static SHSetTemporaryPropertyForItem(psi: LPVOID, propkey: LPVOID, propvar: LPVOID): HRESULT {
    return Shell32.Load('SHSetTemporaryPropertyForItem')(psi, propkey, propvar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shsetunreadmailcountw
  public static SHSetUnreadMailCountW(pszMailAddress: LPCWSTR, dwCount: DWORD, pszShellExecuteCommand: LPCWSTR): HRESULT {
    return Shell32.Load('SHSetUnreadMailCountW')(pszMailAddress, dwCount, pszShellExecuteCommand);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shshellfolderview_message
  public static SHShellFolderView_Message(hwndMain: HWND, uMsg: UINT, lParam: LPARAM): LRESULT {
    return Shell32.Load('SHShellFolderView_Message')(hwndMain, uMsg, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl/nf-shobjidl-shshowmanagelibraryui
  public static SHShowManageLibraryUI(psiLibrary: LPVOID, hwndOwner: HWND | 0n, pszTitle: LPCWSTR | NULL, pszInstruction: LPCWSTR | NULL, lmdOptions: DWORD): HRESULT {
    return Shell32.Load('SHShowManageLibraryUI')(psiLibrary, hwndOwner, pszTitle, pszInstruction, lmdOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shsimpleidlistfrompath
  public static SHSimpleIDListFromPath(pszPath: LPCWSTR): PIDLIST_ABSOLUTE {
    return Shell32.Load('SHSimpleIDListFromPath')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shstartnetconnectiondialogw
  public static SHStartNetConnectionDialogW(hwnd: HWND | 0n, pszRemoteName: LPCWSTR, dwType: DWORD): HRESULT {
    return Shell32.Load('SHStartNetConnectionDialogW')(hwnd, pszRemoteName, dwType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj/nf-shlobj-shtesttokenmembership
  public static SHTestTokenMembership(hToken: HANDLE | 0n, ulRID: ULONG): BOOL {
    return Shell32.Load('SHTestTokenMembership')(hToken, ulRID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shupdateimagea
  public static SHUpdateImageA(pszHashItem: LPCSTR, iIndex: INT, uFlags: UINT, iImageIndex: INT): void {
    return Shell32.Load('SHUpdateImageA')(pszHashItem, iIndex, uFlags, iImageIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shupdateimagew
  public static SHUpdateImageW(pszHashItem: LPCWSTR, iIndex: INT, uFlags: UINT, iImageIndex: INT): void {
    return Shell32.Load('SHUpdateImageW')(pszHashItem, iIndex, uFlags, iImageIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shupdaterecyclebinicon
  public static SHUpdateRecycleBinIcon(): void {
    return Shell32.Load('SHUpdateRecycleBinIcon')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shvalidateunc
  public static SHValidateUNC(hwndOwner: HWND | 0n, pszFile: LPWSTR, fConnect: UINT): BOOL {
    return Shell32.Load('SHValidateUNC')(hwndOwner, pszFile, fConnect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-setcurrentprocessexplicitappusermodelid
  public static SetCurrentProcessExplicitAppUserModelID(AppID: LPCWSTR): HRESULT {
    return Shell32.Load('SetCurrentProcessExplicitAppUserModelID')(AppID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shellobouta
  public static ShellAboutA(hWnd: HWND | 0n, szApp: LPCSTR, szOtherStuff: LPCSTR | NULL, hIcon: HICON | 0n): INT_PTR {
    return Shell32.Load('ShellAboutA')(hWnd, szApp, szOtherStuff, hIcon);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shelloboutw
  public static ShellAboutW(hWnd: HWND | 0n, szApp: LPCWSTR, szOtherStuff: LPCWSTR | NULL, hIcon: HICON | 0n): INT_PTR {
    return Shell32.Load('ShellAboutW')(hWnd, szApp, szOtherStuff, hIcon);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shellexecutea
  public static ShellExecuteA(hwnd: HWND | 0n, lpOperation: LPCSTR | NULL, lpFile: LPCSTR, lpParameters: LPCSTR | NULL, lpDirectory: LPCSTR | NULL, nShowCmd: INT): HINSTANCE {
    return Shell32.Load('ShellExecuteA')(hwnd, lpOperation, lpFile, lpParameters, lpDirectory, nShowCmd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shellexecuteexa
  public static ShellExecuteEx(pExecInfo: LPSHELLEXECUTEINFOA): BOOL {
    return Shell32.Load('ShellExecuteEx')(pExecInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shellexecuteexa
  public static ShellExecuteExA(pExecInfo: LPSHELLEXECUTEINFOA): BOOL {
    return Shell32.Load('ShellExecuteExA')(pExecInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shellexecuteexw
  public static ShellExecuteExW(pExecInfo: LPSHELLEXECUTEINFOW): BOOL {
    return Shell32.Load('ShellExecuteExW')(pExecInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shellexecutew
  public static ShellExecuteW(hwnd: HWND | 0n, lpOperation: LPCWSTR | NULL, lpFile: LPCWSTR, lpParameters: LPCWSTR | NULL, lpDirectory: LPCWSTR | NULL, nShowCmd: INT): HINSTANCE {
    return Shell32.Load('ShellExecuteW')(hwnd, lpOperation, lpFile, lpParameters, lpDirectory, nShowCmd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shell_getimagelists
  public static Shell_GetImageLists(phiml: LPVOID, phimlSmall: LPVOID): BOOL {
    return Shell32.Load('Shell_GetImageLists')(phiml, phimlSmall);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shell_mergemenus
  public static Shell_MergeMenus(hmDst: HMENU, hmSrc: HMENU, uInsert: UINT, uIDAdjust: UINT, uIDAdjustMax: UINT, uFlags: ULONG): UINT {
    return Shell32.Load('Shell_MergeMenus')(hmDst, hmSrc, uInsert, uIDAdjust, uIDAdjustMax, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shell_notifyicona
  public static Shell_NotifyIcon(dwMessage: DWORD, lpData: PNOTIFYICONDATAA): BOOL {
    return Shell32.Load('Shell_NotifyIcon')(dwMessage, lpData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shell_notifyicona
  public static Shell_NotifyIconA(dwMessage: DWORD, lpData: PNOTIFYICONDATAA): BOOL {
    return Shell32.Load('Shell_NotifyIconA')(dwMessage, lpData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shell_notifyicongetrect
  public static Shell_NotifyIconGetRect(identifier: PNOTIFYICONIDENTIFIER, iconLocation: LPRECT): HRESULT {
    return Shell32.Load('Shell_NotifyIconGetRect')(identifier, iconLocation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shell_notifyiconw
  public static Shell_NotifyIconW(dwMessage: DWORD, lpData: PNOTIFYICONDATAW): BOOL {
    return Shell32.Load('Shell_NotifyIconW')(dwMessage, lpData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-signalfileopen
  public static SignalFileOpen(pidl: PCIDLIST_ABSOLUTE): BOOL {
    return Shell32.Load('SignalFileOpen')(pidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl/nf-shobjidl-stgmakeuniquename
  public static StgMakeUniqueName(pstgParent: LPVOID, pszFileSpec: LPCWSTR, grfMode: DWORD, riid: LPVOID, ppv: LPVOID): HRESULT {
    return Shell32.Load('StgMakeUniqueName')(pstgParent, pszFileSpec, grfMode, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strchra
  public static StrChrA(pszStart: LPCSTR, wMatch: WORD): LPSTR {
    return Shell32.Load('StrChrA')(pszStart, wMatch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strchria
  public static StrChrIA(pszStart: LPCSTR, wMatch: WORD): LPSTR {
    return Shell32.Load('StrChrIA')(pszStart, wMatch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strchriw
  public static StrChrIW(pszStart: LPCWSTR, wMatch: WORD): LPWSTR {
    return Shell32.Load('StrChrIW')(pszStart, wMatch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strchrw
  public static StrChrW(pszStart: LPCWSTR, wMatch: WORD): LPWSTR {
    return Shell32.Load('StrChrW')(pszStart, wMatch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcmpna
  public static StrCmpNA(psz1: LPCSTR, psz2: LPCSTR, nChar: INT): INT {
    return Shell32.Load('StrCmpNA')(psz1, psz2, nChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcmpnia
  public static StrCmpNIA(psz1: LPCSTR, psz2: LPCSTR, nChar: INT): INT {
    return Shell32.Load('StrCmpNIA')(psz1, psz2, nChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcmpniw
  public static StrCmpNIW(psz1: LPCWSTR, psz2: LPCWSTR, nChar: INT): INT {
    return Shell32.Load('StrCmpNIW')(psz1, psz2, nChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcmpnw
  public static StrCmpNW(psz1: LPCWSTR, psz2: LPCWSTR, nChar: INT): INT {
    return Shell32.Load('StrCmpNW')(psz1, psz2, nChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrchra
  public static StrRChrA(pszStart: LPCSTR, pszEnd: LPCSTR | NULL, wMatch: WORD): LPSTR {
    return Shell32.Load('StrRChrA')(pszStart, pszEnd, wMatch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrchria
  public static StrRChrIA(pszStart: LPCSTR, pszEnd: LPCSTR | NULL, wMatch: WORD): LPSTR {
    return Shell32.Load('StrRChrIA')(pszStart, pszEnd, wMatch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrchriw
  public static StrRChrIW(pszStart: LPCWSTR, pszEnd: LPCWSTR | NULL, wMatch: WORD): LPWSTR {
    return Shell32.Load('StrRChrIW')(pszStart, pszEnd, wMatch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrchrw
  public static StrRChrW(pszStart: LPCWSTR, pszEnd: LPCWSTR | NULL, wMatch: WORD): LPWSTR {
    return Shell32.Load('StrRChrW')(pszStart, pszEnd, wMatch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrstria
  public static StrRStrIA(pszSource: LPCSTR, pszLast: LPCSTR | NULL, pszSrch: LPCSTR): LPSTR {
    return Shell32.Load('StrRStrIA')(pszSource, pszLast, pszSrch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrstriw
  public static StrRStrIW(pszSource: LPCWSTR, pszLast: LPCWSTR | NULL, pszSrch: LPCWSTR): LPWSTR {
    return Shell32.Load('StrRStrIW')(pszSource, pszLast, pszSrch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strstra
  public static StrStrA(pszFirst: LPCSTR, pszSrch: LPCSTR): LPSTR {
    return Shell32.Load('StrStrA')(pszFirst, pszSrch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strstria
  public static StrStrIA(pszFirst: LPCSTR, pszSrch: LPCSTR): LPSTR {
    return Shell32.Load('StrStrIA')(pszFirst, pszSrch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strstriw
  public static StrStrIW(pszFirst: LPCWSTR, pszSrch: LPCWSTR): LPWSTR {
    return Shell32.Load('StrStrIW')(pszFirst, pszSrch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strstrw
  public static StrStrW(pszFirst: LPCWSTR, pszSrch: LPCWSTR): LPWSTR {
    return Shell32.Load('StrStrW')(pszFirst, pszSrch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-wowshellexecute
  public static WOWShellExecute(hwnd: HWND | 0n, lpOperation: LPCSTR | NULL, lpFile: LPCSTR, lpParameters: LPCSTR | NULL, lpDirectory: LPCSTR | NULL, nShowCmd: INT, lpfnCBWinExec: LPVOID): HINSTANCE {
    return Shell32.Load('WOWShellExecute')(hwnd, lpOperation, lpFile, lpParameters, lpDirectory, nShowCmd, lpfnCBWinExec);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-win32deletefile
  public static Win32DeleteFile(pszPath: LPCWSTR): BOOL {
    return Shell32.Load('Win32DeleteFile')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-writecabinetstate
  public static WriteCabinetState(pcs: PCABINETSTATE): BOOL {
    return Shell32.Load('WriteCabinetState')(pcs);
  }
}

export default Shell32;
