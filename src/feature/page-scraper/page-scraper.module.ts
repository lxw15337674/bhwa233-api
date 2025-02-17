import { Module } from '@nestjs/common';
import { PageScraperService } from './page-scraper.service';
import { PageScraperController } from './page-scraper.controller';

@Module({
  controllers: [PageScraperController],
  providers: [PageScraperService],
  exports: [PageScraperService],
})
export class PageScraperModule {}