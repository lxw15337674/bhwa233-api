import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { CountService } from './count.service';
import { CreateCountDto } from './dto/create-count.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/common/user/user.decorator';
import { User } from '../user/entities/user.entity';
import { UpdateCountDto } from './dto/update-count.dto';

@Controller('count')
export class CountController {
  constructor(private readonly countService: CountService) {}

  @Post('createType')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createTaskDto: CreateCountDto, @UserInfo() user: User) {
    return this.countService.createCountType(createTaskDto, user.id);
  }

  // 获取所有计数器，包括计数统计数据
  @Get('findAll')
  @UseGuards(AuthGuard('jwt'))
  findAll(@UserInfo() user: User) {
    return this.countService.findAll(user.id);
  }

  // 获取单个计数器的统计数据
  @Get('getTypeCounts')
  @UseGuards(AuthGuard('jwt'))
  getTypeCounts(@Query('countId') id: string, @UserInfo() user: User) {
    return this.countService.getTypeCounts(id, user.id);
  }

  // 获取所有计数器
  @Get('findAllWithCounter')
  @UseGuards(AuthGuard('jwt'))
  findAllWithCounter(@UserInfo() user: User) {
    return this.countService.findAllWithCounter(user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id') id: string) {
    return this.countService.findOne(id);
  }

  // 增加次数
  @Post('addCount')
  @UseGuards(AuthGuard('jwt'))
  update(@Body('countId') id: string, @UserInfo() user: User) {
    return this.countService.addCount(id, user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Body('id') id: string, @UserInfo() user: User) {
    return this.countService.removeCount(id, user.id);
  }

  @Post('resetCount')
  @UseGuards(AuthGuard('jwt'))
  resetCount(@Body('countId') id: string, @UserInfo() user: User) {
    return this.countService.resetCount(id, user.id);
  }

  @Patch('update')
  @UseGuards(AuthGuard('jwt'))
  updateCount(@Body() updateCountDto: UpdateCountDto, @UserInfo() user: User) {
    return this.countService.update(updateCountDto, user.id);
  }
}
