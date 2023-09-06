import User from 'src/feature/user/entities/user.entity';
import {
  Column,
  Model,
  Table,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';

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

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;
}
