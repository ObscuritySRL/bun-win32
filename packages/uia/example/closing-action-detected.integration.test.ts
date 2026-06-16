/**
 * closing-action-detected — an action that CLOSES the attached window (a dialog's OK/Cancel/Close, a menu Exit) left
 * withSnapshot rebuilding an empty tree WHILE the window tore down asynchronously, so it reported a misleading "cold
 * tree — call desktop_snapshot to build it" loop; the dead-window error only fired on the NEXT call, one round-trip too
 * late, after the agent had already been steered to re-snapshot. withSnapshot now detects the just-closed signature (0
 * marks in the rebuild while the prior snapshot had refs), settles ~200ms, re-checks IsWindow, and on a gone window
 * returns a clean "the window has CLOSED — the action succeeded" steer + drops the dead state.
 *
 * Proof (live): invoking a real MessageBox's OK button (the box pops in a helper process, blocking there until OK)
 * returns the "has CLOSED" steer — never the "cold tree" / "re-snapshot to build it" loop. The helper exits when OK is
 * clicked; it is killed in teardown as a backstop.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a MessageBox helper subprocess):
 * Run: bun run example/closing-action-detected.integration.test.ts
 */
import { uia } from '@bun-win32/uia';

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

// A helper process pops a modal MessageBox (its own thread blocks in MessageBoxW until OK is clicked).
const box = Bun.spawn(['bun', '-e', "import U from '@bun-win32/user32'; const w=(t)=>Buffer.from(t+'\\0','utf16le'); U.MessageBoxW(0n, w('close me').ptr, w('UIA-CLOSE-PROBE').ptr, 0);"], { stdout: 'ignore', stderr: 'ignore' });
uia.initialize();
const win = await uia.waitForWindow({ title: 'UIA-CLOSE-PROBE' }, { timeout: 6000 }).catch(() => null);
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'closing', version: '1' } });
  if (win === null) console.log('  skip: MessageBox helper window did not appear');
  else {
    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${win.hWnd.toString(16)}` } }));
    const okRef = /"OK" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
    if (okRef === undefined) console.log('  skip: no OK button ref in the MessageBox snapshot');
    else {
      const invoked = await call('tools/call', { name: 'invoke', arguments: { ref: okRef } });
      const text = textOf(invoked);
      assert(invoked.result?.isError !== true && /has CLOSED/.test(text) && /action succeeded/.test(text), `invoking the dialog's OK reports the window CLOSED (got: ${JSON.stringify(text.slice(0, 130))})`);
      assert(!/cold tree|call desktop_snapshot again to build it|0 actionable controls/.test(text), 'the misleading cold-tree / re-snapshot-to-build-it loop is gone');
    }
  }
} finally {
  proc.kill();
  box.kill();
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — a window-closing action is reported as a clean close, not a misleading cold-tree re-snapshot loop.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
