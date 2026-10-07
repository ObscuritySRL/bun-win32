// Live window capture through Windows.Graphics.Capture. One borderless, cursorless session per window delivers frames
// into a free-threaded pool; Iris drains the pool by polling on its own thread and copies the newest frame into a
// mip-mapped texture (so a 2560-pixel window minified to a 600-pixel card stays crisp instead of shimmering).

import { FFIType } from 'bun:ffi';

import User32 from '@bun-win32/user32';

import type { Device } from './device';
import type { Renderer, Texture } from './renderer';
import { activationFactory, closeAndRelease, comRelease, getInterface, guidBytes, queryInterface, vcall } from './winrt';

const DXGI_FORMAT_B8G8R8A8_UNORM = 87;
const FRAME_GET_CONTENT_SIZE = 8;
const FRAME_GET_SURFACE = 6;
const ITEM_GET_SIZE = 7;
const INTEROP_CREATE_FOR_WINDOW = 3;
const POOL_CREATE_CAPTURE_SESSION = 10;
const POOL_RECREATE = 6;
const POOL_STATICS_CREATE_FREE_THREADED = 6;
const POOL_TRY_GET_NEXT_FRAME = 7;
const SESSION_PUT_IS_BORDER_REQUIRED = 7;
const SESSION_PUT_IS_CURSOR_CAPTURE_ENABLED = 7;
const SESSION_START_CAPTURE = 6;
const DXGI_ACCESS_GET_INTERFACE = 3;
const MULTITHREAD_SET_PROTECTED = 5;

const IID_ID3D10Multithread = '9b7e4e00-342c-4106-a19f-4f2704f689f0';
const IID_ID3D11Texture2D = '6f15aaf2-d208-4e89-9ab4-489535d34f9c';
const IID_IDirect3DDxgiInterfaceAccess = 'a9b3d012-3df2-4ee3-b8d1-8695f457d3c1';
const IID_IGraphicsCaptureItem = '79c3f95b-31f7-4ec2-a464-632ef5d30760';
const IID_IGraphicsCaptureItemInterop = '3628e81b-3cac-4c60-b7f4-23ce0e0c3356';
const IID_IGraphicsCaptureSession2 = '2c39ae40-7d2e-5044-804e-8b6799d4cf9e';
const IID_IGraphicsCaptureSession3 = 'f2cdd966-22ae-5ea1-9596-3a289344c3be';
const IID_IDirect3D11CaptureFramePoolStatics2 = '589b103f-6bbc-5df5-a991-02e28b3b66d5';

let interop = 0n;
let poolStatics = 0n;

/** Activate the WinRT capture factories once and make the device safe for the capture framework's worker threads. */
export function initializeCapture(device: Device): void {
  if (interop !== 0n) return;
  const multithread = queryInterface(device.device, IID_ID3D10Multithread);
  if (multithread !== 0n) {
    vcall(multithread, MULTITHREAD_SET_PROTECTED, [FFIType.i32], [1]);
    comRelease(multithread);
  }
  interop = activationFactory('Windows.Graphics.Capture.GraphicsCaptureItem', IID_IGraphicsCaptureItemInterop);
  poolStatics = activationFactory('Windows.Graphics.Capture.Direct3D11CaptureFramePool', IID_IDirect3D11CaptureFramePoolStatics2);
}

function packSize(width: number, height: number): bigint {
  return (BigInt(height >>> 0) << 32n) | BigInt(width >>> 0);
}

export class WindowCapture {
  #device: Device;
  #item = 0n;
  #pool = 0n;
  #poolHeight = 0;
  #poolWidth = 0;
  #renderer: Renderer;
  #scratch = new BigUint64Array(new ArrayBuffer(64));
  #session = 0n;
  contentHeight = 0;
  contentWidth = 0;
  frames = 0;
  lastFrameAt = 0;
  readonly hwnd: bigint;
  texture: Texture | null = null;

  private constructor(hwnd: bigint, device: Device, renderer: Renderer) {
    this.hwnd = hwnd;
    this.#device = device;
    this.#renderer = renderer;
  }

  /** Start capturing `hwnd`; null when Windows refuses (protected, elevated beyond reach, or already gone). */
  static create(hwnd: bigint, device: Device, renderer: Renderer): WindowCapture | null {
    const capture = new WindowCapture(hwnd, device, renderer);
    return capture.#start() ? capture : null;
  }

  #start(): boolean {
    const out = Buffer.alloc(8);
    if (vcall(interop, INTEROP_CREATE_FOR_WINDOW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [this.hwnd, guidBytes(IID_IGraphicsCaptureItem).ptr, out.ptr]) !== 0) return false;
    this.#item = out.readBigUInt64LE(0);
    if (this.#item === 0n) return false;
    const size = Buffer.alloc(8);
    vcall(this.#item, ITEM_GET_SIZE, [FFIType.ptr], [size.ptr]);
    this.#poolWidth = Math.max(1, size.readInt32LE(0));
    this.#poolHeight = Math.max(1, size.readInt32LE(4));
    if (
      vcall(
        poolStatics,
        POOL_STATICS_CREATE_FREE_THREADED,
        [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.u64, FFIType.ptr],
        [this.#device.winrtDevice, DXGI_FORMAT_B8G8R8A8_UNORM, 2, packSize(this.#poolWidth, this.#poolHeight), out.ptr],
      ) !== 0
    ) {
      this.release();
      return false;
    }
    this.#pool = out.readBigUInt64LE(0);
    if (vcall(this.#pool, POOL_CREATE_CAPTURE_SESSION, [FFIType.u64, FFIType.ptr], [this.#item, out.ptr]) !== 0) {
      this.release();
      return false;
    }
    this.#session = out.readBigUInt64LE(0);
    const session2 = queryInterface(this.#session, IID_IGraphicsCaptureSession2);
    if (session2 !== 0n) {
      vcall(session2, SESSION_PUT_IS_CURSOR_CAPTURE_ENABLED, [FFIType.u8], [0]);
      comRelease(session2);
    }
    const session3 = queryInterface(this.#session, IID_IGraphicsCaptureSession3);
    if (session3 !== 0n) {
      vcall(session3, SESSION_PUT_IS_BORDER_REQUIRED, [FFIType.u8], [0]);
      comRelease(session3);
    }
    vcall(this.#session, SESSION_START_CAPTURE, [], []);
    return true;
  }

  /** Drain the pool; if a frame arrived, copy the newest into the card texture. Returns whether the texture changed. */
  poll(): boolean {
    if (this.#pool === 0n) return false;
    const scratch = this.#scratch;
    let frame = 0n;
    for (;;) {
      scratch[0] = 0n;
      if (vcall(this.#pool, POOL_TRY_GET_NEXT_FRAME, [FFIType.ptr], [scratch.ptr]) !== 0) break;
      const next = scratch[0]!;
      if (next === 0n) break;
      if (frame !== 0n) closeAndRelease(frame);
      frame = next;
    }
    if (frame === 0n) return false;
    // A minimized window composes as its tiny caption — keep the last real frame instead.
    if (User32.IsIconic(this.hwnd) !== 0) {
      closeAndRelease(frame);
      return false;
    }
    const sizeView = new Int32Array(scratch.buffer, 8, 2);
    vcall(frame, FRAME_GET_CONTENT_SIZE, [FFIType.ptr], [sizeView.ptr]);
    const contentWidth = Math.max(1, sizeView[0]!);
    const contentHeight = Math.max(1, sizeView[1]!);
    let changed = false;
    const surface = getInterface(frame, FRAME_GET_SURFACE);
    const access = surface === 0n ? 0n : queryInterface(surface, IID_IDirect3DDxgiInterfaceAccess);
    if (access !== 0n) {
      scratch[3] = 0n;
      const textureView = new BigUint64Array(scratch.buffer, 24, 1);
      if (vcall(access, DXGI_ACCESS_GET_INTERFACE, [FFIType.ptr, FFIType.ptr], [guidBytes(IID_ID3D11Texture2D).ptr, textureView.ptr]) === 0) {
        const frameTexture = textureView[0]!;
        const width = Math.min(contentWidth, this.#poolWidth);
        const height = Math.min(contentHeight, this.#poolHeight);
        if (this.texture === null || this.texture.width !== width || this.texture.height !== height) {
          if (this.texture !== null) this.#renderer.releaseTexture(this.texture);
          this.texture = this.#renderer.createTexture(width, height, { mips: true });
        }
        this.#renderer.copyRegion(this.texture, frameTexture, width, height);
        this.#renderer.generateMips(this.texture);
        this.contentWidth = width;
        this.contentHeight = height;
        this.frames += 1;
        this.lastFrameAt = performance.now();
        changed = true;
        comRelease(frameTexture);
      }
      comRelease(access);
    }
    comRelease(surface);
    closeAndRelease(frame);
    if (contentWidth !== this.#poolWidth || contentHeight !== this.#poolHeight) {
      this.#poolWidth = contentWidth;
      this.#poolHeight = contentHeight;
      vcall(this.#pool, POOL_RECREATE, [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.u64], [this.#device.winrtDevice, DXGI_FORMAT_B8G8R8A8_UNORM, 2, packSize(contentWidth, contentHeight)]);
    }
    return changed;
  }

  release(): void {
    closeAndRelease(this.#session);
    closeAndRelease(this.#pool);
    comRelease(this.#item);
    this.#session = 0n;
    this.#pool = 0n;
    this.#item = 0n;
    if (this.texture !== null) this.#renderer.releaseTexture(this.texture);
    this.texture = null;
  }
}
