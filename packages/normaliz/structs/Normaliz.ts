import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BOOL, DWORD, INT, LPCWSTR, LPWSTR, NULL } from '../types/Normaliz';
import type { IdnFlags, NormalizationForm } from '../types/Normaliz';

/**
 * Thin, lazy-loaded FFI bindings for `normaliz.dll`.
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
 * import Normaliz from './structs/Normaliz';
 * import { NormalizationForm } from './types/Normaliz';
 *
 * const source = Buffer.from('e\u0301\0', 'utf16le');
 * const bufferLengthEstimate = Normaliz.NormalizeString(NormalizationForm.NormalizationC, source.ptr!, -1, null, 0);
 *
 * if (bufferLengthEstimate <= 0) {
 *   throw new Error('NormalizeString sizing call failed');
 * }
 *
 * const destination = Buffer.alloc(bufferLengthEstimate * 2);
 * const writtenLength = Normaliz.NormalizeString(NormalizationForm.NormalizationC, source.ptr!, -1, destination.ptr!, bufferLengthEstimate);
 * ```
 */
class Normaliz extends Win32 {
  protected static override name = 'normaliz.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    IdnToAscii: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    IdnToNameprepUnicode: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    IdnToUnicode: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    IsNormalizedString: { args: [FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    NormalizeString: { args: [FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-idntoascii
  public static IdnToAscii(dwFlags: IdnFlags | DWORD, lpUnicodeCharStr: LPCWSTR, cchUnicodeChar: INT, lpASCIICharStr: LPWSTR | NULL, cchASCIIChar: INT): INT {
    return Normaliz.Load('IdnToAscii')(dwFlags, lpUnicodeCharStr, cchUnicodeChar, lpASCIICharStr, cchASCIIChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-idntonameprepunicode
  public static IdnToNameprepUnicode(dwFlags: IdnFlags | DWORD, lpUnicodeCharStr: LPCWSTR, cchUnicodeChar: INT, lpNameprepCharStr: LPWSTR | NULL, cchNameprepChar: INT): INT {
    return Normaliz.Load('IdnToNameprepUnicode')(dwFlags, lpUnicodeCharStr, cchUnicodeChar, lpNameprepCharStr, cchNameprepChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-idntounicode
  public static IdnToUnicode(dwFlags: IdnFlags | DWORD, lpASCIICharStr: LPCWSTR, cchASCIIChar: INT, lpUnicodeCharStr: LPWSTR | NULL, cchUnicodeChar: INT): INT {
    return Normaliz.Load('IdnToUnicode')(dwFlags, lpASCIICharStr, cchASCIIChar, lpUnicodeCharStr, cchUnicodeChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-isnormalizedstring
  public static IsNormalizedString(NormForm: NormalizationForm, lpString: LPCWSTR, cwLength: INT): BOOL {
    return Normaliz.Load('IsNormalizedString')(NormForm, lpString, cwLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-normalizestring
  public static NormalizeString(NormForm: NormalizationForm, lpSrcString: LPCWSTR, cwSrcLength: INT, lpDstString: LPWSTR | NULL, cwDstLength: INT): INT {
    return Normaliz.Load('NormalizeString')(NormForm, lpSrcString, cwSrcLength, lpDstString, cwDstLength);
  }
}

export default Normaliz;
