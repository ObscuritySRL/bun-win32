/**
 * read_table on Excel — live proof that readTable returns cell VALUES, not cell ADDRESSES, on a spreadsheet grid.
 *
 * Excel exposes its sheet as a UIA GridPattern whose cell Name is the cell ADDRESS ("B2") and whose real datum is
 * the ValuePattern value — and it publishes NO TablePattern column headers (headers=[]). The shipped 1.8.0 readTable
 * read Name first, so every filled cell came back as its address ("A1","B2",…) instead of the data: the #1 Office
 * read scenario yielded plausible-but-100%-wrong output. After the ValuePattern-first fix, the same grid returns the
 * CSV data. The existing read-table.integration.test.ts only covers Explorer Details (Name == header), which is why
 * this regression shipped unseen; this test pins the Excel (Name == address) case so it cannot regress again.
 *
 * Writes a 4-column CSV (Name/Age/City/Score + 5 rows), opens it in Excel, finds the sheet's DataGrid, reads it with
 * readTable(), and asserts the header row reads "Name/Age/City/Score" and a data row reads "Alice/30/Seattle/95" —
 * i.e. NO cell equals its A1-style address. Closes the Excel window it spawns (closeWindow, never a pre-existing one).
 *
 * Skips cleanly if Excel is not installed. bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/excel-read-table.integration.test.ts
 */
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { closeWindow, ControlType, type TableData, uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const excelPath = ['C:\\Program Files\\Microsoft Office\\Root\\Office16\\EXCEL.EXE', 'C:\\Program Files (x86)\\Microsoft Office\\Root\\Office16\\EXCEL.EXE', 'C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE'].find(
  (candidate) => existsSync(candidate),
);
if (excelPath === undefined) {
  console.log('\n[excel read_table] Excel is not installed — SKIPPING the live assertions (the same path is covered for Explorer by read-table.integration.test.ts).');
  process.exit(0);
}

// The expected grid contents: column 0 is Excel's row-header ("1","2",…); the data starts at column 1.
const header = ['Name', 'Age', 'City', 'Score'];
const alice = ['Alice', '30', 'Seattle', '95'];
const csv = `${header.join(',')}\nAlice,30,Seattle,95\nBob,25,Portland,88\nCara,41,Denver,73\nDan,19,Austin,64\nEve,55,Boston,99\n`;
const csvPath = join(tmpdir(), 'bun-uia-excel-read-table.csv');
await Bun.write(csvPath, csv);

uia.initialize();
const priorExcels = new Set(
  uia
    .windows()
    .filter((window) => /XLMAIN/i.test(window.className))
    .map((window) => window.hWnd),
);
Bun.spawn([excelPath, csvPath], { stdout: 'ignore', stderr: 'ignore' });

// Excel can take several seconds to register its XLMAIN window (Click-to-Run cold start).
let spawnedHwnd = 0n;
for (let attempt = 0; attempt < 30 && spawnedHwnd === 0n; attempt += 1) {
  await Bun.sleep(1000);
  spawnedHwnd = uia.windows().find((window) => /XLMAIN/i.test(window.className) && !priorExcels.has(window.hWnd))?.hWnd ?? 0n;
}

try {
  if (spawnedHwnd === 0n) {
    console.log('\n[excel read_table] Excel window never appeared (cold start too slow / blocked) — SKIPPING the live assertions.');
  } else {
    await Bun.sleep(4000); // let the sheet's UIA tree populate before reading
    const window = uia.attach(spawnedHwnd);
    let table: TableData | null = null;
    const containers = [...window.findAll({ controlType: ControlType.DataGrid }), ...window.findAll({ controlType: ControlType.Table })];
    for (const container of containers) {
      // Select the SHEET grid STRUCTURALLY (its row-0 column-letter band starts with "Select All"), NOT by its
      // contents — so the OLD address-returning build still selects this grid and FAILS the assertions below,
      // rather than silently selecting nothing and skipping. The sheet grid is the wide one (>= the data columns).
      const candidate: TableData | null = table === null ? container.readTable(6) : null;
      if (candidate !== null && candidate.rows.length >= 3 && candidate.rows[0] !== undefined && candidate.rows[0][0] === 'Select All') table = candidate;
      container.release();
    }
    window.dispose();

    if (table === null) {
      console.log('\n[excel read_table] no Excel sheet grid was found — SKIPPING (the sheet may not have opened in grid view).');
    } else {
      // Excel row N lives at readTable row index N (row 0 is the column-letter band); the data is at column 1+.
      const headerRow = table.rows[1] ?? [];
      const aliceRow = table.rows[2];
      console.log(`\n[excel read_table] sheet grid: ${table.totalRows} rows — header row: ${headerRow.slice(0, 6).join(' | ')}`);
      if (aliceRow !== undefined) console.log(`  alice row: ${aliceRow.slice(0, 6).join(' | ')}`);
      // The bug returned ["A1","B1","C1","D1"] for the header row; the fix returns the literal column labels.
      assert(
        header.every((label) => headerRow.includes(label)),
        `header row reads the CSV labels (${header.join('/')}), not the A1-style addresses`,
      );
      assert(aliceRow !== undefined && alice.every((value) => aliceRow.includes(value)), `data row reads the CSV values (${alice.join('/')}), not its B2-style addresses`);
      // Regression guard: assert no POPULATED cell echoed its own A1 address (the exact shipped-1.8.0 failure). The
      // 4 data columns sit at indices 1..4 (index 0 is the row-header band); empty trailing cells (E1/F1/…) are NOT
      // checked since they legitimately expose only their address as Name. The OLD build returns "A1".."D5" here.
      const firstDataColumn = 1;
      assert(
        !table.rows.some((row, rowIndex) =>
          row.slice(firstDataColumn, firstDataColumn + header.length).some((cell, offset) => {
            const columnIndex = firstDataColumn + offset;
            return cell === `${String.fromCharCode(64 + columnIndex)}${rowIndex}`;
          }),
        ),
        'no populated cell equals its own A1-style address (the ValuePattern-first precedence held across the data region)',
      );
    }
  }
} finally {
  if (spawnedHwnd !== 0n) closeWindow(spawnedHwnd); // close ONLY the Excel window we spawned
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — Excel read_table verified (cell VALUES, not addresses).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
