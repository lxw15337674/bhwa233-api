import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
export declare class DouyinService {
    private readonly httpService;
    constructor(httpService: HttpService);
    private doGet;
    private getVideoContentLength;
    private parseRangeHeader;
    getVideoUrl(url: string): unknown;
    streamVideoProxy(videoUrl: string, filename: string, res: Response): Promise<void>;
}
