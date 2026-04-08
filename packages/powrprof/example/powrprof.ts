import { type Pointer, toArrayBuffer } from 'bun:ffi';
import PowrProf, { POWER_INFORMATION_LEVEL, POWER_PLATFORM_ROLE } from '..';

// 1. Get system battery state via CallNtPowerInformation
console.log('=== Battery State ===');
const batteryState = Buffer.alloc(64);
const ntStatus = PowrProf.CallNtPowerInformation(POWER_INFORMATION_LEVEL.SystemBatteryState, null, 0, batteryState.ptr, batteryState.byteLength);

if (ntStatus === 0) {
  const view = new DataView(batteryState.buffer);
  console.log(`  AC online:         ${view.getUint8(0) ? 'yes' : 'no'}`);
  console.log(`  Battery present:   ${view.getUint8(1) ? 'yes' : 'no'}`);
  console.log(`  Charging:          ${view.getUint8(2) ? 'yes' : 'no'}`);
  console.log(`  Discharging:       ${view.getUint8(3) ? 'yes' : 'no'}`);
  console.log(`  Max capacity:      ${view.getUint32(8, true)} mWh`);
  console.log(`  Remaining:         ${view.getUint32(12, true)} mWh`);
  console.log(`  Estimated time:    ${view.getInt32(24, true)} s`);
} else {
  console.log(`  CallNtPowerInformation failed: 0x${ntStatus.toString(16)}`);
}

// 2. Determine platform role
console.log('\n=== Platform Role ===');
const role = PowrProf.PowerDeterminePlatformRole();
const roleNames: Record<number, string> = {
  [POWER_PLATFORM_ROLE.PlatformRoleUnspecified]: 'Unspecified',
  [POWER_PLATFORM_ROLE.PlatformRoleDesktop]: 'Desktop',
  [POWER_PLATFORM_ROLE.PlatformRoleMobile]: 'Mobile',
  [POWER_PLATFORM_ROLE.PlatformRoleWorkstation]: 'Workstation',
  [POWER_PLATFORM_ROLE.PlatformRoleEnterpriseServer]: 'Enterprise Server',
  [POWER_PLATFORM_ROLE.PlatformRoleSOHOServer]: 'SOHO Server',
  [POWER_PLATFORM_ROLE.PlatformRoleAppliancePC]: 'Appliance PC',
  [POWER_PLATFORM_ROLE.PlatformRolePerformanceServer]: 'Performance Server',
  [POWER_PLATFORM_ROLE.PlatformRoleSlate]: 'Slate/Tablet',
};
console.log(`  Role: ${roleNames[role] ?? `Unknown (${role})`}`);

// 3. Check power capabilities
console.log('\n=== Power Capabilities ===');
console.log(`  Hibernate allowed: ${PowrProf.IsPwrHibernateAllowed() ? 'yes' : 'no'}`);
console.log(`  Suspend allowed:   ${PowrProf.IsPwrSuspendAllowed() ? 'yes' : 'no'}`);
console.log(`  Shutdown allowed:  ${PowrProf.IsPwrShutdownAllowed() ? 'yes' : 'no'}`);

// 4. Get active power scheme and its friendly name
console.log('\n=== Active Power Scheme ===');
const guidPtrBuf = Buffer.alloc(8);
const result = PowrProf.PowerGetActiveScheme(0n, guidPtrBuf.ptr);

if (result === 0) {
  // The API wrote a GUID* into guidPtrBuf. Read the pointer, then read the GUID.
  const guidAddr = Number(new DataView(guidPtrBuf.buffer).getBigUint64(0, true)) as Pointer;
  const guidBytes = new Uint8Array(toArrayBuffer(guidAddr, 0, 16));

  // Format GUID (little-endian for first three groups)
  const h = [...guidBytes].map((b) => b.toString(16).padStart(2, '0'));
  const guid = [h.slice(0, 4).reverse().join(''), h.slice(4, 6).reverse().join(''), h.slice(6, 8).reverse().join(''), h.slice(8, 10).join(''), h.slice(10, 16).join('')].join('-');
  console.log(`  GUID: {${guid}}`);

  // Get friendly name using two-call pattern
  const sizeBuf = Buffer.alloc(4);
  const guidBuf = Buffer.from(guidBytes);
  PowrProf.PowerReadFriendlyName(0n, guidBuf.ptr, null, null, null, sizeBuf.ptr);
  const nameSize = new DataView(sizeBuf.buffer).getUint32(0, true);

  if (nameSize > 0) {
    const nameBuf = Buffer.alloc(nameSize);
    const nameResult = PowrProf.PowerReadFriendlyName(0n, guidBuf.ptr, null, null, nameBuf.ptr, sizeBuf.ptr);
    if (nameResult === 0) {
      const name = nameBuf.toString('utf16le').replace(/\0.*$/, '');
      console.log(`  Name: ${name}`);
    }
  }
}
