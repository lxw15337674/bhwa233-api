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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const type_1 = require("./type");
const swagger_1 = require("@nestjs/swagger");
let AiController = class AiController {
    constructor(aiService) {
        this.aiService = aiService;
    }
    async get() {
        return 'Hello ai';
    }
    async chat(body) {
        if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim() === '') {
            throw new common_1.BadRequestException('Prompt is required and cannot be empty');
        }
        return this.aiService.generateResponse(body);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Get)(''),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiController.prototype, "get", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Generate AI response from prompt' }),
    (0, swagger_1.ApiBody)({ type: type_1.AIRequest }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns the AI generated response'
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad request - invalid input data'
    }),
    (0, common_1.Post)('chat'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        validateCustomDecorators: true
    })),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [type_1.AIRequest]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "chat", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('AI'),
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map