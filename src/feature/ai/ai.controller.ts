import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

interface SummarizeBookmarkDto {
    url: string;
    existingTags: string[];
}

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Get('chat')
    async chat(@Query('prompt') prompt: string) {
        return this.aiService.generateResponse(prompt);
    }

    @Get('page-content')
    async getPageContent(@Query('url') url: string) {
        return this.aiService.getPageContent(url);
    }
} 