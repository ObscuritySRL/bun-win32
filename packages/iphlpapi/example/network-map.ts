/**
 * ASCII network topology visualization.
 *
 * Uses GetAdaptersInfo to enumerate all network adapters, then draws an ASCII
 * tree showing gateways as root nodes with adapters as children. Each adapter
 * shows its IP address, MAC address, and DHCP configuration.
 *
 * APIs demonstrated:
 *   - GetAdaptersInfo (two-call pattern: sizing then retrieval)
 *
 * IP_ADAPTER_INFO struct offsets (x64):
 *   +0x000: Next pointer (8 bytes)
 *   +0x00C: AdapterName (char[260])
 *   +0x110: Description (char[132])
 *   +0x194: AddressLength (UINT)
 *   +0x198: Address (BYTE[8]) - MAC
 *   +0x1A4: Type (UINT)
 *   +0x1A8: DhcpEnabled (UINT)
 *   +0x1B0: CurrentIpAddress ptr (8 bytes)
 *   +0x1B8: IpAddressList.IpAddress (char[16])
 *   +0x1C8: IpAddressList.IpMask (char[16])
 *   +0x1E8: IpAddressList.Next (ptr)
 *   +0x1F0: GatewayList.IpAddress (char[16])
 *   +0x200: GatewayList.IpMask (char[16])
 *   +0x220: GatewayList.Next (ptr)
 *   +0x228: DhcpServer.IpAddress (char[16])
 *
 * Run: bun run example/network-map.ts
 */

import Iphlpapi from '../index';

const adapterTypeNames = new Map<number, string>([
  [6, 'Ethernet'],
  [71, 'WiFi'],
  [24, 'Loopback'],
  [131, 'Tunnel'],
  [144, 'Virtual'],
]);

const adapterTypeIcons = new Map<number, string>([
  [6, '\uD83D\uDDA5\uFE0F'],   // desktop computer
  [71, '\uD83D\uDCF6'],         // antenna bars
  [24, '\uD83D\uDD04'],         // counterclockwise arrows
  [131, '\uD83D\uDD73\uFE0F'], // hole
]);

interface AdapterInfo {
  name: string;
  description: string;
  mac: string;
  type: number;
  dhcpEnabled: boolean;
  ipAddress: string;
  gateway: string;
  dhcpServer: string;
}

function readCString(buf: Buffer, offset: number, maxLen: number): string {
  return buf.toString('ascii', offset, offset + maxLen).replace(/\0.*$/, '');
}

function formatMac(buf: Buffer, offset: number, len: number): string {
  return Array.from(buf.subarray(offset, offset + len), (b) => b.toString(16).padStart(2, '0')).join(':');
}

console.log('\n\x1b[1;36m  Network Topology Map\x1b[0m\n');

const sizeBuf = Buffer.alloc(4);
sizeBuf.writeUInt32LE(0, 0);

let err = Iphlpapi.GetAdaptersInfo(null, sizeBuf.ptr);

if (err !== 111 && err !== 0) {
  console.error(`GetAdaptersInfo sizing call failed (error ${err}).`);
  process.exit(1);
}

if (err === 0) {
  console.log('  No network adapters found.');
  process.exit(0);
}

const bufSize = sizeBuf.readUInt32LE(0);
const infoBuf = Buffer.alloc(bufSize);
sizeBuf.writeUInt32LE(bufSize, 0);

err = Iphlpapi.GetAdaptersInfo(infoBuf.ptr, sizeBuf.ptr);

if (err !== 0) {
  console.error(`GetAdaptersInfo failed (error ${err}).`);
  process.exit(1);
}

const adapters: AdapterInfo[] = [];
let offset = 0;

while (true) {
  const nextPtr = Number(infoBuf.readBigUInt64LE(offset));
  const name = readCString(infoBuf, offset + 0x00c, 260);
  const description = readCString(infoBuf, offset + 0x110, 132);
  const addrLen = infoBuf.readUInt32LE(offset + 0x194);
  const mac = formatMac(infoBuf, offset + 0x198, addrLen);
  const adapterType = infoBuf.readUInt32LE(offset + 0x1a4);
  const dhcpEnabled = infoBuf.readUInt32LE(offset + 0x1a8) !== 0;
  const ipAddress = readCString(infoBuf, offset + 0x1b8, 16);
  const gateway = readCString(infoBuf, offset + 0x1f0, 16);
  const dhcpServer = readCString(infoBuf, offset + 0x228, 16);

  adapters.push({ name, description, mac, type: adapterType, dhcpEnabled, ipAddress, gateway, dhcpServer });

  if (nextPtr === 0) break;
  offset = nextPtr - Number(infoBuf.ptr);
}

const gatewayGroups = new Map<string, AdapterInfo[]>();
for (const adapter of adapters) {
  const gw = adapter.gateway || '(no gateway)';
  if (!gatewayGroups.has(gw)) gatewayGroups.set(gw, []);
  gatewayGroups.get(gw)!.push(adapter);
}

const gatewayList = Array.from(gatewayGroups.entries());

for (let gi = 0; gi < gatewayList.length; gi++) {
  const [gateway, group] = gatewayList[gi];
  const isLastGateway = gi === gatewayList.length - 1;
  const gatewayPrefix = isLastGateway ? '\u2514' : '\u251C';

  if (gateway !== '(no gateway)') {
    console.log(`  \uD83C\uDF10 Gateway (${gateway})`);
  } else {
    console.log(`  \uD83C\uDF10 No Gateway`);
  }

  for (let ai = 0; ai < group.length; ai++) {
    const adapter = group[ai];
    const isLast = ai === group.length - 1;
    const branch = isLast ? '\u2514' : '\u251C';
    const cont = isLast ? ' ' : '\u2502';
    const typeLabel = adapterTypeNames.get(adapter.type) ?? `Type ${adapter.type}`;
    const icon = adapterTypeIcons.get(adapter.type) ?? '\uD83D\uDD0C';

    console.log(`  ${branch}\u2500\u2500 ${icon} ${typeLabel}: ${adapter.description}`);
    console.log(`  ${cont}   IP:   ${adapter.ipAddress || '(none)'}`);
    console.log(`  ${cont}   MAC:  ${adapter.mac}`);

    if (adapter.dhcpEnabled) {
      console.log(`  ${cont}   DHCP: enabled via ${adapter.dhcpServer || '(unknown)'}`);
    } else {
      console.log(`  ${cont}   DHCP: disabled (static IP)`);
    }

    if (!isLast) console.log(`  ${cont}`);
  }

  if (!isLastGateway) console.log();
}

console.log(`\n  Total adapters: ${adapters.length}`);
