/**
 * DNS resolver tool with colorful output.
 *
 * Resolves multiple hostnames using Winsock's getaddrinfo and displays both
 * IPv4 and IPv6 addresses. Demonstrates the addrinfo linked-list traversal
 * pattern and address family detection.
 *
 * APIs demonstrated:
 *   - WSAStartup / WSACleanup (Winsock lifecycle)
 *   - gethostname (local machine name)
 *   - getaddrinfo / freeaddrinfo (DNS resolution)
 *
 * addrinfo struct layout (x64, 48 bytes):
 *   +0x00: ai_flags (i32)
 *   +0x04: ai_family (i32)
 *   +0x08: ai_socktype (i32)
 *   +0x0C: ai_protocol (i32)
 *   +0x10: ai_addrlen (u64)
 *   +0x18: ai_canonname (ptr)
 *   +0x20: ai_addr (ptr)
 *   +0x28: ai_next (ptr)
 *
 * sockaddr_in (AF_INET=2):
 *   +0x00: sin_family (u16)
 *   +0x02: sin_port (u16)
 *   +0x04: sin_addr (4 bytes) -- the IPv4 address
 *
 * sockaddr_in6 (AF_INET6=23):
 *   +0x00: sin6_family (u16)
 *   +0x02: sin6_port (u16)
 *   +0x04: sin6_flowinfo (u32)
 *   +0x08: sin6_addr (16 bytes) -- the IPv6 address
 *
 * Run: bun run example/dns-lookup.ts
 */

import { type Pointer, read, toArrayBuffer } from 'bun:ffi';

import Ws2_32 from '../index';

const AF_INET = 2;
const AF_INET6 = 23;

function formatIpv4(buf: Buffer, offset: number): string {
  return `${buf[offset]}.${buf[offset + 1]}.${buf[offset + 2]}.${buf[offset + 3]}`;
}

function formatIpv6(buf: Buffer, offset: number): string {
  const groups: string[] = [];
  for (let i = 0; i < 8; i++) {
    groups.push(buf.readUInt16BE(offset + i * 2).toString(16));
  }
  // Simple compression: replace longest run of :0: with ::
  const full = groups.join(':');
  return full.replace(/\b(0:)+0\b/, '::').replace(/^0::/, '::').replace(/::0$/, '::');
}

// Initialize Winsock
const wsaDataBuf = Buffer.alloc(408); // WSADATA is 408 bytes on x64
const wsaResult = Ws2_32.WSAStartup(0x0202, wsaDataBuf.ptr);

if (wsaResult !== 0) {
  console.error(`WSAStartup failed (error ${wsaResult}).`);
  process.exit(1);
}

try {
  const wsaVersion = wsaDataBuf.readUInt16LE(0);
  const wsaHighVersion = wsaDataBuf.readUInt16LE(2);
  console.log('\x1b[1;36m  DNS Lookup Tool\x1b[0m');
  console.log(`  Winsock version: ${wsaVersion & 0xff}.${(wsaVersion >> 8) & 0xff} (high: ${wsaHighVersion & 0xff}.${(wsaHighVersion >> 8) & 0xff})\n`);

  // Get local hostname
  const hostnameBuf = Buffer.alloc(256);
  const hostnameResult = Ws2_32.gethostname(hostnameBuf.ptr, 256);
  const localHostname = hostnameResult === 0 ? hostnameBuf.toString('ascii').replace(/\0.*$/, '') : '(unknown)';
  console.log(`  Local hostname: \x1b[1m${localHostname}\x1b[0m\n`);

  const hostnames = ['localhost', localHostname, 'dns.google', 'one.one.one.one'];

  for (const hostname of hostnames) {
    const nodeNameBuf = Buffer.from(hostname + '\0', 'ascii');
    const resultPtrBuf = Buffer.alloc(8);

    const lookupResult = Ws2_32.getaddrinfo(nodeNameBuf.ptr, null, null, resultPtrBuf.ptr);

    if (lookupResult !== 0) {
      console.log(`  \x1b[31m\u2717\x1b[0m ${hostname} \x1b[2m(lookup failed, error ${lookupResult})\x1b[0m`);
      continue;
    }

    const firstAddrInfoPtr = read.ptr(resultPtrBuf.ptr) as Pointer;

    if (!firstAddrInfoPtr) {
      console.log(`  \x1b[33m\u25CB\x1b[0m ${hostname} \x1b[2m(no results)\x1b[0m`);
      continue;
    }

    const addresses: string[] = [];
    let currentPtr: Pointer | null = firstAddrInfoPtr;

    while (currentPtr) {
      const addrInfoBuf: Buffer = Buffer.from(toArrayBuffer(currentPtr, 0, 48));
      const family: number = addrInfoBuf.readInt32LE(4);
      const addrLen: number = Number(addrInfoBuf.readBigUInt64LE(0x10));
      const addrPtr: number = Number(addrInfoBuf.readBigUInt64LE(0x20));
      const nextPtr: number = Number(addrInfoBuf.readBigUInt64LE(0x28));

      if (addrPtr !== 0 && addrLen > 0) {
        const sockaddrBuf = Buffer.from(toArrayBuffer(addrPtr as Pointer, 0, addrLen));

        if (family === AF_INET && addrLen >= 8) {
          addresses.push(formatIpv4(sockaddrBuf, 4));
        } else if (family === AF_INET6 && addrLen >= 24) {
          addresses.push(`[${formatIpv6(sockaddrBuf, 8)}]`);
        }
      }

      currentPtr = nextPtr !== 0 ? (nextPtr as Pointer) : null;
    }

    Ws2_32.freeaddrinfo(firstAddrInfoPtr);

    const uniqueAddresses = [...new Set(addresses)];
    const ipv4 = uniqueAddresses.filter((a) => !a.startsWith('['));
    const ipv6 = uniqueAddresses.filter((a) => a.startsWith('['));

    console.log(`  \x1b[32m\u2713\x1b[0m \x1b[1m${hostname}\x1b[0m`);

    if (ipv4.length > 0) {
      console.log(`    IPv4: ${ipv4.map((a) => `\x1b[33m${a}\x1b[0m`).join(', ')}`);
    }
    if (ipv6.length > 0) {
      console.log(`    IPv6: ${ipv6.map((a) => `\x1b[36m${a}\x1b[0m`).join(', ')}`);
    }
    if (uniqueAddresses.length === 0) {
      console.log('    (no addresses resolved)');
    }

    console.log();
  }
} finally {
  Ws2_32.WSACleanup();
}
