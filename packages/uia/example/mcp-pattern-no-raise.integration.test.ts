/**
 * mcp-pattern-no-raise — prove the MCP `set_value` / `toggle` / `invoke` TOOLS drive a classic Win32/HWND control on a
 * MINIMIZED window with the foreground FULLY UNCHANGED. The criticism (findings/32): the raw UIA Value/Toggle/Invoke
 * pattern on an MSAA-bridged control routes through focus + accDoDefaultAction and STEALS FOREGROUND to the control's
 * own HWND — refuting the "cursor-free, works minimized/background" claim the set_value/toggle/invoke tool descriptions
 * make. The fix routes these tools around the pattern: set_value posts WM_SETTEXT, toggle/invoke on a "Button"-class
 * control post BM_CLICK — all focus-clean.
 *
 * This is the END-TO-END guard at the MCP wire (pattern-no-raise.integration.test.ts guards the RAW Element methods,
 * which still steal and are documented as such; THIS guards the tool layer that promises cursor-free). Spawns charmap
 * (classic #32770: own-HWND RICHEDIT50W edit + "Advanced view" checkbox + "Select" button), grabs the refs, MINIMIZES
 * it, then drives each tool over JSON-RPC and asserts the foreground is UNCHANGED across each call (not merely "not the
 * parent window" — fully unchanged) and the app stays minimized. charmap is force-killed in finally.
 *
 * bun test is broken repo-wide for FFI; runnable harness (drives the real MCP subprocess + spawns/kills its charmap):
 * Run: bun run example/mcp-pattern-no-raise.integration.test.ts
 */
import { closeWindow, foregroundWindow, isMinimized, windowProcessId } from '@bun-win32/uia';

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

let charmapHwnd = 0n;
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'mcp-pattern-no-raise', version: '1' } });
  Bun.spawn(['charmap.exe'], { stdout: 'ignore', stderr: 'ignore' });
  await Bun.sleep(1600);

  const windows = textOf(await call('tools/call', { name: 'list_windows', arguments: {} }));
  const hwndHex = /Character Map[^\n]*?hWnd=0x([0-9a-f]+)/i.exec(windows)?.[1];
  if (hwndHex === undefined) console.log('  skip: no Character Map window found to drive');
  else {
    charmapHwnd = BigInt(`0x${hwndHex}`);
    await call('tools/call', { name: 'manage_window', arguments: { hWnd: `0x${hwndHex}`, action: 'minimize' } });
    await Bun.sleep(400);
    assert(isMinimized(charmapHwnd), 'charmap is minimized before any pattern-tool act');
    assert(foregroundWindow() !== charmapHwnd, 'charmap is provably NOT the foreground window before any act');

    // The STRONGER guard the fix delivers: the foreground is FULLY UNCHANGED across the tool call (not just "not the
    // parent window"). Re-attach right before each act to get a CURRENT ref (every mutating tool re-grounds + renumbers).
    const guard = async (label: string, namePattern: RegExp, tool: string, args: object): Promise<void> => {
      const tree = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${hwndHex}` } }));
      const ref = namePattern.exec(tree)?.[1];
      if (ref === undefined) {
        console.log(`  skip: ${label} — no ${label} control in the current tree`);
        return;
      }
      const before = foregroundWindow();
      const result = await call('tools/call', { name: tool, arguments: { ref, ...args } });
      await Bun.sleep(200);
      const after = foregroundWindow();
      assert(result.result?.isError !== true, `${label}: tool did not error (${textOf(result).slice(0, 90)})`);
      assert(after === before, `${label}: foreground FULLY UNCHANGED across the tool call (before=0x${before.toString(16)} after=0x${after.toString(16)})`);
      assert(isMinimized(charmapHwnd), `${label}: charmap stays minimized`);
      assert(/cursor-free|focus-clean|WM_SETTEXT|BM_CLICK/i.test(textOf(result)), `${label}: result names the focus-clean posted path (${textOf(result).slice(0, 90)})`);
    };

    await guard('set_value', /Edit[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/i, 'set_value', { value: 'mcp-no-raise-7421' });
    await guard('toggle', /Advanced view[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/i, 'toggle', {});
    await guard('invoke', /Select[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/i, 'invoke', {});
  }
} finally {
  const charmapPid = charmapHwnd !== 0n ? windowProcessId(charmapHwnd) : 0;
  if (charmapPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(charmapPid)]);
  proc.kill();
  if (charmapHwnd !== 0n) closeWindow(charmapHwnd);
}

console.log(
  failures === 0
    ? '\nPASS — the MCP set_value/toggle/invoke tools drive a minimized classic-Win32 control with the foreground FULLY UNCHANGED (WM_SETTEXT / BM_CLICK — no UIA-bridge foreground steal).'
    : `\nFAILED — ${failures} assertion(s)`,
);
process.exit(failures === 0 ? 0 : 1);
