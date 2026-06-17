/**
 * instructions-readonly — under a restricted profile the system-prompt INSTRUCTIONS must not describe action tools
 * that tools/list does not expose, and a disabled-tool error must give a CATEGORY-ACCURATE remedy (BUN_UIA_OS=1
 * enables only os/fs — it does NOT enable input/window tools, which need a profile bump or an allow-list entry).
 *
 * Proof (BUN_UIA_PROFILE=readonly): initialize returns the READ-ONLY instructions (no "Prefer invoke" action verbs);
 * a disabled input tool (click) is steered to BUN_UIA_PROFILE, NOT BUN_UIA_OS=1; a disabled os tool (launch_app) IS
 * steered to BUN_UIA_OS=1.
 *
 * bun test is broken repo-wide — runnable harness (only the MCP subprocess):
 * Run: bun run example/instructions-readonly.integration.test.ts
 */
type Rpc = { id?: number; result?: { isError?: boolean; instructions?: string; serverInfo?: { name?: string; version?: string }; tools?: Record<string, unknown>[]; content?: { text?: string }[] } };
const proc = Bun.spawn(['bun', 'run', `${import.meta.dir}/../mcp.ts`], { stdin: 'pipe', stdout: 'pipe', stderr: 'ignore', env: { ...Bun.env, BUN_UIA_PROFILE: 'readonly' } });
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
  const init = await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'ro', version: '1' } });
  const instructions = init.result?.instructions ?? '';
  assert(/READ-ONLY/.test(instructions) && !/Prefer invoke\/set_value/.test(instructions), 'readonly profile gets READ-ONLY instructions with no action-tool guidance');

  const manifest: { version: string } = await Bun.file(`${import.meta.dir}/../package.json`).json();
  assert(init.result?.serverInfo?.version === manifest.version, `initialize serverInfo.version (${init.result?.serverInfo?.version}) matches package.json (${manifest.version}) — no drift`);

  const list = await call('tools/list', {});
  const tools = list.result?.tools ?? [];
  assert(tools.length > 0 && tools.every((tool) => !('category' in tool)), 'tools/list entries carry no internal `category` field (MCP Tool wire shape only)');
  // read_clipboard is gated as the 'input' category (NOT 'read'), so the read-only profile must NOT auto-expose the
  // secret-bearing global clipboard — a deployer opts in with BUN_UIA_ALLOW=read_clipboard.
  assert(!tools.some((tool) => tool.name === 'read_clipboard'), 'readonly does NOT expose read_clipboard (clipboard is a plaintext secret store — opt in with BUN_UIA_ALLOW=read_clipboard)');

  const click = await call('tools/call', { name: 'click', arguments: { ref: 'e1' } });
  assert(click.result?.isError === true && /BUN_UIA_PROFILE=safe/.test(textOf(click)) && !/BUN_UIA_OS=1/.test(textOf(click)), 'a disabled INPUT tool (click) steers to BUN_UIA_PROFILE, NOT the inapplicable BUN_UIA_OS=1');

  const launch = await call('tools/call', { name: 'launch_app', arguments: { command: 'notepad' } });
  assert(launch.result?.isError === true && /BUN_UIA_OS=1/.test(textOf(launch)), 'a disabled OS tool (launch_app) steers to BUN_UIA_OS=1');
} finally {
  proc.kill();
}

console.log(failures === 0 ? '\nPASS — readonly INSTRUCTIONS omit action tools; disabled-tool remedies are category-accurate.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
