import { Column, Model, Table } from 'sequelize-typescript';

@Table
export default class Task extends Model<Task> {
  @Column
  title: string;

  @Column
  remark: string;

  @Column
  type: string;

  @Column
  status: string;

  @Column
  priority: string;

  @Column({
    type: 'timestamp',
    defaultValue: () => 'CURRENT_TIMESTAMP',
  })
  createTime: Date;

  @Column({
    type: 'timestamp',
    defaultValue: () => 'CURRENT_TIMESTAMP',
  })
  updateTime: Date;

  @Column({
    type: 'timestamp',
    defaultValue: () => 'CURRENT_TIMESTAMP',
  })
  finishTime: Date;

  // 用户id
  @Column
  userId: number;
}
