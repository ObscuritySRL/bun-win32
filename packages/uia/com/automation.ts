// The UI Automation root: the COM apartment plus the in-process IUIAutomation client, created once.

import { FFIType } from 'bun:ffi';

import Combase from '@bun-win32/combase';
import Shcore, { ProcessDpiAwareness } from '@bun-win32/shcore';
import User32 from '@bun-win32/user32';

import { comRelease, guid, hresult, vcall } from './com';
import { CLSCTX_INPROC_SERVER, CLSID_CUIAutomation, COINIT_APARTMENTTHREADED, IID_IUIAutomation, S_FALSE, S_OK, SLOT } from './constants';

let pAutomation = 0n;
let pControlWalker = 0n;
let pTrueCondition = 0n;
let comInitialized = false;
let wgcBundleDisposer: (() => void) | null = null;
let ocrDisposer: (() => void) | null = null;
let desktopDisposer: (() => void) | null = null;

/**
 * Register wgc.ts's device-bundle teardown so uninitialize() can free it WITHOUT a static automation→wgc
 * import (which would eager-`dlopen` d3d11 on core init and form a cycle). wgc.ts calls this once it builds
 * its cached bundle; uninitialize() invokes it (a no-op when WGC was never used).
 */
export function setWgcBundleDisposer(dispose: () => void): void {
  wgcBundleDisposer = dispose;
}

/** Register ocr.ts's cached-engine teardown so uninitialize() frees its WinRT factories while the apartment is
 *  still alive — same lazy-no-static-import pattern as the WGC disposer. */
export function setOcrDisposer(dispose: () => void): void {
  ocrDisposer = dispose;
}

/** Register desktop.ts's cached IVirtualDesktopManager teardown so uninitialize() releases it (and resets its state
 *  for a clean re-init) while the apartment is still alive — same lazy-no-static-import pattern as the WGC disposer. */
export function setDesktopDisposer(dispose: () => void): void {
  desktopDisposer = dispose;
}

/**
 * Initialize COM (single-threaded apartment) and create the in-process IUIAutomation client.
 * Idempotent — returns the cached client pointer on subsequent calls. Throws (does not exit) when
 * UI Automation is unavailable so callers can catch and degrade.
 */
export function initialize(): bigint {
  if (pAutomation !== 0n) return pAutomation;
  if (!comInitialized) {
    // Per-monitor DPI awareness so UIA bounding rectangles and click/SendInput coordinates share ONE physical-pixel
    // space across every monitor. The old system-DPI awareness (SetProcessDPIAware) is aware of only the PRIMARY
    // monitor's scale, so on a mixed-DPI multi-monitor desktop (e.g. a 150% laptop + a 100% external) the OS
    // bitmap-virtualizes a secondary monitor's coordinates — UIA bounds and click_point/SendInput then disagree and
    // clicks land in the wrong place. shcore PROCESS_PER_MONITOR_DPI_AWARE (=2) takes a plain int (no pseudo-handle
    // pointer marshal, unlike SetProcessDpiAwarenessContext's -4), and we fall back to the user32 system-aware call
    // on pre-8.1 systems or when awareness is already fixed by the host's manifest (E_ACCESSDENIED). Both best-effort.
    if (Shcore.SetProcessDpiAwareness(ProcessDpiAwareness.PROCESS_PER_MONITOR_DPI_AWARE) !== S_OK) User32.SetProcessDPIAware();
    const initHr = Combase.CoInitializeEx(null, COINIT_APARTMENTTHREADED);
    if (initHr !== S_OK && initHr !== S_FALSE) throw new Error(`CoInitializeEx failed: ${hresult(initHr)}`);
    comInitialized = true;
  }
  const clsid = guid(CLSID_CUIAutomation);
  const iid = guid(IID_IUIAutomation);
  const out = Buffer.alloc(8);
  const createHr = Combase.CoCreateInstance(clsid.ptr!, 0n, CLSCTX_INPROC_SERVER, iid.ptr!, out.ptr!);
  if (createHr !== S_OK) throw new Error(`CoCreateInstance(CUIAutomation) failed: ${hresult(createHr)} — UI Automation is unavailable on this system.`);
  pAutomation = out.readBigUInt64LE(0);
  if (pAutomation === 0n) throw new Error('CoCreateInstance(CUIAutomation) returned a null client.');
  return pAutomation;
}

/** The IUIAutomation client pointer, initializing on first use. */
export function automation(): bigint {
  return pAutomation !== 0n ? pAutomation : initialize();
}

/** The cached control-view TreeWalker (get_ControlViewWalker) — a stable client singleton, acquired once and
 *  released on uninitialize. Memoizing it drops two cross-process round-trips per parent navigation. */
export function controlViewWalker(): bigint {
  if (pControlWalker !== 0n) return pControlWalker;
  const out = Buffer.alloc(8);
  if (vcall(automation(), SLOT.get_ControlViewWalker, [FFIType.ptr], [out.ptr!]) !== S_OK) return 0n;
  pControlWalker = out.readBigUInt64LE(0);
  return pControlWalker;
}

/** The cached CreateTrueCondition — a stable client singleton (a true condition is immutable + STA-affine, and
 *  all calls run serialized on the one STA thread), reused across every find({})/findAll({})/regex selector and
 *  every waitFor poll instead of a create+release pair (drops two cross-process round-trips per such call). */
export function trueCondition(): bigint {
  if (pTrueCondition !== 0n) return pTrueCondition;
  const out = Buffer.alloc(8);
  if (vcall(automation(), SLOT.CreateTrueCondition, [FFIType.ptr], [out.ptr!]) !== S_OK) return 0n;
  pTrueCondition = out.readBigUInt64LE(0);
  return pTrueCondition;
}

/** Release the IUIAutomation client and uninitialize COM. Safe to call when never initialized. */
export function uninitialize(): void {
  if (wgcBundleDisposer !== null) {
    wgcBundleDisposer(); // free the WGC bundle while its apartment is still alive (before CoUninitialize)
    wgcBundleDisposer = null;
  }
  if (ocrDisposer !== null) {
    ocrDisposer(); // free the cached OCR engine/factories before CoUninitialize
    ocrDisposer = null;
  }
  if (desktopDisposer !== null) {
    desktopDisposer(); // release the cached IVirtualDesktopManager before CoUninitialize
    desktopDisposer = null;
  }
  if (pControlWalker !== 0n) {
    comRelease(pControlWalker);
    pControlWalker = 0n;
  }
  if (pTrueCondition !== 0n) {
    comRelease(pTrueCondition);
    pTrueCondition = 0n;
  }
  if (pAutomation !== 0n) {
    comRelease(pAutomation);
    pAutomation = 0n;
  }
  if (comInitialized) {
    Combase.CoUninitialize();
    comInitialized = false;
  }
}
