import { type FFIFunction, FFIType } from 'bun:ffi';
import { Win32 } from '@bun-win32/core';

import type {
  BOOLEAN,
  HANDLE,
  HIDP_KEYBOARD_DIRECTION,
  HIDP_REPORT_TYPE,
  LONG,
  LPGUID,
  NTSTATUS,
  NULL,
  PCHAR,
  PHIDD_ATTRIBUTES,
  PHIDD_CONFIGURATION,
  PHIDP_BUTTON_ARRAY_DATA,
  PHIDP_BUTTON_CAPS,
  PHIDP_CAPS,
  PHIDP_DATA,
  PHIDP_EXTENDED_ATTRIBUTES,
  PHIDP_INSERT_SCANCODES,
  PHIDP_KEYBOARD_MODIFIER_STATE,
  PHIDP_LINK_COLLECTION_NODE,
  PHIDP_PREPARSED_DATA,
  PHIDP_VALUE_CAPS,
  PLONG,
  PULONG,
  PUSAGE,
  PUSAGE_AND_PAGE,
  PUSHORT,
  PVOID,
  UCHAR,
  ULONG,
  USAGE,
  USHORT,
  VOID,
} from '../types/Hid';

/**
 * Thin, lazy-loaded FFI bindings for `hid.dll`.
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
 * import Hid from './structs/Hid';
 *
 * // Lazy: bind on first call
 * const guidBuf = Buffer.alloc(16);
 * Hid.HidD_GetHidGuid(guidBuf.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Hid.Preload(['HidD_GetHidGuid', 'HidP_GetCaps']);
 * ```
 */
class Hid extends Win32 {
  protected static override name = 'hid.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    HidD_FlushQueue: { args: [FFIType.u64], returns: FFIType.u8 },
    HidD_FreePreparsedData: { args: [FFIType.ptr], returns: FFIType.u8 },
    HidD_GetAttributes: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u8 },
    HidD_GetConfiguration: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u8 },
    HidD_GetFeature: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u8 },
    HidD_GetHidGuid: { args: [FFIType.ptr], returns: FFIType.void },
    HidD_GetIndexedString: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u8 },
    HidD_GetInputReport: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u8 },
    HidD_GetManufacturerString: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u8 },
    HidD_GetNumInputBuffers: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u8 },
    HidD_GetPhysicalDescriptor: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u8 },
    HidD_GetPreparsedData: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u8 },
    HidD_GetProductString: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u8 },
    HidD_GetSerialNumberString: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u8 },
    HidD_SetConfiguration: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u8 },
    HidD_SetFeature: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u8 },
    HidD_SetNumInputBuffers: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u8 },
    HidD_SetOutputReport: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u8 },
    HidP_GetButtonArray: { args: [FFIType.i32, FFIType.u16, FFIType.u16, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HidP_GetButtonCaps: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    HidP_GetCaps: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    HidP_GetData: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HidP_GetExtendedAttributes: { args: [FFIType.i32, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    HidP_GetLinkCollectionNodes: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    HidP_GetScaledUsageValue: { args: [FFIType.i32, FFIType.u16, FFIType.u16, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HidP_GetSpecificButtonCaps: { args: [FFIType.i32, FFIType.u16, FFIType.u16, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    HidP_GetSpecificValueCaps: { args: [FFIType.i32, FFIType.u16, FFIType.u16, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    HidP_GetUsageValue: { args: [FFIType.i32, FFIType.u16, FFIType.u16, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HidP_GetUsageValueArray: { args: [FFIType.i32, FFIType.u16, FFIType.u16, FFIType.u16, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HidP_GetUsages: { args: [FFIType.i32, FFIType.u16, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HidP_GetUsagesEx: { args: [FFIType.i32, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HidP_GetValueCaps: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    HidP_InitializeReportForID: { args: [FFIType.i32, FFIType.u8, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HidP_MaxDataListLength: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    HidP_MaxUsageListLength: { args: [FFIType.i32, FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    HidP_SetButtonArray: { args: [FFIType.i32, FFIType.u16, FFIType.u16, FFIType.u16, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HidP_SetData: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HidP_SetScaledUsageValue: { args: [FFIType.i32, FFIType.u16, FFIType.u16, FFIType.u16, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HidP_SetUsageValue: { args: [FFIType.i32, FFIType.u16, FFIType.u16, FFIType.u16, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HidP_SetUsageValueArray: { args: [FFIType.i32, FFIType.u16, FFIType.u16, FFIType.u16, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HidP_SetUsages: { args: [FFIType.i32, FFIType.u16, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HidP_TranslateUsagesToI8042ScanCodes: { args: [FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    HidP_UnsetUsages: { args: [FFIType.i32, FFIType.u16, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HidP_UsageListDifference: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_flushqueue
  public static HidD_FlushQueue(HidDeviceObject: HANDLE): BOOLEAN {
    return Hid.Load('HidD_FlushQueue')(HidDeviceObject);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_freepreparseddata
  public static HidD_FreePreparsedData(PreparsedData: PHIDP_PREPARSED_DATA): BOOLEAN {
    return Hid.Load('HidD_FreePreparsedData')(PreparsedData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getattributes
  public static HidD_GetAttributes(HidDeviceObject: HANDLE, Attributes: PHIDD_ATTRIBUTES): BOOLEAN {
    return Hid.Load('HidD_GetAttributes')(HidDeviceObject, Attributes);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getconfiguration
  public static HidD_GetConfiguration(HidDeviceObject: HANDLE, Configuration: PHIDD_CONFIGURATION, ConfigurationLength: ULONG): BOOLEAN {
    return Hid.Load('HidD_GetConfiguration')(HidDeviceObject, Configuration, ConfigurationLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getfeature
  public static HidD_GetFeature(HidDeviceObject: HANDLE, ReportBuffer: PVOID, ReportBufferLength: ULONG): BOOLEAN {
    return Hid.Load('HidD_GetFeature')(HidDeviceObject, ReportBuffer, ReportBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_gethidguid
  public static HidD_GetHidGuid(HidGuid: LPGUID): VOID {
    return Hid.Load('HidD_GetHidGuid')(HidGuid);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getindexedstring
  public static HidD_GetIndexedString(HidDeviceObject: HANDLE, StringIndex: ULONG, Buffer: PVOID, BufferLength: ULONG): BOOLEAN {
    return Hid.Load('HidD_GetIndexedString')(HidDeviceObject, StringIndex, Buffer, BufferLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getinputreport
  public static HidD_GetInputReport(HidDeviceObject: HANDLE, ReportBuffer: PVOID, ReportBufferLength: ULONG): BOOLEAN {
    return Hid.Load('HidD_GetInputReport')(HidDeviceObject, ReportBuffer, ReportBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getmanufacturerstring
  public static HidD_GetManufacturerString(HidDeviceObject: HANDLE, Buffer: PVOID, BufferLength: ULONG): BOOLEAN {
    return Hid.Load('HidD_GetManufacturerString')(HidDeviceObject, Buffer, BufferLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getnuminputbuffers
  public static HidD_GetNumInputBuffers(HidDeviceObject: HANDLE, NumberBuffers: PULONG): BOOLEAN {
    return Hid.Load('HidD_GetNumInputBuffers')(HidDeviceObject, NumberBuffers);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getphysicaldescriptor
  public static HidD_GetPhysicalDescriptor(HidDeviceObject: HANDLE, Buffer: PVOID, BufferLength: ULONG): BOOLEAN {
    return Hid.Load('HidD_GetPhysicalDescriptor')(HidDeviceObject, Buffer, BufferLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getpreparseddata
  public static HidD_GetPreparsedData(HidDeviceObject: HANDLE, PreparsedData: PVOID): BOOLEAN {
    return Hid.Load('HidD_GetPreparsedData')(HidDeviceObject, PreparsedData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getproductstring
  public static HidD_GetProductString(HidDeviceObject: HANDLE, Buffer: PVOID, BufferLength: ULONG): BOOLEAN {
    return Hid.Load('HidD_GetProductString')(HidDeviceObject, Buffer, BufferLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getserialnumberstring
  public static HidD_GetSerialNumberString(HidDeviceObject: HANDLE, Buffer: PVOID, BufferLength: ULONG): BOOLEAN {
    return Hid.Load('HidD_GetSerialNumberString')(HidDeviceObject, Buffer, BufferLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_setconfiguration
  public static HidD_SetConfiguration(HidDeviceObject: HANDLE, Configuration: PHIDD_CONFIGURATION, ConfigurationLength: ULONG): BOOLEAN {
    return Hid.Load('HidD_SetConfiguration')(HidDeviceObject, Configuration, ConfigurationLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_setfeature
  public static HidD_SetFeature(HidDeviceObject: HANDLE, ReportBuffer: PVOID, ReportBufferLength: ULONG): BOOLEAN {
    return Hid.Load('HidD_SetFeature')(HidDeviceObject, ReportBuffer, ReportBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_setnuminputbuffers
  public static HidD_SetNumInputBuffers(HidDeviceObject: HANDLE, NumberBuffers: ULONG): BOOLEAN {
    return Hid.Load('HidD_SetNumInputBuffers')(HidDeviceObject, NumberBuffers);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_setoutputreport
  public static HidD_SetOutputReport(HidDeviceObject: HANDLE, ReportBuffer: PVOID, ReportBufferLength: ULONG): BOOLEAN {
    return Hid.Load('HidD_SetOutputReport')(HidDeviceObject, ReportBuffer, ReportBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_getbuttonarray
  public static HidP_GetButtonArray(
    ReportType: HIDP_REPORT_TYPE,
    UsagePage: USAGE,
    LinkCollection: USHORT,
    Usage: USAGE,
    ButtonData: PHIDP_BUTTON_ARRAY_DATA,
    ButtonDataLength: PUSHORT,
    PreparsedData: PHIDP_PREPARSED_DATA,
    Report: PCHAR,
    ReportLength: ULONG,
  ): NTSTATUS {
    return Hid.Load('HidP_GetButtonArray')(ReportType, UsagePage, LinkCollection, Usage, ButtonData, ButtonDataLength, PreparsedData, Report, ReportLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_getbuttoncaps
  public static HidP_GetButtonCaps(ReportType: HIDP_REPORT_TYPE, ButtonCaps: PHIDP_BUTTON_CAPS, ButtonCapsLength: PUSHORT, PreparsedData: PHIDP_PREPARSED_DATA): NTSTATUS {
    return Hid.Load('HidP_GetButtonCaps')(ReportType, ButtonCaps, ButtonCapsLength, PreparsedData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_getcaps
  public static HidP_GetCaps(PreparsedData: PHIDP_PREPARSED_DATA, Capabilities: PHIDP_CAPS): NTSTATUS {
    return Hid.Load('HidP_GetCaps')(PreparsedData, Capabilities);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_getdata
  public static HidP_GetData(ReportType: HIDP_REPORT_TYPE, DataList: PHIDP_DATA, DataLength: PULONG, PreparsedData: PHIDP_PREPARSED_DATA, Report: PCHAR, ReportLength: ULONG): NTSTATUS {
    return Hid.Load('HidP_GetData')(ReportType, DataList, DataLength, PreparsedData, Report, ReportLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_getextendedattributes
  public static HidP_GetExtendedAttributes(ReportType: HIDP_REPORT_TYPE, DataIndex: USHORT, PreparsedData: PHIDP_PREPARSED_DATA, Attributes: PHIDP_EXTENDED_ATTRIBUTES, LengthAttributes: PULONG): NTSTATUS {
    return Hid.Load('HidP_GetExtendedAttributes')(ReportType, DataIndex, PreparsedData, Attributes, LengthAttributes);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_getlinkcollectionnodes
  public static HidP_GetLinkCollectionNodes(LinkCollectionNodes: PHIDP_LINK_COLLECTION_NODE, LinkCollectionNodesLength: PULONG, PreparsedData: PHIDP_PREPARSED_DATA): NTSTATUS {
    return Hid.Load('HidP_GetLinkCollectionNodes')(LinkCollectionNodes, LinkCollectionNodesLength, PreparsedData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_getscaledusagevalue
  public static HidP_GetScaledUsageValue(ReportType: HIDP_REPORT_TYPE, UsagePage: USAGE, LinkCollection: USHORT, Usage: USAGE, UsageValue: PLONG, PreparsedData: PHIDP_PREPARSED_DATA, Report: PCHAR, ReportLength: ULONG): NTSTATUS {
    return Hid.Load('HidP_GetScaledUsageValue')(ReportType, UsagePage, LinkCollection, Usage, UsageValue, PreparsedData, Report, ReportLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_getspecificbuttoncaps
  public static HidP_GetSpecificButtonCaps(ReportType: HIDP_REPORT_TYPE, UsagePage: USAGE, LinkCollection: USHORT, Usage: USAGE, ButtonCaps: PHIDP_BUTTON_CAPS, ButtonCapsLength: PUSHORT, PreparsedData: PHIDP_PREPARSED_DATA): NTSTATUS {
    return Hid.Load('HidP_GetSpecificButtonCaps')(ReportType, UsagePage, LinkCollection, Usage, ButtonCaps, ButtonCapsLength, PreparsedData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_getspecificvaluecaps
  public static HidP_GetSpecificValueCaps(ReportType: HIDP_REPORT_TYPE, UsagePage: USAGE, LinkCollection: USHORT, Usage: USAGE, ValueCaps: PHIDP_VALUE_CAPS, ValueCapsLength: PUSHORT, PreparsedData: PHIDP_PREPARSED_DATA): NTSTATUS {
    return Hid.Load('HidP_GetSpecificValueCaps')(ReportType, UsagePage, LinkCollection, Usage, ValueCaps, ValueCapsLength, PreparsedData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_getusagevalue
  public static HidP_GetUsageValue(ReportType: HIDP_REPORT_TYPE, UsagePage: USAGE, LinkCollection: USHORT, Usage: USAGE, UsageValue: PULONG, PreparsedData: PHIDP_PREPARSED_DATA, Report: PCHAR, ReportLength: ULONG): NTSTATUS {
    return Hid.Load('HidP_GetUsageValue')(ReportType, UsagePage, LinkCollection, Usage, UsageValue, PreparsedData, Report, ReportLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_getusagevaluearray
  public static HidP_GetUsageValueArray(
    ReportType: HIDP_REPORT_TYPE,
    UsagePage: USAGE,
    LinkCollection: USHORT,
    Usage: USAGE,
    UsageValue: PCHAR,
    UsageValueByteLength: USHORT,
    PreparsedData: PHIDP_PREPARSED_DATA,
    Report: PCHAR,
    ReportLength: ULONG,
  ): NTSTATUS {
    return Hid.Load('HidP_GetUsageValueArray')(ReportType, UsagePage, LinkCollection, Usage, UsageValue, UsageValueByteLength, PreparsedData, Report, ReportLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_getusages
  public static HidP_GetUsages(ReportType: HIDP_REPORT_TYPE, UsagePage: USAGE, LinkCollection: USHORT, UsageList: PUSAGE, UsageLength: PULONG, PreparsedData: PHIDP_PREPARSED_DATA, Report: PCHAR, ReportLength: ULONG): NTSTATUS {
    return Hid.Load('HidP_GetUsages')(ReportType, UsagePage, LinkCollection, UsageList, UsageLength, PreparsedData, Report, ReportLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_getusagesex
  public static HidP_GetUsagesEx(ReportType: HIDP_REPORT_TYPE, LinkCollection: USHORT, ButtonList: PUSAGE_AND_PAGE, UsageLength: PULONG, PreparsedData: PHIDP_PREPARSED_DATA, Report: PCHAR, ReportLength: ULONG): NTSTATUS {
    return Hid.Load('HidP_GetUsagesEx')(ReportType, LinkCollection, ButtonList, UsageLength, PreparsedData, Report, ReportLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_getvaluecaps
  public static HidP_GetValueCaps(ReportType: HIDP_REPORT_TYPE, ValueCaps: PHIDP_VALUE_CAPS, ValueCapsLength: PUSHORT, PreparsedData: PHIDP_PREPARSED_DATA): NTSTATUS {
    return Hid.Load('HidP_GetValueCaps')(ReportType, ValueCaps, ValueCapsLength, PreparsedData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_initializereportforid
  public static HidP_InitializeReportForID(ReportType: HIDP_REPORT_TYPE, ReportID: UCHAR, PreparsedData: PHIDP_PREPARSED_DATA, Report: PCHAR, ReportLength: ULONG): NTSTATUS {
    return Hid.Load('HidP_InitializeReportForID')(ReportType, ReportID, PreparsedData, Report, ReportLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_maxdatalistlength
  public static HidP_MaxDataListLength(ReportType: HIDP_REPORT_TYPE, PreparsedData: PHIDP_PREPARSED_DATA): ULONG {
    return Hid.Load('HidP_MaxDataListLength')(ReportType, PreparsedData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_maxusagelistlength
  public static HidP_MaxUsageListLength(ReportType: HIDP_REPORT_TYPE, UsagePage: USAGE, PreparsedData: PHIDP_PREPARSED_DATA): ULONG {
    return Hid.Load('HidP_MaxUsageListLength')(ReportType, UsagePage, PreparsedData);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_setbuttonarray
  public static HidP_SetButtonArray(
    ReportType: HIDP_REPORT_TYPE,
    UsagePage: USAGE,
    LinkCollection: USHORT,
    Usage: USAGE,
    ButtonData: PHIDP_BUTTON_ARRAY_DATA,
    ButtonDataLength: USHORT,
    PreparsedData: PHIDP_PREPARSED_DATA,
    Report: PCHAR,
    ReportLength: ULONG,
  ): NTSTATUS {
    return Hid.Load('HidP_SetButtonArray')(ReportType, UsagePage, LinkCollection, Usage, ButtonData, ButtonDataLength, PreparsedData, Report, ReportLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_setdata
  public static HidP_SetData(ReportType: HIDP_REPORT_TYPE, DataList: PHIDP_DATA, DataLength: PULONG, PreparsedData: PHIDP_PREPARSED_DATA, Report: PCHAR, ReportLength: ULONG): NTSTATUS {
    return Hid.Load('HidP_SetData')(ReportType, DataList, DataLength, PreparsedData, Report, ReportLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_setscaledusagevalue
  public static HidP_SetScaledUsageValue(ReportType: HIDP_REPORT_TYPE, UsagePage: USAGE, LinkCollection: USHORT, Usage: USAGE, UsageValue: LONG, PreparsedData: PHIDP_PREPARSED_DATA, Report: PCHAR, ReportLength: ULONG): NTSTATUS {
    return Hid.Load('HidP_SetScaledUsageValue')(ReportType, UsagePage, LinkCollection, Usage, UsageValue, PreparsedData, Report, ReportLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_setusagevalue
  public static HidP_SetUsageValue(ReportType: HIDP_REPORT_TYPE, UsagePage: USAGE, LinkCollection: USHORT, Usage: USAGE, UsageValue: ULONG, PreparsedData: PHIDP_PREPARSED_DATA, Report: PCHAR, ReportLength: ULONG): NTSTATUS {
    return Hid.Load('HidP_SetUsageValue')(ReportType, UsagePage, LinkCollection, Usage, UsageValue, PreparsedData, Report, ReportLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_setusagevaluearray
  public static HidP_SetUsageValueArray(
    ReportType: HIDP_REPORT_TYPE,
    UsagePage: USAGE,
    LinkCollection: USHORT,
    Usage: USAGE,
    UsageValue: PCHAR,
    UsageValueByteLength: USHORT,
    PreparsedData: PHIDP_PREPARSED_DATA,
    Report: PCHAR,
    ReportLength: ULONG,
  ): NTSTATUS {
    return Hid.Load('HidP_SetUsageValueArray')(ReportType, UsagePage, LinkCollection, Usage, UsageValue, UsageValueByteLength, PreparsedData, Report, ReportLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_setusages
  public static HidP_SetUsages(ReportType: HIDP_REPORT_TYPE, UsagePage: USAGE, LinkCollection: USHORT, UsageList: PUSAGE, UsageLength: PULONG, PreparsedData: PHIDP_PREPARSED_DATA, Report: PCHAR, ReportLength: ULONG): NTSTATUS {
    return Hid.Load('HidP_SetUsages')(ReportType, UsagePage, LinkCollection, UsageList, UsageLength, PreparsedData, Report, ReportLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_translateusagestoi8042scancodes
  public static HidP_TranslateUsagesToI8042ScanCodes(
    ChangedUsageList: PUSAGE,
    UsageListLength: ULONG,
    KeyAction: HIDP_KEYBOARD_DIRECTION,
    ModifierState: PHIDP_KEYBOARD_MODIFIER_STATE,
    InsertCodesProcedure: PHIDP_INSERT_SCANCODES,
    InsertCodesContext: PVOID | NULL,
  ): NTSTATUS {
    return Hid.Load('HidP_TranslateUsagesToI8042ScanCodes')(ChangedUsageList, UsageListLength, KeyAction, ModifierState, InsertCodesProcedure, InsertCodesContext);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_unsetusages
  public static HidP_UnsetUsages(ReportType: HIDP_REPORT_TYPE, UsagePage: USAGE, LinkCollection: USHORT, UsageList: PUSAGE, UsageLength: PULONG, PreparsedData: PHIDP_PREPARSED_DATA, Report: PCHAR, ReportLength: ULONG): NTSTATUS {
    return Hid.Load('HidP_UnsetUsages')(ReportType, UsagePage, LinkCollection, UsageList, UsageLength, PreparsedData, Report, ReportLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_usagelistdifference
  public static HidP_UsageListDifference(PreviousUsageList: PUSAGE, CurrentUsageList: PUSAGE, BreakUsageList: PUSAGE, MakeUsageList: PUSAGE, UsageListLength: ULONG): NTSTATUS {
    return Hid.Load('HidP_UsageListDifference')(PreviousUsageList, CurrentUsageList, BreakUsageList, MakeUsageList, UsageListLength);
  }
}

export default Hid;
