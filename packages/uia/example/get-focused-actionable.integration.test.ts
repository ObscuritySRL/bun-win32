/**
 * get-focused-actionable — get_focused returned only controlType + name + (optional) automationId + bounds, so for an
 * UNNAMED focused control it was a dead-end (no way to recognize or act on it). It now also reports className, the
 * clickablePoint (for click_point/inspect_point), and the own nativeWindowHandle (for the cursor-free posted paths) —
 * mirroring inspect_element's actionable identity.
 *
 * Proof: focus Character Map's classic Edit (className "Edit"), then get_focused — the result carries the [class=...]
 * field (and a clickablePoint). Character Map closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Character Map):
 * Run: bun run example/get-focused-actionable.integration.test.ts
 */
import { closeWindow, uia } from '@bun-win32/uia';

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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'get-focused', version: '1' } });
  if (charmap === null) console.log('  skip: Character Map did not launch');
  else {
    await Bun.sleep(900);
    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${charmap.hWnd.toString(16)}` } }));
    const editRef = /Edit[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
    if (editRef !== undefined) await call('tools/call', { name: 'focus', arguments: { ref: editRef } });
    await Bun.sleep(150);
    const focused = textOf(await call('tools/call', { name: 'get_focused', arguments: {} }));
    assert(/\[class=[^\]]+\]/.test(focused), `get_focused now reports the className (actionable identity for an unnamed control) — got: ${JSON.stringify(focused.slice(0, 100))}`);
    assert(/\{x:-?\d+,y:-?\d+ w:\d+ h:\d+\}/.test(focused), 'get_focused still reports bounds (no regression)');
  }
} finally {
  proc.kill();
  if (charmap !== null) {
    closeWindow(charmap.hWnd);
    charmap.dispose();
  }
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — get_focused reports className + clickablePoint + hWnd (an actionable identity).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
