import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CommandService } from './command.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CommandRequestDto } from './dto/command.dto';
import { Request } from 'express';
import { CommandAuthService } from './command-auth.service';
import { CustomCommandService } from './custom-command.service';
import { PreviewCustomCommandDto, UpsertCustomCommandDto } from './dto/custom-command.dto';
import { ReviewCommandDto } from './dto/review-command.dto';

@ApiTags('Command')
@Controller('command')
export class CommandController {
  constructor(
    private readonly commandService: CommandService,
    private readonly commandAuthService: CommandAuthService,
    private readonly customCommandService: CustomCommandService,
  ) {}

  @Get('')
  async executeCommand(@Query('command') command: string, @Req() req: Request) {
    return this.commandService.executeCommand(command, req);
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
  async executeCommandPost(@Body() body: CommandRequestDto, @Req() req: Request) {
    const command = body?.command;
    if (!command || !command.trim()) {
      throw new BadRequestException('command 不能为空');
    }
    return this.commandService.executeCommand(command, req);
  }

  @Get('hp')
  async getCommandList(@Req() req: Request) {
    return this.commandService.getCommandList(req);
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

  @Get('config')
  async getCustomCommands(@Req() req: Request) {
    this.commandAuthService.resolveRequiredOwnerKeyHash(req);
    return this.customCommandService.list();
  }

  @Post('config')
  async createCustomCommand(@Req() req: Request, @Body() body: UpsertCustomCommandDto) {
    const ownerKeyHash = this.commandAuthService.resolveRequiredOwnerKeyHash(req);
    return this.customCommandService.create(ownerKeyHash, body);
  }

  @Put('config/:id')
  async updateCustomCommand(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: UpsertCustomCommandDto,
  ) {
    const ownerKeyHash = this.commandAuthService.resolveRequiredOwnerKeyHash(req);
    return this.customCommandService.update(ownerKeyHash, id, body);
  }

  @Delete('config/:id')
  async deleteCustomCommand(@Req() req: Request, @Param('id') id: string) {
    const ownerKeyHash = this.commandAuthService.resolveRequiredOwnerKeyHash(req);
    await this.customCommandService.remove(ownerKeyHash, id);
    return { success: true };
  }

  @Post('config/preview')
  async previewCustomCommand(@Body() body: PreviewCustomCommandDto) {
    return this.customCommandService.preview(body);
  }

  @Post('config/:id/submit')
  async submitCustomCommand(@Req() req: Request, @Param('id') id: string) {
    this.commandAuthService.resolveRequiredOwnerKeyHash(req);
    return this.customCommandService.submit(id);
  }

  @Post('config/:id/approve')
  async approveCustomCommand(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: ReviewCommandDto,
  ) {
    const reviewerKeyHash = this.commandAuthService.resolveRequiredReviewerKeyHash(req);
    return this.customCommandService.approve(id, reviewerKeyHash, body.comment);
  }

  @Post('config/:id/reject')
  async rejectCustomCommand(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: ReviewCommandDto,
  ) {
    const reviewerKeyHash = this.commandAuthService.resolveRequiredReviewerKeyHash(req);
    return this.customCommandService.reject(id, reviewerKeyHash, body.comment);
  }

  @Get('manage')
  async getCommandManagePage(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(await this.commandService.getManagementPageHtml());
  }
}
