import { Post } from 'src/feature/post/entities/post.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  account: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @Column({
    default: 'regular',
  })
  role: string;
}
