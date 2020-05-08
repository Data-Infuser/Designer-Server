import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn, Table, Db} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";
import * as bcrypt from "bcryptjs";
import { User } from "./User";
import { MetaColumn } from "./MetaColumn";
import { Meta } from "./Meta";


const API_TABLE_PREFIX = 'api'
@Entity()
export class Api {

  constructor(title?:string, meta?:Meta, user?:User) {
    if(title) this.title = title;
    if(user) this.user = user;
    if(meta) this.meta = meta;
    if(title && user) this.tableName = `${API_TABLE_PREFIX}_${this.user.id}_${this.title}`
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Length(1, 100)
  title: string;

  @Column()
  @Length(1, 100)
  tableName: string;

  @ManyToOne(type => User, user => user.metas, { nullable: true, onDelete: 'CASCADE' })
  user: User;

  @OneToOne(type => Meta)
  @JoinColumn()
  meta: Meta;

  @OneToMany(type => MetaColumn, mc => mc.meta)
  columns: MetaColumn[];

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
