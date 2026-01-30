import { BadRequestException, Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { CommandService } from './command.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CommandRequestDto } from './dto/command.dto';

@ApiTags('Command')
@Controller('command')
export class CommandController {
  constructor(private readonly commandService: CommandService) {}

  @Get('')
  async executeCommand(@Query('command') command: string) {
    return this.commandService.executeCommand(command);
  }

  @ApiOperation({
    summary: 'Execute command via POST',
    description: 'Submit a command in the request body. Example: "hp"'
  })
  @ApiBody({ type: CommandRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Command result (text or image data URI)',
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        type: { type: 'string', enum: ['text', 'image'] }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - command is empty' })
  @Post('')
  async executeCommandPost(@Body() body: CommandRequestDto) {
    const command = body?.command;
    if (!command || !command.trim()) {
      throw new BadRequestException('command 不能为空');
    }
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
