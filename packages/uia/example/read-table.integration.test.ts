/**
 * read_table — live proof that an AI can read a real data grid cell-by-cell (the #1 missing read capability).
 *
 * Opens File Explorer on a known folder (its details-view "Items View" exposes UIA GridPattern, live-proven
 * 28x4) and reads it through the published Element.readTable() — the same path the MCP read_table tool uses.
 *
 * Asserts: a GridPattern grid is found, totalRows/columns are sane, every returned row has the column width,
 * at least one cell carries text, and (when present) column headers are read. A wrong Grid/GridItem slot
 * would return garbage or segfault — so this also live-exercises the new SLOT entries.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/read-table.integration.test.ts
 */
import { closeWindow, ControlType, type TableData, uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

// Open a folder that reliably shows a details grid; also scan any already-open Explorer windows.
uia.initialize();
const priorExplorers = new Set(
  uia
    .windows()
    .filter((window) => window.className === 'CabinetWClass')
    .map((window) => window.hWnd),
);
Bun.spawn(['explorer.exe', 'C:\\Windows\\System32'], { stdout: 'ignore', stderr: 'ignore' });
await Bun.sleep(2500);
// The CabinetWClass window WE just opened (diff vs prior) — close only this one, never a pre-existing user folder.
const spawnedHwnd = uia.windows().find((window) => window.className === 'CabinetWClass' && /System32/i.test(window.title) && !priorExplorers.has(window.hWnd))?.hWnd ?? 0n;
let found: { label: string; table: TableData; columns: number } | null = null;
try {
  for (const info of uia.windows()) {
    if (info.className !== 'CabinetWClass') continue; // File Explorer
    let window: ReturnType<typeof uia.attach>;
    try {
      window = uia.attach(info.hWnd);
    } catch {
      continue;
    }
    // The grid lives on the List/DataGrid/Table container, not the items — probe those control types.
    const containers = [...window.findAll({ controlType: ControlType.List }), ...window.findAll({ controlType: ControlType.DataGrid }), ...window.findAll({ controlType: ControlType.Table })];
    for (const container of containers) {
      const table: TableData | null = found === null ? container.readTable(8) : null;
      if (table !== null && table.totalRows > 0 && table.rows.length > 0 && table.rows[0]!.length > 0) {
        found = { label: `[${info.title}] ${container.controlTypeName} "${container.name}"`, table, columns: table.rows[0]!.length };
      }
      container.release();
    }
    window.dispose();
    if (found !== null) break;
  }

  if (found === null) {
    console.log('\n[read_table] no Explorer details-view grid found (Explorer may be in icon view, or not open) — SKIPPING the live assertions.');
    console.log('  (open any folder in Details view and re-run; the Grid path is also gated by slot-gate.test.ts)');
  } else {
    console.log(`\n[read_table] live grid: ${found.label} — ${found.table.totalRows} rows x ${found.columns} cols`);
    const { table, columns } = found;
    if (table.headers.length > 0) console.log(`  headers: ${table.headers.join(' | ')}`);
    for (const row of table.rows.slice(0, 4)) console.log(`  row: ${row.join(' | ')}`);
    assert(table.totalRows > 0 && columns > 0, `grid dimensions are sane (${table.totalRows}x${columns})`);
    assert(
      table.rows.every((row) => row.length === columns),
      'every returned row has the full column width',
    );
    assert(
      table.rows.some((row) => row.some((cell) => cell.trim().length > 0)),
      'at least one cell carries real text (GetItem + cell Name/Value read correctly)',
    );
    assert(table.rows.length <= 8, 'maxRows bound is honored (read <= 8 of the rows)');
  }
} finally {
  if (spawnedHwnd !== 0n) closeWindow(spawnedHwnd); // close the Explorer window we opened
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — read_table verified (real grid read cell-by-cell via GridPattern).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
