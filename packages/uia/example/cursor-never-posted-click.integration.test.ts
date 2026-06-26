/**
 * cursor-never-posted-click — AI.md said BUN_UIA_CURSOR=never refuses click_point/click_text, but the handler only
 * refuses their cursor:true variant — the DEFAULT posted (cursor-free) click stays live (keeping the OCR→click_point
 * path to a pixel-only surface usable under the hardened policy). AI.md (the doctrine + the policy bullet) is corrected.
 *
 * Proof: under BUN_UIA_CURSOR=never, click_point {cursor:true} is refused, but the DEFAULT click_point is NOT (it posts
 * cursor-free, or reports no-window — never the cursor:true refusal); and AI.md no longer lists click_point/click_text
 * among the refused tools.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess started with BUN_UIA_CURSOR=never):
 * Run: bun run example/cursor-never-posted-click.integration.test.ts
 */
const proc = Bun.spawn(['bun', 'run', `${import.meta.dir}/../mcp.ts`], { stdin: 'pipe', stdout: 'pipe', stderr: 'ignore', env: { ...Bun.env, BUN_UIA_PROFILE: 'safe', BUN_UIA_CURSOR: 'never' } });
const reader = proc.stdout.getReader();
const decoder = new TextDecoder();
let buffer = '';
type Rpc = { id?: number; result?: { isError?: boolean; content?: { text?: string }[] } };
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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'cursor-never', version: '1' } });

  // cursor:true IS refused under never.
  const real = await call('tools/call', { name: 'click_point', arguments: { x: 5, y: 5, cursor: true } });
  assert(real.result?.isError === true && /disabled by BUN_UIA_CURSOR=never/.test(textOf(real)), 'click_point {cursor:true} is refused under never');

  // The DEFAULT posted click is NOT the cursor:true refusal — it posts cursor-free (or reports no window).
  const posted = await call('tools/call', { name: 'click_point', arguments: { x: 5, y: 5 } });
  assert(
    !/click_point \{cursor:true\} moves the real cursor/.test(textOf(posted)) && /posted .*cursor-free|reached no window/.test(textOf(posted)),
    `the DEFAULT click_point is allowed under never (got: ${JSON.stringify(textOf(posted).slice(0, 80))})`,
  );

  // DOC: AI.md no longer lists click_point/click_text among the tools never refuses.
  const aimd = await Bun.file(`${import.meta.dir}/../AI.md`).text();
  assert(!/refus\w+ (the mouse tools )?`click_point`\/`click_text`\/`drag`/.test(aimd) && !/refuses every SendInput tool \(mouse `click_point`/.test(aimd), 'AI.md no longer claims never refuses click_point/click_text');
  assert(/DEFAULT posted `click_point`\/`click_text`/.test(aimd), 'AI.md states the default posted click_point/click_text stays live under never');
} finally {
  proc.kill();
}

console.log(failures === 0 ? '\nPASS — BUN_UIA_CURSOR=never refuses only the cursor:true variant; the default posted click_point/click_text stay live.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
