/**
 * press-key-password-no-leak — press_key {ref, control+c / control+x} refused a password field to the clipboard ONLY on
 * the own-HWND cursor-free path: the isPassword gate was nested inside `if (handle !== 0n)`, so a no-own-HWND password
 * input (WinUI/WPF/Electron, handle===0n) skipped it and fell through to the SendInput chord fallback, which copied the
 * secret as cleartext that read_clipboard then returned (REFLECT #40 rank2, SECURITY). The refusal is now lifted ABOVE
 * the handle guard, so it fires for any password field regardless of native handle.
 *
 * Proof (live, gate-guard): a synthetic ES_PASSWORD Edit holding a known secret — press_key {ref, control+c} returns the
 * refusal and the clipboard never receives the secret. NOTE: a classic Edit is own-HWND and Windows itself blocks copy
 * from an ES_PASSWORD edit, so this asserts the GATE (refusal + no-leak), not the no-own-HWND leak directly — that path
 * is unsynthesizable here (needs a real WinUI/Electron password box) and is covered by the structural lift (the gate now
 * runs before the handle branch). Window destroyed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a synthetic ES_PASSWORD window):
 * Run: bun run example/press-key-password-no-leak.integration.test.ts
 */
import Kernel32 from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';

const WS_OVERLAPPEDWINDOW = 0x00cf_0000;
const WS_VISIBLE = 0x1000_0000;
const WS_CHILD = 0x4000_0000;
const ES_PASSWORD = 0x0020;
const ES_AUTOHSCROLL = 0x0080;
const PM_REMOVE = 0x0001;
const SECRET = 'S3cret-uia-pw-9931';
const wide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');
const pumpMsg = Buffer.alloc(48);
const pump = (): void => {
  for (let i = 0; i < 200; i += 1) {
    if (User32.PeekMessageW(pumpMsg.ptr!, 0n, 0, 0, PM_REMOVE) === 0) break;
    User32.TranslateMessage(pumpMsg.ptr!);
    User32.DispatchMessageW(pumpMsg.ptr!);
  }
};

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

const hInstance = Kernel32.GetModuleHandleW(null);
const parent = User32.CreateWindowExW(0, wide('#32770').ptr!, wide('uia-pw-leak-test').ptr!, WS_OVERLAPPEDWINDOW | WS_VISIBLE, 200, 200, 320, 160, 0n, 0n, BigInt(hInstance), null);
if (parent !== 0n) User32.CreateWindowExW(0, wide('Edit').ptr!, wide(SECRET).ptr!, WS_CHILD | WS_VISIBLE | ES_PASSWORD | ES_AUTOHSCROLL, 12, 12, 280, 28, parent, 0n, BigInt(hInstance), null);
pump();
const ticker = setInterval(pump, 5);

try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'pw-leak', version: '1' } });
  if (parent === 0n) {
    console.log('  skip: could not create the synthetic window');
  } else {
    Bun.spawnSync(['cmd', '/c', 'echo CLIP-SENTINEL-7777|clip']); // known clipboard baseline
    const tree = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${parent.toString(16)}` } })); // attach returns the initial tree
    const edit = /edit\s*\[ref=(e\d+(?:#\d+)?)\]/i.exec(tree) ?? /\[ref=(e\d+(?:#\d+)?)\][^\n]*\(password\)/i.exec(tree);
    if (edit === null) {
      console.log(`  skip: no Edit ref in the snapshot (got: ${JSON.stringify(tree.split('\n').slice(0, 6))})`);
    } else {
      const ref = edit[1];
      const copy = await call('tools/call', { name: 'press_key', arguments: { ref, key: 'control+c' } });
      const copyText = textOf(copy);
      assert(copy.result?.isError === true && /refus|password/i.test(copyText), `press_key control+c on a password field is REFUSED (${JSON.stringify(copyText.split('\n')[0] ?? '')})`);

      const cut = await call('tools/call', { name: 'press_key', arguments: { ref, key: 'control+x' } });
      assert(cut.result?.isError === true && /refus|password/i.test(textOf(cut)), 'press_key control+x on a password field is REFUSED');

      const clip = textOf(await call('tools/call', { name: 'read_clipboard', arguments: {} }));
      assert(!clip.includes(SECRET), 'the clipboard never received the password secret');
    }
  }
} finally {
  clearInterval(ticker);
  proc.kill();
  if (parent !== 0n) User32.DestroyWindow(parent);
}

console.log(failures === 0 ? '\nPASS — press_key copy/cut of a password field is refused regardless of native handle; the secret never reaches the clipboard.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
