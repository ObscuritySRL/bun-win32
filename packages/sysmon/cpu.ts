import Kernel32 from '@bun-win32/kernel32';
import Ntdll, { STATUS_SUCCESS, SystemInformationClass } from '@bun-win32/ntdll';
import { type CpuTime, parseProcessorTimes } from './structs';
import { cpuLayout } from './system';

Kernel32.Preload(['GetSystemTimes']);
Ntdll.Preload(['NtQuerySystemInformation']);
const { GetSystemTimes } = Kernel32;
const { NtQuerySystemInformation } = Ntdll;

const PROCESSOR_TIMES_STRIDE = 48;

export interface CpuSample {
  /** Busy fraction per core, 0..1 — `1 - Δidle / (Δkernel + Δuser)`; kernel includes idle (NT convention), so this matches Task Manager. */
  perCore: number[];
  /** Mean of `perCore`. */
  total: number;
  /** User-mode share of each core's window, 0..1. */
  userFraction: number[];
}

export interface SystemTimes {
  idle: bigint;
  /** Kernel time INCLUDES idle (GetSystemTimes semantics). */
  kernel: bigint;
  user: bigint;
}

const processorTimesBuffer = Buffer.alloc(64 * PROCESSOR_TIMES_STRIDE);
const returnLength = Buffer.alloc(4);

function fetchProcessorTimes(): number {
  const status = NtQuerySystemInformation(SystemInformationClass.SystemProcessorPerformanceInformation, processorTimesBuffer.ptr, processorTimesBuffer.byteLength, returnLength.ptr);
  if (status !== STATUS_SUCCESS) throw new Error(`NtQuerySystemInformation(SystemProcessorPerformanceInformation) failed: NTSTATUS 0x${(status >>> 0).toString(16)}`);
  return returnLength.readUInt32LE(0) / PROCESSOR_TIMES_STRIDE; // the kernel's own entry count — outranks any precomputed core count
}

/** Raw cumulative per-core idle/kernel/user 100 ns counters (NtQuerySystemInformation class 8) — exactly what Task Manager deltas. */
export function cpuTimes(): CpuTime[] {
  return parseProcessorTimes(processorTimesBuffer, fetchProcessorTimes());
}

/** Whole-box cumulative idle/kernel/user FILETIMEs (GetSystemTimes) — an independent cross-check for `CpuSampler`'s aggregate. */
export function systemTimes(): SystemTimes {
  const idleBuffer = Buffer.alloc(8);
  const kernelBuffer = Buffer.alloc(8);
  const userBuffer = Buffer.alloc(8);
  if (GetSystemTimes(idleBuffer.ptr, kernelBuffer.ptr, userBuffer.ptr) === 0) throw new Error('GetSystemTimes failed');
  return {
    idle: idleBuffer.readBigUInt64LE(0),
    kernel: kernelBuffer.readBigUInt64LE(0),
    user: userBuffer.readBigUInt64LE(0),
  };
}

/**
 * Two-sample per-core CPU% engine. Pair with `createTicker`/`createSpinTicker` for fixed-rate
 * sampling. Zero allocation per tick beyond the FFI floor: the previous/current counters are
 * double-buffered Float64Arrays, the decode reads u32 halves (CPU-time magnitudes fit 2^53),
 * and the SAME result object/arrays are returned every call — copy them if you keep history.
 */
export class CpuSampler {
  #coreCount: number;
  #current: Float64Array;
  #previous: Float64Array;
  #primed = false;
  #result: CpuSample;
  #view = new DataView(processorTimesBuffer.buffer, processorTimesBuffer.byteOffset, processorTimesBuffer.byteLength);

  constructor() {
    this.#coreCount = fetchProcessorTimes();
    this.#current = new Float64Array(this.#coreCount * 3);
    this.#previous = new Float64Array(this.#coreCount * 3);
    this.#result = { perCore: new Array(this.#coreCount).fill(0), total: 0, userFraction: new Array(this.#coreCount).fill(0) };
  }

  /** Busy fractions since the previous call (first call returns zeros and primes the baseline). */
  sample(): CpuSample {
    const coreCount = fetchProcessorTimes();
    const view = this.#view;
    const current = this.#current;
    const previous = this.#previous;
    const result = this.#result;
    const cores = coreCount < this.#coreCount ? coreCount : this.#coreCount;
    for (let core = 0; core < cores; core += 1) {
      const offset = core * PROCESSOR_TIMES_STRIDE;
      current[core * 3] = view.getUint32(offset, true) + view.getUint32(offset + 4, true) * 4_294_967_296;
      current[core * 3 + 1] = view.getUint32(offset + 8, true) + view.getUint32(offset + 12, true) * 4_294_967_296;
      current[core * 3 + 2] = view.getUint32(offset + 16, true) + view.getUint32(offset + 20, true) * 4_294_967_296;
    }
    let totalBusy = 0;
    for (let core = 0; core < cores; core += 1) {
      const idleDelta = current[core * 3]! - previous[core * 3]!;
      const kernelDelta = current[core * 3 + 1]! - previous[core * 3 + 1]!;
      const userDelta = current[core * 3 + 2]! - previous[core * 3 + 2]!;
      const window = kernelDelta + userDelta; // kernel already contains idle
      if (!this.#primed || window <= 0) {
        result.perCore[core] = 0;
        result.userFraction[core] = 0;
        continue;
      }
      const busy = 1 - idleDelta / window;
      result.perCore[core] = busy < 0 ? 0 : busy > 1 ? 1 : busy;
      const userShare = userDelta / window;
      result.userFraction[core] = userShare < 0 ? 0 : userShare > 1 ? 1 : userShare;
      totalBusy += result.perCore[core]!;
    }
    result.total = cores > 0 ? totalBusy / cores : 0;
    this.#current = previous;
    this.#previous = current;
    this.#primed = true;
    return result;
  }
}
