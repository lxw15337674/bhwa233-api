import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomCommandReplyType } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertCustomCommandDto {
  @ApiProperty({ description: '命令内容，当前只支持精确匹配', example: '图片1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  command: string;

  @ApiPropertyOptional({ description: '命令说明' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: '回复类型',
    enum: CustomCommandReplyType,
    example: CustomCommandReplyType.IMAGE_URL,
  })
  @IsEnum(CustomCommandReplyType)
  replyType: CustomCommandReplyType;

  @ApiPropertyOptional({
    description: '文本内容。TEXT 直接返回文本，RENDERED_IMAGE 时会渲染为图片。',
  })
  @IsOptional()
  @IsString()
  contentText?: string;

  @ApiPropertyOptional({
    description: '图片地址或 base64 data URI。IMAGE_URL 时直接返回该内容。',
    example: 'https://example.com/demo.png',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class PreviewCustomCommandDto extends UpsertCustomCommandDto {}
