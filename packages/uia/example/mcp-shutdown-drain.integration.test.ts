/**
 * mcp-shutdown-drain — the MCP server must DRAIN the in-flight async dispatch chain before exiting on stdin-close.
 *
 * main() ran its dispose/uninitialize/process.exit(0) teardown on stdin EOF without awaiting `pending` (the
 * serialized async dispatch chain), so a host's graceful stdin-close could kill an async handler mid-await — most
 * destructively write_file, whose Bun.write had truncated the target to 0 bytes but not yet written the content,
 * leaving an EMPTY file (and a dropped reply). The fix awaits `pending` before teardown.
 *
 * Proof: send a write_file, close stdin IMMEDIATELY (before the reply), wait for the process to exit, and assert the
 * target file has the FULL content — not zero-truncated.
 *
 * bun test is broken repo-wide — runnable harness (only the MCP subprocess + a temp dir it deletes):
 * Run: bun run example/mcp-shutdown-drain.integration.test.ts
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

const root = resolve(import.meta.dir, '..', '.scratch', 'mcp-drain-test');
await Bun.$`rm -rf ${root}`.quiet().nothrow();
await Bun.$`mkdir -p ${root}`.quiet();
const content = 'this content must survive a stdin-close shutdown — '.repeat(40); // ~2KB, non-empty

const proc = Bun.spawn(['bun', 'run', `${import.meta.dir}/../mcp.ts`], { stdin: 'pipe', stdout: 'pipe', stderr: 'ignore', env: { ...Bun.env, BUN_UIA_PROFILE: 'safe', BUN_UIA_OS: '1', BUN_UIA_FS_ROOT: root } });
try {
  proc.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'drain-test', version: '1' } } })}\n`);
  proc.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'write_file', arguments: { path: 'out.txt', content } } })}\n`);
  proc.stdin.flush();
  // Close stdin right away — the write_file is in-flight; a non-draining teardown would kill it mid-write.
  proc.stdin.end();
  await proc.exited;

  const target = Bun.file(resolve(root, 'out.txt'));
  const exists = await target.exists();
  assert(exists, 'the target file exists after the stdin-close shutdown');
  if (exists) {
    const written = await target.text();
    assert(written === content, `the file holds the FULL content (${written.length}/${content.length} bytes) — not zero-truncated by a killed mid-write`);
  }
} finally {
  proc.kill();
  await Bun.$`rm -rf ${root}`.quiet().nothrow();
}

console.log(failures === 0 ? '\nPASS — the MCP server drains in-flight writes before exiting on stdin-close (no zero-truncation).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
