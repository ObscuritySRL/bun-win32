/**
 * Hello UIA — type into Notepad, read it back, then close it cleanly (no stray "Save?" dialog).
 *
 * Launches Notepad, waits for its text area to appear in the accessibility tree, types a string by
 * driving the real keyboard, then reads the value back THROUGH the UIA tree. No native modules, no
 * Appium server, no .NET. (Requires an unlocked, interactive desktop — synthetic input is blocked on
 * a locked session.)
 *
 * APIs demonstrated:
 * - uia.attach / activate / waitFor / Element.focus / type / text (the Playwright-for-desktop core)
 * - windowProcessId + taskkill teardown: Win11 Notepad is a UWP app, so the spawned launcher is NOT
 *   the editor process, and a dirty buffer makes closeWindow() prompt — force-kill the owner by PID.
 *
 * Run: bun run example/hello-uia.ts
 */
import { ControlType, uia, windowProcessId } from '@bun-win32/uia';

const proc = Bun.spawn(['notepad.exe']);
let notepadPid = 0;
try {
  await Bun.sleep(2000);
  const app = uia.attach({ className: 'Notepad' }).activate();
  notepadPid = windowProcessId(app.hWnd);
  const edit = await app.waitFor({ controlType: ControlType.Document });
  edit.focus().type('nothing native compiles, and it just works');
  await Bun.sleep(300);
  console.log(edit.text()); // → nothing native compiles, and it just works
} finally {
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  proc.kill();
  uia.uninitialize();
}
