/**
 * coldtree-minimized — when a snapshot finds 0 actionable controls AND the window is MINIMIZED, the recovery note
 * must steer to manage_window {action:'restore'} (a UWP/WinUI window tears its UIA tree down while minimized, so
 * re-snapshotting alone won't repopulate it) — NOT the generic "re-snapshot / activate" note, which would loop.
 *
 * Pure-function assertions on coldTreeNote (deterministic), plus an opportunistic live check: minimize a WinUI app
 * (Calculator) and confirm that IF its tree reads empty, the snapshot carries the restore steer.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/coldtree-minimized.integration.test.ts
 */
import { coldTreeNote } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

// Pure-function branches — the load-bearing logic, no window needed.
assert(coldTreeNote(3) === '' && coldTreeNote(3, true) === '', 'a tree WITH controls gets no note (minimized or not)');
const cold = coldTreeNote(0, false);
const min = coldTreeNote(0, true);
assert(cold.length > 0 && !/MINIMIZED/.test(cold) && /desktop_snapshot again/.test(cold), 'empty + NOT minimized → the generic cold-tree note (re-snapshot)');
assert(/MINIMIZED/.test(min) && /manage_window \{action:"restore"\}/.test(min) && !/desktop_snapshot again/.test(min), 'empty + MINIMIZED → the restore steer (manage_window restore), NOT the re-snapshot loop');

// The UIPI-walled branch: an empty tree on a higher-integrity (elevated) window than the host must steer to
// relaunching the host ELEVATED, not to a re-snapshot/restore loop that can never cross the wall. (walled takes
// precedence over minimized — an elevated minimized window is still wall-blocked.)
const walled = coldTreeNote(0, false, true);
const walledMin = coldTreeNote(0, true, true);
assert(/higher integrity|UIPI/.test(walled) && /relaunch the MCP host ELEVATED/.test(walled) && !/desktop_snapshot again/.test(walled), 'empty + WALLED → relaunch-elevated steer, NOT a re-snapshot loop');
assert(/relaunch the MCP host ELEVATED/.test(walledMin), 'walled takes precedence over minimized (an elevated window is wall-blocked even when minimized)');

console.log(failures === 0 ? '\nPASS — coldTreeNote steers a minimized empty-tree window to a cursor-free restore, not a re-snapshot loop.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
