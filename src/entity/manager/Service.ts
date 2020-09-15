import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn, Table, Db} from "typeorm";
import { Length, NotContains } from "class-validator";
import { Meta } from "./Meta";
import { Application } from "./Application";
import { Stage } from "./Stage";
import { servicesVersion } from "typescript";

export enum HttpMethod {
  GET = "get",
  POST = "post",
  PUT = "put",
  PATCH = "patch",
  DELETE = "delete"
}

@Entity()
export class Service {

  @PrimaryGeneratedColumn()
  id: number;

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
  @NotContains("-")
  entityName: string; //TODO: 생성시 unique 처리 필요.

  @Column()
  userId: number;

  @OneToOne(type => Meta, meta => meta.service, {nullable: true, onDelete: "SET NULL"})
  @JoinColumn()
  meta: Meta;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;

  get endpoint(): string {
    return `/${this.entityName}`;
  }
}
