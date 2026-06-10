import Kernel32 from '@bun-win32/kernel32';
import { preloadPending } from './preload';
import { type SmbiosInfo, parseSmbios } from './structs';

preloadPending(Kernel32, ['GetSystemFirmwareTable']);
const { GetSystemFirmwareTable } = Kernel32;

const RSMB = 0x5253_4d42;

/**
 * The machine's hardware identity straight from the BIOS — SMBIOS via
 * GetSystemFirmwareTable('RSMB'), parsed by hand: BIOS vendor/version/date, system
 * manufacturer/product/serial/UUID, baseboard, processors, and per-slot memory devices.
 * No WMI anywhere. Throws on platforms that expose no SMBIOS (some VMs/hardened hosts).
 */
export function smbios(): SmbiosInfo {
  const probe = Buffer.alloc(1); // the binding's buffer is non-null; a 1-byte probe with BufferSize 0 returns the needed size
  const needed = GetSystemFirmwareTable(RSMB, 0, probe.ptr, 0);
  if (needed === 0) throw new Error('GetSystemFirmwareTable(RSMB) returned no data — this platform exposes no SMBIOS table');
  const table = Buffer.alloc(needed);
  const written = GetSystemFirmwareTable(RSMB, 0, table.ptr, needed);
  if (written === 0 || written > needed) throw new Error('GetSystemFirmwareTable(RSMB) fetch failed');
  return parseSmbios(table);
}
