import { decodeSockaddr, macFromBytes } from './addr';
import { addressFamilyValue, type AddressFamilyName } from './constants';
import { Iphlpapi, readAnsiAt, readWideAt, SizedBufferState, walkList } from './win32';

// IP_ADAPTER_ADDRESSES_LH (x64) field offsets — verified vs iptypes.h + ipconfig /all (S3.3).
const NODE_IF_INDEX = 4;
const NODE_NEXT = 8;
const NODE_ADAPTER_NAME = 16; // PCHAR (ANSI GUID)
const NODE_FIRST_UNICAST = 24;
const NODE_FIRST_DNS_SERVER = 48;
const NODE_DNS_SUFFIX = 56; // PWCHAR
const NODE_DESCRIPTION = 64; // PWCHAR
const NODE_FRIENDLY_NAME = 72; // PWCHAR
const NODE_PHYSICAL_ADDRESS = 80;
const NODE_PHYSICAL_ADDRESS_LENGTH = 88;
const NODE_MTU = 96;
const NODE_IF_TYPE = 100;
const NODE_OPER_STATUS = 104;
const NODE_TRANSMIT_LINK_SPEED = 184; // ULONG64 bits/sec
const NODE_FIRST_GATEWAY = 208;

// Sub-list node (IP_ADAPTER_{UNICAST,GATEWAY,DNS_SERVER}_ADDRESS) shared shape.
const SUB_NEXT = 8;
const SUB_SOCKET_ADDRESS_POINTER = 16; // SOCKET_ADDRESS.lpSockaddr

const GAA_FLAG_INCLUDE_GATEWAYS = 0x0000_0080;
const GAA_FLAG_SKIP_ANYCAST = 0x0000_0002;
const GAA_FLAG_SKIP_MULTICAST = 0x0000_0004;
const LINK_SPEED_UNKNOWN = 0xffff_ffff_ffff_ffffn;

const OPER_STATUS_NAMES: ReadonlyMap<number, string> = new Map([
  [1, 'up'],
  [2, 'down'],
  [3, 'testing'],
  [4, 'unknown'],
  [5, 'dormant'],
  [6, 'not-present'],
  [7, 'lower-layer-down'],
]);

export interface Adapter {
  index: number;
  name: string;
  friendlyName: string;
  description: string;
  mac: string;
  type: number;
  operStatus: string;
  linkSpeedMbps: number;
  mtu: number;
  ipv4: string[];
  ipv6: string[];
  gateways: string[];
  dnsServers: string[];
  dnsSuffix: string;
}

const adapterState = new SizedBufferState(0x0000_8000);

function pointerToOffset(base: Buffer, baseAddress: number, fieldOffset: number): number {
  const pointer = Number(base.readBigUInt64LE(fieldOffset));
  return pointer === 0 ? -1 : pointer - baseAddress;
}

function collectUnicast(base: Buffer, baseAddress: number, headFieldOffset: number, ipv4: string[], ipv6: string[]): void {
  const head = Number(base.readBigUInt64LE(headFieldOffset));
  for (const node of walkList(base, head, SUB_NEXT)) {
    const sockaddrPointer = Number(base.readBigUInt64LE(node + SUB_SOCKET_ADDRESS_POINTER));
    if (sockaddrPointer === 0) continue;
    const address = decodeSockaddr(base, sockaddrPointer - baseAddress);
    if (address.family === 'ipv4') ipv4.push(address.address);
    else if (address.family === 'ipv6') ipv6.push(address.address);
  }
}

function collectAddresses(base: Buffer, baseAddress: number, headFieldOffset: number, out: string[]): void {
  const head = Number(base.readBigUInt64LE(headFieldOffset));
  for (const node of walkList(base, head, SUB_NEXT)) {
    const sockaddrPointer = Number(base.readBigUInt64LE(node + SUB_SOCKET_ADDRESS_POINTER));
    if (sockaddrPointer === 0) continue;
    out.push(decodeSockaddr(base, sockaddrPointer - baseAddress).address);
  }
}

/** Typed adapter inventory (IPv4 + IPv6) over GetAdaptersAddresses — the modern replacement for GetAdaptersInfo. */
export function adapters(family: AddressFamilyName = 'all'): Adapter[] {
  const familyValue = addressFamilyValue(family);
  const flags = GAA_FLAG_INCLUDE_GATEWAYS | GAA_FLAG_SKIP_ANYCAST | GAA_FLAG_SKIP_MULTICAST;
  const view = adapterState.fill((dataPointer, sizePointer) => Iphlpapi.GetAdaptersAddresses(familyValue, flags, null, dataPointer, sizePointer));
  const base = adapterState.buffer;
  const baseAddress = Number(base.ptr);
  const result: Adapter[] = [];

  for (const node of walkList(base, baseAddress, NODE_NEXT)) {
    const physicalLength = view.getUint32(node + NODE_PHYSICAL_ADDRESS_LENGTH, true);
    const linkSpeed = base.readBigUInt64LE(node + NODE_TRANSMIT_LINK_SPEED);
    const ipv4: string[] = [];
    const ipv6: string[] = [];
    const gateways: string[] = [];
    const dnsServers: string[] = [];
    collectUnicast(base, baseAddress, node + NODE_FIRST_UNICAST, ipv4, ipv6);
    collectAddresses(base, baseAddress, node + NODE_FIRST_GATEWAY, gateways);
    collectAddresses(base, baseAddress, node + NODE_FIRST_DNS_SERVER, dnsServers);

    result.push({
      index: view.getUint32(node + NODE_IF_INDEX, true),
      name: readAnsiAt(base, pointerToOffset(base, baseAddress, node + NODE_ADAPTER_NAME)),
      friendlyName: readWideAt(base, pointerToOffset(base, baseAddress, node + NODE_FRIENDLY_NAME)),
      description: readWideAt(base, pointerToOffset(base, baseAddress, node + NODE_DESCRIPTION)),
      mac: macFromBytes(base, node + NODE_PHYSICAL_ADDRESS, physicalLength),
      type: view.getUint32(node + NODE_IF_TYPE, true),
      operStatus: OPER_STATUS_NAMES.get(view.getInt32(node + NODE_OPER_STATUS, true)) ?? 'unknown',
      linkSpeedMbps: linkSpeed === LINK_SPEED_UNKNOWN ? 0 : Number(linkSpeed / 1_000_000n),
      mtu: view.getUint32(node + NODE_MTU, true),
      ipv4,
      ipv6,
      gateways,
      dnsServers,
      dnsSuffix: readWideAt(base, pointerToOffset(base, baseAddress, node + NODE_DNS_SUFFIX)),
    });
  }
  return result;
}
