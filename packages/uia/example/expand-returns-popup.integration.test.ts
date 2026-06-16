/**
 * expand-returns-popup — a combobox / menu whose list opens in its OWN top-level window (classic Win32 ComboLBox, WinUI
 * Flyout, …) used to leave the agent to hand-hunt it with list_windows{includePopups}; only context_menu auto-returned
 * its popup. expand (and invoke) now poll for the new popup the action opened and return its hWnd directly — checking
 * FIRST so a synchronously-created popup costs nothing, with a small bounded retry when none appears.
 *
 * Proof: attach Character Map, expand its classic "Font" combobox over the MCP wire → the result names the ComboLBox
 * popup's hWnd. The dropdown is dismissed (Escape) and charmap closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Character Map):
 * Run: bun run example/expand-returns-popup.integration.test.ts
 */
import { closeWindow, postKey, uia } from '@bun-win32/uia';

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

uia.initialize();
const charmap = await uia.launch(['charmap.exe'], { title: 'Character Map' }).catch(() => null);
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'expand-popup', version: '1' } });
  if (charmap === null) console.log('  skip: Character Map did not launch');
  else {
    await Bun.sleep(900);
    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${charmap.hWnd.toString(16)}` } }));
    const ref = /ComboBox "[^"]*" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
    if (ref === undefined) console.log('  skip: no ComboBox ref in the Character Map snapshot');
    else {
      const expand = await call('tools/call', { name: 'expand', arguments: { ref } });
      const text = textOf(expand);
      assert(expand.result?.isError !== true && /opened in its OWN window/.test(text) && /\[hWnd=0x[0-9a-f]+\]/.test(text), `expand auto-returns the dropdown's own-window popup (got: ${JSON.stringify(text.slice(0, 110))})`);
      const popupHwnd = /\[hWnd=0x([0-9a-f]+)\]/.exec(text)?.[1];
      if (popupHwnd !== undefined) {
        postKey(BigInt(`0x${popupHwnd}`), 'Escape'); // dismiss the dropdown cursor-free
        await Bun.sleep(120);
      }
    }
  }
} finally {
  proc.kill();
  if (charmap !== null) {
    closeWindow(charmap.hWnd);
    charmap.dispose();
  }
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — expand auto-returns a dropdown that opens in its own window (no hand-hunting).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
