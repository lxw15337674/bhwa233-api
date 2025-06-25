import sharp from 'sharp';
import { Logger } from '@nestjs/common';
import uploadBase64Image from './upload';

const logger = new Logger('TextToImageUtil');

/**
 * Converts text content to an image and uploads it
 * 
 * @param content - The text content to convert to an image
 * @param options - Optional configuration for the image generation
 * @returns A URL to the uploaded image
 */
export async function textToImage(content: string, options?: {
    bgColor?: string;
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
    lineHeight?: number;
    margin?: number;
    maxWidth?: number;
    customHeight?: number;
    title?: string;
}): Promise<string> {
    try {
        // Default options
        const defaultOptions = {
            maxWidth: 1000,
            fontSize: 18,
            fontFamily: 'monospace',
            lineHeight: 24,
            margin: 20,
            bgColor: '#2d2d2d',
            textColor: '#ffffff',
        };

        // Merge default options with provided options
        const mergedOptions = { ...defaultOptions, ...options };

        // Split content into lines
        const lines = content.split('\n');

        // Calculate height based on line count and line height
        const height = (lines.length * mergedOptions.lineHeight) + (mergedOptions.margin * 2);

        // Create a new image with the specified dimensions and background color
        const image = sharp({
            create: {
                width: mergedOptions.maxWidth,
                height: height,
                channels: 4,
                background: mergedOptions.bgColor
            }
        });

        // Create text overlays for each line
        const textOverlays = [];

        for (let i = 0; i < lines.length; i++) {
            // Calculate y position for each line
            const y = mergedOptions.margin + (i * mergedOptions.lineHeight);

            // Create text overlay for the current line
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

        // Compose the image with text overlays
        const buffer = await image
            .composite(textOverlays)
            .jpeg({ quality: 90 })
            .toBuffer();

        // Convert buffer to base64 data URI
        const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;

        // Upload the image and return the URL
        return await uploadBase64Image(base64Image);
    } catch (error) {
        logger.error('Error converting text to image:', error);
        throw new Error(`Failed to convert text to image: ${error instanceof Error ? error.message : String(error)}`);
    }
}