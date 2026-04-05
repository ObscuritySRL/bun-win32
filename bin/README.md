# bin

Contains `dumpbin.exe` and its runtime dependencies, redistributed from the [Microsoft Visual C++ Build Tools](https://learn.microsoft.com/en-us/cpp/build/reference/dumpbin-reference).

`dumpbin.exe` (the Microsoft COFF Binary File Dumper) is used in this project to dump the exported symbols from Windows system DLLs, providing the authoritative list of functions each `@bun-win32` package binds.

## Usage

```sh
./bin/dumpbin.exe //EXPORTS C:\Windows\System32\kernel32.dll
```

## Attribution

These files are part of the **Microsoft Visual C++ Build Tools** and are subject to the [Microsoft Software License Terms](https://visualstudio.microsoft.com/license-terms/). They are included here for convenience so contributors can dump DLL exports without installing the full Visual Studio toolchain.

- [DUMPBIN Reference — Microsoft Learn](https://learn.microsoft.com/en-us/cpp/build/reference/dumpbin-reference)
