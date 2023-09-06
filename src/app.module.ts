import { Module } from '@nestjs/common';
import 'dotenv/config';
import { join } from 'path';
import { UserModule } from './feature/user/user.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './core/auth/auth.module';
import { ErrorsInterceptor } from './core/interceptors/errors/errors.interceptor';
import { TaskModule } from './feature/task/task.module';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DATABASE_HOST,
      port: 3306,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      synchronize: true,
      autoLoadModels: true,
      dialectOptions: {
        ssl: {
          rejectUnauthorized: true,
        },
      },
    }),
    UserModule,
    AuthModule,
    TaskModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR, // 全局拦截器，这里使用全局异常拦截器改写异常消息结构
      useClass: ErrorsInterceptor,
    },
  ],
})
export class AppModule {}
