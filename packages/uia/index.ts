import { execute } from './agent';
import { initialize, uninitialize } from './automation';
import { elementAt, postClickAt } from './coords';
import { diffTrees } from './diff';
import { attach, focused, fromPoint, launch, root } from './element';
import { waitForIdle } from './idle';
import { clickAt, sendKeys, type } from './input';
import { locateOnScreen } from './match';
import { msaaTree } from './msaa';
import { snapshot } from './refmap';
import { captureScreen, pixelColor, screenshotScreen } from './screen';
import { windowTree } from './spy';
import { serialize } from './tree';
import { listWindows } from './window';

/** The Playwright-for-desktop facade: attach to a window, then find/waitFor/act/serialize. */
export const uia = {
  attach,
  captureScreen,
  click: clickAt,
  diff: diffTrees,
  elementAt,
  execute,
  focused,
  fromPoint,
  initialize,
  launch,
  locateOnScreen,
  msaaTree,
  pixelColor,
  postClick: postClickAt,
  root,
  screenshotScreen,
  sendKeys,
  snapshot,
  tree: serialize,
  type,
  uninitialize,
  waitForIdle,
  windowTree,
  windows: listWindows,
};

export { type AgentAction, type AgentActionResult, AGENT_TOOLS, execute, groundingTree } from './agent';
export { automation, initialize, uninitialize } from './automation';
export { AutomationElementMode, CacheRequest, createCacheRequest, DEFAULT_CACHE_PROPERTIES } from './cache';
export { comRelease, guid, hresult, vcall } from './com';
export { type ComputerAction, type ComputerResult, dispatch, type DispatchOptions, fromCuaAction, normalizeKey } from './computer';
export { type ElementProperties, formatNoMatch, matches, selectorToString, type Selector } from './condition';
export { ControlType, PatternId, PropertyConditionFlags, PropertyId, SLOT, TreeScope } from './constants';
export { elementAt, type PointDescription, postClickAt, virtualScreen, windowAt } from './coords';
export { diffTrees, type RenameChange, type TreeChange, type TreeDiff } from './diff';
export { attach, Element, focused, fromHandle, fromPoint, launch, root, Window } from './element';
export { type IdleOptions, waitForIdle } from './idle';
export {
  clickAt,
  cursorPosition,
  doubleClickAt,
  dragTo,
  holdKey,
  INPUT_SIZE,
  keyDown,
  keyUp,
  middleClickAt,
  mouseDown,
  mouseUp,
  moveTo,
  packKeyboardInput,
  packMouseInput,
  rightClickAt,
  scrollWheel,
  sendKeys,
  type,
  virtualKeyCode,
} from './input';
export { drawMarks, type MarkedScreenshot, type PlacedMark, screenshotWithMarks } from './marks';
export { findImage, locateOnScreen, type Match } from './match';
export { accessibleFromWindow, type MsaaNode, msaaTree } from './msaa';
export { ExpandCollapseState, ToggleState, WindowVisualState } from './patterns';
export { encodePNG } from './png';
export { decodeBstr, getBstr, getHandle, getLong, getRect, type Rect } from './reads';
export { type Mark, type RefNode, renderSnapshot, snapshot, Snapshot } from './refmap';
export { type AuditRecord, redactTree, safeExecute, type SafeOptions, toToolResult } from './safety';
export { type Bitmap, captureScreen, pixelColor, screenshotScreen } from './screen';
export { type NativeWindow, renderWindowTree, windowStyles, windowTree } from './spy';
export { countNodes, estimateTokens, serialize, type SerializeOptions, type UiaNode } from './tree';
export { captureWindowRGB, findWindow, listWindows, screenshot, type WindowCapture, type WindowInfo, windowForProcess } from './window';
