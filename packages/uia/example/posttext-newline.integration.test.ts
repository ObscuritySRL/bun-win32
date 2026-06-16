/**
 * posttext-newline — postText (the cursor-free WM_CHAR path behind the MCP `type` tool) posts one UTF-16 unit per
 * char, but an Edit/RichEdit inserts a line break on WM_CHAR 0x0D (CR), NOT 0x0A (LF) — a posted LF is swallowed, so a
 * multi-line string collapsed to one line. postText now maps a lone LF to CR and folds a CRLF pair into one break.
 *
 * Proof (no app spawned, no flooding): post a multi-line string into a synthetic classic multi-line Edit, pump its
 * messages, and read it back — the line breaks survive (3 lines), and a `\r\n` posts as ONE break (2 lines). Both
 * windows destroyed in teardown.
 *
 * bun test is broken repo-wide — runnable script:
 * Run: bun run example/posttext-newline.integration.test.ts
 */
import Kernel32 from '@bun-win32/kernel32';
import { postText } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';

const WS_OVERLAPPEDWINDOW = 0x00cf_0000;
const WS_VISIBLE = 0x1000_0000;
const WS_CHILD = 0x4000_0000;
const WS_BORDER = 0x0080_0000;
const ES_MULTILINE = 0x0004;
const PM_REMOVE = 0x0001;
const wide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const hInstance = Kernel32.GetModuleHandleW(null);
const parent = User32.CreateWindowExW(0, wide('#32770').ptr!, wide('uia-posttext-parent').ptr!, WS_OVERLAPPEDWINDOW | WS_VISIBLE, 100, 100, 400, 300, 0n, 0n, BigInt(hInstance), null);
const edit = parent === 0n ? 0n : User32.CreateWindowExW(0, wide('Edit').ptr!, null, WS_CHILD | WS_VISIBLE | WS_BORDER | ES_MULTILINE, 10, 10, 360, 240, parent, 0n, BigInt(hInstance), null);

/** Drain this thread's posted messages so the Edit's wndproc processes the WM_CHARs postText posted to it. */
function pump(): void {
  const msg = Buffer.alloc(48); // x64 MSG
  for (let i = 0; i < 5000; i += 1) {
    if (User32.PeekMessageW(msg.ptr!, 0n, 0, 0, PM_REMOVE) === 0) break;
    User32.TranslateMessage(msg.ptr!);
    User32.DispatchMessageW(msg.ptr!);
  }
}
function readEdit(): string {
  const length = User32.GetWindowTextLengthW(edit);
  const buffer = Buffer.alloc((length + 1) * 2);
  User32.GetWindowTextW(edit, buffer.ptr!, length + 1);
  return buffer.toString('utf16le').replace(/\0+$/, '');
}

try {
  if (parent === 0n || edit === 0n) console.log('  skip: could not create the test Edit');
  else {
    postText(edit, 'alpha\nbravo\ncharlie');
    pump();
    const lf = readEdit();
    assert(lf === 'alpha\r\nbravo\r\ncharlie', `a lone LF inserts a real line break — 3 lines preserved (got ${JSON.stringify(lf)})`);

    User32.SetWindowTextW(edit, wide('').ptr!);
    pump();
    postText(edit, 'one\r\ntwo');
    pump();
    const crlf = readEdit();
    assert(crlf === 'one\r\ntwo', `a CRLF pair posts as ONE break, not two (got ${JSON.stringify(crlf)})`);
  }
} finally {
  if (edit !== 0n) User32.DestroyWindow(edit);
  if (parent !== 0n) User32.DestroyWindow(parent);
}

console.log(failures === 0 ? '\nPASS — postText preserves multi-line text (LF→CR; CRLF folds to one break).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
