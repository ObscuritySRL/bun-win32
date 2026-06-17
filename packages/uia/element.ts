// Element: a live IUIAutomationElement pointer with typed property reads, tree search, and the
// proven control-pattern actions. Property readers live in reads.ts; pattern actions in patterns.ts.

import { FFIType } from 'bun:ffi';

import User32 from '@bun-win32/user32';

import { automation, controlViewWalker } from './automation';
import { AutomationElementMode, type CacheRequest, createCacheRequest } from './cache';
import { comRelease, hresult, vcall } from './com';
import { type CompiledCondition, compileCondition, type ElementProperties, formatNoMatch, matches, needsSubtreeFilter, type Selector, selectorToString } from './condition';
import { ControlType, PropertyId, S_OK, SLOT, TreeScope } from './constants';
import { ownerHwnd, postClickToHwnd } from './coords';
import { clickAt, type as inputType } from './input';
import { type OcrText, ocrBitmap } from './ocr';
import { type Bitmap, cropBitmap } from './screen';
import { captureWindowLive } from './wgc';
import { captureWindowRGB, listWindows, renderWidgetHandles, screenshot as windowScreenshot, windowForProcess } from './window';
import {
  addToSelection,
  canMove,
  canResize,
  canRotate,
  canSelectMultiple,
  collapse,
  doDefaultAction,
  ExpandCollapseState,
  expand,
  expandCollapseState,
  getCell,
  getSelectedText,
  getSelectionPointers,
  getValue,
  gridItemPosition,
  invoke,
  isSelected,
  move,
  NoScroll,
  rangeValue,
  readTable,
  readText,
  readVisibleText,
  removeFromSelection,
  resize,
  rotate,
  scroll,
  ScrollAmount,
  scrollInfo,
  scrollIntoView,
  select,
  selectText,
  setRangeValue,
  setScrollPercent,
  setValue,
  setView,
  setWindowVisualState,
  showContextMenu,
  ToggleState,
  toggle,
  toggleState,
  views,
  windowClose,
  type ScrollInfo,
  type TableData,
  type ViewState,
  type WindowVisualState,
} from './patterns';
import { getBstr, getHandle, getLong, getPropertyValue, getRect, type Rect, type VariantValue } from './reads';

/** A control-STATE expectation for the retrying waitForState — the Playwright web-first-assertion analogue. Every
 *  field is optional; the wait succeeds when ALL provided fields hold simultaneously. `toggle`/`expanded`/`selected`/
 *  `enabled` are booleans (the desired on/expanded/selected/enabled-ness); `value` is an exact ValuePattern match and
 *  `valueContains` a substring. At least one field should be set or the predicate is vacuously true on the first poll. */
export interface StateExpectation {
  enabled?: boolean;
  expanded?: boolean;
  selected?: boolean;
  toggle?: boolean;
  value?: string;
  valueContains?: string;
  timeout?: number;
  interval?: number;
}

const GA_ROOT = 2; // GetAncestor: the top-level WGC-capturable window of an element's own/ancestor HWND

// Reused scratch for out-parameters in the tree-search path. Each value is read out immediately.
const scratch8 = Buffer.alloc(8);
const scratch4 = Buffer.alloc(4);

// The four properties the client-side matcher (regex/substring) needs. The client-filter find path prefetches
// them in ONE FindAllBuildCache round-trip, so each candidate is matched from cache instead of 4 live reads.
const MATCHER_PROPERTIES: readonly number[] = [PropertyId.AutomationId, PropertyId.ClassName, PropertyId.ControlType, PropertyId.Name];

/** Read the matcher's four properties from the prefetched cache (zero further round-trips). */
function readCachedProperties(ptr: bigint): ElementProperties {
  return {
    automationId: getBstr(ptr, SLOT.get_CachedAutomationId),
    className: getBstr(ptr, SLOT.get_CachedClassName),
    controlType: getLong(ptr, SLOT.get_CachedControlType),
    name: getBstr(ptr, SLOT.get_CachedName),
  };
}

// Whether the candidate `ptr` survives the selector's descendant-scoped filter (has/hasText, Playwright filter()).
// Only the client-filter loops call this, and only after needsSubtreeFilter(selector) — so it stays off the hot path.
// Each predicate is one Subtree find (TreeScope_Subtree = element+descendants) on a borrowed Element wrapping ptr; the
// wrapper is NOT released (the loop owns ptr's lifetime), but the matched descendant Element it returns IS released here.
function subtreeMatches(ptr: bigint, selector: Selector): boolean {
  const candidate = new Element(ptr);
  if (selector.has !== undefined) {
    const inner = candidate.find(selector.has, TreeScope.TreeScope_Subtree);
    if (inner === null) return false;
    inner.release();
  }
  if (selector.hasText !== undefined) {
    const inner = candidate.find({ nameContains: selector.hasText }, TreeScope.TreeScope_Subtree);
    if (inner === null) return false;
    inner.release();
  }
  // hasNot/hasNotText (Playwright filter({hasNot, hasNotText}) / FlaUI .Not()): the inverse of has/hasText — REJECT the
  // candidate when its subtree DOES contain the match. Same one Subtree find; the returned descendant Element is released.
  if (selector.hasNot !== undefined) {
    const inner = candidate.find(selector.hasNot, TreeScope.TreeScope_Subtree);
    if (inner !== null) {
      inner.release();
      return false;
    }
  }
  if (selector.hasNotText !== undefined) {
    const inner = candidate.find({ nameContains: selector.hasNotText }, TreeScope.TreeScope_Subtree);
    if (inner !== null) {
      inner.release();
      return false;
    }
  }
  // labeledBy (Playwright getByLabel / FlaUI LabeledBy): read the candidate's UIA LabeledBy property — the element
  // that LABELS it (e.g. the Text control naming an empty-Name edit) — and keep the candidate only when that label's
  // Name equals the requested string. get_CurrentLabeledBy returns an owned IUIAutomationElement* (or 0n when the
  // provider exposes no label); the borrowed `candidate` wrapper is never released (the loop owns ptr), but the
  // returned label Element IS released here. A control with no LabeledBy never matches a labeledBy selector.
  if (selector.labeledBy !== undefined) {
    if (vcall(ptr, SLOT.get_CurrentLabeledBy, [FFIType.ptr], [scratch8.ptr!]) !== S_OK) return false;
    const labelPointer = scratch8.readBigUInt64LE(0);
    if (labelPointer === 0n) return false;
    const label = new Element(labelPointer);
    const matched = label.name === selector.labeledBy;
    label.release();
    if (!matched) return false;
  }
  return true;
}

function findFirstPointer(scopeElement: bigint, scope: number, condition: bigint): bigint {
  if (vcall(scopeElement, SLOT.FindFirst, [FFIType.i32, FFIType.u64, FFIType.ptr], [scope, condition, scratch8.ptr!]) !== S_OK) return 0n;
  return scratch8.readBigUInt64LE(0);
}

/** First element matching a PRE-COMPILED condition under `scopeElement` (server-side, then the client-side
 *  `matches` pass for regex/substring) — shared by find() and the waitFor poll loop so the condition is
 *  compiled once and reused across every poll instead of per-poll. */
function findFirstMatch(scopeElement: bigint, compiled: CompiledCondition, selector: Selector, scope: number): Element | null {
  if (!compiled.needsClientFilter) {
    const pointer = findFirstPointer(scopeElement, scope, compiled.condition);
    return pointer === 0n ? null : new Element(pointer);
  }
  // Regex/substring client filter: prefetch the matcher props in ONE FindAllBuildCache round-trip, then match
  // each candidate from cache (zero further round-trips) instead of 4 live reads per candidate. The CacheRequest
  // is a client-side object (in-proc to build/release); the returned Elements are Full-mode (actionable).
  const request = createCacheRequest(MATCHER_PROPERTIES, TreeScope.TreeScope_Element, AutomationElementMode.Full);
  try {
    const subtreeFilter = needsSubtreeFilter(selector);
    const pointers = findAllCachedPointers(scopeElement, scope, compiled.condition, request.ptr);
    for (let index = 0; index < pointers.length; index += 1) {
      const pointer = pointers[index]!;
      if (matches(readCachedProperties(pointer), selector) && (!subtreeFilter || subtreeMatches(pointer, selector))) {
        for (let rest = index + 1; rest < pointers.length; rest += 1) comRelease(pointers[rest]!);
        return new Element(pointer);
      }
      comRelease(pointer);
    }
    return null;
  } finally {
    request.release();
  }
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

/** FindAllBuildCache variant of findAllPointers: one round-trip prefetches `requestPtr`'s properties onto every
 *  match, so the caller reads them from cache (zero further round-trips). Returns the cached, Full-mode pointers. */
function findAllCachedPointers(scopeElement: bigint, scope: number, condition: bigint, requestPtr: bigint): bigint[] {
  if (vcall(scopeElement, SLOT.FindAllBuildCache, [FFIType.i32, FFIType.u64, FFIType.u64, FFIType.ptr], [scope, condition, requestPtr, scratch8.ptr!]) !== S_OK) return [];
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

/** Whether `element`'s live state satisfies every field set on `expectation` (the waitForState predicate). */
function stateMatches(element: Element, expectation: StateExpectation): boolean {
  if (expectation.enabled !== undefined && element.isEnabled !== expectation.enabled) return false;
  if (expectation.expanded !== undefined && element.expandCollapseState !== (expectation.expanded ? ExpandCollapseState.Expanded : ExpandCollapseState.Collapsed)) return false;
  if (expectation.selected !== undefined && element.isSelected !== expectation.selected) return false;
  if (expectation.toggle !== undefined && element.toggleState !== (expectation.toggle ? ToggleState.On : ToggleState.Off)) return false;
  if (expectation.value !== undefined && element.value !== expectation.value) return false;
  if (expectation.valueContains !== undefined && !element.value.includes(expectation.valueContains)) return false;
  return true;
}

/** A terse one-line dump of the state getters a waitForState predicate reads, for the timeout error. */
function describeState(element: Element): string {
  return `enabled=${element.isEnabled} toggle=${element.toggleState} selected=${element.isSelected} expand=${element.expandCollapseState} value=${JSON.stringify(element.value)}`;
}

export class Element {
  #ptr: bigint;

  constructor(ptr: bigint) {
    this.#ptr = ptr;
  }

  /** The live IUIAutomationElement pointer, or 0n once released — reading state on 0n throws a catchable error
   *  (com.ts vcall null-interface guard) instead of vcall-ing a freed, refcount-0 COM proxy and segfaulting. */
  get ptr(): bigint {
    return this.#ptr;
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

  /** Whether the element is scrolled/clipped out of the visible area (UIA IsOffscreen) — true items are still
   *  in the tree but not painted; reveal() scrolls them back into view. False if the provider omits it. */
  get isOffscreen(): boolean {
    return getPropertyValue(this.ptr, PropertyId.IsOffscreen) === true;
  }

  /** Whether this is a password/secret field (UIA IsPassword). Read it before emitting `value` anywhere an agent
   *  or audit log would see it — a secret cannot be un-leaked once streamed into model context. */
  get isPassword(): boolean {
    return getPropertyValue(this.ptr, PropertyId.IsPassword) === true;
  }

  get name(): string {
    return getBstr(this.ptr, SLOT.get_CurrentName);
  }

  get nativeWindowHandle(): bigint {
    return getHandle(this.ptr, SLOT.get_CurrentNativeWindowHandle);
  }

  /** The browser/host window handle of the Chromium/Electron render surface this element lives in, or 0n if it is not
   *  Chromium web content. Walks self → ancestors to the first element that owns a window and returns it ONLY when that
   *  window's class is a Chromium host (Chrome_RenderWidgetHostHWND / Chrome_WidgetWin_1). This is the cursor-free
   *  wheel-scroll target for a web page, whose own UIA ScrollPattern falsely reports not-scrollable; for any other
   *  control it returns 0n so callers fall back to their normal path. The caller does NOT own any returned handle. */
  chromiumHostHandle(): bigint {
    let node: Element | null = this;
    for (let depth = 0; node !== null && depth < 32; depth += 1) {
      const handle = node.nativeWindowHandle;
      if (handle !== 0n) {
        const buffer = Buffer.alloc(512);
        const length = User32.GetClassNameW(handle, buffer.ptr!, 256);
        const className = length > 0 ? buffer.subarray(0, length * 2).toString('utf16le') : '';
        if (node !== this) node.release();
        return className === 'Chrome_RenderWidgetHostHWND' || className === 'Chrome_WidgetWin_1' ? handle : 0n;
      }
      const parent: Element | null = node.parent;
      if (node !== this) node.release();
      node = parent;
    }
    return 0n;
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

  /** The control-view FIRST child prefetched through `request` in ONE round-trip (GetFirstChildElementBuildCache on
   *  the cached control-view walker), or null at a leaf. The returned Element arrives with the request's Full cache —
   *  the budget-bounded snapshot walk navigates a dense parent O(maxNodes) siblings at a time instead of marshaling
   *  the whole subtree up front. The caller owns the returned Element. */
  firstChildCached(request: CacheRequest): Element | null {
    const walker = controlViewWalker();
    if (walker === 0n) return null;
    if (vcall(walker, SLOT.GetFirstChildElementBuildCache, [FFIType.u64, FFIType.u64, FFIType.ptr], [this.ptr, request.ptr, scratch8.ptr!]) !== S_OK) return null;
    const pointer = scratch8.readBigUInt64LE(0);
    return pointer === 0n ? null : new Element(pointer);
  }

  /** The control-view NEXT sibling prefetched through `request` in ONE round-trip (GetNextSiblingElementBuildCache on
   *  the cached control-view walker), or null at the last sibling. Pairs with firstChildCached for the budget-bounded
   *  snapshot enumeration. The caller owns the returned Element. */
  nextSiblingCached(request: CacheRequest): Element | null {
    const walker = controlViewWalker();
    if (walker === 0n) return null;
    if (vcall(walker, SLOT.GetNextSiblingElementBuildCache, [FFIType.u64, FFIType.u64, FFIType.ptr], [this.ptr, request.ptr, scratch8.ptr!]) !== S_OK) return null;
    const pointer = scratch8.readBigUInt64LE(0);
    return pointer === 0n ? null : new Element(pointer);
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
    const compiled = compileCondition(automation(), selector);
    try {
      return findFirstMatch(this.ptr, compiled, selector, scope);
    } finally {
      if (compiled.owned) comRelease(compiled.condition);
    }
  }

  /**
   * Find a descendant that may be VIRTUALIZED or scrolled below the fold. Tries find() first; if it misses,
   * scrolls a scrollable container from the top down a page at a time, re-running find() after each step until
   * the item realizes into the tree — cursor-free, no focus, works on a background/occluded window. Returns the
   * realized Element (caller owns it) or null after exhausting the container.
   *
   * `container` overrides the auto-picked scroll container (default: the first List/DataGrid/Tree/Table under
   * this element). This scroll-reveal is the reliable path because ItemContainer.FindItemByProperty — the
   * one-call alternative — segfaults uiautomationcore.dll under Bun FFI on a VT_BSTR VARIANT-by-value (the
   * cross-process marshaling proxy faults), so it is not bound.
   */
  reveal(selector: Selector, options: { container?: Element; maxSteps?: number; fromTop?: boolean } = {}): Element | null {
    const direct = this.find(selector);
    if (direct !== null) return direct;
    const container = options.container ?? this.find({ controlType: ControlType.List }) ?? this.find({ controlType: ControlType.DataGrid }) ?? this.find({ controlType: ControlType.Tree }) ?? this.find({ controlType: ControlType.Table });
    if (container === null) return null;
    try {
      const info = container.scrollInfo;
      if (info === null) return this.find(selector);
      const maxSteps = options.maxSteps ?? 80; // a LargeIncrement is ~one viewport page (measured ~15% of a 4000-item list/step → ~7 steps to traverse it), so 80 pages covers any practical list; the progress-break below stops at end-of-list
      // Scan ONE axis: rewind to its start (unless fromTop:false), then step in LargeIncrements until the item is found
      // or the axis stops progressing. Used for the vertical axis (primary) and, when an item is horizontally scrolled
      // off (carousels, wide lists, horizontally-virtualized panes), the horizontal axis a vertical-only scan misses.
      const scan = (scrollable: boolean, percent: () => number, toStart: () => void, step: () => void): Element | null => {
        if (!scrollable) return null;
        if (options.fromTop !== false && percent() > 0) {
          toStart();
          Bun.sleepSync(120);
        }
        for (let count = 0; count < maxSteps; count += 1) {
          const found = this.find(selector);
          if (found !== null) return found;
          const before = percent();
          if (before >= 100) break;
          step();
          Bun.sleepSync(120);
          if (percent() <= before) break; // reached the end / no progress
        }
        return null;
      };
      return (
        scan(
          info.verticallyScrollable,
          () => container.scrollInfo?.verticalPercent ?? 100,
          () => container.setScrollPercent(NoScroll, 0),
          () => container.scroll(ScrollAmount.NoAmount, ScrollAmount.LargeIncrement),
        ) ??
        scan(
          container.scrollInfo?.horizontallyScrollable ?? false,
          () => container.scrollInfo?.horizontalPercent ?? 100,
          () => container.setScrollPercent(0, NoScroll),
          () => container.scroll(ScrollAmount.LargeIncrement, ScrollAmount.NoAmount),
        ) ??
        this.find(selector)
      );
    } finally {
      if (container !== options.container) container.release();
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
    const compiled = compileCondition(automation(), selector); // compile ONCE — reused across every poll
    try {
      for (;;) {
        const found = findFirstMatch(this.ptr, compiled, selector, TreeScope.TreeScope_Descendants);
        if (found !== null) return found;
        const elapsed = (Bun.nanoseconds() - start) / 1e6;
        if (elapsed >= timeout) throw new Error(`timed out after ${Math.round(elapsed)} ms — ${this.describeNoMatch(selector)}`);
        await Bun.sleep(interval);
      }
    } finally {
      if (compiled.owned) comRelease(compiled.condition);
    }
  }

  /**
   * Poll `find` until the selector NO LONGER matches or `timeout` (ms) elapses — the inverse of waitFor, for the
   * spinner / "Loading…" / progress / just-dismissed-modal gate every real app flow needs (wait for the busy thing to
   * VANISH before proceeding). Paced by an async sleep. On timeout, throws quoting the still-present selector.
   */
  async waitForGone(selector: Selector, options: { timeout?: number; interval?: number } = {}): Promise<void> {
    const timeout = options.timeout ?? 5000;
    const interval = options.interval ?? 100;
    const start = Bun.nanoseconds();
    const compiled = compileCondition(automation(), selector); // compile ONCE — reused across every poll
    try {
      for (;;) {
        const found = findFirstMatch(this.ptr, compiled, selector, TreeScope.TreeScope_Descendants);
        if (found === null) return;
        found.release(); // still present — drop the handle so the poll cannot leak Elements
        const elapsed = (Bun.nanoseconds() - start) / 1e6;
        if (elapsed >= timeout) throw new Error(`timed out after ${Math.round(elapsed)} ms — ${selectorToString(selector)} is still present in ${JSON.stringify(this.name)} (it never disappeared)`);
        await Bun.sleep(interval);
      }
    } finally {
      if (compiled.owned) comRelease(compiled.condition);
    }
  }

  /**
   * Poll the descendant matching `selector` until its STATE matches `expectation` or `timeout` (ms) elapses — the
   * desktop analogue of Playwright's retrying web-first assertions (expect(locator).toBeChecked()/toHaveValue()/…).
   * Use it to CONFIRM an action landed (toggled Wi-Fi is now on, a set value stuck, an item is now selected/expanded/
   * enabled) instead of hand-rolling snapshot → parse → sleep → re-snapshot. Re-finds the control every poll (so it
   * survives a control rebuilt by a re-render) and reads the same live getters the snapshot does. Paced by an async
   * sleep. Returns the matched Element (caller owns it) on success; throws on timeout quoting the last-seen state.
   */
  async waitForState(selector: Selector, expectation: StateExpectation): Promise<Element> {
    const timeout = expectation.timeout ?? 5000;
    const interval = expectation.interval ?? 100;
    const start = Bun.nanoseconds();
    const compiled = compileCondition(automation(), selector); // compile ONCE — reused across every poll
    try {
      let lastSeen = 'no matching control';
      for (;;) {
        const found = findFirstMatch(this.ptr, compiled, selector, TreeScope.TreeScope_Descendants);
        if (found !== null) {
          if (stateMatches(found, expectation)) return found;
          lastSeen = describeState(found);
          found.release(); // not yet in the wanted state — drop the handle so the poll cannot leak Elements
        }
        const elapsed = (Bun.nanoseconds() - start) / 1e6;
        if (elapsed >= timeout) throw new Error(`timed out after ${Math.round(elapsed)} ms — ${selectorToString(selector)} in ${JSON.stringify(this.name)} never reached ${JSON.stringify(expectation)} (last seen: ${lastSeen})`);
        await Bun.sleep(interval);
      }
    } finally {
      if (compiled.owned) comRelease(compiled.condition);
    }
  }

  /** Build the actionable no-match message by scanning the candidate set under this element. */
  describeNoMatch(selector: Selector): string {
    const candidates = this.findAll(selector.controlType !== undefined ? { controlType: selector.controlType } : {});
    const names = candidates.slice(0, 200).map((candidate) => candidate.name); // read a WIDE pool of Names so formatNoMatch can RANK the nearest (it renders only the top 8); a low cap here would hide the relevant candidate on a >20-descendant window. Runs only on the rare no-match error path.
    for (const candidate of candidates) candidate.release();
    // A controlType filter that matched NOTHING teaches a cold agent nothing — the most universal first move (Edit, to type
    // into a text box) misses on modern WinUI/Notepad (which expose Document/Text). Run a SECOND unfiltered scan and surface
    // the DISTINCT control types actually present so the next retry can pick one (or drop controlType). Only on the empty path.
    if (selector.controlType !== undefined && candidates.length === 0) {
      const present = this.findAll({});
      const availableControlTypes = [...new Set(present.slice(0, 200).map((element) => element.controlTypeName))].sort().slice(0, 12);
      for (const element of present) element.release();
      return formatNoMatch(selector, this.name, names, availableControlTypes);
    }
    return formatNoMatch(selector, this.name, names);
  }

  /** Every descendant (by default) matching the selector. The caller owns and should release them. */
  findAll(selector: Selector, scope: number = TreeScope.TreeScope_Descendants): Element[] {
    const compiled = compileCondition(automation(), selector);
    try {
      if (!compiled.needsClientFilter) return findAllPointers(this.ptr, scope, compiled.condition).map((pointer) => new Element(pointer));
      // Regex/substring client filter: one cached round-trip prefetches the matcher props, so each candidate is
      // matched in-proc instead of 4 live cross-process reads each (the dominant cost on a large window).
      const request = createCacheRequest(MATCHER_PROPERTIES, TreeScope.TreeScope_Element, AutomationElementMode.Full);
      const subtreeFilter = needsSubtreeFilter(selector);
      try {
        const result: Element[] = [];
        for (const pointer of findAllCachedPointers(this.ptr, scope, compiled.condition, request.ptr)) {
          if (matches(readCachedProperties(pointer), selector) && (!subtreeFilter || subtreeMatches(pointer, selector))) result.push(new Element(pointer));
          else comRelease(pointer);
        }
        return result;
      } finally {
        request.release();
      }
    } finally {
      if (compiled.owned) comRelease(compiled.condition);
    }
  }

  /**
   * Every descendant matching the selector, prefetched through one cached round-trip. The returned
   * Elements expose their cached* properties with zero further round-trips. The caller owns them.
   */
  findAllCached(selector: Selector, request: CacheRequest, scope: number = TreeScope.TreeScope_Descendants): Element[] {
    const compiled = compileCondition(automation(), selector);
    const subtreeFilter = needsSubtreeFilter(selector);
    try {
      if (vcall(this.ptr, SLOT.FindAllBuildCache, [FFIType.i32, FFIType.u64, FFIType.u64, FFIType.ptr], [scope, compiled.condition, request.ptr, scratch8.ptr!]) !== S_OK) return [];
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
          if ((!compiled.needsClientFilter || matches(readCachedProperties(pointer), selector)) && (!subtreeFilter || subtreeMatches(pointer, selector))) result.push(new Element(pointer));
          else comRelease(pointer);
        }
        return result;
      } finally {
        comRelease(pArray);
      }
    } finally {
      if (compiled.owned) comRelease(compiled.condition);
    }
  }

  /** Refresh this element's cache (properties + structure) per the request. Returns the cached element. */
  buildUpdatedCache(request: CacheRequest): Element {
    if (vcall(this.ptr, SLOT.BuildUpdatedCache, [FFIType.u64, FFIType.ptr], [request.ptr, scratch8.ptr!]) !== S_OK) return this;
    const pointer = scratch8.readBigUInt64LE(0);
    return pointer === 0n ? this : new Element(pointer);
  }

  // cached property reads — valid only on elements from findAllCached / buildUpdatedCache
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

  get cachedControlTypeName(): string {
    const id = this.cachedControlType;
    return ControlType[id] ?? `Type(${id})`;
  }

  get cachedIsEnabled(): boolean {
    return getLong(this.ptr, SLOT.get_CachedIsEnabled) !== 0;
  }

  get cachedName(): string {
    return getBstr(this.ptr, SLOT.get_CachedName);
  }

  /** Release the underlying COM pointer, idempotently — zeroes the owned pointer so a second release()/dispose()
   *  is a no-op (comRelease(0n)), not a double IUnknown::Release on a refcount-0 freed proxy that SEGFAULTS the
   *  host process uncatchably. Any post-release accessor then hits the com.ts null-interface guard and throws
   *  catchably. Window.dispose() routes through here, so it inherits idempotency for free. */
  release(): void {
    comRelease(this.#ptr);
    this.#ptr = 0n;
  }

  // control-pattern actions — each proven against a real control in Phase 5
  /** Press via InvokePattern. Throws if unsupported (try `.click()`). NOTE: on a classic Win32/HWND (MSAA-bridged)
   *  control the OS routes InvokePattern through focus + accDoDefaultAction, which ACTIVATES the control's window and
   *  STEALS FOREGROUND to its HWND (proven live on minimized charmap — findings/32). For a focus-clean press on an
   *  own-HWND "Button"-class control post BM_CLICK instead (the MCP invoke tool does this automatically). */
  invoke(): void {
    invoke(this.ptr);
  }

  /** Invoke the control's MSAA default action (LegacyIAccessible) — cursor-free, no focus (e.g. "Press" a button).
   *  A fallback activate for controls with no Invoke pattern; Explorer shell items take it as a no-op, so prefer invoke() there. Throws if unsupported. */
  doDefaultAction(): void {
    doDefaultAction(this.ptr);
  }

  /** Read a ValuePattern value (e.g. a text box), or '' if unsupported. */
  get value(): string {
    return getValue(this.ptr);
  }

  /** Set a ValuePattern value in one call — no keystrokes. Throws if unsupported (try `.type()`). NOTE: on a classic
   *  Win32/HWND (MSAA-bridged) control the OS routes ValuePattern.SetValue through focus, which ACTIVATES the control's
   *  window and STEALS FOREGROUND to its HWND (proven live on minimized Notepad RichEditD2DPT — findings/32). For a
   *  focus-clean write to an own-HWND text control post WM_SETTEXT (setControlText) — the MCP set_value tool does this
   *  automatically; ValuePattern stays the path for a no-own-HWND WinUI/WPF/Electron sub-control. */
  setValue(text: string): void {
    setValue(this.ptr, text);
  }

  /** Read the TextPattern document text, or '' if unsupported. */
  text(): string {
    return readText(this.ptr);
  }

  /** Read only the ON-SCREEN text of a TextPattern document (GetVisibleRanges) — bounded to what's visible, the
   *  right read for a huge terminal / editor (text() pulls the whole scrollback). '' if unsupported / nothing visible. */
  visibleText(): string {
    return readVisibleText(this.ptr);
  }

  /** Capture JUST this control's pixels, OCCLUSION-CORRECT (FlaUI Capture.Element / Playwright locator.screenshot) —
   *  a <canvas>/chart/WebGL/custom-draw control that exposes no text. Captures the element's OWN top-level window via
   *  WGC (captureWindowLive: occluded/background/GPU-composited), falling back to PrintWindow (captureWindowRGB), then
   *  crops to this element's window-local bounds — so overlapping windows can NEVER leak in (unlike a screen-region
   *  grab, which blits whatever is topmost at those pixels). Returns the cropped Bitmap (origin = screen-absolute) or
   *  null if the owner window has no surface (minimized / protected / off-screen). */
  async capture(): Promise<Bitmap | null> {
    const owner = User32.GetAncestor(ownerHwnd(this), GA_ROOT);
    if (owner === 0n) return null;
    const window = (await captureWindowLive(owner)) ?? captureWindowRGB(owner);
    if (window === null) return null;
    const bounds = this.boundingRectangle;
    return cropBitmap({ rgb: window.rgb, width: window.width, height: window.height, originX: window.originX, originY: window.originY }, bounds.x - window.originX, bounds.y - window.originY, bounds.width, bounds.height);
  }

  /** OCR JUST this control's pixels (the see-pixels read for a no-a11y surface), OCCLUSION-CORRECT via capture():
   *  per-word/line boxes are SCREEN-absolute (postClick a box centre). Null if the control has no capturable surface. */
  async ocr(options?: { timeoutMs?: number }): Promise<OcrText | null> {
    const bitmap = await this.capture();
    return bitmap === null ? null : ocrBitmap(bitmap, options);
  }

  /** Open this control's context menu CURSOR-FREE (IUIAutomationElement3::ShowContextMenu) — the provider raises its
   *  own menu, no real right-click, works on a background window. The menu opens as an untitled top-level popup;
   *  find it with listWindows({includeUntitled}) and attach it. Returns false if the provider lacks Element3. */
  showContextMenu(): boolean {
    return showContextMenu(this.ptr);
  }

  /** This container's current view + supported views (MultipleViewPattern) — e.g. File Explorer Details/List/Icons.
   *  null when the control has no MultipleView pattern. */
  views(): ViewState | null {
    return views(this.ptr);
  }

  /** Switch this container to view `id` CURSOR-FREE (MultipleView.SetCurrentView). False if unsupported / invalid id. */
  setView(id: number): boolean {
    return setView(this.ptr, id);
  }

  /** Find a substring in this text/document control and SELECT it cursor-free (the desktop getByText). Returns the matched text, or null if unsupported / not found. */
  selectText(text: string, options?: { backward?: boolean; ignoreCase?: boolean }): string | null {
    return selectText(this.ptr, text, options);
  }

  /** The current text selection of this TextPattern control (selected ranges concatenated), or '' if none/unsupported. */
  getSelectedText(): string {
    return getSelectedText(this.ptr);
  }

  /** Read a GridPattern container (data grid / details list / table) as headers + rows of text, or null if unsupported. */
  readTable(maxRows?: number): TableData | null {
    return readTable(this.ptr, maxRows);
  }

  /** The cell Element at (row, column) of a GridPattern container — compose setValue()/invoke()/toggle() on it
   *  for a cursor-free grid-cell edit. The caller owns the returned Element. Null if no GridPattern / no such cell. */
  cell(row: number, column: number): Element | null {
    const pointer = getCell(this.ptr, row, column);
    return pointer === 0n ? null : new Element(pointer);
  }

  /** This cell's REVERSE position in its grid via GridItemPattern — 0-based row/column + row/column spans. The
   *  complement of cell(): find a cell by Name, then learn where it sits to read the rest of that record. Null if
   *  this element is not a grid cell (no GridItem pattern). */
  gridPosition(): { row: number; column: number; rowSpan: number; columnSpan: number } | null {
    return gridItemPosition(this.ptr);
  }

  /** Read any UIA property by id (PropertyId.*) via GetCurrentPropertyValue — HelpText, IsOffscreen,
   *  HasKeyboardFocus, ItemStatus, FrameworkId, … decoded from the VARIANT. Null if empty/unsupported. */
  getProperty(propertyId: number): VariantValue {
    return getPropertyValue(this.ptr, propertyId);
  }

  /** Toggle a checkbox via TogglePattern. Throws if unsupported. NOTE: on a classic Win32/HWND (MSAA-bridged) checkbox
   *  the OS routes TogglePattern.Toggle through focus, which ACTIVATES the control's window and STEALS FOREGROUND to its
   *  HWND (proven live on minimized charmap — findings/32). For a focus-clean toggle of an own-HWND "Button"-class
   *  checkbox post BM_CLICK instead (the MCP toggle tool does this automatically). */
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

  /** Add to the current selection via SelectionItemPattern (multi-select, keeps the others). Throws if unsupported. */
  addToSelection(): void {
    addToSelection(this.ptr);
  }

  /** Remove from the current selection via SelectionItemPattern (deselect). Throws if unsupported. */
  removeFromSelection(): void {
    removeFromSelection(this.ptr);
  }

  /** Whether selected (SelectionItemPattern); false if unsupported. */
  get isSelected(): boolean {
    return isSelected(this.ptr);
  }

  /** The selected items of this SelectionPattern container (list/grid/tree), as owned Elements. Empty if unsupported. */
  getSelection(): Element[] {
    return getSelectionPointers(this.ptr).map((pointer) => new Element(pointer));
  }

  /** Whether this SelectionPattern container allows multiple simultaneous selections. */
  get canSelectMultiple(): boolean {
    return canSelectMultiple(this.ptr);
  }

  /** Whether the element can be moved via TransformPattern (FlaUI's Transform.CanMove); false if unsupported. */
  get canMove(): boolean {
    return canMove(this.ptr);
  }

  /** Whether the element can be resized via TransformPattern (FlaUI's Transform.CanResize); false if unsupported. */
  get canResize(): boolean {
    return canResize(this.ptr);
  }

  /** Whether the element can be rotated via TransformPattern (FlaUI's Transform.CanRotate); false if unsupported. */
  get canRotate(): boolean {
    return canRotate(this.ptr);
  }

  /** Move the element to screen coords (x,y) via TransformPattern — cursor-free, reaches an HWND-less child (MDI / dockable
   *  / floating pane) that moveWindow (SetWindowPos) cannot target. Throws if unsupported (check .canMove). */
  move(x: number, y: number): void {
    move(this.ptr, x, y);
  }

  /** Resize the element to width×height via TransformPattern — cursor-free, reaches an HWND-less child. Throws if unsupported (check .canResize). */
  resize(width: number, height: number): void {
    resize(this.ptr, width, height);
  }

  /** Rotate the element by `degrees` via TransformPattern — cursor-free. Rare (most controls report CanRotate=false). Throws if unsupported. */
  rotate(degrees: number): void {
    rotate(this.ptr, degrees);
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

  // synthetic input fallbacks (SendInput) for controls without a usable pattern
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

  /** Click the element at its GetClickablePoint (bounding-rectangle center fallback). The no-InvokePattern fallback:
   *  posts a cursor-free WM_*BUTTON to the element's own window first (no focus-steal, works on a background window);
   *  only when that is impossible (no own HWND) AND the target is not already foreground does it raise the window and
   *  fall back to a real SetCursorPos + SendInput click. */
  click(): this {
    const hWnd = this.nativeWindowHandle;
    let point = this.clickablePoint;
    if (point === null) {
      const rect = this.boundingRectangle;
      point = { x: rect.x + Math.floor(rect.width / 2), y: rect.y + Math.floor(rect.height / 2) };
    }
    if (hWnd !== 0n && postClickToHwnd(hWnd, point.x, point.y)) return this; // cursor-free, no raise/flash
    if (hWnd !== 0n && User32.GetForegroundWindow() !== hWnd) User32.SetForegroundWindow(hWnd); // last resort: only when not already foreground
    clickAt(point.x, point.y);
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

  /** The web/editor-DOM roots of a Chromium/CEF/Electron window (browsers, VS Code, Discord, …): an Element
   *  attached to each `Chrome_RenderWidgetHostHWND` child, whose page content the top-level walk does not bridge.
   *  Empty for non-Chromium windows. The caller owns and should release the returned Elements. */
  webRoots(): Element[] {
    const roots: Element[] = [];
    for (const handle of renderWidgetHandles(this.hWnd)) {
      try {
        roots.push(fromHandle(handle));
      } catch {
        // a render widget can be transient (mid-navigation / just destroyed) — skip it
      }
    }
    return roots;
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
  // className without an exact title: FindWindowW(class, NULL) returns the first top-level match in Z-order, which for
  // the whole Chromium/Electron family (Chrome_WidgetWin_1) is an INVISIBLE helper window. Prefer a VISIBLE window of
  // that class; fall back to FindWindowW only when none is visible (a legitimately hidden target).
  if (className !== undefined && title === undefined) {
    const visible = listWindows({ includeUntitled: true }).find((window) => window.className === className);
    if (visible !== undefined) return visible.hWnd;
  }
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
