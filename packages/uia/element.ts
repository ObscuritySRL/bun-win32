// Element: a live IUIAutomationElement pointer with typed property reads, tree search, and the
// proven control-pattern actions. Property readers live in reads.ts; pattern actions in patterns.ts.

import { FFIType } from 'bun:ffi';

import User32 from '@bun-win32/user32';

import { automation, controlViewWalker } from './automation';
import type { CacheRequest } from './cache';
import { comRelease, hresult, vcall } from './com';
import { compileCondition, type ElementProperties, formatNoMatch, matches, type Selector } from './condition';
import { ControlType, S_OK, SLOT, TreeScope } from './constants';
import { clickAt, type as inputType } from './input';
import { screenshot as windowScreenshot, windowForProcess } from './window';
import {
  collapse,
  expand,
  expandCollapseState,
  getValue,
  invoke,
  isSelected,
  rangeValue,
  readTable,
  readText,
  scroll,
  scrollInfo,
  scrollIntoView,
  select,
  setRangeValue,
  setScrollPercent,
  setValue,
  setWindowVisualState,
  toggle,
  toggleState,
  windowClose,
  type ScrollAmount,
  type ScrollInfo,
  type TableData,
  type WindowVisualState,
} from './patterns';
import { getBstr, getHandle, getLong, getPropertyValue, getRect, type Rect, type VariantValue } from './reads';

// Reused scratch for out-parameters in the tree-search path. Each value is read out immediately.
const scratch8 = Buffer.alloc(8);
const scratch4 = Buffer.alloc(4);

/** Read the four properties the client-side matcher needs, in one pass (live). */
function readProperties(ptr: bigint): ElementProperties {
  return {
    automationId: getBstr(ptr, SLOT.get_CurrentAutomationId),
    className: getBstr(ptr, SLOT.get_CurrentClassName),
    controlType: getLong(ptr, SLOT.get_CurrentControlType),
    name: getBstr(ptr, SLOT.get_CurrentName),
  };
}

/** Read the matcher's four properties from the prefetched cache (zero further round-trips). */
function readCachedProperties(ptr: bigint): ElementProperties {
  return {
    automationId: getBstr(ptr, SLOT.get_CachedAutomationId),
    className: getBstr(ptr, SLOT.get_CachedClassName),
    controlType: getLong(ptr, SLOT.get_CachedControlType),
    name: getBstr(ptr, SLOT.get_CachedName),
  };
}

function findFirstPointer(scopeElement: bigint, scope: number, condition: bigint): bigint {
  if (vcall(scopeElement, SLOT.FindFirst, [FFIType.i32, FFIType.u64, FFIType.ptr], [scope, condition, scratch8.ptr!]) !== S_OK) return 0n;
  return scratch8.readBigUInt64LE(0);
}

function findAllPointers(scopeElement: bigint, scope: number, condition: bigint): bigint[] {
  if (vcall(scopeElement, SLOT.FindAll, [FFIType.i32, FFIType.u64, FFIType.ptr], [scope, condition, scratch8.ptr!]) !== S_OK) return [];
  const pArray = scratch8.readBigUInt64LE(0);
  if (pArray === 0n) return [];
  try {
    if (vcall(pArray, SLOT.get_Length, [FFIType.ptr], [scratch4.ptr!]) !== S_OK) return [];
    const length = scratch4.readInt32LE(0);
    const pointers: bigint[] = new Array(length);
    let count = 0;
    for (let index = 0; index < length; index += 1) {
      if (vcall(pArray, SLOT.GetElement, [FFIType.i32, FFIType.ptr], [index, scratch8.ptr!]) !== S_OK) continue;
      const pointer = scratch8.readBigUInt64LE(0);
      if (pointer !== 0n) {
        pointers[count] = pointer;
        count += 1;
      }
    }
    pointers.length = count;
    return pointers;
  } finally {
    comRelease(pArray);
  }
}

export class Element {
  readonly ptr: bigint;

  constructor(ptr: bigint) {
    this.ptr = ptr;
  }

  get automationId(): string {
    return getBstr(this.ptr, SLOT.get_CurrentAutomationId);
  }

  get boundingRectangle(): Rect {
    return getRect(this.ptr, SLOT.get_CurrentBoundingRectangle);
  }

  get className(): string {
    return getBstr(this.ptr, SLOT.get_CurrentClassName);
  }

  get controlType(): number {
    return getLong(this.ptr, SLOT.get_CurrentControlType);
  }

  get controlTypeName(): string {
    const id = this.controlType;
    return ControlType[id] ?? `Type(${id})`;
  }

  get isEnabled(): boolean {
    return getLong(this.ptr, SLOT.get_CurrentIsEnabled) !== 0;
  }

  get name(): string {
    return getBstr(this.ptr, SLOT.get_CurrentName);
  }

  get nativeWindowHandle(): bigint {
    return getHandle(this.ptr, SLOT.get_CurrentNativeWindowHandle);
  }

  /** A guaranteed-hittable point inside the element (UIA GetClickablePoint), or null if it has none. */
  get clickablePoint(): { x: number; y: number } | null {
    const point = Buffer.alloc(8); // POINT { LONG x, LONG y }
    const gotClickable = Buffer.alloc(4); // BOOL
    if (vcall(this.ptr, SLOT.GetClickablePoint, [FFIType.ptr, FFIType.ptr], [point.ptr!, gotClickable.ptr!]) !== S_OK) return null;
    if (gotClickable.readInt32LE(0) === 0) return null;
    return { x: point.readInt32LE(0), y: point.readInt32LE(4) };
  }

  /** Immediate children (control view) as Elements. The caller owns and should release them. */
  get children(): Element[] {
    return this.findAll({}, TreeScope.TreeScope_Children);
  }

  /** The control-view parent, or null at a root. The caller owns the returned Element. */
  get parent(): Element | null {
    const walker = controlViewWalker();
    if (walker === 0n) return null;
    if (vcall(walker, SLOT.GetParentElement, [FFIType.u64, FFIType.ptr], [this.ptr, scratch8.ptr!]) !== S_OK) return null;
    const pointer = scratch8.readBigUInt64LE(0);
    return pointer === 0n ? null : new Element(pointer);
  }

  /** The first descendant (by default) matching the selector, or null. Releases the non-matches. */
  find(selector: Selector, scope: number = TreeScope.TreeScope_Descendants): Element | null {
    const pAutomation = automation();
    const { condition, needsClientFilter } = compileCondition(pAutomation, selector);
    try {
      if (!needsClientFilter) {
        const pointer = findFirstPointer(this.ptr, scope, condition);
        return pointer === 0n ? null : new Element(pointer);
      }
      const pointers = findAllPointers(this.ptr, scope, condition);
      for (let index = 0; index < pointers.length; index += 1) {
        const pointer = pointers[index]!;
        if (matches(readProperties(pointer), selector)) {
          for (let rest = index + 1; rest < pointers.length; rest += 1) comRelease(pointers[rest]!);
          return new Element(pointer);
        }
        comRelease(pointer);
      }
      return null;
    } finally {
      comRelease(condition);
    }
  }

  /**
   * Poll `find` until the selector matches or `timeout` (ms) elapses — the killer feature for flaky
   * native UIs. Paced by an async sleep (never busy-spins). On timeout, throws an error quoting the
   * selector, this element's name, and the nearest candidates.
   */
  async waitFor(selector: Selector, options: { timeout?: number; interval?: number } = {}): Promise<Element> {
    const timeout = options.timeout ?? 5000;
    const interval = options.interval ?? 100;
    const start = Bun.nanoseconds();
    for (;;) {
      const found = this.find(selector);
      if (found !== null) return found;
      if ((Bun.nanoseconds() - start) / 1e6 >= timeout) throw new Error(this.describeNoMatch(selector));
      await Bun.sleep(interval);
    }
  }

  /** Build the actionable no-match message by scanning the candidate set under this element. */
  describeNoMatch(selector: Selector): string {
    const candidates = this.findAll(selector.controlType !== undefined ? { controlType: selector.controlType } : {});
    const names = candidates.map((candidate) => candidate.name);
    for (const candidate of candidates) candidate.release();
    return formatNoMatch(selector, this.name, names);
  }

  /** Every descendant (by default) matching the selector. The caller owns and should release them. */
  findAll(selector: Selector, scope: number = TreeScope.TreeScope_Descendants): Element[] {
    const pAutomation = automation();
    const { condition, needsClientFilter } = compileCondition(pAutomation, selector);
    try {
      const pointers = findAllPointers(this.ptr, scope, condition);
      if (!needsClientFilter) return pointers.map((pointer) => new Element(pointer));
      const result: Element[] = [];
      for (const pointer of pointers) {
        if (matches(readProperties(pointer), selector)) result.push(new Element(pointer));
        else comRelease(pointer);
      }
      return result;
    } finally {
      comRelease(condition);
    }
  }

  /**
   * Every descendant matching the selector, prefetched through one cached round-trip. The returned
   * Elements expose their cached* properties with zero further round-trips. The caller owns them.
   */
  findAllCached(selector: Selector, request: CacheRequest, scope: number = TreeScope.TreeScope_Descendants): Element[] {
    const pAutomation = automation();
    const { condition, needsClientFilter } = compileCondition(pAutomation, selector);
    try {
      if (vcall(this.ptr, SLOT.FindAllBuildCache, [FFIType.i32, FFIType.u64, FFIType.u64, FFIType.ptr], [scope, condition, request.ptr, scratch8.ptr!]) !== S_OK) return [];
      const pArray = scratch8.readBigUInt64LE(0);
      if (pArray === 0n) return [];
      try {
        if (vcall(pArray, SLOT.get_Length, [FFIType.ptr], [scratch4.ptr!]) !== S_OK) return [];
        const length = scratch4.readInt32LE(0);
        const result: Element[] = [];
        for (let index = 0; index < length; index += 1) {
          if (vcall(pArray, SLOT.GetElement, [FFIType.i32, FFIType.ptr], [index, scratch8.ptr!]) !== S_OK) continue;
          const pointer = scratch8.readBigUInt64LE(0);
          if (pointer === 0n) continue;
          if (!needsClientFilter || matches(readCachedProperties(pointer), selector)) result.push(new Element(pointer));
          else comRelease(pointer);
        }
        return result;
      } finally {
        comRelease(pArray);
      }
    } finally {
      comRelease(condition);
    }
  }

  /** Refresh this element's cache (properties + structure) per the request. Returns the cached element. */
  buildUpdatedCache(request: CacheRequest): Element {
    if (vcall(this.ptr, SLOT.BuildUpdatedCache, [FFIType.u64, FFIType.ptr], [request.ptr, scratch8.ptr!]) !== S_OK) return this;
    const pointer = scratch8.readBigUInt64LE(0);
    return pointer === 0n ? this : new Element(pointer);
  }

  // --- cached property reads (valid only on elements returned by findAllCached / buildUpdatedCache) ---

  /** Cached immediate children (in-proc; valid after a Subtree-scoped buildUpdatedCache). */
  get cachedChildren(): Element[] {
    if (vcall(this.ptr, SLOT.GetCachedChildren, [FFIType.ptr], [scratch8.ptr!]) !== S_OK) return [];
    const pArray = scratch8.readBigUInt64LE(0);
    if (pArray === 0n) return [];
    try {
      if (vcall(pArray, SLOT.get_Length, [FFIType.ptr], [scratch4.ptr!]) !== S_OK) return [];
      const length = scratch4.readInt32LE(0);
      const children: Element[] = new Array(length);
      let count = 0;
      for (let index = 0; index < length; index += 1) {
        if (vcall(pArray, SLOT.GetElement, [FFIType.i32, FFIType.ptr], [index, scratch8.ptr!]) !== S_OK) continue;
        const pointer = scratch8.readBigUInt64LE(0);
        if (pointer !== 0n) {
          children[count] = new Element(pointer);
          count += 1;
        }
      }
      children.length = count;
      return children;
    } finally {
      comRelease(pArray);
    }
  }

  get cachedAutomationId(): string {
    return getBstr(this.ptr, SLOT.get_CachedAutomationId);
  }

  get cachedBoundingRectangle(): Rect {
    return getRect(this.ptr, SLOT.get_CachedBoundingRectangle);
  }

  get cachedClassName(): string {
    return getBstr(this.ptr, SLOT.get_CachedClassName);
  }

  get cachedControlType(): number {
    return getLong(this.ptr, SLOT.get_CachedControlType);
  }

  get cachedIsEnabled(): boolean {
    return getLong(this.ptr, SLOT.get_CachedIsEnabled) !== 0;
  }

  get cachedName(): string {
    return getBstr(this.ptr, SLOT.get_CachedName);
  }

  /** Release the underlying COM pointer. */
  release(): void {
    comRelease(this.ptr);
  }

  // --- control-pattern actions (each proven against a real control in Phase 5) ---

  /** Press via InvokePattern. Throws if unsupported (try `.click()`). */
  invoke(): void {
    invoke(this.ptr);
  }

  /** Read a ValuePattern value (e.g. a text box), or '' if unsupported. */
  get value(): string {
    return getValue(this.ptr);
  }

  /** Set a ValuePattern value in one call — no keystrokes. Throws if unsupported (try `.type()`). */
  setValue(text: string): void {
    setValue(this.ptr, text);
  }

  /** Read the TextPattern document text, or '' if unsupported. */
  text(): string {
    return readText(this.ptr);
  }

  /** Read a GridPattern container (data grid / details list / table) as headers + rows of text, or null if unsupported. */
  readTable(maxRows?: number): TableData | null {
    return readTable(this.ptr, maxRows);
  }

  /** Read any UIA property by id (PropertyId.*) via GetCurrentPropertyValue — HelpText, IsOffscreen,
   *  HasKeyboardFocus, ItemStatus, FrameworkId, … decoded from the VARIANT. Null if empty/unsupported. */
  getProperty(propertyId: number): VariantValue {
    return getPropertyValue(this.ptr, propertyId);
  }

  /** Toggle a checkbox via TogglePattern. Throws if unsupported. */
  toggle(): void {
    toggle(this.ptr);
  }

  /** TogglePattern state (0 Off, 1 On, 2 Indeterminate), or -1 if unsupported. */
  get toggleState(): number {
    return toggleState(this.ptr);
  }

  /** Expand via ExpandCollapsePattern. Throws if unsupported. */
  expand(): void {
    expand(this.ptr);
  }

  /** Collapse via ExpandCollapsePattern. Throws if unsupported. */
  collapse(): void {
    collapse(this.ptr);
  }

  /** ExpandCollapsePattern state (0 Collapsed, 1 Expanded, 2 Partial, 3 Leaf), or -1 if unsupported. */
  get expandCollapseState(): number {
    return expandCollapseState(this.ptr);
  }

  /** Select via SelectionItemPattern, replacing the selection. Throws if unsupported. */
  select(): void {
    select(this.ptr);
  }

  /** Whether selected (SelectionItemPattern); false if unsupported. */
  get isSelected(): boolean {
    return isSelected(this.ptr);
  }

  /** Scroll into view via ScrollItemPattern. Throws if unsupported. */
  scrollIntoView(): void {
    scrollIntoView(this.ptr);
  }

  /** Scroll a ScrollPattern container by ScrollAmount steps per axis (page/line, cursor-free, works locked). Throws if unsupported. */
  scroll(horizontalAmount: ScrollAmount, verticalAmount: ScrollAmount): void {
    scroll(this.ptr, horizontalAmount, verticalAmount);
  }

  /** Set a ScrollPattern container's position by percent (0-100); NoScroll (-1) leaves an axis. Throws if unsupported. */
  setScrollPercent(horizontalPercent: number, verticalPercent: number): void {
    setScrollPercent(this.ptr, horizontalPercent, verticalPercent);
  }

  /** ScrollPattern scroll state (percent/view-size/scrollable per axis), or null if unsupported. */
  get scrollInfo(): ScrollInfo | null {
    return scrollInfo(this.ptr);
  }

  /** RangeValuePattern value (slider), or NaN if unsupported. */
  get rangeValue(): number {
    return rangeValue(this.ptr);
  }

  /** Set a RangeValuePattern value (slider). Throws if unsupported. */
  setRangeValue(value: number): void {
    setRangeValue(this.ptr, value);
  }

  /** Close a window via WindowPattern. Throws if unsupported. */
  close(): void {
    windowClose(this.ptr);
  }

  /** Set a window's visual state (WindowVisualState) via WindowPattern. Throws if unsupported. */
  setVisualState(state: WindowVisualState): void {
    setWindowVisualState(this.ptr, state);
  }

  // --- synthetic input fallbacks (SendInput) for controls without a usable pattern ---

  /** Give the element keyboard focus (UIA SetFocus). Returns this for chaining. */
  focus(): this {
    vcall(this.ptr, SLOT.SetFocus, [], []);
    return this;
  }

  /** Focus the element, then type Unicode text into it via SendInput. Returns this for chaining. */
  type(text: string): this {
    this.focus();
    inputType(text);
    return this;
  }

  /** Click the element via SendInput at its GetClickablePoint (bounding-rectangle center fallback). The no-InvokePattern fallback. */
  click(): this {
    const hWnd = this.nativeWindowHandle;
    if (hWnd !== 0n) User32.SetForegroundWindow(hWnd);
    const clickable = this.clickablePoint;
    if (clickable !== null) clickAt(clickable.x, clickable.y);
    else {
      const rect = this.boundingRectangle;
      clickAt(rect.x + Math.floor(rect.width / 2), rect.y + Math.floor(rect.height / 2));
    }
    return this;
  }
}

/** Attach an Element to a window handle (ElementFromHandle, slot 6 — NativeWindowHandle round-trips). */
export function fromHandle(hWnd: bigint): Element {
  const hr = vcall(automation(), SLOT.ElementFromHandle, [FFIType.u64, FFIType.ptr], [hWnd, scratch8.ptr!]);
  const pointer = scratch8.readBigUInt64LE(0);
  if (hr !== S_OK || pointer === 0n) throw new Error(`ElementFromHandle(0x${hWnd.toString(16)}) failed: ${hresult(hr)}`);
  return new Element(pointer);
}

/** The element with keyboard focus. */
export function focused(): Element {
  const hr = vcall(automation(), SLOT.GetFocusedElement, [FFIType.ptr], [scratch8.ptr!]);
  const pointer = scratch8.readBigUInt64LE(0);
  if (hr !== S_OK || pointer === 0n) throw new Error(`GetFocusedElement failed: ${hresult(hr)}`);
  return new Element(pointer);
}

/** The element at a screen point (POINT packed by value: x in the low dword, y in the high dword). */
export function fromPoint(x: number, y: number): Element {
  const point = (BigInt(y >>> 0) << 32n) | BigInt(x >>> 0);
  const hr = vcall(automation(), SLOT.ElementFromPoint, [FFIType.u64, FFIType.ptr], [point, scratch8.ptr!]);
  const pointer = scratch8.readBigUInt64LE(0);
  if (hr !== S_OK || pointer === 0n) throw new Error(`ElementFromPoint(${x},${y}) failed: ${hresult(hr)}`);
  return new Element(pointer);
}

/** The desktop root element. Never FindAll(Descendants) from here — scope to a window. */
export function root(): Element {
  const hr = vcall(automation(), SLOT.GetRootElement, [FFIType.ptr], [scratch8.ptr!]);
  const pointer = scratch8.readBigUInt64LE(0);
  if (hr !== S_OK || pointer === 0n) throw new Error(`GetRootElement failed: ${hresult(hr)}`);
  return new Element(pointer);
}

/** A top-level window — an Element scoped to a window handle, with `using`-friendly disposal. */
export class Window extends Element {
  readonly hWnd: bigint;

  constructor(ptr: bigint, hWnd: bigint) {
    super(ptr);
    this.hWnd = hWnd;
  }

  /** Bring the window to the foreground (best-effort; blocked on a locked session). */
  activate(): this {
    User32.SetForegroundWindow(this.hWnd);
    return this;
  }

  /** Capture the window via PrintWindow as PNG bytes (blank on a locked session). */
  screenshot(): Uint8Array {
    return windowScreenshot(this.hWnd);
  }

  /** Release the window element. Enables `using app = uia.attach(...)`. */
  dispose(): void {
    this.release();
  }

  [Symbol.dispose](): void {
    this.dispose();
  }
}

function resolveWindow(target: string | bigint | { className?: string; process?: number; title?: string }): bigint {
  if (typeof target === 'bigint') return target;
  if (typeof target !== 'string' && target.process !== undefined) return windowForProcess(target.process);
  const title = typeof target === 'string' ? target : target.title;
  const className = typeof target === 'string' ? undefined : target.className;
  const classBuffer = className === undefined ? null : Buffer.from(`${className}\0`, 'utf16le').ptr!;
  const titleBuffer = title === undefined ? null : Buffer.from(`${title}\0`, 'utf16le').ptr!;
  return User32.FindWindowW(classBuffer, titleBuffer);
}

/** Attach to a top-level window by title, handle, `{ title, className }`, or `{ process }`. Throws if absent. */
export function attach(target: string | bigint | { className?: string; process?: number; title?: string }): Window {
  const hWnd = resolveWindow(target);
  if (hWnd === 0n) throw new Error(`attach: no window found for ${JSON.stringify(target, (_key, value) => (typeof value === 'bigint' ? `0x${value.toString(16)}` : value))}`);
  const hr = vcall(automation(), SLOT.ElementFromHandle, [FFIType.u64, FFIType.ptr], [hWnd, scratch8.ptr!]);
  const pointer = scratch8.readBigUInt64LE(0);
  if (hr !== S_OK || pointer === 0n) throw new Error(`attach: ElementFromHandle failed: ${hresult(hr)}`);
  return new Window(pointer, hWnd);
}

/** Spawn a process and wait for its window to appear, then attach — no hand-rolled FindWindow loop. */
export async function launch(command: string | readonly string[], target: { className?: string; title?: string }, timeout = 8000): Promise<Window> {
  Bun.spawn(typeof command === 'string' ? command.split(' ') : [...command], { stdout: 'ignore', stderr: 'ignore' });
  const start = Bun.nanoseconds();
  for (;;) {
    const hWnd = resolveWindow(target);
    if (hWnd !== 0n) {
      Bun.sleepSync(400); // let the content realize
      return attach(hWnd);
    }
    if ((Bun.nanoseconds() - start) / 1e6 >= timeout) throw new Error(`launch: window ${JSON.stringify(target)} did not appear within ${timeout}ms`);
    await Bun.sleep(150);
  }
}
