import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from "@google/genai";
import { AIRequest } from './type';

const aiPrompt = process.env.AI_PROMPT ?? '';

export interface BookmarkSummary {
    title: string;
    summary: string;
    tags: string[];
    image?: string;
}

@Injectable()
export class AiService {
    private openai: OpenAI;
    private googleAI: GoogleGenAI;

    constructor() {
        this.openai = new OpenAI({
            baseURL: process.env.AI_BASE_URL,
            apiKey: process.env.AI_API_KEY,
        });
        this.googleAI = new GoogleGenAI({
            apiKey: process.env.GOOGLE_API_KEY
        });
    }

    async genGoogleResponse(prompt: string) {
        try {
            const startTime = new Date();
            console.info(`[AI Service] Google AI request started at: ${startTime.toISOString()}`);

            const options = {
                model: 'gemini-2.5-flash-preview-04-17',
                contents: prompt,
            };

            const response = await this.googleAI.models.generateContent(options);

            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            console.info(`[AI Service] Google AI response completed duration: ${duration}ms`);

            return response.text;
        } catch (error) {
            console.error('[AI Service] Error generating Google AI response:', error);
            return '获取Google AI回答失败';
        }
    }

    async generateResponse(
        body: AIRequest
    ) {
        const { prompt, model = process.env.AI_MODE ?? 'deepseek-chat', rolePrompt = aiPrompt } = body;
        try {
            const startTime = new Date();
            console.info(`[AI Service] OpenAI request started at: ${startTime.toISOString()}`);

            const completion = await this.openai.chat.completions.create({
                messages: [{
                    role: "system", content: rolePrompt
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