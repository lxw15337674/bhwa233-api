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
var BiliApiClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiliApiClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
let BiliApiClient = BiliApiClient_1 = class BiliApiClient {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(BiliApiClient_1.name);
    }
    getBilibiliHeaders() {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Referer': 'https://www.bilibili.com/',
            'Origin': 'https://www.bilibili.com'
        };
    }
    async getVideoInfo(bvid) {
        const url = 'https://api.bilibili.com/x/web-interface/view';
        const config = {
            params: { bvid },
            headers: this.getBilibiliHeaders(),
            timeout: 10000
        };
        const response = await this.httpService.axiosRef.get(url, config);
        return response.data;
    }
    async getPlayUrl(bvid, cid) {
        const url = 'https://api.bilibili.com/x/player/wbi/playurl';
        const config = {
            params: {
                bvid,
                cid,
                fnver: 0,
                fnval: 4048,
                fourk: 1
            },
            headers: this.getBilibiliHeaders(),
            timeout: 10000
        };
        const response = await this.httpService.axiosRef.get(url, config);
        return response.data;
    }
    async getMediaStream(url, options) {
        const headers = this.getBilibiliHeaders();
        if (options?.range) {
            headers['Range'] = options.range;
        }
        const config = {
            headers,
            responseType: 'stream',
            validateStatus: (status) => status >= 200 && status < 300 || status === 206,
            timeout: 30000
        };
        return this.httpService.axiosRef.get(url, config);
    }
};
exports.BiliApiClient = BiliApiClient;
exports.BiliApiClient = BiliApiClient = BiliApiClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], BiliApiClient);
//# sourceMappingURL=bili-api-client.js.map