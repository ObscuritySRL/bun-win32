import { type Pointer, read, toArrayBuffer } from 'bun:ffi';

import Wlanapi, { WLAN_API_VERSION_2_0, WlanIntfOpcode } from '../index';

const WLAN_AVAILABLE_NETWORK_CONNECTED = 0x0000_0001;
const WLAN_AVAILABLE_NETWORK_HAS_PROFILE = 0x0000_0002;
const WLAN_AVAILABLE_NETWORK_SIZE = 628;
const WLAN_INTERFACE_INFO_SIZE = 532;
const WLAN_MAX_NETWORKS_TO_PRINT = 10;
const WLAN_REASON_STRING_CAPACITY = 512;

const authenticationAlgorithmNames = new Map<number, string>([
  [0x0000_0001, 'open'],
  [0x0000_0002, 'shared key'],
  [0x0000_0003, 'WPA-Enterprise'],
  [0x0000_0004, 'WPA-Personal'],
  [0x0000_0005, 'WPA-None'],
  [0x0000_0006, 'WPA2-Enterprise'],
  [0x0000_0007, 'WPA2-Personal'],
  [0x0000_0008, 'WPA3-Enterprise 192-bit'],
  [0x0000_0009, 'WPA3-SAE'],
  [0x0000_000a, 'OWE'],
  [0x0000_000b, 'WPA3-Enterprise'],
]);

const bssTypeNames = new Map<number, string>([
  [0x0000_0001, 'infrastructure'],
  [0x0000_0002, 'ad hoc'],
  [0x0000_0003, 'any'],
]);

const cipherAlgorithmNames = new Map<number, string>([
  [0x0000_0000, 'none'],
  [0x0000_0001, 'WEP40'],
  [0x0000_0002, 'TKIP'],
  [0x0000_0004, 'CCMP'],
  [0x0000_0005, 'WEP104'],
  [0x0000_0006, 'BIP-CMAC-128'],
  [0x0000_0008, 'GCMP'],
  [0x0000_0009, 'GCMP-256'],
  [0x0000_000a, 'CCMP-256'],
  [0x0000_000b, 'BIP-GMAC-128'],
  [0x0000_000c, 'BIP-GMAC-256'],
  [0x0000_000d, 'BIP-CMAC-256'],
  [0x0000_0100, 'group cipher'],
  [0x0000_0101, 'WEP'],
]);

const connectionModeNames = new Map<number, string>([
  [0x0000_0000, 'profile'],
  [0x0000_0001, 'temporary profile'],
  [0x0000_0002, 'secure discovery'],
  [0x0000_0003, 'unsecure discovery'],
  [0x0000_0004, 'auto'],
  [0x0000_0005, 'invalid'],
]);

const interfaceStateNames = new Map<number, string>([
  [0x0000_0000, 'not ready'],
  [0x0000_0001, 'connected'],
  [0x0000_0002, 'ad hoc network formed'],
  [0x0000_0003, 'disconnecting'],
  [0x0000_0004, 'disconnected'],
  [0x0000_0005, 'associating'],
  [0x0000_0006, 'discovering'],
  [0x0000_0007, 'authenticating'],
]);

const phyTypeNames = new Map<number, string>([
  [0x0000_0000, 'unknown'],
  [0x0000_0001, 'FHSS'],
  [0x0000_0002, 'DSSS'],
  [0x0000_0003, 'IR baseband'],
  [0x0000_0004, '802.11a'],
  [0x0000_0005, '802.11b'],
  [0x0000_0006, '802.11g'],
  [0x0000_0007, '802.11n'],
  [0x0000_0008, '802.11ac'],
  [0x0000_0009, '802.11ad'],
  [0x0000_000a, '802.11ax'],
]);

function formatGuid(sourceBuffer: Buffer, offset: number): string {
  const firstPart = sourceBuffer.readUInt32LE(offset).toString(16).padStart(8, '0');
  const secondPart = sourceBuffer
    .readUInt16LE(offset + 4)
    .toString(16)
    .padStart(4, '0');
  const thirdPart = sourceBuffer
    .readUInt16LE(offset + 6)
    .toString(16)
    .padStart(4, '0');
  const fourthPart = Array.from(sourceBuffer.subarray(offset + 8, offset + 10), (value) => value.toString(16).padStart(2, '0')).join('');
  const fifthPart = Array.from(sourceBuffer.subarray(offset + 10, offset + 16), (value) => value.toString(16).padStart(2, '0')).join('');

  return `${firstPart}-${secondPart}-${thirdPart}-${fourthPart}-${fifthPart}`;
}

function formatMacAddress(sourceBuffer: Buffer, offset: number): string {
  return Array.from(sourceBuffer.subarray(offset, offset + 6), (value) => value.toString(16).padStart(2, '0')).join(':');
}

function readFixedWideString(sourceBuffer: Buffer, offset: number, characterCount: number): string {
  return sourceBuffer.toString('utf16le', offset, offset + characterCount * 2).replace(/\0.*$/, '');
}

function readServiceSetIdentifier(sourceBuffer: Buffer, offset: number): string {
  const nameLength = sourceBuffer.readUInt32LE(offset);

  if (nameLength === 0) {
    return '<hidden>';
  }

  return Buffer.from(sourceBuffer.subarray(offset + 4, offset + 4 + nameLength)).toString('utf8');
}

function reasonCodeToString(clientHandle: bigint, reasonCode: number): string {
  const reasonBuffer = Buffer.alloc(WLAN_REASON_STRING_CAPACITY * 2);
  const status = Wlanapi.WlanReasonCodeToString(reasonCode, WLAN_REASON_STRING_CAPACITY, reasonBuffer.ptr, null);

  if (status !== 0) {
    return `0x${reasonCode.toString(16)}`;
  }

  return reasonBuffer.toString('utf16le').replace(/\0.*$/, '');
}

const negotiatedVersionBuffer = Buffer.alloc(4);
const clientHandleBuffer = Buffer.alloc(8);

const openStatus = Wlanapi.WlanOpenHandle(WLAN_API_VERSION_2_0, null, negotiatedVersionBuffer.ptr, clientHandleBuffer.ptr);

if (openStatus !== 0) {
  console.error(`WlanOpenHandle failed with status ${openStatus}.`);
  process.exit(1);
}

const negotiatedVersion = negotiatedVersionBuffer.readUInt32LE(0);
const clientHandle = clientHandleBuffer.readBigUInt64LE(0);
const interfaceListPointerBuffer = Buffer.alloc(8);

try {
  const enumStatus = Wlanapi.WlanEnumInterfaces(clientHandle, null, interfaceListPointerBuffer.ptr);

  if (enumStatus !== 0) {
    console.error(`WlanEnumInterfaces failed with status ${enumStatus}.`);
    process.exit(1);
  }

  const interfaceListPointer = read.ptr(interfaceListPointerBuffer.ptr) as Pointer;

  if (!interfaceListPointer) {
    console.log('No wireless interfaces found.');
    process.exit(0);
  }

  try {
    const interfaceListHeader = Buffer.from(toArrayBuffer(interfaceListPointer, 0, 8));
    const interfaceCount = interfaceListHeader.readUInt32LE(0);

    console.log(`Negotiated WLAN API version: 0x${negotiatedVersion.toString(16)}`);
    console.log(`Wireless interfaces: ${interfaceCount}`);

    for (let interfaceIndex = 0; interfaceIndex < interfaceCount; interfaceIndex++) {
      const interfaceInfoPointer = (Number(interfaceListPointer) + 8 + interfaceIndex * WLAN_INTERFACE_INFO_SIZE) as Pointer;
      const interfaceInfoBuffer = Buffer.from(toArrayBuffer(interfaceInfoPointer, 0, WLAN_INTERFACE_INFO_SIZE));
      const interfaceDescription = readFixedWideString(interfaceInfoBuffer, 16, 256);
      const interfaceGuid = formatGuid(interfaceInfoBuffer, 0);
      const interfaceState = interfaceInfoBuffer.readUInt32LE(528);

      console.log(`\nInterface ${interfaceIndex + 1}: ${interfaceDescription}`);
      console.log(`  GUID:   ${interfaceGuid}`);
      console.log(`  State:  ${interfaceStateNames.get(interfaceState) ?? `unknown (${interfaceState})`}`);

      if (interfaceState === 1) {
        const currentConnectionSizeBuffer = Buffer.alloc(4);
        const currentConnectionPointerBuffer = Buffer.alloc(8);
        const currentConnectionStatus = Wlanapi.WlanQueryInterface(clientHandle, interfaceInfoPointer, WlanIntfOpcode.WLAN_INTF_OPCODE_CURRENT_CONNECTION, null, currentConnectionSizeBuffer.ptr, currentConnectionPointerBuffer.ptr, null);

        if (currentConnectionStatus === 0) {
          const currentConnectionPointer = read.ptr(currentConnectionPointerBuffer.ptr) as Pointer;

          if (currentConnectionPointer) {
            try {
              const currentConnectionSize = currentConnectionSizeBuffer.readUInt32LE(0);
              const currentConnectionBuffer = Buffer.from(toArrayBuffer(currentConnectionPointer, 0, currentConnectionSize));
              const profileName = readFixedWideString(currentConnectionBuffer, 8, 256);
              const networkName = readServiceSetIdentifier(currentConnectionBuffer, 520);
              const bssType = currentConnectionBuffer.readUInt32LE(556);
              const basicServiceSetIdentifier = formatMacAddress(currentConnectionBuffer, 560);
              const phyType = currentConnectionBuffer.readUInt32LE(568);
              const signalQuality = currentConnectionBuffer.readUInt32LE(576);
              const receiveRateKilobits = currentConnectionBuffer.readUInt32LE(580);
              const transmitRateKilobits = currentConnectionBuffer.readUInt32LE(584);
              const securityEnabled = currentConnectionBuffer.readInt32LE(588) !== 0;
              const authenticationAlgorithm = currentConnectionBuffer.readUInt32LE(596);
              const cipherAlgorithm = currentConnectionBuffer.readUInt32LE(600);

              console.log('  Current connection:');
              console.log(`    Network:        ${networkName}`);
              console.log(`    Profile:        ${profileName || '(none)'}`);
              console.log(`    BSS type:       ${bssTypeNames.get(bssType) ?? `unknown (${bssType})`}`);
              console.log(`    BSSID:          ${basicServiceSetIdentifier}`);
              console.log(`    PHY:            ${phyTypeNames.get(phyType) ?? `unknown (${phyType})`}`);
              console.log(`    Signal:         ${signalQuality}%`);
              console.log(`    Receive rate:   ${(receiveRateKilobits / 1_000).toFixed(1)} Mbps`);
              console.log(`    Transmit rate:  ${(transmitRateKilobits / 1_000).toFixed(1)} Mbps`);
              console.log(`    Security:       ${securityEnabled ? 'enabled' : 'open'}`);
              console.log(`    Authentication: ${authenticationAlgorithmNames.get(authenticationAlgorithm) ?? `0x${authenticationAlgorithm.toString(16)}`}`);
              console.log(`    Cipher:         ${cipherAlgorithmNames.get(cipherAlgorithm) ?? `0x${cipherAlgorithm.toString(16)}`}`);
              console.log(`    Mode:           ${connectionModeNames.get(currentConnectionBuffer.readUInt32LE(4)) ?? `unknown (${currentConnectionBuffer.readUInt32LE(4)})`}`);
            } finally {
              Wlanapi.WlanFreeMemory(currentConnectionPointer);
            }
          }
        } else {
          console.log(`  Current connection query failed with status ${currentConnectionStatus}.`);
        }
      }

      const availableNetworkListPointerBuffer = Buffer.alloc(8);
      const availableNetworkStatus = Wlanapi.WlanGetAvailableNetworkList(clientHandle, interfaceInfoPointer, 0, null, availableNetworkListPointerBuffer.ptr);

      if (availableNetworkStatus !== 0) {
        console.log(`  Available network query failed with status ${availableNetworkStatus}.`);
        continue;
      }

      const availableNetworkListPointer = read.ptr(availableNetworkListPointerBuffer.ptr) as Pointer;

      if (!availableNetworkListPointer) {
        console.log('  Available networks: 0');
        continue;
      }

      try {
        const availableNetworkListHeader = Buffer.from(toArrayBuffer(availableNetworkListPointer, 0, 8));
        const availableNetworkCount = availableNetworkListHeader.readUInt32LE(0);

        console.log(`  Available networks: ${availableNetworkCount}`);

        const networksToPrint = Math.min(availableNetworkCount, WLAN_MAX_NETWORKS_TO_PRINT);

        for (let networkIndex = 0; networkIndex < networksToPrint; networkIndex++) {
          const availableNetworkPointer = (Number(availableNetworkListPointer) + 8 + networkIndex * WLAN_AVAILABLE_NETWORK_SIZE) as Pointer;
          const availableNetworkBuffer = Buffer.from(toArrayBuffer(availableNetworkPointer, 0, WLAN_AVAILABLE_NETWORK_SIZE));
          const networkName = readServiceSetIdentifier(availableNetworkBuffer, 512);
          const signalQuality = availableNetworkBuffer.readUInt32LE(604);
          const bssType = availableNetworkBuffer.readUInt32LE(548);
          const connectable = availableNetworkBuffer.readInt32LE(556) !== 0;
          const reasonCode = availableNetworkBuffer.readUInt32LE(560);
          const phyType = availableNetworkBuffer.readUInt32LE(568);
          const networkFlags = availableNetworkBuffer.readUInt32LE(620);
          const profileName = readFixedWideString(availableNetworkBuffer, 0, 256);
          const isConnected = (networkFlags & WLAN_AVAILABLE_NETWORK_CONNECTED) !== 0;
          const hasProfile = (networkFlags & WLAN_AVAILABLE_NETWORK_HAS_PROFILE) !== 0;
          const securityEnabled = availableNetworkBuffer.readInt32LE(608) !== 0;

          console.log(`    ${networkIndex + 1}. ${networkName}`);
          console.log(`       Signal:    ${signalQuality}%`);
          console.log(`       Type:      ${bssTypeNames.get(bssType) ?? `unknown (${bssType})`}`);
          console.log(`       PHY:       ${phyTypeNames.get(phyType) ?? `unknown (${phyType})`}`);
          console.log(`       Security:  ${securityEnabled ? 'enabled' : 'open'}`);
          console.log(`       Profile:   ${hasProfile ? profileName || '(saved profile)' : '(none)'}`);
          console.log(`       Connected: ${isConnected ? 'yes' : 'no'}`);
          console.log(`       Status:    ${connectable ? 'connectable' : reasonCodeToString(clientHandle, reasonCode)}`);
        }

        if (availableNetworkCount > networksToPrint) {
          console.log(`    ... ${availableNetworkCount - networksToPrint} more network(s) omitted`);
        }
      } finally {
        Wlanapi.WlanFreeMemory(availableNetworkListPointer);
      }
    }
  } finally {
    Wlanapi.WlanFreeMemory(interfaceListPointer);
  }
} finally {
  Wlanapi.WlanCloseHandle(clientHandle, null);
}
