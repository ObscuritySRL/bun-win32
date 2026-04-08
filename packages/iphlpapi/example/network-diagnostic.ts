/**
 * Complete network configuration diagnostic.
 *
 * Dumps all network parameters, adapter info, active TCP connections, and the
 * IP routing table. Decodes TCP states, formats addresses, and parses linked
 * list structures from the Win32 IP Helper API.
 *
 * APIs demonstrated:
 *   - GetNetworkParams (hostname, domain, DNS servers)
 *   - GetAdaptersInfo (adapters, IPs, gateways, MAC, DHCP, leases)
 *   - GetTcpTable (active TCP connections with state)
 *   - GetIpForwardTable (IP routing table)
 *
 * Run: bun run example/network-diagnostic.ts
 */

import { type Pointer, read, toArrayBuffer } from 'bun:ffi';

import Iphlpapi from '../index';

const ERROR_BUFFER_OVERFLOW = 111;

const tcpStateNames = new Map<number, string>([
  [1, 'CLOSED'],
  [2, 'LISTEN'],
  [3, 'SYN_SENT'],
  [4, 'SYN_RCVD'],
  [5, 'ESTABLISHED'],
  [6, 'FIN_WAIT1'],
  [7, 'FIN_WAIT2'],
  [8, 'CLOSE_WAIT'],
  [9, 'CLOSING'],
  [10, 'LAST_ACK'],
  [11, 'TIME_WAIT'],
  [12, 'DELETE_TCB'],
]);

function readCString(buf: Buffer, offset: number, maxLen: number): string {
  return buf.toString('ascii', offset, offset + maxLen).replace(/\0.*$/, '');
}

function formatMac(buf: Buffer, offset: number, len: number): string {
  return Array.from(buf.subarray(offset, offset + len), (b) => b.toString(16).padStart(2, '0')).join(':');
}

function formatIpFromU32(val: number): string {
  return `${val & 0xff}.${(val >>> 8) & 0xff}.${(val >>> 16) & 0xff}.${(val >>> 24) & 0xff}`;
}

function formatPort(networkOrderPort: number): number {
  return ((networkOrderPort & 0xff) << 8) | ((networkOrderPort >>> 8) & 0xff);
}

console.log('=== Network Diagnostic Report ===');
console.log(`Timestamp: ${new Date().toISOString()}\n`);

// --- Section 1: Network Parameters ---
console.log('--- Network Parameters ---');
{
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(0, 0);
  let err = Iphlpapi.GetNetworkParams(null, sizeBuf.ptr);

  if (err === ERROR_BUFFER_OVERFLOW) {
    const size = sizeBuf.readUInt32LE(0);
    const paramsBuf = Buffer.alloc(size);
    err = Iphlpapi.GetNetworkParams(paramsBuf.ptr, sizeBuf.ptr);

    if (err === 0) {
      // FIXED_INFO struct (x64):
      //   +0x000: HostName (char[132])
      //   +0x084: DomainName (char[132])
      //   +0x108: CurrentDnsServer (pointer, 8 bytes)
      //   +0x110: DnsServerList.Next (pointer, 8 bytes)
      //   +0x118: DnsServerList.IpAddress.String (char[16])
      const hostname = readCString(paramsBuf, 0, 132);
      const domain = readCString(paramsBuf, 0x084, 132);
      console.log(`  Hostname:    ${hostname}`);
      console.log(`  Domain:      ${domain || '(none)'}`);

      // DNS server list - first entry is inline at offset 0x118
      const firstDns = readCString(paramsBuf, 0x118, 16);
      const dnsServers: string[] = [];
      if (firstDns) dnsServers.push(firstDns);

      // Follow the linked list via Next pointer at offset 0x110
      let nextDnsPtr = Number(paramsBuf.readBigUInt64LE(0x110));
      while (nextDnsPtr !== 0) {
        // IP_ADDR_STRING: Next(8 bytes), IpAddress.String(char[16])
        const dnsBuf = Buffer.from(toArrayBuffer(nextDnsPtr as Pointer, 0, 48));
        const ip = readCString(dnsBuf, 8, 16);
        if (ip) dnsServers.push(ip);
        nextDnsPtr = Number(dnsBuf.readBigUInt64LE(0));
      }

      console.log(`  DNS servers: ${dnsServers.length > 0 ? dnsServers.join(', ') : '(none)'}`);
    } else {
      console.log(`  GetNetworkParams failed (error ${err}).`);
    }
  } else {
    console.log(`  GetNetworkParams sizing failed (error ${err}).`);
  }
}

// --- Section 2: Adapter Info ---
console.log('\n--- Network Adapters ---');
{
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(0, 0);
  let err = Iphlpapi.GetAdaptersInfo(null, sizeBuf.ptr);

  if (err === ERROR_BUFFER_OVERFLOW) {
    const size = sizeBuf.readUInt32LE(0);
    const infoBuf = Buffer.alloc(size);
    sizeBuf.writeUInt32LE(size, 0);
    err = Iphlpapi.GetAdaptersInfo(infoBuf.ptr, sizeBuf.ptr);

    if (err === 0) {
      let offset = 0;
      let idx = 0;

      while (true) {
        const nextPtr = Number(infoBuf.readBigUInt64LE(offset));
        const name = readCString(infoBuf, offset + 0x00c, 260);
        const desc = readCString(infoBuf, offset + 0x110, 132);
        const addrLen = infoBuf.readUInt32LE(offset + 0x194);
        const mac = formatMac(infoBuf, offset + 0x198, addrLen);
        const adapterType = infoBuf.readUInt32LE(offset + 0x1a4);
        const dhcpEnabled = infoBuf.readUInt32LE(offset + 0x1a8) !== 0;
        const ip = readCString(infoBuf, offset + 0x1b8, 16);
        const mask = readCString(infoBuf, offset + 0x1c8, 16);
        const gateway = readCString(infoBuf, offset + 0x1f0, 16);
        const dhcpServer = readCString(infoBuf, offset + 0x228, 16);

        // Lease times at offset +0x238 (ObtainTime) and +0x240 (LeaseExpires) are time_t
        const leaseObtained = infoBuf.readUInt32LE(offset + 0x238);
        const leaseExpires = infoBuf.readUInt32LE(offset + 0x23c);

        console.log(`\n  Adapter ${idx + 1}:`);
        console.log(`    Name:          ${name}`);
        console.log(`    Description:   ${desc}`);
        console.log(`    Type:          ${adapterType}`);
        console.log(`    MAC:           ${mac}`);
        console.log(`    IP address:    ${ip || '(none)'}`);
        console.log(`    Subnet mask:   ${mask || '(none)'}`);
        console.log(`    Gateway:       ${gateway || '(none)'}`);
        console.log(`    DHCP:          ${dhcpEnabled ? 'Enabled' : 'Disabled'}`);

        if (dhcpEnabled) {
          console.log(`    DHCP server:   ${dhcpServer || '(unknown)'}`);
          if (leaseObtained > 0) {
            console.log(`    Lease obtained: ${new Date(leaseObtained * 1000).toISOString()}`);
          }
          if (leaseExpires > 0) {
            console.log(`    Lease expires:  ${new Date(leaseExpires * 1000).toISOString()}`);
          }
        }

        idx++;
        if (nextPtr === 0) break;
        offset = nextPtr - Number(infoBuf.ptr);
      }

      console.log(`\n  Total adapters: ${idx}`);
    } else {
      console.log(`  GetAdaptersInfo failed (error ${err}).`);
    }
  } else if (err !== 0) {
    console.log(`  GetAdaptersInfo sizing failed (error ${err}).`);
  } else {
    console.log('  No adapters found.');
  }
}

// --- Section 3: TCP Connections ---
console.log('\n--- Active TCP Connections ---');
{
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(0, 0);
  let err = Iphlpapi.GetTcpTable(null, sizeBuf.ptr, 1);

  if (err === ERROR_BUFFER_OVERFLOW || err === 122) {
    const size = sizeBuf.readUInt32LE(0);
    const tcpBuf = Buffer.alloc(size);
    err = Iphlpapi.GetTcpTable(tcpBuf.ptr, sizeBuf.ptr, 1);

    if (err === 0) {
      // MIB_TCPTABLE: dwNumEntries(4), then MIB_TCPROW entries (20 bytes each)
      // MIB_TCPROW: dwState(4), dwLocalAddr(4), dwLocalPort(4), dwRemoteAddr(4), dwRemotePort(4)
      const numEntries = tcpBuf.readUInt32LE(0);

      console.log(`  Total connections: ${numEntries}`);
      console.log(`  ${'Local Address'.padEnd(24)} ${'Local Port'.padEnd(12)} ${'Remote Address'.padEnd(24)} ${'Remote Port'.padEnd(12)} State`);
      console.log(`  ${''.padEnd(24, '-')} ${''.padEnd(12, '-')} ${''.padEnd(24, '-')} ${''.padEnd(12, '-')} ${''.padEnd(14, '-')}`);

      for (let i = 0; i < numEntries; i++) {
        const rowOffset = 4 + i * 20;
        const state = tcpBuf.readUInt32LE(rowOffset);
        const localAddr = tcpBuf.readUInt32LE(rowOffset + 4);
        const localPort = formatPort(tcpBuf.readUInt32LE(rowOffset + 8));
        const remoteAddr = tcpBuf.readUInt32LE(rowOffset + 12);
        const remotePort = formatPort(tcpBuf.readUInt32LE(rowOffset + 16));

        const localIp = formatIpFromU32(localAddr);
        const remoteIp = formatIpFromU32(remoteAddr);
        const stateName = tcpStateNames.get(state) ?? `UNKNOWN(${state})`;

        console.log(`  ${localIp.padEnd(24)} ${String(localPort).padEnd(12)} ${remoteIp.padEnd(24)} ${String(remotePort).padEnd(12)} ${stateName}`);
      }
    } else {
      console.log(`  GetTcpTable failed (error ${err}).`);
    }
  } else if (err !== 0) {
    console.log(`  GetTcpTable sizing failed (error ${err}).`);
  } else {
    console.log('  No TCP connections.');
  }
}

// --- Section 4: IP Routing Table ---
console.log('\n--- IP Routing Table ---');
{
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(0, 0);
  let err = Iphlpapi.GetIpForwardTable(null, sizeBuf.ptr, 1);

  if (err === ERROR_BUFFER_OVERFLOW || err === 122) {
    const size = sizeBuf.readUInt32LE(0);
    const routeBuf = Buffer.alloc(size);
    err = Iphlpapi.GetIpForwardTable(routeBuf.ptr, sizeBuf.ptr, 1);

    if (err === 0) {
      // MIB_IPFORWARDTABLE: dwNumEntries(4), then MIB_IPFORWARDROW entries (56 bytes on x64)
      // MIB_IPFORWARDROW: dwForwardDest(4), dwForwardMask(4), dwForwardPolicy(4),
      //   dwForwardNextHop(4), dwForwardIfIndex(4), union ForwardType(4),
      //   dwForwardProto(4), dwForwardAge(4), dwForwardNextHopAS(4), dwForwardMetric1(4), ...
      const numEntries = routeBuf.readUInt32LE(0);

      console.log(`  Total routes: ${numEntries}`);
      console.log(`  ${'Destination'.padEnd(18)} ${'Mask'.padEnd(18)} ${'Gateway'.padEnd(18)} ${'IF Index'.padEnd(10)} Metric`);
      console.log(`  ${''.padEnd(18, '-')} ${''.padEnd(18, '-')} ${''.padEnd(18, '-')} ${''.padEnd(10, '-')} ${''.padEnd(8, '-')}`);

      for (let i = 0; i < numEntries; i++) {
        const rowOffset = 4 + i * 56;
        const dest = formatIpFromU32(routeBuf.readUInt32LE(rowOffset));
        const mask = formatIpFromU32(routeBuf.readUInt32LE(rowOffset + 4));
        const nextHop = formatIpFromU32(routeBuf.readUInt32LE(rowOffset + 12));
        const ifIndex = routeBuf.readUInt32LE(rowOffset + 16);
        const metric = routeBuf.readUInt32LE(rowOffset + 36);

        console.log(`  ${dest.padEnd(18)} ${mask.padEnd(18)} ${nextHop.padEnd(18)} ${String(ifIndex).padEnd(10)} ${metric}`);
      }
    } else {
      console.log(`  GetIpForwardTable failed (error ${err}).`);
    }
  } else if (err !== 0) {
    console.log(`  GetIpForwardTable sizing failed (error ${err}).`);
  } else {
    console.log('  No routes found.');
  }
}

console.log('\nDiagnostic complete.');
