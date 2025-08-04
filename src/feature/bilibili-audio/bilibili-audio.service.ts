import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
import { AudioDownloader } from './lib/audio-downloader';
import { AudioStreamInfo, StreamProxyOptions } from './interfaces/audio-stream.interface';
import { AxiosError } from 'axios';

@Injectable()
export class BilibiliAudioService {
    private readonly logger = new Logger(BilibiliAudioService.name);

    constructor(private readonly httpService: HttpService) { }

    private validateBilibiliUrl(url: string): void {
        if (!url.includes('bilibili.com')) {
            throw new BadRequestException('无效的B站链接');
        }
    }

    async getAudioStreamInfo(url: string): Promise<AudioStreamInfo> {
        let downloader: AudioDownloader | null = null;
        try {
            this.validateBilibiliUrl(url);
            downloader = new AudioDownloader(url);
            const streamInfo = await downloader.getAudioStreamUrl();
            this.logger.log(`获取音频流成功: ${streamInfo.title}`);
            return streamInfo;
        } catch (error) {
            let title = '未知视频';
            try {
                if (downloader && (downloader as any).title) {
                    title = (downloader as any).title;
                }
            } catch { }
            error.title = title;
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(`获取音频流信息失败: ${error.message}`);
        }
    }

    async streamAudioProxy(
        audioUrl: string,
        filename: string,
        res: Response,
        options?: StreamProxyOptions
    ): Promise<void> {
        try {
            const bilibiliHeaders: Record<string, string> = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Referer": "https://www.bilibili.com",
                "Origin": "https://www.bilibili.com"
            };
            if (options?.range) {
                bilibiliHeaders['Range'] = options.range;
            }
            if (options?.headers) {
                Object.assign(bilibiliHeaders, options.headers);
            }
            const bilibiliResponse = await this.httpService.axiosRef.get(audioUrl, {
                headers: bilibiliHeaders,
                responseType: 'stream',
                validateStatus: (status) => status >= 200 && status < 300 || status === 206
            });
            const encodedFilename = encodeURIComponent(filename)
                .replace(/['()]/g, escape)
                .replace(/\*/g, '%2A')
                .replace(/%(?:7C|60|5E)/g, unescape);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
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
            res.status(bilibiliResponse.status);
            bilibiliResponse.data.pipe(res);
            bilibiliResponse.data.on('error', (error: Error) => {
                if (!res.headersSent) {
                    res.status(500).json({ error: '音频流传输失败' });
                }
                res.end();
            });
            res.on('close', () => {
                bilibiliResponse.data.destroy();
            });
        } catch (error) {
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

    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        return {
            status: 'ok',
            timestamp: new Date().toISOString()
        };
    }
} 