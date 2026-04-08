import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, DWORD_PTR, HANDLE, HMODULE, HWND, INT, LONG, LPARAM, LPBYTE, LPCSTR, LPCWSTR, LPDWORD, LPHANDLE, LPSTR, LPWSTR, LRESULT, NULL, UINT, UINT_PTR } from '@bun-win32/core';

export const MCI_ALL_DEVICE_ID = 0xffff_ffff;
export const MIDI_MAPPER = 0xffff_ffff;
export const WAVE_MAPPER = 0xffff_ffff;

export enum CallbackFlag {
  CALLBACK_EVENT = 0x0005_0000,
  CALLBACK_FUNCTION = 0x0003_0000,
  CALLBACK_NULL = 0x0000_0000,
  CALLBACK_TASK = 0x0002_0000,
  CALLBACK_THREAD = 0x0002_0000,
  CALLBACK_TYPEMASK = 0x0007_0000,
  CALLBACK_WINDOW = 0x0001_0000,
}

export enum SoundFlag {
  SND_ALIAS = 0x0001_0000,
  SND_ALIAS_ID = 0x0011_0000,
  SND_APPLICATION = 0x0000_0080,
  SND_ASYNC = 0x0000_0001,
  SND_FILENAME = 0x0002_0000,
  SND_LOOP = 0x0000_0008,
  SND_MEMORY = 0x0000_0004,
  SND_NODEFAULT = 0x0000_0002,
  SND_NOSTOP = 0x0000_0010,
  SND_NOWAIT = 0x0000_2000,
  SND_PURGE = 0x0000_0040,
  SND_RESOURCE = 0x0004_0004,
  SND_RING = 0x0010_0000,
  SND_SENTRY = 0x0008_0000,
  SND_SYNC = 0x0000_0000,
  SND_SYSTEM = 0x0020_0000,
}

export enum TimeEventFlag {
  TIME_CALLBACK_EVENT_PULSE = 0x0000_0020,
  TIME_CALLBACK_EVENT_SET = 0x0000_0010,
  TIME_CALLBACK_FUNCTION = 0x0000_0000,
  TIME_KILL_SYNCHRONOUS = 0x0000_0100,
  TIME_ONESHOT = 0x0000_0000,
  TIME_PERIODIC = 0x0000_0001,
}

export type DRIVERMSGPROC = Pointer;
export type FOURCC = number;
export type HDRVR = bigint;
export type HMIDI = bigint;
export type HMIDIIN = bigint;
export type HMIDIOUT = bigint;
export type HMIDISTRM = bigint;
export type HMIXER = bigint;
export type HMIXEROBJ = bigint;
export type HMMIO = bigint;
export type HPSTR = Pointer;
export type HTASK = bigint;
export type HWAVEIN = bigint;
export type HWAVEOUT = bigint;
export type LPAUXCAPSA = Pointer;
export type LPAUXCAPSW = Pointer;
export type LPCMMCKINFO = Pointer;
export type LPCMMIOINFO = Pointer;
export type LPCTSTR = Pointer;
export type LPCWAVEFORMATEX = Pointer;
export type LPHMIDIIN = Pointer;
export type LPHMIDIOUT = Pointer;
export type LPHMIDISTRM = Pointer;
export type LPHMIXER = Pointer;
export type LPHWAVEIN = Pointer;
export type LPHWAVEOUT = Pointer;
export type LPJOYCAPSA = Pointer;
export type LPJOYCAPSW = Pointer;
export type LPJOYINFO = Pointer;
export type LPJOYINFOEX = Pointer;
export type LPMIDIHDR = Pointer;
export type LPMIDIINCAPSA = Pointer;
export type LPMIDIINCAPSW = Pointer;
export type LPMIDIOUTCAPSA = Pointer;
export type LPMIDIOUTCAPSW = Pointer;
export type LPMIXERCAPSA = Pointer;
export type LPMIXERCAPSW = Pointer;
export type LPMIXERCONTROLDETAILS = Pointer;
export type LPMIXERLINEA = Pointer;
export type LPMIXERLINECONTROLSA = Pointer;
export type LPMIXERLINECONTROLSW = Pointer;
export type LPMIXERLINEW = Pointer;
export type LPMMCKINFO = Pointer;
export type LPMMIOINFO = Pointer;
export type LPMMIOPROC = Pointer;
export type LPMMTIME = Pointer;
export type LPTASKCALLBACK = Pointer;
export type LPTIMECALLBACK = Pointer;
export type LPTIMECAPS = Pointer;
export type LPUINT = Pointer;
export type LPWAVEHDR = Pointer;
export type LPWAVEINCAPSA = Pointer;
export type LPWAVEINCAPSW = Pointer;
export type LPWAVEOUTCAPSA = Pointer;
export type LPWAVEOUTCAPSW = Pointer;
export type LPWORD = Pointer;
export type MCIDEVICEID = number;
export type MCIERROR = number;
export type MMRESULT = number;
export type YIELDPROC = Pointer;
