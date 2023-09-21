import { IsOptional } from 'class-validator';

export class CreateCountDto {
  type: string;
  @IsOptional()
  remark: string = '';
}
