# @bun-win32/webauthn

Zero-dependency, zero-overhead Win32 WebAuthn bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/webauthn` exposes the `webauthn.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Webauthn`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

`webauthn.dll` is the Windows WebAuthn / FIDO2 platform API: drive the Windows platform authenticator (Windows Hello biometrics + TPM-backed passkeys) and roaming security keys directly from a desktop, CLI, or Electron app — `WebAuthNAuthenticatorMakeCredential` (passkey registration), `WebAuthNAuthenticatorGetAssertion` (passkey sign-in), platform-credential enumeration/deletion, cancellation, and W3C `DOMException` error mapping. This is the native ceremony, not a crypto primitive.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `webauthn.dll` (passkeys, FIDO2, Windows Hello platform authenticator).
- In-source docs in `structs/Webauthn.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Webauthn.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Webauthn.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 (1903+) or later

## Installation

```sh
bun add @bun-win32/webauthn
```

## Quick Start

```ts
import Webauthn from '@bun-win32/webauthn';

// Which API version (and therefore which structures/features) is available?
console.log('WebAuthn API version:', Webauthn.WebAuthNGetApiVersionNumber());

// Is Windows Hello (a user-verifying platform authenticator) usable?
const available = Buffer.alloc(4); // BOOL
if (Webauthn.WebAuthNIsUserVerifyingPlatformAuthenticatorAvailable(available.ptr!) === 0) {
  console.log('Windows Hello available:', available.readInt32LE(0) !== 0);
}

// Mint a per-operation cancellation GUID (pass it in *Options to cancel later).
const guid = Buffer.alloc(16);
if (Webauthn.WebAuthNGetCancellationId(guid.ptr!) === 0) {
  console.log('Cancellation Id:', guid.toString('hex'));
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/passkey-ceremony.ts
bun run example/authenticator-diagnostic.ts
```

## Notes

- Either rely on lazy binding or call `Webauthn.Preload()`.
- `WebAuthNAuthenticatorMakeCredential` / `WebAuthNAuthenticatorGetAssertion` need a valid foreground `HWND` (the ceremony UI parents to it) and block the calling thread until the user completes or cancels the Windows Hello prompt.
- Pair `WebAuthNAuthenticatorMakeCredential` with `WebAuthNFreeCredentialAttestation`, and `WebAuthNAuthenticatorGetAssertion` with `WebAuthNFreeAssertion`. Pair `WebAuthNGetPlatformCredentialList` with `WebAuthNFreePlatformCredentialList`.
- `WebAuthNGetPlatformCredentialList` uses the sizing-aware out-pointer pattern: pass a `PWEBAUTHN_CREDENTIAL_DETAILS_LIST*` cell, then walk `ppCredentialDetails`.
- Result codes are `HRESULT` (`0` = `S_OK`); decode failures with `WebAuthNGetErrorName` (W3C error name) and `WebAuthNGetW3CExceptionDOMError` (canonical DOM error).
- `WebAuthNGetApiVersionNumber` gates which structure versions are valid — check it before populating versioned option structs.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
