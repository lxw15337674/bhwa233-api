import { Injectable } from '@nestjs/common';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TaskType } from './entities/type.entity';

const TodoTypes = [
  {
    name: '工作',
    color: '#922852',
  },
  {
    name: '学习',
    color: '#4291e1',
  },
  {
    name: '生活',
    color: '#265b5c',
  },
  {
    name: '娱乐',
    color: '#e75b5c',
  },
  {
    name: '思考',
    color: '#4f0e0d',
  },
];

// 生成随机颜色
const createRandomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
};

@Injectable()
export class TypeService {
  constructor(
    @InjectRepository(TaskType) private readonly typeRepo: Repository<TaskType>,
  ) {}

  async create(createTypeDto: CreateTypeDto, userId: string) {
    const { name } = createTypeDto;
    const exist = await this.typeRepo.findOne({ where: { name, userId } });
    if (exist) throw new Error('类型已存在');
    const type = this.typeRepo.create({ ...createTypeDto, userId });
    // 随机生成颜色
    type.color = createRandomColor();
    return this.typeRepo.save(type);
  }

  // 包括默认类型和用户自定义类型
  async findAll(userId: string) {
    return await this.typeRepo.find({
      where: { userId: In([userId, 0]) },
    });
  }

  async createDefaultTypes() {
    // 检测是否存在默认类型
    const exist = await this.typeRepo.findOne({ where: { userId: '0' } });
    if (exist) return;
    const types = TodoTypes.map((name) => ({
      name: name.name,
      userId: '0',
      color: name.color,
    }));
    return await this.typeRepo.save(types);
  }

  update(updateTypeDto: UpdateTypeDto, userId: string) {
    const { name } = updateTypeDto;
    return this.typeRepo.update({ name, userId }, updateTypeDto);
  }

  remove(id: string) {
    return this.typeRepo.delete({ id });
  }
}
