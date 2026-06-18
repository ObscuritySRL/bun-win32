// OCR (Windows.Media.Ocr) — read TEXT out of raw pixels, so an agent can perceive surfaces that expose NO
// accessibility tree at all: a <canvas> / WebGL app, a game, a video frame, a remote-desktop session, a chart,
// a scanned PDF, an image. Pairs with WGC (captureWindowLive — occluded/GPU/background pixels) and screen
// capture: SEE any window as text, with each word's SCREEN-pixel bounding box, then postClick it. Pure bun:ffi
// WinRT via combase (same activation path as wgc.ts), reusing com.ts vcall/guid/comRelease. RecognizeAsync is
// the one async op — drained by POLLING IAsyncInfo.get_Status on our thread (no completion handler, so the
// foreign-thread JSCallback dead-end is avoided). Every IID/slot is header-confirmed (windows.media.ocr.h,
// windows.graphics.imaging.h, windows.storage.streams.h, 10.0.22000.0) and live-proven before shipping.

import { FFIType, type Pointer, toArrayBuffer } from 'bun:ffi';

import Combase from '@bun-win32/combase';

import { initialize, setOcrDisposer } from '../com/automation';
import { comRelease, guid, vcall } from '../com/com';
import type { Rect } from '../com/reads';
import { captureScreen, type Bitmap } from './screen';
import { captureWindowLive } from './wgc';

const S_OK = 0;
const BITMAP_PIXEL_FORMAT_BGRA8 = 87;
const ASYNC_STATUS_COMPLETED = 1;

const RC_Buffer = 'Windows.Storage.Streams.Buffer';
const RC_SoftwareBitmap = 'Windows.Graphics.Imaging.SoftwareBitmap';
const RC_OcrEngine = 'Windows.Media.Ocr.OcrEngine';
const IID_IBufferFactory = '{71af914d-c10f-484b-bc50-14bc623b3a27}';
const IID_IBufferByteAccess = '{905a0fef-bc53-11df-8c49-001e4fc686da}';
const IID_ISoftwareBitmapStatics = '{df0385db-672f-4a9d-806e-c2442f343e86}';
const IID_IOcrEngineStatics = '{5bffa85a-3384-3540-9940-699120d428a8}';
const IID_IAsyncInfo = '{00000036-0000-0000-c000-000000000046}';

// vtable slots (0-based). IUnknown 0-2 / IInspectable 0-5; the rest header declaration order.
const BYTEACCESS_BUFFER = 3; // IBufferByteAccess (IUnknown-based)
const BUFFERFACTORY_CREATE = 6;
const BUFFER_PUT_LENGTH = 8;
const SBSTATICS_CREATE_COPY_FROM_BUFFER = 9;
const OCRSTATICS_TRY_CREATE_FROM_USER_PROFILE = 10;
const ENGINE_RECOGNIZE_ASYNC = 6;
const ASYNCINFO_GET_STATUS = 7;
const ASYNCOP_GET_RESULTS = 8;
const RESULT_GET_LINES = 6;
const RESULT_GET_TEXT = 8;
const VECTORVIEW_GET_AT = 6;
const VECTORVIEW_GET_SIZE = 7;
const LINE_GET_WORDS = 6;
const LINE_GET_TEXT = 7;
const WORD_GET_BOUNDING_RECT = 6;
const WORD_GET_TEXT = 7;

/** One recognized word with its bounding box (screen pixels — the bitmap origin is already added; postClick the centre). */
export interface OcrWord {
  text: string;
  bounds: Rect;
}

/** One recognized line: its text and the union bounding box of its words (screen pixels). */
export interface OcrLine {
  text: string;
  bounds: Rect;
  words: OcrWord[];
}

/** A recognition result: the full text plus per-line / per-word geometry for grounding clicks. */
export interface OcrText {
  text: string;
  lines: OcrLine[];
}

function hstring(text: string): bigint {
  const source = Buffer.from(`${text}\0`, 'utf16le');
  const out = Buffer.alloc(8);
  if (Combase.WindowsCreateString(source.ptr!, text.length, out.ptr!) !== S_OK) throw new Error(`WindowsCreateString(${text}) failed`);
  return out.readBigUInt64LE(0);
}

function activationFactory(runtimeClass: string, iid: string): bigint {
  const out = Buffer.alloc(8);
  const handle = hstring(runtimeClass);
  const hr = Combase.RoGetActivationFactory(handle, guid(iid).ptr!, out.ptr!);
  Combase.WindowsDeleteString(handle);
  const factory = out.readBigUInt64LE(0);
  if (hr !== S_OK || factory === 0n) throw new Error(`RoGetActivationFactory(${runtimeClass}) failed: 0x${(hr >>> 0).toString(16)}`);
  return factory;
}

function queryInterface(unknown: bigint, iid: string): bigint {
  const out = Buffer.alloc(8);
  if (vcall(unknown, 0, [FFIType.ptr, FFIType.ptr], [guid(iid).ptr!, out.ptr!]) !== S_OK) return 0n;
  return out.readBigUInt64LE(0);
}

function hstringText(handle: bigint): string {
  if (handle === 0n) return '';
  const lengthOut = Buffer.alloc(4);
  const pointer = Combase.WindowsGetStringRawBuffer(handle, lengthOut.ptr!);
  const length = lengthOut.readUInt32LE(0);
  if (pointer === null || length === 0) return '';
  const text = Buffer.from(toArrayBuffer(pointer as Pointer, 0, length * 2)).toString('utf16le');
  Combase.WindowsDeleteString(handle);
  return text;
}

interface OcrEngineBundle {
  bufferFactory: bigint;
  softwareBitmapStatics: bigint;
  engine: bigint;
}
let engineBundle: OcrEngineBundle | null = null;

function ensureEngine(): OcrEngineBundle {
  if (engineBundle !== null) return engineBundle;
  initialize(); // COM apartment (RoGetActivationFactory is apartment-agnostic under the STA)
  const ocrStatics = activationFactory(RC_OcrEngine, IID_IOcrEngineStatics);
  try {
    const engineOut = Buffer.alloc(8);
    if (vcall(ocrStatics, OCRSTATICS_TRY_CREATE_FROM_USER_PROFILE, [FFIType.ptr], [engineOut.ptr!]) !== S_OK) throw new Error('OcrEngine.TryCreateFromUserProfileLanguages failed');
    const engine = engineOut.readBigUInt64LE(0);
    if (engine === 0n) throw new Error('OcrEngine: no OCR language pack installed for the user profile');
    engineBundle = {
      bufferFactory: activationFactory(RC_Buffer, IID_IBufferFactory),
      softwareBitmapStatics: activationFactory(RC_SoftwareBitmap, IID_ISoftwareBitmapStatics),
      engine,
    };
    setOcrDisposer(disposeOcr);
    return engineBundle;
  } finally {
    comRelease(ocrStatics);
  }
}

/** Release the cached OCR engine + WinRT factories. Registered with automation.uninitialize() and exported for
 *  direct callers; self-guarded so it is a no-op when OCR was never used. */
export function disposeOcr(): void {
  if (engineBundle === null) return;
  comRelease(engineBundle.engine);
  comRelease(engineBundle.softwareBitmapStatics);
  comRelease(engineBundle.bufferFactory);
  engineBundle = null;
}

/** True when a user-profile OCR language pack is available (English is preinstalled on most Windows editions). */
export function ocrAvailable(): boolean {
  try {
    ensureEngine();
    return true;
  } catch {
    return false;
  }
}

/** Build a WinRT IBuffer holding a BGRA copy of an RGB bitmap. The channel order is irrelevant to OCR (it works
 *  on luminance), so RGB→BGRA is a straight repack. Returns the IBuffer (caller releases) or 0n on failure. */
function bgraBuffer(rgb: Uint8Array, width: number, height: number, bufferFactory: bigint): bigint {
  const byteLength = width * height * 4;
  const bufferOut = Buffer.alloc(8);
  if (vcall(bufferFactory, BUFFERFACTORY_CREATE, [FFIType.u32, FFIType.ptr], [byteLength, bufferOut.ptr!]) !== S_OK) return 0n;
  const buffer = bufferOut.readBigUInt64LE(0);
  const byteAccess = queryInterface(buffer, IID_IBufferByteAccess);
  if (byteAccess === 0n) {
    comRelease(buffer);
    return 0n;
  }
  try {
    const pointerOut = Buffer.alloc(8);
    if (vcall(byteAccess, BYTEACCESS_BUFFER, [FFIType.ptr], [pointerOut.ptr!]) !== S_OK) {
      comRelease(buffer);
      return 0n;
    }
    const destination = new Uint8Array(toArrayBuffer(Number(pointerOut.readBigUInt64LE(0)) as Pointer, 0, byteLength));
    for (let pixel = 0, source = 0, target = 0; pixel < width * height; pixel += 1, source += 3, target += 4) {
      destination[target] = rgb[source + 2]!; // B
      destination[target + 1] = rgb[source + 1]!; // G
      destination[target + 2] = rgb[source]!; // R
      destination[target + 3] = 255; // A
    }
    vcall(buffer, BUFFER_PUT_LENGTH, [FFIType.u32], [byteLength]);
    return buffer;
  } finally {
    comRelease(byteAccess);
  }
}

function readRect(word: bigint, offsetX: number, offsetY: number): Rect {
  const out = Buffer.alloc(16); // Windows.Foundation.Rect { float X, Y, Width, Height }
  vcall(word, WORD_GET_BOUNDING_RECT, [FFIType.ptr], [out.ptr!]);
  return { x: Math.round(out.readFloatLE(0)) + offsetX, y: Math.round(out.readFloatLE(4)) + offsetY, width: Math.round(out.readFloatLE(8)), height: Math.round(out.readFloatLE(12)) };
}

function unionBounds(words: OcrWord[]): Rect {
  if (words.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const word of words) {
    left = Math.min(left, word.bounds.x);
    top = Math.min(top, word.bounds.y);
    right = Math.max(right, word.bounds.x + word.bounds.width);
    bottom = Math.max(bottom, word.bounds.y + word.bounds.height);
  }
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/**
 * Run OCR over an RGB Bitmap (e.g. from captureWindowLive / captureScreen). Returns the full text plus per-line
 * and per-word bounding boxes in SCREEN pixels (the bitmap's origin is added), so a word can be postClicked
 * directly. The recognition runs async inside Windows.Media.Ocr and is drained by polling — `timeoutMs` bounds
 * the wait. Throws if no OCR language pack is installed (ocrAvailable() guards that).
 */
export async function ocrBitmap(bitmap: Bitmap, options: { timeoutMs?: number } = {}): Promise<OcrText> {
  const owned = ensureEngine();
  let buffer = 0n;
  let softwareBitmap = 0n;
  let operation = 0n;
  let asyncInfo = 0n;
  let result = 0n;
  let lines = 0n;
  try {
    buffer = bgraBuffer(bitmap.rgb, bitmap.width, bitmap.height, owned.bufferFactory);
    if (buffer === 0n) return { text: '', lines: [] };

    const bitmapOut = Buffer.alloc(8);
    if (vcall(owned.softwareBitmapStatics, SBSTATICS_CREATE_COPY_FROM_BUFFER, [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], [buffer, BITMAP_PIXEL_FORMAT_BGRA8, bitmap.width, bitmap.height, bitmapOut.ptr!]) !== S_OK) return { text: '', lines: [] };
    softwareBitmap = bitmapOut.readBigUInt64LE(0);

    const operationOut = Buffer.alloc(8);
    if (vcall(owned.engine, ENGINE_RECOGNIZE_ASYNC, [FFIType.u64, FFIType.ptr], [softwareBitmap, operationOut.ptr!]) !== S_OK) return { text: '', lines: [] };
    operation = operationOut.readBigUInt64LE(0);
    if (operation === 0n) return { text: '', lines: [] };

    asyncInfo = queryInterface(operation, IID_IAsyncInfo);
    const deadline = Bun.nanoseconds() + (options.timeoutMs ?? 8000) * 1e6;
    const statusOut = Buffer.alloc(4);
    let status = 0;
    while (status !== ASYNC_STATUS_COMPLETED && Bun.nanoseconds() < deadline) {
      vcall(asyncInfo, ASYNCINFO_GET_STATUS, [FFIType.ptr], [statusOut.ptr!]);
      status = statusOut.readInt32LE(0);
      if (status === 0) await Bun.sleep(10);
      else break; // 1 completed, 2 canceled, 3 error
    }
    if (status !== ASYNC_STATUS_COMPLETED) return { text: '', lines: [] };

    const resultOut = Buffer.alloc(8);
    if (vcall(operation, ASYNCOP_GET_RESULTS, [FFIType.ptr], [resultOut.ptr!]) !== S_OK) return { text: '', lines: [] };
    result = resultOut.readBigUInt64LE(0);
    if (result === 0n) return { text: '', lines: [] };

    const textOut = Buffer.alloc(8);
    vcall(result, RESULT_GET_TEXT, [FFIType.ptr], [textOut.ptr!]);
    const text = hstringText(textOut.readBigUInt64LE(0));

    const linesOut = Buffer.alloc(8);
    vcall(result, RESULT_GET_LINES, [FFIType.ptr], [linesOut.ptr!]);
    lines = linesOut.readBigUInt64LE(0);
    const outLines: OcrLine[] = [];
    if (lines !== 0n) {
      const sizeOut = Buffer.alloc(4);
      vcall(lines, VECTORVIEW_GET_SIZE, [FFIType.ptr], [sizeOut.ptr!]);
      const lineCount = sizeOut.readUInt32LE(0);
      for (let index = 0; index < lineCount; index += 1) {
        const lineOut = Buffer.alloc(8);
        if (vcall(lines, VECTORVIEW_GET_AT, [FFIType.u32, FFIType.ptr], [index, lineOut.ptr!]) !== S_OK) continue;
        const line = lineOut.readBigUInt64LE(0);
        try {
          const lineTextOut = Buffer.alloc(8);
          vcall(line, LINE_GET_TEXT, [FFIType.ptr], [lineTextOut.ptr!]);
          const lineText = hstringText(lineTextOut.readBigUInt64LE(0));
          const words: OcrWord[] = [];
          const wordsOut = Buffer.alloc(8);
          vcall(line, LINE_GET_WORDS, [FFIType.ptr], [wordsOut.ptr!]);
          const wordsView = wordsOut.readBigUInt64LE(0);
          if (wordsView !== 0n) {
            const wordSizeOut = Buffer.alloc(4);
            vcall(wordsView, VECTORVIEW_GET_SIZE, [FFIType.ptr], [wordSizeOut.ptr!]);
            const wordCount = wordSizeOut.readUInt32LE(0);
            for (let wordIndex = 0; wordIndex < wordCount; wordIndex += 1) {
              const wordOut = Buffer.alloc(8);
              if (vcall(wordsView, VECTORVIEW_GET_AT, [FFIType.u32, FFIType.ptr], [wordIndex, wordOut.ptr!]) !== S_OK) continue;
              const word = wordOut.readBigUInt64LE(0);
              try {
                const wordTextOut = Buffer.alloc(8);
                vcall(word, WORD_GET_TEXT, [FFIType.ptr], [wordTextOut.ptr!]);
                words.push({ text: hstringText(wordTextOut.readBigUInt64LE(0)), bounds: readRect(word, bitmap.originX, bitmap.originY) });
              } finally {
                comRelease(word);
              }
            }
            comRelease(wordsView);
          }
          outLines.push({ text: lineText, bounds: unionBounds(words), words });
        } finally {
          comRelease(line);
        }
      }
    }
    return { text, lines: outLines };
  } finally {
    comRelease(lines);
    comRelease(result);
    comRelease(asyncInfo);
    comRelease(operation);
    comRelease(softwareBitmap);
    comRelease(buffer);
  }
}

/**
 * OCR a window's live pixels — even occluded / background / GPU-composited (via WGC). Word/line bounding boxes
 * are in SCREEN pixels, so the agent can postClick recognized text in a window with no accessibility tree
 * (a game, a <canvas>/WebGL app, an embedded document). Returns null if the window cannot be captured.
 */
export async function ocrWindow(hWnd: bigint, options: { timeoutMs?: number } = {}): Promise<OcrText | null> {
  const capture = await captureWindowLive(hWnd);
  if (capture === null) return null;
  return ocrBitmap(capture, options);
}

/** OCR a screen region (default: the whole virtual desktop). Bounding boxes are in absolute screen pixels. */
export async function ocrScreen(region?: { x?: number; y?: number; width?: number; height?: number }, options: { timeoutMs?: number } = {}): Promise<OcrText> {
  return ocrBitmap(captureScreen(region), options);
}
