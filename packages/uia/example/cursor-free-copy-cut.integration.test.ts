/**
 * cursor-free-copy-cut — the MCP copy and cut tools must work CURSOR-FREE on a classic Edit with its own window
 * handle: copy {ref} with no TextPattern selection select-alls + WM_COPYs the control; cut {ref} select-alls +
 * WM_CUTs it — both with no focus, on a MINIMIZED window (WM_COPY/WM_CUT/EM_SETSEL, not SendInput Ctrl+C/X).
 *
 * Proof: spawn Notepad, MINIMIZE it, type text cursor-free over the MCP wire, then copy {ref} returns that text and
 * cut {ref} returns it AND empties the control — all without focusing it. Skips on a WinUI Notepad with no
 * per-control HWND. Teardown clears the modify flag, then closes.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Notepad):
 * Run: bun run example/cursor-free-copy-cut.integration.test.ts
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
const editRef = async (): Promise<string | undefined> => {
  const snap = textOf(await call('tools/call', { name: 'desktop_snapshot', arguments: {} }));
  return /(?:Document|Edit|Text)[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/i.exec(snap)?.[1];
};

uia.initialize();
const notepad = await uia.launch(['notepad.exe'], { className: 'Notepad' });
const editor = notepad.find({ controlType: 50004 /* Edit */ }) ?? notepad.find({ controlType: 50030 /* Document */ });
const editHwnd = editor?.nativeWindowHandle ?? 0n;
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'cf-copy-cut', version: '1' } });
  await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${notepad.hWnd.toString(16)}` } });
  if (editHwnd === 0n) console.log('  skip: WinUI Notepad with no per-control HWND — WM_COPY/WM_CUT path N/A');
  else {
    await call('tools/call', { name: 'manage_window', arguments: { hWnd: `0x${notepad.hWnd.toString(16)}`, action: 'minimize' } });
    await Bun.sleep(300);
    const r1 = await editRef();
    if (r1 !== undefined) await call('tools/call', { name: 'type', arguments: { ref: r1, text: 'CLIP-7421' } });
    await Bun.sleep(150);

    const copied = await call('tools/call', { name: 'copy', arguments: { ref: await editRef() } });
    assert(copied.result?.isError !== true && /CLIP-7421/.test(textOf(copied)), `MCP copy returns the Edit's text cursor-free via WM_COPY (got: ${JSON.stringify(textOf(copied).slice(0, 40))})`);

    const cut = await call('tools/call', { name: 'cut', arguments: { ref: await editRef() } });
    assert(cut.result?.isError !== true && /CLIP-7421/.test(textOf(cut)), 'MCP cut returns the cut text cursor-free via WM_CUT');
    await Bun.sleep(150);
    const after = editor!.value || editor!.text();
    assert(!after.includes('CLIP-7421'), `cut emptied the control (no SendInput, minimized) — control now ${JSON.stringify(after.slice(0, 20))}`);

    // Stale-clipboard guard: the control is now EMPTY (just cut). Set a sentinel, then copy {ref} — WM_COPY copies
    // nothing, the clipboard counter does not move, so copy must NOT pass the stale sentinel off as this ref's content.
    await call('tools/call', { name: 'set_clipboard', arguments: { text: 'STALE-SENTINEL-9999' } });
    const stale = await call('tools/call', { name: 'copy', arguments: { ref: await editRef() } });
    assert(!/STALE-SENTINEL-9999/.test(textOf(stale)), `copy on an empty control does NOT return the stale clipboard as its content (got: ${JSON.stringify(textOf(stale).slice(0, 50))})`);
  }
} finally {
  const notepadPid = notepad.hWnd !== 0n ? windowProcessId(notepad.hWnd) : 0;
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  if (editHwnd !== 0n) User32.SendMessageW(editHwnd, EM_SETMODIFY, 0n, 0n);
  proc.kill();
  editor?.release();
  notepad.dispose();
  closeWindow(notepad.hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — copy + cut drive a minimized own-HWND Edit cursor-free (WM_COPY / WM_CUT / EM_SETSEL).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
