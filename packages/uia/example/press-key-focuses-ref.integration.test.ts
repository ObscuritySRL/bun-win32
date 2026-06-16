/**
 * press-key-focuses-ref — press_key with a ref AND a chord used to IGNORE the ref entirely: the synthetic chord went
 * to whatever already held focus, so "select-all in THIS field" silently acted on some other control. press_key now
 * focuses the ref first (cursor-free UIA SetFocus) before the SendInput chord — mirroring type/paste/cut, which always
 * act on the ref. (The same focus-first step was also added to the no-own-HWND single-key fallback.)
 *
 * Deterministic proof (no foreground needed): a BOGUS ref with a chord must now be REJECTED — pre-fix the chord path
 * ignored the ref entirely and returned a phantom success. A VALID ref reports "focused <name> then pressed", proving
 * the ref is honored. A best-effort differential (focus Six → press_key {ref: Five} → focus moves to Five) runs only
 * when the desktop grants focus. Calc closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Calculator):
 * Run: bun run example/press-key-focuses-ref.integration.test.ts
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
const priorCalc = new Set(uia.windows({ includeUntitled: true }).filter((window) => /Calcul/i.test(window.title)).map((window) => window.hWnd));
const calc = await uia.launch(['cmd', '/c', 'start', 'calc'], { title: 'Calculator' });
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'press-key-focus', version: '1' } });
  const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${calc.hWnd.toString(16)}` } }));
  await Bun.sleep(400);
  const refOf = (name: string, tree: string): string | undefined => new RegExp(`Button "${name}" \\[ref=(e\\d+(?:#\\d+)?)\\]`).exec(tree)?.[1];
  const fresh = textOf(await call('tools/call', { name: 'desktop_snapshot', arguments: {} }));
  const five = refOf('Five', fresh) ?? refOf('Five', snap);
  const six = refOf('Six', fresh) ?? refOf('Six', snap);
  const focusedName = async (): Promise<string> => /"([^"]*)"/.exec(textOf(await call('tools/call', { name: 'get_focused', arguments: {} })))?.[1] ?? '';
  if (five === undefined || six === undefined) console.log('  skip: no Five/Six button refs (Calculator locale/layout)');
  else {
    // 1) A bogus ref + chord must be REJECTED — pre-fix the chord path ignored the ref and returned a phantom success.
    const bogus = five.replace(/^e\d+/, 'e999999');
    const bad = await call('tools/call', { name: 'press_key', arguments: { ref: bogus, key: 'Control+A' } });
    assert(bad.result?.isError === true, `a bogus ref + chord is REJECTED, not silently ignored (got: ${JSON.stringify(textOf(bad).slice(0, 80))})`);

    // 2) A valid ref + chord resolves the ref and reports focusing it first (cursor-free SetFocus before SendInput).
    const press = await call('tools/call', { name: 'press_key', arguments: { ref: five, key: 'Control+A' } });
    assert(press.result?.isError !== true && /focused .*Five.* then pressed/i.test(textOf(press)), `press_key {ref,chord} resolves the ref and focuses it first (got: ${JSON.stringify(textOf(press).slice(0, 80))})`);

    // 3) Best-effort differential when the desktop grants focus: seed Six, press chord at Five, focus must move to Five.
    await call('tools/call', { name: 'focus', arguments: { ref: six } });
    await Bun.sleep(150);
    if ((await focusedName()) !== 'Six') console.log("  (skip differential: desktop wouldn't grant foreground focus — the bogus-ref + response-text proofs above stand)");
    else {
      await call('tools/call', { name: 'press_key', arguments: { ref: five, key: 'Control+A' } });
      await Bun.sleep(150);
      const after = await focusedName();
      assert(after === 'Five', `focus moved to the ref (Five) after the chord — was Six, now ${JSON.stringify(after)} (pre-fix focus stayed on Six)`);
    }
  }
} finally {
  proc.kill();
  closeWindow(calc.hWnd);
  calc.dispose();
  for (const window of uia.windows({ includeUntitled: true }).filter((w) => /Calcul/i.test(w.title) && !priorCalc.has(w.hWnd))) closeWindow(window.hWnd); // sweep any sibling calc the single-instance relaunch spawned
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — press_key with a ref focuses that control before the synthetic chord (no more silent wrong-target).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
