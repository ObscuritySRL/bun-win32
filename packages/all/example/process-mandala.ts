/**
 * Process Mandala — the entire process tree of Windows, drawn as a living mandala.
 *
 * Every running process arranged radially by parent-child relationships in a
 * borderless 1100x1100 Mica window. Each root (System, Idle, orphaned trees)
 * claims an angular sector sized by its descendant count; their children radiate
 * outward into concentric rings (radius = depth * 80 px); every child sub-claims
 * a slice of its parent's sweep. Each process is a colored petal whose radius is
 * proportional to log(WorkingSetSize), colored by a deterministic FNV-1a hash
 * of its executable name. Thin antialiased filaments connect parents to children.
 * The whole mandala re-enumerates every 2 s and repaints at 2 Hz. Hovering a
 * petal highlights it and pops a floating tooltip with exe name, PID, parent
 * PID, thread count, depth, and working-set size. ESC closes the window.
 *
 * Pipeline:
 *   Gdiplus.GdiplusStartup → User32.RegisterClassExW + CreateWindowExW →
 *   Dwmapi.DwmSetWindowAttribute (Mica + dark mode) →
 *   Kernel32.CreateToolhelp32Snapshot + Process32FirstW/NextW (walk PEs) →
 *   Kernel32.OpenProcess (LIMITED_QUERY) + Psapi.GetProcessMemoryInfo →
 *   Build parent→children tree → recursive radial layout →
 *   GDI+ render (filaments + petals + tooltip) → blit offscreen → window HDC →
 *   SetTimer @ 500 ms drives repaint (re-enumerate when stale > 2 s) →
 *   WM_MOUSEMOVE drives hover hit-testing → cleanup on WM_DESTROY / ESC.
 *
 * APIs demonstrated:
 *   Kernel32  CreateToolhelp32Snapshot / Process32FirstW / Process32NextW /
 *             OpenProcess (PROCESS_QUERY_LIMITED_INFORMATION) / CloseHandle
 *   Psapi     GetProcessMemoryInfo (PROCESS_MEMORY_COUNTERS, 72 B on x64)
 *   User32    RegisterClassExW / CreateWindowExW / SetTimer / GetMessageW /
 *             InvalidateRect / GetDC / ReleaseDC / DefWindowProcW + lifecycle
 *   Dwmapi    DwmSetWindowAttribute (DWMWA_SYSTEMBACKDROP_TYPE + DARK_MODE)
 *   Gdiplus   Startup / CreateBitmapFromScan0 / CreateFromHDC / FillEllipseI /
 *             DrawEllipseI / DrawLine / CreatePen1 / CreateSolidFill /
 *             CreateLineBrushFromRectWithAngle / DrawString / DrawImageRectI
 *
 * PROCESSENTRY32W (x64, 568 B): dwSize@0x00, th32ProcessID@0x08,
 *   cntThreads@0x1C, th32ParentProcessID@0x20, szExeFile[260]@0x2C.
 *
 * Run: bun run example/process-mandala.ts
 */

import { JSCallback, type Pointer } from 'bun:ffi';

import { Dwmapi, Gdiplus, Kernel32, Psapi, User32 } from '../index';
import { SystemBackdropType, WindowAttribute } from '@bun-win32/dwmapi';
import { FontStyle, PixelFormat32bppARGB, SmoothingMode, Status, StringAlignment, TextRenderingHint, Unit } from '@bun-win32/gdiplus';
import { ProcessAccessRights } from '@bun-win32/kernel32';
import { ExtendedWindowStyles, ShowWindowCommand, SystemMetric, VirtualKey, WindowStyles } from '@bun-win32/user32';

// ── Geometry + constants ──────────────────────────────────────────────────────

const WINDOW_SIZE = 1100, CENTER = WINDOW_SIZE / 2, RING_SPACING = 80;
const REFRESH_INTERVAL_MS = 500, REENUMERATE_EVERY_MS = 2000, TIMER_ID = 1n;
const MSG_SIZE_BYTES = 48;
const WM_DESTROY = 0x0002, WM_CLOSE = 0x0010, WM_KEYDOWN = 0x0100;
const WM_TIMER = 0x0113, WM_MOUSEMOVE = 0x0200, WM_PAINT = 0x000f;
const TH32CS_SNAPPROCESS = 0x00000002;
const INVALID_HANDLE_VALUE = 0xffffffffffffffffn;
const PROCESSENTRY32W_SIZE = 568, PROCESS_MEMORY_COUNTERS_SIZE = 72;

// ── Utilities ─────────────────────────────────────────────────────────────────

const encodeWide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');
const argb = (a: number, r: number, g: number, b: number): number =>
  (((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)) >>> 0;
const check = (status: number, where: string): void => {
  if (status !== Status.Ok) throw new Error(`${where} failed: ${Status[status]} (${status})`);
};

function hsvToArgb(h: number, s: number, v: number, alpha = 0xff): number {
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const channels = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6]!;
  return argb(alpha, Math.round(channels[0]! * 255), Math.round(channels[1]! * 255), Math.round(channels[2]! * 255));
}

// FNV-1a 32-bit; stable per-name hues across enumeration cycles.
function hashName(name: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) hash = ((hash ^ name.charCodeAt(i)) * 0x01000193) >>> 0;
  return hash;
}

// ── Process snapshot ──────────────────────────────────────────────────────────

interface ProcessNode {
  pid: number; parentPid: number; threadCount: number;
  exeName: string; workingSetBytes: number; children: ProcessNode[];
  x: number; y: number; radius: number; color: number; depth: number; // populated during layout
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0, value = bytes;
  while (value >= 1024 && unitIndex < units.length - 1) { value /= 1024; unitIndex++; }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}

// One reusable buffer for the snapshot iteration; dwSize is rewritten each pass.
const processEntryBuffer = Buffer.alloc(PROCESSENTRY32W_SIZE);
const memoryCountersBuffer = Buffer.alloc(PROCESS_MEMORY_COUNTERS_SIZE);

function enumerateProcesses(): ProcessNode[] {
  const snapshot = Kernel32.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
  if (!snapshot || BigInt(snapshot) === INVALID_HANDLE_VALUE) return [];

  const nodes: ProcessNode[] = [];
  try {
    processEntryBuffer.writeUInt32LE(PROCESSENTRY32W_SIZE, 0); // dwSize
    let success = Kernel32.Process32FirstW(snapshot, processEntryBuffer.ptr);

    while (success) {
      const pid = processEntryBuffer.readUInt32LE(8);
      const threadCount = processEntryBuffer.readUInt32LE(28);
      const parentPid = processEntryBuffer.readUInt32LE(32);
      const exeNameRaw = processEntryBuffer.subarray(44, 44 + 520).toString('utf16le');
      const exeName = exeNameRaw.replace(/\0.*$/, '');

      let workingSet = 0;
      // OpenProcess with LIMITED_INFORMATION; PID 0 / 4 / certain protected
      // processes will fail with ACCESS_DENIED, which we silently absorb.
      const handle = Kernel32.OpenProcess(ProcessAccessRights.PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
      if (handle && BigInt(handle) !== 0n) {
        try {
          memoryCountersBuffer.writeUInt32LE(PROCESS_MEMORY_COUNTERS_SIZE, 0); // cb
          if (Psapi.GetProcessMemoryInfo(handle, memoryCountersBuffer.ptr, PROCESS_MEMORY_COUNTERS_SIZE)) {
            workingSet = Number(memoryCountersBuffer.readBigUInt64LE(0x10));
          }
        } finally {
          Kernel32.CloseHandle(handle);
        }
      }

      const hash = hashName(exeName.toLowerCase());
      const hue = (hash & 0xffff) / 0xffff;
      const saturation = 0.55 + ((hash >>> 16) & 0xff) / 0xff * 0.30;
      const color = hsvToArgb(hue, saturation, 0.92);

      nodes.push({
        pid, parentPid, threadCount, exeName: exeName || `[pid ${pid}]`,
        workingSetBytes: workingSet, children: [],
        x: 0, y: 0, radius: 0, color, depth: 0,
      });
      success = Kernel32.Process32NextW(snapshot, processEntryBuffer.ptr);
    }
  } finally {
    Kernel32.CloseHandle(snapshot);
  }
  return nodes;
}

// ── Tree construction + radial layout ─────────────────────────────────────────

interface MandalaSnapshot {
  nodes: ProcessNode[];
  roots: ProcessNode[];
  generatedAtMs: number;
}

function buildMandala(): MandalaSnapshot {
  const nodes = enumerateProcesses();
  const byPid = new Map<number, ProcessNode>();
  for (const node of nodes) byPid.set(node.pid, node);

  // A "root" is any node whose parent isn't running (System, Idle, orphans).
  // We sort children by working set so heavier processes cluster predictably.
  const roots: ProcessNode[] = [];
  for (const node of nodes) {
    const parent = byPid.get(node.parentPid);
    if (parent && parent.pid !== node.pid) parent.children.push(node);
    else roots.push(node);
  }
  for (const node of nodes) node.children.sort((a, b) => b.workingSetBytes - a.workingSetBytes);
  roots.sort((a, b) => b.workingSetBytes - a.workingSetBytes);

  // Each root claims an angular sector proportional to its descendant count so
  // densely-populated trees get more breathing room. Roots sit at center; their
  // children radiate outward into concentric rings.
  const leafShare = (n: ProcessNode): number => {
    if (n.children.length === 0) return 1;
    let sum = 0;
    for (const child of n.children) sum += leafShare(child);
    return sum;
  };

  const layoutSubtree = (node: ProcessNode, depth: number, angularStart: number, angularSweep: number): void => {
    node.depth = depth;
    if (depth === 0) { node.x = CENTER; node.y = CENTER; }
    else {
      const angle = angularStart + angularSweep / 2, ringRadius = depth * RING_SPACING;
      node.x = CENTER + Math.cos(angle) * ringRadius;
      node.y = CENTER + Math.sin(angle) * ringRadius;
    }
    // Petal radius from log10(working set); clamped so heavy browsers don't eclipse neighbors.
    const logMem = node.workingSetBytes > 0 ? Math.log10(node.workingSetBytes + 1) : 0;
    node.radius = Math.max(4, Math.min(30, 2 + logMem * 2.5));
    if (node.children.length === 0) return;
    const totalChildShare = leafShare(node);
    let childOffset = angularStart;
    for (const child of node.children) {
      const childSweep = (leafShare(child) / totalChildShare) * angularSweep;
      layoutSubtree(child, depth + 1, childOffset, childSweep);
      childOffset += childSweep;
    }
  };

  // Anchor the largest root at 12 o'clock; subsequent roots wind clockwise.
  const totalRootShare = roots.reduce((s, r) => s + leafShare(r), 0);
  let cursor = -Math.PI / 2;
  for (const root of roots) {
    const sweep = (leafShare(root) / totalRootShare) * Math.PI * 2;
    layoutSubtree(root, 0, cursor, sweep);
    cursor += sweep;
  }

  return { nodes, roots, generatedAtMs: Date.now() };
}

// ── Bootstrap GDI+ ────────────────────────────────────────────────────────────

Gdiplus.Preload();
const gdiplusTokenBuffer = Buffer.alloc(8);
const gdiplusStartupInput = Buffer.alloc(16);
gdiplusStartupInput.writeUInt32LE(1, 0);
check(Gdiplus.GdiplusStartup(gdiplusTokenBuffer.ptr, gdiplusStartupInput.ptr, null), 'GdiplusStartup');
const gdiplusToken = gdiplusTokenBuffer.readBigUInt64LE(0);

// ── Window plumbing ───────────────────────────────────────────────────────────

let shouldClose = false, hoverX = -1, hoverY = -1, windowHandle = 0n;

const wndProcCallback = new JSCallback(
  (hWnd: bigint, msg: number, wParam: number | bigint, lParam: number | bigint): bigint => {
    if (msg === WM_MOUSEMOVE) {
      // lParam: low 16 bits = x, high 16 bits = y, both signed.
      const lp = Number(BigInt.asUintN(32, BigInt(lParam)));
      hoverX = (lp & 0xffff) << 16 >> 16;
      hoverY = (lp >>> 16) << 16 >> 16;
      User32.InvalidateRect(hWnd, null, 0);
      return 0n;
    }
    if (msg === WM_TIMER) { User32.InvalidateRect(hWnd, null, 0); return 0n; }
    if (msg === WM_KEYDOWN && Number(wParam) === VirtualKey.VK_ESCAPE) {
      shouldClose = true; User32.PostQuitMessage(0); return 0n;
    }
    if (msg === WM_CLOSE) { shouldClose = true; User32.DestroyWindow(hWnd); return 0n; }
    if (msg === WM_DESTROY) { User32.PostQuitMessage(0); return 0n; }
    if (msg === WM_PAINT) renderFrame(hWnd); // fall through so DefWindowProc validates the update region
    return BigInt(User32.DefWindowProcW(hWnd, msg, BigInt(wParam), BigInt(lParam)));
  },
  { args: ['u64', 'u32', 'u64', 'i64'], returns: 'i64' },
);

const className = encodeWide('BunProcessMandala');

// WNDCLASSEXW = 80 B on x64; only cbSize / lpfnWndProc / lpszClassName are non-zero.
const wndClassBuffer = Buffer.alloc(80);
wndClassBuffer.writeUInt32LE(80, 0); // cbSize
wndClassBuffer.writeBigUInt64LE(BigInt(wndProcCallback.ptr!), 8); // lpfnWndProc
wndClassBuffer.writeBigUInt64LE(BigInt(className.ptr), 64); // lpszClassName

if (!User32.RegisterClassExW(wndClassBuffer.ptr)) { console.error('RegisterClassExW failed'); process.exit(1); }

const screenWidth = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN);
const screenHeight = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN);
const originX = Math.floor((screenWidth - WINDOW_SIZE) / 2);
const originY = Math.floor((screenHeight - WINDOW_SIZE) / 2);

windowHandle = User32.CreateWindowExW(
  ExtendedWindowStyles.WS_EX_APPWINDOW, className.ptr, encodeWide('Process Mandala').ptr,
  WindowStyles.WS_POPUP | WindowStyles.WS_VISIBLE,
  originX, originY, WINDOW_SIZE, WINDOW_SIZE,
  0n, 0n, 0n, null,
);
if (!windowHandle) { console.error('CreateWindowExW failed'); process.exit(1); }

// Mica + dark-mode chrome for the borderless window.
const dwmAttribute = Buffer.alloc(4);
dwmAttribute.writeInt32LE(SystemBackdropType.DWMSBT_MAINWINDOW, 0);
Dwmapi.DwmSetWindowAttribute(windowHandle, WindowAttribute.DWMWA_SYSTEMBACKDROP_TYPE, dwmAttribute.ptr, 4);
dwmAttribute.writeInt32LE(1, 0);
Dwmapi.DwmSetWindowAttribute(windowHandle, WindowAttribute.DWMWA_USE_IMMERSIVE_DARK_MODE, dwmAttribute.ptr, 4);

User32.ShowWindow(windowHandle, ShowWindowCommand.SW_SHOW);
User32.UpdateWindow(windowHandle);
User32.SetTimer(windowHandle, TIMER_ID, REFRESH_INTERVAL_MS, null);

// ── Offscreen bitmap + Graphics ───────────────────────────────────────────────

const bitmapHandleBuffer = Buffer.alloc(8);
check(Gdiplus.GdipCreateBitmapFromScan0(WINDOW_SIZE, WINDOW_SIZE, 0, PixelFormat32bppARGB, null, bitmapHandleBuffer.ptr), 'GdipCreateBitmapFromScan0');
const offscreenBitmap = bitmapHandleBuffer.readBigUInt64LE(0);

const offscreenGraphicsHandleBuffer = Buffer.alloc(8);
check(Gdiplus.GdipGetImageGraphicsContext(offscreenBitmap, offscreenGraphicsHandleBuffer.ptr), 'GdipGetImageGraphicsContext');
const offscreenGraphics = offscreenGraphicsHandleBuffer.readBigUInt64LE(0);
check(Gdiplus.GdipSetSmoothingMode(offscreenGraphics, SmoothingMode.SmoothingModeAntiAlias), 'GdipSetSmoothingMode');
check(Gdiplus.GdipSetTextRenderingHint(offscreenGraphics, TextRenderingHint.TextRenderingHintAntiAliasGridFit), 'GdipSetTextRenderingHint');

// Pre-allocate the typography we use across every frame.
const fontFamilyHandleBuffer = Buffer.alloc(8);
const fontFamilyName = encodeWide('Segoe UI');
check(Gdiplus.GdipCreateFontFamilyFromName(fontFamilyName.ptr, 0n, fontFamilyHandleBuffer.ptr), 'GdipCreateFontFamilyFromName');
const fontFamily = fontFamilyHandleBuffer.readBigUInt64LE(0);

function makeFont(sizePx: number, style: FontStyle): bigint {
  const buffer = Buffer.alloc(8);
  check(Gdiplus.GdipCreateFont(fontFamily, sizePx, style, Unit.UnitPixel, buffer.ptr), `GdipCreateFont(${sizePx})`);
  return buffer.readBigUInt64LE(0);
}

const titleFont = makeFont(20, FontStyle.FontStyleBold);
const subtitleFont = makeFont(13, FontStyle.FontStyleRegular);
const tooltipFont = makeFont(13, FontStyle.FontStyleRegular);
const tooltipBoldFont = makeFont(13, FontStyle.FontStyleBold);

const leftStringFormatBuffer = Buffer.alloc(8);
check(Gdiplus.GdipCreateStringFormat(0, 0, leftStringFormatBuffer.ptr), 'GdipCreateStringFormat (left)');
const leftStringFormat = leftStringFormatBuffer.readBigUInt64LE(0);
Gdiplus.GdipSetStringFormatAlign(leftStringFormat, StringAlignment.StringAlignmentNear);

const reusableRect = Buffer.alloc(16);
function writeRect(x: number, y: number, w: number, h: number): Pointer {
  reusableRect.writeFloatLE(x, 0); reusableRect.writeFloatLE(y, 4);
  reusableRect.writeFloatLE(w, 8); reusableRect.writeFloatLE(h, 12);
  return reusableRect.ptr;
}

// ── Snapshot cache (re-enumerate every REENUMERATE_EVERY_MS) ──────────────────

let cachedSnapshot: MandalaSnapshot = buildMandala();
console.log(`Process Mandala booted: ${cachedSnapshot.nodes.length} processes, ${cachedSnapshot.roots.length} roots.`);

function maybeReenumerate(): void {
  if (Date.now() - cachedSnapshot.generatedAtMs > REENUMERATE_EVERY_MS) {
    cachedSnapshot = buildMandala();
  }
}

function findHoveredNode(x: number, y: number): ProcessNode | null {
  let best: ProcessNode | null = null;
  let bestDistSq = Infinity;
  for (const node of cachedSnapshot.nodes) {
    const dx = node.x - x, dy = node.y - y, distSq = dx * dx + dy * dy;
    const hitR = node.radius + 2;
    if (distSq <= hitR * hitR && distSq < bestDistSq) { best = node; bestDistSq = distSq; }
  }
  return best;
}

// ── Render ────────────────────────────────────────────────────────────────────

// Brushes/pens are created per-call (one-shot) so we don't accumulate state.
const brushOutBuffer = Buffer.alloc(8), penOutBuffer = Buffer.alloc(8);
function withBrush(color: number, body: (brush: bigint) => void): void {
  Gdiplus.GdipCreateSolidFill(color, brushOutBuffer.ptr);
  const brush = brushOutBuffer.readBigUInt64LE(0);
  body(brush);
  Gdiplus.GdipDeleteBrush(brush);
}
function withPen(color: number, width: number, body: (pen: bigint) => void): void {
  Gdiplus.GdipCreatePen1(color, width, Unit.UnitPixel, penOutBuffer.ptr);
  const pen = penOutBuffer.readBigUInt64LE(0);
  body(pen);
  Gdiplus.GdipDeletePen(pen);
}

const fillEllipse = (g: bigint, cx: number, cy: number, r: number, color: number): void =>
  withBrush(color, (brush) => Gdiplus.GdipFillEllipseI(g, brush, Math.round(cx - r), Math.round(cy - r), Math.round(r * 2), Math.round(r * 2)));

const drawEllipseRing = (g: bigint, cx: number, cy: number, r: number, color: number, w: number): void =>
  withPen(color, w, (pen) => Gdiplus.GdipDrawEllipseI(g, pen, Math.round(cx - r), Math.round(cy - r), Math.round(r * 2), Math.round(r * 2)));

const drawLine = (g: bigint, x1: number, y1: number, x2: number, y2: number, color: number, w: number): void =>
  withPen(color, w, (pen) => Gdiplus.GdipDrawLine(g, pen, x1, y1, x2, y2));

const fillRect = (g: bigint, x: number, y: number, w: number, h: number, color: number): void =>
  withBrush(color, (brush) => Gdiplus.GdipFillRectangleI(g, brush, Math.round(x), Math.round(y), Math.round(w), Math.round(h)));

function drawText(g: bigint, text: string, font: bigint, x: number, y: number, w: number, h: number, color: number): void {
  const wide = encodeWide(text);
  withBrush(color, (brush) => Gdiplus.GdipDrawString(g, wide.ptr, -1, font, writeRect(x, y, w, h), leftStringFormat, brush));
}

function renderFrame(hWnd: bigint): void {
  maybeReenumerate();

  // Backdrop: deep purple→indigo gradient along the diagonal. DWM Mica composes
  // behind anything we leave translucent.
  const gradientBuffer = Buffer.alloc(8);
  Gdiplus.GdipCreateLineBrushFromRectWithAngle(writeRect(0, 0, WINDOW_SIZE, WINDOW_SIZE), argb(255, 0x0e, 0x0a, 0x1c), argb(255, 0x1a, 0x0e, 0x30), 45.0, 1, 0, gradientBuffer.ptr);
  const gradientBrush = gradientBuffer.readBigUInt64LE(0);
  Gdiplus.GdipFillRectangle(offscreenGraphics, gradientBrush, 0, 0, WINDOW_SIZE, WINDOW_SIZE);
  Gdiplus.GdipDeleteBrush(gradientBrush);

  // Faint concentric guide rings, one per observed generation depth.
  let maxDepth = 0;
  for (const node of cachedSnapshot.nodes) if (node.depth > maxDepth) maxDepth = node.depth;
  for (let depth = 1; depth <= maxDepth; depth++) drawEllipseRing(offscreenGraphics, CENTER, CENTER, depth * RING_SPACING, argb(28, 0xff, 0xff, 0xff), 1);

  // Connecting filaments first; petals overdraw them.
  for (const node of cachedSnapshot.nodes) {
    for (const child of node.children) {
      const alpha = Math.max(60, 220 - child.depth * 35);
      drawLine(offscreenGraphics, node.x, node.y, child.x, child.y, argb(alpha, 0xc8, 0xb0, 0xff), 1);
    }
  }

  // Hit-test cursor → hovered petal.
  const hovered = hoverX >= 0 && hoverY >= 0 ? findHoveredNode(hoverX, hoverY) : null;

  // Petals: a filled disc + a brighter inner core; hovered gets a double halo.
  for (const node of cachedSnapshot.nodes) {
    fillEllipse(offscreenGraphics, node.x, node.y, node.radius, node.color);
    fillEllipse(offscreenGraphics, node.x - node.radius * 0.2, node.y - node.radius * 0.2, node.radius * 0.45, argb(120, 0xff, 0xff, 0xff));
    if (node === hovered) {
      drawEllipseRing(offscreenGraphics, node.x, node.y, node.radius + 4, argb(255, 0xff, 0xff, 0xff), 2);
      drawEllipseRing(offscreenGraphics, node.x, node.y, node.radius + 8, argb(120, 0xff, 0xff, 0xff), 1);
    }
  }

  // Title chrome.
  drawText(offscreenGraphics, 'Process Mandala', titleFont, 24, 22, 600, 28, argb(255, 0xff, 0xee, 0xd6));
  drawText(offscreenGraphics,
    `${cachedSnapshot.nodes.length} processes  •  ${cachedSnapshot.roots.length} roots  •  ${maxDepth + 1} generations  •  refresh ${(REENUMERATE_EVERY_MS / 1000).toFixed(0)}s  •  esc closes`,
    subtitleFont, 24, 52, 900, 20, argb(180, 0xff, 0xff, 0xff));

  // Tooltip for the hovered process.
  if (hovered) {
    const lines: Array<{ text: string; font: bigint; color: number }> = [
      { text: hovered.exeName, font: tooltipBoldFont, color: argb(255, 0xff, 0xee, 0xd6) },
      { text: `PID ${hovered.pid}  •  parent ${hovered.parentPid}`, font: tooltipFont, color: argb(220, 0xff, 0xff, 0xff) },
      { text: `${hovered.threadCount} thread${hovered.threadCount === 1 ? '' : 's'}  •  depth ${hovered.depth}`, font: tooltipFont, color: argb(200, 0xc8, 0xc8, 0xff) },
      { text: hovered.workingSetBytes > 0 ? `working set ${formatBytes(hovered.workingSetBytes)}` : 'working set unavailable', font: tooltipFont, color: argb(220, 0xa6, 0xff, 0xa6) },
    ];
    const PAD = 10, LINE_H = 18, TIP_W = 280, TIP_H = PAD * 2 + lines.length * LINE_H;
    // Anchor near cursor, but keep tooltip on-screen.
    let tipX = hoverX + 18, tipY = hoverY + 18;
    if (tipX + TIP_W > WINDOW_SIZE - 12) tipX = hoverX - TIP_W - 18;
    if (tipY + TIP_H > WINDOW_SIZE - 12) tipY = hoverY - TIP_H - 18;
    if (tipX < 12) tipX = 12;
    if (tipY < 12) tipY = 12;

    fillRect(offscreenGraphics, tipX + 3, tipY + 3, TIP_W, TIP_H, argb(120, 0, 0, 0)); // shadow
    fillRect(offscreenGraphics, tipX, tipY, TIP_W, TIP_H, argb(235, 0x12, 0x10, 0x22)); // body
    fillRect(offscreenGraphics, tipX, tipY, TIP_W, 2, argb(255, (hovered.color >>> 16) & 0xff, (hovered.color >>> 8) & 0xff, hovered.color & 0xff)); // hue edge

    let lineY = tipY + PAD;
    for (const line of lines) {
      drawText(offscreenGraphics, line.text, line.font, tipX + PAD, lineY, TIP_W - PAD * 2, LINE_H, line.color);
      lineY += LINE_H;
    }
  }

  // Blit offscreen → window HDC.
  const windowDc = User32.GetDC(hWnd);
  if (windowDc) {
    const windowGraphicsHandleBuffer = Buffer.alloc(8);
    if (Gdiplus.GdipCreateFromHDC(windowDc, windowGraphicsHandleBuffer.ptr) === Status.Ok) {
      const windowGraphics = windowGraphicsHandleBuffer.readBigUInt64LE(0);
      Gdiplus.GdipDrawImageRectI(windowGraphics, offscreenBitmap, 0, 0, WINDOW_SIZE, WINDOW_SIZE);
      Gdiplus.GdipDeleteGraphics(windowGraphics);
    }
    User32.ReleaseDC(hWnd, windowDc);
  }
}

// ── Main message loop ────────────────────────────────────────────────────────

const messageBuffer = Buffer.alloc(MSG_SIZE_BYTES);

console.log('Mandala drawing. Hover petals to inspect. ESC to close.');

while (!shouldClose) {
  const result = User32.GetMessageW(messageBuffer.ptr, 0n, 0, 0);
  if (result <= 0) break;
  User32.TranslateMessage(messageBuffer.ptr);
  User32.DispatchMessageW(messageBuffer.ptr);
}

// ── Teardown ──────────────────────────────────────────────────────────────────

console.log('Cleaning up...');

User32.KillTimer(windowHandle, TIMER_ID);
Gdiplus.GdipDeleteStringFormat(leftStringFormat);
for (const font of [titleFont, subtitleFont, tooltipFont, tooltipBoldFont]) Gdiplus.GdipDeleteFont(font);
Gdiplus.GdipDeleteFontFamily(fontFamily);
Gdiplus.GdipDeleteGraphics(offscreenGraphics);
Gdiplus.GdipDisposeImage(offscreenBitmap);
Gdiplus.GdiplusShutdown(gdiplusToken);

if (windowHandle) User32.DestroyWindow(windowHandle);
User32.UnregisterClassW(className.ptr, 0n);
wndProcCallback.close();
console.log('Done.');
