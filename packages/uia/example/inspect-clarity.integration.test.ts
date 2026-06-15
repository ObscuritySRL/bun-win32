/**
 * inspect-clarity — two inspect_element/snapshot clarity guards:
 *   1. PASSWORD GATE: a field that reports UIA IsPassword=true renders as "(password)" and NEVER emits its value
 *      (snapshot + inspect_element + read). Verified live: both native ES_PASSWORD edits and Chromium
 *      <input type=password> already mask the value via UIA, so this is defense-in-depth + clearer labeling
 *      (it also covers any custom control that DOES expose a cleartext value behind IsPassword).
 *   2. AFFORDANCES: inspect_element lists a "can:" line of the actions a control actually supports (from each
 *      Is*PatternAvailable), so an agent picks the verb instead of guessing from the role — a "Button" may only
 *      ExpandCollapse, and invoke() can silently no-op.
 *
 * Part A is fully deterministic (a synthetic ES_PASSWORD child edit + a plain edit). Part B drives the real MCP
 * server over stdio against the always-present taskbar.
 *
 * bun test is broken repo-wide for FFI; runnable harness (only synthetic windows it destroys + the MCP subprocess):
 * Run: bun run example/inspect-clarity.integration.test.ts
 */
import User32 from '@bun-win32/user32';
import { attach, ControlType, renderSnapshot, uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const WS_POPUP = 0x8000_0000;
const WS_VISIBLE = 0x1000_0000;
const WS_CHILD = 0x4000_0000;
const ES_PASSWORD = 0x0020;
const SECRET = 'TopSecretValue4242';
const PLAIN = 'PlainVisible1234';

// Part A — password gate + value specificity, on synthetic native controls.
uia.initialize();
const editClass = Buffer.from('EDIT\0', 'utf16le');
const staticClass = Buffer.from('Static\0', 'utf16le');
const parent = User32.CreateWindowExW(0, staticClass.ptr!, null, WS_POPUP | WS_VISIBLE, 120, 120, 360, 120, 0n, 0n, 0n, null);
const passwordEdit = User32.CreateWindowExW(0, editClass.ptr!, null, WS_CHILD | WS_VISIBLE | ES_PASSWORD, 5, 5, 320, 28, parent, 0n, 0n, null);
const plainEdit = User32.CreateWindowExW(0, editClass.ptr!, null, WS_CHILD | WS_VISIBLE, 5, 45, 320, 28, parent, 0n, 0n, null);
try {
  User32.SetWindowTextW(passwordEdit, Buffer.from(`${SECRET}\0`, 'utf16le').ptr!);
  User32.SetWindowTextW(plainEdit, Buffer.from(`${PLAIN}\0`, 'utf16le').ptr!);
  await Bun.sleep(150);

  const pwd = attach(passwordEdit);
  assert(pwd.isPassword === true, 'a native ES_PASSWORD edit reports isPassword=true');
  const pwdRendered = renderSnapshot(uia.snapshot(pwd).tree);
  assert(!pwdRendered.includes(SECRET), 'the snapshot NEVER contains the password value');
  assert(/\(password\)/.test(pwdRendered), 'the password field is labelled "(password)" in the snapshot');
  pwd.release();

  const plain = attach(plainEdit);
  assert(plain.isPassword === false, 'a plain edit reports isPassword=false');
  const plainRendered = renderSnapshot(uia.snapshot(plain).tree);
  assert(plainRendered.includes(PLAIN), 'a plain edit still shows its value (gate is specific — no over-redaction)');
  plain.release();
} finally {
  User32.DestroyWindow(passwordEdit);
  User32.DestroyWindow(plainEdit);
  User32.DestroyWindow(parent);
  uia.uninitialize();
}

// Part B — inspect_element "can:" affordance line, via the real MCP server.
type Rpc = { id?: number; result?: { isError?: boolean; content?: { text?: string }[] } };
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
const textOf = (message: Rpc): string => message.result?.content?.[0]?.text ?? '';
try {
  await call(1, 'initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '0' } });
  await call(2, 'tools/call', { name: 'attach', arguments: { className: 'Shell_TrayWnd' } });
  const snap = await call(3, 'tools/call', { name: 'desktop_snapshot', arguments: {} });
  const ref = /\[ref=(e\d+(?:#\d+)?)\]/.exec(textOf(snap))?.[1];
  if (ref === undefined) console.log('  skip: taskbar snapshot had no ref to inspect');
  else {
    const inspected = await call(4, 'tools/call', { name: 'inspect_element', arguments: { ref } });
    assert(/\ncan: /.test(textOf(inspected)), `inspect_element lists a "can:" affordance line (ref ${ref})`);
  }
} finally {
  proc.kill();
}

console.log(failures === 0 ? '\nPASS — password fields are withheld + labelled; inspect_element reports real affordances.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
