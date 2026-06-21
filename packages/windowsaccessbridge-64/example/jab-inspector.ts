/**
 * Java Access Bridge Inspector
 *
 * A jaccessinspector-style diagnostic for Java desktop apps. It initializes the Access
 * Bridge, enumerates every top-level window, and flags the ones owned by a Java VM. For
 * each Java window it pulls the bridge version, decodes the root `AccessibleContextInfo`
 * (name, role, states, screen bounds, supported accessibility interfaces), and walks the
 * AccessibleContext tree, printing an indented, colorized outline of the live UI. Every
 * Java object handle is released as the walk unwinds.
 *
 * With no Java/Swing application running it still demonstrates bridge initialization and
 * window classification, then prints how to enable the bridge and try again.
 *
 * APIs demonstrated (WindowsAccessBridge):
 *   - Windows_run                       (initialize the Access Bridge)
 *   - getVersionInfo                    (VM + bridge DLL versions)
 *   - getAccessibleContextFromHWND      (HWND -> vmID + AccessibleContext)
 *   - getAccessibleContextInfo          (decode AccessibleContextInfo)
 *   - getAccessibleChildFromContext     (descend the component tree)
 *   - releaseJavaObject                 (free each Java object handle)
 *
 * APIs demonstrated (User32, cross-package):
 *   - EnumWindows / GetWindowThreadProcessId (iterate + attribute windows)
 *   - IsWindowVisible / GetWindowTextW / GetClassNameW (filter + label windows)
 *   - PeekMessageW / TranslateMessage / DispatchMessageW (pump the JVM registration handshake)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode (enable ANSI VT output)
 *
 * Run: bun run example/jab-inspector.ts
 */

import { JSCallback } from 'bun:ffi';

import Kernel32 from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';
import WindowsAccessBridge, { AccessibleInterface, MAX_STRING_SIZE, SHORT_STRING_SIZE } from '@bun-win32/windowsaccessbridge-64';

Kernel32.Preload(['GetStdHandle', 'GetConsoleMode', 'SetConsoleMode']);
User32.Preload(['DispatchMessageW', 'EnumWindows', 'GetClassNameW', 'GetWindowTextW', 'GetWindowThreadProcessId', 'IsWindowVisible', 'PeekMessageW', 'TranslateMessage']);
WindowsAccessBridge.Preload();

const PM_REMOVE = 0x0001;
const MSG_SIZE = 48; // sizeof(MSG) on x64

// After Windows_run broadcasts "AT present", each Java VM registers its windows by
// posting messages to this process. Pump the queue briefly so that registration lands
// before we ask isJavaWindow / getAccessibleContextFromHWND about any window.
function pumpMessages(durationMilliseconds: number): void {
  const message = Buffer.alloc(MSG_SIZE);
  const startedAt = performance.now();
  do {
    while (User32.PeekMessageW(message.ptr, 0n, 0, 0, PM_REMOVE)) {
      User32.TranslateMessage(message.ptr);
      User32.DispatchMessageW(message.ptr);
    }
    Bun.sleepSync(8);
  } while (performance.now() - startedAt < durationMilliseconds);
}

const STD_OUTPUT_HANDLE = -11;
const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;
const hStdout = Kernel32.GetStdHandle(STD_OUTPUT_HANDLE);
const modeBuffer = Buffer.alloc(4);
if (Kernel32.GetConsoleMode(hStdout, modeBuffer.ptr)) {
  Kernel32.SetConsoleMode(hStdout, modeBuffer.readUInt32LE(0) | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
}

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const MAGENTA = '\x1b[95m';
const GREY = '\x1b[90m';

// AccessibleContextInfo layout (x64, wchar_t = 2 bytes); see AccessBridgePackages.h.
const NAME_BYTES = MAX_STRING_SIZE * 2;
const ROLE_BYTES = SHORT_STRING_SIZE * 2;
const CONTEXT_INFO_SIZE = 6188;
const OFFSET = {
  name: 0,
  description: NAME_BYTES,
  role: NAME_BYTES * 2,
  states: NAME_BYTES * 2 + ROLE_BYTES * 2,
  indexInParent: NAME_BYTES * 2 + ROLE_BYTES * 4,
  childrenCount: NAME_BYTES * 2 + ROLE_BYTES * 4 + 4,
  x: NAME_BYTES * 2 + ROLE_BYTES * 4 + 8,
  y: NAME_BYTES * 2 + ROLE_BYTES * 4 + 12,
  width: NAME_BYTES * 2 + ROLE_BYTES * 4 + 16,
  height: NAME_BYTES * 2 + ROLE_BYTES * 4 + 20,
  accessibleInterfaces: NAME_BYTES * 2 + ROLE_BYTES * 4 + 40,
};

// AccessBridgeVersionInfo layout: 4 x wchar[SHORT_STRING_SIZE].
const VERSION_INFO_SIZE = ROLE_BYTES * 4;

const MAX_DEPTH = 5;
const MAX_CHILDREN_PER_NODE = 16;

interface TopLevelWindow {
  hwnd: bigint;
  processId: number;
  title: string;
  className: string;
  isJava: boolean;
}

function readWide(buffer: Buffer, offset: number, byteLength: number): string {
  return buffer.toString('utf16le', offset, offset + byteLength).replace(/\0.*$/s, '');
}

function describeInterfaces(mask: number): string {
  const names: string[] = [];
  for (const [name, bit] of Object.entries(AccessibleInterface)) {
    if (typeof bit === 'number' && (mask & bit) !== 0) names.push(name.toLowerCase());
  }
  return names.length ? names.join(', ') : 'none';
}

function enumerateWindows(): TopLevelWindow[] {
  const windows: TopLevelWindow[] = [];
  const titleBuffer = Buffer.alloc(1024);
  const classBuffer = Buffer.alloc(512);
  const processIdBuffer = Buffer.alloc(4);

  const callback = new JSCallback(
    (hwnd: bigint): number => {
      if (User32.IsWindowVisible(hwnd)) {
        const titleLength = User32.GetWindowTextW(hwnd, titleBuffer.ptr, 512);
        const classLength = User32.GetClassNameW(hwnd, classBuffer.ptr, 256);
        User32.GetWindowThreadProcessId(hwnd, processIdBuffer.ptr);
        const title = titleBuffer.toString('utf16le', 0, titleLength * 2);
        if (title.length > 0) {
          windows.push({
            hwnd,
            processId: processIdBuffer.readUInt32LE(0),
            title,
            className: classBuffer.toString('utf16le', 0, classLength * 2),
            isJava: WindowsAccessBridge.isJavaWindow(hwnd) !== 0,
          });
        }
      }
      return 1;
    },
    { args: ['u64', 'i64'], returns: 'i32' },
  );
  User32.EnumWindows(callback.ptr!, 0n);
  callback.close();
  return windows;
}

function walkContext(vmID: number, accessibleContext: bigint, depth: number): void {
  const info = Buffer.alloc(CONTEXT_INFO_SIZE);
  if (WindowsAccessBridge.getAccessibleContextInfo(vmID, accessibleContext, info.ptr) === 0) return;

  const name = readWide(info, OFFSET.name, NAME_BYTES);
  const role = readWide(info, OFFSET.role, ROLE_BYTES) || '(no role)';
  const states = readWide(info, OFFSET.states, ROLE_BYTES);
  const childrenCount = info.readInt32LE(OFFSET.childrenCount);
  const x = info.readInt32LE(OFFSET.x);
  const y = info.readInt32LE(OFFSET.y);
  const width = info.readInt32LE(OFFSET.width);
  const height = info.readInt32LE(OFFSET.height);
  const interfaces = info.readInt32LE(OFFSET.accessibleInterfaces);

  const indent = '  '.repeat(depth);
  const label = name ? `${YELLOW}"${name}"${RESET}` : `${GREY}(unnamed)${RESET}`;
  console.log(`${indent}${GREEN}${role}${RESET} ${label} ${GREY}[${width}x${height} @ ${x},${y}]${RESET}`);
  if (states) console.log(`${indent}  ${DIM}states: ${states}${RESET}`);
  if (interfaces) console.log(`${indent}  ${DIM}interfaces: ${describeInterfaces(interfaces)}${RESET}`);

  if (depth >= MAX_DEPTH) {
    if (childrenCount > 0) console.log(`${indent}  ${GREY}… ${childrenCount} child node(s) (max depth reached)${RESET}`);
    return;
  }

  const limit = Math.min(childrenCount, MAX_CHILDREN_PER_NODE);
  for (let index = 0; index < limit; index++) {
    const child = WindowsAccessBridge.getAccessibleChildFromContext(vmID, accessibleContext, index);
    if (child === 0n) continue;
    walkContext(vmID, child, depth + 1);
    WindowsAccessBridge.releaseJavaObject(vmID, child);
  }
  if (childrenCount > limit) console.log(`${indent}  ${GREY}… ${childrenCount - limit} more child node(s)${RESET}`);
}

function inspectJavaWindow(window: TopLevelWindow): void {
  const vmIdBuffer = Buffer.alloc(4);
  const contextBuffer = Buffer.alloc(8);
  if (WindowsAccessBridge.getAccessibleContextFromHWND(window.hwnd, vmIdBuffer.ptr, contextBuffer.ptr) === 0) {
    console.log(`${YELLOW}  Could not obtain an AccessibleContext for this window.${RESET}\n`);
    return;
  }

  const vmID = vmIdBuffer.readInt32LE(0);
  const rootContext = contextBuffer.readBigUInt64LE(0);

  const versionInfo = Buffer.alloc(VERSION_INFO_SIZE);
  if (WindowsAccessBridge.getVersionInfo(vmID, versionInfo.ptr) !== 0) {
    const vmVersion = readWide(versionInfo, 0, ROLE_BYTES);
    const winBridge = readWide(versionInfo, ROLE_BYTES * 3, ROLE_BYTES);
    console.log(`${GREY}  VM ${vmVersion}  •  WindowsAccessBridge ${winBridge}  •  vmID ${vmID}${RESET}\n`);
  }

  walkContext(vmID, rootContext, 0);
  WindowsAccessBridge.releaseJavaObject(vmID, rootContext);
  console.log('');
}

console.log(`\n${BOLD}${CYAN}╔════════════════════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}${CYAN}║          Java Access Bridge Inspector                  ║${RESET}`);
console.log(`${BOLD}${CYAN}╚════════════════════════════════════════════════════════╝${RESET}\n`);

WindowsAccessBridge.Windows_run();
pumpMessages(1500);

const windows = enumerateWindows();
const javaWindows = windows.filter((window) => window.isJava);

console.log(`${BOLD}Top-level windows:${RESET} ${windows.length} visible, ${javaWindows.length} owned by a Java VM`);
console.log(`${GREY}${'─'.repeat(58)}${RESET}`);
for (const window of windows) {
  const tag = window.isJava ? `${GREEN}● JAVA${RESET}` : `${GREY}○     ${RESET}`;
  const title = window.title.length > 38 ? `${window.title.slice(0, 37)}…` : window.title;
  console.log(`${tag} ${MAGENTA}pid ${String(window.processId).padStart(6)}${RESET}  ${title.padEnd(38)} ${GREY}${window.className}${RESET}`);
}
console.log('');

if (javaWindows.length === 0) {
  console.log(`${YELLOW}No Java windows detected.${RESET}`);
  console.log(`${DIM}To see the full accessibility tree:`);
  console.log(`  1. Enable the bridge once:  ${RESET}${CYAN}jabswitch -enable${RESET}`);
  console.log(`${DIM}  2. Launch any Swing/AWT app (it must start after the bridge is enabled).`);
  console.log(`  3. Re-run this inspector.${RESET}\n`);
} else {
  for (const window of javaWindows) {
    console.log(`${BOLD}${CYAN}▼ ${window.title}${RESET} ${GREY}(hwnd ${window.hwnd})${RESET}`);
    inspectJavaWindow(window);
  }
}
