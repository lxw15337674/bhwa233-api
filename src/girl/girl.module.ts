import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GirlController } from './girl.controller';
import { GirlService } from './girl.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Girl } from './entities/girl.entity';
import { CounterMiddleware } from 'src/counter/counter.middleware';

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
export class GirlModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CounterMiddleware).forRoutes('girl');
  }
}
