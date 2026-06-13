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
