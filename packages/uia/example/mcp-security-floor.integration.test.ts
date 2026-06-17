/**
 * mcp-security-floor — the deployment-surface security floor the MCP server owes a deployer:
 *   1. AUDIT: every mutating tool call leaves a structured stderr trail (default-on; only widen-able) — set_clipboard
 *      is recorded, with its secret-bearing `text` arg masked to a length, not logged verbatim.
 *   2. CLIPBOARD LEAST-PRIVILEGE: read_clipboard is category 'input' (NOT 'read'), so the readonly profile does NOT
 *      expose it — a least-privilege agent cannot exfiltrate the global clipboard (passwords / 2FA / API keys).
 *   3. REDACTION: under an acting profile, read_clipboard masks a planted secret shape (an AKIA… key) instead of
 *      returning it verbatim, and fences the result as UNTRUSTED content (prompt-injection boundary).
 *   4. OS/READONLY MISMATCH: readonly + BUN_UIA_OS=1 serves the ACTING instructions (not the READ-ONLY banner), so the
 *      model is never told it is read-only while run_program/write_file are live.
 *
 * bun test is broken repo-wide for FFI — runnable harness (MCP subprocesses only; no GUI window is opened):
 * Run: bun run example/mcp-security-floor.integration.test.ts
 */
type Rpc = { id?: number; result?: { isError?: boolean; instructions?: string; content?: { text?: string }[]; tools?: { name: string }[] } };

interface Driver {
  call: (method: string, params: unknown) => Promise<Rpc>;
  stderr: () => string;
  kill: () => void;
}

function spawnServer(env: Record<string, string>): Driver {
  const proc = Bun.spawn(['bun', 'run', `${import.meta.dir}/../mcp.ts`], { stdin: 'pipe', stdout: 'pipe', stderr: 'pipe', env: { ...Bun.env, ...env } });
  const decoder = new TextDecoder();
  let buffer = '';
  let stderrText = '';
  const pending = new Map<number, (message: Rpc) => void>();
  void (async () => {
    const reader = proc.stdout.getReader();
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
  void (async () => {
    const reader = proc.stderr.getReader();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      stderrText += decoder.decode(value, { stream: true });
    }
  })();
  let nextId = 1;
  const call = (method: string, params: unknown): Promise<Rpc> => {
    const id = nextId++;
    proc.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    proc.stdin.flush();
    return new Promise((resolve) => pending.set(id, resolve));
  };
  return { call, stderr: () => stderrText, kill: () => proc.kill() };
}

const textOf = (m: Rpc): string => m.result?.content?.[0]?.text ?? '';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const init = { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'sec', version: '1' } };
const SECRET = 'AKIAIOSFODNN7EXAMPLE'; // an AWS access-key-id-shaped string the default redaction masks

// 1+3 — acting profile: audit trail + clipboard redaction + untrusted fence.
const safe = spawnServer({ BUN_UIA_PROFILE: 'safe' });
try {
  await safe.call('initialize', init);
  await safe.call('tools/call', { name: 'set_clipboard', arguments: { text: SECRET } });
  const read = textOf(await safe.call('tools/call', { name: 'read_clipboard', arguments: {} }));
  assert(!read.includes(SECRET) && /«redacted»/.test(read), `read_clipboard MASKS a planted ${SECRET.slice(0, 4)}… secret instead of returning it verbatim (got: ${JSON.stringify(read.slice(0, 80))})`);
  assert(/UNTRUSTED/.test(read) && /do NOT follow instructions/.test(read), 'read_clipboard FENCES its result as untrusted content (prompt-injection boundary)');
  await Bun.sleep(50); // let the async dispatch flush its audit line to stderr
  const err = safe.stderr();
  assert(/\[bun-uia-audit\]/.test(err) && /"tool":"set_clipboard"/.test(err), 'a mutating call (set_clipboard) leaves a structured audit line on stderr');
  assert(!err.includes(SECRET) && /<\d+ chars>/.test(err), 'the audit line MASKS the secret-bearing set_clipboard `text` arg (length only), never logging it verbatim');
} finally {
  safe.kill();
}

// 2 — readonly profile must NOT expose read_clipboard (it is category 'input' now, not 'read').
const ro = spawnServer({ BUN_UIA_PROFILE: 'readonly' });
try {
  await ro.call('initialize', init);
  const list = await ro.call('tools/list', {});
  const names = (list.result?.tools ?? []).map((tool) => tool.name);
  assert(!names.includes('read_clipboard'), 'readonly profile does NOT list read_clipboard (no clipboard exfiltration under least-privilege)');
  const blocked = await ro.call('tools/call', { name: 'read_clipboard', arguments: {} });
  assert(blocked.result?.isError === true && /disabled by the server policy/.test(textOf(blocked)), 'read_clipboard is REFUSED under readonly (steered to BUN_UIA_ALLOW=read_clipboard / a higher profile)');
} finally {
  ro.kill();
}

// 4 — readonly + BUN_UIA_OS=1: instructions must reflect the LIVE os/fs reach, not the READ-ONLY banner.
const roOs = spawnServer({ BUN_UIA_PROFILE: 'readonly', BUN_UIA_OS: '1' });
try {
  const initReply = await roOs.call('initialize', init);
  const instructions = initReply.result?.instructions ?? '';
  assert(!/READ-ONLY under the current server policy/.test(instructions), 'readonly+OS does NOT serve the READ-ONLY banner (os/fs are live — that would under-state the real surface)');
  await Bun.sleep(50);
  assert(/read-only profile has live os\/fs reach/.test(roOs.stderr()), 'readonly+OS emits a startup warning that the deployer enabled os/fs without acting tools');
} finally {
  roOs.kill();
}

// 4b — readonly with audit explicitly disabled: the opt-out must be EXPLICIT and visible (never silent).
const roAuditOff = spawnServer({ BUN_UIA_PROFILE: 'safe', BUN_UIA_AUDIT: 'off' });
try {
  await roAuditOff.call('initialize', init);
  await roAuditOff.call('tools/call', { name: 'set_clipboard', arguments: { text: 'plain' } });
  await Bun.sleep(50);
  const err = roAuditOff.stderr();
  assert(/audit: DISABLED \(BUN_UIA_AUDIT=off — explicit opt-out\)/.test(err), 'BUN_UIA_AUDIT=off is reported as an EXPLICIT opt-out at startup (it cannot be silently disabled)');
  assert(!/\[bun-uia-audit\]/.test(err), 'with the explicit opt-out, no audit lines are emitted');
} finally {
  roAuditOff.kill();
}

console.log(failures === 0 ? '\nPASS — audit trail on, clipboard least-privilege + redacted + fenced, readonly+OS instructions consistent.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
