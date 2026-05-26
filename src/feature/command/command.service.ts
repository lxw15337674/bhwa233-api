import { Injectable, Logger } from '@nestjs/common';
import { getCryptoData } from './acions/crypto';
import { holiday } from './acions/fishingTime';
import { getStockData as getStockNewData, getStockDetailData as getStockDetailNewData } from './acions/stock';
import { getHotSpot } from './acions/stockHotSpot';
import { getCNMarketIndexData, getHKMarketIndexData, getStockData, getStockDetailData, getStocksByTag, getAllStockGroups, getUSMarketIndexData } from './acions/stockInfo';
import { getStockSummary } from './acions/stockSummary';
import { getWeiboData } from './acions/weibo';
import { takeRelayPulseScreenshot } from './acions/screenshot';
import { getRandomImage } from './acions/randomImage';
import { generateGeminiImage } from './acions/generateImage';
import { getGoldPrice } from './acions/gold';
import { AiService } from '../ai/ai.service';
import { TavilyService } from '../ai/tavily.service';
import { ScreenshotService } from '../../utils/screenshot.service';
import { HttpService } from '@nestjs/axios';
import { AiSessionCacheService } from './ai-session-cache.service';
import { join } from 'path';
import { readFileSync } from 'fs';
import satori from 'satori';
import sharp from 'sharp';
import React from 'react';
import type OpenAI from 'openai';

export interface CommandParams {
    args?: string,
    key: string,
}

export interface Command {
    key: string;
    description: string;
    type?: 'text' | 'image';
}

@Injectable()
export class CommandService {
    private readonly logger = new Logger(CommandService.name);
    private readonly aiToolCommandKeys = new Set([
        'ss',
        'sus',
        'shk',
        'dp',
        's',
        'sd',
        'sb',
        'sbl',
        'c',
        'cd',
        'b',
        'hot',
        'wb',
        'hy',
    ]);

    constructor(
        private readonly aiService: AiService,
        private readonly tavilyService: TavilyService,
        private readonly screenshotService: ScreenshotService,
        private readonly httpService: HttpService,
        private readonly aiSessionCacheService: AiSessionCacheService,
    ) { }

    private commandMap: {
        key: string,
        callback: (params: CommandParams) => Promise<{ content: string, type: 'text' | 'image' }>,
        msg: string,
        hasArgs: boolean,
        enable?: boolean,
        type?: 'text' | 'image'
    }[] = [
            // AI对话
            {
                key: 'a ',
                callback: async (params) => {
                    const turns = await this.aiSessionCacheService.getTurns();
                    const conversationMessages: OpenAI.ChatCompletionMessageParam[] = turns.flatMap((turn) => ([
                        {
                            role: 'user',
                            content: turn.user,
                        } satisfies OpenAI.ChatCompletionUserMessageParam,
                        {
                            role: 'assistant',
                            content: turn.assistant,
                        } satisfies OpenAI.ChatCompletionAssistantMessageParam,
                    ]));

                    const { tools, toolMap, extraToolMap } = this.getAiCommandTools();
                    const prompt = params?.args ?? '';
                    const response = await this.aiService.generateResponseWithTools(
                        {
                            prompt,
                            rolePrompt: '你是坤哥，你会为用户提供安全，有帮助，准确的回答，不要回答中国政治相关内容，回答控制在200字以内。回答开头是：坤哥告诉你，结尾是：厉不厉害 你鸡哥🐔',
                        },
                        {
                            tools: tools as OpenAI.ChatCompletionTool[],
                            maxToolRounds: 3,
                            conversationMessages,
                            executeTool: async (toolName, args) => {
                                return this.executeAiTool(toolMap, extraToolMap, toolName, args);
                            },
                        }
                    );

                    await this.aiSessionCacheService.appendTurn(prompt, response);

                    return {
                        content: response,
                        type: 'text'
                    };
                },
                msg: 'a [问题] - 获取鸡哥回答 例如: a 你好鸡哥',
                hasArgs: true,
            },
            // 股市相关命令
            {
                key: 'ss',
                callback: async () => {
                    const result = await getCNMarketIndexData();
                    return {
                        content: result || '获取数据失败',
                        type: 'text'
                    };
                },
                msg: 'ss - 获取上证指数信息，包含大盘涨跌幅、成交量等核心数据',
                hasArgs: false,
            },
            {
                key: 'sus',
                callback: async (params: CommandParams) => {
                    const result = await getUSMarketIndexData();
                    return {
                        content: result || '获取美股指数数据失败',
                        type: 'text'
                    };
                },
                msg: 'sus - 获取美股指数信息，包含大盘涨跌幅、成交量等核心数据',
                hasArgs: false,
            },
            {
                key: 'shk',
                callback: async (params: CommandParams) => {
                    const result = await getHKMarketIndexData();
                    return {
                        content: result || '获取港股指数数据失败',
                        type: 'text'
                    };
                },
                msg: 'shk - 获取港股指数信息，包含大盘涨跌幅、成交量等核心数据',
                hasArgs: false,
            },
            {
                key: 's ',
                callback: async (params) => {
                    if (!params.args) {
                        throw new Error('请输入股票代码，例如: s 600519 000858');
                    }
                    const result = await getStockData(params.args);
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 's [股票代码] - 获取股票信息（如现价、涨跌幅、成交额、EPS、PE、PB等）,支持一次查询多只股票 例如: s 600519 000858',
                hasArgs: true,
            },
            {
                key: 'sd ',
                callback: async (params) => {
                    if (!params.args) {
                        throw new Error('请输入股票代码，例如: sd gzmt');
                    }
                    const result = await getStockDetailData(params.args);
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 'sd [股票代码] - 获取股票详细信息（可能包含更细指标）例如: sd gzmt',
                hasArgs: true,
            },
            {
                key: 'sb ',
                callback: async (params: CommandParams) => {
                    if (!params.args) {
                        throw new Error('请输入股票标签，例如: sb 互联网');
                    }
                    const result = await getStocksByTag(params.args);
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 'sb [标签] - 根据标签获取股票分组信息，例如: sb 互联网',
                hasArgs: true,
            },
            {
                key: 'sbl',
                callback: async () => {
                    const result = await getAllStockGroups();
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 'sbl - 显示所有股票分组标签名',
                hasArgs: false,
            },
            {
                key: 'dp',
                callback: async (params: CommandParams) => {
                    const result = await getStockSummary();
                    return {
                        content: result || '获取大盘数据失败',
                        type: 'text'
                    };
                },
                msg: 'dp - 获取大盘市场信息，包括涨跌家数、板块概览等',
                hasArgs: false,
            },
            // 股票、期货、外汇、基金、指数集合
            {
                key: 'c ',
                callback: async (params) => {
                    if (!params.args) {
                        throw new Error('请输入股票代码，例如: c 小米集团');
                    }
                    const result = await getStockNewData(params.args);
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 'c [股票代码] - 获取股票信息 例如: c 小米集团',
                hasArgs: true,
            },
            {
                key: 'cd ',
                callback: async (params) => {
                    if (!params.args) {
                        throw new Error('请输入股票代码，例如: cd 小米集团');
                    }
                    const result = await getStockDetailNewData(params.args);
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 'cd [股票代码] - 获取股票详细信息 例如: cd 小米集团',
                hasArgs: true,
            },
            // 数字货币
            {
                key: 'b ',
                callback: async (params) => {
                    if (!params.args) {
                        throw new Error('请输入数字货币代码，例如: b btc');
                    }
                    const result = await getCryptoData(params.args);
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 'b [货币代码] - 获取数字货币信息 例如: b btc',
                hasArgs: true,
            },
            // 热点资讯
            {
                key: 'hot',
                callback: async (params: CommandParams) => {
                    const result = await getHotSpot();
                    return {
                        content: result || '获取数据失败',
                        type: 'text'
                    };
                },
                msg: 'hot - 获取今日热点概念板块及相关个股',
                hasArgs: false,
            },
            {
                key: 'wb',
                callback: async (params: CommandParams) => {
                    const result = await getWeiboData();
                    return {
                        content: result || '获取微博热搜失败',
                        type: 'text'
                    };
                },
                msg: 'wb - 获取微博热搜',
                hasArgs: false,
            },
            // 其他工具
            {
                key: 'hy',
                callback: async (params: CommandParams) => {
                    const result = await holiday();
                    return {
                        content: result || '获取节假日信息失败',
                        type: 'text'
                    };
                },
                msg: 'hy - 获取节假日信息',
                hasArgs: false,
            },
            {
                key: 'gold',
                callback: async () => {
                    const result = await getGoldPrice();
                    return {
                        content: result || '获取金价失败',
                        type: 'text',
                    };
                },
                msg: 'gold - 获取实时金价',
                hasArgs: false,
            },
            // 网页截图
            {
                key: 'relay',
                callback: async (params: CommandParams) => {
                    try {
                        const args = params.args?.trim().split(/\s+/) || [];
                        const provider = args[0] || '88code';
                        const period = args[1] || '24h';
                        
                        const imageBuffer = await takeRelayPulseScreenshot(
                            this.screenshotService,
                            provider,
                            period
                        );
                        
                        // 将 Buffer 转换为 base64
                        const base64Image = imageBuffer.toString('base64');
                        return {
                            content: `data:image/jpeg;base64,${base64Image}`,
                            type: 'image'
                        };
                    } catch (error) {
                        this.logger.error('截图失败:', error);
                        return {
                            content: '截图失败，请稍后重试',
                            type: 'text'
                        };
                    }
                },
                msg: 'relay [provider] [period] - 获取 RelayPulse 截图，例如: relay 88code 24h',
                hasArgs: true,
            },
            // 随机图片命令
            {
                key: 'img',
                callback: async (params: CommandParams) => {
                    try {
                        return await getRandomImage(this.httpService);
                    } catch (error) {
                        this.logger.error('获取随机图片失败:', error);
                        return {
                            content: '获取随机图片失败，请稍后重试',
                            type: 'text'
                        };
                    }
                },
                msg: 'img - 获取一张随机图片',
                hasArgs: false,
            },
            // 文生图（Gemini）
            {
                key: 'gi ',
                callback: async (params: CommandParams) => {
                    if (!params.args) {
                        throw new Error('请输入文生图描述，例如: gi 夜晚城市霓虹街道');
                    }
                    try {
                        return await generateGeminiImage(this.httpService, params.args);
                    } catch (error) {
                        this.logger.error('文生图失败:', error);
                        return {
                            content: '文生图失败，请稍后重试',
                            type: 'text',
                        };
                    }
                },
                msg: 'gi [描述] - Gemini 文生图，例如: gi 夜晚城市霓虹街道',
                hasArgs: true,
            },
            {
                key: 'hp',
                callback: async (params: CommandParams) => {
                    const commandMsg = this.commandMap
                        .filter(command => command.enable !== false)
                        .map(command => command.msg)
                        .join('\n');

                    const content = `===== 命令帮助 =====\n${commandMsg}\n项目地址：https://github.com/lxw15337674/bhwa233-api`;
                    try {
                        return {
                            content,
                            type: 'text'
                        };
                        // if (params.args === 'text') {
                        //     return {
                        //         content,
                        //         type: 'text'
                        //     };
                        // }
                        // const imageUrl = await textToImage(content, {
                        //     title: '命令帮助',
                        //     fontSize: 16,
                        //     lineHeight: 22
                        // });

                        // return {
                        //     content: imageUrl,
                        //     type: 'image'
                        // };
                    } catch (error) {
                        this.logger.error('Error creating help image:', error);
                        return {
                            content,
                            type: 'text'
                        };
                    }
                },
                msg: 'hp - 获取命令帮助',
                hasArgs: true,
                type: 'image'
            }
        ];

    async executeCommand(msg: string): Promise<{ content: string, type: 'text' | 'image' }> {
        if (!msg || !msg.trim()) {
            return {
                content: '',
                type: 'text'
            };
        }

        for (const command of this.commandMap) {
            const isMatch = command.hasArgs 
                ? msg.startsWith(command.key)
                : msg.trim() === command.key;
                
            if (isMatch) {
                const args = command.hasArgs ? msg.slice(command.key.length).trim() : undefined;
                const result = await command.callback({
                    args,
                    key: command.key,
                });

                this.logger.log(`====================[命令执行开始]====================\n[时间] ${new Date().toLocaleString()}\n[命令] ${command.key}\n[参数] ${args || '无'}\n[结果] ${result.content}\n====================[命令执行结束]====================`)

                return result;
            }
        }
        return {
            content: '',
            type: 'text'
        };
    }

    private getAiCommandTools(): {
        tools: OpenAI.ChatCompletionTool[];
        toolMap: Map<string, (typeof this.commandMap)[number]>;
        extraToolMap: Map<string, (args: unknown) => Promise<string>>;
    } {
        const tools: OpenAI.ChatCompletionTool[] = [];
        const toolMap = new Map<string, (typeof this.commandMap)[number]>();
        const extraToolMap = new Map<string, (args: unknown) => Promise<string>>();

        for (const command of this.commandMap) {
            if (command.enable === false) {
                continue;
            }

            const key = command.key.trim();
            if (!this.aiToolCommandKeys.has(key)) {
                continue;
            }

            const toolName = `cmd_${key}`;
            toolMap.set(toolName, command);

            const parameters = command.hasArgs
                ? {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: '命令参数，对应原命令空格后的文本',
                        },
                    },
                    required: ['query'],
                    additionalProperties: false,
                }
                : {
                    type: 'object',
                    properties: {},
                    additionalProperties: false,
                };

            tools.push({
                type: 'function',
                function: {
                    name: toolName,
                    description: command.msg,
                    parameters,
                },
            });
        }

        const tavilyToolName = 'tavily_search';
        tools.push({
            type: 'function',
            function: {
                name: tavilyToolName,
                description: '搜索互联网最新信息。适合时效性问题、新闻、公告、产品更新和事实核验。',
                parameters: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: '搜索关键词或问题',
                        },
                        maxResults: {
                            type: 'integer',
                            description: '返回结果数量，范围 1-10，默认 5',
                        },
                    },
                    required: ['query'],
                    additionalProperties: false,
                },
            },
        });
        extraToolMap.set(tavilyToolName, async (args: unknown) => {
            const query = typeof (args as { query?: unknown })?.query === 'string'
                ? (args as { query: string }).query.trim()
                : '';
            const maxResults = typeof (args as { maxResults?: unknown })?.maxResults === 'number'
                ? (args as { maxResults: number }).maxResults
                : 5;
            return this.tavilyService.search(query, maxResults);
        });

        return { tools, toolMap, extraToolMap };
    }

    private async executeAiTool(
        toolMap: Map<string, (typeof this.commandMap)[number]>,
        extraToolMap: Map<string, (args: unknown) => Promise<string>>,
        toolName: string,
        args: unknown
    ): Promise<string> {
        const extraToolExecutor = extraToolMap.get(toolName);
        if (extraToolExecutor) {
            return extraToolExecutor(args);
        }

        const command = toolMap.get(toolName);
        if (!command) {
            return `未知工具: ${toolName}`;
        }

        const query = typeof (args as { query?: unknown })?.query === 'string'
            ? (args as { query: string }).query.trim()
            : '';

        if (command.hasArgs && !query) {
            return '缺少 query 参数';
        }

        try {
            const result = await command.callback({
                args: command.hasArgs ? query : undefined,
                key: command.key,
            });

            if (result.type === 'image') {
                return '该命令返回图片，已被禁用';
            }

            this.logger.log(`====================[命令执行开始]====================\n[时间] ${new Date().toLocaleString()}\n[命令] ${command.key}\n[参数] ${query || '无'}\n[结果] ${result.content}\n====================[命令执行结束]====================`);

            return result.content ?? '';
        } catch (error) {
            this.logger.error('AI工具执行失败:', error);
            if (error instanceof Error && error.message) {
                return error.message;
            }
            return '命令执行失败';
        }
    }

    async getCommandList(): Promise<Command[]> {
        const commandMsg = this.commandMap
            .filter(command => command.enable !== false)
            .map(command => ({
                key: command.key,
                description: command.msg,
                type: command.type,
            }));
        return commandMsg;
    }

    async getCommandListImage(): Promise<Buffer> {
        const commandMsg = this.commandMap
            .filter(command => command.enable !== false)
            .map(command => command.msg)
            .join('\n');

        const content = `===== 命令帮助 =====\n${commandMsg}\n\n项目地址：https://github.com/lxw15337674/bhwa233-api`;

        // 读取中文字体
        // 在开发环境下是 src/assets，编译后是 dist/assets
        const fontPath = join(process.cwd(), 'dist', 'assets', 'fonts', 'NotoSansSC-Regular.otf');
        const fontData = readFileSync(fontPath);

        // 将文本按行分割
        const lines = content.split('\n');

        // 配置参数
        const width = 1000;
        const lineHeight = 32;
        const padding = 40;
        const height = Math.max(600, lines.length * lineHeight + padding * 2);

        // 使用 Satori 生成 SVG
        const svg = await satori(
            React.createElement(
                'div',
                {
                    style: {
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        height: '100%',
                        padding: `${padding}px`,
                        backgroundColor: '#2d2d2d',
                        color: '#ffffff',
                        fontFamily: 'Noto Sans SC',
                        fontSize: '20px',
                        lineHeight: '1.6',
                    }
                },
                lines.map((line, index) =>
                    React.createElement(
                        'div',
                        {
                            key: index,
                            style: { marginBottom: '4px' }
                        },
                        line
                    )
                )
            ),
            {
                width,
                height,
                fonts: [
                    {
                        name: 'Noto Sans SC',
                        data: fontData,
                        weight: 400,
                        style: 'normal',
                    },
                ],
            }
        );

        // 使用 Sharp 将 SVG 转为 PNG
        const pngBuffer = await sharp(Buffer.from(svg))
            .png()
            .toBuffer();

        return pngBuffer;
    }

    async getRelayPulseScreenshot(provider: string = '88code', period: string = '24h'): Promise<Buffer> {
        return await takeRelayPulseScreenshot(this.screenshotService, provider, period);
    }
}
