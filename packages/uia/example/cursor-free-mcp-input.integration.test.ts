/**
 * cursor-free-mcp-input — prove the MCP `type` and `paste` TOOLS take the cursor-free path (WM_CHAR / WM_PASTE) on
 * a control with its own window handle, with NO focus and on a MINIMIZED window. Previously both tools always
 * focus()+SendInput, so they hard-failed on a locked/no-cursor session; now they post to the control's HWND when it
 * has one (and only fall to SendInput — refused under BUN_UIA_CURSOR=never — for a WinUI/Chromium sub-control).
 *
 * Proof: spawn Notepad, MINIMIZE it, attach over the MCP wire, type into its Document ref, then paste into it — both
 * must report "cursor-free" and the text must read back. Skips cleanly when the editor has no per-control HWND
 * (modern WinUI Notepad — the ValuePattern/set_value path covers that). Teardown clears the modify flag, then closes.
 *
 * bun test is broken repo-wide — runnable harness (drives the real MCP subprocess + a spawned Notepad):
 * Run: bun run example/cursor-free-mcp-input.integration.test.ts
 */
import User32 from '@bun-win32/user32';
import { closeWindow, windowProcessId } from '@bun-win32/uia';

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
let notepadHwnd = 0n;
let editHwnd = 0n;
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'cf-mcp-input', version: '1' } });
  Bun.spawn(['notepad.exe'], { stdout: 'ignore', stderr: 'ignore' });
  await Bun.sleep(1500);

  // Find the spawned Notepad over the wire, attach + minimize it, then re-snapshot to grab the editable ref.
  const windows = textOf(await call('tools/call', { name: 'list_windows', arguments: {} }));
  const hwndHex = /(?:Notepad|Untitled)[^\n]*?hWnd=0x([0-9a-f]+)/i.exec(windows)?.[1];
  if (hwndHex === undefined) console.log('  skip: no Notepad window found to drive');
  else {
    notepadHwnd = BigInt(`0x${hwndHex}`);
    await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${hwndHex}` } });
    await call('tools/call', { name: 'manage_window', arguments: { hWnd: `0x${hwndHex}`, action: 'minimize' } });
    await Bun.sleep(300);
    // Re-resolve the Document/Edit ref from a FRESH snapshot each time — every mutating tool returns a re-grounding
    // that can renumber refs, so a ref is valid only for the latest snapshot (the test exercises that contract too).
    const currentEditRef = async (): Promise<string | undefined> => {
      const snap = textOf(await call('tools/call', { name: 'desktop_snapshot', arguments: {} }));
      return /(?:Document|Edit|Text)[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/i.exec(snap)?.[1];
    };
    const valueOf = async (): Promise<string> => {
      const ref = await currentEditRef();
      return ref === undefined ? '' : textOf(await call('tools/call', { name: 'inspect_element', arguments: { ref } }));
    };

    const firstRef = await currentEditRef();
    if (firstRef === undefined) console.log('  skip: Notepad editor exposed no Document/Edit ref (WinUI build) — set_value/ValuePattern covers that case');
    else {
      const typed = await call('tools/call', { name: 'type', arguments: { ref: firstRef, text: 'mcp-typed-7421' } });
      assert(typed.result?.isError !== true && /cursor-free/.test(textOf(typed)), 'MCP type reports cursor-free on an own-HWND control (no focus, minimized)');
      assert(/mcp-typed-7421/.test(await valueOf()), 'the typed text reads back through inspect_element (WM_CHAR landed cursor-free)');

      const pasteRef = await currentEditRef();
      const pasted = await call('tools/call', { name: 'paste', arguments: { ref: pasteRef, text: ' mcp-pasted-9920' } });
      assert(pasted.result?.isError !== true && /cursor-free/.test(textOf(pasted)), 'MCP paste reports cursor-free on an own-HWND control (WM_PASTE, no Ctrl+V)');
      const afterPaste = await valueOf();
      assert(/mcp-pasted-9920/.test(afterPaste), 'the pasted clipboard text reads back (WM_PASTE landed cursor-free)');

      const handleHex = /nativeWindowHandle=0x([0-9a-f]+)|handle=0x([0-9a-f]+)/i.exec(afterPaste);
      if (handleHex) editHwnd = BigInt(`0x${handleHex[1] ?? handleHex[2]}`); // clear modify flag in teardown → no Save prompt
    }
  }
} finally {
  const notepadPid = notepadHwnd !== 0n ? windowProcessId(notepadHwnd) : 0;
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  if (editHwnd !== 0n) User32.SendMessageW(editHwnd, EM_SETMODIFY, 0n, 0n);
  proc.kill();
  if (notepadHwnd !== 0n) closeWindow(notepadHwnd); // close the Notepad we spawned (best-effort; modify flag cleared above)
}

console.log(failures === 0 ? '\nPASS — the MCP type + paste tools drive a minimized own-HWND control cursor-free (WM_CHAR / WM_PASTE).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
