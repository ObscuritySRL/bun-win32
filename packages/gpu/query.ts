// GPU timestamp timing via D3D11 queries — honest kernel milliseconds, not CPU wall-clock.

import { FFIType } from 'bun:ffi';

import { comRelease, vcall } from './com';
import { CTX_BEGIN, CTX_END, CTX_FLUSH, CTX_GET_DATA, D3D11_QUERY_TIMESTAMP, D3D11_QUERY_TIMESTAMP_DISJOINT, DEV_CREATE_QUERY } from './constants';
import { describeDeviceError, requireGpu } from './device';

export interface GpuTimerResult {
  /** True when the clock was disrupted (power events) — discard the sample and retry. */
  disjoint: boolean;
  /** Timestamp ticks per second. */
  frequency: bigint;
  gpuMilliseconds: number;
}

export interface GpuTimer {
  begin(): void;
  end(): void;
  release(): void;
  /** Flushes, waits for query data, and returns the timed span. Blocks the event loop for the full GPU drain — use resolveAsync in frame loops. */
  resolve(): GpuTimerResult;
  /** Like resolve(), but GetData is polled across setImmediate turns so timers/I/O/rendering keep running while the GPU drains. Do not re-enter begin()/end() until the promise settles (the queries are shared state). Polling keeps the loop live but still consumes CPU. */
  resolveAsync(): Promise<GpuTimerResult>;
}

function makeQuery(type: number): bigint {
  const { device } = requireGpu();
  // D3D11_QUERY_DESC: Query u32@0, MiscFlags u32@4.
  const desc = Buffer.alloc(8);
  desc.writeUInt32LE(type, 0);
  const pp = Buffer.alloc(8);
  const hr = vcall(device, DEV_CREATE_QUERY, [FFIType.ptr, FFIType.ptr], [desc.ptr!, pp.ptr!]);
  if (hr !== 0) throw new Error(`CreateQuery failed: ${describeDeviceError(hr)}`);
  return pp.readBigUInt64LE(0);
}

function getData(query: bigint, bytes: Buffer): void {
  const { context } = requireGpu();
  for (;;) {
    const hr = vcall(context, CTX_GET_DATA, [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], [query, bytes.ptr!, bytes.byteLength, 0]);
    if (hr === 0) return;
    if (hr !== 1) throw new Error(`ID3D11DeviceContext::GetData failed: ${describeDeviceError(hr)}`); // 1 = S_FALSE (not ready)
  }
}

// `bytes` is re-referenced after every await, so nothing FFI-visible spans a GC window.
async function getDataAsync(query: bigint, bytes: Buffer): Promise<void> {
  const { context } = requireGpu();
  for (;;) {
    const hr = vcall(context, CTX_GET_DATA, [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], [query, bytes.ptr!, bytes.byteLength, 0]);
    if (hr === 0) return;
    if (hr !== 1) throw new Error(`ID3D11DeviceContext::GetData failed: ${describeDeviceError(hr)}`); // 1 = S_FALSE (not ready)
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });
  }
}

// D3D11_QUERY_DATA_TIMESTAMP_DISJOINT: Frequency u64@0, Disjoint BOOL@8.
function decodeTimerData(disjointData: Buffer, startData: Buffer, endData: Buffer): GpuTimerResult {
  const frequency = disjointData.readBigUInt64LE(0);
  const disjoint = disjointData.readUInt32LE(8) !== 0;
  const ticks = endData.readBigUInt64LE(0) - startData.readBigUInt64LE(0);
  const gpuMilliseconds = frequency === 0n ? 0 : Number((ticks * 1_000_000n) / frequency) / 1000;
  return { disjoint, frequency, gpuMilliseconds };
}

/**
 * Create a GPU timer: begin() … GPU work … end() … resolve(). Timestamps are taken
 * on the GPU timeline (TIMESTAMP queries inside a TIMESTAMP_DISJOINT bracket), so
 * the result measures kernel execution, not submission.
 */
export function createGpuTimer(): GpuTimer {
  const disjointQuery = makeQuery(D3D11_QUERY_TIMESTAMP_DISJOINT);
  const startQuery = makeQuery(D3D11_QUERY_TIMESTAMP);
  const endQuery = makeQuery(D3D11_QUERY_TIMESTAMP);
  let released = false;
  function requireLive(operation: string): void {
    if (released) throw new Error(`GpuTimer.${operation}: the timer was released.`);
  }
  return {
    begin() {
      requireLive('begin');
      const { context } = requireGpu();
      vcall(context, CTX_BEGIN, [FFIType.u64], [disjointQuery], FFIType.void);
      vcall(context, CTX_END, [FFIType.u64], [startQuery], FFIType.void); // TIMESTAMP queries use End only
    },
    end() {
      requireLive('end');
      const { context } = requireGpu();
      vcall(context, CTX_END, [FFIType.u64], [endQuery], FFIType.void);
      vcall(context, CTX_END, [FFIType.u64], [disjointQuery], FFIType.void);
    },
    // Idempotent: a second release is a no-op; any use after release throws.
    release() {
      if (released) return;
      released = true;
      comRelease(endQuery);
      comRelease(startQuery);
      comRelease(disjointQuery);
    },
    resolve(): GpuTimerResult {
      requireLive('resolve');
      const { context } = requireGpu();
      vcall(context, CTX_FLUSH, [], [], FFIType.void);
      const disjointData = Buffer.alloc(16);
      getData(disjointQuery, disjointData);
      const startData = Buffer.alloc(8);
      getData(startQuery, startData);
      const endData = Buffer.alloc(8);
      getData(endQuery, endData);
      return decodeTimerData(disjointData, startData, endData);
    },
    async resolveAsync(): Promise<GpuTimerResult> {
      requireLive('resolveAsync');
      const { context } = requireGpu();
      vcall(context, CTX_FLUSH, [], [], FFIType.void);
      const disjointData = Buffer.alloc(16);
      await getDataAsync(disjointQuery, disjointData);
      const startData = Buffer.alloc(8);
      await getDataAsync(startQuery, startData);
      const endData = Buffer.alloc(8);
      await getDataAsync(endQuery, endData);
      return decodeTimerData(disjointData, startData, endData);
    },
  };
}
