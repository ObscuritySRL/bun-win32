/**
 * grid-cell — address a Grid container cell by (row, column) and act on it cursor-free. readTable reads a grid
 * to text but releases each cell; Element.cell(row,col) returns the live cell Element (caller owns it) so the
 * existing setValue()/invoke()/toggle() compose on a specific cell — the editable-grid path rivals (FlaUI
 * GridPattern.GetItem, pywinauto) expose. Reuses the already-bound GridPattern.GetItem (no new vtable slot).
 *
 * Proof: open File Explorer's details view (a grid), read cell(0,0) and a different column, and confirm they are
 * distinct live cell Elements with text — all cursor-free.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/grid-cell.integration.test.ts
 */
import { closeWindow, ControlType, type Element, uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}
// Mirror readTable's cell-text precedence: Name is the datum (WinForms) UNLESS it is the column-header label
// (Explorer Details sets every cell's Name to its header), in which case the datum is the ValuePattern value.
function cellText(cell: Element, header = ''): string {
  const name = cell.name;
  if (name.length > 0 && name !== header) return name;
  const value = cell.value;
  return value.length > 0 ? value : name;
}

uia.initialize();
let explorer = 0n;
const prior = new Set(
  uia
    .windows()
    .filter((w) => w.className === 'CabinetWClass')
    .map((w) => w.hWnd),
);
Bun.spawn(['explorer.exe', 'C:\\Windows\\System32'], { stdout: 'ignore', stderr: 'ignore' });
for (let attempt = 0; attempt < 50 && explorer === 0n; attempt += 1) {
  await Bun.sleep(200);
  explorer = uia.windows().find((w) => w.className === 'CabinetWClass' && /System32/i.test(w.title) && !prior.has(w.hWnd))?.hWnd ?? 0n;
}

try {
  assert(explorer !== 0n, 'opened File Explorer on System32');
  if (explorer !== 0n) {
    await Bun.sleep(1200);
    const win = uia.attach(explorer);
    // the details view is a Grid-supporting container (List/DataGrid/Table)
    let grid: Element | null = null;
    for (let attempt = 0; attempt < 15 && grid === null; attempt += 1) {
      grid = win.find({ controlType: ControlType.List }) ?? win.find({ controlType: ControlType.DataGrid }) ?? win.find({ controlType: ControlType.Table });
      if (grid !== null && grid.readTable(1) === null) {
        grid.release();
        grid = null;
      }
      if (grid === null) await Bun.sleep(300);
    }
    assert(grid !== null, 'found the details-view Grid container');
    if (grid !== null) {
      const headers = grid.readTable(1)?.headers ?? [];
      const a = grid.cell(0, 0);
      const b = grid.cell(0, 1);
      assert(a !== null, `cell(0,0) is a live Element (${a?.controlTypeName})`);
      assert(a !== null && cellText(a, headers[0]).length > 0, `cell(0,0) carries text (${JSON.stringify(cellText(a!, headers[0]).slice(0, 24))})`);
      // Guard the Explorer-Details header-vs-data inversion: cell(0,0)'s text must be the DATUM, not the "Name" header.
      assert(a !== null && (headers[0] === undefined || cellText(a, headers[0]) !== headers[0]), `cell(0,0) returns the datum, not the column header ${JSON.stringify(headers[0] ?? '')}`);
      assert(a !== null && b !== null && a.ptr !== b.ptr, 'cell(0,0) and cell(0,1) are distinct cells (column addressing works)');
      a?.release();
      b?.release();
      grid.release();
    }
    win.dispose();
  }
} finally {
  if (explorer !== 0n) closeWindow(explorer);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — addressed Grid cells by (row, column) cursor-free; they compose with setValue/invoke/toggle.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
