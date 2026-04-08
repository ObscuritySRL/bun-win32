/**
 * Power Audit
 *
 * Comprehensive power configuration audit. Enumerates all power schemes with
 * their friendly names, reads battery state and system power capabilities,
 * and shows the current power status. All values are formatted with proper
 * units (mWh, mW, voltage, seconds to hours:minutes).
 *
 * APIs demonstrated:
 *   - PowerGetActiveScheme            (active power plan GUID)
 *   - PowerReadFriendlyName           (decode GUID to display name)
 *   - PowerEnumerate                  (list all power schemes)
 *   - CallNtPowerInformation          (SystemBatteryState, SystemPowerCapabilities)
 *   - GetPwrCapabilities              (system power capabilities struct)
 *   - PowerDeterminePlatformRoleEx    (detailed platform role)
 *   - IsPwrHibernateAllowed           (hibernate support check)
 *   - IsPwrSuspendAllowed             (sleep support check)
 *   - IsPwrShutdownAllowed            (shutdown support check)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetSystemPowerStatus            (AC line, battery flag, charge %)
 *
 * Run: bun run example/power-audit.ts
 */
import { type Pointer, toArrayBuffer } from 'bun:ffi';
import PowrProf, {
  POWER_INFORMATION_LEVEL,
  POWER_DATA_ACCESSOR,
  POWER_PLATFORM_ROLE,
} from '../index';
import Kernel32 from '@bun-win32/kernel32';

PowrProf.Preload([
  'PowerGetActiveScheme',
  'PowerReadFriendlyName',
  'PowerEnumerate',
  'CallNtPowerInformation',
  'GetPwrCapabilities',
  'PowerDeterminePlatformRoleEx',
  'IsPwrHibernateAllowed',
  'IsPwrSuspendAllowed',
  'IsPwrShutdownAllowed',
]);
Kernel32.Preload(['GetSystemPowerStatus']);

const W = 76;

function heading(title: string): void {
  console.log(`\n  ${'─'.repeat(W - 4)}`);
  console.log(`  ${title}`);
  console.log(`  ${'─'.repeat(W - 4)}`);
}

function row(label: string, value: string): void {
  console.log(`    ${label.padEnd(30)} ${value}`);
}

function yesNo(val: number | boolean): string {
  return val ? 'Yes' : 'No';
}

function formatGuid(guidBytes: Uint8Array): string {
  const h = [...guidBytes].map((b) => b.toString(16).padStart(2, '0'));
  return [
    h.slice(0, 4).reverse().join(''),
    h.slice(4, 6).reverse().join(''),
    h.slice(6, 8).reverse().join(''),
    h.slice(8, 10).join(''),
    h.slice(10, 16).join(''),
  ].join('-');
}

function readFriendlyName(guidBuf: Buffer): string {
  const sizeBuf = Buffer.alloc(4);
  PowrProf.PowerReadFriendlyName(0n, guidBuf.ptr, null, null, null, sizeBuf.ptr);
  const nameSize = new DataView(sizeBuf.buffer).getUint32(0, true);
  if (nameSize === 0) return '(unnamed)';

  const nameBuf = Buffer.alloc(nameSize);
  const result = PowrProf.PowerReadFriendlyName(0n, guidBuf.ptr, null, null, nameBuf.ptr, sizeBuf.ptr);
  if (result !== 0) return '(error reading name)';
  return nameBuf.toString('utf16le').replace(/\0.*$/, '');
}

function formatSeconds(sec: number): string {
  if (sec < 0) return 'Unknown';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

console.log(`\n${'='.repeat(W)}`);
console.log('                   POWER CONFIGURATION AUDIT');
console.log('                   powered by @bun-win32/powrprof');
console.log(`${'='.repeat(W)}`);

// 1. Active power scheme
heading('ACTIVE POWER SCHEME');

const guidPtrBuf = Buffer.alloc(8);
const activeResult = PowrProf.PowerGetActiveScheme(0n, guidPtrBuf.ptr);

let activeGuidBytes: Uint8Array | null = null;

if (activeResult === 0) {
  const guidAddr = Number(new DataView(guidPtrBuf.buffer).getBigUint64(0, true)) as Pointer;
  activeGuidBytes = new Uint8Array(toArrayBuffer(guidAddr, 0, 16));
  const guidStr = formatGuid(activeGuidBytes);
  const name = readFriendlyName(Buffer.from(activeGuidBytes));

  row('Name:', name);
  row('GUID:', `{${guidStr}}`);
} else {
  console.log(`    PowerGetActiveScheme failed: 0x${(activeResult >>> 0).toString(16)}`);
}

// 2. Enumerate all power schemes
heading('ALL POWER SCHEMES');

const indexBuf = Buffer.alloc(4);
const guidBuf = Buffer.alloc(16);
const sizeBuf = Buffer.alloc(4);
let schemeIndex = 0;

while (true) {
  sizeBuf.writeUInt32LE(16, 0);
  const enumResult = PowrProf.PowerEnumerate(
    0n, null, null,
    POWER_DATA_ACCESSOR.ACCESS_SCHEME,
    schemeIndex,
    guidBuf.ptr, sizeBuf.ptr,
  );

  // ERROR_NO_MORE_ITEMS = 259
  if (enumResult === 259 || enumResult !== 0) break;

  const schemeGuidBytes = new Uint8Array(guidBuf.buffer.slice(0, 16));
  const guidStr = formatGuid(schemeGuidBytes);
  const name = readFriendlyName(Buffer.from(schemeGuidBytes));

  const isActive = activeGuidBytes
    ? schemeGuidBytes.every((b, i) => b === activeGuidBytes![i])
    : false;
  const marker = isActive ? ' << ACTIVE' : '';

  row(`[${schemeIndex}] ${name}`, `{${guidStr}}${marker}`);
  schemeIndex++;
}

if (schemeIndex === 0) {
  console.log('    (no schemes enumerated)');
}

// 3. SystemBatteryState via CallNtPowerInformation
heading('BATTERY STATE (CallNtPowerInformation)');

const battBuf = Buffer.alloc(64);
const battStatus = PowrProf.CallNtPowerInformation(
  POWER_INFORMATION_LEVEL.SystemBatteryState,
  null, 0,
  battBuf.ptr, battBuf.byteLength,
);

if (battStatus === 0) {
  const bv = new DataView(battBuf.buffer);
  const acOnline = bv.getUint8(0);
  const battPresent = bv.getUint8(1);
  const charging = bv.getUint8(2);
  const discharging = bv.getUint8(3);
  const maxCapacity = bv.getUint32(8, true);
  const remainingCapacity = bv.getUint32(12, true);
  const rate = bv.getInt32(16, true);
  const estimatedTime = bv.getInt32(24, true);
  const defaultAlert1 = bv.getUint32(28, true);
  const defaultAlert2 = bv.getUint32(32, true);

  row('AC Online:', yesNo(acOnline));
  row('Battery Present:', yesNo(battPresent));
  row('Charging:', yesNo(charging));
  row('Discharging:', yesNo(discharging));
  row('Max Capacity:', maxCapacity > 0 ? `${maxCapacity} mWh` : 'N/A');
  row('Remaining Capacity:', remainingCapacity > 0 ? `${remainingCapacity} mWh` : 'N/A');
  if (maxCapacity > 0 && remainingCapacity > 0) {
    const pct = (remainingCapacity / maxCapacity) * 100;
    row('Charge Percentage:', `${pct.toFixed(1)}%`);
  }
  row('Drain/Charge Rate:', rate !== 0 ? `${Math.abs(rate)} mW (${rate > 0 ? 'charging' : 'draining'})` : 'N/A');
  row('Estimated Time:', estimatedTime > 0 ? formatSeconds(estimatedTime) : 'N/A');
  row('Default Alert 1:', defaultAlert1 > 0 ? `${defaultAlert1} mWh` : 'N/A');
  row('Default Alert 2:', defaultAlert2 > 0 ? `${defaultAlert2} mWh` : 'N/A');
} else {
  console.log(`    CallNtPowerInformation(Battery) failed: 0x${(battStatus >>> 0).toString(16)}`);
}

// 4. SystemPowerCapabilities via CallNtPowerInformation
heading('SYSTEM POWER CAPABILITIES (CallNtPowerInformation)');

const capBuf = Buffer.alloc(128);
const capStatus = PowrProf.CallNtPowerInformation(
  POWER_INFORMATION_LEVEL.SystemPowerCapabilities,
  null, 0,
  capBuf.ptr, capBuf.byteLength,
);

if (capStatus === 0) {
  const cv = new DataView(capBuf.buffer);
  // SYSTEM_POWER_CAPABILITIES partial layout:
  // 0x00: BOOLEAN PowerButtonPresent
  // 0x01: BOOLEAN SleepButtonPresent
  // 0x02: BOOLEAN LidPresent
  // 0x03: BOOLEAN SystemS1 (standby)
  // 0x04: BOOLEAN SystemS2
  // 0x05: BOOLEAN SystemS3 (sleep)
  // 0x06: BOOLEAN SystemS4 (hibernate)
  // 0x07: BOOLEAN SystemS5 (soft off)
  // 0x08: BOOLEAN HiberFilePresent
  // 0x09: BOOLEAN FullWake
  // 0x0A: BOOLEAN VideoDimPresent
  // 0x0B: BOOLEAN ApmPresent
  // 0x0C: BOOLEAN UpsPresent
  // 0x0D: BOOLEAN ThermalControl
  // 0x0E: BOOLEAN ProcessorThrottle
  // 0x0F: BYTE ProcessorMinThrottle
  // 0x10: BYTE ProcessorMaxThrottle (on older, up to Vista)
  // 0x11: BOOLEAN FastSystemS4 (hybrid sleep)
  // 0x12: BOOLEAN Hiberboot (fast startup)
  // ... more fields follow
  row('Power Button Present:', yesNo(cv.getUint8(0x00)));
  row('Sleep Button Present:', yesNo(cv.getUint8(0x01)));
  row('Lid Present:', yesNo(cv.getUint8(0x02)));
  row('Standby (S1):', yesNo(cv.getUint8(0x03)));
  row('S2:', yesNo(cv.getUint8(0x04)));
  row('Sleep (S3):', yesNo(cv.getUint8(0x05)));
  row('Hibernate (S4):', yesNo(cv.getUint8(0x06)));
  row('Soft Off (S5):', yesNo(cv.getUint8(0x07)));
  row('Hibernate File:', yesNo(cv.getUint8(0x08)));
  row('Full Wake:', yesNo(cv.getUint8(0x09)));
  row('Video Dim:', yesNo(cv.getUint8(0x0a)));
  row('APM Present:', yesNo(cv.getUint8(0x0b)));
  row('UPS Present:', yesNo(cv.getUint8(0x0c)));
  row('Thermal Control:', yesNo(cv.getUint8(0x0d)));
  row('Processor Throttle:', yesNo(cv.getUint8(0x0e)));
  row('Min CPU Throttle:', `${cv.getUint8(0x0f)}%`);
  row('Max CPU Throttle:', `${cv.getUint8(0x10)}%`);
  row('Fast S4 (Hybrid):', yesNo(cv.getUint8(0x11)));
  row('Hiberboot (Fast Start):', yesNo(cv.getUint8(0x12)));
} else {
  console.log(`    CallNtPowerInformation(Capabilities) failed: 0x${(capStatus >>> 0).toString(16)}`);
}

// 5. GetPwrCapabilities (alternative/supplementary)
heading('POWER CAPABILITIES (GetPwrCapabilities)');

const pwrCapBuf = Buffer.alloc(128);
const pwrCapOk = PowrProf.GetPwrCapabilities(pwrCapBuf.ptr);

if (pwrCapOk) {
  const pcv = new DataView(pwrCapBuf.buffer);
  row('Power Button:', yesNo(pcv.getUint8(0)));
  row('Sleep Button:', yesNo(pcv.getUint8(1)));
  row('Lid Present:', yesNo(pcv.getUint8(2)));
  row('S1 (Standby):', yesNo(pcv.getUint8(3)));
  row('S3 (Sleep):', yesNo(pcv.getUint8(5)));
  row('S4 (Hibernate):', yesNo(pcv.getUint8(6)));
  row('UPS:', yesNo(pcv.getUint8(0x0c)));
  row('Thermal Control:', yesNo(pcv.getUint8(0x0d)));
} else {
  console.log('    GetPwrCapabilities returned FALSE');
}

// 6. GetSystemPowerStatus (Kernel32)
heading('SYSTEM POWER STATUS (Kernel32)');

const spsBuf = Buffer.alloc(12);
const spsOk = Kernel32.GetSystemPowerStatus(spsBuf.ptr);

if (spsOk) {
  const acStatus = spsBuf.readUInt8(0);
  const batteryFlag = spsBuf.readUInt8(1);
  const lifePercent = spsBuf.readUInt8(2);
  const systemStatus = spsBuf.readUInt8(3);
  const lifeTime = spsBuf.readInt32LE(4);
  const fullLifeTime = spsBuf.readInt32LE(8);

  const acStr = acStatus === 1 ? 'Online' : acStatus === 0 ? 'Offline' : 'Unknown';
  row('AC Line Status:', acStr);

  const flags: string[] = [];
  if (batteryFlag & 1) flags.push('High');
  if (batteryFlag & 2) flags.push('Low');
  if (batteryFlag & 4) flags.push('Critical');
  if (batteryFlag & 8) flags.push('Charging');
  if (batteryFlag & 128) flags.push('No Battery');
  row('Battery Flags:', flags.length > 0 ? flags.join(', ') : 'None');

  row('Battery Life %:', lifePercent !== 255 ? `${lifePercent}%` : 'Unknown');
  row('System Status:', systemStatus === 1 ? 'Battery Saver On' : 'Normal');
  row('Battery Life Time:', lifeTime >= 0 ? formatSeconds(lifeTime) : 'Unknown');
  row('Battery Full Life:', fullLifeTime >= 0 ? formatSeconds(fullLifeTime) : 'Unknown');
} else {
  console.log('    GetSystemPowerStatus failed');
}

// 7. Platform role and power state checks
heading('PLATFORM & POWER STATE CHECKS');

const roleEx = PowrProf.PowerDeterminePlatformRoleEx(2);
const roleNames: Record<number, string> = {
  [POWER_PLATFORM_ROLE.PlatformRoleUnspecified]: 'Unspecified',
  [POWER_PLATFORM_ROLE.PlatformRoleDesktop]: 'Desktop',
  [POWER_PLATFORM_ROLE.PlatformRoleMobile]: 'Mobile/Laptop',
  [POWER_PLATFORM_ROLE.PlatformRoleWorkstation]: 'Workstation',
  [POWER_PLATFORM_ROLE.PlatformRoleEnterpriseServer]: 'Enterprise Server',
  [POWER_PLATFORM_ROLE.PlatformRoleSOHOServer]: 'SOHO Server',
  [POWER_PLATFORM_ROLE.PlatformRoleAppliancePC]: 'Appliance PC',
  [POWER_PLATFORM_ROLE.PlatformRolePerformanceServer]: 'Performance Server',
  [POWER_PLATFORM_ROLE.PlatformRoleSlate]: 'Tablet/Slate',
};

row('Platform Role:', roleNames[roleEx] ?? `Unknown (${roleEx})`);
row('Hibernate Allowed:', yesNo(PowrProf.IsPwrHibernateAllowed()));
row('Suspend Allowed:', yesNo(PowrProf.IsPwrSuspendAllowed()));
row('Shutdown Allowed:', yesNo(PowrProf.IsPwrShutdownAllowed()));

// 8. SystemPowerInformation via CallNtPowerInformation
heading('SYSTEM POWER INFORMATION (CallNtPowerInformation)');

const spiSize = 32;
const spiBuf = Buffer.alloc(spiSize);
const spiStatus = PowrProf.CallNtPowerInformation(
  POWER_INFORMATION_LEVEL.SystemPowerInformation,
  null, 0,
  spiBuf.ptr, spiBuf.byteLength,
);

if (spiStatus === 0) {
  const sv = new DataView(spiBuf.buffer);
  // SYSTEM_POWER_INFORMATION:
  // 0x00: ULONG MaxIdlenessAllowed
  // 0x04: ULONG Idleness
  // 0x08: ULONG TimeRemaining
  // 0x0C: UCHAR CoolingMode (0=active, 1=passive)
  const maxIdleness = sv.getUint32(0x00, true);
  const idleness = sv.getUint32(0x04, true);
  const timeRemaining = sv.getUint32(0x08, true);
  const coolingMode = sv.getUint8(0x0c);

  row('Max Idleness Allowed:', `${maxIdleness}%`);
  row('Current Idleness:', `${idleness}%`);
  row('Time Remaining:', timeRemaining > 0 ? formatSeconds(timeRemaining) : 'N/A');
  row('Cooling Mode:', coolingMode === 0 ? 'Active' : coolingMode === 1 ? 'Passive' : `Unknown (${coolingMode})`);
} else {
  console.log(`    CallNtPowerInformation(SysPowerInfo) failed: 0x${(spiStatus >>> 0).toString(16)}`);
}

console.log(`\n${'='.repeat(W)}\n`);
