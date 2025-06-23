import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
import { AudioDownloader, AudioQualityEnums } from './lib/audio-downloader';
import { AudioStreamInfo, StreamProxyOptions } from './interfaces/audio-stream.interface';
import { AxiosError } from 'axios';

@Injectable()
export class BilibiliAudioService {
    private readonly logger = new Logger(BilibiliAudioService.name);

    constructor(private readonly httpService: HttpService) { }

    /**
     * 验证B站URL是否有效
     */
    private validateBilibiliUrl(url: string): void {
        if (!url.includes('bilibili.com')) {
            throw new BadRequestException('无效的B站链接');
        }
    }

    /**
     * 获取音频流信息
     */
    async getAudioStreamInfo(url: string, quality?: AudioQualityEnums): Promise<AudioStreamInfo> {
        try {
            this.validateBilibiliUrl(url);

            const downloader = new AudioDownloader(url, quality || AudioQualityEnums.Highest);
            const streamInfo = await downloader.getAudioStreamUrl();

            this.logger.log(`获取音频流信息成功: ${streamInfo.title}`);
            return streamInfo;
        } catch (error) {
            this.logger.error(`获取音频流信息失败: ${error.message}`, error.stack);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(`获取音频流信息失败: ${error.message}`);
        }
    }

    /**
     * 流式代理B站音频
     */
    async streamAudioProxy(
        audioUrl: string,
        filename: string,
        res: Response,
        options?: StreamProxyOptions
    ): Promise<void> {
        try {
            // 构建请求B站的headers
            const bilibiliHeaders: Record<string, string> = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Referer": "https://www.bilibili.com",
                "Origin": "https://www.bilibili.com"
            };

            // 如果客户端请求了Range，转发给B站
            if (options?.range) {
                bilibiliHeaders['Range'] = options.range;
            }

            // 合并额外的headers
            if (options?.headers) {
                Object.assign(bilibiliHeaders, options.headers);
            }

            this.logger.log(`开始代理音频流: ${filename}`);

            // 从B站获取音频流
            const bilibiliResponse = await this.httpService.axiosRef.get(audioUrl, {
                headers: bilibiliHeaders,
                responseType: 'stream',
                validateStatus: (status) => status >= 200 && status < 300 || status === 206
            });

            // 编码文件名 - 更安全的编码方式
            const encodedFilename = encodeURIComponent(filename)
                .replace(/['()]/g, escape)
                .replace(/\*/g, '%2A')
                .replace(/%(?:7C|60|5E)/g, unescape);

            // 设置响应headers
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // 转发B站的相关headers
            const contentLength = bilibiliResponse.headers['content-length'];
            const contentRange = bilibiliResponse.headers['content-range'];
            const acceptRanges = bilibiliResponse.headers['accept-ranges'];

            if (contentLength) {
                res.setHeader('Content-Length', contentLength);
            }
            if (contentRange) {
                res.setHeader('Content-Range', contentRange);
            }
            if (acceptRanges) {
                res.setHeader('Accept-Ranges', acceptRanges);
            } else {
                res.setHeader('Accept-Ranges', 'bytes');
            }

            // 设置状态码
            res.status(bilibiliResponse.status);

            // 直接管道传输响应流
            bilibiliResponse.data.pipe(res);

            // 处理流错误
            bilibiliResponse.data.on('error', (error: Error) => {
                this.logger.error(`音频流传输错误: ${error.message}`, error.stack);
                if (!res.headersSent) {
                    res.status(500).json({ error: '音频流传输失败' });
                }
                res.end();
            });

            // 记录完成
            bilibiliResponse.data.on('end', () => {
                this.logger.log(`音频流传输完成: ${filename}`);
            });

            // 处理客户端断开连接
            res.on('close', () => {
                this.logger.log(`客户端断开连接: ${filename}`);
                bilibiliResponse.data.destroy();
            });

        } catch (error) {
            this.logger.error(`音频流代理失败: ${error.message}`, error.stack);

            if (error instanceof AxiosError) {
                const status = error.response?.status || 500;
                const message = `B站响应错误: ${status} ${error.response?.statusText || error.message}`;

                if (!res.headersSent) {
                    res.status(status).json({ error: message });
                }
            } else {
                if (!res.headersSent) {
                    res.status(500).json({ error: '音频流代理失败' });
                }
            }
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