import { Controller, Get, Query } from '@nestjs/common';
import { PageScraperService } from './page-scraper.service';

@Controller('page-scraper')
export class PageScraperController {
    constructor(private readonly pageScraperService: PageScraperService) {}

    @Get('content')
    async getPageContent(@Query('url') url: string) {
        const content = await this.pageScraperService.getPageContent(url);
        return {
            ...content,
        };
    }
}