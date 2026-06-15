/**
 * posted-clicks — cursor-free posted DOUBLE-click and MIDDLE-click (the postClickAt left/right asymmetry, rank-7).
 *
 * clickElement / computer-use double_click + middle_click now have a cursor-free posted path (built on the owner-
 * targeted postClickToHwnd) before the real-cursor last resort. A posted double-click delivers TWO logical clicks
 * (down/up/DBLCLK/up); middle-click posts WM_MBUTTON*.
 *
 * Proof (synthetic, deterministic): a 3-STATE auto checkbox advances its state once per click — a single posted
 * click → 1 (checked), a posted double-click → 2 (indeterminate). Middle-click posts without error. In-process pump.
 *
 * bun test is broken repo-wide — runnable harness (destroys its own synthetic window):
 * Run: bun run example/posted-clicks.integration.test.ts
 */
import User32 from '@bun-win32/user32';
import { postClickToHwnd, postDoubleClickToHwnd, uia } from '@bun-win32/uia';

const WS_POPUP = 0x8000_0000;
const WS_VISIBLE = 0x1000_0000;
const WS_CHILD = 0x4000_0000;
const BS_AUTO3STATE = 0x0006;
const BM_GETCHECK = 0x00f0;
const BM_SETCHECK = 0x00f1;

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const msg = Buffer.alloc(48);
function pump(): void {
  for (let i = 0; i < 256; i += 1) {
    if (User32.PeekMessageW(msg.ptr!, 0n, 0, 0, 0x0001) === 0) break;
    User32.TranslateMessage(msg.ptr!);
    User32.DispatchMessageW(msg.ptr!);
  }
}
const state = (hWnd: bigint): bigint => User32.SendMessageW(hWnd, BM_GETCHECK, 0n, 0n);
const reset = (hWnd: bigint): void => {
  User32.SendMessageW(hWnd, BM_SETCHECK, 0n, 0n);
  pump();
};

uia.initialize();
const staticClass = Buffer.from('Static\0', 'utf16le');
const buttonClass = Buffer.from('BUTTON\0', 'utf16le');
const parent = User32.CreateWindowExW(0, staticClass.ptr!, null, WS_POPUP | WS_VISIBLE, 140, 140, 240, 80, 0n, 0n, 0n, null);
const checkbox = User32.CreateWindowExW(0, buttonClass.ptr!, Buffer.from('Tri\0', 'utf16le').ptr!, WS_CHILD | WS_VISIBLE | BS_AUTO3STATE, 15, 20, 200, 32, parent, 0n, 0n, null);
try {
  await Bun.sleep(80);
  const rect = Buffer.alloc(16);
  User32.GetWindowRect(checkbox, rect.ptr!);
  const cx = Math.floor((rect.readInt32LE(0) + rect.readInt32LE(8)) / 2);
  const cy = Math.floor((rect.readInt32LE(4) + rect.readInt32LE(12)) / 2);

  reset(checkbox);
  postClickToHwnd(checkbox, cx, cy, 'left');
  pump();
  assert(state(checkbox) === 1n, 'a single posted click advances the 3-state checkbox by one (→ checked)');

  reset(checkbox);
  postDoubleClickToHwnd(checkbox, cx, cy);
  pump();
  assert(state(checkbox) === 2n, 'a posted double-click advances it by TWO (→ indeterminate) — two logical clicks delivered');

  assert(postClickToHwnd(checkbox, cx, cy, 'middle'), 'a posted middle-click is delivered to the control (WM_MBUTTON*)');
  pump();
} finally {
  User32.DestroyWindow(checkbox);
  User32.DestroyWindow(parent);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — posted double-click and middle-click drive a control cursor-free.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
