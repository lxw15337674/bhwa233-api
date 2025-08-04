export declare class AudioDownloader {
    private readonly baseUrl;
    private readonly headers;
    private bv;
    private cid;
    private title;
    private audioUrl;
    private readonly axiosInstance;
    private readonly maxRetries;
    private readonly retryDelay;
    constructor(baseUrl: string);
    private cleanUrl;
    private sleep;
    private extractBvFromUrl;
    private retryOperation;
    run(): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    getAudioStreamUrl(): Promise<{
        audioUrl: string;
        title: string;
        filename: string;
    }>;
    private getCid;
    private getAudioUrl;
    private downloadAudio;
}
