import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  HRESULT,
  HWND,
  LPCHOOSECOLORA,
  LPCHOOSECOLORW,
  LPCHOOSEFONTA,
  LPCHOOSEFONTW,
  LPCSTR,
  LPCWSTR,
  LPFINDREPLACEA,
  LPFINDREPLACEW,
  LPOPENFILENAMEA,
  LPOPENFILENAMEW,
  LPPAGESETUPDLGA,
  LPPAGESETUPDLGW,
  LPPRINTDLGA,
  LPPRINTDLGEXA,
  LPPRINTDLGEXW,
  LPPRINTDLGW,
  LPSTR,
  LPWSTR,
  NULL,
  SHORT,
  WORD,
} from '../types/Comdlg32';

/**
 * Thin, lazy-loaded FFI bindings for `comdlg32.dll`.
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
 * import Comdlg32 from './structs/Comdlg32';
 *
 * // Lazy: bind on first call
 * const ok = Comdlg32.GetOpenFileNameW(ofn.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Comdlg32.Preload(['GetOpenFileNameW', 'GetSaveFileNameW']);
 * ```
 */
class Comdlg32 extends Win32 {
  protected static override name = 'comdlg32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    ChooseColorA: { args: [FFIType.ptr], returns: FFIType.i32 },
    ChooseColorW: { args: [FFIType.ptr], returns: FFIType.i32 },
    ChooseFontA: { args: [FFIType.ptr], returns: FFIType.i32 },
    ChooseFontW: { args: [FFIType.ptr], returns: FFIType.i32 },
    CommDlgExtendedError: { args: [], returns: FFIType.u32 },
    FindTextA: { args: [FFIType.ptr], returns: FFIType.u64 },
    FindTextW: { args: [FFIType.ptr], returns: FFIType.u64 },
    GetFileTitleA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u16], returns: FFIType.i16 },
    GetFileTitleW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u16], returns: FFIType.i16 },
    GetOpenFileNameA: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetOpenFileNameW: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetSaveFileNameA: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetSaveFileNameW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PageSetupDlgA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PageSetupDlgW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PrintDlgA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PrintDlgExA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PrintDlgExW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PrintDlgW: { args: [FFIType.ptr], returns: FFIType.i32 },
    ReplaceTextA: { args: [FFIType.ptr], returns: FFIType.u64 },
    ReplaceTextW: { args: [FFIType.ptr], returns: FFIType.u64 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-choosecolora
  public static ChooseColorA(lpcc: LPCHOOSECOLORA): BOOL {
    return Comdlg32.Load('ChooseColorA')(lpcc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-choosecolorw
  public static ChooseColorW(lpcc: LPCHOOSECOLORW): BOOL {
    return Comdlg32.Load('ChooseColorW')(lpcc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-choosefonta
  public static ChooseFontA(lpcf: LPCHOOSEFONTA): BOOL {
    return Comdlg32.Load('ChooseFontA')(lpcf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-choosefontw
  public static ChooseFontW(lpcf: LPCHOOSEFONTW): BOOL {
    return Comdlg32.Load('ChooseFontW')(lpcf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-commdlgextendederror
  public static CommDlgExtendedError(): DWORD {
    return Comdlg32.Load('CommDlgExtendedError')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-findtexta
  public static FindTextA(lpfr: LPFINDREPLACEA): HWND {
    return Comdlg32.Load('FindTextA')(lpfr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-findtextw
  public static FindTextW(lpfr: LPFINDREPLACEW): HWND {
    return Comdlg32.Load('FindTextW')(lpfr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-getfiletitlea
  public static GetFileTitleA(lpszFile: LPCSTR, Buf: LPSTR | NULL, cchSize: WORD): SHORT {
    return Comdlg32.Load('GetFileTitleA')(lpszFile, Buf, cchSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-getfiletitlew
  public static GetFileTitleW(lpszFile: LPCWSTR, Buf: LPWSTR | NULL, cchSize: WORD): SHORT {
    return Comdlg32.Load('GetFileTitleW')(lpszFile, Buf, cchSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-getopenfilenamea
  public static GetOpenFileNameA(lpofn: LPOPENFILENAMEA): BOOL {
    return Comdlg32.Load('GetOpenFileNameA')(lpofn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-getopenfilenamew
  public static GetOpenFileNameW(lpofn: LPOPENFILENAMEW): BOOL {
    return Comdlg32.Load('GetOpenFileNameW')(lpofn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-getsavefilenamea
  public static GetSaveFileNameA(lpofn: LPOPENFILENAMEA): BOOL {
    return Comdlg32.Load('GetSaveFileNameA')(lpofn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-getsavefilenamew
  public static GetSaveFileNameW(lpofn: LPOPENFILENAMEW): BOOL {
    return Comdlg32.Load('GetSaveFileNameW')(lpofn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-pagesetupdlga
  public static PageSetupDlgA(lppsd: LPPAGESETUPDLGA): BOOL {
    return Comdlg32.Load('PageSetupDlgA')(lppsd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-pagesetupdlgw
  public static PageSetupDlgW(lppsd: LPPAGESETUPDLGW): BOOL {
    return Comdlg32.Load('PageSetupDlgW')(lppsd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-printdlga
  public static PrintDlgA(pPD: LPPRINTDLGA): BOOL {
    return Comdlg32.Load('PrintDlgA')(pPD);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-printdlgexa
  public static PrintDlgExA(pPD: LPPRINTDLGEXA): HRESULT {
    return Comdlg32.Load('PrintDlgExA')(pPD);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-printdlgexw
  public static PrintDlgExW(pPD: LPPRINTDLGEXW): HRESULT {
    return Comdlg32.Load('PrintDlgExW')(pPD);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-printdlgw
  public static PrintDlgW(pPD: LPPRINTDLGW): BOOL {
    return Comdlg32.Load('PrintDlgW')(pPD);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-replacetexta
  public static ReplaceTextA(lpfr: LPFINDREPLACEA): HWND {
    return Comdlg32.Load('ReplaceTextA')(lpfr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-replacetextw
  public static ReplaceTextW(lpfr: LPFINDREPLACEW): HWND {
    return Comdlg32.Load('ReplaceTextW')(lpfr);
  }
}

export default Comdlg32;
