import {
    Controller,
    Post,
    Body,
    Res,
    Req,
    Get,
    Query,
    ValidationPipe,
    UsePipes,
    BadRequestException,
    Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { BilibiliAudioService } from './bilibili-audio.service';
import { DownloadAudioDto } from './dto/download-audio.dto';

@ApiTags('Bilibili Audio')
@Controller('bilibili-audio')
@UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
}))
export class BilibiliAudioController {
    private readonly logger = new Logger(BilibiliAudioController.name);

    constructor(private readonly bilibiliAudioService: BilibiliAudioService) { }

    @ApiOperation({ summary: 'Stream Bilibili audio' })
    @ApiResponse({
        status: 200,
        description: 'Returns audio stream',
        content: {
            'audio/mpeg': {
                schema: {
                    type: 'string',
                    format: 'binary'
                }
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request - invalid URL or parameters'
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error'
    })
    @Get('download')
    async downloadAudio(
        @Query() downloadAudioDto: DownloadAudioDto,
        @Req() req: Request,
        @Res() res: Response
    ): Promise<void> {
        try {
            const { url } = downloadAudioDto;

            // 获取音频流信息（自动选择最高音质）
            const { audioUrl, filename } = await this.bilibiliAudioService.getAudioStreamInfo(url);

            // 处理客户端的Range请求（用于断点续传）
            const range = req.headers.range as string;

            // 流式代理音频
            await this.bilibiliAudioService.streamAudioProxy(
                audioUrl,
                filename,
                res,
                { range }
            );

        } catch (error) {
            const title = error.title || '未知视频';
            this.logger.error(`❌ 音频下载失败: ${title} - ${error.message}`);

            if (error instanceof BadRequestException) {
                if (!res.headersSent) {
                    res.status(400).json({ error: error.message });
                }
            } else {
                if (!res.headersSent) {
                    res.status(500).json({
                        error: error instanceof Error ? error.message : '音频下载失败'
                    });
                }
            }
        }
    }

    @ApiOperation({ summary: 'Health check for Bilibili audio service' })
    @ApiResponse({
        status: 200,
        description: 'Service is healthy',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'ok' },
                timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
            }
        }
    })
    @Get('health')
    async healthCheck() {
        return this.bilibiliAudioService.healthCheck();
    }
} 