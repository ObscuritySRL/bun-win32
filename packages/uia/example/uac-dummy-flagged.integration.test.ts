/**
 * uac-dummy-flagged — while a UAC consent is pending, Windows leaves a placeholder window of class
 * "$$$Secure UAP Dummy Window Class" on the NORMAL desktop; the real prompt is on the secure desktop and is undrivable
 * from this session. list_windows used to list that placeholder as an ordinary attachable row, so an agent could attach
 * and stall on it. list_windows now flags it as a UAC consent placeholder.
 *
 * Proof (no real UAC — that would actually stall): register a window with that exact class in this process, then assert
 * the MCP list_windows output flags THAT row (and only that row). Window destroyed + class unregistered in teardown.
 *
 * bun test is broken repo-wide — runnable harness (MCP subprocess + a synthesized placeholder window):
 * Run: bun run example/uac-dummy-flagged.integration.test.ts
 */
import { JSCallback } from 'bun:ffi';
import Kernel32 from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';

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

const CLASS = '$$$Secure UAP Dummy Window Class';
const WS_OVERLAPPEDWINDOW = 0x00cf_0000;
const WS_VISIBLE = 0x1000_0000;
const wide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');
const wndProc = new JSCallback((hWnd: bigint, message: number, wParam: bigint, lParam: bigint) => User32.DefWindowProcW(hWnd, message, wParam, lParam), { args: ['u64', 'u32', 'u64', 'i64'], returns: 'i64' });
const hInstance = Kernel32.GetModuleHandleW(null);
const className = wide(CLASS);
const wndClass = Buffer.alloc(72); // x64 WNDCLASSW: lpfnWndProc@8, hInstance@24, lpszClassName@64
wndClass.writeBigUInt64LE(BigInt(wndProc.ptr!), 8);
wndClass.writeBigUInt64LE(BigInt(hInstance), 24);
wndClass.writeBigUInt64LE(BigInt(className.ptr!), 64);
const registered = User32.RegisterClassW(wndClass.ptr!) !== 0;
const dummy = registered ? User32.CreateWindowExW(0, className.ptr!, wide('uia-uac-dummy').ptr!, WS_OVERLAPPEDWINDOW | WS_VISIBLE, 120, 120, 300, 200, 0n, 0n, BigInt(hInstance), null) : 0n;
// The live variant: the class is often "$$$Secure UAP Dummy Window Class For Interim Dialog", not the bare name.
const className2 = wide(`${CLASS} For Interim Dialog`);
const wndClass2 = Buffer.alloc(72);
wndClass2.writeBigUInt64LE(BigInt(wndProc.ptr!), 8);
wndClass2.writeBigUInt64LE(BigInt(hInstance), 24);
wndClass2.writeBigUInt64LE(BigInt(className2.ptr!), 64);
const registered2 = User32.RegisterClassW(wndClass2.ptr!) !== 0;
const variant = registered2 ? User32.CreateWindowExW(0, className2.ptr!, wide('uia-uac-interim').ptr!, WS_OVERLAPPEDWINDOW | WS_VISIBLE, 140, 140, 300, 200, 0n, 0n, BigInt(hInstance), null) : 0n;
try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'uac-dummy', version: '1' } });
  if (!registered || dummy === 0n) console.log('  skip: could not synthesize the placeholder window');
  else {
    await Bun.sleep(200);
    const list = textOf(await call('tools/call', { name: 'list_windows', arguments: {} }));
    const row = list.split('\n').find((line) => line.includes(`0x${dummy.toString(16)}`)) ?? '';
    assert(/UAC consent placeholder/.test(row) && /undrivable/.test(row), `the placeholder row is flagged as a UAC consent placeholder (got: ${JSON.stringify(row.slice(0, 110))})`);
    const variantRow = variant !== 0n ? (list.split('\n').find((line) => line.includes(`0x${variant.toString(16)}`)) ?? '') : '';
    assert(variant !== 0n && /UAC consent placeholder/.test(variantRow), `the "For Interim Dialog" class VARIANT is also flagged (got: ${JSON.stringify(variantRow.slice(0, 90))})`);
    // The real no-false-positive property: the flag appears ONLY on windows whose class is the UAC dummy (robust to a
    // genuine OS "$$$Secure UAP Dummy Window Class For Interim Dialog" window also being present on the desktop).
    const mislabeled = list.split('\n').filter((line) => /UAC consent placeholder/.test(line) && !/\[class=\$\$\$Secure UAP Dummy Window Class/.test(line));
    assert(mislabeled.length === 0, `the flag lands only on UAC-dummy-class windows, never a different class — mislabeled: ${JSON.stringify(mislabeled.slice(0, 2))}`);
    // The UIPI-wall label is RELATIVE to this host's integrity, not the target's alone. This host runs at the same
    // integrity as the dummy (same process), so a window it CAN drive must never carry the wall warning — the regression
    // was list_windows printing "UIPI wall — drivable only if YOUR host runs elevated too" on a window the snapshot's
    // coldTreeNote (which uses the relative isUipiWalled) reports as drivable.
    assert(!/UIPI wall/.test(row), `a same-integrity (drivable) placeholder row carries NO UIPI-wall warning (got: ${JSON.stringify(row.slice(0, 110))})`);
    // The wall warning, when it DOES appear, must only land on rows whose integrity tag outranks this medium host —
    // i.e. high or system. Never on medium/low/untrusted (which this host can drive or is itself).
    const wallMislabeled = list.split('\n').filter((line) => /UIPI wall/.test(line) && !/\[(high|system)-integrity — UIPI wall/.test(line));
    assert(wallMislabeled.length === 0, `the UIPI-wall warning lands only on host-outranking (high/system) rows — mislabeled: ${JSON.stringify(wallMislabeled.slice(0, 2))}`);
  }
} finally {
  proc.kill();
  if (dummy !== 0n) User32.DestroyWindow(dummy);
  if (variant !== 0n) User32.DestroyWindow(variant);
  if (registered) User32.UnregisterClassW(className.ptr!, BigInt(hInstance));
  if (registered2) User32.UnregisterClassW(className2.ptr!, BigInt(hInstance));
  wndProc.close();
}

console.log(failures === 0 ? '\nPASS — list_windows flags the UAC consent placeholder so the agent does not stall on it.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
