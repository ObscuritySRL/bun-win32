/**
 * click-cursorfree-buttons — the click tool description claimed right/middle/doubleClick need the REAL mouse +
 * foreground, but the handler posts a WM_*BUTTON cursor-free first for EVERY button and doubleClick (real SendInput is
 * only the cursor:true opt-in or the last-resort fallback). The description now matches the code.
 *
 * Proof: the click description (tools/list) advertises cursor-free for every button and reserves the real mouse for
 * cursor:true; a live middle-click (no cursor:true) leaves the real cursor unmoved. Character Map closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Character Map):
 * Run: bun run example/click-cursorfree-buttons.integration.test.ts
 */
import { closeWindow, uia } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';

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
const cursor = (): { x: number; y: number } => {
  const point = Buffer.alloc(8);
  User32.GetCursorPos(point.ptr!);
  return { x: point.readInt32LE(0), y: point.readInt32LE(4) };
};

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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'click-cf', version: '1' } });
  const tools = (await call('tools/list', {})).result?.tools ?? [];
  const desc = tools.find((tool) => tool.name === 'click')?.description ?? '';
  assert(
    /cursor-free for left\/right\/middle \+ doubleClick/i.test(desc) && /cursor:true FORCES the real SendInput mouse/i.test(desc),
    `click description advertises cursor-free for every button (got: ${JSON.stringify(desc.slice(0, 90))})`,
  );

  if (charmap === null) console.log('  skip(live): Character Map did not launch');
  else {
    await Bun.sleep(900);
    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${charmap.hWnd.toString(16)}` } }));
    const ref = /Button "Select" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1] ?? /Button "[^"]*" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
    if (ref === undefined) console.log('  skip(live): no Button ref');
    else {
      User32.SetCursorPos(9, 9);
      await Bun.sleep(60);
      const before = cursor();
      const r = await call('tools/call', { name: 'click', arguments: { ref, button: 'middle' } }); // no cursor:true → must be cursor-free
      await Bun.sleep(60);
      const after = cursor();
      assert(r.result?.isError !== true && /cursor-free/.test(textOf(r)), `a middle click is posted cursor-free (got: ${JSON.stringify(textOf(r).slice(0, 60))})`);
      assert(Math.abs(after.x - before.x) <= 2 && Math.abs(after.y - before.y) <= 2, `the real cursor never moved (before ${before.x},${before.y} → after ${after.x},${after.y})`);
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

console.log(failures === 0 ? '\nPASS — click is cursor-free for every button by default; the description matches the code.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
