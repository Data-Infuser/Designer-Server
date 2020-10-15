import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne, Unique} from "typeorm";
import { MetaColumn } from "./MetaColumn";


export enum ParamOperatorType {
  LESS_THAN="lt",
  LESS_THAN_OR_EQUAL="lte",
  GREATER_THAN="gt",
  GREATER_THAN_OR_EQUAL="gte",
  LIKE="like",
  EQUAL="eq",
  NOT_EQUAT="neq"
}

@Entity()
@Unique("MetaParam_Unique_Per_Column", ["metaColumn", "operator"])
export class MetaParam {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => MetaColumn, metaColumn => metaColumn.params, { nullable: true, onDelete: 'CASCADE' })
  metaColumn: MetaColumn;

  @Column()
  metaColumnId: number;

  @Column({
    type: "enum",
    enum: ParamOperatorType
  })
  operator: ParamOperatorType;

  @Column({ default: ""})
  description: string;

  @Column({ default: false })
  isRequired: boolean;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
