import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { User } from 'src/feature/user/entities/user.entity';

// 通过装饰器获取当前用户信息
export const UserInfo = createParamDecorator<User>(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as User;
  },
);
