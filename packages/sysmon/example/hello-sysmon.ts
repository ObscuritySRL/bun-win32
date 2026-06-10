/**
 * Hello sysmon — your machine, no PowerShell, no wmic, no build step.
 *
 * Reads OS, memory, the top-CPU processes, and the active TCP socket count via direct
 * FFI into System32 DLLs — one syscall for the whole process list, typed end to end.
 *
 * APIs demonstrated:
 * - osInfo, memory (system + memory snapshots)
 * - processes (the one-syscall process list)
 * - tcpSockets (socket table with PIDs)
 *
 * Run: bun run example/hello-sysmon.ts
 */
import { memory, osInfo, processes, tcpSockets } from '@bun-win32/sysmon';

const os = osInfo();
const ram = memory();
const top = processes()
  .sort((a, b) => Number(b.kernelTime + b.userTime - a.kernelTime - a.userTime))
  .slice(0, 5);
console.log(`Windows ${os.major}.${os.minor}.${os.build} · ${ram.memoryLoadPercent}% RAM used · ${tcpSockets().length} TCP sockets`);
console.log(`Top processes by CPU time: ${top.map((processInfo) => processInfo.name).join(', ')}`);
