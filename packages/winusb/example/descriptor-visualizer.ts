/**
 * USB Descriptor Visualizer
 *
 * Parses raw USB configuration descriptors into a colorful ASCII tree showing
 * interfaces, endpoints, and their properties. Works entirely in-memory with
 * no USB hardware required — the descriptor buffer is constructed to represent
 * a realistic composite USB device with HID and CDC interfaces.
 *
 * APIs demonstrated:
 *   - WinUsb_ParseConfigurationDescriptor  (find interface descriptors by class/subclass)
 *   - WinUsb_ParseDescriptors              (walk descriptor chains by type)
 *
 * Run: bun run example/descriptor-visualizer.ts
 */

import { toArrayBuffer } from 'bun:ffi';

import WinUsb, { UsbDescriptorType } from '../index';

WinUsb.Preload(['WinUsb_ParseConfigurationDescriptor', 'WinUsb_ParseDescriptors']);

// ANSI color helpers
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const MAGENTA = '\x1b[95m';
const RED = '\x1b[91m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// USB descriptor type constants
// USB_CONFIGURATION_DESCRIPTOR layout (9 bytes)
//   bLength:             1 byte  (offset 0)
//   bDescriptorType:     1 byte  (offset 1)
//   wTotalLength:        2 bytes (offset 2)
//   bNumInterfaces:      1 byte  (offset 4)
//   bConfigurationValue: 1 byte  (offset 5)
//   iConfiguration:      1 byte  (offset 6)
//   bmAttributes:        1 byte  (offset 7)
//   bMaxPower:           1 byte  (offset 8)

// USB_INTERFACE_DESCRIPTOR layout (9 bytes)
//   bLength:            1 byte  (offset 0)
//   bDescriptorType:    1 byte  (offset 1)
//   bInterfaceNumber:   1 byte  (offset 2)
//   bAlternateSetting:  1 byte  (offset 3)
//   bNumEndpoints:      1 byte  (offset 4)
//   bInterfaceClass:    1 byte  (offset 5)
//   bInterfaceSubClass: 1 byte  (offset 6)
//   bInterfaceProtocol: 1 byte  (offset 7)
//   iInterface:         1 byte  (offset 8)

// USB_ENDPOINT_DESCRIPTOR layout (7 bytes)
//   bLength:          1 byte  (offset 0)
//   bDescriptorType:  1 byte  (offset 1)
//   bEndpointAddress: 1 byte  (offset 2)
//   bmAttributes:     1 byte  (offset 3)
//   wMaxPacketSize:   2 bytes (offset 4)
//   bInterval:        1 byte  (offset 6)

function buildSampleConfigDescriptor(): Buffer {
  const descriptors: number[][] = [];

  // Configuration descriptor
  descriptors.push([
    9,
    UsbDescriptorType.USB_CONFIGURATION_DESCRIPTOR_TYPE,
    0,
    0, // wTotalLength placeholder (patched below)
    4, // bNumInterfaces
    1, // bConfigurationValue
    0, // iConfiguration
    0x80, // bmAttributes (bus-powered)
    250, // bMaxPower (500 mA)
  ]);

  // Interface 0: HID Keyboard
  descriptors.push([
    9,
    UsbDescriptorType.USB_INTERFACE_DESCRIPTOR_TYPE,
    0,
    0,
    1, // interface 0, alt 0, 1 endpoint
    0x03, // bInterfaceClass (HID)
    0x01, // bInterfaceSubClass (Boot Interface)
    0x01, // bInterfaceProtocol (Keyboard)
    0,
  ]);
  // HID class descriptor (non-standard, 9 bytes — skipped by standard parse)
  descriptors.push([9, 0x21, 0x11, 0x01, 0x00, 0x01, 0x22, 65, 0x00]);
  // Endpoint 0x81 IN, Interrupt, 8 bytes, 10ms
  descriptors.push([7, UsbDescriptorType.USB_ENDPOINT_DESCRIPTOR_TYPE, 0x81, 0x03, 8, 0, 10]);

  // Interface 1: HID Mouse
  descriptors.push([
    9,
    UsbDescriptorType.USB_INTERFACE_DESCRIPTOR_TYPE,
    1,
    0,
    1,
    0x03,
    0x01,
    0x02, // HID, Boot, Mouse
    0,
  ]);
  descriptors.push([9, 0x21, 0x11, 0x01, 0x00, 0x01, 0x22, 52, 0x00]);
  // Endpoint 0x82 IN, Interrupt, 4 bytes, 1ms
  descriptors.push([7, UsbDescriptorType.USB_ENDPOINT_DESCRIPTOR_TYPE, 0x82, 0x03, 4, 0, 1]);

  // Interface 2: CDC ACM (Communication)
  descriptors.push([
    9,
    UsbDescriptorType.USB_INTERFACE_DESCRIPTOR_TYPE,
    2,
    0,
    1,
    0x02,
    0x02,
    0x01, // CDC, ACM, AT commands
    0,
  ]);
  // CDC functional descriptors (class-specific, type 0x24)
  descriptors.push([5, 0x24, 0x00, 0x10, 0x01]); // Header
  descriptors.push([5, 0x24, 0x01, 0x00, 0x03]); // Call Management
  descriptors.push([4, 0x24, 0x02, 0x02]); // ACM
  descriptors.push([5, 0x24, 0x06, 0x02, 0x03]); // Union
  // Endpoint 0x83 IN, Interrupt, 8 bytes, 255ms (notification)
  descriptors.push([7, UsbDescriptorType.USB_ENDPOINT_DESCRIPTOR_TYPE, 0x83, 0x03, 8, 0, 255]);

  // Interface 3: CDC Data
  descriptors.push([
    9,
    UsbDescriptorType.USB_INTERFACE_DESCRIPTOR_TYPE,
    3,
    0,
    2,
    0x0a,
    0x00,
    0x00, // CDC Data
    0,
  ]);
  // Endpoint 0x04 OUT, Bulk, 64 bytes
  descriptors.push([7, UsbDescriptorType.USB_ENDPOINT_DESCRIPTOR_TYPE, 0x04, 0x02, 64, 0, 0]);
  // Endpoint 0x84 IN, Bulk, 64 bytes
  descriptors.push([7, UsbDescriptorType.USB_ENDPOINT_DESCRIPTOR_TYPE, 0x84, 0x02, 64, 0, 0]);

  const totalLength = descriptors.reduce((sum, d) => sum + d.length, 0);
  descriptors[0][2] = totalLength & 0xff;
  descriptors[0][3] = (totalLength >> 8) & 0xff;

  const buffer = Buffer.alloc(totalLength);
  let offset = 0;
  for (const desc of descriptors) {
    for (let i = 0; i < desc.length; i++) {
      buffer[offset++] = desc[i];
    }
  }
  return buffer;
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
    0x0b: 'Smart Card',
    0x0d: 'Content Security',
    0x0e: 'Video',
    0x0f: 'Personal Healthcare',
    0x10: 'Audio/Video',
    0xdc: 'Diagnostic',
    0xe0: 'Wireless',
    0xef: 'Miscellaneous',
    0xfe: 'Application Specific',
    0xff: 'Vendor Specific',
  };
  return names[classCode] || `Unknown (0x${classCode.toString(16).padStart(2, '0')})`;
}

function protocolName(classCode: number, subClass: number, protocol: number): string {
  if (classCode === 0x03 && subClass === 0x01) {
    if (protocol === 0x01) return 'Keyboard';
    if (protocol === 0x02) return 'Mouse';
  }
  if (classCode === 0x02 && subClass === 0x02 && protocol === 0x01) return 'AT Commands';
  if (protocol === 0) return 'None';
  return `0x${protocol.toString(16).padStart(2, '0')}`;
}

function transferTypeName(attributes: number): string {
  const types = ['CONTROL', 'ISOCHRONOUS', 'BULK', 'INTERRUPT'];
  return types[attributes & 0x03];
}

function transferTypeColor(attributes: number): string {
  const colors = [CYAN, MAGENTA, GREEN, YELLOW];
  return colors[attributes & 0x03];
}

function directionArrow(address: number): string {
  return address & 0x80 ? `${GREEN}\u2190 IN ${RESET}` : `${RED}\u2192 OUT${RESET}`;
}

console.log(`\n${BOLD}${CYAN}\u2554${'═'.repeat(58)}\u2557${RESET}`);
console.log(`${BOLD}${CYAN}\u2551${RESET}  ${BOLD}USB Descriptor Visualizer${RESET}${' '.repeat(32)}${BOLD}${CYAN}\u2551${RESET}`);
console.log(`${BOLD}${CYAN}\u2551${RESET}  ${DIM}Parsing in-memory configuration descriptors${RESET}${' '.repeat(12)}${BOLD}${CYAN}\u2551${RESET}`);
console.log(`${BOLD}${CYAN}\u255a${'═'.repeat(58)}\u255d${RESET}\n`);

const configDescriptor = buildSampleConfigDescriptor();
const totalLength = configDescriptor.readUInt16LE(2);
const numInterfaces = configDescriptor[4];
const configValue = configDescriptor[5];
const maxPower = configDescriptor[8] * 2;
const selfPowered = (configDescriptor[7] & 0x40) !== 0;

console.log(`${BOLD}Configuration Descriptor${RESET}`);
console.log(`  Total Length:   ${totalLength} bytes`);
console.log(`  Interfaces:     ${numInterfaces}`);
console.log(`  Config Value:   ${configValue}`);
console.log(`  Max Power:      ${maxPower} mA`);
console.log(`  Power Source:   ${selfPowered ? 'Self-powered' : 'Bus-powered'}`);
console.log();

// Use WinUsb_ParseConfigurationDescriptor to find each interface
// Pass -1 for class/subclass/protocol to match any
for (let interfaceNumber = 0; interfaceNumber < numInterfaces; interfaceNumber++) {
  const interfaceDescPtr = WinUsb.WinUsb_ParseConfigurationDescriptor(
    configDescriptor.ptr,
    configDescriptor.ptr, // start from beginning
    interfaceNumber,
    0, // alternate setting 0
    -1, // any class
    -1, // any subclass
    -1, // any protocol
  );

  if (!interfaceDescPtr) {
    console.log(`${DIM}  Interface ${interfaceNumber}: not found${RESET}`);
    continue;
  }

  // Read interface descriptor fields from the returned pointer
  const interfaceDescBuf = Buffer.from(toArrayBuffer(interfaceDescPtr, 0, 9));
  const numEndpoints = interfaceDescBuf[4];
  const interfaceClass = interfaceDescBuf[5];
  const interfaceSubClass = interfaceDescBuf[6];
  const interfaceProtocol = interfaceDescBuf[7];

  const className = classCodeName(interfaceClass);
  const proto = protocolName(interfaceClass, interfaceSubClass, interfaceProtocol);

  const isLast = interfaceNumber === numInterfaces - 1;
  const branch = isLast ? '\u2514' : '\u251c';
  const continuation = isLast ? ' ' : '\u2502';

  console.log(`${BOLD}${branch}\u2500\u2500 Interface ${interfaceNumber}${RESET}  ${CYAN}${className}${RESET}`);
  console.log(`${continuation}   Class:     0x${interfaceClass.toString(16).padStart(2, '0')} ${DIM}(${className})${RESET}`);
  console.log(`${continuation}   SubClass:  0x${interfaceSubClass.toString(16).padStart(2, '0')}`);
  console.log(`${continuation}   Protocol:  ${proto}`);
  console.log(`${continuation}   Endpoints: ${numEndpoints}`);

  // Walk endpoint descriptors using WinUsb_ParseDescriptors
  // Start searching after the interface descriptor
  let searchOffset = 0;

  // Find where this interface descriptor is in the config buffer
  for (let off = 0; off < totalLength; ) {
    const descriptorLength = configDescriptor[off];
    const descriptorType = configDescriptor[off + 1];
    if (descriptorLength === 0) break;

    if (descriptorType === UsbDescriptorType.USB_INTERFACE_DESCRIPTOR_TYPE && configDescriptor[off + 2] === interfaceNumber && configDescriptor[off + 3] === 0) {
      searchOffset = off + descriptorLength;
      break;
    }
    off += descriptorLength;
  }

  let endpointsFound = 0;
  let currentOffset = searchOffset;
  const firstEndpointDescPtr = WinUsb.WinUsb_ParseDescriptors(configDescriptor.ptr, totalLength, configDescriptor.subarray(searchOffset).ptr, UsbDescriptorType.USB_ENDPOINT_DESCRIPTOR_TYPE);

  if (firstEndpointDescPtr) {
    const firstEndpointDescBuf = Buffer.from(toArrayBuffer(firstEndpointDescPtr, 0, 7));

    while (currentOffset < totalLength) {
      const descriptorLength = configDescriptor[currentOffset];
      const descriptorType = configDescriptor[currentOffset + 1];
      if (descriptorLength === 0) break;

      if (
        descriptorType === UsbDescriptorType.USB_ENDPOINT_DESCRIPTOR_TYPE &&
        descriptorLength === firstEndpointDescBuf[0] &&
        configDescriptor[currentOffset + 2] === firstEndpointDescBuf[2] &&
        configDescriptor[currentOffset + 3] === firstEndpointDescBuf[3]
      ) {
        break;
      }

      currentOffset += descriptorLength;
    }
  }

  while (currentOffset < totalLength && endpointsFound < numEndpoints) {
    const descriptorLength = configDescriptor[currentOffset];
    const descriptorType = configDescriptor[currentOffset + 1];

    if (descriptorLength === 0) break;
    // Stop at next interface descriptor
    if (descriptorType === UsbDescriptorType.USB_INTERFACE_DESCRIPTOR_TYPE && currentOffset > searchOffset) break;

    if (descriptorType === UsbDescriptorType.USB_ENDPOINT_DESCRIPTOR_TYPE && descriptorLength >= 7) {
      const endpointAddress = configDescriptor[currentOffset + 2];
      const attributes = configDescriptor[currentOffset + 3];
      const maxPacketSize = configDescriptor.readUInt16LE(currentOffset + 4);
      const interval = configDescriptor[currentOffset + 6];

      const direction = directionArrow(endpointAddress);
      const transferType = transferTypeName(attributes);
      const typeColor = transferTypeColor(attributes);

      const epIsLast = endpointsFound === numEndpoints - 1;
      const epBranch = epIsLast ? '\u2514' : '\u251c';

      console.log(`${continuation}   ${epBranch}\u2500 EP 0x${endpointAddress.toString(16).padStart(2, '0')}  ${direction}  ${typeColor}${transferType}${RESET}  ${maxPacketSize} bytes  ${DIM}interval=${interval}ms${RESET}`);
      endpointsFound++;
    }

    currentOffset += descriptorLength;
  }
  console.log();
}

console.log(`${BOLD}Descriptor Summary${RESET}`);
const typeCounts: Record<number, number> = {};
let offset = 0;
while (offset < totalLength) {
  const descriptorLength = configDescriptor[offset];
  const descriptorType = configDescriptor[offset + 1];
  if (descriptorLength === 0) break;
  typeCounts[descriptorType] = (typeCounts[descriptorType] || 0) + 1;
  offset += descriptorLength;
}

const typeNames: Record<number, string> = {
  0x02: 'Configuration',
  0x04: 'Interface',
  0x05: 'Endpoint',
  0x21: 'HID',
  0x24: 'CS_INTERFACE (CDC)',
};

for (const [type, count] of Object.entries(typeCounts).sort(([a], [b]) => Number(a) - Number(b))) {
  const typeNum = Number(type);
  const name = typeNames[typeNum] || `Type 0x${typeNum.toString(16).padStart(2, '0')}`;
  const bar = '\u2588'.repeat(count * 3);
  const color = typeNum === 0x05 ? GREEN : typeNum === 0x04 ? CYAN : typeNum === 0x21 ? YELLOW : typeNum === 0x24 ? MAGENTA : DIM;
  console.log(`  ${name.padEnd(22)} ${color}${bar}${RESET} ${count}`);
}

console.log(`\n${DIM}Total: ${totalLength} bytes in ${Object.values(typeCounts).reduce((a, b) => a + b, 0)} descriptors${RESET}\n`);
