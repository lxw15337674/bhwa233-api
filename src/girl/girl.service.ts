import { Injectable } from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Girl } from './entities/girl.entity';

@Injectable()
export class GirlService {
  constructor(
    @InjectRepository(Girl) private readonly girl: Repository<Girl>,
  ) {}

  getGirls() {
    return this.girl.find();
  }

  updateGirl(id: string) {
    const data = new Girl();
    data.name = '大梨';
    data.age++;
    return this.girl.update(id, data);
  }

  addGirl() {
    const data = new Girl();
    data.name = '大梨';
    data.age = 27;
    return this.girl.save(data);
  }

  delGirl(id: number) {
    return this.girl.delete(id);
  }

  getGirlByName(name: string) {
    return this.girl.find({
      where: {
        name: Like(`%${name}%`),
      },
    });
  }

  getGirlById(id: number) {
    return this.girl.find({
      where: {
        id,
      },
    });
  }
}
