import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadCommandImageDto {
  @ApiProperty({
    description: '图片 data URI，例如 data:image/png;base64,...',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12_000_000)
  imageData: string;

  @ApiPropertyOptional({ description: '原始文件名，用于保留扩展名' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;
}
