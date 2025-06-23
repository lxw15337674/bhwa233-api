import { Request, Response } from 'express';
import { BilibiliAudioService } from './bilibili-audio.service';
import { DownloadAudioDto } from './dto/download-audio.dto';
export declare class BilibiliAudioController {
    private readonly bilibiliAudioService;
    private readonly logger;
    constructor(bilibiliAudioService: BilibiliAudioService);
    downloadAudio(downloadAudioDto: DownloadAudioDto, req: Request, res: Response): Promise<void>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
    }>;
}
