import axios from 'axios';

interface GalleryUploadResponse {
    src: string;
}

const GALLERY_URL = 'https://gallery233.pages.dev';

async function uploadBase64Image(base64Image: string): Promise<string> {
    try {
        // 将 base64 字符串转换为 Buffer
        const buffer = Buffer.from(base64Image, 'base64');
        // 定义文件的 MIME 类型
        const mimeType = 'image/png';
        // 定义文件名
        const fileName = 'uploaded_image.png';

        // 创建 FormData 对象并添加文件数据
        const formData = new FormData();
        formData.append('file', new Blob([buffer], { type: mimeType }), fileName);

        // 发送 POST 请求到服务器进行文件上传
        const response = await axios.post<GalleryUploadResponse[]>(`${GALLERY_URL}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        // 从响应中获取上传文件的 URL
        if (response.data.length > 0) {
            return response.data[0].src;
        } else {
            throw new Error('No upload response data');
        }
    } catch (error) {
        // 捕获并处理上传过程中出现的错误
        console.error(`上传失败: ${error}`);
        throw new Error(`Error uploading image: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export default uploadBase64Image;