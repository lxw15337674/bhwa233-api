import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CommandRequestDto {
  @ApiProperty({
    description: '命令文本',
    example: 'hp',
  })
  @IsString()
  @IsNotEmpty()
  command: string;
}
