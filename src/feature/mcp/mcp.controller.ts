import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { McpService } from './mcp.service';

@Controller('mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Get()
  async handleGet(@Req() req: Request, @Res() res: Response) {
    if (!this.mcpService.isEventStreamRequest(req)) {
      res.status(405).send('Method Not Allowed');
      return;
    }

    if (!this.mcpService.isAuthorized(req)) {
      this.mcpService.sendUnauthorized(res);
      return;
    }

    this.mcpService.sendSse(res, {
      jsonrpc: '2.0',
      method: 'mcp/ready',
      params: { message: 'SSE channel is not used for server-initiated messages.' },
    });
  }

  @Post()
  async handlePost(@Req() req: Request, @Res() res: Response, @Body() body: unknown) {
    if (!this.mcpService.isAuthorized(req)) {
      this.mcpService.sendUnauthorized(res);
      return;
    }

    let responsePayload: unknown | null = null;
    try {
      const ctx = this.mcpService.buildContext(req);
      responsePayload = await this.mcpService.handleRequest(body, ctx);
    } catch (error) {
      const failure = this.mcpService.toErrorResponse(error);
      res.status(failure.status).json(failure.payload);
      return;
    }

    if (!responsePayload) {
      res.status(204).end();
      return;
    }

    if (this.mcpService.shouldUseEventStream(req)) {
      this.mcpService.sendSse(res, responsePayload);
      return;
    }

    res.status(200).json(responsePayload);
  }
}
