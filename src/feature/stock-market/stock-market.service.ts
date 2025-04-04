import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser, BrowserContext } from 'playwright';

interface CacheData {
    data: string;
    timestamp: number;
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
export class StockMarketService implements OnModuleInit, OnModuleDestroy {
    private browser: Browser;
    private context: BrowserContext;
    private futuCache: Map<string, CacheData> = new Map();
    private yuntuCache: CacheData | null = null;
    private readonly CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds

    private getCacheKey(area: string, mapType: string): string {
        return `${area}-${mapType}`;
    }

    private isCacheValid(cache: CacheData | null | undefined): boolean {
        if (!cache) return false;
        return Date.now() - cache.timestamp < this.CACHE_DURATION;
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

    async getFutuStockMap(area: string, mapType: string): Promise<string> {
        const cacheKey = this.getCacheKey(area, mapType);
        const cachedData = this.futuCache.get(cacheKey);

        if (this.isCacheValid(cachedData) && cachedData) {
            console.log(`富途热力图命中缓存: ${area}-${mapType}`);
            return cachedData.data;
        }

        const futuContext = await this.browser.newContext();
        const page = await futuContext.newPage();
        try {
            await page.setViewportSize({ width: 1920, height: 1080 });
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
            console.log('富途热力图生成成功');
            const base64Data = `data:image/jpeg;base64,${screenshot.toString('base64')}`;
            
            // Store in cache
            this.futuCache.set(cacheKey, {
                data: base64Data,
                timestamp: Date.now()
            });

            return base64Data;
        } catch (error) {
            console.error('获取富途热力图失败:', error);
            throw new Error('获取富途热力图失败，请稍后重试');
        } finally {
            await page.close();
            await futuContext.close();
        }
    }

    async getYuntuStockMap(): Promise<string> {
        if (this.isCacheValid(this.yuntuCache) && this.yuntuCache) {
            console.log('云图热力图命中缓存');
            return this.yuntuCache.data;
        }

        const yuntuContext = await this.browser.newContext();
        const page = await yuntuContext.newPage();
        try {
            await page.setViewportSize({ width: 1920, height: 1080 });
            await page.goto('https://dapanyuntu.com/', { waitUntil: 'load'});
            
            await page.waitForTimeout(10000);
            const element = await page.locator('#body');
            
            if (!element) {
                throw new Error('热力图元素未找到，请稍后重试');
            }

            const screenshot = await element.screenshot({
                type: 'jpeg',
                quality: 90
            });
            console.log('热力图生成成功');
            const base64Data = `data:image/jpeg;base64,${screenshot.toString('base64')}`;
            
            // Store in cache
            this.yuntuCache = {
                data: base64Data,
                timestamp: Date.now()
            };

            return base64Data;
        } catch (error) {
            console.error('获取云图热力图失败:', error);
            throw new Error('获取云图热力图失败，请稍后重试');
        } finally {
            await page.close();
            await yuntuContext.close();
        }
    }
}