import OpenAI from 'openai';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser, BrowserContext } from 'playwright';


export interface BookmarkSummary {
    title: string;
    summary: string;
    tags: string[];
    image?: string;
}

export interface PageContent {
    title: string;
    content: string;
}

@Injectable()
export class AiService implements OnModuleInit, OnModuleDestroy {
    private openai: OpenAI;
    private browser: Browser;
    private context: BrowserContext;

    constructor() {
        this.openai = new OpenAI({
            baseURL: process.env.AI_BASE_URL,
            apiKey: process.env.AI_API_KEY,
        });
    }

    async onModuleInit() {
        this.browser = await chromium.launch({ headless: true });
        // 创建单个上下文
        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1'
        });
    }

    async onModuleDestroy() {
        if (this.context) {
            await this.context.close();
        }
        if (this.browser) {
            await this.browser.close();
        }
    }

    async generateResponse(
        prompt: string,
        model: string = process.env.AI_MODEL || 'step-2-mini',
    ) {
        try {
            const completion = await this.openai.chat.completions.create({
                messages: [{ role: 'system', content: prompt }],
                model: model,
            });
            console.log('Generated response:', completion);
            return completion
        } catch (error) {
            console.error('Error generating response:', error);
            return { choices: [] };
        }
    }

    async getPageContent(url: string): Promise<PageContent> {
        const page = await this.context.newPage();
        try {
            await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: 30000
            });

            // 等待页面加载完成
            await page.waitForLoadState('domcontentloaded');

            let pageTitle = '';
            try {
                pageTitle = await page.title();
                if (!pageTitle) {
                    pageTitle = await page.$eval('title', (el) => el.textContent) || '';
                }
            } catch (titleError) {
                console.error('Error getting page title:', titleError);
                pageTitle = await page.$eval('h1', (el) => el.textContent) || '';
            }

            const content = await page.content();
            return {
                title: pageTitle,
                content: content,
            };
        } catch (error) {
            console.error('Error in getPageContent:', error);
            return {
                title: '',
                content: '',
            };
        } finally {
            await page.close();
        }
    }

} 