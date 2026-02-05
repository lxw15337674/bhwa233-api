import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

interface GeminiInlineData {
    mimeType?: string;
    data?: string;
}

interface GeminiPart {
    inlineData?: GeminiInlineData;
    inline_data?: GeminiInlineData;
    text?: string;
}

interface GeminiCandidate {
    content?: {
        parts?: GeminiPart[];
    };
}

interface GeminiResponse {
    candidates?: GeminiCandidate[];
}

const DEFAULT_ASPECT_RATIO = '16:9';
const logger = new Logger('GeminiImage');

function buildBaseUrl(rawBaseUrl?: string): string {
    if (!rawBaseUrl) {
        throw new Error('缺少 GEMINI_BASE_URL 配置');
    }
    return rawBaseUrl.replace(/\/+$/, '');
}

function pickImagePart(parts: GeminiPart[]): GeminiInlineData | undefined {
    for (const part of parts) {
        if (part.inlineData?.data) {
            return part.inlineData;
        }
        if (part.inline_data?.data) {
            return part.inline_data;
        }
    }
    return undefined;
}

export async function generateGeminiImage(
    httpService: HttpService,
    prompt: string
): Promise<{ content: string; type: 'image' | 'text' }> {
    if (!prompt || !prompt.trim()) {
        throw new Error('请输入文生图描述');
    }

    const baseUrl = buildBaseUrl(process.env.GEMINI_BASE_URL);
    const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview';
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    if (!apiKey) {
        throw new Error('缺少 GEMINI_API_KEY 或 AI_API_KEY 配置');
    }

    const url = `${baseUrl}/v1beta/models/${model}:generateContent`;

    const body = {
        contents: [
            {
                role: 'user',
                parts: [{ text: prompt.trim() }],
            },
        ],
        generationConfig: {
            responseModalities: ['IMAGE'],
            imageConfig: {
                aspectRatio: DEFAULT_ASPECT_RATIO,
            },
        },
    };

    let response;
    try {
        response = await firstValueFrom(
            httpService.post<GeminiResponse>(url, body, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 180000,
            })
        );
    } catch (error) {
        throw new Error('文生图接口请求失败');
    }

    const responseLog = JSON.stringify(response.data, (key, value) => {
        if (key === 'data' && typeof value === 'string') {
            return `[base64 ${value.length} chars]`;
        }
        return value;
    });
    logger.log(`Gemini image response: ${responseLog}`);

    const candidates = response.data?.candidates ?? [];
    const parts = candidates[0]?.content?.parts ?? [];
    const imagePart = pickImagePart(parts);

    if (!imagePart?.data) {
        throw new Error('未获取到图片数据');
    }

    const mimeType = imagePart.mimeType || 'image/png';
    return {
        content: `data:${mimeType};base64,${imagePart.data}`,
        type: 'image',
    };
}
