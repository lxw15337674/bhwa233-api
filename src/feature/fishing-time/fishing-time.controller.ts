import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FishingTimeService } from './fishing-time.service';

@Controller('fishingTime')
export class FishingTimeController {
  constructor(private readonly fishingTimeService: FishingTimeService) {}
  @Get()
  getText() {
    return this.fishingTimeService.getText();
  }
}
 