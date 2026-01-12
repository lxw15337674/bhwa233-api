import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export async function getRandomImage(httpService: HttpService): Promise<{ content: string; type: 'image' | 'text' }> {
    try {
        const url = 'https://own.bhwa233.com/api/gallery/random';
        
        // 请求图片，axios 会自动跟随重定向
        const response = await firstValueFrom(
            httpService.get(url, {
                responseType: 'arraybuffer',
                timeout: 15000,
                maxRedirects: 5,
            })
        );

        // 获取图片数据
        const imageBuffer = Buffer.from(response.data);
        
        // 从最终的 URL 中提取文件扩展名来判断图片类型
        const finalUrl = response.request?.res?.responseUrl || response.config.url || '';
        let imageType = 'jpeg'; // 默认类型
        
        if (finalUrl.includes('.webp')) {
            imageType = 'webp';
        } else if (finalUrl.includes('.png')) {
            imageType = 'png';
        } else if (finalUrl.includes('.gif')) {
            imageType = 'gif';
        } else if (finalUrl.includes('.jpg') || finalUrl.includes('.jpeg')) {
            imageType = 'jpeg';
        }

        // 转换为 base64
        const base64Image = imageBuffer.toString('base64');
        
        return {
            content: `data:image/${imageType};base64,${base64Image}`,
            type: 'image',
        };
    } catch (error) {
        throw new Error(`获取随机图片失败: ${error.message}`);
    }
}
