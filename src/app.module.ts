import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { UserModule } from './feature/user/user.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './core/auth/auth.module';
import { ErrorsInterceptor } from './core/interceptors/errors/errors.interceptor';
import { TaskModule } from './feature/task/task.module';
import { TypeModule } from './feature/type/type.module';
import { UnauthorizedExceptionFilter } from './core/exception/unauthorizedException.filter';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { CountModule } from './feature/count/count.module';
import { ChatSocketModule } from './chat-socket/chat-socket.module';
import { FishingTimeModule } from './feature/fishing-time/fishing-time.module';
import { ConfigModule } from '@nestjs/config';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      entities: [join(__dirname, '**', '*.entity.{ts,js}')],
      ssl: {
        rejectUnauthorized: true,
      },
      synchronize: false, // 生产环境不要使用，vercel会报错
    }),
    UserModule,
    CountModule,
    AuthModule,
    TaskModule,
    TypeModule,
    ChatSocketModule,
    FishingTimeModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR, // 全局拦截器，这里使用全局异常拦截器改写异常消息结构
      useClass: ErrorsInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: UnauthorizedExceptionFilter,
    },
    AppService,
  ],
})
export class AppModule { }
