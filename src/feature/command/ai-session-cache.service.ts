import { Injectable, Logger } from '@nestjs/common';

interface CachedTurn {
  user: string;
  assistant: string;
  timestamp: number;
}

@Injectable()
export class AiSessionCacheService {
  private readonly logger = new Logger(AiSessionCacheService.name);
  private readonly maxRounds = 100;
  private readonly ttlSeconds = 6 * 60 * 60;
  private readonly globalSessionId = 'global';
  private readonly restUrl = process.env.KV_REST_API_URL?.replace(/\/+$/, '');
  private readonly restToken = process.env.KV_REST_API_TOKEN;
  private hasWarnedConfig = false;

  async getTurns(sessionId: string = this.globalSessionId): Promise<CachedTurn[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const key = this.buildKey(sessionId);
    const responses = await this.runPipeline([['LRANGE', key, '0', '-1']]);
    const raw = Array.isArray(responses[0]?.result) ? responses[0].result : [];

    const turns: CachedTurn[] = [];
    for (const item of raw) {
      if (typeof item !== 'string') {
        continue;
      }
      try {
        const parsed = JSON.parse(item) as Partial<CachedTurn>;
        if (typeof parsed.user === 'string' && typeof parsed.assistant === 'string') {
          turns.push({
            user: parsed.user,
            assistant: parsed.assistant,
            timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
          });
        }
      } catch {
        continue;
      }
    }

    return turns;
  }

  async appendTurn(user: string, assistant: string, sessionId: string = this.globalSessionId): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    const key = this.buildKey(sessionId);
    const payload = JSON.stringify({
      user,
      assistant,
      timestamp: Date.now(),
    } satisfies CachedTurn);

    await this.runPipeline([
      ['RPUSH', key, payload],
      ['LTRIM', key, `-${this.maxRounds}`, '-1'],
      ['EXPIRE', key, `${this.ttlSeconds}`],
    ]);
  }

  private buildKey(sessionId: string): string {
    return `chat:a:${sessionId}`;
  }

  private isConfigured(): boolean {
    const configured = Boolean(this.restUrl && this.restToken);
    if (!configured && !this.hasWarnedConfig) {
      this.hasWarnedConfig = true;
      this.logger.warn(
        'Upstash KV config is missing (KV_REST_API_URL / KV_REST_API_TOKEN). AI session cache is disabled.',
      );
    }
    return configured;
  }

  private async runPipeline(commands: string[][]): Promise<Array<{ result?: unknown; error?: string }>> {
    try {
      const response = await fetch(`${this.restUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.restToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Upstash pipeline request failed: ${response.status} ${errorText}`);
        return [];
      }

      const data = (await response.json()) as Array<{ result?: unknown; error?: string }> | undefined;
      if (!Array.isArray(data)) {
        return [];
      }

      for (const item of data) {
        if (item?.error) {
          this.logger.error(`Upstash pipeline command failed: ${item.error}`);
        }
      }

      return data;
    } catch (error) {
      this.logger.error('Upstash pipeline request failed', error);
      return [];
    }
  }
}
