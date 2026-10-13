// DXGI desktop duplication: find the adapter that actually drives the displays (on hybrid laptops
// that is the integrated GPU, not adapter 0), duplicate each attached output, and hand out frames.
// Losing access — a mode change, the UAC secure desktop, the lock screen — is a normal state here,
// not an error: the caller marks a gap and re-opens.

import { FFIType, ptr } from 'bun:ffi';

import { IID_ID3D11TEXTURE2D, comRelease, listAdapters, openAdapter, vcall } from '@bun-win32/gpu';

import { callOut, queryInterface } from '../shared/com';
import { DXGIAdapter, DXGIOutput, DXGIOutput1, DXGIOutputDuplication, IID } from '../shared/slots';

const identityRotation = 1;
const waitTimeout = 0x887a_0027;

export interface OutputDescription {
  height: number;
  index: number;
  left: number;
  monitor: bigint;
  name: string;
  /** DXGI_MODE_ROTATION; only IDENTITY is recorded faithfully. */
  rotation: number;
  top: number;
  width: number;
}

export type AcquireResult =
  | { status: 'frame'; imageUpdated: boolean; pointerMoved: boolean; pointerVisible: boolean; pointerX: number; pointerY: number; protectedContent: boolean; texture: bigint }
  | { status: 'idle' }
  | { status: 'lost' };

/** What a display records from: the real desktop (Duplication) or the synthetic stage. */
export interface FrameSource {
  readonly description: OutputDescription;
  readonly open: boolean;
  acquire(): AcquireResult;
  close(): void;
  release(): void;
  reopen(): boolean;
}

/** The first hardware adapter with attached outputs, and those outputs. */
export function findOutputs(): { adapter: number; outputs: OutputDescription[] } {
  const adapters = listAdapters();
  for (let adapterIndex = 0; adapterIndex < adapters.length; adapterIndex += 1) {
    if (adapters[adapterIndex]!.isSoftware) continue;
    const adapter = openAdapter(adapterIndex);
    const outputs: OutputDescription[] = [];
    try {
      for (let index = 0; ; index += 1) {
        const output = enumerateOutput(adapter, index);
        if (output === 0n) break;
        const description = describeOutput(output, index);
        comRelease(output);
        if (description !== null) outputs.push(description);
      }
    } finally {
      comRelease(adapter);
    }
    if (outputs.length > 0) return { adapter: adapterIndex, outputs };
  }
  return { adapter: 0, outputs: [] };
}

function describeOutput(output: bigint, index: number): OutputDescription | null {
  const description = new DataView(new ArrayBuffer(0x60));
  vcall(output, DXGIOutput.GetDesc, [FFIType.ptr], [ptr(description)]);
  if (description.getInt32(0x50, true) === 0) return null;
  const left = description.getInt32(0x40, true);
  const top = description.getInt32(0x44, true);
  return {
    height: description.getInt32(0x4c, true) - top,
    index,
    left,
    monitor: description.getBigUint64(0x58, true),
    name: Buffer.from(description.buffer, 0, 0x40).toString('utf16le').replace(/\0.*$/s, ''),
    rotation: description.getInt32(0x54, true),
    top,
    width: description.getInt32(0x48, true) - left,
  };
}

function enumerateOutput(adapter: bigint, index: number): bigint {
  const slot = new BigUint64Array(new ArrayBuffer(8));
  const result = vcall(adapter, DXGIAdapter.EnumOutputs, [FFIType.u32, FFIType.ptr], [index, ptr(slot)]);
  return result === 0 ? slot[0]! : 0n;
}

export class Duplication implements FrameSource {
  readonly description: OutputDescription;
  readonly #adapterIndex: number;
  readonly #device: bigint;
  #duplication = 0n;
  readonly #frameInfo = new DataView(new ArrayBuffer(0x30));
  #held = false;
  readonly #resourceSlot = new BigUint64Array(new ArrayBuffer(8));
  #texture = 0n;

  constructor(device: bigint, adapterIndex: number, description: OutputDescription) {
    this.#device = device;
    this.#adapterIndex = adapterIndex;
    this.description = description;
  }

  get open(): boolean {
    return this.#duplication !== 0n;
  }

  /** Non-blocking: a new desktop image, nothing new yet, or access lost (re-open later). */
  acquire(): AcquireResult {
    if (this.#duplication === 0n) return { status: 'lost' };
    this.#resourceSlot[0] = 0n;
    const result = vcall(this.#duplication, DXGIOutputDuplication.AcquireNextFrame, [FFIType.u32, FFIType.ptr, FFIType.ptr], [0, ptr(this.#frameInfo), ptr(this.#resourceSlot)]) >>> 0;
    if (result === waitTimeout) return { status: 'idle' };
    if (result !== 0) {
      this.close();
      return { status: 'lost' };
    }
    this.#held = true;
    const resource = this.#resourceSlot[0]!;
    this.#texture = queryInterface(resource, IID_ID3D11TEXTURE2D);
    comRelease(resource);
    return {
      imageUpdated: this.#frameInfo.getBigInt64(0x00, true) !== 0n,
      pointerMoved: this.#frameInfo.getBigInt64(0x08, true) !== 0n,
      pointerVisible: this.#frameInfo.getInt32(0x24, true) !== 0,
      pointerX: this.#frameInfo.getInt32(0x1c, true),
      pointerY: this.#frameInfo.getInt32(0x20, true),
      protectedContent: this.#frameInfo.getInt32(0x18, true) !== 0,
      status: 'frame',
      texture: this.#texture,
    };
  }

  close(): void {
    this.release();
    comRelease(this.#duplication);
    this.#duplication = 0n;
  }

  /** (Re)create the duplication. False while the desktop can't be duplicated (secure desktop, too many duplicators). */
  reopen(): boolean {
    this.close();
    const adapter = openAdapter(this.#adapterIndex);
    try {
      const output = enumerateOutput(adapter, this.description.index);
      if (output === 0n) return false;
      try {
        const current = describeOutput(output, this.description.index);
        if (current === null || current.width !== this.description.width || current.height !== this.description.height) return false;
        const output1 = queryInterface(output, IID.IDXGIOutput1);
        try {
          this.#duplication = callOut(output1, DXGIOutput1.DuplicateOutput, [FFIType.u64], [this.#device], 'DuplicateOutput');
        } catch {
          this.#duplication = 0n;
        } finally {
          comRelease(output1);
        }
      } finally {
        comRelease(output);
      }
    } finally {
      comRelease(adapter);
    }
    return this.#duplication !== 0n && this.description.rotation === identityRotation;
  }

  /** Hand the frame back to DWM — call as soon as the desktop texture has been copied. */
  release(): void {
    if (!this.#held) return;
    comRelease(this.#texture);
    this.#texture = 0n;
    vcall(this.#duplication, DXGIOutputDuplication.ReleaseFrame, [], []);
    this.#held = false;
  }
}
