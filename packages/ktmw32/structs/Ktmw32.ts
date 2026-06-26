import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  ACCESS_MASK,
  BOOL,
  DWORD,
  HANDLE,
  LPGUID,
  LPOVERLAPPED,
  LPSECURITY_ATTRIBUTES,
  LPWSTR,
  NOTIFICATION_MASK,
  NULLABLE,
  OPTIONAL,
  PDWORD,
  PLARGE_INTEGER,
  PTRANSACTION_NOTIFICATION,
  PULONG,
  PVOID,
  ULONG,
  ULONG_PTR,
} from '../types/Ktmw32';

/**
 * Thin, lazy-loaded FFI bindings for `ktmw32.dll`.
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
 * import Ktmw32 from './structs/Ktmw32';
 *
 * // Lazy: bind on first call
 * const hTransaction = Ktmw32.CreateTransaction(null, null, 0, 0, 0, 0, null);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Ktmw32.Preload(['CreateTransaction', 'CommitTransaction', 'RollbackTransaction']);
 * ```
 */
class Ktmw32 extends Win32 {
  protected static override name = 'ktmw32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CommitComplete: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CommitEnlistment: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CommitTransaction: { args: [FFIType.u64], returns: FFIType.i32 },
    CommitTransactionAsync: { args: [FFIType.u64], returns: FFIType.i32 },
    CreateEnlistment: { args: [FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateResourceManager: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    CreateTransaction: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateTransactionManager: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    GetCurrentClockTransactionManager: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetEnlistmentId: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetEnlistmentRecoveryInformation: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetNotificationResourceManager: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetNotificationResourceManagerAsync: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetTransactionId: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetTransactionInformation: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetTransactionManagerId: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    OpenEnlistment: { args: [FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    OpenResourceManager: { args: [FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    OpenTransaction: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    OpenTransactionManager: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    OpenTransactionManagerById: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    PrePrepareComplete: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PrePrepareEnlistment: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PrepareComplete: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PrepareEnlistment: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ReadOnlyEnlistment: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RecoverEnlistment: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RecoverResourceManager: { args: [FFIType.u64], returns: FFIType.i32 },
    RecoverTransactionManager: { args: [FFIType.u64], returns: FFIType.i32 },
    RenameTransactionManager: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RollbackComplete: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RollbackEnlistment: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RollbackTransaction: { args: [FFIType.u64], returns: FFIType.i32 },
    RollbackTransactionAsync: { args: [FFIType.u64], returns: FFIType.i32 },
    RollforwardTransactionManager: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetEnlistmentRecoveryInformation: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetResourceManagerCompletionPort: { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    SetTransactionInformation: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SinglePhaseReject: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-commitcomplete
  public static CommitComplete(EnlistmentHandle: HANDLE, TmVirtualClock: NULLABLE<PLARGE_INTEGER>): BOOL {
    return Ktmw32.Load('CommitComplete')(EnlistmentHandle, TmVirtualClock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-commitenlistment
  public static CommitEnlistment(EnlistmentHandle: HANDLE, TmVirtualClock: NULLABLE<PLARGE_INTEGER>): BOOL {
    return Ktmw32.Load('CommitEnlistment')(EnlistmentHandle, TmVirtualClock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-committransaction
  public static CommitTransaction(TransactionHandle: HANDLE): BOOL {
    return Ktmw32.Load('CommitTransaction')(TransactionHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-committransactionasync
  public static CommitTransactionAsync(TransactionHandle: HANDLE): BOOL {
    return Ktmw32.Load('CommitTransactionAsync')(TransactionHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-createenlistment
  public static CreateEnlistment(
    lpEnlistmentAttributes: OPTIONAL<LPSECURITY_ATTRIBUTES>,
    ResourceManagerHandle: HANDLE,
    TransactionHandle: HANDLE,
    NotificationMask: NOTIFICATION_MASK,
    CreateOptions: DWORD,
    EnlistmentKey: OPTIONAL<PVOID>,
  ): HANDLE {
    return Ktmw32.Load('CreateEnlistment')(lpEnlistmentAttributes, ResourceManagerHandle, TransactionHandle, NotificationMask, CreateOptions, EnlistmentKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-createresourcemanager
  public static CreateResourceManager(lpResourceManagerAttributes: OPTIONAL<LPSECURITY_ATTRIBUTES>, ResourceManagerId: LPGUID, CreateOptions: DWORD, TmHandle: HANDLE, Description: OPTIONAL<LPWSTR>): HANDLE {
    return Ktmw32.Load('CreateResourceManager')(lpResourceManagerAttributes, ResourceManagerId, CreateOptions, TmHandle, Description);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-createtransaction
  public static CreateTransaction(lpTransactionAttributes: OPTIONAL<LPSECURITY_ATTRIBUTES>, UOW: OPTIONAL<LPGUID>, CreateOptions: DWORD, IsolationLevel: DWORD, IsolationFlags: DWORD, Timeout: DWORD, Description: OPTIONAL<LPWSTR>): HANDLE {
    return Ktmw32.Load('CreateTransaction')(lpTransactionAttributes, UOW, CreateOptions, IsolationLevel, IsolationFlags, Timeout, Description);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-createtransactionmanager
  public static CreateTransactionManager(lpTransactionAttributes: OPTIONAL<LPSECURITY_ATTRIBUTES>, LogFileName: OPTIONAL<LPWSTR>, CreateOptions: ULONG, CommitStrength: ULONG): HANDLE {
    return Ktmw32.Load('CreateTransactionManager')(lpTransactionAttributes, LogFileName, CreateOptions, CommitStrength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-getcurrentclocktransactionmanager
  public static GetCurrentClockTransactionManager(TransactionManagerHandle: HANDLE, TmVirtualClock_out: PLARGE_INTEGER): BOOL {
    return Ktmw32.Load('GetCurrentClockTransactionManager')(TransactionManagerHandle, TmVirtualClock_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-getenlistmentid
  public static GetEnlistmentId(EnlistmentHandle: HANDLE, EnlistmentId_out: LPGUID): BOOL {
    return Ktmw32.Load('GetEnlistmentId')(EnlistmentHandle, EnlistmentId_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-getenlistmentrecoveryinformation
  public static GetEnlistmentRecoveryInformation(EnlistmentHandle: HANDLE, BufferSize: ULONG, Buffer_out: PVOID, BufferUsed_out: OPTIONAL<PULONG>): BOOL {
    return Ktmw32.Load('GetEnlistmentRecoveryInformation')(EnlistmentHandle, BufferSize, Buffer_out, BufferUsed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-getnotificationresourcemanager
  public static GetNotificationResourceManager(ResourceManagerHandle: HANDLE, TransactionNotification_out: PTRANSACTION_NOTIFICATION, NotificationLength: ULONG, dwMilliseconds: DWORD, ReturnLength_out: OPTIONAL<PULONG>): BOOL {
    return Ktmw32.Load('GetNotificationResourceManager')(ResourceManagerHandle, TransactionNotification_out, NotificationLength, dwMilliseconds, ReturnLength_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-getnotificationresourcemanagerasync
  public static GetNotificationResourceManagerAsync(ResourceManagerHandle: HANDLE, TransactionNotification_out: PTRANSACTION_NOTIFICATION, TransactionNotificationLength: ULONG, ReturnLength_out: PULONG, lpOverlapped: LPOVERLAPPED): BOOL {
    return Ktmw32.Load('GetNotificationResourceManagerAsync')(ResourceManagerHandle, TransactionNotification_out, TransactionNotificationLength, ReturnLength_out, lpOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-gettransactionid
  public static GetTransactionId(TransactionHandle: HANDLE, TransactionId_out: LPGUID): BOOL {
    return Ktmw32.Load('GetTransactionId')(TransactionHandle, TransactionId_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-gettransactioninformation
  public static GetTransactionInformation(
    TransactionHandle: HANDLE,
    Outcome_out: OPTIONAL<PDWORD>,
    IsolationLevel_out: OPTIONAL<PDWORD>,
    IsolationFlags_out: OPTIONAL<PDWORD>,
    Timeout_out: OPTIONAL<PDWORD>,
    BufferLength: DWORD,
    Description_out: OPTIONAL<LPWSTR>,
  ): BOOL {
    return Ktmw32.Load('GetTransactionInformation')(TransactionHandle, Outcome_out, IsolationLevel_out, IsolationFlags_out, Timeout_out, BufferLength, Description_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-gettransactionmanagerid
  public static GetTransactionManagerId(TransactionManagerHandle: HANDLE, TransactionManagerId_out: LPGUID): BOOL {
    return Ktmw32.Load('GetTransactionManagerId')(TransactionManagerHandle, TransactionManagerId_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-openenlistment
  public static OpenEnlistment(dwDesiredAccess: DWORD, ResourceManagerHandle: HANDLE, EnlistmentId: LPGUID): HANDLE {
    return Ktmw32.Load('OpenEnlistment')(dwDesiredAccess, ResourceManagerHandle, EnlistmentId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-openresourcemanager
  public static OpenResourceManager(dwDesiredAccess: DWORD, TmHandle: HANDLE, ResourceManagerId: LPGUID): HANDLE {
    return Ktmw32.Load('OpenResourceManager')(dwDesiredAccess, TmHandle, ResourceManagerId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-opentransaction
  public static OpenTransaction(dwDesiredAccess: DWORD, TransactionId: LPGUID): HANDLE {
    return Ktmw32.Load('OpenTransaction')(dwDesiredAccess, TransactionId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-opentransactionmanager
  public static OpenTransactionManager(LogFileName: LPWSTR, DesiredAccess: ACCESS_MASK, OpenOptions: ULONG): HANDLE {
    return Ktmw32.Load('OpenTransactionManager')(LogFileName, DesiredAccess, OpenOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-opentransactionmanagerbyid
  public static OpenTransactionManagerById(TransactionManagerId: LPGUID, DesiredAccess: ACCESS_MASK, OpenOptions: ULONG): HANDLE {
    return Ktmw32.Load('OpenTransactionManagerById')(TransactionManagerId, DesiredAccess, OpenOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-prepreparecomplete
  public static PrePrepareComplete(EnlistmentHandle: HANDLE, TmVirtualClock: NULLABLE<PLARGE_INTEGER>): BOOL {
    return Ktmw32.Load('PrePrepareComplete')(EnlistmentHandle, TmVirtualClock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-prepreparenlistment
  public static PrePrepareEnlistment(EnlistmentHandle: HANDLE, TmVirtualClock: PLARGE_INTEGER): BOOL {
    return Ktmw32.Load('PrePrepareEnlistment')(EnlistmentHandle, TmVirtualClock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-preparecomplete
  public static PrepareComplete(EnlistmentHandle: HANDLE, TmVirtualClock: NULLABLE<PLARGE_INTEGER>): BOOL {
    return Ktmw32.Load('PrepareComplete')(EnlistmentHandle, TmVirtualClock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-prepareenlistment
  public static PrepareEnlistment(EnlistmentHandle: HANDLE, TmVirtualClock: PLARGE_INTEGER): BOOL {
    return Ktmw32.Load('PrepareEnlistment')(EnlistmentHandle, TmVirtualClock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-readonlyenlistment
  public static ReadOnlyEnlistment(EnlistmentHandle: HANDLE, TmVirtualClock: NULLABLE<PLARGE_INTEGER>): BOOL {
    return Ktmw32.Load('ReadOnlyEnlistment')(EnlistmentHandle, TmVirtualClock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-recoverenlistment
  public static RecoverEnlistment(EnlistmentHandle: HANDLE, EnlistmentKey: OPTIONAL<PVOID>): BOOL {
    return Ktmw32.Load('RecoverEnlistment')(EnlistmentHandle, EnlistmentKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-recoverresourcemanager
  public static RecoverResourceManager(ResourceManagerHandle: HANDLE): BOOL {
    return Ktmw32.Load('RecoverResourceManager')(ResourceManagerHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-recovertransactionmanager
  public static RecoverTransactionManager(TransactionManagerHandle: HANDLE): BOOL {
    return Ktmw32.Load('RecoverTransactionManager')(TransactionManagerHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-renametransactionmanager
  public static RenameTransactionManager(LogFileName: LPWSTR, ExistingTransactionManagerGuid: LPGUID): BOOL {
    return Ktmw32.Load('RenameTransactionManager')(LogFileName, ExistingTransactionManagerGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-rollbackcomplete
  public static RollbackComplete(EnlistmentHandle: HANDLE, TmVirtualClock: PLARGE_INTEGER): BOOL {
    return Ktmw32.Load('RollbackComplete')(EnlistmentHandle, TmVirtualClock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-rollbackenlistment
  public static RollbackEnlistment(EnlistmentHandle: HANDLE, TmVirtualClock: PLARGE_INTEGER): BOOL {
    return Ktmw32.Load('RollbackEnlistment')(EnlistmentHandle, TmVirtualClock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-rollbacktransaction
  public static RollbackTransaction(TransactionHandle: HANDLE): BOOL {
    return Ktmw32.Load('RollbackTransaction')(TransactionHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-rollbacktransactionasync
  public static RollbackTransactionAsync(TransactionHandle: HANDLE): BOOL {
    return Ktmw32.Load('RollbackTransactionAsync')(TransactionHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-rollforwardtransactionmanager
  public static RollforwardTransactionManager(TransactionManagerHandle: HANDLE, TmVirtualClock: PLARGE_INTEGER): BOOL {
    return Ktmw32.Load('RollforwardTransactionManager')(TransactionManagerHandle, TmVirtualClock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-setenlistmentrecoveryinformation
  public static SetEnlistmentRecoveryInformation(EnlistmentHandle: HANDLE, BufferSize: ULONG, Buffer: PVOID): BOOL {
    return Ktmw32.Load('SetEnlistmentRecoveryInformation')(EnlistmentHandle, BufferSize, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-setresourcemanagercompletionport
  public static SetResourceManagerCompletionPort(ResourceManagerHandle: HANDLE, IoCompletionPortHandle: HANDLE, CompletionKey: ULONG_PTR): BOOL {
    return Ktmw32.Load('SetResourceManagerCompletionPort')(ResourceManagerHandle, IoCompletionPortHandle, CompletionKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-settransactioninformation
  public static SetTransactionInformation(TransactionHandle: HANDLE, IsolationLevel: DWORD, IsolationFlags: DWORD, Timeout: DWORD, Description: OPTIONAL<LPWSTR>): BOOL {
    return Ktmw32.Load('SetTransactionInformation')(TransactionHandle, IsolationLevel, IsolationFlags, Timeout, Description);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ktmw32/nf-ktmw32-singlephasereject
  public static SinglePhaseReject(EnlistmentHandle: HANDLE, TmVirtualClock: NULLABLE<PLARGE_INTEGER>): BOOL {
    return Ktmw32.Load('SinglePhaseReject')(EnlistmentHandle, TmVirtualClock);
  }
}

export default Ktmw32;
