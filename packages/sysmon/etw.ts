import { JSCallback, type Pointer, read } from 'bun:ffi';
import Advapi32 from '@bun-win32/advapi32';
import Tdh from '@bun-win32/tdh';
import { isElevated } from './system';
import { preloadPending } from './preload';
import { type EtwProvider, decodeNulTerminatedUnicodeString, guidToBytes, parseProviderEnumeration } from './structs';

preloadPending(Advapi32, ['CloseTrace', 'ControlTraceW', 'EnableTraceEx2', 'OpenTraceW', 'ProcessTrace', 'StartTraceW']);
preloadPending(Tdh, ['TdhEnumerateManifestProviderEvents', 'TdhEnumerateProviders', 'TdhGetEventInformation', 'TdhGetManifestEventInformation']);
const { CloseTrace, ControlTraceW, EnableTraceEx2, OpenTraceW, ProcessTrace, StartTraceW } = Advapi32;
const { TdhEnumerateManifestProviderEvents, TdhEnumerateProviders, TdhGetEventInformation, TdhGetManifestEventInformation } = Tdh;

const ERROR_ACCESS_DENIED = 5;
const ERROR_ALREADY_EXISTS = 183;
const ERROR_INSUFFICIENT_BUFFER = 122;
const ERROR_SUCCESS = 0;
const EVENT_CONTROL_CODE_ENABLE_PROVIDER = 1;
const EVENT_TRACE_CONTROL_STOP = 1;
const EVENT_TRACE_PROPERTIES_SIZE = 120;
const EVENT_TRACE_REAL_TIME_MODE = 0x0000_0100;
const INVALID_PROCESSTRACE_HANDLE = 0xffff_ffff_ffff_ffffn;
const PROCESS_TRACE_MODE_EVENT_RECORD = 0x1000_0000;
const PROCESS_TRACE_MODE_REAL_TIME = 0x0000_0100;
const TRACE_LEVEL_VERBOSE = 5;
const WNODE_FLAG_TRACED_GUID = 0x0002_0000;

export interface EtwEvent {
  eventId: number;
  opcode: number;
  opcodeName: string;
  processId: number;
  providerName: string;
  taskName: string;
  threadId: number;
}

export interface EtwEventProperty {
  inType: number;
  name: string;
  outType: number;
}

export interface EtwEventSchema {
  eventId: number;
  level: number;
  message: string;
  opcode: number;
  opcodeName: string;
  properties: EtwEventProperty[];
  taskName: string;
  version: number;
}

export interface EtwRunOptions {
  /** Pump until this deadline; ProcessTrace BLOCKS the thread, so a duration is the only stop signal v1 can honor. */
  durationMs: number;
}

export interface EtwRunResult {
  eventCount: number;
  processTraceStatus: number;
}

export interface EtwSessionOptions {
  /** Canonical GUID string; resolved from `providerName` via the census when omitted. */
  providerGuid?: string;
  /** Default `Microsoft-Windows-Kernel-Process`. */
  providerName?: string;
  /** ETW session name (default `bun-sysmon-firehose`). A leftover session with this name is stopped and replaced. */
  sessionName?: string;
}

function enumerateProvidersBuffer(): Buffer {
  const sizeBuffer = Buffer.alloc(4);
  sizeBuffer.writeUInt32LE(0, 0);
  const probeStatus = TdhEnumerateProviders(null, sizeBuffer.ptr);
  if (probeStatus !== ERROR_INSUFFICIENT_BUFFER) throw new Error(`TdhEnumerateProviders probe failed: ${probeStatus}`);
  const buffer = Buffer.alloc(sizeBuffer.readUInt32LE(0));
  const status = TdhEnumerateProviders(buffer.ptr, sizeBuffer.ptr);
  if (status !== ERROR_SUCCESS) throw new Error(`TdhEnumerateProviders failed: ${status}`);
  return buffer;
}

/** Census of every registered ETW provider (TdhEnumerateProviders) — NO elevation required. */
export function etwProviders(): EtwProvider[] {
  return parseProviderEnumeration(enumerateProvidersBuffer());
}

/**
 * Every manifest event template a provider declares — id/version/level/opcode, task/opcode
 * names, message, and the typed payload schema (TdhEnumerateManifestProviderEvents +
 * TdhGetManifestEventInformation). NO elevation required. MOF-only providers return [].
 */
export function etwProviderSchema(guid: string): EtwEventSchema[] {
  const guidBuffer = guidToBytes(guid);
  const sizeBuffer = Buffer.alloc(4);
  sizeBuffer.writeUInt32LE(0, 0);
  const probeStatus = TdhEnumerateManifestProviderEvents(guidBuffer.ptr, null, sizeBuffer.ptr);
  if (probeStatus !== ERROR_INSUFFICIENT_BUFFER) return [];
  const eventsBuffer = Buffer.alloc(sizeBuffer.readUInt32LE(0));
  if (TdhEnumerateManifestProviderEvents(guidBuffer.ptr, eventsBuffer.ptr, sizeBuffer.ptr) !== ERROR_SUCCESS) return [];
  const eventCount = eventsBuffer.readUInt32LE(0);
  const schemas: EtwEventSchema[] = [];
  const informationSize = Buffer.alloc(4);
  for (let i = 0; i < eventCount; i += 1) {
    const descriptor = Buffer.from(eventsBuffer.subarray(8 + i * 16, 8 + i * 16 + 16)); // EVENT_DESCRIPTOR: Id u16@0, Version u8@2, Level u8@4, Opcode u8@5
    informationSize.writeUInt32LE(0, 0);
    const probe = TdhGetManifestEventInformation(guidBuffer.ptr, descriptor.ptr, null, informationSize.ptr);
    if (probe !== ERROR_INSUFFICIENT_BUFFER) continue;
    const information = Buffer.alloc(informationSize.readUInt32LE(0));
    if (TdhGetManifestEventInformation(guidBuffer.ptr, descriptor.ptr, information.ptr, informationSize.ptr) !== ERROR_SUCCESS) continue;
    schemas.push(schemaFromTraceEventInformation(information, descriptor));
  }
  return schemas;
}

function readNameAt(information: Buffer, offset: number): string {
  return offset > 0 && offset < information.byteLength ? decodeNulTerminatedUnicodeString(information, offset, (information.byteLength - offset) >> 1) : '';
}

// TRACE_EVENT_INFO: ProviderNameOffset u32@52, TaskNameOffset@68, OpcodeNameOffset@72, MessageOffset@76, PropertyCount u32@104; EventPropertyInfoArray @112, 24 B each (NameOffset@+4, InType u16@+8, OutType u16@+10).
function schemaFromTraceEventInformation(information: Buffer, descriptor: Buffer): EtwEventSchema {
  const propertyCount = information.readUInt32LE(104);
  const properties: EtwEventProperty[] = new Array(propertyCount);
  for (let p = 0; p < propertyCount; p += 1) {
    const base = 112 + p * 24;
    properties[p] = {
      inType: information.readUInt16LE(base + 8),
      name: readNameAt(information, information.readUInt32LE(base + 4)),
      outType: information.readUInt16LE(base + 10),
    };
  }
  return {
    eventId: descriptor.readUInt16LE(0),
    level: descriptor.readUInt8(4),
    message: readNameAt(information, information.readUInt32LE(76)),
    opcode: descriptor.readUInt8(5),
    opcodeName: readNameAt(information, information.readUInt32LE(72)),
    properties,
    taskName: readNameAt(information, information.readUInt32LE(68)),
    version: descriptor.readUInt8(2),
  };
}

/**
 * Real-time decoded ETW consumer (Procmon-lite). REQUIRES ELEVATION — construction throws a
 * clear error unelevated; the provider census, schemas, and the Event Log tail are the
 * no-admin surface. `run` BLOCKS the JS thread while `ProcessTrace` pumps: no other
 * JavaScript (timers, promises, servers) executes until the deadline — a worker-owned
 * session is roadmap, not v1. The session is always stopped and the callbacks closed in a
 * `finally`, even when the pump throws.
 */
export class EtwSession {
  #providerGuidBytes: Buffer;
  #providerName: string;
  #sessionName: string;
  #sessionNameBuffer: Buffer;

  constructor(options?: EtwSessionOptions) {
    if (!isElevated()) {
      throw new Error('real-time ETW requires an elevated process (StartTraceW returns ERROR_ACCESS_DENIED otherwise); the provider census (etwProviders), schemas (etwProviderSchema), and the Event Log tail work without admin');
    }
    this.#providerName = options?.providerName ?? 'Microsoft-Windows-Kernel-Process';
    if (options?.providerGuid !== undefined) {
      this.#providerGuidBytes = guidToBytes(options.providerGuid);
    } else {
      const provider = etwProviders().find((candidate) => candidate.name === this.#providerName);
      if (provider === undefined) throw new Error(`ETW provider '${this.#providerName}' not found in the census — list them with etwProviders()`);
      this.#providerGuidBytes = guidToBytes(provider.guid);
    }
    this.#sessionName = options?.sessionName ?? 'bun-sysmon-firehose';
    this.#sessionNameBuffer = Buffer.from(`${this.#sessionName}\0`, 'utf16le');
  }

  /** Pump decoded events to `onEvent` until the deadline. BLOCKING + foreground (see class doc). The event object is REUSED across callbacks — copy fields you keep. */
  run(onEvent: (event: EtwEvent) => void, options: EtwRunOptions): EtwRunResult {
    const properties = Buffer.alloc(EVENT_TRACE_PROPERTIES_SIZE + 512);
    properties.writeUInt32LE(properties.byteLength, 0); // Wnode.BufferSize
    properties.writeUInt32LE(1, 40); // Wnode.ClientContext = QPC
    properties.writeUInt32LE(WNODE_FLAG_TRACED_GUID, 44);
    properties.writeUInt32LE(EVENT_TRACE_REAL_TIME_MODE, 64); // LogFileMode
    properties.writeUInt32LE(0, 112); // LogFileNameOffset — real-time, no file
    properties.writeUInt32LE(EVENT_TRACE_PROPERTIES_SIZE, 116); // LoggerNameOffset

    const sessionHandleBuffer = Buffer.alloc(8);
    let startStatus = StartTraceW(sessionHandleBuffer.ptr, this.#sessionNameBuffer.ptr, properties.ptr);
    if (startStatus === ERROR_ALREADY_EXISTS) {
      this.#stopSession();
      startStatus = StartTraceW(sessionHandleBuffer.ptr, this.#sessionNameBuffer.ptr, properties.ptr);
    }
    if (startStatus === ERROR_ACCESS_DENIED) throw new Error('StartTraceW: ERROR_ACCESS_DENIED — real-time ETW requires an elevated process');
    if (startStatus !== ERROR_SUCCESS) throw new Error(`StartTraceW failed: ${startStatus}`);
    const sessionHandle = sessionHandleBuffer.readBigUInt64LE(0);

    const deadline = Date.now() + options.durationMs;
    let eventCount = 0;
    let processTraceStatus = ERROR_SUCCESS;

    // Schema cache: TDH decode runs once per event TYPE (provider GUID is fixed per session, so id·version·opcode keys it), not per event — the callback hot path is 3 fixed-offset reads + a Map hit.
    const nameCache = new Map<number, { opcodeName: string; providerName: string; taskName: string }>();
    const informationSize = Buffer.alloc(4);
    let informationBuffer = Buffer.alloc(8_192);
    const reusedEvent: EtwEvent = { eventId: 0, opcode: 0, opcodeName: '', processId: 0, providerName: this.#providerName, taskName: '', threadId: 0 };

    const recordCallback = new JSCallback(
      (eventRecord: Pointer | null) => {
        if (eventRecord === null) return;
        const processId = read.u32(eventRecord, 12);
        const threadId = read.u32(eventRecord, 8);
        const eventId = read.u16(eventRecord, 40);
        const version = read.u8(eventRecord, 42);
        const opcode = read.u8(eventRecord, 45);
        const cacheKey = eventId | (version << 16) | (opcode << 24);
        let names = nameCache.get(cacheKey);
        if (names === undefined) {
          names = { opcodeName: '', providerName: this.#providerName, taskName: '' };
          informationSize.writeUInt32LE(0, 0);
          const probe = TdhGetEventInformation(eventRecord, 0, null, null, informationSize.ptr);
          const needed = informationSize.readUInt32LE(0);
          if (probe === ERROR_INSUFFICIENT_BUFFER && needed > 0) {
            if (needed > informationBuffer.byteLength) informationBuffer = Buffer.alloc(needed);
            informationSize.writeUInt32LE(informationBuffer.byteLength, 0);
            if (TdhGetEventInformation(eventRecord, 0, null, informationBuffer.ptr, informationSize.ptr) === ERROR_SUCCESS) {
              names.providerName = readNameAt(informationBuffer, informationBuffer.readUInt32LE(52)) || this.#providerName;
              names.taskName = readNameAt(informationBuffer, informationBuffer.readUInt32LE(68));
              names.opcodeName = readNameAt(informationBuffer, informationBuffer.readUInt32LE(72));
            }
          }
          nameCache.set(cacheKey, names);
        }
        reusedEvent.eventId = eventId;
        reusedEvent.opcode = opcode;
        reusedEvent.opcodeName = names.opcodeName;
        reusedEvent.processId = processId;
        reusedEvent.providerName = names.providerName;
        reusedEvent.taskName = names.taskName;
        reusedEvent.threadId = threadId;
        eventCount += 1;
        onEvent(reusedEvent);
      },
      { args: ['ptr'], returns: 'void' },
    );
    const bufferCallback = new JSCallback(() => (Date.now() < deadline ? 1 : 0), { args: ['ptr'], returns: 'u32' });

    try {
      const enableStatus = EnableTraceEx2(sessionHandle, this.#providerGuidBytes.ptr, EVENT_CONTROL_CODE_ENABLE_PROVIDER, TRACE_LEVEL_VERBOSE, 0n, 0n, 0, null);
      if (enableStatus !== ERROR_SUCCESS) throw new Error(`EnableTraceEx2 failed: ${enableStatus}`);

      // EVENT_TRACE_LOGFILEW (448 B): LoggerName u64@8, ProcessTraceMode u32@28, BufferCallback u64@400, EventRecordCallback u64@424.
      const logfile = Buffer.alloc(448);
      const sessionNamePointer = this.#sessionNameBuffer.ptr;
      logfile.writeBigUInt64LE(BigInt(sessionNamePointer), 8);
      logfile.writeUInt32LE(PROCESS_TRACE_MODE_REAL_TIME | PROCESS_TRACE_MODE_EVENT_RECORD, 28);
      logfile.writeBigUInt64LE(BigInt(bufferCallback.ptr ?? 0), 400);
      logfile.writeBigUInt64LE(BigInt(recordCallback.ptr ?? 0), 424);

      const traceHandle = OpenTraceW(logfile.ptr);
      if (traceHandle === INVALID_PROCESSTRACE_HANDLE) throw new Error('OpenTraceW failed');
      const handleArray = Buffer.alloc(8);
      handleArray.writeBigUInt64LE(traceHandle, 0);
      try {
        processTraceStatus = ProcessTrace(handleArray.ptr, 1, null, null); // BLOCKS until bufferCallback returns 0
      } finally {
        void CloseTrace(traceHandle);
      }
    } finally {
      this.#stopSession();
      recordCallback.close();
      bufferCallback.close();
    }
    return { eventCount, processTraceStatus };
  }

  #stopSession(): void {
    const stopProperties = Buffer.alloc(EVENT_TRACE_PROPERTIES_SIZE + 512);
    stopProperties.writeUInt32LE(stopProperties.byteLength, 0);
    stopProperties.writeUInt32LE(EVENT_TRACE_PROPERTIES_SIZE, 116);
    void ControlTraceW(0n, this.#sessionNameBuffer.ptr, stopProperties.ptr, EVENT_TRACE_CONTROL_STOP);
  }
}
