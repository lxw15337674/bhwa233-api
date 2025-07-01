export declare class DouyinService {
    private doGet;
    getVideoUrl(url: string): Promise<{
        downloadUrl: string;
        title: string;
        coverUrl: string;
    }>;
}
