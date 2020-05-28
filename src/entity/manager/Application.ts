import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne, BaseEntity} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";
import { User } from "./User";
import { MetaColumn } from "./MetaColumn";
import { Api } from "./Api";



@Entity()
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Length(1, 100)
  nameSpace: string;

  @Column()
  @Length(1, 100)
  title: string;

  @Column({type: "text"})
  description: string;

  @ManyToOne(type => User, user => user.metas, { nullable: true, onDelete: 'CASCADE' })
  user: User;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
