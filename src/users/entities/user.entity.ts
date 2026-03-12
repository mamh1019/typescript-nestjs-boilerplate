import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ name: 'user_name', type: 'int' })
  userName: number;

  @Column({ type: 'int', default: 0 })
  coin: number;

  @Column({ type: 'int', default: 0 })
  jewel: number;

  @CreateDateColumn({ name: 'created' })
  created: Date;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
