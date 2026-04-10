import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  DWORD,
  HANDLE,
  LONG,
  LPCBYTE,
  LPCGUID,
  LPCSCARD_IO_REQUEST,
  LPCSTR,
  LPCVOID,
  LPCWSTR,
  LPBYTE,
  LPDWORD,
  LPGUID,
  LPSTR,
  LPVOID,
  LPWSTR,
  LPSCARDCONTEXT,
  LPSCARDHANDLE,
  LPSCARD_ATRMASK,
  LPSCARD_IO_REQUEST,
  LPSCARD_READERSTATEA,
  LPSCARD_READERSTATEW,
  NULL,
  PBYTE,
  PUUID,
  SCARD_ATTRIBUTE,
  SCARD_AUDIT_EVENT,
  SCARDCONTEXT,
  SCARD_DISPOSITION,
  SCARDHANDLE,
  SCARD_PROVIDER_ID,
  SCARD_PROTOCOL,
  SCARD_SCOPE,
  SCARD_SHARE_MODE,
  VOID,
} from '../types/WinSCard';

/**
 * Thin, lazy-loaded FFI bindings for `winscard.dll`.
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
 * import WinSCard from './structs/WinSCard';
 *
 * const contextHandleBuffer = Buffer.alloc(8);
 * const result = WinSCard.SCardEstablishContext(2, null, null, contextHandleBuffer.ptr);
 *
 * if (result === 0) {
 *   const contextHandle = contextHandleBuffer.readBigUInt64LE(0);
 *   WinSCard.SCardReleaseContext(contextHandle);
 * }
 * ```
 */
class WinSCard extends Win32 {
  protected static override name = 'winscard.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    SCardAccessStartedEvent: { args: [], returns: FFIType.u64 },
    SCardAddReaderToGroupA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardAddReaderToGroupW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardAudit: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SCardBeginTransaction: { args: [FFIType.u64], returns: FFIType.i32 },
    SCardCancel: { args: [FFIType.u64], returns: FFIType.i32 },
    SCardConnectA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardConnectW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardControl: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SCardDisconnect: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SCardEndTransaction: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SCardEstablishContext: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardForgetCardTypeA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SCardForgetCardTypeW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SCardForgetReaderA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SCardForgetReaderGroupA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SCardForgetReaderGroupW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SCardForgetReaderW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SCardFreeMemory: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SCardGetAttrib: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardGetCardTypeProviderNameA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardGetCardTypeProviderNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardGetDeviceTypeIdA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardGetDeviceTypeIdW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardGetProviderIdA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardGetProviderIdW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardGetReaderDeviceInstanceIdA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardGetReaderDeviceInstanceIdW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardGetReaderIconA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardGetReaderIconW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardGetStatusChangeA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SCardGetStatusChangeW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SCardGetTransmitCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SCardIntroduceCardTypeA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SCardIntroduceCardTypeW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SCardIntroduceReaderA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardIntroduceReaderGroupA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SCardIntroduceReaderGroupW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SCardIntroduceReaderW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardIsValidContext: { args: [FFIType.u64], returns: FFIType.i32 },
    SCardListCardsA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardListCardsW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardListInterfacesA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardListInterfacesW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardListReaderGroupsA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardListReaderGroupsW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardListReadersA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardListReadersW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardListReadersWithDeviceInstanceIdA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardListReadersWithDeviceInstanceIdW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardLocateCardsA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SCardLocateCardsByATRA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SCardLocateCardsByATRW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SCardLocateCardsW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SCardReadCacheA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardReadCacheW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardReconnect: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SCardReleaseContext: { args: [FFIType.u64], returns: FFIType.i32 },
    SCardReleaseStartedEvent: { args: [], returns: FFIType.void },
    SCardRemoveReaderFromGroupA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardRemoveReaderFromGroupW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardSetAttrib: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SCardSetCardTypeProviderNameA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SCardSetCardTypeProviderNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SCardState: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardStatusA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardStatusW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardTransmit: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SCardWriteCacheA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SCardWriteCacheW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardaccessstartedevent
  public static SCardAccessStartedEvent(): HANDLE {
    return WinSCard.Load('SCardAccessStartedEvent')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardaddreadertogroupa
  public static SCardAddReaderToGroupA(hContext: SCARDCONTEXT, szReaderName: LPCSTR, szGroupName: LPCSTR): LONG {
    return WinSCard.Load('SCardAddReaderToGroupA')(hContext, szReaderName, szGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardaddreadertogroupw
  public static SCardAddReaderToGroupW(hContext: SCARDCONTEXT, szReaderName: LPCWSTR, szGroupName: LPCWSTR): LONG {
    return WinSCard.Load('SCardAddReaderToGroupW')(hContext, szReaderName, szGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardaudit
  public static SCardAudit(hContext: SCARDCONTEXT, dwEvent: SCARD_AUDIT_EVENT): LONG {
    return WinSCard.Load('SCardAudit')(hContext, dwEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardbegintransaction
  public static SCardBeginTransaction(hCard: SCARDHANDLE): LONG {
    return WinSCard.Load('SCardBeginTransaction')(hCard);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardcancel
  public static SCardCancel(hContext: SCARDCONTEXT): LONG {
    return WinSCard.Load('SCardCancel')(hContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardconnecta
  public static SCardConnectA(hContext: SCARDCONTEXT, szReader: LPCSTR, dwShareMode: SCARD_SHARE_MODE, dwPreferredProtocols: SCARD_PROTOCOL, phCard: LPSCARDHANDLE, pdwActiveProtocol: LPDWORD): LONG {
    return WinSCard.Load('SCardConnectA')(hContext, szReader, dwShareMode, dwPreferredProtocols, phCard, pdwActiveProtocol);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardconnectw
  public static SCardConnectW(hContext: SCARDCONTEXT, szReader: LPCWSTR, dwShareMode: SCARD_SHARE_MODE, dwPreferredProtocols: SCARD_PROTOCOL, phCard: LPSCARDHANDLE, pdwActiveProtocol: LPDWORD): LONG {
    return WinSCard.Load('SCardConnectW')(hContext, szReader, dwShareMode, dwPreferredProtocols, phCard, pdwActiveProtocol);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardcontrol
  public static SCardControl(hCard: SCARDHANDLE, dwControlCode: DWORD, lpInBuffer: LPCVOID, cbInBufferSize: DWORD, lpOutBuffer: LPVOID, cbOutBufferSize: DWORD, lpBytesReturned: LPDWORD): LONG {
    return WinSCard.Load('SCardControl')(hCard, dwControlCode, lpInBuffer, cbInBufferSize, lpOutBuffer, cbOutBufferSize, lpBytesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scarddisconnect
  public static SCardDisconnect(hCard: SCARDHANDLE, dwDisposition: SCARD_DISPOSITION): LONG {
    return WinSCard.Load('SCardDisconnect')(hCard, dwDisposition);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardendtransaction
  public static SCardEndTransaction(hCard: SCARDHANDLE, dwDisposition: SCARD_DISPOSITION): LONG {
    return WinSCard.Load('SCardEndTransaction')(hCard, dwDisposition);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardestablishcontext
  public static SCardEstablishContext(dwScope: SCARD_SCOPE, pvReserved1: LPCVOID | NULL, pvReserved2: LPCVOID | NULL, phContext: LPSCARDCONTEXT): LONG {
    return WinSCard.Load('SCardEstablishContext')(dwScope, pvReserved1, pvReserved2, phContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardforgetcardtypea
  public static SCardForgetCardTypeA(hContext: SCARDCONTEXT, szCardName: LPCSTR): LONG {
    return WinSCard.Load('SCardForgetCardTypeA')(hContext, szCardName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardforgetcardtypew
  public static SCardForgetCardTypeW(hContext: SCARDCONTEXT, szCardName: LPCWSTR): LONG {
    return WinSCard.Load('SCardForgetCardTypeW')(hContext, szCardName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardforgetreadera
  public static SCardForgetReaderA(hContext: SCARDCONTEXT, szReaderName: LPCSTR): LONG {
    return WinSCard.Load('SCardForgetReaderA')(hContext, szReaderName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardforgetreadergroupa
  public static SCardForgetReaderGroupA(hContext: SCARDCONTEXT, szGroupName: LPCSTR): LONG {
    return WinSCard.Load('SCardForgetReaderGroupA')(hContext, szGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardforgetreadergroupw
  public static SCardForgetReaderGroupW(hContext: SCARDCONTEXT, szGroupName: LPCWSTR): LONG {
    return WinSCard.Load('SCardForgetReaderGroupW')(hContext, szGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardforgetreaderw
  public static SCardForgetReaderW(hContext: SCARDCONTEXT, szReaderName: LPCWSTR): LONG {
    return WinSCard.Load('SCardForgetReaderW')(hContext, szReaderName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardfreememory
  public static SCardFreeMemory(hContext: SCARDCONTEXT, pvMem: LPCVOID): LONG {
    return WinSCard.Load('SCardFreeMemory')(hContext, pvMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgetattrib
  public static SCardGetAttrib(hCard: SCARDHANDLE, dwAttrId: SCARD_ATTRIBUTE, pbAttr: LPBYTE | NULL, pcbAttrLen: LPDWORD): LONG {
    return WinSCard.Load('SCardGetAttrib')(hCard, dwAttrId, pbAttr, pcbAttrLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgetcardtypeprovidernamea
  public static SCardGetCardTypeProviderNameA(hContext: SCARDCONTEXT, szCardName: LPCSTR, dwProviderId: SCARD_PROVIDER_ID, szProvider: LPSTR | NULL, pcchProvider: LPDWORD): LONG {
    return WinSCard.Load('SCardGetCardTypeProviderNameA')(hContext, szCardName, dwProviderId, szProvider, pcchProvider);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgetcardtypeprovidernamew
  public static SCardGetCardTypeProviderNameW(hContext: SCARDCONTEXT, szCardName: LPCWSTR, dwProviderId: SCARD_PROVIDER_ID, szProvider: LPWSTR | NULL, pcchProvider: LPDWORD): LONG {
    return WinSCard.Load('SCardGetCardTypeProviderNameW')(hContext, szCardName, dwProviderId, szProvider, pcchProvider);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgetdevicetypeida
  public static SCardGetDeviceTypeIdA(hContext: SCARDCONTEXT, szReaderName: LPCSTR, pdwDeviceTypeId: LPDWORD): LONG {
    return WinSCard.Load('SCardGetDeviceTypeIdA')(hContext, szReaderName, pdwDeviceTypeId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgetdevicetypeidw
  public static SCardGetDeviceTypeIdW(hContext: SCARDCONTEXT, szReaderName: LPCWSTR, pdwDeviceTypeId: LPDWORD): LONG {
    return WinSCard.Load('SCardGetDeviceTypeIdW')(hContext, szReaderName, pdwDeviceTypeId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgetproviderida
  public static SCardGetProviderIdA(hContext: SCARDCONTEXT, szCard: LPCSTR, pguidProviderId: LPGUID): LONG {
    return WinSCard.Load('SCardGetProviderIdA')(hContext, szCard, pguidProviderId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgetprovideridw
  public static SCardGetProviderIdW(hContext: SCARDCONTEXT, szCard: LPCWSTR, pguidProviderId: LPGUID): LONG {
    return WinSCard.Load('SCardGetProviderIdW')(hContext, szCard, pguidProviderId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgetreaderdeviceinstanceida
  public static SCardGetReaderDeviceInstanceIdA(hContext: SCARDCONTEXT, szReaderName: LPCSTR, szDeviceInstanceId: LPSTR | NULL, pcchDeviceInstanceId: LPDWORD): LONG {
    return WinSCard.Load('SCardGetReaderDeviceInstanceIdA')(hContext, szReaderName, szDeviceInstanceId, pcchDeviceInstanceId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgetreaderdeviceinstanceidw
  public static SCardGetReaderDeviceInstanceIdW(hContext: SCARDCONTEXT, szReaderName: LPCWSTR, szDeviceInstanceId: LPWSTR | NULL, pcchDeviceInstanceId: LPDWORD): LONG {
    return WinSCard.Load('SCardGetReaderDeviceInstanceIdW')(hContext, szReaderName, szDeviceInstanceId, pcchDeviceInstanceId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgetreadericona
  public static SCardGetReaderIconA(hContext: SCARDCONTEXT, szReaderName: LPCSTR, pbIcon: LPBYTE | NULL, pcbIcon: LPDWORD): LONG {
    return WinSCard.Load('SCardGetReaderIconA')(hContext, szReaderName, pbIcon, pcbIcon);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgetreadericonw
  public static SCardGetReaderIconW(hContext: SCARDCONTEXT, szReaderName: LPCWSTR, pbIcon: LPBYTE | NULL, pcbIcon: LPDWORD): LONG {
    return WinSCard.Load('SCardGetReaderIconW')(hContext, szReaderName, pbIcon, pcbIcon);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgetstatuschangea
  public static SCardGetStatusChangeA(hContext: SCARDCONTEXT, dwTimeout: DWORD, rgReaderStates: LPSCARD_READERSTATEA, cReaders: DWORD): LONG {
    return WinSCard.Load('SCardGetStatusChangeA')(hContext, dwTimeout, rgReaderStates, cReaders);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgetstatuschangew
  public static SCardGetStatusChangeW(hContext: SCARDCONTEXT, dwTimeout: DWORD, rgReaderStates: LPSCARD_READERSTATEW, cReaders: DWORD): LONG {
    return WinSCard.Load('SCardGetStatusChangeW')(hContext, dwTimeout, rgReaderStates, cReaders);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgettransmitcount
  public static SCardGetTransmitCount(hCard: SCARDHANDLE, pcTransmitCount: LPDWORD): LONG {
    return WinSCard.Load('SCardGetTransmitCount')(hCard, pcTransmitCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardintroducecardtypea
  public static SCardIntroduceCardTypeA(
    hContext: SCARDCONTEXT,
    szCardName: LPCSTR,
    pguidPrimaryProvider: LPCGUID | NULL,
    rgguidInterfaces: LPCGUID | NULL,
    dwInterfaceCount: DWORD,
    pbAtr: LPCBYTE,
    pbAtrMask: LPCBYTE,
    cbAtrLen: DWORD,
  ): LONG {
    return WinSCard.Load('SCardIntroduceCardTypeA')(hContext, szCardName, pguidPrimaryProvider, rgguidInterfaces, dwInterfaceCount, pbAtr, pbAtrMask, cbAtrLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardintroducecardtypew
  public static SCardIntroduceCardTypeW(
    hContext: SCARDCONTEXT,
    szCardName: LPCWSTR,
    pguidPrimaryProvider: LPCGUID | NULL,
    rgguidInterfaces: LPCGUID | NULL,
    dwInterfaceCount: DWORD,
    pbAtr: LPCBYTE,
    pbAtrMask: LPCBYTE,
    cbAtrLen: DWORD,
  ): LONG {
    return WinSCard.Load('SCardIntroduceCardTypeW')(hContext, szCardName, pguidPrimaryProvider, rgguidInterfaces, dwInterfaceCount, pbAtr, pbAtrMask, cbAtrLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardintroducereadera
  public static SCardIntroduceReaderA(hContext: SCARDCONTEXT, szReaderName: LPCSTR, szDeviceName: LPCSTR): LONG {
    return WinSCard.Load('SCardIntroduceReaderA')(hContext, szReaderName, szDeviceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardintroducereadergroupa
  public static SCardIntroduceReaderGroupA(hContext: SCARDCONTEXT, szGroupName: LPCSTR): LONG {
    return WinSCard.Load('SCardIntroduceReaderGroupA')(hContext, szGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardintroducereadergroupw
  public static SCardIntroduceReaderGroupW(hContext: SCARDCONTEXT, szGroupName: LPCWSTR): LONG {
    return WinSCard.Load('SCardIntroduceReaderGroupW')(hContext, szGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardintroducereaderw
  public static SCardIntroduceReaderW(hContext: SCARDCONTEXT, szReaderName: LPCWSTR, szDeviceName: LPCWSTR): LONG {
    return WinSCard.Load('SCardIntroduceReaderW')(hContext, szReaderName, szDeviceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardisvalidcontext
  public static SCardIsValidContext(hContext: SCARDCONTEXT): LONG {
    return WinSCard.Load('SCardIsValidContext')(hContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardlistcardsa
  public static SCardListCardsA(hContext: SCARDCONTEXT, pbAtr: LPCBYTE | NULL, rgquidInterfaces: LPCGUID | NULL, cguidInterfaceCount: DWORD, mszCards: LPSTR | NULL, pcchCards: LPDWORD): LONG {
    return WinSCard.Load('SCardListCardsA')(hContext, pbAtr, rgquidInterfaces, cguidInterfaceCount, mszCards, pcchCards);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardlistcardsw
  public static SCardListCardsW(hContext: SCARDCONTEXT, pbAtr: LPCBYTE | NULL, rgquidInterfaces: LPCGUID | NULL, cguidInterfaceCount: DWORD, mszCards: LPWSTR | NULL, pcchCards: LPDWORD): LONG {
    return WinSCard.Load('SCardListCardsW')(hContext, pbAtr, rgquidInterfaces, cguidInterfaceCount, mszCards, pcchCards);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardlistinterfacesa
  public static SCardListInterfacesA(hContext: SCARDCONTEXT, szCard: LPCSTR, pguidInterfaces: LPGUID, pcguidInterfaces: LPDWORD): LONG {
    return WinSCard.Load('SCardListInterfacesA')(hContext, szCard, pguidInterfaces, pcguidInterfaces);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardlistinterfacesw
  public static SCardListInterfacesW(hContext: SCARDCONTEXT, szCard: LPCWSTR, pguidInterfaces: LPGUID, pcguidInterfaces: LPDWORD): LONG {
    return WinSCard.Load('SCardListInterfacesW')(hContext, szCard, pguidInterfaces, pcguidInterfaces);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardlistreadergroupsa
  public static SCardListReaderGroupsA(hContext: SCARDCONTEXT, mszGroups: LPSTR | NULL, pcchGroups: LPDWORD): LONG {
    return WinSCard.Load('SCardListReaderGroupsA')(hContext, mszGroups, pcchGroups);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardlistreadergroupsw
  public static SCardListReaderGroupsW(hContext: SCARDCONTEXT, mszGroups: LPWSTR | NULL, pcchGroups: LPDWORD): LONG {
    return WinSCard.Load('SCardListReaderGroupsW')(hContext, mszGroups, pcchGroups);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardlistreadersa
  public static SCardListReadersA(hContext: SCARDCONTEXT, mszGroups: LPCSTR | NULL, mszReaders: LPSTR | NULL, pcchReaders: LPDWORD): LONG {
    return WinSCard.Load('SCardListReadersA')(hContext, mszGroups, mszReaders, pcchReaders);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardlistreadersw
  public static SCardListReadersW(hContext: SCARDCONTEXT, mszGroups: LPCWSTR | NULL, mszReaders: LPWSTR | NULL, pcchReaders: LPDWORD): LONG {
    return WinSCard.Load('SCardListReadersW')(hContext, mszGroups, mszReaders, pcchReaders);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardlistreaderswithdeviceinstanceida
  public static SCardListReadersWithDeviceInstanceIdA(hContext: SCARDCONTEXT, szDeviceInstanceId: LPCSTR, mszReaders: LPSTR | NULL, pcchReaders: LPDWORD): LONG {
    return WinSCard.Load('SCardListReadersWithDeviceInstanceIdA')(hContext, szDeviceInstanceId, mszReaders, pcchReaders);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardlistreaderswithdeviceinstanceidw
  public static SCardListReadersWithDeviceInstanceIdW(hContext: SCARDCONTEXT, szDeviceInstanceId: LPCWSTR, mszReaders: LPWSTR | NULL, pcchReaders: LPDWORD): LONG {
    return WinSCard.Load('SCardListReadersWithDeviceInstanceIdW')(hContext, szDeviceInstanceId, mszReaders, pcchReaders);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardlocatecardsa
  public static SCardLocateCardsA(hContext: SCARDCONTEXT, mszCards: LPCSTR, rgReaderStates: LPSCARD_READERSTATEA, cReaders: DWORD): LONG {
    return WinSCard.Load('SCardLocateCardsA')(hContext, mszCards, rgReaderStates, cReaders);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardlocatecardsbyatra
  public static SCardLocateCardsByATRA(hContext: SCARDCONTEXT, rgAtrMasks: LPSCARD_ATRMASK, cAtrs: DWORD, rgReaderStates: LPSCARD_READERSTATEA, cReaders: DWORD): LONG {
    return WinSCard.Load('SCardLocateCardsByATRA')(hContext, rgAtrMasks, cAtrs, rgReaderStates, cReaders);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardlocatecardsbyatrw
  public static SCardLocateCardsByATRW(hContext: SCARDCONTEXT, rgAtrMasks: LPSCARD_ATRMASK, cAtrs: DWORD, rgReaderStates: LPSCARD_READERSTATEW, cReaders: DWORD): LONG {
    return WinSCard.Load('SCardLocateCardsByATRW')(hContext, rgAtrMasks, cAtrs, rgReaderStates, cReaders);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardlocatecardsw
  public static SCardLocateCardsW(hContext: SCARDCONTEXT, mszCards: LPCWSTR, rgReaderStates: LPSCARD_READERSTATEW, cReaders: DWORD): LONG {
    return WinSCard.Load('SCardLocateCardsW')(hContext, mszCards, rgReaderStates, cReaders);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardreadcachea
  public static SCardReadCacheA(hContext: SCARDCONTEXT, CardIdentifier: PUUID, FreshnessCounter: DWORD, LookupName: LPSTR, Data: PBYTE, DataLen: LPDWORD): LONG {
    return WinSCard.Load('SCardReadCacheA')(hContext, CardIdentifier, FreshnessCounter, LookupName, Data, DataLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardreadcachew
  public static SCardReadCacheW(hContext: SCARDCONTEXT, CardIdentifier: PUUID, FreshnessCounter: DWORD, LookupName: LPWSTR, Data: PBYTE, DataLen: LPDWORD): LONG {
    return WinSCard.Load('SCardReadCacheW')(hContext, CardIdentifier, FreshnessCounter, LookupName, Data, DataLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardreconnect
  public static SCardReconnect(hCard: SCARDHANDLE, dwShareMode: SCARD_SHARE_MODE, dwPreferredProtocols: SCARD_PROTOCOL, dwInitialization: SCARD_DISPOSITION, pdwActiveProtocol: LPDWORD | NULL): LONG {
    return WinSCard.Load('SCardReconnect')(hCard, dwShareMode, dwPreferredProtocols, dwInitialization, pdwActiveProtocol);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardreleasecontext
  public static SCardReleaseContext(hContext: SCARDCONTEXT): LONG {
    return WinSCard.Load('SCardReleaseContext')(hContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardreleasestartedevent
  public static SCardReleaseStartedEvent(): VOID {
    return WinSCard.Load('SCardReleaseStartedEvent')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardremovereaderfromgroupa
  public static SCardRemoveReaderFromGroupA(hContext: SCARDCONTEXT, szReaderName: LPCSTR, szGroupName: LPCSTR): LONG {
    return WinSCard.Load('SCardRemoveReaderFromGroupA')(hContext, szReaderName, szGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardremovereaderfromgroupw
  public static SCardRemoveReaderFromGroupW(hContext: SCARDCONTEXT, szReaderName: LPCWSTR, szGroupName: LPCWSTR): LONG {
    return WinSCard.Load('SCardRemoveReaderFromGroupW')(hContext, szReaderName, szGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardsetattrib
  public static SCardSetAttrib(hCard: SCARDHANDLE, dwAttrId: SCARD_ATTRIBUTE, pbAttr: LPCBYTE, cbAttrLen: DWORD): LONG {
    return WinSCard.Load('SCardSetAttrib')(hCard, dwAttrId, pbAttr, cbAttrLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardsetcardtypeprovidernamea
  public static SCardSetCardTypeProviderNameA(hContext: SCARDCONTEXT, szCardName: LPCSTR, dwProviderId: SCARD_PROVIDER_ID, szProvider: LPCSTR): LONG {
    return WinSCard.Load('SCardSetCardTypeProviderNameA')(hContext, szCardName, dwProviderId, szProvider);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardsetcardtypeprovidernamew
  public static SCardSetCardTypeProviderNameW(hContext: SCARDCONTEXT, szCardName: LPCWSTR, dwProviderId: SCARD_PROVIDER_ID, szProvider: LPCWSTR): LONG {
    return WinSCard.Load('SCardSetCardTypeProviderNameW')(hContext, szCardName, dwProviderId, szProvider);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardstate
  public static SCardState(hCard: SCARDHANDLE, pdwState: LPDWORD, pdwProtocol: LPDWORD, pbAtr: LPBYTE, pcbAtrLen: LPDWORD): LONG {
    return WinSCard.Load('SCardState')(hCard, pdwState, pdwProtocol, pbAtr, pcbAtrLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardstatusa
  public static SCardStatusA(hCard: SCARDHANDLE, mszReaderNames: LPSTR | NULL, pcchReaderLen: LPDWORD | NULL, pdwState: LPDWORD | NULL, pdwProtocol: LPDWORD | NULL, pbAtr: LPBYTE | NULL, pcbAtrLen: LPDWORD | NULL): LONG {
    return WinSCard.Load('SCardStatusA')(hCard, mszReaderNames, pcchReaderLen, pdwState, pdwProtocol, pbAtr, pcbAtrLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardstatusw
  public static SCardStatusW(hCard: SCARDHANDLE, mszReaderNames: LPWSTR | NULL, pcchReaderLen: LPDWORD | NULL, pdwState: LPDWORD | NULL, pdwProtocol: LPDWORD | NULL, pbAtr: LPBYTE | NULL, pcbAtrLen: LPDWORD | NULL): LONG {
    return WinSCard.Load('SCardStatusW')(hCard, mszReaderNames, pcchReaderLen, pdwState, pdwProtocol, pbAtr, pcbAtrLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardtransmit
  public static SCardTransmit(hCard: SCARDHANDLE, pioSendPci: LPCSCARD_IO_REQUEST, pbSendBuffer: LPCBYTE, cbSendLength: DWORD, pioRecvPci: LPSCARD_IO_REQUEST | NULL, pbRecvBuffer: LPBYTE, pcbRecvLength: LPDWORD): LONG {
    return WinSCard.Load('SCardTransmit')(hCard, pioSendPci, pbSendBuffer, cbSendLength, pioRecvPci, pbRecvBuffer, pcbRecvLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardwritecachea
  public static SCardWriteCacheA(hContext: SCARDCONTEXT, CardIdentifier: PUUID, FreshnessCounter: DWORD, LookupName: LPSTR, Data: PBYTE, DataLen: DWORD): LONG {
    return WinSCard.Load('SCardWriteCacheA')(hContext, CardIdentifier, FreshnessCounter, LookupName, Data, DataLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardwritecachew
  public static SCardWriteCacheW(hContext: SCARDCONTEXT, CardIdentifier: PUUID, FreshnessCounter: DWORD, LookupName: LPWSTR, Data: PBYTE, DataLen: DWORD): LONG {
    return WinSCard.Load('SCardWriteCacheW')(hContext, CardIdentifier, FreshnessCounter, LookupName, Data, DataLen);
  }
}

export default WinSCard;
