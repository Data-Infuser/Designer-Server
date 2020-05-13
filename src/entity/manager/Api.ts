import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn, Table, Db} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";
import * as bcrypt from "bcryptjs";
import { User } from "./User";
import { MetaColumn } from "./MetaColumn";
import { Meta } from "./Meta";
import { ApiColumn } from "./ApiColumns";
import { HttpClientResponse } from "typed-rest-client/HttpClient";


const API_TABLE_PREFIX = 'api'
@Entity()
export class Api {
  static API_URL_PREFIX = '/dataset/'

  constructor(title?: string, entityName?:string, meta?:Meta, user?:User) {
    if(entityName) this.entityName = entityName
    if(title) this.title = title;
    if(user) this.user = user;
    if(meta) this.meta = meta;
    if(entityName && user) this.tableName = `${API_TABLE_PREFIX}_${this.user.id}_${this.entityName}`
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Length(1, 100)
  title: string;

  @Column()
  @Length(1, 100)
  entityName: string; //TODO: 생성시 unique 처리 필요.

  @Column()
  @Length(1, 100)
  tableName: string;

  @Column()
  columnLength: number;

  @Column()
  dataCounts: number;

  @ManyToOne(type => User, user => user.metas, { nullable: true, onDelete: 'CASCADE' })
  user: User;

  @OneToOne(type => Meta)
  @JoinColumn()
  meta: Meta;

  @OneToMany(type => ApiColumn, ac => ac.api)
  columns: ApiColumn[];

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;

  get url(): string {
    return Api.API_URL_PREFIX + this.tableName;
  }
}
