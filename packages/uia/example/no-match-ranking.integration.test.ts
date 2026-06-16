/**
 * no-match-ranking — two AI-digestion fixes for the "no element matched" path: (1) formatNoMatch now de-duplicates the
 * candidate names and ranks them by relevance to the requested name (substring matches first) instead of raw tree order,
 * and steers to {nameContains} when a candidate's name CONTAINS the requested exact name; (2) Element.waitFor prefixes a
 * timeout with "timed out after N ms" so the agent distinguishes a timeout from a genuinely absent match.
 *
 * Proof: a pure formatNoMatch call (deterministic) asserts ranking + dedup + the nameContains steer; a live waitFor on
 * the always-present taskbar (read-only, not closed) for a bogus selector asserts the elapsed-time prefix.
 *
 * bun test is broken repo-wide — runnable script:
 * Run: bun run example/no-match-ranking.integration.test.ts
 */
import { formatNoMatch, uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

// 1) Pure: ranking + dedup + nameContains steer. Candidates are deliberately in a tree order that buries the relevant ones.
const message = formatNoMatch({ name: 'Save' }, 'Editor', ['Cancel', 'Open Recent', 'Save As', 'Print', 'Save As', 'Save a Copy', 'Help']);
const nearestPart = /nearest: (.*?)(?: \(a control|$)/.exec(message)?.[1] ?? '';
assert(/^"Save As", "Save a Copy"/.test(nearestPart), `relevant (substring) candidates rank first — got: ${JSON.stringify(nearestPart.slice(0, 60))}`);
assert((nearestPart.match(/"Save As"/g) ?? []).length === 1, 'duplicate candidate names are de-duplicated');
assert(/retry with \{nameContains:"Save"\}/.test(message), 'a name that only appears as a substring steers to {nameContains}');
assert(!/nearest:.*"Cancel".*"Save As"/.test(message), 'an unrelated candidate (Cancel) does not rank ahead of a substring match');

// 2) Live: waitFor timeout carries an elapsed-time prefix (taskbar is always present; read-only, never closed).
uia.initialize();
try {
  const taskbar = uia.windows({ includeUntitled: true }).find((window) => window.className === 'Shell_TrayWnd');
  if (taskbar === undefined) console.log('  skip: no taskbar (Shell_TrayWnd) found');
  else {
    const window = uia.attach(taskbar.hWnd);
    let caught = '';
    try {
      await window.waitFor({ name: '__no_such_control_xyz__' }, { timeout: 400 });
    } catch (error) {
      caught = error instanceof Error ? error.message : String(error);
    }
    assert(/timed out after \d+ ms/.test(caught), `waitFor timeout is labelled with elapsed time — got: ${JSON.stringify(caught.slice(0, 60))}`);
    window.dispose();
  }
} finally {
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — no-match candidates are ranked + deduped with a nameContains steer; waitFor timeouts are labelled.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
