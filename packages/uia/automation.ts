// The UI Automation root: the COM apartment plus the in-process IUIAutomation client, created once.

import { FFIType } from 'bun:ffi';

import Combase from '@bun-win32/combase';
import User32 from '@bun-win32/user32';

import { comRelease, guid, hresult, vcall } from './com';
import { CLSCTX_INPROC_SERVER, CLSID_CUIAutomation, COINIT_APARTMENTTHREADED, IID_IUIAutomation, S_FALSE, S_OK, SLOT } from './constants';

let pAutomation = 0n;
let pControlWalker = 0n;
let comInitialized = false;
let wgcBundleDisposer: (() => void) | null = null;

/**
 * Register wgc.ts's device-bundle teardown so uninitialize() can free it WITHOUT a static automation→wgc
 * import (which would eager-`dlopen` d3d11 on core init and form a cycle). wgc.ts calls this once it builds
 * its cached bundle; uninitialize() invokes it (a no-op when WGC was never used).
 */
export function setWgcBundleDisposer(dispose: () => void): void {
  wgcBundleDisposer = dispose;
}

/**
 * Initialize COM (single-threaded apartment) and create the in-process IUIAutomation client.
 * Idempotent — returns the cached client pointer on subsequent calls. Throws (does not exit) when
 * UI Automation is unavailable so callers can catch and degrade.
 */
export function initialize(): bigint {
  if (pAutomation !== 0n) return pAutomation;
  if (!comInitialized) {
    // Physical-pixel coordinates so SendInput clicks match UIA bounding rectangles (best-effort).
    User32.SetProcessDPIAware();
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

/** Release the IUIAutomation client and uninitialize COM. Safe to call when never initialized. */
export function uninitialize(): void {
  if (wgcBundleDisposer !== null) {
    wgcBundleDisposer(); // free the WGC bundle while its apartment is still alive (before CoUninitialize)
    wgcBundleDisposer = null;
  }
  if (pControlWalker !== 0n) {
    comRelease(pControlWalker);
    pControlWalker = 0n;
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
