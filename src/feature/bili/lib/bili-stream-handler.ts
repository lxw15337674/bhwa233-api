import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { BiliAudioStream, BiliVideoStream } from '../interfaces/bili-stream.interface';

@Injectable()
export class BiliStreamHandler {
    private readonly logger = new Logger(BiliStreamHandler.name);

    /**
     * 选择最佳音频流（最高音质）
     */
    selectBestAudioStream(audioStreams: BiliAudioStream[]): BiliAudioStream {
        if (!audioStreams || audioStreams.length === 0) {
            throw new Error('No audio stream found');
        }

        return audioStreams.reduce((best, current) => {
            return current.id > best.id ? current : best;
        });
    }

    /**
     * 选择最佳视频流（根据质量偏好）
     */
    selectBestVideoStream(videoStreams: BiliVideoStream[], qualityPreference?: string): BiliVideoStream {
        if (!videoStreams || videoStreams.length === 0) {
            throw new Error('No video stream found');
        }

        // 如果有质量偏好，尝试匹配
        if (qualityPreference) {
            const preferredStream = this.findStreamByQuality(videoStreams, qualityPreference);
            if (preferredStream) {
                return preferredStream;
            }
        }

        // 默认选择最高画质
        return videoStreams.reduce((best, current) => {
            return current.id > best.id ? current : best;
        });
    }

    /**
     * 根据质量偏好查找视频流
     */
    private findStreamByQuality(videoStreams: BiliVideoStream[], quality: string): BiliVideoStream | null {
        // 简单的质量匹配逻辑
        const qualityMap: Record<string, number> = {
            '1080p': 80,
            '720p': 64,
            '480p': 32,
            '360p': 16
        };

        const targetQuality = qualityMap[quality];
        if (!targetQuality) {
            return null;
        }

        return videoStreams.find(stream => stream.id === targetQuality) || null;
    }

    /**
     * 清理文件名，移除非法字符
     */
    sanitizeFilename(filename: string): string {
        return filename.replace(/[<>:"/\\|?*]/g, '_');
    }

    /**
     * 编码文件名用于HTTP响应
     */
    encodeFilename(filename: string): string {
        return encodeURIComponent(filename)
            .replace(/['()]/g, escape)
            .replace(/\*/g, '%2A')
            .replace(/%(?:7C|60|5E)/g, unescape);
    }

    /**
     * 设置流响应头
     */
    setStreamHeaders(res: Response, filename: string, contentType: string, options?: {
        contentLength?: string;
        contentRange?: string;
        acceptRanges?: string;
    }): void {
        const encodedFilename = this.encodeFilename(filename);
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        if (options?.contentLength) {
            res.setHeader('Content-Length', options.contentLength);
        }

        if (options?.contentRange) {
            res.setHeader('Content-Range', options.contentRange);
        }

        if (options?.acceptRanges) {
            res.setHeader('Accept-Ranges', options.acceptRanges);
        }
    }

    /**
     * 处理流传输错误
     */
    handleStreamError(error: Error, res: Response, filename: string): void {
        this.logger.error(`流传输失败: ${filename} - ${error.message}`);
        
        if (!res.headersSent) {
            res.status(500).json({ 
                error: '流传输失败',
                details: error.message 
            });
        }
        
        if (!res.destroyed) {
            res.end();
        }
    }
} 