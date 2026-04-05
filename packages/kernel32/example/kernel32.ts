import Kernel32 from '@bun-win32/kernel32';

// Preload the symbols we'll need once...
const start = performance.now();

Kernel32.Preload(['GetCurrentProcessId', 'GetTickCount64']);

const end = performance.now();

const ms = (end - start).toFixed(2);

console.log('Kernel32 loaded in %sms...', ms);

// Common, simple use-case: fetch process id and uptime ticks
const pid = Kernel32.GetCurrentProcessId();
const ticks = Kernel32.GetTickCount64();

console.log('PID=%s Ticks=%s', pid, ticks.toString());
