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
/** An element pointer that has outlived its provider (apartment affinity / app closed). Tolerate it. */
export const UIA_E_ELEMENTNOTAVAILABLE = 0x8004_0201 | 0;

/** IUnknown::Release — vtable slot 2 on every COM interface. */
export const IUNKNOWN_RELEASE = 2;

/** CoCreateInstance class context: in-process server. */
export const CLSCTX_INPROC_SERVER = 0x0000_0001;
/** CoInitializeEx: single-threaded (STA) apartment — matches the proven out-of-process driver model. */
export const COINIT_APARTMENTTHREADED = 0x0000_0002;

export const CLSID_CUIAutomation = '{FF48DBA4-60EF-4201-AA87-54103EEF594E}';
export const IID_IUIAutomation = '{30CBE57D-D9D0-452A-AB13-7AC5AC4825EE}';

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
  HasKeyboardFocus = 30008,
  IsKeyboardFocusable = 30009,
  IsEnabled = 30010,
  AutomationId = 30011,
  ClassName = 30012,
  HelpText = 30013,
  IsControlElement = 30016,
  IsContentElement = 30017,
  NativeWindowHandle = 30020,
  IsOffscreen = 30022,
  FrameworkId = 30024,
}

/**
 * COM vtable slots, keyed by method name (names are unique across the interfaces the package
 * binds, even where slot NUMBERS repeat across interfaces). Header declaration order, grouped
 * by interface. Slots marked PROVEN were verified by running on a live element; the rest are
 * header-derived and verified by running before first use in their phase.
 */
export const SLOT = {
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
  GetCachedParent: 18,
  GetCachedChildren: 19,
  GetCurrentPattern: 16, // PROVEN
  get_CurrentControlType: 21, // PROVEN
  get_CurrentName: 23, // PROVEN
  get_CurrentIsEnabled: 28, // PROVEN
  get_CurrentAutomationId: 29, // PROVEN
  get_CurrentClassName: 30, // PROVEN
  get_CurrentNativeWindowHandle: 36, // PROVEN
  get_CurrentBoundingRectangle: 43, // PROVEN (RECT = 4x LONG, 16 bytes; matches GetWindowRect)
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
  // IUIAutomationTreeWalker
  GetParentElement: 3,
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
  get_CurrentIsSelected: 6,
  // IUIAutomationScrollItemPattern
  ScrollIntoView: 3,
  // IUIAutomationWindowPattern
  Close: 3,
  WaitForInputIdle: 4,
  SetWindowVisualState: 5,
  get_CurrentWindowVisualState: 10,
  // IUIAutomationTextPattern + IUIAutomationTextRange
  get_DocumentRange: 7,
  GetText: 12,
} as const;
