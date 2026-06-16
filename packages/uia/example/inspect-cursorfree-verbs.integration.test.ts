/**
 * inspect-cursorfree-verbs — inspect_element's `can:` list (the authoritative affordance list the tool tells the agent
 * to drive off) consulted only Is*PatternAvailable and ignored the nativeWindowHandle it already read, so it never
 * surfaced the cursor-free posted-message text verbs (type/paste/copy/cut via WM_CHAR/WM_PASTE/WM_COPY/WM_CUT) that work
 * on a classic Win32 Edit with its own HWND. The can: list now names them for an own-HWND text control.
 *
 * Proof: inspect Character Map's "Characters to copy" Edit (own HWND + Value/Text pattern) → can: includes the
 * cursor-free text verbs; a no-text Button does not. Character Map closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Character Map):
 * Run: bun run example/inspect-cursorfree-verbs.integration.test.ts
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
const charmap = await uia.launch(['charmap.exe'], { title: 'Character Map' }).catch(() => null);
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'inspect-verbs', version: '1' } });
  if (charmap === null) console.log('  skip: Character Map did not launch');
  else {
    await Bun.sleep(900);
    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${charmap.hWnd.toString(16)}` } }));
    const editRef = /Edit[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
    const buttonRef = /Button "[^"]*" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
    if (editRef === undefined) console.log('  skip: no Edit ref in the Character Map snapshot');
    else {
      const edit = textOf(await call('tools/call', { name: 'inspect_element', arguments: { ref: editRef } }));
      assert(/nativeWindowHandle: 0x/.test(edit) && /can:[^\n]*type\/paste\/copy\/cut \(cursor-free/.test(edit), `inspect_element on an own-HWND Edit lists the cursor-free text verbs (got: ${JSON.stringify(/can:[^\n]*/.exec(edit)?.[0]?.slice(0, 90) ?? '')})`);
      if (buttonRef !== undefined) {
        const button = textOf(await call('tools/call', { name: 'inspect_element', arguments: { ref: buttonRef } }));
        assert(!/type\/paste\/copy\/cut/.test(button), 'a no-text Button does NOT list the cursor-free text verbs (no false affordance)');
      }
    }
  }
} finally {
  proc.kill();
  if (charmap !== null) {
    closeWindow(charmap.hWnd);
    charmap.dispose();
  }
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — inspect_element surfaces the cursor-free text verbs for an own-HWND text control.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
