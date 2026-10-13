/**
 * Shared Codex usage reader for the native Windows presentation examples.
 *
 * Keeps one `codex app-server` connection alive and exposes only the documented
 * `account/rateLimits/read` result needed by the widgets.
 */

type CodexProcess = Bun.Subprocess<'pipe', 'pipe', 'ignore'>;

interface CodexReader {
  read(): Promise<{ done: boolean; value?: Uint8Array<ArrayBuffer> }>;
}

export interface CodexRateWindow {
  resetsAt: number | null;
  utilization: number;
  windowDurationMinutes: number;
}

const REQUEST_TIMEOUT_MS = 15_000;

const protocolErrorMessage = (value: unknown): string => {
  if (typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string') return value.message;
  return 'Codex app-server returned an unknown error.';
};

const rateWindowFrom = (value: unknown): CodexRateWindow | null => {
  if (typeof value !== 'object' || value === null) return null;
  const utilization = 'usedPercent' in value && typeof value.usedPercent === 'number' ? value.usedPercent : null;
  const windowDurationMinutes = 'windowDurationMins' in value && typeof value.windowDurationMins === 'number' ? value.windowDurationMins : null;
  const resetsAt = 'resetsAt' in value && typeof value.resetsAt === 'number' ? value.resetsAt : null;
  if (utilization === null || !Number.isFinite(utilization) || windowDurationMinutes === null || !Number.isFinite(windowDurationMinutes) || windowDurationMinutes <= 0) return null;
  return { resetsAt: resetsAt !== null && Number.isFinite(resetsAt) ? resetsAt : null, utilization: Math.max(0, Math.min(100, utilization)), windowDurationMinutes };
};

const rateLimitBucketFrom = (value: unknown): unknown => {
  if (typeof value !== 'object' || value === null) return null;
  const requestedLimitIdentifier = Bun.env.CODEX_USAGE_LIMIT_ID;
  const rateLimitsByIdentifier = 'rateLimitsByLimitId' in value ? value.rateLimitsByLimitId : null;
  if (requestedLimitIdentifier) {
    if (typeof rateLimitsByIdentifier !== 'object' || rateLimitsByIdentifier === null) return null;
    return Reflect.get(rateLimitsByIdentifier, requestedLimitIdentifier);
  }
  if ('rateLimits' in value && value.rateLimits !== null) return value.rateLimits;
  if (typeof rateLimitsByIdentifier !== 'object' || rateLimitsByIdentifier === null) return null;
  const codexRateLimits: unknown = Reflect.get(rateLimitsByIdentifier, 'codex');
  if (codexRateLimits !== undefined) return codexRateLimits;
  const firstIdentifier = Object.keys(rateLimitsByIdentifier)[0];
  return firstIdentifier ? Reflect.get(rateLimitsByIdentifier, firstIdentifier) : null;
};

const rateWindowsFrom = (value: unknown): CodexRateWindow[] => {
  const rateLimits = rateLimitBucketFrom(value);
  if (typeof rateLimits !== 'object' || rateLimits === null) return [];
  const windows: CodexRateWindow[] = [];
  if ('primary' in rateLimits) {
    const primary = rateWindowFrom(rateLimits.primary);
    if (primary) windows.push(primary);
  }
  if ('secondary' in rateLimits) {
    const secondary = rateWindowFrom(rateLimits.secondary);
    if (secondary) windows.push(secondary);
  }
  return windows.sort((left, right) => left.windowDurationMinutes - right.windowDurationMinutes);
};

export const formatCodexReset = (resetsAt: number | null): string => {
  if (resetsAt === null) return '';
  const totalMinutes = Math.ceil((resetsAt * 1000 - Date.now()) / 60_000);
  if (totalMinutes <= 0) return 'now';
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (totalMinutes < 60) return `${minutes}m`;
  if (totalMinutes < 2880) return `${days * 24 + hours}h ${minutes}m`;
  return `${days}d ${hours}h`;
};

export const formatCodexWindow = (minutes: number): string => {
  if (minutes >= 1440 && minutes % 1440 === 0) return `${minutes / 1440}d`;
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60}h`;
  return `${minutes}m`;
};

export class CodexUsageClient {
  #buffered = '';
  #child: CodexProcess | null = null;
  #decoder = new TextDecoder();
  #nextIdentifier = 1;
  #reader: CodexReader | null = null;

  async #readLine(): Promise<string> {
    while (true) {
      const newlineIndex = this.#buffered.indexOf('\n');
      if (newlineIndex >= 0) {
        const line = this.#buffered.slice(0, newlineIndex).replace(/\r$/, '');
        this.#buffered = this.#buffered.slice(newlineIndex + 1);
        return line;
      }
      if (!this.#reader) throw new Error('Codex app-server is not running.');
      const chunk = await this.#reader.read();
      if (chunk.done) {
        this.#buffered += this.#decoder.decode();
        if (this.#buffered) {
          const line = this.#buffered.replace(/\r$/, '');
          this.#buffered = '';
          return line;
        }
        throw new Error('Codex app-server exited.');
      }
      this.#buffered += this.#decoder.decode(chunk.value, { stream: true });
    }
  }

  async #readResponse(identifier: number): Promise<unknown> {
    while (true) {
      const line = await this.#readLine();
      if (!line.trim()) continue;
      let message: unknown;
      try {
        message = JSON.parse(line);
      } catch {
        continue;
      }
      if (typeof message !== 'object' || message === null || 'method' in message || !('id' in message) || message.id !== identifier) continue;
      if ('error' in message) throw new Error(protocolErrorMessage(message.error));
      if ('result' in message) return message.result;
    }
  }

  async #request(method: string, params?: unknown): Promise<unknown> {
    if (!this.#child) throw new Error('Codex app-server is not running.');
    const identifier = this.#nextIdentifier++;
    this.#child.stdin.write(`${JSON.stringify(params === undefined ? { id: identifier, method } : { id: identifier, method, params })}\n`);
    this.#child.stdin.flush();
    let timeout: ReturnType<typeof setTimeout> | null = null;
    try {
      return await Promise.race([
        this.#readResponse(identifier),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error(`${method} timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`)), REQUEST_TIMEOUT_MS);
        }),
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  async #start(): Promise<void> {
    if (this.#child && this.#child.exitCode === null) return;
    this.close();
    const executable = Bun.env.CODEX_BIN ?? 'codex';
    this.#child = Bun.spawn({ cmd: [executable, 'app-server', '-c', 'model_reasoning_effort=none'], stdin: 'pipe', stdout: 'pipe', stderr: 'ignore', windowsHide: true });
    this.#reader = this.#child.stdout.getReader();
    await this.#request('initialize', { clientInfo: { name: 'bun_win32_codex_usage', title: 'bun-win32 Codex usage', version: '1.0.0' } });
    this.#child.stdin.write(`${JSON.stringify({ method: 'initialized', params: {} })}\n`);
    this.#child.stdin.flush();
  }

  public close(): void {
    const child = this.#child;
    this.#child = null;
    this.#reader = null;
    this.#buffered = '';
    this.#decoder = new TextDecoder();
    if (!child || child.exitCode !== null) return;
    try {
      child.stdin.end();
    } catch {}
    child.kill();
  }

  public async read(): Promise<CodexRateWindow[]> {
    try {
      await this.#start();
      const windows = rateWindowsFrom(await this.#request('account/rateLimits/read'));
      if (windows.length > 0) return windows.slice(0, 2);
      const selection = Bun.env.CODEX_USAGE_LIMIT_ID ? ` for limit ID ${Bun.env.CODEX_USAGE_LIMIT_ID}` : '';
      throw new Error(`No ChatGPT rate-limit windows were returned${selection}. Sign in to Codex with ChatGPT; API-key accounts do not expose subscription limits.`);
    } catch (error) {
      this.close();
      throw error;
    }
  }
}
