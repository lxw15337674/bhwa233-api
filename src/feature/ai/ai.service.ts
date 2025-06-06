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
    }

    async generateResponse(
        body: AIRequest
    ) {
        const { prompt, model = process.env.AI_MODEL ?? 'deepseek-chat', rolePrompt = aiPrompt } = body;
        
        // 验证 prompt 是否为空
        if (!prompt || prompt.trim() === '') {
            console.error('[AI Service] Empty prompt provided');
            throw new BadRequestException('Prompt cannot be empty');
        }
        
        try {
            const startTime = new Date();
            console.info(`[AI Service] OpenAI request started at: ${startTime.toISOString()}`);

            const completion = await this.openai.chat.completions.create({
                messages: [{
                    role: "system", content: rolePrompt|| '你是一个AI助手，擅长回答用户的问题。'
                },
                {
                    role: "user", content: prompt
                }],
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