import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { McpService } from './mcp.service';

@Controller('mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Get()
  async handleGet(@Req() req: Request, @Res() res: Response) {
    if (!this.mcpService.isOriginAllowed(req)) {
      res.status(403).send('Forbidden');
      return;
    }

    res.status(405).send('Method Not Allowed');
  }

  @Post()
  async handlePost(@Req() req: Request, @Res() res: Response, @Body() body: unknown) {
    if (!this.mcpService.isOriginAllowed(req)) {
      res.status(403).send('Forbidden');
      return;
    }

    if (this.mcpService.shouldUseEventStream(req)) {
      res.status(406).send('Event-stream responses are not supported.');
      return;
    }

    if (!this.mcpService.isAuthorized(req)) {
      this.mcpService.sendUnauthorized(res);
      return;
    }

    try {
      const protocolError = this.mcpService.validateProtocolVersion(body);
      if (protocolError) {
        res.status(400).json(protocolError);
        return;
      }

      await this.mcpService.handleHttpRequest(req, res, body);
    } catch (error) {
      if (!res.headersSent) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32603, message },
        });
      }
    }
  }
}
