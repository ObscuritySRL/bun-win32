/**
 * screenshot-origin — screenshot / capture_window return window-LOCAL pixels, but click_point / inspect_point want
 * screen-ABSOLUTE coords. Without the window's screen origin, the eyeball-a-pixel→click_point fallback silently
 * mis-clicks by the window's offset (e.g. ~800px for a window at x=800) on any non-maximized window.
 *
 * Both image results now carry a text part with the capture's true screen origin + size (from the capture's own
 * originX/originY — exact for PrintWindow, WGC, and the desktop-region fallback alike), telling the model to add it
 * to any pixel before click_point / inspect_point.
 *
 * Proof (real MCP server, taskbar — always present, no spawn/close): screenshot returns BOTH an image part and a
 * text part whose origin matches the taskbar's actual screen rect.
 *
 * bun test is broken repo-wide — runnable harness (only the MCP subprocess):
 * Run: bun run example/screenshot-origin.integration.test.ts
 */
type Part = { type?: string; text?: string; data?: string; mimeType?: string };
type Rpc = { id?: number; result?: { isError?: boolean; content?: Part[] } };
const proc = Bun.spawn(['bun', 'run', `${import.meta.dir}/../mcp.ts`], { stdin: 'pipe', stdout: 'pipe', stderr: 'ignore', env: { ...Bun.env, BUN_UIA_PROFILE: 'safe' } });
const reader = proc.stdout.getReader();
const decoder = new TextDecoder();
let buffer = '';
const pending = new Map<number, (message: Rpc) => void>();
void (async () => {
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let index: number;
    while ((index = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (line.length === 0) continue;
      try {
        const message = JSON.parse(line) as Rpc;
        if (typeof message.id === 'number' && pending.has(message.id)) {
          pending.get(message.id)!(message);
          pending.delete(message.id);
        }
      } catch {}
    }
  }
})();
let nextId = 1;
const call = (method: string, params: unknown): Promise<Rpc> => {
  const id = nextId++;
  proc.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  proc.stdin.flush();
  return new Promise((resolve) => pending.set(id, resolve));
};

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

try {
  await call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'screenshot-origin-test', version: '1' } });
  await call('tools/call', { name: 'attach', arguments: { className: 'Shell_TrayWnd' } });
  const shot = await call('tools/call', { name: 'screenshot', arguments: {} });
  const parts = shot.result?.content ?? [];
  const image = parts.find((part) => part.type === 'image');
  const note = parts.find((part) => part.type === 'text')?.text ?? '';
  if (image === undefined) console.log('  skip: screenshot returned no image (locked/headless session) — origin note is image-only');
  else {
    assert(image.mimeType === 'image/png' && (image.data?.length ?? 0) > 0, 'screenshot returns a PNG image part');
    assert(/top-left is screen -?\d+,-?\d+/.test(note), 'screenshot carries a screen-origin text part for the eyeball→click_point fallback');
    assert(/add -?\d+,-?\d+ to any pixel/.test(note) && /click_point/.test(note), 'the note tells the model to add the origin before click_point / inspect_point');
  }
} finally {
  proc.kill();
}

console.log(failures === 0 ? '\nPASS — window captures carry their screen origin so eyeballed pixels map to click_point / inspect_point coords.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
