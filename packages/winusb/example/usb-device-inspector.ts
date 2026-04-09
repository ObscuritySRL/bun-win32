/**
 * USB Device Inspector
 *
 * A comprehensive WinUSB device inspector that opens a WinUSB-compatible device,
 * queries its capabilities, enumerates interfaces and pipes, reads device and
 * configuration descriptors, and displays pipe policy settings. Output is
 * formatted with aligned labels, human-readable values, and color coding.
 *
 * Requires a WinUSB-compatible USB device. Pass the device interface path as a
 * command-line argument, or run without arguments to see usage instructions.
 *
 * APIs demonstrated:
 *   - WinUsb_Initialize                    (open WinUSB session)
 *   - WinUsb_Free                          (close WinUSB session)
 *   - WinUsb_QueryDeviceInformation        (query device speed)
 *   - WinUsb_GetDescriptor                 (read USB descriptors)
 *   - WinUsb_QueryInterfaceSettings        (enumerate interface descriptors)
 *   - WinUsb_QueryPipe                     (enumerate pipe information)
 *   - WinUsb_GetCurrentAlternateSetting    (read active alternate setting)
 *   - WinUsb_GetPipePolicy                 (read pipe transfer policies)
 *   - WinUsb_GetPowerPolicy                (read device power policies)
 *   - WinUsb_GetAssociatedInterface        (query associated interfaces)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - CreateFileW                          (open device handle)
 *   - CloseHandle                          (release device handle)
 *   - GetLastError                         (retrieve error codes)
 *
 * Run: bun run example/usb-device-inspector.ts [device-path]
 */

import Kernel32, { FileAccess, FileCreationDisposition, FileFlags, FileShareMode, INVALID_HANDLE_VALUE } from '@bun-win32/kernel32';

import WinUsb, { DeviceInformationType, PipePolicyType, PowerPolicyType, UsbDescriptorType } from '../index';

WinUsb.Preload([
  'WinUsb_Free',
  'WinUsb_GetAssociatedInterface',
  'WinUsb_GetCurrentAlternateSetting',
  'WinUsb_GetDescriptor',
  'WinUsb_GetPipePolicy',
  'WinUsb_GetPowerPolicy',
  'WinUsb_Initialize',
  'WinUsb_QueryDeviceInformation',
  'WinUsb_QueryInterfaceSettings',
  'WinUsb_QueryPipe',
]);

Kernel32.Preload(['CreateFileW', 'CloseHandle', 'GetLastError']);

const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const MAGENTA = '\x1b[95m';
const RED = '\x1b[91m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// Pipe policy types
const PIPE_POLICIES: [number, string][] = [
  [PipePolicyType.SHORT_PACKET_TERMINATE, 'SHORT_PACKET_TERMINATE'],
  [PipePolicyType.AUTO_CLEAR_STALL, 'AUTO_CLEAR_STALL'],
  [PipePolicyType.PIPE_TRANSFER_TIMEOUT, 'PIPE_TRANSFER_TIMEOUT'],
  [PipePolicyType.ALLOW_PARTIAL_READS, 'ALLOW_PARTIAL_READS'],
  [PipePolicyType.AUTO_FLUSH, 'AUTO_FLUSH'],
  [PipePolicyType.RAW_IO, 'RAW_IO'],
  [PipePolicyType.MAXIMUM_TRANSFER_SIZE, 'MAXIMUM_TRANSFER_SIZE'],
  [PipePolicyType.RESET_PIPE_ON_RESUME, 'RESET_PIPE_ON_RESUME'],
];

// Power policy types
const POWER_POLICIES: [number, string][] = [
  [PowerPolicyType.AUTO_SUSPEND, 'AUTO_SUSPEND'],
  [PowerPolicyType.SUSPEND_DELAY, 'SUSPEND_DELAY'],
];

function label(name: string, value: string, indent = 2): void {
  console.log(`${' '.repeat(indent)}${DIM}${name.padEnd(26)}${RESET}${value}`);
}

function speedName(speed: number): string {
  const names: Record<number, string> = {
    1: `Full Speed or lower ${DIM}(12 Mbps or less)${RESET}`,
    2: `Full Speed ${DIM}(12 Mbps)${RESET}`,
    3: `High Speed or higher ${DIM}(480 Mbps or more)${RESET}`,
  };
  return names[speed] || `Unknown (${speed})`;
}

function classCodeName(classCode: number): string {
  const names: Record<number, string> = {
    0x00: 'Device',
    0x01: 'Audio',
    0x02: 'CDC',
    0x03: 'HID',
    0x05: 'Physical',
    0x06: 'Image',
    0x07: 'Printer',
    0x08: 'Mass Storage',
    0x09: 'Hub',
    0x0a: 'CDC Data',
    0x0e: 'Video',
    0xff: 'Vendor Specific',
  };
  return names[classCode] || `0x${classCode.toString(16).padStart(2, '0')}`;
}

function transferTypeName(attributes: number): string {
  const types = ['CONTROL', 'ISOCHRONOUS', 'BULK', 'INTERRUPT'];
  return types[attributes & 0x03];
}

function readWideString(buf: Buffer): string {
  return new TextDecoder('utf-16').decode(buf).replace(/\0.*$/, '');
}

// ── Main ──

const devicePath = process.argv[2];

if (!devicePath) {
  console.log(`${BOLD}${CYAN}USB Device Inspector${RESET}\n`);
  console.log(`Usage: bun run example/usb-device-inspector.ts <device-path>\n`);
  console.log(`The device path is a WinUSB device interface path, typically:`);
  console.log(`  ${DIM}\\\\?\\USB#VID_XXXX&PID_XXXX#serial#{GUID}${RESET}\n`);
  console.log(`To find device paths, use SetupAPI device enumeration or:`);
  console.log(`  ${DIM}Get-PnpDevice -Class USB | Format-List${RESET}  (PowerShell)\n`);
  console.log(`${YELLOW}No device path provided. Running in demo mode with simulated output.${RESET}\n`);
  printDemoOutput();
  process.exit(0);
}

const pathBuffer = Buffer.from(devicePath + '\0', 'utf16le');
const deviceHandle = Kernel32.CreateFileW(
  pathBuffer.ptr,
  FileAccess.GENERIC_READ | FileAccess.GENERIC_WRITE,
  FileShareMode.FILE_SHARE_READ | FileShareMode.FILE_SHARE_WRITE,
  null!,
  FileCreationDisposition.OPEN_EXISTING,
  FileFlags.FILE_FLAG_OVERLAPPED,
  0n,
);

if (deviceHandle === INVALID_HANDLE_VALUE) {
  const lastError = Kernel32.GetLastError();
  console.error(`${RED}Failed to open device: error ${lastError}${RESET}`);
  process.exit(1);
}

const interfaceHandleBuf = Buffer.alloc(8);
if (!WinUsb.WinUsb_Initialize(deviceHandle, interfaceHandleBuf.ptr)) {
  const lastError = Kernel32.GetLastError();
  console.error(`${RED}WinUsb_Initialize failed: error ${lastError}${RESET}`);
  Kernel32.CloseHandle(deviceHandle);
  process.exit(1);
}

const interfaceHandle = interfaceHandleBuf.readBigUInt64LE(0);

console.log(`\n${BOLD}${CYAN}\u2554${'═'.repeat(58)}\u2557${RESET}`);
console.log(`${BOLD}${CYAN}\u2551${RESET}  ${BOLD}USB Device Inspector${RESET}${' '.repeat(37)}${BOLD}${CYAN}\u2551${RESET}`);
console.log(`${BOLD}${CYAN}\u255a${'═'.repeat(58)}\u255d${RESET}\n`);

// ── Device Speed ──
console.log(`${BOLD}Device Information${RESET}`);
const speedBuf = Buffer.alloc(1);
const speedLenBuf = Buffer.alloc(4);
speedLenBuf.writeUInt32LE(1, 0);
if (WinUsb.WinUsb_QueryDeviceInformation(interfaceHandle, DeviceInformationType.DEVICE_SPEED, speedLenBuf.ptr, speedBuf.ptr)) {
  label('Speed', speedName(speedBuf.readUInt8(0)));
} else {
  label('Speed', `${DIM}(unavailable)${RESET}`);
}

// ── Device Descriptor ──
const deviceDescBuf = Buffer.alloc(18);
const deviceDescLen = Buffer.alloc(4);
if (WinUsb.WinUsb_GetDescriptor(interfaceHandle, UsbDescriptorType.USB_DEVICE_DESCRIPTOR_TYPE, 0, 0, deviceDescBuf.ptr, 18, deviceDescLen.ptr)) {
  const bcdUSB = deviceDescBuf.readUInt16LE(2);
  const vendorId = deviceDescBuf.readUInt16LE(8);
  const productId = deviceDescBuf.readUInt16LE(10);
  const bcdDevice = deviceDescBuf.readUInt16LE(12);
  const deviceClass = deviceDescBuf[4];
  const numConfigurations = deviceDescBuf[17];

  console.log(`\n${BOLD}Device Descriptor${RESET}`);
  label('USB Version', `${(bcdUSB >> 8) & 0xff}.${(bcdUSB >> 4) & 0x0f}${bcdUSB & 0x0f ? '.' + (bcdUSB & 0x0f) : ''}`);
  label('Vendor ID', `0x${vendorId.toString(16).padStart(4, '0')}`);
  label('Product ID', `0x${productId.toString(16).padStart(4, '0')}`);
  label('Device Version', `${(bcdDevice >> 8) & 0xff}.${(bcdDevice >> 4) & 0x0f}.${bcdDevice & 0x0f}`);
  label('Device Class', classCodeName(deviceClass));
  label('Configurations', `${numConfigurations}`);

  // Try to read string descriptors
  const stringDescBuf = Buffer.alloc(256);
  const stringDescLen = Buffer.alloc(4);
  const manufacturerIdx = deviceDescBuf[14];
  const productIdx = deviceDescBuf[15];
  const serialIdx = deviceDescBuf[16];

  if (manufacturerIdx > 0) {
    if (WinUsb.WinUsb_GetDescriptor(interfaceHandle, UsbDescriptorType.USB_STRING_DESCRIPTOR_TYPE, manufacturerIdx, 0x0409, stringDescBuf.ptr, 256, stringDescLen.ptr)) {
      const strLen = stringDescBuf[0] - 2; // bLength minus header
      if (strLen > 0) label('Manufacturer', readWideString(stringDescBuf.subarray(2, 2 + strLen)));
    }
  }
  if (productIdx > 0) {
    if (WinUsb.WinUsb_GetDescriptor(interfaceHandle, UsbDescriptorType.USB_STRING_DESCRIPTOR_TYPE, productIdx, 0x0409, stringDescBuf.ptr, 256, stringDescLen.ptr)) {
      const strLen = stringDescBuf[0] - 2;
      if (strLen > 0) label('Product', readWideString(stringDescBuf.subarray(2, 2 + strLen)));
    }
  }
  if (serialIdx > 0) {
    if (WinUsb.WinUsb_GetDescriptor(interfaceHandle, UsbDescriptorType.USB_STRING_DESCRIPTOR_TYPE, serialIdx, 0x0409, stringDescBuf.ptr, 256, stringDescLen.ptr)) {
      const strLen = stringDescBuf[0] - 2;
      if (strLen > 0) label('Serial Number', readWideString(stringDescBuf.subarray(2, 2 + strLen)));
    }
  }
}

// ── Current Alternate Setting ──
const altSettingBuf = Buffer.alloc(1);
if (WinUsb.WinUsb_GetCurrentAlternateSetting(interfaceHandle, altSettingBuf.ptr)) {
  label('\nActive Alt Setting', `${altSettingBuf[0]}`);
}

// ── Interface and Pipe Enumeration ──
console.log(`\n${BOLD}Interface & Pipe Enumeration${RESET}`);

// USB_INTERFACE_DESCRIPTOR (9 bytes)
const interfaceDescBuf = Buffer.alloc(9);
// WINUSB_PIPE_INFORMATION (12 bytes: 4 PipeType + 1 PipeId + 3 padding + 2 MaxPacketSize + 1 Interval + 1 padding)
const pipeInfoBuf = Buffer.alloc(12);

for (let altIndex = 0; altIndex < 16; altIndex++) {
  if (!WinUsb.WinUsb_QueryInterfaceSettings(interfaceHandle, altIndex, interfaceDescBuf.ptr)) break;

  const interfaceNumber = interfaceDescBuf[2];
  const alternateSetting = interfaceDescBuf[3];
  const numEndpoints = interfaceDescBuf[4];
  const interfaceClass = interfaceDescBuf[5];
  const interfaceSubClass = interfaceDescBuf[6];

  console.log(`\n  ${CYAN}Interface ${interfaceNumber}${RESET} ${DIM}(alt ${alternateSetting})${RESET}  ${BOLD}${classCodeName(interfaceClass)}${RESET}  ${DIM}subclass=0x${interfaceSubClass.toString(16).padStart(2, '0')}${RESET}`);

  for (let pipeIndex = 0; pipeIndex < numEndpoints; pipeIndex++) {
    if (!WinUsb.WinUsb_QueryPipe(interfaceHandle, altIndex, pipeIndex, pipeInfoBuf.ptr)) continue;

    // WINUSB_PIPE_INFORMATION layout:
    //   PipeType:       4 bytes (USBD_PIPE_TYPE enum, offset 0)
    //   PipeId:         1 byte  (offset 4)
    //   MaximumPacketSize: 2 bytes (USHORT, offset 6 — after 1 byte padding)
    //   Interval:       1 byte  (offset 8)
    const pipeType = pipeInfoBuf.readUInt32LE(0);
    const pipeId = pipeInfoBuf[4];
    const maxPacketSize = pipeInfoBuf.readUInt16LE(6);
    const interval = pipeInfoBuf[8];

    const direction = pipeId & 0x80 ? `${GREEN}IN ${RESET}` : `${RED}OUT${RESET}`;
    const typeNames = ['CONTROL', 'ISOCHRONOUS', 'BULK', 'INTERRUPT'];
    const typeColors = [CYAN, MAGENTA, GREEN, YELLOW];
    const typeName = typeNames[pipeType] || `TYPE_${pipeType}`;
    const typeColor = typeColors[pipeType] || '';

    console.log(`    EP 0x${pipeId.toString(16).padStart(2, '0')}  ${direction}  ${typeColor}${typeName.padEnd(12)}${RESET}  ${String(maxPacketSize).padStart(5)} bytes  ${DIM}interval=${interval}${RESET}`);

    // Read pipe policies
    const policyValueBuf = Buffer.alloc(4);
    const policyLenBuf = Buffer.alloc(4);
    const activePolicies: string[] = [];

    for (const [policyType, policyName] of PIPE_POLICIES) {
      policyLenBuf.writeUInt32LE(4, 0);
      if (WinUsb.WinUsb_GetPipePolicy(interfaceHandle, pipeId, policyType, policyLenBuf.ptr, policyValueBuf.ptr)) {
        const val = policyValueBuf.readUInt32LE(0);
        if (val !== 0) {
          activePolicies.push(`${policyName}=${val}`);
        }
      }
    }
    if (activePolicies.length > 0) {
      console.log(`${' '.repeat(10)}${DIM}Policies: ${activePolicies.join(', ')}${RESET}`);
    }
  }
}

// ── Power Policy ──
console.log(`\n${BOLD}Power Policy${RESET}`);
const powerValueBuf = Buffer.alloc(4);
const powerLenBuf = Buffer.alloc(4);

for (const [policyType, policyName] of POWER_POLICIES) {
  powerLenBuf.writeUInt32LE(4, 0);
  if (WinUsb.WinUsb_GetPowerPolicy(interfaceHandle, policyType, powerLenBuf.ptr, powerValueBuf.ptr)) {
    const val = powerValueBuf.readUInt32LE(0);
    label(policyName, policyType === PowerPolicyType.SUSPEND_DELAY ? `${val} ms` : val ? `${GREEN}Enabled${RESET}` : `${DIM}Disabled${RESET}`);
  }
}

// ── Associated Interfaces ──
console.log(`\n${BOLD}Associated Interfaces${RESET}`);
const assocHandleBuf = Buffer.alloc(8);
let foundAssociated = false;

for (let i = 0; i < 8; i++) {
  if (WinUsb.WinUsb_GetAssociatedInterface(interfaceHandle, i, assocHandleBuf.ptr)) {
    const assocHandle = assocHandleBuf.readBigUInt64LE(0);
    console.log(`  ${GREEN}Interface ${i + 1}${RESET}: handle 0x${assocHandle.toString(16)}`);
    WinUsb.WinUsb_Free(assocHandle);
    foundAssociated = true;
  } else {
    break;
  }
}
if (!foundAssociated) {
  console.log(`  ${DIM}No associated interfaces${RESET}`);
}

// ── Cleanup ──
WinUsb.WinUsb_Free(interfaceHandle);
Kernel32.CloseHandle(deviceHandle);
console.log(`\n${DIM}Device closed.${RESET}\n`);

function printDemoOutput(): void {
  console.log(`${BOLD}${CYAN}\u2554${'═'.repeat(58)}\u2557${RESET}`);
  console.log(`${BOLD}${CYAN}\u2551${RESET}  ${BOLD}USB Device Inspector${RESET}  ${DIM}(demo mode)${RESET}${' '.repeat(24)}${BOLD}${CYAN}\u2551${RESET}`);
  console.log(`${BOLD}${CYAN}\u255a${'═'.repeat(58)}\u255d${RESET}\n`);

  console.log(`${BOLD}Device Information${RESET}`);
  label('Speed', `High Speed ${DIM}(480 Mbps)${RESET}`);

  console.log(`\n${BOLD}Device Descriptor${RESET}`);
  label('USB Version', '2.0');
  label('Vendor ID', '0x1234');
  label('Product ID', '0xabcd');
  label('Device Version', '1.0.0');
  label('Device Class', 'Vendor Specific');
  label('Configurations', '1');
  label('Manufacturer', 'Example Corp');
  label('Product', 'WinUSB Demo Device');
  label('Serial Number', 'SN-2024-001');

  console.log(`\n${BOLD}Interface & Pipe Enumeration${RESET}`);
  console.log(`\n  ${CYAN}Interface 0${RESET} ${DIM}(alt 0)${RESET}  ${BOLD}Vendor Specific${RESET}  ${DIM}subclass=0xff${RESET}`);
  console.log(`    EP 0x81  ${GREEN}IN ${RESET}  ${GREEN}BULK        ${RESET}    512 bytes  ${DIM}interval=0${RESET}`);
  console.log(`    EP 0x02  ${RED}OUT${RESET}  ${GREEN}BULK        ${RESET}    512 bytes  ${DIM}interval=0${RESET}`);
  console.log(`    EP 0x83  ${GREEN}IN ${RESET}  ${YELLOW}INTERRUPT   ${RESET}      8 bytes  ${DIM}interval=1${RESET}`);

  console.log(`\n${BOLD}Power Policy${RESET}`);
  label('AUTO_SUSPEND', `${GREEN}Enabled${RESET}`);
  label('SUSPEND_DELAY', '5000 ms');

  console.log(`\n${BOLD}Associated Interfaces${RESET}`);
  console.log(`  ${DIM}No associated interfaces${RESET}`);
  console.log(`\n${DIM}(Demo mode — connect a real WinUSB device for live output)${RESET}\n`);
}
