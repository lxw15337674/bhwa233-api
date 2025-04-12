import { Controller, Post, Body, Get } from '@nestjs/common';
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
    }

    @ApiOperation({ summary: 'Generate AI response from prompt' })
    @ApiBody({ type: AIRequest })
    @ApiResponse({ 
        status: 200, 
        description: 'Returns the AI generated response'
    })
    @Post('chat')
    async chat(@Body() body: AIRequest) {
        return this.aiService.generateResponse(body);
    }

    @ApiOperation({ summary: 'Generate Google AI response' })
    @ApiBody({ type: GoogleChatRequest })
    @ApiResponse({ 
        status: 200, 
        description: 'Returns the Google AI generated response'
    })
    @Post('google-chat')
    async googleChat(@Body() body: GoogleChatRequest) {
        return this.aiService.genGoogleResponse(body.prompt);
    }
}