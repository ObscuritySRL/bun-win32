import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, INT, INT_PTR, LPCVOID, LPSTR, LPVOID, NULL, NULLABLE, OPTIONAL, PVOID, SIZE_T, USHORT, VOID } from '@bun-win32/core';

export const COMPRESS_RAW = 0x2000_0000;

export enum COMPRESS_ALGORITHM {
  COMPRESS_ALGORITHM_INVALID = 0,
  COMPRESS_ALGORITHM_LZMS = 5,
  COMPRESS_ALGORITHM_MAX = 6,
  COMPRESS_ALGORITHM_MSZIP = 2,
  COMPRESS_ALGORITHM_NULL = 1,
  COMPRESS_ALGORITHM_XPRESS = 3,
  COMPRESS_ALGORITHM_XPRESS_HUFF = 4,
}

export enum COMPRESS_INFORMATION_CLASS {
  COMPRESS_INFORMATION_CLASS_BLOCK_SIZE = 1,
  COMPRESS_INFORMATION_CLASS_INVALID = 0,
  COMPRESS_INFORMATION_CLASS_LEVEL = 2,
}

export enum FCIERROR {
  FCIERR_ALLOC_FAIL = 3,
  FCIERR_BAD_COMPR_TYPE = 5,
  FCIERR_CAB_FILE = 6,
  FCIERR_CAB_FORMAT_LIMIT = 9,
  FCIERR_MCI_FAIL = 8,
  FCIERR_NONE = 0,
  FCIERR_OPEN_SRC = 1,
  FCIERR_READ_SRC = 2,
  FCIERR_TEMP_FILE = 4,
  FCIERR_USER_ABORT = 7,
}

export enum FDIERROR {
  FDIERROR_ALLOC_FAIL = 5,
  FDIERROR_BAD_COMPR_TYPE = 6,
  FDIERROR_CABINET_NOT_FOUND = 1,
  FDIERROR_CORRUPT_CABINET = 4,
  FDIERROR_MDI_FAIL = 7,
  FDIERROR_NONE = 0,
  FDIERROR_NOT_A_CABINET = 2,
  FDIERROR_RESERVE_MISMATCH = 9,
  FDIERROR_TARGET_FILE = 8,
  FDIERROR_UNKNOWN_CABINET_VERSION = 3,
  FDIERROR_USER_ABORT = 11,
  FDIERROR_WRONG_CABINET = 10,
}

export enum FDINOTIFICATIONTYPE {
  fdintCABINET_INFO = 0,
  fdintCLOSE_FILE_INFO = 3,
  fdintCOPY_FILE = 2,
  fdintENUMERATE = 5,
  fdintNEXT_CABINET = 4,
  fdintPARTIAL_FILE = 1,
}

export enum TCOMP_TYPE {
  tcompTYPE_LZX = 3,
  tcompTYPE_MSZIP = 1,
  tcompTYPE_NONE = 0,
  tcompTYPE_QUANTUM = 2,
}

export type COMPRESSOR_HANDLE = bigint;
export type DECOMPRESSOR_HANDLE = bigint;
export type HFCI = bigint;
export type HFDI = bigint;
export type PCABINETDLLVERSIONINFO = Pointer;
export type PCCAB = Pointer;
export type PCOMPRESS_ALLOCATION_ROUTINES = Pointer;
export type PCOMPRESSOR_HANDLE = Pointer;
export type PDECOMPRESSOR_HANDLE = Pointer;
export type PERF = Pointer;
export type PFDICABINETINFO = Pointer;
export type PFNALLOC = Pointer;
export type PFNCLOSE = Pointer;
export type PFNFCIALLOC = Pointer;
export type PFNFCICLOSE = Pointer;
export type PFNFCIDELETE = Pointer;
export type PFNFCIFILEPLACED = Pointer;
export type PFNFCIFREE = Pointer;
export type PFNFCIGETNEXTCABINET = Pointer;
export type PFNFCIGETOPENINFO = Pointer;
export type PFNFCIGETTEMPFILE = Pointer;
export type PFNFCIOPEN = Pointer;
export type PFNFCIREAD = Pointer;
export type PFNFCISEEK = Pointer;
export type PFNFCISTATUS = Pointer;
export type PFNFCIWRITE = Pointer;
export type PFNFDIDECRYPT = Pointer;
export type PFNFDINOTIFY = Pointer;
export type PFNFREE = Pointer;
export type PFNOPEN = Pointer;
export type PFNREAD = Pointer;
export type PFNSEEK = Pointer;
export type PFNWRITE = Pointer;
export type PSIZE_T = Pointer;
export type TCOMP = number;
