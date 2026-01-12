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
  async getCommandList() {
    return this.commandService.getCommandList();
  }

  @Get('hpimg')
  async getCommandListImage(@Res() res: Response) {
    const imageBuffer = await this.commandService.getCommandListImage();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(imageBuffer);
  }

  @Get('relay')
  async getRelayPulseScreenshot(
    @Query('provider') provider: string = '88code',
    @Query('period') period: string = '24h',
    @Res() res: Response
  ) {
    const imageBuffer = await this.commandService.getRelayPulseScreenshot(provider, period);

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=600'); // 10分钟缓存
    res.send(imageBuffer);
  }
}