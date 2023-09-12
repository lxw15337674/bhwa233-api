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
  OnModuleInit,
} from '@nestjs/common';
import { TypeService } from './type.service';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/common/user/user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('taskType')
export class TypeController implements OnModuleInit {
  async onModuleInit() {
    this.typeService.createDefaultTypes();
  }

  constructor(private readonly typeService: TypeService) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() createTypeDto: CreateTypeDto) {
    return this.typeService.create(createTypeDto);
  }

  @Get('findAll')
  @UseGuards(AuthGuard('jwt'))
  findAll(@UserInfo() user: User) {
    return this.typeService.findAll(user.id);
  }

  @Patch('update')
  @UseGuards(AuthGuard('jwt'))
  update(@Body() updateTaskDto: UpdateTypeDto) {
    return this.typeService.update(updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.typeService.remove(id);
  }
}
