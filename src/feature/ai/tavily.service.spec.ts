import { TavilyService } from './tavily.service';

describe('TavilyService', () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.TAVILY_API_KEY;
  let service: TavilyService;

  beforeEach(() => {
    service = new TavilyService();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    process.env.TAVILY_API_KEY = originalApiKey;
    global.fetch = originalFetch;
  });

  it('should return config error when TAVILY_API_KEY is missing', async () => {
    delete process.env.TAVILY_API_KEY;
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const result = await service.search('openai');

    expect(result).toBe('TAVILY_API_KEY 未配置');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should format answer and results on success', async () => {
    process.env.TAVILY_API_KEY = 'test-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        answer: '这是答案',
        results: [
          {
            title: '标题A',
            url: 'https://example.com/a',
            content: '摘要A',
          },
          {
            title: '标题B',
            url: 'https://example.com/b',
            content: '摘要B',
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const result = await service.search('AI 新闻', 2);

    expect(result).toContain('答案：这是答案');
    expect(result).toContain('1. 标题A');
    expect(result).toContain('链接: https://example.com/a');
    expect(result).toContain('2. 标题B');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
