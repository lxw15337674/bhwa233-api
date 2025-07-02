"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingMiddleware = void 0;
const common_1 = require("@nestjs/common");
let LoggingMiddleware = class LoggingMiddleware {
    constructor() {
        this.logger = new common_1.Logger('HTTP');
    }
    use(req, res, next) {
        const { method, originalUrl, body, query, params } = req;
        const startTime = Date.now();
        this.logger.log(`[${method}] ${originalUrl} - Request started`);
        const requestData = {
            query: query,
            params: params,
            body: this.sanitizeBody(body)
        };
        if (Object.keys(requestData.query).length > 0 ||
            Object.keys(requestData.params).length > 0 ||
            Object.keys(requestData.body).length > 0) {
            this.logger.log(`[${method}] ${originalUrl} - Request data: ${JSON.stringify(requestData)}`);
        }
        const originalSend = res.send;
        res.send = function (data) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            const logger = new common_1.Logger('HTTP');
            logger.log(`[${method}] ${originalUrl} - Response: ${res.statusCode} - ${duration}ms`);
            try {
                const responseData = typeof data === 'string' ? data : JSON.stringify(data);
                const truncatedData = responseData.length > 1000
                    ? responseData.substring(0, 1000) + '...(truncated)'
                    : responseData;
                logger.log(`[${method}] ${originalUrl} - Response data: ${truncatedData}`);
            }
            catch (error) {
                logger.warn(`[${method}] ${originalUrl} - Failed to log response data`);
            }
            return originalSend.call(this, data);
        };
        next();
    }
    sanitizeBody(body) {
        if (!body || typeof body !== 'object') {
            return body;
        }
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
        const sanitized = { ...body };
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '***';
            }
        });
        return sanitized;
    }
};
exports.LoggingMiddleware = LoggingMiddleware;
exports.LoggingMiddleware = LoggingMiddleware = __decorate([
    (0, common_1.Injectable)()
], LoggingMiddleware);
//# sourceMappingURL=logging.middleware.js.map