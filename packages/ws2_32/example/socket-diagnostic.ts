/**
 * Winsock socket diagnostic.
 *
 * Initializes Winsock, queries the local hostname, creates TCP and UDP sockets,
 * reads default buffer sizes and socket options, binds to an ephemeral port,
 * and discovers the assigned port via getsockname. Reports everything in a
 * structured diagnostic format.
 *
 * APIs demonstrated:
 *   - WSAStartup / WSACleanup (Winsock lifecycle)
 *   - gethostname (local hostname)
 *   - socket / closesocket (TCP and UDP socket creation)
 *   - getsockopt (query SO_RCVBUF, SO_SNDBUF, SO_KEEPALIVE, SO_REUSEADDR)
 *   - bind (bind to ephemeral port)
 *   - getsockname (discover assigned port)
 *
 * Run: bun run example/socket-diagnostic.ts
 */

import Ws2_32, { AddressFamily, Protocol, SocketOption, SocketOptionLevel, SocketType } from '../index';

const AF_INET = AddressFamily.AF_INET;
const SOCK_STREAM = SocketType.SOCK_STREAM;
const SOCK_DGRAM = SocketType.SOCK_DGRAM;
const IPPROTO_TCP = Protocol.IPPROTO_TCP;
const IPPROTO_UDP = Protocol.IPPROTO_UDP;
const SOL_SOCKET = SocketOptionLevel.SOL_SOCKET;
const SO_RCVBUF = SocketOption.SO_RCVBUF;
const SO_SNDBUF = SocketOption.SO_SNDBUF;
const SO_KEEPALIVE = SocketOption.SO_KEEPALIVE;
const SO_REUSEADDR = SocketOption.SO_REUSEADDR;
const INVALID_SOCKET = -1n;

function getSockOptInt(sock: bigint, optname: number): number | null {
  const valBuf = Buffer.alloc(4);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeInt32LE(4, 0);
  const result = Ws2_32.getsockopt(sock, SOL_SOCKET, optname, valBuf.ptr, lenBuf.ptr);
  if (result !== 0) return null;
  return valBuf.readInt32LE(0);
}

console.log('=== Winsock Socket Diagnostic ===');
console.log(`Timestamp: ${new Date().toISOString()}\n`);

// Initialize Winsock
const wsaDataBuf = Buffer.alloc(408);
const wsaResult = Ws2_32.WSAStartup(0x0202, wsaDataBuf.ptr);

if (wsaResult !== 0) {
  console.error(`WSAStartup failed (error ${wsaResult}).`);
  process.exit(1);
}

try {
  const negotiatedVersion = wsaDataBuf.readUInt16LE(0);
  const highVersion = wsaDataBuf.readUInt16LE(2);
  const versionMajor = negotiatedVersion & 0xff;
  const versionMinor = (negotiatedVersion >> 8) & 0xff;
  const highMajor = highVersion & 0xff;
  const highMinor = (highVersion >> 8) & 0xff;

  console.log('--- Winsock Info ---');
  console.log(`  Negotiated version: ${versionMajor}.${versionMinor}`);
  console.log(`  Highest version:    ${highMajor}.${highMinor}`);

  // Description and system status are at offsets 4 and 261 in WSADATA
  const description = wsaDataBuf.toString('ascii', 4, 4 + 257).replace(/\0.*$/, '');
  const systemStatus = wsaDataBuf.toString('ascii', 261, 261 + 129).replace(/\0.*$/, '');
  console.log(`  Description:        ${description}`);
  console.log(`  System status:      ${systemStatus}`);

  // Get local hostname
  console.log('\n--- Hostname ---');
  const hostnameBuf = Buffer.alloc(256);
  const hostnameResult = Ws2_32.gethostname(hostnameBuf.ptr, 256);

  if (hostnameResult === 0) {
    const hostname = hostnameBuf.toString('ascii').replace(/\0.*$/, '');
    console.log(`  Local hostname:     ${hostname}`);
  } else {
    console.log(`  gethostname failed (error ${hostnameResult}).`);
  }

  // Create TCP socket
  console.log('\n--- TCP Socket (SOCK_STREAM / IPPROTO_TCP) ---');
  const tcpSocket = Ws2_32.socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);

  if (tcpSocket === INVALID_SOCKET) {
    console.log('  Failed to create TCP socket.');
  } else {
    console.log(`  Socket handle:      0x${tcpSocket.toString(16)}`);

    const rcvBuf = getSockOptInt(tcpSocket, SO_RCVBUF);
    const sndBuf = getSockOptInt(tcpSocket, SO_SNDBUF);
    const keepAlive = getSockOptInt(tcpSocket, SO_KEEPALIVE);
    const reuseAddr = getSockOptInt(tcpSocket, SO_REUSEADDR);

    console.log(`  SO_RCVBUF:          ${rcvBuf !== null ? `${rcvBuf} bytes (${(rcvBuf / 1024).toFixed(0)} KB)` : 'query failed'}`);
    console.log(`  SO_SNDBUF:          ${sndBuf !== null ? `${sndBuf} bytes (${(sndBuf / 1024).toFixed(0)} KB)` : 'query failed'}`);
    console.log(`  SO_KEEPALIVE:       ${keepAlive !== null ? (keepAlive ? 'enabled' : 'disabled') : 'query failed'}`);
    console.log(`  SO_REUSEADDR:       ${reuseAddr !== null ? (reuseAddr ? 'enabled' : 'disabled') : 'query failed'}`);

    // Bind to 127.0.0.1:0 to get an ephemeral port
    const sockaddrBuf = Buffer.alloc(16);
    sockaddrBuf.writeUInt16LE(AF_INET, 0); // sin_family
    sockaddrBuf.writeUInt16BE(0, 2);       // sin_port = 0 (ephemeral)
    sockaddrBuf[4] = 127;                  // 127.0.0.1
    sockaddrBuf[5] = 0;
    sockaddrBuf[6] = 0;
    sockaddrBuf[7] = 1;

    const bindResult = Ws2_32.bind(tcpSocket, sockaddrBuf.ptr, 16);

    if (bindResult === 0) {
      console.log('  Bind to 127.0.0.1:0: success');

      // Discover assigned port via getsockname
      const nameBuf = Buffer.alloc(16);
      const namelenBuf = Buffer.alloc(4);
      namelenBuf.writeInt32LE(16, 0);

      const nameResult = Ws2_32.getsockname(tcpSocket, nameBuf.ptr, namelenBuf.ptr);

      if (nameResult === 0) {
        const assignedPort = nameBuf.readUInt16BE(2);
        const ip = `${nameBuf[4]}.${nameBuf[5]}.${nameBuf[6]}.${nameBuf[7]}`;
        console.log(`  Assigned address:   ${ip}:${assignedPort}`);
      } else {
        console.log('  getsockname failed.');
      }
    } else {
      console.log(`  Bind failed (error ${bindResult}).`);
    }

    Ws2_32.closesocket(tcpSocket);
    console.log('  Socket closed.');
  }

  // Create UDP socket
  console.log('\n--- UDP Socket (SOCK_DGRAM / IPPROTO_UDP) ---');
  const udpSocket = Ws2_32.socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);

  if (udpSocket === INVALID_SOCKET) {
    console.log('  Failed to create UDP socket.');
  } else {
    console.log(`  Socket handle:      0x${udpSocket.toString(16)}`);

    const rcvBuf = getSockOptInt(udpSocket, SO_RCVBUF);
    const sndBuf = getSockOptInt(udpSocket, SO_SNDBUF);
    const reuseAddr = getSockOptInt(udpSocket, SO_REUSEADDR);

    console.log(`  SO_RCVBUF:          ${rcvBuf !== null ? `${rcvBuf} bytes (${(rcvBuf / 1024).toFixed(0)} KB)` : 'query failed'}`);
    console.log(`  SO_SNDBUF:          ${sndBuf !== null ? `${sndBuf} bytes (${(sndBuf / 1024).toFixed(0)} KB)` : 'query failed'}`);
    console.log(`  SO_REUSEADDR:       ${reuseAddr !== null ? (reuseAddr ? 'enabled' : 'disabled') : 'query failed'}`);

    Ws2_32.closesocket(udpSocket);
    console.log('  Socket closed.');
  }
} finally {
  Ws2_32.WSACleanup();
  console.log('\nWinsock cleaned up. Diagnostic complete.');
}
