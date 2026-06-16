/**
 * attach-act-disambiguation — silent wrong-target is the failure mode the codebase fights everywhere. Two REFLECT
 * #19 fixes extend the attachByClassName disambiguation discipline:
 *   (1) attach {processId} (and {title}) now refuses an AMBIGUOUS match, listing candidates, instead of silently
 *       grabbing an arbitrary window of that process/title for the whole session.
 *   (2) find_and_act refuses a DESTRUCTIVE verb when the selector matched >1 controls (lists candidates), instead of
 *       silently acting on the first — the agent narrows by automationId/controlType or passes a ref.
 *
 * Proof: (2) attach the taskbar, find_and_act {controlType:Button, do:invoke} → "matched N controls — refusing".
 * (1) open two Explorer windows (one explorer.exe pid), attach {processId} → ambiguity error listing them. Closed.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + spawned Explorers):
 * Run: bun run example/attach-act-disambiguation.integration.test.ts
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
    .windows()
    .filter((w) => w.className === 'CabinetWClass')
    .map((w) => w.hWnd),
);
Bun.spawn(['explorer.exe', 'C:\\Windows'], { stdout: 'ignore', stderr: 'ignore' });
Bun.spawn(['explorer.exe', 'C:\\Windows\\System32'], { stdout: 'ignore', stderr: 'ignore' });
await Bun.sleep(3000);
const opened = uia.windows().filter((w) => w.className === 'CabinetWClass' && !prior.has(w.hWnd));
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'disambig', version: '1' } });

  // (2) find_and_act ambiguity on the taskbar (always many Buttons).
  await call('tools/call', { name: 'attach', arguments: { className: 'Shell_TrayWnd' } });
  const acted = await call('tools/call', { name: 'find_and_act', arguments: { selector: { controlType: 'Button' }, do: 'invoke' } });
  assert(acted.result?.isError === true && /matched \d+ controls — refusing to invoke/.test(textOf(acted)), 'find_and_act refuses a destructive verb on an ambiguous selector (lists candidates), not silent first-match');
  const readMany = await call('tools/call', { name: 'find_and_act', arguments: { selector: { controlType: 'Button' }, do: 'read' } });
  assert(readMany.result?.isError !== true && /the first of \d+ matches/.test(textOf(readMany)), 'find_and_act {do:read} acts on the first but flags the other matches (non-destructive)');

  // (1) attach {processId} ambiguity — pick a pid that genuinely owns >1 visible window (same enumeration the
  // handler uses), e.g. a shell/host process; the two spawned Explorers guarantee at least one such pid exists.
  const byPid = new Map<number, number>();
  for (const window of uia.windows({ includeUntitled: true })) byPid.set(window.processId, (byPid.get(window.processId) ?? 0) + 1);
  const multiPid = [...byPid.entries()].find(([, count]) => count > 1)?.[0];
  if (multiPid === undefined) console.log('  skip: no process owns >1 visible window right now for the processId-ambiguity case');
  else {
    const ambiguous = await call('tools/call', { name: 'attach', arguments: { processId: multiPid } });
    assert(ambiguous.result?.isError === true && /has \d+ visible windows/.test(textOf(ambiguous)), 'attach {processId} of a multi-window process refuses + lists windows, not a silent arbitrary grab');
  }
} finally {
  proc.kill();
  for (const window of opened) closeWindow(window.hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — attach + find_and_act refuse ambiguous targets with candidate lists (no silent wrong-target).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
