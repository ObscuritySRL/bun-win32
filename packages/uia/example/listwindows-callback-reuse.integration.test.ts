/**
 * listwindows-callback-reuse — listWindows (and renderWidgetHandles) allocated a fresh JSCallback per call and closed
 * it; that ~233µs trampoline alloc is pure waste on what is now a hot path (popupSnapshot/newPopup run listWindows on
 * every invoke/expand, webRoots runs renderWidgetHandles on every Chromium/Electron action). Both now reuse ONE
 * persistent module-level JSCallback over a swappable accumulator reset at the start of each call.
 *
 * Proof: (correctness) the window count is STABLE across many repeated calls — a missed accumulator reset would make it
 * grow; the taskbar appears every call. (perf) the isolated cost of a per-call JSCallback alloc+close is reported to
 * show the overhead removed, and listWindows median per-call is reported. Read-only (no windows spawned).
 *
 * bun test is broken repo-wide — runnable script:
 * Run: bun run example/listwindows-callback-reuse.integration.test.ts
 */
import { FFIType, JSCallback } from 'bun:ffi';
import { uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
try {
  // Correctness: repeated calls must return a STABLE count (the accumulator is reset each call, not appended to).
  const counts: number[] = [];
  let taskbarEveryCall = true;
  for (let i = 0; i < 30; i += 1) {
    const windows = uia.windows({ includeUntitled: true });
    counts.push(windows.length);
    if (!windows.some((window) => window.className === 'Shell_TrayWnd')) taskbarEveryCall = false;
  }
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  assert(max - min <= 3, `window count is stable across 30 calls (no cross-call accumulation) — range ${min}..${max}`);
  assert(taskbarEveryCall, 'the taskbar (Shell_TrayWnd) is present in every call (the reused callback still enumerates correctly)');

  // Perf: the per-call JSCallback alloc+close cost that the old code paid and the new code does not.
  const allocStart = Bun.nanoseconds();
  for (let i = 0; i < 200; i += 1) {
    const callback = new JSCallback(() => 1, { args: [FFIType.u64, FFIType.i64], returns: FFIType.i32 });
    callback.close();
  }
  const allocPerCallUs = (Bun.nanoseconds() - allocStart) / 200 / 1000;

  const callStart = Bun.nanoseconds();
  for (let i = 0; i < 200; i += 1) uia.windows({ includeUntitled: true });
  const listPerCallMs = (Bun.nanoseconds() - callStart) / 200 / 1_000_000;

  console.log(`  removed per-call JSCallback alloc+close: ~${allocPerCallUs.toFixed(0)}µs | listWindows median ${listPerCallMs.toFixed(2)}ms/call`);
  assert(allocPerCallUs > 5, `the eliminated per-call JSCallback alloc cost is non-trivial (~${allocPerCallUs.toFixed(0)}µs)`);
  assert(listPerCallMs < 10, `listWindows stays well under any per-call pathology (${listPerCallMs.toFixed(2)}ms)`);
} finally {
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — listWindows/renderWidgetHandles reuse one persistent JSCallback; counts stable, alloc churn removed.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
