/**
 * Digital Identity Card — displays every form of the current user's Windows identity.
 *
 * Calls GetUserNameExW for each EXTENDED_NAME_FORMAT enum value using the standard
 * two-call sizing pattern: first call with null buffer to get the required size,
 * then allocate and call again. Some formats are only available on domain-joined
 * machines, so failures are expected and shown as "not available".
 *
 * APIs demonstrated: GetUserNameExW
 *
 * Run: bun run example/identity-card.ts
 */

import Secur32 from '../index';

const NAME_FORMATS: Array<{ id: number; label: string }> = [
  { id: 2, label: 'SAM-Compatible' },
  { id: 3, label: 'Display Name' },
  { id: 6, label: 'Unique ID (GUID)' },
  { id: 7, label: 'Canonical' },
  { id: 8, label: 'User Principal' },
  { id: 10, label: 'Service Principal' },
  { id: 12, label: 'DNS Domain' },
];

function getUserName(formatId: number): string | null {
  // First call: pass null buffer to discover the required size in characters
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(0);
  Secur32.GetUserNameExW(formatId, null, sizeBuf.ptr);

  const charsNeeded = sizeBuf.readUInt32LE(0);
  if (charsNeeded === 0) return null;

  // Second call: allocate a UTF-16LE buffer and retrieve the name
  const nameBuf = Buffer.alloc(charsNeeded * 2);
  sizeBuf.writeUInt32LE(charsNeeded);
  const ok = Secur32.GetUserNameExW(formatId, nameBuf.ptr, sizeBuf.ptr);

  if (!ok) return null;

  const actualLen = sizeBuf.readUInt32LE(0);
  return nameBuf.subarray(0, actualLen * 2).toString('utf16le');
}

const cardWidth = 60;
const horizontalBorder = '+' + '-'.repeat(cardWidth - 2) + '+';
const emptyLine = '|' + ' '.repeat(cardWidth - 2) + '|';

function centerLine(text: string): string {
  const innerWidth = cardWidth - 4;
  const truncated = text.length > innerWidth ? text.substring(0, innerWidth - 3) + '...' : text;
  const padding = innerWidth - truncated.length;
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return '| ' + ' '.repeat(left) + truncated + ' '.repeat(right) + ' |';
}

function labeledLine(label: string, value: string): string {
  const innerWidth = cardWidth - 4;
  const prefix = `${label}: `;
  const maxValueLen = innerWidth - prefix.length;
  const truncatedValue = value.length > maxValueLen ? value.substring(0, maxValueLen - 3) + '...' : value;
  const content = prefix + truncatedValue;
  const rightPad = innerWidth - content.length;
  return '| ' + content + ' '.repeat(rightPad) + ' |';
}

console.log('');
console.log(horizontalBorder);
console.log(emptyLine);
console.log(centerLine('DIGITAL IDENTITY CARD'));
console.log(centerLine('Windows Security Principal'));
console.log(emptyLine);
console.log(horizontalBorder);
console.log(emptyLine);

let anyFound = false;

for (const format of NAME_FORMATS) {
  const value = getUserName(format.id);

  if (value !== null) {
    console.log(labeledLine(format.label, value));
    anyFound = true;
  } else {
    const innerWidth = cardWidth - 4;
    const content = `${format.label}: (not available)`;
    const rightPad = innerWidth - content.length;
    console.log('| ' + content + ' '.repeat(Math.max(0, rightPad)) + ' |');
  }
}

console.log(emptyLine);
console.log(horizontalBorder);

if (!anyFound) {
  console.log('\nNo identity formats could be resolved on this system.');
}
