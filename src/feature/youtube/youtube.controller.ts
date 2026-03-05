import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Req,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  YoutubeDownloadQueryDto,
  YoutubeResolveQueryDto,
} from './dto/youtube-request.dto';
import { YoutubeService } from './youtube.service';

@ApiTags('YouTube')
@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('resolve')
  @ApiOperation({
    summary: '解析 YouTube 视频信息',
    description:
      '使用 yt-dlp 解析元数据和可用格式（用于 CF Worker 二次封装）',
  })
  @ApiResponse({
    status: 200,
    description: '解析成功',
  })
  async resolve(
    @Query(new ValidationPipe({ transform: true })) query: YoutubeResolveQueryDto,
    @Req() req: Request,
  ) {
    const resolved = await this.youtubeService.resolveVideo(query.url);
    const baseUrl = this.getBaseUrl(req);

    return {
      success: true,
      data: {
        ...resolved,
        downloadVideoUrl: `${baseUrl}/api/youtube/download?url=${encodeURIComponent(
          query.url,
        )}`,
      },
    };
  }

  @Get('download')
  @ApiOperation({
    summary: '提取 YouTube 可下载直链',
    description:
      '默认返回 302 跳转到 yt-dlp 提取的直链；传 redirect=false 返回 JSON',
  })
  @ApiQuery({
    name: 'redirect',
    required: false,
    enum: ['true', 'false'],
    description: 'false 时返回 JSON，不跳转',
  })
  @ApiResponse({
    status: 200,
    description: '返回下载链接 JSON',
  })
  @ApiResponse({
    status: 302,
    description: '重定向到下载直链',
  })
  async download(
    @Query(new ValidationPipe({ transform: true })) query: YoutubeDownloadQueryDto,
    @Res() res: Response,
  ) {
    const result = await this.youtubeService.getDownloadInfo(query.url, query.format);
    const shouldRedirect = (query.redirect || 'true') !== 'false';

    if (!result.downloadUrl) {
      throw new HttpException('未找到可用下载链接', HttpStatus.BAD_GATEWAY);
    }

    if (!shouldRedirect) {
      return res.json({
        success: true,
        data: result,
      });
    }

    return res.redirect(302, result.downloadUrl);
  }

  @Get('health')
  @ApiOperation({ summary: 'YouTube 解析服务健康检查' })
  async health() {
    return {
      status: 'ok',
      service: 'youtube',
      timestamp: new Date().toISOString(),
    };
  }

  private getBaseUrl(req: Request): string {
    const protocol =
      (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] ||
      req.protocol ||
      'https';
    const host = req.headers.host;
    return `${protocol}://${host}`;
  }
}

