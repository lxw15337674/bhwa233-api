import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { BilibiliVideoService } from './bilibili-video.service';
import { GetVideoInfoDto } from './dto/get-video-info.dto';
import { BilibiliVideoResponse } from './interfaces/bilibili-video-info.interface';

@ApiTags('B站视频')
@Controller('bilibili-video')
export class BilibiliVideoController {
    constructor(private readonly bilibiliVideoService: BilibiliVideoService) { }

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
        @Query(new ValidationPipe({ transform: true })) query: GetVideoInfoDto,
    ): Promise<BilibiliVideoResponse> {
        const videoInfo = await this.bilibiliVideoService.getVideoInfo(query.url);
        return {
            success: true,
            data: videoInfo,
        };
    }

    @Get('health')
    @ApiOperation({ summary: '健康检查' })
    @ApiResponse({
        status: 200,
        description: '服务健康状态',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'ok' },
                timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            },
        },
    })
    async healthCheck() {
        return this.bilibiliVideoService.healthCheck();
    }
} 