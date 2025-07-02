import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
export declare class DouyinService {
    private readonly httpService;
    constructor(httpService: HttpService);
    private doGet;
    getVideoUrl(url: string): Promise<{
        downloadUrl: string;
        title: any;
    }>;
    streamVideoProxy(videoUrl: string, filename: string, res: Response): Promise<void>;
}
