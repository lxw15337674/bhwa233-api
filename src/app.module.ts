import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './feature/ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { FishingTimeModule } from './feature/fishing-time/fishing-time.module';
import { StockMarketModule } from './feature/stock-market/stock-market.module';
import { PageScraperModule } from './feature/page-scraper/page-scraper.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FishingTimeModule,
    AiModule,
    StockMarketModule,
    PageScraperModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
