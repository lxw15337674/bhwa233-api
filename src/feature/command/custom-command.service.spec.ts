jest.mock('../../database/prisma', () => ({
  prisma: {
    customCommand: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../../utils/textToImage', () => ({
  textToImage: jest.fn(),
}));

import { BadRequestException } from '@nestjs/common';
import { CustomCommandReplyType } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { CustomCommandService } from './custom-command.service';

describe('CustomCommandService', () => {
  const prismaMock = prisma as unknown as {
    customCommand: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  let service: CustomCommandService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CustomCommandService();
  });

  it('directly approves commands created with a management key', async () => {
    prismaMock.customCommand.findFirst.mockResolvedValue(null);
    prismaMock.customCommand.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => data,
    );

    const result = await service.create(
      'hashed-key',
      {
        command: 'hello',
        description: 'demo',
        replyType: CustomCommandReplyType.TEXT,
        contentText: 'world',
      },
      {
        publishDirectly: true,
        reviewerKeyHash: 'hashed-key',
        reviewComment: '管理 key 直通发布',
      },
    );

    expect(prismaMock.customCommand.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ownerKeyHash: 'hashed-key',
        status: 'APPROVED',
        enabled: true,
        reviewerKeyHash: 'hashed-key',
        reviewComment: '管理 key 直通发布',
      }),
    });
    expect(result.status).toBe('APPROVED');
    expect(result.enabled).toBe(true);
    expect(result.reviewedAt).toBeInstanceOf(Date);
  });

  it('allows approved commands to be updated when direct publish is enabled', async () => {
    prismaMock.customCommand.findFirst
      .mockResolvedValueOnce({
        id: 'cmd-1',
        status: 'APPROVED',
      })
      .mockResolvedValueOnce(null);
    prismaMock.customCommand.update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => data,
    );

    const result = await service.update(
      'hashed-key',
      'cmd-1',
      {
        command: 'hello',
        description: 'updated',
        replyType: CustomCommandReplyType.TEXT,
        contentText: 'world',
      },
      {
        publishDirectly: true,
        reviewerKeyHash: 'hashed-key',
        reviewComment: '管理 key 直接更新',
      },
    );

    expect(prismaMock.customCommand.update).toHaveBeenCalledWith({
      where: { id: 'cmd-1' },
      data: expect.objectContaining({
        status: 'APPROVED',
        enabled: true,
        reviewerKeyHash: 'hashed-key',
        reviewComment: '管理 key 直接更新',
      }),
    });
    expect(result.status).toBe('APPROVED');
  });

  it('still blocks approved commands from regular updates', async () => {
    prismaMock.customCommand.findFirst.mockResolvedValue({
      id: 'cmd-1',
      status: 'APPROVED',
    });

    await expect(
      service.update('hashed-key', 'cmd-1', {
        command: 'hello',
        description: 'updated',
        replyType: CustomCommandReplyType.TEXT,
        contentText: 'world',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
