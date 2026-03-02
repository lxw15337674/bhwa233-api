import { CommandService } from './command.service';
import { AiService } from '../ai/ai.service';
import { TavilyService } from '../ai/tavily.service';
import { ScreenshotService } from '../../utils/screenshot.service';
import { HttpService } from '@nestjs/axios';
import { AiSessionCacheService } from './ai-session-cache.service';

describe('CommandService (a command + Tavily)', () => {
  let service: CommandService;
  let aiService: { generateResponseWithTools: jest.Mock };
  let tavilyService: { search: jest.Mock };
  let aiSessionCacheService: { getTurns: jest.Mock; appendTurn: jest.Mock };

  beforeEach(() => {
    aiService = {
      generateResponseWithTools: jest.fn(),
    };
    tavilyService = {
      search: jest.fn(),
    };
    aiSessionCacheService = {
      getTurns: jest.fn().mockResolvedValue([]),
      appendTurn: jest.fn().mockResolvedValue(undefined),
    };

    service = new CommandService(
      aiService as unknown as AiService,
      tavilyService as unknown as TavilyService,
      {} as ScreenshotService,
      {} as HttpService,
      aiSessionCacheService as unknown as AiSessionCacheService,
    );
  });

  it('should include tavily_search tool and route execution to TavilyService', async () => {
    tavilyService.search.mockResolvedValue('tavily result');

    aiService.generateResponseWithTools.mockImplementation(async (_body, tooling) => {
      const hasTavilyTool = tooling.tools.some(
        (tool: { type: string; function?: { name?: string } }) =>
          tool.type === 'function' && tool.function?.name === 'tavily_search',
      );
      expect(hasTavilyTool).toBe(true);

      const toolResult = await tooling.executeTool('tavily_search', {
        query: 'latest ai news',
        maxResults: 3,
      });
      expect(toolResult).toBe('tavily result');
      return 'final answer';
    });

    const result = await service.executeCommand('a 今天 AI 有什么新消息');

    expect(result).toEqual({ content: 'final answer', type: 'text' });
    expect(tavilyService.search).toHaveBeenCalledWith('latest ai news', 3);
    expect(aiSessionCacheService.appendTurn).toHaveBeenCalledWith(
      '今天 AI 有什么新消息',
      'final answer',
    );
  });

  it('should pass cached turns into conversationMessages', async () => {
    aiSessionCacheService.getTurns.mockResolvedValue([
      { user: '你好', assistant: '你好呀', timestamp: Date.now() - 1000 },
      { user: '今天天气', assistant: '晴天', timestamp: Date.now() - 500 },
    ]);

    aiService.generateResponseWithTools.mockImplementation(async (_body, tooling) => {
      expect(tooling.conversationMessages).toEqual([
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '你好呀' },
        { role: 'user', content: '今天天气' },
        { role: 'assistant', content: '晴天' },
      ]);
      return 'ok';
    });

    await service.executeCommand('a 继续聊');
  });
});
