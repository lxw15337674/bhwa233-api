"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioDownloader = void 0;
const axios_1 = require("axios");
class AudioDownloader {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.bv = '';
        this.cid = '';
        this.title = '';
        this.audioUrl = '';
        this.maxRetries = 3;
        this.retryDelay = 3000;
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
            if (retryCount >= this.maxRetries) {
                throw error;
            }
            await this.sleep(this.retryDelay);
            return this.retryOperation(operation, retryCount + 1);
        }
    }
    async run() {
        await this.retryOperation(() => this.getCid());
        await this.retryOperation(() => this.getAudioUrl());
        const buffer = await this.retryOperation(() => this.downloadAudio());
        return {
            buffer,
            filename: `${this.title}.mp3`
        };
    }
    async getAudioStreamUrl() {
        await this.retryOperation(() => this.getCid());
        await this.retryOperation(() => this.getAudioUrl());
        return {
            audioUrl: this.audioUrl,
            title: this.title,
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
        const bestAudioStream = audioStreams.reduce((best, current) => {
            return current.id > best.id ? current : best;
        });
        this.audioUrl = bestAudioStream.baseUrl;
    }
    async downloadAudio() {
        try {
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
        }
        catch (error) {
            throw error;
        }
    }
}
exports.AudioDownloader = AudioDownloader;
//# sourceMappingURL=audio-downloader.js.map