import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';
import { AIRequest, WebSearchRequest } from './type';

const aiPrompt = process.env.AI_PROMPT ?? '';

@Injectable()
export class AiService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            baseURL: process.env.AI_BASE_URL,
            apiKey: process.env.AI_API_KEY,
        });
    }

    async generateResponse(
        body: AIRequest
    ) {
        const { prompt, model = process.env.AI_MODEL ?? 'deepseek-chat', rolePrompt = aiPrompt, enableWebSearch = false } = body;        
        
        if (enableWebSearch) {
            return this.generateResponseWithWebSearch({ prompt, model, rolePrompt });
        }
        
        try {
            const startTime = new Date();
            console.info(`[AI Service] OpenAI request started at: ${startTime.toISOString()}`);

            const completion = await this.openai.chat.completions.create({
                messages: [{
                    role: "system", content: rolePrompt|| '你是一个AI助手，擅长回答用户的问题。'
                },
                {
                    role: "user", content: prompt
                }],
                model,
            });
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            console.info(`[AI Service] OpenAI response completed at: ${endTime.toISOString()}, duration: ${duration}ms`);

            return completion.choices[0].message.content ?? '';
        } catch (error) {
            console.error('[AI Service] Error generating OpenAI response:', error);
            return  '获取AI回答失败';
        }
    }

    /**
     * 使用联网搜索功能生成回复
     */    async generateResponseWithWebSearch(body: WebSearchRequest) {
        const { prompt, model = 'moonshot-v1-auto', rolePrompt = '你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。' } = body;

        try {
            const messages: any[] = [
                { role: "system", content: rolePrompt },
                { role: "user", content: prompt }
            ];

            let finishReason = null;
            let finalResponse = '';

            while (finishReason === null || finishReason === "tool_calls") {                const completion = await this.openai.chat.completions.create({
                    model,
                    messages: messages,
                    temperature: 0.3,
                    tools: [
                        {
                            type: "function" as any, // 使用 any 来绕过 TypeScript 类型检查
                            function: {
                                name: "$web_search",
                            },
                        }
                    ]
                } as any); // 使用 any 来处理 builtin_function 类型

                const choice = completion.choices[0];
                finishReason = choice.finish_reason;
                
                console.log('[AI Service] Choice:', choice);
                console.log('[AI Service] Finish reason:', finishReason);

                if (finishReason === "tool_calls" && choice.message.tool_calls) {
                    // 添加助手消息到上下文
                    messages.push(choice.message);
                    
                    // 处理工具调用
                    for (const toolCall of choice.message.tool_calls) {
                        const toolCallName = toolCall.function.name;
                        const toolCallArguments = JSON.parse(toolCall.function.arguments);
                        
                        let toolResult;                        if (toolCallName === "$web_search") {
                            console.log('[AI Service] Executing $web_search');
                            // 对于 Moonshot 的内置搜索，直接返回参数
                            toolResult = this.handleWebSearch(toolCallArguments);
                            
                            console.log('[AI Service] toolCall.id:', toolCall.id);
                            console.log('[AI Service] tool_call_name:', toolCallName);
                            console.log('[AI Service] tool_result:', toolResult);
                        } else {
                            toolResult = 'no tool found';
                        }
                        
                        // 添加工具调用结果到消息
                        messages.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            name: toolCallName,
                            content: JSON.stringify(toolResult),
                        });
                    }
                } else {
                    finalResponse = choice.message.content ?? '';
                    
                    // 记录最终的 token 消耗
                    const usage = completion.usage;
                    if (usage) {
                        console.info(`[AI Service] Final usage - prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens}, total: ${usage.total_tokens}`);
                    }
                }
                
                console.log('[AI Service] Current response:', choice.message.content);
            }

            return finalResponse;
        } catch (error) {
            console.error('[AI Service] Error in web search response:', error);
            return '联网搜索功能暂时不可用，请稍后重试。';
        }    }

    /**
     * 处理 Moonshot 内置联网搜索工具调用
     */
    private handleWebSearch(args: any): any {
        // 对于 Moonshot 的内置 $web_search，直接返回参数即可
        // Moonshot 会在内部执行实际的搜索和网页抓取
        console.log('[AI Service] Handling Moonshot web search with args:', args);
        return args;
    }
}