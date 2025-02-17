import { Controller, Get, Query } from '@nestjs/common';
import { StockMarketService } from './stock-market.service';

@Controller('stock-market')
export class StockMarketController {
    constructor(private readonly stockMarketService: StockMarketService) { }

    @Get('getFutuStockMap')
    async getFutuStockMap(@Query('area') area: string, @Query('mapType') mapType: string) {
        return this.stockMarketService.getFutuStockMap(area, mapType);
    }

    @Get('getYuntuStockMap')
    async getYuntuStockMap() {
        return this.stockMarketService.getYuntuStockMap();
    }
}