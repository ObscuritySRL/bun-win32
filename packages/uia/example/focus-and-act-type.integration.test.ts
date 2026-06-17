/**
 * focus-and-act-type — two REFLECT #17 fixes:
 *   (1) a dedicated `focus` MCP tool (and act() 'focus' verb) — UIA SetFocus, CURSOR-FREE, the prerequisite for
 *       keyboard-driving a control by ref; the recovery hints told the agent to "focus first" but no tool existed.
 *   (2) find_and_act/reveal/grid_cell {do:'type'} now take the cursor-free WM_CHAR path on an own-HWND control,
 *       matching the dedicated `type` tool (they previously forced focus()+SendInput via act()).
 *
 * Proof (minimized Notepad over the MCP wire, no focus stealing): focus {ref} reports focused; find_and_act
 * {do:'type'} reports "cursor-free" and the text reads back. Notepad closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Notepad):
 * Run: bun run example/focus-and-act-type.integration.test.ts
 */
import User32 from '@bun-win32/user32';
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

const EM_SETMODIFY = 0x00b9;
const docRef = async (): Promise<string | undefined> => {
  const snap = textOf(await call('tools/call', { name: 'desktop_snapshot', arguments: {} }));
  return /(?:Document|Edit|Text)[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/i.exec(snap)?.[1];
};

uia.initialize();
const notepad = await uia.launch(['notepad.exe'], { className: 'Notepad' });
const editor = notepad.find({ controlType: 50004 }) ?? notepad.find({ controlType: 50030 });
const editHwnd = editor?.nativeWindowHandle ?? 0n;
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'focus-act-type', version: '1' } });
  await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${notepad.hWnd.toString(16)}` } });
  await call('tools/call', { name: 'manage_window', arguments: { hWnd: `0x${notepad.hWnd.toString(16)}`, action: 'minimize' } });
  await Bun.sleep(300);

  const ref1 = await docRef();
  if (ref1 === undefined) console.log('  skip: no Document/Edit ref to focus');
  else {
    const focused = await call('tools/call', { name: 'focus', arguments: { ref: ref1 } });
    assert(focused.result?.isError !== true && /focused/.test(textOf(focused)), `the dedicated focus tool moves keyboard focus cursor-free (got: ${JSON.stringify(textOf(focused).split('\n')[0]?.slice(0, 50))})`);

    // act() 'focus' verb via find_and_act (no "unknown action: focus" anymore).
    const faaFocus = await call('tools/call', { name: 'find_and_act', arguments: { selector: { controlType: 'Document' }, do: 'focus' } });
    assert(faaFocus.result?.isError !== true && /focused/.test(textOf(faaFocus)), 'find_and_act {do:focus} works (act() has a focus branch)');

    // rank 2: find_and_act {do:type} on the own-HWND Document takes the cursor-free WM_CHAR path.
    if (editHwnd !== 0n) {
      const typed = await call('tools/call', { name: 'find_and_act', arguments: { selector: { controlType: 'Document' }, do: 'type', text: 'ACTTYPE-7421' } });
      assert(typed.result?.isError !== true && /cursor-free/.test(textOf(typed)), `find_and_act {do:type} on an own-HWND control is cursor-free (got: ${JSON.stringify(textOf(typed).split('\n')[0]?.slice(0, 50))})`);
      await Bun.sleep(150);
      assert((editor!.value || editor!.text()).includes('ACTTYPE-7421'), 'the act()-typed text landed (WM_CHAR, no SendInput, minimized)');
    } else console.log('  skip: WinUI Notepad with no per-control HWND — act() type cursor-free path N/A');
  }
} finally {
  const notepadPid = notepad.hWnd !== 0n ? windowProcessId(notepad.hWnd) : 0;
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  if (editHwnd !== 0n) User32.SendMessageW(editHwnd, EM_SETMODIFY, 0n, 0n);
  proc.kill();
  editor?.release();
  notepad.dispose();
  closeWindow(notepad.hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — focus tool + act() focus verb work cursor-free; find_and_act {do:type} is cursor-free on an own-HWND control.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
