// run() / Kernel / GpuArray — the high-level compute API: textual register parsing,
// retained GPU arrays for zero-readback chaining, and one-shot in-place execution.

import { comRelease } from './com';
import { createComputeDevice, hasDevice, requireGpu } from './device';
import { makeConstantBuffer, makeStructuredBuffer, readbackBuffer, readbackBufferAsync, updateConstantBuffer, type StructuredBuffer } from './buffer';
import { csSet, dispatch } from './pipeline';
import { compile, makeComputeShader, type CompileOptions } from './shader';

export type KernelArray = Float32Array | Int32Array | Uint32Array;
export type ScalarKind = 'float' | 'int' | 'uint';

export interface KernelBinding {
  kind: ScalarKind;
  name: string;
  register: number;
  writable: boolean;
}

export interface DispatchOptions {
  /** Thread groups [x, y, z]. Default: [ceil(maxBoundLength / numthreadsX), 1, 1]. */
  groups?: readonly [number, number?, number?];
  /** Raw bytes for the cbuffer at register(b0) (use cbufferLayout() to build them). */
  uniforms?: Buffer | KernelArray;
}

export interface RunOptions extends DispatchOptions {
  compile?: CompileOptions;
}

const BUFFER_PATTERN = /\b(RW)?StructuredBuffer\s*<\s*(float|int|uint)\s*>\s+([A-Za-z_]\w*)\s*:\s*register\(\s*([tu])(\d+)\s*\)/g;
const CBUFFER_PATTERN = /\bcbuffer\s+\w+\s*:\s*register\(\s*b0\s*\)/;
const NUMTHREADS_PATTERN = /\[\s*numthreads\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*\]/;

/** Parse explicit register() buffer declarations. Throws actionable errors — this is the API contract, not a heuristic. */
export function parseKernelBindings(source: string): KernelBinding[] {
  if (typeof source !== 'string') {
    throw new Error(
      `Kernel source must be an HLSL string — got ${typeof source}. bun-gpu never transpiles JavaScript functions (gpu.js's fn.toString() transpiler was its defining failure mode: bundlers and minifiers silently corrupted kernels).`,
    );
  }
  const bindings: KernelBinding[] = [];
  for (const match of source.matchAll(BUFFER_PATTERN)) {
    const [, readWrite, kind, name, space, register] = match;
    const writable = readWrite === 'RW';
    if (writable && space !== 'u') throw new Error(`Kernel buffer "${name}": RWStructuredBuffer must use a u register — write : register(u${register}).`);
    if (!writable && space !== 't') throw new Error(`Kernel buffer "${name}": StructuredBuffer must use a t register — write : register(t${register}).`);
    bindings.push({ kind: kind === 'float' ? 'float' : kind === 'int' ? 'int' : 'uint', name: name!, register: Number(register), writable });
  }
  if (bindings.length === 0) throw new Error('Kernel source declares no StructuredBuffer/RWStructuredBuffer with an explicit register() annotation. Example: RWStructuredBuffer<float> data : register(u0);');
  for (const writable of [true, false]) {
    const registers = bindings
      .filter((binding) => binding.writable === writable)
      .map((binding) => binding.register)
      .sort((a, b) => a - b);
    registers.forEach((register, index) => {
      if (register !== index) throw new Error(`Kernel ${writable ? 'u' : 't'} registers must be dense from 0 (found ${writable ? 'u' : 't'}${register} where ${writable ? 'u' : 't'}${index} was expected).`);
    });
  }
  return bindings;
}

/** Parse the [numthreads(x,y,z)] attribute. Throws when absent. */
export function parseNumthreads(source: string): readonly [number, number, number] {
  const match = NUMTHREADS_PATTERN.exec(source);
  if (match === null) throw new Error('Kernel source has no [numthreads(x,y,z)] attribute on its entry point.');
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function kindOf(data: KernelArray): ScalarKind {
  return data instanceof Float32Array ? 'float' : data instanceof Int32Array ? 'int' : 'uint';
}

function ensureDevice(): void {
  if (!hasDevice()) createComputeDevice();
}

/** A GPU-resident array (UAV + SRV). Survives across dispatches — the kernel-chaining primitive. */
export class GpuArray {
  #resource: StructuredBuffer;
  readonly kind: ScalarKind;
  readonly length: number;

  private constructor(resource: StructuredBuffer, kind: ScalarKind, length: number) {
    this.#resource = resource;
    this.kind = kind;
    this.length = length;
  }

  static alloc(kind: ScalarKind, length: number): GpuArray {
    ensureDevice();
    return new GpuArray(makeStructuredBuffer({ count: length, srv: true, stride: 4, uav: true }), kind, length);
  }

  static from(data: KernelArray): GpuArray {
    ensureDevice();
    const initialData = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    return new GpuArray(makeStructuredBuffer({ count: data.length, initialData, srv: true, stride: 4, uav: true }), kindOf(data), data.length);
  }

  get buffer(): bigint {
    return this.#resource.buffer;
  }

  get srv(): bigint {
    return this.#resource.srv!;
  }

  get uav(): bigint {
    return this.#resource.uav!;
  }

  read(): KernelArray {
    const bytes = readbackBuffer(this.#resource.buffer, this.length * 4);
    return this.kind === 'float' ? new Float32Array(bytes) : this.kind === 'int' ? new Int32Array(bytes) : new Uint32Array(bytes);
  }

  /** Like read(), but never blocks the event loop — the GPU copy is polled across setImmediate turns. */
  async readAsync(): Promise<KernelArray> {
    const bytes = await readbackBufferAsync(this.#resource.buffer, this.length * 4);
    return this.kind === 'float' ? new Float32Array(bytes) : this.kind === 'int' ? new Int32Array(bytes) : new Uint32Array(bytes);
  }

  /** Read back into a caller-owned typed array (cast-free typed reads). */
  readInto<A extends KernelArray>(target: A): A {
    if (kindOf(target) !== this.kind) throw new Error(`GpuArray.readInto: target is ${kindOf(target)} but the array holds ${this.kind}.`);
    const bytes = readbackBuffer(this.#resource.buffer, this.length * 4);
    target.set(this.kind === 'float' ? new Float32Array(bytes) : this.kind === 'int' ? new Int32Array(bytes) : new Uint32Array(bytes));
    return target;
  }

  release(): void {
    comRelease(this.#resource.uav ?? 0n);
    comRelease(this.#resource.srv ?? 0n);
    comRelease(this.#resource.buffer);
  }
}

export class Kernel {
  #bindings: readonly KernelBinding[];
  #constantBuffer = 0n;
  #constantBufferByteSize = 0;
  #shader: bigint;
  #threads: readonly [number, number, number];
  #usesUniforms: boolean;

  constructor(source: string, options: CompileOptions = {}) {
    this.#bindings = parseKernelBindings(source);
    this.#threads = parseNumthreads(source);
    this.#usesUniforms = CBUFFER_PATTERN.test(source);
    ensureDevice();
    this.#shader = makeComputeShader(compile(source, 'main', 'cs_5_0', options));
  }

  get bindings(): readonly KernelBinding[] {
    return this.#bindings;
  }

  get threads(): readonly [number, number, number] {
    return this.#threads;
  }

  dispatch(buffers: Record<string, GpuArray>, options: DispatchOptions = {}): void {
    const uav: bigint[] = [];
    const srv: bigint[] = [];
    let maxLength = 1;
    for (const binding of this.#bindings) {
      const array = buffers[binding.name];
      if (array === undefined) throw new Error(`Kernel.dispatch: no GpuArray passed for buffer "${binding.name}".`);
      if (array.kind !== binding.kind) throw new Error(`Kernel.dispatch: buffer "${binding.name}" is declared ${binding.kind} but the GpuArray holds ${array.kind}.`);
      (binding.writable ? uav : srv)[binding.register] = binding.writable ? array.uav : array.srv;
      if (array.length > maxLength) maxLength = array.length;
    }
    const cb: bigint[] = [];
    if (options.uniforms !== undefined) {
      if (!this.#usesUniforms) throw new Error('Kernel.dispatch: uniforms were passed but the kernel declares no cbuffer at register(b0).');
      const raw = Buffer.isBuffer(options.uniforms) ? options.uniforms : Buffer.from(options.uniforms.buffer, options.uniforms.byteOffset, options.uniforms.byteLength);
      // UpdateSubresource copies the destination buffer's FULL (16-rounded) size from
      // the source pointer — pad so it never reads past the caller's bytes.
      const paddedByteSize = Math.ceil(raw.byteLength / 16) * 16;
      const bytes = raw.byteLength === paddedByteSize ? raw : Buffer.concat([raw], paddedByteSize);
      if (this.#constantBuffer !== 0n && this.#constantBufferByteSize !== paddedByteSize) {
        comRelease(this.#constantBuffer);
        this.#constantBuffer = 0n;
      }
      if (this.#constantBuffer === 0n) {
        this.#constantBuffer = makeConstantBuffer(paddedByteSize);
        this.#constantBufferByteSize = paddedByteSize;
      }
      updateConstantBuffer(this.#constantBuffer, bytes);
      cb.push(this.#constantBuffer);
    }
    const [x = Math.ceil(maxLength / this.#threads[0]), y = 1, z = 1] = options.groups ?? [];
    csSet(this.#shader, { cb, srv, uav });
    dispatch(x, y, z);
  }

  release(): void {
    comRelease(this.#constantBuffer);
    comRelease(this.#shader);
    this.#constantBuffer = 0n;
  }
}

// run() memoizes compiled kernels per (source, compile options) so repeat calls skip
// FXC entirely (the compile-per-call cliff, perf doctrine). Entries are keyed to the
// device that compiled them and are released + rebuilt after a device change.
const runKernelCache = new Map<string, { device: bigint; kernel: Kernel }>();

/**
 * One-shot: compile (memoized per source), upload, dispatch, read back (in place),
 * release the uploads. The 10-line-wow API. Hot loops should hold a Kernel +
 * GpuArrays instead — run() still creates and destroys every GPU buffer per call.
 */
export function run<T extends Record<string, KernelArray>>(source: string, buffers: T, options: RunOptions = {}): T {
  ensureDevice();
  const device = requireGpu().device;
  const cacheKey = options.compile === undefined ? source : `${source}|${JSON.stringify(options.compile)}`;
  let entry = runKernelCache.get(cacheKey);
  if (entry === undefined || entry.device !== device) {
    if (entry !== undefined) entry.kernel.release();
    entry = { device, kernel: new Kernel(source, options.compile) };
    runKernelCache.set(cacheKey, entry);
  }
  const kernel = entry.kernel;
  const uploaded = new Map<string, GpuArray>();
  try {
    const bound: Record<string, GpuArray> = {};
    for (const binding of kernel.bindings) {
      const data = buffers[binding.name];
      if (data === undefined) throw new Error(`run: kernel declares buffer "${binding.name}" but no typed array was passed for it.`);
      const array = GpuArray.from(data);
      uploaded.set(binding.name, array);
      bound[binding.name] = array;
    }
    kernel.dispatch(bound, options);
    for (const binding of kernel.bindings) {
      if (binding.writable) uploaded.get(binding.name)!.readInto(buffers[binding.name]!);
    }
    return buffers;
  } finally {
    for (const array of uploaded.values()) array.release();
  }
}
