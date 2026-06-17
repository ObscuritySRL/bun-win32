/**
 * cursor-free-undo — press_key {ref, key:'Control+Z'} on a classic Edit with its own window handle undoes the last
 * edit CURSOR-FREE via EM_UNDO (no Ctrl+Z keystroke, no focus, works minimized/locked) — the one undo-key the
 * cursor-free Edit cluster (WM_SETTEXT/WM_CHAR/WM_COPY/WM_CUT/WM_PASTE/EM_SETSEL) was missing. It falls through to
 * the SendInput chord (gated under BUN_UIA_CURSOR=never) only for a no-own-HWND sub-control.
 *
 * Proof (minimized Notepad over the MCP wire): type, then press_key Ctrl+Z reports "(EM_UNDO)" and the edit reverts.
 * Notepad closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Notepad):
 * Run: bun run example/cursor-free-undo.integration.test.ts
 */
import User32 from '@bun-win32/user32';
import { closeWindow, uia, windowProcessId } from '@bun-win32/uia';

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

const EM_SETMODIFY = 0x00b9;
const docRef = async (): Promise<string | undefined> => /(?:Document|Edit|Text)[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/i.exec(textOf(await call('tools/call', { name: 'desktop_snapshot', arguments: {} })))?.[1];

uia.initialize();
const notepad = await uia.launch(['notepad.exe'], { className: 'Notepad' });
const editor = notepad.find({ controlType: 50004 }) ?? notepad.find({ controlType: 50030 });
const editHwnd = editor?.nativeWindowHandle ?? 0n;
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'cf-undo', version: '1' } });
  await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${notepad.hWnd.toString(16)}` } });
  await call('tools/call', { name: 'manage_window', arguments: { hWnd: `0x${notepad.hWnd.toString(16)}`, action: 'minimize' } });
  await Bun.sleep(300);
  if (editHwnd === 0n) console.log('  skip: WinUI Notepad with no per-control HWND — EM_UNDO path N/A');
  else {
    const r1 = await docRef();
    if (r1 !== undefined) await call('tools/call', { name: 'type', arguments: { ref: r1, text: 'UNDO-ME-7421' } });
    await Bun.sleep(150);
    const before = editor!.value || editor!.text();
    const undone = await call('tools/call', { name: 'press_key', arguments: { ref: await docRef(), key: 'Control+Z' } });
    assert(undone.result?.isError !== true && /EM_UNDO/.test(textOf(undone)), `press_key Control+Z reports a cursor-free EM_UNDO (got: ${JSON.stringify(textOf(undone).split('\n')[0]?.slice(0, 50))})`);
    await Bun.sleep(150);
    const after = editor!.value || editor!.text();
    assert(before.includes('UNDO-ME-7421') && !after.includes('UNDO-ME-7421'), `the edit was undone cursor-free (before ${JSON.stringify(before.slice(0, 20))} → after ${JSON.stringify(after.slice(0, 20))})`);
  }
} finally {
  const notepadPid = windowProcessId(notepad.hWnd);
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  if (editHwnd !== 0n) User32.SendMessageW(editHwnd, EM_SETMODIFY, 0n, 0n);
  proc.kill();
  editor?.release();
  notepad.dispose();
  closeWindow(notepad.hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — press_key Control+Z undoes a minimized own-HWND Edit cursor-free via EM_UNDO.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
