import Winmm from '../index';

const timeCapsBuffer = Buffer.alloc(8);
const timeCapsStatus = Winmm.timeGetDevCaps(timeCapsBuffer.ptr, timeCapsBuffer.byteLength);

if (timeCapsStatus !== 0) {
  console.error(`timeGetDevCaps failed with status ${timeCapsStatus}.`);
  process.exit(1);
}

const timeCapsView = new DataView(timeCapsBuffer.buffer);
const version = Winmm.mmsystemGetVersion();
const minimumPeriodMilliseconds = timeCapsView.getUint32(0, true);
const maximumPeriodMilliseconds = timeCapsView.getUint32(4, true);

console.log(`WinMM version: 0x${version.toString(16)}`);
console.log(`Timer period range: ${minimumPeriodMilliseconds}ms - ${maximumPeriodMilliseconds}ms`);
console.log(`Current multimedia tick count: ${Winmm.timeGetTime()}ms`);
console.log(`Wave output devices: ${Winmm.waveOutGetNumDevs()}`);
console.log(`MIDI output devices: ${Winmm.midiOutGetNumDevs()}`);
console.log(`Joystick devices: ${Winmm.joyGetNumDevs()}`);
