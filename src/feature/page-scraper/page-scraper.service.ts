import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser, BrowserContext } from 'playwright';
import { AiService } from '../ai/ai.service';
import { bookmarkPrompt } from './prompts';

export interface PageContent {
    title: string;
    content: string;
}

export interface OpenAICompletion {
    tags: string[];
    summary: string;
    title: string;
    image: string;
}

@Injectable()
export class PageScraperService implements OnModuleInit, OnModuleDestroy {
    private browser: Browser;
    private context: BrowserContext;
    constructor() {}

    async onModuleInit() {
        this.browser = await chromium.launch({ headless: true });
        this.context = await this.browser.newContext();
    }

    async onModuleDestroy() {
        if (this.context) {
            await this.context.close();
        }
        if (this.browser) {
            await this.browser.close();
        }
    }

    async getPageContent(url: string): Promise<PageContent> {
        const mobileContext = await this.browser.newContext({
            viewport: { width: 375, height: 667 },
            isMobile: true,
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1',
            locale: 'zh-CN',
            timezoneId: 'Asia/Shanghai',
        });
        const page = await mobileContext.newPage();

        
        await page.goto(url);
        await page.waitForTimeout(5000);
            
        try {
            // 等待页面加载完成
            await page.waitForLoadState('networkidle');
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
            await mobileContext.close();
        }
    }
}