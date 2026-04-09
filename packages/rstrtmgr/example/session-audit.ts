/**
 * Session Audit
 *
 * A detailed Restart Manager inspection that starts a primary session, joins it
 * with a secondary handle, registers live file resources, applies a temporary
 * process filter, and prints a formatted report of affected applications,
 * reboot reasons, and filter metadata.
 *
 * APIs demonstrated:
 *   - RmStartSession              (create the primary Restart Manager session)
 *   - RmJoinSession               (create a secondary session handle from the session key)
 *   - RmRegisterResources         (register tracked files from both session handles)
 *   - RmGetList                   (enumerate affected applications and reboot reasons)
 *   - RmAddFilter                 (add a temporary process filter)
 *   - RmGetFilterList             (retrieve filter buffer metadata)
 *   - RmRemoveFilter              (remove the temporary process filter)
 *   - RmEndSession                (close both session handles)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - OpenProcess                 (open a query handle for a process)
 *   - GetProcessTimes             (read creation time for RM_UNIQUE_PROCESS)
 *   - CloseHandle                 (release the query handle)
 *
 * Run: bun run example/session-audit.ts
 */
import { closeSync, mkdirSync, openSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Kernel32, { ProcessAccessRights } from '@bun-win32/kernel32';

import Rstrtmgr, { CCH_RM_MAX_APP_NAME, CCH_RM_MAX_SVC_NAME, CCH_RM_SESSION_KEY, RM_APP_STATUS, RM_APP_TYPE, RM_FILTER_ACTION, RM_FILTER_TRIGGER, RM_REBOOT_REASON } from '../index';

const ERROR_MORE_DATA = 234;
const ERROR_SUCCESS = 0;
const FILETIME_TO_UNIX_EPOCH_OFFSET = 116_444_736_000_000_000n;
const FILTER_RECORD_SIZE = 32;
const PROCESS_RECORD_SIZE = 668;
const PROCESS_START_TIME_OFFSET = 4;
const PROCESS_INFO_APP_NAME_OFFSET = 12;
const PROCESS_INFO_APP_STATUS_OFFSET = 656;
const PROCESS_INFO_APPLICATION_TYPE_OFFSET = 652;
const PROCESS_INFO_PROCESS_IDENTIFIER_OFFSET = 0;
const PROCESS_INFO_RESTARTABLE_OFFSET = 664;
const PROCESS_INFO_SERVICE_NAME_OFFSET = 524;
const PROCESS_INFO_SESSION_IDENTIFIER_OFFSET = 660;
const PROCESS_QUERY_RIGHTS = ProcessAccessRights.PROCESS_QUERY_LIMITED_INFORMATION;
const RESET = '\x1b[0m';
const TITLE = '\x1b[96m';
const MUTED = '\x1b[2m';
const SUCCESS = '\x1b[92m';
const WARNING = '\x1b[93m';

interface AffectedApplication {
  appName: string;
  appStatus: number;
  applicationType: number;
  processIdentifier: number;
  processStartTime: bigint;
  restartable: boolean;
  serviceShortName: string;
  terminalSessionIdentifier: number;
}

interface FilterRecord {
  action: number;
  nextOffset: number;
  processIdentifier: number | null;
  processStartTime: bigint | null;
  trigger: number;
}

Kernel32.Preload(['CloseHandle', 'GetProcessTimes', 'OpenProcess']);
Rstrtmgr.Preload(['RmAddFilter', 'RmEndSession', 'RmGetFilterList', 'RmGetList', 'RmJoinSession', 'RmRegisterResources', 'RmRemoveFilter', 'RmStartSession']);

function assertStatus(statusCode: number, operationName: string, allowedStatusCodes: number[] = [ERROR_SUCCESS]): void {
  if (!allowedStatusCodes.includes(statusCode)) {
    throw new Error(`${operationName} failed: ${statusCode}`);
  }
}

function buildUniqueProcess(processIdentifier: number): Buffer {
  const processHandle = Kernel32.OpenProcess(PROCESS_QUERY_RIGHTS, 0, processIdentifier);
  if (processHandle === 0n) {
    throw new Error(`OpenProcess failed for PID ${processIdentifier}`);
  }

  const creationTimeBuffer = Buffer.alloc(8);
  const exitTimeBuffer = Buffer.alloc(8);
  const kernelTimeBuffer = Buffer.alloc(8);
  const userTimeBuffer = Buffer.alloc(8);

  try {
    const statusCode = Kernel32.GetProcessTimes(processHandle, creationTimeBuffer.ptr, exitTimeBuffer.ptr, kernelTimeBuffer.ptr, userTimeBuffer.ptr);
    if (!statusCode) {
      throw new Error(`GetProcessTimes failed for PID ${processIdentifier}`);
    }

    const uniqueProcessBuffer = Buffer.alloc(12);
    uniqueProcessBuffer.writeUInt32LE(processIdentifier, 0);
    creationTimeBuffer.copy(uniqueProcessBuffer, 4, 0, 8);
    return uniqueProcessBuffer;
  } finally {
    void Kernel32.CloseHandle(processHandle);
  }
}

function buildWidePointerArray(values: string[]): { pointerBuffer: Buffer | null; stringBuffers: Buffer[] } {
  const stringBuffers = values.map((value) => Buffer.from(`${value}\0`, 'utf16le'));
  if (stringBuffers.length === 0) {
    return { pointerBuffer: null, stringBuffers };
  }

  const pointerBuffer = Buffer.alloc(stringBuffers.length * 8);
  for (const [index, stringBuffer] of stringBuffers.entries()) {
    pointerBuffer.writeBigUInt64LE(BigInt(stringBuffer.ptr!), index * 8);
  }

  return { pointerBuffer, stringBuffers };
}

function decodeApplicationType(applicationType: number): string {
  switch (applicationType) {
    case RM_APP_TYPE.RmConsole:
      return 'Console';
    case RM_APP_TYPE.RmCritical:
      return 'Critical';
    case RM_APP_TYPE.RmExplorer:
      return 'Explorer';
    case RM_APP_TYPE.RmMainWindow:
      return 'MainWindow';
    case RM_APP_TYPE.RmOtherWindow:
      return 'OtherWindow';
    case RM_APP_TYPE.RmService:
      return 'Service';
    default:
      return 'Unknown';
  }
}

function decodeRebootReasons(rebootReasons: number): string[] {
  if (rebootReasons === RM_REBOOT_REASON.RmRebootReasonNone) {
    return ['None'];
  }

  const labels: string[] = [];
  if (rebootReasons & RM_REBOOT_REASON.RmRebootReasonCriticalProcess) labels.push('CriticalProcess');
  if (rebootReasons & RM_REBOOT_REASON.RmRebootReasonCriticalService) labels.push('CriticalService');
  if (rebootReasons & RM_REBOOT_REASON.RmRebootReasonDetectedSelf) labels.push('DetectedSelf');
  if (rebootReasons & RM_REBOOT_REASON.RmRebootReasonPermissionDenied) labels.push('PermissionDenied');
  if (rebootReasons & RM_REBOOT_REASON.RmRebootReasonSessionMismatch) labels.push('SessionMismatch');
  return labels;
}

function decodeStatusFlags(appStatus: number): string[] {
  if (appStatus === RM_APP_STATUS.RmStatusUnknown) {
    return ['Unknown'];
  }

  const labels: string[] = [];
  if (appStatus & RM_APP_STATUS.RmStatusErrorOnRestart) labels.push('ErrorOnRestart');
  if (appStatus & RM_APP_STATUS.RmStatusErrorOnStop) labels.push('ErrorOnStop');
  if (appStatus & RM_APP_STATUS.RmStatusRestartMasked) labels.push('RestartMasked');
  if (appStatus & RM_APP_STATUS.RmStatusRestarted) labels.push('Restarted');
  if (appStatus & RM_APP_STATUS.RmStatusRunning) labels.push('Running');
  if (appStatus & RM_APP_STATUS.RmStatusShutdownMasked) labels.push('ShutdownMasked');
  if (appStatus & RM_APP_STATUS.RmStatusStopped) labels.push('Stopped');
  if (appStatus & RM_APP_STATUS.RmStatusStoppedOther) labels.push('StoppedOther');
  return labels;
}

function fileTimeToIsoString(fileTime: bigint): string {
  if (fileTime === 0n) {
    return 'n/a';
  }

  const milliseconds = Number((fileTime - FILETIME_TO_UNIX_EPOCH_OFFSET) / 10_000n);
  return new Date(milliseconds).toISOString();
}

function queryAffectedApplications(sessionHandle: number): { affectedApplications: AffectedApplication[]; rebootReasons: number } {
  const procInfoNeededBuffer = Buffer.alloc(4);
  const procInfoCountBuffer = Buffer.alloc(4);
  const rebootReasonsBuffer = Buffer.alloc(4);

  let statusCode = Rstrtmgr.RmGetList(sessionHandle, procInfoNeededBuffer.ptr, procInfoCountBuffer.ptr, null, rebootReasonsBuffer.ptr);
  assertStatus(statusCode, 'RmGetList(first pass)', [ERROR_MORE_DATA, ERROR_SUCCESS]);

  const neededCount = procInfoNeededBuffer.readUInt32LE(0);
  if (neededCount === 0) {
    return { affectedApplications: [], rebootReasons: rebootReasonsBuffer.readUInt32LE(0) };
  }

  procInfoCountBuffer.writeUInt32LE(neededCount, 0);
  const processInfoBuffer = Buffer.alloc(neededCount * PROCESS_RECORD_SIZE);
  statusCode = Rstrtmgr.RmGetList(sessionHandle, procInfoNeededBuffer.ptr, procInfoCountBuffer.ptr, processInfoBuffer.ptr, rebootReasonsBuffer.ptr);
  assertStatus(statusCode, 'RmGetList(second pass)');

  const returnedCount = procInfoCountBuffer.readUInt32LE(0);
  const affectedApplications: AffectedApplication[] = [];

  for (let index = 0; index < returnedCount; index++) {
    const offset = index * PROCESS_RECORD_SIZE;
    affectedApplications.push({
      appName: readWideString(processInfoBuffer, offset + PROCESS_INFO_APP_NAME_OFFSET, CCH_RM_MAX_APP_NAME + 1),
      appStatus: processInfoBuffer.readUInt32LE(offset + PROCESS_INFO_APP_STATUS_OFFSET),
      applicationType: processInfoBuffer.readInt32LE(offset + PROCESS_INFO_APPLICATION_TYPE_OFFSET),
      processIdentifier: processInfoBuffer.readUInt32LE(offset + PROCESS_INFO_PROCESS_IDENTIFIER_OFFSET),
      processStartTime: processInfoBuffer.readBigUInt64LE(offset + PROCESS_START_TIME_OFFSET),
      restartable: processInfoBuffer.readInt32LE(offset + PROCESS_INFO_RESTARTABLE_OFFSET) !== 0,
      serviceShortName: readWideString(processInfoBuffer, offset + PROCESS_INFO_SERVICE_NAME_OFFSET, CCH_RM_MAX_SVC_NAME + 1),
      terminalSessionIdentifier: processInfoBuffer.readInt32LE(offset + PROCESS_INFO_SESSION_IDENTIFIER_OFFSET),
    });
  }

  return {
    affectedApplications,
    rebootReasons: rebootReasonsBuffer.readUInt32LE(0),
  };
}

function queryFilterRecords(sessionHandle: number): FilterRecord[] {
  const bytesNeededBuffer = Buffer.alloc(4);
  let statusCode = Rstrtmgr.RmGetFilterList(sessionHandle, null, 0, bytesNeededBuffer.ptr);
  assertStatus(statusCode, 'RmGetFilterList(size query)', [ERROR_MORE_DATA, ERROR_SUCCESS]);

  const requiredBytes = bytesNeededBuffer.readUInt32LE(0);
  if (requiredBytes === 0) {
    return [];
  }

  const filterBuffer = Buffer.alloc(requiredBytes);
  statusCode = Rstrtmgr.RmGetFilterList(sessionHandle, filterBuffer.ptr, filterBuffer.length, bytesNeededBuffer.ptr);
  assertStatus(statusCode, 'RmGetFilterList');

  const filterRecords: FilterRecord[] = [];
  for (let offset = 0; offset + FILTER_RECORD_SIZE <= filterBuffer.length; ) {
    const trigger = filterBuffer.readInt32LE(offset + 4);
    const nextOffset = filterBuffer.readUInt32LE(offset + 8);

    filterRecords.push({
      action: filterBuffer.readInt32LE(offset),
      nextOffset,
      processIdentifier: trigger === RM_FILTER_TRIGGER.RmFilterTriggerProcess ? filterBuffer.readUInt32LE(offset + 16) : null,
      processStartTime: trigger === RM_FILTER_TRIGGER.RmFilterTriggerProcess ? filterBuffer.readBigUInt64LE(offset + 20) : null,
      trigger,
    });

    if (nextOffset === 0) {
      break;
    }

    offset += nextOffset;
  }

  return filterRecords;
}

function readWideString(buffer: Buffer, offset: number, maxChars: number): string {
  let result = '';
  for (let index = 0; index < maxChars; index++) {
    const codeUnit = buffer.readUInt16LE(offset + index * 2);
    if (codeUnit === 0) {
      break;
    }
    result += String.fromCharCode(codeUnit);
  }
  return result;
}

function spawnFileHolder(filePath: string, holdMilliseconds: number) {
  const childProgram = `
    import { openSync } from 'node:fs';

    const filePath = process.env.FILE_PATH;
    const holdMilliseconds = Number(process.env.HOLD_MILLISECONDS ?? '15000');

    if (!filePath) {
      throw new Error('FILE_PATH missing');
    }

    const fileDescriptor = openSync(filePath, 'a+');
    setTimeout(() => {
      void fileDescriptor;
      process.exit(0);
    }, holdMilliseconds);
  `;

  return Bun.spawn([process.execPath, '--eval', childProgram], {
    env: {
      ...process.env,
      FILE_PATH: filePath,
      HOLD_MILLISECONDS: String(holdMilliseconds),
    },
    stderr: 'inherit',
    stdout: 'ignore',
  });
}

const workspacePath = join(tmpdir(), `bun-win32-rstrtmgr-session-audit-${Date.now()}`);
mkdirSync(workspacePath, { recursive: true });

const parentFilePath = join(workspacePath, 'anchor.txt');
const childAFilePath = join(workspacePath, 'satellite-a.txt');
const childBFilePath = join(workspacePath, 'satellite-b.txt');
writeFileSync(parentFilePath, 'primary handle\n');
writeFileSync(childAFilePath, 'child A handle\n');
writeFileSync(childBFilePath, 'child B handle\n');

const parentFileDescriptor = openSync(parentFilePath, 'a+');
const childAHoldProcess = spawnFileHolder(childAFilePath, 20_000);
const childBHoldProcess = spawnFileHolder(childBFilePath, 20_000);

let primarySessionHandle = 0;
let secondarySessionHandle = 0;
let filterProcessBuffer: Buffer | null = null;
let filterAdded = false;

try {
  await Bun.sleep(750);

  const primarySessionHandleBuffer = Buffer.alloc(4);
  const primarySessionKeyBuffer = Buffer.alloc((CCH_RM_SESSION_KEY + 1) * 2);
  let statusCode = Rstrtmgr.RmStartSession(primarySessionHandleBuffer.ptr, 0, primarySessionKeyBuffer.ptr);
  assertStatus(statusCode, 'RmStartSession');
  primarySessionHandle = primarySessionHandleBuffer.readUInt32LE(0);

  const secondarySessionHandleBuffer = Buffer.alloc(4);
  statusCode = Rstrtmgr.RmJoinSession(secondarySessionHandleBuffer.ptr, primarySessionKeyBuffer.ptr);
  assertStatus(statusCode, 'RmJoinSession');
  secondarySessionHandle = secondarySessionHandleBuffer.readUInt32LE(0);

  const primaryResourceArray = buildWidePointerArray([parentFilePath, childAFilePath]);
  statusCode = Rstrtmgr.RmRegisterResources(primarySessionHandle, 2, primaryResourceArray.pointerBuffer!.ptr, 0, null, 0, null);
  assertStatus(statusCode, 'RmRegisterResources(primary)');

  const secondaryResourceArray = buildWidePointerArray([childBFilePath]);
  statusCode = Rstrtmgr.RmRegisterResources(secondarySessionHandle, 1, secondaryResourceArray.pointerBuffer!.ptr, 0, null, 0, null);
  assertStatus(statusCode, 'RmRegisterResources(secondary)');

  filterProcessBuffer = buildUniqueProcess(childAHoldProcess.pid);
  statusCode = Rstrtmgr.RmAddFilter(primarySessionHandle, null, filterProcessBuffer.ptr, null, RM_FILTER_ACTION.RmNoRestart);
  assertStatus(statusCode, 'RmAddFilter');
  filterAdded = true;

  const filterRecords = queryFilterRecords(primarySessionHandle);
  const { affectedApplications, rebootReasons } = queryAffectedApplications(primarySessionHandle);

  statusCode = Rstrtmgr.RmRemoveFilter(primarySessionHandle, null, filterProcessBuffer.ptr, null);
  assertStatus(statusCode, 'RmRemoveFilter');
  filterAdded = false;

  console.log(`${TITLE}Restart Manager Session Audit${RESET}`);
  console.log('');
  console.log(`Primary session handle : ${primarySessionHandle}`);
  console.log(`Secondary session      : ${secondarySessionHandle}`);
  console.log(`Session key            : ${primarySessionKeyBuffer.toString('utf16le').replace(/\0.*$/, '')}`);
  console.log(`Registered resources   : 3`);
  console.log(`Tracked workspace      : ${workspacePath}`);
  console.log(`Reboot reasons         : ${decodeRebootReasons(rebootReasons).join(', ')}`);
  console.log('');
  console.log('Registered files');
  console.log('-'.repeat(108));
  console.log(`  ${parentFilePath}`);
  console.log(`  ${childAFilePath}`);
  console.log(`  ${childBFilePath}`);
  console.log('-'.repeat(108));
  console.log('');
  console.log('Affected applications');
  console.log('-'.repeat(156));
  console.log(`  ${'PID'.padEnd(8)}${'Type'.padEnd(14)}${'Restart'.padEnd(10)}${'Session'.padEnd(10)}${'Started'.padEnd(28)}${'Status'.padEnd(34)}Name / Service`);
  console.log('-'.repeat(156));

  for (const application of affectedApplications.sort((left, right) => left.processIdentifier - right.processIdentifier)) {
    const statusSummary = decodeStatusFlags(application.appStatus).join('|');
    const nameSummary = application.serviceShortName ? `${application.appName || '(no app name)'} / ${application.serviceShortName}` : application.appName || '(no app name)';

    console.log(
      `  ${String(application.processIdentifier).padEnd(8)}` +
        `${decodeApplicationType(application.applicationType).padEnd(14)}` +
        `${(application.restartable ? 'yes' : 'no').padEnd(10)}` +
        `${String(application.terminalSessionIdentifier).padEnd(10)}` +
        `${fileTimeToIsoString(application.processStartTime).padEnd(28)}` +
        `${statusSummary.padEnd(34)}` +
        `${nameSummary}`,
    );
  }

  console.log('-'.repeat(156));
  console.log('');
  console.log('Filter records');
  console.log('-'.repeat(108));
  console.log(`  ${'Action'.padEnd(14)}${'Trigger'.padEnd(16)}${'NextOffset'.padEnd(14)}${'PID'.padEnd(10)}Started`);
  console.log('-'.repeat(108));

  for (const filterRecord of filterRecords) {
    const triggerLabel =
      filterRecord.trigger === RM_FILTER_TRIGGER.RmFilterTriggerFile
        ? 'File'
        : filterRecord.trigger === RM_FILTER_TRIGGER.RmFilterTriggerProcess
          ? 'Process'
          : filterRecord.trigger === RM_FILTER_TRIGGER.RmFilterTriggerService
            ? 'Service'
            : 'Invalid';
    const actionLabel = filterRecord.action === RM_FILTER_ACTION.RmNoRestart ? 'NoRestart' : filterRecord.action === RM_FILTER_ACTION.RmNoShutdown ? 'NoShutdown' : 'Invalid';

    console.log(
      `  ${actionLabel.padEnd(14)}` +
        `${triggerLabel.padEnd(16)}` +
        `${String(filterRecord.nextOffset).padEnd(14)}` +
        `${String(filterRecord.processIdentifier ?? '').padEnd(10)}` +
        `${filterRecord.processStartTime === null ? '' : fileTimeToIsoString(filterRecord.processStartTime)}`,
    );
  }

  console.log('-'.repeat(108));
  console.log('');
  console.log(`${SUCCESS}Audit complete.${RESET} ${MUTED}The session stayed read-only; no shutdown or restart operations were requested.${RESET}`);
} finally {
  if (filterAdded && filterProcessBuffer !== null && primarySessionHandle !== 0) {
    try {
      void Rstrtmgr.RmRemoveFilter(primarySessionHandle, null, filterProcessBuffer.ptr, null);
    } catch {}
  }

  if (secondarySessionHandle !== 0) {
    try {
      void Rstrtmgr.RmEndSession(secondarySessionHandle);
    } catch {}
  }

  if (primarySessionHandle !== 0) {
    try {
      void Rstrtmgr.RmEndSession(primarySessionHandle);
    } catch {}
  }

  try {
    childAHoldProcess.kill();
  } catch {}

  try {
    childBHoldProcess.kill();
  } catch {}

  await Promise.allSettled([childAHoldProcess.exited, childBHoldProcess.exited]);
  closeSync(parentFileDescriptor);
  rmSync(workspacePath, { force: true, recursive: true });
}
