import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('chat')
    async chat(@Body() body: { prompt: string; model?: string }) {
        return this.aiService.generateResponse(body.prompt, body.model);
    }

    @Get('page-content')
    async getPageContent(@Query('url') url: string) {
        return this.aiService.getPageContent(url);
    }
}