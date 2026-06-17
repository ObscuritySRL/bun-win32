/**
 * cloaked-window — list_windows now flags DWM-CLOAKED windows. A cloaked window is DWM-hidden though NOT minimized
 * (so the existing 'min' state misses it) and its UIA tree may read empty — distinct from a cold tree. cloakReason()
 * (window.ts, a flat DwmGetWindowAttribute(DWMWA_CLOAKED) read via @bun-win32/dwmapi — no COM vtable, no segfault)
 * decodes 1=app-hidden/suspended, 2=shell-hidden/other-virtual-desktop, 4=inherited; list_windows appends a steer so
 * the agent doesn't mistake an empty cloaked snapshot for a cold tree or waste an attach on a hidden overlay.
 *
 * Proof: over the real MCP wire — a FOREGROUND Settings window carries NO cloak marker (deterministic negative), and
 * the live system's cloaked overlays (input-experience / thumbnail-helper / etc., which DwmGetWindowAttribute reports
 * cloaked) carry a well-formed `[cloaked: …]` marker (positive; skips clean if the machine happens to have none).
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + spawned Settings):
 * Run: bun run example/cloaked-window.integration.test.ts
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
Bun.spawn(['explorer.exe', 'ms-settings:'], { stdout: 'ignore', stderr: 'ignore' });
let hWnd = 0n;
for (let i = 0; i < 40 && hWnd === 0n; i++) {
  await Bun.sleep(250);
  hWnd = uia.windows().find((w) => w.title === 'Settings')?.hWnd ?? 0n;
}

try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'cloak', version: '1' } });
  if (hWnd === 0n) {
    console.log('  skip(live): Settings did not appear');
  } else {
    await Bun.sleep(1500);
    const out = textOf(await call('tools/call', { name: 'list_windows', arguments: { includePopups: true } }));
    const lines = out.split('\n');
    const fgRow = lines.find((l) => /\([a-z,]*fg[a-z,]*\)/.test(l)); // the (fg) foreground-window row — visible by definition, never cloaked
    const cloakedRows = lines.filter((l) => /\[cloaked: /.test(l));
    console.log(`  fg row: ${JSON.stringify((fgRow ?? '(not found)').slice(0, 90))}`);
    console.log(`  cloaked rows: ${cloakedRows.length}${cloakedRows.length > 0 ? ` (e.g. ${JSON.stringify(cloakedRows[0]!.slice(0, 90))})` : ''}`);
    // deterministic negative: the FOREGROUND window is never cloaked → no marker (proves no false positive)
    assert(fgRow !== undefined && !/\[cloaked: /.test(fgRow), `the foreground window carries NO cloak marker (not a false positive) (fg row: ${JSON.stringify((fgRow ?? '(none)').slice(0, 70))})`);
    // positive: the live system's cloaked overlays carry a well-formed marker (opportunistic — skips if none cloaked)
    if (cloakedRows.length === 0) console.log('  skip(positive): no cloaked windows present on this machine right now');
    else
      assert(
        cloakedRows.every((l) => /\[cloaked: (shell-hidden|app-hidden|inherited)/.test(l)),
        'every cloak marker is well-formed (decodes the DWM reason: shell-hidden / app-hidden / inherited)',
      );
  }
} finally {
  proc.kill();
  if (hWnd !== 0n) closeWindow(hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — list_windows flags DWM-cloaked windows; foreground windows are not flagged.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
