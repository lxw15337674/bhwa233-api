import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true }) // 可以为空
  thirdPartyId: number;

  @Column()
  account: string;

  @Column()
  password: string;

  @Column()
  name: string;

  // @Column('simple-enum', { enum: ['root', 'author', 'visitor'] })
  @Column({ default: 'visitor' })
  role: string;

  @Column({
    name: 'create_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createTime: Date;

  @Column({
    name: 'update_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updateTime: Date;
}
