/**
 * Net Explorer
 *
 * Discovers the current network user and then performs a full enumeration
 * of connected and remembered network resources using the WNet browsing
 * APIs. Each discovered resource is rendered in a colorful ANSI table
 * with its type, display category, local name, remote path, and provider.
 *
 * APIs demonstrated:
 *   - Mpr.WNetGetUserW          (retrieve the current network user)
 *   - Mpr.WNetOpenEnumW         (begin resource enumeration)
 *   - Mpr.WNetEnumResourceW     (retrieve NETRESOURCE entries from an enum)
 *   - Mpr.WNetCloseEnum         (close the enumeration handle)
 *   - Kernel32.ReadProcessMemory (dereference NETRESOURCE string pointers)
 *
 * Run: bun run example:net-explorer
 */

import { read } from 'bun:ffi';

import Kernel32 from '@bun-win32/kernel32';

import Mpr, {
  ResourceDisplayType,
  ResourceScope,
  ResourceType,
  WN_NO_ERROR,
  WN_NO_MORE_ENTRIES,
} from '../index';

Mpr.Preload(['WNetCloseEnum', 'WNetEnumResourceW', 'WNetGetUserW', 'WNetOpenEnumW']);
Kernel32.Preload(['GetCurrentProcess', 'ReadProcessMemory']);

const ANSI = {
  bold: '\x1b[1m',
  blue: '\x1b[94m',
  cyan: '\x1b[96m',
  dim: '\x1b[2m',
  green: '\x1b[92m',
  magenta: '\x1b[95m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
  white: '\x1b[97m',
  yellow: '\x1b[93m',
} as const;

const NR_SIZE = 48;
const NR_OFF_TYPE = 4;
const NR_OFF_DISPLAY_TYPE = 8;
const NR_OFF_LOCAL_NAME = 16;
const NR_OFF_REMOTE_NAME = 24;
const NR_OFF_COMMENT = 32;
const NR_OFF_PROVIDER = 40;

const CURRENT_PROCESS = Kernel32.GetCurrentProcess();

interface NetResource {
  color: string;
  comment: string;
  displayType: string;
  localName: string;
  provider: string;
  remoteName: string;
  type: string;
}

function readMemory(addr: number, size: number): Buffer {
  const out = Buffer.alloc(size);
  Kernel32.ReadProcessMemory(CURRENT_PROCESS, BigInt(addr), out.ptr, BigInt(size), 0n);
  return out;
}

function readWideStringAt(addr: number, maxChars = 260): string {
  if (addr === 0) return '';
  const raw = readMemory(addr, maxChars * 2);
  const text = raw.toString('utf16le');
  const idx = text.indexOf('\0');
  return idx >= 0 ? text.slice(0, idx) : text;
}

function getTypeName(t: number): string {
  switch (t) {
    case ResourceType.RESOURCETYPE_DISK: return 'Disk';
    case ResourceType.RESOURCETYPE_PRINT: return 'Print';
    case ResourceType.RESOURCETYPE_ANY: return 'Any';
    default: return 'Unknown';
  }
}

function getDisplayTypeName(dt: number): string {
  switch (dt) {
    case ResourceDisplayType.RESOURCEDISPLAYTYPE_DOMAIN: return 'Domain';
    case ResourceDisplayType.RESOURCEDISPLAYTYPE_SERVER: return 'Server';
    case ResourceDisplayType.RESOURCEDISPLAYTYPE_SHARE: return 'Share';
    case ResourceDisplayType.RESOURCEDISPLAYTYPE_FILE: return 'File';
    case ResourceDisplayType.RESOURCEDISPLAYTYPE_GROUP: return 'Group';
    case ResourceDisplayType.RESOURCEDISPLAYTYPE_NETWORK: return 'Network';
    case ResourceDisplayType.RESOURCEDISPLAYTYPE_ROOT: return 'Root';
    case ResourceDisplayType.RESOURCEDISPLAYTYPE_DIRECTORY: return 'Directory';
    default: return 'Generic';
  }
}

const TYPE_COLORS: Record<number, string> = {
  [ResourceType.RESOURCETYPE_ANY]: ANSI.white,
  [ResourceType.RESOURCETYPE_DISK]: ANSI.cyan,
  [ResourceType.RESOURCETYPE_PRINT]: ANSI.magenta,
};

function getCurrentUser(): string {
  const buf = Buffer.alloc(512);
  const size = Buffer.alloc(4);
  size.writeUInt32LE(256, 0);
  const result = Mpr.WNetGetUserW(null, buf.ptr, size.ptr);
  if (result !== WN_NO_ERROR) return '(unavailable)';
  return buf.toString('utf16le').replace(/\0.*$/, '');
}

function enumerateResources(scope: number): NetResource[] {
  const resources: NetResource[] = [];
  const handleBuf = Buffer.alloc(8);

  const openResult = Mpr.WNetOpenEnumW(scope, ResourceType.RESOURCETYPE_ANY, 0, null, handleBuf.ptr);

  if (openResult !== WN_NO_ERROR) return resources;

  const hEnum = handleBuf.readBigUInt64LE(0);
  const enumBuf = Buffer.alloc(16384);
  const countBuf = Buffer.alloc(4);
  const sizeBuf = Buffer.alloc(4);

  try {
    for (;;) {
      countBuf.writeUInt32LE(0xffffffff, 0);
      sizeBuf.writeUInt32LE(16384, 0);

      const enumResult = Mpr.WNetEnumResourceW(hEnum, countBuf.ptr, enumBuf.ptr, sizeBuf.ptr);

      if (enumResult === WN_NO_MORE_ENTRIES) break;
      if (enumResult !== WN_NO_ERROR) break;

      const count = countBuf.readUInt32LE(0);

      for (let i = 0; i < count; i++) {
        const off = i * NR_SIZE;
        const type = enumBuf.readUInt32LE(off + NR_OFF_TYPE);
        const displayType = enumBuf.readUInt32LE(off + NR_OFF_DISPLAY_TYPE);

        resources.push({
          color: TYPE_COLORS[type] ?? ANSI.white,
          comment: readWideStringAt(read.ptr(enumBuf.ptr, off + NR_OFF_COMMENT)),
          displayType: getDisplayTypeName(displayType),
          localName: readWideStringAt(read.ptr(enumBuf.ptr, off + NR_OFF_LOCAL_NAME)),
          provider: readWideStringAt(read.ptr(enumBuf.ptr, off + NR_OFF_PROVIDER)),
          remoteName: readWideStringAt(read.ptr(enumBuf.ptr, off + NR_OFF_REMOTE_NAME)),
          type: getTypeName(type),
        });
      }
    }
  } finally {
    Mpr.WNetCloseEnum(hEnum);
  }

  return resources;
}

process.stdout.write('\x1b[2J\x1b[H');
console.log(`${ANSI.bold}${ANSI.white}Net Explorer${ANSI.reset}`);
console.log(`${ANSI.dim}Windows Network Resource Browser${ANSI.reset}`);
console.log('');

const user = getCurrentUser();
console.log(`  ${ANSI.green}User${ANSI.reset}  ${user}`);
console.log('');

const scopes = [
  { icon: '\u25cf', name: 'Connected', value: ResourceScope.RESOURCE_CONNECTED },
  { icon: '\u25cb', name: 'Remembered', value: ResourceScope.RESOURCE_REMEMBERED },
];

let totalCount = 0;

for (const scope of scopes) {
  const resources = enumerateResources(scope.value);
  totalCount += resources.length;

  console.log(`${ANSI.bold}${ANSI.yellow}  ${scope.icon} ${scope.name}${ANSI.reset} ${ANSI.dim}(${resources.length})${ANSI.reset}`);

  if (resources.length === 0) {
    console.log(`    ${ANSI.dim}(none)${ANSI.reset}`);
  } else {
    for (const r of resources) {
      const local = r.localName ? `${ANSI.white}${r.localName}${ANSI.reset} \u2192 ` : '   ';
      const remote = `${r.color}${r.remoteName || '(no path)'}${ANSI.reset}`;
      const meta = `${ANSI.dim}[${r.type}/${r.displayType}]${ANSI.reset}`;
      const prov = r.provider ? ` ${ANSI.dim}via ${r.provider}${ANSI.reset}` : '';
      const cmt = r.comment ? ` ${ANSI.dim}"${r.comment}"${ANSI.reset}` : '';
      console.log(`    ${local}${remote} ${meta}${prov}${cmt}`);
    }
  }

  console.log('');
}

console.log(`${ANSI.dim}  ${totalCount} resource(s) discovered${ANSI.reset}`);
