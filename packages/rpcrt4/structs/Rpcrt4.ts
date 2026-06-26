import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BOOL, DWORD, LONG, LPSTR, LPVOID, LPWSTR, LUID, NULL, Nullable, Optional, PVOID, SIZE_T, ULONG, ULONG_PTR, USHORT, VOID } from '../types/Rpcrt4';
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
  public static MesBufferHandleReset(Handle: MIDL_ES_HANDLE, HandleStyle: ULONG, Operation: ULONG, Buffer: Optional<PVOID>, BufferSize: ULONG, EncodedSize_out: Optional<PVOID>): RPC_STATUS {
    return Rpcrt4.Load('MesBufferHandleReset')(Handle, HandleStyle, Operation, Buffer, BufferSize, EncodedSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-mesdecodebufferhandlecreate
  public static MesDecodeBufferHandleCreate(Buffer: LPSTR, BufferSize: ULONG, pHandle_out: PMIDL_ES_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('MesDecodeBufferHandleCreate')(Buffer, BufferSize, pHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-mesdecodeincrementalhandlecreate
  public static MesDecodeIncrementalHandleCreate(UserState: PVOID, ReadFn: PVOID, pHandle_out: PMIDL_ES_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('MesDecodeIncrementalHandleCreate')(UserState, ReadFn, pHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-mesencodedynbufferhandlecreate
  public static MesEncodeDynBufferHandleCreate(Buffer_out: PVOID, EncodedSize_out: PVOID, pHandle_out: PMIDL_ES_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('MesEncodeDynBufferHandleCreate')(Buffer_out, EncodedSize_out, pHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-mesencodefixedbufferhandlecreate
  public static MesEncodeFixedBufferHandleCreate(pBuffer_out: LPSTR, BufferSize: ULONG, pEncodedSize_out: PVOID, pHandle_out: PMIDL_ES_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('MesEncodeFixedBufferHandleCreate')(pBuffer_out, BufferSize, pEncodedSize_out, pHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-mesencodeincrementalhandlecreate
  public static MesEncodeIncrementalHandleCreate(UserState: PVOID, AllocFn: PVOID, WriteFn: PVOID, pHandle_out: PMIDL_ES_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('MesEncodeIncrementalHandleCreate')(UserState, AllocFn, WriteFn, pHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-meshandlefree
  public static MesHandleFree(Handle: MIDL_ES_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('MesHandleFree')(Handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-mesincrementalhandlereset
  public static MesIncrementalHandleReset(Handle: MIDL_ES_HANDLE, UserState: Nullable<PVOID>, AllocFn: Nullable<PVOID>, WriteFn: Nullable<PVOID>, ReadFn: Nullable<PVOID>, Operation: ULONG): RPC_STATUS {
    return Rpcrt4.Load('MesIncrementalHandleReset')(Handle, UserState, AllocFn, WriteFn, ReadFn, Operation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-mesinqprocencodingid
  public static MesInqProcEncodingId(Handle: MIDL_ES_HANDLE, pInterfaceId_out: PRPC_VERSION, pProcNum_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('MesInqProcEncodingId')(Handle, pInterfaceId_out, pProcNum_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcasync/nf-rpcasync-rpcasyncabortcall
  public static RpcAsyncAbortCall(pAsync_in_out: PRPC_ASYNC_STATE, ExceptionCode: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcAsyncAbortCall')(pAsync_in_out, ExceptionCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcasync/nf-rpcasync-rpcasynccancelcall
  public static RpcAsyncCancelCall(pAsync_in_out: PRPC_ASYNC_STATE, fAbortCall: BOOL): RPC_STATUS {
    return Rpcrt4.Load('RpcAsyncCancelCall')(pAsync_in_out, fAbortCall);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcasync/nf-rpcasync-rpcasynccompletecall
  public static RpcAsyncCompleteCall(pAsync_in_out: PRPC_ASYNC_STATE, Reply_out: Optional<PVOID>): RPC_STATUS {
    return Rpcrt4.Load('RpcAsyncCompleteCall')(pAsync_in_out, Reply_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcasync/nf-rpcasync-rpcasyncgetcallstatus
  public static RpcAsyncGetCallStatus(pAsync: PRPC_ASYNC_STATE): RPC_STATUS {
    return Rpcrt4.Load('RpcAsyncGetCallStatus')(pAsync);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcasync/nf-rpcasync-rpcasyncinitializehandle
  public static RpcAsyncInitializeHandle(pAsync_out: PRPC_ASYNC_STATE, Size: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcAsyncInitializeHandle')(pAsync_out, Size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcasync/nf-rpcasync-rpcasyncregisterinfo
  public static RpcAsyncRegisterInfo(pAsync: PRPC_ASYNC_STATE): RPC_STATUS {
    return Rpcrt4.Load('RpcAsyncRegisterInfo')(pAsync);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingbind
  public static RpcBindingBind(pAsync: Optional<PRPC_ASYNC_STATE>, Binding: RPC_BINDING_HANDLE, IfSpec: RPC_IF_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingBind')(pAsync, Binding, IfSpec);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingcopy
  public static RpcBindingCopy(SourceBinding: RPC_BINDING_HANDLE, DestinationBinding_out: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingCopy')(SourceBinding, DestinationBinding_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingcreatea
  public static RpcBindingCreateA(Template: PRPC_BINDING_HANDLE_TEMPLATE_V1_A, Security: Optional<PRPC_BINDING_HANDLE_SECURITY_V1_A>, Options: Optional<PRPC_BINDING_HANDLE_OPTIONS_V1>, Binding_out: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingCreateA')(Template, Security, Options, Binding_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingcreatew
  public static RpcBindingCreateW(Template: PRPC_BINDING_HANDLE_TEMPLATE_V1_W, Security: Optional<PRPC_BINDING_HANDLE_SECURITY_V1_W>, Options: Optional<PRPC_BINDING_HANDLE_OPTIONS_V1>, Binding_out: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingCreateW')(Template, Security, Options, Binding_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingfree
  public static RpcBindingFree(Binding_in_out: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingFree')(Binding_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingfromstringbindinga
  public static RpcBindingFromStringBindingA(StringBinding: RPC_CSTR, Binding_out: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingFromStringBindingA')(StringBinding, Binding_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingfromstringbindingw
  public static RpcBindingFromStringBindingW(StringBinding: RPC_WSTR, Binding_out: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingFromStringBindingW')(StringBinding, Binding_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthclienta
  public static RpcBindingInqAuthClientA(
    ClientBinding: Optional<RPC_BINDING_HANDLE>,
    Privs_out: PRPC_AUTHZ_HANDLE,
    ServerPrincName_out: Optional<PRPC_CSTR>,
    AuthnLevel_out: Optional<PVOID>,
    AuthnSvc_out: Optional<PVOID>,
    AuthzSvc_out: Optional<PVOID>,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthClientA')(ClientBinding, Privs_out, ServerPrincName_out, AuthnLevel_out, AuthnSvc_out, AuthzSvc_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthclientexa
  public static RpcBindingInqAuthClientExA(
    ClientBinding: Optional<RPC_BINDING_HANDLE>,
    Privs_out: PRPC_AUTHZ_HANDLE,
    ServerPrincName_out: Optional<PRPC_CSTR>,
    AuthnLevel_out: Optional<PVOID>,
    AuthnSvc_out: Optional<PVOID>,
    AuthzSvc_out: Optional<PVOID>,
    Flags: ULONG,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthClientExA')(ClientBinding, Privs_out, ServerPrincName_out, AuthnLevel_out, AuthnSvc_out, AuthzSvc_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthclientexw
  public static RpcBindingInqAuthClientExW(
    ClientBinding: Optional<RPC_BINDING_HANDLE>,
    Privs_out: PRPC_AUTHZ_HANDLE,
    ServerPrincName_out: Optional<PRPC_WSTR>,
    AuthnLevel_out: Optional<PVOID>,
    AuthnSvc_out: Optional<PVOID>,
    AuthzSvc_out: Optional<PVOID>,
    Flags: ULONG,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthClientExW')(ClientBinding, Privs_out, ServerPrincName_out, AuthnLevel_out, AuthnSvc_out, AuthzSvc_out, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthclientw
  public static RpcBindingInqAuthClientW(
    ClientBinding: Optional<RPC_BINDING_HANDLE>,
    Privs_out: PRPC_AUTHZ_HANDLE,
    ServerPrincName_out: Optional<PRPC_WSTR>,
    AuthnLevel_out: Optional<PVOID>,
    AuthnSvc_out: Optional<PVOID>,
    AuthzSvc_out: Optional<PVOID>,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthClientW')(ClientBinding, Privs_out, ServerPrincName_out, AuthnLevel_out, AuthnSvc_out, AuthzSvc_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthinfoa
  public static RpcBindingInqAuthInfoA(
    Binding: RPC_BINDING_HANDLE,
    ServerPrincName_out: Optional<PRPC_CSTR>,
    AuthnLevel_out: Optional<PVOID>,
    AuthnSvc_out: Optional<PVOID>,
    AuthIdentity_out: Optional<PRPC_AUTH_IDENTITY_HANDLE>,
    AuthzSvc_out: Optional<PVOID>,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthInfoA')(Binding, ServerPrincName_out, AuthnLevel_out, AuthnSvc_out, AuthIdentity_out, AuthzSvc_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthinfoexa
  public static RpcBindingInqAuthInfoExA(
    Binding: RPC_BINDING_HANDLE,
    ServerPrincName_out: Optional<PRPC_CSTR>,
    AuthnLevel_out: Optional<PVOID>,
    AuthnSvc_out: Optional<PVOID>,
    AuthIdentity_out: Optional<PRPC_AUTH_IDENTITY_HANDLE>,
    AuthzSvc_out: Optional<PVOID>,
    RpcQosVersion: ULONG,
    SecurityQOS_out: Optional<PRPC_SECURITY_QOS>,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthInfoExA')(Binding, ServerPrincName_out, AuthnLevel_out, AuthnSvc_out, AuthIdentity_out, AuthzSvc_out, RpcQosVersion, SecurityQOS_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthinfoexw
  public static RpcBindingInqAuthInfoExW(
    Binding: RPC_BINDING_HANDLE,
    ServerPrincName_out: Optional<PRPC_WSTR>,
    AuthnLevel_out: Optional<PVOID>,
    AuthnSvc_out: Optional<PVOID>,
    AuthIdentity_out: Optional<PRPC_AUTH_IDENTITY_HANDLE>,
    AuthzSvc_out: Optional<PVOID>,
    RpcQosVersion: ULONG,
    SecurityQOS_out: Optional<PRPC_SECURITY_QOS>,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthInfoExW')(Binding, ServerPrincName_out, AuthnLevel_out, AuthnSvc_out, AuthIdentity_out, AuthzSvc_out, RpcQosVersion, SecurityQOS_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqauthinfow
  public static RpcBindingInqAuthInfoW(
    Binding: RPC_BINDING_HANDLE,
    ServerPrincName_out: Optional<PRPC_WSTR>,
    AuthnLevel_out: Optional<PVOID>,
    AuthnSvc_out: Optional<PVOID>,
    AuthIdentity_out: Optional<PRPC_AUTH_IDENTITY_HANDLE>,
    AuthzSvc_out: Optional<PVOID>,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqAuthInfoW')(Binding, ServerPrincName_out, AuthnLevel_out, AuthnSvc_out, AuthIdentity_out, AuthzSvc_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqmaxcalls
  public static RpcBindingInqMaxCalls(Binding: RPC_BINDING_HANDLE, MaxCalls_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqMaxCalls')(Binding, MaxCalls_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqobject
  public static RpcBindingInqObject(Binding: RPC_BINDING_HANDLE, ObjectUuid_out: PUUID): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqObject')(Binding, ObjectUuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindinginqoption
  public static RpcBindingInqOption(hBinding: RPC_BINDING_HANDLE, option: ULONG, pOptionValue_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingInqOption')(hBinding, option, pOptionValue_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingreset
  public static RpcBindingReset(Binding: RPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingReset')(Binding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingserverfromclient
  public static RpcBindingServerFromClient(ClientBinding: Optional<RPC_BINDING_HANDLE>, ServerBinding_out: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingServerFromClient')(ClientBinding, ServerBinding_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingsetauthinfoa
  public static RpcBindingSetAuthInfoA(Binding: RPC_BINDING_HANDLE, ServerPrincName: Optional<RPC_CSTR>, AuthnLevel: ULONG, AuthnSvc: ULONG, AuthIdentity: Optional<RPC_AUTH_IDENTITY_HANDLE>, AuthzSvc: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingSetAuthInfoA')(Binding, ServerPrincName, AuthnLevel, AuthnSvc, AuthIdentity, AuthzSvc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingsetauthinfoexa
  public static RpcBindingSetAuthInfoExA(
    Binding: RPC_BINDING_HANDLE,
    ServerPrincName: Optional<RPC_CSTR>,
    AuthnLevel: ULONG,
    AuthnSvc: ULONG,
    AuthIdentity: Optional<RPC_AUTH_IDENTITY_HANDLE>,
    AuthzSvc: ULONG,
    SecurityQos: Optional<PRPC_SECURITY_QOS>,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingSetAuthInfoExA')(Binding, ServerPrincName, AuthnLevel, AuthnSvc, AuthIdentity, AuthzSvc, SecurityQos);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingsetauthinfoexw
  public static RpcBindingSetAuthInfoExW(
    Binding: RPC_BINDING_HANDLE,
    ServerPrincName: Optional<RPC_WSTR>,
    AuthnLevel: ULONG,
    AuthnSvc: ULONG,
    AuthIdentity: Optional<RPC_AUTH_IDENTITY_HANDLE>,
    AuthzSvc: ULONG,
    SecurityQos: Optional<PRPC_SECURITY_QOS>,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingSetAuthInfoExW')(Binding, ServerPrincName, AuthnLevel, AuthnSvc, AuthIdentity, AuthzSvc, SecurityQos);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingsetauthinfow
  public static RpcBindingSetAuthInfoW(Binding: RPC_BINDING_HANDLE, ServerPrincName: Optional<RPC_WSTR>, AuthnLevel: ULONG, AuthnSvc: ULONG, AuthIdentity: Optional<RPC_AUTH_IDENTITY_HANDLE>, AuthzSvc: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingSetAuthInfoW')(Binding, ServerPrincName, AuthnLevel, AuthnSvc, AuthIdentity, AuthzSvc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingsetobject
  public static RpcBindingSetObject(Binding: RPC_BINDING_HANDLE, ObjectUuid: Nullable<PUUID>): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingSetObject')(Binding, ObjectUuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingsetoption
  public static RpcBindingSetOption(hBinding: RPC_BINDING_HANDLE, option: ULONG, optionValue: ULONG_PTR): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingSetOption')(hBinding, option, optionValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingtostringbindinga
  public static RpcBindingToStringBindingA(Binding: RPC_BINDING_HANDLE, StringBinding_out: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingToStringBindingA')(Binding, StringBinding_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingtostringbindingw
  public static RpcBindingToStringBindingW(Binding: RPC_BINDING_HANDLE, StringBinding_out: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingToStringBindingW')(Binding, StringBinding_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingunbind
  public static RpcBindingUnbind(Binding: RPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingUnbind')(Binding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcbindingvectorfree
  public static RpcBindingVectorFree(BindingVector_in_out: PRPC_BINDING_VECTOR): RPC_STATUS {
    return Rpcrt4.Load('RpcBindingVectorFree')(BindingVector_in_out);
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
  public static RpcCertGeneratePrincipalNameA(Context: PCCERT_CONTEXT, Flags: ULONG, pBuffer_out: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcCertGeneratePrincipalNameA')(Context, Flags, pBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpccertgenerateprincipalnamew
  public static RpcCertGeneratePrincipalNameW(Context: PCCERT_CONTEXT, Flags: ULONG, pBuffer_out: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcCertGeneratePrincipalNameW')(Context, Flags, pBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpccertmatchprincipalname
  public static RpcCertMatchPrincipalName(Context: PCCERT_CONTEXT, PrincipalName: RPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcCertMatchPrincipalName')(Context, PrincipalName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcepregistera
  public static RpcEpRegisterA(IfSpec: RPC_IF_HANDLE, BindingVector: PRPC_BINDING_VECTOR, UuidVector: Optional<PUUID_VECTOR>, Annotation: Optional<RPC_CSTR>): RPC_STATUS {
    return Rpcrt4.Load('RpcEpRegisterA')(IfSpec, BindingVector, UuidVector, Annotation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcepregisternoreplacea
  public static RpcEpRegisterNoReplaceA(IfSpec: RPC_IF_HANDLE, BindingVector: PRPC_BINDING_VECTOR, UuidVector: Optional<PUUID_VECTOR>, Annotation: Optional<RPC_CSTR>): RPC_STATUS {
    return Rpcrt4.Load('RpcEpRegisterNoReplaceA')(IfSpec, BindingVector, UuidVector, Annotation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcepregisternoreplacew
  public static RpcEpRegisterNoReplaceW(IfSpec: RPC_IF_HANDLE, BindingVector: PRPC_BINDING_VECTOR, UuidVector: Optional<PUUID_VECTOR>, Annotation: Optional<RPC_WSTR>): RPC_STATUS {
    return Rpcrt4.Load('RpcEpRegisterNoReplaceW')(IfSpec, BindingVector, UuidVector, Annotation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcepregisterw
  public static RpcEpRegisterW(IfSpec: RPC_IF_HANDLE, BindingVector: PRPC_BINDING_VECTOR, UuidVector: Optional<PUUID_VECTOR>, Annotation: Optional<RPC_WSTR>): RPC_STATUS {
    return Rpcrt4.Load('RpcEpRegisterW')(IfSpec, BindingVector, UuidVector, Annotation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcepresolvebinding
  public static RpcEpResolveBinding(Binding: RPC_BINDING_HANDLE, IfSpec: RPC_IF_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcEpResolveBinding')(Binding, IfSpec);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcepunregister
  public static RpcEpUnregister(IfSpec: RPC_IF_HANDLE, BindingVector: PRPC_BINDING_VECTOR, UuidVector: Optional<PUUID_VECTOR>): RPC_STATUS {
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
  public static RpcErrorEndEnumeration(EnumHandle_in_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcErrorEndEnumeration')(EnumHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcerrorgetnextrecord
  public static RpcErrorGetNextRecord(EnumHandle: PVOID, CopyStrings: BOOL, ErrorInfo_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcErrorGetNextRecord')(EnumHandle, CopyStrings, ErrorInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcerrorgetnumberofrecords
  public static RpcErrorGetNumberOfRecords(EnumHandle: PVOID, Records_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcErrorGetNumberOfRecords')(EnumHandle, Records_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcerrorloaderrorinfo
  public static RpcErrorLoadErrorInfo(ErrorBlob: PVOID, BlobSize: SIZE_T, EnumHandle_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcErrorLoadErrorInfo')(ErrorBlob, BlobSize, EnumHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcerrorresetenumeration
  public static RpcErrorResetEnumeration(EnumHandle_in_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcErrorResetEnumeration')(EnumHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcerrorsaveerrorinfo
  public static RpcErrorSaveErrorInfo(EnumHandle: PVOID, ErrorBlob_out: PVOID, BlobSize_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcErrorSaveErrorInfo')(EnumHandle, ErrorBlob_out, BlobSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcerrorstartenumeration
  public static RpcErrorStartEnumeration(EnumHandle_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcErrorStartEnumeration')(EnumHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcexceptionfilter
  public static RpcExceptionFilter(ExceptionCode: ULONG): number {
    return Rpcrt4.Load('RpcExceptionFilter')(ExceptionCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcfreeauthorizationcontext
  public static RpcFreeAuthorizationContext(pClientContext_in_out: PRPC_AUTHZ_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcFreeAuthorizationContext')(pClientContext_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcgetauthorizationcontextforclient
  public static RpcGetAuthorizationContextForClient(
    ClientBinding: Optional<RPC_BINDING_HANDLE>,
    ImpersonateOnReturn: BOOL,
    Reserved1: Optional<PVOID>,
    pExpirationTime: Optional<PVOID>,
    Reserved2: LUID,
    Reserved3: DWORD,
    Reserved4: Optional<PVOID>,
    pAuthzClientContext_out: PRPC_AUTHZ_HANDLE,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcGetAuthorizationContextForClient')(ClientBinding, ImpersonateOnReturn, Reserved1, pExpirationTime, Reserved2, Reserved3, Reserved4, pAuthzClientContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcifidvectorfree
  public static RpcIfIdVectorFree(IfIdVector_in_out: PRPC_IF_ID_VECTOR): RPC_STATUS {
    return Rpcrt4.Load('RpcIfIdVectorFree')(IfIdVector_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcifinqid
  public static RpcIfInqId(RpcIfHandle: RPC_IF_HANDLE, RpcIfId_out: PRPC_IF_ID): RPC_STATUS {
    return Rpcrt4.Load('RpcIfInqId')(RpcIfHandle, RpcIfId_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcimpersonateclient
  public static RpcImpersonateClient(BindingHandle: Optional<RPC_BINDING_HANDLE>): RPC_STATUS {
    return Rpcrt4.Load('RpcImpersonateClient')(BindingHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcimpersonateclient2
  public static RpcImpersonateClient2(BindingHandle: Optional<RPC_BINDING_HANDLE>, Flags: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcImpersonateClient2')(BindingHandle, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcimpersonateclientcontainer
  public static RpcImpersonateClientContainer(BindingHandle: Optional<RPC_BINDING_HANDLE>): RPC_STATUS {
    return Rpcrt4.Load('RpcImpersonateClientContainer')(BindingHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtenableidlecleanup
  public static RpcMgmtEnableIdleCleanup(): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtEnableIdleCleanup')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtepeltinqbegin
  public static RpcMgmtEpEltInqBegin(EpBinding: Optional<RPC_BINDING_HANDLE>, InquiryType: ULONG, IfId: Optional<PRPC_IF_ID>, VersOption: ULONG, ObjectUuid: Optional<PUUID>, InquiryContext_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtEpEltInqBegin')(EpBinding, InquiryType, IfId, VersOption, ObjectUuid, InquiryContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtepeltinqdone
  public static RpcMgmtEpEltInqDone(InquiryContext_in_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtEpEltInqDone')(InquiryContext_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtepeltinqnexta
  public static RpcMgmtEpEltInqNextA(InquiryContext: RPC_BINDING_HANDLE, IfId_out: PRPC_IF_ID, Binding_out: Optional<PRPC_BINDING_HANDLE>, ObjectUuid_out: Optional<PUUID>, Annotation_out: Optional<PRPC_CSTR>): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtEpEltInqNextA')(InquiryContext, IfId_out, Binding_out, ObjectUuid_out, Annotation_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtepeltinqnextw
  public static RpcMgmtEpEltInqNextW(InquiryContext: RPC_BINDING_HANDLE, IfId_out: PRPC_IF_ID, Binding_out: Optional<PRPC_BINDING_HANDLE>, ObjectUuid_out: Optional<PUUID>, Annotation_out: Optional<PRPC_WSTR>): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtEpEltInqNextW')(InquiryContext, IfId_out, Binding_out, ObjectUuid_out, Annotation_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtepunregister
  public static RpcMgmtEpUnregister(EpBinding: Optional<RPC_BINDING_HANDLE>, IfId: PRPC_IF_ID, Binding: RPC_BINDING_HANDLE, ObjectUuid: Optional<PUUID>): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtEpUnregister')(EpBinding, IfId, Binding, ObjectUuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtinqcomtimeout
  public static RpcMgmtInqComTimeout(Binding: RPC_BINDING_HANDLE, Timeout_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtInqComTimeout')(Binding, Timeout_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtinqdefaultprotectlevel
  public static RpcMgmtInqDefaultProtectLevel(AuthnSvc: ULONG, AuthnLevel_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtInqDefaultProtectLevel')(AuthnSvc, AuthnLevel_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtinqifids
  public static RpcMgmtInqIfIds(Binding: Optional<RPC_BINDING_HANDLE>, IfIdVector_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtInqIfIds')(Binding, IfIdVector_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtinqserverprincnamea
  public static RpcMgmtInqServerPrincNameA(Binding: Optional<RPC_BINDING_HANDLE>, AuthnSvc: ULONG, ServerPrincName_out: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtInqServerPrincNameA')(Binding, AuthnSvc, ServerPrincName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtinqserverprincnamew
  public static RpcMgmtInqServerPrincNameW(Binding: Optional<RPC_BINDING_HANDLE>, AuthnSvc: ULONG, ServerPrincName_out: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtInqServerPrincNameW')(Binding, AuthnSvc, ServerPrincName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtinqstats
  public static RpcMgmtInqStats(Binding: Optional<RPC_BINDING_HANDLE>, Statistics_out: PRPC_STATS_VECTOR): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtInqStats')(Binding, Statistics_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtisserverlistening
  public static RpcMgmtIsServerListening(Binding: Optional<RPC_BINDING_HANDLE>): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtIsServerListening')(Binding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtsetauthorizationfn
  public static RpcMgmtSetAuthorizationFn(AuthorizationFn: Nullable<RPC_MGMT_AUTHORIZATION_FN>): RPC_STATUS {
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
  public static RpcMgmtStatsVectorFree(StatsVector_in_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtStatsVectorFree')(StatsVector_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtstopserverlistening
  public static RpcMgmtStopServerListening(Binding: Optional<RPC_BINDING_HANDLE>): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtStopServerListening')(Binding);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcmgmtwaitserverlisten
  public static RpcMgmtWaitServerListen(): RPC_STATUS {
    return Rpcrt4.Load('RpcMgmtWaitServerListen')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcnetworkinqprotseqsa
  public static RpcNetworkInqProtseqsA(ProtseqVector_out: PRPC_PROTSEQ_VECTORA): RPC_STATUS {
    return Rpcrt4.Load('RpcNetworkInqProtseqsA')(ProtseqVector_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcnetworkinqprotseqsw
  public static RpcNetworkInqProtseqsW(ProtseqVector_out: PRPC_PROTSEQ_VECTORW): RPC_STATUS {
    return Rpcrt4.Load('RpcNetworkInqProtseqsW')(ProtseqVector_out);
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
  public static RpcNsBindingInqEntryNameA(Binding: RPC_BINDING_HANDLE, EntryNameSyntax: ULONG, EntryName_out: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcNsBindingInqEntryNameA')(Binding, EntryNameSyntax, EntryName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcnsi/nf-rpcnsi-rpcnsbindinginqentrynamew
  public static RpcNsBindingInqEntryNameW(Binding: RPC_BINDING_HANDLE, EntryNameSyntax: ULONG, EntryName_out: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcNsBindingInqEntryNameW')(Binding, EntryNameSyntax, EntryName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcobjectinqtype
  public static RpcObjectInqType(ObjectUuid: PUUID, TypeUuid_out: Optional<PUUID>): RPC_STATUS {
    return Rpcrt4.Load('RpcObjectInqType')(ObjectUuid, TypeUuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcobjectsetinqfn
  public static RpcObjectSetInqFn(InquiryFn: Nullable<RPC_OBJECT_INQ_FN>): RPC_STATUS {
    return Rpcrt4.Load('RpcObjectSetInqFn')(InquiryFn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcobjectsettype
  public static RpcObjectSetType(ObjectUuid: PUUID, TypeUuid: Optional<PUUID>): RPC_STATUS {
    return Rpcrt4.Load('RpcObjectSetType')(ObjectUuid, TypeUuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcprotseqvectorfreea
  public static RpcProtseqVectorFreeA(ProtseqVector_in_out: PRPC_PROTSEQ_VECTORA): RPC_STATUS {
    return Rpcrt4.Load('RpcProtseqVectorFreeA')(ProtseqVector_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcprotseqvectorfreew
  public static RpcProtseqVectorFreeW(ProtseqVector_in_out: PRPC_PROTSEQ_VECTORW): RPC_STATUS {
    return Rpcrt4.Load('RpcProtseqVectorFreeW')(ProtseqVector_in_out);
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
  public static RpcRevertToSelfEx(BindingHandle: Optional<RPC_BINDING_HANDLE>): RPC_STATUS {
    return Rpcrt4.Load('RpcRevertToSelfEx')(BindingHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcservercompletesecuritycallback
  public static RpcServerCompleteSecurityCallback(BindingHandle: RPC_BINDING_HANDLE, Status: RPC_STATUS): RPC_STATUS {
    return Rpcrt4.Load('RpcServerCompleteSecurityCallback')(BindingHandle, Status);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqbindinghandle
  public static RpcServerInqBindingHandle(Binding_out: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqBindingHandle')(Binding_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqbindings
  public static RpcServerInqBindings(BindingVector_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqBindings')(BindingVector_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqbindingsex
  public static RpcServerInqBindingsEx(SecurityDescriptor: Optional<PVOID>, BindingVector_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqBindingsEx')(SecurityDescriptor, BindingVector_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqcallattributesa
  public static RpcServerInqCallAttributesA(ClientBinding: Optional<RPC_BINDING_HANDLE>, RpcCallAttributes_in_out: PRPC_CALL_ATTRIBUTES_V2_A): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqCallAttributesA')(ClientBinding, RpcCallAttributes_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqcallattributesw
  public static RpcServerInqCallAttributesW(ClientBinding: Optional<RPC_BINDING_HANDLE>, RpcCallAttributes_in_out: PRPC_CALL_ATTRIBUTES_V2_W): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqCallAttributesW')(ClientBinding, RpcCallAttributes_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqdefaultprincnamea
  public static RpcServerInqDefaultPrincNameA(AuthnSvc: ULONG, PrincName_out: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqDefaultPrincNameA')(AuthnSvc, PrincName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqdefaultprincnamew
  public static RpcServerInqDefaultPrincNameW(AuthnSvc: ULONG, PrincName_out: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqDefaultPrincNameW')(AuthnSvc, PrincName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinqif
  public static RpcServerInqIf(IfSpec: RPC_IF_HANDLE, MgrTypeUuid: Optional<PUUID>, MgrEpv_out: PRPC_MGR_EPV): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInqIf')(IfSpec, MgrTypeUuid, MgrEpv_out);
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
    IdleCallbackFn: Nullable<PVOID>,
    IdleCallbackContext: PVOID,
    InterfaceGroup_out: PVOID,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInterfaceGroupCreateA')(Interfaces, NumIfs, Endpoints, NumEndpoints, IdleSecondsTimeout, IdleCallbackFn, IdleCallbackContext, InterfaceGroup_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinterfacegroupcreatew
  public static RpcServerInterfaceGroupCreateW(
    Interfaces: PRPC_INTERFACE_TEMPLATEW,
    NumIfs: ULONG,
    Endpoints: PRPC_ENDPOINT_TEMPLATEW,
    NumEndpoints: ULONG,
    IdleSecondsTimeout: ULONG,
    IdleCallbackFn: Nullable<PVOID>,
    IdleCallbackContext: PVOID,
    InterfaceGroup_out: PVOID,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInterfaceGroupCreateW')(Interfaces, NumIfs, Endpoints, NumEndpoints, IdleSecondsTimeout, IdleCallbackFn, IdleCallbackContext, InterfaceGroup_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinterfacegroupdeactivate
  public static RpcServerInterfaceGroupDeactivate(InterfaceGroup: RPC_INTERFACE_GROUP, ForceCompleteCalls: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInterfaceGroupDeactivate')(InterfaceGroup, ForceCompleteCalls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverinterfacegroupinqbindings
  public static RpcServerInterfaceGroupInqBindings(InterfaceGroup: RPC_INTERFACE_GROUP, BindingVector_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcServerInterfaceGroupInqBindings')(InterfaceGroup, BindingVector_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverlisten
  public static RpcServerListen(MinimumCallThreads: ULONG, MaxCalls: ULONG, DontWait: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcServerListen')(MinimumCallThreads, MaxCalls, DontWait);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverregisterauthinfoa
  public static RpcServerRegisterAuthInfoA(ServerPrincName: Optional<RPC_CSTR>, AuthnSvc: ULONG, GetKeyFn: Optional<RPC_AUTH_KEY_RETRIEVAL_FN>, Arg: Optional<PVOID>): RPC_STATUS {
    return Rpcrt4.Load('RpcServerRegisterAuthInfoA')(ServerPrincName, AuthnSvc, GetKeyFn, Arg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverregisterauthinfow
  public static RpcServerRegisterAuthInfoW(ServerPrincName: Optional<RPC_WSTR>, AuthnSvc: ULONG, GetKeyFn: Optional<RPC_AUTH_KEY_RETRIEVAL_FN>, Arg: Optional<PVOID>): RPC_STATUS {
    return Rpcrt4.Load('RpcServerRegisterAuthInfoW')(ServerPrincName, AuthnSvc, GetKeyFn, Arg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverregisterif
  public static RpcServerRegisterIf(IfSpec: RPC_IF_HANDLE, MgrTypeUuid: Optional<PUUID>, MgrEpv: Optional<PRPC_MGR_EPV>): RPC_STATUS {
    return Rpcrt4.Load('RpcServerRegisterIf')(IfSpec, MgrTypeUuid, MgrEpv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverregisterif2
  public static RpcServerRegisterIf2(IfSpec: RPC_IF_HANDLE, MgrTypeUuid: Optional<PUUID>, MgrEpv: Optional<PRPC_MGR_EPV>, Flags: ULONG, MaxCalls: ULONG, MaxRpcSize: ULONG, IfCallback: Optional<RPC_IF_CALLBACK_FN>): RPC_STATUS {
    return Rpcrt4.Load('RpcServerRegisterIf2')(IfSpec, MgrTypeUuid, MgrEpv, Flags, MaxCalls, MaxRpcSize, IfCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverregisterif3
  public static RpcServerRegisterIf3(
    IfSpec: RPC_IF_HANDLE,
    MgrTypeUuid: Optional<PUUID>,
    MgrEpv: Optional<PRPC_MGR_EPV>,
    Flags: ULONG,
    MaxCalls: ULONG,
    MaxRpcSize: ULONG,
    IfCallbackFn: Optional<RPC_IF_CALLBACK_FN>,
    SecurityDescriptor: Optional<PVOID>,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcServerRegisterIf3')(IfSpec, MgrTypeUuid, MgrEpv, Flags, MaxCalls, MaxRpcSize, IfCallbackFn, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverregisterifex
  public static RpcServerRegisterIfEx(IfSpec: RPC_IF_HANDLE, MgrTypeUuid: Optional<PUUID>, MgrEpv: Optional<PRPC_MGR_EPV>, Flags: ULONG, MaxCalls: ULONG, IfCallback: Optional<RPC_IF_CALLBACK_FN>): RPC_STATUS {
    return Rpcrt4.Load('RpcServerRegisterIfEx')(IfSpec, MgrTypeUuid, MgrEpv, Flags, MaxCalls, IfCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserversubscribefornotification
  public static RpcServerSubscribeForNotification(Binding: Optional<RPC_BINDING_HANDLE>, Notification: number, NotificationType: number, NotificationCallBack: RPC_NOTIFICATION_CALLBACK): RPC_STATUS {
    return Rpcrt4.Load('RpcServerSubscribeForNotification')(Binding, Notification, NotificationType, NotificationCallBack);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcservertestcancel
  public static RpcServerTestCancel(BindingHandle: Optional<RPC_BINDING_HANDLE>): RPC_STATUS {
    return Rpcrt4.Load('RpcServerTestCancel')(BindingHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverunregisterif
  public static RpcServerUnregisterIf(IfSpec: Optional<RPC_IF_HANDLE>, MgrTypeUuid: Optional<PUUID>, WaitForCallsToComplete: ULONG): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUnregisterIf')(IfSpec, MgrTypeUuid, WaitForCallsToComplete);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverunregisterifex
  public static RpcServerUnregisterIfEx(IfSpec: Optional<RPC_IF_HANDLE>, MgrTypeUuid: Optional<PUUID>, RundownContextHandles: number): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUnregisterIfEx')(IfSpec, MgrTypeUuid, RundownContextHandles);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserverunsubscribefornotification
  public static RpcServerUnsubscribeForNotification(Binding: Optional<RPC_BINDING_HANDLE>, NotificationType: number, NotificationsQueued_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUnsubscribeForNotification')(Binding, NotificationType, NotificationsQueued_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseallprotseqs
  public static RpcServerUseAllProtseqs(MaxCalls: ULONG, SecurityDescriptor: Optional<PVOID>): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseAllProtseqs')(MaxCalls, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseallprotseqsex
  public static RpcServerUseAllProtseqsEx(MaxCalls: ULONG, SecurityDescriptor: Optional<PVOID>, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseAllProtseqsEx')(MaxCalls, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseallprotseqsif
  public static RpcServerUseAllProtseqsIf(MaxCalls: ULONG, IfSpec: RPC_IF_HANDLE, SecurityDescriptor: Optional<PVOID>): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseAllProtseqsIf')(MaxCalls, IfSpec, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseallprotseqsifex
  public static RpcServerUseAllProtseqsIfEx(MaxCalls: ULONG, IfSpec: RPC_IF_HANDLE, SecurityDescriptor: Optional<PVOID>, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseAllProtseqsIfEx')(MaxCalls, IfSpec, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqa
  public static RpcServerUseProtseqA(Protseq: RPC_CSTR, MaxCalls: ULONG, SecurityDescriptor: Optional<PVOID>): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqA')(Protseq, MaxCalls, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqepa
  public static RpcServerUseProtseqEpA(Protseq: RPC_CSTR, MaxCalls: ULONG, Endpoint: RPC_CSTR, SecurityDescriptor: Optional<PVOID>): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqEpA')(Protseq, MaxCalls, Endpoint, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqepexa
  public static RpcServerUseProtseqEpExA(Protseq: RPC_CSTR, MaxCalls: ULONG, Endpoint: RPC_CSTR, SecurityDescriptor: Optional<PVOID>, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqEpExA')(Protseq, MaxCalls, Endpoint, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqepexw
  public static RpcServerUseProtseqEpExW(Protseq: RPC_WSTR, MaxCalls: ULONG, Endpoint: RPC_WSTR, SecurityDescriptor: Optional<PVOID>, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqEpExW')(Protseq, MaxCalls, Endpoint, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqepw
  public static RpcServerUseProtseqEpW(Protseq: RPC_WSTR, MaxCalls: ULONG, Endpoint: RPC_WSTR, SecurityDescriptor: Optional<PVOID>): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqEpW')(Protseq, MaxCalls, Endpoint, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqexa
  public static RpcServerUseProtseqExA(Protseq: RPC_CSTR, MaxCalls: ULONG, SecurityDescriptor: Optional<PVOID>, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqExA')(Protseq, MaxCalls, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqexw
  public static RpcServerUseProtseqExW(Protseq: RPC_WSTR, MaxCalls: ULONG, SecurityDescriptor: Optional<PVOID>, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqExW')(Protseq, MaxCalls, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqifa
  public static RpcServerUseProtseqIfA(Protseq: RPC_CSTR, MaxCalls: ULONG, IfSpec: RPC_IF_HANDLE, SecurityDescriptor: Optional<PVOID>): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqIfA')(Protseq, MaxCalls, IfSpec, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqifexa
  public static RpcServerUseProtseqIfExA(Protseq: RPC_CSTR, MaxCalls: ULONG, IfSpec: RPC_IF_HANDLE, SecurityDescriptor: Optional<PVOID>, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqIfExA')(Protseq, MaxCalls, IfSpec, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqifexw
  public static RpcServerUseProtseqIfExW(Protseq: RPC_WSTR, MaxCalls: ULONG, IfSpec: RPC_IF_HANDLE, SecurityDescriptor: Optional<PVOID>, Policy: PRPC_POLICY): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqIfExW')(Protseq, MaxCalls, IfSpec, SecurityDescriptor, Policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqifw
  public static RpcServerUseProtseqIfW(Protseq: RPC_WSTR, MaxCalls: ULONG, IfSpec: RPC_IF_HANDLE, SecurityDescriptor: Optional<PVOID>): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqIfW')(Protseq, MaxCalls, IfSpec, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveruseprotseqw
  public static RpcServerUseProtseqW(Protseq: RPC_WSTR, MaxCalls: ULONG, SecurityDescriptor: Optional<PVOID>): RPC_STATUS {
    return Rpcrt4.Load('RpcServerUseProtseqW')(Protseq, MaxCalls, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcserveryield
  public static RpcServerYield(): VOID {
    return Rpcrt4.Load('RpcServerYield')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsmallocate
  public static RpcSmAllocate(Size: SIZE_T, pStatus_out: PRPC_STATUS): PVOID | NULL {
    return Rpcrt4.Load('RpcSmAllocate')(Size, pStatus_out);
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
  public static RpcSmGetThreadHandle(pStatus_out: PRPC_STATUS): PVOID | NULL {
    return Rpcrt4.Load('RpcSmGetThreadHandle')(pStatus_out);
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
  public static RpcSmSwapClientAllocFree(ClientAlloc: PVOID, ClientFree: PVOID, OldClientAlloc_out: PVOID, OldClientFree_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('RpcSmSwapClientAllocFree')(ClientAlloc, ClientFree, OldClientAlloc_out, OldClientFree_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcssallocate
  public static RpcSsAllocate(Size: SIZE_T): PVOID | NULL {
    return Rpcrt4.Load('RpcSsAllocate')(Size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcsscontextlockexclusive
  public static RpcSsContextLockExclusive(ServerBindingHandle: Optional<RPC_BINDING_HANDLE>, UserContext: PVOID): VOID {
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
  public static RpcSsGetContextBinding(ContextHandle: PVOID, Binding_out: PRPC_BINDING_HANDLE): RPC_STATUS {
    return Rpcrt4.Load('RpcSsGetContextBinding')(ContextHandle, Binding_out);
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
  public static RpcSsSwapClientAllocFree(ClientAlloc: PVOID, ClientFree: PVOID, OldClientAlloc_out: PVOID, OldClientFree_out: PVOID): VOID {
    return Rpcrt4.Load('RpcSsSwapClientAllocFree')(ClientAlloc, ClientFree, OldClientAlloc_out, OldClientFree_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcstringbindingcomposea
  public static RpcStringBindingComposeA(
    ObjUuid: Optional<RPC_CSTR>,
    Protseq: Optional<RPC_CSTR>,
    NetworkAddr: Optional<RPC_CSTR>,
    Endpoint: Optional<RPC_CSTR>,
    Options: Optional<RPC_CSTR>,
    StringBinding_out: Optional<PRPC_CSTR>,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcStringBindingComposeA')(ObjUuid, Protseq, NetworkAddr, Endpoint, Options, StringBinding_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcstringbindingcomposew
  public static RpcStringBindingComposeW(
    ObjUuid: Optional<RPC_WSTR>,
    Protseq: Optional<RPC_WSTR>,
    NetworkAddr: Optional<RPC_WSTR>,
    Endpoint: Optional<RPC_WSTR>,
    Options: Optional<RPC_WSTR>,
    StringBinding_out: Optional<PRPC_WSTR>,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcStringBindingComposeW')(ObjUuid, Protseq, NetworkAddr, Endpoint, Options, StringBinding_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcstringbindingparsea
  public static RpcStringBindingParseA(
    StringBinding: RPC_CSTR,
    ObjUuid_out: Optional<PRPC_CSTR>,
    Protseq_out: Optional<PRPC_CSTR>,
    NetworkAddr_out: Optional<PRPC_CSTR>,
    Endpoint_out: Optional<PRPC_CSTR>,
    NetworkOptions_out: Optional<PRPC_CSTR>,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcStringBindingParseA')(StringBinding, ObjUuid_out, Protseq_out, NetworkAddr_out, Endpoint_out, NetworkOptions_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcstringbindingparsew
  public static RpcStringBindingParseW(
    StringBinding: RPC_WSTR,
    ObjUuid_out: Optional<PRPC_WSTR>,
    Protseq_out: Optional<PRPC_WSTR>,
    NetworkAddr_out: Optional<PRPC_WSTR>,
    Endpoint_out: Optional<PRPC_WSTR>,
    NetworkOptions_out: Optional<PRPC_WSTR>,
  ): RPC_STATUS {
    return Rpcrt4.Load('RpcStringBindingParseW')(StringBinding, ObjUuid_out, Protseq_out, NetworkAddr_out, Endpoint_out, NetworkOptions_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcstringfreea
  public static RpcStringFreeA(String_in_out: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcStringFreeA')(String_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcstringfreew
  public static RpcStringFreeW(String_in_out: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('RpcStringFreeW')(String_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpctestcancel
  public static RpcTestCancel(): RPC_STATUS {
    return Rpcrt4.Load('RpcTestCancel')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-rpcuserfree
  public static RpcUserFree(AsyncHandle: RPC_BINDING_HANDLE, pBuffer: PVOID): VOID {
    return Rpcrt4.Load('RpcUserFree')(AsyncHandle, pBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-towerconstruct
  public static TowerConstruct(ObjectUuid: PUUID, SyntaxUuid: PUUID, Protseq: RPC_CSTR, Endpoint: RPC_CSTR, Address: RPC_CSTR, FloorCount_out: PVOID, Tower_out: PVOID): RPC_STATUS {
    return Rpcrt4.Load('TowerConstruct')(ObjectUuid, SyntaxUuid, Protseq, Endpoint, Address, FloorCount_out, Tower_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-towerexplode
  public static TowerExplode(Tower: PVOID, ObjectUuid_out: Optional<PUUID>, SyntaxUuid_out: Optional<PUUID>, Protseq_out: Optional<PRPC_CSTR>, Endpoint_out: Optional<PRPC_CSTR>, Address_out: Optional<PRPC_CSTR>): RPC_STATUS {
    return Rpcrt4.Load('TowerExplode')(Tower, ObjectUuid_out, SyntaxUuid_out, Protseq_out, Endpoint_out, Address_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidcompare
  public static UuidCompare(Uuid1: PUUID, Uuid2: PUUID, Status_out: PRPC_STATUS): number {
    return Rpcrt4.Load('UuidCompare')(Uuid1, Uuid2, Status_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidcreate
  public static UuidCreate(Uuid_out: PUUID): RPC_STATUS {
    return Rpcrt4.Load('UuidCreate')(Uuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidcreatenil
  public static UuidCreateNil(NilUuid_out: PUUID): RPC_STATUS {
    return Rpcrt4.Load('UuidCreateNil')(NilUuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidcreatesequential
  public static UuidCreateSequential(Uuid_out: PUUID): RPC_STATUS {
    return Rpcrt4.Load('UuidCreateSequential')(Uuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidequal
  public static UuidEqual(Uuid1: PUUID, Uuid2: PUUID, Status_out: PRPC_STATUS): number {
    return Rpcrt4.Load('UuidEqual')(Uuid1, Uuid2, Status_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidfromstringa
  public static UuidFromStringA(StringUuid: Optional<RPC_CSTR>, Uuid_out: PUUID): RPC_STATUS {
    return Rpcrt4.Load('UuidFromStringA')(StringUuid, Uuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidfromstringw
  public static UuidFromStringW(StringUuid: Optional<RPC_WSTR>, Uuid_out: PUUID): RPC_STATUS {
    return Rpcrt4.Load('UuidFromStringW')(StringUuid, Uuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidhash
  public static UuidHash(Uuid: PUUID, Status_out: PRPC_STATUS): USHORT {
    return Rpcrt4.Load('UuidHash')(Uuid, Status_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidisnil
  public static UuidIsNil(Uuid: PUUID, Status_out: PRPC_STATUS): number {
    return Rpcrt4.Load('UuidIsNil')(Uuid, Status_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidtostringa
  public static UuidToStringA(Uuid: PUUID, StringUuid_out: PRPC_CSTR): RPC_STATUS {
    return Rpcrt4.Load('UuidToStringA')(Uuid, StringUuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcdce/nf-rpcdce-uuidtostringw
  public static UuidToStringW(Uuid: PUUID, StringUuid_out: PRPC_WSTR): RPC_STATUS {
    return Rpcrt4.Load('UuidToStringW')(Uuid, StringUuid_out);
  }
}

export default Rpcrt4;
