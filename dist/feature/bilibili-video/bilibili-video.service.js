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
var BilibiliVideoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BilibiliVideoService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const axios_2 = require("axios");
let BilibiliVideoService = BilibiliVideoService_1 = class BilibiliVideoService {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(BilibiliVideoService_1.name);
    }
    validateBilibiliUrl(url) {
        if (!url.includes('bilibili.com')) {
            throw new common_1.BadRequestException('无效的B站视频链接');
        }
    }
    extractBvFromUrl(url) {
        try {
            const pathPattern = /\/video\/(BV[a-zA-Z0-9]+)/;
            const pathMatch = url.match(pathPattern);
            if (pathMatch) {
                return pathMatch[1];
            }
            const urlObj = new URL(url);
            const bvidFromParam = urlObj.searchParams.get('bvid');
            if (bvidFromParam && /^BV[a-zA-Z0-9]+$/.test(bvidFromParam)) {
                return bvidFromParam;
            }
            const generalPattern = /(BV[a-zA-Z0-9]+)/;
            const generalMatch = url.match(generalPattern);
            if (generalMatch) {
                return generalMatch[1];
            }
            return null;
        }
        catch (error) {
            const bvMatch = url.match(/(BV[a-zA-Z0-9]+)/);
            if (bvMatch) {
                return bvMatch[1];
            }
            return null;
        }
    }
    async getVideoInfo(url) {
        try {
            this.validateBilibiliUrl(url);
            const bvid = this.extractBvFromUrl(url);
            if (!bvid) {
                throw new common_1.BadRequestException('无效的B站视频链接');
            }
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
                throw new common_1.BadRequestException(data.message || '获取视频信息失败');
            }
            const videoInfo = data.data;
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
            if (error instanceof axios_2.AxiosError) {
                throw new common_1.InternalServerErrorException({
                    error: '获取视频信息失败',
                    details: error.response?.data?.message || error.message || '网络请求失败'
                });
            }
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException({
                error: '获取视频信息失败',
                details: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async healthCheck() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString()
        };
    }
};
exports.BilibiliVideoService = BilibiliVideoService;
exports.BilibiliVideoService = BilibiliVideoService = BilibiliVideoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], BilibiliVideoService);
//# sourceMappingURL=bilibili-video.service.js.map