/**
 * find-text-replace-guidance — find_text's guidance told the agent to replace the selected match with set_value, but
 * set_value = ValuePattern.SetValue overwrites the WHOLE control (silent data loss in the canonical find-and-replace
 * workflow). The tool description and the runtime success message now steer to type/paste over the selection (which
 * replaces ONLY the match) and explicitly warn that set_value wipes the whole control.
 *
 * Proof: the find_text tool description (tools/list) no longer advises set_value and warns against it; a live find_text
 * match on Character Map's edit (best-effort) shows the corrected runtime message. Character Map closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Character Map):
 * Run: bun run example/find-text-replace-guidance.integration.test.ts
 */
import { closeWindow, uia } from '@bun-win32/uia';

type Tool = { name: string; description?: string };
type Rpc = { id?: number; result?: { isError?: boolean; content?: { text?: string }[]; tools?: Tool[] } };
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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'find-text-guide', version: '1' } });
  const tools = (await call('tools/list', {})).result?.tools ?? [];
  const desc = tools.find((tool) => tool.name === 'find_text')?.description ?? '';
  assert(/NOT set_value/.test(desc) && !/replace it \(set_value/.test(desc), `find_text description steers AWAY from set_value (got: ${JSON.stringify(desc.slice(0, 120))})`);

  // Best-effort runtime message: put text in Character Map's edit, find_text a substring, check the corrected message.
  if (charmap === null) console.log('  skip(runtime): Character Map did not launch');
  else {
    await Bun.sleep(900);
    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${charmap.hWnd.toString(16)}` } }));
    const editRef = /Edit[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
    if (editRef === undefined) console.log('  skip(runtime): no Edit ref');
    else {
      await call('tools/call', { name: 'type', arguments: { ref: editRef, text: 'alpha bravo charlie' } });
      await Bun.sleep(150);
      const found = textOf(await call('tools/call', { name: 'find_text', arguments: { ref: editRef, text: 'bravo' } }));
      if (/not present|no UIA TextPattern/.test(found)) console.log(`  skip(runtime): find_text could not match (${JSON.stringify(found.slice(0, 60))})`);
      else assert(/NOT set_value/.test(found) && /type or paste/.test(found), `the find_text success message steers to type/paste, not set_value (got: ${JSON.stringify(found.slice(0, 110))})`);
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

console.log(failures === 0 ? '\nPASS — find_text guidance steers to type/paste (surgical) and warns set_value wipes the whole control.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
