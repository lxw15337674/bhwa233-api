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
        if (!prompt || prompt.trim() === '') {
            console.error('[AI Service] Empty prompt provided:', { prompt, type: typeof prompt });
            throw new common_1.BadRequestException('Prompt cannot be empty');
        }
        const systemPrompt = (rolePrompt && rolePrompt.trim()) ? rolePrompt.trim() : '你是一个AI助手，擅长回答用户的问题。';
        const userPrompt = prompt.trim();
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
        try {
            const completion = await this.openai.chat.completions.create({
                messages,
                model,
            });
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