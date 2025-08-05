export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
}
export interface AIResponse {
    content: string;
    searchResults?: SearchResult[];
    usedWebSearch?: boolean;
}
export declare class AIRequest {
    prompt: string;
    model?: string;
    rolePrompt?: string;
    enableWebSearch?: boolean;
    searchDescription?: string;
}
