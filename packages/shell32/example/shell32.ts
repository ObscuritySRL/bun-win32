import { type Pointer, read } from 'bun:ffi';
import Shell32 from '../index';

// Check if we are running as admin
const isAdmin = Shell32.IsUserAnAdmin();
console.log(`Running as admin: ${!!isAdmin}`);

// Get the known folder path for APPDATA (CSIDL_APPDATA = 0x001A)
const pathBuffer = Buffer.alloc(520); // MAX_PATH * 2 (wide chars)

const hr = Shell32.SHGetFolderPathW(0n, 0x001a, 0n, 0, pathBuffer.ptr);

if (hr === 0) {
  const appData = pathBuffer.toString('utf16le').replace(/\0+$/, '');
  console.log(`APPDATA: ${appData}`);
} else {
  console.error(`SHGetFolderPathW failed with HRESULT: 0x${(hr >>> 0).toString(16)}`);
}

// Parse the current command line with CommandLineToArgvW
const cmdLine = Buffer.from('program.exe --flag "hello world"\0', 'utf16le');
const numArgs = Buffer.alloc(4);

const argvPtr = Shell32.CommandLineToArgvW(cmdLine.ptr, numArgs.ptr);

if (argvPtr) {
  const argc = numArgs.readInt32LE(0);
  console.log(`\nCommandLineToArgvW parsed ${argc} arguments:`);

  for (let i = 0; i < argc; i++) {
    const strPtr = read.ptr(argvPtr, i * 8) as Pointer;
    // Read wide string: scan for null terminator
    let len = 0;
    while (read.u16(strPtr as Pointer, len * 2) !== 0) len++;
    const argBuf = Buffer.alloc(len * 2);
    for (let j = 0; j < len; j++) {
      argBuf.writeUInt16LE(read.u16(strPtr as Pointer, j * 2), j * 2);
    }
    console.log(`  argv[${i}]: ${argBuf.toString('utf16le')}`);
  }
}

// Query the Recycle Bin info for drive C:
const rbInfoSize = 24; // sizeof(SHQUERYRBINFO) on x64
const rbInfo = Buffer.alloc(rbInfoSize);
new DataView(rbInfo.buffer).setUint32(0, rbInfoSize, true); // cbSize

const drivePath = Buffer.from('C:\\\0', 'utf16le');
const rbHr = Shell32.SHQueryRecycleBinW(drivePath.ptr, rbInfo.ptr);

if (rbHr === 0) {
  const view = new DataView(rbInfo.buffer);
  const numItems = view.getBigInt64(8, true);
  const totalSize = view.getBigInt64(16, true);
  console.log(`\nRecycle Bin (C:):`);
  console.log(`  Items: ${numItems}`);
  console.log(`  Size:  ${Number(totalSize) / 1_048_576} MB`);
} else {
  console.error(`SHQueryRecycleBinW failed with HRESULT: 0x${(rbHr >>> 0).toString(16)}`);
}
