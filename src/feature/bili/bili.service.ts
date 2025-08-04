import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AxiosError } from 'axios';

import { BiliUrlParser } from './lib/bili-url-parser';
import { BiliApiClient } from './lib/bili-api-client';
import { BiliStreamHandler } from './lib/bili-stream-handler';

import { BiliVideoInfo } from './interfaces/bili-info.interface';
import { BiliStreamInfo, BiliAudioStream, BiliVideoStream } from './interfaces/bili-stream.interface';

@Injectable()
export class BiliService {
    private readonly logger = new Logger(BiliService.name);

    constructor(
        private readonly apiClient: BiliApiClient,
        private readonly streamHandler: BiliStreamHandler
    ) {}

    /**
     * 获取B站视频信息
     */
    async getVideoInfo(url: string): Promise<BiliVideoInfo> {
        try {
            BiliUrlParser.validateBilibiliUrl(url);

            // 从B站URL中提取BV号
            const bvid = BiliUrlParser.extractBvFromUrl(url);
            if (!bvid) {
                throw new BadRequestException('无效的B站视频链接');
            }

            // 请求B站API获取视频信息
            const response = await this.apiClient.getVideoInfo(bvid);

            if (response.code !== 0) {
                throw new BadRequestException(response.message || '获取视频信息失败');
            }

            const videoInfo = response.data;
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
            this.handleError(error, '获取视频信息失败');
        }
    }

    /**
     * 获取音频流信息
     */
    async getAudioStreamInfo(url: string): Promise<BiliStreamInfo> {
        try {
            BiliUrlParser.validateBilibiliUrl(url);

            const bvid = BiliUrlParser.extractBvFromUrl(url);
            if (!bvid) {
                throw new BadRequestException('无效的B站视频链接');
            }

            // 获取视频基本信息
            const videoResponse = await this.apiClient.getVideoInfo(bvid);
            if (videoResponse.code !== 0) {
                throw new BadRequestException(videoResponse.message || '获取视频信息失败');
            }

            const videoData = videoResponse.data;
            const cid = videoData.cid;
            const title = this.streamHandler.sanitizeFilename(videoData.title);

            // 获取播放地址
            const playResponse = await this.apiClient.getPlayUrl(bvid, cid);
            if (playResponse.code !== 0) {
                throw new BadRequestException(playResponse.message || '获取播放地址失败');
            }

            const audioStreams = playResponse.data?.dash?.audio as BiliAudioStream[];
            if (!audioStreams || audioStreams.length === 0) {
                throw new BadRequestException('未找到音频流');
            }

            // 选择最佳音频流
            const bestAudioStream = this.streamHandler.selectBestAudioStream(audioStreams);

            this.logger.log(`获取音频流成功: ${title}`);

            return {
                audioUrl: bestAudioStream.baseUrl,
                filename: `${title}.mp3`
            };

        } catch (error) {
            this.logger.error('获取音频流信息失败:', error);
            this.handleError(error, '获取音频流信息失败');
        }
    }

    /**
     * 获取视频流信息
     */
    async getVideoStreamInfo(url: string, quality?: string): Promise<BiliStreamInfo> {
        try {
            BiliUrlParser.validateBilibiliUrl(url);

            const bvid = BiliUrlParser.extractBvFromUrl(url);
            if (!bvid) {
                throw new BadRequestException('无效的B站视频链接');
            }

            // 获取视频基本信息
            const videoResponse = await this.apiClient.getVideoInfo(bvid);
            if (videoResponse.code !== 0) {
                throw new BadRequestException(videoResponse.message || '获取视频信息失败');
            }

            const videoData = videoResponse.data;
            const cid = videoData.cid;
            const title = this.streamHandler.sanitizeFilename(videoData.title);

            // 获取播放地址
            const playResponse = await this.apiClient.getPlayUrl(bvid, cid);
            if (playResponse.code !== 0) {
                throw new BadRequestException(playResponse.message || '获取播放地址失败');
            }

            const videoStreams = playResponse.data?.dash?.video as BiliVideoStream[];
            if (!videoStreams || videoStreams.length === 0) {
                throw new BadRequestException('未找到视频流');
            }

            // 选择最佳视频流
            const bestVideoStream = this.streamHandler.selectBestVideoStream(videoStreams, quality);

            this.logger.log(`获取视频流成功: ${title} [${bestVideoStream.width}x${bestVideoStream.height}]`);

            return {
                audioUrl: '', // 视频流中通常不包含音频
                videoUrl: bestVideoStream.baseUrl,
                filename: `${title}.mp4`,
                quality: `${bestVideoStream.width}x${bestVideoStream.height}`
            };

        } catch (error) {
            this.logger.error('获取视频流信息失败:', error);
            this.handleError(error, '获取视频流信息失败');
        }
    }

    /**
     * 流式代理音频
     */
    async streamAudioProxy(audioUrl: string, filename: string, res: Response, options?: { range?: string }): Promise<void> {
        try {
            const mediaResponse = await this.apiClient.getMediaStream(audioUrl, options);

            // 设置响应头
            this.streamHandler.setStreamHeaders(res, filename, 'audio/mpeg', {
                contentLength: mediaResponse.headers['content-length'],
                contentRange: mediaResponse.headers['content-range'],
                acceptRanges: mediaResponse.headers['accept-ranges']
            });

            // 设置状态码
            res.status(mediaResponse.status);

            // 流式传输
            mediaResponse.data.pipe(res);

            // 错误处理
            mediaResponse.data.on('error', (error: Error) => {
                this.streamHandler.handleStreamError(error, res, filename);
            });

            res.on('close', () => {
                if (mediaResponse.data && typeof mediaResponse.data.destroy === 'function') {
                    mediaResponse.data.destroy();
                }
            });

        } catch (error) {
            this.logger.error(`音频流代理失败: ${filename} - ${error.message}`);
            this.streamHandler.handleStreamError(error, res, filename);
        }
    }

    /**
     * 流式代理视频
     */
    async streamVideoProxy(videoUrl: string, filename: string, res: Response, options?: { range?: string }): Promise<void> {
        try {
            const mediaResponse = await this.apiClient.getMediaStream(videoUrl, options);

            // 设置响应头
            this.streamHandler.setStreamHeaders(res, filename, 'video/mp4', {
                contentLength: mediaResponse.headers['content-length'],
                contentRange: mediaResponse.headers['content-range'],
                acceptRanges: mediaResponse.headers['accept-ranges']
            });

            // 设置状态码
            res.status(mediaResponse.status);

            // 流式传输
            mediaResponse.data.pipe(res);

            // 错误处理
            mediaResponse.data.on('error', (error: Error) => {
                this.streamHandler.handleStreamError(error, res, filename);
            });

            res.on('close', () => {
                if (mediaResponse.data && typeof mediaResponse.data.destroy === 'function') {
                    mediaResponse.data.destroy();
                }
            });

        } catch (error) {
            this.logger.error(`视频流代理失败: ${filename} - ${error.message}`);
            this.streamHandler.handleStreamError(error, res, filename);
        }
    }

    /**
     * 统一错误处理
     */
    private handleError(error: any, defaultMessage: string): never {
        // Handle axios error
        if (error instanceof AxiosError) {
            throw new InternalServerErrorException({
                error: defaultMessage,
                details: error.response?.data?.message || error.message || '网络请求失败'
            });
        }

        // Handle known exceptions
        if (error instanceof BadRequestException) {
            throw error;
        }

        // Handle unknown errors
        throw new InternalServerErrorException({
            error: defaultMessage,
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
} 