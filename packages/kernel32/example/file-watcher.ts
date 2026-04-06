/**
 * File System Watcher
 *
 * Demonstrates using FindFirstChangeNotification/FindNextChangeNotification
 * to watch a directory for file system changes.
 */
import { ptr } from 'bun:ffi';
import Kernel32, { FileNotifyChangeFlags, WaitResult, INVALID_HANDLE_VALUE } from '@bun-win32/kernel32';

// Preload required APIs
Kernel32.Preload(['FindFirstChangeNotificationW', 'FindNextChangeNotification', 'FindCloseChangeNotification', 'WaitForSingleObject', 'GetLastError']);

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const WATCH_PATH = process.argv[2] || '.';
const WATCH_SUBTREE = true;
const TIMEOUT_MS = 1000; // Check every second

// Combine notification flags
const NOTIFY_FLAGS =
  FileNotifyChangeFlags.FILE_NOTIFY_CHANGE_FILE_NAME |
  FileNotifyChangeFlags.FILE_NOTIFY_CHANGE_DIR_NAME |
  FileNotifyChangeFlags.FILE_NOTIFY_CHANGE_ATTRIBUTES |
  FileNotifyChangeFlags.FILE_NOTIFY_CHANGE_SIZE |
  FileNotifyChangeFlags.FILE_NOTIFY_CHANGE_LAST_WRITE |
  FileNotifyChangeFlags.FILE_NOTIFY_CHANGE_CREATION;

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

function toWideString(str: string): Uint8Array {
  const buffer = new Uint8Array((str.length + 1) * 2);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    buffer[i * 2] = code & 0xff;
    buffer[i * 2 + 1] = (code >> 8) & 0xff;
  }
  return buffer;
}

function formatTime(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0] ?? '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Watch loop
// ─────────────────────────────────────────────────────────────────────────────

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                         FILE SYSTEM WATCHER                                  ║
║                        powered by bun-kernel32                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Watching:  ${WATCH_PATH.padEnd(64)}║
║  Subtree:   ${(WATCH_SUBTREE ? 'Yes' : 'No').padEnd(64)}║
║  Timeout:   ${(TIMEOUT_MS + 'ms').padEnd(64)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Monitoring for changes... Press Ctrl+C to stop.                             ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// Create the watch path as a wide string
const pathBuffer = toWideString(WATCH_PATH);

// Create change notification handle
const hChange = Kernel32.FindFirstChangeNotificationW(ptr(pathBuffer), WATCH_SUBTREE ? 1 : 0, NOTIFY_FLAGS);

if (hChange === INVALID_HANDLE_VALUE || hChange === null) {
  const error = Kernel32.GetLastError();
  console.error(`Failed to create change notification. Error: ${error}`);
  process.exit(1);
}

console.log(`[${formatTime()}] Watch handle created successfully.`);

let changeCount = 0;
let running = true;

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n[Stopping watcher...]');
  running = false;
});

// Watch loop
async function watchLoop() {
  while (running) {
    // Wait for a change or timeout
    const result = Kernel32.WaitForSingleObject(hChange, TIMEOUT_MS);

    switch (result) {
      case WaitResult.WAIT_OBJECT_0:
        // Change detected!
        changeCount++;
        console.log(`[${formatTime()}] Change #${changeCount} detected in ${WATCH_PATH}`);

        // Reset the notification
        if (!Kernel32.FindNextChangeNotification(hChange)) {
          console.error('Failed to reset change notification');
          running = false;
        }
        break;

      case WaitResult.WAIT_TIMEOUT:
        // No change, just continue
        break;

      case WaitResult.WAIT_FAILED:
        console.error(`WaitForSingleObject failed. Error: ${Kernel32.GetLastError()}`);
        running = false;
        break;

      case WaitResult.WAIT_ABANDONED:
        console.log('Wait abandoned');
        running = false;
        break;
    }

    // Yield to event loop
    await Bun.sleep(10);
  }

  // Cleanup
  Kernel32.FindCloseChangeNotification(hChange);
  console.log(`\nTotal changes detected: ${changeCount}`);
  console.log('Watcher stopped.');
}

watchLoop();
