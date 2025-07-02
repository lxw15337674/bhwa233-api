import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Query,
    Res,
    Req,
} from '@nestjs/common';
import { DouyinService } from './douyin.service';
import { DownloadVideoDto } from './dto/download-video.dto';
import { Response, Request } from 'express';

@Controller('douyin')
export class DouyinController {
    constructor(private readonly douyinService: DouyinService) { }

    @Get('parse')
    @HttpCode(HttpStatus.OK)
    async parseVideo(
        @Query() downloadVideoDto: DownloadVideoDto,
        @Req() req: Request
    ) {
        const result = await this.douyinService.getVideoUrl(downloadVideoDto.url);
        const proxyDownloadUrl = `${req.protocol}://${req.get('host')}/api/douyin/download?url=${encodeURIComponent(
            downloadVideoDto.url,
        )}`;

        return {
            ...result,
            proxyDownloadUrl,
        }
    }

    @Get('download')
    @HttpCode(HttpStatus.OK)
    async downloadVideo(
        @Query() downloadVideoDto: DownloadVideoDto,
        @Res() res: Response,
    ) {
        const { downloadUrl, title } = await this.douyinService.getVideoUrl(
            downloadVideoDto.url,
        );

        return this.douyinService.streamVideoProxy(downloadUrl, title, res);
    }
} 