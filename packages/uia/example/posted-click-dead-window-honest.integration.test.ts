/**
 * posted-click-dead-window-honest — the cursor-free posted-click primitives (postClickToHwnd / postDoubleClickToHwnd /
 * postTripleClickToHwnd / postDragToHwnd) returned `true` UNCONDITIONALLY, ignoring PostMessageW's BOOL return. An
 * invalid / dead window (or a full message queue) makes PostMessageW return 0, yet the primitive still reported success
 * — so the MCP `click` tool emitted "posted ... click (cursor-free)" for a window the OS rejected, AND never fell
 * through to the real-cursor fallback. The wheel/key post path already checked the return (postWheel returns false on a
 * dead window); the click path now matches — it returns down !== 0 && up !== 0.
 *
 * Proof: an invalid hWnd must yield false from every click/drag primitive (the OS rejected the post), exactly as
 * postWheel already does. bun test is broken repo-wide, so this is a runnable harness.
 * Run: bun run example/posted-click-dead-window-honest.integration.test.ts
 */
import { postClickToHwnd, postDoubleClickToHwnd, postDragToHwnd, postTripleClickToHwnd } from '../coords';
import { postWheel } from '../input';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const dead = 0x00ff_ff00n; // a handle value that is not a live window (IsWindow === 0)

assert(postClickToHwnd(dead, 50, 50, 'left') === false, 'postClickToHwnd on a dead window returns false (PostMessageW rejected) — no fabricated cursor-free success');
assert(postDoubleClickToHwnd(dead, 50, 50) === false, 'postDoubleClickToHwnd on a dead window returns false');
assert(postTripleClickToHwnd(dead, 50, 50) === false, 'postTripleClickToHwnd on a dead window returns false');
assert(postDragToHwnd(dead, 10, 10, 40, 40) === false, 'postDragToHwnd on a dead window returns false');
assert(postWheel(dead, 50, 50, -1) === false, 'postWheel on a dead window already returned false — the click path now matches it');

console.log(failures === 0 ? '\nPASS — posted click/drag primitives report honest failure on a dead window (no fabricated cursor-free success).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
