"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DouyinService = void 0;
const common_1 = require("@nestjs/common");
const pattern = /"video":{"play_addr":{"uri":"([a-z0-9]+)"/;
const cVUrl = 'https://www.iesdouyin.com/aweme/v1/play/?video_id=%s&ratio=1080p&line=0';
const descRegex = /"desc":\s*"([^"]+)"/;
const coverRegex = /"cover":\s*{"url_list":\s*\["([^"]+)"/;
let DouyinService = class DouyinService {
    async doGet(url) {
        const headers = new Headers();
        headers.set('User-Agent', 'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36');
        const resp = await fetch(url, { method: 'GET', headers });
        return resp;
    }
    async getVideoUrl(url) {
        const resp = await this.doGet(url);
        const body = await resp.text();
        const match = pattern.exec(body);
        const descMatch = body.match(descRegex);
        const coverMatch = body.match(coverRegex);
        if (!match || !match[1]) {
            throw new common_1.NotFoundException('未找到视频ID。该链接可能是一个图文帖，或者链接已失效。');
        }
        const videoId = match[1];
        const downloadUrl = cVUrl.replace('%s', videoId);
        const title = descMatch ? descMatch[1] : '未找到标题';
        const coverUrl = coverMatch ? coverMatch[1] : '';
        return { downloadUrl, title, coverUrl };
    }
};
exports.DouyinService = DouyinService;
exports.DouyinService = DouyinService = __decorate([
    (0, common_1.Injectable)()
], DouyinService);
//# sourceMappingURL=douyin.service.js.map