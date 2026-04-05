/**
 * Hotkey Demo - System-wide hotkey registration
 *
 * This demonstrates how to register global hotkeys that work
 * even when your application is not in focus.
 *
 * Registered hotkeys:
 * - Ctrl+Alt+1: Show notification
 * - Ctrl+Alt+2: Get active window info
 * - Ctrl+Alt+Q: Quit application
 *
 * Demonstrates:
 * - RegisterHotKey / UnregisterHotKey
 * - Message loop with GetMessageW / TranslateMessage / DispatchMessageW
 * - GetForegroundWindow / GetWindowTextW
 * - MessageBoxW for notifications
 */

import '../runtime/extensions';
import User32 from '../structs/User32';
import { MessageBoxType } from '../types/User32';

// Null handle (bigint zero) for optional HWND parameters
const NULL = 0n;

// UTF-16LE encoding helper
const encode = (str: string) => Buffer.from(`${str}\0`, 'utf16le');

// Hotkey IDs
const HOTKEY_NOTIFY = 1;
const HOTKEY_WINDOW_INFO = 2;
const HOTKEY_QUIT = 3;

// Modifier flags
const MOD_ALT = 0x0001;
const MOD_CONTROL = 0x0002;
const MOD_NOREPEAT = 0x4000;

// Message constants
const WM_HOTKEY = 0x0312;

// MSG structure layout (48 bytes on x64):
// hwnd: ptr (8), message: u32 (4), padding (4), wParam: u64 (8), lParam: i64 (8),
// time: u32 (4), pt.x: i32 (4), pt.y: i32 (4), padding (4)
const msgBuffer = new ArrayBuffer(48);
const msgView = new DataView(msgBuffer);
const msgPtr = Buffer.from(msgBuffer).ptr;

console.log('🎹 Hotkey Demo - Starting...\n');

// Register hotkeys (null hwnd = system-wide)
const modifiers = MOD_CONTROL | MOD_ALT | MOD_NOREPEAT;

const registered = [
  { id: HOTKEY_NOTIFY, key: 0x31, name: 'Ctrl+Alt+1' }, // '1' key
  { id: HOTKEY_WINDOW_INFO, key: 0x32, name: 'Ctrl+Alt+2' }, // '2' key
  { id: HOTKEY_QUIT, key: 0x51, name: 'Ctrl+Alt+Q' }, // 'Q' key
];

for (const { id, key, name } of registered) {
  const result = User32.RegisterHotKey(NULL, id, modifiers, key);
  if (result) {
    console.log(`✅ Registered: ${name}`);
  } else {
    console.error(`❌ Failed to register: ${name}`);
  }
}

console.log('\n📋 Available hotkeys:');
console.log('   Ctrl+Alt+1  → Show notification');
console.log('   Ctrl+Alt+2  → Get active window info');
console.log('   Ctrl+Alt+Q  → Quit\n');
console.log('Listening for hotkeys...\n');

// Cleanup function
const cleanup = () => {
  console.log('\n🧹 Cleaning up hotkeys...');
  for (const { id, name } of registered) {
    User32.UnregisterHotKey(NULL, id);
    console.log(`   Unregistered: ${name}`);
  }
  process.exit(0);
};

process.on('SIGINT', cleanup);

// Get info about the foreground window
const getActiveWindowInfo = (): string => {
  const hwnd = User32.GetForegroundWindow();
  if (!hwnd) return 'No active window';

  // Allocate buffer for window title (max 256 chars)
  const titleBuffer = Buffer.alloc(512);
  const length = User32.GetWindowTextW(hwnd, titleBuffer.ptr, 256);

  if (length > 0) {
    // Decode UTF-16LE string
    const title = titleBuffer.subarray(0, length * 2).toString('utf16le');
    return `Window: "${title}"\nHandle: ${hwnd}`;
  }

  return `Window handle: ${hwnd} (no title)`;
};

// Message loop
let running = true;

while (running) {
  // GetMessageW blocks until a message is available
  // Returns 0 for WM_QUIT, -1 for error, positive for message
  const result = User32.GetMessageW(msgPtr, NULL, 0, 0);

  if (result <= 0) {
    break;
  }

  // Read message type from MSG structure
  const message = msgView.getUint32(8, true); // offset 8, little-endian

  if (message === WM_HOTKEY) {
    // wParam contains the hotkey ID
    const hotkeyId = Number(msgView.getBigUint64(16, true));

    switch (hotkeyId) {
      case HOTKEY_NOTIFY: {
        console.log('🔔 Hotkey 1 pressed - Showing notification');
        User32.MessageBoxW(NULL, encode('Hello from @bun-win32/user32!\n\nThis is a system-wide hotkey demo.').ptr, encode('🎹 Hotkey Notification').ptr, MessageBoxType.MB_OK | MessageBoxType.MB_ICONINFORMATION);
        break;
      }

      case HOTKEY_WINDOW_INFO: {
        console.log('📊 Hotkey 2 pressed - Getting window info');
        const info = getActiveWindowInfo();
        console.log(`   ${info.replace('\n', '\n   ')}`);
        User32.MessageBoxW(NULL, encode(info).ptr, encode('🪟 Active Window Info').ptr, MessageBoxType.MB_OK | MessageBoxType.MB_ICONINFORMATION);
        break;
      }

      case HOTKEY_QUIT: {
        console.log('👋 Hotkey Q pressed - Exiting');
        running = false;
        break;
      }
    }
  }

  // Dispatch other messages
  User32.TranslateMessage(msgPtr);
  User32.DispatchMessageW(msgPtr);
}

cleanup();
