import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from 'src/core/auth/auth.module';
import { CommonModule } from 'src/common/common.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    // 向用户模块注册 passport，并配置默认策略为 jwt，因为覆盖了默认的策略，所以要在每个使用 @AuthGuard() 的模块导入 PassportModule
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule), // 处理模块间的循环依赖
    CommonModule,
  ],
  exports: [UserService],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
