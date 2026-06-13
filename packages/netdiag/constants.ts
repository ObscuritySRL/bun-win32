export { DnsType } from '@bun-win32/dnsapi';

export type AddressFamilyName = 'all' | 'ipv4' | 'ipv6';

const ADDRESS_FAMILY_VALUES: Record<AddressFamilyName, number> = {
  all: 0x0000_0000, // AF_UNSPEC
  ipv4: 0x0000_0002, // AF_INET
  ipv6: 0x0000_0017, // AF_INET6
};

export const AF_INET = 0x0000_0002;
export const AF_INET6 = 0x0000_0017;

export function addressFamilyValue(family: AddressFamilyName): number {
  return ADDRESS_FAMILY_VALUES[family];
}

// GetExtendedTcpTable / GetExtendedUdpTable table-class selectors (TCP_TABLE_CLASS / UDP_TABLE_CLASS).
export const TCP_TABLE_OWNER_MODULE_ALL = 0x0000_0008;
export const TCP_TABLE_OWNER_PID_ALL = 0x0000_0005;
export const TCPIP_OWNER_MODULE_INFO_BASIC = 0x0000_0000;
export const UDP_TABLE_OWNER_PID = 0x0000_0001;

// MIB_TCP_STATE (1..12).
const TCP_STATE_NAMES: ReadonlyMap<number, string> = new Map([
  [1, 'closed'],
  [2, 'listen'],
  [3, 'syn-sent'],
  [4, 'syn-received'],
  [5, 'established'],
  [6, 'fin-wait-1'],
  [7, 'fin-wait-2'],
  [8, 'close-wait'],
  [9, 'closing'],
  [10, 'last-ack'],
  [11, 'time-wait'],
  [12, 'delete-tcb'],
]);

export function tcpStateName(state: number): string {
  return TCP_STATE_NAMES.get(state) ?? `unknown(${state})`;
}

// ICMP reply status codes (ipexport.h IP_STATUS).
export const ICMP_SUCCESS = 0x0000_0000;
export const ICMP_PACKET_TOO_BIG = 11009;
export const ICMP_REQUEST_TIMED_OUT = 11010;
export const ICMP_TTL_EXPIRED_TRANSIT = 11013;

const ICMP_STATUS_NAMES: ReadonlyMap<number, string> = new Map([
  [0, 'success'],
  [11001, 'buffer too small'],
  [11002, 'destination network unreachable'],
  [11003, 'destination host unreachable'],
  [11004, 'destination protocol unreachable'],
  [11005, 'destination port unreachable'],
  [11006, 'no resources'],
  [11007, 'bad option'],
  [11008, 'hardware error'],
  [11009, 'packet too big'],
  [11010, 'request timed out'],
  [11011, 'bad request'],
  [11012, 'bad route'],
  [11013, 'TTL expired in transit'],
  [11014, 'TTL expired during reassembly'],
  [11015, 'parameter problem'],
  [11016, 'source quench'],
  [11017, 'option too big'],
  [11018, 'bad destination'],
  [11050, 'general failure'],
]);

export function icmpStatusName(status: number): string {
  return ICMP_STATUS_NAMES.get(status) ?? `unknown(${status})`;
}
