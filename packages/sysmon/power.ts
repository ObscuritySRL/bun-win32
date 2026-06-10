import { type Pointer, toArrayBuffer } from 'bun:ffi';
import Kernel32 from '@bun-win32/kernel32';
import PowrProf, { POWER_INFORMATION_LEVEL } from '@bun-win32/powrprof';
import { formatGuid } from './structs';
import { preloadPending } from './preload';

preloadPending(Kernel32, ['GetSystemPowerStatus', 'LocalFree']);
preloadPending(PowrProf, ['CallNtPowerInformation', 'PowerGetActiveScheme', 'PowerReadFriendlyName']);
const { GetSystemPowerStatus, LocalFree } = Kernel32;
const { CallNtPowerInformation, PowerGetActiveScheme, PowerReadFriendlyName } = PowrProf;

export interface BatteryState {
  acOnline: boolean;
  batteryPresent: boolean;
  charging: boolean;
  discharging: boolean;
  /** Seconds at the current drain rate; -1 when unknown/not discharging. */
  estimatedTimeSeconds: number;
  /** mWh (or relative firmware units). */
  maxCapacity: number;
  /** Signed mW: negative while discharging. */
  rate: number;
  remainingCapacity: number;
}

export interface PowerScheme {
  guid: string;
  /** Friendly name, e.g. `Balanced`. */
  name: string;
}

export interface PowerStatus {
  /** 1 = on AC, 0 = on battery, 255 = unknown. */
  acLine: number;
  /** SYSTEM_POWER_STATUS BatteryFlag bits (128 = no system battery, 255 = unknown). */
  batteryFlag: number;
  /** 0–100, or null when the OS reports 255 (unknown / no battery). */
  batteryPercent: number | null;
  /** Battery seconds remaining; -1 unknown (always -1 on AC). */
  secondsRemaining: number;
}

/** Battery electrochemistry from the kernel (CallNtPowerInformation SystemBatteryState, 64 B: AcOnLine u8@0, BatteryPresent u8@1, Charging u8@2, Discharging u8@3, MaxCapacity u32@8, RemainingCapacity u32@12, Rate i32@16, EstimatedTime u32@24). Desktops report `batteryPresent: false` — no throw. */
export function batteryState(): BatteryState {
  const stateBuffer = Buffer.alloc(64);
  const status = CallNtPowerInformation(POWER_INFORMATION_LEVEL.SystemBatteryState, null, 0, stateBuffer.ptr, 64);
  if (status !== 0) throw new Error(`CallNtPowerInformation(SystemBatteryState) failed: NTSTATUS 0x${(status >>> 0).toString(16)}`);
  const estimatedTime = stateBuffer.readInt32LE(24);
  return {
    acOnline: stateBuffer.readUInt8(0) !== 0,
    batteryPresent: stateBuffer.readUInt8(1) !== 0,
    charging: stateBuffer.readUInt8(2) !== 0,
    discharging: stateBuffer.readUInt8(3) !== 0,
    estimatedTimeSeconds: estimatedTime,
    maxCapacity: stateBuffer.readUInt32LE(8),
    rate: stateBuffer.readInt32LE(16),
    remainingCapacity: stateBuffer.readUInt32LE(12),
  };
}

/** The active power plan (PowerGetActiveScheme + PowerReadFriendlyName two-call; the scheme GUID allocation is LocalFree'd). */
export function powerScheme(): PowerScheme {
  const guidPointerBuffer = Buffer.alloc(8);
  const schemeStatus = PowerGetActiveScheme(0n, guidPointerBuffer.ptr);
  if (schemeStatus !== 0) throw new Error(`PowerGetActiveScheme failed: ${schemeStatus}`);
  const guidAddress = guidPointerBuffer.readBigUInt64LE(0);
  const guidPointer = Number(guidAddress) as Pointer;
  const guidBuffer = Buffer.from(toArrayBuffer(guidPointer, 0, 16).slice(0)); // slice(0) COPIES — Buffer.from(ArrayBuffer) alone is a view that would dangle after LocalFree
  void LocalFree(guidAddress);
  const guid = formatGuid(guidBuffer, 0);
  const sizeBuffer = Buffer.alloc(4);
  sizeBuffer.writeUInt32LE(0, 0);
  void PowerReadFriendlyName(0n, guidBuffer.ptr, null, null, null, sizeBuffer.ptr);
  const nameBytes = sizeBuffer.readUInt32LE(0);
  if (nameBytes === 0) return { guid, name: '' };
  const nameBuffer = Buffer.alloc(nameBytes);
  if (PowerReadFriendlyName(0n, guidBuffer.ptr, null, null, nameBuffer.ptr, sizeBuffer.ptr) !== 0) return { guid, name: '' };
  return {
    guid,
    name: nameBuffer.toString('utf16le').replace(/\0.*$/, '').trim(),
  };
}

/** AC/battery snapshot (GetSystemPowerStatus, SYSTEM_POWER_STATUS 12 B: ACLineStatus u8@0, BatteryFlag u8@1, BatteryLifePercent u8@2, BatteryLifeTime i32@4). */
export function powerStatus(): PowerStatus {
  const statusBuffer = Buffer.alloc(12);
  if (GetSystemPowerStatus(statusBuffer.ptr) === 0) throw new Error('GetSystemPowerStatus failed');
  const percent = statusBuffer.readUInt8(2);
  return {
    acLine: statusBuffer.readUInt8(0),
    batteryFlag: statusBuffer.readUInt8(1),
    batteryPercent: percent === 255 ? null : percent,
    secondsRemaining: statusBuffer.readInt32LE(4),
  };
}
