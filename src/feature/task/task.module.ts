import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { Task } from './entities/task.entity';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    CommonModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
