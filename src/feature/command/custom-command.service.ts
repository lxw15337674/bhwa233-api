import { BadRequestException, Injectable } from '@nestjs/common';
import { CustomCommand, CustomCommandReplyType } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { textToImage } from '../../utils/textToImage';
import { PreviewCustomCommandDto, UpsertCustomCommandDto } from './dto/custom-command.dto';

export interface CommandExecutionResult {
  content: string;
  type: 'text' | 'image';
}

@Injectable()
export class CustomCommandService {
  async list(): Promise<CustomCommand[]> {
    return prisma.customCommand.findMany({
      where: {},
      orderBy: [{ sortOrder: 'asc' }, { createTime: 'asc' }],
    });
  }

  async create(ownerKeyHash: string, dto: UpsertCustomCommandDto): Promise<CustomCommand> {
    await this.ensureCommandUnique(dto.command);
    const payload = this.buildPayload(ownerKeyHash, dto);
    return prisma.customCommand.create({
      data: payload,
    });
  }

  async update(ownerKeyHash: string, id: string, dto: UpsertCustomCommandDto): Promise<CustomCommand> {
    await this.ensureExists(id);
    await this.ensureCommandUnique(dto.command, id);
    const payload = this.buildPayload(ownerKeyHash, dto);
    return prisma.customCommand.update({
      where: { id },
      data: payload,
    });
  }

  async remove(_ownerKeyHash: string, id: string): Promise<void> {
    await this.ensureExists(id);
    await prisma.customCommand.delete({
      where: { id },
    });
  }

  async preview(dto: PreviewCustomCommandDto): Promise<CommandExecutionResult> {
    this.validatePayload(dto);
    return this.toExecutionResult({
      id: 'preview',
      ownerKeyHash: 'preview',
      name: dto.command.trim(),
      command: dto.command.trim(),
      description: dto.description?.trim() || null,
      replyType: dto.replyType,
      contentText: dto.contentText?.trim() || null,
      imageUrl: dto.imageUrl?.trim() || null,
      enabled: dto.enabled ?? true,
      sortOrder: 0,
      createTime: new Date(),
      updateTime: new Date(),
    });
  }

  async execute(commandText: string): Promise<CommandExecutionResult | null> {
    const normalizedCommand = commandText.trim();
    if (!normalizedCommand) {
      return null;
    }

    const customCommand = await prisma.customCommand.findFirst({
      where: {
        enabled: true,
        command: normalizedCommand,
      },
      orderBy: [{ sortOrder: 'asc' }, { createTime: 'asc' }],
    });

    if (!customCommand) {
      return null;
    }

    return this.toExecutionResult(customCommand);
  }

  async listForHelp(): Promise<Array<{ key: string; description: string; type?: 'text' | 'image' }>> {
    const commands = await prisma.customCommand.findMany({
      where: {
        enabled: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createTime: 'asc' }],
    });

    return commands.map((item) => ({
      key: item.command,
      description: `${item.command} - ${item.description?.trim() || item.command}`,
      type: item.replyType === CustomCommandReplyType.TEXT ? 'text' : 'image',
    }));
  }

  private async ensureExists(id: string): Promise<void> {
    const item = await prisma.customCommand.findFirst({
      where: { id },
      select: { id: true },
    });

    if (!item) {
      throw new BadRequestException('命令不存在');
    }
  }

  private async ensureCommandUnique(command: string, excludeId?: string): Promise<void> {
    const normalizedCommand = command.trim();
    const existing = await prisma.customCommand.findFirst({
      where: {
        command: normalizedCommand,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('命令已存在，请使用其他命令');
    }
  }

  private buildPayload(ownerKeyHash: string, dto: UpsertCustomCommandDto) {
    this.validatePayload(dto);
    return {
      ownerKeyHash,
      name: dto.command.trim(),
      command: dto.command.trim(),
      description: dto.description?.trim() || null,
      replyType: dto.replyType,
      contentText: dto.contentText?.trim() || null,
      imageUrl: dto.imageUrl?.trim() || null,
      enabled: dto.enabled ?? true,
      sortOrder: 0,
    };
  }

  private validatePayload(dto: UpsertCustomCommandDto): void {
    const contentText = dto.contentText?.trim() || '';
    const imageUrl = dto.imageUrl?.trim() || '';

    if (!dto.command?.trim()) {
      throw new BadRequestException('command 不能为空');
    }

    if (dto.replyType === CustomCommandReplyType.TEXT && !contentText) {
      throw new BadRequestException('TEXT 类型必须提供 contentText');
    }

    if (dto.replyType === CustomCommandReplyType.IMAGE_URL && !imageUrl) {
      throw new BadRequestException('IMAGE_URL 类型必须提供 imageUrl');
    }

    if (dto.replyType === CustomCommandReplyType.RENDERED_IMAGE && !contentText) {
      throw new BadRequestException('RENDERED_IMAGE 类型必须提供 contentText');
    }
  }

  private async toExecutionResult(command: CustomCommand): Promise<CommandExecutionResult> {
    if (command.replyType === CustomCommandReplyType.TEXT) {
      return {
        content: command.contentText || '',
        type: 'text',
      };
    }

    if (command.replyType === CustomCommandReplyType.IMAGE_URL) {
      return {
        content: command.imageUrl || '',
        type: 'image',
      };
    }

    const imageBuffer = await textToImage(command.contentText || '', {
      returnBuffer: true,
      fontSize: 20,
      lineHeight: 30,
      margin: 28,
      maxWidth: 1200,
    });

    return {
      content: `data:image/jpeg;base64,${(imageBuffer as Buffer).toString('base64')}`,
      type: 'image',
    };
  }
}
