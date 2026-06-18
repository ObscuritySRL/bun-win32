import { execute } from './agent/agent';
import { initialize, uninitialize } from './com/automation';
import { copy, paste, readClipboard, readClipboardFiles, readClipboardImage, writeClipboard, writeClipboardFiles, writeClipboardImage } from './agent/clipboard';
import { dispatch } from './input/computer';
import { elementAt, listMonitors, postClickAt, scrollAt } from './input/coords';
import { diffTrees } from './element/diff';
import { attach, focused, fromPoint, launch, root } from './element/element';
import { listProcesses, waitForProcess, waitForWindow, waitForWindowGone, watchWindows } from './desktop/events';
import { waitForIdle } from './desktop/idle';
import { clickAt, isKeyDown, postKey, postText, sendKeys, setControlText, type } from './input/input';
import { locateOnScreen } from './capture/match';
import { msaaTree } from './element/msaa';
import { ocrBitmap, ocrScreen, ocrWindow } from './capture/ocr';
import { snapshot } from './element/refmap';
import { captureScreen, pixelColor, screenshotScreen } from './capture/screen';
import { windowTree } from './desktop/spy';
import { serialize } from './element/tree';
import { captureWindowLive } from './capture/wgc';
import { listWindows } from './element/window';

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

export { type AgentAction, type AgentActionResult, AGENT_TOOLS, execute, groundingTree, performAgentAction } from './agent/agent';
export { automation, initialize, trueCondition, uninitialize } from './com/automation';
export { AutomationElementMode, CacheRequest, createCacheRequest, DEFAULT_CACHE_PROPERTIES } from './com/cache';
export { clipboardSequence, copy, paste, readClipboard, readClipboardFiles, readClipboardImage, writeClipboard, writeClipboardFiles, writeClipboardImage } from './agent/clipboard';
export { comRelease, guid, hresult, vcall } from './com/com';
export { type ComputerAction, type ComputerResult, dispatch, type DispatchOptions, fromCuaAction, normalizeKey } from './input/computer';
export { type CompiledCondition, compileCondition, type ElementProperties, formatNoMatch, matches, needsSubtreeFilter, pickIndexed, selectorToString, type Selector } from './element/condition';
export { ControlType, PatternId, PropertyConditionFlags, PropertyId, SLOT, TreeScope } from './com/constants';
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
} from './input/coords';
export { windowDesktopId, windowOnCurrentDesktop } from './desktop/desktop';
export { type DiffNode, diffTrees, refsRenumbered, type RenameChange, renderDiff, type StateChange, type TreeChange, type TreeDiff } from './element/diff';
export { attach, Element, focused, fromHandle, fromPoint, launch, root, type StateExpectation, Window } from './element/element';
export { listProcesses, waitForProcess, waitForWindow, waitForWindowGone, watchWindows, type WindowEvent, type WindowEventType, type WindowMatch, type WindowWatcher } from './desktop/events';
export { type IdleOptions, waitForIdle } from './desktop/idle';
export { isJavaWindow, javaInvoke, type JavaNode, javaSetText, type JavaTarget, javaTree, renderJavaTree } from './element/jab';
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
  postButtonClick,
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
} from './input/input';
export { drawMarks, type MarkedScreenshot, type PlacedMark, screenshotWithMarks } from './capture/marks';
export { findAllImages, findImage, locateAllOnScreen, locateColor, locateOnScreen, type Match } from './capture/match';
export { accessibleFromWindow, type MsaaNode, msaaTree } from './element/msaa';
export { disposeOcr, ocrAvailable, ocrBitmap, ocrScreen, type OcrLine, type OcrText, ocrWindow, type OcrWord } from './capture/ocr';
export { ExpandCollapseState, gridItemPosition, NoScroll, ScrollAmount, type ScrollInfo, type TableData, ToggleState, type ViewState, WindowVisualState } from './element/patterns';
export { encodePNG } from './capture/png';
export { decodeBstr, getBstr, getCachedPropertyValue, getHandle, getLong, getPropertyValue, getRect, type Rect, type VariantValue } from './com/reads';
export { capSnapshot, coldTreeNote, type Mark, pruneRefTree, type RefNode, renderSnapshot, snapshot, Snapshot } from './element/refmap';
export { type AuditRecord, redactTree, safeExecute, type SafeOptions, toToolResult } from './agent/safety';
export { type Bitmap, captureScreen, cropBitmap, pixelColor, screenshotScreen } from './capture/screen';
export { type NativeWindow, renderWindowTree, windowStyles, windowTree } from './desktop/spy';
export { countNodes, estimateTokens, serialize, type SerializeOptions, type UiaNode } from './element/tree';
export { captureWindowLive, dispose as disposeWgc, wgcAvailable } from './capture/wgc';
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
} from './element/window';
