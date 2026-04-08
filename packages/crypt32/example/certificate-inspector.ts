/**
 * Certificate Store Inspector — audits the Windows certificate stores.
 *
 * Opens three system certificate stores (MY/Personal, ROOT/Trusted Roots,
 * CA/Intermediate CAs) via CertOpenSystemStoreW. Iterates each store with
 * CertEnumCertificatesInStore. For each certificate, reads the subject and
 * issuer names via CertGetNameStringW (CERT_NAME_SIMPLE_DISPLAY_TYPE = 4),
 * and extracts the serial number from the CERT_CONTEXT -> pCertInfo -> SerialNumber.
 *
 * CERT_CONTEXT (x64):
 *   offset 0:  dwCertEncodingType (u32)
 *   offset 4:  padding (4 bytes)
 *   offset 8:  pbCertEncoded (ptr)
 *   offset 16: cbCertEncoded (u32)
 *   offset 20: padding (4 bytes)
 *   offset 24: pCertInfo (ptr)
 *   offset 32: hCertStore (ptr)
 *   Total: 40 bytes
 *
 * CERT_INFO has SerialNumber (CRYPT_INTEGER_BLOB) at offset 8:
 *   offset 8:  cbData (u32)
 *   offset 12: padding (4 bytes)
 *   offset 16: pbData (ptr)
 *
 * APIs demonstrated: CertOpenSystemStoreW, CertEnumCertificatesInStore,
 *   CertGetNameStringW, CertCloseStore
 *
 * Run: bun run example/certificate-inspector.ts
 */

import { toArrayBuffer, type Pointer } from 'bun:ffi';

import Crypt32 from '../index';

const CERT_NAME_SIMPLE_DISPLAY_TYPE = 4;
const CERT_NAME_ISSUER_FLAG = 0x1;

function getCertName(certContextPtr: Pointer, isIssuer: boolean): string {
  const nameBuf = Buffer.alloc(512);
  const flags = isIssuer ? CERT_NAME_ISSUER_FLAG : 0;
  const charsCopied = Crypt32.CertGetNameStringW(
    certContextPtr, CERT_NAME_SIMPLE_DISPLAY_TYPE, flags, null, nameBuf.ptr, 256,
  );

  if (charsCopied <= 1) return '(unknown)';
  return nameBuf.subarray(0, (charsCopied - 1) * 2).toString('utf16le');
}

function getSerialNumber(certContextPtr: Pointer): string {
  // Read pCertInfo pointer from CERT_CONTEXT at offset 24
  const ctxBuf = Buffer.from(toArrayBuffer(certContextPtr, 0, 40));
  const pCertInfoAddr = ctxBuf.readBigUInt64LE(24);

  if (pCertInfoAddr === 0n) return '(unavailable)';

  // In CERT_INFO, SerialNumber is a CRYPT_INTEGER_BLOB at offset 8
  // CRYPT_INTEGER_BLOB: cbData (u32) at +0, padding at +4, pbData (ptr) at +8
  const certInfoBuf = Buffer.from(toArrayBuffer(Number(pCertInfoAddr) as unknown as Pointer, 0, 24));
  const serialSize = certInfoBuf.readUInt32LE(8);
  const serialDataPtr = certInfoBuf.readBigUInt64LE(16);

  if (serialSize === 0 || serialDataPtr === 0n) return '(empty)';

  // Serial number bytes are in little-endian order; reverse for display
  const serialBytes = Buffer.from(toArrayBuffer(Number(serialDataPtr) as unknown as Pointer, 0, Math.min(serialSize, 20)));
  const hexParts: string[] = [];
  for (let i = serialSize - 1; i >= 0; i--) {
    if (i < serialBytes.byteLength) {
      hexParts.push(serialBytes[i]!.toString(16).padStart(2, '0'));
    }
  }
  return hexParts.join(':');
}

const stores: Array<{ name: string; displayName: string }> = [
  { name: 'MY', displayName: 'Personal (MY)' },
  { name: 'ROOT', displayName: 'Trusted Root CAs (ROOT)' },
  { name: 'CA', displayName: 'Intermediate CAs (CA)' },
];

console.log('');
console.log('================================================================');
console.log('              CERTIFICATE STORE INSPECTOR');
console.log(`              ${new Date().toLocaleString()}`);
console.log('================================================================');

let totalCerts = 0;

for (const store of stores) {
  const storeNameWide = Buffer.from(store.name + '\0', 'utf16le');
  const hStore = Crypt32.CertOpenSystemStoreW(0n, storeNameWide.ptr);

  console.log(`\n--- ${store.displayName} ---\n`);

  if (hStore === 0n) {
    console.log('  Could not open store.\n');
    continue;
  }

  let certIndex = 0;
  let prevContext: Pointer | null = null;

  while (true) {
    const certContext = Crypt32.CertEnumCertificatesInStore(hStore, prevContext);

    if (!certContext || certContext === 0) break;

    certIndex++;
    totalCerts++;

    const certPtr = certContext as unknown as Pointer;
    const subject = getCertName(certPtr, false);
    const issuer = getCertName(certPtr, true);
    const serial = getSerialNumber(certPtr);

    console.log(`  [${certIndex}] Subject: ${subject}`);
    console.log(`      Issuer:  ${issuer}`);
    console.log(`      Serial:  ${serial}`);
    console.log('');

    // Pass current context as prevContext for next iteration
    // CertEnumCertificatesInStore frees the previous context automatically
    prevContext = certPtr;
  }

  if (certIndex === 0) {
    console.log('  (no certificates in this store)\n');
  } else {
    console.log(`  Total: ${certIndex} certificate(s)\n`);
  }

  Crypt32.CertCloseStore(hStore, 0);
}

console.log('================================================================');
console.log(`  Grand total: ${totalCerts} certificate(s) across ${stores.length} stores`);
console.log('================================================================');
