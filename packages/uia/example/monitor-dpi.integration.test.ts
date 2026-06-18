/**
 * Monitor DPI/scale — proves listMonitors() carries per-monitor effective DPI and scale, not just bounds.
 *
 * On a mixed-DPI rig (a 150% 4K laptop next to a 100% 1080p external) an agent given only physical bounds
 * cannot map a logical screenshot the user sees to a physical click: it needs each monitor's scale to pick
 * the right factor. This drives the REAL EnumDisplayMonitors + Shcore.GetDpiForMonitor FFI path (no window
 * launched, nothing to clean up) and asserts every monitor reports a numeric dpi and scale === dpi/96.
 *
 * bun test is broken repo-wide — runnable harness:
 * Run: bun run example/monitor-dpi.integration.test.ts
 */
import { listMonitors } from '../input/coords';

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}
function ok(message: string): void {
  console.log(`  ok: ${message}`);
}

const monitors = listMonitors();
if (monitors.length === 0) fail('listMonitors() returned no monitors — EnumDisplayMonitors did not enumerate');
ok(`enumerated ${monitors.length} monitor(s)`);

for (const monitor of monitors) {
  if (typeof monitor.dpi !== 'number' || !Number.isFinite(monitor.dpi) || monitor.dpi <= 0) fail(`monitor ${monitor.handle} dpi must be a positive number (saw ${JSON.stringify(monitor.dpi)})`);
  if (typeof monitor.scale !== 'number' || monitor.scale !== monitor.dpi / 96) fail(`monitor ${monitor.handle} scale must equal dpi/96 (dpi=${monitor.dpi}, scale=${monitor.scale})`);
}
ok('every monitor carries a positive dpi and scale === dpi/96');

if (!monitors.some((monitor) => monitor.primary)) fail('no monitor flagged primary — MONITORINFOF_PRIMARY not decoded');
ok('a primary monitor is flagged');

for (const monitor of monitors) console.log(`  monitor ${monitor.handle}${monitor.primary ? ' (primary)' : ''} ${monitor.bounds.width}x${monitor.bounds.height} dpi=${monitor.dpi} scale=${monitor.scale}x`);

console.log('\nPASS — listMonitors() surfaces per-monitor dpi/scale for mixed-DPI coordinate mapping.');
process.exit(0);
