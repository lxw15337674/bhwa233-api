import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
import { AxiosResponse } from 'axios';

const pattern = /"video":{"play_addr":{"uri":"([a-z0-9]+)"/;
const cVUrl =
    'https://www.iesdouyin.com/aweme/v1/play/?video_id=%s&ratio=1080p&line=0';
const descRegex = /"desc":\s*"([^"]+)"/;
const coverRegex = /"cover":\s*{"url_list":\s*\["([^"]+)"/;

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