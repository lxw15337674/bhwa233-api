import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BoyService } from './boy.service';
import { CreateBoyDto } from './dto/create-boy.dto';
import { UpdateBoyDto } from './dto/update-boy.dto';

@Controller('boy')
export class BoyController {
  constructor(private readonly boyService: BoyService) {}

  @Post()
  create(@Body() createBoyDto: CreateBoyDto) {
    return this.boyService.create(createBoyDto);
  }

  @Get()
  findAll() {
    return this.boyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boyService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoyDto: UpdateBoyDto) {
    return this.boyService.update(+id, updateBoyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.boyService.remove(+id);
  }
}
