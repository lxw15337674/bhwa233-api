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
var BilibiliAudioService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BilibiliAudioService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const audio_downloader_1 = require("./lib/audio-downloader");
const axios_2 = require("axios");
let BilibiliAudioService = BilibiliAudioService_1 = class BilibiliAudioService {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(BilibiliAudioService_1.name);
    }
    validateBilibiliUrl(url) {
        if (!url.includes('bilibili.com')) {
            throw new common_1.BadRequestException('无效的B站链接');
        }
    }
    async getAudioStreamInfo(url) {
        let downloader = null;
        try {
            this.validateBilibiliUrl(url);
            downloader = new audio_downloader_1.AudioDownloader(url);
            const streamInfo = await downloader.getAudioStreamUrl();
            this.logger.log(`获取音频流成功: ${streamInfo.title}`);
            return streamInfo;
        }
        catch (error) {
            let title = '未知视频';
            try {
                if (downloader && downloader.title) {
                    title = downloader.title;
                }
            }
            catch { }
            error.title = title;
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`获取音频流信息失败: ${error.message}`);
        }
    }
    async streamAudioProxy(audioUrl, filename, res, options) {
        try {
            const bilibiliHeaders = {
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
            }
            else {
                res.setHeader('Accept-Ranges', 'bytes');
            }
            res.status(bilibiliResponse.status);
            bilibiliResponse.data.pipe(res);
            bilibiliResponse.data.on('error', (error) => {
                if (!res.headersSent) {
                    res.status(500).json({ error: '音频流传输失败' });
                }
                res.end();
            });
            res.on('close', () => {
                bilibiliResponse.data.destroy();
            });
        }
        catch (error) {
            if (error instanceof axios_2.AxiosError) {
                const status = error.response?.status || 500;
                const message = `B站响应错误: ${status} ${error.response?.statusText || error.message}`;
                if (!res.headersSent) {
                    res.status(status).json({ error: message });
                }
            }
            else {
                if (!res.headersSent) {
                    res.status(500).json({ error: '音频流代理失败' });
                }
            }
        }
    }
    async healthCheck() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString()
        };
    }
};
exports.BilibiliAudioService = BilibiliAudioService;
exports.BilibiliAudioService = BilibiliAudioService = BilibiliAudioService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _a : Object])
], BilibiliAudioService);
//# sourceMappingURL=bilibili-audio.service.js.map