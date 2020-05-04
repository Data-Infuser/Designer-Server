import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";
import * as bcrypt from "bcryptjs";
import { User } from "./User";
import { MetaColumn } from "./MetaColumn";



@Entity()
export class Meta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Length(1, 100)
  title: string;

  @Column()
  @Length(1, 100)
  originalFileName: string;

  @Column()
  @Length(4, 100)
  filePath: string;

  @Column()
  @Length(1, 20)
  extension: string;

  @Column()
  rowCounts: number;

  @ManyToOne(type => User, user => user.metas, { nullable: true, onDelete: 'CASCADE' })
  user: User;

  @OneToMany(type => MetaColumn, mc => mc.meta)
  columns: MetaColumn[];

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
