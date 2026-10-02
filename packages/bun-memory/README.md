# bun-memory

Read, write, and call functions in Windows processes with [Bun](https://bun.sh/).

```sh
bun add bun-memory
```

```ts
import Process from 'bun-memory';

using target = new Process('cs2.exe');
const health = target.u32(0x12345678n);
target.u32(0x12345678n, 100);
```

Alias for `@bun-win32/memory`, with the same exports. Windows 10+ required.

See the [memory README](https://github.com/ObscuritySRL/bun-win32/tree/main/packages/memory#readme) for function calls and custom readers/writers.
