import OpenAI from 'openai';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser, BrowserContext } from 'playwright';
import { GenerativeModel, GoogleGenerativeAI }  from"@google/generative-ai";


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
    private googleModel: GenerativeModel;
    private browser: Browser;
    private context: BrowserContext;

    constructor() {
        this.openai = new OpenAI({
            baseURL: process.env.AI_BASE_URL,
            apiKey: process.env.AI_API_KEY,
        });
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
        this.googleModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }

    async onModuleInit() {
        this.browser = await chromium.launch({ headless: true });
        this.context = await this.browser.newContext({
            viewport: { width: 375, height: 667 },
            isMobile: true,
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1',
            locale: 'zh-CN',
            timezoneId: 'Asia/Shanghai'
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

    async genGoogleResponse(prompt: string) {
        const result = await this.googleModel.generateContent(prompt);
        const text = result.response.text()
        return text;
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
            await page.goto(url);
            await page.waitForTimeout(5000); // wait for 5 seconds
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