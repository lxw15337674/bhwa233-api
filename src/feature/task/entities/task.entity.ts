import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('task')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({
    type: 'text',
  })
  content: string;
}
