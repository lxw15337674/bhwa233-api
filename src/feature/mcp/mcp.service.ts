import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: JsonRpcId;
  method: string;
  params?: unknown;
}

interface JsonRpcSuccess {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result: unknown;
}

interface JsonRpcError {
  jsonrpc: '2.0';
  id: JsonRpcId;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

interface McpContext {
  apiKey: string;
  apiBaseUrl: string;
  protocolVersion: string;
  hasProtocolVersionHeader: boolean;
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface ToolCallParams {
  name?: string;
  arguments?: Record<string, unknown> | null;
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

  private readonly supportedProtocolVersions = new Set(['2025-11-25']);

  private readonly tools: ToolDefinition[] = [
    {
      name: 'ai.chat',
      description: 'Generate an AI response.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          model: { type: 'string' },
          rolePrompt: { type: 'string' },
        },
        required: ['prompt'],
        additionalProperties: false,
      },
    },
    {
      name: 'ai.summarize',
      description: 'Summarize chat messages and return a JPEG image.',
      inputSchema: {
        type: 'object',
        properties: {
          messages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                sender: { type: 'string' },
                content: { type: 'string' },
                timestamp: { type: 'string' },
              },
              required: ['sender', 'content', 'timestamp'],
              additionalProperties: false,
            },
          },
          selfName: { type: 'string' },
          groupName: { type: 'string' },
          includeRanking: { type: 'boolean' },
        },
        required: ['messages'],
        additionalProperties: false,
      },
    },
    {
      name: 'command.run',
      description: 'Execute a command and return text or image.',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string' },
        },
        required: ['command'],
        additionalProperties: false,
      },
    },
    {
      name: 'command.help',
      description: 'List available commands.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'command.helpImage',
      description: 'Get command list as PNG image.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'command.relay',
      description: 'Get RelayPulse screenshot (JPEG).',
      inputSchema: {
        type: 'object',
        properties: {
          provider: { type: 'string' },
          period: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
    {
      name: 'proxy.request',
      description: 'Proxy HTTP request and return JSON result.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
          origin: { type: 'string' },
          referer: { type: 'string' },
          userAgent: { type: 'string' },
          headers: { type: ['string', 'object'] },
          body: { type: 'string' },
        },
        required: ['url'],
        additionalProperties: false,
      },
    },
    {
      name: 'proxy.stream',
      description: 'Proxy a request and return raw binary as base64.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          origin: { type: 'string' },
          referer: { type: 'string' },
          userAgent: { type: 'string' },
          headers: { type: ['string', 'object'] },
        },
        required: ['url'],
        additionalProperties: false,
      },
    },
    {
      name: 'proxy.health',
      description: 'Proxy service health check.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'bookmark.create',
      description: 'Create or update a bookmark.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          title: { type: 'string' },
          image: { type: 'string' },
          remark: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['url'],
        additionalProperties: false,
      },
    },
    {
      name: 'bookmark.getByUrl',
      description: 'Get bookmark by URL.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
        },
        required: ['url'],
        additionalProperties: false,
      },
    },
    {
      name: 'bookmark.deleteByUrl',
      description: 'Delete bookmark by URL.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
        },
        required: ['url'],
        additionalProperties: false,
      },
    },
    {
      name: 'bookmark.health',
      description: 'Bookmark service health check.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'fishingTime.get',
      description: 'Get fishing time information.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
  ];

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

  isEventStreamRequest(req: Request): boolean {
    const accept = String(req.headers['accept'] ?? '');
    return accept.includes('text/event-stream');
  }

  shouldUseEventStream(req: Request): boolean {
    const accept = String(req.headers['accept'] ?? '');
    const acceptsEventStream = accept.includes('text/event-stream');
    const acceptsJson = accept.includes('application/json') || accept.includes('*/*') || !accept;
    return acceptsEventStream && !acceptsJson;
  }

  sendSse(res: Response, payload: unknown) {
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`event: message\ndata: ${JSON.stringify(payload)}\n\n`);
    res.end();
  }

  toErrorResponse(error: unknown): { status: number; payload: JsonRpcError } {
    if (error instanceof UpstreamError) {
      const status = error.status || 400;
      const code = status === 400 ? -32602 : -32603;
      return {
        status,
        payload: this.buildError(null, code, error.message, error.body),
      };
    }
    if (error instanceof Error) {
      return { status: 500, payload: this.buildError(null, -32603, error.message) };
    }
    return { status: 500, payload: this.buildError(null, -32603, 'Unknown error') };
  }

  buildContext(req: Request): McpContext {
    const { version: protocolVersion, hasHeader: hasProtocolVersionHeader } = this.resolveProtocolVersion(req);
    return {
      apiKey: this.extractApiKey(req) ?? '',
      apiBaseUrl: this.resolveApiBase(req),
      protocolVersion,
      hasProtocolVersionHeader,
    };
  }

  async handleRequest(payload: unknown, ctx: McpContext): Promise<JsonRpcResponse | JsonRpcResponse[] | null> {
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return this.buildError(null, -32600, 'Invalid JSON payload');
      }
    }

    if (Array.isArray(payload)) {
      const responses: JsonRpcResponse[] = [];
      for (const item of payload) {
        const response = await this.handleSingleRequest(item, ctx);
        if (response) {
          responses.push(response);
        }
      }
      return responses.length > 0 ? responses : null;
    }

    return this.handleSingleRequest(payload, ctx);
  }

  private async handleSingleRequest(payload: unknown, ctx: McpContext): Promise<JsonRpcResponse | null> {
    if (!payload || typeof payload !== 'object') {
      return this.buildError(null, -32600, 'Invalid Request');
    }

    const request = payload as JsonRpcRequest;
    const hasId = Object.prototype.hasOwnProperty.call(request, 'id');
    const id = hasId ? request.id ?? null : null;

    if (request.jsonrpc !== '2.0' || typeof request.method !== 'string') {
      return hasId ? this.buildError(id, -32600, 'Invalid Request') : null;
    }

    try {
      switch (request.method) {
        case 'initialize':
          return hasId ? this.buildSuccess(id, this.buildInitializeResult(ctx, request.params)) : null;
        case 'initialized':
          return null;
        case 'tools/list':
          return hasId ? this.buildSuccess(id, { tools: this.tools }) : null;
        case 'tools/call':
          return hasId ? this.buildSuccess(id, await this.handleToolCall(request.params, ctx)) : null;
        default:
          return hasId ? this.buildError(id, -32601, `Method not found: ${request.method}`) : null;
      }
    } catch (error) {
      if (error instanceof UpstreamError && error.status === 400) {
        return hasId ? this.buildError(id, -32602, error.message, error.body) : null;
      }
      if (error instanceof Error) {
        return hasId ? this.buildError(id, -32603, error.message) : null;
      }
      return hasId ? this.buildError(id, -32603, 'Unknown error') : null;
    }
  }

  private buildInitializeResult(ctx: McpContext, params?: unknown) {
    const paramVersion =
      typeof (params as { protocolVersion?: unknown })?.protocolVersion === 'string'
        ? (params as { protocolVersion: string }).protocolVersion
        : undefined;

    if (paramVersion && !this.supportedProtocolVersions.has(paramVersion)) {
      throw new UpstreamError(`Unsupported protocol version: ${paramVersion}`, 400);
    }

    if (ctx.hasProtocolVersionHeader && paramVersion && paramVersion !== ctx.protocolVersion) {
      throw new UpstreamError(
        `Protocol version mismatch between header (${ctx.protocolVersion}) and params (${paramVersion})`,
        400
      );
    }

    const protocolVersion = paramVersion ?? ctx.protocolVersion;
    if (!this.supportedProtocolVersions.has(protocolVersion)) {
      throw new UpstreamError(`Unsupported protocol version: ${protocolVersion}`, 400);
    }

    return {
      protocolVersion,
      capabilities: {
        tools: {},
      },
      serverInfo: this.serverInfo,
    };
  }

  private async handleToolCall(params: unknown, ctx: McpContext): Promise<ToolResult> {
    const callParams = params as ToolCallParams;
    const name = callParams?.name;
    const args = callParams?.arguments ?? {};

    if (!name) {
      return this.buildToolError('Missing tool name.');
    }

    try {
      switch (name) {
        case 'ai.chat': {
          const body = this.pickArgs(args, ['prompt', 'model', 'rolePrompt']);
          const text = await this.fetchText(`${ctx.apiBaseUrl}/ai/chat`, {
            method: 'POST',
            body: JSON.stringify(body),
          }, ctx);
          return this.buildToolText(text);
        }
        case 'ai.summarize': {
          const body = this.pickArgs(args, ['messages', 'selfName', 'groupName', 'includeRanking']);
          const image = await this.fetchBinary(`${ctx.apiBaseUrl}/ai/summarize`, {
            method: 'POST',
            body: JSON.stringify(body),
          }, ctx);
          return this.buildToolImage(image.data, image.contentType || 'image/jpeg');
        }
        case 'command.run': {
          const body = this.pickArgs(args, ['command']);
          const result = await this.fetchJson<{ content?: string; type?: string }>(
            `${ctx.apiBaseUrl}/command`,
            {
              method: 'POST',
              body: JSON.stringify(body),
            },
            ctx
          );
          return this.formatCommandResult(result);
        }
        case 'command.help': {
          const result = await this.fetchJson<unknown>(`${ctx.apiBaseUrl}/command/hp`, { method: 'GET' }, ctx);
          return this.buildToolText(this.formatText(result));
        }
        case 'command.helpImage': {
          const image = await this.fetchBinary(`${ctx.apiBaseUrl}/command/hpimg`, { method: 'GET' }, ctx);
          return this.buildToolImage(image.data, image.contentType || 'image/png');
        }
        case 'command.relay': {
          const provider = typeof args?.provider === 'string' ? args.provider : '88code';
          const period = typeof args?.period === 'string' ? args.period : '24h';
          const url = new URL(`${ctx.apiBaseUrl}/command/relay`);
          url.searchParams.set('provider', provider);
          url.searchParams.set('period', period);
          const image = await this.fetchBinary(url.toString(), { method: 'GET' }, ctx);
          return this.buildToolImage(image.data, image.contentType || 'image/jpeg');
        }
        case 'proxy.request': {
          const body = this.pickArgs(args, ['url', 'method', 'origin', 'referer', 'userAgent', 'headers', 'body']);
          body.headers = this.normalizeHeadersArg(body.headers);
          const result = await this.fetchJson<unknown>(
            `${ctx.apiBaseUrl}/proxy/request`,
            {
              method: 'POST',
              body: JSON.stringify(body),
            },
            ctx
          );
          return this.buildToolText(this.formatText(result));
        }
        case 'proxy.stream': {
          const url = new URL(`${ctx.apiBaseUrl}/proxy/stream`);
          this.appendQuery(url, args, ['url', 'origin', 'referer', 'userAgent', 'headers']);
          const image = await this.fetchBinary(url.toString(), { method: 'GET' }, ctx);
          return this.buildToolImage(image.data, image.contentType || 'application/octet-stream');
        }
        case 'proxy.health': {
          const result = await this.fetchJson<unknown>(`${ctx.apiBaseUrl}/proxy/health`, { method: 'GET' }, ctx);
          return this.buildToolText(this.formatText(result));
        }
        case 'bookmark.create': {
          const body = this.pickArgs(args, ['url', 'title', 'image', 'remark', 'content']);
          const result = await this.fetchJson<unknown>(
            `${ctx.apiBaseUrl}/bookmark`,
            { method: 'POST', body: JSON.stringify(body) },
            ctx
          );
          return this.buildToolText(this.formatText(result));
        }
        case 'bookmark.getByUrl': {
          const url = new URL(`${ctx.apiBaseUrl}/bookmark/search`);
          url.searchParams.set('url', String(args?.url ?? ''));
          const result = await this.fetchJson<unknown>(url.toString(), { method: 'GET' }, ctx);
          return this.buildToolText(this.formatText(result));
        }
        case 'bookmark.deleteByUrl': {
          const url = new URL(`${ctx.apiBaseUrl}/bookmark/search`);
          url.searchParams.set('url', String(args?.url ?? ''));
          await this.fetchJson<unknown>(url.toString(), { method: 'DELETE' }, ctx);
          return this.buildToolText('Deleted');
        }
        case 'bookmark.health': {
          const result = await this.fetchJson<unknown>(`${ctx.apiBaseUrl}/bookmark/health`, { method: 'GET' }, ctx);
          return this.buildToolText(this.formatText(result));
        }
        case 'fishingTime.get': {
          const result = await this.fetchJson<unknown>(`${ctx.apiBaseUrl}/fishingTime`, { method: 'GET' }, ctx);
          return this.buildToolText(this.formatText(result));
        }
        default:
          return this.buildToolError(`Unknown tool: ${name}`);
      }
    } catch (error) {
      if (error instanceof UpstreamError) {
        return this.buildToolError(`Upstream error (${error.status}): ${error.body ?? error.message}`);
      }
      if (error instanceof Error) {
        return this.buildToolError(error.message);
      }
      return this.buildToolError('Unknown error while executing tool.');
    }
  }

  private buildSuccess(id: JsonRpcId, result: unknown): JsonRpcSuccess {
    return { jsonrpc: '2.0', id, result };
  }

  private buildError(id: JsonRpcId, code: number, message: string, data?: unknown): JsonRpcError {
    return { jsonrpc: '2.0', id, error: { code, message, data } };
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

  private buildToolError(message: string): ToolResult {
    return this.buildToolText(message, true);
  }

  private formatCommandResult(result?: { content?: string; type?: string }): ToolResult {
    if (!result) {
      return this.buildToolError('Empty command result.');
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

  private resolveProtocolVersion(req: Request): { version: string; hasHeader: boolean } {
    const header = req.headers['mcp-protocol-version'];
    if (typeof header === 'string' && header.trim()) {
      const version = header.trim();
      if (!this.supportedProtocolVersions.has(version)) {
        throw new UpstreamError(`Unsupported protocol version: ${version}`, 400);
      }
      return { version, hasHeader: true };
    }
    return { version: '2025-11-25', hasHeader: false };
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
    const hostHeader = (typeof forwardedHost === 'string' && forwardedHost.trim()) ? forwardedHost : req.headers['host'];
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

  private pickArgs(source: Record<string, unknown>, keys: string[]) {
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
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
