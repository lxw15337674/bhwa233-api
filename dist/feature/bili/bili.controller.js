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
var BiliController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiliController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bili_service_1 = require("./bili.service");
const bili_request_dto_1 = require("./dto/bili-request.dto");
let BiliController = BiliController_1 = class BiliController {
    constructor(biliService) {
        this.biliService = biliService;
        this.logger = new common_1.Logger(BiliController_1.name);
    }
    async getVideoInfo(query) {
        const videoInfo = await this.biliService.getVideoInfo(query.url);
        return {
            success: true,
            data: videoInfo,
        };
    }
    async downloadAudio(query, req, res) {
        try {
            const { url } = query;
            const { audioUrl, filename } = await this.biliService.getAudioStreamInfo(url);
            const range = req.headers.range;
            await this.biliService.streamAudioProxy(audioUrl, filename, res, { range });
        }
        catch (error) {
            this.logger.error(`❌ 音频下载失败: ${error.message}`);
            if (error instanceof common_1.BadRequestException) {
                if (!res.headersSent) {
                    res.status(400).json({ error: error.message });
                }
            }
            else {
                if (!res.headersSent) {
                    res.status(500).json({
                        error: error instanceof Error ? error.message : '音频下载失败'
                    });
                }
            }
        }
    }
    async downloadVideo(query, req, res) {
        try {
            const { url, quality } = query;
            const { videoUrl, filename } = await this.biliService.getVideoStreamInfo(url, quality);
            if (!videoUrl) {
                throw new common_1.BadRequestException('未找到视频流');
            }
            const range = req.headers.range;
            await this.biliService.streamVideoProxy(videoUrl, filename, res, { range });
        }
        catch (error) {
            this.logger.error(`❌ 视频下载失败: ${error.message}`);
            if (error instanceof common_1.BadRequestException) {
                if (!res.headersSent) {
                    res.status(400).json({ error: error.message });
                }
            }
            else {
                if (!res.headersSent) {
                    res.status(500).json({
                        error: error instanceof Error ? error.message : '视频下载失败'
                    });
                }
            }
        }
    }
};
exports.BiliController = BiliController;
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
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bili_request_dto_1.BiliUrlDto]),
    __metadata("design:returntype", Promise)
], BiliController.prototype, "getVideoInfo", null);
__decorate([
    (0, common_1.Get)('audio'),
    (0, swagger_1.ApiOperation)({
        summary: '下载B站视频音频',
        description: '根据B站视频链接下载音频流（自动选择最高音质）'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'url',
        description: 'B站视频链接',
        example: 'https://www.bilibili.com/video/BV1234567890',
        required: true,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '返回音频流',
        content: {
            'audio/mpeg': {
                schema: {
                    type: 'string',
                    format: 'binary'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '请求参数错误 - 无效的URL或参数'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: '服务器内部错误'
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bili_request_dto_1.BiliDownloadDto, Object, Object]),
    __metadata("design:returntype", Promise)
], BiliController.prototype, "downloadAudio", null);
__decorate([
    (0, common_1.Get)('video'),
    (0, swagger_1.ApiOperation)({
        summary: '下载B站视频',
        description: '根据B站视频链接下载视频流（可指定画质）'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'url',
        description: 'B站视频链接',
        example: 'https://www.bilibili.com/video/BV1234567890',
        required: true,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'quality',
        description: '画质偏好（可选）',
        example: '1080p',
        required: false,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '返回视频流',
        content: {
            'video/mp4': {
                schema: {
                    type: 'string',
                    format: 'binary'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '请求参数错误 - 无效的URL或参数'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: '服务器内部错误'
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bili_request_dto_1.BiliDownloadDto, Object, Object]),
    __metadata("design:returntype", Promise)
], BiliController.prototype, "downloadVideo", null);
exports.BiliController = BiliController = BiliController_1 = __decorate([
    (0, swagger_1.ApiTags)('Bili - B站统一接口'),
    (0, common_1.Controller)('bili'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
    })),
    __metadata("design:paramtypes", [bili_service_1.BiliService])
], BiliController);
//# sourceMappingURL=bili.controller.js.map