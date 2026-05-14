import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BOOL, DWORD, LONG, LPSTR, LPVOID, LPWSTR, NULL, PVOID, ULONG, USHORT, VOID } from '../types/Rpcrt4';
import type {
  MIDL_ES_HANDLE,
  PCCERT_CONTEXT,
  PMIDL_ES_HANDLE,
  PRPC_ASYNC_STATE,
  PRPC_AUTH_IDENTITY_HANDLE,
  PRPC_AUTHZ_HANDLE,
  PRPC_BINDING_HANDLE,
  PRPC_BINDING_HANDLE_OPTIONS_V1,
  PRPC_BINDING_HANDLE_SECURITY_V1_A,
  PRPC_BINDING_HANDLE_SECURITY_V1_W,
  PRPC_BINDING_HANDLE_TEMPLATE_V1_A,
  PRPC_BINDING_HANDLE_TEMPLATE_V1_W,
  PRPC_BINDING_VECTOR,
  PRPC_CALL_ATTRIBUTES_V2_A,
  PRPC_CALL_ATTRIBUTES_V2_W,
  PRPC_CSTR,
  PRPC_ENDPOINT_TEMPLATEA,
  PRPC_ENDPOINT_TEMPLATEW,
  PRPC_IF_ID,
  PRPC_IF_ID_VECTOR,
  PRPC_INTERFACE_TEMPLATEA,
  PRPC_INTERFACE_TEMPLATEW,
  PRPC_MGR_EPV,
  PRPC_POLICY,
  PRPC_PROTSEQ_VECTORA,
  PRPC_PROTSEQ_VECTORW,
  PRPC_SECURITY_QOS,
  PRPC_STATS_VECTOR,
  PRPC_STATUS,
  PRPC_VERSION,
  PRPC_WSTR,
  PUUID,
  PUUID_VECTOR,
  RPC_AUTH_IDENTITY_HANDLE,
  RPC_AUTH_KEY_RETRIEVAL_FN,
  RPC_AUTHZ_HANDLE,
  RPC_BINDING_HANDLE,
  RPC_CSTR,
  RPC_IF_CALLBACK_FN,
  RPC_IF_HANDLE,
  RPC_INTERFACE_GROUP,
  RPC_MGMT_AUTHORIZATION_FN,
  RPC_NOTIFICATION_CALLBACK,
  RPC_OBJECT_INQ_FN,
  RPC_STATUS,
  RPC_WSTR,
} from '../types/Rpcrt4';

/**
 * Thin, lazy-loaded FFI bindings for `rpcrt4.dll`.
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
 * import Rpcrt4 from './structs/Rpcrt4';
 *
 * // Generate a fresh UUID
 * const uuidBuffer = Buffer.alloc(16);
 * Rpcrt4.UuidCreate(uuidBuffer.ptr);
 *
 * // Convert to string form
 * const stringPtr = Buffer.alloc(8);
 * Rpcrt4.UuidToStringW(uuidBuffer.ptr, stringPtr.ptr);
 * ```
 */
class Rpcrt4 extends Win32 {
  protected static override name = 'rpcrt4.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DceErrorInqTextA: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    DceErrorInqTextW: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    MesBufferHandleReset: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MesDecodeBufferHandleCreate: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MesDecodeIncrementalHandleCreate: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MesEncodeDynBufferHandleCreate: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MesEncodeFixedBufferHandleCreate: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MesEncodeIncrementalHandleCreate: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MesHandleFree: { args: [FFIType.u64], returns: FFIType.i32 },
    MesIncrementalHandleReset: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MesInqProcEncodingId: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcAsyncAbortCall: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RpcAsyncCancelCall: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    RpcAsyncCompleteCall: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcAsyncGetCallStatus: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcAsyncInitializeHandle: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RpcAsyncRegisterInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcBindingBind: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingCopy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingCreateA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingCreateW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingFree: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcBindingFromStringBindingA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingFromStringBindingW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingInqAuthClientA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingInqAuthClientExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RpcBindingInqAuthClientExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RpcBindingInqAuthClientW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingInqAuthInfoA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingInqAuthInfoExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingInqAuthInfoExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingInqAuthInfoW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingInqMaxCalls: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingInqObject: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingInqOption: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingReset: { args: [FFIType.u64], returns: FFIType.i32 },
    RpcBindingServerFromClient: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingSetAuthInfoA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RpcBindingSetAuthInfoExA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingSetAuthInfoExW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingSetAuthInfoW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RpcBindingSetObject: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingSetOption: { args: [FFIType.u64, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    RpcBindingToStringBindingA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingToStringBindingW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcBindingUnbind: { args: [FFIType.u64], returns: FFIType.i32 },
    RpcBindingVectorFree: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcCancelThread: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcCancelThreadEx: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    RpcCertGeneratePrincipalNameA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcCertGeneratePrincipalNameW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcCertMatchPrincipalName: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcEpRegisterA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcEpRegisterNoReplaceA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcEpRegisterNoReplaceW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcEpRegisterW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcEpResolveBinding: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcEpUnregister: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcErrorAddRecord: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcErrorClearInformation: { args: [], returns: FFIType.void },
    RpcErrorEndEnumeration: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcErrorGetNextRecord: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    RpcErrorGetNumberOfRecords: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcErrorLoadErrorInfo: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcErrorResetEnumeration: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcErrorSaveErrorInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcErrorStartEnumeration: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcExceptionFilter: { args: [FFIType.u32], returns: FFIType.i32 },
    RpcFreeAuthorizationContext: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcGetAuthorizationContextForClient: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcIfIdVectorFree: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcIfInqId: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcImpersonateClient: { args: [FFIType.u64], returns: FFIType.i32 },
    RpcImpersonateClient2: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    RpcImpersonateClientContainer: { args: [FFIType.u64], returns: FFIType.i32 },
    RpcMgmtEnableIdleCleanup: { args: [], returns: FFIType.i32 },
    RpcMgmtEpEltInqBegin: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcMgmtEpEltInqDone: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcMgmtEpEltInqNextA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcMgmtEpEltInqNextW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcMgmtEpUnregister: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcMgmtInqComTimeout: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcMgmtInqDefaultProtectLevel: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcMgmtInqIfIds: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcMgmtInqServerPrincNameA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcMgmtInqServerPrincNameW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcMgmtInqStats: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcMgmtIsServerListening: { args: [FFIType.u64], returns: FFIType.i32 },
    RpcMgmtSetAuthorizationFn: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcMgmtSetCancelTimeout: { args: [FFIType.i32], returns: FFIType.i32 },
    RpcMgmtSetComTimeout: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    RpcMgmtSetServerStackSize: { args: [FFIType.u32], returns: FFIType.i32 },
    RpcMgmtStatsVectorFree: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcMgmtStopServerListening: { args: [FFIType.u64], returns: FFIType.i32 },
    RpcMgmtWaitServerListen: { args: [], returns: FFIType.i32 },
    RpcNetworkInqProtseqsA: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcNetworkInqProtseqsW: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcNetworkIsProtseqValidA: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcNetworkIsProtseqValidW: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcNsBindingInqEntryNameA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcNsBindingInqEntryNameW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcObjectInqType: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcObjectSetInqFn: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcObjectSetType: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcProtseqVectorFreeA: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcProtseqVectorFreeW: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcRaiseException: { args: [FFIType.i32], returns: FFIType.void },
    RpcRevertContainerImpersonation: { args: [], returns: FFIType.i32 },
    RpcRevertToSelf: { args: [], returns: FFIType.i32 },
    RpcRevertToSelfEx: { args: [FFIType.u64], returns: FFIType.i32 },
    RpcServerCompleteSecurityCallback: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    RpcServerInqBindingHandle: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcServerInqBindings: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcServerInqBindingsEx: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerInqCallAttributesA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcServerInqCallAttributesW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcServerInqDefaultPrincNameA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcServerInqDefaultPrincNameW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcServerInqIf: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerInterfaceGroupActivate: { args: [FFIType.u64], returns: FFIType.i32 },
    RpcServerInterfaceGroupClose: { args: [FFIType.u64], returns: FFIType.i32 },
    RpcServerInterfaceGroupCreateA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerInterfaceGroupCreateW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerInterfaceGroupDeactivate: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    RpcServerInterfaceGroupInqBindings: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RpcServerListen: { args: [FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    RpcServerRegisterAuthInfoA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerRegisterAuthInfoW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerRegisterIf: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerRegisterIf2: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcServerRegisterIf3: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerRegisterIfEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcServerSubscribeForNotification: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    RpcServerTestCancel: { args: [FFIType.u64], returns: FFIType.i32 },
    RpcServerUnregisterIf: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RpcServerUnregisterIfEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    RpcServerUnsubscribeForNotification: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseAllProtseqs: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseAllProtseqsEx: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseAllProtseqsIf: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseAllProtseqsIfEx: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseProtseqA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseProtseqEpA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseProtseqEpExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseProtseqEpExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseProtseqEpW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseProtseqExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseProtseqExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseProtseqIfA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseProtseqIfExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseProtseqIfExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseProtseqIfW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcServerUseProtseqW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RpcServerYield: { args: [], returns: FFIType.void },
    RpcSmAllocate: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    RpcSmClientFree: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcSmDestroyClientContext: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcSmDisableAllocate: { args: [], returns: FFIType.i32 },
    RpcSmEnableAllocate: { args: [], returns: FFIType.i32 },
    RpcSmFree: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcSmGetThreadHandle: { args: [FFIType.ptr], returns: FFIType.ptr },
    RpcSmSetClientAllocFree: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcSmSetThreadHandle: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcSmSwapClientAllocFree: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcSsAllocate: { args: [FFIType.u64], returns: FFIType.ptr },
    RpcSsContextLockExclusive: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.void },
    RpcSsContextLockShared: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.void },
    RpcSsDestroyClientContext: { args: [FFIType.ptr], returns: FFIType.void },
    RpcSsDisableAllocate: { args: [], returns: FFIType.void },
    RpcSsEnableAllocate: { args: [], returns: FFIType.void },
    RpcSsFree: { args: [FFIType.ptr], returns: FFIType.void },
    RpcSsGetContextBinding: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcSsGetThreadHandle: { args: [], returns: FFIType.ptr },
    RpcSsSetClientAllocFree: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    RpcSsSetThreadHandle: { args: [FFIType.ptr], returns: FFIType.void },
    RpcSsSwapClientAllocFree: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    RpcStringBindingComposeA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcStringBindingComposeW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcStringBindingParseA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcStringBindingParseW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RpcStringFreeA: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcStringFreeW: { args: [FFIType.ptr], returns: FFIType.i32 },
    RpcTestCancel: { args: [], returns: FFIType.i32 },
    RpcUserFree: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.void },
    TowerConstruct: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    TowerExplode: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UuidCompare: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UuidCreate: { args: [FFIType.ptr], returns: FFIType.i32 },
    UuidCreateNil: { args: [FFIType.ptr], returns: FFIType.i32 },
    UuidCreateSequential: { args: [FFIType.ptr], returns: FFIType.i32 },
    UuidEqual: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UuidFromStringA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UuidFromStringW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UuidHash: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u16 },
    UuidIsNil: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UuidToStringA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UuidToStringW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-dceerrorinqtexta
  public static DceErrorInqTextA(RpcStatus: RPC_STATUS, ErrorText: RPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('DceErrorInqTextA')(RpcStatus, ErrorText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-dceerrorinqtextw
  public static DceErrorInqTextW(RpcStatus: RPC_STATUS, ErrorText: RPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('DceErrorInqTextW')(RpcStatus, ErrorText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-mesbufferhandlereset
  public static MesBufferHandleReset(Handle: MIDL_ES_HANDLE, HandleStyle: ULONG, Operation: ULONG, Buffer: PVOID, BufferSize: ULONG, EncodedSize: PVOID): RPC_STATUS {
    return Rpcrt4.Load('MesBufferHandleReset')(Handle, HandleStyle, Operation, Buffer, BufferSize, EncodedSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-mesdecodebufferhandlecreate
  public static MesDecodeBufferHandleCreate(Buffer: LPSTR, BufferSize: ULONG, pHandle: PMIDL_ES_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('MesDecodeBufferHandleCreate')(Buffer, BufferSize, pHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-mesdecodeincrementalhandlecreate
  public static MesDecodeIncrementalHandleCreate(UserState: PVOID | NULL, ReadFn: PVOID, pHandle: PMIDL_ES_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('MesDecodeIncrementalHandleCreate')(UserState, ReadFn, pHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-mesencodedynbufferhandlecreate
  public static MesEncodeDynBufferHandleCreate(Buffer: PVOID, EncodedSize: PVOID, pHandle: PMIDL_ES_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('MesEncodeDynBufferHandleCreate')(Buffer, EncodedSize, pHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-mesencodefixedbufferhandlecreate
  public static MesEncodeFixedBufferHandleCreate(pBuffer: LPSTR, BufferSize: ULONG, pEncodedSize: PVOID, pHandle: PMIDL_ES_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('MesEncodeFixedBufferHandleCreate')(pBuffer, BufferSize, pEncodedSize, pHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-mesencodeincrementalhandlecreate
  public static MesEncodeIncrementalHandleCreate(UserState: PVOID | NULL, AllocFn: PVOID, WriteFn: PVOID, pHandle: PMIDL_ES_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('MesEncodeIncrementalHandleCreate')(UserState, AllocFn, WriteFn, pHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-meshandlefree
  public static MesHandleFree(Handle: MIDL_ES_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('MesHandleFree')(Handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-mesincrementalhandlereset
  public static MesIncrementalHandleReset(Handle: MIDL_ES_HANDLE, UserState: PVOID | NULL, AllocFn: PVOID | NULL, WriteFn: PVOID | NULL, ReadFn: PVOID | NULL, Operation: ULONG): RPC_STATUS {
    return Rpcrt4.Load('MesIncrementalHandleReset')(Handle, UserState, AllocFn, WriteFn, ReadFn, Operation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-mesinqprocencodingid
  public static MesInqProcEncodingId(Handle: MIDL_ES_HANDLE, pInterfaceId: PRPC_VERSION, pProcNum: PVOID): RPC_STATUS {
    return Rpcrt4.Load('MesInqProcEncodingId')(Handle, pInterfaceId, pProcNum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcasync/nf-rpcasync-rpcasyncabortcall
  public static RpcAsyncAbortCall(pAsync: PRPC_ASYNC_STATE, ExceptionCode: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcAsyncAbortCall')(pAsync, ExceptionCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcasync/nf-rpcasync-rpcasynccancelcall
  public static RpcAsyncCancelCall(pAsync: PRPC_ASYNC_STATE, fAbortCall: BOOL): RPC_STATUS {
    return Rpcrt4.Load('RpcAsyncCancelCall')(pAsync, fAbortCall);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcasync/nf-rpcasync-rpcasynccompletecall
  public static RpcAsyncCompleteCall(pAsync: PRPC_ASYNC_STATE, Reply: PVOID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcAsyncCompleteCall')(pAsync, Reply);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcasync/nf-rpcasync-rpcasyncgetcallstatus
  public static RpcAsyncGetCallStatus(pAsync: PRPC_ASYNC_STATE): RPC_STATUS {
    return Rpcrt4.Load('RpcAsyncGetCallStatus')(pAsync);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcasync/nf-rpcasync-rpcasyncinitializehandle
  public static RpcAsyncInitializeHandle(pAsync: PRPC_ASYNC_STATE, Size: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcAsyncInitializeHandle')(pAsync, Size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcasync/nf-rpcasync-rpcasyncregisterinfo
  public static RpcAsyncRegisterInfo(pAsync: PRPC_ASYNC_STATE): RPC_STATUS {
    return Rpcrt4.Load('RpcAsyncRegisterInfo')(pAsync);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingbind
  public static RpcBindingBind(pAsync: PRPC_ASYNC_STATE, Binding: RPC_BINDING_HANDLE, IfSpec: RPC_IF_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingBind')(pAsync, Binding, IfSpec);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingcopy
  public static RpcBindingCopy(SourceBinding: RPC_BINDING_HANDLE, DestinationBinding: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingCopy')(SourceBinding, DestinationBinding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingcreatea
  public static RpcBindingCreateA(Template: PRPC_BINDING_HANDLE_TEMPLATE_V1_A, Security: PRPC_BINDING_HANDLE_SECURITY_V1_A | NULL, Options: PRPC_BINDING_HANDLE_OPTIONS_V1 | NULL, Binding: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingCreateA')(Template, Security, Options, Binding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingcreatew
  public static RpcBindingCreateW(Template: PRPC_BINDING_HANDLE_TEMPLATE_V1_W, Security: PRPC_BINDING_HANDLE_SECURITY_V1_W | NULL, Options: PRPC_BINDING_HANDLE_OPTIONS_V1 | NULL, Binding: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingCreateW')(Template, Security, Options, Binding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingfree
  public static RpcBindingFree(Binding: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingFree')(Binding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingfromstringbindinga
  public static RpcBindingFromStringBindingA(StringBinding: RPC_CSTR, Binding: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingFromStringBindingA')(StringBinding, Binding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingfromstringbindingw
  public static RpcBindingFromStringBindingW(StringBinding: RPC_WSTR, Binding: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingFromStringBindingW')(StringBinding, Binding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthclienta
  public static RpcBindingInqAuthClientA(ClientBinding: RPC_BINDING_HANDLE | 0n, Privs: PRPC_AUTHZ_HANDLE | NULL, ServerPrincName: PRPC_CSTR | NULL, AuthnLevel: PVOID | NULL, AuthnSvc: PVOID | NULL, AuthzSvc: PVOID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthClientA')(ClientBinding, Privs, ServerPrincName, AuthnLevel, AuthnSvc, AuthzSvc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthclientexa
  public static RpcBindingInqAuthClientExA(
    ClientBinding: RPC_BINDING_HANDLE | 0n,
    Privs: PRPC_AUTHZ_HANDLE | NULL,
    ServerPrincName: PRPC_CSTR | NULL,
    AuthnLevel: PVOID | NULL,
    AuthnSvc: PVOID | NULL,
    AuthzSvc: PVOID | NULL,
    Flags: ULONG,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthClientExA')(ClientBinding, Privs, ServerPrincName, AuthnLevel, AuthnSvc, AuthzSvc, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthclientexw
  public static RpcBindingInqAuthClientExW(
    ClientBinding: RPC_BINDING_HANDLE | 0n,
    Privs: PRPC_AUTHZ_HANDLE | NULL,
    ServerPrincName: PRPC_WSTR | NULL,
    AuthnLevel: PVOID | NULL,
    AuthnSvc: PVOID | NULL,
    AuthzSvc: PVOID | NULL,
    Flags: ULONG,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthClientExW')(ClientBinding, Privs, ServerPrincName, AuthnLevel, AuthnSvc, AuthzSvc, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthclientw
  public static RpcBindingInqAuthClientW(ClientBinding: RPC_BINDING_HANDLE | 0n, Privs: PRPC_AUTHZ_HANDLE | NULL, ServerPrincName: PRPC_WSTR | NULL, AuthnLevel: PVOID | NULL, AuthnSvc: PVOID | NULL, AuthzSvc: PVOID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthClientW')(ClientBinding, Privs, ServerPrincName, AuthnLevel, AuthnSvc, AuthzSvc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthinfoa
  public static RpcBindingInqAuthInfoA(Binding: RPC_BINDING_HANDLE, ServerPrincName: PRPC_CSTR | NULL, AuthnLevel: PVOID | NULL, AuthnSvc: PVOID | NULL, AuthIdentity: PRPC_AUTH_IDENTITY_HANDLE | NULL, AuthzSvc: PVOID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthInfoA')(Binding, ServerPrincName, AuthnLevel, AuthnSvc, AuthIdentity, AuthzSvc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthinfoexa
  public static RpcBindingInqAuthInfoExA(
    Binding: RPC_BINDING_HANDLE,
    ServerPrincName: PRPC_CSTR | NULL,
    AuthnLevel: PVOID | NULL,
    AuthnSvc: PVOID | NULL,
    AuthIdentity: PRPC_AUTH_IDENTITY_HANDLE | NULL,
    AuthzSvc: PVOID | NULL,
    RpcQosVersion: ULONG,
    SecurityQOS: PRPC_SECURITY_QOS | NULL,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthInfoExA')(Binding, ServerPrincName, AuthnLevel, AuthnSvc, AuthIdentity, AuthzSvc, RpcQosVersion, SecurityQOS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthinfoexw
  public static RpcBindingInqAuthInfoExW(
    Binding: RPC_BINDING_HANDLE,
    ServerPrincName: PRPC_WSTR | NULL,
    AuthnLevel: PVOID | NULL,
    AuthnSvc: PVOID | NULL,
    AuthIdentity: PRPC_AUTH_IDENTITY_HANDLE | NULL,
    AuthzSvc: PVOID | NULL,
    RpcQosVersion: ULONG,
    SecurityQOS: PRPC_SECURITY_QOS | NULL,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthInfoExW')(Binding, ServerPrincName, AuthnLevel, AuthnSvc, AuthIdentity, AuthzSvc, RpcQosVersion, SecurityQOS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthinfow
  public static RpcBindingInqAuthInfoW(Binding: RPC_BINDING_HANDLE, ServerPrincName: PRPC_WSTR | NULL, AuthnLevel: PVOID | NULL, AuthnSvc: PVOID | NULL, AuthIdentity: PRPC_AUTH_IDENTITY_HANDLE | NULL, AuthzSvc: PVOID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthInfoW')(Binding, ServerPrincName, AuthnLevel, AuthnSvc, AuthIdentity, AuthzSvc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqmaxcalls
  public static RpcBindingInqMaxCalls(Binding: RPC_BINDING_HANDLE, MaxCalls: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqMaxCalls')(Binding, MaxCalls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqobject
  public static RpcBindingInqObject(Binding: RPC_BINDING_HANDLE, ObjectUuid: PUUID): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqObject')(Binding, ObjectUuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqoption
  public static RpcBindingInqOption(hBinding: RPC_BINDING_HANDLE, option: ULONG, pOptionValue: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqOption')(hBinding, option, pOptionValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingreset
  public static RpcBindingReset(Binding: RPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingReset')(Binding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingserverfromclient
  public static RpcBindingServerFromClient(ClientBinding: RPC_BINDING_HANDLE | 0n, ServerBinding: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingServerFromClient')(ClientBinding, ServerBinding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingsetauthinfoa
  public static RpcBindingSetAuthInfoA(Binding: RPC_BINDING_HANDLE, ServerPrincName: RPC_CSTR | NULL, AuthnLevel: ULONG, AuthnSvc: ULONG, AuthIdentity: RPC_AUTH_IDENTITY_HANDLE | NULL, AuthzSvc: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingSetAuthInfoA')(Binding, ServerPrincName, AuthnLevel, AuthnSvc, AuthIdentity, AuthzSvc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingsetauthinfoexa
  public static RpcBindingSetAuthInfoExA(
    Binding: RPC_BINDING_HANDLE,
    ServerPrincName: RPC_CSTR | NULL,
    AuthnLevel: ULONG,
    AuthnSvc: ULONG,
    AuthIdentity: RPC_AUTH_IDENTITY_HANDLE | NULL,
    AuthzSvc: ULONG,
    SecurityQos: PRPC_SECURITY_QOS | NULL,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingSetAuthInfoExA')(Binding, ServerPrincName, AuthnLevel, AuthnSvc, AuthIdentity, AuthzSvc, SecurityQos);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingsetauthinfoexw
  public static RpcBindingSetAuthInfoExW(
    Binding: RPC_BINDING_HANDLE,
    ServerPrincName: RPC_WSTR | NULL,
    AuthnLevel: ULONG,
    AuthnSvc: ULONG,
    AuthIdentity: RPC_AUTH_IDENTITY_HANDLE | NULL,
    AuthzSvc: ULONG,
    SecurityQos: PRPC_SECURITY_QOS | NULL,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingSetAuthInfoExW')(Binding, ServerPrincName, AuthnLevel, AuthnSvc, AuthIdentity, AuthzSvc, SecurityQos);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingsetauthinfow
  public static RpcBindingSetAuthInfoW(Binding: RPC_BINDING_HANDLE, ServerPrincName: RPC_WSTR | NULL, AuthnLevel: ULONG, AuthnSvc: ULONG, AuthIdentity: RPC_AUTH_IDENTITY_HANDLE | NULL, AuthzSvc: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingSetAuthInfoW')(Binding, ServerPrincName, AuthnLevel, AuthnSvc, AuthIdentity, AuthzSvc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingsetobject
  public static RpcBindingSetObject(Binding: RPC_BINDING_HANDLE, ObjectUuid: PUUID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingSetObject')(Binding, ObjectUuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingsetoption
  public static RpcBindingSetOption(hBinding: RPC_BINDING_HANDLE, option: ULONG, optionValue: bigint): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingSetOption')(hBinding, option, optionValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingtostringbindinga
  public static RpcBindingToStringBindingA(Binding: RPC_BINDING_HANDLE, StringBinding: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingToStringBindingA')(Binding, StringBinding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingtostringbindingw
  public static RpcBindingToStringBindingW(Binding: RPC_BINDING_HANDLE, StringBinding: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingToStringBindingW')(Binding, StringBinding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingunbind
  public static RpcBindingUnbind(Binding: RPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingUnbind')(Binding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingvectorfree
  public static RpcBindingVectorFree(BindingVector: PRPC_BINDING_VECTOR): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingVectorFree')(BindingVector);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpccancelthread
  public static RpcCancelThread(Thread: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcCancelThread')(Thread);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpccancelthreadex
  public static RpcCancelThreadEx(Thread: PVOID, Timeout: LONG): RPC_STATUS {
    return Rpcrt4.Load('RpcCancelThreadEx')(Thread, Timeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpccertgenerateprincipalnamea
  public static RpcCertGeneratePrincipalNameA(Context: PCCERT_CONTEXT, Flags: ULONG, pBuffer: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcCertGeneratePrincipalNameA')(Context, Flags, pBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpccertgenerateprincipalnamew
  public static RpcCertGeneratePrincipalNameW(Context: PCCERT_CONTEXT, Flags: ULONG, pBuffer: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcCertGeneratePrincipalNameW')(Context, Flags, pBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpccertmatchprincipalname
  public static RpcCertMatchPrincipalName(Context: PCCERT_CONTEXT, PrincipalName: RPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcCertMatchPrincipalName')(Context, PrincipalName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcepregistera
  public static RpcEpRegisterA(IfSpec: RPC_IF_HANDLE, BindingVector: PRPC_BINDING_VECTOR, UuidVector: PUUID_VECTOR | NULL, Annotation: RPC_CSTR | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcEpRegisterA')(IfSpec, BindingVector, UuidVector, Annotation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcepregisternoreplacea
  public static RpcEpRegisterNoReplaceA(IfSpec: RPC_IF_HANDLE, BindingVector: PRPC_BINDING_VECTOR, UuidVector: PUUID_VECTOR | NULL, Annotation: RPC_CSTR | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcEpRegisterNoReplaceA')(IfSpec, BindingVector, UuidVector, Annotation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcepregisternoreplacew
  public static RpcEpRegisterNoReplaceW(IfSpec: RPC_IF_HANDLE, BindingVector: PRPC_BINDING_VECTOR, UuidVector: PUUID_VECTOR | NULL, Annotation: RPC_WSTR | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcEpRegisterNoReplaceW')(IfSpec, BindingVector, UuidVector, Annotation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcepregisterw
  public static RpcEpRegisterW(IfSpec: RPC_IF_HANDLE, BindingVector: PRPC_BINDING_VECTOR, UuidVector: PUUID_VECTOR | NULL, Annotation: RPC_WSTR | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcEpRegisterW')(IfSpec, BindingVector, UuidVector, Annotation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcepresolvebinding
  public static RpcEpResolveBinding(Binding: RPC_BINDING_HANDLE, IfSpec: RPC_IF_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcEpResolveBinding')(Binding, IfSpec);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcepunregister
  public static RpcEpUnregister(IfSpec: RPC_IF_HANDLE, BindingVector: PRPC_BINDING_VECTOR, UuidVector: PUUID_VECTOR | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcEpUnregister')(IfSpec, BindingVector, UuidVector);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcerroraddrecord
  public static RpcErrorAddRecord(EnumHandle: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcErrorAddRecord')(EnumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcerrorclearinformation
  public static RpcErrorClearInformation(): VOID {
    return Rpcrt4.Load('RpcErrorClearInformation')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcerrorendenumeration
  public static RpcErrorEndEnumeration(EnumHandle: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcErrorEndEnumeration')(EnumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcerrorgetnextrecord
  public static RpcErrorGetNextRecord(EnumHandle: PVOID, CopyStrings: BOOL, ErrorInfo: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcErrorGetNextRecord')(EnumHandle, CopyStrings, ErrorInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcerrorgetnumberofrecords
  public static RpcErrorGetNumberOfRecords(EnumHandle: PVOID, Records: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcErrorGetNumberOfRecords')(EnumHandle, Records);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcerrorloaderrorinfo
  public static RpcErrorLoadErrorInfo(ErrorBlob: PVOID, BlobSize: bigint, EnumHandle: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcErrorLoadErrorInfo')(ErrorBlob, BlobSize, EnumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcerrorresetenumeration
  public static RpcErrorResetEnumeration(EnumHandle: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcErrorResetEnumeration')(EnumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcerrorsaveerrorinfo
  public static RpcErrorSaveErrorInfo(EnumHandle: PVOID, ErrorBlob: PVOID, BlobSize: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcErrorSaveErrorInfo')(EnumHandle, ErrorBlob, BlobSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcerrorstartenumeration
  public static RpcErrorStartEnumeration(EnumHandle: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcErrorStartEnumeration')(EnumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcexceptionfilter
  public static RpcExceptionFilter(ExceptionCode: ULONG): number {
    return Rpcrt4.Load('RpcExceptionFilter')(ExceptionCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcfreeauthorizationcontext
  public static RpcFreeAuthorizationContext(pClientContext: PRPC_AUTHZ_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcFreeAuthorizationContext')(pClientContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcgetauthorizationcontextforclient
  public static RpcGetAuthorizationContextForClient(
    ClientBinding: RPC_BINDING_HANDLE | 0n,
    ImpersonateOnReturn: BOOL,
    Reserved1: PVOID | NULL,
    pExpirationTime: PVOID | NULL,
    Reserved2: bigint,
    Reserved3: DWORD,
    Reserved4: PVOID | NULL,
    pAuthzClientContext: PRPC_AUTHZ_HANDLE,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcGetAuthorizationContextForClient')(ClientBinding, ImpersonateOnReturn, Reserved1, pExpirationTime, Reserved2, Reserved3, Reserved4, pAuthzClientContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcifidvectorfree
  public static RpcIfIdVectorFree(IfIdVector: PRPC_IF_ID_VECTOR): RPC_STATUS {
    return Rpcrt4.Load('RpcIfIdVectorFree')(IfIdVector);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcifinqid
  public static RpcIfInqId(RpcIfHandle: RPC_IF_HANDLE, RpcIfId: PRPC_IF_ID): RPC_STATUS {
    return Rpcrt4.Load('RpcIfInqId')(RpcIfHandle, RpcIfId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcimpersonateclient
  public static RpcImpersonateClient(BindingHandle: RPC_BINDING_HANDLE | 0n): RPC_STATUS {
    return Rpcrt4.Load('RpcImpersonateClient')(BindingHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcimpersonateclient2
  public static RpcImpersonateClient2(BindingHandle: RPC_BINDING_HANDLE | 0n, Flags: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcImpersonateClient2')(BindingHandle, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcimpersonateclientcontainer
  public static RpcImpersonateClientContainer(BindingHandle: RPC_BINDING_HANDLE | 0n): RPC_STATUS {
    return Rpcrt4.Load('RpcImpersonateClientContainer')(BindingHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtenableidlecleanup
  public static RpcMgmtEnableIdleCleanup(): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtEnableIdleCleanup')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtepeltinqbegin
  public static RpcMgmtEpEltInqBegin(EpBinding: RPC_BINDING_HANDLE | 0n, InquiryType: ULONG, IfId: PRPC_IF_ID | NULL, VersOption: ULONG, ObjectUuid: PUUID | NULL, InquiryContext: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtEpEltInqBegin')(EpBinding, InquiryType, IfId, VersOption, ObjectUuid, InquiryContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtepeltinqdone
  public static RpcMgmtEpEltInqDone(InquiryContext: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtEpEltInqDone')(InquiryContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtepeltinqnexta
  public static RpcMgmtEpEltInqNextA(InquiryContext: RPC_BINDING_HANDLE, IfId: PRPC_IF_ID, Binding: PRPC_BINDING_HANDLE, ObjectUuid: PUUID, Annotation: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtEpEltInqNextA')(InquiryContext, IfId, Binding, ObjectUuid, Annotation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtepeltinqnextw
  public static RpcMgmtEpEltInqNextW(InquiryContext: RPC_BINDING_HANDLE, IfId: PRPC_IF_ID, Binding: PRPC_BINDING_HANDLE, ObjectUuid: PUUID, Annotation: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtEpEltInqNextW')(InquiryContext, IfId, Binding, ObjectUuid, Annotation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtepunregister
  public static RpcMgmtEpUnregister(EpBinding: RPC_BINDING_HANDLE | 0n, IfId: PRPC_IF_ID, Binding: RPC_BINDING_HANDLE, ObjectUuid: PUUID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtEpUnregister')(EpBinding, IfId, Binding, ObjectUuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtinqcomtimeout
  public static RpcMgmtInqComTimeout(Binding: RPC_BINDING_HANDLE, Timeout: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtInqComTimeout')(Binding, Timeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtinqdefaultprotectlevel
  public static RpcMgmtInqDefaultProtectLevel(AuthnSvc: ULONG, AuthnLevel: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtInqDefaultProtectLevel')(AuthnSvc, AuthnLevel);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtinqifids
  public static RpcMgmtInqIfIds(Binding: RPC_BINDING_HANDLE | 0n, IfIdVector: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtInqIfIds')(Binding, IfIdVector);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtinqserverprincnamea
  public static RpcMgmtInqServerPrincNameA(Binding: RPC_BINDING_HANDLE | 0n, AuthnSvc: ULONG, ServerPrincName: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtInqServerPrincNameA')(Binding, AuthnSvc, ServerPrincName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtinqserverprincnamew
  public static RpcMgmtInqServerPrincNameW(Binding: RPC_BINDING_HANDLE | 0n, AuthnSvc: ULONG, ServerPrincName: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtInqServerPrincNameW')(Binding, AuthnSvc, ServerPrincName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtinqstats
  public static RpcMgmtInqStats(Binding: RPC_BINDING_HANDLE | 0n, Statistics: PRPC_STATS_VECTOR): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtInqStats')(Binding, Statistics);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtisserverlistening
  public static RpcMgmtIsServerListening(Binding: RPC_BINDING_HANDLE | 0n): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtIsServerListening')(Binding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtsetauthorizationfn
  public static RpcMgmtSetAuthorizationFn(AuthorizationFn: RPC_MGMT_AUTHORIZATION_FN | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtSetAuthorizationFn')(AuthorizationFn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtsetcanceltimeout
  public static RpcMgmtSetCancelTimeout(Timeout: LONG): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtSetCancelTimeout')(Timeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtsetcomtimeout
  public static RpcMgmtSetComTimeout(Binding: RPC_BINDING_HANDLE, Timeout: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtSetComTimeout')(Binding, Timeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtsetserverstacksize
  public static RpcMgmtSetServerStackSize(ThreadStackSize: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtSetServerStackSize')(ThreadStackSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtstatsvectorfree
  public static RpcMgmtStatsVectorFree(StatsVector: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtStatsVectorFree')(StatsVector);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtstopserverlistening
  public static RpcMgmtStopServerListening(Binding: RPC_BINDING_HANDLE | 0n): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtStopServerListening')(Binding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtwaitserverlisten
  public static RpcMgmtWaitServerListen(): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtWaitServerListen')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcnetworkinqprotseqsa
  public static RpcNetworkInqProtseqsA(ProtseqVector: PRPC_PROTSEQ_VECTORA): RPC_STATUS {
    return Rpcrt4.Load('RpcNetworkInqProtseqsA')(ProtseqVector);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcnetworkinqprotseqsw
  public static RpcNetworkInqProtseqsW(ProtseqVector: PRPC_PROTSEQ_VECTORW): RPC_STATUS {
    return Rpcrt4.Load('RpcNetworkInqProtseqsW')(ProtseqVector);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcnetworkisprotseqvalida
  public static RpcNetworkIsProtseqValidA(Protseq: RPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcNetworkIsProtseqValidA')(Protseq);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcnetworkisprotseqvalidw
  public static RpcNetworkIsProtseqValidW(Protseq: RPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcNetworkIsProtseqValidW')(Protseq);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcnsi/nf-rpcnsi-rpcnsbindinginqentrynamea
  public static RpcNsBindingInqEntryNameA(Binding: RPC_BINDING_HANDLE, EntryNameSyntax: ULONG, EntryName: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcNsBindingInqEntryNameA')(Binding, EntryNameSyntax, EntryName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcnsi/nf-rpcnsi-rpcnsbindinginqentrynamew
  public static RpcNsBindingInqEntryNameW(Binding: RPC_BINDING_HANDLE, EntryNameSyntax: ULONG, EntryName: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcNsBindingInqEntryNameW')(Binding, EntryNameSyntax, EntryName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcobjectinqtype
  public static RpcObjectInqType(ObjectUuid: PUUID, TypeUuid: PUUID): RPC_STATUS {
    return Rpcrt4.Load('RpcObjectInqType')(ObjectUuid, TypeUuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcobjectsetinqfn
  public static RpcObjectSetInqFn(InquiryFn: RPC_OBJECT_INQ_FN | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcObjectSetInqFn')(InquiryFn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcobjectsettype
  public static RpcObjectSetType(ObjectUuid: PUUID, TypeUuid: PUUID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcObjectSetType')(ObjectUuid, TypeUuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcprotseqvectorfreea
  public static RpcProtseqVectorFreeA(ProtseqVector: PRPC_PROTSEQ_VECTORA): RPC_STATUS {
    return Rpcrt4.Load('RpcProtseqVectorFreeA')(ProtseqVector);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcprotseqvectorfreew
  public static RpcProtseqVectorFreeW(ProtseqVector: PRPC_PROTSEQ_VECTORW): RPC_STATUS {
    return Rpcrt4.Load('RpcProtseqVectorFreeW')(ProtseqVector);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcraiseexception
  public static RpcRaiseException(exception: RPC_STATUS): VOID {
    return Rpcrt4.Load('RpcRaiseException')(exception);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcrevertcontainerimpersonation
  public static RpcRevertContainerImpersonation(): RPC_STATUS {
    return Rpcrt4.Load('RpcRevertContainerImpersonation')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcreverttoself
  public static RpcRevertToSelf(): RPC_STATUS {
    return Rpcrt4.Load('RpcRevertToSelf')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcreverttoselfex
  public static RpcRevertToSelfEx(BindingHandle: RPC_BINDING_HANDLE | 0n): RPC_STATUS {
    return Rpcrt4.Load('RpcRevertToSelfEx')(BindingHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcservercompletesecuritycallback
  public static RpcServerCompleteSecurityCallback(BindingHandle: RPC_BINDING_HANDLE, Status: RPC_STATUS): RPC_STATUS {
    return Rpcrt4.Load('RpcServerCompleteSecurityCallback')(BindingHandle, Status);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqbindinghandle
  public static RpcServerInqBindingHandle(Binding: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqBindingHandle')(Binding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqbindings
  public static RpcServerInqBindings(BindingVector: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqBindings')(BindingVector);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqbindingsex
  public static RpcServerInqBindingsEx(SecurityDescriptor: PVOID | NULL, BindingVector: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqBindingsEx')(SecurityDescriptor, BindingVector);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqcallattributesa
  public static RpcServerInqCallAttributesA(ClientBinding: RPC_BINDING_HANDLE | 0n, RpcCallAttributes: PRPC_CALL_ATTRIBUTES_V2_A): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqCallAttributesA')(ClientBinding, RpcCallAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqcallattributesw
  public static RpcServerInqCallAttributesW(ClientBinding: RPC_BINDING_HANDLE | 0n, RpcCallAttributes: PRPC_CALL_ATTRIBUTES_V2_W): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqCallAttributesW')(ClientBinding, RpcCallAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqdefaultprincnamea
  public static RpcServerInqDefaultPrincNameA(AuthnSvc: ULONG, PrincName: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqDefaultPrincNameA')(AuthnSvc, PrincName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqdefaultprincnamew
  public static RpcServerInqDefaultPrincNameW(AuthnSvc: ULONG, PrincName: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqDefaultPrincNameW')(AuthnSvc, PrincName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqif
  public static RpcServerInqIf(IfSpec: RPC_IF_HANDLE, MgrTypeUuid: PUUID | NULL, MgrEpv: PRPC_MGR_EPV): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqIf')(IfSpec, MgrTypeUuid, MgrEpv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinterfacegroupactivate
  public static RpcServerInterfaceGroupActivate(InterfaceGroup: RPC_INTERFACE_GROUP): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInterfaceGroupActivate')(InterfaceGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinterfacegroupclose
  public static RpcServerInterfaceGroupClose(InterfaceGroup: RPC_INTERFACE_GROUP): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInterfaceGroupClose')(InterfaceGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinterfacegroupcreatea
  public static RpcServerInterfaceGroupCreateA(
    Interfaces: PRPC_INTERFACE_TEMPLATEA,
    NumIfs: ULONG,
    Endpoints: PRPC_ENDPOINT_TEMPLATEA,
    NumEndpoints: ULONG,
    IdleSecondsTimeout: ULONG,
    IdleCallbackFn: PVOID | NULL,
    IdleCallbackContext: PVOID | NULL,
    InterfaceGroup: PVOID,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInterfaceGroupCreateA')(Interfaces, NumIfs, Endpoints, NumEndpoints, IdleSecondsTimeout, IdleCallbackFn, IdleCallbackContext, InterfaceGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinterfacegroupcreatew
  public static RpcServerInterfaceGroupCreateW(
    Interfaces: PRPC_INTERFACE_TEMPLATEW,
    NumIfs: ULONG,
    Endpoints: PRPC_ENDPOINT_TEMPLATEW,
    NumEndpoints: ULONG,
    IdleSecondsTimeout: ULONG,
    IdleCallbackFn: PVOID | NULL,
    IdleCallbackContext: PVOID | NULL,
    InterfaceGroup: PVOID,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInterfaceGroupCreateW')(Interfaces, NumIfs, Endpoints, NumEndpoints, IdleSecondsTimeout, IdleCallbackFn, IdleCallbackContext, InterfaceGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinterfacegroupdeactivate
  public static RpcServerInterfaceGroupDeactivate(InterfaceGroup: RPC_INTERFACE_GROUP, ForceCompleteCalls: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInterfaceGroupDeactivate')(InterfaceGroup, ForceCompleteCalls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinterfacegroupinqbindings
  public static RpcServerInterfaceGroupInqBindings(InterfaceGroup: RPC_INTERFACE_GROUP, BindingVector: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInterfaceGroupInqBindings')(InterfaceGroup, BindingVector);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverlisten
  public static RpcServerListen(MinimumCallThreads: ULONG, MaxCalls: ULONG, DontWait: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcServerListen')(MinimumCallThreads, MaxCalls, DontWait);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverregisterauthinfoa
  public static RpcServerRegisterAuthInfoA(ServerPrincName: RPC_CSTR | NULL, AuthnSvc: ULONG, GetKeyFn: RPC_AUTH_KEY_RETRIEVAL_FN | NULL, Arg: PVOID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcServerRegisterAuthInfoA')(ServerPrincName, AuthnSvc, GetKeyFn, Arg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverregisterauthinfow
  public static RpcServerRegisterAuthInfoW(ServerPrincName: RPC_WSTR | NULL, AuthnSvc: ULONG, GetKeyFn: RPC_AUTH_KEY_RETRIEVAL_FN | NULL, Arg: PVOID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcServerRegisterAuthInfoW')(ServerPrincName, AuthnSvc, GetKeyFn, Arg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverregisterif
  public static RpcServerRegisterIf(IfSpec: RPC_IF_HANDLE, MgrTypeUuid: PUUID | NULL, MgrEpv: PRPC_MGR_EPV | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcServerRegisterIf')(IfSpec, MgrTypeUuid, MgrEpv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverregisterif2
  public static RpcServerRegisterIf2(IfSpec: RPC_IF_HANDLE, MgrTypeUuid: PUUID | NULL, MgrEpv: PRPC_MGR_EPV | NULL, Flags: ULONG, MaxCalls: ULONG, MaxRpcSize: ULONG, IfCallback: RPC_IF_CALLBACK_FN | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcServerRegisterIf2')(IfSpec, MgrTypeUuid, MgrEpv, Flags, MaxCalls, MaxRpcSize, IfCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverregisterif3
  public static RpcServerRegisterIf3(
    IfSpec: RPC_IF_HANDLE,
    MgrTypeUuid: PUUID | NULL,
    MgrEpv: PRPC_MGR_EPV | NULL,
    Flags: ULONG,
    MaxCalls: ULONG,
    MaxRpcSize: ULONG,
    IfCallbackFn: RPC_IF_CALLBACK_FN | NULL,
    SecurityDescriptor: PVOID | NULL,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcServerRegisterIf3')(IfSpec, MgrTypeUuid, MgrEpv, Flags, MaxCalls, MaxRpcSize, IfCallbackFn, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverregisterifex
  public static RpcServerRegisterIfEx(IfSpec: RPC_IF_HANDLE, MgrTypeUuid: PUUID | NULL, MgrEpv: PRPC_MGR_EPV | NULL, Flags: ULONG, MaxCalls: ULONG, IfCallback: RPC_IF_CALLBACK_FN | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcServerRegisterIfEx')(IfSpec, MgrTypeUuid, MgrEpv, Flags, MaxCalls, IfCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserversubscribefornotification
  public static RpcServerSubscribeForNotification(Binding: RPC_BINDING_HANDLE, Notification: number, NotificationType: number, NotificationCallBack: RPC_NOTIFICATION_CALLBACK): RPC_STATUS {
    return Rpcrt4.Load('RpcServerSubscribeForNotification')(Binding, Notification, NotificationType, NotificationCallBack);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcservertestcancel
  public static RpcServerTestCancel(BindingHandle: RPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcServerTestCancel')(BindingHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverunregisterif
  public static RpcServerUnregisterIf(IfSpec: RPC_IF_HANDLE | NULL, MgrTypeUuid: PUUID | NULL, WaitForCallsToComplete: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUnregisterIf')(IfSpec, MgrTypeUuid, WaitForCallsToComplete);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverunregisterifex
  public static RpcServerUnregisterIfEx(IfSpec: RPC_IF_HANDLE | NULL, MgrTypeUuid: PUUID | NULL, RundownContextHandles: number): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUnregisterIfEx')(IfSpec, MgrTypeUuid, RundownContextHandles);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverunsubscribefornotification
  public static RpcServerUnsubscribeForNotification(Binding: RPC_BINDING_HANDLE, NotificationType: number, NotificationsQueued: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUnsubscribeForNotification')(Binding, NotificationType, NotificationsQueued);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseallprotseqs
  public static RpcServerUseAllProtseqs(MaxCalls: ULONG, SecurityDescriptor: PVOID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseAllProtseqs')(MaxCalls, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseallprotseqsex
  public static RpcServerUseAllProtseqsEx(MaxCalls: ULONG, SecurityDescriptor: PVOID | NULL, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseAllProtseqsEx')(MaxCalls, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseallprotseqsif
  public static RpcServerUseAllProtseqsIf(MaxCalls: ULONG, IfSpec: RPC_IF_HANDLE, SecurityDescriptor: PVOID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseAllProtseqsIf')(MaxCalls, IfSpec, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseallprotseqsifex
  public static RpcServerUseAllProtseqsIfEx(MaxCalls: ULONG, IfSpec: RPC_IF_HANDLE, SecurityDescriptor: PVOID | NULL, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseAllProtseqsIfEx')(MaxCalls, IfSpec, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqa
  public static RpcServerUseProtseqA(Protseq: RPC_CSTR, MaxCalls: ULONG, SecurityDescriptor: PVOID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqA')(Protseq, MaxCalls, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqepa
  public static RpcServerUseProtseqEpA(Protseq: RPC_CSTR, MaxCalls: ULONG, Endpoint: RPC_CSTR, SecurityDescriptor: PVOID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqEpA')(Protseq, MaxCalls, Endpoint, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqepexa
  public static RpcServerUseProtseqEpExA(Protseq: RPC_CSTR, MaxCalls: ULONG, Endpoint: RPC_CSTR, SecurityDescriptor: PVOID | NULL, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqEpExA')(Protseq, MaxCalls, Endpoint, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqepexw
  public static RpcServerUseProtseqEpExW(Protseq: RPC_WSTR, MaxCalls: ULONG, Endpoint: RPC_WSTR, SecurityDescriptor: PVOID | NULL, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqEpExW')(Protseq, MaxCalls, Endpoint, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqepw
  public static RpcServerUseProtseqEpW(Protseq: RPC_WSTR, MaxCalls: ULONG, Endpoint: RPC_WSTR, SecurityDescriptor: PVOID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqEpW')(Protseq, MaxCalls, Endpoint, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqexa
  public static RpcServerUseProtseqExA(Protseq: RPC_CSTR, MaxCalls: ULONG, SecurityDescriptor: PVOID | NULL, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqExA')(Protseq, MaxCalls, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqexw
  public static RpcServerUseProtseqExW(Protseq: RPC_WSTR, MaxCalls: ULONG, SecurityDescriptor: PVOID | NULL, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqExW')(Protseq, MaxCalls, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqifa
  public static RpcServerUseProtseqIfA(Protseq: RPC_CSTR, MaxCalls: ULONG, IfSpec: RPC_IF_HANDLE, SecurityDescriptor: PVOID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqIfA')(Protseq, MaxCalls, IfSpec, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqifexa
  public static RpcServerUseProtseqIfExA(Protseq: RPC_CSTR, MaxCalls: ULONG, IfSpec: RPC_IF_HANDLE, SecurityDescriptor: PVOID | NULL, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqIfExA')(Protseq, MaxCalls, IfSpec, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqifexw
  public static RpcServerUseProtseqIfExW(Protseq: RPC_WSTR, MaxCalls: ULONG, IfSpec: RPC_IF_HANDLE, SecurityDescriptor: PVOID | NULL, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqIfExW')(Protseq, MaxCalls, IfSpec, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqifw
  public static RpcServerUseProtseqIfW(Protseq: RPC_WSTR, MaxCalls: ULONG, IfSpec: RPC_IF_HANDLE, SecurityDescriptor: PVOID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqIfW')(Protseq, MaxCalls, IfSpec, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqw
  public static RpcServerUseProtseqW(Protseq: RPC_WSTR, MaxCalls: ULONG, SecurityDescriptor: PVOID | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqW')(Protseq, MaxCalls, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveryield
  public static RpcServerYield(): VOID {
    return Rpcrt4.Load('RpcServerYield')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsmallocate
  public static RpcSmAllocate(Size: bigint, pStatus: PRPC_STATUS): PVOID | NULL {
    return Rpcrt4.Load('RpcSmAllocate')(Size, pStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsmclientfree
  public static RpcSmClientFree(pNodeToFree: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcSmClientFree')(pNodeToFree);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsmdestroyclientcontext
  public static RpcSmDestroyClientContext(ContextHandle: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcSmDestroyClientContext')(ContextHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsmdisableallocate
  public static RpcSmDisableAllocate(): RPC_STATUS {
    return Rpcrt4.Load('RpcSmDisableAllocate')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsmenableallocate
  public static RpcSmEnableAllocate(): RPC_STATUS {
    return Rpcrt4.Load('RpcSmEnableAllocate')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsmfree
  public static RpcSmFree(NodeToFree: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcSmFree')(NodeToFree);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsmgetthreadhandle
  public static RpcSmGetThreadHandle(pStatus: PRPC_STATUS): PVOID | NULL {
    return Rpcrt4.Load('RpcSmGetThreadHandle')(pStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsmsetclientallocfree
  public static RpcSmSetClientAllocFree(ClientAlloc: PVOID, ClientFree: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcSmSetClientAllocFree')(ClientAlloc, ClientFree);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsmsetthreadhandle
  public static RpcSmSetThreadHandle(Id: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcSmSetThreadHandle')(Id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsmswapclientallocfree
  public static RpcSmSwapClientAllocFree(ClientAlloc: PVOID, ClientFree: PVOID, OldClientAlloc: PVOID, OldClientFree: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcSmSwapClientAllocFree')(ClientAlloc, ClientFree, OldClientAlloc, OldClientFree);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcssallocate
  public static RpcSsAllocate(Size: bigint): PVOID | NULL {
    return Rpcrt4.Load('RpcSsAllocate')(Size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsscontextlockexclusive
  public static RpcSsContextLockExclusive(ServerBindingHandle: RPC_BINDING_HANDLE, UserContext: PVOID): VOID {
    return Rpcrt4.Load('RpcSsContextLockExclusive')(ServerBindingHandle, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsscontextlockshared
  public static RpcSsContextLockShared(ServerBindingHandle: RPC_BINDING_HANDLE, UserContext: PVOID): VOID {
    return Rpcrt4.Load('RpcSsContextLockShared')(ServerBindingHandle, UserContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcssdestroyclientcontext
  public static RpcSsDestroyClientContext(ContextHandle: PVOID): VOID {
    return Rpcrt4.Load('RpcSsDestroyClientContext')(ContextHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcssdisableallocate
  public static RpcSsDisableAllocate(): VOID {
    return Rpcrt4.Load('RpcSsDisableAllocate')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcssenableallocate
  public static RpcSsEnableAllocate(): VOID {
    return Rpcrt4.Load('RpcSsEnableAllocate')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcssfree
  public static RpcSsFree(NodeToFree: PVOID): VOID {
    return Rpcrt4.Load('RpcSsFree')(NodeToFree);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcssgetcontextbinding
  public static RpcSsGetContextBinding(ContextHandle: PVOID, Binding: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcSsGetContextBinding')(ContextHandle, Binding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcssgetthreadhandle
  public static RpcSsGetThreadHandle(): PVOID | NULL {
    return Rpcrt4.Load('RpcSsGetThreadHandle')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsssetclientallocfree
  public static RpcSsSetClientAllocFree(ClientAlloc: PVOID, ClientFree: PVOID): VOID {
    return Rpcrt4.Load('RpcSsSetClientAllocFree')(ClientAlloc, ClientFree);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsssetthreadhandle
  public static RpcSsSetThreadHandle(Id: PVOID): VOID {
    return Rpcrt4.Load('RpcSsSetThreadHandle')(Id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcssswapclientallocfree
  public static RpcSsSwapClientAllocFree(ClientAlloc: PVOID, ClientFree: PVOID, OldClientAlloc: PVOID, OldClientFree: PVOID): VOID {
    return Rpcrt4.Load('RpcSsSwapClientAllocFree')(ClientAlloc, ClientFree, OldClientAlloc, OldClientFree);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcstringbindingcomposea
  public static RpcStringBindingComposeA(ObjUuid: RPC_CSTR | NULL, Protseq: RPC_CSTR | NULL, NetworkAddr: RPC_CSTR | NULL, Endpoint: RPC_CSTR | NULL, Options: RPC_CSTR | NULL, StringBinding: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcStringBindingComposeA')(ObjUuid, Protseq, NetworkAddr, Endpoint, Options, StringBinding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcstringbindingcomposew
  public static RpcStringBindingComposeW(ObjUuid: RPC_WSTR | NULL, Protseq: RPC_WSTR | NULL, NetworkAddr: RPC_WSTR | NULL, Endpoint: RPC_WSTR | NULL, Options: RPC_WSTR | NULL, StringBinding: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcStringBindingComposeW')(ObjUuid, Protseq, NetworkAddr, Endpoint, Options, StringBinding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcstringbindingparsea
  public static RpcStringBindingParseA(StringBinding: RPC_CSTR, ObjUuid: PRPC_CSTR | NULL, Protseq: PRPC_CSTR | NULL, NetworkAddr: PRPC_CSTR | NULL, Endpoint: PRPC_CSTR | NULL, NetworkOptions: PRPC_CSTR | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcStringBindingParseA')(StringBinding, ObjUuid, Protseq, NetworkAddr, Endpoint, NetworkOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcstringbindingparsew
  public static RpcStringBindingParseW(StringBinding: RPC_WSTR, ObjUuid: PRPC_WSTR | NULL, Protseq: PRPC_WSTR | NULL, NetworkAddr: PRPC_WSTR | NULL, Endpoint: PRPC_WSTR | NULL, NetworkOptions: PRPC_WSTR | NULL): RPC_STATUS {
    return Rpcrt4.Load('RpcStringBindingParseW')(StringBinding, ObjUuid, Protseq, NetworkAddr, Endpoint, NetworkOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcstringfreea
  public static RpcStringFreeA(String: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcStringFreeA')(String);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcstringfreew
  public static RpcStringFreeW(String: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcStringFreeW')(String);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpctestcancel
  public static RpcTestCancel(): RPC_STATUS {
    return Rpcrt4.Load('RpcTestCancel')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcuserfree
  public static RpcUserFree(AsyncHandle: RPC_BINDING_HANDLE | 0n, pBuffer: PVOID): VOID {
    return Rpcrt4.Load('RpcUserFree')(AsyncHandle, pBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-towerconstruct
  public static TowerConstruct(ObjectUuid: PUUID, SyntaxUuid: PUUID, Protseq: RPC_CSTR, Endpoint: RPC_CSTR, Address: RPC_CSTR, FloorCount: PVOID, Tower: PVOID): RPC_STATUS {
    return Rpcrt4.Load('TowerConstruct')(ObjectUuid, SyntaxUuid, Protseq, Endpoint, Address, FloorCount, Tower);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-towerexplode
  public static TowerExplode(Tower: PVOID, ObjectUuid: PUUID | NULL, SyntaxUuid: PUUID | NULL, Protseq: PRPC_CSTR | NULL, Endpoint: PRPC_CSTR | NULL, Address: PRPC_CSTR | NULL): RPC_STATUS {
    return Rpcrt4.Load('TowerExplode')(Tower, ObjectUuid, SyntaxUuid, Protseq, Endpoint, Address);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidcompare
  public static UuidCompare(Uuid1: PUUID, Uuid2: PUUID, Status: PRPC_STATUS): number {
    return Rpcrt4.Load('UuidCompare')(Uuid1, Uuid2, Status);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidcreate
  public static UuidCreate(Uuid: PUUID): RPC_STATUS {
    return Rpcrt4.Load('UuidCreate')(Uuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidcreatenil
  public static UuidCreateNil(NilUuid: PUUID): RPC_STATUS {
    return Rpcrt4.Load('UuidCreateNil')(NilUuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidcreatesequential
  public static UuidCreateSequential(Uuid: PUUID): RPC_STATUS {
    return Rpcrt4.Load('UuidCreateSequential')(Uuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidequal
  public static UuidEqual(Uuid1: PUUID, Uuid2: PUUID, Status: PRPC_STATUS): number {
    return Rpcrt4.Load('UuidEqual')(Uuid1, Uuid2, Status);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidfromstringa
  public static UuidFromStringA(StringUuid: RPC_CSTR | NULL, Uuid: PUUID): RPC_STATUS {
    return Rpcrt4.Load('UuidFromStringA')(StringUuid, Uuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidfromstringw
  public static UuidFromStringW(StringUuid: RPC_WSTR | NULL, Uuid: PUUID): RPC_STATUS {
    return Rpcrt4.Load('UuidFromStringW')(StringUuid, Uuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidhash
  public static UuidHash(Uuid: PUUID, Status: PRPC_STATUS): USHORT {
    return Rpcrt4.Load('UuidHash')(Uuid, Status);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidisnil
  public static UuidIsNil(Uuid: PUUID, Status: PRPC_STATUS): number {
    return Rpcrt4.Load('UuidIsNil')(Uuid, Status);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidtostringa
  public static UuidToStringA(Uuid: PUUID, StringUuid: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('UuidToStringA')(Uuid, StringUuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidtostringw
  public static UuidToStringW(Uuid: PUUID, StringUuid: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('UuidToStringW')(Uuid, StringUuid);
  }
}

export default Rpcrt4;
