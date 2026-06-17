/**
 * accelerator-key — inspect_element now surfaces a control's AcceleratorKey ("Ctrl+S") and AccessKey ("Alt, F")
 * (UIA properties 30006/30007, read via the existing scalar getProperty — no new FFI). This closes a FlaUI/
 * Inspect.exe parity gap: an LLM can press the chord directly (press_key {key:"Control+S"}) instead of the
 * expand-menu → find → invoke dance.
 *
 * Proof: drive the real MCP wire — attach Notepad, expand its File menu, inspect a menu item, and assert the
 * inspect_element text carries an `acceleratorKey:` line that looks like a chord. Notepad closed in finally (no
 * document edits, so no save prompt). SKIPS cleanly if the menu/accelerators aren't exposed.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + spawned Notepad):
 * Run: bun run example/accelerator-key.integration.test.ts
 */
import { closeWindow, uia, windowProcessId } from '@bun-win32/uia';

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
const notepad = await uia.launch(['notepad.exe'], { title: 'Untitled - Notepad' }, 6000).catch(() => uia.launch(['notepad.exe'], { className: 'Notepad' }, 6000).catch(() => null));
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'accel', version: '1' } });
  if (notepad === null) {
    console.log('  skip(live): Notepad did not launch');
  } else {
    await Bun.sleep(900);
    await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${notepad.hWnd.toString(16)}` } });
    // expand the File menu so its items (with accelerators) are in the tree
    const expanded = textOf(await call('tools/call', { name: 'find_and_act', arguments: { selector: { name: 'File', controlType: 'MenuItem' }, do: 'expand' } }));
    await Bun.sleep(500);
    const snap = textOf(await call('tools/call', { name: 'desktop_snapshot', arguments: {} }));
    // a menu item that carries an accelerator (Save = Ctrl+S); fall back to any MenuItem ref
    const ref = /MenuItem "Save[^"]*" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1] ?? /MenuItem "[^"]*" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
    if (ref === undefined) {
      console.log(`  skip(live): no MenuItem ref after expanding File (expand said: ${JSON.stringify(expanded.slice(0, 60))})`);
    } else {
      const out = textOf(await call('tools/call', { name: 'inspect_element', arguments: { ref } }));
      const accel = out.split('\n').find((l) => l.startsWith('acceleratorKey:') || l.startsWith('accessKey:'));
      console.log(`  inspect ref=${ref}: ${JSON.stringify(accel ?? '(no accelerator line — menu item may not expose one)')}`);
      assert(/^acceleratorKey: \S/m.test(out), `inspect_element surfaces acceleratorKey for a menu item (got: ${JSON.stringify(accel ?? out.split('\n').slice(0, 3))})`);
    }
  }
} finally {
  if (notepad !== null) {
    const notepadPid = windowProcessId(notepad.hWnd);
    if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  }
  proc.kill();
  if (notepad !== null) {
    closeWindow(notepad.hWnd);
    notepad.dispose();
  }
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — inspect_element surfaces AcceleratorKey/AccessKey.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
