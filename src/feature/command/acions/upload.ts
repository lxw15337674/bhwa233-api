import axios from 'axios';

interface GalleryUploadResponse {
    src: string;
}

const GALLERY_URL = 'https://gallery233.pages.dev';

// 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFla…0MnoMpPpHo7KZKKWRfQqIyR0ZDmqW+OVr/AMWon7U/cpJdtTQLhb3Y7Njjw3V4w83tynBB8yR6MdvnqO0UkMaNU+6smcC0ka9g+SmUDXFpiQY7DmlochxptKFPKKMrIGCo+pnqe2u/5QLN/ihB/aj8OoNRTZgjOtveVSmigJuQfE/NOs69od1CLnDhNQkocbcbjJ6oSUgegDtIz5u2n/8AKvd/c8L9xf3qhdFKMTHWBGyuKaqnpGZIHloU0/Kvd/c8L9xf3q923icuFF5bluS64XHHFLS9tBK1lRwNpx6701CKKT1Ee1lLGK1oObrDf2H7lJJerY02fJlPWlpxTygob1BRSAhKcZKf8nP66+RNTwI8h1xdijPJWlKQhW3CSCrJ9b58j9lRyincoy5eCqpf27nOk1J1P5Cek32IDKJtTB5zTyEDp6mVqylQ8ntSOg/+FN1xlNzZrjzTCYzasYaR2JwAPQPz0mortgNUkNDTcL//2Q=='
async function uploadBase64Image(base64Image: string): Promise<string> {
    try {
        // 移除 base64 字符串中的 data URL 前缀
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        // 将处理后的 base64 字符串转换为 Buffer
        const buffer = Buffer.from(base64Data, 'base64');
        // 定义文件的 MIME 类型
        const mimeType = 'image/jpeg';
        // 定义文件名
        const fileName = 'uploaded_image.jpg';

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