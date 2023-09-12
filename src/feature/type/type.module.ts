import { Module } from '@nestjs/common';
import { TypeService } from './type.service';
import { TypeController } from './type.controller';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { TaskType } from './entities/type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskType]),
    CommonModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [TypeController],
  providers: [TypeService],
})
export class TypeModule {}
