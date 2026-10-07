// The Direct3D 11 device and the DirectComposition swap chain Iris presents through. The overlay window is created
// WS_EX_NOREDIRECTIONBITMAP and its swap chain is a premultiplied-alpha composition swap chain, so every pixel Iris
// does not paint is the live desktop underneath — the opening frame is literally the user's screen.

import { FFIType } from 'bun:ffi';

import D3d11 from '@bun-win32/d3d11';
import Kernel32 from '@bun-win32/kernel32';
import { CTX_CLEAR_RENDER_TARGET_VIEW, DEV_CREATE_RENDER_TARGET_VIEW, SWAP_GET_BUFFER, SWAP_PRESENT } from '@bun-win32/gpu';

import { Composition, Native } from './native';
import { comRelease, getInterface, guidBytes, hex, queryInterface, vcall } from './winrt';

const D3D11_CREATE_DEVICE_BGRA_SUPPORT = 0x0000_0020;
const D3D11_CREATE_DEVICE_DEBUG = 0x0000_0002;
const D3D_DRIVER_TYPE_HARDWARE = 1;
const D3D_DRIVER_TYPE_WARP = 5;
const D3D_FEATURE_LEVEL_11_0 = 0xb000;
const D3D11_SDK_VERSION = 7;
const DXGI_ALPHA_MODE_PREMULTIPLIED = 1;
const DXGI_FORMAT_B8G8R8A8_UNORM = 87;
const DXGI_SCALING_STRETCH = 0;
const DXGI_SWAP_CHAIN_FLAG_FRAME_LATENCY_WAITABLE_OBJECT = 0x0000_0040;
const DXGI_SWAP_EFFECT_FLIP_SEQUENTIAL = 3;
const DXGI_USAGE_RENDER_TARGET_OUTPUT = 0x0000_0020;

const IID_ID3D11Texture2D = '6f15aaf2-d208-4e89-9ab4-489535d34f9c';
const IID_IDCompositionDevice = 'c37ea93a-e7aa-450d-b16f-9746cb0407f3';
const IID_IDXGIDevice = '54ec77fa-1377-44e6-8c32-88fd5f44c84c';
const IID_IDXGIFactory2 = '50c83a1c-e072-4c48-87b0-3630fa36a6d0';
const IID_IDXGISwapChain2 = 'a8be2ac4-199f-4946-b331-79599fb98de7';
const IID_IDirect3DDevice = 'a37624ab-8d5f-4650-9d3e-9eae3d9bc670';

const DCOMPOSITION_DEVICE_COMMIT = 3;
const DCOMPOSITION_DEVICE_CREATE_TARGET_FOR_HWND = 6;
const DCOMPOSITION_DEVICE_CREATE_VISUAL = 7;
const DCOMPOSITION_TARGET_SET_ROOT = 3;
const DCOMPOSITION_VISUAL_SET_CONTENT = 15;
const DXGI_ADAPTER_GET_DESC = 8;
const DXGI_DEVICE_GET_ADAPTER = 7;
const DXGI_FACTORY2_CREATE_SWAP_CHAIN_FOR_COMPOSITION = 24;
const DXGI_OBJECT_GET_PARENT = 6;
const SWAP_CHAIN_RESIZE_BUFFERS = 13;
const SWAP_CHAIN2_GET_FRAME_LATENCY_WAITABLE_OBJECT = 33;
const SWAP_CHAIN2_SET_MAXIMUM_FRAME_LATENCY = 31;

export interface Device {
  adapterName: string;
  context: bigint;
  device: bigint;
  dxgiDevice: bigint;
  factory: bigint;
  /** IDirect3DDevice — the WinRT wrapper Windows.Graphics.Capture frame pools are created on. */
  winrtDevice: bigint;
}

function tryCreate(driverType: number, flags: number): { device: bigint; context: bigint } | null {
  const levels = Buffer.alloc(4);
  levels.writeUInt32LE(D3D_FEATURE_LEVEL_11_0, 0);
  const deviceOut = Buffer.alloc(8);
  const contextOut = Buffer.alloc(8);
  const result = D3d11.D3D11CreateDevice(null, driverType, 0n, flags, levels.ptr, 1, D3D11_SDK_VERSION, deviceOut.ptr, null, contextOut.ptr);
  if (result !== 0) return null;
  return { device: deviceOut.readBigUInt64LE(0), context: contextOut.readBigUInt64LE(0) };
}

export function createDevice(): Device {
  const flags = D3D11_CREATE_DEVICE_BGRA_SUPPORT | (Bun.env.IRIS_D3D_DEBUG ? D3D11_CREATE_DEVICE_DEBUG : 0);
  const created = tryCreate(D3D_DRIVER_TYPE_HARDWARE, flags) ?? tryCreate(D3D_DRIVER_TYPE_WARP, flags);
  if (created === null) throw new Error('D3D11CreateDevice failed on hardware and WARP');
  const dxgiDevice = queryInterface(created.device, IID_IDXGIDevice);
  const adapter = getInterface(dxgiDevice, DXGI_DEVICE_GET_ADAPTER);
  const description = Buffer.alloc(312);
  vcall(adapter, DXGI_ADAPTER_GET_DESC, [FFIType.ptr], [description.ptr]);
  const adapterName = description.toString('utf16le', 0, 256).split('\0')[0] ?? 'GPU';
  const factoryOut = Buffer.alloc(8);
  const parentResult = vcall(adapter, DXGI_OBJECT_GET_PARENT, [FFIType.ptr, FFIType.ptr], [guidBytes(IID_IDXGIFactory2).ptr, factoryOut.ptr]);
  comRelease(adapter);
  if (parentResult !== 0) throw new Error(`IDXGIAdapter::GetParent(IDXGIFactory2) failed: ${hex(parentResult)}`);
  const inspectableOut = Buffer.alloc(8);
  const interopResult = Native.CreateDirect3D11DeviceFromDXGIDevice(dxgiDevice, inspectableOut.ptr);
  if (interopResult !== 0) throw new Error(`CreateDirect3D11DeviceFromDXGIDevice failed: ${hex(interopResult)}`);
  const inspectable = inspectableOut.readBigUInt64LE(0);
  const winrtDevice = queryInterface(inspectable, IID_IDirect3DDevice);
  comRelease(inspectable);
  return { adapterName, context: created.context, device: created.device, dxgiDevice, factory: factoryOut.readBigUInt64LE(0), winrtDevice };
}

/** A premultiplied-alpha flip-model swap chain attached to a window through a DirectComposition visual. */
export class CompositionSurface {
  #backBuffer = 0n;
  #compositionDevice = 0n;
  #device: Device;
  #rtv = 0n;
  #swapChain = 0n;
  #target = 0n;
  #visual = 0n;
  #waitable = 0n;
  height: number;
  width: number;

  constructor(device: Device, hwnd: bigint, width: number, height: number) {
    this.#device = device;
    this.width = width;
    this.height = height;
    const description = Buffer.alloc(48); // DXGI_SWAP_CHAIN_DESC1
    description.writeUInt32LE(width, 0);
    description.writeUInt32LE(height, 4);
    description.writeUInt32LE(DXGI_FORMAT_B8G8R8A8_UNORM, 8);
    description.writeUInt32LE(1, 16); // SampleDesc.Count
    description.writeUInt32LE(DXGI_USAGE_RENDER_TARGET_OUTPUT, 24);
    description.writeUInt32LE(2, 28); // BufferCount
    description.writeUInt32LE(DXGI_SCALING_STRETCH, 32);
    description.writeUInt32LE(DXGI_SWAP_EFFECT_FLIP_SEQUENTIAL, 36);
    description.writeUInt32LE(DXGI_ALPHA_MODE_PREMULTIPLIED, 40);
    description.writeUInt32LE(DXGI_SWAP_CHAIN_FLAG_FRAME_LATENCY_WAITABLE_OBJECT, 44);
    const swapOut = Buffer.alloc(8);
    const swapResult = vcall(device.factory, DXGI_FACTORY2_CREATE_SWAP_CHAIN_FOR_COMPOSITION, [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], [device.device, description.ptr, 0n, swapOut.ptr]);
    if (swapResult !== 0) throw new Error(`CreateSwapChainForComposition failed: ${hex(swapResult)}`);
    this.#swapChain = swapOut.readBigUInt64LE(0);

    const swapChain2 = queryInterface(this.#swapChain, IID_IDXGISwapChain2);
    if (swapChain2 !== 0n) {
      vcall(swapChain2, SWAP_CHAIN2_SET_MAXIMUM_FRAME_LATENCY, [FFIType.u32], [1]);
      this.#waitable = BigInt(vcall(swapChain2, SWAP_CHAIN2_GET_FRAME_LATENCY_WAITABLE_OBJECT, [], [], FFIType.u64));
      comRelease(swapChain2);
    }

    const compositionOut = Buffer.alloc(8);
    const compositionResult = Composition.DCompositionCreateDevice(device.dxgiDevice, guidBytes(IID_IDCompositionDevice).ptr, compositionOut.ptr);
    if (compositionResult !== 0) throw new Error(`DCompositionCreateDevice failed: ${hex(compositionResult)}`);
    this.#compositionDevice = compositionOut.readBigUInt64LE(0);
    const targetOut = Buffer.alloc(8);
    const targetResult = vcall(this.#compositionDevice, DCOMPOSITION_DEVICE_CREATE_TARGET_FOR_HWND, [FFIType.u64, FFIType.i32, FFIType.ptr], [hwnd, 1, targetOut.ptr]);
    if (targetResult !== 0) throw new Error(`IDCompositionDevice::CreateTargetForHwnd failed: ${hex(targetResult)}`);
    this.#target = targetOut.readBigUInt64LE(0);
    this.#visual = getInterface(this.#compositionDevice, DCOMPOSITION_DEVICE_CREATE_VISUAL);
    vcall(this.#visual, DCOMPOSITION_VISUAL_SET_CONTENT, [FFIType.u64], [this.#swapChain]);
    vcall(this.#target, DCOMPOSITION_TARGET_SET_ROOT, [FFIType.u64], [this.#visual]);
    vcall(this.#compositionDevice, DCOMPOSITION_DEVICE_COMMIT, [], []);
    this.#acquireBackBuffer();
  }

  /** The back buffer texture (for read-back verification). */
  get backBuffer(): bigint {
    return this.#backBuffer;
  }

  get renderTargetView(): bigint {
    return this.#rtv;
  }

  #acquireBackBuffer(): void {
    const textureOut = Buffer.alloc(8);
    const bufferResult = vcall(this.#swapChain, SWAP_GET_BUFFER, [FFIType.u32, FFIType.ptr, FFIType.ptr], [0, guidBytes(IID_ID3D11Texture2D).ptr, textureOut.ptr]);
    if (bufferResult !== 0) throw new Error(`IDXGISwapChain::GetBuffer failed: ${hex(bufferResult)}`);
    this.#backBuffer = textureOut.readBigUInt64LE(0);
    const viewOut = Buffer.alloc(8);
    const viewResult = vcall(this.#device.device, DEV_CREATE_RENDER_TARGET_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [this.#backBuffer, null, viewOut.ptr]);
    if (viewResult !== 0) throw new Error(`CreateRenderTargetView failed: ${hex(viewResult)}`);
    this.#rtv = viewOut.readBigUInt64LE(0);
  }

  clear(red: number, green: number, blue: number, alpha: number): void {
    const color = new Float32Array([red, green, blue, alpha]);
    vcall(this.#device.context, CTX_CLEAR_RENDER_TARGET_VIEW, [FFIType.u64, FFIType.ptr], [this.#rtv, color.ptr], FFIType.void);
  }

  /** Present with vsync. Returns the HRESULT (DXGI_STATUS_OCCLUDED etc. are not errors for an overlay). */
  present(): number {
    return vcall(this.#swapChain, SWAP_PRESENT, [FFIType.u32, FFIType.u32], [1, 0]);
  }

  resize(width: number, height: number): void {
    if (width === this.width && height === this.height) return;
    comRelease(this.#rtv);
    comRelease(this.#backBuffer);
    this.#rtv = 0n;
    this.#backBuffer = 0n;
    const result = vcall(this.#swapChain, SWAP_CHAIN_RESIZE_BUFFERS, [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32], [0, width, height, 0, DXGI_SWAP_CHAIN_FLAG_FRAME_LATENCY_WAITABLE_OBJECT]);
    if (result !== 0) throw new Error(`ResizeBuffers failed: ${hex(result)}`);
    this.width = width;
    this.height = height;
    this.#acquireBackBuffer();
  }

  /** Block until the compositor is ready for the next frame (frame-latency 1 — the lowest-latency pacing DXGI offers). */
  waitForFrame(timeoutMilliseconds = 100): void {
    if (this.#waitable !== 0n) Kernel32.WaitForSingleObjectEx(this.#waitable, timeoutMilliseconds, 1);
  }

  release(): void {
    comRelease(this.#rtv);
    comRelease(this.#backBuffer);
    comRelease(this.#visual);
    comRelease(this.#target);
    comRelease(this.#compositionDevice);
    comRelease(this.#swapChain);
    if (this.#waitable !== 0n) Kernel32.CloseHandle(this.#waitable);
  }
}
