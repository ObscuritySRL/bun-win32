import Kernel32, { INFINITE } from '@bun-win32/kernel32';
import { preloadPending } from './preload';

const CREATE_WAITABLE_TIMER_HIGH_RESOLUTION = 0x2;
const TIMER_ALL_ACCESS = 0x1f_0003;

preloadPending(Kernel32, ['CloseHandle', 'CreateWaitableTimerExW', 'QueryPerformanceCounter', 'QueryPerformanceFrequency', 'SetWaitableTimer', 'WaitForSingleObject']);
const { CloseHandle, CreateWaitableTimerExW, QueryPerformanceCounter, QueryPerformanceFrequency, SetWaitableTimer, WaitForSingleObject } = Kernel32;

export interface Ticker {
  dispose(): void;
  wait(): void;
}

/**
 * Fixed-interval pacer for sampling loops. Windows quantises async `Bun.sleep` to ~15.6 ms
 * (capping naive pollers at ~30–60 Hz); this arms ONE periodic high-resolution waitable
 * timer (Windows 10 1803+) so `wait()` is a single `WaitForSingleObject` on an absolute
 * cadence — re-arming a relative timer after each wake accumulates wake latency into the
 * period (measured ~1.5 ms at a 1 ms target), a periodic timer does not. Falls back to
 * `Bun.sleepSync` (NOT quantised, ~1.5 ms at 1 ms) when the timer is unavailable.
 * A slow consumer skips ticks (the signal does not queue) — exactly ticker semantics.
 */
export function createTicker(intervalMs: number): Ticker {
  const timer = CreateWaitableTimerExW(null, null, CREATE_WAITABLE_TIMER_HIGH_RESOLUTION, TIMER_ALL_ACCESS);
  if (timer === 0n) {
    return {
      dispose(): void {},
      wait(): void {
        Bun.sleepSync(intervalMs);
      },
    };
  }
  const dueTime = new BigInt64Array(1);
  dueTime[0] = BigInt(-Math.round(intervalMs * 10_000)); // first fire after one interval: relative (negative), 100 ns units
  void SetWaitableTimer(timer, dueTime.ptr, Math.max(1, Math.round(intervalMs)), null, null, 0);
  return {
    dispose(): void {
      void CloseHandle(timer);
    },
    wait(): void {
      void WaitForSingleObject(timer, INFINITE);
    },
  };
}

/**
 * Precise fixed-interval pacer: busy-spins on `monotonicMicroseconds()` to an ABSOLUTE
 * deadline schedule — measured sub-10 µs jitter at 1 ms (true 1000 Hz) at the cost of
 * pegging a core. Use `createTicker` for the jitter-tolerant, near-zero-CPU pacer
 * (~±0.5 ms wake latency on the waitable timer).
 */
export function createSpinTicker(intervalMs: number): Ticker {
  const intervalMicroseconds = intervalMs * 1000;
  let nextDeadline = -1;
  return {
    dispose(): void {},
    wait(): void {
      if (nextDeadline < 0) nextDeadline = monotonicMicroseconds() + intervalMicroseconds;
      const deadline = nextDeadline;
      while (monotonicMicroseconds() < deadline) {
        // busy-spin to the deadline
      }
      nextDeadline = deadline + intervalMicroseconds;
      if (nextDeadline < monotonicMicroseconds()) nextDeadline = monotonicMicroseconds() + intervalMicroseconds; // resync after a stall longer than one interval
    },
  };
}

const performanceFrequency = (() => {
  const frequencyBuffer = Buffer.alloc(8);
  void QueryPerformanceFrequency(frequencyBuffer.ptr);
  return Number(frequencyBuffer.readBigInt64LE(0));
})();
const microsecondsPerTick = 1_000_000 / performanceFrequency;
const counterBuffer = Buffer.alloc(8);

/** Monotonic timestamp in microseconds (QueryPerformanceCounter) — for timestamping samples and benchmark deltas. */
export function monotonicMicroseconds(): number {
  void QueryPerformanceCounter(counterBuffer.ptr);
  return (counterBuffer.readUInt32LE(4) * 4_294_967_296 + counterBuffer.readUInt32LE(0)) * microsecondsPerTick;
}

export interface WatchOptions {
  signal?: AbortSignal;
}

/**
 * High-rate paced polling that still yields to the event loop: each tick waits on the
 * high-resolution ticker (NOT the ~15.6 ms-quantized `setInterval`), calls `fn`, hands the
 * value to `onSample`, then yields a microtask turn so timers/IO keep running. Resolves with
 * the sample count when the signal aborts — the systeminformation `observe()` analog with
 * in-process calls instead of per-tick spawns.
 */
export async function watch<T>(fn: () => T, intervalMs: number, onSample: (value: T) => void, options?: WatchOptions): Promise<number> {
  const ticker = createTicker(intervalMs);
  let count = 0;
  try {
    while (options?.signal === undefined || !options.signal.aborted) {
      ticker.wait();
      onSample(fn());
      count += 1;
      await new Promise<void>((resolve) => setImmediate(resolve)); // MACROTASK yield — a bare Promise.resolve() would starve timers (the abort signal could never fire)
    }
  } finally {
    ticker.dispose();
  }
  return count;
}
