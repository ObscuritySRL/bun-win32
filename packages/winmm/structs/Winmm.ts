import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DRIVERMSGPROC,
  DWORD,
  DWORD_PTR,
  FOURCC,
  HANDLE,
  HDRVR,
  HMIDI,
  HMIDIIN,
  HMIDIOUT,
  HMIDISTRM,
  HMIXER,
  HMIXEROBJ,
  HMMIO,
  HMODULE,
  HPSTR,
  HTASK,
  HWAVEIN,
  HWAVEOUT,
  HWND,
  INT,
  LONG,
  LPARAM,
  LPAUXCAPSA,
  LPAUXCAPSW,
  LPBYTE,
  LPCMMCKINFO,
  LPCMMIOINFO,
  LPCSTR,
  LPCTSTR,
  LPCWAVEFORMATEX,
  LPCWSTR,
  LPDWORD,
  LPHANDLE,
  LPHMIDIIN,
  LPHMIDIOUT,
  LPHMIDISTRM,
  LPHMIXER,
  LPHWAVEIN,
  LPHWAVEOUT,
  LPJOYCAPSA,
  LPJOYCAPSW,
  LPJOYINFO,
  LPJOYINFOEX,
  LPMIDIHDR,
  LPMIDIINCAPSA,
  LPMIDIINCAPSW,
  LPMIDIOUTCAPSA,
  LPMIDIOUTCAPSW,
  LPMIXERCAPSA,
  LPMIXERCAPSW,
  LPMIXERCONTROLDETAILS,
  LPMIXERLINEA,
  LPMIXERLINECONTROLSA,
  LPMIXERLINECONTROLSW,
  LPMIXERLINEW,
  LPMMCKINFO,
  LPMMIOINFO,
  LPMMIOPROC,
  LPMMTIME,
  LPSTR,
  LPTASKCALLBACK,
  LPTIMECALLBACK,
  LPTIMECAPS,
  LPUINT,
  LPWAVEHDR,
  LPWAVEINCAPSA,
  LPWAVEINCAPSW,
  LPWAVEOUTCAPSA,
  LPWAVEOUTCAPSW,
  LPWORD,
  LPWSTR,
  LRESULT,
  MCIDEVICEID,
  MCIERROR,
  MMRESULT,
  NULL,
  UINT,
  UINT_PTR,
  YIELDPROC,
} from '../types/Winmm';

/**
 * Thin, lazy-loaded FFI bindings for `winmm.dll`.
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
 * import Winmm from './structs/Winmm';
 *
 * // Lazy: bind on first call
 * const tickCount = Winmm.timeGetTime();
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Winmm.Preload(['timeGetTime', 'waveOutGetNumDevs']);
 * ```
 */
class Winmm extends Win32 {
  protected static override name = 'winmm.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CloseDriver: { args: [FFIType.u64, FFIType.i64, FFIType.i64], returns: FFIType.i64 },
    DefDriverProc: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.i64, FFIType.i64], returns: FFIType.i64 },
    DriverCallback: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    DrvGetModuleHandle: { args: [FFIType.u64], returns: FFIType.u64 },
    GetDriverModuleHandle: { args: [FFIType.u64], returns: FFIType.u64 },
    OpenDriver: { args: [FFIType.ptr, FFIType.ptr, FFIType.i64], returns: FFIType.u64 },
    PlaySound: { args: [FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    PlaySoundA: { args: [FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    PlaySoundW: { args: [FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SendDriverMessage: { args: [FFIType.u64, FFIType.u32, FFIType.i64, FFIType.i64], returns: FFIType.i64 },
    auxGetDevCapsA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    auxGetDevCapsW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    auxGetNumDevs: { args: [], returns: FFIType.u32 },
    auxGetVolume: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    auxOutMessage: { args: [FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    auxSetVolume: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    joyConfigChanged: { args: [FFIType.u32], returns: FFIType.u32 },
    joyGetDevCapsA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    joyGetDevCapsW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    joyGetNumDevs: { args: [], returns: FFIType.u32 },
    joyGetPos: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    joyGetPosEx: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    joyGetThreshold: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    joyReleaseCapture: { args: [FFIType.u32], returns: FFIType.u32 },
    joySetCapture: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    joySetThreshold: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    mciDriverNotify: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    mciDriverYield: { args: [FFIType.u32], returns: FFIType.u32 },
    mciExecute: { args: [FFIType.ptr], returns: FFIType.i32 },
    mciFreeCommandResource: { args: [FFIType.u32], returns: FFIType.i32 },
    mciGetCreatorTask: { args: [FFIType.u32], returns: FFIType.u64 },
    mciGetDeviceIDA: { args: [FFIType.ptr], returns: FFIType.u32 },
    mciGetDeviceIDFromElementIDA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    mciGetDeviceIDFromElementIDW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    mciGetDeviceIDW: { args: [FFIType.ptr], returns: FFIType.u32 },
    mciGetDriverData: { args: [FFIType.u32], returns: FFIType.u64 },
    mciGetErrorStringA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    mciGetErrorStringW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    mciGetYieldProc: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    mciLoadCommandResource: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mciSendCommandA: { args: [FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    mciSendCommandW: { args: [FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    mciSendStringA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    mciSendStringW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    mciSetDriverData: { args: [FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    mciSetYieldProc: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    midiConnect: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    midiDisconnect: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    midiInAddBuffer: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiInClose: { args: [FFIType.u64], returns: FFIType.u32 },
    midiInGetDevCapsA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiInGetDevCapsW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiInGetErrorTextA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiInGetErrorTextW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiInGetID: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    midiInGetNumDevs: { args: [], returns: FFIType.u32 },
    midiInMessage: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    midiInOpen: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    midiInPrepareHeader: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiInReset: { args: [FFIType.u64], returns: FFIType.u32 },
    midiInStart: { args: [FFIType.u64], returns: FFIType.u32 },
    midiInStop: { args: [FFIType.u64], returns: FFIType.u32 },
    midiInUnprepareHeader: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiOutCacheDrumPatches: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiOutCachePatches: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiOutClose: { args: [FFIType.u64], returns: FFIType.u32 },
    midiOutGetDevCapsA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiOutGetDevCapsW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiOutGetErrorTextA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiOutGetErrorTextW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiOutGetID: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    midiOutGetNumDevs: { args: [], returns: FFIType.u32 },
    midiOutGetVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    midiOutLongMsg: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiOutMessage: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    midiOutOpen: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    midiOutPrepareHeader: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiOutReset: { args: [FFIType.u64], returns: FFIType.u32 },
    midiOutSetVolume: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    midiOutShortMsg: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    midiOutUnprepareHeader: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiStreamClose: { args: [FFIType.u64], returns: FFIType.u32 },
    midiStreamOpen: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    midiStreamOut: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiStreamPause: { args: [FFIType.u64], returns: FFIType.u32 },
    midiStreamPosition: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiStreamProperty: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    midiStreamRestart: { args: [FFIType.u64], returns: FFIType.u32 },
    midiStreamStop: { args: [FFIType.u64], returns: FFIType.u32 },
    mixerClose: { args: [FFIType.u64], returns: FFIType.u32 },
    mixerGetControlDetailsA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mixerGetControlDetailsW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mixerGetDevCapsA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mixerGetDevCapsW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mixerGetID: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mixerGetLineControlsA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mixerGetLineControlsW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mixerGetLineInfoA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mixerGetLineInfoW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mixerGetNumDevs: { args: [], returns: FFIType.u32 },
    mixerMessage: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    mixerOpen: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    mixerSetControlDetails: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mmDrvInstall: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mmGetCurrentTask: { args: [], returns: FFIType.u32 },
    mmTaskBlock: { args: [FFIType.u32], returns: FFIType.void },
    mmTaskCreate: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.u32 },
    mmTaskSignal: { args: [FFIType.u32], returns: FFIType.i32 },
    mmTaskYield: { args: [], returns: FFIType.void },
    mmioAdvance: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mmioAscend: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mmioClose: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    mmioCreateChunk: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mmioDescend: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mmioFlush: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    mmioGetInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mmioInstallIOProcA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    mmioInstallIOProcW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    mmioOpenA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    mmioOpenW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    mmioRead: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    mmioRenameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mmioRenameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mmioSeek: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    mmioSendMessage: { args: [FFIType.u64, FFIType.u32, FFIType.i64, FFIType.i64], returns: FFIType.i64 },
    mmioSetBuffer: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.u32 },
    mmioSetInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mmioStringToFOURCCA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mmioStringToFOURCCW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    mmioWrite: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    mmsystemGetVersion: { args: [], returns: FFIType.u32 },
    sndPlaySoundA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    sndPlaySoundW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    timeBeginPeriod: { args: [FFIType.u32], returns: FFIType.u32 },
    timeEndPeriod: { args: [FFIType.u32], returns: FFIType.u32 },
    timeGetDevCaps: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    timeGetSystemTime: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    timeGetTime: { args: [], returns: FFIType.u32 },
    timeKillEvent: { args: [FFIType.u32], returns: FFIType.u32 },
    timeSetEvent: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    waveInAddBuffer: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    waveInClose: { args: [FFIType.u64], returns: FFIType.u32 },
    waveInGetDevCapsA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    waveInGetDevCapsW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    waveInGetErrorTextA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    waveInGetErrorTextW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    waveInGetID: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    waveInGetNumDevs: { args: [], returns: FFIType.u32 },
    waveInGetPosition: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    waveInMessage: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    waveInOpen: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    waveInPrepareHeader: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    waveInReset: { args: [FFIType.u64], returns: FFIType.u32 },
    waveInStart: { args: [FFIType.u64], returns: FFIType.u32 },
    waveInStop: { args: [FFIType.u64], returns: FFIType.u32 },
    waveInUnprepareHeader: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    waveOutBreakLoop: { args: [FFIType.u64], returns: FFIType.u32 },
    waveOutClose: { args: [FFIType.u64], returns: FFIType.u32 },
    waveOutGetDevCapsA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    waveOutGetDevCapsW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    waveOutGetErrorTextA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    waveOutGetErrorTextW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    waveOutGetID: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    waveOutGetNumDevs: { args: [], returns: FFIType.u32 },
    waveOutGetPitch: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    waveOutGetPlaybackRate: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    waveOutGetPosition: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    waveOutGetVolume: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    waveOutMessage: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    waveOutOpen: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    waveOutPause: { args: [FFIType.u64], returns: FFIType.u32 },
    waveOutPrepareHeader: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    waveOutReset: { args: [FFIType.u64], returns: FFIType.u32 },
    waveOutRestart: { args: [FFIType.u64], returns: FFIType.u32 },
    waveOutSetPitch: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    waveOutSetPlaybackRate: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    waveOutSetVolume: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    waveOutUnprepareHeader: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    waveOutWrite: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-closedriver
  public static CloseDriver(hDriver: HDRVR, lParam1: LPARAM, lParam2: LPARAM): LRESULT {
    return Winmm.Load('CloseDriver')(hDriver, lParam1, lParam2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-drvdefdriverproc
  public static DefDriverProc(dwDriverIdentifier: DWORD_PTR, hdrvr: HDRVR, uMsg: UINT, lParam1: LPARAM, lParam2: LPARAM): LRESULT {
    return Winmm.Load('DefDriverProc')(dwDriverIdentifier, hdrvr, uMsg, lParam1, lParam2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-drivercallback
  public static DriverCallback(dwCallback: DWORD_PTR, dwFlags: DWORD, hDevice: HDRVR, dwMsg: DWORD, dwUser: DWORD_PTR, dwParam1: DWORD_PTR, dwParam2: DWORD_PTR): BOOL {
    return Winmm.Load('DriverCallback')(dwCallback, dwFlags, hDevice, dwMsg, dwUser, dwParam1, dwParam2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-drvgetmodulehandle
  public static DrvGetModuleHandle(hDriver: HDRVR): HMODULE {
    return Winmm.Load('DrvGetModuleHandle')(hDriver);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-getdrivermodulehandle
  public static GetDriverModuleHandle(hDriver: HDRVR): HMODULE {
    return Winmm.Load('GetDriverModuleHandle')(hDriver);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-opendriver
  public static OpenDriver(szDriverName: LPCWSTR, szSectionName: LPCWSTR | NULL, lParam2: LPARAM): HDRVR {
    return Winmm.Load('OpenDriver')(szDriverName, szSectionName, lParam2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/multimedia/the-playsound-function
  public static PlaySound(pszSound: LPCTSTR | NULL, hmod: HMODULE | 0n, fdwSound: DWORD): BOOL {
    return Winmm.Load('PlaySound')(pszSound, hmod, fdwSound);
  }

  // https://learn.microsoft.com/en-us/windows/win32/multimedia/the-playsound-function
  public static PlaySoundA(pszSound: LPCSTR | NULL, hmod: HMODULE | 0n, fdwSound: DWORD): BOOL {
    return Winmm.Load('PlaySoundA')(pszSound, hmod, fdwSound);
  }

  // https://learn.microsoft.com/en-us/windows/win32/multimedia/the-playsound-function
  public static PlaySoundW(pszSound: LPCWSTR | NULL, hmod: HMODULE | 0n, fdwSound: DWORD): BOOL {
    return Winmm.Load('PlaySoundW')(pszSound, hmod, fdwSound);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-senddrivermessage
  public static SendDriverMessage(hDriver: HDRVR, message: UINT, lParam1: LPARAM, lParam2: LPARAM): LRESULT {
    return Winmm.Load('SendDriverMessage')(hDriver, message, lParam1, lParam2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-auxgetdevcapsa
  public static auxGetDevCapsA(uDeviceID: UINT_PTR, pac: LPAUXCAPSA, cbac: UINT): MMRESULT {
    return Winmm.Load('auxGetDevCapsA')(uDeviceID, pac, cbac);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-auxgetdevcapsw
  public static auxGetDevCapsW(uDeviceID: UINT_PTR, pac: LPAUXCAPSW, cbac: UINT): MMRESULT {
    return Winmm.Load('auxGetDevCapsW')(uDeviceID, pac, cbac);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-auxgetnumdevs
  public static auxGetNumDevs(): UINT {
    return Winmm.Load('auxGetNumDevs')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-auxgetvolume
  public static auxGetVolume(uDeviceID: UINT, pdwVolume: LPDWORD): MMRESULT {
    return Winmm.Load('auxGetVolume')(uDeviceID, pdwVolume);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-auxoutmessage
  public static auxOutMessage(uDeviceID: UINT, uMsg: UINT, dw1: DWORD_PTR, dw2: DWORD_PTR): MMRESULT {
    return Winmm.Load('auxOutMessage')(uDeviceID, uMsg, dw1, dw2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-auxsetvolume
  public static auxSetVolume(uDeviceID: UINT, dwVolume: DWORD): MMRESULT {
    return Winmm.Load('auxSetVolume')(uDeviceID, dwVolume);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/joystickapi/nf-joystickapi-joyconfigchanged
  public static joyConfigChanged(dwFlags: DWORD): MMRESULT {
    return Winmm.Load('joyConfigChanged')(dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/joystickapi/nf-joystickapi-joygetdevcapsa
  public static joyGetDevCapsA(uJoyID: UINT_PTR, pjc: LPJOYCAPSA, cbjc: UINT): MMRESULT {
    return Winmm.Load('joyGetDevCapsA')(uJoyID, pjc, cbjc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/joystickapi/nf-joystickapi-joygetdevcapsw
  public static joyGetDevCapsW(uJoyID: UINT_PTR, pjc: LPJOYCAPSW, cbjc: UINT): MMRESULT {
    return Winmm.Load('joyGetDevCapsW')(uJoyID, pjc, cbjc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/joystickapi/nf-joystickapi-joygetnumdevs
  public static joyGetNumDevs(): UINT {
    return Winmm.Load('joyGetNumDevs')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/joystickapi/nf-joystickapi-joygetpos
  public static joyGetPos(uJoyID: UINT, pji: LPJOYINFO): MMRESULT {
    return Winmm.Load('joyGetPos')(uJoyID, pji);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/joystickapi/nf-joystickapi-joygetposex
  public static joyGetPosEx(uJoyID: UINT, pji: LPJOYINFOEX): MMRESULT {
    return Winmm.Load('joyGetPosEx')(uJoyID, pji);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/joystickapi/nf-joystickapi-joygetthreshold
  public static joyGetThreshold(uJoyID: UINT, puThreshold: LPUINT): MMRESULT {
    return Winmm.Load('joyGetThreshold')(uJoyID, puThreshold);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/joystickapi/nf-joystickapi-joyreleasecapture
  public static joyReleaseCapture(uJoyID: UINT): MMRESULT {
    return Winmm.Load('joyReleaseCapture')(uJoyID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/joystickapi/nf-joystickapi-joysetcapture
  public static joySetCapture(hwnd: HWND, uJoyID: UINT, uPeriod: UINT, fChanged: BOOL): MMRESULT {
    return Winmm.Load('joySetCapture')(hwnd, uJoyID, uPeriod, fChanged);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/joystickapi/nf-joystickapi-joysetthreshold
  public static joySetThreshold(uJoyID: UINT, uThreshold: UINT): MMRESULT {
    return Winmm.Load('joySetThreshold')(uJoyID, uThreshold);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciDriverNotify(hwndCallback: HANDLE, wDeviceID: MCIDEVICEID, uStatus: UINT): BOOL {
    return Winmm.Load('mciDriverNotify')(hwndCallback, wDeviceID, uStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciDriverYield(wDeviceID: MCIDEVICEID): UINT {
    return Winmm.Load('mciDriverYield')(wDeviceID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciExecute(pszCommand: LPCSTR): BOOL {
    return Winmm.Load('mciExecute')(pszCommand);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciFreeCommandResource(wTable: UINT): BOOL {
    return Winmm.Load('mciFreeCommandResource')(wTable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciGetCreatorTask(mciId: MCIDEVICEID): HTASK {
    return Winmm.Load('mciGetCreatorTask')(mciId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciGetDeviceIDA(pszDevice: LPCSTR): MCIDEVICEID {
    return Winmm.Load('mciGetDeviceIDA')(pszDevice);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciGetDeviceIDFromElementIDA(dwElementID: DWORD, lpstrType: LPCSTR): MCIDEVICEID {
    return Winmm.Load('mciGetDeviceIDFromElementIDA')(dwElementID, lpstrType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciGetDeviceIDFromElementIDW(dwElementID: DWORD, lpstrType: LPCWSTR): MCIDEVICEID {
    return Winmm.Load('mciGetDeviceIDFromElementIDW')(dwElementID, lpstrType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciGetDeviceIDW(pszDevice: LPCWSTR): MCIDEVICEID {
    return Winmm.Load('mciGetDeviceIDW')(pszDevice);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciGetDriverData(wDeviceID: MCIDEVICEID): DWORD_PTR {
    return Winmm.Load('mciGetDriverData')(wDeviceID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciGetErrorStringA(mcierr: MCIERROR, pszText: LPSTR, cchText: UINT): BOOL {
    return Winmm.Load('mciGetErrorStringA')(mcierr, pszText, cchText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciGetErrorStringW(mcierr: MCIERROR, pszText: LPWSTR, cchText: UINT): BOOL {
    return Winmm.Load('mciGetErrorStringW')(mcierr, pszText, cchText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciGetYieldProc(mciId: MCIDEVICEID, pdwYieldData: LPDWORD): YIELDPROC {
    return Winmm.Load('mciGetYieldProc')(mciId, pdwYieldData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciLoadCommandResource(hInstance: HANDLE, lpResName: LPCWSTR, wType: UINT): UINT {
    return Winmm.Load('mciLoadCommandResource')(hInstance, lpResName, wType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciSendCommandA(mciId: MCIDEVICEID, uMsg: UINT, dwParam1: DWORD_PTR, dwParam2: DWORD_PTR): MCIERROR {
    return Winmm.Load('mciSendCommandA')(mciId, uMsg, dwParam1, dwParam2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciSendCommandW(mciId: MCIDEVICEID, uMsg: UINT, dwParam1: DWORD_PTR, dwParam2: DWORD_PTR): MCIERROR {
    return Winmm.Load('mciSendCommandW')(mciId, uMsg, dwParam1, dwParam2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciSendStringA(lpstrCommand: LPCSTR, lpstrReturnString: LPSTR | NULL, uReturnLength: UINT, hwndCallback: HWND | 0n): MCIERROR {
    return Winmm.Load('mciSendStringA')(lpstrCommand, lpstrReturnString, uReturnLength, hwndCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciSendStringW(lpstrCommand: LPCWSTR, lpstrReturnString: LPWSTR | NULL, uReturnLength: UINT, hwndCallback: HWND | 0n): MCIERROR {
    return Winmm.Load('mciSendStringW')(lpstrCommand, lpstrReturnString, uReturnLength, hwndCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciSetDriverData(wDeviceID: MCIDEVICEID, dwData: DWORD_PTR): BOOL {
    return Winmm.Load('mciSetDriverData')(wDeviceID, dwData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mciSetYieldProc(mciId: MCIDEVICEID, fpYieldProc: YIELDPROC | NULL, dwYieldData: DWORD): BOOL {
    return Winmm.Load('mciSetYieldProc')(mciId, fpYieldProc, dwYieldData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiconnect
  public static midiConnect(hmi: HMIDI, hmo: HMIDIOUT, pReserved: NULL): MMRESULT {
    return Winmm.Load('midiConnect')(hmi, hmo, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-mididisconnect
  public static midiDisconnect(hmi: HMIDI, hmo: HMIDIOUT, pReserved: NULL): MMRESULT {
    return Winmm.Load('midiDisconnect')(hmi, hmo, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiinaddbuffer
  public static midiInAddBuffer(hmi: HMIDIIN, pmh: LPMIDIHDR, cbmh: UINT): MMRESULT {
    return Winmm.Load('midiInAddBuffer')(hmi, pmh, cbmh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiinclose
  public static midiInClose(hmi: HMIDIIN): MMRESULT {
    return Winmm.Load('midiInClose')(hmi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiingetdevcapsa
  public static midiInGetDevCapsA(uDeviceID: UINT_PTR, pmic: LPMIDIINCAPSA, cbmic: UINT): MMRESULT {
    return Winmm.Load('midiInGetDevCapsA')(uDeviceID, pmic, cbmic);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiingetdevcapsw
  public static midiInGetDevCapsW(uDeviceID: UINT_PTR, pmic: LPMIDIINCAPSW, cbmic: UINT): MMRESULT {
    return Winmm.Load('midiInGetDevCapsW')(uDeviceID, pmic, cbmic);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiingeterrortexta
  public static midiInGetErrorTextA(mmrError: MMRESULT, pszText: LPSTR, cchText: UINT): MMRESULT {
    return Winmm.Load('midiInGetErrorTextA')(mmrError, pszText, cchText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiingeterrortextw
  public static midiInGetErrorTextW(mmrError: MMRESULT, pszText: LPWSTR, cchText: UINT): MMRESULT {
    return Winmm.Load('midiInGetErrorTextW')(mmrError, pszText, cchText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiingetid
  public static midiInGetID(hmi: HMIDIIN, puDeviceID: LPUINT): MMRESULT {
    return Winmm.Load('midiInGetID')(hmi, puDeviceID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiingetnumdevs
  public static midiInGetNumDevs(): UINT {
    return Winmm.Load('midiInGetNumDevs')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiinmessage
  public static midiInMessage(hmi: HMIDIIN | 0n, uMsg: UINT, dw1: DWORD_PTR, dw2: DWORD_PTR): MMRESULT {
    return Winmm.Load('midiInMessage')(hmi, uMsg, dw1, dw2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiinopen
  public static midiInOpen(phmi: LPHMIDIIN, uDeviceID: UINT, dwCallback: DWORD_PTR, dwInstance: DWORD_PTR, fdwOpen: DWORD): MMRESULT {
    return Winmm.Load('midiInOpen')(phmi, uDeviceID, dwCallback, dwInstance, fdwOpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiinprepareheader
  public static midiInPrepareHeader(hmi: HMIDIIN, pmh: LPMIDIHDR, cbmh: UINT): MMRESULT {
    return Winmm.Load('midiInPrepareHeader')(hmi, pmh, cbmh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiinreset
  public static midiInReset(hmi: HMIDIIN): MMRESULT {
    return Winmm.Load('midiInReset')(hmi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiinstart
  public static midiInStart(hmi: HMIDIIN): MMRESULT {
    return Winmm.Load('midiInStart')(hmi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiinstop
  public static midiInStop(hmi: HMIDIIN): MMRESULT {
    return Winmm.Load('midiInStop')(hmi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midiinunprepareheader
  public static midiInUnprepareHeader(hmi: HMIDIIN, pmh: LPMIDIHDR, cbmh: UINT): MMRESULT {
    return Winmm.Load('midiInUnprepareHeader')(hmi, pmh, cbmh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutcachedrumpatches
  public static midiOutCacheDrumPatches(hmo: HMIDIOUT, uPatch: UINT, pwkya: LPWORD, fuCache: UINT): MMRESULT {
    return Winmm.Load('midiOutCacheDrumPatches')(hmo, uPatch, pwkya, fuCache);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutcachepatches
  public static midiOutCachePatches(hmo: HMIDIOUT, uBank: UINT, pwpa: LPWORD, fuCache: UINT): MMRESULT {
    return Winmm.Load('midiOutCachePatches')(hmo, uBank, pwpa, fuCache);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutclose
  public static midiOutClose(hmo: HMIDIOUT): MMRESULT {
    return Winmm.Load('midiOutClose')(hmo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutgetdevcapsa
  public static midiOutGetDevCapsA(uDeviceID: UINT_PTR, pmoc: LPMIDIOUTCAPSA, cbmoc: UINT): MMRESULT {
    return Winmm.Load('midiOutGetDevCapsA')(uDeviceID, pmoc, cbmoc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutgetdevcapsw
  public static midiOutGetDevCapsW(uDeviceID: UINT_PTR, pmoc: LPMIDIOUTCAPSW, cbmoc: UINT): MMRESULT {
    return Winmm.Load('midiOutGetDevCapsW')(uDeviceID, pmoc, cbmoc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutgeterrortexta
  public static midiOutGetErrorTextA(mmrError: MMRESULT, pszText: LPSTR, cchText: UINT): MMRESULT {
    return Winmm.Load('midiOutGetErrorTextA')(mmrError, pszText, cchText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutgeterrortextw
  public static midiOutGetErrorTextW(mmrError: MMRESULT, pszText: LPWSTR, cchText: UINT): MMRESULT {
    return Winmm.Load('midiOutGetErrorTextW')(mmrError, pszText, cchText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutgetid
  public static midiOutGetID(hmo: HMIDIOUT, puDeviceID: LPUINT): MMRESULT {
    return Winmm.Load('midiOutGetID')(hmo, puDeviceID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutgetnumdevs
  public static midiOutGetNumDevs(): UINT {
    return Winmm.Load('midiOutGetNumDevs')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutgetvolume
  public static midiOutGetVolume(hmo: HMIDIOUT | 0n, pdwVolume: LPDWORD): MMRESULT {
    return Winmm.Load('midiOutGetVolume')(hmo, pdwVolume);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutlongmsg
  public static midiOutLongMsg(hmo: HMIDIOUT, pmh: LPMIDIHDR, cbmh: UINT): MMRESULT {
    return Winmm.Load('midiOutLongMsg')(hmo, pmh, cbmh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutmessage
  public static midiOutMessage(hmo: HMIDIOUT | 0n, uMsg: UINT, dw1: DWORD_PTR, dw2: DWORD_PTR): MMRESULT {
    return Winmm.Load('midiOutMessage')(hmo, uMsg, dw1, dw2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutopen
  public static midiOutOpen(phmo: LPHMIDIOUT, uDeviceID: UINT, dwCallback: DWORD_PTR, dwInstance: DWORD_PTR, fdwOpen: DWORD): MMRESULT {
    return Winmm.Load('midiOutOpen')(phmo, uDeviceID, dwCallback, dwInstance, fdwOpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutprepareheader
  public static midiOutPrepareHeader(hmo: HMIDIOUT, pmh: LPMIDIHDR, cbmh: UINT): MMRESULT {
    return Winmm.Load('midiOutPrepareHeader')(hmo, pmh, cbmh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutreset
  public static midiOutReset(hmo: HMIDIOUT): MMRESULT {
    return Winmm.Load('midiOutReset')(hmo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutsetvolume
  public static midiOutSetVolume(hmo: HMIDIOUT | 0n, dwVolume: DWORD): MMRESULT {
    return Winmm.Load('midiOutSetVolume')(hmo, dwVolume);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutshortmsg
  public static midiOutShortMsg(hmo: HMIDIOUT, dwMsg: DWORD): MMRESULT {
    return Winmm.Load('midiOutShortMsg')(hmo, dwMsg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midioutunprepareheader
  public static midiOutUnprepareHeader(hmo: HMIDIOUT, pmh: LPMIDIHDR, cbmh: UINT): MMRESULT {
    return Winmm.Load('midiOutUnprepareHeader')(hmo, pmh, cbmh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midistreamclose
  public static midiStreamClose(hms: HMIDISTRM): MMRESULT {
    return Winmm.Load('midiStreamClose')(hms);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midistreamopen
  public static midiStreamOpen(phms: LPHMIDISTRM, puDeviceID: LPUINT, cMidi: DWORD, dwCallback: DWORD_PTR, dwInstance: DWORD_PTR, fdwOpen: DWORD): MMRESULT {
    return Winmm.Load('midiStreamOpen')(phms, puDeviceID, cMidi, dwCallback, dwInstance, fdwOpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midistreamout
  public static midiStreamOut(hms: HMIDISTRM, pmh: LPMIDIHDR, cbmh: UINT): MMRESULT {
    return Winmm.Load('midiStreamOut')(hms, pmh, cbmh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midistreampause
  public static midiStreamPause(hms: HMIDISTRM): MMRESULT {
    return Winmm.Load('midiStreamPause')(hms);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midistreamposition
  public static midiStreamPosition(hms: HMIDISTRM, lpmmt: LPMMTIME, cbmmt: UINT): MMRESULT {
    return Winmm.Load('midiStreamPosition')(hms, lpmmt, cbmmt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midistreamproperty
  public static midiStreamProperty(hms: HMIDISTRM, lppropdata: LPBYTE, dwProperty: DWORD): MMRESULT {
    return Winmm.Load('midiStreamProperty')(hms, lppropdata, dwProperty);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midistreamrestart
  public static midiStreamRestart(hms: HMIDISTRM): MMRESULT {
    return Winmm.Load('midiStreamRestart')(hms);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-midistreamstop
  public static midiStreamStop(hms: HMIDISTRM): MMRESULT {
    return Winmm.Load('midiStreamStop')(hms);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-mixerclose
  public static mixerClose(hmx: HMIXER): MMRESULT {
    return Winmm.Load('mixerClose')(hmx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-mixergetcontroldetailsa
  public static mixerGetControlDetailsA(hmxobj: HMIXEROBJ | 0n, pmxcd: LPMIXERCONTROLDETAILS, fdwDetails: DWORD): MMRESULT {
    return Winmm.Load('mixerGetControlDetailsA')(hmxobj, pmxcd, fdwDetails);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-mixergetcontroldetailsw
  public static mixerGetControlDetailsW(hmxobj: HMIXEROBJ | 0n, pmxcd: LPMIXERCONTROLDETAILS, fdwDetails: DWORD): MMRESULT {
    return Winmm.Load('mixerGetControlDetailsW')(hmxobj, pmxcd, fdwDetails);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-mixergetdevcapsa
  public static mixerGetDevCapsA(uMxId: UINT_PTR, pmxcaps: LPMIXERCAPSA, cbmxcaps: UINT): MMRESULT {
    return Winmm.Load('mixerGetDevCapsA')(uMxId, pmxcaps, cbmxcaps);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-mixergetdevcapsw
  public static mixerGetDevCapsW(uMxId: UINT_PTR, pmxcaps: LPMIXERCAPSW, cbmxcaps: UINT): MMRESULT {
    return Winmm.Load('mixerGetDevCapsW')(uMxId, pmxcaps, cbmxcaps);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-mixergetid
  public static mixerGetID(hmxobj: HMIXEROBJ | 0n, puMxId: LPUINT, fdwId: DWORD): MMRESULT {
    return Winmm.Load('mixerGetID')(hmxobj, puMxId, fdwId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-mixergetlinecontrolsa
  public static mixerGetLineControlsA(hmxobj: HMIXEROBJ | 0n, pmxlc: LPMIXERLINECONTROLSA, fdwControls: DWORD): MMRESULT {
    return Winmm.Load('mixerGetLineControlsA')(hmxobj, pmxlc, fdwControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-mixergetlinecontrolsw
  public static mixerGetLineControlsW(hmxobj: HMIXEROBJ | 0n, pmxlc: LPMIXERLINECONTROLSW, fdwControls: DWORD): MMRESULT {
    return Winmm.Load('mixerGetLineControlsW')(hmxobj, pmxlc, fdwControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-mixergetlineinfoa
  public static mixerGetLineInfoA(hmxobj: HMIXEROBJ | 0n, pmxl: LPMIXERLINEA, fdwInfo: DWORD): MMRESULT {
    return Winmm.Load('mixerGetLineInfoA')(hmxobj, pmxl, fdwInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-mixergetlineinfow
  public static mixerGetLineInfoW(hmxobj: HMIXEROBJ | 0n, pmxl: LPMIXERLINEW, fdwInfo: DWORD): MMRESULT {
    return Winmm.Load('mixerGetLineInfoW')(hmxobj, pmxl, fdwInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-mixergetnumdevs
  public static mixerGetNumDevs(): UINT {
    return Winmm.Load('mixerGetNumDevs')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-mixermessage
  public static mixerMessage(hmx: HMIXER | 0n, uMsg: UINT, dwParam1: DWORD_PTR, dwParam2: DWORD_PTR): DWORD {
    return Winmm.Load('mixerMessage')(hmx, uMsg, dwParam1, dwParam2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-mixeropen
  public static mixerOpen(phmx: LPHMIXER | NULL, uMxId: UINT, dwCallback: DWORD_PTR, dwInstance: DWORD_PTR, fdwOpen: DWORD): MMRESULT {
    return Winmm.Load('mixerOpen')(phmx, uMxId, dwCallback, dwInstance, fdwOpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-mixersetcontroldetails
  public static mixerSetControlDetails(hmxobj: HMIXEROBJ | 0n, pmxcd: LPMIXERCONTROLDETAILS, fdwDetails: DWORD): MMRESULT {
    return Winmm.Load('mixerSetControlDetails')(hmxobj, pmxcd, fdwDetails);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mmDrvInstall(hDriver: HDRVR, wszDrvEntry: LPCWSTR, drvMessage: DRIVERMSGPROC, wFlags: UINT): UINT {
    return Winmm.Load('mmDrvInstall')(hDriver, wszDrvEntry, drvMessage, wFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mmGetCurrentTask(): DWORD {
    return Winmm.Load('mmGetCurrentTask')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mmTaskBlock(h: DWORD): void {
    return Winmm.Load('mmTaskBlock')(h);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mmTaskCreate(lpfn: LPTASKCALLBACK, lph: LPHANDLE, dwInst: DWORD_PTR): UINT {
    return Winmm.Load('mmTaskCreate')(lpfn, lph, dwInst);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mmTaskSignal(h: DWORD): BOOL {
    return Winmm.Load('mmTaskSignal')(h);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/_multimedia/
  public static mmTaskYield(): void {
    return Winmm.Load('mmTaskYield')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmioadvance
  public static mmioAdvance(hmmio: HMMIO, pmmioinfo: LPMMIOINFO | NULL, fuAdvance: UINT): MMRESULT {
    return Winmm.Load('mmioAdvance')(hmmio, pmmioinfo, fuAdvance);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmioascend
  public static mmioAscend(hmmio: HMMIO, pmmcki: LPMMCKINFO, fuAscend: UINT): MMRESULT {
    return Winmm.Load('mmioAscend')(hmmio, pmmcki, fuAscend);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmioclose
  public static mmioClose(hmmio: HMMIO, fuClose: UINT): MMRESULT {
    return Winmm.Load('mmioClose')(hmmio, fuClose);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmiocreatechunk
  public static mmioCreateChunk(hmmio: HMMIO, pmmcki: LPMMCKINFO, fuCreate: UINT): MMRESULT {
    return Winmm.Load('mmioCreateChunk')(hmmio, pmmcki, fuCreate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmiodescend
  public static mmioDescend(hmmio: HMMIO, pmmcki: LPMMCKINFO, pmmckiParent: LPCMMCKINFO | NULL, fuDescend: UINT): MMRESULT {
    return Winmm.Load('mmioDescend')(hmmio, pmmcki, pmmckiParent, fuDescend);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmioflush
  public static mmioFlush(hmmio: HMMIO, fuFlush: UINT): MMRESULT {
    return Winmm.Load('mmioFlush')(hmmio, fuFlush);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmiogetinfo
  public static mmioGetInfo(hmmio: HMMIO, pmmioinfo: LPMMIOINFO, fuInfo: UINT): MMRESULT {
    return Winmm.Load('mmioGetInfo')(hmmio, pmmioinfo, fuInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmioinstallioproca
  public static mmioInstallIOProcA(fccIOProc: FOURCC, pIOProc: LPMMIOPROC | NULL, dwFlags: DWORD): LPMMIOPROC {
    return Winmm.Load('mmioInstallIOProcA')(fccIOProc, pIOProc, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmioinstallioprocw
  public static mmioInstallIOProcW(fccIOProc: FOURCC, pIOProc: LPMMIOPROC | NULL, dwFlags: DWORD): LPMMIOPROC {
    return Winmm.Load('mmioInstallIOProcW')(fccIOProc, pIOProc, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmioopena
  public static mmioOpenA(pszFileName: LPSTR | NULL, pmmioinfo: LPMMIOINFO | NULL, fdwOpen: DWORD): HMMIO {
    return Winmm.Load('mmioOpenA')(pszFileName, pmmioinfo, fdwOpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmioopenw
  public static mmioOpenW(pszFileName: LPWSTR | NULL, pmmioinfo: LPMMIOINFO | NULL, fdwOpen: DWORD): HMMIO {
    return Winmm.Load('mmioOpenW')(pszFileName, pmmioinfo, fdwOpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmioread
  public static mmioRead(hmmio: HMMIO, pch: HPSTR, cch: LONG): LONG {
    return Winmm.Load('mmioRead')(hmmio, pch, cch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmiorenamea
  public static mmioRenameA(pszFileName: LPCSTR, pszNewFileName: LPCSTR, pmmioinfo: LPCMMIOINFO | NULL, fdwRename: DWORD): MMRESULT {
    return Winmm.Load('mmioRenameA')(pszFileName, pszNewFileName, pmmioinfo, fdwRename);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmiorenamew
  public static mmioRenameW(pszFileName: LPCWSTR, pszNewFileName: LPCWSTR, pmmioinfo: LPCMMIOINFO | NULL, fdwRename: DWORD): MMRESULT {
    return Winmm.Load('mmioRenameW')(pszFileName, pszNewFileName, pmmioinfo, fdwRename);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmioseek
  public static mmioSeek(hmmio: HMMIO, lOffset: LONG, iOrigin: INT): LONG {
    return Winmm.Load('mmioSeek')(hmmio, lOffset, iOrigin);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmiosendmessage
  public static mmioSendMessage(hmmio: HMMIO, uMsg: UINT, lParam1: LPARAM, lParam2: LPARAM): LRESULT {
    return Winmm.Load('mmioSendMessage')(hmmio, uMsg, lParam1, lParam2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmiosetbuffer
  public static mmioSetBuffer(hmmio: HMMIO, pchBuffer: LPSTR | NULL, cchBuffer: LONG, fuBuffer: UINT): MMRESULT {
    return Winmm.Load('mmioSetBuffer')(hmmio, pchBuffer, cchBuffer, fuBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmiosetinfo
  public static mmioSetInfo(hmmio: HMMIO, pmmioinfo: LPCMMIOINFO, fuInfo: UINT): MMRESULT {
    return Winmm.Load('mmioSetInfo')(hmmio, pmmioinfo, fuInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmiostringtofourcca
  public static mmioStringToFOURCCA(sz: LPCSTR, uFlags: UINT): FOURCC {
    return Winmm.Load('mmioStringToFOURCCA')(sz, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmiostringtofourccw
  public static mmioStringToFOURCCW(sz: LPCWSTR, uFlags: UINT): FOURCC {
    return Winmm.Load('mmioStringToFOURCCW')(sz, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmiscapi/nf-mmiscapi-mmiowrite
  public static mmioWrite(hmmio: HMMIO, pch: HPSTR, cch: LONG): LONG {
    return Winmm.Load('mmioWrite')(hmmio, pch, cch);
  }

  // https://learn.microsoft.com/en-us/previous-versions/dd757342(v=vs.85)
  public static mmsystemGetVersion(): UINT {
    return Winmm.Load('mmsystemGetVersion')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/multimedia/the-playsound-function
  public static sndPlaySoundA(pszSound: LPCSTR | NULL, fuSound: UINT): BOOL {
    return Winmm.Load('sndPlaySoundA')(pszSound, fuSound);
  }

  // https://learn.microsoft.com/en-us/windows/win32/multimedia/the-playsound-function
  public static sndPlaySoundW(pszSound: LPCWSTR | NULL, fuSound: UINT): BOOL {
    return Winmm.Load('sndPlaySoundW')(pszSound, fuSound);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timeapi/nf-timeapi-timebeginperiod
  public static timeBeginPeriod(uPeriod: UINT): MMRESULT {
    return Winmm.Load('timeBeginPeriod')(uPeriod);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timeapi/nf-timeapi-timeendperiod
  public static timeEndPeriod(uPeriod: UINT): MMRESULT {
    return Winmm.Load('timeEndPeriod')(uPeriod);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timeapi/nf-timeapi-timegetdevcaps
  public static timeGetDevCaps(ptc: LPTIMECAPS, cbtc: UINT): MMRESULT {
    return Winmm.Load('timeGetDevCaps')(ptc, cbtc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timeapi/nf-timeapi-timegetsystemtime
  public static timeGetSystemTime(pmmt: LPMMTIME, cbmmt: UINT): MMRESULT {
    return Winmm.Load('timeGetSystemTime')(pmmt, cbmmt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timeapi/nf-timeapi-timegettime
  public static timeGetTime(): DWORD {
    return Winmm.Load('timeGetTime')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/multimedia/timer-operations
  public static timeKillEvent(uTimerID: UINT): MMRESULT {
    return Winmm.Load('timeKillEvent')(uTimerID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/multimedia/timer-operations
  public static timeSetEvent(uDelay: UINT, uResolution: UINT, fptc: LPTIMECALLBACK, dwUser: DWORD_PTR, fuEvent: UINT): MMRESULT {
    return Winmm.Load('timeSetEvent')(uDelay, uResolution, fptc, dwUser, fuEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveinaddbuffer
  public static waveInAddBuffer(hwi: HWAVEIN, pwh: LPWAVEHDR, cbwh: UINT): MMRESULT {
    return Winmm.Load('waveInAddBuffer')(hwi, pwh, cbwh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveinclose
  public static waveInClose(hwi: HWAVEIN): MMRESULT {
    return Winmm.Load('waveInClose')(hwi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveingetdevcapsa
  public static waveInGetDevCapsA(uDeviceID: UINT_PTR, pwic: LPWAVEINCAPSA, cbwic: UINT): MMRESULT {
    return Winmm.Load('waveInGetDevCapsA')(uDeviceID, pwic, cbwic);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveingetdevcapsw
  public static waveInGetDevCapsW(uDeviceID: UINT_PTR, pwic: LPWAVEINCAPSW, cbwic: UINT): MMRESULT {
    return Winmm.Load('waveInGetDevCapsW')(uDeviceID, pwic, cbwic);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveingeterrortexta
  public static waveInGetErrorTextA(mmrError: MMRESULT, pszText: LPSTR, cchText: UINT): MMRESULT {
    return Winmm.Load('waveInGetErrorTextA')(mmrError, pszText, cchText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveingeterrortextw
  public static waveInGetErrorTextW(mmrError: MMRESULT, pszText: LPWSTR, cchText: UINT): MMRESULT {
    return Winmm.Load('waveInGetErrorTextW')(mmrError, pszText, cchText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveingetid
  public static waveInGetID(hwi: HWAVEIN, puDeviceID: LPUINT): MMRESULT {
    return Winmm.Load('waveInGetID')(hwi, puDeviceID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveingetnumdevs
  public static waveInGetNumDevs(): UINT {
    return Winmm.Load('waveInGetNumDevs')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveingetposition
  public static waveInGetPosition(hwi: HWAVEIN, pmmt: LPMMTIME, cbmmt: UINT): MMRESULT {
    return Winmm.Load('waveInGetPosition')(hwi, pmmt, cbmmt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveinmessage
  public static waveInMessage(hwi: HWAVEIN | 0n, uMsg: UINT, dw1: DWORD_PTR, dw2: DWORD_PTR): MMRESULT {
    return Winmm.Load('waveInMessage')(hwi, uMsg, dw1, dw2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveinopen
  public static waveInOpen(phwi: LPHWAVEIN | NULL, uDeviceID: UINT, pwfx: LPCWAVEFORMATEX, dwCallback: DWORD_PTR, dwInstance: DWORD_PTR, fdwOpen: DWORD): MMRESULT {
    return Winmm.Load('waveInOpen')(phwi, uDeviceID, pwfx, dwCallback, dwInstance, fdwOpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveinprepareheader
  public static waveInPrepareHeader(hwi: HWAVEIN, pwh: LPWAVEHDR, cbwh: UINT): MMRESULT {
    return Winmm.Load('waveInPrepareHeader')(hwi, pwh, cbwh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveinreset
  public static waveInReset(hwi: HWAVEIN): MMRESULT {
    return Winmm.Load('waveInReset')(hwi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveinstart
  public static waveInStart(hwi: HWAVEIN): MMRESULT {
    return Winmm.Load('waveInStart')(hwi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveinstop
  public static waveInStop(hwi: HWAVEIN): MMRESULT {
    return Winmm.Load('waveInStop')(hwi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveinunprepareheader
  public static waveInUnprepareHeader(hwi: HWAVEIN, pwh: LPWAVEHDR, cbwh: UINT): MMRESULT {
    return Winmm.Load('waveInUnprepareHeader')(hwi, pwh, cbwh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutbreakloop
  public static waveOutBreakLoop(hwo: HWAVEOUT): MMRESULT {
    return Winmm.Load('waveOutBreakLoop')(hwo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutclose
  public static waveOutClose(hwo: HWAVEOUT): MMRESULT {
    return Winmm.Load('waveOutClose')(hwo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutgetdevcapsa
  public static waveOutGetDevCapsA(uDeviceID: UINT_PTR, pwoc: LPWAVEOUTCAPSA, cbwoc: UINT): MMRESULT {
    return Winmm.Load('waveOutGetDevCapsA')(uDeviceID, pwoc, cbwoc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutgetdevcapsw
  public static waveOutGetDevCapsW(uDeviceID: UINT_PTR, pwoc: LPWAVEOUTCAPSW, cbwoc: UINT): MMRESULT {
    return Winmm.Load('waveOutGetDevCapsW')(uDeviceID, pwoc, cbwoc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutgeterrortexta
  public static waveOutGetErrorTextA(mmrError: MMRESULT, pszText: LPSTR, cchText: UINT): MMRESULT {
    return Winmm.Load('waveOutGetErrorTextA')(mmrError, pszText, cchText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutgeterrortextw
  public static waveOutGetErrorTextW(mmrError: MMRESULT, pszText: LPWSTR, cchText: UINT): MMRESULT {
    return Winmm.Load('waveOutGetErrorTextW')(mmrError, pszText, cchText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutgetid
  public static waveOutGetID(hwo: HWAVEOUT, puDeviceID: LPUINT): MMRESULT {
    return Winmm.Load('waveOutGetID')(hwo, puDeviceID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutgetnumdevs
  public static waveOutGetNumDevs(): UINT {
    return Winmm.Load('waveOutGetNumDevs')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutgetpitch
  public static waveOutGetPitch(hwo: HWAVEOUT, pdwPitch: LPDWORD): MMRESULT {
    return Winmm.Load('waveOutGetPitch')(hwo, pdwPitch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutgetplaybackrate
  public static waveOutGetPlaybackRate(hwo: HWAVEOUT, pdwRate: LPDWORD): MMRESULT {
    return Winmm.Load('waveOutGetPlaybackRate')(hwo, pdwRate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutgetposition
  public static waveOutGetPosition(hwo: HWAVEOUT, pmmt: LPMMTIME, cbmmt: UINT): MMRESULT {
    return Winmm.Load('waveOutGetPosition')(hwo, pmmt, cbmmt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutgetvolume
  public static waveOutGetVolume(hwo: HWAVEOUT | 0n, pdwVolume: LPDWORD): MMRESULT {
    return Winmm.Load('waveOutGetVolume')(hwo, pdwVolume);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutmessage
  public static waveOutMessage(hwo: HWAVEOUT | 0n, uMsg: UINT, dw1: DWORD_PTR, dw2: DWORD_PTR): MMRESULT {
    return Winmm.Load('waveOutMessage')(hwo, uMsg, dw1, dw2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutopen
  public static waveOutOpen(phwo: LPHWAVEOUT | NULL, uDeviceID: UINT, pwfx: LPCWAVEFORMATEX, dwCallback: DWORD_PTR, dwInstance: DWORD_PTR, fdwOpen: DWORD): MMRESULT {
    return Winmm.Load('waveOutOpen')(phwo, uDeviceID, pwfx, dwCallback, dwInstance, fdwOpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutpause
  public static waveOutPause(hwo: HWAVEOUT): MMRESULT {
    return Winmm.Load('waveOutPause')(hwo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutprepareheader
  public static waveOutPrepareHeader(hwo: HWAVEOUT, pwh: LPWAVEHDR, cbwh: UINT): MMRESULT {
    return Winmm.Load('waveOutPrepareHeader')(hwo, pwh, cbwh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutreset
  public static waveOutReset(hwo: HWAVEOUT): MMRESULT {
    return Winmm.Load('waveOutReset')(hwo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutrestart
  public static waveOutRestart(hwo: HWAVEOUT): MMRESULT {
    return Winmm.Load('waveOutRestart')(hwo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutsetpitch
  public static waveOutSetPitch(hwo: HWAVEOUT, dwPitch: DWORD): MMRESULT {
    return Winmm.Load('waveOutSetPitch')(hwo, dwPitch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutsetplaybackrate
  public static waveOutSetPlaybackRate(hwo: HWAVEOUT, dwRate: DWORD): MMRESULT {
    return Winmm.Load('waveOutSetPlaybackRate')(hwo, dwRate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutsetvolume
  public static waveOutSetVolume(hwo: HWAVEOUT | 0n, dwVolume: DWORD): MMRESULT {
    return Winmm.Load('waveOutSetVolume')(hwo, dwVolume);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutunprepareheader
  public static waveOutUnprepareHeader(hwo: HWAVEOUT, pwh: LPWAVEHDR, cbwh: UINT): MMRESULT {
    return Winmm.Load('waveOutUnprepareHeader')(hwo, pwh, cbwh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/nf-mmeapi-waveoutwrite
  public static waveOutWrite(hwo: HWAVEOUT, pwh: LPWAVEHDR, cbwh: UINT): MMRESULT {
    return Winmm.Load('waveOutWrite')(hwo, pwh, cbwh);
  }
}

export default Winmm;
