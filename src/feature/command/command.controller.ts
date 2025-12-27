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
    const imageBuffer = await this.commandService.getCommandList();
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(imageBuffer);
  }
}