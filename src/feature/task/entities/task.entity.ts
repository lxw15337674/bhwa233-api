import { User } from 'src/feature/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('task')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titile: string;

  // 备注
  @Column()
  remark: string;

  // 类型
  @Column()
  type: string;

  // 状态
  @Column()
  status: string;

  // 优先级
  @Column()
  priority: string;

  // 创建时间
  @Column({
    name: 'create_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createTime: Date;

  // 更新时间
  @Column({
    name: 'update_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updateTime: Date;

  // 完成时间
  @Column({
    name: 'finish_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  finishTime: Date;

  // // 在 @ManyToOne 一侧，即在外键拥有者一侧，设置 onDelete，就可以使用外键的级联功能，这里设置级联删除，当删除 user 时，user 的所有 post 会被级联删除
  // // 与typeORM 冲突 https://github.com/planetscale/discussion/discussions/483#discussioncomment-6168463
  // @ManyToOne((type) => User, (user) => user.tasks, {
  //   onDelete: 'CASCADE',
  // })
  // user: User;

  // 创建用户id
  @Column()
  userId: number;
}
