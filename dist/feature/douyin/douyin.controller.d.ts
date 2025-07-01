import { DouyinService } from './douyin.service';
import { DownloadVideoDto } from './dto/download-video.dto';
export declare class DouyinController {
    private readonly douyinService;
    constructor(douyinService: DouyinService);
    downloadVideo(downloadVideoDto: DownloadVideoDto): Promise<{
        downloadUrl: string;
        title: string;
        coverUrl: string;
    }>;
}
