/**
 * minimized-pattern-steer — a pattern verb that fails on a MINIMIZED window threw the generic "this control may not
 * support … (can: list)" steer — a dead-end loop when the real blocker is that the window is minimized (a WinUI/UWP tree
 * suspends; even a classic window is best restored first). patternAction now checks isMinimized(attached) on the failure
 * path and steers to the cursor-free restore instead.
 *
 * Proof: attach Character Map, minimize it, then invoke its combobox (which exposes ExpandCollapse, not Invoke, so the
 * verb fails) — the error names the MINIMIZED window and steers to manage_window restore, not the can: dead-end.
 * Character Map closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Character Map):
 * Run: bun run example/minimized-pattern-steer.integration.test.ts
 */
import { closeWindow, minimizeWindow, uia } from '@bun-win32/uia';

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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'min-steer', version: '1' } });
  if (charmap === null) console.log('  skip: Character Map did not launch');
  else {
    await Bun.sleep(900);
    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${charmap.hWnd.toString(16)}` } }));
    const combo = /ComboBox "[^"]*" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
    if (combo === undefined) console.log('  skip: no ComboBox ref in the Character Map snapshot');
    else {
      minimizeWindow(charmap.hWnd);
      await Bun.sleep(400);
      const r = await call('tools/call', { name: 'invoke', arguments: { ref: combo } }); // combobox has no Invoke pattern → patternAction throws
      const text = textOf(r);
      assert(r.result?.isError === true && /MINIMIZED/i.test(text) && /restore/i.test(text), `a failing pattern verb on a minimized window steers to restore, not the generic can: dead-end (got: ${JSON.stringify(text.slice(0, 100))})`);
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

console.log(failures === 0 ? '\nPASS — a pattern verb failing on a minimized window steers to the cursor-free restore.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
