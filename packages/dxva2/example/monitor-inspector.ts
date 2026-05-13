/**
 * Monitor Inspector
 *
 * Enumerates every display monitor attached to the system, resolves each
 * GDI HMONITOR to its underlying physical monitors (one HMONITOR can map to
 * several physical panels — for example, on tiled displays), and dumps a
 * complete DDC/CI capability report per physical monitor:
 *
 *   - Device description as returned by the driver (PHYSICAL_MONITOR.szPhysicalMonitorDescription)
 *   - High-level capability bitmask (brightness / contrast / RGB / colour temp / display area / degauss / restore)
 *   - Supported colour temperature presets
 *   - Display technology type (CRT, TFT, OLED, plasma, …)
 *   - Brightness / contrast / per-channel RGB drive + gain ranges
 *   - Current colour temperature
 *   - Raw VESA MCCS capabilities string parsed from the low-level interface
 *   - Timing report (horizontal / vertical frequency, status byte)
 *
 * Useful for: building monitor-control UIs, verifying that a panel actually
 * implements MCCS before issuing Set* calls, capturing a "known-good"
 * baseline before automated colour calibration, or just figuring out what
 * a brand-new monitor will respond to.
 *
 * APIs demonstrated:
 *   - User32.EnumDisplayMonitors with a JSCallback
 *   - Dxva2.GetNumberOfPhysicalMonitorsFromHMONITOR
 *   - Dxva2.GetPhysicalMonitorsFromHMONITOR
 *   - Dxva2.GetMonitorCapabilities
 *   - Dxva2.GetMonitorTechnologyType
 *   - Dxva2.GetMonitorBrightness / GetMonitorContrast
 *   - Dxva2.GetMonitorRedGreenOrBlueDrive / Gain
 *   - Dxva2.GetMonitorColorTemperature
 *   - Dxva2.GetCapabilitiesStringLength / CapabilitiesRequestAndCapabilitiesReply
 *   - Dxva2.GetTimingReport
 *   - Dxva2.DestroyPhysicalMonitors
 *
 * Run: bun run example/monitor-inspector.ts
 */

import { JSCallback, type Pointer, toArrayBuffer } from 'bun:ffi';

import Dxva2, { MC_CAPS, MC_COLOR_TEMPERATURE, MC_DISPLAY_TECHNOLOGY_TYPE, MC_DRIVE_TYPE, MC_GAIN_TYPE, MC_SUPPORTED_COLOR_TEMPERATURE, PHYSICAL_MONITOR_DESCRIPTION_SIZE, PHYSICAL_MONITOR_SIZE } from '../index';
import User32 from '@bun-win32/user32';

Dxva2.Preload([
  'CapabilitiesRequestAndCapabilitiesReply',
  'DestroyPhysicalMonitors',
  'GetCapabilitiesStringLength',
  'GetMonitorBrightness',
  'GetMonitorCapabilities',
  'GetMonitorColorTemperature',
  'GetMonitorContrast',
  'GetMonitorRedGreenOrBlueDrive',
  'GetMonitorRedGreenOrBlueGain',
  'GetMonitorTechnologyType',
  'GetNumberOfPhysicalMonitorsFromHMONITOR',
  'GetPhysicalMonitorsFromHMONITOR',
  'GetTimingReport',
]);
User32.Preload(['EnumDisplayMonitors']);

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

interface MonitorEntry {
  hMonitor: bigint;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const collectedMonitors: MonitorEntry[] = [];

const enumCallback = new JSCallback(
  (hMonitor: bigint, _hdc: bigint, lprcMonitor: Pointer, _data: bigint): number => {
    const rectView = new Int32Array(toArrayBuffer(lprcMonitor, 0, 16));

    collectedMonitors.push({
      hMonitor,
      left: rectView[0]!,
      top: rectView[1]!,
      right: rectView[2]!,
      bottom: rectView[3]!,
    });

    return 1;
  },
  {
    args: ['u64', 'u64', 'ptr', 'i64'],
    returns: 'i32',
  },
);

User32.EnumDisplayMonitors(0n, null, enumCallback.ptr!, 0n);
enumCallback.close();

console.log(`${ANSI.bold}${ANSI.cyan}Monitor Inspector (dxva2.dll)${ANSI.reset}`);
console.log(`${ANSI.dim}${new Date().toISOString()}${ANSI.reset}`);
console.log(`${ANSI.dim}Found ${collectedMonitors.length} GDI HMONITOR(s) via EnumDisplayMonitors.${ANSI.reset}`);
console.log('');

const divider = '─'.repeat(80);

for (let monitorIndex = 0; monitorIndex < collectedMonitors.length; monitorIndex += 1) {
  const monitor = collectedMonitors[monitorIndex]!;
  const monitorWidth = monitor.right - monitor.left;
  const monitorHeight = monitor.bottom - monitor.top;

  console.log(divider);
  console.log(`${ANSI.bold}HMONITOR #${monitorIndex + 1}${ANSI.reset}  handle=${monitor.hMonitor}  ${ANSI.dim}rect=${monitor.left},${monitor.top}–${monitor.right},${monitor.bottom}  size=${monitorWidth}×${monitorHeight}${ANSI.reset}`);

  const countBuffer = Buffer.alloc(4);
  const countOk = Dxva2.GetNumberOfPhysicalMonitorsFromHMONITOR(monitor.hMonitor, countBuffer.ptr);

  if (countOk === 0) {
    console.log(`  ${ANSI.red}GetNumberOfPhysicalMonitorsFromHMONITOR failed${ANSI.reset}`);
    continue;
  }

  const physicalCount = countBuffer.readUInt32LE(0);
  const physicalArray = Buffer.alloc(PHYSICAL_MONITOR_SIZE * physicalCount);
  const enumOk = Dxva2.GetPhysicalMonitorsFromHMONITOR(monitor.hMonitor, physicalCount, physicalArray.ptr);

  if (enumOk === 0) {
    console.log(`  ${ANSI.red}GetPhysicalMonitorsFromHMONITOR failed${ANSI.reset}`);
    continue;
  }

  for (let physicalIndex = 0; physicalIndex < physicalCount; physicalIndex += 1) {
    const entryOffset = physicalIndex * PHYSICAL_MONITOR_SIZE;
    const physicalHandle = physicalArray.readBigUInt64LE(entryOffset);
    const description = physicalArray
      .subarray(entryOffset + 8, entryOffset + 8 + PHYSICAL_MONITOR_DESCRIPTION_SIZE * 2)
      .toString('utf16le')
      .replace(/\0.*$/, '');

    console.log('');
    console.log(`  ${ANSI.bold}Physical ${physicalIndex + 1}/${physicalCount}${ANSI.reset}  handle=${physicalHandle}  ${ANSI.magenta}${description}${ANSI.reset}`);

    const capsBuffer = Buffer.alloc(4);
    const colorTempBuffer = Buffer.alloc(4);

    if (Dxva2.GetMonitorCapabilities(physicalHandle, capsBuffer.ptr, colorTempBuffer.ptr) === 0) {
      console.log(`    ${ANSI.yellow}Capabilities not reported (monitor does not implement MCCS)${ANSI.reset}`);
    } else {
      const capabilityMask = capsBuffer.readUInt32LE(0);
      const supportedColorTempMask = colorTempBuffer.readUInt32LE(0);
      const supportedCapabilities = decodeFlags(capabilityMask, MC_CAPS, 'MC_CAPS_');
      const supportedColorTemps = decodeFlags(supportedColorTempMask, MC_SUPPORTED_COLOR_TEMPERATURE, 'MC_SUPPORTED_COLOR_TEMPERATURE_');

      console.log(`    Capabilities       ${ANSI.green}${supportedCapabilities.length ? supportedCapabilities.join(', ') : '(none)'}${ANSI.reset}`);
      console.log(`    Colour temp menu   ${supportedColorTemps.length ? supportedColorTemps.join(', ') : `${ANSI.dim}(none)${ANSI.reset}`}`);

      if (capabilityMask & MC_CAPS.MC_CAPS_MONITOR_TECHNOLOGY_TYPE) {
        const techBuffer = Buffer.alloc(4);
        if (Dxva2.GetMonitorTechnologyType(physicalHandle, techBuffer.ptr) !== 0) {
          const techValue = techBuffer.readUInt32LE(0);
          console.log(`    Technology         ${MC_DISPLAY_TECHNOLOGY_TYPE[techValue] ?? `(${techValue})`}`);
        }
      }

      if (capabilityMask & MC_CAPS.MC_CAPS_BRIGHTNESS) reportRange(physicalHandle, 'Brightness', 'GetMonitorBrightness');
      if (capabilityMask & MC_CAPS.MC_CAPS_CONTRAST) reportRange(physicalHandle, 'Contrast', 'GetMonitorContrast');

      if (capabilityMask & MC_CAPS.MC_CAPS_RED_GREEN_BLUE_DRIVE) {
        reportRgbChannel(physicalHandle, 'Drive', Dxva2.GetMonitorRedGreenOrBlueDrive, MC_DRIVE_TYPE.MC_RED_DRIVE, MC_DRIVE_TYPE.MC_GREEN_DRIVE, MC_DRIVE_TYPE.MC_BLUE_DRIVE);
      }

      if (capabilityMask & MC_CAPS.MC_CAPS_RED_GREEN_BLUE_GAIN) {
        reportRgbChannel(physicalHandle, 'Gain', Dxva2.GetMonitorRedGreenOrBlueGain, MC_GAIN_TYPE.MC_RED_GAIN, MC_GAIN_TYPE.MC_GREEN_GAIN, MC_GAIN_TYPE.MC_BLUE_GAIN);
      }

      if (capabilityMask & MC_CAPS.MC_CAPS_COLOR_TEMPERATURE) {
        const currentTempBuffer = Buffer.alloc(4);
        if (Dxva2.GetMonitorColorTemperature(physicalHandle, currentTempBuffer.ptr) !== 0) {
          const tempValue = currentTempBuffer.readUInt32LE(0);
          console.log(`    Colour temp now    ${MC_COLOR_TEMPERATURE[tempValue] ?? `(${tempValue})`}`);
        }
      }
    }

    const capLengthBuffer = Buffer.alloc(4);
    if (Dxva2.GetCapabilitiesStringLength(physicalHandle, capLengthBuffer.ptr) !== 0) {
      const capLength = capLengthBuffer.readUInt32LE(0);

      if (capLength > 0) {
        const capStringBuffer = Buffer.alloc(capLength);
        if (Dxva2.CapabilitiesRequestAndCapabilitiesReply(physicalHandle, capStringBuffer.ptr, capLength) !== 0) {
          const capString = capStringBuffer.subarray(0, Math.max(0, capLength - 1)).toString('ascii');
          console.log(`    MCCS string        ${ANSI.dim}${capString.length > 240 ? capString.slice(0, 237) + '...' : capString}${ANSI.reset}`);
        }
      }
    }

    const timingBuffer = Buffer.alloc(9);
    if (Dxva2.GetTimingReport(physicalHandle, timingBuffer.ptr) !== 0) {
      const horizontalHz = timingBuffer.readUInt32LE(0);
      const verticalHz = timingBuffer.readUInt32LE(4);
      const statusByte = timingBuffer.readUInt8(8);
      console.log(`    Timing report      ${(horizontalHz / 1000).toFixed(1)} kHz / ${(verticalHz / 100).toFixed(2)} Hz  ${ANSI.dim}status=0x${statusByte.toString(16).padStart(2, '0')}${ANSI.reset}`);
    }
  }

  Dxva2.DestroyPhysicalMonitors(physicalCount, physicalArray.ptr);
}

console.log(divider);
console.log(`${ANSI.dim}Tip: every Set* call should be gated by the matching MC_CAPS_* bit above — many monitors enumerate without honouring DDC/CI writes.${ANSI.reset}`);

function decodeFlags<TEnum extends Record<string, string | number>>(value: number, enumObject: TEnum, prefix: string): string[] {
  const names: string[] = [];

  for (const key of Object.keys(enumObject)) {
    if (!key.startsWith(prefix)) continue;
    const flagValue = enumObject[key as keyof TEnum];
    if (typeof flagValue !== 'number' || flagValue === 0) continue;
    if ((value & flagValue) === flagValue) {
      names.push(key.slice(prefix.length));
    }
  }

  return names;
}

function reportRange(physicalHandle: bigint, label: string, method: 'GetMonitorBrightness' | 'GetMonitorContrast'): void {
  const minBuffer = Buffer.alloc(4);
  const curBuffer = Buffer.alloc(4);
  const maxBuffer = Buffer.alloc(4);
  const ok = Dxva2[method](physicalHandle, minBuffer.ptr, curBuffer.ptr, maxBuffer.ptr);

  if (ok === 0) {
    console.log(`    ${label.padEnd(18)} ${ANSI.red}query failed${ANSI.reset}`);
    return;
  }

  const min = minBuffer.readUInt32LE(0);
  const cur = curBuffer.readUInt32LE(0);
  const max = maxBuffer.readUInt32LE(0);
  console.log(`    ${label.padEnd(18)} ${cur} ${ANSI.dim}(range ${min}–${max})${ANSI.reset} ${renderBar(cur, min, max)}`);
}

type RgbRangeQuery = (hMonitor: bigint, channel: number, min: Pointer, cur: Pointer, max: Pointer) => number;

function reportRgbChannel(physicalHandle: bigint, label: string, query: RgbRangeQuery, red: number, green: number, blue: number): void {
  const channels: [string, number, string][] = [
    ['Red  ', red, ANSI.red],
    ['Green', green, ANSI.green],
    ['Blue ', blue, ANSI.cyan],
  ];

  for (const [channelLabel, channelValue, channelColor] of channels) {
    const minBuffer = Buffer.alloc(4);
    const curBuffer = Buffer.alloc(4);
    const maxBuffer = Buffer.alloc(4);
    const ok = query(physicalHandle, channelValue, minBuffer.ptr, curBuffer.ptr, maxBuffer.ptr);

    if (ok === 0) {
      console.log(`    ${label} ${channelColor}${channelLabel}${ANSI.reset} ${ANSI.red}query failed${ANSI.reset}`);
      continue;
    }

    const min = minBuffer.readUInt32LE(0);
    const cur = curBuffer.readUInt32LE(0);
    const max = maxBuffer.readUInt32LE(0);
    console.log(`    ${label.padEnd(5)} ${channelColor}${channelLabel}${ANSI.reset}      ${cur} ${ANSI.dim}(range ${min}–${max})${ANSI.reset} ${renderBar(cur, min, max)}`);
  }
}

function renderBar(current: number, min: number, max: number): string {
  if (max <= min) return '';
  const width = 20;
  const fraction = Math.max(0, Math.min(1, (current - min) / (max - min)));
  const filled = Math.round(fraction * width);
  return `${ANSI.dim}[${'█'.repeat(filled)}${'░'.repeat(width - filled)}]${ANSI.reset}`;
}
