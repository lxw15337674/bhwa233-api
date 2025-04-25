"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const GALLERY_URL = 'https://gallery233.pages.dev';
async function uploadBase64Image(base64Image) {
    try {
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const mimeType = 'image/jpeg';
        const fileName = 'uploaded_image.jpg';
        const formData = new FormData();
        formData.append('file', new Blob([buffer], { type: mimeType }), fileName);
        const response = await axios_1.default.post(`${GALLERY_URL}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.length > 0) {
            return response.data[0].src;
        }
        else {
            throw new Error('No upload response data');
        }
    }
    catch (error) {
        console.error(`上传失败: ${error}`);
        throw new Error(`Error uploading image: ${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.default = uploadBase64Image;
//# sourceMappingURL=upload.js.map