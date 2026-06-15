/**
 * web-content — SEE and DRIVE the web/editor DOM of a Chromium / CEF / Electron window (browsers, VS Code,
 * Discord, Slack, Teams, …). Those apps render their page into a `Chrome_RenderWidgetHostHWND` child whose UIA
 * fragment the top-level window walk does NOT bridge — so a plain attach+snapshot of the top-level shows only an
 * empty Pane. webRoots() attaches to each render-widget child, and snapshot({extraRoots}) splices that page DOM
 * into the tree, so the agent sees and acts on web content with the same refs/patterns as any native control —
 * cursor-free, no focus, no screen-reader flag.
 *
 * Proof: launch Edge in-private to a local page, then via UIA only — read the input's value, set it (ValuePattern),
 * invoke the button (InvokePattern) and read the resulting DOM text change, and confirm a merged snapshot contains
 * the page's controls. All cursor-free; the real cursor never moves.
 *
 * bun test is broken repo-wide for FFI; runnable harness (needs Microsoft Edge):
 * Run: bun run example/web-content.integration.test.ts
 */
import { tmpdir } from 'node:os';

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
function nameContains(tree: { name: string; children: { name: string; children: unknown[] }[] }, needle: string): boolean {
  if (tree.name.includes(needle)) return true;
  return tree.children.some((child) => nameContains(child as typeof tree, needle));
}

const html = `<!doctype html><html><head><meta charset="utf-8"><title>bun-uia web content test</title></head>
<body><h1>bun-uia web content test</h1>
<button id="go" aria-label="Run It Button">Run It</button>
<input id="field" aria-label="Name Field" type="text" value="initial">
<p id="out">ready</p>
<script>document.getElementById('go').onclick=()=>{document.getElementById('out').textContent='clicked';};</script>
</body></html>`;
const path = `${tmpdir()}\\bun-uia-web-content-test.html`;
await Bun.write(path, html);
const fileUrl = `file:///${path.replace(/\\/g, '/')}`;

uia.initialize();
const priorEdge = new Set(uia.windows().filter((w) => w.className === 'Chrome_WidgetWin_1').map((w) => w.hWnd));
Bun.spawn(['cmd', '/c', 'start', 'msedge', '--inprivate', '--new-window', fileUrl], { stdout: 'ignore', stderr: 'ignore' });
let hWnd = 0n;
for (let attempt = 0; attempt < 40 && hWnd === 0n; attempt += 1) {
  await Bun.sleep(300);
  hWnd = uia.windows().find((w) => w.className === 'Chrome_WidgetWin_1' && !priorEdge.has(w.hWnd) && /web content test/.test(w.title))?.hWnd ?? 0n;
}
const cursorBefore = cursorPos();

try {
  assert(hWnd !== 0n, 'launched Edge to the local page');
  if (hWnd === 0n) throw new Error('Edge window not found — is Microsoft Edge installed?');
  await Bun.sleep(1500); // let the renderer build its accessibility tree
  const edge = uia.attach(hWnd);

  const webRoots = edge.webRoots();
  assert(webRoots.length >= 1, `detected ${webRoots.length} Chromium render-widget web root(s) (top-level alone exposes none)`);
  const web = webRoots[0] ?? null;

  if (web !== null) {
    // The renderer builds its accessibility tree progressively — poll until the named button appears.
    let button = web.find({ controlType: ControlType.Button, name: /Run It/ });
    for (let attempt = 0; attempt < 20 && button === null; attempt += 1) {
      Bun.sleepSync(200);
      button = web.find({ controlType: ControlType.Button, name: /Run It/ });
    }
    const edit = web.find({ controlType: ControlType.Edit });
    assert(button !== null, `found the page's button in the web DOM (name ${JSON.stringify(button?.name ?? '')})`);
    assert(edit !== null, 'found the page\'s text input in the web DOM');

    if (edit !== null) {
      assert(edit.value === 'initial', `read the input's value from the live DOM ("${edit.value}")`);
      edit.setValue('typed-by-bun-uia');
      Bun.sleepSync(300);
      assert(edit.value === 'typed-by-bun-uia', 'set the web input cursor-free (ValuePattern) and read it back');
      edit.release();
    }
    if (button !== null) {
      button.invoke();
      Bun.sleepSync(400);
      button.release();
      const out = web.find({ controlType: ControlType.Text, name: /clicked|ready/ });
      assert(out?.name === 'clicked', `invoked the web button cursor-free and read the DOM update ("${out?.name ?? ''}")`);
      out?.release();
    }
  }

  // The merged snapshot (what the MCP desktop_snapshot returns) contains the page DOM, not just the chrome.
  const snapshot = uia.snapshot(edge, { extraRoots: webRoots });
  assert(nameContains(snapshot.tree, 'Run It Button'), 'a merged snapshot splices the web DOM into the tree (agent sees the page)');
  snapshot.dispose();

  for (const root of webRoots) root.release();

  const cursorAfter = cursorPos();
  assert(cursorAfter.x === cursorBefore.x && cursorAfter.y === cursorBefore.y, `the real cursor NEVER moved (stayed at ${cursorBefore.x},${cursorBefore.y})`);
  edge.dispose();
} finally {
  if (hWnd !== 0n) closeWindow(hWnd);
  uia.uninitialize();
  await Bun.file(path)
    .unlink()
    .catch(() => {});
}

console.log(failures === 0 ? '\nPASS — saw and drove a Chromium browser\'s web DOM (read, set, invoke) entirely cursor-free.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
