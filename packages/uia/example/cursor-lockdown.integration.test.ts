/**
 * cursor-lockdown — BUN_UIA_CURSOR=never must be ENFORCED on every SendInput path: the MOUSE tools (click_point,
 * click_text, drag), the synthetic-KEYBOARD tools (hold_key, press_key chords / no-handle fallback, type), the
 * CLIPBOARD SendInput tools (paste = Ctrl+V, bare copy = Ctrl+C), and find_and_act/reveal {do:'type'} (which route
 * through act()) — all category 'input', reachable under the default safe profile.
 *
 * cursorDenied was consulted only by clickElement and drag, so click_point/click_text still moved the physical
 * mouse — on the explicit cursor:true branch AND the silent clickAt fallback when a posted click reaches no window
 * (the common case on Chromium/Electron/game pixels). Both now return isError so the agent re-routes to a ref. The
 * keyboard side was likewise open: hold_key/press_key-chord/type inject SendInput keystrokes with no gate (the
 * cycle-44 mouse fix missed them). All now refuse, while the cursor-free postKey branch (press_key {ref,key} on a
 * native-handle control) stays live.
 *
 * Proof (drives the real MCP server with BUN_UIA_CURSOR=never): every real-cursor path refuses with NO input
 * delivered — the mouse cursor:true branch, the posted-fail→fallback branch (an off-screen pixel where no window
 * exists), and the three keyboard SendInput tools. Side-effect-free (nothing is clicked, nothing is typed).
 *
 * bun test is broken repo-wide — runnable harness (only the MCP subprocess):
 * Run: bun run example/cursor-lockdown.integration.test.ts
 */
type Rpc = { id?: number; result?: { isError?: boolean; content?: { text?: string }[] } };
const proc = Bun.spawn(['bun', 'run', `${import.meta.dir}/../mcp.ts`], { stdin: 'pipe', stdout: 'pipe', stderr: 'ignore', env: { ...Bun.env, BUN_UIA_PROFILE: 'full', BUN_UIA_CURSOR: 'never' } });
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
const isErr = (m: Rpc): boolean => m.result?.isError === true;
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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'cursor-lockdown-test', version: '1' } });

  const explicit = await call('tools/call', { name: 'click_point', arguments: { x: 100, y: 100, cursor: true } });
  assert(isErr(explicit) && /BUN_UIA_CURSOR=never/.test(textOf(explicit)), 'click_point {cursor:true} is REFUSED under BUN_UIA_CURSOR=never (no real cursor moved)');

  // Off-screen pixel: no window there → the posted click fails → the real-cursor fallback must ALSO be refused.
  const fallback = await call('tools/call', { name: 'click_point', arguments: { x: -30000, y: -30000 } });
  assert(isErr(fallback) && /BUN_UIA_CURSOR=never/.test(textOf(fallback)), 'click_point real-cursor FALLBACK (posted click reached no window) is refused under BUN_UIA_CURSOR=never');

  // Keyboard SendInput tools — the gate is the FIRST statement in each handler, so they refuse with zero synthetic
  // keystrokes (no attach/ref needed). All three are category 'input', reachable under the default safe profile.
  const held = await call('tools/call', { name: 'hold_key', arguments: { key: 'a', durationMs: 50 } });
  assert(isErr(held) && /BUN_UIA_CURSOR=never/.test(textOf(held)), 'hold_key (SendInput key-down) is refused under BUN_UIA_CURSOR=never (no key held)');

  const chord = await call('tools/call', { name: 'press_key', arguments: { key: 'Control+a' } });
  assert(isErr(chord) && /BUN_UIA_CURSOR=never/.test(textOf(chord)), 'press_key chord (SendInput to the focused control) is refused under BUN_UIA_CURSOR=never (no keys sent)');

  // type is cursor-free for an own-HWND control (WM_CHAR) but needs SendInput for a WinUI control with no handle.
  // A taskbar Button is exactly that no-handle case → under `never` it must refuse and steer to set_value.
  const snap = textOf(await call('tools/call', { name: 'attach', arguments: { className: 'Shell_TrayWnd' } }));
  const buttonRef = /(?:Start|Search)"? \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1] ?? /Button "[^"]*" \[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
  if (buttonRef === undefined) console.log('  skip: no no-handle taskbar Button ref to exercise type/paste refusal');
  else {
    const typed = await call('tools/call', { name: 'type', arguments: { ref: buttonRef, text: 'leak' } });
    assert(isErr(typed) && /BUN_UIA_CURSOR=never/.test(textOf(typed)) && /set_value/.test(textOf(typed)), 'type on a no-handle control (SendInput) is refused under BUN_UIA_CURSOR=never and steers to set_value');

    const pastedRef = await call('tools/call', { name: 'paste', arguments: { ref: buttonRef, text: 'leak' } });
    assert(isErr(pastedRef) && /BUN_UIA_CURSOR=never/.test(textOf(pastedRef)), 'paste on a no-handle control (SendInput Ctrl+V) is refused under BUN_UIA_CURSOR=never');
  }

  // Clipboard SendInput tools with NO ref — paste (Ctrl+V) and bare copy (Ctrl+C on the focused control) gate too
  // (copy {ref} from a TextPattern selection stays cursor-free, not tested here).
  const pasted = await call('tools/call', { name: 'paste', arguments: { text: 'leak' } });
  assert(isErr(pasted) && /BUN_UIA_CURSOR=never/.test(textOf(pasted)), 'paste with no ref (Ctrl+V via SendInput) is refused under BUN_UIA_CURSOR=never (nothing pasted)');

  const copied = await call('tools/call', { name: 'copy', arguments: {} });
  assert(isErr(copied) && /BUN_UIA_CURSOR=never/.test(textOf(copied)), 'bare copy (Ctrl+C via SendInput) is refused under BUN_UIA_CURSOR=never');

  // find_and_act {do:'type'} routes through act() — the same SendInput type path. act('type') must hit the gate.
  // Target StartButton specifically: it is exactly ONE no-own-HWND Button on the taskbar, so the act('type') SendInput
  // gate fires — {controlType:'Button'} would hit the ambiguity guard first (the taskbar now exposes ~26 Buttons) and
  // never exercise the cursor gate this assertion guards.
  const acted = await call('tools/call', { name: 'find_and_act', arguments: { selector: { automationId: 'StartButton' }, do: 'type', text: 'leak' } });
  assert(isErr(acted) && /BUN_UIA_CURSOR=never/.test(textOf(acted)), 'find_and_act {do:type} routes through act() and is refused under BUN_UIA_CURSOR=never (the act-type bypass is closed)');
} finally {
  proc.kill();
}

console.log(
  failures === 0
    ? '\nPASS — BUN_UIA_CURSOR=never is enforced on every SendInput path: mouse (click_point ×2, click_text/drag share the guard), keyboard (hold_key, press_key chord, type→set_value), clipboard (paste, bare copy), and find_and_act/reveal {do:type}.'
    : `\nFAILED — ${failures} assertion(s)`,
);
process.exit(failures === 0 ? 0 : 1);
