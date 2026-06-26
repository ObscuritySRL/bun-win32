import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BLUETOOTH_GATT_EVENT_HANDLE,
  BOOL,
  BTH_LE_GATT_EVENT_TYPE,
  BTH_LE_GATT_RELIABLE_WRITE_CONTEXT,
  DWORD,
  HANDLE,
  HBLUETOOTH_AUTHENTICATION_REGISTRATION,
  HBLUETOOTH_DEVICE_FIND,
  HBLUETOOTH_RADIO_FIND,
  HRESULT,
  LPBYTE,
  LPCWSTR,
  LPDWORD,
  LPVOID,
  LPWSTR,
  Nullable,
  Optional,
  PBLUETOOTH_ADDRESS,
  PBLUETOOTH_AUTHENTICATE_RESPONSE,
  PBLUETOOTH_DEVICE_INFO,
  PBLUETOOTH_DEVICE_SEARCH_PARAMS,
  PBLUETOOTH_FIND_RADIO_PARAMS,
  PBLUETOOTH_GATT_EVENT_HANDLE,
  PBLUETOOTH_LOCAL_SERVICE_INFO,
  PBLUETOOTH_RADIO_INFO,
  PBTH_LE_GATT_CHARACTERISTIC,
  PBTH_LE_GATT_CHARACTERISTIC_VALUE,
  PBTH_LE_GATT_DESCRIPTOR,
  PBTH_LE_GATT_DESCRIPTOR_VALUE,
  PBTH_LE_GATT_RELIABLE_WRITE_CONTEXT,
  PBTH_LE_GATT_SERVICE,
  PFNBLUETOOTH_GATT_EVENT_CALLBACK,
  PFN_AUTHENTICATION_CALLBACK,
  PFN_AUTHENTICATION_CALLBACK_EX,
  PFN_BLUETOOTH_ENUM_ATTRIBUTES_CALLBACK,
  PGUID,
  PHANDLE,
  PHBLUETOOTH_AUTHENTICATION_REGISTRATION,
  PHBLUETOOTH_CONTAINER_ELEMENT,
  PSDP_ELEMENT_DATA,
  PSDP_STRING_TYPE_DATA,
  PULONG,
  PUSHORT,
  PVOID,
  UCHAR,
  ULONG,
  USHORT,
} from '../types/BluetoothApis';

/**
 * Thin, lazy-loaded FFI bindings for `bluetoothapis.dll`.
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
 * import BluetoothApis from './structs/BluetoothApis';
 *
 * // Lazy: bind on first call
 * const hFind = BluetoothApis.BluetoothFindFirstRadio(params.ptr, hRadio.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * BluetoothApis.Preload(['BluetoothFindFirstRadio', 'BluetoothFindNextRadio']);
 * ```
 */
class BluetoothApis extends Win32 {
  protected static override name = 'bluetoothapis.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    BluetoothEnableDiscovery: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    BluetoothEnableIncomingConnections: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    BluetoothEnumerateInstalledServices: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    BluetoothFindDeviceClose: { args: [FFIType.u64], returns: FFIType.i32 },
    BluetoothFindFirstDevice: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    BluetoothFindFirstRadio: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    BluetoothFindNextDevice: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    BluetoothFindNextRadio: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    BluetoothFindRadioClose: { args: [FFIType.u64], returns: FFIType.i32 },
    BluetoothGATTAbortReliableWrite: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    BluetoothGATTBeginReliableWrite: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BluetoothGATTEndReliableWrite: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    BluetoothGATTGetCharacteristicValue: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BluetoothGATTGetCharacteristics: { args: [FFIType.u64, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BluetoothGATTGetDescriptorValue: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BluetoothGATTGetDescriptors: { args: [FFIType.u64, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BluetoothGATTGetIncludedServices: { args: [FFIType.u64, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BluetoothGATTGetServices: { args: [FFIType.u64, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BluetoothGATTRegisterEvent: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BluetoothGATTSetCharacteristicValue: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    BluetoothGATTSetDescriptorValue: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BluetoothGATTUnregisterEvent: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    BluetoothGetDeviceInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    BluetoothGetRadioInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    BluetoothIsConnectable: { args: [FFIType.u64], returns: FFIType.i32 },
    BluetoothIsDiscoverable: { args: [FFIType.u64], returns: FFIType.i32 },
    BluetoothIsVersionAvailable: { args: [FFIType.u8, FFIType.u8], returns: FFIType.i32 },
    BluetoothRegisterForAuthentication: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    BluetoothRegisterForAuthenticationEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    BluetoothRemoveDevice: { args: [FFIType.ptr], returns: FFIType.u32 },
    BluetoothSdpEnumAttributes: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BluetoothSdpGetAttributeValue: { args: [FFIType.ptr, FFIType.u32, FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    BluetoothSdpGetContainerElementData: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    BluetoothSdpGetElementData: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    BluetoothSdpGetString: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    BluetoothSendAuthenticationResponse: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    BluetoothSendAuthenticationResponseEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    BluetoothSetLocalServiceInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    BluetoothSetServiceState: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    BluetoothUnregisterAuthentication: { args: [FFIType.u64], returns: FFIType.i32 },
    BluetoothUpdateDeviceRecord: { args: [FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothenablediscovery
  public static BluetoothEnableDiscovery(hRadio: Optional<HANDLE>, fEnabled: BOOL): BOOL {
    return BluetoothApis.Load('BluetoothEnableDiscovery')(hRadio, fEnabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothenableincomingconnections
  public static BluetoothEnableIncomingConnections(hRadio: Optional<HANDLE>, fEnabled: BOOL): BOOL {
    return BluetoothApis.Load('BluetoothEnableIncomingConnections')(hRadio, fEnabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothenumerateinstalledservices
  public static BluetoothEnumerateInstalledServices(hRadio: Optional<HANDLE>, pbtdi: PBLUETOOTH_DEVICE_INFO, pcServiceInout_in_out: LPDWORD, pGuidServices_out: Optional<PGUID>): DWORD {
    return BluetoothApis.Load('BluetoothEnumerateInstalledServices')(hRadio, pbtdi, pcServiceInout_in_out, pGuidServices_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothfinddeviceclose
  public static BluetoothFindDeviceClose(hFind: HBLUETOOTH_DEVICE_FIND): BOOL {
    return BluetoothApis.Load('BluetoothFindDeviceClose')(hFind);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothfindfirstdevice
  public static BluetoothFindFirstDevice(pbtsp: PBLUETOOTH_DEVICE_SEARCH_PARAMS, pbtdi_in_out: PBLUETOOTH_DEVICE_INFO): HBLUETOOTH_DEVICE_FIND {
    return BluetoothApis.Load('BluetoothFindFirstDevice')(pbtsp, pbtdi_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothfindfirstradio
  public static BluetoothFindFirstRadio(pbtfrp: PBLUETOOTH_FIND_RADIO_PARAMS, phRadio_out: PHANDLE): HBLUETOOTH_RADIO_FIND {
    return BluetoothApis.Load('BluetoothFindFirstRadio')(pbtfrp, phRadio_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothfindnextdevice
  public static BluetoothFindNextDevice(hFind: HBLUETOOTH_DEVICE_FIND, pbtdi_in_out: PBLUETOOTH_DEVICE_INFO): BOOL {
    return BluetoothApis.Load('BluetoothFindNextDevice')(hFind, pbtdi_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothfindnextradio
  public static BluetoothFindNextRadio(hFind: HBLUETOOTH_RADIO_FIND, phRadio_out: PHANDLE): BOOL {
    return BluetoothApis.Load('BluetoothFindNextRadio')(hFind, phRadio_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothfindradioclose
  public static BluetoothFindRadioClose(hFind: HBLUETOOTH_RADIO_FIND): BOOL {
    return BluetoothApis.Load('BluetoothFindRadioClose')(hFind);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattabortreliablewrite
  public static BluetoothGATTAbortReliableWrite(hDevice: HANDLE, ReliableWriteContext: BTH_LE_GATT_RELIABLE_WRITE_CONTEXT, Flags: ULONG): HRESULT {
    return BluetoothApis.Load('BluetoothGATTAbortReliableWrite')(hDevice, ReliableWriteContext, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattbeginreliablewrite
  public static BluetoothGATTBeginReliableWrite(hDevice: HANDLE, ReliableWriteContext_out: PBTH_LE_GATT_RELIABLE_WRITE_CONTEXT, Flags: ULONG): HRESULT {
    return BluetoothApis.Load('BluetoothGATTBeginReliableWrite')(hDevice, ReliableWriteContext_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattendreliablewrite
  public static BluetoothGATTEndReliableWrite(hDevice: HANDLE, ReliableWriteContext: BTH_LE_GATT_RELIABLE_WRITE_CONTEXT, Flags: ULONG): HRESULT {
    return BluetoothApis.Load('BluetoothGATTEndReliableWrite')(hDevice, ReliableWriteContext, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattgetcharacteristicvalue
  public static BluetoothGATTGetCharacteristicValue(
    hDevice: HANDLE,
    Characteristic: PBTH_LE_GATT_CHARACTERISTIC,
    CharacteristicValueDataSize: ULONG,
    CharacteristicValue_out: Optional<PBTH_LE_GATT_CHARACTERISTIC_VALUE>,
    CharacteristicValueSizeRequired_out: Optional<PUSHORT>,
    Flags: ULONG,
  ): HRESULT {
    return BluetoothApis.Load('BluetoothGATTGetCharacteristicValue')(hDevice, Characteristic, CharacteristicValueDataSize, CharacteristicValue_out, CharacteristicValueSizeRequired_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattgetcharacteristics
  public static BluetoothGATTGetCharacteristics(
    hDevice: HANDLE,
    Service: Optional<PBTH_LE_GATT_SERVICE>,
    CharacteristicsBufferCount: USHORT,
    CharacteristicsBuffer_out: Optional<PBTH_LE_GATT_CHARACTERISTIC>,
    CharacteristicsBufferActual_out: PUSHORT,
    Flags: ULONG,
  ): HRESULT {
    return BluetoothApis.Load('BluetoothGATTGetCharacteristics')(hDevice, Service, CharacteristicsBufferCount, CharacteristicsBuffer_out, CharacteristicsBufferActual_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattgetdescriptorvalue
  public static BluetoothGATTGetDescriptorValue(
    hDevice: HANDLE,
    Descriptor: PBTH_LE_GATT_DESCRIPTOR,
    DescriptorValueDataSize: ULONG,
    DescriptorValue_out: Optional<PBTH_LE_GATT_DESCRIPTOR_VALUE>,
    DescriptorValueSizeRequired_out: Optional<PUSHORT>,
    Flags: ULONG,
  ): HRESULT {
    return BluetoothApis.Load('BluetoothGATTGetDescriptorValue')(hDevice, Descriptor, DescriptorValueDataSize, DescriptorValue_out, DescriptorValueSizeRequired_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattgetdescriptors
  public static BluetoothGATTGetDescriptors(
    hDevice: HANDLE,
    Characteristic: PBTH_LE_GATT_CHARACTERISTIC,
    DescriptorsBufferCount: USHORT,
    DescriptorsBuffer_out: Optional<PBTH_LE_GATT_DESCRIPTOR>,
    DescriptorsBufferActual_out: PUSHORT,
    Flags: ULONG,
  ): HRESULT {
    return BluetoothApis.Load('BluetoothGATTGetDescriptors')(hDevice, Characteristic, DescriptorsBufferCount, DescriptorsBuffer_out, DescriptorsBufferActual_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattgetincludedservices
  public static BluetoothGATTGetIncludedServices(
    hDevice: HANDLE,
    ParentService: Optional<PBTH_LE_GATT_SERVICE>,
    IncludedServicesBufferCount: USHORT,
    IncludedServicesBuffer_out: Optional<PBTH_LE_GATT_SERVICE>,
    IncludedServicesBufferActual_out: PUSHORT,
    Flags: ULONG,
  ): HRESULT {
    return BluetoothApis.Load('BluetoothGATTGetIncludedServices')(hDevice, ParentService, IncludedServicesBufferCount, IncludedServicesBuffer_out, IncludedServicesBufferActual_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattgetservices
  public static BluetoothGATTGetServices(hDevice: HANDLE, ServicesBufferCount: USHORT, ServicesBuffer_out: Optional<PBTH_LE_GATT_SERVICE>, ServicesBufferActual_out: PUSHORT, Flags: ULONG): HRESULT {
    return BluetoothApis.Load('BluetoothGATTGetServices')(hDevice, ServicesBufferCount, ServicesBuffer_out, ServicesBufferActual_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattregisterevent
  public static BluetoothGATTRegisterEvent(
    hService: HANDLE,
    EventType: BTH_LE_GATT_EVENT_TYPE,
    EventParameterIn: PVOID,
    Callback: PFNBLUETOOTH_GATT_EVENT_CALLBACK,
    CallbackContext: Optional<PVOID>,
    pEventHandle_out: PBLUETOOTH_GATT_EVENT_HANDLE,
    Flags: ULONG,
  ): HRESULT {
    return BluetoothApis.Load('BluetoothGATTRegisterEvent')(hService, EventType, EventParameterIn, Callback, CallbackContext, pEventHandle_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattsetcharacteristicvalue
  public static BluetoothGATTSetCharacteristicValue(
    hDevice: HANDLE,
    Characteristic: PBTH_LE_GATT_CHARACTERISTIC,
    CharacteristicValue: PBTH_LE_GATT_CHARACTERISTIC_VALUE,
    ReliableWriteContext: Optional<BTH_LE_GATT_RELIABLE_WRITE_CONTEXT>,
    Flags: ULONG,
  ): HRESULT {
    return BluetoothApis.Load('BluetoothGATTSetCharacteristicValue')(hDevice, Characteristic, CharacteristicValue, ReliableWriteContext, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattsetdescriptorvalue
  public static BluetoothGATTSetDescriptorValue(hDevice: HANDLE, Descriptor: PBTH_LE_GATT_DESCRIPTOR, DescriptorValue: PBTH_LE_GATT_DESCRIPTOR_VALUE, Flags: ULONG): HRESULT {
    return BluetoothApis.Load('BluetoothGATTSetDescriptorValue')(hDevice, Descriptor, DescriptorValue, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattunregisterevent
  public static BluetoothGATTUnregisterEvent(EventHandle: BLUETOOTH_GATT_EVENT_HANDLE, Flags: ULONG): HRESULT {
    return BluetoothApis.Load('BluetoothGATTUnregisterEvent')(EventHandle, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothgetdeviceinfo
  public static BluetoothGetDeviceInfo(hRadio: Optional<HANDLE>, pbtdi_in_out: PBLUETOOTH_DEVICE_INFO): DWORD {
    return BluetoothApis.Load('BluetoothGetDeviceInfo')(hRadio, pbtdi_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothgetradioinfo
  public static BluetoothGetRadioInfo(hRadio: HANDLE, pRadioInfo_in_out: PBLUETOOTH_RADIO_INFO): DWORD {
    return BluetoothApis.Load('BluetoothGetRadioInfo')(hRadio, pRadioInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothisconnectable
  public static BluetoothIsConnectable(hRadio: Optional<HANDLE>): BOOL {
    return BluetoothApis.Load('BluetoothIsConnectable')(hRadio);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothisdiscoverable
  public static BluetoothIsDiscoverable(hRadio: Optional<HANDLE>): BOOL {
    return BluetoothApis.Load('BluetoothIsDiscoverable')(hRadio);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothisversionavailable
  public static BluetoothIsVersionAvailable(MajorVersion: UCHAR, MinorVersion: UCHAR): BOOL {
    return BluetoothApis.Load('BluetoothIsVersionAvailable')(MajorVersion, MinorVersion);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothregisterforauthentication
  public static BluetoothRegisterForAuthentication(pbtdi: Optional<PBLUETOOTH_DEVICE_INFO>, phRegHandle_out: PHBLUETOOTH_AUTHENTICATION_REGISTRATION, pfnCallback: Optional<PFN_AUTHENTICATION_CALLBACK>, pvParam: Optional<PVOID>): DWORD {
    return BluetoothApis.Load('BluetoothRegisterForAuthentication')(pbtdi, phRegHandle_out, pfnCallback, pvParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothregisterforauthenticationex
  public static BluetoothRegisterForAuthenticationEx(
    pbtdiIn: Optional<PBLUETOOTH_DEVICE_INFO>,
    phRegHandleOut_out: PHBLUETOOTH_AUTHENTICATION_REGISTRATION,
    pfnCallbackIn: Optional<PFN_AUTHENTICATION_CALLBACK_EX>,
    pvParam: Optional<PVOID>,
  ): DWORD {
    return BluetoothApis.Load('BluetoothRegisterForAuthenticationEx')(pbtdiIn, phRegHandleOut_out, pfnCallbackIn, pvParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothremovedevice
  public static BluetoothRemoveDevice(pAddress: PBLUETOOTH_ADDRESS): DWORD {
    return BluetoothApis.Load('BluetoothRemoveDevice')(pAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsdpenumattributes
  public static BluetoothSdpEnumAttributes(pSDPStream: LPBYTE, cbStreamSize: ULONG, pfnCallback: PFN_BLUETOOTH_ENUM_ATTRIBUTES_CALLBACK, pvParam: LPVOID): BOOL {
    return BluetoothApis.Load('BluetoothSdpEnumAttributes')(pSDPStream, cbStreamSize, pfnCallback, pvParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsdpgetattributevalue
  public static BluetoothSdpGetAttributeValue(pRecordStream: LPBYTE, cbRecordLength: ULONG, usAttributeId: USHORT, pAttributeData_out: PSDP_ELEMENT_DATA): DWORD {
    return BluetoothApis.Load('BluetoothSdpGetAttributeValue')(pRecordStream, cbRecordLength, usAttributeId, pAttributeData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsdpgetcontainerelementdata
  public static BluetoothSdpGetContainerElementData(pContainerStream: LPBYTE, cbContainerLength: ULONG, pElement_in_out: PHBLUETOOTH_CONTAINER_ELEMENT, pData_out: PSDP_ELEMENT_DATA): DWORD {
    return BluetoothApis.Load('BluetoothSdpGetContainerElementData')(pContainerStream, cbContainerLength, pElement_in_out, pData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsdpgetelementdata
  public static BluetoothSdpGetElementData(pSdpStream: LPBYTE, cbSdpStreamLength: ULONG, pData_out: PSDP_ELEMENT_DATA): DWORD {
    return BluetoothApis.Load('BluetoothSdpGetElementData')(pSdpStream, cbSdpStreamLength, pData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsdpgetstring
  public static BluetoothSdpGetString(pRecordStream: LPBYTE, cbRecordLength: ULONG, pStringData: Optional<PSDP_STRING_TYPE_DATA>, usStringOffset: USHORT, pszString_out: Nullable<LPWSTR>, pcchStringLength_in_out: PULONG): DWORD {
    return BluetoothApis.Load('BluetoothSdpGetString')(pRecordStream, cbRecordLength, pStringData, usStringOffset, pszString_out, pcchStringLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsendauthenticationresponse
  public static BluetoothSendAuthenticationResponse(hRadio: Optional<HANDLE>, pbtdi: PBLUETOOTH_DEVICE_INFO, pszPasskey: LPCWSTR): DWORD {
    return BluetoothApis.Load('BluetoothSendAuthenticationResponse')(hRadio, pbtdi, pszPasskey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsendauthenticationresponseex
  public static BluetoothSendAuthenticationResponseEx(hRadioIn: Optional<HANDLE>, pauthResponse: PBLUETOOTH_AUTHENTICATE_RESPONSE): DWORD {
    return BluetoothApis.Load('BluetoothSendAuthenticationResponseEx')(hRadioIn, pauthResponse);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsetlocalserviceinfo
  public static BluetoothSetLocalServiceInfo(hRadioIn: Optional<HANDLE>, pClassGuid: PGUID, ulInstance: ULONG, pServiceInfoIn: PBLUETOOTH_LOCAL_SERVICE_INFO): DWORD {
    return BluetoothApis.Load('BluetoothSetLocalServiceInfo')(hRadioIn, pClassGuid, ulInstance, pServiceInfoIn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsetservicestate
  public static BluetoothSetServiceState(hRadio: Optional<HANDLE>, pbtdi: PBLUETOOTH_DEVICE_INFO, pGuidService: PGUID, dwServiceFlags: DWORD): DWORD {
    return BluetoothApis.Load('BluetoothSetServiceState')(hRadio, pbtdi, pGuidService, dwServiceFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothunregisterauthentication
  public static BluetoothUnregisterAuthentication(hRegHandle: HBLUETOOTH_AUTHENTICATION_REGISTRATION): BOOL {
    return BluetoothApis.Load('BluetoothUnregisterAuthentication')(hRegHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothupdatedevicerecord
  public static BluetoothUpdateDeviceRecord(pbtdi: PBLUETOOTH_DEVICE_INFO): DWORD {
    return BluetoothApis.Load('BluetoothUpdateDeviceRecord')(pbtdi);
  }
}

export default BluetoothApis;
