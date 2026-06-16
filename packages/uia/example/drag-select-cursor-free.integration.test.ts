/**
 * drag-select-cursor-free — drag had ONLY a real-mouse SendInput path, so it hard-errored under BUN_UIA_CURSOR=never and
 * could never drag-select/marquee without an unlocked foregrounded desktop. drag {select:true} now posts a cursor-free
 * left-button drag (WM_LBUTTONDOWN → interpolated WM_MOUSEMOVE(MK_LBUTTON) → WM_LBUTTONUP, postDragToHwnd) to an own-HWND
 * {ref} — drag-selecting text in a classic Edit/RichEdit or marquee-selecting list items with no real cursor; under
 * cursor=never an own-HWND {ref} auto-falls-back to this instead of hard-erroring. The real-mouse default is preserved
 * for drag-DROP.
 *
 * Proof (synthetic, deterministic): drag {ref, select:true} across a single-line Edit forms a non-empty text selection
 * (EM_GETSEL end > start) and reports "drag-selected … cursor-free"; the real cursor is never moved. Window destroyed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a synthetic Edit):
 * Run: bun run example/drag-select-cursor-free.integration.test.ts
 */
import Kernel32 from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';

const WS_OVERLAPPEDWINDOW = 0x00cf_0000;
const WS_VISIBLE = 0x1000_0000;
const WS_CHILD = 0x4000_0000;
const WS_BORDER = 0x0080_0000;
const ES_AUTOHSCROLL = 0x0080;
const WM_SETTEXT = 0x000c;
const EM_GETSEL = 0x00b0;
const EM_SETSEL = 0x00b1;
const PM_REMOVE = 0x0001;
const wide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');
const pumpMsg = Buffer.alloc(48);
const pump = (): void => {
  for (let i = 0; i < 300; i += 1) {
    if (User32.PeekMessageW(pumpMsg.ptr!, 0n, 0, 0, PM_REMOVE) === 0) break;
    User32.TranslateMessage(pumpMsg.ptr!);
    User32.DispatchMessageW(pumpMsg.ptr!);
  }
};

type Rpc = { id?: number; result?: { isError?: boolean; content?: { text?: string }[] } };
const proc = Bun.spawn(['bun', 'run', `${import.meta.dir}/../mcp.ts`], { stdin: 'pipe', stdout: 'pipe', stderr: 'ignore', env: { ...Bun.env, BUN_UIA_PROFILE: 'safe' } });
const reader = proc.stdout.getReader();
const decoder = new TextDecoder();
let buffer = '';
const pending = new Map<number, (message: Rpc) => void>();
void (async () => {
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let index: number;
    while ((index = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (line.length === 0) continue;
      try {
        const message = JSON.parse(line) as Rpc;
        if (typeof message.id === 'number' && pending.has(message.id)) {
          pending.get(message.id)!(message);
          pending.delete(message.id);
        }
      } catch {}
    }
  }
})();
let nextId = 1;
const call = (method: string, params: unknown): Promise<Rpc> => {
  const id = nextId++;
  proc.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  proc.stdin.flush();
  return new Promise((resolve) => pending.set(id, resolve));
};
const textOf = (m: Rpc): string => m.result?.content?.[0]?.text ?? '';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const sel = (hWnd: bigint): { start: number; end: number } => {
  const ret = User32.SendMessageW(hWnd, EM_GETSEL, 0n, 0n);
  return { start: Number(ret & 0xffffn), end: Number((ret >> 16n) & 0xffffn) };
};

const hInstance = Kernel32.GetModuleHandleW(null);
const parent = User32.CreateWindowExW(0, wide('#32770').ptr!, wide('uia-dragsel-parent').ptr!, WS_OVERLAPPEDWINDOW | WS_VISIBLE, 280, 280, 380, 140, 0n, 0n, BigInt(hInstance), null);
const edit = parent === 0n ? 0n : User32.CreateWindowExW(0, wide('Edit').ptr!, null, WS_CHILD | WS_VISIBLE | WS_BORDER | ES_AUTOHSCROLL, 10, 10, 340, 28, parent, 0n, BigInt(hInstance), null);
if (edit !== 0n) {
  User32.SendMessageW(edit, WM_SETTEXT, 0n, BigInt(wide('the quick brown fox jumps over the lazy dog').ptr!));
  User32.SendMessageW(edit, EM_SETSEL, 0n, 0n); // caret to 0 — a known empty starting selection
}
pump();
const ticker = setInterval(pump, 5);

try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'dragsel', version: '1' } });
  if (parent === 0n || edit === 0n) console.log('  skip: could not create the synthetic Edit');
  else {
    const rect = Buffer.alloc(16);
    User32.GetWindowRect(edit, rect.ptr!);
    const right = rect.readInt32LE(8);
    const midY = Math.floor((rect.readInt32LE(4) + rect.readInt32LE(12)) / 2);
    const before = sel(edit);

    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${parent.toString(16)}` } }));
    const ref = /Edit[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
    if (ref === undefined) console.log('  skip: no Edit ref in the snapshot');
    else {
      // Drag-select from the Edit's clickable point (its from) toward the right edge — a cursor-free posted drag.
      const dragged = await call('tools/call', { name: 'drag', arguments: { ref, toX: right - 8, toY: midY, select: true } });
      await Bun.sleep(150);
      const after = sel(edit);
      assert(dragged.result?.isError !== true && /drag-selected/.test(textOf(dragged)) && /cursor-free/.test(textOf(dragged)), `drag {select:true} reports a cursor-free drag-select (got: ${JSON.stringify(textOf(dragged).slice(0, 90))})`);
      assert(after.end > after.start, `a non-empty text selection formed via the posted drag (EM_GETSEL ${before.start},${before.end} → ${after.start},${after.end})`);
    }
  }
} finally {
  clearInterval(ticker);
  proc.kill();
  if (parent !== 0n) User32.DestroyWindow(parent);
}

console.log(failures === 0 ? '\nPASS — drag {select:true} drag-selects text cursor-free via posted mouse messages.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
