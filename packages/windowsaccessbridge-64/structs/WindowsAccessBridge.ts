import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  AccessBridge_CaretUpdateFP,
  AccessBridge_FocusGainedFP,
  AccessBridge_FocusLostFP,
  AccessBridge_JavaShutdownFP,
  AccessBridge_MenuCanceledFP,
  AccessBridge_MenuDeselectedFP,
  AccessBridge_MenuSelectedFP,
  AccessBridge_MouseClickedFP,
  AccessBridge_MouseEnteredFP,
  AccessBridge_MouseExitedFP,
  AccessBridge_MousePressedFP,
  AccessBridge_MouseReleasedFP,
  AccessBridge_PopupMenuCanceledFP,
  AccessBridge_PopupMenuWillBecomeInvisibleFP,
  AccessBridge_PopupMenuWillBecomeVisibleFP,
  AccessBridge_PropertyActiveDescendentChangeFP,
  AccessBridge_PropertyCaretChangeFP,
  AccessBridge_PropertyChangeFP,
  AccessBridge_PropertyChildChangeFP,
  AccessBridge_PropertyDescriptionChangeFP,
  AccessBridge_PropertyNameChangeFP,
  AccessBridge_PropertySelectionChangeFP,
  AccessBridge_PropertyStateChangeFP,
  AccessBridge_PropertyTableModelChangeFP,
  AccessBridge_PropertyTextChangeFP,
  AccessBridge_PropertyValueChangeFP,
  AccessBridge_PropertyVisibleDataChangeFP,
  AccessibleContext,
  AccessibleHyperlink,
  AccessibleHypertext,
  AccessibleSelection,
  AccessibleTable,
  AccessibleText,
  AccessibleValue,
  BOOL,
  HWND,
  INT,
  JINT,
  JOBJECT64,
  Java_Object,
  LONG,
  LPCWSTR,
  LPWSTR,
  PAccessBridgeVersionInfo,
  PAccessibleActions,
  PAccessibleActionsToDo,
  PAccessibleContext,
  PAccessibleContextInfo,
  PAccessibleHyperlinkInfo,
  PAccessibleHypertextInfo,
  PAccessibleIcons,
  PAccessibleKeyBindings,
  PAccessibleRelationSetInfo,
  PAccessibleTableCellInfo,
  PAccessibleTableInfo,
  PAccessibleTextAttributesInfo,
  PAccessibleTextInfo,
  PAccessibleTextItemsInfo,
  PAccessibleTextRectInfo,
  PAccessibleTextSelectionInfo,
  PJINT,
  PLONG,
  PSHORT,
  PVisibleChildrenInfo,
  SHORT,
} from '../types/WindowsAccessBridge';

/**
 * Thin, lazy-loaded FFI bindings for the Java Access Bridge (`WindowsAccessBridge-64.dll`).
 *
 * Each static method corresponds one-to-one with an export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Signatures follow the OpenJDK `AccessBridgeCalls.h` / `AccessBridgePackages.h` headers
 * (the `WindowsAccessBridge-64.dll` exports use the lower-camelCase internal names).
 * The 64-bit bridge defines `JOBJECT64` as `jlong`, so every `AccessibleContext` and
 * related object token is an opaque 64-bit value (`bigint`), never dereferenced locally.
 *
 * Runtime note: `Windows_run` must be called once to initialize the bridge, and most
 * query functions round-trip to a live JVM via Windows messages — they require a running
 * Java application (with the Access Bridge enabled) and a message pump to return data.
 *
 * @example
 * ```ts
 * import WindowsAccessBridge from './structs/WindowsAccessBridge';
 *
 * WindowsAccessBridge.Windows_run();
 * const isJava = WindowsAccessBridge.isJavaWindow(hWnd);
 * ```
 */
class WindowsAccessBridge extends Win32 {
  protected static override name = 'WindowsAccessBridge-64.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    Windows_run: { args: [], returns: FFIType.void },
    activateAccessibleHyperlink: { args: [FFIType.i32, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    addAccessibleSelectionFromContext: { args: [FFIType.i32, FFIType.u64, FFIType.i32], returns: FFIType.void },
    clearAccessibleSelectionFromContext: { args: [FFIType.i32, FFIType.u64], returns: FFIType.void },
    doAccessibleActions: { args: [FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleActions: { args: [FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleChildFromContext: { args: [FFIType.i32, FFIType.u64, FFIType.i32], returns: FFIType.u64 },
    getAccessibleContextAt: { args: [FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleContextFromHWND: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleContextInfo: { args: [FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleContextWithFocus: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleHyperlink: { args: [FFIType.i32, FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleHyperlinkCount: { args: [FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    getAccessibleHypertext: { args: [FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleHypertextExt: { args: [FFIType.i32, FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleHypertextLinkIndex: { args: [FFIType.i32, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    getAccessibleIcons: { args: [FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleKeyBindings: { args: [FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleParentFromContext: { args: [FFIType.i32, FFIType.u64], returns: FFIType.u64 },
    getAccessibleRelationSet: { args: [FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleSelectionCountFromContext: { args: [FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    getAccessibleSelectionFromContext: { args: [FFIType.i32, FFIType.u64, FFIType.i32], returns: FFIType.u64 },
    getAccessibleTableCellInfo: { args: [FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleTableColumn: { args: [FFIType.i32, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    getAccessibleTableColumnDescription: { args: [FFIType.i32, FFIType.u64, FFIType.i32], returns: FFIType.u64 },
    getAccessibleTableColumnHeader: { args: [FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleTableColumnSelectionCount: { args: [FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    getAccessibleTableColumnSelections: { args: [FFIType.i32, FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleTableIndex: { args: [FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    getAccessibleTableInfo: { args: [FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleTableRow: { args: [FFIType.i32, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    getAccessibleTableRowDescription: { args: [FFIType.i32, FFIType.u64, FFIType.i32], returns: FFIType.u64 },
    getAccessibleTableRowHeader: { args: [FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleTableRowSelectionCount: { args: [FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    getAccessibleTableRowSelections: { args: [FFIType.i32, FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleTextAttributes: { args: [FFIType.i32, FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleTextInfo: { args: [FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    getAccessibleTextItems: { args: [FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    getAccessibleTextLineBounds: { args: [FFIType.i32, FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleTextRange: { args: [FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i16], returns: FFIType.i32 },
    getAccessibleTextRect: { args: [FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    getAccessibleTextSelectionInfo: { args: [FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    getActiveDescendent: { args: [FFIType.i32, FFIType.u64], returns: FFIType.u64 },
    getCaretLocation: { args: [FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    getCurrentAccessibleValueFromContext: { args: [FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.i16], returns: FFIType.i32 },
    getEventsWaiting: { args: [], returns: FFIType.i32 },
    getHWNDFromAccessibleContext: { args: [FFIType.i32, FFIType.u64], returns: FFIType.u64 },
    getMaximumAccessibleValueFromContext: { args: [FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.i16], returns: FFIType.i32 },
    getMinimumAccessibleValueFromContext: { args: [FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.i16], returns: FFIType.i32 },
    getObjectDepth: { args: [FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    getParentWithRole: { args: [FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    getParentWithRoleElseRoot: { args: [FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    getTextAttributesInRange: { args: [FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    getTopLevelObject: { args: [FFIType.i32, FFIType.u64], returns: FFIType.u64 },
    getVersionInfo: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    getVirtualAccessibleName: { args: [FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    getVisibleChildren: { args: [FFIType.i32, FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    getVisibleChildrenCount: { args: [FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    isAccessibleChildSelectedFromContext: { args: [FFIType.i32, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    isAccessibleTableColumnSelected: { args: [FFIType.i32, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    isAccessibleTableRowSelected: { args: [FFIType.i32, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    isJavaWindow: { args: [FFIType.u64], returns: FFIType.i32 },
    isSameObject: { args: [FFIType.i32, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    releaseJavaObject: { args: [FFIType.i32, FFIType.u64], returns: FFIType.void },
    removeAccessibleSelectionFromContext: { args: [FFIType.i32, FFIType.u64, FFIType.i32], returns: FFIType.void },
    requestFocus: { args: [FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    selectAllAccessibleSelectionFromContext: { args: [FFIType.i32, FFIType.u64], returns: FFIType.void },
    selectTextRange: { args: [FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    setCaretPosition: { args: [FFIType.i32, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    setCaretUpdateFP: { args: [FFIType.ptr], returns: FFIType.void },
    setFocusGainedFP: { args: [FFIType.ptr], returns: FFIType.void },
    setFocusLostFP: { args: [FFIType.ptr], returns: FFIType.void },
    setJavaShutdownFP: { args: [FFIType.ptr], returns: FFIType.void },
    setMenuCanceledFP: { args: [FFIType.ptr], returns: FFIType.void },
    setMenuDeselectedFP: { args: [FFIType.ptr], returns: FFIType.void },
    setMenuSelectedFP: { args: [FFIType.ptr], returns: FFIType.void },
    setMouseClickedFP: { args: [FFIType.ptr], returns: FFIType.void },
    setMouseEnteredFP: { args: [FFIType.ptr], returns: FFIType.void },
    setMouseExitedFP: { args: [FFIType.ptr], returns: FFIType.void },
    setMousePressedFP: { args: [FFIType.ptr], returns: FFIType.void },
    setMouseReleasedFP: { args: [FFIType.ptr], returns: FFIType.void },
    setPopupMenuCanceledFP: { args: [FFIType.ptr], returns: FFIType.void },
    setPopupMenuWillBecomeInvisibleFP: { args: [FFIType.ptr], returns: FFIType.void },
    setPopupMenuWillBecomeVisibleFP: { args: [FFIType.ptr], returns: FFIType.void },
    setPropertyActiveDescendentChangeFP: { args: [FFIType.ptr], returns: FFIType.void },
    setPropertyCaretChangeFP: { args: [FFIType.ptr], returns: FFIType.void },
    setPropertyChangeFP: { args: [FFIType.ptr], returns: FFIType.void },
    setPropertyChildChangeFP: { args: [FFIType.ptr], returns: FFIType.void },
    setPropertyDescriptionChangeFP: { args: [FFIType.ptr], returns: FFIType.void },
    setPropertyNameChangeFP: { args: [FFIType.ptr], returns: FFIType.void },
    setPropertySelectionChangeFP: { args: [FFIType.ptr], returns: FFIType.void },
    setPropertyStateChangeFP: { args: [FFIType.ptr], returns: FFIType.void },
    setPropertyTableModelChangeFP: { args: [FFIType.ptr], returns: FFIType.void },
    setPropertyTextChangeFP: { args: [FFIType.ptr], returns: FFIType.void },
    setPropertyValueChangeFP: { args: [FFIType.ptr], returns: FFIType.void },
    setPropertyVisibleDataChangeFP: { args: [FFIType.ptr], returns: FFIType.void },
    setTextContents: { args: [FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static Windows_run(): void {
    return WindowsAccessBridge.Load('Windows_run')();
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static activateAccessibleHyperlink(vmID: LONG, accessibleContext: AccessibleContext, accessibleHyperlink: AccessibleHyperlink): BOOL {
    return WindowsAccessBridge.Load('activateAccessibleHyperlink')(vmID, accessibleContext, accessibleHyperlink);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static addAccessibleSelectionFromContext(vmID: LONG, as: AccessibleSelection, i: INT): void {
    return WindowsAccessBridge.Load('addAccessibleSelectionFromContext')(vmID, as, i);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static clearAccessibleSelectionFromContext(vmID: LONG, as: AccessibleSelection): void {
    return WindowsAccessBridge.Load('clearAccessibleSelectionFromContext')(vmID, as);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static doAccessibleActions(vmID: LONG, accessibleContext: AccessibleContext, actionsToDo: PAccessibleActionsToDo, failure: PJINT): BOOL {
    return WindowsAccessBridge.Load('doAccessibleActions')(vmID, accessibleContext, actionsToDo, failure);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleActions(vmID: LONG, accessibleContext: AccessibleContext, actions: PAccessibleActions): BOOL {
    return WindowsAccessBridge.Load('getAccessibleActions')(vmID, accessibleContext, actions);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleChildFromContext(vmID: LONG, ac: AccessibleContext, index: JINT): AccessibleContext {
    return WindowsAccessBridge.Load('getAccessibleChildFromContext')(vmID, ac, index);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleContextAt(vmID: LONG, acParent: AccessibleContext, x: JINT, y: JINT, ac: PAccessibleContext): BOOL {
    return WindowsAccessBridge.Load('getAccessibleContextAt')(vmID, acParent, x, y, ac);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleContextFromHWND(target: HWND, vmID: PLONG, ac: PAccessibleContext): BOOL {
    return WindowsAccessBridge.Load('getAccessibleContextFromHWND')(target, vmID, ac);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleContextInfo(vmID: LONG, ac: AccessibleContext, info: PAccessibleContextInfo): BOOL {
    return WindowsAccessBridge.Load('getAccessibleContextInfo')(vmID, ac, info);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleContextWithFocus(window: HWND, vmID: PLONG, ac: PAccessibleContext): BOOL {
    return WindowsAccessBridge.Load('getAccessibleContextWithFocus')(window, vmID, ac);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleHyperlink(vmID: LONG, hypertext: AccessibleHypertext, nIndex: JINT, hyperlinkInfo: PAccessibleHyperlinkInfo): BOOL {
    return WindowsAccessBridge.Load('getAccessibleHyperlink')(vmID, hypertext, nIndex, hyperlinkInfo);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleHyperlinkCount(vmID: LONG, hypertext: AccessibleHypertext): JINT {
    return WindowsAccessBridge.Load('getAccessibleHyperlinkCount')(vmID, hypertext);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleHypertext(vmID: LONG, accessibleContext: AccessibleContext, hypertextInfo: PAccessibleHypertextInfo): BOOL {
    return WindowsAccessBridge.Load('getAccessibleHypertext')(vmID, accessibleContext, hypertextInfo);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleHypertextExt(vmID: LONG, accessibleContext: AccessibleContext, nStartIndex: JINT, hypertextInfo: PAccessibleHypertextInfo): BOOL {
    return WindowsAccessBridge.Load('getAccessibleHypertextExt')(vmID, accessibleContext, nStartIndex, hypertextInfo);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleHypertextLinkIndex(vmID: LONG, hypertext: AccessibleHypertext, nIndex: JINT): JINT {
    return WindowsAccessBridge.Load('getAccessibleHypertextLinkIndex')(vmID, hypertext, nIndex);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleIcons(vmID: LONG, accessibleContext: AccessibleContext, icons: PAccessibleIcons): BOOL {
    return WindowsAccessBridge.Load('getAccessibleIcons')(vmID, accessibleContext, icons);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleKeyBindings(vmID: LONG, accessibleContext: AccessibleContext, keyBindings: PAccessibleKeyBindings): BOOL {
    return WindowsAccessBridge.Load('getAccessibleKeyBindings')(vmID, accessibleContext, keyBindings);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleParentFromContext(vmID: LONG, ac: AccessibleContext): AccessibleContext {
    return WindowsAccessBridge.Load('getAccessibleParentFromContext')(vmID, ac);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleRelationSet(vmID: LONG, accessibleContext: AccessibleContext, relationSetInfo: PAccessibleRelationSetInfo): BOOL {
    return WindowsAccessBridge.Load('getAccessibleRelationSet')(vmID, accessibleContext, relationSetInfo);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleSelectionCountFromContext(vmID: LONG, as: AccessibleSelection): INT {
    return WindowsAccessBridge.Load('getAccessibleSelectionCountFromContext')(vmID, as);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleSelectionFromContext(vmID: LONG, as: AccessibleSelection, i: INT): JOBJECT64 {
    return WindowsAccessBridge.Load('getAccessibleSelectionFromContext')(vmID, as, i);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTableCellInfo(vmID: LONG, accessibleTable: AccessibleTable, row: JINT, column: JINT, tableCellInfo: PAccessibleTableCellInfo): BOOL {
    return WindowsAccessBridge.Load('getAccessibleTableCellInfo')(vmID, accessibleTable, row, column, tableCellInfo);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTableColumn(vmID: LONG, table: AccessibleTable, index: JINT): JINT {
    return WindowsAccessBridge.Load('getAccessibleTableColumn')(vmID, table, index);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTableColumnDescription(vmID: LONG, acParent: AccessibleContext, column: JINT): AccessibleContext {
    return WindowsAccessBridge.Load('getAccessibleTableColumnDescription')(vmID, acParent, column);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTableColumnHeader(vmID: LONG, acParent: AccessibleContext, tableInfo: PAccessibleTableInfo): BOOL {
    return WindowsAccessBridge.Load('getAccessibleTableColumnHeader')(vmID, acParent, tableInfo);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTableColumnSelectionCount(vmID: LONG, table: AccessibleTable): JINT {
    return WindowsAccessBridge.Load('getAccessibleTableColumnSelectionCount')(vmID, table);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTableColumnSelections(vmID: LONG, table: AccessibleTable, count: JINT, selections: PJINT): BOOL {
    return WindowsAccessBridge.Load('getAccessibleTableColumnSelections')(vmID, table, count, selections);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTableIndex(vmID: LONG, table: AccessibleTable, row: JINT, column: JINT): JINT {
    return WindowsAccessBridge.Load('getAccessibleTableIndex')(vmID, table, row, column);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTableInfo(vmID: LONG, acParent: AccessibleContext, tableInfo: PAccessibleTableInfo): BOOL {
    return WindowsAccessBridge.Load('getAccessibleTableInfo')(vmID, acParent, tableInfo);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTableRow(vmID: LONG, table: AccessibleTable, index: JINT): JINT {
    return WindowsAccessBridge.Load('getAccessibleTableRow')(vmID, table, index);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTableRowDescription(vmID: LONG, acParent: AccessibleContext, row: JINT): AccessibleContext {
    return WindowsAccessBridge.Load('getAccessibleTableRowDescription')(vmID, acParent, row);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTableRowHeader(vmID: LONG, acParent: AccessibleContext, tableInfo: PAccessibleTableInfo): BOOL {
    return WindowsAccessBridge.Load('getAccessibleTableRowHeader')(vmID, acParent, tableInfo);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTableRowSelectionCount(vmID: LONG, table: AccessibleTable): JINT {
    return WindowsAccessBridge.Load('getAccessibleTableRowSelectionCount')(vmID, table);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTableRowSelections(vmID: LONG, table: AccessibleTable, count: JINT, selections: PJINT): BOOL {
    return WindowsAccessBridge.Load('getAccessibleTableRowSelections')(vmID, table, count, selections);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTextAttributes(vmID: LONG, at: AccessibleText, index: JINT, attributes: PAccessibleTextAttributesInfo): BOOL {
    return WindowsAccessBridge.Load('getAccessibleTextAttributes')(vmID, at, index, attributes);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTextInfo(vmID: LONG, at: AccessibleText, textInfo: PAccessibleTextInfo, x: JINT, y: JINT): BOOL {
    return WindowsAccessBridge.Load('getAccessibleTextInfo')(vmID, at, textInfo, x, y);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTextItems(vmID: LONG, at: AccessibleText, textItems: PAccessibleTextItemsInfo, index: JINT): BOOL {
    return WindowsAccessBridge.Load('getAccessibleTextItems')(vmID, at, textItems, index);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTextLineBounds(vmID: LONG, at: AccessibleText, index: JINT, startIndex: PJINT, endIndex: PJINT): BOOL {
    return WindowsAccessBridge.Load('getAccessibleTextLineBounds')(vmID, at, index, startIndex, endIndex);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTextRange(vmID: LONG, at: AccessibleText, start: JINT, end: JINT, text: LPWSTR, len: SHORT): BOOL {
    return WindowsAccessBridge.Load('getAccessibleTextRange')(vmID, at, start, end, text, len);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTextRect(vmID: LONG, at: AccessibleText, rectInfo: PAccessibleTextRectInfo, index: JINT): BOOL {
    return WindowsAccessBridge.Load('getAccessibleTextRect')(vmID, at, rectInfo, index);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getAccessibleTextSelectionInfo(vmID: LONG, at: AccessibleText, textSelection: PAccessibleTextSelectionInfo): BOOL {
    return WindowsAccessBridge.Load('getAccessibleTextSelectionInfo')(vmID, at, textSelection);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getActiveDescendent(vmID: LONG, accessibleContext: AccessibleContext): AccessibleContext {
    return WindowsAccessBridge.Load('getActiveDescendent')(vmID, accessibleContext);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getCaretLocation(vmID: LONG, ac: AccessibleContext, rectInfo: PAccessibleTextRectInfo, index: JINT): BOOL {
    return WindowsAccessBridge.Load('getCaretLocation')(vmID, ac, rectInfo, index);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getCurrentAccessibleValueFromContext(vmID: LONG, av: AccessibleValue, value: LPWSTR, len: SHORT): BOOL {
    return WindowsAccessBridge.Load('getCurrentAccessibleValueFromContext')(vmID, av, value, len);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getEventsWaiting(): INT {
    return WindowsAccessBridge.Load('getEventsWaiting')();
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getHWNDFromAccessibleContext(vmID: LONG, ac: AccessibleContext): HWND {
    return WindowsAccessBridge.Load('getHWNDFromAccessibleContext')(vmID, ac);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getMaximumAccessibleValueFromContext(vmID: LONG, av: AccessibleValue, value: LPWSTR, len: SHORT): BOOL {
    return WindowsAccessBridge.Load('getMaximumAccessibleValueFromContext')(vmID, av, value, len);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getMinimumAccessibleValueFromContext(vmID: LONG, av: AccessibleValue, value: LPWSTR, len: SHORT): BOOL {
    return WindowsAccessBridge.Load('getMinimumAccessibleValueFromContext')(vmID, av, value, len);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getObjectDepth(vmID: LONG, accessibleContext: AccessibleContext): INT {
    return WindowsAccessBridge.Load('getObjectDepth')(vmID, accessibleContext);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getParentWithRole(vmID: LONG, accessibleContext: AccessibleContext, role: LPCWSTR): AccessibleContext {
    return WindowsAccessBridge.Load('getParentWithRole')(vmID, accessibleContext, role);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getParentWithRoleElseRoot(vmID: LONG, accessibleContext: AccessibleContext, role: LPCWSTR): AccessibleContext {
    return WindowsAccessBridge.Load('getParentWithRoleElseRoot')(vmID, accessibleContext, role);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getTextAttributesInRange(vmID: LONG, accessibleContext: AccessibleContext, startIndex: INT, endIndex: INT, attributes: PAccessibleTextAttributesInfo, len: PSHORT): BOOL {
    return WindowsAccessBridge.Load('getTextAttributesInRange')(vmID, accessibleContext, startIndex, endIndex, attributes, len);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getTopLevelObject(vmID: LONG, accessibleContext: AccessibleContext): AccessibleContext {
    return WindowsAccessBridge.Load('getTopLevelObject')(vmID, accessibleContext);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getVersionInfo(vmID: LONG, info: PAccessBridgeVersionInfo): BOOL {
    return WindowsAccessBridge.Load('getVersionInfo')(vmID, info);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getVirtualAccessibleName(vmID: LONG, accessibleContext: AccessibleContext, name: LPWSTR, len: INT): BOOL {
    return WindowsAccessBridge.Load('getVirtualAccessibleName')(vmID, accessibleContext, name, len);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getVisibleChildren(vmID: LONG, accessibleContext: AccessibleContext, startIndex: INT, visibleChildrenInfo: PVisibleChildrenInfo): BOOL {
    return WindowsAccessBridge.Load('getVisibleChildren')(vmID, accessibleContext, startIndex, visibleChildrenInfo);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static getVisibleChildrenCount(vmID: LONG, accessibleContext: AccessibleContext): INT {
    return WindowsAccessBridge.Load('getVisibleChildrenCount')(vmID, accessibleContext);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static isAccessibleChildSelectedFromContext(vmID: LONG, as: AccessibleSelection, i: INT): BOOL {
    return WindowsAccessBridge.Load('isAccessibleChildSelectedFromContext')(vmID, as, i);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static isAccessibleTableColumnSelected(vmID: LONG, table: AccessibleTable, column: JINT): BOOL {
    return WindowsAccessBridge.Load('isAccessibleTableColumnSelected')(vmID, table, column);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static isAccessibleTableRowSelected(vmID: LONG, table: AccessibleTable, row: JINT): BOOL {
    return WindowsAccessBridge.Load('isAccessibleTableRowSelected')(vmID, table, row);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static isJavaWindow(window: HWND): BOOL {
    return WindowsAccessBridge.Load('isJavaWindow')(window);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static isSameObject(vmID: LONG, obj1: JOBJECT64, obj2: JOBJECT64): BOOL {
    return WindowsAccessBridge.Load('isSameObject')(vmID, obj1, obj2);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static releaseJavaObject(vmID: LONG, object: Java_Object): void {
    return WindowsAccessBridge.Load('releaseJavaObject')(vmID, object);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static removeAccessibleSelectionFromContext(vmID: LONG, as: AccessibleSelection, i: INT): void {
    return WindowsAccessBridge.Load('removeAccessibleSelectionFromContext')(vmID, as, i);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static requestFocus(vmID: LONG, accessibleContext: AccessibleContext): BOOL {
    return WindowsAccessBridge.Load('requestFocus')(vmID, accessibleContext);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static selectAllAccessibleSelectionFromContext(vmID: LONG, as: AccessibleSelection): void {
    return WindowsAccessBridge.Load('selectAllAccessibleSelectionFromContext')(vmID, as);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static selectTextRange(vmID: LONG, accessibleContext: AccessibleContext, startIndex: INT, endIndex: INT): BOOL {
    return WindowsAccessBridge.Load('selectTextRange')(vmID, accessibleContext, startIndex, endIndex);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setCaretPosition(vmID: LONG, accessibleContext: AccessibleContext, position: INT): BOOL {
    return WindowsAccessBridge.Load('setCaretPosition')(vmID, accessibleContext, position);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setCaretUpdateFP(fp: AccessBridge_CaretUpdateFP): void {
    return WindowsAccessBridge.Load('setCaretUpdateFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setFocusGainedFP(fp: AccessBridge_FocusGainedFP): void {
    return WindowsAccessBridge.Load('setFocusGainedFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setFocusLostFP(fp: AccessBridge_FocusLostFP): void {
    return WindowsAccessBridge.Load('setFocusLostFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setJavaShutdownFP(fp: AccessBridge_JavaShutdownFP): void {
    return WindowsAccessBridge.Load('setJavaShutdownFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setMenuCanceledFP(fp: AccessBridge_MenuCanceledFP): void {
    return WindowsAccessBridge.Load('setMenuCanceledFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setMenuDeselectedFP(fp: AccessBridge_MenuDeselectedFP): void {
    return WindowsAccessBridge.Load('setMenuDeselectedFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setMenuSelectedFP(fp: AccessBridge_MenuSelectedFP): void {
    return WindowsAccessBridge.Load('setMenuSelectedFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setMouseClickedFP(fp: AccessBridge_MouseClickedFP): void {
    return WindowsAccessBridge.Load('setMouseClickedFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setMouseEnteredFP(fp: AccessBridge_MouseEnteredFP): void {
    return WindowsAccessBridge.Load('setMouseEnteredFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setMouseExitedFP(fp: AccessBridge_MouseExitedFP): void {
    return WindowsAccessBridge.Load('setMouseExitedFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setMousePressedFP(fp: AccessBridge_MousePressedFP): void {
    return WindowsAccessBridge.Load('setMousePressedFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setMouseReleasedFP(fp: AccessBridge_MouseReleasedFP): void {
    return WindowsAccessBridge.Load('setMouseReleasedFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setPopupMenuCanceledFP(fp: AccessBridge_PopupMenuCanceledFP): void {
    return WindowsAccessBridge.Load('setPopupMenuCanceledFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setPopupMenuWillBecomeInvisibleFP(fp: AccessBridge_PopupMenuWillBecomeInvisibleFP): void {
    return WindowsAccessBridge.Load('setPopupMenuWillBecomeInvisibleFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setPopupMenuWillBecomeVisibleFP(fp: AccessBridge_PopupMenuWillBecomeVisibleFP): void {
    return WindowsAccessBridge.Load('setPopupMenuWillBecomeVisibleFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setPropertyActiveDescendentChangeFP(fp: AccessBridge_PropertyActiveDescendentChangeFP): void {
    return WindowsAccessBridge.Load('setPropertyActiveDescendentChangeFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setPropertyCaretChangeFP(fp: AccessBridge_PropertyCaretChangeFP): void {
    return WindowsAccessBridge.Load('setPropertyCaretChangeFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setPropertyChangeFP(fp: AccessBridge_PropertyChangeFP): void {
    return WindowsAccessBridge.Load('setPropertyChangeFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setPropertyChildChangeFP(fp: AccessBridge_PropertyChildChangeFP): void {
    return WindowsAccessBridge.Load('setPropertyChildChangeFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setPropertyDescriptionChangeFP(fp: AccessBridge_PropertyDescriptionChangeFP): void {
    return WindowsAccessBridge.Load('setPropertyDescriptionChangeFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setPropertyNameChangeFP(fp: AccessBridge_PropertyNameChangeFP): void {
    return WindowsAccessBridge.Load('setPropertyNameChangeFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setPropertySelectionChangeFP(fp: AccessBridge_PropertySelectionChangeFP): void {
    return WindowsAccessBridge.Load('setPropertySelectionChangeFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setPropertyStateChangeFP(fp: AccessBridge_PropertyStateChangeFP): void {
    return WindowsAccessBridge.Load('setPropertyStateChangeFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setPropertyTableModelChangeFP(fp: AccessBridge_PropertyTableModelChangeFP): void {
    return WindowsAccessBridge.Load('setPropertyTableModelChangeFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setPropertyTextChangeFP(fp: AccessBridge_PropertyTextChangeFP): void {
    return WindowsAccessBridge.Load('setPropertyTextChangeFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setPropertyValueChangeFP(fp: AccessBridge_PropertyValueChangeFP): void {
    return WindowsAccessBridge.Load('setPropertyValueChangeFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setPropertyVisibleDataChangeFP(fp: AccessBridge_PropertyVisibleDataChangeFP): void {
    return WindowsAccessBridge.Load('setPropertyVisibleDataChangeFP')(fp);
  }

  // https://github.com/openjdk/jdk/blob/master/src/jdk.accessibility/windows/native/include/bridge/AccessBridgeCalls.h
  public static setTextContents(vmID: LONG, accessibleContext: AccessibleContext, text: LPCWSTR): BOOL {
    return WindowsAccessBridge.Load('setTextContents')(vmID, accessibleContext, text);
  }
}

export default WindowsAccessBridge;
