import OpenAI from 'openai';
import { Injectable, BadRequestException } from '@nestjs/common';
import { AIRequest } from './type';

const aiPrompt = process.env.AI_PROMPT ?? '';

@Injectable()
export class AiService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            baseURL: process.env.AI_BASE_URL,
            apiKey: process.env.AI_API_KEY,
        });
    }    async generateResponse(
        body: AIRequest
    ) {
        console.info('[AI Service] Received request:', JSON.stringify(body, null, 2));
        
        const { prompt, model = process.env.AI_MODEL ?? 'deepseek-chat', rolePrompt = aiPrompt } = body;
        
        // 验证 prompt 是否为空
        if (!prompt || prompt.trim() === '') {
            console.error('[AI Service] Empty prompt provided:', { prompt, type: typeof prompt });
            throw new BadRequestException('Prompt cannot be empty');
        }
        
        // 确保 rolePrompt 不为空
        const systemPrompt = (rolePrompt && rolePrompt.trim()) ? rolePrompt.trim() : '你是一个AI助手，擅长回答用户的问题。';
        const userPrompt = prompt.trim();
        
        console.info(`[AI Service] System prompt: "${systemPrompt.substring(0, 50)}..."`);
        console.info(`[AI Service] User prompt: "${userPrompt.substring(0, 50)}..."`);
        console.info(`[AI Service] Model: "${model}"`);
        
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
        
        console.info('[AI Service] Messages to send:', JSON.stringify(messages, null, 2));
        
        try {
            const startTime = new Date();
            console.info(`[AI Service] OpenAI request started at: ${startTime.toISOString()}`);

            const completion = await this.openai.chat.completions.create({
                messages,
                model,
            });
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            console.info(`[AI Service] OpenAI response completed at: ${endTime.toISOString()}, duration: ${duration}ms`);

            return completion.choices[0].message.content ?? '';
        } catch (error) {
            console.error('[AI Service] Error generating OpenAI response:', error);
            return  '获取AI回答失败';
        }
    }
}