import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  HKEY,
  HRESULT,
  INSTALLMESSAGE,
  INSTALLSTATE,
  INSTALLTYPE,
  INSTALLUI_HANDLERA,
  INSTALLUI_HANDLERW,
  INSTALLUI_HANDLER_RECORD,
  INSTALLUILEVEL,
  INT,
  LANGID,
  LPCSTR,
  LPCWSTR,
  LPDWORD,
  LPHANDLE,
  LPINT,
  LPSTR,
  LPVOID,
  LPWORD,
  LPWSTR,
  MSICOLINFO,
  MSICONDITION,
  MSICOSTTREE,
  MSIDBSTATE,
  MSIDBERROR,
  MSIHANDLE,
  MSIINSTALLCONTEXT,
  MSIMODIFY,
  MSIRUNMODE,
  NULLABLE,
  OPTIONAL,
  PBYTE,
  PFILETIME,
  PHKEY,
  PHWND,
  PINSTALLSTATE,
  PINSTALLUI_HANDLER_RECORD,
  PINT,
  PMSIFILEHASHINFO,
  PMSIHANDLE,
  PMSIPATCHSEQUENCEINFOA,
  PMSIPATCHSEQUENCEINFOW,
  PPMSIHANDLE,
  PPCCERT_CONTEXT,
  PUINT,
  UINT,
  USERINFOSTATE,
} from '../types/Msi';

/**
 * Thin, lazy-loaded FFI bindings for `msi.dll`.
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
 * import Msi from './structs/Msi';
 *
 * // Lazy: bind on first call
 * const state = Msi.MsiQueryProductStateW(productCode.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Msi.Preload(['MsiEnumProductsW', 'MsiGetProductInfoW']);
 * ```
 */
class Msi extends Win32 {
  protected static override name = 'msi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    MsiAdvertiseProductA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u16], returns: FFIType.u32 },
    MsiAdvertiseProductExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u16, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    MsiAdvertiseProductExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u16, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    MsiAdvertiseProductW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u16], returns: FFIType.u32 },
    MsiAdvertiseScriptA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiAdvertiseScriptW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiApplyMultiplePatchesA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiApplyMultiplePatchesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiApplyPatchA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    MsiApplyPatchW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    MsiBeginTransactionA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiBeginTransactionW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiCloseAllHandles: { args: [], returns: FFIType.u32 },
    MsiCloseHandle: { args: [FFIType.u32], returns: FFIType.u32 },
    MsiCollectUserInfoA: { args: [FFIType.ptr], returns: FFIType.u32 },
    MsiCollectUserInfoW: { args: [FFIType.ptr], returns: FFIType.u32 },
    MsiConfigureFeatureA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiConfigureFeatureFromDescriptorA: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiConfigureFeatureFromDescriptorW: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiConfigureFeatureW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiConfigureProductA: { args: [FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.u32 },
    MsiConfigureProductExA: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    MsiConfigureProductExW: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    MsiConfigureProductW: { args: [FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.u32 },
    MsiCreateAndVerifyInstallerDirectory: { args: [FFIType.u32], returns: FFIType.u32 },
    MsiCreateRecord: { args: [FFIType.u32], returns: FFIType.u32 },
    MsiCreateTransformSummaryInfoA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.u32 },
    MsiCreateTransformSummaryInfoW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.u32 },
    MsiDatabaseApplyTransformA: { args: [FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiDatabaseApplyTransformW: { args: [FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiDatabaseCommit: { args: [FFIType.u32], returns: FFIType.u32 },
    MsiDatabaseExportA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiDatabaseExportW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiDatabaseGenerateTransformA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiDatabaseGenerateTransformW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiDatabaseGetPrimaryKeysA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiDatabaseGetPrimaryKeysW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiDatabaseImportA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiDatabaseImportW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiDatabaseIsTablePersistentA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MsiDatabaseIsTablePersistentW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MsiDatabaseMergeA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiDatabaseMergeW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiDatabaseOpenViewA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiDatabaseOpenViewW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiDecomposeDescriptorA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiDecomposeDescriptorW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiDetermineApplicablePatchesA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiDetermineApplicablePatchesW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiDeterminePatchSequenceA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiDeterminePatchSequenceW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiDoActionA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiDoActionW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiEnableLogA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiEnableLogW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiEnableUIPreview: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiEndTransaction: { args: [FFIType.u32], returns: FFIType.u32 },
    MsiEnumClientsA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumClientsExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumClientsExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumClientsW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumComponentCostsA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumComponentCostsW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumComponentQualifiersA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumComponentQualifiersW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumComponentsA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumComponentsExA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumComponentsExW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumComponentsW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumFeaturesA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumFeaturesW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumPatchesA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumPatchesExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumPatchesExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumPatchesW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumProductsA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumProductsExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumProductsExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumProductsW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumRelatedProductsA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiEnumRelatedProductsW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiEvaluateConditionA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MsiEvaluateConditionW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MsiExtractPatchXMLDataA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiExtractPatchXMLDataW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiFormatRecordA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiFormatRecordW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetActiveDatabase: { args: [FFIType.u32], returns: FFIType.u32 },
    MsiGetComponentPathA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiGetComponentPathExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiGetComponentPathExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiGetComponentPathW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiGetComponentStateA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetComponentStateW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetDatabaseState: { args: [FFIType.u32], returns: FFIType.i32 },
    MsiGetFeatureCostA: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    MsiGetFeatureCostW: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    MsiGetFeatureInfoA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetFeatureInfoW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetFeatureStateA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetFeatureStateW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetFeatureUsageA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetFeatureUsageW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetFeatureValidStatesA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetFeatureValidStatesW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetFileHashA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiGetFileHashW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiGetFileSignatureInformationA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiGetFileSignatureInformationW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiGetFileVersionA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetFileVersionW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetLanguage: { args: [FFIType.u32], returns: FFIType.u16 },
    MsiGetLastErrorRecord: { args: [], returns: FFIType.u32 },
    MsiGetMode: { args: [FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    MsiGetPatchFileListA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetPatchFileListW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetPatchInfoA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetPatchInfoExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetPatchInfoExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetPatchInfoW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetProductCodeA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetProductCodeFromPackageCodeA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetProductCodeFromPackageCodeW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetProductCodeW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetProductInfoA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetProductInfoExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetProductInfoExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetProductInfoFromScriptA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetProductInfoFromScriptW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetProductInfoW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetProductPropertyA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetProductPropertyW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetPropertyA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetPropertyW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetShortcutTargetA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetShortcutTargetW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetSourcePathA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetSourcePathW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetSummaryInformationA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiGetSummaryInformationW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiGetTargetPathA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetTargetPathW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiGetUserInfoA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiGetUserInfoW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiInstallMissingComponentA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiInstallMissingComponentW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiInstallMissingFileA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiInstallMissingFileW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiInstallProductA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiInstallProductW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiInvalidateFeatureCache: { args: [], returns: FFIType.void },
    MsiIsProductElevatedA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiIsProductElevatedW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiJoinTransaction: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiLocateComponentA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiLocateComponentW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiNotifySidChangeA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiNotifySidChangeW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiOpenDatabaseA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiOpenDatabaseW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiOpenPackageA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiOpenPackageExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiOpenPackageExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiOpenPackageW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiOpenProductA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiOpenProductW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiPreviewBillboardA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiPreviewBillboardW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiPreviewDialogA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiPreviewDialogW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiProcessAdvertiseScriptA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.u32 },
    MsiProcessAdvertiseScriptW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.u32 },
    MsiProcessMessage: { args: [FFIType.u32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    MsiProvideAssemblyA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiProvideAssemblyW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiProvideComponentA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiProvideComponentFromDescriptorA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiProvideComponentFromDescriptorW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiProvideComponentW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiProvideQualifiedComponentA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiProvideQualifiedComponentExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiProvideQualifiedComponentExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiProvideQualifiedComponentW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiQueryComponentStateA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiQueryComponentStateW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiQueryFeatureStateA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiQueryFeatureStateExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiQueryFeatureStateExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiQueryFeatureStateFromDescriptorA: { args: [FFIType.ptr], returns: FFIType.i32 },
    MsiQueryFeatureStateFromDescriptorW: { args: [FFIType.ptr], returns: FFIType.i32 },
    MsiQueryFeatureStateW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiQueryProductStateA: { args: [FFIType.ptr], returns: FFIType.i32 },
    MsiQueryProductStateW: { args: [FFIType.ptr], returns: FFIType.i32 },
    MsiRecordClearData: { args: [FFIType.u32], returns: FFIType.u32 },
    MsiRecordDataSize: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    MsiRecordGetFieldCount: { args: [FFIType.u32], returns: FFIType.u32 },
    MsiRecordGetInteger: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    MsiRecordGetStringA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiRecordGetStringW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiRecordIsNull: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    MsiRecordReadStream: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiRecordSetInteger: { args: [FFIType.u32, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    MsiRecordSetStreamA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiRecordSetStreamW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiRecordSetStringA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiRecordSetStringW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiReinstallFeatureA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiReinstallFeatureFromDescriptorA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiReinstallFeatureFromDescriptorW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiReinstallFeatureW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiReinstallProductA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiReinstallProductW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiRemovePatchesA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    MsiRemovePatchesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    MsiSequenceA: { args: [FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiSequenceW: { args: [FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiSetComponentStateA: { args: [FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiSetComponentStateW: { args: [FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiSetExternalUIA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    MsiSetExternalUIRecord: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSetExternalUIW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    MsiSetFeatureAttributesA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiSetFeatureAttributesW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiSetFeatureStateA: { args: [FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiSetFeatureStateW: { args: [FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    MsiSetInstallLevel: { args: [FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    MsiSetInternalUI: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    MsiSetMode: { args: [FFIType.u32, FFIType.i32, FFIType.i32], returns: FFIType.u32 },
    MsiSetPropertyA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSetPropertyW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSetTargetPathA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSetTargetPathW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSourceListAddMediaDiskA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSourceListAddMediaDiskW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSourceListAddSourceA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiSourceListAddSourceExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiSourceListAddSourceExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiSourceListAddSourceW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiSourceListClearAllA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiSourceListClearAllExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    MsiSourceListClearAllExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    MsiSourceListClearAllW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiSourceListClearMediaDiskA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    MsiSourceListClearMediaDiskW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    MsiSourceListClearSourceA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiSourceListClearSourceW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiSourceListEnumMediaDisksA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSourceListEnumMediaDisksW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSourceListEnumSourcesA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSourceListEnumSourcesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSourceListForceResolutionA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiSourceListForceResolutionExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    MsiSourceListForceResolutionExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    MsiSourceListForceResolutionW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    MsiSourceListGetInfoA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSourceListGetInfoW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSourceListSetInfoA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSourceListSetInfoW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSummaryInfoGetPropertyA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSummaryInfoGetPropertyCount: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiSummaryInfoGetPropertyW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSummaryInfoPersist: { args: [FFIType.u32], returns: FFIType.u32 },
    MsiSummaryInfoSetPropertyA: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiSummaryInfoSetPropertyW: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MsiUseFeatureA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiUseFeatureExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    MsiUseFeatureExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    MsiUseFeatureW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiVerifyDiskSpace: { args: [FFIType.u32], returns: FFIType.u32 },
    MsiVerifyPackageA: { args: [FFIType.ptr], returns: FFIType.u32 },
    MsiVerifyPackageW: { args: [FFIType.ptr], returns: FFIType.u32 },
    MsiViewClose: { args: [FFIType.u32], returns: FFIType.u32 },
    MsiViewExecute: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    MsiViewFetch: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    MsiViewGetColumnInfo: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    MsiViewGetErrorA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiViewGetErrorW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MsiViewModify: { args: [FFIType.u32, FFIType.i32, FFIType.u32], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiadvertiseproducta
  public static MsiAdvertiseProductA(szPackagePath: LPCSTR, szScriptfilePath: OPTIONAL<LPCSTR>, szTransforms: OPTIONAL<LPCSTR>, lgidLanguage: LANGID): UINT {
    return Msi.Load('MsiAdvertiseProductA')(szPackagePath, szScriptfilePath, szTransforms, lgidLanguage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiadvertiseproductexa
  public static MsiAdvertiseProductExA(szPackagePath: LPCSTR, szScriptfilePath: OPTIONAL<LPCSTR>, szTransforms: OPTIONAL<LPCSTR>, lgidLanguage: LANGID, dwPlatform: DWORD, dwOptions: DWORD): UINT {
    return Msi.Load('MsiAdvertiseProductExA')(szPackagePath, szScriptfilePath, szTransforms, lgidLanguage, dwPlatform, dwOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiadvertiseproductexw
  public static MsiAdvertiseProductExW(szPackagePath: LPCWSTR, szScriptfilePath: OPTIONAL<LPCWSTR>, szTransforms: OPTIONAL<LPCWSTR>, lgidLanguage: LANGID, dwPlatform: DWORD, dwOptions: DWORD): UINT {
    return Msi.Load('MsiAdvertiseProductExW')(szPackagePath, szScriptfilePath, szTransforms, lgidLanguage, dwPlatform, dwOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiadvertiseproductw
  public static MsiAdvertiseProductW(szPackagePath: LPCWSTR, szScriptfilePath: OPTIONAL<LPCWSTR>, szTransforms: OPTIONAL<LPCWSTR>, lgidLanguage: LANGID): UINT {
    return Msi.Load('MsiAdvertiseProductW')(szPackagePath, szScriptfilePath, szTransforms, lgidLanguage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiadvertisescripta
  public static MsiAdvertiseScriptA(szScriptFile: LPCSTR, dwFlags: DWORD, phRegData: OPTIONAL<PHKEY>, fRemoveItems: BOOL): UINT {
    return Msi.Load('MsiAdvertiseScriptA')(szScriptFile, dwFlags, phRegData, fRemoveItems);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiadvertisescriptw
  public static MsiAdvertiseScriptW(szScriptFile: LPCWSTR, dwFlags: DWORD, phRegData: OPTIONAL<PHKEY>, fRemoveItems: BOOL): UINT {
    return Msi.Load('MsiAdvertiseScriptW')(szScriptFile, dwFlags, phRegData, fRemoveItems);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiapplymultiplepatchesa
  public static MsiApplyMultiplePatchesA(szPatchPackages: LPCSTR, szProductCode: OPTIONAL<LPCSTR>, szPropertiesList: OPTIONAL<LPCSTR>): UINT {
    return Msi.Load('MsiApplyMultiplePatchesA')(szPatchPackages, szProductCode, szPropertiesList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiapplymultiplepatchesw
  public static MsiApplyMultiplePatchesW(szPatchPackages: LPCWSTR, szProductCode: OPTIONAL<LPCWSTR>, szPropertiesList: OPTIONAL<LPCWSTR>): UINT {
    return Msi.Load('MsiApplyMultiplePatchesW')(szPatchPackages, szProductCode, szPropertiesList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiapplypatcha
  public static MsiApplyPatchA(szPatchPackage: LPCSTR, szInstallPackage: OPTIONAL<LPCSTR>, eInstallType: INSTALLTYPE, szCommandLine: OPTIONAL<LPCSTR>): UINT {
    return Msi.Load('MsiApplyPatchA')(szPatchPackage, szInstallPackage, eInstallType, szCommandLine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiapplypatchw
  public static MsiApplyPatchW(szPatchPackage: LPCWSTR, szInstallPackage: OPTIONAL<LPCWSTR>, eInstallType: INSTALLTYPE, szCommandLine: OPTIONAL<LPCWSTR>): UINT {
    return Msi.Load('MsiApplyPatchW')(szPatchPackage, szInstallPackage, eInstallType, szCommandLine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msibegintransactiona
  public static MsiBeginTransactionA(szName: LPCSTR, dwTransactionAttributes: DWORD, hTransactionHandle_out: PMSIHANDLE, hChangeOfOwnerEvent_out: LPHANDLE): UINT {
    return Msi.Load('MsiBeginTransactionA')(szName, dwTransactionAttributes, hTransactionHandle_out, hChangeOfOwnerEvent_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msibegintransactionw
  public static MsiBeginTransactionW(szName: LPCWSTR, dwTransactionAttributes: DWORD, hTransactionHandle_out: PMSIHANDLE, hChangeOfOwnerEvent_out: LPHANDLE): UINT {
    return Msi.Load('MsiBeginTransactionW')(szName, dwTransactionAttributes, hTransactionHandle_out, hChangeOfOwnerEvent_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msicloseallhandles
  public static MsiCloseAllHandles(): UINT {
    return Msi.Load('MsiCloseAllHandles')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiclosehandle
  public static MsiCloseHandle(hAny: MSIHANDLE): UINT {
    return Msi.Load('MsiCloseHandle')(hAny);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msicollectuserinfoa
  public static MsiCollectUserInfoA(szProduct: LPCSTR): UINT {
    return Msi.Load('MsiCollectUserInfoA')(szProduct);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msicollectuserinfow
  public static MsiCollectUserInfoW(szProduct: LPCWSTR): UINT {
    return Msi.Load('MsiCollectUserInfoW')(szProduct);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiconfigurefeaturea
  public static MsiConfigureFeatureA(szProduct: LPCSTR, szFeature: LPCSTR, eInstallState: INSTALLSTATE): UINT {
    return Msi.Load('MsiConfigureFeatureA')(szProduct, szFeature, eInstallState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiconfigurefeaturefromdescriptora
  public static MsiConfigureFeatureFromDescriptorA(szDescriptor: LPCSTR, eInstallState: INSTALLSTATE): UINT {
    return Msi.Load('MsiConfigureFeatureFromDescriptorA')(szDescriptor, eInstallState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiconfigurefeaturefromdescriptorw
  public static MsiConfigureFeatureFromDescriptorW(szDescriptor: LPCWSTR, eInstallState: INSTALLSTATE): UINT {
    return Msi.Load('MsiConfigureFeatureFromDescriptorW')(szDescriptor, eInstallState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiconfigurefeaturew
  public static MsiConfigureFeatureW(szProduct: LPCWSTR, szFeature: LPCWSTR, eInstallState: INSTALLSTATE): UINT {
    return Msi.Load('MsiConfigureFeatureW')(szProduct, szFeature, eInstallState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiconfigureproducta
  public static MsiConfigureProductA(szProduct: LPCSTR, iInstallLevel: INT, eInstallState: INSTALLSTATE): UINT {
    return Msi.Load('MsiConfigureProductA')(szProduct, iInstallLevel, eInstallState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiconfigureproductexa
  public static MsiConfigureProductExA(szProduct: LPCSTR, iInstallLevel: INT, eInstallState: INSTALLSTATE, szCommandLine: OPTIONAL<LPCSTR>): UINT {
    return Msi.Load('MsiConfigureProductExA')(szProduct, iInstallLevel, eInstallState, szCommandLine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiconfigureproductexw
  public static MsiConfigureProductExW(szProduct: LPCWSTR, iInstallLevel: INT, eInstallState: INSTALLSTATE, szCommandLine: OPTIONAL<LPCWSTR>): UINT {
    return Msi.Load('MsiConfigureProductExW')(szProduct, iInstallLevel, eInstallState, szCommandLine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiconfigureproductw
  public static MsiConfigureProductW(szProduct: LPCWSTR, iInstallLevel: INT, eInstallState: INSTALLSTATE): UINT {
    return Msi.Load('MsiConfigureProductW')(szProduct, iInstallLevel, eInstallState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msicreateandverifyinstallerdirectory
  public static MsiCreateAndVerifyInstallerDirectory(dwReserved: DWORD): UINT {
    return Msi.Load('MsiCreateAndVerifyInstallerDirectory')(dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msicreaterecord
  public static MsiCreateRecord(cParams: UINT): MSIHANDLE {
    return Msi.Load('MsiCreateRecord')(cParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msicreatetransformsummaryinfoa
  public static MsiCreateTransformSummaryInfoA(hDatabase: MSIHANDLE, hDatabaseReference: MSIHANDLE, szTransformFile: LPCSTR, iErrorConditions: INT, iValidation: INT): UINT {
    return Msi.Load('MsiCreateTransformSummaryInfoA')(hDatabase, hDatabaseReference, szTransformFile, iErrorConditions, iValidation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msicreatetransformsummaryinfow
  public static MsiCreateTransformSummaryInfoW(hDatabase: MSIHANDLE, hDatabaseReference: MSIHANDLE, szTransformFile: LPCWSTR, iErrorConditions: INT, iValidation: INT): UINT {
    return Msi.Load('MsiCreateTransformSummaryInfoW')(hDatabase, hDatabaseReference, szTransformFile, iErrorConditions, iValidation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabaseapplytransforma
  public static MsiDatabaseApplyTransformA(hDatabase: MSIHANDLE, szTransformFile: LPCSTR, iErrorConditions: INT): UINT {
    return Msi.Load('MsiDatabaseApplyTransformA')(hDatabase, szTransformFile, iErrorConditions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabaseapplytransformw
  public static MsiDatabaseApplyTransformW(hDatabase: MSIHANDLE, szTransformFile: LPCWSTR, iErrorConditions: INT): UINT {
    return Msi.Load('MsiDatabaseApplyTransformW')(hDatabase, szTransformFile, iErrorConditions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabasecommit
  public static MsiDatabaseCommit(hDatabase: MSIHANDLE): UINT {
    return Msi.Load('MsiDatabaseCommit')(hDatabase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabaseexporta
  public static MsiDatabaseExportA(hDatabase: MSIHANDLE, szTableName: LPCSTR, szFolderPath: LPCSTR, szFileName: LPCSTR): UINT {
    return Msi.Load('MsiDatabaseExportA')(hDatabase, szTableName, szFolderPath, szFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabaseexportw
  public static MsiDatabaseExportW(hDatabase: MSIHANDLE, szTableName: LPCWSTR, szFolderPath: LPCWSTR, szFileName: LPCWSTR): UINT {
    return Msi.Load('MsiDatabaseExportW')(hDatabase, szTableName, szFolderPath, szFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabasegeneratetransforma
  public static MsiDatabaseGenerateTransformA(hDatabase: MSIHANDLE, hDatabaseReference: MSIHANDLE, szTransformFile: NULLABLE<LPCSTR>): UINT {
    return Msi.Load('MsiDatabaseGenerateTransformA')(hDatabase, hDatabaseReference, szTransformFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabasegeneratetransformw
  public static MsiDatabaseGenerateTransformW(hDatabase: MSIHANDLE, hDatabaseReference: MSIHANDLE, szTransformFile: NULLABLE<LPCWSTR>): UINT {
    return Msi.Load('MsiDatabaseGenerateTransformW')(hDatabase, hDatabaseReference, szTransformFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabasegetprimarykeysa
  public static MsiDatabaseGetPrimaryKeysA(hDatabase: MSIHANDLE, szTableName: LPCSTR, phRecord_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiDatabaseGetPrimaryKeysA')(hDatabase, szTableName, phRecord_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabasegetprimarykeysw
  public static MsiDatabaseGetPrimaryKeysW(hDatabase: MSIHANDLE, szTableName: LPCWSTR, phRecord_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiDatabaseGetPrimaryKeysW')(hDatabase, szTableName, phRecord_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabaseimporta
  public static MsiDatabaseImportA(hDatabase: MSIHANDLE, szFolderPath: LPCSTR, szFileName: LPCSTR): UINT {
    return Msi.Load('MsiDatabaseImportA')(hDatabase, szFolderPath, szFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabaseimportw
  public static MsiDatabaseImportW(hDatabase: MSIHANDLE, szFolderPath: LPCWSTR, szFileName: LPCWSTR): UINT {
    return Msi.Load('MsiDatabaseImportW')(hDatabase, szFolderPath, szFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabaseistablepersistenta
  public static MsiDatabaseIsTablePersistentA(hDatabase: MSIHANDLE, szTableName: LPCSTR): MSICONDITION {
    return Msi.Load('MsiDatabaseIsTablePersistentA')(hDatabase, szTableName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabaseistablepersistentw
  public static MsiDatabaseIsTablePersistentW(hDatabase: MSIHANDLE, szTableName: LPCWSTR): MSICONDITION {
    return Msi.Load('MsiDatabaseIsTablePersistentW')(hDatabase, szTableName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabasemergea
  public static MsiDatabaseMergeA(hDatabase: MSIHANDLE, hDatabaseMerge: MSIHANDLE, szTableName: NULLABLE<LPCSTR>): UINT {
    return Msi.Load('MsiDatabaseMergeA')(hDatabase, hDatabaseMerge, szTableName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabasemergew
  public static MsiDatabaseMergeW(hDatabase: MSIHANDLE, hDatabaseMerge: MSIHANDLE, szTableName: NULLABLE<LPCWSTR>): UINT {
    return Msi.Load('MsiDatabaseMergeW')(hDatabase, hDatabaseMerge, szTableName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabaseopenviewa
  public static MsiDatabaseOpenViewA(hDatabase: MSIHANDLE, szQuery: LPCSTR, phView_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiDatabaseOpenViewA')(hDatabase, szQuery, phView_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidatabaseopenvieww
  public static MsiDatabaseOpenViewW(hDatabase: MSIHANDLE, szQuery: LPCWSTR, phView_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiDatabaseOpenViewW')(hDatabase, szQuery, phView_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msidecomposedescriptora
  public static MsiDecomposeDescriptorA(szDescriptor: LPCSTR, szProductCode_out: OPTIONAL<LPSTR>, szFeatureId_out: OPTIONAL<LPSTR>, szComponentCode_out: OPTIONAL<LPSTR>, pcchArgsOffset_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiDecomposeDescriptorA')(szDescriptor, szProductCode_out, szFeatureId_out, szComponentCode_out, pcchArgsOffset_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msidecomposedescriptorw
  public static MsiDecomposeDescriptorW(szDescriptor: LPCWSTR, szProductCode_out: OPTIONAL<LPWSTR>, szFeatureId_out: OPTIONAL<LPWSTR>, szComponentCode_out: OPTIONAL<LPWSTR>, pcchArgsOffset_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiDecomposeDescriptorW')(szDescriptor, szProductCode_out, szFeatureId_out, szComponentCode_out, pcchArgsOffset_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msidetermineapplicablepatchesa
  public static MsiDetermineApplicablePatchesA(szProductPackagePath: LPCSTR, cPatchInfo: DWORD, pPatchInfo_in_out: PMSIPATCHSEQUENCEINFOA): UINT {
    return Msi.Load('MsiDetermineApplicablePatchesA')(szProductPackagePath, cPatchInfo, pPatchInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msidetermineapplicablepatchesw
  public static MsiDetermineApplicablePatchesW(szProductPackagePath: LPCWSTR, cPatchInfo: DWORD, pPatchInfo_in_out: PMSIPATCHSEQUENCEINFOW): UINT {
    return Msi.Load('MsiDetermineApplicablePatchesW')(szProductPackagePath, cPatchInfo, pPatchInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msideterminepatchsequencea
  public static MsiDeterminePatchSequenceA(szProductCode: LPCSTR, szUserSid: OPTIONAL<LPCSTR>, dwContext: DWORD, cPatchInfo: DWORD, pPatchInfo_in_out: PMSIPATCHSEQUENCEINFOA): UINT {
    return Msi.Load('MsiDeterminePatchSequenceA')(szProductCode, szUserSid, dwContext, cPatchInfo, pPatchInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msideterminepatchsequencew
  public static MsiDeterminePatchSequenceW(szProductCode: LPCWSTR, szUserSid: OPTIONAL<LPCWSTR>, dwContext: DWORD, cPatchInfo: DWORD, pPatchInfo_in_out: PMSIPATCHSEQUENCEINFOW): UINT {
    return Msi.Load('MsiDeterminePatchSequenceW')(szProductCode, szUserSid, dwContext, cPatchInfo, pPatchInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidoactiona
  public static MsiDoActionA(hInstall: MSIHANDLE, szAction: LPCSTR): UINT {
    return Msi.Load('MsiDoActionA')(hInstall, szAction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msidoactionw
  public static MsiDoActionW(hInstall: MSIHANDLE, szAction: LPCWSTR): UINT {
    return Msi.Load('MsiDoActionW')(hInstall, szAction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienableloga
  public static MsiEnableLogA(dwLogMode: DWORD, szLogFile: OPTIONAL<LPCSTR>, dwLogAttributes: DWORD): UINT {
    return Msi.Load('MsiEnableLogA')(dwLogMode, szLogFile, dwLogAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienablelogw
  public static MsiEnableLogW(dwLogMode: DWORD, szLogFile: OPTIONAL<LPCWSTR>, dwLogAttributes: DWORD): UINT {
    return Msi.Load('MsiEnableLogW')(dwLogMode, szLogFile, dwLogAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msienableuipreview
  public static MsiEnableUIPreview(hDatabase: MSIHANDLE, phPreview_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiEnableUIPreview')(hDatabase, phPreview_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiendtransaction
  public static MsiEndTransaction(dwTransactionState: DWORD): UINT {
    return Msi.Load('MsiEndTransaction')(dwTransactionState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumclientsa
  public static MsiEnumClientsA(szComponent: LPCSTR, iProductIndex: DWORD, lpProductBuf_out: LPSTR): UINT {
    return Msi.Load('MsiEnumClientsA')(szComponent, iProductIndex, lpProductBuf_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumclientsexa
  public static MsiEnumClientsExA(
    szComponent: LPCSTR,
    szUserSid: OPTIONAL<LPCSTR>,
    dwContext: DWORD,
    dwProductIndex: DWORD,
    szProductBuf_out: OPTIONAL<LPSTR>,
    pdwInstalledContext_out: OPTIONAL<LPDWORD>,
    szSid_out: OPTIONAL<LPSTR>,
    pcchSid_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiEnumClientsExA')(szComponent, szUserSid, dwContext, dwProductIndex, szProductBuf_out, pdwInstalledContext_out, szSid_out, pcchSid_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumclientsexw
  public static MsiEnumClientsExW(
    szComponent: LPCWSTR,
    szUserSid: OPTIONAL<LPCWSTR>,
    dwContext: DWORD,
    dwProductIndex: DWORD,
    szProductBuf_out: OPTIONAL<LPWSTR>,
    pdwInstalledContext_out: OPTIONAL<LPDWORD>,
    szSid_out: OPTIONAL<LPWSTR>,
    pcchSid_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiEnumClientsExW')(szComponent, szUserSid, dwContext, dwProductIndex, szProductBuf_out, pdwInstalledContext_out, szSid_out, pcchSid_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumclientsw
  public static MsiEnumClientsW(szComponent: LPCWSTR, iProductIndex: DWORD, lpProductBuf_out: LPWSTR): UINT {
    return Msi.Load('MsiEnumClientsW')(szComponent, iProductIndex, lpProductBuf_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msienumcomponentcostsa
  public static MsiEnumComponentCostsA(hInstall: MSIHANDLE, szComponent: NULLABLE<LPCSTR>, dwIndex: DWORD, iState: INSTALLSTATE, szDriveBuf_out: LPSTR, pcchDriveBuf_in_out: LPDWORD, piCost_out: LPINT, piTempCost_out: LPINT): UINT {
    return Msi.Load('MsiEnumComponentCostsA')(hInstall, szComponent, dwIndex, iState, szDriveBuf_out, pcchDriveBuf_in_out, piCost_out, piTempCost_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msienumcomponentcostsw
  public static MsiEnumComponentCostsW(hInstall: MSIHANDLE, szComponent: NULLABLE<LPCWSTR>, dwIndex: DWORD, iState: INSTALLSTATE, szDriveBuf_out: LPWSTR, pcchDriveBuf_in_out: LPDWORD, piCost_out: LPINT, piTempCost_out: LPINT): UINT {
    return Msi.Load('MsiEnumComponentCostsW')(hInstall, szComponent, dwIndex, iState, szDriveBuf_out, pcchDriveBuf_in_out, piCost_out, piTempCost_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumcomponentqualifiersa
  public static MsiEnumComponentQualifiersA(
    szComponent: LPCSTR,
    iIndex: DWORD,
    lpQualifierBuf_out: LPSTR,
    pcchQualifierBuf_in_out: LPDWORD,
    lpApplicationDataBuf_out: OPTIONAL<LPSTR>,
    pcchApplicationDataBuf_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiEnumComponentQualifiersA')(szComponent, iIndex, lpQualifierBuf_out, pcchQualifierBuf_in_out, lpApplicationDataBuf_out, pcchApplicationDataBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumcomponentqualifiersw
  public static MsiEnumComponentQualifiersW(
    szComponent: LPCWSTR,
    iIndex: DWORD,
    lpQualifierBuf_out: LPWSTR,
    pcchQualifierBuf_in_out: LPDWORD,
    lpApplicationDataBuf_out: OPTIONAL<LPWSTR>,
    pcchApplicationDataBuf_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiEnumComponentQualifiersW')(szComponent, iIndex, lpQualifierBuf_out, pcchQualifierBuf_in_out, lpApplicationDataBuf_out, pcchApplicationDataBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumcomponentsa
  public static MsiEnumComponentsA(iComponentIndex: DWORD, lpComponentBuf_out: LPSTR): UINT {
    return Msi.Load('MsiEnumComponentsA')(iComponentIndex, lpComponentBuf_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumcomponentsexa
  public static MsiEnumComponentsExA(
    szUserSid: OPTIONAL<LPCSTR>,
    dwContext: DWORD,
    dwIndex: DWORD,
    szInstalledComponentCode_out: OPTIONAL<LPSTR>,
    pdwInstalledContext_out: OPTIONAL<LPDWORD>,
    szSid_out: OPTIONAL<LPSTR>,
    pcchSid_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiEnumComponentsExA')(szUserSid, dwContext, dwIndex, szInstalledComponentCode_out, pdwInstalledContext_out, szSid_out, pcchSid_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumcomponentsexw
  public static MsiEnumComponentsExW(
    szUserSid: OPTIONAL<LPCWSTR>,
    dwContext: DWORD,
    dwIndex: DWORD,
    szInstalledComponentCode_out: OPTIONAL<LPWSTR>,
    pdwInstalledContext_out: OPTIONAL<LPDWORD>,
    szSid_out: OPTIONAL<LPWSTR>,
    pcchSid_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiEnumComponentsExW')(szUserSid, dwContext, dwIndex, szInstalledComponentCode_out, pdwInstalledContext_out, szSid_out, pcchSid_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumcomponentsw
  public static MsiEnumComponentsW(iComponentIndex: DWORD, lpComponentBuf_out: LPWSTR): UINT {
    return Msi.Load('MsiEnumComponentsW')(iComponentIndex, lpComponentBuf_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumfeaturesa
  public static MsiEnumFeaturesA(szProduct: LPCSTR, iFeatureIndex: DWORD, szFeature_out: LPSTR, szParent_out: OPTIONAL<LPSTR>): UINT {
    return Msi.Load('MsiEnumFeaturesA')(szProduct, iFeatureIndex, szFeature_out, szParent_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumfeaturesw
  public static MsiEnumFeaturesW(szProduct: LPCWSTR, iFeatureIndex: DWORD, szFeature_out: LPWSTR, szParent_out: OPTIONAL<LPWSTR>): UINT {
    return Msi.Load('MsiEnumFeaturesW')(szProduct, iFeatureIndex, szFeature_out, szParent_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumpatchesa
  public static MsiEnumPatchesA(szProduct: LPCSTR, iPatchIndex: DWORD, lpPatchBuf_out: LPSTR, lpTransformsBuf_out: LPSTR, pcchTransformsBuf_in_out: LPDWORD): UINT {
    return Msi.Load('MsiEnumPatchesA')(szProduct, iPatchIndex, lpPatchBuf_out, lpTransformsBuf_out, pcchTransformsBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumpatchesexa
  public static MsiEnumPatchesExA(
    szProductCode: OPTIONAL<LPCSTR>,
    szUserSid: OPTIONAL<LPCSTR>,
    dwContext: DWORD,
    dwFilter: DWORD,
    dwIndex: DWORD,
    szPatchCode_out: OPTIONAL<LPSTR>,
    szTargetProductCode_out: OPTIONAL<LPSTR>,
    pdwTargetProductContext_out: OPTIONAL<LPDWORD>,
    szTargetUserSid_out: OPTIONAL<LPSTR>,
    pcchTargetUserSid_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiEnumPatchesExA')(szProductCode, szUserSid, dwContext, dwFilter, dwIndex, szPatchCode_out, szTargetProductCode_out, pdwTargetProductContext_out, szTargetUserSid_out, pcchTargetUserSid_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumpatchesexw
  public static MsiEnumPatchesExW(
    szProductCode: OPTIONAL<LPCWSTR>,
    szUserSid: OPTIONAL<LPCWSTR>,
    dwContext: DWORD,
    dwFilter: DWORD,
    dwIndex: DWORD,
    szPatchCode_out: OPTIONAL<LPWSTR>,
    szTargetProductCode_out: OPTIONAL<LPWSTR>,
    pdwTargetProductContext_out: OPTIONAL<LPDWORD>,
    szTargetUserSid_out: OPTIONAL<LPWSTR>,
    pcchTargetUserSid_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiEnumPatchesExW')(szProductCode, szUserSid, dwContext, dwFilter, dwIndex, szPatchCode_out, szTargetProductCode_out, pdwTargetProductContext_out, szTargetUserSid_out, pcchTargetUserSid_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumpatchesw
  public static MsiEnumPatchesW(szProduct: LPCWSTR, iPatchIndex: DWORD, lpPatchBuf_out: LPWSTR, lpTransformsBuf_out: LPWSTR, pcchTransformsBuf_in_out: LPDWORD): UINT {
    return Msi.Load('MsiEnumPatchesW')(szProduct, iPatchIndex, lpPatchBuf_out, lpTransformsBuf_out, pcchTransformsBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumproductsa
  public static MsiEnumProductsA(iProductIndex: DWORD, lpProductBuf_out: LPSTR): UINT {
    return Msi.Load('MsiEnumProductsA')(iProductIndex, lpProductBuf_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumproductsexa
  public static MsiEnumProductsExA(
    szProductCode: OPTIONAL<LPCSTR>,
    szUserSid: OPTIONAL<LPCSTR>,
    dwContext: DWORD,
    dwIndex: DWORD,
    szInstalledProductCode_out: OPTIONAL<LPSTR>,
    pdwInstalledContext_out: OPTIONAL<LPDWORD>,
    szSid_out: OPTIONAL<LPSTR>,
    pcchSid_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiEnumProductsExA')(szProductCode, szUserSid, dwContext, dwIndex, szInstalledProductCode_out, pdwInstalledContext_out, szSid_out, pcchSid_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumproductsexw
  public static MsiEnumProductsExW(
    szProductCode: OPTIONAL<LPCWSTR>,
    szUserSid: OPTIONAL<LPCWSTR>,
    dwContext: DWORD,
    dwIndex: DWORD,
    szInstalledProductCode_out: OPTIONAL<LPWSTR>,
    pdwInstalledContext_out: OPTIONAL<LPDWORD>,
    szSid_out: OPTIONAL<LPWSTR>,
    pcchSid_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiEnumProductsExW')(szProductCode, szUserSid, dwContext, dwIndex, szInstalledProductCode_out, pdwInstalledContext_out, szSid_out, pcchSid_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumproductsw
  public static MsiEnumProductsW(iProductIndex: DWORD, lpProductBuf_out: LPWSTR): UINT {
    return Msi.Load('MsiEnumProductsW')(iProductIndex, lpProductBuf_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumrelatedproductsa
  public static MsiEnumRelatedProductsA(lpUpgradeCode: LPCSTR, dwReserved: DWORD, iProductIndex: DWORD, lpProductBuf_out: LPSTR): UINT {
    return Msi.Load('MsiEnumRelatedProductsA')(lpUpgradeCode, dwReserved, iProductIndex, lpProductBuf_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msienumrelatedproductsw
  public static MsiEnumRelatedProductsW(lpUpgradeCode: LPCWSTR, dwReserved: DWORD, iProductIndex: DWORD, lpProductBuf_out: LPWSTR): UINT {
    return Msi.Load('MsiEnumRelatedProductsW')(lpUpgradeCode, dwReserved, iProductIndex, lpProductBuf_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msievaluateconditiona
  public static MsiEvaluateConditionA(hInstall: MSIHANDLE, szCondition: NULLABLE<LPCSTR>): MSICONDITION {
    return Msi.Load('MsiEvaluateConditionA')(hInstall, szCondition);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msievaluateconditionw
  public static MsiEvaluateConditionW(hInstall: MSIHANDLE, szCondition: NULLABLE<LPCWSTR>): MSICONDITION {
    return Msi.Load('MsiEvaluateConditionW')(hInstall, szCondition);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiextractpatchxmldataa
  public static MsiExtractPatchXMLDataA(szPatchPath: LPCSTR, dwReserved: DWORD, szXMLData_out: OPTIONAL<LPSTR>, pcchXMLData_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiExtractPatchXMLDataA')(szPatchPath, dwReserved, szXMLData_out, pcchXMLData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiextractpatchxmldataw
  public static MsiExtractPatchXMLDataW(szPatchPath: LPCWSTR, dwReserved: DWORD, szXMLData_out: OPTIONAL<LPWSTR>, pcchXMLData_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiExtractPatchXMLDataW')(szPatchPath, dwReserved, szXMLData_out, pcchXMLData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msiformatrecorda
  public static MsiFormatRecordA(hInstall: MSIHANDLE, hRecord: MSIHANDLE, szResultBuf_out: OPTIONAL<LPSTR>, pcchResultBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiFormatRecordA')(hInstall, hRecord, szResultBuf_out, pcchResultBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msiformatrecordw
  public static MsiFormatRecordW(hInstall: MSIHANDLE, hRecord: MSIHANDLE, szResultBuf_out: OPTIONAL<LPWSTR>, pcchResultBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiFormatRecordW')(hInstall, hRecord, szResultBuf_out, pcchResultBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetactivedatabase
  public static MsiGetActiveDatabase(hInstall: MSIHANDLE): MSIHANDLE {
    return Msi.Load('MsiGetActiveDatabase')(hInstall);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetcomponentpatha
  public static MsiGetComponentPathA(szProduct: LPCSTR, szComponent: LPCSTR, lpPathBuf_out: OPTIONAL<LPSTR>, pcchBuf_in_out: OPTIONAL<LPDWORD>): INSTALLSTATE {
    return Msi.Load('MsiGetComponentPathA')(szProduct, szComponent, lpPathBuf_out, pcchBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetcomponentpathexa
  public static MsiGetComponentPathExA(szProductCode: LPCSTR, szComponentCode: LPCSTR, szUserSid: OPTIONAL<LPCSTR>, dwContext: DWORD, lpOutPathBuffer_out: OPTIONAL<LPSTR>, pcchOutPathBuffer_in_out: OPTIONAL<LPDWORD>): INSTALLSTATE {
    return Msi.Load('MsiGetComponentPathExA')(szProductCode, szComponentCode, szUserSid, dwContext, lpOutPathBuffer_out, pcchOutPathBuffer_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetcomponentpathexw
  public static MsiGetComponentPathExW(szProductCode: LPCWSTR, szComponentCode: LPCWSTR, szUserSid: OPTIONAL<LPCWSTR>, dwContext: DWORD, lpOutPathBuffer_out: OPTIONAL<LPWSTR>, pcchOutPathBuffer_in_out: OPTIONAL<LPDWORD>): INSTALLSTATE {
    return Msi.Load('MsiGetComponentPathExW')(szProductCode, szComponentCode, szUserSid, dwContext, lpOutPathBuffer_out, pcchOutPathBuffer_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetcomponentpathw
  public static MsiGetComponentPathW(szProduct: LPCWSTR, szComponent: LPCWSTR, lpPathBuf_out: OPTIONAL<LPWSTR>, pcchBuf_in_out: OPTIONAL<LPDWORD>): INSTALLSTATE {
    return Msi.Load('MsiGetComponentPathW')(szProduct, szComponent, lpPathBuf_out, pcchBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetcomponentstatea
  public static MsiGetComponentStateA(hInstall: MSIHANDLE, szComponent: LPCSTR, piInstalled_out: PINSTALLSTATE, piAction_out: PINSTALLSTATE): UINT {
    return Msi.Load('MsiGetComponentStateA')(hInstall, szComponent, piInstalled_out, piAction_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetcomponentstatew
  public static MsiGetComponentStateW(hInstall: MSIHANDLE, szComponent: LPCWSTR, piInstalled_out: PINSTALLSTATE, piAction_out: PINSTALLSTATE): UINT {
    return Msi.Load('MsiGetComponentStateW')(hInstall, szComponent, piInstalled_out, piAction_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetdatabasestate
  public static MsiGetDatabaseState(hDatabase: MSIHANDLE): MSIDBSTATE {
    return Msi.Load('MsiGetDatabaseState')(hDatabase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetfeaturecosta
  public static MsiGetFeatureCostA(hInstall: MSIHANDLE, szFeature: LPCSTR, iCostTree: MSICOSTTREE, iState: INSTALLSTATE, piCost: LPINT): UINT {
    return Msi.Load('MsiGetFeatureCostA')(hInstall, szFeature, iCostTree, iState, piCost);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetfeaturecostw
  public static MsiGetFeatureCostW(hInstall: MSIHANDLE, szFeature: LPCWSTR, iCostTree: MSICOSTTREE, iState: INSTALLSTATE, piCost: LPINT): UINT {
    return Msi.Load('MsiGetFeatureCostW')(hInstall, szFeature, iCostTree, iState, piCost);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetfeatureinfoa
  public static MsiGetFeatureInfoA(
    hProduct: MSIHANDLE,
    szFeature: LPCSTR,
    lpAttributes_out: OPTIONAL<LPDWORD>,
    lpTitleBuf_out: OPTIONAL<LPSTR>,
    pcchTitleBuf_in_out: OPTIONAL<LPDWORD>,
    lpHelpBuf_out: OPTIONAL<LPSTR>,
    pcchHelpBuf_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiGetFeatureInfoA')(hProduct, szFeature, lpAttributes_out, lpTitleBuf_out, pcchTitleBuf_in_out, lpHelpBuf_out, pcchHelpBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetfeatureinfow
  public static MsiGetFeatureInfoW(
    hProduct: MSIHANDLE,
    szFeature: LPCWSTR,
    lpAttributes_out: OPTIONAL<LPDWORD>,
    lpTitleBuf_out: OPTIONAL<LPWSTR>,
    pcchTitleBuf_in_out: OPTIONAL<LPDWORD>,
    lpHelpBuf_out: OPTIONAL<LPWSTR>,
    pcchHelpBuf_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiGetFeatureInfoW')(hProduct, szFeature, lpAttributes_out, lpTitleBuf_out, pcchTitleBuf_in_out, lpHelpBuf_out, pcchHelpBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetfeaturestatea
  public static MsiGetFeatureStateA(hInstall: MSIHANDLE, szFeature: LPCSTR, piInstalled_out: PINSTALLSTATE, piAction_out: PINSTALLSTATE): UINT {
    return Msi.Load('MsiGetFeatureStateA')(hInstall, szFeature, piInstalled_out, piAction_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetfeaturestatew
  public static MsiGetFeatureStateW(hInstall: MSIHANDLE, szFeature: LPCWSTR, piInstalled_out: PINSTALLSTATE, piAction_out: PINSTALLSTATE): UINT {
    return Msi.Load('MsiGetFeatureStateW')(hInstall, szFeature, piInstalled_out, piAction_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetfeatureusagea
  public static MsiGetFeatureUsageA(szProduct: LPCSTR, szFeature: LPCSTR, pdwUseCount_out: OPTIONAL<LPDWORD>, pwDateUsed_out: OPTIONAL<LPWORD>): UINT {
    return Msi.Load('MsiGetFeatureUsageA')(szProduct, szFeature, pdwUseCount_out, pwDateUsed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetfeatureusagew
  public static MsiGetFeatureUsageW(szProduct: LPCWSTR, szFeature: LPCWSTR, pdwUseCount_out: OPTIONAL<LPDWORD>, pwDateUsed_out: OPTIONAL<LPWORD>): UINT {
    return Msi.Load('MsiGetFeatureUsageW')(szProduct, szFeature, pdwUseCount_out, pwDateUsed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetfeaturevalidstatesa
  public static MsiGetFeatureValidStatesA(hInstall: MSIHANDLE, szFeature: LPCSTR, dwInstallStates_out: LPDWORD): UINT {
    return Msi.Load('MsiGetFeatureValidStatesA')(hInstall, szFeature, dwInstallStates_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetfeaturevalidstatesw
  public static MsiGetFeatureValidStatesW(hInstall: MSIHANDLE, szFeature: LPCWSTR, dwInstallStates_out: LPDWORD): UINT {
    return Msi.Load('MsiGetFeatureValidStatesW')(hInstall, szFeature, dwInstallStates_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetfilehasha
  public static MsiGetFileHashA(szFilePath: LPCSTR, dwOptions: DWORD, pHash_in_out: PMSIFILEHASHINFO): UINT {
    return Msi.Load('MsiGetFileHashA')(szFilePath, dwOptions, pHash_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetfilehashw
  public static MsiGetFileHashW(szFilePath: LPCWSTR, dwOptions: DWORD, pHash_in_out: PMSIFILEHASHINFO): UINT {
    return Msi.Load('MsiGetFileHashW')(szFilePath, dwOptions, pHash_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetfilesignatureinformationa
  public static MsiGetFileSignatureInformationA(szSignedObjectPath: LPCSTR, dwFlags: DWORD, ppcCertContext_out: PPCCERT_CONTEXT, pbHashData_out: OPTIONAL<PBYTE>, pcbHashData_in_out: OPTIONAL<LPDWORD>): HRESULT {
    return Msi.Load('MsiGetFileSignatureInformationA')(szSignedObjectPath, dwFlags, ppcCertContext_out, pbHashData_out, pcbHashData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetfilesignatureinformationw
  public static MsiGetFileSignatureInformationW(szSignedObjectPath: LPCWSTR, dwFlags: DWORD, ppcCertContext_out: PPCCERT_CONTEXT, pbHashData_out: OPTIONAL<PBYTE>, pcbHashData_in_out: OPTIONAL<LPDWORD>): HRESULT {
    return Msi.Load('MsiGetFileSignatureInformationW')(szSignedObjectPath, dwFlags, ppcCertContext_out, pbHashData_out, pcbHashData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetfileversiona
  public static MsiGetFileVersionA(szFilePath: LPCSTR, lpVersionBuf_out: OPTIONAL<LPSTR>, pcchVersionBuf_in_out: OPTIONAL<LPDWORD>, lpLangBuf_out: OPTIONAL<LPSTR>, pcchLangBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetFileVersionA')(szFilePath, lpVersionBuf_out, pcchVersionBuf_in_out, lpLangBuf_out, pcchLangBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetfileversionw
  public static MsiGetFileVersionW(szFilePath: LPCWSTR, lpVersionBuf_out: OPTIONAL<LPWSTR>, pcchVersionBuf_in_out: OPTIONAL<LPDWORD>, lpLangBuf_out: OPTIONAL<LPWSTR>, pcchLangBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetFileVersionW')(szFilePath, lpVersionBuf_out, pcchVersionBuf_in_out, lpLangBuf_out, pcchLangBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetlanguage
  public static MsiGetLanguage(hInstall: MSIHANDLE): LANGID {
    return Msi.Load('MsiGetLanguage')(hInstall);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetlasterrorrecord
  public static MsiGetLastErrorRecord(): MSIHANDLE {
    return Msi.Load('MsiGetLastErrorRecord')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetmode
  public static MsiGetMode(hInstall: MSIHANDLE, eRunMode: MSIRUNMODE): BOOL {
    return Msi.Load('MsiGetMode')(hInstall, eRunMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetpatchfilelista
  public static MsiGetPatchFileListA(szProductCode: LPCSTR, szPatchPackages: LPCSTR, pcFiles_out: LPDWORD, pphFileRecords_out: PPMSIHANDLE): UINT {
    return Msi.Load('MsiGetPatchFileListA')(szProductCode, szPatchPackages, pcFiles_out, pphFileRecords_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetpatchfilelistw
  public static MsiGetPatchFileListW(szProductCode: LPCWSTR, szPatchPackages: LPCWSTR, pcFiles_out: LPDWORD, pphFileRecords_out: PPMSIHANDLE): UINT {
    return Msi.Load('MsiGetPatchFileListW')(szProductCode, szPatchPackages, pcFiles_out, pphFileRecords_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetpatchinfoa
  public static MsiGetPatchInfoA(szPatch: LPCSTR, szAttribute: LPCSTR, lpValueBuf_out: OPTIONAL<LPSTR>, pcchValueBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetPatchInfoA')(szPatch, szAttribute, lpValueBuf_out, pcchValueBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetpatchinfoexa
  public static MsiGetPatchInfoExA(szPatchCode: LPCSTR, szProductCode: LPCSTR, szUserSid: OPTIONAL<LPCSTR>, dwContext: DWORD, szProperty: LPCSTR, lpValue_out: OPTIONAL<LPSTR>, pcchValue_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetPatchInfoExA')(szPatchCode, szProductCode, szUserSid, dwContext, szProperty, lpValue_out, pcchValue_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetpatchinfoexw
  public static MsiGetPatchInfoExW(szPatchCode: LPCWSTR, szProductCode: LPCWSTR, szUserSid: OPTIONAL<LPCWSTR>, dwContext: DWORD, szProperty: LPCWSTR, lpValue_out: OPTIONAL<LPWSTR>, pcchValue_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetPatchInfoExW')(szPatchCode, szProductCode, szUserSid, dwContext, szProperty, lpValue_out, pcchValue_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetpatchinfow
  public static MsiGetPatchInfoW(szPatch: LPCWSTR, szAttribute: LPCWSTR, lpValueBuf_out: OPTIONAL<LPWSTR>, pcchValueBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetPatchInfoW')(szPatch, szAttribute, lpValueBuf_out, pcchValueBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetproductcodea
  public static MsiGetProductCodeA(szComponent: LPCSTR, lpBuf39_out: LPSTR): UINT {
    return Msi.Load('MsiGetProductCodeA')(szComponent, lpBuf39_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetproductcodefrompackagecodea
  public static MsiGetProductCodeFromPackageCodeA(szPackageCode: LPCSTR, lpProductCode39_out: LPSTR): UINT {
    return Msi.Load('MsiGetProductCodeFromPackageCodeA')(szPackageCode, lpProductCode39_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetproductcodefrompackagecodew
  public static MsiGetProductCodeFromPackageCodeW(szPackageCode: LPCWSTR, lpProductCode39_out: LPWSTR): UINT {
    return Msi.Load('MsiGetProductCodeFromPackageCodeW')(szPackageCode, lpProductCode39_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetproductcodew
  public static MsiGetProductCodeW(szComponent: LPCWSTR, lpBuf39_out: LPWSTR): UINT {
    return Msi.Load('MsiGetProductCodeW')(szComponent, lpBuf39_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetproductinfoa
  public static MsiGetProductInfoA(szProduct: LPCSTR, szAttribute: LPCSTR, lpValueBuf_out: OPTIONAL<LPSTR>, pcchValueBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetProductInfoA')(szProduct, szAttribute, lpValueBuf_out, pcchValueBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetproductinfoexa
  public static MsiGetProductInfoExA(szProductCode: LPCSTR, szUserSid: OPTIONAL<LPCSTR>, dwContext: DWORD, szProperty: LPCSTR, szValue_out: OPTIONAL<LPSTR>, pcchValue_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetProductInfoExA')(szProductCode, szUserSid, dwContext, szProperty, szValue_out, pcchValue_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetproductinfoexw
  public static MsiGetProductInfoExW(szProductCode: LPCWSTR, szUserSid: OPTIONAL<LPCWSTR>, dwContext: DWORD, szProperty: LPCWSTR, szValue_out: OPTIONAL<LPWSTR>, pcchValue_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetProductInfoExW')(szProductCode, szUserSid, dwContext, szProperty, szValue_out, pcchValue_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetproductinfofromscripta
  public static MsiGetProductInfoFromScriptA(
    szScriptFile: LPCSTR,
    lpProductBuf39_out: OPTIONAL<LPSTR>,
    plgidLanguage_out: OPTIONAL<LPWORD>,
    pdwVersion_out: OPTIONAL<LPDWORD>,
    lpNameBuf_out: OPTIONAL<LPSTR>,
    pcchNameBuf_in_out: OPTIONAL<LPDWORD>,
    lpPackageBuf_out: OPTIONAL<LPSTR>,
    pcchPackageBuf_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiGetProductInfoFromScriptA')(szScriptFile, lpProductBuf39_out, plgidLanguage_out, pdwVersion_out, lpNameBuf_out, pcchNameBuf_in_out, lpPackageBuf_out, pcchPackageBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetproductinfofromscriptw
  public static MsiGetProductInfoFromScriptW(
    szScriptFile: LPCWSTR,
    lpProductBuf39_out: OPTIONAL<LPWSTR>,
    plgidLanguage_out: OPTIONAL<LPWORD>,
    pdwVersion_out: OPTIONAL<LPDWORD>,
    lpNameBuf_out: OPTIONAL<LPWSTR>,
    pcchNameBuf_in_out: OPTIONAL<LPDWORD>,
    lpPackageBuf_out: OPTIONAL<LPWSTR>,
    pcchPackageBuf_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiGetProductInfoFromScriptW')(szScriptFile, lpProductBuf39_out, plgidLanguage_out, pdwVersion_out, lpNameBuf_out, pcchNameBuf_in_out, lpPackageBuf_out, pcchPackageBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetproductinfow
  public static MsiGetProductInfoW(szProduct: LPCWSTR, szAttribute: LPCWSTR, lpValueBuf_out: OPTIONAL<LPWSTR>, pcchValueBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetProductInfoW')(szProduct, szAttribute, lpValueBuf_out, pcchValueBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetproductpropertya
  public static MsiGetProductPropertyA(hProduct: MSIHANDLE, szProperty: LPCSTR, lpValueBuf_out: OPTIONAL<LPSTR>, pcchValueBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetProductPropertyA')(hProduct, szProperty, lpValueBuf_out, pcchValueBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetproductpropertyw
  public static MsiGetProductPropertyW(hProduct: MSIHANDLE, szProperty: LPCWSTR, lpValueBuf_out: OPTIONAL<LPWSTR>, pcchValueBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetProductPropertyW')(hProduct, szProperty, lpValueBuf_out, pcchValueBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetpropertya
  public static MsiGetPropertyA(hInstall: MSIHANDLE, szName: LPCSTR, szValueBuf_out: OPTIONAL<LPSTR>, pcchValueBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetPropertyA')(hInstall, szName, szValueBuf_out, pcchValueBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetpropertyw
  public static MsiGetPropertyW(hInstall: MSIHANDLE, szName: LPCWSTR, szValueBuf_out: OPTIONAL<LPWSTR>, pcchValueBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetPropertyW')(hInstall, szName, szValueBuf_out, pcchValueBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetshortcuttargeta
  public static MsiGetShortcutTargetA(szShortcutPath: LPCSTR, szProductCode_out: OPTIONAL<LPSTR>, szFeatureId_out: OPTIONAL<LPSTR>, szComponentCode_out: OPTIONAL<LPSTR>): UINT {
    return Msi.Load('MsiGetShortcutTargetA')(szShortcutPath, szProductCode_out, szFeatureId_out, szComponentCode_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetshortcuttargetw
  public static MsiGetShortcutTargetW(szShortcutPath: LPCWSTR, szProductCode_out: OPTIONAL<LPWSTR>, szFeatureId_out: OPTIONAL<LPWSTR>, szComponentCode_out: OPTIONAL<LPWSTR>): UINT {
    return Msi.Load('MsiGetShortcutTargetW')(szShortcutPath, szProductCode_out, szFeatureId_out, szComponentCode_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetsourcepatha
  public static MsiGetSourcePathA(hInstall: MSIHANDLE, szFolder: LPCSTR, szPathBuf_out: OPTIONAL<LPSTR>, pcchPathBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetSourcePathA')(hInstall, szFolder, szPathBuf_out, pcchPathBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetsourcepathw
  public static MsiGetSourcePathW(hInstall: MSIHANDLE, szFolder: LPCWSTR, szPathBuf_out: OPTIONAL<LPWSTR>, pcchPathBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetSourcePathW')(hInstall, szFolder, szPathBuf_out, pcchPathBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetsummaryinformationa
  public static MsiGetSummaryInformationA(hDatabase: MSIHANDLE, szDatabasePath: NULLABLE<LPCSTR>, uiUpdateCount: UINT, phSummaryInfo_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiGetSummaryInformationA')(hDatabase, szDatabasePath, uiUpdateCount, phSummaryInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigetsummaryinformationw
  public static MsiGetSummaryInformationW(hDatabase: MSIHANDLE, szDatabasePath: NULLABLE<LPCWSTR>, uiUpdateCount: UINT, phSummaryInfo_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiGetSummaryInformationW')(hDatabase, szDatabasePath, uiUpdateCount, phSummaryInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigettargetpatha
  public static MsiGetTargetPathA(hInstall: MSIHANDLE, szFolder: LPCSTR, szPathBuf_out: OPTIONAL<LPSTR>, pcchPathBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetTargetPathA')(hInstall, szFolder, szPathBuf_out, pcchPathBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msigettargetpathw
  public static MsiGetTargetPathW(hInstall: MSIHANDLE, szFolder: LPCWSTR, szPathBuf_out: OPTIONAL<LPWSTR>, pcchPathBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiGetTargetPathW')(hInstall, szFolder, szPathBuf_out, pcchPathBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetuserinfoa
  public static MsiGetUserInfoA(
    szProduct: LPCSTR,
    lpUserNameBuf_out: OPTIONAL<LPSTR>,
    pcchUserNameBuf_in_out: OPTIONAL<LPDWORD>,
    lpOrgNameBuf_out: OPTIONAL<LPSTR>,
    pcchOrgNameBuf_in_out: OPTIONAL<LPDWORD>,
    lpSerialBuf_out: OPTIONAL<LPSTR>,
    pcchSerialBuf_in_out: OPTIONAL<LPDWORD>,
  ): USERINFOSTATE {
    return Msi.Load('MsiGetUserInfoA')(szProduct, lpUserNameBuf_out, pcchUserNameBuf_in_out, lpOrgNameBuf_out, pcchOrgNameBuf_in_out, lpSerialBuf_out, pcchSerialBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msigetuserinfow
  public static MsiGetUserInfoW(
    szProduct: LPCWSTR,
    lpUserNameBuf_out: OPTIONAL<LPWSTR>,
    pcchUserNameBuf_in_out: OPTIONAL<LPDWORD>,
    lpOrgNameBuf_out: OPTIONAL<LPWSTR>,
    pcchOrgNameBuf_in_out: OPTIONAL<LPDWORD>,
    lpSerialBuf_out: OPTIONAL<LPWSTR>,
    pcchSerialBuf_in_out: OPTIONAL<LPDWORD>,
  ): USERINFOSTATE {
    return Msi.Load('MsiGetUserInfoW')(szProduct, lpUserNameBuf_out, pcchUserNameBuf_in_out, lpOrgNameBuf_out, pcchOrgNameBuf_in_out, lpSerialBuf_out, pcchSerialBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiinstallmissingcomponenta
  public static MsiInstallMissingComponentA(szProduct: LPCSTR, szComponent: LPCSTR, eInstallState: INSTALLSTATE): UINT {
    return Msi.Load('MsiInstallMissingComponentA')(szProduct, szComponent, eInstallState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiinstallmissingcomponentw
  public static MsiInstallMissingComponentW(szProduct: LPCWSTR, szComponent: LPCWSTR, eInstallState: INSTALLSTATE): UINT {
    return Msi.Load('MsiInstallMissingComponentW')(szProduct, szComponent, eInstallState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiinstallmissingfilea
  public static MsiInstallMissingFileA(szProduct: LPCSTR, szFile: LPCSTR): UINT {
    return Msi.Load('MsiInstallMissingFileA')(szProduct, szFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiinstallmissingfilew
  public static MsiInstallMissingFileW(szProduct: LPCWSTR, szFile: LPCWSTR): UINT {
    return Msi.Load('MsiInstallMissingFileW')(szProduct, szFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiinstallproducta
  public static MsiInstallProductA(szPackagePath: LPCSTR, szCommandLine: OPTIONAL<LPCSTR>): UINT {
    return Msi.Load('MsiInstallProductA')(szPackagePath, szCommandLine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiinstallproductw
  public static MsiInstallProductW(szPackagePath: LPCWSTR, szCommandLine: OPTIONAL<LPCWSTR>): UINT {
    return Msi.Load('MsiInstallProductW')(szPackagePath, szCommandLine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiinvalidatefeaturecache
  public static MsiInvalidateFeatureCache(): void {
    return Msi.Load('MsiInvalidateFeatureCache')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiisproductelevateda
  public static MsiIsProductElevatedA(szProduct: LPCSTR, pfElevated_out: LPDWORD): UINT {
    return Msi.Load('MsiIsProductElevatedA')(szProduct, pfElevated_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiisproductelevatedw
  public static MsiIsProductElevatedW(szProduct: LPCWSTR, pfElevated_out: LPDWORD): UINT {
    return Msi.Load('MsiIsProductElevatedW')(szProduct, pfElevated_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msijointransaction
  public static MsiJoinTransaction(hTransactionHandle: MSIHANDLE, dwTransactionAttributes: DWORD, hChangeOfOwnerEvent_out: LPHANDLE): UINT {
    return Msi.Load('MsiJoinTransaction')(hTransactionHandle, dwTransactionAttributes, hChangeOfOwnerEvent_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msilocatecomponenta
  public static MsiLocateComponentA(szComponent: LPCSTR, lpPathBuf_out: OPTIONAL<LPSTR>, pcchBuf_in_out: OPTIONAL<LPDWORD>): INSTALLSTATE {
    return Msi.Load('MsiLocateComponentA')(szComponent, lpPathBuf_out, pcchBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msilocatecomponentw
  public static MsiLocateComponentW(szComponent: LPCWSTR, lpPathBuf_out: OPTIONAL<LPWSTR>, pcchBuf_in_out: OPTIONAL<LPDWORD>): INSTALLSTATE {
    return Msi.Load('MsiLocateComponentW')(szComponent, lpPathBuf_out, pcchBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msinotifysidchangea
  public static MsiNotifySidChangeA(pOldSid: LPCSTR, pNewSid: LPCSTR): UINT {
    return Msi.Load('MsiNotifySidChangeA')(pOldSid, pNewSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msinotifysidchangew
  public static MsiNotifySidChangeW(pOldSid: LPCWSTR, pNewSid: LPCWSTR): UINT {
    return Msi.Load('MsiNotifySidChangeW')(pOldSid, pNewSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msiopendatabasea
  public static MsiOpenDatabaseA(szDatabasePath: LPCSTR, szPersist: LPCSTR, phDatabase_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiOpenDatabaseA')(szDatabasePath, szPersist, phDatabase_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msiopendatabasew
  public static MsiOpenDatabaseW(szDatabasePath: LPCWSTR, szPersist: LPCWSTR, phDatabase_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiOpenDatabaseW')(szDatabasePath, szPersist, phDatabase_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiopenpackagea
  public static MsiOpenPackageA(szPackagePath: LPCSTR, hProduct_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiOpenPackageA')(szPackagePath, hProduct_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiopenpackageexa
  public static MsiOpenPackageExA(szPackagePath: LPCSTR, dwOptions: DWORD, hProduct_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiOpenPackageExA')(szPackagePath, dwOptions, hProduct_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiopenpackageexw
  public static MsiOpenPackageExW(szPackagePath: LPCWSTR, dwOptions: DWORD, hProduct_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiOpenPackageExW')(szPackagePath, dwOptions, hProduct_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiopenpackagew
  public static MsiOpenPackageW(szPackagePath: LPCWSTR, hProduct_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiOpenPackageW')(szPackagePath, hProduct_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiopenproducta
  public static MsiOpenProductA(szProduct: LPCSTR, hProduct_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiOpenProductA')(szProduct, hProduct_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiopenproductw
  public static MsiOpenProductW(szProduct: LPCWSTR, hProduct_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiOpenProductW')(szProduct, hProduct_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msipreviewbillboarda
  public static MsiPreviewBillboardA(hPreview: MSIHANDLE, szControlName: LPCSTR, szBillboard: NULLABLE<LPCSTR>): UINT {
    return Msi.Load('MsiPreviewBillboardA')(hPreview, szControlName, szBillboard);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msipreviewbillboardw
  public static MsiPreviewBillboardW(hPreview: MSIHANDLE, szControlName: LPCWSTR, szBillboard: NULLABLE<LPCWSTR>): UINT {
    return Msi.Load('MsiPreviewBillboardW')(hPreview, szControlName, szBillboard);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msipreviewdialoga
  public static MsiPreviewDialogA(hPreview: MSIHANDLE, szDialogName: LPCSTR): UINT {
    return Msi.Load('MsiPreviewDialogA')(hPreview, szDialogName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msipreviewdialogw
  public static MsiPreviewDialogW(hPreview: MSIHANDLE, szDialogName: LPCWSTR): UINT {
    return Msi.Load('MsiPreviewDialogW')(hPreview, szDialogName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiprocessadvertisescripta
  public static MsiProcessAdvertiseScriptA(szScriptFile: LPCSTR, szIconFolder: OPTIONAL<LPCSTR>, hRegData: OPTIONAL<HKEY>, fShortcuts: BOOL, fRemoveItems: BOOL): UINT {
    return Msi.Load('MsiProcessAdvertiseScriptA')(szScriptFile, szIconFolder, hRegData, fShortcuts, fRemoveItems);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiprocessadvertisescriptw
  public static MsiProcessAdvertiseScriptW(szScriptFile: LPCWSTR, szIconFolder: OPTIONAL<LPCWSTR>, hRegData: OPTIONAL<HKEY>, fShortcuts: BOOL, fRemoveItems: BOOL): UINT {
    return Msi.Load('MsiProcessAdvertiseScriptW')(szScriptFile, szIconFolder, hRegData, fShortcuts, fRemoveItems);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msiprocessmessage
  public static MsiProcessMessage(hInstall: MSIHANDLE, eMessageType: INSTALLMESSAGE, hRecord: MSIHANDLE): INT {
    return Msi.Load('MsiProcessMessage')(hInstall, eMessageType, hRecord);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiprovideassemblya
  public static MsiProvideAssemblyA(szAssemblyName: LPCSTR, szAppContext: OPTIONAL<LPCSTR>, dwInstallMode: DWORD, dwAssemblyInfo: DWORD, lpPathBuf_out: OPTIONAL<LPSTR>, pcchPathBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiProvideAssemblyA')(szAssemblyName, szAppContext, dwInstallMode, dwAssemblyInfo, lpPathBuf_out, pcchPathBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiprovideassemblyw
  public static MsiProvideAssemblyW(szAssemblyName: LPCWSTR, szAppContext: OPTIONAL<LPCWSTR>, dwInstallMode: DWORD, dwAssemblyInfo: DWORD, lpPathBuf_out: OPTIONAL<LPWSTR>, pcchPathBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiProvideAssemblyW')(szAssemblyName, szAppContext, dwInstallMode, dwAssemblyInfo, lpPathBuf_out, pcchPathBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiprovidecomponenta
  public static MsiProvideComponentA(szProduct: LPCSTR, szFeature: LPCSTR, szComponent: LPCSTR, dwInstallMode: DWORD, lpPathBuf_out: OPTIONAL<LPSTR>, pcchPathBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiProvideComponentA')(szProduct, szFeature, szComponent, dwInstallMode, lpPathBuf_out, pcchPathBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiprovidecomponentfromdescriptora
  public static MsiProvideComponentFromDescriptorA(szDescriptor: LPCSTR, lpPathBuf_out: OPTIONAL<LPSTR>, pcchPathBuf_in_out: OPTIONAL<LPDWORD>, pcchArgsOffset_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiProvideComponentFromDescriptorA')(szDescriptor, lpPathBuf_out, pcchPathBuf_in_out, pcchArgsOffset_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiprovidecomponentfromdescriptorw
  public static MsiProvideComponentFromDescriptorW(szDescriptor: LPCWSTR, lpPathBuf_out: OPTIONAL<LPWSTR>, pcchPathBuf_in_out: OPTIONAL<LPDWORD>, pcchArgsOffset_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiProvideComponentFromDescriptorW')(szDescriptor, lpPathBuf_out, pcchPathBuf_in_out, pcchArgsOffset_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiprovidecomponentw
  public static MsiProvideComponentW(szProduct: LPCWSTR, szFeature: LPCWSTR, szComponent: LPCWSTR, dwInstallMode: DWORD, lpPathBuf_out: OPTIONAL<LPWSTR>, pcchPathBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiProvideComponentW')(szProduct, szFeature, szComponent, dwInstallMode, lpPathBuf_out, pcchPathBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiprovidequalifiedcomponenta
  public static MsiProvideQualifiedComponentA(szCategory: LPCSTR, szQualifier: LPCSTR, dwInstallMode: DWORD, lpPathBuf_out: OPTIONAL<LPSTR>, pcchPathBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiProvideQualifiedComponentA')(szCategory, szQualifier, dwInstallMode, lpPathBuf_out, pcchPathBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiprovidequalifiedcomponentexa
  public static MsiProvideQualifiedComponentExA(szCategory: LPCSTR, szQualifier: LPCSTR, dwInstallMode: DWORD, szProduct: OPTIONAL<LPCSTR>, dwUnused: DWORD, lpPathBuf_out: OPTIONAL<LPSTR>, pcchPathBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiProvideQualifiedComponentExA')(szCategory, szQualifier, dwInstallMode, szProduct, dwUnused, lpPathBuf_out, pcchPathBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiprovidequalifiedcomponentexw
  public static MsiProvideQualifiedComponentExW(szCategory: LPCWSTR, szQualifier: LPCWSTR, dwInstallMode: DWORD, szProduct: OPTIONAL<LPCWSTR>, dwUnused: DWORD, lpPathBuf_out: OPTIONAL<LPWSTR>, pcchPathBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiProvideQualifiedComponentExW')(szCategory, szQualifier, dwInstallMode, szProduct, dwUnused, lpPathBuf_out, pcchPathBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiprovidequalifiedcomponentw
  public static MsiProvideQualifiedComponentW(szCategory: LPCWSTR, szQualifier: LPCWSTR, dwInstallMode: DWORD, lpPathBuf_out: OPTIONAL<LPWSTR>, pcchPathBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiProvideQualifiedComponentW')(szCategory, szQualifier, dwInstallMode, lpPathBuf_out, pcchPathBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiquerycomponentstatea
  public static MsiQueryComponentStateA(szProductCode: LPCSTR, szUserSid: OPTIONAL<LPCSTR>, dwContext: DWORD, szComponentCode: LPCSTR, pdwState_out: OPTIONAL<PINSTALLSTATE>): UINT {
    return Msi.Load('MsiQueryComponentStateA')(szProductCode, szUserSid, dwContext, szComponentCode, pdwState_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiquerycomponentstatew
  public static MsiQueryComponentStateW(szProductCode: LPCWSTR, szUserSid: OPTIONAL<LPCWSTR>, dwContext: DWORD, szComponentCode: LPCWSTR, pdwState_out: OPTIONAL<PINSTALLSTATE>): UINT {
    return Msi.Load('MsiQueryComponentStateW')(szProductCode, szUserSid, dwContext, szComponentCode, pdwState_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiqueryfeaturestatea
  public static MsiQueryFeatureStateA(szProduct: LPCSTR, szFeature: LPCSTR): INSTALLSTATE {
    return Msi.Load('MsiQueryFeatureStateA')(szProduct, szFeature);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiqueryfeaturestateexa
  public static MsiQueryFeatureStateExA(szProductCode: LPCSTR, szUserSid: OPTIONAL<LPCSTR>, dwContext: DWORD, szFeature: LPCSTR, pdwState_out: OPTIONAL<PINSTALLSTATE>): UINT {
    return Msi.Load('MsiQueryFeatureStateExA')(szProductCode, szUserSid, dwContext, szFeature, pdwState_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiqueryfeaturestateexw
  public static MsiQueryFeatureStateExW(szProductCode: LPCWSTR, szUserSid: OPTIONAL<LPCWSTR>, dwContext: DWORD, szFeature: LPCWSTR, pdwState_out: OPTIONAL<PINSTALLSTATE>): UINT {
    return Msi.Load('MsiQueryFeatureStateExW')(szProductCode, szUserSid, dwContext, szFeature, pdwState_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiqueryfeaturestatefromdescriptora
  public static MsiQueryFeatureStateFromDescriptorA(szDescriptor: LPCSTR): INSTALLSTATE {
    return Msi.Load('MsiQueryFeatureStateFromDescriptorA')(szDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiqueryfeaturestatefromdescriptorw
  public static MsiQueryFeatureStateFromDescriptorW(szDescriptor: LPCWSTR): INSTALLSTATE {
    return Msi.Load('MsiQueryFeatureStateFromDescriptorW')(szDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiqueryfeaturestatew
  public static MsiQueryFeatureStateW(szProduct: LPCWSTR, szFeature: LPCWSTR): INSTALLSTATE {
    return Msi.Load('MsiQueryFeatureStateW')(szProduct, szFeature);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiqueryproductstatea
  public static MsiQueryProductStateA(szProduct: LPCSTR): INSTALLSTATE {
    return Msi.Load('MsiQueryProductStateA')(szProduct);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiqueryproductstatew
  public static MsiQueryProductStateW(szProduct: LPCWSTR): INSTALLSTATE {
    return Msi.Load('MsiQueryProductStateW')(szProduct);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msirecordcleardata
  public static MsiRecordClearData(hRecord: MSIHANDLE): UINT {
    return Msi.Load('MsiRecordClearData')(hRecord);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msirecorddatasize
  public static MsiRecordDataSize(hRecord: MSIHANDLE, iField: UINT): UINT {
    return Msi.Load('MsiRecordDataSize')(hRecord, iField);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msirecordgetfieldcount
  public static MsiRecordGetFieldCount(hRecord: MSIHANDLE): UINT {
    return Msi.Load('MsiRecordGetFieldCount')(hRecord);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msirecordgetinteger
  public static MsiRecordGetInteger(hRecord: MSIHANDLE, iField: UINT): INT {
    return Msi.Load('MsiRecordGetInteger')(hRecord, iField);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msirecordgetstringa
  public static MsiRecordGetStringA(hRecord: MSIHANDLE, iField: UINT, szValueBuf_out: OPTIONAL<LPSTR>, pcchValueBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiRecordGetStringA')(hRecord, iField, szValueBuf_out, pcchValueBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msirecordgetstringw
  public static MsiRecordGetStringW(hRecord: MSIHANDLE, iField: UINT, szValueBuf_out: OPTIONAL<LPWSTR>, pcchValueBuf_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiRecordGetStringW')(hRecord, iField, szValueBuf_out, pcchValueBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msirecordisnull
  public static MsiRecordIsNull(hRecord: MSIHANDLE, iField: UINT): BOOL {
    return Msi.Load('MsiRecordIsNull')(hRecord, iField);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msirecordreadstream
  public static MsiRecordReadStream(hRecord: MSIHANDLE, iField: UINT, szDataBuf_out: OPTIONAL<LPSTR>, pcbDataBuf_in_out: LPDWORD): UINT {
    return Msi.Load('MsiRecordReadStream')(hRecord, iField, szDataBuf_out, pcbDataBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msirecordsetinteger
  public static MsiRecordSetInteger(hRecord: MSIHANDLE, iField: UINT, iValue: INT): UINT {
    return Msi.Load('MsiRecordSetInteger')(hRecord, iField, iValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msirecordsetstreama
  public static MsiRecordSetStreamA(hRecord: MSIHANDLE, iField: UINT, szFilePath: NULLABLE<LPCSTR>): UINT {
    return Msi.Load('MsiRecordSetStreamA')(hRecord, iField, szFilePath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msirecordsetstreamw
  public static MsiRecordSetStreamW(hRecord: MSIHANDLE, iField: UINT, szFilePath: NULLABLE<LPCWSTR>): UINT {
    return Msi.Load('MsiRecordSetStreamW')(hRecord, iField, szFilePath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msirecordsetstringa
  public static MsiRecordSetStringA(hRecord: MSIHANDLE, iField: UINT, szValue: LPCSTR): UINT {
    return Msi.Load('MsiRecordSetStringA')(hRecord, iField, szValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msirecordsetstringw
  public static MsiRecordSetStringW(hRecord: MSIHANDLE, iField: UINT, szValue: LPCWSTR): UINT {
    return Msi.Load('MsiRecordSetStringW')(hRecord, iField, szValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msireinstallfeaturea
  public static MsiReinstallFeatureA(szProduct: LPCSTR, szFeature: LPCSTR, dwReinstallMode: DWORD): UINT {
    return Msi.Load('MsiReinstallFeatureA')(szProduct, szFeature, dwReinstallMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msireinstallfeaturefromdescriptora
  public static MsiReinstallFeatureFromDescriptorA(szDescriptor: LPCSTR, dwReinstallMode: DWORD): UINT {
    return Msi.Load('MsiReinstallFeatureFromDescriptorA')(szDescriptor, dwReinstallMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msireinstallfeaturefromdescriptorw
  public static MsiReinstallFeatureFromDescriptorW(szDescriptor: LPCWSTR, dwReinstallMode: DWORD): UINT {
    return Msi.Load('MsiReinstallFeatureFromDescriptorW')(szDescriptor, dwReinstallMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msireinstallfeaturew
  public static MsiReinstallFeatureW(szProduct: LPCWSTR, szFeature: LPCWSTR, dwReinstallMode: DWORD): UINT {
    return Msi.Load('MsiReinstallFeatureW')(szProduct, szFeature, dwReinstallMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msireinstallproducta
  public static MsiReinstallProductA(szProduct: LPCSTR, dwReinstallMode: DWORD): UINT {
    return Msi.Load('MsiReinstallProductA')(szProduct, dwReinstallMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msireinstallproductw
  public static MsiReinstallProductW(szProduct: LPCWSTR, dwReinstallMode: DWORD): UINT {
    return Msi.Load('MsiReinstallProductW')(szProduct, dwReinstallMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiremovepatchesa
  public static MsiRemovePatchesA(szPatchList: LPCSTR, szProductCode: LPCSTR, eUninstallType: INSTALLTYPE, szPropertyList: OPTIONAL<LPCSTR>): UINT {
    return Msi.Load('MsiRemovePatchesA')(szPatchList, szProductCode, eUninstallType, szPropertyList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiremovepatchesw
  public static MsiRemovePatchesW(szPatchList: LPCWSTR, szProductCode: LPCWSTR, eUninstallType: INSTALLTYPE, szPropertyList: OPTIONAL<LPCWSTR>): UINT {
    return Msi.Load('MsiRemovePatchesW')(szPatchList, szProductCode, eUninstallType, szPropertyList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisequencea
  public static MsiSequenceA(hInstall: MSIHANDLE, szTable: LPCSTR, iSequenceMode: INT): UINT {
    return Msi.Load('MsiSequenceA')(hInstall, szTable, iSequenceMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisequencew
  public static MsiSequenceW(hInstall: MSIHANDLE, szTable: LPCWSTR, iSequenceMode: INT): UINT {
    return Msi.Load('MsiSequenceW')(hInstall, szTable, iSequenceMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisetcomponentstatea
  public static MsiSetComponentStateA(hInstall: MSIHANDLE, szComponent: LPCSTR, iState: INSTALLSTATE): UINT {
    return Msi.Load('MsiSetComponentStateA')(hInstall, szComponent, iState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisetcomponentstatew
  public static MsiSetComponentStateW(hInstall: MSIHANDLE, szComponent: LPCWSTR, iState: INSTALLSTATE): UINT {
    return Msi.Load('MsiSetComponentStateW')(hInstall, szComponent, iState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisetexternaluia
  public static MsiSetExternalUIA(puiHandler: OPTIONAL<INSTALLUI_HANDLERA>, dwMessageFilter: DWORD, pvContext: OPTIONAL<LPVOID>): INSTALLUI_HANDLERA {
    return Msi.Load('MsiSetExternalUIA')(puiHandler, dwMessageFilter, pvContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisetexternaluirecord
  public static MsiSetExternalUIRecord(puiHandler: OPTIONAL<INSTALLUI_HANDLER_RECORD>, dwMessageFilter: DWORD, pvContext: OPTIONAL<LPVOID>, ppuiPrevHandler_out: OPTIONAL<PINSTALLUI_HANDLER_RECORD>): UINT {
    return Msi.Load('MsiSetExternalUIRecord')(puiHandler, dwMessageFilter, pvContext, ppuiPrevHandler_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisetexternaluiw
  public static MsiSetExternalUIW(puiHandler: OPTIONAL<INSTALLUI_HANDLERW>, dwMessageFilter: DWORD, pvContext: OPTIONAL<LPVOID>): INSTALLUI_HANDLERW {
    return Msi.Load('MsiSetExternalUIW')(puiHandler, dwMessageFilter, pvContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisetfeatureattributesa
  public static MsiSetFeatureAttributesA(hInstall: MSIHANDLE, szFeature: LPCSTR, dwAttributes: DWORD): UINT {
    return Msi.Load('MsiSetFeatureAttributesA')(hInstall, szFeature, dwAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisetfeatureattributesw
  public static MsiSetFeatureAttributesW(hInstall: MSIHANDLE, szFeature: LPCWSTR, dwAttributes: DWORD): UINT {
    return Msi.Load('MsiSetFeatureAttributesW')(hInstall, szFeature, dwAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisetfeaturestatea
  public static MsiSetFeatureStateA(hInstall: MSIHANDLE, szFeature: LPCSTR, iState: INSTALLSTATE): UINT {
    return Msi.Load('MsiSetFeatureStateA')(hInstall, szFeature, iState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisetfeaturestatew
  public static MsiSetFeatureStateW(hInstall: MSIHANDLE, szFeature: LPCWSTR, iState: INSTALLSTATE): UINT {
    return Msi.Load('MsiSetFeatureStateW')(hInstall, szFeature, iState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisetinstalllevel
  public static MsiSetInstallLevel(hInstall: MSIHANDLE, iInstallLevel: INT): UINT {
    return Msi.Load('MsiSetInstallLevel')(hInstall, iInstallLevel);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisetinternalui
  public static MsiSetInternalUI(dwUILevel: INSTALLUILEVEL, phWnd_in_out: OPTIONAL<PHWND>): INSTALLUILEVEL {
    return Msi.Load('MsiSetInternalUI')(dwUILevel, phWnd_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisetmode
  public static MsiSetMode(hInstall: MSIHANDLE, eRunMode: MSIRUNMODE, fState: BOOL): UINT {
    return Msi.Load('MsiSetMode')(hInstall, eRunMode, fState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisetpropertya
  public static MsiSetPropertyA(hInstall: MSIHANDLE, szName: LPCSTR, szValue: NULLABLE<LPCSTR>): UINT {
    return Msi.Load('MsiSetPropertyA')(hInstall, szName, szValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisetpropertyw
  public static MsiSetPropertyW(hInstall: MSIHANDLE, szName: LPCWSTR, szValue: NULLABLE<LPCWSTR>): UINT {
    return Msi.Load('MsiSetPropertyW')(hInstall, szName, szValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisettargetpatha
  public static MsiSetTargetPathA(hInstall: MSIHANDLE, szFolder: LPCSTR, szFolderPath: LPCSTR): UINT {
    return Msi.Load('MsiSetTargetPathA')(hInstall, szFolder, szFolderPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisettargetpathw
  public static MsiSetTargetPathW(hInstall: MSIHANDLE, szFolder: LPCWSTR, szFolderPath: LPCWSTR): UINT {
    return Msi.Load('MsiSetTargetPathW')(hInstall, szFolder, szFolderPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistaddmediadiska
  public static MsiSourceListAddMediaDiskA(szProductCodeOrPatchCode: LPCSTR, szUserSid: OPTIONAL<LPCSTR>, dwContext: DWORD, dwOptions: DWORD, dwDiskId: DWORD, szVolumeLabel: OPTIONAL<LPCSTR>, szDiskPrompt: OPTIONAL<LPCSTR>): UINT {
    return Msi.Load('MsiSourceListAddMediaDiskA')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, dwDiskId, szVolumeLabel, szDiskPrompt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistaddmediadiskw
  public static MsiSourceListAddMediaDiskW(szProductCodeOrPatchCode: LPCWSTR, szUserSid: OPTIONAL<LPCWSTR>, dwContext: DWORD, dwOptions: DWORD, dwDiskId: DWORD, szVolumeLabel: OPTIONAL<LPCWSTR>, szDiskPrompt: OPTIONAL<LPCWSTR>): UINT {
    return Msi.Load('MsiSourceListAddMediaDiskW')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, dwDiskId, szVolumeLabel, szDiskPrompt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistaddsourcea
  public static MsiSourceListAddSourceA(szProduct: LPCSTR, szUserName: OPTIONAL<LPCSTR>, dwReserved: DWORD, szSource: LPCSTR): UINT {
    return Msi.Load('MsiSourceListAddSourceA')(szProduct, szUserName, dwReserved, szSource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistaddsourceexa
  public static MsiSourceListAddSourceExA(szProductCodeOrPatchCode: LPCSTR, szUserSid: OPTIONAL<LPCSTR>, dwContext: DWORD, dwOptions: DWORD, szSource: LPCSTR, dwIndex: DWORD): UINT {
    return Msi.Load('MsiSourceListAddSourceExA')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, szSource, dwIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistaddsourceexw
  public static MsiSourceListAddSourceExW(szProductCodeOrPatchCode: LPCWSTR, szUserSid: OPTIONAL<LPCWSTR>, dwContext: DWORD, dwOptions: DWORD, szSource: LPCWSTR, dwIndex: DWORD): UINT {
    return Msi.Load('MsiSourceListAddSourceExW')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, szSource, dwIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistaddsourcew
  public static MsiSourceListAddSourceW(szProduct: LPCWSTR, szUserName: OPTIONAL<LPCWSTR>, dwReserved: DWORD, szSource: LPCWSTR): UINT {
    return Msi.Load('MsiSourceListAddSourceW')(szProduct, szUserName, dwReserved, szSource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistclearalla
  public static MsiSourceListClearAllA(szProduct: LPCSTR, szUserName: OPTIONAL<LPCSTR>, dwReserved: DWORD): UINT {
    return Msi.Load('MsiSourceListClearAllA')(szProduct, szUserName, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistclearallexa
  public static MsiSourceListClearAllExA(szProductCodeOrPatchCode: LPCSTR, szUserSid: OPTIONAL<LPCSTR>, dwContext: DWORD, dwOptions: DWORD): UINT {
    return Msi.Load('MsiSourceListClearAllExA')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistclearallexw
  public static MsiSourceListClearAllExW(szProductCodeOrPatchCode: LPCWSTR, szUserSid: OPTIONAL<LPCWSTR>, dwContext: DWORD, dwOptions: DWORD): UINT {
    return Msi.Load('MsiSourceListClearAllExW')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistclearallw
  public static MsiSourceListClearAllW(szProduct: LPCWSTR, szUserName: OPTIONAL<LPCWSTR>, dwReserved: DWORD): UINT {
    return Msi.Load('MsiSourceListClearAllW')(szProduct, szUserName, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistclearmediadiska
  public static MsiSourceListClearMediaDiskA(szProductCodeOrPatchCode: LPCSTR, szUserSid: OPTIONAL<LPCSTR>, dwContext: DWORD, dwOptions: DWORD, dwDiskId: DWORD): UINT {
    return Msi.Load('MsiSourceListClearMediaDiskA')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, dwDiskId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistclearmediadiskw
  public static MsiSourceListClearMediaDiskW(szProductCodeOrPatchCode: LPCWSTR, szUserSid: OPTIONAL<LPCWSTR>, dwContext: DWORD, dwOptions: DWORD, dwDiskId: DWORD): UINT {
    return Msi.Load('MsiSourceListClearMediaDiskW')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, dwDiskId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistclearsourcea
  public static MsiSourceListClearSourceA(szProductCodeOrPatchCode: LPCSTR, szUserSid: OPTIONAL<LPCSTR>, dwContext: DWORD, dwOptions: DWORD, szSource: LPCSTR): UINT {
    return Msi.Load('MsiSourceListClearSourceA')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, szSource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistclearsourcew
  public static MsiSourceListClearSourceW(szProductCodeOrPatchCode: LPCWSTR, szUserSid: OPTIONAL<LPCWSTR>, dwContext: DWORD, dwOptions: DWORD, szSource: LPCWSTR): UINT {
    return Msi.Load('MsiSourceListClearSourceW')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, szSource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistenummediadisksa
  public static MsiSourceListEnumMediaDisksA(
    szProductCodeOrPatchCode: LPCSTR,
    szUserSid: OPTIONAL<LPCSTR>,
    dwContext: DWORD,
    dwOptions: DWORD,
    dwIndex: DWORD,
    pdwDiskId_out: OPTIONAL<LPDWORD>,
    szVolumeLabel_out: OPTIONAL<LPSTR>,
    pcchVolumeLabel_in_out: OPTIONAL<LPDWORD>,
    szDiskPrompt_out: OPTIONAL<LPSTR>,
    pcchDiskPrompt_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiSourceListEnumMediaDisksA')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, dwIndex, pdwDiskId_out, szVolumeLabel_out, pcchVolumeLabel_in_out, szDiskPrompt_out, pcchDiskPrompt_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistenummediadisksw
  public static MsiSourceListEnumMediaDisksW(
    szProductCodeOrPatchCode: LPCWSTR,
    szUserSid: OPTIONAL<LPCWSTR>,
    dwContext: DWORD,
    dwOptions: DWORD,
    dwIndex: DWORD,
    pdwDiskId_out: OPTIONAL<LPDWORD>,
    szVolumeLabel_out: OPTIONAL<LPWSTR>,
    pcchVolumeLabel_in_out: OPTIONAL<LPDWORD>,
    szDiskPrompt_out: OPTIONAL<LPWSTR>,
    pcchDiskPrompt_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiSourceListEnumMediaDisksW')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, dwIndex, pdwDiskId_out, szVolumeLabel_out, pcchVolumeLabel_in_out, szDiskPrompt_out, pcchDiskPrompt_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistenumsourcesa
  public static MsiSourceListEnumSourcesA(szProductCodeOrPatchCode: LPCSTR, szUserSid: OPTIONAL<LPCSTR>, dwContext: DWORD, dwOptions: DWORD, dwIndex: DWORD, szSource_out: OPTIONAL<LPSTR>, pcchSource_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiSourceListEnumSourcesA')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, dwIndex, szSource_out, pcchSource_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistenumsourcesw
  public static MsiSourceListEnumSourcesW(szProductCodeOrPatchCode: LPCWSTR, szUserSid: OPTIONAL<LPCWSTR>, dwContext: DWORD, dwOptions: DWORD, dwIndex: DWORD, szSource_out: OPTIONAL<LPWSTR>, pcchSource_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiSourceListEnumSourcesW')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, dwIndex, szSource_out, pcchSource_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistforceresolutiona
  public static MsiSourceListForceResolutionA(szProduct: LPCSTR, szUserName: OPTIONAL<LPCSTR>, dwReserved: DWORD): UINT {
    return Msi.Load('MsiSourceListForceResolutionA')(szProduct, szUserName, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistforceresolutionexa
  public static MsiSourceListForceResolutionExA(szProductCodeOrPatchCode: LPCSTR, szUserSid: OPTIONAL<LPCSTR>, dwContext: DWORD, dwOptions: DWORD): UINT {
    return Msi.Load('MsiSourceListForceResolutionExA')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistforceresolutionexw
  public static MsiSourceListForceResolutionExW(szProductCodeOrPatchCode: LPCWSTR, szUserSid: OPTIONAL<LPCWSTR>, dwContext: DWORD, dwOptions: DWORD): UINT {
    return Msi.Load('MsiSourceListForceResolutionExW')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistforceresolutionw
  public static MsiSourceListForceResolutionW(szProduct: LPCWSTR, szUserName: OPTIONAL<LPCWSTR>, dwReserved: DWORD): UINT {
    return Msi.Load('MsiSourceListForceResolutionW')(szProduct, szUserName, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistgetinfoa
  public static MsiSourceListGetInfoA(szProductCodeOrPatchCode: LPCSTR, szUserSid: OPTIONAL<LPCSTR>, dwContext: DWORD, dwOptions: DWORD, szProperty: LPCSTR, szValue_out: OPTIONAL<LPSTR>, pcchValue_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiSourceListGetInfoA')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, szProperty, szValue_out, pcchValue_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistgetinfow
  public static MsiSourceListGetInfoW(szProductCodeOrPatchCode: LPCWSTR, szUserSid: OPTIONAL<LPCWSTR>, dwContext: DWORD, dwOptions: DWORD, szProperty: LPCWSTR, szValue_out: OPTIONAL<LPWSTR>, pcchValue_in_out: OPTIONAL<LPDWORD>): UINT {
    return Msi.Load('MsiSourceListGetInfoW')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, szProperty, szValue_out, pcchValue_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistsetinfoa
  public static MsiSourceListSetInfoA(szProductCodeOrPatchCode: LPCSTR, szUserSid: OPTIONAL<LPCSTR>, dwContext: DWORD, dwOptions: DWORD, szProperty: LPCSTR, szValue: LPCSTR): UINT {
    return Msi.Load('MsiSourceListSetInfoA')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, szProperty, szValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msisourcelistsetinfow
  public static MsiSourceListSetInfoW(szProductCodeOrPatchCode: LPCWSTR, szUserSid: OPTIONAL<LPCWSTR>, dwContext: DWORD, dwOptions: DWORD, szProperty: LPCWSTR, szValue: LPCWSTR): UINT {
    return Msi.Load('MsiSourceListSetInfoW')(szProductCodeOrPatchCode, szUserSid, dwContext, dwOptions, szProperty, szValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisummaryinfogetpropertya
  public static MsiSummaryInfoGetPropertyA(
    hSummaryInfo: MSIHANDLE,
    uiProperty: UINT,
    puiDataType_out: PUINT,
    piValue_out: PINT,
    pftValue_out: OPTIONAL<PFILETIME>,
    szValueBuf_out: OPTIONAL<LPSTR>,
    pcchValueBuf_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiSummaryInfoGetPropertyA')(hSummaryInfo, uiProperty, puiDataType_out, piValue_out, pftValue_out, szValueBuf_out, pcchValueBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisummaryinfogetpropertycount
  public static MsiSummaryInfoGetPropertyCount(hSummaryInfo: MSIHANDLE, puiPropertyCount_out: PUINT): UINT {
    return Msi.Load('MsiSummaryInfoGetPropertyCount')(hSummaryInfo, puiPropertyCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisummaryinfogetpropertyw
  public static MsiSummaryInfoGetPropertyW(
    hSummaryInfo: MSIHANDLE,
    uiProperty: UINT,
    puiDataType_out: PUINT,
    piValue_out: PINT,
    pftValue_out: OPTIONAL<PFILETIME>,
    szValueBuf_out: OPTIONAL<LPWSTR>,
    pcchValueBuf_in_out: OPTIONAL<LPDWORD>,
  ): UINT {
    return Msi.Load('MsiSummaryInfoGetPropertyW')(hSummaryInfo, uiProperty, puiDataType_out, piValue_out, pftValue_out, szValueBuf_out, pcchValueBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisummaryinfopersist
  public static MsiSummaryInfoPersist(hSummaryInfo: MSIHANDLE): UINT {
    return Msi.Load('MsiSummaryInfoPersist')(hSummaryInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisummaryinfosetpropertya
  public static MsiSummaryInfoSetPropertyA(hSummaryInfo: MSIHANDLE, uiProperty: UINT, uiDataType: UINT, iValue: INT, pftValue: NULLABLE<PFILETIME>, szValue: NULLABLE<LPCSTR>): UINT {
    return Msi.Load('MsiSummaryInfoSetPropertyA')(hSummaryInfo, uiProperty, uiDataType, iValue, pftValue, szValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msisummaryinfosetpropertyw
  public static MsiSummaryInfoSetPropertyW(hSummaryInfo: MSIHANDLE, uiProperty: UINT, uiDataType: UINT, iValue: INT, pftValue: NULLABLE<PFILETIME>, szValue: NULLABLE<LPCWSTR>): UINT {
    return Msi.Load('MsiSummaryInfoSetPropertyW')(hSummaryInfo, uiProperty, uiDataType, iValue, pftValue, szValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiusefeaturea
  public static MsiUseFeatureA(szProduct: LPCSTR, szFeature: LPCSTR): INSTALLSTATE {
    return Msi.Load('MsiUseFeatureA')(szProduct, szFeature);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiusefeatureexa
  public static MsiUseFeatureExA(szProduct: LPCSTR, szFeature: LPCSTR, dwInstallMode: DWORD, dwReserved: DWORD): INSTALLSTATE {
    return Msi.Load('MsiUseFeatureExA')(szProduct, szFeature, dwInstallMode, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiusefeatureexw
  public static MsiUseFeatureExW(szProduct: LPCWSTR, szFeature: LPCWSTR, dwInstallMode: DWORD, dwReserved: DWORD): INSTALLSTATE {
    return Msi.Load('MsiUseFeatureExW')(szProduct, szFeature, dwInstallMode, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiusefeaturew
  public static MsiUseFeatureW(szProduct: LPCWSTR, szFeature: LPCWSTR): INSTALLSTATE {
    return Msi.Load('MsiUseFeatureW')(szProduct, szFeature);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msiverifydicspace
  public static MsiVerifyDiskSpace(hInstall: MSIHANDLE): UINT {
    return Msi.Load('MsiVerifyDiskSpace')(hInstall);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiverifypackagea
  public static MsiVerifyPackageA(szPackagePath: LPCSTR): UINT {
    return Msi.Load('MsiVerifyPackageA')(szPackagePath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msi/nf-msi-msiverifypackagew
  public static MsiVerifyPackageW(szPackagePath: LPCWSTR): UINT {
    return Msi.Load('MsiVerifyPackageW')(szPackagePath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msiviewclose
  public static MsiViewClose(hView: MSIHANDLE): UINT {
    return Msi.Load('MsiViewClose')(hView);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msiviewexecute
  public static MsiViewExecute(hView: MSIHANDLE, hRecord: MSIHANDLE): UINT {
    return Msi.Load('MsiViewExecute')(hView, hRecord);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msiviewfetch
  public static MsiViewFetch(hView: MSIHANDLE, phRecord_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiViewFetch')(hView, phRecord_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msiviewgetcolumninfo
  public static MsiViewGetColumnInfo(hView: MSIHANDLE, eColumnInfo: MSICOLINFO, phRecord_out: PMSIHANDLE): UINT {
    return Msi.Load('MsiViewGetColumnInfo')(hView, eColumnInfo, phRecord_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msiviewgeterrora
  public static MsiViewGetErrorA(hView: MSIHANDLE, szColumnNameBuffer_out: OPTIONAL<LPSTR>, pcchBuf_in_out: OPTIONAL<LPDWORD>): MSIDBERROR {
    return Msi.Load('MsiViewGetErrorA')(hView, szColumnNameBuffer_out, pcchBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msiviewgeterrorw
  public static MsiViewGetErrorW(hView: MSIHANDLE, szColumnNameBuffer_out: OPTIONAL<LPWSTR>, pcchBuf_in_out: OPTIONAL<LPDWORD>): MSIDBERROR {
    return Msi.Load('MsiViewGetErrorW')(hView, szColumnNameBuffer_out, pcchBuf_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/msiquery/nf-msiquery-msiviewmodify
  public static MsiViewModify(hView: MSIHANDLE, eModifyMode: MSIMODIFY, hRecord: MSIHANDLE): UINT {
    return Msi.Load('MsiViewModify')(hView, eModifyMode, hRecord);
  }
}

export default Msi;
