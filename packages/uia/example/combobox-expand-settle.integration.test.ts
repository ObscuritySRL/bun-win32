/**
 * combobox-expand-settle — a WinUI/UWP combobox does NOT open its dropdown in an own window; it renders the items into
 * the SAME tree (ref'd ListItems under the combobox) after a brief render race. expand used to do one immediate
 * (~13ms) rebuild that races the items and steer "desktop_snapshot to see revealed items" — a dead end. expand (and
 * find_and_act {do:expand}) now SETTLE: poll the rebuilt snapshot until its ref count grows past the pre-expand
 * baseline, so the revealed items are in the returned snapshot.
 *
 * Proof: attach Win11 Settings, find_and_act {selector:{role:"ComboBox"}, do:"expand"} → the returned snapshot has MORE
 * refs than before (the dropdown items materialized) and the combobox reads (expanded). Settings closed in teardown.
 * (UWP suspends its tree when backgrounded, so this skips if the subprocess gets a cold tree.)
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Settings):
 * Run: bun run example/combobox-expand-settle.integration.test.ts
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
const refCount = (text: string): number => (text.match(/\[ref=/g) ?? []).length;

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
const settings = await uia.launch(['cmd', '/c', 'start', 'ms-settings:'], { title: 'Settings' }).catch(() => null);
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'combo-settle', version: '1' } });
  if (settings === null) console.log('  skip: Settings did not launch');
  else {
    await Bun.sleep(2500);
    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${settings.hWnd.toString(16)}` } }));
    const before = refCount(snap);
    if (!/ComboBox /.test(snap)) console.log(`  skip: no ComboBox in the Settings snapshot (cold UWP tree — ${before} refs)`);
    else {
      const r = await call('tools/call', { name: 'find_and_act', arguments: { selector: { role: 'ComboBox' }, do: 'expand' } });
      const text = textOf(r);
      const after = refCount(text);
      assert(r.result?.isError !== true && /^expanded ComboBox/.test(text), `find_and_act {do:expand} succeeded on the combobox (got: ${JSON.stringify(text.slice(0, 60))})`);
      assert(after > before, `the settled snapshot revealed the in-tree dropdown items — refs ${before} → ${after} (no own-window hunt, no race miss)`);
      assert(!/desktop_snapshot to see revealed items/.test(text), 'the dead-end "desktop_snapshot to see revealed items" steer is gone');
    }
  }
} finally {
  proc.kill();
  if (settings !== null) {
    closeWindow(settings.hWnd);
    settings.dispose();
  }
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — a WinUI combobox expand settles for its in-tree dropdown items.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
