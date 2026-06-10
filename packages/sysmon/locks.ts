import Rstrtmgr from '@bun-win32/rstrtmgr';
import { decodeNulTerminatedUnicodeString } from './structs';
import { preloadPending } from './preload';

preloadPending(Rstrtmgr, ['RmEndSession', 'RmGetList', 'RmRegisterResources', 'RmStartSession']);
const { RmEndSession, RmGetList, RmRegisterResources, RmStartSession } = Rstrtmgr;

const ERROR_MORE_DATA = 234;
const ERROR_SUCCESS = 0;
const RM_PROCESS_INFO_SIZE = 668;
const SESSION_KEY_CHARS = 33; // CCH_RM_SESSION_KEY + 1

export interface FileLockHolder {
  /** Friendly application name from the Restart Manager, e.g. `Visual Studio Code`. */
  applicationName: string;
  /** RM_APP_TYPE: 0 unknown, 1 main window, 2 other window, 3 service, 4 explorer, 5 console, 1000 critical. */
  applicationType: number;
  pid: number;
  serviceShortName: string;
}

/**
 * Which processes hold the given files open — the Restart Manager X-ray behind Windows'
 * "this file is in use by …" dialogs (RmStartSession → RmRegisterResources → RmGetList →
 * RmEndSession; RM_PROCESS_INFO is 668 B: pid u32@0, AppName WCHAR[256]@12,
 * ServiceShortName WCHAR[64]@524, ApplicationType u32@652). No npm package offers this.
 */
export function whoLocks(paths: string[]): FileLockHolder[] {
  if (paths.length === 0) return [];
  const sessionHandleBuffer = Buffer.alloc(4);
  const sessionKeyBuffer = Buffer.alloc(SESSION_KEY_CHARS * 2);
  let status = RmStartSession(sessionHandleBuffer.ptr, 0, sessionKeyBuffer.ptr);
  if (status !== ERROR_SUCCESS) throw new Error(`RmStartSession failed: ${status}`);
  const sessionHandle = sessionHandleBuffer.readUInt32LE(0);
  try {
    // RmRegisterResources wants an array of wide-string POINTERS; the string buffers must stay alive past the call.
    const pathBuffers = paths.map((path) => Buffer.from(`${path}\0`, 'utf16le'));
    const pointerArray = Buffer.alloc(paths.length * 8);
    for (let i = 0; i < pathBuffers.length; i += 1) pointerArray.writeBigUInt64LE(BigInt(pathBuffers[i]!.ptr), i * 8);
    status = RmRegisterResources(sessionHandle, paths.length, pointerArray.ptr, 0, null, 0, null);
    if (status !== ERROR_SUCCESS) throw new Error(`RmRegisterResources failed: ${status}`);
    const neededBuffer = Buffer.alloc(4);
    const countBuffer = Buffer.alloc(4);
    const rebootBuffer = Buffer.alloc(4);
    countBuffer.writeUInt32LE(0, 0);
    status = RmGetList(sessionHandle, neededBuffer.ptr, countBuffer.ptr, null, rebootBuffer.ptr);
    if (status !== ERROR_MORE_DATA && status !== ERROR_SUCCESS) throw new Error(`RmGetList probe failed: ${status}`);
    const needed = neededBuffer.readUInt32LE(0);
    if (needed === 0) return [];
    const table = Buffer.alloc(needed * RM_PROCESS_INFO_SIZE);
    countBuffer.writeUInt32LE(needed, 0);
    status = RmGetList(sessionHandle, neededBuffer.ptr, countBuffer.ptr, table.ptr, rebootBuffer.ptr);
    if (status !== ERROR_SUCCESS) throw new Error(`RmGetList failed: ${status}`);
    const count = countBuffer.readUInt32LE(0);
    const holders: FileLockHolder[] = new Array(count);
    for (let i = 0; i < count; i += 1) {
      const offset = i * RM_PROCESS_INFO_SIZE;
      holders[i] = {
        applicationName: decodeNulTerminatedUnicodeString(table, offset + 12, 256),
        applicationType: table.readUInt32LE(offset + 652),
        pid: table.readUInt32LE(offset),
        serviceShortName: decodeNulTerminatedUnicodeString(table, offset + 524, 64),
      };
    }
    return holders;
  } finally {
    void RmEndSession(sessionHandle);
  }
}
