/**
 * Multimedia Device Capabilities Audit
 *
 * Enumerates every multimedia device visible to the Windows waveOut, waveIn,
 * midiOut, midiIn, aux, and joystick subsystems and prints their capabilities.
 *
 * For each device category the audit calls the corresponding GetNumDevs to find
 * how many devices exist, then iterates with GetDevCapsW to read the native
 * capability struct. Fields are decoded from the raw buffer at their documented
 * offsets (matching the Windows SDK WAVEOUTCAPSW, MIDIOUTCAPSW, etc. layouts).
 *
 * Wave format support flags are decoded to human-readable strings like
 * "44.1 kHz stereo 16-bit". MIDI technology types and joystick axis counts are
 * also translated.
 *
 * APIs demonstrated:
 *   waveOutGetNumDevs, waveOutGetDevCapsW, waveInGetNumDevs, waveInGetDevCapsW,
 *   midiOutGetNumDevs, midiOutGetDevCapsW, midiInGetNumDevs, midiInGetDevCapsW,
 *   auxGetNumDevs, auxGetDevCapsW, joyGetNumDevs, joyGetDevCapsW
 *
 * Run with: bun run example/device-audit.ts
 */

import Winmm from '../index';

const MMRESULT_NO_ERROR = 0;

// WAVEOUTCAPSW layout (total 84 bytes with alignment):
// Offset  Field             Size
// 0       wMid              2    Manufacturer ID
// 2       wPid              2    Product ID
// 4       vDriverVersion    4    Driver version (hi=major, lo=minor)
// 8       szPname           64   Product name (32 WCHAR)
// 72      dwFormats         4    Supported format bitmask
// 76      wChannels         2    Max simultaneous channels
// 78      wReserved1        2    Padding
// 80      dwSupport         4    Optional features (volume, pitch, etc.)
const WAVEOUTCAPSW_SIZE = 84;

// WAVEINCAPSW layout (total 80 bytes):
// Same as WAVEOUTCAPSW but without dwSupport at the end.
// Offset 72: dwFormats (4), Offset 76: wChannels (2), Offset 78: wReserved1 (2)
const WAVEINCAPSW_SIZE = 80;

// MIDIOUTCAPSW layout (total 84 bytes):
// 0   wMid           2
// 2   wPid           2
// 4   vDriverVersion 4
// 8   szPname        64  (32 WCHAR)
// 72  wTechnology    2
// 74  wVoices        2
// 76  wNotes         2
// 78  wChannelMask   2
// 80  dwSupport      4
const MIDIOUTCAPSW_SIZE = 84;

// MIDIINCAPSW layout (total 76 bytes):
// 0   wMid           2
// 2   wPid           2
// 4   vDriverVersion 4
// 8   szPname        64  (32 WCHAR)
// 72  dwSupport      4
const MIDIINCAPSW_SIZE = 76;

// AUXCAPSW layout (total 80 bytes):
// 0   wMid           2
// 2   wPid           2
// 4   vDriverVersion 4
// 8   szPname        64  (32 WCHAR)
// 72  wTechnology    2
// 74  wReserved1     2
// 76  dwSupport      4
const AUXCAPSW_SIZE = 80;

// JOYCAPSW layout (total 728 bytes):
// 0    wMid              2
// 2    wPid              2
// 4    szPname           64  (32 WCHAR)
// 68   wXmin             4
// 72   wXmax             4
// 76   wYmin             4
// 80   wYmax             4
// 84   wZmin             4
// 88   wZmax             4
// 92   wNumButtons       4
// 96   wPeriodMin        4
// 100  wPeriodMax        4
// 104  wRmin             4
// 108  wRmax             4
// 112  wUmin             4
// 116  wUmax             4
// 120  wCaps             4
// 124  wMaxAxes          4
// 128  wNumAxes          4
// 132  wMaxButtons       4
// 136  szRegKey          64  (32 WCHAR)
// 200  szOEMVxD          520 (260 WCHAR)
const JOYCAPSW_SIZE = 728;

// Wave format support flag definitions. Each flag indicates support for a
// specific combination of sample rate, channel count, and bit depth.
const WAVE_FORMAT_FLAGS: [number, string][] = [
  [0x00000001, '11.025 kHz mono 8-bit'],
  [0x00000002, '11.025 kHz stereo 8-bit'],
  [0x00000004, '11.025 kHz mono 16-bit'],
  [0x00000008, '11.025 kHz stereo 16-bit'],
  [0x00000010, '22.05 kHz mono 8-bit'],
  [0x00000020, '22.05 kHz stereo 8-bit'],
  [0x00000040, '22.05 kHz mono 16-bit'],
  [0x00000080, '22.05 kHz stereo 16-bit'],
  [0x00000100, '44.1 kHz mono 8-bit'],
  [0x00000200, '44.1 kHz stereo 8-bit'],
  [0x00000400, '44.1 kHz mono 16-bit'],
  [0x00000800, '44.1 kHz stereo 16-bit'],
  [0x00001000, '48 kHz mono 8-bit'],
  [0x00002000, '48 kHz stereo 8-bit'],
  [0x00004000, '48 kHz mono 16-bit'],
  [0x00008000, '48 kHz stereo 16-bit'],
  [0x00010000, '96 kHz mono 8-bit'],
  [0x00020000, '96 kHz stereo 8-bit'],
  [0x00040000, '96 kHz mono 16-bit'],
  [0x00080000, '96 kHz stereo 16-bit'],
];

// MIDI output technology types
const MIDI_TECHNOLOGY_NAMES: Record<number, string> = {
  1: 'MIDI hardware port',
  2: 'Synthesizer',
  3: 'Square wave synthesizer',
  4: 'FM synthesizer',
  5: 'MIDI mapper',
  6: 'Wavetable synthesizer',
  7: 'Software synthesizer',
};

// Aux device technology types
const AUX_TECHNOLOGY_NAMES: Record<number, string> = {
  1: 'Audio from CD',
  2: 'Auxiliary audio from line input',
};

// Joystick capability flags
const JOY_CAP_FLAGS: [number, string][] = [
  [0x0001, 'JOYCAPS_HASZ (Z axis)'],
  [0x0002, 'JOYCAPS_HASR (R axis)'],
  [0x0004, 'JOYCAPS_HASU (U axis)'],
  [0x0008, 'JOYCAPS_HASV (V axis)'],
  [0x0010, 'JOYCAPS_HASPOV (point-of-view hat)'],
  [0x0020, 'JOYCAPS_POV4DIR (discrete POV)'],
  [0x0040, 'JOYCAPS_POVCTS (continuous POV)'],
];

/** Read a null-terminated UTF-16LE string from a buffer region. */
function readWideString(buffer: Buffer, offset: number, maxBytes: number): string {
  return buffer.subarray(offset, offset + maxBytes).toString('utf16le').replace(/\0.*$/, '');
}

/** Decode a wave format bitmask into an array of human-readable format strings. */
function decodeWaveFormats(formatMask: number): string[] {
  const supported: string[] = [];
  for (const [flag, label] of WAVE_FORMAT_FLAGS) {
    if (formatMask & flag) supported.push(label);
  }
  return supported;
}

/** Format a driver version DWORD as "major.minor". */
function formatDriverVersion(version: number): string {
  const major = (version >>> 8) & 0xff;
  const minor = version & 0xff;
  return `${major}.${minor}`;
}

function auditWaveOutputDevices(): void {
  const count = Winmm.waveOutGetNumDevs();
  console.log(`\n  Wave Output Devices: ${count}`);

  for (let i = 0; i < count; i++) {
    const caps = Buffer.alloc(WAVEOUTCAPSW_SIZE);
    const status = Winmm.waveOutGetDevCapsW(BigInt(i), caps.ptr, WAVEOUTCAPSW_SIZE);
    if (status !== MMRESULT_NO_ERROR) {
      console.log(`    Device ${i}: GetDevCapsW failed (status ${status})`);
      continue;
    }

    const name = readWideString(caps, 8, 64);
    const driverVersion = caps.readUInt32LE(4);
    const formatMask = caps.readUInt32LE(72);
    const channels = caps.readUInt16LE(76);
    const support = caps.readUInt32LE(80);

    console.log(`\n    [${i}] ${name}`);
    console.log(`        Driver version : ${formatDriverVersion(driverVersion)}`);
    console.log(`        Channels       : ${channels}`);
    console.log(`        Support flags  : 0x${support.toString(16).padStart(8, '0')}`);

    const formats = decodeWaveFormats(formatMask);
    if (formats.length > 0) {
      console.log(`        Formats (${formats.length}):`);
      for (const fmt of formats) {
        console.log(`          + ${fmt}`);
      }
    } else {
      console.log(`        Formats: none reported`);
    }
  }
}

function auditWaveInputDevices(): void {
  const count = Winmm.waveInGetNumDevs();
  console.log(`\n  Wave Input Devices: ${count}`);

  for (let i = 0; i < count; i++) {
    const caps = Buffer.alloc(WAVEINCAPSW_SIZE);
    const status = Winmm.waveInGetDevCapsW(BigInt(i), caps.ptr, WAVEINCAPSW_SIZE);
    if (status !== MMRESULT_NO_ERROR) {
      console.log(`    Device ${i}: GetDevCapsW failed (status ${status})`);
      continue;
    }

    const name = readWideString(caps, 8, 64);
    const driverVersion = caps.readUInt32LE(4);
    const formatMask = caps.readUInt32LE(72);
    const channels = caps.readUInt16LE(76);

    console.log(`\n    [${i}] ${name}`);
    console.log(`        Driver version : ${formatDriverVersion(driverVersion)}`);
    console.log(`        Channels       : ${channels}`);

    const formats = decodeWaveFormats(formatMask);
    if (formats.length > 0) {
      console.log(`        Formats (${formats.length}):`);
      for (const fmt of formats) {
        console.log(`          + ${fmt}`);
      }
    } else {
      console.log(`        Formats: none reported`);
    }
  }
}

function auditMidiOutputDevices(): void {
  const count = Winmm.midiOutGetNumDevs();
  console.log(`\n  MIDI Output Devices: ${count}`);

  for (let i = 0; i < count; i++) {
    const caps = Buffer.alloc(MIDIOUTCAPSW_SIZE);
    const status = Winmm.midiOutGetDevCapsW(BigInt(i), caps.ptr, MIDIOUTCAPSW_SIZE);
    if (status !== MMRESULT_NO_ERROR) {
      console.log(`    Device ${i}: GetDevCapsW failed (status ${status})`);
      continue;
    }

    const name = readWideString(caps, 8, 64);
    const driverVersion = caps.readUInt32LE(4);
    const technology = caps.readUInt16LE(72);
    const voices = caps.readUInt16LE(74);
    const notes = caps.readUInt16LE(76);
    const channelMask = caps.readUInt16LE(78);
    const support = caps.readUInt32LE(80);

    const techName = MIDI_TECHNOLOGY_NAMES[technology] ?? `Unknown (${technology})`;

    console.log(`\n    [${i}] ${name}`);
    console.log(`        Driver version : ${formatDriverVersion(driverVersion)}`);
    console.log(`        Technology     : ${techName}`);
    console.log(`        Voices         : ${voices}`);
    console.log(`        Simultaneous   : ${notes} notes`);
    console.log(`        Channel mask   : 0x${channelMask.toString(16).padStart(4, '0')} (${countBits(channelMask)} channels)`);
    console.log(`        Support flags  : 0x${support.toString(16).padStart(8, '0')}`);
  }
}

function auditMidiInputDevices(): void {
  const count = Winmm.midiInGetNumDevs();
  console.log(`\n  MIDI Input Devices: ${count}`);

  for (let i = 0; i < count; i++) {
    const caps = Buffer.alloc(MIDIINCAPSW_SIZE);
    const status = Winmm.midiInGetDevCapsW(BigInt(i), caps.ptr, MIDIINCAPSW_SIZE);
    if (status !== MMRESULT_NO_ERROR) {
      console.log(`    Device ${i}: GetDevCapsW failed (status ${status})`);
      continue;
    }

    const name = readWideString(caps, 8, 64);
    const driverVersion = caps.readUInt32LE(4);
    const support = caps.readUInt32LE(72);

    console.log(`\n    [${i}] ${name}`);
    console.log(`        Driver version : ${formatDriverVersion(driverVersion)}`);
    console.log(`        Support flags  : 0x${support.toString(16).padStart(8, '0')}`);
  }
}

function auditAuxDevices(): void {
  const count = Winmm.auxGetNumDevs();
  console.log(`\n  Auxiliary Audio Devices: ${count}`);

  for (let i = 0; i < count; i++) {
    const caps = Buffer.alloc(AUXCAPSW_SIZE);
    const status = Winmm.auxGetDevCapsW(BigInt(i), caps.ptr, AUXCAPSW_SIZE);
    if (status !== MMRESULT_NO_ERROR) {
      console.log(`    Device ${i}: GetDevCapsW failed (status ${status})`);
      continue;
    }

    const name = readWideString(caps, 8, 64);
    const driverVersion = caps.readUInt32LE(4);
    const technology = caps.readUInt16LE(72);
    const support = caps.readUInt32LE(76);

    const techName = AUX_TECHNOLOGY_NAMES[technology] ?? `Unknown (${technology})`;

    console.log(`\n    [${i}] ${name}`);
    console.log(`        Driver version : ${formatDriverVersion(driverVersion)}`);
    console.log(`        Technology     : ${techName}`);
    console.log(`        Support flags  : 0x${support.toString(16).padStart(8, '0')}`);
  }
}

function auditJoystickDevices(): void {
  const count = Winmm.joyGetNumDevs();
  console.log(`\n  Joystick Devices (slots): ${count}`);

  if (count === 0) return;

  let connectedCount = 0;

  for (let i = 0; i < count; i++) {
    const caps = Buffer.alloc(JOYCAPSW_SIZE);
    const status = Winmm.joyGetDevCapsW(BigInt(i), caps.ptr, JOYCAPSW_SIZE);
    if (status !== MMRESULT_NO_ERROR) {
      // Status 167 = JOYERR_UNPLUGGED -- slot exists but no device attached
      continue;
    }

    connectedCount++;
    const name = readWideString(caps, 4, 64);
    const numButtons = caps.readUInt32LE(92);
    const maxButtons = caps.readUInt32LE(132);
    const numAxes = caps.readUInt32LE(128);
    const maxAxes = caps.readUInt32LE(124);
    const capFlags = caps.readUInt32LE(120);
    const periodMin = caps.readUInt32LE(96);
    const periodMax = caps.readUInt32LE(100);
    const regKey = readWideString(caps, 136, 64);

    console.log(`\n    [${i}] ${name || '(unnamed)'}`);
    console.log(`        Buttons        : ${numButtons} (max ${maxButtons})`);
    console.log(`        Axes           : ${numAxes} (max ${maxAxes})`);
    console.log(`        Poll period    : ${periodMin} - ${periodMax} ms`);
    if (regKey) {
      console.log(`        Registry key   : ${regKey}`);
    }

    const activeFlags: string[] = [];
    for (const [flag, label] of JOY_CAP_FLAGS) {
      if (capFlags & flag) activeFlags.push(label);
    }
    if (activeFlags.length > 0) {
      console.log(`        Capabilities:`);
      for (const cap of activeFlags) {
        console.log(`          + ${cap}`);
      }
    }

    // Show axis ranges
    const xMin = caps.readUInt32LE(68);
    const xMax = caps.readUInt32LE(72);
    const yMin = caps.readUInt32LE(76);
    const yMax = caps.readUInt32LE(80);
    console.log(`        X axis range   : ${xMin} - ${xMax}`);
    console.log(`        Y axis range   : ${yMin} - ${yMax}`);
    if (capFlags & 0x0001) {
      const zMin = caps.readUInt32LE(84);
      const zMax = caps.readUInt32LE(88);
      console.log(`        Z axis range   : ${zMin} - ${zMax}`);
    }
    if (capFlags & 0x0002) {
      const rMin = caps.readUInt32LE(104);
      const rMax = caps.readUInt32LE(108);
      console.log(`        R axis range   : ${rMin} - ${rMax}`);
    }
  }

  if (connectedCount === 0) {
    console.log('    (no joysticks connected)');
  }
}

/** Count the number of set bits in a 16-bit value. */
function countBits(value: number): number {
  let count = 0;
  let v = value;
  while (v) {
    count += v & 1;
    v >>>= 1;
  }
  return count;
}

function main(): void {
  console.log('=== Multimedia Device Capabilities Audit ===');

  auditWaveOutputDevices();
  auditWaveInputDevices();
  auditMidiOutputDevices();
  auditMidiInputDevices();
  auditAuxDevices();
  auditJoystickDevices();

  console.log('\nAudit complete.');
}

main();
