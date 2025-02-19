import { Module } from '@nestjs/common';
import { StockMarketService } from './stock-market.service';
import { StockMarketController } from './stock-market.controller';

@Module({
  controllers: [StockMarketController],
  providers: [StockMarketService],
  exports: [StockMarketService] // Export the service so that it can be injected in other modules
})
export class StockMarketModule {}