/**
 * chromium-scroll — scroll a Chromium/Electron web page CURSOR-FREE. A Chromium render surface exposes a UIA
 * ScrollPattern that FALSELY reports verticallyScrollable:false even on a tall page, so the plain ScrollPattern path
 * silently no-ops (and would falsely report "scrolled"). The fix: when the ScrollPattern is not usably scrollable, post
 * WM_MOUSEWHEEL to the element's Chromium HOST window (Element.chromiumHostHandle()), which scrolls the page with no
 * cursor and no foreground — the same path the MCP `scroll` tool now takes.
 *
 * Proof: launch Edge to a tall local page whose onscroll handler mirrors window.scrollY into the document title; via UIA
 * only, confirm the web root's ScrollPattern claims not-scrollable, resolve its Chromium host handle, post a wheel, and
 * read the title to confirm the page actually scrolled — all while the real cursor never moves.
 *
 * bun test is broken repo-wide for FFI; runnable harness (needs Microsoft Edge):
 * Run: bun run example/chromium-scroll.integration.test.ts
 */
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

import { ControlType, closeWindow, postWheel, uia } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';

let failures = 0;
let skipped = false;
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

const html = `<!doctype html><html><head><meta charset=utf-8><title>SCROLL_0 chromium-scroll-test</title></head><body><script>window.onscroll=()=>{document.title='SCROLL_'+Math.round(window.scrollY)+' chromium-scroll-test';};</script><button aria-label="TopBtn">Top</button><div style="height:6000px;background:linear-gradient(red,blue)">tall</div><p>bottom</p></body></html>`;
const path = `${tmpdir()}/bun-uia-chromium-scroll-test.html`;
await Bun.write(path, html);

uia.initialize();
const prior = new Set(
  uia
    .windows()
    .filter((w) => w.className === 'Chrome_WidgetWin_1')
    .map((w) => w.hWnd),
);
Bun.spawn(['cmd', '/c', 'start', 'msedge', '--inprivate', '--new-window', pathToFileURL(path).href], { stdout: 'ignore', stderr: 'ignore' });
let hWnd = 0n;
for (let attempt = 0; attempt < 40 && hWnd === 0n; attempt += 1) {
  await Bun.sleep(300);
  hWnd = uia.windows().find((w) => w.className === 'Chrome_WidgetWin_1' && !prior.has(w.hWnd) && /chromium-scroll-test/.test(w.title))?.hWnd ?? 0n;
}
const title = (): string => {
  const buffer = Buffer.allocUnsafe(1024);
  const length = User32.GetWindowTextW(hWnd, buffer.ptr!, 512);
  return length > 0 ? buffer.toString('utf16le', 0, length * 2) : '';
};
const scrollY = (): number => {
  const match = /SCROLL_(\d+)/.exec(title());
  return match ? parseInt(match[1], 10) : -1;
};
const cursorBefore = cursorPos();

try {
  if (hWnd === 0n) {
    skipped = true;
    console.log('  skip(live): Edge window did not appear — is Microsoft Edge installed?');
  } else {
    await Bun.sleep(2000); // let the renderer build its accessibility tree
    const edge = uia.attach(hWnd);
    const webRoots = edge.webRoots();
    assert(webRoots.length >= 1, `detected ${webRoots.length} Chromium web root(s)`);
    const web = webRoots[0] ?? null;

    if (web !== null) {
      const info = web.scrollInfo;
      // The crux: Chromium's ScrollPattern lies about scrollability — this is WHY the ScrollPattern path must be gated.
      assert(info !== null && info.verticallyScrollable === false, `Chromium ScrollPattern falsely reports verticallyScrollable=false (info=${JSON.stringify(info)})`);

      const hostFromRoot = web.chromiumHostHandle();
      assert(hostFromRoot !== 0n, `chromiumHostHandle() resolves the web root's Chromium host window (0x${hostFromRoot.toString(16)})`);

      // and from a deep LEAF (no own HWND) the ancestor walk still finds the Chromium host
      let leaf = web.find({ controlType: ControlType.Button, name: /TopBtn/ });
      for (let attempt = 0; attempt < 20 && leaf === null; attempt += 1) {
        Bun.sleepSync(200);
        leaf = web.find({ controlType: ControlType.Button, name: /TopBtn/ });
      }
      assert(leaf !== null && leaf.nativeWindowHandle === 0n, 'a web leaf control has NO own HWND (UIA fragment)');
      assert(leaf !== null && leaf.chromiumHostHandle() !== 0n, 'chromiumHostHandle() resolves the host even from a deep web leaf');
      leaf?.release();

      // the actual cursor-free scroll: post a wheel to the host window AT the page center and confirm the page MOVED
      const bounds = web.boundingRectangle;
      const centerX = bounds.x + Math.floor(bounds.width / 2);
      const centerY = bounds.y + Math.floor(bounds.height / 2);
      const before = scrollY();
      assert(before === 0, `page starts at the top (scrollY=${before})`);
      const posted = postWheel(hostFromRoot, centerX, centerY, -12); // notches<0 = scroll down
      await Bun.sleep(700);
      const after = scrollY();
      assert(posted && after > before, `posting a wheel to the Chromium host scrolled the page cursor-free (scrollY ${before} -> ${after})`);
    }

    for (const root of webRoots) root.release();
    const cursorAfter = cursorPos();
    assert(cursorAfter.x === cursorBefore.x && cursorAfter.y === cursorBefore.y, `the real cursor NEVER moved (stayed at ${cursorBefore.x},${cursorBefore.y})`);
    edge.dispose();
  }
} finally {
  if (hWnd !== 0n) closeWindow(hWnd);
  uia.uninitialize();
  await Bun.file(path)
    .unlink()
    .catch(() => {});
}

console.log(
  skipped
    ? '\nSKIPPED — Microsoft Edge not available (no assertions ran).'
    : failures === 0
      ? '\nPASS — scrolled a Chromium web page cursor-free (ScrollPattern gated; wheel posted to the host window).'
      : `\nFAILED — ${failures} assertion(s)`,
);
process.exit(failures === 0 ? 0 : 1);
