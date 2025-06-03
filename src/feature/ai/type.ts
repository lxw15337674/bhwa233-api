import { ApiProperty } from '@nestjs/swagger';

export class AIRequest {
    @ApiProperty({
        description: 'The prompt text to generate a response for',
        example: 'Tell me about artificial intelligence'
    })
    prompt: string;

    @ApiProperty({
        description: 'Optional AI model to use',
        example: 'deepseek-chat',
        required: false
    })
    model?: string;

    @ApiProperty({
        description: 'System role prompt for the AI',
        example: 'You are a helpful assistant'
    })
    rolePrompt: string;
}

export class GoogleChatRequest {
    @ApiProperty({
        description: 'The prompt text to generate a response for',
        example: 'Tell me about artificial intelligence'
    })
    prompt: string;
}