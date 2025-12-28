import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { CommandService } from './command.service';

@Controller('command')
export class CommandController {
  constructor(private readonly commandService: CommandService) {}

  @Get('')
  async executeCommand(@Query('command') command: string) {
    return this.commandService.executeCommand(command);
  }

  @Get('hp')
  async getCommandList(@Res() res: Response) {
    const imageResponse = await this.commandService.getCommandList();
    const imageBuffer = await imageResponse.arrayBuffer();

    res.setHeader('Content-Type', imageResponse.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(Buffer.from(imageBuffer));
  }
}