import { BilibiliVideoService } from './bilibili-video.service';
import { GetVideoInfoDto } from './dto/get-video-info.dto';
import { BilibiliVideoResponse } from './interfaces/bilibili-video-info.interface';
export declare class BilibiliVideoController {
    private readonly bilibiliVideoService;
    constructor(bilibiliVideoService: BilibiliVideoService);
    getVideoInfo(query: GetVideoInfoDto): Promise<BilibiliVideoResponse>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
    }>;
}
