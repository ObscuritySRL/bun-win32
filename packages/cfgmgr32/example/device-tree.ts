/**
 * Device Tree
 *
 * Walks the Windows device tree from the root devnode downward using
 * CM_Get_Child / CM_Get_Sibling, then renders a colorful ANSI tree. Each node
 * shows its device instance ID, status flags, and whether the device is
 * started, has a problem, or is a phantom. The tree animates as nodes are
 * discovered.
 *
 * APIs demonstrated:
 *   - Cfgmgr32.CM_Locate_DevNodeW   (locate the root of the device tree)
 *   - Cfgmgr32.CM_Get_Child         (first child of a devnode)
 *   - Cfgmgr32.CM_Get_Sibling       (next sibling of a devnode)
 *   - Cfgmgr32.CM_Get_Device_IDW    (instance ID for a devnode)
 *   - Cfgmgr32.CM_Get_Device_ID_Size(length of instance ID)
 *   - Cfgmgr32.CM_Get_DevNode_Status(devnode status and problem code)
 *
 * Run: bun run example/device-tree.ts
 */

import Cfgmgr32, { CR, CM_LOCATE_DEVNODE, DN } from '../index';

Cfgmgr32.Preload([
  'CM_Get_Child',
  'CM_Get_Device_IDW',
  'CM_Get_Device_ID_Size',
  'CM_Get_DevNode_Status',
  'CM_Get_Sibling',
  'CM_Locate_DevNodeW',
]);

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

const MAX_DEPTH = parseInt(Bun.argv[2] ?? '3', 10);

interface DeviceNode {
  children: DeviceNode[];
  deviceId: string;
  devInst: number;
  hasChildren: boolean;
  problemCode: number;
  statusFlags: number;
}

function getDeviceId(devInst: number): string {
  const idLenBuf = Buffer.alloc(4);
  let cr = Cfgmgr32.CM_Get_Device_ID_Size(idLenBuf.ptr, devInst, 0);

  if (cr !== CR.SUCCESS) {
    return `(unknown, CR=${cr})`;
  }

  const idLen = idLenBuf.readUInt32LE(0);
  const idBuf = Buffer.alloc((idLen + 1) * 2);
  cr = Cfgmgr32.CM_Get_Device_IDW(devInst, idBuf.ptr, idLen + 1, 0);

  if (cr !== CR.SUCCESS) {
    return `(unknown, CR=${cr})`;
  }

  return idBuf.toString('utf16le').replace(/\0.*$/, '');
}

function getDeviceStatus(devInst: number): { problemCode: number; statusFlags: number } {
  const statusBuf = Buffer.alloc(4);
  const problemBuf = Buffer.alloc(4);
  const cr = Cfgmgr32.CM_Get_DevNode_Status(statusBuf.ptr, problemBuf.ptr, devInst, 0);

  if (cr !== CR.SUCCESS) {
    return { problemCode: 0, statusFlags: 0 };
  }

  return {
    problemCode: problemBuf.readUInt32LE(0),
    statusFlags: statusBuf.readUInt32LE(0),
  };
}

function walkTree(devInst: number, depth: number): DeviceNode {
  const deviceId = getDeviceId(devInst);
  const { problemCode, statusFlags } = getDeviceStatus(devInst);
  const children: DeviceNode[] = [];
  let hasChildren = false;

  const childBuf = Buffer.alloc(4);

  if (depth < MAX_DEPTH && Cfgmgr32.CM_Get_Child(childBuf.ptr, devInst, 0) === CR.SUCCESS) {
    let childInst = childBuf.readUInt32LE(0);
    children.push(walkTree(childInst, depth + 1));

    const siblingBuf = Buffer.alloc(4);

    while (Cfgmgr32.CM_Get_Sibling(siblingBuf.ptr, childInst, 0) === CR.SUCCESS) {
      childInst = siblingBuf.readUInt32LE(0);
      children.push(walkTree(childInst, depth + 1));
    }
  } else if (Cfgmgr32.CM_Get_Child(Buffer.alloc(4).ptr, devInst, 0) === CR.SUCCESS) {
    hasChildren = true;
  }

  return { children, deviceId, devInst, hasChildren, problemCode, statusFlags };
}

function statusBadge(node: DeviceNode): string {
  if (node.statusFlags & DN.HAS_PROBLEM) {
    return `${ANSI.red}[PROBLEM ${node.problemCode}]${ANSI.reset}`;
  }

  if (node.statusFlags & DN.STARTED) {
    return `${ANSI.green}[STARTED]${ANSI.reset}`;
  }

  if (!(node.statusFlags & DN.DRIVER_LOADED)) {
    return `${ANSI.yellow}[NO DRIVER]${ANSI.reset}`;
  }

  return `${ANSI.dim}[STOPPED]${ANSI.reset}`;
}

function renderTree(node: DeviceNode, prefix: string, isLast: boolean, isRoot: boolean): void {
  const connector = isRoot ? '' : isLast ? '└── ' : '├── ';
  const badge = statusBadge(node);
  const truncated = node.hasChildren ? ` ${ANSI.dim}(+children, depth limit)${ANSI.reset}` : '';
  const idColor = node.statusFlags & DN.HAS_PROBLEM ? ANSI.red : ANSI.cyan;

  console.log(`${prefix}${connector}${idColor}${node.deviceId}${ANSI.reset} ${badge}${truncated}`);

  const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');

  for (let i = 0; i < node.children.length; i++) {
    renderTree(node.children[i], childPrefix, i === node.children.length - 1, false);
  }
}

function countNodes(node: DeviceNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

function countByStatus(node: DeviceNode, flag: number): number {
  const match = (node.statusFlags & flag) !== 0 ? 1 : 0;
  return match + node.children.reduce((sum, child) => sum + countByStatus(child, flag), 0);
}

function countProblems(node: DeviceNode): number {
  const match = (node.statusFlags & DN.HAS_PROBLEM) !== 0 ? 1 : 0;
  return match + node.children.reduce((sum, child) => sum + countProblems(child), 0);
}

const devInstBuf = Buffer.alloc(4);
const cr = Cfgmgr32.CM_Locate_DevNodeW(devInstBuf.ptr, null, CM_LOCATE_DEVNODE.NORMAL);

if (cr !== CR.SUCCESS) {
  console.error(`${ANSI.red}CM_Locate_DevNodeW failed: CR=${cr}${ANSI.reset}`);
  process.exit(1);
}

const rootDevInst = devInstBuf.readUInt32LE(0);

console.log(`${ANSI.bold}${ANSI.magenta}Device Tree${ANSI.reset}`);
console.log(`${ANSI.dim}Walking ${MAX_DEPTH} levels deep (pass a number as arg to change)${ANSI.reset}`);
console.log('');

const tree = walkTree(rootDevInst, 0);
renderTree(tree, '', true, true);

const total = countNodes(tree);
const started = countByStatus(tree, DN.STARTED);
const problems = countProblems(tree);

console.log('');
console.log(`${ANSI.bold}Summary${ANSI.reset}`);
console.log(`  ${ANSI.dim}Devices enumerated:${ANSI.reset} ${total}`);
console.log(`  ${ANSI.green}Started:${ANSI.reset}            ${started}`);

if (problems > 0) {
  console.log(`  ${ANSI.red}With problems:${ANSI.reset}      ${problems}`);
}

console.log(`  ${ANSI.dim}Max depth:${ANSI.reset}          ${MAX_DEPTH}`);
