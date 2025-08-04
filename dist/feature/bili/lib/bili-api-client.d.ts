import { HttpService } from '@nestjs/axios';
export declare class BiliApiClient {
    private readonly httpService;
    private readonly logger;
    constructor(httpService: HttpService);
    private getBilibiliHeaders;
    getVideoInfo(bvid: string): Promise<any>;
    getPlayUrl(bvid: string, cid: string): Promise<any>;
    getMediaStream(url: string, options?: {
        range?: string;
    }): Promise<any>;
}
