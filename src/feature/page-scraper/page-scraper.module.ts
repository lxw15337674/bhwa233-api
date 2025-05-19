import { Module } from '@nestjs/common';
import { PageScraperService } from './page-scraper.service';
import { PageScraperController } from './page-scraper.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [PageScraperController],
  providers: [PageScraperService],
  exports: [PageScraperService],
})
export class PageScraperModule {}