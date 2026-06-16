/**
 * attach-failure-keeps-attachment — the attach handler disposed + nulled the working attachment BEFORE calling the
 * fallible attach helpers (attachByTitle / uia.attach — each throws on not-found/ambiguous), so a failed/typo re-attach wiped the
 * good attachment and the very next desktop_snapshot/ref-action errored with "no window attached" — breaking the core
 * attach→snapshot→act loop on a trivially-recoverable user error. attach now resolves the NEW window into a local first
 * and disposes+swaps only on success (mirrors launch_app), so a failed re-attach surfaces its error while the existing
 * attachment keeps working.
 *
 * Proof (synthetic, deterministic): attach window A; a re-attach to a non-existent title ERRORS; a desktop_snapshot
 * immediately after still shows window A (the attachment survived) — never "no window attached". Window destroyed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a synthetic window):
 * Run: bun run example/attach-failure-keeps-attachment.integration.test.ts
 */
import Kernel32 from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';

const WS_OVERLAPPEDWINDOW = 0x00cf_0000;
const WS_VISIBLE = 0x1000_0000;
const WS_CHILD = 0x4000_0000;
const PM_REMOVE = 0x0001;
const TITLE = 'uia-attach-keep-3194';
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
const parent = User32.CreateWindowExW(0, wide('#32770').ptr!, wide(TITLE).ptr!, WS_OVERLAPPEDWINDOW | WS_VISIBLE, 180, 180, 300, 140, 0n, 0n, BigInt(hInstance), null);
if (parent !== 0n) User32.CreateWindowExW(0, wide('Button').ptr!, wide('Keeper').ptr!, WS_CHILD | WS_VISIBLE, 10, 10, 160, 32, parent, 0n, BigInt(hInstance), null);
pump();
const ticker = setInterval(pump, 5);

try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'attach-keep', version: '1' } });
  if (parent === 0n) console.log('  skip: could not create the synthetic window');
  else {
    const ok = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${parent.toString(16)}` } }));
    assert(ok.includes(TITLE), 'attached to window A');

    const bad = await call('tools/call', { name: 'attach', arguments: { title: 'zzz-no-such-window-zzz-9999' } });
    assert(bad.result?.isError === true, 'a re-attach to a non-existent title ERRORS');

    const after = await call('tools/call', { name: 'desktop_snapshot', arguments: {} });
    assert(after.result?.isError !== true && textOf(after).includes(TITLE) && !/no window attached/.test(textOf(after)), `the working attachment SURVIVED the failed re-attach (got: ${JSON.stringify(textOf(after).split('\n')[0] ?? '')})`);
  }
} finally {
  clearInterval(ticker);
  proc.kill();
  if (parent !== 0n) User32.DestroyWindow(parent);
}

console.log(failures === 0 ? '\nPASS — a failed/ambiguous re-attach preserves the working attachment.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
