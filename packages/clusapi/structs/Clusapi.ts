import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  CLUSTER_GROUP_STATE,
  CLUSTER_NETINTERFACE_STATE,
  CLUSTER_NETWORK_STATE,
  CLUSTER_NODE_RESUME_FAILBACK_TYPE,
  CLUSTER_NODE_STATE,
  CLUSTER_REG_COMMAND,
  CLUSTER_RESOURCE_STATE,
  CLUSTER_SHARED_VOLUME_SNAPSHOT_STATE,
  DWORD,
  DWORD_PTR,
  HANDLE,
  HCHANGE,
  HCLUSENUM,
  HCLUSENUMEX,
  HCLUSTER,
  HGROUP,
  HGROUPENUM,
  HGROUPENUMEX,
  HGROUPSET,
  HGROUPSETENUM,
  HKEY,
  HNETINTERFACE,
  HNETINTERFACEENUM,
  HNETWORK,
  HNETWORKENUM,
  HNODE,
  HNODEENUM,
  HNODEENUMEX,
  HREGBATCH,
  HREGBATCHNOTIFICATION,
  HREGBATCHPORT,
  HREGREADBATCH,
  HREGREADBATCHREPLY,
  HRESENUM,
  HRESENUMEX,
  HRESOURCE,
  HRESTYPEENUM,
  LONG,
  LONGLONG,
  LPBYTE,
  LPCLUSTERVERSIONINFO,
  LPCWSTR,
  LPDWORD,
  LPHANDLE,
  LPSECURITY_ATTRIBUTES,
  LPVOID,
  LPWSTR,
  OPTIONAL,
  PBOOL,
  PBYTE,
  PCLUSTER_BATCH_COMMAND,
  PCLUSTER_CREATE_GROUP_INFO,
  PCLUSTER_ENUM_ITEM,
  PCLUSTER_GROUP_ENUM_ITEM,
  PCLUSTER_READ_BATCH_COMMAND,
  PCLUSTER_RESOURCE_ENUM_ITEM,
  PCLUSTER_SETUP_PROGRESS_CALLBACK,
  PCLUSTER_SET_PASSWORD_STATUS,
  PCLUSTER_UPGRADE_PROGRESS_CALLBACK,
  PCREATE_CLUSTER_CONFIG,
  PCREATE_CLUSTER_NAME_ACCOUNT,
  PDWORD_PTR,
  PFILETIME,
  PGUID,
  PHKEY,
  PHNETWORK,
  PHNODE,
  PHREGBATCH,
  PHREGBATCHNOTIFICATION,
  PHREGBATCHPORT,
  PHREGREADBATCH,
  PHREGREADBATCHREPLY,
  PHRESULT,
  PINT,
  PNOTIFY_FILTER_AND_TYPE,
  PSECURITY_DESCRIPTOR,
  PVOID,
  REGSAM,
  SECURITY_INFORMATION,
} from '../types/Clusapi';

/**
 * Thin, lazy-loaded FFI bindings for `clusapi.dll`.
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
 * import Clusapi from './structs/Clusapi';
 *
 * // Lazy: bind on first call
 * const state = Clusapi.GetNodeClusterState(null, stateBuffer.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Clusapi.Preload(['GetNodeClusterState', 'OpenCluster']);
 * ```
 */
class Clusapi extends Win32 {
  protected static override name = 'clusapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    AddClusterGroupDependency: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    AddClusterGroupSetDependency: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    AddClusterGroupToGroupSetDependency: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    AddClusterNode: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    AddClusterResourceDependency: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    AddClusterResourceNode: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    AddResourceToClusterSharedVolumes: { args: [FFIType.u64], returns: FFIType.u32 },
    BackupClusterDatabase: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    CanResourceBeDependent: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    CancelClusterGroupOperation: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    ChangeClusterResourceGroup: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    CloseCluster: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseClusterGroup: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseClusterGroupSet: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseClusterNetInterface: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseClusterNetwork: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseClusterNode: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseClusterNotifyPort: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseClusterResource: { args: [FFIType.u64], returns: FFIType.i32 },
    ClusterAddGroupToGroupSet: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    ClusterCloseEnum: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterCloseEnumEx: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterControl: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ClusterEnum: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ClusterEnumEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ClusterGetEnumCount: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterGetEnumCountEx: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterGroupCloseEnum: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterGroupCloseEnumEx: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterGroupControl: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ClusterGroupEnum: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ClusterGroupEnumEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ClusterGroupGetEnumCount: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterGroupGetEnumCountEx: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterGroupOpenEnum: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    ClusterGroupOpenEnumEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    ClusterGroupSetCloseEnum: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterGroupSetControl: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ClusterGroupSetEnum: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ClusterGroupSetGetEnumCount: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterGroupSetOpenEnum: { args: [FFIType.u64], returns: FFIType.u64 },
    ClusterNetInterfaceCloseEnum: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterNetInterfaceControl: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ClusterNetInterfaceEnum: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ClusterNetInterfaceOpenEnum: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    ClusterNetworkCloseEnum: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterNetworkControl: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ClusterNetworkEnum: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ClusterNetworkGetEnumCount: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterNetworkOpenEnum: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    ClusterNodeCloseEnum: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterNodeCloseEnumEx: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterNodeControl: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ClusterNodeEnum: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ClusterNodeEnumEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ClusterNodeGetEnumCount: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterNodeGetEnumCountEx: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterNodeOpenEnum: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    ClusterNodeOpenEnumEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    ClusterOpenEnum: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    ClusterOpenEnumEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    ClusterRegBatchAddCommand: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    ClusterRegBatchCloseNotification: { args: [FFIType.u64], returns: FFIType.i32 },
    ClusterRegBatchReadCommand: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegCloseBatch: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegCloseBatchEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegCloseBatchNotifyPort: { args: [FFIType.u64], returns: FFIType.i32 },
    ClusterRegCloseKey: { args: [FFIType.u64], returns: FFIType.i32 },
    ClusterRegCloseReadBatch: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegCloseReadBatchEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegCloseReadBatchReply: { args: [FFIType.u64], returns: FFIType.i32 },
    ClusterRegCreateBatch: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegCreateBatchNotifyPort: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegCreateKey: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegCreateReadBatch: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegDeleteKey: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegDeleteValue: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ClusterRegEnumKey: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegEnumValue: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ClusterRegGetBatchNotification: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegGetKeySecurity: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegOpenKey: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegQueryInfoKey: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegQueryValue: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegReadBatchAddCommand: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegReadBatchReplyNextCommand: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegSetKeySecurity: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ClusterRegSetValue: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ClusterRegSyncDatabase: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    ClusterRemoveGroupFromGroupSet: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterResourceCloseEnum: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterResourceCloseEnumEx: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterResourceControl: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ClusterResourceControlAsUser: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ClusterResourceEnum: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ClusterResourceEnumEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ClusterResourceGetEnumCount: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterResourceGetEnumCountEx: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterResourceOpenEnum: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    ClusterResourceOpenEnumEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    ClusterResourceTypeCloseEnum: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterResourceTypeControl: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ClusterResourceTypeControlAsUser: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ClusterResourceTypeEnum: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ClusterResourceTypeGetEnumCount: { args: [FFIType.u64], returns: FFIType.u32 },
    ClusterResourceTypeOpenEnum: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    ClusterSetAccountAccess: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    ClusterSharedVolumeSetSnapshotState: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ClusterUpgradeFunctionalLevel: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CreateCluster: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateClusterGroup: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    CreateClusterGroupEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateClusterGroupSet: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    CreateClusterNameAccount: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CreateClusterNotifyPort: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    CreateClusterNotifyPortV2: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    CreateClusterResource: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    CreateClusterResourceType: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    DeleteClusterGroup: { args: [FFIType.u64], returns: FFIType.u32 },
    DeleteClusterGroupSet: { args: [FFIType.u64], returns: FFIType.u32 },
    DeleteClusterResource: { args: [FFIType.u64], returns: FFIType.u32 },
    DeleteClusterResourceType: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    DestroyCluster: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    DestroyClusterGroup: { args: [FFIType.u64], returns: FFIType.u32 },
    EvictClusterNode: { args: [FFIType.u64], returns: FFIType.u32 },
    EvictClusterNodeEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    FailClusterResource: { args: [FFIType.u64], returns: FFIType.u32 },
    GetClusterFromGroup: { args: [FFIType.u64], returns: FFIType.u64 },
    GetClusterFromNetInterface: { args: [FFIType.u64], returns: FFIType.u64 },
    GetClusterFromNetwork: { args: [FFIType.u64], returns: FFIType.u64 },
    GetClusterFromNode: { args: [FFIType.u64], returns: FFIType.u64 },
    GetClusterFromResource: { args: [FFIType.u64], returns: FFIType.u64 },
    GetClusterGroupKey: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    GetClusterGroupState: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetClusterInformation: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetClusterKey: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    GetClusterNetInterface: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetClusterNetInterfaceKey: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    GetClusterNetInterfaceState: { args: [FFIType.u64], returns: FFIType.i32 },
    GetClusterNetworkId: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetClusterNetworkKey: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    GetClusterNetworkState: { args: [FFIType.u64], returns: FFIType.i32 },
    GetClusterNodeId: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetClusterNodeKey: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    GetClusterNodeState: { args: [FFIType.u64], returns: FFIType.i32 },
    GetClusterNotify: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetClusterNotifyV2: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetClusterQuorumResource: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetClusterResourceDependencyExpression: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetClusterResourceKey: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    GetClusterResourceNetworkName: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetClusterResourceState: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetClusterResourceTypeKey: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    GetNodeClusterState: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetNotifyEventHandle: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    IsFileOnClusterSharedVolume: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MoveClusterGroup: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    MoveClusterGroupEx: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    OfflineClusterGroup: { args: [FFIType.u64], returns: FFIType.u32 },
    OfflineClusterGroupEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    OfflineClusterResource: { args: [FFIType.u64], returns: FFIType.u32 },
    OfflineClusterResourceEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    OnlineClusterGroup: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    OnlineClusterGroupEx: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    OnlineClusterResource: { args: [FFIType.u64], returns: FFIType.u32 },
    OnlineClusterResourceEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    OpenCluster: { args: [FFIType.ptr], returns: FFIType.u64 },
    OpenClusterEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    OpenClusterGroup: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    OpenClusterGroupEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    OpenClusterGroupSet: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    OpenClusterNetInterface: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    OpenClusterNetInterfaceEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    OpenClusterNetwork: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    OpenClusterNetworkEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    OpenClusterNode: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    OpenClusterNodeEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    OpenClusterResource: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    OpenClusterResourceEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    PauseClusterNode: { args: [FFIType.u64], returns: FFIType.u32 },
    PauseClusterNodeEx: { args: [FFIType.u64, FFIType.i32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    RegisterClusterNotify: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    RegisterClusterNotifyV2: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    RegisterClusterResourceTypeNotifyV2: { args: [FFIType.u64, FFIType.u64, FFIType.i64, FFIType.ptr, FFIType.u64], returns: FFIType.u32 },
    RemoveClusterGroupDependency: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    RemoveClusterGroupSetDependency: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    RemoveClusterGroupToGroupSetDependency: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    RemoveClusterResourceDependency: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    RemoveClusterResourceNode: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    RemoveResourceFromClusterSharedVolumes: { args: [FFIType.u64], returns: FFIType.u32 },
    RestartClusterResource: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    RestoreClusterDatabase: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    ResumeClusterNode: { args: [FFIType.u64], returns: FFIType.u32 },
    ResumeClusterNodeEx: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    SetClusterGroupName: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    SetClusterGroupNodeList: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    SetClusterGroupSetDependencyExpression: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    SetClusterName: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    SetClusterNetworkName: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    SetClusterNetworkPriorityOrder: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    SetClusterQuorumResource: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    SetClusterResourceDependencyExpression: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    SetClusterResourceName: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    SetClusterServiceAccountPassword: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetGroupDependencyExpression: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-addclustergroupdependency
  public static AddClusterGroupDependency(hDependentGroup: HGROUP, hProviderGroup: HGROUP): DWORD {
    return Clusapi.Load('AddClusterGroupDependency')(hDependentGroup, hProviderGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-addclustergroupsetdependency
  public static AddClusterGroupSetDependency(hDependentGroupSet: HGROUPSET, hProviderGroupSet: HGROUPSET): DWORD {
    return Clusapi.Load('AddClusterGroupSetDependency')(hDependentGroupSet, hProviderGroupSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-addclustergrouptogroupsetdependency
  public static AddClusterGroupToGroupSetDependency(hDependentGroup: HGROUP, hProviderGroupSet: HGROUPSET): DWORD {
    return Clusapi.Load('AddClusterGroupToGroupSetDependency')(hDependentGroup, hProviderGroupSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-addclusternode
  public static AddClusterNode(hCluster: HCLUSTER, lpszNodeName: LPCWSTR, pfnProgressCallback: OPTIONAL<PCLUSTER_SETUP_PROGRESS_CALLBACK>, pvCallbackArg: OPTIONAL<PVOID>): HNODE {
    return Clusapi.Load('AddClusterNode')(hCluster, lpszNodeName, pfnProgressCallback, pvCallbackArg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-addclusterresourcedependency
  public static AddClusterResourceDependency(hResource: HRESOURCE, hDependsOn: HRESOURCE): DWORD {
    return Clusapi.Load('AddClusterResourceDependency')(hResource, hDependsOn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-addclusterresourcenode
  public static AddClusterResourceNode(hResource: HRESOURCE, hNode: HNODE): DWORD {
    return Clusapi.Load('AddClusterResourceNode')(hResource, hNode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-addresourcetoclustersharedvolumes
  public static AddResourceToClusterSharedVolumes(hResource: HRESOURCE): DWORD {
    return Clusapi.Load('AddResourceToClusterSharedVolumes')(hResource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-backupclusterdatabase
  public static BackupClusterDatabase(hCluster: HCLUSTER, lpszPathName: LPCWSTR): DWORD {
    return Clusapi.Load('BackupClusterDatabase')(hCluster, lpszPathName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-canresourcebedependent
  public static CanResourceBeDependent(hResource: HRESOURCE, hResourceDependent: HRESOURCE): BOOL {
    return Clusapi.Load('CanResourceBeDependent')(hResource, hResourceDependent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-cancelclustergroupoperation
  public static CancelClusterGroupOperation(hGroup: HGROUP, dwCancelFlags_RESERVED: DWORD): DWORD {
    return Clusapi.Load('CancelClusterGroupOperation')(hGroup, dwCancelFlags_RESERVED);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-changeclusterresourcegroup
  public static ChangeClusterResourceGroup(hResource: HRESOURCE, hGroup: HGROUP): DWORD {
    return Clusapi.Load('ChangeClusterResourceGroup')(hResource, hGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-closecluster
  public static CloseCluster(hCluster: HCLUSTER): BOOL {
    return Clusapi.Load('CloseCluster')(hCluster);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-closeclustergroup
  public static CloseClusterGroup(hGroup: HGROUP): BOOL {
    return Clusapi.Load('CloseClusterGroup')(hGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-closeclustergroupset
  public static CloseClusterGroupSet(hGroupSet: HGROUPSET): BOOL {
    return Clusapi.Load('CloseClusterGroupSet')(hGroupSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-closeclusternetinterface
  public static CloseClusterNetInterface(hNetInterface: HNETINTERFACE): BOOL {
    return Clusapi.Load('CloseClusterNetInterface')(hNetInterface);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-closeclusternetwork
  public static CloseClusterNetwork(hNetwork: HNETWORK): BOOL {
    return Clusapi.Load('CloseClusterNetwork')(hNetwork);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-closeclusternode
  public static CloseClusterNode(hNode: HNODE): BOOL {
    return Clusapi.Load('CloseClusterNode')(hNode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-closeclusternotifyport
  public static CloseClusterNotifyPort(hChange: HCHANGE): BOOL {
    return Clusapi.Load('CloseClusterNotifyPort')(hChange);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-closeclusterresource
  public static CloseClusterResource(hResource: HRESOURCE): BOOL {
    return Clusapi.Load('CloseClusterResource')(hResource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusteraddgrouptogroupset
  public static ClusterAddGroupToGroupSet(hGroupSet: HGROUPSET, hGroup: HGROUP): DWORD {
    return Clusapi.Load('ClusterAddGroupToGroupSet')(hGroupSet, hGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustercloseenum
  public static ClusterCloseEnum(hEnum: HCLUSENUM): DWORD {
    return Clusapi.Load('ClusterCloseEnum')(hEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustercloseenumex
  public static ClusterCloseEnumEx(hClusterEnum: HCLUSENUMEX): DWORD {
    return Clusapi.Load('ClusterCloseEnumEx')(hClusterEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustercontrol
  public static ClusterControl(
    hCluster: HCLUSTER,
    hHostNode: OPTIONAL<HNODE>,
    dwControlCode: DWORD,
    lpInBuffer: OPTIONAL<LPVOID>,
    nInBufferSize: DWORD,
    lpOutBuffer_out: OPTIONAL<LPVOID>,
    nOutBufferSize: DWORD,
    lpBytesReturned_out: OPTIONAL<LPDWORD>,
  ): DWORD {
    return Clusapi.Load('ClusterControl')(hCluster, hHostNode, dwControlCode, lpInBuffer, nInBufferSize, lpOutBuffer_out, nOutBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterenum
  public static ClusterEnum(hEnum: HCLUSENUM, dwIndex: DWORD, lpdwType_out: LPDWORD, lpszName_out: LPWSTR, lpcchName_in_out: LPDWORD): DWORD {
    return Clusapi.Load('ClusterEnum')(hEnum, dwIndex, lpdwType_out, lpszName_out, lpcchName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterenumex
  public static ClusterEnumEx(hClusterEnum: HCLUSENUMEX, dwIndex: DWORD, pItem_in_out: PCLUSTER_ENUM_ITEM, cbItem_in_out: LPDWORD): DWORD {
    return Clusapi.Load('ClusterEnumEx')(hClusterEnum, dwIndex, pItem_in_out, cbItem_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergetenumcount
  public static ClusterGetEnumCount(hEnum: HCLUSENUM): DWORD {
    return Clusapi.Load('ClusterGetEnumCount')(hEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergetenumcountex
  public static ClusterGetEnumCountEx(hClusterEnum: HCLUSENUMEX): DWORD {
    return Clusapi.Load('ClusterGetEnumCountEx')(hClusterEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergroupcloseenum
  public static ClusterGroupCloseEnum(hGroupEnum: HGROUPENUM): DWORD {
    return Clusapi.Load('ClusterGroupCloseEnum')(hGroupEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergroupcloseenumex
  public static ClusterGroupCloseEnumEx(hGroupEnumEx: HGROUPENUMEX): DWORD {
    return Clusapi.Load('ClusterGroupCloseEnumEx')(hGroupEnumEx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergroupcontrol
  public static ClusterGroupControl(
    hGroup: HGROUP,
    hHostNode: OPTIONAL<HNODE>,
    dwControlCode: DWORD,
    lpInBuffer: OPTIONAL<LPVOID>,
    nInBufferSize: DWORD,
    lpOutBuffer_out: OPTIONAL<LPVOID>,
    nOutBufferSize: DWORD,
    lpBytesReturned_out: OPTIONAL<LPDWORD>,
  ): DWORD {
    return Clusapi.Load('ClusterGroupControl')(hGroup, hHostNode, dwControlCode, lpInBuffer, nInBufferSize, lpOutBuffer_out, nOutBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergroupenum
  public static ClusterGroupEnum(hGroupEnum: HGROUPENUM, dwIndex: DWORD, lpdwType_out: LPDWORD, lpszResourceName_out: LPWSTR, lpcchName_in_out: LPDWORD): DWORD {
    return Clusapi.Load('ClusterGroupEnum')(hGroupEnum, dwIndex, lpdwType_out, lpszResourceName_out, lpcchName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergroupenumex
  public static ClusterGroupEnumEx(hGroupEnumEx: HGROUPENUMEX, dwIndex: DWORD, pItem_in_out: PCLUSTER_GROUP_ENUM_ITEM, cbItem_in_out: LPDWORD): DWORD {
    return Clusapi.Load('ClusterGroupEnumEx')(hGroupEnumEx, dwIndex, pItem_in_out, cbItem_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergroupgetenumcount
  public static ClusterGroupGetEnumCount(hGroupEnum: HGROUPENUM): DWORD {
    return Clusapi.Load('ClusterGroupGetEnumCount')(hGroupEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergroupgetenumcountex
  public static ClusterGroupGetEnumCountEx(hGroupEnumEx: HGROUPENUMEX): DWORD {
    return Clusapi.Load('ClusterGroupGetEnumCountEx')(hGroupEnumEx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergroupopenenum
  public static ClusterGroupOpenEnum(hGroup: HGROUP, dwType: DWORD): HGROUPENUM {
    return Clusapi.Load('ClusterGroupOpenEnum')(hGroup, dwType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergroupopenenumex
  public static ClusterGroupOpenEnumEx(hCluster: HCLUSTER, lpszProperties: OPTIONAL<LPCWSTR>, cbProperties: DWORD, lpszRoProperties: OPTIONAL<LPCWSTR>, cbRoProperties: DWORD, dwFlags: DWORD): HGROUPENUMEX {
    return Clusapi.Load('ClusterGroupOpenEnumEx')(hCluster, lpszProperties, cbProperties, lpszRoProperties, cbRoProperties, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergroupsetcloseenum
  public static ClusterGroupSetCloseEnum(hGroupSetEnum: HGROUPSETENUM): DWORD {
    return Clusapi.Load('ClusterGroupSetCloseEnum')(hGroupSetEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergroupsetcontrol
  public static ClusterGroupSetControl(
    hGroupSet: HGROUPSET,
    hHostNode: OPTIONAL<HNODE>,
    dwControlCode: DWORD,
    lpInBuffer: OPTIONAL<LPVOID>,
    cbInBufferSize: DWORD,
    lpOutBuffer_out: OPTIONAL<LPVOID>,
    cbOutBufferSize: DWORD,
    lpBytesReturned_out: OPTIONAL<LPDWORD>,
  ): DWORD {
    return Clusapi.Load('ClusterGroupSetControl')(hGroupSet, hHostNode, dwControlCode, lpInBuffer, cbInBufferSize, lpOutBuffer_out, cbOutBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergroupsetenum
  public static ClusterGroupSetEnum(hGroupSetEnum: HGROUPSETENUM, dwIndex: DWORD, lpszName_out: LPWSTR, lpcchName_in_out: LPDWORD): DWORD {
    return Clusapi.Load('ClusterGroupSetEnum')(hGroupSetEnum, dwIndex, lpszName_out, lpcchName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergroupsetgetenumcount
  public static ClusterGroupSetGetEnumCount(hGroupSetEnum: HGROUPSETENUM): DWORD {
    return Clusapi.Load('ClusterGroupSetGetEnumCount')(hGroupSetEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustergroupsetopenenum
  public static ClusterGroupSetOpenEnum(hCluster: HCLUSTER): HGROUPSETENUM {
    return Clusapi.Load('ClusterGroupSetOpenEnum')(hCluster);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternetinterfacecloseenum
  public static ClusterNetInterfaceCloseEnum(hNetInterfaceEnum: HNETINTERFACEENUM): DWORD {
    return Clusapi.Load('ClusterNetInterfaceCloseEnum')(hNetInterfaceEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternetinterfacecontrol
  public static ClusterNetInterfaceControl(
    hNetInterface: HNETINTERFACE,
    hHostNode: OPTIONAL<HNODE>,
    dwControlCode: DWORD,
    lpInBuffer: OPTIONAL<LPVOID>,
    nInBufferSize: DWORD,
    lpOutBuffer_out: OPTIONAL<LPVOID>,
    nOutBufferSize: DWORD,
    lpBytesReturned_out: OPTIONAL<LPDWORD>,
  ): DWORD {
    return Clusapi.Load('ClusterNetInterfaceControl')(hNetInterface, hHostNode, dwControlCode, lpInBuffer, nInBufferSize, lpOutBuffer_out, nOutBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternetinterfaceenum
  public static ClusterNetInterfaceEnum(hNetInterfaceEnum: HNETINTERFACEENUM, dwIndex: DWORD, lpszName_out: LPWSTR, lpcchName_in_out: LPDWORD): DWORD {
    return Clusapi.Load('ClusterNetInterfaceEnum')(hNetInterfaceEnum, dwIndex, lpszName_out, lpcchName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternetinterfaceopenenum
  public static ClusterNetInterfaceOpenEnum(hCluster: HCLUSTER, lpszNodeName: OPTIONAL<LPCWSTR>, lpszNetworkName: OPTIONAL<LPCWSTR>): HNETINTERFACEENUM {
    return Clusapi.Load('ClusterNetInterfaceOpenEnum')(hCluster, lpszNodeName, lpszNetworkName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternetworkcloseenum
  public static ClusterNetworkCloseEnum(hNetworkEnum: HNETWORKENUM): DWORD {
    return Clusapi.Load('ClusterNetworkCloseEnum')(hNetworkEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternetworkcontrol
  public static ClusterNetworkControl(
    hNetwork: HNETWORK,
    hHostNode: OPTIONAL<HNODE>,
    dwControlCode: DWORD,
    lpInBuffer: OPTIONAL<LPVOID>,
    nInBufferSize: DWORD,
    lpOutBuffer_out: OPTIONAL<LPVOID>,
    nOutBufferSize: DWORD,
    lpBytesReturned_out: OPTIONAL<LPDWORD>,
  ): DWORD {
    return Clusapi.Load('ClusterNetworkControl')(hNetwork, hHostNode, dwControlCode, lpInBuffer, nInBufferSize, lpOutBuffer_out, nOutBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternetworkenum
  public static ClusterNetworkEnum(hNetworkEnum: HNETWORKENUM, dwIndex: DWORD, lpdwType_out: LPDWORD, lpszName_out: LPWSTR, lpcchName_in_out: LPDWORD): DWORD {
    return Clusapi.Load('ClusterNetworkEnum')(hNetworkEnum, dwIndex, lpdwType_out, lpszName_out, lpcchName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternetworkgetenumcount
  public static ClusterNetworkGetEnumCount(hNetworkEnum: HNETWORKENUM): DWORD {
    return Clusapi.Load('ClusterNetworkGetEnumCount')(hNetworkEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternetworkopenenum
  public static ClusterNetworkOpenEnum(hNetwork: HNETWORK, dwType: DWORD): HNETWORKENUM {
    return Clusapi.Load('ClusterNetworkOpenEnum')(hNetwork, dwType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternodecloseenum
  public static ClusterNodeCloseEnum(hNodeEnum: HNODEENUM): DWORD {
    return Clusapi.Load('ClusterNodeCloseEnum')(hNodeEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternodecloseenumex
  public static ClusterNodeCloseEnumEx(hNodeEnum: HNODEENUMEX): DWORD {
    return Clusapi.Load('ClusterNodeCloseEnumEx')(hNodeEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternodecontrol
  public static ClusterNodeControl(
    hNode: HNODE,
    hHostNode: OPTIONAL<HNODE>,
    dwControlCode: DWORD,
    lpInBuffer: OPTIONAL<LPVOID>,
    nInBufferSize: DWORD,
    lpOutBuffer_out: OPTIONAL<LPVOID>,
    nOutBufferSize: DWORD,
    lpBytesReturned_out: OPTIONAL<LPDWORD>,
  ): DWORD {
    return Clusapi.Load('ClusterNodeControl')(hNode, hHostNode, dwControlCode, lpInBuffer, nInBufferSize, lpOutBuffer_out, nOutBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternodeenum
  public static ClusterNodeEnum(hNodeEnum: HNODEENUM, dwIndex: DWORD, lpdwType_out: LPDWORD, lpszName_out: LPWSTR, lpcchName_in_out: LPDWORD): DWORD {
    return Clusapi.Load('ClusterNodeEnum')(hNodeEnum, dwIndex, lpdwType_out, lpszName_out, lpcchName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternodeenumex
  public static ClusterNodeEnumEx(hNodeEnum: HNODEENUMEX, dwIndex: DWORD, pItem_in_out: PCLUSTER_ENUM_ITEM, cbItem_in_out: LPDWORD): DWORD {
    return Clusapi.Load('ClusterNodeEnumEx')(hNodeEnum, dwIndex, pItem_in_out, cbItem_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternodegetenumcount
  public static ClusterNodeGetEnumCount(hNodeEnum: HNODEENUM): DWORD {
    return Clusapi.Load('ClusterNodeGetEnumCount')(hNodeEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternodegetenumcountex
  public static ClusterNodeGetEnumCountEx(hNodeEnum: HNODEENUMEX): DWORD {
    return Clusapi.Load('ClusterNodeGetEnumCountEx')(hNodeEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternodeopenenum
  public static ClusterNodeOpenEnum(hNode: HNODE, dwType: DWORD): HNODEENUM {
    return Clusapi.Load('ClusterNodeOpenEnum')(hNode, dwType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusternodeopenenumex
  public static ClusterNodeOpenEnumEx(hNode: HNODE, dwType: DWORD, pOptions: OPTIONAL<PVOID>): HNODEENUMEX {
    return Clusapi.Load('ClusterNodeOpenEnumEx')(hNode, dwType, pOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusteropenenum
  public static ClusterOpenEnum(hCluster: HCLUSTER, dwType: DWORD): HCLUSENUM {
    return Clusapi.Load('ClusterOpenEnum')(hCluster, dwType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusteropenenumex
  public static ClusterOpenEnumEx(hCluster: HCLUSTER, dwType: DWORD, pOptions: OPTIONAL<PVOID>): HCLUSENUMEX {
    return Clusapi.Load('ClusterOpenEnumEx')(hCluster, dwType, pOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregbatchaddcommand
  public static ClusterRegBatchAddCommand(hRegBatch: HREGBATCH, dwCommand: CLUSTER_REG_COMMAND, wzName: OPTIONAL<LPCWSTR>, dwOptions: DWORD, lpData: OPTIONAL<LPVOID>, cbData: DWORD): LONG {
    return Clusapi.Load('ClusterRegBatchAddCommand')(hRegBatch, dwCommand, wzName, dwOptions, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregbatchclosenotification
  public static ClusterRegBatchCloseNotification(hBatchNotification: HREGBATCHNOTIFICATION): LONG {
    return Clusapi.Load('ClusterRegBatchCloseNotification')(hBatchNotification);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregbatchreadcommand
  public static ClusterRegBatchReadCommand(hBatchNotification: HREGBATCHNOTIFICATION, pBatchCommand_out: PCLUSTER_BATCH_COMMAND): LONG {
    return Clusapi.Load('ClusterRegBatchReadCommand')(hBatchNotification, pBatchCommand_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregclosebatch
  public static ClusterRegCloseBatch(hRegBatch: HREGBATCH, bCommit: BOOL, failedCommandNumber_out: OPTIONAL<PINT>): LONG {
    return Clusapi.Load('ClusterRegCloseBatch')(hRegBatch, bCommit, failedCommandNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregclosebatchex
  public static ClusterRegCloseBatchEx(hRegBatch: HREGBATCH, flags: DWORD, failedCommandNumber_out: OPTIONAL<PINT>): LONG {
    return Clusapi.Load('ClusterRegCloseBatchEx')(hRegBatch, flags, failedCommandNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregclosebatchnotifyport
  public static ClusterRegCloseBatchNotifyPort(hBatchNotifyPort: HREGBATCHPORT): LONG {
    return Clusapi.Load('ClusterRegCloseBatchNotifyPort')(hBatchNotifyPort);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregclosekey
  public static ClusterRegCloseKey(hKey: HKEY): LONG {
    return Clusapi.Load('ClusterRegCloseKey')(hKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregclosereadbatch
  public static ClusterRegCloseReadBatch(hRegReadBatch: HREGREADBATCH, phRegReadBatchReply_out: PHREGREADBATCHREPLY): LONG {
    return Clusapi.Load('ClusterRegCloseReadBatch')(hRegReadBatch, phRegReadBatchReply_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregclosereadbatchex
  public static ClusterRegCloseReadBatchEx(hRegReadBatch: HREGREADBATCH, flags: DWORD, phRegReadBatchReply_out: PHREGREADBATCHREPLY): LONG {
    return Clusapi.Load('ClusterRegCloseReadBatchEx')(hRegReadBatch, flags, phRegReadBatchReply_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregclosereadbatchreply
  public static ClusterRegCloseReadBatchReply(hRegReadBatchReply: HREGREADBATCHREPLY): LONG {
    return Clusapi.Load('ClusterRegCloseReadBatchReply')(hRegReadBatchReply);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregcreatebatch
  public static ClusterRegCreateBatch(hKey: OPTIONAL<HKEY>, pHREGBATCH_out: PHREGBATCH): LONG {
    return Clusapi.Load('ClusterRegCreateBatch')(hKey, pHREGBATCH_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregcreatebatchnotifyport
  public static ClusterRegCreateBatchNotifyPort(hKey: HKEY, phBatchNotifyPort_out: PHREGBATCHPORT): LONG {
    return Clusapi.Load('ClusterRegCreateBatchNotifyPort')(hKey, phBatchNotifyPort_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregcreatekey
  public static ClusterRegCreateKey(hKey: HKEY, lpszSubKey: LPCWSTR, dwOptions: DWORD, samDesired: REGSAM, lpSecurityAttributes: OPTIONAL<LPSECURITY_ATTRIBUTES>, phkResult_out: PHKEY, lpdwDisposition_out: OPTIONAL<LPDWORD>): LONG {
    return Clusapi.Load('ClusterRegCreateKey')(hKey, lpszSubKey, dwOptions, samDesired, lpSecurityAttributes, phkResult_out, lpdwDisposition_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregcreatereadbatch
  public static ClusterRegCreateReadBatch(hKey: HKEY, phRegReadBatch_out: PHREGREADBATCH): LONG {
    return Clusapi.Load('ClusterRegCreateReadBatch')(hKey, phRegReadBatch_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregdeletekey
  public static ClusterRegDeleteKey(hKey: HKEY, lpszSubKey: LPCWSTR): LONG {
    return Clusapi.Load('ClusterRegDeleteKey')(hKey, lpszSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregdeletevalue
  public static ClusterRegDeleteValue(hKey: HKEY, lpszValueName: LPCWSTR): DWORD {
    return Clusapi.Load('ClusterRegDeleteValue')(hKey, lpszValueName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregenumkey
  public static ClusterRegEnumKey(hKey: HKEY, dwIndex: DWORD, lpszName_out: LPWSTR, lpcchName_in_out: LPDWORD, lpftLastWriteTime_out: OPTIONAL<PFILETIME>): LONG {
    return Clusapi.Load('ClusterRegEnumKey')(hKey, dwIndex, lpszName_out, lpcchName_in_out, lpftLastWriteTime_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregenumvalue
  public static ClusterRegEnumValue(hKey: HKEY, dwIndex: DWORD, lpszValueName_out: LPWSTR, lpcchValueName_in_out: LPDWORD, lpdwType_out: OPTIONAL<LPDWORD>, lpData_out: OPTIONAL<LPBYTE>, lpcbData_in_out: OPTIONAL<LPDWORD>): DWORD {
    return Clusapi.Load('ClusterRegEnumValue')(hKey, dwIndex, lpszValueName_out, lpcchValueName_in_out, lpdwType_out, lpData_out, lpcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterreggetbatchnotification
  public static ClusterRegGetBatchNotification(hBatchNotify: HREGBATCHPORT, phBatchNotification_out: PHREGBATCHNOTIFICATION): LONG {
    return Clusapi.Load('ClusterRegGetBatchNotification')(hBatchNotify, phBatchNotification_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterreggetkeysecurity
  public static ClusterRegGetKeySecurity(hKey: HKEY, RequestedInformation: SECURITY_INFORMATION, pSecurityDescriptor_out: PSECURITY_DESCRIPTOR, lpcbSecurityDescriptor_in_out: LPDWORD): LONG {
    return Clusapi.Load('ClusterRegGetKeySecurity')(hKey, RequestedInformation, pSecurityDescriptor_out, lpcbSecurityDescriptor_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregopenkey
  public static ClusterRegOpenKey(hKey: HKEY, lpszSubKey: LPCWSTR, samDesired: REGSAM, phkResult_out: PHKEY): LONG {
    return Clusapi.Load('ClusterRegOpenKey')(hKey, lpszSubKey, samDesired, phkResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregqueryinfokey
  public static ClusterRegQueryInfoKey(
    hKey: HKEY,
    lpcSubKeys: LPDWORD,
    lpcchMaxSubKeyLen: LPDWORD,
    lpcValues: LPDWORD,
    lpcchMaxValueNameLen: LPDWORD,
    lpcbMaxValueLen: LPDWORD,
    lpcbSecurityDescriptor: LPDWORD,
    lpftLastWriteTime: PFILETIME,
  ): LONG {
    return Clusapi.Load('ClusterRegQueryInfoKey')(hKey, lpcSubKeys, lpcchMaxSubKeyLen, lpcValues, lpcchMaxValueNameLen, lpcbMaxValueLen, lpcbSecurityDescriptor, lpftLastWriteTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregqueryvalue
  public static ClusterRegQueryValue(hKey: HKEY, lpszValueName: LPCWSTR, lpdwValueType_out: OPTIONAL<LPDWORD>, lpData_out: OPTIONAL<LPBYTE>, lpcbData_in_out: OPTIONAL<LPDWORD>): LONG {
    return Clusapi.Load('ClusterRegQueryValue')(hKey, lpszValueName, lpdwValueType_out, lpData_out, lpcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregreadbatchaddcommand
  public static ClusterRegReadBatchAddCommand(hRegReadBatch: HREGREADBATCH, wzSubkeyName: LPCWSTR, wzValueName: LPCWSTR): LONG {
    return Clusapi.Load('ClusterRegReadBatchAddCommand')(hRegReadBatch, wzSubkeyName, wzValueName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregreadbatchreplynextcommand
  public static ClusterRegReadBatchReplyNextCommand(hRegReadBatchReply: HREGREADBATCHREPLY, pBatchCommand_out: PCLUSTER_READ_BATCH_COMMAND): LONG {
    return Clusapi.Load('ClusterRegReadBatchReplyNextCommand')(hRegReadBatchReply, pBatchCommand_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregsetkeysecurity
  public static ClusterRegSetKeySecurity(hKey: HKEY, SecurityInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR): LONG {
    return Clusapi.Load('ClusterRegSetKeySecurity')(hKey, SecurityInformation, pSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregsetvalue
  public static ClusterRegSetValue(hKey: HKEY, lpszValueName: LPCWSTR, dwType: DWORD, lpData: LPBYTE, cbData: DWORD): DWORD {
    return Clusapi.Load('ClusterRegSetValue')(hKey, lpszValueName, dwType, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterregsyncdatabase
  public static ClusterRegSyncDatabase(hCluster: HCLUSTER, flags: DWORD): LONG {
    return Clusapi.Load('ClusterRegSyncDatabase')(hCluster, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterremovegroupfromgroupset
  public static ClusterRemoveGroupFromGroupSet(hGroup: HGROUP): DWORD {
    return Clusapi.Load('ClusterRemoveGroupFromGroupSet')(hGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourcecloseenum
  public static ClusterResourceCloseEnum(hResEnum: HRESENUM): DWORD {
    return Clusapi.Load('ClusterResourceCloseEnum')(hResEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourcecloseenumex
  public static ClusterResourceCloseEnumEx(hResourceEnumEx: HRESENUMEX): DWORD {
    return Clusapi.Load('ClusterResourceCloseEnumEx')(hResourceEnumEx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourcecontrol
  public static ClusterResourceControl(
    hResource: HRESOURCE,
    hHostNode: OPTIONAL<HNODE>,
    dwControlCode: DWORD,
    lpInBuffer: OPTIONAL<LPVOID>,
    cbInBufferSize: DWORD,
    lpOutBuffer_out: OPTIONAL<LPVOID>,
    cbOutBufferSize: DWORD,
    lpBytesReturned_out: OPTIONAL<LPDWORD>,
  ): DWORD {
    return Clusapi.Load('ClusterResourceControl')(hResource, hHostNode, dwControlCode, lpInBuffer, cbInBufferSize, lpOutBuffer_out, cbOutBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourcecontrolasuser
  public static ClusterResourceControlAsUser(
    hResource: HRESOURCE,
    hHostNode: OPTIONAL<HNODE>,
    dwControlCode: DWORD,
    lpInBuffer: OPTIONAL<LPVOID>,
    cbInBufferSize: DWORD,
    lpOutBuffer_out: OPTIONAL<LPVOID>,
    cbOutBufferSize: DWORD,
    lpBytesReturned_out: OPTIONAL<LPDWORD>,
  ): DWORD {
    return Clusapi.Load('ClusterResourceControlAsUser')(hResource, hHostNode, dwControlCode, lpInBuffer, cbInBufferSize, lpOutBuffer_out, cbOutBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourceenum
  public static ClusterResourceEnum(hResEnum: HRESENUM, dwIndex: DWORD, lpdwType_out: LPDWORD, lpszName_out: LPWSTR, lpcchName_in_out: LPDWORD): DWORD {
    return Clusapi.Load('ClusterResourceEnum')(hResEnum, dwIndex, lpdwType_out, lpszName_out, lpcchName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourceenumex
  public static ClusterResourceEnumEx(hResourceEnumEx: HRESENUMEX, dwIndex: DWORD, pItem_in_out: PCLUSTER_RESOURCE_ENUM_ITEM, cbItem_in_out: LPDWORD): DWORD {
    return Clusapi.Load('ClusterResourceEnumEx')(hResourceEnumEx, dwIndex, pItem_in_out, cbItem_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourcegetenumcount
  public static ClusterResourceGetEnumCount(hResEnum: HRESENUM): DWORD {
    return Clusapi.Load('ClusterResourceGetEnumCount')(hResEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourcegetenumcountex
  public static ClusterResourceGetEnumCountEx(hResourceEnumEx: HRESENUMEX): DWORD {
    return Clusapi.Load('ClusterResourceGetEnumCountEx')(hResourceEnumEx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourceopenenum
  public static ClusterResourceOpenEnum(hResource: HRESOURCE, dwType: DWORD): HRESENUM {
    return Clusapi.Load('ClusterResourceOpenEnum')(hResource, dwType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourceopenenumex
  public static ClusterResourceOpenEnumEx(hCluster: HCLUSTER, lpszProperties: OPTIONAL<LPCWSTR>, cbProperties: DWORD, lpszRoProperties: OPTIONAL<LPCWSTR>, cbRoProperties: DWORD, dwFlags: DWORD): HRESENUMEX {
    return Clusapi.Load('ClusterResourceOpenEnumEx')(hCluster, lpszProperties, cbProperties, lpszRoProperties, cbRoProperties, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourcetypecloseenum
  public static ClusterResourceTypeCloseEnum(hResTypeEnum: HRESTYPEENUM): DWORD {
    return Clusapi.Load('ClusterResourceTypeCloseEnum')(hResTypeEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourcetypecontrol
  public static ClusterResourceTypeControl(
    hCluster: HCLUSTER,
    lpszResourceTypeName: LPCWSTR,
    hHostNode: OPTIONAL<HNODE>,
    dwControlCode: DWORD,
    lpInBuffer: OPTIONAL<LPVOID>,
    nInBufferSize: DWORD,
    lpOutBuffer_out: OPTIONAL<LPVOID>,
    nOutBufferSize: DWORD,
    lpBytesReturned_out: OPTIONAL<LPDWORD>,
  ): DWORD {
    return Clusapi.Load('ClusterResourceTypeControl')(hCluster, lpszResourceTypeName, hHostNode, dwControlCode, lpInBuffer, nInBufferSize, lpOutBuffer_out, nOutBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourcetypecontrolasuser
  public static ClusterResourceTypeControlAsUser(
    hCluster: HCLUSTER,
    lpszResourceTypeName: LPCWSTR,
    hHostNode: OPTIONAL<HNODE>,
    dwControlCode: DWORD,
    lpInBuffer: OPTIONAL<LPVOID>,
    nInBufferSize: DWORD,
    lpOutBuffer_out: OPTIONAL<LPVOID>,
    nOutBufferSize: DWORD,
    lpBytesReturned_out: OPTIONAL<LPDWORD>,
  ): DWORD {
    return Clusapi.Load('ClusterResourceTypeControlAsUser')(hCluster, lpszResourceTypeName, hHostNode, dwControlCode, lpInBuffer, nInBufferSize, lpOutBuffer_out, nOutBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourcetypeenum
  public static ClusterResourceTypeEnum(hResTypeEnum: HRESTYPEENUM, dwIndex: DWORD, lpdwType_out: LPDWORD, lpszName_out: LPWSTR, lpcchName_in_out: LPDWORD): DWORD {
    return Clusapi.Load('ClusterResourceTypeEnum')(hResTypeEnum, dwIndex, lpdwType_out, lpszName_out, lpcchName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourcetypegetenumcount
  public static ClusterResourceTypeGetEnumCount(hResTypeEnum: HRESTYPEENUM): DWORD {
    return Clusapi.Load('ClusterResourceTypeGetEnumCount')(hResTypeEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterresourcetypeopenenum
  public static ClusterResourceTypeOpenEnum(hCluster: HCLUSTER, lpszResourceTypeName: LPCWSTR, dwType: DWORD): HRESTYPEENUM {
    return Clusapi.Load('ClusterResourceTypeOpenEnum')(hCluster, lpszResourceTypeName, dwType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustersetaccountaccess
  public static ClusterSetAccountAccess(hCluster: HCLUSTER, szAccountSID: LPCWSTR, dwAccess: DWORD, dwControlType: DWORD): DWORD {
    return Clusapi.Load('ClusterSetAccountAccess')(hCluster, szAccountSID, dwAccess, dwControlType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clustersharedvolumesetsnapshotstate
  public static ClusterSharedVolumeSetSnapshotState(guidSnapshotSet: PGUID, lpszVolumeName: LPCWSTR, state: CLUSTER_SHARED_VOLUME_SNAPSHOT_STATE): DWORD {
    return Clusapi.Load('ClusterSharedVolumeSetSnapshotState')(guidSnapshotSet, lpszVolumeName, state);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-clusterupgradefunctionallevel
  public static ClusterUpgradeFunctionalLevel(hCluster: HCLUSTER, perform: BOOL, pfnProgressCallback: OPTIONAL<PCLUSTER_UPGRADE_PROGRESS_CALLBACK>, pvCallbackArg: OPTIONAL<PVOID>): DWORD {
    return Clusapi.Load('ClusterUpgradeFunctionalLevel')(hCluster, perform, pfnProgressCallback, pvCallbackArg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-createcluster
  public static CreateCluster(pConfig: PCREATE_CLUSTER_CONFIG, pfnProgressCallback: OPTIONAL<PCLUSTER_SETUP_PROGRESS_CALLBACK>, pvCallbackArg: OPTIONAL<PVOID>): HCLUSTER {
    return Clusapi.Load('CreateCluster')(pConfig, pfnProgressCallback, pvCallbackArg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-createclustergroup
  public static CreateClusterGroup(hCluster: HCLUSTER, lpszGroupName: LPCWSTR): HGROUP {
    return Clusapi.Load('CreateClusterGroup')(hCluster, lpszGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-createclustergroupex
  public static CreateClusterGroupEx(hCluster: HCLUSTER, lpszGroupName: LPCWSTR, pGroupInfo: OPTIONAL<PCLUSTER_CREATE_GROUP_INFO>): HGROUP {
    return Clusapi.Load('CreateClusterGroupEx')(hCluster, lpszGroupName, pGroupInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-createclustergroupset
  public static CreateClusterGroupSet(hCluster: HCLUSTER, groupSetName: LPCWSTR): HGROUPSET {
    return Clusapi.Load('CreateClusterGroupSet')(hCluster, groupSetName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-createclusternameaccount
  public static CreateClusterNameAccount(hCluster: HCLUSTER, pConfig: PCREATE_CLUSTER_NAME_ACCOUNT, pfnProgressCallback: OPTIONAL<PCLUSTER_SETUP_PROGRESS_CALLBACK>, pvCallbackArg: OPTIONAL<PVOID>): DWORD {
    return Clusapi.Load('CreateClusterNameAccount')(hCluster, pConfig, pfnProgressCallback, pvCallbackArg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-createclusternotifyport
  public static CreateClusterNotifyPort(hChange: HCHANGE, hCluster: HCLUSTER, dwFilter: DWORD, dwNotifyKey: DWORD_PTR): HCHANGE {
    return Clusapi.Load('CreateClusterNotifyPort')(hChange, hCluster, dwFilter, dwNotifyKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-createclusternotifyportv2
  public static CreateClusterNotifyPortV2(hChange: HCHANGE, hCluster: HCLUSTER, Filters: PNOTIFY_FILTER_AND_TYPE, dwFilterCount: DWORD, dwNotifyKey: DWORD_PTR): HCHANGE {
    return Clusapi.Load('CreateClusterNotifyPortV2')(hChange, hCluster, Filters, dwFilterCount, dwNotifyKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-createclusterresource
  public static CreateClusterResource(hGroup: HGROUP, lpszResourceName: LPCWSTR, lpszResourceType: LPCWSTR, dwFlags: DWORD): HRESOURCE {
    return Clusapi.Load('CreateClusterResource')(hGroup, lpszResourceName, lpszResourceType, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-createclusterresourcetype
  public static CreateClusterResourceType(hCluster: HCLUSTER, lpszResourceTypeName: LPCWSTR, lpszDisplayName: LPCWSTR, lpszResourceTypeDll: LPCWSTR, dwLooksAlivePollInterval: DWORD, dwIsAlivePollInterval: DWORD): DWORD {
    return Clusapi.Load('CreateClusterResourceType')(hCluster, lpszResourceTypeName, lpszDisplayName, lpszResourceTypeDll, dwLooksAlivePollInterval, dwIsAlivePollInterval);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-deleteclustergroup
  public static DeleteClusterGroup(hGroup: HGROUP): DWORD {
    return Clusapi.Load('DeleteClusterGroup')(hGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-deleteclustergroupset
  public static DeleteClusterGroupSet(hGroupSet: HGROUPSET): DWORD {
    return Clusapi.Load('DeleteClusterGroupSet')(hGroupSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-deleteclusterresource
  public static DeleteClusterResource(hResource: HRESOURCE): DWORD {
    return Clusapi.Load('DeleteClusterResource')(hResource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-deleteclusterresourcetype
  public static DeleteClusterResourceType(hCluster: HCLUSTER, lpszResourceTypeName: LPCWSTR): DWORD {
    return Clusapi.Load('DeleteClusterResourceType')(hCluster, lpszResourceTypeName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-destroycluster
  public static DestroyCluster(hCluster: HCLUSTER, pfnProgressCallback: OPTIONAL<PCLUSTER_SETUP_PROGRESS_CALLBACK>, pvCallbackArg: OPTIONAL<PVOID>, fdeleteVirtualComputerObjects: BOOL): DWORD {
    return Clusapi.Load('DestroyCluster')(hCluster, pfnProgressCallback, pvCallbackArg, fdeleteVirtualComputerObjects);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-destroyclustergroup
  public static DestroyClusterGroup(hGroup: HGROUP): DWORD {
    return Clusapi.Load('DestroyClusterGroup')(hGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-evictclusternode
  public static EvictClusterNode(hNode: HNODE): DWORD {
    return Clusapi.Load('EvictClusterNode')(hNode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-evictclusternodeex
  public static EvictClusterNodeEx(hNode: HNODE, dwTimeOut: DWORD, phrCleanupStatus_out: PHRESULT): DWORD {
    return Clusapi.Load('EvictClusterNodeEx')(hNode, dwTimeOut, phrCleanupStatus_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-failclusterresource
  public static FailClusterResource(hResource: HRESOURCE): DWORD {
    return Clusapi.Load('FailClusterResource')(hResource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusterfromgroup
  public static GetClusterFromGroup(hGroup: HGROUP): HCLUSTER {
    return Clusapi.Load('GetClusterFromGroup')(hGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusterfromnetinterface
  public static GetClusterFromNetInterface(hNetInterface: HNETINTERFACE): HCLUSTER {
    return Clusapi.Load('GetClusterFromNetInterface')(hNetInterface);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusterfromnetwork
  public static GetClusterFromNetwork(hNetwork: HNETWORK): HCLUSTER {
    return Clusapi.Load('GetClusterFromNetwork')(hNetwork);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusterfromnode
  public static GetClusterFromNode(hNode: HNODE): HCLUSTER {
    return Clusapi.Load('GetClusterFromNode')(hNode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusterfromresource
  public static GetClusterFromResource(hResource: HRESOURCE): HCLUSTER {
    return Clusapi.Load('GetClusterFromResource')(hResource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclustergroupkey
  public static GetClusterGroupKey(hGroup: HGROUP, samDesired: REGSAM): HKEY {
    return Clusapi.Load('GetClusterGroupKey')(hGroup, samDesired);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclustergroupstate
  public static GetClusterGroupState(hGroup: HGROUP, lpszNodeName_out: OPTIONAL<LPWSTR>, lpcchNodeName_in_out: OPTIONAL<LPDWORD>): CLUSTER_GROUP_STATE {
    return Clusapi.Load('GetClusterGroupState')(hGroup, lpszNodeName_out, lpcchNodeName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusterinformation
  public static GetClusterInformation(hCluster: HCLUSTER, lpszClusterName_out: LPWSTR, lpcchClusterName_in_out: LPDWORD, lpClusterInfo_out: OPTIONAL<LPCLUSTERVERSIONINFO>): DWORD {
    return Clusapi.Load('GetClusterInformation')(hCluster, lpszClusterName_out, lpcchClusterName_in_out, lpClusterInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusterkey
  public static GetClusterKey(hCluster: HCLUSTER, samDesired: REGSAM): HKEY {
    return Clusapi.Load('GetClusterKey')(hCluster, samDesired);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusternetinterface
  public static GetClusterNetInterface(hCluster: HCLUSTER, lpszNodeName: LPCWSTR, lpszNetworkName: LPCWSTR, lpszInterfaceName_out: LPWSTR, lpcchInterfaceName_in_out: LPDWORD): DWORD {
    return Clusapi.Load('GetClusterNetInterface')(hCluster, lpszNodeName, lpszNetworkName, lpszInterfaceName_out, lpcchInterfaceName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusternetinterfacekey
  public static GetClusterNetInterfaceKey(hNetInterface: HNETINTERFACE, samDesired: REGSAM): HKEY {
    return Clusapi.Load('GetClusterNetInterfaceKey')(hNetInterface, samDesired);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusternetinterfacestate
  public static GetClusterNetInterfaceState(hNetInterface: HNETINTERFACE): CLUSTER_NETINTERFACE_STATE {
    return Clusapi.Load('GetClusterNetInterfaceState')(hNetInterface);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusternetworkid
  public static GetClusterNetworkId(hNetwork: HNETWORK, lpszNetworkId_out: LPWSTR, lpcchName_in_out: LPDWORD): DWORD {
    return Clusapi.Load('GetClusterNetworkId')(hNetwork, lpszNetworkId_out, lpcchName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusternetworkkey
  public static GetClusterNetworkKey(hNetwork: HNETWORK, samDesired: REGSAM): HKEY {
    return Clusapi.Load('GetClusterNetworkKey')(hNetwork, samDesired);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusternetworkstate
  public static GetClusterNetworkState(hNetwork: HNETWORK): CLUSTER_NETWORK_STATE {
    return Clusapi.Load('GetClusterNetworkState')(hNetwork);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusternodeid
  public static GetClusterNodeId(hNode: OPTIONAL<HNODE>, lpszNodeId_out: LPWSTR, lpcchName_in_out: LPDWORD): DWORD {
    return Clusapi.Load('GetClusterNodeId')(hNode, lpszNodeId_out, lpcchName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusternodekey
  public static GetClusterNodeKey(hNode: HNODE, samDesired: REGSAM): HKEY {
    return Clusapi.Load('GetClusterNodeKey')(hNode, samDesired);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusternodestate
  public static GetClusterNodeState(hNode: HNODE): CLUSTER_NODE_STATE {
    return Clusapi.Load('GetClusterNodeState')(hNode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusternotify
  public static GetClusterNotify(hChange: HCHANGE, lpdwNotifyKey_out: PDWORD_PTR, lpdwFilterType_out: LPDWORD, lpszName_out: LPWSTR, lpcchName_in_out: LPDWORD, dwMilliseconds: DWORD): DWORD {
    return Clusapi.Load('GetClusterNotify')(hChange, lpdwNotifyKey_out, lpdwFilterType_out, lpszName_out, lpcchName_in_out, dwMilliseconds);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusternotifyv2
  public static GetClusterNotifyV2(
    hChange: HCHANGE,
    lpdwNotifyKey_out: PDWORD_PTR,
    pFilterAndType_in_out: OPTIONAL<PNOTIFY_FILTER_AND_TYPE>,
    buffer_in_out: OPTIONAL<LPBYTE>,
    lpbBufferSize_in_out: OPTIONAL<LPDWORD>,
    lpszObjectId_in_out: OPTIONAL<LPWSTR>,
    lpcchObjectId_in_out: OPTIONAL<LPDWORD>,
    lpszParentId_in_out: OPTIONAL<LPWSTR>,
    lpcchParentId_in_out: OPTIONAL<LPDWORD>,
    lpszName_in_out: OPTIONAL<LPWSTR>,
    lpcchName_in_out: OPTIONAL<LPDWORD>,
    lpszType_in_out: OPTIONAL<LPWSTR>,
    lpcchType_in_out: OPTIONAL<LPDWORD>,
    dwMilliseconds: DWORD,
  ): DWORD {
    return Clusapi.Load('GetClusterNotifyV2')(
      hChange,
      lpdwNotifyKey_out,
      pFilterAndType_in_out,
      buffer_in_out,
      lpbBufferSize_in_out,
      lpszObjectId_in_out,
      lpcchObjectId_in_out,
      lpszParentId_in_out,
      lpcchParentId_in_out,
      lpszName_in_out,
      lpcchName_in_out,
      lpszType_in_out,
      lpcchType_in_out,
      dwMilliseconds,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusterquorumresource
  public static GetClusterQuorumResource(hCluster: HCLUSTER, lpszResourceName_out: LPWSTR, lpcchResourceName_in_out: LPDWORD, lpszDeviceName_out: LPWSTR, lpcchDeviceName_in_out: LPDWORD, lpdwMaxQuorumLogSize_out: LPDWORD): DWORD {
    return Clusapi.Load('GetClusterQuorumResource')(hCluster, lpszResourceName_out, lpcchResourceName_in_out, lpszDeviceName_out, lpcchDeviceName_in_out, lpdwMaxQuorumLogSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusterresourcedependencyexpression
  public static GetClusterResourceDependencyExpression(hResource: HRESOURCE, lpszDependencyExpression_out: OPTIONAL<LPWSTR>, lpcchDependencyExpression_in_out: LPDWORD): DWORD {
    return Clusapi.Load('GetClusterResourceDependencyExpression')(hResource, lpszDependencyExpression_out, lpcchDependencyExpression_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusterresourcekey
  public static GetClusterResourceKey(hResource: HRESOURCE, samDesired: REGSAM): HKEY {
    return Clusapi.Load('GetClusterResourceKey')(hResource, samDesired);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusterresourcenetworkname
  public static GetClusterResourceNetworkName(hResource: HRESOURCE, lpBuffer_out: LPWSTR, nSize_in_out: LPDWORD): BOOL {
    return Clusapi.Load('GetClusterResourceNetworkName')(hResource, lpBuffer_out, nSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusterresourcestate
  public static GetClusterResourceState(
    hResource: HRESOURCE,
    lpszNodeName_out: OPTIONAL<LPWSTR>,
    lpcchNodeName_in_out: OPTIONAL<LPDWORD>,
    lpszGroupName_out: OPTIONAL<LPWSTR>,
    lpcchGroupName_in_out: OPTIONAL<LPDWORD>,
  ): CLUSTER_RESOURCE_STATE {
    return Clusapi.Load('GetClusterResourceState')(hResource, lpszNodeName_out, lpcchNodeName_in_out, lpszGroupName_out, lpcchGroupName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getclusterresourcetypekey
  public static GetClusterResourceTypeKey(hCluster: HCLUSTER, lpszTypeName: LPCWSTR, samDesired: REGSAM): HKEY {
    return Clusapi.Load('GetClusterResourceTypeKey')(hCluster, lpszTypeName, samDesired);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getnodeclusterstate
  public static GetNodeClusterState(lpszNodeName: OPTIONAL<LPCWSTR>, pdwClusterState_out: LPDWORD): DWORD {
    return Clusapi.Load('GetNodeClusterState')(lpszNodeName, pdwClusterState_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-getnotifyeventhandle
  public static GetNotifyEventHandle(hChange: HCHANGE, lphTargetEvent_out: LPHANDLE): DWORD {
    return Clusapi.Load('GetNotifyEventHandle')(hChange, lphTargetEvent_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-isfileonclustersharedvolume
  public static IsFileOnClusterSharedVolume(lpszPathName: LPCWSTR, pbFileIsOnSharedVolume_out: PBOOL): DWORD {
    return Clusapi.Load('IsFileOnClusterSharedVolume')(lpszPathName, pbFileIsOnSharedVolume_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-moveclustergroup
  public static MoveClusterGroup(hGroup: HGROUP, hDestinationNode: OPTIONAL<HNODE>): DWORD {
    return Clusapi.Load('MoveClusterGroup')(hGroup, hDestinationNode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-moveclustergroupex
  public static MoveClusterGroupEx(hGroup: HGROUP, hDestinationNode: OPTIONAL<HNODE>, dwMoveFlags: DWORD, lpInBuffer: OPTIONAL<PBYTE>, cbInBufferSize: DWORD): DWORD {
    return Clusapi.Load('MoveClusterGroupEx')(hGroup, hDestinationNode, dwMoveFlags, lpInBuffer, cbInBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-offlineclustergroup
  public static OfflineClusterGroup(hGroup: HGROUP): DWORD {
    return Clusapi.Load('OfflineClusterGroup')(hGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-offlineclustergroupex
  public static OfflineClusterGroupEx(hGroup: HGROUP, dwOfflineFlags: DWORD, lpInBuffer: OPTIONAL<PBYTE>, cbInBufferSize: DWORD): DWORD {
    return Clusapi.Load('OfflineClusterGroupEx')(hGroup, dwOfflineFlags, lpInBuffer, cbInBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-offlineclusterresource
  public static OfflineClusterResource(hResource: HRESOURCE): DWORD {
    return Clusapi.Load('OfflineClusterResource')(hResource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-offlineclusterresourceex
  public static OfflineClusterResourceEx(hResource: HRESOURCE, dwOfflineFlags: DWORD, lpInBuffer: OPTIONAL<PBYTE>, cbInBufferSize: DWORD): DWORD {
    return Clusapi.Load('OfflineClusterResourceEx')(hResource, dwOfflineFlags, lpInBuffer, cbInBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-onlineclustergroup
  public static OnlineClusterGroup(hGroup: HGROUP, hDestinationNode: OPTIONAL<HNODE>): DWORD {
    return Clusapi.Load('OnlineClusterGroup')(hGroup, hDestinationNode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-onlineclustergroupex
  public static OnlineClusterGroupEx(hGroup: HGROUP, hDestinationNode: OPTIONAL<HNODE>, dwOnlineFlags: DWORD, lpInBuffer: OPTIONAL<PBYTE>, cbInBufferSize: DWORD): DWORD {
    return Clusapi.Load('OnlineClusterGroupEx')(hGroup, hDestinationNode, dwOnlineFlags, lpInBuffer, cbInBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-onlineclusterresource
  public static OnlineClusterResource(hResource: HRESOURCE): DWORD {
    return Clusapi.Load('OnlineClusterResource')(hResource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-onlineclusterresourceex
  public static OnlineClusterResourceEx(hResource: HRESOURCE, dwOnlineFlags: DWORD, lpInBuffer: OPTIONAL<PBYTE>, cbInBufferSize: DWORD): DWORD {
    return Clusapi.Load('OnlineClusterResourceEx')(hResource, dwOnlineFlags, lpInBuffer, cbInBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-opencluster
  public static OpenCluster(lpszClusterName: OPTIONAL<LPCWSTR>): HCLUSTER {
    return Clusapi.Load('OpenCluster')(lpszClusterName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-openclusterex
  public static OpenClusterEx(lpszClusterName: OPTIONAL<LPCWSTR>, DesiredAccess: DWORD, GrantedAccess_out: OPTIONAL<LPDWORD>): HCLUSTER {
    return Clusapi.Load('OpenClusterEx')(lpszClusterName, DesiredAccess, GrantedAccess_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-openclustergroup
  public static OpenClusterGroup(hCluster: HCLUSTER, lpszGroupName: LPCWSTR): HGROUP {
    return Clusapi.Load('OpenClusterGroup')(hCluster, lpszGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-openclustergroupex
  public static OpenClusterGroupEx(hCluster: HCLUSTER, lpszGroupName: OPTIONAL<LPCWSTR>, dwDesiredAccess: DWORD, lpdwGrantedAccess_out: OPTIONAL<LPDWORD>): HGROUP {
    return Clusapi.Load('OpenClusterGroupEx')(hCluster, lpszGroupName, dwDesiredAccess, lpdwGrantedAccess_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-openclustergroupset
  public static OpenClusterGroupSet(hCluster: HCLUSTER, lpszGroupSetName: LPCWSTR): HGROUPSET {
    return Clusapi.Load('OpenClusterGroupSet')(hCluster, lpszGroupSetName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-openclusternetinterface
  public static OpenClusterNetInterface(hCluster: HCLUSTER, lpszInterfaceName: LPCWSTR): HNETINTERFACE {
    return Clusapi.Load('OpenClusterNetInterface')(hCluster, lpszInterfaceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-openclusternetinterfaceex
  public static OpenClusterNetInterfaceEx(hCluster: HCLUSTER, lpszInterfaceName: OPTIONAL<LPCWSTR>, dwDesiredAccess: DWORD, lpdwGrantedAccess_out: OPTIONAL<LPDWORD>): HNETINTERFACE {
    return Clusapi.Load('OpenClusterNetInterfaceEx')(hCluster, lpszInterfaceName, dwDesiredAccess, lpdwGrantedAccess_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-openclusternetwork
  public static OpenClusterNetwork(hCluster: HCLUSTER, lpszNetworkName: LPCWSTR): HNETWORK {
    return Clusapi.Load('OpenClusterNetwork')(hCluster, lpszNetworkName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-openclusternetworkex
  public static OpenClusterNetworkEx(hCluster: HCLUSTER, lpszNetworkName: OPTIONAL<LPCWSTR>, dwDesiredAccess: DWORD, lpdwGrantedAccess_out: OPTIONAL<LPDWORD>): HNETWORK {
    return Clusapi.Load('OpenClusterNetworkEx')(hCluster, lpszNetworkName, dwDesiredAccess, lpdwGrantedAccess_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-openclusternode
  public static OpenClusterNode(hCluster: HCLUSTER, lpszNodeName: LPCWSTR): HNODE {
    return Clusapi.Load('OpenClusterNode')(hCluster, lpszNodeName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-openclusternodeex
  public static OpenClusterNodeEx(hCluster: HCLUSTER, lpszNodeName: OPTIONAL<LPCWSTR>, dwDesiredAccess: DWORD, lpdwGrantedAccess_out: OPTIONAL<LPDWORD>): HNODE {
    return Clusapi.Load('OpenClusterNodeEx')(hCluster, lpszNodeName, dwDesiredAccess, lpdwGrantedAccess_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-openclusterresource
  public static OpenClusterResource(hCluster: HCLUSTER, lpszResourceName: LPCWSTR): HRESOURCE {
    return Clusapi.Load('OpenClusterResource')(hCluster, lpszResourceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-openclusterresourceex
  public static OpenClusterResourceEx(hCluster: HCLUSTER, lpszResourceName: OPTIONAL<LPCWSTR>, dwDesiredAccess: DWORD, lpdwGrantedAccess_out: OPTIONAL<LPDWORD>): HRESOURCE {
    return Clusapi.Load('OpenClusterResourceEx')(hCluster, lpszResourceName, dwDesiredAccess, lpdwGrantedAccess_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-pauseclusternode
  public static PauseClusterNode(hNode: HNODE): DWORD {
    return Clusapi.Load('PauseClusterNode')(hNode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-pauseclusternodeex
  public static PauseClusterNodeEx(hNode: HNODE, bDrainNode: BOOL, dwPauseFlags: DWORD, hNodeDrainTarget: OPTIONAL<HNODE>): DWORD {
    return Clusapi.Load('PauseClusterNodeEx')(hNode, bDrainNode, dwPauseFlags, hNodeDrainTarget);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-registerclusternotify
  public static RegisterClusterNotify(hChange: HCHANGE, dwFilterType: DWORD, hObject: HANDLE, dwNotifyKey: DWORD_PTR): DWORD {
    return Clusapi.Load('RegisterClusterNotify')(hChange, dwFilterType, hObject, dwNotifyKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-registerclusternotifyv2
  public static RegisterClusterNotifyV2(hChange: HCHANGE, Filter: PNOTIFY_FILTER_AND_TYPE, hObject: HANDLE, dwNotifyKey: DWORD_PTR): DWORD {
    return Clusapi.Load('RegisterClusterNotifyV2')(hChange, Filter, hObject, dwNotifyKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-registerclusterresourcetypenotifyv2
  public static RegisterClusterResourceTypeNotifyV2(hChange: HCHANGE, hCluster: HCLUSTER, Flags: LONGLONG, resTypeName: LPCWSTR, dwNotifyKey: DWORD_PTR): DWORD {
    return Clusapi.Load('RegisterClusterResourceTypeNotifyV2')(hChange, hCluster, Flags, resTypeName, dwNotifyKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-removeclustergroupdependency
  public static RemoveClusterGroupDependency(hGroup: HGROUP, hDependsOn: HGROUP): DWORD {
    return Clusapi.Load('RemoveClusterGroupDependency')(hGroup, hDependsOn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-removeclustergroupsetdependency
  public static RemoveClusterGroupSetDependency(hGroupSet: HGROUPSET, hDependsOn: HGROUPSET): DWORD {
    return Clusapi.Load('RemoveClusterGroupSetDependency')(hGroupSet, hDependsOn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-removeclustergrouptogroupsetdependency
  public static RemoveClusterGroupToGroupSetDependency(hGroup: HGROUP, hDependsOn: HGROUPSET): DWORD {
    return Clusapi.Load('RemoveClusterGroupToGroupSetDependency')(hGroup, hDependsOn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-removeclusterresourcedependency
  public static RemoveClusterResourceDependency(hResource: HRESOURCE, hDependsOn: HRESOURCE): DWORD {
    return Clusapi.Load('RemoveClusterResourceDependency')(hResource, hDependsOn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-removeclusterresourcenode
  public static RemoveClusterResourceNode(hResource: HRESOURCE, hNode: HNODE): DWORD {
    return Clusapi.Load('RemoveClusterResourceNode')(hResource, hNode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-removeresourcefromclustersharedvolumes
  public static RemoveResourceFromClusterSharedVolumes(hResource: HRESOURCE): DWORD {
    return Clusapi.Load('RemoveResourceFromClusterSharedVolumes')(hResource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-restartclusterresource
  public static RestartClusterResource(hResource: HRESOURCE, dwFlags: DWORD): DWORD {
    return Clusapi.Load('RestartClusterResource')(hResource, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-restoreclusterdatabase
  public static RestoreClusterDatabase(lpszPathName: LPCWSTR, bForce: BOOL, lpszQuorumDriveLetter: OPTIONAL<LPCWSTR>): DWORD {
    return Clusapi.Load('RestoreClusterDatabase')(lpszPathName, bForce, lpszQuorumDriveLetter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-resumeclusternode
  public static ResumeClusterNode(hNode: HNODE): DWORD {
    return Clusapi.Load('ResumeClusterNode')(hNode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-resumeclusternodeex
  public static ResumeClusterNodeEx(hNode: HNODE, eResumeFailbackType: CLUSTER_NODE_RESUME_FAILBACK_TYPE, dwResumeFlagsReserved: DWORD): DWORD {
    return Clusapi.Load('ResumeClusterNodeEx')(hNode, eResumeFailbackType, dwResumeFlagsReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-setclustergroupname
  public static SetClusterGroupName(hGroup: HGROUP, lpszGroupName: LPCWSTR): DWORD {
    return Clusapi.Load('SetClusterGroupName')(hGroup, lpszGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-setclustergroupnodelist
  public static SetClusterGroupNodeList(hGroup: HGROUP, NodeCount: DWORD, NodeList: OPTIONAL<PHNODE>): DWORD {
    return Clusapi.Load('SetClusterGroupNodeList')(hGroup, NodeCount, NodeList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-setclustergroupsetdependencyexpression
  public static SetClusterGroupSetDependencyExpression(hGroupSet: HGROUPSET, lpszDependencyExprssion: LPCWSTR): DWORD {
    return Clusapi.Load('SetClusterGroupSetDependencyExpression')(hGroupSet, lpszDependencyExprssion);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-setclustername
  public static SetClusterName(hCluster: HCLUSTER, lpszNewClusterName: LPCWSTR): DWORD {
    return Clusapi.Load('SetClusterName')(hCluster, lpszNewClusterName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-setclusternetworkname
  public static SetClusterNetworkName(hNetwork: HNETWORK, lpszName: LPCWSTR): DWORD {
    return Clusapi.Load('SetClusterNetworkName')(hNetwork, lpszName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-setclusternetworkpriorityorder
  public static SetClusterNetworkPriorityOrder(hCluster: HCLUSTER, NetworkCount: DWORD, NetworkList: PHNETWORK): DWORD {
    return Clusapi.Load('SetClusterNetworkPriorityOrder')(hCluster, NetworkCount, NetworkList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-setclusterquorumresource
  public static SetClusterQuorumResource(hResource: HRESOURCE, lpszDeviceName: OPTIONAL<LPCWSTR>, dwMaxQuoLogSize: DWORD): DWORD {
    return Clusapi.Load('SetClusterQuorumResource')(hResource, lpszDeviceName, dwMaxQuoLogSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-setclusterresourcedependencyexpression
  public static SetClusterResourceDependencyExpression(hResource: HRESOURCE, lpszDependencyExpression: LPCWSTR): DWORD {
    return Clusapi.Load('SetClusterResourceDependencyExpression')(hResource, lpszDependencyExpression);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-setclusterresourcename
  public static SetClusterResourceName(hResource: HRESOURCE, lpszResourceName: LPCWSTR): DWORD {
    return Clusapi.Load('SetClusterResourceName')(hResource, lpszResourceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-setclusterserviceaccountpassword
  public static SetClusterServiceAccountPassword(lpszClusterName: LPCWSTR, lpszNewPassword: LPCWSTR, dwFlags: DWORD, lpReturnStatusBuffer_out: OPTIONAL<PCLUSTER_SET_PASSWORD_STATUS>, lpcbReturnStatusBufferSize_in_out: LPDWORD): DWORD {
    return Clusapi.Load('SetClusterServiceAccountPassword')(lpszClusterName, lpszNewPassword, dwFlags, lpReturnStatusBuffer_out, lpcbReturnStatusBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clusapi/nf-clusapi-setgroupdependencyexpression
  public static SetGroupDependencyExpression(hGroup: HGROUP, lpszDependencyExpression: LPCWSTR): DWORD {
    return Clusapi.Load('SetGroupDependencyExpression')(hGroup, lpszDependencyExpression);
  }
}

export default Clusapi;
