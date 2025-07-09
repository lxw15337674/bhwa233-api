export interface AudioStreamInfo {
    audioUrl: string;
    title: string;
    filename: string;
}

export interface DownloadResult {
    buffer: Buffer;
    filename: string;
}

export interface StreamProxyOptions {
    range?: string;
    headers?: Record<string, string>;
} 