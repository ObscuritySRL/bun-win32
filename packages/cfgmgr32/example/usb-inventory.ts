/**
 * USB Inventory
 *
 * Enumerates all USB device instances on the system using the Configuration
 * Manager API, retrieves each device's status and hardware IDs, and prints
 * a diagnostic inventory table. Useful for asset tracking, driver debugging,
 * and verifying which USB devices are currently attached.
 *
 * APIs demonstrated:
 *   - Cfgmgr32.CM_Get_Device_ID_List_SizeW (size the multi-sz ID buffer)
 *   - Cfgmgr32.CM_Get_Device_ID_ListW      (fill the multi-sz ID buffer)
 *   - Cfgmgr32.CM_Locate_DevNodeW          (resolve an ID to a devnode)
 *   - Cfgmgr32.CM_Get_DevNode_Status        (query status and problem code)
 *   - Cfgmgr32.CM_Get_DevNode_Registry_PropertyW (fetch hardware IDs)
 *
 * Run: bun run example/usb-inventory.ts
 */

import Cfgmgr32, { CR, CM_LOCATE_DEVNODE, CM_GETIDLIST_FILTER, CM_REGISTRY, DN } from '../index';

Cfgmgr32.Preload([
  'CM_Get_DevNode_Registry_PropertyW',
  'CM_Get_DevNode_Status',
  'CM_Get_Device_ID_ListW',
  'CM_Get_Device_ID_List_SizeW',
  'CM_Locate_DevNodeW',
]);

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

const CM_DRP_DEVICEDESC = 0x0000_0001;
const CM_DRP_HARDWAREID = 0x0000_0002;
const CM_DRP_MFG = 0x0000_000c;

interface UsbDevice {
  description: string;
  deviceId: string;
  hardwareIds: string[];
  manufacturer: string;
  problemCode: number;
  statusFlags: number;
}

function getMultiSzDeviceIds(enumerator: string): string[] {
  const enumeratorBuf = Buffer.from(enumerator + '\0', 'utf16le');
  const sizeBuf = Buffer.alloc(4);
  let cr = Cfgmgr32.CM_Get_Device_ID_List_SizeW(sizeBuf.ptr, enumeratorBuf.ptr, CM_GETIDLIST_FILTER.ENUMERATOR);

  if (cr !== CR.SUCCESS) {
    return [];
  }

  const charCount = sizeBuf.readUInt32LE(0);

  if (charCount <= 1) {
    return [];
  }

  const listBuf = Buffer.alloc(charCount * 2);
  cr = Cfgmgr32.CM_Get_Device_ID_ListW(enumeratorBuf.ptr, listBuf.ptr, charCount, CM_GETIDLIST_FILTER.ENUMERATOR);

  if (cr !== CR.SUCCESS) {
    return [];
  }

  const raw = listBuf.toString('utf16le');
  return raw.split('\0').filter((id) => id.length > 0);
}

function getRegistryStringProperty(devInst: number, property: number): string {
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(0, 0);

  let cr = Cfgmgr32.CM_Get_DevNode_Registry_PropertyW(devInst, property, null, null, sizeBuf.ptr, 0);

  if (cr !== CR.BUFFER_SMALL && cr !== CR.SUCCESS) {
    return '';
  }

  const byteSize = sizeBuf.readUInt32LE(0);

  if (byteSize === 0) {
    return '';
  }

  const valueBuf = Buffer.alloc(byteSize);
  cr = Cfgmgr32.CM_Get_DevNode_Registry_PropertyW(devInst, property, null, valueBuf.ptr, sizeBuf.ptr, 0);

  if (cr !== CR.SUCCESS) {
    return '';
  }

  return valueBuf.toString('utf16le').replace(/\0.*$/, '');
}

function getRegistryMultiSzProperty(devInst: number, property: number): string[] {
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(0, 0);

  let cr = Cfgmgr32.CM_Get_DevNode_Registry_PropertyW(devInst, property, null, null, sizeBuf.ptr, 0);

  if (cr !== CR.BUFFER_SMALL && cr !== CR.SUCCESS) {
    return [];
  }

  const byteSize = sizeBuf.readUInt32LE(0);

  if (byteSize === 0) {
    return [];
  }

  const valueBuf = Buffer.alloc(byteSize);
  cr = Cfgmgr32.CM_Get_DevNode_Registry_PropertyW(devInst, property, null, valueBuf.ptr, sizeBuf.ptr, 0);

  if (cr !== CR.SUCCESS) {
    return [];
  }

  const raw = valueBuf.toString('utf16le');
  return raw.split('\0').filter((s) => s.length > 0);
}

function getDeviceStatus(devInst: number): { problemCode: number; statusFlags: number } {
  const statusBuf = Buffer.alloc(4);
  const problemBuf = Buffer.alloc(4);
  const cr = Cfgmgr32.CM_Get_DevNode_Status(statusBuf.ptr, problemBuf.ptr, devInst, 0);

  if (cr !== CR.SUCCESS) {
    return { problemCode: 0, statusFlags: 0 };
  }

  return {
    problemCode: problemBuf.readUInt32LE(0),
    statusFlags: statusBuf.readUInt32LE(0),
  };
}

function statusLabel(device: UsbDevice): string {
  if (device.statusFlags & DN.HAS_PROBLEM) {
    return `${ANSI.red}PROBLEM(${device.problemCode})${ANSI.reset}`;
  }

  if (device.statusFlags & DN.STARTED) {
    return `${ANSI.green}OK${ANSI.reset}`;
  }

  if (device.statusFlags & DN.DRIVER_LOADED) {
    return `${ANSI.yellow}STOPPED${ANSI.reset}`;
  }

  return `${ANSI.dim}OFFLINE${ANSI.reset}`;
}

const enumerator = Bun.argv[2] ?? 'USB';
const deviceIds = getMultiSzDeviceIds(enumerator);

console.log(`${ANSI.bold}${ANSI.cyan}USB Device Inventory${ANSI.reset}`);
console.log(`${ANSI.dim}Enumerator: ${enumerator} | Found ${deviceIds.length} device instance(s)${ANSI.reset}`);
console.log('');

if (deviceIds.length === 0) {
  console.log(`${ANSI.yellow}No devices found for enumerator "${enumerator}".${ANSI.reset}`);
  process.exit(0);
}

const devices: UsbDevice[] = [];
const devInstBuf = Buffer.alloc(4);

for (const deviceId of deviceIds) {
  const idBuf = Buffer.from(deviceId + '\0', 'utf16le');
  const cr = Cfgmgr32.CM_Locate_DevNodeW(devInstBuf.ptr, idBuf.ptr, CM_LOCATE_DEVNODE.PHANTOM);

  if (cr !== CR.SUCCESS) {
    continue;
  }

  const devInst = devInstBuf.readUInt32LE(0);
  const { problemCode, statusFlags } = getDeviceStatus(devInst);
  const description = getRegistryStringProperty(devInst, CM_DRP_DEVICEDESC);
  const manufacturer = getRegistryStringProperty(devInst, CM_DRP_MFG);
  const hardwareIds = getRegistryMultiSzProperty(devInst, CM_DRP_HARDWAREID);

  devices.push({ description, deviceId, hardwareIds, manufacturer, problemCode, statusFlags });
}

const descWidth = Math.max(11, ...devices.map((d) => d.description.length));
const mfgWidth = Math.max(12, ...devices.map((d) => d.manufacturer.length));

const header = `${'Description'.padEnd(descWidth)}  ${'Manufacturer'.padEnd(mfgWidth)}  ${'Status'.padEnd(12)}  Device ID`;
console.log(`${ANSI.bold}${header}${ANSI.reset}`);
console.log(`${ANSI.dim}${'─'.repeat(header.length + 20)}${ANSI.reset}`);

for (const device of devices) {
  const desc = (device.description || '(none)').padEnd(descWidth);
  const mfg = (device.manufacturer || '(none)').padEnd(mfgWidth);
  const status = statusLabel(device).padEnd(12 + 9);
  console.log(`${desc}  ${mfg}  ${status}  ${ANSI.dim}${device.deviceId}${ANSI.reset}`);

  if (device.hardwareIds.length > 0) {
    for (const hwId of device.hardwareIds) {
      console.log(`${' '.repeat(descWidth)}  ${' '.repeat(mfgWidth)}  ${' '.repeat(12)}  ${ANSI.dim}  hw: ${hwId}${ANSI.reset}`);
    }
  }
}

const okCount = devices.filter((d) => d.statusFlags & DN.STARTED).length;
const problemCount = devices.filter((d) => d.statusFlags & DN.HAS_PROBLEM).length;

console.log('');
console.log(`${ANSI.bold}Summary${ANSI.reset}`);
console.log(`  ${ANSI.dim}Total:${ANSI.reset}    ${devices.length}`);
console.log(`  ${ANSI.green}OK:${ANSI.reset}       ${okCount}`);

if (problemCount > 0) {
  console.log(`  ${ANSI.red}Problems:${ANSI.reset} ${problemCount}`);
}

console.log(`  ${ANSI.dim}Offline:${ANSI.reset}  ${devices.length - okCount - problemCount}`);
