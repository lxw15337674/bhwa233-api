import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Req, UseGuards } from '@nestjs/common/decorators';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/common/user/user.decorator';
import { User } from '../user/entities/user.entity';
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    return this.taskService.create({ ...createTaskDto, userId: req.user.id });
  }

  @Get('findAll')
  @UseGuards(AuthGuard('jwt'))
  findAll(@UserInfo() user: User) {
    return this.taskService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Param('title') title: string) {
    return this.taskService.findByTitle(id, title);
  }

  @Patch('update')
  @UseGuards(AuthGuard('jwt'))
  update(@Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(+id);
  }
}
