// Control-pattern actions. Each acquires the pattern via GetCurrentPattern (slot 16), invokes the
// method, and releases the pattern interface. State reads return the raw enum number; compare against
// the exported enums. Patterns the element does not support throw (actions) or return null/-1 (reads),
// pointing the caller at the SendInput fallbacks (.click()/.type()) where one exists.

import { FFIType, type Pointer } from 'bun:ffi';

import Oleaut32 from '@bun-win32/oleaut32';

import { comRelease, hresult, vcall } from './com';
import { PatternId, S_OK, SLOT } from './constants';
import { decodeBstr, getBstr, getDouble, getLong } from './reads';

export enum ToggleState {
  Off = 0,
  On = 1,
  Indeterminate = 2,
}

export enum ExpandCollapseState {
  Collapsed = 0,
  Expanded = 1,
  PartiallyExpanded = 2,
  LeafNode = 3,
}

export enum WindowVisualState {
  Normal = 0,
  Maximized = 1,
  Minimized = 2,
}

/** ScrollPattern.Scroll step per axis (UIA ScrollAmount). */
export enum ScrollAmount {
  LargeDecrement = 0,
  SmallDecrement = 1,
  NoAmount = 2,
  LargeIncrement = 3,
  SmallIncrement = 4,
}

/** SetScrollPercent sentinel: leave this axis unchanged (UIA_ScrollPatternNoScroll). */
export const NoScroll = -1;

/** A ScrollPattern container's scroll state. Percent/view-size are 0-100 (or -1 when the axis can't scroll). */
export interface ScrollInfo {
  horizontalPercent: number;
  verticalPercent: number;
  horizontalViewSize: number;
  verticalViewSize: number;
  horizontallyScrollable: boolean;
  verticallyScrollable: boolean;
}

/** Acquire a control pattern interface. Returns 0n when the element does not support it. */
function getPattern(ptr: bigint, patternId: number): bigint {
  const out = Buffer.alloc(8);
  if (vcall(ptr, SLOT.GetCurrentPattern, [FFIType.i32, FFIType.ptr], [patternId, out.ptr!]) !== S_OK) return 0n;
  return out.readBigUInt64LE(0);
}

function invokeNoArg(pattern: bigint, slot: number, label: string): void {
  const hr = vcall(pattern, slot, [], []);
  if (hr !== S_OK) throw new Error(`${label} failed: ${hresult(hr)}`);
}

/** Press the element via InvokePattern. */
export function invoke(ptr: bigint): void {
  const pattern = getPattern(ptr, PatternId.Invoke);
  if (pattern === 0n) throw new Error('element does not support InvokePattern — use .click() for the coordinate fallback');
  try {
    invokeNoArg(pattern, SLOT.Invoke, 'Invoke');
  } finally {
    comRelease(pattern);
  }
}

/** Set a ValuePattern control's value (e.g. a text box) in one call — no keystrokes, no VARIANT. */
export function setValue(ptr: bigint, text: string): void {
  const pattern = getPattern(ptr, PatternId.Value);
  if (pattern === 0n) throw new Error('element does not support ValuePattern — use .type() to send keystrokes');
  const bstr = Oleaut32.SysAllocString(Buffer.from(`${text}\0`, 'utf16le').ptr!);
  try {
    const hr = vcall(pattern, SLOT.SetValue, [FFIType.ptr], [bstr]);
    if (hr !== S_OK) throw new Error(`ValuePattern.SetValue failed: ${hresult(hr)}`);
  } finally {
    Oleaut32.SysFreeString(bstr);
    comRelease(pattern);
  }
}

/** Read a ValuePattern control's value, or '' if unsupported. */
export function getValue(ptr: bigint): string {
  const pattern = getPattern(ptr, PatternId.Value);
  if (pattern === 0n) return '';
  try {
    return getBstr(pattern, SLOT.get_CurrentValue);
  } finally {
    comRelease(pattern);
  }
}

/** Toggle a TogglePattern control (checkbox). */
export function toggle(ptr: bigint): void {
  const pattern = getPattern(ptr, PatternId.Toggle);
  if (pattern === 0n) throw new Error('element does not support TogglePattern');
  try {
    invokeNoArg(pattern, SLOT.Toggle, 'Toggle');
  } finally {
    comRelease(pattern);
  }
}

/** Read a TogglePattern's state (ToggleState), or -1 if unsupported. */
export function toggleState(ptr: bigint): number {
  const pattern = getPattern(ptr, PatternId.Toggle);
  if (pattern === 0n) return -1;
  try {
    return getLong(pattern, SLOT.get_CurrentToggleState);
  } finally {
    comRelease(pattern);
  }
}

/** Expand an ExpandCollapsePattern control (combo box, tree item). */
export function expand(ptr: bigint): void {
  const pattern = getPattern(ptr, PatternId.ExpandCollapse);
  if (pattern === 0n) throw new Error('element does not support ExpandCollapsePattern');
  try {
    invokeNoArg(pattern, SLOT.Expand, 'Expand');
  } finally {
    comRelease(pattern);
  }
}

/** Collapse an ExpandCollapsePattern control. */
export function collapse(ptr: bigint): void {
  const pattern = getPattern(ptr, PatternId.ExpandCollapse);
  if (pattern === 0n) throw new Error('element does not support ExpandCollapsePattern');
  try {
    invokeNoArg(pattern, SLOT.Collapse, 'Collapse');
  } finally {
    comRelease(pattern);
  }
}

/** Read an ExpandCollapsePattern's state (ExpandCollapseState), or -1 if unsupported. */
export function expandCollapseState(ptr: bigint): number {
  const pattern = getPattern(ptr, PatternId.ExpandCollapse);
  if (pattern === 0n) return -1;
  try {
    return getLong(pattern, SLOT.get_CurrentExpandCollapseState);
  } finally {
    comRelease(pattern);
  }
}

/** Invoke a control's DEFAULT ACTION via the LegacyIAccessible (MSAA) pattern — cursor-free, no focus, works
 *  on a background/locked window. The MSAA "accDoDefaultAction" (e.g. "Press" a button). A fallback activate for
 *  controls with no Invoke pattern; note some shell items (Explorer drives/folders) accept it as a silent no-op,
 *  so prefer Invoke there. Throws if the element has no LegacyIAccessible pattern. */
export function doDefaultAction(ptr: bigint): void {
  const pattern = getPattern(ptr, PatternId.LegacyIAccessible);
  if (pattern === 0n) throw new Error('element does not support LegacyIAccessiblePattern (no default action)');
  try {
    invokeNoArg(pattern, SLOT.DoDefaultAction, 'DoDefaultAction');
  } finally {
    comRelease(pattern);
  }
}

/** Select a SelectionItemPattern control (list item, radio button), replacing the selection. */
export function select(ptr: bigint): void {
  const pattern = getPattern(ptr, PatternId.SelectionItem);
  if (pattern === 0n) throw new Error('element does not support SelectionItemPattern');
  try {
    invokeNoArg(pattern, SLOT.Select, 'Select');
  } finally {
    comRelease(pattern);
  }
}

/** Whether a SelectionItemPattern control is selected (false if unsupported). */
export function isSelected(ptr: bigint): boolean {
  const pattern = getPattern(ptr, PatternId.SelectionItem);
  if (pattern === 0n) return false;
  try {
    return getLong(pattern, SLOT.get_CurrentIsSelected) !== 0;
  } finally {
    comRelease(pattern);
  }
}

/** Add a SelectionItemPattern control to the current selection (multi-select; keeps the others). Throws if unsupported. */
export function addToSelection(ptr: bigint): void {
  const pattern = getPattern(ptr, PatternId.SelectionItem);
  if (pattern === 0n) throw new Error('element does not support SelectionItemPattern');
  try {
    invokeNoArg(pattern, SLOT.AddToSelection, 'AddToSelection');
  } finally {
    comRelease(pattern);
  }
}

/** Remove a SelectionItemPattern control from the current selection (deselect). Throws if unsupported. */
export function removeFromSelection(ptr: bigint): void {
  const pattern = getPattern(ptr, PatternId.SelectionItem);
  if (pattern === 0n) throw new Error('element does not support SelectionItemPattern');
  try {
    invokeNoArg(pattern, SLOT.RemoveFromSelection, 'RemoveFromSelection');
  } finally {
    comRelease(pattern);
  }
}

/** The selected items of a SelectionPattern container, as element pointers (caller wraps + releases each). */
export function getSelectionPointers(ptr: bigint): bigint[] {
  const pattern = getPattern(ptr, PatternId.Selection);
  if (pattern === 0n) return [];
  try {
    const out = Buffer.alloc(8);
    if (vcall(pattern, SLOT.GetCurrentSelection, [FFIType.ptr], [out.ptr!]) !== S_OK) return [];
    const array = out.readBigUInt64LE(0);
    if (array === 0n) return [];
    try {
      return elementArrayPointers(array);
    } finally {
      comRelease(array);
    }
  } finally {
    comRelease(pattern);
  }
}

/** Whether a SelectionPattern container permits multiple simultaneous selections. */
export function canSelectMultiple(ptr: bigint): boolean {
  const pattern = getPattern(ptr, PatternId.Selection);
  if (pattern === 0n) return false;
  try {
    return getLong(pattern, SLOT.get_CurrentCanSelectMultiple) !== 0;
  } finally {
    comRelease(pattern);
  }
}

/** Scroll a ScrollItemPattern control into view within its scrollable container. */
export function scrollIntoView(ptr: bigint): void {
  const pattern = getPattern(ptr, PatternId.ScrollItem);
  if (pattern === 0n) throw new Error('element does not support ScrollItemPattern');
  try {
    invokeNoArg(pattern, SLOT.ScrollIntoView, 'ScrollIntoView');
  } finally {
    comRelease(pattern);
  }
}

/** Scroll a ScrollPattern container by ScrollAmount steps per axis (page/line, increment/decrement). Throws if unsupported. */
export function scroll(ptr: bigint, horizontalAmount: ScrollAmount, verticalAmount: ScrollAmount): void {
  const pattern = getPattern(ptr, PatternId.Scroll);
  if (pattern === 0n) throw new Error('element does not support ScrollPattern — try .scrollIntoView() on a child, or scrollWheel()');
  try {
    const hr = vcall(pattern, SLOT.Scroll, [FFIType.i32, FFIType.i32], [horizontalAmount, verticalAmount]);
    if (hr !== S_OK) throw new Error(`ScrollPattern.Scroll failed: ${hresult(hr)}`);
  } finally {
    comRelease(pattern);
  }
}

/** Set a ScrollPattern container's position by percent (0-100); pass NoScroll (-1) to leave an axis. Throws if unsupported. */
export function setScrollPercent(ptr: bigint, horizontalPercent: number, verticalPercent: number): void {
  const pattern = getPattern(ptr, PatternId.Scroll);
  if (pattern === 0n) throw new Error('element does not support ScrollPattern');
  try {
    const hr = vcall(pattern, SLOT.SetScrollPercent, [FFIType.f64, FFIType.f64], [horizontalPercent, verticalPercent]);
    if (hr !== S_OK) throw new Error(`ScrollPattern.SetScrollPercent failed: ${hresult(hr)}`);
  } finally {
    comRelease(pattern);
  }
}

/** Read a ScrollPattern container's scroll state (percent/view-size/scrollable per axis), or null if unsupported. */
export function scrollInfo(ptr: bigint): ScrollInfo | null {
  const pattern = getPattern(ptr, PatternId.Scroll);
  if (pattern === 0n) return null;
  try {
    return {
      horizontalPercent: getDouble(pattern, SLOT.get_CurrentHorizontalScrollPercent),
      verticalPercent: getDouble(pattern, SLOT.get_CurrentVerticalScrollPercent),
      horizontalViewSize: getDouble(pattern, SLOT.get_CurrentHorizontalViewSize),
      verticalViewSize: getDouble(pattern, SLOT.get_CurrentVerticalViewSize),
      horizontallyScrollable: getLong(pattern, SLOT.get_CurrentHorizontallyScrollable) !== 0,
      verticallyScrollable: getLong(pattern, SLOT.get_CurrentVerticallyScrollable) !== 0,
    };
  } finally {
    comRelease(pattern);
  }
}

/** Set a RangeValuePattern control's value (slider). Throws if unsupported. */
export function setRangeValue(ptr: bigint, value: number): void {
  const pattern = getPattern(ptr, PatternId.RangeValue);
  if (pattern === 0n) throw new Error('element does not support RangeValuePattern');
  try {
    const hr = vcall(pattern, SLOT.SetValue, [FFIType.f64], [value]);
    if (hr !== S_OK) throw new Error(`RangeValuePattern.SetValue failed: ${hresult(hr)}`);
  } finally {
    comRelease(pattern);
  }
}

/** Read a RangeValuePattern control's value (slider), or NaN if unsupported. */
export function rangeValue(ptr: bigint): number {
  const pattern = getPattern(ptr, PatternId.RangeValue);
  if (pattern === 0n) return Number.NaN;
  try {
    return getDouble(pattern, SLOT.get_CurrentValue);
  } finally {
    comRelease(pattern);
  }
}

/** Read the full text of a TextPattern document (the document range), or '' if unsupported. */
export function readText(ptr: bigint): string {
  const pattern = getPattern(ptr, PatternId.Text);
  if (pattern === 0n) return '';
  try {
    const rangeOut = Buffer.alloc(8);
    if (vcall(pattern, SLOT.get_DocumentRange, [FFIType.ptr], [rangeOut.ptr!]) !== S_OK) return '';
    const range = rangeOut.readBigUInt64LE(0);
    if (range === 0n) return '';
    try {
      const textOut = Buffer.alloc(8);
      if (vcall(range, SLOT.GetText, [FFIType.i32, FFIType.ptr], [-1, textOut.ptr!]) !== S_OK) return '';
      return decodeBstr(textOut.readBigUInt64LE(0));
    } finally {
      comRelease(range);
    }
  } finally {
    comRelease(pattern);
  }
}

/** A grid/table read as text: optional column headers, a 2D array of cell strings, and the full row count. */
export interface TableData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

/** Collect every element pointer in an IUIAutomationElementArray (caller owns + releases each). */
function elementArrayPointers(arrayPtr: bigint): bigint[] {
  const pointers: bigint[] = [];
  const lengthOut = Buffer.alloc(4);
  if (vcall(arrayPtr, SLOT.get_Length, [FFIType.ptr], [lengthOut.ptr!]) !== S_OK) return pointers;
  const length = lengthOut.readInt32LE(0);
  const elementOut = Buffer.alloc(8);
  for (let index = 0; index < length; index += 1) {
    if (vcall(arrayPtr, SLOT.GetElement, [FFIType.i32, FFIType.ptr], [index, elementOut.ptr!]) !== S_OK) continue;
    const element = elementOut.readBigUInt64LE(0);
    if (element !== 0n) pointers.push(element);
  }
  return pointers;
}

/** Read the names of every element in an IUIAutomationElementArray, releasing each. */
function elementArrayNames(arrayPtr: bigint): string[] {
  const names: string[] = [];
  const lengthOut = Buffer.alloc(4);
  if (vcall(arrayPtr, SLOT.get_Length, [FFIType.ptr], [lengthOut.ptr!]) !== S_OK) return names;
  const length = lengthOut.readInt32LE(0);
  const elementOut = Buffer.alloc(8);
  for (let index = 0; index < length; index += 1) {
    if (vcall(arrayPtr, SLOT.GetElement, [FFIType.i32, FFIType.ptr], [index, elementOut.ptr!]) !== S_OK) continue;
    const element = elementOut.readBigUInt64LE(0);
    if (element === 0n) continue;
    names.push(getBstr(element, SLOT.get_CurrentName));
    comRelease(element);
  }
  return names;
}

/** Column header labels via TablePattern (GetCurrentColumnHeaders), or [] when the grid is not a Table. */
function columnHeaders(ptr: bigint): string[] {
  const table = getPattern(ptr, PatternId.Table);
  if (table === 0n) return [];
  try {
    const out = Buffer.alloc(8);
    if (vcall(table, SLOT.GetCurrentColumnHeaders, [FFIType.ptr], [out.ptr!]) !== S_OK) return [];
    const array = out.readBigUInt64LE(0);
    if (array === 0n) return [];
    try {
      return elementArrayNames(array);
    } finally {
      comRelease(array);
    }
  } finally {
    comRelease(table);
  }
}

/**
 * Read a GridPattern container (data grid, details-view list, spreadsheet-like control) as text — one
 * GetItem(row,col) per cell, cell text from the cell's Name (ValuePattern value when Name is empty), plus
 * column headers when the element also supports TablePattern. Returns null when there is no GridPattern.
 * `maxRows` bounds a huge/virtualized grid; `totalRows` always reports the grid's full row count.
 */
export function readTable(ptr: bigint, maxRows = 100): TableData | null {
  const grid = getPattern(ptr, PatternId.Grid);
  if (grid === 0n) return null;
  try {
    const totalRows = getLong(grid, SLOT.get_CurrentRowCount);
    const columnCount = getLong(grid, SLOT.get_CurrentColumnCount);
    const limit = Math.min(Math.max(totalRows, 0), Math.max(maxRows, 0));
    const rows: string[][] = [];
    const cellOut = Buffer.alloc(8);
    for (let row = 0; row < limit; row += 1) {
      const cells: string[] = new Array(columnCount);
      for (let column = 0; column < columnCount; column += 1) {
        cells[column] = '';
        if (vcall(grid, SLOT.GetItem, [FFIType.i32, FFIType.i32, FFIType.ptr], [row, column, cellOut.ptr!]) !== S_OK) continue;
        const cell = cellOut.readBigUInt64LE(0);
        if (cell === 0n) continue;
        const name = getBstr(cell, SLOT.get_CurrentName);
        cells[column] = name.length > 0 ? name : getValue(cell);
        comRelease(cell);
      }
      rows.push(cells);
    }
    return { headers: columnHeaders(ptr), rows, totalRows };
  } finally {
    comRelease(grid);
  }
}

// IUIAutomationTextRange::Select — slot 16. Kept local (not in SLOT) because the name collides with
// IUIAutomationSelectionItemPattern::Select=3; verified against the header by slot-gate's scoped block.
const TEXTRANGE_SELECT = 16;

/**
 * Find `text` in the element's TextPattern document, SELECT it (cursor-free), and return the matched text —
 * the desktop analog of Playwright's getByText. Returns null if the element has no TextPattern or the text
 * is not found. The selection can then be copied (Ctrl+C), replaced (setValue/type), or read.
 */
export function selectText(ptr: bigint, text: string, options: { backward?: boolean; ignoreCase?: boolean } = {}): string | null {
  const pattern = getPattern(ptr, PatternId.Text);
  if (pattern === 0n) return null;
  try {
    const rangeOut = Buffer.alloc(8);
    if (vcall(pattern, SLOT.get_DocumentRange, [FFIType.ptr], [rangeOut.ptr!]) !== S_OK) return null;
    const docRange = rangeOut.readBigUInt64LE(0);
    if (docRange === 0n) return null;
    const bstr = Oleaut32.SysAllocString(Buffer.from(`${text}\0`, 'utf16le').ptr!);
    try {
      const foundOut = Buffer.alloc(8);
      if (vcall(docRange, SLOT.FindText, [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], [bstr, options.backward ? 1 : 0, options.ignoreCase ? 1 : 0, foundOut.ptr!]) !== S_OK) return null;
      const found = foundOut.readBigUInt64LE(0);
      if (found === 0n) return null;
      try {
        vcall(found, TEXTRANGE_SELECT, [], []); // select the found range — cursor-free, no keyboard/mouse
        const textOut = Buffer.alloc(8);
        if (vcall(found, SLOT.GetText, [FFIType.i32, FFIType.ptr], [-1, textOut.ptr!]) !== S_OK) return text;
        return decodeBstr(textOut.readBigUInt64LE(0));
      } finally {
        comRelease(found);
      }
    } finally {
      Oleaut32.SysFreeString(bstr);
      comRelease(docRange);
    }
  } finally {
    comRelease(pattern);
  }
}

/** Read the element's current text selection via TextPattern (selected ranges concatenated), or '' if none/unsupported. */
export function getSelectedText(ptr: bigint): string {
  const pattern = getPattern(ptr, PatternId.Text);
  if (pattern === 0n) return '';
  try {
    const arrayOut = Buffer.alloc(8);
    if (vcall(pattern, SLOT.GetSelection, [FFIType.ptr], [arrayOut.ptr!]) !== S_OK) return '';
    const array = arrayOut.readBigUInt64LE(0);
    if (array === 0n) return '';
    try {
      const lengthOut = Buffer.alloc(4);
      if (vcall(array, SLOT.get_Length, [FFIType.ptr], [lengthOut.ptr!]) !== S_OK) return '';
      const length = lengthOut.readInt32LE(0);
      const parts: string[] = [];
      const rangeOut = Buffer.alloc(8);
      const textOut = Buffer.alloc(8);
      for (let index = 0; index < length; index += 1) {
        if (vcall(array, SLOT.GetElement, [FFIType.i32, FFIType.ptr], [index, rangeOut.ptr!]) !== S_OK) continue;
        const range = rangeOut.readBigUInt64LE(0);
        if (range === 0n) continue;
        if (vcall(range, SLOT.GetText, [FFIType.i32, FFIType.ptr], [-1, textOut.ptr!]) === S_OK) parts.push(decodeBstr(textOut.readBigUInt64LE(0)));
        comRelease(range);
      }
      return parts.join('');
    } finally {
      comRelease(array);
    }
  } finally {
    comRelease(pattern);
  }
}

/** Close a window via WindowPattern. */
export function windowClose(ptr: bigint): void {
  const pattern = getPattern(ptr, PatternId.Window);
  if (pattern === 0n) throw new Error('element does not support WindowPattern');
  try {
    invokeNoArg(pattern, SLOT.Close, 'Close');
  } finally {
    comRelease(pattern);
  }
}

/** Set a window's visual state (normal/maximized/minimized) via WindowPattern. */
export function setWindowVisualState(ptr: bigint, state: WindowVisualState): void {
  const pattern = getPattern(ptr, PatternId.Window);
  if (pattern === 0n) throw new Error('element does not support WindowPattern');
  try {
    const hr = vcall(pattern, SLOT.SetWindowVisualState, [FFIType.i32], [state]);
    if (hr !== S_OK) throw new Error(`SetWindowVisualState failed: ${hresult(hr)}`);
  } finally {
    comRelease(pattern);
  }
}
