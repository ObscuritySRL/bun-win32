/**
 * Image Diagnostic
 *
 * Comprehensive image-format diagnostic for Windows GDI+. Enumerates every
 * registered image decoder and encoder on the system and prints a richly
 * formatted table per codec: CLSID, format, MIME type, file extensions,
 * version, and capability flags. When an image path is supplied as the
 * first argument, the script then loads that image, reports dimensions,
 * pixel format, DPI, frame count, image flags, and the first 10 EXIF/PNG
 * properties via the GDI+ property API.
 *
 * Run:
 *   bun run example/image-diagnostic.ts                       # codecs only
 *   bun run example/image-diagnostic.ts generative-poster.png # codecs + image
 *
 * APIs demonstrated:
 *   - GdiplusStartup / GdiplusShutdown   (initialize and tear down GDI+)
 *   - GdipGetImageDecodersSize / GdipGetImageDecoders (list decoders)
 *   - GdipGetImageEncodersSize / GdipGetImageEncoders (list encoders)
 *   - GdipLoadImageFromFile              (parse a file into an Image)
 *   - GdipGetImageWidth / GdipGetImageHeight (pixel dimensions)
 *   - GdipGetImageHorizontalResolution /
 *     GdipGetImageVerticalResolution     (DPI)
 *   - GdipGetImagePixelFormat            (PixelFormat enum value)
 *   - GdipGetImageFlags                  (ImageFlags bitmask)
 *   - GdipGetImageType                   (Bitmap vs Metafile)
 *   - GdipImageGetFrameDimensionsCount / GdipImageGetFrameDimensionsList /
 *     GdipImageGetFrameCount             (multi-frame: GIF, TIFF, ICO)
 *   - GdipGetPropertyCount / GdipGetPropertyIdList /
 *     GdipGetPropertyItemSize / GdipGetPropertyItem (EXIF/metadata)
 *   - GdipDisposeImage                   (release the loaded image)
 */
import { read, type Pointer } from 'bun:ffi';
import Gdiplus, { ImageCodecFlags, ImageFlags, ImageType, Status } from '../index';

Gdiplus.Preload();

function check(status: number, where: string): void {
  if (status !== Status.Ok) {
    throw new Error(`${where} failed: ${Status[status]} (${status})`);
  }
}

// Read a NUL-terminated UTF-16LE string starting at a process-local pointer.
// (GDI+ codec metadata is heap-allocated inside gdiplus.dll but in our process
// — safe to dereference via bun:ffi's read.* APIs.)
function readWcharAtPointer(pointer: Pointer | null, maxChars = 256): string {
  if (!pointer) return '';
  let out = '';
  for (let i = 0; i < maxChars; i++) {
    const code = read.u16(pointer, i * 2);
    if (code === 0) break;
    out += String.fromCharCode(code);
  }
  return out;
}

function formatClsid(buffer: Buffer, offset: number): string {
  const d1 = buffer.readUInt32LE(offset);
  const d2 = buffer.readUInt16LE(offset + 4);
  const d3 = buffer.readUInt16LE(offset + 6);
  const d4 = Array.from(buffer.subarray(offset + 8, offset + 16))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `{${d1.toString(16).padStart(8, '0')}-${d2.toString(16).padStart(4, '0')}-${d3.toString(16).padStart(4, '0')}-${d4.slice(0, 4)}-${d4.slice(4)}}`.toUpperCase();
}

const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const MAGENTA = '\x1b[95m';

function flagList(flags: number, defs: Record<string, number>): string {
  const names: string[] = [];
  for (const [name, value] of Object.entries(defs)) {
    if (Number.isInteger(value) && value !== 0 && (flags & value) === value) names.push(name);
  }
  return names.length ? names.join(', ') : '(none)';
}

const tokenBuffer = Buffer.alloc(8);
const startupInput = Buffer.alloc(16);
startupInput.writeUInt32LE(1, 0);
check(Gdiplus.GdiplusStartup(tokenBuffer.ptr, startupInput.ptr, null), 'GdiplusStartup');
const startupToken = tokenBuffer.readBigUInt64LE(0);

try {
  // ImageCodecInfo struct (x64): 104 bytes total.
  //   0..15   CLSID
  //   16..31  FormatID (GUID)
  //   32..39  const WCHAR* CodecName
  //   40..47  const WCHAR* DllName
  //   48..55  const WCHAR* FormatDescription
  //   56..63  const WCHAR* FilenameExtension
  //   64..71  const WCHAR* MimeType
  //   72..75  DWORD Flags
  //   76..79  DWORD Version
  //   80..83  DWORD SigCount
  //   84..87  DWORD SigSize
  //   88..95  const BYTE* SigPattern
  //   96..103 const BYTE* SigMask
  const ENTRY_SIZE = 104;
  const OFFSET_CODEC_NAME = 32;
  const OFFSET_FORMAT_DESC = 48;
  const OFFSET_EXTENSIONS = 56;
  const OFFSET_MIME = 64;
  const OFFSET_FLAGS = 72;
  const OFFSET_VERSION = 76;

  function printCodecTable(title: string, kind: 'decoder' | 'encoder'): void {
    const countBuffer = Buffer.alloc(4);
    const totalBytesBuffer = Buffer.alloc(4);
    if (kind === 'decoder') {
      check(Gdiplus.GdipGetImageDecodersSize(countBuffer.ptr, totalBytesBuffer.ptr), 'GdipGetImageDecodersSize');
    } else {
      check(Gdiplus.GdipGetImageEncodersSize(countBuffer.ptr, totalBytesBuffer.ptr), 'GdipGetImageEncodersSize');
    }
    const count = countBuffer.readUInt32LE(0);
    const totalBytes = totalBytesBuffer.readUInt32LE(0);
    const listBuffer = Buffer.alloc(totalBytes);
    if (kind === 'decoder') {
      check(Gdiplus.GdipGetImageDecoders(count, totalBytes, listBuffer.ptr), 'GdipGetImageDecoders');
    } else {
      check(Gdiplus.GdipGetImageEncoders(count, totalBytes, listBuffer.ptr), 'GdipGetImageEncoders');
    }

    console.log(`\n${BOLD}${CYAN}${title}${RESET} ${DIM}(${count})${RESET}`);
    console.log(`${DIM}${'─'.repeat(96)}${RESET}`);

    for (let i = 0; i < count; i++) {
      const entryOffset = i * ENTRY_SIZE;
      const codecName = readWcharAtPointer(read.ptr(listBuffer.ptr!, entryOffset + OFFSET_CODEC_NAME) as Pointer);
      const formatDesc = readWcharAtPointer(read.ptr(listBuffer.ptr!, entryOffset + OFFSET_FORMAT_DESC) as Pointer);
      const extensions = readWcharAtPointer(read.ptr(listBuffer.ptr!, entryOffset + OFFSET_EXTENSIONS) as Pointer);
      const mimeType = readWcharAtPointer(read.ptr(listBuffer.ptr!, entryOffset + OFFSET_MIME) as Pointer);
      const flags = listBuffer.readUInt32LE(entryOffset + OFFSET_FLAGS);
      const version = listBuffer.readUInt32LE(entryOffset + OFFSET_VERSION);
      const clsid = formatClsid(listBuffer, entryOffset);

      const flagNames = flagList(flags, ImageCodecFlags as unknown as Record<string, number>);

      console.log(`  ${GREEN}${codecName.padEnd(22)}${RESET}${YELLOW}${mimeType.padEnd(18)}${RESET}${extensions}`);
      console.log(`  ${DIM}    description${RESET}  ${formatDesc}`);
      console.log(`  ${DIM}    clsid${RESET}        ${clsid}`);
      console.log(`  ${DIM}    version${RESET}      ${version}`);
      console.log(`  ${DIM}    flags${RESET}        0x${flags.toString(16).padStart(8, '0')} ${DIM}(${flagNames})${RESET}`);
      console.log('');
    }
  }

  console.log(`\n${BOLD}${MAGENTA}╔══════════════════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${MAGENTA}║          GDI+ IMAGE DIAGNOSTIC  —  powered by @bun-win32/gdiplus             ║${RESET}`);
  console.log(`${BOLD}${MAGENTA}╚══════════════════════════════════════════════════════════════════════════════╝${RESET}`);

  printCodecTable('REGISTERED IMAGE DECODERS', 'decoder');
  printCodecTable('REGISTERED IMAGE ENCODERS', 'encoder');

  // ── Optional: inspect a specific image if a path was provided ──────────────
  const imagePath = process.argv[2];
  if (imagePath) {
    console.log(`\n${BOLD}${CYAN}IMAGE INSPECTION${RESET}  ${DIM}(${imagePath})${RESET}`);
    console.log(`${DIM}${'─'.repeat(96)}${RESET}`);

    const wPath = Buffer.from(imagePath + '\0', 'utf16le');
    const imageHandleBuffer = Buffer.alloc(8);
    const loadStatus = Gdiplus.GdipLoadImageFromFile(wPath.ptr, imageHandleBuffer.ptr);
    if (loadStatus !== Status.Ok) {
      console.log(`  ${YELLOW}!${RESET} GdipLoadImageFromFile returned ${Status[loadStatus]} (${loadStatus})`);
    } else {
      const image = imageHandleBuffer.readBigUInt64LE(0);
      try {
        const widthBuf = Buffer.alloc(4);
        const heightBuf = Buffer.alloc(4);
        Gdiplus.GdipGetImageWidth(image, widthBuf.ptr);
        Gdiplus.GdipGetImageHeight(image, heightBuf.ptr);
        const width = widthBuf.readUInt32LE(0);
        const height = heightBuf.readUInt32LE(0);

        const xDpiBuf = Buffer.alloc(4);
        const yDpiBuf = Buffer.alloc(4);
        Gdiplus.GdipGetImageHorizontalResolution(image, xDpiBuf.ptr);
        Gdiplus.GdipGetImageVerticalResolution(image, yDpiBuf.ptr);

        const pixelFormatBuf = Buffer.alloc(4);
        Gdiplus.GdipGetImagePixelFormat(image, pixelFormatBuf.ptr);
        const pixelFormat = pixelFormatBuf.readInt32LE(0);

        const imageFlagsBuf = Buffer.alloc(4);
        Gdiplus.GdipGetImageFlags(image, imageFlagsBuf.ptr);
        const imageFlagsRaw = imageFlagsBuf.readInt32LE(0);

        const imageTypeBuf = Buffer.alloc(4);
        Gdiplus.GdipGetImageType(image, imageTypeBuf.ptr);
        const imageType = imageTypeBuf.readInt32LE(0);

        const frameDimCountBuf = Buffer.alloc(4);
        Gdiplus.GdipImageGetFrameDimensionsCount(image, frameDimCountBuf.ptr);
        const frameDimCount = frameDimCountBuf.readUInt32LE(0);

        let frameCount = 1;
        if (frameDimCount > 0) {
          // Read the first frame dimension's GUID and ask for its frame count.
          const guidsBuf = Buffer.alloc(frameDimCount * 16);
          Gdiplus.GdipImageGetFrameDimensionsList(image, guidsBuf.ptr, frameDimCount);
          const frameDimGuid = guidsBuf.subarray(0, 16);
          const frameCountBuf = Buffer.alloc(4);
          Gdiplus.GdipImageGetFrameCount(image, frameDimGuid.ptr, frameCountBuf.ptr);
          frameCount = frameCountBuf.readUInt32LE(0);
        }

        console.log(`  ${DIM}dimensions${RESET}      ${BOLD}${width} × ${height}${RESET} px`);
        console.log(`  ${DIM}dpi${RESET}             ${xDpiBuf.readFloatLE(0).toFixed(2)} × ${yDpiBuf.readFloatLE(0).toFixed(2)}`);
        console.log(`  ${DIM}pixel format${RESET}    0x${(pixelFormat >>> 0).toString(16).padStart(8, '0')} ${DIM}(${(pixelFormat >> 8) & 0xff}bpp)${RESET}`);
        console.log(`  ${DIM}image type${RESET}      ${ImageType[imageType] ?? imageType}`);
        console.log(`  ${DIM}flags${RESET}           0x${(imageFlagsRaw >>> 0).toString(16).padStart(8, '0')} ${DIM}(${flagList(imageFlagsRaw, ImageFlags as unknown as Record<string, number>)})${RESET}`);
        console.log(`  ${DIM}frame dims${RESET}      ${frameDimCount}`);
        console.log(`  ${DIM}frame count${RESET}     ${frameCount}`);

        // Property items (EXIF, etc.)
        const propCountBuf = Buffer.alloc(4);
        Gdiplus.GdipGetPropertyCount(image, propCountBuf.ptr);
        const propCount = propCountBuf.readUInt32LE(0);

        if (propCount > 0) {
          console.log(`  ${DIM}properties${RESET}      ${propCount}`);
          const propIdsBuf = Buffer.alloc(propCount * 4);
          Gdiplus.GdipGetPropertyIdList(image, propCount, propIdsBuf.ptr);
          const shown = Math.min(propCount, 10);
          for (let i = 0; i < shown; i++) {
            const propId = propIdsBuf.readUInt32LE(i * 4);
            const sizeBuf = Buffer.alloc(4);
            const sizeStatus = Gdiplus.GdipGetPropertyItemSize(image, propId, sizeBuf.ptr);
            if (sizeStatus !== Status.Ok) continue;
            const itemSize = sizeBuf.readUInt32LE(0);
            const itemBuf = Buffer.alloc(itemSize);
            Gdiplus.GdipGetPropertyItem(image, propId, itemSize, itemBuf.ptr);
            // PropertyItem layout: PROPID id (4) | ULONG length (4) | WORD type (2) | PAD (2) | VOID *value (8) → 20 bytes header
            const length = itemBuf.readUInt32LE(4);
            const type = itemBuf.readUInt16LE(8);
            console.log(`  ${DIM}    propId 0x${propId.toString(16).padStart(4, '0')}${RESET}  type=${type}  length=${length} bytes`);
          }
          if (propCount > shown) console.log(`  ${DIM}    … ${propCount - shown} more${RESET}`);
        }
      } finally {
        Gdiplus.GdipDisposeImage(image);
      }
    }
  } else {
    console.log(`\n${DIM}  tip: pass an image path as the first argument to inspect a specific file${RESET}`);
  }
} finally {
  Gdiplus.GdiplusShutdown(startupToken);
}
