/**
 * Desktop Audit - Enumerate and catalog all visible top-level windows.
 *
 * Uses EnumWindows with a JSCallback to iterate every top-level window.
 * For each window: IsWindowVisible filters hidden ones, GetWindowTextW reads the
 * title, GetClassNameW reads the Win32 class, GetWindowRect retrieves bounds,
 * and GetWindowThreadProcessId gets the owning PID and thread ID. Results are
 * formatted as aligned columns. Windows are grouped by class name, and the
 * foreground window (GetForegroundWindow) is highlighted.
 *
 * Demonstrates:
 * - EnumWindows with JSCallback
 * - IsWindowVisible, GetWindowTextW, GetClassNameW
 * - GetWindowRect, GetWindowThreadProcessId
 * - GetForegroundWindow
 *
 * Run: bun run example/desktop-audit.ts
 */

import User32 from '../index';
import { JSCallback } from 'bun:ffi';

interface WindowInfo {
  hwnd: bigint;
  title: string;
  className: string;
  pid: number;
  tid: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isForeground: boolean;
}

const windows: WindowInfo[] = [];
const foregroundHwnd = User32.GetForegroundWindow();

const titleBuffer = Buffer.alloc(1024);
const classBuffer = Buffer.alloc(512);
const rectBuffer = Buffer.alloc(16); // RECT: 4 x int32 (left, top, right, bottom)
const pidBuffer = Buffer.alloc(4);

const enumCallback = new JSCallback(
  (hwnd: bigint, _lParam: bigint): number => {
    if (!User32.IsWindowVisible(hwnd)) return 1; // skip hidden, continue enumeration

    // Get window title
    const titleLen = User32.GetWindowTextW(hwnd, titleBuffer.ptr, 512);
    const title = titleLen > 0 ? titleBuffer.subarray(0, titleLen * 2).toString('utf16le') : '';

    // Get class name
    const classLen = User32.GetClassNameW(hwnd, classBuffer.ptr, 256);
    const className = classLen > 0 ? classBuffer.subarray(0, classLen * 2).toString('utf16le') : '(unknown)';

    // Get window rect
    User32.GetWindowRect(hwnd, rectBuffer.ptr);
    const left = rectBuffer.readInt32LE(0);
    const top = rectBuffer.readInt32LE(4);
    const right = rectBuffer.readInt32LE(8);
    const bottom = rectBuffer.readInt32LE(12);

    // Get thread and process IDs
    pidBuffer.writeUInt32LE(0, 0);
    const tid = User32.GetWindowThreadProcessId(hwnd, pidBuffer.ptr);
    const pid = pidBuffer.readUInt32LE(0);

    windows.push({
      hwnd,
      title: title || '(untitled)',
      className,
      pid,
      tid,
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
      isForeground: hwnd === foregroundHwnd,
    });

    return 1; // continue enumeration
  },
  {
    args: ['u64', 'i64'],
    returns: 'i32',
  },
);

console.log('DESKTOP WINDOW AUDIT');
console.log(`Report generated: ${new Date().toLocaleString()}`);
console.log('');

// Enumerate all top-level windows
User32.EnumWindows(enumCallback.ptr!, 0n);
enumCallback.close();

// Sort by PID then title for readability
windows.sort((a, b) => a.pid - b.pid || a.title.localeCompare(b.title));

// Print the detailed window table
const divider = '-'.repeat(130);

console.log(`Found ${windows.length} visible top-level windows`);
console.log(`Foreground window handle: ${foregroundHwnd}`);
console.log('');
console.log(divider);
console.log(
  '  ' +
    'PID'.padEnd(8) +
    'TID'.padEnd(8) +
    'Handle'.padEnd(22) +
    'Class'.padEnd(28) +
    'Position'.padEnd(18) +
    'Size'.padEnd(14) +
    'Title',
);
console.log(divider);

for (const win of windows) {
  const marker = win.isForeground ? '> ' : '  ';
  const position = `${win.x},${win.y}`;
  const size = `${win.width}x${win.height}`;
  const titleDisplay = win.title.length > 38 ? win.title.substring(0, 35) + '...' : win.title;

  console.log(
    marker +
      String(win.pid).padEnd(8) +
      String(win.tid).padEnd(8) +
      `0x${win.hwnd.toString(16)}`.padEnd(22) +
      win.className.substring(0, 26).padEnd(28) +
      position.padEnd(18) +
      size.padEnd(14) +
      titleDisplay,
  );
}

console.log(divider);
console.log('  (> marks the foreground window)');

// Group by class name
const classGroups = new Map<string, WindowInfo[]>();
for (const win of windows) {
  const group = classGroups.get(win.className) || [];
  group.push(win);
  classGroups.set(win.className, group);
}

// Sort groups by count descending
const sortedGroups = [...classGroups.entries()].sort((a, b) => b[1].length - a[1].length);

console.log('');
console.log('WINDOW CLASS SUMMARY');
console.log(divider);
console.log('  ' + 'Class Name'.padEnd(40) + 'Count'.padEnd(8) + 'PIDs');
console.log(divider);

for (const [className, group] of sortedGroups) {
  const uniquePids = [...new Set(group.map((w) => w.pid))].sort((a, b) => a - b);
  const pidList = uniquePids.length > 6 ? uniquePids.slice(0, 6).join(', ') + ` (+${uniquePids.length - 6} more)` : uniquePids.join(', ');

  console.log('  ' + className.substring(0, 38).padEnd(40) + String(group.length).padEnd(8) + pidList);
}

console.log(divider);
console.log(`  ${sortedGroups.length} unique window classes across ${windows.length} windows`);

// Quick statistics
const uniquePids = new Set(windows.map((w) => w.pid));
const titledWindows = windows.filter((w) => w.title !== '(untitled)');
const offscreenWindows = windows.filter((w) => w.x < -10 || w.y < -10 || w.x > 10000 || w.y > 10000);

console.log('');
console.log('STATISTICS');
console.log(`  Total visible windows:   ${windows.length}`);
console.log(`  Unique processes:         ${uniquePids.size}`);
console.log(`  Windows with titles:      ${titledWindows.length}`);
console.log(`  Untitled windows:         ${windows.length - titledWindows.length}`);
console.log(`  Offscreen windows:        ${offscreenWindows.length}`);
console.log(`  Unique window classes:    ${sortedGroups.length}`);
console.log('');
console.log('Audit complete.');
