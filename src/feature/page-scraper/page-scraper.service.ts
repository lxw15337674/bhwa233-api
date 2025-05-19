import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { chromium, Browser, BrowserContext } from 'playwright';
import axios from 'axios';
import { AiService } from '../ai/ai.service';
import { AIRequest } from '../ai/type';
import { tavily } from '@tavily/core';

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
      constructor(
        private readonly aiService: AiService
    ) {}

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
    }    async getPageContent(url: string): Promise<PageContent> {
        try {
            // 1. 首先尝试使用 Tavily Extract API
            const apiKey = process.env.TAVILY_API_KEY;
            if (!apiKey) {
                console.log('未配置Tavily API密钥，降级使用Playwright');
                return this.getPageContentWithPlaywright(url);
            }
            
            try {
                // 尝试使用 Tavily Extract API
                const result = await this.getPageContentWithTavily(url);
                if (result.content) {
                    return result;
                } else {
                    console.log('Tavily Extract 返回内容为空，降级使用Playwright');
                    return this.getPageContentWithPlaywright(url);
                }
            } catch (tavilyError) {
                console.error('Tavily Extract 调用失败:', tavilyError);
                console.log('降级使用Playwright');
                return this.getPageContentWithPlaywright(url);
            }
        } catch (error) {
            console.error('获取网页内容失败:', error);
            return {
                title: '',
                content: '',
            };
        }
    }    /**
     * 使用 Tavily Extract API 获取网页内容
     */
    private async getPageContentWithTavily(url: string): Promise<PageContent> {
        try {
            const apiKey = process.env.TAVILY_API_KEY;
            if (!apiKey) {
                throw new Error('未配置Tavily API密钥');
            }
            
            // 使用 axios 直接调用 Tavily Extract API
            const response = await axios.post('https://api.tavily.com/extract', {
                urls: [url],
                include_raw_content: true,
                api_key: apiKey
            });
            
            if (response.data && response.data.results && response.data.results.length > 0) {
                const result = response.data.results[0];
                return {
                    title: result.title || result.metadata?.title || new URL(url).hostname,
                    content: result.raw_content || ''
                };
            } else {
                throw new Error('Tavily Extract 返回结果为空');
            }
        } catch (error) {
            console.error('Tavily Extract 调用失败:', error);
            throw error;
        }
    }
    
    /**
     * 使用 Playwright 获取网页内容（作为备选方案）
     */
    private async getPageContentWithPlaywright(url: string): Promise<PageContent> {
        const mobileContext = await this.browser.newContext({
            viewport: { width: 375, height: 667 },
            isMobile: true,
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1 Edg/135.0.0.0',
            locale: 'zh-CN',
            timezoneId: 'Asia/Shanghai',
        });
        const page = await mobileContext.newPage();

        
        await page.goto(url);
        await page.waitForTimeout(5000);
            
        try {
            let pageTitle = '';
            try {
                // 尝试使用 page.title() 获取标题
                pageTitle = await page.title();
                
                // 如果标题为空，尝试从 head > title 元素获取
                if (!pageTitle) {
                    try {
                        const titleElement = await page.$('head > title');
                        if (titleElement) {
                            pageTitle = await titleElement.textContent() || '';
                        }
                    } catch (e) {
                        console.log('获取 head > title 失败:', e);
                    }
                }
                
                // 如果仍然没有标题，尝试获取 h1 或其他可能包含标题的元素
                if (!pageTitle) {
                    try {
                        const h1Element = await page.$('h1');
                        if (h1Element) {
                            pageTitle = await h1Element.textContent() || '';
                        }
                    } catch (e) {
                        console.log('获取 h1 失败:', e);
                    }
                }
                
                // 如果所有尝试都失败，使用 URL 的一部分作为默认标题
                if (!pageTitle) {
                    const urlObj = new URL(url);
                    pageTitle = `网页内容 - ${urlObj.hostname}`;
                }
            } catch (titleError) {
                console.error('Error getting page title:', titleError);
                pageTitle = `网页内容 - ${new URL(url).hostname}`;
            }
            const content = await page.content();
            return {
                title: pageTitle,
                content: content,
            };
        } catch (error) {
            console.error('Error in getPageContentWithPlaywright:', error);
            return {
                title: '',
                content: '',
            };
        } finally {
            await page.close();
            await mobileContext.close();
        }
    }    async summarizeUrl(url: string, useTavily: boolean = true): Promise<OpenAICompletion> {
        try {
            // 1. 获取网页内容
            const pageContent = await this.getPageContent(url);
            
            if (!pageContent.content) {
                throw new Error('无法获取网页内容');
            }
            
            // 2. 使用AI进行内容总结
            let summary = '';
            let title = pageContent.title || '';
            let tags: string[] = [];
            
            // 直接使用内部 AI 接口进行总结
            const lighthouseResult = await this.getLighthouseSummary(pageContent.content, url);
            summary = lighthouseResult.summary || '';
            title = lighthouseResult.title || title;
            tags = lighthouseResult.tags || tags;
            
            // 3. 从网页内容中提取图片
            const image = await this.extractImageFromContent(pageContent.content, url);
            
            return {
                summary,
                title,
                tags,
                image
            };
        } catch (error) {
            console.error('总结网页内容失败:', error);
            return {
                summary: '无法生成内容总结',
                title: '内容总结失败',
                tags: [],
                image: ''
            };
        }
    }/**
     * 使用Tavily AI总结网页内容
     */    
    private async getTavilySummary(content: string, url: string): Promise<{ summary: string; title: string; tags: string[] }> {
        try {
            const apiKey = process.env.TAVILY_API_KEY;
            if (!apiKey) {
                throw new Error('未配置Tavily API密钥');
            }
            
            // 限制内容长度，避免请求过大
            const truncatedContent = content.substring(0, 15000);
            
            // 使用 axios 直接调用 Tavily API
            const response = await axios.post('https://api.tavily.com/summarize', {
                content: truncatedContent,
                url: url,
                api_key: apiKey,
                include_tags: true,
            });
            
            return {
                summary: response.data.summary || '',
                title: response.data.title || '',
                tags: response.data.tags || []
            };
        } catch (error) {
            console.error('Tavily API调用失败:', error);
            throw error;
        }
    }
    
    /**
     * 使用Lighthouse总结网页内容
     */
    private async getLighthouseSummary(content: string, url: string): Promise<{ summary: string; title: string; tags: string[] }> {
        try {
            // 使用AiService生成内容总结
            const prompt = `
            请总结以下网页内容，并生成3-5个相关标签。网页URL: ${url}
            内容开始:
            ${content.substring(0, 10000)}
            内容结束

            请按以下JSON格式返回结果：
            {
            "summary": "网页内容的摘要，简明扼要，不超过300字",
            "title": "适合作为标题的文本，不超过30字",
            "tags": ["标签1", "标签2", "标签3"]
            }
            `;
            
            // 使用AiService进行内容总结
            const aiResponse = await this.aiService.generateResponse({
                prompt,
                model: process.env.AI_MODEL || 'deepseek-chat',
                rolePrompt: '你是一个网页内容分析专家，擅长提取网页的关键信息并进行总结。请按照要求提供JSON格式的输出。'
            });
            
            try {
                // 尝试解析返回结果为JSON
                const result = JSON.parse(aiResponse);
                return {
                    summary: result.summary || '',
                    title: result.title || '',
                    tags: result.tags || []
                };
            } catch (jsonError) {
                // 如果返回的不是JSON格式，尝试直接使用返回的文本
                return {
                    summary: aiResponse || '',
                    title: '',
                    tags: []
                };
            }
        } catch (error) {
            console.error('生成内容总结失败:', error);
            return {
                summary: '',
                title: '',
                tags: []
            };
        }
    }
      /**
     * 为总结内容生成配图
     */    private async generateImageForSummary(summary: string, title: string): Promise<string> {
        try {
            // 导入textToImage模块
            const { textToImage } = await import('../../utils/textToImage');
            
            // 使用textToImage工具将摘要转换为图片
            const imageUrl = await textToImage(summary, {
                title: title,
                fontSize: 20,
                lineHeight: 28,
                maxWidth: 1000,
                bgColor: '#f5f5f5',
                textColor: '#333333'
            });
            
            return imageUrl;
        } catch (error) {
            console.error('生成配图失败:', error);
            return '';
        }
    }

    /**
     * 从网页内容中提取图片
     */
    private async extractImageFromContent(content: string, url: string): Promise<string> {
        try {
            // 创建一个DOM解析器来提取图片
            const imgRegex = /<img[^>]+src="([^">]+)"/g;
            const matches = [...content.matchAll(imgRegex)];
            
            // 筛选有效的图片URL
            const imgUrls = matches
                .map(match => match[1])
                .filter(src => {
                    // 过滤掉小图标、数据URI和可能的广告图片
                    return !src.includes('data:image') &&
                           !src.includes('icon') &&
                           !src.includes('logo') &&
                           !src.includes('advertisement') &&
                           !src.includes('ads') &&
                           !src.includes('pixel') &&
                           !src.includes('analytics') &&
                           !src.includes('tracker') &&
                           src.length > 10;
                });
            
            if (imgUrls.length === 0) {
                console.log('未在网页内容中找到合适的图片');
                return '';
            }
            
            // 从可能的URL中选择第一张合适的图片
            let imgUrl = imgUrls[0];
            
            // 如果URL是相对路径，转换为绝对路径
            if (imgUrl.startsWith('/')) {
                const baseUrl = new URL(url);
                imgUrl = `${baseUrl.protocol}//${baseUrl.host}${imgUrl}`;
            } else if (!imgUrl.startsWith('http')) {
                const baseUrl = new URL(url);
                imgUrl = `${baseUrl.protocol}//${baseUrl.host}/${imgUrl}`;
            }
            
            return imgUrl;
        } catch (error) {
            console.error('提取图片失败:', error);
            return '';
        }
    }
}