/**
 * dpi-awareness — uia.initialize() must make the process PER-MONITOR DPI-aware, not just system-DPI-aware.
 *
 * Under the old system-DPI awareness (SetProcessDPIAware), a mixed-DPI multi-monitor desktop (e.g. a 150% laptop +
 * a 100% external) has its secondary-monitor coordinates bitmap-virtualized by the OS, so UIA bounding rectangles
 * and click_point/SendInput coordinates disagree and clicks land in the wrong place. initialize() now calls shcore
 * SetProcessDpiAwareness(PROCESS_PER_MONITOR_DPI_AWARE) — a plain-int call with no pseudo-handle pointer marshal —
 * falling back to the user32 system-aware call only on pre-8.1 systems / when awareness is already fixed.
 *
 * Asserts (single-monitor safe — no rig needed): after initialize(), GetProcessDpiAwareness reports per-monitor,
 * and UIA still enumerates windows + reads bounds cleanly (no segfault from the new init path).
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/dpi-awareness.integration.test.ts
 */
import Shcore, { ProcessDpiAwareness } from '@bun-win32/shcore';
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
  const out = Buffer.alloc(4);
  const hr = Shcore.GetProcessDpiAwareness(0n, out.ptr!); // 0 = the current process
  const awareness = out.readInt32LE(0);
  assert(hr === 0, `GetProcessDpiAwareness succeeded (hr=0x${(hr >>> 0).toString(16)})`);
  assert(awareness === ProcessDpiAwareness.PROCESS_PER_MONITOR_DPI_AWARE, `the process is PER_MONITOR_DPI_AWARE after initialize() (got ${awareness}, want ${ProcessDpiAwareness.PROCESS_PER_MONITOR_DPI_AWARE})`);

  // The new init path must not have broken UIA: enumerate windows and read a bounding rectangle.
  const windows = uia.windows();
  assert(windows.length > 0, `UIA still enumerates top-level windows under per-monitor awareness (${windows.length})`);
  const target = windows.find((window) => window.title.length > 0);
  if (target !== undefined) {
    const app = uia.attach(target.hWnd);
    const bounds = app.boundingRectangle;
    assert(bounds.width >= 0 && bounds.height >= 0, `a window's bounding rectangle reads cleanly (${bounds.width}×${bounds.height})`);
    app.dispose();
  }
} finally {
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — initialize() makes the process per-monitor DPI-aware; UIA bounds + coords share one physical-pixel space.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
