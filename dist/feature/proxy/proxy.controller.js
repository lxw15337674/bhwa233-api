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
exports.ProxyController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const proxy_service_1 = require("./proxy.service");
const proxy_request_dto_1 = require("./dto/proxy-request.dto");
let ProxyController = class ProxyController {
    constructor(proxyService) {
        this.proxyService = proxyService;
    }
    async getProxyRequest(query) {
        try {
            query.method = proxy_request_dto_1.HttpMethod.GET;
            const result = await this.proxyService.makeProxyRequest(query);
            return {
                success: true,
                data: result.data,
                status: result.status,
                headers: result.headers,
                contentType: result.contentType,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error.message || '代理请求失败',
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async postProxyRequest(body) {
        try {
            const result = await this.proxyService.makeProxyRequest(body);
            return {
                success: true,
                data: result.data,
                status: result.status,
                headers: result.headers,
                contentType: result.contentType,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error.message || '代理请求失败',
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async streamProxyRequest(query, res) {
        try {
            query.method = proxy_request_dto_1.HttpMethod.GET;
            const result = await this.proxyService.makeProxyRequest(query);
            if (result.contentType) {
                res.setHeader('Content-Type', result.contentType);
            }
            const importantHeaders = ['content-length', 'content-disposition', 'cache-control'];
            importantHeaders.forEach(header => {
                if (result.headers[header]) {
                    res.setHeader(header, result.headers[header]);
                }
            });
            res.status(result.status);
            if (Buffer.isBuffer(result.data)) {
                res.send(result.data);
            }
            else if (typeof result.data === 'string') {
                res.send(result.data);
            }
            else {
                res.json(result.data);
            }
        }
        catch (error) {
            res.status(error.status || 500).json({
                success: false,
                error: error.message || '代理请求失败',
            });
        }
    }
    async healthCheck() {
        return this.proxyService.healthCheck();
    }
};
exports.ProxyController = ProxyController;
__decorate([
    (0, common_1.Get)('request'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET代理请求',
        description: '通过查询参数发送代理请求，适用于简单的GET请求'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'url',
        description: '目标请求URL',
        example: 'https://api.example.com/data',
        required: true,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'origin',
        description: '自定义Origin头部',
        example: 'https://example.com',
        required: false,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'referer',
        description: '自定义Referer头部',
        example: 'https://example.com/page',
        required: false,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'userAgent',
        description: '自定义User-Agent',
        required: false,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'headers',
        description: '额外的请求头（JSON字符串）',
        example: '{"Authorization": "Bearer token"}',
        required: false,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '代理请求成功',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: { type: 'object', description: '目标API返回的数据' },
                status: { type: 'number', example: 200 },
                headers: { type: 'object', description: '目标API返回的响应头' },
                contentType: { type: 'string', example: 'application/json' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '请求参数错误',
        schema: {
            type: 'object',
            properties: {
                error: { type: 'string', example: '无效的URL地址' },
            },
        },
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [proxy_request_dto_1.ProxyRequestDto]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "getProxyRequest", null);
__decorate([
    (0, common_1.Post)('request'),
    (0, swagger_1.ApiOperation)({
        summary: 'POST代理请求',
        description: '通过请求体发送代理请求，支持所有HTTP方法和复杂的请求配置'
    }),
    (0, swagger_1.ApiBody)({
        type: proxy_request_dto_1.ProxyRequestDto,
        description: '代理请求配置',
        examples: {
            get_request: {
                summary: 'GET请求示例',
                value: {
                    url: 'https://api.example.com/data',
                    method: 'GET',
                    origin: 'https://example.com',
                    referer: 'https://example.com/page',
                    headers: '{"Authorization": "Bearer token"}'
                }
            },
            post_request: {
                summary: 'POST请求示例',
                value: {
                    url: 'https://api.example.com/users',
                    method: 'POST',
                    origin: 'https://example.com',
                    referer: 'https://example.com/form',
                    headers: '{"Content-Type": "application/json", "Authorization": "Bearer token"}',
                    body: '{"name": "John Doe", "email": "john@example.com"}'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '代理请求成功',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: { type: 'object', description: '目标API返回的数据' },
                status: { type: 'number', example: 200 },
                headers: { type: 'object', description: '目标API返回的响应头' },
                contentType: { type: 'string', example: 'application/json' },
            },
        },
    }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [proxy_request_dto_1.ProxyRequestDto]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "postProxyRequest", null);
__decorate([
    (0, common_1.Get)('stream'),
    (0, swagger_1.ApiOperation)({
        summary: '流式代理请求',
        description: '代理请求并直接流式返回响应，适用于文件下载、图片等二进制内容'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'url',
        description: '目标请求URL',
        example: 'https://example.com/image.jpg',
        required: true,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'origin',
        description: '自定义Origin头部',
        required: false,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'referer',
        description: '自定义Referer头部',
        required: false,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '流式返回目标资源',
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ transform: true }))),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [proxy_request_dto_1.ProxyRequestDto, Object]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "streamProxyRequest", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: '健康检查' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '服务健康状态',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'ok' },
                timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
                service: { type: 'string', example: 'proxy' },
            },
        },
    }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "healthCheck", null);
exports.ProxyController = ProxyController = __decorate([
    (0, swagger_1.ApiTags)('代理服务'),
    (0, common_1.Controller)('proxy'),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService])
], ProxyController);
//# sourceMappingURL=proxy.controller.js.map