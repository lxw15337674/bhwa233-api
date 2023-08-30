import { Module } from '@nestjs/common';
import { GirlController } from './girl.controller';
import { GirlService } from './girl.service';

@Module({
  controllers: [GirlController],
  providers: [GirlService]
})
export class GirlModule {}
