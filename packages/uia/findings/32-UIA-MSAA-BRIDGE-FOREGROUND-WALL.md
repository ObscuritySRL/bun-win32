# 32 — The UIA→MSAA bridge ACTIVATES the window (foreground steal) — and the focus-clean posted path around it

## The wall (re-confirmed live, reproducible)

On a **classic Win32 / HWND (MSAA-bridged)** control, a UIA control-pattern act —
`IValueProvider::SetValue`, `IToggleProvider::Toggle`, `IInvokeProvider::Invoke` — does NOT
stay cursor-free. The OS UIA core routes the pattern through the legacy IAccessible bridge,
which calls `accDoDefaultAction` **after setting focus to the control**. Setting focus on a
background window's child control **activates that window and steals the foreground** to the
control's own HWND.

There is **no `SetForegroundWindow` anywhere in this package's `patterns.ts` / `element.ts`** —
the activation is entirely inside the OS bridge. It is unavoidable for these three patterns on
classic Win32.

Sampled with `GetForegroundWindow()` before/after each op on a **minimized** target
(`foregroundWindow()` from `window.ts`):

| op | before → after | verdict |
|---|---|---|
| `setControlText` (WM_SETTEXT) on Notepad RichEditD2DPT | `0xa0992` → `0xa0992` | UNCHANGED — text lands |
| `postText` (WM_CHAR) | `0xa0992` → `0xa0992` | UNCHANGED — text lands |
| `Element.setValue` (IValueProvider::SetValue) | `0xa0992` → `0x3b0a54` (edit's OWN HWND) | **STOLEN** — text lands |
| `Element.toggle` (ITogglePattern) on charmap "Advanced view" checkbox | `0xa0992` → `0x1b032a` (checkbox HWND) | **STOLEN** |
| `Element.invoke` (IInvokePattern) on charmap "Select" button | `0xa0992` → `0x290f1c` (button HWND) | **STOLEN** |

The raw `Element.setValue/toggle/invoke` methods are now documented as activating the control's
window (JSDoc in `element.ts`), and `example/pattern-no-raise.integration.test.ts` locks that
honest outcome for the raw methods.

## The focus-clean path around it (the fix)

A classic Win32 control accepts a window message that does the SAME work with **no focus change
and no foreground steal**, even while the owning window is minimized/background/locked:

| control | focus-clean message | proven |
|---|---|---|
| text field (Edit/RichEdit, own HWND) | `SendMessageW(WM_SETTEXT)` — `setControlText` | FG unchanged, text reads back |
| `Button`-class push button | `PostMessageW(BM_CLICK)` — `postButtonClick` | FG unchanged, fires WM_COMMAND |
| `Button`-class checkbox/radio | `PostMessageW(BM_CLICK)` — `postButtonClick` | FG unchanged, toggles (state 1→0→1) |

`BM_CLICK` is a **no-op on any non-"Button" window class**, so the guard is strict:
own HWND **and** `className === 'Button'`. A WinUI ToggleSwitch / WPF / Electron / Chromium
sub-control has **no own HWND** (or a non-"Button" class) — it has only the UIA pattern, which
activates it; that remains the documented activation for those.

The MCP tool layer (`mcp.ts`) now routes around the bridge:

- `set_value` → `setValueSmart`: WM_SETTEXT FIRST for an own-HWND text control (Value/Text
  pattern present, NOT a slider/spinner); ValuePattern only when there is no own HWND; the
  numeric RangeValue branch stays ahead of the trailing WM_SETTEXT fallback for sliders/spinners.
- `toggle` → `toggleSmart`: BM_CLICK for an own-HWND "Button" checkbox; TogglePattern otherwise.
- `invoke` → `invokeSmart`: BM_CLICK for an own-HWND "Button"; InvokePattern otherwise.

End-to-end guard: `example/mcp-pattern-no-raise.integration.test.ts` drives the MCP tools over
JSON-RPC against a **minimized** charmap and asserts the foreground is **FULLY UNCHANGED** across
each call (the stronger outcome the fix delivers), and that each result names the posted path.

## Doctrine

- The raw `Element.{setValue,toggle,invoke}` are the unavoidable-OS-activation path (documented).
- The **agent-facing MCP tools** are focus-clean for classic Win32/HWND controls — that is what
  the "cursor-free, works minimized/background/locked" claim now actually means.
- A minimized window's clickable point is OFF-SCREEN (~-32000), so a posted COORDINATE click can
  NOT replace these (the original proposal's `postClickToHwnd(clickablePoint)` idea is a dead-end
  for minimized targets — `clickablePoint` is `null`). The **message-based** BM_CLICK / WM_SETTEXT
  is the only focus-clean path that works minimized.
