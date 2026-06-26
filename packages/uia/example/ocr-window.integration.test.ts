/**
 * ocr-window — OCR A WINDOW'S LIVE PIXELS VIA WGC (the capability the docs sell, end-to-end). ocrWindow()
 * captures a window's composed surface with Windows.Graphics.Capture (even occluded / background / GPU) and
 * runs OCR over it, so an agent can read text off a window that exposes NO accessibility tree — a game, a
 * <canvas>/WebGL app, an embedded document — and postClick the recognized words by their SCREEN-pixel boxes.
 *
 * The sibling ocr-text test proves ocrBitmap on a GDI buffer; this one proves the WGC→Bitmap→ocrBitmap
 * handoff INSIDE ocrWindow that ocrBitmap alone never exercises (a regression in captureWindowLive's surface
 * decode would otherwise pass every test).
 *
 * Proof (deterministic, no private content): create an in-process throwaway window, paint a known phrase into
 * it with GDI, capture it via WGC + OCR with ocrWindow(hWnd), and assert the same tokens come back. The window
 * is OUR OWN process — DestroyWindow + UnregisterClass in finally is the full teardown (no app launched, no
 * foreground steal). Skips cleanly when no OCR language pack or WGC is unavailable (locked/headless session).
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/ocr-window.integration.test.ts
 */
import { JSCallback } from 'bun:ffi';

import Gdi32 from '@bun-win32/gdi32';
import { ocrAvailable, ocrWindow, uia, wgcAvailable } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';
import { ShowWindowCommand, WindowStyles } from '@bun-win32/user32';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const WIDTH = 900;
const HEIGHT = 160;
const PHRASE = 'The quick brown fox 2026';

const WHITE_BRUSH = 0;
const CS_HREDRAW = 0x0002;
const CS_VREDRAW = 0x0001;
const PM_REMOVE = 0x0001;
const SWP_NOACTIVATE = 0x0010;
const SWP_NOZORDER = 0x0004;
const ETO_OPAQUE = 0x0002;

const encodeWide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');

/** Paint PHRASE in large black text on white onto a window's DC (idempotent — called each pump so a late DWM frame carries it). */
function paintPhrase(hWnd: bigint): void {
  const dc = User32.GetDC(hWnd);
  const faceName = encodeWide('Segoe UI');
  const font = Gdi32.CreateFontW(-72, 0, 0, 0, 700, 0, 0, 0, 1, 0, 0, 4, 0, faceName.ptr!);
  const previousFont = Gdi32.SelectObject(dc, font);
  Gdi32.SetBkColor(dc, 0x00ff_ffff); // white background
  Gdi32.SetTextColor(dc, 0x0000_0000); // black text
  const rect = Buffer.alloc(16);
  rect.writeInt32LE(0, 0);
  rect.writeInt32LE(0, 4);
  rect.writeInt32LE(WIDTH, 8);
  rect.writeInt32LE(HEIGHT, 12);
  const text = encodeWide(PHRASE);
  Gdi32.ExtTextOutW(dc, 20, 40, ETO_OPAQUE, rect.ptr!, text.ptr!, PHRASE.length, null);
  Gdi32.GdiFlush();
  Gdi32.SelectObject(dc, previousFont);
  Gdi32.DeleteObject(font);
  User32.ReleaseDC(hWnd, dc);
}

uia.initialize();
let hWnd = 0n;
let className: Buffer | null = null;
let wndProc: JSCallback | null = null;
try {
  if (!ocrAvailable()) {
    console.log('  (no OCR language pack installed — skipping; install one via Settings → Language)');
    console.log('\nSKIPPED — Windows.Media.Ocr has no language pack on this machine.');
    process.exit(0);
  }
  if (!wgcAvailable()) {
    console.log('  (WGC unavailable — locked/headless session; skipping the ocrWindow capture)');
    console.log('\nSKIPPED — Windows.Graphics.Capture is not usable on this machine.');
    process.exit(0);
  }

  // DefWindowProcW as the WNDPROC (a native pointer, pumped on OUR thread — no foreign-thread callback).
  wndProc = new JSCallback((handle: bigint, msg: number, wParam: bigint, lParam: bigint): bigint => BigInt(User32.DefWindowProcW(handle, msg, wParam, lParam)), { args: ['u64', 'u32', 'u64', 'i64'], returns: 'i64' });

  className = encodeWide(`BunUiaOcrWindow_${process.pid}`);
  const wndClass = Buffer.alloc(80); // WNDCLASSEXW (x64)
  wndClass.writeUInt32LE(80, 0); // cbSize
  wndClass.writeUInt32LE(CS_HREDRAW | CS_VREDRAW, 4); // style
  wndClass.writeBigUInt64LE(BigInt(wndProc.ptr!), 8); // lpfnWndProc
  wndClass.writeBigUInt64LE(BigInt(Gdi32.GetStockObject(WHITE_BRUSH)), 48); // hbrBackground (white)
  wndClass.writeBigUInt64LE(BigInt(className.ptr!), 64); // lpszClassName
  if (!User32.RegisterClassExW(wndClass.ptr!)) throw new Error('RegisterClassExW failed');

  // A small WS_POPUP in the top-left corner, shown WITHOUT activation (no foreground steal / flash). Empty
  // caption so a window title can't bleed into the OCR text — only the painted phrase is on the surface.
  hWnd = User32.CreateWindowExW(0, className.ptr!, encodeWide('').ptr!, WindowStyles.WS_POPUP | WindowStyles.WS_VISIBLE, 0, 0, WIDTH, HEIGHT, 0n, 0n, 0n, null);
  if (hWnd === 0n) throw new Error('CreateWindowExW failed (no interactive desktop?)');
  User32.ShowWindow(hWnd, ShowWindowCommand.SW_SHOWNOACTIVATE);
  User32.SetWindowPos(hWnd, 0n, 0, 0, 0, 0, SWP_NOACTIVATE | SWP_NOZORDER | 0x0001 /* SWP_NOSIZE */ | 0x0002 /* SWP_NOMOVE */);
  User32.UpdateWindow(hWnd);

  // Pump a few frames so DWM composes the window, repainting the phrase each time so a late composed frame carries it.
  const msgBuffer = Buffer.alloc(48);
  for (let frame = 0; frame < 12; frame += 1) {
    paintPhrase(hWnd);
    while (User32.PeekMessageW(msgBuffer.ptr!, 0n, 0, 0, PM_REMOVE) !== 0) {
      User32.TranslateMessage(msgBuffer.ptr!);
      User32.DispatchMessageW(msgBuffer.ptr!);
    }
    Bun.sleepSync(30);
  }

  const result = await ocrWindow(hWnd, { timeoutMs: 10000 });
  assert(result !== null, 'ocrWindow captured the window via WGC and ran OCR (non-null result)');
  if (result !== null) {
    const recognized = result.text.toUpperCase().replace(/\s+/g, ' ').trim();
    console.log(`  ocrWindow read: ${JSON.stringify(result.text)}`);
    // OCR over a DWM-composited surface antialiases edges, so a stray single-char slip on one word is fidelity
    // noise, not a capture regression. The signal that proves the handoff is real text from the painted pixels:
    // two ADJACENT phrase words come back clean ("BROWN FOX"). A broken captureWindowLive → ocrBitmap yields a
    // null result (caught above) or a blank/garbage frame (no phrase words at all), so this fails hard on regress.
    const tokens = ['QUICK', 'BROWN', 'FOX', '2026'];
    const matched = tokens.filter((token) => recognized.includes(token));
    assert(
      recognized.includes('BROWN FOX'),
      `recognized adjacent phrase words "BROWN FOX" through WGC (${matched.length}/${tokens.length} tokens overall: ${matched.join(', ')}) — proves captureWindowLive → ocrBitmap carried the painted pixels`,
    );
    const words = result.lines.flatMap((line) => line.words);
    assert(words.length > 0 && words.every((word) => word.bounds.width > 0 && word.bounds.height > 0), `every word has a non-empty SCREEN-pixel bounding box (${words.length} words) — postClickable`);
  }
} finally {
  if (hWnd !== 0n) User32.DestroyWindow(hWnd);
  if (className !== null) User32.UnregisterClassW(className.ptr!, 0n);
  wndProc?.close();
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — OCR read a window’s live pixels via WGC (ocrWindow → captureWindowLive → ocrBitmap).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
