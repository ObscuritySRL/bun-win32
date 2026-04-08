/**
 * Comprehensive WiFi diagnostic report.
 *
 * Enumerates all wireless interfaces and prints detailed information about
 * each adapter, the current connection (if any), and every visible network.
 * Decodes PHY type, authentication/cipher algorithms, BSS type, connection
 * mode, reason codes, and network flags into human-readable labels.
 *
 * APIs demonstrated:
 *   - WlanOpenHandle / WlanCloseHandle (session lifecycle)
 *   - WlanEnumInterfaces (discover wireless adapters)
 *   - WlanQueryInterface (current connection attributes)
 *   - WlanGetAvailableNetworkList (visible networks)
 *   - WlanReasonCodeToString (decode WLAN reason codes)
 *   - WlanFreeMemory (release native buffers)
 *
 * Run: bun run example/wifi-diagnostic.ts
 */

import { type Pointer, read, toArrayBuffer } from 'bun:ffi';

import Wlanapi, { WLAN_API_VERSION_2_0, WlanIntfOpcode } from '../index';

const NETWORK_ENTRY_SIZE = 628;
const INTERFACE_ENTRY_SIZE = 532;
const CONNECTED_FLAG = 0x0000_0001;
const HAS_PROFILE_FLAG = 0x0000_0002;
const REASON_STRING_CAPACITY = 512;

const authNames = new Map<number, string>([
  [0x01, 'Open System'],
  [0x02, 'Shared Key'],
  [0x03, 'WPA-Enterprise'],
  [0x04, 'WPA-Personal'],
  [0x05, 'WPA-None'],
  [0x06, 'WPA2-Enterprise'],
  [0x07, 'WPA2-Personal'],
  [0x08, 'WPA3-Enterprise 192-bit'],
  [0x09, 'WPA3-SAE'],
  [0x0a, 'OWE (Opportunistic Wireless Encryption)'],
  [0x0b, 'WPA3-Enterprise'],
]);

const cipherNames = new Map<number, string>([
  [0x00, 'None'],
  [0x01, 'WEP40'],
  [0x02, 'TKIP'],
  [0x04, 'CCMP (AES-128)'],
  [0x05, 'WEP104'],
  [0x06, 'BIP-CMAC-128'],
  [0x08, 'GCMP (AES-128)'],
  [0x09, 'GCMP-256'],
  [0x0a, 'CCMP-256'],
  [0x0b, 'BIP-GMAC-128'],
  [0x0c, 'BIP-GMAC-256'],
  [0x0d, 'BIP-CMAC-256'],
  [0x100, 'Use Group Cipher'],
  [0x101, 'WEP'],
]);

const phyNames = new Map<number, string>([
  [0x00, 'Unknown'],
  [0x01, 'FHSS (802.11)'],
  [0x02, 'DSSS (802.11)'],
  [0x03, 'IR Baseband'],
  [0x04, '802.11a (OFDM 5 GHz)'],
  [0x05, '802.11b (DSSS/HR 2.4 GHz)'],
  [0x06, '802.11g (ERP 2.4 GHz)'],
  [0x07, '802.11n (HT)'],
  [0x08, '802.11ac (VHT)'],
  [0x09, '802.11ad (DMG 60 GHz)'],
  [0x0a, '802.11ax (HE / WiFi 6)'],
]);

const bssNames = new Map<number, string>([
  [0x01, 'Infrastructure'],
  [0x02, 'Independent (Ad-Hoc)'],
  [0x03, 'Any'],
]);

const connectionModeNames = new Map<number, string>([
  [0x00, 'Profile'],
  [0x01, 'Temporary Profile'],
  [0x02, 'Secure Discovery'],
  [0x03, 'Unsecure Discovery'],
  [0x04, 'Auto'],
  [0x05, 'Invalid'],
]);

const interfaceStateNames = new Map<number, string>([
  [0x00, 'Not Ready'],
  [0x01, 'Connected'],
  [0x02, 'Ad Hoc Network Formed'],
  [0x03, 'Disconnecting'],
  [0x04, 'Disconnected'],
  [0x05, 'Associating'],
  [0x06, 'Discovering'],
  [0x07, 'Authenticating'],
]);

function readSsid(buf: Buffer, offset: number): string {
  const len = buf.readUInt32LE(offset);
  if (len === 0) return '<hidden>';
  return Buffer.from(buf.subarray(offset + 4, offset + 4 + len)).toString('utf8');
}

function readWideString(buf: Buffer, offset: number, maxChars: number): string {
  return buf.toString('utf16le', offset, offset + maxChars * 2).replace(/\0.*$/, '');
}

function formatGuid(buf: Buffer, offset: number): string {
  const d1 = buf.readUInt32LE(offset).toString(16).padStart(8, '0');
  const d2 = buf.readUInt16LE(offset + 4).toString(16).padStart(4, '0');
  const d3 = buf.readUInt16LE(offset + 6).toString(16).padStart(4, '0');
  const d4 = Array.from(buf.subarray(offset + 8, offset + 10), (b) => b.toString(16).padStart(2, '0')).join('');
  const d5 = Array.from(buf.subarray(offset + 10, offset + 16), (b) => b.toString(16).padStart(2, '0')).join('');
  return `{${d1}-${d2}-${d3}-${d4}-${d5}}`;
}

function formatMac(buf: Buffer, offset: number): string {
  return Array.from(buf.subarray(offset, offset + 6), (b) => b.toString(16).padStart(2, '0')).join(':');
}

function decodeReasonCode(reasonCode: number): string {
  const reasonBuf = Buffer.alloc(REASON_STRING_CAPACITY * 2);
  const status = Wlanapi.WlanReasonCodeToString(reasonCode, REASON_STRING_CAPACITY, reasonBuf.ptr, null);
  if (status !== 0) return `0x${reasonCode.toString(16)}`;
  return reasonBuf.toString('utf16le').replace(/\0.*$/, '');
}

function lookup<T>(map: Map<T, string>, key: T, fallbackPrefix = ''): string {
  return map.get(key) ?? `${fallbackPrefix}unknown (0x${(key as number).toString(16)})`;
}

console.log('=== WiFi Diagnostic Report ===');
console.log(`Timestamp: ${new Date().toISOString()}\n`);

const negotiatedVersionBuf = Buffer.alloc(4);
const clientHandleBuf = Buffer.alloc(8);
const openStatus = Wlanapi.WlanOpenHandle(WLAN_API_VERSION_2_0, null, negotiatedVersionBuf.ptr, clientHandleBuf.ptr);

if (openStatus !== 0) {
  console.error(`WlanOpenHandle failed (error ${openStatus}). Is the WLAN service running?`);
  process.exit(1);
}

const clientHandle = clientHandleBuf.readBigUInt64LE(0);
const negotiatedVersion = negotiatedVersionBuf.readUInt32LE(0);
console.log(`WLAN API version: 0x${negotiatedVersion.toString(16)}`);

try {
  const ifListPtrBuf = Buffer.alloc(8);
  const enumStatus = Wlanapi.WlanEnumInterfaces(clientHandle, null, ifListPtrBuf.ptr);

  if (enumStatus !== 0) {
    console.error(`WlanEnumInterfaces failed (error ${enumStatus}).`);
    process.exit(1);
  }

  const ifListPtr = read.ptr(ifListPtrBuf.ptr) as Pointer;

  if (!ifListPtr) {
    console.log('No wireless interfaces detected.');
    process.exit(0);
  }

  try {
    const ifHeaderBuf = Buffer.from(toArrayBuffer(ifListPtr, 0, 8));
    const ifCount = ifHeaderBuf.readUInt32LE(0);
    console.log(`Wireless interfaces found: ${ifCount}\n`);

    for (let i = 0; i < ifCount; i++) {
      const ifPtr = (Number(ifListPtr) + 8 + i * INTERFACE_ENTRY_SIZE) as Pointer;
      const ifBuf = Buffer.from(toArrayBuffer(ifPtr, 0, INTERFACE_ENTRY_SIZE));
      const guid = formatGuid(ifBuf, 0);
      const description = readWideString(ifBuf, 16, 256);
      const state = ifBuf.readUInt32LE(528);

      console.log(`--- Interface ${i + 1} ---`);
      console.log(`  Description: ${description}`);
      console.log(`  GUID:        ${guid}`);
      console.log(`  State:       ${lookup(interfaceStateNames, state)}`);

      if (state === 1) {
        const connSizeBuf = Buffer.alloc(4);
        const connPtrBuf = Buffer.alloc(8);
        const connStatus = Wlanapi.WlanQueryInterface(clientHandle, ifPtr, WlanIntfOpcode.WLAN_INTF_OPCODE_CURRENT_CONNECTION, null, connSizeBuf.ptr, connPtrBuf.ptr, null);

        if (connStatus === 0) {
          const connPtr = read.ptr(connPtrBuf.ptr) as Pointer;
          if (connPtr) {
            try {
              const connSize = connSizeBuf.readUInt32LE(0);
              const cb = Buffer.from(toArrayBuffer(connPtr, 0, connSize));

              const connectionMode = cb.readUInt32LE(4);
              const profileName = readWideString(cb, 8, 256);
              const ssid = readSsid(cb, 520);
              const bssType = cb.readUInt32LE(556);
              const bssid = formatMac(cb, 560);
              const phyType = cb.readUInt32LE(568);
              const signalQuality = cb.readUInt32LE(576);
              const rxRateKbps = cb.readUInt32LE(580);
              const txRateKbps = cb.readUInt32LE(584);
              const securityEnabled = cb.readInt32LE(588) !== 0;
              const authAlgo = cb.readUInt32LE(596);
              const cipherAlgo = cb.readUInt32LE(600);

              console.log('\n  Current Connection:');
              console.log(`    Profile name:    ${profileName || '(none)'}`);
              console.log(`    SSID:            ${ssid}`);
              console.log(`    BSSID (MAC):     ${bssid}`);
              console.log(`    BSS type:        ${lookup(bssNames, bssType)}`);
              console.log(`    PHY type:        ${lookup(phyNames, phyType)}`);
              console.log(`    Signal quality:  ${signalQuality}%`);
              console.log(`    Receive rate:    ${(rxRateKbps / 1000).toFixed(1)} Mbps`);
              console.log(`    Transmit rate:   ${(txRateKbps / 1000).toFixed(1)} Mbps`);
              console.log(`    Security:        ${securityEnabled ? 'Enabled' : 'Open (no security)'}`);
              console.log(`    Authentication:  ${lookup(authNames, authAlgo)}`);
              console.log(`    Cipher:          ${lookup(cipherNames, cipherAlgo)}`);
              console.log(`    Connection mode: ${lookup(connectionModeNames, connectionMode)}`);
            } finally {
              Wlanapi.WlanFreeMemory(connPtr);
            }
          }
        } else {
          console.log(`\n  Connection query failed (error ${connStatus}).`);
        }
      }

      const netListPtrBuf = Buffer.alloc(8);
      const netStatus = Wlanapi.WlanGetAvailableNetworkList(clientHandle, ifPtr, 0, null, netListPtrBuf.ptr);

      if (netStatus !== 0) {
        console.log(`\n  Available network scan failed (error ${netStatus}).\n`);
        continue;
      }

      const netListPtr = read.ptr(netListPtrBuf.ptr) as Pointer;

      if (!netListPtr) {
        console.log('\n  No visible networks.\n');
        continue;
      }

      try {
        const netHeaderBuf = Buffer.from(toArrayBuffer(netListPtr, 0, 8));
        const netCount = netHeaderBuf.readUInt32LE(0);

        console.log(`\n  Available Networks (${netCount} total):`);

        for (let n = 0; n < netCount; n++) {
          const netPtr = (Number(netListPtr) + 8 + n * NETWORK_ENTRY_SIZE) as Pointer;
          const nb = Buffer.from(toArrayBuffer(netPtr, 0, NETWORK_ENTRY_SIZE));

          const profileName = readWideString(nb, 0, 256);
          const ssid = readSsid(nb, 512);
          const bssType = nb.readUInt32LE(548);
          const numberOfBssids = nb.readUInt32LE(552);
          const connectable = nb.readInt32LE(556) !== 0;
          const reasonCode = nb.readUInt32LE(560);
          const phyTypes = nb.readUInt32LE(564);
          const defaultPhyType = nb.readUInt32LE(568);
          const signal = nb.readUInt32LE(604);
          const securityEnabled = nb.readInt32LE(608) !== 0;
          const defaultAuthAlgo = nb.readUInt32LE(612);
          const defaultCipherAlgo = nb.readUInt32LE(616);
          const flags = nb.readUInt32LE(620);
          const isConnected = (flags & CONNECTED_FLAG) !== 0;
          const hasProfile = (flags & HAS_PROFILE_FLAG) !== 0;

          const connectedTag = isConnected ? ' [CONNECTED]' : '';

          console.log(`\n    ${n + 1}. ${ssid}${connectedTag}`);
          console.log(`       Signal:        ${signal}%`);
          console.log(`       Security:      ${securityEnabled ? 'Yes' : 'No (open)'}`);
          console.log(`       Auth:          ${lookup(authNames, defaultAuthAlgo)}`);
          console.log(`       Cipher:        ${lookup(cipherNames, defaultCipherAlgo)}`);
          console.log(`       BSS type:      ${lookup(bssNames, bssType)}`);
          console.log(`       PHY type:      ${lookup(phyNames, defaultPhyType)}`);
          console.log(`       PHY types:     ${phyTypes}`);
          console.log(`       BSSIDs seen:   ${numberOfBssids}`);
          console.log(`       Connectable:   ${connectable ? 'Yes' : 'No'}`);
          if (!connectable) {
            console.log(`       Reason:        ${decodeReasonCode(reasonCode)}`);
          }
          console.log(`       Has profile:   ${hasProfile ? 'Yes' : 'No'}`);
          if (hasProfile && profileName) {
            console.log(`       Profile name:  ${profileName}`);
          }
        }
      } finally {
        Wlanapi.WlanFreeMemory(netListPtr);
      }

      console.log();
    }
  } finally {
    Wlanapi.WlanFreeMemory(ifListPtr);
  }
} finally {
  Wlanapi.WlanCloseHandle(clientHandle, null);
}

console.log('Diagnostic complete.');
