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
exports.YoutubeController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const youtube_service_1 = require("./youtube.service");
const download_audio_dto_1 = require("./dto/download-audio.dto");
const swagger_1 = require("@nestjs/swagger");
let YoutubeController = class YoutubeController {
    constructor(youtubeService) {
        this.youtubeService = youtubeService;
    }
    async downloadAudio(downloadAudioDto, res) {
        const { stream, title } = await this.youtubeService.getAudioStream(downloadAudioDto.url);
        const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '-');
        const filename = `${safeTitle}.mp3`;
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Type', 'audio/mpeg');
        return new common_1.StreamableFile(stream);
    }
};
exports.YoutubeController = YoutubeController;
__decorate([
    (0, common_1.Get)('audio'),
    (0, swagger_1.ApiOperation)({
        summary: 'Download audio from YouTube',
        description: 'Downloads the audio from a YouTube video as a stream.',
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [download_audio_dto_1.DownloadAudioDto, Object]),
    __metadata("design:returntype", Promise)
], YoutubeController.prototype, "downloadAudio", null);
exports.YoutubeController = YoutubeController = __decorate([
    (0, common_1.Controller)('feature/youtube'),
    (0, swagger_1.ApiTags)('youtube'),
    __metadata("design:paramtypes", [youtube_service_1.YoutubeService])
], YoutubeController);
//# sourceMappingURL=youtube.controller.js.map