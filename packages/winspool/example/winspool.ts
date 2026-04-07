import Winspool, { PrinterEnumFlags } from '../index';

// Get the default printer name using the sizing-call pattern
const sizeBuffer = Buffer.alloc(4);
Winspool.GetDefaultPrinterW(null, sizeBuffer.ptr);

const charsNeeded = sizeBuffer.readUInt32LE(0);

if (charsNeeded > 0) {
  const nameBuffer = Buffer.alloc(charsNeeded * 2);
  sizeBuffer.writeUInt32LE(charsNeeded, 0);

  const success = Winspool.GetDefaultPrinterW(nameBuffer.ptr, sizeBuffer.ptr);

  if (success) {
    const printerName = new TextDecoder('utf-16').decode(nameBuffer).replace(/\0.*$/, '');
    console.log(`Default printer: ${printerName}`);
  } else {
    console.log('No default printer set.');
  }
} else {
  console.log('No default printer set.');
}

// Enumerate local printers using the sizing-call pattern
const neededBuffer = Buffer.alloc(4);
const returnedBuffer = Buffer.alloc(4);

Winspool.EnumPrintersW(PrinterEnumFlags.PRINTER_ENUM_LOCAL, null, 2, null, 0, neededBuffer.ptr, returnedBuffer.ptr);

const bytesNeeded = neededBuffer.readUInt32LE(0);

if (bytesNeeded > 0) {
  const printerBuffer = Buffer.alloc(bytesNeeded);

  const enumSuccess = Winspool.EnumPrintersW(PrinterEnumFlags.PRINTER_ENUM_LOCAL, null, 2, printerBuffer.ptr, printerBuffer.byteLength, neededBuffer.ptr, returnedBuffer.ptr);

  if (enumSuccess) {
    const count = returnedBuffer.readUInt32LE(0);
    console.log(`\nFound ${count} local printer(s).`);

    // PRINTER_INFO_2 starts with pServerName (pointer, 8 bytes on x64),
    // then pPrinterName (pointer, 8 bytes on x64)
    const view = new DataView(printerBuffer.buffer);

    for (let index = 0; index < count; index++) {
      // PRINTER_INFO_2 is a large struct; pPrinterName is at offset 8 from the start
      // Each PRINTER_INFO_2 is 136 bytes on x64
      const structOffset = index * 136;
      const pPrinterNameAddr = view.getBigUint64(structOffset + 8, true);

      if (pPrinterNameAddr !== 0n) {
        // Convert absolute pointer to offset within our buffer
        const offset = Number(pPrinterNameAddr - BigInt(printerBuffer.ptr));
        const nameSlice = printerBuffer.subarray(offset, offset + 520);
        const name = new TextDecoder('utf-16').decode(nameSlice).replace(/\0.*$/, '');
        console.log(`  ${index + 1}. ${name}`);
      }
    }
  } else {
    console.error('EnumPrintersW failed.');
  }
} else {
  console.log('\nNo local printers found.');
}
