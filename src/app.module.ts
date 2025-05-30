import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './feature/ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { FishingTimeModule } from './feature/fishing-time/fishing-time.module';
import { CommandModule } from './feature/command/command.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FishingTimeModule,
    AiModule,
    CommandModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
