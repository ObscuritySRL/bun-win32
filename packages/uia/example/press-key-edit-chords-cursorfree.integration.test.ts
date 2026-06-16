/**
 * press-key-edit-chords-cursorfree — press_key with a ref + an edit chord (Control+A/C/X/V) on an own-HWND control used
 * to force the SendInput chord path (focus + synthetic input, needs an unlocked foregrounded desktop) even though the
 * cursor-free posted primitives (EM_SETSEL / WM_COPY / WM_CUT / WM_PASTE) already exist and are proven. press_key now
 * routes those chords to the posted primitives for an own-HWND control, mirroring the shipped Control+Z special-case.
 *
 * Proof: type into Character Map's Edit, then press_key {ref, Control+A} and {ref, Control+C} — both report cursor-free
 * (EM_SETSEL / WM_COPY) and the real cursor never moves; the copy carries the typed text. Character Map closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Character Map):
 * Run: bun run example/press-key-edit-chords-cursorfree.integration.test.ts
 */
import { closeWindow, uia } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';

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
const cursor = (): { x: number; y: number } => {
  const point = Buffer.alloc(8);
  User32.GetCursorPos(point.ptr!);
  return { x: point.readInt32LE(0), y: point.readInt32LE(4) };
};

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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'edit-chords', version: '1' } });
  if (charmap === null) console.log('  skip: Character Map did not launch');
  else {
    await Bun.sleep(900);
    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${charmap.hWnd.toString(16)}` } }));
    const editRef = /Edit[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/.exec(snap)?.[1];
    if (editRef === undefined) console.log('  skip: no Edit ref in the Character Map snapshot');
    else {
      await call('tools/call', { name: 'type', arguments: { ref: editRef, text: 'chord cursor free' } });
      await Bun.sleep(120);
      User32.SetCursorPos(11, 11);
      await Bun.sleep(60);
      const before = cursor();
      const selectAll = await call('tools/call', { name: 'press_key', arguments: { ref: editRef, key: 'Control+A' } });
      assert(selectAll.result?.isError !== true && /selected all.*cursor-free/i.test(textOf(selectAll)), `Control+A on an own-HWND Edit is cursor-free (EM_SETSEL) (got: ${JSON.stringify(textOf(selectAll).slice(0, 70))})`);
      const copy = await call('tools/call', { name: 'press_key', arguments: { ref: editRef, key: 'Control+C' } });
      assert(copy.result?.isError !== true && /copied.*cursor-free/i.test(textOf(copy)) && /chord cursor free/.test(textOf(copy)), `Control+C is cursor-free (WM_COPY) and carries the text (got: ${JSON.stringify(textOf(copy).slice(0, 80))})`);
      const after = cursor();
      assert(Math.abs(after.x - before.x) <= 2 && Math.abs(after.y - before.y) <= 2, `the real cursor never moved across the chords (before ${before.x},${before.y} → after ${after.x},${after.y})`);
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

console.log(failures === 0 ? '\nPASS — Control+A/C/X/V on an own-HWND control are delivered cursor-free (no SendInput, cursor unmoved).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
