import { BadRequestException } from '@nestjs/common';

export class BiliUrlParser {
    /**
     * 验证B站URL是否有效
     */
    static validateBilibiliUrl(url: string): void {
        if (!url.includes('bilibili.com')) {
            throw new BadRequestException('无效的B站视频链接');
        }
    }

    /**
     * 从各种格式的B站URL中提取BV号
     * 支持格式：
     * 1. https://www.bilibili.com/video/BV1234567890
     * 2. https://www.bilibili.com/list/watchlater?bvid=BV1234567890&...
     * 3. 任何包含bvid参数或BV号的URL
     */
    static extractBvFromUrl(url: string): string | null {
        try {
            // 方法1: 尝试从URL路径中提取 (传统格式)
            const pathPattern = /\/video\/(BV[a-zA-Z0-9]+)/;
            const pathMatch = url.match(pathPattern);
            if (pathMatch) {
                return pathMatch[1];
            }

            // 方法2: 尝试从URL参数中提取 bvid
            const urlObj = new URL(url);
            const bvidFromParam = urlObj.searchParams.get('bvid');
            if (bvidFromParam && /^BV[a-zA-Z0-9]+$/.test(bvidFromParam)) {
                return bvidFromParam;
            }

            // 方法3: 最后尝试在整个URL中查找BV号 (兜底)
            const generalPattern = /(BV[a-zA-Z0-9]+)/;
            const generalMatch = url.match(generalPattern);
            if (generalMatch) {
                return generalMatch[1];
            }

            return null;
        } catch (error) {
            // URL解析失败，尝试正则匹配
            const bvMatch = url.match(/(BV[a-zA-Z0-9]+)/);
            if (bvMatch) {
                return bvMatch[1];
            }
            return null;
        }
    }

    /**
     * 清理URL，移除多余参数
     */
    static cleanUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            // 保留主要路径和bvid参数
            if (urlObj.searchParams.has('bvid')) {
                return `${urlObj.origin}${urlObj.pathname}?bvid=${urlObj.searchParams.get('bvid')}`;
            }
            return `${urlObj.origin}${urlObj.pathname}`;
        } catch {
            return url;
        }
    }
} 