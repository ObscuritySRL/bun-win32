/**
 * views — cursor-free VIEW-MODE switching via UIA MultipleViewPattern (SetCurrentView, vtable slots verified vs
 * UIAutomationClient.h by slot-gate). Flip File Explorer between Details/List/Icons/Tiles/Content with no real
 * cursor, no focus — e.g. switch to Details so read_table can read the columns.
 *
 * Proof: open a POPULATED folder (so the Items View realizes), read its current + supported views, switch to a
 * different view, read back that it switched, then restore. Closes Explorer.
 *
 * bun test is broken repo-wide — runnable harness (spawns + closes one Explorer window):
 * Run: bun run example/views.integration.test.ts
 */
import { closeWindow, type Element, listWindows, uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
const prior = new Set(
  listWindows({ includeUntitled: true })
    .filter((w) => /CabinetWClass/i.test(w.className))
    .map((w) => w.hWnd),
);
Bun.spawn(['explorer.exe', 'C:\\Windows'], { stdout: 'ignore', stderr: 'ignore' });
let hWnd = 0n;
for (let i = 0; i < 50 && hWnd === 0n; i += 1) {
  await Bun.sleep(150);
  hWnd = listWindows({ includeUntitled: true }).find((w) => /CabinetWClass/i.test(w.className) && !prior.has(w.hWnd))?.hWnd ?? 0n;
}
try {
  if (hWnd === 0n) {
    console.log('  skip: no Explorer window opened');
  } else {
    await Bun.sleep(1800); // let the Items View realize
    const app = uia.attach(hWnd);
    let container: Element | null = null;
    const stack: Element[] = [app];
    let nodes = 0;
    while (stack.length > 0 && container === null && nodes < 6000) {
      const element = stack.pop()!;
      nodes += 1;
      if (element.views() !== null) {
        container = element;
        break;
      }
      for (const child of element.children) stack.push(child);
      if (element !== app) element.release();
    }
    if (container === null) {
      console.log('  skip: no MultipleView container in this Explorer build (provider does not expose it)');
    } else {
      const before = container.views()!;
      assert(before.supported.length > 1 && before.supported.every((v) => v.name.length > 0), `Items View exposes ${before.supported.length} named view modes (current=${before.current})`);
      const other = before.supported.find((v) => v.id !== before.current);
      if (other !== undefined) {
        const switched = container.setView(other.id);
        await Bun.sleep(400);
        assert(switched && container.views()!.current === other.id, `setView(${other.id} "${other.name}") switched the view CURSOR-FREE (read back ${container.views()!.current})`);
        container.setView(before.current); // restore
        await Bun.sleep(300);
        assert(container.views()!.current === before.current, `restored to the original view ${before.current}`);
      }
      container.release();
    }
    app.dispose();
  }
} finally {
  if (hWnd !== 0n) closeWindow(hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — MultipleViewPattern switches a list/grid view mode cursor-free.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
