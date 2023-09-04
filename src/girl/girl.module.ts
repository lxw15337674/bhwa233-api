import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GirlController } from './girl.controller';
import { GirlService } from './girl.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Girl } from './entities/girl.entity';
import { CounterMiddleware } from 'src/counter/counter.middleware';
import { BoyService } from 'src/boy/boy.service';
import { ConfigModule } from 'src/config/config.module';

@Module({
  controllers: [GirlController],
  providers: [
    GirlService,
    {
      provide: 'GirlArray',
      useValue: ['小红', '小翠', '大鸭'],
    },
    BoyService,
  ],
  imports: [TypeOrmModule.forFeature([Girl]), ConfigModule.forRoot('洗浴中心')],
})
export class GirlModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CounterMiddleware).forRoutes('girl');
  }
}
