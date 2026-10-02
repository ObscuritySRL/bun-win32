/**
 * Process memory benchmarks: repeated scans, scalar reads, and reusable buffers.
 *
 * APIs demonstrated:
 * - Process.pattern (warm pattern reuse and bounded reads)
 * - Process.read / u32 (bulk reads versus scalar calls)
 * - bun:jsc.heapStats (observed heap and external-memory growth)
 *
 * Run: bun run example/performance.bench.ts [absolute-path-to-reference-index.ts]
 */
import { heapStats } from 'bun:jsc';

const { default: Process }: typeof import('../index.ts') = await import(Bun.argv[2] ?? '../index.ts');
using target = new Process(process.pid);
const region = target.alloc(0x100_0000);
const scratch = new Uint32Array(0x08);
const samples = new Float64Array(10_000);

try {
  target.write(region + 0x40n, Buffer.from('deadbeef', 'hex'));

  const workloads = [
    ['pattern: 4 KiB, no match', () => void target.pattern('cafe??ba', region, 0x1000)],
    ['pattern: 16 MiB, early match', () => void target.pattern('dead??ef', region, 0x100_0000)],
    [
      'read: 8 scalars',
      () => {
        for (let index = 0; index < 0x08; index++) void target.u32(region + BigInt(index * 0x04));
      },
    ],
    ['read: 1 reused buffer', () => void target.read(region, scratch)],
  ] as const;

  for (const [name, workload] of workloads) {
    const results = [];
    const iterations = name.includes('16 MiB') ? 200 : samples.length;

    for (let index = 0; index < Math.min(iterations, 2_000); index++) {
      workload();
    }

    for (let run = 0; run < 0x05; run++) {
      Bun.gc(true);
      const before = heapStats();

      for (let index = 0; index < iterations; index++) {
        const start = Bun.nanoseconds();
        workload();
        samples[index] = Bun.nanoseconds() - start;
      }

      const after = heapStats();
      const timings = samples.subarray(0x00, iterations);
      timings.sort();

      results.push({
        externalGrowthBytes: after.extraMemorySize - before.extraMemorySize,
        heapGrowthBytes: after.heapSize - before.heapSize,
        medianNanoseconds: timings[Math.floor(iterations / 0x02)]!,
        p99Nanoseconds: timings[Math.floor(iterations * 0.99)]!,
        run,
      });
    }

    console.log(name);
    console.table(results);
  }
} finally {
  target.free(region);
}
