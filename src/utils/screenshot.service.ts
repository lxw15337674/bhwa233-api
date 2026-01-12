import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { existsSync } from 'fs';
import { join } from 'path';

interface ScreenshotOptions {
    url: string;
    width?: number;
    height?: number;
    timeout?: number;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
}

interface CacheEntry {
    buffer: Buffer;
    timestamp: number;
}

@Injectable()
export class ScreenshotService {
    private readonly logger = new Logger(ScreenshotService.name);
    private cache = new Map<string, CacheEntry>();
    private readonly CACHE_TTL = 10 * 60 * 1000; // 10分钟

    // 检测本地 Chrome 路径（Windows）
    private findLocalChrome(): string | null {
        const possiblePaths = [
            process.env.CHROME_PATH,
            join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
            join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
            join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        ];

        for (const path of possiblePaths) {
            if (path && existsSync(path)) {
                this.logger.log(`Found Chrome at: ${path}`);
                return path;
            }
        }

        return null;
    }

    // 获取 Chrome 可执行路径
    private async getExecutablePath(): Promise<string> {
        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
        
        if (isProduction) {
            return await chromium.executablePath();
        }
        
        const localChrome = this.findLocalChrome();
        if (!localChrome) {
            throw new Error('无法找到本地 Chrome 安装。请设置环境变量 CHROME_PATH 或安装 Google Chrome');
        }
        return localChrome;
    }

    // 检查缓存是否有效
    private getCachedScreenshot(url: string): Buffer | null {
        const cached = this.cache.get(url);
        if (!cached) {
            return null;
        }

        const now = Date.now();
        if (now - cached.timestamp > this.CACHE_TTL) {
            this.cache.delete(url);
            return null;
        }

        this.logger.log(`Cache hit for: ${url}`);
        return cached.buffer;
    }

    // 保存到缓存
    private setCachedScreenshot(url: string, buffer: Buffer): void {
        this.cache.set(url, {
            buffer,
            timestamp: Date.now(),
        });
        this.logger.log(`Cached screenshot for: ${url}`);
    }

    // 截图核心方法
    async takeScreenshot(options: ScreenshotOptions): Promise<Buffer> {
        const {
            url,
            width = 1200,
            height = 800,
            timeout = 30000,
            waitUntil = 'networkidle0',
        } = options;

        // 检查缓存
        const cached = this.getCachedScreenshot(url);
        if (cached) {
            return cached;
        }

        this.logger.log(`Taking screenshot of: ${url}`);

        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
        const executablePath = await this.getExecutablePath();

        const browser = await puppeteer.launch({
            args: isProduction ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: {
                width,
                height,
            },
            executablePath,
            headless: true,
        });

        try {
            const page = await browser.newPage();
            
            // 设置超时
            page.setDefaultTimeout(timeout);
            page.setDefaultNavigationTimeout(timeout);

            // 访问页面
            await page.goto(url, { waitUntil });

            // 截图（可视区域）
            const screenshot = await page.screenshot({
                type: 'jpeg',
                quality: 85,
                fullPage: false,
            });

            const buffer = screenshot as Buffer;
            
            // 保存到缓存
            this.setCachedScreenshot(url, buffer);

            this.logger.log(`Screenshot taken successfully for: ${url}`);
            return buffer;
        } catch (error) {
            this.logger.error(`Failed to take screenshot of ${url}:`, error);
            throw error;
        } finally {
            await browser.close();
        }
    }

    // 清理过期缓存
    clearExpiredCache(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        this.cache.forEach((entry, key) => {
            if (now - entry.timestamp > this.CACHE_TTL) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.cache.delete(key));
        
        if (keysToDelete.length > 0) {
            this.logger.log(`Cleared ${keysToDelete.length} expired cache entries`);
        }
    }
}
