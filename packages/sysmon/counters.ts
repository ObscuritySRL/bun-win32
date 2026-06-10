import Pdh, { PdhCounterFormat, PdhDetailLevel } from '@bun-win32/pdh';
import { parseMultiSz } from './structs';
import { preloadPending } from './preload';

preloadPending(Pdh, ['PdhAddEnglishCounterW', 'PdhCloseQuery', 'PdhCollectQueryData', 'PdhEnumObjectItemsW', 'PdhEnumObjectsW', 'PdhExpandWildCardPathW', 'PdhGetFormattedCounterValue', 'PdhOpenQueryW', 'PdhRemoveCounter']);
const { PdhAddEnglishCounterW, PdhCloseQuery, PdhCollectQueryData, PdhEnumObjectItemsW, PdhEnumObjectsW, PdhExpandWildCardPathW, PdhGetFormattedCounterValue, PdhOpenQueryW, PdhRemoveCounter } = Pdh;

const PDH_CALC_NEGATIVE_DENOMINATOR = 0x8000_07d6;
const PDH_CALC_NEGATIVE_VALUE = 0x8000_07d8;
const PDH_CSTATUS_INVALID_DATA = 0xc000_0bba;
const PDH_INVALID_DATA = 0xc000_0bc6;
const PDH_MORE_DATA = 0x8000_07d2;
const PDH_NO_DATA = 0x8000_07d5;

export type CounterHandle = bigint;

export interface CounterItems {
  counters: string[];
  instances: string[];
}

export interface GpuProcessUsage {
  /** Engine-instance count contributing to this pid. */
  engines: number;
  /** Highest single-engine utilization — Task Manager's per-process GPU column definition. */
  maxEnginePercent: number;
  pid: number;
  /** Sum across all of the pid's engines (can exceed 100 on multi-engine use). */
  totalPercent: number;
}

/**
 * A PDH query: `add` English-named counter paths (locale-proof — the same names on a German or
 * Japanese box), `collect` samples, read `value`s as doubles. RATE counters (anything ending in
 * "/sec" or "% …") need TWO `collect()` calls with an interval between — the first only
 * establishes the baseline; `value()` explains this instead of returning a raw PDH hex status.
 * Instantaneous counters (e.g. `\Memory\Available MBytes`) are readable after one collect.
 */
export class CounterSet {
  #counterPaths = new Map<bigint, string>();
  #disposed = false;
  #query: bigint;
  #valueBuffer = Buffer.alloc(24);

  constructor() {
    const queryBuffer = Buffer.alloc(8);
    const status = PdhOpenQueryW(null, 0n, queryBuffer.ptr) >>> 0;
    if (status !== 0) throw new Error(`PdhOpenQueryW failed: 0x${status.toString(16)}`);
    this.#query = queryBuffer.readBigUInt64LE(0);
  }

  /** Add a counter by its ENGLISH path (PdhAddEnglishCounterW), e.g. `\Processor(_Total)\% Processor Time`. */
  add(path: string): CounterHandle {
    const pathBuffer = Buffer.from(`${path}\0`, 'utf16le');
    const counterBuffer = Buffer.alloc(8);
    const status = PdhAddEnglishCounterW(this.#query, pathBuffer.ptr, 0n, counterBuffer.ptr) >>> 0;
    if (status !== 0) throw new Error(`PdhAddEnglishCounterW('${path}') failed: 0x${status.toString(16)} — check the path with listCounterObjects()/listCounterItems()`);
    const handle = counterBuffer.readBigUInt64LE(0);
    this.#counterPaths.set(handle, path);
    return handle;
  }

  /** Snapshot every counter in the query (PdhCollectQueryData). Call twice, an interval apart, before reading rate counters. */
  collect(): void {
    const status = PdhCollectQueryData(this.#query) >>> 0;
    if (status !== 0) throw new Error(`PdhCollectQueryData failed: 0x${status.toString(16)}`);
  }

  /** Close every counter and the query. Safe to call twice. */
  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    for (const handle of this.#counterPaths.keys()) void PdhRemoveCounter(handle);
    this.#counterPaths.clear();
    void PdhCloseQuery(this.#query);
  }

  /** Formatted double for a counter added to this set (PDH_FMT_COUNTERVALUE: CStatus u32@0, double@8). */
  value(handle: CounterHandle): number {
    const status = PdhGetFormattedCounterValue(handle, PdhCounterFormat.PDH_FMT_DOUBLE, null, this.#valueBuffer.ptr) >>> 0;
    if (status === PDH_INVALID_DATA || status === PDH_CSTATUS_INVALID_DATA || status === PDH_NO_DATA) {
      throw new Error(
        `PDH 0x${status.toString(16)} for '${this.#counterPaths.get(handle) ?? handle}': rate counters need two collect() calls — the first only establishes the baseline. collect(), wait an interval, collect() again, then value().`,
      );
    }
    if (status === PDH_CALC_NEGATIVE_DENOMINATOR || status === PDH_CALC_NEGATIVE_VALUE) {
      throw new Error(`PDH 0x${status.toString(16)} for '${this.#counterPaths.get(handle) ?? handle}': the two collect() samples were too close together for this rate counter — leave a real interval (≥ ~100 ms) between collects.`);
    }
    if (status !== 0) throw new Error(`PdhGetFormattedCounterValue('${this.#counterPaths.get(handle) ?? handle}') failed: 0x${status.toString(16)}`);
    return this.#valueBuffer.readDoubleLE(8);
  }
}

/**
 * Expand a wildcard counter path (PdhExpandWildCardPathW) — e.g.
 * `\GPU Engine(*)\Utilization Percentage` → one live path per `pid_NNNN_…_engtype_X` instance,
 * exactly how Task Manager's GPU column works. Returns [] when the object has no instances.
 */
export function expandCounterPath(wildcardPath: string): string[] {
  const pathBuffer = Buffer.from(`${wildcardPath}\0`, 'utf16le');
  const sizeBuffer = Buffer.alloc(4);
  sizeBuffer.writeUInt32LE(0, 0);
  const probeStatus = PdhExpandWildCardPathW(null, pathBuffer.ptr, null, sizeBuffer.ptr, 0) >>> 0;
  if (probeStatus !== PDH_MORE_DATA && probeStatus !== 0) return [];
  const chars = sizeBuffer.readUInt32LE(0);
  if (chars === 0) return [];
  const listBuffer = Buffer.alloc(chars * 2);
  const status = PdhExpandWildCardPathW(null, pathBuffer.ptr, listBuffer.ptr, sizeBuffer.ptr, 0) >>> 0;
  if (status !== 0) return [];
  return parseMultiSz(listBuffer, chars);
}

/**
 * Per-process GPU utilization via the PDH GPU Engine counter set — exactly how Task
 * Manager's GPU column works, and a documented npm monopoly (pidusage#131 has asked for
 * this since 2021). Samples every `pid_*_engtype_*` instance over `sampleMs` (default 200,
 * synchronous) and aggregates per pid. Returns [] on machines with no GPU engine counters.
 */
export function gpuUsageByProcess(sampleMs = 200): GpuProcessUsage[] {
  const paths = expandCounterPath('\\GPU Engine(*)\\Utilization Percentage');
  if (paths.length === 0) return [];
  const counterSet = new CounterSet();
  try {
    const instances: { handle: CounterHandle; pid: number }[] = [];
    for (const path of paths) {
      const match = /pid_(\d+)_/.exec(path);
      if (match === null) continue;
      instances.push({ handle: counterSet.add(path.replace(/^\\\\[^\\]+/, '')), pid: Number(match[1]) }); // expanded paths carry \\MACHINE — strip to the local form
    }
    counterSet.collect();
    Bun.sleepSync(sampleMs);
    counterSet.collect();
    const byPid = new Map<number, GpuProcessUsage>();
    for (const instance of instances) {
      const percent = counterSet.value(instance.handle);
      if (percent <= 0) continue;
      const row = byPid.get(instance.pid);
      if (row === undefined) byPid.set(instance.pid, { engines: 1, maxEnginePercent: percent, pid: instance.pid, totalPercent: percent });
      else {
        row.engines += 1;
        row.maxEnginePercent = Math.max(row.maxEnginePercent, percent);
        row.totalPercent += percent;
      }
    }
    return [...byPid.values()].sort((a, b) => b.maxEnginePercent - a.maxEnginePercent);
  } finally {
    counterSet.dispose();
  }
}

/** Counter + instance names for one performance object (PdhEnumObjectItemsW, dual size-buffer two-call). */
export function listCounterItems(objectName: string): CounterItems {
  const objectBuffer = Buffer.from(`${objectName}\0`, 'utf16le');
  const counterSizeBuffer = Buffer.alloc(4);
  const instanceSizeBuffer = Buffer.alloc(4);
  void PdhEnumObjectItemsW(null, null, objectBuffer.ptr, null, counterSizeBuffer.ptr, null, instanceSizeBuffer.ptr, PdhDetailLevel.PERF_DETAIL_WIZARD, 0);
  const counterChars = counterSizeBuffer.readUInt32LE(0);
  const instanceChars = instanceSizeBuffer.readUInt32LE(0);
  if (counterChars === 0) return { counters: [], instances: [] };
  const counterBuffer = Buffer.alloc(counterChars * 2);
  const instanceBuffer = instanceChars > 0 ? Buffer.alloc(instanceChars * 2) : null;
  const status = PdhEnumObjectItemsW(null, null, objectBuffer.ptr, counterBuffer.ptr, counterSizeBuffer.ptr, instanceBuffer === null ? null : instanceBuffer.ptr, instanceSizeBuffer.ptr, PdhDetailLevel.PERF_DETAIL_WIZARD, 0) >>> 0;
  if (status !== 0) throw new Error(`PdhEnumObjectItemsW('${objectName}') failed: 0x${status.toString(16)}`);
  return {
    counters: parseMultiSz(counterBuffer, counterChars),
    instances: instanceBuffer === null ? [] : parseMultiSz(instanceBuffer, instanceChars),
  };
}

/** Every performance-object name on this machine (PdhEnumObjectsW two-call; refreshes the object cache on the probe). */
export function listCounterObjects(): string[] {
  const sizeBuffer = Buffer.alloc(4);
  sizeBuffer.writeUInt32LE(0, 0);
  const probeStatus = PdhEnumObjectsW(null, null, null, sizeBuffer.ptr, PdhDetailLevel.PERF_DETAIL_WIZARD, 1) >>> 0;
  if (probeStatus !== PDH_MORE_DATA && probeStatus !== 0) throw new Error(`PdhEnumObjectsW probe failed: 0x${probeStatus.toString(16)}`);
  const chars = sizeBuffer.readUInt32LE(0);
  const listBuffer = Buffer.alloc(chars * 2);
  const status = PdhEnumObjectsW(null, null, listBuffer.ptr, sizeBuffer.ptr, PdhDetailLevel.PERF_DETAIL_WIZARD, 0) >>> 0;
  if (status !== 0) throw new Error(`PdhEnumObjectsW failed: 0x${status.toString(16)}`);
  return parseMultiSz(listBuffer, chars);
}

/**
 * One-shot ergonomic sampler: open a CounterSet over the paths, collect twice `sampleMs`
 * apart (the two-sample rule, handled for you), return `{ path: value }`. The "I just want
 * these 5 numbers once" API.
 */
export function sampleCounters(paths: string[], sampleMs = 200): Record<string, number> {
  const counterSet = new CounterSet();
  try {
    const handles = paths.map((path) => ({ handle: counterSet.add(path), path }));
    counterSet.collect();
    Bun.sleepSync(sampleMs);
    counterSet.collect();
    const values: Record<string, number> = {};
    for (const entry of handles) values[entry.path] = counterSet.value(entry.handle);
    return values;
  } finally {
    counterSet.dispose();
  }
}
