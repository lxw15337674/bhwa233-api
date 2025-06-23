import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
import { AudioQualityEnums } from './lib/audio-downloader';
import { AudioStreamInfo, StreamProxyOptions } from './interfaces/audio-stream.interface';
export declare class BilibiliAudioService {
    private readonly httpService;
    private readonly logger;
    constructor(httpService: HttpService);
    private validateBilibiliUrl;
    getAudioStreamInfo(url: string, quality?: AudioQualityEnums): Promise<AudioStreamInfo>;
    streamAudioProxy(audioUrl: string, filename: string, res: Response, options?: StreamProxyOptions): Promise<void>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
    }>;
}
