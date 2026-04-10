import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  CONFIGRET,
  CONFLICT_LIST,
  DEVINST,
  DEVINSTID_A,
  DEVINSTID_W,
  DEVNODE,
  DEVPROPTYPE,
  DWORD,
  DWORDLONG,
  HCMNOTIFICATION,
  HDEVQUERY,
  HMACHINE,
  HRESULT,
  HSWDEVICE,
  LPCGUID,
  LPCSTR,
  LPCWSTR,
  LPGUID,
  LPSTR,
  LPWSTR,
  LOG_CONF,
  NULL,
  PBOOL,
  PBYTE,
  PCONFLICT_DETAILS_A,
  PCONFLICT_DETAILS_W,
  PCONFLICT_LIST,
  PCSTR,
  PCVOID,
  PCWSTR,
  PCZZWSTR,
  PDEVINST,
  PDEVPROPKEY,
  PDEVPROPTYPE,
  PDWORD,
  PDWORDLONG,
  PHCMNOTIFICATION,
  PHDEVQUERY,
  PHKEY,
  PHMACHINE,
  PHSWDEVICE,
  PHWPROFILEINFO_A,
  PHWPROFILEINFO_W,
  PLOG_CONF,
  PPNP_VETO_TYPE,
  PPRIORITY,
  PRANGE_ELEMENT,
  PRANGE_LIST,
  PRESOURCEID,
  PRES_DES,
  PRIORITY,
  PSTR,
  PSW_DEVICE_LIFETIME,
  PULONG,
  PVOID,
  PWSTR,
  RANGE_ELEMENT,
  RANGE_LIST,
  REGDISPOSITION,
  REGSAM,
  RESOURCEID,
  RES_DES,
  ULONG,
  WORD,
} from '../types/Cfgmgr32';

/**
 * Thin, lazy-loaded FFI bindings for `cfgmgr32.dll`.
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
 * import Cfgmgr32 from './structs/Cfgmgr32';
 *
 * // Lazy: bind on first call
 * const result = Cfgmgr32.CM_Locate_DevNodeW(devInstBuf.ptr, null, 0);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Cfgmgr32.Preload(['CM_Locate_DevNodeW', 'CM_Get_Device_IDW']);
 * ```
 */
class Cfgmgr32 extends Win32 {
  protected static override name = 'cfgmgr32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CM_Add_Empty_Log_Conf: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Add_Empty_Log_Conf_Ex: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Add_IDA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Add_IDW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Add_ID_ExA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Add_ID_ExW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Add_Range: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    CM_Add_Res_Des: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Add_Res_Des_Ex: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Apply_PowerScheme: { args: [], returns: FFIType.u32 },
    CMP_WaitNoPendingInstallEvents: { args: [FFIType.u32], returns: FFIType.u32 },
    CM_Connect_MachineA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CM_Connect_MachineW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CM_Create_DevNodeA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Create_DevNodeW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Create_DevNode_ExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Create_DevNode_ExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Create_Range_List: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Delete_Class_Key: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Delete_Class_Key_Ex: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Delete_DevNode_Key: { args: [FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Delete_DevNode_Key_Ex: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Delete_Device_Interface_KeyA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Delete_Device_Interface_KeyW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Delete_Device_Interface_Key_ExA: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Delete_Device_Interface_Key_ExW: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Delete_PowerScheme: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CM_Delete_Range: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    CM_Detect_Resource_Conflict: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Detect_Resource_Conflict_Ex: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Disable_DevNode: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Disable_DevNode_Ex: { args: [FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Disconnect_Machine: { args: [FFIType.u64], returns: FFIType.u32 },
    CM_Dup_Range_List: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    CM_Duplicate_PowerScheme: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CM_Enable_DevNode: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Enable_DevNode_Ex: { args: [FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Enumerate_Classes: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Enumerate_Classes_Ex: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Enumerate_EnumeratorsA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Enumerate_EnumeratorsW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Enumerate_Enumerators_ExA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Enumerate_Enumerators_ExW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Find_Range: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    CM_First_Range: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Free_Log_Conf: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    CM_Free_Log_Conf_Ex: { args: [FFIType.u64, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Free_Log_Conf_Handle: { args: [FFIType.u64], returns: FFIType.u32 },
    CM_Free_Range_List: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    CM_Free_Res_Des: { args: [FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    CM_Free_Res_Des_Ex: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Free_Res_Des_Handle: { args: [FFIType.u64], returns: FFIType.u32 },
    CM_Free_Resource_Conflict_Handle: { args: [FFIType.u64], returns: FFIType.u32 },
    CM_Get_Child: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Child_Ex: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Class_Key_NameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Class_Key_NameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Class_Key_Name_ExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Class_Key_Name_ExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Class_NameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Class_NameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Class_Name_ExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Class_Name_ExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Class_PropertyW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Class_Property_ExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Class_Property_Keys: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Class_Property_Keys_Ex: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Class_Registry_PropertyA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Class_Registry_PropertyW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Depth: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Depth_Ex: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_DevNode_Custom_PropertyA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_DevNode_Custom_PropertyW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_DevNode_Custom_Property_ExA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_DevNode_Custom_Property_ExW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_DevNode_PropertyW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_DevNode_Property_ExW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_DevNode_Property_Keys: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_DevNode_Property_Keys_Ex: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_DevNode_Registry_PropertyA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_DevNode_Registry_PropertyW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_DevNode_Registry_Property_ExA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_DevNode_Registry_Property_ExW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_DevNode_Status: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Get_DevNode_Status_Ex: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Device_IDA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Device_IDW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Device_ID_ExA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Device_ID_ExW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Device_ID_ListA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Device_ID_ListW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Device_ID_List_ExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Device_ID_List_ExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Device_ID_List_SizeA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Device_ID_List_SizeW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Device_ID_List_Size_ExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Device_ID_List_Size_ExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Device_ID_Size: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Device_ID_Size_Ex: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Device_Interface_AliasA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Device_Interface_AliasW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Device_Interface_Alias_ExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Device_Interface_Alias_ExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Device_Interface_ListA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Device_Interface_ListW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Device_Interface_List_ExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Device_Interface_List_ExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Device_Interface_List_SizeA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Device_Interface_List_SizeW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Device_Interface_List_Size_ExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Device_Interface_List_Size_ExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Device_Interface_PropertyW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Device_Interface_Property_ExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Device_Interface_Property_KeysW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Device_Interface_Property_Keys_ExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_First_Log_Conf: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Get_First_Log_Conf_Ex: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Global_State: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Global_State_Ex: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_HW_Prof_FlagsA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_HW_Prof_FlagsW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_HW_Prof_Flags_ExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_HW_Prof_Flags_ExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Hardware_Profile_InfoA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Hardware_Profile_InfoW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Hardware_Profile_Info_ExA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Hardware_Profile_Info_ExW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Log_Conf_Priority: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Log_Conf_Priority_Ex: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Next_Log_Conf: { args: [FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Next_Log_Conf_Ex: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Next_Res_Des: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Next_Res_Des_Ex: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Parent: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Parent_Ex: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Res_Des_Data: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Res_Des_Data_Ex: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Res_Des_Data_Size: { args: [FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Res_Des_Data_Size_Ex: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Resource_Conflict_Count: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    CM_Get_Resource_Conflict_DetailsA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    CM_Get_Resource_Conflict_DetailsW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    CM_Get_Sibling: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Get_Sibling_Ex: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Get_Version: { args: [], returns: FFIType.u16 },
    CM_Get_Version_Ex: { args: [FFIType.u64], returns: FFIType.u16 },
    CM_Import_PowerScheme: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CM_Intersect_Range_List: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    CM_Invert_Range_List: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    CM_Is_Dock_Station_Present: { args: [FFIType.ptr], returns: FFIType.u32 },
    CM_Is_Dock_Station_Present_Ex: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.u32 },
    CM_Is_Version_Available: { args: [FFIType.u16], returns: FFIType.i32 },
    CM_Is_Version_Available_Ex: { args: [FFIType.u16, FFIType.u64], returns: FFIType.i32 },
    CM_Locate_DevNodeA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Locate_DevNodeW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Locate_DevNode_ExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Locate_DevNode_ExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_MapCrToWin32Err: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Merge_Range_List: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    CM_Modify_Res_Des: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Modify_Res_Des_Ex: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Move_DevNode: { args: [FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Move_DevNode_Ex: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Next_Range: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Open_Class_KeyA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Open_Class_KeyW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Open_Class_Key_ExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Open_Class_Key_ExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Open_DevNode_Key: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Open_DevNode_Key_Ex: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Open_Device_Interface_KeyA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Open_Device_Interface_KeyW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Open_Device_Interface_Key_ExA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Open_Device_Interface_Key_ExW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Query_And_Remove_SubTreeA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Query_And_Remove_SubTreeW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Query_And_Remove_SubTree_ExA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Query_And_Remove_SubTree_ExW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Query_Arbitrator_Free_Data: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Query_Arbitrator_Free_Data_Ex: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Query_Arbitrator_Free_Size: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Query_Arbitrator_Free_Size_Ex: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Query_Remove_SubTree: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Query_Remove_SubTree_Ex: { args: [FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Query_Resource_Conflict_List: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Reenumerate_DevNode: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Reenumerate_DevNode_Ex: { args: [FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Register_Device_Driver: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Register_Device_Driver_Ex: { args: [FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Register_Device_InterfaceA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Register_Device_InterfaceW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Register_Device_Interface_ExA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Register_Device_Interface_ExW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Register_Notification: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CM_Remove_SubTree: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Remove_SubTree_Ex: { args: [FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Request_Device_EjectA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Request_Device_EjectW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Request_Device_Eject_ExA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Request_Device_Eject_ExW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Request_Eject_PC: { args: [], returns: FFIType.u32 },
    CM_Request_Eject_PC_Ex: { args: [FFIType.u64], returns: FFIType.u32 },
    CM_RestoreAll_DefaultPowerSchemes: { args: [FFIType.ptr], returns: FFIType.u32 },
    CM_Restore_DefaultPowerScheme: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CM_Run_Detection: { args: [FFIType.u32], returns: FFIType.u32 },
    CM_Run_Detection_Ex: { args: [FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Set_ActiveScheme: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CM_Set_Class_PropertyW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Set_Class_Property_ExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Set_Class_Registry_PropertyA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Set_Class_Registry_PropertyW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Set_DevNode_Problem: { args: [FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Set_DevNode_Problem_Ex: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Set_DevNode_PropertyW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Set_DevNode_Property_ExW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Set_DevNode_Registry_PropertyA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Set_DevNode_Registry_PropertyW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Set_DevNode_Registry_Property_ExA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Set_DevNode_Registry_Property_ExW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Set_Device_Interface_PropertyW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Set_Device_Interface_Property_ExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Set_HW_Prof: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Set_HW_Prof_Ex: { args: [FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Set_HW_Prof_FlagsA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Set_HW_Prof_FlagsW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Set_HW_Prof_Flags_ExA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Set_HW_Prof_Flags_ExW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Setup_DevNode: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Setup_DevNode_Ex: { args: [FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Test_Range_Available: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    CM_Uninstall_DevNode: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CM_Uninstall_DevNode_Ex: { args: [FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Unregister_Device_InterfaceA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Unregister_Device_InterfaceW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CM_Unregister_Device_Interface_ExA: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Unregister_Device_Interface_ExW: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CM_Unregister_Notification: { args: [FFIType.u64], returns: FFIType.u32 },
    CM_Write_UserPowerKey: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DevCloseObjectQuery: { args: [FFIType.u64], returns: FFIType.void },
    DevCreateObjectQuery: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DevCreateObjectQueryEx: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DevCreateObjectQueryFromId: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DevCreateObjectQueryFromIdEx: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DevCreateObjectQueryFromIds: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DevCreateObjectQueryFromIdsEx: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DevFindProperty: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    DevFreeObjectProperties: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    DevFreeObjects: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    DevGetObjectProperties: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DevGetObjectPropertiesEx: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DevGetObjects: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DevGetObjectsEx: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SwDeviceClose: { args: [FFIType.u64], returns: FFIType.void },
    SwDeviceCreate: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SwDeviceGetLifetime: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SwDeviceInterfacePropertySet: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SwDeviceInterfaceRegister: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SwDeviceInterfaceSetState: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SwDevicePropertySet: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SwDeviceSetLifetime: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SwMemFree: { args: [FFIType.ptr], returns: FFIType.void },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_add_empty_log_conf
  public static CM_Add_Empty_Log_Conf(plcLogConf: PLOG_CONF, dnDevInst: DEVINST, Priority: PRIORITY, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Add_Empty_Log_Conf')(plcLogConf, dnDevInst, Priority, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_add_empty_log_conf_ex
  public static CM_Add_Empty_Log_Conf_Ex(plcLogConf: PLOG_CONF, dnDevInst: DEVINST, Priority: PRIORITY, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Add_Empty_Log_Conf_Ex')(plcLogConf, dnDevInst, Priority, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_add_ida
  public static CM_Add_IDA(dnDevInst: DEVINST, pszID: PSTR, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Add_IDA')(dnDevInst, pszID, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_add_idw
  public static CM_Add_IDW(dnDevInst: DEVINST, pszID: PWSTR, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Add_IDW')(dnDevInst, pszID, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_add_id_exa
  public static CM_Add_ID_ExA(dnDevInst: DEVINST, pszID: PSTR, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Add_ID_ExA')(dnDevInst, pszID, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_add_id_exw
  public static CM_Add_ID_ExW(dnDevInst: DEVINST, pszID: PWSTR, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Add_ID_ExW')(dnDevInst, pszID, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_add_range
  public static CM_Add_Range(ullStartValue: DWORDLONG, ullEndValue: DWORDLONG, rlh: RANGE_LIST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Add_Range')(ullStartValue, ullEndValue, rlh, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_add_res_des
  public static CM_Add_Res_Des(prdResDes: PRES_DES | NULL, lcLogConf: LOG_CONF, ResourceID: RESOURCEID, ResourceData: PCVOID, ResourceLen: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Add_Res_Des')(prdResDes, lcLogConf, ResourceID, ResourceData, ResourceLen, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_add_res_des_ex
  public static CM_Add_Res_Des_Ex(prdResDes: PRES_DES | NULL, lcLogConf: LOG_CONF, ResourceID: RESOURCEID, ResourceData: PCVOID, ResourceLen: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Add_Res_Des_Ex')(prdResDes, lcLogConf, ResourceID, ResourceData, ResourceLen, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_apply_powerscheme
  public static CM_Apply_PowerScheme(): CONFIGRET {
    return Cfgmgr32.Load('CM_Apply_PowerScheme')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cmp_waitnopendinginstallevents
  public static CMP_WaitNoPendingInstallEvents(dwTimeout: DWORD): DWORD {
    return Cfgmgr32.Load('CMP_WaitNoPendingInstallEvents')(dwTimeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_connect_machinea
  public static CM_Connect_MachineA(UNCServerName: PCSTR | NULL, phMachine: PHMACHINE): CONFIGRET {
    return Cfgmgr32.Load('CM_Connect_MachineA')(UNCServerName, phMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_connect_machinew
  public static CM_Connect_MachineW(UNCServerName: PCWSTR | NULL, phMachine: PHMACHINE): CONFIGRET {
    return Cfgmgr32.Load('CM_Connect_MachineW')(UNCServerName, phMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_create_devnodea
  public static CM_Create_DevNodeA(pdnDevInst: PDEVINST, pDeviceID: DEVINSTID_A, dnParent: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Create_DevNodeA')(pdnDevInst, pDeviceID, dnParent, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_create_devnodew
  public static CM_Create_DevNodeW(pdnDevInst: PDEVINST, pDeviceID: DEVINSTID_W, dnParent: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Create_DevNodeW')(pdnDevInst, pDeviceID, dnParent, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_create_devnode_exa
  public static CM_Create_DevNode_ExA(pdnDevInst: PDEVINST, pDeviceID: DEVINSTID_A, dnParent: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Create_DevNode_ExA')(pdnDevInst, pDeviceID, dnParent, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_create_devnode_exw
  public static CM_Create_DevNode_ExW(pdnDevInst: PDEVINST, pDeviceID: DEVINSTID_W, dnParent: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Create_DevNode_ExW')(pdnDevInst, pDeviceID, dnParent, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_create_range_list
  public static CM_Create_Range_List(prlh: PRANGE_LIST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Create_Range_List')(prlh, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_delete_class_key
  public static CM_Delete_Class_Key(ClassGuid: LPGUID, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Delete_Class_Key')(ClassGuid, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_delete_class_key_ex
  public static CM_Delete_Class_Key_Ex(ClassGuid: LPGUID, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Delete_Class_Key_Ex')(ClassGuid, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_delete_devnode_key
  public static CM_Delete_DevNode_Key(dnDevNode: DEVNODE, ulHardwareProfile: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Delete_DevNode_Key')(dnDevNode, ulHardwareProfile, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_delete_devnode_key_ex
  public static CM_Delete_DevNode_Key_Ex(dnDevNode: DEVNODE, ulHardwareProfile: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Delete_DevNode_Key_Ex')(dnDevNode, ulHardwareProfile, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_delete_device_interface_keya
  public static CM_Delete_Device_Interface_KeyA(pszDeviceInterface: LPCSTR, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Delete_Device_Interface_KeyA')(pszDeviceInterface, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_delete_device_interface_keyw
  public static CM_Delete_Device_Interface_KeyW(pszDeviceInterface: LPCWSTR, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Delete_Device_Interface_KeyW')(pszDeviceInterface, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_delete_device_interface_key_exa
  public static CM_Delete_Device_Interface_Key_ExA(pszDeviceInterface: LPCSTR, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Delete_Device_Interface_Key_ExA')(pszDeviceInterface, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_delete_device_interface_key_exw
  public static CM_Delete_Device_Interface_Key_ExW(pszDeviceInterface: LPCWSTR, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Delete_Device_Interface_Key_ExW')(pszDeviceInterface, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_delete_powerscheme
  public static CM_Delete_PowerScheme(SchemeGuid: LPCGUID, Error: PDWORD): CONFIGRET {
    return Cfgmgr32.Load('CM_Delete_PowerScheme')(SchemeGuid, Error);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_delete_range
  public static CM_Delete_Range(ullStartValue: DWORDLONG, ullEndValue: DWORDLONG, rlh: RANGE_LIST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Delete_Range')(ullStartValue, ullEndValue, rlh, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_detect_resource_conflict
  public static CM_Detect_Resource_Conflict(dnDevInst: DEVINST, ResourceID: RESOURCEID, ResourceData: PCVOID, ResourceLen: ULONG, pbConflictDetected: PBOOL, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Detect_Resource_Conflict')(dnDevInst, ResourceID, ResourceData, ResourceLen, pbConflictDetected, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_detect_resource_conflict_ex
  public static CM_Detect_Resource_Conflict_Ex(dnDevInst: DEVINST, ResourceID: RESOURCEID, ResourceData: PCVOID, ResourceLen: ULONG, pbConflictDetected: PBOOL, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Detect_Resource_Conflict_Ex')(dnDevInst, ResourceID, ResourceData, ResourceLen, pbConflictDetected, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_disable_devnode
  public static CM_Disable_DevNode(dnDevInst: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Disable_DevNode')(dnDevInst, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_disable_devnode_ex
  public static CM_Disable_DevNode_Ex(dnDevInst: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Disable_DevNode_Ex')(dnDevInst, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_disconnect_machine
  public static CM_Disconnect_Machine(hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Disconnect_Machine')(hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_dup_range_list
  public static CM_Dup_Range_List(rlhOld: RANGE_LIST, rlhNew: RANGE_LIST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Dup_Range_List')(rlhOld, rlhNew, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_duplicate_powerscheme
  public static CM_Duplicate_PowerScheme(SourceSchemeGuid: LPCGUID, DestinationSchemeGuid: PVOID, Error: PDWORD): CONFIGRET {
    return Cfgmgr32.Load('CM_Duplicate_PowerScheme')(SourceSchemeGuid, DestinationSchemeGuid, Error);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_enable_devnode
  public static CM_Enable_DevNode(dnDevInst: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Enable_DevNode')(dnDevInst, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_enable_devnode_ex
  public static CM_Enable_DevNode_Ex(dnDevInst: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Enable_DevNode_Ex')(dnDevInst, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_enumerate_classes
  public static CM_Enumerate_Classes(ulClassIndex: ULONG, ClassGuid: LPGUID, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Enumerate_Classes')(ulClassIndex, ClassGuid, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_enumerate_classes_ex
  public static CM_Enumerate_Classes_Ex(ulClassIndex: ULONG, ClassGuid: LPGUID, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Enumerate_Classes_Ex')(ulClassIndex, ClassGuid, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_enumerate_enumeratorsa
  public static CM_Enumerate_EnumeratorsA(ulEnumIndex: ULONG, Buffer: PSTR, pulLength: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Enumerate_EnumeratorsA')(ulEnumIndex, Buffer, pulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_enumerate_enumeratorsw
  public static CM_Enumerate_EnumeratorsW(ulEnumIndex: ULONG, Buffer: PWSTR, pulLength: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Enumerate_EnumeratorsW')(ulEnumIndex, Buffer, pulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_enumerate_enumerators_exa
  public static CM_Enumerate_Enumerators_ExA(ulEnumIndex: ULONG, Buffer: PSTR, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Enumerate_Enumerators_ExA')(ulEnumIndex, Buffer, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_enumerate_enumerators_exw
  public static CM_Enumerate_Enumerators_ExW(ulEnumIndex: ULONG, Buffer: PWSTR, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Enumerate_Enumerators_ExW')(ulEnumIndex, Buffer, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_find_range
  public static CM_Find_Range(pullStart: PDWORDLONG, ullStart: DWORDLONG, ulLength: ULONG, ullAlignment: DWORDLONG, ullEnd: DWORDLONG, rlh: RANGE_LIST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Find_Range')(pullStart, ullStart, ulLength, ullAlignment, ullEnd, rlh, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_first_range
  public static CM_First_Range(rlh: RANGE_LIST, pullStart: PDWORDLONG, pullEnd: PDWORDLONG, preElement: PRANGE_ELEMENT, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_First_Range')(rlh, pullStart, pullEnd, preElement, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_free_log_conf
  public static CM_Free_Log_Conf(lcLogConfToBeFreed: LOG_CONF, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Free_Log_Conf')(lcLogConfToBeFreed, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_free_log_conf_ex
  public static CM_Free_Log_Conf_Ex(lcLogConfToBeFreed: LOG_CONF, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Free_Log_Conf_Ex')(lcLogConfToBeFreed, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_free_log_conf_handle
  public static CM_Free_Log_Conf_Handle(lcLogConf: LOG_CONF): CONFIGRET {
    return Cfgmgr32.Load('CM_Free_Log_Conf_Handle')(lcLogConf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_free_range_list
  public static CM_Free_Range_List(rlh: RANGE_LIST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Free_Range_List')(rlh, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_free_res_des
  public static CM_Free_Res_Des(prdResDes: PRES_DES | NULL, rdResDes: RES_DES, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Free_Res_Des')(prdResDes, rdResDes, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_free_res_des_ex
  public static CM_Free_Res_Des_Ex(prdResDes: PRES_DES | NULL, rdResDes: RES_DES, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Free_Res_Des_Ex')(prdResDes, rdResDes, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_free_res_des_handle
  public static CM_Free_Res_Des_Handle(rdResDes: RES_DES): CONFIGRET {
    return Cfgmgr32.Load('CM_Free_Res_Des_Handle')(rdResDes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_free_resource_conflict_handle
  public static CM_Free_Resource_Conflict_Handle(clConflictList: CONFLICT_LIST): CONFIGRET {
    return Cfgmgr32.Load('CM_Free_Resource_Conflict_Handle')(clConflictList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_child
  public static CM_Get_Child(pdnDevInst: PDEVINST, dnDevInst: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Child')(pdnDevInst, dnDevInst, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_child_ex
  public static CM_Get_Child_Ex(pdnDevInst: PDEVINST, dnDevInst: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Child_Ex')(pdnDevInst, dnDevInst, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_class_key_namea
  public static CM_Get_Class_Key_NameA(ClassGuid: LPGUID, pszKeyName: LPSTR | NULL, pulLength: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Class_Key_NameA')(ClassGuid, pszKeyName, pulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_class_key_namew
  public static CM_Get_Class_Key_NameW(ClassGuid: LPGUID, pszKeyName: LPWSTR | NULL, pulLength: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Class_Key_NameW')(ClassGuid, pszKeyName, pulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_class_key_name_exa
  public static CM_Get_Class_Key_Name_ExA(ClassGuid: LPGUID, pszKeyName: LPSTR | NULL, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Class_Key_Name_ExA')(ClassGuid, pszKeyName, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_class_key_name_exw
  public static CM_Get_Class_Key_Name_ExW(ClassGuid: LPGUID, pszKeyName: LPWSTR | NULL, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Class_Key_Name_ExW')(ClassGuid, pszKeyName, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_class_namea
  public static CM_Get_Class_NameA(ClassGuid: LPGUID, Buffer: PSTR | NULL, pulLength: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Class_NameA')(ClassGuid, Buffer, pulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_class_namew
  public static CM_Get_Class_NameW(ClassGuid: LPGUID, Buffer: PWSTR | NULL, pulLength: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Class_NameW')(ClassGuid, Buffer, pulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_class_name_exa
  public static CM_Get_Class_Name_ExA(ClassGuid: LPGUID, Buffer: PSTR | NULL, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Class_Name_ExA')(ClassGuid, Buffer, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_class_name_exw
  public static CM_Get_Class_Name_ExW(ClassGuid: LPGUID, Buffer: PWSTR | NULL, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Class_Name_ExW')(ClassGuid, Buffer, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_class_propertyw
  public static CM_Get_Class_PropertyW(ClassGUID: LPCGUID, PropertyKey: PDEVPROPKEY, PropertyType: PDEVPROPTYPE, PropertyBuffer: PBYTE | NULL, PropertyBufferSize: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Class_PropertyW')(ClassGUID, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_class_property_exw
  public static CM_Get_Class_Property_ExW(ClassGUID: LPCGUID, PropertyKey: PDEVPROPKEY, PropertyType: PDEVPROPTYPE, PropertyBuffer: PBYTE | NULL, PropertyBufferSize: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Class_Property_ExW')(ClassGUID, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_class_property_keys
  public static CM_Get_Class_Property_Keys(ClassGUID: LPCGUID, PropertyKeyArray: PDEVPROPKEY | NULL, PropertyKeyCount: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Class_Property_Keys')(ClassGUID, PropertyKeyArray, PropertyKeyCount, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_class_property_keys_ex
  public static CM_Get_Class_Property_Keys_Ex(ClassGUID: LPCGUID, PropertyKeyArray: PDEVPROPKEY | NULL, PropertyKeyCount: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Class_Property_Keys_Ex')(ClassGUID, PropertyKeyArray, PropertyKeyCount, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_class_registry_propertya
  public static CM_Get_Class_Registry_PropertyA(ClassGuid: LPGUID, ulProperty: ULONG, pulRegDataType: PULONG | NULL, Buffer: PVOID | NULL, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Class_Registry_PropertyA')(ClassGuid, ulProperty, pulRegDataType, Buffer, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_class_registry_propertyw
  public static CM_Get_Class_Registry_PropertyW(ClassGuid: LPGUID, ulProperty: ULONG, pulRegDataType: PULONG | NULL, Buffer: PVOID | NULL, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Class_Registry_PropertyW')(ClassGuid, ulProperty, pulRegDataType, Buffer, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_depth
  public static CM_Get_Depth(pulDepth: PULONG, dnDevInst: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Depth')(pulDepth, dnDevInst, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_depth_ex
  public static CM_Get_Depth_Ex(pulDepth: PULONG, dnDevInst: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Depth_Ex')(pulDepth, dnDevInst, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_devnode_custom_propertya
  public static CM_Get_DevNode_Custom_PropertyA(dnDevInst: DEVINST, pszCustomPropertyName: PCSTR, pulRegDataType: PULONG | NULL, Buffer: PVOID | NULL, pulLength: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_DevNode_Custom_PropertyA')(dnDevInst, pszCustomPropertyName, pulRegDataType, Buffer, pulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_devnode_custom_propertyw
  public static CM_Get_DevNode_Custom_PropertyW(dnDevInst: DEVINST, pszCustomPropertyName: PCWSTR, pulRegDataType: PULONG | NULL, Buffer: PVOID | NULL, pulLength: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_DevNode_Custom_PropertyW')(dnDevInst, pszCustomPropertyName, pulRegDataType, Buffer, pulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_devnode_custom_property_exa
  public static CM_Get_DevNode_Custom_Property_ExA(dnDevInst: DEVINST, pszCustomPropertyName: PCSTR, pulRegDataType: PULONG | NULL, Buffer: PVOID | NULL, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_DevNode_Custom_Property_ExA')(dnDevInst, pszCustomPropertyName, pulRegDataType, Buffer, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_devnode_custom_property_exw
  public static CM_Get_DevNode_Custom_Property_ExW(dnDevInst: DEVINST, pszCustomPropertyName: PCWSTR, pulRegDataType: PULONG | NULL, Buffer: PVOID | NULL, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_DevNode_Custom_Property_ExW')(dnDevInst, pszCustomPropertyName, pulRegDataType, Buffer, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_devnode_propertyw
  public static CM_Get_DevNode_PropertyW(dnDevInst: DEVINST, PropertyKey: PDEVPROPKEY, PropertyType: PDEVPROPTYPE, PropertyBuffer: PBYTE | NULL, PropertyBufferSize: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_DevNode_PropertyW')(dnDevInst, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_devnode_property_exw
  public static CM_Get_DevNode_Property_ExW(dnDevInst: DEVINST, PropertyKey: PDEVPROPKEY, PropertyType: PDEVPROPTYPE, PropertyBuffer: PBYTE | NULL, PropertyBufferSize: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_DevNode_Property_ExW')(dnDevInst, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_devnode_property_keys
  public static CM_Get_DevNode_Property_Keys(dnDevInst: DEVINST, PropertyKeyArray: PDEVPROPKEY | NULL, PropertyKeyCount: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_DevNode_Property_Keys')(dnDevInst, PropertyKeyArray, PropertyKeyCount, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_devnode_property_keys_ex
  public static CM_Get_DevNode_Property_Keys_Ex(dnDevInst: DEVINST, PropertyKeyArray: PDEVPROPKEY | NULL, PropertyKeyCount: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_DevNode_Property_Keys_Ex')(dnDevInst, PropertyKeyArray, PropertyKeyCount, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_devnode_registry_propertya
  public static CM_Get_DevNode_Registry_PropertyA(dnDevInst: DEVINST, ulProperty: ULONG, pulRegDataType: PULONG | NULL, Buffer: PVOID | NULL, pulLength: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_DevNode_Registry_PropertyA')(dnDevInst, ulProperty, pulRegDataType, Buffer, pulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_devnode_registry_propertyw
  public static CM_Get_DevNode_Registry_PropertyW(dnDevInst: DEVINST, ulProperty: ULONG, pulRegDataType: PULONG | NULL, Buffer: PVOID | NULL, pulLength: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_DevNode_Registry_PropertyW')(dnDevInst, ulProperty, pulRegDataType, Buffer, pulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_devnode_registry_property_exa
  public static CM_Get_DevNode_Registry_Property_ExA(dnDevInst: DEVINST, ulProperty: ULONG, pulRegDataType: PULONG | NULL, Buffer: PVOID | NULL, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_DevNode_Registry_Property_ExA')(dnDevInst, ulProperty, pulRegDataType, Buffer, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_devnode_registry_property_exw
  public static CM_Get_DevNode_Registry_Property_ExW(dnDevInst: DEVINST, ulProperty: ULONG, pulRegDataType: PULONG | NULL, Buffer: PVOID | NULL, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_DevNode_Registry_Property_ExW')(dnDevInst, ulProperty, pulRegDataType, Buffer, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_devnode_status
  public static CM_Get_DevNode_Status(pulStatus: PULONG, pulProblemNumber: PULONG, dnDevInst: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_DevNode_Status')(pulStatus, pulProblemNumber, dnDevInst, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_devnode_status_ex
  public static CM_Get_DevNode_Status_Ex(pulStatus: PULONG, pulProblemNumber: PULONG, dnDevInst: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_DevNode_Status_Ex')(pulStatus, pulProblemNumber, dnDevInst, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_ida
  public static CM_Get_Device_IDA(dnDevInst: DEVINST, Buffer: PSTR, BufferLen: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_IDA')(dnDevInst, Buffer, BufferLen, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_idw
  public static CM_Get_Device_IDW(dnDevInst: DEVINST, Buffer: PWSTR, BufferLen: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_IDW')(dnDevInst, Buffer, BufferLen, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_id_exa
  public static CM_Get_Device_ID_ExA(dnDevInst: DEVINST, Buffer: PSTR, BufferLen: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_ID_ExA')(dnDevInst, Buffer, BufferLen, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_id_exw
  public static CM_Get_Device_ID_ExW(dnDevInst: DEVINST, Buffer: PWSTR, BufferLen: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_ID_ExW')(dnDevInst, Buffer, BufferLen, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_id_lista
  public static CM_Get_Device_ID_ListA(pszFilter: PCSTR | NULL, Buffer: PSTR, BufferLen: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_ID_ListA')(pszFilter, Buffer, BufferLen, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_id_listw
  public static CM_Get_Device_ID_ListW(pszFilter: PCWSTR | NULL, Buffer: PWSTR, BufferLen: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_ID_ListW')(pszFilter, Buffer, BufferLen, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_id_list_exa
  public static CM_Get_Device_ID_List_ExA(pszFilter: PCSTR | NULL, Buffer: PSTR, BufferLen: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_ID_List_ExA')(pszFilter, Buffer, BufferLen, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_id_list_exw
  public static CM_Get_Device_ID_List_ExW(pszFilter: PCWSTR | NULL, Buffer: PWSTR, BufferLen: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_ID_List_ExW')(pszFilter, Buffer, BufferLen, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_id_list_sizea
  public static CM_Get_Device_ID_List_SizeA(pulLen: PULONG, pszFilter: PCSTR | NULL, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_ID_List_SizeA')(pulLen, pszFilter, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_id_list_sizew
  public static CM_Get_Device_ID_List_SizeW(pulLen: PULONG, pszFilter: PCWSTR | NULL, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_ID_List_SizeW')(pulLen, pszFilter, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_id_list_size_exa
  public static CM_Get_Device_ID_List_Size_ExA(pulLen: PULONG, pszFilter: PCSTR | NULL, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_ID_List_Size_ExA')(pulLen, pszFilter, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_id_list_size_exw
  public static CM_Get_Device_ID_List_Size_ExW(pulLen: PULONG, pszFilter: PCWSTR | NULL, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_ID_List_Size_ExW')(pulLen, pszFilter, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_id_size
  public static CM_Get_Device_ID_Size(pulLen: PULONG, dnDevInst: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_ID_Size')(pulLen, dnDevInst, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_id_size_ex
  public static CM_Get_Device_ID_Size_Ex(pulLen: PULONG, dnDevInst: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_ID_Size_Ex')(pulLen, dnDevInst, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_aliasa
  public static CM_Get_Device_Interface_AliasA(pszDeviceInterface: LPCSTR, AliasInterfaceGuid: LPGUID, pszAliasDeviceInterface: LPSTR, pulLength: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_AliasA')(pszDeviceInterface, AliasInterfaceGuid, pszAliasDeviceInterface, pulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_aliasw
  public static CM_Get_Device_Interface_AliasW(pszDeviceInterface: LPCWSTR, AliasInterfaceGuid: LPGUID, pszAliasDeviceInterface: LPWSTR, pulLength: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_AliasW')(pszDeviceInterface, AliasInterfaceGuid, pszAliasDeviceInterface, pulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_alias_exa
  public static CM_Get_Device_Interface_Alias_ExA(pszDeviceInterface: LPCSTR, AliasInterfaceGuid: LPGUID, pszAliasDeviceInterface: LPSTR, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_Alias_ExA')(pszDeviceInterface, AliasInterfaceGuid, pszAliasDeviceInterface, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_alias_exw
  public static CM_Get_Device_Interface_Alias_ExW(pszDeviceInterface: LPCWSTR, AliasInterfaceGuid: LPGUID, pszAliasDeviceInterface: LPWSTR, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_Alias_ExW')(pszDeviceInterface, AliasInterfaceGuid, pszAliasDeviceInterface, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_lista
  public static CM_Get_Device_Interface_ListA(InterfaceClassGuid: LPGUID, pDeviceID: DEVINSTID_A | NULL, Buffer: PSTR, BufferLen: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_ListA')(InterfaceClassGuid, pDeviceID, Buffer, BufferLen, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_listw
  public static CM_Get_Device_Interface_ListW(InterfaceClassGuid: LPGUID, pDeviceID: DEVINSTID_W | NULL, Buffer: PWSTR, BufferLen: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_ListW')(InterfaceClassGuid, pDeviceID, Buffer, BufferLen, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_list_exa
  public static CM_Get_Device_Interface_List_ExA(InterfaceClassGuid: LPGUID, pDeviceID: DEVINSTID_A | NULL, Buffer: PSTR, BufferLen: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_List_ExA')(InterfaceClassGuid, pDeviceID, Buffer, BufferLen, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_list_exw
  public static CM_Get_Device_Interface_List_ExW(InterfaceClassGuid: LPGUID, pDeviceID: DEVINSTID_W | NULL, Buffer: PWSTR, BufferLen: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_List_ExW')(InterfaceClassGuid, pDeviceID, Buffer, BufferLen, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_list_sizea
  public static CM_Get_Device_Interface_List_SizeA(pulLen: PULONG, InterfaceClassGuid: LPGUID, pDeviceID: DEVINSTID_A | NULL, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_List_SizeA')(pulLen, InterfaceClassGuid, pDeviceID, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_list_sizew
  public static CM_Get_Device_Interface_List_SizeW(pulLen: PULONG, InterfaceClassGuid: LPGUID, pDeviceID: DEVINSTID_W | NULL, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_List_SizeW')(pulLen, InterfaceClassGuid, pDeviceID, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_list_size_exa
  public static CM_Get_Device_Interface_List_Size_ExA(pulLen: PULONG, InterfaceClassGuid: LPGUID, pDeviceID: DEVINSTID_A | NULL, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_List_Size_ExA')(pulLen, InterfaceClassGuid, pDeviceID, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_list_size_exw
  public static CM_Get_Device_Interface_List_Size_ExW(pulLen: PULONG, InterfaceClassGuid: LPGUID, pDeviceID: DEVINSTID_W | NULL, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_List_Size_ExW')(pulLen, InterfaceClassGuid, pDeviceID, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_propertyw
  public static CM_Get_Device_Interface_PropertyW(pszDeviceInterface: LPCWSTR, PropertyKey: PDEVPROPKEY, PropertyType: PDEVPROPTYPE, PropertyBuffer: PBYTE | NULL, PropertyBufferSize: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_PropertyW')(pszDeviceInterface, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_property_exw
  public static CM_Get_Device_Interface_Property_ExW(pszDeviceInterface: LPCWSTR, PropertyKey: PDEVPROPKEY, PropertyType: PDEVPROPTYPE, PropertyBuffer: PBYTE | NULL, PropertyBufferSize: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_Property_ExW')(pszDeviceInterface, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_property_keysw
  public static CM_Get_Device_Interface_Property_KeysW(pszDeviceInterface: LPCWSTR, PropertyKeyArray: PDEVPROPKEY | NULL, PropertyKeyCount: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_Property_KeysW')(pszDeviceInterface, PropertyKeyArray, PropertyKeyCount, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_device_interface_property_keys_exw
  public static CM_Get_Device_Interface_Property_Keys_ExW(pszDeviceInterface: LPCWSTR, PropertyKeyArray: PDEVPROPKEY | NULL, PropertyKeyCount: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Device_Interface_Property_Keys_ExW')(pszDeviceInterface, PropertyKeyArray, PropertyKeyCount, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_first_log_conf
  public static CM_Get_First_Log_Conf(plcLogConf: PLOG_CONF | NULL, dnDevInst: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_First_Log_Conf')(plcLogConf, dnDevInst, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_first_log_conf_ex
  public static CM_Get_First_Log_Conf_Ex(plcLogConf: PLOG_CONF | NULL, dnDevInst: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_First_Log_Conf_Ex')(plcLogConf, dnDevInst, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_global_state
  public static CM_Get_Global_State(pulState: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Global_State')(pulState, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_global_state_ex
  public static CM_Get_Global_State_Ex(pulState: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Global_State_Ex')(pulState, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_hw_prof_flagsa
  public static CM_Get_HW_Prof_FlagsA(pDeviceID: DEVINSTID_A, ulHardwareProfile: ULONG, pulValue: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_HW_Prof_FlagsA')(pDeviceID, ulHardwareProfile, pulValue, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_hw_prof_flagsw
  public static CM_Get_HW_Prof_FlagsW(pDeviceID: DEVINSTID_W, ulHardwareProfile: ULONG, pulValue: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_HW_Prof_FlagsW')(pDeviceID, ulHardwareProfile, pulValue, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_hw_prof_flags_exa
  public static CM_Get_HW_Prof_Flags_ExA(pDeviceID: DEVINSTID_A, ulHardwareProfile: ULONG, pulValue: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_HW_Prof_Flags_ExA')(pDeviceID, ulHardwareProfile, pulValue, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_hw_prof_flags_exw
  public static CM_Get_HW_Prof_Flags_ExW(pDeviceID: DEVINSTID_W, ulHardwareProfile: ULONG, pulValue: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_HW_Prof_Flags_ExW')(pDeviceID, ulHardwareProfile, pulValue, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_hardware_profile_infoa
  public static CM_Get_Hardware_Profile_InfoA(ulIndex: ULONG, pHWProfileInfo: PHWPROFILEINFO_A, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Hardware_Profile_InfoA')(ulIndex, pHWProfileInfo, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_hardware_profile_infow
  public static CM_Get_Hardware_Profile_InfoW(ulIndex: ULONG, pHWProfileInfo: PHWPROFILEINFO_W, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Hardware_Profile_InfoW')(ulIndex, pHWProfileInfo, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_hardware_profile_info_exa
  public static CM_Get_Hardware_Profile_Info_ExA(ulIndex: ULONG, pHWProfileInfo: PHWPROFILEINFO_A, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Hardware_Profile_Info_ExA')(ulIndex, pHWProfileInfo, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_hardware_profile_info_exw
  public static CM_Get_Hardware_Profile_Info_ExW(ulIndex: ULONG, pHWProfileInfo: PHWPROFILEINFO_W, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Hardware_Profile_Info_ExW')(ulIndex, pHWProfileInfo, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_log_conf_priority
  public static CM_Get_Log_Conf_Priority(lcLogConf: LOG_CONF, pPriority: PPRIORITY, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Log_Conf_Priority')(lcLogConf, pPriority, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_log_conf_priority_ex
  public static CM_Get_Log_Conf_Priority_Ex(lcLogConf: LOG_CONF, pPriority: PPRIORITY, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Log_Conf_Priority_Ex')(lcLogConf, pPriority, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_next_log_conf
  public static CM_Get_Next_Log_Conf(plcLogConf: PLOG_CONF | NULL, lcLogConf: LOG_CONF, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Next_Log_Conf')(plcLogConf, lcLogConf, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_next_log_conf_ex
  public static CM_Get_Next_Log_Conf_Ex(plcLogConf: PLOG_CONF | NULL, lcLogConf: LOG_CONF, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Next_Log_Conf_Ex')(plcLogConf, lcLogConf, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_next_res_des
  public static CM_Get_Next_Res_Des(prdResDes: PRES_DES, rdResDes: RES_DES, ForResource: RESOURCEID, pResourceID: PRESOURCEID | NULL, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Next_Res_Des')(prdResDes, rdResDes, ForResource, pResourceID, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_next_res_des_ex
  public static CM_Get_Next_Res_Des_Ex(prdResDes: PRES_DES, rdResDes: RES_DES, ForResource: RESOURCEID, pResourceID: PRESOURCEID | NULL, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Next_Res_Des_Ex')(prdResDes, rdResDes, ForResource, pResourceID, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_parent
  public static CM_Get_Parent(pdnDevInst: PDEVINST, dnDevInst: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Parent')(pdnDevInst, dnDevInst, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_parent_ex
  public static CM_Get_Parent_Ex(pdnDevInst: PDEVINST, dnDevInst: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Parent_Ex')(pdnDevInst, dnDevInst, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_res_des_data
  public static CM_Get_Res_Des_Data(rdResDes: RES_DES, Buffer: PVOID, BufferLen: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Res_Des_Data')(rdResDes, Buffer, BufferLen, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_res_des_data_ex
  public static CM_Get_Res_Des_Data_Ex(rdResDes: RES_DES, Buffer: PVOID, BufferLen: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Res_Des_Data_Ex')(rdResDes, Buffer, BufferLen, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_res_des_data_size
  public static CM_Get_Res_Des_Data_Size(pulSize: PULONG, rdResDes: RES_DES, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Res_Des_Data_Size')(pulSize, rdResDes, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_res_des_data_size_ex
  public static CM_Get_Res_Des_Data_Size_Ex(pulSize: PULONG, rdResDes: RES_DES, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Res_Des_Data_Size_Ex')(pulSize, rdResDes, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_resource_conflict_count
  public static CM_Get_Resource_Conflict_Count(clConflictList: CONFLICT_LIST, pulCount: PULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Resource_Conflict_Count')(clConflictList, pulCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_resource_conflict_detailsa
  public static CM_Get_Resource_Conflict_DetailsA(clConflictList: CONFLICT_LIST, ulIndex: ULONG, pConflictDetails: PCONFLICT_DETAILS_A): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Resource_Conflict_DetailsA')(clConflictList, ulIndex, pConflictDetails);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_resource_conflict_detailsw
  public static CM_Get_Resource_Conflict_DetailsW(clConflictList: CONFLICT_LIST, ulIndex: ULONG, pConflictDetails: PCONFLICT_DETAILS_W): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Resource_Conflict_DetailsW')(clConflictList, ulIndex, pConflictDetails);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_sibling
  public static CM_Get_Sibling(pdnDevInst: PDEVINST, dnDevInst: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Sibling')(pdnDevInst, dnDevInst, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_sibling_ex
  public static CM_Get_Sibling_Ex(pdnDevInst: PDEVINST, dnDevInst: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Get_Sibling_Ex')(pdnDevInst, dnDevInst, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_version
  public static CM_Get_Version(): WORD {
    return Cfgmgr32.Load('CM_Get_Version')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_get_version_ex
  public static CM_Get_Version_Ex(hMachine: HMACHINE | 0n): WORD {
    return Cfgmgr32.Load('CM_Get_Version_Ex')(hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_import_powerscheme
  public static CM_Import_PowerScheme(ImportFileNamePath: LPCWSTR, DestinationSchemeGuid: PVOID, Error: PDWORD): CONFIGRET {
    return Cfgmgr32.Load('CM_Import_PowerScheme')(ImportFileNamePath, DestinationSchemeGuid, Error);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_intersect_range_list
  public static CM_Intersect_Range_List(rlhOld1: RANGE_LIST, rlhOld2: RANGE_LIST, rlhNew: RANGE_LIST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Intersect_Range_List')(rlhOld1, rlhOld2, rlhNew, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_invert_range_list
  public static CM_Invert_Range_List(rlhOld: RANGE_LIST, rlhNew: RANGE_LIST, ullMaxValue: DWORDLONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Invert_Range_List')(rlhOld, rlhNew, ullMaxValue, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_is_dock_station_present
  public static CM_Is_Dock_Station_Present(pbPresent: PBOOL): CONFIGRET {
    return Cfgmgr32.Load('CM_Is_Dock_Station_Present')(pbPresent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_is_dock_station_present_ex
  public static CM_Is_Dock_Station_Present_Ex(pbPresent: PBOOL, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Is_Dock_Station_Present_Ex')(pbPresent, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_is_version_available
  public static CM_Is_Version_Available(wVersion: WORD): BOOL {
    return Cfgmgr32.Load('CM_Is_Version_Available')(wVersion);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_is_version_available_ex
  public static CM_Is_Version_Available_Ex(wVersion: WORD, hMachine: HMACHINE | 0n): BOOL {
    return Cfgmgr32.Load('CM_Is_Version_Available_Ex')(wVersion, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_locate_devnodea
  public static CM_Locate_DevNodeA(pdnDevInst: PDEVINST, pDeviceID: DEVINSTID_A | NULL, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Locate_DevNodeA')(pdnDevInst, pDeviceID, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_locate_devnodew
  public static CM_Locate_DevNodeW(pdnDevInst: PDEVINST, pDeviceID: DEVINSTID_W | NULL, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Locate_DevNodeW')(pdnDevInst, pDeviceID, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_locate_devnode_exa
  public static CM_Locate_DevNode_ExA(pdnDevInst: PDEVINST, pDeviceID: DEVINSTID_A | NULL, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Locate_DevNode_ExA')(pdnDevInst, pDeviceID, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_locate_devnode_exw
  public static CM_Locate_DevNode_ExW(pdnDevInst: PDEVINST, pDeviceID: DEVINSTID_W | NULL, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Locate_DevNode_ExW')(pdnDevInst, pDeviceID, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_mapcrtowin32err
  public static CM_MapCrToWin32Err(CmReturnCode: CONFIGRET, DefaultErr: DWORD): DWORD {
    return Cfgmgr32.Load('CM_MapCrToWin32Err')(CmReturnCode, DefaultErr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_merge_range_list
  public static CM_Merge_Range_List(rlhOld1: RANGE_LIST, rlhOld2: RANGE_LIST, rlhNew: RANGE_LIST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Merge_Range_List')(rlhOld1, rlhOld2, rlhNew, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_modify_res_des
  public static CM_Modify_Res_Des(prdResDes: PRES_DES, rdResDes: RES_DES, ResourceID: RESOURCEID, ResourceData: PCVOID, ResourceLen: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Modify_Res_Des')(prdResDes, rdResDes, ResourceID, ResourceData, ResourceLen, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_modify_res_des_ex
  public static CM_Modify_Res_Des_Ex(prdResDes: PRES_DES, rdResDes: RES_DES, ResourceID: RESOURCEID, ResourceData: PCVOID, ResourceLen: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Modify_Res_Des_Ex')(prdResDes, rdResDes, ResourceID, ResourceData, ResourceLen, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_move_devnode
  public static CM_Move_DevNode(dnFromDevInst: DEVINST, dnToDevInst: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Move_DevNode')(dnFromDevInst, dnToDevInst, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_move_devnode_ex
  public static CM_Move_DevNode_Ex(dnFromDevInst: DEVINST, dnToDevInst: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Move_DevNode_Ex')(dnFromDevInst, dnToDevInst, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_next_range
  public static CM_Next_Range(preElement: PRANGE_ELEMENT, pullStart: PDWORDLONG, pullEnd: PDWORDLONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Next_Range')(preElement, pullStart, pullEnd, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_open_class_keya
  public static CM_Open_Class_KeyA(ClassGuid: LPGUID | NULL, pszClassName: LPCSTR | NULL, samDesired: REGSAM, Disposition: REGDISPOSITION, phkClass: PHKEY, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Open_Class_KeyA')(ClassGuid, pszClassName, samDesired, Disposition, phkClass, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_open_class_keyw
  public static CM_Open_Class_KeyW(ClassGuid: LPGUID | NULL, pszClassName: LPCWSTR | NULL, samDesired: REGSAM, Disposition: REGDISPOSITION, phkClass: PHKEY, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Open_Class_KeyW')(ClassGuid, pszClassName, samDesired, Disposition, phkClass, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_open_class_key_exa
  public static CM_Open_Class_Key_ExA(ClassGuid: LPGUID | NULL, pszClassName: LPCSTR | NULL, samDesired: REGSAM, Disposition: REGDISPOSITION, phkClass: PHKEY, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Open_Class_Key_ExA')(ClassGuid, pszClassName, samDesired, Disposition, phkClass, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_open_class_key_exw
  public static CM_Open_Class_Key_ExW(ClassGuid: LPGUID | NULL, pszClassName: LPCWSTR | NULL, samDesired: REGSAM, Disposition: REGDISPOSITION, phkClass: PHKEY, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Open_Class_Key_ExW')(ClassGuid, pszClassName, samDesired, Disposition, phkClass, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_open_devnode_key
  public static CM_Open_DevNode_Key(dnDevNode: DEVNODE, samDesired: REGSAM, ulHardwareProfile: ULONG, Disposition: REGDISPOSITION, phkDevice: PHKEY, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Open_DevNode_Key')(dnDevNode, samDesired, ulHardwareProfile, Disposition, phkDevice, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_open_devnode_key_ex
  public static CM_Open_DevNode_Key_Ex(dnDevNode: DEVNODE, samDesired: REGSAM, ulHardwareProfile: ULONG, Disposition: REGDISPOSITION, phkDevice: PHKEY, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Open_DevNode_Key_Ex')(dnDevNode, samDesired, ulHardwareProfile, Disposition, phkDevice, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_open_device_interface_keya
  public static CM_Open_Device_Interface_KeyA(pszDeviceInterface: LPCSTR, samDesired: REGSAM, Disposition: REGDISPOSITION, phkDeviceInterface: PHKEY, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Open_Device_Interface_KeyA')(pszDeviceInterface, samDesired, Disposition, phkDeviceInterface, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_open_device_interface_keyw
  public static CM_Open_Device_Interface_KeyW(pszDeviceInterface: LPCWSTR, samDesired: REGSAM, Disposition: REGDISPOSITION, phkDeviceInterface: PHKEY, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Open_Device_Interface_KeyW')(pszDeviceInterface, samDesired, Disposition, phkDeviceInterface, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_open_device_interface_key_exa
  public static CM_Open_Device_Interface_Key_ExA(pszDeviceInterface: LPCSTR, samDesired: REGSAM, Disposition: REGDISPOSITION, phkDeviceInterface: PHKEY, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Open_Device_Interface_Key_ExA')(pszDeviceInterface, samDesired, Disposition, phkDeviceInterface, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_open_device_interface_key_exw
  public static CM_Open_Device_Interface_Key_ExW(pszDeviceInterface: LPCWSTR, samDesired: REGSAM, Disposition: REGDISPOSITION, phkDeviceInterface: PHKEY, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Open_Device_Interface_Key_ExW')(pszDeviceInterface, samDesired, Disposition, phkDeviceInterface, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_query_and_remove_subtreea
  public static CM_Query_And_Remove_SubTreeA(dnAncestor: DEVINST, pVetoType: PPNP_VETO_TYPE | NULL, pszVetoName: LPSTR | NULL, ulNameLength: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Query_And_Remove_SubTreeA')(dnAncestor, pVetoType, pszVetoName, ulNameLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_query_and_remove_subtreew
  public static CM_Query_And_Remove_SubTreeW(dnAncestor: DEVINST, pVetoType: PPNP_VETO_TYPE | NULL, pszVetoName: LPWSTR | NULL, ulNameLength: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Query_And_Remove_SubTreeW')(dnAncestor, pVetoType, pszVetoName, ulNameLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_query_and_remove_subtree_exa
  public static CM_Query_And_Remove_SubTree_ExA(dnAncestor: DEVINST, pVetoType: PPNP_VETO_TYPE | NULL, pszVetoName: LPSTR | NULL, ulNameLength: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Query_And_Remove_SubTree_ExA')(dnAncestor, pVetoType, pszVetoName, ulNameLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_query_and_remove_subtree_exw
  public static CM_Query_And_Remove_SubTree_ExW(dnAncestor: DEVINST, pVetoType: PPNP_VETO_TYPE | NULL, pszVetoName: LPWSTR | NULL, ulNameLength: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Query_And_Remove_SubTree_ExW')(dnAncestor, pVetoType, pszVetoName, ulNameLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_query_arbitrator_free_data
  public static CM_Query_Arbitrator_Free_Data(pData: PVOID, DataLen: ULONG, dnDevInst: DEVINST, ResourceID: RESOURCEID, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Query_Arbitrator_Free_Data')(pData, DataLen, dnDevInst, ResourceID, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_query_arbitrator_free_data_ex
  public static CM_Query_Arbitrator_Free_Data_Ex(pData: PVOID, DataLen: ULONG, dnDevInst: DEVINST, ResourceID: RESOURCEID, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Query_Arbitrator_Free_Data_Ex')(pData, DataLen, dnDevInst, ResourceID, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_query_arbitrator_free_size
  public static CM_Query_Arbitrator_Free_Size(pulSize: PULONG, dnDevInst: DEVINST, ResourceID: RESOURCEID, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Query_Arbitrator_Free_Size')(pulSize, dnDevInst, ResourceID, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_query_arbitrator_free_size_ex
  public static CM_Query_Arbitrator_Free_Size_Ex(pulSize: PULONG, dnDevInst: DEVINST, ResourceID: RESOURCEID, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Query_Arbitrator_Free_Size_Ex')(pulSize, dnDevInst, ResourceID, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_query_remove_subtree
  public static CM_Query_Remove_SubTree(dnAncestor: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Query_Remove_SubTree')(dnAncestor, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_query_remove_subtree_ex
  public static CM_Query_Remove_SubTree_Ex(dnAncestor: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Query_Remove_SubTree_Ex')(dnAncestor, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_query_resource_conflict_list
  public static CM_Query_Resource_Conflict_List(pclConflictList: PCONFLICT_LIST, dnDevInst: DEVINST, ResourceID: RESOURCEID, ResourceData: PCVOID, ResourceLen: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Query_Resource_Conflict_List')(pclConflictList, dnDevInst, ResourceID, ResourceData, ResourceLen, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_reenumerate_devnode
  public static CM_Reenumerate_DevNode(dnDevInst: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Reenumerate_DevNode')(dnDevInst, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_reenumerate_devnode_ex
  public static CM_Reenumerate_DevNode_Ex(dnDevInst: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Reenumerate_DevNode_Ex')(dnDevInst, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_register_device_driver
  public static CM_Register_Device_Driver(dnDevInst: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Register_Device_Driver')(dnDevInst, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_register_device_driver_ex
  public static CM_Register_Device_Driver_Ex(dnDevInst: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Register_Device_Driver_Ex')(dnDevInst, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_register_device_interfacea
  public static CM_Register_Device_InterfaceA(dnDevInst: DEVINST, InterfaceClassGuid: LPGUID, pszReference: LPCSTR | NULL, pszDeviceInterface: LPSTR, pulLength: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Register_Device_InterfaceA')(dnDevInst, InterfaceClassGuid, pszReference, pszDeviceInterface, pulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_register_device_interfacew
  public static CM_Register_Device_InterfaceW(dnDevInst: DEVINST, InterfaceClassGuid: LPGUID, pszReference: LPCWSTR | NULL, pszDeviceInterface: LPWSTR, pulLength: PULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Register_Device_InterfaceW')(dnDevInst, InterfaceClassGuid, pszReference, pszDeviceInterface, pulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_register_device_interface_exa
  public static CM_Register_Device_Interface_ExA(dnDevInst: DEVINST, InterfaceClassGuid: LPGUID, pszReference: LPCSTR | NULL, pszDeviceInterface: LPSTR, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Register_Device_Interface_ExA')(dnDevInst, InterfaceClassGuid, pszReference, pszDeviceInterface, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_register_device_interface_exw
  public static CM_Register_Device_Interface_ExW(dnDevInst: DEVINST, InterfaceClassGuid: LPGUID, pszReference: LPCWSTR | NULL, pszDeviceInterface: LPWSTR, pulLength: PULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Register_Device_Interface_ExW')(dnDevInst, InterfaceClassGuid, pszReference, pszDeviceInterface, pulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_register_notification
  public static CM_Register_Notification(pFilter: PVOID, pContext: PVOID | NULL, pCallback: PVOID, pNotifyContext: PHCMNOTIFICATION): CONFIGRET {
    return Cfgmgr32.Load('CM_Register_Notification')(pFilter, pContext, pCallback, pNotifyContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_remove_subtree
  public static CM_Remove_SubTree(dnAncestor: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Remove_SubTree')(dnAncestor, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_remove_subtree_ex
  public static CM_Remove_SubTree_Ex(dnAncestor: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Remove_SubTree_Ex')(dnAncestor, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_request_device_ejecta
  public static CM_Request_Device_EjectA(dnDevInst: DEVINST, pVetoType: PPNP_VETO_TYPE | NULL, pszVetoName: LPSTR | NULL, ulNameLength: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Request_Device_EjectA')(dnDevInst, pVetoType, pszVetoName, ulNameLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_request_device_ejectw
  public static CM_Request_Device_EjectW(dnDevInst: DEVINST, pVetoType: PPNP_VETO_TYPE | NULL, pszVetoName: LPWSTR | NULL, ulNameLength: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Request_Device_EjectW')(dnDevInst, pVetoType, pszVetoName, ulNameLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_request_device_eject_exa
  public static CM_Request_Device_Eject_ExA(dnDevInst: DEVINST, pVetoType: PPNP_VETO_TYPE | NULL, pszVetoName: LPSTR | NULL, ulNameLength: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Request_Device_Eject_ExA')(dnDevInst, pVetoType, pszVetoName, ulNameLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_request_device_eject_exw
  public static CM_Request_Device_Eject_ExW(dnDevInst: DEVINST, pVetoType: PPNP_VETO_TYPE | NULL, pszVetoName: LPWSTR | NULL, ulNameLength: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Request_Device_Eject_ExW')(dnDevInst, pVetoType, pszVetoName, ulNameLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_request_eject_pc
  public static CM_Request_Eject_PC(): CONFIGRET {
    return Cfgmgr32.Load('CM_Request_Eject_PC')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_request_eject_pc_ex
  public static CM_Request_Eject_PC_Ex(hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Request_Eject_PC_Ex')(hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_restoreall_defaultpowerschemes
  public static CM_RestoreAll_DefaultPowerSchemes(Error: PDWORD): CONFIGRET {
    return Cfgmgr32.Load('CM_RestoreAll_DefaultPowerSchemes')(Error);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_restore_defaultpowerscheme
  public static CM_Restore_DefaultPowerScheme(SchemeGuid: LPCGUID, Error: PDWORD): CONFIGRET {
    return Cfgmgr32.Load('CM_Restore_DefaultPowerScheme')(SchemeGuid, Error);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_run_detection
  public static CM_Run_Detection(ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Run_Detection')(ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_run_detection_ex
  public static CM_Run_Detection_Ex(ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Run_Detection_Ex')(ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_activescheme
  public static CM_Set_ActiveScheme(SchemeGuid: LPCGUID, Error: PDWORD): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_ActiveScheme')(SchemeGuid, Error);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_class_propertyw
  public static CM_Set_Class_PropertyW(ClassGUID: LPCGUID, PropertyKey: PDEVPROPKEY, PropertyType: DEVPROPTYPE, PropertyBuffer: PBYTE | NULL, PropertyBufferSize: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_Class_PropertyW')(ClassGUID, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_class_property_exw
  public static CM_Set_Class_Property_ExW(ClassGUID: LPCGUID, PropertyKey: PDEVPROPKEY, PropertyType: DEVPROPTYPE, PropertyBuffer: PBYTE | NULL, PropertyBufferSize: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_Class_Property_ExW')(ClassGUID, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_class_registry_propertya
  public static CM_Set_Class_Registry_PropertyA(ClassGuid: LPGUID, ulProperty: ULONG, Buffer: PCVOID | NULL, ulLength: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_Class_Registry_PropertyA')(ClassGuid, ulProperty, Buffer, ulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_class_registry_propertyw
  public static CM_Set_Class_Registry_PropertyW(ClassGuid: LPGUID, ulProperty: ULONG, Buffer: PCVOID | NULL, ulLength: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_Class_Registry_PropertyW')(ClassGuid, ulProperty, Buffer, ulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_devnode_problem
  public static CM_Set_DevNode_Problem(dnDevInst: DEVINST, ulProblem: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_DevNode_Problem')(dnDevInst, ulProblem, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_devnode_problem_ex
  public static CM_Set_DevNode_Problem_Ex(dnDevInst: DEVINST, ulProblem: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_DevNode_Problem_Ex')(dnDevInst, ulProblem, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_devnode_propertyw
  public static CM_Set_DevNode_PropertyW(dnDevInst: DEVINST, PropertyKey: PDEVPROPKEY, PropertyType: DEVPROPTYPE, PropertyBuffer: PBYTE | NULL, PropertyBufferSize: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_DevNode_PropertyW')(dnDevInst, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_devnode_property_exw
  public static CM_Set_DevNode_Property_ExW(dnDevInst: DEVINST, PropertyKey: PDEVPROPKEY, PropertyType: DEVPROPTYPE, PropertyBuffer: PBYTE | NULL, PropertyBufferSize: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_DevNode_Property_ExW')(dnDevInst, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_devnode_registry_propertya
  public static CM_Set_DevNode_Registry_PropertyA(dnDevInst: DEVINST, ulProperty: ULONG, Buffer: PCVOID | NULL, ulLength: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_DevNode_Registry_PropertyA')(dnDevInst, ulProperty, Buffer, ulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_devnode_registry_propertyw
  public static CM_Set_DevNode_Registry_PropertyW(dnDevInst: DEVINST, ulProperty: ULONG, Buffer: PCVOID | NULL, ulLength: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_DevNode_Registry_PropertyW')(dnDevInst, ulProperty, Buffer, ulLength, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_devnode_registry_property_exa
  public static CM_Set_DevNode_Registry_Property_ExA(dnDevInst: DEVINST, ulProperty: ULONG, Buffer: PCVOID | NULL, ulLength: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_DevNode_Registry_Property_ExA')(dnDevInst, ulProperty, Buffer, ulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_devnode_registry_property_exw
  public static CM_Set_DevNode_Registry_Property_ExW(dnDevInst: DEVINST, ulProperty: ULONG, Buffer: PCVOID | NULL, ulLength: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_DevNode_Registry_Property_ExW')(dnDevInst, ulProperty, Buffer, ulLength, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_device_interface_propertyw
  public static CM_Set_Device_Interface_PropertyW(pszDeviceInterface: LPCWSTR, PropertyKey: PDEVPROPKEY, PropertyType: DEVPROPTYPE, PropertyBuffer: PBYTE | NULL, PropertyBufferSize: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_Device_Interface_PropertyW')(pszDeviceInterface, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_device_interface_property_exw
  public static CM_Set_Device_Interface_Property_ExW(pszDeviceInterface: LPCWSTR, PropertyKey: PDEVPROPKEY, PropertyType: DEVPROPTYPE, PropertyBuffer: PBYTE | NULL, PropertyBufferSize: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_Device_Interface_Property_ExW')(pszDeviceInterface, PropertyKey, PropertyType, PropertyBuffer, PropertyBufferSize, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_hw_prof
  public static CM_Set_HW_Prof(ulHardwareProfile: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_HW_Prof')(ulHardwareProfile, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_hw_prof_ex
  public static CM_Set_HW_Prof_Ex(ulHardwareProfile: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_HW_Prof_Ex')(ulHardwareProfile, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_hw_prof_flagsa
  public static CM_Set_HW_Prof_FlagsA(pDeviceID: DEVINSTID_A, ulConfig: ULONG, ulValue: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_HW_Prof_FlagsA')(pDeviceID, ulConfig, ulValue, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_hw_prof_flagsw
  public static CM_Set_HW_Prof_FlagsW(pDeviceID: DEVINSTID_W, ulConfig: ULONG, ulValue: ULONG, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_HW_Prof_FlagsW')(pDeviceID, ulConfig, ulValue, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_hw_prof_flags_exa
  public static CM_Set_HW_Prof_Flags_ExA(pDeviceID: DEVINSTID_A, ulConfig: ULONG, ulValue: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_HW_Prof_Flags_ExA')(pDeviceID, ulConfig, ulValue, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_set_hw_prof_flags_exw
  public static CM_Set_HW_Prof_Flags_ExW(pDeviceID: DEVINSTID_W, ulConfig: ULONG, ulValue: ULONG, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Set_HW_Prof_Flags_ExW')(pDeviceID, ulConfig, ulValue, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_setup_devnode
  public static CM_Setup_DevNode(dnDevInst: DEVINST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Setup_DevNode')(dnDevInst, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_setup_devnode_ex
  public static CM_Setup_DevNode_Ex(dnDevInst: DEVINST, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Setup_DevNode_Ex')(dnDevInst, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_test_range_available
  public static CM_Test_Range_Available(ullStartValue: DWORDLONG, ullEndValue: DWORDLONG, rlh: RANGE_LIST, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Test_Range_Available')(ullStartValue, ullEndValue, rlh, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_uninstall_devnode
  public static CM_Uninstall_DevNode(dnDevInst: DEVNODE, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Uninstall_DevNode')(dnDevInst, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_uninstall_devnode_ex
  public static CM_Uninstall_DevNode_Ex(dnDevInst: DEVNODE, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Uninstall_DevNode_Ex')(dnDevInst, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_unregister_device_interfacea
  public static CM_Unregister_Device_InterfaceA(pszDeviceInterface: LPCSTR, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Unregister_Device_InterfaceA')(pszDeviceInterface, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_unregister_device_interfacew
  public static CM_Unregister_Device_InterfaceW(pszDeviceInterface: LPCWSTR, ulFlags: ULONG): CONFIGRET {
    return Cfgmgr32.Load('CM_Unregister_Device_InterfaceW')(pszDeviceInterface, ulFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_unregister_device_interface_exa
  public static CM_Unregister_Device_Interface_ExA(pszDeviceInterface: LPCSTR, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Unregister_Device_Interface_ExA')(pszDeviceInterface, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_unregister_device_interface_exw
  public static CM_Unregister_Device_Interface_ExW(pszDeviceInterface: LPCWSTR, ulFlags: ULONG, hMachine: HMACHINE | 0n): CONFIGRET {
    return Cfgmgr32.Load('CM_Unregister_Device_Interface_ExW')(pszDeviceInterface, ulFlags, hMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_unregister_notification
  public static CM_Unregister_Notification(NotifyContext: HCMNOTIFICATION): CONFIGRET {
    return Cfgmgr32.Load('CM_Unregister_Notification')(NotifyContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfgmgr32/nf-cfgmgr32-cm_write_userpowerkey
  public static CM_Write_UserPowerKey(SchemeGuid: LPCGUID | NULL, SubGroupOfPowerSettingsGuid: LPCGUID | NULL, PowerSettingGuid: LPCGUID | NULL, AccessFlags: ULONG, Type: ULONG, Buffer: PBYTE, BufferSize: DWORD, Error: PDWORD): CONFIGRET {
    return Cfgmgr32.Load('CM_Write_UserPowerKey')(SchemeGuid, SubGroupOfPowerSettingsGuid, PowerSettingGuid, AccessFlags, Type, Buffer, BufferSize, Error);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/devquery/nf-devquery-devcloseobjectquery
  public static DevCloseObjectQuery(hDevQuery: HDEVQUERY): void {
    return Cfgmgr32.Load('DevCloseObjectQuery')(hDevQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/devquery/nf-devquery-devcreateobjectquery
  public static DevCreateObjectQuery(ObjectType: ULONG, QueryFlags: ULONG, cRequestedProperties: ULONG, pRequestedProperties: PVOID | NULL, cFilterExpressionCount: ULONG, pFilter: PVOID | NULL, pCallback: PVOID, pContext: PVOID | NULL, phDevQuery: PHDEVQUERY): HRESULT {
    return Cfgmgr32.Load('DevCreateObjectQuery')(ObjectType, QueryFlags, cRequestedProperties, pRequestedProperties, cFilterExpressionCount, pFilter, pCallback, pContext, phDevQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/devquery/nf-devquery-devcreateobjectqueryex
  public static DevCreateObjectQueryEx(ObjectType: ULONG, QueryFlags: ULONG, cRequestedProperties: ULONG, pRequestedProperties: PVOID | NULL, cFilterExpressionCount: ULONG, pFilter: PVOID | NULL, cExtendedParameterCount: ULONG, pExtendedParameters: PVOID | NULL, pCallback: PVOID, pContext: PVOID | NULL, phDevQuery: PHDEVQUERY): HRESULT {
    return Cfgmgr32.Load('DevCreateObjectQueryEx')(ObjectType, QueryFlags, cRequestedProperties, pRequestedProperties, cFilterExpressionCount, pFilter, cExtendedParameterCount, pExtendedParameters, pCallback, pContext, phDevQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/devquery/nf-devquery-devcreateobjectqueryfromid
  public static DevCreateObjectQueryFromId(ObjectType: ULONG, pszObjectId: PCWSTR, QueryFlags: ULONG, cRequestedProperties: ULONG, pRequestedProperties: PVOID | NULL, cFilterExpressionCount: ULONG, pFilter: PVOID | NULL, pCallback: PVOID, pContext: PVOID | NULL, phDevQuery: PHDEVQUERY): HRESULT {
    return Cfgmgr32.Load('DevCreateObjectQueryFromId')(ObjectType, pszObjectId, QueryFlags, cRequestedProperties, pRequestedProperties, cFilterExpressionCount, pFilter, pCallback, pContext, phDevQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/devquery/nf-devquery-devcreateobjectqueryfromidex
  public static DevCreateObjectQueryFromIdEx(ObjectType: ULONG, pszObjectId: PCWSTR, QueryFlags: ULONG, cRequestedProperties: ULONG, pRequestedProperties: PVOID | NULL, cFilterExpressionCount: ULONG, pFilter: PVOID | NULL, cExtendedParameterCount: ULONG, pExtendedParameters: PVOID | NULL, pCallback: PVOID, pContext: PVOID | NULL, phDevQuery: PHDEVQUERY): HRESULT {
    return Cfgmgr32.Load('DevCreateObjectQueryFromIdEx')(ObjectType, pszObjectId, QueryFlags, cRequestedProperties, pRequestedProperties, cFilterExpressionCount, pFilter, cExtendedParameterCount, pExtendedParameters, pCallback, pContext, phDevQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/devquery/nf-devquery-devcreateobjectqueryfromids
  public static DevCreateObjectQueryFromIds(ObjectType: ULONG, pszzObjectIds: PCZZWSTR, QueryFlags: ULONG, cRequestedProperties: ULONG, pRequestedProperties: PVOID | NULL, cFilterExpressionCount: ULONG, pFilter: PVOID | NULL, pCallback: PVOID, pContext: PVOID | NULL, phDevQuery: PHDEVQUERY): HRESULT {
    return Cfgmgr32.Load('DevCreateObjectQueryFromIds')(ObjectType, pszzObjectIds, QueryFlags, cRequestedProperties, pRequestedProperties, cFilterExpressionCount, pFilter, pCallback, pContext, phDevQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/devquery/nf-devquery-devcreateobjectqueryfromidsex
  public static DevCreateObjectQueryFromIdsEx(ObjectType: ULONG, pszzObjectIds: PCZZWSTR, QueryFlags: ULONG, cRequestedProperties: ULONG, pRequestedProperties: PVOID | NULL, cFilterExpressionCount: ULONG, pFilter: PVOID | NULL, cExtendedParameterCount: ULONG, pExtendedParameters: PVOID | NULL, pCallback: PVOID, pContext: PVOID | NULL, phDevQuery: PHDEVQUERY): HRESULT {
    return Cfgmgr32.Load('DevCreateObjectQueryFromIdsEx')(ObjectType, pszzObjectIds, QueryFlags, cRequestedProperties, pRequestedProperties, cFilterExpressionCount, pFilter, cExtendedParameterCount, pExtendedParameters, pCallback, pContext, phDevQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/devquery/nf-devquery-devfindproperty
  public static DevFindProperty(pKey: PDEVPROPKEY, Store: ULONG, pszLocaleName: PCWSTR, cProperties: ULONG, pProperties: PVOID | NULL): PVOID {
    return Cfgmgr32.Load('DevFindProperty')(pKey, Store, pszLocaleName, cProperties, pProperties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/devquery/nf-devquery-devfreeobjectproperties
  public static DevFreeObjectProperties(cPropertyCount: ULONG, pProperties: PVOID): void {
    return Cfgmgr32.Load('DevFreeObjectProperties')(cPropertyCount, pProperties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/devquery/nf-devquery-devfreeobjects
  public static DevFreeObjects(cObjectCount: ULONG, pObjects: PVOID): void {
    return Cfgmgr32.Load('DevFreeObjects')(cObjectCount, pObjects);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/devquery/nf-devquery-devgetobjectproperties
  public static DevGetObjectProperties(ObjectType: ULONG, pszObjectId: PCWSTR, QueryFlags: ULONG, cRequestedProperties: ULONG, pRequestedProperties: PVOID, pcPropertyCount: PULONG, ppProperties: PVOID): HRESULT {
    return Cfgmgr32.Load('DevGetObjectProperties')(ObjectType, pszObjectId, QueryFlags, cRequestedProperties, pRequestedProperties, pcPropertyCount, ppProperties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/devquery/nf-devquery-devgetobjectpropertiesex
  public static DevGetObjectPropertiesEx(ObjectType: ULONG, pszObjectId: PCWSTR, QueryFlags: ULONG, cRequestedProperties: ULONG, pRequestedProperties: PVOID, cExtendedParameterCount: ULONG, pExtendedParameters: PVOID | NULL, pcPropertyCount: PULONG, ppProperties: PVOID): HRESULT {
    return Cfgmgr32.Load('DevGetObjectPropertiesEx')(ObjectType, pszObjectId, QueryFlags, cRequestedProperties, pRequestedProperties, cExtendedParameterCount, pExtendedParameters, pcPropertyCount, ppProperties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/devquery/nf-devquery-devgetobjects
  public static DevGetObjects(ObjectType: ULONG, QueryFlags: ULONG, cRequestedProperties: ULONG, pRequestedProperties: PVOID | NULL, cFilterExpressionCount: ULONG, pFilter: PVOID | NULL, pcObjectCount: PULONG, ppObjects: PVOID): HRESULT {
    return Cfgmgr32.Load('DevGetObjects')(ObjectType, QueryFlags, cRequestedProperties, pRequestedProperties, cFilterExpressionCount, pFilter, pcObjectCount, ppObjects);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/devquery/nf-devquery-devgetobjectsex
  public static DevGetObjectsEx(ObjectType: ULONG, QueryFlags: ULONG, cRequestedProperties: ULONG, pRequestedProperties: PVOID | NULL, cFilterExpressionCount: ULONG, pFilter: PVOID | NULL, cExtendedParameterCount: ULONG, pExtendedParameters: PVOID | NULL, pcObjectCount: PULONG, ppObjects: PVOID): HRESULT {
    return Cfgmgr32.Load('DevGetObjectsEx')(ObjectType, QueryFlags, cRequestedProperties, pRequestedProperties, cFilterExpressionCount, pFilter, cExtendedParameterCount, pExtendedParameters, pcObjectCount, ppObjects);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/swdevice/nf-swdevice-swdeviceclose
  public static SwDeviceClose(hSwDevice: HSWDEVICE): void {
    return Cfgmgr32.Load('SwDeviceClose')(hSwDevice);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/swdevice/nf-swdevice-swdevicecreate
  public static SwDeviceCreate(pszEnumeratorName: PCWSTR, pszParentDeviceInstance: PCWSTR, pCreateInfo: PVOID, cPropertyCount: ULONG, pProperties: PVOID | NULL, pCallback: PVOID, pContext: PVOID | NULL, phSwDevice: PHSWDEVICE): HRESULT {
    return Cfgmgr32.Load('SwDeviceCreate')(pszEnumeratorName, pszParentDeviceInstance, pCreateInfo, cPropertyCount, pProperties, pCallback, pContext, phSwDevice);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/swdevice/nf-swdevice-swdevicegetlifetime
  public static SwDeviceGetLifetime(hSwDevice: HSWDEVICE, pLifetime: PSW_DEVICE_LIFETIME): HRESULT {
    return Cfgmgr32.Load('SwDeviceGetLifetime')(hSwDevice, pLifetime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/swdevice/nf-swdevice-swdeviceinterfacepropertyset
  public static SwDeviceInterfacePropertySet(hSwDevice: HSWDEVICE, pszDeviceInterfaceId: PCWSTR, cPropertyCount: ULONG, pProperties: PVOID): HRESULT {
    return Cfgmgr32.Load('SwDeviceInterfacePropertySet')(hSwDevice, pszDeviceInterfaceId, cPropertyCount, pProperties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/swdevice/nf-swdevice-swdeviceinterfaceregister
  public static SwDeviceInterfaceRegister(hSwDevice: HSWDEVICE, pInterfaceClassGuid: LPGUID, pszReferenceString: PCWSTR | NULL, cPropertyCount: ULONG, pProperties: PVOID | NULL, fEnabled: BOOL, ppszDeviceInterfaceId: PVOID): HRESULT {
    return Cfgmgr32.Load('SwDeviceInterfaceRegister')(hSwDevice, pInterfaceClassGuid, pszReferenceString, cPropertyCount, pProperties, fEnabled, ppszDeviceInterfaceId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/swdevice/nf-swdevice-swdeviceinterfacesetstate
  public static SwDeviceInterfaceSetState(hSwDevice: HSWDEVICE, pszDeviceInterfaceId: PCWSTR, fEnabled: BOOL): HRESULT {
    return Cfgmgr32.Load('SwDeviceInterfaceSetState')(hSwDevice, pszDeviceInterfaceId, fEnabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/swdevice/nf-swdevice-swdevicepropertyset
  public static SwDevicePropertySet(hSwDevice: HSWDEVICE, cPropertyCount: ULONG, pProperties: PVOID): HRESULT {
    return Cfgmgr32.Load('SwDevicePropertySet')(hSwDevice, cPropertyCount, pProperties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/swdevice/nf-swdevice-swdevicesetlifetime
  public static SwDeviceSetLifetime(hSwDevice: HSWDEVICE, Lifetime: ULONG): HRESULT {
    return Cfgmgr32.Load('SwDeviceSetLifetime')(hSwDevice, Lifetime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/swdevice/nf-swdevice-swmemfree
  public static SwMemFree(pMem: PVOID): void {
    return Cfgmgr32.Load('SwMemFree')(pMem);
  }
}

export default Cfgmgr32;
