import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ProxyRequestDto, HttpMethod } from './dto/proxy-request.dto';
import { ProxyServiceResponse } from './interfaces/proxy-response.interface';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  async makeProxyRequest(requestDto: ProxyRequestDto): Promise<ProxyServiceResponse> {
    try {
      // 构建请求配置
      const config: AxiosRequestConfig = {
        method: requestDto.method || HttpMethod.GET,
        url: requestDto.url,
        timeout: 30000, // 30秒超时
        maxRedirects: 5,
        validateStatus: () => true, // 接受所有状态码
      };

      // 构建请求头
      const headers: Record<string, string> = {};

      // 设置基础headers
      if (requestDto.origin) {
        headers['Origin'] = requestDto.origin;
      }

      if (requestDto.referer) {
        headers['Referer'] = requestDto.referer;
      }

      if (requestDto.userAgent) {
        headers['User-Agent'] = requestDto.userAgent;
      } else {
        // 默认User-Agent
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      }

      // 解析额外的headers
      if (requestDto.headers) {
        try {
          const additionalHeaders = JSON.parse(requestDto.headers);
          Object.assign(headers, additionalHeaders);
        } catch (error) {
          this.logger.warn('Failed to parse additional headers:', error);
          throw new HttpException('Invalid headers format', HttpStatus.BAD_REQUEST);
        }
      }

      config.headers = headers;

      // 设置请求体
      if (requestDto.body && ['POST', 'PUT', 'PATCH'].includes(requestDto.method || 'GET')) {
        try {
          config.data = JSON.parse(requestDto.body);
          if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
          }
        } catch (error) {
          // 如果不是JSON，直接使用原始字符串
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

      // 发送请求
      const response: AxiosResponse = await axios(config);

      // 提取响应头
      const responseHeaders: Record<string, string> = {};
      Object.keys(response.headers).forEach(key => {
        const value = response.headers[key];
        if (value !== undefined) {
          responseHeaders[key.toLowerCase()] = String(value);
        }
      });

      // 获取Content-Type
      const contentType = responseHeaders['content-type'] || 'application/octet-stream';

      this.logger.log(`Proxy request completed with status: ${response.status}`);

      return {
        data: response.data,
        status: response.status,
        headers: responseHeaders,
        contentType,
      };

    } catch (error) {
      this.logger.error('Proxy request failed:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // 提取并转换错误响应头
          const errorResponseHeaders: Record<string, string> = {};
          if (error.response.headers) {
            const headers = error.response.headers;
            Object.keys(headers).forEach(key => {
              const value = headers[key];
              if (value !== undefined) {
                errorResponseHeaders[key.toLowerCase()] = String(value);
              }
            });
          }

          // 服务器响应了错误状态码
          return {
            data: error.response.data,
            status: error.response.status,
            headers: errorResponseHeaders,
            contentType: error.response.headers?.['content-type'] as string || 'application/json',
          };
        } else if (error.request) {
          // 请求已发送但没有收到响应
          throw new HttpException('Network error: No response received', HttpStatus.REQUEST_TIMEOUT);
        }
      }

      // 其他错误
      throw new HttpException(`Proxy request failed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'proxy',
    };
  }
} 