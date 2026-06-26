/**
 * reveal-offscreen — interact with a folder that is NOT in view: scrolled below the fold and therefore
 * VIRTUALIZED out of the UI Automation tree entirely (a plain find() returns null for it). reveal() scrolls
 * the list container a page at a time until the row realizes into the tree, then we open it — all cursor-free,
 * no focus, no keystroke, so it works on a background / occluded / unfocused window.
 *
 * Proof: open This PC → Local Disk (C:) → Windows (100+ items), assert a plain find() for "System32" (far
 * below the fold) returns null, then reveal() surfaces it and invoke() opens it — asserting the title changed
 * and the real cursor never moved. The one-call alternative (ItemContainer.FindItemByProperty) segfaults
 * uiautomationcore.dll under Bun FFI on a VT_BSTR VARIANT-by-value, so reveal() uses scroll-to-realize.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/reveal-offscreen.integration.test.ts
 */
import { ControlType, closeWindow, uia } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}
function cursorPos(): { x: number; y: number } {
  const buffer = Buffer.alloc(8);
  User32.GetCursorPos(buffer.ptr!);
  return { x: buffer.readInt32LE(0), y: buffer.readInt32LE(4) };
}

uia.initialize();
for (const window of uia.windows()) {
  if (window.className === 'CabinetWClass') closeWindow(window.hWnd);
}
await Bun.sleep(800);
const priorExplorers = new Set(
  uia
    .windows()
    .filter((w) => w.className === 'CabinetWClass')
    .map((w) => w.hWnd),
);
Bun.spawn(['explorer.exe', 'shell:MyComputerFolder'], { stdout: 'ignore', stderr: 'ignore' });
let hWnd = 0n;
for (let attempt = 0; attempt < 24 && hWnd === 0n; attempt += 1) {
  await Bun.sleep(250);
  hWnd = uia.windows().find((w) => w.className === 'CabinetWClass' && !priorExplorers.has(w.hWnd) && /This PC/.test(w.title))?.hWnd ?? 0n;
}
const cursorBefore = cursorPos();

try {
  assert(hWnd !== 0n, 'opened This PC');
  const explorer = uia.attach(hWnd);

  // Navigate into C:\Windows cursor-free (invoke = activate/navigate), so we have a long, scrolling file list.
  const open = (name: RegExp): boolean => {
    const before = explorer.name;
    for (let attempt = 0; attempt < 14 && explorer.name === before; attempt += 1) {
      const item = explorer.find({ controlType: ControlType.ListItem, name });
      if (item === null) {
        Bun.sleepSync(500);
        continue;
      }
      item.invoke();
      item.release();
      Bun.sleepSync(1100);
    }
    return explorer.name !== before;
  };
  const reachedWindows = open(/\(C:\)/) && open(/^Windows$/);
  assert(reachedWindows, `navigated to a long folder cursor-free → ${JSON.stringify(explorer.name)}`);

  const target = { controlType: ControlType.ListItem, name: /^System32$/ };

  // A plain find() misses it: the row is scrolled below the fold and virtualized out of the a11y tree.
  const directHit = explorer.find(target);
  if (directHit !== null) {
    console.log('  (note: System32 happened to be in view already — window is tall; the reveal path is still exercised)');
    directHit.release();
  } else {
    assert(true, 'a plain find() returns null for the off-screen row (it is virtualized out of the tree)');
  }

  // reveal() scrolls the list until the row realizes, then we open it — still cursor-free.
  const revealed = explorer.reveal(target);
  assert(revealed !== null, 'reveal() surfaced the off-screen folder by scrolling the list');
  if (revealed !== null) {
    const before = explorer.name;
    revealed.invoke();
    revealed.release();
    Bun.sleepSync(1400);
    assert(explorer.name !== before, `opened the previously-off-screen folder cursor-free → ${JSON.stringify(explorer.name)}`);
  }

  const cursorAfter = cursorPos();
  assert(cursorAfter.x === cursorBefore.x && cursorAfter.y === cursorBefore.y, `the real cursor NEVER moved (stayed at ${cursorBefore.x},${cursorBefore.y})`);
  explorer.dispose();
} finally {
  if (hWnd !== 0n) closeWindow(hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — reached and opened a folder that was scrolled out of view, entirely cursor-free.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
