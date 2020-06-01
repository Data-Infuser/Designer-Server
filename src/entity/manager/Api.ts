import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn, Table, Db} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";
import * as bcrypt from "bcryptjs";
import { User } from "./User";
import { MetaColumn } from "./MetaColumn";
import { Meta } from "./Meta";
import { ApiColumn } from "./ApiColumns";
import { HttpClientResponse } from "typed-rest-client/HttpClient";
import { Application } from "./Application";


const API_TABLE_PREFIX = 'api'
export enum HttpMethod {
  GET = "get",
  POST = "post",
  PUT = "put",
  PATCH = "patch",
  DELETE = "delete"
}
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

  @Column({default: "타이틀이 입력되지 않았습니다."})
  @Length(1, 100)
  title: string;

  @Column({
    type: "enum",
    enum: HttpMethod,
    default: HttpMethod.GET
  })
  method: string;

  @Column({type: "text"})
  description: string;

  @Column()
  @Length(1, 100)
  entityName: string; //TODO: 생성시 unique 처리 필요.

  @Column({nullable: true})
  @Length(1, 100)
  tableName: string;

  @Column({nullable: true})
  columnLength: number;

  @Column({nullable: true})
  dataCounts: number;

  @ManyToOne(type => User, user => user.metas, { nullable: true, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(type => Application, app => app.apis, { nullable: true, onDelete: 'CASCADE' })
  application: Application;

  @OneToOne(type => Meta, {nullable: true})
  @JoinColumn()
  meta: Meta;

  @OneToMany(type => ApiColumn, ac => ac.api, {nullable: true})
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

  get endpoint(): string {
    return `/${this.entityName}`;
  }
}
