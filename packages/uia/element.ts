// Element: a live IUIAutomationElement pointer with typed property reads, tree search, and the
// proven control-pattern actions. Property readers live in reads.ts; pattern actions in patterns.ts.

import { FFIType } from 'bun:ffi';

import { automation } from './automation';
import { comRelease, hresult, vcall } from './com';
import { compileCondition, type ElementProperties, matches, type Selector } from './condition';
import { ControlType, S_OK, SLOT, TreeScope } from './constants';
import {
  collapse,
  expand,
  expandCollapseState,
  getValue,
  invoke,
  isSelected,
  rangeValue,
  readText,
  scrollIntoView,
  select,
  setRangeValue,
  setValue,
  setWindowVisualState,
  toggle,
  toggleState,
  windowClose,
  type WindowVisualState,
} from './patterns';
import { getBstr, getHandle, getLong, getRect, type Rect } from './reads';

// Reused scratch for out-parameters in the tree-search path. Each value is read out immediately.
const scratch8 = Buffer.alloc(8);
const scratch4 = Buffer.alloc(4);

/** Read the four properties the client-side matcher needs, in one pass. */
function readProperties(ptr: bigint): ElementProperties {
  return {
    automationId: getBstr(ptr, SLOT.get_CurrentAutomationId),
    className: getBstr(ptr, SLOT.get_CurrentClassName),
    controlType: getLong(ptr, SLOT.get_CurrentControlType),
    name: getBstr(ptr, SLOT.get_CurrentName),
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

  /** Immediate children (control view) as Elements. The caller owns and should release them. */
  get children(): Element[] {
    return this.findAll({}, TreeScope.TreeScope_Children);
  }

  /** The control-view parent, or null at a root. The caller owns the returned Element. */
  get parent(): Element | null {
    if (vcall(automation(), SLOT.get_ControlViewWalker, [FFIType.ptr], [scratch8.ptr!]) !== S_OK) return null;
    const walker = scratch8.readBigUInt64LE(0);
    if (walker === 0n) return null;
    try {
      if (vcall(walker, SLOT.GetParentElement, [FFIType.u64, FFIType.ptr], [this.ptr, scratch8.ptr!]) !== S_OK) return null;
      const pointer = scratch8.readBigUInt64LE(0);
      return pointer === 0n ? null : new Element(pointer);
    } finally {
      comRelease(walker);
    }
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
