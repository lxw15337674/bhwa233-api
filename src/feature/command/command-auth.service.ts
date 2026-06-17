import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { createHash } from 'crypto';

export const COMMAND_KEY_HEADER = 'x-command-key';

@Injectable()
export class CommandAuthService {
  private getAllowedKeys(): string[] {
    return (process.env.COMMAND_API_KEYS || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private getRawKey(request: Request): string {
    const value = request.headers[COMMAND_KEY_HEADER] || request.headers[COMMAND_KEY_HEADER.toLowerCase()];
    return typeof value === 'string' ? value.trim() : '';
  }

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  resolveOptionalOwnerKeyHash(request: Request): string | undefined {
    const rawKey = this.getRawKey(request);
    if (!rawKey) {
      return undefined;
    }

    const allowedKeys = this.getAllowedKeys();
    if (!allowedKeys.includes(rawKey)) {
      throw new UnauthorizedException('Invalid command key');
    }

    return this.hashKey(rawKey);
  }

  resolveRequiredOwnerKeyHash(request: Request): string {
    const rawKey = this.getRawKey(request);
    if (!rawKey) {
      throw new UnauthorizedException(`Missing ${COMMAND_KEY_HEADER} header`);
    }

    const allowedKeys = this.getAllowedKeys();
    if (allowedKeys.length === 0) {
      throw new UnauthorizedException('COMMAND_API_KEYS is not configured');
    }

    if (!allowedKeys.includes(rawKey)) {
      throw new UnauthorizedException('Invalid command key');
    }

    return this.hashKey(rawKey);
  }
}
