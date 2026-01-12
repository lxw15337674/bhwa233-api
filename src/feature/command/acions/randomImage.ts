import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import sharp from 'sharp';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

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

        // 获取原始图片数据
        const originalBuffer = Buffer.from(response.data);
        
        // 转换为 JPEG
        let jpegBuffer = await sharp(originalBuffer)
            .jpeg({ quality: 85 })
            .toBuffer();

        // 如果超过 5MB，缩小尺寸
        if (jpegBuffer.length > MAX_SIZE_BYTES) {
            // 先尝试缩小到 1200px 宽
            jpegBuffer = await sharp(originalBuffer)
                .resize(1200, null, { withoutEnlargement: true })
                .jpeg({ quality: 85 })
                .toBuffer();
            
            // 如果还是太大，降低质量
            if (jpegBuffer.length > MAX_SIZE_BYTES) {
                jpegBuffer = await sharp(originalBuffer)
                    .resize(1200, null, { withoutEnlargement: true })
                    .jpeg({ quality: 70 })
                    .toBuffer();
            }
        }

        // 转换为 base64
        const base64Image = jpegBuffer.toString('base64');
        
        return {
            content: `data:image/jpeg;base64,${base64Image}`,
            type: 'image',
        };
    } catch (error) {
        throw new Error(`获取随机图片失败: ${error.message}`);
    }
}
