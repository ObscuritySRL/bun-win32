/**
 * window-events — HOOK Windows desktop events: a window appearing, gaining focus, being renamed or closed, and a
 * process spawning. SetWinEventHook (out-of-context) posts events to this thread; pumped on the main thread the
 * callback fires synchronously here — no foreign thread, no polling. Process creation has no WinEvent, so it is
 * polled via a toolhelp32 snapshot. The old "UIA/WinEvents are a foreign-thread FFI dead-end" note is REFUTED.
 *
 * Proof: start a watcher, launch Notepad, and assert the watcher caught appear → focus → close for it; that
 * waitForWindow resolves with the new window; that waitForProcess finds an already-running process; and that
 * listProcesses enumerates the process table. Closes every window it opens.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/window-events.integration.test.ts
 */
import { closeWindow, uia } from '@bun-win32/uia';

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
  // --- process table (toolhelp32) ---
  const processes = uia.listProcesses();
  assert(processes.length > 10 && processes.some((process) => /explorer\.exe/i.test(process.name)), `listProcesses enumerated ${processes.length} processes (incl. explorer.exe)`);
  const explorerPid = await uia.waitForProcess('explorer.exe', { timeout: 4000 });
  assert(explorerPid > 0, `waitForProcess('explorer.exe') resolved (pid ${explorerPid}, already running)`);

  // --- window lifecycle + focus hook ---
  const events: string[] = [];
  const watcher = uia.watchWindows((event) => {
    if (event.className === 'Notepad' || /Notepad/.test(event.title)) events.push(event.type);
  });

  let notepadHwnd = 0n;
  try {
    Bun.spawn(['cmd', '/c', 'start', 'notepad'], { stdout: 'ignore', stderr: 'ignore' });
    const appeared = await uia.waitForWindow({ className: 'Notepad' }, { timeout: 8000 });
    notepadHwnd = appeared.hWnd;
    assert(appeared.className === 'Notepad', `waitForWindow resolved on the new window ${JSON.stringify(appeared.title)}`);
    await Bun.sleep(1200);
    assert(events.includes('appear'), `watcher caught Notepad 'appear' (events: ${events.join(', ')})`);
    assert(events.includes('focus'), "watcher caught Notepad 'focus'");
  } finally {
    if (notepadHwnd !== 0n) closeWindow(notepadHwnd);
  }
  await Bun.sleep(1500);
  assert(events.includes('close'), `watcher caught Notepad 'close' (events: ${events.join(', ')})`);
  watcher.stop();
} finally {
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — hooked window appear/focus/close + process events on the main thread (no foreign-thread hazard).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
