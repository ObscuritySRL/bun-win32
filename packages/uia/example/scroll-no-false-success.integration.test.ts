/**
 * scroll-no-false-success — the scroll handler fell back to the ownerHwnd ANCESTOR when a control had no own HWND, so a
 * posted wheel went to the parent window (e.g. the taskbar) while PostMessage still returned success — a false
 * "scrolled … (posted wheel, cursor-free)" report for a control that never scrolled. The posted-wheel path is now
 * gated on the control's OWN nativeWindowHandle; a no-own-HWND control falls to scrollAt and an honest result.
 *
 * Proof (taskbar — read-only): scroll a no-own-HWND control (the Start button) — the result must NOT claim the false
 * cursor-free posted wheel.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + the taskbar):
 * Run: bun run example/scroll-no-false-success.integration.test.ts
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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'scroll-honest', version: '1' } });
  const snap = textOf(await call('tools/call', { name: 'attach', arguments: { className: 'Shell_TrayWnd' } }));
  const start = /"Start" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
  if (start === undefined) console.log('  skip: no Start button ref on this taskbar');
  else {
    const r = await call('tools/call', { name: 'scroll', arguments: { ref: start, direction: 'up', amount: 2 } });
    const text = textOf(r);
    assert(!/posted wheel, cursor-free/.test(text), `scroll on a no-own-HWND control does NOT falsely claim a cursor-free posted wheel (got: ${JSON.stringify(text.slice(0, 80))})`);
  }
} finally {
  proc.kill();
}

console.log(failures === 0 ? '\nPASS — scroll no longer reports a false posted-wheel success on a no-own-HWND control.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
