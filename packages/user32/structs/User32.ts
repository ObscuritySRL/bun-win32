import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  ACCESS_MASK,
  ATOM,
  BLENDFUNCTION,
  BOOL,
  BYTE,
  COLORREF,
  DESKTOPENUMPROCW,
  DEVMODEW,
  DIALOG_CONTROL_DPI_CHANGE_BEHAVIORS,
  DIALOG_DPI_CHANGE_BEHAVIORS,
  DISPLAYCONFIG_DEVICE_INFO_HEADER,
  DISPLAYCONFIG_MODE_INFO,
  DISPLAYCONFIG_PATH_INFO,
  DISPLAYCONFIG_TOPOLOGY_ID,
  DLGPROC,
  DPI_AWARENESS,
  DPI_AWARENESS_CONTEXT,
  DPI_HOSTING_BEHAVIOR,
  DRAWSTATEPROC,
  DWORD,
  FEEDBACK_TYPE,
  GRAYSTRINGPROC,
  HACCEL,
  HANDLE,
  HBITMAP,
  HBRUSH,
  HCONV,
  HCONVLIST,
  HCURSOR,
  HDC,
  HDDEDATA,
  HDESK,
  HDEVNOTIFY,
  HDWP,
  HGESTUREINFO,
  HHOOK,
  HICON,
  HINSTANCE,
  HKL,
  HMENU,
  HMODULE,
  HMONITOR,
  HOOKPROC,
  HPOWERNOTIFY,
  HRAWINPUT,
  HRGN,
  HSYNTHETICPOINTERDEVICE,
  HSZ,
  HTOUCHINPUT,
  HWINEVENTHOOK,
  HWINSTA,
  HWND,
  INPUT_MESSAGE_SOURCE,
  INPUT_TRANSFORM,
  int,
  INT_PTR,
  LONG,
  LONG_PTR,
  LPACCEL,
  LPARAM,
  LPBYTE,
  LPCDLGTEMPLATEW,
  LPCGUID,
  LPCMENUINFO,
  LPCMENUITEMINFOW,
  LPCRECT,
  LPCSCROLLINFO,
  LPCSTR,
  LPCWSTR,
  LPDRAWTEXTPARAMS,
  LPDWORD,
  LPINPUT,
  LPINT,
  LPMENUINFO,
  LPMENUITEMINFOW,
  LPMONITORINFO,
  LPMOUSEMOVEPOINT,
  LPMSG,
  LPPAINTSTRUCT,
  LPPOINT,
  LPRECT,
  LPSCROLLINFO,
  LPSECURITY_ATTRIBUTES,
  LPSTR,
  LPTPMPARAMS,
  LPTRACKMOUSEEVENT,
  LPVOID,
  LPWNDCLASSEXW,
  LPWNDCLASSW,
  LPWORD,
  LPWSTR,
  LRESULT,
  PACKED_POINT,
  MENUTEMPLATEW,
  MONITORENUMPROC,
  MSGBOXPARAMSW,
  NULL,
  ORIENTATION_PREFERENCE,
  PORIENTATION_PREFERENCE,
  PAINTSTRUCT,
  PALTTABINFO,
  PAR_STATE,
  PBSMINFO,
  PBYTE,
  PCHANGEFILTERSTRUCT,
  PCOMBOBOXINFO,
  PCONVCONTEXT,
  PCONVINFO,
  PCRAWINPUTDEVICE,
  PCURSORINFO,
  PDISPLAY_DEVICEW,
  PDWORD_PTR,
  PFLASHWINFO,
  PFNCALLBACK,
  PGESTURECONFIG,
  PGESTUREINFO,
  PGUITHREADINFO,
  PICONINFO,
  PICONINFOEXW,
  PLASTINPUTINFO,
  PMENUBARINFO,
  POINTER_DEVICE_CURSOR_INFO,
  POINTER_DEVICE_INFO,
  POINTER_DEVICE_PROPERTY,
  POINTER_FEEDBACK_MODE,
  POINTER_INFO,
  POINTER_INPUT_TYPE,
  POINTER_PEN_INFO,
  POINTER_TOUCH_INFO,
  POINTER_TYPE_INFO,
  PRAWINPUT,
  PRAWINPUTDEVICE,
  PRAWINPUTDEVICELIST,
  PROPENUMPROCA,
  PROPENUMPROCEXA,
  PROPENUMPROCEXW,
  PROPENUMPROCW,
  PSCROLLBARINFO,
  PSECURITY_DESCRIPTOR,
  PSECURITY_INFORMATION,
  PTITLEBARINFO,
  PTOUCHINPUT,
  PUINT,
  PUINT_PTR,
  PULONG,
  PVOID,
  PWINDOWINFO,
  SENDASYNCPROC,
  SHORT,
  SIZE,
  TIMERPROC,
  TOUCH_HIT_TESTING_INPUT,
  TOUCH_HIT_TESTING_PROXIMITY_EVALUATION,
  UINT,
  UINT32,
  UINT_PTR,
  ULONG,
  ULONG_PTR,
  VOID,
  WCHAR,
  WINDOWPLACEMENT,
  WINEVENTPROC,
  WINSTAENUMPROCW,
  WNDCLASSEXW,
  WNDCLASSW,
  WNDENUMPROC,
  WNDPROC,
  WORD,
  WPARAM,
} from '../types/User32';

/**
 * Thin, lazy-loaded FFI bindings for `user32.dll`.
 *
 * Each static method corresponds one-to-one with a Win32 export declared in `Symbols`.
 * On first access, the method is bound via `bun:ffi` and memoized on the class.
 * For bulk, up-front binding, use `Preload()`.
 *
 * Symbols are declared with precise `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * @example
 * ```ts
 * import User32 from './structs/User32';
 *
 * // Lazy: binds on first call
 * const desktop = User32.GetDesktopWindow();
 *
 * // Or preload a subset/all to avoid per-symbol lazy binding cost
 * User32.Preload(['GetDesktopWindow', 'GetForegroundWindow']);
 * ```
 */
class User32 extends Win32 {
  protected static override name = 'user32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    ActivateKeyboardLayout: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    AddClipboardFormatListener: { args: [FFIType.u64], returns: FFIType.i32 },
    AdjustWindowRect: { args: [FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    AdjustWindowRectEx: { args: [FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    AdjustWindowRectExForDpi: { args: [FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    AllowSetForegroundWindow: { args: [FFIType.u32], returns: FFIType.i32 },
    AnimateWindow: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    AnyPopup: { args: [], returns: FFIType.i32 },
    AppendMenuW: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    AreDpiAwarenessContextsEqual: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ArrangeIconicWindows: { args: [FFIType.u64], returns: FFIType.u32 },
    AttachThreadInput: { args: [FFIType.u32, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    BeginDeferWindowPos: { args: [FFIType.i32], returns: FFIType.u64 },
    BeginPaint: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    BlockInput: { args: [FFIType.i32], returns: FFIType.i32 },
    BringWindowToTop: { args: [FFIType.u64], returns: FFIType.i32 },
    BroadcastSystemMessageExW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    BroadcastSystemMessageW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i32 },
    CalculatePopupWindowPosition: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CallMsgFilterW: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    CallNextHookEx: { args: [FFIType.u64, FFIType.i32, FFIType.u64, FFIType.i64], returns: FFIType.i64 },
    CallWindowProcW: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i64 },
    CascadeWindows: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u16 },
    ChangeClipboardChain: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    ChangeDisplaySettingsExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ChangeDisplaySettingsW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    ChangeMenuW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    ChangeWindowMessageFilter: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    ChangeWindowMessageFilterEx: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CharLowerBuffW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CharLowerW: { args: [FFIType.ptr], returns: FFIType.ptr },
    CharNextW: { args: [FFIType.ptr], returns: FFIType.ptr },
    CharPrevW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CharToOemBuffW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CharToOemW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CharUpperBuffW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CharUpperW: { args: [FFIType.ptr], returns: FFIType.ptr },
    CheckDlgButton: { args: [FFIType.u64, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    CheckMenuItem: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CheckMenuRadioItem: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    CheckRadioButton: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    ChildWindowFromPoint: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    ChildWindowFromPointEx: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    ClientToScreen: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ClipCursor: { args: [FFIType.ptr], returns: FFIType.i32 },
    CloseClipboard: { args: [], returns: FFIType.i32 },
    CloseDesktop: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseGestureInfoHandle: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseTouchInputHandle: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseWindow: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseWindowStation: { args: [FFIType.u64], returns: FFIType.i32 },
    CopyAcceleratorTableW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    CopyIcon: { args: [FFIType.u64], returns: FFIType.u64 },
    CopyImage: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    CopyRect: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CountClipboardFormats: { args: [], returns: FFIType.i32 },
    CreateAcceleratorTableW: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    CreateCaret: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    CreateCursor: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateDesktopExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateDesktopW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateDialogIndirectParamW: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.i64], returns: FFIType.u64 },
    CreateDialogParamW: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.i64], returns: FFIType.u64 },
    CreateIcon: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u8, FFIType.u8, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateIconFromResource: { args: [FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    CreateIconFromResourceEx: { args: [FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    CreateIconIndirect: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreateMDIWindowW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.u64, FFIType.i64], returns: FFIType.u64 },
    CreateMenu: { args: [], returns: FFIType.u64 },
    CreatePopupMenu: { args: [], returns: FFIType.u64 },
    CreateSyntheticPointerDevice: { args: [FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    CreateWindowExW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    CreateWindowInBand: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    CreateWindowInBandEx: {
      args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32],
      returns: FFIType.u64,
    },
    CreateWindowStationW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    DdeAbandonTransaction: { args: [FFIType.u32, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    DdeAccessData: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    DdeClientTransaction: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    DdeCmpStringHandles: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    DdeConnect: { args: [FFIType.u32, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    DdeConnectList: { args: [FFIType.u32, FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    DdeCreateDataHandle: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    DdeCreateStringHandleW: { args: [FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    DdeDisconnect: { args: [FFIType.u64], returns: FFIType.i32 },
    DdeDisconnectList: { args: [FFIType.u64], returns: FFIType.i32 },
    DdeEnableCallback: { args: [FFIType.u32, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    DdeFreeDataHandle: { args: [FFIType.u64], returns: FFIType.i32 },
    DdeFreeStringHandle: { args: [FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    DdeGetData: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    DdeGetLastError: { args: [FFIType.u32], returns: FFIType.u32 },
    DdeImpersonateClient: { args: [FFIType.u64], returns: FFIType.i32 },
    DdeInitializeW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    DdeKeepStringHandle: { args: [FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    DdeQueryConvInfo: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DdeQueryNextServer: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    DdeQueryStringW: { args: [FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    DdeUnaccessData: { args: [FFIType.u64], returns: FFIType.i32 },
    DdeUninitialize: { args: [FFIType.u32], returns: FFIType.i32 },
    DefDlgProcW: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i64 },
    DeferWindowPos: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    DefFrameProcW: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i64 },
    DefMDIChildProcW: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i64 },
    DefRawInputProc: { args: [FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.i64 },
    DefWindowProcW: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i64 },
    DeleteMenu: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    DeregisterShellHookWindow: { args: [FFIType.u64], returns: FFIType.i32 },
    DestroyAcceleratorTable: { args: [FFIType.u64], returns: FFIType.i32 },
    DestroyCaret: { args: [], returns: FFIType.i32 },
    DestroyCursor: { args: [FFIType.u64], returns: FFIType.i32 },
    DestroyIcon: { args: [FFIType.u64], returns: FFIType.i32 },
    DestroyMenu: { args: [FFIType.u64], returns: FFIType.i32 },
    DestroySyntheticPointerDevice: { args: [FFIType.u64], returns: FFIType.void },
    DestroyWindow: { args: [FFIType.u64], returns: FFIType.i32 },
    DialogBoxIndirectParamW: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.i64], returns: FFIType.i64 },
    DialogBoxParamW: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.i64], returns: FFIType.i64 },
    DisableProcessWindowsGhosting: { args: [], returns: FFIType.void },
    DispatchMessageW: { args: [FFIType.ptr], returns: FFIType.i64 },
    DisplayConfigGetDeviceInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    DisplayConfigSetDeviceInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    DlgDirListComboBoxW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    DlgDirListW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    DlgDirSelectComboBoxExW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    DlgDirSelectExW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    DragDetect: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    DrawAnimatedRects: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DrawCaption: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DrawCaptionTempW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DrawEdge: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    DrawFocusRect: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DrawFrameControl: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    DrawIcon: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    DrawIconEx: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    DrawMenuBar: { args: [FFIType.u64], returns: FFIType.i32 },
    DrawStateW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    DrawTextExW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    DrawTextW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    EmptyClipboard: { args: [], returns: FFIType.i32 },
    EnableMenuItem: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    EnableMouseInPointer: { args: [FFIType.i32], returns: FFIType.i32 },
    EnableNonClientDpiScaling: { args: [FFIType.u64], returns: FFIType.i32 },
    EnableScrollBar: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    EnableWindow: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    EndDeferWindowPos: { args: [FFIType.u64], returns: FFIType.i32 },
    EndDialog: { args: [FFIType.u64, FFIType.i64], returns: FFIType.i32 },
    EndMenu: { args: [], returns: FFIType.i32 },
    EndPaint: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    EndTask: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    EnumChildWindows: { args: [FFIType.u64, FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
    EnumClipboardFormats: { args: [FFIType.u32], returns: FFIType.u32 },
    EnumDesktopsW: { args: [FFIType.u64, FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
    EnumDesktopWindows: { args: [FFIType.u64, FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
    EnumDisplayDevicesW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    EnumDisplayMonitors: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
    EnumDisplaySettingsExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    EnumDisplaySettingsW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    EnumPropsA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    EnumPropsExA: { args: [FFIType.u64, FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
    EnumPropsExW: { args: [FFIType.u64, FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
    EnumPropsW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    EnumThreadWindows: { args: [FFIType.u32, FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
    EnumWindows: { args: [FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
    EnumWindowStationsW: { args: [FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
    EqualRect: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EvaluateProximityToPolygon: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EvaluateProximityToRect: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ExcludeUpdateRgn: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    ExitWindowsEx: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    FillRect: { args: [FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    FindWindowExW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindWindowW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FlashWindow: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    FlashWindowEx: { args: [FFIType.ptr], returns: FFIType.i32 },
    FrameRect: { args: [FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    FreeDDElParam: { args: [FFIType.u32, FFIType.i64], returns: FFIType.i32 },
    GetActiveWindow: { args: [], returns: FFIType.u64 },
    GetAltTabInfoW: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetAncestor: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    GetAsyncKeyState: { args: [FFIType.i32], returns: FFIType.i16 },
    GetAutoRotationState: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetAwarenessFromDpiAwarenessContext: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetCapture: { args: [], returns: FFIType.u64 },
    GetCaretBlinkTime: { args: [], returns: FFIType.u32 },
    GetCaretPos: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetClassInfoExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetClassInfoW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetClassLongPtrW: { args: [FFIType.u64, FFIType.i32], returns: FFIType.u64 },
    GetClassLongW: { args: [FFIType.u64, FFIType.i32], returns: FFIType.u32 },
    GetClassNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetClassWord: { args: [FFIType.u64, FFIType.i32], returns: FFIType.u16 },
    GetClientRect: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetClipboardData: { args: [FFIType.u32], returns: FFIType.u64 },
    GetClipboardFormatNameW: { args: [FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetClipboardOwner: { args: [], returns: FFIType.u64 },
    GetClipboardSequenceNumber: { args: [], returns: FFIType.u32 },
    GetClipboardViewer: { args: [], returns: FFIType.u64 },
    GetClipCursor: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetComboBoxInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetCurrentInputMessageSource: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetCursor: { args: [], returns: FFIType.u64 },
    GetCursorInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetCursorPos: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetDC: { args: [FFIType.u64], returns: FFIType.u64 },
    GetDCEx: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    GetDesktopWindow: { args: [], returns: FFIType.u64 },
    GetDialogBaseUnits: { args: [], returns: FFIType.i32 },
    GetDialogControlDpiChangeBehavior: { args: [FFIType.u64], returns: FFIType.i32 },
    GetDialogDpiChangeBehavior: { args: [FFIType.u64], returns: FFIType.i32 },
    GetDisplayAutoRotationPreferences: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetDisplayConfigBufferSizes: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetDlgCtrlID: { args: [FFIType.u64], returns: FFIType.i32 },
    GetDlgItem: { args: [FFIType.u64, FFIType.i32], returns: FFIType.u64 },
    GetDlgItemInt: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetDlgItemTextW: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetDoubleClickTime: { args: [], returns: FFIType.u32 },
    GetDpiForSystem: { args: [], returns: FFIType.u32 },
    GetDpiForWindow: { args: [FFIType.u64], returns: FFIType.u32 },
    GetDpiFromDpiAwarenessContext: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetFocus: { args: [], returns: FFIType.u64 },
    GetForegroundWindow: { args: [], returns: FFIType.u64 },
    GetGestureConfig: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetGestureExtraArgs: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetGestureInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetGuiResources: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    GetGUIThreadInfo: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetIconInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetIconInfoExW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetInputState: { args: [], returns: FFIType.i32 },
    GetKeyboardLayout: { args: [FFIType.u32], returns: FFIType.u64 },
    GetKeyboardLayoutList: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetKeyboardLayoutNameW: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetKeyboardState: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetKeyboardType: { args: [FFIType.i32], returns: FFIType.i32 },
    GetKeyNameTextW: { args: [FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetKeyState: { args: [FFIType.i32], returns: FFIType.i16 },
    GetLastActivePopup: { args: [FFIType.u64], returns: FFIType.u64 },
    GetLastInputInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetLayeredWindowAttributes: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetListBoxInfo: { args: [FFIType.u64], returns: FFIType.u32 },
    GetMenu: { args: [FFIType.u64], returns: FFIType.u64 },
    GetMenuBarInfo: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetMenuCheckMarkDimensions: { args: [], returns: FFIType.i32 },
    GetMenuContextHelpId: { args: [FFIType.u64], returns: FFIType.u32 },
    GetMenuDefaultItem: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    GetMenuInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetMenuItemCount: { args: [FFIType.u64], returns: FFIType.i32 },
    GetMenuItemID: { args: [FFIType.u64, FFIType.i32], returns: FFIType.u32 },
    GetMenuItemInfoW: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetMenuItemRect: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetMenuState: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    GetMenuStringW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    GetMessageExtraInfo: { args: [], returns: FFIType.i64 },
    GetMessagePos: { args: [], returns: FFIType.u32 },
    GetMessageTime: { args: [], returns: FFIType.i32 },
    GetMessageW: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    GetMonitorInfoW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetMouseMovePointsEx: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    GetNextDlgGroupItem: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.u64 },
    GetNextDlgTabItem: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.u64 },
    GetOpenClipboardWindow: { args: [], returns: FFIType.u64 },
    GetParent: { args: [FFIType.u64], returns: FFIType.u64 },
    GetPhysicalCursorPos: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetPointerCursorId: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPointerDevice: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetPointerDeviceCursors: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPointerDeviceProperties: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPointerDeviceRects: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPointerDevices: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPointerFrameInfo: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPointerFrameInfoHistory: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPointerFramePenInfo: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPointerFramePenInfoHistory: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPointerFrameTimes: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPointerFrameTouchInfo: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPointerFrameTouchInfoHistory: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPointerInfo: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPointerInfoHistory: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPointerInputTransform: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPointerPenInfo: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPointerTouchInfo: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPointerType: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPriorityClipboardFormat: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetProcessDefaultLayout: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetProcessWindowStation: { args: [], returns: FFIType.u64 },
    GetPropA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    GetPropW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    GetQueueStatus: { args: [FFIType.u32], returns: FFIType.u32 },
    GetRawInputBuffer: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetRawInputData: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetRawInputDeviceInfoW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetRawInputDeviceList: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetRawPointerDeviceData: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetRegisteredRawInputDevices: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetScrollBarInfo: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetScrollInfo: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetScrollPos: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GetScrollRange: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetShellWindow: { args: [], returns: FFIType.u64 },
    GetSubMenu: { args: [FFIType.u64, FFIType.i32], returns: FFIType.u64 },
    GetSysColor: { args: [FFIType.i32], returns: FFIType.u32 },
    GetSysColorBrush: { args: [FFIType.i32], returns: FFIType.u64 },
    GetSystemDpiForProcess: { args: [FFIType.u64], returns: FFIType.u32 },
    GetSystemMenu: { args: [FFIType.u64, FFIType.i32], returns: FFIType.u64 },
    GetSystemMetrics: { args: [FFIType.i32], returns: FFIType.i32 },
    GetSystemMetricsForDpi: { args: [FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    GetTabbedTextExtentW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    GetThreadDesktop: { args: [FFIType.u32], returns: FFIType.u64 },
    GetThreadDpiAwarenessContext: { args: [], returns: FFIType.ptr },
    GetThreadDpiHostingBehavior: { args: [], returns: FFIType.i32 },
    GetTitleBarInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetTopWindow: { args: [FFIType.u64], returns: FFIType.u64 },
    GetTouchInputInfo: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetUnpredictedMessagePos: { args: [], returns: FFIType.u32 },
    GetUpdatedClipboardFormats: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetUpdateRect: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetUpdateRgn: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GetUserObjectInformationW: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetUserObjectSecurity: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetWindow: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    GetWindowBand: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetWindowCompositionAttribute: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetWindowContextHelpId: { args: [FFIType.u64], returns: FFIType.u32 },
    GetWindowDC: { args: [FFIType.u64], returns: FFIType.u64 },
    GetWindowDisplayAffinity: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetWindowDpiAwarenessContext: { args: [FFIType.u64], returns: FFIType.ptr },
    GetWindowDpiHostingBehavior: { args: [FFIType.u64], returns: FFIType.i32 },
    GetWindowFeedbackSetting: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetWindowInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetWindowLongPtrW: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i64 },
    GetWindowLongW: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GetWindowModuleFileNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetWindowPlacement: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetWindowRect: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetWindowRgn: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GetWindowRgnBox: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetWindowTextLengthW: { args: [FFIType.u64], returns: FFIType.i32 },
    GetWindowTextW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetWindowThreadProcessId: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    GetWindowWord: { args: [FFIType.u64, FFIType.i32], returns: FFIType.u16 },
    GrayStringW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    HideCaret: { args: [FFIType.u64], returns: FFIType.i32 },
    HiliteMenuItem: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    InflateRect: { args: [FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    InitializeTouchInjection: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    InjectSyntheticPointerInput: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InjectTouchInput: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InSendMessage: { args: [], returns: FFIType.i32 },
    InSendMessageEx: { args: [FFIType.ptr], returns: FFIType.u32 },
    InsertMenuItemW: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    InsertMenuW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IntersectRect: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InvalidateRect: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    InvalidateRgn: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    InvertRect: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IsCharAlphaNumericW: { args: [FFIType.u16], returns: FFIType.i32 },
    IsCharAlphaW: { args: [FFIType.u16], returns: FFIType.i32 },
    IsCharLowerW: { args: [FFIType.u16], returns: FFIType.i32 },
    IsCharUpperW: { args: [FFIType.u16], returns: FFIType.i32 },
    IsChild: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    IsClipboardFormatAvailable: { args: [FFIType.u32], returns: FFIType.i32 },
    IsDialogMessageW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IsDlgButtonChecked: { args: [FFIType.u64, FFIType.i32], returns: FFIType.u32 },
    IsGUIThread: { args: [FFIType.i32], returns: FFIType.i32 },
    IsHungAppWindow: { args: [FFIType.u64], returns: FFIType.i32 },
    IsIconic: { args: [FFIType.u64], returns: FFIType.i32 },
    IsImmersiveProcess: { args: [FFIType.u64], returns: FFIType.i32 },
    IsMenu: { args: [FFIType.u64], returns: FFIType.i32 },
    IsMouseInPointerEnabled: { args: [], returns: FFIType.i32 },
    IsProcessDPIAware: { args: [], returns: FFIType.i32 },
    IsRectEmpty: { args: [FFIType.ptr], returns: FFIType.i32 },
    IsTouchWindow: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IsValidDpiAwarenessContext: { args: [FFIType.ptr], returns: FFIType.i32 },
    IsWindow: { args: [FFIType.u64], returns: FFIType.i32 },
    IsWindowArranged: { args: [FFIType.u64], returns: FFIType.i32 },
    IsWindowEnabled: { args: [FFIType.u64], returns: FFIType.i32 },
    IsWindowRedirectedForPrint: { args: [FFIType.u64], returns: FFIType.i32 },
    IsWindowUnicode: { args: [FFIType.u64], returns: FFIType.i32 },
    IsWindowVisible: { args: [FFIType.u64], returns: FFIType.i32 },
    IsWinEventHookInstalled: { args: [FFIType.u32], returns: FFIType.i32 },
    IsWow64Message: { args: [], returns: FFIType.i32 },
    IsZoomed: { args: [FFIType.u64], returns: FFIType.i32 },
    KillTimer: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    LoadAcceleratorsW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    LoadBitmapW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    LoadCursorFromFileW: { args: [FFIType.ptr], returns: FFIType.u64 },
    LoadCursorW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    LoadIconW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    LoadImageW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    LoadKeyboardLayoutW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    LoadMenuIndirectW: { args: [FFIType.ptr], returns: FFIType.u64 },
    LoadMenuW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    LoadStringW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    LockSetForegroundWindow: { args: [FFIType.u32], returns: FFIType.i32 },
    LockWindowUpdate: { args: [FFIType.u64], returns: FFIType.i32 },
    LockWorkStation: { args: [], returns: FFIType.i32 },
    LogicalToPhysicalPoint: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    LogicalToPhysicalPointForPerMonitorDPI: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    LookupIconIdFromDirectory: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    LookupIconIdFromDirectoryEx: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    MapDialogRect: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    MapVirtualKeyExW: { args: [FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    MapVirtualKeyW: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    MapWindowPoints: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MenuItemFromPoint: { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    MessageBeep: { args: [FFIType.u32], returns: FFIType.i32 },
    MessageBoxExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u16], returns: FFIType.i32 },
    MessageBoxIndirectW: { args: [FFIType.ptr], returns: FFIType.i32 },
    MessageBoxTimeoutW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u16, FFIType.u32], returns: FFIType.i32 },
    MessageBoxW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    ModifyMenuW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    MonitorFromPoint: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    MonitorFromRect: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    MonitorFromWindow: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    MoveWindow: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    MsgWaitForMultipleObjects: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    MsgWaitForMultipleObjectsEx: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    NotifyWinEvent: { args: [FFIType.u32, FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.void },
    OemKeyScan: { args: [FFIType.u16], returns: FFIType.u32 },
    OemToCharBuffW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    OemToCharW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OffsetRect: { args: [FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    OpenClipboard: { args: [FFIType.u64], returns: FFIType.i32 },
    OpenDesktopW: { args: [FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    OpenIcon: { args: [FFIType.u64], returns: FFIType.i32 },
    OpenInputDesktop: { args: [FFIType.u32, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    OpenThreadDesktop: { args: [FFIType.u32, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    OpenWindowStationW: { args: [FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    PackDDElParam: { args: [FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.i64 },
    PaintDesktop: { args: [FFIType.u64], returns: FFIType.i32 },
    PeekMessageW: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    PhysicalToLogicalPoint: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PhysicalToLogicalPointForPerMonitorDPI: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PostMessageW: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i32 },
    PostQuitMessage: { args: [FFIType.i32], returns: FFIType.void },
    PostThreadMessageW: { args: [FFIType.u32, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i32 },
    PrintWindow: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    PrivateExtractIconsW: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    PtInRect: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    QueryDisplayConfig: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RealChildWindowFromPoint: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    RealGetWindowClassW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RedrawWindow: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    RegisterClassExW: { args: [FFIType.ptr], returns: FFIType.u16 },
    RegisterClassW: { args: [FFIType.ptr], returns: FFIType.u16 },
    RegisterClipboardFormatW: { args: [FFIType.ptr], returns: FFIType.u32 },
    RegisterDeviceNotificationW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    RegisterHotKey: { args: [FFIType.u64, FFIType.i32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    RegisterPointerDeviceNotifications: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    RegisterPointerInputTarget: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    RegisterPowerSettingNotification: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    RegisterRawInputDevices: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    RegisterShellHookWindow: { args: [FFIType.u64], returns: FFIType.i32 },
    RegisterSuspendResumeNotification: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    RegisterTouchHitTestingWindow: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    RegisterTouchWindow: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    RegisterWindowMessageW: { args: [FFIType.ptr], returns: FFIType.u32 },
    ReleaseCapture: { args: [], returns: FFIType.i32 },
    ReleaseDC: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    RemoveClipboardFormatListener: { args: [FFIType.u64], returns: FFIType.i32 },
    RemoveMenu: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    RemovePropA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    RemovePropW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    ReplyMessage: { args: [FFIType.i64], returns: FFIType.i32 },
    ReuseDDElParam: { args: [FFIType.i64, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.i64 },
    ScreenToClient: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ScrollDC: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ScrollWindow: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ScrollWindowEx: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SendDlgItemMessageW: { args: [FFIType.u64, FFIType.i32, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i64 },
    SendInput: { args: [FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    SendMessageCallbackW: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    SendMessageTimeoutW: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i64 },
    SendMessageW: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i64 },
    SendNotifyMessageW: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i32 },
    SetActiveWindow: { args: [FFIType.u64], returns: FFIType.u64 },
    SetCapture: { args: [FFIType.u64], returns: FFIType.u64 },
    SetCaretBlinkTime: { args: [FFIType.u32], returns: FFIType.i32 },
    SetCaretPos: { args: [FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SetClassLongPtrW: { args: [FFIType.u64, FFIType.i32, FFIType.i64], returns: FFIType.u64 },
    SetClassLongW: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.u32 },
    SetClassWord: { args: [FFIType.u64, FFIType.i32, FFIType.u16], returns: FFIType.u16 },
    SetClipboardData: { args: [FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    SetClipboardViewer: { args: [FFIType.u64], returns: FFIType.u64 },
    SetCoalescableTimer: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SetCursor: { args: [FFIType.u64], returns: FFIType.u64 },
    SetCursorPos: { args: [FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SetDialogControlDpiChangeBehavior: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetDialogDpiChangeBehavior: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetDisplayAutoRotationPreferences: { args: [FFIType.u32], returns: FFIType.i32 },
    SetDisplayConfig: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetDlgItemInt: { args: [FFIType.u64, FFIType.i32, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    SetDlgItemTextW: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SetDoubleClickTime: { args: [FFIType.u32], returns: FFIType.i32 },
    SetFocus: { args: [FFIType.u64], returns: FFIType.u64 },
    SetForegroundWindow: { args: [FFIType.u64], returns: FFIType.i32 },
    SetGestureConfig: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetKeyboardState: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetLastErrorEx: { args: [FFIType.u32, FFIType.u32], returns: FFIType.void },
    SetLayeredWindowAttributes: { args: [FFIType.u64, FFIType.u32, FFIType.u8, FFIType.u32], returns: FFIType.i32 },
    SetMenu: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    SetMenuContextHelpId: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetMenuDefaultItem: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetMenuInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetMenuItemBitmaps: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    SetMenuItemInfoW: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SetMessageExtraInfo: { args: [FFIType.i64], returns: FFIType.i64 },
    SetMessageQueue: { args: [FFIType.i32], returns: FFIType.i32 },
    SetParent: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    SetPhysicalCursorPos: { args: [FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SetProcessDefaultLayout: { args: [FFIType.u32], returns: FFIType.i32 },
    SetProcessDPIAware: { args: [], returns: FFIType.i32 },
    SetProcessDpiAwarenessContext: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetProcessWindowStation: { args: [FFIType.u64], returns: FFIType.i32 },
    SetPropA: { args: [FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    SetPropW: { args: [FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    SetRect: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SetRectEmpty: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetScrollInfo: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SetScrollPos: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SetScrollRange: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SetSysColors: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetSystemCursor: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetThreadDesktop: { args: [FFIType.u64], returns: FFIType.i32 },
    SetThreadDpiAwarenessContext: { args: [FFIType.ptr], returns: FFIType.ptr },
    SetThreadDpiHostingBehavior: { args: [FFIType.i32], returns: FFIType.i32 },
    SetTimer: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    SetUserObjectInformationW: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetUserObjectSecurity: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetWindowBand: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetWindowCompositionAttribute: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetWindowContextHelpId: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetWindowDisplayAffinity: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetWindowFeedbackSetting: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetWindowLongPtrW: { args: [FFIType.u64, FFIType.i32, FFIType.i64], returns: FFIType.i64 },
    SetWindowLongW: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SetWindowPlacement: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetWindowPos: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    SetWindowRgn: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SetWindowsHookExW: { args: [FFIType.i32, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    SetWindowTextW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetWindowWord: { args: [FFIType.u64, FFIType.i32, FFIType.u16], returns: FFIType.u16 },
    SetWinEventHook: { args: [FFIType.u32, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    ShowCaret: { args: [FFIType.u64], returns: FFIType.i32 },
    ShowCursor: { args: [FFIType.i32], returns: FFIType.i32 },
    ShowOwnedPopups: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    ShowScrollBar: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    ShowWindow: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    ShowWindowAsync: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    ShutdownBlockReasonCreate: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ShutdownBlockReasonDestroy: { args: [FFIType.u64], returns: FFIType.i32 },
    ShutdownBlockReasonQuery: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SkipPointerFrameMessages: { args: [FFIType.u32], returns: FFIType.i32 },
    SubtractRect: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SwapMouseButton: { args: [FFIType.i32], returns: FFIType.i32 },
    SwitchDesktop: { args: [FFIType.u64], returns: FFIType.i32 },
    SwitchToThisWindow: { args: [FFIType.u64, FFIType.i32], returns: FFIType.void },
    SystemParametersInfoForDpi: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SystemParametersInfoW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    TabbedTextOutW: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    TileWindows: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u16 },
    ToAscii: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    ToAsciiEx: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    ToUnicode: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    ToUnicodeEx: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    TrackMouseEvent: { args: [FFIType.ptr], returns: FFIType.i32 },
    TrackPopupMenu: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TrackPopupMenuEx: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TranslateAcceleratorW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TranslateMDISysAccel: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TranslateMessage: { args: [FFIType.ptr], returns: FFIType.i32 },
    UnhookWindowsHookEx: { args: [FFIType.u64], returns: FFIType.i32 },
    UnhookWinEvent: { args: [FFIType.u64], returns: FFIType.i32 },
    UnionRect: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UnloadKeyboardLayout: { args: [FFIType.u64], returns: FFIType.i32 },
    UnpackDDElParam: { args: [FFIType.u32, FFIType.i64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UnregisterClassW: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    UnregisterDeviceNotification: { args: [FFIType.u64], returns: FFIType.i32 },
    UnregisterHotKey: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    UnregisterPointerInputTarget: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    UnregisterPowerSettingNotification: { args: [FFIType.u64], returns: FFIType.i32 },
    UnregisterSuspendResumeNotification: { args: [FFIType.u64], returns: FFIType.i32 },
    UnregisterTouchWindow: { args: [FFIType.u64], returns: FFIType.i32 },
    UpdateLayeredWindow: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UpdateLayeredWindowIndirect: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    UpdateWindow: { args: [FFIType.u64], returns: FFIType.i32 },
    ValidateRect: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ValidateRgn: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    VkKeyScanExW: { args: [FFIType.u16, FFIType.u64], returns: FFIType.i16 },
    VkKeyScanW: { args: [FFIType.u16], returns: FFIType.i16 },
    WaitForInputIdle: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    WaitMessage: { args: [], returns: FFIType.i32 },
    WindowFromDC: { args: [FFIType.u64], returns: FFIType.u64 },
    WindowFromPhysicalPoint: { args: [FFIType.u64], returns: FFIType.u64 },
    WindowFromPoint: { args: [FFIType.u64], returns: FFIType.u64 },
    WinHelpW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    keybd_event: { args: [FFIType.u8, FFIType.u8, FFIType.u32, FFIType.u64], returns: FFIType.void },
    mouse_event: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.void },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-activatekeyboardlayout
  public static ActivateKeyboardLayout(hkl: HKL, Flags: UINT): HKL {
    return User32.Load('ActivateKeyboardLayout')(hkl, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-addclipboardformatlistener
  public static AddClipboardFormatListener(hwnd: HWND): BOOL {
    return User32.Load('AddClipboardFormatListener')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-adjustwindowrect
  public static AdjustWindowRect(lpRect: LPRECT, dwStyle: DWORD, bMenu: BOOL): BOOL {
    return User32.Load('AdjustWindowRect')(lpRect, dwStyle, bMenu);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-adjustwindowrectex
  public static AdjustWindowRectEx(lpRect: LPRECT, dwStyle: DWORD, bMenu: BOOL, dwExStyle: DWORD): BOOL {
    return User32.Load('AdjustWindowRectEx')(lpRect, dwStyle, bMenu, dwExStyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-adjustwindowrectexfordpi
  public static AdjustWindowRectExForDpi(lpRect: LPRECT, dwStyle: DWORD, bMenu: BOOL, dwExStyle: DWORD, dpi: UINT): BOOL {
    return User32.Load('AdjustWindowRectExForDpi')(lpRect, dwStyle, bMenu, dwExStyle, dpi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-allowsetforegroundwindow
  public static AllowSetForegroundWindow(dwProcessId: DWORD): BOOL {
    return User32.Load('AllowSetForegroundWindow')(dwProcessId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-animatewindow
  public static AnimateWindow(hWnd: HWND, dwTime: DWORD, dwFlags: DWORD): BOOL {
    return User32.Load('AnimateWindow')(hWnd, dwTime, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-anypopup
  public static AnyPopup(): BOOL {
    return User32.Load('AnyPopup')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-appendmenuw
  public static AppendMenuW(hMenu: HMENU, uFlags: UINT, uIDNewItem: UINT_PTR, lpNewItem: LPCWSTR | NULL): BOOL {
    return User32.Load('AppendMenuW')(hMenu, uFlags, uIDNewItem, lpNewItem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-aredpiawarenesscontextsequal
  public static AreDpiAwarenessContextsEqual(dpiContextA: DPI_AWARENESS_CONTEXT, dpiContextB: DPI_AWARENESS_CONTEXT): BOOL {
    return User32.Load('AreDpiAwarenessContextsEqual')(dpiContextA, dpiContextB);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-arrangeiconicwindows
  public static ArrangeIconicWindows(hWnd: HWND): UINT {
    return User32.Load('ArrangeIconicWindows')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-attachthreadinput
  public static AttachThreadInput(idAttach: DWORD, idAttachTo: DWORD, fAttach: BOOL): BOOL {
    return User32.Load('AttachThreadInput')(idAttach, idAttachTo, fAttach);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-begindeferwindowpos
  public static BeginDeferWindowPos(nNumWindows: int): HDWP {
    return User32.Load('BeginDeferWindowPos')(nNumWindows);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-beginpaint
  public static BeginPaint(hWnd: HWND, lpPaint: LPPAINTSTRUCT): HDC {
    return User32.Load('BeginPaint')(hWnd, lpPaint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-blockinput
  public static BlockInput(fBlockIt: BOOL): BOOL {
    return User32.Load('BlockInput')(fBlockIt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-bringwindowtotop
  public static BringWindowToTop(hWnd: HWND): BOOL {
    return User32.Load('BringWindowToTop')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-broadcastsystemmessageexw
  public static BroadcastSystemMessageExW(flags: DWORD, lpInfo: LPDWORD | NULL, Msg: UINT, wParam: WPARAM, lParam: LPARAM, pbsmInfo: PBSMINFO | NULL): LONG {
    return User32.Load('BroadcastSystemMessageExW')(flags, lpInfo, Msg, wParam, lParam, pbsmInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-broadcastsystemmessagew
  public static BroadcastSystemMessageW(flags: DWORD, lpInfo: LPDWORD | NULL, Msg: UINT, wParam: WPARAM, lParam: LPARAM): LONG {
    return User32.Load('BroadcastSystemMessageW')(flags, lpInfo, Msg, wParam, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-calculatepopupwindowposition
  public static CalculatePopupWindowPosition(anchorPoint: LPPOINT, windowSize: SIZE, flags: UINT, excludeRect: LPRECT | NULL, popupWindowPosition: LPRECT): BOOL {
    return User32.Load('CalculatePopupWindowPosition')(anchorPoint, windowSize, flags, excludeRect, popupWindowPosition);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-callmsgfilterw
  public static CallMsgFilterW(lpMsg: LPMSG, nCode: int): BOOL {
    return User32.Load('CallMsgFilterW')(lpMsg, nCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-callnexthookex
  public static CallNextHookEx(hhk: HHOOK | 0n, nCode: int, wParam: WPARAM, lParam: LPARAM): LRESULT {
    return User32.Load('CallNextHookEx')(hhk, nCode, wParam, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-callwindowprocw
  public static CallWindowProcW(lpPrevWndFunc: WNDPROC, hWnd: HWND, Msg: UINT, wParam: WPARAM, lParam: LPARAM): LRESULT {
    return User32.Load('CallWindowProcW')(lpPrevWndFunc, hWnd, Msg, wParam, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-cascadewindows
  public static CascadeWindows(hwndParent: HWND | 0n, wHow: UINT, lpRect: LPRECT | NULL, cKids: UINT, lpKids: HWND | 0n): WORD {
    return User32.Load('CascadeWindows')(hwndParent, wHow, lpRect, cKids, lpKids);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-changeclipboardchain
  public static ChangeClipboardChain(hWndRemove: HWND, hWndNewNext: HWND): BOOL {
    return User32.Load('ChangeClipboardChain')(hWndRemove, hWndNewNext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-changedisplaysettingsexw
  public static ChangeDisplaySettingsExW(lpszDeviceName: LPCWSTR | NULL, lpDevMode: DEVMODEW | NULL, hwnd: HWND | 0n, dwflags: DWORD, lParam: LPVOID | NULL): LONG {
    return User32.Load('ChangeDisplaySettingsExW')(lpszDeviceName, lpDevMode, hwnd, dwflags, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-changedisplaysettingsw
  public static ChangeDisplaySettingsW(lpDevMode: DEVMODEW | NULL, dwFlags: DWORD): LONG {
    return User32.Load('ChangeDisplaySettingsW')(lpDevMode, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-changewindowmessagefilter
  public static ChangeWindowMessageFilter(message: UINT, dwFlag: DWORD): BOOL {
    return User32.Load('ChangeWindowMessageFilter')(message, dwFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-changewindowmessagefilterex
  public static ChangeWindowMessageFilterEx(hwnd: HWND, message: UINT, action: DWORD, pChangeFilterStruct: PCHANGEFILTERSTRUCT | NULL): BOOL {
    return User32.Load('ChangeWindowMessageFilterEx')(hwnd, message, action, pChangeFilterStruct);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-charlowerbuffw
  public static CharLowerBuffW(lpsz: LPWSTR, cchLength: DWORD): DWORD {
    return User32.Load('CharLowerBuffW')(lpsz, cchLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-charlowerw
  public static CharLowerW(lpsz: LPWSTR): LPWSTR {
    return User32.Load('CharLowerW')(lpsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-charnextw
  public static CharNextW(lpsz: LPCWSTR): LPWSTR {
    return User32.Load('CharNextW')(lpsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-charprevw
  public static CharPrevW(lpszStart: LPCWSTR, lpszCurrent: LPCWSTR): LPWSTR {
    return User32.Load('CharPrevW')(lpszStart, lpszCurrent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-chartooembuffw
  public static CharToOemBuffW(lpszSrc: LPCWSTR, lpszDst: LPSTR, cchDstLength: DWORD): BOOL {
    return User32.Load('CharToOemBuffW')(lpszSrc, lpszDst, cchDstLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-chartooemw
  public static CharToOemW(pSrc: LPCWSTR, pDst: LPSTR): BOOL {
    return User32.Load('CharToOemW')(pSrc, pDst);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-charupperbuffw
  public static CharUpperBuffW(lpsz: LPWSTR, cchLength: DWORD): DWORD {
    return User32.Load('CharUpperBuffW')(lpsz, cchLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-charupperw
  public static CharUpperW(lpsz: LPWSTR): LPWSTR {
    return User32.Load('CharUpperW')(lpsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-checkdlgbutton
  public static CheckDlgButton(hDlg: HWND, nIDButton: int, uCheck: UINT): BOOL {
    return User32.Load('CheckDlgButton')(hDlg, nIDButton, uCheck);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-checkmenuitem
  public static CheckMenuItem(hMenu: HMENU, uIDCheckItem: UINT, uCheck: UINT): DWORD {
    return User32.Load('CheckMenuItem')(hMenu, uIDCheckItem, uCheck);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-checkmenuradioitem
  public static CheckMenuRadioItem(hmenu: HMENU, first: UINT, last: UINT, check: UINT, flags: UINT): BOOL {
    return User32.Load('CheckMenuRadioItem')(hmenu, first, last, check, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-checkradiobutton
  public static CheckRadioButton(hDlg: HWND, nIDFirstButton: int, nIDLastButton: int, nIDCheckButton: int): BOOL {
    return User32.Load('CheckRadioButton')(hDlg, nIDFirstButton, nIDLastButton, nIDCheckButton);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-childwindowfrompoint
  public static ChildWindowFromPoint(hWndParent: HWND, Point: PACKED_POINT): HWND {
    return User32.Load('ChildWindowFromPoint')(hWndParent, Point);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-childwindowfrompointex
  public static ChildWindowFromPointEx(hwnd: HWND, pt: PACKED_POINT, flags: UINT): HWND {
    return User32.Load('ChildWindowFromPointEx')(hwnd, pt, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-clienttoscreen
  public static ClientToScreen(hWnd: HWND, lpPoint: LPPOINT): BOOL {
    return User32.Load('ClientToScreen')(hWnd, lpPoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-clipcursor
  public static ClipCursor(lpRect: LPRECT | NULL): BOOL {
    return User32.Load('ClipCursor')(lpRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-closeclipboard
  public static CloseClipboard(): BOOL {
    return User32.Load('CloseClipboard')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-closedesktop
  public static CloseDesktop(hDesktop: HDESK): BOOL {
    return User32.Load('CloseDesktop')(hDesktop);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-closegestureinfohandle
  public static CloseGestureInfoHandle(hGestureInfo: HGESTUREINFO): BOOL {
    return User32.Load('CloseGestureInfoHandle')(hGestureInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-closetouchinputhandle
  public static CloseTouchInputHandle(hTouchInput: HTOUCHINPUT): BOOL {
    return User32.Load('CloseTouchInputHandle')(hTouchInput);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-closewindow
  public static CloseWindow(hWnd: HWND): BOOL {
    return User32.Load('CloseWindow')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-closewindowstation
  public static CloseWindowStation(hWinSta: HWINSTA): BOOL {
    return User32.Load('CloseWindowStation')(hWinSta);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-copyacceleratortablew
  public static CopyAcceleratorTableW(hAccelSrc: HACCEL, lpAccelDst: LPACCEL | NULL, cAccelEntries: int): int {
    return User32.Load('CopyAcceleratorTableW')(hAccelSrc, lpAccelDst, cAccelEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-copyicon
  public static CopyIcon(hIcon: HICON): HICON {
    return User32.Load('CopyIcon')(hIcon);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-copyimage
  public static CopyImage(h: HANDLE, type: UINT, cx: int, cy: int, flags: UINT): HANDLE {
    return User32.Load('CopyImage')(h, type, cx, cy, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-copyrect
  public static CopyRect(lprcDst: LPRECT, lprcSrc: LPRECT): BOOL {
    return User32.Load('CopyRect')(lprcDst, lprcSrc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-countclipboardformats
  public static CountClipboardFormats(): int {
    return User32.Load('CountClipboardFormats')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createacceleratortablew
  public static CreateAcceleratorTableW(paccel: LPACCEL, cAccel: int): HACCEL {
    return User32.Load('CreateAcceleratorTableW')(paccel, cAccel);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createcaret
  public static CreateCaret(hWnd: HWND, hBitmap: HBITMAP | 0n, nWidth: int, nHeight: int): BOOL {
    return User32.Load('CreateCaret')(hWnd, hBitmap, nWidth, nHeight);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createcursor
  public static CreateCursor(hInst: HINSTANCE, xHotSpot: int, yHotSpot: int, nWidth: int, nHeight: int, pvANDPlane: PBYTE, pvXORPlane: PBYTE): HCURSOR {
    return User32.Load('CreateCursor')(hInst, xHotSpot, yHotSpot, nWidth, nHeight, pvANDPlane, pvXORPlane);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createdesktopexw
  public static CreateDesktopExW(lpszDesktop: LPCWSTR, lpszDevice: LPCWSTR | NULL, pDevmode: DEVMODEW | NULL, dwFlags: DWORD, dwDesiredAccess: ACCESS_MASK, lpsa: LPSECURITY_ATTRIBUTES | NULL, ulHeapSize: ULONG, pvoid: PVOID | NULL): HDESK {
    return User32.Load('CreateDesktopExW')(lpszDesktop, lpszDevice, pDevmode, dwFlags, dwDesiredAccess, lpsa, ulHeapSize, pvoid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createdesktopw
  public static CreateDesktopW(lpszDesktop: LPCWSTR, lpszDevice: LPCWSTR | NULL, pDevmode: DEVMODEW | NULL, dwFlags: DWORD, dwDesiredAccess: ACCESS_MASK, lpsa: LPSECURITY_ATTRIBUTES | NULL): HDESK {
    return User32.Load('CreateDesktopW')(lpszDesktop, lpszDevice, pDevmode, dwFlags, dwDesiredAccess, lpsa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createdialogindirectparamw
  public static CreateDialogIndirectParamW(hInstance: HINSTANCE, lpTemplate: LPCDLGTEMPLATEW, hWndParent: HWND | 0n, lpDialogFunc: DLGPROC | NULL, dwInitParam: LPARAM): HWND {
    return User32.Load('CreateDialogIndirectParamW')(hInstance, lpTemplate, hWndParent, lpDialogFunc, dwInitParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createdialogparamw
  public static CreateDialogParamW(hInstance: HINSTANCE, lpTemplateName: LPCWSTR, hWndParent: HWND | 0n, lpDialogFunc: DLGPROC | NULL, dwInitParam: LPARAM): HWND {
    return User32.Load('CreateDialogParamW')(hInstance, lpTemplateName, hWndParent, lpDialogFunc, dwInitParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createicon
  public static CreateIcon(hInstance: HINSTANCE, nWidth: int, nHeight: int, cPlanes: BYTE, cBitsPixel: BYTE, lpbANDbits: BYTE, lpbXORbits: BYTE): HICON {
    return User32.Load('CreateIcon')(hInstance, nWidth, nHeight, cPlanes, cBitsPixel, lpbANDbits, lpbXORbits);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createiconfromresource
  public static CreateIconFromResource(presbits: PBYTE, dwResSize: DWORD, fIcon: BOOL, dwVer: DWORD): HICON {
    return User32.Load('CreateIconFromResource')(presbits, dwResSize, fIcon, dwVer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createiconfromresourceex
  public static CreateIconFromResourceEx(presbits: PBYTE, dwResSize: DWORD, fIcon: BOOL, dwVer: DWORD, cxDesired: int, cyDesired: int, Flags: UINT): HICON {
    return User32.Load('CreateIconFromResourceEx')(presbits, dwResSize, fIcon, dwVer, cxDesired, cyDesired, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createiconindirect
  public static CreateIconIndirect(piconinfo: PICONINFO): HICON {
    return User32.Load('CreateIconIndirect')(piconinfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createmdiwindoww
  public static CreateMDIWindowW(lpClassName: LPCWSTR, lpWindowName: LPCWSTR, dwStyle: DWORD, X: int, Y: int, nWidth: int, nHeight: int, hWndParent: HWND, hInstance: HINSTANCE, lParam: LPARAM): HWND {
    return User32.Load('CreateMDIWindowW')(lpClassName, lpWindowName, dwStyle, X, Y, nWidth, nHeight, hWndParent, hInstance, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createmenu
  public static CreateMenu(): HMENU {
    return User32.Load('CreateMenu')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createpopupmenu
  public static CreatePopupMenu(): HMENU {
    return User32.Load('CreatePopupMenu')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createsyntheticpointerdevice
  public static CreateSyntheticPointerDevice(pointerType: POINTER_INPUT_TYPE, maxCount: ULONG, mode: POINTER_FEEDBACK_MODE): HSYNTHETICPOINTERDEVICE {
    return User32.Load('CreateSyntheticPointerDevice')(pointerType, maxCount, mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createwindowexw
  public static CreateWindowExW(dwExStyle: DWORD, lpClassName: LPCWSTR, lpWindowName: LPCWSTR | NULL, dwStyle: DWORD, X: int, Y: int, nWidth: int, nHeight: int, hWndParent: HWND | 0n, hMenu: HMENU | 0n, hInstance: HINSTANCE | 0n, lpParam: LPVOID | NULL): HWND {
    return User32.Load('CreateWindowExW')(dwExStyle, lpClassName, lpWindowName, dwStyle, X, Y, nWidth, nHeight, hWndParent, hMenu, hInstance, lpParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createwindowstationw
  public static CreateWindowStationW(lpwinsta: LPCWSTR | NULL, dwFlags: DWORD, dwDesiredAccess: ACCESS_MASK, lpsa: LPSECURITY_ATTRIBUTES | NULL): HWINSTA {
    return User32.Load('CreateWindowStationW')(lpwinsta, dwFlags, dwDesiredAccess, lpsa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddeabandontransaction
  public static DdeAbandonTransaction(idInst: DWORD, hConv: HCONV, idTransaction: DWORD): BOOL {
    return User32.Load('DdeAbandonTransaction')(idInst, hConv, idTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddeaccessdata
  public static DdeAccessData(hData: HDDEDATA, pcbDataSize: LPDWORD | NULL): LPBYTE {
    return User32.Load('DdeAccessData')(hData, pcbDataSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddeclienttransaction
  public static DdeClientTransaction(pData: LPBYTE | NULL, cbData: DWORD, hConv: HCONV, hszItem: HSZ | 0n, wFmt: UINT, wType: UINT, dwTimeout: DWORD, pdwResult: LPDWORD | NULL): HDDEDATA {
    return User32.Load('DdeClientTransaction')(pData, cbData, hConv, hszItem, wFmt, wType, dwTimeout, pdwResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddecmpstringhandles
  public static DdeCmpStringHandles(hsz1: HSZ, hsz2: HSZ): int {
    return User32.Load('DdeCmpStringHandles')(hsz1, hsz2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddeconnect
  public static DdeConnect(idInst: DWORD, hszService: HSZ, hszTopic: HSZ, pCC: PCONVCONTEXT | NULL): HCONV {
    return User32.Load('DdeConnect')(idInst, hszService, hszTopic, pCC);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddeconnectlist
  public static DdeConnectList(idInst: DWORD, hszService: HSZ | 0n, hszTopic: HSZ | 0n, hConvList: HCONVLIST | 0n, pCC: PCONVCONTEXT | NULL): HCONVLIST {
    return User32.Load('DdeConnectList')(idInst, hszService, hszTopic, hConvList, pCC);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddecreatedatahandle
  public static DdeCreateDataHandle(idInst: DWORD, pSrc: LPBYTE | NULL, cb: DWORD, cbOff: DWORD, hszItem: HSZ | 0n, wFmt: UINT, afCmd: UINT): HDDEDATA {
    return User32.Load('DdeCreateDataHandle')(idInst, pSrc, cb, cbOff, hszItem, wFmt, afCmd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddecreatestringhandlew
  public static DdeCreateStringHandleW(idInst: DWORD, psz: LPCWSTR, iCodePage: int): HSZ {
    return User32.Load('DdeCreateStringHandleW')(idInst, psz, iCodePage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddedisconnect
  public static DdeDisconnect(hConv: HCONV): BOOL {
    return User32.Load('DdeDisconnect')(hConv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddedisconnectlist
  public static DdeDisconnectList(hConvList: HCONVLIST): BOOL {
    return User32.Load('DdeDisconnectList')(hConvList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddeenablecallback
  public static DdeEnableCallback(idInst: DWORD, hConv: HCONV | 0n, wCmd: UINT): BOOL {
    return User32.Load('DdeEnableCallback')(idInst, hConv, wCmd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddefreedatahandle
  public static DdeFreeDataHandle(hData: HDDEDATA): BOOL {
    return User32.Load('DdeFreeDataHandle')(hData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddefreestringhandle
  public static DdeFreeStringHandle(idInst: DWORD, hsz: HSZ): BOOL {
    return User32.Load('DdeFreeStringHandle')(idInst, hsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddegetdata
  public static DdeGetData(hData: HDDEDATA, pDst: LPBYTE | NULL, cbMax: DWORD, cbOff: DWORD): DWORD {
    return User32.Load('DdeGetData')(hData, pDst, cbMax, cbOff);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddegetlasterror
  public static DdeGetLastError(idInst: DWORD): UINT {
    return User32.Load('DdeGetLastError')(idInst);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddeimpersonateclient
  public static DdeImpersonateClient(hConv: HCONV): BOOL {
    return User32.Load('DdeImpersonateClient')(hConv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddeinitializew
  public static DdeInitializeW(pidInst: LPDWORD, pfnCallback: PFNCALLBACK, afCmd: DWORD, ulRes: DWORD): UINT {
    return User32.Load('DdeInitializeW')(pidInst, pfnCallback, afCmd, ulRes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddekeepstringhandle
  public static DdeKeepStringHandle(idInst: DWORD, hsz: HSZ): BOOL {
    return User32.Load('DdeKeepStringHandle')(idInst, hsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddequeryconvinfo
  public static DdeQueryConvInfo(hConv: HCONV, idTransaction: DWORD, pConvInfo: PCONVINFO): UINT {
    return User32.Load('DdeQueryConvInfo')(hConv, idTransaction, pConvInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddequerynextserver
  public static DdeQueryNextServer(hConvList: HCONVLIST, hConvPrev: HCONV | 0n): HCONV {
    return User32.Load('DdeQueryNextServer')(hConvList, hConvPrev);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddequerystringw
  public static DdeQueryStringW(idInst: DWORD, hsz: HSZ, psz: LPWSTR | NULL, cchMax: DWORD, iCodePage: int): DWORD {
    return User32.Load('DdeQueryStringW')(idInst, hsz, psz, cchMax, iCodePage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddeunaccessdata
  public static DdeUnaccessData(hData: HDDEDATA): BOOL {
    return User32.Load('DdeUnaccessData')(hData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ddeml/nf-ddeml-ddeuninitialize
  public static DdeUninitialize(idInst: DWORD): BOOL {
    return User32.Load('DdeUninitialize')(idInst);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-defdlgprocw
  public static DefDlgProcW(hDlg: HWND, Msg: UINT, wParam: WPARAM, lParam: LPARAM): LRESULT {
    return User32.Load('DefDlgProcW')(hDlg, Msg, wParam, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-deferwindowpos
  public static DeferWindowPos(hWinPosInfo: HDWP, hWnd: HWND, hWndInsertAfter: HWND | 0n, x: int, y: int, cx: int, cy: int, uFlags: UINT): HDWP {
    return User32.Load('DeferWindowPos')(hWinPosInfo, hWnd, hWndInsertAfter, x, y, cx, cy, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-defframeprocw
  public static DefFrameProcW(hWnd: HWND, hWndMDIClient: HWND, uMsg: UINT, wParam: WPARAM, lParam: LPARAM): LRESULT {
    return User32.Load('DefFrameProcW')(hWnd, hWndMDIClient, uMsg, wParam, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-defmdichildprocw
  public static DefMDIChildProcW(hWnd: HWND, uMsg: UINT, wParam: WPARAM, lParam: LPARAM): LRESULT {
    return User32.Load('DefMDIChildProcW')(hWnd, uMsg, wParam, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-defrawinputproc
  public static DefRawInputProc(paRawInput: PRAWINPUT, nInput: int, cbSizeHeader: UINT): LRESULT {
    return User32.Load('DefRawInputProc')(paRawInput, nInput, cbSizeHeader);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-defwindowprocw
  public static DefWindowProcW(hWnd: HWND, Msg: UINT, wParam: WPARAM, lParam: LPARAM): LRESULT {
    return User32.Load('DefWindowProcW')(hWnd, Msg, wParam, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-deletemenu
  public static DeleteMenu(hMenu: HMENU, uPosition: UINT, uFlags: UINT): BOOL {
    return User32.Load('DeleteMenu')(hMenu, uPosition, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-deregistershellhookwindow
  public static DeregisterShellHookWindow(hwnd: HWND): BOOL {
    return User32.Load('DeregisterShellHookWindow')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-destroyacceleratortable
  public static DestroyAcceleratorTable(hAccel: HACCEL): BOOL {
    return User32.Load('DestroyAcceleratorTable')(hAccel);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-destroycaret
  public static DestroyCaret(): BOOL {
    return User32.Load('DestroyCaret')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-destroycursor
  public static DestroyCursor(hCursor: HCURSOR): BOOL {
    return User32.Load('DestroyCursor')(hCursor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-destroyicon
  public static DestroyIcon(hIcon: HICON): BOOL {
    return User32.Load('DestroyIcon')(hIcon);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-destroymenu
  public static DestroyMenu(hMenu: HMENU): BOOL {
    return User32.Load('DestroyMenu')(hMenu);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-destroysyntheticpointerdevice
  public static DestroySyntheticPointerDevice(device: HSYNTHETICPOINTERDEVICE): VOID {
    return User32.Load('DestroySyntheticPointerDevice')(device);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-destroywindow
  public static DestroyWindow(hWnd: HWND): BOOL {
    return User32.Load('DestroyWindow')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-dialogboxindirectparamw
  public static DialogBoxIndirectParamW(hInstance: HINSTANCE, hDialogTemplate: LPCDLGTEMPLATEW, hWndParent: HWND | 0n, lpDialogFunc: DLGPROC, dwInitParam: LPARAM): INT_PTR {
    return User32.Load('DialogBoxIndirectParamW')(hInstance, hDialogTemplate, hWndParent, lpDialogFunc, dwInitParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-dialogboxparamw
  public static DialogBoxParamW(hInstance: HINSTANCE, lpTemplateName: LPCWSTR, hWndParent: HWND | 0n, lpDialogFunc: DLGPROC, dwInitParam: LPARAM): INT_PTR {
    return User32.Load('DialogBoxParamW')(hInstance, lpTemplateName, hWndParent, lpDialogFunc, dwInitParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-disableprocesswindowsghosting
  public static DisableProcessWindowsGhosting(): VOID {
    return User32.Load('DisableProcessWindowsGhosting')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-dispatchmessagew
  public static DispatchMessageW(lpMsg: LPMSG): LRESULT {
    return User32.Load('DispatchMessageW')(lpMsg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-displayconfiggetdeviceinfo
  public static DisplayConfigGetDeviceInfo(requestPacket: DISPLAYCONFIG_DEVICE_INFO_HEADER): LONG {
    return User32.Load('DisplayConfigGetDeviceInfo')(requestPacket);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-displayconfigsetdeviceinfo
  public static DisplayConfigSetDeviceInfo(setPacket: DISPLAYCONFIG_DEVICE_INFO_HEADER): LONG {
    return User32.Load('DisplayConfigSetDeviceInfo')(setPacket);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-dlgdirlistcomboboxw
  public static DlgDirListComboBoxW(hDlg: HWND, lpPathSpec: LPWSTR, nIDComboBox: int, nIDStaticPath: int, uFiletype: UINT): int {
    return User32.Load('DlgDirListComboBoxW')(hDlg, lpPathSpec, nIDComboBox, nIDStaticPath, uFiletype);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-dlgdirlistw
  public static DlgDirListW(hDlg: HWND, lpPathSpec: LPWSTR, nIDListBox: int, nIDStaticPath: int, uFileType: UINT): int {
    return User32.Load('DlgDirListW')(hDlg, lpPathSpec, nIDListBox, nIDStaticPath, uFileType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-dlgdirselectcomboboxexw
  public static DlgDirSelectComboBoxExW(hwndDlg: HWND, lpString: LPWSTR, cchOut: int, idComboBox: int): BOOL {
    return User32.Load('DlgDirSelectComboBoxExW')(hwndDlg, lpString, cchOut, idComboBox);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-dlgdirselectexw
  public static DlgDirSelectExW(hwndDlg: HWND, lpString: LPWSTR, chCount: int, idListBox: int): BOOL {
    return User32.Load('DlgDirSelectExW')(hwndDlg, lpString, chCount, idListBox);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-dragdetect
  public static DragDetect(hwnd: HWND, pt: PACKED_POINT): BOOL {
    return User32.Load('DragDetect')(hwnd, pt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-drawanimatedrects
  public static DrawAnimatedRects(hwnd: HWND | 0n, idAni: int, lprcFrom: LPRECT, lprcTo: LPRECT): BOOL {
    return User32.Load('DrawAnimatedRects')(hwnd, idAni, lprcFrom, lprcTo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-drawcaption
  public static DrawCaption(hwnd: HWND, hdc: HDC, lprect: LPRECT, flags: UINT): BOOL {
    return User32.Load('DrawCaption')(hwnd, hdc, lprect, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-drawedge
  public static DrawEdge(hdc: HDC, qrc: LPRECT, edge: UINT, grfFlags: UINT): BOOL {
    return User32.Load('DrawEdge')(hdc, qrc, edge, grfFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-drawfocusrect
  public static DrawFocusRect(hDC: HDC, lprc: LPRECT): BOOL {
    return User32.Load('DrawFocusRect')(hDC, lprc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-drawframecontrol
  public static DrawFrameControl(hdc: HDC, lprc: LPRECT, uType: UINT, uState: UINT): BOOL {
    return User32.Load('DrawFrameControl')(hdc, lprc, uType, uState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-drawicon
  public static DrawIcon(hDC: HDC, X: int, Y: int, hIcon: HICON): BOOL {
    return User32.Load('DrawIcon')(hDC, X, Y, hIcon);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-drawiconex
  public static DrawIconEx(hdc: HDC, xLeft: int, yTop: int, hIcon: HICON, cxWidth: int, cyWidth: int, istepIfAniCur: UINT, hbrFlickerFreeDraw: HBRUSH | 0n, diFlags: UINT): BOOL {
    return User32.Load('DrawIconEx')(hdc, xLeft, yTop, hIcon, cxWidth, cyWidth, istepIfAniCur, hbrFlickerFreeDraw, diFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-drawmenubar
  public static DrawMenuBar(hWnd: HWND): BOOL {
    return User32.Load('DrawMenuBar')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-drawstatew
  public static DrawStateW(hdc: HDC, hbrFore: HBRUSH | 0n, qfnCallBack: DRAWSTATEPROC | NULL, lData: LPARAM, wData: WPARAM, x: int, y: int, cx: int, cy: int, uFlags: UINT): BOOL {
    return User32.Load('DrawStateW')(hdc, hbrFore, qfnCallBack, lData, wData, x, y, cx, cy, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-drawtextexw
  public static DrawTextExW(hdc: HDC, lpchText: LPWSTR, cchText: int, lprc: LPRECT, format: UINT, lpdtp: LPDRAWTEXTPARAMS | NULL): int {
    return User32.Load('DrawTextExW')(hdc, lpchText, cchText, lprc, format, lpdtp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-drawtextw
  public static DrawTextW(hdc: HDC, lpchText: LPCWSTR, cchText: int, lprc: LPRECT, format: UINT): int {
    return User32.Load('DrawTextW')(hdc, lpchText, cchText, lprc, format);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-emptyclipboard
  public static EmptyClipboard(): BOOL {
    return User32.Load('EmptyClipboard')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enablemenuitem
  public static EnableMenuItem(hMenu: HMENU, uIDEnableItem: UINT, uEnable: UINT): BOOL {
    return User32.Load('EnableMenuItem')(hMenu, uIDEnableItem, uEnable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enablemouseinpointer
  public static EnableMouseInPointer(fEnable: BOOL): BOOL {
    return User32.Load('EnableMouseInPointer')(fEnable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enablenonclientdpiscaling
  public static EnableNonClientDpiScaling(hwnd: HWND): BOOL {
    return User32.Load('EnableNonClientDpiScaling')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enablescrollbar
  public static EnableScrollBar(hWnd: HWND, wSBflags: UINT, wArrows: UINT): BOOL {
    return User32.Load('EnableScrollBar')(hWnd, wSBflags, wArrows);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enablewindow
  public static EnableWindow(hWnd: HWND, bEnable: BOOL): BOOL {
    return User32.Load('EnableWindow')(hWnd, bEnable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enddeferwindowpos
  public static EndDeferWindowPos(hWinPosInfo: HDWP): BOOL {
    return User32.Load('EndDeferWindowPos')(hWinPosInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enddialog
  public static EndDialog(hDlg: HWND, nResult: INT_PTR): BOOL {
    return User32.Load('EndDialog')(hDlg, nResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-endmenu
  public static EndMenu(): BOOL {
    return User32.Load('EndMenu')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-endpaint
  public static EndPaint(hWnd: HWND, lpPaint: PAINTSTRUCT): BOOL {
    return User32.Load('EndPaint')(hWnd, lpPaint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-endtask
  public static EndTask(hWnd: HWND, fShutDown: BOOL, fForce: BOOL): BOOL {
    return User32.Load('EndTask')(hWnd, fShutDown, fForce);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumchildwindows
  public static EnumChildWindows(hWndParent: HWND | 0n, lpEnumFunc: WNDENUMPROC, lParam: LPARAM): BOOL {
    return User32.Load('EnumChildWindows')(hWndParent, lpEnumFunc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumclipboardformats
  public static EnumClipboardFormats(format: UINT): UINT {
    return User32.Load('EnumClipboardFormats')(format);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumdesktopsw
  public static EnumDesktopsW(hwinsta: HWINSTA, lpEnumFunc: DESKTOPENUMPROCW, lParam: LPARAM): BOOL {
    return User32.Load('EnumDesktopsW')(hwinsta, lpEnumFunc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumdesktopwindows
  public static EnumDesktopWindows(hDesktop: HDESK | 0n, lpfn: WNDENUMPROC, lParam: LPARAM): BOOL {
    return User32.Load('EnumDesktopWindows')(hDesktop, lpfn, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumdisplaydevicesw
  public static EnumDisplayDevicesW(lpDevice: LPCWSTR | NULL, iDevNum: DWORD, lpDisplayDevice: PDISPLAY_DEVICEW, dwFlags: DWORD): BOOL {
    return User32.Load('EnumDisplayDevicesW')(lpDevice, iDevNum, lpDisplayDevice, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumdisplaymonitors
  public static EnumDisplayMonitors(hdc: HDC | 0n, lprcClip: LPCRECT | NULL, lpfnEnum: MONITORENUMPROC, dwData: LPARAM): BOOL {
    return User32.Load('EnumDisplayMonitors')(hdc, lprcClip, lpfnEnum, dwData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumdisplaysettingsexw
  public static EnumDisplaySettingsExW(lpszDeviceName: LPCWSTR | NULL, iModeNum: DWORD, lpDevMode: DEVMODEW, dwFlags: DWORD): BOOL {
    return User32.Load('EnumDisplaySettingsExW')(lpszDeviceName, iModeNum, lpDevMode, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumdisplaysettingsw
  public static EnumDisplaySettingsW(lpszDeviceName: LPCWSTR | NULL, iModeNum: DWORD, lpDevMode: DEVMODEW): BOOL {
    return User32.Load('EnumDisplaySettingsW')(lpszDeviceName, iModeNum, lpDevMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumpropsa
  public static EnumPropsA(hWnd: HWND, lpEnumFunc: PROPENUMPROCA): int {
    return User32.Load('EnumPropsA')(hWnd, lpEnumFunc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumpropsexa
  public static EnumPropsExA(hWnd: HWND, lpEnumFunc: PROPENUMPROCEXA, lParam: LPARAM): int {
    return User32.Load('EnumPropsExA')(hWnd, lpEnumFunc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumpropsexw
  public static EnumPropsExW(hWnd: HWND, lpEnumFunc: PROPENUMPROCEXW, lParam: LPARAM): int {
    return User32.Load('EnumPropsExW')(hWnd, lpEnumFunc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumpropsw
  public static EnumPropsW(hWnd: HWND, lpEnumFunc: PROPENUMPROCW): int {
    return User32.Load('EnumPropsW')(hWnd, lpEnumFunc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumthreadwindows
  public static EnumThreadWindows(dwThreadId: DWORD, lpfn: WNDENUMPROC, lParam: LPARAM): BOOL {
    return User32.Load('EnumThreadWindows')(dwThreadId, lpfn, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumwindows
  public static EnumWindows(lpEnumFunc: WNDENUMPROC, lParam: LPARAM): BOOL {
    return User32.Load('EnumWindows')(lpEnumFunc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumwindowstationsw
  public static EnumWindowStationsW(lpEnumFunc: WINSTAENUMPROCW, lParam: LPARAM): BOOL {
    return User32.Load('EnumWindowStationsW')(lpEnumFunc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-equalrect
  public static EqualRect(lprc1: LPRECT, lprc2: LPRECT): BOOL {
    return User32.Load('EqualRect')(lprc1, lprc2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-evaluateproximitytopolygon
  public static EvaluateProximityToPolygon(numVertices: UINT32, controlPolygon: LPPOINT, pHitTestingInput: TOUCH_HIT_TESTING_INPUT, pProximityEval: TOUCH_HIT_TESTING_PROXIMITY_EVALUATION): BOOL {
    return User32.Load('EvaluateProximityToPolygon')(numVertices, controlPolygon, pHitTestingInput, pProximityEval);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-evaluateproximitytorect
  public static EvaluateProximityToRect(controlBoundingBox: LPRECT, pHitTestingInput: TOUCH_HIT_TESTING_INPUT, pProximityEval: TOUCH_HIT_TESTING_PROXIMITY_EVALUATION): BOOL {
    return User32.Load('EvaluateProximityToRect')(controlBoundingBox, pHitTestingInput, pProximityEval);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-excludeupdatergn
  public static ExcludeUpdateRgn(hDC: HDC, hWnd: HWND): int {
    return User32.Load('ExcludeUpdateRgn')(hDC, hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-exitwindowsex
  public static ExitWindowsEx(uFlags: UINT, dwReason: DWORD): BOOL {
    return User32.Load('ExitWindowsEx')(uFlags, dwReason);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-fillrect
  public static FillRect(hDC: HDC, lprc: LPRECT, hbr: HBRUSH): int {
    return User32.Load('FillRect')(hDC, lprc, hbr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-findwindowexw
  public static FindWindowExW(hWndParent: HWND | 0n, hWndChildAfter: HWND | 0n, lpszClass: LPCWSTR | NULL, lpszWindow: LPCWSTR | NULL): HWND {
    return User32.Load('FindWindowExW')(hWndParent as HWND, hWndChildAfter as HWND, lpszClass as LPCWSTR, lpszWindow as LPCWSTR);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-findwindoww
  public static FindWindowW(lpClassName: LPCWSTR | NULL, lpWindowName: LPCWSTR | NULL): HWND {
    return User32.Load('FindWindowW')(lpClassName as LPCWSTR, lpWindowName as LPCWSTR);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-flashwindow
  public static FlashWindow(hWnd: HWND, bInvert: BOOL): BOOL {
    return User32.Load('FlashWindow')(hWnd, bInvert);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-flashwindowex
  public static FlashWindowEx(pfwi: PFLASHWINFO): BOOL {
    return User32.Load('FlashWindowEx')(pfwi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-framerect
  public static FrameRect(hDC: HDC, lprc: LPRECT, hbr: HBRUSH): int {
    return User32.Load('FrameRect')(hDC, lprc, hbr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getactivewindow
  public static GetActiveWindow(): HWND {
    return User32.Load('GetActiveWindow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getalttabinfow
  public static GetAltTabInfoW(hwnd: HWND | 0n, iItem: int, pati: PALTTABINFO, pszItemText: LPWSTR | NULL, cchItemText: UINT): BOOL {
    return User32.Load('GetAltTabInfoW')(hwnd, iItem, pati, pszItemText, cchItemText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getancestor
  public static GetAncestor(hwnd: HWND, gaFlags: UINT): HWND {
    return User32.Load('GetAncestor')(hwnd, gaFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getasynckeystate
  public static GetAsyncKeyState(vKey: int): SHORT {
    return User32.Load('GetAsyncKeyState')(vKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getautorotationstate
  public static GetAutoRotationState(pState: PAR_STATE): BOOL {
    return User32.Load('GetAutoRotationState')(pState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getawarenessfromdpiawarenesscontext
  public static GetAwarenessFromDpiAwarenessContext(value: DPI_AWARENESS_CONTEXT): DPI_AWARENESS {
    return User32.Load('GetAwarenessFromDpiAwarenessContext')(value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getcapture
  public static GetCapture(): HWND {
    return User32.Load('GetCapture')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getcaretblinktime
  public static GetCaretBlinkTime(): UINT {
    return User32.Load('GetCaretBlinkTime')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getcaretpos
  public static GetCaretPos(lpPoint: LPPOINT): BOOL {
    return User32.Load('GetCaretPos')(lpPoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclassinfoexw
  public static GetClassInfoExW(hInstance: HINSTANCE | 0n, lpszClass: LPCWSTR, lpwcx: LPWNDCLASSEXW): BOOL {
    return User32.Load('GetClassInfoExW')(hInstance, lpszClass, lpwcx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclassinfow
  public static GetClassInfoW(hInstance: HINSTANCE | 0n, lpClassName: LPCWSTR, lpWndClass: LPWNDCLASSW): BOOL {
    return User32.Load('GetClassInfoW')(hInstance, lpClassName, lpWndClass);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclasslongptrw
  public static GetClassLongPtrW(hWnd: HWND, nIndex: int): ULONG_PTR {
    return User32.Load('GetClassLongPtrW')(hWnd, nIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclasslongw
  public static GetClassLongW(hWnd: HWND, nIndex: int): DWORD {
    return User32.Load('GetClassLongW')(hWnd, nIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclassnamew
  public static GetClassNameW(hWnd: HWND, lpClassName: LPWSTR, nMaxCount: int): int {
    return User32.Load('GetClassNameW')(hWnd, lpClassName, nMaxCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclassword
  public static GetClassWord(hWnd: HWND, nIndex: int): WORD {
    return User32.Load('GetClassWord')(hWnd, nIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclientrect
  public static GetClientRect(hWnd: HWND, lpRect: LPRECT): BOOL {
    return User32.Load('GetClientRect')(hWnd, lpRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclipboarddata
  public static GetClipboardData(uFormat: UINT): HANDLE {
    return User32.Load('GetClipboardData')(uFormat);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclipboardformatnamew
  public static GetClipboardFormatNameW(format: UINT, lpszFormatName: LPWSTR, cchMaxCount: int): int {
    return User32.Load('GetClipboardFormatNameW')(format, lpszFormatName, cchMaxCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclipboardowner
  public static GetClipboardOwner(): HWND {
    return User32.Load('GetClipboardOwner')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclipboardsequencenumber
  public static GetClipboardSequenceNumber(): DWORD {
    return User32.Load('GetClipboardSequenceNumber')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclipboardviewer
  public static GetClipboardViewer(): HWND {
    return User32.Load('GetClipboardViewer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclipcursor
  public static GetClipCursor(lpRect: LPRECT): BOOL {
    return User32.Load('GetClipCursor')(lpRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getcomboboxinfo
  public static GetComboBoxInfo(hwndCombo: HWND, pcbi: PCOMBOBOXINFO): BOOL {
    return User32.Load('GetComboBoxInfo')(hwndCombo, pcbi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getcurrentinputmessagesource
  public static GetCurrentInputMessageSource(inputMessageSource: INPUT_MESSAGE_SOURCE): BOOL {
    return User32.Load('GetCurrentInputMessageSource')(inputMessageSource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getcursor
  public static GetCursor(): HCURSOR {
    return User32.Load('GetCursor')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getcursorinfo
  public static GetCursorInfo(pci: PCURSORINFO): BOOL {
    return User32.Load('GetCursorInfo')(pci);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getcursorpos
  public static GetCursorPos(lpPoint: LPPOINT): BOOL {
    return User32.Load('GetCursorPos')(lpPoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdc
  public static GetDC(hWnd: HWND | 0n): HDC {
    return User32.Load('GetDC')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdcex
  public static GetDCEx(hWnd: HWND | 0n, hrgnClip: HRGN | 0n, flags: DWORD): HDC {
    return User32.Load('GetDCEx')(hWnd, hrgnClip, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdesktopwindow
  public static GetDesktopWindow(): HWND {
    return User32.Load('GetDesktopWindow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdialogbaseunits
  public static GetDialogBaseUnits(): LONG {
    return User32.Load('GetDialogBaseUnits')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdialogcontroldpichangebehavior
  public static GetDialogControlDpiChangeBehavior(hWnd: HWND): DIALOG_CONTROL_DPI_CHANGE_BEHAVIORS {
    return User32.Load('GetDialogControlDpiChangeBehavior')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdialogdpichangebehavior
  public static GetDialogDpiChangeBehavior(hDlg: HWND): DIALOG_DPI_CHANGE_BEHAVIORS {
    return User32.Load('GetDialogDpiChangeBehavior')(hDlg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdisplayautorotationpreferences
  public static GetDisplayAutoRotationPreferences(pOrientation: PORIENTATION_PREFERENCE): BOOL {
    return User32.Load('GetDisplayAutoRotationPreferences')(pOrientation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdisplayconfigbuffersizes
  public static GetDisplayConfigBufferSizes(flags: UINT32, numPathArrayElements: PUINT, numModeInfoArrayElements: PUINT): LONG {
    return User32.Load('GetDisplayConfigBufferSizes')(flags, numPathArrayElements, numModeInfoArrayElements);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdlgctrlid
  public static GetDlgCtrlID(hWnd: HWND): int {
    return User32.Load('GetDlgCtrlID')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdlgitem
  public static GetDlgItem(hDlg: HWND, nIDDlgItem: int): HWND {
    return User32.Load('GetDlgItem')(hDlg, nIDDlgItem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdlgitemint
  public static GetDlgItemInt(hDlg: HWND, nIDDlgItem: int, lpTranslated: LPINT | NULL, bSigned: BOOL): UINT {
    return User32.Load('GetDlgItemInt')(hDlg, nIDDlgItem, lpTranslated, bSigned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdlgitemtextw
  public static GetDlgItemTextW(hDlg: HWND, nIDDlgItem: int, lpString: LPWSTR, cchMax: int): UINT {
    return User32.Load('GetDlgItemTextW')(hDlg, nIDDlgItem, lpString, cchMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdoubleclicktime
  public static GetDoubleClickTime(): UINT {
    return User32.Load('GetDoubleClickTime')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdpiforsystem
  public static GetDpiForSystem(): UINT {
    return User32.Load('GetDpiForSystem')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdpiforwindow
  public static GetDpiForWindow(hwnd: HWND): UINT {
    return User32.Load('GetDpiForWindow')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdpifromdpiawarenesscontext
  public static GetDpiFromDpiAwarenessContext(value: DPI_AWARENESS_CONTEXT): UINT {
    return User32.Load('GetDpiFromDpiAwarenessContext')(value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getfocus
  public static GetFocus(): HWND {
    return User32.Load('GetFocus')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getforegroundwindow
  public static GetForegroundWindow(): HWND {
    return User32.Load('GetForegroundWindow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getgestureconfig
  public static GetGestureConfig(hwnd: HWND, dwReserved: DWORD, dwFlags: DWORD, pcIDs: PUINT, pGestureConfig: PGESTURECONFIG, cbSize: UINT): BOOL {
    return User32.Load('GetGestureConfig')(hwnd, dwReserved, dwFlags, pcIDs, pGestureConfig, cbSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getgestureextraargs
  public static GetGestureExtraArgs(hGestureInfo: HGESTUREINFO, cbExtraArgs: UINT, pExtraArgs: PBYTE): BOOL {
    return User32.Load('GetGestureExtraArgs')(hGestureInfo, cbExtraArgs, pExtraArgs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getgestureinfo
  public static GetGestureInfo(hGestureInfo: HGESTUREINFO, pGestureInfo: PGESTUREINFO): BOOL {
    return User32.Load('GetGestureInfo')(hGestureInfo, pGestureInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getguiresources
  public static GetGuiResources(hProcess: HANDLE, uiFlags: DWORD): DWORD {
    return User32.Load('GetGuiResources')(hProcess, uiFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getguithreadinfo
  public static GetGUIThreadInfo(idThread: DWORD, pgui: PGUITHREADINFO): BOOL {
    return User32.Load('GetGUIThreadInfo')(idThread, pgui);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-geticoninfo
  public static GetIconInfo(hIcon: HICON, piconinfo: PICONINFO): BOOL {
    return User32.Load('GetIconInfo')(hIcon, piconinfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-geticoninfoexw
  public static GetIconInfoExW(hicon: HICON, piconinfo: PICONINFOEXW): BOOL {
    return User32.Load('GetIconInfoExW')(hicon, piconinfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getinputstate
  public static GetInputState(): BOOL {
    return User32.Load('GetInputState')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getkeyboardlayout
  public static GetKeyboardLayout(idThread: DWORD): HKL {
    return User32.Load('GetKeyboardLayout')(idThread);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getkeyboardlayoutlist
  public static GetKeyboardLayoutList(nBuff: int, lpList: HKL): int {
    return User32.Load('GetKeyboardLayoutList')(nBuff, lpList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getkeyboardlayoutnamew
  public static GetKeyboardLayoutNameW(pwszKLID: LPWSTR): BOOL {
    return User32.Load('GetKeyboardLayoutNameW')(pwszKLID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getkeyboardstate
  public static GetKeyboardState(lpKeyState: PBYTE): BOOL {
    return User32.Load('GetKeyboardState')(lpKeyState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getkeyboardtype
  public static GetKeyboardType(nTypeFlag: int): int {
    return User32.Load('GetKeyboardType')(nTypeFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getkeynametextw
  public static GetKeyNameTextW(lParam: LONG, lpString: LPWSTR, cchSize: int): int {
    return User32.Load('GetKeyNameTextW')(lParam, lpString, cchSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getkeystate
  public static GetKeyState(nVirtKey: int): SHORT {
    return User32.Load('GetKeyState')(nVirtKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getlastactivepopup
  public static GetLastActivePopup(hWnd: HWND): HWND {
    return User32.Load('GetLastActivePopup')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getlastinputinfo
  public static GetLastInputInfo(plii: PLASTINPUTINFO): BOOL {
    return User32.Load('GetLastInputInfo')(plii);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getlayeredwindowattributes
  public static GetLayeredWindowAttributes(hwnd: HWND, pcrKey: LPDWORD | NULL, pbAlpha: LPBYTE | NULL, pdwFlags: LPDWORD | NULL): BOOL {
    return User32.Load('GetLayeredWindowAttributes')(hwnd, pcrKey, pbAlpha, pdwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getlistboxinfo
  public static GetListBoxInfo(hwnd: HWND): DWORD {
    return User32.Load('GetListBoxInfo')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmenu
  public static GetMenu(hWnd: HWND): HMENU {
    return User32.Load('GetMenu')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmenubarinfo
  public static GetMenuBarInfo(hwnd: HWND, idObject: LONG, idItem: LONG, pmbi: PMENUBARINFO): BOOL {
    return User32.Load('GetMenuBarInfo')(hwnd, idObject, idItem, pmbi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmenucheckmarkdimensions
  public static GetMenuCheckMarkDimensions(): LONG {
    return User32.Load('GetMenuCheckMarkDimensions')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmenucontexthelpid
  public static GetMenuContextHelpId(unnamedParam1: HMENU): DWORD {
    return User32.Load('GetMenuContextHelpId')(unnamedParam1);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmenudefaultitem
  public static GetMenuDefaultItem(hMenu: HMENU, fByPos: UINT, gmdiFlags: UINT): UINT {
    return User32.Load('GetMenuDefaultItem')(hMenu, fByPos, gmdiFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmenuinfo
  public static GetMenuInfo(unnamedParam1: HMENU, unnamedParam2: LPMENUINFO): BOOL {
    return User32.Load('GetMenuInfo')(unnamedParam1, unnamedParam2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmenuitemcount
  public static GetMenuItemCount(hMenu: HMENU): int {
    return User32.Load('GetMenuItemCount')(hMenu);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmenuitemid
  public static GetMenuItemID(hMenu: HMENU, nPos: int): UINT {
    return User32.Load('GetMenuItemID')(hMenu, nPos);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmenuiteminfow
  public static GetMenuItemInfoW(hmenu: HMENU, item: UINT, fByPosition: BOOL, lpmii: LPMENUITEMINFOW): BOOL {
    return User32.Load('GetMenuItemInfoW')(hmenu, item, fByPosition, lpmii);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmenuitemrect
  public static GetMenuItemRect(hWnd: HWND | 0n, hMenu: HMENU, uItem: UINT, lprcItem: LPRECT): BOOL {
    return User32.Load('GetMenuItemRect')(hWnd, hMenu, uItem, lprcItem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmenustate
  public static GetMenuState(hMenu: HMENU, uId: UINT, uFlags: UINT): UINT {
    return User32.Load('GetMenuState')(hMenu, uId, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmenustringw
  public static GetMenuStringW(hMenu: HMENU, uIDItem: UINT, lpString: LPWSTR | NULL, cchMax: int, flags: UINT): int {
    return User32.Load('GetMenuStringW')(hMenu, uIDItem, lpString, cchMax, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmessageextrainfo
  public static GetMessageExtraInfo(): LPARAM {
    return User32.Load('GetMessageExtraInfo')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmessagepos
  public static GetMessagePos(): DWORD {
    return User32.Load('GetMessagePos')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmessagetime
  public static GetMessageTime(): LONG {
    return User32.Load('GetMessageTime')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmessagew
  public static GetMessageW(lpMsg: LPMSG, hWnd: HWND | 0n, wMsgFilterMin: UINT, wMsgFilterMax: UINT): BOOL {
    return User32.Load('GetMessageW')(lpMsg, hWnd, wMsgFilterMin, wMsgFilterMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmonitorinfow
  public static GetMonitorInfoW(hMonitor: HMONITOR, lpmi: LPMONITORINFO): BOOL {
    return User32.Load('GetMonitorInfoW')(hMonitor, lpmi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmousemovepointsex
  public static GetMouseMovePointsEx(cbSize: UINT, lppt: LPMOUSEMOVEPOINT, lpptBuf: LPMOUSEMOVEPOINT, nBufPoints: int, resolution: DWORD): int {
    return User32.Load('GetMouseMovePointsEx')(cbSize, lppt, lpptBuf, nBufPoints, resolution);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getnextdlggroupitem
  public static GetNextDlgGroupItem(hDlg: HWND, hCtl: HWND | 0n, bPrevious: BOOL): HWND {
    return User32.Load('GetNextDlgGroupItem')(hDlg, hCtl, bPrevious);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getnextdlgtabitem
  public static GetNextDlgTabItem(hDlg: HWND, hCtl: HWND | 0n, bPrevious: BOOL): HWND {
    return User32.Load('GetNextDlgTabItem')(hDlg, hCtl, bPrevious);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getopenclipboardwindow
  public static GetOpenClipboardWindow(): HWND {
    return User32.Load('GetOpenClipboardWindow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getparent
  public static GetParent(hWnd: HWND): HWND {
    return User32.Load('GetParent')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getphysicalcursorpos
  public static GetPhysicalCursorPos(lpPoint: LPPOINT): BOOL {
    return User32.Load('GetPhysicalCursorPos')(lpPoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointercursorid
  public static GetPointerCursorId(pointerId: UINT32, cursorId: PUINT): BOOL {
    return User32.Load('GetPointerCursorId')(pointerId, cursorId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointerdevice
  public static GetPointerDevice(device: HANDLE, pointerDevice: POINTER_DEVICE_INFO): BOOL {
    return User32.Load('GetPointerDevice')(device, pointerDevice);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointerdevicecursors
  public static GetPointerDeviceCursors(device: HANDLE, cursorCount: UINT32, deviceCursors: POINTER_DEVICE_CURSOR_INFO): BOOL {
    return User32.Load('GetPointerDeviceCursors')(device, cursorCount, deviceCursors);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointerdeviceproperties
  public static GetPointerDeviceProperties(device: HANDLE, propertyCount: UINT32, pointerProperties: POINTER_DEVICE_PROPERTY): BOOL {
    return User32.Load('GetPointerDeviceProperties')(device, propertyCount, pointerProperties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointerdevicerects
  public static GetPointerDeviceRects(device: HANDLE, pointerDeviceRect: LPRECT, displayRect: LPRECT): BOOL {
    return User32.Load('GetPointerDeviceRects')(device, pointerDeviceRect, displayRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointerdevices
  public static GetPointerDevices(deviceCount: UINT32, pointerDevices: POINTER_DEVICE_INFO | NULL): BOOL {
    return User32.Load('GetPointerDevices')(deviceCount, pointerDevices);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointerframeinfo
  public static GetPointerFrameInfo(pointerId: UINT32, pointerCount: PUINT, pointerInfo: POINTER_INFO): BOOL {
    return User32.Load('GetPointerFrameInfo')(pointerId, pointerCount, pointerInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointerframeinfohistory
  public static GetPointerFrameInfoHistory(pointerId: UINT32, entriesCount: UINT32, pointerCount: UINT32, pointerInfo: POINTER_INFO): BOOL {
    return User32.Load('GetPointerFrameInfoHistory')(pointerId, entriesCount, pointerCount, pointerInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointerframepeninfo
  public static GetPointerFramePenInfo(pointerId: UINT32, pointerCount: UINT32, penInfo: POINTER_PEN_INFO): BOOL {
    return User32.Load('GetPointerFramePenInfo')(pointerId, pointerCount, penInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointerframepeninfohistory
  public static GetPointerFramePenInfoHistory(pointerId: UINT32, entriesCount: UINT32, pointerCount: UINT32, penInfo: POINTER_PEN_INFO): BOOL {
    return User32.Load('GetPointerFramePenInfoHistory')(pointerId, entriesCount, pointerCount, penInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointerframetouchinfo
  public static GetPointerFrameTouchInfo(pointerId: UINT32, pointerCount: UINT32, touchInfo: POINTER_TOUCH_INFO): BOOL {
    return User32.Load('GetPointerFrameTouchInfo')(pointerId, pointerCount, touchInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointerframetouchinfohistory
  public static GetPointerFrameTouchInfoHistory(pointerId: UINT32, entriesCount: UINT32, pointerCount: UINT32, touchInfo: POINTER_TOUCH_INFO): BOOL {
    return User32.Load('GetPointerFrameTouchInfoHistory')(pointerId, entriesCount, pointerCount, touchInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointerinfo
  public static GetPointerInfo(pointerId: UINT32, pointerInfo: POINTER_INFO): BOOL {
    return User32.Load('GetPointerInfo')(pointerId, pointerInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointerinfohistory
  public static GetPointerInfoHistory(pointerId: UINT32, entriesCount: UINT32, pointerInfo: POINTER_INFO): BOOL {
    return User32.Load('GetPointerInfoHistory')(pointerId, entriesCount, pointerInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointerinputtransform
  public static GetPointerInputTransform(pointerId: UINT32, historyCount: UINT32, inputTransform: INPUT_TRANSFORM): BOOL {
    return User32.Load('GetPointerInputTransform')(pointerId, historyCount, inputTransform);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointerpeninfo
  public static GetPointerPenInfo(pointerId: UINT32, penInfo: POINTER_PEN_INFO): BOOL {
    return User32.Load('GetPointerPenInfo')(pointerId, penInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointertouchinfo
  public static GetPointerTouchInfo(pointerId: UINT32, touchInfo: POINTER_TOUCH_INFO): BOOL {
    return User32.Load('GetPointerTouchInfo')(pointerId, touchInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpointertype
  public static GetPointerType(pointerId: UINT32, pointerType: POINTER_INPUT_TYPE): BOOL {
    return User32.Load('GetPointerType')(pointerId, pointerType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpriorityclipboardformat
  public static GetPriorityClipboardFormat(paFormatPriorityList: UINT, cFormats: int): int {
    return User32.Load('GetPriorityClipboardFormat')(paFormatPriorityList, cFormats);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getprocessdefaultlayout
  public static GetProcessDefaultLayout(pdwDefaultLayout: LPDWORD): BOOL {
    return User32.Load('GetProcessDefaultLayout')(pdwDefaultLayout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getprocesswindowstation
  public static GetProcessWindowStation(): HWINSTA {
    return User32.Load('GetProcessWindowStation')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpropa
  public static GetPropA(hWnd: HWND, lpString: LPCSTR): HANDLE {
    return User32.Load('GetPropA')(hWnd, lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getpropw
  public static GetPropW(hWnd: HWND, lpString: LPCWSTR): HANDLE {
    return User32.Load('GetPropW')(hWnd, lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getqueuestatus
  public static GetQueueStatus(flags: UINT): DWORD {
    return User32.Load('GetQueueStatus')(flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getrawinputbuffer
  public static GetRawInputBuffer(pData: PRAWINPUT | NULL, pcbSize: PUINT, cbSizeHeader: UINT): UINT {
    return User32.Load('GetRawInputBuffer')(pData, pcbSize, cbSizeHeader);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getrawinputdata
  public static GetRawInputData(hRawInput: HRAWINPUT, uiCommand: UINT, pData: LPVOID | NULL, pcbSize: PUINT, cbSizeHeader: UINT): UINT {
    return User32.Load('GetRawInputData')(hRawInput, uiCommand, pData, pcbSize, cbSizeHeader);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getrawinputdeviceinfow
  public static GetRawInputDeviceInfoW(hDevice: HANDLE, uiCommand: UINT, pData: LPVOID | NULL, pcbSize: PUINT): UINT {
    return User32.Load('GetRawInputDeviceInfoW')(hDevice, uiCommand, pData, pcbSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getrawinputdevicelist
  public static GetRawInputDeviceList(pRawInputDeviceList: PRAWINPUTDEVICELIST | NULL, puiNumDevices: PUINT, cbSize: UINT): UINT {
    return User32.Load('GetRawInputDeviceList')(pRawInputDeviceList, puiNumDevices, cbSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getrawpointerdevicedata
  public static GetRawPointerDeviceData(pointerId: UINT32, historyCount: UINT32, propertiesCount: UINT32, pProperties: POINTER_DEVICE_PROPERTY, pValues: LPINT): BOOL {
    return User32.Load('GetRawPointerDeviceData')(pointerId, historyCount, propertiesCount, pProperties, pValues);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getregisteredrawinputdevices
  public static GetRegisteredRawInputDevices(pRawInputDevices: PRAWINPUTDEVICE | NULL, puiNumDevices: PUINT, cbSize: UINT): UINT {
    return User32.Load('GetRegisteredRawInputDevices')(pRawInputDevices, puiNumDevices, cbSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getscrollbarinfo
  public static GetScrollBarInfo(hwnd: HWND, idObject: LONG, psbi: PSCROLLBARINFO): BOOL {
    return User32.Load('GetScrollBarInfo')(hwnd, idObject, psbi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getscrollinfo
  public static GetScrollInfo(hwnd: HWND, nBar: int, lpsi: LPSCROLLINFO): BOOL {
    return User32.Load('GetScrollInfo')(hwnd, nBar, lpsi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getscrollpos
  public static GetScrollPos(hWnd: HWND, nBar: int): int {
    return User32.Load('GetScrollPos')(hWnd, nBar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getscrollrange
  public static GetScrollRange(hWnd: HWND, nBar: int, lpMinPos: LPINT, lpMaxPos: LPINT): BOOL {
    return User32.Load('GetScrollRange')(hWnd, nBar, lpMinPos, lpMaxPos);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getshellwindow
  public static GetShellWindow(): HWND {
    return User32.Load('GetShellWindow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsubmenu
  public static GetSubMenu(hMenu: HMENU, nPos: int): HMENU {
    return User32.Load('GetSubMenu')(hMenu, nPos);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsyscolor
  public static GetSysColor(nIndex: int): DWORD {
    return User32.Load('GetSysColor')(nIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsyscolorbrush
  public static GetSysColorBrush(nIndex: int): HBRUSH {
    return User32.Load('GetSysColorBrush')(nIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsystemdpiforprocess
  public static GetSystemDpiForProcess(hProcess: HANDLE): UINT {
    return User32.Load('GetSystemDpiForProcess')(hProcess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsystemmenu
  public static GetSystemMenu(hWnd: HWND, bRevert: BOOL): HMENU {
    return User32.Load('GetSystemMenu')(hWnd, bRevert);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsystemmetrics
  public static GetSystemMetrics(nIndex: int): int {
    return User32.Load('GetSystemMetrics')(nIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsystemmetricsfordpi
  public static GetSystemMetricsForDpi(nIndex: int, dpi: UINT): int {
    return User32.Load('GetSystemMetricsForDpi')(nIndex, dpi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-gettabbedtextextentw
  public static GetTabbedTextExtentW(hdc: HDC, lpString: LPCWSTR, chCount: int, nTabPositions: int, lpnTabStopPositions: LPINT): DWORD {
    return User32.Load('GetTabbedTextExtentW')(hdc, lpString, chCount, nTabPositions, lpnTabStopPositions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getthreaddesktop
  public static GetThreadDesktop(dwThreadId: DWORD): HDESK {
    return User32.Load('GetThreadDesktop')(dwThreadId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getthreaddpiawarenesscontext
  public static GetThreadDpiAwarenessContext(): DPI_AWARENESS_CONTEXT {
    return User32.Load('GetThreadDpiAwarenessContext')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getthreaddpihostingbehavior
  public static GetThreadDpiHostingBehavior(): DPI_HOSTING_BEHAVIOR {
    return User32.Load('GetThreadDpiHostingBehavior')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-gettitlebarinfo
  public static GetTitleBarInfo(hwnd: HWND, pti: PTITLEBARINFO): BOOL {
    return User32.Load('GetTitleBarInfo')(hwnd, pti);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-gettopwindow
  public static GetTopWindow(hWnd: HWND | 0n): HWND {
    return User32.Load('GetTopWindow')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-gettouchinputinfo
  public static GetTouchInputInfo(hTouchInput: HTOUCHINPUT, cInputs: UINT, pInputs: PTOUCHINPUT, cbSize: int): BOOL {
    return User32.Load('GetTouchInputInfo')(hTouchInput, cInputs, pInputs, cbSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getunpredictedmessagepos
  public static GetUnpredictedMessagePos(): DWORD {
    return User32.Load('GetUnpredictedMessagePos')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getupdatedclipboardformats
  public static GetUpdatedClipboardFormats(lpuiFormats: PUINT, cFormats: UINT, pcFormatsOut: PUINT): BOOL {
    return User32.Load('GetUpdatedClipboardFormats')(lpuiFormats, cFormats, pcFormatsOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getupdaterect
  public static GetUpdateRect(hWnd: HWND, lpRect: LPRECT | NULL, bErase: BOOL): BOOL {
    return User32.Load('GetUpdateRect')(hWnd, lpRect, bErase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getupdatergn
  public static GetUpdateRgn(hWnd: HWND, hRgn: HRGN, bErase: BOOL): int {
    return User32.Load('GetUpdateRgn')(hWnd, hRgn, bErase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getuserobjectinformationw
  public static GetUserObjectInformationW(hObj: HANDLE, nIndex: int, pvInfo: PVOID | NULL, nLength: DWORD, lpnLengthNeeded: LPDWORD | NULL): BOOL {
    return User32.Load('GetUserObjectInformationW')(hObj, nIndex, pvInfo, nLength, lpnLengthNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getuserobjectsecurity
  public static GetUserObjectSecurity(hObj: HANDLE, pSIRequested: PSECURITY_INFORMATION, pSID: PSECURITY_DESCRIPTOR, nLength: DWORD, lpnLengthNeeded: LPDWORD): BOOL {
    return User32.Load('GetUserObjectSecurity')(hObj, pSIRequested, pSID, nLength, lpnLengthNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindow
  public static GetWindow(hWnd: HWND, uCmd: UINT): HWND {
    return User32.Load('GetWindow')(hWnd, uCmd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowcontexthelpid
  public static GetWindowContextHelpId(unnamedParam1: HWND): DWORD {
    return User32.Load('GetWindowContextHelpId')(unnamedParam1);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowdc
  public static GetWindowDC(hWnd: HWND | 0n): HDC {
    return User32.Load('GetWindowDC')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowdisplayaffinity
  public static GetWindowDisplayAffinity(hWnd: HWND, pdwAffinity: LPDWORD): BOOL {
    return User32.Load('GetWindowDisplayAffinity')(hWnd, pdwAffinity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowdpiawarenesscontext
  public static GetWindowDpiAwarenessContext(hwnd: HWND): DPI_AWARENESS_CONTEXT {
    return User32.Load('GetWindowDpiAwarenessContext')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowdpihostingbehavior
  public static GetWindowDpiHostingBehavior(hwnd: HWND): DPI_HOSTING_BEHAVIOR {
    return User32.Load('GetWindowDpiHostingBehavior')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowfeedbacksetting
  public static GetWindowFeedbackSetting(hwnd: HWND, feedback: FEEDBACK_TYPE, dwFlags: DWORD, pSize: PUINT, config: PVOID | NULL): BOOL {
    return User32.Load('GetWindowFeedbackSetting')(hwnd, feedback, dwFlags, pSize, config);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowinfo
  public static GetWindowInfo(hwnd: HWND, pwi: PWINDOWINFO): BOOL {
    return User32.Load('GetWindowInfo')(hwnd, pwi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowlongptrw
  public static GetWindowLongPtrW(hWnd: HWND, nIndex: int): LONG_PTR {
    return User32.Load('GetWindowLongPtrW')(hWnd, nIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowlongw
  public static GetWindowLongW(hWnd: HWND, nIndex: int): LONG {
    return User32.Load('GetWindowLongW')(hWnd, nIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowmodulefilenamew
  public static GetWindowModuleFileNameW(hwnd: HWND, pszFileName: LPWSTR, cchFileNameMax: UINT): UINT {
    return User32.Load('GetWindowModuleFileNameW')(hwnd, pszFileName, cchFileNameMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowplacement
  public static GetWindowPlacement(hWnd: HWND, lpwndpl: WINDOWPLACEMENT): BOOL {
    return User32.Load('GetWindowPlacement')(hWnd, lpwndpl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowrect
  public static GetWindowRect(hWnd: HWND, lpRect: LPRECT): BOOL {
    return User32.Load('GetWindowRect')(hWnd, lpRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowrgn
  public static GetWindowRgn(hWnd: HWND, hRgn: HRGN): int {
    return User32.Load('GetWindowRgn')(hWnd, hRgn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowrgnbox
  public static GetWindowRgnBox(hWnd: HWND, lprc: LPRECT): int {
    return User32.Load('GetWindowRgnBox')(hWnd, lprc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowtextlengthw
  public static GetWindowTextLengthW(hWnd: HWND): int {
    return User32.Load('GetWindowTextLengthW')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowtextw
  public static GetWindowTextW(hWnd: HWND, lpString: LPWSTR, nMaxCount: int): int {
    return User32.Load('GetWindowTextW')(hWnd, lpString, nMaxCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowthreadprocessid
  public static GetWindowThreadProcessId(hWnd: HWND, lpdwProcessId: LPDWORD | NULL): DWORD {
    return User32.Load('GetWindowThreadProcessId')(hWnd, lpdwProcessId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowword
  public static GetWindowWord(hWnd: HWND, nIndex: int): WORD {
    return User32.Load('GetWindowWord')(hWnd, nIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-graystringw
  public static GrayStringW(hDC: HDC, hBrush: HBRUSH, lpOutputFunc: GRAYSTRINGPROC | NULL, lpData: LPARAM, nCount: int, X: int, Y: int, nWidth: int, nHeight: int): BOOL {
    return User32.Load('GrayStringW')(hDC, hBrush, lpOutputFunc, lpData, nCount, X, Y, nWidth, nHeight);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-hidecaret
  public static HideCaret(hWnd: HWND | 0n): BOOL {
    return User32.Load('HideCaret')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-hilitemenuitem
  public static HiliteMenuItem(hWnd: HWND, hMenu: HMENU, uIDHiliteItem: UINT, uHilite: UINT): BOOL {
    return User32.Load('HiliteMenuItem')(hWnd, hMenu, uIDHiliteItem, uHilite);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-inflaterect
  public static InflateRect(lprc: LPRECT, dx: int, dy: int): BOOL {
    return User32.Load('InflateRect')(lprc, dx, dy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-initializetouchinjection
  public static InitializeTouchInjection(maxCount: UINT32, dwMode: DWORD): BOOL {
    return User32.Load('InitializeTouchInjection')(maxCount, dwMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-injectsyntheticpointerinput
  public static InjectSyntheticPointerInput(device: HSYNTHETICPOINTERDEVICE, pointerInfo: POINTER_TYPE_INFO, count: UINT32): BOOL {
    return User32.Load('InjectSyntheticPointerInput')(device, pointerInfo, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-injecttouchinput
  public static InjectTouchInput(count: UINT32, contacts: POINTER_TOUCH_INFO): BOOL {
    return User32.Load('InjectTouchInput')(count, contacts);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-insendmessage
  public static InSendMessage(): BOOL {
    return User32.Load('InSendMessage')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-insendmessageex
  public static InSendMessageEx(lpReserved: LPVOID | NULL): DWORD {
    return User32.Load('InSendMessageEx')(lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-insertmenuitemw
  public static InsertMenuItemW(hmenu: HMENU, item: UINT, fByPosition: BOOL, lpmi: LPCMENUITEMINFOW): BOOL {
    return User32.Load('InsertMenuItemW')(hmenu, item, fByPosition, lpmi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-insertmenuw
  public static InsertMenuW(hMenu: HMENU, uPosition: UINT, uFlags: UINT, uIDNewItem: UINT_PTR, lpNewItem: LPCWSTR | NULL): BOOL {
    return User32.Load('InsertMenuW')(hMenu, uPosition, uFlags, uIDNewItem, lpNewItem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-intersectrect
  public static IntersectRect(lprcDst: LPRECT, lprcSrc1: LPRECT, lprcSrc2: LPRECT): BOOL {
    return User32.Load('IntersectRect')(lprcDst, lprcSrc1, lprcSrc2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-invalidaterect
  public static InvalidateRect(hWnd: HWND | 0n, lpRect: LPRECT | NULL, bErase: BOOL): BOOL {
    return User32.Load('InvalidateRect')(hWnd, lpRect, bErase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-invalidatergn
  public static InvalidateRgn(hWnd: HWND, hRgn: HRGN | 0n, bErase: BOOL): BOOL {
    return User32.Load('InvalidateRgn')(hWnd, hRgn, bErase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-invertrect
  public static InvertRect(hDC: HDC, lprc: LPRECT): BOOL {
    return User32.Load('InvertRect')(hDC, lprc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-ischaralphanumericw
  public static IsCharAlphaNumericW(ch: WCHAR): BOOL {
    return User32.Load('IsCharAlphaNumericW')(ch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-ischaralphaw
  public static IsCharAlphaW(ch: WCHAR): BOOL {
    return User32.Load('IsCharAlphaW')(ch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-ischarlowerw
  public static IsCharLowerW(ch: WCHAR): BOOL {
    return User32.Load('IsCharLowerW')(ch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-ischarupperw
  public static IsCharUpperW(ch: WCHAR): BOOL {
    return User32.Load('IsCharUpperW')(ch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-ischild
  public static IsChild(hWndParent: HWND, hWnd: HWND): BOOL {
    return User32.Load('IsChild')(hWndParent, hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-isclipboardformatavailable
  public static IsClipboardFormatAvailable(format: UINT): BOOL {
    return User32.Load('IsClipboardFormatAvailable')(format);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-isdialogmessagew
  public static IsDialogMessageW(hDlg: HWND, lpMsg: LPMSG): BOOL {
    return User32.Load('IsDialogMessageW')(hDlg, lpMsg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-isdlgbuttonchecked
  public static IsDlgButtonChecked(hDlg: HWND, nIDButton: int): UINT {
    return User32.Load('IsDlgButtonChecked')(hDlg, nIDButton);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-isguithread
  public static IsGUIThread(bConvert: BOOL): BOOL {
    return User32.Load('IsGUIThread')(bConvert);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-ishungappwindow
  public static IsHungAppWindow(hwnd: HWND): BOOL {
    return User32.Load('IsHungAppWindow')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-isiconic
  public static IsIconic(hWnd: HWND): BOOL {
    return User32.Load('IsIconic')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-isimmersiveprocess
  public static IsImmersiveProcess(hProcess: HANDLE): BOOL {
    return User32.Load('IsImmersiveProcess')(hProcess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-ismenu
  public static IsMenu(hMenu: HMENU): BOOL {
    return User32.Load('IsMenu')(hMenu);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-ismouseinpointerenabled
  public static IsMouseInPointerEnabled(): BOOL {
    return User32.Load('IsMouseInPointerEnabled')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-isprocessdpiaware
  public static IsProcessDPIAware(): BOOL {
    return User32.Load('IsProcessDPIAware')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-isrectempty
  public static IsRectEmpty(lprc: LPRECT): BOOL {
    return User32.Load('IsRectEmpty')(lprc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-istouchwindow
  public static IsTouchWindow(hwnd: HWND, pulFlags: PULONG | NULL): BOOL {
    return User32.Load('IsTouchWindow')(hwnd, pulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-isvaliddpiawarenesscontext
  public static IsValidDpiAwarenessContext(value: DPI_AWARENESS_CONTEXT): BOOL {
    return User32.Load('IsValidDpiAwarenessContext')(value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-iswindow
  public static IsWindow(hWnd: HWND): BOOL {
    return User32.Load('IsWindow')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-iswindowarranged
  public static IsWindowArranged(hwnd: HWND): BOOL {
    return User32.Load('IsWindowArranged')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-iswindowenabled
  public static IsWindowEnabled(hWnd: HWND): BOOL {
    return User32.Load('IsWindowEnabled')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-iswindowunicode
  public static IsWindowUnicode(hWnd: HWND): BOOL {
    return User32.Load('IsWindowUnicode')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-iswindowvisible
  public static IsWindowVisible(hWnd: HWND): BOOL {
    return User32.Load('IsWindowVisible')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-iswineventhookinstalled
  public static IsWinEventHookInstalled(event: DWORD): BOOL {
    return User32.Load('IsWinEventHookInstalled')(event);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-iswow64message
  public static IsWow64Message(): BOOL {
    return User32.Load('IsWow64Message')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-iszoomed
  public static IsZoomed(hWnd: HWND): BOOL {
    return User32.Load('IsZoomed')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-killtimer
  public static KillTimer(hWnd: HWND | 0n, uIDEvent: UINT_PTR): BOOL {
    return User32.Load('KillTimer')(hWnd, uIDEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-loadacceleratorsw
  public static LoadAcceleratorsW(hInstance: HINSTANCE, lpTableName: LPCWSTR): HACCEL {
    return User32.Load('LoadAcceleratorsW')(hInstance, lpTableName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-loadbitmapw
  public static LoadBitmapW(hInstance: HINSTANCE | 0n, lpBitmapName: LPCWSTR): HBITMAP {
    return User32.Load('LoadBitmapW')(hInstance, lpBitmapName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-loadcursorfromfilew
  public static LoadCursorFromFileW(lpFileName: LPCWSTR): HCURSOR {
    return User32.Load('LoadCursorFromFileW')(lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-loadcursorw
  public static LoadCursorW(hInstance: HINSTANCE | 0n, lpCursorName: LPCWSTR): HCURSOR {
    return User32.Load('LoadCursorW')(hInstance, lpCursorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-loadiconw
  public static LoadIconW(hInstance: HINSTANCE | 0n, lpIconName: LPCWSTR): HICON {
    return User32.Load('LoadIconW')(hInstance, lpIconName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-loadimagew
  public static LoadImageW(hInst: HINSTANCE | 0n, name: LPCWSTR, type: UINT, cx: int, cy: int, fuLoad: UINT): HANDLE {
    return User32.Load('LoadImageW')(hInst, name, type, cx, cy, fuLoad);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-loadkeyboardlayoutw
  public static LoadKeyboardLayoutW(pwszKLID: LPCWSTR, Flags: UINT): HKL {
    return User32.Load('LoadKeyboardLayoutW')(pwszKLID, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-loadmenuindirectw
  public static LoadMenuIndirectW(lpMenuTemplate: MENUTEMPLATEW): HMENU {
    return User32.Load('LoadMenuIndirectW')(lpMenuTemplate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-loadmenuw
  public static LoadMenuW(hInstance: HINSTANCE, lpMenuName: LPCWSTR): HMENU {
    return User32.Load('LoadMenuW')(hInstance, lpMenuName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-loadstringw
  public static LoadStringW(hInstance: HINSTANCE, uID: UINT, lpBuffer: LPWSTR, cchBufferMax: int): int {
    return User32.Load('LoadStringW')(hInstance, uID, lpBuffer, cchBufferMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-locksetforegroundwindow
  public static LockSetForegroundWindow(uLockCode: UINT): BOOL {
    return User32.Load('LockSetForegroundWindow')(uLockCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-lockwindowupdate
  public static LockWindowUpdate(hWndLock: HWND | 0n): BOOL {
    return User32.Load('LockWindowUpdate')(hWndLock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-lockworkstation
  public static LockWorkStation(): BOOL {
    return User32.Load('LockWorkStation')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-logicaltophysicalpoint
  public static LogicalToPhysicalPoint(hWnd: HWND, lpPoint: LPPOINT): BOOL {
    return User32.Load('LogicalToPhysicalPoint')(hWnd, lpPoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-logicaltophysicalpointforpermonitordpi
  public static LogicalToPhysicalPointForPerMonitorDPI(hWnd: HWND, lpPoint: LPPOINT): BOOL {
    return User32.Load('LogicalToPhysicalPointForPerMonitorDPI')(hWnd, lpPoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-lookupiconidfromdirectory
  public static LookupIconIdFromDirectory(presbits: PBYTE, fIcon: BOOL): int {
    return User32.Load('LookupIconIdFromDirectory')(presbits, fIcon);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-lookupiconidfromdirectoryex
  public static LookupIconIdFromDirectoryEx(presbits: PBYTE, fIcon: BOOL, cxDesired: int, cyDesired: int, Flags: UINT): int {
    return User32.Load('LookupIconIdFromDirectoryEx')(presbits, fIcon, cxDesired, cyDesired, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-mapdialogrect
  public static MapDialogRect(hDlg: HWND, lpRect: LPRECT): BOOL {
    return User32.Load('MapDialogRect')(hDlg, lpRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-mapvirtualkeyexw
  public static MapVirtualKeyExW(uCode: UINT, uMapType: UINT, dwhkl: HKL): UINT {
    return User32.Load('MapVirtualKeyExW')(uCode, uMapType, dwhkl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-mapvirtualkeyw
  public static MapVirtualKeyW(uCode: UINT, uMapType: UINT): UINT {
    return User32.Load('MapVirtualKeyW')(uCode, uMapType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-mapwindowpoints
  public static MapWindowPoints(hWndFrom: HWND | 0n, hWndTo: HWND | 0n, lpPoints: LPPOINT, cPoints: UINT): int {
    return User32.Load('MapWindowPoints')(hWndFrom, hWndTo, lpPoints, cPoints);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-menuitemfrompoint
  public static MenuItemFromPoint(hWnd: HWND | 0n, hMenu: HMENU, ptScreen: PACKED_POINT): int {
    return User32.Load('MenuItemFromPoint')(hWnd, hMenu, ptScreen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-messagebeep
  public static MessageBeep(uType: UINT): BOOL {
    return User32.Load('MessageBeep')(uType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-messageboxexw
  public static MessageBoxExW(hWnd: HWND | 0n, lpText: LPCWSTR, lpCaption: LPCWSTR, uType: UINT, wLanguageId: WORD): int {
    return User32.Load('MessageBoxExW')(hWnd, lpText, lpCaption, uType, wLanguageId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-messageboxindirectw
  public static MessageBoxIndirectW(lpmbp: MSGBOXPARAMSW): int {
    return User32.Load('MessageBoxIndirectW')(lpmbp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-messageboxw
  public static MessageBoxW(hWnd: HWND | 0n, lpText: LPCWSTR, lpCaption: LPCWSTR, uType: UINT): int {
    return User32.Load('MessageBoxW')(hWnd, lpText, lpCaption, uType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-modifymenuw
  public static ModifyMenuW(hMnu: HMENU, uPosition: UINT, uFlags: UINT, uIDNewItem: UINT_PTR, lpNewItem: LPCWSTR | NULL): BOOL {
    return User32.Load('ModifyMenuW')(hMnu, uPosition, uFlags, uIDNewItem, lpNewItem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-monitorfrompoint
  public static MonitorFromPoint(pt: PACKED_POINT, dwFlags: DWORD): HMONITOR {
    return User32.Load('MonitorFromPoint')(pt, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-monitorfromrect
  public static MonitorFromRect(lprc: LPCRECT, dwFlags: DWORD): HMONITOR {
    return User32.Load('MonitorFromRect')(lprc, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-monitorfromwindow
  public static MonitorFromWindow(hwnd: HWND, dwFlags: DWORD): HMONITOR {
    return User32.Load('MonitorFromWindow')(hwnd, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-movewindow
  public static MoveWindow(hWnd: HWND, X: int, Y: int, nWidth: int, nHeight: int, bRepaint: BOOL): BOOL {
    return User32.Load('MoveWindow')(hWnd, X, Y, nWidth, nHeight, bRepaint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-msgwaitformultipleobjects
  public static MsgWaitForMultipleObjects(nCount: DWORD, pHandles: HANDLE, fWaitAll: BOOL, dwMilliseconds: DWORD, dwWakeMask: DWORD): DWORD {
    return User32.Load('MsgWaitForMultipleObjects')(nCount, pHandles, fWaitAll, dwMilliseconds, dwWakeMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-msgwaitformultipleobjectsex
  public static MsgWaitForMultipleObjectsEx(nCount: DWORD, pHandles: HANDLE, dwMilliseconds: DWORD, dwWakeMask: DWORD, dwFlags: DWORD): DWORD {
    return User32.Load('MsgWaitForMultipleObjectsEx')(nCount, pHandles, dwMilliseconds, dwWakeMask, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-notifywinevent
  public static NotifyWinEvent(event: DWORD, hwnd: HWND, idObject: LONG, idChild: LONG): VOID {
    return User32.Load('NotifyWinEvent')(event, hwnd, idObject, idChild);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-oemkeyscan
  public static OemKeyScan(wOemChar: WORD): DWORD {
    return User32.Load('OemKeyScan')(wOemChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-oemtocharbuffw
  public static OemToCharBuffW(lpszSrc: LPCSTR, lpszDst: LPWSTR, cchDstLength: DWORD): BOOL {
    return User32.Load('OemToCharBuffW')(lpszSrc, lpszDst, cchDstLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-oemtocharw
  public static OemToCharW(pSrc: LPCSTR, pDst: LPWSTR): BOOL {
    return User32.Load('OemToCharW')(pSrc, pDst);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-offsetrect
  public static OffsetRect(lprc: LPRECT, dx: int, dy: int): BOOL {
    return User32.Load('OffsetRect')(lprc, dx, dy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-openclipboard
  public static OpenClipboard(hWndNewOwner: HWND | 0n): BOOL {
    return User32.Load('OpenClipboard')(hWndNewOwner);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-opendesktopw
  public static OpenDesktopW(lpszDesktop: LPCWSTR, dwFlags: DWORD, fInherit: BOOL, dwDesiredAccess: ACCESS_MASK): HDESK {
    return User32.Load('OpenDesktopW')(lpszDesktop, dwFlags, fInherit, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-openicon
  public static OpenIcon(hWnd: HWND): BOOL {
    return User32.Load('OpenIcon')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-openinputdesktop
  public static OpenInputDesktop(dwFlags: DWORD, fInherit: BOOL, dwDesiredAccess: ACCESS_MASK): HDESK {
    return User32.Load('OpenInputDesktop')(dwFlags, fInherit, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-openwindowstationw
  public static OpenWindowStationW(lpszWinSta: LPCWSTR, fInherit: BOOL, dwDesiredAccess: ACCESS_MASK): HWINSTA {
    return User32.Load('OpenWindowStationW')(lpszWinSta, fInherit, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-paintdesktop
  public static PaintDesktop(hdc: HDC): BOOL {
    return User32.Load('PaintDesktop')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-peekmessagew
  public static PeekMessageW(lpMsg: LPMSG, hWnd: HWND | 0n, wMsgFilterMin: UINT, wMsgFilterMax: UINT, wRemoveMsg: UINT): BOOL {
    return User32.Load('PeekMessageW')(lpMsg, hWnd, wMsgFilterMin, wMsgFilterMax, wRemoveMsg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-physicaltologicalpoint
  public static PhysicalToLogicalPoint(hWnd: HWND, lpPoint: LPPOINT): BOOL {
    return User32.Load('PhysicalToLogicalPoint')(hWnd, lpPoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-physicaltologicalpointforpermonitordpi
  public static PhysicalToLogicalPointForPerMonitorDPI(hWnd: HWND, lpPoint: LPPOINT): BOOL {
    return User32.Load('PhysicalToLogicalPointForPerMonitorDPI')(hWnd, lpPoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-postmessagew
  public static PostMessageW(hWnd: HWND | 0n, Msg: UINT, wParam: WPARAM, lParam: LPARAM): BOOL {
    return User32.Load('PostMessageW')(hWnd, Msg, wParam, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-postquitmessage
  public static PostQuitMessage(nExitCode: int): VOID {
    return User32.Load('PostQuitMessage')(nExitCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-postthreadmessagew
  public static PostThreadMessageW(idThread: DWORD, Msg: UINT, wParam: WPARAM, lParam: LPARAM): BOOL {
    return User32.Load('PostThreadMessageW')(idThread, Msg, wParam, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-printwindow
  public static PrintWindow(hwnd: HWND, hdcBlt: HDC, nFlags: UINT): BOOL {
    return User32.Load('PrintWindow')(hwnd, hdcBlt, nFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-privateextracticonsw
  public static PrivateExtractIconsW(szFileName: LPCWSTR, nIconIndex: int, cxIcon: int, cyIcon: int, phicon: HICON, piconid: UINT, nIcons: UINT, flags: UINT): UINT {
    return User32.Load('PrivateExtractIconsW')(szFileName, nIconIndex, cxIcon, cyIcon, phicon, piconid, nIcons, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-ptinrect
  public static PtInRect(lprc: LPRECT, pt: PACKED_POINT): BOOL {
    return User32.Load('PtInRect')(lprc, pt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-querydisplayconfig
  public static QueryDisplayConfig(
    flags: UINT32,
    numPathArrayElements: PUINT,
    pathArray: DISPLAYCONFIG_PATH_INFO,
    numModeInfoArrayElements: PUINT,
    modeInfoArray: DISPLAYCONFIG_MODE_INFO,
    currentTopologyId: DISPLAYCONFIG_TOPOLOGY_ID
  ): LONG {
    return User32.Load('QueryDisplayConfig')(flags, numPathArrayElements, pathArray, numModeInfoArrayElements, modeInfoArray, currentTopologyId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-realchildwindowfrompoint
  public static RealChildWindowFromPoint(hwndParent: HWND, ptParentClientCoords: PACKED_POINT): HWND {
    return User32.Load('RealChildWindowFromPoint')(hwndParent, ptParentClientCoords);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-realgetwindowclassw
  public static RealGetWindowClassW(hwnd: HWND, ptszClassName: LPWSTR, cchClassNameMax: UINT): UINT {
    return User32.Load('RealGetWindowClassW')(hwnd, ptszClassName, cchClassNameMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-redrawwindow
  public static RedrawWindow(hWnd: HWND | 0n, lprcUpdate: LPRECT | NULL, hrgnUpdate: HRGN | 0n, flags: UINT): BOOL {
    return User32.Load('RedrawWindow')(hWnd, lprcUpdate, hrgnUpdate, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerclassexw
  public static RegisterClassExW(unnamedParam1: WNDCLASSEXW): ATOM {
    return User32.Load('RegisterClassExW')(unnamedParam1);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerclassw
  public static RegisterClassW(lpWndClass: WNDCLASSW): ATOM {
    return User32.Load('RegisterClassW')(lpWndClass);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerclipboardformatw
  public static RegisterClipboardFormatW(lpszFormat: LPCWSTR): UINT {
    return User32.Load('RegisterClipboardFormatW')(lpszFormat);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerdevicenotificationw
  public static RegisterDeviceNotificationW(hRecipient: HANDLE, NotificationFilter: LPVOID, Flags: DWORD): HDEVNOTIFY {
    return User32.Load('RegisterDeviceNotificationW')(hRecipient, NotificationFilter, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerhotkey
  public static RegisterHotKey(hWnd: HWND | 0n, id: int, fsModifiers: UINT, vk: UINT): BOOL {
    return User32.Load('RegisterHotKey')(hWnd, id, fsModifiers, vk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerpointerdevicenotifications
  public static RegisterPointerDeviceNotifications(window: HWND, notifyRange: BOOL): BOOL {
    return User32.Load('RegisterPointerDeviceNotifications')(window, notifyRange);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerpointerinputtarget
  public static RegisterPointerInputTarget(hwnd: HWND, pointerType: POINTER_INPUT_TYPE): BOOL {
    return User32.Load('RegisterPointerInputTarget')(hwnd, pointerType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerpowersettingnotification
  public static RegisterPowerSettingNotification(hRecipient: HANDLE, PowerSettingGuid: LPCGUID, Flags: DWORD): HPOWERNOTIFY {
    return User32.Load('RegisterPowerSettingNotification')(hRecipient, PowerSettingGuid, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerrawinputdevices
  public static RegisterRawInputDevices(pRawInputDevices: PCRAWINPUTDEVICE, uiNumDevices: UINT, cbSize: UINT): BOOL {
    return User32.Load('RegisterRawInputDevices')(pRawInputDevices, uiNumDevices, cbSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registershellhookwindow
  public static RegisterShellHookWindow(hwnd: HWND): BOOL {
    return User32.Load('RegisterShellHookWindow')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registersuspendresumenotification
  public static RegisterSuspendResumeNotification(hRecipient: HANDLE, Flags: DWORD): HPOWERNOTIFY {
    return User32.Load('RegisterSuspendResumeNotification')(hRecipient, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registertouchhittestingwindow
  public static RegisterTouchHitTestingWindow(hwnd: HWND, value: ULONG): BOOL {
    return User32.Load('RegisterTouchHitTestingWindow')(hwnd, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registertouchwindow
  public static RegisterTouchWindow(hwnd: HWND, ulFlags: ULONG): BOOL {
    return User32.Load('RegisterTouchWindow')(hwnd, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerwindowmessagew
  public static RegisterWindowMessageW(lpString: LPCWSTR): UINT {
    return User32.Load('RegisterWindowMessageW')(lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-releasecapture
  public static ReleaseCapture(): BOOL {
    return User32.Load('ReleaseCapture')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-releasedc
  public static ReleaseDC(hWnd: HWND | 0n, hDC: HDC): int {
    return User32.Load('ReleaseDC')(hWnd, hDC);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-removeclipboardformatlistener
  public static RemoveClipboardFormatListener(hwnd: HWND): BOOL {
    return User32.Load('RemoveClipboardFormatListener')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-removemenu
  public static RemoveMenu(hMenu: HMENU, uPosition: UINT, uFlags: UINT): BOOL {
    return User32.Load('RemoveMenu')(hMenu, uPosition, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-removepropa
  public static RemovePropA(hWnd: HWND, lpString: LPCSTR): HANDLE {
    return User32.Load('RemovePropA')(hWnd, lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-removepropw
  public static RemovePropW(hWnd: HWND, lpString: LPCWSTR): HANDLE {
    return User32.Load('RemovePropW')(hWnd, lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-replymessage
  public static ReplyMessage(lResult: LRESULT): BOOL {
    return User32.Load('ReplyMessage')(lResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-screentoclient
  public static ScreenToClient(hWnd: HWND, lpPoint: LPPOINT): BOOL {
    return User32.Load('ScreenToClient')(hWnd, lpPoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-scrolldc
  public static ScrollDC(hDC: HDC, dx: int, dy: int, lprcScroll: LPRECT | NULL, lprcClip: LPRECT | NULL, hrgnUpdate: HRGN | 0n, lprcUpdate: LPRECT | NULL): BOOL {
    return User32.Load('ScrollDC')(hDC, dx, dy, lprcScroll, lprcClip, hrgnUpdate, lprcUpdate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-scrollwindow
  public static ScrollWindow(hWnd: HWND, XAmount: int, YAmount: int, lpRect: LPRECT | NULL, lpClipRect: LPRECT | NULL): BOOL {
    return User32.Load('ScrollWindow')(hWnd, XAmount, YAmount, lpRect, lpClipRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-scrollwindowex
  public static ScrollWindowEx(hWnd: HWND, dx: int, dy: int, prcScroll: LPRECT | NULL, prcClip: LPRECT | NULL, hrgnUpdate: HRGN | 0n, prcUpdate: LPRECT | NULL, flags: UINT): int {
    return User32.Load('ScrollWindowEx')(hWnd, dx, dy, prcScroll, prcClip, hrgnUpdate, prcUpdate, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-senddlgitemmessagew
  public static SendDlgItemMessageW(hDlg: HWND, nIDDlgItem: int, Msg: UINT, wParam: WPARAM, lParam: LPARAM): LRESULT {
    return User32.Load('SendDlgItemMessageW')(hDlg, nIDDlgItem, Msg, wParam, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput
  public static SendInput(cInputs: UINT, pInputs: LPINPUT, cbSize: int): UINT {
    return User32.Load('SendInput')(cInputs, pInputs, cbSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendmessagecallbackw
  public static SendMessageCallbackW(hWnd: HWND, Msg: UINT, wParam: WPARAM, lParam: LPARAM, lpResultCallBack: SENDASYNCPROC, dwData: ULONG_PTR): BOOL {
    return User32.Load('SendMessageCallbackW')(hWnd, Msg, wParam, lParam, lpResultCallBack, dwData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendmessagetimeoutw
  public static SendMessageTimeoutW(hWnd: HWND, Msg: UINT, wParam: WPARAM, lParam: LPARAM, fuFlags: UINT, uTimeout: UINT, lpdwResult: PDWORD_PTR | NULL): LRESULT {
    return User32.Load('SendMessageTimeoutW')(hWnd, Msg, wParam, lParam, fuFlags, uTimeout, lpdwResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendmessagew
  public static SendMessageW(hWnd: HWND, Msg: UINT, wParam: WPARAM, lParam: LPARAM): LRESULT {
    return User32.Load('SendMessageW')(hWnd, Msg, wParam, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendnotifymessagew
  public static SendNotifyMessageW(hWnd: HWND, Msg: UINT, wParam: WPARAM, lParam: LPARAM): BOOL {
    return User32.Load('SendNotifyMessageW')(hWnd, Msg, wParam, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setactivewindow
  public static SetActiveWindow(hWnd: HWND): HWND {
    return User32.Load('SetActiveWindow')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setcapture
  public static SetCapture(hWnd: HWND): HWND {
    return User32.Load('SetCapture')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setcaretblinktime
  public static SetCaretBlinkTime(uMSeconds: UINT): BOOL {
    return User32.Load('SetCaretBlinkTime')(uMSeconds);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setcaretpos
  public static SetCaretPos(X: int, Y: int): BOOL {
    return User32.Load('SetCaretPos')(X, Y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setclasslongptrw
  public static SetClassLongPtrW(hWnd: HWND, nIndex: int, dwNewLong: LONG_PTR): ULONG_PTR {
    return User32.Load('SetClassLongPtrW')(hWnd, nIndex, dwNewLong);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setclasslongw
  public static SetClassLongW(hWnd: HWND, nIndex: int, dwNewLong: LONG): DWORD {
    return User32.Load('SetClassLongW')(hWnd, nIndex, dwNewLong);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setclassword
  public static SetClassWord(hWnd: HWND, nIndex: int, wNewWord: WORD): WORD {
    return User32.Load('SetClassWord')(hWnd, nIndex, wNewWord);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setclipboarddata
  public static SetClipboardData(uFormat: UINT, hMem: HANDLE | 0n): HANDLE {
    return User32.Load('SetClipboardData')(uFormat, hMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setclipboardviewer
  public static SetClipboardViewer(hWndNewViewer: HWND): HWND {
    return User32.Load('SetClipboardViewer')(hWndNewViewer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setcoalescabletimer
  public static SetCoalescableTimer(hWnd: HWND | 0n, nIDEvent: UINT_PTR, uElapse: UINT, lpTimerFunc: TIMERPROC | NULL, uToleranceDelay: ULONG): UINT_PTR {
    return User32.Load('SetCoalescableTimer')(hWnd, nIDEvent, uElapse, lpTimerFunc, uToleranceDelay);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setcursor
  public static SetCursor(hCursor: HCURSOR | 0n): HCURSOR {
    return User32.Load('SetCursor')(hCursor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setcursorpos
  public static SetCursorPos(X: int, Y: int): BOOL {
    return User32.Load('SetCursorPos')(X, Y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setdialogcontroldpichangebehavior
  public static SetDialogControlDpiChangeBehavior(hWnd: HWND, mask: DIALOG_CONTROL_DPI_CHANGE_BEHAVIORS, values: DIALOG_CONTROL_DPI_CHANGE_BEHAVIORS): BOOL {
    return User32.Load('SetDialogControlDpiChangeBehavior')(hWnd, mask, values);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setdialogdpichangebehavior
  public static SetDialogDpiChangeBehavior(hDlg: HWND, mask: DIALOG_DPI_CHANGE_BEHAVIORS, values: DIALOG_DPI_CHANGE_BEHAVIORS): BOOL {
    return User32.Load('SetDialogDpiChangeBehavior')(hDlg, mask, values);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setdisplayautorotationpreferences
  public static SetDisplayAutoRotationPreferences(orientation: ORIENTATION_PREFERENCE): BOOL {
    return User32.Load('SetDisplayAutoRotationPreferences')(orientation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setdisplayconfig
  public static SetDisplayConfig(numPathArrayElements: UINT32, pathArray: DISPLAYCONFIG_PATH_INFO | NULL, numModeInfoArrayElements: UINT32, modeInfoArray: DISPLAYCONFIG_MODE_INFO | NULL, flags: UINT32): LONG {
    return User32.Load('SetDisplayConfig')(numPathArrayElements, pathArray, numModeInfoArrayElements, modeInfoArray, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setdlgitemint
  public static SetDlgItemInt(hDlg: HWND, nIDDlgItem: int, uValue: UINT, bSigned: BOOL): BOOL {
    return User32.Load('SetDlgItemInt')(hDlg, nIDDlgItem, uValue, bSigned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setdlgitemtextw
  public static SetDlgItemTextW(hDlg: HWND, nIDDlgItem: int, lpString: LPCWSTR): BOOL {
    return User32.Load('SetDlgItemTextW')(hDlg, nIDDlgItem, lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setdoubleclicktime
  public static SetDoubleClickTime(unnamedParam1: UINT): BOOL {
    return User32.Load('SetDoubleClickTime')(unnamedParam1);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setfocus
  public static SetFocus(hWnd: HWND | 0n): HWND {
    return User32.Load('SetFocus')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setforegroundwindow
  public static SetForegroundWindow(hWnd: HWND): BOOL {
    return User32.Load('SetForegroundWindow')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setgestureconfig
  public static SetGestureConfig(hwnd: HWND, dwReserved: DWORD, cIDs: UINT, pGestureConfig: PGESTURECONFIG, cbSize: UINT): BOOL {
    return User32.Load('SetGestureConfig')(hwnd, dwReserved, cIDs, pGestureConfig, cbSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setkeyboardstate
  public static SetKeyboardState(lpKeyState: LPBYTE): BOOL {
    return User32.Load('SetKeyboardState')(lpKeyState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setlasterrorex
  public static SetLastErrorEx(dwErrCode: DWORD, dwType: DWORD): VOID {
    return User32.Load('SetLastErrorEx')(dwErrCode, dwType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setlayeredwindowattributes
  public static SetLayeredWindowAttributes(hwnd: HWND, crKey: COLORREF, bAlpha: BYTE, dwFlags: DWORD): BOOL {
    return User32.Load('SetLayeredWindowAttributes')(hwnd, crKey, bAlpha, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setmenu
  public static SetMenu(hWnd: HWND, hMenu: HMENU | 0n): BOOL {
    return User32.Load('SetMenu')(hWnd, hMenu);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setmenucontexthelpid
  public static SetMenuContextHelpId(unnamedParam1: HMENU, unnamedParam2: DWORD): BOOL {
    return User32.Load('SetMenuContextHelpId')(unnamedParam1, unnamedParam2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setmenudefaultitem
  public static SetMenuDefaultItem(hMenu: HMENU, uItem: UINT, fByPos: UINT): BOOL {
    return User32.Load('SetMenuDefaultItem')(hMenu, uItem, fByPos);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setmenuinfo
  public static SetMenuInfo(unnamedParam1: HMENU, unnamedParam2: LPCMENUINFO): BOOL {
    return User32.Load('SetMenuInfo')(unnamedParam1, unnamedParam2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setmenuitembitmaps
  public static SetMenuItemBitmaps(hMenu: HMENU, uPosition: UINT, uFlags: UINT, hBitmapUnchecked: HBITMAP | 0n, hBitmapChecked: HBITMAP | 0n): BOOL {
    return User32.Load('SetMenuItemBitmaps')(hMenu, uPosition, uFlags, hBitmapUnchecked, hBitmapChecked);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setmenuiteminfow
  public static SetMenuItemInfoW(hmenu: HMENU, item: UINT, fByPosition: BOOL, lpmii: LPCMENUITEMINFOW): BOOL {
    return User32.Load('SetMenuItemInfoW')(hmenu, item, fByPosition, lpmii);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setmessageextrainfo
  public static SetMessageExtraInfo(lParam: LPARAM): LPARAM {
    return User32.Load('SetMessageExtraInfo')(lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setparent
  public static SetParent(hWndChild: HWND, hWndNewParent: HWND | 0n): HWND {
    return User32.Load('SetParent')(hWndChild, hWndNewParent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setphysicalcursorpos
  public static SetPhysicalCursorPos(X: int, Y: int): BOOL {
    return User32.Load('SetPhysicalCursorPos')(X, Y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setprocessdefaultlayout
  public static SetProcessDefaultLayout(dwDefaultLayout: DWORD): BOOL {
    return User32.Load('SetProcessDefaultLayout')(dwDefaultLayout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setprocessdpiaware
  public static SetProcessDPIAware(): BOOL {
    return User32.Load('SetProcessDPIAware')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setprocessdpiawarenesscontext
  public static SetProcessDpiAwarenessContext(value: DPI_AWARENESS_CONTEXT): BOOL {
    return User32.Load('SetProcessDpiAwarenessContext')(value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setprocesswindowstation
  public static SetProcessWindowStation(hWinSta: HWINSTA): BOOL {
    return User32.Load('SetProcessWindowStation')(hWinSta);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setpropa
  public static SetPropA(hWnd: HWND, lpString: LPCSTR, hData: HANDLE | 0n): BOOL {
    return User32.Load('SetPropA')(hWnd, lpString, hData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setpropw
  public static SetPropW(hWnd: HWND, lpString: LPCWSTR, hData: HANDLE | 0n): BOOL {
    return User32.Load('SetPropW')(hWnd, lpString, hData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setrect
  public static SetRect(lprc: LPRECT, xLeft: int, yTop: int, xRight: int, yBottom: int): BOOL {
    return User32.Load('SetRect')(lprc, xLeft, yTop, xRight, yBottom);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setrectempty
  public static SetRectEmpty(lprc: LPRECT): BOOL {
    return User32.Load('SetRectEmpty')(lprc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setscrollinfo
  public static SetScrollInfo(hwnd: HWND, nBar: int, lpsi: LPCSCROLLINFO, redraw: BOOL): int {
    return User32.Load('SetScrollInfo')(hwnd, nBar, lpsi, redraw);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setscrollpos
  public static SetScrollPos(hWnd: HWND, nBar: int, nPos: int, bRedraw: BOOL): int {
    return User32.Load('SetScrollPos')(hWnd, nBar, nPos, bRedraw);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setscrollrange
  public static SetScrollRange(hWnd: HWND, nBar: int, nMinPos: int, nMaxPos: int, bRedraw: BOOL): BOOL {
    return User32.Load('SetScrollRange')(hWnd, nBar, nMinPos, nMaxPos, bRedraw);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setsyscolors
  public static SetSysColors(cElements: int, lpaElements: LPINT, lpaRgbValues: LPDWORD): BOOL {
    return User32.Load('SetSysColors')(cElements, lpaElements, lpaRgbValues);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setsystemcursor
  public static SetSystemCursor(hcur: HCURSOR, id: DWORD): BOOL {
    return User32.Load('SetSystemCursor')(hcur, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setthreaddesktop
  public static SetThreadDesktop(hDesktop: HDESK): BOOL {
    return User32.Load('SetThreadDesktop')(hDesktop);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setthreaddpiawarenesscontext
  public static SetThreadDpiAwarenessContext(dpiContext: DPI_AWARENESS_CONTEXT): DPI_AWARENESS_CONTEXT {
    return User32.Load('SetThreadDpiAwarenessContext')(dpiContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setthreaddpihostingbehavior
  public static SetThreadDpiHostingBehavior(value: DPI_HOSTING_BEHAVIOR): DPI_HOSTING_BEHAVIOR {
    return User32.Load('SetThreadDpiHostingBehavior')(value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-settimer
  public static SetTimer(hWnd: HWND | 0n, nIDEvent: UINT_PTR, uElapse: UINT, lpTimerFunc: TIMERPROC | NULL): UINT_PTR {
    return User32.Load('SetTimer')(hWnd, nIDEvent, uElapse, lpTimerFunc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setuserobjectinformationw
  public static SetUserObjectInformationW(hObj: HANDLE, nIndex: int, pvInfo: PVOID, nLength: DWORD): BOOL {
    return User32.Load('SetUserObjectInformationW')(hObj, nIndex, pvInfo, nLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setuserobjectsecurity
  public static SetUserObjectSecurity(hObj: HANDLE, pSIRequested: PSECURITY_INFORMATION, pSID: PSECURITY_DESCRIPTOR): BOOL {
    return User32.Load('SetUserObjectSecurity')(hObj, pSIRequested, pSID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowcontexthelpid
  public static SetWindowContextHelpId(unnamedParam1: HWND, unnamedParam2: DWORD): BOOL {
    return User32.Load('SetWindowContextHelpId')(unnamedParam1, unnamedParam2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowdisplayaffinity
  public static SetWindowDisplayAffinity(hWnd: HWND, dwAffinity: DWORD): BOOL {
    return User32.Load('SetWindowDisplayAffinity')(hWnd, dwAffinity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowfeedbacksetting
  public static SetWindowFeedbackSetting(hwnd: HWND, feedback: FEEDBACK_TYPE, dwFlags: DWORD, size: UINT32, configuration: PVOID | NULL): BOOL {
    return User32.Load('SetWindowFeedbackSetting')(hwnd, feedback, dwFlags, size, configuration);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowlongptrw
  public static SetWindowLongPtrW(hWnd: HWND, nIndex: int, dwNewLong: LONG_PTR): LONG_PTR {
    return User32.Load('SetWindowLongPtrW')(hWnd, nIndex, dwNewLong);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowlongw
  public static SetWindowLongW(hWnd: HWND, nIndex: int, dwNewLong: LONG): LONG {
    return User32.Load('SetWindowLongW')(hWnd, nIndex, dwNewLong);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowplacement
  public static SetWindowPlacement(hWnd: HWND, lpwndpl: WINDOWPLACEMENT): BOOL {
    return User32.Load('SetWindowPlacement')(hWnd, lpwndpl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowpos
  public static SetWindowPos(hWnd: HWND, hWndInsertAfter: HWND | 0n, X: int, Y: int, cx: int, cy: int, uFlags: UINT): BOOL {
    return User32.Load('SetWindowPos')(hWnd, hWndInsertAfter, X, Y, cx, cy, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowrgn
  public static SetWindowRgn(hWnd: HWND, hRgn: HRGN | 0n, bRedraw: BOOL): int {
    return User32.Load('SetWindowRgn')(hWnd, hRgn, bRedraw);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowshookexw
  public static SetWindowsHookExW(idHook: int, lpfn: HOOKPROC, hmod: HINSTANCE | 0n, dwThreadId: DWORD): HHOOK {
    return User32.Load('SetWindowsHookExW')(idHook, lpfn, hmod, dwThreadId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowtextw
  public static SetWindowTextW(hWnd: HWND, lpString: LPCWSTR): BOOL {
    return User32.Load('SetWindowTextW')(hWnd, lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwineventhook
  public static SetWinEventHook(eventMin: DWORD, eventMax: DWORD, hmodWinEventProc: HMODULE | 0n, pfnWinEventProc: WINEVENTPROC, idProcess: DWORD, idThread: DWORD, dwFlags: DWORD): HWINEVENTHOOK {
    return User32.Load('SetWinEventHook')(eventMin, eventMax, hmodWinEventProc, pfnWinEventProc, idProcess, idThread, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-showcaret
  public static ShowCaret(hWnd: HWND | 0n): BOOL {
    return User32.Load('ShowCaret')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-showcursor
  public static ShowCursor(bShow: BOOL): int {
    return User32.Load('ShowCursor')(bShow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-showownedpopups
  public static ShowOwnedPopups(hWnd: HWND, fShow: BOOL): BOOL {
    return User32.Load('ShowOwnedPopups')(hWnd, fShow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-showscrollbar
  public static ShowScrollBar(hWnd: HWND, wBar: int, bShow: BOOL): BOOL {
    return User32.Load('ShowScrollBar')(hWnd, wBar, bShow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-showwindow
  public static ShowWindow(hWnd: HWND, nCmdShow: int): BOOL {
    return User32.Load('ShowWindow')(hWnd, nCmdShow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-showwindowasync
  public static ShowWindowAsync(hWnd: HWND, nCmdShow: int): BOOL {
    return User32.Load('ShowWindowAsync')(hWnd, nCmdShow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-shutdownblockreasoncreate
  public static ShutdownBlockReasonCreate(hWnd: HWND, pwszReason: LPCWSTR): BOOL {
    return User32.Load('ShutdownBlockReasonCreate')(hWnd, pwszReason);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-shutdownblockreasondestroy
  public static ShutdownBlockReasonDestroy(hWnd: HWND): BOOL {
    return User32.Load('ShutdownBlockReasonDestroy')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-shutdownblockreasonquery
  public static ShutdownBlockReasonQuery(hWnd: HWND, pwszBuff: LPWSTR | NULL, pcchBuff: DWORD): BOOL {
    return User32.Load('ShutdownBlockReasonQuery')(hWnd, pwszBuff, pcchBuff);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-skippointerframemessages
  public static SkipPointerFrameMessages(pointerId: UINT32): BOOL {
    return User32.Load('SkipPointerFrameMessages')(pointerId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-subtractrect
  public static SubtractRect(lprcDst: LPRECT, lprcSrc1: LPRECT, lprcSrc2: LPRECT): BOOL {
    return User32.Load('SubtractRect')(lprcDst, lprcSrc1, lprcSrc2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-swapmousebutton
  public static SwapMouseButton(fSwap: BOOL): BOOL {
    return User32.Load('SwapMouseButton')(fSwap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-switchdesktop
  public static SwitchDesktop(hDesktop: HDESK): BOOL {
    return User32.Load('SwitchDesktop')(hDesktop);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-switchtothiswindow
  public static SwitchToThisWindow(hwnd: HWND, fUnknown: BOOL): VOID {
    return User32.Load('SwitchToThisWindow')(hwnd, fUnknown);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-systemparametersinfofordpi
  public static SystemParametersInfoForDpi(uiAction: UINT, uiParam: UINT, pvParam: PVOID | NULL, fWinIni: UINT, dpi: UINT): BOOL {
    return User32.Load('SystemParametersInfoForDpi')(uiAction, uiParam, pvParam, fWinIni, dpi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-systemparametersinfow
  public static SystemParametersInfoW(uiAction: UINT, uiParam: UINT, pvParam: PVOID | NULL, fWinIni: UINT): BOOL {
    return User32.Load('SystemParametersInfoW')(uiAction, uiParam, pvParam, fWinIni);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-tabbedtextoutw
  public static TabbedTextOutW(hdc: HDC, x: int, y: int, lpString: LPCWSTR, chCount: int, nTabPositions: int, lpnTabStopPositions: LPINT | NULL, nTabOrigin: int): LONG {
    return User32.Load('TabbedTextOutW')(hdc, x, y, lpString, chCount, nTabPositions, lpnTabStopPositions, nTabOrigin);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-tilewindows
  public static TileWindows(hwndParent: HWND | 0n, wHow: UINT, lpRect: LPRECT | NULL, cKids: UINT, lpKids: HWND | 0n): WORD {
    return User32.Load('TileWindows')(hwndParent, wHow, lpRect, cKids, lpKids);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-toascii
  public static ToAscii(uVirtKey: UINT, uScanCode: UINT, lpKeyState: BYTE, lpChar: LPWORD, uFlags: UINT): int {
    return User32.Load('ToAscii')(uVirtKey, uScanCode, lpKeyState, lpChar, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-toasciiex
  public static ToAsciiEx(uVirtKey: UINT, uScanCode: UINT, lpKeyState: BYTE, lpChar: LPWORD, uFlags: UINT, dwhkl: HKL): int {
    return User32.Load('ToAsciiEx')(uVirtKey, uScanCode, lpKeyState, lpChar, uFlags, dwhkl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-tounicode
  public static ToUnicode(wVirtKey: UINT, wScanCode: UINT, lpKeyState: BYTE, pwszBuff: LPWSTR, cchBuff: int, wFlags: UINT): int {
    return User32.Load('ToUnicode')(wVirtKey, wScanCode, lpKeyState, pwszBuff, cchBuff, wFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-tounicodeex
  public static ToUnicodeEx(wVirtKey: UINT, wScanCode: UINT, lpKeyState: BYTE, pwszBuff: LPWSTR, cchBuff: int, wFlags: UINT, dwhkl: HKL): int {
    return User32.Load('ToUnicodeEx')(wVirtKey, wScanCode, lpKeyState, pwszBuff, cchBuff, wFlags, dwhkl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-trackmouseevent
  public static TrackMouseEvent(lpEventTrack: LPTRACKMOUSEEVENT): BOOL {
    return User32.Load('TrackMouseEvent')(lpEventTrack);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-trackpopupmenu
  public static TrackPopupMenu(hMenu: HMENU, uFlags: UINT, x: int, y: int, nReserved: int, hWnd: HWND, prcRect: LPRECT | NULL): BOOL {
    return User32.Load('TrackPopupMenu')(hMenu, uFlags, x, y, nReserved, hWnd, prcRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-trackpopupmenuex
  public static TrackPopupMenuEx(hMenu: HMENU, uFlags: UINT, x: int, y: int, hwnd: HWND, lptpm: LPTPMPARAMS | NULL): BOOL {
    return User32.Load('TrackPopupMenuEx')(hMenu, uFlags, x, y, hwnd, lptpm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-translateacceleratorw
  public static TranslateAcceleratorW(hWnd: HWND, hAccTable: HACCEL, lpMsg: LPMSG): int {
    return User32.Load('TranslateAcceleratorW')(hWnd, hAccTable, lpMsg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-translatemdisysaccel
  public static TranslateMDISysAccel(hWndClient: HWND, lpMsg: LPMSG): BOOL {
    return User32.Load('TranslateMDISysAccel')(hWndClient, lpMsg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-translatemessage
  public static TranslateMessage(lpMsg: LPMSG): BOOL {
    return User32.Load('TranslateMessage')(lpMsg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-unhookwindowshookex
  public static UnhookWindowsHookEx(hhk: HHOOK): BOOL {
    return User32.Load('UnhookWindowsHookEx')(hhk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-unhookwinevent
  public static UnhookWinEvent(hWinEventHook: HWINEVENTHOOK): BOOL {
    return User32.Load('UnhookWinEvent')(hWinEventHook);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-unionrect
  public static UnionRect(lprcDst: LPRECT, lprcSrc1: LPRECT, lprcSrc2: LPRECT): BOOL {
    return User32.Load('UnionRect')(lprcDst, lprcSrc1, lprcSrc2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-unloadkeyboardlayout
  public static UnloadKeyboardLayout(hkl: HKL): BOOL {
    return User32.Load('UnloadKeyboardLayout')(hkl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-unregisterclassw
  public static UnregisterClassW(lpClassName: LPCWSTR, hInstance: HINSTANCE): BOOL {
    return User32.Load('UnregisterClassW')(lpClassName, hInstance);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-unregisterdevicenotification
  public static UnregisterDeviceNotification(Handle: HDEVNOTIFY): BOOL {
    return User32.Load('UnregisterDeviceNotification')(Handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-unregisterhotkey
  public static UnregisterHotKey(hWnd: HWND | 0n, id: int): BOOL {
    return User32.Load('UnregisterHotKey')(hWnd, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-unregisterpointerinputtarget
  public static UnregisterPointerInputTarget(hwnd: HWND, pointerType: POINTER_INPUT_TYPE): BOOL {
    return User32.Load('UnregisterPointerInputTarget')(hwnd, pointerType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-unregisterpowersettingnotification
  public static UnregisterPowerSettingNotification(Handle: HPOWERNOTIFY): BOOL {
    return User32.Load('UnregisterPowerSettingNotification')(Handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-unregistersuspendresumenotification
  public static UnregisterSuspendResumeNotification(Handle: HPOWERNOTIFY): BOOL {
    return User32.Load('UnregisterSuspendResumeNotification')(Handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-unregistertouchwindow
  public static UnregisterTouchWindow(hwnd: HWND): BOOL {
    return User32.Load('UnregisterTouchWindow')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-updatelayeredwindow
  public static UpdateLayeredWindow(hWnd: HWND, hdcDst: HDC | 0n, pptDst: LPPOINT | NULL, psize: SIZE | NULL, hdcSrc: HDC | 0n, pptSrc: LPPOINT | NULL, crKey: COLORREF, pblend: BLENDFUNCTION | NULL, dwFlags: DWORD): BOOL {
    return User32.Load('UpdateLayeredWindow')(hWnd, hdcDst, pptDst, psize, hdcSrc, pptSrc, crKey, pblend, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-updatewindow
  public static UpdateWindow(hWnd: HWND): BOOL {
    return User32.Load('UpdateWindow')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-validaterect
  public static ValidateRect(hWnd: HWND | 0n, lpRect: LPRECT | NULL): BOOL {
    return User32.Load('ValidateRect')(hWnd, lpRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-validatergn
  public static ValidateRgn(hWnd: HWND, hRgn: HRGN | 0n): BOOL {
    return User32.Load('ValidateRgn')(hWnd, hRgn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-vkkeyscanexw
  public static VkKeyScanExW(ch: WCHAR, dwhkl: HKL): SHORT {
    return User32.Load('VkKeyScanExW')(ch, dwhkl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-vkkeyscanw
  public static VkKeyScanW(ch: WCHAR): SHORT {
    return User32.Load('VkKeyScanW')(ch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-waitforinputidle
  public static WaitForInputIdle(hProcess: HANDLE, dwMilliseconds: DWORD): DWORD {
    return User32.Load('WaitForInputIdle')(hProcess, dwMilliseconds);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-waitmessage
  public static WaitMessage(): BOOL {
    return User32.Load('WaitMessage')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-windowfromdc
  public static WindowFromDC(hDC: HDC): HWND {
    return User32.Load('WindowFromDC')(hDC);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-windowfromphysicalpoint
  public static WindowFromPhysicalPoint(Point: PACKED_POINT): HWND {
    return User32.Load('WindowFromPhysicalPoint')(Point);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-windowfrompoint
  public static WindowFromPoint(Point: PACKED_POINT): HWND {
    return User32.Load('WindowFromPoint')(Point);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-winhelpw
  public static WinHelpW(hWndMain: HWND, lpszHelp: LPCWSTR | NULL, uCommand: UINT, dwData: ULONG_PTR): BOOL {
    return User32.Load('WinHelpW')(hWndMain, lpszHelp, uCommand, dwData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-keybd_event
  public static keybd_event(bVk: BYTE, bScan: BYTE, dwFlags: DWORD, dwExtraInfo: ULONG_PTR): VOID {
    return User32.Load('keybd_event')(bVk, bScan, dwFlags, dwExtraInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-mouse_event
  public static mouse_event(dwFlags: DWORD, dx: DWORD, dy: DWORD, dwData: DWORD, dwExtraInfo: ULONG_PTR): VOID {
    return User32.Load('mouse_event')(dwFlags, dx, dy, dwData, dwExtraInfo);
  }

  // Undocumented: Obsolete function
  public static ChangeMenuW(hMenu: HMENU, cmd: UINT, lpszNewItem: LPCWSTR, cmdInsert: UINT, flags: UINT): BOOL {
    return User32.Load('ChangeMenuW')(hMenu, cmd, lpszNewItem, cmdInsert, flags);
  }

  // Undocumented: Internal API for creating windows in specific bands
  public static CreateWindowInBand(dwExStyle: DWORD, lpClassName: LPCWSTR, lpWindowName: LPCWSTR | NULL, dwStyle: DWORD, X: int, Y: int, nWidth: int, nHeight: int, hWndParent: HWND | 0n, hMenu: HMENU | 0n, hInstance: HINSTANCE | 0n, lpParam: LPVOID | NULL, dwBand: DWORD): HWND {
    return User32.Load('CreateWindowInBand')(dwExStyle, lpClassName, lpWindowName, dwStyle, X, Y, nWidth, nHeight, hWndParent, hMenu, hInstance, lpParam, dwBand);
  }

  // Undocumented: Extended version of CreateWindowInBand
  public static CreateWindowInBandEx(dwExStyle: DWORD, lpClassName: LPCWSTR, lpWindowName: LPCWSTR | NULL, dwStyle: DWORD, X: int, Y: int, nWidth: int, nHeight: int, hWndParent: HWND | 0n, hMenu: HMENU | 0n, hInstance: HINSTANCE | 0n, lpParam: LPVOID | NULL, dwBand: DWORD, dwTypeFlags: DWORD): HWND {
    return User32.Load('CreateWindowInBandEx')(dwExStyle, lpClassName, lpWindowName, dwStyle, X, Y, nWidth, nHeight, hWndParent, hMenu, hInstance, lpParam, dwBand, dwTypeFlags);
  }

  // Undocumented: Internal helper for drawing captions
  public static DrawCaptionTempW(hwnd: HWND, hdc: HDC, lprect: LPRECT, hFont: HANDLE | 0n, hIcon: HICON | 0n, lpszText: UINT): BOOL {
    return User32.Load('DrawCaptionTempW')(hwnd, hdc, lprect, hFont, hIcon, lpszText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dde/nf-dde-freeddelparam
  public static FreeDDElParam(msg: UINT, lParam: LPARAM): BOOL {
    return User32.Load('FreeDDElParam')(msg, lParam);
  }

  // Undocumented: Gets pointer frame timing information
  public static GetPointerFrameTimes(pointerId: UINT32, pointerCount: PUINT, pointerTimestamps: PULONG): BOOL {
    return User32.Load('GetPointerFrameTimes')(pointerId, pointerCount, pointerTimestamps);
  }

  // Undocumented: Gets the window band
  public static GetWindowBand(hwnd: HWND, pdwBand: LPDWORD): BOOL {
    return User32.Load('GetWindowBand')(hwnd, pdwBand);
  }

  // Undocumented: Gets window composition attributes (commonly used for DWM effects)
  public static GetWindowCompositionAttribute(hwnd: HWND, pAttrData: LPVOID): BOOL {
    return User32.Load('GetWindowCompositionAttribute')(hwnd, pAttrData);
  }

  // Undocumented: Checks if window is redirected for print
  public static IsWindowRedirectedForPrint(hwnd: HWND): BOOL {
    return User32.Load('IsWindowRedirectedForPrint')(hwnd);
  }

  // Undocumented: MessageBox with timeout (commonly used)
  public static MessageBoxTimeoutW(hWnd: HWND | 0n, lpText: LPCWSTR, lpCaption: LPCWSTR, uType: UINT, wLanguageId: WORD, dwMilliseconds: DWORD): int {
    return User32.Load('MessageBoxTimeoutW')(hWnd, lpText, lpCaption, uType, wLanguageId, dwMilliseconds);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-openthreaddesktop
  public static OpenThreadDesktop(dwThreadId: DWORD, fInherit: BOOL, dwDesiredAccess: ACCESS_MASK): HDESK {
    return User32.Load('OpenThreadDesktop')(dwThreadId, fInherit, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dde/nf-dde-packddelparam
  public static PackDDElParam(msg: UINT, uiLo: UINT_PTR, uiHi: UINT_PTR): LPARAM {
    return User32.Load('PackDDElParam')(msg, uiLo, uiHi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dde/nf-dde-reuseddelparam
  public static ReuseDDElParam(lParam: LPARAM, msgIn: UINT, msgOut: UINT, uiLo: UINT_PTR, uiHi: UINT_PTR): LPARAM {
    return User32.Load('ReuseDDElParam')(lParam, msgIn, msgOut, uiLo, uiHi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setmessagequeue (obsolete, always returns TRUE)
  public static SetMessageQueue(cMessagesMax: int): BOOL {
    return User32.Load('SetMessageQueue')(cMessagesMax);
  }

  // Undocumented: Sets the window band
  public static SetWindowBand(hwnd: HWND, hwndInsertAfter: HWND | 0n, dwBand: DWORD): BOOL {
    return User32.Load('SetWindowBand')(hwnd, hwndInsertAfter, dwBand);
  }

  // Undocumented: Sets window composition attributes (commonly used for DWM effects)
  public static SetWindowCompositionAttribute(hwnd: HWND, pAttrData: LPVOID): BOOL {
    return User32.Load('SetWindowCompositionAttribute')(hwnd, pAttrData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowword (obsolete)
  public static SetWindowWord(hWnd: HWND, nIndex: int, wNewWord: WORD): WORD {
    return User32.Load('SetWindowWord')(hWnd, nIndex, wNewWord);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dde/nf-dde-unpackddelparam
  public static UnpackDDElParam(msg: UINT, lParam: LPARAM, puiLo: PUINT_PTR, puiHi: PUINT_PTR): BOOL {
    return User32.Load('UnpackDDElParam')(msg, lParam, puiLo, puiHi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-updatelayeredwindowindirect
  public static UpdateLayeredWindowIndirect(hWnd: HWND, pULWInfo: LPVOID): BOOL {
    return User32.Load('UpdateLayeredWindowIndirect')(hWnd, pULWInfo);
  }
}

export default User32;
