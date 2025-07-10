"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiliUrlParser = void 0;
const common_1 = require("@nestjs/common");
class BiliUrlParser {
    static validateBilibiliUrl(url) {
        if (!url.includes('bilibili.com')) {
            throw new common_1.BadRequestException('无效的B站视频链接');
        }
    }
    static extractBvFromUrl(url) {
        try {
            const pathPattern = /\/video\/(BV[a-zA-Z0-9]+)/;
            const pathMatch = url.match(pathPattern);
            if (pathMatch) {
                return pathMatch[1];
            }
            const urlObj = new URL(url);
            const bvidFromParam = urlObj.searchParams.get('bvid');
            if (bvidFromParam && /^BV[a-zA-Z0-9]+$/.test(bvidFromParam)) {
                return bvidFromParam;
            }
            const generalPattern = /(BV[a-zA-Z0-9]+)/;
            const generalMatch = url.match(generalPattern);
            if (generalMatch) {
                return generalMatch[1];
            }
            return null;
        }
        catch (error) {
            const bvMatch = url.match(/(BV[a-zA-Z0-9]+)/);
            if (bvMatch) {
                return bvMatch[1];
            }
            return null;
        }
    }
    static cleanUrl(url) {
        try {
            const urlObj = new URL(url);
            if (urlObj.searchParams.has('bvid')) {
                return `${urlObj.origin}${urlObj.pathname}?bvid=${urlObj.searchParams.get('bvid')}`;
            }
            return `${urlObj.origin}${urlObj.pathname}`;
        }
        catch {
            return url;
        }
    }
}
exports.BiliUrlParser = BiliUrlParser;
//# sourceMappingURL=bili-url-parser.js.map