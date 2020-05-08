import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";
import { Meta } from "./Meta";
import { Api } from "./Api";

@Entity()
export class ApiColumn {

  constructor(colunmName?:string, type?:string, api?: Api) {
    if(colunmName) this.columnName = colunmName
    if(type) this.type = type
    if(api) this.api = api
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  @Length(4, 100)
  columnName: string;

  @Column({ default: 'varchar' })
  @Length(1, 30)
  type: string;

  @Column({ default: false })
  hidden: boolean;

  @ManyToOne(type => Api, api => api.columns, { nullable: true, onDelete: 'CASCADE' })
  api: Api;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
