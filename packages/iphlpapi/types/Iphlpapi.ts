import type { Pointer } from 'bun:ffi';

export type { BOOL, BOOLEAN, DWORD, HANDLE, LPCSTR, LPCWSTR, LPDWORD, LPSTR, LPVOID, LPWSTR, NULL, PBYTE, PDWORD, PHANDLE, PULONG, PVOID, SIZE_T, UINT, ULONG, USHORT, WORD } from '@bun-win32/core';

export enum AddressFamily {
  AF_INET = 0x0000_0002,
  AF_INET6 = 0x0000_0017,
  AF_UNSPEC = 0x0000_0000,
}

export enum MibIfEntryLevel {
  MibIfEntryNormal = 0x0000_0000,
  MibIfEntryNormalWithoutStatistics = 0x0000_0002,
}

export enum MibIfTableLevel {
  MibIfTableNormal = 0x0000_0000,
  MibIfTableNormalWithoutStatistics = 0x0000_0002,
  MibIfTableRaw = 0x0000_0001,
}

export enum TcpEStatsType {
  TcpConnectionEstatsBandwidth = 0x0000_0007,
  TcpConnectionEstatsData = 0x0000_0001,
  TcpConnectionEstatsFineRtt = 0x0000_0008,
  TcpConnectionEstatsMaximum = 0x0000_0009,
  TcpConnectionEstatsObsRec = 0x0000_0006,
  TcpConnectionEstatsPath = 0x0000_0003,
  TcpConnectionEstatsRec = 0x0000_0005,
  TcpConnectionEstatsSendBuff = 0x0000_0004,
  TcpConnectionEstatsSndCong = 0x0000_0002,
  TcpConnectionEstatsSynOpts = 0x0000_0000,
}

export enum TcpTableClass {
  TCP_TABLE_BASIC_ALL = 0x0000_0002,
  TCP_TABLE_BASIC_CONNECTIONS = 0x0000_0001,
  TCP_TABLE_BASIC_LISTENER = 0x0000_0000,
  TCP_TABLE_OWNER_MODULE_ALL = 0x0000_0008,
  TCP_TABLE_OWNER_MODULE_CONNECTIONS = 0x0000_0007,
  TCP_TABLE_OWNER_MODULE_LISTENER = 0x0000_0006,
  TCP_TABLE_OWNER_PID_ALL = 0x0000_0005,
  TCP_TABLE_OWNER_PID_CONNECTIONS = 0x0000_0004,
  TCP_TABLE_OWNER_PID_LISTENER = 0x0000_0003,
}

export enum TcpipOwnerModuleInfoClass {
  TCPIP_OWNER_MODULE_INFO_BASIC = 0x0000_0000,
}

export enum UdpTableClass {
  UDP_TABLE_BASIC = 0x0000_0000,
  UDP_TABLE_OWNER_MODULE = 0x0000_0002,
  UDP_TABLE_OWNER_PID = 0x0000_0001,
}

export type ADDRESS_FAMILY = number;
export type HIFTIMESTAMPCHANGE = bigint;
export type IPAddr = number;
export type IPMask = number;
export type IP_STATUS = number;
export type LPOVERLAPPED = Pointer;
export type MIB_IF_ENTRY_LEVEL = number;
export type MIB_IF_TABLE_LEVEL = number;
export type NET_IFINDEX = number;
export type NET_IF_COMPARTMENT_ID = number;
export type PFIXED_INFO = Pointer;
export type PINTERFACE_HARDWARE_CROSSTIMESTAMP = Pointer;
export type PINTERFACE_TIMESTAMP_CAPABILITIES = Pointer;
export type PINTERFACE_TIMESTAMP_CONFIG_CHANGE_CALLBACK = Pointer;
export type PIO_APC_ROUTINE = Pointer;
export type PIPFORWARD_CHANGE_CALLBACK = Pointer;
export type PIPINTERFACE_CHANGE_CALLBACK = Pointer;
export type PIP_ADAPTER_ADDRESSES = Pointer;
export type PIP_ADAPTER_INDEX_MAP = Pointer;
export type PIP_ADAPTER_INFO = Pointer;
export type PIP_INTERFACE_INFO = Pointer;
export type PIP_OPTION_INFORMATION = Pointer;
export type PIP_PER_ADAPTER_INFO = Pointer;
export type PIP_UNIDIRECTIONAL_ADAPTER_ADDRESS = Pointer;
export type PMIB_ANYCASTIPADDRESS_ROW = Pointer;
export type PMIB_ICMP = Pointer;
export type PMIB_ICMP_EX = Pointer;
export type PMIB_IFROW = Pointer;
export type PMIB_IFTABLE = Pointer;
export type PMIB_IF_ROW2 = Pointer;
export type PMIB_IPADDRTABLE = Pointer;
export type PMIB_IPFORWARDROW = Pointer;
export type PMIB_IPFORWARDTABLE = Pointer;
export type PMIB_IPFORWARD_ROW2 = Pointer;
export type PMIB_IPINTERFACE_ROW = Pointer;
export type PMIB_IPNETROW = Pointer;
export type PMIB_IPNETTABLE = Pointer;
export type PMIB_IPNET_ROW2 = Pointer;
export type PMIB_IPPATH_ROW = Pointer;
export type PMIB_IPSTATS = Pointer;
export type PMIB_IP_NETWORK_CONNECTION_BANDWIDTH_ESTIMATES = Pointer;
export type PMIB_MULTICASTIPADDRESS_ROW = Pointer;
export type PMIB_TCP6ROW = Pointer;
export type PMIB_TCP6ROW_OWNER_MODULE = Pointer;
export type PMIB_TCP6TABLE = Pointer;
export type PMIB_TCP6TABLE2 = Pointer;
export type PMIB_TCPROW = Pointer;
export type PMIB_TCPROW_OWNER_MODULE = Pointer;
export type PMIB_TCPSTATS = Pointer;
export type PMIB_TCPSTATS2 = Pointer;
export type PMIB_TCPTABLE = Pointer;
export type PMIB_TCPTABLE2 = Pointer;
export type PMIB_UDP6ROW_OWNER_MODULE = Pointer;
export type PMIB_UDP6TABLE = Pointer;
export type PMIB_UDPROW_OWNER_MODULE = Pointer;
export type PMIB_UDPSTATS = Pointer;
export type PMIB_UDPSTATS2 = Pointer;
export type PMIB_UDPTABLE = Pointer;
export type PMIB_UNICASTIPADDRESS_ROW = Pointer;
export type PNETWORK_CONNECTIVITY_HINT_CHANGE_CALLBACK = Pointer;
export type PNET_ADDRESS_INFO = Pointer;
export type PNET_LUID = Pointer;
export type PNL_NETWORK_CONNECTIVITY_HINT = Pointer;
export type PSOCKADDR = Pointer;
export type PSOCKADDR_IN6 = Pointer;
export type PSOCKADDR_INET = Pointer;
export type PSTABLE_UNICAST_IPADDRESS_TABLE_CALLBACK = Pointer;
export type PTEREDO_PORT_CHANGE_CALLBACK = Pointer;
export type PUCHAR = Pointer;
export type PUINT8 = Pointer;
export type PULONG64 = Pointer;
export type PUNICAST_IPADDRESS_CHANGE_CALLBACK = Pointer;
export type PUSHORT = Pointer;
export type TCPIP_OWNER_MODULE_INFO_CLASS = number;
export type TCP_ESTATS_TYPE = number;
export type TCP_TABLE_CLASS = number;
export type UDP_TABLE_CLASS = number;
