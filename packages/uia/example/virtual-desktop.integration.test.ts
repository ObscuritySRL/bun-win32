/**
 * virtual-desktop — definitive virtual-desktop placement via IVirtualDesktopManager (the documented Shell COM
 * interface). windowOnCurrentDesktop(hWnd) / windowDesktopId(hWnd) tell whether a window is on the CURRENT virtual
 * desktop and which desktop GUID it lives on — the answer the DWM cloak bit cannot give (cloaked could mean shell-hidden
 * OR on another desktop; this disambiguates). list_windows uses it to mark off-desktop windows definitively.
 *
 * OS WALL (documented, not a defect): the public IVirtualDesktopManager::MoveWindowToDesktop returns E_ACCESSDENIED for
 * a window owned by another process, so PULLING a foreign window across desktops is impossible via the stable API — only
 * detection is exposed. This test proves detection on a real window; the move wall is documented in desktop.ts. Note:
 * the windowOnCurrentDesktop===false branch is not exercised on a single-desktop machine (it is the same COM call
 * returning BOOL=0, code-verified); only the ===true and null paths run here.
 *
 * bun test is broken repo-wide — runnable harness (spawns + closes Notepad):
 * Run: bun run example/virtual-desktop.integration.test.ts
 */
import { closeWindow, uia, windowDesktopId, windowOnCurrentDesktop, windowProcessId } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

uia.initialize();
let notepad: ReturnType<typeof Bun.spawn> | null = null;
let hWnd = 0n;
try {
  notepad = Bun.spawn(['notepad.exe'], { stdout: 'ignore', stderr: 'ignore' });
  for (let i = 0; i < 25 && hWnd === 0n; i++) {
    await Bun.sleep(200);
    hWnd = User32.FindWindowW(Buffer.from('Notepad\0', 'utf16le').ptr!, null);
  }
  if (hWnd === 0n) {
    console.log('  skip(live): Notepad window did not appear');
  } else {
    const onCurrent = windowOnCurrentDesktop(hWnd);
    console.log(`  windowOnCurrentDesktop = ${onCurrent}`);
    assert(onCurrent === true, 'a freshly-launched window is on the CURRENT virtual desktop');

    const id = windowDesktopId(hWnd);
    console.log(`  windowDesktopId = ${id}`);
    assert(id !== null && GUID_RE.test(id), 'windowDesktopId returns a well-formed desktop GUID');
    assert(id !== '00000000-0000-0000-0000-000000000000', 'the desktop GUID is non-zero (a real desktop)');
    assert(windowDesktopId(hWnd) === id, 'the desktop GUID is stable across calls');

    // graceful degradation: an invalid handle must not throw or segfault — the query fails → null
    assert(windowOnCurrentDesktop(0n) === null, 'windowOnCurrentDesktop(invalid handle) returns null (no throw)');
    assert(windowDesktopId(0n) === null, 'windowDesktopId(invalid handle) returns null (no throw)');

    // regression: the cached IVirtualDesktopManager must be RELEASED on uninitialize (the disposer) and re-created on
    // re-init — otherwise this re-query would vcall a freed COM object (use-after-free → segfault).
    uia.uninitialize();
    uia.initialize();
    assert(windowOnCurrentDesktop(hWnd) === true, 'after uninitialize → initialize, windowOnCurrentDesktop still works (no use-after-free)');
  }
} finally {
  const notepadPid = hWnd !== 0n ? windowProcessId(hWnd) : 0;
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  if (hWnd !== 0n) closeWindow(hWnd);
  notepad?.kill();
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — virtual-desktop placement read via IVirtualDesktopManager (detection works; cross-desktop move is the documented OS wall).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
