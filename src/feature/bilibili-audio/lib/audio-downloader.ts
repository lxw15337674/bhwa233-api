import axios, { AxiosError } from 'axios';

interface AudioStream {
    id: number;
    baseUrl: string;
}

export class AudioDownloader {
    private readonly headers: { [key: string]: string };
    private bv: string = '';
    private cid: string = '';
    private title: string = '';
    private audioUrl: string = '';
    private readonly axiosInstance;
    private readonly maxRetries = 3;
    private readonly retryDelay = 3000; // 3 seconds

    constructor(private readonly baseUrl: string) {
        // 清理和验证 baseUrl
        this.baseUrl = this.cleanUrl(baseUrl);

        this.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Referer": "https://www.bilibili.com",
            "Origin": "https://www.bilibili.com"
        };

        this.axiosInstance = axios.create({
            timeout: 100000,
            maxRedirects: 5,
            headers: this.headers,
        });
    }

    private cleanUrl(url: string): string {
        // 移除可能导致HTTP头部错误的字符
        return url.trim().replace(/[\r\n\t\u0000-\u001f\u007f-\u009f]/g, '');
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 从各种格式的B站URL中提取BV号
     * 支持格式：
     * 1. https://www.bilibili.com/video/BV1234567890
     * 2. https://www.bilibili.com/list/watchlater?bvid=BV1234567890&...
     * 3. 任何包含bvid参数或BV号的URL
     */
    private extractBvFromUrl(url: string): string | null {
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

    private async retryOperation<T>(operation: () => Promise<T>, retryCount = 0): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            if (retryCount >= this.maxRetries) {
                throw error;
            }

            await this.sleep(this.retryDelay);
            return this.retryOperation(operation, retryCount + 1);
        }
    }

    public async run(): Promise<{ buffer: Buffer; filename: string }> {
        await this.retryOperation(() => this.getCid());
        await this.retryOperation(() => this.getAudioUrl());

        const buffer = await this.retryOperation(() => this.downloadAudio());
        return {
            buffer,
            filename: `${this.title}.mp3`
        };
    }

    /**
     * 获取音频流信息（用于流式代理）
     * 只获取音频URL和相关信息，不下载实际文件
     */
    public async getAudioStreamUrl(): Promise<{
        audioUrl: string;
        title: string;
        filename: string;
    }> {
        await this.retryOperation(() => this.getCid());
        await this.retryOperation(() => this.getAudioUrl());

        return {
            audioUrl: this.audioUrl,
            title: this.title,
            filename: `${this.title}.mp3`
        };
    }

    private async getCid(): Promise<void> {
        // 提取BV号的方法，支持多种URL格式
        const bv = this.extractBvFromUrl(this.baseUrl);
        if (!bv) throw new Error("Invalid BiliBili URL: 无法找到有效的BV号");
        this.bv = bv;

        const response = await this.axiosInstance.get("https://api.bilibili.com/x/web-interface/view", {
            params: { bvid: this.bv },
            headers: this.headers
        });

        if (!response.data.data) {
            throw new Error("Failed to get video information");
        }

        this.cid = response.data.data.cid;
        this.title = response.data.data.title.replace(/[<>:"/\\|?*]/g, '_'); // Remove invalid filename characters
    }

    private async getAudioUrl(): Promise<void> {
        const response = await this.axiosInstance.get("https://api.bilibili.com/x/player/wbi/playurl", {
            params: {
                bvid: this.bv,
                cid: this.cid,
                fnver: 0,
                fnval: 4048,
                fourk: 1
            },
            headers: this.headers
        });

        if (!response.data.data?.dash?.audio?.length) {
            throw new Error("No audio stream found");
        }

        // 选择id最大的音频流（最高音质）
        const audioStreams = response.data.data.dash.audio as AudioStream[];
        const bestAudioStream = audioStreams.reduce((best, current) => {
            return current.id > best.id ? current : best;
        });

        this.audioUrl = bestAudioStream.baseUrl;
    }

    private async downloadAudio(): Promise<Buffer> {
        try {
            // 创建安全的下载头部
            const downloadHeaders = {
                "User-Agent": this.headers["User-Agent"],
                "Referer": "https://www.bilibili.com",
                "Origin": "https://www.bilibili.com"
            };

            const response = await this.axiosInstance.get(this.audioUrl, {
                headers: downloadHeaders,
                responseType: 'arraybuffer',
                decompress: true,
                maxRedirects: 10
            });

            return Buffer.from(response.data);
        } catch (error) {
            throw error;
        }
    }
} 