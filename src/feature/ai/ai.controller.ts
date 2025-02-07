import { Controller, Get, Query} from '@nestjs/common';
import { AiService } from './ai.service';


@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Get('chat')
    async chat(@Query('prompt') prompt: string, @Query('model') model: string) {
        return this.aiService.generateResponse(prompt, model);
    }

    @Get('page-content')
    async getPageContent(@Query('url') url: string) {
        return this.aiService.getPageContent(url);
    }
}