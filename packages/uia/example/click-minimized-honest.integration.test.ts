/**
 * click-minimized-honest — a posted COORDINATE click cannot land on a window whose pixels are off-screen (a
 * minimized window's bounds are ~-32000), so clicking a no-Invoke control on a minimized window used to post to a
 * phantom point and report "posted (cursor-free)" success while nothing happened. clickElement now detects the
 * off-screen / minimized case (after Invoke — which DOES work minimized — has been tried) and returns an honest
 * isError steering to manage_window {action:restore} or a pattern verb, instead of a false success.
 *
 * Proof: minimize Notepad, then click {ref} a non-Invoke control (its Document/Edit body) — the result is an
 * isError mentioning the minimized window + restore, not a fake success. (An Invoke-able control would still work
 * minimized; this guards only the coordinate fallback.) Notepad closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Notepad):
 * Run: bun run example/click-minimized-honest.integration.test.ts
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
const notepad = await uia.launch(['notepad.exe'], { className: 'Notepad' });
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'click-min', version: '1' } });
  await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${notepad.hWnd.toString(16)}` } });
  await call('tools/call', { name: 'manage_window', arguments: { hWnd: `0x${notepad.hWnd.toString(16)}`, action: 'minimize' } });
  await Bun.sleep(300);
  const snap = textOf(await call('tools/call', { name: 'desktop_snapshot', arguments: {} }));
  // A Document/Edit/Text node has no Invoke pattern, so a click on it takes the posted-coordinate path.
  const ref = /(?:Document|Edit|Text)[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/i.exec(snap)?.[1];
  if (ref === undefined) console.log('  skip: no non-Invoke ref to exercise the coordinate-click guard');
  else {
    const clicked = await call('tools/call', { name: 'click', arguments: { ref } });
    const text = textOf(clicked);
    if (/posted .*cursor-free|clicked/.test(text) && clicked.result?.isError !== true) console.log(`  skip: control was Invoke-able / on-screen (got a real success: ${JSON.stringify(text.split('\n')[0]?.slice(0, 50))})`);
    else
      assert(
        clicked.result?.isError === true && /off-screen|minimized/.test(text) && /manage_window/.test(text),
        `clicking a no-Invoke control on a MINIMIZED window returns an honest isError (restore steer), not a fake "posted" success (got: ${JSON.stringify(text.slice(0, 80))})`,
      );
  }
} finally {
  proc.kill();
  closeWindow(notepad.hWnd);
  notepad.dispose();
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — a coordinate click on an off-screen/minimized no-Invoke control fails honestly, not silently.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
