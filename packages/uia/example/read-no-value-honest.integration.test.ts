/**
 * read-no-value-honest — the `read` verb returned a value-less control's NAME dressed as `value: "<name>"`, a silent
 * wrong read (the agent thinks the label is the content). read now returns the actual Value/Text content, or — when a
 * control exposes neither — an explicit "(no readable value …)" that does NOT masquerade the name as content. Mirrored
 * in the library execute() facade (agent.ts) so both agree.
 *
 * Proof: reading Character Map's "Select" Button (a name, no Value/Text pattern) returns the honest no-value message,
 * not `value: "Select"`. Character Map closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Character Map):
 * Run: bun run example/read-no-value-honest.integration.test.ts
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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'read-honest', version: '1' } });
  if (charmap === null) console.log('  skip: Character Map did not launch');
  else {
    await Bun.sleep(900);
    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${charmap.hWnd.toString(16)}` } }));
    if (!/Button "Select"/.test(snap)) console.log('  skip: no "Select" button in the Character Map snapshot');
    else {
      const r = await call('tools/call', { name: 'find_and_act', arguments: { selector: { name: 'Select' }, do: 'read' } });
      const text = textOf(r);
      assert(/no readable value/.test(text) && /control name is "Select"/.test(text), `a value-less Button reads as an honest no-value message (got: ${JSON.stringify(text.slice(0, 90))})`);
      assert(!/^value: "Select"/.test(text) && text !== 'value: "Select"', 'the name is NOT returned dressed as the value');
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

console.log(failures === 0 ? '\nPASS — read returns honest content or an explicit no-value message, never the name dressed as value.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
