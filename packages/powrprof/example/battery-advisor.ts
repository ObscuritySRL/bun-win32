/**
 * Battery Advisor
 *
 * A tongue-in-cheek battery health advisor that reads your power state and
 * current power plan, then dishes out humorous recommendations based on how
 * much juice you have left. Works on both laptops and desktops (desktops
 * always show AC-powered with no battery).
 *
 * APIs demonstrated (PowrProf):
 *   - CallNtPowerInformation    (SystemBatteryState for charge info)
 *   - PowerGetActiveScheme      (get the active power plan GUID)
 *   - PowerReadFriendlyName     (decode GUID to human-readable name)
 *   - PowerDeterminePlatformRole (desktop vs mobile vs server)
 *   - IsPwrHibernateAllowed     (can the system hibernate?)
 *   - IsPwrSuspendAllowed       (can the system sleep?)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetSystemPowerStatus      (AC/battery/charge level/remaining time)
 *
 * Run: bun run example/battery-advisor.ts
 */
import { type Pointer, toArrayBuffer } from 'bun:ffi';
import PowrProf, { POWER_INFORMATION_LEVEL, POWER_PLATFORM_ROLE } from '../index';
import Kernel32 from '@bun-win32/kernel32';

PowrProf.Preload([
  'CallNtPowerInformation',
  'PowerGetActiveScheme',
  'PowerReadFriendlyName',
  'PowerDeterminePlatformRole',
  'IsPwrHibernateAllowed',
  'IsPwrSuspendAllowed',
]);
Kernel32.Preload(['GetSystemPowerStatus']);

// 1. GetSystemPowerStatus (SYSTEM_POWER_STATUS = 12 bytes)
const spsBuf = Buffer.alloc(12);
const spsOk = Kernel32.GetSystemPowerStatus(spsBuf.ptr);

let acOnline = false;
let batteryPresent = false;
let chargePercent = 0;
let remainingSeconds = -1;

if (spsOk) {
  // SYSTEM_POWER_STATUS layout:
  // 0x00: BYTE ACLineStatus (0=offline, 1=online, 255=unknown)
  // 0x01: BYTE BatteryFlag  (1=high, 2=low, 4=critical, 8=charging, 128=no battery, 255=unknown)
  // 0x02: BYTE BatteryLifePercent (0-100 or 255=unknown)
  // 0x03: BYTE SystemStatusFlag
  // 0x04: DWORD BatteryLifeTime (-1 if unknown)
  // 0x08: DWORD BatteryFullLifeTime (-1 if unknown)
  const acStatus = spsBuf.readUInt8(0);
  const batteryFlag = spsBuf.readUInt8(1);
  chargePercent = spsBuf.readUInt8(2);
  remainingSeconds = spsBuf.readInt32LE(4);

  acOnline = acStatus === 1;
  batteryPresent = (batteryFlag & 128) === 0 && batteryFlag !== 255;
}

// 2. CallNtPowerInformation - SystemBatteryState
const batteryStateBuf = Buffer.alloc(64);
const batteryNtStatus = PowrProf.CallNtPowerInformation(
  POWER_INFORMATION_LEVEL.SystemBatteryState,
  null, 0,
  batteryStateBuf.ptr, batteryStateBuf.byteLength,
);

let ntBatteryInfo = {
  acOnline: false,
  batteryPresent: false,
  charging: false,
  discharging: false,
  maxCapacity: 0,
  remainingCapacity: 0,
  rate: 0,
  estimatedTime: -1,
};

if (batteryNtStatus === 0) {
  const view = new DataView(batteryStateBuf.buffer);
  ntBatteryInfo = {
    acOnline: view.getUint8(0) !== 0,
    batteryPresent: view.getUint8(1) !== 0,
    charging: view.getUint8(2) !== 0,
    discharging: view.getUint8(3) !== 0,
    maxCapacity: view.getUint32(8, true),
    remainingCapacity: view.getUint32(12, true),
    rate: view.getInt32(16, true),
    estimatedTime: view.getInt32(24, true),
  };
}

// 3. Platform role
const role = PowrProf.PowerDeterminePlatformRole();
const roleNames: Record<number, string> = {
  [POWER_PLATFORM_ROLE.PlatformRoleUnspecified]: 'Unknown Device',
  [POWER_PLATFORM_ROLE.PlatformRoleDesktop]: 'Desktop PC',
  [POWER_PLATFORM_ROLE.PlatformRoleMobile]: 'Laptop/Mobile',
  [POWER_PLATFORM_ROLE.PlatformRoleWorkstation]: 'Workstation',
  [POWER_PLATFORM_ROLE.PlatformRoleEnterpriseServer]: 'Enterprise Server',
  [POWER_PLATFORM_ROLE.PlatformRoleSOHOServer]: 'SOHO Server',
  [POWER_PLATFORM_ROLE.PlatformRoleAppliancePC]: 'Appliance PC',
  [POWER_PLATFORM_ROLE.PlatformRolePerformanceServer]: 'Performance Server',
  [POWER_PLATFORM_ROLE.PlatformRoleSlate]: 'Tablet/Slate',
};
const roleName = roleNames[role] ?? `Unknown (${role})`;

// 4. Active power scheme
const guidPtrBuf = Buffer.alloc(8);
const schemeResult = PowrProf.PowerGetActiveScheme(0n, guidPtrBuf.ptr);
let powerPlanName = '(unknown)';
let powerPlanGuid = '(unknown)';

if (schemeResult === 0) {
  const guidAddr = Number(new DataView(guidPtrBuf.buffer).getBigUint64(0, true)) as Pointer;
  const guidBytes = new Uint8Array(toArrayBuffer(guidAddr, 0, 16));

  const h = [...guidBytes].map((b) => b.toString(16).padStart(2, '0'));
  powerPlanGuid = [
    h.slice(0, 4).reverse().join(''),
    h.slice(4, 6).reverse().join(''),
    h.slice(6, 8).reverse().join(''),
    h.slice(8, 10).join(''),
    h.slice(10, 16).join(''),
  ].join('-');

  // Get friendly name
  const sizeBuf = Buffer.alloc(4);
  const guidBuf = Buffer.from(guidBytes);
  PowrProf.PowerReadFriendlyName(0n, guidBuf.ptr, null, null, null, sizeBuf.ptr);
  const nameSize = new DataView(sizeBuf.buffer).getUint32(0, true);

  if (nameSize > 0) {
    const nameBuf = Buffer.alloc(nameSize);
    const nameResult = PowrProf.PowerReadFriendlyName(0n, guidBuf.ptr, null, null, nameBuf.ptr, sizeBuf.ptr);
    if (nameResult === 0) {
      powerPlanName = nameBuf.toString('utf16le').replace(/\0.*$/, '');
    }
  }
}

// 5. Power capabilities
const canHibernate = PowrProf.IsPwrHibernateAllowed();
const canSuspend = PowrProf.IsPwrSuspendAllowed();

// Generate the advisory
function batteryBar(percent: number): string {
  const width = 20;
  const filled = Math.round((percent / 100) * width);
  return '[\u2588'.repeat(1) + '\u2588'.repeat(filled - 1) + '\u2591'.repeat(width - filled) + ']';
}

function formatTime(seconds: number): string {
  if (seconds < 0) return 'Unknown';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getAdvice(percent: number, onAc: boolean, hasBattery: boolean): string[] {
  if (!hasBattery) {
    return [
      'No battery detected. You are running on pure wall power.',
      'Tip: Your PC is an immovable fortress. Enjoy unlimited power!',
      'Consider getting a UPS for those surprise power outages.',
    ];
  }

  if (onAc) {
    return [
      'Plugged in and charging. Living the good life!',
      `Current charge: ${percent}%. ${percent === 100 ? 'Fully charged - you are invincible.' : 'Topping up...'}`,
      'Pro tip: unplug occasionally to keep that battery healthy.',
    ];
  }

  // On battery
  if (percent > 80) {
    return [
      `Battery at ${percent}%. You are golden!`,
      'Plenty of juice. Go ahead, open another browser tab.',
      'At this rate, you could probably outlast a Marvel movie.',
    ];
  }
  if (percent > 50) {
    return [
      `Battery at ${percent}%. Still comfortable, but keep an eye on it.`,
      'Maybe close some of those 47 Chrome tabs?',
      'If you see a power outlet, give it a friendly nod.',
    ];
  }
  if (percent > 20) {
    return [
      `Battery at ${percent}%. We are entering the danger zone.`,
      'Time to dim that screen brightness to "cave dweller" mode.',
      'Bluetooth, Wi-Fi, that RGB keyboard? Kill them all.',
      canHibernate ? 'Hibernate is available if things get desperate.' : '',
    ].filter(Boolean);
  }
  // Critical
  return [
    `BATTERY AT ${percent}%! THIS IS NOT A DRILL!`,
    'FIND A CHARGER. NOW. RUN.',
    'Close everything. Save your work. Pray to the power gods.',
    canSuspend ? 'Sleep mode is your friend right now.' : 'Sleep is not even available. Godspeed.',
    'Maybe you should have listened at 50%...',
  ];
}

// Render
console.log(`
${'='.repeat(64)}
               BATTERY ADVISOR
               powered by @bun-win32/powrprof
${'='.repeat(64)}

  Device Type:     ${roleName}
  Power Plan:      ${powerPlanName}
  Plan GUID:       {${powerPlanGuid}}
  AC Power:        ${acOnline ? 'Plugged In' : 'On Battery'}
  Battery Present: ${batteryPresent ? 'Yes' : 'No'}
  Hibernate:       ${canHibernate ? 'Available' : 'Not Available'}
  Sleep:           ${canSuspend ? 'Available' : 'Not Available'}`);

if (batteryPresent) {
  const percent = chargePercent !== 255 ? chargePercent : 0;
  console.log(`
  Charge Level:    ${percent}% ${batteryBar(percent)}
  Time Remaining:  ${formatTime(remainingSeconds)}
  Max Capacity:    ${ntBatteryInfo.maxCapacity > 0 ? `${ntBatteryInfo.maxCapacity} mWh` : 'N/A'}
  Remaining:       ${ntBatteryInfo.remainingCapacity > 0 ? `${ntBatteryInfo.remainingCapacity} mWh` : 'N/A'}
  Drain Rate:      ${ntBatteryInfo.rate !== 0 ? `${Math.abs(ntBatteryInfo.rate)} mW` : 'N/A'}
  Charging:        ${ntBatteryInfo.charging ? 'Yes' : 'No'}
  Discharging:     ${ntBatteryInfo.discharging ? 'Yes' : 'No'}`);

  console.log(`\n${'─'.repeat(64)}`);
  console.log('  ADVISOR SAYS:\n');
  const advice = getAdvice(percent, acOnline, batteryPresent);
  for (const line of advice) {
    console.log(`    > ${line}`);
  }
} else {
  console.log(`\n${'─'.repeat(64)}`);
  console.log('  ADVISOR SAYS:\n');
  const advice = getAdvice(0, true, false);
  for (const line of advice) {
    console.log(`    > ${line}`);
  }
}

console.log(`\n${'='.repeat(64)}\n`);
