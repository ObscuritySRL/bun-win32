import type { Pointer } from 'bun:ffi';

import type { HWND } from '@bun-win32/core';
export type { ACCESS_MASK, BOOL, BOOLEAN, BYTE, CHAR, DWORD, DWORD_PTR, HANDLE, HINSTANCE, HMODULE, HRESULT, HWND, INT, INT_PTR, LONG, LONG_PTR, LPARAM, LPBOOL, LPBYTE, LPCSTR, LPCVOID, LPCWSTR, LPDWORD, LPHANDLE, LPSECURITY_ATTRIBUTES, LPSTR, LPVOID, LPWSTR, LRESULT, NULL, PBYTE, PDWORD, PHANDLE, PULONG, PVOID, SHORT, SIZE_T, UINT, UINT_PTR, ULONG, ULONG_PTR, USHORT, VOID, WCHAR, WORD, WPARAM } from '@bun-win32/core';

export const HWND_ZORDER = {
  TOP: 0n as HWND,
  BOTTOM: 1n as HWND,
  TOPMOST: -1n as HWND,
  NOTOPMOST: -2n as HWND,
} as const;

export enum ClassLongIndex {
  GCL_CBCLSEXTRA = -20,
  GCL_CBWNDEXTRA = -18,
  GCL_HBRBACKGROUND = -10,
  GCL_HCURSOR = -12,
  GCL_HICON = -14,
  GCL_HMODULE = -16,
  GCL_MENUNAME = -8,
  GCL_WNDPROC = -24,
}

export enum ExtendedWindowStyles {
  WS_EX_ACCEPTFILES = 0x00000010,
  WS_EX_APPWINDOW = 0x00040000,
  WS_EX_CLIENTEDGE = 0x00000200,
  WS_EX_COMPOSITED = 0x02000000,
  WS_EX_CONTEXTHELP = 0x00000400,
  WS_EX_CONTROLPARENT = 0x00010000,
  WS_EX_DLGMODALFRAME = 0x00000001,
  WS_EX_LAYERED = 0x00080000,
  WS_EX_LEFT = 0x00000000,
  WS_EX_LEFTSCROLLBAR = 0x00004000,
  WS_EX_LAYOUTRTL = 0x00400000,
  WS_EX_LTRREADING = 0x00000000,
  WS_EX_MDICHILD = 0x00000040,
  WS_EX_NOACTIVATE = 0x08000000,
  WS_EX_NOINHERITLAYOUT = 0x00100000,
  WS_EX_NOREDIRECTIONBITMAP = 0x00200000,
  WS_EX_NOPARENTNOTIFY = 0x00000004,
  WS_EX_OVERLAPPEDWINDOW = 0x00000300,
  WS_EX_PALETTEWINDOW = 0x00000188,
  WS_EX_RIGHT = 0x00001000,
  WS_EX_RIGHTSCROLLBAR = 0x00000000,
  WS_EX_RTLREADING = 0x00002000,
  WS_EX_STATICEDGE = 0x00020000,
  WS_EX_TOOLWINDOW = 0x00000080,
  WS_EX_TOPMOST = 0x00000008,
  WS_EX_TRANSPARENT = 0x00000020,
  WS_EX_WINDOWEDGE = 0x00000100,
}

export enum GetAncestorFlags {
  GA_PARENT = 1,
  GA_ROOT = 2,
  GA_ROOTOWNER = 3,
}

export enum GetWindowCmd {
  GW_CHILD = 5,
  GW_ENABLEDPOPUP = 6,
  GW_HWNDFIRST = 0,
  GW_HWNDLAST = 1,
  GW_HWNDNEXT = 2,
  GW_HWNDPREV = 3,
  GW_OWNER = 4,
}

export enum HookType {
  WH_CALLWNDPROC = 4,
  WH_CALLWNDPROCRET = 12,
  WH_CBT = 5,
  WH_DEBUG = 9,
  WH_FOREGROUNDIDLE = 11,
  WH_GETMESSAGE = 3,
  WH_HARDWARE = 8,
  WH_JOURNALPLAYBACK = 1,
  WH_JOURNALRECORD = 0,
  WH_KEYBOARD = 2,
  WH_KEYBOARD_LL = 13,
  WH_MOUSE = 7,
  WH_MOUSE_LL = 14,
  WH_MSGFILTER = -1,
  WH_SHELL = 10,
  WH_SYSMSGFILTER = 6,
}

export enum MessageBoxType {
  MB_ABORTRETRYIGNORE = 0x00000002,
  MB_CANCELTRYCONTINUE = 0x00000006,
  MB_DEFBUTTON1 = 0x00000000,
  MB_DEFBUTTON2 = 0x00000100,
  MB_DEFBUTTON3 = 0x00000200,
  MB_DEFBUTTON4 = 0x00000300,
  MB_ICONASTERISK = 0x00000040,
  MB_ICONERROR = 0x00000010,
  MB_ICONEXCLAMATION = 0x00000030,
  MB_ICONHAND = 0x00000010,
  MB_ICONINFORMATION = 0x00000040,
  MB_ICONQUESTION = 0x00000020,
  MB_ICONWARNING = 0x00000030,
  MB_OK = 0x00000000,
  MB_OKCANCEL = 0x00000001,
  MB_RETRYCANCEL = 0x00000005,
  MB_USERICON = 0x00000080,
  MB_YESNO = 0x00000004,
  MB_YESNOCANCEL = 0x00000003,
}

export enum MessageFilter {
  WM_ACTIVATE = 0x0006,
  WM_CREATE = 0x0001,
  WM_DESTROY = 0x0002,
  WM_ENABLE = 0x000a,
  WM_GETTEXT = 0x000d,
  WM_GETTEXTLENGTH = 0x000e,
  WM_KILLFOCUS = 0x0008,
  WM_MOVE = 0x0003,
  WM_NULL = 0x0000,
  WM_PAINT = 0x000f,
  WM_SETFOCUS = 0x0007,
  WM_SETREDRAW = 0x000b,
  WM_SETTEXT = 0x000c,
  WM_SIZE = 0x0005,
}

export enum PeekMessageRemoveFlag {
  PM_NOREMOVE = 0x0000,
  PM_NOYIELD = 0x0002,
  PM_REMOVE = 0x0001,
}

export enum SetWindowPosFlags {
  SWP_FRAMECHANGED = 0x0020,
  SWP_HIDEWINDOW = 0x0080,
  SWP_NOACTIVATE = 0x0010,
  SWP_NOCOPYBITS = 0x0100,
  SWP_NOMOVE = 0x0002,
  SWP_NOOWNERZORDER = 0x0200,
  SWP_NOREDRAW = 0x0008,
  SWP_NOSENDCHANGING = 0x0400,
  SWP_NOSIZE = 0x0001,
  SWP_NOZORDER = 0x0004,
  SWP_SHOWWINDOW = 0x0040,
}

export enum ShowWindowCommand {
  SW_FORCEMINIMIZE = 11,
  SW_HIDE = 0,
  SW_MAXIMIZE = 3,
  SW_MINIMIZE = 6,
  SW_NORMAL = 1,
  SW_RESTORE = 9,
  SW_SHOW = 5,
  SW_SHOWDEFAULT = 10,
  SW_SHOWMAXIMIZED = 3,
  SW_SHOWMINIMIZED = 2,
  SW_SHOWMINNOACTIVE = 7,
  SW_SHOWNORMAL = 1,
  SW_SHOWNA = 8,
  SW_SHOWNOACTIVATE = 4,
}

export enum SystemParametersInfoAction {
  SPI_GETWHEELSCROLLLINES = 0x0068,
  SPI_GETWORKAREA = 0x0030,
  SPI_SETWHEELSCROLLLINES = 0x0069,
  SPI_SETWORKAREA = 0x002f,
}

export enum SystemMetric {
  SM_ARRANGE = 56,
  SM_CARETBLINKINGENABLED = 0x2002,
  SM_CLEANBOOT = 67,
  SM_CMONITORS = 80,
  SM_CMOUSEBUTTONS = 43,
  SM_CONVERTIBLESLATEMODE = 0x2003,
  SM_CXBORDER = 5,
  SM_CXCURSOR = 13,
  SM_CXDLGFRAME = 7,
  SM_CXDOUBLECLK = 36,
  SM_CXDRAG = 68,
  SM_CXEDGE = 45,
  SM_CXFIXEDFRAME = 7,
  SM_CXFOCUSBORDER = 83,
  SM_CXFRAME = 32,
  SM_CXFULLSCREEN = 16,
  SM_CXHSCROLL = 21,
  SM_CXHTHUMB = 10,
  SM_CXICON = 11,
  SM_CXICONSPACING = 38,
  SM_CXMAXIMIZED = 61,
  SM_CXMAXTRACK = 59,
  SM_CXMENUCHECK = 71,
  SM_CXMENUSIZE = 54,
  SM_CXMIN = 28,
  SM_CXMINIMIZED = 57,
  SM_CXMINSPACING = 47,
  SM_CXMINTRACK = 34,
  SM_CXPADDEDBORDER = 92,
  SM_CXSCREEN = 0,
  SM_CXSIZE = 30,
  SM_CXSIZEFRAME = 32,
  SM_CXSMICON = 49,
  SM_CXSMSIZE = 52,
  SM_CXVIRTUALSCREEN = 78,
  SM_CXVSCROLL = 2,
  SM_CYBORDER = 6,
  SM_CYCAPTION = 4,
  SM_CYCURSOR = 14,
  SM_CYDLGFRAME = 8,
  SM_CYDOUBLECLK = 37,
  SM_CYDRAG = 69,
  SM_CYEDGE = 46,
  SM_CYFIXEDFRAME = 8,
  SM_CYFOCUSBORDER = 84,
  SM_CYFRAME = 33,
  SM_CYFULLSCREEN = 17,
  SM_CYHSCROLL = 3,
  SM_CYICON = 12,
  SM_CYICONSPACING = 39,
  SM_CYKANJIWINDOW = 18,
  SM_CYMAXIMIZED = 62,
  SM_CYMAXTRACK = 60,
  SM_CYMENU = 15,
  SM_CYMENUCHECK = 72,
  SM_CYMENUSIZE = 55,
  SM_CYMIN = 29,
  SM_CYMINIMIZED = 58,
  SM_CYMINSPACING = 48,
  SM_CYMINTRACK = 35,
  SM_CYSCREEN = 1,
  SM_CYSIZE = 31,
  SM_CYSIZEFRAME = 33,
  SM_CYSMCAPTION = 51,
  SM_CYSMICON = 50,
  SM_CYSMSIZE = 53,
  SM_CYVIRTUALSCREEN = 79,
  SM_CYVSCROLL = 20,
  SM_CYVTHUMB = 9,
  SM_DBCSENABLED = 42,
  SM_DEBUG = 22,
  SM_DIGITIZER = 94,
  SM_IMMENABLED = 82,
  SM_MAXIMUMTOUCHES = 95,
  SM_MEDIACENTER = 87,
  SM_MENUDROPALIGNMENT = 40,
  SM_MIDEASTENABLED = 74,
  SM_MOUSEHORIZONTALWHEELPRESENT = 91,
  SM_MOUSEPRESENT = 19,
  SM_MOUSEWHEELPRESENT = 75,
  SM_NETWORK = 63,
  SM_PENWINDOWS = 41,
  SM_REMOTECONTROL = 0x2001,
  SM_REMOTESESSION = 0x1000,
  SM_RESERVED1 = 24,
  SM_RESERVED2 = 25,
  SM_RESERVED3 = 26,
  SM_RESERVED4 = 27,
  SM_SAMEDISPLAYFORMAT = 81,
  SM_SECURE = 44,
  SM_SERVERR2 = 89,
  SM_SHOWSOUNDS = 70,
  SM_SHUTTINGDOWN = 0x2000,
  SM_SLOWMACHINE = 73,
  SM_STARTER = 88,
  SM_SWAPBUTTON = 23,
  SM_SYSTEMDOCKED = 0x2004,
  SM_TABLETPC = 86,
  SM_XVIRTUALSCREEN = 76,
  SM_YVIRTUALSCREEN = 77,
}

export enum VirtualKey {
  VK_BACK = 0x08,
  VK_CANCEL = 0x03,
  VK_CAPITAL = 0x14,
  VK_CONTROL = 0x11,
  VK_DELETE = 0x2e,
  VK_DOWN = 0x28,
  VK_END = 0x23,
  VK_ESCAPE = 0x1b,
  VK_HOME = 0x24,
  VK_INSERT = 0x2d,
  VK_LBUTTON = 0x01,
  VK_LEFT = 0x25,
  VK_MENU = 0x12,
  VK_MBUTTON = 0x04,
  VK_NEXT = 0x22,
  VK_PAUSE = 0x13,
  VK_PRIOR = 0x21,
  VK_RBUTTON = 0x02,
  VK_RETURN = 0x0d,
  VK_RIGHT = 0x27,
  VK_SHIFT = 0x10,
  VK_SPACE = 0x20,
  VK_TAB = 0x09,
  VK_UP = 0x26,
  VK_XBUTTON1 = 0x05,
  VK_XBUTTON2 = 0x06,
}

export enum WindowLongIndex {
  GWL_EXSTYLE = -20,
  GWL_HINSTANCE = -6,
  GWL_HWNDPARENT = -8,
  GWL_ID = -12,
  GWL_STYLE = -16,
  GWL_USERDATA = -21,
  GWL_WNDPROC = -4,
}

export enum WindowStyles {
  WS_BORDER = 0x00800000,
  WS_CAPTION = 0x00c00000,
  WS_CHILD = 0x40000000,
  WS_CHILDWINDOW = 0x40000000,
  WS_CLIPCHILDREN = 0x02000000,
  WS_CLIPSIBLINGS = 0x04000000,
  WS_DISABLED = 0x08000000,
  WS_DLGFRAME = 0x00400000,
  WS_GROUP = 0x00020000,
  WS_HSCROLL = 0x00100000,
  WS_ICONIC = 0x20000000,
  WS_MAXIMIZE = 0x01000000,
  WS_MAXIMIZEBOX = 0x00010000,
  WS_MINIMIZE = 0x20000000,
  WS_MINIMIZEBOX = 0x00020000,
  WS_OVERLAPPED = 0x00000000,
  WS_OVERLAPPEDWINDOW = 0x00cf0000,
  WS_POPUP = 0x80000000,
  WS_POPUPWINDOW = 0x80880000,
  WS_SIZEBOX = 0x00040000,
  WS_SYSMENU = 0x00080000,
  WS_TABSTOP = 0x00010000,
  WS_THICKFRAME = 0x00040000,
  WS_TILED = 0x00000000,
  WS_TILEDWINDOW = 0x00cf0000,
  WS_VISIBLE = 0x10000000,
  WS_VSCROLL = 0x00200000,
}

export type ATOM = number;
export type BLENDFUNCTION = Pointer;
export type COLORREF = number;
export type DESKTOPENUMPROCW = Pointer;
export type DEVMODEW = Pointer;
export type DIALOG_CONTROL_DPI_CHANGE_BEHAVIORS = number;
export type DIALOG_DPI_CHANGE_BEHAVIORS = number;
export type DISPLAYCONFIG_DEVICE_INFO_HEADER = Pointer;
export type DISPLAYCONFIG_MODE_INFO = Pointer;
export type DISPLAYCONFIG_PATH_INFO = Pointer;
export type DISPLAYCONFIG_TOPOLOGY_ID = number;
export type DLGPROC = Pointer;
export type DPI_AWARENESS = number;
export type DPI_AWARENESS_CONTEXT = Pointer;
export type DPI_HOSTING_BEHAVIOR = number;
export type DRAWSTATEPROC = Pointer;
export type FEEDBACK_TYPE = number;
export type GRAYSTRINGPROC = Pointer;
export type HACCEL = bigint;
export type HBITMAP = bigint;
export type HBRUSH = bigint;
export type HCONV = bigint;
export type HCONVLIST = bigint;
export type HCURSOR = bigint;
export type HDC = bigint;
export type HDDEDATA = bigint;
export type HDESK = bigint;
export type HDEVNOTIFY = bigint;
export type HDWP = bigint;
export type HGESTUREINFO = bigint;
export type HHOOK = bigint;
export type HICON = bigint;
export type HKL = bigint;
export type HMENU = bigint;
export type HMONITOR = bigint;
export type HOOKPROC = Pointer;
export type HPOWERNOTIFY = bigint;
export type HRAWINPUT = bigint;
export type HRGN = bigint;
export type HSYNTHETICPOINTERDEVICE = bigint;
export type HSZ = bigint;
export type HTOUCHINPUT = bigint;
export type HWINEVENTHOOK = bigint;
export type HWINSTA = bigint;
export type INPUT_MESSAGE_SOURCE = Pointer;
export type INPUT_TRANSFORM = Pointer;
export type int = number;
export type LPACCEL = Pointer;
export type LPALTTABINFO = Pointer;
export type LPCDLGTEMPLATEW = Pointer;
export type LPCGUID = Pointer;
export type LPCMENUINFO = Pointer;
export type LPCMENUITEMINFOW = Pointer;
export type LPCREATESTRUCTW = Pointer;
export type LPCRECT = Pointer;
export type LPCSCROLLINFO = Pointer;
export type LPDEVMODEW = Pointer;
export type LPDRAWTEXTPARAMS = Pointer;
export type LPFLASHWINFO = Pointer;
export type LPGUITHREADINFO = Pointer;
export type LPINPUT = Pointer;
export type LPINT = Pointer;
export type LPLASTINPUTINFO = Pointer;
export type LPMENUINFO = Pointer;
export type LPMENUITEMINFOW = Pointer;
export type LPMINMAXINFO = Pointer;
export type LPMONITORINFO = Pointer;
export type LPMOUSEMOVEPOINT = Pointer;
export type LPMSG = Pointer;
export type LPMSGBOXPARAMSW = Pointer;
export type LPPAINTSTRUCT = Pointer;
export type LPPOINT = Pointer;
export type LPRECT = Pointer;
export type LPSCROLLINFO = Pointer;
export type LPSIZE = Pointer;
export type LPTITLEBARINFOEX = Pointer;
export type LPTOUCHINPUT = Pointer;
export type LPTPMPARAMS = Pointer;
export type LPTRACKMOUSEEVENT = Pointer;
export type LPWINDOWINFO = Pointer;
export type LPWINDOWPLACEMENT = Pointer;
export type LPWINDOWPOS = Pointer;
export type LPWNDCLASSEXW = Pointer;
export type LPWNDCLASSW = Pointer;
export type LPWORD = Pointer;
export type MENUTEMPLATEW = Pointer;
export type MONITORENUMPROC = Pointer;
export type MSG_ = Pointer;
export type MSGBOXPARAMSW = Pointer;
export type ORIENTATION_PREFERENCE = number;
export type PORIENTATION_PREFERENCE = Pointer;
export type PAINTSTRUCT = Pointer;
export type PALTTABINFO = Pointer;
export type PAR_STATE = Pointer;
export type PBSMINFO = Pointer;
export type PCHANGEFILTERSTRUCT = Pointer;
export type PCOMBOBOXINFO = Pointer;
export type PCONVCONTEXT = Pointer;
export type PCONVINFO = Pointer;
export type PCRAWINPUTDEVICE = Pointer;
export type PCURSORINFO = Pointer;
export type PDISPLAY_DEVICEW = Pointer;
export type PDISPLAYCONFIG_TOPOLOGY_ID = Pointer;
export type PDWORD_PTR = Pointer;
export type PFLASHWINFO = Pointer;
export type PFNCALLBACK = Pointer;
export type PGESTURECONFIG = Pointer;
export type PGESTUREINFO = Pointer;
export type PGUITHREADINFO = Pointer;
export type PICONINFO = Pointer;
export type PICONINFOEXW = Pointer;
export type PLASTINPUTINFO = Pointer;
export type PMENUBARINFO = Pointer;
export type POINTER_DEVICE_CURSOR_INFO = Pointer;
export type POINTER_DEVICE_INFO = Pointer;
export type POINTER_DEVICE_PROPERTY = Pointer;
export type POINTER_FEEDBACK_MODE = number;
export type POINTER_INFO = Pointer;
export type POINTER_INPUT_TYPE = number;
export type POINTER_PEN_INFO = Pointer;
export type POINTER_TOUCH_INFO = Pointer;
export type POINTER_TYPE_INFO = Pointer;
export type PPOINT = Pointer;
export type PRAWINPUT = Pointer;
export type PRAWINPUTDEVICE = Pointer;
export type PRAWINPUTDEVICELIST = Pointer;
export type PRECT = Pointer;
export type PROPENUMPROCA = Pointer;
export type PROPENUMPROCEXA = Pointer;
export type PROPENUMPROCEXW = Pointer;
export type PROPENUMPROCW = Pointer;
export type PSCROLLBARINFO = Pointer;
export type PSECURITY_DESCRIPTOR = Pointer;
export type PSECURITY_INFORMATION = Pointer;
export type PTITLEBARINFO = Pointer;
export type PTOUCHINPUT = Pointer;
export type PUINT = Pointer;
export type PUINT_PTR = Pointer;
export type PWINDOWINFO = Pointer;
export type SENDASYNCPROC = Pointer;
export type SIZE = Pointer;
export type TIMERPROC = Pointer;
export type TOUCH_HIT_TESTING_INPUT = Pointer;
export type TOUCH_HIT_TESTING_PROXIMITY_EVALUATION = Pointer;
export type UINT32 = number;
export type WINDOWPLACEMENT = Pointer;
export type WINEVENTPROC = Pointer;
export type WINSTAENUMPROCW = Pointer;
export type WNDCLASSEXW = Pointer;
export type WNDCLASSW = Pointer;
export type WNDENUMPROC = Pointer;
export type WNDPROC = Pointer;

/**
 * A POINT struct packed into a 64-bit integer for by-value passing in the x64 ABI.
 *
 * On x64, `POINT` (8 bytes: two `LONG`s) is passed in a single register.
 * Use `packPOINT(x, y)` to create one.
 */
export type PACKED_POINT = bigint;

const _packBuf = Buffer.alloc(8);

/** Pack two `LONG` values into a `PACKED_POINT` for Win32 functions that take `POINT` by value. */
export function packPOINT(x: number, y: number): PACKED_POINT {
  _packBuf.writeInt32LE(x, 0);
  _packBuf.writeInt32LE(y, 4);
  return _packBuf.readBigUInt64LE(0);
}





