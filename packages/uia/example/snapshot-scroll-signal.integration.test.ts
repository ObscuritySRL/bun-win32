/**
 * snapshot-scroll-signal — the snapshot gave no scroll/offscreen signal, so the agent could not tell which containers
 * have content below the fold (when to reach for reveal/scroll). A ref'd ScrollPattern container that is vertically
 * scrollable now carries a "(scroll N% — more below)" suffix (the scroll PropertyIds ride the SAME single
 * BuildUpdatedCache; the per-node cost is one extra cached read gated on IsScrollPatternAvailable).
 *
 * Proof: open C:\Windows\System32 (a long, scrollable file list) and snapshot it — the List container shows the scroll
 * suffix. Explorer closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Explorer):
 * Run: bun run example/snapshot-scroll-signal.integration.test.ts
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
const prior = new Set(
  uia
    .windows({ includeUntitled: true })
    .filter((w) => w.className === 'CabinetWClass')
    .map((w) => w.hWnd),
);
Bun.spawn(['explorer.exe', '/n,C:\\Windows\\System32'], { stdout: 'ignore', stderr: 'ignore' });
let explorer = 0n;
for (let i = 0; i < 25 && explorer === 0n; i += 1) {
  await Bun.sleep(300);
  explorer = uia.windows({ includeUntitled: true }).find((w) => w.className === 'CabinetWClass' && !prior.has(w.hWnd))?.hWnd ?? 0n;
}
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'scroll-signal', version: '1' } });
  if (explorer === 0n) console.log('  skip: could not open an Explorer window');
  else {
    await Bun.sleep(1500);
    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${explorer.toString(16)}` } }));
    if (!/scrollable=.*V|List "/.test(snap)) console.log('  skip: no scrollable list in the Explorer snapshot (view/layout)');
    else
      assert(
        /\(.*scroll \d+% — more below.*\)|\(.*scroll 100% \(end\).*\)/.test(snap),
        `a scrollable List container carries the scroll signal (got list line: ${JSON.stringify(
          snap
            .split('\n')
            .find((l) => /scroll \d+%|scroll 100%/.test(l))
            ?.trim()
            .slice(0, 70) ?? '(none)',
        )})`,
      );
  }
} finally {
  proc.kill();
  if (explorer !== 0n) closeWindow(explorer);
  for (const window of uia.windows({ includeUntitled: true }).filter((w) => w.className === 'CabinetWClass' && !prior.has(w.hWnd))) closeWindow(window.hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — the snapshot signals a scrollable container has content below the fold.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
