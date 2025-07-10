"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BiliService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiliService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const bili_url_parser_1 = require("./lib/bili-url-parser");
const bili_api_client_1 = require("./lib/bili-api-client");
const bili_stream_handler_1 = require("./lib/bili-stream-handler");
let BiliService = BiliService_1 = class BiliService {
    constructor(apiClient, streamHandler) {
        this.apiClient = apiClient;
        this.streamHandler = streamHandler;
        this.logger = new common_1.Logger(BiliService_1.name);
    }
    async getVideoInfo(url) {
        try {
            bili_url_parser_1.BiliUrlParser.validateBilibiliUrl(url);
            const bvid = bili_url_parser_1.BiliUrlParser.extractBvFromUrl(url);
            if (!bvid) {
                throw new common_1.BadRequestException('无效的B站视频链接');
            }
            const response = await this.apiClient.getVideoInfo(bvid);
            if (response.code !== 0) {
                throw new common_1.BadRequestException(response.message || '获取视频信息失败');
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
        }
        catch (error) {
            this.logger.error('获取B站视频信息失败:', error);
            this.handleError(error, '获取视频信息失败');
        }
    }
    async getAudioStreamInfo(url) {
        try {
            bili_url_parser_1.BiliUrlParser.validateBilibiliUrl(url);
            const bvid = bili_url_parser_1.BiliUrlParser.extractBvFromUrl(url);
            if (!bvid) {
                throw new common_1.BadRequestException('无效的B站视频链接');
            }
            const videoResponse = await this.apiClient.getVideoInfo(bvid);
            if (videoResponse.code !== 0) {
                throw new common_1.BadRequestException(videoResponse.message || '获取视频信息失败');
            }
            const videoData = videoResponse.data;
            const cid = videoData.cid;
            const title = this.streamHandler.sanitizeFilename(videoData.title);
            const playResponse = await this.apiClient.getPlayUrl(bvid, cid);
            if (playResponse.code !== 0) {
                throw new common_1.BadRequestException(playResponse.message || '获取播放地址失败');
            }
            const audioStreams = playResponse.data?.dash?.audio;
            if (!audioStreams || audioStreams.length === 0) {
                throw new common_1.BadRequestException('未找到音频流');
            }
            const bestAudioStream = this.streamHandler.selectBestAudioStream(audioStreams);
            this.logger.log(`获取音频流成功: ${title}`);
            return {
                audioUrl: bestAudioStream.baseUrl,
                filename: `${title}.mp3`
            };
        }
        catch (error) {
            this.logger.error('获取音频流信息失败:', error);
            this.handleError(error, '获取音频流信息失败');
        }
    }
    async getVideoStreamInfo(url, quality) {
        try {
            bili_url_parser_1.BiliUrlParser.validateBilibiliUrl(url);
            const bvid = bili_url_parser_1.BiliUrlParser.extractBvFromUrl(url);
            if (!bvid) {
                throw new common_1.BadRequestException('无效的B站视频链接');
            }
            const videoResponse = await this.apiClient.getVideoInfo(bvid);
            if (videoResponse.code !== 0) {
                throw new common_1.BadRequestException(videoResponse.message || '获取视频信息失败');
            }
            const videoData = videoResponse.data;
            const cid = videoData.cid;
            const title = this.streamHandler.sanitizeFilename(videoData.title);
            const playResponse = await this.apiClient.getPlayUrl(bvid, cid);
            if (playResponse.code !== 0) {
                throw new common_1.BadRequestException(playResponse.message || '获取播放地址失败');
            }
            const videoStreams = playResponse.data?.dash?.video;
            if (!videoStreams || videoStreams.length === 0) {
                throw new common_1.BadRequestException('未找到视频流');
            }
            const bestVideoStream = this.streamHandler.selectBestVideoStream(videoStreams, quality);
            this.logger.log(`获取视频流成功: ${title} [${bestVideoStream.width}x${bestVideoStream.height}]`);
            return {
                audioUrl: '',
                videoUrl: bestVideoStream.baseUrl,
                filename: `${title}.mp4`,
                quality: `${bestVideoStream.width}x${bestVideoStream.height}`
            };
        }
        catch (error) {
            this.logger.error('获取视频流信息失败:', error);
            this.handleError(error, '获取视频流信息失败');
        }
    }
    async streamAudioProxy(audioUrl, filename, res, options) {
        try {
            const mediaResponse = await this.apiClient.getMediaStream(audioUrl, options);
            this.streamHandler.setStreamHeaders(res, filename, 'audio/mpeg', {
                contentLength: mediaResponse.headers['content-length'],
                contentRange: mediaResponse.headers['content-range'],
                acceptRanges: mediaResponse.headers['accept-ranges']
            });
            res.status(mediaResponse.status);
            mediaResponse.data.pipe(res);
            mediaResponse.data.on('error', (error) => {
                this.streamHandler.handleStreamError(error, res, filename);
            });
            res.on('close', () => {
                if (mediaResponse.data && typeof mediaResponse.data.destroy === 'function') {
                    mediaResponse.data.destroy();
                }
            });
        }
        catch (error) {
            this.logger.error(`音频流代理失败: ${filename} - ${error.message}`);
            this.streamHandler.handleStreamError(error, res, filename);
        }
    }
    async streamVideoProxy(videoUrl, filename, res, options) {
        try {
            const mediaResponse = await this.apiClient.getMediaStream(videoUrl, options);
            this.streamHandler.setStreamHeaders(res, filename, 'video/mp4', {
                contentLength: mediaResponse.headers['content-length'],
                contentRange: mediaResponse.headers['content-range'],
                acceptRanges: mediaResponse.headers['accept-ranges']
            });
            res.status(mediaResponse.status);
            mediaResponse.data.pipe(res);
            mediaResponse.data.on('error', (error) => {
                this.streamHandler.handleStreamError(error, res, filename);
            });
            res.on('close', () => {
                if (mediaResponse.data && typeof mediaResponse.data.destroy === 'function') {
                    mediaResponse.data.destroy();
                }
            });
        }
        catch (error) {
            this.logger.error(`视频流代理失败: ${filename} - ${error.message}`);
            this.streamHandler.handleStreamError(error, res, filename);
        }
    }
    handleError(error, defaultMessage) {
        if (error instanceof axios_1.AxiosError) {
            throw new common_1.InternalServerErrorException({
                error: defaultMessage,
                details: error.response?.data?.message || error.message || '网络请求失败'
            });
        }
        if (error instanceof common_1.BadRequestException) {
            throw error;
        }
        throw new common_1.InternalServerErrorException({
            error: defaultMessage,
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
};
exports.BiliService = BiliService;
exports.BiliService = BiliService = BiliService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bili_api_client_1.BiliApiClient,
        bili_stream_handler_1.BiliStreamHandler])
], BiliService);
//# sourceMappingURL=bili.service.js.map