/**
 * Window spy + pixel match — bun-uia beyond the accessibility tree.
 *
 * Dumps a window's NATIVE HWND tree (class, control id, decoded WS_* / WS_EX_* styles, rect) like
 * Spy++ / Winspector — the structure UIA hides and the classic-Win32 controls it misses — then
 * captures the full screen and locates a sub-region back on it by template match (the nut.js
 * "find image on screen" for surfaces with no a11y tree). One zero-dep package covering the a11y,
 * pixel, and window-spy niches at once.
 *
 * APIs demonstrated:
 * - windowTree / renderWindowTree / windowStyles (native HWND introspection, @bun-win32/uia)
 * - captureScreen, locateOnScreen (full-screen capture + template matching)
 *
 * Run: bun run example/window-spy.ts            (defaults to the first listed window)
 *      bun run example/window-spy.ts "Notepad"  (any title/class substring)
 */
import { captureScreen, locateOnScreen, renderWindowTree, uia, windowStyles, windowTree } from '@bun-win32/uia';

uia.initialize();
const wanted = Bun.argv[2];
const windows = uia.windows();
const target = wanted !== undefined ? windows.find((window) => window.title.includes(wanted) || window.className.includes(wanted)) : windows[0];
if (target === undefined) {
  console.log('no matching window');
  process.exit(0);
}

console.log(`\n\x1b[1m\x1b[95m  Native HWND tree\x1b[0m  0x${target.hWnd.toString(16)} "${target.title}" [${target.className}]`);
console.log(`  styles: ${windowStyles(target.hWnd).styles.join(' | ')}`);
console.log(
  renderWindowTree(windowTree(target.hWnd, 4))
    .split('\n')
    .slice(0, 18)
    .map((line) => `  ${line}`)
    .join('\n'),
);

const screen = captureScreen();
const needle = captureScreen({ x: screen.originX + 400, y: screen.originY + 300, width: 64, height: 32 });
const start = Bun.nanoseconds();
const found = locateOnScreen(needle, { threshold: 0.9 });
console.log(`\n\x1b[1m\x1b[95m  Pixel template match\x1b[0m  ${screen.width}x${screen.height} screen`);
console.log(`  located the (400,300) region at ${JSON.stringify(found)} in ${((Bun.nanoseconds() - start) / 1e6).toFixed(0)} ms  (score 1 = exact)`);

uia.uninitialize();
process.exit(0);
