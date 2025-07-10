import { Request, Response } from 'express';
import { BiliService } from './bili.service';
import { BiliUrlDto, BiliDownloadDto } from './dto/bili-request.dto';
import { BiliInfoResponse } from './interfaces/bili-response.interface';
export declare class BiliController {
    private readonly biliService;
    private readonly logger;
    constructor(biliService: BiliService);
    getVideoInfo(query: BiliUrlDto): Promise<BiliInfoResponse>;
    downloadAudio(query: BiliDownloadDto, req: Request, res: Response): Promise<void>;
    downloadVideo(query: BiliDownloadDto, req: Request, res: Response): Promise<void>;
}
