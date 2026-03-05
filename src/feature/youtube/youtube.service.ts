import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { constants as fsConstants, promises as fs } from 'fs';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

interface YtDlpFormatRaw {
  format_id?: string;
  ext?: string;
  vcodec?: string;
  acodec?: string;
  width?: number;
  height?: number;
  fps?: number;
  tbr?: number;
  filesize?: number;
  format_note?: string;
  protocol?: string;
  url?: string;
}

interface YtDlpVideoInfoRaw {
  id?: string;
  title?: string;
  duration?: number;
  thumbnail?: string;
  uploader?: string;
  webpage_url?: string;
  formats?: YtDlpFormatRaw[];
}

export interface YoutubeFormatInfo {
  formatId: string;
  ext: string;
  width?: number;
  height?: number;
  fps?: number;
  tbr?: number;
  filesize?: number;
  vcodec?: string;
  acodec?: string;
  formatNote?: string;
  protocol?: string;
  url: string;
}

export interface YoutubeResolveResult {
  platform: 'youtube';
  videoId: string;
  title: string;
  duration?: number;
  thumbnail?: string;
  uploader?: string;
  url: string;
  bestFormat?: YoutubeFormatInfo;
  formats: YoutubeFormatInfo[];
}

export interface YoutubeDownloadInfo {
  downloadUrl: string;
  expiresAt?: string;
  source: 'yt-dlp';
}

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly defaultFormatSelector =
    process.env.YT_DLP_FORMAT ||
    'best[ext=mp4][acodec!=none][vcodec!=none]/best[acodec!=none][vcodec!=none]/best';
  private readonly commandTimeoutMs = Number(
    process.env.YT_DLP_TIMEOUT_MS || 45000,
  );
  private readonly downloadTimeoutMs = Number(
    process.env.YT_DLP_DOWNLOAD_TIMEOUT_MS || 20000,
  );
  private readonly allowedHosts = new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'youtu.be',
    'www.youtu.be',
  ]);

  private binaryPathPromise?: Promise<string>;

  async resolveVideo(url: string): Promise<YoutubeResolveResult> {
    const normalizedUrl = this.normalizeYoutubeUrl(url);
    const args = [
      ...this.buildCommonArgs(),
      '--dump-single-json',
      '--skip-download',
      '--format',
      this.defaultFormatSelector,
      normalizedUrl,
    ];
    const output = await this.runYtDlp(args, this.commandTimeoutMs);

    let info: YtDlpVideoInfoRaw;
    try {
      info = JSON.parse(output) as YtDlpVideoInfoRaw;
    } catch (error) {
      this.logger.error(`yt-dlp JSON parse failed: ${String(error)}`);
      throw new HttpException(
        'yt-dlp 返回数据格式异常',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const formats = (info.formats || [])
      .filter(
        (format) =>
          typeof format.url === 'string' &&
          format.url.trim().length > 0 &&
          format.vcodec !== 'none',
      )
      .map((format) => this.mapFormat(format))
      .sort((a, b) => this.compareFormats(a, b))
      .slice(0, 12);

    const bestFormat = formats[0];
    const videoId = info.id || this.extractVideoId(normalizedUrl);

    return {
      platform: 'youtube',
      videoId: videoId || '',
      title: info.title || 'YouTube Video',
      duration: info.duration,
      thumbnail: info.thumbnail,
      uploader: info.uploader,
      url: info.webpage_url || normalizedUrl,
      bestFormat,
      formats,
    };
  }

  async getDownloadInfo(url: string, format?: string): Promise<YoutubeDownloadInfo> {
    const normalizedUrl = this.normalizeYoutubeUrl(url);
    const selectedFormat =
      typeof format === 'string' && format.trim().length > 0
        ? format.trim()
        : this.defaultFormatSelector;

    const args = [
      ...this.buildCommonArgs(),
      '--get-url',
      '--format',
      selectedFormat,
      normalizedUrl,
    ];
    const output = await this.runYtDlp(args, this.downloadTimeoutMs);
    const candidates = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (!candidates.length) {
      throw new HttpException(
        '未获取到可用下载直链',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const downloadUrl = candidates[0];
    return {
      downloadUrl,
      expiresAt: this.extractExpireTime(downloadUrl),
      source: 'yt-dlp',
    };
  }

  private buildCommonArgs(): string[] {
    const args = ['--no-playlist', '--no-warnings', '--no-call-home'];
    const cookiesFile = process.env.YT_DLP_COOKIES_FILE;
    if (cookiesFile && cookiesFile.trim().length > 0) {
      args.push('--cookies', cookiesFile.trim());
    }

    const proxy = process.env.YT_DLP_PROXY;
    if (proxy && proxy.trim().length > 0) {
      args.push('--proxy', proxy.trim());
    }

    return args;
  }

  private async runYtDlp(args: string[], timeoutMs: number): Promise<string> {
    const binaryPath = await this.getYtDlpPath();
    this.logger.log(`Running yt-dlp: ${binaryPath} ${args.join(' ')}`);

    return await new Promise<string>((resolve, reject) => {
      const child = spawn(binaryPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk: string) => {
        stdout += chunk;
      });
      child.stderr.on('data', (chunk: string) => {
        stderr += chunk;
      });

      const timer = setTimeout(() => {
        child.kill('SIGKILL');
      }, timeoutMs);

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(
          new HttpException(
            `调用 yt-dlp 失败: ${String(error.message || error)}`,
            HttpStatus.BAD_GATEWAY,
          ),
        );
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          const err = stderr.trim() || `yt-dlp exited with code ${code}`;
          reject(
            new HttpException(
              `yt-dlp 执行失败: ${err.slice(0, 500)}`,
              HttpStatus.BAD_GATEWAY,
            ),
          );
          return;
        }
        resolve(stdout.trim());
      });
    });
  }

  private async getYtDlpPath(): Promise<string> {
    if (!this.binaryPathPromise) {
      this.binaryPathPromise = this.resolveYtDlpPath();
    }
    return this.binaryPathPromise;
  }

  private async resolveYtDlpPath(): Promise<string> {
    const envPath = process.env.YT_DLP_PATH?.trim();
    if (envPath) {
      if (await this.pathExists(envPath, true)) {
        return envPath;
      }
      throw new HttpException(
        `YT_DLP_PATH 不存在或不可执行: ${envPath}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const isWindows = process.platform === 'win32';
    const candidates = [
      join(process.cwd(), 'bin', isWindows ? 'yt-dlp.exe' : 'yt-dlp'),
      join('/var/task/bin', 'yt-dlp'),
      join('/tmp', isWindows ? 'yt-dlp.exe' : 'yt-dlp'),
    ];

    for (const candidate of candidates) {
      if (await this.pathExists(candidate, true)) {
        return candidate;
      }
    }

    const downloadUrl =
      process.env.YT_DLP_DOWNLOAD_URL?.trim() ||
      (isWindows
        ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
        : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp');
    const targetPath = join('/tmp', isWindows ? 'yt-dlp.exe' : 'yt-dlp');

    await this.downloadYtDlpBinary(downloadUrl, targetPath, isWindows);
    return targetPath;
  }

  private async downloadYtDlpBinary(
    url: string,
    targetPath: string,
    isWindows: boolean,
  ): Promise<void> {
    this.logger.log(`Downloading yt-dlp binary from ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new HttpException(
        `下载 yt-dlp 失败: ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    await fs.mkdir(dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, bytes);
    if (!isWindows) {
      await fs.chmod(targetPath, 0o755);
    }
  }

  private async pathExists(path: string, executable: boolean): Promise<boolean> {
    try {
      if (executable) {
        await fs.access(path, fsConstants.X_OK);
      } else {
        await fs.access(path, fsConstants.F_OK);
      }
      return true;
    } catch {
      return false;
    }
  }

  private normalizeYoutubeUrl(input: string): string {
    let parsed: URL;
    try {
      parsed = new URL(input);
    } catch {
      throw new HttpException('无效的 YouTube 链接', HttpStatus.BAD_REQUEST);
    }

    const host = parsed.hostname.toLowerCase();
    if (!this.allowedHosts.has(host)) {
      throw new HttpException(
        `不支持的 YouTube 域名: ${parsed.hostname}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (host.includes('youtu.be')) {
      const videoId = parsed.pathname.replace(/^\/+/, '').split('/')[0];
      if (!videoId) {
        throw new HttpException('无效的 youtu.be 链接', HttpStatus.BAD_REQUEST);
      }
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    if (parsed.pathname.startsWith('/shorts/')) {
      const videoId = parsed.pathname.split('/').filter(Boolean)[1];
      if (!videoId) {
        throw new HttpException('无效的 shorts 链接', HttpStatus.BAD_REQUEST);
      }
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    if (parsed.pathname === '/watch' && parsed.searchParams.get('v')) {
      return `https://www.youtube.com/watch?v=${parsed.searchParams.get('v')}`;
    }

    if (parsed.searchParams.get('v')) {
      return `https://www.youtube.com/watch?v=${parsed.searchParams.get('v')}`;
    }

    throw new HttpException('无法从链接中提取视频 ID', HttpStatus.BAD_REQUEST);
  }

  private extractVideoId(url: string): string | null {
    const match = /[?&]v=([^&]+)/.exec(url);
    return match?.[1] || null;
  }

  private mapFormat(format: YtDlpFormatRaw): YoutubeFormatInfo {
    return {
      formatId: format.format_id || '',
      ext: format.ext || 'unknown',
      width: format.width,
      height: format.height,
      fps: format.fps,
      tbr: format.tbr,
      filesize: format.filesize,
      vcodec: format.vcodec,
      acodec: format.acodec,
      formatNote: format.format_note,
      protocol: format.protocol,
      url: format.url || '',
    };
  }

  private compareFormats(a: YoutubeFormatInfo, b: YoutubeFormatInfo): number {
    const heightDiff = (b.height || 0) - (a.height || 0);
    if (heightDiff !== 0) {
      return heightDiff;
    }

    const bitrateDiff = (b.tbr || 0) - (a.tbr || 0);
    if (bitrateDiff !== 0) {
      return bitrateDiff;
    }

    return (b.filesize || 0) - (a.filesize || 0);
  }

  private extractExpireTime(url: string): string | undefined {
    try {
      const parsed = new URL(url);
      const expireRaw =
        parsed.searchParams.get('expire') ||
        parsed.searchParams.get('x-expires');
      if (!expireRaw) {
        return undefined;
      }
      const expireSeconds = Number(expireRaw);
      if (!Number.isFinite(expireSeconds) || expireSeconds <= 0) {
        return undefined;
      }
      return new Date(expireSeconds * 1000).toISOString();
    } catch {
      return undefined;
    }
  }
}

