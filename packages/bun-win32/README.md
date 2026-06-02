# bun-win32

Every Win32 FFI binding for [Bun](https://bun.sh) on Windows, in one install. The unscoped alias for [`@bun-win32/all`](../all).

## Install

```sh
bun add bun-win32
```

## Usage

```ts
import { D2D1, Kernel32, User32, Xaudio2_9 } from 'bun-win32';

Kernel32.GetCurrentProcessId();
User32.GetForegroundWindow();
```

This package re-exports `@bun-win32/all` verbatim — every default class from every `@bun-win32/*` package, plus the shared `Win32` namespace from `@bun-win32/core`. See [`@bun-win32/all`](../all/README.md) for the full surface.

For types, enums, and packed-struct helpers, import from the specific package — those are not re-exported here because the namespace would collide:

```ts
import { User32 } from 'bun-win32';
import { WindowStyles, ShowWindowCommand } from '@bun-win32/user32';
```

## Requirements

- [Bun](https://bun.sh) >= 1.1.0
- Windows 10 or later

## License

MIT
