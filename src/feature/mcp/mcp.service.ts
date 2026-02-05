import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

interface McpContext {
  apiKey: string;
  apiBaseUrl: string;
}

interface ToolResult {
  content: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }>;
  isError?: boolean;
}

class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: string
  ) {
    super(message);
  }
}

@Injectable()
export class McpService {
  private readonly serverInfo = {
    name: 'todo-backend-mcp',
    version: '1.0.0',
  };

  private readonly protocolVersion = '2025-11-25';

  isAuthorized(req: Request): boolean {
    const apiKey = this.extractApiKey(req);
    return Boolean(apiKey && apiKey === process.env.API_SECRET_KEY);
  }

  sendUnauthorized(res: Response) {
    res.status(401).json({
      jsonrpc: '2.0',
      id: null,
      error: { code: 401, message: 'Invalid or missing API key' },
    });
  }

  shouldUseEventStream(req: Request): boolean {
    const accept = String(req.headers['accept'] ?? '');
    const acceptsEventStream = accept.includes('text/event-stream');
    const acceptsJson = accept.includes('application/json') || accept.includes('*/*') || !accept;
    return acceptsEventStream && !acceptsJson;
  }

  isOriginAllowed(req: Request): boolean {
    const originHeader = req.headers['origin'];
    const origin = typeof originHeader === 'string' ? originHeader.trim() : '';

    const allowedOrigins = (process.env.MCP_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const allowedHosts = (process.env.MCP_ALLOWED_HOSTS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const forwardedHost = req.headers['x-forwarded-host'];
    const hostHeader = (typeof forwardedHost === 'string' && forwardedHost.trim())
      ? forwardedHost
      : req.headers['host'];
    const host = typeof hostHeader === 'string' ? hostHeader.split(',')[0].trim() : '';

    if (allowedHosts.length > 0 && !allowedHosts.includes(host)) {
      return false;
    }

    if (!origin) {
      return true;
    }

    let originUrl: URL | null = null;
    try {
      originUrl = new URL(origin);
    } catch {
      return false;
    }

    if (allowedOrigins.length > 0) {
      return allowedOrigins.includes(origin);
    }

    return originUrl.host === host;
  }

  validateProtocolVersion(payload: unknown) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return null;
    }

    const request = payload as { method?: unknown; id?: unknown; params?: unknown };
    if (request.method !== 'initialize') {
      return null;
    }

    const params = request.params as { protocolVersion?: unknown } | undefined;
    const version = params?.protocolVersion;
    if (version !== this.protocolVersion) {
      return {
        jsonrpc: '2.0',
        id: (request.id as string | number | null | undefined) ?? null,
        error: {
          code: -32602,
          message: `Unsupported protocol version: ${version ?? 'missing'}`,
        },
      };
    }

    return null;
  }

  async handleHttpRequest(req: Request, res: Response, body: unknown) {
    const ctx = this.buildContext(req);
    const server = this.createServer(ctx);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  }

  private createServer(ctx: McpContext) {
    const server = new McpServer({
      name: this.serverInfo.name,
      version: this.serverInfo.version,
    });

    server.registerTool(
      'ai.chat',
      {
        title: 'ai.chat',
        description: 'Generate an AI response.',
        inputSchema: {
          prompt: z.string(),
          model: z.string().optional(),
          rolePrompt: z.string().optional(),
        },
      },
      async ({ prompt, model, rolePrompt }) => {
        const body = this.pickArgs({ prompt, model, rolePrompt }, ['prompt', 'model', 'rolePrompt']);
        const text = await this.fetchText(
          `${ctx.apiBaseUrl}/ai/chat`,
          { method: 'POST', body: JSON.stringify(body) },
          ctx
        );
        return this.buildToolText(text);
      }
    );

    server.registerTool(
      'ai.summarize',
      {
        title: 'ai.summarize',
        description: 'Summarize chat messages and return a JPEG image.',
        inputSchema: {
          messages: z.array(
            z.object({
              sender: z.string(),
              content: z.string(),
              timestamp: z.string(),
            })
          ),
          selfName: z.string().optional(),
          groupName: z.string().optional(),
          includeRanking: z.boolean().optional(),
        },
      },
      async ({ messages, selfName, groupName, includeRanking }) => {
        const body = this.pickArgs(
          { messages, selfName, groupName, includeRanking },
          ['messages', 'selfName', 'groupName', 'includeRanking']
        );
        const image = await this.fetchBinary(
          `${ctx.apiBaseUrl}/ai/summarize`,
          { method: 'POST', body: JSON.stringify(body) },
          ctx
        );
        return this.buildToolImage(image.data, image.contentType || 'image/jpeg');
      }
    );

    server.registerTool(
      'command.run',
      {
        title: 'command.run',
        description: 'Execute a command and return text or image.',
        inputSchema: {
          command: z.string(),
        },
      },
      async ({ command }) => {
        const body = { command };
        const result = await this.fetchJson<{ content?: string; type?: string }>(
          `${ctx.apiBaseUrl}/command`,
          { method: 'POST', body: JSON.stringify(body) },
          ctx
        );
        return this.formatCommandResult(result);
      }
    );

    server.registerTool(
      'command.help',
      {
        title: 'command.help',
        description: 'List available commands.',
        inputSchema: {},
      },
      async () => {
        const result = await this.fetchJson<unknown>(`${ctx.apiBaseUrl}/command/hp`, { method: 'GET' }, ctx);
        return this.buildToolText(this.formatText(result));
      }
    );

    server.registerTool(
      'command.helpImage',
      {
        title: 'command.helpImage',
        description: 'Get command list as PNG image.',
        inputSchema: {},
      },
      async () => {
        const image = await this.fetchBinary(`${ctx.apiBaseUrl}/command/hpimg`, { method: 'GET' }, ctx);
        return this.buildToolImage(image.data, image.contentType || 'image/png');
      }
    );

    server.registerTool(
      'command.relay',
      {
        title: 'command.relay',
        description: 'Get RelayPulse screenshot (JPEG).',
        inputSchema: {
          provider: z.string().optional(),
          period: z.string().optional(),
        },
      },
      async ({ provider, period }) => {
        const relayProvider = provider || '88code';
        const relayPeriod = period || '24h';
        const url = new URL(`${ctx.apiBaseUrl}/command/relay`);
        url.searchParams.set('provider', relayProvider);
        url.searchParams.set('period', relayPeriod);
        const image = await this.fetchBinary(url.toString(), { method: 'GET' }, ctx);
        return this.buildToolImage(image.data, image.contentType || 'image/jpeg');
      }
    );

    server.registerTool(
      'proxy.request',
      {
        title: 'proxy.request',
        description: 'Proxy HTTP request and return JSON result.',
        inputSchema: {
          url: z.string(),
          method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
          origin: z.string().optional(),
          referer: z.string().optional(),
          userAgent: z.string().optional(),
          headers: z.union([z.string(), z.record(z.unknown())]).optional(),
          body: z.string().optional(),
        },
      },
      async ({ url, method, origin, referer, userAgent, headers, body }) => {
        const payload = this.pickArgs(
          { url, method, origin, referer, userAgent, headers, body },
          ['url', 'method', 'origin', 'referer', 'userAgent', 'headers', 'body']
        );
        payload.headers = this.normalizeHeadersArg(payload.headers);
        const result = await this.fetchJson<unknown>(
          `${ctx.apiBaseUrl}/proxy/request`,
          { method: 'POST', body: JSON.stringify(payload) },
          ctx
        );
        return this.buildToolText(this.formatText(result));
      }
    );

    server.registerTool(
      'proxy.stream',
      {
        title: 'proxy.stream',
        description: 'Proxy a request and return raw binary as base64.',
        inputSchema: {
          url: z.string(),
          origin: z.string().optional(),
          referer: z.string().optional(),
          userAgent: z.string().optional(),
          headers: z.union([z.string(), z.record(z.unknown())]).optional(),
        },
      },
      async ({ url, origin, referer, userAgent, headers }) => {
        const streamUrl = new URL(`${ctx.apiBaseUrl}/proxy/stream`);
        this.appendQuery(
          streamUrl,
          { url, origin, referer, userAgent, headers },
          ['url', 'origin', 'referer', 'userAgent', 'headers']
        );
        const image = await this.fetchBinary(streamUrl.toString(), { method: 'GET' }, ctx);
        return this.buildToolImage(image.data, image.contentType || 'application/octet-stream');
      }
    );

    server.registerTool(
      'proxy.health',
      {
        title: 'proxy.health',
        description: 'Proxy service health check.',
        inputSchema: {},
      },
      async () => {
        const result = await this.fetchJson<unknown>(`${ctx.apiBaseUrl}/proxy/health`, { method: 'GET' }, ctx);
        return this.buildToolText(this.formatText(result));
      }
    );

    server.registerTool(
      'bookmark.create',
      {
        title: 'bookmark.create',
        description: 'Create or update a bookmark.',
        inputSchema: {
          url: z.string(),
          title: z.string().optional(),
          image: z.string().optional(),
          remark: z.string().optional(),
          content: z.string().optional(),
        },
      },
      async ({ url, title, image, remark, content }) => {
        const payload = this.pickArgs(
          { url, title, image, remark, content },
          ['url', 'title', 'image', 'remark', 'content']
        );
        const result = await this.fetchJson<unknown>(
          `${ctx.apiBaseUrl}/bookmark`,
          { method: 'POST', body: JSON.stringify(payload) },
          ctx
        );
        return this.buildToolText(this.formatText(result));
      }
    );

    server.registerTool(
      'bookmark.getByUrl',
      {
        title: 'bookmark.getByUrl',
        description: 'Get bookmark by URL.',
        inputSchema: {
          url: z.string(),
        },
      },
      async ({ url }) => {
        const endpoint = new URL(`${ctx.apiBaseUrl}/bookmark/search`);
        endpoint.searchParams.set('url', url);
        const result = await this.fetchJson<unknown>(endpoint.toString(), { method: 'GET' }, ctx);
        return this.buildToolText(this.formatText(result));
      }
    );

    server.registerTool(
      'bookmark.deleteByUrl',
      {
        title: 'bookmark.deleteByUrl',
        description: 'Delete bookmark by URL.',
        inputSchema: {
          url: z.string(),
        },
      },
      async ({ url }) => {
        const endpoint = new URL(`${ctx.apiBaseUrl}/bookmark/search`);
        endpoint.searchParams.set('url', url);
        await this.fetchJson<unknown>(endpoint.toString(), { method: 'DELETE' }, ctx);
        return this.buildToolText('Deleted');
      }
    );

    server.registerTool(
      'bookmark.health',
      {
        title: 'bookmark.health',
        description: 'Bookmark service health check.',
        inputSchema: {},
      },
      async () => {
        const result = await this.fetchJson<unknown>(`${ctx.apiBaseUrl}/bookmark/health`, { method: 'GET' }, ctx);
        return this.buildToolText(this.formatText(result));
      }
    );

    server.registerTool(
      'fishingTime.get',
      {
        title: 'fishingTime.get',
        description: 'Get fishing time information.',
        inputSchema: {},
      },
      async () => {
        const result = await this.fetchJson<unknown>(`${ctx.apiBaseUrl}/fishingTime`, { method: 'GET' }, ctx);
        return this.buildToolText(this.formatText(result));
      }
    );

    return server;
  }

  private buildToolText(text: string, isError = false): ToolResult {
    return {
      content: [{ type: 'text', text }],
      ...(isError ? { isError: true } : {}),
    };
  }

  private buildToolImage(buffer: Buffer, mimeType: string): ToolResult {
    return {
      content: [
        {
          type: 'image',
          data: buffer.toString('base64'),
          mimeType,
        },
      ],
    };
  }

  private formatCommandResult(result?: { content?: string; type?: string }): ToolResult {
    if (!result) {
      return this.buildToolText('Empty command result.', true);
    }

    const content = result.content ?? '';
    if (result.type === 'image') {
      const parsed = this.parseDataUri(content);
      if (parsed) {
        return this.buildToolImage(Buffer.from(parsed.data, 'base64'), parsed.mimeType);
      }
      return this.buildToolText(content || 'Image result returned without data URI.');
    }

    return this.buildToolText(content);
  }

  private parseDataUri(value: string): { mimeType: string; data: string } | null {
    const match = /^data:([^;]+);base64,(.+)$/.exec(value);
    if (!match) {
      return null;
    }
    return { mimeType: match[1], data: match[2] };
  }

  private buildContext(req: Request): McpContext {
    return {
      apiKey: this.extractApiKey(req) ?? '',
      apiBaseUrl: this.resolveApiBase(req),
    };
  }

  private extractApiKey(req: Request): string | undefined {
    const headerKey = req.headers['x-api-key'];
    if (typeof headerKey === 'string' && headerKey.trim()) {
      return headerKey.trim();
    }

    const auth = req.headers['authorization'];
    if (typeof auth === 'string') {
      const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private resolveApiBase(req: Request): string {
    const explicit = process.env.API_BASE_URL;
    if (explicit) {
      return explicit.replace(/\/+$/, '') + '/api';
    }

    const protoHeader = req.headers['x-forwarded-proto'];
    const hostHeader = req.headers['x-forwarded-host'] ?? req.headers['host'];
    const proto = typeof protoHeader === 'string' ? protoHeader.split(',')[0].trim() : 'http';
    const host = typeof hostHeader === 'string' ? hostHeader.split(',')[0].trim() : 'localhost';
    return `${proto}://${host}/api`;
  }

  private pickArgs(source: Record<string, unknown>, keys: string[]) {
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
        result[key] = source[key];
      }
    }
    return result;
  }

  private appendQuery(url: URL, args: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = args?.[key];
      if (value === undefined || value === null) {
        continue;
      }
      if (key === 'headers') {
        const normalized = this.normalizeHeadersArg(value);
        if (normalized) {
          url.searchParams.set(key, normalized);
        }
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  private normalizeHeadersArg(value: unknown): string | undefined {
    if (!value) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private formatText(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (value === undefined) {
      return '';
    }
    return JSON.stringify(value);
  }

  private async fetchJson<T>(url: string, options: RequestInit, ctx: McpContext): Promise<T> {
    const response = await this.fetch(url, options, ctx);
    const text = await response.text();

    if (!response.ok) {
      throw new UpstreamError('Upstream request failed', response.status, text);
    }

    if (!text) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  private async fetchText(url: string, options: RequestInit, ctx: McpContext): Promise<string> {
    const response = await this.fetch(url, options, ctx);
    const text = await response.text();

    if (!response.ok) {
      throw new UpstreamError('Upstream request failed', response.status, text);
    }

    return text;
  }

  private async fetchBinary(
    url: string,
    options: RequestInit,
    ctx: McpContext
  ): Promise<{ data: Buffer; contentType?: string }> {
    const response = await this.fetch(url, options, ctx);
    const buffer = Buffer.from(await response.arrayBuffer());

    if (!response.ok) {
      const text = buffer.toString('utf8');
      throw new UpstreamError('Upstream request failed', response.status, text);
    }

    return {
      data: buffer,
      contentType: response.headers.get('content-type') ?? undefined,
    };
  }

  private async fetch(url: string, options: RequestInit, ctx: McpContext) {
    const headers = new Headers(options.headers ?? {});
    headers.set('x-api-key', ctx.apiKey);
    headers.set('authorization', `Bearer ${ctx.apiKey}`);

    if (options.body) {
      headers.set('content-type', 'application/json');
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }
}
