import { AIRequest } from './type';
export interface BookmarkSummary {
    title: string;
    summary: string;
    tags: string[];
    image?: string;
}
export declare class AiService {
    private openai;
    private googleAI;
    constructor();
    genGoogleResponse(prompt: string): Promise<string | undefined>;
    generateResponse(body: AIRequest): Promise<string>;
}
