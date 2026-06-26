/**
 * integrity-level — read a process's Windows integrity level, so an agent can diagnose the UIPI wall instead of
 * silently failing against it. A Medium-integrity agent cannot drive a High/System window (UIPI blocks posted
 * messages AND SendInput across integrity levels — a true OS wall); list_windows now tags such windows. This
 * proves the read: self is Medium; a System process reads 'system' (or '' if its token is inaccessible from
 * Medium — both correct, never a crash or a wrong 'medium').
 *
 * bun test is broken repo-wide for FFI; runnable harness (no windows spawned):
 * Run: bun run example/integrity-level.integration.test.ts
 */
import { integrityLevel, uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
try {
  const self = integrityLevel(process.pid);
  console.log(`  self (pid ${process.pid}) = ${JSON.stringify(self)}`);
  assert(self === 'medium', `this process reads Medium integrity (got ${JSON.stringify(self)})`);

  assert(integrityLevel(0) === '', 'an invalid pid reads "" (no access), not a crash');

  // every running process reads a valid level or '' — never throws.
  const processes = uia.listProcesses();
  const levels = new Set<string>();
  let threw = false;
  for (const process of processes) {
    try {
      levels.add(integrityLevel(process.processId));
    } catch {
      threw = true;
    }
  }
  assert(!threw, `integrityLevel never throws across all ${processes.length} processes`);
  assert(
    [...levels].every((level) => ['', 'untrusted', 'low', 'medium', 'high', 'system'].includes(level)),
    `every result is a valid level (saw: ${[...levels].sort().join(', ')})`,
  );

  // a known System process: winlogon / csrss. Expect 'system' or '' (token inaccessible from Medium) — never 'medium'.
  const systemProcess = processes.find((process) => /^(winlogon|csrss|services|wininit)\.exe$/i.test(process.name));
  if (systemProcess !== undefined) {
    const level = integrityLevel(systemProcess.processId);
    console.log(`  ${systemProcess.name} (pid ${systemProcess.processId}) = ${JSON.stringify(level)}`);
    assert(level === 'system' || level === '', `a System process reads 'system' or '' — not 'medium' (got ${JSON.stringify(level)})`);
  } else {
    console.log('  skip: no well-known System process found to cross-check');
  }
} finally {
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — integrity level reads correctly (self Medium; System cross-checked); UIPI wall is diagnosable.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
