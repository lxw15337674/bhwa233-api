import { IsNotEmpty, IsUrl, IsOptional, IsBoolean } from 'class-validator';

export class SummarizeUrlDto {
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @IsOptional()
  @IsBoolean()
  useTavily?: boolean = true; // 默认使用Tavily AI
}
