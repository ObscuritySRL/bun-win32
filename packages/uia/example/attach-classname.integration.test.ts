/**
 * attach-classname — the attach-by-className trap fix + the disposed-snapshot resolve guard.
 *
 * FindWindowW(class, NULL) returns the FIRST top-level match in Z-order; for the whole Chromium/Electron family
 * (Chrome_WidgetWin_1 — Discord, Slack, VS Code, Teams, Edge, …) that is an INVISIBLE helper window, so an agent that
 * attaches by className (as the tool invites) silently lands on a dead window. The MCP attach handler now enumerates
 * VISIBLE windows and refuses (0 match) or asks to disambiguate (>1 match) instead of grabbing the wrong one — single-
 * window classes (Shell_TrayWnd) still attach. Also: Snapshot.resolve() returns null once disposed (no vcall on freed
 * COM pointers).
 *
 * Proof: drive the real MCP server over stdio. Deterministic on any Windows box (bogus class refuses; the taskbar
 * attaches); the >1 disambiguation is asserted opportunistically when a class has multiple visible windows.
 *
 * bun test is broken repo-wide for FFI; runnable harness (spawns + kills only the MCP server subprocess):
 * Run: bun run example/attach-classname.integration.test.ts
 */
import { uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

// Part A — library: a disposed Snapshot resolves every ref to null (rank-2 use-after-release guard).
uia.initialize();
try {
  const target = uia.windows().find((window) => window.title.length > 0);
  if (target === undefined) console.log('  skip: no titled window to snapshot');
  else {
    const app = uia.attach(target.hWnd);
    try {
      const snapshot = uia.snapshot(app);
      const firstRef = snapshot.marks[0]?.ref;
      if (firstRef === undefined) console.log('  skip: snapshot had no refs to exercise resolve()');
      else {
        assert(snapshot.resolve(firstRef) !== null, `resolve(${firstRef}) is live before dispose`);
        snapshot.dispose();
        assert(snapshot.resolve(firstRef) === null, `resolve(${firstRef}) returns null after dispose (no vcall on freed memory)`);
      }
    } finally {
      app.release();
    }
  }
  // Library attach({className}) prefers a VISIBLE window of that class (not FindWindowW's first Z-order match, which
  // for the Chromium/Electron family is an invisible helper).
  const visible = uia.windows({ includeUntitled: true });
  const klass = visible.find((window) => visible.filter((other) => other.className === window.className).length >= 1)?.className;
  if (klass === undefined) console.log('  skip: no class to exercise library className attach');
  else {
    const visibleHandles = new Set(visible.filter((window) => window.className === klass).map((window) => window.hWnd));
    const byClass = uia.attach({ className: klass });
    try {
      assert(visibleHandles.has(byClass.nativeWindowHandle), `library attach({className:${JSON.stringify(klass)}}) lands on a VISIBLE window of that class`);
    } finally {
      byClass.release();
    }
  }
} finally {
  uia.uninitialize();
}

// Part B — MCP server: className attach refuses / disambiguates / succeeds.
type Rpc = { id?: number; result?: { isError?: boolean; content?: { text?: string }[] }; error?: unknown };
const proc = Bun.spawn(['bun', 'run', `${import.meta.dir}/../mcp.ts`], { stdin: 'pipe', stdout: 'pipe', stderr: 'ignore' });
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
function call(id: number, method: string, params: object): Promise<Rpc> {
  proc.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  proc.stdin.flush();
  return new Promise((resolveCall) => pending.set(id, resolveCall));
}
const textOf = (message: Rpc): string => message.result?.content?.[0]?.text ?? JSON.stringify(message.error ?? message.result);
try {
  await call(1, 'initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '0' } });

  const bogus = await call(2, 'tools/call', { name: 'attach', arguments: { className: 'NoSuchClass_zzz999' } });
  assert(bogus.result?.isError === true && /no VISIBLE window has class/.test(textOf(bogus)), 'attach to an absent class refuses (no silent invisible-helper grab)');

  const tray = await call(3, 'tools/call', { name: 'attach', arguments: { className: 'Shell_TrayWnd' } });
  assert(tray.result?.isError !== true && /attached to/.test(textOf(tray)), 'attach to a single-window class (Shell_TrayWnd) still succeeds');

  // Opportunistic: a class with >1 visible window must disambiguate, not silently pick one.
  const counts = new Map<string, number>();
  for (const window of uia.windows({ includeUntitled: true })) counts.set(window.className, (counts.get(window.className) ?? 0) + 1);
  const multi = [...counts.entries()].find(([, count]) => count > 1)?.[0];
  if (multi === undefined) console.log('  skip: no class has >1 visible window to exercise disambiguation');
  else {
    const ambiguous = await call(4, 'tools/call', { name: 'attach', arguments: { className: multi } });
    assert(ambiguous.result?.isError === true && /visible windows have class/.test(textOf(ambiguous)), `attach to an ambiguous class (${multi}) disambiguates with hWnds instead of grabbing one`);
  }
} finally {
  proc.kill();
}

console.log(failures === 0 ? '\nPASS — className attach refuses/disambiguates/succeeds correctly; disposed snapshots resolve safe.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
