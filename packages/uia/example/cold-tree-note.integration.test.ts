/**
 * cold-tree-note — desktop_snapshot appends a recovery note when a whole-window snapshot finds NO actionable
 * controls, so an agent that lands on a cold UWP/Chromium tree (or a tree-less surface) is told how to recover
 * (re-snapshot / activate / use pixels) instead of concluding "nothing here". Pure logic — no window spawned.
 *
 * Run: bun run example/cold-tree-note.integration.test.ts
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

const empty = coldTreeNote(0);
assert(empty.length > 0, 'a 0-control snapshot gets a recovery note');
assert(/desktop_snapshot/.test(empty), 'the note tells the agent to re-snapshot to build a cold tree');
assert(/ocr|screen_capture|inspect_point/.test(empty), 'the note offers the pixel path for a genuinely tree-less surface');
assert(coldTreeNote(1) === '', 'a snapshot with even 1 control gets NO note');
assert(coldTreeNote(42) === '', 'a populated snapshot gets NO note');

console.log(failures === 0 ? '\nPASS — cold-tree recovery note fires only on a 0-control snapshot.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
