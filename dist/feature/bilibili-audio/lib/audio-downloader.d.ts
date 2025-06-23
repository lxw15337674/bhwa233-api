export declare enum AudioQualityEnums {
    Low = 64,
    Medium = 132,
    High = 192,
    Highest = 320
}
export declare class AudioDownloader {
    private readonly baseUrl;
    private readonly audioQuality;
    private readonly headers;
    private bv;
    private cid;
    private title;
    private audioUrl;
    private readonly axiosInstance;
    private readonly maxRetries;
    private readonly retryDelay;
    constructor(baseUrl: string, audioQuality?: AudioQualityEnums);
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
        quality: number;
        filename: string;
    }>;
    private getCid;
    private getAudioUrl;
    private downloadAudio;
}
