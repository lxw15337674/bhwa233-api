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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DouyinController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const douyin_service_1 = require("./douyin.service");
const download_video_dto_1 = require("./dto/download-video.dto");
let DouyinController = class DouyinController {
    constructor(douyinService) {
        this.douyinService = douyinService;
    }
    async parseVideo(downloadVideoDto, req) {
        const result = await this.douyinService.getVideoUrl(downloadVideoDto.url);
        const proxyDownloadUrl = `${req.protocol}://${req.get('host')}/api/douyin/download?url=${encodeURIComponent(downloadVideoDto.url)}`;
        return {
            ...result,
            proxyDownloadUrl,
        };
    }
    async downloadVideo(downloadVideoDto, res) {
        const { downloadUrl, title } = await this.douyinService.getVideoUrl(downloadVideoDto.url);
        return this.douyinService.streamVideoProxy(downloadUrl, title, res);
    }
};
exports.DouyinController = DouyinController;
__decorate([
    (0, common_1.Get)('parse'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [download_video_dto_1.DownloadVideoDto, Object]),
    __metadata("design:returntype", Promise)
], DouyinController.prototype, "parseVideo", null);
__decorate([
    (0, common_1.Get)('download'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [download_video_dto_1.DownloadVideoDto, Object]),
    __metadata("design:returntype", Promise)
], DouyinController.prototype, "downloadVideo", null);
exports.DouyinController = DouyinController = __decorate([
    (0, common_1.Controller)('douyin'),
    __metadata("design:paramtypes", [douyin_service_1.DouyinService])
], DouyinController);
//# sourceMappingURL=douyin.controller.js.map