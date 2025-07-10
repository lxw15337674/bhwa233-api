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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BilibiliVideoController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bilibili_video_service_1 = require("./bilibili-video.service");
const get_video_info_dto_1 = require("./dto/get-video-info.dto");
let BilibiliVideoController = class BilibiliVideoController {
    constructor(bilibiliVideoService) {
        this.bilibiliVideoService = bilibiliVideoService;
    }
    async getVideoInfo(query) {
        const videoInfo = await this.bilibiliVideoService.getVideoInfo(query.url);
        return {
            success: true,
            data: videoInfo,
        };
    }
    async healthCheck() {
        return this.bilibiliVideoService.healthCheck();
    }
};
exports.BilibiliVideoController = BilibiliVideoController;
__decorate([
    (0, common_1.Get)('info'),
    (0, swagger_1.ApiOperation)({
        summary: '获取B站视频信息',
        description: '根据B站视频链接获取视频的标题、作者、统计数据等信息'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'url',
        description: 'B站视频链接',
        example: 'https://www.bilibili.com/video/BV1234567890',
        required: true,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功获取视频信息',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', example: '视频标题' },
                        bvid: { type: 'string', example: 'BV1234567890' },
                        aid: { type: 'number', example: 123456789 },
                        author: { type: 'string', example: '作者名称' },
                        duration: { type: 'number', example: 600 },
                        pubdate: { type: 'number', example: 1640995200 },
                        desc: { type: 'string', example: '视频描述' },
                        pic: { type: 'string', example: 'https://i0.hdslb.com/bfs/archive/xxx.jpg' },
                        view: { type: 'number', example: 10000 },
                        danmaku: { type: 'number', example: 100 },
                        reply: { type: 'number', example: 50 },
                        favorite: { type: 'number', example: 200 },
                        coin: { type: 'number', example: 30 },
                        share: { type: 'number', example: 20 },
                        like: { type: 'number', example: 500 },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '请求参数错误',
        schema: {
            type: 'object',
            properties: {
                error: { type: 'string', example: '无效的B站视频链接' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: '服务器内部错误',
        schema: {
            type: 'object',
            properties: {
                error: { type: 'string', example: '获取视频信息失败' },
                details: { type: 'string', example: '网络请求失败' },
            },
        },
    }),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_video_info_dto_1.GetVideoInfoDto]),
    __metadata("design:returntype", typeof (_a = typeof Promise !== "undefined" && Promise) === "function" ? _a : Object)
], BilibiliVideoController.prototype, "getVideoInfo", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: '健康检查' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '服务健康状态',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'ok' },
                timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            },
        },
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BilibiliVideoController.prototype, "healthCheck", null);
exports.BilibiliVideoController = BilibiliVideoController = __decorate([
    (0, swagger_1.ApiTags)('B站视频'),
    (0, common_1.Controller)('bilibili-video'),
    __metadata("design:paramtypes", [bilibili_video_service_1.BilibiliVideoService])
], BilibiliVideoController);
//# sourceMappingURL=bilibili-video.controller.js.map