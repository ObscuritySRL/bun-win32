/**
 * fs-sandbox — the BUN_UIA_FS_ROOT sandbox must not be escapable via a reparse point (junction/symlink).
 *
 * resolveFsPath did a purely LEXICAL resolve()+startsWith check, so a junction created INSIDE the root pointing
 * outside it passed the check and Bun.file/Bun.write then followed the reparse point out — a real read+write escape
 * with only the `fs` policy (a junction can be left by another tool, a package, or a prior allowed write). The fix
 * realpaths the deepest existing ancestor and re-asserts it canonicalizes under the REAL root.
 *
 * Proof: drive the real MCP server (BUN_UIA_FS_ROOT set, fs tools enabled) against a junction that escapes the root.
 * Junctions need no admin on Windows. Cleans up the test tree.
 *
 * bun test is broken repo-wide for FFI; runnable harness (only the MCP subprocess + a temp dir it deletes):
 * Run: bun run example/fs-sandbox.integration.test.ts
 */
import { resolve } from 'node:path';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const base = resolve(import.meta.dir, 'fs-sandbox-test');
const root = resolve(base, 'root');
const outside = resolve(base, 'outside');
await Bun.$`rm -rf ${base}`.quiet().nothrow();
await Bun.$`mkdir -p ${root} ${outside}`.quiet();
await Bun.write(resolve(outside, 'SECRET.txt'), 'TOP-SECRET-EXFIL');
await Bun.write(resolve(root, 'legit.txt'), 'ok');
const junction = resolve(root, 'esc');
await Bun.$`cmd /c mklink /J ${junction} ${outside}`.quiet().nothrow();

type Rpc = { id?: number; result?: { isError?: boolean; content?: { text?: string }[] } };
const proc = Bun.spawn(['bun', 'run', `${import.meta.dir}/../mcp.ts`], {
  stdin: 'pipe',
  stdout: 'pipe',
  stderr: 'ignore',
  env: { ...process.env, BUN_UIA_PROFILE: 'safe', BUN_UIA_OS: '1', BUN_UIA_FS_ROOT: root },
});
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
function call(id: number, method: string, params: object): Promise<Rpc> {
  proc.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  proc.stdin.flush();
  return new Promise((resolveCall) => pending.set(id, resolveCall));
}
const isErr = (message: Rpc): boolean => message.result?.isError === true;
const textOf = (message: Rpc): string => message.result?.content?.[0]?.text ?? '';
try {
  await call(1, 'initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '0' } });

  const readEsc = await call(2, 'tools/call', { name: 'read_file', arguments: { path: 'esc/SECRET.txt' } });
  assert(isErr(readEsc) && !textOf(readEsc).includes('TOP-SECRET-EXFIL'), 'read_file through a junction is BLOCKED (no out-of-root exfil)');

  const writeEsc = await call(3, 'tools/call', { name: 'write_file', arguments: { path: 'esc/pwned.txt', content: 'x' } });
  const pwnedExists = await Bun.file(resolve(outside, 'pwned.txt')).exists();
  assert(isErr(writeEsc) && !pwnedExists, 'write_file through a junction is BLOCKED (no out-of-root write)');

  const readLegit = await call(4, 'tools/call', { name: 'read_file', arguments: { path: 'legit.txt' } });
  assert(!isErr(readLegit) && textOf(readLegit).includes('ok'), 'read_file of an in-root file still works');

  const writeNew = await call(5, 'tools/call', { name: 'write_file', arguments: { path: 'sub/new.txt', content: 'hi' } });
  const newExists = await Bun.file(resolve(root, 'sub', 'new.txt')).exists();
  assert(!isErr(writeNew) && newExists, 'write_file of a new (not-yet-existing) in-root file still works');

  const traversal = await call(6, 'tools/call', { name: 'read_file', arguments: { path: '../outside/SECRET.txt' } });
  assert(isErr(traversal), 'read_file with ../ traversal is BLOCKED');

  // Case-insensitive root compare (Windows): a LOWERCASED absolute in-root path must READ (not over-block), while a
  // lowercased ../ escape must still BLOCK (the relax cannot introduce an under-block).
  const lowerAbs = resolve(root, 'legit.txt').toLowerCase();
  const caseRead = await call(7, 'tools/call', { name: 'read_file', arguments: { path: lowerAbs } });
  assert(!isErr(caseRead) && textOf(caseRead).includes('ok'), 'a lowercased absolute in-root path READS (case-insensitive root, no over-block)');
  const caseEscape = await call(8, 'tools/call', { name: 'read_file', arguments: { path: resolve(outside, 'SECRET.txt').toLowerCase() } });
  assert(isErr(caseEscape) && !textOf(caseEscape).includes('TOP-SECRET-EXFIL'), 'a lowercased OUT-of-root absolute path is still BLOCKED (no under-block)');
} finally {
  proc.kill();
  await Bun.$`cmd /c rmdir ${junction}`.quiet().nothrow();
  await Bun.$`rm -rf ${base}`.quiet().nothrow();
}

console.log(failures === 0 ? '\nPASS — the FS sandbox resists reparse-point escape and ../ traversal while allowing in-root I/O.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
