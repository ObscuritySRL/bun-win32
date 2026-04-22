import type { Pointer } from 'bun:ffi';

export type { HRESULT, LPCWSTR, NULL } from '@bun-win32/core';

export type IActivateAudioInterfaceCompletionHandler = Pointer;
export type LPLPVOID = Pointer;
export type PIActivateAudioInterfaceAsyncOperation = Pointer;
export type PPROPVARIANT = Pointer;
export type PPVOID = Pointer;
export type REFCLSID = Pointer;
export type REFIID = Pointer;

export enum AUDIO_STREAM_CATEGORY {
  AudioCategory_Other = 0,
  AudioCategory_ForegroundOnlyMedia = 1,
  AudioCategory_Communications = 3,
  AudioCategory_Alerts = 4,
  AudioCategory_SoundEffects = 5,
  AudioCategory_GameEffects = 6,
  AudioCategory_GameMedia = 7,
  AudioCategory_GameChat = 8,
  AudioCategory_Speech = 9,
  AudioCategory_Movie = 10,
  AudioCategory_Media = 11,
  AudioCategory_FarFieldSpeech = 12,
  AudioCategory_UniformSpeech = 13,
  AudioCategory_VoiceTyping = 14,
}

export enum EDataFlow {
  eRender = 0,
  eCapture = 1,
  eAll = 2,
  EDataFlow_enum_count = 3,
}

export enum ERole {
  eConsole = 0,
  eMultimedia = 1,
  eCommunications = 2,
  ERole_enum_count = 3,
}

export enum DEVICE_STATE {
  DEVICE_STATE_ACTIVE = 0x0000_0001,
  DEVICE_STATE_DISABLED = 0x0000_0002,
  DEVICE_STATE_NOTPRESENT = 0x0000_0004,
  DEVICE_STATE_UNPLUGGED = 0x0000_0008,
  DEVICE_STATEMASK_ALL = 0x0000_000f,
}

export const CLSID_MMDeviceEnumerator = 'bcde0395-e52f-467c-8e3d-c4579291692e';
export const IID_IMMDeviceEnumerator = 'a95664d2-9614-4f35-a746-de8db63617e6';
export const IID_IMMDevice = 'd666063f-1587-4e43-81f1-b948e807363f';
export const IID_IMMDeviceCollection = '0bd7a1be-7a1a-44db-8397-cc5392387b5e';
export const IID_IAudioClient = '1cb9ad4c-dbfa-4c32-b178-c2f568a703b2';
export const IID_IAudioClient2 = '726778cd-f60a-4eda-82de-e47610cd78aa';
export const IID_IAudioClient3 = '7ed4ee07-8e67-4cd4-8c1a-2b7a5987ad42';
