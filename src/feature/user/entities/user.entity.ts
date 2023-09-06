import { Column, Model, Table, HasMany } from 'sequelize-typescript';
import Task from 'src/feature/task/entities/task.entity';

@Table
export default class User extends Model<User> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  account: string;

  @Column
  password: string;

  @Column({
    unique: true,
  })
  name: string;

  @Column({
    type: 'enum',
    values: ['root', 'author', 'visitor'],
    allowNull: true,
  })
  role: string;

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
}