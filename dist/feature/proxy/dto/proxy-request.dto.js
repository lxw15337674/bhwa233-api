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
exports.ProxyRequestDto = exports.HttpMethod = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["GET"] = "GET";
    HttpMethod["POST"] = "POST";
    HttpMethod["PUT"] = "PUT";
    HttpMethod["DELETE"] = "DELETE";
    HttpMethod["PATCH"] = "PATCH";
})(HttpMethod || (exports.HttpMethod = HttpMethod = {}));
class ProxyRequestDto {
    constructor() {
        this.method = HttpMethod.GET;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { url: { required: true, type: () => String, format: "uri" }, method: { required: false, default: HttpMethod.GET, enum: require("./proxy-request.dto").HttpMethod }, origin: { required: false, type: () => String }, referer: { required: false, type: () => String }, userAgent: { required: false, type: () => String }, headers: { required: false, type: () => String }, body: { required: false, type: () => String } };
    }
}
exports.ProxyRequestDto = ProxyRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '目标请求URL',
        example: 'https://api.example.com/data',
        required: true,
    }),
    (0, class_validator_1.IsUrl)({}, { message: '请提供有效的URL地址' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProxyRequestDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'HTTP请求方法',
        enum: HttpMethod,
        example: HttpMethod.GET,
        required: false,
        default: HttpMethod.GET,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(HttpMethod, { message: '请提供有效的HTTP方法' }),
    __metadata("design:type", String)
], ProxyRequestDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '自定义Origin头部',
        example: 'https://example.com',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProxyRequestDto.prototype, "origin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '自定义Referer头部',
        example: 'https://example.com/page',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProxyRequestDto.prototype, "referer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '自定义User-Agent',
        example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProxyRequestDto.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '额外的请求头（JSON字符串）',
        example: '{"Authorization": "Bearer token", "Content-Type": "application/json"}',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProxyRequestDto.prototype, "headers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '请求体数据（JSON字符串）',
        example: '{"key": "value"}',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProxyRequestDto.prototype, "body", void 0);
//# sourceMappingURL=proxy-request.dto.js.map