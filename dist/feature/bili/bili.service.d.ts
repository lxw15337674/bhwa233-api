import { Response } from 'express';
import { BiliApiClient } from './lib/bili-api-client';
import { BiliStreamHandler } from './lib/bili-stream-handler';
import { BiliVideoInfo } from './interfaces/bili-info.interface';
import { BiliStreamInfo } from './interfaces/bili-stream.interface';
export declare class BiliService {
    private readonly apiClient;
    private readonly streamHandler;
    private readonly logger;
    constructor(apiClient: BiliApiClient, streamHandler: BiliStreamHandler);
    getVideoInfo(url: string): Promise<BiliVideoInfo>;
    getAudioStreamInfo(url: string): Promise<BiliStreamInfo>;
    getVideoStreamInfo(url: string, quality?: string): Promise<BiliStreamInfo>;
    streamAudioProxy(audioUrl: string, filename: string, res: Response, options?: {
        range?: string;
    }): Promise<void>;
    streamVideoProxy(videoUrl: string, filename: string, res: Response, options?: {
        range?: string;
    }): Promise<void>;
    private handleError;
}
