import { Module } from '@nestjs/common';
import { GirlController } from './girl.controller';
import { GirlService } from './girl.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Girl } from './entities/girl.entity';

@Module({
  controllers: [GirlController],
  providers: [
    GirlService,
    {
      provide: 'GirlArray',
      useValue: ['小红', '小翠', '大鸭'],
    },
  ],
  imports: [TypeOrmModule.forFeature([Girl])],
})
export class GirlModule {}
