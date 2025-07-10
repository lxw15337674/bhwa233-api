import { AiService } from './ai.service';
import { AIRequest } from './type';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    get(): unknown;
    chat(body: AIRequest): unknown;
}
