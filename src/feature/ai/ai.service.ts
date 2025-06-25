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
    ) {
        const { prompt, model = process.env.AI_MODEL ?? 'deepseek-chat', rolePrompt = aiPrompt } = body;
        
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

        try {
            const completion = await this.openai.chat.completions.create({
                messages,
                model,
            });

            return completion.choices[0].message.content ?? '';
        } catch (error) {
            this.logger.error('[AI Service] Error generating OpenAI response:', error);
            return  '获取AI回答失败';
        }
    }
}