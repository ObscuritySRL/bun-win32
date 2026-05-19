/**
 * Windows Firewall Security Audit
 *
 * A thorough, richly-formatted security report on the live Windows Defender
 * Firewall. FirewallAPI.dll is the registered in-process COM server for
 * CLSID_NetFwPolicy2, so this report reaches the INetFwPolicy2 policy object
 * the documented way for this package: FirewallApi.DllGetClassObject hands
 * back the DLL's IClassFactory, IClassFactory::CreateInstance produces a live
 * INetFwPolicy2, and every property is then read straight off the COM vtable
 * over pure FFI — no PowerShell, no netsh, no WMI.
 *
 * For each of the three firewall profiles (Domain, Private, Public) it prints
 * an aligned panel showing whether the firewall is enabled, whether all
 * inbound traffic is blocked, whether notifications are suppressed, and the
 * default inbound / outbound actions — with a final posture verdict.
 *
 * APIs demonstrated (FirewallApi):
 *   - DllGetClassObject              (obtain the CLSID_NetFwPolicy2 class factory)
 *
 * APIs demonstrated (COM vtable, over FFI):
 *   - IClassFactory::CreateInstance  (instantiate INetFwPolicy2)
 *   - INetFwPolicy2::get_CurrentProfileTypes / get_FirewallEnabled /
 *     get_BlockAllInboundTraffic / get_NotificationsDisabled /
 *     get_DefaultInboundAction / get_DefaultOutboundAction
 *   - IUnknown::Release              (release the COM objects)
 *
 * APIs demonstrated (cross-package):
 *   - Ole32.CoInitialize                       (enter a COM apartment)
 *   - Kernel32.GetStdHandle/Get|SetConsoleMode (enable ANSI VT processing)
 *
 * Run: bun run example/firewall-audit.ts
 */

import { CFunction, FFIType, type Pointer, read } from 'bun:ffi';

import FirewallApi from '../index';
import Kernel32 from '@bun-win32/kernel32';
import Ole32 from '@bun-win32/ole32';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const RED = '\x1b[91m';
const MAGENTA = '\x1b[95m';
const BLUE = '\x1b[94m';

const S_OK = 0;

// CLSID_NetFwPolicy2 {E2B3C97F-6AE1-41AC-817A-F6F92166D7DD}
// IID_INetFwPolicy2  {98325047-C671-4174-8D81-DEFCD3F03186}
// IID_IClassFactory  {00000001-0000-0000-C000-000000000046}
const CLSID_NetFwPolicy2 = guid(0xe2b3c97f, 0x6ae1, 0x41ac, [0x81, 0x7a, 0xf6, 0xf9, 0x21, 0x66, 0xd7, 0xdd]);
const IID_INetFwPolicy2 = guid(0x98325047, 0xc671, 0x4174, [0x8d, 0x81, 0xde, 0xfc, 0xd3, 0xf0, 0x31, 0x86]);
const IID_IClassFactory = guid(0x00000001, 0x0000, 0x0000, [0xc0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46]);

// IUnknown / IClassFactory vtable slots.
const IUNKNOWN_RELEASE = 2;
const ICLASSFACTORY_CREATEINSTANCE = 3;

// INetFwPolicy2 vtable slots: IUnknown(0-2) + IDispatch(3-6) then the
// interface methods, in declaration order from netfw.h.
const NFP2_GET_CURRENT_PROFILE_TYPES = 7;
const NFP2_GET_FIREWALL_ENABLED = 8;
const NFP2_GET_BLOCK_ALL_INBOUND = 12;
const NFP2_GET_NOTIFICATIONS_DISABLED = 14;
const NFP2_GET_DEFAULT_INBOUND_ACTION = 23;
const NFP2_GET_DEFAULT_OUTBOUND_ACTION = 25;

const PROFILES: ReadonlyArray<{ name: string; bit: number }> = [
  { name: 'Domain', bit: 0x1 }, // NET_FW_PROFILE2_DOMAIN
  { name: 'Private', bit: 0x2 }, // NET_FW_PROFILE2_PRIVATE
  { name: 'Public', bit: 0x4 }, // NET_FW_PROFILE2_PUBLIC
];

// NET_FW_ACTION: 0 = Block, 1 = Allow.
const FW_ACTION = ['Block', 'Allow'];

/** Builds a 16-byte little-endian GUID buffer from its canonical fields. */
function guid(data1: number, data2: number, data3: number, data4: readonly number[]): Buffer {
  const buf = Buffer.alloc(16);
  buf.writeUInt32LE(data1 >>> 0, 0);
  buf.writeUInt16LE(data2, 4);
  buf.writeUInt16LE(data3, 6);
  for (let i = 0; i < 8; i++) buf.writeUInt8(data4[i]!, 8 + i);
  return buf;
}

function enableVirtualTerminal(): void {
  const STD_OUTPUT_HANDLE = 0xffff_fff5;
  const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;
  const handle = Kernel32.GetStdHandle(STD_OUTPUT_HANDLE);
  const mode = Buffer.alloc(4);
  if (Kernel32.GetConsoleMode(handle, mode.ptr!)) {
    Kernel32.SetConsoleMode(handle, mode.readUInt32LE(0) | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
  }
}

const invokers = new Map<string, ReturnType<typeof CFunction>>();

/** Calls vtable slot `slot` on a COM object at `thisPtr` with `(this, ...args)`. */
function vcall(thisPtr: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[]): number {
  const vtable = read.u64(Number(thisPtr) as Pointer, 0);
  const method = read.u64(Number(vtable) as Pointer, slot * 8);
  const key = `${method}|${argTypes.join(',')}`;
  let invoke = invokers.get(key);
  if (invoke === undefined) {
    invoke = CFunction({ ptr: Number(method) as Pointer, args: [FFIType.u64, ...argTypes], returns: FFIType.i32 });
    invokers.set(key, invoke);
  }
  return invoke(thisPtr, ...args) as number;
}

/** Reads one VARIANT_BOOL (SHORT, -1 = true) property: get_X(profileBit, &out). */
function getVariantBool(policy: bigint, slot: number, profileBit: number): boolean | null {
  const out = Buffer.alloc(2);
  const hr = vcall(policy, slot, [FFIType.i32, FFIType.ptr], [profileBit, out.ptr!]);
  if (hr !== S_OK) return null;
  return out.readInt16LE(0) !== 0;
}

/** Reads one NET_FW_ACTION (4-byte enum) property: get_X(profileBit, &out). */
function getAction(policy: bigint, slot: number, profileBit: number): number | null {
  const out = Buffer.alloc(4);
  const hr = vcall(policy, slot, [FFIType.i32, FFIType.ptr], [profileBit, out.ptr!]);
  if (hr !== S_OK) return null;
  return out.readInt32LE(0);
}

function yesNo(value: boolean | null): string {
  if (value === null) return `${DIM}n/a${RESET}`;
  return value ? `${GREEN}Yes${RESET}` : `${RED}No${RESET}`;
}

function row(label: string, value: string): void {
  console.log(`    ${label.padEnd(28)} ${value}`);
}

function main(): void {
  enableVirtualTerminal();

  const init = Ole32.CoInitialize(null);
  if (init !== S_OK && init !== 1 /* S_FALSE */) {
    console.error(`${RED}CoInitialize failed: 0x${(init >>> 0).toString(16)}${RESET}`);
    return;
  }

  console.log(`\n${BOLD}${MAGENTA}  ╔══════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${MAGENTA}  ║       W I N D O W S   F I R E W A L L            ║${RESET}`);
  console.log(`${BOLD}${MAGENTA}  ║            S E C U R I T Y   A U D I T           ║${RESET}`);
  console.log(`${BOLD}${MAGENTA}  ╚══════════════════════════════════════════════════╝${RESET}`);
  console.log(`  ${DIM}INetFwPolicy2 read live over the FirewallAPI.dll COM server${RESET}\n`);

  // 1 ─ Ask FirewallAPI.dll for its CLSID_NetFwPolicy2 class factory.
  const ppFactory = Buffer.alloc(8);
  const hrFactory = FirewallApi.DllGetClassObject(CLSID_NetFwPolicy2.ptr!, IID_IClassFactory.ptr!, ppFactory.ptr!);
  if (hrFactory !== S_OK) {
    console.error(`${RED}DllGetClassObject failed: 0x${(hrFactory >>> 0).toString(16)}${RESET}`);
    return;
  }
  const factory = ppFactory.readBigUInt64LE(0);

  // 2 ─ IClassFactory::CreateInstance(NULL, IID_INetFwPolicy2, &policy).
  const ppPolicy = Buffer.alloc(8);
  const hrCreate = vcall(factory, ICLASSFACTORY_CREATEINSTANCE, [FFIType.u64, FFIType.ptr, FFIType.ptr], [0n, IID_INetFwPolicy2.ptr!, ppPolicy.ptr!]);
  vcall(factory, IUNKNOWN_RELEASE, [], []);
  if (hrCreate !== S_OK) {
    console.error(`${RED}IClassFactory::CreateInstance failed: 0x${(hrCreate >>> 0).toString(16)}${RESET}`);
    return;
  }
  const policy = ppPolicy.readBigUInt64LE(0);

  // 3 ─ Which profiles are currently active on this machine?
  const activeBuf = Buffer.alloc(4);
  const hrActive = vcall(policy, NFP2_GET_CURRENT_PROFILE_TYPES, [FFIType.ptr], [activeBuf.ptr!]);
  const activeMask = hrActive === S_OK ? activeBuf.readInt32LE(0) : 0;
  console.log(
    `  ${BOLD}${BLUE}══ Active profile(s)${RESET}  ${CYAN}${
      PROFILES.filter((p) => activeMask & p.bit)
        .map((p) => p.name)
        .join(', ') || 'unknown'
    }${RESET}\n`,
  );

  // 4 ─ Per-profile posture panel.
  let weakProfiles = 0;
  for (const profile of PROFILES) {
    const isActive = (activeMask & profile.bit) !== 0;
    const enabled = getVariantBool(policy, NFP2_GET_FIREWALL_ENABLED, profile.bit);
    const blockInbound = getVariantBool(policy, NFP2_GET_BLOCK_ALL_INBOUND, profile.bit);
    const notifSuppressed = getVariantBool(policy, NFP2_GET_NOTIFICATIONS_DISABLED, profile.bit);
    const inAction = getAction(policy, NFP2_GET_DEFAULT_INBOUND_ACTION, profile.bit);
    const outAction = getAction(policy, NFP2_GET_DEFAULT_OUTBOUND_ACTION, profile.bit);

    const header = isActive ? `${BOLD}${profile.name}${RESET} ${GREEN}● active${RESET}` : `${BOLD}${profile.name}${RESET} ${DIM}○ inactive${RESET}`;
    console.log(`  ${DIM}┌─────────────────────────────────────────────────┐${RESET}`);
    console.log(`  ${BOLD}${MAGENTA}${profile.name} profile${RESET}  —  ${header}`);
    console.log(`  ${DIM}└─────────────────────────────────────────────────┘${RESET}`);
    row('Firewall enabled', yesNo(enabled));
    row('Block all inbound', yesNo(blockInbound));
    row('Notifications suppressed', yesNo(notifSuppressed));
    row('Default inbound action', inAction === null ? `${DIM}n/a${RESET}` : inAction === 0 ? `${GREEN}${FW_ACTION[0]}${RESET}` : `${YELLOW}${FW_ACTION[inAction] ?? inAction}${RESET}`);
    row('Default outbound action', outAction === null ? `${DIM}n/a${RESET}` : outAction === 1 ? `${GREEN}${FW_ACTION[1]}${RESET}` : `${YELLOW}${FW_ACTION[outAction] ?? outAction}${RESET}`);

    const weak = enabled === false || inAction === 1;
    if (weak) weakProfiles++;
    console.log(`    ${'Posture'.padEnd(28)} ${weak ? `${RED}⚠ weak — review${RESET}` : `${GREEN}✓ hardened${RESET}`}\n`);
  }

  // 5 ─ Verdict + teardown.
  if (weakProfiles === 0) {
    console.log(`  ${GREEN}${BOLD}✓ All profiles enabled with a default-deny inbound posture.${RESET}`);
  } else {
    console.log(`  ${RED}${BOLD}⚠ ${weakProfiles} profile(s) have a weakened posture — investigate.${RESET}`);
  }

  vcall(policy, IUNKNOWN_RELEASE, [], []);
  console.log(`\n  ${DIM}INetFwPolicy2 released. Audit complete.${RESET}\n`);
}

main();
