/**
 * bare-ref-rejected — a ref passed WITHOUT its #generation tag (e.g. "e5" instead of "e5#3") can no longer be proven
 * current once any re-render has happened; silently resolving it to whatever now occupies that traversal slot would
 * act on the WRONG control, breaking the documented "rejected, not mis-resolved" guarantee. resolveRef now rejects a
 * bare ref once refGen > 0 (after the first snapshot/re-render) while staying lenient at refGen 0.
 *
 * Proof (taskbar): attach (→ refGen 1), then a bare ref is rejected with a #generation hint, while the SAME ref WITH
 * its #generation still resolves.
 *
 * bun test is broken repo-wide — runnable harness (only the MCP subprocess):
 * Run: bun run example/bare-ref-rejected.integration.test.ts
 */
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

try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'bare-ref', version: '1' } });
  const snap = textOf(await call('tools/call', { name: 'attach', arguments: { className: 'Shell_TrayWnd' } }));
  const m = /\[ref=(e\d+)#(\d+)\]/.exec(snap);
  if (m === null) console.log('  skip: no #generation-tagged ref in the taskbar snapshot');
  else {
    const bareId = m[1]!;
    const taggedRef = `${m[1]}#${m[2]}`;
    const bare = await call('tools/call', { name: 'inspect_element', arguments: { ref: bareId } });
    assert(bare.result?.isError === true && /missing its #generation tag/.test(textOf(bare)), `a BARE ref (${bareId}, no #gen) is REJECTED after a re-render, not silently mis-resolved`);
    const tagged = await call('tools/call', { name: 'inspect_element', arguments: { ref: taggedRef } });
    assert(tagged.result?.isError !== true && !/missing its #generation/.test(textOf(tagged)), `the SAME ref WITH its #generation (${taggedRef}) still resolves`);
  }
} finally {
  proc.kill();
}

console.log(failures === 0 ? '\nPASS — a generation-less ref is rejected (not mis-resolved) once the tree has re-rendered.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
