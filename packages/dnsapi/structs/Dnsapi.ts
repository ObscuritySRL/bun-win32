import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BOOL, DWORD, HANDLE, LPCWSTR, Nullable, Optional, PDWORD, PHANDLE, PVOID, WORD } from '../types/Dnsapi';
import type {
  DNS_STATUS,
  DnsCharSet,
  DnsConfigType,
  DnsFreeType,
  DnsNameFormat,
  PCSTR,
  PCWSTR,
  PDNS_APPLICATION_SETTINGS,
  PDNS_CUSTOM_SERVER,
  PDNS_MESSAGE_BUFFER,
  PDNS_PROXY_INFORMATION,
  PDNS_QUERY_CANCEL,
  PDNS_QUERY_RAW_CANCEL,
  PDNS_QUERY_RAW_REQUEST,
  PDNS_QUERY_REQUEST,
  PDNS_QUERY_RESULT,
  PDNS_RECORD,
  PDNS_SERVICE_BROWSE_REQUEST,
  PDNS_SERVICE_CANCEL,
  PDNS_SERVICE_INSTANCE,
  PDNS_SERVICE_REGISTER_REQUEST,
  PDNS_SERVICE_RESOLVE_REQUEST,
  PIP4_ADDRESS,
  PIP6_ADDRESS,
  PMDNS_QUERY_HANDLE,
  PMDNS_QUERY_REQUEST,
  PSOCKADDR,
  PWSTR,
} from '../types/Dnsapi';

/**
 * Thin, lazy-loaded FFI bindings for `dnsapi.dll`.
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
 * import Dnsapi, { DnsType, DnsQueryOption } from './structs/Dnsapi';
 * import { read, toArrayBuffer, type Pointer } from 'bun:ffi';
 *
 * const name = Buffer.from('example.com\0', 'utf16le');
 * const ppRecords = Buffer.alloc(8);
 *
 * const status = Dnsapi.DnsQuery_W(name.ptr, DnsType.DNS_TYPE_A, DnsQueryOption.DNS_QUERY_STANDARD, null, ppRecords.ptr, null);
 * if (status === 0) {
 *   const head = read.ptr(ppRecords.ptr) as Pointer;
 *   // ... walk the DNS_RECORD linked list via toArrayBuffer(head, 0, recordSize) ...
 *   Dnsapi.DnsRecordListFree(head, 1); // DnsFreeType.DnsFreeRecordList
 * }
 * ```
 */
class Dnsapi extends Win32 {
  protected static override name = 'dnsapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DnsAcquireContextHandle_A: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsAcquireContextHandle_W: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsCancelQuery: { args: [FFIType.ptr], returns: FFIType.i32 },
    DnsCancelQueryRaw: { args: [FFIType.ptr], returns: FFIType.i32 },
    DnsExtractRecordsFromMessage_UTF8: { args: [FFIType.ptr, FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    DnsExtractRecordsFromMessage_W: { args: [FFIType.ptr, FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    DnsFree: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.void },
    DnsFreeCustomServers: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    DnsFreeProxyName: { args: [FFIType.ptr], returns: FFIType.void },
    DnsGetApplicationSettings: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DnsGetProxyInformation: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DnsIsFlatRecord: { args: [FFIType.ptr], returns: FFIType.i32 },
    DnsIsZtEnabled: { args: [], returns: FFIType.i32 },
    DnsModifyRecordsInSet_A: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsModifyRecordsInSet_UTF8: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsModifyRecordsInSet_W: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsNameCompare_A: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsNameCompare_W: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsQueryConfig: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsQueryEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsQueryRaw: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsQueryRawResultFree: { args: [FFIType.ptr], returns: FFIType.void },
    DnsQuery_A: { args: [FFIType.ptr, FFIType.u16, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsQuery_UTF8: { args: [FFIType.ptr, FFIType.u16, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsQuery_W: { args: [FFIType.ptr, FFIType.u16, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsRecordCompare: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsRecordCopyEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.ptr },
    DnsRecordListFree: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.void },
    DnsRecordSetCompare: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsRecordSetCopyEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.ptr },
    DnsRecordSetDetach: { args: [FFIType.ptr], returns: FFIType.ptr },
    DnsReleaseContextHandle: { args: [FFIType.u64], returns: FFIType.void },
    DnsReplaceRecordSetA: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsReplaceRecordSetUTF8: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsReplaceRecordSetW: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsServiceBrowse: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsServiceBrowseCancel: { args: [FFIType.ptr], returns: FFIType.i32 },
    DnsServiceConstructInstance: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u16, FFIType.u16, FFIType.u16, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    DnsServiceCopyInstance: { args: [FFIType.ptr], returns: FFIType.ptr },
    DnsServiceDeRegister: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DnsServiceFreeInstance: { args: [FFIType.ptr], returns: FFIType.void },
    DnsServiceRegister: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DnsServiceRegisterCancel: { args: [FFIType.ptr], returns: FFIType.u32 },
    DnsServiceResolve: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsServiceResolveCancel: { args: [FFIType.ptr], returns: FFIType.i32 },
    DnsSetApplicationSettings: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DnsStartMulticastQuery: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsStopMulticastQuery: { args: [FFIType.ptr], returns: FFIType.i32 },
    DnsValidateName_A: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DnsValidateName_UTF8: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DnsValidateName_W: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DnsValidateServerStatus: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsWriteQuestionToBuffer_UTF8: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u16, FFIType.u16, FFIType.i32], returns: FFIType.i32 },
    DnsWriteQuestionToBuffer_W: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u16, FFIType.u16, FFIType.i32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsacquirecontexthandle_a
  public static DnsAcquireContextHandle_A(CredentialFlags: DWORD, Credentials: Optional<PVOID>, pContext_out: PHANDLE): DNS_STATUS {
    return Dnsapi.Load('DnsAcquireContextHandle_A')(CredentialFlags, Credentials, pContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsacquirecontexthandle_w
  public static DnsAcquireContextHandle_W(CredentialFlags: DWORD, Credentials: Optional<PVOID>, pContext_out: PHANDLE): DNS_STATUS {
    return Dnsapi.Load('DnsAcquireContextHandle_W')(CredentialFlags, Credentials, pContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnscancelquery
  public static DnsCancelQuery(pCancelHandle: PDNS_QUERY_CANCEL): DNS_STATUS {
    return Dnsapi.Load('DnsCancelQuery')(pCancelHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnscancelqueryraw
  public static DnsCancelQueryRaw(cancelHandle: PDNS_QUERY_RAW_CANCEL): DNS_STATUS {
    return Dnsapi.Load('DnsCancelQueryRaw')(cancelHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsextractrecordsfrommessage_utf8
  public static DnsExtractRecordsFromMessage_UTF8(pDnsBuffer: PDNS_MESSAGE_BUFFER, wMessageLength: WORD, ppRecord_out: PVOID): DNS_STATUS {
    return Dnsapi.Load('DnsExtractRecordsFromMessage_UTF8')(pDnsBuffer, wMessageLength, ppRecord_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsextractrecordsfrommessage_w
  public static DnsExtractRecordsFromMessage_W(pDnsBuffer: PDNS_MESSAGE_BUFFER, wMessageLength: WORD, ppRecord_out: PVOID): DNS_STATUS {
    return Dnsapi.Load('DnsExtractRecordsFromMessage_W')(pDnsBuffer, wMessageLength, ppRecord_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsfree
  public static DnsFree(pData: Optional<PVOID>, FreeType: DnsFreeType): void {
    return Dnsapi.Load('DnsFree')(pData, FreeType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsfreecustomservers
  public static DnsFreeCustomServers(pcServers_in_out: PDWORD, ppServers_in_out: PVOID): void {
    return Dnsapi.Load('DnsFreeCustomServers')(pcServers_in_out, ppServers_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsfreeproxyname
  public static DnsFreeProxyName(proxyName: Optional<PWSTR>): void {
    return Dnsapi.Load('DnsFreeProxyName')(proxyName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsgetapplicationsettings
  public static DnsGetApplicationSettings(pcServers_out: PDWORD, ppDefaultServers_out: PVOID, pSettings_out: Optional<PDNS_APPLICATION_SETTINGS>): DWORD {
    return Dnsapi.Load('DnsGetApplicationSettings')(pcServers_out, ppDefaultServers_out, pSettings_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsgetproxyinformation
  public static DnsGetProxyInformation(
    hostName: PCWSTR,
    proxyInformation_in_out: PDNS_PROXY_INFORMATION,
    defaultProxyInformation_in_out: Optional<PDNS_PROXY_INFORMATION>,
    completionRoutine: Optional<PVOID>,
    completionContext: Optional<PVOID>,
  ): DWORD {
    return Dnsapi.Load('DnsGetProxyInformation')(hostName, proxyInformation_in_out, defaultProxyInformation_in_out, completionRoutine, completionContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsisflatrecord
  public static DnsIsFlatRecord(pRecord: PDNS_RECORD): BOOL {
    return Dnsapi.Load('DnsIsFlatRecord')(pRecord);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsisztenabled
  public static DnsIsZtEnabled(): BOOL {
    return Dnsapi.Load('DnsIsZtEnabled')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsmodifyrecordsinset_a
  public static DnsModifyRecordsInSet_A(
    pAddRecords: Optional<PDNS_RECORD>,
    pDeleteRecords: Optional<PDNS_RECORD>,
    Options: DWORD,
    hCredentials: Optional<HANDLE>,
    pExtraList_in_out: Optional<PVOID>,
    pReserved_in_out: Optional<PVOID>,
  ): DNS_STATUS {
    return Dnsapi.Load('DnsModifyRecordsInSet_A')(pAddRecords, pDeleteRecords, Options, hCredentials, pExtraList_in_out, pReserved_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsmodifyrecordsinset_utf8
  public static DnsModifyRecordsInSet_UTF8(
    pAddRecords: Optional<PDNS_RECORD>,
    pDeleteRecords: Optional<PDNS_RECORD>,
    Options: DWORD,
    hCredentials: Optional<HANDLE>,
    pExtraList_in_out: Optional<PVOID>,
    pReserved_in_out: Optional<PVOID>,
  ): DNS_STATUS {
    return Dnsapi.Load('DnsModifyRecordsInSet_UTF8')(pAddRecords, pDeleteRecords, Options, hCredentials, pExtraList_in_out, pReserved_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsmodifyrecordsinset_w
  public static DnsModifyRecordsInSet_W(
    pAddRecords: Optional<PDNS_RECORD>,
    pDeleteRecords: Optional<PDNS_RECORD>,
    Options: DWORD,
    hCredentials: Optional<HANDLE>,
    pExtraList_in_out: Optional<PVOID>,
    pReserved_in_out: Optional<PVOID>,
  ): DNS_STATUS {
    return Dnsapi.Load('DnsModifyRecordsInSet_W')(pAddRecords, pDeleteRecords, Options, hCredentials, pExtraList_in_out, pReserved_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsnamecompare_a
  public static DnsNameCompare_A(pName1: PCSTR, pName2: PCSTR): BOOL {
    return Dnsapi.Load('DnsNameCompare_A')(pName1, pName2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsnamecompare_w
  public static DnsNameCompare_W(pName1: PCWSTR, pName2: PCWSTR): BOOL {
    return Dnsapi.Load('DnsNameCompare_W')(pName1, pName2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsqueryconfig
  public static DnsQueryConfig(Config: DnsConfigType, Flag: DWORD, pwsAdapterName: Optional<PCWSTR>, pReserved: Optional<PVOID>, pBuffer_out: Optional<PVOID>, pBufLen_in_out: PDWORD): DNS_STATUS {
    return Dnsapi.Load('DnsQueryConfig')(Config, Flag, pwsAdapterName, pReserved, pBuffer_out, pBufLen_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsqueryex
  public static DnsQueryEx(pQueryRequest: PDNS_QUERY_REQUEST, pQueryResults_in_out: PDNS_QUERY_RESULT, pCancelHandle_in_out: Optional<PDNS_QUERY_CANCEL>): DNS_STATUS {
    return Dnsapi.Load('DnsQueryEx')(pQueryRequest, pQueryResults_in_out, pCancelHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsqueryraw
  public static DnsQueryRaw(queryRequest: PDNS_QUERY_RAW_REQUEST, cancelHandle_in_out: PDNS_QUERY_RAW_CANCEL): DNS_STATUS {
    return Dnsapi.Load('DnsQueryRaw')(queryRequest, cancelHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsqueryrawresultfree
  public static DnsQueryRawResultFree(queryResults: PVOID): void {
    return Dnsapi.Load('DnsQueryRawResultFree')(queryResults);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsquery_a
  public static DnsQuery_A(pszName: PCSTR, wType: WORD, Options: DWORD, pExtra_in_out: Optional<PVOID>, ppQueryResults_out: PVOID, pReserved_out: Optional<PVOID>): DNS_STATUS {
    return Dnsapi.Load('DnsQuery_A')(pszName, wType, Options, pExtra_in_out, ppQueryResults_out, pReserved_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsquery_utf8
  public static DnsQuery_UTF8(pszName: PCSTR, wType: WORD, Options: DWORD, pExtra_in_out: Optional<PVOID>, ppQueryResults_out: PVOID, pReserved_out: Optional<PVOID>): DNS_STATUS {
    return Dnsapi.Load('DnsQuery_UTF8')(pszName, wType, Options, pExtra_in_out, ppQueryResults_out, pReserved_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsquery_w
  public static DnsQuery_W(pszName: PCWSTR, wType: WORD, Options: DWORD, pExtra_in_out: Optional<PVOID>, ppQueryResults_out: PVOID, pReserved_out: Optional<PVOID>): DNS_STATUS {
    return Dnsapi.Load('DnsQuery_W')(pszName, wType, Options, pExtra_in_out, ppQueryResults_out, pReserved_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsrecordcompare
  public static DnsRecordCompare(pRecord1: PDNS_RECORD, pRecord2: PDNS_RECORD): BOOL {
    return Dnsapi.Load('DnsRecordCompare')(pRecord1, pRecord2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsrecordcopyex
  public static DnsRecordCopyEx(pRecord: PDNS_RECORD, CharSetIn: DnsCharSet, CharSetOut: DnsCharSet): PDNS_RECORD {
    return Dnsapi.Load('DnsRecordCopyEx')(pRecord, CharSetIn, CharSetOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsrecordlistfree
  public static DnsRecordListFree(p_in_out: Optional<PDNS_RECORD>, t: DnsFreeType): void {
    return Dnsapi.Load('DnsRecordListFree')(p_in_out, t);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsrecordsetcompare
  public static DnsRecordSetCompare(pRR1_in_out: PDNS_RECORD, pRR2_in_out: PDNS_RECORD, ppDiff1_out: Optional<PVOID>, ppDiff2_out: Optional<PVOID>): BOOL {
    return Dnsapi.Load('DnsRecordSetCompare')(pRR1_in_out, pRR2_in_out, ppDiff1_out, ppDiff2_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsrecordsetcopyex
  public static DnsRecordSetCopyEx(pRecordSet: PDNS_RECORD, CharSetIn: DnsCharSet, CharSetOut: DnsCharSet): PDNS_RECORD {
    return Dnsapi.Load('DnsRecordSetCopyEx')(pRecordSet, CharSetIn, CharSetOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsrecordsetdetach
  public static DnsRecordSetDetach(pRecordList_in_out: PDNS_RECORD): PDNS_RECORD {
    return Dnsapi.Load('DnsRecordSetDetach')(pRecordList_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsreleasecontexthandle
  public static DnsReleaseContextHandle(hContext: HANDLE): void {
    return Dnsapi.Load('DnsReleaseContextHandle')(hContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsreplacerecordseta
  public static DnsReplaceRecordSetA(pReplaceSet: PDNS_RECORD, Options: DWORD, hContext: Optional<HANDLE>, pExtraInfo_in_out: Optional<PVOID>, pReserved_in_out: Optional<PVOID>): DNS_STATUS {
    return Dnsapi.Load('DnsReplaceRecordSetA')(pReplaceSet, Options, hContext, pExtraInfo_in_out, pReserved_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsreplacerecordsetutf8
  public static DnsReplaceRecordSetUTF8(pReplaceSet: PDNS_RECORD, Options: DWORD, hContext: Optional<HANDLE>, pExtraInfo_in_out: Optional<PVOID>, pReserved_in_out: Optional<PVOID>): DNS_STATUS {
    return Dnsapi.Load('DnsReplaceRecordSetUTF8')(pReplaceSet, Options, hContext, pExtraInfo_in_out, pReserved_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsreplacerecordsetw
  public static DnsReplaceRecordSetW(pReplaceSet: PDNS_RECORD, Options: DWORD, hContext: Optional<HANDLE>, pExtraInfo_in_out: Optional<PVOID>, pReserved_in_out: Optional<PVOID>): DNS_STATUS {
    return Dnsapi.Load('DnsReplaceRecordSetW')(pReplaceSet, Options, hContext, pExtraInfo_in_out, pReserved_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsservicebrowse
  public static DnsServiceBrowse(pRequest: PDNS_SERVICE_BROWSE_REQUEST, pCancel_in_out: PDNS_SERVICE_CANCEL): DNS_STATUS {
    return Dnsapi.Load('DnsServiceBrowse')(pRequest, pCancel_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsservicebrowsecancel
  public static DnsServiceBrowseCancel(pCancelHandle: PDNS_SERVICE_CANCEL): DNS_STATUS {
    return Dnsapi.Load('DnsServiceBrowseCancel')(pCancelHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsserviceconstructinstance
  public static DnsServiceConstructInstance(
    pServiceName: PCWSTR,
    pHostName: PCWSTR,
    pIp4: Optional<PIP4_ADDRESS>,
    pIp6: Optional<PIP6_ADDRESS>,
    wPort: WORD,
    wPriority: WORD,
    wWeight: WORD,
    dwPropertiesCount: DWORD,
    keys: PVOID,
    values: PVOID,
  ): PDNS_SERVICE_INSTANCE {
    return Dnsapi.Load('DnsServiceConstructInstance')(pServiceName, pHostName, pIp4, pIp6, wPort, wPriority, wWeight, dwPropertiesCount, keys, values);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsservicecopyinstance
  public static DnsServiceCopyInstance(pOrig: PDNS_SERVICE_INSTANCE): PDNS_SERVICE_INSTANCE {
    return Dnsapi.Load('DnsServiceCopyInstance')(pOrig);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsservicederegister
  public static DnsServiceDeRegister(pRequest: PDNS_SERVICE_REGISTER_REQUEST, pCancel_in_out: Optional<PDNS_SERVICE_CANCEL>): DWORD {
    return Dnsapi.Load('DnsServiceDeRegister')(pRequest, pCancel_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsservicefreeinstance
  public static DnsServiceFreeInstance(pInstance: PDNS_SERVICE_INSTANCE): void {
    return Dnsapi.Load('DnsServiceFreeInstance')(pInstance);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsserviceregister
  public static DnsServiceRegister(pRequest: PDNS_SERVICE_REGISTER_REQUEST, pCancel_in_out: Optional<PDNS_SERVICE_CANCEL>): DWORD {
    return Dnsapi.Load('DnsServiceRegister')(pRequest, pCancel_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsserviceregistercancel
  public static DnsServiceRegisterCancel(pCancelHandle: PDNS_SERVICE_CANCEL): DWORD {
    return Dnsapi.Load('DnsServiceRegisterCancel')(pCancelHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsserviceresolve
  public static DnsServiceResolve(pRequest: PDNS_SERVICE_RESOLVE_REQUEST, pCancel_in_out: PDNS_SERVICE_CANCEL): DNS_STATUS {
    return Dnsapi.Load('DnsServiceResolve')(pRequest, pCancel_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsserviceresolvecancel
  public static DnsServiceResolveCancel(pCancelHandle: PDNS_SERVICE_CANCEL): DNS_STATUS {
    return Dnsapi.Load('DnsServiceResolveCancel')(pCancelHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnssetapplicationsettings
  public static DnsSetApplicationSettings(cServers: DWORD, pServers: Nullable<PDNS_CUSTOM_SERVER>, pSettings: Optional<PDNS_APPLICATION_SETTINGS>): DWORD {
    return Dnsapi.Load('DnsSetApplicationSettings')(cServers, pServers, pSettings);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsstartmulticastquery
  public static DnsStartMulticastQuery(pQueryRequest: PMDNS_QUERY_REQUEST, pHandle_in_out: PMDNS_QUERY_HANDLE): DNS_STATUS {
    return Dnsapi.Load('DnsStartMulticastQuery')(pQueryRequest, pHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsstopmulticastquery
  public static DnsStopMulticastQuery(pHandle_in_out: PMDNS_QUERY_HANDLE): DNS_STATUS {
    return Dnsapi.Load('DnsStopMulticastQuery')(pHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsvalidatename_a
  public static DnsValidateName_A(pszName: PCSTR, Format: DnsNameFormat): DNS_STATUS {
    return Dnsapi.Load('DnsValidateName_A')(pszName, Format);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsvalidatename_utf8
  public static DnsValidateName_UTF8(pszName: PCSTR, Format: DnsNameFormat): DNS_STATUS {
    return Dnsapi.Load('DnsValidateName_UTF8')(pszName, Format);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsvalidatename_w
  public static DnsValidateName_W(pszName: PCWSTR, Format: DnsNameFormat): DNS_STATUS {
    return Dnsapi.Load('DnsValidateName_W')(pszName, Format);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnsvalidateserverstatus
  public static DnsValidateServerStatus(server: PSOCKADDR, queryName: Optional<PCWSTR>, serverStatus_out: PDWORD): DNS_STATUS {
    return Dnsapi.Load('DnsValidateServerStatus')(server, queryName, serverStatus_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnswritequestiontobuffer_utf8
  public static DnsWriteQuestionToBuffer_UTF8(pDnsBuffer_in_out: PDNS_MESSAGE_BUFFER, pdwBufferSize_in_out: PDWORD, pszName: PCSTR, wType: WORD, Xid: WORD, fRecursionDesired: BOOL): BOOL {
    return Dnsapi.Load('DnsWriteQuestionToBuffer_UTF8')(pDnsBuffer_in_out, pdwBufferSize_in_out, pszName, wType, Xid, fRecursionDesired);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/windns/nf-windns-dnswritequestiontobuffer_w
  public static DnsWriteQuestionToBuffer_W(pDnsBuffer_in_out: PDNS_MESSAGE_BUFFER, pdwBufferSize_in_out: PDWORD, pszName: PCWSTR, wType: WORD, Xid: WORD, fRecursionDesired: BOOL): BOOL {
    return Dnsapi.Load('DnsWriteQuestionToBuffer_W')(pDnsBuffer_in_out, pdwBufferSize_in_out, pszName, wType, Xid, fRecursionDesired);
  }
}

export default Dnsapi;
