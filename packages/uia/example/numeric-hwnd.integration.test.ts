/**
 * numeric-hwnd — an hWnd passed as a JSON NUMBER (the form a model overwhelmingly emits for an integer handle)
 * must target that window, not be silently ignored.
 *
 * The window-scoped tools gated on `typeof args.hWnd === 'string'`, so a numeric hWnd fell through: attach threw a
 * misleading "requires one of", and native_tree/manage_window/etc. silently acted on the ATTACHED window with a
 * success message. Now hwndArg() accepts a string OR an integer number (BigInt accepts both) and the schemas
 * declare ['string','number'].
 *
 * Proof (drives the REAL stdio MCP server): attach by a numeric hWnd lands on the SAME window as the hex-string
 * path, and a window-scoped tool (native_tree) honors a numeric hWnd.
 *
 * bun test is broken repo-wide — runnable harness (only the MCP subprocess):
 * Run: bun run example/numeric-hwnd.integration.test.ts
 */
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
const textOf = (message: Rpc): string => message.result?.content?.[0]?.text ?? '';
const isErr = (message: Rpc): boolean => message.result?.isError === true;

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'numeric-hwnd-test', version: '1' } });

  // The taskbar is always present; capture its hWnd from list_windows.
  const list = textOf(await call('tools/call', { name: 'list_windows', arguments: { includePopups: true } }));
  const trayLine = list.split('\n').find((line) => /Shell_TrayWnd/.test(line));
  const hex = trayLine?.match(/hWnd=(0x[0-9a-f]+)/)?.[1];
  assert(hex !== undefined, `found the taskbar hWnd in list_windows (${hex})`);
  const numeric = Number(BigInt(hex!));

  const byNumber = await call('tools/call', { name: 'attach', arguments: { hWnd: numeric } });
  assert(!isErr(byNumber) && /attached to/.test(textOf(byNumber)), `attach by a NUMERIC hWnd (${numeric}) succeeds (not silently ignored)`);
  const numberName = textOf(byNumber).match(/attached to (".*?")/)?.[1];

  const byString = await call('tools/call', { name: 'attach', arguments: { hWnd: hex } });
  const stringName = textOf(byString).match(/attached to (".*?")/)?.[1];
  assert(numberName !== undefined && numberName === stringName, `numeric and hex-string hWnd attach to the SAME window (${numberName})`);

  const tree = await call('tools/call', { name: 'native_tree', arguments: { hWnd: numeric } });
  assert(!isErr(tree) && textOf(tree).length > 0, 'a window-scoped tool (native_tree) honors a numeric hWnd');
} finally {
  proc.kill();
}

console.log(failures === 0 ? '\nPASS — a numeric hWnd targets the right window across attach + window-scoped tools.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
