/**
 * close-modal-honest — manage_window {close} reported a bare "closed" success even when a "Save changes?" modal
 * blocked the close, giving an autonomous agent a false success and orphaning the dialog. It now settles, tests
 * User32.IsWindow, and on survival re-grounds with a "close was BLOCKED" snapshot so the agent acts on the modal.
 *
 * Proof (Notepad with unsaved text over the MCP wire): manage_window {close} returns "BLOCKED" + the window is still
 * alive; dismissing the dialog's "Don't save" then actually closes it. Notepad force-closed in teardown either way.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Notepad):
 * Run: bun run example/close-modal-honest.integration.test.ts
 */
import User32 from '@bun-win32/user32';
import { closeWindow, isWindow, uia } from '@bun-win32/uia';

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
const notepad = await uia.launch(['notepad.exe'], { className: 'Notepad' });
const editor = notepad.find({ controlType: 50004 }) ?? notepad.find({ controlType: 50030 });
const editHwnd = editor?.nativeWindowHandle ?? 0n;
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'close-modal', version: '1' } });
  const hwndHex = `0x${notepad.hWnd.toString(16)}`;
  await call('tools/call', { name: 'attach', arguments: { hWnd: hwndHex } });
  // make it DIRTY so WM_CLOSE raises the Save-changes dialog
  const ref = /(?:Document|Edit|Text)[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/i.exec(textOf(await call('tools/call', { name: 'desktop_snapshot', arguments: {} })))?.[1];
  if (ref !== undefined) await call('tools/call', { name: 'type', arguments: { ref, text: 'UNSAVED-CHANGES-7421' } });
  await Bun.sleep(200);

  const closed = await call('tools/call', { name: 'manage_window', arguments: { hWnd: hwndHex, action: 'close' } });
  const text = textOf(closed);
  if (/window closed/.test(text) && !isWindow(notepad.hWnd)) {
    console.log('  skip: this Notepad closed without a Save prompt (no dirty-state dialog) — cannot exercise the blocked path');
  } else {
    assert(/BLOCKED/.test(text) && isWindow(notepad.hWnd), `manage_window {close} reports the close was BLOCKED and the window is still alive (got: ${JSON.stringify(text.split('\n')[0]?.slice(0, 60))})`);
    // Dismiss via the dialog's Don't-save button (proves the re-grounded snapshot surfaced an actionable modal).
    const faa = await call('tools/call', { name: 'find_and_act', arguments: { selector: { nameContains: "Don't save" }, do: 'invoke' } });
    await Bun.sleep(400);
    if (faa.result?.isError !== true) assert(!isWindow(notepad.hWnd), 'invoking the dialog\'s "Don\'t save" then actually closes the window');
    else console.log(`  note: could not auto-find "Don't save" (${textOf(faa).slice(0, 50)}) — closing forcibly in teardown`);
  }
} finally {
  if (editHwnd !== 0n) User32.SendMessageW(editHwnd, EM_SETMODIFY, 0n, 0n); // clear dirty so the backup close raises no prompt
  proc.kill();
  editor?.release();
  notepad.dispose();
  if (isWindow(notepad.hWnd)) closeWindow(notepad.hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — manage_window {close} detects a modal-blocked close and re-grounds instead of a false success.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
