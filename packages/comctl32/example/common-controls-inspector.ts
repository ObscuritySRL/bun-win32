/**
 * Common Controls Inspector
 *
 * A diagnostic tool that inspects the installed comctl32.dll runtime: its
 * reported version, which common-control class families can be initialized on
 * this host, and the behavior of the ImageList subsystem under a grid of
 * `ImageListCreateFlags` combinations. Each create succeeds or fails, and for
 * every successful list the inspector round-trips background color and icon
 * size to prove the handle is live.
 *
 * APIs demonstrated:
 *   - Comctl32.DllGetVersion           (report comctl32 runtime version)
 *   - Comctl32.InitCommonControls      (initialize legacy common-control set)
 *   - Comctl32.InitCommonControlsEx    (probe individual class families)
 *   - Comctl32.ImageList_Create        (allocate an image list)
 *   - Comctl32.ImageList_GetImageCount (verify handle liveness)
 *   - Comctl32.ImageList_GetIconSize   (read back per-icon dimensions)
 *   - Comctl32.ImageList_SetIconSize   (resize, forcing a reset)
 *   - Comctl32.ImageList_GetBkColor    (read background color)
 *   - Comctl32.ImageList_SetBkColor    (set background color)
 *   - Comctl32.ImageList_Duplicate     (clone a handle)
 *   - Comctl32.ImageList_Destroy       (free handles)
 *
 * Run: bun run example/common-controls-inspector.ts
 */

import Comctl32, { DllVersionPlatform, ImageListCreateFlags, InitCommonControlsFlags } from '../index';

Comctl32.Preload(['DllGetVersion', 'ImageList_Create', 'ImageList_Destroy', 'ImageList_Duplicate', 'ImageList_GetBkColor', 'ImageList_GetIconSize', 'ImageList_GetImageCount', 'ImageList_SetBkColor', 'ImageList_SetIconSize', 'InitCommonControls', 'InitCommonControlsEx']);

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  white: '\x1b[97m',
  yellow: '\x1b[33m',
} as const;

const DLLVERSIONINFO_SIZE_BYTES = 20;
const INITCOMMONCONTROLSEX_SIZE_BYTES = 8;
const CLR_NONE = 0xffff_ffff;

const CLASS_FAMILIES: { flag: number; label: string }[] = [
  { flag: InitCommonControlsFlags.ICC_ANIMATE_CLASS, label: 'ICC_ANIMATE_CLASS' },
  { flag: InitCommonControlsFlags.ICC_BAR_CLASSES, label: 'ICC_BAR_CLASSES' },
  { flag: InitCommonControlsFlags.ICC_COOL_CLASSES, label: 'ICC_COOL_CLASSES' },
  { flag: InitCommonControlsFlags.ICC_DATE_CLASSES, label: 'ICC_DATE_CLASSES' },
  { flag: InitCommonControlsFlags.ICC_HOTKEY_CLASS, label: 'ICC_HOTKEY_CLASS' },
  { flag: InitCommonControlsFlags.ICC_INTERNET_CLASSES, label: 'ICC_INTERNET_CLASSES' },
  { flag: InitCommonControlsFlags.ICC_LINK_CLASS, label: 'ICC_LINK_CLASS' },
  { flag: InitCommonControlsFlags.ICC_LISTVIEW_CLASSES, label: 'ICC_LISTVIEW_CLASSES' },
  { flag: InitCommonControlsFlags.ICC_NATIVEFNTCTL_CLASS, label: 'ICC_NATIVEFNTCTL_CLASS' },
  { flag: InitCommonControlsFlags.ICC_PAGESCROLLER_CLASS, label: 'ICC_PAGESCROLLER_CLASS' },
  { flag: InitCommonControlsFlags.ICC_PROGRESS_CLASS, label: 'ICC_PROGRESS_CLASS' },
  { flag: InitCommonControlsFlags.ICC_STANDARD_CLASSES, label: 'ICC_STANDARD_CLASSES' },
  { flag: InitCommonControlsFlags.ICC_TAB_CLASSES, label: 'ICC_TAB_CLASSES' },
  { flag: InitCommonControlsFlags.ICC_TREEVIEW_CLASSES, label: 'ICC_TREEVIEW_CLASSES' },
  { flag: InitCommonControlsFlags.ICC_UPDOWN_CLASS, label: 'ICC_UPDOWN_CLASS' },
  { flag: InitCommonControlsFlags.ICC_USEREX_CLASSES, label: 'ICC_USEREX_CLASSES' },
];

const IMAGE_LIST_MATRIX: { cGrow: number; cInitial: number; cx: number; cy: number; flags: number; label: string }[] = [
  { cGrow: 4, cInitial: 8, cx: 16, cy: 16, flags: ImageListCreateFlags.ILC_COLOR32, label: '16×16 COLOR32' },
  { cGrow: 4, cInitial: 8, cx: 16, cy: 16, flags: ImageListCreateFlags.ILC_COLOR32 | ImageListCreateFlags.ILC_MASK, label: '16×16 COLOR32 + MASK' },
  { cGrow: 2, cInitial: 4, cx: 24, cy: 24, flags: ImageListCreateFlags.ILC_COLOR24, label: '24×24 COLOR24' },
  { cGrow: 2, cInitial: 4, cx: 32, cy: 32, flags: ImageListCreateFlags.ILC_COLOR32 | ImageListCreateFlags.ILC_HIGHQUALITYSCALE, label: '32×32 COLOR32 HQ' },
  { cGrow: 2, cInitial: 2, cx: 48, cy: 48, flags: ImageListCreateFlags.ILC_COLOR32 | ImageListCreateFlags.ILC_ORIGINALSIZE, label: '48×48 COLOR32 ORIGINAL' },
  { cGrow: 1, cInitial: 1, cx: 16, cy: 16, flags: ImageListCreateFlags.ILC_COLOR4, label: '16×16 COLOR4 (legacy)' },
];

function readComctl32Version(): { build: number; major: number; minor: number; platform: string } {
  const dlvInfoBuffer = Buffer.alloc(DLLVERSIONINFO_SIZE_BYTES);
  dlvInfoBuffer.writeUInt32LE(DLLVERSIONINFO_SIZE_BYTES, 0);

  const queryResult = Comctl32.DllGetVersion(dlvInfoBuffer.ptr);

  if (queryResult !== 0) {
    throw new Error(`DllGetVersion failed with 0x${queryResult.toString(16)}`);
  }

  const platformValue = dlvInfoBuffer.readUInt32LE(16);
  const platformName = DllVersionPlatform[platformValue] ?? `0x${platformValue.toString(16)}`;

  return {
    build: dlvInfoBuffer.readUInt32LE(12),
    major: dlvInfoBuffer.readUInt32LE(4),
    minor: dlvInfoBuffer.readUInt32LE(8),
    platform: platformName,
  };
}

function probeClassFamily(familyFlag: number): boolean {
  const initCommonControlsExBuffer = Buffer.alloc(INITCOMMONCONTROLSEX_SIZE_BYTES);
  initCommonControlsExBuffer.writeUInt32LE(INITCOMMONCONTROLSEX_SIZE_BYTES, 0);
  initCommonControlsExBuffer.writeUInt32LE(familyFlag, 4);
  return Comctl32.InitCommonControlsEx(initCommonControlsExBuffer.ptr) !== 0;
}

function formatColorRef(colorReference: number): string {
  if (colorReference === CLR_NONE) {
    return 'CLR_NONE';
  }

  const redChannel = colorReference & 0xff;
  const greenChannel = (colorReference >>> 8) & 0xff;
  const blueChannel = (colorReference >>> 16) & 0xff;
  return `rgb(${redChannel},${greenChannel},${blueChannel})`;
}

function readImageListIconSize(imageListHandle: bigint): { cx: number; cy: number } | null {
  const cxBuffer = Buffer.alloc(4);
  const cyBuffer = Buffer.alloc(4);

  if (Comctl32.ImageList_GetIconSize(imageListHandle, cxBuffer.ptr, cyBuffer.ptr) === 0) {
    return null;
  }

  return {
    cx: cxBuffer.readInt32LE(0),
    cy: cyBuffer.readInt32LE(0),
  };
}

function padRight(text: string, columnWidth: number): string {
  if (text.length >= columnWidth) {
    return text;
  }

  return text + ' '.repeat(columnWidth - text.length);
}

console.log(`${ANSI.bold}${ANSI.cyan}Common Controls Inspector${ANSI.reset}`);
console.log(`${ANSI.dim}Probing comctl32.dll runtime capabilities${ANSI.reset}`);
console.log('');

const comctl32Version = readComctl32Version();
console.log(`${ANSI.bold}${ANSI.white}Runtime${ANSI.reset}`);
console.log(`  ${ANSI.dim}Version ${ANSI.reset} ${ANSI.green}v${comctl32Version.major}.${comctl32Version.minor}.${comctl32Version.build}${ANSI.reset}`);
console.log(`  ${ANSI.dim}Platform${ANSI.reset} ${comctl32Version.platform}`);
console.log('');

Comctl32.InitCommonControls();
console.log(`${ANSI.bold}${ANSI.white}Class families${ANSI.reset}`);

let initializedFamilyCount = 0;

for (const classFamily of CLASS_FAMILIES) {
  const initializedSuccessfully = probeClassFamily(classFamily.flag);

  if (initializedSuccessfully) {
    initializedFamilyCount++;
  }

  const statusGlyph = initializedSuccessfully ? `${ANSI.green}✓${ANSI.reset}` : `${ANSI.red}✗${ANSI.reset}`;
  const hexFlag = `0x${classFamily.flag.toString(16).padStart(8, '0')}`;
  console.log(`  ${statusGlyph} ${padRight(classFamily.label, 26)} ${ANSI.dim}${hexFlag}${ANSI.reset}`);
}

console.log(`  ${ANSI.dim}${initializedFamilyCount}/${CLASS_FAMILIES.length} initialized successfully${ANSI.reset}`);
console.log('');

console.log(`${ANSI.bold}${ANSI.white}ImageList matrix${ANSI.reset}`);
console.log(`  ${ANSI.dim}${padRight('configuration', 32)} ${padRight('handle', 18)} ${padRight('count', 6)} ${padRight('size', 10)} background${ANSI.reset}`);

let successfulCreationCount = 0;

for (const matrixEntry of IMAGE_LIST_MATRIX) {
  const imageListHandle = Comctl32.ImageList_Create(matrixEntry.cx, matrixEntry.cy, matrixEntry.flags, matrixEntry.cInitial, matrixEntry.cGrow);

  if (imageListHandle === 0n) {
    console.log(`  ${ANSI.red}✗${ANSI.reset} ${padRight(matrixEntry.label, 30)} ${ANSI.red}ImageList_Create failed${ANSI.reset}`);
    continue;
  }

  successfulCreationCount++;

  const imageCount = Comctl32.ImageList_GetImageCount(imageListHandle);
  const iconSize = readImageListIconSize(imageListHandle);
  const sizeText = iconSize !== null ? `${iconSize.cx}×${iconSize.cy}` : '?';

  const previousBackgroundColor = Comctl32.ImageList_GetBkColor(imageListHandle);
  Comctl32.ImageList_SetBkColor(imageListHandle, 0x00_33_88_cc);
  const appliedBackgroundColor = Comctl32.ImageList_GetBkColor(imageListHandle);

  Comctl32.ImageList_SetIconSize(imageListHandle, matrixEntry.cx * 2, matrixEntry.cy * 2);
  const resizedIconSize = readImageListIconSize(imageListHandle);
  const duplicatedHandle = Comctl32.ImageList_Duplicate(imageListHandle);

  console.log(`  ${ANSI.green}✓${ANSI.reset} ${padRight(matrixEntry.label, 30)} ${padRight(`0x${imageListHandle.toString(16)}`, 18)} ${padRight(String(imageCount), 6)} ${padRight(sizeText, 10)} ${formatColorRef(previousBackgroundColor)} → ${formatColorRef(appliedBackgroundColor)}`);

  if (resizedIconSize !== null) {
    console.log(`    ${ANSI.dim}resized ${sizeText} → ${resizedIconSize.cx}×${resizedIconSize.cy} (ImageList_SetIconSize clears the list per MSDN)${ANSI.reset}`);
  }

  if (duplicatedHandle !== 0n) {
    console.log(`    ${ANSI.dim}duplicated handle 0x${duplicatedHandle.toString(16)}${ANSI.reset}`);

    if (Comctl32.ImageList_Destroy(duplicatedHandle) === 0) {
      console.log(`    ${ANSI.yellow}ImageList_Destroy(duplicate) returned 0${ANSI.reset}`);
    }
  }

  if (Comctl32.ImageList_Destroy(imageListHandle) === 0) {
    console.log(`    ${ANSI.yellow}ImageList_Destroy(original) returned 0${ANSI.reset}`);
  }
}

console.log(`  ${ANSI.dim}${successfulCreationCount}/${IMAGE_LIST_MATRIX.length} configurations created successfully${ANSI.reset}`);

if (Comctl32.ImageList_Destroy(0n) === 0) {
  console.log(`  ${ANSI.dim}(ImageList_Destroy(NULL) returned FALSE — nullable handle honored)${ANSI.reset}`);
}

console.log('');
console.log(`${ANSI.bold}${ANSI.cyan}Inspection complete${ANSI.reset}`);
