import { Module } from '@nestjs/common';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';
import { StockMarketModule } from '../stock-market/stock-market.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [StockMarketModule, AiModule],
  controllers: [CommandController],
  providers: [CommandService],
  exports: [CommandService],
})
export class CommandModule {}