import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 100 })
  name!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string;

  @Column({ length: 50 })
  resource!: string;

  @Column({ length: 50 })
  action!: string;
}