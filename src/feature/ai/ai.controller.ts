import { Controller, Post, Body, Get, ValidationPipe, UsePipes, BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';
import { AIRequest } from './type';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('AI')
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }
    @Get('')
    async get() {
        return 'Hello ai';
    }    @ApiOperation({ 
        summary: 'Generate AI response with integrated web search',
        description: 'Generate AI response with built-in internet search capability for real-time information. Web search is enabled by default and can be optionally disabled.'
    })
    @ApiBody({ type: AIRequest })
    @ApiResponse({ 
        status: 200, 
        description: 'AI response content',
        type: String
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request - invalid input data'
    })
    @Post('chat')
    @UsePipes(new ValidationPipe({ 
        whitelist: true, 
        forbidNonWhitelisted: true,
        transform: true,
        validateCustomDecorators: true
    }))
    async chat(@Body() body: AIRequest): Promise<string> {
        return this.aiService.generateResponse(body);
    }
}