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
  NULL,
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
  public static BluetoothEnableDiscovery(hRadio: HANDLE | 0n, fEnabled: BOOL): BOOL {
    return BluetoothApis.Load('BluetoothEnableDiscovery')(hRadio, fEnabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothenableincomingconnections
  public static BluetoothEnableIncomingConnections(hRadio: HANDLE | 0n, fEnabled: BOOL): BOOL {
    return BluetoothApis.Load('BluetoothEnableIncomingConnections')(hRadio, fEnabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothenumerateinstalledservices
  public static BluetoothEnumerateInstalledServices(hRadio: HANDLE | 0n, pbtdi: PBLUETOOTH_DEVICE_INFO, pcServiceInout: LPDWORD, pGuidServices: PGUID | NULL): DWORD {
    return BluetoothApis.Load('BluetoothEnumerateInstalledServices')(hRadio, pbtdi, pcServiceInout, pGuidServices);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothfinddeviceclose
  public static BluetoothFindDeviceClose(hFind: HBLUETOOTH_DEVICE_FIND): BOOL {
    return BluetoothApis.Load('BluetoothFindDeviceClose')(hFind);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothfindfirstdevice
  public static BluetoothFindFirstDevice(pbtsp: PBLUETOOTH_DEVICE_SEARCH_PARAMS, pbtdi: PBLUETOOTH_DEVICE_INFO): HBLUETOOTH_DEVICE_FIND {
    return BluetoothApis.Load('BluetoothFindFirstDevice')(pbtsp, pbtdi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothfindfirstradio
  public static BluetoothFindFirstRadio(pbtfrp: PBLUETOOTH_FIND_RADIO_PARAMS, phRadio: PHANDLE): HBLUETOOTH_RADIO_FIND {
    return BluetoothApis.Load('BluetoothFindFirstRadio')(pbtfrp, phRadio);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothfindnextdevice
  public static BluetoothFindNextDevice(hFind: HBLUETOOTH_DEVICE_FIND, pbtdi: PBLUETOOTH_DEVICE_INFO): BOOL {
    return BluetoothApis.Load('BluetoothFindNextDevice')(hFind, pbtdi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothfindnextradio
  public static BluetoothFindNextRadio(hFind: HBLUETOOTH_RADIO_FIND, phRadio: PHANDLE): BOOL {
    return BluetoothApis.Load('BluetoothFindNextRadio')(hFind, phRadio);
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
  public static BluetoothGATTBeginReliableWrite(hDevice: HANDLE, ReliableWriteContext: PBTH_LE_GATT_RELIABLE_WRITE_CONTEXT, Flags: ULONG): HRESULT {
    return BluetoothApis.Load('BluetoothGATTBeginReliableWrite')(hDevice, ReliableWriteContext, Flags);
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
    CharacteristicValue: PBTH_LE_GATT_CHARACTERISTIC_VALUE | NULL,
    CharacteristicValueSizeRequired: PUSHORT | NULL,
    Flags: ULONG,
  ): HRESULT {
    return BluetoothApis.Load('BluetoothGATTGetCharacteristicValue')(hDevice, Characteristic, CharacteristicValueDataSize, CharacteristicValue, CharacteristicValueSizeRequired, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattgetcharacteristics
  public static BluetoothGATTGetCharacteristics(
    hDevice: HANDLE,
    Service: PBTH_LE_GATT_SERVICE | NULL,
    CharacteristicsBufferCount: USHORT,
    CharacteristicsBuffer: PBTH_LE_GATT_CHARACTERISTIC | NULL,
    CharacteristicsBufferActual: PUSHORT,
    Flags: ULONG,
  ): HRESULT {
    return BluetoothApis.Load('BluetoothGATTGetCharacteristics')(hDevice, Service, CharacteristicsBufferCount, CharacteristicsBuffer, CharacteristicsBufferActual, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattgetdescriptorvalue
  public static BluetoothGATTGetDescriptorValue(
    hDevice: HANDLE,
    Descriptor: PBTH_LE_GATT_DESCRIPTOR,
    DescriptorValueDataSize: ULONG,
    DescriptorValue: PBTH_LE_GATT_DESCRIPTOR_VALUE | NULL,
    DescriptorValueSizeRequired: PUSHORT | NULL,
    Flags: ULONG,
  ): HRESULT {
    return BluetoothApis.Load('BluetoothGATTGetDescriptorValue')(hDevice, Descriptor, DescriptorValueDataSize, DescriptorValue, DescriptorValueSizeRequired, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattgetdescriptors
  public static BluetoothGATTGetDescriptors(
    hDevice: HANDLE,
    Characteristic: PBTH_LE_GATT_CHARACTERISTIC,
    DescriptorsBufferCount: USHORT,
    DescriptorsBuffer: PBTH_LE_GATT_DESCRIPTOR | NULL,
    DescriptorsBufferActual: PUSHORT,
    Flags: ULONG,
  ): HRESULT {
    return BluetoothApis.Load('BluetoothGATTGetDescriptors')(hDevice, Characteristic, DescriptorsBufferCount, DescriptorsBuffer, DescriptorsBufferActual, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattgetincludedservices
  public static BluetoothGATTGetIncludedServices(
    hDevice: HANDLE,
    ParentService: PBTH_LE_GATT_SERVICE | NULL,
    IncludedServicesBufferCount: USHORT,
    IncludedServicesBuffer: PBTH_LE_GATT_SERVICE | NULL,
    IncludedServicesBufferActual: PUSHORT,
    Flags: ULONG,
  ): HRESULT {
    return BluetoothApis.Load('BluetoothGATTGetIncludedServices')(hDevice, ParentService, IncludedServicesBufferCount, IncludedServicesBuffer, IncludedServicesBufferActual, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattgetservices
  public static BluetoothGATTGetServices(hDevice: HANDLE, ServicesBufferCount: USHORT, ServicesBuffer: PBTH_LE_GATT_SERVICE | NULL, ServicesBufferActual: PUSHORT, Flags: ULONG): HRESULT {
    return BluetoothApis.Load('BluetoothGATTGetServices')(hDevice, ServicesBufferCount, ServicesBuffer, ServicesBufferActual, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattregisterevent
  public static BluetoothGATTRegisterEvent(
    hService: HANDLE,
    EventType: BTH_LE_GATT_EVENT_TYPE,
    EventParameterIn: PVOID,
    Callback: PFNBLUETOOTH_GATT_EVENT_CALLBACK,
    CallbackContext: PVOID | NULL,
    pEventHandle: PBLUETOOTH_GATT_EVENT_HANDLE,
    Flags: ULONG,
  ): HRESULT {
    return BluetoothApis.Load('BluetoothGATTRegisterEvent')(hService, EventType, EventParameterIn, Callback, CallbackContext, pEventHandle, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothleapis/nf-bluetoothleapis-bluetoothgattsetcharacteristicvalue
  public static BluetoothGATTSetCharacteristicValue(
    hDevice: HANDLE,
    Characteristic: PBTH_LE_GATT_CHARACTERISTIC,
    CharacteristicValue: PBTH_LE_GATT_CHARACTERISTIC_VALUE,
    ReliableWriteContext: BTH_LE_GATT_RELIABLE_WRITE_CONTEXT | 0n,
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
  public static BluetoothGetDeviceInfo(hRadio: HANDLE, pbtdi: PBLUETOOTH_DEVICE_INFO): DWORD {
    return BluetoothApis.Load('BluetoothGetDeviceInfo')(hRadio, pbtdi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothgetradioinfo
  public static BluetoothGetRadioInfo(hRadio: HANDLE, pRadioInfo: PBLUETOOTH_RADIO_INFO): DWORD {
    return BluetoothApis.Load('BluetoothGetRadioInfo')(hRadio, pRadioInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothisconnectable
  public static BluetoothIsConnectable(hRadio: HANDLE | 0n): BOOL {
    return BluetoothApis.Load('BluetoothIsConnectable')(hRadio);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothisdiscoverable
  public static BluetoothIsDiscoverable(hRadio: HANDLE | 0n): BOOL {
    return BluetoothApis.Load('BluetoothIsDiscoverable')(hRadio);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothisversionavailable
  public static BluetoothIsVersionAvailable(MajorVersion: UCHAR, MinorVersion: UCHAR): BOOL {
    return BluetoothApis.Load('BluetoothIsVersionAvailable')(MajorVersion, MinorVersion);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothregisterforauthentication
  public static BluetoothRegisterForAuthentication(pbtdi: PBLUETOOTH_DEVICE_INFO, phRegHandle: PHBLUETOOTH_AUTHENTICATION_REGISTRATION, pfnCallback: PFN_AUTHENTICATION_CALLBACK, pvParam: PVOID | NULL): DWORD {
    return BluetoothApis.Load('BluetoothRegisterForAuthentication')(pbtdi, phRegHandle, pfnCallback, pvParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothregisterforauthenticationex
  public static BluetoothRegisterForAuthenticationEx(pbtdiIn: PBLUETOOTH_DEVICE_INFO | NULL, phRegHandleOut: PHBLUETOOTH_AUTHENTICATION_REGISTRATION, pfnCallbackIn: PFN_AUTHENTICATION_CALLBACK_EX | NULL, pvParam: PVOID | NULL): DWORD {
    return BluetoothApis.Load('BluetoothRegisterForAuthenticationEx')(pbtdiIn, phRegHandleOut, pfnCallbackIn, pvParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothremovedevice
  public static BluetoothRemoveDevice(pAddress: PBLUETOOTH_ADDRESS): DWORD {
    return BluetoothApis.Load('BluetoothRemoveDevice')(pAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsdpenumattributes
  public static BluetoothSdpEnumAttributes(pSDPStream: LPBYTE, cbStreamSize: ULONG, pfnCallback: PFN_BLUETOOTH_ENUM_ATTRIBUTES_CALLBACK, pvParam: LPVOID | NULL): BOOL {
    return BluetoothApis.Load('BluetoothSdpEnumAttributes')(pSDPStream, cbStreamSize, pfnCallback, pvParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsdpgetattributevalue
  public static BluetoothSdpGetAttributeValue(pRecordStream: LPBYTE, cbRecordLength: ULONG, usAttributeId: USHORT, pAttributeData: PSDP_ELEMENT_DATA): DWORD {
    return BluetoothApis.Load('BluetoothSdpGetAttributeValue')(pRecordStream, cbRecordLength, usAttributeId, pAttributeData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsdpgetcontainerelementdata
  public static BluetoothSdpGetContainerElementData(pContainerStream: LPBYTE, cbContainerLength: ULONG, pElement: PHBLUETOOTH_CONTAINER_ELEMENT, pData: PSDP_ELEMENT_DATA): DWORD {
    return BluetoothApis.Load('BluetoothSdpGetContainerElementData')(pContainerStream, cbContainerLength, pElement, pData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsdpgetelementdata
  public static BluetoothSdpGetElementData(pSdpStream: LPBYTE, cbSdpStreamLength: ULONG, pData: PSDP_ELEMENT_DATA): DWORD {
    return BluetoothApis.Load('BluetoothSdpGetElementData')(pSdpStream, cbSdpStreamLength, pData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsdpgetstring
  public static BluetoothSdpGetString(pRecordStream: LPBYTE, cbRecordLength: ULONG, pStringData: PSDP_STRING_TYPE_DATA | NULL, usStringOffset: USHORT, pszString: LPWSTR | NULL, pcchStringLength: PULONG): DWORD {
    return BluetoothApis.Load('BluetoothSdpGetString')(pRecordStream, cbRecordLength, pStringData, usStringOffset, pszString, pcchStringLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsendauthenticationresponse
  public static BluetoothSendAuthenticationResponse(hRadio: HANDLE | 0n, pbtdi: PBLUETOOTH_DEVICE_INFO, pszPasskey: LPCWSTR): DWORD {
    return BluetoothApis.Load('BluetoothSendAuthenticationResponse')(hRadio, pbtdi, pszPasskey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsendauthenticationresponseex
  public static BluetoothSendAuthenticationResponseEx(hRadioIn: HANDLE | 0n, pauthResponse: PBLUETOOTH_AUTHENTICATE_RESPONSE): DWORD {
    return BluetoothApis.Load('BluetoothSendAuthenticationResponseEx')(hRadioIn, pauthResponse);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsetlocalserviceinfo
  public static BluetoothSetLocalServiceInfo(hRadioIn: HANDLE | 0n, pClassGuid: PGUID, ulInstance: ULONG, pServiceInfoIn: PBLUETOOTH_LOCAL_SERVICE_INFO): DWORD {
    return BluetoothApis.Load('BluetoothSetLocalServiceInfo')(hRadioIn, pClassGuid, ulInstance, pServiceInfoIn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothsetservicestate
  public static BluetoothSetServiceState(hRadio: HANDLE, pbtdi: PBLUETOOTH_DEVICE_INFO, pGuidService: PGUID, dwServiceFlags: DWORD): DWORD {
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
