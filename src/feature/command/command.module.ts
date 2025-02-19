import { Module } from '@nestjs/common';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';
import { StockMarketModule } from '../stock-market/stock-market.module';

@Module({
  imports: [StockMarketModule],
  controllers: [CommandController],
  providers: [CommandService],
  exports: [CommandService],
})
export class CommandModule {}