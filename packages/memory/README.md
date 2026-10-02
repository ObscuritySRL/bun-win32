# @bun-win32/memory

Read, write, and call functions in Windows processes with [Bun](https://bun.sh/). Windows 10+ required.

```sh
bun add @bun-win32/memory
# Or: bun add bun-memory
```

Both packages export the same class and types.

## Quick Start

```ts
import Process from '@bun-win32/memory';

using cs2 = new Process('cs2.exe'); // Or pass a process ID
const address = 0x12345678n;

const health = cs2.u32(address);
cs2.u32(address, 100);
```

Addresses are `bigint`. `using` closes the process automatically.

## Readers and Writers

```ts
const position = cs2.vector3(address);
const values = cs2.f32Array(address, 4);
const name = cs2.string(address, 64);
const color = cs2.rgba(address);

cs2.vector3(address, { x: 1, y: 2, z: 3 });
cs2.f32Array(address, new Float32Array([1, 2, 3, 4]));
cs2.u32(address, 100, true); // Write to a protected page
```

Reuse a buffer for repeated reads:

```ts
const scratch = new Float32Array(3);
cs2.read(address, scratch); // Updates scratch in-place
cs2.write(address, scratch);
```

## Finding Addresses

```ts
const client = cs2.modules['client.dll'];

if (client) {
  const address = cs2.follow(client.modBaseAddr, [0x10n, 0x20n]);
  const match = cs2.pattern('dead??ef', client.modBaseAddr, client.modBaseSize);
  const matches = cs2.pattern('dead??ef', client.modBaseAddr, client.modBaseSize, true);
  const exact = cs2.indexOf(Buffer.from('deadbeef', 'hex'), client.modBaseAddr, client.modBaseSize);
}
```

`??` and `**` match any byte. No match returns `-1n`, or `[]` when finding all matches.

## Calling Functions

```ts
import { FFIType } from 'bun:ffi';

import Process from '@bun-win32/memory';

using target = new Process(process.pid);
const functions = target.link({
  GetCurrentProcessId: { args: [], ptr: target.procedure('kernel32.dll', 'GetCurrentProcessId'), returns: FFIType.u32 },
});

console.log(functions.GetCurrentProcessId());
```

Or call an address directly:

```ts
const address = target.procedure('kernel32.dll', 'GetCurrentProcessId');
const processIdentifier = target.call(address, { args: [], returns: FFIType.u32 });
```

Calls are synchronous and require x64 targets. Signatures must match the function, and pointers must belong to the target process. Local buffers and strings are not copied automatically.

## Your Own Readers and Writers

Extend `Process`. This accessor reads and writes degrees while the target stores radians:

```ts
import Process from '@bun-win32/memory';

class CustomProcess extends Process {
  public degrees(address: bigint): number;
  public degrees(address: bigint, value: number, force?: boolean): this;
  public degrees(address: bigint, value?: number, force?: boolean): number | this {
    if (value === undefined) {
      return this.f32(address) * (180 / Math.PI);
    }

    this.f32(address, value * (Math.PI / 180), force);

    return this;
  }
}

using target = new CustomProcess('cs2.exe');
target.degrees(0x12345678n, 90);
const degrees = target.degrees(0x12345678n);
```

See the [examples](./example) and [API guide](./AI.md) for more. Run `bun run test` to test the package.
