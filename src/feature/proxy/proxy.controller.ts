import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Body, 
  ValidationPipe, 
  HttpException, 
  HttpStatus,
  Res 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from './proxy.service';
import { ProxyRequestDto, HttpMethod } from './dto/proxy-request.dto';
import { ProxyResponse } from './interfaces/proxy-response.interface';

@ApiTags('代理服务')
@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('request')
  @ApiOperation({
    summary: 'GET代理请求',
    description: '通过查询参数发送代理请求，适用于简单的GET请求'
  })
  @ApiQuery({
    name: 'url',
    description: '目标请求URL',
    example: 'https://api.example.com/data',
    required: true,
  })
  @ApiQuery({
    name: 'origin',
    description: '自定义Origin头部',
    example: 'https://example.com',
    required: false,
  })
  @ApiQuery({
    name: 'referer',
    description: '自定义Referer头部',
    example: 'https://example.com/page',
    required: false,
  })
  @ApiQuery({
    name: 'userAgent',
    description: '自定义User-Agent',
    required: false,
  })
  @ApiQuery({
    name: 'headers',
    description: '额外的请求头（JSON字符串）',
    example: '{"Authorization": "Bearer token"}',
    required: false,
  })
  @ApiResponse({
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
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: '无效的URL地址' },
      },
    },
  })
  async getProxyRequest(
    @Query(new ValidationPipe({ transform: true })) query: ProxyRequestDto,
  ): Promise<ProxyResponse> {
    try {
      // 确保是GET请求
      query.method = HttpMethod.GET;
      
      const result = await this.proxyService.makeProxyRequest(query);
      
      return {
        success: true,
        data: result.data,
        status: result.status,
        headers: result.headers,
        contentType: result.contentType,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message || '代理请求失败',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('request')
  @ApiOperation({
    summary: 'POST代理请求',
    description: '通过请求体发送代理请求，支持所有HTTP方法和复杂的请求配置'
  })
  @ApiBody({
    type: ProxyRequestDto,
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
  })
  @ApiResponse({
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
  })
  async postProxyRequest(
    @Body(new ValidationPipe({ transform: true })) body: ProxyRequestDto,
  ): Promise<ProxyResponse> {
    try {
      const result = await this.proxyService.makeProxyRequest(body);
      
      return {
        success: true,
        data: result.data,
        status: result.status,
        headers: result.headers,
        contentType: result.contentType,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message || '代理请求失败',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stream')
  @ApiOperation({
    summary: '流式代理请求',
    description: '代理请求并直接流式返回响应，适用于文件下载、图片等二进制内容'
  })
  @ApiQuery({
    name: 'url',
    description: '目标请求URL',
    example: 'https://example.com/image.jpg',
    required: true,
  })
  @ApiQuery({
    name: 'origin',
    description: '自定义Origin头部',
    required: false,
  })
  @ApiQuery({
    name: 'referer',
    description: '自定义Referer头部',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: '流式返回目标资源',
  })
  async streamProxyRequest(
    @Query(new ValidationPipe({ transform: true })) query: ProxyRequestDto,
    @Res() res: Response,
  ) {
    try {
      // 确保是GET请求
      query.method = HttpMethod.GET;
      
      const result = await this.proxyService.makeProxyRequest(query);
      
      // 设置响应头
      if (result.contentType) {
        res.setHeader('Content-Type', result.contentType);
      }
      
      // 复制其他重要的响应头
      const importantHeaders = ['content-length', 'content-disposition', 'cache-control'];
      importantHeaders.forEach(header => {
        if (result.headers[header]) {
          res.setHeader(header, result.headers[header]);
        }
      });
      
      res.status(result.status);
      
      // 直接返回数据
      if (Buffer.isBuffer(result.data)) {
        res.send(result.data);
      } else if (typeof result.data === 'string') {
        res.send(result.data);
      } else {
        res.json(result.data);
      }
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        error: error.message || '代理请求失败',
      });
    }
  }

  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  @ApiResponse({
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
  })
  async healthCheck() {
    return this.proxyService.healthCheck();
  }
} 