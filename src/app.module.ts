import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './feature/ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { FishingTimeModule } from './feature/fishing-time/fishing-time.module';
import { CommandModule } from './feature/command/command.module';
import { BookmarkModule } from './feature/bookmark/bookmark.module';
import { BilibiliAudioModule } from './feature/bilibili-audio/bilibili-audio.module';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { DouyinModule } from './feature/douyin/douyin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FishingTimeModule,
    AiModule,
    CommandModule,
    BookmarkModule,
    BilibiliAudioModule,
    DouyinModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggingMiddleware)
      .forRoutes('*'); // 对所有路由应用日志中间件
  }
}
