import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('chat')
    async chat(@Body() body: { prompt: string; model?: string }) {
        return this.aiService.generateResponse(body.prompt, body.model);
    }

    @Post('google-chat')
    async googleChat(@Body() body: { prompt: string }) {
        return this.aiService.genGoogleResponse(body.prompt);
    }
}