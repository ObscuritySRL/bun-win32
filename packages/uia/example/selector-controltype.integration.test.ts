/**
 * selector-controltype — a selector's controlType accepts a ROLE NAME, not just a number.
 *
 * selectorFrom coerced only a number or a numeric string ("50000") for controlType; a model's natural
 * `controlType: 'Button'` was silently dropped, and a controlType-only selector then fell through to the
 * misdirecting "empty selector" error (a key WAS passed). controlTypeId() now resolves a number, a numeric string,
 * OR a role name (case- and separator-insensitive); an unknown name gets a targeted, actionable error.
 *
 * Proof (drives the real MCP server against the always-present taskbar): a named controlType resolves and acts; an
 * unknown name returns the targeted error (not "empty selector"); an empty selector still refuses.
 *
 * bun test is broken repo-wide — runnable harness (only the MCP subprocess):
 * Run: bun run example/selector-controltype.integration.test.ts
 */
type Rpc = { id?: number; result?: { isError?: boolean; content?: { text?: string }[] } };
const proc = Bun.spawn(['bun', 'run', `${import.meta.dir}/../mcp.ts`], { stdin: 'pipe', stdout: 'pipe', stderr: 'ignore', env: { ...Bun.env, BUN_UIA_PROFILE: 'safe' } });
const reader = proc.stdout.getReader();
const decoder = new TextDecoder();
let buffer = '';
const pending = new Map<number, (m: Rpc) => void>();
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
  return new Promise((res) => pending.set(id, res));
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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'selector-ct-test', version: '1' } });
  await call('tools/call', { name: 'attach', arguments: { className: 'Shell_TrayWnd' } });

  const named = await call('tools/call', { name: 'find_and_act', arguments: { do: 'read', selector: { controlType: 'Button' } } });
  assert(!/empty selector|unknown controlType/.test(textOf(named)), 'a NAMED controlType ("Button") resolves and acts (not dropped → not the "empty selector" error)');

  const unknown = await call('tools/call', { name: 'find_and_act', arguments: { do: 'read', selector: { controlType: 'Frobnicator' } } });
  assert(named.result !== undefined && unknown.result?.isError === true && /unknown controlType/.test(textOf(unknown)), 'an unknown controlType name returns a TARGETED error, not the misdirecting "empty selector"');

  const empty = await call('tools/call', { name: 'find_and_act', arguments: { do: 'read', selector: {} } });
  assert(empty.result?.isError === true && /empty selector/.test(textOf(empty)), 'a genuinely empty selector still refuses with the empty-selector error');
} finally {
  proc.kill();
}

console.log(failures === 0 ? '\nPASS — controlType accepts a role name; unknown names + empty selectors fail clearly.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
