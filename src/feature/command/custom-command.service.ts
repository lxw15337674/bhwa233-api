import { BadRequestException, Injectable } from '@nestjs/common';
import { CustomCommand, CustomCommandReplyType } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { textToImage } from '../../utils/textToImage';
import { PreviewCustomCommandDto, UpsertCustomCommandDto } from './dto/custom-command.dto';

export interface CommandExecutionResult {
  content: string;
  type: 'text' | 'image';
}

const COMMAND_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

type CommandStatus = (typeof COMMAND_STATUS)[keyof typeof COMMAND_STATUS];
const ANONYMOUS_OWNER_KEY = 'public';

interface SaveCommandOptions {
  publishDirectly?: boolean;
  reviewerKeyHash?: string;
  reviewComment?: string;
}

@Injectable()
export class CustomCommandService {
  async list(): Promise<CustomCommand[]> {
    return prisma.customCommand.findMany({
      where: {} as any,
      orderBy: [{ updateTime: 'desc' }],
    });
  }

  async create(
    ownerKeyHash: string,
    dto: UpsertCustomCommandDto,
    options: SaveCommandOptions = {},
  ): Promise<CustomCommand> {
    await this.ensureCommandUnique(dto.command);
    const payload = this.buildPayload(ownerKeyHash, dto, options);
    return prisma.customCommand.create({
      data: payload,
    });
  }

  async update(
    ownerKeyHash: string,
    id: string,
    dto: UpsertCustomCommandDto,
    options: SaveCommandOptions = {},
  ): Promise<CustomCommand> {
    await this.ensureEditable(id, options.publishDirectly);
    await this.ensureCommandUnique(dto.command, id);
    const payload = this.buildPayload(ownerKeyHash, dto, options);
    return prisma.customCommand.update({
      where: { id },
      data: payload,
    });
  }

  async remove(_ownerKeyHash: string, id: string): Promise<void> {
    await this.ensureEditable(id);
    await prisma.customCommand.delete({
      where: { id },
    });
  }

  async submit(id: string): Promise<CustomCommand> {
    const item = await this.ensureExists(id);
    if ((item as CustomCommand & { status?: CommandStatus }).status === COMMAND_STATUS.APPROVED) {
      throw new BadRequestException('命令已审核通过');
    }

    return prisma.customCommand.update({
      where: { id },
      data: {
        status: COMMAND_STATUS.PENDING,
        reviewComment: null,
        reviewedAt: null,
        reviewerKeyHash: null,
      } as any,
    });
  }

  async approve(id: string, reviewerKeyHash: string, reviewComment?: string): Promise<CustomCommand> {
    await this.ensureExists(id);
    return prisma.customCommand.update({
      where: { id },
      data: {
        status: COMMAND_STATUS.APPROVED,
        enabled: true,
        reviewerKeyHash,
        reviewComment: reviewComment?.trim() || '审核通过',
        reviewedAt: new Date(),
      } as any,
    });
  }

  async reject(id: string, reviewerKeyHash: string, reviewComment?: string): Promise<CustomCommand> {
    await this.ensureExists(id);
    return prisma.customCommand.update({
      where: { id },
      data: {
        status: COMMAND_STATUS.REJECTED,
        enabled: false,
        reviewerKeyHash,
        reviewComment: reviewComment?.trim() || '审核拒绝',
        reviewedAt: new Date(),
      } as any,
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
      status: COMMAND_STATUS.PENDING,
      reviewerKeyHash: null,
      reviewComment: null,
      submittedAt: new Date(),
      reviewedAt: null,
      enabled: false,
      sortOrder: 0,
      createTime: new Date(),
      updateTime: new Date(),
    } as CustomCommand);
  }

  async execute(commandText: string): Promise<CommandExecutionResult | null> {
    const normalizedCommand = commandText.trim();
    if (!normalizedCommand) {
      return null;
    }

    const customCommand = await prisma.customCommand.findFirst({
      where: {
        status: COMMAND_STATUS.APPROVED,
        enabled: true,
        command: normalizedCommand,
      } as any,
    });

    if (!customCommand) {
      return null;
    }

    return this.toExecutionResult(customCommand);
  }

  async listForHelp(): Promise<Array<{ key: string; description: string; type?: 'text' | 'image' }>> {
    const commands = await prisma.customCommand.findMany({
      where: {
        status: COMMAND_STATUS.APPROVED,
        enabled: true,
      } as any,
      orderBy: [{ updateTime: 'desc' }],
    });

    return commands.map((item) => ({
      key: item.command,
      description: `${item.command} - ${item.description?.trim() || item.command}`,
      type: item.replyType === CustomCommandReplyType.TEXT ? 'text' : 'image',
    }));
  }

  private async ensureExists(id: string): Promise<CustomCommand> {
    const item = await prisma.customCommand.findFirst({
      where: { id } as any,
    });

    if (!item) {
      throw new BadRequestException('命令不存在');
    }

    return item;
  }

  private async ensureEditable(id: string, allowApproved = false): Promise<CustomCommand> {
    const item = await this.ensureExists(id);
    if (
      !allowApproved &&
      (item as CustomCommand & { status?: CommandStatus }).status ===
        COMMAND_STATUS.APPROVED
    ) {
      throw new BadRequestException('已审核通过的命令不能直接编辑，请先重新创建新命令');
    }
    return item;
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

  private buildPayload(
    ownerKeyHash: string,
    dto: UpsertCustomCommandDto,
    options: SaveCommandOptions = {},
  ) {
    this.validatePayload(dto);
    const publishDirectly = options.publishDirectly === true;
    const now = new Date();
    return {
      ownerKeyHash: ownerKeyHash || ANONYMOUS_OWNER_KEY,
      name: dto.command.trim(),
      command: dto.command.trim(),
      description: dto.description?.trim() || null,
      replyType: dto.replyType,
      contentText: dto.contentText?.trim() || null,
      imageUrl: dto.imageUrl?.trim() || null,
      status: publishDirectly ? COMMAND_STATUS.APPROVED : COMMAND_STATUS.PENDING,
      reviewerKeyHash: publishDirectly
        ? options.reviewerKeyHash || ownerKeyHash || null
        : null,
      reviewComment: publishDirectly
        ? options.reviewComment?.trim() || '管理 key 直通发布'
        : null,
      submittedAt: now,
      reviewedAt: publishDirectly ? now : null,
      enabled: publishDirectly,
      sortOrder: 0,
    } as any;
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
