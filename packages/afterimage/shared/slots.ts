// COM vtable slots and interface IDs Afterimage calls beyond what @bun-win32/gpu exports.
// Every slot was counted from the Windows SDK 10.0.22000 headers: the C `…Vtbl` structs for DXGI,
// and the virtual (STDMETHOD) declarations walked through the inheritance chain for the C++-only
// Direct2D / DirectWrite headers — never from cheat-sheets.

export const D2D1Device = { CreateDeviceContext: 0x04 } as const;

export const D2D1DeviceContext = {
  BeginDraw: 0x30,
  Clear: 0x2f,
  CreateBitmapFromDxgiSurface: 0x3e,
  CreateSolidColorBrush: 0x08,
  DrawLine: 0x0f,
  DrawRoundedRectangle: 0x12,
  DrawText: 0x1b,
  DrawTextLayout: 0x1c,
  EndDraw: 0x31,
  FillEllipse: 0x15,
  FillRectangle: 0x11,
  FillRoundedRectangle: 0x13,
  PopAxisAlignedClip: 0x2e,
  PushAxisAlignedClip: 0x2d,
  SetAntialiasMode: 0x20,
  SetDpi: 0x33,
  SetTarget: 0x4a,
  SetTextAntialiasMode: 0x22,
  SetTransform: 0x1e,
} as const;

export const D2D1Factory1 = { CreateDevice: 0x11 } as const;

export const D2D1SolidColorBrush = { SetColor: 0x08, SetOpacity: 0x04 } as const;

export const D3D11Device = { OpenSharedResource: 0x1c } as const;

export const D3D11Device5 = { CreateFence: 0x44 } as const;

export const D3D11DeviceContext4 = { Signal: 0x93, Wait: 0x94 } as const;

export const D3D11Fence = { GetCompletedValue: 0x08, SetEventOnCompletion: 0x09 } as const;

export const DWriteFactory = { CreateTextFormat: 0x0f, CreateTextLayout: 0x12, GetSystemFontCollection: 0x03 } as const;

export const DWriteFontCollection = { FindFamilyName: 0x05 } as const;

export const DWriteTextFormat = { SetParagraphAlignment: 0x04, SetTextAlignment: 0x03, SetWordWrapping: 0x05 } as const;

export const DWriteTextLayout = { GetMetrics: 0x3c, SetCharacterSpacing: 0x45, SetMaxWidth: 0x1c } as const;

export const DXGIAdapter = { EnumOutputs: 0x07 } as const;

export const DXGIFactory2 = { CreateSwapChainForHwnd: 0x0f } as const;

export const DXGIObject = { GetParent: 0x06 } as const;

export const DXGIOutput = { GetDesc: 0x07 } as const;

export const DXGIOutput1 = { DuplicateOutput: 0x16 } as const;

export const DXGIOutputDuplication = { AcquireNextFrame: 0x08, GetDesc: 0x07, GetFrameDirtyRects: 0x09, GetFrameMoveRects: 0x0a, ReleaseFrame: 0x0e } as const;

export const DXGIResource = { GetSharedHandle: 0x08 } as const;

export const DXGISwapChain = { GetBuffer: 0x09, Present: 0x08, ResizeBuffers: 0x0d } as const;

export const DXGISwapChain2 = { GetFrameLatencyWaitableObject: 0x21, SetMaximumFrameLatency: 0x1f } as const;

export const IID = {
  ID2D1Factory1: 'bb12d362-daee-4b9a-aa1d-14ba401cfa1f',
  ID3D11Device5: '8ffde202-a0e7-45df-9e01-e837801b5ea0',
  ID3D11DeviceContext4: '917600da-f58c-4c33-98d8-3e15b390fa24',
  ID3D11Fence: 'affde9d1-1df7-4bb7-8a34-0f46251dab80',
  IDWriteFactory: 'b859ee5a-d838-4b5b-a2e8-1adc7d93db48',
  IDWriteTextLayout1: '9064d822-80a7-465c-a986-df65f78b8feb',
  IDXGIFactory2: '50c83a1c-e072-4c48-87b0-3630fa36a6d0',
  IDXGIOutput1: '00cddea8-939b-4b83-a340-a685226666cc',
  IDXGIResource: '035f3ab4-482e-4e50-b41f-8a7f8bd8960b',
  IDXGISurface: 'cafcb56c-6ac3-4889-bf47-9e23bbd260ec',
  IDXGISwapChain2: 'a8be2ac4-199f-4946-b331-79599fb98de7',
} as const;
