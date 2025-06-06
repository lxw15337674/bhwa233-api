"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const openai_1 = require("openai");
const common_1 = require("@nestjs/common");
const aiPrompt = process.env.AI_PROMPT ?? '';
let AiService = class AiService {
    constructor() {
        this.openai = new openai_1.default({
            baseURL: process.env.AI_BASE_URL,
            apiKey: process.env.AI_API_KEY,
        });
    }
    async generateResponse(body) {
        console.info('[AI Service] Received request:', JSON.stringify(body, null, 2));
        const { prompt, model = process.env.AI_MODEL ?? 'deepseek-chat', rolePrompt = aiPrompt } = body;
        if (!prompt || prompt.trim() === '') {
            console.error('[AI Service] Empty prompt provided:', { prompt, type: typeof prompt });
            throw new common_1.BadRequestException('Prompt cannot be empty');
        }
        const systemPrompt = (rolePrompt && rolePrompt.trim()) ? rolePrompt.trim() : '你是一个AI助手，擅长回答用户的问题。';
        const userPrompt = prompt.trim();
        console.info(`[AI Service] System prompt: "${systemPrompt.substring(0, 50)}..."`);
        console.info(`[AI Service] User prompt: "${userPrompt.substring(0, 50)}..."`);
        console.info(`[AI Service] Model: "${model}"`);
        const messages = [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
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
        }
        catch (error) {
            console.error('[AI Service] Error generating OpenAI response:', error);
            return '获取AI回答失败';
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AiService);
//# sourceMappingURL=ai.service.js.map