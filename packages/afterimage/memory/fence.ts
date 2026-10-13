// A real GPU fence for the worker (Direct3D 11.3+): signal after the work, ask the fence to set
// an event on completion, and sleep in the kernel until it does. Polling Map with Bun.sleep(1)
// rounded every wait up to the ~15.6 ms timer tick; this wakes the instant the GPU finishes,
// without spinning. Blocking is fine here — this is the worker, not the render thread.

import { FFIType, ptr } from 'bun:ffi';

import { CTX_FLUSH, comRelease, requireGpu, vcall } from '@bun-win32/gpu';
import Kernel32 from '@bun-win32/kernel32';

import { callOut, guid, queryInterface } from '../shared/com';
import { D3D11DeviceContext4, D3D11Device5, D3D11Fence, IID } from '../shared/slots';

export class GpuFence {
  readonly #context4: bigint;
  readonly #event: bigint;
  readonly #fence: bigint;
  #value = 0n;

  /** Use `create()`, which returns null where the platform lacks the feature. */
  constructor(context4: bigint, fence: bigint, event: bigint) {
    this.#context4 = context4;
    this.#fence = fence;
    this.#event = event;
  }

  /** A fence on the active device, or null where Direct3D 11.3 fences are unavailable (callers poll instead). */
  static create(): GpuFence | null {
    const { context, device } = requireGpu();
    let device5 = 0n;
    try {
      device5 = queryInterface(device, IID.ID3D11Device5);
      const fence = callOut(device5, D3D11Device5.CreateFence, [FFIType.u64, FFIType.u32, FFIType.ptr], [0n, 0, ptr(guid(IID.ID3D11Fence))], 'CreateFence');
      const context4 = queryInterface(context, IID.ID3D11DeviceContext4);
      return new GpuFence(context4, fence, Kernel32.CreateEventW(null, 0, 0, null));
    } catch {
      return null;
    } finally {
      comRelease(device5);
    }
  }

  dispose(): void {
    Kernel32.CloseHandle(this.#event);
    comRelease(this.#fence);
    comRelease(this.#context4);
  }

  /** Submit everything issued so far and sleep until the GPU has executed it (at most `timeout` ms). */
  wait(timeout = 2_000): void {
    this.#value += 1n;
    vcall(this.#context4, D3D11DeviceContext4.Signal, [FFIType.u64, FFIType.u64], [this.#fence, this.#value]);
    vcall(requireGpu().context, CTX_FLUSH, [], [], FFIType.void);
    vcall(this.#fence, D3D11Fence.SetEventOnCompletion, [FFIType.u64, FFIType.u64], [this.#value, this.#event]);
    Kernel32.WaitForSingleObject(this.#event, timeout);
  }
}
