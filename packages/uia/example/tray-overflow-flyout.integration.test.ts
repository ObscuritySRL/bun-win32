/**
 * tray-overflow-flyout — the system-tray "Show hidden icons" overflow flyout opens as a root-child window of class
 * TopLevelWindowForOverflowXamlIsland that EnumWindows (and so list_windows) never returns, leaving its hidden
 * NotifyItemIcon buttons unreachable. trayFlyoutWindow() surfaces it via root().children (like the notification-toast
 * scan): list_windows lists the open flyout so the agent can attach it by hWnd.
 *
 * Proof (taskbar — read-only): invoke the "Show Hidden Icons" chevron, then list_windows shows the open
 * TopLevelWindowForOverflowXamlIsland row. The flyout is dismissed (Escape) afterward.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + the taskbar):
 * Run: bun run example/tray-overflow-flyout.integration.test.ts
 */
import { postKey, uia } from '@bun-win32/uia';

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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'tray-flyout', version: '1' } });
  const snap = textOf(await call('tools/call', { name: 'attach', arguments: { className: 'Shell_TrayWnd' } }));
  const chevron = /"Show Hidden Icons" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1] ?? /Button "[^"]*[Hh]idden[^"]*" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
  if (chevron === undefined) console.log('  skip: no "Show Hidden Icons" chevron on this taskbar (all icons shown / different layout)');
  else {
    const invoked = await call('tools/call', { name: 'invoke', arguments: { ref: chevron } });
    assert(invoked.result?.isError !== true, 'invoking the "Show Hidden Icons" chevron succeeds (cursor-free)');
    await Bun.sleep(500); // the flyout animates open
    const list = textOf(await call('tools/call', { name: 'list_windows', arguments: {} }));
    assert(
      /TopLevelWindowForOverflowXamlIsland.*overflow flyout/.test(list),
      `list_windows surfaces the open tray overflow flyout (EnumWindows misses it) — got tray line: ${JSON.stringify(
        list
          .split('\n')
          .find((l) => /Overflow/i.test(l))
          ?.slice(0, 90) ?? '(none)',
      )}`,
    );
    const popupHwnd = /\[hWnd=0x([0-9a-f]+)\] *$/m.exec(list.split('\n').find((l) => /TopLevelWindowForOverflowXamlIsland/.test(l)) ?? '')?.[1];
    if (popupHwnd !== undefined) {
      postKey(BigInt(`0x${popupHwnd}`), 'Escape'); // dismiss the flyout cursor-free
      await Bun.sleep(150);
    }
  }
} finally {
  proc.kill();
}

console.log(failures === 0 ? '\nPASS — the system-tray overflow flyout is surfaced in list_windows (EnumWindows misses it).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
