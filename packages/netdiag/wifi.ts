import { type Pointer, toArrayBuffer } from 'bun:ffi';

import { macFromBytes } from './addr';
import { readWideAt, Win32Error, Wlanapi } from './win32';

const WLAN_API_VERSION_2_0 = 0x0000_0002;
const WLAN_INTF_OPCODE_CURRENT_CONNECTION = 0x0000_0007;
const WLAN_CONNECTION_MODE_PROFILE = 0x0000_0000;
const DOT11_BSS_TYPE_INFRASTRUCTURE = 0x0000_0001;
const INTERFACE_ENTRY_SIZE = 532; // WLAN_INTERFACE_INFO
const NETWORK_ENTRY_SIZE = 628; // WLAN_AVAILABLE_NETWORK
const LIST_HEADER_SIZE = 8; // dwNumberOfItems + dwIndex
const CONNECTED_FLAG = 0x0000_0001;
const HAS_PROFILE_FLAG = 0x0000_0002;
const ERROR_ACCESS_DENIED = 5;
const SCAN_SETTLE_MS = 4000; // WlanScan may flush the cached list; MSDN-sanctioned settle window

const INTERFACE_STATE_NAMES: ReadonlyMap<number, string> = new Map([
  [0, 'not-ready'],
  [1, 'connected'],
  [2, 'ad-hoc'],
  [3, 'disconnecting'],
  [4, 'disconnected'],
  [5, 'associating'],
  [6, 'discovering'],
  [7, 'authenticating'],
]);

const AUTH_NAMES: ReadonlyMap<number, string> = new Map([
  [1, 'open'],
  [2, 'shared-key'],
  [3, 'wpa'],
  [4, 'wpa-psk'],
  [5, 'wpa-none'],
  [6, 'wpa2'],
  [7, 'wpa2-psk'],
  [8, 'wpa3'],
  [9, 'wpa3-sae'],
  [10, 'owe'],
  [11, 'wpa3-enterprise'],
]);

const CIPHER_NAMES: ReadonlyMap<number, string> = new Map([
  [0, 'none'],
  [1, 'wep-40'],
  [2, 'tkip'],
  [4, 'ccmp-aes'],
  [5, 'wep-104'],
  [6, 'bip'],
  [8, 'gcmp'],
  [0x100, 'wpa-use-group'],
  [0x101, 'wep'],
]);

const PHY_NAMES: ReadonlyMap<number, string> = new Map([
  [1, 'fhss'],
  [2, 'dsss'],
  [3, 'ir-baseband'],
  [4, 'ofdm-a'],
  [5, 'hr-dsss-b'],
  [6, 'erp-g'],
  [7, 'ht-n'],
  [8, 'vht-ac'],
  [9, 'dmg-ad'],
  [10, 'he-ax'],
  [11, 'eht-be'],
]);

export interface WifiInterface {
  guid: string;
  description: string;
  state: string;
}

export interface WifiNetwork {
  ssid: string;
  bssCount: number;
  signalQuality: number;
  secured: boolean;
  authAlgorithm: string;
  cipherAlgorithm: string;
  connectable: boolean;
  connected: boolean;
  hasProfile: boolean;
}

export interface WifiConnection {
  profileName: string;
  ssid: string;
  bssid: string;
  phyType: string;
  signalQuality: number;
  rxRateMbps: number;
  txRateMbps: number;
  secured: boolean;
  authAlgorithm: string;
  cipherAlgorithm: string;
}

export interface WifiScanOptions {
  triggerScan?: boolean;
}

export interface WifiConnectOptions {
  beta: boolean;
}

export interface WifiConnectResult {
  ok: boolean;
  reasonCode: number;
  reason: string;
}

interface RawInterface {
  guid: string;
  description: string;
  state: number;
  pointer: Pointer;
}

let clientHandle = 0n;
function handle(): bigint {
  if (clientHandle === 0n) {
    const negotiated = Buffer.allocUnsafeSlow(4);
    const handleBuffer = Buffer.allocUnsafeSlow(8);
    const status = Wlanapi.WlanOpenHandle(WLAN_API_VERSION_2_0, null, negotiated.ptr, handleBuffer.ptr);
    if (status !== 0) throw new Win32Error(status);
    clientHandle = handleBuffer.readBigUInt64LE(0);
  }
  return clientHandle;
}

function formatGuid(buffer: Buffer, offset: number): string {
  const part1 = buffer.readUInt32LE(offset).toString(16).padStart(8, '0');
  const part2 = buffer
    .readUInt16LE(offset + 4)
    .toString(16)
    .padStart(4, '0');
  const part3 = buffer
    .readUInt16LE(offset + 6)
    .toString(16)
    .padStart(4, '0');
  const part4 = macFromBytes(buffer, offset + 8, 2).replaceAll(':', '');
  const part5 = macFromBytes(buffer, offset + 10, 6).replaceAll(':', '');
  return `{${part1}-${part2}-${part3}-${part4}-${part5}}`;
}

// DOT11_SSID: uLength (ULONG) then ucSSID[32]; SSID bytes are raw UTF-8 (Unicode/emoji-proof — a node-wifi failure mode).
function readSsid(buffer: Buffer, offset: number): string {
  const length = buffer.readUInt32LE(offset);
  return buffer.toString('utf8', offset + 4, offset + 4 + Math.min(length, 32));
}

// Returns the (caller-must-free) interface list pointer plus decoded entries whose `pointer` doubles as pInterfaceGuid (GUID@0 trick).
function enumerateInterfaces(): { listPointer: number; interfaces: RawInterface[] } {
  const listPointerBuffer = Buffer.allocUnsafeSlow(8);
  if (Wlanapi.WlanEnumInterfaces(handle(), null, listPointerBuffer.ptr) !== 0) return { listPointer: 0, interfaces: [] };
  const listPointer = Number(listPointerBuffer.readBigUInt64LE(0));
  if (listPointer === 0) return { listPointer: 0, interfaces: [] };
  const count = Buffer.from(toArrayBuffer(listPointer as Pointer, 0, LIST_HEADER_SIZE)).readUInt32LE(0);
  const interfaces: RawInterface[] = [];
  for (let index = 0; index < count; index++) {
    const pointer = (listPointer + LIST_HEADER_SIZE + index * INTERFACE_ENTRY_SIZE) as Pointer;
    const entry = Buffer.from(toArrayBuffer(pointer, 0, INTERFACE_ENTRY_SIZE));
    interfaces.push({ guid: formatGuid(entry, 0), description: readWideAt(entry, 16), state: entry.readUInt32LE(528), pointer });
  }
  return { listPointer, interfaces };
}

function selectInterface(interfaces: RawInterface[], interfaceGuid?: string): RawInterface | undefined {
  if (interfaceGuid) return interfaces.find((candidate) => candidate.guid === interfaceGuid);
  return interfaces.find((candidate) => candidate.state === 1) ?? interfaces[0];
}

/** Wireless interfaces (empty on Ethernet-only hosts — never throws). */
export function wifiInterfaces(): WifiInterface[] {
  const { listPointer, interfaces } = enumerateInterfaces();
  try {
    return interfaces.map((candidate) => ({ guid: candidate.guid, description: candidate.description, state: INTERFACE_STATE_NAMES.get(candidate.state) ?? 'unknown' }));
  } finally {
    if (listPointer !== 0) Wlanapi.WlanFreeMemory(listPointer as Pointer);
  }
}

/**
 * Visible networks from wlanapi structs — locale-proof, Unicode/emoji-SSID-proof.
 * `triggerScan` (default false) chooses the OS-cached list (instant) vs a FRESH scan
 * (WlanScan → ~4 s settle → list; WlanScan may flush the prior list).
 */
export async function wifiScan(options: WifiScanOptions = {}): Promise<WifiNetwork[]> {
  const { listPointer, interfaces } = enumerateInterfaces();
  const networks: WifiNetwork[] = [];
  try {
    for (const iface of interfaces) {
      if (options.triggerScan) {
        Wlanapi.WlanScan(handle(), iface.pointer, null, null, null);
        await Bun.sleep(SCAN_SETTLE_MS);
      }
      const networkListBuffer = Buffer.allocUnsafeSlow(8);
      const status = Wlanapi.WlanGetAvailableNetworkList(handle(), iface.pointer, 0, null, networkListBuffer.ptr);
      if (status === ERROR_ACCESS_DENIED) throw new Error('WiFi scan denied (ERROR_ACCESS_DENIED) — Windows precise-location consent is required (Settings → Privacy → Location). This is an OS gate, not a netdiag bug.');
      if (status !== 0) continue;
      const networkListPointer = Number(networkListBuffer.readBigUInt64LE(0));
      if (networkListPointer === 0) continue;
      try {
        const networkCount = Buffer.from(toArrayBuffer(networkListPointer as Pointer, 0, LIST_HEADER_SIZE)).readUInt32LE(0);
        for (let index = 0; index < networkCount; index++) {
          const entry = Buffer.from(toArrayBuffer((networkListPointer + LIST_HEADER_SIZE + index * NETWORK_ENTRY_SIZE) as Pointer, 0, NETWORK_ENTRY_SIZE));
          const flags = entry.readUInt32LE(620);
          networks.push({
            ssid: readSsid(entry, 512),
            bssCount: entry.readUInt32LE(552),
            signalQuality: entry.readUInt32LE(604),
            secured: entry.readInt32LE(608) !== 0,
            authAlgorithm: AUTH_NAMES.get(entry.readUInt32LE(612)) ?? `auth(${entry.readUInt32LE(612)})`,
            cipherAlgorithm: CIPHER_NAMES.get(entry.readUInt32LE(616)) ?? `cipher(${entry.readUInt32LE(616)})`,
            connectable: entry.readInt32LE(556) !== 0,
            connected: (flags & CONNECTED_FLAG) !== 0,
            hasProfile: (flags & HAS_PROFILE_FLAG) !== 0,
          });
        }
      } finally {
        Wlanapi.WlanFreeMemory(networkListPointer as Pointer);
      }
    }
  } finally {
    if (listPointer !== 0) Wlanapi.WlanFreeMemory(listPointer as Pointer);
  }
  return networks;
}

/** The current connection (signal/rate/BSSID/auth) via WlanQueryInterface — null if not connected / no WiFi. */
export function wifiConnection(interfaceGuid?: string): WifiConnection | null {
  const { listPointer, interfaces } = enumerateInterfaces();
  try {
    const target = selectInterface(interfaces, interfaceGuid);
    if (target === undefined) return null;
    const sizeBuffer = Buffer.allocUnsafeSlow(4);
    const dataPointerBuffer = Buffer.allocUnsafeSlow(8);
    if (Wlanapi.WlanQueryInterface(handle(), target.pointer, WLAN_INTF_OPCODE_CURRENT_CONNECTION, null, sizeBuffer.ptr, dataPointerBuffer.ptr, null) !== 0) return null;
    const dataPointer = Number(dataPointerBuffer.readBigUInt64LE(0));
    if (dataPointer === 0) return null;
    try {
      const attributes = Buffer.from(toArrayBuffer(dataPointer as Pointer, 0, sizeBuffer.readUInt32LE(0)));
      return {
        profileName: readWideAt(attributes, 8),
        ssid: readSsid(attributes, 520),
        bssid: macFromBytes(attributes, 560, 6),
        phyType: PHY_NAMES.get(attributes.readUInt32LE(568)) ?? 'unknown',
        signalQuality: attributes.readUInt32LE(576),
        rxRateMbps: attributes.readUInt32LE(580) / 1000,
        txRateMbps: attributes.readUInt32LE(584) / 1000,
        secured: attributes.readInt32LE(588) !== 0,
        authAlgorithm: AUTH_NAMES.get(attributes.readUInt32LE(596)) ?? 'unknown',
        cipherAlgorithm: CIPHER_NAMES.get(attributes.readUInt32LE(600)) ?? 'unknown',
      };
    } finally {
      Wlanapi.WlanFreeMemory(dataPointer as Pointer);
    }
  } finally {
    if (listPointer !== 0) Wlanapi.WlanFreeMemory(listPointer as Pointer);
  }
}

function reasonCodeToString(reasonCode: number): string {
  const buffer = Buffer.allocUnsafeSlow(0x0400);
  return Wlanapi.WlanReasonCodeToString(reasonCode, 0x0200, buffer.ptr, null) === 0 ? readWideAt(buffer, 0) : `reason code ${reasonCode}`;
}

/**
 * BETA — connect to a saved profile via WlanConnect. Signature-correct but
 * UNEXERCISED against a live AP; pass { beta: true } to acknowledge. Verify the
 * result by polling wifiConnection(), never by callback.
 */
export function wifiConnect(profileName: string, interfaceGuid: string | undefined, options: WifiConnectOptions): WifiConnectResult {
  if (!options?.beta) throw new Error('wifiConnect is a BETA capability, unexercised against a live AP — pass { beta: true } to acknowledge.');
  const { listPointer, interfaces } = enumerateInterfaces();
  try {
    const target = selectInterface(interfaces, interfaceGuid);
    if (target === undefined) return { ok: false, reasonCode: 0, reason: 'no WiFi interface' };
    const profile = Buffer.allocUnsafeSlow((profileName.length + 1) * 2);
    profile.writeUInt16LE(0, profile.write(profileName, 'utf16le'));
    const parameters = Buffer.allocUnsafeSlow(40); // WLAN_CONNECTION_PARAMETERS (x64)
    parameters.fill(0);
    parameters.writeUInt32LE(WLAN_CONNECTION_MODE_PROFILE, 0);
    parameters.writeBigUInt64LE(BigInt(Number(profile.ptr)), 8); // strProfile
    parameters.writeUInt32LE(DOT11_BSS_TYPE_INFRASTRUCTURE, 32);
    const status = Wlanapi.WlanConnect(handle(), target.pointer, parameters.ptr, null);
    return { ok: status === 0, reasonCode: status, reason: reasonCodeToString(status) };
  } finally {
    if (listPointer !== 0) Wlanapi.WlanFreeMemory(listPointer as Pointer);
  }
}

/** BETA — disconnect the interface via WlanDisconnect. Pass { beta: true } to acknowledge. */
export function wifiDisconnect(interfaceGuid: string | undefined, options: WifiConnectOptions): WifiConnectResult {
  if (!options?.beta) throw new Error('wifiDisconnect is a BETA capability — pass { beta: true } to acknowledge.');
  const { listPointer, interfaces } = enumerateInterfaces();
  try {
    const target = selectInterface(interfaces, interfaceGuid);
    if (target === undefined) return { ok: false, reasonCode: 0, reason: 'no WiFi interface' };
    const status = Wlanapi.WlanDisconnect(handle(), target.pointer, null);
    return { ok: status === 0, reasonCode: status, reason: reasonCodeToString(status) };
  } finally {
    if (listPointer !== 0) Wlanapi.WlanFreeMemory(listPointer as Pointer);
  }
}
