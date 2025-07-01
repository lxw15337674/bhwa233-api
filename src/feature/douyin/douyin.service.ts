import { Injectable, NotFoundException } from '@nestjs/common';

const pattern = /"video":{"play_addr":{"uri":"([a-z0-9]+)"/;
const cVUrl =
    'https://www.iesdouyin.com/aweme/v1/play/?video_id=%s&ratio=1080p&line=0';
const descRegex = /"desc":\s*"([^"]+)"/;
const coverRegex = /"cover":\s*{"url_list":\s*\["([^"]+)"/;

@Injectable()
export class DouyinService {
    private async doGet(url: string): Promise<Response> {
        const headers = new Headers();
        headers.set(
            'User-Agent',
            'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36',
        );
        // fetch will automatically follow redirects.
        const resp = await fetch(url, { method: 'GET', headers });
        return resp;
    }

    async getVideoUrl(url: string): Promise<{ downloadUrl: string; title: string; coverUrl: string }> {
        const resp = await this.doGet(url);
        const body = await resp.text();
        const match = pattern.exec(body);
        const descMatch = body.match(descRegex);
        const coverMatch = body.match(coverRegex);

        if (!match || !match[1]) {
            // The link might be for an image gallery or is invalid.
            // For now, we just throw an error as requested.
            throw new NotFoundException(
                '未找到视频ID。该链接可能是一个图文帖，或者链接已失效。',
            );
        }

        const videoId = match[1];
        const downloadUrl = cVUrl.replace('%s', videoId);
        const title = descMatch ? descMatch[1] : '未找到标题';
        const coverUrl = coverMatch ? coverMatch[1] : '';

        return { downloadUrl, title, coverUrl };
    }
} 