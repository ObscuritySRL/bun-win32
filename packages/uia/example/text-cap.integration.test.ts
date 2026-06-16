/**
 * text-cap — the read verb and the clipboard/copy/cut tools dumped UNCAPPED text into the model's context, unlike
 * snapshot / inspect_element / read_file which all bound their output. A huge editor/terminal buffer on the clipboard
 * could blow the context budget in one call. read/copy/cut/read_clipboard now cap at READ_TEXT_MAX with a pointer to
 * the narrower reads.
 *
 * Proof (real MCP server): put a >READ_TEXT_MAX clipboard payload, read_clipboard returns a capped string carrying
 * the "+N more chars" note, not the whole payload.
 *
 * bun test is broken repo-wide — runnable harness (only the MCP subprocess):
 * Run: bun run example/text-cap.integration.test.ts
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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'text-cap', version: '1' } });
  const huge = 'X'.repeat(9000);
  await call('tools/call', { name: 'set_clipboard', arguments: { text: huge } });
  const read = textOf(await call('tools/call', { name: 'read_clipboard', arguments: {} }));
  assert(read.length < huge.length, `read_clipboard caps a 9000-char payload (returned ${read.length} chars)`);
  assert(read.length <= 4_300, 'the cap is near READ_TEXT_MAX (4000) + the note, not the full buffer');
  assert(/more chars/.test(read), 'the capped read carries a "+N more chars" note pointing at the narrower reads');
} finally {
  proc.kill();
}

console.log(failures === 0 ? '\nPASS — read/clipboard text is capped so a huge buffer cannot blow the context budget.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
