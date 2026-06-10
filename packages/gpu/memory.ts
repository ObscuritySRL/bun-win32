// GPU resource accounting — pure-TS bookkeeping at the create/release chokepoints.
// GPU memory is invisible to JS heap tools; this is the only observability available.

const tracked = new Map<bigint, { byteSize: number; category: string; stride: number }>();

export interface GpuMemoryReport {
  bytesByCategory: Record<string, number>;
  liveResources: number;
  totalBytes: number;
}

/** Live GPU resources created through the package's make* helpers — buffers, textures, depth targets. Shaders, samplers, blend/raster/depth states, queries, and views are NOT tracked; engine-pooled staging never appears. */
export function gpuMemory(): GpuMemoryReport {
  const bytesByCategory: Record<string, number> = {};
  let totalBytes = 0;
  for (const entry of tracked.values()) {
    bytesByCategory[entry.category] = (bytesByCategory[entry.category] ?? 0) + entry.byteSize;
    totalBytes += entry.byteSize;
  }
  return { bytesByCategory, liveResources: tracked.size, totalBytes };
}

/** Internal: forget every tracked resource and warn when any were leaked (destroyDevice calls this). */
export function reportLeaksAndReset(): void {
  if (tracked.size > 0) {
    let totalBytes = 0;
    for (const entry of tracked.values()) totalBytes += entry.byteSize;
    console.warn(`@bun-win32/gpu: destroyDevice() with ${tracked.size} live GPU resource(s) still tracked (${totalBytes} bytes). GPU memory is never garbage-collected — release buffers/textures/shaders before destroying the device.`);
  }
  tracked.clear();
}

/** Internal: register a created resource (the make* creators call this). `stride` is the structure stride for STRUCTURED buffers (chunked readback needs stride-aligned edges); 0 elsewhere. */
export function trackResource(handle: bigint, byteSize: number, category: string, stride = 0): void {
  if (handle !== 0n) tracked.set(handle, { byteSize, category, stride });
}

/** Internal: byteSize of a tracked resource, or undefined when untracked (readback size validation uses this). */
export function trackedByteSize(handle: bigint): number | undefined {
  return tracked.get(handle)?.byteSize;
}

/** Internal: structure stride of a tracked resource (0 when non-structured or untracked). */
export function trackedStride(handle: bigint): number {
  return tracked.get(handle)?.stride ?? 0;
}

/** Internal: forget a released resource (comRelease calls this). */
export function untrackResource(handle: bigint): void {
  tracked.delete(handle);
}
