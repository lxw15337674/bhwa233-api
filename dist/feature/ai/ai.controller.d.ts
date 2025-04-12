import { AiService } from './ai.service';
import { AIRequest, GoogleChatRequest } from './type';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    chat(body: AIRequest): Promise<string>;
    googleChat(body: GoogleChatRequest): Promise<string | undefined>;
}
