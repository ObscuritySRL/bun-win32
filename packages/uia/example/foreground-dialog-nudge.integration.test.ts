/**
 * foreground-dialog-nudge — when an action leaves a SEPARATE top-level window the attached one OWNS (a dialog / file
 * picker / confirm / color picker) holding the foreground, the snapshot re-grounds only the OLD window and its refs
 * are stale for the new one. Every post-action / re-ground snapshot now appends a one-line ⚠ pointing at the new
 * window's hWnd, gated on ownedForegroundDialog (GetForegroundWindow + GetAncestor GA_ROOTOWNER === attached) so it
 * NEVER false-fires while driving the owner cursor-free in the background.
 *
 * What this harness CAN prove (and does, below): the SAFETY property — in steady state, with no owned dialog holding
 * the foreground, the nudge does NOT fire (no token cost, no false alarm). The POSITIVE trigger (an owned dialog
 * actually foreground) is NOT stageable here: a bun process spawned under a terminal cannot win Windows'
 * foreground-lock to make a test window foreground, and WinForms .Owner from a spawned helper does not reflect in
 * GA_ROOTOWNER — both verified during development. The positive path is a 3-line function over documented, bound
 * Win32 (GetForegroundWindow + GA_ROOTOWNER) whose only unproven link is Windows' own modal-foreground guarantee.
 *
 * bun test is broken repo-wide — runnable harness (only the MCP subprocess + the taskbar):
 * Run: bun run example/foreground-dialog-nudge.integration.test.ts
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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'fg-nudge', version: '1' } });
  // Attach the taskbar (owns no foreground dialog) and snapshot twice — the nudge must NOT appear (no false alarm),
  // proving ownedForegroundDialog returns 0n and foregroundNudge() stays empty on the steady-state hot path.
  await call('tools/call', { name: 'attach', arguments: { className: 'Shell_TrayWnd' } });
  const snap1 = textOf(await call('tools/call', { name: 'desktop_snapshot', arguments: {} }));
  const snap2 = textOf(await call('tools/call', { name: 'desktop_snapshot', arguments: {} }));
  assert(!/holds the foreground|left a dialog\/window it opened/.test(snap1), 'a full snapshot of a window owning no foreground dialog has NO foreground nudge (no false alarm)');
  assert(!/holds the foreground|left a dialog\/window it opened/.test(snap2), 'the no-UI-change re-snapshot path also omits the nudge in steady state');
} finally {
  proc.kill();
}

console.log(failures === 0 ? '\nPASS — the foreground-dialog nudge stays silent in steady state (no false alarm); positive path is environmentally unstageable here.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
