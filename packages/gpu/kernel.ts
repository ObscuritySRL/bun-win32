// run() / Kernel / GpuArray — the high-level compute API: textual register parsing,
// retained GPU arrays for zero-readback chaining, and one-shot in-place execution.

import { FFIType } from 'bun:ffi';

import { comRelease, vcall } from './com';
import { CTX_UPDATE_SUBRESOURCE } from './constants';
import { createComputeDevice, hasDevice, requireGpu } from './device';
import { makeConstantBuffer, makeStructuredBuffer, readbackBuffer, readbackBufferAsync, readbackBufferInto, updateConstantBuffer, uploadBufferChunked, type StructuredBuffer } from './buffer';
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

// Comments must never reach the parsers — a commented-out declaration would still
// match (a commented [numthreads] silently shrank a real dispatch). FXC compiles
// the ORIGINAL source; block comments become a space so tokens cannot fuse across /* */.
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, '');
}

/** Parse explicit register() buffer declarations. Throws actionable errors — this is the API contract, not a heuristic. */
export function parseKernelBindings(source: string): KernelBinding[] {
  if (typeof source !== 'string') {
    throw new Error(
      `Kernel source must be an HLSL string — got ${typeof source}. bun-gpu never transpiles JavaScript functions (gpu.js's fn.toString() transpiler was its defining failure mode: bundlers and minifiers silently corrupted kernels).`,
    );
  }
  const bindings: KernelBinding[] = [];
  for (const match of stripComments(source).matchAll(BUFFER_PATTERN)) {
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
  const match = NUMTHREADS_PATTERN.exec(stripComments(source));
  if (match === null) throw new Error('Kernel source has no [numthreads(x,y,z)] attribute on its entry point.');
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function kindOf(data: KernelArray): ScalarKind {
  return data instanceof Float32Array ? 'float' : data instanceof Int32Array ? 'int' : 'uint';
}

function ensureDevice(): void {
  if (!hasDevice()) createComputeDevice();
}

// gpuScope bookkeeping: GpuArrays register with the innermost open scope at creation.
// run()'s internal pool acquisitions suppress registration — pooled arrays are
// owned by the pool, never by a user scope.
const scopeStack: GpuArray[][] = [];
let scopeSuppressed = false;

/** A GPU-resident array (UAV + SRV). Survives across dispatches — the kernel-chaining primitive. */
export class GpuArray {
  #released = false;
  #resource: StructuredBuffer;
  readonly kind: ScalarKind;
  readonly length: number;

  private constructor(resource: StructuredBuffer, kind: ScalarKind, length: number) {
    this.#resource = resource;
    this.kind = kind;
    this.length = length;
    if (!scopeSuppressed && scopeStack.length > 0) scopeStack[scopeStack.length - 1]!.push(this);
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

  #requireLive(operation: string): void {
    if (this.#released) throw new Error(`GpuArray.${operation}: the array was released.`);
  }

  get buffer(): bigint {
    this.#requireLive('buffer');
    return this.#resource.buffer;
  }

  get srv(): bigint {
    this.#requireLive('srv');
    return this.#resource.srv!;
  }

  get uav(): bigint {
    this.#requireLive('uav');
    return this.#resource.uav!;
  }

  read(): KernelArray {
    this.#requireLive('read');
    const bytes = readbackBuffer(this.#resource.buffer, this.length * 4);
    return this.kind === 'float' ? new Float32Array(bytes) : this.kind === 'int' ? new Int32Array(bytes) : new Uint32Array(bytes);
  }

  /** Like read(), but never blocks the event loop — the GPU copy is polled across setImmediate turns. */
  async readAsync(): Promise<KernelArray> {
    this.#requireLive('readAsync');
    const bytes = await readbackBufferAsync(this.#resource.buffer, this.length * 4);
    return this.kind === 'float' ? new Float32Array(bytes) : this.kind === 'int' ? new Int32Array(bytes) : new Uint32Array(bytes);
  }

  /** Read back into a caller-owned typed array — single copy, zero allocation (the hot-loop read). */
  readInto<A extends KernelArray>(target: A): A {
    this.#requireLive('readInto');
    if (kindOf(target) !== this.kind) throw new Error(`GpuArray.readInto: target is ${kindOf(target)} but the array holds ${this.kind}.`);
    readbackBufferInto(this.#resource.buffer, this.length * 4, target);
    return target;
  }

  /** Upload CPU data into the existing GPU buffer (UpdateSubresource) — no reallocation, zero per-call wrappers. */
  write(data: KernelArray): void {
    this.#requireLive('write');
    if (kindOf(data) !== this.kind) throw new Error(`GpuArray.write: data is ${kindOf(data)} but the array holds ${this.kind}.`);
    if (data.length !== this.length) throw new Error(`GpuArray.write: data has ${data.length} elements but the array holds ${this.length}.`);
    // ≥32 MiB on hardware: chunked staging upload overlaps CPU memcpy with GPU DMA
    // (1.3-1.8× measured); otherwise full-resource UpdateSubresource from the
    // typed array's pointer.
    if (uploadBufferChunked(this.#resource.buffer, data, 4)) return;
    const { context } = requireGpu();
    vcall(context, CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [this.#resource.buffer, 0, null, data.ptr!, 0, 0], FFIType.void);
  }

  /** Idempotent: a second release is a no-op; any use after release throws. */
  release(): void {
    if (this.#released) return;
    this.#released = true;
    comRelease(this.#resource.uav ?? 0n);
    comRelease(this.#resource.srv ?? 0n);
    comRelease(this.#resource.buffer);
    this.#resource = { buffer: 0n };
  }
}

// Per-dispatch scratch, allocated once — Kernel.dispatch runs in hot loops. Safe to
// share: dispatch is synchronous and csSet copies these into FFI scratch Buffers
// (and its own cache arrays) during the call, so they never escape.
const dispatchConstantBuffers: bigint[] = [];
const dispatchShaderResources: bigint[] = [];
const dispatchUnorderedAccess: bigint[] = [];
const dispatchBindings = { cb: dispatchConstantBuffers, srv: dispatchShaderResources, uav: dispatchUnorderedAccess };

export class Kernel {
  #bindings: readonly KernelBinding[];
  #constantBuffer = 0n;
  #constantBufferByteSize = 0;
  #shader: bigint;
  #shaderResourceViewCount: number;
  #threads: readonly [number, number, number];
  #unorderedAccessViewCount: number;
  #usesUniforms: boolean;

  constructor(source: string, options: CompileOptions = {}) {
    this.#bindings = parseKernelBindings(source);
    this.#threads = parseNumthreads(source);
    this.#unorderedAccessViewCount = this.#bindings.filter((binding) => binding.writable).length;
    this.#shaderResourceViewCount = this.#bindings.length - this.#unorderedAccessViewCount;
    this.#usesUniforms = CBUFFER_PATTERN.test(stripComments(source));
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
    if (this.#shader === 0n) throw new Error('Kernel.dispatch: the kernel was released.');
    dispatchUnorderedAccess.length = this.#unorderedAccessViewCount;
    dispatchShaderResources.length = this.#shaderResourceViewCount;
    let maxLength = 1;
    for (const binding of this.#bindings) {
      const array = buffers[binding.name];
      if (array === undefined) throw new Error(`Kernel.dispatch: no GpuArray passed for buffer "${binding.name}".`);
      if (array.kind !== binding.kind) throw new Error(`Kernel.dispatch: buffer "${binding.name}" is declared ${binding.kind} but the GpuArray holds ${array.kind}.`);
      if (binding.writable) dispatchUnorderedAccess[binding.register] = array.uav;
      else dispatchShaderResources[binding.register] = array.srv;
      if (array.length > maxLength) maxLength = array.length;
    }
    let bufferCount = 0;
    for (const name in buffers) bufferCount += 1;
    if (bufferCount > this.#bindings.length) {
      for (const name in buffers) {
        if (!this.#bindings.some((binding) => binding.name === name)) throw new Error(`Kernel.dispatch: "${name}" does not match any kernel buffer (kernel declares: ${this.#bindings.map((binding) => binding.name).join(', ')}).`);
      }
    }
    dispatchConstantBuffers.length = 0;
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
      dispatchConstantBuffers[0] = this.#constantBuffer;
    }
    let x: number;
    let y = 1;
    let z = 1;
    if (options.groups === undefined) x = Math.ceil(maxLength / this.#threads[0]);
    else {
      x = options.groups[0];
      if (options.groups[1] !== undefined) y = options.groups[1];
      if (options.groups[2] !== undefined) z = options.groups[2];
    }
    csSet(this.#shader, dispatchBindings);
    dispatch(x, y, z);
  }

  /** Idempotent: a second release is a no-op; dispatch after release throws. */
  release(): void {
    comRelease(this.#constantBuffer);
    comRelease(this.#shader);
    this.#constantBuffer = 0n;
    this.#shader = 0n;
  }
}

// run() memoizes compiled kernels per (source, compile options) so repeat calls skip
// FXC entirely, and pools its GPU buffers per (kind, length) so repeat calls with the
// same shapes allocate no GPU resources at all (perf doctrine). Both caches are keyed
// to the live device and are released + rebuilt after a device change.
const runKernelCache = new Map<string, { device: bigint; kernel: Kernel }>();
// Bounded LRU (insertion order; first key is the victim) — template-interpolated
// sources would otherwise grow compiled shaders without limit, invisible to
// gpuMemory() (shaders are untracked). 64 covers any sane working set.
const RUN_KERNEL_CACHE_LIMIT = 64;
const runArrayPool = new Map<string, GpuArray[]>();
let runPoolDevice = 0n;
const RUN_POOL_LIMIT_PER_SHAPE = 8;

/** Internal: pooled GPU scratch acquisition (std.ts shares run()'s pool; not re-exported from index.ts). Created scope-suppressed — pooled arrays are owned by the pool, never by a user gpuScope. */
export function acquireRunArray(kind: ScalarKind, length: number): GpuArray {
  if (runPoolDevice !== requireGpu().device) {
    flushRunArrayPool();
    runPoolDevice = requireGpu().device;
  }
  const pooled = runArrayPool.get(`${kind}|${length}`);
  const existing = pooled?.pop();
  if (existing !== undefined) return existing;
  scopeSuppressed = true;
  try {
    return GpuArray.alloc(kind, length);
  } finally {
    scopeSuppressed = false;
  }
}

function flushRunArrayPool(): void {
  for (const pooled of runArrayPool.values()) {
    for (const array of pooled) array.release();
  }
  runArrayPool.clear();
}

/** Internal: return a pooled GPU scratch array (capped per shape; overflow releases). */
export function releaseRunArray(array: GpuArray): void {
  const key = `${array.kind}|${array.length}`;
  let pooled = runArrayPool.get(key);
  if (pooled === undefined) {
    pooled = [];
    runArrayPool.set(key, pooled);
  }
  if (pooled.length < RUN_POOL_LIMIT_PER_SHAPE) pooled.push(array);
  else array.release();
}

/** Release run()'s memoized kernels and pooled GPU buffers. destroyDevice() does this automatically. */
export function flushRunCache(): void {
  for (const entry of runKernelCache.values()) entry.kernel.release();
  runKernelCache.clear();
  flushRunArrayPool();
  runPoolDevice = 0n;
}

/**
 * Run synchronous `work`, then release every GpuArray it created except those it
 * returns (a GpuArray, or an array containing GpuArrays — kept arrays transfer to
 * the enclosing scope, if any). The tf.tidy-style leak guard for batch jobs.
 * Synchronous only: async work must manage releases itself.
 */
export function gpuScope<T>(work: () => T): T {
  const created: GpuArray[] = [];
  scopeStack.push(created);
  let result: T;
  try {
    result = work();
  } catch (error) {
    scopeStack.pop();
    for (const array of created) array.release();
    throw error;
  }
  scopeStack.pop();
  if (result instanceof Promise) {
    for (const array of created) array.release();
    throw new Error('gpuScope: work returned a Promise — gpuScope is synchronous-only (arrays would be released before the work completes). Manage releases manually for async work.');
  }
  const kept = new Set<GpuArray>();
  if (result instanceof GpuArray) kept.add(result);
  else if (Array.isArray(result)) {
    for (const item of result) if (item instanceof GpuArray) kept.add(item);
  }
  for (const array of created) {
    if (!kept.has(array)) array.release();
  }
  if (scopeStack.length > 0) {
    const parent = scopeStack[scopeStack.length - 1]!;
    for (const array of kept) parent.push(array);
  }
  return result;
}

/**
 * One-shot: compile (memoized per source), upload into pooled GPU buffers, dispatch,
 * read back (in place). The 10-line-wow API — repeat calls with the same source and
 * shapes touch FXC and the allocator zero times. Hot loops that want full control
 * still hold a Kernel + GpuArrays directly.
 */
export function run<T extends Record<string, KernelArray>>(source: string, buffers: T, options: RunOptions = {}): T {
  ensureDevice();
  const device = requireGpu().device;
  const cacheKey = options.compile === undefined ? source : `${source}|${JSON.stringify(options.compile)}`;
  let entry = runKernelCache.get(cacheKey);
  if (entry === undefined || entry.device !== device) {
    if (entry !== undefined) entry.kernel.release();
    else if (runKernelCache.size >= RUN_KERNEL_CACHE_LIMIT) {
      const victim = runKernelCache.keys().next().value!;
      runKernelCache.get(victim)!.kernel.release();
      runKernelCache.delete(victim);
    }
    runKernelCache.delete(cacheKey);
    entry = { device, kernel: new Kernel(source, options.compile) };
    runKernelCache.set(cacheKey, entry);
  } else {
    runKernelCache.delete(cacheKey); // LRU touch — re-insertion moves it to the back
    runKernelCache.set(cacheKey, entry);
  }
  const kernel = entry.kernel;
  const uploaded = new Map<string, GpuArray>();
  try {
    const bound: Record<string, GpuArray> = {};
    for (const binding of kernel.bindings) {
      const data = buffers[binding.name];
      if (data === undefined) throw new Error(`run: kernel declares buffer "${binding.name}" but no typed array was passed for it.`);
      const array = acquireRunArray(binding.kind, data.length);
      uploaded.set(binding.name, array); // registered before write() so a kind-mismatch throw still returns it to the pool
      array.write(data);
      bound[binding.name] = array;
    }
    let bufferCount = 0;
    for (const name in buffers) bufferCount += 1;
    if (bufferCount > kernel.bindings.length) {
      for (const name in buffers) {
        if (!kernel.bindings.some((binding) => binding.name === name)) throw new Error(`run: "${name}" does not match any kernel buffer (kernel declares: ${kernel.bindings.map((binding) => binding.name).join(', ')}).`);
      }
    }
    kernel.dispatch(bound, options);
    for (const binding of kernel.bindings) {
      if (binding.writable) uploaded.get(binding.name)!.readInto(buffers[binding.name]!);
    }
    return buffers;
  } finally {
    for (const array of uploaded.values()) releaseRunArray(array);
  }
}
