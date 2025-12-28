import OpenAI from 'openai';
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AIRequest } from './type';
import { MessageDto } from './dto/summarize.dto';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { marked } from 'marked';
import { summaryTemplate } from './templates/summary.template';
import { existsSync } from 'fs';
import { join } from 'path';

const aiPrompt = process.env.AI_PROMPT ?? '';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            baseURL: process.env.AI_BASE_URL,
            apiKey: process.env.AI_API_KEY,
        });
    }

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

    async generateResponse(
        body: AIRequest
    ): Promise<string> {
        const {
            prompt,
            model = process.env.AI_MODEL ?? 'step-3',
            rolePrompt = aiPrompt,
            searchDescription = '当需要获取实时信息、最新新闻、当前事件或用户询问的信息可能需要最新数据时使用网络搜索',
            enableWebSearch = false // 新增开关，默认为 false
        } = body;

        // 验证 prompt 是否为空
        if (!prompt || prompt.trim() === '') {
            this.logger.error('[AI Service] Empty prompt provided:', { prompt, type: typeof prompt });
            throw new BadRequestException('Prompt cannot be empty');
        }

        // 确保 rolePrompt 不为空
        const systemPrompt = rolePrompt.trim() ??'你是一个AI助手，擅长回答用户的问题。';
        const userPrompt = prompt.trim();

        // 构建消息数组
        const messages = [
            {
                role: "system" as const,
                content: systemPrompt
            },
            {
                role: "user" as const,
                content: userPrompt
            }
        ];

        // 构建请求参数
        const requestParams: any = {
            messages,
            model,
            ...(enableWebSearch && {
                tool_choice: "auto",
                tools: [
                    {
                        type: "web_search",
                        function: {
                            description: searchDescription
                        }
                    }
                ]
            })
        };
        try {
            const completion = await this.openai.chat.completions.create(requestParams);
            console.log(completion.choices[0].message);
            return completion.choices[0].message.content ?? '';
        } catch (error) {
            this.logger.error('[AI Service] Error generating AI response:', error);
            return '获取AI回答失败';
        }
    }

    // 数据预处理
    private preprocessMessages(messages: MessageDto[], selfName?: string): { formatted: string[], stats: Map<string, number> } {
        const stats = new Map<string, number>();
        const formatted = messages
            .filter(m => !selfName || m.sender !== selfName)
            .map(m => {
                stats.set(m.sender, (stats.get(m.sender) || 0) + 1);
                return `[${m.timestamp}] ${m.sender}: ${m.content}`;
            });

        return { formatted, stats };
    }

    // 生成排行榜（HTML 格式）
    private generateRankingHTML(stats: Map<string, number>): string {
        const entries = Array.from(stats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const rankingItems = entries
            .map((entry, i) => {
                const rankClass = i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : '';
                return `
                    <div class="ranking-item">
                        <div class="rank-number ${rankClass}">${i + 1}</div>
                        <div class="rank-info">
                            <span class="rank-name">${entry[0]}</span>
                            <span class="rank-count">${entry[1]} 条消息</span>
                        </div>
                    </div>
                `;
            })
            .join('');

        return `
            <div class="section">
                <h2>🏆 发言排行榜</h2>
                ${rankingItems}
            </div>
        `;
    }

    // AI 总结聊天记录
    async summarizeChatMessages(messages: MessageDto[], selfName?: string, groupName?: string): Promise<string> {
        const { formatted } = this.preprocessMessages(messages, selfName);

        const systemPrompt = `你是一个专业的聊天记录总结助手。请分析聊天记录并输出：

## 📋 概览
简要描述本次聊天的主要内容（2-3 句话）

## 💬 主要话题
- 话题1
- 话题2
- 话题3

## 📝 待办事项
- [ ] 待办1
- [ ] 待办2

要求：
1. 输出 Markdown 格式
2. 简洁专业
3. 中文输出`;

        const chatContent = formatted.join('\n');
        const prompt = groupName
            ? `群名：${groupName}\n\n聊天记录：\n${chatContent}`
            : `聊天记录：\n${chatContent}`;

        return await this.generateResponse({
            prompt,
            rolePrompt: systemPrompt,
            model: process.env.AI_MODEL ?? 'step-3'
        });
    }

    // 将 Markdown 内容转为 HTML section
    private markdownToHTMLSections(markdown: string): string {
        // 分割 Markdown 按 h2 标题
        const sections = markdown.split(/(?=##\s)/);

        return sections
            .filter(section => section.trim())
            .map(section => {
                const html = marked.parse(section);
                return `<div class="section">${html}</div>`;
            })
            .join('');
    }

    // 生成总结图片
    async generateSummaryImage(
        messages: MessageDto[],
        selfName?: string,
        groupName?: string,
        includeRanking: boolean = true
    ): Promise<Buffer> {
        // 数据预处理
        const { stats } = this.preprocessMessages(messages, selfName);

        // AI 总结
        const summary = await this.summarizeChatMessages(messages, selfName, groupName);

        // 生成排行榜 HTML
        const rankingHTML = includeRanking ? this.generateRankingHTML(stats) : '';

        // 将 Markdown 总结转为 HTML
        const contentHTML = this.markdownToHTMLSections(summary);

        // 标题
        const title = groupName ? `${groupName} 聊天总结` : '聊天总结';

        // 生成完整 HTML
        const html = summaryTemplate(title, contentHTML, rankingHTML);

        // 检测是否为本地开发环境
        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

        // 获取 Chrome 可执行路径
        let executablePath: string;
        if (isProduction) {
            executablePath = await chromium.executablePath();
        } else {
            const localChrome = this.findLocalChrome();
            if (!localChrome) {
                throw new Error('无法找到本地 Chrome 安装。请设置环境变量 CHROME_PATH 或安装 Google Chrome');
            }
            executablePath = localChrome;
        }

        // 使用 Puppeteer 渲染
        const browser = await puppeteer.launch({
            args: isProduction ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: {
                width: 600,
                height: 100, // 最小高度，实际会根据内容自动扩展（fullPage: true）
            },
            executablePath,
            headless: true,
        });

        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });

            // 截图
            const screenshot = await page.screenshot({
                type: 'png',
                fullPage: true,
            });

            return screenshot as Buffer;
        } finally {
            await browser.close();
        }
    }
}