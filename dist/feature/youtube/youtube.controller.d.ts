import { StreamableFile } from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import { DownloadAudioDto } from './dto/download-audio.dto';
import type { Response } from 'express';
export declare class YoutubeController {
    private readonly youtubeService;
    constructor(youtubeService: YoutubeService);
    downloadAudio(downloadAudioDto: DownloadAudioDto, res: Response): Promise<StreamableFile>;
}
