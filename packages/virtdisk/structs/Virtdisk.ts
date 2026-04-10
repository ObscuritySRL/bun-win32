import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  DWORD,
  HANDLE,
  LPCVOID,
  LPCWSTR,
  LPOVERLAPPED,
  LPWSTR,
  NULL,
  PAPPLY_SNAPSHOT_VHDSET_PARAMETERS,
  PATTACH_VIRTUAL_DISK_PARAMETERS,
  PCOMPACT_VIRTUAL_DISK_PARAMETERS,
  PCREATE_VIRTUAL_DISK_PARAMETERS,
  PDELETE_SNAPSHOT_VHDSET_PARAMETERS,
  PEXPAND_VIRTUAL_DISK_PARAMETERS,
  PFORK_VIRTUAL_DISK_PARAMETERS,
  PGET_VIRTUAL_DISK_INFO,
  PGUID,
  PHANDLE,
  PMERGE_VIRTUAL_DISK_PARAMETERS,
  PMIRROR_VIRTUAL_DISK_PARAMETERS,
  PMODIFY_VHDSET_PARAMETERS,
  POPEN_VIRTUAL_DISK_PARAMETERS,
  PQUERY_CHANGES_VIRTUAL_DISK_RANGE,
  PRAW_SCSI_VIRTUAL_DISK_PARAMETERS,
  PRAW_SCSI_VIRTUAL_DISK_RESPONSE,
  PRESIZE_VIRTUAL_DISK_PARAMETERS,
  PSECURITY_DESCRIPTOR,
  PSET_VIRTUAL_DISK_INFO,
  PSTORAGE_DEPENDENCY_INFO,
  PTAKE_SNAPSHOT_VHDSET_PARAMETERS,
  PULONG,
  PULONG64,
  PVIRTUAL_DISK_PROGRESS,
  PVIRTUAL_STORAGE_TYPE,
  PVOID,
  ULONG,
  ULONG64,
} from '../types/Virtdisk';

/**
 * Thin, lazy-loaded FFI bindings for `virtdisk.dll`.
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
 * import Virtdisk from './structs/Virtdisk';
 *
 * // Lazy: bind on first call
 * const result = Virtdisk.OpenVirtualDisk(storageType.ptr!, path.ptr!, 0, 0, null, handle.ptr!);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Virtdisk.Preload(['OpenVirtualDisk', 'AttachVirtualDisk']);
 * ```
 */
class Virtdisk extends Win32 {
  protected static override name = 'virtdisk.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    AddVirtualDiskParent: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ApplySnapshotVhdSet: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    AttachVirtualDisk: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    BreakMirrorVirtualDisk: { args: [FFIType.u64], returns: FFIType.u32 },
    CompactVirtualDisk: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CompleteForkVirtualDisk: { args: [FFIType.u64], returns: FFIType.u32 },
    CreateVirtualDisk: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DeleteSnapshotVhdSet: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DeleteVirtualDiskMetadata: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    DetachVirtualDisk: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    EnumerateVirtualDiskMetadata: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ExpandVirtualDisk: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ForkVirtualDisk: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetAllAttachedVirtualDiskPhysicalPaths: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetStorageDependencyInformation: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetVirtualDiskInformation: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetVirtualDiskMetadata: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetVirtualDiskOperationProgress: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetVirtualDiskPhysicalPath: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MergeVirtualDisk: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MirrorVirtualDisk: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ModifyVhdSet: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    OpenVirtualDisk: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    QueryChangesVirtualDisk: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RawSCSIVirtualDisk: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ResizeVirtualDisk: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetVirtualDiskInformation: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    SetVirtualDiskMetadata: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    TakeSnapshotVhdSet: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-addvirtualdiskparent
  public static AddVirtualDiskParent(VirtualDiskHandle: HANDLE, ParentPath: LPCWSTR): DWORD {
    return Virtdisk.Load('AddVirtualDiskParent')(VirtualDiskHandle, ParentPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-applysnapshotvhdset
  public static ApplySnapshotVhdSet(VirtualDiskHandle: HANDLE, Parameters: PAPPLY_SNAPSHOT_VHDSET_PARAMETERS, Flags: DWORD): DWORD {
    return Virtdisk.Load('ApplySnapshotVhdSet')(VirtualDiskHandle, Parameters, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-attachvirtualdisk
  public static AttachVirtualDisk(VirtualDiskHandle: HANDLE, SecurityDescriptor: PSECURITY_DESCRIPTOR | NULL, Flags: DWORD, ProviderSpecificFlags: ULONG, Parameters: PATTACH_VIRTUAL_DISK_PARAMETERS | NULL, Overlapped: LPOVERLAPPED | NULL): DWORD {
    return Virtdisk.Load('AttachVirtualDisk')(VirtualDiskHandle, SecurityDescriptor, Flags, ProviderSpecificFlags, Parameters, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-breakmirrorvirtualdisk
  public static BreakMirrorVirtualDisk(VirtualDiskHandle: HANDLE): DWORD {
    return Virtdisk.Load('BreakMirrorVirtualDisk')(VirtualDiskHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-compactvirtualdisk
  public static CompactVirtualDisk(VirtualDiskHandle: HANDLE, Flags: DWORD, Parameters: PCOMPACT_VIRTUAL_DISK_PARAMETERS | NULL, Overlapped: LPOVERLAPPED | NULL): DWORD {
    return Virtdisk.Load('CompactVirtualDisk')(VirtualDiskHandle, Flags, Parameters, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-completeforkvirtualdisk
  public static CompleteForkVirtualDisk(VirtualDiskHandle: HANDLE): DWORD {
    return Virtdisk.Load('CompleteForkVirtualDisk')(VirtualDiskHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-createvirtualdisk
  public static CreateVirtualDisk(VirtualStorageType: PVIRTUAL_STORAGE_TYPE, Path: LPCWSTR, VirtualDiskAccessMask: DWORD, SecurityDescriptor: PSECURITY_DESCRIPTOR | NULL, Flags: DWORD, ProviderSpecificFlags: ULONG, Parameters: PCREATE_VIRTUAL_DISK_PARAMETERS, Overlapped: LPOVERLAPPED | NULL, Handle: PHANDLE): DWORD {
    return Virtdisk.Load('CreateVirtualDisk')(VirtualStorageType, Path, VirtualDiskAccessMask, SecurityDescriptor, Flags, ProviderSpecificFlags, Parameters, Overlapped, Handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-deletesnapshotvhdset
  public static DeleteSnapshotVhdSet(VirtualDiskHandle: HANDLE, Parameters: PDELETE_SNAPSHOT_VHDSET_PARAMETERS, Flags: DWORD): DWORD {
    return Virtdisk.Load('DeleteSnapshotVhdSet')(VirtualDiskHandle, Parameters, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-deletevirtualdiskmetadata
  public static DeleteVirtualDiskMetadata(VirtualDiskHandle: HANDLE, Item: PGUID): DWORD {
    return Virtdisk.Load('DeleteVirtualDiskMetadata')(VirtualDiskHandle, Item);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-detachvirtualdisk
  public static DetachVirtualDisk(VirtualDiskHandle: HANDLE, Flags: DWORD, ProviderSpecificFlags: ULONG): DWORD {
    return Virtdisk.Load('DetachVirtualDisk')(VirtualDiskHandle, Flags, ProviderSpecificFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-enumeratevirtualdiskmetadata
  public static EnumerateVirtualDiskMetadata(VirtualDiskHandle: HANDLE, NumberOfItems: PULONG, Items: PGUID): DWORD {
    return Virtdisk.Load('EnumerateVirtualDiskMetadata')(VirtualDiskHandle, NumberOfItems, Items);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-expandvirtualdisk
  public static ExpandVirtualDisk(VirtualDiskHandle: HANDLE, Flags: DWORD, Parameters: PEXPAND_VIRTUAL_DISK_PARAMETERS, Overlapped: LPOVERLAPPED | NULL): DWORD {
    return Virtdisk.Load('ExpandVirtualDisk')(VirtualDiskHandle, Flags, Parameters, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-forkvirtualdisk
  public static ForkVirtualDisk(VirtualDiskHandle: HANDLE, Flags: DWORD, Parameters: PFORK_VIRTUAL_DISK_PARAMETERS, Overlapped: LPOVERLAPPED): DWORD {
    return Virtdisk.Load('ForkVirtualDisk')(VirtualDiskHandle, Flags, Parameters, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-getallattachedvirtualdiskphysicalpaths
  public static GetAllAttachedVirtualDiskPhysicalPaths(PathsBufferSizeInBytes: PULONG, PathsBuffer: LPWSTR): DWORD {
    return Virtdisk.Load('GetAllAttachedVirtualDiskPhysicalPaths')(PathsBufferSizeInBytes, PathsBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-getstoragedependencyinformation
  public static GetStorageDependencyInformation(ObjectHandle: HANDLE, Flags: DWORD, StorageDependencyInfoSize: ULONG, StorageDependencyInfo: PSTORAGE_DEPENDENCY_INFO, SizeUsed: PULONG | NULL): DWORD {
    return Virtdisk.Load('GetStorageDependencyInformation')(ObjectHandle, Flags, StorageDependencyInfoSize, StorageDependencyInfo, SizeUsed);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-getvirtualdiskinformation
  public static GetVirtualDiskInformation(VirtualDiskHandle: HANDLE, VirtualDiskInfoSize: PULONG, VirtualDiskInfo: PGET_VIRTUAL_DISK_INFO, SizeUsed: PULONG | NULL): DWORD {
    return Virtdisk.Load('GetVirtualDiskInformation')(VirtualDiskHandle, VirtualDiskInfoSize, VirtualDiskInfo, SizeUsed);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-getvirtualdiskmetadata
  public static GetVirtualDiskMetadata(VirtualDiskHandle: HANDLE, Item: PGUID, MetaDataSize: PULONG, MetaData: PVOID): DWORD {
    return Virtdisk.Load('GetVirtualDiskMetadata')(VirtualDiskHandle, Item, MetaDataSize, MetaData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-getvirtualdiskoperationprogress
  public static GetVirtualDiskOperationProgress(VirtualDiskHandle: HANDLE, Overlapped: LPOVERLAPPED, Progress: PVIRTUAL_DISK_PROGRESS): DWORD {
    return Virtdisk.Load('GetVirtualDiskOperationProgress')(VirtualDiskHandle, Overlapped, Progress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-getvirtualdiskphysicalpath
  public static GetVirtualDiskPhysicalPath(VirtualDiskHandle: HANDLE, DiskPathSizeInBytes: PULONG, DiskPath: LPWSTR): DWORD {
    return Virtdisk.Load('GetVirtualDiskPhysicalPath')(VirtualDiskHandle, DiskPathSizeInBytes, DiskPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-mergevirtualdisk
  public static MergeVirtualDisk(VirtualDiskHandle: HANDLE, Flags: DWORD, Parameters: PMERGE_VIRTUAL_DISK_PARAMETERS, Overlapped: LPOVERLAPPED | NULL): DWORD {
    return Virtdisk.Load('MergeVirtualDisk')(VirtualDiskHandle, Flags, Parameters, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-mirrorvirtualdisk
  public static MirrorVirtualDisk(VirtualDiskHandle: HANDLE, Flags: DWORD, Parameters: PMIRROR_VIRTUAL_DISK_PARAMETERS, Overlapped: LPOVERLAPPED): DWORD {
    return Virtdisk.Load('MirrorVirtualDisk')(VirtualDiskHandle, Flags, Parameters, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-modifyvhdset
  public static ModifyVhdSet(VirtualDiskHandle: HANDLE, Parameters: PMODIFY_VHDSET_PARAMETERS, Flags: DWORD): DWORD {
    return Virtdisk.Load('ModifyVhdSet')(VirtualDiskHandle, Parameters, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-openvirtualdisk
  public static OpenVirtualDisk(VirtualStorageType: PVIRTUAL_STORAGE_TYPE, Path: LPCWSTR, VirtualDiskAccessMask: DWORD, Flags: DWORD, Parameters: POPEN_VIRTUAL_DISK_PARAMETERS | NULL, Handle: PHANDLE): DWORD {
    return Virtdisk.Load('OpenVirtualDisk')(VirtualStorageType, Path, VirtualDiskAccessMask, Flags, Parameters, Handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-querychangesvirtualdisk
  public static QueryChangesVirtualDisk(VirtualDiskHandle: HANDLE, ChangeTrackingId: LPCWSTR, ByteOffset: ULONG64, ByteLength: ULONG64, Flags: DWORD, Ranges: PQUERY_CHANGES_VIRTUAL_DISK_RANGE, RangeCount: PULONG, ProcessedLength: PULONG64): DWORD {
    return Virtdisk.Load('QueryChangesVirtualDisk')(VirtualDiskHandle, ChangeTrackingId, ByteOffset, ByteLength, Flags, Ranges, RangeCount, ProcessedLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-rawscsivirtualdisk
  public static RawSCSIVirtualDisk(VirtualDiskHandle: HANDLE, Parameters: PRAW_SCSI_VIRTUAL_DISK_PARAMETERS, Flags: DWORD, Response: PRAW_SCSI_VIRTUAL_DISK_RESPONSE): DWORD {
    return Virtdisk.Load('RawSCSIVirtualDisk')(VirtualDiskHandle, Parameters, Flags, Response);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-resizevirtualdisk
  public static ResizeVirtualDisk(VirtualDiskHandle: HANDLE, Flags: DWORD, Parameters: PRESIZE_VIRTUAL_DISK_PARAMETERS, Overlapped: LPOVERLAPPED | NULL): DWORD {
    return Virtdisk.Load('ResizeVirtualDisk')(VirtualDiskHandle, Flags, Parameters, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-setvirtualdiskinformation
  public static SetVirtualDiskInformation(VirtualDiskHandle: HANDLE, VirtualDiskInfo: PSET_VIRTUAL_DISK_INFO): DWORD {
    return Virtdisk.Load('SetVirtualDiskInformation')(VirtualDiskHandle, VirtualDiskInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-setvirtualdiskmetadata
  public static SetVirtualDiskMetadata(VirtualDiskHandle: HANDLE, Item: PGUID, MetaDataSize: ULONG, MetaData: LPCVOID): DWORD {
    return Virtdisk.Load('SetVirtualDiskMetadata')(VirtualDiskHandle, Item, MetaDataSize, MetaData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/virtdisk/nf-virtdisk-takesnapshotvhdset
  public static TakeSnapshotVhdSet(VirtualDiskHandle: HANDLE, Parameters: PTAKE_SNAPSHOT_VHDSET_PARAMETERS, Flags: DWORD): DWORD {
    return Virtdisk.Load('TakeSnapshotVhdSet')(VirtualDiskHandle, Parameters, Flags);
  }
}

export default Virtdisk;
