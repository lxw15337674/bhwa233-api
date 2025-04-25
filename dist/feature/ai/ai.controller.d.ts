import { AiService } from './ai.service';
import { AIRequest, GoogleChatRequest } from './type';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    get(): Promise<string>;
    chat(body: AIRequest): Promise<string>;
    googleChat(body: GoogleChatRequest): Promise<string | undefined>;
}
