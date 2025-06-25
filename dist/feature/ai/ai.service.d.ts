import { AIRequest } from './type';
export declare class AiService {
    private openai;
    constructor();
    generateResponse(body: AIRequest): Promise<string>;
}
