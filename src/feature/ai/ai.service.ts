import OpenAI from 'openai';
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AIRequest } from './type';
import { MessageDto } from './dto/summarize.dto';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import MarkdownIt from 'markdown-it';
import { summaryTemplate } from './templates/summary.template';
import { existsSync } from 'fs';
import { join } from 'path';
const aiPrompt = process.env.AI_PROMPT ?? '';

type ToolExecutor = (toolName: string, args: unknown) => Promise<string>;

interface ToolingOptions {
    tools: OpenAI.ChatCompletionTool[];
    executeTool: ToolExecutor;
    toolChoice?: OpenAI.ChatCompletionToolChoiceOption;
    maxToolRounds?: number;
    conversationMessages?: OpenAI.ChatCompletionMessageParam[];
}

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
            rolePrompt = aiPrompt
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

        try {
            const completion = await this.openai.chat.completions.create({
                messages,
                model,
            });
            console.log(completion.choices[0].message);
            return completion.choices[0].message.content ?? '';
        } catch (error) {
            this.logger.error('[AI Service] Error generating AI response:', error);
            return '获取AI回答失败';
        }
    }

    private safeParseToolArgs(rawArgs: string | undefined): Record<string, unknown> {
        if (!rawArgs) {
            return {};
        }
        try {
            const parsed = JSON.parse(rawArgs);
            if (parsed && typeof parsed === 'object') {
                return parsed as Record<string, unknown>;
            }
        } catch (error) {
            this.logger.warn('[AI Service] Failed to parse tool args', error);
        }
        return {};
    }

    async generateResponseWithTools(
        body: AIRequest,
        tooling: ToolingOptions
    ): Promise<string> {
        const {
            prompt,
            model = process.env.AI_MODEL ?? 'step-3',
            rolePrompt = aiPrompt,
        } = body;

        if (!prompt || prompt.trim() === '') {
            this.logger.error('[AI Service] Empty prompt provided:', { prompt, type: typeof prompt });
            throw new BadRequestException('Prompt cannot be empty');
        }

        const systemPrompt = rolePrompt.trim() ?? '你是一个AI助手，擅长回答用户的问题。';
        const userPrompt = prompt.trim();

        const messages: OpenAI.ChatCompletionMessageParam[] = [
            {
                role: 'system',
                content: systemPrompt,
            },
            ...(tooling.conversationMessages ?? []),
            {
                role: 'user',
                content: userPrompt,
            },
        ];

        const maxRounds = tooling.maxToolRounds ?? 3;
        let lastToolResult = '';
        const startedAt = Date.now();
        let toolRounds = 0;
        let toolCallsCount = 0;
        const toolNames = new Set<string>();
        let usedTools = false;

        const logToolingSummary = (extra?: { errorMessage?: string; endedByMaxRounds?: boolean }) => {
            const durationMs = Date.now() - startedAt;
            const payload = {
                model,
                usedTools,
                toolCallsCount,
                toolRounds,
                toolNames: Array.from(toolNames),
                durationMs,
                ...(extra ?? {}),
            };
            this.logger.log(`[AI Tools] ${JSON.stringify(payload)}`);
        };

        try {
            for (let round = 0; round < maxRounds; round += 1) {
                const requestPayload = {
                    messages,
                    model,
                    tools: tooling.tools,
                    tool_choice: tooling.toolChoice ?? 'auto',
                    stream: false,
                    thinking: {
                        type: 'disabled',
                    },
                    extra_body: {
                        thinking: {
                            type: 'disabled',
                        },
                    },
                } as OpenAI.ChatCompletionCreateParamsNonStreaming & {
                    thinking?: {
                        type?: string;
                    };
                    extra_body?: {
                        thinking?: {
                            type?: string;
                        };
                    };
                };

                const completion = await this.openai.chat.completions.create(requestPayload);

                const message = completion.choices[0]?.message;
                if (!message) {
                    logToolingSummary();
                    return lastToolResult || '';
                }

                if (!message.tool_calls || message.tool_calls.length === 0) {
                    logToolingSummary();
                    return message.content ?? '';
                }

                toolRounds += 1;
                usedTools = true;
                toolCallsCount += message.tool_calls.length;

                const assistantMessage: OpenAI.ChatCompletionMessageParam = {
                    role: 'assistant',
                    content: message.content ?? null,
                    tool_calls: message.tool_calls,
                };
                const reasoningContent = (message as { reasoning_content?: unknown }).reasoning_content;
                (assistantMessage as { reasoning_content?: string }).reasoning_content =
                    typeof reasoningContent === 'string' && reasoningContent.length > 0 ? reasoningContent : ' ';
                messages.push(assistantMessage);

                for (const toolCall of message.tool_calls) {
                    const toolName = toolCall.function?.name;
                    if (!toolName) {
                        continue;
                    }
                    toolNames.add(toolName);
                    const args = this.safeParseToolArgs(toolCall.function.arguments);
                    try {
                        const startedAt = Date.now();
                        this.logger.log('[AI Service] Tool call start', {
                            toolName,
                            args,
                        });
                        const toolResult = await tooling.executeTool(toolName, args);
                        const durationMs = Date.now() - startedAt;
                        this.logger.log('[AI Service] Tool call success', {
                            toolName,
                            durationMs,
                            resultPreview: typeof toolResult === 'string'
                                ? toolResult.slice(0, 200)
                                : '',
                        });
                        lastToolResult = toolResult;
                        const toolMessage: OpenAI.ChatCompletionMessageParam = {
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: toolResult,
                        };
                        if (toolName.startsWith('$')) {
                            (toolMessage as { name?: string }).name = toolName;
                        }
                        messages.push(toolMessage);
                    } catch (error) {
                        this.logger.error('[AI Service] Tool execution failed:', error);
                        const errorToolMessage: OpenAI.ChatCompletionMessageParam = {
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: '工具执行失败，请稍后重试。',
                        };
                        if (toolName.startsWith('$')) {
                            (errorToolMessage as { name?: string }).name = toolName;
                        }
                        messages.push(errorToolMessage);
                    }
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logToolingSummary({ errorMessage });
            throw error;
        }

        logToolingSummary({ endedByMaxRounds: true });
        return lastToolResult || '未能生成最终回答，请稍后重试。';
    }

    // AI 总结聊天记录
    async summarizeChatMessages(messages: MessageDto[], selfName?: string, groupName?: string): Promise<string> {
        // 过滤消息并格式化
        const formatted = messages
            .filter(m => !selfName || m.sender !== selfName)
            .map(m => `[${m.timestamp}] ${m.sender}: ${m.content}`);

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

    // 生成总结图片
    async generateSummaryImage(
        messages: MessageDto[],
        selfName?: string,
        groupName?: string,
        includeRanking: boolean = true
    ): Promise<Buffer> {
        // 1. 过滤消息 + 统计发言数（内联）
        const stats = new Map<string, number>();
        messages
            .filter(m => !selfName || m.sender !== selfName)
            .forEach(m => stats.set(m.sender, (stats.get(m.sender) || 0) + 1));

        // 2. AI 总结
        const summary = await this.summarizeChatMessages(messages, selfName, groupName);

        // 3. Markdown 转 HTML（简化内联）
        const md = new MarkdownIt();
        const contentHTML = summary
            .split(/(?=##\s)/)
            .filter(s => s.trim())
            .map(s => `<div class="section">${md.render(s)}</div>`)
            .join('');

        // 4. 生成排行榜 HTML（内联）
        let rankingHTML = '';
        if (includeRanking) {
            const rankingItems = Array.from(stats.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
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

            rankingHTML = `
                <div class="section">
                    <h2>🏆 发言排行榜</h2>
                    ${rankingItems}
                </div>
            `;
        }

        // 5. 生成完整 HTML
        const title = groupName ? `${groupName} 聊天总结` : '聊天总结';
        const html = summaryTemplate(title, contentHTML, rankingHTML);

        // 6. 获取 Chrome 路径
        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
        const executablePath = isProduction
            ? await chromium.executablePath()
            : (() => {
                const localChrome = this.findLocalChrome();
                if (!localChrome) {
                    throw new Error('无法找到本地 Chrome 安装。请设置环境变量 CHROME_PATH 或安装 Google Chrome');
                }
                return localChrome;
            })();

        // 7. Puppeteer 渲染（优化等待策略）
        const browser = await puppeteer.launch({
            args: isProduction ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: {
                width: 600,
                height: 100,
            },
            executablePath,
            headless: true,
        });

        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' }); // 等待字体加载完成

            const screenshot = await page.screenshot({
                type: 'jpeg',
                quality: 85,
                fullPage: true,
            });

            return screenshot as Buffer;
        } finally {
            await browser.close();
        }
    }
}
