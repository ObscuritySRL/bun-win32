/**
 * cursor-free-input — prove cursor-free text/key input: drive a control's text and keys with NO
 * focus, NO foreground, NO real cursor, on a MINIMIZED window. `setControlText` (WM_SETTEXT), `postText` (WM_CHAR),
 * `postKey` (WM_KEYDOWN/UP), and `pasteToControl` (WM_PASTE) route to a control's `nativeWindowHandle` — the path
 * SendInput can't take (it goes to whatever owns the system focus). This is the headline no-focus input gap the MCP
 * `press_key` (ref + single key), `type` (WM_CHAR for an own-HWND control), `set_value` (WM_SETTEXT fallback), and
 * `paste` (WM_PASTE for an own-HWND control) now wire.
 *
 * Proof: spawn Notepad, MINIMIZE it (so it is provably not foreground), then set + append text cursor-free and read
 * it back through UIA. Skips cleanly if the editor has no per-control HWND (modern WinUI Notepad — the ValuePattern
 * path covers that case). Teardown clears the edit's modify flag so WM_CLOSE never raises a Save prompt, then closes.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/cursor-free-input.integration.test.ts
 */
import User32 from '@bun-win32/user32';
import { ControlType, closeWindow, foregroundWindow, minimizeWindow, pasteToControl, postKey, postText, setControlText, uia, windowProcessId, writeClipboard } from '@bun-win32/uia';

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

    // Astral (non-BMP) text must post as surrogate-pair WM_CHARs, not be truncated to one out-of-range code point.
    setControlText(editHwnd, '');
    await Bun.sleep(80);
    const astral = '𝐀𝐁'; // U+1D400 U+1D401 — each a UTF-16 surrogate pair
    assert(postText(editHwnd, astral), 'postText reported success for astral (non-BMP) text');
    await Bun.sleep(150);
    const afterAstral = editor.value || editor.text();
    assert(afterAstral.includes(astral), `editor reads back astral text intact, not truncated ("${afterAstral.slice(0, 20)}")`);

    // Cursor-free PASTE (the MCP `paste {ref}` tool's cursor-free path): set the clipboard, then WM_PASTE into the
    // minimized control — no focus, no Ctrl+V keystroke.
    setControlText(editHwnd, '');
    await Bun.sleep(80);
    writeClipboard('cursor-free-paste-7421');
    assert(pasteToControl(editHwnd), 'pasteToControl (WM_PASTE) reported success on a minimized window');
    await Bun.sleep(150);
    const afterPaste = editor.value || editor.text();
    assert(afterPaste.includes('cursor-free-paste-7421'), `editor reads back the WM_PASTE clipboard text cursor-free ("${afterPaste.slice(0, 40)}")`);
  }
} finally {
  const notepadPid = window.hWnd !== 0n ? windowProcessId(window.hWnd) : 0;
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  if (editHwnd !== 0n) User32.SendMessageW(editHwnd, EM_SETMODIFY, 0n, 0n); // clear dirty so WM_CLOSE raises no Save prompt
  editor?.release();
  window.dispose();
  closeWindow(window.hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — text + keys drive a minimized window cursor-free (posted window messages).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
