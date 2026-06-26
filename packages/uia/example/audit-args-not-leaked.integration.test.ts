/**
 * audit-args-not-leaked — a credential carried in a COMMAND-LINE ARRAY arg must not land verbatim in either forensic sink.
 * maskArgs originally masked only string values under content/text/value keys; an ARRAY value (run_program.args,
 * copy_files.paths) fell through unmasked, so a secret in `args` (--password=…, -psecret, Authorization: Bearer …) — the
 * canonical home of credentials — was written in clear to BOTH the stderr [bun-uia-audit] line AND the BUN_UIA_TRACE
 * JSONL the deployer treats as trusted forensic output. The fix collapses any array arg to its element count (<N args>),
 * preserving forensic signal (HOW MANY args/paths) without the values.
 *
 * Proof (live, over the REAL stdio server under BUN_UIA_PROFILE=full + BUN_UIA_TRACE): run_program actually runs
 * cmd.exe with a secret in args (echo to a child process, exits on its own — nothing to clean up) and copy_files puts a
 * secret-bearing path on the clipboard. Asserts neither secret string appears in the audit line OR the trace JSONL, while
 * the element count is recorded so the journal still says HOW MANY args/paths the step carried.
 *
 * bun test is broken repo-wide — runnable harness:
 * Run: bun run example/audit-args-not-leaked.integration.test.ts
 */
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ARGS_SECRET = '--password=SUPERSECRET123'; // a credential in run_program.args
const PATH_SECRET = 'C:\\creds\\TOKENLEAK-9f2a.txt'; // a secret-bearing path in copy_files.paths
const tracePath = join(tmpdir(), `bun-uia-argmask-${process.pid}-${Date.now()}.jsonl`);
await rm(tracePath, { force: true });

let auditText = '';
const server = Bun.spawn(['bun', `${import.meta.dir}/../mcp.ts`], {
  stdin: 'pipe',
  stdout: 'pipe',
  stderr: 'pipe',
  env: { ...Bun.env, BUN_UIA_PROFILE: 'full', BUN_UIA_AUDIT: 'on', BUN_UIA_TRACE: tracePath },
});
const decoder = new TextDecoder();
const encoder = new TextEncoder();
void (async () => {
  for await (const chunk of server.stderr) auditText += decoder.decode(chunk);
})();
const pending = new Map<number, (message: { result?: Record<string, unknown> }) => void>();
let buffer = '';
let nextId = 1;
void (async () => {
  for await (const chunk of server.stdout) {
    buffer += decoder.decode(chunk);
    let newline = buffer.indexOf('\n');
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line.length > 0) {
        const message = JSON.parse(line);
        if (typeof message.id === 'number' && pending.has(message.id)) {
          pending.get(message.id)?.(message);
          pending.delete(message.id);
        }
      }
      newline = buffer.indexOf('\n');
    }
  }
})();
const call = (method: string, params: unknown): Promise<{ result?: Record<string, unknown> }> => {
  const id = nextId++;
  server.stdin.write(encoder.encode(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`));
  server.stdin.flush();
  return new Promise((resolve) => pending.set(id, resolve));
};

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'argmask', version: '1' } });
  await call('tools/call', { name: 'run_program', arguments: { command: 'cmd.exe', args: ['/c', 'echo', ARGS_SECRET] } });
  await call('tools/call', { name: 'copy_files', arguments: { paths: [PATH_SECRET] } });
  await Bun.sleep(300); // let the trace appendFile + audit flush

  const trace = await Bun.file(tracePath)
    .text()
    .catch(() => '');
  const auditLines = auditText.split('\n').filter((line) => line.includes('[bun-uia-audit]'));
  const audit = auditLines.join('\n');

  assert(auditLines.length >= 2, `both array-arg calls were audited (saw ${auditLines.length} audit lines)`);
  assert(!audit.includes(ARGS_SECRET), 'the run_program.args secret is NOT in the stderr audit line');
  assert(!trace.includes(ARGS_SECRET), 'the run_program.args secret is NOT in the trace JSONL');
  assert(!audit.includes(PATH_SECRET), 'the copy_files.paths secret is NOT in the stderr audit line');
  assert(!trace.includes(PATH_SECRET), 'the copy_files.paths secret is NOT in the trace JSONL');
  assert(audit.includes('"args":"<3 args>"'), 'run_program.args is recorded as its element count (<3 args> — forensic signal survives)');
  assert(audit.includes('"paths":"<1 arg>"'), 'copy_files.paths is recorded as its element count (<1 arg>, singular)');
} finally {
  server.kill();
  await rm(tracePath, { force: true });
}

console.log(failures === 0 ? '\nPASS — a credential in a command-line array arg is masked to its element count in BOTH the audit and the trace; no verbatim leak.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
