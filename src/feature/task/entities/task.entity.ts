import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('task')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  remark: string;

  @Column()
  type: string;

  @Column()
  status: string;

  @Column()
  priority: string;

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

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  finishTime: Date;

  // 用户id
  @Column()
  userId: number;
}
