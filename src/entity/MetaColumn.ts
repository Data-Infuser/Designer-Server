import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";
import { Meta } from "./Meta";



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

  @Column({ default: 'varchar' })
  @Length(1, 30)
  type: string;

  @Column({ nullable: true })
  // xlsx 파일에서 column과 순서를 맞추기 위해서 사용
  order: number;

  @ManyToOne(type => Meta, meta => meta.columns, { nullable: true, onDelete: 'CASCADE' })
  meta: Meta;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
