import type { Pointer } from 'bun:ffi';
import Advapi32 from '@bun-win32/advapi32';
import Kernel32 from '@bun-win32/kernel32';
import Ntdll, { STATUS_SUCCESS, SystemInformationClass } from '@bun-win32/ntdll';
import { filetimeToDate } from './structs';
import { preloadPending } from './preload';

preloadPending(Advapi32, ['AllocateAndInitializeSid', 'CheckTokenMembership', 'FreeSid', 'GetUserNameW']);
preloadPending(Kernel32, ['GetActiveProcessorCount', 'GetComputerNameExW', 'GetNativeSystemInfo', 'GetTickCount64']);
preloadPending(Ntdll, ['NtQuerySystemInformation', 'RtlGetVersion']);
const { AllocateAndInitializeSid, CheckTokenMembership, FreeSid, GetUserNameW } = Advapi32;
const { GetActiveProcessorCount, GetComputerNameExW, GetNativeSystemInfo, GetTickCount64 } = Kernel32;
const { NtQuerySystemInformation, RtlGetVersion } = Ntdll;

const ALL_PROCESSOR_GROUPS = 0xffff;
const DOMAIN_ALIAS_RID_ADMINS = 0x0000_0220;
const SECURITY_BUILTIN_DOMAIN_RID = 0x0000_0020;

export interface CpuLayout {
  activeProcessorMask: bigint;
  allocationGranularity: number;
  /** Logical processor count across ALL processor groups (GetActiveProcessorCount) — SYSTEM_INFO's dwNumberOfProcessors only covers the current group. */
  logicalProcessorCount: number;
  pageSizeBytes: number;
  processorArchitecture: number;
  processorLevel: number;
  processorRevision: number;
}

export interface OsInfo {
  build: number;
  major: number;
  minor: number;
  platformId: number;
  servicePack: string;
}

/** Boot timestamp from the kernel (NtQuerySystemInformation class 3, SYSTEM_TIMEOFDAY_INFORMATION 48 B, BootTime FILETIME@0). */
export function bootTime(): Date {
  const timeOfDayBuffer = Buffer.alloc(48);
  const status = NtQuerySystemInformation(SystemInformationClass.SystemTimeOfDayInformation, timeOfDayBuffer.ptr, 48, null);
  if (status !== STATUS_SUCCESS) throw new Error(`NtQuerySystemInformation(SystemTimeOfDayInformation) failed: NTSTATUS 0x${(status >>> 0).toString(16)}`);
  return filetimeToDate(timeOfDayBuffer.readUInt32LE(0), timeOfDayBuffer.readUInt32LE(4));
}

/** NetBIOS computer name (GetComputerNameExW; nSize is in/out in WCHARs). */
export function computerName(): string {
  const nameBuffer = Buffer.alloc(512);
  const sizeBuffer = Buffer.alloc(4);
  sizeBuffer.writeUInt32LE(256, 0);
  if (GetComputerNameExW(0, nameBuffer.ptr, sizeBuffer.ptr) === 0) return '';
  return nameBuffer.subarray(0, sizeBuffer.readUInt32LE(0) * 2).toString('utf16le');
}

/** CPU topology + addressing basics (GetNativeSystemInfo; SYSTEM_INFO 48 B: arch u16@0, pageSize u32@4, mask u64@24, count u32@32, granularity u32@40, level u16@44, revision u16@46). */
export function cpuLayout(): CpuLayout {
  const systemInfoBuffer = Buffer.alloc(48);
  GetNativeSystemInfo(systemInfoBuffer.ptr);
  const currentGroupCount = systemInfoBuffer.readUInt32LE(32);
  const allGroupsCount = GetActiveProcessorCount(ALL_PROCESSOR_GROUPS);
  return {
    activeProcessorMask: systemInfoBuffer.readBigUInt64LE(24),
    allocationGranularity: systemInfoBuffer.readUInt32LE(40),
    logicalProcessorCount: allGroupsCount > 0 ? allGroupsCount : currentGroupCount,
    pageSizeBytes: systemInfoBuffer.readUInt32LE(4),
    processorArchitecture: systemInfoBuffer.readUInt16LE(0),
    processorLevel: systemInfoBuffer.readUInt16LE(44),
    processorRevision: systemInfoBuffer.readUInt16LE(46),
  };
}

/** True when the current process token is a member of BUILTIN\Administrators, i.e. running elevated (CheckTokenMembership). */
export function isElevated(): boolean {
  const ntAuthority = Buffer.from([0, 0, 0, 0, 0, 5]); // SECURITY_NT_AUTHORITY
  const sidPointerBuffer = Buffer.alloc(8);
  if (AllocateAndInitializeSid(ntAuthority.ptr, 2, SECURITY_BUILTIN_DOMAIN_RID, DOMAIN_ALIAS_RID_ADMINS, 0, 0, 0, 0, 0, 0, sidPointerBuffer.ptr) === 0) return false;
  const administratorsSid = Number(sidPointerBuffer.readBigUInt64LE(0)) as Pointer;
  const isMemberBuffer = Buffer.alloc(4);
  const succeeded = CheckTokenMembership(0n, administratorsSid, isMemberBuffer.ptr);
  const isMember = succeeded !== 0 && isMemberBuffer.readUInt32LE(0) !== 0;
  void FreeSid(administratorsSid);
  return isMember;
}

/** True OS version from the kernel, bypassing compatibility shims (RtlGetVersion; dwOSVersionInfoSize MUST be preset to 0x11C). */
export function osInfo(): OsInfo {
  const versionBuffer = Buffer.alloc(0x11c);
  versionBuffer.writeUInt32LE(0x11c, 0);
  const status = RtlGetVersion(versionBuffer.ptr);
  if (status !== STATUS_SUCCESS) throw new Error(`RtlGetVersion failed: NTSTATUS 0x${(status >>> 0).toString(16)}`);
  return {
    build: versionBuffer.readUInt32LE(12),
    major: versionBuffer.readUInt32LE(4),
    minor: versionBuffer.readUInt32LE(8),
    platformId: versionBuffer.readUInt32LE(16),
    servicePack: versionBuffer
      .subarray(20, 20 + 256)
      .toString('utf16le')
      .replace(/\0.*$/, ''),
  };
}

/** Milliseconds since boot (GetTickCount64 — includes time spent asleep/hibernated). */
export function uptimeMs(): number {
  return Number(GetTickCount64());
}

/** Name of the user running this process (GetUserNameW; pcbBuffer is in/out in WCHARs INCLUDING the terminating NUL). */
export function userName(): string {
  const nameBuffer = Buffer.alloc(512);
  const sizeBuffer = Buffer.alloc(4);
  sizeBuffer.writeUInt32LE(256, 0);
  if (GetUserNameW(nameBuffer.ptr, sizeBuffer.ptr) === 0) return '';
  return nameBuffer.subarray(0, (sizeBuffer.readUInt32LE(0) - 1) * 2).toString('utf16le');
}
