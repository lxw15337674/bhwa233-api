import { Controller, Post, Body } from '@nestjs/common';
import { PageScraperService } from './page-scraper.service';
import { ScrapeUrlDto } from './dto/scrape-url.dto';

@Controller('page-scraper')
export class PageScraperController {
    constructor(private readonly pageScraperService: PageScraperService) {}

    @Post('')
    async getPageContent(@Body() scrapeUrlDto: ScrapeUrlDto) {
        const content = await this.pageScraperService.getPageContent(scrapeUrlDto.url);
        return {
            ...content,
        };
    }
}  