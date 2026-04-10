import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, HRESULT, HWND, LONG, LPARAM, LPCWSTR, LRESULT, NULL, WPARAM } from '@bun-win32/core';

export const UIA_E_ELEMENTNOTAVAILABLE = 0x8004_0201;
export const UIA_E_ELEMENTNOTENABLED = 0x8004_0200;
export const UIA_E_INVALIDOPERATION = 0x8013_1509;
export const UIA_E_NOCLICKABLEPOINT = 0x8004_0202;
export const UIA_E_NOTSUPPORTED = 0x8004_0204;
export const UIA_E_PROXYASSEMBLYNOTLOADED = 0x8004_0203;
export const UIA_E_TIMEOUT = 0x8013_1505;
export const UIA_IAFP_DEFAULT = 0x0000;
export const UIA_IAFP_UNWRAP_BRIDGE = 0x0001;
export const UIA_PFIA_DEFAULT = 0x0000;
export const UIA_PFIA_UNWRAP_BRIDGE = 0x0001;
export const UiaAppendRuntimeId = 3;
export const UiaRootObjectId = -25;

export enum AsyncContentLoadedState {
  AsyncContentLoadedState_Beginning = 0,
  AsyncContentLoadedState_Progress = 1,
  AsyncContentLoadedState_Completed = 2,
}

export enum AutomationIdentifierType {
  AutomationIdentifierType_Property = 0,
  AutomationIdentifierType_Pattern = 1,
  AutomationIdentifierType_Event = 2,
  AutomationIdentifierType_ControlType = 3,
  AutomationIdentifierType_TextAttribute = 4,
  AutomationIdentifierType_LandmarkType = 5,
  AutomationIdentifierType_Annotation = 6,
  AutomationIdentifierType_Changes = 7,
  AutomationIdentifierType_Style = 8,
}

export enum DockPosition {
  DockPosition_Top = 0,
  DockPosition_Left = 1,
  DockPosition_Bottom = 2,
  DockPosition_Right = 3,
  DockPosition_Fill = 4,
  DockPosition_None = 5,
}

export enum NavigateDirection {
  NavigateDirection_Parent = 0,
  NavigateDirection_NextSibling = 1,
  NavigateDirection_PreviousSibling = 2,
  NavigateDirection_FirstChild = 3,
  NavigateDirection_LastChild = 4,
}

export enum NormalizeState {
  NormalizeState_None = 0,
  NormalizeState_View = 1,
  NormalizeState_Custom = 2,
}

export enum NotificationKind {
  NotificationKind_ItemAdded = 0,
  NotificationKind_ItemRemoved = 1,
  NotificationKind_ActionCompleted = 2,
  NotificationKind_ActionAborted = 3,
  NotificationKind_Other = 4,
}

export enum NotificationProcessing {
  NotificationProcessing_ImportantAll = 0,
  NotificationProcessing_ImportantMostRecent = 1,
  NotificationProcessing_All = 2,
  NotificationProcessing_MostRecent = 3,
  NotificationProcessing_CurrentThenMostRecent = 4,
}

export enum ProviderType {
  ProviderType_BaseHwnd = 0,
  ProviderType_Proxy = 1,
  ProviderType_NonClientArea = 2,
}

export enum ScrollAmount {
  ScrollAmount_LargeDecrement = 0,
  ScrollAmount_SmallDecrement = 1,
  ScrollAmount_NoAmount = 2,
  ScrollAmount_LargeIncrement = 3,
  ScrollAmount_SmallIncrement = 4,
}

export enum StructureChangeType {
  StructureChangeType_ChildAdded = 0,
  StructureChangeType_ChildRemoved = 1,
  StructureChangeType_ChildrenInvalidated = 2,
  StructureChangeType_ChildrenBulkAdded = 3,
  StructureChangeType_ChildrenBulkRemoved = 4,
  StructureChangeType_ChildrenReordered = 5,
}

export enum SupportedTextSelection {
  SupportedTextSelection_None = 0,
  SupportedTextSelection_Single = 1,
  SupportedTextSelection_Multiple = 2,
}

export enum SynchronizedInputType {
  SynchronizedInputType_KeyUp = 0x0000_0001,
  SynchronizedInputType_KeyDown = 0x0000_0002,
  SynchronizedInputType_LeftMouseUp = 0x0000_0004,
  SynchronizedInputType_LeftMouseDown = 0x0000_0008,
  SynchronizedInputType_RightMouseUp = 0x0000_0010,
  SynchronizedInputType_RightMouseDown = 0x0000_0020,
}

export enum TextEditChangeType {
  TextEditChangeType_None = 0,
  TextEditChangeType_AutoCorrect = 1,
  TextEditChangeType_Composition = 2,
  TextEditChangeType_CompositionFinalized = 3,
  TextEditChangeType_AutoComplete = 4,
}

export enum TextPatternRangeEndpoint {
  TextPatternRangeEndpoint_Start = 0,
  TextPatternRangeEndpoint_End = 1,
}

export enum TextUnit {
  TextUnit_Character = 0,
  TextUnit_Format = 1,
  TextUnit_Word = 2,
  TextUnit_Line = 3,
  TextUnit_Paragraph = 4,
  TextUnit_Page = 5,
  TextUnit_Document = 6,
}

export enum TreeScope {
  TreeScope_None = 0x0000_0000,
  TreeScope_Element = 0x0000_0001,
  TreeScope_Children = 0x0000_0002,
  TreeScope_Descendants = 0x0000_0004,
  TreeScope_Parent = 0x0000_0008,
  TreeScope_Ancestors = 0x0000_0010,
  TreeScope_Subtree = TreeScope_Element | TreeScope_Children | TreeScope_Descendants,
}

export enum WindowVisualState {
  WindowVisualState_Normal = 0,
  WindowVisualState_Maximized = 1,
  WindowVisualState_Minimized = 2,
}

export type BSTR = Pointer;
export type EVENTID = number;
export type GUID = Pointer;
export type HUIAEVENT = bigint;
export type HUIANODE = bigint;
export type HUIAPATTERNOBJECT = bigint;
export type HUIATEXTRANGE = bigint;
export type IAccessible = Pointer;
export type IRawElementProviderSimple = Pointer;
export type ITextRangeProvider = Pointer;
export type int = number;
export type IUnknown = Pointer;
export type PATTERNID = number;
export type PBOOL = Pointer;
export type PBSTR = Pointer;
export type PHUIAEVENT = Pointer;
export type PHUIANODE = Pointer;
export type PHUIAPATTERNOBJECT = Pointer;
export type PHUIATEXTRANGE = Pointer;
export type PINT = Pointer;
export type PPIAccessible = Pointer;
export type PPIRawElementProviderSimple = Pointer;
export type PPIUnknown = Pointer;
export type PPROPERTYID = Pointer;
export type PPVOID = Pointer;
export type PROPERTYID = number;
export type PSAFEARRAY = Pointer;
export type PSupportedTextSelection = Pointer;
export type PVARIANT = Pointer;
export type REFCLSID = Pointer;
export type REFIID = Pointer;
export type SAFEARRAY = Pointer;
export type TEXTATTRIBUTEID = number;
export type UiaCacheRequest = Pointer;
export type UiaChangeInfo = Pointer;
export type UiaCondition = Pointer;
export type UiaEventCallback = Pointer;
export type UiaFindParams = Pointer;
export type UiaPoint = Pointer;
export type UiaProviderCallback = Pointer;
export type VARIANT = Pointer;
