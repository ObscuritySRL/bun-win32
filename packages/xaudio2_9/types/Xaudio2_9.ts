import type { Pointer } from 'bun:ffi';

export type { HRESULT, LPCVOID, NULL, Optional, VOID } from '@bun-win32/core';

export const CLSID_FXEcho = '5039d740-f736-449a-84d3-a56202557b87';
export const CLSID_FXEQ = 'f5e01117-d6c4-485a-a3f5-695196f3dbfa';
export const CLSID_FXMasteringLimiter = 'c4137916-2be1-46fd-8599-441536f49856';
export const CLSID_FXReverb = '7d9aca56-cb68-4807-b632-b137352e8596';

export const S_OK = 0;

export const X3DAUDIO_HANDLE_BYTESIZE = 20;
export const X3DAUDIO_SPEED_OF_SOUND = 343.5;

export const XAUDIO2_ANY_PROCESSOR = 0xffff_ffff;
export const XAUDIO2_DEFAULT_PROCESSOR = 0x0000_0001;
export const XAUDIO2_USE_DEFAULT_PROCESSOR = 0x0000_0000;

export enum PROCESSOR {
  Processor1 = 0x0000_0001,
  Processor2 = 0x0000_0002,
  Processor3 = 0x0000_0004,
  Processor4 = 0x0000_0008,
  Processor5 = 0x0000_0010,
  Processor6 = 0x0000_0020,
  Processor7 = 0x0000_0040,
  Processor8 = 0x0000_0080,
  Processor9 = 0x0000_0100,
  Processor10 = 0x0000_0200,
  Processor11 = 0x0000_0400,
  Processor12 = 0x0000_0800,
  Processor13 = 0x0000_1000,
  Processor14 = 0x0000_2000,
  Processor15 = 0x0000_4000,
  Processor16 = 0x0000_8000,
  Processor17 = 0x0001_0000,
  Processor18 = 0x0002_0000,
  Processor19 = 0x0004_0000,
  Processor20 = 0x0008_0000,
  Processor21 = 0x0010_0000,
  Processor22 = 0x0020_0000,
  Processor23 = 0x0040_0000,
  Processor24 = 0x0080_0000,
  Processor25 = 0x0100_0000,
  Processor26 = 0x0200_0000,
  Processor27 = 0x0400_0000,
  Processor28 = 0x0800_0000,
  Processor29 = 0x1000_0000,
  Processor30 = 0x2000_0000,
  Processor31 = 0x4000_0000,
  Processor32 = 0x8000_0000,
}

export enum SPEAKER {
  SPEAKER_2POINT1 = 0x0000_000b,
  SPEAKER_4POINT1 = 0x0000_003b,
  SPEAKER_5POINT1 = 0x0000_003f,
  SPEAKER_5POINT1_SURROUND = 0x0000_060f,
  SPEAKER_7POINT1 = 0x0000_00ff,
  SPEAKER_7POINT1_SURROUND = 0x0000_063f,
  SPEAKER_MONO = 0x0000_0004,
  SPEAKER_QUAD = 0x0000_0033,
  SPEAKER_STEREO = 0x0000_0003,
  SPEAKER_SURROUND = 0x0000_0107,
}

export enum X3DAUDIO_CALCULATE {
  X3DAUDIO_CALCULATE_DELAY = 0x0000_0002,
  X3DAUDIO_CALCULATE_DOPPLER = 0x0000_0020,
  X3DAUDIO_CALCULATE_EMITTER_ANGLE = 0x0000_0040,
  X3DAUDIO_CALCULATE_LPF_DIRECT = 0x0000_0004,
  X3DAUDIO_CALCULATE_LPF_REVERB = 0x0000_0008,
  X3DAUDIO_CALCULATE_MATRIX = 0x0000_0001,
  X3DAUDIO_CALCULATE_REDIRECT_TO_LFE = 0x0002_0000,
  X3DAUDIO_CALCULATE_REVERB = 0x0000_0010,
  X3DAUDIO_CALCULATE_ZEROCENTER = 0x0001_0000,
}

export enum XAUDIO2_FLAG {
  XAUDIO2_1024_QUANTUM = 0x0000_8000,
  XAUDIO2_DEBUG_ENGINE = 0x0000_0001,
  XAUDIO2_STOP_ENGINE_WHEN_IDLE = 0x0000_2000,
}

export type FLOAT32 = number;
export type LPCX3DAUDIO_EMITTER = Pointer;
export type LPCX3DAUDIO_LISTENER = Pointer;
export type LPLPVOID = Pointer;
export type LPX3DAUDIO_DSP_SETTINGS = Pointer;
export type REFCLSID = Pointer;
export type UINT32 = number;
export type X3DAUDIO_HANDLE = Pointer;
export type XAUDIO2_PROCESSOR = number;
