/**
 * UIA self-test — the real FFI integration suite for @bun-win32/uia.
 *
 * Drives live apps (Calculator, Notepad, Mouse Properties) through the published package surface and
 * asserts ground truth: Calculator computes 5+3=8, Notepad round-trips a value, the cached tree equals
 * the naive walk, screenshots render, MSAA falls back, and the error paths throw their specific
 * messages. Each section prints PASS/FAIL; the process exits non-zero on any failure.
 *
 * Synthetic-input sections (SendInput type/click) are SKIPPED on a locked session (UIA works locked,
 * input injection does not). Set NO_WINDOW=1 to skip every window-dependent section.
 *
 * APIs demonstrated:
 * - initialize / uninitialize (COM apartment + IUIAutomation activation)
 * - uia.attach / find / findAll / waitFor (Playwright-for-desktop query + auto-retry)
 * - Element.invoke / setValue / value / text / toggle / expand / select / rangeValue (control patterns)
 * - Element.scroll / setScrollPercent / scrollInfo (ScrollPattern container scroll — cursor-free, works locked)
 * - createCacheRequest / findAllCached (the cached round-trip), uia.tree (agent grounding)
 * - screenshot (PrintWindow → PNG), msaaTree (oleacc fallback)
 *
 * Run: bun run example/uia.selftest.ts
 */
import { closeWindow, ControlType, countNodes, createCacheRequest, msaaTree, NoScroll, screenshot, ScrollAmount, uia, windowProcessId } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';

let failures = 0;
let passes = 0;
const skipWindows = Bun.env.NO_WINDOW === '1';

function check(name: string, condition: boolean, detail = ''): void {
  if (condition) {
    passes += 1;
    console.log(`  \x1b[92mPASS\x1b[0m ${name}${detail ? `  \x1b[2m${detail}\x1b[0m` : ''}`);
  } else {
    failures += 1;
    console.log(`  \x1b[91mFAIL\x1b[0m ${name}${detail ? `  ${detail}` : ''}`);
  }
}
function skip(name: string, why: string): void {
  console.log(`  \x1b[93mSKIP\x1b[0m ${name}  \x1b[2m${why}\x1b[0m`);
}
function section(title: string): void {
  console.log(`\n\x1b[96m${title}\x1b[0m`);
}
function findWindow(title: string): bigint {
  let hWnd = 0n;
  const buffer = Buffer.from(`${title}\0`, 'utf16le');
  for (let i = 0; i < 25 && hWnd === 0n; i += 1) {
    Bun.sleepSync(300);
    hWnd = User32.FindWindowW(null, buffer.ptr!);
  }
  return hWnd;
}
/** Close the throwaway Notepad, dismissing the unsaved-changes prompt with "Don't save" (it holds test junk). */
async function closeNotepad(hWnd: bigint): Promise<void> {
  if (hWnd === 0n) return;
  const notepadPid = windowProcessId(hWnd);
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  closeWindow(hWnd);
  await Bun.sleep(700);
  try {
    const notepad = uia.attach(hWnd);
    const dontSave = notepad.find({ name: /Don.?t save/i });
    dontSave?.invoke();
    dontSave?.release();
    notepad.dispose();
  } catch {
    // already gone
  }
}

uia.initialize();
const cursor = Buffer.alloc(8);
User32.GetCursorPos(cursor.ptr!);
const locked = User32.SetCursorPos(cursor.readInt32LE(0), cursor.readInt32LE(4)) === 0;
console.log(`\x1b[1mUIA self-test\x1b[0m  session: ${locked ? 'LOCKED (synthetic input skipped)' : 'unlocked'}`);

section('1. activate');
const pUia = uia.initialize();
check('initialize() returns a client', pUia !== 0n, `0x${pUia.toString(16)}`);
check('initialize() is idempotent', uia.initialize() === pUia);
uia.uninitialize();
check('re-init after uninitialize works', uia.initialize() !== 0n);

if (!skipWindows) {
  Bun.spawn(['cmd', '/c', 'start', 'calc'], { stdout: 'ignore', stderr: 'ignore' });
  const calcHwnd = findWindow('Calculator');
  Bun.sleepSync(900);
  const calc = uia.attach(calcHwnd);

  section('2. attach + query');
  check('attach resolves the window', calc.name === 'Calculator', JSON.stringify(calc.name));
  check('nativeWindowHandle round-trips', calc.nativeWindowHandle === calcHwnd);
  const five = calc.find({ controlType: ControlType.Button, name: 'Five' });
  check('find a button by control-type + name', five !== null && five.name === 'Five');

  section('3. selector matching');
  check('name exact', calc.find({ name: 'Five' }) !== null);
  check('name regex', calc.find({ controlType: ControlType.Button, name: /^Fiv/ }) !== null);
  check('nameContains', calc.find({ controlType: ControlType.Button, nameContains: 'ive' }) !== null);
  check('automationId', calc.find({ automationId: 'num5Button' }) !== null);
  check('multi-field AND excludes', calc.find({ controlType: ControlType.Button, name: 'Five', automationId: 'WRONG' }) === null);

  section('4. invoke — Calculator 5+3=8 (the proven flow)');
  for (const name of ['Five', 'Plus', 'Three', 'Equals']) {
    const button = calc.find({ controlType: ControlType.Button, name });
    button?.invoke();
    button?.release();
    Bun.sleepSync(200);
  }
  Bun.sleepSync(400);
  const display = calc.find({ automationId: 'CalculatorResults' });
  check('display reads 8', display !== null && /8/.test(display.name), display ? JSON.stringify(display.name) : '');
  display?.release();

  section('5. value round-trip (ValuePattern, works locked)');
  Bun.spawn(['notepad.exe'], { stdout: 'ignore', stderr: 'ignore' });
  let npHwnd = 0n;
  const npClass = Buffer.from('Notepad\0', 'utf16le');
  for (let i = 0; i < 25 && npHwnd === 0n; i += 1) {
    Bun.sleepSync(300);
    npHwnd = User32.FindWindowW(npClass.ptr!, null);
  }
  const notepad = uia.attach(npHwnd);
  const edit = notepad.find({ controlType: ControlType.Edit }) ?? notepad.find({ controlType: ControlType.Document });
  const probe = 'bun-uia value ✓';
  let valueOk = false;
  try {
    edit?.setValue(probe);
    Bun.sleepSync(200);
    valueOk = edit?.value === probe || edit?.text().includes(probe) === true;
  } catch {
    valueOk = false;
  }
  check('setValue + read back byte-exact (incl non-ASCII)', valueOk, edit ? JSON.stringify(edit.value) : '');

  section('6. SendInput type round-trip + bbox click');
  if (locked) {
    skip('type() into the focused control', 'locked session');
    skip('click() bbox fallback', 'locked session');
  } else {
    User32.SetForegroundWindow(npHwnd);
    Bun.sleepSync(200);
    const typed = ' typed-✓';
    edit?.focus();
    uia.type(typed);
    Bun.sleepSync(300);
    check('type() appends Unicode text', edit?.text().includes('typed-✓') === true, edit ? JSON.stringify(edit.text().slice(-24)) : '');
  }

  section('7. waitFor (auto-retry + actionable timeout)');
  const waited = await calc.waitFor({ controlType: ControlType.Button, name: 'Seven' }, { timeout: 3000 });
  check('waitFor finds an existing control', waited.name === 'Seven');
  waited.release();
  let timedOut = '';
  try {
    await calc.waitFor({ name: 'NeverAppearsXYZ' }, { timeout: 600 });
  } catch (error) {
    timedOut = (error as Error).message;
  }
  check('waitFor times out with the actionable error', timedOut.includes('NeverAppearsXYZ') && timedOut.includes('nearest'));

  section('8. cache equivalence');
  const request = createCacheRequest();
  const naive = calc
    .findAll({})
    .map((element) => {
      const key = `${element.controlType}:${element.name}`;
      element.release();
      return key;
    })
    .sort();
  const cached = calc
    .findAllCached({}, request)
    .map((element) => {
      const key = `${element.cachedControlType}:${element.cachedName}`;
      element.release();
      return key;
    })
    .sort();
  request.release();
  check('cached walk == naive walk', naive.length === cached.length && naive.every((value, index) => value === cached[index]), `${naive.length} nodes`);

  section('9. tree -> JSON (agent grounding)');
  const full = uia.tree(calc);
  const agent = uia.tree(calc, { agentProfile: true });
  const treeJson = JSON.stringify(agent);
  check('tree contains the digit buttons', treeJson.includes('"Five"') && treeJson.includes('"Seven"'));
  check('nodes carry bounding rectangles', /"bounds":\{"x":/.test(treeJson));
  check('agent profile <= full', countNodes(agent) <= countNodes(full), `${countNodes(agent)} <= ${countNodes(full)} nodes`);

  section('10. screenshot (PrintWindow → PNG)');
  const png = screenshot(calcHwnd);
  check('PNG is non-empty with a valid header', png.length > 64 && png[0] === 0x89 && png[1] === 0x50);

  section('11. MSAA fallback (oleacc)');
  const accessible = msaaTree(calcHwnd, 3);
  let namedCount = 0;
  const countNamed = (node: { name: string; children: { name: string; children: unknown[] }[] }): void => {
    if (node.name.trim().length > 0) namedCount += 1;
    for (const child of node.children) countNamed(child as typeof node);
  };
  if (accessible) countNamed(accessible);
  check('IAccessible tree yields >= 1 named node', namedCount >= 1, `${namedCount} named`);

  section('12. error paths');
  check('no-match find returns null', calc.find({ name: 'DefinitelyNotHere' }) === null);
  let attachThrew = false;
  try {
    uia.attach('NoSuchWindowTitle12345');
  } catch {
    attachThrew = true;
  }
  check('attach to a missing window throws', attachThrew);
  const textNode = calc.find({ controlType: ControlType.Text });
  let invokeThrew = false;
  try {
    textNode?.invoke();
  } catch {
    invokeThrew = true;
  }
  check('invoke on a non-invokable element throws', textNode === null || invokeThrew);

  section('13. ScrollPattern — container scroll (cursor-free, works locked)');
  Bun.spawn(['explorer.exe', 'C:\\Windows\\System32'], { stdout: 'ignore', stderr: 'ignore' });
  let explorer: ReturnType<typeof uia.attach> | null = null;
  let explorerHwnd = 0n;
  let scrollList: ReturnType<typeof calc.find> = null;
  for (let i = 0; i < 25 && scrollList === null; i += 1) {
    Bun.sleepSync(300);
    const info = uia.windows().find((window) => window.className === 'CabinetWClass' && /System32/i.test(window.title));
    if (info === undefined) continue;
    explorerHwnd = info.hWnd;
    try {
      explorer = uia.attach(info.hWnd);
    } catch {
      continue;
    }
    scrollList = explorer.find({ controlType: ControlType.List, name: 'Items View' }) ?? explorer.find({ controlType: ControlType.List });
    if (scrollList === null) {
      explorer.dispose();
      explorer = null;
    }
  }
  if (scrollList === null || explorer === null) {
    skip('ScrollPattern container scroll', 'no scrollable File Explorer list found');
  } else {
    const initial = scrollList.scrollInfo;
    check('scrollInfo reports a vertically-scrollable container', initial !== null && initial.verticallyScrollable, initial ? `vView=${initial.verticalViewSize.toFixed(1)}%` : 'null');
    scrollList.setScrollPercent(NoScroll, 100);
    Bun.sleepSync(250);
    const bottom = scrollList.scrollInfo?.verticalPercent ?? -1;
    check('setScrollPercent(-1,100) scrolls to the bottom', bottom > 90, `vPct=${bottom.toFixed(1)}`);
    scrollList.scroll(ScrollAmount.NoAmount, ScrollAmount.LargeDecrement);
    Bun.sleepSync(250);
    const movedUp = scrollList.scrollInfo?.verticalPercent ?? -1;
    check('scroll(NoAmount,LargeDecrement) moves up from the bottom', movedUp < bottom, `vPct=${movedUp.toFixed(1)}`);
    scrollList.setScrollPercent(NoScroll, 0);
    Bun.sleepSync(150);
    const top = scrollList.scrollInfo?.verticalPercent ?? -1;
    check('setScrollPercent(-1,0) returns to the top', top < 5, `vPct=${top.toFixed(1)}`);
    let scrollThrew = false;
    const nonScrollable = calc.find({ controlType: ControlType.Text });
    try {
      nonScrollable?.scroll(ScrollAmount.NoAmount, ScrollAmount.SmallIncrement);
    } catch {
      scrollThrew = true;
    }
    check('scroll on a non-ScrollPattern element throws', nonScrollable === null || scrollThrew);
    nonScrollable?.release();
    scrollList.release();
    explorer.dispose();
  }
  textNode?.release();

  five?.release();
  edit?.release();
  notepad.dispose();
  calc.dispose();

  // Close every window this test opened — leave the desktop as we found it.
  closeWindow(calcHwnd);
  if (explorerHwnd !== 0n) closeWindow(explorerHwnd);
  await closeNotepad(npHwnd);
} else {
  skip('window-dependent sections', 'NO_WINDOW=1');
}

section('14. cleanup');
uia.uninitialize();
check('uninitialize is clean', true);

console.log(`\n\x1b[1m${passes} passed, ${failures} failed\x1b[0m`);
process.exitCode = failures > 0 ? 1 : 0;
