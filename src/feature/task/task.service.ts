import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
  ) {}
  async create(createTaskDto: CreateTaskDto) {
    const task = this.taskRepo.create(createTaskDto);
    const newTask = this.taskRepo.save(task);
    return newTask;
  }

  async findAll(userId: number) {
    return await this.taskRepo.find({ where: { userId } });
  }

  async findByTitle(userId: number, title: string) {
    return await this.taskRepo.find({ where: { title, userId } });
  }

  async update(updateTaskDto: UpdateTaskDto) {
    const task = await this.taskRepo.findOne({
      where: { id: updateTaskDto.id },
    });
    if (!task) throw new Error('任务不存在');
    const newTask = this.taskRepo.merge(task, updateTaskDto);
    return await this.taskRepo.save(newTask);
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }
}
