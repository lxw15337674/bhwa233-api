import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BilibiliVideoInfo } from './interfaces/bilibili-video-info.interface';
import { AxiosError } from 'axios';

@Injectable()
export class BilibiliVideoService {
    private readonly logger = new Logger(BilibiliVideoService.name);

    constructor(private readonly httpService: HttpService) { }

    /**
     * 验证B站URL是否有效
     */
    private validateBilibiliUrl(url: string): void {
        if (!url.includes('bilibili.com')) {
            throw new BadRequestException('无效的B站视频链接');
        }
    }

    /**
     * 从各种格式的B站URL中提取BV号
     * 支持格式：
     * 1. https://www.bilibili.com/video/BV1234567890
     * 2. https://www.bilibili.com/list/watchlater?bvid=BV1234567890&...
     * 3. 任何包含bvid参数或BV号的URL
     */
    private extractBvFromUrl(url: string): string | null {
        try {
            // 方法1: 尝试从URL路径中提取 (传统格式)
            const pathPattern = /\/video\/(BV[a-zA-Z0-9]+)/;
            const pathMatch = url.match(pathPattern);
            if (pathMatch) {
                return pathMatch[1];
            }

            // 方法2: 尝试从URL参数中提取 bvid
            const urlObj = new URL(url);
            const bvidFromParam = urlObj.searchParams.get('bvid');
            if (bvidFromParam && /^BV[a-zA-Z0-9]+$/.test(bvidFromParam)) {
                return bvidFromParam;
            }

            // 方法3: 最后尝试在整个URL中查找BV号 (兜底)
            const generalPattern = /(BV[a-zA-Z0-9]+)/;
            const generalMatch = url.match(generalPattern);
            if (generalMatch) {
                return generalMatch[1];
            }

            return null;
        } catch (error) {
            // URL解析失败，尝试正则匹配
            const bvMatch = url.match(/(BV[a-zA-Z0-9]+)/);
            if (bvMatch) {
                return bvMatch[1];
            }
            return null;
        }
    }

    /**
     * 获取B站视频信息
     */
    async getVideoInfo(url: string): Promise<BilibiliVideoInfo> {
        try {
            this.validateBilibiliUrl(url);

            // 从B站URL中提取BV号
            const bvid = this.extractBvFromUrl(url);
            if (!bvid) {
                throw new BadRequestException('无效的B站视频链接');
            }

            // 请求B站API获取视频信息
            const apiUrl = 'https://api.bilibili.com/x/web-interface/view';

            const response = await this.httpService.axiosRef.get(apiUrl, {
                params: { bvid },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': 'https://www.bilibili.com/',
                },
            });

            const data = response.data;

            if (data.code !== 0) {
                throw new BadRequestException(data.message || '获取视频信息失败');
            }

            const videoInfo = data.data;

            // 计算视频时长（分钟）
            const durationMinutes = Math.floor(videoInfo.duration / 60);
            this.logger.log(`获取视频信息成功: ${videoInfo.title}[${durationMinutes}m]`);

            return {
                title: videoInfo.title,
                bvid: videoInfo.bvid,
                aid: videoInfo.aid,
                author: videoInfo.owner.name,
                duration: videoInfo.duration,
                pubdate: videoInfo.pubdate,
                desc: videoInfo.desc,
                pic: videoInfo.pic,
                view: videoInfo.stat.view,
                danmaku: videoInfo.stat.danmaku,
                reply: videoInfo.stat.reply,
                favorite: videoInfo.stat.favorite,
                coin: videoInfo.stat.coin,
                share: videoInfo.stat.share,
                like: videoInfo.stat.like,
            };

        } catch (error) {
            this.logger.error('获取B站视频信息失败:', error);

            // Handle axios error
            if (error instanceof AxiosError) {
                throw new InternalServerErrorException({
                    error: '获取视频信息失败',
                    details: error.response?.data?.message || error.message || '网络请求失败'
                });
            }

            // Handle known exceptions
            if (error instanceof BadRequestException) {
                throw error;
            }

            // Handle unknown errors
            throw new InternalServerErrorException({
                error: '获取视频信息失败',
                details: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 健康检查
     */
    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        return {
            status: 'ok',
            timestamp: new Date().toISOString()
        };
    }
} 