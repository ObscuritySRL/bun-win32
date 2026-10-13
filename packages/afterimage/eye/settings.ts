// The few things Afterimage remembers about you between runs (never about your screen): the
// memory budget, whether you've seen the welcome, whether it starts with Windows. Stored as JSON
// in %APPDATA%\Afterimage; "start with Windows" is the standard HKCU Run value.

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ptr } from 'bun:ffi';

import Advapi32 from '@bun-win32/advapi32';

export interface Settings {
  budgetBytes: number;
  welcomed: boolean;
}

const defaults: Settings = { budgetBytes: 0x2000_0000, welcomed: false };
const hkeyCurrentUser = 0xffff_ffff_8000_0001n;
const registerString = 0x1;
const runKey = 'Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const runValue = 'Afterimage';

function folder(): string {
  return join(Bun.env.APPDATA ?? Bun.env.USERPROFILE ?? '.', 'Afterimage');
}

export async function loadSettings(): Promise<Settings> {
  const file = Bun.file(join(folder(), 'settings.json'));
  if (!(await file.exists())) return { ...defaults };
  try {
    const stored: Partial<Settings> = await file.json();
    return {
      budgetBytes: typeof stored.budgetBytes === 'number' && stored.budgetBytes >= 0x1000_0000 ? stored.budgetBytes : defaults.budgetBytes,
      welcomed: stored.welcomed === true,
    };
  } catch {
    return { ...defaults };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  mkdirSync(folder(), { recursive: true });
  await Bun.write(join(folder(), 'settings.json'), `${JSON.stringify(settings, null, 2)}\n`);
}

/** Whether HKCU\…\Run launches this executable. */
export function startsWithWindows(): boolean {
  const size = new Uint32Array(new ArrayBuffer(4));
  return Advapi32.RegGetValueW(hkeyCurrentUser, ptr(Buffer.from(`${runKey}\0`, 'utf16le')), ptr(Buffer.from(`${runValue}\0`, 'utf16le')), 0xffff, null, null, ptr(size)) === 0;
}

export function setStartWithWindows(enabled: boolean, executable: string): void {
  const key = ptr(Buffer.from(`${runKey}\0`, 'utf16le'));
  const name = ptr(Buffer.from(`${runValue}\0`, 'utf16le'));
  if (!enabled) {
    Advapi32.RegDeleteKeyValueW(hkeyCurrentUser, key, name);
    return;
  }
  const command = Buffer.from(`"${executable}"\0`, 'utf16le');
  Advapi32.RegSetKeyValueW(hkeyCurrentUser, key, name, registerString, ptr(command), command.byteLength);
}
