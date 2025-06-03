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
        const { prompt, model = process.env.AI_MODEL ?? 'deepseek-chat', rolePrompt = aiPrompt } = body;
        try {
            const startTime = new Date();
            console.info(`[AI Service] OpenAI request started at: ${startTime.toISOString()}`);
            const completion = await this.openai.chat.completions.create({
                messages: [{
                        role: "system", content: rolePrompt || '你是一个AI助手，擅长回答用户的问题。'
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