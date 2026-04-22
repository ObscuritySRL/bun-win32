import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, HANDLE, HRESULT, LONG, LPCVOID, LPCWSTR, LPDWORD, LPVOID, LPWSTR, NULL, UINT, ULONG } from '@bun-win32/core';

// ── MF-specific scalar aliases ──────────────────────────────────────────────

export type MediaEventType = number;
export type MFStandardVideoFormat = number;
export type MFVideoInterlaceMode = number;
export type UINT32 = number;

// ── MF-specific 64-bit aliases ──────────────────────────────────────────────

export type INT64 = bigint;
export type LONGLONG = bigint;
export type MFTIME = bigint;
export type MFWORKITEM_KEY = bigint;
export type QWORD = bigint;
export type UINT64 = bigint;

// ── MF-specific pointer aliases ─────────────────────────────────────────────

export type LPCGUID = Pointer;
export type LPLPBYTE = Pointer;
export type LPLPVOID = Pointer;
export type LPPROPVARIANT = Pointer;
export type MFPERIODICCALLBACK = Pointer;
export type PBYTE = Pointer;
export type PCWSTR = Pointer;
export type PMFVIDEOFORMAT = Pointer;
export type PMFWORKITEM_KEY = Pointer;
export type PPMFVIDEOFORMAT = Pointer;
export type PPWAVEFORMATEX = Pointer;
export type PUINT32 = Pointer;
export type REFCLSID = Pointer;
export type REFGUID = Pointer;
export type REFIID = Pointer;

// ── COM/MF interface pointer aliases ────────────────────────────────────────

export type IClassFactory = Pointer;
export type IMediaBuffer = Pointer;
export type IMFActivate = Pointer;
export type IMFAsyncCallback = Pointer;
export type IMFAsyncResult = Pointer;
export type IMFAttributes = Pointer;
export type IMFAudioMediaType = Pointer;
export type IMFByteStream = Pointer;
export type IMFCollection = Pointer;
export type IMFContentDecryptorContext = Pointer;
export type IMFContentProtectionDevice = Pointer;
export type IMFDXGIDeviceManager = Pointer;
export type IMFMediaBuffer = Pointer;
export type IMFMediaEvent = Pointer;
export type IMFMediaEventQueue = Pointer;
export type IMFMediaType = Pointer;
export type IMFPluginControl = Pointer;
export type IMFPresentationDescriptor = Pointer;
export type IMFPresentationTimeSource = Pointer;
export type IMFSample = Pointer;
export type IMFSourceResolver = Pointer;
export type IMFStreamDescriptor = Pointer;
export type IMFVideoMediaType = Pointer;
export type IPropertyStore = Pointer;
export type IStream = Pointer;
export type IUnknown = Pointer;

// Pointer-to-pointer outputs (`T**`) for `_Outptr_` parameters.

export type PIClassFactory = Pointer;
export type PIMediaBuffer = Pointer;
export type PIMFActivate = Pointer;
export type PIMFAsyncResult = Pointer;
export type PIMFAttributes = Pointer;
export type PIMFAudioMediaType = Pointer;
export type PIMFByteStream = Pointer;
export type PIMFCollection = Pointer;
export type PIMFContentDecryptorContext = Pointer;
export type PIMFContentProtectionDevice = Pointer;
export type PIMFDXGIDeviceManager = Pointer;
export type PIMFMediaBuffer = Pointer;
export type PIMFMediaEvent = Pointer;
export type PIMFMediaEventQueue = Pointer;
export type PIMFMediaType = Pointer;
export type PIMFPluginControl = Pointer;
export type PIMFPresentationDescriptor = Pointer;
export type PIMFPresentationTimeSource = Pointer;
export type PIMFSample = Pointer;
export type PIMFSourceResolver = Pointer;
export type PIMFStreamDescriptor = Pointer;
export type PIMFVideoMediaType = Pointer;
export type PIPropertyStore = Pointer;
export type PIStream = Pointer;
export type PIUnknown = Pointer;
export type PPAMMEDIATYPE = Pointer;

// ── Enums / constants ───────────────────────────────────────────────────────

export const MF_SDK_VERSION = 0x0002;
export const MF_API_VERSION = 0x0070;
export const MF_VERSION = (MF_SDK_VERSION << 16) | MF_API_VERSION;

export enum MFStartupFlags {
  MFSTARTUP_NOSOCKET = 0x1,
  MFSTARTUP_LITE = 0x1,
  MFSTARTUP_FULL = 0,
}

export enum MF_FILE_ACCESSMODE {
  MF_ACCESSMODE_READ = 1,
  MF_ACCESSMODE_WRITE = 2,
  MF_ACCESSMODE_READWRITE = 3,
}

export enum MF_FILE_OPENMODE {
  MF_OPENMODE_FAIL_IF_NOT_EXIST = 0,
  MF_OPENMODE_FAIL_IF_EXIST = 1,
  MF_OPENMODE_RESET_IF_EXIST = 2,
  MF_OPENMODE_APPEND_IF_EXIST = 3,
  MF_OPENMODE_DELETE_IF_EXIST = 4,
}

export enum MF_FILE_FLAGS {
  MF_FILEFLAGS_NONE = 0,
  MF_FILEFLAGS_NOBUFFERING = 0x1,
  MF_FILEFLAGS_ALLOW_WRITE_SHARING = 0x2,
}

export enum MFASYNC_WORKQUEUE_TYPE {
  MF_STANDARD_WORKQUEUE = 0,
  MF_WINDOW_WORKQUEUE = 1,
  MF_MULTITHREADED_WORKQUEUE = 2,
}

export enum MFT_ENUM_FLAG {
  MFT_ENUM_FLAG_SYNCMFT = 0x00000001,
  MFT_ENUM_FLAG_ASYNCMFT = 0x00000002,
  MFT_ENUM_FLAG_HARDWARE = 0x00000004,
  MFT_ENUM_FLAG_FIELDOFUSE = 0x00000008,
  MFT_ENUM_FLAG_LOCALMFT = 0x00000010,
  MFT_ENUM_FLAG_TRANSCODE_ONLY = 0x00000020,
  MFT_ENUM_FLAG_SORTANDFILTER = 0x00000040,
  MFT_ENUM_FLAG_SORTANDFILTER_APPROVED_ONLY = 0x000000c0,
  MFT_ENUM_FLAG_SORTANDFILTER_WEB_ONLY = 0x00000140,
  MFT_ENUM_FLAG_SORTANDFILTER_WEB_ONLY_EDGEMODE = 0x00000240,
  MFT_ENUM_FLAG_UNTRUSTED_STOREMFT = 0x00000400,
  MFT_ENUM_FLAG_ALL = 0x0000003f,
}

export enum MFSessionCaps {
  MFSESSIONCAP_START = 0x00000001,
  MFSESSIONCAP_SEEK = 0x00000002,
  MFSESSIONCAP_PAUSE = 0x00000004,
  MFSESSIONCAP_RATE_FORWARD = 0x00000010,
  MFSESSIONCAP_RATE_REVERSE = 0x00000020,
  MFSESSIONCAP_DOES_NOT_USE_NETWORK = 0x00000040,
}

export enum MFAlignment {
  MF_1_BYTE_ALIGNMENT = 0x00000000,
  MF_2_BYTE_ALIGNMENT = 0x00000001,
  MF_4_BYTE_ALIGNMENT = 0x00000003,
  MF_8_BYTE_ALIGNMENT = 0x00000007,
  MF_16_BYTE_ALIGNMENT = 0x0000000f,
  MF_32_BYTE_ALIGNMENT = 0x0000001f,
  MF_64_BYTE_ALIGNMENT = 0x0000003f,
  MF_128_BYTE_ALIGNMENT = 0x0000007f,
  MF_256_BYTE_ALIGNMENT = 0x000000ff,
  MF_512_BYTE_ALIGNMENT = 0x000001ff,
  MF_1024_BYTE_ALIGNMENT = 0x000003ff,
  MF_2048_BYTE_ALIGNMENT = 0x000007ff,
  MF_4096_BYTE_ALIGNMENT = 0x00000fff,
  MF_8192_BYTE_ALIGNMENT = 0x00001fff,
}

export enum MFWaveFormatExConvertFlags {
  MFWaveFormatExConvertFlag_Normal = 0,
  MFWaveFormatExConvertFlag_ForceExtensible = 1,
}

// Selected common Media Foundation GUIDs (string representations).
// Use these with the MF_* attribute and format APIs after converting to 16-byte buffers.

export const MFMediaType_Audio = '73647561-0000-0010-8000-00aa00389b71';
export const MFMediaType_Video = '73646976-0000-0010-8000-00aa00389b71';
export const MFMediaType_Image = '72656D69-0000-0010-8000-00aa00389b71';
export const MFMediaType_Default = '81a412e6-8103-4b06-857f-1862781024ac';
export const MFMediaType_Script = '72636353-0000-0010-8000-00aa00389b71';
export const MFMediaType_Protected = '7b4b6fe6-9d04-4494-be14-7e0bd076c8e4';
export const MFMediaType_SAMI = 'e69669a0-3dcd-40cb-9e2e-3708387c0616';
export const MFMediaType_FileTransfer = '72178c25-e45b-11d5-bc2a-00b0d0f3f4ab';
export const MFMediaType_Stream = 'e436eb83-524f-11ce-9f53-0020af0ba770';

export const MFVideoFormat_RGB32 = '00000016-0000-0010-8000-00aa00389b71';
export const MFVideoFormat_ARGB32 = '00000015-0000-0010-8000-00aa00389b71';
export const MFVideoFormat_RGB24 = '00000014-0000-0010-8000-00aa00389b71';
export const MFVideoFormat_NV12 = '3231564e-0000-0010-8000-00aa00389b71';
export const MFVideoFormat_YUY2 = '32595559-0000-0010-8000-00aa00389b71';
export const MFVideoFormat_IYUV = '56555949-0000-0010-8000-00aa00389b71';
export const MFVideoFormat_H264 = '34363248-0000-0010-8000-00aa00389b71';
export const MFVideoFormat_HEVC = '43564548-0000-0010-8000-00aa00389b71';
export const MFVideoFormat_H265 = '35363248-0000-0010-8000-00aa00389b71';
export const MFVideoFormat_MJPG = '47504a4d-0000-0010-8000-00aa00389b71';
export const MFVideoFormat_MPEG2 = 'e06d8026-db46-11cf-b4d1-00805f6cbbea';
export const MFVideoFormat_WMV3 = '33564d57-0000-0010-8000-00aa00389b71';
export const MFVideoFormat_VP80 = '30385056-0000-0010-8000-00aa00389b71';
export const MFVideoFormat_VP90 = '30395056-0000-0010-8000-00aa00389b71';
export const MFVideoFormat_AV1 = '31305641-0000-0010-8000-00aa00389b71';

export const MFAudioFormat_PCM = '00000001-0000-0010-8000-00aa00389b71';
export const MFAudioFormat_Float = '00000003-0000-0010-8000-00aa00389b71';
export const MFAudioFormat_AAC = '00001610-0000-0010-8000-00aa00389b71';
export const MFAudioFormat_MP3 = '00000055-0000-0010-8000-00aa00389b71';
export const MFAudioFormat_FLAC = '0000f1ac-0000-0010-8000-00aa00389b71';
export const MFAudioFormat_ALAC = '6c616361-767a-494d-b478-f29d25dc9037';
export const MFAudioFormat_Opus = '704f0000-0000-0010-8000-00aa00389b71';

// MFT category GUIDs.

export const MFT_CATEGORY_VIDEO_DECODER = 'd6c02d4b-6833-45b4-971a-05a4b04bab91';
export const MFT_CATEGORY_VIDEO_ENCODER = 'f79eac7d-e545-4387-bdee-d647d7bde42a';
export const MFT_CATEGORY_VIDEO_EFFECT = '12e17c21-532c-4a6e-8a1c-40825a736397';
export const MFT_CATEGORY_MULTIPLEXER = '059c561e-05ae-4b61-b69d-55b4c839c0c0';
export const MFT_CATEGORY_DEMULTIPLEXER = 'a8700a7a-939b-44c5-99d7-76226b23b3f1';
export const MFT_CATEGORY_AUDIO_DECODER = '9ea73fb4-ef7a-4559-8d5d-719d8f0426c7';
export const MFT_CATEGORY_AUDIO_ENCODER = '91c64bd0-f91e-4d8c-9276-db248279d975';
export const MFT_CATEGORY_AUDIO_EFFECT = '11064c48-3648-4ed0-932e-05ce8ac811b7';
export const MFT_CATEGORY_VIDEO_PROCESSOR = '302ea3fc-aa5f-47f9-9f7a-c2188bb16302';
export const MFT_CATEGORY_OTHER = '90175d57-b7ea-4901-aeb3-933a8747756f';
