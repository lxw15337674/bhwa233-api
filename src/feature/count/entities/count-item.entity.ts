import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CountMeta } from './count-meta.entity';

// 单次统计信息
@Entity('countItem')
export class CountItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  remark: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createTime: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updateTime: Date;

  @ManyToOne(() => CountMeta, (countMeta) => countMeta.counts)
  countMeta: CountMeta;

  @DeleteDateColumn()
  deletedAt: Date;
}
