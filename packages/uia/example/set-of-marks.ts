/**
 * Set-of-Marks — the grounding format computer-use agents converge on, derived FREE from UIA bounds.
 *
 * Snapshots a window's accessibility tree, assigns a stable [ref=eN] to every interactable control,
 * and draws numbered boxes over their bounds onto a PrintWindow screenshot — the screenshot+marks
 * observation Set-of-Mark / UFO2 / Windows Agent Arena show lifts task success (+57% from UIA-derived
 * marks on WAA), here with no vision model at all. Also prints the ref-keyed tree (the Playwright-MCP
 * analog) an agent acts on by ref.
 *
 * APIs demonstrated:
 * - uia.snapshot / renderSnapshot (ref-keyed tree, @bun-win32/uia)
 * - screenshotWithMarks (Set-of-Marks overlay), uia.waitForIdle (settle)
 *
 * Run: bun run example/set-of-marks.ts            (defaults to Calculator)
 *      bun run example/set-of-marks.ts "Settings" (any window title)
 */
import { renderSnapshot, screenshotWithMarks, uia } from '@bun-win32/uia';

const title = Bun.argv[2] ?? 'Calculator';
uia.initialize();
if (title === 'Calculator') {
  Bun.spawn(['cmd', '/c', 'start', 'calc'], { stdout: 'ignore', stderr: 'ignore' });
  await Bun.sleep(1500);
}

const app = (() => {
  try {
    return uia.attach(title);
  } catch {
    return null;
  }
})();
if (app === null) {
  console.log(`\x1b[93mNo window titled "${title}".\x1b[0m`);
  process.exit(0);
}
app.activate();
await uia.waitForIdle(app, { timeout: 4000, quietMs: 350 });

const shot = uia.snapshot(app);
console.log(`\n\x1b[1m\x1b[95m  Set-of-Marks for "${app.name}"\x1b[0m — ${shot.marks.length} interactable controls\n`);
console.log(
  renderSnapshot(shot.tree)
    .split('\n')
    .slice(0, 24)
    .map((line) => `  ${line}`)
    .join('\n'),
);

const marked = screenshotWithMarks(app, shot);
const outputPath = `set-of-marks-${title.toLowerCase().replace(/\W+/g, '-')}.png`;
await Bun.write(outputPath, marked.png);
console.log(`\n  \x1b[92mwrote ${outputPath}\x1b[0m (${marked.png.length} bytes, ${marked.marks.length} numbered boxes — open it and look)`);

shot.dispose();
app.dispose();
uia.uninitialize();
