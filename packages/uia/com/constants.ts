// Verified UI Automation identifiers and COM vtable slots.
//
// IDs are extracted from the Windows SDK header UIAutomationClient.h (10.0.22000.0):
// pattern ids 10000+, property ids 30000+, control-type ids 50000+.
// Vtable SLOTs are header declaration order (IUnknown 0-2, then STDMETHOD order) AND
// runtime-verified on live elements — a wrong slot calls the wrong function pointer and
// segfaults. The classic miscount: ElementFromHandle is slot 6 (GetRootElement 5,
// ElementFromHandle 6, ElementFromPoint 7, GetFocusedElement 8, then the *BuildCache
// variants at 9-12), NOT slot 7. Proven via NativeWindowHandle round-trip.

export const S_OK = 0x0000_0000;
export const S_FALSE = 0x0000_0001;
/** The control is disabled — its pattern method refuses to act. */
export const UIA_E_ELEMENTNOTENABLED = 0x8004_0200 | 0;
/** An element pointer that has outlived its provider (apartment affinity / app closed). Tolerate it. */
export const UIA_E_ELEMENTNOTAVAILABLE = 0x8004_0201 | 0;
/** No on-screen clickable point exists (occluded / zero-size / virtualized). */
export const UIA_E_NOCLICKABLEPOINT = 0x8004_0202 | 0;
/** The UIA proxy provider assembly for this legacy control failed to load. */
export const UIA_E_PROXYASSEMBLYNOTLOADED = 0x8004_0203 | 0;
/** The element does not support the requested control pattern. */
export const UIA_E_NOTSUPPORTED = 0x8004_0204 | 0;

/** IUnknown::Release — vtable slot 2 on every COM interface. */
export const IUNKNOWN_RELEASE = 2;

/** CoCreateInstance class context: in-process server. */
export const CLSCTX_INPROC_SERVER = 0x0000_0001;
/** CoInitializeEx: single-threaded (STA) apartment — matches the proven out-of-process driver model. */
export const COINIT_APARTMENTTHREADED = 0x0000_0002;

export const CLSID_CUIAutomation = '{FF48DBA4-60EF-4201-AA87-54103EEF594E}';
export const IID_IUIAutomation = '{30CBE57D-D9D0-452A-AB13-7AC5AC4825EE}';
export const IID_IUIAutomationElement3 = '{8471DF34-AEE0-4A01-A7DE-7DB9AF12C296}';

/** VARIANT discriminants used to build property conditions (value at byte offset 8). */
export const VT_I4 = 0x0003;
export const VT_R8 = 0x0005;
export const VT_BSTR = 0x0008;
export const VT_DISPATCH = 0x0009;
export const VT_BOOL = 0x000b;

export enum TreeScope {
  TreeScope_None = 0x0000_0000,
  TreeScope_Element = 0x0000_0001,
  TreeScope_Children = 0x0000_0002,
  TreeScope_Descendants = 0x0000_0004,
  TreeScope_Parent = 0x0000_0008,
  TreeScope_Ancestors = 0x0000_0010,
  TreeScope_Subtree = 0x0000_0007,
}

export enum PropertyConditionFlags {
  PropertyConditionFlags_None = 0x0000_0000,
  PropertyConditionFlags_IgnoreCase = 0x0000_0001,
  PropertyConditionFlags_MatchSubstring = 0x0000_0002,
}

/** Control-type ids (UIA_*ControlTypeId). Numeric enum → reverse map (`ControlType[50000] === 'Button'`). */
export enum ControlType {
  Button = 50000,
  Calendar = 50001,
  CheckBox = 50002,
  ComboBox = 50003,
  Edit = 50004,
  Hyperlink = 50005,
  Image = 50006,
  ListItem = 50007,
  List = 50008,
  Menu = 50009,
  MenuBar = 50010,
  MenuItem = 50011,
  ProgressBar = 50012,
  RadioButton = 50013,
  ScrollBar = 50014,
  Slider = 50015,
  Spinner = 50016,
  StatusBar = 50017,
  Tab = 50018,
  TabItem = 50019,
  Text = 50020,
  ToolBar = 50021,
  ToolTip = 50022,
  Tree = 50023,
  TreeItem = 50024,
  Custom = 50025,
  Group = 50026,
  Thumb = 50027,
  DataGrid = 50028,
  DataItem = 50029,
  Document = 50030,
  SplitButton = 50031,
  Window = 50032,
  Pane = 50033,
  Header = 50034,
  HeaderItem = 50035,
  Table = 50036,
  TitleBar = 50037,
  Separator = 50038,
  SemanticZoom = 50039,
  AppBar = 50040,
}

/** Control-pattern ids (UIA_*PatternId), consumed by GetCurrentPattern / property availability. */
export enum PatternId {
  Invoke = 10000,
  Selection = 10001,
  Value = 10002,
  RangeValue = 10003,
  Scroll = 10004,
  ExpandCollapse = 10005,
  Grid = 10006,
  GridItem = 10007,
  MultipleView = 10008,
  Window = 10009,
  SelectionItem = 10010,
  Dock = 10011,
  Table = 10012,
  TableItem = 10013,
  Text = 10014,
  Toggle = 10015,
  Transform = 10016,
  ScrollItem = 10017,
  LegacyIAccessible = 10018,
  ItemContainer = 10019,
  VirtualizedItem = 10020,
  SynchronizedInput = 10021,
  ObjectModel = 10022,
  Annotation = 10023,
  Styles = 10025,
  Spreadsheet = 10026,
  SpreadsheetItem = 10027,
  TextChild = 10029,
  Drag = 10030,
  DropTarget = 10031,
  TextEdit = 10032,
  CustomNavigation = 10033,
}

/** Automation-element property ids (UIA_*PropertyId), used to build server-side conditions. */
export enum PropertyId {
  RuntimeId = 30000,
  BoundingRectangle = 30001,
  ProcessId = 30002,
  ControlType = 30003,
  LocalizedControlType = 30004,
  Name = 30005,
  AcceleratorKey = 30006,
  AccessKey = 30007,
  HasKeyboardFocus = 30008,
  IsKeyboardFocusable = 30009,
  IsEnabled = 30010,
  AutomationId = 30011,
  ClassName = 30012,
  HelpText = 30013,
  IsControlElement = 30016,
  IsContentElement = 30017,
  IsPassword = 30019,
  NativeWindowHandle = 30020,
  ItemType = 30021,
  IsOffscreen = 30022,
  FrameworkId = 30024,
  ItemStatus = 30026,
  IsExpandCollapsePatternAvailable = 30028,
  IsGridItemPatternAvailable = 30029,
  IsGridPatternAvailable = 30030,
  IsInvokePatternAvailable = 30031,
  IsMultipleViewPatternAvailable = 30032,
  IsRangeValuePatternAvailable = 30033,
  IsScrollPatternAvailable = 30034,
  IsScrollItemPatternAvailable = 30035,
  IsSelectionItemPatternAvailable = 30036,
  IsTextPatternAvailable = 30040,
  IsTogglePatternAvailable = 30041,
  IsTransformPatternAvailable = 30042,
  IsValuePatternAvailable = 30043,
  ValueValue = 30045,
  ValueIsReadOnly = 30046,
  RangeValueValue = 30047,
  RangeValueIsReadOnly = 30048,
  RangeValueMinimum = 30049,
  RangeValueMaximum = 30050,
  RangeValueLargeChange = 30051,
  RangeValueSmallChange = 30052,
  ScrollHorizontalScrollPercent = 30053,
  ScrollVerticalScrollPercent = 30055,
  ScrollHorizontallyScrollable = 30057,
  ScrollVerticallyScrollable = 30058,
  ExpandCollapseExpandCollapseState = 30070,
  SelectionItemIsSelected = 30079,
  ToggleToggleState = 30086,
}

/**
 * COM vtable slots, keyed by method name (names are unique across the interfaces the package
 * binds, even where slot NUMBERS repeat across interfaces). Header declaration order, grouped
 * by interface. Slots marked PROVEN were verified by running on a live element; the rest are
 * header-derived and verified by running before first use in their phase.
 */
export const SLOT = {
  // IUnknown (every interface)
  QueryInterface: 0,
  // IUIAutomation
  GetRootElement: 5, // PROVEN
  ElementFromHandle: 6, // PROVEN (NativeWindowHandle round-trip; NOT slot 7 = ElementFromPoint)
  ElementFromPoint: 7,
  GetFocusedElement: 8,
  CreateCacheRequest: 20,
  CreateTrueCondition: 21, // PROVEN
  CreateFalseCondition: 22,
  CreatePropertyCondition: 23, // PROVEN (VARIANT-by-pointer; server-side filtering works)
  CreatePropertyConditionEx: 24,
  CreateAndCondition: 25, // PROVEN
  CreateOrCondition: 28,
  CreateNotCondition: 31,
  get_ControlViewWalker: 14,
  // IUIAutomationElement
  SetFocus: 3,
  GetRuntimeId: 4,
  FindFirst: 5, // PROVEN
  FindAll: 6, // PROVEN
  FindFirstBuildCache: 7,
  FindAllBuildCache: 8,
  BuildUpdatedCache: 9,
  GetCurrentPropertyValue: 10,
  GetCachedPropertyValue: 12,
  GetCachedParent: 18,
  GetCachedChildren: 19,
  GetCurrentPattern: 16, // PROVEN
  get_CurrentControlType: 21, // PROVEN
  get_CurrentName: 23, // PROVEN
  get_CurrentIsEnabled: 28, // PROVEN
  get_CurrentAutomationId: 29, // PROVEN
  get_CurrentClassName: 30, // PROVEN
  get_CurrentNativeWindowHandle: 36, // PROVEN
  ShowContextMenu: 91, // IUIAutomationElement3 (extends Element) — verified vs UIAutomationClient.h IUIAutomationElement3Vtbl

  get_CurrentBoundingRectangle: 43, // PROVEN (RECT = 4x LONG, 16 bytes; matches GetWindowRect)
  get_CurrentLabeledBy: 44, // IUIAutomationElement (returns the label element*; backs the Selector labeledBy / getByLabel relational lookup)
  GetClickablePoint: 84, // PROVEN (returned point lands inside the control's bounds)
  get_CachedControlType: 53,
  get_CachedName: 55,
  get_CachedIsEnabled: 60,
  get_CachedAutomationId: 61,
  get_CachedClassName: 62,
  get_CachedBoundingRectangle: 75,
  // IUIAutomationCacheRequest
  AddProperty: 3,
  AddPattern: 4,
  put_TreeScope: 7,
  put_TreeFilter: 9,
  put_AutomationElementMode: 11,
  // IUIAutomationElementArray
  get_Length: 3, // PROVEN
  GetElement: 4, // PROVEN
  // IUIAutomationTreeWalker (verified vs UIAutomationClient.h IUIAutomationTreeWalkerVtbl: GetParentElement 3,
  // GetFirstChildElement 4, GetLastChildElement 5, GetNextSiblingElement 6, GetPreviousSiblingElement 7,
  // NormalizeElement 8, then the *BuildCache variants 9-13 in the same order — GetFirstChildElementBuildCache 10,
  // GetNextSiblingElementBuildCache 12). The BuildCache child/sibling enumeration is the budget-bounded snapshot walk.)
  GetParentElement: 3,
  GetFirstChildElementBuildCache: 10,
  GetNextSiblingElementBuildCache: 12,
  // IUIAutomationInvokePattern
  Invoke: 3, // PROVEN (Calculator 5+3=8)
  // IUIAutomationValuePattern + IUIAutomationRangeValuePattern (SetValue/get_CurrentValue share slot numbers)
  SetValue: 3,
  get_CurrentValue: 4,
  // IUIAutomationTogglePattern
  Toggle: 3,
  get_CurrentToggleState: 4,
  // IUIAutomationExpandCollapsePattern
  Expand: 3,
  Collapse: 4,
  get_CurrentExpandCollapseState: 5,
  // IUIAutomationSelectionItemPattern
  Select: 3,
  AddToSelection: 4,
  RemoveFromSelection: 5,
  get_CurrentIsSelected: 6,
  // IUIAutomationLegacyIAccessiblePattern (the MSAA bridge — DoDefaultAction = "Open" a folder/drive, "Press" a button, …)
  DoDefaultAction: 4,
  // IUIAutomationSelectionPattern (container)
  GetCurrentSelection: 3,
  get_CurrentCanSelectMultiple: 4,
  // IUIAutomationScrollItemPattern
  ScrollIntoView: 3,
  // IUIAutomationScrollPattern (PROVEN live: File Explorer items view scrolled 0%->100% via slots 3,4; getters 5-10 read clean)
  Scroll: 3,
  SetScrollPercent: 4,
  get_CurrentHorizontalScrollPercent: 5,
  get_CurrentVerticalScrollPercent: 6,
  get_CurrentHorizontalViewSize: 7,
  get_CurrentVerticalViewSize: 8,
  get_CurrentHorizontallyScrollable: 9,
  get_CurrentVerticallyScrollable: 10,
  // IUIAutomationTransformPattern (PROVEN live: Notepad moved+resized via slots 3,4; CanMove/CanResize/CanRotate read 1/1/0 on slots 6,7,8)
  Move: 3,
  Resize: 4,
  Rotate: 5,
  get_CurrentCanMove: 6,
  get_CurrentCanResize: 7,
  get_CurrentCanRotate: 8,
  // IUIAutomationWindowPattern
  Close: 3,
  WaitForInputIdle: 4,
  SetWindowVisualState: 5,
  get_CurrentWindowVisualState: 10,
  // IUIAutomationTextPattern + IUIAutomationTextRange (TextRange.Select=16 collides by name with
  // SelectionItem.Select=3 — it lives as a local const in patterns.ts, verified by slot-gate's scoped block)
  GetSelection: 5,
  GetVisibleRanges: 6, // IUIAutomationTextPattern — verified vs UIAutomationClient.h (RangeFromPoint 3, RangeFromChild 4, GetSelection 5, GetVisibleRanges 6, get_DocumentRange 7)
  get_DocumentRange: 7,
  FindText: 8,
  GetText: 12,
  // IUIAutomationGridPattern (GetItem(row,col)->cell; live-proven on File Explorer details view 28x4)
  GetItem: 3,
  get_CurrentRowCount: 4,
  get_CurrentColumnCount: 5,
  // IUIAutomationGridItemPattern (reverse: a cell -> its row/column/spans; verified vs UIAutomationClient.h IUIAutomationGridItemPatternVtbl — ContainingGrid 3, Row 4, Column 5, RowSpan 6, ColumnSpan 7)
  get_CurrentContainingGrid: 3,
  get_CurrentRow: 4,
  get_CurrentColumn: 5,
  get_CurrentRowSpan: 6,
  get_CurrentColumnSpan: 7,
  // IUIAutomationTablePattern
  GetCurrentColumnHeaders: 4,
  // IUIAutomationMultipleViewPattern (view-mode switch — verified vs UIAutomationClient.h IUIAutomationMultipleViewPatternVtbl)
  GetViewName: 3,
  SetCurrentView: 4,
  get_CurrentCurrentView: 5,
  GetCurrentSupportedViews: 6,
} as const;
