import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { DouyinService } from './douyin.service';
import { DownloadVideoDto } from './dto/download-video.dto';

@Controller('douyin')
export class DouyinController {
    constructor(private readonly douyinService: DouyinService) { }

    @Get('download')
    @HttpCode(HttpStatus.OK)
    async downloadVideo(@Query() downloadVideoDto: DownloadVideoDto) {
        return this.douyinService.getVideoUrl(downloadVideoDto.url);
    }
} 