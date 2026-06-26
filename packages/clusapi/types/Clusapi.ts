import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, DWORD_PTR, HANDLE, LONG, LPBYTE, LPCWSTR, LPDWORD, LPHANDLE, LPSECURITY_ATTRIBUTES, LPVOID, LPWSTR, NULL, Optional, PBYTE, PVOID } from '@bun-win32/core';

export enum CLUSTER_GROUP_STATE {
  ClusterGroupFailed = 2,
  ClusterGroupOffline = 1,
  ClusterGroupOnline = 0,
  ClusterGroupPartialOnline = 3,
  ClusterGroupPending = 4,
  ClusterGroupStateUnknown = -1,
}

export enum CLUSTER_NETINTERFACE_STATE {
  ClusterNetInterfaceFailed = 1,
  ClusterNetInterfaceStateUnknown = -1,
  ClusterNetInterfaceUnavailable = 0,
  ClusterNetInterfaceUnreachable = 2,
  ClusterNetInterfaceUp = 3,
}

export enum CLUSTER_NETWORK_STATE {
  ClusterNetworkDown = 1,
  ClusterNetworkPartitioned = 2,
  ClusterNetworkStateUnknown = -1,
  ClusterNetworkUnavailable = 0,
  ClusterNetworkUp = 3,
}

export enum CLUSTER_NODE_RESUME_FAILBACK_TYPE {
  ClusterNodeResumeFailbackTypeCount = 3,
  DoNotFailbackGroups = 0,
  FailbackGroupsImmediately = 1,
  FailbackGroupsPerPolicy = 2,
}

export enum CLUSTER_NODE_STATE {
  ClusterNodeDown = 2,
  ClusterNodeJoining = 4,
  ClusterNodePaused = 3,
  ClusterNodeStateUnknown = -1,
  ClusterNodeUp = 1,
}

export enum CLUSTER_REG_COMMAND {
  CLUSREG_COMMAND_NONE = 0,
  CLUSREG_CONDITION_EXISTS = 11,
  CLUSREG_CONDITION_IS_EQUAL = 13,
  CLUSREG_CONDITION_IS_GREATER_THAN = 15,
  CLUSREG_CONDITION_IS_LESS_THAN = 16,
  CLUSREG_CONDITION_IS_NOT_EQUAL = 14,
  CLUSREG_CONDITION_KEY_EXISTS = 17,
  CLUSREG_CONDITION_KEY_NOT_EXISTS = 18,
  CLUSREG_CONDITION_NOT_EXISTS = 12,
  CLUSREG_CONTROL_COMMAND = 10,
  CLUSREG_CREATE_KEY = 2,
  CLUSREG_DELETE_KEY = 3,
  CLUSREG_DELETE_VALUE = 4,
  CLUSREG_LAST_COMMAND = 19,
  CLUSREG_READ_ERROR = 9,
  CLUSREG_READ_KEY = 7,
  CLUSREG_READ_VALUE = 8,
  CLUSREG_SET_KEY_SECURITY = 5,
  CLUSREG_SET_VALUE = 1,
  CLUSREG_VALUE_DELETED = 6,
}

export enum CLUSTER_RESOURCE_STATE {
  ClusterResourceFailed = 4,
  ClusterResourceInherited = 0,
  ClusterResourceInitializing = 1,
  ClusterResourceOffline = 3,
  ClusterResourceOfflinePending = 130,
  ClusterResourceOnline = 2,
  ClusterResourceOnlinePending = 129,
  ClusterResourcePending = 128,
  ClusterResourceStateUnknown = -1,
}

export enum CLUSTER_SHARED_VOLUME_SNAPSHOT_STATE {
  ClusterSharedVolumeHWSnapshotCompleted = 2,
  ClusterSharedVolumePrepareForFreeze = 3,
  ClusterSharedVolumePrepareForHWSnapshot = 1,
  ClusterSharedVolumeSnapshotStateUnknown = 0,
}

export type HCHANGE = bigint;
export type HCLUSENUM = bigint;
export type HCLUSENUMEX = bigint;
export type HCLUSTER = bigint;
export type HGROUP = bigint;
export type HGROUPENUM = bigint;
export type HGROUPENUMEX = bigint;
export type HGROUPSET = bigint;
export type HGROUPSETENUM = bigint;
export type HKEY = bigint;
export type HNETINTERFACE = bigint;
export type HNETINTERFACEENUM = bigint;
export type HNETWORK = bigint;
export type HNETWORKENUM = bigint;
export type HNODE = bigint;
export type HNODEENUM = bigint;
export type HNODEENUMEX = bigint;
export type HREGBATCH = bigint;
export type HREGBATCHNOTIFICATION = bigint;
export type HREGBATCHPORT = bigint;
export type HREGREADBATCH = bigint;
export type HREGREADBATCHREPLY = bigint;
export type HRESENUM = bigint;
export type HRESENUMEX = bigint;
export type HRESOURCE = bigint;
export type HRESTYPEENUM = bigint;
export type LONGLONG = bigint;
export type LPCLUSTERVERSIONINFO = Pointer;
export type PBOOL = Pointer;
export type PCLUSTER_BATCH_COMMAND = Pointer;
export type PCLUSTER_CREATE_GROUP_INFO = Pointer;
export type PCLUSTER_ENUM_ITEM = Pointer;
export type PCLUSTER_GROUP_ENUM_ITEM = Pointer;
export type PCLUSTER_READ_BATCH_COMMAND = Pointer;
export type PCLUSTER_RESOURCE_ENUM_ITEM = Pointer;
export type PCLUSTER_SETUP_PROGRESS_CALLBACK = Pointer;
export type PCLUSTER_SET_PASSWORD_STATUS = Pointer;
export type PCLUSTER_UPGRADE_PROGRESS_CALLBACK = Pointer;
export type PCREATE_CLUSTER_CONFIG = Pointer;
export type PCREATE_CLUSTER_NAME_ACCOUNT = Pointer;
export type PDWORD_PTR = Pointer;
export type PFILETIME = Pointer;
export type PGUID = Pointer;
export type PHKEY = Pointer;
export type PHNETWORK = Pointer;
export type PHNODE = Pointer;
export type PHREGBATCH = Pointer;
export type PHREGBATCHNOTIFICATION = Pointer;
export type PHREGBATCHPORT = Pointer;
export type PHREGREADBATCH = Pointer;
export type PHREGREADBATCHREPLY = Pointer;
export type PHRESULT = Pointer;
export type PINT = Pointer;
export type PNOTIFY_FILTER_AND_TYPE = Pointer;
export type PSECURITY_DESCRIPTOR = Pointer;
export type REGSAM = number;
export type SECURITY_INFORMATION = number;
