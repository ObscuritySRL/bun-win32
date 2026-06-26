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
  Nullable,
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
  public static ChooseColorA(lpcc_in_out: LPCHOOSECOLORA): BOOL {
    return Comdlg32.Load('ChooseColorA')(lpcc_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-choosecolorw
  public static ChooseColorW(lpcc_in_out: LPCHOOSECOLORW): BOOL {
    return Comdlg32.Load('ChooseColorW')(lpcc_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-choosefonta
  public static ChooseFontA(lpcf_in_out: LPCHOOSEFONTA): BOOL {
    return Comdlg32.Load('ChooseFontA')(lpcf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-choosefontw
  public static ChooseFontW(lpcf_in_out: LPCHOOSEFONTW): BOOL {
    return Comdlg32.Load('ChooseFontW')(lpcf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-commdlgextendederror
  public static CommDlgExtendedError(): DWORD {
    return Comdlg32.Load('CommDlgExtendedError')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-findtexta
  public static FindTextA(lpfr_in_out: LPFINDREPLACEA): HWND {
    return Comdlg32.Load('FindTextA')(lpfr_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-findtextw
  public static FindTextW(lpfr_in_out: LPFINDREPLACEW): HWND {
    return Comdlg32.Load('FindTextW')(lpfr_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-getfiletitlea
  public static GetFileTitleA(lpszFile: LPCSTR, Buf_out: Nullable<LPSTR>, cchSize: WORD): SHORT {
    return Comdlg32.Load('GetFileTitleA')(lpszFile, Buf_out, cchSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-getfiletitlew
  public static GetFileTitleW(lpszFile: LPCWSTR, Buf_out: Nullable<LPWSTR>, cchSize: WORD): SHORT {
    return Comdlg32.Load('GetFileTitleW')(lpszFile, Buf_out, cchSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-getopenfilenamea
  public static GetOpenFileNameA(lpofn_in_out: LPOPENFILENAMEA): BOOL {
    return Comdlg32.Load('GetOpenFileNameA')(lpofn_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-getopenfilenamew
  public static GetOpenFileNameW(lpofn_in_out: LPOPENFILENAMEW): BOOL {
    return Comdlg32.Load('GetOpenFileNameW')(lpofn_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-getsavefilenamea
  public static GetSaveFileNameA(lpofn_in_out: LPOPENFILENAMEA): BOOL {
    return Comdlg32.Load('GetSaveFileNameA')(lpofn_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-getsavefilenamew
  public static GetSaveFileNameW(lpofn_in_out: LPOPENFILENAMEW): BOOL {
    return Comdlg32.Load('GetSaveFileNameW')(lpofn_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-pagesetupdlga
  public static PageSetupDlgA(lppsd_in_out: LPPAGESETUPDLGA): BOOL {
    return Comdlg32.Load('PageSetupDlgA')(lppsd_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-pagesetupdlgw
  public static PageSetupDlgW(lppsd_in_out: LPPAGESETUPDLGW): BOOL {
    return Comdlg32.Load('PageSetupDlgW')(lppsd_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-printdlga
  public static PrintDlgA(pPD_in_out: LPPRINTDLGA): BOOL {
    return Comdlg32.Load('PrintDlgA')(pPD_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-printdlgexa
  public static PrintDlgExA(pPD_in_out: LPPRINTDLGEXA): HRESULT {
    return Comdlg32.Load('PrintDlgExA')(pPD_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-printdlgexw
  public static PrintDlgExW(pPD_in_out: LPPRINTDLGEXW): HRESULT {
    return Comdlg32.Load('PrintDlgExW')(pPD_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-printdlgw
  public static PrintDlgW(pPD_in_out: LPPRINTDLGW): BOOL {
    return Comdlg32.Load('PrintDlgW')(pPD_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-replacetexta
  public static ReplaceTextA(lpfr_in_out: LPFINDREPLACEA): HWND {
    return Comdlg32.Load('ReplaceTextA')(lpfr_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commdlg/nf-commdlg-replacetextw
  public static ReplaceTextW(lpfr_in_out: LPFINDREPLACEW): HWND {
    return Comdlg32.Load('ReplaceTextW')(lpfr_in_out);
  }
}

export default Comdlg32;
