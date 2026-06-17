/**
 * cursor-free-wheel — scroll a classic control that has NO UIA ScrollPattern, cursor-free, via a posted
 * WM_MOUSEWHEEL to its own window handle (no real wheel, no focus) — the path the MCP scroll tool now takes before
 * the SendInput-wheel fallback, replacing the old "no scrollable container" dead-end. Works on a MINIMIZED window.
 *
 * Proof: fill a minimized Notepad with 200 lines, postWheel(editHwnd, …, -notches), and confirm the first visible
 * line advanced (EM_GETFIRSTVISIBLELINE) — the control scrolled with no focus / no real cursor. Skips on a WinUI
 * Notepad with no per-control HWND. Teardown clears the modify flag, then closes.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/cursor-free-wheel.integration.test.ts
 */
import User32 from '@bun-win32/user32';
import { ControlType, closeWindow, minimizeWindow, postWheel, setControlText, uia, windowProcessId } from '@bun-win32/uia';

const EM_GETFIRSTVISIBLELINE = 0x00ce;
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
    console.log(`  skip: Notepad editor has no per-control HWND (0x${editHwnd.toString(16)}) — modern WinUI build; posted WM_MOUSEWHEEL path N/A`);
  } else {
    setControlText(editHwnd, Array.from({ length: 200 }, (_, index) => `line ${index}`).join('\r\n'));
    minimizeWindow(window.hWnd);
    await Bun.sleep(250);
    const before = Number(User32.SendMessageW(editHwnd, EM_GETFIRSTVISIBLELINE, 0n, 0n));
    assert(postWheel(editHwnd, 400, 400, -10), 'postWheel (WM_MOUSEWHEEL) reported success on a minimized window');
    await Bun.sleep(250);
    const after = Number(User32.SendMessageW(editHwnd, EM_GETFIRSTVISIBLELINE, 0n, 0n));
    assert(after > before, `the control scrolled DOWN cursor-free (first visible line ${before} → ${after}, no focus / no real wheel)`);

    const back = postWheel(editHwnd, 400, 400, 10); // scroll back up
    await Bun.sleep(200);
    const up = Number(User32.SendMessageW(editHwnd, EM_GETFIRSTVISIBLELINE, 0n, 0n));
    assert(back && up < after, `and back UP cursor-free (first visible line ${after} → ${up})`);
  }
} finally {
  const notepadPid = windowProcessId(window.hWnd);
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  if (editHwnd !== 0n) User32.SendMessageW(editHwnd, EM_SETMODIFY, 0n, 0n);
  editor?.release();
  window.dispose();
  closeWindow(window.hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — a posted WM_MOUSEWHEEL scrolls a classic control cursor-free on a minimized window.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
