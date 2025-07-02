import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class ApiKeyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
