import type { Pointer } from 'bun:ffi';

export type { DWORD, HINSTANCE, HRESULT, NULLABLE, OPTIONAL } from '@bun-win32/core';

export const CLSID_DirectInput8 = '25e609e4-b259-11cf-bfc7-444553540000';

export const IID_IDirectInput8A = 'bf798030-483a-4da2-aa99-5d64ed369700';
export const IID_IDirectInput8W = 'bf798031-483a-4da2-aa99-5d64ed369700';
export const IID_IDirectInputDevice8A = '54d41080-dc15-4833-a41b-748f73a38179';
export const IID_IDirectInputDevice8W = '54d41081-dc15-4833-a41b-748f73a38179';

export const GUID_Joystick = '6f1d2b70-d5a0-11cf-bfc7-444553540000';
export const GUID_POV = 'a36d02f2-c9f3-11cf-bfc7-444553540000';
export const GUID_RzAxis = 'a36d02e3-c9f3-11cf-bfc7-444553540000';
export const GUID_SysKeyboard = '6f1d2b61-d5a0-11cf-bfc7-444553540000';
export const GUID_SysMouse = '6f1d2b60-d5a0-11cf-bfc7-444553540000';
export const GUID_XAxis = 'a36d02e0-c9f3-11cf-bfc7-444553540000';
export const GUID_YAxis = 'a36d02e1-c9f3-11cf-bfc7-444553540000';
export const GUID_ZAxis = 'a36d02e2-c9f3-11cf-bfc7-444553540000';

export const DI_OK = 0;
export const DIDC_ATTACHED = 0x0000_0001;
export const DIDEVTYPE_HID = 0x0001_0000;
export const DIENUM_CONTINUE = 1;
export const DIENUM_STOP = 0;
export const DIPROP_BUFFERSIZE = 1;
export const DIPROP_RANGE = 4;
export const DIPROPRANGE_NOMAX = 0x7fff_ffff;
export const DIPROPRANGE_NOMIN = -2_147_483_648;
export const DIRECTINPUT_VERSION = 0x0800;

export enum DI8DEVCLASS {
  DI8DEVCLASS_ALL = 0,
  DI8DEVCLASS_DEVICE = 1,
  DI8DEVCLASS_GAMECTRL = 4,
  DI8DEVCLASS_KEYBOARD = 3,
  DI8DEVCLASS_POINTER = 2,
}

export enum DI8DEVTYPE {
  DI8DEVTYPE_1STPERSON = 0x18,
  DI8DEVTYPE_DEVICE = 0x11,
  DI8DEVTYPE_DEVICECTRL = 0x19,
  DI8DEVTYPE_DRIVING = 0x16,
  DI8DEVTYPE_FLIGHT = 0x17,
  DI8DEVTYPE_GAMEPAD = 0x15,
  DI8DEVTYPE_JOYSTICK = 0x14,
  DI8DEVTYPE_KEYBOARD = 0x13,
  DI8DEVTYPE_MOUSE = 0x12,
  DI8DEVTYPE_REMOTE = 0x1b,
  DI8DEVTYPE_SCREENPOINTER = 0x1a,
  DI8DEVTYPE_SUPPLEMENTAL = 0x1c,
}

export enum DIDFT {
  DIDFT_ABSAXIS = 0x0000_0002,
  DIDFT_ALL = 0x0000_0000,
  DIDFT_AXIS = 0x0000_0003,
  DIDFT_BUTTON = 0x0000_000c,
  DIDFT_POV = 0x0000_0010,
  DIDFT_PSHBUTTON = 0x0000_0004,
  DIDFT_RELAXIS = 0x0000_0001,
  DIDFT_TGLBUTTON = 0x0000_0008,
}

export enum DIEDFL {
  DIEDFL_ALLDEVICES = 0x0000_0000,
  DIEDFL_ATTACHEDONLY = 0x0000_0001,
}

export enum DIPH {
  DIPH_BYID = 2,
  DIPH_BYOFFSET = 1,
  DIPH_BYUSAGE = 3,
  DIPH_DEVICE = 0,
}

export enum DISCL {
  DISCL_BACKGROUND = 0x0000_0008,
  DISCL_EXCLUSIVE = 0x0000_0001,
  DISCL_FOREGROUND = 0x0000_0004,
  DISCL_NONEXCLUSIVE = 0x0000_0002,
  DISCL_NOWINKEY = 0x0000_0010,
}

export type LPCDIDATAFORMAT = Pointer;
export type LPLPVOID = Pointer;
export type LPUNKNOWN = Pointer;
export type PPVOID = Pointer;
export type REFCLSID = Pointer;
export type REFIID = Pointer;
