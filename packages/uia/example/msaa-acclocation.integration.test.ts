/**
 * msaa-acclocation — MSAA-only content (owner-draw / legacy apps like Character Map's glyph grid) was readable via
 * msaa_tree but had NO act path: the tree carried name/role/children only, no coordinates, so the agent could see it but
 * not click it (UIA has no ref for it either). msaa.ts now reads IAccessible::accLocation (slot 22 — verified vs oleacc
 * V_ACCLOCATION=0xb0, NOT the verdict's mistaken "20") onto each MsaaNode.bounds, and msaa_tree emits the element center
 * as "@x,y (click_point)" — the existing cursor-free click_point then acts on what UIA/native trees cannot reach.
 *
 * Proof (live): Character Map's MSAA tree has ≥1 node carrying an "@x,y (click_point)" coordinate. Character Map closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + Character Map):
 * Run: bun run example/msaa-acclocation.integration.test.ts
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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'msaa-loc', version: '1' } });
  if (charmap === null) console.log('  skip: Character Map did not launch');
  else {
    await Bun.sleep(900);
    const tree = textOf(await call('tools/call', { name: 'msaa_tree', arguments: { hWnd: `0x${charmap.hWnd.toString(16)}` } }));
    const located = (tree.match(/@-?\d+,-?\d+ \(click_point\)/g) ?? []).length;
    assert(located > 0, `MSAA nodes carry an "@x,y (click_point)" location from accLocation (${located} located node${located === 1 ? '' : 's'})`);
    const sample = tree.split('\n').find((line) => /@-?\d+,-?\d+ \(click_point\)/.test(line)) ?? '';
    if (sample.length > 0) console.log(`  sample: ${sample.trim().slice(0, 100)}`);
  }
} finally {
  proc.kill();
  if (charmap !== null) {
    closeWindow(charmap.hWnd);
    charmap.dispose();
  }
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — MSAA-only content now carries accLocation coordinates, giving a cursor-free click_point act path.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
