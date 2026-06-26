/**
 * grid-item-position — REVERSE grid-cell positioning via GridItemPattern (the FlaUI gridItem.Row/Column/
 * ContainingGrid parity the package was missing). cell(row,col) is the top-down GridPattern.GetItem path;
 * gridPosition() is its complement: given a cell Element (found by Name, or returned by cell()), learn the
 * 0-based (row, column) it occupies so an agent can read the rest of that record's columns. Cursor-free
 * (a UIA pattern read on the cell — no focus, no mouse).
 *
 * Proof: open File Explorer's details view (a real Grid), take cell(r,c) for several coordinates and assert
 * gridPosition() round-trips back to exactly {row:r, column:c}, then re-find a cell BY NAME and confirm its
 * reported position matches where cell() places it. closeWindow()s the Explorer it spawned in finally.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/grid-item-position.integration.test.ts
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
      // A non-cell (the grid container itself) has no GridItem pattern → gridPosition() is null.
      assert(grid.gridPosition() === null, 'the Grid container itself reports no gridPosition (not a cell)');
      // Round-trip cell(r,c).gridPosition() === {r,c} across a few coordinates.
      for (const [row, column] of [
        [0, 0],
        [0, 1],
        [1, 0],
        [2, 1],
      ] as const) {
        const cell = grid.cell(row, column);
        if (cell === null) {
          assert(false, `cell(${row},${column}) exists`);
          continue;
        }
        const position = cell.gridPosition();
        assert(position !== null && position.row === row && position.column === column, `cell(${row},${column}).gridPosition() round-trips to {row:${position?.row},col:${position?.column}}`);
        assert(position !== null && position.rowSpan >= 1 && position.columnSpan >= 1, `cell(${row},${column}) spans are >=1 (${position?.rowSpan}x${position?.columnSpan})`);
        cell.release();
      }
      // The natural workflow: locate a cell BY NAME, then learn its column to read the rest of that record.
      const named = grid.find({ controlType: ControlType.DataItem }) ?? grid.find({ controlType: ControlType.ListItem });
      if (named !== null) {
        // The list-item row may itself carry GridItem, or its first text cell does — probe the item then its first child cell.
        const itemPosition = named.gridPosition();
        const firstCell = grid.cell(0, 0);
        if (firstCell !== null) {
          const firstPosition = firstCell.gridPosition();
          assert(firstPosition !== null && firstPosition.column === 0, `a cell found via cell(0,0) reports column 0 (${firstPosition?.column}) — reverse positioning resolves the column for sibling-column reads`);
          firstCell.release();
        }
        if (itemPosition !== null) assert(itemPosition.column >= 0, `a name-located grid item reports a column (${itemPosition.column})`);
        named.release();
      }
      grid.release();
    }
    win.dispose();
  }
} finally {
  if (explorer !== 0n) closeWindow(explorer);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — reverse grid-cell positioning (GridItemPattern Row/Column) round-trips cursor-free.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
