import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright';

export interface AIResponse {
    success: boolean;
    data: string;
    error?: string;
}

export interface BookmarkSummary {
    title: string;
    summary: string;
    tags: string[];
    image?: string;
}

interface CleanedContent {
    text: string;
    image: string;
}

export interface PageContent {
    title: string;
    content: string;
    image: string;
}

@Injectable()
export class AiService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            baseURL: process.env.AI_BASE_URL,
            apiKey: process.env.AI_API_KEY,
        });
    }

    private async cleanHtml(html: string): Promise<CleanedContent> {
        // 简单的清理HTML内容
        const text = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, '\n')
            .replace(/\s+/g, ' ')
            .trim();

        // 尝试提取第一个图片URL
        const imageMatch = html.match(/<img[^>]+src="([^">]+)"/i);
        const image = imageMatch ? imageMatch[1] : '';

        return { text, image };
    }

    async generateResponse(
        prompt: string,
        model: string = 'deepseek-chat',
    ): Promise<AIResponse> {
        try {
            const completion = await this.openai.chat.completions.create({
                messages: [{ role: 'system', content: prompt }],
                model: model,
            });

            const content = completion.choices[0].message?.content ?? '';
            const match = content.match(/```json\s*([\s\S]*?)\s*```/) || [
                null,
                content,
            ];
            const parsed = JSON.parse(match[1] || content);
            return {
                success: true,
                data: parsed,
            };
        } catch (error) {
            return {
                success: false,
                data: '',
                error: 'AI服务调用失败',
            };
        }
    }

    async getPageContent(url: string): Promise<PageContent> {
        try {
            const browser = await chromium.launch({ headless: true });
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1'
            });
            const page = await context.newPage();

            try {
                await page.goto(url, { waitUntil: 'domcontentloaded' });
                const content = await page.content();
                const pageTitle = await page.title();
                const cleanedContent = await this.cleanHtml(content);

                return {
                    title: pageTitle,
                    content: cleanedContent.text,
                    image: cleanedContent.image,
                };
            } finally {
                await context.close();
                await browser.close();
            }
        } catch (error) {
            console.error('Error in getPageContent:', error);
            return {
                title: '',
                content: '',
                image: '',
            };
        }
    }

} 