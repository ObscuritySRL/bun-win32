/**
 * Countdown Dialog - Auto-dismissing MessageBox demo
 *
 * Demonstrates the undocumented but commonly used MessageBoxTimeoutW
 * function that allows creating message boxes that automatically
 * close after a specified timeout.
 *
 * This example shows a countdown timer dialog that dismisses itself.
 */

import User32 from '../structs/User32';
import { MessageBoxType } from '../types/User32';

// Null handle (bigint zero) for optional HWND parameters
const NULL = 0n;

// UTF-16LE encoding helper
const encode = (str: string) => Buffer.from(`${str}\0`, 'utf16le');

console.log('⏱️  Countdown Dialog Demo\n');

// MessageBoxTimeoutW return values
const IDTIMEOUT = 32000; // Special return value when dialog times out
const IDOK = 1;
const IDYES = 6;

/**
 * Show a dialog that auto-dismisses after the specified timeout
 */
const showTimedDialog = (title: string, message: string, type: number, timeoutMs: number): number => {
  return User32.MessageBoxTimeoutW(
    NULL, // No owner window
    encode(message).ptr,
    encode(title).ptr,
    type,
    0, // Default language
    timeoutMs,
  );
};

// Demo 1: Simple info dialog with 3 second timeout
console.log('📢 Showing info dialog (3 second timeout)...');
const result1 = showTimedDialog('⏱️ Auto-Close Demo', 'This dialog will close automatically in 3 seconds!\n\nOr click OK to close it now.', MessageBoxType.MB_OK | MessageBoxType.MB_ICONINFORMATION, 3000);
console.log(`   Result: ${result1 === IDTIMEOUT ? 'Timed out' : 'User clicked OK'}\n`);

// Demo 2: Yes/No question with 5 second timeout
console.log('❓ Showing Yes/No dialog (5 second timeout)...');
const result2 = showTimedDialog('🤔 Quick Decision', 'Do you like @bun-win32/user32?\n\n(Auto-selects "Yes" in 5 seconds)', MessageBoxType.MB_YESNO | MessageBoxType.MB_ICONQUESTION | MessageBoxType.MB_DEFBUTTON1, 5000);

let answer: string;
switch (result2) {
  case IDYES:
    answer = 'Yes! 🎉';
    break;
  case 7: // IDNO
    answer = 'No 😢';
    break;
  case IDTIMEOUT:
    answer = 'Timed out (we assume Yes! 😄)';
    break;
  default:
    answer = `Unknown (${result2})`;
}
console.log(`   Result: ${answer}\n`);

// Demo 3: Warning with OK/Cancel and 4 second timeout
console.log('⚠️ Showing warning dialog (4 second timeout)...');
const result3 = showTimedDialog('⚠️ Important Notice', 'This is your final warning!\n\n(Just kidding, this closes in 4 seconds)', MessageBoxType.MB_OKCANCEL | MessageBoxType.MB_ICONWARNING, 4000);
console.log(`   Result: ${result3 === IDTIMEOUT ? 'Timed out' : result3 === IDOK ? 'OK clicked' : 'Cancel clicked'}\n`);

// Demo 4: Rapid fire countdown
console.log('🚀 Rapid countdown sequence...');
for (let i = 3; i >= 1; i--) {
  showTimedDialog(`Countdown: ${i}`, `${'🔥'.repeat(i)}\n\n${i}...`, MessageBoxType.MB_OK | MessageBoxType.MB_ICONWARNING, 800);
}
showTimedDialog('🎊 Blast Off!', 'Launch sequence complete!\n\n🚀', MessageBoxType.MB_OK | MessageBoxType.MB_ICONINFORMATION, 1500);

console.log('✅ Demo complete!');
