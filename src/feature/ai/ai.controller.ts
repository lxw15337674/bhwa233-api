import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { AIRequest, WebSearchRequest } from './type';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('chat')
    async chat(@Body() body: AIRequest) {
        return this.aiService.generateResponse(body);
    }

    @Post('search')
    async webSearch(@Body() body: WebSearchRequest) {
        return this.aiService.generateResponseWithWebSearch(body);
    }
}