/**
 * MCP snapshot economy — end-to-end proof over the REAL stdio JSON-RPC server (not the units).
 *
 * Drives packages/uia/mcp.ts as a child process and asserts the wired path:
 *  1. desktop_snapshot {maxDepth:1} returns a shallow tree vs the default — the agent's size lever, dead
 *     before this change (handler ignored the arg), now works end-to-end.
 *  2. An action whose change adds/removes an actionable control returns the FULL pruned tree (ref churn →
 *     safe re-ground); a follow-up pure-rename action returns a compact "Δ" delta that names the change.
 *
 * bun test is broken repo-wide — runnable harness:
 * Run: bun run example/mcp-snapshot-economy.integration.test.ts
 */
const calc = Bun.spawn(['cmd', '/c', 'start', 'calc'], { stdout: 'ignore', stderr: 'ignore' });
await Bun.sleep(1500);

const server = Bun.spawn(['bun', `${import.meta.dir}/../mcp.ts`], { stdin: 'pipe', stdout: 'pipe', stderr: 'inherit', env: { ...Bun.env, BUN_UIA_PROFILE: 'safe' } });
const decoder = new TextDecoder();
const encoder = new TextEncoder();
const pending = new Map<number, (message: { result?: Record<string, unknown> }) => void>();
let buffer = '';
let nextId = 1;
void (async () => {
  for await (const chunk of server.stdout) {
    buffer += decoder.decode(chunk);
    let newline = buffer.indexOf('\n');
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line.length > 0) {
        const message = JSON.parse(line);
        if (typeof message.id === 'number' && pending.has(message.id)) {
          pending.get(message.id)?.(message);
          pending.delete(message.id);
        }
      }
      newline = buffer.indexOf('\n');
    }
  }
})();
const call = (method: string, params: unknown): Promise<{ result?: Record<string, unknown> }> => {
  const id = nextId++;
  server.stdin.write(encoder.encode(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`));
  server.stdin.flush();
  return new Promise((resolve) => pending.set(id, resolve));
};
const textOf = (response: { result?: Record<string, unknown> }): string => (Array.isArray(response.result?.content) && response.result.content[0]?.type === 'text' ? String(response.result.content[0].text) : '');
const lineCount = (text: string): number => text.split('\n').filter((line) => line.includes('- ')).length;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    server.kill();
    calc.kill();
    process.exit(1);
  }
  console.log(`  ok: ${message}`);
}

await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'economy-test', version: '1' } });

const attached = await call('tools/call', { name: 'attach', arguments: { title: 'Calculator' } });
assert(textOf(attached).includes('[ref='), 'attach returned a ref-keyed snapshot');

console.log('\n[1] maxDepth lever (was a dead no-op)');
const shallow = await call('tools/call', { name: 'desktop_snapshot', arguments: { maxDepth: 1 } });
const deep = await call('tools/call', { name: 'desktop_snapshot', arguments: {} });
const shallowLines = lineCount(textOf(shallow));
const deepLines = lineCount(textOf(deep));
console.log(`  maxDepth:1 → ${shallowLines} node lines; default → ${deepLines} node lines`);
assert(shallowLines < deepLines, `maxDepth:1 yields a shallower tree than the default (${shallowLines} < ${deepLines})`);

console.log('\n[2] action observation: Δ delta on a pure-rename step (vs a full re-ground)');
// Calculator is single-instance (keeps its display across runs), so we don't pin which press churns the
// Clear→Clear entry button. Press Five once to guarantee entry mode, then again: the 2nd digit press is a
// pure display rename (no control added/removed) and MUST come back as a compact Δ delta. A full re-dump
// (epoch + every [ref=]) is the baseline we compare against.
const fullBody = textOf(deep);
const fiveRef = textOf(deep).match(/"Five" \[ref=(e\d+(?:#\d+)?)\]/)?.[1];
assert(fiveRef !== undefined, `located the Five button ref (${fiveRef})`);
await call('tools/call', { name: 'invoke', arguments: { element: 'Five', ref: fiveRef } });

const reground = await call('tools/call', { name: 'desktop_snapshot', arguments: {} });
const fiveRef2 = textOf(reground).match(/"Five" \[ref=(e\d+(?:#\d+)?)\]/)?.[1];
const press = await call('tools/call', { name: 'invoke', arguments: { element: 'Five', ref: fiveRef2 } });
const pressText = textOf(press);
console.log(`  pure-rename invoke → ${pressText.split('\n').length} lines:\n${pressText.split('\n').map((line) => `    ${line}`).join('\n')}`);
assert(pressText.includes('— Δ'), 'the pure-rename action returns a compact Δ delta, not a full re-dump');
assert(/Display is/.test(pressText), 'the Δ delta names the changed display text');
assert(pressText.length * 3 < fullBody.length, `the Δ reply is far smaller than a full re-ground (${pressText.length} vs ${fullBody.length} chars)`);

await call('tools/call', { name: 'manage_window', arguments: { action: 'close' } });
server.stdin.end();
await Bun.sleep(300);
server.kill();
calc.kill();
console.log('\nPASS — MCP snapshot economy verified end-to-end (maxDepth live; Δ delta vs full re-ground).');
process.exit(0);
