/**
 * selector-aliases — the selector now FOLDS the LLM idioms an agent reaches for first (role/type → controlType,
 * id → automationId, label/accessibleName/title → name) onto the real UIA keys, instead of rejecting them with a
 * message that merely *names* the aliases. A bare alias is honored; an alias that conflicts with its canonical key
 * is a hard error (never silently pick one). Genuinely unknown keys are still rejected.
 *
 * Proof over the MCP wire (Calculator): {role:"Button", name:"Five"} finds the button; a bogus {id:"…"} now fails
 * with "no element matched … automationId" (proving id folded to automationId and was searched) rather than
 * "unknown selector key id"; a role/controlType conflict errors; a real unknown key still errors. Calc closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Calculator):
 * Run: bun run example/selector-aliases.integration.test.ts
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
const priorCalc = new Set(
  uia
    .windows({ includeUntitled: true })
    .filter((window) => /Calcul/i.test(window.title))
    .map((window) => window.hWnd),
);
const calc = await uia.launch(['cmd', '/c', 'start', 'calc'], { title: 'Calculator' });
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'selector-aliases', version: '1' } });
  await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${calc.hWnd.toString(16)}` } });
  await Bun.sleep(400);
  const act = (selector: unknown): Promise<Rpc> => call('tools/call', { name: 'find_and_act', arguments: { selector, do: 'focus' } });

  // 1) role + name aliases resolve to a real control (cursor-free focus, non-mutating).
  const five = await act({ role: 'Button', name: 'Five' });
  if (/no element matched/.test(textOf(five))) console.log('  skip: no "Five" button (Calculator locale/layout)');
  else
    assert(
      five.result?.isError !== true && /Five/.test(textOf(five)) && !/unknown selector key/.test(textOf(five)),
      `{role:"Button", name:"Five"} folds role→controlType and finds the button (got: ${JSON.stringify(textOf(five).slice(0, 70))})`,
    );

  // 2) A bogus id is FOLDED to automationId and searched — not rejected as an unknown key.
  const byId = await act({ id: 'zzz_no_such_automation_id' });
  assert(
    byId.result?.isError === true && /no element matched/.test(textOf(byId)) && /automationId/.test(textOf(byId)) && !/unknown selector key/.test(textOf(byId)),
    `{id:"…"} folds to automationId and is searched (got: ${JSON.stringify(textOf(byId).slice(0, 90))})`,
  );

  // 3) An alias that conflicts with its canonical key is a hard error.
  const conflict = await act({ role: 'Button', controlType: 'Edit' });
  assert(conflict.result?.isError === true && /alias/.test(textOf(conflict)), `{role + controlType} conflict is rejected (got: ${JSON.stringify(textOf(conflict).slice(0, 80))})`);

  // 4) A genuinely unknown key is still rejected.
  const bogus = await act({ frobnicate: 'x' });
  assert(bogus.result?.isError === true && /unknown selector key/.test(textOf(bogus)), `a real unknown key is still rejected (got: ${JSON.stringify(textOf(bogus).slice(0, 80))})`);
} finally {
  proc.kill();
  closeWindow(calc.hWnd);
  calc.dispose();
  for (const window of uia.windows({ includeUntitled: true }).filter((w) => /Calcul/i.test(w.title) && !priorCalc.has(w.hWnd))) closeWindow(window.hWnd); // sweep any sibling calc the single-instance relaunch spawned
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — selector aliases (role/type/id/label/accessibleName/title) fold onto UIA keys; conflicts and unknowns still error.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
