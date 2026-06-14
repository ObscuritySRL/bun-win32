/**
 * Desktop MCP — drive Windows through the bun-uia MCP server over real stdio JSON-RPC.
 *
 * Spawns mcp.ts exactly as Claude / Claude Code would (`claude mcp add uia -- bunx bun-uia-mcp`), runs
 * the initialize handshake, lists the tools, attaches to Calculator, captures a ref-keyed
 * desktop_snapshot, and invokes a button BY REF — the precise loop an MCP client runs. Asserts the
 * round-trip; this example IS the integration test (exits non-zero on failure).
 *
 * APIs demonstrated:
 * - mcp.ts (the zero-dep stdio MCP server): initialize, tools/list, tools/call (attach, desktop_snapshot, invoke)
 *
 * Run: bun run example/desktop-mcp.ts
 */
const server = Bun.spawn(['bun', `${import.meta.dir}/../mcp.ts`], { stdin: 'pipe', stdout: 'pipe', stderr: 'inherit' });
const decoder = new TextDecoder();
const encoder = new TextEncoder();
const pending = new Map<number, (message: { result?: { [key: string]: unknown }; error?: unknown }) => void>();
let buffer = '';
let nextId = 1;

void (async () => {
  for await (const chunk of server.stdout) {
    buffer += decoder.decode(chunk);
    let newline = buffer.indexOf('\n');
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line.length > 0) {
        const message = JSON.parse(line);
        if (typeof message.id === 'number' && pending.has(message.id)) {
          pending.get(message.id)?.(message);
          pending.delete(message.id);
        }
      }
      newline = buffer.indexOf('\n');
    }
  }
})();

function call(method: string, params: unknown): Promise<{ result?: { [key: string]: unknown }; error?: unknown }> {
  const id = nextId++;
  server.stdin.write(encoder.encode(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`));
  server.stdin.flush();
  return new Promise((resolve) => pending.set(id, resolve));
}
function textOf(response: { result?: { [key: string]: unknown } }): string {
  const content = response.result?.content;
  return Array.isArray(content) && content[0]?.type === 'text' ? String(content[0].text) : '';
}

Bun.spawn(['cmd', '/c', 'start', 'calc'], { stdout: 'ignore', stderr: 'ignore' });
await Bun.sleep(1800);

const init = await call('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'desktop-mcp-example', version: '1' } });
console.log(`  initialize -> ${init.result?.serverInfo && JSON.stringify(init.result.serverInfo)} ${init.result?.protocolVersion}`);
server.stdin.write(encoder.encode(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} })}\n`));
server.stdin.flush();

const tools = await call('tools/list', {});
const toolList = Array.isArray(tools.result?.tools) ? tools.result.tools : [];
console.log(`  tools/list -> ${toolList.length} tools`);

const attach = await call('tools/call', { name: 'attach', arguments: { title: 'Calculator' } });
const snapshot = textOf(attach);
const fiveRef = snapshot.match(/Button "Five" \[ref=(e\d+)\]/);
console.log(`  attach -> ${snapshot.split('\n').length}-line snapshot; Five = ${fiveRef?.[1] ?? '(not found)'}`);

let ok = false;
if (fiveRef) {
  const invoked = await call('tools/call', { name: 'invoke', arguments: { element: 'Five button', ref: fiveRef[1] } });
  ok = invoked.result?.isError !== true;
  console.log(`  invoke Five BY REF -> isError: ${invoked.result?.isError === true}`);
}
const read = await call('tools/call', { name: 'find_and_act', arguments: { do: 'read', selector: { automationId: 'CalculatorResults' } } });
console.log(`  find_and_act read -> ${textOf(read).split('\n')[0]}`);

server.stdin.end();
await Bun.sleep(300);
console.log(ok ? '\n  \x1b[92m✓ Claude can drive Windows through the MCP server (invoke-by-ref works)\x1b[0m\n' : '\n  \x1b[91m✗ MCP round-trip failed\x1b[0m\n');
process.exit(ok ? 0 : 1);
