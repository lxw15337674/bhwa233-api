import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Query,
    Res,
} from '@nestjs/common';
import { DouyinService } from './douyin.service';
import { DownloadVideoDto } from './dto/download-video.dto';
import { Response } from 'express';

@Controller('douyin')
export class DouyinController {
    constructor(private readonly douyinService: DouyinService) { }

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