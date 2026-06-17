# 37 — Inline `command` credential mask SHIPPED

## The leak (confirmed live, `bun run mcp.ts`, `BUN_UIA_PROFILE=full`)

`maskArgs` (mcp.ts) collapsed only ARRAY values (`run_program.args`, `copy_files.paths`) to an
element count, and `TRACE_MASK_KEYS = {content,text,value}` omitted `command`. So a credential
inlined into the whole-command-LINE string leaked verbatim into THREE forensic sinks:

- `run_program {command:'cmd /c echo hunter2-SUPERSECRET'}` → stderr audit line carried
  `"args":{"command":"cmd /c echo hunter2-SUPERSECRET"}` raw.
- `launch_app {command:'mysql --password=hunter2-SUPERSECRET'}` → DUAL leak: the audit `args.command`
  raw AND the audit `error` field echoed it (`could not launch "mysql --password=…" …`), and that
  same error text is the model-returned result + the trace `observation`.

`redactSecrets` would NOT catch `--password=X` (matches no AWS/Bearer/JWT/PEM/high-entropy shape).
The doctrine (mcp.ts maskArgs comment) already said command-line args "must never reach the
journal/SIEM verbatim" — but the code honored it only for the args[] array, not the command string.

## The fix (surgical)

- `maskCommand(value)` + `COMMAND_KEYS = new Set(['command'])` in mcp.ts. The command is masked to its
  leading executable token plus a remainder length: `mysql --password=X` → `mysql <11 chars>`. WHICH
  program ran survives for forensics; its args/credential do not. A no-space bare exe is already
  secret-free and passes through.
- `maskArgs` routes a `command`-keyed string through `maskCommand` (between the `text`-length and
  `key` branches).
- The echo channel: `launch_app` and `run_program` compute `const safeCommand = maskCommand(command)`
  once and interpolate THAT into every result/error/timeout message — so the text that becomes the
  audit `error` field and the trace `observation` never carries the raw command.

## Out of scope (by design)

`run_program`'s captured stdout/stderr is the program's OWN output the agent explicitly asked to run
(`echo SECRET` legitimately prints SECRET). It is returned to the model unmasked — masking arbitrary
program output would defeat run_program's purpose, and it is NOT the command-line credential channel.
A planted secret in stdout is the agent's own request, already in its context.

## Proof

`example/mcp-security-floor.integration.test.ts` section 6 (added): a planted secret in `run_program`
AND `launch_app` `command` must NOT appear in stderr (audit + trace) NOR in the launch_app error text;
the masked `exe <N chars>` form is asserted present. All assertions PASS. `bunx tsc --noEmit` = 0.
