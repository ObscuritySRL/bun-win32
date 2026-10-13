// Reading pixels: Windows.Media.Ocr through raw WinRT vtables, inside the worker. A BGRA bitmap
// becomes a SoftwareBitmap (written through IMemoryBufferByteAccess), RecognizeAsync is polled —
// never awaited through a native callback, which would arrive on a foreign thread — and the words
// come back with their rectangles. Images larger than the engine's limit are read in overlapping
// strips so small text keeps full resolution.

import { FFIType, ptr, toArrayBuffer } from 'bun:ffi';

import Combase from '@bun-win32/combase';
import { comRelease, vcall } from '@bun-win32/gpu';
import Kernel32 from '@bun-win32/kernel32';

import { callOut, guid } from '../shared/com';
import type { ReadWord } from './textindex';

const asyncCompleted = 1;
const asyncStarted = 0;
const bitmapBgra8 = 87;
const lockWrite = 2;
const multithreaded = 1;
const stripOverlap = 96;

const iid = {
  IAsyncInfo: '00000036-0000-0000-c000-000000000046',
  IClosable: '30d5a829-7fa4-4026-83bb-d75bae4ea99e',
  IMemoryBuffer: 'fbc4dd2a-245b-11e4-af98-689423260cf8',
  IMemoryBufferByteAccess: '5b0d3235-4dba-4d44-865e-8f1d0e4fd04d',
  IOcrEngineStatics: '5bffa85a-3384-3540-9940-699120d428a8',
  ISoftwareBitmapFactory: 'c99feb69-2d62-4d47-a6b3-4fdb6a07fdf8',
} as const;

// Slots counted from the MIDL C Vtbl structs in winrt/*.h (IInspectable occupies 0–5).
const slot = {
  asyncGetResults: 0x08,
  asyncInfoClose: 0x0a,
  asyncInfoStatus: 0x07,
  bitmapBufferPlane: 0x07,
  bitmapCreate: 0x06,
  bitmapLockBuffer: 0x0f,
  byteAccessGetBuffer: 0x03,
  closableClose: 0x06,
  engineRecognize: 0x06,
  engineStaticsMaximumDimension: 0x06,
  engineStaticsUserProfile: 0x0a,
  lineText: 0x07,
  lineWords: 0x06,
  memoryBufferReference: 0x06,
  resultLines: 0x06,
  vectorGetAt: 0x06,
  vectorSize: 0x07,
  wordRect: 0x06,
  wordText: 0x07,
} as const;

export class OcrReader {
  readonly maximumDimension: number;
  readonly #bitmapFactory: bigint;
  readonly #engine: bigint;

  /** Use `create()`, which returns null where the platform lacks the feature. */
  constructor(engine: bigint, bitmapFactory: bigint, maximumDimension: number) {
    this.#engine = engine;
    this.#bitmapFactory = bitmapFactory;
    this.maximumDimension = maximumDimension;
  }

  /** The reader for the user's languages, or null when Windows has no OCR language for them. */
  static create(): OcrReader | null {
    Combase.RoInitialize(multithreaded);
    try {
      const statics = activationFactory('Windows.Media.Ocr.OcrEngine', iid.IOcrEngineStatics);
      const dimension = new Uint32Array(new ArrayBuffer(4));
      vcall(statics, slot.engineStaticsMaximumDimension, [FFIType.ptr], [ptr(dimension)]);
      const engine = callOut(statics, slot.engineStaticsUserProfile, [], [], 'TryCreateFromUserProfileLanguages');
      comRelease(statics);
      if (engine === 0n) return null;
      return new OcrReader(engine, activationFactory('Windows.Graphics.Imaging.SoftwareBitmap', iid.ISoftwareBitmapFactory), dimension[0]! > 0 ? dimension[0]! : 2_600);
    } catch {
      return null;
    }
  }

  dispose(): void {
    comRelease(this.#engine);
    comRelease(this.#bitmapFactory);
  }

  /** Words in a top-down BGRA image, with rectangles in its pixels. */
  async read(pixels: Uint8Array, width: number, height: number): Promise<ReadWord[]> {
    const words: ReadWord[] = [];
    const step = this.maximumDimension - stripOverlap;
    for (let top = 0; top < height; top += step) {
      for (let left = 0; left < width; left += step) {
        const stripWidth = Math.min(this.maximumDimension, width - left);
        const stripHeight = Math.min(this.maximumDimension, height - top);
        if (stripWidth >= 24 && stripHeight >= 12) {
          for (const word of await this.#recognize(pixels, width, left, top, stripWidth, stripHeight)) {
            const duplicate = words.some((other) => other.text === word.text && Math.abs(other.rect[0] - word.rect[0]) < 4 && Math.abs(other.rect[1] - word.rect[1]) < 4);
            if (!duplicate) words.push(word);
          }
        }
        if (left + stripWidth >= width) break;
      }
      if (top + Math.min(this.maximumDimension, height - top) >= height) break;
    }
    return words;
  }

  /** A SoftwareBitmap holding the given strip, written row by row into its locked buffer. */
  #bitmap(pixels: Uint8Array, imageWidth: number, left: number, top: number, width: number, height: number): bigint {
    const bitmap = callOut(this.#bitmapFactory, slot.bitmapCreate, [FFIType.u32, FFIType.i32, FFIType.i32], [bitmapBgra8, width, height], 'SoftwareBitmap.Create');
    const buffer = callOut(bitmap, slot.bitmapLockBuffer, [FFIType.u32], [lockWrite], 'LockBuffer');
    const memoryBuffer = callOut(buffer, 0x00, [FFIType.ptr], [ptr(guid(iid.IMemoryBuffer))], 'IMemoryBuffer');
    const reference = callOut(memoryBuffer, slot.memoryBufferReference, [], [], 'CreateReference');
    const access = callOut(reference, 0x00, [FFIType.ptr], [ptr(guid(iid.IMemoryBufferByteAccess))], 'IMemoryBufferByteAccess');
    try {
      const plane = new Int32Array(new ArrayBuffer(16));
      vcall(buffer, slot.bitmapBufferPlane, [FFIType.i32, FFIType.ptr], [0, ptr(plane)]);
      const address = new BigUint64Array(new ArrayBuffer(8));
      const capacity = new Uint32Array(new ArrayBuffer(4));
      vcall(access, slot.byteAccessGetBuffer, [FFIType.ptr, FFIType.ptr], [ptr(address), ptr(capacity)]);
      const process = Kernel32.GetCurrentProcess();
      for (let row = 0; row < height; row += 1) {
        const source = ((top + row) * imageWidth + left) * 4;
        Kernel32.WriteProcessMemory(process, address[0]! + BigInt(plane[0]! + row * plane[3]!), ptr(pixels.subarray(source, source + width * 4)), BigInt(width * 4), null);
      }
    } finally {
      comRelease(access);
      close(reference);
      comRelease(memoryBuffer);
      close(buffer);
    }
    return bitmap;
  }

  async #recognize(pixels: Uint8Array, imageWidth: number, left: number, top: number, width: number, height: number): Promise<ReadWord[]> {
    const bitmap = this.#bitmap(pixels, imageWidth, left, top, width, height);
    let operation = 0n;
    let information = 0n;
    let result = 0n;
    let lines = 0n;
    try {
      operation = callOut(this.#engine, slot.engineRecognize, [FFIType.u64], [bitmap], 'RecognizeAsync');
      information = callOut(operation, 0x00, [FFIType.ptr], [ptr(guid(iid.IAsyncInfo))], 'IAsyncInfo');
      const status = new Int32Array(new ArrayBuffer(4));
      for (;;) {
        vcall(information, slot.asyncInfoStatus, [FFIType.ptr], [ptr(status)]);
        if (status[0] !== asyncStarted) break;
        await Bun.sleep(1);
      }
      if (status[0] !== asyncCompleted) return [];
      result = callOut(operation, slot.asyncGetResults, [], [], 'GetResults');
      lines = callOut(result, slot.resultLines, [], [], 'get_Lines');
      const words: ReadWord[] = [];
      for (let lineIndex = 0; lineIndex < size(lines); lineIndex += 1) {
        const line = callOut(lines, slot.vectorGetAt, [FFIType.u32], [lineIndex], 'GetAt(line)');
        const lineText = hstringOut(line, slot.lineText);
        const lineWords = callOut(line, slot.lineWords, [], [], 'get_Words');
        for (let wordIndex = 0; wordIndex < size(lineWords); wordIndex += 1) {
          const word = callOut(lineWords, slot.vectorGetAt, [FFIType.u32], [wordIndex], 'GetAt(word)');
          const rect = new Float32Array(new ArrayBuffer(16));
          vcall(word, slot.wordRect, [FFIType.ptr], [ptr(rect)]);
          const x = left + rect[0]!;
          const y = top + rect[1]!;
          words.push({ line: lineText, rect: [x, y, x + rect[2]!, y + rect[3]!], text: hstringOut(word, slot.wordText) });
          comRelease(word);
        }
        comRelease(lineWords);
        comRelease(line);
      }
      return words;
    } finally {
      comRelease(lines);
      comRelease(result);
      if (information !== 0n) vcall(information, slot.asyncInfoClose, [], []);
      comRelease(information);
      comRelease(operation);
      comRelease(bitmap);
    }
  }
}

function activationFactory(className: string, interfaceId: string): bigint {
  const name = createString(className);
  const out = new BigUint64Array(new ArrayBuffer(8));
  try {
    const result = Combase.RoGetActivationFactory(name, ptr(guid(interfaceId)), ptr(out));
    if (result !== 0) throw new Error(`RoGetActivationFactory(${className}) failed`);
    return out[0]!;
  } finally {
    Combase.WindowsDeleteString(name);
  }
}

/** IClosable::Close, then Release — WinRT resources that hold locks want both. */
function close(object: bigint): void {
  if (object === 0n) return;
  const closable = callOut(object, 0x00, [FFIType.ptr], [ptr(guid(iid.IClosable))], 'IClosable');
  vcall(closable, slot.closableClose, [], []);
  comRelease(closable);
  comRelease(object);
}

function createString(text: string): bigint {
  const out = new BigUint64Array(new ArrayBuffer(8));
  Combase.WindowsCreateString(ptr(Buffer.from(text, 'utf16le')), text.length, ptr(out));
  return out[0]!;
}

/** Call a `get_Text`-style getter and take ownership of the HSTRING it returns. */
function hstringOut(object: bigint, getter: number): string {
  const out = new BigUint64Array(new ArrayBuffer(8));
  vcall(object, getter, [FFIType.ptr], [ptr(out)]);
  const length = new Uint32Array(new ArrayBuffer(4));
  const raw = Combase.WindowsGetStringRawBuffer(out[0]!, ptr(length));
  const text = raw === null || length[0] === 0 ? '' : Buffer.from(toArrayBuffer(raw, 0, length[0]! * 2)).toString('utf16le');
  Combase.WindowsDeleteString(out[0]!);
  return text;
}

function size(vector: bigint): number {
  const out = new Uint32Array(new ArrayBuffer(4));
  vcall(vector, slot.vectorSize, [FFIType.ptr], [ptr(out)]);
  return out[0]!;
}
