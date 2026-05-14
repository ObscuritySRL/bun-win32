/**
 * Profile Inspector
 *
 * Enumerates every ICC color profile installed on the system, opens each one,
 * reads its full ICC header, and renders a richly-formatted report. For every
 * profile you see profile size, version, class (monitor / printer / scanner /
 * link / abstract / color space / named), color space, connection space, the
 * D50 illuminant, manufacturer/model FourCCs, rendering intent, profile flags,
 * and element count. Output is colorized by profile class.
 *
 * APIs demonstrated (Mscms):
 *   - EnumColorProfilesW           (list installed profiles, sizing-call pattern)
 *   - OpenColorProfileW            (handle to a profile file)
 *   - GetColorProfileHeader        (read 128-byte ICC header)
 *   - GetCountColorProfileElements (number of ICC tag entries)
 *   - IsColorProfileValid          (validate signature)
 *   - GetColorDirectoryW           (locate the color directory)
 *   - CloseColorProfile            (release handle)
 *
 * ICC header layout (PROFILEHEADER, 128 bytes):
 *   +0x00 DWORD  phSize             profile size in bytes
 *   +0x04 DWORD  phCMMType          FourCC of CMM used (e.g. 'Win ')
 *   +0x08 DWORD  phVersion          major.minor in BCD (high byte)
 *   +0x0C DWORD  phClass            FourCC: 'mntr' 'prtr' 'scnr' 'link' ...
 *   +0x10 DWORD  phDataColorSpace   FourCC: 'RGB ' 'CMYK' 'GRAY' 'Lab ' ...
 *   +0x14 DWORD  phConnectionSpace  PCS - usually 'XYZ ' or 'Lab '
 *   +0x18 DATETIME phDateTime       6 WORDs (Y, M, D, H, M, S)
 *   +0x24 DWORD  phSignature        always 'acsp' (0x61637370)
 *   +0x28 DWORD  phPlatform         FourCC: 'MSFT' 'APPL' 'SUNW' 'SGI ' ...
 *   +0x2C DWORD  phProfileFlags
 *   +0x30 DWORD  phManufacturer
 *   +0x34 DWORD  phModel
 *   +0x38 ULL    phAttributes       2 DWORDs of device attributes
 *   +0x40 DWORD  phRenderingIntent  0=Perceptual 1=Relative 2=Saturation 3=Absolute
 *   +0x44 CIEXYZ phIlluminant       3 FXPT2DOT30 (signed 32-bit fixed)
 *   +0x50 DWORD  phCreator          FourCC
 *   +0x54 BYTE[44] phReserved
 *
 * Run: bun run example/profile-inspector.ts
 */

import Mscms, { ENUM_TYPE_VERSION, INTENT, PROFILE_ACCESS, PROFILE_TYPE } from '../index';

Mscms.Preload(['CloseColorProfile', 'EnumColorProfilesW', 'GetColorDirectoryW', 'GetColorProfileHeader', 'GetCountColorProfileElements', 'IsColorProfileValid', 'OpenColorProfileW']);

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[91m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const BLUE = '\x1b[94m';
const MAGENTA = '\x1b[95m';
const CYAN = '\x1b[96m';
const WHITE = '\x1b[97m';
const GRAY = '\x1b[90m';
const RESET = '\x1b[0m';

const OPEN_EXISTING = 3;

// Convert a DWORD packed as a Big-Endian FourCC (Microsoft compiles 'mntr' as
// 0x6D6E7472 where the leading 'm' lives in the high byte). The DWORD is read
// little-endian so we reverse the bytes to get an ASCII string.
function fourCC(value: number): string {
  const b0 = (value >>> 24) & 0xff;
  const b1 = (value >>> 16) & 0xff;
  const b2 = (value >>> 8) & 0xff;
  const b3 = value & 0xff;
  const printable = [b0, b1, b2, b3].map((c) => (c >= 0x20 && c < 0x7f ? String.fromCharCode(c) : ' ')).join('');
  return `'${printable}'`;
}

// ICC version is encoded as 0xMMmm0000 where MM=major, mm=minor (each BCD nibble pair)
function iccVersion(value: number): string {
  const major = (value >>> 24) & 0xff;
  const minorHi = (value >>> 20) & 0x0f;
  const minorLo = (value >>> 16) & 0x0f;
  return `${major}.${minorHi}.${minorLo}`;
}

// ICC v2 profiles store the header illuminant as s15Fixed16Number (signed
// Q16.16). GetColorProfileHeader preserves the on-disk format - so divide
// by 2^16 to recover the real value.
function s15Fixed16(value: number): number {
  return value / 0x10000;
}

function classLabel(fourCcDword: number): { label: string; color: string } {
  switch (fourCcDword) {
    case 0x6d6e7472:
      return { label: 'Monitor', color: CYAN };
    case 0x70727472:
      return { label: 'Printer', color: YELLOW };
    case 0x73636e72:
      return { label: 'Scanner', color: GREEN };
    case 0x6c696e6b:
      return { label: 'Link', color: MAGENTA };
    case 0x61627374:
      return { label: 'Abstract', color: BLUE };
    case 0x73706163:
      return { label: 'ColorSpace', color: WHITE };
    case 0x6e6d636c:
      return { label: 'NamedColor', color: RED };
    case 0x63616d70:
      return { label: 'ColorAppearance', color: BLUE };
    case 0x676d6d70:
      return { label: 'GamutMap', color: MAGENTA };
    default:
      return { label: fourCC(fourCcDword), color: GRAY };
  }
}

function intentLabel(intent: number): string {
  switch (intent) {
    case INTENT.INTENT_PERCEPTUAL:
      return 'Perceptual';
    case INTENT.INTENT_RELATIVE_COLORIMETRIC:
      return 'Relative Colorimetric';
    case INTENT.INTENT_SATURATION:
      return 'Saturation';
    case INTENT.INTENT_ABSOLUTE_COLORIMETRIC:
      return 'Absolute Colorimetric';
    default:
      return `0x${intent.toString(16)}`;
  }
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1_048_576) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1_048_576).toFixed(2)} MB`;
}

// 1. Locate the color directory (so we can show the user where these live)
const dirBuf = Buffer.alloc(520);
const dirSize = Buffer.alloc(4);
dirSize.writeUInt32LE(dirBuf.byteLength, 0);
const colorDirectory = Mscms.GetColorDirectoryW(null, dirBuf.ptr!, dirSize.ptr!) ? new TextDecoder('utf-16').decode(dirBuf.subarray(0, dirSize.readUInt32LE(0))).replace(/\0+$/, '') : '(unknown)';

// 2. Build a fully-populated ENUMTYPEW that asks for every profile class on the system.
//    96-byte struct on x64 with 4 bytes of padding before pDeviceName for 8-byte alignment.
const ENUMTYPEW_SIZE = 96;
const enumRecord = Buffer.alloc(ENUMTYPEW_SIZE);
enumRecord.writeUInt32LE(ENUMTYPEW_SIZE, 0); // dwSize
enumRecord.writeUInt32LE(ENUM_TYPE_VERSION, 4); // dwVersion (0x0300)
enumRecord.writeUInt32LE(0, 8); // dwFields = 0 -> match every profile

// 3. Sizing call: pass NULL for pBuffer, get the byte size we need to allocate
const sizeOut = Buffer.alloc(4);
const countOut = Buffer.alloc(4);
Mscms.EnumColorProfilesW(null, enumRecord.ptr!, null, sizeOut.ptr!, countOut.ptr!);
const enumBufferSize = sizeOut.readUInt32LE(0);
const profileCount = countOut.readUInt32LE(0);

// 4. Real call: allocate, ask again
const profileBuf = Buffer.alloc(enumBufferSize);
sizeOut.writeUInt32LE(enumBufferSize, 0);
const ok = Mscms.EnumColorProfilesW(null, enumRecord.ptr!, profileBuf.ptr!, sizeOut.ptr!, countOut.ptr!);
if (!ok) {
  console.error(`${RED}EnumColorProfilesW failed${RESET}`);
  process.exit(1);
}

// 5. The buffer is a sequence of NUL-terminated UTF-16 strings, double-NUL at the end.
const fullText = new TextDecoder('utf-16').decode(profileBuf);
const filenames = fullText.split('\0').filter((s) => s.length > 0);

// ── Report ────────────────────────────────────────────────────────────────
console.log();
console.log(`${BOLD}${WHITE}ICC Color Profile Inventory${RESET}`);
console.log(`${DIM}${'─'.repeat(80)}${RESET}`);
console.log(`  ${GRAY}Directory${RESET}    ${WHITE}${colorDirectory}${RESET}`);
console.log(`  ${GRAY}Profiles${RESET}     ${WHITE}${profileCount}${RESET}`);
console.log();

// ── Per-profile dump ──────────────────────────────────────────────────────

interface ProfileEntry {
  filename: string;
  size: number;
  cmm: number;
  version: number;
  className: { label: string; color: string };
  dataColorSpace: number;
  connectionSpace: number;
  signature: number;
  platform: number;
  flags: number;
  manufacturer: number;
  model: number;
  attributes: bigint;
  intent: number;
  illuminant: { x: number; y: number; z: number };
  creator: number;
  elementCount: number;
  valid: number;
  fullPath: string;
}

const entries: ProfileEntry[] = [];

for (const filename of filenames) {
  const fullPath = `${colorDirectory}\\${filename}`;
  const pathW = Buffer.from(`${fullPath}\0`, 'utf16le');

  // PROFILE struct: 24 bytes on x64 (dwType, padding, pProfileData, cbDataSize, padding)
  const profileStruct = Buffer.alloc(24);
  profileStruct.writeUInt32LE(PROFILE_TYPE.PROFILE_FILENAME, 0);
  profileStruct.writeBigUInt64LE(BigInt(pathW.ptr!), 8);
  profileStruct.writeUInt32LE(pathW.byteLength, 16);

  const hProfile = Mscms.OpenColorProfileW(profileStruct.ptr!, PROFILE_ACCESS.PROFILE_READ, 0, OPEN_EXISTING);
  if (hProfile === 0n) continue;

  const header = Buffer.alloc(128);
  if (!Mscms.GetColorProfileHeader(hProfile, header.ptr!)) {
    Mscms.CloseColorProfile(hProfile);
    continue;
  }

  // GetColorProfileHeader byte-swaps the on-disk ICC big-endian DWORDs into
  // native little-endian. So every field gets a little-endian read.
  const elementCount = Buffer.alloc(4);
  Mscms.GetCountColorProfileElements(hProfile, elementCount.ptr!);

  const validBuf = Buffer.alloc(4);
  Mscms.IsColorProfileValid(hProfile, validBuf.ptr!);

  const cls = header.readUInt32LE(12);
  entries.push({
    filename,
    fullPath,
    size: header.readUInt32LE(0),
    cmm: header.readUInt32LE(4),
    version: header.readUInt32LE(8),
    className: classLabel(cls),
    dataColorSpace: header.readUInt32LE(16),
    connectionSpace: header.readUInt32LE(20),
    signature: header.readUInt32LE(36),
    platform: header.readUInt32LE(40),
    flags: header.readUInt32LE(44),
    manufacturer: header.readUInt32LE(48),
    model: header.readUInt32LE(52),
    attributes: header.readBigUInt64LE(56),
    intent: header.readUInt32LE(64),
    illuminant: {
      x: s15Fixed16(header.readInt32LE(68)),
      y: s15Fixed16(header.readInt32LE(72)),
      z: s15Fixed16(header.readInt32LE(76)),
    },
    creator: header.readUInt32LE(80),
    elementCount: elementCount.readUInt32LE(0),
    valid: validBuf.readUInt32LE(0),
  });

  Mscms.CloseColorProfile(hProfile);
}

// Group profiles by class for nicer reading
entries.sort((a, b) => {
  if (a.className.label !== b.className.label) return a.className.label.localeCompare(b.className.label);
  return a.filename.localeCompare(b.filename);
});

let currentClass = '';
for (const e of entries) {
  if (e.className.label !== currentClass) {
    currentClass = e.className.label;
    console.log(`${BOLD}${e.className.color}═══ ${e.className.label} Profiles ═══${RESET}`);
    console.log();
  }

  const status = e.valid ? `${GREEN}VALID${RESET}` : `${RED}INVALID${RESET}`;
  console.log(`  ${BOLD}${WHITE}${e.filename}${RESET}  ${status}`);

  // Two-column key/value table
  const lines: Array<[string, string]> = [
    ['Size', `${formatBytes(e.size)} (${e.size.toLocaleString()} bytes)`],
    ['CMM', fourCC(e.cmm)],
    ['Version', `ICC ${iccVersion(e.version)}`],
    ['Class', `${e.className.color}${e.className.label}${RESET}  ${DIM}${fourCC(header_class(e.className.label))}${RESET}`],
    ['Data color space', fourCC(e.dataColorSpace)],
    ['PCS', fourCC(e.connectionSpace)],
    ['Signature', `${e.signature === 0x61637370 ? GREEN : RED}${fourCC(e.signature)}${RESET}  ${DIM}(expected 'acsp')${RESET}`],
    ['Platform', fourCC(e.platform)],
    ['Profile flags', `0x${e.flags.toString(16).padStart(8, '0')}`],
    ['Manufacturer', fourCC(e.manufacturer)],
    ['Model', fourCC(e.model)],
    ['Attributes', `0x${e.attributes.toString(16).padStart(16, '0')}`],
    ['Rendering intent', intentLabel(e.intent)],
    ['Illuminant (XYZ)', `${e.illuminant.x.toFixed(4)}  ${e.illuminant.y.toFixed(4)}  ${e.illuminant.z.toFixed(4)}`],
    ['Creator', fourCC(e.creator)],
    ['Tag count', `${e.elementCount}`],
  ];

  const maxKey = Math.max(...lines.map(([k]) => k.length));
  for (const [k, v] of lines) {
    console.log(`    ${GRAY}${k.padEnd(maxKey)}${RESET}  ${v}`);
  }
  console.log();
}

function header_class(label: string): number {
  switch (label) {
    case 'Monitor':
      return 0x6d6e7472;
    case 'Printer':
      return 0x70727472;
    case 'Scanner':
      return 0x73636e72;
    case 'Link':
      return 0x6c696e6b;
    case 'Abstract':
      return 0x61627374;
    case 'ColorSpace':
      return 0x73706163;
    case 'NamedColor':
      return 0x6e6d636c;
    case 'ColorAppearance':
      return 0x63616d70;
    case 'GamutMap':
      return 0x676d6d70;
    default:
      return 0;
  }
}
