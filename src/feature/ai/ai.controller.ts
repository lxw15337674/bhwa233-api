import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { AIRequest } from './type';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('chat')
    async chat(@Body() body: AIRequest) {
        return this.aiService.generateResponse(body);
    }

    @Post('google-chat')
    async googleChat(@Body() body: { prompt: string }) {
        return this.aiService.genGoogleResponse(body.prompt);
    }
}