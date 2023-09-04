import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UserModule } from '../../feature/user/user.module';
import { AuthService } from './auth.service';
import { AuthStrategy } from './auth.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_KEY,
      signOptions: {
        expiresIn: 3600,
      },
    }),
    forwardRef(() => UserModule), // 处理模块间的循环依赖
  ],
  providers: [AuthService, AuthStrategy],
  exports: [AuthService], // 导出 AuthServie 供 UserModule 使用
})
export class AuthModule {}
