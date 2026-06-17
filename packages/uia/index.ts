import { execute } from './agent';
import { initialize, uninitialize } from './automation';
import { copy, paste, readClipboard, readClipboardFiles, readClipboardImage, writeClipboard, writeClipboardFiles, writeClipboardImage } from './clipboard';
import { dispatch } from './computer';
import { elementAt, listMonitors, postClickAt, scrollAt } from './coords';
import { diffTrees } from './diff';
import { attach, focused, fromPoint, launch, root } from './element';
import { listProcesses, waitForProcess, waitForWindow, waitForWindowGone, watchWindows } from './events';
import { waitForIdle } from './idle';
import { clickAt, isKeyDown, postKey, postText, sendKeys, setControlText, type } from './input';
import { locateOnScreen } from './match';
import { msaaTree } from './msaa';
import { ocrBitmap, ocrScreen, ocrWindow } from './ocr';
import { snapshot } from './refmap';
import { captureScreen, pixelColor, screenshotScreen } from './screen';
import { windowTree } from './spy';
import { serialize } from './tree';
import { captureWindowLive } from './wgc';
import { listWindows } from './window';

/** The Playwright-for-desktop facade: attach to a window, then find/waitFor/act/serialize. */
export const uia = {
  attach,
  captureScreen,
  captureWindowLive,
  click: clickAt,
  copy,
  diff: diffTrees,
  dispatch,
  elementAt,
  execute,
  focused,
  fromPoint,
  initialize,
  isKeyDown,
  launch,
  listMonitors,
  listProcesses,
  locateOnScreen,
  msaaTree,
  ocrBitmap,
  ocrScreen,
  ocrWindow,
  paste,
  pixelColor,
  postClick: postClickAt,
  postKey,
  postText,
  readClipboard,
  readClipboardFiles,
  readClipboardImage,
  root,
  screenshotScreen,
  scrollAt,
  sendKeys,
  setControlText,
  snapshot,
  tree: serialize,
  type,
  uninitialize,
  waitForIdle,
  waitForProcess,
  waitForWindow,
  waitForWindowGone,
  watchWindows,
  windowTree,
  windows: listWindows,
  writeClipboard,
  writeClipboardFiles,
  writeClipboardImage,
};

export { type AgentAction, type AgentActionResult, AGENT_TOOLS, execute, groundingTree, performAgentAction } from './agent';
export { automation, initialize, trueCondition, uninitialize } from './automation';
export { AutomationElementMode, CacheRequest, createCacheRequest, DEFAULT_CACHE_PROPERTIES } from './cache';
export { clipboardSequence, copy, paste, readClipboard, readClipboardFiles, readClipboardImage, writeClipboard, writeClipboardFiles, writeClipboardImage } from './clipboard';
export { comRelease, guid, hresult, vcall } from './com';
export { type ComputerAction, type ComputerResult, dispatch, type DispatchOptions, fromCuaAction, normalizeKey } from './computer';
export { type CompiledCondition, compileCondition, type ElementProperties, formatNoMatch, matches, needsSubtreeFilter, pickIndexed, selectorToString, type Selector } from './condition';
export { ControlType, PatternId, PropertyConditionFlags, PropertyId, SLOT, TreeScope } from './constants';
export {
  elementAt,
  listMonitors,
  type MonitorInfo,
  ownerHwnd,
  type PointDescription,
  postClickAt,
  postClickToHwnd,
  postDoubleClickAt,
  postDoubleClickToHwnd,
  postDragToHwnd,
  postTripleClickAt,
  postTripleClickToHwnd,
  scrollAt,
  virtualScreen,
  windowAt,
} from './coords';
export { windowDesktopId, windowOnCurrentDesktop } from './desktop';
export { type DiffNode, diffTrees, refsRenumbered, type RenameChange, renderDiff, type StateChange, type TreeChange, type TreeDiff } from './diff';
export { attach, Element, focused, fromHandle, fromPoint, launch, root, type StateExpectation, Window } from './element';
export { listProcesses, waitForProcess, waitForWindow, waitForWindowGone, watchWindows, type WindowEvent, type WindowEventType, type WindowMatch, type WindowWatcher } from './events';
export { type IdleOptions, waitForIdle } from './idle';
export { isJavaWindow, javaInvoke, type JavaNode, javaSetText, type JavaTarget, javaTree, renderJavaTree } from './jab';
export {
  clickAt,
  copyFromControl,
  cursorPosition,
  cutFromControl,
  doubleClickAt,
  dragTo,
  holdKey,
  INPUT_SIZE,
  isKeyDown,
  keyDown,
  keyUp,
  middleClickAt,
  mouseDown,
  mouseUp,
  moveTo,
  packKeyboardInput,
  packMouseInput,
  pasteToControl,
  postHWheel,
  postHoldKey,
  postKey,
  postText,
  postWheel,
  rightClickAt,
  scrollWheel,
  selectAllInControl,
  sendKeys,
  setControlText,
  type,
  undoControl,
  virtualKeyCode,
} from './input';
export { drawMarks, type MarkedScreenshot, type PlacedMark, screenshotWithMarks } from './marks';
export { findAllImages, findImage, locateAllOnScreen, locateColor, locateOnScreen, type Match } from './match';
export { accessibleFromWindow, type MsaaNode, msaaTree } from './msaa';
export { disposeOcr, ocrAvailable, ocrBitmap, ocrScreen, type OcrLine, type OcrText, ocrWindow, type OcrWord } from './ocr';
export { ExpandCollapseState, gridItemPosition, NoScroll, ScrollAmount, type ScrollInfo, type TableData, ToggleState, type ViewState, WindowVisualState } from './patterns';
export { encodePNG } from './png';
export { decodeBstr, getBstr, getCachedPropertyValue, getHandle, getLong, getPropertyValue, getRect, type Rect, type VariantValue } from './reads';
export { capSnapshot, coldTreeNote, type Mark, pruneRefTree, type RefNode, renderSnapshot, snapshot, Snapshot } from './refmap';
export { type AuditRecord, redactTree, safeExecute, type SafeOptions, toToolResult } from './safety';
export { type Bitmap, captureScreen, pixelColor, screenshotScreen } from './screen';
export { type NativeWindow, renderWindowTree, windowStyles, windowTree } from './spy';
export { countNodes, estimateTokens, serialize, type SerializeOptions, type UiaNode } from './tree';
export { captureWindowLive, dispose as disposeWgc, wgcAvailable } from './wgc';
export {
  captureWindowRGB,
  cloakReason,
  closeWindow,
  findWindow,
  foregroundWindow,
  inputDesktopName,
  integrityLevel,
  isMaximized,
  isMinimized,
  isSecureDesktopActive,
  isWindow,
  isWindowVisible,
  listWindows,
  maximizeWindow,
  minimizeWindow,
  moveWindow,
  openPath,
  ownedForegroundDialog,
  ownedModalDialog,
  processImagePath,
  raiseWindow,
  restoreWindow,
  screenshot,
  snapWindow,
  type WindowCapture,
  type WindowInfo,
  windowForProcess,
  windowProcessId,
} from './window';
