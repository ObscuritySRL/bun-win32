/**
 * find-and-act-submit — find_and_act / reveal {do:'type'} silently dropped the `submit` (press-Enter-after) param that
 * the dedicated `type` tool advertises, so the one-call "type X and submit" flow could not press Enter. submit now
 * threads through act() (postKey Enter on the own-HWND path, sendKeys Enter on the SendInput path) and both schemas
 * advertise it.
 *
 * Proof: find_and_act {do:'type', submit:true} on Character Map's Edit reports "typed … and pressed Enter"; without
 * submit it does not. Character Map closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Character Map):
 * Run: bun run example/find-and-act-submit.integration.test.ts
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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'fa-submit', version: '1' } });
  if (charmap === null) console.log('  skip: Character Map did not launch');
  else {
    await Bun.sleep(900);
    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${charmap.hWnd.toString(16)}` } }));
    const editRef = /Edit[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
    if (editRef === undefined) console.log('  skip: no Edit ref in the Character Map snapshot');
    else {
      const withSubmit = await call('tools/call', { name: 'find_and_act', arguments: { ref: editRef, do: 'type', text: 'abc', submit: true } });
      assert(withSubmit.result?.isError !== true && /typed into.*and pressed Enter/i.test(textOf(withSubmit)), `find_and_act {do:type, submit:true} presses Enter (got: ${JSON.stringify(textOf(withSubmit).slice(0, 70))})`);
      const noSubmit = await call('tools/call', { name: 'find_and_act', arguments: { ref: editRef, do: 'type', text: 'xyz' } });
      assert(noSubmit.result?.isError !== true && !/and pressed Enter/i.test(textOf(noSubmit)), 'without submit, no Enter is pressed (no regression)');
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

console.log(failures === 0 ? '\nPASS — find_and_act/reveal {do:type} honor the submit (press-Enter-after) param.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
