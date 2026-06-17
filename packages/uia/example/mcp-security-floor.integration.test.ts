/**
 * mcp-security-floor — the deployment-surface security floor the MCP server owes a deployer:
 *   1. AUDIT: every mutating tool call leaves a structured stderr trail (default-on; only widen-able) — set_clipboard
 *      is recorded, with its secret-bearing `text` arg masked to a length, not logged verbatim. A POLICY-REFUSED call
 *      is audited too (ok:false, "DENIED by policy") for EVERY category — a denied privilege probe is the intrusion
 *      signal a least-privilege audit must keep; the explicit BUN_UIA_AUDIT=off opt-out silences denials as well.
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

// Parse the structured forensic audit lines out of stderr (one JSON object per `[bun-uia-audit] {…}` line), so the
// assertions compare fields, not a brittle key-order regex (the args `{}` would otherwise break a `[^}]*` match).
type AuditLine = { tool?: string; category?: string; ok?: boolean; error?: string };
function auditLines(stderr: string): AuditLine[] {
  const lines: AuditLine[] = [];
  for (const line of stderr.split('\n')) {
    const marker = line.indexOf('[bun-uia-audit] ');
    if (marker < 0) continue;
    try {
      lines.push(JSON.parse(line.slice(marker + '[bun-uia-audit] '.length)) as AuditLine);
    } catch {}
  }
  return lines;
}

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
  await Bun.sleep(50); // let the refusal's audit line flush to stderr
  const denied = auditLines(ro.stderr()).find((line) => line.tool === 'read_clipboard');
  assert(denied !== undefined, 'a POLICY-REFUSED tools/call leaves a forensic audit line on stderr (a denied privilege probe is the intrusion signal an audit must keep)');
  assert(denied?.ok === false && denied?.error === 'DENIED by policy', 'the refused-call audit line records ok:false with a "DENIED by policy" reason');
} finally {
  ro.kill();
}

// 2b — a denied READ under a deny-list is signal too: auditDenied logs ALL categories, unlike auditCall (reads skipped unless verbose).
const deny = spawnServer({ BUN_UIA_PROFILE: 'safe', BUN_UIA_DENY: 'list_windows' });
try {
  await deny.call('initialize', init);
  const blocked = await deny.call('tools/call', { name: 'list_windows', arguments: {} });
  assert(blocked.result?.isError === true && /disabled by the server policy/.test(textOf(blocked)), 'a deny-listed read tool (list_windows) is REFUSED');
  await Bun.sleep(50);
  const deniedRead = auditLines(deny.stderr()).find((line) => line.tool === 'list_windows');
  assert(deniedRead?.ok === false, 'a denied READ-category tool is STILL audited (deny-list refusals of read tools are logged, not dropped)');
} finally {
  deny.kill();
}

// 2c — the explicit BUN_UIA_AUDIT=off opt-out silences denial lines too (no silent-on for denials).
const denyOff = spawnServer({ BUN_UIA_PROFILE: 'readonly', BUN_UIA_AUDIT: 'off' });
try {
  await denyOff.call('initialize', init);
  await denyOff.call('tools/call', { name: 'click', arguments: { ref: 'e1' } });
  await Bun.sleep(50);
  assert(!/\[bun-uia-audit\]/.test(denyOff.stderr()), 'with BUN_UIA_AUDIT=off, a refused call emits NO audit line (the explicit opt-out is honored for denials too)');
} finally {
  denyOff.kill();
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

// 5 — error-text parity: a THROWN handler error (desktop_snapshot with nothing attached) carries the RAW message, not an
// `Error: ` prefix, so it reads identically to the errorResult() sites — isError:true already signals failure (no GUI window).
const errParity = spawnServer({ BUN_UIA_PROFILE: 'readonly' });
try {
  await errParity.call('initialize', init);
  const thrown = await errParity.call('tools/call', { name: 'desktop_snapshot', arguments: {} });
  const text = textOf(thrown);
  assert(thrown.result?.isError === true && /^no window attached/.test(text), `a thrown handler error returns the RAW message (no \`Error: \` prefix) — matching the errorResult() sites (got: ${JSON.stringify(text.slice(0, 40))})`);
  assert(!/^Error: /.test(text), 'a thrown handler error is NOT prefixed with `Error: ` (uniform with the 40 errorResult() sites; isError:true is the failure signal)');
} finally {
  errParity.kill();
}

// 6 — inline command-line credentials: a secret pasted into run_program / launch_app `command` must NOT reach stderr
// (audit + trace) NOR the returned error/observation text. maskArgs collapses the `command` to its exe token + a length,
// and the launch_app/run_program echo sites interpolate that masked form — only WHICH program ran survives, never its args.
const osSecret = spawnServer({ BUN_UIA_PROFILE: 'full' });
try {
  await osSecret.call('initialize', init);
  // launch_app: a bogus exe with the secret as a flag — fails (not on PATH), so the error text is the echo channel under test.
  const launched = await osSecret.call('tools/call', { name: 'launch_app', arguments: { command: `no-such-app-xyz --password=${SECRET}` } });
  const launchText = textOf(launched);
  assert(!launchText.includes(SECRET), `launch_app's error text MASKS an inline credential in \`command\` (got: ${JSON.stringify(launchText.slice(0, 60))})`);
  assert(/no-such-app-xyz <\d+ chars>/.test(launchText), 'launch_app keeps the exe token + a remainder length (which program ran survives; the args/credential do not)');
  // run_program: a bogus exe with the secret as a flag — the audit args.command is the channel under test (stdout would carry a program's OWN output, out of scope).
  await osSecret.call('tools/call', { name: 'run_program', arguments: { command: `no-such-prog-xyz --password=${SECRET}` } });
  await Bun.sleep(80); // let both async dispatches flush their audit lines to stderr
  const err = osSecret.stderr();
  assert(!err.includes(SECRET), 'NEITHER the run_program nor launch_app audit/trace line leaks an inline `command` credential to stderr');
  const lines = auditLines(err);
  const launchAudit = lines.find((line) => line.tool === 'launch_app');
  assert(launchAudit !== undefined && launchAudit.error !== undefined && !launchAudit.error.includes(SECRET), 'the launch_app audit `error` field MASKS the inline credential (no error/observation echo leak)');
  const runAudit = lines.find((line) => line.tool === 'run_program');
  assert(runAudit !== undefined, 'run_program leaves an audit line (its `command` arg masked by maskArgs, not logged verbatim)');
} finally {
  osSecret.kill();
}

console.log(failures === 0 ? '\nPASS — audit trail on (calls AND policy-refusals), clipboard least-privilege + redacted + fenced, readonly+OS instructions consistent, thrown-error text un-prefixed, inline command-line credentials masked everywhere.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
