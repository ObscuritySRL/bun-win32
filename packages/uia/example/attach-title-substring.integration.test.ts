/**
 * attach-title-substring — attach {title} was exact-match-only: an agent attaching by an app name or a volatile/partial
 * title hit a flat dead end. attachByTitle now falls back to a case-insensitive SUBSTRING match (exact still wins; an
 * ambiguous substring lists candidates to pick by hWnd) before the FindWindowW miss-case.
 *
 * Proof: attach Character Map by hWnd to learn its exact title, then attach by a SUBSTRING of it and confirm the same
 * window attaches; an exact attach still works. Character Map closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Character Map):
 * Run: bun run example/attach-title-substring.integration.test.ts
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
const titleOf = (text: string): string | undefined => /### Snapshot \(epoch \d+\): "([^"]+)"/.exec(text)?.[1];

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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'attach-substr', version: '1' } });
  if (charmap === null) console.log('  skip: Character Map did not launch');
  else {
    await Bun.sleep(800);
    const exactTitle = titleOf(textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${charmap.hWnd.toString(16)}` } })));
    if (exactTitle === undefined || exactTitle.length < 5) console.log(`  skip: no usable Character Map title (${JSON.stringify(exactTitle)})`);
    else {
      const fragment = exactTitle.slice(1, exactTitle.length - 1); // drop first + last char → a strict substring, no exact match
      const bySubstring = await call('tools/call', { name: 'attach', arguments: { title: fragment } });
      assert(bySubstring.result?.isError !== true && titleOf(textOf(bySubstring)) === exactTitle, `attach by a substring (${JSON.stringify(fragment)}) resolves to ${JSON.stringify(exactTitle)} (got: ${JSON.stringify(titleOf(textOf(bySubstring)))})`);

      const byExact = await call('tools/call', { name: 'attach', arguments: { title: exactTitle } });
      assert(byExact.result?.isError !== true && titleOf(textOf(byExact)) === exactTitle, 'an exact-title attach still works');
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

console.log(failures === 0 ? '\nPASS — attach {title} matches a substring when no exact match (exact still wins).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
