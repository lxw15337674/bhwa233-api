import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { TavilyService } from './tavily.service';

@Module({
    controllers: [AiController],
    providers: [AiService, TavilyService],
    exports: [AiService, TavilyService],
})
export class AiModule { } 
