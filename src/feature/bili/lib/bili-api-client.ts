import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class BiliApiClient {
    private readonly logger = new Logger(BiliApiClient.name);

    constructor(private readonly httpService: HttpService) {}

    /**
     * 获取标准的B站请求头
     */
    private getBilibiliHeaders(): Record<string, string> {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Referer': 'https://www.bilibili.com/',
            'Origin': 'https://www.bilibili.com'
        };
    }

    /**
     * 获取视频基本信息
     */
    async getVideoInfo(bvid: string): Promise<any> {
        const url = 'https://api.bilibili.com/x/web-interface/view';
        const config: AxiosRequestConfig = {
            params: { bvid },
            headers: this.getBilibiliHeaders(),
            timeout: 10000
        };

        const response = await this.httpService.axiosRef.get(url, config);
        return response.data;
    }

    /**
     * 获取视频播放地址
     */
    async getPlayUrl(bvid: string, cid: string): Promise<any> {
        const url = 'https://api.bilibili.com/x/player/wbi/playurl';
        const config: AxiosRequestConfig = {
            params: {
                bvid,
                cid,
                fnver: 0,
                fnval: 4048, // 包含音频和视频流
                fourk: 1
            },
            headers: this.getBilibiliHeaders(),
            timeout: 10000
        };

        const response = await this.httpService.axiosRef.get(url, config);
        return response.data;
    }

    /**
     * 流式请求媒体文件
     */
    async getMediaStream(url: string, options?: { range?: string }): Promise<any> {
        const headers = this.getBilibiliHeaders();
        if (options?.range) {
            headers['Range'] = options.range;
        }

        const config: AxiosRequestConfig = {
            headers,
            responseType: 'stream',
            validateStatus: (status) => status >= 200 && status < 300 || status === 206,
            timeout: 30000
        };

        return this.httpService.axiosRef.get(url, config);
    }
} 