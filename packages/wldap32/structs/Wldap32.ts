import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOLEAN,
  DBGPRINT,
  HANDLE,
  INT,
  LPCSTR,
  LPCWSTR,
  LPSTR,
  LPVOID,
  LPWSTR,
  NULLABLE,
  OPTIONAL,
  PBERVAL,
  PBerElement,
  PCHAR,
  PHANDLE,
  PINT,
  PLDAP,
  PLDAPControlA,
  PLDAPControlW,
  PLDAPMessage,
  PLDAPSearch,
  PLDAPVLVInfo,
  PLDAP_TIMEVAL,
  PLDAP_VERSION_INFO,
  PPBERVAL,
  PPBerElement,
  PPCHAR,
  PPLDAPControlA,
  PPLDAPControlW,
  PPLDAPMessage,
  PPLDAPModA,
  PPLDAPModW,
  PPLDAPSortKeyA,
  PPLDAPSortKeyW,
  PPPLDAPControlA,
  PPPLDAPControlW,
  PPZPSTR,
  PPZPWSTR,
  PSTR,
  PULONG,
  PWCHAR,
  PWSTR,
  PZPSTR,
  PZPWSTR,
  UCHAR,
  ULONG,
} from '../types/Wldap32';

/**
 * Thin, lazy-loaded FFI bindings for `wldap32.dll`.
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
 * import Wldap32 from './structs/Wldap32';
 *
 * // Lazy: bind on first call
 * const ld = Wldap32.ldap_initW(null, 389);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Wldap32.Preload(['ldap_initW', 'ldap_connect', 'ldap_unbind']);
 * ```
 */
class Wldap32 extends Win32 {
  protected static override name = 'wldap32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    LdapGetLastError: { args: [], returns: FFIType.u32 },
    LdapMapErrorToWin32: { args: [FFIType.u32], returns: FFIType.u32 },
    LdapUTF8ToUnicode: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    LdapUnicodeToUTF8: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    ber_alloc_t: { args: [FFIType.i32], returns: FFIType.u64 },
    ber_bvdup: { args: [FFIType.ptr], returns: FFIType.ptr },
    ber_bvecfree: { args: [FFIType.ptr], returns: FFIType.void },
    ber_bvfree: { args: [FFIType.ptr], returns: FFIType.void },
    ber_first_element: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ber_flatten: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ber_free: { args: [FFIType.u64, FFIType.i32], returns: FFIType.void },
    ber_init: { args: [FFIType.ptr], returns: FFIType.u64 },
    ber_next_element: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ber_peek_tag: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ber_printf: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ber_scanf: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ber_skip_tag: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    cldap_open: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    cldap_openA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    cldap_openW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    ldap_abandon: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    ldap_add: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_addA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_addW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_add_ext: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_add_extA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_add_extW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_add_ext_s: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_add_ext_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_add_ext_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_add_s: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_add_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_add_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_bind: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ldap_bindA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ldap_bindW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ldap_bind_s: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ldap_bind_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ldap_bind_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ldap_check_filterA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ldap_check_filterW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ldap_cleanup: { args: [FFIType.u64], returns: FFIType.u32 },
    ldap_close_extended_op: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    ldap_compare: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_compareA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_compareW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_compare_ext: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_compare_extA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_compare_extW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_compare_ext_s: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_compare_ext_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_compare_ext_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_compare_s: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_compare_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_compare_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_conn_from_msg: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    ldap_connect: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ldap_control_free: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_control_freeA: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_control_freeW: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_controls_free: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_controls_freeA: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_controls_freeW: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_count_entries: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    ldap_count_references: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    ldap_count_values: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_count_valuesA: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_count_valuesW: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_count_values_len: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_create_page_control: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u8, FFIType.ptr], returns: FFIType.u32 },
    ldap_create_page_controlA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u8, FFIType.ptr], returns: FFIType.u32 },
    ldap_create_page_controlW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u8, FFIType.ptr], returns: FFIType.u32 },
    ldap_create_sort_control: { args: [FFIType.u64, FFIType.ptr, FFIType.u8, FFIType.ptr], returns: FFIType.u32 },
    ldap_create_sort_controlA: { args: [FFIType.u64, FFIType.ptr, FFIType.u8, FFIType.ptr], returns: FFIType.u32 },
    ldap_create_sort_controlW: { args: [FFIType.u64, FFIType.ptr, FFIType.u8, FFIType.ptr], returns: FFIType.u32 },
    ldap_create_vlv_controlA: { args: [FFIType.u64, FFIType.ptr, FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    ldap_create_vlv_controlW: { args: [FFIType.u64, FFIType.ptr, FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    ldap_delete: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ldap_deleteA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ldap_deleteW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ldap_delete_ext: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_delete_extA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_delete_extW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_delete_ext_s: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_delete_ext_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_delete_ext_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_delete_s: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ldap_delete_sA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ldap_delete_sW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ldap_dn2ufn: { args: [FFIType.ptr], returns: FFIType.ptr },
    ldap_dn2ufnA: { args: [FFIType.ptr], returns: FFIType.ptr },
    ldap_dn2ufnW: { args: [FFIType.ptr], returns: FFIType.ptr },
    ldap_encode_sort_controlA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.u32 },
    ldap_encode_sort_controlW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.u32 },
    ldap_err2string: { args: [FFIType.u32], returns: FFIType.ptr },
    ldap_err2stringA: { args: [FFIType.u32], returns: FFIType.ptr },
    ldap_err2stringW: { args: [FFIType.u32], returns: FFIType.ptr },
    ldap_escape_filter_element: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ldap_escape_filter_elementA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ldap_escape_filter_elementW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ldap_explode_dn: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    ldap_explode_dnA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    ldap_explode_dnW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    ldap_extended_operation: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_extended_operationA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_extended_operationW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_extended_operation_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_extended_operation_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_first_attribute: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    ldap_first_attributeA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    ldap_first_attributeW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    ldap_first_entry: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    ldap_first_reference: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    ldap_free_controls: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_free_controlsA: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_free_controlsW: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_get_dn: { args: [FFIType.u64, FFIType.u64], returns: FFIType.ptr },
    ldap_get_dnA: { args: [FFIType.u64, FFIType.u64], returns: FFIType.ptr },
    ldap_get_dnW: { args: [FFIType.u64, FFIType.u64], returns: FFIType.ptr },
    ldap_get_next_page: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ldap_get_next_page_s: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_get_option: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    ldap_get_optionA: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    ldap_get_optionW: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    ldap_get_paged_count: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.u32 },
    ldap_get_values: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    ldap_get_valuesA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    ldap_get_valuesW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    ldap_get_values_len: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    ldap_get_values_lenA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    ldap_get_values_lenW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    ldap_init: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    ldap_initA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    ldap_initW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    ldap_memfree: { args: [FFIType.ptr], returns: FFIType.void },
    ldap_memfreeA: { args: [FFIType.ptr], returns: FFIType.void },
    ldap_memfreeW: { args: [FFIType.ptr], returns: FFIType.void },
    ldap_modify: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modifyA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modifyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modify_ext: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modify_extA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modify_extW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modify_ext_s: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modify_ext_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modify_ext_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modify_s: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modify_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modify_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modrdn: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modrdnA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modrdnW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modrdn2: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    ldap_modrdn2A: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    ldap_modrdn2W: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    ldap_modrdn2_s: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    ldap_modrdn2_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    ldap_modrdn2_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    ldap_modrdn_s: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modrdn_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_modrdn_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_msgfree: { args: [FFIType.u64], returns: FFIType.u32 },
    ldap_next_attribute: { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.ptr },
    ldap_next_attributeA: { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.ptr },
    ldap_next_attributeW: { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.ptr },
    ldap_next_entry: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    ldap_next_reference: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    ldap_open: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    ldap_openA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    ldap_openW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    ldap_parse_extended_resultA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.u32 },
    ldap_parse_extended_resultW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.u32 },
    ldap_parse_page_control: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_parse_page_controlA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_parse_page_controlW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_parse_reference: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ldap_parse_referenceA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ldap_parse_referenceW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    ldap_parse_result: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.u32 },
    ldap_parse_resultA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.u32 },
    ldap_parse_resultW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.u32 },
    ldap_parse_sort_control: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_parse_sort_controlA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_parse_sort_controlW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_parse_vlv_controlA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ldap_parse_vlv_controlW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ldap_perror: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.void },
    ldap_rename_ext: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_rename_extA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_rename_extW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_rename_ext_s: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_rename_ext_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_rename_ext_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_result: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_result2error: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    ldap_sasl_bindA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ldap_sasl_bindW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ldap_sasl_bind_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ldap_sasl_bind_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ldap_search: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ldap_searchA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ldap_searchW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ldap_search_abandon_page: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    ldap_search_ext: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ldap_search_extA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ldap_search_extW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ldap_search_ext_s: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ldap_search_ext_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ldap_search_ext_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ldap_search_init_page: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    ldap_search_init_pageA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    ldap_search_init_pageW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    ldap_search_s: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ldap_search_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ldap_search_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ldap_search_st: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_search_stA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_search_stW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_set_dbg_flags: { args: [FFIType.u32], returns: FFIType.u32 },
    ldap_set_dbg_routine: { args: [FFIType.ptr], returns: FFIType.void },
    ldap_set_option: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    ldap_set_optionA: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    ldap_set_optionW: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    ldap_simple_bind: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_simple_bindA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_simple_bindW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_simple_bind_s: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_simple_bind_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_simple_bind_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_sslinit: { args: [FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.u64 },
    ldap_sslinitA: { args: [FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.u64 },
    ldap_sslinitW: { args: [FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.u64 },
    ldap_start_tls_sA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_start_tls_sW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_startup: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_stop_tls_s: { args: [FFIType.u64], returns: FFIType.u8 },
    ldap_ufn2dn: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_ufn2dnA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_ufn2dnW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ldap_unbind: { args: [FFIType.u64], returns: FFIType.u32 },
    ldap_unbind_s: { args: [FFIType.u64], returns: FFIType.u32 },
    ldap_value_free: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_value_freeA: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_value_freeW: { args: [FFIType.ptr], returns: FFIType.u32 },
    ldap_value_free_len: { args: [FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldapgetlasterror
  public static LdapGetLastError(): ULONG {
    return Wldap32.Load('LdapGetLastError')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldapmaperrortowin32
  public static LdapMapErrorToWin32(LdapError: ULONG): ULONG {
    return Wldap32.Load('LdapMapErrorToWin32')(LdapError);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldaputf8tounicode
  public static LdapUTF8ToUnicode(lpSrcStr: LPCSTR, cchSrc: INT, lpDestStr_out: LPWSTR, cchDest: INT): INT {
    return Wldap32.Load('LdapUTF8ToUnicode')(lpSrcStr, cchSrc, lpDestStr_out, cchDest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldapunicodetoutf8
  public static LdapUnicodeToUTF8(lpSrcStr: LPCWSTR, cchSrc: INT, lpDestStr_out: LPSTR, cchDest: INT): INT {
    return Wldap32.Load('LdapUnicodeToUTF8')(lpSrcStr, cchSrc, lpDestStr_out, cchDest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winber/nf-winber-ber_alloc_t
  public static ber_alloc_t(options: INT): PBerElement {
    return Wldap32.Load('ber_alloc_t')(options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winber/nf-winber-ber_bvdup
  public static ber_bvdup(pBerVal: PBERVAL): PBERVAL {
    return Wldap32.Load('ber_bvdup')(pBerVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winber/nf-winber-ber_bvecfree
  public static ber_bvecfree(pBerVal: PPBERVAL): void {
    return Wldap32.Load('ber_bvecfree')(pBerVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winber/nf-winber-ber_bvfree
  public static ber_bvfree(pBerVal: PBERVAL): void {
    return Wldap32.Load('ber_bvfree')(pBerVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winber/nf-winber-ber_first_element
  public static ber_first_element(pBerElement: PBerElement, pLen_out: PULONG, ppOpaque_out: PPCHAR): ULONG {
    return Wldap32.Load('ber_first_element')(pBerElement, pLen_out, ppOpaque_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winber/nf-winber-ber_flatten
  public static ber_flatten(pBerElement: PBerElement, pBerVal_out: PPBERVAL): INT {
    return Wldap32.Load('ber_flatten')(pBerElement, pBerVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winber/nf-winber-ber_free
  public static ber_free(pBerElement: PBerElement, fbuf: INT): void {
    return Wldap32.Load('ber_free')(pBerElement, fbuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winber/nf-winber-ber_init
  public static ber_init(pBerVal: PBERVAL): PBerElement {
    return Wldap32.Load('ber_init')(pBerVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winber/nf-winber-ber_next_element
  public static ber_next_element(pBerElement: PBerElement, pLen_out: PULONG, opaque: PCHAR): ULONG {
    return Wldap32.Load('ber_next_element')(pBerElement, pLen_out, opaque);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winber/nf-winber-ber_peek_tag
  public static ber_peek_tag(pBerElement: PBerElement, pLen_out: PULONG): ULONG {
    return Wldap32.Load('ber_peek_tag')(pBerElement, pLen_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winber/nf-winber-ber_printf
  public static ber_printf(pBerElement: PBerElement, fmt: PSTR): INT {
    return Wldap32.Load('ber_printf')(pBerElement, fmt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winber/nf-winber-ber_scanf
  public static ber_scanf(pBerElement: PBerElement, fmt: PSTR): ULONG {
    return Wldap32.Load('ber_scanf')(pBerElement, fmt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winber/nf-winber-ber_skip_tag
  public static ber_skip_tag(pBerElement: PBerElement, pLen_out: PULONG): ULONG {
    return Wldap32.Load('ber_skip_tag')(pBerElement, pLen_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-cldap_open
  public static cldap_open(HostName: NULLABLE<PSTR>, PortNumber: ULONG): PLDAP {
    return Wldap32.Load('cldap_open')(HostName, PortNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-cldap_opena
  public static cldap_openA(HostName: NULLABLE<PSTR>, PortNumber: ULONG): PLDAP {
    return Wldap32.Load('cldap_openA')(HostName, PortNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-cldap_openw
  public static cldap_openW(HostName: NULLABLE<PWSTR>, PortNumber: ULONG): PLDAP {
    return Wldap32.Load('cldap_openW')(HostName, PortNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_abandon
  public static ldap_abandon(ld: PLDAP, msgid: ULONG): ULONG {
    return Wldap32.Load('ldap_abandon')(ld, msgid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_add
  public static ldap_add(ld: PLDAP, dn: PSTR, attrs: PPLDAPModA): ULONG {
    return Wldap32.Load('ldap_add')(ld, dn, attrs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_adda
  public static ldap_addA(ld: PLDAP, dn: PSTR, attrs: PPLDAPModA): ULONG {
    return Wldap32.Load('ldap_addA')(ld, dn, attrs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_addw
  public static ldap_addW(ld: PLDAP, dn: PWSTR, attrs: PPLDAPModW): ULONG {
    return Wldap32.Load('ldap_addW')(ld, dn, attrs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_add_ext
  public static ldap_add_ext(ld: PLDAP, dn: PSTR, attrs: PPLDAPModA, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_add_ext')(ld, dn, attrs, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_add_exta
  public static ldap_add_extA(ld: PLDAP, dn: PSTR, attrs: PPLDAPModA, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_add_extA')(ld, dn, attrs, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_add_extw
  public static ldap_add_extW(ld: PLDAP, dn: PWSTR, attrs: PPLDAPModW, ServerControls: NULLABLE<PPLDAPControlW>, ClientControls: NULLABLE<PPLDAPControlW>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_add_extW')(ld, dn, attrs, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_add_ext_s
  public static ldap_add_ext_s(ld: PLDAP, dn: PSTR, attrs: PPLDAPModA, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>): ULONG {
    return Wldap32.Load('ldap_add_ext_s')(ld, dn, attrs, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_add_ext_sa
  public static ldap_add_ext_sA(ld: PLDAP, dn: PSTR, attrs: PPLDAPModA, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>): ULONG {
    return Wldap32.Load('ldap_add_ext_sA')(ld, dn, attrs, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_add_ext_sw
  public static ldap_add_ext_sW(ld: PLDAP, dn: PWSTR, attrs: PPLDAPModW, ServerControls: NULLABLE<PPLDAPControlW>, ClientControls: NULLABLE<PPLDAPControlW>): ULONG {
    return Wldap32.Load('ldap_add_ext_sW')(ld, dn, attrs, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_add_s
  public static ldap_add_s(ld: PLDAP, dn: PSTR, attrs: PPLDAPModA): ULONG {
    return Wldap32.Load('ldap_add_s')(ld, dn, attrs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_add_sa
  public static ldap_add_sA(ld: PLDAP, dn: PSTR, attrs: PPLDAPModA): ULONG {
    return Wldap32.Load('ldap_add_sA')(ld, dn, attrs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_add_sw
  public static ldap_add_sW(ld: PLDAP, dn: PWSTR, attrs: PPLDAPModW): ULONG {
    return Wldap32.Load('ldap_add_sW')(ld, dn, attrs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_bind
  public static ldap_bind(ld: PLDAP, dn: OPTIONAL<PSTR>, cred: OPTIONAL<PCHAR>, method: ULONG): ULONG {
    return Wldap32.Load('ldap_bind')(ld, dn, cred, method);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_binda
  public static ldap_bindA(ld: PLDAP, dn: OPTIONAL<PSTR>, cred: OPTIONAL<PCHAR>, method: ULONG): ULONG {
    return Wldap32.Load('ldap_bindA')(ld, dn, cred, method);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_bindw
  public static ldap_bindW(ld: PLDAP, dn: OPTIONAL<PWSTR>, cred: OPTIONAL<PWCHAR>, method: ULONG): ULONG {
    return Wldap32.Load('ldap_bindW')(ld, dn, cred, method);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_bind_s
  public static ldap_bind_s(ld: PLDAP, dn: OPTIONAL<PSTR>, cred: OPTIONAL<PCHAR>, method: ULONG): ULONG {
    return Wldap32.Load('ldap_bind_s')(ld, dn, cred, method);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_bind_sa
  public static ldap_bind_sA(ld: PLDAP, dn: OPTIONAL<PSTR>, cred: OPTIONAL<PCHAR>, method: ULONG): ULONG {
    return Wldap32.Load('ldap_bind_sA')(ld, dn, cred, method);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_bind_sw
  public static ldap_bind_sW(ld: PLDAP, dn: OPTIONAL<PWSTR>, cred: OPTIONAL<PWCHAR>, method: ULONG): ULONG {
    return Wldap32.Load('ldap_bind_sW')(ld, dn, cred, method);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_check_filtera
  public static ldap_check_filterA(ld: PLDAP, SearchFilter: PSTR): ULONG {
    return Wldap32.Load('ldap_check_filterA')(ld, SearchFilter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_check_filterw
  public static ldap_check_filterW(ld: PLDAP, SearchFilter: PWSTR): ULONG {
    return Wldap32.Load('ldap_check_filterW')(ld, SearchFilter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_cleanup
  public static ldap_cleanup(hInstance: HANDLE): ULONG {
    return Wldap32.Load('ldap_cleanup')(hInstance);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_close_extended_op
  public static ldap_close_extended_op(ld: PLDAP, MessageNumber: ULONG): ULONG {
    return Wldap32.Load('ldap_close_extended_op')(ld, MessageNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_compare
  public static ldap_compare(ld: PLDAP, dn: PSTR, attr: PSTR, value: PSTR): ULONG {
    return Wldap32.Load('ldap_compare')(ld, dn, attr, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_comparea
  public static ldap_compareA(ld: PLDAP, dn: PSTR, attr: PSTR, value: PSTR): ULONG {
    return Wldap32.Load('ldap_compareA')(ld, dn, attr, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_comparew
  public static ldap_compareW(ld: PLDAP, dn: PWSTR, attr: PWSTR, value: PWSTR): ULONG {
    return Wldap32.Load('ldap_compareW')(ld, dn, attr, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_compare_ext
  public static ldap_compare_ext(ld: PLDAP, dn: PSTR, Attr: PSTR, Value: NULLABLE<PSTR>, Data: NULLABLE<PBERVAL>, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_compare_ext')(ld, dn, Attr, Value, Data, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_compare_exta
  public static ldap_compare_extA(ld: PLDAP, dn: PSTR, Attr: PSTR, Value: OPTIONAL<PSTR>, Data: OPTIONAL<PBERVAL>, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_compare_extA')(ld, dn, Attr, Value, Data, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_compare_extw
  public static ldap_compare_extW(ld: PLDAP, dn: PWSTR, Attr: PWSTR, Value: OPTIONAL<PWSTR>, Data: OPTIONAL<PBERVAL>, ServerControls: NULLABLE<PPLDAPControlW>, ClientControls: NULLABLE<PPLDAPControlW>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_compare_extW')(ld, dn, Attr, Value, Data, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_compare_ext_s
  public static ldap_compare_ext_s(ld: PLDAP, dn: PSTR, Attr: PSTR, Value: NULLABLE<PSTR>, Data: NULLABLE<PBERVAL>, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>): ULONG {
    return Wldap32.Load('ldap_compare_ext_s')(ld, dn, Attr, Value, Data, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_compare_ext_sa
  public static ldap_compare_ext_sA(ld: PLDAP, dn: PSTR, Attr: PSTR, Value: OPTIONAL<PSTR>, Data: OPTIONAL<PBERVAL>, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>): ULONG {
    return Wldap32.Load('ldap_compare_ext_sA')(ld, dn, Attr, Value, Data, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_compare_ext_sw
  public static ldap_compare_ext_sW(ld: PLDAP, dn: PWSTR, Attr: PWSTR, Value: OPTIONAL<PWSTR>, Data: OPTIONAL<PBERVAL>, ServerControls: NULLABLE<PPLDAPControlW>, ClientControls: NULLABLE<PPLDAPControlW>): ULONG {
    return Wldap32.Load('ldap_compare_ext_sW')(ld, dn, Attr, Value, Data, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_compare_s
  public static ldap_compare_s(ld: PLDAP, dn: PSTR, attr: PSTR, value: PSTR): ULONG {
    return Wldap32.Load('ldap_compare_s')(ld, dn, attr, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_compare_sa
  public static ldap_compare_sA(ld: PLDAP, dn: PSTR, attr: PSTR, value: PSTR): ULONG {
    return Wldap32.Load('ldap_compare_sA')(ld, dn, attr, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_compare_sw
  public static ldap_compare_sW(ld: PLDAP, dn: PWSTR, attr: PWSTR, value: PWSTR): ULONG {
    return Wldap32.Load('ldap_compare_sW')(ld, dn, attr, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_conn_from_msg
  public static ldap_conn_from_msg(PrimaryConn: PLDAP, res: PLDAPMessage): PLDAP {
    return Wldap32.Load('ldap_conn_from_msg')(PrimaryConn, res);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_connect
  public static ldap_connect(ld: PLDAP, timeout: NULLABLE<PLDAP_TIMEVAL>): ULONG {
    return Wldap32.Load('ldap_connect')(ld, timeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_control_free
  public static ldap_control_free(Control: PLDAPControlA): ULONG {
    return Wldap32.Load('ldap_control_free')(Control);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_control_freea
  public static ldap_control_freeA(Controls: PLDAPControlA): ULONG {
    return Wldap32.Load('ldap_control_freeA')(Controls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_control_freew
  public static ldap_control_freeW(Control: PLDAPControlW): ULONG {
    return Wldap32.Load('ldap_control_freeW')(Control);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_controls_free
  public static ldap_controls_free(Controls: PPLDAPControlA): ULONG {
    return Wldap32.Load('ldap_controls_free')(Controls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_controls_freea
  public static ldap_controls_freeA(Controls: PPLDAPControlA): ULONG {
    return Wldap32.Load('ldap_controls_freeA')(Controls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_controls_freew
  public static ldap_controls_freeW(Control: PPLDAPControlW): ULONG {
    return Wldap32.Load('ldap_controls_freeW')(Control);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_count_entries
  public static ldap_count_entries(ld: PLDAP, res: PLDAPMessage): ULONG {
    return Wldap32.Load('ldap_count_entries')(ld, res);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_count_references
  public static ldap_count_references(ld: PLDAP, res: PLDAPMessage): ULONG {
    return Wldap32.Load('ldap_count_references')(ld, res);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_count_values
  public static ldap_count_values(vals: OPTIONAL<PZPSTR>): ULONG {
    return Wldap32.Load('ldap_count_values')(vals);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_count_valuesa
  public static ldap_count_valuesA(vals: OPTIONAL<PZPSTR>): ULONG {
    return Wldap32.Load('ldap_count_valuesA')(vals);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_count_valuesw
  public static ldap_count_valuesW(vals: OPTIONAL<PZPWSTR>): ULONG {
    return Wldap32.Load('ldap_count_valuesW')(vals);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_count_values_len
  public static ldap_count_values_len(vals: PPBERVAL): ULONG {
    return Wldap32.Load('ldap_count_values_len')(vals);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_create_page_control
  public static ldap_create_page_control(ExternalHandle: PLDAP, PageSize: ULONG, Cookie: NULLABLE<PBERVAL>, IsCritical: UCHAR, Control_out: PPLDAPControlA): ULONG {
    return Wldap32.Load('ldap_create_page_control')(ExternalHandle, PageSize, Cookie, IsCritical, Control_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_create_page_controla
  public static ldap_create_page_controlA(ExternalHandle: PLDAP, PageSize: ULONG, Cookie: NULLABLE<PBERVAL>, IsCritical: UCHAR, Control_out: PPLDAPControlA): ULONG {
    return Wldap32.Load('ldap_create_page_controlA')(ExternalHandle, PageSize, Cookie, IsCritical, Control_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_create_page_controlw
  public static ldap_create_page_controlW(ExternalHandle: PLDAP, PageSize: ULONG, Cookie: NULLABLE<PBERVAL>, IsCritical: UCHAR, Control_out: PPLDAPControlW): ULONG {
    return Wldap32.Load('ldap_create_page_controlW')(ExternalHandle, PageSize, Cookie, IsCritical, Control_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_create_sort_control
  public static ldap_create_sort_control(ExternalHandle: PLDAP, SortKeys: PPLDAPSortKeyA, IsCritical: UCHAR, Control_out: PPLDAPControlA): ULONG {
    return Wldap32.Load('ldap_create_sort_control')(ExternalHandle, SortKeys, IsCritical, Control_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_create_sort_controla
  public static ldap_create_sort_controlA(ExternalHandle: PLDAP, SortKeys: PPLDAPSortKeyA, IsCritical: UCHAR, Control_out: PPLDAPControlA): ULONG {
    return Wldap32.Load('ldap_create_sort_controlA')(ExternalHandle, SortKeys, IsCritical, Control_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_create_sort_controlw
  public static ldap_create_sort_controlW(ExternalHandle: PLDAP, SortKeys: PPLDAPSortKeyW, IsCritical: UCHAR, Control_out: PPLDAPControlW): ULONG {
    return Wldap32.Load('ldap_create_sort_controlW')(ExternalHandle, SortKeys, IsCritical, Control_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_create_vlv_controla
  public static ldap_create_vlv_controlA(ExternalHandle: PLDAP, VlvInfo: PLDAPVLVInfo, IsCritical: UCHAR, Control_out: PPLDAPControlA): INT {
    return Wldap32.Load('ldap_create_vlv_controlA')(ExternalHandle, VlvInfo, IsCritical, Control_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_create_vlv_controlw
  public static ldap_create_vlv_controlW(ExternalHandle: PLDAP, VlvInfo: PLDAPVLVInfo, IsCritical: UCHAR, Control_out: PPLDAPControlW): INT {
    return Wldap32.Load('ldap_create_vlv_controlW')(ExternalHandle, VlvInfo, IsCritical, Control_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_delete
  public static ldap_delete(ld: PLDAP, dn: PSTR): ULONG {
    return Wldap32.Load('ldap_delete')(ld, dn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_deletea
  public static ldap_deleteA(ld: PLDAP, dn: PSTR): ULONG {
    return Wldap32.Load('ldap_deleteA')(ld, dn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_deletew
  public static ldap_deleteW(ld: PLDAP, dn: PWSTR): ULONG {
    return Wldap32.Load('ldap_deleteW')(ld, dn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_delete_ext
  public static ldap_delete_ext(ld: PLDAP, dn: PSTR, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_delete_ext')(ld, dn, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_delete_exta
  public static ldap_delete_extA(ld: PLDAP, dn: PSTR, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_delete_extA')(ld, dn, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_delete_extw
  public static ldap_delete_extW(ld: PLDAP, dn: PWSTR, ServerControls: NULLABLE<PPLDAPControlW>, ClientControls: NULLABLE<PPLDAPControlW>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_delete_extW')(ld, dn, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_delete_ext_s
  public static ldap_delete_ext_s(ld: PLDAP, dn: PSTR, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>): ULONG {
    return Wldap32.Load('ldap_delete_ext_s')(ld, dn, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_delete_ext_sa
  public static ldap_delete_ext_sA(ld: PLDAP, dn: PSTR, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>): ULONG {
    return Wldap32.Load('ldap_delete_ext_sA')(ld, dn, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_delete_ext_sw
  public static ldap_delete_ext_sW(ld: PLDAP, dn: PWSTR, ServerControls: NULLABLE<PPLDAPControlW>, ClientControls: NULLABLE<PPLDAPControlW>): ULONG {
    return Wldap32.Load('ldap_delete_ext_sW')(ld, dn, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_delete_s
  public static ldap_delete_s(ld: PLDAP, dn: PSTR): ULONG {
    return Wldap32.Load('ldap_delete_s')(ld, dn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_delete_sa
  public static ldap_delete_sA(ld: PLDAP, dn: PSTR): ULONG {
    return Wldap32.Load('ldap_delete_sA')(ld, dn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_delete_sw
  public static ldap_delete_sW(ld: PLDAP, dn: PWSTR): ULONG {
    return Wldap32.Load('ldap_delete_sW')(ld, dn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_dn2ufn
  public static ldap_dn2ufn(dn: PSTR): PCHAR {
    return Wldap32.Load('ldap_dn2ufn')(dn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_dn2ufna
  public static ldap_dn2ufnA(dn: PSTR): PCHAR {
    return Wldap32.Load('ldap_dn2ufnA')(dn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_dn2ufnw
  public static ldap_dn2ufnW(dn: PWSTR): PWCHAR {
    return Wldap32.Load('ldap_dn2ufnW')(dn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_encode_sort_controla
  public static ldap_encode_sort_controlA(ExternalHandle: PLDAP, SortKeys: PPLDAPSortKeyA, Control: PLDAPControlA, Criticality: BOOLEAN): ULONG {
    return Wldap32.Load('ldap_encode_sort_controlA')(ExternalHandle, SortKeys, Control, Criticality);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_encode_sort_controlw
  public static ldap_encode_sort_controlW(ExternalHandle: PLDAP, SortKeys: PPLDAPSortKeyW, Control: PLDAPControlW, Criticality: BOOLEAN): ULONG {
    return Wldap32.Load('ldap_encode_sort_controlW')(ExternalHandle, SortKeys, Control, Criticality);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_err2string
  public static ldap_err2string(err: ULONG): PCHAR {
    return Wldap32.Load('ldap_err2string')(err);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_err2stringa
  public static ldap_err2stringA(err: ULONG): PCHAR {
    return Wldap32.Load('ldap_err2stringA')(err);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_err2stringw
  public static ldap_err2stringW(err: ULONG): PWCHAR {
    return Wldap32.Load('ldap_err2stringW')(err);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_escape_filter_element
  public static ldap_escape_filter_element(sourceFilterElement: PCHAR, sourceLength: ULONG, destFilterElement_out: OPTIONAL<PCHAR>, destLength: ULONG): ULONG {
    return Wldap32.Load('ldap_escape_filter_element')(sourceFilterElement, sourceLength, destFilterElement_out, destLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_escape_filter_elementa
  public static ldap_escape_filter_elementA(sourceFilterElement: PCHAR, sourceLength: ULONG, destFilterElement_out: OPTIONAL<PCHAR>, destLength: ULONG): ULONG {
    return Wldap32.Load('ldap_escape_filter_elementA')(sourceFilterElement, sourceLength, destFilterElement_out, destLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_escape_filter_elementw
  public static ldap_escape_filter_elementW(sourceFilterElement: PCHAR, sourceLength: ULONG, destFilterElement_out: OPTIONAL<PWCHAR>, destLength: ULONG): ULONG {
    return Wldap32.Load('ldap_escape_filter_elementW')(sourceFilterElement, sourceLength, destFilterElement_out, destLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_explode_dn
  public static ldap_explode_dn(dn: PSTR, notypes: ULONG): PZPSTR {
    return Wldap32.Load('ldap_explode_dn')(dn, notypes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_explode_dna
  public static ldap_explode_dnA(dn: PSTR, notypes: ULONG): PZPSTR {
    return Wldap32.Load('ldap_explode_dnA')(dn, notypes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_explode_dnw
  public static ldap_explode_dnW(dn: PWSTR, notypes: ULONG): PZPWSTR {
    return Wldap32.Load('ldap_explode_dnW')(dn, notypes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_extended_operation
  public static ldap_extended_operation(ld: PLDAP, Oid: PSTR, Data: NULLABLE<PBERVAL>, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_extended_operation')(ld, Oid, Data, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_extended_operationa
  public static ldap_extended_operationA(ld: PLDAP, Oid: PSTR, Data: NULLABLE<PBERVAL>, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_extended_operationA')(ld, Oid, Data, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_extended_operationw
  public static ldap_extended_operationW(ld: PLDAP, Oid: PWSTR, Data: NULLABLE<PBERVAL>, ServerControls: NULLABLE<PPLDAPControlW>, ClientControls: NULLABLE<PPLDAPControlW>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_extended_operationW')(ld, Oid, Data, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_extended_operation_sa
  public static ldap_extended_operation_sA(
    ExternalHandle: PLDAP,
    Oid: PSTR,
    Data: NULLABLE<PBERVAL>,
    ServerControls: NULLABLE<PPLDAPControlA>,
    ClientControls: NULLABLE<PPLDAPControlA>,
    ReturnedOid_out: PZPSTR,
    ReturnedData_out: PPBERVAL,
  ): ULONG {
    return Wldap32.Load('ldap_extended_operation_sA')(ExternalHandle, Oid, Data, ServerControls, ClientControls, ReturnedOid_out, ReturnedData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_extended_operation_sw
  public static ldap_extended_operation_sW(
    ExternalHandle: PLDAP,
    Oid: PWSTR,
    Data: NULLABLE<PBERVAL>,
    ServerControls: NULLABLE<PPLDAPControlW>,
    ClientControls: NULLABLE<PPLDAPControlW>,
    ReturnedOid_out: PZPWSTR,
    ReturnedData_out: PPBERVAL,
  ): ULONG {
    return Wldap32.Load('ldap_extended_operation_sW')(ExternalHandle, Oid, Data, ServerControls, ClientControls, ReturnedOid_out, ReturnedData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_first_attribute
  public static ldap_first_attribute(ld: PLDAP, entry: PLDAPMessage, ptr_out: PPBerElement): PCHAR {
    return Wldap32.Load('ldap_first_attribute')(ld, entry, ptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_first_attributea
  public static ldap_first_attributeA(ld: PLDAP, entry: PLDAPMessage, ptr_out: PPBerElement): PCHAR {
    return Wldap32.Load('ldap_first_attributeA')(ld, entry, ptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_first_attributew
  public static ldap_first_attributeW(ld: PLDAP, entry: PLDAPMessage, ptr_out: PPBerElement): PWCHAR {
    return Wldap32.Load('ldap_first_attributeW')(ld, entry, ptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_first_entry
  public static ldap_first_entry(ld: PLDAP, res: PLDAPMessage): PLDAPMessage {
    return Wldap32.Load('ldap_first_entry')(ld, res);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_first_reference
  public static ldap_first_reference(ld: PLDAP, res: PLDAPMessage): PLDAPMessage {
    return Wldap32.Load('ldap_first_reference')(ld, res);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_free_controls
  public static ldap_free_controls(Controls: PPLDAPControlA): ULONG {
    return Wldap32.Load('ldap_free_controls')(Controls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_free_controlsa
  public static ldap_free_controlsA(Controls: PPLDAPControlA): ULONG {
    return Wldap32.Load('ldap_free_controlsA')(Controls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_free_controlsw
  public static ldap_free_controlsW(Controls: PPLDAPControlW): ULONG {
    return Wldap32.Load('ldap_free_controlsW')(Controls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_get_dn
  public static ldap_get_dn(ld: PLDAP, entry: PLDAPMessage): PCHAR {
    return Wldap32.Load('ldap_get_dn')(ld, entry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_get_dna
  public static ldap_get_dnA(ld: PLDAP, entry: PLDAPMessage): PCHAR {
    return Wldap32.Load('ldap_get_dnA')(ld, entry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_get_dnw
  public static ldap_get_dnW(ld: PLDAP, entry: PLDAPMessage): PWCHAR {
    return Wldap32.Load('ldap_get_dnW')(ld, entry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_get_next_page
  public static ldap_get_next_page(ExternalHandle: PLDAP, SearchHandle: PLDAPSearch, PageSize: ULONG, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_get_next_page')(ExternalHandle, SearchHandle, PageSize, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_get_next_page_s
  public static ldap_get_next_page_s(ExternalHandle: PLDAP, SearchHandle: PLDAPSearch, timeout: NULLABLE<PLDAP_TIMEVAL>, PageSize: ULONG, TotalCount_out: PULONG, Results_out: PPLDAPMessage): ULONG {
    return Wldap32.Load('ldap_get_next_page_s')(ExternalHandle, SearchHandle, timeout, PageSize, TotalCount_out, Results_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_get_option
  public static ldap_get_option(ld: PLDAP, option: INT, outvalue_out: LPVOID): ULONG {
    return Wldap32.Load('ldap_get_option')(ld, option, outvalue_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_get_optiona
  public static ldap_get_optionA(ld: PLDAP, option: INT, outvalue_out: LPVOID): ULONG {
    return Wldap32.Load('ldap_get_optionA')(ld, option, outvalue_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_get_optionw
  public static ldap_get_optionW(ld: PLDAP, option: INT, outvalue_out: LPVOID): ULONG {
    return Wldap32.Load('ldap_get_optionW')(ld, option, outvalue_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_get_paged_count
  public static ldap_get_paged_count(ExternalHandle: PLDAP, SearchBlock: PLDAPSearch, TotalCount_out: PULONG, Results: PLDAPMessage): ULONG {
    return Wldap32.Load('ldap_get_paged_count')(ExternalHandle, SearchBlock, TotalCount_out, Results);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_get_values
  public static ldap_get_values(ld: PLDAP, entry: PLDAPMessage, attr: PSTR): PZPSTR {
    return Wldap32.Load('ldap_get_values')(ld, entry, attr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_get_valuesa
  public static ldap_get_valuesA(ld: PLDAP, entry: PLDAPMessage, attr: PSTR): PZPSTR {
    return Wldap32.Load('ldap_get_valuesA')(ld, entry, attr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_get_valuesw
  public static ldap_get_valuesW(ld: PLDAP, entry: PLDAPMessage, attr: PWSTR): PZPWSTR {
    return Wldap32.Load('ldap_get_valuesW')(ld, entry, attr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_get_values_len
  public static ldap_get_values_len(ExternalHandle: PLDAP, Message: PLDAPMessage, attr: PSTR): PPBERVAL {
    return Wldap32.Load('ldap_get_values_len')(ExternalHandle, Message, attr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_get_values_lena
  public static ldap_get_values_lenA(ExternalHandle: PLDAP, Message: PLDAPMessage, attr: PSTR): PPBERVAL {
    return Wldap32.Load('ldap_get_values_lenA')(ExternalHandle, Message, attr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_get_values_lenw
  public static ldap_get_values_lenW(ExternalHandle: PLDAP, Message: PLDAPMessage, attr: PWSTR): PPBERVAL {
    return Wldap32.Load('ldap_get_values_lenW')(ExternalHandle, Message, attr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_init
  public static ldap_init(HostName: NULLABLE<PSTR>, PortNumber: ULONG): PLDAP {
    return Wldap32.Load('ldap_init')(HostName, PortNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_inita
  public static ldap_initA(HostName: NULLABLE<PSTR>, PortNumber: ULONG): PLDAP {
    return Wldap32.Load('ldap_initA')(HostName, PortNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_initw
  public static ldap_initW(HostName: NULLABLE<PWSTR>, PortNumber: ULONG): PLDAP {
    return Wldap32.Load('ldap_initW')(HostName, PortNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_memfree
  public static ldap_memfree(Block: PCHAR): void {
    return Wldap32.Load('ldap_memfree')(Block);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_memfreea
  public static ldap_memfreeA(Block: PCHAR): void {
    return Wldap32.Load('ldap_memfreeA')(Block);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_memfreew
  public static ldap_memfreeW(Block: PWCHAR): void {
    return Wldap32.Load('ldap_memfreeW')(Block);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modify
  public static ldap_modify(ld: PLDAP, dn: PSTR, mods: PPLDAPModA): ULONG {
    return Wldap32.Load('ldap_modify')(ld, dn, mods);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modifya
  public static ldap_modifyA(ld: PLDAP, dn: PSTR, mods: PPLDAPModA): ULONG {
    return Wldap32.Load('ldap_modifyA')(ld, dn, mods);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modifyw
  public static ldap_modifyW(ld: PLDAP, dn: PWSTR, mods: PPLDAPModW): ULONG {
    return Wldap32.Load('ldap_modifyW')(ld, dn, mods);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modify_ext
  public static ldap_modify_ext(ld: PLDAP, dn: PSTR, mods: PPLDAPModA, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_modify_ext')(ld, dn, mods, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modify_exta
  public static ldap_modify_extA(ld: PLDAP, dn: PSTR, mods: PPLDAPModA, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_modify_extA')(ld, dn, mods, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modify_extw
  public static ldap_modify_extW(ld: PLDAP, dn: PWSTR, mods: PPLDAPModW, ServerControls: NULLABLE<PPLDAPControlW>, ClientControls: NULLABLE<PPLDAPControlW>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_modify_extW')(ld, dn, mods, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modify_ext_s
  public static ldap_modify_ext_s(ld: PLDAP, dn: PSTR, mods: PPLDAPModA, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>): ULONG {
    return Wldap32.Load('ldap_modify_ext_s')(ld, dn, mods, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modify_ext_sa
  public static ldap_modify_ext_sA(ld: PLDAP, dn: PSTR, mods: PPLDAPModA, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>): ULONG {
    return Wldap32.Load('ldap_modify_ext_sA')(ld, dn, mods, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modify_ext_sw
  public static ldap_modify_ext_sW(ld: PLDAP, dn: PWSTR, mods: PPLDAPModW, ServerControls: NULLABLE<PPLDAPControlW>, ClientControls: NULLABLE<PPLDAPControlW>): ULONG {
    return Wldap32.Load('ldap_modify_ext_sW')(ld, dn, mods, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modify_s
  public static ldap_modify_s(ld: PLDAP, dn: PSTR, mods: PPLDAPModA): ULONG {
    return Wldap32.Load('ldap_modify_s')(ld, dn, mods);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modify_sa
  public static ldap_modify_sA(ld: PLDAP, dn: PSTR, mods: PPLDAPModA): ULONG {
    return Wldap32.Load('ldap_modify_sA')(ld, dn, mods);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modify_sw
  public static ldap_modify_sW(ld: PLDAP, dn: PWSTR, mods: PPLDAPModW): ULONG {
    return Wldap32.Load('ldap_modify_sW')(ld, dn, mods);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modrdn
  public static ldap_modrdn(ExternalHandle: PLDAP, DistinguishedName: PSTR, NewDistinguishedName: PSTR): ULONG {
    return Wldap32.Load('ldap_modrdn')(ExternalHandle, DistinguishedName, NewDistinguishedName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modrdna
  public static ldap_modrdnA(ExternalHandle: PLDAP, DistinguishedName: PSTR, NewDistinguishedName: PSTR): ULONG {
    return Wldap32.Load('ldap_modrdnA')(ExternalHandle, DistinguishedName, NewDistinguishedName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modrdnw
  public static ldap_modrdnW(ExternalHandle: PLDAP, DistinguishedName: PWSTR, NewDistinguishedName: PWSTR): ULONG {
    return Wldap32.Load('ldap_modrdnW')(ExternalHandle, DistinguishedName, NewDistinguishedName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modrdn2
  public static ldap_modrdn2(ExternalHandle: PLDAP, DistinguishedName: PSTR, NewDistinguishedName: PSTR, DeleteOldRdn: INT): ULONG {
    return Wldap32.Load('ldap_modrdn2')(ExternalHandle, DistinguishedName, NewDistinguishedName, DeleteOldRdn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modrdn2a
  public static ldap_modrdn2A(ExternalHandle: PLDAP, DistinguishedName: PSTR, NewDistinguishedName: PSTR, DeleteOldRdn: INT): ULONG {
    return Wldap32.Load('ldap_modrdn2A')(ExternalHandle, DistinguishedName, NewDistinguishedName, DeleteOldRdn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modrdn2w
  public static ldap_modrdn2W(ExternalHandle: PLDAP, DistinguishedName: PWSTR, NewDistinguishedName: PWSTR, DeleteOldRdn: INT): ULONG {
    return Wldap32.Load('ldap_modrdn2W')(ExternalHandle, DistinguishedName, NewDistinguishedName, DeleteOldRdn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modrdn2_s
  public static ldap_modrdn2_s(ExternalHandle: PLDAP, DistinguishedName: PSTR, NewDistinguishedName: PSTR, DeleteOldRdn: INT): ULONG {
    return Wldap32.Load('ldap_modrdn2_s')(ExternalHandle, DistinguishedName, NewDistinguishedName, DeleteOldRdn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modrdn2_sa
  public static ldap_modrdn2_sA(ExternalHandle: PLDAP, DistinguishedName: PSTR, NewDistinguishedName: PSTR, DeleteOldRdn: INT): ULONG {
    return Wldap32.Load('ldap_modrdn2_sA')(ExternalHandle, DistinguishedName, NewDistinguishedName, DeleteOldRdn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modrdn2_sw
  public static ldap_modrdn2_sW(ExternalHandle: PLDAP, DistinguishedName: PWSTR, NewDistinguishedName: PWSTR, DeleteOldRdn: INT): ULONG {
    return Wldap32.Load('ldap_modrdn2_sW')(ExternalHandle, DistinguishedName, NewDistinguishedName, DeleteOldRdn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modrdn_s
  public static ldap_modrdn_s(ExternalHandle: PLDAP, DistinguishedName: PSTR, NewDistinguishedName: PSTR): ULONG {
    return Wldap32.Load('ldap_modrdn_s')(ExternalHandle, DistinguishedName, NewDistinguishedName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modrdn_sa
  public static ldap_modrdn_sA(ExternalHandle: PLDAP, DistinguishedName: PSTR, NewDistinguishedName: PSTR): ULONG {
    return Wldap32.Load('ldap_modrdn_sA')(ExternalHandle, DistinguishedName, NewDistinguishedName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_modrdn_sw
  public static ldap_modrdn_sW(ExternalHandle: PLDAP, DistinguishedName: PWSTR, NewDistinguishedName: PWSTR): ULONG {
    return Wldap32.Load('ldap_modrdn_sW')(ExternalHandle, DistinguishedName, NewDistinguishedName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_msgfree
  public static ldap_msgfree(res: PLDAPMessage): ULONG {
    return Wldap32.Load('ldap_msgfree')(res);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_next_attribute
  public static ldap_next_attribute(ld: PLDAP, entry: PLDAPMessage, ptr: PBerElement): PCHAR {
    return Wldap32.Load('ldap_next_attribute')(ld, entry, ptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_next_attributea
  public static ldap_next_attributeA(ld: PLDAP, entry: PLDAPMessage, ptr: PBerElement): PCHAR {
    return Wldap32.Load('ldap_next_attributeA')(ld, entry, ptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_next_attributew
  public static ldap_next_attributeW(ld: PLDAP, entry: PLDAPMessage, ptr: PBerElement): PWCHAR {
    return Wldap32.Load('ldap_next_attributeW')(ld, entry, ptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_next_entry
  public static ldap_next_entry(ld: PLDAP, entry: PLDAPMessage): PLDAPMessage {
    return Wldap32.Load('ldap_next_entry')(ld, entry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_next_reference
  public static ldap_next_reference(ld: PLDAP, entry: PLDAPMessage): PLDAPMessage {
    return Wldap32.Load('ldap_next_reference')(ld, entry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_open
  public static ldap_open(HostName: NULLABLE<PSTR>, PortNumber: ULONG): PLDAP {
    return Wldap32.Load('ldap_open')(HostName, PortNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_opena
  public static ldap_openA(HostName: NULLABLE<PSTR>, PortNumber: ULONG): PLDAP {
    return Wldap32.Load('ldap_openA')(HostName, PortNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_openw
  public static ldap_openW(HostName: NULLABLE<PWSTR>, PortNumber: ULONG): PLDAP {
    return Wldap32.Load('ldap_openW')(HostName, PortNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_extended_resulta
  public static ldap_parse_extended_resultA(Connection: PLDAP, ResultMessage: PLDAPMessage, ResultOID_out: OPTIONAL<PZPSTR>, ResultData_out: PPBERVAL, Freeit: BOOLEAN): ULONG {
    return Wldap32.Load('ldap_parse_extended_resultA')(Connection, ResultMessage, ResultOID_out, ResultData_out, Freeit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_extended_resultw
  public static ldap_parse_extended_resultW(Connection: PLDAP, ResultMessage: PLDAPMessage, ResultOID_out: OPTIONAL<PZPWSTR>, ResultData_out: PPBERVAL, Freeit: BOOLEAN): ULONG {
    return Wldap32.Load('ldap_parse_extended_resultW')(Connection, ResultMessage, ResultOID_out, ResultData_out, Freeit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_page_control
  public static ldap_parse_page_control(ExternalHandle: PLDAP, ServerControls: PPLDAPControlA, TotalCount_out: PULONG, Cookie_out: PPBERVAL): ULONG {
    return Wldap32.Load('ldap_parse_page_control')(ExternalHandle, ServerControls, TotalCount_out, Cookie_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_page_controla
  public static ldap_parse_page_controlA(ExternalHandle: PLDAP, ServerControls: PPLDAPControlA, TotalCount_out: PULONG, Cookie_out: PPBERVAL): ULONG {
    return Wldap32.Load('ldap_parse_page_controlA')(ExternalHandle, ServerControls, TotalCount_out, Cookie_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_page_controlw
  public static ldap_parse_page_controlW(ExternalHandle: PLDAP, ServerControls: PPLDAPControlW, TotalCount_out: PULONG, Cookie_out: PPBERVAL): ULONG {
    return Wldap32.Load('ldap_parse_page_controlW')(ExternalHandle, ServerControls, TotalCount_out, Cookie_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_reference
  public static ldap_parse_reference(Connection: PLDAP, ResultMessage: PLDAPMessage, Referrals_out: PPZPSTR): ULONG {
    return Wldap32.Load('ldap_parse_reference')(Connection, ResultMessage, Referrals_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_referencea
  public static ldap_parse_referenceA(Connection: PLDAP, ResultMessage: PLDAPMessage, Referrals_out: PPZPSTR): ULONG {
    return Wldap32.Load('ldap_parse_referenceA')(Connection, ResultMessage, Referrals_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_referencew
  public static ldap_parse_referenceW(Connection: PLDAP, ResultMessage: PLDAPMessage, Referrals_out: PPZPWSTR): ULONG {
    return Wldap32.Load('ldap_parse_referenceW')(Connection, ResultMessage, Referrals_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_result
  public static ldap_parse_result(
    Connection: PLDAP,
    ResultMessage: PLDAPMessage,
    ReturnCode_out: OPTIONAL<PULONG>,
    MatchedDNs_out: OPTIONAL<PZPSTR>,
    ErrorMessage_out: OPTIONAL<PZPSTR>,
    Referrals_out: OPTIONAL<PPZPSTR>,
    ServerControls_out: OPTIONAL<PPPLDAPControlA>,
    Freeit: BOOLEAN,
  ): ULONG {
    return Wldap32.Load('ldap_parse_result')(Connection, ResultMessage, ReturnCode_out, MatchedDNs_out, ErrorMessage_out, Referrals_out, ServerControls_out, Freeit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_resulta
  public static ldap_parse_resultA(
    Connection: PLDAP,
    ResultMessage: PLDAPMessage,
    ReturnCode_out: OPTIONAL<PULONG>,
    MatchedDNs_out: OPTIONAL<PZPSTR>,
    ErrorMessage_out: OPTIONAL<PZPSTR>,
    Referrals_out: OPTIONAL<PPZPSTR>,
    ServerControls_out: OPTIONAL<PPPLDAPControlA>,
    Freeit: BOOLEAN,
  ): ULONG {
    return Wldap32.Load('ldap_parse_resultA')(Connection, ResultMessage, ReturnCode_out, MatchedDNs_out, ErrorMessage_out, Referrals_out, ServerControls_out, Freeit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_resultw
  public static ldap_parse_resultW(
    Connection: PLDAP,
    ResultMessage: PLDAPMessage,
    ReturnCode_out: OPTIONAL<PULONG>,
    MatchedDNs_out: OPTIONAL<PZPWSTR>,
    ErrorMessage_out: OPTIONAL<PZPWSTR>,
    Referrals_out: OPTIONAL<PPZPWSTR>,
    ServerControls_out: OPTIONAL<PPPLDAPControlW>,
    Freeit: BOOLEAN,
  ): ULONG {
    return Wldap32.Load('ldap_parse_resultW')(Connection, ResultMessage, ReturnCode_out, MatchedDNs_out, ErrorMessage_out, Referrals_out, ServerControls_out, Freeit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_sort_control
  public static ldap_parse_sort_control(ExternalHandle: PLDAP, Control: PPLDAPControlA, Result_out: PULONG, Attribute_out: OPTIONAL<PZPSTR>): ULONG {
    return Wldap32.Load('ldap_parse_sort_control')(ExternalHandle, Control, Result_out, Attribute_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_sort_controla
  public static ldap_parse_sort_controlA(ExternalHandle: PLDAP, Control: PPLDAPControlA, Result_out: PULONG, Attribute_out: OPTIONAL<PZPSTR>): ULONG {
    return Wldap32.Load('ldap_parse_sort_controlA')(ExternalHandle, Control, Result_out, Attribute_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_sort_controlw
  public static ldap_parse_sort_controlW(ExternalHandle: PLDAP, Control: PPLDAPControlW, Result_out: PULONG, Attribute_out: OPTIONAL<PZPWSTR>): ULONG {
    return Wldap32.Load('ldap_parse_sort_controlW')(ExternalHandle, Control, Result_out, Attribute_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_vlv_controla
  public static ldap_parse_vlv_controlA(ExternalHandle: PLDAP, Control: PPLDAPControlA, TargetPos_out: PULONG, ListCount_out: PULONG, Context_out: PPBERVAL, ErrCode_out: PINT): INT {
    return Wldap32.Load('ldap_parse_vlv_controlA')(ExternalHandle, Control, TargetPos_out, ListCount_out, Context_out, ErrCode_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_parse_vlv_controlw
  public static ldap_parse_vlv_controlW(ExternalHandle: PLDAP, Control: PPLDAPControlW, TargetPos_out: PULONG, ListCount_out: PULONG, Context_out: PPBERVAL, ErrCode_out: PINT): INT {
    return Wldap32.Load('ldap_parse_vlv_controlW')(ExternalHandle, Control, TargetPos_out, ListCount_out, Context_out, ErrCode_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_perror
  public static ldap_perror(ld: PLDAP, msg: PCHAR): void {
    return Wldap32.Load('ldap_perror')(ld, msg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_rename_ext
  public static ldap_rename_ext(ld: PLDAP, dn: PSTR, NewRDN: PSTR, NewParent: PSTR, DeleteOldRdn: INT, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_rename_ext')(ld, dn, NewRDN, NewParent, DeleteOldRdn, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_rename_exta
  public static ldap_rename_extA(ld: PLDAP, dn: PSTR, NewRDN: PSTR, NewParent: OPTIONAL<PSTR>, DeleteOldRdn: INT, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_rename_extA')(ld, dn, NewRDN, NewParent, DeleteOldRdn, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_rename_extw
  public static ldap_rename_extW(ld: PLDAP, dn: PWSTR, NewRDN: PWSTR, NewParent: OPTIONAL<PWSTR>, DeleteOldRdn: INT, ServerControls: NULLABLE<PPLDAPControlW>, ClientControls: NULLABLE<PPLDAPControlW>, MessageNumber_out: PULONG): ULONG {
    return Wldap32.Load('ldap_rename_extW')(ld, dn, NewRDN, NewParent, DeleteOldRdn, ServerControls, ClientControls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_rename_ext_s
  public static ldap_rename_ext_s(ld: PLDAP, dn: PSTR, NewRDN: PSTR, NewParent: PSTR, DeleteOldRdn: INT, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>): ULONG {
    return Wldap32.Load('ldap_rename_ext_s')(ld, dn, NewRDN, NewParent, DeleteOldRdn, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_rename_ext_sa
  public static ldap_rename_ext_sA(ld: PLDAP, dn: PSTR, NewRDN: PSTR, NewParent: OPTIONAL<PSTR>, DeleteOldRdn: INT, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>): ULONG {
    return Wldap32.Load('ldap_rename_ext_sA')(ld, dn, NewRDN, NewParent, DeleteOldRdn, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_rename_ext_sw
  public static ldap_rename_ext_sW(ld: PLDAP, dn: PWSTR, NewRDN: PWSTR, NewParent: OPTIONAL<PWSTR>, DeleteOldRdn: INT, ServerControls: NULLABLE<PPLDAPControlW>, ClientControls: NULLABLE<PPLDAPControlW>): ULONG {
    return Wldap32.Load('ldap_rename_ext_sW')(ld, dn, NewRDN, NewParent, DeleteOldRdn, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_result
  public static ldap_result(ld: PLDAP, msgid: ULONG, all: ULONG, timeout: OPTIONAL<PLDAP_TIMEVAL>, res_out: PPLDAPMessage): ULONG {
    return Wldap32.Load('ldap_result')(ld, msgid, all, timeout, res_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_result2error
  public static ldap_result2error(ld: PLDAP, res: PLDAPMessage, freeit: ULONG): ULONG {
    return Wldap32.Load('ldap_result2error')(ld, res, freeit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_sasl_binda
  public static ldap_sasl_bindA(ExternalHandle: PLDAP, DistName: PSTR, AuthMechanism: PSTR, cred: PBERVAL, ServerCtrls: NULLABLE<PPLDAPControlA>, ClientCtrls: NULLABLE<PPLDAPControlA>, MessageNumber_out: PINT): INT {
    return Wldap32.Load('ldap_sasl_bindA')(ExternalHandle, DistName, AuthMechanism, cred, ServerCtrls, ClientCtrls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_sasl_bindw
  public static ldap_sasl_bindW(ExternalHandle: PLDAP, DistName: PWSTR, AuthMechanism: PWSTR, cred: PBERVAL, ServerCtrls: NULLABLE<PPLDAPControlW>, ClientCtrls: NULLABLE<PPLDAPControlW>, MessageNumber_out: PINT): INT {
    return Wldap32.Load('ldap_sasl_bindW')(ExternalHandle, DistName, AuthMechanism, cred, ServerCtrls, ClientCtrls, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_sasl_bind_sa
  public static ldap_sasl_bind_sA(ExternalHandle: PLDAP, DistName: PSTR, AuthMechanism: PSTR, cred: PBERVAL, ServerCtrls: NULLABLE<PPLDAPControlA>, ClientCtrls: NULLABLE<PPLDAPControlA>, ServerData_out: PPBERVAL): INT {
    return Wldap32.Load('ldap_sasl_bind_sA')(ExternalHandle, DistName, AuthMechanism, cred, ServerCtrls, ClientCtrls, ServerData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_sasl_bind_sw
  public static ldap_sasl_bind_sW(ExternalHandle: PLDAP, DistName: PWSTR, AuthMechanism: PWSTR, cred: PBERVAL, ServerCtrls: NULLABLE<PPLDAPControlW>, ClientCtrls: NULLABLE<PPLDAPControlW>, ServerData_out: PPBERVAL): INT {
    return Wldap32.Load('ldap_sasl_bind_sW')(ExternalHandle, DistName, AuthMechanism, cred, ServerCtrls, ClientCtrls, ServerData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search
  public static ldap_search(ld: PLDAP, base: OPTIONAL<PSTR>, scope: ULONG, filter: PSTR, attrs: NULLABLE<PZPSTR>, attrsonly: ULONG): ULONG {
    return Wldap32.Load('ldap_search')(ld, base, scope, filter, attrs, attrsonly);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_searcha
  public static ldap_searchA(ld: PLDAP, base: OPTIONAL<PSTR>, scope: ULONG, filter: PSTR, attrs: NULLABLE<PZPSTR>, attrsonly: ULONG): ULONG {
    return Wldap32.Load('ldap_searchA')(ld, base, scope, filter, attrs, attrsonly);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_searchw
  public static ldap_searchW(ld: PLDAP, base: OPTIONAL<PWSTR>, scope: ULONG, filter: PWSTR, attrs: NULLABLE<PZPWSTR>, attrsonly: ULONG): ULONG {
    return Wldap32.Load('ldap_searchW')(ld, base, scope, filter, attrs, attrsonly);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_abandon_page
  public static ldap_search_abandon_page(ExternalHandle: PLDAP, SearchBlock: PLDAPSearch): ULONG {
    return Wldap32.Load('ldap_search_abandon_page')(ExternalHandle, SearchBlock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_ext
  public static ldap_search_ext(
    ld: PLDAP,
    base: OPTIONAL<PSTR>,
    scope: ULONG,
    filter: PSTR,
    attrs: NULLABLE<PZPSTR>,
    attrsonly: ULONG,
    ServerControls: OPTIONAL<PPLDAPControlA>,
    ClientControls: OPTIONAL<PPLDAPControlA>,
    TimeLimit: ULONG,
    SizeLimit: ULONG,
    MessageNumber_out: PULONG,
  ): ULONG {
    return Wldap32.Load('ldap_search_ext')(ld, base, scope, filter, attrs, attrsonly, ServerControls, ClientControls, TimeLimit, SizeLimit, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_exta
  public static ldap_search_extA(
    ld: PLDAP,
    base: OPTIONAL<PSTR>,
    scope: ULONG,
    filter: PSTR,
    attrs: NULLABLE<PZPSTR>,
    attrsonly: ULONG,
    ServerControls: OPTIONAL<PPLDAPControlA>,
    ClientControls: OPTIONAL<PPLDAPControlA>,
    TimeLimit: ULONG,
    SizeLimit: ULONG,
    MessageNumber_out: PULONG,
  ): ULONG {
    return Wldap32.Load('ldap_search_extA')(ld, base, scope, filter, attrs, attrsonly, ServerControls, ClientControls, TimeLimit, SizeLimit, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_extw
  public static ldap_search_extW(
    ld: PLDAP,
    base: OPTIONAL<PWSTR>,
    scope: ULONG,
    filter: PWSTR,
    attrs: NULLABLE<PZPWSTR>,
    attrsonly: ULONG,
    ServerControls: OPTIONAL<PPLDAPControlW>,
    ClientControls: OPTIONAL<PPLDAPControlW>,
    TimeLimit: ULONG,
    SizeLimit: ULONG,
    MessageNumber_out: PULONG,
  ): ULONG {
    return Wldap32.Load('ldap_search_extW')(ld, base, scope, filter, attrs, attrsonly, ServerControls, ClientControls, TimeLimit, SizeLimit, MessageNumber_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_ext_s
  public static ldap_search_ext_s(
    ld: PLDAP,
    base: OPTIONAL<PSTR>,
    scope: ULONG,
    filter: PSTR,
    attrs: NULLABLE<PZPSTR>,
    attrsonly: ULONG,
    ServerControls: OPTIONAL<PPLDAPControlA>,
    ClientControls: OPTIONAL<PPLDAPControlA>,
    timeout: NULLABLE<PLDAP_TIMEVAL>,
    SizeLimit: ULONG,
    res_out: PPLDAPMessage,
  ): ULONG {
    return Wldap32.Load('ldap_search_ext_s')(ld, base, scope, filter, attrs, attrsonly, ServerControls, ClientControls, timeout, SizeLimit, res_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_ext_sa
  public static ldap_search_ext_sA(
    ld: PLDAP,
    base: OPTIONAL<PSTR>,
    scope: ULONG,
    filter: PSTR,
    attrs: NULLABLE<PZPSTR>,
    attrsonly: ULONG,
    ServerControls: OPTIONAL<PPLDAPControlA>,
    ClientControls: OPTIONAL<PPLDAPControlA>,
    timeout: NULLABLE<PLDAP_TIMEVAL>,
    SizeLimit: ULONG,
    res_out: PPLDAPMessage,
  ): ULONG {
    return Wldap32.Load('ldap_search_ext_sA')(ld, base, scope, filter, attrs, attrsonly, ServerControls, ClientControls, timeout, SizeLimit, res_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_ext_sw
  public static ldap_search_ext_sW(
    ld: PLDAP,
    base: OPTIONAL<PWSTR>,
    scope: ULONG,
    filter: PWSTR,
    attrs: NULLABLE<PZPWSTR>,
    attrsonly: ULONG,
    ServerControls: OPTIONAL<PPLDAPControlW>,
    ClientControls: OPTIONAL<PPLDAPControlW>,
    timeout: NULLABLE<PLDAP_TIMEVAL>,
    SizeLimit: ULONG,
    res_out: PPLDAPMessage,
  ): ULONG {
    return Wldap32.Load('ldap_search_ext_sW')(ld, base, scope, filter, attrs, attrsonly, ServerControls, ClientControls, timeout, SizeLimit, res_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_init_page
  public static ldap_search_init_page(
    ExternalHandle: PLDAP,
    DistinguishedName: PSTR,
    ScopeOfSearch: ULONG,
    SearchFilter: PSTR,
    AttributeList: NULLABLE<PZPSTR>,
    AttributesOnly: ULONG,
    ServerControls: NULLABLE<PPLDAPControlA>,
    ClientControls: NULLABLE<PPLDAPControlA>,
    PageTimeLimit: ULONG,
    TotalSizeLimit: ULONG,
    SortKeys: NULLABLE<PPLDAPSortKeyA>,
  ): PLDAPSearch {
    return Wldap32.Load('ldap_search_init_page')(ExternalHandle, DistinguishedName, ScopeOfSearch, SearchFilter, AttributeList, AttributesOnly, ServerControls, ClientControls, PageTimeLimit, TotalSizeLimit, SortKeys);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_init_pagea
  public static ldap_search_init_pageA(
    ExternalHandle: PLDAP,
    DistinguishedName: PSTR,
    ScopeOfSearch: ULONG,
    SearchFilter: PSTR,
    AttributeList: NULLABLE<PZPSTR>,
    AttributesOnly: ULONG,
    ServerControls: NULLABLE<PPLDAPControlA>,
    ClientControls: NULLABLE<PPLDAPControlA>,
    PageTimeLimit: ULONG,
    TotalSizeLimit: ULONG,
    SortKeys: NULLABLE<PPLDAPSortKeyA>,
  ): PLDAPSearch {
    return Wldap32.Load('ldap_search_init_pageA')(ExternalHandle, DistinguishedName, ScopeOfSearch, SearchFilter, AttributeList, AttributesOnly, ServerControls, ClientControls, PageTimeLimit, TotalSizeLimit, SortKeys);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_init_pagew
  public static ldap_search_init_pageW(
    ExternalHandle: PLDAP,
    DistinguishedName: PWSTR,
    ScopeOfSearch: ULONG,
    SearchFilter: PWSTR,
    AttributeList: NULLABLE<PZPWSTR>,
    AttributesOnly: ULONG,
    ServerControls: NULLABLE<PPLDAPControlW>,
    ClientControls: NULLABLE<PPLDAPControlW>,
    PageTimeLimit: ULONG,
    TotalSizeLimit: ULONG,
    SortKeys: NULLABLE<PPLDAPSortKeyW>,
  ): PLDAPSearch {
    return Wldap32.Load('ldap_search_init_pageW')(ExternalHandle, DistinguishedName, ScopeOfSearch, SearchFilter, AttributeList, AttributesOnly, ServerControls, ClientControls, PageTimeLimit, TotalSizeLimit, SortKeys);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_s
  public static ldap_search_s(ld: PLDAP, base: OPTIONAL<PSTR>, scope: ULONG, filter: PSTR, attrs: NULLABLE<PZPSTR>, attrsonly: ULONG, res_out: PPLDAPMessage): ULONG {
    return Wldap32.Load('ldap_search_s')(ld, base, scope, filter, attrs, attrsonly, res_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_sa
  public static ldap_search_sA(ld: PLDAP, base: OPTIONAL<PSTR>, scope: ULONG, filter: PSTR, attrs: NULLABLE<PZPSTR>, attrsonly: ULONG, res_out: PPLDAPMessage): ULONG {
    return Wldap32.Load('ldap_search_sA')(ld, base, scope, filter, attrs, attrsonly, res_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_sw
  public static ldap_search_sW(ld: PLDAP, base: OPTIONAL<PWSTR>, scope: ULONG, filter: PWSTR, attrs: NULLABLE<PZPWSTR>, attrsonly: ULONG, res_out: PPLDAPMessage): ULONG {
    return Wldap32.Load('ldap_search_sW')(ld, base, scope, filter, attrs, attrsonly, res_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_st
  public static ldap_search_st(ld: PLDAP, base: OPTIONAL<PSTR>, scope: ULONG, filter: PSTR, attrs: NULLABLE<PZPSTR>, attrsonly: ULONG, timeout: NULLABLE<PLDAP_TIMEVAL>, res_out: PPLDAPMessage): ULONG {
    return Wldap32.Load('ldap_search_st')(ld, base, scope, filter, attrs, attrsonly, timeout, res_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_sta
  public static ldap_search_stA(ld: PLDAP, base: OPTIONAL<PSTR>, scope: ULONG, filter: PSTR, attrs: NULLABLE<PZPSTR>, attrsonly: ULONG, timeout: NULLABLE<PLDAP_TIMEVAL>, res_out: PPLDAPMessage): ULONG {
    return Wldap32.Load('ldap_search_stA')(ld, base, scope, filter, attrs, attrsonly, timeout, res_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_search_stw
  public static ldap_search_stW(ld: PLDAP, base: OPTIONAL<PWSTR>, scope: ULONG, filter: PWSTR, attrs: NULLABLE<PZPWSTR>, attrsonly: ULONG, timeout: NULLABLE<PLDAP_TIMEVAL>, res_out: PPLDAPMessage): ULONG {
    return Wldap32.Load('ldap_search_stW')(ld, base, scope, filter, attrs, attrsonly, timeout, res_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_set_dbg_flags
  public static ldap_set_dbg_flags(NewFlags: ULONG): ULONG {
    return Wldap32.Load('ldap_set_dbg_flags')(NewFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_set_dbg_routine
  public static ldap_set_dbg_routine(DebugPrintRoutine: DBGPRINT): void {
    return Wldap32.Load('ldap_set_dbg_routine')(DebugPrintRoutine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_set_option
  public static ldap_set_option(ld: PLDAP, option: INT, invalue: LPVOID): ULONG {
    return Wldap32.Load('ldap_set_option')(ld, option, invalue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_set_optiona
  public static ldap_set_optionA(ld: PLDAP, option: INT, invalue: LPVOID): ULONG {
    return Wldap32.Load('ldap_set_optionA')(ld, option, invalue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_set_optionw
  public static ldap_set_optionW(ld: PLDAP, option: INT, invalue: LPVOID): ULONG {
    return Wldap32.Load('ldap_set_optionW')(ld, option, invalue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_simple_bind
  public static ldap_simple_bind(ld: PLDAP, dn: OPTIONAL<PSTR>, passwd: OPTIONAL<PSTR>): ULONG {
    return Wldap32.Load('ldap_simple_bind')(ld, dn, passwd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_simple_binda
  public static ldap_simple_bindA(ld: PLDAP, dn: OPTIONAL<PSTR>, passwd: OPTIONAL<PSTR>): ULONG {
    return Wldap32.Load('ldap_simple_bindA')(ld, dn, passwd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_simple_bindw
  public static ldap_simple_bindW(ld: PLDAP, dn: OPTIONAL<PWSTR>, passwd: OPTIONAL<PWSTR>): ULONG {
    return Wldap32.Load('ldap_simple_bindW')(ld, dn, passwd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_simple_bind_s
  public static ldap_simple_bind_s(ld: PLDAP, dn: OPTIONAL<PSTR>, passwd: OPTIONAL<PSTR>): ULONG {
    return Wldap32.Load('ldap_simple_bind_s')(ld, dn, passwd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_simple_bind_sa
  public static ldap_simple_bind_sA(ld: PLDAP, dn: OPTIONAL<PSTR>, passwd: OPTIONAL<PSTR>): ULONG {
    return Wldap32.Load('ldap_simple_bind_sA')(ld, dn, passwd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_simple_bind_sw
  public static ldap_simple_bind_sW(ld: PLDAP, dn: OPTIONAL<PWSTR>, passwd: OPTIONAL<PWSTR>): ULONG {
    return Wldap32.Load('ldap_simple_bind_sW')(ld, dn, passwd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_sslinit
  public static ldap_sslinit(HostName: NULLABLE<PSTR>, PortNumber: ULONG, secure: INT): PLDAP {
    return Wldap32.Load('ldap_sslinit')(HostName, PortNumber, secure);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_sslinita
  public static ldap_sslinitA(HostName: NULLABLE<PSTR>, PortNumber: ULONG, secure: INT): PLDAP {
    return Wldap32.Load('ldap_sslinitA')(HostName, PortNumber, secure);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_sslinitw
  public static ldap_sslinitW(HostName: NULLABLE<PWSTR>, PortNumber: ULONG, secure: INT): PLDAP {
    return Wldap32.Load('ldap_sslinitW')(HostName, PortNumber, secure);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_start_tls_sa
  public static ldap_start_tls_sA(ExternalHandle: PLDAP, ServerReturnValue_out: PULONG, result_out: PPLDAPMessage, ServerControls: NULLABLE<PPLDAPControlA>, ClientControls: NULLABLE<PPLDAPControlA>): ULONG {
    return Wldap32.Load('ldap_start_tls_sA')(ExternalHandle, ServerReturnValue_out, result_out, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_start_tls_sw
  public static ldap_start_tls_sW(ExternalHandle: PLDAP, ServerReturnValue_out: PULONG, result_out: PPLDAPMessage, ServerControls: NULLABLE<PPLDAPControlW>, ClientControls: NULLABLE<PPLDAPControlW>): ULONG {
    return Wldap32.Load('ldap_start_tls_sW')(ExternalHandle, ServerReturnValue_out, result_out, ServerControls, ClientControls);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_startup
  public static ldap_startup(version: PLDAP_VERSION_INFO, Instance_out: PHANDLE): ULONG {
    return Wldap32.Load('ldap_startup')(version, Instance_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_stop_tls_s
  public static ldap_stop_tls_s(ExternalHandle: PLDAP): BOOLEAN {
    return Wldap32.Load('ldap_stop_tls_s')(ExternalHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_ufn2dn
  public static ldap_ufn2dn(ufn: PSTR, pDn_out: PZPSTR): ULONG {
    return Wldap32.Load('ldap_ufn2dn')(ufn, pDn_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_ufn2dna
  public static ldap_ufn2dnA(ufn: PSTR, pDn_out: PZPSTR): ULONG {
    return Wldap32.Load('ldap_ufn2dnA')(ufn, pDn_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_ufn2dnw
  public static ldap_ufn2dnW(ufn: PWSTR, pDn_out: PZPWSTR): ULONG {
    return Wldap32.Load('ldap_ufn2dnW')(ufn, pDn_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_unbind
  public static ldap_unbind(ld: PLDAP): ULONG {
    return Wldap32.Load('ldap_unbind')(ld);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_unbind_s
  public static ldap_unbind_s(ld: PLDAP): ULONG {
    return Wldap32.Load('ldap_unbind_s')(ld);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_value_free
  public static ldap_value_free(vals: OPTIONAL<PZPSTR>): ULONG {
    return Wldap32.Load('ldap_value_free')(vals);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_value_freea
  public static ldap_value_freeA(vals: OPTIONAL<PZPSTR>): ULONG {
    return Wldap32.Load('ldap_value_freeA')(vals);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_value_freew
  public static ldap_value_freeW(vals: OPTIONAL<PZPWSTR>): ULONG {
    return Wldap32.Load('ldap_value_freeW')(vals);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winldap/nf-winldap-ldap_value_free_len
  public static ldap_value_free_len(vals: PPBERVAL): ULONG {
    return Wldap32.Load('ldap_value_free_len')(vals);
  }
}

export default Wldap32;
