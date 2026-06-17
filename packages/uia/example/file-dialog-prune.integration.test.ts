/**
 * file-dialog-prune — a File Open/Save dialog (the modern IFileDialog) renders its file list in Details view as
 * ListItem rows EACH carrying 4+ child `Edit` "cells" whose automationId is a System.* property-system key
 * (System.ItemNameDisplay / DateModified / ItemTypeText / Size) duplicating the row's filename + columns. On a busy
 * folder (System32) those ~70+ cells bloat the rendered snapshot past SNAPSHOT_MAX_CHARS (8000), so the cap truncates
 * the Open and Cancel buttons (which render AFTER the list) off the tree — the agent literally cannot see how to
 * confirm/dismiss the dialog. pruneRefTree now drops the READ-ONLY display-column cells (leaf System.* Edits under a
 * row: DateModified/ItemTypeText/Size) while KEEPING the writable System.ItemNameDisplay name cell and the sortable
 * column-header SplitButtons — render-only: dropped cells keep their ref (resolveRef) + Set-of-Marks entry; the row
 * keeps the filename; the column VALUES remain readable via read_table on the list.
 *
 * Proof: open a real OpenFileDialog at System32, run the EXACT production render path
 * (pruneRefTree → renderSnapshot → capSnapshot@8000), and assert Open + Cancel survive the cap, the body is no longer
 * truncated, the file ListItems keep their names, and the real File-name / Search inputs are NOT over-pruned. Dialog closed.
 *
 * bun test is broken repo-wide — runnable harness (spawned PowerShell OpenFileDialog):
 * Run: bun run example/file-dialog-prune.integration.test.ts
 */
import { capSnapshot, closeWindow, pruneRefTree, renderSnapshot, type Snapshot, uia, type Window } from '@bun-win32/uia';

const SNAPSHOT_MAX_CHARS = 8_000; // mirrors mcp.ts

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
const before = new Set(uia.windows({ includeUntitled: true }).map((w) => w.hWnd));
Bun.spawn(['powershell', '-NoProfile', '-Command', "Add-Type -AssemblyName System.Windows.Forms; $f=New-Object System.Windows.Forms.OpenFileDialog; $f.InitialDirectory='C:\\Windows\\System32'; [void]$f.ShowDialog()"], {
  stdout: 'ignore',
  stderr: 'ignore',
});

let hWnd = 0n;
for (let i = 0; i < 40 && hWnd === 0n; i++) {
  await Bun.sleep(250);
  hWnd = uia.windows({ includeUntitled: true }).find((w) => !before.has(w.hWnd) && (w.className === '#32770' || w.title === 'Open'))?.hWnd ?? 0n;
}

let dialog: Window | null = null;
let snap: Snapshot | null = null;
try {
  if (hWnd === 0n) {
    console.log('  skip(live): no Open dialog appeared');
  } else {
    await Bun.sleep(1500); // let the file list populate
    dialog = uia.attach(hWnd);
    snap = uia.snapshot(dialog);

    // pre-fix shape (no prune): the raw render is large enough that the cap truncates Open/Cancel
    const raw = capSnapshot(renderSnapshot(snap.tree), SNAPSHOT_MAX_CHARS);
    assert(raw.includes('more nodes') && !/Button "Open"/.test(raw), 'WITHOUT the prune, the cap truncates Open off the tree (reproduces the gap)');

    // production path (with prune)
    const body = capSnapshot(renderSnapshot(pruneRefTree(snap.tree) ?? snap.tree), SNAPSHOT_MAX_CHARS);
    assert(!body.includes('more nodes'), 'pruned snapshot is no longer truncated by the cap');
    assert(/Button "Open"/.test(body), 'the Open button survives the cap');
    assert(/Button "Cancel"/.test(body), 'the Cancel button survives the cap');
    assert(/ListItem "[^"]+"/.test(body), 'file ListItems retain their filenames (not over-pruned)');
    assert(/Edit "File name:"/.test(body) || /id=1148/.test(body), 'the real File-name input is kept');
    assert(
      !/Edit "[^"]*"[^\n]*id=System\.DateModified/.test(body) && !/Edit "[^"]*"[^\n]*id=System\.ItemTypeText/.test(body) && !/Edit "[^"]*"[^\n]*id=System\.Size/.test(body),
      'the READ-ONLY System.* display-column cell Edits (DateModified/Type/Size) are pruned from the render',
    );
    assert(/Edit "[^"]*"[^\n]*id=System\.ItemNameDisplay/.test(body), 'the WRITABLE System.ItemNameDisplay name cell is KEPT (cursor-free in-place rename/set-value surface — never hide a writable input)');
    assert(/SplitButton "[^"]*"[^\n]*id=System\./.test(body), 'the real System.* column-HEADER controls (sortable SplitButtons) are KEPT — the prune is surgical, not a blanket System.* drop');
  }
} finally {
  snap?.dispose();
  dialog?.dispose();
  if (hWnd !== 0n) closeWindow(hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — file-dialog Details-view cell echo pruned; Open/Cancel survive the snapshot cap.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
