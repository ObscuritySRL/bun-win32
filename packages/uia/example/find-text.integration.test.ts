/**
 * find-text — live proof of the desktop getByText: find a substring in a document and SELECT it cursor-free.
 *
 * Drives Notepad through the published Element.selectText()/getSelectedText() (the path the MCP find_text tool
 * uses): seed known text via setValue (cursor-free), find+select a word, read the selection back to confirm
 * the Select actually took, case-insensitive match, and a not-found miss. All without keyboard/mouse, so it
 * works on a background/locked session. A wrong TextRange slot would segfault.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/find-text.integration.test.ts
 */
import { closeWindow, ControlType, uia, windowProcessId } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
Bun.spawn(['notepad.exe'], { stdout: 'ignore', stderr: 'ignore' });
let npHwnd = 0n;
const npClass = Buffer.from('Notepad\0', 'utf16le');
for (let attempt = 0; attempt < 25 && npHwnd === 0n; attempt += 1) {
  Bun.sleepSync(300);
  npHwnd = User32.FindWindowW(npClass.ptr!, null);
}

try {
  const notepad = uia.attach(npHwnd);
  const edit = notepad.find({ controlType: ControlType.Document }) ?? notepad.find({ controlType: ControlType.Edit });
  assert(edit !== null, 'found the Notepad document');
  edit?.setValue('the quick brown fox jumps over the lazy dog'); // cursor-free seed
  await Bun.sleep(300);

  const matched = edit?.selectText('brown') ?? null;
  console.log(`  selectText('brown') → ${JSON.stringify(matched)}`);
  assert(matched === 'brown', 'selectText finds and returns the matched substring');
  assert(edit?.getSelectedText() === 'brown', 'getSelectedText confirms the match is the active selection (Select took effect)');

  const ci = edit?.selectText('BROWN', { ignoreCase: true }) ?? null;
  assert(ci?.toLowerCase() === 'brown', `case-insensitive match works (${JSON.stringify(ci)})`);

  const phrase = edit?.selectText('lazy dog') ?? null;
  assert(phrase === 'lazy dog' && edit?.getSelectedText() === 'lazy dog', 'a multi-word phrase selects too');

  assert(edit?.selectText('not-in-the-document') === null, 'a missing substring returns null (not a throw)');

  edit?.release();
  // Close the dirty Notepad without a leftover save prompt (it holds only test text).
  closeWindow(npHwnd);
  await Bun.sleep(700);
  try {
    const reattached = uia.attach(npHwnd);
    reattached.find({ name: /Don.?t save/i })?.invoke();
    reattached.dispose();
  } catch {
    // already gone
  }
  notepad.dispose();
} finally {
  const notepadPid = npHwnd !== 0n ? windowProcessId(npHwnd) : 0;
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — desktop getByText verified (find + cursor-free select + read-back).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
