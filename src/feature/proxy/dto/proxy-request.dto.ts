import { IsString, IsUrl, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export class ProxyRequestDto {
  @ApiProperty({
    description: '目标请求URL',
    example: 'https://api.example.com/data',
    required: true,
  })
  @IsUrl({}, { message: '请提供有效的URL地址' })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'HTTP请求方法',
    enum: HttpMethod,
    example: HttpMethod.GET,
    required: false,
    default: HttpMethod.GET,
  })
  @IsOptional()
  @IsEnum(HttpMethod, { message: '请提供有效的HTTP方法' })
  method?: HttpMethod = HttpMethod.GET;

  @ApiProperty({
    description: '自定义Origin头部',
    example: 'https://example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiProperty({
    description: '自定义Referer头部',
    example: 'https://example.com/page',
    required: false,
  })
  @IsOptional()
  @IsString()
  referer?: string;

  @ApiProperty({
    description: '自定义User-Agent',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    required: false,
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({
    description: '额外的请求头（JSON字符串）',
    example: '{"Authorization": "Bearer token", "Content-Type": "application/json"}',
    required: false,
  })
  @IsOptional()
  @IsString()
  headers?: string;

  @ApiProperty({
    description: '请求体数据（JSON字符串）',
    example: '{"key": "value"}',
    required: false,
  })
  @IsOptional()
  @IsString()
  body?: string;
} 