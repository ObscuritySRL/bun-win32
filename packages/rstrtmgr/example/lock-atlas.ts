/**
 * Lock Atlas
 *
 * An ANSI-driven live dashboard that spawns short-lived Bun workers, keeps file
 * handles open across multiple processes, and repaints a Restart Manager view
 * of the affected applications as the lock constellation changes over time.
 *
 * APIs demonstrated:
 *   - RmStartSession              (create the monitoring session)
 *   - RmRegisterResources         (register tracked files)
 *   - RmGetList                   (poll affected applications in real time)
 *   - RmEndSession                (close the monitoring session)
 *
 * Run: bun run example/lock-atlas.ts
 */
import { closeSync, mkdirSync, openSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Rstrtmgr, { CCH_RM_MAX_APP_NAME, CCH_RM_MAX_SVC_NAME, CCH_RM_SESSION_KEY, RM_APP_STATUS, RM_APP_TYPE } from '../index';

const CLEAR = '\x1b[2J';
const ERROR_MORE_DATA = 234;
const ERROR_SUCCESS = 0;
const FILETIME_TO_UNIX_EPOCH_OFFSET = 116_444_736_000_000_000n;
const HIDE_CURSOR = '\x1b[?25l';
const PROCESS_INFO_APP_NAME_OFFSET = 12;
const PROCESS_INFO_APP_STATUS_OFFSET = 656;
const PROCESS_INFO_APPLICATION_TYPE_OFFSET = 652;
const PROCESS_INFO_PROCESS_IDENTIFIER_OFFSET = 0;
const PROCESS_INFO_RESTARTABLE_OFFSET = 664;
const PROCESS_INFO_SERVICE_NAME_OFFSET = 524;
const PROCESS_INFO_SESSION_IDENTIFIER_OFFSET = 660;
const PROCESS_INFO_START_TIME_OFFSET = 4;
const PROCESS_RECORD_SIZE = 668;
const RESET = '\x1b[0m';
const SHOW_CURSOR = '\x1b[?25h';

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

Rstrtmgr.Preload(['RmEndSession', 'RmGetList', 'RmRegisterResources', 'RmStartSession']);

function assertStatus(statusCode: number, operationName: string, allowedStatusCodes: number[] = [ERROR_SUCCESS]): void {
  if (!allowedStatusCodes.includes(statusCode)) {
    throw new Error(`${operationName} failed: ${statusCode}`);
  }
}

function buildWidePointerArray(values: string[]): { pointerBuffer: Buffer; stringBuffers: Buffer[] } {
  const stringBuffers = values.map((value) => Buffer.from(`${value}\0`, 'utf16le'));
  const pointerBuffer = Buffer.alloc(stringBuffers.length * 8);

  for (const [index, stringBuffer] of stringBuffers.entries()) {
    pointerBuffer.writeBigUInt64LE(BigInt(stringBuffer.ptr!), index * 8);
  }

  return { pointerBuffer, stringBuffers };
}

function color(index: number, text: string): string {
  return `\x1b[38;5;${index}m${text}${RESET}`;
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
      return 'Main';
    case RM_APP_TYPE.RmOtherWindow:
      return 'Other';
    case RM_APP_TYPE.RmService:
      return 'Service';
    default:
      return 'Unknown';
  }
}

function decodeStatus(appStatus: number): string {
  if (appStatus & RM_APP_STATUS.RmStatusRunning) return 'Running';
  if (appStatus & RM_APP_STATUS.RmStatusRestarted) return 'Restarted';
  if (appStatus & RM_APP_STATUS.RmStatusStopped) return 'Stopped';
  if (appStatus & RM_APP_STATUS.RmStatusStoppedOther) return 'StoppedOther';
  return 'Unknown';
}

function fileTimeToAgeSeconds(fileTime: bigint): number {
  if (fileTime === 0n) {
    return 0;
  }

  const milliseconds = Number((fileTime - FILETIME_TO_UNIX_EPOCH_OFFSET) / 10_000n);
  return Math.max(0, Math.floor((Date.now() - milliseconds) / 1000));
}

function queryAffectedApplications(sessionHandle: number): AffectedApplication[] {
  const procInfoNeededBuffer = Buffer.alloc(4);
  const procInfoCountBuffer = Buffer.alloc(4);
  const rebootReasonsBuffer = Buffer.alloc(4);

  let statusCode = Rstrtmgr.RmGetList(sessionHandle, procInfoNeededBuffer.ptr, procInfoCountBuffer.ptr, null, rebootReasonsBuffer.ptr);
  assertStatus(statusCode, 'RmGetList(first pass)', [ERROR_MORE_DATA, ERROR_SUCCESS]);

  const neededCount = procInfoNeededBuffer.readUInt32LE(0);
  if (neededCount === 0) {
    return [];
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
      processStartTime: processInfoBuffer.readBigUInt64LE(offset + PROCESS_INFO_START_TIME_OFFSET),
      restartable: processInfoBuffer.readInt32LE(offset + PROCESS_INFO_RESTARTABLE_OFFSET) !== 0,
      serviceShortName: readWideString(processInfoBuffer, offset + PROCESS_INFO_SERVICE_NAME_OFFSET, CCH_RM_MAX_SVC_NAME + 1),
      terminalSessionIdentifier: processInfoBuffer.readInt32LE(offset + PROCESS_INFO_SESSION_IDENTIFIER_OFFSET),
    });
  }

  return affectedApplications;
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

function renderFrame(sessionHandle: number, sessionKey: string, trackedFiles: string[], affectedApplications: AffectedApplication[], elapsedMilliseconds: number): string {
  const palette = [45, 51, 87, 123, 159, 195, 231];
  const title = 'LOCK ATLAS';
  const titleLetters = [...title].map((character, index) => color(palette[(index + Math.floor(elapsedMilliseconds / 200)) % palette.length], character)).join('');
  const lines: string[] = [];

  lines.push(titleLetters);
  lines.push('');
  lines.push(`Session handle : ${sessionHandle}`);
  lines.push(`Session key    : ${sessionKey}`);
  lines.push(`Elapsed        : ${(elapsedMilliseconds / 1000).toFixed(1)}s`);
  lines.push(`Tracked files  : ${trackedFiles.length}`);
  lines.push(`Affected apps  : ${affectedApplications.length}`);
  lines.push('');
  lines.push('Process field');
  lines.push('-'.repeat(112));

  for (const [index, application] of affectedApplications.sort((left, right) => left.processIdentifier - right.processIdentifier).entries()) {
    const barWidth = 28;
    const ageSeconds = fileTimeToAgeSeconds(application.processStartTime);
    const filledWidth = Math.min(barWidth, Math.max(4, ageSeconds % (barWidth + 1)));
    const colorIndex = 196 + ((index * 11 + Math.floor(elapsedMilliseconds / 120)) % 24);
    const bar = color(colorIndex, '='.repeat(filledWidth)) + '.'.repeat(barWidth - filledWidth);
    const nameSummary = application.serviceShortName ? `${application.appName || '(no app name)'} / ${application.serviceShortName}` : application.appName || '(no app name)';

    lines.push(
      `PID ${String(application.processIdentifier).padEnd(6)}` +
        `${decodeApplicationType(application.applicationType).padEnd(10)}` +
        `${(application.restartable ? 'restart' : 'static').padEnd(10)}` +
        `${decodeStatus(application.appStatus).padEnd(14)}` +
        `${bar} ` +
        `${nameSummary} [session ${application.terminalSessionIdentifier}]`,
    );
  }

  if (affectedApplications.length === 0) {
    lines.push('No affected applications remain. The constellation has gone dark.');
  }

  lines.push('-'.repeat(112));
  lines.push('');
  lines.push('Tracked resources');
  for (const filePath of trackedFiles) {
    lines.push(`  * ${filePath}`);
  }

  return lines.join('\n');
}

function spawnFileHolder(filePath: string, holdMilliseconds: number) {
  const childProgram = `
    import { openSync } from 'node:fs';

    const filePath = process.env.FILE_PATH;
    const holdMilliseconds = Number(process.env.HOLD_MILLISECONDS ?? '10000');

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

const workspacePath = join(tmpdir(), `bun-win32-rstrtmgr-lock-atlas-${Date.now()}`);
mkdirSync(workspacePath, { recursive: true });

const anchorFilePath = join(workspacePath, 'anchor.txt');
const cometFilePath = join(workspacePath, 'comet.txt');
const pulseFilePath = join(workspacePath, 'pulse.txt');
writeFileSync(anchorFilePath, 'anchor\n');
writeFileSync(cometFilePath, 'comet\n');
writeFileSync(pulseFilePath, 'pulse\n');

const anchorFileDescriptor = openSync(anchorFilePath, 'a+');
const cometProcess = spawnFileHolder(cometFilePath, 7_500);
const pulseProcess = spawnFileHolder(pulseFilePath, 13_000);

let sessionHandle = 0;

try {
  await Bun.sleep(750);

  const sessionHandleBuffer = Buffer.alloc(4);
  const sessionKeyBuffer = Buffer.alloc((CCH_RM_SESSION_KEY + 1) * 2);
  let statusCode = Rstrtmgr.RmStartSession(sessionHandleBuffer.ptr, 0, sessionKeyBuffer.ptr);
  assertStatus(statusCode, 'RmStartSession');
  sessionHandle = sessionHandleBuffer.readUInt32LE(0);

  const resourceArray = buildWidePointerArray([anchorFilePath, cometFilePath, pulseFilePath]);
  statusCode = Rstrtmgr.RmRegisterResources(sessionHandle, 3, resourceArray.pointerBuffer.ptr, 0, null, 0, null);
  assertStatus(statusCode, 'RmRegisterResources');

  const sessionKey = sessionKeyBuffer.toString('utf16le').replace(/\0.*$/, '');
  const startedAt = Date.now();
  const trackedFiles = [anchorFilePath, cometFilePath, pulseFilePath];

  if (process.stdout.isTTY) {
    process.stdout.write(CLEAR);
    process.stdout.write(HIDE_CURSOR);
  }

  while (Date.now() - startedAt < 14_000) {
    const affectedApplications = queryAffectedApplications(sessionHandle);
    const frame = renderFrame(sessionHandle, sessionKey, trackedFiles, affectedApplications, Date.now() - startedAt);

    if (process.stdout.isTTY) {
      process.stdout.write('\x1b[H');
      process.stdout.write(frame);
      process.stdout.write('\n');
    } else {
      console.log(frame);
      console.log('');
    }

    await Bun.sleep(200);
  }

  if (process.stdout.isTTY) {
    process.stdout.write('\x1b[H');
    process.stdout.write(renderFrame(sessionHandle, sessionKey, trackedFiles, queryAffectedApplications(sessionHandle), Date.now() - startedAt));
    process.stdout.write('\n');
  }
} finally {
  if (process.stdout.isTTY) {
    process.stdout.write(SHOW_CURSOR);
    process.stdout.write('\n');
  }

  if (sessionHandle !== 0) {
    try {
      void Rstrtmgr.RmEndSession(sessionHandle);
    } catch {}
  }

  try {
    cometProcess.kill();
  } catch {}

  try {
    pulseProcess.kill();
  } catch {}

  await Promise.allSettled([cometProcess.exited, pulseProcess.exited]);
  closeSync(anchorFileDescriptor);
  rmSync(workspacePath, { force: true, recursive: true });
}
