import { HttpService } from '@nestjs/axios';
import { BilibiliVideoInfo } from './interfaces/bilibili-video-info.interface';
export declare class BilibiliVideoService {
    private readonly httpService;
    private readonly logger;
    constructor(httpService: HttpService);
    private validateBilibiliUrl;
    private extractBvFromUrl;
    getVideoInfo(url: string): Promise<BilibiliVideoInfo>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
    }>;
}
