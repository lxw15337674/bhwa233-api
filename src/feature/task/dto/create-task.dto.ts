import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { UsePipes, ValidationPipe } from '@nestjs/common';

export class CreateTaskDto {
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString({ message: '标题必须是 String 类型' })
  readonly title: string;
  // @IsNotEmpty({ message: '备注不能为空' })
  @IsString({ message: '备注必须是 String 类型' })
  @IsOptional()
  readonly remark?: string = '';
  // @IsNotEmpty({ message: '类型不能为空' })
  @IsString({ message: '类型必须是 String 类型' })
  @IsOptional()
  readonly type: string = '';
  // @IsNotEmpty({ message: '状态不能为空' })
  @IsString({ message: '状态必须是 String 类型' })
  @IsOptional()
  readonly status: string = 'todo';
  // @IsNotEmpty({ message: '优先级不能为空' })
  @IsString({ message: '优先级必须是 String 类型' })
  @IsOptional()
  readonly priority: string = '';

  readonly userId: number;
}
