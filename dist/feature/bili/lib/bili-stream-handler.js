"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BiliStreamHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiliStreamHandler = void 0;
const common_1 = require("@nestjs/common");
let BiliStreamHandler = BiliStreamHandler_1 = class BiliStreamHandler {
    constructor() {
        this.logger = new common_1.Logger(BiliStreamHandler_1.name);
    }
    selectBestAudioStream(audioStreams) {
        if (!audioStreams || audioStreams.length === 0) {
            throw new Error('No audio stream found');
        }
        return audioStreams.reduce((best, current) => {
            return current.id > best.id ? current : best;
        });
    }
    selectBestVideoStream(videoStreams, qualityPreference) {
        if (!videoStreams || videoStreams.length === 0) {
            throw new Error('No video stream found');
        }
        if (qualityPreference) {
            const preferredStream = this.findStreamByQuality(videoStreams, qualityPreference);
            if (preferredStream) {
                return preferredStream;
            }
        }
        return videoStreams.reduce((best, current) => {
            return current.id > best.id ? current : best;
        });
    }
    findStreamByQuality(videoStreams, quality) {
        const qualityMap = {
            '1080p': 80,
            '720p': 64,
            '480p': 32,
            '360p': 16
        };
        const targetQuality = qualityMap[quality];
        if (!targetQuality) {
            return null;
        }
        return videoStreams.find(stream => stream.id === targetQuality) || null;
    }
    sanitizeFilename(filename) {
        return filename.replace(/[<>:"/\\|?*]/g, '_');
    }
    encodeFilename(filename) {
        return encodeURIComponent(filename)
            .replace(/['()]/g, escape)
            .replace(/\*/g, '%2A')
            .replace(/%(?:7C|60|5E)/g, unescape);
    }
    setStreamHeaders(res, filename, contentType, options) {
        const encodedFilename = this.encodeFilename(filename);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        if (options?.contentLength) {
            res.setHeader('Content-Length', options.contentLength);
        }
        if (options?.contentRange) {
            res.setHeader('Content-Range', options.contentRange);
        }
        if (options?.acceptRanges) {
            res.setHeader('Accept-Ranges', options.acceptRanges);
        }
    }
    handleStreamError(error, res, filename) {
        this.logger.error(`流传输失败: ${filename} - ${error.message}`);
        if (!res.headersSent) {
            res.status(500).json({
                error: '流传输失败',
                details: error.message
            });
        }
        if (!res.destroyed) {
            res.end();
        }
    }
};
exports.BiliStreamHandler = BiliStreamHandler;
exports.BiliStreamHandler = BiliStreamHandler = BiliStreamHandler_1 = __decorate([
    (0, common_1.Injectable)()
], BiliStreamHandler);
//# sourceMappingURL=bili-stream-handler.js.map