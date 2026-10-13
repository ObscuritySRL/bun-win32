/**
 * Palace of Intent
 *
 * Description: Translates the foreground application's privacy-safe accessibility geometry into a cinematic brutalist palace. It requests structure, roles, bounds, visibility, and focus—never pixels, names, values, labels, text, or automation identifiers.
 *
 * APIs demonstrated:
 * - @bun-win32/combase
 *   - CoInitializeEx / CoUninitialize (UI Automation apartment lifetime)
 * - @bun-win32/oleaut32
 *   - SAFEARRAY and BSTR APIs (batched accessibility result decoding and cleanup)
 * - @bun-win32/uiautomationcore
 *   - UiaNodeFromHandle / UiaFind / UiaNodeFromFocus (content-blind semantic snapshot)
 * - @bun-win32/user32
 *   - GetForegroundWindow (target selection before the showcase takes focus)
 * - @bun-win32/gpu
 *   - D3D11 structured buffers, procedural geometry, depth, HDR rendering, bloom, and back-buffer capture
 *
 * Run: bun run example/palace-of-intent.ts
 */

import { ptr, read, toArrayBuffer, type Pointer } from 'bun:ffi';

import Combase, { COINIT } from '@bun-win32/combase';
import {
  DXGI_FORMAT_R16G16B16A16_FLOAT,
  type DepthBuffer,
  type Gpu,
  type StructuredBuffer,
  type TextureResult,
  blobRelease,
  captureBackBuffer,
  clear,
  clearDepth,
  comRelease,
  compile,
  createDevice,
  createWindow,
  destroyDevice,
  drawFullscreenTriangle,
  drawTriangles,
  formatGrid,
  makeConstantBuffer,
  makeDepthBuffer,
  makePixelShader,
  makeSampler,
  makeStructuredBuffer,
  makeTexture,
  makeVertexShader,
  psSet,
  releaseDepth,
  setBlendState,
  setCull,
  setDepthState,
  setRenderTargets,
  setRenderTargetsWithDepth,
  setViewport,
  updateConstantBuffer,
  vsSet,
  vsSetShaderResources,
} from '@bun-win32/gpu';
import Oleaut32 from '@bun-win32/oleaut32';
import UIAutomationCore, { TreeScope } from '@bun-win32/uiautomationcore';
import User32 from '@bun-win32/user32';

Combase.Preload(['CoInitializeEx', 'CoUninitialize']);
Oleaut32.Preload([
  'SafeArrayAccessData',
  'SafeArrayDestroy',
  'SafeArrayGetDim',
  'SafeArrayGetElement',
  'SafeArrayGetElemsize',
  'SafeArrayGetLBound',
  'SafeArrayGetUBound',
  'SafeArrayGetVartype',
  'SafeArrayUnaccessData',
  'SysFreeString',
  'SysStringLen',
]);
UIAutomationCore.Preload(['UiaFind', 'UiaNodeFromFocus', 'UiaNodeFromHandle', 'UiaNodeRelease']);
User32.Preload(['GetForegroundWindow']);

const ARCHITECTURE_STRIDE = 48;
const AUTOMATION_ELEMENT_MODE_NONE = 0;
const CONDITION_TYPE_TRUE = 0;
const CONTROL_TYPE_APP_BAR = 50_040;
const CONTROL_TYPE_BUTTON = 50_000;
const CONTROL_TYPE_CALENDAR = 50_001;
const CONTROL_TYPE_CHECK_BOX = 50_002;
const CONTROL_TYPE_COMBO_BOX = 50_003;
const CONTROL_TYPE_CUSTOM = 50_025;
const CONTROL_TYPE_DATA_GRID = 50_028;
const CONTROL_TYPE_DATA_ITEM = 50_029;
const CONTROL_TYPE_DOCUMENT = 50_030;
const CONTROL_TYPE_EDIT = 50_004;
const CONTROL_TYPE_GROUP = 50_026;
const CONTROL_TYPE_HEADER = 50_034;
const CONTROL_TYPE_HEADER_ITEM = 50_035;
const CONTROL_TYPE_HYPERLINK = 50_005;
const CONTROL_TYPE_IMAGE = 50_006;
const CONTROL_TYPE_LIST = 50_008;
const CONTROL_TYPE_LIST_ITEM = 50_007;
const CONTROL_TYPE_MENU = 50_009;
const CONTROL_TYPE_MENU_BAR = 50_010;
const CONTROL_TYPE_MENU_ITEM = 50_011;
const CONTROL_TYPE_PANE = 50_033;
const CONTROL_TYPE_PROGRESS_BAR = 50_012;
const CONTROL_TYPE_RADIO_BUTTON = 50_013;
const CONTROL_TYPE_SCROLL_BAR = 50_014;
const CONTROL_TYPE_SEMANTIC_ZOOM = 50_039;
const CONTROL_TYPE_SEPARATOR = 50_038;
const CONTROL_TYPE_SLIDER = 50_015;
const CONTROL_TYPE_SPINNER = 50_016;
const CONTROL_TYPE_SPLIT_BUTTON = 50_031;
const CONTROL_TYPE_STATUS_BAR = 50_017;
const CONTROL_TYPE_TAB = 50_018;
const CONTROL_TYPE_TAB_ITEM = 50_019;
const CONTROL_TYPE_TABLE = 50_036;
const CONTROL_TYPE_TEXT = 50_020;
const CONTROL_TYPE_THUMB = 50_027;
const CONTROL_TYPE_TITLE_BAR = 50_037;
const CONTROL_TYPE_TOOL_BAR = 50_021;
const CONTROL_TYPE_TOOL_TIP = 50_022;
const CONTROL_TYPE_TREE = 50_023;
const CONTROL_TYPE_TREE_ITEM = 50_024;
const CONTROL_TYPE_WINDOW = 50_032;
const MATERIAL_BASALT = 1;
const MATERIAL_CONCRETE = 0;
const MATERIAL_GOLD = 4;
const MATERIAL_LIMESTONE = 2;
const MATERIAL_PORTAL = 5;
const MATERIAL_STEEL = 3;
const MAX_ARCHITECTURE_MASSES = 920;
const MAX_SEMANTIC_ELEMENTS = 140;
const PROPERTY_COLUMNS = 5;
const PROPERTY_COUNT = 4;
const RPC_E_CHANGED_MODE = 0x8001_0106 | 0;
const S_FALSE = 1;
const S_OK = 0;
const UIA_BOUNDING_RECTANGLE_PROPERTY_ID = 30_001;
const UIA_CONTROL_TYPE_PROPERTY_ID = 30_003;
const UIA_HAS_KEYBOARD_FOCUS_PROPERTY_ID = 30_008;
const UIA_IS_OFFSCREEN_PROPERTY_ID = 30_022;
const VARIANT_SIZE = 24;
const VT_ARRAY_R8 = 0x2005;
const VT_BOOL = 11;
const VT_I4 = 3;
const VT_VARIANT = 12;
const WINDOW_HEIGHT = 900;
const WINDOW_WIDTH = 1_440;
const WORLD_DEPTH = 11.5;
const WORLD_WIDTH = 18;

type Bounds = readonly [left: number, top: number, width: number, height: number];

interface ArchitecturalMass {
  ancestry: number;
  baseY: number;
  centerX: number;
  centerZ: number;
  depth: number;
  focus: number;
  halfX: number;
  halfZ: number;
  height: number;
  material: number;
  reveal: number;
  seed: number;
}

interface SafeArrayShape {
  columns: number;
  rows: number;
}

interface SemanticElement {
  bounds: Bounds | null;
  controlType: number | null;
  depth: number;
  focused: boolean | null;
  index: number;
  offscreen: boolean | null;
  parentIndex: number;
}

interface SemanticSnapshot {
  elements: SemanticElement[];
  focusElement: SemanticElement | null;
  snapshotMilliseconds: number;
}

interface WorldRectangle {
  centerX: number;
  centerZ: number;
  halfX: number;
  halfZ: number;
}

function checked(status: number, operation: string): void {
  if (status < 0) throw new Error(operation + ' failed: HRESULT 0x' + (status >>> 0).toString(16).padStart(8, '0'));
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function environmentNumber(name: string, fallback: number, minimum: number): number {
  const value = Number(Bun.env[name]);
  return Number.isFinite(value) ? Math.max(minimum, value) : fallback;
}

function isPointerAddress(address: number): address is Pointer {
  return Number.isSafeInteger(address) && address > 0;
}

function pointerFromAddress(address: bigint): Pointer {
  const pointerAddress = Number(address);
  if (!isPointerAddress(pointerAddress)) throw new Error('A native out-cell returned an invalid pointer address');
  return pointerAddress;
}

function readNativePointer(buffer: Buffer, offset = 0): Pointer | null {
  const address = buffer.readBigUInt64LE(offset);
  return address === 0n ? null : pointerFromAddress(address);
}

function readNativePointerAt(pointer: Pointer, offset = 0): Pointer | null {
  const address = read.u64(pointer, offset);
  return address === 0n ? null : pointerFromAddress(address);
}

function safeArrayShape(safeArray: Pointer): SafeArrayShape {
  const dimensions = Oleaut32.SafeArrayGetDim(safeArray);
  if (dimensions !== 2) throw new Error('UI Automation returned a ' + dimensions + 'D property matrix; expected 2D');

  const bound = Buffer.alloc(4);
  checked(Oleaut32.SafeArrayGetLBound(safeArray, 1, ptr(bound)), 'SafeArrayGetLBound(rows)');
  const rowLowerBound = bound.readInt32LE(0);
  checked(Oleaut32.SafeArrayGetUBound(safeArray, 1, ptr(bound)), 'SafeArrayGetUBound(rows)');
  const rows = bound.readInt32LE(0) - rowLowerBound + 1;

  checked(Oleaut32.SafeArrayGetLBound(safeArray, 2, ptr(bound)), 'SafeArrayGetLBound(columns)');
  const columnLowerBound = bound.readInt32LE(0);
  checked(Oleaut32.SafeArrayGetUBound(safeArray, 2, ptr(bound)), 'SafeArrayGetUBound(columns)');
  const columns = bound.readInt32LE(0) - columnLowerBound + 1;
  return { columns, rows };
}

function readBoolean(data: Buffer, offset: number): boolean | null {
  if (data.readUInt16LE(offset) !== VT_BOOL) return null;
  return data.readInt16LE(offset + 8) !== 0;
}

function readBoundingRectangle(dataPointer: Pointer, offset: number): Bounds | null {
  if (read.u16(dataPointer, offset) !== VT_ARRAY_R8) return null;
  const rectangleArray = readNativePointerAt(dataPointer, offset + 8);
  if (rectangleArray === null || Oleaut32.SafeArrayGetDim(rectangleArray) !== 1 || Oleaut32.SafeArrayGetElemsize(rectangleArray) !== 8) return null;

  const bound = Buffer.alloc(4);
  checked(Oleaut32.SafeArrayGetLBound(rectangleArray, 1, ptr(bound)), 'SafeArrayGetLBound(rectangle)');
  const lowerBound = bound.readInt32LE(0);
  checked(Oleaut32.SafeArrayGetUBound(rectangleArray, 1, ptr(bound)), 'SafeArrayGetUBound(rectangle)');
  if (bound.readInt32LE(0) - lowerBound + 1 !== 4) return null;

  const dataOut = Buffer.alloc(8);
  checked(Oleaut32.SafeArrayAccessData(rectangleArray, ptr(dataOut)), 'SafeArrayAccessData(rectangle)');
  try {
    const rectanglePointer = readNativePointer(dataOut);
    if (rectanglePointer === null) return null;
    const rectangle = new Float64Array(toArrayBuffer(rectanglePointer, 0, 32));
    const left = rectangle[0]!;
    const top = rectangle[1]!;
    const width = rectangle[2]!;
    const height = rectangle[3]!;
    return Number.isFinite(left) && Number.isFinite(top) && Number.isFinite(width) && Number.isFinite(height) ? [left, top, width, height] : null;
  } finally {
    checked(Oleaut32.SafeArrayUnaccessData(rectangleArray), 'SafeArrayUnaccessData(rectangle)');
  }
}

function readInteger(data: Buffer, offset: number): number | null {
  return data.readUInt16LE(offset) === VT_I4 ? data.readInt32LE(offset + 8) : null;
}

function readTreeStructure(treeStructures: Pointer): string {
  if (Oleaut32.SafeArrayGetDim(treeStructures) !== 1 || Oleaut32.SafeArrayGetElemsize(treeStructures) !== 8) throw new Error('UI Automation returned an unexpected topology array');
  const index = Buffer.alloc(4);
  const stringOut = Buffer.alloc(8);
  checked(Oleaut32.SafeArrayGetElement(treeStructures, ptr(index), ptr(stringOut)), 'SafeArrayGetElement(topology)');
  const stringPointer = readNativePointer(stringOut);
  if (stringPointer === null) return '';
  try {
    const length = Oleaut32.SysStringLen(stringPointer);
    return length === 0 ? '' : Buffer.from(toArrayBuffer(stringPointer, 0, length * 2)).toString('utf16le');
  } finally {
    Oleaut32.SysFreeString(stringPointer);
  }
}

function parseTopology(treeStructure: string): { depths: number[]; parents: number[] } {
  const depths: number[] = [];
  const parents: number[] = [];
  const stack: number[] = [];
  for (const token of treeStructure) {
    if (token === 'P' || token === 'p') {
      parents.push(stack.length === 0 ? -1 : stack[stack.length - 1]!);
      depths.push(stack.length);
      stack.push(parents.length - 1);
    } else if (token === ')') {
      if (stack.length === 0) throw new Error('UI Automation topology closed a node that was never opened');
      stack.pop();
    } else {
      throw new Error('UI Automation topology contained an unknown token');
    }
  }
  return { depths, parents };
}

function parseRequestedData(requestedData: Pointer, treeStructure: string): SemanticElement[] {
  const vartype = Buffer.alloc(2);
  checked(Oleaut32.SafeArrayGetVartype(requestedData, ptr(vartype)), 'SafeArrayGetVartype(requested data)');
  if (vartype.readUInt16LE(0) !== VT_VARIANT || Oleaut32.SafeArrayGetElemsize(requestedData) !== VARIANT_SIZE) throw new Error('UI Automation property matrix is not a 24-byte VARIANT matrix');

  const { columns, rows } = safeArrayShape(requestedData);
  if (columns !== PROPERTY_COLUMNS) throw new Error('UI Automation returned ' + columns + ' property columns; expected ' + PROPERTY_COLUMNS);
  const topology = parseTopology(treeStructure);
  if (topology.parents.length !== rows) throw new Error('UI Automation topology and property matrix disagree');

  const dataOut = Buffer.alloc(8);
  checked(Oleaut32.SafeArrayAccessData(requestedData, ptr(dataOut)), 'SafeArrayAccessData(requested data)');
  try {
    const dataPointer = readNativePointer(dataOut);
    if (dataPointer === null) return [];
    const data = Buffer.from(toArrayBuffer(dataPointer, 0, rows * columns * VARIANT_SIZE));
    const elements: SemanticElement[] = new Array(rows);
    for (let row = 0; row < rows; row += 1) {
      const columnOffset = (column: number): number => (column * rows + row) * VARIANT_SIZE;
      elements[row] = {
        bounds: readBoundingRectangle(dataPointer, columnOffset(2)),
        controlType: readInteger(data, columnOffset(1)),
        depth: topology.depths[row]!,
        focused: readBoolean(data, columnOffset(4)),
        index: row,
        offscreen: readBoolean(data, columnOffset(3)),
        parentIndex: topology.parents[row]!,
      };
    }
    return elements;
  } finally {
    checked(Oleaut32.SafeArrayUnaccessData(requestedData), 'SafeArrayUnaccessData(requested data)');
  }
}

function writeCacheRequest(scope: TreeScope, trueCondition: Buffer, properties: Buffer): Buffer {
  const cacheRequest = Buffer.alloc(48);
  cacheRequest.writeBigUInt64LE(BigInt(ptr(trueCondition)), 0);
  cacheRequest.writeInt32LE(scope, 8);
  cacheRequest.writeBigUInt64LE(BigInt(ptr(properties)), 16);
  cacheRequest.writeInt32LE(PROPERTY_COUNT, 24);
  cacheRequest.writeInt32LE(AUTOMATION_ELEMENT_MODE_NONE, 44);
  return cacheRequest;
}

function snapshotForegroundSemantics(): SemanticSnapshot {
  const startedAt = performance.now();
  const initializeResult = Combase.CoInitializeEx(null, COINIT.COINIT_MULTITHREADED);
  if (initializeResult < 0 && initializeResult !== RPC_E_CHANGED_MODE) checked(initializeResult, 'CoInitializeEx');
  const ownsComInitialization = initializeResult === S_OK || initializeResult === S_FALSE;

  const rootOut = Buffer.alloc(8);
  const requestedDataOut = Buffer.alloc(8);
  const offsetsOut = Buffer.alloc(8);
  const treeStructuresOut = Buffer.alloc(8);
  const focusDataOut = Buffer.alloc(8);
  const focusTreeOut = Buffer.alloc(8);
  let rootNode = 0n;
  try {
    const foregroundWindow = User32.GetForegroundWindow();
    if (foregroundWindow === 0n) throw new Error('GetForegroundWindow returned NULL');
    checked(UIAutomationCore.UiaNodeFromHandle(foregroundWindow, ptr(rootOut)), 'UiaNodeFromHandle');
    rootNode = rootOut.readBigUInt64LE(0);
    if (rootNode === 0n) throw new Error('UiaNodeFromHandle returned a null node');

    const trueCondition = Buffer.alloc(4);
    trueCondition.writeInt32LE(CONDITION_TYPE_TRUE, 0);

    const properties = Buffer.alloc(PROPERTY_COUNT * 4);
    properties.writeInt32LE(UIA_CONTROL_TYPE_PROPERTY_ID, 0);
    properties.writeInt32LE(UIA_BOUNDING_RECTANGLE_PROPERTY_ID, 4);
    properties.writeInt32LE(UIA_IS_OFFSCREEN_PROPERTY_ID, 8);
    properties.writeInt32LE(UIA_HAS_KEYBOARD_FOCUS_PROPERTY_ID, 12);

    const subtreeRequest = writeCacheRequest(TreeScope.TreeScope_Subtree, trueCondition, properties);
    const elementRequest = writeCacheRequest(TreeScope.TreeScope_Element, trueCondition, properties);
    const findParameters = Buffer.alloc(24);
    findParameters.writeInt32LE(8, 0);
    findParameters.writeInt32LE(1, 4);
    findParameters.writeInt32LE(0, 8);
    findParameters.writeBigUInt64LE(BigInt(ptr(trueCondition)), 16);

    checked(UIAutomationCore.UiaFind(rootNode, ptr(findParameters), ptr(subtreeRequest), ptr(requestedDataOut), ptr(offsetsOut), ptr(treeStructuresOut)), 'UiaFind');
    const requestedData = readNativePointer(requestedDataOut);
    const treeStructures = readNativePointer(treeStructuresOut);
    if (requestedData === null || treeStructures === null) throw new Error('UiaFind returned no semantic data');
    const elements = parseRequestedData(requestedData, readTreeStructure(treeStructures));

    let focusElement: SemanticElement | null = null;
    const focusResult = UIAutomationCore.UiaNodeFromFocus(ptr(elementRequest), ptr(focusDataOut), ptr(focusTreeOut));
    const focusData = readNativePointer(focusDataOut);
    if (focusResult >= 0 && focusData !== null) focusElement = parseRequestedData(focusData, 'P')[0] ?? null;

    return {
      elements,
      focusElement,
      snapshotMilliseconds: performance.now() - startedAt,
    };
  } finally {
    const requestedData = readNativePointer(requestedDataOut);
    const offsets = readNativePointer(offsetsOut);
    const treeStructures = readNativePointer(treeStructuresOut);
    const focusData = readNativePointer(focusDataOut);
    const focusTree = readNativePointer(focusTreeOut);
    if (requestedData !== null) void Oleaut32.SafeArrayDestroy(requestedData);
    if (offsets !== null) void Oleaut32.SafeArrayDestroy(offsets);
    if (treeStructures !== null) void Oleaut32.SafeArrayDestroy(treeStructures);
    if (focusData !== null) void Oleaut32.SafeArrayDestroy(focusData);
    if (focusTree !== null) Oleaut32.SysFreeString(focusTree);
    if (rootNode !== 0n) void UIAutomationCore.UiaNodeRelease(rootNode);
    if (ownsComInitialization) Combase.CoUninitialize();
  }
}

function createFallbackSnapshot(): SemanticSnapshot {
  const elements: SemanticElement[] = [];
  const add = (bounds: Bounds, controlType: number, depth: number, parentIndex: number, focused = false): void => {
    elements.push({ bounds, controlType, depth, focused, index: elements.length, offscreen: false, parentIndex });
  };

  add([0, 0, 1_440, 900], CONTROL_TYPE_WINDOW, 0, -1);
  add([50, 50, 1_340, 800], CONTROL_TYPE_PANE, 1, 0);
  add([100, 110, 840, 680], CONTROL_TYPE_DOCUMENT, 2, 1);
  add([990, 110, 350, 680], CONTROL_TYPE_LIST, 2, 1);
  add([130, 150, 780, 160], CONTROL_TYPE_GROUP, 3, 2);
  add([130, 350, 780, 400], CONTROL_TYPE_EDIT, 3, 2, true);
  for (let index = 0; index < 8; index += 1) add([1_020, 145 + index * 73, 285, 48], CONTROL_TYPE_LIST_ITEM, 3, 3);
  for (let index = 0; index < 6; index += 1) add([165 + index * 115, 205, 86, 56], CONTROL_TYPE_BUTTON, 4, 4);
  for (let index = 0; index < 5; index += 1) add([180, 395 + index * 62, 620 - index * 35, 20], index % 2 === 0 ? CONTROL_TYPE_TEXT : CONTROL_TYPE_PROGRESS_BAR, 4, 5);
  return { elements, focusElement: elements[5]!, snapshotMilliseconds: 0 };
}

function boundsArea(bounds: Bounds): number {
  return Math.max(0, bounds[2]) * Math.max(0, bounds[3]);
}

function clipBounds(bounds: Bounds, root: Bounds): Bounds | null {
  const left = Math.max(bounds[0], root[0]);
  const top = Math.max(bounds[1], root[1]);
  const right = Math.min(bounds[0] + bounds[2], root[0] + root[2]);
  const bottom = Math.min(bounds[1] + bounds[3], root[1] + root[3]);
  return right - left >= 2 && bottom - top >= 2 ? [left, top, right - left, bottom - top] : null;
}

function boundsDistance(first: Bounds, second: Bounds): number {
  const scale = Math.max(1, first[2] + first[3] + second[2] + second[3]);
  return (Math.abs(first[0] - second[0]) + Math.abs(first[1] - second[1]) + Math.abs(first[2] - second[2]) + Math.abs(first[3] - second[3])) / scale;
}

function selectFocusIndex(elements: SemanticElement[], focusElement: SemanticElement | null): number {
  if (focusElement?.bounds !== null && focusElement?.bounds !== undefined) {
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestDepth = -1;
    for (const element of elements) {
      if (element.bounds === null || element.controlType !== focusElement.controlType) continue;
      const distance = boundsDistance(element.bounds, focusElement.bounds);
      if (distance < bestDistance - 0.000_001 || (Math.abs(distance - bestDistance) <= 0.000_001 && element.depth > bestDepth)) {
        bestDistance = distance;
        bestDepth = element.depth;
        bestIndex = element.index;
      }
    }
    if (bestIndex >= 0) return bestIndex;
  }

  let best: SemanticElement | null = null;
  for (const element of elements) {
    if (element.focused !== true || element.bounds === null) continue;
    if (best === null || element.depth > best.depth || (element.depth === best.depth && boundsArea(element.bounds) < boundsArea(best.bounds!))) best = element;
  }
  return best?.index ?? 0;
}

function semanticPriority(controlType: number | null): number {
  if (controlType === CONTROL_TYPE_DOCUMENT || controlType === CONTROL_TYPE_EDIT) return 12;
  if (
    controlType === CONTROL_TYPE_BUTTON ||
    controlType === CONTROL_TYPE_CHECK_BOX ||
    controlType === CONTROL_TYPE_COMBO_BOX ||
    controlType === CONTROL_TYPE_HYPERLINK ||
    controlType === CONTROL_TYPE_MENU_ITEM ||
    controlType === CONTROL_TYPE_RADIO_BUTTON ||
    controlType === CONTROL_TYPE_SPLIT_BUTTON
  )
    return 11;
  if (controlType === CONTROL_TYPE_LIST || controlType === CONTROL_TYPE_TREE || controlType === CONTROL_TYPE_TABLE || controlType === CONTROL_TYPE_DATA_GRID) return 10;
  if (controlType === CONTROL_TYPE_SCROLL_BAR || controlType === CONTROL_TYPE_SLIDER || controlType === CONTROL_TYPE_PROGRESS_BAR || controlType === CONTROL_TYPE_SEPARATOR) return 9;
  if (controlType === CONTROL_TYPE_LIST_ITEM || controlType === CONTROL_TYPE_TREE_ITEM || controlType === CONTROL_TYPE_DATA_ITEM) return 8;
  if (controlType === CONTROL_TYPE_GROUP || controlType === CONTROL_TYPE_PANE || controlType === CONTROL_TYPE_WINDOW) return 6;
  if (controlType === CONTROL_TYPE_TEXT || controlType === CONTROL_TYPE_IMAGE) return 4;
  return 5;
}

function geometrySeed(element: SemanticElement): number {
  const bounds = element.bounds ?? [0, 0, 1, 1];
  const value = Math.sin(bounds[0] * 0.1031 + bounds[1] * 0.11369 + bounds[2] * 0.13787 + bounds[3] * 0.15731 + (element.controlType ?? 0) * 0.000_173 + element.depth * 1.731);
  return value - Math.floor(value);
}

function selectSemanticElements(snapshot: SemanticSnapshot): { ancestry: Set<number>; focusIndex: number; rootBounds: Bounds; selected: SemanticElement[] } {
  const rootCandidate = snapshot.elements[0]?.bounds ?? snapshot.elements.filter((element) => element.bounds !== null).sort((first, second) => boundsArea(second.bounds!) - boundsArea(first.bounds!))[0]?.bounds;
  const rootBounds: Bounds = rootCandidate !== undefined && rootCandidate !== null && rootCandidate[2] > 0 && rootCandidate[3] > 0 ? rootCandidate : [0, 0, WINDOW_WIDTH, WINDOW_HEIGHT];
  const focusIndex = selectFocusIndex(snapshot.elements, snapshot.focusElement);
  const ancestry = new Set<number>();
  let ancestorIndex = focusIndex;
  while (ancestorIndex >= 0 && !ancestry.has(ancestorIndex)) {
    ancestry.add(ancestorIndex);
    ancestorIndex = snapshot.elements[ancestorIndex]?.parentIndex ?? -1;
  }

  const rootArea = boundsArea(rootBounds);
  const unique = new Map<string, SemanticElement>();
  for (const element of snapshot.elements) {
    if (element.bounds === null || element.offscreen === true || element.controlType === null) continue;
    const clipped = clipBounds(element.bounds, rootBounds);
    if (clipped === null || boundsArea(clipped) < 8) continue;
    const key = [Math.round(clipped[0] / 2), Math.round(clipped[1] / 2), Math.round(clipped[2] / 2), Math.round(clipped[3] / 2), element.controlType].join(':');
    const previous = unique.get(key);
    if (previous === undefined || ancestry.has(element.index) || (!ancestry.has(previous.index) && element.depth > previous.depth)) unique.set(key, { ...element, bounds: clipped });
  }

  const mandatory = [...unique.values()].filter((element) => ancestry.has(element.index));
  const candidates = [...unique.values()]
    .filter((element) => !ancestry.has(element.index))
    .sort((first, second) => {
      const firstArea = boundsArea(first.bounds!) / rootArea;
      const secondArea = boundsArea(second.bounds!) / rootArea;
      const firstScore = semanticPriority(first.controlType) * 20 + Math.min(first.depth, 24) * 1.8 + (1 - Math.sqrt(clamp(firstArea, 0, 1))) * 12 + geometrySeed(first) * 4;
      const secondScore = semanticPriority(second.controlType) * 20 + Math.min(second.depth, 24) * 1.8 + (1 - Math.sqrt(clamp(secondArea, 0, 1))) * 12 + geometrySeed(second) * 4;
      return secondScore - firstScore;
    });

  const selected = [...mandatory];
  const cellCounts = new Map<string, number>();
  const typeCounts = new Map<number, number>();
  for (const element of mandatory) {
    const bounds = element.bounds!;
    const cell = Math.floor(((bounds[0] + bounds[2] * 0.5 - rootBounds[0]) / rootBounds[2]) * 12) + ':' + Math.floor(((bounds[1] + bounds[3] * 0.5 - rootBounds[1]) / rootBounds[3]) * 8);
    cellCounts.set(cell, (cellCounts.get(cell) ?? 0) + 1);
    if (element.controlType !== null) typeCounts.set(element.controlType, (typeCounts.get(element.controlType) ?? 0) + 1);
  }

  for (const element of candidates) {
    if (selected.length >= MAX_SEMANTIC_ELEMENTS) break;
    const bounds = element.bounds!;
    const cell = Math.floor(((bounds[0] + bounds[2] * 0.5 - rootBounds[0]) / rootBounds[2]) * 12) + ':' + Math.floor(((bounds[1] + bounds[3] * 0.5 - rootBounds[1]) / rootBounds[3]) * 8);
    const type = element.controlType!;
    const listLike = type === CONTROL_TYPE_LIST_ITEM || type === CONTROL_TYPE_TREE_ITEM || type === CONTROL_TYPE_DATA_ITEM;
    const typeCap = type === CONTROL_TYPE_BUTTON ? 20 : type === CONTROL_TYPE_TEXT ? 10 : type === CONTROL_TYPE_IMAGE ? 8 : type === CONTROL_TYPE_CUSTOM ? 12 : listLike ? 16 : 36;
    if ((cellCounts.get(cell) ?? 0) >= 4 || (typeCounts.get(type) ?? 0) >= typeCap) continue;
    cellCounts.set(cell, (cellCounts.get(cell) ?? 0) + 1);
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
    selected.push(element);
  }

  return { ancestry, focusIndex, rootBounds, selected };
}

function toWorldRectangle(bounds: Bounds, rootBounds: Bounds): WorldRectangle {
  const centerX = ((bounds[0] + bounds[2] * 0.5 - rootBounds[0]) / rootBounds[2] - 0.5) * WORLD_WIDTH;
  const centerZ = ((bounds[1] + bounds[3] * 0.5 - rootBounds[1]) / rootBounds[3] - 0.5) * WORLD_DEPTH;
  return {
    centerX,
    centerZ,
    halfX: clamp((bounds[2] / rootBounds[2]) * WORLD_WIDTH * 0.47, 0.055, WORLD_WIDTH * 0.49),
    halfZ: clamp((bounds[3] / rootBounds[3]) * WORLD_DEPTH * 0.47, 0.045, WORLD_DEPTH * 0.49),
  };
}

function architecturalCategory(controlType: number): 'container' | 'portal' | 'monolith' | 'colonnade' | 'rail' | 'stele' | 'well' | 'mass' {
  if (
    controlType === CONTROL_TYPE_WINDOW ||
    controlType === CONTROL_TYPE_PANE ||
    controlType === CONTROL_TYPE_GROUP ||
    controlType === CONTROL_TYPE_MENU ||
    controlType === CONTROL_TYPE_MENU_BAR ||
    controlType === CONTROL_TYPE_TAB ||
    controlType === CONTROL_TYPE_TOOL_BAR ||
    controlType === CONTROL_TYPE_APP_BAR
  )
    return 'container';
  if (
    controlType === CONTROL_TYPE_BUTTON ||
    controlType === CONTROL_TYPE_CHECK_BOX ||
    controlType === CONTROL_TYPE_COMBO_BOX ||
    controlType === CONTROL_TYPE_HYPERLINK ||
    controlType === CONTROL_TYPE_MENU_ITEM ||
    controlType === CONTROL_TYPE_RADIO_BUTTON ||
    controlType === CONTROL_TYPE_SPLIT_BUTTON ||
    controlType === CONTROL_TYPE_TAB_ITEM
  )
    return 'portal';
  if (controlType === CONTROL_TYPE_DOCUMENT || controlType === CONTROL_TYPE_EDIT) return 'monolith';
  if (
    controlType === CONTROL_TYPE_LIST ||
    controlType === CONTROL_TYPE_LIST_ITEM ||
    controlType === CONTROL_TYPE_TREE ||
    controlType === CONTROL_TYPE_TREE_ITEM ||
    controlType === CONTROL_TYPE_TABLE ||
    controlType === CONTROL_TYPE_DATA_GRID ||
    controlType === CONTROL_TYPE_DATA_ITEM ||
    controlType === CONTROL_TYPE_HEADER ||
    controlType === CONTROL_TYPE_HEADER_ITEM
  )
    return 'colonnade';
  if (
    controlType === CONTROL_TYPE_PROGRESS_BAR ||
    controlType === CONTROL_TYPE_SCROLL_BAR ||
    controlType === CONTROL_TYPE_SLIDER ||
    controlType === CONTROL_TYPE_SEPARATOR ||
    controlType === CONTROL_TYPE_STATUS_BAR ||
    controlType === CONTROL_TYPE_TITLE_BAR ||
    controlType === CONTROL_TYPE_THUMB
  )
    return 'rail';
  if (controlType === CONTROL_TYPE_TEXT || controlType === CONTROL_TYPE_TOOL_TIP) return 'stele';
  if (controlType === CONTROL_TYPE_IMAGE) return 'well';
  return 'mass';
}

function buildArchitecture(snapshot: SemanticSnapshot): { masses: ArchitecturalMass[]; selectedCount: number } {
  const { focusIndex, rootBounds, selected } = selectSemanticElements(snapshot);
  const masses: ArchitecturalMass[] = [];
  const ancestryPath: SemanticElement[] = [];
  let pathIndex = focusIndex;
  while (pathIndex >= 0) {
    const element = snapshot.elements[pathIndex];
    if (element === undefined) break;
    if (element.bounds !== null) ancestryPath.push(element);
    pathIndex = element.parentIndex;
  }
  ancestryPath.reverse();
  let activeMassLimit = MAX_ARCHITECTURE_MASSES - Math.min(240, ancestryPath.length * 3 + 2);
  const push = (mass: ArchitecturalMass): void => {
    if (masses.length < activeMassLimit) masses.push(mass);
  };

  const addMass = (
    element: SemanticElement,
    rectangle: WorldRectangle,
    baseY: number,
    height: number,
    material: number,
    reveal: number,
    focus = 0,
    ancestryPosition = -1,
    centerX = rectangle.centerX,
    centerZ = rectangle.centerZ,
    halfX = rectangle.halfX,
    halfZ = rectangle.halfZ,
  ): void => {
    push({
      ancestry: ancestryPosition,
      baseY,
      centerX,
      centerZ,
      depth: clamp(element.depth / 24, 0, 1),
      focus,
      halfX: Math.max(0.015, halfX),
      halfZ: Math.max(0.015, halfZ),
      height: Math.max(0.015, height),
      material,
      reveal,
      seed: geometrySeed(element),
    });
  };

  for (const element of selected) {
    const bounds = element.bounds!;
    const rectangle = toWorldRectangle(bounds, rootBounds);
    const category = architecturalCategory(element.controlType!);
    const depth = Math.min(element.depth, 24);
    const baseY = 0.12 + depth * 0.145;
    const categoryDelay = category === 'container' ? 0 : category === 'monolith' ? 0.12 : category === 'portal' ? 0.24 : category === 'colonnade' ? 0.34 : category === 'rail' ? 0.48 : 0.42;
    const reveal = 0.68 + depth * 0.075 + geometrySeed(element) * 0.16 + categoryDelay;
    const ancestryPosition = -1;
    const focus = 0;
    const areaRatio = boundsArea(bounds) / boundsArea(rootBounds);

    if (category === 'container') {
      const wall = clamp(Math.min(rectangle.halfX, rectangle.halfZ) * 0.085, 0.035, 0.13);
      const wallHeight = 0.18 + Math.min(0.28, depth * 0.012);
      if (element.depth === 0 || (areaRatio > 0.12 && areaRatio < 0.72))
        addMass(element, rectangle, Math.max(0, baseY - 0.08), 0.11, MATERIAL_CONCRETE, reveal, focus * 0.25, ancestryPosition, rectangle.centerX, rectangle.centerZ, rectangle.halfX, rectangle.halfZ);
      addMass(element, rectangle, baseY, wallHeight, MATERIAL_CONCRETE, reveal + 0.02, focus * 0.25, ancestryPosition, rectangle.centerX - rectangle.halfX + wall, rectangle.centerZ, wall, rectangle.halfZ);
      addMass(element, rectangle, baseY, wallHeight, MATERIAL_CONCRETE, reveal + 0.04, focus * 0.25, ancestryPosition, rectangle.centerX + rectangle.halfX - wall, rectangle.centerZ, wall, rectangle.halfZ);
      addMass(element, rectangle, baseY, wallHeight, MATERIAL_CONCRETE, reveal + 0.06, focus * 0.25, ancestryPosition, rectangle.centerX, rectangle.centerZ - rectangle.halfZ + wall, rectangle.halfX, wall);
      addMass(element, rectangle, baseY, wallHeight, MATERIAL_CONCRETE, reveal + 0.08, focus * 0.25, ancestryPosition, rectangle.centerX, rectangle.centerZ + rectangle.halfZ - wall, rectangle.halfX, wall);
      continue;
    }

    if (category === 'portal') {
      const openingHalfX = clamp(rectangle.halfX * 0.72, 0.09, 0.72);
      const openingHalfZ = clamp(rectangle.halfZ * 0.72, 0.045, 0.24);
      const jamb = clamp(openingHalfX * 0.16, 0.035, 0.11);
      const portalHeight = 0.72 + (1 - Math.sqrt(clamp(areaRatio, 0, 1))) * 0.5;
      addMass(element, rectangle, baseY, portalHeight * 0.72, MATERIAL_PORTAL, reveal, focus, ancestryPosition, rectangle.centerX, rectangle.centerZ, openingHalfX, openingHalfZ);
      addMass(element, rectangle, baseY, portalHeight, MATERIAL_LIMESTONE, reveal + 0.04, focus * 0.4, ancestryPosition, rectangle.centerX - openingHalfX + jamb, rectangle.centerZ, jamb, openingHalfZ * 1.15);
      addMass(element, rectangle, baseY, portalHeight, MATERIAL_LIMESTONE, reveal + 0.06, focus * 0.4, ancestryPosition, rectangle.centerX + openingHalfX - jamb, rectangle.centerZ, jamb, openingHalfZ * 1.15);
      addMass(element, rectangle, baseY + portalHeight * 0.82, portalHeight * 0.18, MATERIAL_LIMESTONE, reveal + 0.08, focus * 0.4, ancestryPosition, rectangle.centerX, rectangle.centerZ, openingHalfX, openingHalfZ * 1.15);
      continue;
    }

    if (category === 'monolith') {
      const height = 1.4 + Math.log2(1 + areaRatio * 100) * 0.48 + depth * 0.025;
      addMass(element, rectangle, baseY, height, MATERIAL_BASALT, reveal, focus, ancestryPosition, rectangle.centerX, rectangle.centerZ, clamp(rectangle.halfX * 0.7, 0.16, 2.5), clamp(rectangle.halfZ * 0.7, 0.12, 1.7));
      addMass(
        element,
        rectangle,
        baseY + height * 0.22,
        height * 0.5,
        MATERIAL_PORTAL,
        reveal + 0.12,
        focus,
        ancestryPosition,
        rectangle.centerX + clamp(rectangle.halfX * 0.25, 0.04, 0.3),
        rectangle.centerZ - rectangle.halfZ * 0.71,
        clamp(rectangle.halfX * 0.045, 0.018, 0.055),
        0.025,
      );
      continue;
    }

    if (category === 'colonnade') {
      const count = clamp(Math.round(rectangle.halfX * 2.2), 2, element.controlType === CONTROL_TYPE_LIST_ITEM || element.controlType === CONTROL_TYPE_TREE_ITEM ? 3 : 7);
      const spacing = count <= 1 ? 0 : (rectangle.halfX * 1.55) / (count - 1);
      const pillarHalf = clamp(Math.min(rectangle.halfX, rectangle.halfZ) * 0.11, 0.026, 0.085);
      const pillarHeight = 0.6 + Math.min(1.25, depth * 0.045 + (1 - Math.sqrt(clamp(areaRatio, 0, 1))) * 0.45);
      for (let index = 0; index < count; index += 1) {
        const offset = count === 1 ? 0 : -rectangle.halfX * 0.775 + index * spacing;
        addMass(element, rectangle, baseY, pillarHeight, MATERIAL_LIMESTONE, reveal + index * 0.025, focus * 0.5, ancestryPosition, rectangle.centerX + offset, rectangle.centerZ, pillarHalf, clamp(rectangle.halfZ * 0.5, 0.035, 0.16));
      }
      addMass(
        element,
        rectangle,
        baseY + pillarHeight * 0.84,
        pillarHeight * 0.16,
        MATERIAL_LIMESTONE,
        reveal + count * 0.025,
        focus * 0.5,
        ancestryPosition,
        rectangle.centerX,
        rectangle.centerZ,
        clamp(rectangle.halfX * 0.86, 0.1, 2.4),
        clamp(rectangle.halfZ * 0.58, 0.04, 0.18),
      );
      continue;
    }

    if (category === 'rail') {
      const horizontal = rectangle.halfX >= rectangle.halfZ;
      addMass(
        element,
        rectangle,
        baseY + 0.32,
        0.13,
        MATERIAL_STEEL,
        reveal,
        focus,
        ancestryPosition,
        rectangle.centerX,
        rectangle.centerZ,
        horizontal ? rectangle.halfX : clamp(rectangle.halfX, 0.035, 0.11),
        horizontal ? clamp(rectangle.halfZ, 0.025, 0.095) : rectangle.halfZ,
      );
      continue;
    }

    if (category === 'stele') {
      addMass(
        element,
        rectangle,
        baseY,
        0.38 + depth * 0.025,
        MATERIAL_LIMESTONE,
        reveal,
        focus * 0.5,
        ancestryPosition,
        rectangle.centerX,
        rectangle.centerZ,
        clamp(rectangle.halfX * 0.75, 0.045, 0.55),
        clamp(rectangle.halfZ * 0.2, 0.018, 0.055),
      );
      continue;
    }

    if (category === 'well') {
      addMass(element, rectangle, baseY, 0.12, MATERIAL_PORTAL, reveal, focus, ancestryPosition, rectangle.centerX, rectangle.centerZ, clamp(rectangle.halfX * 0.72, 0.06, 0.8), clamp(rectangle.halfZ * 0.72, 0.06, 0.8));
      const rim = clamp(Math.min(rectangle.halfX, rectangle.halfZ) * 0.12, 0.025, 0.075);
      addMass(element, rectangle, baseY + 0.11, 0.09, MATERIAL_STEEL, reveal + 0.05, focus * 0.5, ancestryPosition, rectangle.centerX, rectangle.centerZ - rectangle.halfZ * 0.7, clamp(rectangle.halfX * 0.82, 0.07, 0.9), rim);
      continue;
    }

    const height = 0.38 + Math.min(1.2, depth * 0.04 + (1 - Math.sqrt(clamp(areaRatio, 0, 1))) * 0.55);
    addMass(
      element,
      rectangle,
      baseY,
      height,
      element.controlType === CONTROL_TYPE_CALENDAR || element.controlType === CONTROL_TYPE_SEMANTIC_ZOOM ? MATERIAL_LIMESTONE : MATERIAL_CONCRETE,
      reveal,
      focus,
      ancestryPosition,
      rectangle.centerX,
      rectangle.centerZ,
      clamp(rectangle.halfX * 0.62, 0.055, 1.4),
      clamp(rectangle.halfZ * 0.62, 0.055, 1.0),
    );
  }

  activeMassLimit = MAX_ARCHITECTURE_MASSES;
  let previousRoute: { baseY: number; x: number; z: number } | null = null;
  for (let index = 0; index < ancestryPath.length; index += 1) {
    const element = ancestryPath[index]!;
    const clipped = element.bounds === null ? null : clipBounds(element.bounds, rootBounds);
    if (clipped === null) continue;
    const rectangle = toWorldRectangle(clipped, rootBounds);
    const order = ancestryPath.length <= 1 ? 1 : index / (ancestryPath.length - 1);
    const routeBase = 0.28;
    const routeX = rectangle.centerX - rectangle.halfX * 0.78 * (1 - order);
    const routeZ = rectangle.centerZ - rectangle.halfZ * 0.82;
    if (previousRoute !== null) {
      const midpointX = (previousRoute.x + routeX) * 0.5;
      const midpointZ = (previousRoute.z + routeZ) * 0.5;
      const reveal = 3.32 + order * 0.18;
      addMass(element, rectangle, routeBase, 0.07, MATERIAL_STEEL, reveal, 0, order, midpointX, previousRoute.z, Math.max(0.07, Math.abs(routeX - previousRoute.x) * 0.5 + 0.04), 0.07);
      addMass(element, rectangle, routeBase, 0.07, MATERIAL_STEEL, reveal + 0.04, 0, order, routeX, midpointZ, 0.07, Math.max(0.07, Math.abs(routeZ - previousRoute.z) * 0.5 + 0.04));
      const verticalDistance = Math.abs(routeBase - previousRoute.baseY);
      if (verticalDistance > 0.04) addMass(element, rectangle, Math.min(routeBase, previousRoute.baseY), verticalDistance + 0.07, MATERIAL_STEEL, reveal + 0.08, 0, order, routeX, previousRoute.z, 0.07, 0.07);
    }
    previousRoute = { baseY: routeBase, x: routeX, z: routeZ };
  }

  const focusElement = snapshot.elements[focusIndex];
  const focusBounds = focusElement?.bounds === null || focusElement?.bounds === undefined ? rootBounds : (clipBounds(focusElement.bounds, rootBounds) ?? rootBounds);
  const focusRectangle = toWorldRectangle(focusBounds, rootBounds);
  const focusBase = 0.5 + Math.min(focusElement?.depth ?? 0, 24) * 0.15;
  const focusZ = focusRectangle.centerZ - focusRectangle.halfZ * 0.78;
  const focusProxy: SemanticElement = focusElement ?? { bounds: focusBounds, controlType: CONTROL_TYPE_CUSTOM, depth: 0, focused: true, index: 0, offscreen: false, parentIndex: -1 };
  addMass(focusProxy, focusRectangle, focusBase + 5.45, 0.15, MATERIAL_GOLD, 0.04, 1, 1, focusRectangle.centerX, focusZ, 0.05, 0.05);
  addMass(focusProxy, focusRectangle, 0.02, focusBase + 5.58, MATERIAL_GOLD, 0.04, 2, 1, focusRectangle.centerX, focusZ, 0.022, 0.022);

  return { masses, selectedCount: selected.length };
}

function writeArchitectureBuffer(masses: ArchitecturalMass[]): Buffer {
  const buffer = Buffer.alloc(masses.length * ARCHITECTURE_STRIDE);
  for (let index = 0; index < masses.length; index += 1) {
    const mass = masses[index]!;
    const offset = index * ARCHITECTURE_STRIDE;
    buffer.writeFloatLE(mass.centerX, offset);
    buffer.writeFloatLE(mass.centerZ, offset + 4);
    buffer.writeFloatLE(mass.halfX, offset + 8);
    buffer.writeFloatLE(mass.halfZ, offset + 12);
    buffer.writeFloatLE(mass.baseY, offset + 16);
    buffer.writeFloatLE(mass.height, offset + 20);
    buffer.writeFloatLE(mass.material, offset + 24);
    buffer.writeFloatLE(mass.reveal, offset + 28);
    buffer.writeFloatLE(mass.focus, offset + 32);
    buffer.writeFloatLE(mass.ancestry, offset + 36);
    buffer.writeFloatLE(mass.depth, offset + 40);
    buffer.writeFloatLE(mass.seed, offset + 44);
  }
  return buffer;
}

const FRAME_HLSL = `
cbuffer Frame : register(b0) {
  float sceneTime;
  float aspectRatio;
  float viewportWidth;
  float viewportHeight;
};

float palaceTime() {
  return fmod(max(sceneTime, 0.0), 10.0);
}

void cameraBasis(out float3 eye, out float3 right, out float3 up, out float3 forward) {
  float arc = smoothstep(2.55, 6.75, palaceTime());
  float angle = lerp(-0.56, 0.17, arc);
  eye = float3(sin(angle) * 19.2, 6.05, -cos(angle) * 19.2);
  float3 target = float3(0.0, 2.2, 0.35);
  forward = normalize(target - eye);
  right = normalize(cross(float3(0.0, 1.0, 0.0), forward));
  up = cross(forward, right);
}
`;

const FULLSCREEN_VERTEX_SHADER = `
struct VertexOutput {
  float4 position : SV_Position;
  float2 uv : TEXCOORD0;
};

VertexOutput main(uint vertexId : SV_VertexID) {
  VertexOutput output;
  float2 position = float2((vertexId << 1) & 2, vertexId & 2);
  output.uv = position;
  output.position = float4(position * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return output;
}
`;

const BACKGROUND_PIXEL_SHADER =
  FRAME_HLSL +
  `
float hash21(float2 coordinate) {
  coordinate = frac(coordinate * float2(123.34, 456.21));
  coordinate += dot(coordinate, coordinate + 45.32);
  return frac(coordinate.x * coordinate.y);
}

float4 main(float4 pixelPosition : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 eye;
  float3 right;
  float3 up;
  float3 forward;
  cameraBasis(eye, right, up, forward);

  float2 screen = uv * 2.0 - 1.0;
  screen.y = -screen.y;
  float field = tan(0.3665);
  float3 ray = normalize(forward + right * screen.x * aspectRatio * field + up * screen.y * field);
  float skyHeight = saturate(ray.y * 1.8 + 0.32);
  float3 color = lerp(float3(0.0005, 0.0008, 0.0017), float3(0.013, 0.020, 0.034), skyHeight);

  float moonDistance = length((uv - float2(0.79, 0.18)) * float2(aspectRatio, 1.0));
  float moon = smoothstep(0.034, 0.029, moonDistance);
  float moonHalo = exp(-moonDistance * 23.0);
  color += float3(0.35, 0.33, 0.30) * moon * 0.65;
  color += float3(0.022, 0.029, 0.041) * moonHalo;

  float starCell = hash21(floor(uv * float2(690.0, 390.0)));
  float stars = smoothstep(0.9978, 1.0, starCell) * smoothstep(-0.02, 0.14, ray.y);
  color += stars * float3(0.24, 0.28, 0.34);

  if (ray.y < -0.001) {
    float distanceToGround = -eye.y / ray.y;
    float3 ground = eye + ray * distanceToGround;
    float grain = hash21(floor(ground.xz * 5.0));
    float lineX = 1.0 - smoothstep(0.0, 0.022, abs(frac(ground.x * 0.25 + 0.5) - 0.5));
    float lineZ = 1.0 - smoothstep(0.0, 0.022, abs(frac(ground.z * 0.25 + 0.5) - 0.5));
    float palaceShadow = exp(-(ground.x * ground.x * 0.018 + ground.z * ground.z * 0.035));
    float distanceFade = exp(-distanceToGround * 0.036);
    float3 groundColor = float3(0.0032, 0.0041, 0.0056) + grain * 0.0012;
    groundColor += (lineX + lineZ) * float3(0.008, 0.009, 0.011) * distanceFade;
    groundColor *= 1.0 - palaceShadow * 0.72;
    color = lerp(color, groundColor, saturate(distanceFade * 1.25));
  }

  float horizon = exp(-abs(ray.y) * 21.0);
  color += horizon * float3(0.012, 0.016, 0.024);
  float vignette = 1.0 - smoothstep(0.18, 0.82, dot(uv - 0.5, uv - 0.5));
  float reveal = smoothstep(0.08, 0.72, palaceTime()) * (1.0 - smoothstep(9.15, 10.0, palaceTime()));
  color *= lerp(0.015, 1.0, reveal * reveal) * lerp(0.72, 1.0, vignette);
  return float4(color, 1.0);
}
`;

const ARCHITECTURE_VERTEX_SHADER =
  FRAME_HLSL +
  `
struct ArchitectureMass {
  float4 centerHalf;
  float4 vertical;
  float4 intent;
};

StructuredBuffer<ArchitectureMass> masses : register(t0);

struct VertexOutput {
  float4 position : SV_Position;
  float3 worldPosition : TEXCOORD0;
  float3 normal : TEXCOORD1;
  float2 faceUv : TEXCOORD2;
  nointerpolation float4 style : TEXCOORD3;
  nointerpolation float2 structure : TEXCOORD4;
  float3 localPosition : TEXCOORD5;
};

float2 cornerForVertex(uint cornerIndex) {
  if (cornerIndex == 0) return float2(-1.0, -1.0);
  if (cornerIndex == 1) return float2(1.0, -1.0);
  if (cornerIndex == 2) return float2(1.0, 1.0);
  if (cornerIndex == 3) return float2(-1.0, -1.0);
  if (cornerIndex == 4) return float2(1.0, 1.0);
  return float2(-1.0, 1.0);
}

float3 cubePoint(uint face, float2 corner, out float3 normal) {
  if (face == 0) {
    normal = float3(1.0, 0.0, 0.0);
    return float3(1.0, corner.y, -corner.x);
  }
  if (face == 1) {
    normal = float3(-1.0, 0.0, 0.0);
    return float3(-1.0, corner.y, corner.x);
  }
  if (face == 2) {
    normal = float3(0.0, 1.0, 0.0);
    return float3(corner.x, 1.0, -corner.y);
  }
  if (face == 3) {
    normal = float3(0.0, -1.0, 0.0);
    return float3(corner.x, -1.0, corner.y);
  }
  if (face == 4) {
    normal = float3(0.0, 0.0, 1.0);
    return float3(corner.x, corner.y, 1.0);
  }
  normal = float3(0.0, 0.0, -1.0);
  return float3(-corner.x, corner.y, -1.0);
}

VertexOutput main(uint vertexId : SV_VertexID) {
  uint massIndex = vertexId / 36;
  uint localIndex = vertexId % 36;
  uint face = localIndex / 6;
  float2 corner = cornerForVertex(localIndex % 6);
  float3 normal;
  float3 cube = cubePoint(face, corner, normal);
  ArchitectureMass mass = masses[massIndex];

  float rise = smoothstep(mass.vertical.w, mass.vertical.w + 0.62, palaceTime());
  rise = rise * rise * (3.0 - 2.0 * rise);
  if (mass.intent.x > 1.5) {
    float openingStrike = 1.0 - smoothstep(0.42, 0.88, palaceTime());
    float finalStrike = smoothstep(5.68, 6.34, palaceTime());
    rise = max(openingStrike, finalStrike);
  }
  float halfHeight = max(0.001, mass.vertical.y * 0.5 * rise);
  float3 halfExtent = float3(mass.centerHalf.z, halfHeight, mass.centerHalf.w);
  float3 center = float3(mass.centerHalf.x, mass.vertical.x + halfHeight, mass.centerHalf.y);
  float3 worldPosition = center + cube * halfExtent;

  float3 eye;
  float3 right;
  float3 up;
  float3 forward;
  cameraBasis(eye, right, up, forward);
  float3 relative = worldPosition - eye;
  float3 view = float3(dot(relative, right), dot(relative, up), dot(relative, forward));
  float field = 1.0 / tan(0.3665);
  float nearPlane = 0.1;
  float farPlane = 120.0;

  VertexOutput output;
  output.position = float4(view.x * field / aspectRatio, view.y * field, view.z * farPlane / (farPlane - nearPlane) - nearPlane * farPlane / (farPlane - nearPlane), view.z);
  output.worldPosition = worldPosition;
  output.normal = normal;
  output.faceUv = corner;
  output.style = float4(mass.vertical.z, mass.intent.x, mass.intent.y, mass.intent.w);
  output.structure = float2(mass.intent.z, rise);
  output.localPosition = cube;
  return output;
}
`;

const ARCHITECTURE_PIXEL_SHADER =
  FRAME_HLSL +
  `
struct PixelInput {
  float4 position : SV_Position;
  float3 worldPosition : TEXCOORD0;
  float3 normal : TEXCOORD1;
  float2 faceUv : TEXCOORD2;
  nointerpolation float4 style : TEXCOORD3;
  nointerpolation float2 structure : TEXCOORD4;
  float3 localPosition : TEXCOORD5;
};

float hash31(float3 coordinate) {
  coordinate = frac(coordinate * 0.1031);
  coordinate += dot(coordinate, coordinate.yzx + 33.33);
  return frac((coordinate.x + coordinate.y) * coordinate.z);
}

float4 main(PixelInput input) : SV_Target {
  clip(input.structure.y - 0.006);
  float material = input.style.x;
  float focus = input.style.y;
  float ancestry = input.style.z;
  float seed = input.style.w;
  float3 baseColor = float3(0.15, 0.142, 0.126);
  float roughness = 0.86;

  if (material > 0.5 && material < 1.5) {
    baseColor = float3(0.009, 0.011, 0.014);
    roughness = 0.45;
  } else if (material >= 1.5 && material < 2.5) {
    baseColor = float3(0.29, 0.272, 0.235);
    roughness = 0.78;
  } else if (material >= 2.5 && material < 3.5) {
    baseColor = float3(0.032, 0.039, 0.043);
    roughness = 0.38;
  } else if (material >= 3.5 && material < 4.5) {
    baseColor = float3(0.83, 0.54, 0.13);
    roughness = 0.24;
  } else if (material >= 4.5) {
    baseColor = float3(0.0015, 0.0016, 0.0018);
    roughness = 0.18;
  }

  float aggregate = hash31(floor(input.worldPosition * float3(13.0, 9.0, 13.0)) + seed * 17.0);
  float boardLine = 1.0 - smoothstep(0.0, 0.035, abs(frac(input.worldPosition.y * 1.72 + seed) - 0.5));
  if (material < 0.5) baseColor *= 0.88 + aggregate * 0.17 - boardLine * 0.07;
  if (material >= 1.5 && material < 2.5) baseColor *= 0.92 + aggregate * 0.11;

  float3 eye;
  float3 cameraRight;
  float3 cameraUp;
  float3 cameraForward;
  cameraBasis(eye, cameraRight, cameraUp, cameraForward);
  float3 viewDirection = normalize(eye - input.worldPosition);
  float3 lightDirection = normalize(float3(-0.52, 0.82, -0.31));
  float diffuse = saturate(dot(input.normal, lightDirection));
  float skyLight = 0.035 + 0.085 * saturate(input.normal.y);
  float rim = pow(1.0 - saturate(dot(input.normal, viewDirection)), 3.0);
  float3 halfVector = normalize(lightDirection + viewDirection);
  float specular = pow(saturate(dot(input.normal, halfVector)), lerp(18.0, 92.0, 1.0 - roughness)) * (1.0 - roughness);
  float edgeDistance = 1.0 - max(abs(input.faceUv.x), abs(input.faceUv.y));
  float bevelWidth = max(fwidth(edgeDistance) * 2.2, 0.012);
  float edge = 1.0 - smoothstep(0.0, bevelWidth, edgeDistance);

  float3 color = baseColor * (skyLight + diffuse * 0.56);
  color += float3(0.11, 0.14, 0.19) * rim * 0.18;
  color += float3(0.9, 0.86, 0.75) * specular * 0.28;
  color += edge * baseColor * 0.16;
  if (material > 0.5 && material < 1.5) color += float3(0.045, 0.071, 0.105) * (rim * 0.72 + edge * 0.12);
  if (material >= 2.5 && material < 3.5) color += float3(0.07, 0.105, 0.125) * (specular * 0.7 + rim * 0.16);
  color *= lerp(0.56, 1.0, smoothstep(-1.0, -0.34, input.localPosition.y));

  float pulsePosition = saturate((palaceTime() - 4.52) / 1.62);
  float pulse = ancestry >= 0.0 ? exp(-pow((ancestry - pulsePosition) / 0.095, 2.0)) * smoothstep(4.42, 4.62, palaceTime()) * (1.0 - smoothstep(6.18, 6.42, palaceTime())) : 0.0;
  float routeGlow = ancestry >= 0.0 ? smoothstep(4.38, 4.7, palaceTime()) * (1.0 - smoothstep(6.22, 6.62, palaceTime())) : 0.0;
  float3 gold = float3(1.0, 0.53, 0.105);
  color += gold * edge * (routeGlow * 0.68 + pulse * 2.6);
  color += gold * focus * edge * (0.16 + 0.2 * sin(palaceTime() * 2.1) * sin(palaceTime() * 2.1));
  if (material >= 3.5 && material < 4.5) color += gold * (2.25 + pulse * 2.2);

  float distanceFade = saturate((length(eye - input.worldPosition) - 18.0) / 42.0);
  color = lerp(color, float3(0.008, 0.012, 0.019), distanceFade * 0.33);
  color *= 0.55 + input.structure.y * 0.45;
  return float4(color, 1.0);
}
`;

const COMPOSITE_PIXEL_SHADER =
  FRAME_HLSL +
  `
Texture2D<float4> hdrTexture : register(t0);
SamplerState linearSampler : register(s0);

float hash21(float2 coordinate) {
  coordinate = frac(coordinate * float2(123.34, 456.21));
  coordinate += dot(coordinate, coordinate + 45.32);
  return frac(coordinate.x * coordinate.y);
}

float3 bloomSample(float2 uv, float2 offset) {
  float3 sampleColor = hdrTexture.Sample(linearSampler, uv + offset).rgb;
  return max(sampleColor - 0.72, 0.0);
}

float3 aces(float3 color) {
  return saturate((color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14));
}

float luma(float3 color) {
  return dot(color, float3(0.299, 0.587, 0.114));
}

float3 fxaa(float2 uv) {
  float2 pixel = float2(1.0 / viewportWidth, 1.0 / viewportHeight);
  float3 northwest = hdrTexture.Sample(linearSampler, uv + float2(-pixel.x, -pixel.y)).rgb;
  float3 northeast = hdrTexture.Sample(linearSampler, uv + float2(pixel.x, -pixel.y)).rgb;
  float3 southwest = hdrTexture.Sample(linearSampler, uv + float2(-pixel.x, pixel.y)).rgb;
  float3 southeast = hdrTexture.Sample(linearSampler, uv + float2(pixel.x, pixel.y)).rgb;
  float3 center = hdrTexture.Sample(linearSampler, uv).rgb;
  float northwestLuma = luma(northwest);
  float northeastLuma = luma(northeast);
  float southwestLuma = luma(southwest);
  float southeastLuma = luma(southeast);
  float centerLuma = luma(center);
  float minimumLuma = min(centerLuma, min(min(northwestLuma, northeastLuma), min(southwestLuma, southeastLuma)));
  float maximumLuma = max(centerLuma, max(max(northwestLuma, northeastLuma), max(southwestLuma, southeastLuma)));
  float2 direction;
  direction.x = -((northwestLuma + northeastLuma) - (southwestLuma + southeastLuma));
  direction.y = (northwestLuma + southwestLuma) - (northeastLuma + southeastLuma);
  float directionReduce = max((northwestLuma + northeastLuma + southwestLuma + southeastLuma) * 0.03125, 0.0078125);
  float reciprocalMinimum = 1.0 / (min(abs(direction.x), abs(direction.y)) + directionReduce);
  direction = clamp(direction * reciprocalMinimum, -8.0, 8.0) * pixel;
  float3 first = 0.5 * (hdrTexture.Sample(linearSampler, uv + direction * (1.0 / 3.0 - 0.5)).rgb + hdrTexture.Sample(linearSampler, uv + direction * (2.0 / 3.0 - 0.5)).rgb);
  float3 second = first * 0.5 + 0.25 * (hdrTexture.Sample(linearSampler, uv + direction * -0.5).rgb + hdrTexture.Sample(linearSampler, uv + direction * 0.5).rgb);
  float secondLuma = luma(second);
  return secondLuma < minimumLuma || secondLuma > maximumLuma ? first : second;
}

uint glyphBits(uint code) {
  if (code == 65) return 0x99f996;
  if (code == 67) return 0xe1111e;
  if (code == 69) return 0xf1711f;
  if (code == 70) return 0x11711f;
  if (code == 72) return 0x99f999;
  if (code == 73) return 0xf6666f;
  if (code == 76) return 0xf11111;
  if (code == 78) return 0x9ddbb9;
  if (code == 79) return 0x699996;
  if (code == 80) return 0x117997;
  if (code == 82) return 0x957997;
  if (code == 83) return 0x78611e;
  if (code == 84) return 0x66666f;
  if (code == 85) return 0x699999;
  if (code == 87) return 0xafd999;
  return 0;
}

uint titleCode(uint index) {
  if (index == 0) return 80;
  if (index == 1 || index == 3) return 65;
  if (index == 2) return 76;
  if (index == 4) return 67;
  if (index == 5 || index == 13) return 69;
  if (index == 7) return 79;
  if (index == 8) return 70;
  if (index == 10) return 73;
  if (index == 11 || index == 14) return 78;
  if (index == 12 || index == 15) return 84;
  return 32;
}

uint subtitleCode(uint index) {
  if (index == 0) return 83;
  if (index == 1 || index == 5 || index == 12 || index == 16 || index == 21 || index == 24) return 84;
  if (index == 2 || index == 7) return 82;
  if (index == 3 || index == 6 || index == 15) return 85;
  if (index == 4 || index == 18) return 67;
  if (index == 8 || index == 22) return 69;
  if (index == 10) return 87;
  if (index == 11) return 73;
  if (index == 13) return 72;
  if (index == 14 || index == 19) return 79;
  if (index == 20 || index == 23) return 78;
  return 32;
}

float textMask(float2 pixelCoordinate, float2 origin, float pixelScale, uint glyphCount, uint textLine) {
  float2 local = (pixelCoordinate - origin) / pixelScale;
  if (local.x < 0.0 || local.y < 0.0 || local.y >= 6.0 || local.x >= glyphCount * 6.0) return 0.0;
  uint glyphIndex = (uint)floor(local.x / 6.0);
  uint pixelX = (uint)floor(fmod(local.x, 6.0));
  uint pixelY = (uint)floor(local.y);
  if (pixelX >= 4) return 0.0;
  uint code = textLine == 0 ? titleCode(glyphIndex) : subtitleCode(glyphIndex);
  uint bitIndex = pixelY * 4 + pixelX;
  return (glyphBits(code) >> bitIndex) & 1;
}

float4 main(float4 pixelPosition : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 color = fxaa(uv);
  float2 pixel = float2(1.0 / viewportWidth, 1.0 / viewportHeight) * 2.4;
  float3 bloom = bloomSample(uv, float2(pixel.x, 0.0)) + bloomSample(uv, float2(-pixel.x, 0.0));
  bloom += bloomSample(uv, float2(0.0, pixel.y)) + bloomSample(uv, float2(0.0, -pixel.y));
  bloom += bloomSample(uv, pixel) + bloomSample(uv, -pixel);
  bloom += bloomSample(uv, float2(pixel.x, -pixel.y)) + bloomSample(uv, float2(-pixel.x, pixel.y));
  color += bloom * 0.075;

  float vignette = 1.0 - smoothstep(0.18, 0.74, dot(uv - 0.5, uv - 0.5));
  color *= lerp(0.70, 1.0, vignette);
  color = aces(color * 1.32);
  color = pow(color, 1.0 / 2.2);
  float grain = hash21(pixelPosition.xy + floor(sceneTime * 60.0)) - 0.5;
  color += grain * 0.009;
  float statementReveal = smoothstep(7.32, 7.72, palaceTime()) * (1.0 - smoothstep(9.1, 9.65, palaceTime()));
  float title = textMask(pixelPosition.xy, float2(68.0, 66.0), 3.0, 16, 0);
  float subtitle = textMask(pixelPosition.xy, float2(70.0, 105.0), 2.0, 25, 1);
  float rule = step(68.0, pixelPosition.x) * step(pixelPosition.x, 355.0) * (1.0 - smoothstep(0.0, 1.15, abs(pixelPosition.y - 53.0)));
  color = lerp(color, float3(0.79, 0.75, 0.66), title * statementReveal * 0.86);
  color += float3(0.84, 0.48, 0.11) * rule * statementReveal * 0.62;
  color = lerp(color, float3(0.42, 0.44, 0.43), subtitle * statementReveal * 0.72);
  color *= 1.0 - smoothstep(9.2, 10.0, palaceTime());
  return float4(saturate(color), 1.0);
}
`;

const forceFallback = Bun.env.PALACE_FALLBACK === '1';
let snapshot: SemanticSnapshot;
let snapshotMode = 'live';
if (forceFallback) {
  snapshot = createFallbackSnapshot();
  snapshotMode = 'sealed';
} else {
  try {
    snapshot = snapshotForegroundSemantics();
  } catch (error) {
    snapshot = createFallbackSnapshot();
    snapshotMode = 'sealed';
    console.error('The foreground provider withheld its semantic structure; constructing the sealed palace instead. ' + (error instanceof Error ? error.message : String(error)));
  }
}

const architecture = buildArchitecture(snapshot);
const architectureBytes = writeArchitectureBuffer(architecture.masses);
console.log('');
console.log('PALACE OF INTENT');
console.log('  ' + snapshot.elements.length.toLocaleString() + ' semantic elements · ' + architecture.selectedCount.toLocaleString() + ' curated structures · ' + architecture.masses.length.toLocaleString() + ' architectural masses');
console.log('  ' + (snapshotMode === 'live' ? snapshot.snapshotMilliseconds.toFixed(1) + ' ms content-blind snapshot' : 'sealed-palace fallback'));
console.log('  pixels 0 · names 0 · values 0 · labels 0 · text 0');
console.log('');

const window = createWindow({ borderless: true, height: WINDOW_HEIGHT, title: 'Palace of Intent — Structure Without Content', width: WINDOW_WIDTH });
const clientSize = window.clientSize();
const frameData = Buffer.alloc(16);
const capturePath = Bun.env.CAPTURE_PNG;
const fixedCaptureTime = environmentNumber('PALACE_FIXED_TIME_SECONDS', 7.82, 0);
const captureFrame = environmentNumber('CAPTURE_FRAME', 3, 2);
const sequenceDirectory = Bun.env.CAPTURE_SEQUENCE_DIR;
const sequenceFrames = environmentNumber('CAPTURE_SEQUENCE_FRAMES', 240, 1);
const sequenceFramesPerSecond = environmentNumber('CAPTURE_SEQUENCE_FPS', 30, 1);
const sequenceWarmup = environmentNumber('CAPTURE_SEQUENCE_WARMUP', 3, 0);
const durationMilliseconds = environmentNumber('DEMO_DURATION_MS', 0, 0);
const startedAt = performance.now();
let architectureBuffer: StructuredBuffer | null = null;
let architecturePixelShader = 0n;
let architectureVertexShader = 0n;
let backgroundPixelShader = 0n;
let frameIndex = 0;
let captured = false;
let compositePixelShader = 0n;
let depth: DepthBuffer | null = null;
let frameConstants = 0n;
let fullscreenVertexShader = 0n;
let gpu: Gpu | null = null;
let hdrTarget: TextureResult | null = null;
let sampler = 0n;

try {
  if (capturePath !== undefined && sequenceDirectory !== undefined) throw new Error('CAPTURE_PNG and CAPTURE_SEQUENCE_DIR are mutually exclusive capture modes');
  gpu = createDevice(window.hwnd, { height: clientSize.h, width: clientSize.w });
  hdrTarget = makeTexture({ format: DXGI_FORMAT_R16G16B16A16_FLOAT, h: clientSize.h, rtv: true, srv: true, w: clientSize.w });
  depth = makeDepthBuffer(clientSize.w, clientSize.h);
  frameConstants = makeConstantBuffer(16);
  architectureBuffer = makeStructuredBuffer({ count: architecture.masses.length, initialData: architectureBytes, srv: true, stride: ARCHITECTURE_STRIDE });
  sampler = makeSampler();

  const fullscreenVertexCode = compile(FULLSCREEN_VERTEX_SHADER, 'main', 'vs_5_0');
  try {
    fullscreenVertexShader = makeVertexShader(fullscreenVertexCode);
  } finally {
    blobRelease(fullscreenVertexCode.blob);
  }
  const backgroundPixelCode = compile(BACKGROUND_PIXEL_SHADER, 'main', 'ps_5_0');
  try {
    backgroundPixelShader = makePixelShader(backgroundPixelCode);
  } finally {
    blobRelease(backgroundPixelCode.blob);
  }
  const architectureVertexCode = compile(ARCHITECTURE_VERTEX_SHADER, 'main', 'vs_5_0');
  try {
    architectureVertexShader = makeVertexShader(architectureVertexCode);
  } finally {
    blobRelease(architectureVertexCode.blob);
  }
  const architecturePixelCode = compile(ARCHITECTURE_PIXEL_SHADER, 'main', 'ps_5_0');
  try {
    architecturePixelShader = makePixelShader(architecturePixelCode);
  } finally {
    blobRelease(architecturePixelCode.blob);
  }
  const compositePixelCode = compile(COMPOSITE_PIXEL_SHADER, 'main', 'ps_5_0');
  try {
    compositePixelShader = makePixelShader(compositePixelCode);
  } finally {
    blobRelease(compositePixelCode.blob);
  }

  while (!window.shouldClose()) {
    window.pump();
    const elapsedSeconds =
      sequenceDirectory !== undefined ? Math.max(0, frameIndex - sequenceWarmup) / sequenceFramesPerSecond : capturePath !== undefined && Number.isFinite(fixedCaptureTime) ? fixedCaptureTime : (performance.now() - startedAt) / 1_000;
    const durationReached = durationMilliseconds > 0 && performance.now() - startedAt >= durationMilliseconds;

    frameData.writeFloatLE(elapsedSeconds, 0);
    frameData.writeFloatLE(clientSize.w / clientSize.h, 4);
    frameData.writeFloatLE(clientSize.w, 8);
    frameData.writeFloatLE(clientSize.h, 12);
    updateConstantBuffer(frameConstants, frameData);

    setViewport(clientSize.w, clientSize.h);
    setRenderTargetsWithDepth([hdrTarget.rtv!], depth.dsv);
    clear(hdrTarget.rtv!, [0.0005, 0.0008, 0.0015, 1]);
    clearDepth(depth.dsv);
    setBlendState(0n);
    setDepthState(false, false);
    vsSet(fullscreenVertexShader, [frameConstants]);
    psSet(backgroundPixelShader, { cb: [frameConstants] });
    drawFullscreenTriangle();

    setDepthState(true, true);
    setCull('none');
    vsSet(architectureVertexShader, [frameConstants]);
    vsSetShaderResources([architectureBuffer.srv!]);
    psSet(architecturePixelShader, { cb: [frameConstants] });
    drawTriangles(architecture.masses.length * 36);

    setRenderTargets([gpu.backBufferRTV]);
    setDepthState(false, false);
    vsSet(fullscreenVertexShader, [frameConstants]);
    psSet(compositePixelShader, { cb: [frameConstants], samp: [sampler], srv: [hdrTarget.srv!] });
    drawFullscreenTriangle();
    psSet(compositePixelShader, { cb: [frameConstants], samp: [sampler], srv: [0n] });

    if (sequenceDirectory !== undefined && frameIndex >= sequenceWarmup && frameIndex < sequenceWarmup + sequenceFrames) {
      const sequenceIndex = frameIndex - sequenceWarmup;
      const stats = captureBackBuffer(gpu, sequenceDirectory + '/frame-' + sequenceIndex.toString().padStart(4, '0') + '.png');
      if (!stats.ok) throw new Error('Sequence capture failed: ' + stats.note);
    }

    const shouldCaptureStill = capturePath !== undefined && !captured && (frameIndex >= captureFrame || durationReached);
    if (shouldCaptureStill) {
      const stats = captureBackBuffer(gpu, capturePath);
      if (!stats.ok) throw new Error('Capture failed: ' + stats.note);
      console.log(formatGrid(stats));
      captured = true;
    }

    gpu.present(true);
    frameIndex += 1;
    if ((capturePath !== undefined && captured) || (sequenceDirectory !== undefined && frameIndex >= sequenceWarmup + sequenceFrames) || durationReached) break;
  }
} finally {
  if (gpu !== null) vsSetShaderResources([0n]);
  comRelease(sampler);
  comRelease(fullscreenVertexShader);
  comRelease(backgroundPixelShader);
  comRelease(architectureVertexShader);
  comRelease(architecturePixelShader);
  comRelease(compositePixelShader);
  comRelease(architectureBuffer?.srv ?? 0n);
  comRelease(architectureBuffer?.buffer ?? 0n);
  comRelease(hdrTarget?.srv ?? 0n);
  comRelease(hdrTarget?.rtv ?? 0n);
  comRelease(hdrTarget?.tex ?? 0n);
  comRelease(frameConstants);
  try {
    if (gpu !== null) {
      releaseDepth();
      destroyDevice();
    }
  } finally {
    window.destroy();
  }
}
