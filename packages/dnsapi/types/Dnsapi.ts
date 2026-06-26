import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, HANDLE, LPCWSTR, LPVOID, LPWSTR, NULL, NULLABLE, OPTIONAL, PDWORD, PHANDLE, PVOID, WORD } from '@bun-win32/core';

export enum DnsCharSet {
  DnsCharSetAnsi = 3,
  DnsCharSetUnicode = 1,
  DnsCharSetUnknown = 0,
  DnsCharSetUtf8 = 2,
}

export enum DnsConfigType {
  DnsConfigAdapterDomainName_A = 4,
  DnsConfigAdapterDomainName_UTF8 = 5,
  DnsConfigAdapterDomainName_W = 3,
  DnsConfigAdapterHostNameRegistrationEnabled = 10,
  DnsConfigAdapterInfo = 8,
  DnsConfigAddressRegistrationMaxCount = 11,
  DnsConfigDnsServerList = 6,
  DnsConfigFullHostName_A = 16,
  DnsConfigFullHostName_UTF8 = 17,
  DnsConfigFullHostName_W = 15,
  DnsConfigHostName_A = 13,
  DnsConfigHostName_UTF8 = 14,
  DnsConfigHostName_W = 12,
  DnsConfigNameServer = 18,
  DnsConfigPrimaryDomainName_A = 1,
  DnsConfigPrimaryDomainName_UTF8 = 2,
  DnsConfigPrimaryDomainName_W = 0,
  DnsConfigPrimaryHostNameRegistrationEnabled = 9,
  DnsConfigSearchList = 7,
}

export enum DnsFreeType {
  DnsFreeFlat = 0,
  DnsFreeParsedMessageFields = 2,
  DnsFreeRecordList = 1,
}

export enum DnsNameFormat {
  DnsNameDomain = 0,
  DnsNameDomainLabel = 1,
  DnsNameHostnameFull = 2,
  DnsNameHostnameLabel = 3,
  DnsNameSrvRecord = 5,
  DnsNameValidateTld = 6,
  DnsNameWildcard = 4,
}

export enum DnsProxyInformationType {
  DNS_PROXY_INFORMATION_DEFAULT_SETTINGS = 1,
  DNS_PROXY_INFORMATION_DIRECT = 0,
  DNS_PROXY_INFORMATION_DOES_NOT_EXIST = 3,
  DNS_PROXY_INFORMATION_PROXY_NAME = 2,
}

export enum DnsQueryOption {
  DNS_QUERY_ACCEPT_TRUNCATED_RESPONSE = 0x0000_0001,
  DNS_QUERY_ADDRCONFIG = 0x0000_2000,
  DNS_QUERY_APPEND_MULTILABEL = 0x0080_0000,
  DNS_QUERY_BYPASS_CACHE = 0x0000_0008,
  DNS_QUERY_DISABLE_IDN_ENCODING = 0x0020_0000,
  DNS_QUERY_DNSSEC_CHECKING_DISABLED = 0x0200_0000,
  DNS_QUERY_DNSSEC_OK = 0x0100_0000,
  DNS_QUERY_DONT_RESET_TTL_VALUES = 0x0010_0000,
  DNS_QUERY_DUAL_ADDR = 0x0000_4000,
  DNS_QUERY_MULTICAST_ONLY = 0x0000_0400,
  DNS_QUERY_MULTICAST_VERIFY = 0x0004_0000,
  DNS_QUERY_MULTICAST_WAIT = 0x0002_0000,
  DNS_QUERY_NO_HOSTS_FILE = 0x0000_0040,
  DNS_QUERY_NO_LOCAL_NAME = 0x0000_0020,
  DNS_QUERY_NO_MULTICAST = 0x0000_0800,
  DNS_QUERY_NO_NETBT = 0x0000_0080,
  DNS_QUERY_NO_RECURSION = 0x0000_0004,
  DNS_QUERY_NO_WIRE_QUERY = 0x0000_0010,
  DNS_QUERY_RETURN_MESSAGE = 0x0000_0200,
  DNS_QUERY_STANDARD = 0x0000_0000,
  DNS_QUERY_TREAT_AS_FQDN = 0x0000_1000,
  DNS_QUERY_USE_TCP_ONLY = 0x0000_0002,
  DNS_QUERY_WIRE_ONLY = 0x0000_0100,
}

export enum DnsRecordSection {
  DNSREC_ADDITIONAL = 3,
  DNSREC_ANSWER = 1,
  DNSREC_AUTHORITY = 2,
  DNSREC_QUESTION = 0,
}

export enum DnsType {
  DNS_TYPE_A = 0x0001,
  DNS_TYPE_A6 = 0x0026,
  DNS_TYPE_AAAA = 0x001c,
  DNS_TYPE_AFSDB = 0x0012,
  DNS_TYPE_ANY = 0x00ff,
  DNS_TYPE_ATMA = 0x0022,
  DNS_TYPE_AXFR = 0x00fc,
  DNS_TYPE_CAA = 0x0101,
  DNS_TYPE_CERT = 0x0025,
  DNS_TYPE_CNAME = 0x0005,
  DNS_TYPE_DHCID = 0x0031,
  DNS_TYPE_DNAME = 0x0027,
  DNS_TYPE_DNSKEY = 0x0030,
  DNS_TYPE_DS = 0x002b,
  DNS_TYPE_EID = 0x001f,
  DNS_TYPE_GPOS = 0x001b,
  DNS_TYPE_HINFO = 0x000d,
  DNS_TYPE_HIP = 0x0037,
  DNS_TYPE_HTTPS = 0x0041,
  DNS_TYPE_ISDN = 0x0014,
  DNS_TYPE_IXFR = 0x00fb,
  DNS_TYPE_KEY = 0x0019,
  DNS_TYPE_KX = 0x0024,
  DNS_TYPE_LOC = 0x001d,
  DNS_TYPE_MAILA = 0x00fe,
  DNS_TYPE_MAILB = 0x00fd,
  DNS_TYPE_MB = 0x0007,
  DNS_TYPE_MD = 0x0003,
  DNS_TYPE_MF = 0x0004,
  DNS_TYPE_MG = 0x0008,
  DNS_TYPE_MINFO = 0x000e,
  DNS_TYPE_MR = 0x0009,
  DNS_TYPE_MX = 0x000f,
  DNS_TYPE_NAPTR = 0x0023,
  DNS_TYPE_NIMLOC = 0x0020,
  DNS_TYPE_NS = 0x0002,
  DNS_TYPE_NSAP = 0x0016,
  DNS_TYPE_NSAPPTR = 0x0017,
  DNS_TYPE_NSEC = 0x002f,
  DNS_TYPE_NSEC3 = 0x0032,
  DNS_TYPE_NSEC3PARAM = 0x0033,
  DNS_TYPE_NULL = 0x000a,
  DNS_TYPE_NXT = 0x001e,
  DNS_TYPE_OPT = 0x0029,
  DNS_TYPE_PTR = 0x000c,
  DNS_TYPE_PX = 0x001a,
  DNS_TYPE_RP = 0x0011,
  DNS_TYPE_RRSIG = 0x002e,
  DNS_TYPE_RT = 0x0015,
  DNS_TYPE_SIG = 0x0018,
  DNS_TYPE_SINK = 0x0028,
  DNS_TYPE_SOA = 0x0006,
  DNS_TYPE_SRV = 0x0021,
  DNS_TYPE_SVCB = 0x0040,
  DNS_TYPE_TEXT = 0x0010,
  DNS_TYPE_TKEY = 0x00f9,
  DNS_TYPE_TLSA = 0x0034,
  DNS_TYPE_TSIG = 0x00fa,
  DNS_TYPE_WINS = 0xff01,
  DNS_TYPE_WINSR = 0xff02,
  DNS_TYPE_WKS = 0x000b,
  DNS_TYPE_X25 = 0x0013,
  DNS_TYPE_ZERO = 0x0000,
}

export enum DnsUpdateOption {
  DNS_UPDATE_CACHE_SECURITY_CONTEXT = 0x0000_0200,
  DNS_UPDATE_FORCE_SECURITY_NEGO = 0x0000_0800,
  DNS_UPDATE_REMOTE_SERVER = 0x0000_4000,
  DNS_UPDATE_SECURITY_OFF = 0x0000_0010,
  DNS_UPDATE_SECURITY_ON = 0x0000_0020,
  DNS_UPDATE_SECURITY_ONLY = 0x0000_0100,
  DNS_UPDATE_SECURITY_USE_DEFAULT = 0x0000_0000,
  DNS_UPDATE_SKIP_NO_UPDATE_ADAPTERS = 0x0000_2000,
  DNS_UPDATE_TEST_USE_LOCAL_SYS_ACCT = 0x0000_0400,
  DNS_UPDATE_TRY_ALL_MASTER_SERVERS = 0x0000_1000,
}

export type DNS_PROXY_COMPLETION_ROUTINE = Pointer;
export type DNS_QUERY_COMPLETION_ROUTINE = Pointer;
export type DNS_QUERY_RAW_COMPLETION_ROUTINE = Pointer;
export type DNS_SERVICE_BROWSE_CALLBACK = Pointer;
export type DNS_SERVICE_REGISTER_COMPLETE = Pointer;
export type DNS_SERVICE_RESOLVE_COMPLETE = Pointer;
export type DNS_STATUS = number;
export type IP4_ADDRESS = number;
export type MDNS_QUERY_CALLBACK = Pointer;
export type PCSTR = Pointer;
export type PCWSTR = Pointer;
export type PDNS_APPLICATION_SETTINGS = Pointer;
export type PDNS_CUSTOM_SERVER = Pointer;
export type PDNS_MESSAGE_BUFFER = Pointer;
export type PDNS_PROXY_INFORMATION = Pointer;
export type PDNS_QUERY_CANCEL = Pointer;
export type PDNS_QUERY_RAW_CANCEL = Pointer;
export type PDNS_QUERY_RAW_REQUEST = Pointer;
export type PDNS_QUERY_RAW_RESULT = Pointer;
export type PDNS_QUERY_REQUEST = Pointer;
export type PDNS_QUERY_RESULT = Pointer;
export type PDNS_RECORD = Pointer;
export type PDNS_SERVICE_BROWSE_REQUEST = Pointer;
export type PDNS_SERVICE_CANCEL = Pointer;
export type PDNS_SERVICE_INSTANCE = Pointer;
export type PDNS_SERVICE_REGISTER_REQUEST = Pointer;
export type PDNS_SERVICE_RESOLVE_REQUEST = Pointer;
export type PIP4_ADDRESS = Pointer;
export type PIP4_ARRAY = Pointer;
export type PIP6_ADDRESS = Pointer;
export type PMDNS_QUERY_HANDLE = Pointer;
export type PMDNS_QUERY_REQUEST = Pointer;
export type PSOCKADDR = Pointer;
export type PSTR = Pointer;
export type PWSTR = Pointer;
