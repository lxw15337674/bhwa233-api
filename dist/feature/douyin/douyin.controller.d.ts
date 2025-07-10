import { DouyinService } from './douyin.service';
import { DownloadVideoDto } from './dto/download-video.dto';
import { Response, Request } from 'express';
export declare class DouyinController {
    private readonly douyinService;
    constructor(douyinService: DouyinService);
    parseVideo(downloadVideoDto: DownloadVideoDto, req: Request): unknown;
    downloadVideo(downloadVideoDto: DownloadVideoDto, res: Response): unknown;
}
