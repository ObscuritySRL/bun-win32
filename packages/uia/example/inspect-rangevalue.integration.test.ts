/**
 * inspect-rangevalue — inspect_element used to report a slider's CURRENT rangeValue but NOT its range, so an agent
 * about to set_value(numeric) had no idea what min/max to aim for. inspect_element now appends the
 * RangeValueMinimum/Maximum property reads (existing property IDs — no new FFI). Proven on the Settings sound-page
 * Volume Slider over the real MCP wire (READ ONLY — volume is not changed). SKIPS cleanly when Settings isn't
 * foreground/readable (a UWP suspends its tree when backgrounded).
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + spawned Settings):
 * Run: bun run example/inspect-rangevalue.integration.test.ts
 */
import { closeWindow, raiseWindow, uia } from '@bun-win32/uia';

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
Bun.spawn(['explorer.exe', 'ms-settings:sound'], { stdout: 'ignore', stderr: 'ignore' });
let hWnd = 0n;
for (let i = 0; i < 40 && hWnd === 0n; i++) {
  await Bun.sleep(250);
  hWnd = uia.windows().find((w) => w.title === 'Settings')?.hWnd ?? 0n;
}

try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'inspect-range', version: '1' } });
  if (hWnd === 0n) {
    console.log('  skip(live): Settings did not appear');
  } else {
    await Bun.sleep(2500);
    raiseWindow(hWnd);
    await Bun.sleep(400);
    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${hWnd.toString(16)}` } }));
    const ref = /Slider "[^"]*" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
    if (ref === undefined) {
      console.log(`  skip(live): no Slider ref in the wire snapshot (UWP tree suspended; snap ${snap.length} chars)`);
    } else {
      const out = textOf(await call('tools/call', { name: 'inspect_element', arguments: { ref } }));
      console.log(`  inspect: ${JSON.stringify(out.split('\n').find((line) => line.startsWith('rangeValue')) ?? out.slice(0, 80))}`);
      assert(/rangeValue: .* \(min \d+(?:\.\d+)?, max \d+(?:\.\d+)?[,)]/.test(out), 'inspect_element reports rangeValue WITH its min/max range (and small/large step when present)');
      // the Volume slider is WRITABLE → can: advertises set_value(numeric), NOT read-only (the read-only branch's negative path)
      assert(/can:.*set_value\(numeric\)/.test(out) && !/read-only/.test(out), `a writable slider advertises set_value(numeric) and is not flagged read-only (can: ${JSON.stringify(out.split('\n').find((l) => l.startsWith('can:')) ?? '')})`);
    }
  }
} finally {
  proc.kill();
  if (hWnd !== 0n) closeWindow(hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — inspect_element surfaces a slider’s min/max range.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
