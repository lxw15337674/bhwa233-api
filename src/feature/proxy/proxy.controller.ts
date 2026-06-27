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

  private throwRequestEndpointDisabled(): never {
    throw new HttpException(
      {
        success: false,
        error: 'Proxy request API has been disabled',
      },
      HttpStatus.GONE,
    );
  }

  @Get('request')
  @ApiOperation({
    summary: 'GET代理请求',
    description: '该接口已停用'
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
    status: 410,
    description: '接口已停用',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string', example: 'Proxy request API has been disabled' },
      },
    },
  })
  async getProxyRequest(
    @Query(new ValidationPipe({ transform: true })) query: ProxyRequestDto,
  ): Promise<ProxyResponse> {
    query.method = HttpMethod.GET;
    this.throwRequestEndpointDisabled();
  }

  @Post('request')
  @ApiOperation({
    summary: 'POST代理请求',
    description: '该接口已停用'
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
    status: 410,
    description: '接口已停用',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string', example: 'Proxy request API has been disabled' },
      },
    },
  })
  async postProxyRequest(
    @Body(new ValidationPipe({ transform: true })) body: ProxyRequestDto,
  ): Promise<ProxyResponse> {
    void body;
    this.throwRequestEndpointDisabled();
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
