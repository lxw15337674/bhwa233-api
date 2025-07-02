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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DouyinService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const pattern = /"video":{"play_addr":{"uri":"([a-z0-9]+)"/;
const cVUrl = 'https://www.iesdouyin.com/aweme/v1/play/?video_id=%s&ratio=1080p&line=0';
const descRegex = /"desc":\s*"([^"]+)"/;
const coverRegex = /"cover":\s*{"url_list":\s*\["([^"]+)"/;
let DouyinService = class DouyinService {
    constructor(httpService) {
        this.httpService = httpService;
    }
    async doGet(url) {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36',
        };
        const resp = await this.httpService.axiosRef.get(url, {
            headers,
            maxRedirects: 5
        });
        return resp;
    }
    async getVideoUrl(url) {
        const resp = await this.doGet(url);
        const body = resp.data;
        const match = pattern.exec(body);
        const descMatch = body.match(descRegex);
        if (!match || !match[1]) {
            throw new common_1.NotFoundException('未找到视频ID。该链接可能是一个图文帖，或者链接已失效。');
        }
        const videoId = match[1];
        const downloadUrl = cVUrl.replace('%s', videoId);
        const title = descMatch ? descMatch[1].replace(/\\n/g, '') : '未找到标题';
        return { downloadUrl, title };
    }
    async streamVideoProxy(videoUrl, filename, res) {
        try {
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36',
            };
            const videoResponse = await this.httpService.axiosRef.get(videoUrl, {
                headers,
                responseType: 'stream',
                validateStatus: (status) => status >= 200 && status < 300,
            });
            const encodedFilename = encodeURIComponent(filename)
                .replace(/['()]/g, escape)
                .replace(/\*/g, '%2A')
                .replace(/%(?:7C|60|5E)/g, unescape);
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}.mp4`);
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            const contentLength = videoResponse.headers['content-length'];
            if (contentLength) {
                res.setHeader('Content-Length', contentLength);
            }
            res.status(videoResponse.status);
            videoResponse.data.pipe(res);
            videoResponse.data.on('error', (error) => {
                console.error(`视频流传输失败: ${filename} - ${error.message}`);
                if (!res.headersSent) {
                    res.status(500).json({ error: '视频流传输失败' });
                }
                res.end();
            });
            res.on('close', () => {
                videoResponse.data.destroy();
            });
        }
        catch (error) {
            console.error(`视频流代理失败: ${filename} - ${error.message}`);
            if (!res.headersSent) {
                res.status(500).json({ error: '视频流代理失败' });
            }
        }
    }
};
exports.DouyinService = DouyinService;
exports.DouyinService = DouyinService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], DouyinService);
//# sourceMappingURL=douyin.service.js.map