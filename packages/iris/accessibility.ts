// Reading the interface instead of the pixels: UI Automation. A minimized window has no composed surface to OCR, but a
// classic Win32 app keeps its accessibility tree alive, so Iris can still read its documents, lists, and labels. The
// walk uses the control-view walker's *BuildCache navigation (one cross-process round trip per node, with Name,
// ControlType, BoundingRectangle and Value prefetched) under a node and time budget, so a giant Chromium tree can
// never stall the indexer. Runs in the indexer worker (COM multithreaded apartment).

import { FFIType } from 'bun:ffi';

import Combase from '@bun-win32/combase';
import Oleaut32 from '@bun-win32/oleaut32';

import { readMemory, Strings } from './native';
import type { IndexedText } from './search';
import { comRelease, getInterface, guidBytes, hex, vcall } from './winrt';

const CLSID_CUIAutomation = 'ff48dba4-60ef-4201-aa87-54103eef594e';
const IID_IUIAutomation = '30cbe57d-d9d0-452a-ab13-7ac5ac4825ee';
const CLSCTX_INPROC_SERVER = 1;

const AUTOMATION_CREATE_CACHE_REQUEST = 20;
const AUTOMATION_ELEMENT_FROM_HANDLE = 6;
const AUTOMATION_GET_CONTROL_VIEW_WALKER = 14;
const CACHE_ADD_PROPERTY = 3;
const ELEMENT_GET_CACHED_BOUNDING_RECTANGLE = 75;
const ELEMENT_GET_CACHED_CONTROL_TYPE = 53;
const ELEMENT_GET_CACHED_NAME = 55;
const ELEMENT_GET_CACHED_PROPERTY_VALUE = 12;
const WALKER_GET_FIRST_CHILD_BUILD_CACHE = 10;
const WALKER_GET_NEXT_SIBLING_BUILD_CACHE = 12;

const PROPERTY_BOUNDING_RECTANGLE = 30_001;
const PROPERTY_CONTROL_TYPE = 30_003;
const PROPERTY_NAME = 30_005;
const PROPERTY_VALUE = 30_045;
const VT_BSTR = 8;

const CONTROL_DOCUMENT = 50_030;
const CONTROL_EDIT = 50_004;
const SKIPPED_CONTROLS = new Set([50_014 /* ScrollBar */, 50_027 /* Thumb */, 50_037 /* TitleBar */, 50_022 /* Separator */]);
const NOISE = new Set(['minimize', 'maximize', 'restore', 'close', 'system', 'application', 'vertical', 'horizontal', 'line up', 'line down', 'page up', 'page down', 'position']);

export interface WindowFrame {
  height: number;
  width: number;
  x: number;
  y: number;
}

export class AccessibilityReader {
  #automation: bigint;
  #cache: bigint;
  #walker: bigint;

  constructor() {
    const out = Buffer.alloc(8);
    const created = Combase.CoCreateInstance(guidBytes(CLSID_CUIAutomation).ptr, 0n, CLSCTX_INPROC_SERVER, guidBytes(IID_IUIAutomation).ptr, out.ptr);
    if (created !== 0) throw new Error(`CoCreateInstance(CUIAutomation) failed: ${hex(created)}`);
    this.#automation = out.readBigUInt64LE(0);
    this.#walker = getInterface(this.#automation, AUTOMATION_GET_CONTROL_VIEW_WALKER);
    this.#cache = getInterface(this.#automation, AUTOMATION_CREATE_CACHE_REQUEST);
    for (const property of [PROPERTY_NAME, PROPERTY_CONTROL_TYPE, PROPERTY_BOUNDING_RECTANGLE, PROPERTY_VALUE]) vcall(this.#cache, CACHE_ADD_PROPERTY, [FFIType.i32], [property]);
  }

  #string(element: bigint): string {
    const out = Buffer.alloc(8);
    if (vcall(element, ELEMENT_GET_CACHED_NAME, [FFIType.ptr], [out.ptr]) !== 0) return '';
    return takeBstr(out.readBigUInt64LE(0));
  }

  #value(element: bigint): string {
    const variant = Buffer.alloc(24);
    if (vcall(element, ELEMENT_GET_CACHED_PROPERTY_VALUE, [FFIType.i32, FFIType.ptr], [PROPERTY_VALUE, variant.ptr]) !== 0) return '';
    let text = '';
    if (variant.readUInt16LE(0) === VT_BSTR) {
      const bstr = variant.readBigUInt64LE(8);
      if (bstr !== 0n) {
        const length = Strings.SysStringLen(bstr);
        text = length === 0 ? '' : readMemory(bstr, length * 2).toString('utf16le');
      }
    }
    Oleaut32.VariantClear(variant.ptr);
    return text;
  }

  /** Harvest readable text from `hwnd`. Rects are unit-space against `frame` when the window is on screen. */
  read(hwnd: bigint, frame: WindowFrame | null, nodeBudget = 700, millisecondBudget = 2500): IndexedText[] {
    const out = Buffer.alloc(8);
    if (vcall(this.#automation, AUTOMATION_ELEMENT_FROM_HANDLE, [FFIType.u64, FFIType.ptr], [hwnd, out.ptr]) !== 0) return [];
    const root = out.readBigUInt64LE(0);
    if (root === 0n) return [];
    const entries: IndexedText[] = [];
    const deadline = performance.now() + millisecondBudget;
    let remaining = nodeBudget;
    const rect = new Int32Array(4);
    const seen = new Set<string>();
    const visit = (element: bigint, depth: number): void => {
      if (remaining <= 0 || performance.now() > deadline || depth > 40) return;
      remaining -= 1;
      const typeOut = new Int32Array(1);
      vcall(element, ELEMENT_GET_CACHED_CONTROL_TYPE, [FFIType.ptr], [typeOut.ptr]);
      const controlType = typeOut[0]!;
      if (SKIPPED_CONTROLS.has(controlType)) return;
      const name = this.#string(element).replace(/\s+/g, ' ').trim();
      const value = controlType === CONTROL_EDIT || controlType === CONTROL_DOCUMENT ? this.#value(element) : '';
      let unit: [number, number, number, number] | null = null;
      if (frame !== null && vcall(element, ELEMENT_GET_CACHED_BOUNDING_RECTANGLE, [FFIType.ptr], [rect.ptr]) === 0 && rect[2]! > rect[0]! && rect[3]! > rect[1]!) {
        unit = [(rect[0]! - frame.x) / frame.width, (rect[1]! - frame.y) / frame.height, (rect[2]! - frame.x) / frame.width, (rect[3]! - frame.y) / frame.height];
        if (unit[2] < 0 || unit[3] < 0 || unit[0] > 1 || unit[1] > 1) unit = null;
      }
      if (name.length > 1 && !NOISE.has(name.toLowerCase()) && !seen.has(name)) {
        seen.add(name);
        entries.push({ line: name, lower: name.toLowerCase(), rect: unit, source: 'accessibility', text: name });
      }
      if (value.length > 0) {
        for (const line of value.split(/\r?\n/).slice(0, 200)) {
          const trimmed = line.trim();
          if (trimmed.length < 2 || seen.has(trimmed)) continue;
          seen.add(trimmed);
          entries.push({ line: trimmed, lower: trimmed.toLowerCase(), rect: null, source: 'accessibility', text: trimmed });
        }
      }
      const childOut = Buffer.alloc(8);
      if (vcall(this.#walker, WALKER_GET_FIRST_CHILD_BUILD_CACHE, [FFIType.u64, FFIType.u64, FFIType.ptr], [element, this.#cache, childOut.ptr]) !== 0) return;
      let child = childOut.readBigUInt64LE(0);
      while (child !== 0n) {
        visit(child, depth + 1);
        const nextOut = Buffer.alloc(8);
        const next =
          remaining > 0 && performance.now() <= deadline && vcall(this.#walker, WALKER_GET_NEXT_SIBLING_BUILD_CACHE, [FFIType.u64, FFIType.u64, FFIType.ptr], [child, this.#cache, nextOut.ptr]) === 0 ? nextOut.readBigUInt64LE(0) : 0n;
        comRelease(child);
        child = next;
      }
    };
    try {
      visit(root, 0);
    } finally {
      comRelease(root);
    }
    return entries;
  }
}

function takeBstr(bstr: bigint): string {
  if (bstr === 0n) return '';
  const length = Strings.SysStringLen(bstr);
  const text = length === 0 ? '' : readMemory(bstr, length * 2).toString('utf16le');
  Strings.SysFreeString(bstr);
  return text;
}
