"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textToImage = textToImage;
const sharp_1 = require("sharp");
const common_1 = require("@nestjs/common");
const upload_1 = require("./upload");
const logger = new common_1.Logger('TextToImageUtil');
async function textToImage(content, options) {
    try {
        const defaultOptions = {
            maxWidth: 1000,
            fontSize: 18,
            fontFamily: 'monospace',
            lineHeight: 24,
            margin: 20,
            bgColor: '#2d2d2d',
            textColor: '#ffffff',
        };
        const mergedOptions = { ...defaultOptions, ...options };
        const lines = content.split('\n');
        const height = (lines.length * mergedOptions.lineHeight) + (mergedOptions.margin * 2);
        const image = (0, sharp_1.default)({
            create: {
                width: mergedOptions.maxWidth,
                height: height,
                channels: 4,
                background: mergedOptions.bgColor
            }
        });
        const textOverlays = [];
        for (let i = 0; i < lines.length; i++) {
            const y = mergedOptions.margin + (i * mergedOptions.lineHeight);
            const textBuffer = Buffer.from(`
                <svg width="${mergedOptions.maxWidth - (mergedOptions.margin * 2)}" height="${mergedOptions.lineHeight}">
                    <text 
                        x="0" 
                        y="${mergedOptions.fontSize}" 
                        font-family="${mergedOptions.fontFamily}" 
                        font-size="${mergedOptions.fontSize}px" 
                        fill="${mergedOptions.textColor}"
                    >${lines[i].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
                </svg>`);
            textOverlays.push({
                input: textBuffer,
                top: y,
                left: mergedOptions.margin
            });
        }
        const buffer = await image
            .composite(textOverlays)
            .jpeg({ quality: 90 })
            .toBuffer();
        const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        return await (0, upload_1.default)(base64Image);
    }
    catch (error) {
        logger.error('Error converting text to image:', error);
        throw new Error(`Failed to convert text to image: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=textToImage.js.map