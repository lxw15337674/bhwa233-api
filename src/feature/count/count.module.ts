import { Module } from '@nestjs/common';
import { CountService } from './count.service';
import { CountController } from './count.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { PassportModule } from '@nestjs/passport';
import { CountItem } from './entities/count-item.entity';
import { CountMeta } from './entities/count-meta.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CountItem, CountMeta]),
    CommonModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [CountController],
  providers: [CountService],
})
export class CountModule {}
