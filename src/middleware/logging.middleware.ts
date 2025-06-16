import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl, body, query, params } = req;
        const startTime = Date.now();

        // 记录请求信息
        this.logger.log(`[${method}] ${originalUrl} - Request started`);

        // 记录请求参数（过滤敏感信息）
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

        // 拦截响应
        const originalSend = res.send;
        res.send = function (data) {
            const endTime = Date.now();
            const duration = endTime - startTime;

            // 记录响应信息
            const logger = new Logger('HTTP');
            logger.log(`[${method}] ${originalUrl} - Response: ${res.statusCode} - ${duration}ms`);

            // 记录响应数据（限制长度）
            try {
                const responseData = typeof data === 'string' ? data : JSON.stringify(data);
                const truncatedData = responseData.length > 1000
                    ? responseData.substring(0, 1000) + '...(truncated)'
                    : responseData;
                logger.log(`[${method}] ${originalUrl} - Response data: ${truncatedData}`);
            } catch (error) {
                logger.warn(`[${method}] ${originalUrl} - Failed to log response data`);
            }

            return originalSend.call(this, data);
        };

        next();
    }

    private sanitizeBody(body: any): any {
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
} 