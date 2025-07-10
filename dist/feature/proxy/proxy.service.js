"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ProxyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const proxy_request_dto_1 = require("./dto/proxy-request.dto");
let ProxyService = ProxyService_1 = class ProxyService {
    constructor() {
        this.logger = new common_1.Logger(ProxyService_1.name);
    }
    async makeProxyRequest(requestDto) {
        try {
            const config = {
                method: requestDto.method || proxy_request_dto_1.HttpMethod.GET,
                url: requestDto.url,
                timeout: 30000,
                maxRedirects: 5,
                validateStatus: () => true,
            };
            const headers = {};
            if (requestDto.origin) {
                headers['Origin'] = requestDto.origin;
            }
            if (requestDto.referer) {
                headers['Referer'] = requestDto.referer;
            }
            if (requestDto.userAgent) {
                headers['User-Agent'] = requestDto.userAgent;
            }
            else {
                headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            }
            if (requestDto.headers) {
                try {
                    const additionalHeaders = JSON.parse(requestDto.headers);
                    Object.assign(headers, additionalHeaders);
                }
                catch (error) {
                    this.logger.warn('Failed to parse additional headers:', error);
                    throw new common_1.HttpException('Invalid headers format', common_1.HttpStatus.BAD_REQUEST);
                }
            }
            config.headers = headers;
            if (requestDto.body && ['POST', 'PUT', 'PATCH'].includes(requestDto.method || 'GET')) {
                try {
                    config.data = JSON.parse(requestDto.body);
                    if (!headers['Content-Type']) {
                        headers['Content-Type'] = 'application/json';
                    }
                }
                catch (error) {
                    config.data = requestDto.body;
                    if (!headers['Content-Type']) {
                        headers['Content-Type'] = 'text/plain';
                    }
                }
            }
            this.logger.log(`Making proxy request to: ${requestDto.url}`);
            this.logger.debug(`Request config:`, {
                method: config.method,
                url: config.url,
                headers: config.headers
            });
            const response = await (0, axios_1.default)(config);
            const responseHeaders = {};
            Object.keys(response.headers).forEach(key => {
                const value = response.headers[key];
                if (value !== undefined) {
                    responseHeaders[key.toLowerCase()] = String(value);
                }
            });
            const contentType = responseHeaders['content-type'] || 'application/octet-stream';
            this.logger.log(`Proxy request completed with status: ${response.status}`);
            return {
                data: response.data,
                status: response.status,
                headers: responseHeaders,
                contentType,
            };
        }
        catch (error) {
            this.logger.error('Proxy request failed:', error);
            if (axios_1.default.isAxiosError(error)) {
                if (error.response) {
                    const errorResponseHeaders = {};
                    if (error.response.headers) {
                        const headers = error.response.headers;
                        Object.keys(headers).forEach(key => {
                            const value = headers[key];
                            if (value !== undefined) {
                                errorResponseHeaders[key.toLowerCase()] = String(value);
                            }
                        });
                    }
                    return {
                        data: error.response.data,
                        status: error.response.status,
                        headers: errorResponseHeaders,
                        contentType: error.response.headers?.['content-type'] || 'application/json',
                    };
                }
                else if (error.request) {
                    throw new common_1.HttpException('Network error: No response received', common_1.HttpStatus.REQUEST_TIMEOUT);
                }
            }
            throw new common_1.HttpException(`Proxy request failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async healthCheck() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'proxy',
        };
    }
};
exports.ProxyService = ProxyService;
exports.ProxyService = ProxyService = ProxyService_1 = __decorate([
    (0, common_1.Injectable)()
], ProxyService);
//# sourceMappingURL=proxy.service.js.map