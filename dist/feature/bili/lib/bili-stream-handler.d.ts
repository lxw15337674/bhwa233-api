import { Response } from 'express';
import { BiliAudioStream, BiliVideoStream } from '../interfaces/bili-stream.interface';
export declare class BiliStreamHandler {
    private readonly logger;
    selectBestAudioStream(audioStreams: BiliAudioStream[]): BiliAudioStream;
    selectBestVideoStream(videoStreams: BiliVideoStream[], qualityPreference?: string): BiliVideoStream;
    private findStreamByQuality;
    sanitizeFilename(filename: string): string;
    encodeFilename(filename: string): string;
    setStreamHeaders(res: Response, filename: string, contentType: string, options?: {
        contentLength?: string;
        contentRange?: string;
        acceptRanges?: string;
    }): void;
    handleStreamError(error: Error, res: Response, filename: string): void;
}
