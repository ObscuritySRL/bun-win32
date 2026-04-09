import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  HANDLE,
  LARGE_INTEGER,
  LPDWORD,
  LONG,
  LPOVERLAPPED,
  NULL,
  PLARGE_INTEGER,
  PUCHAR,
  PULONG,
  PUSB_COMMON_DESCRIPTOR,
  PUSB_CONFIGURATION_DESCRIPTOR,
  PUSB_FRAME_NUMBER_AND_QPC_FOR_TIME_SYNC_INFORMATION,
  PUSB_INTERFACE_DESCRIPTOR,
  PUSB_START_TRACKING_FOR_TIME_SYNC_INFORMATION,
  PUSB_STOP_TRACKING_FOR_TIME_SYNC_INFORMATION,
  PUSBD_ISO_PACKET_DESCRIPTOR,
  PVOID,
  PWINUSB_INTERFACE_HANDLE,
  PWINUSB_ISOCH_BUFFER_HANDLE,
  PWINUSB_PIPE_INFORMATION,
  PWINUSB_PIPE_INFORMATION_EX,
  UCHAR,
  ULONG,
  USHORT,
  WINUSB_INTERFACE_HANDLE,
  WINUSB_ISOCH_BUFFER_HANDLE,
  WINUSB_SETUP_PACKET,
} from '../types/WinUsb';

/**
 * Thin, lazy-loaded FFI bindings for `winusb.dll`.
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
 * import WinUsb from './structs/WinUsb';
 *
 * // Lazy: bind on first call
 * const result = WinUsb.WinUsb_Initialize(deviceHandle, handleBuf.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * WinUsb.Preload(['WinUsb_Initialize', 'WinUsb_Free', 'WinUsb_ReadPipe']);
 * ```
 */
class WinUsb extends Win32 {
  protected static override readonly name = 'winusb.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    WinUsb_AbortPipe: { args: [FFIType.u64, FFIType.u8], returns: FFIType.i32 },
    WinUsb_ControlTransfer: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_FlushPipe: { args: [FFIType.u64, FFIType.u8], returns: FFIType.i32 },
    WinUsb_Free: { args: [FFIType.u64], returns: FFIType.i32 },
    WinUsb_GetAdjustedFrameNumber: { args: [FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
    WinUsb_GetAssociatedInterface: { args: [FFIType.u64, FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_GetCurrentAlternateSetting: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_GetCurrentFrameNumber: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_GetCurrentFrameNumberAndQpc: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_GetDescriptor: { args: [FFIType.u64, FFIType.u8, FFIType.u8, FFIType.u16, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_GetOverlappedResult: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    WinUsb_GetPipePolicy: { args: [FFIType.u64, FFIType.u8, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_GetPowerPolicy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_Initialize: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_ParseConfigurationDescriptor: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.ptr },
    WinUsb_ParseDescriptors: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.ptr },
    WinUsb_QueryDeviceInformation: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_QueryInterfaceSettings: { args: [FFIType.u64, FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_QueryPipe: { args: [FFIType.u64, FFIType.u8, FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_QueryPipeEx: { args: [FFIType.u64, FFIType.u8, FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_ReadIsochPipe: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_ReadIsochPipeAsap: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_ReadPipe: { args: [FFIType.u64, FFIType.u8, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_RegisterIsochBuffer: { args: [FFIType.u64, FFIType.u8, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_ResetPipe: { args: [FFIType.u64, FFIType.u8], returns: FFIType.i32 },
    WinUsb_SetCurrentAlternateSetting: { args: [FFIType.u64, FFIType.u8], returns: FFIType.i32 },
    WinUsb_SetPipePolicy: { args: [FFIType.u64, FFIType.u8, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_SetPowerPolicy: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_StartTrackingForTimeSync: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_StopTrackingForTimeSync: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_UnregisterIsochBuffer: { args: [FFIType.u64], returns: FFIType.i32 },
    WinUsb_WriteIsochPipe: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_WriteIsochPipeAsap: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    WinUsb_WritePipe: { args: [FFIType.u64, FFIType.u8, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_abortpipe
  public static WinUsb_AbortPipe(InterfaceHandle: WINUSB_INTERFACE_HANDLE, PipeID: UCHAR): BOOL {
    return WinUsb.Load('WinUsb_AbortPipe')(InterfaceHandle, PipeID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_controltransfer
  public static WinUsb_ControlTransfer(InterfaceHandle: WINUSB_INTERFACE_HANDLE, SetupPacket: WINUSB_SETUP_PACKET, Buffer: PUCHAR | NULL, BufferLength: ULONG, LengthTransferred: PULONG | NULL, Overlapped: LPOVERLAPPED | NULL): BOOL {
    return WinUsb.Load('WinUsb_ControlTransfer')(InterfaceHandle, SetupPacket, Buffer, BufferLength, LengthTransferred, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_flushpipe
  public static WinUsb_FlushPipe(InterfaceHandle: WINUSB_INTERFACE_HANDLE, PipeID: UCHAR): BOOL {
    return WinUsb.Load('WinUsb_FlushPipe')(InterfaceHandle, PipeID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_free
  public static WinUsb_Free(InterfaceHandle: WINUSB_INTERFACE_HANDLE): BOOL {
    return WinUsb.Load('WinUsb_Free')(InterfaceHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_getadjustedframenumber
  public static WinUsb_GetAdjustedFrameNumber(CurrentFrameNumber: PULONG, TimeStamp: LARGE_INTEGER): BOOL {
    return WinUsb.Load('WinUsb_GetAdjustedFrameNumber')(CurrentFrameNumber, TimeStamp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_getassociatedinterface
  public static WinUsb_GetAssociatedInterface(InterfaceHandle: WINUSB_INTERFACE_HANDLE, AssociatedInterfaceIndex: UCHAR, AssociatedInterfaceHandle: PWINUSB_INTERFACE_HANDLE): BOOL {
    return WinUsb.Load('WinUsb_GetAssociatedInterface')(InterfaceHandle, AssociatedInterfaceIndex, AssociatedInterfaceHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_getcurrentalternatesetting
  public static WinUsb_GetCurrentAlternateSetting(InterfaceHandle: WINUSB_INTERFACE_HANDLE, SettingNumber: PUCHAR): BOOL {
    return WinUsb.Load('WinUsb_GetCurrentAlternateSetting')(InterfaceHandle, SettingNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_getcurrentframenumber
  public static WinUsb_GetCurrentFrameNumber(InterfaceHandle: WINUSB_INTERFACE_HANDLE, CurrentFrameNumber: PULONG, TimeStamp: PLARGE_INTEGER): BOOL {
    return WinUsb.Load('WinUsb_GetCurrentFrameNumber')(InterfaceHandle, CurrentFrameNumber, TimeStamp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_getcurrentframenumberandqpc
  public static WinUsb_GetCurrentFrameNumberAndQpc(InterfaceHandle: WINUSB_INTERFACE_HANDLE, FrameQpcInfo: PUSB_FRAME_NUMBER_AND_QPC_FOR_TIME_SYNC_INFORMATION): BOOL {
    return WinUsb.Load('WinUsb_GetCurrentFrameNumberAndQpc')(InterfaceHandle, FrameQpcInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_getdescriptor
  public static WinUsb_GetDescriptor(InterfaceHandle: WINUSB_INTERFACE_HANDLE, DescriptorType: UCHAR, Index: UCHAR, LanguageID: USHORT, Buffer: PUCHAR | NULL, BufferLength: ULONG, LengthTransferred: PULONG): BOOL {
    return WinUsb.Load('WinUsb_GetDescriptor')(InterfaceHandle, DescriptorType, Index, LanguageID, Buffer, BufferLength, LengthTransferred);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_getoverlappedresult
  public static WinUsb_GetOverlappedResult(InterfaceHandle: WINUSB_INTERFACE_HANDLE, lpOverlapped: LPOVERLAPPED, lpNumberOfBytesTransferred: LPDWORD, bWait: BOOL): BOOL {
    return WinUsb.Load('WinUsb_GetOverlappedResult')(InterfaceHandle, lpOverlapped, lpNumberOfBytesTransferred, bWait);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_getpipepolicy
  public static WinUsb_GetPipePolicy(InterfaceHandle: WINUSB_INTERFACE_HANDLE, PipeID: UCHAR, PolicyType: ULONG, ValueLength: PULONG, Value: PVOID): BOOL {
    return WinUsb.Load('WinUsb_GetPipePolicy')(InterfaceHandle, PipeID, PolicyType, ValueLength, Value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_getpowerpolicy
  public static WinUsb_GetPowerPolicy(InterfaceHandle: WINUSB_INTERFACE_HANDLE, PolicyType: ULONG, ValueLength: PULONG, Value: PVOID): BOOL {
    return WinUsb.Load('WinUsb_GetPowerPolicy')(InterfaceHandle, PolicyType, ValueLength, Value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_initialize
  public static WinUsb_Initialize(DeviceHandle: HANDLE, InterfaceHandle: PWINUSB_INTERFACE_HANDLE): BOOL {
    return WinUsb.Load('WinUsb_Initialize')(DeviceHandle, InterfaceHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_parseconfigurationdescriptor
  public static WinUsb_ParseConfigurationDescriptor(
    ConfigurationDescriptor: PUSB_CONFIGURATION_DESCRIPTOR,
    StartPosition: PVOID,
    InterfaceNumber: LONG,
    AlternateSetting: LONG,
    InterfaceClass: LONG,
    InterfaceSubClass: LONG,
    InterfaceProtocol: LONG,
  ): PUSB_INTERFACE_DESCRIPTOR | NULL {
    return WinUsb.Load('WinUsb_ParseConfigurationDescriptor')(ConfigurationDescriptor, StartPosition, InterfaceNumber, AlternateSetting, InterfaceClass, InterfaceSubClass, InterfaceProtocol);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_parsedescriptors
  public static WinUsb_ParseDescriptors(DescriptorBuffer: PVOID, TotalLength: ULONG, StartPosition: PVOID, DescriptorType: LONG): PUSB_COMMON_DESCRIPTOR | NULL {
    return WinUsb.Load('WinUsb_ParseDescriptors')(DescriptorBuffer, TotalLength, StartPosition, DescriptorType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_querydeviceinformation
  public static WinUsb_QueryDeviceInformation(InterfaceHandle: WINUSB_INTERFACE_HANDLE, InformationType: ULONG, BufferLength: PULONG, Buffer: PVOID): BOOL {
    return WinUsb.Load('WinUsb_QueryDeviceInformation')(InterfaceHandle, InformationType, BufferLength, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_queryinterfacesettings
  public static WinUsb_QueryInterfaceSettings(InterfaceHandle: WINUSB_INTERFACE_HANDLE, AlternateInterfaceNumber: UCHAR, UsbAltInterfaceDescriptor: PUSB_INTERFACE_DESCRIPTOR): BOOL {
    return WinUsb.Load('WinUsb_QueryInterfaceSettings')(InterfaceHandle, AlternateInterfaceNumber, UsbAltInterfaceDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_querypipe
  public static WinUsb_QueryPipe(InterfaceHandle: WINUSB_INTERFACE_HANDLE, AlternateInterfaceNumber: UCHAR, PipeIndex: UCHAR, PipeInformation: PWINUSB_PIPE_INFORMATION): BOOL {
    return WinUsb.Load('WinUsb_QueryPipe')(InterfaceHandle, AlternateInterfaceNumber, PipeIndex, PipeInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_querypipeex
  public static WinUsb_QueryPipeEx(InterfaceHandle: WINUSB_INTERFACE_HANDLE, AlternateSettingNumber: UCHAR, PipeIndex: UCHAR, PipeInformationEx: PWINUSB_PIPE_INFORMATION_EX): BOOL {
    return WinUsb.Load('WinUsb_QueryPipeEx')(InterfaceHandle, AlternateSettingNumber, PipeIndex, PipeInformationEx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_readisochpipe
  public static WinUsb_ReadIsochPipe(
    BufferHandle: WINUSB_ISOCH_BUFFER_HANDLE,
    Offset: ULONG,
    Length: ULONG,
    FrameNumber: PULONG,
    NumberOfPackets: ULONG,
    IsoPacketDescriptors: PUSBD_ISO_PACKET_DESCRIPTOR,
    Overlapped: LPOVERLAPPED | NULL,
  ): BOOL {
    return WinUsb.Load('WinUsb_ReadIsochPipe')(BufferHandle, Offset, Length, FrameNumber, NumberOfPackets, IsoPacketDescriptors, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_readisochpipeasap
  public static WinUsb_ReadIsochPipeAsap(
    BufferHandle: WINUSB_ISOCH_BUFFER_HANDLE,
    Offset: ULONG,
    Length: ULONG,
    ContinueStream: BOOL,
    NumberOfPackets: ULONG,
    IsoPacketDescriptors: PUSBD_ISO_PACKET_DESCRIPTOR,
    Overlapped: LPOVERLAPPED | NULL,
  ): BOOL {
    return WinUsb.Load('WinUsb_ReadIsochPipeAsap')(BufferHandle, Offset, Length, ContinueStream, NumberOfPackets, IsoPacketDescriptors, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_readpipe
  public static WinUsb_ReadPipe(InterfaceHandle: WINUSB_INTERFACE_HANDLE, PipeID: UCHAR, Buffer: PUCHAR | NULL, BufferLength: ULONG, LengthTransferred: PULONG | NULL, Overlapped: LPOVERLAPPED | NULL): BOOL {
    return WinUsb.Load('WinUsb_ReadPipe')(InterfaceHandle, PipeID, Buffer, BufferLength, LengthTransferred, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_registerisochbuffer
  public static WinUsb_RegisterIsochBuffer(InterfaceHandle: WINUSB_INTERFACE_HANDLE, PipeID: UCHAR, Buffer: PUCHAR, BufferLength: ULONG, IsochBufferHandle: PWINUSB_ISOCH_BUFFER_HANDLE): BOOL {
    return WinUsb.Load('WinUsb_RegisterIsochBuffer')(InterfaceHandle, PipeID, Buffer, BufferLength, IsochBufferHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_resetpipe
  public static WinUsb_ResetPipe(InterfaceHandle: WINUSB_INTERFACE_HANDLE, PipeID: UCHAR): BOOL {
    return WinUsb.Load('WinUsb_ResetPipe')(InterfaceHandle, PipeID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_setcurrentalternatesetting
  public static WinUsb_SetCurrentAlternateSetting(InterfaceHandle: WINUSB_INTERFACE_HANDLE, SettingNumber: UCHAR): BOOL {
    return WinUsb.Load('WinUsb_SetCurrentAlternateSetting')(InterfaceHandle, SettingNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_setpipepolicy
  public static WinUsb_SetPipePolicy(InterfaceHandle: WINUSB_INTERFACE_HANDLE, PipeID: UCHAR, PolicyType: ULONG, ValueLength: ULONG, Value: PVOID): BOOL {
    return WinUsb.Load('WinUsb_SetPipePolicy')(InterfaceHandle, PipeID, PolicyType, ValueLength, Value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_setpowerpolicy
  public static WinUsb_SetPowerPolicy(InterfaceHandle: WINUSB_INTERFACE_HANDLE, PolicyType: ULONG, ValueLength: ULONG, Value: PVOID): BOOL {
    return WinUsb.Load('WinUsb_SetPowerPolicy')(InterfaceHandle, PolicyType, ValueLength, Value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_starttrackingfortimesync
  public static WinUsb_StartTrackingForTimeSync(InterfaceHandle: WINUSB_INTERFACE_HANDLE, StartTrackingInfo: PUSB_START_TRACKING_FOR_TIME_SYNC_INFORMATION): BOOL {
    return WinUsb.Load('WinUsb_StartTrackingForTimeSync')(InterfaceHandle, StartTrackingInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_stoptrackingfortimesync
  public static WinUsb_StopTrackingForTimeSync(InterfaceHandle: WINUSB_INTERFACE_HANDLE, StopTrackingInfo: PUSB_STOP_TRACKING_FOR_TIME_SYNC_INFORMATION): BOOL {
    return WinUsb.Load('WinUsb_StopTrackingForTimeSync')(InterfaceHandle, StopTrackingInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_unregisterisochbuffer
  public static WinUsb_UnregisterIsochBuffer(IsochBufferHandle: WINUSB_ISOCH_BUFFER_HANDLE): BOOL {
    return WinUsb.Load('WinUsb_UnregisterIsochBuffer')(IsochBufferHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_writeisochpipe
  public static WinUsb_WriteIsochPipe(BufferHandle: WINUSB_ISOCH_BUFFER_HANDLE, Offset: ULONG, Length: ULONG, FrameNumber: PULONG, Overlapped: LPOVERLAPPED | NULL): BOOL {
    return WinUsb.Load('WinUsb_WriteIsochPipe')(BufferHandle, Offset, Length, FrameNumber, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_writeisochpipeasap
  public static WinUsb_WriteIsochPipeAsap(BufferHandle: WINUSB_ISOCH_BUFFER_HANDLE, Offset: ULONG, Length: ULONG, ContinueStream: BOOL, Overlapped: LPOVERLAPPED | NULL): BOOL {
    return WinUsb.Load('WinUsb_WriteIsochPipeAsap')(BufferHandle, Offset, Length, ContinueStream, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winusb/nf-winusb-winusb_writepipe
  public static WinUsb_WritePipe(InterfaceHandle: WINUSB_INTERFACE_HANDLE, PipeID: UCHAR, Buffer: PUCHAR, BufferLength: ULONG, LengthTransferred: PULONG | NULL, Overlapped: LPOVERLAPPED | NULL): BOOL {
    return WinUsb.Load('WinUsb_WritePipe')(InterfaceHandle, PipeID, Buffer, BufferLength, LengthTransferred, Overlapped);
  }
}

export default WinUsb;
