import { initialize, uninitialize } from './automation';
import { attach, focused, fromPoint, root } from './element';
import { clickAt, sendKeys, type } from './input';
import { msaaTree } from './msaa';
import { serialize } from './tree';
import { listWindows } from './window';

/** The Playwright-for-desktop facade: attach to a window, then find/waitFor/act/serialize. */
export const uia = {
  attach,
  click: clickAt,
  focused,
  fromPoint,
  initialize,
  msaaTree,
  root,
  sendKeys,
  tree: serialize,
  type,
  uninitialize,
  windows: listWindows,
};

export { automation, initialize, uninitialize } from './automation';
export { AutomationElementMode, CacheRequest, createCacheRequest, DEFAULT_CACHE_PROPERTIES } from './cache';
export { comRelease, guid, hresult, vcall } from './com';
export { type ElementProperties, formatNoMatch, matches, selectorToString, type Selector } from './condition';
export { ControlType, PatternId, PropertyConditionFlags, PropertyId, SLOT, TreeScope } from './constants';
export { attach, Element, focused, fromHandle, fromPoint, root, Window } from './element';
export { clickAt, INPUT_SIZE, packKeyboardInput, packMouseInput, sendKeys, type, virtualKeyCode } from './input';
export { accessibleFromWindow, type MsaaNode, msaaTree } from './msaa';
export { ExpandCollapseState, ToggleState, WindowVisualState } from './patterns';
export { encodePNG } from './png';
export { decodeBstr, getBstr, getHandle, getLong, getRect, type Rect } from './reads';
export { countNodes, estimateTokens, serialize, type SerializeOptions, type UiaNode } from './tree';
export { findWindow, listWindows, screenshot, type WindowInfo, windowForProcess } from './window';
