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
exports.AIRequest = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AIRequest {
}
exports.AIRequest = AIRequest;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The prompt text to generate a response for',
        example: 'Tell me about artificial intelligence'
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Prompt cannot be empty' }),
    (0, class_validator_1.IsString)({ message: 'Prompt must be a string' }),
    __metadata("design:type", String)
], AIRequest.prototype, "prompt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Optional AI model to use',
        example: 'deepseek-chat',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Model must be a string' }),
    __metadata("design:type", String)
], AIRequest.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'System role prompt for the AI',
        example: 'You are a helpful assistant',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Role prompt must be a string' }),
    __metadata("design:type", String)
], AIRequest.prototype, "rolePrompt", void 0);
//# sourceMappingURL=type.js.map