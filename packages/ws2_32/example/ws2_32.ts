import Ws2_32, { AddressFamily, INVALID_SOCKET, Protocol, ShutdownHow, SOCKET_ERROR, SocketType } from '../index';

// Initialize Winsock 2.2
const wsaData = Buffer.alloc(408);
const startupResult = Ws2_32.WSAStartup(0x0202, wsaData.ptr);

if (startupResult !== 0) {
  console.error('WSAStartup failed with error: %d', startupResult);
  process.exit(1);
}

// Read the version negotiated by WSAStartup
// WSADATA layout (x64):
//   +0x000: wVersion (WORD)
//   +0x002: wHighVersion (WORD)
const wVersion = wsaData.readUInt16LE(0);
const wHighVersion = wsaData.readUInt16LE(2);
console.log(`Winsock version: ${wVersion & 0xff}.${wVersion >> 8}`);
console.log(`Highest version: ${wHighVersion & 0xff}.${wHighVersion >> 8}`);

// Create a TCP socket
const sock = Ws2_32.socket(AddressFamily.AF_INET, SocketType.SOCK_STREAM, Protocol.IPPROTO_TCP);

if (sock === INVALID_SOCKET) {
  console.error('socket() failed with error: %d', Ws2_32.WSAGetLastError());
  Ws2_32.WSACleanup();
  process.exit(1);
}

console.log(`TCP socket created: ${sock}`);

// Get the local host name
const nameBuf = Buffer.alloc(256);
const gnResult = Ws2_32.gethostname(nameBuf.ptr, 256);

if (gnResult === SOCKET_ERROR) {
  console.error('gethostname() failed with error: %d', Ws2_32.WSAGetLastError());
} else {
  const hostname = nameBuf.toString('ascii').replace(/\0.*/, '');
  console.log(`Hostname: ${hostname}`);
}

// Bind to an ephemeral port on loopback
// sockaddr_in layout:
//   +0x00: sin_family (i16)  = AF_INET
//   +0x02: sin_port   (u16)  = 0 (let OS pick)
//   +0x04: sin_addr   (u32)  = 0x0100007f (127.0.0.1)
//   +0x08: sin_zero   (8 bytes)
const addr = Buffer.alloc(16);
addr.writeInt16LE(AddressFamily.AF_INET, 0);
addr.writeUInt16BE(0, 2);
addr.writeUInt32LE(0x0100_007f, 4);

const bindResult = Ws2_32.bind(sock, addr.ptr, 16);

if (bindResult === SOCKET_ERROR) {
  console.error('bind() failed with error: %d', Ws2_32.WSAGetLastError());
  Ws2_32.closesocket(sock);
  Ws2_32.WSACleanup();
  process.exit(1);
}

// Retrieve the assigned port via getsockname
const localAddr = Buffer.alloc(16);
const addrLen = Buffer.alloc(4);
addrLen.writeInt32LE(16, 0);
Ws2_32.getsockname(sock, localAddr.ptr, addrLen.ptr);

const port = localAddr.readUInt16BE(2);
console.log(`Bound to 127.0.0.1:${port}`);

// Clean up
Ws2_32.shutdown(sock, ShutdownHow.SD_BOTH);
Ws2_32.closesocket(sock);
Ws2_32.WSACleanup();
console.log('Cleanup complete.');
