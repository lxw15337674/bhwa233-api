import { Injectable } from '@nestjs/common';
import { CreateCountDto } from './dto/create-count.dto';
import { UpdateCountDto } from './dto/update-count.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CountMeta } from './entities/count-meta.entity';
import { CountItem } from './entities/count-item.entity';
import { AddCountDto } from './dto/add-count.dto';

@Injectable()
export class CountService {
  constructor(
    @InjectRepository(CountMeta)
    private readonly countMetaRepo: Repository<CountMeta>,
    @InjectRepository(CountItem)
    private readonly countItemRepo: Repository<CountItem>,
  ) {}
  async createCountType(createCountDto: CreateCountDto, userId: string) {
    const task = this.countMetaRepo.create({ ...createCountDto, userId });
    const newTask = await this.countMetaRepo.save(task);
    return newTask;
  }

  async findAll(userId: string) {
    const counts = await this.countMetaRepo
      .find({
        where: { userId },
        relations: ['counts'],
        order: {
          updateTime: 'DESC',
        },
      })
      .then((res) => {
        return res.map((count) => {
          count.counts.sort(
            (a, b) => b.createTime.getTime() - a.createTime.getTime(),
          );
          return count;
        });
      });
    return counts;
  }

  async findOne(id: string) {
    return await this.countMetaRepo.findOne({
      where: { id },
      relations: {
        counts: true,
      },
    });
  }

  async update(updateCountDto: UpdateCountDto, userId: string) {
    const { id } = updateCountDto;
    const count = await this.countMetaRepo.findOne({ where: { id, userId } });
    if (!count) throw new Error('任务不存在');
    const newCount = this.countMetaRepo.merge(count, updateCountDto, {
      updateTime: new Date(),
    });
    return this.countMetaRepo.save(newCount);
  }

  async addCount(countId: string, userId: string) {
    const count = await this.countMetaRepo.findOne({
      where: { id: countId, userId },
    });
    if (!count) throw new Error('统计类型不存在');
    const newCountTime = new CountItem();
    newCountTime.remark = '';
    newCountTime.updateTime = new Date();
    newCountTime.createTime = new Date();
    newCountTime.countMeta = count;
    return await this.countItemRepo.save(newCountTime);
  }

  async resetCount(countId: string, userId: string) {
    const count = await this.countMetaRepo.findOne({
      where: { id: countId, userId },
      relations: {
        counts: true,
      },
    });
    if (!count) throw new Error('统计类型不存在');
    await this.countItemRepo.softRemove(count.counts);
  }

  async removeCount(countId: string, userId: string) {
    const count = await this.countMetaRepo.findOne({
      where: { id: countId, userId },
      relations: {
        counts: true,
      },
    });
    if (!count) throw new Error('统计类型不存在');
    await this.countMetaRepo.softRemove(count);
  }
}
