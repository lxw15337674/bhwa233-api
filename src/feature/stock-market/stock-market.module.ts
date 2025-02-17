import { Module } from '@nestjs/common';
import { StockMarketService } from './stock-market.service';
import { StockMarketController } from './stock-market.controller';

@Module({
  controllers: [StockMarketController],
  providers: [StockMarketService],
})
export class StockMarketModule {}