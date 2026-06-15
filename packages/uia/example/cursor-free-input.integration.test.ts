/**
 * cursor-free-input — prove the AHK ControlSetText / ControlSend parity: drive a control's text and keys with NO
 * focus, NO foreground, NO real cursor, on a MINIMIZED window. `setControlText` (WM_SETTEXT) and `postText`
 * (WM_CHAR) and `postKey` (WM_KEYDOWN/UP) route to a control's `nativeWindowHandle` — the path SendInput can't take
 * (it goes to whatever owns the system focus). This is the headline no-focus input gap the MCP `press_key` (ref +
 * single key) and `set_value` (WM_SETTEXT fallback) now wire.
 *
 * Proof: spawn Notepad, MINIMIZE it (so it is provably not foreground), then set + append text cursor-free and read
 * it back through UIA. Skips cleanly if the editor has no per-control HWND (modern WinUI Notepad — the ValuePattern
 * path covers that case). Teardown clears the edit's modify flag so WM_CLOSE never raises a Save prompt, then closes.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/cursor-free-input.integration.test.ts
 */
import User32 from '@bun-win32/user32';
import { ControlType, closeWindow, foregroundWindow, minimizeWindow, postKey, postText, setControlText, uia } from '@bun-win32/uia';

const EM_SETMODIFY = 0x00b9;

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
const window = await uia.launch(['notepad.exe'], { className: 'Notepad' });
const editor = window.find({ controlType: ControlType.Edit }) ?? window.find({ controlType: ControlType.Document });
const editHwnd = editor?.nativeWindowHandle ?? 0n;
try {
  if (editor === null || editHwnd === 0n) {
    console.log(`  skip: Notepad editor has no per-control HWND (nativeWindowHandle=0x${editHwnd.toString(16)}) — modern WinUI build; the WM_SETTEXT path does not apply (ValuePattern covers it).`);
  } else {
    minimizeWindow(window.hWnd);
    await Bun.sleep(200);
    assert(foregroundWindow() !== window.hWnd, 'Notepad is minimized — provably NOT the foreground window');

    const setText = 'cursor-free-set-7421';
    assert(setControlText(editHwnd, setText), 'setControlText (WM_SETTEXT) reported success on a minimized window');
    await Bun.sleep(150);
    const afterSet = editor.value || editor.text();
    assert(afterSet.includes(setText), `editor reads back the WM_SETTEXT value cursor-free ("${afterSet.slice(0, 40)}")`);

    assert(postText(editHwnd, 'APND'), 'postText (WM_CHAR) reported success on a minimized window');
    await Bun.sleep(150);
    const afterAppend = editor.value || editor.text();
    assert(afterAppend.includes('APND'), `editor reads back the WM_CHAR-typed text cursor-free ("${afterAppend.slice(0, 40)}")`);

    assert(postKey(editHwnd, 'End'), 'postKey (WM_KEYDOWN/UP) posts a navigation key to the control cursor-free');
  }
} finally {
  if (editHwnd !== 0n) User32.SendMessageW(editHwnd, EM_SETMODIFY, 0n, 0n); // clear dirty so WM_CLOSE raises no Save prompt
  editor?.release();
  window.dispose();
  closeWindow(window.hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — text + keys drive a minimized window cursor-free (AHK ControlSetText/ControlSend parity).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
