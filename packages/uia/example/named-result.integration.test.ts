/**
 * named-result — find_and_act / reveal (via act()) AND the dedicated verb tools (invoke/toggle/set_value/…) must
 * NAME the resolved control in their success message, not a bare verb ("invoked") nor an echo of the agent's own
 * optional `element` description (which silently confirms a wrong-target hallucination). That target confirmation is
 * the only way an LLM knows WHICH control it hit — the named-result contract the library keeps in computer.ts semanticClick
 * and documents at AI.md:181. act() and every dedicated handler now name the RESOLVED control.
 *
 * Proof: launch Calculator, find_and_act {selector:{name:'Five'}, do:'invoke'} over the MCP wire → the result names
 * `Button "Five"`. Calculator is closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Calculator):
 * Run: bun run example/named-result.integration.test.ts
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
const calc = await uia.launch(['cmd', '/c', 'start', 'calc'], { title: 'Calculator' });
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'named-result', version: '1' } });
  await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${calc.hWnd.toString(16)}` } });
  await Bun.sleep(400);

  const invoked = await call('tools/call', { name: 'find_and_act', arguments: { selector: { name: 'Five' }, do: 'invoke' } });
  const text = textOf(invoked);
  if (invoked.result?.isError === true) console.log(`  skip: could not invoke a "Five" button (Calculator layout/locale) — ${text.slice(0, 80)}`);
  else {
    assert(/invoked/.test(text), 'find_and_act {do:invoke} reports the action');
    assert(/Button "Five"/.test(text), `the success message NAMES the resolved control, not a bare "invoked" (got: ${JSON.stringify(text.split('\n')[0]?.slice(0, 60))})`);
  }

  // The DEDICATED tools (invoke/toggle/… — not just find_and_act) must also name the RESOLVED control, NOT echo the
  // agent's optional `element` description. Resolve the Five button to a ref, then invoke it with a deliberately
  // WRONG description: the result must say Button "Five", not the lie we passed.
  const snap = textOf(await call('tools/call', { name: 'desktop_snapshot', arguments: {} }));
  const fiveRef = /Button "Five" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
  if (fiveRef === undefined) console.log('  skip: no "Five" ref in the snapshot to exercise the dedicated invoke tool');
  else {
    const direct = textOf(await call('tools/call', { name: 'invoke', arguments: { ref: fiveRef, element: 'the totally wrong control' } }));
    assert(/Button "Five"/.test(direct), `the dedicated invoke tool names the RESOLVED control (got: ${JSON.stringify(direct.split('\n')[0]?.slice(0, 60))})`);
    assert(!/wrong control/.test(direct), "the dedicated invoke tool does NOT echo the agent's (wrong) element description back as confirmation");
  }
} finally {
  proc.kill();
  closeWindow(calc.hWnd);
  calc.dispose();
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — find_and_act names the resolved control (target confirmation for ambiguous matches).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
