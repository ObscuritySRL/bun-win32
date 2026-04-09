# @bun-win32/credui

Zero-dependency, zero-overhead Win32 CredUI bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/credui` exposes the `credui.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Credui`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `credui.dll` (credential prompts, packed authentication buffers, SSPI-assisted credential flows, and SSO helpers).
- In-source docs in `structs/Credui.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Credui.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Credui.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/credui
```

## Quick Start

```ts
import Credui from '@bun-win32/credui';

const principal = Buffer.from('CONTOSO\\alice\0', 'utf16le');
const userBuffer = Buffer.alloc((513 + 1) * 2);
const domainBuffer = Buffer.alloc((513 + 1) * 2);

const status = Credui.CredUIParseUserNameW(principal.ptr, userBuffer.ptr, 514, domainBuffer.ptr, 514);

if (status === 0) {
  const user = userBuffer.toString('utf16le').replace(/\0.*$/, '');
  const domain = domainBuffer.toString('utf16le').replace(/\0.*$/, '');
  console.log({ domain, user });
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:credential-buffer-visualizer
bun run example:credential-diagnostic
bun run example:system-credential-dialog
```

`example:system-credential-dialog` opens the real Windows credential provider UI. On a Hello-enabled machine, the available tiles can include password, PIN, face, fingerprint, smart card, or other installed providers, depending on local policy and configuration.

## Notes

- Either rely on lazy binding or call `Credui.Preload()`.
- Windows only. Bun runtime required.
