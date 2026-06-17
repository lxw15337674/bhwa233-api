import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewCommandDto {
  @ApiPropertyOptional({
    description: '审核备注',
    example: '可以上线',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
