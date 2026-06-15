/**
 * epoch-refs — a ref carries a #generation tag so a STALE ref (held across a re-render) fails LOUD instead of
 * silently resolving to whatever control now occupies that traversal slot.
 *
 * Snapshot ref ids are traversal counters reused across snapshots, so after a re-ground the same `e5` can denote a
 * DIFFERENT control — a routine LLM ref-reuse would become a silent wrong-target action. The MCP boundary now stamps
 * `e5#G`; the generation bumps on a full re-dump / desktop_snapshot / screenshot_marked but is HELD across a cheap
 * value-change delta (so still-valid refs are NOT falsely rejected). resolveRef rejects a stale generation.
 *
 * Proof (drives the REAL stdio MCP server against Calculator):
 *   A. a ref from before a desktop_snapshot re-ground is REJECTED (the fix);
 *   B. the fresh ref from the latest snapshot WORKS;
 *   C. a ref survives a value-change delta — invoking another same-generation ref after a delta still resolves
 *      (the false-rejection guard: the generation must NOT bump on a pure rename).
 *
 * bun test is broken repo-wide — runnable harness (spawns + closes Calculator + the MCP subprocess):
 * Run: bun run example/epoch-refs.integration.test.ts
 */
const calc = Bun.spawn(['cmd', '/c', 'start', 'calc'], { stdout: 'ignore', stderr: 'ignore' });
await Bun.sleep(1500);

const server = Bun.spawn(['bun', `${import.meta.dir}/../mcp.ts`], { stdin: 'pipe', stdout: 'pipe', stderr: 'ignore', env: { ...Bun.env, BUN_UIA_PROFILE: 'safe' } });
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
const textOf = (response: { result?: Record<string, unknown> }): string => (Array.isArray(response.result?.content) && response.result.content[0]?.type === 'text' ? String(response.result.content[0].text) : '');
const isErr = (response: { result?: Record<string, unknown> }): boolean => response.result?.isError === true;
const refOf = (text: string, name: string): string | undefined => text.match(new RegExp(`"${name}" \\[ref=(e\\d+(?:#\\d+)?)\\]`))?.[1];

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'epoch-test', version: '1' } });
  await call('tools/call', { name: 'attach', arguments: { title: 'Calculator' } });

  const snap1 = textOf(await call('tools/call', { name: 'desktop_snapshot', arguments: {} }));
  const oldFive = refOf(snap1, 'Five');
  assert(oldFive !== undefined && oldFive.includes('#'), `refs carry a #generation tag (${oldFive})`);

  // Re-ground: this bumps the generation, so refs from snap1 are now stale.
  const snap2 = textOf(await call('tools/call', { name: 'desktop_snapshot', arguments: {} }));
  const newFive = refOf(snap2, 'Five');
  const newSix = refOf(snap2, 'Six');
  assert(newFive !== undefined && newFive !== oldFive, `a re-ground renumbers the generation (${oldFive} → ${newFive})`);

  // A — the STALE ref is rejected, not silently mis-resolved.
  const stale = await call('tools/call', { name: 'invoke', arguments: { element: 'Five (stale ref)', ref: oldFive } });
  assert(isErr(stale) && /earlier snapshot generation/.test(textOf(stale)), 'a stale-generation ref is REJECTED with a re-ground message');

  // B — the fresh ref works. (This first digit may add the Clear-Entry control → a full re-dump → new generation,
  // which is a CORRECT renumber, so we re-ground afterward for the delta test rather than reuse newSix.)
  const fresh = await call('tools/call', { name: 'invoke', arguments: { element: 'Five', ref: newFive } });
  assert(!isErr(fresh), 'the fresh same-generation ref invokes successfully');

  // C — false-rejection guard: in entry mode a further digit press is a PURE display rename (delta → generation
  // HELD), so a sibling ref from the same generation must still resolve afterward.
  const snap3 = textOf(await call('tools/call', { name: 'desktop_snapshot', arguments: {} }));
  const five3 = refOf(snap3, 'Five');
  const six3 = refOf(snap3, 'Six');
  const renameDelta = await call('tools/call', { name: 'invoke', arguments: { element: 'Five', ref: five3 } }); // "5" → "55": pure rename
  assert(!isErr(renameDelta) && /— Δ/.test(textOf(renameDelta)), 'a 2nd digit press returns a Δ delta (generation held, not a full re-dump)');
  const sibling = await call('tools/call', { name: 'invoke', arguments: { element: 'Six', ref: six3 } });
  assert(!isErr(sibling), 'a same-generation sibling ref still resolves after the value-change delta (no false rejection)');
} finally {
  await call('tools/call', { name: 'manage_window', arguments: { action: 'close' } });
  server.stdin.end();
  await Bun.sleep(200);
  server.kill();
  calc.kill();
}

console.log(failures === 0 ? '\nPASS — stale refs fail loud; fresh + post-delta refs resolve.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
