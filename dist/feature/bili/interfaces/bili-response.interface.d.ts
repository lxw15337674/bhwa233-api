import { BiliVideoInfo } from './bili-info.interface';
export interface BiliInfoResponse {
    success: boolean;
    data: BiliVideoInfo;
}
export interface BiliStreamResponse {
    success: boolean;
    data: {
        downloadUrl: string;
        filename: string;
        proxyDownloadUrl?: string;
    };
}
export interface BiliErrorResponse {
    success: false;
    error: string;
    details?: string;
}
