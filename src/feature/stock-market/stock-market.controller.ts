import { Controller, Get, Header, Query } from '@nestjs/common';
import { StockMarketService } from './stock-market.service';

@Controller('stock-market')
export class StockMarketController {
    constructor(private readonly stockMarketService: StockMarketService) { }

    @Get('getFutuStockMap')
    @Header('Content-Type', 'image/jpeg') // Set default Content-Type, can be dynamic
    async getFutuStockMap(@Query('area') area: string = 'hk', @Query('mapType') mapType: string ='hy') {
        return this.stockMarketService.getFutuStockMap(area, mapType);
    }

    @Get('getYuntuStockMap')
    @Header('Content-Type', 'image/jpeg') // Set default Content-Type, can be dynamic
    async getYuntuStockMap() {
        return this.stockMarketService.getYuntuStockMap();
    }
}