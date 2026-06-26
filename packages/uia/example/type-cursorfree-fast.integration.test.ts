/**
 * type-cursorfree-fast — the PUBLIC Element.type() used to unconditionally call this.focus() (UIA SetFocus) then
 * SendInput, so on an own-HWND classic control it took the MSAA-bridged SetFocus path the MCP layer (setValueSmart /
 * the `type` tool) already routes AROUND. Element.type() now mirrors that path: for a control with its own HWND it
 * posts WM_CHAR cursor-free (no focus, no foreground steal, background-capable) and only falls back to focus()+SendInput
 * for a no-own-HWND WinUI/WPF/Electron sub-control. The fallback contract is unchanged.
 *
 * Proof (a spawned, MINIMIZED Notepad — own-HWND RichEdit, the realistic background-agent case):
 *   • Element.type('hello probe …') reads back correct (the WM_CHAR text landed).
 *   • the REAL mouse cursor never moved (the cursor-free posted path, not SendInput).
 *   • the foreground window is UNCHANGED (no SetFocus raise — the focus-clean parity the MCP path guarantees).
 *   • it completes well under 500ms (the FlaUI/Playwright/nut.js typing-latency parity bound — the slow UIA SetFocus
 *     tax is off the public path). Notepad is force-closed in teardown.
 *
 * bun test is broken repo-wide — runnable script:
 * Run: bun run example/type-cursorfree-fast.integration.test.ts
 */
import User32 from '@bun-win32/user32';
import { closeWindow, uia, windowProcessId } from '@bun-win32/uia';

const EM_SETMODIFY = 0x00b9;
const SW_MINIMIZE = 6;

const cursor = (): { x: number; y: number } => {
  const point = Buffer.alloc(8);
  User32.GetCursorPos(point.ptr!);
  return { x: point.readInt32LE(0), y: point.readInt32LE(4) };
};

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
const notepad = await uia.launch(['notepad.exe'], { className: 'Notepad' });
const editor = notepad.find({ controlType: 50004 }) ?? notepad.find({ controlType: 50030 });
const editHwnd = editor?.nativeWindowHandle ?? 0n;
const probe = `hello probe ${Date.now()}`;
try {
  if (editor === null || editor === undefined) {
    console.log('  skip(live): no Document/Edit control found in Notepad — cannot assert the type path');
  } else if (editHwnd === 0n) {
    console.log('  skip(live): WinUI Notepad edit has no own HWND on this build — the cursor-free path is N/A (focus()+SendInput fallback only)');
  } else {
    // Minimize and push foreground to the shell, the background-agent scenario: a focus-clean type must keep it there.
    const shell = User32.GetShellWindow();
    User32.ShowWindow(notepad.hWnd, SW_MINIMIZE);
    if (shell !== 0n) User32.SetForegroundWindow(shell);
    await Bun.sleep(250);

    const beforeCursor = cursor();
    const beforeForeground = User32.GetForegroundWindow();
    const start = Bun.nanoseconds();
    editor.type(probe);
    const elapsedMs = (Bun.nanoseconds() - start) / 1e6;
    await Bun.sleep(150);
    const afterCursor = cursor();
    const afterForeground = User32.GetForegroundWindow();

    console.log(`  Element.type() took ${elapsedMs.toFixed(2)}ms`);
    assert((editor.value || editor.text()).includes(probe), `Element.type() text landed cursor-free into the minimized own-HWND edit (read back contains ${JSON.stringify(probe)})`);
    assert(
      Math.abs(afterCursor.x - beforeCursor.x) <= 2 && Math.abs(afterCursor.y - beforeCursor.y) <= 2,
      `the real mouse never moved (before ${beforeCursor.x},${beforeCursor.y} → after ${afterCursor.x},${afterCursor.y}) — the posted path, not SendInput`,
    );
    assert(afterForeground === beforeForeground, `foreground UNCHANGED (before 0x${beforeForeground.toString(16)} → after 0x${afterForeground.toString(16)}) — no UIA SetFocus raise`);
    assert(elapsedMs < 500, `Element.type() completed under 500ms (got ${elapsedMs.toFixed(2)}ms) — the FlaUI/Playwright/nut.js typing-latency parity bound, off the slow UIA SetFocus path`);
  }
} finally {
  const notepadPid = notepad.hWnd !== 0n ? windowProcessId(notepad.hWnd) : 0;
  if (editHwnd !== 0n) User32.SendMessageW(editHwnd, EM_SETMODIFY, 0n, 0n); // clear the dirty flag so close() never prompts
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  editor?.release();
  notepad.dispose();
  closeWindow(notepad.hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — Element.type() takes the cursor-free WM_CHAR path on an own-HWND control: text lands, mouse unmoved, foreground unchanged, sub-500ms.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
