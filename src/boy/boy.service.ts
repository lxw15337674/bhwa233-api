import { Injectable } from '@nestjs/common';
import { CreateBoyDto } from './dto/create-boy.dto';
import { UpdateBoyDto } from './dto/update-boy.dto';

@Injectable()
export class BoyService {
  create(createBoyDto: CreateBoyDto) {
    return 'This action adds a new boy';
  }

  findAll() {
    return `This action returns all boy`;
  }

  findOne(id: number) {
    return `This action returns a #${id} boy`;
  }

  update(id: number, updateBoyDto: UpdateBoyDto) {
    return `This action updates a #${id} boy`;
  }

  remove(id: number) {
    return `This action removes a #${id} boy`;
  }
}
