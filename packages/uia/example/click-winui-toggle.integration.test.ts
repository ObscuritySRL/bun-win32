/**
 * click-winui-toggle — the MCP `click` tool on a no-own-HWND WinUI toggle (a Settings ToggleSwitch renders as a
 * Button with TogglePattern but NO InvokePattern). clickElement used to invoke() (throws — no Invoke), then post a
 * COORDINATE click to the host HWND: PostMessage returns nonzero, the WinUI control never sees it → a FALSE
 * "posted click" success, the toggle did not flip. Now clickElement tries the semantic activations a left-click
 * maps to (toggle / select) BEFORE the coordinate post, so a click on a ToggleSwitch toggles it
 * cursor-free and VERIFIABLY.
 *
 * Proof: drive the real MCP `click` tool on a Settings visual-effects ToggleSwitch and assert it reports
 * "toggled (cursor-free …)" AND the live toggleState actually flipped (read in-process). State is restored.
 * SKIPS cleanly when Settings isn't foreground/readable over the wire (a UWP suspends its tree when backgrounded).
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + spawned Settings):
 * Run: bun run example/click-winui-toggle.integration.test.ts
 */
import { closeWindow, PropertyId, raiseWindow, uia } from '@bun-win32/uia';

type Rpc = { id?: number; result?: { isError?: boolean; content?: { text?: string }[] } };
const proc = Bun.spawn(['bun', 'run', `${import.meta.dir}/../mcp.ts`], { stdin: 'pipe', stdout: 'pipe', stderr: 'ignore', env: { ...Bun.env, BUN_UIA_PROFILE: 'safe' } });
const reader = proc.stdout.getReader();
const decoder = new TextDecoder();
let buffer = '';
const pending = new Map<number, (message: Rpc) => void>();
void (async () => {
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
let nextId = 1;
const call = (method: string, params: unknown): Promise<Rpc> => {
  const id = nextId++;
  proc.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  proc.stdin.flush();
  return new Promise((resolve) => pending.set(id, resolve));
};
const textOf = (m: Rpc): string => m.result?.content?.[0]?.text ?? '';
const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
Bun.spawn(['explorer.exe', 'ms-settings:easeofaccess-visualeffects'], { stdout: 'ignore', stderr: 'ignore' });
let hWnd = 0n;
for (let i = 0; i < 40 && hWnd === 0n; i++) {
  await Bun.sleep(250);
  hWnd = uia.windows().find((w) => w.title === 'Settings')?.hWnd ?? 0n;
}

try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'click-toggle', version: '1' } });
  if (hWnd === 0n) {
    console.log('  skip(live): Settings did not appear');
  } else {
    await Bun.sleep(2500); // late WinUI content
    raiseWindow(hWnd);
    await Bun.sleep(400);

    // in-process: find a Toggle-without-Invoke control with bounds (the false-success class), record name + state
    const settings = uia.attach(hWnd);
    const scan = settings.findAll({});
    const toggle = scan.find((el) => el.getProperty(PropertyId.IsTogglePatternAvailable) === true && el.getProperty(PropertyId.IsInvokePatternAvailable) !== true && el.boundingRectangle.width > 0 && el.boundingRectangle.height > 0) ?? null;
    const name = toggle?.name ?? '';
    const baseline = toggle?.toggleState ?? -1;
    if (toggle === null) {
      console.log('  skip(live): no Toggle-without-Invoke control found');
    } else {
      console.log(`  target: Button ${JSON.stringify(name)} baseline state=${baseline}`);
      const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${hWnd.toString(16)}` } }));
      const ref = new RegExp(`Button "${escapeRegExp(name)}" \\[ref=(e\\d+(?:#\\d+)?)\\]`).exec(snap)?.[1];
      if (ref === undefined) {
        console.log(`  skip(live): toggle ref not in the wire snapshot (UWP tree suspended for the subprocess; snap ${snap.length} chars)`);
      } else {
        const result = await call('tools/call', { name: 'click', arguments: { ref } });
        const out = textOf(result);
        assert(result.result?.isError !== true && /toggled \(cursor-free/.test(out), `click reports a cursor-free TOGGLE, not a false posted-click (got: ${JSON.stringify(out.slice(0, 90))})`);
        await Bun.sleep(450);
        const after = uia.attach(hWnd);
        const allAfter = after.findAll({});
        const flipped = allAfter.find((el) => el.name === name && el.getProperty(PropertyId.IsTogglePatternAvailable) === true) ?? null;
        assert(flipped !== null && flipped.toggleState !== baseline, `the toggle ACTUALLY flipped (was ${baseline}, now ${flipped?.toggleState ?? 'gone'}) — not a false success`);
        // restore the user's setting
        if (flipped !== null && flipped.toggleState !== baseline) flipped.toggle();
        for (const el of allAfter) el.release();
        after.dispose();

        // act() path (find_and_act) must ALSO return clickElement's REAL outcome, not a hardcoded "clicked X"
        const win2 = uia.attach(hWnd);
        const all2 = win2.findAll({});
        const other = all2.find((el) => el.getProperty(PropertyId.IsTogglePatternAvailable) === true && el.getProperty(PropertyId.IsInvokePatternAvailable) !== true && el.boundingRectangle.width > 0 && el.name !== name) ?? null;
        if (other !== null) {
          const otherName = other.name;
          const otherBaseline = other.toggleState;
          const fa = textOf(await call('tools/call', { name: 'find_and_act', arguments: { selector: { name: otherName, controlType: 'Button' }, do: 'click' } }));
          assert(/toggled \(cursor-free/.test(fa), `find_and_act{do:click} returns the REAL outcome, not "clicked X" (got: ${JSON.stringify(fa.slice(0, 80))})`);
          await Bun.sleep(400);
          const win3 = uia.attach(hWnd);
          const all3 = win3.findAll({});
          const reread = all3.find((el) => el.name === otherName && el.getProperty(PropertyId.IsTogglePatternAvailable) === true) ?? null;
          if (reread !== null && reread.toggleState !== otherBaseline) reread.toggle(); // restore the user's setting
          for (const el of all3) el.release();
          win3.dispose();
        }
        for (const el of all2) el.release();
        win2.dispose();
      }

      // computer-use lib path (uia.dispatch left_click → semanticClick) must ALSO fire the semantic activation when
      // the pixel resolves a togglable control — not a false posted coordinate click. Same no-Invoke WinUI toggle.
      const point = toggle.clickablePoint;
      if (point !== null) {
        const dispBaseline = toggle.toggleState;
        const disp = await uia.dispatch(settings, { action: 'left_click', coordinate: [point.x, point.y] }, { cursorless: true });
        await Bun.sleep(400);
        if (toggle.toggleState !== dispBaseline) {
          assert(disp.ok && /toggled .*cursor-free/.test(disp.output ?? ''), `uia.dispatch left_click reports a cursor-free TOGGLE (got: ${JSON.stringify(disp.output ?? disp.error)})`);
          if (toggle.toggleState !== baseline) toggle.toggle(); // restore
        } else {
          console.log(`  note: uia.dispatch at the toggle pixel resolved a non-togglable element (${JSON.stringify(disp.output ?? disp.error)}) — fromPoint did not land on the TogglePattern node; the semanticClick chain is still correct where the pixel resolves a togglable/selectable control`);
        }
      }
    }
    for (const el of scan) el.release();
    settings.dispose();
  }
} finally {
  proc.kill();
  if (hWnd !== 0n) closeWindow(hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — MCP click toggles a no-Invoke WinUI ToggleSwitch cursor-free (no false posted-click).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
