import { DouyinService } from './douyin.service';
import { DownloadVideoDto } from './dto/download-video.dto';
import { Response } from 'express';
export declare class DouyinController {
    private readonly douyinService;
    constructor(douyinService: DouyinService);
    parseVideo(downloadVideoDto: DownloadVideoDto): Promise<{
        downloadUrl: string;
        title: any;
    }>;
    downloadVideo(downloadVideoDto: DownloadVideoDto, res: Response): Promise<void>;
}
