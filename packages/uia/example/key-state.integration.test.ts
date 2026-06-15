/**
 * key-state — crash-safe input OBSERVATION via GetAsyncKeyState polling (no SetWindowsHookEx foreign-thread
 * callback, the uiohook/JSCallback hazard; no message pump). isKeyDown(name) reports whether a key is physically
 * down right now — call it in a poll loop to watch input without a global hook.
 *
 * Proof: a key reads not-down; pressed via SendInput it reads down; released it reads not-down again. The press is a
 * benign modifier (Shift) released in a finally so it can never stick.
 *
 * bun test is broken repo-wide — runnable harness (no windows spawned; needs an interactive desktop for SendInput):
 * Run: bun run example/key-state.integration.test.ts
 */
import { isKeyDown, keyDown, keyUp, uia } from '@bun-win32/uia';

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
  assert(typeof isKeyDown('A') === 'boolean', 'isKeyDown returns a boolean');
  assert(!isKeyDown('F8'), 'a key that is not held reads false');

  keyDown('Shift');
  try {
    await Bun.sleep(40);
    assert(isKeyDown('Shift'), 'isKeyDown detects a key held down (Shift via SendInput)');
  } finally {
    keyUp('Shift');
  }
  await Bun.sleep(40);
  assert(!isKeyDown('Shift'), 'isKeyDown reports the key released');
} finally {
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — GetAsyncKeyState input observation tracks real key state (crash-safe polling, no hook).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
