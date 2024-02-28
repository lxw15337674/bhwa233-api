import { Module } from '@nestjs/common';
import { FishingTimeService } from './fishing-time.service';
import { FishingTimeController } from './fishing-time.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [FishingTimeController],
  providers: [FishingTimeService]
})
export class FishingTimeModule {}
