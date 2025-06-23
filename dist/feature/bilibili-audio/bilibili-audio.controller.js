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
var BilibiliAudioController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BilibiliAudioController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bilibili_audio_service_1 = require("./bilibili-audio.service");
const download_audio_dto_1 = require("./dto/download-audio.dto");
let BilibiliAudioController = BilibiliAudioController_1 = class BilibiliAudioController {
    constructor(bilibiliAudioService) {
        this.bilibiliAudioService = bilibiliAudioService;
        this.logger = new common_1.Logger(BilibiliAudioController_1.name);
    }
    async downloadAudio(downloadAudioDto, req, res) {
        try {
            const { url, quality } = downloadAudioDto;
            this.logger.log(`收到音频下载请求: ${url}`);
            const { audioUrl, filename } = await this.bilibiliAudioService.getAudioStreamInfo(url, quality);
            const range = req.headers.range;
            await this.bilibiliAudioService.streamAudioProxy(audioUrl, filename, res, { range });
        }
        catch (error) {
            this.logger.error(`音频下载失败: ${error.message}`, error.stack);
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
    async healthCheck() {
        return this.bilibiliAudioService.healthCheck();
    }
};
exports.BilibiliAudioController = BilibiliAudioController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Stream Bilibili audio' }),
    (0, swagger_1.ApiBody)({ type: download_audio_dto_1.DownloadAudioDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns audio stream',
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
        description: 'Bad request - invalid URL or parameters'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    (0, common_1.Post)('download'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [download_audio_dto_1.DownloadAudioDto, Object, Object]),
    __metadata("design:returntype", Promise)
], BilibiliAudioController.prototype, "downloadAudio", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Health check for Bilibili audio service' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Service is healthy',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'ok' },
                timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
            }
        }
    }),
    (0, common_1.Get)('health'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BilibiliAudioController.prototype, "healthCheck", null);
exports.BilibiliAudioController = BilibiliAudioController = BilibiliAudioController_1 = __decorate([
    (0, swagger_1.ApiTags)('Bilibili Audio'),
    (0, common_1.Controller)('bilibili-audio'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
    })),
    __metadata("design:paramtypes", [bilibili_audio_service_1.BilibiliAudioService])
], BilibiliAudioController);
//# sourceMappingURL=bilibili-audio.controller.js.map