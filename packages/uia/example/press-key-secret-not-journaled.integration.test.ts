/**
 * press-key-secret-not-journaled — a credential SPELLED OUT one press_key call at a time must not be reassemblable from
 * the forensic logs. press_key / hold_key carry the keystroke under `key`, which maskArgs originally did NOT mask (only
 * content/text/value were) and whose success message echoed the raw key — so an agent driving a no-own-HWND password box
 * char-by-char (the SendInput fallback when `type` is refused) wrote every character verbatim into BOTH the stderr audit
 * line and the BUN_UIA_TRACE journal (args AND observation). A chord / named key (Control+S, Enter) is intentional
 * forensic signal and MUST stay legible; only a bare single printable char is masked to <char>.
 *
 * Proof (live, over the REAL stdio server): two press_key calls — a single secret char and a Control+S chord. Asserts
 * the char appears NOWHERE in the audit line or the trace JSONL (args or observation) while the chord stays readable.
 * No window is launched (the key goes to ambient focus and fails to resolve / no-ops) so there is nothing to clean up.
 *
 * bun test is broken repo-wide — runnable harness:
 * Run: bun run example/press-key-secret-not-journaled.integration.test.ts
 */
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SECRET_CHAR = 'q'; // a single credential character being spelled out
const CHORD = 'Control+S'; // an intentional shortcut — must remain legible
const tracePath = join(tmpdir(), `bun-uia-keymask-${process.pid}-${Date.now()}.jsonl`);
await rm(tracePath, { force: true });

let auditText = '';
const server = Bun.spawn(['bun', `${import.meta.dir}/../mcp.ts`], {
  stdin: 'pipe',
  stdout: 'pipe',
  stderr: 'pipe',
  env: { ...Bun.env, BUN_UIA_PROFILE: 'safe', BUN_UIA_AUDIT: 'on', BUN_UIA_TRACE: tracePath },
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
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'keymask', version: '1' } });
  await call('tools/call', { name: 'press_key', arguments: { key: SECRET_CHAR } });
  await call('tools/call', { name: 'press_key', arguments: { key: CHORD } });
  await Bun.sleep(250); // let the trace appendFile + audit flush

  const trace = await Bun.file(tracePath).text().catch(() => '');
  const auditLines = auditText.split('\n').filter((line) => line.includes('[bun-uia-audit]'));
  const audit = auditLines.join('\n');

  assert(auditLines.length >= 2, `both press_key calls were audited (saw ${auditLines.length} audit lines)`);
  assert(!audit.includes(`"key":"${SECRET_CHAR}"`), 'the single secret char is MASKED in the audit args (<char>, not verbatim)');
  assert(!trace.includes(`"key":"${SECRET_CHAR}"`), 'the single secret char is MASKED in the trace args');
  assert(!trace.includes(`pressed "${SECRET_CHAR}"`), 'the trace observation does NOT echo the secret char (no reassembly from the success message)');
  assert(audit.includes('"key":"<char>"'), 'the masked char is recorded as <char> (the journal still tells you a key was pressed)');
  assert(trace.includes('Control+S'), 'a CHORD stays legible in the trace (intentional shortcut is forensic signal, not a secret)');
} finally {
  server.kill();
  await rm(tracePath, { force: true });
}

console.log(failures === 0 ? '\nPASS — a spelled-out credential is masked in both the audit and the trace (args + observation); chords stay legible.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
