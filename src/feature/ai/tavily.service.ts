import { Injectable, Logger } from '@nestjs/common';

interface TavilyResultItem {
  title?: string;
  url?: string;
  content?: string;
}

interface TavilySearchResponse {
  answer?: string;
  results?: TavilyResultItem[];
}

@Injectable()
export class TavilyService {
  private readonly logger = new Logger(TavilyService.name);
  private readonly endpoint = 'https://api.tavily.com/search';

  async search(query: string, maxResults: number = 5): Promise<string> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return '缺少 query 参数';
    }

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return 'TAVILY_API_KEY 未配置';
    }

    const normalizedMaxResults = this.normalizeMaxResults(maxResults);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: trimmedQuery,
          search_depth: 'basic',
          max_results: normalizedMaxResults,
          include_answer: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Tavily search failed: ${response.status} ${errorText}`);
        return `Tavily 查询失败: ${response.status}`;
      }

      const data = (await response.json()) as TavilySearchResponse;
      const answer = typeof data.answer === 'string' ? data.answer.trim() : '';
      const results = Array.isArray(data.results) ? data.results : [];

      if (!answer && results.length === 0) {
        return 'Tavily 未返回有效结果';
      }

      const lines: string[] = [];
      if (answer) {
        lines.push(`答案：${answer}`);
      }

      if (results.length > 0) {
        lines.push('搜索结果：');
        for (let i = 0; i < results.length; i += 1) {
          const item = results[i];
          const title = (item.title ?? '').trim() || '无标题';
          const url = (item.url ?? '').trim() || '无链接';
          const content = (item.content ?? '').replace(/\s+/g, ' ').trim();
          const snippet = content ? content.slice(0, 180) : '无摘要';
          lines.push(`${i + 1}. ${title}`);
          lines.push(`链接: ${url}`);
          lines.push(`摘要: ${snippet}`);
        }
      }

      return lines.join('\n');
    } catch (error) {
      this.logger.error('Tavily search request failed', error);
      return 'Tavily 查询异常';
    }
  }

  private normalizeMaxResults(maxResults: number): number {
    if (!Number.isFinite(maxResults)) {
      return 5;
    }
    const rounded = Math.floor(maxResults);
    return Math.min(10, Math.max(1, rounded));
  }
}
