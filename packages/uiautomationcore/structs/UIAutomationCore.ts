import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { AsyncContentLoadedState, AutomationIdentifierType, BOOL, BSTR, DWORD, DockPosition, EVENTID, GUID, HRESULT, HUIAEVENT, HUIANODE, HUIAPATTERNOBJECT, HUIATEXTRANGE, HWND, IAccessible, IRawElementProviderSimple, ITextRangeProvider, LONG, LPARAM, LPCWSTR, LRESULT, NULL, NavigateDirection, NormalizeState, NotificationKind, NotificationProcessing, PATTERNID, PBOOL, PBSTR, PHUIAEVENT, PHUIANODE, PHUIAPATTERNOBJECT, PHUIATEXTRANGE, PINT, PPIAccessible, PPIRawElementProviderSimple, PPIUnknown, PPROPERTYID, PPVOID, PROPERTYID, PSAFEARRAY, PSupportedTextSelection, PVARIANT, REFCLSID, REFIID, SAFEARRAY, ScrollAmount, StructureChangeType, SynchronizedInputType, TEXTATTRIBUTEID, TextEditChangeType, TextPatternRangeEndpoint, TextUnit, TreeScope, UiaCacheRequest, UiaChangeInfo, UiaCondition, UiaEventCallback, UiaFindParams, UiaPoint, UiaProviderCallback, VARIANT, WPARAM, WindowVisualState, int } from '../types/UIAutomationCore';

/**
 * Thin, lazy-loaded FFI bindings for `UIAutomationCore.dll`.
 *
 * Each static method corresponds one-to-one with a Win32 export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * @example
 * ```ts
 * import UIAutomationCore from './structs/UIAutomationCore';
 *
 * const clientsListening = UIAutomationCore.UiaClientsAreListening();
 * ```
 */
class UIAutomationCore extends Win32 {
  protected static override name = 'uiautomationcore.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllRegisterServer: { args: [], returns: FFIType.i32 },
    DllUnregisterServer: { args: [], returns: FFIType.i32 },
    DockPattern_SetDockPosition: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    ExpandCollapsePattern_Collapse: { args: [FFIType.u64], returns: FFIType.i32 },
    ExpandCollapsePattern_Expand: { args: [FFIType.u64], returns: FFIType.i32 },
    GridPattern_GetItem: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    InvokePattern_Invoke: { args: [FFIType.u64], returns: FFIType.i32 },
    ItemContainerPattern_FindItemByProperty: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LegacyIAccessiblePattern_DoDefaultAction: { args: [FFIType.u64], returns: FFIType.i32 },
    LegacyIAccessiblePattern_GetIAccessible: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    LegacyIAccessiblePattern_Select: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    LegacyIAccessiblePattern_SetValue: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    MultipleViewPattern_GetViewName: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    MultipleViewPattern_SetCurrentView: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    RangeValuePattern_SetValue: { args: [FFIType.u64, FFIType.f64], returns: FFIType.i32 },
    ScrollItemPattern_ScrollIntoView: { args: [FFIType.u64], returns: FFIType.i32 },
    ScrollPattern_Scroll: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    ScrollPattern_SetScrollPercent: { args: [FFIType.u64, FFIType.f64, FFIType.f64], returns: FFIType.i32 },
    SelectionItemPattern_AddToSelection: { args: [FFIType.u64], returns: FFIType.i32 },
    SelectionItemPattern_RemoveFromSelection: { args: [FFIType.u64], returns: FFIType.i32 },
    SelectionItemPattern_Select: { args: [FFIType.u64], returns: FFIType.i32 },
    SynchronizedInputPattern_Cancel: { args: [FFIType.u64], returns: FFIType.i32 },
    SynchronizedInputPattern_StartListening: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    TextPattern_get_DocumentRange: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TextPattern_get_SupportedTextSelection: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TextPattern_GetSelection: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TextPattern_GetVisibleRanges: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TextPattern_RangeFromChild: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TextPattern_RangeFromPoint: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    TextRange_AddToSelection: { args: [FFIType.u64], returns: FFIType.i32 },
    TextRange_Clone: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TextRange_Compare: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TextRange_CompareEndpoints: { args: [FFIType.u64, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    TextRange_ExpandToEnclosingUnit: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    TextRange_FindAttribute: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    TextRange_FindText: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    TextRange_GetAttributeValue: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    TextRange_GetBoundingRectangles: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TextRange_GetChildren: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TextRange_GetEnclosingElement: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TextRange_GetText: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    TextRange_Move: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    TextRange_MoveEndpointByRange: { args: [FFIType.u64, FFIType.i32, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    TextRange_MoveEndpointByUnit: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    TextRange_RemoveFromSelection: { args: [FFIType.u64], returns: FFIType.i32 },
    TextRange_ScrollIntoView: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    TextRange_Select: { args: [FFIType.u64], returns: FFIType.i32 },
    TogglePattern_Toggle: { args: [FFIType.u64], returns: FFIType.i32 },
    TransformPattern_Move: { args: [FFIType.u64, FFIType.f64, FFIType.f64], returns: FFIType.i32 },
    TransformPattern_Resize: { args: [FFIType.u64, FFIType.f64, FFIType.f64], returns: FFIType.i32 },
    TransformPattern_Rotate: { args: [FFIType.u64, FFIType.f64], returns: FFIType.i32 },
    UiaAddEvent: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UiaClientsAreListening: { args: [], returns: FFIType.i32 },
    UiaDisconnectAllProviders: { args: [], returns: FFIType.i32 },
    UiaDisconnectProvider: { args: [FFIType.ptr], returns: FFIType.i32 },
    UiaEventAddWindow: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    UiaEventRemoveWindow: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    UiaFind: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UiaGetErrorDescription: { args: [FFIType.ptr], returns: FFIType.i32 },
    UiaGetPatternProvider: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    UiaGetPropertyValue: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    UiaGetReservedMixedAttributeValue: { args: [FFIType.ptr], returns: FFIType.i32 },
    UiaGetReservedNotSupportedValue: { args: [FFIType.ptr], returns: FFIType.i32 },
    UiaGetRootNode: { args: [FFIType.ptr], returns: FFIType.i32 },
    UiaGetRuntimeId: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    UiaGetUpdatedCache: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UiaHasServerSideProvider: { args: [FFIType.u64], returns: FFIType.i32 },
    UiaHostProviderFromHwnd: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    UiaHPatternObjectFromVariant: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UiaHTextRangeFromVariant: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UiaHUiaNodeFromVariant: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UiaIAccessibleFromProvider: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UiaLookupId: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    UiaNavigate: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UiaNodeFromFocus: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UiaNodeFromHandle: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    UiaNodeFromPoint: { args: [FFIType.f64, FFIType.f64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UiaNodeFromProvider: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UiaNodeRelease: { args: [FFIType.u64], returns: FFIType.i32 },
    UiaPatternRelease: { args: [FFIType.u64], returns: FFIType.i32 },
    UiaProviderForNonClient: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    UiaProviderFromIAccessible: { args: [FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    UiaRaiseActiveTextPositionChangedEvent: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UiaRaiseAsyncContentLoadedEvent: { args: [FFIType.ptr, FFIType.i32, FFIType.f64], returns: FFIType.i32 },
    UiaRaiseAutomationEvent: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    UiaRaiseAutomationPropertyChangedEvent: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UiaRaiseChangesEvent: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    UiaRaiseNotificationEvent: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UiaRaiseStructureChangedEvent: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    UiaRaiseTextEditTextChangedEvent: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    UiaRegisterProviderCallback: { args: [FFIType.ptr], returns: FFIType.void },
    UiaRemoveEvent: { args: [FFIType.u64], returns: FFIType.i32 },
    UiaReturnRawElementProvider: { args: [FFIType.u64, FFIType.u64, FFIType.i64, FFIType.ptr], returns: FFIType.i64 },
    UiaSetFocus: { args: [FFIType.u64], returns: FFIType.i32 },
    UiaTextRangeRelease: { args: [FFIType.u64], returns: FFIType.i32 },
    ValuePattern_SetValue: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    VirtualizedItemPattern_Realize: { args: [FFIType.u64], returns: FFIType.i32 },
    WindowPattern_Close: { args: [FFIType.u64], returns: FFIType.i32 },
    WindowPattern_SetWindowVisualState: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    WindowPattern_WaitForInputIdle: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return UIAutomationCore.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv: PPVOID): HRESULT {
    return UIAutomationCore.Load('DllGetClassObject')(rclsid, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllregisterserver
  public static DllRegisterServer(): HRESULT {
    return UIAutomationCore.Load('DllRegisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllunregisterserver
  public static DllUnregisterServer(): HRESULT {
    return UIAutomationCore.Load('DllUnregisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-dockpattern_setdockposition
  public static DockPattern_SetDockPosition(hobj: HUIAPATTERNOBJECT, dockPosition: DockPosition): HRESULT {
    return UIAutomationCore.Load('DockPattern_SetDockPosition')(hobj, dockPosition);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-expandcollapsepattern_collapse
  public static ExpandCollapsePattern_Collapse(hobj: HUIAPATTERNOBJECT): HRESULT {
    return UIAutomationCore.Load('ExpandCollapsePattern_Collapse')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-expandcollapsepattern_expand
  public static ExpandCollapsePattern_Expand(hobj: HUIAPATTERNOBJECT): HRESULT {
    return UIAutomationCore.Load('ExpandCollapsePattern_Expand')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-gridpattern_getitem
  public static GridPattern_GetItem(hobj: HUIAPATTERNOBJECT, row: int, column: int, pResult: PHUIANODE): HRESULT {
    return UIAutomationCore.Load('GridPattern_GetItem')(hobj, row, column, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-invokepattern_invoke
  public static InvokePattern_Invoke(hobj: HUIAPATTERNOBJECT): HRESULT {
    return UIAutomationCore.Load('InvokePattern_Invoke')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-itemcontainerpattern_finditembyproperty
  public static ItemContainerPattern_FindItemByProperty(hobj: HUIAPATTERNOBJECT, hnodeStartAfter: HUIANODE, propertyId: PROPERTYID, value: VARIANT, pFound: PHUIANODE): HRESULT {
    return UIAutomationCore.Load('ItemContainerPattern_FindItemByProperty')(hobj, hnodeStartAfter, propertyId, value, pFound);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-legacyiaccessiblepattern_dodefaultaction
  public static LegacyIAccessiblePattern_DoDefaultAction(hobj: HUIAPATTERNOBJECT): HRESULT {
    return UIAutomationCore.Load('LegacyIAccessiblePattern_DoDefaultAction')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-legacyiaccessiblepattern_getiaccessible
  public static LegacyIAccessiblePattern_GetIAccessible(hobj: HUIAPATTERNOBJECT, pAccessible: PPIAccessible): HRESULT {
    return UIAutomationCore.Load('LegacyIAccessiblePattern_GetIAccessible')(hobj, pAccessible);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-legacyiaccessiblepattern_select
  public static LegacyIAccessiblePattern_Select(hobj: HUIAPATTERNOBJECT, flagsSelect: LONG): HRESULT {
    return UIAutomationCore.Load('LegacyIAccessiblePattern_Select')(hobj, flagsSelect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-legacyiaccessiblepattern_setvalue
  public static LegacyIAccessiblePattern_SetValue(hobj: HUIAPATTERNOBJECT, szValue: LPCWSTR): HRESULT {
    return UIAutomationCore.Load('LegacyIAccessiblePattern_SetValue')(hobj, szValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-multipleviewpattern_getviewname
  public static MultipleViewPattern_GetViewName(hobj: HUIAPATTERNOBJECT, viewId: int, ppStr: PBSTR): HRESULT {
    return UIAutomationCore.Load('MultipleViewPattern_GetViewName')(hobj, viewId, ppStr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-multipleviewpattern_setcurrentview
  public static MultipleViewPattern_SetCurrentView(hobj: HUIAPATTERNOBJECT, viewId: int): HRESULT {
    return UIAutomationCore.Load('MultipleViewPattern_SetCurrentView')(hobj, viewId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-rangevaluepattern_setvalue
  public static RangeValuePattern_SetValue(hobj: HUIAPATTERNOBJECT, val: number): HRESULT {
    return UIAutomationCore.Load('RangeValuePattern_SetValue')(hobj, val);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-scrollitempattern_scrollintoview
  public static ScrollItemPattern_ScrollIntoView(hobj: HUIAPATTERNOBJECT): HRESULT {
    return UIAutomationCore.Load('ScrollItemPattern_ScrollIntoView')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-scrollpattern_scroll
  public static ScrollPattern_Scroll(hobj: HUIAPATTERNOBJECT, horizontalAmount: ScrollAmount, verticalAmount: ScrollAmount): HRESULT {
    return UIAutomationCore.Load('ScrollPattern_Scroll')(hobj, horizontalAmount, verticalAmount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-scrollpattern_setscrollpercent
  public static ScrollPattern_SetScrollPercent(hobj: HUIAPATTERNOBJECT, horizontalPercent: number, verticalPercent: number): HRESULT {
    return UIAutomationCore.Load('ScrollPattern_SetScrollPercent')(hobj, horizontalPercent, verticalPercent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-selectionitempattern_addtoselection
  public static SelectionItemPattern_AddToSelection(hobj: HUIAPATTERNOBJECT): HRESULT {
    return UIAutomationCore.Load('SelectionItemPattern_AddToSelection')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-selectionitempattern_removefromselection
  public static SelectionItemPattern_RemoveFromSelection(hobj: HUIAPATTERNOBJECT): HRESULT {
    return UIAutomationCore.Load('SelectionItemPattern_RemoveFromSelection')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-selectionitempattern_select
  public static SelectionItemPattern_Select(hobj: HUIAPATTERNOBJECT): HRESULT {
    return UIAutomationCore.Load('SelectionItemPattern_Select')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-synchronizedinputpattern_cancel
  public static SynchronizedInputPattern_Cancel(hobj: HUIAPATTERNOBJECT): HRESULT {
    return UIAutomationCore.Load('SynchronizedInputPattern_Cancel')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-synchronizedinputpattern_startlistening
  public static SynchronizedInputPattern_StartListening(hobj: HUIAPATTERNOBJECT, inputType: SynchronizedInputType): HRESULT {
    return UIAutomationCore.Load('SynchronizedInputPattern_StartListening')(hobj, inputType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textpattern_get_documentrange
  public static TextPattern_get_DocumentRange(hobj: HUIAPATTERNOBJECT, pRetVal: PHUIATEXTRANGE): HRESULT {
    return UIAutomationCore.Load('TextPattern_get_DocumentRange')(hobj, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textpattern_get_supportedtextselection
  public static TextPattern_get_SupportedTextSelection(hobj: HUIAPATTERNOBJECT, pRetVal: PSupportedTextSelection): HRESULT {
    return UIAutomationCore.Load('TextPattern_get_SupportedTextSelection')(hobj, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textpattern_getselection
  public static TextPattern_GetSelection(hobj: HUIAPATTERNOBJECT, pRetVal: PSAFEARRAY): HRESULT {
    return UIAutomationCore.Load('TextPattern_GetSelection')(hobj, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textpattern_getvisibleranges
  public static TextPattern_GetVisibleRanges(hobj: HUIAPATTERNOBJECT, pRetVal: PSAFEARRAY): HRESULT {
    return UIAutomationCore.Load('TextPattern_GetVisibleRanges')(hobj, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textpattern_rangefromchild
  public static TextPattern_RangeFromChild(hobj: HUIAPATTERNOBJECT, hnodeChild: HUIANODE, pRetVal: PHUIATEXTRANGE): HRESULT {
    return UIAutomationCore.Load('TextPattern_RangeFromChild')(hobj, hnodeChild, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textpattern_rangefrompoint
  public static TextPattern_RangeFromPoint(hobj: HUIAPATTERNOBJECT, point: UiaPoint, pRetVal: PHUIATEXTRANGE): HRESULT {
    return UIAutomationCore.Load('TextPattern_RangeFromPoint')(hobj, point, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_addtoselection
  public static TextRange_AddToSelection(hobj: HUIATEXTRANGE): HRESULT {
    return UIAutomationCore.Load('TextRange_AddToSelection')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_clone
  public static TextRange_Clone(hobj: HUIATEXTRANGE, pRetVal: PHUIATEXTRANGE): HRESULT {
    return UIAutomationCore.Load('TextRange_Clone')(hobj, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_compare
  public static TextRange_Compare(hobj: HUIATEXTRANGE, range: HUIATEXTRANGE, pRetVal: PBOOL): HRESULT {
    return UIAutomationCore.Load('TextRange_Compare')(hobj, range, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_compareendpoints
  public static TextRange_CompareEndpoints(hobj: HUIATEXTRANGE, endpoint: TextPatternRangeEndpoint, targetRange: HUIATEXTRANGE, targetEndpoint: TextPatternRangeEndpoint, pRetVal: PINT): HRESULT {
    return UIAutomationCore.Load('TextRange_CompareEndpoints')(hobj, endpoint, targetRange, targetEndpoint, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_expandtoenclosingunit
  public static TextRange_ExpandToEnclosingUnit(hobj: HUIATEXTRANGE, unit: TextUnit): HRESULT {
    return UIAutomationCore.Load('TextRange_ExpandToEnclosingUnit')(hobj, unit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_findattribute
  public static TextRange_FindAttribute(hobj: HUIATEXTRANGE, attributeId: TEXTATTRIBUTEID, val: VARIANT, backward: BOOL, pRetVal: PHUIATEXTRANGE): HRESULT {
    return UIAutomationCore.Load('TextRange_FindAttribute')(hobj, attributeId, val, backward, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_findtext
  public static TextRange_FindText(hobj: HUIATEXTRANGE, text: BSTR, backward: BOOL, ignoreCase: BOOL, pRetVal: PHUIATEXTRANGE): HRESULT {
    return UIAutomationCore.Load('TextRange_FindText')(hobj, text, backward, ignoreCase, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_getattributevalue
  public static TextRange_GetAttributeValue(hobj: HUIATEXTRANGE, attributeId: TEXTATTRIBUTEID, pRetVal: PVARIANT): HRESULT {
    return UIAutomationCore.Load('TextRange_GetAttributeValue')(hobj, attributeId, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_getboundingrectangles
  public static TextRange_GetBoundingRectangles(hobj: HUIATEXTRANGE, pRetVal: PSAFEARRAY): HRESULT {
    return UIAutomationCore.Load('TextRange_GetBoundingRectangles')(hobj, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_getchildren
  public static TextRange_GetChildren(hobj: HUIATEXTRANGE, pRetVal: PSAFEARRAY): HRESULT {
    return UIAutomationCore.Load('TextRange_GetChildren')(hobj, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_getenclosingelement
  public static TextRange_GetEnclosingElement(hobj: HUIATEXTRANGE, pRetVal: PHUIANODE): HRESULT {
    return UIAutomationCore.Load('TextRange_GetEnclosingElement')(hobj, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_gettext
  public static TextRange_GetText(hobj: HUIATEXTRANGE, maxLength: int, pRetVal: PBSTR): HRESULT {
    return UIAutomationCore.Load('TextRange_GetText')(hobj, maxLength, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_move
  public static TextRange_Move(hobj: HUIATEXTRANGE, unit: TextUnit, count: int, pRetVal: PINT): HRESULT {
    return UIAutomationCore.Load('TextRange_Move')(hobj, unit, count, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_moveendpointbyrange
  public static TextRange_MoveEndpointByRange(hobj: HUIATEXTRANGE, endpoint: TextPatternRangeEndpoint, targetRange: HUIATEXTRANGE, targetEndpoint: TextPatternRangeEndpoint): HRESULT {
    return UIAutomationCore.Load('TextRange_MoveEndpointByRange')(hobj, endpoint, targetRange, targetEndpoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_moveendpointbyunit
  public static TextRange_MoveEndpointByUnit(hobj: HUIATEXTRANGE, endpoint: TextPatternRangeEndpoint, unit: TextUnit, count: int, pRetVal: PINT): HRESULT {
    return UIAutomationCore.Load('TextRange_MoveEndpointByUnit')(hobj, endpoint, unit, count, pRetVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_removefromselection
  public static TextRange_RemoveFromSelection(hobj: HUIATEXTRANGE): HRESULT {
    return UIAutomationCore.Load('TextRange_RemoveFromSelection')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_scrollintoview
  public static TextRange_ScrollIntoView(hobj: HUIATEXTRANGE, alignToTop: BOOL): HRESULT {
    return UIAutomationCore.Load('TextRange_ScrollIntoView')(hobj, alignToTop);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-textrange_select
  public static TextRange_Select(hobj: HUIATEXTRANGE): HRESULT {
    return UIAutomationCore.Load('TextRange_Select')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-togglepattern_toggle
  public static TogglePattern_Toggle(hobj: HUIAPATTERNOBJECT): HRESULT {
    return UIAutomationCore.Load('TogglePattern_Toggle')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-transformpattern_move
  public static TransformPattern_Move(hobj: HUIAPATTERNOBJECT, x: number, y: number): HRESULT {
    return UIAutomationCore.Load('TransformPattern_Move')(hobj, x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-transformpattern_resize
  public static TransformPattern_Resize(hobj: HUIAPATTERNOBJECT, width: number, height: number): HRESULT {
    return UIAutomationCore.Load('TransformPattern_Resize')(hobj, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-transformpattern_rotate
  public static TransformPattern_Rotate(hobj: HUIAPATTERNOBJECT, degrees: number): HRESULT {
    return UIAutomationCore.Load('TransformPattern_Rotate')(hobj, degrees);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaaddevent
  public static UiaAddEvent(hnode: HUIANODE, eventId: EVENTID, pCallback: UiaEventCallback, scope: TreeScope, pProperties: PPROPERTYID | NULL, cProperties: int, pRequest: UiaCacheRequest, phEvent: PHUIAEVENT): HRESULT {
    return UIAutomationCore.Load('UiaAddEvent')(hnode, eventId, pCallback, scope, pProperties, cProperties, pRequest, phEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaclientsarelistening
  public static UiaClientsAreListening(): BOOL {
    return UIAutomationCore.Load('UiaClientsAreListening')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiadisconnectallproviders
  public static UiaDisconnectAllProviders(): HRESULT {
    return UIAutomationCore.Load('UiaDisconnectAllProviders')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiadisconnectprovider
  public static UiaDisconnectProvider(pProvider: IRawElementProviderSimple): HRESULT {
    return UIAutomationCore.Load('UiaDisconnectProvider')(pProvider);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaeventaddwindow
  public static UiaEventAddWindow(hEvent: HUIAEVENT, hwnd: HWND): HRESULT {
    return UIAutomationCore.Load('UiaEventAddWindow')(hEvent, hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaeventremovewindow
  public static UiaEventRemoveWindow(hEvent: HUIAEVENT, hwnd: HWND): HRESULT {
    return UIAutomationCore.Load('UiaEventRemoveWindow')(hEvent, hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiafind
  public static UiaFind(hnode: HUIANODE, pParams: UiaFindParams, pRequest: UiaCacheRequest, ppRequestedData: PSAFEARRAY, ppOffsets: PSAFEARRAY, ppTreeStructures: PSAFEARRAY): HRESULT {
    return UIAutomationCore.Load('UiaFind')(hnode, pParams, pRequest, ppRequestedData, ppOffsets, ppTreeStructures);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiageterrordescription
  public static UiaGetErrorDescription(pDescription: PBSTR): BOOL {
    return UIAutomationCore.Load('UiaGetErrorDescription')(pDescription);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiagetpatternprovider
  public static UiaGetPatternProvider(hnode: HUIANODE, patternId: PATTERNID, phobj: PHUIAPATTERNOBJECT): HRESULT {
    return UIAutomationCore.Load('UiaGetPatternProvider')(hnode, patternId, phobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiagetpropertyvalue
  public static UiaGetPropertyValue(hnode: HUIANODE, propertyId: PROPERTYID, pValue: PVARIANT): HRESULT {
    return UIAutomationCore.Load('UiaGetPropertyValue')(hnode, propertyId, pValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiagetreservedmixedattributevalue
  public static UiaGetReservedMixedAttributeValue(punkMixedAttributeValue: PPIUnknown): HRESULT {
    return UIAutomationCore.Load('UiaGetReservedMixedAttributeValue')(punkMixedAttributeValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiagetreservednotsupportedvalue
  public static UiaGetReservedNotSupportedValue(punkNotSupportedValue: PPIUnknown): HRESULT {
    return UIAutomationCore.Load('UiaGetReservedNotSupportedValue')(punkNotSupportedValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiagetrootnode
  public static UiaGetRootNode(phnode: PHUIANODE): HRESULT {
    return UIAutomationCore.Load('UiaGetRootNode')(phnode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiagetruntimeid
  public static UiaGetRuntimeId(hnode: HUIANODE, pruntimeId: PSAFEARRAY): HRESULT {
    return UIAutomationCore.Load('UiaGetRuntimeId')(hnode, pruntimeId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiagetupdatedcache
  public static UiaGetUpdatedCache(hnode: HUIANODE, pRequest: UiaCacheRequest, normalizeState: NormalizeState, pNormalizeCondition: UiaCondition, ppRequestedData: PSAFEARRAY, ppTreeStructure: PBSTR): HRESULT {
    return UIAutomationCore.Load('UiaGetUpdatedCache')(hnode, pRequest, normalizeState, pNormalizeCondition, ppRequestedData, ppTreeStructure);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiahasserversideprovider
  public static UiaHasServerSideProvider(hwnd: HWND): BOOL {
    return UIAutomationCore.Load('UiaHasServerSideProvider')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiahostproviderfromhwnd
  public static UiaHostProviderFromHwnd(hwnd: HWND, ppProvider: PPIRawElementProviderSimple): HRESULT {
    return UIAutomationCore.Load('UiaHostProviderFromHwnd')(hwnd, ppProvider);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiahpatternobjectfromvariant
  public static UiaHPatternObjectFromVariant(pvar: PVARIANT, phobj: PHUIAPATTERNOBJECT): HRESULT {
    return UIAutomationCore.Load('UiaHPatternObjectFromVariant')(pvar, phobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiahtextrangefromvariant
  public static UiaHTextRangeFromVariant(pvar: PVARIANT, phtextrange: PHUIATEXTRANGE): HRESULT {
    return UIAutomationCore.Load('UiaHTextRangeFromVariant')(pvar, phtextrange);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiahuianodefromvariant
  public static UiaHUiaNodeFromVariant(pvar: PVARIANT, phnode: PHUIANODE): HRESULT {
    return UIAutomationCore.Load('UiaHUiaNodeFromVariant')(pvar, phnode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaiaccessiblefromprovider
  public static UiaIAccessibleFromProvider(pProvider: IRawElementProviderSimple, dwFlags: DWORD, ppAccessible: PPIAccessible, pvarChild: PVARIANT): HRESULT {
    return UIAutomationCore.Load('UiaIAccessibleFromProvider')(pProvider, dwFlags, ppAccessible, pvarChild);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uialookupid
  public static UiaLookupId(type: AutomationIdentifierType, pGuid: GUID): int {
    return UIAutomationCore.Load('UiaLookupId')(type, pGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uianavigate
  public static UiaNavigate(hnode: HUIANODE, direction: NavigateDirection, pCondition: UiaCondition, pRequest: UiaCacheRequest, ppRequestedData: PSAFEARRAY, ppTreeStructure: PBSTR): HRESULT {
    return UIAutomationCore.Load('UiaNavigate')(hnode, direction, pCondition, pRequest, ppRequestedData, ppTreeStructure);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uianodefromfocus
  public static UiaNodeFromFocus(pRequest: UiaCacheRequest, ppRequestedData: PSAFEARRAY, ppTreeStructure: PBSTR): HRESULT {
    return UIAutomationCore.Load('UiaNodeFromFocus')(pRequest, ppRequestedData, ppTreeStructure);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uianodefromhandle
  public static UiaNodeFromHandle(hwnd: HWND, phnode: PHUIANODE): HRESULT {
    return UIAutomationCore.Load('UiaNodeFromHandle')(hwnd, phnode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uianodefrompoint
  public static UiaNodeFromPoint(x: number, y: number, pRequest: UiaCacheRequest, ppRequestedData: PSAFEARRAY, ppTreeStructure: PBSTR): HRESULT {
    return UIAutomationCore.Load('UiaNodeFromPoint')(x, y, pRequest, ppRequestedData, ppTreeStructure);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uianodefromprovider
  public static UiaNodeFromProvider(pProvider: IRawElementProviderSimple, phnode: PHUIANODE): HRESULT {
    return UIAutomationCore.Load('UiaNodeFromProvider')(pProvider, phnode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uianoderelease
  public static UiaNodeRelease(hnode: HUIANODE): BOOL {
    return UIAutomationCore.Load('UiaNodeRelease')(hnode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiapatternrelease
  public static UiaPatternRelease(hobj: HUIAPATTERNOBJECT): BOOL {
    return UIAutomationCore.Load('UiaPatternRelease')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaproviderfornonclient
  public static UiaProviderForNonClient(hwnd: HWND, idObject: LONG, idChild: LONG, ppProvider: PPIRawElementProviderSimple): HRESULT {
    return UIAutomationCore.Load('UiaProviderForNonClient')(hwnd, idObject, idChild, ppProvider);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaproviderfromiaccessible
  public static UiaProviderFromIAccessible(pAccessible: IAccessible, idChild: LONG, dwFlags: DWORD, ppProvider: PPIRawElementProviderSimple): HRESULT {
    return UIAutomationCore.Load('UiaProviderFromIAccessible')(pAccessible, idChild, dwFlags, ppProvider);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaraiseactivetextpositionchangedevent
  public static UiaRaiseActiveTextPositionChangedEvent(provider: IRawElementProviderSimple, textRange: ITextRangeProvider | NULL): HRESULT {
    return UIAutomationCore.Load('UiaRaiseActiveTextPositionChangedEvent')(provider, textRange);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaraiseasynccontentloadedevent
  public static UiaRaiseAsyncContentLoadedEvent(pProvider: IRawElementProviderSimple, asyncContentLoadedState: AsyncContentLoadedState, percentComplete: number): HRESULT {
    return UIAutomationCore.Load('UiaRaiseAsyncContentLoadedEvent')(pProvider, asyncContentLoadedState, percentComplete);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaraiseautomationevent
  public static UiaRaiseAutomationEvent(pProvider: IRawElementProviderSimple, id: EVENTID): HRESULT {
    return UIAutomationCore.Load('UiaRaiseAutomationEvent')(pProvider, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaraiseautomationpropertychangedevent
  public static UiaRaiseAutomationPropertyChangedEvent(pProvider: IRawElementProviderSimple, id: PROPERTYID, oldValue: VARIANT, newValue: VARIANT): HRESULT {
    return UIAutomationCore.Load('UiaRaiseAutomationPropertyChangedEvent')(pProvider, id, oldValue, newValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaraisechangesevent
  public static UiaRaiseChangesEvent(pProvider: IRawElementProviderSimple, eventIdCount: int, pUiaChanges: UiaChangeInfo): HRESULT {
    return UIAutomationCore.Load('UiaRaiseChangesEvent')(pProvider, eventIdCount, pUiaChanges);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaraisenotificationevent
  public static UiaRaiseNotificationEvent(provider: IRawElementProviderSimple, notificationKind: NotificationKind, notificationProcessing: NotificationProcessing, displayString: BSTR | NULL, activityId: BSTR): HRESULT {
    return UIAutomationCore.Load('UiaRaiseNotificationEvent')(provider, notificationKind, notificationProcessing, displayString, activityId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaraisestructurechangedevent
  public static UiaRaiseStructureChangedEvent(pProvider: IRawElementProviderSimple, structureChangeType: StructureChangeType, pRuntimeId: PINT, cRuntimeIdLen: int): HRESULT {
    return UIAutomationCore.Load('UiaRaiseStructureChangedEvent')(pProvider, structureChangeType, pRuntimeId, cRuntimeIdLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaraisetextedittextchangedevent
  public static UiaRaiseTextEditTextChangedEvent(pProvider: IRawElementProviderSimple, textEditChangeType: TextEditChangeType, pChangedData: SAFEARRAY): HRESULT {
    return UIAutomationCore.Load('UiaRaiseTextEditTextChangedEvent')(pProvider, textEditChangeType, pChangedData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaregisterprovidercallback
  public static UiaRegisterProviderCallback(pCallback: UiaProviderCallback): void {
    return UIAutomationCore.Load('UiaRegisterProviderCallback')(pCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiaremoveevent
  public static UiaRemoveEvent(hEvent: HUIAEVENT): HRESULT {
    return UIAutomationCore.Load('UiaRemoveEvent')(hEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiareturnrawelementprovider
  public static UiaReturnRawElementProvider(hwnd: HWND, wParam: WPARAM, lParam: LPARAM, el: IRawElementProviderSimple | NULL): LRESULT {
    return UIAutomationCore.Load('UiaReturnRawElementProvider')(hwnd, wParam, lParam, el);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiasetfocus
  public static UiaSetFocus(hnode: HUIANODE): HRESULT {
    return UIAutomationCore.Load('UiaSetFocus')(hnode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-uiatextrangerelease
  public static UiaTextRangeRelease(hobj: HUIATEXTRANGE): BOOL {
    return UIAutomationCore.Load('UiaTextRangeRelease')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-valuepattern_setvalue
  public static ValuePattern_SetValue(hobj: HUIAPATTERNOBJECT, pVal: LPCWSTR): HRESULT {
    return UIAutomationCore.Load('ValuePattern_SetValue')(hobj, pVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-virtualizeditempattern_realize
  public static VirtualizedItemPattern_Realize(hobj: HUIAPATTERNOBJECT): HRESULT {
    return UIAutomationCore.Load('VirtualizedItemPattern_Realize')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-windowpattern_close
  public static WindowPattern_Close(hobj: HUIAPATTERNOBJECT): HRESULT {
    return UIAutomationCore.Load('WindowPattern_Close')(hobj);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-windowpattern_setwindowvisualstate
  public static WindowPattern_SetWindowVisualState(hobj: HUIAPATTERNOBJECT, state: WindowVisualState): HRESULT {
    return UIAutomationCore.Load('WindowPattern_SetWindowVisualState')(hobj, state);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uiautomationcoreapi/nf-uiautomationcoreapi-windowpattern_waitforinputidle
  public static WindowPattern_WaitForInputIdle(hobj: HUIAPATTERNOBJECT, milliseconds: int, pResult: PBOOL): HRESULT {
    return UIAutomationCore.Load('WindowPattern_WaitForInputIdle')(hobj, milliseconds, pResult);
  }

}

export default UIAutomationCore;
