import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne} from "typeorm";
import { MetaColumn } from "./MetaColumn";


export enum ParamType {
  LESS_THAN="lt",
  LESS_THAN_OR_EQUAL="lte",
  GREATER_THAN="gt",
  GREATER_THAN_OR_EQUAL="gte",
  LIKE="like",
  EQUAL="eq",
  NOT_EQUAT="neq"
}

@Entity()
export class MetaParam {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => MetaColumn, metaColumn => metaColumn.params, { nullable: true, onDelete: 'CASCADE' })
  metaColumn: MetaColumn;

  @Column({
    type: "enum",
    enum: ParamType
  })
  type: ParamType;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
