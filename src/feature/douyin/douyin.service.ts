import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
import { AxiosResponse } from 'axios';

const pattern = /"video":{"play_addr":{"uri":"([a-z0-9]+)"/;
const cVUrl =
    'https://www.iesdouyin.com/aweme/v1/play/?video_id=%s&ratio=1080p&line=0';
const descRegex = /"desc":\s*"([^"]+)"/;
const coverRegex = /"cover":\s*{"url_list":\s*\["([^"]+)"/;

interface RangeInfo {
    start: number;
    end: number;
    total: number;
}

@Injectable()
export class DouyinService {
    constructor(private readonly httpService: HttpService) { }

    private async doGet(url: string): Promise<AxiosResponse> {
        const headers = {
            'User-Agent':
                'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36',
        };
        // axios will automatically follow redirects.
        const resp = await this.httpService.axiosRef.get(url, {
            headers,
            maxRedirects: 5
        });
        return resp;
    }

    /**
     * 获取视频文件大小
     */
    private async getVideoContentLength(videoUrl: string): Promise<number> {
        try {
            const headers = {
                'User-Agent':
                    'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36',
            };

            const response = await this.httpService.axiosRef.head(videoUrl, {
                headers,
                validateStatus: (status) => status >= 200 && status < 300,
            });

            const contentLength = response.headers['content-length'];
            return contentLength ? parseInt(contentLength, 10) : 0;
        } catch (error) {
            console.error('获取视频大小失败:', error.message);
            return 0;
        }
    }

    /**
     * 解析Range请求头
     */
    private parseRangeHeader(rangeHeader: string, contentLength: number): RangeInfo {
        if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
            throw new BadRequestException('无效的Range请求头格式');
        }

        const range = rangeHeader.replace('bytes=', '');
        const parts = range.split('-');
        
        if (parts.length !== 2) {
            throw new BadRequestException('无效的Range格式');
        }

        let start = 0;
        let end = contentLength - 1;

        // 处理不同的Range格式
        if (parts[0] && parts[1]) {
            // bytes=200-1023
            start = parseInt(parts[0], 10);
            end = parseInt(parts[1], 10);
        } else if (parts[0] && !parts[1]) {
            // bytes=200-
            start = parseInt(parts[0], 10);
            end = contentLength - 1;
        } else if (!parts[0] && parts[1]) {
            // bytes=-500 (最后500字节)
            const suffix = parseInt(parts[1], 10);
            start = Math.max(0, contentLength - suffix);
            end = contentLength - 1;
        }

        // 验证范围有效性
        if (start < 0 || end >= contentLength || start > end) {
            throw new BadRequestException('请求的范围无效');
        }

        return { start, end, total: contentLength };
    }

    async getVideoUrl(url: string) {
        const resp = await this.doGet(url);
        const body = resp.data;
        const match = pattern.exec(body);
        const descMatch = body.match(descRegex);

        if (!match || !match[1]) {
            // The link might be for an image gallery or is invalid.
            // For now, we just throw an error as requested.
            throw new NotFoundException(
                '未找到视频ID。该链接可能是一个图文帖，或者链接已失效。',
            );
        }

        const videoId = match[1];
        const downloadUrl = cVUrl.replace('%s', videoId);
        const title = descMatch ? descMatch[1].replace(/\\n/g, '') : '未找到标题';

        return { downloadUrl, title };
    }

    async streamVideoProxy(
        videoUrl: string,
        filename: string,
        res: Response,
    ): Promise<void> {
        try {
            const headers = {
                'User-Agent':
                    'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36',
            };

            // 获取视频流
            const videoResponse = await this.httpService.axiosRef.get(videoUrl, {
                headers,
                responseType: 'stream',
                validateStatus: (status) => status >= 200 && status < 300,
            });

            // 编码文件名
            const encodedFilename = encodeURIComponent(filename)
                .replace(/['()]/g, escape)
                .replace(/\*/g, '%2A')
                .replace(/%(?:7C|60|5E)/g, unescape);

            // 设置响应头
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}.mp4`);
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // 转发内容长度等头信息
            const contentLength = videoResponse.headers['content-length'];
            if (contentLength) {
                res.setHeader('Content-Length', contentLength);
            }

            // 设置状态码
            res.status(videoResponse.status);

            // 直接管道传输响应流
            videoResponse.data.pipe(res);

            // 处理流错误
            videoResponse.data.on('error', (error: Error) => {
                console.error(`视频流传输失败: ${filename} - ${error.message}`);
                if (!res.headersSent) {
                    res.status(500).json({ error: '视频流传输失败' });
                }
                res.end();
            });

            // 处理客户端断开连接
            res.on('close', () => {
                videoResponse.data.destroy();
            });

        } catch (error) {
            console.error(`视频流代理失败: ${filename} - ${error.message}`);
            if (!res.headersSent) {
                res.status(500).json({ error: '视频流代理失败' });
            }
        }
    }
} 