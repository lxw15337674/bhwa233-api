import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class YoutubeResolveQueryDto {
  @ApiProperty({
    description: 'YouTube 视频链接',
    example: 'https://www.youtube.com/watch?v=iYvZ8mvoYRI&t=445s',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl(
    { require_protocol: true },
    { message: 'url 必须是合法的 http/https 地址' },
  )
  url!: string;
}

export class YoutubeDownloadQueryDto extends YoutubeResolveQueryDto {
  @ApiPropertyOptional({
    description:
      'yt-dlp 格式选择器，默认 best[ext=mp4][acodec!=none][vcodec!=none]/best[acodec!=none][vcodec!=none]/best',
    example: 'best[ext=mp4]/best',
  })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({
    description: '是否直接 302 跳转到提取出的直链',
    enum: ['true', 'false'],
    default: 'true',
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  redirect?: string;
}

