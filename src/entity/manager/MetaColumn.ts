import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";
import { Meta } from "./Meta";
import { MetaParam } from './MetaParam';

export enum AcceptableType {
  BIGINT="bigint",
  INTEGER = "int",
  DOUBLE = "double",
  BIT = "bit",
  DATE = "date",
  DATETIME = "datetime",
  TIME = "time",
  VARCHAR = "varchar",
  TEXT = "text",
  LONGTEXT = "longtext",
  BOOLEAN = "boolean"
}
@Entity()
export class MetaColumn {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Length(1, 100)
  originalColumnName: string;

  @Column({ nullable: true })
  @Length(4, 100)
  columnName: string;

  @Column({
    type: "enum",
    enum: AcceptableType,
    default: AcceptableType.VARCHAR
  })
  type: AcceptableType;

  @Column({
    type: "enum",
    enum: AcceptableType,
    default: AcceptableType.VARCHAR
  })
  originalType: AcceptableType;

  @Column({ nullable: true })
  size: number;

  @Column({ nullable: true })
  // xlsx 파일에서 column과 순서를 맞추기 위해서 사용
  order: number;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ default: false })
  isSearchable: boolean;

  @ManyToOne(type => Meta, meta => meta.columns, { nullable: true, onDelete: 'CASCADE' })
  meta: Meta;

  @OneToMany(type => MetaParam, mp => mp.metaColumn)
  params: MetaParam[];

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
