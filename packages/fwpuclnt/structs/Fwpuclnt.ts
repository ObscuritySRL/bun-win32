import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { DWORD, HANDLE, INT, LPCWSTR, LPVOID, NULL, PHANDLE, PULONG, PVOID, ULONG } from '../types/Fwpuclnt';
import type {
  FWPM_CALLOUT_CHANGE_CALLBACK0,
  FWPM_CONNECTION_CALLBACK0,
  FWPM_DYNAMIC_KEYWORD_CALLBACK0,
  FWPM_ENGINE_OPTION,
  FWPM_FILTER_CHANGE_CALLBACK0,
  FWPM_NET_EVENT_CALLBACK0,
  FWPM_NET_EVENT_CALLBACK1,
  FWPM_NET_EVENT_CALLBACK2,
  FWPM_NET_EVENT_CALLBACK3,
  FWPM_NET_EVENT_CALLBACK4,
  FWPM_PROVIDER_CHANGE_CALLBACK0,
  FWPM_PROVIDER_CONTEXT_CHANGE_CALLBACK0,
  FWPM_SUBLAYER_CHANGE_CALLBACK0,
  FWPM_SYSTEM_PORTS_CALLBACK0,
  FWPM_VSWITCH_EVENT_CALLBACK0,
  IPSEC_SA_CONTEXT_CALLBACK0,
  IPSEC_SA_SPI,
  LPGUID,
  LPWSAOVERLAPPED,
  LPWSAOVERLAPPED_COMPLETION_ROUTINE,
  LUID,
  PACL,
  PFWPM_CALLOUT0,
  PFWPM_CALLOUT_ENUM_TEMPLATE0,
  PFWPM_CALLOUT_SUBSCRIPTION0,
  PFWPM_CONNECTION0,
  PFWPM_CONNECTION_ENUM_TEMPLATE0,
  PFWPM_CONNECTION_SUBSCRIPTION0,
  PFWPM_FILTER0,
  PFWPM_FILTER_CONDITION0,
  PFWPM_FILTER_ENUM_TEMPLATE0,
  PFWPM_FILTER_SUBSCRIPTION0,
  PFWPM_LAYER0,
  PFWPM_LAYER_ENUM_TEMPLATE0,
  PFWPM_NET_EVENT0,
  PFWPM_NET_EVENT1,
  PFWPM_NET_EVENT2,
  PFWPM_NET_EVENT3,
  PFWPM_NET_EVENT4,
  PFWPM_NET_EVENT5,
  PFWPM_NET_EVENT_ENUM_TEMPLATE0,
  PFWPM_NET_EVENT_SUBSCRIPTION0,
  PFWPM_PROVIDER0,
  PFWPM_PROVIDER_CONTEXT0,
  PFWPM_PROVIDER_CONTEXT1,
  PFWPM_PROVIDER_CONTEXT2,
  PFWPM_PROVIDER_CONTEXT3,
  PFWPM_PROVIDER_CONTEXT_ENUM_TEMPLATE0,
  PFWPM_PROVIDER_CONTEXT_SUBSCRIPTION0,
  PFWPM_PROVIDER_ENUM_TEMPLATE0,
  PFWPM_PROVIDER_SUBSCRIPTION0,
  PFWPM_SESSION0,
  PFWPM_SESSION_ENUM_TEMPLATE0,
  PFWPM_SUBLAYER0,
  PFWPM_SUBLAYER_ENUM_TEMPLATE0,
  PFWPM_SUBLAYER_SUBSCRIPTION0,
  PFWPM_SYSTEM_PORTS0,
  PFWPM_VSWITCH_EVENT_SUBSCRIPTION0,
  PFWPS_ALE_ENDPOINT_ENUM_TEMPLATE0,
  PFWPS_ALE_ENDPOINT_PROPERTIES0,
  PFWP_BYTE_BLOB,
  PFWP_VALUE0,
  PIKEEXT_SA_DETAILS0,
  PIKEEXT_SA_DETAILS1,
  PIKEEXT_SA_DETAILS2,
  PIKEEXT_SA_ENUM_TEMPLATE0,
  PIKEEXT_STATISTICS0,
  PIKEEXT_STATISTICS1,
  PIPSEC_DOSP_STATE0,
  PIPSEC_DOSP_STATE_ENUM_TEMPLATE0,
  PIPSEC_DOSP_STATISTICS0,
  PIPSEC_GETSPI0,
  PIPSEC_GETSPI1,
  PIPSEC_KEY_MANAGER0,
  PIPSEC_KEY_MANAGER_CALLBACKS0,
  PIPSEC_SA_BUNDLE0,
  PIPSEC_SA_BUNDLE1,
  PIPSEC_SA_CONTEXT0,
  PIPSEC_SA_CONTEXT1,
  PIPSEC_SA_CONTEXT_ENUM_TEMPLATE0,
  PIPSEC_SA_CONTEXT_SUBSCRIPTION0,
  PIPSEC_SA_DETAILS0,
  PIPSEC_SA_DETAILS1,
  PIPSEC_SA_ENUM_TEMPLATE0,
  PIPSEC_SA_SPI,
  PIPSEC_STATISTICS0,
  PIPSEC_STATISTICS1,
  PIPSEC_TRAFFIC0,
  PIPSEC_TRAFFIC1,
  PIPSEC_VIRTUAL_IF_TUNNEL_INFO0,
  PSECURITY_DESCRIPTOR,
  PSEC_WINNT_AUTH_IDENTITY_W,
  PSID,
  PSOCKADDR,
  PSOCKET_PEER_TARGET_NAME,
  PSOCKET_SECURITY_QUERY_INFO,
  PSOCKET_SECURITY_QUERY_TEMPLATE,
  PSOCKET_SECURITY_SETTINGS,
  PUINT32,
  PUINT64,
  SECURITY_INFORMATION,
  SOCKET,
  UINT16,
  UINT32,
  UINT64,
} from '../types/Fwpuclnt';

/**
 * Thin, lazy-loaded FFI bindings for `fwpuclnt.dll`.
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
 * import Fwpuclnt from './structs/Fwpuclnt';
 *
 * // Lazy: bind on first call
 * const engineHandle = Buffer.alloc(8);
 * Fwpuclnt.FwpmEngineOpen0(null, RPC_C_AUTHN_WINNT, null, null, engineHandle.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Fwpuclnt.Preload(['FwpmEngineOpen0', 'FwpmEngineClose0']);
 * ```
 */
class Fwpuclnt extends Win32 {
  protected static override name = 'fwpuclnt.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    FwpmCalloutAdd0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmCalloutCreateEnumHandle0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmCalloutDeleteById0: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    FwpmCalloutDeleteByKey0: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FwpmCalloutDestroyEnumHandle0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmCalloutEnum0: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmCalloutGetById0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    FwpmCalloutGetByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmCalloutGetSecurityInfoByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmCalloutSetSecurityInfoByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmCalloutSubscribeChanges0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmCalloutSubscriptionsGet0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmCalloutUnsubscribeChanges0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmConnectionCreateEnumHandle0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmConnectionDestroyEnumHandle0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmConnectionEnum0: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmConnectionGetById0: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FwpmConnectionGetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmConnectionSetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmConnectionSubscribe0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmConnectionUnsubscribe0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmDynamicKeywordSubscribe0: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmDynamicKeywordUnsubscribe0: { args: [FFIType.u64], returns: FFIType.u32 },
    FwpmEngineClose0: { args: [FFIType.u64], returns: FFIType.u32 },
    FwpmEngineGetOption0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    FwpmEngineGetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmEngineOpen0: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmEngineSetOption0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    FwpmEngineSetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmFilterAdd0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmFilterCreateEnumHandle0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmFilterDeleteById0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmFilterDeleteByKey0: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FwpmFilterDestroyEnumHandle0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmFilterEnum0: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmFilterGetById0: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FwpmFilterGetByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmFilterGetSecurityInfoByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmFilterSetSecurityInfoByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmFilterSubscribeChanges0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmFilterSubscriptionsGet0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmFilterUnsubscribeChanges0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmFreeMemory0: { args: [FFIType.ptr], returns: FFIType.void },
    FwpmGetAppIdFromFileName0: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmIPsecTunnelAdd0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmIPsecTunnelAdd1: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmIPsecTunnelAdd2: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmIPsecTunnelAdd3: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmIPsecTunnelDeleteByKey0: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FwpmLayerCreateEnumHandle0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmLayerDestroyEnumHandle0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmLayerEnum0: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmLayerGetById0: { args: [FFIType.u64, FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    FwpmLayerGetByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmLayerGetSecurityInfoByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmLayerSetSecurityInfoByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmNetEventCreateEnumHandle0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmNetEventDestroyEnumHandle0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmNetEventEnum0: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmNetEventEnum1: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmNetEventEnum2: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmNetEventEnum3: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmNetEventEnum4: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmNetEventEnum5: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmNetEventSubscribe0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmNetEventSubscribe1: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmNetEventSubscribe2: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmNetEventSubscribe3: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmNetEventSubscribe4: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmNetEventSubscriptionsGet0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmNetEventUnsubscribe0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmNetEventsGetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmNetEventsSetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderAdd0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextAdd0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextAdd1: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextAdd2: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextAdd3: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextCreateEnumHandle0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextDeleteById0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmProviderContextDeleteByKey0: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextDestroyEnumHandle0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmProviderContextEnum0: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextEnum1: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextEnum2: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextEnum3: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextGetById0: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextGetById1: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextGetById2: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextGetById3: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextGetByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextGetByKey1: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextGetByKey2: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextGetByKey3: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextGetSecurityInfoByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextSetSecurityInfoByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextSubscribeChanges0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextSubscriptionsGet0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderContextUnsubscribeChanges0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmProviderCreateEnumHandle0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderDeleteByKey0: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderDestroyEnumHandle0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmProviderEnum0: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderGetByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderGetSecurityInfoByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderSetSecurityInfoByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderSubscribeChanges0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderSubscriptionsGet0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmProviderUnsubscribeChanges0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmSessionCreateEnumHandle0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmSessionDestroyEnumHandle0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmSessionEnum0: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmSubLayerAdd0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmSubLayerCreateEnumHandle0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmSubLayerDeleteByKey0: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FwpmSubLayerDestroyEnumHandle0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmSubLayerEnum0: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmSubLayerGetByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmSubLayerGetSecurityInfoByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmSubLayerSetSecurityInfoByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmSubLayerSubscribeChanges0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmSubLayerSubscriptionsGet0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmSubLayerUnsubscribeChanges0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmSystemPortsGet0: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FwpmSystemPortsSubscribe0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmSystemPortsUnsubscribe0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmTransactionAbort0: { args: [FFIType.u64], returns: FFIType.u32 },
    FwpmTransactionBegin0: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    FwpmTransactionCommit0: { args: [FFIType.u64], returns: FFIType.u32 },
    FwpmvSwitchEventSubscribe0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmvSwitchEventUnsubscribe0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpmvSwitchEventsGetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpmvSwitchEventsSetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpsAleEndpointCreateEnumHandle0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpsAleEndpointDestroyEnumHandle0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    FwpsAleEndpointEnum0: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpsAleEndpointGetById0: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FwpsAleEndpointGetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpsAleEndpointSetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FwpsOpenToken0: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    IPsecDospGetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecDospGetStatistics0: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    IPsecDospSetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecDospStateCreateEnumHandle0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecDospStateDestroyEnumHandle0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    IPsecDospStateEnum0: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecGetStatistics0: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    IPsecGetStatistics1: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    IPsecKeyManagerAddAndRegister0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecKeyManagerGetSecurityInfoByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecKeyManagerSetSecurityInfoByKey0: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecKeyManagerUnregisterAndDelete0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    IPsecKeyManagersGet0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextAddInbound0: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextAddInbound1: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextAddOutbound0: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextAddOutbound1: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextCreate0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextCreate1: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextCreateEnumHandle0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextDeleteById0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    IPsecSaContextDestroyEnumHandle0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    IPsecSaContextEnum0: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextEnum1: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextExpire0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    IPsecSaContextGetById0: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextGetById1: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextGetSpi0: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextGetSpi1: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextSetSpi0: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    IPsecSaContextSubscribe0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextSubscriptionsGet0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaContextUnsubscribe0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    IPsecSaContextUpdate0: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaCreateEnumHandle0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaDbGetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaDbSetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaDestroyEnumHandle0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    IPsecSaEnum0: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IPsecSaEnum1: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IkeextGetStatistics0: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    IkeextGetStatistics1: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    IkeextSaCreateEnumHandle0: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IkeextSaDbGetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IkeextSaDbSetSecurityInfo0: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IkeextSaDeleteById0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    IkeextSaDestroyEnumHandle0: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    IkeextSaEnum0: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IkeextSaEnum1: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IkeextSaEnum2: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IkeextSaGetById0: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    IkeextSaGetById1: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IkeextSaGetById2: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WSADeleteSocketPeerTargetName: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAImpersonateSocketPeer: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WSAQuerySocketSecurity: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSARevertImpersonation: { args: [], returns: FFIType.i32 },
    WSASetSocketPeerTargetName: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSASetSocketSecurity: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmcalloutadd0
  public static FwpmCalloutAdd0(engineHandle: HANDLE, callout: PFWPM_CALLOUT0, sd: PSECURITY_DESCRIPTOR | NULL, id: PUINT32 | NULL): DWORD {
    return Fwpuclnt.Load('FwpmCalloutAdd0')(engineHandle, callout, sd, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmcalloutcreateenumhandle0
  public static FwpmCalloutCreateEnumHandle0(engineHandle: HANDLE, enumTemplate: PFWPM_CALLOUT_ENUM_TEMPLATE0 | NULL, enumHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmCalloutCreateEnumHandle0')(engineHandle, enumTemplate, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmcalloutdeletebyid0
  public static FwpmCalloutDeleteById0(engineHandle: HANDLE, id: UINT32): DWORD {
    return Fwpuclnt.Load('FwpmCalloutDeleteById0')(engineHandle, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmcalloutdeletebykey0
  public static FwpmCalloutDeleteByKey0(engineHandle: HANDLE, key: LPGUID): DWORD {
    return Fwpuclnt.Load('FwpmCalloutDeleteByKey0')(engineHandle, key);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmcalloutdestroyenumhandle0
  public static FwpmCalloutDestroyEnumHandle0(engineHandle: HANDLE, enumHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmCalloutDestroyEnumHandle0')(engineHandle, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmcalloutenum0
  public static FwpmCalloutEnum0(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_CALLOUT0, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmCalloutEnum0')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmcalloutgetbyid0
  public static FwpmCalloutGetById0(engineHandle: HANDLE, id: UINT32, callout: PFWPM_CALLOUT0): DWORD {
    return Fwpuclnt.Load('FwpmCalloutGetById0')(engineHandle, id, callout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmcalloutgetbykey0
  public static FwpmCalloutGetByKey0(engineHandle: HANDLE, key: LPGUID, callout: PFWPM_CALLOUT0): DWORD {
    return Fwpuclnt.Load('FwpmCalloutGetByKey0')(engineHandle, key, callout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmcalloutgetsecurityinfobykey0
  public static FwpmCalloutGetSecurityInfoByKey0(engineHandle: HANDLE, key: LPGUID | NULL, securityInfo: SECURITY_INFORMATION, sidOwner: PVOID, sidGroup: PVOID, dacl: PVOID, sacl: PVOID, securityDescriptor: PVOID): DWORD {
    return Fwpuclnt.Load('FwpmCalloutGetSecurityInfoByKey0')(engineHandle, key, securityInfo, sidOwner, sidGroup, dacl, sacl, securityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmcalloutsetsecurityinfobykey0
  public static FwpmCalloutSetSecurityInfoByKey0(engineHandle: HANDLE, key: LPGUID | NULL, securityInfo: SECURITY_INFORMATION, sidOwner: PSID | NULL, sidGroup: PSID | NULL, dacl: PACL | NULL, sacl: PACL | NULL): DWORD {
    return Fwpuclnt.Load('FwpmCalloutSetSecurityInfoByKey0')(engineHandle, key, securityInfo, sidOwner, sidGroup, dacl, sacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmcalloutsubscribechanges0
  public static FwpmCalloutSubscribeChanges0(engineHandle: HANDLE, subscription: PFWPM_CALLOUT_SUBSCRIPTION0, callback: FWPM_CALLOUT_CHANGE_CALLBACK0, context: LPVOID | NULL, changeHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmCalloutSubscribeChanges0')(engineHandle, subscription, callback, context, changeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmcalloutsubscriptionsget0
  public static FwpmCalloutSubscriptionsGet0(engineHandle: HANDLE, entries: PFWPM_CALLOUT_SUBSCRIPTION0, numEntries: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmCalloutSubscriptionsGet0')(engineHandle, entries, numEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmcalloutunsubscribechanges0
  public static FwpmCalloutUnsubscribeChanges0(engineHandle: HANDLE, changeHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmCalloutUnsubscribeChanges0')(engineHandle, changeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmconnectioncreateenumhandle0
  public static FwpmConnectionCreateEnumHandle0(engineHandle: HANDLE, enumTemplate: PFWPM_CONNECTION_ENUM_TEMPLATE0 | NULL, enumHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmConnectionCreateEnumHandle0')(engineHandle, enumTemplate, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmconnectiondestroyenumhandle0
  public static FwpmConnectionDestroyEnumHandle0(engineHandle: HANDLE, enumHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmConnectionDestroyEnumHandle0')(engineHandle, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmconnectionenum0
  public static FwpmConnectionEnum0(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_CONNECTION0, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmConnectionEnum0')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmconnectiongetbyid0
  public static FwpmConnectionGetById0(engineHandle: HANDLE, id: UINT64, connection: PFWPM_CONNECTION0): DWORD {
    return Fwpuclnt.Load('FwpmConnectionGetById0')(engineHandle, id, connection);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmconnectiongetsecurityinfo0
  public static FwpmConnectionGetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PVOID, sidGroup: PVOID, dacl: PVOID, sacl: PVOID, securityDescriptor: PVOID): DWORD {
    return Fwpuclnt.Load('FwpmConnectionGetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl, securityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmconnectionsetsecurityinfo0
  public static FwpmConnectionSetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PSID | NULL, sidGroup: PSID | NULL, dacl: PACL | NULL, sacl: PACL | NULL): DWORD {
    return Fwpuclnt.Load('FwpmConnectionSetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmconnectionsubscribe0
  public static FwpmConnectionSubscribe0(engineHandle: HANDLE, subscription: PFWPM_CONNECTION_SUBSCRIPTION0, callback: FWPM_CONNECTION_CALLBACK0, context: LPVOID | NULL, eventsHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmConnectionSubscribe0')(engineHandle, subscription, callback, context, eventsHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmconnectionunsubscribe0
  public static FwpmConnectionUnsubscribe0(engineHandle: HANDLE, eventsHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmConnectionUnsubscribe0')(engineHandle, eventsHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmdynamickeywordsubscribe0
  public static FwpmDynamicKeywordSubscribe0(flags: DWORD, callback: FWPM_DYNAMIC_KEYWORD_CALLBACK0, context: LPVOID | NULL, subscriptionHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmDynamicKeywordSubscribe0')(flags, callback, context, subscriptionHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmdynamickeywordunsubscribe0
  public static FwpmDynamicKeywordUnsubscribe0(subscriptionHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmDynamicKeywordUnsubscribe0')(subscriptionHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmengineclose0
  public static FwpmEngineClose0(engineHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmEngineClose0')(engineHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmenginegetoption0
  public static FwpmEngineGetOption0(engineHandle: HANDLE, option: FWPM_ENGINE_OPTION, value: PFWP_VALUE0): DWORD {
    return Fwpuclnt.Load('FwpmEngineGetOption0')(engineHandle, option, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmenginegetsecurityinfo0
  public static FwpmEngineGetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PVOID, sidGroup: PVOID, dacl: PVOID, sacl: PVOID, securityDescriptor: PVOID): DWORD {
    return Fwpuclnt.Load('FwpmEngineGetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl, securityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmengineopen0
  public static FwpmEngineOpen0(serverName: LPCWSTR | NULL, authnService: UINT32, authIdentity: PSEC_WINNT_AUTH_IDENTITY_W | NULL, session: PFWPM_SESSION0 | NULL, engineHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmEngineOpen0')(serverName, authnService, authIdentity, session, engineHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmenginesetoption0
  public static FwpmEngineSetOption0(engineHandle: HANDLE, option: FWPM_ENGINE_OPTION, newValue: PFWP_VALUE0): DWORD {
    return Fwpuclnt.Load('FwpmEngineSetOption0')(engineHandle, option, newValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmenginesetsecurityinfo0
  public static FwpmEngineSetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PSID | NULL, sidGroup: PSID | NULL, dacl: PACL | NULL, sacl: PACL | NULL): DWORD {
    return Fwpuclnt.Load('FwpmEngineSetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmfilteradd0
  public static FwpmFilterAdd0(engineHandle: HANDLE, filter: PFWPM_FILTER0, sd: PSECURITY_DESCRIPTOR | NULL, id: PUINT64 | NULL): DWORD {
    return Fwpuclnt.Load('FwpmFilterAdd0')(engineHandle, filter, sd, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmfiltercreateenumhandle0
  public static FwpmFilterCreateEnumHandle0(engineHandle: HANDLE, enumTemplate: PFWPM_FILTER_ENUM_TEMPLATE0 | NULL, enumHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmFilterCreateEnumHandle0')(engineHandle, enumTemplate, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmfilterdeletebyid0
  public static FwpmFilterDeleteById0(engineHandle: HANDLE, id: UINT64): DWORD {
    return Fwpuclnt.Load('FwpmFilterDeleteById0')(engineHandle, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmfilterdeletebykey0
  public static FwpmFilterDeleteByKey0(engineHandle: HANDLE, key: LPGUID): DWORD {
    return Fwpuclnt.Load('FwpmFilterDeleteByKey0')(engineHandle, key);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmfilterdestroyenumhandle0
  public static FwpmFilterDestroyEnumHandle0(engineHandle: HANDLE, enumHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmFilterDestroyEnumHandle0')(engineHandle, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmfilterenum0
  public static FwpmFilterEnum0(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_FILTER0, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmFilterEnum0')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmfiltergetbyid0
  public static FwpmFilterGetById0(engineHandle: HANDLE, id: UINT64, filter: PFWPM_FILTER0): DWORD {
    return Fwpuclnt.Load('FwpmFilterGetById0')(engineHandle, id, filter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmfiltergetbykey0
  public static FwpmFilterGetByKey0(engineHandle: HANDLE, key: LPGUID, filter: PFWPM_FILTER0): DWORD {
    return Fwpuclnt.Load('FwpmFilterGetByKey0')(engineHandle, key, filter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmfiltergetsecurityinfobykey0
  public static FwpmFilterGetSecurityInfoByKey0(engineHandle: HANDLE, key: LPGUID | NULL, securityInfo: SECURITY_INFORMATION, sidOwner: PVOID, sidGroup: PVOID, dacl: PVOID, sacl: PVOID, securityDescriptor: PVOID): DWORD {
    return Fwpuclnt.Load('FwpmFilterGetSecurityInfoByKey0')(engineHandle, key, securityInfo, sidOwner, sidGroup, dacl, sacl, securityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmfiltersetsecurityinfobykey0
  public static FwpmFilterSetSecurityInfoByKey0(engineHandle: HANDLE, key: LPGUID | NULL, securityInfo: SECURITY_INFORMATION, sidOwner: PSID | NULL, sidGroup: PSID | NULL, dacl: PACL | NULL, sacl: PACL | NULL): DWORD {
    return Fwpuclnt.Load('FwpmFilterSetSecurityInfoByKey0')(engineHandle, key, securityInfo, sidOwner, sidGroup, dacl, sacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmfiltersubscribechanges0
  public static FwpmFilterSubscribeChanges0(engineHandle: HANDLE, subscription: PFWPM_FILTER_SUBSCRIPTION0, callback: FWPM_FILTER_CHANGE_CALLBACK0, context: LPVOID | NULL, changeHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmFilterSubscribeChanges0')(engineHandle, subscription, callback, context, changeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmfiltersubscriptionsget0
  public static FwpmFilterSubscriptionsGet0(engineHandle: HANDLE, entries: PFWPM_FILTER_SUBSCRIPTION0, numEntries: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmFilterSubscriptionsGet0')(engineHandle, entries, numEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmfilterunsubscribechanges0
  public static FwpmFilterUnsubscribeChanges0(engineHandle: HANDLE, changeHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmFilterUnsubscribeChanges0')(engineHandle, changeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmfreememory0
  public static FwpmFreeMemory0(p: PVOID): void {
    return Fwpuclnt.Load('FwpmFreeMemory0')(p);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmgetappidfromfilename0
  public static FwpmGetAppIdFromFileName0(fileName: LPCWSTR, appId: PFWP_BYTE_BLOB): DWORD {
    return Fwpuclnt.Load('FwpmGetAppIdFromFileName0')(fileName, appId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmipsectunneladd0
  public static FwpmIPsecTunnelAdd0(
    engineHandle: HANDLE,
    flags: UINT32,
    mainModePolicy: PFWPM_PROVIDER_CONTEXT0 | NULL,
    tunnelPolicy: PFWPM_PROVIDER_CONTEXT0,
    numFilterConditions: UINT32,
    filterConditions: PFWPM_FILTER_CONDITION0,
    sd: PSECURITY_DESCRIPTOR | NULL,
  ): DWORD {
    return Fwpuclnt.Load('FwpmIPsecTunnelAdd0')(engineHandle, flags, mainModePolicy, tunnelPolicy, numFilterConditions, filterConditions, sd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmipsectunneladd1
  public static FwpmIPsecTunnelAdd1(
    engineHandle: HANDLE,
    flags: UINT32,
    mainModePolicy: PFWPM_PROVIDER_CONTEXT1 | NULL,
    tunnelPolicy: PFWPM_PROVIDER_CONTEXT1,
    numFilterConditions: UINT32,
    filterConditions: PFWPM_FILTER_CONDITION0,
    keyModKey: LPGUID | NULL,
    sd: PSECURITY_DESCRIPTOR | NULL,
  ): DWORD {
    return Fwpuclnt.Load('FwpmIPsecTunnelAdd1')(engineHandle, flags, mainModePolicy, tunnelPolicy, numFilterConditions, filterConditions, keyModKey, sd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmipsectunneladd2
  public static FwpmIPsecTunnelAdd2(
    engineHandle: HANDLE,
    flags: UINT32,
    mainModePolicy: PFWPM_PROVIDER_CONTEXT2 | NULL,
    tunnelPolicy: PFWPM_PROVIDER_CONTEXT2,
    numFilterConditions: UINT32,
    filterConditions: PFWPM_FILTER_CONDITION0,
    keyModKey: LPGUID | NULL,
    sd: PSECURITY_DESCRIPTOR | NULL,
  ): DWORD {
    return Fwpuclnt.Load('FwpmIPsecTunnelAdd2')(engineHandle, flags, mainModePolicy, tunnelPolicy, numFilterConditions, filterConditions, keyModKey, sd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmipsectunneladd3
  public static FwpmIPsecTunnelAdd3(
    engineHandle: HANDLE,
    flags: UINT32,
    mainModePolicy: PFWPM_PROVIDER_CONTEXT3 | NULL,
    tunnelPolicy: PFWPM_PROVIDER_CONTEXT3,
    numFilterConditions: UINT32,
    filterConditions: PFWPM_FILTER_CONDITION0,
    keyModKey: LPGUID | NULL,
    sd: PSECURITY_DESCRIPTOR | NULL,
  ): DWORD {
    return Fwpuclnt.Load('FwpmIPsecTunnelAdd3')(engineHandle, flags, mainModePolicy, tunnelPolicy, numFilterConditions, filterConditions, keyModKey, sd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmipsectunneldeletebykey0
  public static FwpmIPsecTunnelDeleteByKey0(engineHandle: HANDLE, key: LPGUID): DWORD {
    return Fwpuclnt.Load('FwpmIPsecTunnelDeleteByKey0')(engineHandle, key);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmlayercreateenumhandle0
  public static FwpmLayerCreateEnumHandle0(engineHandle: HANDLE, enumTemplate: PFWPM_LAYER_ENUM_TEMPLATE0 | NULL, enumHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmLayerCreateEnumHandle0')(engineHandle, enumTemplate, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmlayerdestroyenumhandle0
  public static FwpmLayerDestroyEnumHandle0(engineHandle: HANDLE, enumHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmLayerDestroyEnumHandle0')(engineHandle, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmlayerenum0
  public static FwpmLayerEnum0(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_LAYER0, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmLayerEnum0')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmlayergetbyid0
  public static FwpmLayerGetById0(engineHandle: HANDLE, id: UINT16, layer: PFWPM_LAYER0): DWORD {
    return Fwpuclnt.Load('FwpmLayerGetById0')(engineHandle, id, layer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmlayergetbykey0
  public static FwpmLayerGetByKey0(engineHandle: HANDLE, key: LPGUID, layer: PFWPM_LAYER0): DWORD {
    return Fwpuclnt.Load('FwpmLayerGetByKey0')(engineHandle, key, layer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmlayergetsecurityinfobykey0
  public static FwpmLayerGetSecurityInfoByKey0(engineHandle: HANDLE, key: LPGUID | NULL, securityInfo: SECURITY_INFORMATION, sidOwner: PVOID, sidGroup: PVOID, dacl: PVOID, sacl: PVOID, securityDescriptor: PVOID): DWORD {
    return Fwpuclnt.Load('FwpmLayerGetSecurityInfoByKey0')(engineHandle, key, securityInfo, sidOwner, sidGroup, dacl, sacl, securityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmlayersetsecurityinfobykey0
  public static FwpmLayerSetSecurityInfoByKey0(engineHandle: HANDLE, key: LPGUID | NULL, securityInfo: SECURITY_INFORMATION, sidOwner: PSID | NULL, sidGroup: PSID | NULL, dacl: PACL | NULL, sacl: PACL | NULL): DWORD {
    return Fwpuclnt.Load('FwpmLayerSetSecurityInfoByKey0')(engineHandle, key, securityInfo, sidOwner, sidGroup, dacl, sacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventcreateenumhandle0
  public static FwpmNetEventCreateEnumHandle0(engineHandle: HANDLE, enumTemplate: PFWPM_NET_EVENT_ENUM_TEMPLATE0 | NULL, enumHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmNetEventCreateEnumHandle0')(engineHandle, enumTemplate, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventdestroyenumhandle0
  public static FwpmNetEventDestroyEnumHandle0(engineHandle: HANDLE, enumHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmNetEventDestroyEnumHandle0')(engineHandle, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventenum0
  public static FwpmNetEventEnum0(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_NET_EVENT0, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmNetEventEnum0')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventenum1
  public static FwpmNetEventEnum1(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_NET_EVENT1, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmNetEventEnum1')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventenum2
  public static FwpmNetEventEnum2(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_NET_EVENT2, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmNetEventEnum2')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventenum3
  public static FwpmNetEventEnum3(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_NET_EVENT3, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmNetEventEnum3')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventenum4
  public static FwpmNetEventEnum4(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_NET_EVENT4, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmNetEventEnum4')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventenum5
  public static FwpmNetEventEnum5(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_NET_EVENT5, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmNetEventEnum5')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventsubscribe0
  public static FwpmNetEventSubscribe0(engineHandle: HANDLE, subscription: PFWPM_NET_EVENT_SUBSCRIPTION0, callback: FWPM_NET_EVENT_CALLBACK0, context: LPVOID | NULL, eventsHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmNetEventSubscribe0')(engineHandle, subscription, callback, context, eventsHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventsubscribe1
  public static FwpmNetEventSubscribe1(engineHandle: HANDLE, subscription: PFWPM_NET_EVENT_SUBSCRIPTION0, callback: FWPM_NET_EVENT_CALLBACK1, context: LPVOID | NULL, eventsHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmNetEventSubscribe1')(engineHandle, subscription, callback, context, eventsHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventsubscribe2
  public static FwpmNetEventSubscribe2(engineHandle: HANDLE, subscription: PFWPM_NET_EVENT_SUBSCRIPTION0, callback: FWPM_NET_EVENT_CALLBACK2, context: LPVOID | NULL, eventsHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmNetEventSubscribe2')(engineHandle, subscription, callback, context, eventsHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventsubscribe3
  public static FwpmNetEventSubscribe3(engineHandle: HANDLE, subscription: PFWPM_NET_EVENT_SUBSCRIPTION0, callback: FWPM_NET_EVENT_CALLBACK3, context: LPVOID | NULL, eventsHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmNetEventSubscribe3')(engineHandle, subscription, callback, context, eventsHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventsubscribe4
  public static FwpmNetEventSubscribe4(engineHandle: HANDLE, subscription: PFWPM_NET_EVENT_SUBSCRIPTION0, callback: FWPM_NET_EVENT_CALLBACK4, context: LPVOID | NULL, eventsHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmNetEventSubscribe4')(engineHandle, subscription, callback, context, eventsHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventsubscriptionsget0
  public static FwpmNetEventSubscriptionsGet0(engineHandle: HANDLE, entries: PFWPM_NET_EVENT_SUBSCRIPTION0, numEntries: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmNetEventSubscriptionsGet0')(engineHandle, entries, numEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventunsubscribe0
  public static FwpmNetEventUnsubscribe0(engineHandle: HANDLE, eventsHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmNetEventUnsubscribe0')(engineHandle, eventsHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventsgetsecurityinfo0
  public static FwpmNetEventsGetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PVOID, sidGroup: PVOID, dacl: PVOID, sacl: PVOID, securityDescriptor: PVOID): DWORD {
    return Fwpuclnt.Load('FwpmNetEventsGetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl, securityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmneteventssetsecurityinfo0
  public static FwpmNetEventsSetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PSID | NULL, sidGroup: PSID | NULL, dacl: PACL | NULL, sacl: PACL | NULL): DWORD {
    return Fwpuclnt.Load('FwpmNetEventsSetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovideradd0
  public static FwpmProviderAdd0(engineHandle: HANDLE, provider: PFWPM_PROVIDER0, sd: PSECURITY_DESCRIPTOR | NULL): DWORD {
    return Fwpuclnt.Load('FwpmProviderAdd0')(engineHandle, provider, sd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextadd0
  public static FwpmProviderContextAdd0(engineHandle: HANDLE, providerContext: PFWPM_PROVIDER_CONTEXT0, sd: PSECURITY_DESCRIPTOR | NULL, id: PUINT64 | NULL): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextAdd0')(engineHandle, providerContext, sd, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextadd1
  public static FwpmProviderContextAdd1(engineHandle: HANDLE, providerContext: PFWPM_PROVIDER_CONTEXT1, sd: PSECURITY_DESCRIPTOR | NULL, id: PUINT64 | NULL): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextAdd1')(engineHandle, providerContext, sd, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextadd2
  public static FwpmProviderContextAdd2(engineHandle: HANDLE, providerContext: PFWPM_PROVIDER_CONTEXT2, sd: PSECURITY_DESCRIPTOR | NULL, id: PUINT64 | NULL): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextAdd2')(engineHandle, providerContext, sd, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextadd3
  public static FwpmProviderContextAdd3(engineHandle: HANDLE, providerContext: PFWPM_PROVIDER_CONTEXT3, sd: PSECURITY_DESCRIPTOR | NULL, id: PUINT64 | NULL): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextAdd3')(engineHandle, providerContext, sd, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextcreateenumhandle0
  public static FwpmProviderContextCreateEnumHandle0(engineHandle: HANDLE, enumTemplate: PFWPM_PROVIDER_CONTEXT_ENUM_TEMPLATE0 | NULL, enumHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextCreateEnumHandle0')(engineHandle, enumTemplate, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextdeletebyid0
  public static FwpmProviderContextDeleteById0(engineHandle: HANDLE, id: UINT64): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextDeleteById0')(engineHandle, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextdeletebykey0
  public static FwpmProviderContextDeleteByKey0(engineHandle: HANDLE, key: LPGUID): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextDeleteByKey0')(engineHandle, key);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextdestroyenumhandle0
  public static FwpmProviderContextDestroyEnumHandle0(engineHandle: HANDLE, enumHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextDestroyEnumHandle0')(engineHandle, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextenum0
  public static FwpmProviderContextEnum0(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_PROVIDER_CONTEXT0, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextEnum0')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextenum1
  public static FwpmProviderContextEnum1(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_PROVIDER_CONTEXT1, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextEnum1')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextenum2
  public static FwpmProviderContextEnum2(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_PROVIDER_CONTEXT2, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextEnum2')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextenum3
  public static FwpmProviderContextEnum3(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_PROVIDER_CONTEXT3, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextEnum3')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextgetbyid0
  public static FwpmProviderContextGetById0(engineHandle: HANDLE, id: UINT64, providerContext: PFWPM_PROVIDER_CONTEXT0): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextGetById0')(engineHandle, id, providerContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextgetbyid1
  public static FwpmProviderContextGetById1(engineHandle: HANDLE, id: UINT64, providerContext: PFWPM_PROVIDER_CONTEXT1): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextGetById1')(engineHandle, id, providerContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextgetbyid2
  public static FwpmProviderContextGetById2(engineHandle: HANDLE, id: UINT64, providerContext: PFWPM_PROVIDER_CONTEXT2): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextGetById2')(engineHandle, id, providerContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextgetbyid3
  public static FwpmProviderContextGetById3(engineHandle: HANDLE, id: UINT64, providerContext: PFWPM_PROVIDER_CONTEXT3): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextGetById3')(engineHandle, id, providerContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextgetbykey0
  public static FwpmProviderContextGetByKey0(engineHandle: HANDLE, key: LPGUID, providerContext: PFWPM_PROVIDER_CONTEXT0): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextGetByKey0')(engineHandle, key, providerContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextgetbykey1
  public static FwpmProviderContextGetByKey1(engineHandle: HANDLE, key: LPGUID, providerContext: PFWPM_PROVIDER_CONTEXT1): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextGetByKey1')(engineHandle, key, providerContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextgetbykey2
  public static FwpmProviderContextGetByKey2(engineHandle: HANDLE, key: LPGUID, providerContext: PFWPM_PROVIDER_CONTEXT2): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextGetByKey2')(engineHandle, key, providerContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextgetbykey3
  public static FwpmProviderContextGetByKey3(engineHandle: HANDLE, key: LPGUID, providerContext: PFWPM_PROVIDER_CONTEXT3): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextGetByKey3')(engineHandle, key, providerContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextgetsecurityinfobykey0
  public static FwpmProviderContextGetSecurityInfoByKey0(engineHandle: HANDLE, key: LPGUID | NULL, securityInfo: SECURITY_INFORMATION, sidOwner: PVOID, sidGroup: PVOID, dacl: PVOID, sacl: PVOID, securityDescriptor: PVOID): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextGetSecurityInfoByKey0')(engineHandle, key, securityInfo, sidOwner, sidGroup, dacl, sacl, securityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextsetsecurityinfobykey0
  public static FwpmProviderContextSetSecurityInfoByKey0(engineHandle: HANDLE, key: LPGUID | NULL, securityInfo: SECURITY_INFORMATION, sidOwner: PSID | NULL, sidGroup: PSID | NULL, dacl: PACL | NULL, sacl: PACL | NULL): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextSetSecurityInfoByKey0')(engineHandle, key, securityInfo, sidOwner, sidGroup, dacl, sacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextsubscribechanges0
  public static FwpmProviderContextSubscribeChanges0(engineHandle: HANDLE, subscription: PFWPM_PROVIDER_CONTEXT_SUBSCRIPTION0, callback: FWPM_PROVIDER_CONTEXT_CHANGE_CALLBACK0, context: LPVOID | NULL, changeHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextSubscribeChanges0')(engineHandle, subscription, callback, context, changeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextsubscriptionsget0
  public static FwpmProviderContextSubscriptionsGet0(engineHandle: HANDLE, entries: PFWPM_PROVIDER_CONTEXT_SUBSCRIPTION0, numEntries: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextSubscriptionsGet0')(engineHandle, entries, numEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercontextunsubscribechanges0
  public static FwpmProviderContextUnsubscribeChanges0(engineHandle: HANDLE, changeHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmProviderContextUnsubscribeChanges0')(engineHandle, changeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidercreateenumhandle0
  public static FwpmProviderCreateEnumHandle0(engineHandle: HANDLE, enumTemplate: PFWPM_PROVIDER_ENUM_TEMPLATE0 | NULL, enumHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmProviderCreateEnumHandle0')(engineHandle, enumTemplate, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmproviderdeletebykey0
  public static FwpmProviderDeleteByKey0(engineHandle: HANDLE, key: LPGUID): DWORD {
    return Fwpuclnt.Load('FwpmProviderDeleteByKey0')(engineHandle, key);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmproviderdestroyenumhandle0
  public static FwpmProviderDestroyEnumHandle0(engineHandle: HANDLE, enumHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmProviderDestroyEnumHandle0')(engineHandle, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmproviderenum0
  public static FwpmProviderEnum0(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_PROVIDER0, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmProviderEnum0')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidergetbykey0
  public static FwpmProviderGetByKey0(engineHandle: HANDLE, key: LPGUID, provider: PFWPM_PROVIDER0): DWORD {
    return Fwpuclnt.Load('FwpmProviderGetByKey0')(engineHandle, key, provider);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidergetsecurityinfobykey0
  public static FwpmProviderGetSecurityInfoByKey0(engineHandle: HANDLE, key: LPGUID | NULL, securityInfo: SECURITY_INFORMATION, sidOwner: PVOID, sidGroup: PVOID, dacl: PVOID, sacl: PVOID, securityDescriptor: PVOID): DWORD {
    return Fwpuclnt.Load('FwpmProviderGetSecurityInfoByKey0')(engineHandle, key, securityInfo, sidOwner, sidGroup, dacl, sacl, securityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidersetsecurityinfobykey0
  public static FwpmProviderSetSecurityInfoByKey0(engineHandle: HANDLE, key: LPGUID | NULL, securityInfo: SECURITY_INFORMATION, sidOwner: PSID | NULL, sidGroup: PSID | NULL, dacl: PACL | NULL, sacl: PACL | NULL): DWORD {
    return Fwpuclnt.Load('FwpmProviderSetSecurityInfoByKey0')(engineHandle, key, securityInfo, sidOwner, sidGroup, dacl, sacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidersubscribechanges0
  public static FwpmProviderSubscribeChanges0(engineHandle: HANDLE, subscription: PFWPM_PROVIDER_SUBSCRIPTION0, callback: FWPM_PROVIDER_CHANGE_CALLBACK0, context: LPVOID | NULL, changeHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmProviderSubscribeChanges0')(engineHandle, subscription, callback, context, changeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmprovidersubscriptionsget0
  public static FwpmProviderSubscriptionsGet0(engineHandle: HANDLE, entries: PFWPM_PROVIDER_SUBSCRIPTION0, numEntries: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmProviderSubscriptionsGet0')(engineHandle, entries, numEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmproviderunsubscribechanges0
  public static FwpmProviderUnsubscribeChanges0(engineHandle: HANDLE, changeHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmProviderUnsubscribeChanges0')(engineHandle, changeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsessioncreateenumhandle0
  public static FwpmSessionCreateEnumHandle0(engineHandle: HANDLE, enumTemplate: PFWPM_SESSION_ENUM_TEMPLATE0 | NULL, enumHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmSessionCreateEnumHandle0')(engineHandle, enumTemplate, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsessiondestroyenumhandle0
  public static FwpmSessionDestroyEnumHandle0(engineHandle: HANDLE, enumHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmSessionDestroyEnumHandle0')(engineHandle, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsessionenum0
  public static FwpmSessionEnum0(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_SESSION0, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmSessionEnum0')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsublayeradd0
  public static FwpmSubLayerAdd0(engineHandle: HANDLE, subLayer: PFWPM_SUBLAYER0, sd: PSECURITY_DESCRIPTOR | NULL): DWORD {
    return Fwpuclnt.Load('FwpmSubLayerAdd0')(engineHandle, subLayer, sd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsublayercreateenumhandle0
  public static FwpmSubLayerCreateEnumHandle0(engineHandle: HANDLE, enumTemplate: PFWPM_SUBLAYER_ENUM_TEMPLATE0 | NULL, enumHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmSubLayerCreateEnumHandle0')(engineHandle, enumTemplate, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsublayerdeletebykey0
  public static FwpmSubLayerDeleteByKey0(engineHandle: HANDLE, key: LPGUID): DWORD {
    return Fwpuclnt.Load('FwpmSubLayerDeleteByKey0')(engineHandle, key);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsublayerdestroyenumhandle0
  public static FwpmSubLayerDestroyEnumHandle0(engineHandle: HANDLE, enumHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmSubLayerDestroyEnumHandle0')(engineHandle, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsublayerenum0
  public static FwpmSubLayerEnum0(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPM_SUBLAYER0, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmSubLayerEnum0')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsublayergetbykey0
  public static FwpmSubLayerGetByKey0(engineHandle: HANDLE, key: LPGUID, subLayer: PFWPM_SUBLAYER0): DWORD {
    return Fwpuclnt.Load('FwpmSubLayerGetByKey0')(engineHandle, key, subLayer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsublayergetsecurityinfobykey0
  public static FwpmSubLayerGetSecurityInfoByKey0(engineHandle: HANDLE, key: LPGUID | NULL, securityInfo: SECURITY_INFORMATION, sidOwner: PVOID, sidGroup: PVOID, dacl: PVOID, sacl: PVOID, securityDescriptor: PVOID): DWORD {
    return Fwpuclnt.Load('FwpmSubLayerGetSecurityInfoByKey0')(engineHandle, key, securityInfo, sidOwner, sidGroup, dacl, sacl, securityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsublayersetsecurityinfobykey0
  public static FwpmSubLayerSetSecurityInfoByKey0(engineHandle: HANDLE, key: LPGUID | NULL, securityInfo: SECURITY_INFORMATION, sidOwner: PSID | NULL, sidGroup: PSID | NULL, dacl: PACL | NULL, sacl: PACL | NULL): DWORD {
    return Fwpuclnt.Load('FwpmSubLayerSetSecurityInfoByKey0')(engineHandle, key, securityInfo, sidOwner, sidGroup, dacl, sacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsublayersubscribechanges0
  public static FwpmSubLayerSubscribeChanges0(engineHandle: HANDLE, subscription: PFWPM_SUBLAYER_SUBSCRIPTION0, callback: FWPM_SUBLAYER_CHANGE_CALLBACK0, context: LPVOID | NULL, changeHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmSubLayerSubscribeChanges0')(engineHandle, subscription, callback, context, changeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsublayersubscriptionsget0
  public static FwpmSubLayerSubscriptionsGet0(engineHandle: HANDLE, entries: PFWPM_SUBLAYER_SUBSCRIPTION0, numEntries: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpmSubLayerSubscriptionsGet0')(engineHandle, entries, numEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsublayerunsubscribechanges0
  public static FwpmSubLayerUnsubscribeChanges0(engineHandle: HANDLE, changeHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmSubLayerUnsubscribeChanges0')(engineHandle, changeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsystemportsget0
  public static FwpmSystemPortsGet0(engineHandle: HANDLE | 0n, sysPorts: PFWPM_SYSTEM_PORTS0): DWORD {
    return Fwpuclnt.Load('FwpmSystemPortsGet0')(engineHandle, sysPorts);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsystemportssubscribe0
  public static FwpmSystemPortsSubscribe0(engineHandle: HANDLE | 0n, reserved: LPVOID | NULL, callback: FWPM_SYSTEM_PORTS_CALLBACK0, context: LPVOID | NULL, sysPortsHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmSystemPortsSubscribe0')(engineHandle, reserved, callback, context, sysPortsHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmsystemportsunsubscribe0
  public static FwpmSystemPortsUnsubscribe0(engineHandle: HANDLE | 0n, sysPortsHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmSystemPortsUnsubscribe0')(engineHandle, sysPortsHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmtransactionabort0
  public static FwpmTransactionAbort0(engineHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmTransactionAbort0')(engineHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmtransactionbegin0
  public static FwpmTransactionBegin0(engineHandle: HANDLE, flags: UINT32): DWORD {
    return Fwpuclnt.Load('FwpmTransactionBegin0')(engineHandle, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmtransactioncommit0
  public static FwpmTransactionCommit0(engineHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmTransactionCommit0')(engineHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmvswitcheventsubscribe0
  public static FwpmvSwitchEventSubscribe0(engineHandle: HANDLE, subscription: PFWPM_VSWITCH_EVENT_SUBSCRIPTION0, callback: FWPM_VSWITCH_EVENT_CALLBACK0, context: LPVOID | NULL, subscriptionHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpmvSwitchEventSubscribe0')(engineHandle, subscription, callback, context, subscriptionHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmvswitcheventunsubscribe0
  public static FwpmvSwitchEventUnsubscribe0(engineHandle: HANDLE, subscriptionHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpmvSwitchEventUnsubscribe0')(engineHandle, subscriptionHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmvswitcheventsgetsecurityinfo0
  public static FwpmvSwitchEventsGetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PVOID, sidGroup: PVOID, dacl: PVOID, sacl: PVOID, securityDescriptor: PVOID): DWORD {
    return Fwpuclnt.Load('FwpmvSwitchEventsGetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl, securityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-fwpmvswitcheventssetsecurityinfo0
  public static FwpmvSwitchEventsSetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PSID | NULL, sidGroup: PSID | NULL, dacl: PACL | NULL, sacl: PACL | NULL): DWORD {
    return Fwpuclnt.Load('FwpmvSwitchEventsSetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpsu/nf-fwpsu-fwpsaleendpointcreateenumhandle0
  public static FwpsAleEndpointCreateEnumHandle0(engineHandle: HANDLE, enumTemplate: PFWPS_ALE_ENDPOINT_ENUM_TEMPLATE0 | NULL, enumHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpsAleEndpointCreateEnumHandle0')(engineHandle, enumTemplate, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpsu/nf-fwpsu-fwpsaleendpointdestroyenumhandle0
  public static FwpsAleEndpointDestroyEnumHandle0(engineHandle: HANDLE, enumHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('FwpsAleEndpointDestroyEnumHandle0')(engineHandle, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpsu/nf-fwpsu-fwpsaleendpointenum0
  public static FwpsAleEndpointEnum0(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PFWPS_ALE_ENDPOINT_PROPERTIES0, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('FwpsAleEndpointEnum0')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpsu/nf-fwpsu-fwpsaleendpointgetbyid0
  public static FwpsAleEndpointGetById0(engineHandle: HANDLE, endpointId: UINT64, properties: PFWPS_ALE_ENDPOINT_PROPERTIES0): DWORD {
    return Fwpuclnt.Load('FwpsAleEndpointGetById0')(engineHandle, endpointId, properties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpsu/nf-fwpsu-fwpsaleendpointgetsecurityinfo0
  public static FwpsAleEndpointGetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PVOID, sidGroup: PVOID, dacl: PVOID, sacl: PVOID, securityDescriptor: PVOID): DWORD {
    return Fwpuclnt.Load('FwpsAleEndpointGetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl, securityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpsu/nf-fwpsu-fwpsaleendpointsetsecurityinfo0
  public static FwpsAleEndpointSetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PSID | NULL, sidGroup: PSID | NULL, dacl: PACL | NULL, sacl: PACL | NULL): DWORD {
    return Fwpuclnt.Load('FwpsAleEndpointSetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpsu/nf-fwpsu-fwpsopentoken0
  public static FwpsOpenToken0(engineHandle: HANDLE, modifiedId: LUID, desiredAccess: DWORD, accessToken: PHANDLE): DWORD {
    return Fwpuclnt.Load('FwpsOpenToken0')(engineHandle, modifiedId, desiredAccess, accessToken);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecdospgetsecurityinfo0
  public static IPsecDospGetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PVOID, sidGroup: PVOID, dacl: PVOID, sacl: PVOID, securityDescriptor: PVOID): DWORD {
    return Fwpuclnt.Load('IPsecDospGetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl, securityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecdospgetstatistics0
  public static IPsecDospGetStatistics0(engineHandle: HANDLE, idpStatistics: PIPSEC_DOSP_STATISTICS0): DWORD {
    return Fwpuclnt.Load('IPsecDospGetStatistics0')(engineHandle, idpStatistics);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecdospsetsecurityinfo0
  public static IPsecDospSetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PSID | NULL, sidGroup: PSID | NULL, dacl: PACL | NULL, sacl: PACL | NULL): DWORD {
    return Fwpuclnt.Load('IPsecDospSetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecdospstatecreateenumhandle0
  public static IPsecDospStateCreateEnumHandle0(engineHandle: HANDLE, enumTemplate: PIPSEC_DOSP_STATE_ENUM_TEMPLATE0 | NULL, enumHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('IPsecDospStateCreateEnumHandle0')(engineHandle, enumTemplate, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecdospstatedestroyenumhandle0
  public static IPsecDospStateDestroyEnumHandle0(engineHandle: HANDLE, enumHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('IPsecDospStateDestroyEnumHandle0')(engineHandle, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecdospstateenum0
  public static IPsecDospStateEnum0(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PIPSEC_DOSP_STATE0, numEntries: PUINT32): DWORD {
    return Fwpuclnt.Load('IPsecDospStateEnum0')(engineHandle, enumHandle, numEntriesRequested, entries, numEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecgetstatistics0
  public static IPsecGetStatistics0(engineHandle: HANDLE, ipsecStatistics: PIPSEC_STATISTICS0): DWORD {
    return Fwpuclnt.Load('IPsecGetStatistics0')(engineHandle, ipsecStatistics);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecgetstatistics1
  public static IPsecGetStatistics1(engineHandle: HANDLE, ipsecStatistics: PIPSEC_STATISTICS1): DWORD {
    return Fwpuclnt.Load('IPsecGetStatistics1')(engineHandle, ipsecStatistics);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipseckeymanageraddandregister0
  public static IPsecKeyManagerAddAndRegister0(engineHandle: HANDLE, keyManager: PIPSEC_KEY_MANAGER0, keyManagerCallbacks: PIPSEC_KEY_MANAGER_CALLBACKS0, keyMgmtHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('IPsecKeyManagerAddAndRegister0')(engineHandle, keyManager, keyManagerCallbacks, keyMgmtHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipseckeymanagergetsecurityinfobykey0
  public static IPsecKeyManagerGetSecurityInfoByKey0(engineHandle: HANDLE, reserved: LPVOID | NULL, securityInfo: SECURITY_INFORMATION, sidOwner: PVOID, sidGroup: PVOID, dacl: PVOID, sacl: PVOID, securityDescriptor: PVOID): DWORD {
    return Fwpuclnt.Load('IPsecKeyManagerGetSecurityInfoByKey0')(engineHandle, reserved, securityInfo, sidOwner, sidGroup, dacl, sacl, securityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipseckeymanagersetsecurityinfobykey0
  public static IPsecKeyManagerSetSecurityInfoByKey0(engineHandle: HANDLE, reserved: LPVOID | NULL, securityInfo: SECURITY_INFORMATION, sidOwner: PSID | NULL, sidGroup: PSID | NULL, dacl: PACL | NULL, sacl: PACL | NULL): DWORD {
    return Fwpuclnt.Load('IPsecKeyManagerSetSecurityInfoByKey0')(engineHandle, reserved, securityInfo, sidOwner, sidGroup, dacl, sacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipseckeymanagerunregisteranddelete0
  public static IPsecKeyManagerUnregisterAndDelete0(engineHandle: HANDLE, keyMgmtHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('IPsecKeyManagerUnregisterAndDelete0')(engineHandle, keyMgmtHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipseckeymanagersget0
  public static IPsecKeyManagersGet0(engineHandle: HANDLE, entries: PIPSEC_KEY_MANAGER0, numEntries: PUINT32): DWORD {
    return Fwpuclnt.Load('IPsecKeyManagersGet0')(engineHandle, entries, numEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextaddinbound0
  public static IPsecSaContextAddInbound0(engineHandle: HANDLE, id: UINT64, inboundBundle: PIPSEC_SA_BUNDLE0): DWORD {
    return Fwpuclnt.Load('IPsecSaContextAddInbound0')(engineHandle, id, inboundBundle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextaddinbound1
  public static IPsecSaContextAddInbound1(engineHandle: HANDLE, id: UINT64, inboundBundle: PIPSEC_SA_BUNDLE1): DWORD {
    return Fwpuclnt.Load('IPsecSaContextAddInbound1')(engineHandle, id, inboundBundle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextaddoutbound0
  public static IPsecSaContextAddOutbound0(engineHandle: HANDLE, id: UINT64, outboundBundle: PIPSEC_SA_BUNDLE0): DWORD {
    return Fwpuclnt.Load('IPsecSaContextAddOutbound0')(engineHandle, id, outboundBundle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextaddoutbound1
  public static IPsecSaContextAddOutbound1(engineHandle: HANDLE, id: UINT64, outboundBundle: PIPSEC_SA_BUNDLE1): DWORD {
    return Fwpuclnt.Load('IPsecSaContextAddOutbound1')(engineHandle, id, outboundBundle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextcreate0
  public static IPsecSaContextCreate0(engineHandle: HANDLE, outboundTraffic: PIPSEC_TRAFFIC0, inboundFilterId: PUINT64 | NULL, id: PUINT64): DWORD {
    return Fwpuclnt.Load('IPsecSaContextCreate0')(engineHandle, outboundTraffic, inboundFilterId, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextcreate1
  public static IPsecSaContextCreate1(engineHandle: HANDLE, outboundTraffic: PIPSEC_TRAFFIC1, virtualIfTunnelInfo: PIPSEC_VIRTUAL_IF_TUNNEL_INFO0 | NULL, inboundFilterId: PUINT64 | NULL, id: PUINT64): DWORD {
    return Fwpuclnt.Load('IPsecSaContextCreate1')(engineHandle, outboundTraffic, virtualIfTunnelInfo, inboundFilterId, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextcreateenumhandle0
  public static IPsecSaContextCreateEnumHandle0(engineHandle: HANDLE, enumTemplate: PIPSEC_SA_CONTEXT_ENUM_TEMPLATE0 | NULL, enumHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('IPsecSaContextCreateEnumHandle0')(engineHandle, enumTemplate, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextdeletebyid0
  public static IPsecSaContextDeleteById0(engineHandle: HANDLE, id: UINT64): DWORD {
    return Fwpuclnt.Load('IPsecSaContextDeleteById0')(engineHandle, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextdestroyenumhandle0
  public static IPsecSaContextDestroyEnumHandle0(engineHandle: HANDLE, enumHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('IPsecSaContextDestroyEnumHandle0')(engineHandle, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextenum0
  public static IPsecSaContextEnum0(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PIPSEC_SA_CONTEXT0, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('IPsecSaContextEnum0')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextenum1
  public static IPsecSaContextEnum1(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PIPSEC_SA_CONTEXT1, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('IPsecSaContextEnum1')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextexpire0
  public static IPsecSaContextExpire0(engineHandle: HANDLE, id: UINT64): DWORD {
    return Fwpuclnt.Load('IPsecSaContextExpire0')(engineHandle, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextgetbyid0
  public static IPsecSaContextGetById0(engineHandle: HANDLE, id: UINT64, saContext: PIPSEC_SA_CONTEXT0): DWORD {
    return Fwpuclnt.Load('IPsecSaContextGetById0')(engineHandle, id, saContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextgetbyid1
  public static IPsecSaContextGetById1(engineHandle: HANDLE, id: UINT64, saContext: PIPSEC_SA_CONTEXT1): DWORD {
    return Fwpuclnt.Load('IPsecSaContextGetById1')(engineHandle, id, saContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextgetspi0
  public static IPsecSaContextGetSpi0(engineHandle: HANDLE, id: UINT64, getSpi: PIPSEC_GETSPI0, inboundSpi: PIPSEC_SA_SPI): DWORD {
    return Fwpuclnt.Load('IPsecSaContextGetSpi0')(engineHandle, id, getSpi, inboundSpi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextgetspi1
  public static IPsecSaContextGetSpi1(engineHandle: HANDLE, id: UINT64, getSpi: PIPSEC_GETSPI1, inboundSpi: PIPSEC_SA_SPI): DWORD {
    return Fwpuclnt.Load('IPsecSaContextGetSpi1')(engineHandle, id, getSpi, inboundSpi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextsetspi0
  public static IPsecSaContextSetSpi0(engineHandle: HANDLE, id: UINT64, getSpi: PIPSEC_GETSPI1, inboundSpi: IPSEC_SA_SPI): DWORD {
    return Fwpuclnt.Load('IPsecSaContextSetSpi0')(engineHandle, id, getSpi, inboundSpi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextsubscribe0
  public static IPsecSaContextSubscribe0(engineHandle: HANDLE, subscription: PIPSEC_SA_CONTEXT_SUBSCRIPTION0, callback: IPSEC_SA_CONTEXT_CALLBACK0, context: LPVOID | NULL, eventsHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('IPsecSaContextSubscribe0')(engineHandle, subscription, callback, context, eventsHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextsubscriptionsget0
  public static IPsecSaContextSubscriptionsGet0(engineHandle: HANDLE, entries: PIPSEC_SA_CONTEXT_SUBSCRIPTION0, numEntries: PUINT32): DWORD {
    return Fwpuclnt.Load('IPsecSaContextSubscriptionsGet0')(engineHandle, entries, numEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextunsubscribe0
  public static IPsecSaContextUnsubscribe0(engineHandle: HANDLE, eventsHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('IPsecSaContextUnsubscribe0')(engineHandle, eventsHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacontextupdate0
  public static IPsecSaContextUpdate0(engineHandle: HANDLE, flags: UINT64, newValues: PIPSEC_SA_CONTEXT1): DWORD {
    return Fwpuclnt.Load('IPsecSaContextUpdate0')(engineHandle, flags, newValues);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsacreateenumhandle0
  public static IPsecSaCreateEnumHandle0(engineHandle: HANDLE, enumTemplate: PIPSEC_SA_ENUM_TEMPLATE0 | NULL, enumHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('IPsecSaCreateEnumHandle0')(engineHandle, enumTemplate, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsadbgetsecurityinfo0
  public static IPsecSaDbGetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PVOID, sidGroup: PVOID, dacl: PVOID, sacl: PVOID, securityDescriptor: PVOID): DWORD {
    return Fwpuclnt.Load('IPsecSaDbGetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl, securityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsadbsetsecurityinfo0
  public static IPsecSaDbSetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PSID | NULL, sidGroup: PSID | NULL, dacl: PACL | NULL, sacl: PACL | NULL): DWORD {
    return Fwpuclnt.Load('IPsecSaDbSetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsadestroyenumhandle0
  public static IPsecSaDestroyEnumHandle0(engineHandle: HANDLE, enumHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('IPsecSaDestroyEnumHandle0')(engineHandle, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsaenum0
  public static IPsecSaEnum0(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PIPSEC_SA_DETAILS0, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('IPsecSaEnum0')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ipsecsaenum1
  public static IPsecSaEnum1(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PIPSEC_SA_DETAILS1, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('IPsecSaEnum1')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ikeextgetstatistics0
  public static IkeextGetStatistics0(engineHandle: HANDLE, ikeextStatistics: PIKEEXT_STATISTICS0): DWORD {
    return Fwpuclnt.Load('IkeextGetStatistics0')(engineHandle, ikeextStatistics);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ikeextgetstatistics1
  public static IkeextGetStatistics1(engineHandle: HANDLE, ikeextStatistics: PIKEEXT_STATISTICS1): DWORD {
    return Fwpuclnt.Load('IkeextGetStatistics1')(engineHandle, ikeextStatistics);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ikeextsacreateenumhandle0
  public static IkeextSaCreateEnumHandle0(engineHandle: HANDLE, enumTemplate: PIKEEXT_SA_ENUM_TEMPLATE0 | NULL, enumHandle: PHANDLE): DWORD {
    return Fwpuclnt.Load('IkeextSaCreateEnumHandle0')(engineHandle, enumTemplate, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ikeextsadbgetsecurityinfo0
  public static IkeextSaDbGetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PVOID, sidGroup: PVOID, dacl: PVOID, sacl: PVOID, securityDescriptor: PVOID): DWORD {
    return Fwpuclnt.Load('IkeextSaDbGetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl, securityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ikeextsadbsetsecurityinfo0
  public static IkeextSaDbSetSecurityInfo0(engineHandle: HANDLE, securityInfo: SECURITY_INFORMATION, sidOwner: PSID | NULL, sidGroup: PSID | NULL, dacl: PACL | NULL, sacl: PACL | NULL): DWORD {
    return Fwpuclnt.Load('IkeextSaDbSetSecurityInfo0')(engineHandle, securityInfo, sidOwner, sidGroup, dacl, sacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ikeextsadeletebyid0
  public static IkeextSaDeleteById0(engineHandle: HANDLE, id: UINT64): DWORD {
    return Fwpuclnt.Load('IkeextSaDeleteById0')(engineHandle, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ikeextsadestroyenumhandle0
  public static IkeextSaDestroyEnumHandle0(engineHandle: HANDLE, enumHandle: HANDLE): DWORD {
    return Fwpuclnt.Load('IkeextSaDestroyEnumHandle0')(engineHandle, enumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ikeextsaenum0
  public static IkeextSaEnum0(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PIKEEXT_SA_DETAILS0, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('IkeextSaEnum0')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ikeextsaenum1
  public static IkeextSaEnum1(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PIKEEXT_SA_DETAILS1, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('IkeextSaEnum1')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ikeextsaenum2
  public static IkeextSaEnum2(engineHandle: HANDLE, enumHandle: HANDLE, numEntriesRequested: UINT32, entries: PIKEEXT_SA_DETAILS2, numEntriesReturned: PUINT32): DWORD {
    return Fwpuclnt.Load('IkeextSaEnum2')(engineHandle, enumHandle, numEntriesRequested, entries, numEntriesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ikeextsagetbyid0
  public static IkeextSaGetById0(engineHandle: HANDLE, id: UINT64, sa: PIKEEXT_SA_DETAILS0): DWORD {
    return Fwpuclnt.Load('IkeextSaGetById0')(engineHandle, id, sa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ikeextsagetbyid1
  public static IkeextSaGetById1(engineHandle: HANDLE, id: UINT64, saLookupContext: LPGUID | NULL, sa: PIKEEXT_SA_DETAILS1): DWORD {
    return Fwpuclnt.Load('IkeextSaGetById1')(engineHandle, id, saLookupContext, sa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fwpmu/nf-fwpmu-ikeextsagetbyid2
  public static IkeextSaGetById2(engineHandle: HANDLE, id: UINT64, saLookupContext: LPGUID | NULL, sa: PIKEEXT_SA_DETAILS2): DWORD {
    return Fwpuclnt.Load('IkeextSaGetById2')(engineHandle, id, saLookupContext, sa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-wsadeletesocketpeertargetname
  public static WSADeleteSocketPeerTargetName(Socket: SOCKET, PeerAddr: PSOCKADDR, PeerAddrLen: ULONG, Overlapped: LPWSAOVERLAPPED | NULL, CompletionRoutine: LPWSAOVERLAPPED_COMPLETION_ROUTINE | NULL): INT {
    return Fwpuclnt.Load('WSADeleteSocketPeerTargetName')(Socket, PeerAddr, PeerAddrLen, Overlapped, CompletionRoutine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-wsaimpersonatesocketpeer
  public static WSAImpersonateSocketPeer(Socket: SOCKET, PeerAddr: PSOCKADDR | NULL, PeerAddrLen: ULONG): INT {
    return Fwpuclnt.Load('WSAImpersonateSocketPeer')(Socket, PeerAddr, PeerAddrLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-wsaquerysocketsecurity
  public static WSAQuerySocketSecurity(
    Socket: SOCKET,
    SecurityQueryTemplate: PSOCKET_SECURITY_QUERY_TEMPLATE | NULL,
    SecurityQueryTemplateLen: ULONG,
    SecurityQueryInfo: PSOCKET_SECURITY_QUERY_INFO | NULL,
    SecurityQueryInfoLen: PULONG,
    Overlapped: LPWSAOVERLAPPED | NULL,
    CompletionRoutine: LPWSAOVERLAPPED_COMPLETION_ROUTINE | NULL,
  ): INT {
    return Fwpuclnt.Load('WSAQuerySocketSecurity')(Socket, SecurityQueryTemplate, SecurityQueryTemplateLen, SecurityQueryInfo, SecurityQueryInfoLen, Overlapped, CompletionRoutine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-wsarevertimpersonation
  public static WSARevertImpersonation(): INT {
    return Fwpuclnt.Load('WSARevertImpersonation')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-wsasetsocketpeertargetname
  public static WSASetSocketPeerTargetName(Socket: SOCKET, PeerTargetName: PSOCKET_PEER_TARGET_NAME, PeerTargetNameLen: ULONG, Overlapped: LPWSAOVERLAPPED | NULL, CompletionRoutine: LPWSAOVERLAPPED_COMPLETION_ROUTINE | NULL): INT {
    return Fwpuclnt.Load('WSASetSocketPeerTargetName')(Socket, PeerTargetName, PeerTargetNameLen, Overlapped, CompletionRoutine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-wsasetsocketsecurity
  public static WSASetSocketSecurity(Socket: SOCKET, SecuritySettings: PSOCKET_SECURITY_SETTINGS | NULL, SecuritySettingsLen: ULONG, Overlapped: LPWSAOVERLAPPED | NULL, CompletionRoutine: LPWSAOVERLAPPED_COMPLETION_ROUTINE | NULL): INT {
    return Fwpuclnt.Load('WSASetSocketSecurity')(Socket, SecuritySettings, SecuritySettingsLen, Overlapped, CompletionRoutine);
  }
}

export default Fwpuclnt;
