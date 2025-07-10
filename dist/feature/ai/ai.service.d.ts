import { AIRequest } from './type';
export declare class AiService {
    private readonly logger;
    private openai;
    constructor();
    generateResponse(body: AIRequest): unknown;
}
