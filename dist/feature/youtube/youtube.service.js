"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var YoutubeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeService = void 0;
const common_1 = require("@nestjs/common");
const ytdl_core_1 = require("@distube/ytdl-core");
const stream_1 = require("stream");
let YoutubeService = YoutubeService_1 = class YoutubeService {
    constructor() {
        this.logger = new common_1.Logger(YoutubeService_1.name);
    }
    async getAudioStream(url) {
        try {
            const videoInfo = await ytdl_core_1.default.getInfo(url);
            const audioFormat = ytdl_core_1.default.chooseFormat(videoInfo.formats, {
                quality: 'highestaudio',
                filter: 'audioonly',
            });
            if (!audioFormat) {
                throw new Error('No audio format found');
            }
            const stream = (0, ytdl_core_1.default)(url, { format: audioFormat });
            const passthrough = new stream_1.PassThrough();
            stream.pipe(passthrough);
            return {
                stream: passthrough,
                title: videoInfo.videoDetails.title,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get audio stream for URL: ${url}`, error);
            throw new common_1.InternalServerErrorException('Failed to get audio stream');
        }
    }
};
exports.YoutubeService = YoutubeService;
exports.YoutubeService = YoutubeService = YoutubeService_1 = __decorate([
    (0, common_1.Injectable)()
], YoutubeService);
//# sourceMappingURL=youtube.service.js.map