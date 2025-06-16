import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const apiKey = request.headers['x-api-key'] as string;

        if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
            throw new UnauthorizedException('Invalid or missing API key');
        }

        return true;
    }
} 