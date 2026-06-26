import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  ADDRESS_FAMILY,
  BOOL,
  BOOLEAN,
  DWORD,
  HANDLE,
  HIFTIMESTAMPCHANGE,
  IPAddr,
  IPMask,
  IP_STATUS,
  LPCSTR,
  LPCWSTR,
  LPDWORD,
  LPOVERLAPPED,
  LPSTR,
  LPVOID,
  LPWSTR,
  MIB_IF_ENTRY_LEVEL,
  MIB_IF_TABLE_LEVEL,
  NET_IFINDEX,
  NET_IF_COMPARTMENT_ID,
  NULL,
  NULLABLE,
  OPTIONAL,
  PBYTE,
  PDWORD,
  PFIXED_INFO,
  PHANDLE,
  PINTERFACE_HARDWARE_CROSSTIMESTAMP,
  PINTERFACE_TIMESTAMP_CAPABILITIES,
  PINTERFACE_TIMESTAMP_CONFIG_CHANGE_CALLBACK,
  PIO_APC_ROUTINE,
  PIPFORWARD_CHANGE_CALLBACK,
  PIPINTERFACE_CHANGE_CALLBACK,
  PIP_ADAPTER_ADDRESSES,
  PIP_ADAPTER_INDEX_MAP,
  PIP_ADAPTER_INFO,
  PIP_INTERFACE_INFO,
  PIP_OPTION_INFORMATION,
  PIP_PER_ADAPTER_INFO,
  PIP_UNIDIRECTIONAL_ADAPTER_ADDRESS,
  PMIB_ANYCASTIPADDRESS_ROW,
  PMIB_ICMP,
  PMIB_ICMP_EX,
  PMIB_IFROW,
  PMIB_IFTABLE,
  PMIB_IF_ROW2,
  PMIB_IPADDRTABLE,
  PMIB_IPFORWARDROW,
  PMIB_IPFORWARDTABLE,
  PMIB_IPFORWARD_ROW2,
  PMIB_IPINTERFACE_ROW,
  PMIB_IPNETROW,
  PMIB_IPNETTABLE,
  PMIB_IPNET_ROW2,
  PMIB_IPPATH_ROW,
  PMIB_IPSTATS,
  PMIB_IP_NETWORK_CONNECTION_BANDWIDTH_ESTIMATES,
  PMIB_MULTICASTIPADDRESS_ROW,
  PMIB_TCP6ROW,
  PMIB_TCP6ROW_OWNER_MODULE,
  PMIB_TCP6TABLE,
  PMIB_TCP6TABLE2,
  PMIB_TCPROW,
  PMIB_TCPROW_OWNER_MODULE,
  PMIB_TCPSTATS,
  PMIB_TCPSTATS2,
  PMIB_TCPTABLE,
  PMIB_TCPTABLE2,
  PMIB_UDP6ROW_OWNER_MODULE,
  PMIB_UDP6TABLE,
  PMIB_UDPROW_OWNER_MODULE,
  PMIB_UDPSTATS,
  PMIB_UDPSTATS2,
  PMIB_UDPTABLE,
  PMIB_UNICASTIPADDRESS_ROW,
  PNETWORK_CONNECTIVITY_HINT_CHANGE_CALLBACK,
  PNET_ADDRESS_INFO,
  PNET_LUID,
  PNL_NETWORK_CONNECTIVITY_HINT,
  PSOCKADDR,
  PSOCKADDR_IN6,
  PSOCKADDR_INET,
  PSTABLE_UNICAST_IPADDRESS_TABLE_CALLBACK,
  PTEREDO_PORT_CHANGE_CALLBACK,
  PUCHAR,
  PUINT8,
  PULONG,
  PULONG64,
  PUNICAST_IPADDRESS_CHANGE_CALLBACK,
  PUSHORT,
  PVOID,
  SIZE_T,
  TCPIP_OWNER_MODULE_INFO_CLASS,
  TCP_ESTATS_TYPE,
  TCP_TABLE_CLASS,
  UDP_TABLE_CLASS,
  UINT,
  ULONG,
  USHORT,
  WORD,
} from '../types/Iphlpapi';

/**
 * Thin, lazy-loaded FFI bindings for `iphlpapi.dll`.
 *
 * Each static method corresponds one-to-one with a Win32 export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * @example
 * ```ts
 * import Iphlpapi from './structs/Iphlpapi';
 *
 * // Lazy: bind on first call
 * const result = Iphlpapi.GetAdaptersAddresses(0, 0, null, buffer.ptr, sizePtr.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Iphlpapi.Preload(['GetAdaptersAddresses', 'GetIfTable2']);
 * ```
 */
class Iphlpapi extends Win32 {
  protected static override name = 'iphlpapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    AddIPAddress: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CancelIPChangeNotify: { args: [FFIType.ptr], returns: FFIType.i32 },
    CancelMibChangeNotify2: { args: [FFIType.u64], returns: FFIType.u32 },
    CaptureInterfaceHardwareCrossTimestamp: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ConvertInterfaceAliasToLuid: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ConvertInterfaceGuidToLuid: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ConvertInterfaceIndexToLuid: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ConvertInterfaceLuidToAlias: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.u32 },
    ConvertInterfaceLuidToGuid: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ConvertInterfaceLuidToIndex: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ConvertInterfaceLuidToNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.u32 },
    ConvertInterfaceLuidToNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.u32 },
    ConvertInterfaceNameToLuidA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ConvertInterfaceNameToLuidW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ConvertIpv4MaskToLength: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ConvertLengthToIpv4Mask: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    CreateAnycastIpAddressEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    CreateIpForwardEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    CreateIpForwardEntry2: { args: [FFIType.ptr], returns: FFIType.u32 },
    CreateIpNetEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    CreateIpNetEntry2: { args: [FFIType.ptr], returns: FFIType.u32 },
    CreatePersistentTcpPortReservation: { args: [FFIType.u16, FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    CreatePersistentUdpPortReservation: { args: [FFIType.u16, FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    CreateProxyArpEntry: { args: [FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CreateSortedAddressPairs: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CreateUnicastIpAddressEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    DeleteAnycastIpAddressEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    DeleteIPAddress: { args: [FFIType.u32], returns: FFIType.u32 },
    DeleteIpForwardEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    DeleteIpForwardEntry2: { args: [FFIType.ptr], returns: FFIType.u32 },
    DeleteIpNetEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    DeleteIpNetEntry2: { args: [FFIType.ptr], returns: FFIType.u32 },
    DeletePersistentTcpPortReservation: { args: [FFIType.u16, FFIType.u16], returns: FFIType.u32 },
    DeletePersistentUdpPortReservation: { args: [FFIType.u16, FFIType.u16], returns: FFIType.u32 },
    DeleteProxyArpEntry: { args: [FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    DeleteUnicastIpAddressEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    DisableMediaSense: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    EnableRouter: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FlushIpNetTable: { args: [FFIType.u32], returns: FFIType.u32 },
    FlushIpNetTable2: { args: [FFIType.u16, FFIType.u32], returns: FFIType.u32 },
    FlushIpPathTable: { args: [FFIType.u16], returns: FFIType.u32 },
    FreeMibTable: { args: [FFIType.ptr], returns: FFIType.void },
    GetAdapterIndex: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetAdaptersAddresses: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetAdaptersInfo: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetAnycastIpAddressEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetAnycastIpAddressTable: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    GetBestInterface: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetBestInterfaceEx: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetBestRoute: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetBestRoute2: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetCurrentThreadCompartmentId: { args: [], returns: FFIType.u32 },
    GetExtendedTcpTable: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    GetExtendedUdpTable: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    GetFriendlyIfIndex: { args: [FFIType.u32], returns: FFIType.u32 },
    GetIcmpStatistics: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetIcmpStatisticsEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetIfEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetIfEntry2: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetIfEntry2Ex: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetIfStackTable: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetIfTable: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetIfTable2: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetIfTable2Ex: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetInterfaceActiveTimestampCapabilities: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetInterfaceCurrentTimestampCapabilities: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetInterfaceHardwareTimestampCapabilities: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetInterfaceInfo: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetInterfaceSupportedTimestampCapabilities: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetInvertedIfStackTable: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetIpAddrTable: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetIpErrorString: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetIpForwardEntry2: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetIpForwardTable: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetIpForwardTable2: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    GetIpInterfaceEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetIpInterfaceTable: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    GetIpNetEntry2: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetIpNetTable: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetIpNetTable2: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    GetIpNetworkConnectionBandwidthEstimates: { args: [FFIType.u32, FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    GetIpPathEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetIpPathTable: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    GetIpStatistics: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetIpStatisticsEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetMulticastIpAddressEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetMulticastIpAddressTable: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    GetNetworkConnectivityHint: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetNetworkConnectivityHintForInterface: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetNetworkInformation: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetNetworkParams: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetNumberOfInterfaces: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetOwnerModuleFromTcp6Entry: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetOwnerModuleFromTcpEntry: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetOwnerModuleFromUdp6Entry: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetOwnerModuleFromUdpEntry: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetPerAdapterInfo: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetPerTcp6ConnectionEStats: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    GetPerTcpConnectionEStats: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    GetRTTAndHopCount: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetSessionCompartmentId: { args: [FFIType.u32], returns: FFIType.u32 },
    GetTcp6Table: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetTcp6Table2: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetTcpStatistics: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetTcpStatisticsEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetTcpStatisticsEx2: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetTcpTable: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetTcpTable2: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetTeredoPort: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetUdp6Table: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetUdpStatistics: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetUdpStatisticsEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetUdpStatisticsEx2: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetUdpTable: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetUniDirectionalAdapterInfo: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetUnicastIpAddressEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetUnicastIpAddressTable: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    Icmp6CreateFile: { args: [], returns: FFIType.u64 },
    Icmp6ParseReplies: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    Icmp6SendEcho2: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    IcmpCloseHandle: { args: [FFIType.u64], returns: FFIType.i32 },
    IcmpCreateFile: { args: [], returns: FFIType.u64 },
    IcmpParseReplies: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    IcmpSendEcho: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    IcmpSendEcho2: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    IcmpSendEcho2Ex: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    InitializeIpForwardEntry: { args: [FFIType.ptr], returns: FFIType.void },
    InitializeIpInterfaceEntry: { args: [FFIType.ptr], returns: FFIType.void },
    InitializeUnicastIpAddressEntry: { args: [FFIType.ptr], returns: FFIType.void },
    IpReleaseAddress: { args: [FFIType.ptr], returns: FFIType.u32 },
    IpRenewAddress: { args: [FFIType.ptr], returns: FFIType.u32 },
    LookupPersistentTcpPortReservation: { args: [FFIType.u16, FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    LookupPersistentUdpPortReservation: { args: [FFIType.u16, FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    NotifyAddrChange: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NotifyIpInterfaceChange: { args: [FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u8, FFIType.ptr], returns: FFIType.u32 },
    NotifyNetworkConnectivityHintChange: { args: [FFIType.ptr, FFIType.ptr, FFIType.u8, FFIType.ptr], returns: FFIType.u32 },
    NotifyRouteChange: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NotifyRouteChange2: { args: [FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u8, FFIType.ptr], returns: FFIType.u32 },
    NotifyStableUnicastIpAddressTable: { args: [FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NotifyTeredoPortChange: { args: [FFIType.ptr, FFIType.ptr, FFIType.u8, FFIType.ptr], returns: FFIType.u32 },
    NotifyUnicastIpAddressChange: { args: [FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u8, FFIType.ptr], returns: FFIType.u32 },
    ParseNetworkString: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RegisterInterfaceTimestampConfigChange: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ResolveIpNetEntry2: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RestoreMediaSense: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SendARP: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetCurrentThreadCompartmentId: { args: [FFIType.u32], returns: FFIType.u32 },
    SetIfEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    SetIpForwardEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    SetIpForwardEntry2: { args: [FFIType.ptr], returns: FFIType.u32 },
    SetIpInterfaceEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    SetIpNetEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    SetIpNetEntry2: { args: [FFIType.ptr], returns: FFIType.u32 },
    SetIpStatistics: { args: [FFIType.ptr], returns: FFIType.u32 },
    SetIpStatisticsEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    SetIpTTL: { args: [FFIType.u32], returns: FFIType.u32 },
    SetNetworkInformation: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    SetPerTcp6ConnectionEStats: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    SetPerTcpConnectionEStats: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    SetSessionCompartmentId: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    SetTcpEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    SetUnicastIpAddressEntry: { args: [FFIType.ptr], returns: FFIType.u32 },
    UnenableRouter: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    UnregisterInterfaceTimestampConfigChange: { args: [FFIType.u64], returns: FFIType.void },
    if_indextoname: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    if_nametoindex: { args: [FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-addipaddress
  public static AddIPAddress(Address: IPAddr, IpMask: IPMask, IfIndex: DWORD, NTEContext_out: PULONG, NTEInstance_out: PULONG): DWORD {
    return Iphlpapi.Load('AddIPAddress')(Address, IpMask, IfIndex, NTEContext_out, NTEInstance_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-cancelipchangenotify
  public static CancelIPChangeNotify(notifyOverlapped: LPOVERLAPPED): BOOL {
    return Iphlpapi.Load('CancelIPChangeNotify')(notifyOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-cancelmibchangenotify2
  public static CancelMibChangeNotify2(NotificationHandle: HANDLE): DWORD {
    return Iphlpapi.Load('CancelMibChangeNotify2')(NotificationHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-captureinterfacehardwarecrosstimestamp
  public static CaptureInterfaceHardwareCrossTimestamp(InterfaceLuid: PNET_LUID, CrossTimestamp_in_out: PINTERFACE_HARDWARE_CROSSTIMESTAMP): DWORD {
    return Iphlpapi.Load('CaptureInterfaceHardwareCrossTimestamp')(InterfaceLuid, CrossTimestamp_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-convertinterfacealiastoluid
  public static ConvertInterfaceAliasToLuid(InterfaceAlias: LPCWSTR, InterfaceLuid_out: PNET_LUID): DWORD {
    return Iphlpapi.Load('ConvertInterfaceAliasToLuid')(InterfaceAlias, InterfaceLuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-convertinterfaceguidtoluid
  public static ConvertInterfaceGuidToLuid(InterfaceGuid: PVOID, InterfaceLuid_out: PNET_LUID): DWORD {
    return Iphlpapi.Load('ConvertInterfaceGuidToLuid')(InterfaceGuid, InterfaceLuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-convertinterfaceindextoluid
  public static ConvertInterfaceIndexToLuid(InterfaceIndex: NET_IFINDEX, InterfaceLuid_out: PNET_LUID): DWORD {
    return Iphlpapi.Load('ConvertInterfaceIndexToLuid')(InterfaceIndex, InterfaceLuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-convertinterfaceluidtoalias
  public static ConvertInterfaceLuidToAlias(InterfaceLuid: PNET_LUID, InterfaceAlias_out: LPWSTR, Length: SIZE_T): DWORD {
    return Iphlpapi.Load('ConvertInterfaceLuidToAlias')(InterfaceLuid, InterfaceAlias_out, Length);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-convertinterfaceluidtoguid
  public static ConvertInterfaceLuidToGuid(InterfaceLuid: PNET_LUID, InterfaceGuid_out: PVOID): DWORD {
    return Iphlpapi.Load('ConvertInterfaceLuidToGuid')(InterfaceLuid, InterfaceGuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-convertinterfaceluidtoindex
  public static ConvertInterfaceLuidToIndex(InterfaceLuid: PNET_LUID, InterfaceIndex_out: PULONG): DWORD {
    return Iphlpapi.Load('ConvertInterfaceLuidToIndex')(InterfaceLuid, InterfaceIndex_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-convertinterfaceluidtonamea
  public static ConvertInterfaceLuidToNameA(InterfaceLuid: PNET_LUID, InterfaceName_out: LPSTR, Length: SIZE_T): DWORD {
    return Iphlpapi.Load('ConvertInterfaceLuidToNameA')(InterfaceLuid, InterfaceName_out, Length);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-convertinterfaceluidtonamew
  public static ConvertInterfaceLuidToNameW(InterfaceLuid: PNET_LUID, InterfaceName_out: LPWSTR, Length: SIZE_T): DWORD {
    return Iphlpapi.Load('ConvertInterfaceLuidToNameW')(InterfaceLuid, InterfaceName_out, Length);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-convertinterfacenametoluida
  public static ConvertInterfaceNameToLuidA(InterfaceName: LPCSTR, InterfaceLuid_out: PNET_LUID): DWORD {
    return Iphlpapi.Load('ConvertInterfaceNameToLuidA')(InterfaceName, InterfaceLuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-convertinterfacenametoluidw
  public static ConvertInterfaceNameToLuidW(InterfaceName: LPCWSTR, InterfaceLuid_out: PNET_LUID): DWORD {
    return Iphlpapi.Load('ConvertInterfaceNameToLuidW')(InterfaceName, InterfaceLuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-convertipv4masktolength
  public static ConvertIpv4MaskToLength(Mask: ULONG, MaskLength_out: PUINT8): DWORD {
    return Iphlpapi.Load('ConvertIpv4MaskToLength')(Mask, MaskLength_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-convertlengthtoipv4mask
  public static ConvertLengthToIpv4Mask(MaskLength: ULONG, Mask_out: PULONG): DWORD {
    return Iphlpapi.Load('ConvertLengthToIpv4Mask')(MaskLength, Mask_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-createanycastipaddressentry
  public static CreateAnycastIpAddressEntry(Row: PMIB_ANYCASTIPADDRESS_ROW): DWORD {
    return Iphlpapi.Load('CreateAnycastIpAddressEntry')(Row);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-createipforwardentry
  public static CreateIpForwardEntry(pRoute: PMIB_IPFORWARDROW): DWORD {
    return Iphlpapi.Load('CreateIpForwardEntry')(pRoute);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-createipforwardentry2
  public static CreateIpForwardEntry2(Row: PMIB_IPFORWARD_ROW2): DWORD {
    return Iphlpapi.Load('CreateIpForwardEntry2')(Row);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-createipnetentry
  public static CreateIpNetEntry(pArpEntry: PMIB_IPNETROW): DWORD {
    return Iphlpapi.Load('CreateIpNetEntry')(pArpEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-createipnetentry2
  public static CreateIpNetEntry2(Row: PMIB_IPNET_ROW2): DWORD {
    return Iphlpapi.Load('CreateIpNetEntry2')(Row);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-createpersistenttcpportreservation
  public static CreatePersistentTcpPortReservation(StartPort: USHORT, NumberOfPorts: USHORT, Token_out: PULONG64): ULONG {
    return Iphlpapi.Load('CreatePersistentTcpPortReservation')(StartPort, NumberOfPorts, Token_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-createpersistentudpportreservation
  public static CreatePersistentUdpPortReservation(StartPort: USHORT, NumberOfPorts: USHORT, Token_out: PULONG64): ULONG {
    return Iphlpapi.Load('CreatePersistentUdpPortReservation')(StartPort, NumberOfPorts, Token_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-createproxyarpentry
  public static CreateProxyArpEntry(dwAddress: DWORD, dwMask: DWORD, dwIfIndex: DWORD): DWORD {
    return Iphlpapi.Load('CreateProxyArpEntry')(dwAddress, dwMask, dwIfIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-createsortedaddresspairs
  public static CreateSortedAddressPairs(
    SourceAddressList: OPTIONAL<PSOCKADDR_IN6>,
    SourceAddressCount: ULONG,
    DestinationAddressList: PSOCKADDR_IN6,
    DestinationAddressCount: ULONG,
    AddressSortOptions: ULONG,
    SortedAddressPairList_out: PVOID,
    SortedAddressPairCount_out: PULONG,
  ): DWORD {
    return Iphlpapi.Load('CreateSortedAddressPairs')(SourceAddressList, SourceAddressCount, DestinationAddressList, DestinationAddressCount, AddressSortOptions, SortedAddressPairList_out, SortedAddressPairCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-createunicastipaddressentry
  public static CreateUnicastIpAddressEntry(Row: PMIB_UNICASTIPADDRESS_ROW): DWORD {
    return Iphlpapi.Load('CreateUnicastIpAddressEntry')(Row);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-deleteanycastipaddressentry
  public static DeleteAnycastIpAddressEntry(Row: PMIB_ANYCASTIPADDRESS_ROW): DWORD {
    return Iphlpapi.Load('DeleteAnycastIpAddressEntry')(Row);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-deleteipaddress
  public static DeleteIPAddress(NTEContext: ULONG): DWORD {
    return Iphlpapi.Load('DeleteIPAddress')(NTEContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-deleteipforwardentry
  public static DeleteIpForwardEntry(pRoute: PMIB_IPFORWARDROW): DWORD {
    return Iphlpapi.Load('DeleteIpForwardEntry')(pRoute);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-deleteipforwardentry2
  public static DeleteIpForwardEntry2(Row: PMIB_IPFORWARD_ROW2): DWORD {
    return Iphlpapi.Load('DeleteIpForwardEntry2')(Row);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-deleteipnetentry
  public static DeleteIpNetEntry(pArpEntry: PMIB_IPNETROW): DWORD {
    return Iphlpapi.Load('DeleteIpNetEntry')(pArpEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-deleteipnetentry2
  public static DeleteIpNetEntry2(Row: PMIB_IPNET_ROW2): DWORD {
    return Iphlpapi.Load('DeleteIpNetEntry2')(Row);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-deletepersistenttcpportreservation
  public static DeletePersistentTcpPortReservation(StartPort: USHORT, NumberOfPorts: USHORT): ULONG {
    return Iphlpapi.Load('DeletePersistentTcpPortReservation')(StartPort, NumberOfPorts);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-deletepersistentudpportreservation
  public static DeletePersistentUdpPortReservation(StartPort: USHORT, NumberOfPorts: USHORT): ULONG {
    return Iphlpapi.Load('DeletePersistentUdpPortReservation')(StartPort, NumberOfPorts);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-deleteproxyarpentry
  public static DeleteProxyArpEntry(dwAddress: DWORD, dwMask: DWORD, dwIfIndex: DWORD): DWORD {
    return Iphlpapi.Load('DeleteProxyArpEntry')(dwAddress, dwMask, dwIfIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-deleteunicastipaddressentry
  public static DeleteUnicastIpAddressEntry(Row: PMIB_UNICASTIPADDRESS_ROW): DWORD {
    return Iphlpapi.Load('DeleteUnicastIpAddressEntry')(Row);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-disablemediasense
  public static DisableMediaSense(pHandle_out: NULLABLE<PHANDLE>, pOverLapped: NULLABLE<LPOVERLAPPED>): DWORD {
    return Iphlpapi.Load('DisableMediaSense')(pHandle_out, pOverLapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-enablerouter
  public static EnableRouter(pHandle_out: PHANDLE, pOverlapped_out: LPOVERLAPPED): DWORD {
    return Iphlpapi.Load('EnableRouter')(pHandle_out, pOverlapped_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-flushipnettable
  public static FlushIpNetTable(dwIfIndex: DWORD): DWORD {
    return Iphlpapi.Load('FlushIpNetTable')(dwIfIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-flushipnettable2
  public static FlushIpNetTable2(Family: ADDRESS_FAMILY, InterfaceIndex: NET_IFINDEX): DWORD {
    return Iphlpapi.Load('FlushIpNetTable2')(Family, InterfaceIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-flushippathtable
  public static FlushIpPathTable(Family: ADDRESS_FAMILY): DWORD {
    return Iphlpapi.Load('FlushIpPathTable')(Family);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-freemibtable
  public static FreeMibTable(Memory: PVOID): void {
    return Iphlpapi.Load('FreeMibTable')(Memory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getadapterindex
  public static GetAdapterIndex(AdapterName: LPWSTR, IfIndex_in_out: PULONG): DWORD {
    return Iphlpapi.Load('GetAdapterIndex')(AdapterName, IfIndex_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getadaptersaddresses
  public static GetAdaptersAddresses(Family: ULONG, Flags: ULONG, Reserved: OPTIONAL<PVOID>, AdapterAddresses_out: OPTIONAL<PIP_ADAPTER_ADDRESSES>, SizePointer_in_out: PULONG): ULONG {
    return Iphlpapi.Load('GetAdaptersAddresses')(Family, Flags, Reserved, AdapterAddresses_out, SizePointer_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getadaptersinfo
  public static GetAdaptersInfo(AdapterInfo_out: OPTIONAL<PIP_ADAPTER_INFO>, SizePointer_in_out: PULONG): ULONG {
    return Iphlpapi.Load('GetAdaptersInfo')(AdapterInfo_out, SizePointer_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getanycastipaddressentry
  public static GetAnycastIpAddressEntry(Row_in_out: PMIB_ANYCASTIPADDRESS_ROW): DWORD {
    return Iphlpapi.Load('GetAnycastIpAddressEntry')(Row_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getanycastipaddresstable
  public static GetAnycastIpAddressTable(Family: ADDRESS_FAMILY, Table_out: PVOID): DWORD {
    return Iphlpapi.Load('GetAnycastIpAddressTable')(Family, Table_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getbestinterface
  public static GetBestInterface(dwDestAddr: IPAddr, pdwBestIfIndex_out: PDWORD): DWORD {
    return Iphlpapi.Load('GetBestInterface')(dwDestAddr, pdwBestIfIndex_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getbestinterfaceex
  public static GetBestInterfaceEx(pDestAddr: PSOCKADDR, pdwBestIfIndex_out: PDWORD): DWORD {
    return Iphlpapi.Load('GetBestInterfaceEx')(pDestAddr, pdwBestIfIndex_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getbestroute
  public static GetBestRoute(dwDestAddr: DWORD, dwSourceAddr: DWORD, pBestRoute_out: PMIB_IPFORWARDROW): DWORD {
    return Iphlpapi.Load('GetBestRoute')(dwDestAddr, dwSourceAddr, pBestRoute_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getbestroute2
  public static GetBestRoute2(
    InterfaceLuid: OPTIONAL<PNET_LUID>,
    InterfaceIndex: NET_IFINDEX,
    SourceAddress: OPTIONAL<PSOCKADDR_INET>,
    DestinationAddress: PSOCKADDR_INET,
    AddressSortOptions: ULONG,
    BestRoute_out: PMIB_IPFORWARD_ROW2,
    BestSourceAddress_out: PSOCKADDR_INET,
  ): DWORD {
    return Iphlpapi.Load('GetBestRoute2')(InterfaceLuid, InterfaceIndex, SourceAddress, DestinationAddress, AddressSortOptions, BestRoute_out, BestSourceAddress_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getcurrentthreadcompartmentid
  public static GetCurrentThreadCompartmentId(): NET_IF_COMPARTMENT_ID {
    return Iphlpapi.Load('GetCurrentThreadCompartmentId')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getextendedtcptable
  public static GetExtendedTcpTable(pTcpTable_out: OPTIONAL<PVOID>, pdwSize_in_out: PDWORD, bOrder: BOOL, ulAf: ULONG, TableClass: TCP_TABLE_CLASS, Reserved: ULONG): DWORD {
    return Iphlpapi.Load('GetExtendedTcpTable')(pTcpTable_out, pdwSize_in_out, bOrder, ulAf, TableClass, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getextendedudptable
  public static GetExtendedUdpTable(pUdpTable_out: OPTIONAL<PVOID>, pdwSize_in_out: PDWORD, bOrder: BOOL, ulAf: ULONG, TableClass: UDP_TABLE_CLASS, Reserved: ULONG): DWORD {
    return Iphlpapi.Load('GetExtendedUdpTable')(pUdpTable_out, pdwSize_in_out, bOrder, ulAf, TableClass, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getfriendlyifindex
  public static GetFriendlyIfIndex(IfIndex: DWORD): DWORD {
    return Iphlpapi.Load('GetFriendlyIfIndex')(IfIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-geticmpstatistics
  public static GetIcmpStatistics(Statistics_out: PMIB_ICMP): ULONG {
    return Iphlpapi.Load('GetIcmpStatistics')(Statistics_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-geticmpstatisticsex
  public static GetIcmpStatisticsEx(Statistics_out: PMIB_ICMP_EX, Family: ULONG): ULONG {
    return Iphlpapi.Load('GetIcmpStatisticsEx')(Statistics_out, Family);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getifentry
  public static GetIfEntry(pIfRow_in_out: PMIB_IFROW): DWORD {
    return Iphlpapi.Load('GetIfEntry')(pIfRow_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getifentry2
  public static GetIfEntry2(Row_in_out: PMIB_IF_ROW2): DWORD {
    return Iphlpapi.Load('GetIfEntry2')(Row_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getifentry2ex
  public static GetIfEntry2Ex(Level: MIB_IF_ENTRY_LEVEL, Row_in_out: PMIB_IF_ROW2): DWORD {
    return Iphlpapi.Load('GetIfEntry2Ex')(Level, Row_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getifstacktable
  public static GetIfStackTable(Table_out: PVOID): DWORD {
    return Iphlpapi.Load('GetIfStackTable')(Table_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getiftable
  public static GetIfTable(pIfTable_out: OPTIONAL<PMIB_IFTABLE>, pdwSize_in_out: PULONG, bOrder: BOOL): DWORD {
    return Iphlpapi.Load('GetIfTable')(pIfTable_out, pdwSize_in_out, bOrder);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getiftable2
  public static GetIfTable2(Table_out: PVOID): DWORD {
    return Iphlpapi.Load('GetIfTable2')(Table_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getiftable2ex
  public static GetIfTable2Ex(Level: MIB_IF_TABLE_LEVEL, Table_out: PVOID): DWORD {
    return Iphlpapi.Load('GetIfTable2Ex')(Level, Table_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getinterfaceactivetimestampcapabilities
  public static GetInterfaceActiveTimestampCapabilities(InterfaceLuid: PNET_LUID, TimestampCapabilites_out: PINTERFACE_TIMESTAMP_CAPABILITIES): DWORD {
    return Iphlpapi.Load('GetInterfaceActiveTimestampCapabilities')(InterfaceLuid, TimestampCapabilites_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getinterfacecurrenttimestampcapabilities
  public static GetInterfaceCurrentTimestampCapabilities(InterfaceLuid: PNET_LUID, TimestampCapabilites_in_out: PINTERFACE_TIMESTAMP_CAPABILITIES): DWORD {
    return Iphlpapi.Load('GetInterfaceCurrentTimestampCapabilities')(InterfaceLuid, TimestampCapabilites_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getinterfacehardwaretimestampcapabilities
  public static GetInterfaceHardwareTimestampCapabilities(InterfaceLuid: PNET_LUID, TimestampCapabilites_in_out: PINTERFACE_TIMESTAMP_CAPABILITIES): DWORD {
    return Iphlpapi.Load('GetInterfaceHardwareTimestampCapabilities')(InterfaceLuid, TimestampCapabilites_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getinterfaceinfo
  public static GetInterfaceInfo(pIfTable_out: OPTIONAL<PIP_INTERFACE_INFO>, dwOutBufLen_in_out: PULONG): DWORD {
    return Iphlpapi.Load('GetInterfaceInfo')(pIfTable_out, dwOutBufLen_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getinterfacesupportedtimestampcapabilities
  public static GetInterfaceSupportedTimestampCapabilities(InterfaceLuid: PNET_LUID, TimestampCapabilites_out: PINTERFACE_TIMESTAMP_CAPABILITIES): DWORD {
    return Iphlpapi.Load('GetInterfaceSupportedTimestampCapabilities')(InterfaceLuid, TimestampCapabilites_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getinvertedifstacktable
  public static GetInvertedIfStackTable(Table_out: PVOID): DWORD {
    return Iphlpapi.Load('GetInvertedIfStackTable')(Table_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getipaddrtable
  public static GetIpAddrTable(pIpAddrTable_out: OPTIONAL<PMIB_IPADDRTABLE>, pdwSize_in_out: PULONG, bOrder: BOOL): DWORD {
    return Iphlpapi.Load('GetIpAddrTable')(pIpAddrTable_out, pdwSize_in_out, bOrder);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getiperrorstring
  public static GetIpErrorString(ErrorCode: IP_STATUS, Buffer_out: OPTIONAL<LPWSTR>, Size_in_out: PDWORD): DWORD {
    return Iphlpapi.Load('GetIpErrorString')(ErrorCode, Buffer_out, Size_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getipforwardentry2
  public static GetIpForwardEntry2(Row_in_out: PMIB_IPFORWARD_ROW2): DWORD {
    return Iphlpapi.Load('GetIpForwardEntry2')(Row_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getipforwardtable
  public static GetIpForwardTable(pIpForwardTable_out: OPTIONAL<PMIB_IPFORWARDTABLE>, pdwSize_in_out: PULONG, bOrder: BOOL): DWORD {
    return Iphlpapi.Load('GetIpForwardTable')(pIpForwardTable_out, pdwSize_in_out, bOrder);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getipforwardtable2
  public static GetIpForwardTable2(Family: ADDRESS_FAMILY, Table_out: PVOID): DWORD {
    return Iphlpapi.Load('GetIpForwardTable2')(Family, Table_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getipinterfaceentry
  public static GetIpInterfaceEntry(Row_in_out: PMIB_IPINTERFACE_ROW): DWORD {
    return Iphlpapi.Load('GetIpInterfaceEntry')(Row_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getipinterfacetable
  public static GetIpInterfaceTable(Family: ADDRESS_FAMILY, Table_out: PVOID): DWORD {
    return Iphlpapi.Load('GetIpInterfaceTable')(Family, Table_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getipnetentry2
  public static GetIpNetEntry2(Row_in_out: PMIB_IPNET_ROW2): DWORD {
    return Iphlpapi.Load('GetIpNetEntry2')(Row_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getipnettable
  public static GetIpNetTable(IpNetTable_out: OPTIONAL<PMIB_IPNETTABLE>, SizePointer_in_out: PULONG, Order: BOOL): ULONG {
    return Iphlpapi.Load('GetIpNetTable')(IpNetTable_out, SizePointer_in_out, Order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getipnettable2
  public static GetIpNetTable2(Family: ADDRESS_FAMILY, Table_out: PVOID): DWORD {
    return Iphlpapi.Load('GetIpNetTable2')(Family, Table_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getipnetworkconnectionbandwidthestimates
  public static GetIpNetworkConnectionBandwidthEstimates(InterfaceIndex: NET_IFINDEX, AddressFamily: ADDRESS_FAMILY, BandwidthEstimates_out: PMIB_IP_NETWORK_CONNECTION_BANDWIDTH_ESTIMATES): DWORD {
    return Iphlpapi.Load('GetIpNetworkConnectionBandwidthEstimates')(InterfaceIndex, AddressFamily, BandwidthEstimates_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getippathentry
  public static GetIpPathEntry(Row_in_out: PMIB_IPPATH_ROW): DWORD {
    return Iphlpapi.Load('GetIpPathEntry')(Row_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getippathtable
  public static GetIpPathTable(Family: ADDRESS_FAMILY, Table_out: PVOID): DWORD {
    return Iphlpapi.Load('GetIpPathTable')(Family, Table_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getipstatistics
  public static GetIpStatistics(Statistics_out: PMIB_IPSTATS): ULONG {
    return Iphlpapi.Load('GetIpStatistics')(Statistics_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getipstatisticsex
  public static GetIpStatisticsEx(Statistics_out: PMIB_IPSTATS, Family: ULONG): ULONG {
    return Iphlpapi.Load('GetIpStatisticsEx')(Statistics_out, Family);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getmulticastipaddressentry
  public static GetMulticastIpAddressEntry(Row_in_out: PMIB_MULTICASTIPADDRESS_ROW): DWORD {
    return Iphlpapi.Load('GetMulticastIpAddressEntry')(Row_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getmulticastipaddresstable
  public static GetMulticastIpAddressTable(Family: ADDRESS_FAMILY, Table_out: PVOID): DWORD {
    return Iphlpapi.Load('GetMulticastIpAddressTable')(Family, Table_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getnetworkconnectivityhint
  public static GetNetworkConnectivityHint(ConnectivityHint_out: PNL_NETWORK_CONNECTIVITY_HINT): DWORD {
    return Iphlpapi.Load('GetNetworkConnectivityHint')(ConnectivityHint_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getnetworkconnectivityhintforinterface
  public static GetNetworkConnectivityHintForInterface(InterfaceIndex: NET_IFINDEX, ConnectivityHint_out: PNL_NETWORK_CONNECTIVITY_HINT): DWORD {
    return Iphlpapi.Load('GetNetworkConnectivityHintForInterface')(InterfaceIndex, ConnectivityHint_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getnetworkinformation
  public static GetNetworkInformation(NetworkGuid: PVOID, CompartmentId_out: PDWORD, SiteId_out: PULONG, NetworkName_out: LPWSTR, Length: ULONG): DWORD {
    return Iphlpapi.Load('GetNetworkInformation')(NetworkGuid, CompartmentId_out, SiteId_out, NetworkName_out, Length);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getnetworkparams
  public static GetNetworkParams(pFixedInfo_out: OPTIONAL<PFIXED_INFO>, pOutBufLen_in_out: PULONG): DWORD {
    return Iphlpapi.Load('GetNetworkParams')(pFixedInfo_out, pOutBufLen_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getnumberofinterfaces
  public static GetNumberOfInterfaces(pdwNumIf_out: PDWORD): DWORD {
    return Iphlpapi.Load('GetNumberOfInterfaces')(pdwNumIf_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getownermodulefromtcp6entry
  public static GetOwnerModuleFromTcp6Entry(pTcpEntry: PMIB_TCP6ROW_OWNER_MODULE, Class: TCPIP_OWNER_MODULE_INFO_CLASS, pBuffer_out: PVOID, pdwSize_in_out: PDWORD): DWORD {
    return Iphlpapi.Load('GetOwnerModuleFromTcp6Entry')(pTcpEntry, Class, pBuffer_out, pdwSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getownermodulefromtcpentry
  public static GetOwnerModuleFromTcpEntry(pTcpEntry: PMIB_TCPROW_OWNER_MODULE, Class: TCPIP_OWNER_MODULE_INFO_CLASS, pBuffer_out: PVOID, pdwSize_in_out: PDWORD): DWORD {
    return Iphlpapi.Load('GetOwnerModuleFromTcpEntry')(pTcpEntry, Class, pBuffer_out, pdwSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getownermodulefromudp6entry
  public static GetOwnerModuleFromUdp6Entry(pUdpEntry: PMIB_UDP6ROW_OWNER_MODULE, Class: TCPIP_OWNER_MODULE_INFO_CLASS, pBuffer_out: PVOID, pdwSize_in_out: PDWORD): DWORD {
    return Iphlpapi.Load('GetOwnerModuleFromUdp6Entry')(pUdpEntry, Class, pBuffer_out, pdwSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getownermodulefromudpentry
  public static GetOwnerModuleFromUdpEntry(pUdpEntry: PMIB_UDPROW_OWNER_MODULE, Class: TCPIP_OWNER_MODULE_INFO_CLASS, pBuffer_out: PVOID, pdwSize_in_out: PDWORD): DWORD {
    return Iphlpapi.Load('GetOwnerModuleFromUdpEntry')(pUdpEntry, Class, pBuffer_out, pdwSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getperadapterinfo
  public static GetPerAdapterInfo(IfIndex: ULONG, pPerAdapterInfo_out: OPTIONAL<PIP_PER_ADAPTER_INFO>, pOutBufLen_in_out: PULONG): DWORD {
    return Iphlpapi.Load('GetPerAdapterInfo')(IfIndex, pPerAdapterInfo_out, pOutBufLen_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getpertcp6connectionestats
  public static GetPerTcp6ConnectionEStats(
    Row: PMIB_TCP6ROW,
    EstatsType: TCP_ESTATS_TYPE,
    Rw_out: OPTIONAL<PUCHAR>,
    RwVersion: ULONG,
    RwSize: ULONG,
    Ros_out: OPTIONAL<PUCHAR>,
    RosVersion: ULONG,
    RosSize: ULONG,
    Rod_out: OPTIONAL<PUCHAR>,
    RodVersion: ULONG,
    RodSize: ULONG,
  ): ULONG {
    return Iphlpapi.Load('GetPerTcp6ConnectionEStats')(Row, EstatsType, Rw_out, RwVersion, RwSize, Ros_out, RosVersion, RosSize, Rod_out, RodVersion, RodSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getpertcpconnectionestats
  public static GetPerTcpConnectionEStats(
    Row: PMIB_TCPROW,
    EstatsType: TCP_ESTATS_TYPE,
    Rw_out: OPTIONAL<PUCHAR>,
    RwVersion: ULONG,
    RwSize: ULONG,
    Ros_out: OPTIONAL<PUCHAR>,
    RosVersion: ULONG,
    RosSize: ULONG,
    Rod_out: OPTIONAL<PUCHAR>,
    RodVersion: ULONG,
    RodSize: ULONG,
  ): ULONG {
    return Iphlpapi.Load('GetPerTcpConnectionEStats')(Row, EstatsType, Rw_out, RwVersion, RwSize, Ros_out, RosVersion, RosSize, Rod_out, RodVersion, RodSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getrttandhopcount
  public static GetRTTAndHopCount(DestIpAddress: IPAddr, HopCount_out: PULONG, MaxHops: ULONG, RTT_out: PULONG): BOOL {
    return Iphlpapi.Load('GetRTTAndHopCount')(DestIpAddress, HopCount_out, MaxHops, RTT_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getsessioncompartmentid
  public static GetSessionCompartmentId(SessionId: ULONG): NET_IF_COMPARTMENT_ID {
    return Iphlpapi.Load('GetSessionCompartmentId')(SessionId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-gettcp6table
  public static GetTcp6Table(TcpTable_out: PMIB_TCP6TABLE, SizePointer_in_out: PULONG, Order: BOOL): ULONG {
    return Iphlpapi.Load('GetTcp6Table')(TcpTable_out, SizePointer_in_out, Order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-gettcp6table2
  public static GetTcp6Table2(TcpTable_out: PMIB_TCP6TABLE2, SizePointer_in_out: PULONG, Order: BOOL): ULONG {
    return Iphlpapi.Load('GetTcp6Table2')(TcpTable_out, SizePointer_in_out, Order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-gettcpstatistics
  public static GetTcpStatistics(Statistics_out: PMIB_TCPSTATS): ULONG {
    return Iphlpapi.Load('GetTcpStatistics')(Statistics_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-gettcpstatisticsex
  public static GetTcpStatisticsEx(Statistics_out: PMIB_TCPSTATS, Family: ULONG): ULONG {
    return Iphlpapi.Load('GetTcpStatisticsEx')(Statistics_out, Family);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-gettcpstatisticsex2
  public static GetTcpStatisticsEx2(Statistics_out: PMIB_TCPSTATS2, Family: ULONG): ULONG {
    return Iphlpapi.Load('GetTcpStatisticsEx2')(Statistics_out, Family);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-gettcptable
  public static GetTcpTable(TcpTable_out: OPTIONAL<PMIB_TCPTABLE>, SizePointer_in_out: PULONG, Order: BOOL): ULONG {
    return Iphlpapi.Load('GetTcpTable')(TcpTable_out, SizePointer_in_out, Order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-gettcptable2
  public static GetTcpTable2(TcpTable_out: OPTIONAL<PMIB_TCPTABLE2>, SizePointer_in_out: PULONG, Order: BOOL): ULONG {
    return Iphlpapi.Load('GetTcpTable2')(TcpTable_out, SizePointer_in_out, Order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getteredoport
  public static GetTeredoPort(Port_out: PUSHORT): DWORD {
    return Iphlpapi.Load('GetTeredoPort')(Port_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getudp6table
  public static GetUdp6Table(Udp6Table_out: OPTIONAL<PMIB_UDP6TABLE>, SizePointer_in_out: PULONG, Order: BOOL): ULONG {
    return Iphlpapi.Load('GetUdp6Table')(Udp6Table_out, SizePointer_in_out, Order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getudpstatistics
  public static GetUdpStatistics(Stats_out: PMIB_UDPSTATS): ULONG {
    return Iphlpapi.Load('GetUdpStatistics')(Stats_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getudpstatisticsex
  public static GetUdpStatisticsEx(Statistics_out: PMIB_UDPSTATS, Family: ULONG): ULONG {
    return Iphlpapi.Load('GetUdpStatisticsEx')(Statistics_out, Family);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getudpstatisticsex2
  public static GetUdpStatisticsEx2(Statistics_out: PMIB_UDPSTATS2, Family: ULONG): ULONG {
    return Iphlpapi.Load('GetUdpStatisticsEx2')(Statistics_out, Family);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getudptable
  public static GetUdpTable(UdpTable_out: OPTIONAL<PMIB_UDPTABLE>, SizePointer_in_out: PULONG, Order: BOOL): ULONG {
    return Iphlpapi.Load('GetUdpTable')(UdpTable_out, SizePointer_in_out, Order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getunidirectionaladapterinfo
  public static GetUniDirectionalAdapterInfo(pIPIfInfo_out: OPTIONAL<PIP_UNIDIRECTIONAL_ADAPTER_ADDRESS>, dwOutBufLen_in_out: PULONG): DWORD {
    return Iphlpapi.Load('GetUniDirectionalAdapterInfo')(pIPIfInfo_out, dwOutBufLen_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getunicastipaddressentry
  public static GetUnicastIpAddressEntry(Row_in_out: PMIB_UNICASTIPADDRESS_ROW): DWORD {
    return Iphlpapi.Load('GetUnicastIpAddressEntry')(Row_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-getunicastipaddresstable
  public static GetUnicastIpAddressTable(Family: ADDRESS_FAMILY, Table_out: PVOID): DWORD {
    return Iphlpapi.Load('GetUnicastIpAddressTable')(Family, Table_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icmpapi/nf-icmpapi-icmp6createfile
  public static Icmp6CreateFile(): HANDLE {
    return Iphlpapi.Load('Icmp6CreateFile')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icmpapi/nf-icmpapi-icmp6parsereplies
  public static Icmp6ParseReplies(ReplyBuffer_out: LPVOID, ReplySize: DWORD): DWORD {
    return Iphlpapi.Load('Icmp6ParseReplies')(ReplyBuffer_out, ReplySize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icmpapi/nf-icmpapi-icmp6sendecho2
  public static Icmp6SendEcho2(
    IcmpHandle: HANDLE,
    Event: OPTIONAL<HANDLE>,
    ApcRoutine: OPTIONAL<PIO_APC_ROUTINE>,
    ApcContext: OPTIONAL<PVOID>,
    SourceAddress: PSOCKADDR_IN6,
    DestinationAddress: PSOCKADDR_IN6,
    RequestData: LPVOID,
    RequestSize: WORD,
    RequestOptions: OPTIONAL<PIP_OPTION_INFORMATION>,
    ReplyBuffer_out: LPVOID,
    ReplySize: DWORD,
    Timeout: DWORD,
  ): DWORD {
    return Iphlpapi.Load('Icmp6SendEcho2')(IcmpHandle, Event, ApcRoutine, ApcContext, SourceAddress, DestinationAddress, RequestData, RequestSize, RequestOptions, ReplyBuffer_out, ReplySize, Timeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icmpapi/nf-icmpapi-icmpclosehandle
  public static IcmpCloseHandle(IcmpHandle: HANDLE): BOOL {
    return Iphlpapi.Load('IcmpCloseHandle')(IcmpHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icmpapi/nf-icmpapi-icmpcreatefile
  public static IcmpCreateFile(): HANDLE {
    return Iphlpapi.Load('IcmpCreateFile')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icmpapi/nf-icmpapi-icmpparsereplies
  public static IcmpParseReplies(ReplyBuffer_out: LPVOID, ReplySize: DWORD): DWORD {
    return Iphlpapi.Load('IcmpParseReplies')(ReplyBuffer_out, ReplySize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icmpapi/nf-icmpapi-icmpsendecho
  public static IcmpSendEcho(IcmpHandle: HANDLE, DestinationAddress: IPAddr, RequestData: LPVOID, RequestSize: WORD, RequestOptions: OPTIONAL<PIP_OPTION_INFORMATION>, ReplyBuffer_out: LPVOID, ReplySize: DWORD, Timeout: DWORD): DWORD {
    return Iphlpapi.Load('IcmpSendEcho')(IcmpHandle, DestinationAddress, RequestData, RequestSize, RequestOptions, ReplyBuffer_out, ReplySize, Timeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icmpapi/nf-icmpapi-icmpsendecho2
  public static IcmpSendEcho2(
    IcmpHandle: HANDLE,
    Event: OPTIONAL<HANDLE>,
    ApcRoutine: OPTIONAL<PIO_APC_ROUTINE>,
    ApcContext: OPTIONAL<PVOID>,
    DestinationAddress: IPAddr,
    RequestData: LPVOID,
    RequestSize: WORD,
    RequestOptions: OPTIONAL<PIP_OPTION_INFORMATION>,
    ReplyBuffer_out: LPVOID,
    ReplySize: DWORD,
    Timeout: DWORD,
  ): DWORD {
    return Iphlpapi.Load('IcmpSendEcho2')(IcmpHandle, Event, ApcRoutine, ApcContext, DestinationAddress, RequestData, RequestSize, RequestOptions, ReplyBuffer_out, ReplySize, Timeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/icmpapi/nf-icmpapi-icmpsendecho2ex
  public static IcmpSendEcho2Ex(
    IcmpHandle: HANDLE,
    Event: OPTIONAL<HANDLE>,
    ApcRoutine: OPTIONAL<PIO_APC_ROUTINE>,
    ApcContext: OPTIONAL<PVOID>,
    SourceAddress: IPAddr,
    DestinationAddress: IPAddr,
    RequestData: LPVOID,
    RequestSize: WORD,
    RequestOptions: OPTIONAL<PIP_OPTION_INFORMATION>,
    ReplyBuffer_out: LPVOID,
    ReplySize: DWORD,
    Timeout: DWORD,
  ): DWORD {
    return Iphlpapi.Load('IcmpSendEcho2Ex')(IcmpHandle, Event, ApcRoutine, ApcContext, SourceAddress, DestinationAddress, RequestData, RequestSize, RequestOptions, ReplyBuffer_out, ReplySize, Timeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-initializeipforwardentry
  public static InitializeIpForwardEntry(Row_out: PMIB_IPFORWARD_ROW2): void {
    return Iphlpapi.Load('InitializeIpForwardEntry')(Row_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-initializeipinterfaceentry
  public static InitializeIpInterfaceEntry(Row_in_out: PMIB_IPINTERFACE_ROW): void {
    return Iphlpapi.Load('InitializeIpInterfaceEntry')(Row_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-initializeunicastipaddressentry
  public static InitializeUnicastIpAddressEntry(Row_out: PMIB_UNICASTIPADDRESS_ROW): void {
    return Iphlpapi.Load('InitializeUnicastIpAddressEntry')(Row_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-ipreleaseaddress
  public static IpReleaseAddress(AdapterInfo: PIP_ADAPTER_INDEX_MAP): DWORD {
    return Iphlpapi.Load('IpReleaseAddress')(AdapterInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-iprenewaddress
  public static IpRenewAddress(AdapterInfo: PIP_ADAPTER_INDEX_MAP): DWORD {
    return Iphlpapi.Load('IpRenewAddress')(AdapterInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-lookuppersistenttcpportreservation
  public static LookupPersistentTcpPortReservation(StartPort: USHORT, NumberOfPorts: USHORT, Token_out: PULONG64): ULONG {
    return Iphlpapi.Load('LookupPersistentTcpPortReservation')(StartPort, NumberOfPorts, Token_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-lookuppersistentudpportreservation
  public static LookupPersistentUdpPortReservation(StartPort: USHORT, NumberOfPorts: USHORT, Token_out: PULONG64): ULONG {
    return Iphlpapi.Load('LookupPersistentUdpPortReservation')(StartPort, NumberOfPorts, Token_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-notifyaddrchange
  public static NotifyAddrChange(Handle_out: NULLABLE<PHANDLE>, overlapped: NULLABLE<LPOVERLAPPED>): DWORD {
    return Iphlpapi.Load('NotifyAddrChange')(Handle_out, overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-notifyipinterfacechange
  public static NotifyIpInterfaceChange(Family: ADDRESS_FAMILY, Callback: PIPINTERFACE_CHANGE_CALLBACK, CallerContext: OPTIONAL<PVOID>, InitialNotification: BOOLEAN, NotificationHandle_in_out: PHANDLE): DWORD {
    return Iphlpapi.Load('NotifyIpInterfaceChange')(Family, Callback, CallerContext, InitialNotification, NotificationHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-notifynetworkconnectivityhintchange
  public static NotifyNetworkConnectivityHintChange(Callback: PNETWORK_CONNECTIVITY_HINT_CHANGE_CALLBACK, CallerContext: OPTIONAL<PVOID>, InitialNotification: BOOLEAN, NotificationHandle_out: PHANDLE): DWORD {
    return Iphlpapi.Load('NotifyNetworkConnectivityHintChange')(Callback, CallerContext, InitialNotification, NotificationHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-notifyroutechange
  public static NotifyRouteChange(Handle_out: NULLABLE<PHANDLE>, overlapped: NULLABLE<LPOVERLAPPED>): DWORD {
    return Iphlpapi.Load('NotifyRouteChange')(Handle_out, overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-notifyroutechange2
  public static NotifyRouteChange2(AddressFamily: ADDRESS_FAMILY, Callback: PIPFORWARD_CHANGE_CALLBACK, CallerContext: NULLABLE<PVOID>, InitialNotification: BOOLEAN, NotificationHandle_in_out: PHANDLE): DWORD {
    return Iphlpapi.Load('NotifyRouteChange2')(AddressFamily, Callback, CallerContext, InitialNotification, NotificationHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-notifystableunicastipaddresstable
  public static NotifyStableUnicastIpAddressTable(Family: ADDRESS_FAMILY, Table_out: PVOID, CallerCallback: PSTABLE_UNICAST_IPADDRESS_TABLE_CALLBACK, CallerContext: NULLABLE<PVOID>, NotificationHandle_in_out: PHANDLE): DWORD {
    return Iphlpapi.Load('NotifyStableUnicastIpAddressTable')(Family, Table_out, CallerCallback, CallerContext, NotificationHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-notifyteredoportchange
  public static NotifyTeredoPortChange(Callback: PTEREDO_PORT_CHANGE_CALLBACK, CallerContext: NULLABLE<PVOID>, InitialNotification: BOOLEAN, NotificationHandle_in_out: PHANDLE): DWORD {
    return Iphlpapi.Load('NotifyTeredoPortChange')(Callback, CallerContext, InitialNotification, NotificationHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-notifyunicastipaddresschange
  public static NotifyUnicastIpAddressChange(Family: ADDRESS_FAMILY, Callback: PUNICAST_IPADDRESS_CHANGE_CALLBACK, CallerContext: OPTIONAL<PVOID>, InitialNotification: BOOLEAN, NotificationHandle_in_out: PHANDLE): DWORD {
    return Iphlpapi.Load('NotifyUnicastIpAddressChange')(Family, Callback, CallerContext, InitialNotification, NotificationHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-parsenetworkstring
  public static ParseNetworkString(NetworkString: LPCWSTR, Types: DWORD, AddressInfo_out: OPTIONAL<PNET_ADDRESS_INFO>, PortNumber_out: OPTIONAL<PUSHORT>, PrefixLength_out: OPTIONAL<PBYTE>): DWORD {
    return Iphlpapi.Load('ParseNetworkString')(NetworkString, Types, AddressInfo_out, PortNumber_out, PrefixLength_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-registerinterfacetimestampconfigchange
  public static RegisterInterfaceTimestampConfigChange(Callback: PINTERFACE_TIMESTAMP_CONFIG_CHANGE_CALLBACK, CallerContext: OPTIONAL<PVOID>, NotificationHandle_out: PVOID): DWORD {
    return Iphlpapi.Load('RegisterInterfaceTimestampConfigChange')(Callback, CallerContext, NotificationHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-resolveipnetentry2
  public static ResolveIpNetEntry2(Row_in_out: PMIB_IPNET_ROW2, SourceAddress: OPTIONAL<PSOCKADDR_INET>): DWORD {
    return Iphlpapi.Load('ResolveIpNetEntry2')(Row_in_out, SourceAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-restoremediasense
  public static RestoreMediaSense(pOverlapped: NULLABLE<LPOVERLAPPED>, lpdwEnableCount_out: OPTIONAL<LPDWORD>): DWORD {
    return Iphlpapi.Load('RestoreMediaSense')(pOverlapped, lpdwEnableCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-sendarp
  public static SendARP(DestIP: IPAddr, SrcIP: IPAddr, pMacAddr_out: PVOID, PhyAddrLen_in_out: PULONG): DWORD {
    return Iphlpapi.Load('SendARP')(DestIP, SrcIP, pMacAddr_out, PhyAddrLen_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-setcurrentthreadcompartmentid
  public static SetCurrentThreadCompartmentId(CompartmentId: NET_IF_COMPARTMENT_ID): DWORD {
    return Iphlpapi.Load('SetCurrentThreadCompartmentId')(CompartmentId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-setifentry
  public static SetIfEntry(pIfRow: PMIB_IFROW): DWORD {
    return Iphlpapi.Load('SetIfEntry')(pIfRow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-setipforwardentry
  public static SetIpForwardEntry(pRoute: PMIB_IPFORWARDROW): DWORD {
    return Iphlpapi.Load('SetIpForwardEntry')(pRoute);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-setipforwardentry2
  public static SetIpForwardEntry2(Route: PMIB_IPFORWARD_ROW2): DWORD {
    return Iphlpapi.Load('SetIpForwardEntry2')(Route);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-setipinterfaceentry
  public static SetIpInterfaceEntry(Row_in_out: PMIB_IPINTERFACE_ROW): DWORD {
    return Iphlpapi.Load('SetIpInterfaceEntry')(Row_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-setipnetentry
  public static SetIpNetEntry(pArpEntry: PMIB_IPNETROW): DWORD {
    return Iphlpapi.Load('SetIpNetEntry')(pArpEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-setipnetentry2
  public static SetIpNetEntry2(Row: PMIB_IPNET_ROW2): DWORD {
    return Iphlpapi.Load('SetIpNetEntry2')(Row);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-setipstatistics
  public static SetIpStatistics(pIpStats: PMIB_IPSTATS): DWORD {
    return Iphlpapi.Load('SetIpStatistics')(pIpStats);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-setipstatisticsex
  public static SetIpStatisticsEx(Statistics: PMIB_IPSTATS, Family: ULONG): ULONG {
    return Iphlpapi.Load('SetIpStatisticsEx')(Statistics, Family);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-setipttl
  public static SetIpTTL(nTTL: UINT): DWORD {
    return Iphlpapi.Load('SetIpTTL')(nTTL);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-setnetworkinformation
  public static SetNetworkInformation(NetworkGuid: PVOID, CompartmentId: NET_IF_COMPARTMENT_ID, NetworkName: LPCWSTR): DWORD {
    return Iphlpapi.Load('SetNetworkInformation')(NetworkGuid, CompartmentId, NetworkName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-setpertcp6connectionestats
  public static SetPerTcp6ConnectionEStats(Row: PMIB_TCP6ROW, EstatsType: TCP_ESTATS_TYPE, Rw: PUCHAR, RwVersion: ULONG, RwSize: ULONG, Offset: ULONG): ULONG {
    return Iphlpapi.Load('SetPerTcp6ConnectionEStats')(Row, EstatsType, Rw, RwVersion, RwSize, Offset);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-setpertcpconnectionestats
  public static SetPerTcpConnectionEStats(Row: PMIB_TCPROW, EstatsType: TCP_ESTATS_TYPE, Rw: PUCHAR, RwVersion: ULONG, RwSize: ULONG, Offset: ULONG): ULONG {
    return Iphlpapi.Load('SetPerTcpConnectionEStats')(Row, EstatsType, Rw, RwVersion, RwSize, Offset);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-setsessioncompartmentid
  public static SetSessionCompartmentId(SessionId: ULONG, CompartmentId: NET_IF_COMPARTMENT_ID): DWORD {
    return Iphlpapi.Load('SetSessionCompartmentId')(SessionId, CompartmentId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-settcpentry
  public static SetTcpEntry(pTcpRow: PMIB_TCPROW): DWORD {
    return Iphlpapi.Load('SetTcpEntry')(pTcpRow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-setunicastipaddressentry
  public static SetUnicastIpAddressEntry(Row: PMIB_UNICASTIPADDRESS_ROW): DWORD {
    return Iphlpapi.Load('SetUnicastIpAddressEntry')(Row);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-unenablerouter
  public static UnenableRouter(pOverlapped: LPOVERLAPPED, lpdwEnableCount_out: OPTIONAL<LPDWORD>): DWORD {
    return Iphlpapi.Load('UnenableRouter')(pOverlapped, lpdwEnableCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-unregisterinterfacetimestampconfigchange
  public static UnregisterInterfaceTimestampConfigChange(NotificationHandle: HIFTIMESTAMPCHANGE): void {
    return Iphlpapi.Load('UnregisterInterfaceTimestampConfigChange')(NotificationHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-if_indextoname
  public static if_indextoname(InterfaceIndex: NET_IFINDEX, InterfaceName_out: LPSTR): LPSTR {
    return Iphlpapi.Load('if_indextoname')(InterfaceIndex, InterfaceName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/netioapi/nf-netioapi-if_nametoindex
  public static if_nametoindex(InterfaceName: LPCSTR): NET_IFINDEX {
    return Iphlpapi.Load('if_nametoindex')(InterfaceName);
  }
}

export default Iphlpapi;
