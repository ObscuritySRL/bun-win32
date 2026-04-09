import type { Pointer } from 'bun:ffi';

export type { BOOL, HANDLE, LPDWORD, LONG, NULL, PULONG, PVOID, ULONG, USHORT } from '@bun-win32/core';

export enum DeviceInformationType {
  DEVICE_SPEED = 0x0000_0001,
}

export enum PipePolicyType {
  ALLOW_PARTIAL_READS = 0x0000_0005,
  AUTO_CLEAR_STALL = 0x0000_0002,
  AUTO_FLUSH = 0x0000_0006,
  IGNORE_SHORT_PACKETS = 0x0000_0004,
  MAXIMUM_TRANSFER_SIZE = 0x0000_0008,
  PIPE_TRANSFER_TIMEOUT = 0x0000_0003,
  RAW_IO = 0x0000_0007,
  RESET_PIPE_ON_RESUME = 0x0000_0009,
  SHORT_PACKET_TERMINATE = 0x0000_0001,
}

export enum PowerPolicyType {
  AUTO_SUSPEND = 0x0000_0081,
  SUSPEND_DELAY = 0x0000_0083,
}

export enum UsbDescriptorType {
  USB_CONFIGURATION_DESCRIPTOR_TYPE = 0x02,
  USB_DEVICE_DESCRIPTOR_TYPE = 0x01,
  USB_ENDPOINT_DESCRIPTOR_TYPE = 0x05,
  USB_INTERFACE_DESCRIPTOR_TYPE = 0x04,
  USB_STRING_DESCRIPTOR_TYPE = 0x03,
}

export type LARGE_INTEGER = bigint;
export type LPOVERLAPPED = Pointer;
export type PLARGE_INTEGER = Pointer;
export type PUCHAR = Pointer;
export type PUSB_COMMON_DESCRIPTOR = Pointer;
export type PUSB_CONFIGURATION_DESCRIPTOR = Pointer;
export type PUSB_FRAME_NUMBER_AND_QPC_FOR_TIME_SYNC_INFORMATION = Pointer;
export type PUSB_INTERFACE_DESCRIPTOR = Pointer;
export type PUSB_START_TRACKING_FOR_TIME_SYNC_INFORMATION = Pointer;
export type PUSB_STOP_TRACKING_FOR_TIME_SYNC_INFORMATION = Pointer;
export type PUSBD_ISO_PACKET_DESCRIPTOR = Pointer;
export type PWINUSB_INTERFACE_HANDLE = Pointer;
export type PWINUSB_ISOCH_BUFFER_HANDLE = Pointer;
export type PWINUSB_PIPE_INFORMATION = Pointer;
export type PWINUSB_PIPE_INFORMATION_EX = Pointer;
export type UCHAR = number;
export type WINUSB_INTERFACE_HANDLE = bigint;
export type WINUSB_ISOCH_BUFFER_HANDLE = bigint;
export type WINUSB_SETUP_PACKET = bigint;

export function packWINUSB_SETUP_PACKET(RequestType: number, Request: number, Value: number, Index: number, Length: number): WINUSB_SETUP_PACKET {
  return BigInt(RequestType & 0xff) | (BigInt(Request & 0xff) << 8n) | (BigInt(Value & 0xffff) << 16n) | (BigInt(Index & 0xffff) << 32n) | (BigInt(Length & 0xffff) << 48n);
}
