/**
 * Test runner for the bun-uia integration suite (example/<name>.integration.test.ts).
 *
 * `bun test` is broken repo-wide, so each test is a standalone `bun run` script. This orchestrates them
 * with a fast/slow split so the daily loop never pays the window-spawn cost it does not need:
 *   FAST  — no window and no MCP subprocess (pure-function / static tests). Safe to run concurrently.
 *   SLOW  — launches a real window and/or spawns the MCP server. Run strictly serially: many of these
 *           share the global cursor, foreground, or clipboard and would poison each other in parallel.
 *
 * Usage (from packages/uia):
 *   bun run example/_run.ts            # all tests: fast tier concurrently, then slow tier serially
 *   bun run example/_run.ts --fast     # only the no-window tests — seconds, for the edit loop
 *   bun run example/_run.ts --slow     # only the window/subprocess tests
 *   bun run example/_run.ts --list     # classify every test as fast/slow, run nothing
 *   bun run example/_run.ts --filter=scroll   # only tests whose name contains "scroll"
 *   bun run example/_run.ts --verbose  # print each test's full output, not just failures
 */
const args = Bun.argv.slice(2);
const flag = (name: string): boolean => args.includes(`--${name}`);
const filter = args.find((argument) => argument.startsWith('--filter='))?.slice('--filter='.length) ?? '';
const timeoutMs = Number(args.find((argument) => argument.startsWith('--timeout='))?.slice('--timeout='.length)) || 120_000;
const fastPoolSize = 8;

const dir = import.meta.dir;
const packageDir = `${dir}/..`;

/**
 * A test is SLOW if it spawns a subprocess, launches/creates a window, or has a global side effect (synthetic
 * input, foreground/cursor moves, clipboard writes) that makes concurrent runs collide. FAST is the pure remainder
 * — no window, no subprocess, no shared-OS-state mutation — so the fast tier is genuinely safe to run in parallel.
 * The detector is intentionally biased toward SLOW: over-serializing only costs time; a false FAST flakes.
 */
const isSlow = (source: string): boolean =>
  /Bun\.spawn(Sync)?\(|spawnServer\(|spawnSync\(|uia\.launch\(|CreateWindowEx[AW]|CreateProcess|ShellExecute|AllocConsole|SendInput|SetForegroundWindow|SetCursorPos|keybd_event|mouse_event|writeClipboard|clipboardSequence/.test(source);

type Test = { name: string; path: string; slow: boolean };
const tests: Test[] = [];
for await (const entry of new Bun.Glob('*.integration.test.ts').scan({ cwd: dir })) {
  const name = entry.slice(0, -'.integration.test.ts'.length);
  if (filter.length > 0 && !name.includes(filter)) continue;
  tests.push({ name, path: `${dir}/${entry}`, slow: isSlow(await Bun.file(`${dir}/${entry}`).text()) });
}
tests.sort((a, b) => a.name.localeCompare(b.name));

const fast = tests.filter((test) => !test.slow);
const slow = tests.filter((test) => test.slow);

if (flag('list')) {
  console.log(`FAST (${fast.length}) — no window, no subprocess:`);
  for (const test of fast) console.log(`  ${test.name}`);
  console.log(`\nSLOW (${slow.length}) — window and/or MCP subprocess:`);
  for (const test of slow) console.log(`  ${test.name}`);
  process.exit(0);
}

type Outcome = { name: string; code: number; ms: number; output: string; timedOut: boolean };
const runOne = async (test: Test): Promise<Outcome> => {
  const started = Bun.nanoseconds();
  const proc = Bun.spawn(['bun', 'run', test.path], { cwd: packageDir, env: Bun.env, stderr: 'pipe', stdout: 'pipe' });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill();
  }, timeoutMs);
  const [output, error, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
  clearTimeout(timer);
  return { name: test.name, code, ms: Math.round((Bun.nanoseconds() - started) / 1e6), output: `${output}${error}`, timedOut };
};

// finish() exits 0=PASS, 1=FAILED, 2=INCONCLUSIVE (every assertion was skipped — env not present). INCONCLUSIVE is not a failure.
const statusOf = (outcome: Outcome): 'TIMEOUT' | 'PASS' | 'SKIP' | 'FAIL' => (outcome.timedOut ? 'TIMEOUT' : outcome.code === 0 ? 'PASS' : outcome.code === 2 ? 'SKIP' : 'FAIL');
const outcomes: Outcome[] = [];
const report = (outcome: Outcome): void => {
  const status = statusOf(outcome);
  console.log(`  ${status.padEnd(7)} ${outcome.name} (${outcome.ms}ms)`);
  if ((status === 'FAIL' || status === 'TIMEOUT' || flag('verbose')) && outcome.output.trim().length > 0) console.log(outcome.output.trimEnd().replace(/^/gm, '    '));
  outcomes.push(outcome);
};

const runFast = !flag('slow');
const runSlow = !flag('fast');

if (runFast && fast.length > 0) {
  console.log(`\nFAST tier — ${fast.length} tests, up to ${fastPoolSize} concurrent:`);
  for (let start = 0; start < fast.length; start += fastPoolSize) {
    const batch = await Promise.all(fast.slice(start, start + fastPoolSize).map(runOne));
    for (const outcome of batch) report(outcome);
  }
}
if (runSlow && slow.length > 0) {
  console.log(`\nSLOW tier — ${slow.length} tests, serial:`);
  for (const test of slow) report(await runOne(test));
}

const passed = outcomes.filter((outcome) => statusOf(outcome) === 'PASS');
const skipped = outcomes.filter((outcome) => statusOf(outcome) === 'SKIP');
const failed = outcomes.filter((outcome) => statusOf(outcome) === 'FAIL' || statusOf(outcome) === 'TIMEOUT');
console.log(
  `\n${failed.length === 0 ? 'PASS' : 'FAIL'} — ${passed.length} passed, ${skipped.length} inconclusive, ${failed.length} failed of ${outcomes.length}${failed.length > 0 ? `; failed: ${failed.map((outcome) => outcome.name).join(', ')}` : ''}`,
);
process.exit(failed.length === 0 ? 0 : 1);
