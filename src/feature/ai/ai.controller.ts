import { Controller, Post, Body, Get, ValidationPipe, UsePipes, BadRequestException, Res } from '@nestjs/common';
import { Response } from 'express';
import { AiService } from './ai.service';
import { AIRequest } from './type';
import { SummarizeRequestDto } from './dto/summarize.dto';
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

    @ApiOperation({
        summary: 'Summarize chat messages and generate image',
        description: 'Analyze chat messages, generate AI summary with ranking, and return as image'
    })
    @ApiBody({ type: SummarizeRequestDto })
    @ApiResponse({
        status: 200,
        description: 'Summary image (JPEG)',
        content: {
            'image/jpeg': {
                schema: {
                    type: 'string',
                    format: 'binary'
                }
            }
        }
    })
    @Post('summarize')
    async summarize(@Body() body: SummarizeRequestDto, @Res() res: Response) {
        const imageBuffer = await this.aiService.generateSummaryImage(
            body.messages,
            body.selfName,
            body.groupName,
            body.includeRanking
        );

        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(imageBuffer);
    }
}