import type { Pointer } from 'bun:ffi';

export type { BOOL, HWND, INT, LONG, LPCWSTR, LPWSTR, SHORT } from '@bun-win32/core';

export const MAX_ACTIONS_TO_DO = 32;
export const MAX_ACTION_INFO = 256;
export const MAX_BUFFER_SIZE = 10240;
export const MAX_HYPERLINKS = 64;
export const MAX_ICON_INFO = 8;
export const MAX_KEY_BINDINGS = 10;
export const MAX_RELATIONS = 5;
export const MAX_RELATION_TARGETS = 25;
export const MAX_STRING_SIZE = 1024;
export const MAX_TABLE_SELECTIONS = 64;
export const MAX_VISIBLE_CHILDREN = 256;
export const SHORT_STRING_SIZE = 256;

export enum AccessibleInterface {
  ACTION = 0x0000_0002,
  COMPONENT = 0x0000_0004,
  HYPERTEXT = 0x0000_0040,
  SELECTION = 0x0000_0008,
  TABLE = 0x0000_0010,
  TEXT = 0x0000_0020,
  VALUE = 0x0000_0001,
}

export enum EventType {
  CARET_UPDATE = 0x0000_0008,
  FOCUS_GAINED = 0x0000_0002,
  FOCUS_LOST = 0x0000_0004,
  JAVA_SHUTDOWN = 0x0000_8000,
  MENU_CANCELED = 0x0000_0200,
  MENU_DESELECTED = 0x0000_0400,
  MENU_SELECTED = 0x0000_0800,
  MOUSE_CLICKED = 0x0000_0010,
  MOUSE_ENTERED = 0x0000_0020,
  MOUSE_EXITED = 0x0000_0040,
  MOUSE_PRESSED = 0x0000_0080,
  MOUSE_RELEASED = 0x0000_0100,
  POPUP_MENU_CANCELED = 0x0000_1000,
  POPUP_MENU_WILL_BECOME_INVISIBLE = 0x0000_2000,
  POPUP_MENU_WILL_BECOME_VISIBLE = 0x0000_4000,
  PROPERTY_CHANGE = 0x0000_0001,
}

export enum KeystrokeModifier {
  ALT = 0x0000_0008,
  ALT_GRAPH = 0x0000_0010,
  BUTTON1 = 0x0000_0020,
  BUTTON2 = 0x0000_0040,
  BUTTON3 = 0x0000_0080,
  CONTROL = 0x0000_0002,
  CONTROLCODE = 0x0000_0200,
  FKEY = 0x0000_0100,
  META = 0x0000_0004,
  SHIFT = 0x0000_0001,
}

export enum PropertyChangeEventType {
  ACTIVE_DESCENDENT_CHANGE = 0x0000_0200,
  CARET_CHANGE = 0x0000_0040,
  CHILD_CHANGE = 0x0000_0100,
  DESCRIPTION_CHANGE = 0x0000_0002,
  NAME_CHANGE = 0x0000_0001,
  SELECTION_CHANGE = 0x0000_0010,
  STATE_CHANGE = 0x0000_0004,
  TABLE_MODEL_CHANGE = 0x0000_0400,
  TEXT_CHANGE = 0x0000_0020,
  VALUE_CHANGE = 0x0000_0008,
  VISIBLE_DATA_CHANGE = 0x0000_0080,
}

export type AccessBridge_CaretUpdateFP = Pointer;
export type AccessBridge_FocusGainedFP = Pointer;
export type AccessBridge_FocusLostFP = Pointer;
export type AccessBridge_JavaShutdownFP = Pointer;
export type AccessBridge_MenuCanceledFP = Pointer;
export type AccessBridge_MenuDeselectedFP = Pointer;
export type AccessBridge_MenuSelectedFP = Pointer;
export type AccessBridge_MouseClickedFP = Pointer;
export type AccessBridge_MouseEnteredFP = Pointer;
export type AccessBridge_MouseExitedFP = Pointer;
export type AccessBridge_MousePressedFP = Pointer;
export type AccessBridge_MouseReleasedFP = Pointer;
export type AccessBridge_PopupMenuCanceledFP = Pointer;
export type AccessBridge_PopupMenuWillBecomeInvisibleFP = Pointer;
export type AccessBridge_PopupMenuWillBecomeVisibleFP = Pointer;
export type AccessBridge_PropertyActiveDescendentChangeFP = Pointer;
export type AccessBridge_PropertyCaretChangeFP = Pointer;
export type AccessBridge_PropertyChangeFP = Pointer;
export type AccessBridge_PropertyChildChangeFP = Pointer;
export type AccessBridge_PropertyDescriptionChangeFP = Pointer;
export type AccessBridge_PropertyNameChangeFP = Pointer;
export type AccessBridge_PropertySelectionChangeFP = Pointer;
export type AccessBridge_PropertyStateChangeFP = Pointer;
export type AccessBridge_PropertyTableModelChangeFP = Pointer;
export type AccessBridge_PropertyTextChangeFP = Pointer;
export type AccessBridge_PropertyValueChangeFP = Pointer;
export type AccessBridge_PropertyVisibleDataChangeFP = Pointer;
export type AccessibleContext = bigint;
export type AccessibleHyperlink = bigint;
export type AccessibleHypertext = bigint;
export type AccessibleSelection = bigint;
export type AccessibleTable = bigint;
export type AccessibleText = bigint;
export type AccessibleValue = bigint;
export type JINT = number;
export type JOBJECT64 = bigint;
export type Java_Object = bigint;
export type PAccessBridgeVersionInfo = Pointer;
export type PAccessibleActions = Pointer;
export type PAccessibleActionsToDo = Pointer;
export type PAccessibleContext = Pointer;
export type PAccessibleContextInfo = Pointer;
export type PAccessibleHyperlinkInfo = Pointer;
export type PAccessibleHypertextInfo = Pointer;
export type PAccessibleIcons = Pointer;
export type PAccessibleKeyBindings = Pointer;
export type PAccessibleRelationSetInfo = Pointer;
export type PAccessibleTableCellInfo = Pointer;
export type PAccessibleTableInfo = Pointer;
export type PAccessibleTextAttributesInfo = Pointer;
export type PAccessibleTextInfo = Pointer;
export type PAccessibleTextItemsInfo = Pointer;
export type PAccessibleTextRectInfo = Pointer;
export type PAccessibleTextSelectionInfo = Pointer;
export type PJINT = Pointer;
export type PLONG = Pointer;
export type PSHORT = Pointer;
export type PVisibleChildrenInfo = Pointer;
