import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BSTR, HRESULT, LPCWSTR, PBOOL, PLONG, PPIVSSBACKUPCOMPONENTS, PPIVSSEXAMINEWRITERMETADATA, PPVOID, PVSS_SNAPSHOT_PROP, REFCLSID, REFIID, VSS_PWSZ } from '../types/Vssapi';

/**
 * Thin, lazy-loaded FFI bindings for `vssapi.dll`.
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
 * import Vssapi from './structs/Vssapi';
 *
 * // Lazy: bind on first call
 * const result = Vssapi.IsVolumeSnapshotted(volume.ptr, present.ptr, capability.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Vssapi.Preload(['IsVolumeSnapshotted', 'VssFreeSnapshotProperties']);
 * ```
 */
class Vssapi extends Win32 {
  protected static override name = 'vssapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CreateVssBackupComponentsInternal: { args: [FFIType.ptr], returns: FFIType.i32 },
    CreateVssExamineWriterMetadataInternal: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IsVolumeSnapshotted: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IsVolumeSnapshottedInternal: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ShouldBlockRevert: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ShouldBlockRevertInternal: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VssFreeSnapshotProperties: { args: [FFIType.ptr], returns: FFIType.void },
    VssFreeSnapshotPropertiesInternal: { args: [FFIType.ptr], returns: FFIType.void },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/vsbackup/nf-vsbackup-createvssbackupcomponents
  public static CreateVssBackupComponentsInternal(ppBackup_out: PPIVSSBACKUPCOMPONENTS): HRESULT {
    return Vssapi.Load('CreateVssBackupComponentsInternal')(ppBackup_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vsbackup/nf-vsbackup-createvssexaminewritermetadata
  public static CreateVssExamineWriterMetadataInternal(bstrXML: BSTR, ppMetadata_out: PPIVSSEXAMINEWRITERMETADATA): HRESULT {
    return Vssapi.Load('CreateVssExamineWriterMetadataInternal')(bstrXML, ppMetadata_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return Vssapi.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv_out: PPVOID): HRESULT {
    return Vssapi.Load('DllGetClassObject')(rclsid, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vsbackup/nf-vsbackup-isvolumesnapshotted
  public static IsVolumeSnapshotted(pwszVolumeName: VSS_PWSZ, pbSnapshotsPresent_out: PBOOL, plSnapshotCapability_out: PLONG): HRESULT {
    return Vssapi.Load('IsVolumeSnapshotted')(pwszVolumeName, pbSnapshotsPresent_out, plSnapshotCapability_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vsbackup/nf-vsbackup-isvolumesnapshotted
  public static IsVolumeSnapshottedInternal(pwszVolumeName: VSS_PWSZ, pbSnapshotsPresent_out: PBOOL, plSnapshotCapability_out: PLONG): HRESULT {
    return Vssapi.Load('IsVolumeSnapshottedInternal')(pwszVolumeName, pbSnapshotsPresent_out, plSnapshotCapability_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vsbackup/nf-vsbackup-shouldblockrevert
  public static ShouldBlockRevert(wszVolumeName: LPCWSTR, pbBlock_out: PBOOL): HRESULT {
    return Vssapi.Load('ShouldBlockRevert')(wszVolumeName, pbBlock_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vsbackup/nf-vsbackup-shouldblockrevert
  public static ShouldBlockRevertInternal(wszVolumeName: LPCWSTR, pbBlock_out: PBOOL): HRESULT {
    return Vssapi.Load('ShouldBlockRevertInternal')(wszVolumeName, pbBlock_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vsbackup/nf-vsbackup-vssfreesnapshotproperties
  public static VssFreeSnapshotProperties(pProp: PVSS_SNAPSHOT_PROP): void {
    return Vssapi.Load('VssFreeSnapshotProperties')(pProp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vsbackup/nf-vsbackup-vssfreesnapshotproperties
  public static VssFreeSnapshotPropertiesInternal(pProp: PVSS_SNAPSHOT_PROP): void {
    return Vssapi.Load('VssFreeSnapshotPropertiesInternal')(pProp);
  }
}

export default Vssapi;
