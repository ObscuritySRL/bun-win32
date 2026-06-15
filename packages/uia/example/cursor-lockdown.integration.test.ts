/**
 * cursor-lockdown — BUN_UIA_CURSOR=never must be ENFORCED on every real-cursor path, including click_point and
 * click_text (both category 'input', reachable under the default safe profile).
 *
 * cursorDenied was consulted only by clickElement and drag, so click_point/click_text still moved the physical
 * mouse — on the explicit cursor:true branch AND the silent clickAt fallback when a posted click reaches no window
 * (the common case on Chromium/Electron/game pixels). Both now return isError so the agent re-routes to a ref.
 *
 * Proof (drives the real MCP server with BUN_UIA_CURSOR=never): both real-cursor paths refuse with NO cursor
 * movement — the cursor:true branch, and the posted-fail→fallback branch (an off-screen pixel where no window
 * exists). Side-effect-free (no click is ever delivered; nothing moves). click_text uses the identical guard.
 *
 * bun test is broken repo-wide — runnable harness (only the MCP subprocess):
 * Run: bun run example/cursor-lockdown.integration.test.ts
 */
type Rpc = { id?: number; result?: { isError?: boolean; content?: { text?: string }[] } };
const proc = Bun.spawn(['bun', 'run', `${import.meta.dir}/../mcp.ts`], { stdin: 'pipe', stdout: 'pipe', stderr: 'ignore', env: { ...Bun.env, BUN_UIA_PROFILE: 'full', BUN_UIA_CURSOR: 'never' } });
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
const isErr = (m: Rpc): boolean => m.result?.isError === true;
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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'cursor-lockdown-test', version: '1' } });

  const explicit = await call('tools/call', { name: 'click_point', arguments: { x: 100, y: 100, cursor: true } });
  assert(isErr(explicit) && /BUN_UIA_CURSOR=never/.test(textOf(explicit)), 'click_point {cursor:true} is REFUSED under BUN_UIA_CURSOR=never (no real cursor moved)');

  // Off-screen pixel: no window there → the posted click fails → the real-cursor fallback must ALSO be refused.
  const fallback = await call('tools/call', { name: 'click_point', arguments: { x: -30000, y: -30000 } });
  assert(isErr(fallback) && /BUN_UIA_CURSOR=never/.test(textOf(fallback)), 'click_point real-cursor FALLBACK (posted click reached no window) is refused under BUN_UIA_CURSOR=never');
} finally {
  proc.kill();
}

console.log(failures === 0 ? '\nPASS — BUN_UIA_CURSOR=never is enforced on click_point (both real-cursor paths); click_text shares the guard.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
