/**
 * MCP trace journal — proves BUN_UIA_TRACE persists a replayable per-call JSONL over the REAL stdio server.
 *
 * Drives packages/uia/mcp.ts as a child process with BUN_UIA_TRACE pointed at a temp file, runs two read-only
 * tool calls (list_monitors, list_processes — NO window launched, so no app to clean up), then reads the journal
 * and asserts one JSON line per call with the wired fields {ts, tool, args(masked), ok, observation}. Also asserts
 * a free-text arg is MASKED to its length (never echoed). Fails before the fix — the server wrote no trace file.
 *
 * bun test is broken repo-wide — runnable harness:
 * Run: bun run example/mcp-trace-journal.integration.test.ts
 */
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tracePath = join(tmpdir(), `bun-uia-trace-${process.pid}-${Date.now()}.jsonl`);
await rm(tracePath, { force: true });

const server = Bun.spawn(['bun', `${import.meta.dir}/../mcp.ts`], { stdin: 'pipe', stdout: 'pipe', stderr: 'inherit', env: { ...Bun.env, BUN_UIA_PROFILE: 'safe', BUN_UIA_TRACE: tracePath } });
const decoder = new TextDecoder();
const encoder = new TextEncoder();
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

async function fail(message: string): Promise<never> {
  console.error(`FAIL: ${message}`);
  server.kill();
  await rm(tracePath, { force: true });
  process.exit(1);
}
function ok(message: string): void {
  console.log(`  ok: ${message}`);
}

const init = await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'trace-test', version: '1' } });
const reportedVersion = (init.result as { serverInfo?: { version?: unknown } } | undefined)?.serverInfo?.version;
if (reportedVersion !== '1.7.0') await fail(`initialize must self-report SERVER_INFO.version 1.7.0 (saw ${JSON.stringify(reportedVersion)})`);
ok(`initialize self-reports version ${reportedVersion}`);

// Two read-only calls — neither opens a window. The 2nd carries a free-text 'text' arg the journal must MASK.
await call('tools/call', { name: 'list_monitors', arguments: {} });
await call('tools/call', { name: 'list_processes', arguments: { name: 'explorer', text: 'super-secret-passphrase' } });

server.stdin.end();
await Bun.sleep(400);
server.kill();

const raw = await Bun.file(tracePath)
  .text()
  .catch(() => '');
if (raw.length === 0) await fail('BUN_UIA_TRACE produced no journal file — the trace gate is not wired');
const lines = raw
  .split('\n')
  .filter((line) => line.length > 0)
  .map((line) => JSON.parse(line));
if (lines.length !== 2) await fail(`expected one journal line per tool call (2), got ${lines.length}`);
ok(`journal has ${lines.length} lines — one per tools/call`);

const [first, second] = lines as [Record<string, unknown>, Record<string, unknown>];
if (first.tool !== 'list_monitors' || second.tool !== 'list_processes') await fail(`journal tool names wrong: ${first.tool}, ${second.tool}`);
ok('each line records the tool name in call order');

if (typeof first.ts !== 'string' || Number.isNaN(Date.parse(first.ts))) await fail(`ts must be an ISO timestamp (saw ${JSON.stringify(first.ts)})`);
if (first.ok !== true) await fail('a successful read should record ok:true');
if (typeof first.observation !== 'string' || first.observation.length === 0) await fail('a line must carry an observation summary');
ok('lines carry ts, ok, and an observation summary');

const maskedText = (second.args as Record<string, unknown>).text;
if (maskedText !== '<23 chars>') await fail(`the free-text arg must be MASKED to its length, never echoed (saw ${JSON.stringify(maskedText)})`);
if ((second.args as Record<string, unknown>).name !== 'explorer') await fail('a non-sensitive arg should pass through unmasked');
ok('the free-text arg is masked to <N chars> while non-text args pass through');

await rm(tracePath, { force: true });
console.log('\nPASS — MCP trace journal verified end-to-end (per-call JSONL, masked free text, 1.7.0 self-report).');
process.exit(0);
