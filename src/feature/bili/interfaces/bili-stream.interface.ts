export interface BiliStreamInfo {
    audioUrl: string;
    videoUrl?: string;
    filename: string;
    quality?: string;
    fileSize?: number;
}

export interface BiliAudioStream {
    id: number;
    baseUrl: string;
    bandwidth: number;
    codecid: number;
    codecs: string;
    mimeType: string;
}

export interface BiliVideoStream {
    id: number;
    baseUrl: string;
    bandwidth: number;
    codecid: number;
    codecs: string;
    mimeType: string;
    width: number;
    height: number;
    frameRate: string;
}

export interface StreamProxyOptions {
    range?: string;
    headers?: Record<string, string>;
} 