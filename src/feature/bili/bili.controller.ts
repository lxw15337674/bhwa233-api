import {
    Controller,
    Get,
    Query,
    Res,
    Req,
    ValidationPipe,
    UsePipes,
    BadRequestException,
    Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { BiliService } from './bili.service';
import { BiliUrlDto, BiliDownloadDto } from './dto/bili-request.dto';
import { BiliInfoResponse } from './interfaces/bili-response.interface';

@ApiTags('Bili - B站统一接口')
@Controller('bili')
@UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
}))
export class BiliController {
    private readonly logger = new Logger(BiliController.name);

    constructor(private readonly biliService: BiliService) {}

    @Get('info')
    @ApiOperation({
        summary: '获取B站视频信息',
        description: '根据B站视频链接获取视频的标题、作者、统计数据等信息'
    })
    @ApiQuery({
        name: 'url',
        description: 'B站视频链接',
        example: 'https://www.bilibili.com/video/BV1234567890',
        required: true,
    })
    @ApiResponse({
        status: 200,
        description: '成功获取视频信息',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', example: '视频标题' },
                        bvid: { type: 'string', example: 'BV1234567890' },
                        aid: { type: 'number', example: 123456789 },
                        author: { type: 'string', example: '作者名称' },
                        duration: { type: 'number', example: 600 },
                        pubdate: { type: 'number', example: 1640995200 },
                        desc: { type: 'string', example: '视频描述' },
                        pic: { type: 'string', example: 'https://i0.hdslb.com/bfs/archive/xxx.jpg' },
                        view: { type: 'number', example: 10000 },
                        danmaku: { type: 'number', example: 100 },
                        reply: { type: 'number', example: 50 },
                        favorite: { type: 'number', example: 200 },
                        coin: { type: 'number', example: 30 },
                        share: { type: 'number', example: 20 },
                        like: { type: 'number', example: 500 },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: '请求参数错误',
        schema: {
            type: 'object',
            properties: {
                error: { type: 'string', example: '无效的B站视频链接' },
            },
        },
    })
    @ApiResponse({
        status: 500,
        description: '服务器内部错误',
        schema: {
            type: 'object',
            properties: {
                error: { type: 'string', example: '获取视频信息失败' },
                details: { type: 'string', example: '网络请求失败' },
            },
        },
    })
    async getVideoInfo(
        @Query(new ValidationPipe({ transform: true })) query: BiliUrlDto,
    ): Promise<BiliInfoResponse> {
        const videoInfo = await this.biliService.getVideoInfo(query.url);
        return {
            success: true,
            data: videoInfo,
        };
    }

    @Get('audio')
    @ApiOperation({
        summary: '下载B站视频音频',
        description: '根据B站视频链接下载音频流（自动选择最高音质）'
    })
    @ApiQuery({
        name: 'url',
        description: 'B站视频链接',
        example: 'https://www.bilibili.com/video/BV1234567890',
        required: true,
    })
    @ApiResponse({
        status: 200,
        description: '返回音频流',
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
        description: '请求参数错误 - 无效的URL或参数'
    })
    @ApiResponse({
        status: 500,
        description: '服务器内部错误'
    })
    async downloadAudio(
        @Query() query: BiliDownloadDto,
        @Req() req: Request,
        @Res() res: Response
    ): Promise<void> {
        try {
            const { url } = query;

            // 获取音频流信息（自动选择最高音质）
            const { audioUrl, filename } = await this.biliService.getAudioStreamInfo(url);

            // 处理客户端的Range请求（用于断点续传）
            const range = req.headers.range as string;

            // 流式代理音频
            await this.biliService.streamAudioProxy(
                audioUrl,
                filename,
                res,
                { range }
            );

        } catch (error) {
            this.logger.error(`❌ 音频下载失败: ${error.message}`);

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

    @Get('video')
    @ApiOperation({
        summary: '下载B站视频',
        description: '根据B站视频链接下载视频流（可指定画质）'
    })
    @ApiQuery({
        name: 'url',
        description: 'B站视频链接',
        example: 'https://www.bilibili.com/video/BV1234567890',
        required: true,
    })
    @ApiQuery({
        name: 'quality',
        description: '画质偏好（可选）',
        example: '1080p',
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: '返回视频流',
        content: {
            'video/mp4': {
                schema: {
                    type: 'string',
                    format: 'binary'
                }
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: '请求参数错误 - 无效的URL或参数'
    })
    @ApiResponse({
        status: 500,
        description: '服务器内部错误'
    })
    async downloadVideo(
        @Query() query: BiliDownloadDto,
        @Req() req: Request,
        @Res() res: Response
    ): Promise<void> {
        try {
            const { url, quality } = query;

            // 获取视频流信息
            const { videoUrl, filename } = await this.biliService.getVideoStreamInfo(url, quality);

            if (!videoUrl) {
                throw new BadRequestException('未找到视频流');
            }

            // 处理客户端的Range请求（用于断点续传）
            const range = req.headers.range as string;

            // 流式代理视频
            await this.biliService.streamVideoProxy(
                videoUrl,
                filename,
                res,
                { range }
            );

        } catch (error) {
            this.logger.error(`❌ 视频下载失败: ${error.message}`);

            if (error instanceof BadRequestException) {
                if (!res.headersSent) {
                    res.status(400).json({ error: error.message });
                }
            } else {
                if (!res.headersSent) {
                    res.status(500).json({
                        error: error instanceof Error ? error.message : '视频下载失败'
                    });
                }
            }
        }
    }
} 