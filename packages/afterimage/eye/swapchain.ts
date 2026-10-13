// A flip-model swap chain for the overlay, paced by its frame-latency waitable object (latency 1):
// the render loop waits until DXGI wants a frame, so frames land on the display's own cadence with
// one frame of queue. The back buffer is both a render-target view (for the scene pass) and a
// texture (for Direct2D text).

import { FFIType, ptr } from 'bun:ffi';

import { DXGIDEVICE_GET_ADAPTER, DXGI_FORMAT_B8G8R8A8_UNORM, DEV_CREATE_RENDER_TARGET_VIEW, IID_ID3D11TEXTURE2D, IID_IDXGIDEVICE, comRelease, requireGpu, vcall } from '@bun-win32/gpu';
import Kernel32 from '@bun-win32/kernel32';

import { callOut, check, guid, queryInterface } from '../shared/com';
import type { Painter } from '../shared/painter';
import { DXGIFactory2, DXGIObject, DXGISwapChain, DXGISwapChain2, IID } from '../shared/slots';
import type { Surface } from './renderer';

const alphaModeIgnore = 0x3;
const flagLatencyWaitable = 0x40;
const makeWindowAssociation = 0x8;
const noAltEnter = 0x2;
const swapEffectFlipDiscard = 0x4;
const usageRenderTargetOutput = 0x20;

export class SwapChain implements Surface {
  height: number;
  renderTarget = 0n;
  texture = 0n;
  width: number;
  readonly #painter: Painter;
  readonly #swapChain: bigint;
  readonly #waitable: bigint;

  constructor(hwnd: bigint, width: number, height: number, painter: Painter) {
    const { device } = requireGpu();
    this.width = width;
    this.height = height;
    this.#painter = painter;
    const dxgiDevice = queryInterface(device, IID_IDXGIDEVICE);
    const adapter = callOut(dxgiDevice, DXGIDEVICE_GET_ADAPTER, [], [], 'IDXGIDevice::GetAdapter');
    const factory = callOut(adapter, DXGIObject.GetParent, [FFIType.ptr], [ptr(guid(IID.IDXGIFactory2))], 'GetParent(IDXGIFactory2)');
    try {
      const description = new Uint32Array(new ArrayBuffer(0x30));
      description.set([width, height, DXGI_FORMAT_B8G8R8A8_UNORM, 0, 1, 0, usageRenderTargetOutput, 2, 0, swapEffectFlipDiscard, alphaModeIgnore, flagLatencyWaitable]);
      const swapChain1 = callOut(factory, DXGIFactory2.CreateSwapChainForHwnd, [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u64], [device, hwnd, ptr(description), null, 0n], 'CreateSwapChainForHwnd');
      vcall(factory, makeWindowAssociation, [FFIType.u64, FFIType.u32], [hwnd, noAltEnter]);
      this.#swapChain = queryInterface(swapChain1, IID.IDXGISwapChain2);
      comRelease(swapChain1);
    } finally {
      comRelease(factory);
      comRelease(adapter);
      comRelease(dxgiDevice);
    }
    check(vcall(this.#swapChain, DXGISwapChain2.SetMaximumFrameLatency, [FFIType.u32], [1]), 'SetMaximumFrameLatency');
    this.#waitable = BigInt(vcall(this.#swapChain, DXGISwapChain2.GetFrameLatencyWaitableObject, [], [], FFIType.u64));
    this.#acquireBuffer();
  }

  dispose(): void {
    this.#releaseBuffer();
    Kernel32.CloseHandle(this.#waitable);
    comRelease(this.#swapChain);
  }

  present(): void {
    vcall(this.#swapChain, DXGISwapChain.Present, [FFIType.u32, FFIType.u32], [1, 0]);
  }

  resize(width: number, height: number): void {
    if (width === this.width && height === this.height) return;
    this.#releaseBuffer();
    check(vcall(this.#swapChain, DXGISwapChain.ResizeBuffers, [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32], [0, width, height, 0, flagLatencyWaitable]), 'ResizeBuffers');
    this.width = width;
    this.height = height;
    this.#acquireBuffer();
  }

  /** Block until DXGI is ready for the next frame (at most `timeout` ms). */
  wait(timeout = 100): void {
    Kernel32.WaitForSingleObjectEx(this.#waitable, timeout, 1);
  }

  #acquireBuffer(): void {
    this.texture = callOut(this.#swapChain, DXGISwapChain.GetBuffer, [FFIType.u32, FFIType.ptr], [0, ptr(guid(IID_ID3D11TEXTURE2D))], 'GetBuffer');
    this.renderTarget = callOut(requireGpu().device, DEV_CREATE_RENDER_TARGET_VIEW, [FFIType.u64, FFIType.ptr], [this.texture, null], 'CreateRenderTargetView(back buffer)');
  }

  #releaseBuffer(): void {
    this.#painter.releaseTarget(this.texture);
    comRelease(this.renderTarget);
    comRelease(this.texture);
    this.renderTarget = 0n;
    this.texture = 0n;
  }
}
