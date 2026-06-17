/**
 * dense-tree-budget — the maxNodes regression gate for a HIGH-DENSITY (flat) UIA tree. The perf-gate covers only
 * Calculator (~45-60 ms), so a window with thousands of NON-VIRTUALIZED sibling controls — a real LOB grid / toolbar /
 * icon-wall, a big WPF/WinForms panel — used to wall the agent ~7s with NO escape hatch: snapshot() ran an unbounded
 * BuildUpdatedCache(TreeScope_Subtree) that marshaled every sibling cross-process, and maxDepth could not bound it
 * (the cost is SIBLING navigation, not depth). The fix threads a maxNodes budget through snapshot()/walk()/walkLive()
 * (mirroring jab.ts) and enumerates each parent via the cached control-view walker's BuildCache child/sibling methods,
 * so a dense parent costs O(maxNodes) navigations and STOPS — setting RefNode.truncated, surfaced in the render.
 *
 * Proof (spawns a real WinForms window of 2000 Buttons via PowerShell):
 *  - snapshot({ maxNodes: 400 }) returns ~400 marks, FAST (well under the unbounded wall), with tree.truncated === true
 *    and a "raise maxNodes" trailer in the render — the escape hatch the agent now has.
 *  - an UNBOUNDED snapshot recovers ALL 2000 buttons (correctness: the budget is the only thing that changed, the new
 *    walker enumeration sees the same tree the old Subtree cache did).
 *  - the new IUIAutomationTreeWalker BuildCache slots (GetFirstChildElementBuildCache=10, GetNextSiblingElementBuildCache
 *    =12) do NOT segfault — a wrong slot would crash the process here, so a clean run is itself the slot proof.
 * The PowerShell process is killed + window closed in finally. SKIPS cleanly if PowerShell / WinForms is absent.
 *
 * bun test is broken repo-wide for FFI — runnable harness (spawns a real window):
 * Run: bun run example/dense-tree-budget.integration.test.ts
 */
import User32 from '@bun-win32/user32';
import { closeWindow, attach, renderSnapshot, uia, windowProcessId } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const BUTTON_COUNT = 2000; // non-virtualized siblings — every one is a real control in the tree (no virtualization to mask the cost)
const TITLE = `Dense Budget Probe ${process.pid}`;
// A WinForms form with BUTTON_COUNT Buttons all siblings under the form (depth 2) — the flat-tree hazard. ShowDialog
// blocks the PowerShell thread on the message loop, so the window stays alive until we kill the process.
const script =
  `Add-Type -AssemblyName System.Windows.Forms;` +
  `$f = New-Object System.Windows.Forms.Form;` +
  `$f.Text = '${TITLE}'; $f.Size = New-Object System.Drawing.Size(900,700); $f.SuspendLayout();` +
  `for ($i = 0; $i -lt ${BUTTON_COUNT}; $i++) { $b = New-Object System.Windows.Forms.Button; $b.Text = "Btn$i"; $b.Width = 60; $b.Height = 20; $b.Left = ($i % 14) * 62; $b.Top = [int]($i / 14) * 22; $f.Controls.Add($b) }` +
  `$f.ResumeLayout(); [void]$f.ShowDialog();`;

uia.initialize();
let powershellProcess: ReturnType<typeof Bun.spawn> | null = null;
let hWnd = 0n;
try {
  powershellProcess = Bun.spawn(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', script], { stdout: 'ignore', stderr: 'ignore' });
  const titleBuffer = Buffer.from(`${TITLE}\0`, 'utf16le');
  for (let i = 0; i < 80 && hWnd === 0n; i++) {
    await Bun.sleep(250);
    hWnd = User32.FindWindowW(null, titleBuffer.ptr!);
  }
  if (hWnd === 0n) {
    console.log('  skip(live): dense WinForms window did not appear (PowerShell / System.Windows.Forms absent)');
  } else {
    await Bun.sleep(800); // let all the controls realize into the UIA tree
    const window = attach(hWnd);
    try {
      // The FIX: a budgeted snapshot stays fast on the flat tree and truncates with an escape hatch.
      const budgetStart = Bun.nanoseconds();
      const budgeted = uia.snapshot(window, { maxNodes: 400 });
      const budgetMs = (Bun.nanoseconds() - budgetStart) / 1e6;
      const budgetRender = renderSnapshot(budgeted.tree);
      const budgetMarks = budgeted.marks.length;
      const truncated = budgeted.tree.truncated === true;
      const hasTrailer = budgetRender.includes('raise maxNodes');
      budgeted.dispose();

      console.log(`  [budgeted] maxNodes:400 → ${budgetMarks} marks in ${budgetMs.toFixed(0)} ms (truncated=${truncated}, trailer=${hasTrailer})`);
      assert(budgetMarks <= 401, `maxNodes:400 caps the marks at the budget (${budgetMarks} ≤ 401), not the full ${BUTTON_COUNT}`);
      assert(truncated, 'tree.truncated is set when the budget cut the walk short');
      assert(hasTrailer, 'the render carries a "raise maxNodes" truncation trailer');
      // Generous absolute ceiling: the unbounded flat walk is multiple SECONDS; a 400-node budget must be a fraction of it.
      assert(budgetMs < 2500, `budgeted snapshot ${budgetMs.toFixed(0)} ms < 2500 ms (the old unbounded path walled ~7s)`);

      // Correctness: an unbounded snapshot recovers EVERY button — the budget is the only behavioral change.
      const fullStart = Bun.nanoseconds();
      const full = uia.snapshot(window);
      const fullMs = (Bun.nanoseconds() - fullStart) / 1e6;
      const fullMarks = full.marks.length;
      const fullTruncated = full.tree.truncated === true;
      full.dispose();
      console.log(`  [unbounded] → ${fullMarks} marks in ${fullMs.toFixed(0)} ms (truncated=${fullTruncated})`);
      assert(fullMarks >= BUTTON_COUNT, `the unbounded walk recovers all ${BUTTON_COUNT} buttons (${fullMarks} marks)`);
      assert(!fullTruncated, 'an unbounded snapshot is NOT truncated');
    } finally {
      window.dispose();
    }
  }
} finally {
  const powershellPid = hWnd !== 0n ? windowProcessId(hWnd) : 0;
  if (hWnd !== 0n) closeWindow(hWnd);
  if (powershellPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(powershellPid)]);
  powershellProcess?.kill();
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — maxNodes budget bounds a dense flat tree, truncates with an escape hatch, and the full walk stays complete.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
