import OpenAI from 'openai';
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AIRequest } from './type';

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

    async generateResponse(
        body: AIRequest
    ): Promise<string> {
        const { 
            prompt, 
            model = process.env.AI_MODEL ?? 'step-2-mini', 
            rolePrompt = aiPrompt,
            enableWebSearch = true,
            searchDescription = '当需要获取实时信息、最新新闻、当前事件或用户询问的信息可能需要最新数据时使用网络搜索'
        } = body;
        
        // 验证 prompt 是否为空
        if (!prompt || prompt.trim() === '') {
            this.logger.error('[AI Service] Empty prompt provided:', { prompt, type: typeof prompt });
            throw new BadRequestException('Prompt cannot be empty');
        }
        
        // 确保 rolePrompt 不为空
        const systemPrompt = (rolePrompt && rolePrompt.trim()) ? rolePrompt.trim() : '你是一个AI助手，擅长回答用户的问题。';
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
        };

        // 如果启用网络搜索，添加 tools 配置
        if (enableWebSearch) {
            requestParams.tools = [
                {
                    type: "web_search",
                    function: {
                        description: searchDescription
                    }
                }
            ];
        }

        try {
            const completion = await this.openai.chat.completions.create(requestParams);
            return completion.choices[0].message.content ?? '';
        } catch (error) {
            this.logger.error('[AI Service] Error generating AI response:', error);
            return '获取AI回答失败';
        }
    }
}