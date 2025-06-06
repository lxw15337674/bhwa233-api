import { Controller, Post, Body, Get, ValidationPipe, UsePipes } from '@nestjs/common';
import { AiService } from './ai.service';
import { AIRequest, GoogleChatRequest } from './type';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('AI')
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }


    @Get('')
    async get() {
        return 'Hello ai';
    }    @ApiOperation({ summary: 'Generate AI response from prompt' })
    @ApiBody({ type: AIRequest })
    @ApiResponse({ 
        status: 200, 
        description: 'Returns the AI generated response'
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request - invalid input data'
    })
    @Post('chat')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async chat(@Body() body: AIRequest) {
        return this.aiService.generateResponse(body);
    }
}