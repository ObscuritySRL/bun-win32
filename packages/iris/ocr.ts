// Reading pixels: Windows.Media.Ocr over a one-shot Windows.Graphics.Capture frame. Runs inside the indexer worker
// on its own D3D11 device. The frame goes GPU → staging → straight into a WinRT IBuffer with native memcpy (no
// JavaScript byte loop); windows larger than the engine's maximum dimension are read in overlapping tiles so small
// text keeps its full resolution. RecognizeAsync is polled, never awaited through a native callback.

import { FFIType } from 'bun:ffi';

import User32 from '@bun-win32/user32';
import { CTX_COPY_SUBRESOURCE_REGION, CTX_MAP, CTX_UNMAP, DEV_CREATE_TEXTURE_2D } from '@bun-win32/gpu';

import type { Device } from './device';
import { copyMemory } from './native';
import type { IndexedText } from './search';
import { ThumbnailHost } from './thumbnails';
import { activationFactory, asyncStatus, closeAndRelease, comRelease, consumeHString, getInterface, guidBytes, IID_IAsyncInfo, queryInterface, vcall } from './winrt';

const ASYNC_OPERATION_GET_RESULTS = 8;
const BUFFER_FACTORY_CREATE = 6;
const BUFFER_PUT_LENGTH = 8;
const BYTE_ACCESS_BUFFER = 3;
const ENGINE_RECOGNIZE_ASYNC = 6;
const LINE_GET_TEXT = 7;
const LINE_GET_WORDS = 6;
const OCR_STATICS_GET_MAX_IMAGE_DIMENSION = 6;
const OCR_STATICS_TRY_CREATE_FROM_USER_PROFILE = 10;
const RESULT_GET_LINES = 6;
const SOFTWARE_BITMAP_CREATE_COPY_FROM_BUFFER = 9;
const VECTOR_VIEW_GET_AT = 6;
const VECTOR_VIEW_GET_SIZE = 7;
const WORD_GET_BOUNDING_RECT = 6;
const WORD_GET_TEXT = 7;
const FRAME_GET_SURFACE = 6;
const DXGI_ACCESS_GET_INTERFACE = 3;
const INTEROP_CREATE_FOR_WINDOW = 3;
const ITEM_GET_SIZE = 7;
const POOL_CREATE_CAPTURE_SESSION = 10;
const POOL_STATICS_CREATE_FREE_THREADED = 6;
const POOL_TRY_GET_NEXT_FRAME = 7;
const SESSION_PUT_IS_BORDER_REQUIRED = 7;
const SESSION_START_CAPTURE = 6;
const TEXTURE_GET_DESC = 10;

const IID_IBufferByteAccess = '905a0fef-bc53-11df-8c49-001e4fc686da';
const IID_IBufferFactory = '71af914d-c10f-484b-bc50-14bc623b3a27';
const IID_ID3D11Texture2D = '6f15aaf2-d208-4e89-9ab4-489535d34f9c';
const IID_IDirect3DDxgiInterfaceAccess = 'a9b3d012-3df2-4ee3-b8d1-8695f457d3c1';
const IID_IDirect3D11CaptureFramePoolStatics2 = '589b103f-6bbc-5df5-a991-02e28b3b66d5';
const IID_IGraphicsCaptureItem = '79c3f95b-31f7-4ec2-a464-632ef5d30760';
const IID_IGraphicsCaptureItemInterop = '3628e81b-3cac-4c60-b7f4-23ce0e0c3356';
const IID_IGraphicsCaptureSession3 = 'f2cdd966-22ae-5ea1-9596-3a289344c3be';
const IID_IOcrEngineStatics = '5bffa85a-3384-3540-9940-699120d428a8';
const IID_ISoftwareBitmapStatics = 'df0385db-672f-4a9d-806e-c2442f343e86';

const BITMAP_PIXEL_FORMAT_BGRA8 = 87;
const D3D11_CPU_ACCESS_READ = 0x2_0000;
const D3D11_MAP_READ = 1;
const D3D11_USAGE_STAGING = 3;
const DXGI_FORMAT_B8G8R8A8_UNORM = 87;

export class OcrReader {
  #bufferFactory: bigint;
  #bitmapStatics: bigint;
  #device: Device;
  #engine: bigint;
  #interop: bigint;
  #maximumDimension: number;
  #poolStatics: bigint;

  constructor(device: Device) {
    this.#device = device;
    const statics = activationFactory('Windows.Media.Ocr.OcrEngine', IID_IOcrEngineStatics);
    const dimension = new Uint32Array(1);
    vcall(statics, OCR_STATICS_GET_MAX_IMAGE_DIMENSION, [FFIType.ptr], [dimension.ptr]);
    this.#maximumDimension = dimension[0]! > 0 ? dimension[0]! : 2600;
    this.#engine = getInterface(statics, OCR_STATICS_TRY_CREATE_FROM_USER_PROFILE);
    comRelease(statics);
    if (this.#engine === 0n) throw new Error('No OCR language is installed for this user profile');
    this.#bufferFactory = activationFactory('Windows.Storage.Streams.Buffer', IID_IBufferFactory);
    this.#bitmapStatics = activationFactory('Windows.Graphics.Imaging.SoftwareBitmap', IID_ISoftwareBitmapStatics);
    this.#interop = activationFactory('Windows.Graphics.Capture.GraphicsCaptureItem', IID_IGraphicsCaptureItemInterop);
    this.#poolStatics = activationFactory('Windows.Graphics.Capture.Direct3D11CaptureFramePool', IID_IDirect3D11CaptureFramePoolStatics2);
  }

  /** Grab one frame of `hwnd` into a CPU-readable staging texture. Caller releases the returned texture. */
  async grabFrame(hwnd: bigint): Promise<{ staging: bigint; width: number; height: number } | null> {
    const out = Buffer.alloc(8);
    if (vcall(this.#interop, INTEROP_CREATE_FOR_WINDOW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [hwnd, guidBytes(IID_IGraphicsCaptureItem).ptr, out.ptr]) !== 0) return null;
    const item = out.readBigUInt64LE(0);
    let pool = 0n;
    let session = 0n;
    let frame = 0n;
    try {
      const size = new Int32Array(2);
      vcall(item, ITEM_GET_SIZE, [FFIType.ptr], [size.ptr]);
      const packed = (BigInt(size[1]! >>> 0) << 32n) | BigInt(size[0]! >>> 0);
      if (vcall(this.#poolStatics, POOL_STATICS_CREATE_FREE_THREADED, [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.u64, FFIType.ptr], [this.#device.winrtDevice, DXGI_FORMAT_B8G8R8A8_UNORM, 1, packed, out.ptr]) !== 0) return null;
      pool = out.readBigUInt64LE(0);
      if (vcall(pool, POOL_CREATE_CAPTURE_SESSION, [FFIType.u64, FFIType.ptr], [item, out.ptr]) !== 0) return null;
      session = out.readBigUInt64LE(0);
      const session3 = queryInterface(session, IID_IGraphicsCaptureSession3);
      if (session3 !== 0n) {
        vcall(session3, SESSION_PUT_IS_BORDER_REQUIRED, [FFIType.u8], [0]);
        comRelease(session3);
      }
      vcall(session, SESSION_START_CAPTURE, [], []);
      const deadline = performance.now() + 700;
      while (frame === 0n && performance.now() < deadline) {
        out.writeBigUInt64LE(0n, 0);
        vcall(pool, POOL_TRY_GET_NEXT_FRAME, [FFIType.ptr], [out.ptr]);
        frame = out.readBigUInt64LE(0);
        if (frame === 0n) await Bun.sleep(8);
      }
      if (frame === 0n) return null;
      const surface = getInterface(frame, FRAME_GET_SURFACE);
      const access = surface === 0n ? 0n : queryInterface(surface, IID_IDirect3DDxgiInterfaceAccess);
      comRelease(surface);
      if (access === 0n) return null;
      const textureResult = vcall(access, DXGI_ACCESS_GET_INTERFACE, [FFIType.ptr, FFIType.ptr], [guidBytes(IID_ID3D11Texture2D).ptr, out.ptr]);
      comRelease(access);
      if (textureResult !== 0) return null;
      const texture = out.readBigUInt64LE(0);
      const description = Buffer.alloc(44);
      vcall(texture, TEXTURE_GET_DESC, [FFIType.ptr], [description.ptr], FFIType.void);
      const width = Math.min(description.readUInt32LE(0), Math.max(1, size[0]!));
      const height = Math.min(description.readUInt32LE(4), Math.max(1, size[1]!));
      const stagingDescription = Buffer.alloc(44);
      stagingDescription.writeUInt32LE(width, 0);
      stagingDescription.writeUInt32LE(height, 4);
      stagingDescription.writeUInt32LE(1, 8);
      stagingDescription.writeUInt32LE(1, 12);
      stagingDescription.writeUInt32LE(DXGI_FORMAT_B8G8R8A8_UNORM, 16);
      stagingDescription.writeUInt32LE(1, 20);
      stagingDescription.writeUInt32LE(D3D11_USAGE_STAGING, 28);
      stagingDescription.writeUInt32LE(D3D11_CPU_ACCESS_READ, 36);
      const stagingResult = vcall(this.#device.device, DEV_CREATE_TEXTURE_2D, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [stagingDescription.ptr, null, out.ptr]);
      if (stagingResult !== 0) {
        comRelease(texture);
        return null;
      }
      const staging = out.readBigUInt64LE(0);
      const box = new Uint32Array([0, 0, 0, width, height, 1]);
      vcall(this.#device.context, CTX_COPY_SUBRESOURCE_REGION, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr], [staging, 0, 0, 0, 0, texture, 0, box.ptr], FFIType.void);
      comRelease(texture);
      return { height, staging, width };
    } finally {
      closeAndRelease(frame);
      closeAndRelease(session);
      closeAndRelease(pool);
      comRelease(item);
    }
  }

  /** OCR the pixels of `hwnd` (a minimized window is read through a transient DWM-thumbnail host at native size). Word
   *  rectangles are returned in unit space of the window (0..1). */
  async read(hwnd: bigint): Promise<IndexedText[] | null> {
    let host: ThumbnailHost | null = null;
    if (User32.IsIconic(hwnd) !== 0) {
      host = new ThumbnailHost();
      host.sync([hwnd], 4096, 1);
    }
    let grabbed: Awaited<ReturnType<OcrReader['grabFrame']>>;
    try {
      grabbed = await this.grabFrame(host?.hwnd ?? hwnd);
    } finally {
      host?.destroy();
    }
    if (grabbed === null) return null;
    const { height, staging, width } = grabbed;
    const mapped = Buffer.alloc(16);
    if (vcall(this.#device.context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging, 0, D3D11_MAP_READ, 0, mapped.ptr]) !== 0) {
      comRelease(staging);
      return null;
    }
    const data = mapped.readBigUInt64LE(0);
    const rowPitch = mapped.readUInt32LE(8);
    const tiles: { bitmap: bigint; x: number; y: number }[] = [];
    try {
      const tileSize = this.#maximumDimension;
      const overlap = 96;
      for (let y = 0; y < height; y += tileSize - overlap) {
        for (let x = 0; x < width; x += tileSize - overlap) {
          const tileWidth = Math.min(tileSize, width - x);
          const tileHeight = Math.min(tileSize, height - y);
          if (tileWidth < 40 || tileHeight < 16) continue;
          const bitmap = this.#bitmap(data, rowPitch, x, y, tileWidth, tileHeight);
          if (bitmap !== 0n) tiles.push({ bitmap, x, y });
          if (x + tileWidth >= width) break;
        }
        if (y + Math.min(tileSize, height - y) >= height) break;
      }
    } finally {
      vcall(this.#device.context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging, 0], FFIType.void);
      comRelease(staging);
    }
    const entries: IndexedText[] = [];
    const seen = new Set<string>();
    for (const tile of tiles) {
      try {
        await this.#recognize(tile.bitmap, tile.x, tile.y, width, height, entries, seen);
      } finally {
        comRelease(tile.bitmap);
      }
    }
    return entries;
  }

  #bitmap(data: bigint, rowPitch: number, x: number, y: number, width: number, height: number): bigint {
    const byteLength = width * height * 4;
    const out = Buffer.alloc(8);
    if (vcall(this.#bufferFactory, BUFFER_FACTORY_CREATE, [FFIType.u32, FFIType.ptr], [byteLength, out.ptr]) !== 0) return 0n;
    const buffer = out.readBigUInt64LE(0);
    const access = queryInterface(buffer, IID_IBufferByteAccess);
    if (access === 0n || vcall(access, BYTE_ACCESS_BUFFER, [FFIType.ptr], [out.ptr]) !== 0) {
      comRelease(access);
      comRelease(buffer);
      return 0n;
    }
    comRelease(access);
    const destination = out.readBigUInt64LE(0);
    const rowBytes = width * 4;
    for (let row = 0; row < height; row += 1) copyMemory(destination + BigInt(row * rowBytes), data + BigInt((y + row) * rowPitch + x * 4), rowBytes);
    vcall(buffer, BUFFER_PUT_LENGTH, [FFIType.u32], [byteLength]);
    const bitmapResult = vcall(this.#bitmapStatics, SOFTWARE_BITMAP_CREATE_COPY_FROM_BUFFER, [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], [buffer, BITMAP_PIXEL_FORMAT_BGRA8, width, height, out.ptr]);
    comRelease(buffer);
    return bitmapResult === 0 ? out.readBigUInt64LE(0) : 0n;
  }

  async #recognize(bitmap: bigint, offsetX: number, offsetY: number, width: number, height: number, entries: IndexedText[], seen: Set<string>): Promise<void> {
    const out = Buffer.alloc(8);
    if (vcall(this.#engine, ENGINE_RECOGNIZE_ASYNC, [FFIType.u64, FFIType.ptr], [bitmap, out.ptr]) !== 0) return;
    const operation = out.readBigUInt64LE(0);
    const info = queryInterface(operation, IID_IAsyncInfo);
    if (info === 0n) {
      comRelease(operation);
      return;
    }
    let result = 0n;
    let lines = 0n;
    try {
      const deadline = performance.now() + 8000;
      let status = 0;
      while ((status = asyncStatus(info)) === 0 && performance.now() < deadline) await Bun.sleep(4);
      if (status !== 1) return;
      result = getInterface(operation, ASYNC_OPERATION_GET_RESULTS);
      if (result === 0n) return;
      lines = getInterface(result, RESULT_GET_LINES);
      if (lines === 0n) return;
      const count = new Uint32Array(1);
      vcall(lines, VECTOR_VIEW_GET_SIZE, [FFIType.ptr], [count.ptr]);
      const rect = new Float32Array(4);
      for (let lineIndex = 0; lineIndex < count[0]!; lineIndex += 1) {
        if (vcall(lines, VECTOR_VIEW_GET_AT, [FFIType.u32, FFIType.ptr], [lineIndex, out.ptr]) !== 0) continue;
        const line = out.readBigUInt64LE(0);
        const lineText = consumeHString(getHString(line, LINE_GET_TEXT));
        const words = getInterface(line, LINE_GET_WORDS);
        if (words !== 0n) {
          const wordCount = new Uint32Array(1);
          vcall(words, VECTOR_VIEW_GET_SIZE, [FFIType.ptr], [wordCount.ptr]);
          for (let wordIndex = 0; wordIndex < wordCount[0]!; wordIndex += 1) {
            if (vcall(words, VECTOR_VIEW_GET_AT, [FFIType.u32, FFIType.ptr], [wordIndex, out.ptr]) !== 0) continue;
            const word = out.readBigUInt64LE(0);
            const text = consumeHString(getHString(word, WORD_GET_TEXT));
            vcall(word, WORD_GET_BOUNDING_RECT, [FFIType.ptr], [rect.ptr]);
            comRelease(word);
            const left = offsetX + rect[0]!;
            const top = offsetY + rect[1]!;
            const key = `${text}@${Math.round(left / 4)},${Math.round(top / 4)}`;
            if (text.length === 0 || seen.has(key)) continue;
            seen.add(key);
            entries.push({ line: lineText, lower: text.toLowerCase(), rect: [left / width, top / height, (left + rect[2]!) / width, (top + rect[3]!) / height], source: 'ocr', text });
          }
          comRelease(words);
        }
        comRelease(line);
      }
    } finally {
      comRelease(lines);
      comRelease(result);
      comRelease(info);
      comRelease(operation);
    }
  }
}

function getHString(object: bigint, slot: number): bigint {
  const out = Buffer.alloc(8);
  if (vcall(object, slot, [FFIType.ptr], [out.ptr]) !== 0) return 0n;
  return out.readBigUInt64LE(0);
}
