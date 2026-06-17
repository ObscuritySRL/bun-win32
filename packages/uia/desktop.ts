// Virtual-desktop queries via IVirtualDesktopManager — the documented, stable Shell COM interface (shobjidl_core.h).
// Tells whether a top-level window is on the CURRENT virtual desktop and which desktop GUID it lives on, so an agent can
// tell a window genuinely on ANOTHER virtual desktop apart from one that is merely shell-cloaked — the DWM cloak bit
// (DWMWA_CLOAKED=2) cannot distinguish the two; this can.
//
// OS WALL (verified): the public IVirtualDesktopManager::MoveWindowToDesktop returns E_ACCESSDENIED (0x80070005) for a
// window owned by ANOTHER process — it only moves the caller's OWN windows. So there is NO cursor-free way to PULL a
// foreign window across desktops here: switching/moving needs the UNDOCUMENTED, per-build-fragile
// IVirtualDesktopManagerInternal (wrong vtable slot SEGFAULTS), or a human switching desktops. Detection is the
// shippable capability; the move is the wall.
//
// OS WALL #2 (Windows 11 24H2/25H2, build >=26100, verified on 26200.8655): plain CoCreateInstance returns a manager
// whose IsWindowOnCurrentVirtualDesktop/GetWindowDesktopId methods ALL yield REGDB_E_CLASSNOTREG (0x80040154) for every
// window — parity-confirmed in .NET (PowerShell Add-Type calling the same CLSID/IID returns the identical hr). So even
// DETECTION — not just the move — is environment-gated on recent builds; windowOnCurrentDesktop/windowDesktopId
// correctly return null there. The slots/IID/apartment are correct; this is an OS regression, not a binding defect.

import { FFIType } from 'bun:ffi';

import Combase from '@bun-win32/combase';

import { setDesktopDisposer } from './automation';
import { comRelease, guid, vcall } from './com';
import { CLSCTX_INPROC_SERVER, COINIT_APARTMENTTHREADED, S_FALSE, S_OK } from './constants';

const CLSID_VirtualDesktopManager = '{AA509086-5CA9-4C25-8F95-589D3C07B48A}';
const IID_IVirtualDesktopManager = '{A5CD92FF-29BE-454C-8D04-D82879FB3F1B}';

// IVirtualDesktopManagerVtbl: QueryInterface(0) AddRef(1) Release(2) then the interface's own members (verified vs
// shobjidl_core.h by slot-gate.test.ts).
const IS_WINDOW_ON_CURRENT_VIRTUAL_DESKTOP = 3; // IsWindowOnCurrentVirtualDesktop(HWND, BOOL*)
const GET_WINDOW_DESKTOP_ID = 4; // GetWindowDesktopId(HWND, GUID*)

let manager: bigint | null = null;
let tried = false;

/** The IVirtualDesktopManager singleton, CoCreated on first use; null if COM is in the wrong apartment or the manager
 *  is unavailable. Idempotent + fault-tolerant — never throws, so callers degrade to null. */
function virtualDesktopManager(): bigint | null {
  if (tried) return manager;
  tried = true;
  const initHr = Combase.CoInitializeEx(null, COINIT_APARTMENTTHREADED);
  if (initHr !== S_OK && initHr !== S_FALSE) return null; // already on a different apartment, or COM unavailable
  const clsid = guid(CLSID_VirtualDesktopManager);
  const iid = guid(IID_IVirtualDesktopManager);
  const out = Buffer.alloc(8);
  if (Combase.CoCreateInstance(clsid.ptr!, 0n, CLSCTX_INPROC_SERVER, iid.ptr!, out.ptr!) !== S_OK) return null;
  const pointer = out.readBigUInt64LE(0);
  manager = pointer === 0n ? null : pointer;
  // Release the interface (and reset state so a re-init re-creates it) on uninitialize, while the apartment is still
  // alive — BEFORE CoUninitialize frees it. Without this a post-uninitialize query would vcall a freed object (UAF).
  // Same lazy-no-static-import disposer pattern as wgc.ts / ocr.ts.
  if (manager !== null) {
    setDesktopDisposer(() => {
      if (manager !== null) comRelease(manager);
      manager = null;
      tried = false;
    });
  }
  return manager;
}

/** Whether `hWnd` is on the CURRENT virtual desktop. null when the manager is unavailable or the query fails (e.g. the
 *  handle is not a valid top-level window) — false means it is DEFINITIVELY on another virtual desktop. */
export function windowOnCurrentDesktop(hWnd: bigint): boolean | null {
  const desktopManager = virtualDesktopManager();
  if (desktopManager === null) return null;
  const result = Buffer.alloc(4);
  return vcall(desktopManager, IS_WINDOW_ON_CURRENT_VIRTUAL_DESKTOP, [FFIType.u64, FFIType.ptr], [hWnd, result.ptr!]) === S_OK ? result.readInt32LE(0) !== 0 : null;
}

/** The virtual-desktop GUID `hWnd` lives on (lowercase hyphenated), or null when unavailable / the query fails. */
export function windowDesktopId(hWnd: bigint): string | null {
  const desktopManager = virtualDesktopManager();
  if (desktopManager === null) return null;
  const buffer = Buffer.alloc(16);
  if (vcall(desktopManager, GET_WINDOW_DESKTOP_ID, [FFIType.u64, FFIType.ptr], [hWnd, buffer.ptr!]) !== S_OK) return null;
  const data1 = buffer.readUInt32LE(0).toString(16).padStart(8, '0');
  const data2 = buffer.readUInt16LE(4).toString(16).padStart(4, '0');
  const data3 = buffer.readUInt16LE(6).toString(16).padStart(4, '0');
  return `${data1}-${data2}-${data3}-${buffer.toString('hex', 8, 10)}-${buffer.toString('hex', 10, 16)}`;
}
