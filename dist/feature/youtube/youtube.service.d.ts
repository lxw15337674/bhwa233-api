import { PassThrough } from 'stream';
export declare class YoutubeService {
    private readonly logger;
    getAudioStream(url: string): Promise<{
        stream: PassThrough;
        title: string;
    }>;
}
