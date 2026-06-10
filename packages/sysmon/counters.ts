import Pdh, { PdhCounterFormat, PdhDetailLevel } from '@bun-win32/pdh';
import { parseMultiSz } from './structs';

Pdh.Preload(['PdhAddEnglishCounterW', 'PdhCloseQuery', 'PdhCollectQueryData', 'PdhEnumObjectItemsW', 'PdhEnumObjectsW', 'PdhExpandWildCardPathW', 'PdhGetFormattedCounterValue', 'PdhOpenQueryW', 'PdhRemoveCounter']);
const { PdhAddEnglishCounterW, PdhCloseQuery, PdhCollectQueryData, PdhEnumObjectItemsW, PdhEnumObjectsW, PdhExpandWildCardPathW, PdhGetFormattedCounterValue, PdhOpenQueryW, PdhRemoveCounter } = Pdh;

const PDH_CSTATUS_INVALID_DATA = 0xc000_0bba;
const PDH_INVALID_DATA = 0xc000_0bc6;
const PDH_MORE_DATA = 0x8000_07d2;
const PDH_NO_DATA = 0x8000_07d5;

export type CounterHandle = bigint;

export interface CounterItems {
  counters: string[];
  instances: string[];
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
