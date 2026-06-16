/**
 * invoke-no-poll-latency — invoke/expand used to await pollForNewPopup(before, 3), which slept 2×80ms (~160ms) before
 * giving up on the COMMON popup-less call. They now check for an own-window popup synchronously — once immediately and
 * once after the withSnapshot rebuild (whose cache build doubles as settle) — so a popup-less invoke pays no dead poll
 * latency, while a real own-window popup is still auto-returned (covered by expand-returns-popup).
 *
 * Proof: repeatedly invoke Character Map's popup-less "Select" button (a classic Win32 tree that — unlike a UWP app —
 * stays live in the background); the median round-trip must sit well under the old ~160ms dead-sleep floor and carry no
 * spurious popup note. Character Map closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Character Map):
 * Run: bun run example/invoke-no-poll-latency.integration.test.ts
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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'invoke-latency', version: '1' } });
  if (charmap === null) console.log('  skip: Character Map did not launch');
  else {
    await Bun.sleep(900);
    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${charmap.hWnd.toString(16)}` } }));
    const ref = /Button "Select" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1] ?? /Button "[^"]*" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
    if (ref === undefined) console.log('  skip: no popup-less Button ref in the Character Map snapshot');
    else {
      const timings: number[] = [];
      let sawPopupNote = false;
      for (let i = 0; i < 6; i += 1) {
        const start = Bun.nanoseconds();
        const r = await call('tools/call', { name: 'invoke', arguments: { ref } });
        timings.push((Bun.nanoseconds() - start) / 1_000_000);
        if (/opened a flyout\/menu in its OWN window/.test(textOf(r))) sawPopupNote = true;
      }
      timings.sort((a, b) => a - b);
      const median = timings[Math.floor(timings.length / 2)]!;
      console.log(`  invoke round-trips (ms): ${timings.map((t) => t.toFixed(0)).join(', ')} | median ${median.toFixed(0)}`);
      assert(median < 130, `a popup-less invoke median round-trip (${median.toFixed(0)}ms) is well under the old ~160ms dead-poll floor`);
      assert(!sawPopupNote, 'a popup-less invoke carries no spurious own-window-popup note');
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

console.log(failures === 0 ? '\nPASS — invoke/expand pay no dead poll latency on the popup-less path.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
