"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioDownloader = exports.AudioQualityEnums = void 0;
const axios_1 = require("axios");
var AudioQualityEnums;
(function (AudioQualityEnums) {
    AudioQualityEnums[AudioQualityEnums["Low"] = 64] = "Low";
    AudioQualityEnums[AudioQualityEnums["Medium"] = 132] = "Medium";
    AudioQualityEnums[AudioQualityEnums["High"] = 192] = "High";
    AudioQualityEnums[AudioQualityEnums["Highest"] = 320] = "Highest";
})(AudioQualityEnums || (exports.AudioQualityEnums = AudioQualityEnums = {}));
class AudioDownloader {
    constructor(baseUrl, audioQuality = AudioQualityEnums.High) {
        this.baseUrl = baseUrl;
        this.audioQuality = audioQuality;
        this.bv = '';
        this.cid = '';
        this.title = '';
        this.audioUrl = '';
        this.maxRetries = 3;
        this.retryDelay = 3000;
        this.downloadStartTime = 0;
        this.baseUrl = this.cleanUrl(baseUrl);
        this.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Referer": "https://www.bilibili.com",
            "Origin": "https://www.bilibili.com"
        };
        this.axiosInstance = axios_1.default.create({
            timeout: 100000,
            maxRedirects: 5,
            headers: this.headers,
        });
    }
    cleanUrl(url) {
        return url.trim().replace(/[\r\n\t\u0000-\u001f\u007f-\u009f]/g, '');
    }
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }
    formatSpeed(bytesPerSecond) {
        return `${this.formatBytes(bytesPerSecond)}/s`;
    }
    extractBvFromUrl(url) {
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
    async retryOperation(operation, retryCount = 0) {
        try {
            return await operation();
        }
        catch (error) {
            const axiosError = error;
            if (retryCount >= this.maxRetries) {
                console.error(`[音频下载器] 操作最终失败:`, {
                    message: axiosError.message,
                    code: axiosError.code,
                    status: axiosError.response?.status
                });
                throw error;
            }
            console.log(`[音频下载器] 重试 ${retryCount + 1}/${this.maxRetries} | ${axiosError.message}`);
            await this.sleep(this.retryDelay);
            return this.retryOperation(operation, retryCount + 1);
        }
    }
    async run() {
        await this.retryOperation(() => this.getCid());
        await this.retryOperation(() => this.getAudioUrl());
        console.log(`[音频下载器] 信息获取完成 | BV: ${this.bv} | CID: ${this.cid} | 标题: ${this.title} | 质量: ${this.audioQuality}kbps`);
        const buffer = await this.retryOperation(() => this.downloadAudio());
        return {
            buffer,
            filename: `${this.title}.mp3`
        };
    }
    async getAudioStreamUrl() {
        await this.retryOperation(() => this.getCid());
        await this.retryOperation(() => this.getAudioUrl());
        console.log(`[音频下载器] 流信息获取完成 | BV: ${this.bv} | CID: ${this.cid} | 标题: ${this.title} | 质量: ${this.audioQuality}kbps`);
        return {
            audioUrl: this.audioUrl,
            title: this.title,
            quality: this.audioQuality,
            filename: `${this.title}.mp3`
        };
    }
    async getCid() {
        const bv = this.extractBvFromUrl(this.baseUrl);
        if (!bv)
            throw new Error("Invalid BiliBili URL: 无法找到有效的BV号");
        this.bv = bv;
        const response = await this.axiosInstance.get("https://api.bilibili.com/x/web-interface/view", {
            params: { bvid: this.bv },
            headers: this.headers
        });
        if (!response.data.data) {
            throw new Error("Failed to get video information");
        }
        this.cid = response.data.data.cid;
        this.title = response.data.data.title.replace(/[<>:"/\\|?*]/g, '_');
    }
    async getAudioUrl() {
        const response = await this.axiosInstance.get("https://api.bilibili.com/x/player/wbi/playurl", {
            params: {
                bvid: this.bv,
                cid: this.cid,
                qn: this.audioQuality,
                fnver: 0,
                fnval: 4048,
                fourk: 1
            },
            headers: this.headers
        });
        if (!response.data.data?.dash?.audio?.length) {
            throw new Error("No audio stream found");
        }
        const audioStreams = response.data.data.dash.audio;
        let selectedStream = audioStreams.find(stream => stream.id === this.audioQuality);
        if (!selectedStream) {
            selectedStream = audioStreams[0];
        }
        this.audioUrl = selectedStream.baseUrl;
    }
    async downloadAudio() {
        try {
            this.downloadStartTime = Date.now();
            const downloadHeaders = {
                "User-Agent": this.headers["User-Agent"],
                "Referer": "https://www.bilibili.com",
                "Origin": "https://www.bilibili.com"
            };
            const response = await this.axiosInstance.get(this.audioUrl, {
                headers: downloadHeaders,
                responseType: 'arraybuffer',
                decompress: true,
                maxRedirects: 10,
                onDownloadProgress: (progressEvent) => {
                    const elapsedTime = (Date.now() - this.downloadStartTime) / 1000;
                    const speed = progressEvent.loaded / elapsedTime;
                    const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded));
                    const downloadedSize = this.formatBytes(progressEvent.loaded);
                    const totalSize = progressEvent.total ? this.formatBytes(progressEvent.total) : 'Unknown';
                    const downloadSpeed = this.formatSpeed(speed);
                    process.stdout.write(`\r[音频下载器] 下载进度: ${percent}% | ${downloadedSize}/${totalSize} | ${downloadSpeed}`);
                    if (progressEvent.loaded === progressEvent.total) {
                        process.stdout.write('\n');
                    }
                }
            });
            console.log(`[音频下载器] 音频下载成功`);
            return Buffer.from(response.data);
        }
        catch (error) {
            const axiosError = error;
            console.error(`[音频下载器] 下载音频失败:`, {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status
            });
            throw error;
        }
    }
}
exports.AudioDownloader = AudioDownloader;
//# sourceMappingURL=audio-downloader.js.map