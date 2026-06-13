import type { Pointer } from 'bun:ffi';

import { ipv4FromU32, ipv6FromBytes, portFromNetworkOrder } from './addr';
import { AF_INET, AF_INET6, type AddressFamilyName, TCP_TABLE_OWNER_MODULE_ALL, TCP_TABLE_OWNER_PID_ALL, TCPIP_OWNER_MODULE_INFO_BASIC, tcpStateName, UDP_TABLE_OWNER_PID } from './constants';
import { Iphlpapi, Kernel32, readWideAt, SizedBufferState } from './win32';

// Fixed x64 row strides (do NOT derive from buffer size — net-xray ground truth).
const TCP4_PID_ROW = 24; // MIB_TCPROW_OWNER_PID
const TCP6_PID_ROW = 56; // MIB_TCP6ROW_OWNER_PID
const TCP4_MODULE_ROW = 160; // MIB_TCPROW_OWNER_MODULE (24 basic + liCreateTimestamp(8) + OwningModuleInfo[16](128))
const TCP6_MODULE_ROW = 192; // MIB_TCP6ROW_OWNER_MODULE (56 basic + 8 + 128)
const UDP4_ROW = 12; // MIB_UDPROW_OWNER_PID
const UDP6_ROW = 28; // MIB_UDP6ROW_OWNER_PID
const PROCESS_QUERY_LIMITED_INFORMATION = 0x0000_1000;

export type NameResolution = 'none' | 'module' | 'image';

export interface SocketOptions {
  family?: AddressFamilyName;
  resolveNames?: NameResolution;
}

export interface TcpConnection {
  family: 'ipv4' | 'ipv6';
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  state: string;
  pid: number;
  processName?: string;
}

export interface UdpEndpoint {
  family: 'ipv4' | 'ipv6';
  localAddress: string;
  localPort: number;
  pid: number;
  processName?: string;
}

const tcp4State = new SizedBufferState();
const tcp6State = new SizedBufferState();
const udp4State = new SizedBufferState();
const udp6State = new SizedBufferState();
const moduleState = new SizedBufferState(0x0000_2000);
const imageNameBuffer = Buffer.allocUnsafeSlow(0x0000_0420); // 528 wchars, own buffer
const imageSizeBuffer = Buffer.allocUnsafeSlow(4);

// The owning MODULE name (iphlpapi-only moat) — pModuleName is an offset-pointer INTO the out buffer.
function resolveModuleName(rowPointer: Pointer): string {
  try {
    moduleState.fill((dataPointer, sizePointer) => Iphlpapi.GetOwnerModuleFromTcpEntry(rowPointer, TCPIP_OWNER_MODULE_INFO_BASIC, dataPointer, sizePointer));
  } catch {
    return ''; // ERROR_ACCESS_DENIED for other-user / protected PIDs — fall back to the bare PID
  }
  const base = moduleState.buffer;
  const moduleNamePointer = Number(base.readBigUInt64LE(0)); // TCPIP_OWNER_MODULE_BASIC_INFO.pModuleName
  return moduleNamePointer === 0 ? '' : readWideAt(base, moduleNamePointer - Number(base.ptr));
}

// The full image basename via kernel32 (the richer, cross-DLL mode).
function resolveImageName(pid: number): string {
  if (pid <= 4) return pid === 4 ? 'System' : 'Idle';
  const handle = Kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
  if (handle === 0n) return '';
  try {
    imageSizeBuffer.writeUInt32LE(0x0000_0210, 0); // 528 chars in/out
    if (!Kernel32.QueryFullProcessImageNameW(handle, 0, imageNameBuffer.ptr, imageSizeBuffer.ptr)) return '';
    const path = imageNameBuffer.toString('utf16le', 0, imageSizeBuffer.readUInt32LE(0) * 2);
    const slash = path.lastIndexOf('\\');
    return slash < 0 ? path : path.slice(slash + 1);
  } finally {
    Kernel32.CloseHandle(handle);
  }
}

function decodeTcp(view: DataView, base: Buffer, family: 'ipv4' | 'ipv6', rowStride: number, headerOffset: number, resolveNames: NameResolution, cache: Map<number, string>, result: TcpConnection[]): void {
  const count = view.getUint32(0, true);
  for (let index = 0; index < count; index++) {
    const offset = headerOffset + index * rowStride;
    let state: number;
    let localAddress: string;
    let localPort: number;
    let remoteAddress: string;
    let remotePort: number;
    let pid: number;
    if (family === 'ipv4') {
      state = view.getUint32(offset, true);
      localAddress = ipv4FromU32(view.getUint32(offset + 4, true));
      localPort = portFromNetworkOrder(view.getUint32(offset + 8, true));
      remoteAddress = ipv4FromU32(view.getUint32(offset + 12, true));
      remotePort = portFromNetworkOrder(view.getUint32(offset + 16, true));
      pid = view.getUint32(offset + 20, true);
    } else {
      localAddress = ipv6FromBytes(base, offset);
      localPort = portFromNetworkOrder(view.getUint32(offset + 20, true));
      remoteAddress = ipv6FromBytes(base, offset + 24);
      remotePort = portFromNetworkOrder(view.getUint32(offset + 44, true));
      state = view.getUint32(offset + 48, true);
      pid = view.getUint32(offset + 52, true);
    }
    let processName: string | undefined;
    if (resolveNames !== 'none') {
      processName = cache.get(pid);
      if (processName === undefined) {
        processName = resolveNames === 'module' ? resolveModuleName(base.subarray(offset, offset + rowStride).ptr) : resolveImageName(pid);
        cache.set(pid, processName);
      }
    }
    result.push({ family, localAddress, localPort, remoteAddress, remotePort, state: tcpStateName(state), pid, processName });
  }
}

function decodeUdp(view: DataView, base: Buffer, family: 'ipv4' | 'ipv6', rowStride: number, resolveNames: NameResolution, cache: Map<number, string>, result: UdpEndpoint[]): void {
  const count = view.getUint32(0, true);
  for (let index = 0; index < count; index++) {
    const offset = 4 + index * rowStride;
    let localAddress: string;
    let localPort: number;
    let pid: number;
    if (family === 'ipv4') {
      localAddress = ipv4FromU32(view.getUint32(offset, true));
      localPort = portFromNetworkOrder(view.getUint32(offset + 4, true));
      pid = view.getUint32(offset + 8, true);
    } else {
      localAddress = ipv6FromBytes(base, offset);
      localPort = portFromNetworkOrder(view.getUint32(offset + 20, true));
      pid = view.getUint32(offset + 24, true);
    }
    // UDP has no owning-module table here → process names use the kernel32 image basename.
    let processName: string | undefined;
    if (resolveNames !== 'none') {
      processName = cache.get(pid);
      if (processName === undefined) {
        processName = resolveImageName(pid);
        cache.set(pid, processName);
      }
    }
    result.push({ family, localAddress, localPort, pid, processName });
  }
}

/** Socket→PID(+module) over GetExtendedTcpTable — one syscall, no netstat -ano parse. IPv4 + IPv6. */
export function tcpConnections(options: SocketOptions = {}): TcpConnection[] {
  const family = options.family ?? 'all';
  const resolveNames = options.resolveNames ?? 'none';
  const useModule = resolveNames === 'module';
  const tableClass = useModule ? TCP_TABLE_OWNER_MODULE_ALL : TCP_TABLE_OWNER_PID_ALL;
  const headerOffset = useModule ? 8 : 4; // OWNER_MODULE rows are 8-aligned (liCreateTimestamp) → table[] starts at +8, not +4
  const cache = new Map<number, string>();
  const result: TcpConnection[] = [];
  if (family === 'all' || family === 'ipv4') {
    const view = tcp4State.fill((dataPointer, sizePointer) => Iphlpapi.GetExtendedTcpTable(dataPointer, sizePointer, 0, AF_INET, tableClass, 0));
    decodeTcp(view, tcp4State.buffer, 'ipv4', useModule ? TCP4_MODULE_ROW : TCP4_PID_ROW, headerOffset, resolveNames, cache, result);
  }
  if (family === 'all' || family === 'ipv6') {
    const view = tcp6State.fill((dataPointer, sizePointer) => Iphlpapi.GetExtendedTcpTable(dataPointer, sizePointer, 0, AF_INET6, tableClass, 0));
    decodeTcp(view, tcp6State.buffer, 'ipv6', useModule ? TCP6_MODULE_ROW : TCP6_PID_ROW, headerOffset, resolveNames, cache, result);
  }
  return result;
}

/** UDP endpoints with owning PID over GetExtendedUdpTable. IPv4 + IPv6. */
export function udpListeners(options: SocketOptions = {}): UdpEndpoint[] {
  const family = options.family ?? 'all';
  const resolveNames = options.resolveNames ?? 'none';
  const cache = new Map<number, string>();
  const result: UdpEndpoint[] = [];
  if (family === 'all' || family === 'ipv4') {
    const view = udp4State.fill((dataPointer, sizePointer) => Iphlpapi.GetExtendedUdpTable(dataPointer, sizePointer, 0, AF_INET, UDP_TABLE_OWNER_PID, 0));
    decodeUdp(view, udp4State.buffer, 'ipv4', UDP4_ROW, resolveNames, cache, result);
  }
  if (family === 'all' || family === 'ipv6') {
    const view = udp6State.fill((dataPointer, sizePointer) => Iphlpapi.GetExtendedUdpTable(dataPointer, sizePointer, 0, AF_INET6, UDP_TABLE_OWNER_PID, 0));
    decodeUdp(view, udp6State.buffer, 'ipv6', UDP6_ROW, resolveNames, cache, result);
  }
  return result;
}
