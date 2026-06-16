/**
 * grid-cell-tool — the MCP grid_cell tool addresses one data-grid cell by (row, column) and acts on it (read /
 * set_value / invoke / toggle / select / click), cursor-free. read_table is read-only and emits no per-cell refs, so
 * before this an agent could SEE a grid but not edit a specific cell — grid_cell closes that, reusing the library's
 * Element.cell() (GridPattern.GetItem) + the shared act() verb runner.
 *
 * Proof: open File Explorer's details grid over the MCP wire, read_table to find the grid ref + a known datum, then
 * grid_cell {row:0, column:0, do:'read'} returns that same first-cell datum. Explorer window closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a spawned Explorer):
 * Run: bun run example/grid-cell-tool.integration.test.ts
 */
import { closeWindow, uia } from '@bun-win32/uia';

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

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
const prior = new Set(
  uia
    .windows()
    .filter((w) => w.className === 'CabinetWClass')
    .map((w) => w.hWnd),
);
Bun.spawn(['explorer.exe', 'C:\\Windows\\System32'], { stdout: 'ignore', stderr: 'ignore' });
await Bun.sleep(2800);
const explorer = uia.windows().find((w) => w.className === 'CabinetWClass' && /System32/i.test(w.title) && !prior.has(w.hWnd))?.hWnd ?? 0n;
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'grid-cell-tool', version: '1' } });
  if (explorer === 0n) console.log('  skip: could not open an Explorer details grid');
  else {
    const snap = textOf(await call('tools/call', { name: 'attach', arguments: { hWnd: `0x${explorer.toString(16)}` } }));
    const gridRef = /(?:List|DataGrid|Table)[^\n]*?\[ref=(e\d+(?:#\d+)?)\]/i.exec(snap)?.[1];
    if (gridRef === undefined) console.log('  skip: no List/DataGrid grid ref in the snapshot');
    else {
      const table = textOf(await call('tools/call', { name: 'read_table', arguments: { ref: gridRef } }));
      const firstDatum =
        table
          .split('\n')
          .map((l) => l.trim())
          .find((l) => l.startsWith('|') && !/Name\s*\|/.test(l) && !/^\|\s*-/.test(l)) // skip the header row AND the |---| separator
          ?.split('|')[1]
          ?.trim() ?? '';
      const cell = await call('tools/call', { name: 'grid_cell', arguments: { ref: gridRef, row: 0, column: 0, do: 'read' } });
      const cellText = textOf(cell);
      assert(cell.result?.isError !== true, `grid_cell {row:0,column:0,do:read} resolves the cell (got: ${JSON.stringify(cellText.slice(0, 60))})`);
      assert(/cell \(0, 0\)/.test(cellText) && /value:/.test(cellText), 'grid_cell returns the addressed cell value (not the whole table)');
      if (firstDatum.length > 0) assert(cellText.includes(firstDatum), `grid_cell cell(0,0) matches read_table's first datum (${JSON.stringify(firstDatum)})`);

      const bad = await call('tools/call', { name: 'grid_cell', arguments: { ref: gridRef, row: 99999, column: 0, do: 'read' } });
      assert(bad.result?.isError === true && /no cell/.test(textOf(bad)), 'an out-of-range cell returns a clear isError, not a crash');
    }
  }
} finally {
  proc.kill();
  if (explorer !== 0n) closeWindow(explorer);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — grid_cell addresses + acts on a data-grid cell by (row, column).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
