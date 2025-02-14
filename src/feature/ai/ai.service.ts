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

export enum MapType {
    hy = 'hy',
    gu = 'gu'
}

export enum Area {
    'hk' = 'hk',
    'us' = 'us',
    'cn' = 'cn'
}

@Injectable()
export class AiService implements OnModuleInit, OnModuleDestroy {
    private openai: OpenAI;
    private googleModel: GenerativeModel;
    private browser: Browser;
    private context: BrowserContext;
    private isFutuProcessing = false;
    private isYuntuProcessing = false;

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
        const mobileContext = await this.browser.newContext({
            viewport: { width: 375, height: 667 },
            isMobile: true,
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1',
            locale: 'zh-CN',
            timezoneId: 'Asia/Shanghai'
        });
        const page = await mobileContext.newPage();
        try {
            await page.goto(url);
            await page.waitForTimeout(5000);
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

    async getFutuStockMap(area: string, mapType: string): Promise<string> {
        if (this.isFutuProcessing) {
            throw new Error('Another process is running');
        }
        this.isFutuProcessing = true;

        const page = await this.context.newPage();
        try {
            await page.setViewportSize({ width: 1920, height: 1080 }); // 设置1080p尺寸
            await page.goto(`https://www.futunn.com/quote/${area}/heatmap`, {
                waitUntil: 'load',
            });
            await page.waitForTimeout(5000);
            if (mapType === MapType.hy) {
                await page.click('.select-component.heatmap-list-select');
                await page.evaluate(() => {

                    const parentElement = document.querySelector('.pouper.max-hgt');
                    (parentElement?.children[1] as HTMLElement)?.click();
                });
            }
            
            await page.waitForTimeout(3000);
            const element = await page.locator('.quote-page.router-page');
            if (!element) {
                throw new Error('热力图元素未找到，请稍后重试');
            }

            await page.waitForTimeout(2000);
            const screenshot = await element.screenshot({
                type: 'jpeg',
                quality: 90
            });

            return `data:image/jpeg;base64,${screenshot.toString('base64')}`;
        } catch (error) {
            console.error('获取富途热力图失败:', error);
            throw new Error('获取富途热力图失败，请稍后重试');
        } finally {
            this.isFutuProcessing = false;
            await page.close();
        }
    }

    async getYuntuStockMap(): Promise<string> {
        if (this.isYuntuProcessing) {
            throw new Error('Another process is running');
        }
        this.isYuntuProcessing = true;

        const page = await this.context.newPage();
        try {
            await page.setViewportSize({ width: 1920, height: 1080 }); // 设置1080p尺寸
            await page.goto('https://dapanyuntu.com/');
            
            await page.waitForTimeout(10000);
            const element = await page.locator('#body');
            
            if (!element) {
                throw new Error('热力图元素未找到，请稍后重试');
            }

            const screenshot = await element.screenshot({
                type: 'jpeg',
                quality: 90
            });

            return `data:image/jpeg;base64,${screenshot.toString('base64')}`;
        } catch (error) {
            console.error('获取云图热力图失败:', error);
            throw new Error('获取云图热力图失败，请稍后重试');
        } finally {
            this.isYuntuProcessing = false;
            await page.close();
        }
    }
}