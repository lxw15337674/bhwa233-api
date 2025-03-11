import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI }  from"@google/generative-ai";
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
    private googleModel: GenerativeModel;

    constructor() {
        this.openai = new OpenAI({
            baseURL: process.env.AI_BASE_URL,
            apiKey: process.env.AI_API_KEY,
        });
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
        this.googleModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }

    async genGoogleResponse(prompt: string) {
        const result = await this.googleModel.generateContent(prompt);
        const text = result.response.text()
        return text;
    }

    async generateResponse(
        body: AIRequest
    ) {
        const { prompt, model = process.env.AI_MODE ?? 'deepseek-chat', rolePrompt = aiPrompt } = body;
        try {
            const completion = await this.openai.chat.completions.create({
                messages: [{
                    role: "system", content: rolePrompt
                },
                {
                    role: "user", content: prompt
                }],
                model,
            });
            return completion.choices[0].message.content ?? '';
        } catch (error) {
            console.error('Error generating response:', error);
            return  '获取AI回答失败';
        }
    }
}