/**
 * Live WiFi signal strength monitor with ASCII visualization.
 *
 * Refreshes every 2 seconds for 15 iterations, showing a real-time dashboard
 * of all visible wireless networks with animated signal bars. The currently
 * connected network is highlighted with a marker.
 *
 * APIs demonstrated:
 *   - WlanOpenHandle / WlanCloseHandle (session lifecycle)
 *   - WlanEnumInterfaces (discover wireless adapters)
 *   - WlanGetAvailableNetworkList (scan visible networks)
 *   - WlanQueryInterface (get current connection info)
 *   - WlanFreeMemory (release native buffers)
 *
 * Run: bun run example/signal-monitor.ts
 */

import { type Pointer, read, toArrayBuffer } from 'bun:ffi';

import Wlanapi, { WLAN_API_VERSION_2_0, WlanIntfOpcode } from '../index';

const NETWORK_ENTRY_SIZE = 628;
const INTERFACE_ENTRY_SIZE = 532;
const CONNECTED_FLAG = 0x0000_0001;
const ITERATIONS = 15;
const INTERVAL_MS = 2000;
const BAR_WIDTH = 20;

const authNames = new Map<number, string>([
  [0x01, 'Open'],
  [0x02, 'Shared'],
  [0x03, 'WPA-Ent'],
  [0x04, 'WPA-PSK'],
  [0x06, 'WPA2-Ent'],
  [0x07, 'WPA2-PSK'],
  [0x08, 'WPA3-192'],
  [0x09, 'WPA3-SAE'],
  [0x0a, 'OWE'],
  [0x0b, 'WPA3-Ent'],
]);

function readSsid(buf: Buffer, offset: number): string {
  const len = buf.readUInt32LE(offset);
  if (len === 0) return '<hidden>';
  return Buffer.from(buf.subarray(offset + 4, offset + 4 + len)).toString('utf8');
}

function signalBar(quality: number): string {
  const filled = Math.round((quality / 100) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
}

function signalColor(quality: number): string {
  if (quality >= 75) return '\x1b[32m'; // green
  if (quality >= 50) return '\x1b[33m'; // yellow
  if (quality >= 25) return '\x1b[91m'; // light red
  return '\x1b[31m'; // red
}

const negotiatedVersionBuf = Buffer.alloc(4);
const clientHandleBuf = Buffer.alloc(8);
const openStatus = Wlanapi.WlanOpenHandle(WLAN_API_VERSION_2_0, null, negotiatedVersionBuf.ptr, clientHandleBuf.ptr);

if (openStatus !== 0) {
  console.error(`WlanOpenHandle failed with status ${openStatus}.`);
  process.exit(1);
}

const clientHandle = clientHandleBuf.readBigUInt64LE(0);

try {
  for (let iteration = 0; iteration < ITERATIONS; iteration++) {
    process.stdout.write('\x1b[2J\x1b[H');

    console.log('\x1b[1;36m  WiFi Signal Monitor\x1b[0m');
    console.log(`  Refresh ${iteration + 1}/${ITERATIONS}    ${new Date().toLocaleTimeString()}`);
    console.log();

    const interfaceListPtrBuf = Buffer.alloc(8);
    const enumStatus = Wlanapi.WlanEnumInterfaces(clientHandle, null, interfaceListPtrBuf.ptr);

    if (enumStatus !== 0) {
      console.error(`  WlanEnumInterfaces failed with status ${enumStatus}.`);
      break;
    }

    const interfaceListPtr = read.ptr(interfaceListPtrBuf.ptr) as Pointer;

    if (!interfaceListPtr) {
      console.log('  No wireless interfaces found.');
      break;
    }

    try {
      const headerBuf = Buffer.from(toArrayBuffer(interfaceListPtr, 0, 8));
      const interfaceCount = headerBuf.readUInt32LE(0);

      for (let iIdx = 0; iIdx < interfaceCount; iIdx++) {
        const ifPtr = (Number(interfaceListPtr) + 8 + iIdx * INTERFACE_ENTRY_SIZE) as Pointer;
        const ifBuf = Buffer.from(toArrayBuffer(ifPtr, 0, INTERFACE_ENTRY_SIZE));
        const ifDescription = ifBuf.toString('utf16le', 16, 16 + 256 * 2).replace(/\0.*$/, '');

        console.log(`  \x1b[1m${ifDescription}\x1b[0m`);

        let connectedSsid = '';
        const connSizeBuf = Buffer.alloc(4);
        const connPtrBuf = Buffer.alloc(8);
        const connStatus = Wlanapi.WlanQueryInterface(clientHandle, ifPtr, WlanIntfOpcode.WLAN_INTF_OPCODE_CURRENT_CONNECTION, null, connSizeBuf.ptr, connPtrBuf.ptr, null);

        if (connStatus === 0) {
          const connPtr = read.ptr(connPtrBuf.ptr) as Pointer;
          if (connPtr) {
            try {
              const connSize = connSizeBuf.readUInt32LE(0);
              const connBuf = Buffer.from(toArrayBuffer(connPtr, 0, connSize));
              connectedSsid = readSsid(connBuf, 520);
            } finally {
              Wlanapi.WlanFreeMemory(connPtr);
            }
          }
        }

        const netListPtrBuf = Buffer.alloc(8);
        const netStatus = Wlanapi.WlanGetAvailableNetworkList(clientHandle, ifPtr, 0, null, netListPtrBuf.ptr);

        if (netStatus !== 0) {
          console.log(`  Network scan failed (status ${netStatus}).`);
          continue;
        }

        const netListPtr = read.ptr(netListPtrBuf.ptr) as Pointer;

        if (!netListPtr) {
          console.log('  No networks visible.');
          continue;
        }

        try {
          const netHeaderBuf = Buffer.from(toArrayBuffer(netListPtr, 0, 8));
          const networkCount = netHeaderBuf.readUInt32LE(0);

          console.log(`  ${'SSID'.padEnd(28)} ${'Signal'.padEnd(BAR_WIDTH + 6)} Auth`);
          console.log(`  ${''.padEnd(28, '-')} ${''.padEnd(BAR_WIDTH + 6, '-')} ${''.padEnd(10, '-')}`);

          for (let nIdx = 0; nIdx < networkCount; nIdx++) {
            const netPtr = (Number(netListPtr) + 8 + nIdx * NETWORK_ENTRY_SIZE) as Pointer;
            const netBuf = Buffer.from(toArrayBuffer(netPtr, 0, NETWORK_ENTRY_SIZE));
            const ssid = readSsid(netBuf, 512);
            const signal = netBuf.readUInt32LE(604);
            const authAlgo = netBuf.readUInt32LE(612);
            const flags = netBuf.readUInt32LE(620);
            const isConnected = (flags & CONNECTED_FLAG) !== 0;

            const marker = isConnected ? '\x1b[1;32m>\x1b[0m ' : '  ';
            const color = signalColor(signal);
            const bar = signalBar(signal);
            const pct = `${signal}%`.padStart(4);
            const authLabel = authNames.get(authAlgo) ?? `0x${authAlgo.toString(16)}`;

            const ssidDisplay = (ssid === connectedSsid && isConnected ? `\x1b[1m${ssid}\x1b[0m` : ssid).padEnd(isConnected ? 28 + 8 : 28);

            console.log(`${marker}${ssidDisplay} ${color}${bar}\x1b[0m ${pct} ${authLabel}`);
          }
        } finally {
          Wlanapi.WlanFreeMemory(netListPtr);
        }

        console.log();
      }
    } finally {
      Wlanapi.WlanFreeMemory(interfaceListPtr);
    }

    console.log('\x1b[2m  Press Ctrl+C to stop early\x1b[0m');

    if (iteration < ITERATIONS - 1) {
      await Bun.sleep(INTERVAL_MS);
    }
  }
} finally {
  Wlanapi.WlanCloseHandle(clientHandle, null);
}
