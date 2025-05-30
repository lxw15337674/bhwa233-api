export interface AIRequest {
    prompt: string;
    model?: string;
    rolePrompt: string;
    enableWebSearch?: boolean; // 是否启用联网搜索
}

export interface WebSearchRequest {
    prompt: string;
    model?: string;
    rolePrompt?: string;
}